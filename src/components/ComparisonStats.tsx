import React from 'react';
import { BarChart3, CheckCircle2 } from 'lucide-react';
import type {
  ReplacementPolicy,
  SimulationConfig,
  SimulationMetrics,
} from '../engine/types';

interface ComparisonStatsProps {
  lruMetrics: SimulationMetrics;
  mruMetrics: SimulationMetrics;
  config: SimulationConfig;
  stepLabel: string;
}

interface PolicyCardProps {
  policy: ReplacementPolicy;
  subtitle: string;
  metrics: SimulationMetrics;
  opponent: SimulationMetrics;
}

const PolicyStatsCard: React.FC<PolicyCardProps> = ({
  policy,
  subtitle,
  metrics,
  opponent,
}) => {
  const hasAccesses = metrics.totalAccesses > 0;
  const leadsAmat = hasAccesses && metrics.amat + 1e-9 < opponent.amat;
  const leadsHitRate = hasAccesses && metrics.hitRate > opponent.hitRate + 1e-9;
  const hitPct = (metrics.hitRate * 100).toFixed(2);
  const missPct = (metrics.missRate * 100).toFixed(2);

  const ledgerRows: {
    index: string;
    label: string;
    value: string;
    highlight?: boolean;
  }[] = [
    {
      index: '01',
      label: 'Total Memory Access Count',
      value: metrics.totalAccesses.toLocaleString(),
    },
    {
      index: '02',
      label: 'Cache Hit Count',
      value: metrics.hits.toLocaleString(),
      highlight: hasAccesses && metrics.hits > opponent.hits,
    },
    {
      index: '03',
      label: 'Cache Miss Count',
      value: metrics.misses.toLocaleString(),
      highlight: hasAccesses && metrics.misses < opponent.misses,
    },
    {
      index: '04',
      label: 'Cache Hit Rate',
      value: `${hitPct}%`,
      highlight: leadsHitRate,
    },
    {
      index: '05',
      label: 'Cache Miss Rate',
      value: `${missPct}%`,
      highlight: leadsHitRate,
    },
    {
      index: '06',
      label: 'Average Memory Access Time (AMAT)',
      value: `${metrics.amat.toFixed(2)} ns`,
      highlight: leadsAmat,
    },
    {
      index: '07',
      label: 'Total Memory Access Time',
      value: `${metrics.totalAccessTime.toFixed(2)} ns`,
      highlight: hasAccesses && metrics.totalAccessTime + 1e-9 < opponent.totalAccessTime,
    },
  ];

  return (
    <article
      aria-label={`8-Way BSA ${policy} Statistics`}
      className="flex flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-card"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border-subtle bg-subtle/50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              policy === 'LRU' ? 'bg-accent-primary' : 'bg-ink-primary'
            }`}
            aria-hidden="true"
          />
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-ink-primary">
              8-Way BSA + {policy}
            </h3>
            <p className="text-[11px] text-ink-muted">{subtitle}</p>
          </div>
        </div>

        {leadsAmat && (
          <span className="inline-flex items-center gap-1 rounded border border-status-hit-border bg-status-hit-bg px-2 py-0.5 font-mono text-[11px] font-semibold text-status-hit">
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            Lower AMAT
          </span>
        )}
      </div>

      {/* Headline KPI Strip */}
      <div className="grid grid-cols-3 divide-x divide-border-subtle border-b border-border-subtle bg-canvas/40">
        <div className="px-3.5 py-2.5">
          <p className="text-[11px] font-medium text-ink-muted">Hit Rate</p>
          <p
            className={`mt-0.5 font-mono text-lg font-semibold tabular-nums ${
              leadsHitRate ? 'text-status-hit' : 'text-ink-primary'
            }`}
          >
            {hitPct}%
          </p>
        </div>
        <div className="px-3.5 py-2.5">
          <p className="text-[11px] font-medium text-ink-muted">AMAT</p>
          <p
            className={`mt-0.5 font-mono text-lg font-semibold tabular-nums ${
              leadsAmat ? 'text-status-hit' : 'text-ink-primary'
            }`}
          >
            {metrics.amat.toFixed(2)}
            <span className="ml-0.5 text-xs font-normal text-ink-muted">ns</span>
          </p>
        </div>
        <div className="px-3.5 py-2.5">
          <p className="text-[11px] font-medium text-ink-muted">Total Time</p>
          <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-ink-primary">
            {metrics.totalAccessTime.toFixed(1)}
            <span className="ml-0.5 text-xs font-normal text-ink-muted">ns</span>
          </p>
        </div>
      </div>

      {/* Thin Hit/Miss Ratio Bar */}
      <div className="h-1.5 w-full bg-subtle" aria-hidden="true">
        <div
          className="h-full bg-status-hit transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, metrics.hitRate * 100))}%` }}
        />
      </div>

      {/* Full 7-Metric Tabular Ledger */}
      <dl className="divide-y divide-border-subtle/80 text-xs">
        {ledgerRows.map((row) => (
          <div
            key={row.index}
            className="flex items-center justify-between gap-3 px-4 py-2 transition-colors hover:bg-subtle/30"
          >
            <dt className="flex items-center gap-2 text-ink-secondary">
              <span className="font-mono text-[10px] text-ink-muted">{row.index}</span>
              <span>{row.label}</span>
            </dt>
            <dd
              className={`font-mono text-xs tabular-nums ${
                row.highlight
                  ? 'font-semibold text-status-hit'
                  : 'font-medium text-ink-primary'
              }`}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
};

export const ComparisonStats: React.FC<ComparisonStatsProps> = ({
  lruMetrics,
  mruMetrics,
  config,
  stepLabel,
}) => {
  const amatDelta = Math.abs(lruMetrics.amat - mruMetrics.amat);
  const deltaSummary =
    lruMetrics.totalAccesses === 0
      ? 'Awaiting trace step'
      : amatDelta < 0.005
      ? 'AMAT Tie (0.00 ns delta)'
      : `${lruMetrics.amat < mruMetrics.amat ? 'LRU' : 'MRU'} faster by ${amatDelta.toFixed(
          2
        )} ns AMAT`;

  return (
    <section aria-label="Side-by-Side Comparison Metrics" className="space-y-3">
      {/* Section Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-ink-secondary" aria-hidden="true" />
          <h2 className="text-sm font-semibold tracking-tight text-ink-primary">
            Performance Metrics — 8-Way BSA (LRU vs. MRU)
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-xs tabular-nums">
          <span className="rounded border border-border-subtle bg-surface px-2.5 py-0.5 text-ink-secondary">
            {deltaSummary}
          </span>
          <span className="rounded border border-border-subtle bg-subtle px-2.5 py-0.5 text-ink-primary">
            {stepLabel}
          </span>
        </div>
      </div>

      {/* Side-by-Side Policy Telemetry Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PolicyStatsCard
          policy="LRU"
          subtitle="Evicts lowest age counter on full set"
          metrics={lruMetrics}
          opponent={mruMetrics}
        />
        <PolicyStatsCard
          policy="MRU"
          subtitle="Evicts highest age counter on full set"
          metrics={mruMetrics}
          opponent={lruMetrics}
        />
      </div>

      {/* Formula Ledger */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border-subtle bg-surface px-4 py-2 font-mono text-[11px] tabular-nums text-ink-muted">
        <span>
          {config.readPolicy === 'non-load-through'
            ? `Non-Load-Through: M = Tc + (B·Tm) + Tc = ${lruMetrics.missPenalty.toFixed(2)} ns`
            : `Load-Through: M = Tc + Tm = ${lruMetrics.missPenalty.toFixed(2)} ns`}
        </span>
        <span>AMAT = h·Tc + (1 − h)·M</span>
        <span>
          {config.readPolicy === 'non-load-through'
            ? 'Total = (H·B·Tc) + (Ms·B·(Tm+Tc)) + (Ms·Tc)'
            : 'Total = (H·B·Tc) + (Ms·(Tc + B·Tm))'}
        </span>
      </div>
    </section>
  );
};
