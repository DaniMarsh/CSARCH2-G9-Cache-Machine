import type {
  AddressPartitioning,
  CacheLine,
  CacheStepSnapshot,
  DualSimulationResult,
  PolicySimulationResult,
  ReadPolicy,
  ReplacementPolicy,
  SimulationConfig,
  SimulationMetrics,
} from './types';

/** Fixed Main Memory size: 1024 blocks (indices 0..1023) */
export const MAIN_MEMORY_BLOCKS = 1024;

/** Fixed associativity for Machine 9: 8-Way Block Set Associative (BSA) */
export const WAYS = 8;

export const VALID_BLOCK_SIZES = [2, 4, 8, 16, 32, 64] as const;
export const VALID_CACHE_BLOCKS = [8, 16, 32, 64, 128] as const;

function isPowerOfTwo(value: number): boolean {
  return Number.isInteger(value) && value > 0 && (value & (value - 1)) === 0;
}

/**
 * Validates simulation parameters and computes 8-Way BSA address partitioning:
 * - numSets          = n / 8
 * - wordBits         = log2(B)
 * - setBits          = log2(numSets)
 * - totalAddressBits = log2(1024 * B)
 * - tagBits          = totalAddressBits - setBits - wordBits
 */
export function computeAddressPartitioning(
  blockSize: number,
  cacheBlocks: number
): AddressPartitioning {
  if (!isPowerOfTwo(blockSize) || blockSize < 2) {
    throw new Error(`Block size B must be a power of 2 and >= 2 (received ${blockSize}).`);
  }
  if (!isPowerOfTwo(cacheBlocks) || cacheBlocks < WAYS) {
    throw new Error(
      `Number of cache blocks n must be a power of 2 and >= ${WAYS} for 8-Way BSA (received ${cacheBlocks}).`
    );
  }

  const numSets = cacheBlocks / WAYS;
  const wordBits = Math.log2(blockSize);
  const setBits = Math.log2(numSets);
  const totalAddressBits = Math.log2(MAIN_MEMORY_BLOCKS * blockSize);
  const tagBits = totalAddressBits - setBits - wordBits;

  return {
    mainMemoryBlocks: MAIN_MEMORY_BLOCKS,
    ways: WAYS,
    numSets,
    wordBits,
    setBits,
    tagBits,
    totalAddressBits,
  };
}

/**
 * Computes Miss Penalty M (in ns):
 * - Non-Load-Through: M = Tc + (B * Tm) + Tc
 * - Load-Through:     M = Tc + Tm
 */
export function calculateMissPenalty(
  blockSize: number,
  readPolicy: ReadPolicy,
  cacheAccessTime: number,
  memoryAccessTime: number
): number {
  if (readPolicy === 'non-load-through') {
    return cacheAccessTime + blockSize * memoryAccessTime + cacheAccessTime;
  }
  return cacheAccessTime + memoryAccessTime;
}

/**
 * Computes Total Memory Access Time (Block-Level Word Access) in ns:
 * - Non-Load-Through: (hits * B * Tc) + (misses * B * (Tm + Tc)) + (misses * Tc)
 * - Load-Through:     (hits * B * Tc) + (misses * (Tc + B * Tm))
 */
export function calculateTotalAccessTime(
  hits: number,
  misses: number,
  blockSize: number,
  readPolicy: ReadPolicy,
  cacheAccessTime: number,
  memoryAccessTime: number
): number {
  const hitContribution = hits * blockSize * cacheAccessTime;

  if (readPolicy === 'non-load-through') {
    const missTransferAndRead = misses * blockSize * (memoryAccessTime + cacheAccessTime);
    const missInitialLookup = misses * cacheAccessTime;
    return hitContribution + missTransferAndRead + missInitialLookup;
  }

  const missLoadThrough = misses * (cacheAccessTime + blockSize * memoryAccessTime);
  return hitContribution + missLoadThrough;
}

/**
 * Computes all 7 required cache performance metrics:
 * - Hit Rate h       = hits / totalAccesses
 * - Miss Rate (1-h)  = misses / totalAccesses
 * - Miss Penalty M   = calculateMissPenalty(...)
 * - AMAT             = h * Tc + (1 - h) * M
 * - Total Access Time = calculateTotalAccessTime(...)
 */
