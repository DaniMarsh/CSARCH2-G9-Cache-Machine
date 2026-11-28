import { MAIN_MEMORY_BLOCKS } from './simulator';

/**
 * Generates Sequential (2n repeated twice):
 * [0 .. 2n-1] repeated twice -> total 4n accesses.
 */
export function generateSequentialSequence(n: number): number[] {
  const half: number[] = [];
  for (let i = 0; i < 2 * n; i++) {
    half.push(i % MAIN_MEMORY_BLOCKS);
  }
  return [...half, ...half];
}

/**
 * Generates Mid-Repeat sequence:
 * 1. [0 .. n-1]
 * 2. [0 .. 2n-1] repeated twice
 * 3. [n-1 .. 0]
 * 4. [2n-1 .. 0] repeated twice
 *
 * Example for n = 4:
 * 0,1,2,3, 0,1,2,3,4,5,6,7, 0,1,2,3,4,5,6,7, 3,2,1,0, 7,6,5,4,3,2,1,0, 7,6,5,4,3,2,1,0
 */
export function generateMidRepeatSequence(n: number): number[] {
  const ascN: number[] = [];
  for (let i = 0; i < n; i++) ascN.push(i % MAIN_MEMORY_BLOCKS);

  const asc2N: number[] = [];
  for (let i = 0; i < 2 * n; i++) asc2N.push(i % MAIN_MEMORY_BLOCKS);

  const descN: number[] = [];
  for (let i = n - 1; i >= 0; i--) descN.push(i % MAIN_MEMORY_BLOCKS);

  const desc2N: number[] = [];
  for (let i = 2 * n - 1; i >= 0; i--) desc2N.push(i % MAIN_MEMORY_BLOCKS);

  return [...ascN, ...asc2N, ...asc2N, ...descN, ...desc2N, ...desc2N];
}

/**
 * Deterministic Mulberry32 PRNG for reproducible random test cases.
 */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates `count` (default 64) reproducible random block addresses in [0, 1023].
 */
export function generateRandomSequence(seed: number, count = 64): number[] {
  const rand = mulberry32(seed);
  const seq: number[] = [];
  for (let i = 0; i < count; i++) {
    seq.push(Math.floor(rand() * MAIN_MEMORY_BLOCKS));
  }
  return seq;
}

export const MAX_SEQUENCE_LENGTH = 2048;

export interface ParsedSequenceResult {
  valid: boolean;
  sequence: number[];
  error?: string;
}

/**
 * Parses comma- or whitespace-separated memory block indices.
 * Enforces integer values within [0, 1023] and a responsive length cap.
 */
export function parseCustomSequence(raw: string): ParsedSequenceResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      valid: false,
      sequence: [],
      error: 'Enter at least one block address between 0 and 1023.',
    };
  }

  const tokens = trimmed.split(/[\s,]+/).filter(Boolean);
  if (tokens.length > MAX_SEQUENCE_LENGTH) {
    return {
      valid: false,
      sequence: [],
      error: `Sequence exceeds maximum of ${MAX_SEQUENCE_LENGTH.toLocaleString()} accesses (received ${tokens.length.toLocaleString()}). Trim the sequence to keep simulation responsive.`,
    };
  }

  const sequence: number[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!/^-?\d+$/.test(token)) {
      return {
        valid: false,
        sequence: [],
        error: `Invalid token "${token}" at position ${i + 1}. Only integers (0–1023) are allowed.`,
      };
    }
    const value = Number.parseInt(token, 10);
    if (value < 0 || value >= MAIN_MEMORY_BLOCKS) {
      return {
        valid: false,
        sequence: [],
        error: `Block address ${value} at position ${i + 1} is out of range (valid: 0 to ${MAIN_MEMORY_BLOCKS - 1}).`,
      };
    }
    sequence.push(value);
  }

  return { valid: true, sequence };
}
