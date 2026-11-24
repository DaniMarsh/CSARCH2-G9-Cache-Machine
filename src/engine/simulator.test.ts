import { describe, expect, it } from 'vitest';
import {
  calculateMetrics,
  calculateMissPenalty,
  calculateTotalAccessTime,
  computeAddressPartitioning,
  formatTraceAsText,
  runDualSimulation,
  simulatePolicy,
} from './simulator';
import {
  generateMidRepeatSequence,
  generateRandomSequence,
  generateSequentialSequence,
  parseCustomSequence,
} from './testCases';
import type { SimulationConfig } from './types';

describe('CSARCH2 Cache Simulator Engine — Formulas & Verification', () => {
  it('verifies Non-Load-Through timing formulas (B=2, Tc=1, Tm=10, M=22 ns)', () => {
    const config: SimulationConfig = {
      blockSize: 2,
      cacheBlocks: 16,
      readPolicy: 'non-load-through',
      cacheAccessTime: 1,
      memoryAccessTime: 10,
    };

    const missPenalty = calculateMissPenalty(2, 'non-load-through', 1, 10);
    expect(missPenalty).toBe(22);

    // 4 hits & 8 misses -> AMAT = 15.00 ns, Total = 192 ns
    const m1 = calculateMetrics(4, 8, config);
    expect(m1.missPenalty).toBe(22);
    expect(m1.amat).toBeCloseTo(15.0, 6);
    expect(m1.totalAccessTime).toBe(192);

    // 5 hits & 7 misses -> AMAT = 13.25 ns, Total = 171 ns
    const m2 = calculateMetrics(5, 7, config);
    expect(m2.missPenalty).toBe(22);
    expect(m2.amat).toBeCloseTo(13.25, 6);
    expect(m2.totalAccessTime).toBe(171);
  });

  it('verifies Load-Through miss penalty (M = 11 ns for Tc=1, Tm=10) and Total Access Time', () => {
    const missPenalty = calculateMissPenalty(16, 'load-through', 1, 10);
    expect(missPenalty).toBe(11);

    // Load-Through Total: (hits * B * Tc) + (misses * (Tc + B * Tm))
    // hits=4, misses=8, B=2, Tc=1, Tm=10 -> (4*2*1) + (8*(1 + 20)) = 8 + 168 = 176
    const total = calculateTotalAccessTime(4, 8, 2, 'load-through', 1, 10);
    expect(total).toBe(176);
  });

  it('computes 8-Way BSA address partitioning correctly', () => {
    // n = 16 -> 2 sets (1 set bit), B = 16 -> 4 word bits, 1024*16 = 16384 -> 14 total bits, tag = 9 bits
    const part = computeAddressPartitioning(16, 16);
    expect(part.numSets).toBe(2);
    expect(part.wordBits).toBe(4);
    expect(part.setBits).toBe(1);
    expect(part.totalAddressBits).toBe(14);
    expect(part.tagBits).toBe(9);

    // n = 8 -> 1 set (0 set bits), B = 2 -> 1 word bit, 1024*2 = 2048 -> 11 total bits, tag = 10 bits
    const partMin = computeAddressPartitioning(2, 8);
    expect(partMin.numSets).toBe(1);
    expect(partMin.setBits).toBe(0);
    expect(partMin.wordBits).toBe(1);
    expect(partMin.totalAddressBits).toBe(11);
    expect(partMin.tagBits).toBe(10);
  });

  it('fills ways 0..7 sequentially and evicts lowest age for LRU vs highest age for MRU', () => {
    // n = 8 -> 1 set of 8 ways.
    // Fill blocks 0..7 (ages 1..8 in ways 0..7).
    // Access block 0 (Hit -> Way 0 age becomes 9).
    // Now ages in set 0: Way0(blk0)=9, Way1(blk1)=2, Way2(blk2)=3, ..., Way7(blk7)=8.
    // Access block 8 (Miss, full set):
    //   - LRU must evict smallest age -> Way 1 (block 1, age 2)
    //   - MRU must evict largest age  -> Way 0 (block 0, age 9)
    const config: SimulationConfig = {
      blockSize: 16,
      cacheBlocks: 8,
      readPolicy: 'non-load-through',
      cacheAccessTime: 1,
      memoryAccessTime: 10,
    };

    const seq = [0, 1, 2, 3, 4, 5, 6, 7, 0, 8];
    const dual = runDualSimulation(seq, config);

    // First 8 accesses fill ways 0..7 sequentially without eviction
    for (let i = 0; i < 8; i++) {
      expect(dual.lru.steps[i].outcome).toBe('MISS');
      expect(dual.lru.steps[i].action).toBe('COLD_LOAD');
      expect(dual.lru.steps[i].wayIndex).toBe(i);
      expect(dual.lru.steps[i].evictedBlock).toBeNull();
      expect(dual.lru.steps[i].evictedAge).toBeNull();
    }

    // Step 9 (index 8): block 0 is a HIT at Way 0, age updated 1 -> 9
    expect(dual.lru.steps[8].outcome).toBe('HIT');
    expect(dual.lru.steps[8].action).toBe('HIT');
    expect(dual.lru.steps[8].wayIndex).toBe(0);
    expect(dual.lru.steps[8].previousAge).toBe(1);
    expect(dual.lru.steps[8].age).toBe(9);
    expect(dual.mru.steps[8].outcome).toBe('HIT');
    expect(dual.mru.steps[8].action).toBe('HIT');
    expect(dual.mru.steps[8].wayIndex).toBe(0);
    expect(dual.mru.steps[8].previousAge).toBe(1);
    expect(dual.mru.steps[8].age).toBe(9);

    // Step 10 (index 9): block 8 is a MISS
    // LRU evicts block 1 (Way 1, smallest age = 2)
    expect(dual.lru.steps[9].outcome).toBe('MISS');
    expect(dual.lru.steps[9].action).toBe('EVICT');
    expect(dual.lru.steps[9].wayIndex).toBe(1);
    expect(dual.lru.steps[9].evictedBlock).toBe(1);
    expect(dual.lru.steps[9].evictedAge).toBe(2);

    // MRU evicts block 0 (Way 0, largest age = 9)
    expect(dual.mru.steps[9].outcome).toBe('MISS');
    expect(dual.mru.steps[9].action).toBe('EVICT');
    expect(dual.mru.steps[9].wayIndex).toBe(0);
    expect(dual.mru.steps[9].evictedBlock).toBe(0);
    expect(dual.mru.steps[9].evictedAge).toBe(9);
  });

  it('verifies 8-Way BSA multi-set mapping (setIndex = block % numSets, tag = floor(block / numSets))', () => {
    const config: SimulationConfig = {
      blockSize: 16,
      cacheBlocks: 16, // 2 sets
      readPolicy: 'non-load-through',
      cacheAccessTime: 1,
      memoryAccessTime: 10,
    };

    const res = simulatePolicy([5, 10, 5], config, 'LRU');
    expect(res.steps[0]).toMatchObject({ blockAddress: 5, setIndex: 1, tag: 2, outcome: 'MISS' });
    expect(res.steps[1]).toMatchObject({ blockAddress: 10, setIndex: 0, tag: 5, outcome: 'MISS' });
    expect(res.steps[2]).toMatchObject({ blockAddress: 5, setIndex: 1, tag: 2, outcome: 'HIT' });
  });

  it('verifies Mid-Repeat test case generator against n = 4 reference sequence', () => {
    const expected = [
      0, 1, 2, 3,
      0, 1, 2, 3, 4, 5, 6, 7,
      0, 1, 2, 3, 4, 5, 6, 7,
      3, 2, 1, 0,
      7, 6, 5, 4, 3, 2, 1, 0,
      7, 6, 5, 4, 3, 2, 1, 0,
    ];
    expect(generateMidRepeatSequence(4)).toEqual(expected);
  });

  it('verifies Sequential, Random (seeded), and Custom Sequence parsers', () => {
    const seq = generateSequentialSequence(8);
    expect(seq).toHaveLength(32);
    expect(seq.slice(0, 16)).toEqual(seq.slice(16, 32));

    const r1 = generateRandomSequence(42, 64);
    const r2 = generateRandomSequence(42, 64);
    expect(r1).toHaveLength(64);
    expect(r1).toEqual(r2);
    expect(r1.every((v) => v >= 0 && v <= 1023)).toBe(true);

    expect(parseCustomSequence('0, 1 2, 1023')).toEqual({
      valid: true,
      sequence: [0, 1, 2, 1023],
    });
    expect(parseCustomSequence('0, 1024').valid).toBe(false);
    expect(parseCustomSequence('0, abc').valid).toBe(false);
    expect(parseCustomSequence('-1, 2').valid).toBe(false);
    expect(parseCustomSequence('   ').valid).toBe(false);
    expect(parseCustomSequence(Array.from({ length: 2049 }, () => '0').join(' ')).valid).toBe(false);
  });

  it('confirms MRU outperforms LRU on looping Sequential (2n repeated twice) at n = 8', () => {
    const config: SimulationConfig = {
      blockSize: 16,
      cacheBlocks: 8,
      readPolicy: 'non-load-through',
      cacheAccessTime: 1,
      memoryAccessTime: 10,
    };
    const seq = generateSequentialSequence(8); // [0..15, 0..15] = 32 accesses
    const dual = runDualSimulation(seq, config);

    // LRU thrashes completely on 2n loop (0 hits, 32 misses)
    expect(dual.lru.finalMetrics.hits).toBe(0);
    expect(dual.lru.finalMetrics.misses).toBe(32);

    // MRU retains blocks 0..6 in Ways 0..6 and block 15 in Way 7 across pass 1 -> 8 hits on pass 2 (0..6 + 15)
    expect(dual.mru.finalMetrics.hits).toBe(8);
    expect(dual.mru.finalMetrics.misses).toBe(24);
    expect(dual.mru.finalMetrics.amat).toBeLessThan(dual.lru.finalMetrics.amat);
  });

  it('enforces parameter, timing, and block-range validation guards', () => {
    expect(() => computeAddressPartitioning(1, 8)).toThrow();
    expect(() => computeAddressPartitioning(6, 8)).toThrow();
    expect(() => computeAddressPartitioning(16, 4)).toThrow();
    expect(() => computeAddressPartitioning(16, 12)).toThrow();
    expect(() => calculateMissPenalty(16, 'non-load-through', -1, 10)).toThrow();
    expect(() => calculateTotalAccessTime(1, 1, 16, 'load-through', 1, -5)).toThrow();

    const validConfig: SimulationConfig = {
      blockSize: 16,
      cacheBlocks: 8,
      readPolicy: 'non-load-through',
      cacheAccessTime: 1,
      memoryAccessTime: 10,
    };
    expect(() => simulatePolicy([1024], validConfig, 'LRU')).toThrow();
    expect(() => simulatePolicy([-1], validConfig, 'MRU')).toThrow();
  });

  it('formats plain-text trace export with header, summary metrics, and step rows', () => {
    const config: SimulationConfig = {
      blockSize: 16,
      cacheBlocks: 16,
      readPolicy: 'load-through',
      cacheAccessTime: 1,
      memoryAccessTime: 10,
    };
    const dual = runDualSimulation([0, 2, 0], config);
    const txt = formatTraceAsText(dual.lru, config, dual.partitioning);
    expect(txt).toContain('8-Way BSA + LRU');
    expect(txt).toContain('Load-Through');
    expect(txt).toContain('Step | Seq (MM Block) | Set | Tag | Hit / Miss | Way | Evicted Block | Age');
    expect(txt).toContain('HIT');
  });
});