export function calculateMetrics(
  hits: number,
  misses: number,
  config: SimulationConfig
): SimulationMetrics {
  const totalAccesses = hits + misses;
  const hitRate = totalAccesses > 0 ? hits / totalAccesses : 0;
  const missRate = totalAccesses > 0 ? misses / totalAccesses : 0;
  const missPenalty = calculateMissPenalty(
    config.blockSize,
    config.readPolicy,
    config.cacheAccessTime,
    config.memoryAccessTime
  );
  const amat =
    totalAccesses > 0
      ? hitRate * config.cacheAccessTime + missRate * missPenalty
      : 0;
  const totalAccessTime = calculateTotalAccessTime(
    hits,
    misses,
    config.blockSize,
    config.readPolicy,
    config.cacheAccessTime,
    config.memoryAccessTime
  );

  return {
    totalAccesses,
    hits,
    misses,
    hitRate,
    missRate,
    missPenalty,
    amat,
    totalAccessTime,
  };
}

function createEmptyCacheState(numSets: number): CacheLine[][] {
  return Array.from({ length: numSets }, () =>
    Array.from({ length: WAYS }, (_, way) => ({
      way,
      valid: false,
      blockAddress: null,
      tag: null,
      age: 0,
    }))
  );
}

function cloneCacheState(state: CacheLine[][]): CacheLine[][] {
  return state.map((set) => set.map((line) => ({ ...line })));
}

/**
 * Runs a complete pre-computed simulation trace for a single replacement policy (LRU or MRU)
 * on an 8-Way Block Set Associative cache.
 *
 * Mapping:
 *   setIndex = blockAddress % numSets
 *   tag      = Math.floor(blockAddress / numSets)
 *
 * Replacement (age-based per set of 8 ways):
 * - Fill invalid/empty ways (Way 0 -> Way 7) sequentially first before evicting.
 * - Increment age counter by 1 on every memory access (1, 2, 3, ...).
 * - On Hit: update matched way's age to current counter.
 * - On Miss (full set):
 *     - LRU: evict the way with the smallest age.
 *     - MRU: evict the way with the largest age.
 */
export function simulatePolicy(
  sequence: number[],
  config: SimulationConfig,
  policy: ReplacementPolicy
): PolicySimulationResult {
  const partitioning = computeAddressPartitioning(config.blockSize, config.cacheBlocks);
  const initialCacheState = createEmptyCacheState(partitioning.numSets);
  const currentCache = cloneCacheState(initialCacheState);
  const steps: CacheStepSnapshot[] = [];

  let hits = 0;
  let misses = 0;
  let ageCounter = 0;

  for (let i = 0; i < sequence.length; i++) {
    const blockAddress = sequence[i];
    if (
      !Number.isInteger(blockAddress) ||
      blockAddress < 0 ||
      blockAddress >= MAIN_MEMORY_BLOCKS
    ) {
      throw new Error(
        `Invalid block address ${blockAddress} at step ${i + 1}. Expected integer in [0, ${MAIN_MEMORY_BLOCKS - 1}].`
      );
    }

    ageCounter += 1;
    const setIndex = blockAddress % partitioning.numSets;
    const tag = Math.floor(blockAddress / partitioning.numSets);
    const targetSet = currentCache[setIndex];

    // 1. Search set for a valid line with matching tag
    const hitIndex = targetSet.findIndex((line) => line.valid && line.tag === tag);

    let outcome: 'HIT' | 'MISS';
    let wayIndex: number;
    let evictedBlock: number | null = null;

    if (hitIndex !== -1) {
      outcome = 'HIT';
      wayIndex = hitIndex;
      targetSet[hitIndex].age = ageCounter;
      hits += 1;
    } else {
      outcome = 'MISS';
      misses += 1;

      // 2. Prefer first empty/invalid way (Way 0..Way 7) sequentially
      const emptyIndex = targetSet.findIndex((line) => !line.valid);
      if (emptyIndex !== -1) {
        wayIndex = emptyIndex;
      } else {
        // 3. Full set eviction: LRU = smallest age, MRU = largest age
        let victimIndex = 0;
        for (let w = 1; w < targetSet.length; w++) {
          if (policy === 'LRU') {
            if (targetSet[w].age < targetSet[victimIndex].age) {
              victimIndex = w;
            }
          } else {
            if (targetSet[w].age > targetSet[victimIndex].age) {
              victimIndex = w;
            }
          }
        }
        wayIndex = victimIndex;
        evictedBlock = targetSet[victimIndex].blockAddress;
      }

      targetSet[wayIndex] = {
        way: wayIndex,
        valid: true,
        blockAddress,
        tag,
        age: ageCounter,
      };
    }

    const stats = calculateMetrics(hits, misses, config);
    steps.push({
      step: i + 1,
      blockAddress,
      setIndex,
      tag,
      outcome,
      wayIndex,
      evictedBlock,
      age: ageCounter,
      cacheState: cloneCacheState(currentCache),
      stats,
    });
  }

  const finalMetrics = calculateMetrics(hits, misses, config);
  return {
    policy,
    steps,
    initialCacheState,
    finalCacheState: cloneCacheState(currentCache),
    finalMetrics,
  };
}

