import React from 'react';
import type { CacheLine, CacheStepSnapshot, ReplacementPolicy } from '../engine/types';

interface CacheGridProps {
  policy: ReplacementPolicy;
  cacheState: CacheLine[][];
  activeStep: CacheStepSnapshot | null;
  highlightActive: boolean;
  compact?: boolean;
}

export const CacheGrid: React.FC<CacheGridProps> = ({
  policy,
  cacheState,
  activeStep,
  highlightActive,
  compact = false,
}) => {
  const showStepHighlight = highlightActive && activeStep !== null;
  const gridColsClass = compact
    ? 'grid-cols-[38px_repeat(8,minmax(0,1fr))]'
    : 'grid-cols-[54px_repeat(8,minmax(0,1fr))]';

  return (
    <div
      data-testid={`cache-grid-${policy.toLowerCase()}`}
      className="flex flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-card"
    >
      {/* Grid Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-subtle/60 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${
              policy === 'LRU' ? 'bg-accent-primary' : 'bg-ink-primary'
            }`}
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold tracking-tight text-ink-primary">
            8-Way BSA + {policy}
          </h3>
          {!compact && (
            <span className="text-xs text-ink-muted">
              ({policy === 'LRU' ? 'evicts smallest age' : 'evicts largest age'})
            </span>
          )}
        </div>

        {/* Active Step Status Pill */}
        {showStepHighlight && activeStep ? (
          <div className="flex items-center gap-1.5 font-mono text-[11px] tabular-nums">
            <span className="text-ink-secondary">
              Blk <strong className="text-ink-primary">{activeStep.blockAddress}</strong> &rarr;
              S{activeStep.setIndex} W{activeStep.wayIndex}
            </span>
            {activeStep.action === 'HIT' && (
              <span className="rounded border border-status-hit-border bg-status-hit-bg px-1.5 py-0.5 font-semibold text-status-hit">
                HIT
              </span>
            )}
            {activeStep.action === 'COLD_LOAD' && (
              <span className="rounded border border-status-miss-border bg-status-miss-bg px-1.5 py-0.5 font-semibold text-status-miss">
                LOAD
              </span>
            )}
            {activeStep.action === 'EVICT' && (
              <span className="rounded border border-status-evict-border bg-status-evict-bg px-1.5 py-0.5 font-semibold text-status-evict">
                EVICT {activeStep.evictedBlock}
              </span>
            )}
          </div>
        ) : (
          <span className="font-mono text-[11px] tabular-nums text-ink-muted">
            {cacheState.length} {cacheState.length === 1 ? 'set' : 'sets'} &times; 8 ways
          </span>
        )}
      </div>

      {/* Zero-Clipping Responsive 8-Way Grid */}
      <div className="trace-scroll overflow-x-auto">
        <div className={compact ? 'min-w-[540px]' : 'min-w-[680px]'}>
          {/* Column Header Row */}
          <div
            role="row"
            className={`grid ${gridColsClass} border-b border-border-subtle bg-subtle/40 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-secondary`}
          >
            <div
              role="columnheader"
              className="flex items-center justify-center border-r border-border-subtle py-2"
            >
              Set
            </div>
            {Array.from({ length: 8 }, (_, w) => (
              <div
                key={w}
                role="columnheader"
                className="flex items-center justify-center py-2"
              >
                {compact ? `W${w}` : `Way ${w}`}
              </div>
            ))}
          </div>

          {/* Set Rows */}
          <div className="divide-y divide-border-subtle">
            {cacheState.map((setLines, setIdx) => {
              const isActiveSet = showStepHighlight && activeStep?.setIndex === setIdx;
              return (
                <div
                  key={setIdx}
                  role="row"
                  data-active-set={isActiveSet ? 'true' : 'false'}
                  className={`grid ${gridColsClass} transition-colors ${
                    isActiveSet ? 'bg-accent-soft/45' : 'bg-surface'
                  }`}
                >
                  {/* Set Index Label */}
                  <div
                    role="rowheader"
                    className={`flex items-center justify-center border-r border-border-subtle font-mono text-xs font-semibold tabular-nums ${
                      isActiveSet
                        ? 'border-l-2 border-l-accent-primary bg-accent-soft text-accent-primary'
                        : 'bg-subtle/30 text-ink-secondary'
                    }`}
                  >
                    S{setIdx}
                  </div>

                  {/* 8 Ways */}
                  {setLines.map((line) => {
                    const isActiveCell =
                      isActiveSet && activeStep?.wayIndex === line.way;
                    const isHit = isActiveCell && activeStep?.action === 'HIT';
                    const isEvict = isActiveCell && activeStep?.action === 'EVICT';
                    const isColdLoad = isActiveCell && activeStep?.action === 'COLD_LOAD';

                    let cellClasses =
                      'border border-border-subtle/90 bg-canvas/55 text-ink-muted';
                    if (line.valid) {
                      cellClasses =
                        'border border-border-strong/75 bg-surface text-ink-primary';
                    }
                    if (isHit) {
                      cellClasses =
                        'border-2 border-status-hit bg-status-hit-bg text-ink-primary shadow-sm animate-cell-pulse';
                    } else if (isEvict) {
                      cellClasses =
                        'border-2 border-status-evict bg-status-evict-bg text-ink-primary shadow-sm animate-cell-pulse';
                    } else if (isColdLoad) {
                      cellClasses =
                        'border-2 border-status-miss bg-status-miss-bg text-ink-primary shadow-sm animate-cell-pulse';
                    }

                    return (
                      <div
                        key={line.way}
                        role="gridcell"
                        className={compact ? 'p-1' : 'p-1.5'}
                      >
                        <div
                          className={`flex flex-col justify-between rounded font-mono tabular-nums transition-colors ${
                            compact ? 'min-h-[60px] px-1.5 py-1' : 'min-h-[68px] px-2 py-1.5'
                          } ${cellClasses}`}
                        >
                          {/* Top Row: Valid bit & Age */}
                          <div className="flex items-center justify-between gap-0.5 text-[10px] leading-none">
                            <span
                              className={
                                line.valid
                                  ? 'font-semibold text-ink-secondary'
                                  : 'text-ink-muted'
                              }
                            >
                              V:{line.valid ? '1' : '0'}
                            </span>
                            <span className="truncate text-ink-muted">
                              A:{line.valid ? line.age : 0}
                            </span>
                          </div>

                          {/* Center: MM Block # */}
                          <div
                            className={`my-0.5 truncate text-center font-semibold leading-tight ${
                              compact ? 'text-[11px]' : 'text-xs'
                            }`}
                            title={
                              line.valid && line.blockAddress !== null
                                ? `Main Memory Block ${line.blockAddress}`
                                : 'Empty cache block'
                            }
                          >
                            {line.valid && line.blockAddress !== null
                              ? compact
                                ? `B${line.blockAddress}`
                                : `Blk ${line.blockAddress}`
                              : '—'}
                          </div>

                          {/* Bottom Row: Tag & Transition Badge */}
                          <div className="flex items-center justify-between gap-0.5 text-[10px] leading-none text-ink-secondary">
                            <span className="truncate">
                              {line.valid && line.tag !== null ? `T:${line.tag}` : '—'}
                            </span>
                            {isHit && (
                              <span className="shrink-0 font-bold text-status-hit">
                                HIT
                              </span>
                            )}
                            {isColdLoad && (
                              <span className="shrink-0 font-bold text-status-miss">
                                {compact ? 'LD' : 'LOAD'}
                              </span>
                            )}
                            {isEvict && (
                              <span
                                className="shrink-0 font-bold text-status-evict"
                                title={`Evicted Block ${activeStep?.evictedBlock}`}
                              >
                                &times;{activeStep?.evictedBlock}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
