import React from 'react';
import { ArrowRight, GitCompareArrows, Info } from 'lucide-react';
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
    return `Matched Tag ${step.tag} in Way ${step.wayIndex}; age updated ${
      step.previousAge ?? 0
    } → ${step.age}.`;
  }
  if (step.action === 'COLD_LOAD') {
    return `Empty slot available — loaded Block ${step.blockAddress} into Way ${step.wayIndex} (age ${step.age}).`;
  }
  const criterion = policy === 'LRU' ? 'smallest age' : 'largest age';
  return `Set ${step.setIndex} full — evicted Block ${step.evictedBlock} (${criterion} ${
    step.evictedAge ?? '?'
  }) in Way ${step.wayIndex}, loaded Block ${step.blockAddress}.`;
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
      label: 'MISS · LOAD',
      classes: 'border-status-miss-border bg-status-miss-bg text-status-miss',
    };
  }
  return {
    label: 'MISS · EVICT',
    classes: 'border-status-evict-border bg-status-evict-bg text-status-evict',
  };
}

export const StepCalloutBanner: React.FC<StepCalloutBannerProps> = ({
  lruStep,
  mruStep,
  totalSteps,
  nextBlockPreview,
}) => {
  // Calm opening state at Step 0
  if (!lruStep || !mruStep) {
    return (
      <section
        aria-label="Current Step Explanation"
        aria-live="polite"
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface px-4 py-3 shadow-card"
      >
        <div className="flex items-center gap-2.5 text-xs text-ink-secondary">
          <Info className="h-4 w-4 shrink-0 text-accent-primary" aria-hidden="true" />
          <span>
            <strong className="font-semibold text-ink-primary">Step 0 — Initial Empty Cache.</strong>{' '}
            All ways have <span className="font-mono">V:0</span>. Press{' '}
            <span className="font-semibold text-ink-primary">Play</span> or{' '}
            <span className="font-semibold text-ink-primary">Next</span> (or{' '}
            <kbd className="rounded border border-border-strong bg-subtle px-1 py-0.5 font-mono text-[10px]">
              Space
            </kbd>{' '}
            /{' '}
            <kbd className="rounded border border-border-strong bg-subtle px-1 py-0.5 font-mono text-[10px]">
              &rarr;
            </kbd>
            ) to step through the trace.
          </span>
        </div>
        {nextBlockPreview !== null && (
          <span className="inline-flex items-center gap-1 rounded border border-border-subtle bg-subtle px-2.5 py-1 font-mono text-[11px] tabular-nums text-ink-primary">
            Next <ArrowRight className="h-3 w-3 text-ink-muted" aria-hidden="true" /> Block{' '}
            <strong>{nextBlockPreview}</strong>
          </span>
        )}
      </section>
    );
  }

  const diverged =
    lruStep.action !== mruStep.action ||
    lruStep.wayIndex !== mruStep.wayIndex ||
    lruStep.evictedBlock !== mruStep.evictedBlock;

  const lruBadge = badgeForAction(lruStep.action);
  const mruBadge = badgeForAction(mruStep.action);

  return (
    <section
      key={`callout-step-${lruStep.step}`}
      aria-label="Current Step Explanation"
      aria-live="polite"
      className="stage-banner-settle overflow-hidden rounded-lg border border-border-strong bg-surface shadow-card"
    >
      {/* Top Context Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-subtle/50 px-4 py-2 font-mono text-xs tabular-nums">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-ink-primary px-2 py-0.5 text-[11px] font-semibold text-white">
            STEP {lruStep.step}/{totalSteps}
          </span>
          <span className="text-ink-primary">
            Access <strong>MM Block {lruStep.blockAddress}</strong>
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
          <span className="inline-flex items-center gap-1 rounded border border-accent-primary/30 bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-primary">
            <GitCompareArrows className="h-3 w-3" aria-hidden="true" />
            Policies Diverged
          </span>
        ) : (
          <span className="text-[11px] text-ink-muted">Identical LRU &amp; MRU transition</span>
        )}
      </div>

      {/* Concise LRU vs MRU Reasoning Row */}
      <div className="grid grid-cols-1 divide-y divide-border-subtle md:grid-cols-2 md:divide-x md:divide-y-0">
        <div className="flex items-start gap-2.5 px-4 py-2.5 text-xs">
          <span
            className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${lruBadge.classes}`}
          >
            LRU &middot; {lruBadge.label}
          </span>
          <p className="leading-relaxed text-ink-primary">{describeDecision(lruStep, 'LRU')}</p>
        </div>

        <div className="flex items-start gap-2.5 px-4 py-2.5 text-xs">
          <span
            className={`mt-0.5 shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${mruBadge.classes}`}
          >
            MRU &middot; {mruBadge.label}
          </span>
          <p className="leading-relaxed text-ink-primary">{describeDecision(mruStep, 'MRU')}</p>
        </div>
      </div>
    </section>
  );
};
