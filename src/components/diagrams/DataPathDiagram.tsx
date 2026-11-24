import React from 'react';
import { calculateMissPenalty } from '../../engine/simulator';
import type {
  AddressPartitioning,
  CacheStepSnapshot,
  SimulationConfig,
} from '../../engine/types';

interface DataPathDiagramProps {
  config: SimulationConfig;
  partitioning: AddressPartitioning;
  lruStep: CacheStepSnapshot | null;
  mruStep: CacheStepSnapshot | null;
  isSnapshotMode: boolean;
}

export const DataPathDiagram: React.FC<DataPathDiagramProps> = ({
  config,
  partitioning,
  lruStep,
  mruStep,
  isSnapshotMode,
}) => {
  const isLoadThrough = config.readPolicy === 'load-through';
  const missPenalty = calculateMissPenalty(
    config.blockSize,
    config.readPolicy,
    config.cacheAccessTime,
    config.memoryAccessTime
  );

  // Determine live bus activity from current step (when in Step-by-Step mode)
  const hasActiveStep = !isSnapshotMode && lruStep !== null && mruStep !== null;
  const anyHit = hasActiveStep && (lruStep.outcome === 'HIT' || mruStep.outcome === 'HIT');
  const anyMiss = hasActiveStep && (lruStep.outcome === 'MISS' || mruStep.outcome === 'MISS');
  const anyEvict = hasActiveStep && (lruStep.action === 'EVICT' || mruStep.action === 'EVICT');

  const hitStroke = anyHit ? 'var(--status-hit)' : 'var(--ink-primary)';
  const missStroke = anyEvict
    ? 'var(--status-evict)'
    : anyMiss
    ? 'var(--status-miss)'
    : 'var(--ink-primary)';
  const bypassStroke = isLoadThrough
    ? anyMiss
      ? 'var(--accent-primary)'
      : 'var(--ink-primary)'
    : 'var(--border-strong)';

  return (
    <div className="rounded-md border border-border-subtle bg-surface p-3">
      {/* Drawing Sheet Header Strip */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-2 font-mono text-[11px] tabular-nums">
        <div className="flex items-center gap-2">
          <span className="rounded border border-ink-primary px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-ink-primary">
            DWG-01
          </span>
          <span className="font-semibold uppercase tracking-wider text-ink-primary">
            CPU &harr; Cache &harr; Main Memory Data Path
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-ink-secondary">
          <span>
            POLICY:{' '}
            <strong className="text-ink-primary">
              {isLoadThrough ? 'LOAD-THROUGH' : 'NON-LOAD-THROUGH'}
            </strong>
          </span>
          <span className="text-border-strong">|</span>
          <span>
            M = <strong className="text-ink-primary">{missPenalty.toFixed(2)} ns</strong>
          </span>
          {hasActiveStep && lruStep && mruStep && (
            <>
              <span className="text-border-strong">|</span>
              <span
                className={`rounded px-1.5 py-0.5 font-semibold ${
                  lruStep.outcome === 'HIT'
                    ? 'bg-status-hit-bg text-status-hit'
                    : lruStep.action === 'EVICT'
                    ? 'bg-status-evict-bg text-status-evict'
                    : 'bg-status-miss-bg text-status-miss'
                }`}
              >
                LRU: {lruStep.action === 'COLD_LOAD' ? 'MISS' : lruStep.action}
              </span>
              <span
                className={`rounded px-1.5 py-0.5 font-semibold ${
                  mruStep.outcome === 'HIT'
                    ? 'bg-status-hit-bg text-status-hit'
                    : mruStep.action === 'EVICT'
                    ? 'bg-status-evict-bg text-status-evict'
                    : 'bg-status-miss-bg text-status-miss'
                }`}
              >
                MRU: {mruStep.action === 'COLD_LOAD' ? 'MISS' : mruStep.action}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Dimensional SVG Schematic */}
      <svg
        viewBox="0 0 860 286"
        role="img"
        aria-label={`Machine 9 cache architecture data path using ${
          isLoadThrough ? 'Load-Through' : 'Non-Load-Through'
        } policy with miss penalty ${missPenalty.toFixed(2)} nanoseconds`}
        className="h-auto w-full select-none"
      >
        <defs>
          <pattern
            id="dd-hatch-neutral"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="6"
              stroke="var(--border-subtle)"
              strokeWidth="1.2"
            />
          </pattern>
          <marker
            id="dd-arrow-ink"
            viewBox="0 0 10 10"
            refX="8.5"
            refY="5"
            markerWidth="6.5"
            markerHeight="6.5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="var(--ink-primary)" />
          </marker>
          <marker
            id="dd-arrow-hit"
            viewBox="0 0 10 10"
            refX="8.5"
            refY="5"
            markerWidth="6.5"
            markerHeight="6.5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="var(--status-hit)" />
          </marker>
          <marker
            id="dd-arrow-miss"
            viewBox="0 0 10 10"
            refX="8.5"
            refY="5"
            markerWidth="6.5"
            markerHeight="6.5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="var(--status-miss)" />
          </marker>
          <marker
            id="dd-arrow-evict"
            viewBox="0 0 10 10"
            refX="8.5"
            refY="5"
            markerWidth="6.5"
            markerHeight="6.5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="var(--status-evict)" />
          </marker>
          <marker
            id="dd-arrow-accent"
            viewBox="0 0 10 10"
            refX="8.5"
            refY="5"
            markerWidth="6.5"
            markerHeight="6.5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="var(--accent-primary)" />
          </marker>
          <marker
            id="dd-arrow-muted"
            viewBox="0 0 10 10"
            refX="8.5"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="var(--border-strong)" />
          </marker>
        </defs>

        {/* Outer Technical Sheet Frame */}
        <rect
          x="6"
          y="6"
          width="848"
          height="274"
          rx="6"
          fill="var(--bg-canvas)"
          fillOpacity="0.45"
          stroke="var(--border-strong)"
          strokeWidth="1"
        />

        {/* Top Dimension Chain: Timing Hierarchy */}
        <g fontFamily="JetBrains Mono, monospace" fontSize="9.5" fill="var(--ink-secondary)">
          {/* Extension lines */}
          <line x1="28" y1="30" x2="28" y2="58" stroke="var(--border-strong)" strokeWidth="0.7" />
          <line x1="600" y1="30" x2="600" y2="58" stroke="var(--border-strong)" strokeWidth="0.7" />
          <line x1="832" y1="30" x2="832" y2="58" stroke="var(--border-strong)" strokeWidth="0.7" />

          {/* Dimension line 1: CPU -> Cache boundary */}
          <line
            x1="31"
            y1="38"
            x2="597"
            y2="38"
            stroke="var(--ink-muted)"
            strokeWidth="0.75"
            markerStart="url(#dd-arrow-ink)"
            markerEnd="url(#dd-arrow-ink)"
          />
          <rect x="232" y="29" width="164" height="17" fill="var(--bg-surface)" rx="2" />
          <text x="314" y="41" textAnchor="middle" fill="var(--ink-primary)" fontWeight="600">
            ON-CHIP · HIT TIME Tc = {config.cacheAccessTime}ns
          </text>

          {/* Dimension line 2: Main Memory boundary */}
          <line
            x1="603"
            y1="38"
            x2="829"
            y2="38"
            stroke="var(--ink-muted)"
            strokeWidth="0.75"
            markerStart="url(#dd-arrow-ink)"
            markerEnd="url(#dd-arrow-ink)"
          />
          <rect x="652" y="29" width="128" height="17" fill="var(--bg-surface)" rx="2" />
          <text x="716" y="41" textAnchor="middle" fill="var(--ink-primary)" fontWeight="600">
            MAIN MEM Tm = {config.memoryAccessTime}ns
          </text>
        </g>

        {/* === BLOCK 1: CPU === */}
        <g>
          <rect
            x="28"
            y="66"
            width="136"
            height="120"
            rx="4"
            fill="var(--bg-surface)"
            stroke="var(--ink-primary)"
            strokeWidth="1.6"
          />
          <line x1="28" y1="90" x2="164" y2="90" stroke="var(--border-subtle)" strokeWidth="1" />
          <text
            x="96"
            y="82"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10.5"
            fontWeight="700"
            fill="var(--ink-primary)"
          >
            CPU CORE
          </text>
          <text
            x="96"
            y="112"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="9.5"
            fill="var(--ink-secondary)"
          >
            REQ BLOCK ADDR
          </text>
          <rect
            x="44"
            y="122"
            width="104"
            height="28"
            rx="3"
            fill={hasActiveStep ? 'var(--accent-soft)' : 'var(--bg-subtle)'}
            stroke={hasActiveStep ? 'var(--accent-primary)' : 'var(--border-strong)'}
            strokeWidth="1"
          />
          <text
            x="96"
            y="140"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="11.5"
            fontWeight="700"
            fill={hasActiveStep ? 'var(--accent-primary)' : 'var(--ink-primary)'}
          >
            {hasActiveStep && lruStep ? `BLK #${lruStep.blockAddress}` : '0 .. 1023'}
          </text>
          <text
            x="96"
            y="172"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="9"
            fill="var(--ink-muted)"
          >
            {partitioning.totalAddressBits}-BIT WORD ADDR
          </text>
        </g>

        {/* === BLOCK 2: CACHE CONTROLLER === */}
        <g>
          <rect
            x="218"
            y="66"
            width="156"
            height="120"
            rx="4"
            fill="var(--bg-surface)"
            stroke="var(--ink-primary)"
            strokeWidth="1.6"
          />
          <line x1="218" y1="90" x2="374" y2="90" stroke="var(--border-subtle)" strokeWidth="1" />
          <text
            x="296"
            y="82"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fontWeight="700"
            fill="var(--ink-primary)"
          >
            CACHE CONTROLLER
          </text>
          <text
            x="296"
            y="110"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="9.5"
            fill="var(--ink-secondary)"
          >
            TAG COMPARATOR
          </text>
          <rect
            x="232"
            y="120"
            width="128"
            height="24"
            rx="3"
            fill="var(--bg-subtle)"
            stroke="var(--border-strong)"
            strokeDasharray="3 2"
            strokeWidth="0.9"
          />
          <text
            x="296"
            y="135"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="9.5"
            fill="var(--ink-primary)"
          >
            {hasActiveStep && lruStep
              ? `SET ${lruStep.setIndex} · TAG ${lruStep.tag}`
              : `SET = BLK % ${partitioning.numSets}`}
          </text>
          <text
            x="296"
            y="162"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="9"
            fill="var(--ink-muted)"
          >
            POLICY: LRU vs MRU
          </text>
          <text
            x="296"
            y="175"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="8.5"
            fill="var(--ink-muted)"
          >
            AGE-BASED (8 WAYS)
          </text>
        </g>

        {/* === BLOCK 3: 8-WAY BSA CACHE === */}
        <g>
          <rect
            x="426"
            y="66"
            width="174"
            height="120"
            rx="4"
            fill={
              anyHit && !anyMiss
                ? 'var(--status-hit-bg)'
                : anyEvict
                ? 'var(--status-evict-bg)'
                : anyMiss
                ? 'var(--status-miss-bg)'
                : 'var(--bg-surface)'
            }
            stroke={anyHit && !anyMiss ? 'var(--status-hit)' : 'var(--ink-primary)'}
            strokeWidth="1.6"
          />
          <line x1="426" y1="90" x2="600" y2="90" stroke="var(--border-subtle)" strokeWidth="1" />
          <text
            x="513"
            y="82"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fontWeight="700"
            fill="var(--ink-primary)"
          >
            8-WAY BSA CACHE
          </text>

          {/* Mini 8-way slot schematic */}
          {Array.from({ length: 8 }, (_, w) => (
            <rect
              key={w}
              x={439 + w * 18.5}
              y={102}
              width={15}
              height={26}
              rx={1.5}
              fill="var(--bg-surface)"
              stroke="var(--border-strong)"
              strokeWidth="0.8"
            />
          ))}
          <text
            x="513"
            y="144"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="9.5"
            fontWeight="600"
            fill="var(--ink-primary)"
          >
            n = {config.cacheBlocks} BLKS ({partitioning.numSets} SETS &times; 8W)
          </text>
          <text
            x="513"
            y="160"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="9"
            fill="var(--ink-secondary)"
          >
            B = {config.blockSize} WORDS / BLOCK
          </text>
          <text
            x="513"
            y="175"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="8.5"
            fill="var(--ink-muted)"
          >
            ACCESS TIME Tc = {config.cacheAccessTime} ns
          </text>
        </g>

        {/* === BLOCK 4: 1024-BLOCK MAIN MEMORY === */}
        <g>
          <rect
            x="666"
            y="66"
            width="166"
            height="120"
            rx="4"
            fill="url(#dd-hatch-neutral)"
            stroke="var(--ink-primary)"
            strokeWidth="1.6"
          />
          <rect
            x="674"
            y="72"
            width="150"
            height="108"
            rx="2"
            fill="var(--bg-surface)"
            fillOpacity="0.92"
            stroke="var(--border-subtle)"
            strokeWidth="0.8"
          />
          <line x1="674" y1="94" x2="824" y2="94" stroke="var(--border-subtle)" strokeWidth="1" />
          <text
            x="749"
            y="86"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fontWeight="700"
            fill="var(--ink-primary)"
          >
            MAIN MEMORY
          </text>
          <text
            x="749"
            y="114"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fontWeight="600"
            fill="var(--ink-primary)"
          >
            1024 BLOCKS
          </text>
          <text
            x="749"
            y="130"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="9"
            fill="var(--ink-secondary)"
          >
            INDICES 0 .. 1023
          </text>
          <text
            x="749"
            y="148"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="9"
            fill="var(--ink-secondary)"
          >
            {1024 * config.blockSize} TOTAL WORDS
          </text>
          <text
            x="749"
            y="168"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="8.5"
            fill="var(--ink-muted)"
          >
            XFER: B&middot;Tm = {config.blockSize * config.memoryAccessTime} ns
          </text>
        </g>

        {/* === BUS 1: CPU <-> CONTROLLER (Address / Word Hit Return) === */}
        <line
          x1="164"
          y1="112"
          x2="215"
          y2="112"
          stroke="var(--ink-primary)"
          strokeWidth="1.5"
          markerEnd="url(#dd-arrow-ink)"
        />
        <text
          x="191"
          y="105"
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="8.5"
          fill="var(--ink-secondary)"
        >
          ADDR
        </text>

        <line
          x1="218"
          y1="146"
          x2="167"
          y2="146"
          stroke={hitStroke}
          strokeWidth={anyHit ? '2.2' : '1.4'}
          markerEnd={anyHit ? 'url(#dd-arrow-hit)' : 'url(#dd-arrow-ink)'}
        />
        <text
          x="191"
          y="160"
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="8.5"
          fontWeight={anyHit ? '700' : '500'}
          fill={hitStroke}
        >
          {anyHit ? 'HIT DATA' : 'WORD'}
        </text>

        {/* === BUS 2: CONTROLLER <-> 8-WAY CACHE === */}
        <line
          x1="374"
          y1="112"
          x2="423"
          y2="112"
          stroke="var(--ink-primary)"
          strokeWidth="1.5"
          markerEnd="url(#dd-arrow-ink)"
        />
        <text
          x="400"
          y="105"
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="8.5"
          fill="var(--ink-secondary)"
        >
          LOOKUP
        </text>
        <line
          x1="426"
          y1="146"
          x2="377"
          y2="146"
          stroke={hitStroke}
          strokeWidth={anyHit ? '2.2' : '1.4'}
          markerEnd={anyHit ? 'url(#dd-arrow-hit)' : 'url(#dd-arrow-ink)'}
        />
        <text
          x="400"
          y="160"
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="8.5"
          fill={hitStroke}
        >
          Tc
        </text>

        {/* === BUS 3: 8-WAY CACHE <-> MAIN MEMORY (Block Fetch on Miss) === */}
        <line
          x1="600"
          y1="112"
          x2="663"
          y2="112"
          stroke={missStroke}
          strokeWidth={anyMiss ? '2.2' : '1.4'}
          strokeDasharray={anyMiss ? undefined : '4 3'}
          markerEnd={
            anyEvict
              ? 'url(#dd-arrow-evict)'
              : anyMiss
              ? 'url(#dd-arrow-miss)'
              : 'url(#dd-arrow-ink)'
          }
        />
        <text
          x="633"
          y="105"
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="8.5"
          fontWeight={anyMiss ? '700' : '500'}
          fill={missStroke}
        >
          MISS REQ
        </text>

        <line
          x1="666"
          y1="146"
          x2="603"
          y2="146"
          stroke={missStroke}
          strokeWidth={anyMiss ? '2.2' : '1.4'}
          strokeDasharray={anyMiss ? undefined : '4 3'}
          markerEnd={
            anyEvict
              ? 'url(#dd-arrow-evict)'
              : anyMiss
              ? 'url(#dd-arrow-miss)'
              : 'url(#dd-arrow-ink)'
          }
        />
        <text
          x="633"
          y="160"
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="8.5"
          fontWeight={anyMiss ? '700' : '500'}
          fill={missStroke}
        >
          {config.blockSize}W BLK
        </text>

        {/* === LOWER CHANNEL: READ POLICY PATH (Non-Load-Through vs Load-Through Bypass) === */}
        <g>
          {/* Bypass path from Main Memory bottom directly to CPU bottom */}
          <path
            d="M 749 186 L 749 232 L 96 232 L 96 189"
            fill="none"
            stroke={bypassStroke}
            strokeWidth={isLoadThrough ? (anyMiss ? '2.2' : '1.6') : '1.1'}
            strokeDasharray={isLoadThrough ? undefined : '5 4'}
            markerEnd={
              isLoadThrough
                ? anyMiss
                  ? 'url(#dd-arrow-accent)'
                  : 'url(#dd-arrow-ink)'
                : 'url(#dd-arrow-muted)'
            }
          />

          {/* Policy Callout Plate centered on lower channel */}
          <rect
            x="230"
            y="216"
            width="400"
            height="32"
            rx="3"
            fill={isLoadThrough ? 'var(--accent-soft)' : 'var(--bg-surface)'}
            stroke={isLoadThrough ? 'var(--accent-primary)' : 'var(--border-strong)'}
            strokeWidth="1"
          />
          <text
            x="430"
            y="230"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="9.5"
            fontWeight="700"
            fill={isLoadThrough ? 'var(--accent-primary)' : 'var(--ink-primary)'}
          >
            {isLoadThrough
              ? '[ACTIVE] LOAD-THROUGH BYPASS: WORD FORWARDED TO CPU IN PARALLEL'
              : '[INACTIVE BYPASS] NON-LOAD-THROUGH: FULL BLOCK LOADS TO CACHE FIRST'}
          </text>
          <text
            x="430"
            y="243"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="8.5"
            fill="var(--ink-secondary)"
          >
            {isLoadThrough
              ? `M = Tc + Tm = ${config.cacheAccessTime} + ${config.memoryAccessTime} = ${missPenalty.toFixed(
                  2
                )} ns`
              : `M = Tc + (B·Tm) + Tc = ${config.cacheAccessTime} + (${config.blockSize}·${
                  config.memoryAccessTime
                }) + ${config.cacheAccessTime} = ${missPenalty.toFixed(2)} ns`}
          </text>
        </g>

        {/* Sheet Footer Line */}
        <text
          x="20"
          y="270"
          fontFamily="JetBrains Mono, monospace"
          fontSize="8.5"
          fill="var(--ink-muted)"
        >
          MACHINE 9 · 8-WAY BLOCK SET ASSOCIATIVE
        </text>
        <text
          x="840"
          y="270"
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
          fontSize="8.5"
          fill="var(--ink-muted)"
        >
          UNITS: NS / WORDS · DO NOT SCALE
        </text>
      </svg>
    </div>
  );
};