/**
 * Runs both 8-Way BSA + LRU and 8-Way BSA + MRU in parallel on the exact same
 * parameters and memory block sequence.
 */
export function runDualSimulation(
  sequence: number[],
  config: SimulationConfig
): DualSimulationResult {
  const partitioning = computeAddressPartitioning(config.blockSize, config.cacheBlocks);
  const lru = simulatePolicy(sequence, config, 'LRU');
  const mru = simulatePolicy(sequence, config, 'MRU');

  return {
    config,
    partitioning,
    sequence,
    lru,
    mru,
  };
}

/**
 * Formats a policy's execution trace and summary metrics as plain monospace text
 * for raw text viewing and .txt file export.
 */
export function formatTraceAsText(
  result: PolicySimulationResult,
  config: SimulationConfig,
  partitioning: AddressPartitioning
): string {
  const m = result.finalMetrics;
  const policyLabel =
    config.readPolicy === 'non-load-through' ? 'Non-Load-Through' : 'Load-Through';

  const headerLines = [
    `CSARCH2 Cache Memory Simulator (Machine 9) — 8-Way BSA + ${result.policy}`,
    `============================================================================`,
    `Main Memory : ${partitioning.mainMemoryBlocks} blocks (0..${partitioning.mainMemoryBlocks - 1})`,
    `Cache Size  : n = ${config.cacheBlocks} blocks (${partitioning.numSets} sets x ${partitioning.ways} ways)`,
    `Block Size  : B = ${config.blockSize} words`,
    `Address Bits: ${partitioning.totalAddressBits} total [Tag: ${partitioning.tagBits}b | Set: ${partitioning.setBits}b | Word: ${partitioning.wordBits}b]`,
    `Read Policy : ${policyLabel} (Tc = ${config.cacheAccessTime} ns, Tm = ${config.memoryAccessTime} ns, M = ${m.missPenalty.toFixed(2)} ns)`,
    `----------------------------------------------------------------------------`,
    `Summary Metrics:`,
    `  Total Accesses : ${m.totalAccesses}`,
    `  Cache Hits     : ${m.hits} (${(m.hitRate * 100).toFixed(2)}%)`,
    `  Cache Misses   : ${m.misses} (${(m.missRate * 100).toFixed(2)}%)`,
    `  AMAT           : ${m.amat.toFixed(2)} ns`,
    `  Total Time     : ${m.totalAccessTime.toFixed(2)} ns`,
    `----------------------------------------------------------------------------`,
    `Step | Seq (MM Block) | Set | Tag | Hit / Miss | Way | Evicted Block | Age`,
    `-----+----------------+-----+-----+------------+-----+---------------+-----`,
  ];

  const rowLines = result.steps.map((s) => {
    const step = String(s.step).padStart(4, ' ');
    const seq = String(s.blockAddress).padStart(14, ' ');
    const set = String(s.setIndex).padStart(3, ' ');
    const tag = String(s.tag).padStart(3, ' ');
    const outcome = s.outcome.padEnd(10, ' ');
    const way = `W${s.wayIndex}`.padStart(3, ' ');
    const evicted = (s.evictedBlock === null ? '-' : String(s.evictedBlock)).padStart(13, ' ');
    const age = String(s.age).padStart(3, ' ');
    return `${step} | ${seq} | ${set} | ${tag} | ${outcome} | ${way} | ${evicted} | ${age}`;
  });

  return [...headerLines, ...rowLines].join('\n');
}
