import React, { useMemo, useRef, useState } from 'react';
import type { CacheStepSnapshot } from '../engine/types';

interface TraceRibbonProps {
  lruSteps: CacheStepSnapshot[];
  mruSteps: CacheStepSnapshot[];
  currentStepIndex: number;
  isSnapshotMode: boolean;
  onSelectStep: (stepIndex: number) => void;
}

function colorForAction(action: CacheStepSnapshot['action']): string {
  if (action === 'HIT') return 'var(--status-hit)';
  if (action === 'COLD_LOAD') return 'var(--status-miss)';
  return 'var(--status-evict)';
}

function shortAction(step: CacheStepSnapshot): string {
  if (step.action === 'HIT') return `HIT W${step.wayIndex}`;
  if (step.action === 'COLD_LOAD') return `LOAD W${step.wayIndex}`;
  return `EVICT ${step.evictedBlock}`;
}

export const TraceRibbon: React.FC<TraceRibbonProps> = ({
  lruSteps,
  mruSteps,
  currentStepIndex,
  isSnapshotMode,
  onSelectStep,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const total = lruSteps.length;
  const activeStep = isSnapshotMode ? total : currentStepIndex;

  const divergenceCount = useMemo(() => {
    let count = 0;
    for (let i = 0; i < total; i++) {
      const l = lruSteps[i];
      const m = mruSteps[i];
      if (
        l &&
        m &&
        (l.action !== m.action || l.wayIndex !== m.wayIndex || l.evictedBlock !== m.evictedBlock)
      ) {
        count += 1;
      }
    }
    return count;
  }, [lruSteps, mruSteps, total]);

  if (total === 0) return null;

  const resolveStepFromClientX = (clientX: number): number => {
    const svg = svgRef.current;
    if (!svg) return 1;
    const rect = svg.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(0.9999, (clientX - rect.left) / Math.max(1, rect.width)));
    return Math.min(total, Math.max(1, Math.floor(ratio * total) + 1));
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    const step = resolveStepFromClientX(e.clientX);
    setHoveredStep(step);
    onSelectStep(step);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const step = resolveStepFromClientX(e.clientX);
    setHoveredStep(step);
    if (isDragging) {
      onSelectStep(step);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
  };

  const hoveredLru = hoveredStep ? lruSteps[hoveredStep - 1] ?? null : null;
  const hoveredMru = hoveredStep ? mruSteps[hoveredStep - 1] ?? null : null;

  // Fixed logical width so crisp hairline gaps scale cleanly across 1..2048 steps
  const viewW = 1000;
  const cellW = viewW / total;
  const gap = total <= 128 ? Math.min(1.5, cellW * 0.14) : 0;
  const drawW = Math.max(0.5, cellW - gap);

  const playheadX =
    activeStep > 0 ? Math.min(viewW - 1, (activeStep - 0.5) * cellW) : 0;
  const hoverX =
    hoveredStep !== null ? Math.min(viewW - 1, (hoveredStep - 0.5) * cellW) : null;

  return (
    <div className="trace-ribbon border-t border-border-subtle bg-canvas/65 px-4 py-2">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] tabular-nums">
        <div className="flex items-center gap-3 text-ink-muted">
          <span className="font-semibold uppercase tracking-wider text-ink-secondary">
            Execution Trace Ribbon
          </span>
          <span>
            <strong className="text-accent-primary">{divergenceCount}</strong>/{total} divergent
          </span>
        </div>

        <div className="text-ink-secondary">
          {hoveredLru && hoveredMru ? (
            <span>
              Step <strong className="text-ink-primary">{hoveredStep}</strong> &middot; Blk{' '}
              <strong className="text-ink-primary">{hoveredLru.blockAddress}</strong> &middot; LRU{' '}
              <strong className="text-ink-primary">{shortAction(hoveredLru)}</strong> &middot; MRU{' '}
              <strong className="text-ink-primary">{shortAction(hoveredMru)}</strong>
            </span>
          ) : (
            <span className="text-ink-muted">Click or drag ribbon to scrub any access step</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[34px_minmax(0,1fr)] items-center gap-2">
        {/* Track Labels */}
        <div className="flex flex-col justify-between py-[5px] font-mono text-[9.5px] font-semibold leading-none tracking-wider text-ink-secondary">
          <span>LRU</span>
          <span className="mt-[6px]">MRU</span>
        </div>

        {/* Interactive Dual-Track SVG Ribbon */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewW} 36`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`Dual-track LRU and MRU execution trace ribbon across ${total} accesses with ${divergenceCount} divergent steps`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => {
            setHoveredStep(null);
            setIsDragging(false);
          }}
          className="trace-ribbon-canvas h-[36px] w-full cursor-crosshair select-none touch-none rounded-[2px] border border-border-subtle bg-surface"
        >
          {/* Step Bars + Top Divergence Ticks */}
          {lruSteps.map((lStep, idx) => {
            const mStep = mruSteps[idx];
            if (!mStep) return null;
            const stepNum = idx + 1;
            const x = idx * cellW + gap / 2;
            const isPastOrCurrent = stepNum <= activeStep;
            const opacity = isPastOrCurrent ? 0.92 : 0.28;
            const diverged =
              lStep.action !== mStep.action ||
              lStep.wayIndex !== mStep.wayIndex ||
              lStep.evictedBlock !== mStep.evictedBlock;

            return (
              <g key={stepNum}>
                {diverged && (
                  <rect
                    x={x}
                    y={0.5}
                    width={drawW}
                    height={3.5}
                    fill="var(--accent-primary)"
                    opacity={isPastOrCurrent ? 0.95 : 0.4}
                  />
                )}
                <rect
                  x={x}
                  y={6}
                  width={drawW}
                  height={10}
                  fill={colorForAction(lStep.action)}
                  opacity={opacity}
                />
                <rect
                  x={x}
                  y={18}
                  width={drawW}
                  height={12}
                  fill={colorForAction(mStep.action)}
                  opacity={opacity}
                />
              </g>
            );
          })}

          {/* Hover Hairline */}
          {hoverX !== null && (
            <line
              x1={hoverX}
              y1={0}
              x2={hoverX}
              y2={36}
              stroke="var(--ink-secondary)"
              strokeWidth="1.2"
              strokeDasharray="2 2"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {/* Active Playhead Cursor */}
          {activeStep > 0 && (
            <g>
              <line
                x1={playheadX}
                y1={0}
                x2={playheadX}
                y2={36}
                stroke="var(--shell-bg)"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
