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
    ? 'grid-cols-[36px_repeat(8,minmax(0,1fr))]'
    : 'grid-cols-[56px_repeat(8,minmax(0,1fr))]';

  return (
    <div
      data-testid={`cache-grid-${policy.toLowerCase()}`}
      className="cache-grid flex flex-col bg-surface"
    >
      {/* Matrix Sub-Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-subtle/45 px-4 py-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2 w-2 shrink-0 rounded-[1px] ${
              policy === 'LRU' ? 'bg-accent-primary' : 'bg-shell'
            }`}
            aria-hidden="true"
          />
          <h3 className="text-xs font-bold uppercase tracking-[0.06em] text-ink-primary">
            8-Way BSA + {policy}
          </h3>
          {!compact && (
            <span className="text-xs text-ink-muted">
              ({policy === 'LRU' ? 'evicts smallest age' : 'evicts largest age'})
            </span>
          )}
        </div>

        {/* Active Step Status Readout */}
        {showStepHighlight && activeStep ? (
          <div className="flex items-center gap-1.5 font-mono text-[11px] tabular-nums">
            <span className="text-ink-secondary">
              Blk <strong className="text-ink-primary">{activeStep.blockAddress}</strong> &rarr;
              S{activeStep.setIndex} W{activeStep.wayIndex}
            </span>
            {activeStep.action === 'HIT' && (
              <span className="rounded-[2px] border border-status-hit-border bg-status-hit-bg px-1.5 py-0.5 font-semibold text-status-hit">
                HIT
              </span>
            )}
            {activeStep.action === 'COLD_LOAD' && (
              <span className="rounded-[2px] border border-status-miss-border bg-status-miss-bg px-1.5 py-0.5 font-semibold text-status-miss">
                LOAD
              </span>
            )}
            {activeStep.action === 'EVICT' && (
              <span className="rounded-[2px] border border-status-evict-border bg-status-evict-bg px-1.5 py-0.5 font-semibold text-status-evict">
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

      {/* Zero-Clipping 8-Way Matrix with Sticky Set Column */}
      <div className="trace-scroll overflow-x-auto">
        <div
          role="grid"
          aria-label={`8-Way Block Set Associative ${policy} Cache Grid`}
          className={compact ? 'min-w-[528px]' : 'min-w-[680px]'}
        >
          {/* Column Header Row */}
          <div
            role="row"
            className={`grid ${gridColsClass} border-b border-border-subtle bg-canvas font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-secondary`}
          >
            <div
              role="columnheader"
              className="sticky left-0 z-10 flex items-center justify-center border-r border-border-subtle bg-subtle py-1.5"
            >
              Set
            </div>
            {Array.from({ length: 8 }, (_, w) => (
              <div
                key={w}
                role="columnheader"
                className="flex items-center justify-center py-1.5"
              >
                {compact ? `W${w}` : `Way ${w}`}
              </div>
            ))}
          </div>

          {/* Set Rows */}
          <div className="divide-y divide-border-subtle">
            {cacheState.map((setLines, setIdx) => {
              const isActiveSet = showStepHighlight && activeStep?.setIndex === setIdx;
              const maxAgeInSet = setLines.reduce(
                (max, line) => (line.valid && line.age > max ? line.age : max),
                0
              );

              return (
                <div
                  key={setIdx}
                  role="row"
                  data-active-set={isActiveSet ? 'true' : 'false'}
                  className={`grid ${gridColsClass} transition-colors ${
                    isActiveSet ? 'bg-accent-soft/55' : 'bg-surface'
                  }`}
                >
                  {/* Sticky Set Index Label */}
                  <div
                    role="rowheader"
                    className={`sticky left-0 z-10 flex items-center justify-center border-r border-border-subtle font-mono text-xs font-semibold tabular-nums ${
                      isActiveSet
                        ? 'bg-accent-soft text-accent-primary'
                        : 'bg-rail text-ink-secondary'
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
                      'border border-border-subtle/85 bg-canvas/70 text-ink-muted';
                    if (line.valid) {
                      cellClasses =
                        'border border-border-strong/80 bg-surface text-ink-primary';
                    }
                    if (isHit) {
                      cellClasses =
                        'border-2 border-status-hit bg-status-hit-bg text-ink-primary stage-cell-hit';
                    } else if (isEvict) {
                      cellClasses =
                        'border-2 border-status-evict bg-status-evict-bg text-ink-primary stage-cell-evict';
                    } else if (isColdLoad) {
                      cellClasses =
                        'border-2 border-status-miss bg-status-miss-bg text-ink-primary stage-cell-load';
                    }

                    const ageRatio =
                      line.valid && maxAgeInSet > 0
                        ? Math.max(8, Math.round((line.age / maxAgeInSet) * 100))
                        : 0;

                    const animKey = isActiveCell
                      ? `${line.way}-step-${activeStep?.step}`
                      : `${line.way}`;

                    return (
                      <div
                        key={line.way}
                        role="gridcell"
                        className={compact ? 'p-[3px]' : 'p-1.5'}
                      >
                        <div
                          key={animKey}
                          className={`relative flex flex-col justify-between overflow-hidden rounded-[2px] font-mono tabular-nums transition-colors ${
                            compact ? 'min-h-[60px] px-1.5 py-1.5' : 'min-h-[68px] px-2.5 py-1.5'
                          } ${cellClasses}`}
                        >
                          {/* Top Row: Valid bit & Age */}
                          <div className="flex items-center justify-between gap-0.5 text-[9.5px] leading-none">
                            <span
                              className={
                                line.valid
                                  ? 'font-semibold text-ink-secondary'
                                  : 'text-ink-muted'
                              }
                            >
                              V:{line.valid ? '1' : '0'}
                            </span>
                            <span className="whitespace-nowrap text-ink-muted">
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

                          {/* Subtle Relative Age Recency Hairline */}
                          {line.valid && (
                            <div
                              aria-hidden="true"
                              className="absolute inset-x-0 bottom-0 h-[2px] bg-subtle"
                            >
                              <div
                                className={
                                  policy === 'LRU'
                                    ? 'h-full bg-accent-primary/60'
                                    : 'h-full bg-shell/60'
                                }
                                style={{ width: `${ageRatio}%` }}
                              />
                            </div>
                          )}
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
