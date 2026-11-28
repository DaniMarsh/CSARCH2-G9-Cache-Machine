import React from 'react';
import type { SimulationConfig, SimulationMetrics } from '../engine/types';

interface ComparisonStatsProps {
  lruMetrics: SimulationMetrics;
  mruMetrics: SimulationMetrics;
  config: SimulationConfig;
  stepLabel: string;
  presentationMode?: boolean;
}

interface MetricRow {
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
  presentationMode = false,
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
    ? 'AMAT tie (0.00 ns)'
    : `${lruLeadsAmat ? 'LRU' : 'MRU'} faster by ${amatDeltaAbs.toFixed(2)} ns AMAT`;

  const rows: MetricRow[] = [
    {
      label: 'Total Memory Access Count',
      lruValue: lruMetrics.totalAccesses.toLocaleString(),
      mruValue: mruMetrics.totalAccesses.toLocaleString(),
      deltaText: hasAccesses ? '0' : '—',
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
        : `${totalTimeDiff < 0 ? 'LRU' : 'MRU'} −${Math.abs(totalTimeDiff).toFixed(2)} ns`,
      winner:
        !hasAccesses || Math.abs(totalTimeDiff) < 1e-9
          ? 'TIE'
          : totalTimeDiff < 0
          ? 'LRU'
          : 'MRU',
    },
  ];

  const lruHitBarPct = Math.min(100, Math.max(0, lruMetrics.hitRate * 100));
  const mruHitBarPct = Math.min(100, Math.max(0, mruMetrics.hitRate * 100));

  return (
    <section
      aria-label="Side-by-Side Comparison Metrics"
      className="sheet rounded-[4px]"
    >
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-rail/70 px-4 py-2.5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <h2 className="text-[13px] font-semibold text-ink-primary">
            Performance Comparison — LRU vs. MRU
          </h2>
          <span className="font-mono text-xs tabular-nums text-ink-muted">{stepLabel}</span>
        </div>

        <span
          className={`font-mono text-xs font-semibold tabular-nums ${
            lruLeadsAmat || mruLeadsAmat ? 'text-status-hit' : 'text-ink-secondary'
          }`}
        >
          {deltaHeadline}
        </span>
      </div>

      {/* Side-by-Side Policy Headers with Hit/Miss Split Bars */}
      <div className="grid grid-cols-1 divide-y divide-border-subtle border-b border-border-subtle sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        {/* LRU Policy Header */}
        <div className="px-4 py-3">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <h3 className="text-[13px] font-semibold text-ink-primary">
                8-Way BSA + LRU
              </h3>
              <p className="text-xs text-ink-muted">Evicts lowest age counter on full set</p>
            </div>
            <div className="text-right font-mono tabular-nums">
              <div
                className={`${
                  presentationMode ? 'text-xl' : 'text-base'
                } font-semibold leading-tight ${
                  lruLeadsAmat ? 'text-status-hit' : 'text-ink-primary'
                }`}
              >
                {lruHitPct}%
              </div>
              <div className="text-[11px] text-ink-muted">
                {lruMetrics.hits} hits / {lruMetrics.misses} misses
              </div>
            </div>
          </div>
          <div
            className="mt-2.5 flex h-1.5 w-full overflow-hidden rounded-[1px] bg-subtle"
            aria-hidden="true"
          >
            <div
              className="h-full bg-status-hit transition-[width] duration-200"
              style={{ width: `${lruHitBarPct}%` }}
            />
            {hasAccesses && (
              <div
                className="h-full bg-status-miss/65 transition-[width] duration-200"
                style={{ width: `${100 - lruHitBarPct}%` }}
              />
            )}
          </div>
        </div>

        {/* MRU Policy Header */}
        <div className="px-4 py-3">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <h3 className="text-[13px] font-semibold text-ink-primary">
                8-Way BSA + MRU
              </h3>
              <p className="text-xs text-ink-muted">Evicts highest age counter on full set</p>
            </div>
            <div className="text-right font-mono tabular-nums">
              <div
                className={`${
                  presentationMode ? 'text-xl' : 'text-base'
                } font-semibold leading-tight ${
                  mruLeadsAmat ? 'text-status-hit' : 'text-ink-primary'
                }`}
              >
                {mruHitPct}%
              </div>
              <div className="text-[11px] text-ink-muted">
                {mruMetrics.hits} hits / {mruMetrics.misses} misses
              </div>
            </div>
          </div>
          <div
            className="mt-2.5 flex h-1.5 w-full overflow-hidden rounded-[1px] bg-subtle"
            aria-hidden="true"
          >
            <div
              className="h-full bg-status-hit transition-[width] duration-200"
              style={{ width: `${mruHitBarPct}%` }}
            />
            {hasAccesses && (
              <div
                className="h-full bg-status-miss/65 transition-[width] duration-200"
                style={{ width: `${100 - mruHitBarPct}%` }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Shared Row-Spine 7-Metric Comparison Table (Metric | LRU | Δ | MRU) */}
      <div className="overflow-x-auto">
        <table
          className={`w-full min-w-[580px] border-collapse text-left ${
            presentationMode ? 'text-sm' : 'text-xs'
          }`}
        >
          <thead className="border-b border-border-subtle bg-canvas/80 text-[11px] font-semibold text-ink-secondary">
            <tr>
              <th scope="col" className="w-[40%] px-4 py-2 font-medium">
                Metric
              </th>
              <th scope="col" className="w-[20%] px-4 py-2 text-right font-medium">
                LRU
              </th>
              <th
                scope="col"
                className="w-[20%] border-x border-border-subtle/70 bg-rail/50 px-3 py-2 text-center font-mono font-medium"
              >
                &Delta;
              </th>
              <th scope="col" className="w-[20%] px-4 py-2 text-right font-medium">
                MRU
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/80">
            {rows.map((row) => (
              <tr key={row.label} className="transition-colors hover:bg-canvas/60">
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
                <td className="border-x border-border-subtle/70 bg-rail/35 px-3 py-2 text-center font-mono text-[11px] tabular-nums text-ink-secondary">
                  {row.deltaText}
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Formula Reference Footer (NLec 24-26) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle bg-canvas/70 px-4 py-2 font-mono text-[11px] tabular-nums text-ink-muted">
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
