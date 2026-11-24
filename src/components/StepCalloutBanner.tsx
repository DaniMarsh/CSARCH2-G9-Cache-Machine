import React from 'react';
import { ArrowRight, GitCompareArrows } from 'lucide-react';
import type { CacheStepSnapshot, ReplacementPolicy } from '../engine/types';

interface StepCalloutBannerProps {
  lruStep: CacheStepSnapshot | null;
  mruStep: CacheStepSnapshot | null;
  totalSteps: number;
  nextBlockPreview: number | null;
}

function describeDecision(step: CacheStepSnapshot, policy: ReplacementPolicy): string {
  if (step.action === 'HIT') {
    return `Matched Tag ${step.tag} in Way ${step.wayIndex}; age ${
      step.previousAge ?? 0
    } → ${step.age}.`;
  }
  if (step.action === 'COLD_LOAD') {
    return `Empty slot — loaded Blk ${step.blockAddress} into Way ${step.wayIndex} (age ${step.age}).`;
  }
  const criterion = policy === 'LRU' ? 'smallest age' : 'largest age';
  return `Set ${step.setIndex} full — evicted Blk ${step.evictedBlock} (${criterion} ${
    step.evictedAge ?? '?'
  }) in Way ${step.wayIndex}, loaded Blk ${step.blockAddress}.`;
}

function badgeForAction(action: CacheStepSnapshot['action']): {
  label: string;
  classes: string;
} {
  if (action === 'HIT') {
    return {
      label: 'HIT',
      classes: 'border-status-hit-border bg-status-hit-bg text-status-hit',
    };
  }
  if (action === 'COLD_LOAD') {
    return {
      label: 'LOAD',
      classes: 'border-status-miss-border bg-status-miss-bg text-status-miss',
    };
  }
  return {
    label: 'EVICT',
    classes: 'border-status-evict-border bg-status-evict-bg text-status-evict',
  };
}

export const StepCalloutBanner: React.FC<StepCalloutBannerProps> = ({
  lruStep,
  mruStep,
  totalSteps,
  nextBlockPreview,
}) => {
  const diverged =
    lruStep !== null &&
    mruStep !== null &&
    (lruStep.action !== mruStep.action ||
      lruStep.wayIndex !== mruStep.wayIndex ||
      lruStep.evictedBlock !== mruStep.evictedBlock);

  const lruBadge = lruStep ? badgeForAction(lruStep.action) : null;
  const mruBadge = mruStep ? badgeForAction(mruStep.action) : null;

  return (
    <div
      aria-label="Current Step Explanation"
      aria-live="polite"
      className="step-callout border-t border-border-subtle bg-surface"
    >
      {!lruStep || !mruStep ? (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs text-ink-secondary">
          <span>
            <strong className="font-semibold text-ink-primary">
              Step 0 — Initial Empty Cache.
            </strong>{' '}
            Press <strong className="text-ink-primary">Play</strong> or use{' '}
            <kbd className="rounded-[2px] border border-border-strong bg-rail px-1 py-0.5 font-mono text-[10px] text-ink-primary">
              Space
            </kbd>{' '}
            /{' '}
            <kbd className="rounded-[2px] border border-border-strong bg-rail px-1 py-0.5 font-mono text-[10px] text-ink-primary">
              &rarr;
            </kbd>{' '}
            to step through the trace.
          </span>
          {nextBlockPreview !== null && (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] tabular-nums text-ink-secondary">
              Next <ArrowRight className="h-3 w-3 text-ink-muted" aria-hidden="true" />{' '}
              <strong className="text-ink-primary">Block {nextBlockPreview}</strong>
            </span>
          )}
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle/80 bg-subtle/45 px-4 py-1.5 font-mono text-[11px] tabular-nums">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-[2px] bg-shell px-1.5 py-0.5 text-[10px] font-semibold text-shell-ink">
                STEP {lruStep.step}/{totalSteps}
              </span>
              <span className="text-ink-primary">
                MM Block <strong>{lruStep.blockAddress}</strong>
              </span>
              <span className="text-border-strong">&middot;</span>
              <span className="text-ink-secondary">
                Set <strong className="text-ink-primary">{lruStep.setIndex}</strong>
              </span>
              <span className="text-border-strong">&middot;</span>
              <span className="text-ink-secondary">
                Tag <strong className="text-ink-primary">{lruStep.tag}</strong>
              </span>
              <span className="text-border-strong">&middot;</span>
              <span className="text-ink-secondary">
                Age <strong className="text-ink-primary">{lruStep.age}</strong>
              </span>
            </div>

            {diverged ? (
              <span className="inline-flex items-center gap-1 rounded-[2px] border border-accent-border bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent-primary">
                <GitCompareArrows className="h-3 w-3" aria-hidden="true" />
                Policies Diverged
              </span>
            ) : (
              <span className="text-[11px] text-ink-muted">Identical LRU &amp; MRU transition</span>
            )}
          </div>

          <div className="grid grid-cols-1 divide-y divide-border-subtle/80 md:grid-cols-2 md:divide-x md:divide-y-0">
            <div className="flex items-start gap-2 px-4 py-2 text-xs">
              {lruBadge && (
                <span
                  className={`mt-0.5 shrink-0 rounded-[2px] border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${lruBadge.classes}`}
                >
                  LRU &middot; {lruBadge.label}
                </span>
              )}
              <p className="leading-snug text-ink-primary">{describeDecision(lruStep, 'LRU')}</p>
            </div>

            <div className="flex items-start gap-2 px-4 py-2 text-xs">
              {mruBadge && (
                <span
                  className={`mt-0.5 shrink-0 rounded-[2px] border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${mruBadge.classes}`}
                >
                  MRU &middot; {mruBadge.label}
                </span>
              )}
              <p className="leading-snug text-ink-primary">{describeDecision(mruStep, 'MRU')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
