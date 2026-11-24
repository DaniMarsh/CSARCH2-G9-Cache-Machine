import React from 'react';
import type { CacheLine, CacheStepSnapshot, ReplacementPolicy } from '../engine/types';

interface CacheGridProps {
  policy: ReplacementPolicy;
  cacheState: CacheLine[][];
  activeStep: CacheStepSnapshot | null;
  highlightActive: boolean;
}

export const CacheGrid: React.FC<CacheGridProps> = ({
  policy,
  cacheState,
  activeStep,
  highlightActive,
}) => {
  const showStepHighlight = highlightActive && activeStep !== null;

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-card">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-subtle/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              policy === 'LRU' ? 'bg-accent-primary' : 'bg-ink-primary'
            }`}
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold tracking-tight text-ink-primary">
            8-Way BSA + {policy}
          </h3>
          <span className="text-xs text-ink-muted">
            ({policy === 'LRU' ? 'evicts smallest age' : 'evicts largest age'})
          </span>
        </div>

        {/* Active Step Status Pill */}
        {showStepHighlight && activeStep && (
          <div className="flex items-center gap-1.5 font-mono text-xs tabular-nums">
            <span className="text-ink-secondary">
              Blk <strong className="text-ink-primary">{activeStep.blockAddress}</strong> &rarr;
              Set <strong className="text-ink-primary">{activeStep.setIndex}</strong> W
              {activeStep.wayIndex}
            </span>
            {activeStep.outcome === 'HIT' ? (
              <span className="rounded border border-status-hit/30 bg-status-hit-bg px-1.5 py-0.5 text-[11px] font-semibold text-status-hit">
                HIT
              </span>
            ) : activeStep.evictedBlock !== null ? (
              <span className="rounded border border-status-evict/30 bg-status-evict-bg px-1.5 py-0.5 text-[11px] font-semibold text-status-evict">
                MISS &middot; EVICT {activeStep.evictedBlock}
              </span>
            ) : (
              <span className="rounded border border-status-miss/30 bg-status-miss-bg px-1.5 py-0.5 text-[11px] font-semibold text-status-miss">
                MISS &middot; LOAD
              </span>
            )}
          </div>
        )}
      </div>

      {/* Scrollable 8-Way Grid */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border-subtle bg-subtle/30 font-mono text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">
              <th
                scope="col"
                className="sticky left-0 z-10 w-16 border-r border-border-subtle bg-subtle px-2.5 py-2"
              >
                Set
              </th>
              {Array.from({ length: 8 }, (_, w) => (
                <th key={w} scope="col" className="px-2 py-2 text-center">
                  Way {w}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {cacheState.map((setLines, setIdx) => {
              const isActiveSet = showStepHighlight && activeStep?.setIndex === setIdx;
              return (
                <tr
                  key={setIdx}
                  className={isActiveSet ? 'bg-accent-soft/40' : 'bg-surface'}
                >
                  <th
                    scope="row"
                    className={`sticky left-0 z-10 border-r border-border-subtle px-2.5 py-2 font-mono text-xs font-semibold tabular-nums ${
                      isActiveSet
                        ? 'border-l-2 border-l-accent-primary bg-accent-soft text-accent-primary'
                        : 'bg-subtle/40 text-ink-secondary'
                    }`}
                  >
                    S{setIdx}
                  </th>
                  {setLines.map((line) => {
                    const isActiveCell =
                      isActiveSet && activeStep?.wayIndex === line.way;
                    const isHit = isActiveCell && activeStep?.outcome === 'HIT';
                    const isEvict =
                      isActiveCell &&
                      activeStep?.outcome === 'MISS' &&
                      activeStep.evictedBlock !== null;
                    const isColdLoad =
                      isActiveCell &&
                      activeStep?.outcome === 'MISS' &&
                      activeStep.evictedBlock === null;

                    let cellClasses =
                      'border border-border-subtle bg-canvas/50 text-ink-muted';
                    if (line.valid) {
                      cellClasses =
                        'border border-border-strong/70 bg-surface text-ink-primary';
                    }
                    if (isHit) {
                      cellClasses =
                        'border-2 border-status-hit bg-status-hit-bg text-ink-primary animate-cell-pulse';
                    } else if (isEvict) {
                      cellClasses =
                        'border-2 border-status-evict bg-status-evict-bg text-ink-primary animate-cell-pulse';
                    } else if (isColdLoad) {
                      cellClasses =
                        'border-2 border-status-miss bg-status-miss-bg text-ink-primary animate-cell-pulse';
                    }

                    return (
                      <td key={line.way} className="p-1.5 align-top">
                        <div
                          className={`flex min-h-[66px] flex-col justify-between rounded px-2 py-1.5 font-mono tabular-nums transition-colors ${cellClasses}`}
                        >
                          {/* Top Row: Valid bit & Age */}
                          <div className="flex items-center justify-between text-[10px] leading-none">
                            <span
                              className={
                                line.valid
                                  ? 'font-semibold text-ink-secondary'
                                  : 'text-ink-muted'
                              }
                            >
                              V:{line.valid ? '1' : '0'}
                            </span>
                            <span className="text-ink-muted">
                              {line.valid ? `A:${line.age}` : 'A:0'}
                            </span>
                          </div>

                          {/* Center: MM Block # */}
                          <div className="my-1 text-center text-xs font-semibold leading-tight">
                            {line.valid && line.blockAddress !== null
                              ? `B${line.blockAddress}`
                              : '—'}
                          </div>

                          {/* Footer: Tag or Event Label */}
                          <div className="flex items-center justify-between text-[10px] leading-none text-ink-secondary">
                            <span>
                              {line.valid && line.tag !== null ? `T:${line.tag}` : 'empty'}
                            </span>
                            {isHit && (
                              <span className="font-bold text-status-hit">HIT</span>
                            )}
                            {isColdLoad && (
                              <span className="font-bold text-status-miss">LOAD</span>
                            )}
                            {isEvict && (
                              <span
                                className="font-bold text-status-evict"
                                title={`Evicted Block ${activeStep?.evictedBlock}`}
                              >
                                &larr;{activeStep?.evictedBlock}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
