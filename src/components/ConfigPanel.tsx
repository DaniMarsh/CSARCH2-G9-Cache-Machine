import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import {
  VALID_BLOCK_SIZES,
  VALID_CACHE_BLOCKS,
  calculateMissPenalty,
} from '../engine/simulator';
import type {
  AddressPartitioning,
  ReadPolicy,
  SimulationConfig,
} from '../engine/types';

export type PresetType = 'sequential' | 'mid-repeat' | 'random' | 'custom';

interface ConfigPanelProps {
  config: SimulationConfig;
  partitioning: AddressPartitioning;
  activePreset: PresetType;
  randomSeed: number;
  rawSequence: string;
  sequenceError: string | null;
  sequenceLength: number;
  onConfigChange: (next: SimulationConfig) => void;
  onSelectPreset: (preset: PresetType) => void;
  onRerollRandom: () => void;
  onRawSequenceChange: (val: string) => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  partitioning,
  activePreset,
  randomSeed,
  rawSequence,
  sequenceError,
  sequenceLength,
  onConfigChange,
  onSelectPreset,
  onRerollRandom,
  onRawSequenceChange,
}) => {
  const [tcDraft, setTcDraft] = useState<string>(String(config.cacheAccessTime));
  const [tmDraft, setTmDraft] = useState<string>(String(config.memoryAccessTime));
  const [tcError, setTcError] = useState<string | null>(null);
  const [tmError, setTmError] = useState<string | null>(null);
  const sequenceInputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setTcDraft(String(config.cacheAccessTime));
    setTcError(null);
  }, [config.cacheAccessTime]);

  useEffect(() => {
    setTmDraft(String(config.memoryAccessTime));
    setTmError(null);
  }, [config.memoryAccessTime]);

  const missPenalty = calculateMissPenalty(
    config.blockSize,
    config.readPolicy,
    config.cacheAccessTime,
    config.memoryAccessTime
  );

  const handleTimingInput = (
    field: 'cacheAccessTime' | 'memoryAccessTime',
    rawValue: string
  ) => {
    const setDraft = field === 'cacheAccessTime' ? setTcDraft : setTmDraft;
    const setErr = field === 'cacheAccessTime' ? setTcError : setTmError;
    const label = field === 'cacheAccessTime' ? 'Tc' : 'Tm';

    setDraft(rawValue);

    const trimmed = rawValue.trim();
    if (trimmed === '') {
      setErr(`Enter a value ≥ 0 ns for ${label}.`);
      return;
    }

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setErr(`${label} must be ≥ 0 ns.`);
      return;
    }

    setErr(null);
    onConfigChange({ ...config, [field]: parsed });
  };

  const handleTimingBlur = (field: 'cacheAccessTime' | 'memoryAccessTime') => {
    if (field === 'cacheAccessTime' && tcError) {
      setTcDraft(String(config.cacheAccessTime));
      setTcError(null);
    }
    if (field === 'memoryAccessTime' && tmError) {
      setTmDraft(String(config.memoryAccessTime));
      setTmError(null);
    }
  };

  const handlePresetClick = (preset: PresetType) => {
    onSelectPreset(preset);
    if (preset === 'custom') {
      window.requestAnimationFrame(() => {
        sequenceInputRef.current?.focus();
      });
    }
  };

  return (
    <aside
      aria-label="Simulation Configuration"
      className="config-rail flex flex-col divide-y divide-border-subtle border-b border-border-subtle bg-rail lg:border-b-0 lg:border-r"
    >
      {/* Section 1: Cache Geometry */}
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">
            Cache Geometry
          </h2>
          <span className="font-mono text-[11px] tabular-nums text-ink-muted">
            {partitioning.numSets} {partitioning.numSets === 1 ? 'set' : 'sets'} &times; 8w
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-1">
          <div>
            <label
              htmlFor="block-size-select"
              className="mb-1 block text-xs font-medium text-ink-secondary"
            >
              Block Size (<span className="font-mono">B</span>, words)
            </label>
            <select
              id="block-size-select"
              value={config.blockSize}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  blockSize: Number.parseInt(e.target.value, 10),
                })
              }
              className="w-full rounded-[3px] border border-border-strong bg-surface px-2.5 py-1.5 font-mono text-xs tabular-nums text-ink-primary transition-colors hover:border-ink-secondary"
            >
              {VALID_BLOCK_SIZES.map((b) => (
                <option key={b} value={b}>
                  {b} words (2^{Math.log2(b)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="cache-blocks-select"
              className="mb-1 block text-xs font-medium text-ink-secondary"
            >
              Cache Blocks (<span className="font-mono">n</span>, min 8)
            </label>
            <select
              id="cache-blocks-select"
              value={config.cacheBlocks}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  cacheBlocks: Number.parseInt(e.target.value, 10),
                })
              }
              className="w-full rounded-[3px] border border-border-strong bg-surface px-2.5 py-1.5 font-mono text-xs tabular-nums text-ink-primary transition-colors hover:border-ink-secondary"
            >
              {VALID_CACHE_BLOCKS.map((n) => (
                <option key={n} value={n}>
                  {n} blocks ({n / 8} {n / 8 === 1 ? 'set' : 'sets'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Inline Bit-Width Breakdown Strip */}
        <div
          aria-label="Address Bit Partitioning Summary"
          className="grid grid-cols-3 divide-x divide-border-subtle rounded-[3px] border border-border-subtle bg-surface font-mono text-[11px] tabular-nums"
        >
          <div className="px-2 py-1.5">
            <span className="block text-[9.5px] uppercase tracking-wider text-ink-muted">Tag</span>
            <strong className="text-accent-primary">{partitioning.tagBits}b</strong>
          </div>
          <div className="px-2 py-1.5">
            <span className="block text-[9.5px] uppercase tracking-wider text-ink-muted">Set</span>
            <strong className="text-status-hit">{partitioning.setBits}b</strong>
          </div>
          <div className="px-2 py-1.5">
            <span className="block text-[9.5px] uppercase tracking-wider text-ink-muted">Word</span>
            <strong className="text-status-miss">{partitioning.wordBits}b</strong>
          </div>
        </div>
      </div>

      {/* Section 2: Read Policy & Timing */}
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">
            Read Policy &amp; Timing
          </h2>
          <span className="font-mono text-[11px] tabular-nums text-ink-primary">
            M = <strong>{missPenalty.toFixed(2)} ns</strong>
          </span>
        </div>

        <div>
          <span className="mb-1 block text-xs font-medium text-ink-secondary">
            Miss Handling Mode
          </span>
          <div
            role="group"
            aria-label="Read Miss Policy"
            className="grid grid-cols-2 overflow-hidden rounded-[3px] border border-border-strong bg-surface"
          >
            {(
              [
                { id: 'non-load-through', label: 'Non-Load-Through' },
                { id: 'load-through', label: 'Load-Through' },
              ] as { id: ReadPolicy; label: string }[]
            ).map((option, idx) => {
              const active = config.readPolicy === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  title={
                    option.id === 'non-load-through'
                      ? 'Non-Load-Through: M = Tc + B·Tm + Tc'
                      : 'Load-Through: M = Tc + Tm'
                  }
                  onClick={() => onConfigChange({ ...config, readPolicy: option.id })}
                  className={`whitespace-nowrap px-1.5 py-1.5 text-[11px] font-medium transition-colors ${
                    idx > 0 ? 'border-l border-border-strong' : ''
                  } ${
                    active
                      ? 'bg-shell text-shell-ink'
                      : 'bg-surface text-ink-secondary hover:bg-hover hover:text-ink-primary'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label
              htmlFor="tc-input"
              className="mb-1 block text-xs font-medium text-ink-secondary"
            >
              Cache <span className="font-mono">Tc</span> (ns)
            </label>
            <input
              id="tc-input"
              type="number"
              min={0}
              step={0.5}
              value={tcDraft}
              onChange={(e) => handleTimingInput('cacheAccessTime', e.target.value)}
              onBlur={() => handleTimingBlur('cacheAccessTime')}
              aria-invalid={tcError !== null}
              className={`w-full rounded-[3px] border bg-surface px-2.5 py-1.5 font-mono text-xs tabular-nums text-ink-primary ${
                tcError ? 'border-status-evict bg-status-evict-bg/40' : 'border-border-strong'
              }`}
            />
          </div>

          <div>
            <label
              htmlFor="tm-input"
              className="mb-1 block text-xs font-medium text-ink-secondary"
            >
              Memory <span className="font-mono">Tm</span> (ns)
            </label>
            <input
              id="tm-input"
              type="number"
              min={0}
              step={1}
              value={tmDraft}
              onChange={(e) => handleTimingInput('memoryAccessTime', e.target.value)}
              onBlur={() => handleTimingBlur('memoryAccessTime')}
              aria-invalid={tmError !== null}
              className={`w-full rounded-[3px] border bg-surface px-2.5 py-1.5 font-mono text-xs tabular-nums text-ink-primary ${
                tmError ? 'border-status-evict bg-status-evict-bg/40' : 'border-border-strong'
              }`}
            />
          </div>
        </div>

        {(tcError || tmError) && (
          <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-status-evict">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{tcError ?? tmError}</span>
          </p>
        )}
      </div>

      {/* Section 3: Workload Sequence & Presets */}
      <div className="flex flex-1 flex-col space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">
            Workload Sequence
          </h2>
          <span className="font-mono text-[11px] tabular-nums text-ink-muted">
            {sequenceError ? 'Input error' : `${sequenceLength} accesses`}
          </span>
        </div>

        <div
          role="group"
          aria-label="Test Case Presets"
          className="grid grid-cols-2 gap-1.5"
        >
          {(
            [
              { id: 'sequential', label: `Sequential (${4 * config.cacheBlocks})` },
              { id: 'mid-repeat', label: `Mid-Repeat (${10 * config.cacheBlocks})` },
              { id: 'random', label: 'Random (64)' },
              { id: 'custom', label: 'Custom Input' },
            ] as { id: PresetType; label: string }[]
          ).map((preset) => {
            const active = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={active}
                onClick={() => handlePresetClick(preset.id)}
                className={`rounded-[3px] border px-2 py-1.5 text-left text-[11px] font-medium transition-colors ${
                  active
                    ? 'border-accent-primary bg-accent-soft text-accent-primary'
                    : 'border-border-subtle bg-surface text-ink-secondary hover:border-border-strong hover:text-ink-primary'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {activePreset === 'random' && (
          <div className="flex items-center justify-between rounded-[3px] border border-border-subtle bg-surface px-2.5 py-1.5">
            <span className="font-mono text-[11px] tabular-nums text-ink-secondary">
              Seed <strong className="text-ink-primary">{randomSeed}</strong>
            </span>
            <button
              type="button"
              onClick={onRerollRandom}
              className="inline-flex items-center gap-1 rounded-[2px] border border-border-strong bg-rail px-2 py-0.5 text-[11px] font-medium text-ink-primary transition-colors hover:bg-hover"
            >
              <RefreshCw className="h-3 w-3" aria-hidden="true" />
              Re-roll
            </button>
          </div>
        )}

        <div className="flex flex-1 flex-col">
          <label
            htmlFor="sequence-input"
            className="mb-1 block text-xs font-medium text-ink-secondary"
          >
            MM Block Indices (0–1023)
          </label>
          <textarea
            ref={sequenceInputRef}
            id="sequence-input"
            rows={4}
            value={rawSequence}
            onChange={(e) => onRawSequenceChange(e.target.value)}
            spellCheck={false}
            placeholder="0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1..."
            aria-invalid={sequenceError !== null}
            className={`trace-scroll w-full flex-1 resize-y rounded-[3px] border bg-surface px-2.5 py-2 font-mono text-xs leading-relaxed tabular-nums text-ink-primary transition-colors ${
              sequenceError
                ? 'border-status-evict bg-status-evict-bg/40'
                : 'border-border-strong focus:border-accent-primary'
            }`}
          />
          {sequenceError && (
            <p
              role="alert"
              className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-status-evict"
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{sequenceError}</span>
            </p>
          )}
        </div>
      </div>
    </aside>
  );
};
