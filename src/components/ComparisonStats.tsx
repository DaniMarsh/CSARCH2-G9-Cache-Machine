import React from 'react';
import { BarChart3, CheckCircle2 } from 'lucide-react';
import type { SimulationConfig, SimulationMetrics } from '../engine/types';

interface ComparisonStatsProps {
  lruMetrics: SimulationMetrics;
  mruMetrics: SimulationMetrics;
  config: SimulationConfig;
  stepLabel: string;
}

interface ComparativeRow {
  label: string;
  lruValue: string;
  mruValue: string;
  deltaText: string;
  winner: 'LRU' | 'MRU' | 'TIE';
}

export const ComparisonStats: React.FC<ComparisonStatsProps> = ({
  lruMetrics,
  mruMetrics,
  config,
  stepLabel,
}) => {
  const hasAccesses = lruMetrics.totalAccesses > 0;
  const amatDiff = lruMetrics.amat - mruMetrics.amat;
  const amatDeltaAbs = Math.abs(amatDiff);
  const hitDiff = lruMetrics.hits - mruMetrics.hits;
  const totalTimeDiff = lruMetrics.totalAccessTime - mruMetrics.totalAccessTime;

  const lruHitPct = (lruMetrics.hitRate * 100).toFixed(2);
  const mruHitPct = (mruMetrics.hitRate * 100).toFixed(2);
  const lruMissPct = (lruMetrics.missRate * 100).toFixed(2);
  const mruMissPct = (mruMetrics.missRate * 100).toFixed(2);

  const lruLeadsAmat = hasAccesses && amatDiff < -1e-9;
  const mruLeadsAmat = hasAccesses && amatDiff > 1e-9;

  const deltaHeadline = !hasAccesses
    ? 'Awaiting trace step'
    : amatDeltaAbs < 0.005
    ? 'AMAT tie (0.00 ns delta)'
    : `${lruLeadsAmat ? 'LRU' : 'MRU'} leads by ${amatDeltaAbs.toFixed(2)} ns AMAT`;

  const formatSigned = (val: number, suffix = '', decimals = 2) => {
    if (!hasAccesses) return '—';
    if (Math.abs(val) < 1e-9) return `0${decimals > 0 ? `.${'0'.repeat(decimals)}` : ''}${suffix}`;
    const sign = val > 0 ? '+' : '−';
    return `${sign}${Math.abs(val).toFixed(decimals)}${suffix}`;
  };

  const rows: ComparativeRow[] = [
    {
      label: 'Total Memory Access Count',
      lruValue: lruMetrics.totalAccesses.toLocaleString(),
      mruValue: mruMetrics.totalAccesses.toLocaleString(),
      deltaText: hasAccesses ? 'Equal' : '—',
      winner: 'TIE',
    },
    {
      label: 'Cache Hit Count',
      lruValue: lruMetrics.hits.toLocaleString(),
      mruValue: mruMetrics.hits.toLocaleString(),
      deltaText: !hasAccesses
        ? '—'
        : hitDiff === 0
        ? '0'
        : `${hitDiff > 0 ? 'LRU' : 'MRU'} +${Math.abs(hitDiff)}`,
      winner: !hasAccesses || hitDiff === 0 ? 'TIE' : hitDiff > 0 ? 'LRU' : 'MRU',
    },
    {
      label: 'Cache Miss Count',
      lruValue: lruMetrics.misses.toLocaleString(),
      mruValue: mruMetrics.misses.toLocaleString(),
      deltaText: !hasAccesses
        ? '—'
        : hitDiff === 0
        ? '0'
        : `${hitDiff > 0 ? 'LRU' : 'MRU'} −${Math.abs(hitDiff)}`,
      winner: !hasAccesses || hitDiff === 0 ? 'TIE' : hitDiff > 0 ? 'LRU' : 'MRU',
    },
    {
      label: 'Cache Hit Rate',
      lruValue: `${lruHitPct}%`,
      mruValue: `${mruHitPct}%`,
      deltaText: !hasAccesses
        ? '—'
        : Math.abs(lruMetrics.hitRate - mruMetrics.hitRate) < 1e-9
        ? '0.00 pp'
        : `${lruMetrics.hitRate > mruMetrics.hitRate ? 'LRU' : 'MRU'} +${(
            Math.abs(lruMetrics.hitRate - mruMetrics.hitRate) * 100
          ).toFixed(2)} pp`,
      winner:
        !hasAccesses || Math.abs(lruMetrics.hitRate - mruMetrics.hitRate) < 1e-9
          ? 'TIE'
          : lruMetrics.hitRate > mruMetrics.hitRate
          ? 'LRU'
          : 'MRU',
    },
    {
      label: 'Cache Miss Rate',
      lruValue: `${lruMissPct}%`,
      mruValue: `${mruMissPct}%`,
      deltaText: !hasAccesses
        ? '—'
        : Math.abs(lruMetrics.missRate - mruMetrics.missRate) < 1e-9
        ? '0.00 pp'
        : `${lruMetrics.missRate < mruMetrics.missRate ? 'LRU' : 'MRU'} −${(
            Math.abs(lruMetrics.missRate - mruMetrics.missRate) * 100
          ).toFixed(2)} pp`,
      winner:
        !hasAccesses || Math.abs(lruMetrics.missRate - mruMetrics.missRate) < 1e-9
          ? 'TIE'
          : lruMetrics.missRate < mruMetrics.missRate
          ? 'LRU'
          : 'MRU',
    },
    {
      label: 'Average Memory Access Time (AMAT)',
      lruValue: `${lruMetrics.amat.toFixed(2)} ns`,
      mruValue: `${mruMetrics.amat.toFixed(2)} ns`,
      deltaText: !hasAccesses
        ? '—'
        : amatDeltaAbs < 1e-9
        ? '0.00 ns'
        : `${lruLeadsAmat ? 'LRU' : 'MRU'} −${amatDeltaAbs.toFixed(2)} ns`,
      winner: lruLeadsAmat ? 'LRU' : mruLeadsAmat ? 'MRU' : 'TIE',
    },
    {
      label: 'Total Memory Access Time',
      lruValue: `${lruMetrics.totalAccessTime.toFixed(2)} ns`,
      mruValue: `${mruMetrics.totalAccessTime.toFixed(2)} ns`,
      deltaText: !hasAccesses
        ? '—'
        : Math.abs(totalTimeDiff) < 1e-9
        ? '0.00 ns'
        : `${totalTimeDiff < 0 ? 'LRU' : 'MRU'} ${formatSigned(
            -Math.abs(totalTimeDiff),
            ' ns',
            2
          )}`,
      winner:
        !hasAccesses || Math.abs(totalTimeDiff) < 1e-9
          ? 'TIE'
          : totalTimeDiff < 0
          ? 'LRU'
          : 'MRU',
    },
  ];

  return (
    <section
      aria-label="Side-by-Side Comparison Metrics"
      className="overflow-hidden rounded-lg border border-border-subtle bg-surface"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-subtle/45 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-ink-secondary" aria-hidden="true" />
          <h2 className="text-sm font-semibold tracking-tight text-ink-primary">
            Performance Comparison — LRU vs. MRU
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 font-mono text-[11px] tabular-nums">
          <span
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-semibold ${
              lruLeadsAmat || mruLeadsAmat
                ? 'border border-status-hit-border bg-status-hit-bg text-status-hit'
                : 'text-ink-secondary'
            }`}
          >
            {(lruLeadsAmat || mruLeadsAmat) && (
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
            )}
            {deltaHeadline}
          </span>
          <span className="text-border-strong">&middot;</span>
          <span className="text-ink-secondary">{stepLabel}</span>
        </div>
      </div>

      {/* Hit Rate Visual Ratio Strip */}
      <div className="grid grid-cols-1 gap-3 border-b border-border-subtle bg-canvas/50 px-4 py-2.5 sm:grid-cols-2">
        <div className="space-y-1">
          <div className="flex items-center justify-between font-mono text-[11px] tabular-nums">
            <span className="inline-flex items-center gap-1.5 font-semibold text-ink-primary">
              <span className="h-2 w-2 rounded-full bg-accent-primary" aria-hidden="true" />
              LRU Hit Rate
            </span>
            <span className={lruLeadsAmat ? 'font-semibold text-status-hit' : 'text-ink-secondary'}>
              {lruHitPct}% ({lruMetrics.hits}/{lruMetrics.totalAccesses})
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-subtle" aria-hidden="true">
            <div
              className="h-full bg-accent-primary transition-all duration-200"
              style={{ width: `${Math.min(100, Math.max(0, lruMetrics.hitRate * 100))}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between font-mono text-[11px] tabular-nums">
            <span className="inline-flex items-center gap-1.5 font-semibold text-ink-primary">
              <span className="h-2 w-2 rounded-full bg-ink-primary" aria-hidden="true" />
              MRU Hit Rate
            </span>
            <span className={mruLeadsAmat ? 'font-semibold text-status-hit' : 'text-ink-secondary'}>
              {mruHitPct}% ({mruMetrics.hits}/{mruMetrics.totalAccesses})
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-subtle" aria-hidden="true">
            <div
              className="h-full bg-ink-primary transition-all duration-200"
              style={{ width: `${Math.min(100, Math.max(0, mruMetrics.hitRate * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Unified 7-Metric Comparative Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px] border-collapse text-left text-xs">
          <thead className="border-b border-border-subtle bg-subtle/30 font-mono text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">
            <tr>
              <th scope="col" className="px-4 py-2">
                Metric
              </th>
              <th scope="col" className="px-4 py-2 text-right">
                8-Way BSA + LRU
              </th>
              <th scope="col" className="px-4 py-2 text-right">
                8-Way BSA + MRU
              </th>
              <th scope="col" className="px-4 py-2 text-right">
                Advantage / Delta
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/80">
            {rows.map((row) => (
              <tr key={row.label} className="transition-colors hover:bg-subtle/30">
                <th scope="row" className="px-4 py-2 font-medium text-ink-secondary">
                  {row.label}
                </th>
                <td
                  className={`px-4 py-2 text-right font-mono tabular-nums ${
                    row.winner === 'LRU'
                      ? 'font-semibold text-status-hit'
                      : 'font-medium text-ink-primary'
                  }`}
                >
                  {row.lruValue}
                </td>
                <td
                  className={`px-4 py-2 text-right font-mono tabular-nums ${
                    row.winner === 'MRU'
                      ? 'font-semibold text-status-hit'
                      : 'font-medium text-ink-primary'
                  }`}
                >
                  {row.mruValue}
                </td>
                <td className="px-4 py-2 text-right font-mono text-[11px] tabular-nums text-ink-muted">
                  {row.deltaText}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Integrated Formula Reference Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle bg-subtle/35 px-4 py-2 font-mono text-[11px] tabular-nums text-ink-muted">
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
