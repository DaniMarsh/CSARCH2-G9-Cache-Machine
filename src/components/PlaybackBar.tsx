import React from 'react';
import {
  FastForward,
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
  hasSequenceError?: boolean;
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
  hasSequenceError = false,
  onViewModeChange,
  onTogglePlay,
  onStepTo,
  onSpeedChange,
}) => {
  const progressPct =
    sequenceLength > 0 ? Math.round((currentStepIndex / sequenceLength) * 100) : 0;

  return (
    <div aria-label="Simulation Playback Controls" className="bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
        {viewMode === 'step-by-step' ? (
          <>
            {/* Unified Instrument Transport Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center overflow-hidden rounded-[3px] border border-border-strong bg-surface">
                <button
                  type="button"
                  onClick={() => onStepTo(0)}
                  disabled={currentStepIndex === 0}
                  aria-label="Reset to step 0"
                  title="Reset (R)"
                  className="inline-flex h-9 w-9 items-center justify-center bg-surface text-ink-primary transition-colors hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onStepTo(Math.max(0, currentStepIndex - 1))}
                  disabled={currentStepIndex === 0}
                  aria-label="Previous step"
                  title="Previous Step (Left Arrow)"
                  className="inline-flex h-9 w-9 items-center justify-center border-l border-border-subtle bg-surface text-ink-primary transition-colors hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <SkipBack className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={onTogglePlay}
                  disabled={sequenceLength === 0}
                  aria-label={isPlaying ? 'Pause playback' : 'Play simulation'}
                  title="Play / Pause (Space)"
                  className="inline-flex h-9 min-w-[84px] items-center justify-center gap-1.5 border-l border-ink-primary bg-ink-primary px-3 text-xs font-semibold text-surface transition-colors hover:bg-ink-secondary disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Play</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onStepTo(Math.min(sequenceLength, currentStepIndex + 1))}
                  disabled={currentStepIndex >= sequenceLength}
                  aria-label="Next step"
                  title="Next Step (Right Arrow)"
                  className="inline-flex h-9 w-9 items-center justify-center border-l border-border-subtle bg-surface text-ink-primary transition-colors hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onStepTo(sequenceLength)}
                  disabled={currentStepIndex >= sequenceLength}
                  aria-label="Jump to final step"
                  title="Jump to Final Step"
                  className="inline-flex h-9 w-9 items-center justify-center border-l border-border-subtle bg-surface text-ink-primary transition-colors hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <FastForward className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>

              {hasSequenceError && (
                <span
                  role="status"
                  className="font-mono text-xs font-medium text-status-evict"
                >
                  Showing last valid sequence
                </span>
              )}
            </div>

            {/* Calibrated Step Scrubber + Pace Fader */}
            <div className="flex flex-1 flex-wrap items-center justify-end gap-4">
              <div className="flex min-w-[200px] max-w-md flex-1 items-center gap-3">
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
                  className="bench-range flex-1"
                />
                <span className="min-w-[88px] text-right font-mono text-xs tabular-nums text-ink-secondary">
                  Step <strong className="font-semibold text-ink-primary">{currentStepIndex}</strong>/
                  {sequenceLength}
                </span>
              </div>

              <div className="flex items-center gap-2 border-l border-border-subtle pl-3">
                <label
                  htmlFor="speed-slider"
                  className="text-xs font-medium text-ink-secondary"
                >
                  Pace
                </label>
                <input
                  id="speed-slider"
                  type="range"
                  min={100}
                  max={1200}
                  step={50}
                  value={1300 - playbackSpeedMs}
                  onChange={(e) => onSpeedChange(1300 - Number.parseInt(e.target.value, 10))}
                  className="bench-range w-24"
                />
                <span className="min-w-[46px] text-right font-mono text-xs tabular-nums text-ink-muted">
                  {playbackSpeedMs}ms
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-secondary">
              <strong className="font-semibold text-ink-primary">Final Snapshot</strong>
              <span className="text-border-strong">&middot;</span>
              <span>
                Settled cache state after all{' '}
                <strong className="font-mono font-semibold tabular-nums text-ink-primary">
                  {sequenceLength}
                </strong>{' '}
                memory accesses (LRU &amp; MRU).
              </span>
            </div>

            <div className="flex items-center gap-3">
              {hasSequenceError && (
                <span
                  role="status"
                  className="font-mono text-xs font-medium text-status-evict"
                >
                  Showing last valid sequence
                </span>
              )}
              <button
                type="button"
                onClick={() => onViewModeChange('step-by-step')}
                className="rounded-[3px] border border-border-strong bg-surface px-2.5 py-1 text-xs font-medium text-ink-primary transition-colors hover:bg-subtle"
              >
                Switch to Step-by-Step
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Synchronized Progress Hairline */}
      {viewMode === 'step-by-step' && (
        <div className="h-[2px] w-full bg-subtle" aria-hidden="true">
          <div
            className="h-full bg-ink-primary transition-[width] duration-150 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </div>
  );
};
