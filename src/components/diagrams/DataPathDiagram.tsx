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

/**
 * DWG-01: Strictly monochrome Apple-style dimensional schematic of Machine 9
 * (CPU <-> Cache Controller <-> 8-Way BSA Cache <-> 1024-Block Main Memory).
 * Differentiation uses line weight, dash patterns, 45° hatching, and boxed note codes.
 */
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

  const hasActiveStep = !isSnapshotMode && lruStep !== null && mruStep !== null;
  const anyHit = hasActiveStep && (lruStep.outcome === 'HIT' || mruStep.outcome === 'HIT');
  const anyMiss = hasActiveStep && (lruStep.outcome === 'MISS' || mruStep.outcome === 'MISS');
  const anyEvict = hasActiveStep && (lruStep.action === 'EVICT' || mruStep.action === 'EVICT');

  const varRows: [string, string, string][] = [
    ['B', 'BLOCK-W', `${config.blockSize} W`],
    ['n', 'CACHE-BLK', `${config.cacheBlocks} BLK`],
    ['S', 'n / 8', `${partitioning.numSets} ${partitioning.numSets === 1 ? 'SET' : 'SETS'}`],
    ['Tc', 'CACHE-NS', `${config.cacheAccessTime} NS`],
    ['Tm', 'MEM-NS', `${config.memoryAccessTime} NS`],
    [
      'M',
      isLoadThrough ? 'Tc + Tm' : '2Tc + B·Tm',
      `${missPenalty.toFixed(2)} NS`,
    ],
  ];

  return (
    <div className="p-4">
      <div className="trace-scroll overflow-x-auto">
        <svg
          viewBox="0 0 1120 318"
          role="img"
          aria-label={`DWG-01 monochrome technical schematic of Machine 9 CPU to Cache Controller to 8-Way BSA Cache to 1024-Block Main Memory data path using ${
            isLoadThrough ? 'Load-Through' : 'Non-Load-Through'
          } policy with miss penalty ${missPenalty.toFixed(2)} nanoseconds`}
          className="block h-auto w-full min-w-[820px] select-none"
        >
          <defs>
            <pattern
              id="dd01-hatch"
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2="6" stroke="#8C8C8C" strokeWidth="0.9" />
            </pattern>
            <marker
              id="dd01-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6.5"
              markerHeight="6.5"
              orient="auto-start-reverse"
              markerUnits="userSpaceOnUse"
            >
              <path d="M 0 1.6 L 9.5 5 L 0 8.4 z" fill="#111111" />
            </marker>
            <marker
              id="dd01-arrow-muted"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
              markerUnits="userSpaceOnUse"
            >
              <path d="M 0 1.6 L 9.5 5 L 0 8.4 z" fill="#767676" />
            </marker>
          </defs>

          {/* Outer Monochrome Drawing Sheet Frame */}
          <rect
            x="4"
            y="4"
            width="1112"
            height="310"
            rx="6"
            fill="#FFFFFF"
            stroke="#111111"
            strokeWidth="1.2"
          />

          {/* Top Title Strip inside Sheet */}
          <line x1="4" y1="30" x2="1116" y2="30" stroke="#111111" strokeWidth="0.8" />
          <text
            x="16"
            y="21"
            fontFamily="Fira Code, monospace"
            fontSize="10.5"
            fontWeight="600"
            letterSpacing="0.8"
            fill="#111111"
          >
            DWG-01 · CPU ↔ CACHE CONTROLLER ↔ 8-WAY BSA CACHE ↔ MAIN MEMORY DATA PATH
          </text>
          <text
            x="1104"
            y="21"
            textAnchor="end"
            fontFamily="Fira Code, monospace"
            fontSize="9.5"
            letterSpacing="0.6"
            fill="#444444"
          >
            {hasActiveStep && lruStep && mruStep
              ? `STEP ${lruStep.step} · LRU:${lruStep.action === 'COLD_LOAD' ? 'LOAD' : lruStep.action} · MRU:${
                  mruStep.action === 'COLD_LOAD' ? 'LOAD' : mruStep.action
                }`
              : `POLICY: ${isLoadThrough ? 'LOAD-THROUGH' : 'NON-LOAD-THROUGH'} · UNITS: NS / WORDS`}
          </text>

          {/* Vertical Divider Separating Schematic (Left) & Variable Table (Right) */}
          <line x1="864" y1="30" x2="864" y2="294" stroke="#111111" strokeWidth="0.8" />

          {/* === TOP TIMING DIMENSION CHAIN === */}
          <g fontFamily="Fira Code, monospace" fontSize="9.5" fill="#111111">
            <line x1="24" y1="42" x2="24" y2="76" stroke="#111111" strokeWidth="0.55" />
            <line x1="604" y1="42" x2="604" y2="76" stroke="#111111" strokeWidth="0.55" />
            <line x1="844" y1="42" x2="844" y2="76" stroke="#111111" strokeWidth="0.55" />

            {/* On-Chip Span */}
            <line
              x1="28"
              y1="52"
              x2="600"
              y2="52"
              stroke="#111111"
              strokeWidth="0.7"
              markerStart="url(#dd01-arrow)"
              markerEnd="url(#dd01-arrow)"
            />
            <rect x="224" y="43" width="180" height="17" fill="#FFFFFF" />
            <text x="314" y="55" textAnchor="middle" fontWeight="600">
              ON-CHIP · Tc = {config.cacheAccessTime} NS
            </text>

            {/* Off-Chip Span */}
            <line
              x1="608"
              y1="52"
              x2="840"
              y2="52"
              stroke="#111111"
              strokeWidth="0.7"
              markerStart="url(#dd01-arrow)"
              markerEnd="url(#dd01-arrow)"
            />
            <rect x="652" y="43" width="144" height="17" fill="#FFFFFF" />
            <text x="724" y="55" textAnchor="middle" fontWeight="600">
              OFF-CHIP · Tm = {config.memoryAccessTime} NS
            </text>
          </g>

          {/* === BLOCK 1: CPU CORE === */}
          <g fontFamily="Fira Code, monospace">
            <rect
              x="24"
              y="82"
              width="136"
              height="122"
              fill="#FFFFFF"
              stroke="#111111"
              strokeWidth="1.6"
            />
            <line x1="24" y1="106" x2="160" y2="106" stroke="#111111" strokeWidth="0.8" />
            <text x="92" y="98" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#111111">
              CPU CORE
            </text>
            <text x="92" y="126" textAnchor="middle" fontSize="9" fill="#444444">
              REQ BLOCK ADDR
            </text>
            <rect
              x="38"
              y="135"
              width="108"
              height="30"
              fill={hasActiveStep ? '#E8E6E0' : '#F4F3EF'}
              stroke="#111111"
              strokeWidth={hasActiveStep ? '1.3' : '0.8'}
              strokeDasharray={hasActiveStep ? undefined : '4 3'}
            />
            <text x="92" y="154" textAnchor="middle" fontSize="11.5" fontWeight="600" fill="#111111">
              {hasActiveStep && lruStep ? `BLK #${lruStep.blockAddress}` : '0 .. 1023'}
            </text>
            <text x="92" y="188" textAnchor="middle" fontSize="9" fill="#555555">
              A = {partitioning.totalAddressBits}-BIT WORD
            </text>
          </g>

          {/* === BLOCK 2: CACHE CONTROLLER === */}
          <g fontFamily="Fira Code, monospace">
            <rect
              x="216"
              y="82"
              width="160"
              height="122"
              fill="#FFFFFF"
              stroke="#111111"
              strokeWidth="1.6"
            />
            <line x1="216" y1="106" x2="376" y2="106" stroke="#111111" strokeWidth="0.8" />
            <text x="296" y="98" textAnchor="middle" fontSize="10" fontWeight="600" fill="#111111">
              CACHE CONTROLLER
            </text>
            <text x="296" y="125" textAnchor="middle" fontSize="9" fill="#444444">
              TAG COMPARATOR
            </text>
            <rect
              x="230"
              y="134"
              width="132"
              height="26"
              fill="#F4F3EF"
              stroke="#111111"
              strokeWidth="0.8"
              strokeDasharray="4 3"
            />
            <text x="296" y="151" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#111111">
              {hasActiveStep && lruStep
                ? `S:${lruStep.setIndex} · T:${lruStep.tag}`
                : `SET = BLK % ${partitioning.numSets}`}
            </text>
            <text x="296" y="178" textAnchor="middle" fontSize="8.8" fill="#444444">
              AGE UNIT: LRU vs MRU
            </text>
            <text x="296" y="193" textAnchor="middle" fontSize="8.5" fill="#666666">
              8 PARALLEL WAYS
            </text>
            {/* Boxed Note [1] */}
            <rect x="357" y="86" width="14" height="14" fill="#FFFFFF" stroke="#111111" strokeWidth="0.8" />
            <text x="364" y="96.5" textAnchor="middle" fontSize="8.5" fontWeight="600" fill="#111111">
              1
            </text>
          </g>

          {/* === BLOCK 3: 8-WAY BSA CACHE === */}
          <g fontFamily="Fira Code, monospace">
            <rect
              x="430"
              y="82"
              width="174"
              height="122"
              fill={anyHit && !anyMiss ? '#F4F3EF' : '#FFFFFF'}
              stroke="#111111"
              strokeWidth={anyHit || anyMiss ? '2' : '1.6'}
            />
            <line x1="430" y1="106" x2="604" y2="106" stroke="#111111" strokeWidth="0.8" />
            <text x="517" y="98" textAnchor="middle" fontSize="10" fontWeight="600" fill="#111111">
              8-WAY BSA CACHE
            </text>

            {/* 8-Way Slot Array */}
            {Array.from({ length: 8 }, (_, w) => {
              const isHighlightedWay =
                hasActiveStep &&
                ((lruStep && lruStep.wayIndex === w) || (mruStep && mruStep.wayIndex === w));
              return (
                <rect
                  key={w}
                  x={443 + w * 18.5}
                  y={116}
                  width={15}
                  height={28}
                  fill={isHighlightedWay ? '#111111' : '#F4F3EF'}
                  stroke="#111111"
                  strokeWidth="0.8"
                />
              );
            })}
            <text x="517" y="160" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#111111">
              n = {config.cacheBlocks} ({partitioning.numSets}S &times; 8W)
            </text>
            <text x="517" y="176" textAnchor="middle" fontSize="9" fill="#444444">
              B = {config.blockSize} WORDS / BLK
            </text>
            <text x="517" y="192" textAnchor="middle" fontSize="8.5" fill="#666666">
              {anyEvict ? 'STATE: EVICT + FILL' : anyMiss ? 'STATE: COLD LOAD' : anyHit ? 'STATE: CACHE HIT' : 'IDLE / STANDBY'}
            </text>
            {/* Boxed Note [2] */}
            <rect x="585" y="86" width="14" height="14" fill="#FFFFFF" stroke="#111111" strokeWidth="0.8" />
            <text x="592" y="96.5" textAnchor="middle" fontSize="8.5" fontWeight="600" fill="#111111">
              2
            </text>
          </g>

          {/* === BLOCK 4: 1024-BLOCK MAIN MEMORY === */}
          <g fontFamily="Fira Code, monospace">
            <rect
              x="674"
              y="82"
              width="170"
              height="122"
              fill="url(#dd01-hatch)"
              stroke="#111111"
              strokeWidth="1.6"
            />
            <rect
              x="682"
              y="89"
              width="154"
              height="108"
              fill="#FFFFFF"
              stroke="#111111"
              strokeWidth="0.8"
            />
            <line x1="682" y1="110" x2="836" y2="110" stroke="#111111" strokeWidth="0.8" />
            <text x="759" y="103" textAnchor="middle" fontSize="10" fontWeight="600" fill="#111111">
              MAIN MEMORY
            </text>
            <text x="759" y="130" textAnchor="middle" fontSize="10" fontWeight="600" fill="#111111">
              1024 BLOCKS
            </text>
            <text x="759" y="146" textAnchor="middle" fontSize="9" fill="#444444">
              INDICES 0 .. 1023
            </text>
            <text x="759" y="164" textAnchor="middle" fontSize="9" fill="#444444">
              {(1024 * config.blockSize).toLocaleString()} WORDS
            </text>
            <text x="759" y="182" textAnchor="middle" fontSize="8.5" fill="#666666">
              B·Tm = {config.blockSize * config.memoryAccessTime} NS
            </text>
          </g>

          {/* === BUS 1: CPU <-> CONTROLLER === */}
          <g fontFamily="Fira Code, monospace" fontSize="8.5">
            <line
              x1="160"
              y1="126"
              x2="213"
              y2="126"
              stroke="#111111"
              strokeWidth="1.4"
              markerEnd="url(#dd01-arrow)"
            />
            <text x="188" y="119" textAnchor="middle" fill="#444444">
              ADDR
            </text>

            <line
              x1="216"
              y1="162"
              x2="163"
              y2="162"
              stroke="#111111"
              strokeWidth={anyHit ? '2.2' : '1.2'}
              strokeDasharray={anyHit ? undefined : '4 3'}
              markerEnd="url(#dd01-arrow)"
            />
            <text x="188" y="176" textAnchor="middle" fontWeight={anyHit ? '600' : '400'} fill="#111111">
              {anyHit ? 'HIT WORD' : 'WORD'}
            </text>
          </g>

          {/* === BUS 2: CONTROLLER <-> 8-WAY CACHE === */}
          <g fontFamily="Fira Code, monospace" fontSize="8.5">
            <line
              x1="376"
              y1="126"
              x2="427"
              y2="126"
              stroke="#111111"
              strokeWidth="1.4"
              markerEnd="url(#dd01-arrow)"
            />
            <text x="403" y="119" textAnchor="middle" fill="#444444">
              LOOKUP
            </text>

            <line
              x1="430"
              y1="162"
              x2="379"
              y2="162"
              stroke="#111111"
              strokeWidth={anyHit ? '2.2' : '1.2'}
              strokeDasharray={anyHit ? undefined : '4 3'}
              markerEnd="url(#dd01-arrow)"
            />
            <text x="403" y="176" textAnchor="middle" fill="#111111">
              Tc
            </text>
          </g>

          {/* === BUS 3: 8-WAY CACHE <-> MAIN MEMORY === */}
          <g fontFamily="Fira Code, monospace" fontSize="8.5">
            <line
              x1="604"
              y1="126"
              x2="671"
              y2="126"
              stroke={anyMiss ? '#111111' : '#767676'}
              strokeWidth={anyMiss ? '2.2' : '1.1'}
              strokeDasharray={anyMiss ? undefined : '4 3'}
              markerEnd={anyMiss ? 'url(#dd01-arrow)' : 'url(#dd01-arrow-muted)'}
            />
            <text x="639" y="119" textAnchor="middle" fontWeight={anyMiss ? '600' : '400'} fill="#111111">
              MISS REQ
            </text>

            <line
              x1="674"
              y1="162"
              x2="607"
              y2="162"
              stroke={anyMiss ? '#111111' : '#767676'}
              strokeWidth={anyMiss ? '2.2' : '1.1'}
              strokeDasharray={anyMiss ? undefined : '4 3'}
              markerEnd={anyMiss ? 'url(#dd01-arrow)' : 'url(#dd01-arrow-muted)'}
            />
            <text x="639" y="176" textAnchor="middle" fontWeight={anyMiss ? '600' : '400'} fill="#111111">
              {config.blockSize}W BLK
            </text>
          </g>

          {/* === LOWER CHANNEL: LOAD-THROUGH BYPASS PATH === */}
          <g fontFamily="Fira Code, monospace">
            <path
              d="M 759 204 L 759 254 L 92 254 L 92 207"
              fill="none"
              stroke={isLoadThrough ? '#111111' : '#767676'}
              strokeWidth={isLoadThrough ? (anyMiss ? '2.2' : '1.5') : '1'}
              strokeDasharray={isLoadThrough ? undefined : '10 3 2 3'}
              markerEnd={isLoadThrough ? 'url(#dd01-arrow)' : 'url(#dd01-arrow-muted)'}
            />

            <rect
              x="220"
              y="236"
              width="428"
              height="36"
              fill={isLoadThrough ? '#F4F3EF' : '#FFFFFF'}
              stroke={isLoadThrough ? '#111111' : '#767676'}
              strokeWidth={isLoadThrough ? '1.3' : '0.9'}
              strokeDasharray={isLoadThrough ? undefined : '4 3'}
            />
            {/* Boxed Note [3] */}
            <rect x="228" y="247" width="14" height="14" fill="#FFFFFF" stroke="#111111" strokeWidth="0.8" />
            <text x="235" y="257.5" textAnchor="middle" fontSize="8.5" fontWeight="600" fill="#111111">
              3
            </text>

            <text
              x="442"
              y="251"
              textAnchor="middle"
              fontSize="9.5"
              fontWeight="600"
              fill="#111111"
            >
              {isLoadThrough
                ? 'ACTIVE · LOAD-THROUGH WORD BYPASS TO CPU'
                : 'PHANTOM · NON-LOAD-THROUGH (FILL CACHE FIRST)'}
            </text>
            <text x="442" y="265" textAnchor="middle" fontSize="8.8" fill="#444444">
              {isLoadThrough
                ? `M = Tc + Tm = ${config.cacheAccessTime} + ${config.memoryAccessTime} = ${missPenalty.toFixed(2)} NS`
                : `M = Tc + (B·Tm) + Tc = ${config.cacheAccessTime} + (${config.blockSize}·${config.memoryAccessTime}) + ${config.cacheAccessTime} = ${missPenalty.toFixed(2)} NS`}
            </text>
          </g>

          {/* === RIGHT COLUMN: VARIABLE TABLE & NOTES === */}
          <g fontFamily="Fira Code, monospace">
            <text x="878" y="49" fontSize="10" fontWeight="600" letterSpacing="0.8" fill="#111111">
              VARIABLES
            </text>
            <line x1="876" y1="55" x2="1102" y2="55" stroke="#111111" strokeWidth="1" />
            <text x="878" y="67" fontSize="8.5" fill="#555555">
              CODE
            </text>
            <text x="916" y="67" fontSize="8.5" fill="#555555">
              EXPR
            </text>
            <text x="1100" y="67" textAnchor="end" fontSize="8.5" fill="#555555">
              VALUE
            </text>
            <line x1="876" y1="72" x2="1102" y2="72" stroke="#111111" strokeWidth="0.6" />

            {varRows.map(([code, expr, val], i) => {
              const y = 87 + i * 20;
              return (
                <g key={code}>
                  <text x="878" y={y} fontSize="9.5" fontWeight="600" fill="#111111">
                    {code}
                  </text>
                  <text x="916" y={y} fontSize="9" fill="#555555">
                    {expr}
                  </text>
                  <text x="1100" y={y} textAnchor="end" fontSize="9.5" fontWeight="600" fill="#111111">
                    {val}
                  </text>
                  <line x1="876" y1={y + 6} x2="1102" y2={y + 6} stroke="#DDDDDD" strokeWidth="0.6" />
                </g>
              );
            })}

            {/* Numbered Drawing Notes */}
            <text x="878" y="218" fontSize="9.5" fontWeight="600" letterSpacing="0.8" fill="#111111">
              NOTES
            </text>
            <text x="878" y="234" fontSize="8.5" fill="#444444">
              [1] AGE TIES BREAK BY LOWEST WAY.
            </text>
            <text x="878" y="249" fontSize="8.5" fill="#444444">
              [2] SOLID WAY = ACTIVE STEP SLOT.
            </text>
            <text x="878" y="264" fontSize="8.5" fill="#444444">
              [3] DASH-DOT = INACTIVE BYPASS.
            </text>
            <text x="878" y="279" fontSize="8.5" fill="#666666">
              GRAYSCALE SPEC · DO NOT SCALE.
            </text>
          </g>

          {/* Bottom Footer Bar */}
          <line x1="4" y1="294" x2="1116" y2="294" stroke="#111111" strokeWidth="0.8" />
          <text x="16" y="307" fontFamily="Fira Code, monospace" fontSize="8.5" fill="#555555">
            MACHINE 9 · 8-WAY BLOCK SET ASSOCIATIVE · LRU vs. MRU
          </text>
          <text
            x="1104"
            y="307"
            textAnchor="end"
            fontFamily="Fira Code, monospace"
            fontSize="8.5"
            fill="#555555"
          >
            SHEET 1 OF 2 · REV C
          </text>
        </svg>
      </div>
    </div>
  );
};
