import React from 'react';
import {
  FastForward,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  AlertCircle,
  Cpu,
  Eye,
  ListOrdered,
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
  ViewMode,
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
  viewMode: ViewMode;
  currentStepIndex: number; // 0 = initial empty state, 1..N = after step k
  isPlaying: boolean;
  playbackSpeedMs: number;
  onConfigChange: (next: SimulationConfig) => void;
  onSelectPreset: (preset: PresetType) => void;
  onRerollRandom: () => void;
  onRawSequenceChange: (val: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onTogglePlay: () => void;
  onStepTo: (stepIndex: number) => void;
  onSpeedChange: (ms: number) => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config,
  partitioning,
  activePreset,
  randomSeed,
  rawSequence,
  sequenceError,
  sequenceLength,
  viewMode,
  currentStepIndex,
  isPlaying,
  playbackSpeedMs,
  onConfigChange,
  onSelectPreset,
  onRerollRandom,
  onRawSequenceChange,
  onViewModeChange,
  onTogglePlay,
  onStepTo,
  onSpeedChange,
}) => {
  const missPenalty = calculateMissPenalty(
    config.blockSize,
    config.readPolicy,
    config.cacheAccessTime,
    config.memoryAccessTime
  );

  const handleNumericTimeChange = (
    field: 'cacheAccessTime' | 'memoryAccessTime',
    value: string
  ) => {
    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed) || parsed < 0) return;
    onConfigChange({ ...config, [field]: parsed });
  };

  return (
    <section
      aria-label="Simulation Configuration"
      className="rounded-lg border border-border-subtle bg-surface shadow-card"
    >
      {/* Top Bar: Section Label + Address Bit Partitioning Breakdown */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle bg-subtle/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-ink-secondary" aria-hidden="true" />
          <h2 className="text-sm font-semibold tracking-tight text-ink-primary">
            Cache Parameters &amp; Workload
          </h2>
        </div>

        {/* Computed Address Partitioning Badge */}
        <div
          className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums"
          aria-label="Address Bit Partitioning"
        >
          <span className="inline-flex items-center gap-1.5 rounded border border-border-subtle bg-surface px-2 py-0.5 text-ink-secondary">
            <Cpu className="h-3.5 w-3.5 text-accent-primary" aria-hidden="true" />
            <span>
              MM: <strong className="text-ink-primary">1024</strong> blks
            </span>
            <span className="text-border-strong">|</span>
            <span>
              <strong className="text-ink-primary">{partitioning.numSets}</strong>{' '}
              {partitioning.numSets === 1 ? 'set' : 'sets'} &times;{' '}
              <strong className="text-ink-primary">8</strong> ways
            </span>
          </span>

          <div className="inline-flex items-center overflow-hidden rounded border border-border-strong bg-surface">
            <span className="border-r border-border-subtle bg-accent-soft/70 px-2 py-0.5 font-medium text-accent-primary">
              Tag {partitioning.tagBits}b
            </span>
            <span className="border-r border-border-subtle bg-status-hit-bg/80 px-2 py-0.5 font-medium text-status-hit">
              Set {partitioning.setBits}b
            </span>
            <span className="border-r border-border-subtle bg-status-miss-bg/80 px-2 py-0.5 font-medium text-status-miss">
              Word {partitioning.wordBits}b
            </span>
            <span className="px-2 py-0.5 text-ink-secondary">
              Total {partitioning.totalAddressBits}b
            </span>
          </div>

          <span className="inline-flex items-center rounded border border-border-subtle bg-surface px-2 py-0.5 text-ink-secondary">
            M = <strong className="ml-1 text-ink-primary">{missPenalty.toFixed(2)} ns</strong>
          </span>
        </div>
      </div>

      {/* Main Controls Grid */}
      <div className="grid grid-cols-1 gap-5 p-4 lg:grid-cols-12">
        {/* Left Column: Hardware & Timing Parameters */}
        <div className="space-y-4 lg:col-span-5">
          <div className="grid grid-cols-2 gap-3">
            {/* Block Size B */}
            <div>
              <label
                htmlFor="block-size-select"
                className="mb-1.5 block text-xs font-medium text-ink-secondary"
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
                className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 font-mono text-sm tabular-nums text-ink-primary transition-colors hover:border-ink-muted"
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
                className="mb-1.5 block text-xs font-medium text-ink-secondary"
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
                className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 font-mono text-sm tabular-nums text-ink-primary transition-colors hover:border-ink-muted"
              >
                {VALID_CACHE_BLOCKS.map((n) => (
                  <option key={n} value={n}>
                    {n} blocks ({n / 8} {n / 8 === 1 ? 'set' : 'sets'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Read Policy Segmented Toggle */}
          <div>
            <span className="mb-1.5 block text-xs font-medium text-ink-secondary">
              Read Miss Policy
            </span>
            <div
              role="radiogroup"
              aria-label="Read Miss Policy"
              className="grid grid-cols-2 gap-1 rounded-md border border-border-subtle bg-subtle p-1"
            >
              {(
                [
                  { id: 'non-load-through', label: 'Non-Load-Through' },
                  { id: 'load-through', label: 'Load-Through' },
                ] as { id: ReadPolicy; label: string }[]
              ).map((option) => {
                const active = config.readPolicy === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => onConfigChange({ ...config, readPolicy: option.id })}
                    className={`rounded px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? 'bg-surface text-ink-primary shadow-sm ring-1 ring-border-subtle'
                        : 'text-ink-secondary hover:text-ink-primary'
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
                className="mb-1.5 block text-xs font-medium text-ink-secondary"
              >
                Cache Access Time (<span className="font-mono">Tc</span>, ns)
              </label>
              <input
                id="tc-input"
                type="number"
                min={0.1}
                step={0.5}
                value={config.cacheAccessTime}
                onChange={(e) => handleNumericTimeChange('cacheAccessTime', e.target.value)}
                className="w-full rounded-md border border-border-strong bg-surface px-3 py-1.5 font-mono text-sm tabular-nums text-ink-primary"
              />
            </div>

            <div>
              <label
                htmlFor="tm-input"
                className="mb-1.5 block text-xs font-medium text-ink-secondary"
              >
                Main Memory Time (<span className="font-mono">Tm</span>, ns)
              </label>
              <input
                id="tm-input"
                type="number"
                min={0.1}
                step={1}
                value={config.memoryAccessTime}
                onChange={(e) => handleNumericTimeChange('memoryAccessTime', e.target.value)}
                className="w-full rounded-md border border-border-strong bg-surface px-3 py-1.5 font-mono text-sm tabular-nums text-ink-primary"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Test Case Presets & Memory Sequence Input */}
        <div className="flex flex-col justify-between space-y-3 lg:col-span-7">
          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-ink-secondary">
                Test Case Presets (scaled to <span className="font-mono">n = {config.cacheBlocks}</span>)
              </span>
              {activePreset === 'random' && (
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-subtle px-2 py-0.5 font-mono text-[11px] tabular-nums text-ink-secondary">
                    Seed: {randomSeed}
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

            <div className="flex flex-wrap gap-1.5">
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
                    onClick={() => onSelectPreset(preset.id)}
                    className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
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
          </div>

          {/* Editable Sequence Textarea */}
          <div className="flex-1">
            <div className="mb-1 flex items-center justify-between">
              <label
                htmlFor="sequence-input"
                className="text-xs font-medium text-ink-secondary"
              >
                Memory Block Sequence (0–1023, comma or space separated)
              </label>
              <span className="font-mono text-[11px] tabular-nums text-ink-muted">
                {sequenceError ? 'Invalid input' : `${sequenceLength} accesses`}
              </span>
            </div>
            <textarea
              id="sequence-input"
              rows={3}
              value={rawSequence}
              onChange={(e) => onRawSequenceChange(e.target.value)}
              spellCheck={false}
              placeholder="e.g. 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1..."
              className={`trace-scroll w-full resize-y rounded-md border bg-surface px-3 py-2 font-mono text-xs leading-relaxed tabular-nums text-ink-primary transition-colors ${
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

      {/* Bottom Bar: View Mode Toggle & Step-by-Step Playback Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle bg-subtle/40 px-4 py-3">
        {/* View Mode Toggle */}
        <div
          role="radiogroup"
          aria-label="Simulation View Mode"
          className="inline-flex rounded-md border border-border-subtle bg-subtle p-0.5"
        >
          <button
            type="button"
            role="radio"
            aria-checked={viewMode === 'step-by-step'}
            onClick={() => onViewModeChange('step-by-step')}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === 'step-by-step'
                ? 'bg-surface text-ink-primary shadow-sm ring-1 ring-border-subtle'
                : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            <ListOrdered className="h-3.5 w-3.5" aria-hidden="true" />
            Step-by-Step Trace
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={viewMode === 'snapshot'}
            onClick={() => onViewModeChange('snapshot')}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === 'snapshot'
                ? 'bg-surface text-ink-primary shadow-sm ring-1 ring-border-subtle'
                : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            Final Memory Snapshot
          </button>
        </div>

        {/* Playback Controls (Active in Step-by-Step Mode) */}
        {viewMode === 'step-by-step' ? (
          <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onStepTo(0)}
                disabled={currentStepIndex === 0}
                aria-label="Reset to initial empty cache"
                title="Reset (Step 0)"
                className="rounded border border-border-strong bg-surface p-1.5 text-ink-primary transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onStepTo(Math.max(0, currentStepIndex - 1))}
                disabled={currentStepIndex === 0}
                aria-label="Previous step"
                title="Step Back"
                className="rounded border border-border-strong bg-surface p-1.5 text-ink-primary transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <SkipBack className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={onTogglePlay}
                disabled={sequenceLength === 0}
                aria-label={isPlaying ? 'Pause playback' : 'Play simulation'}
                className="inline-flex min-w-[82px] items-center justify-center gap-1.5 rounded bg-accent-primary px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-3.5 w-3.5" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" /> Play
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => onStepTo(Math.min(sequenceLength, currentStepIndex + 1))}
                disabled={currentStepIndex >= sequenceLength}
                aria-label="Next step"
                title="Step Forward"
                className="rounded border border-border-strong bg-surface p-1.5 text-ink-primary transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <SkipForward className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onStepTo(sequenceLength)}
                disabled={currentStepIndex >= sequenceLength}
                aria-label="Jump to final step"
                title="Jump to Final"
                className="rounded border border-border-strong bg-surface p-1.5 text-ink-primary transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FastForward className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Scrub Bar */}
            <div className="flex min-w-[180px] max-w-xs flex-1 items-center gap-2">
              <label htmlFor="step-scrubber" className="sr-only">
                Scrub simulation step
              </label>
              <input
                id="step-scrubber"
                type="range"
                min={0}
                max={sequenceLength}
                value={currentStepIndex}
                onChange={(e) => onStepTo(Number.parseInt(e.target.value, 10))}
                className="h-1.5 flex-1 cursor-pointer accent-accent-primary"
              />
              <span className="min-w-[78px] text-right font-mono text-xs tabular-nums text-ink-secondary">
                Step <strong className="text-ink-primary">{currentStepIndex}</strong>/{sequenceLength}
              </span>
            </div>

            {/* Speed Slider */}
            <div className="flex items-center gap-2 border-l border-border-subtle pl-3">
              <label
                htmlFor="speed-slider"
                className="text-xs text-ink-secondary"
              >
                Speed
              </label>
              <input
                id="speed-slider"
                type="range"
                min={100}
                max={1200}
                step={50}
                value={1300 - playbackSpeedMs}
                onChange={(e) => onSpeedChange(1300 - Number.parseInt(e.target.value, 10))}
                className="h-1.5 w-20 cursor-pointer accent-accent-primary"
              />
              <span className="min-w-[46px] font-mono text-[11px] tabular-nums text-ink-muted">
                {playbackSpeedMs}ms
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-ink-secondary">
            Showing final cache state and cumulative metrics after all{' '}
            <span className="font-mono font-semibold tabular-nums text-ink-primary">
              {sequenceLength}
            </span>{' '}
            memory accesses.
          </p>
        )}
      </div>
    </section>
  );
};
