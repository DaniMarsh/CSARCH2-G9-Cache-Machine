import React from 'react';
import type { CacheLine, CacheStepSnapshot, ReplacementPolicy } from '../engine/types';

interface CacheGridProps {
  policy: ReplacementPolicy;
  cacheState: CacheLine[][];
  activeStep: CacheStepSnapshot | null;
  highlightActive: boolean;
  compact?: boolean;
  animateStep?: boolean;
  presentationMode?: boolean;
}

export const CacheGrid: React.FC<CacheGridProps> = ({
  policy,
  cacheState,
  activeStep,
  highlightActive,
  compact = false,
  animateStep = false,
  presentationMode = false,
}) => {
  const showStepHighlight = highlightActive && activeStep !== null;
  const gridColsClass = compact
    ? 'grid-cols-[36px_repeat(8,minmax(0,1fr))]'
    : 'grid-cols-[52px_repeat(8,minmax(0,1fr))]';

  return (
    <div
      data-testid={`cache-grid-${policy.toLowerCase()}`}
      className="sheet flex flex-col overflow-hidden rounded-[4px]"
    >
      {/* Grid Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-rail/70 px-3.5 py-2">
        <div className="flex items-baseline gap-2">
          <h3
            className={`${
              presentationMode ? 'text-sm' : 'text-[13px]'
            } font-semibold text-ink-primary`}
          >
            8-Way BSA + {policy}
          </h3>
          {!compact && (
            <span className="text-xs text-ink-muted">
              {policy === 'LRU' ? 'evicts smallest age' : 'evicts largest age'}
            </span>
          )}
        </div>

        {/* Active Step Status Readout */}
        {showStepHighlight && activeStep ? (
          <div className="flex items-center gap-2 font-mono text-xs tabular-nums">
            <span className="text-ink-secondary">
              Blk <strong className="font-semibold text-ink-primary">{activeStep.blockAddress}</strong>
              {' → '}S{activeStep.setIndex} W{activeStep.wayIndex}
            </span>
            {activeStep.action === 'HIT' && (
              <span className="font-semibold text-status-hit">HIT</span>
            )}
            {activeStep.action === 'COLD_LOAD' && (
              <span className="font-semibold text-status-miss">LOAD</span>
            )}
            {activeStep.action === 'EVICT' && (
              <span className="font-semibold text-status-evict">
                EVICT {activeStep.evictedBlock}
              </span>
            )}
          </div>
        ) : (
          <span className="font-mono text-xs tabular-nums text-ink-muted">
            {cacheState.length} {cacheState.length === 1 ? 'set' : 'sets'} &times; 8 ways
          </span>
        )}
      </div>

      {/* Zero-Clipping 8-Way Matrix with Sticky Set Column */}
      <div className="trace-scroll overflow-x-auto">
        <div
          role="grid"
          aria-label={`8-Way Block Set Associative ${policy} Cache Grid`}
          className={compact ? 'min-w-[496px]' : 'min-w-[660px]'}
        >
          {/* Column Header Row */}
          <div
            role="row"
            className={`grid ${gridColsClass} border-b border-border-subtle bg-canvas/85 font-mono text-[11px] font-medium text-ink-secondary`}
          >
            <div
              role="columnheader"
              className="sticky left-0 z-10 flex items-center justify-center border-r border-border-subtle bg-rail py-1.5"
            >
              Set
            </div>
            {Array.from({ length: 8 }, (_, w) => (
              <div
                key={w}
                role="columnheader"
                className="flex items-center justify-center border-r border-border-subtle/50 py-1.5 last:border-r-0"
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
                  className={`grid ${gridColsClass} transition-colors duration-150 ${
                    isActiveSet ? 'bg-rail/60' : 'bg-surface'
                  }`}
                >
                  {/* Sticky Set Index Label */}
                  <div
                    role="rowheader"
                    className={`sticky left-0 z-10 flex items-center justify-center border-r border-border-subtle font-mono text-xs font-semibold tabular-nums transition-colors duration-150 ${
                      isActiveSet
                        ? 'bg-ink-primary text-surface'
                        : 'bg-rail/80 text-ink-secondary'
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

                    // Inset ring avoids any 1px layout shift when switching between 1px and 2px active state
                    let cellClasses = 'bg-canvas/45 text-ink-muted';
                    if (line.valid) {
                      cellClasses = 'bg-surface text-ink-primary';
                    }
                    if (isHit) {
                      cellClasses =
                        'bg-status-hit-bg text-ink-primary ring-2 ring-inset ring-status-hit';
                    } else if (isEvict) {
                      cellClasses =
                        'bg-status-evict-bg text-ink-primary ring-2 ring-inset ring-status-evict';
                    } else if (isColdLoad) {
                      cellClasses =
                        'bg-status-miss-bg text-ink-primary ring-2 ring-inset ring-status-miss';
                    }

                    const ageRatio =
                      line.valid && maxAgeInSet > 0
                        ? Math.max(8, Math.round((line.age / maxAgeInSet) * 100))
                        : 0;

                    const stepKey =
                      animateStep && isActiveCell ? `s-${activeStep?.step}` : 'static';

                    const blockAnimClass =
                      animateStep && isColdLoad
                        ? 'stage-roll-load'
                        : animateStep && isEvict
                        ? 'stage-roll-evict'
                        : '';
                    const ageAnimClass =
                      animateStep && isHit ? 'stage-tick-hit' : '';

                    const cellAriaLabel = line.valid
                      ? `Set ${setIdx}, Way ${line.way}, Block ${line.blockAddress}, Tag ${line.tag}, Age ${line.age}${
                          isHit
                            ? ', Cache Hit'
                            : isColdLoad
                            ? ', Cold Load'
                            : isEvict
                            ? `, Evicted Block ${activeStep?.evictedBlock}`
                            : ''
                        }`
                      : `Set ${setIdx}, Way ${line.way}, Empty`;

                    return (
                      <div
                        key={line.way}
                        role="gridcell"
                        aria-label={cellAriaLabel}
                        className={`relative flex flex-col justify-between border-r border-border-subtle/70 font-mono tabular-nums transition-colors duration-150 last:border-r-0 ${
                          presentationMode
                            ? compact
                              ? 'min-h-[68px] px-2 py-1.5'
                              : 'min-h-[76px] px-2.5 py-2'
                            : compact
                            ? 'min-h-[58px] px-1.5 py-1.5'
                            : 'min-h-[64px] px-2.5 py-1.5'
                        } ${cellClasses}`}
                      >
                        {!line.valid ? (
                          <div className="flex flex-1 items-center justify-center text-xs text-border-strong">
                            &mdash;
                          </div>
                        ) : (
                          <>
                            {/* Top Row: Tag & Age */}
                            <div className="flex items-center justify-between gap-0.5 text-[10.5px] leading-none text-ink-muted">
                              <span className="truncate">T:{line.tag}</span>
                              <span
                                key={`age-${stepKey}`}
                                className={`shrink-0 ${
                                  isHit ? 'font-semibold text-status-hit' : ''
                                } ${ageAnimClass}`}
                              >
                                A:{line.age}
                              </span>
                            </div>

                            {/* Center: MM Block # */}
                            <div
                              key={`blk-${stepKey}`}
                              className={`my-0.5 truncate text-center font-semibold leading-tight text-ink-primary ${
                                presentationMode
                                  ? compact
                                    ? 'text-[13px]'
                                    : 'text-sm'
                                  : compact
                                  ? 'text-xs'
                                  : 'text-[13px]'
                              } ${blockAnimClass}`}
                              title={`Main Memory Block ${line.blockAddress}`}
                            >
                              {compact ? `B${line.blockAddress}` : `Blk ${line.blockAddress}`}
                            </div>

                            {/* Bottom Row: Valid Bit & Explicit State Label */}
                            <div className="flex items-center justify-between gap-0.5 text-[10px] leading-none">
                              <span className="text-ink-muted">V:1</span>
                              {isHit && (
                                <span className="shrink-0 font-semibold text-status-hit">
                                  HIT
                                </span>
                              )}
                              {isColdLoad && (
                                <span className="shrink-0 font-semibold text-status-miss">
                                  LOAD
                                </span>
                              )}
                              {isEvict && (
                                <span
                                  className="shrink-0 font-semibold text-status-evict"
                                  title={`Evicted Block ${activeStep?.evictedBlock}`}
                                >
                                  &times;{activeStep?.evictedBlock}
                                </span>
                              )}
                            </div>

                            {/* Relative Age Recency Hairline */}
                            <div
                              aria-hidden="true"
                              className="absolute inset-x-0 bottom-0 h-[2px] bg-subtle/80"
                            >
                              <div
                                className="h-full bg-ink-secondary/45 transition-[width] duration-150"
                                style={{ width: `${ageRatio}%` }}
                              />
                            </div>
                          </>
                        )}
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
