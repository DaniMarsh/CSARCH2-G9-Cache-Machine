import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
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
  const [isOpen, setIsOpen] = useState<boolean>(true);
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
    <section
      aria-label="Simulation Configuration"
      className="sheet rounded-[4px]"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle bg-rail/70 px-4 py-2.5">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="config-panel-body"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 text-left text-[13px] font-semibold text-ink-primary transition-colors hover:text-ink-secondary"
        >
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-ink-secondary" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-ink-secondary" aria-hidden="true" />
          )}
          <span>Cache Parameters &amp; Workload</span>
        </button>

        {/* Neutral Hardware Telemetry Summary (No semantic status colors) */}
        <div
          aria-label="Address Bit Partitioning Summary"
          className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs tabular-nums text-ink-secondary"
        >
          <span>
            MM <strong className="font-semibold text-ink-primary">1024</strong> blks
          </span>
          <span className="text-border-strong" aria-hidden="true">/</span>
          <span>
            <strong className="font-semibold text-ink-primary">{partitioning.numSets}</strong>{' '}
            {partitioning.numSets === 1 ? 'set' : 'sets'} &times; 8 ways
          </span>
          <span className="text-border-strong" aria-hidden="true">/</span>
          <span>
            Tag <strong className="font-semibold text-ink-primary">{partitioning.tagBits}b</strong>
            {' · '}
            Set <strong className="font-semibold text-ink-primary">{partitioning.setBits}b</strong>
            {' · '}
            Word <strong className="font-semibold text-ink-primary">{partitioning.wordBits}b</strong>
            {' '}({partitioning.totalAddressBits}b)
          </span>
          <span className="text-border-strong" aria-hidden="true">/</span>
          <span>
            M = <strong className="font-semibold text-ink-primary">{missPenalty.toFixed(2)} ns</strong>
          </span>
        </div>
      </div>

      {/* Collapsible Controls Body */}
      {isOpen && (
        <div
          id="config-panel-body"
          className="grid grid-cols-1 gap-5 p-4 lg:grid-cols-12"
        >
          {/* Left Column: Hardware & Timing Controls */}
          <div className="space-y-3.5 lg:col-span-5">
            <div className="grid grid-cols-2 gap-3">
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
                  className="w-full rounded-[3px] border border-border-strong bg-surface px-2.5 py-1.5 font-mono text-xs tabular-nums text-ink-primary transition-colors hover:border-ink-primary"
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
                  className="w-full rounded-[3px] border border-border-strong bg-surface px-2.5 py-1.5 font-mono text-xs tabular-nums text-ink-primary transition-colors hover:border-ink-primary"
                >
                  {VALID_CACHE_BLOCKS.map((n) => (
                    <option key={n} value={n}>
                      {n} blocks ({n / 8} {n / 8 === 1 ? 'set' : 'sets'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Read Miss Policy Toggle */}
            <div>
              <span className="mb-1 block text-xs font-medium text-ink-secondary">
                Read Miss Policy
              </span>
              <div
                role="radiogroup"
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
                      role="radio"
                      aria-checked={active}
                      title={
                        option.id === 'non-load-through'
                          ? 'Non-Load-Through: M = Tc + (B·Tm) + Tc'
                          : 'Load-Through: M = Tc + Tm'
                      }
                      onClick={() => onConfigChange({ ...config, readPolicy: option.id })}
                      className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        idx > 0 ? 'border-l border-border-strong' : ''
                      } ${
                        active
                          ? 'bg-ink-primary text-surface'
                          : 'bg-surface text-ink-secondary hover:bg-subtle hover:text-ink-primary'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Timing Inputs Tc & Tm */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="tc-input"
                  className="mb-1 block text-xs font-medium text-ink-secondary"
                >
                  Cache Access Time (<span className="font-mono">Tc</span>, ns)
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
                  className={`w-full rounded-[3px] border bg-surface px-2.5 py-1.5 font-mono text-xs tabular-nums text-ink-primary transition-colors ${
                    tcError
                      ? 'border-status-evict bg-status-evict-bg/40'
                      : 'border-border-strong hover:border-ink-primary'
                  }`}
                />
              </div>

              <div>
                <label
                  htmlFor="tm-input"
                  className="mb-1 block text-xs font-medium text-ink-secondary"
                >
                  Main Memory Time (<span className="font-mono">Tm</span>, ns)
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
                  className={`w-full rounded-[3px] border bg-surface px-2.5 py-1.5 font-mono text-xs tabular-nums text-ink-primary transition-colors ${
                    tmError
                      ? 'border-status-evict bg-status-evict-bg/40'
                      : 'border-border-strong hover:border-ink-primary'
                  }`}
                />
              </div>
            </div>

            {(tcError || tmError) && (
              <p role="alert" className="text-xs font-medium text-status-evict">
                {tcError ?? tmError}
              </p>
            )}
          </div>

          {/* Right Column: Presets & Editable Sequence */}
          <div className="flex flex-col space-y-3 lg:col-span-7">
            <div>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-ink-secondary">
                  Test Case Presets (scaled to{' '}
                  <span className="font-mono tabular-nums text-ink-primary">
                    n = {config.cacheBlocks}
                  </span>
                  )
                </span>
                {activePreset === 'random' && (
                  <div className="flex items-center gap-2 font-mono text-xs tabular-nums text-ink-secondary">
                    <span>Seed {randomSeed}</span>
                    <button
                      type="button"
                      onClick={onRerollRandom}
                      className="inline-flex items-center gap-1 rounded-[3px] border border-border-strong bg-surface px-2 py-0.5 font-sans text-xs font-medium text-ink-primary transition-colors hover:bg-subtle"
                    >
                      <RefreshCw className="h-3 w-3" aria-hidden="true" />
                      Re-roll
                    </button>
                  </div>
                )}
              </div>

              <div
                role="group"
                aria-label="Test Case Presets"
                className="flex flex-wrap gap-1.5"
              >
                {(
                  [
                    { id: 'sequential', label: `Sequential (2n×2 = ${4 * config.cacheBlocks})` },
                    { id: 'mid-repeat', label: `Mid-Repeat (${10 * config.cacheBlocks})` },
                    { id: 'random', label: 'Random (64)' },
                    { id: 'custom', label: 'Custom Sequence' },
                  ] as { id: PresetType; label: string }[]
                ).map((preset) => {
                  const active = activePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => handlePresetClick(preset.id)}
                      className={`rounded-[3px] border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? 'border-ink-primary bg-ink-primary text-surface'
                          : 'border-border-strong bg-surface text-ink-secondary hover:border-ink-primary hover:text-ink-primary'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label
                  htmlFor="sequence-input"
                  className="text-xs font-medium text-ink-secondary"
                >
                  Memory Block Sequence (0–1023, comma or space separated)
                </label>
                <span className="font-mono text-xs tabular-nums text-ink-muted">
                  {sequenceError ? 'Invalid input' : `${sequenceLength} accesses`}
                </span>
              </div>
              <textarea
                ref={sequenceInputRef}
                id="sequence-input"
                rows={3}
                value={rawSequence}
                onChange={(e) => onRawSequenceChange(e.target.value)}
                spellCheck={false}
                placeholder="0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1..."
                aria-invalid={sequenceError !== null}
                className={`trace-scroll w-full resize-y rounded-[3px] border bg-surface px-3 py-2 font-mono text-xs leading-relaxed tabular-nums text-ink-primary transition-colors ${
                  sequenceError
                    ? 'border-status-evict bg-status-evict-bg/35'
                    : 'border-border-strong hover:border-ink-primary'
                }`}
              />
              {sequenceError && (
                <p role="alert" className="mt-1 text-xs font-medium text-status-evict">
                  {sequenceError}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
