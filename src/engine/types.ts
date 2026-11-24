export type ReadPolicy = 'non-load-through' | 'load-through';
export type ReplacementPolicy = 'LRU' | 'MRU';
export type ViewMode = 'step-by-step' | 'snapshot';

export interface SimulationConfig {
  /** Block size B in words (power of 2, minimum 2) */
  blockSize: number;
  /** Number of cache blocks n (power of 2, minimum 8 for 8-Way BSA) */
  cacheBlocks: number;
  /** Read miss handling policy */
  readPolicy: ReadPolicy;
  /** Cache access time Tc in nanoseconds */
  cacheAccessTime: number;
  /** Main memory access time Tm in nanoseconds */
  memoryAccessTime: number;
}

export interface AddressPartitioning {
  mainMemoryBlocks: number;
  ways: number;
  numSets: number;
  wordBits: number;
  setBits: number;
  tagBits: number;
  totalAddressBits: number;
}

export interface CacheLine {
  way: number;
  valid: boolean;
  blockAddress: number | null;
  tag: number | null;
  age: number;
}

export interface SimulationMetrics {
  totalAccesses: number;
  hits: number;
  misses: number;
  /** Hit rate h in [0, 1] */
  hitRate: number;
  /** Miss rate (1 - h) in [0, 1] */
  missRate: number;
  /** Miss penalty M in ns */
  missPenalty: number;
  /** Average Memory Access Time (AMAT) in ns */
  amat: number;
  /** Total Memory Access Time (block-level word access) in ns */
  totalAccessTime: number;
}

export interface CacheStepSnapshot {
  /** 1-indexed step number */
  step: number;
  /** Main memory block address accessed (0..1023) */
  blockAddress: number;
  /** Target cache set index */
  setIndex: number;
  /** Computed tag value */
  tag: number;
  /** Cache lookup result */
  outcome: 'HIT' | 'MISS';
  /** Way index (0..7) that matched or received the loaded block */
  wayIndex: number;
  /** Evicted block address if a full set required replacement, else null */
  evictedBlock: number | null;
  /** Incrementing age timestamp assigned on this access */
  age: number;
  /** Deep-copied snapshot of all sets and ways after this access */
  cacheState: CacheLine[][];
  /** Cumulative performance metrics through this step */
  stats: SimulationMetrics;
}

export interface PolicySimulationResult {
  policy: ReplacementPolicy;
  steps: CacheStepSnapshot[];
  initialCacheState: CacheLine[][];
  finalCacheState: CacheLine[][];
  finalMetrics: SimulationMetrics;
}

export interface DualSimulationResult {
  config: SimulationConfig;
  partitioning: AddressPartitioning;
  sequence: number[];
  lru: PolicySimulationResult;
  mru: PolicySimulationResult;
}
