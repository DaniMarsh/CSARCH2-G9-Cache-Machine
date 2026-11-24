import React from 'react';
import {
  Eye,
  FastForward,
  ListOrdered,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import type { ViewMode } from '../engine/types';

interface PlaybackBarProps {
  viewMode: ViewMode;
  currentStepIndex: number;
  sequenceLength: number;
  isPlaying: boolean;
  playbackSpeedMs: number;
  onViewModeChange: (mode: ViewMode) => void;
  onTogglePlay: () => void;
  onStepTo: (stepIndex: number) => void;
  onSpeedChange: (ms: number) => void;
}

export const PlaybackBar: React.FC<PlaybackBarProps> = ({
  viewMode,
  currentStepIndex,
  sequenceLength,
  isPlaying,
  playbackSpeedMs,
  onViewModeChange,
  onTogglePlay,
  onStepTo,
  onSpeedChange,
}) => {
  const progressPct =
    sequenceLength > 0 ? Math.round((currentStepIndex / sequenceLength) * 100) : 0;

  return (
    <section
      aria-label="Simulation Playback Controls"
      className="rounded-lg border border-border-subtle bg-surface shadow-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
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

        {/* Synchronized Transport Controls */}
        {viewMode === 'step-by-step' ? (
          <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onStepTo(0)}
                disabled={currentStepIndex === 0}
                aria-label="Reset to step 0"
                title="Reset (R)"
                className="rounded border border-border-strong bg-surface p-1.5 text-ink-primary transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onStepTo(Math.max(0, currentStepIndex - 1))}
                disabled={currentStepIndex === 0}
                aria-label="Previous step"
                title="Previous Step (Left Arrow)"
                className="rounded border border-border-strong bg-surface p-1.5 text-ink-primary transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <SkipBack className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={onTogglePlay}
                disabled={sequenceLength === 0}
                aria-label={isPlaying ? 'Pause playback' : 'Play simulation'}
                title="Play / Pause (Space)"
                className="inline-flex min-w-[84px] items-center justify-center gap-1.5 rounded bg-accent-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
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
                title="Next Step (Right Arrow)"
                className="rounded border border-border-strong bg-surface p-1.5 text-ink-primary transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <SkipForward className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onStepTo(sequenceLength)}
                disabled={currentStepIndex >= sequenceLength}
                aria-label="Jump to final step"
                title="Jump to Final Step"
                className="rounded border border-border-strong bg-surface p-1.5 text-ink-primary transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FastForward className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Timeline Scrubber */}
            <div className="flex min-w-[190px] max-w-sm flex-1 items-center gap-2.5">
              <label htmlFor="step-scrubber" className="sr-only">
                Timeline scrubber
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
              <span className="min-w-[82px] text-right font-mono text-xs tabular-nums text-ink-secondary">
                Step <strong className="text-ink-primary">{currentStepIndex}</strong>/{sequenceLength}
              </span>
            </div>

            {/* Speed Slider */}
            <div className="flex items-center gap-2 border-l border-border-subtle pl-3">
              <label htmlFor="speed-slider" className="text-xs text-ink-secondary">
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
            Instant Final Snapshot across all{' '}
            <span className="font-mono font-semibold tabular-nums text-ink-primary">
              {sequenceLength}
            </span>{' '}
            memory accesses (LRU &amp; MRU).
          </p>
        )}
      </div>

      {/* Subtle Synchronized Progress Hairline (Step-by-Step Mode) */}
      {viewMode === 'step-by-step' && (
        <div className="h-1 w-full overflow-hidden rounded-b-lg bg-subtle" aria-hidden="true">
          <div
            className="h-full bg-accent-primary transition-all duration-200 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </section>
  );
};
