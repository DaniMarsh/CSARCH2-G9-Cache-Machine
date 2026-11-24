import React from 'react';
import { BarChart3 } from 'lucide-react';
import type { SimulationConfig, SimulationMetrics } from '../engine/types';

interface ComparisonStatsProps {
  lruMetrics: SimulationMetrics;
  mruMetrics: SimulationMetrics;
  config: SimulationConfig;
  stepLabel: string;
}

interface MetricRow {
  label: string;
  lruFormatted: string;
  mruFormatted: string;
  lruRaw: number;
  mruRaw: number;
  better: 'higher' | 'lower' | 'neutral';
  deltaText?: string;
}

export const ComparisonStats: React.FC<ComparisonStatsProps> = ({
  lruMetrics,
  mruMetrics,
  config,
  stepLabel,
}) => {
  const rows: MetricRow[] = [
    {
      label: '1. Total Memory Access Count',
      lruFormatted: lruMetrics.totalAccesses.toLocaleString(),
      mruFormatted: mruMetrics.totalAccesses.toLocaleString(),
      lruRaw: lruMetrics.totalAccesses,
      mruRaw: mruMetrics.totalAccesses,
      better: 'neutral',
    },
    {
      label: '2. Cache Hit Count',
      lruFormatted: lruMetrics.hits.toLocaleString(),
      mruFormatted: mruMetrics.hits.toLocaleString(),
      lruRaw: lruMetrics.hits,
      mruRaw: mruMetrics.hits,
      better: 'higher',
      deltaText:
        lruMetrics.hits === mruMetrics.hits
          ? 'Tie'
          : `${lruMetrics.hits > mruMetrics.hits ? 'LRU' : 'MRU'} +${Math.abs(
              lruMetrics.hits - mruMetrics.hits
            )}`,
    },
    {
      label: '3. Cache Miss Count',
      lruFormatted: lruMetrics.misses.toLocaleString(),
      mruFormatted: mruMetrics.misses.toLocaleString(),
      lruRaw: lruMetrics.misses,
      mruRaw: mruMetrics.misses,
      better: 'lower',
    },
    {
      label: '4. Cache Hit Rate',
      lruFormatted: `${(lruMetrics.hitRate * 100).toFixed(2)}%`,
      mruFormatted: `${(mruMetrics.hitRate * 100).toFixed(2)}%`,
      lruRaw: lruMetrics.hitRate,
      mruRaw: mruMetrics.hitRate,
      better: 'higher',
    },
    {
      label: '5. Cache Miss Rate',
      lruFormatted: `${(lruMetrics.missRate * 100).toFixed(2)}%`,
      mruFormatted: `${(mruMetrics.missRate * 100).toFixed(2)}%`,
      lruRaw: lruMetrics.missRate,
      mruRaw: mruMetrics.missRate,
      better: 'lower',
    },
    {
      label: '6. Average Memory Access Time (AMAT)',
      lruFormatted: `${lruMetrics.amat.toFixed(2)} ns`,
      mruFormatted: `${mruMetrics.amat.toFixed(2)} ns`,
      lruRaw: lruMetrics.amat,
      mruRaw: mruMetrics.amat,
      better: 'lower',
      deltaText:
        Math.abs(lruMetrics.amat - mruMetrics.amat) < 0.005
          ? 'Tie'
          : `${lruMetrics.amat < mruMetrics.amat ? 'LRU' : 'MRU'} −${Math.abs(
              lruMetrics.amat - mruMetrics.amat
            ).toFixed(2)} ns`,
    },
    {
      label: '7. Total Memory Access Time',
      lruFormatted: `${lruMetrics.totalAccessTime.toFixed(2)} ns`,
      mruFormatted: `${mruMetrics.totalAccessTime.toFixed(2)} ns`,
      lruRaw: lruMetrics.totalAccessTime,
      mruRaw: mruMetrics.totalAccessTime,
      better: 'lower',
      deltaText:
        Math.abs(lruMetrics.totalAccessTime - mruMetrics.totalAccessTime) < 0.005
          ? 'Tie'
          : `${lruMetrics.totalAccessTime < mruMetrics.totalAccessTime ? 'LRU' : 'MRU'} −${Math.abs(
              lruMetrics.totalAccessTime - mruMetrics.totalAccessTime
            ).toFixed(2)} ns`,
    },
  ];

  const isWinner = (side: 'lru' | 'mru', row: MetricRow): boolean => {
    if (row.better === 'neutral' || lruMetrics.totalAccesses === 0) return false;
    if (Math.abs(row.lruRaw - row.mruRaw) < 1e-9) return false;
    if (row.better === 'higher') {
      return side === 'lru' ? row.lruRaw > row.mruRaw : row.mruRaw > row.lruRaw;
    }
    return side === 'lru' ? row.lruRaw < row.mruRaw : row.mruRaw < row.lruRaw;
  };

  return (
    <section
      aria-label="Side-by-Side Comparison Metrics"
      className="rounded-lg border border-border-subtle bg-surface shadow-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-subtle/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-ink-secondary" aria-hidden="true" />
          <h2 className="text-sm font-semibold tracking-tight text-ink-primary">
            Performance Comparison — 8-Way BSA (LRU vs. MRU)
          </h2>
        </div>
        <span className="rounded border border-border-subtle bg-surface px-2 py-0.5 font-mono text-xs tabular-nums text-ink-secondary">
          {stepLabel}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border-subtle bg-subtle/30 text-xs font-semibold uppercase tracking-wider text-ink-secondary">
              <th scope="col" className="px-4 py-2.5">
                Metric
              </th>
              <th scope="col" className="px-4 py-2.5 text-right">
                8-Way BSA + LRU
              </th>
              <th scope="col" className="px-4 py-2.5 text-right">
                8-Way BSA + MRU
              </th>
              <th scope="col" className="px-4 py-2.5 text-right">
                Advantage
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {rows.map((row) => {
              const lruWins = isWinner('lru', row);
              const mruWins = isWinner('mru', row);

              return (
                <tr key={row.label} className="transition-colors hover:bg-subtle/30">
                  <th
                    scope="row"
                    className="px-4 py-2.5 text-xs font-medium text-ink-primary sm:text-sm"
                  >
                    {row.label}
                  </th>
                  <td
                    className={`px-4 py-2.5 text-right font-mono text-sm tabular-nums ${
                      lruWins
                        ? 'font-semibold text-status-hit'
                        : 'font-medium text-ink-primary'
                    }`}
                  >
                    {row.lruFormatted}
                  </td>
                  <td
                    className={`px-4 py-2.5 text-right font-mono text-sm tabular-nums ${
                      mruWins
                        ? 'font-semibold text-status-hit'
                        : 'font-medium text-ink-primary'
                    }`}
                  >
                    {row.mruFormatted}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-xs tabular-nums text-ink-muted">
                    {row.deltaText ?? '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Concise Formula Reference Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle bg-subtle/30 px-4 py-2 font-mono text-[11px] tabular-nums text-ink-muted">
        <span>
          {config.readPolicy === 'non-load-through'
            ? `Non-Load-Through: M = Tc + (B × Tm) + Tc = ${lruMetrics.missPenalty.toFixed(2)} ns`
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
