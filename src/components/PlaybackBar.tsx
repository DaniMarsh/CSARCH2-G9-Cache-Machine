import React from 'react';
import {
  AlertTriangle,
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
  onTogglePlay,
  onStepTo,
  onSpeedChange,
}) => {
  return (
    <div
      aria-label="Simulation Playback Controls"
      className="playback-bar flex flex-wrap items-center justify-between gap-3 bg-surface px-4 py-2.5"
    >
      {viewMode === 'step-by-step' ? (
        <>
          {/* Left: Transport Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center overflow-hidden rounded-[3px] border border-border-strong">
              <button
                type="button"
                onClick={() => onStepTo(0)}
                disabled={currentStepIndex === 0}
                aria-label="Reset to step 0"
                title="Reset (R)"
                className="bg-surface px-2 py-1.5 text-ink-primary transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onStepTo(Math.max(0, currentStepIndex - 1))}
                disabled={currentStepIndex === 0}
                aria-label="Previous step"
                title="Previous Step (Left Arrow)"
                className="border-l border-border-subtle bg-surface px-2 py-1.5 text-ink-primary transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <SkipBack className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={onTogglePlay}
                disabled={sequenceLength === 0}
                aria-label={isPlaying ? 'Pause playback' : 'Play simulation'}
                title="Play / Pause (Space)"
                className="inline-flex min-w-[78px] items-center justify-center gap-1.5 border-l border-shell bg-shell px-3 py-1.5 text-xs font-semibold text-shell-ink transition-colors hover:bg-accent-primary disabled:cursor-not-allowed disabled:opacity-40"
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
                className="border-l border-border-subtle bg-surface px-2 py-1.5 text-ink-primary transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <SkipForward className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onStepTo(sequenceLength)}
                disabled={currentStepIndex >= sequenceLength}
                aria-label="Jump to final step"
                title="Jump to Final Step"
                className="border-l border-border-subtle bg-surface px-2 py-1.5 text-ink-primary transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FastForward className="h-3.5 w-3.5" />
              </button>
            </div>

            {hasSequenceError && (
              <span
                role="status"
                className="inline-flex items-center gap-1 rounded-[2px] border border-status-evict-border bg-status-evict-bg px-2 py-1 text-[11px] font-medium text-status-evict"
              >
                <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
                Showing last valid sequence
              </span>
            )}
          </div>

          {/* Right: Calibrated Step Fader + Speed Fader */}
          <div className="flex flex-1 flex-wrap items-center justify-end gap-4">
            <div className="flex min-w-[180px] max-w-md flex-1 items-center gap-2.5">
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
              <span className="min-w-[82px] text-right font-mono text-xs tabular-nums text-ink-secondary">
                Step <strong className="text-ink-primary">{currentStepIndex}</strong>/
                {sequenceLength}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:border-l sm:border-border-subtle sm:pl-3">
              <label htmlFor="speed-slider" className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
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
                className="bench-range w-20"
              />
              <span className="min-w-[44px] text-right font-mono text-[11px] tabular-nums text-ink-secondary">
                {playbackSpeedMs}ms
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-ink-secondary">
            <span className="rounded-[2px] bg-shell px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-shell-ink">
              Final Snapshot
            </span>
            <span>
              Settled cache state after all{' '}
              <strong className="font-mono tabular-nums text-ink-primary">{sequenceLength}</strong>{' '}
              memory accesses. Click the trace ribbon below to inspect any step.
            </span>
          </div>

          {hasSequenceError && (
            <span
              role="status"
              className="inline-flex items-center gap-1 rounded-[2px] border border-status-evict-border bg-status-evict-bg px-2 py-0.5 text-[11px] font-medium text-status-evict"
            >
              <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
              Showing last valid sequence
            </span>
          )}
        </div>
      )}
    </div>
  );
};
