import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
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
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
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

  const policyLabel =
    config.readPolicy === 'load-through' ? 'Load-Through' : 'Non-Load-Through';

  return (
    <section
      aria-label="Simulation Configuration"
      className="overflow-hidden rounded-lg border border-border-subtle bg-surface"
    >
      {/* Top Bar: Collapsible Title + Live Hardware Telemetry */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-subtle/45 px-4 py-2">
        <button
          type="button"
          aria-expanded={!isCollapsed}
          aria-controls="config-panel-body"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="inline-flex items-center gap-1.5 text-left text-sm font-semibold tracking-tight text-ink-primary transition-colors hover:text-accent-primary"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-ink-secondary" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4 text-ink-secondary" aria-hidden="true" />
          )}
          <SlidersHorizontal className="h-3.5 w-3.5 text-ink-secondary" aria-hidden="true" />
          <span>Parameters &amp; Workload</span>
        </button>

        {/* Inline Telemetry Summary (Always Visible) */}
        <div
          className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] tabular-nums text-ink-secondary"
          aria-label="Address Bit Partitioning Summary"
        >
          <span>
            <strong className="text-ink-primary">{partitioning.numSets}</strong>{' '}
            {partitioning.numSets === 1 ? 'set' : 'sets'} &times;{' '}
            <strong className="text-ink-primary">8</strong>w
          </span>
          <span className="text-border-strong">&middot;</span>
          <span>
            <span className="font-semibold text-accent-primary">Tag {partitioning.tagBits}b</span>
            {' / '}
            <span className="font-semibold text-status-hit">Set {partitioning.setBits}b</span>
            {' / '}
            <span className="font-semibold text-status-miss">Word {partitioning.wordBits}b</span>
            <span className="text-ink-muted"> ({partitioning.totalAddressBits}b)</span>
          </span>
          <span className="text-border-strong">&middot;</span>
          <span>
            M = <strong className="text-ink-primary">{missPenalty.toFixed(2)} ns</strong>
          </span>
          {isCollapsed && (
            <>
              <span className="text-border-strong">&middot;</span>
              <span>
                {policyLabel} &middot; {sequenceLength} accesses
              </span>
            </>
          )}
        </div>
      </div>

      {/* Main Compact Workbench Controls */}
      {!isCollapsed && (
        <div
          id="config-panel-body"
          className="grid grid-cols-1 gap-4 p-3.5 lg:grid-cols-12"
        >
          {/* Left Column: Hardware & Timing Controls */}
          <div className="space-y-3 lg:col-span-5">
            <div className="grid grid-cols-2 gap-2.5">
              {/* Block Size B */}
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
                  className="w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 font-mono text-xs tabular-nums text-ink-primary transition-colors hover:border-ink-muted"
                >
                  {VALID_BLOCK_SIZES.map((b) => (
                    <option key={b} value={b}>
                      {b} words (2^{Math.log2(b)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cache Blocks n */}
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
                  className="w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 font-mono text-xs tabular-nums text-ink-primary transition-colors hover:border-ink-muted"
                >
                  {VALID_CACHE_BLOCKS.map((n) => (
                    <option key={n} value={n}>
                      {n} blocks ({n / 8} {n / 8 === 1 ? 'set' : 'sets'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Read Policy + Tc + Tm on one tight row */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
              <div className="sm:col-span-6">
                <span className="mb-1 block text-xs font-medium text-ink-secondary">
                  Read Miss Policy
                </span>
                <div
                  role="group"
                  aria-label="Read Miss Policy"
                  className="grid grid-cols-2 gap-0.5 rounded-md border border-border-subtle bg-subtle p-0.5"
                >
                  {(
                    [
                      { id: 'non-load-through', label: 'Non-LT' },
                      { id: 'load-through', label: 'Load-Through' },
                    ] as { id: ReadPolicy; label: string }[]
                  ).map((option) => {
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
                        className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                          active
                            ? 'bg-surface text-ink-primary ring-1 ring-border-subtle'
                            : 'text-ink-secondary hover:text-ink-primary'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:col-span-6">
                <div>
                  <label
                    htmlFor="tc-input"
                    className="mb-1 block text-xs font-medium text-ink-secondary"
                  >
                    <span className="font-mono">Tc</span> (ns)
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
                    className={`w-full rounded-md border bg-surface px-2.5 py-1 font-mono text-xs tabular-nums text-ink-primary ${
                      tcError ? 'border-status-evict bg-status-evict-bg/30' : 'border-border-strong'
                    }`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="tm-input"
                    className="mb-1 block text-xs font-medium text-ink-secondary"
                  >
                    <span className="font-mono">Tm</span> (ns)
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
                    className={`w-full rounded-md border bg-surface px-2.5 py-1 font-mono text-xs tabular-nums text-ink-primary ${
                      tmError ? 'border-status-evict bg-status-evict-bg/30' : 'border-border-strong'
                    }`}
                  />
                </div>
              </div>
            </div>

            {(tcError || tmError) && (
              <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-status-evict">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{tcError ?? tmError}</span>
              </p>
            )}
          </div>

          {/* Right Column: Test Case Presets & Memory Sequence Input */}
          <div className="flex flex-col justify-between space-y-2.5 lg:col-span-7 lg:border-l lg:border-border-subtle lg:pl-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Test Case Presets">
                {(
                  [
                    { id: 'sequential', label: `Sequential (2n×2 = ${4 * config.cacheBlocks})` },
                    { id: 'mid-repeat', label: `Mid-Repeat (${10 * config.cacheBlocks})` },
                    { id: 'random', label: 'Random (64)' },
                    { id: 'custom', label: 'Custom' },
                  ] as { id: PresetType; label: string }[]
                ).map((preset) => {
                  const active = activePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => handlePresetClick(preset.id)}
                      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                        active
                          ? 'border-accent-primary bg-accent-soft text-accent-primary'
                          : 'border-border-subtle bg-surface text-ink-secondary hover:border-border-strong hover:bg-hover hover:text-ink-primary'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {activePreset === 'random' && (
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] tabular-nums text-ink-muted">
                    Seed {randomSeed}
                  </span>
                  <button
                    type="button"
                    onClick={onRerollRandom}
                    className="inline-flex items-center gap-1 rounded border border-border-strong bg-surface px-2 py-0.5 text-xs font-medium text-ink-primary transition-colors hover:bg-hover"
                  >
                    <RefreshCw className="h-3 w-3" aria-hidden="true" />
                    Re-roll
                  </button>
                </div>
              )}
            </div>

            {/* Editable Sequence Textarea */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label
                  htmlFor="sequence-input"
                  className="text-xs font-medium text-ink-secondary"
                >
                  Memory Block Sequence (0–1023, comma or space separated)
                </label>
                <span className="font-mono text-[11px] tabular-nums text-ink-muted">
                  {sequenceError ? 'Input error' : `${sequenceLength} accesses`}
                </span>
              </div>
              <textarea
                ref={sequenceInputRef}
                id="sequence-input"
                rows={2}
                value={rawSequence}
                onChange={(e) => onRawSequenceChange(e.target.value)}
                spellCheck={false}
                placeholder="e.g. 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1..."
                aria-invalid={sequenceError !== null}
                className={`trace-scroll w-full resize-y rounded-md border bg-surface px-3 py-1.5 font-mono text-xs leading-relaxed tabular-nums text-ink-primary transition-colors ${
                  sequenceError
                    ? 'border-status-evict bg-status-evict-bg/30'
                    : 'border-border-strong focus:border-accent-primary'
                }`}
              />
              {sequenceError && (
                <p
                  role="alert"
                  className="mt-1 flex items-center gap-1.5 text-xs font-medium text-status-evict"
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{sequenceError}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
