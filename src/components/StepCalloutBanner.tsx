import React from 'react';
import type { CacheStepSnapshot, ReplacementPolicy } from '../engine/types';

interface StepCalloutBannerProps {
  lruStep: CacheStepSnapshot | null;
  mruStep: CacheStepSnapshot | null;
  totalSteps: number;
  nextBlockPreview: number | null;
  presentationMode?: boolean;
}

function describeDecision(step: CacheStepSnapshot, policy: ReplacementPolicy): string {
  if (step.action === 'HIT') {
    return `Matched Tag ${step.tag} in Way ${step.wayIndex}; age ${
      step.previousAge ?? 0
    } → ${step.age}.`;
  }
  if (step.action === 'COLD_LOAD') {
    return `Empty slot — loaded Block ${step.blockAddress} into Way ${step.wayIndex} (age ${step.age}).`;
  }
  const criterion = policy === 'LRU' ? 'smallest age' : 'largest age';
  return `Set ${step.setIndex} full — evicted Block ${step.evictedBlock} (${criterion} ${
    step.evictedAge ?? '?'
  }) in Way ${step.wayIndex}, loaded Block ${step.blockAddress}.`;
}

function actionDisplay(action: CacheStepSnapshot['action']): {
  label: string;
  textClass: string;
} {
  if (action === 'HIT') {
    return { label: 'HIT', textClass: 'text-status-hit' };
  }
  if (action === 'COLD_LOAD') {
    return { label: 'MISS · LOAD', textClass: 'text-status-miss' };
  }
  return { label: 'MISS · EVICT', textClass: 'text-status-evict' };
}

export const StepCalloutBanner: React.FC<StepCalloutBannerProps> = ({
  lruStep,
  mruStep,
  totalSteps,
  nextBlockPreview,
  presentationMode = false,
}) => {
  const diverged =
    lruStep !== null &&
    mruStep !== null &&
    (lruStep.action !== mruStep.action ||
      lruStep.wayIndex !== mruStep.wayIndex ||
      lruStep.evictedBlock !== mruStep.evictedBlock);

  const lruInfo = lruStep ? actionDisplay(lruStep.action) : null;
  const mruInfo = mruStep ? actionDisplay(mruStep.action) : null;

  return (
    <div
      aria-label="Current Step Explanation"
      aria-live="polite"
      className="border-t border-border-subtle bg-surface"
    >
      {!lruStep || !mruStep ? (
        <div
          className={`flex flex-wrap items-center justify-between gap-2 bg-canvas/50 px-4 py-2 text-ink-secondary ${
            presentationMode ? 'text-sm' : 'text-xs'
          }`}
        >
          <span>
            <strong className="font-semibold text-ink-primary">
              Step 0 — Initial Empty Cache.
            </strong>{' '}
            Press <strong className="font-semibold text-ink-primary">Play</strong> or use{' '}
            <kbd className="rounded-[2px] border border-border-strong bg-surface px-1.5 py-0.5 font-mono text-[11px] text-ink-primary">
              Space
            </kbd>{' '}
            /{' '}
            <kbd className="rounded-[2px] border border-border-strong bg-surface px-1.5 py-0.5 font-mono text-[11px] text-ink-primary">
              &rarr;
            </kbd>{' '}
            to step through the trace.
          </span>
          {nextBlockPreview !== null && (
            <span className="font-mono text-xs tabular-nums text-ink-secondary">
              Next &rarr; <strong className="font-semibold text-ink-primary">Block {nextBlockPreview}</strong>
            </span>
          )}
        </div>
      ) : (
        <div>
          {/* Steady Step Context Strip (Never remounts; only values update in place) */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle/80 bg-rail/60 px-4 py-1.5 font-mono text-xs tabular-nums">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
              <strong className="font-semibold text-ink-primary">
                Step {lruStep.step}/{totalSteps}
              </strong>
              <span className="text-border-strong">&middot;</span>
              <span className="text-ink-secondary">
                MM Block <strong className="font-semibold text-ink-primary">{lruStep.blockAddress}</strong>
              </span>
              <span className="text-border-strong">&middot;</span>
              <span className="text-ink-secondary">
                Set <strong className="font-semibold text-ink-primary">{lruStep.setIndex}</strong>
              </span>
              <span className="text-border-strong">&middot;</span>
              <span className="text-ink-secondary">
                Tag <strong className="font-semibold text-ink-primary">{lruStep.tag}</strong>
              </span>
              <span className="text-border-strong">&middot;</span>
              <span className="text-ink-secondary">
                Age <strong className="font-semibold text-ink-primary">{lruStep.age}</strong>
              </span>
            </div>

            {diverged ? (
              <span className="font-sans text-xs font-semibold text-ink-primary">
                Policies diverged
              </span>
            ) : (
              <span className="font-sans text-xs text-ink-muted">
                Identical transition
              </span>
            )}
          </div>

          {/* Synchronized Side-by-Side LRU vs MRU Decision Explanations */}
          <div
            className={`grid grid-cols-1 divide-y divide-border-subtle/80 md:grid-cols-2 md:divide-x md:divide-y-0 ${
              presentationMode ? 'text-sm' : 'text-xs'
            }`}
          >
            <div className="flex items-baseline gap-2.5 px-4 py-2">
              {lruInfo && (
                <span
                  className={`shrink-0 font-mono text-[11px] font-semibold ${lruInfo.textClass}`}
                >
                  LRU &middot; {lruInfo.label}
                </span>
              )}
              <p className="leading-snug text-ink-primary">
                {describeDecision(lruStep, 'LRU')}
              </p>
            </div>

            <div className="flex items-baseline gap-2.5 px-4 py-2">
              {mruInfo && (
                <span
                  className={`shrink-0 font-mono text-[11px] font-semibold ${mruInfo.textClass}`}
                >
                  MRU &middot; {mruInfo.label}
                </span>
              )}
              <p className="leading-snug text-ink-primary">
                {describeDecision(mruStep, 'MRU')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
