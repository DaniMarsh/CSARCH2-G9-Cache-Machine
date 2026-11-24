import React from 'react';
import type {
  AddressPartitioning,
  CacheStepSnapshot,
  SimulationConfig,
} from '../../engine/types';

interface BitPartitionDiagramProps {
  config: SimulationConfig;
  partitioning: AddressPartitioning;
  activeStep: CacheStepSnapshot | null;
  isSnapshotMode: boolean;
}

function toPaddedBinary(value: number, bits: number): string {
  if (bits <= 0) return '—';
  return value.toString(2).padStart(bits, '0');
}

export const BitPartitionDiagram: React.FC<BitPartitionDiagramProps> = ({
  config,
  partitioning,
  activeStep,
  isSnapshotMode,
}) => {
  const { tagBits, setBits, wordBits, totalAddressBits, numSets } = partitioning;
  const hasActiveStep = !isSnapshotMode && activeStep !== null;

  // Proportional horizontal bar [40..820] (780px total) with a 112px floor per field
  // so 0-bit/1-bit Set and 1-bit Word fields never clip labels or dimension pills.
  const barX = 40;
  const barY = 92;
  const barH = 54;
  const barW = 780;
  const minSegW = 112;
  const flexW = barW - minSegW * 3;
  const totalWeight = tagBits + setBits + wordBits;

  const tagW = minSegW + Math.round((tagBits / totalWeight) * flexW);
  const setW = minSegW + Math.round((setBits / totalWeight) * flexW);
  const wordW = barW - tagW - setW;

  const tagX = barX;
  const setX = tagX + tagW;
  const wordX = setX + setW;

  const tagMid = tagX + tagW / 2;
  const setMid = setX + setW / 2;
  const wordMid = wordX + wordW / 2;

  const barBottom = barY + barH;
  const cardTop = barBottom + 30;
  const cardH = 34;

  // Fixed lower formula card geometry (3 equal columns across [40..820])
  const card1X = 40;
  const card2X = 306;
  const card3X = 572;
  const cardW = 248;
  const card1Mid = card1X + cardW / 2;
  const card2Mid = card2X + cardW / 2;
  const card3Mid = card3X + cardW / 2;

  const tagMsb = totalAddressBits - 1;
  const tagLsb = setBits + wordBits;
  const setMsb = setBits + wordBits - 1;
  const setLsb = wordBits;
  const wordMsb = wordBits - 1;

  const tagBinary =
    hasActiveStep && activeStep ? toPaddedBinary(activeStep.tag, tagBits) : null;
  const setBinary =
    hasActiveStep && activeStep ? toPaddedBinary(activeStep.setIndex, setBits) : null;
  const wordPlaceholder = 'x'.repeat(wordBits);

  const tagDimLabel = `TAG: ${tagBits}b [${tagMsb}:${tagLsb}]`;
  const setDimLabel =
    setBits === 0 ? 'SET: 0b (1 SET)' : `SET: ${setBits}b [${setMsb}:${setLsb}]`;
  const wordDimLabel = `WORD: ${wordBits}b [${wordMsb}:0]`;

  const pillWidthFor = (label: string, segW: number) =>
    Math.min(segW - 10, Math.max(76, label.length * 5.6 + 12));

  const tagPillW = pillWidthFor(tagDimLabel, tagW);
  const setPillW = pillWidthFor(setDimLabel, setW);
  const wordPillW = pillWidthFor(wordDimLabel, wordW);

  return (
    <div className="p-4">
      {/* Drawing Sheet Header Strip */}
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] tabular-nums">
        <div className="flex items-center gap-2">
          <span className="rounded border border-ink-primary px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-ink-primary">
            DWG-02
          </span>
          <span className="font-semibold uppercase tracking-wider text-ink-primary">
            Live Address Bit Partition (TAG | Set | Word)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[10px] text-ink-secondary">
          <span>
            TOTAL: <strong className="text-ink-primary">{totalAddressBits} BITS</strong>
          </span>
          <span className="text-border-strong">|</span>
          <span>
            B = <strong className="text-ink-primary">{config.blockSize}</strong>
          </span>
          <span className="text-border-strong">|</span>
          <span>
            n = <strong className="text-ink-primary">{config.cacheBlocks}</strong> ({numSets}{' '}
            {numSets === 1 ? 'set' : 'sets'})
          </span>
        </div>
      </div>

      {/* Dimensional Bit-Field SVG */}
      <svg
        viewBox="0 0 860 252"
        role="img"
        aria-label={`Address bit partition: ${totalAddressBits} total bits split into ${tagBits} Tag bits, ${setBits} Set bits, and ${wordBits} Word offset bits`}
        className="h-auto w-full select-none"
      >
        <defs>
          <pattern
            id="dd-hatch-zero-set"
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
              stroke="var(--border-strong)"
              strokeWidth="1"
            />
          </pattern>
          <marker
            id="dd-bp-arrow"
            viewBox="0 0 10 10"
            refX="8.5"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="var(--ink-primary)" />
          </marker>
        </defs>

        {/* Outer Technical Sheet Border */}
        <rect
          x="6"
          y="6"
          width="848"
          height="240"
          rx="6"
          fill="var(--bg-canvas)"
          fillOpacity="0.55"
          stroke="var(--border-strong)"
          strokeWidth="1"
        />

        {/* === OVERALL TOP DIMENSION: TOTAL ADDRESS BITS === */}
        <g fontFamily="JetBrains Mono, monospace" fontSize="9.5">
          <line x1={barX} y1="26" x2={barX} y2={barY - 4} stroke="var(--border-strong)" strokeWidth="0.65" />
          <line
            x1={barX + barW}
            y1="26"
            x2={barX + barW}
            y2={barY - 4}
            stroke="var(--border-strong)"
            strokeWidth="0.65"
          />
          <line
            x1={barX + 3}
            y1="34"
            x2={barX + barW - 3}
            y2="34"
            stroke="var(--ink-primary)"
            strokeWidth="0.75"
            markerStart="url(#dd-bp-arrow)"
            markerEnd="url(#dd-bp-arrow)"
          />
          <rect x="286" y="25" width="288" height="17" rx="2" fill="var(--bg-surface)" />
          <text
            x="430"
            y="37"
            textAnchor="middle"
            fontWeight="700"
            fill="var(--ink-primary)"
          >
            TOTAL ADDRESS = log2(1024 &times; {config.blockSize}) = {totalAddressBits} BITS
          </text>
        </g>

        {/* === SUB-FIELD DIMENSION CHAIN (TAG / SET / WORD) === */}
        <g fontFamily="JetBrains Mono, monospace" fontSize="8.8">
          <line x1={setX} y1="54" x2={setX} y2={barY - 4} stroke="var(--border-strong)" strokeWidth="0.65" />
          <line x1={wordX} y1="54" x2={wordX} y2={barY - 4} stroke="var(--border-strong)" strokeWidth="0.65" />

          {/* TAG span */}
          <line
            x1={tagX + 3}
            y1="62"
            x2={setX - 3}
            y2="62"
            stroke="var(--ink-muted)"
            strokeWidth="0.7"
            markerStart="url(#dd-bp-arrow)"
            markerEnd="url(#dd-bp-arrow)"
          />
          <rect
            x={tagMid - tagPillW / 2}
            y="54"
            width={tagPillW}
            height="15"
            rx="2"
            fill="var(--bg-surface)"
          />
          <text
            x={tagMid}
            y="64.5"
            textAnchor="middle"
            fontWeight="600"
            fill="var(--accent-primary)"
          >
            {tagDimLabel}
          </text>

          {/* SET span */}
          <line
            x1={setX + 3}
            y1="62"
            x2={wordX - 3}
            y2="62"
            stroke="var(--ink-muted)"
            strokeWidth="0.7"
            markerStart="url(#dd-bp-arrow)"
            markerEnd="url(#dd-bp-arrow)"
          />
          <rect
            x={setMid - setPillW / 2}
            y="54"
            width={setPillW}
            height="15"
            rx="2"
            fill="var(--bg-surface)"
          />
          <text
            x={setMid}
            y="64.5"
            textAnchor="middle"
            fontWeight="600"
            fill="var(--status-hit)"
          >
            {setDimLabel}
          </text>

          {/* WORD span */}
          <line
            x1={wordX + 3}
            y1="62"
            x2={barX + barW - 3}
            y2="62"
            stroke="var(--ink-muted)"
            strokeWidth="0.7"
            markerStart="url(#dd-bp-arrow)"
            markerEnd="url(#dd-bp-arrow)"
          />
          <rect
            x={wordMid - wordPillW / 2}
            y="54"
            width={wordPillW}
            height="15"
            rx="2"
            fill="var(--bg-surface)"
          />
          <text
            x={wordMid}
            y="64.5"
            textAnchor="middle"
            fontWeight="600"
            fill="var(--status-miss)"
          >
            {wordDimLabel}
          </text>
        </g>

        {/* === MAIN BIT PARTITION BAR === */}
        {/* TAG Box */}
        <g>
          <rect
            x={tagX}
            y={barY}
            width={tagW}
            height={barH}
            fill={hasActiveStep ? 'var(--accent-soft)' : 'var(--bg-surface)'}
            stroke={hasActiveStep ? 'var(--accent-primary)' : 'var(--ink-primary)'}
            strokeWidth={hasActiveStep ? '1.8' : '1.5'}
          />
          <text
            x={tagMid}
            y={barY + 20}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fontWeight="700"
            fill="var(--accent-primary)"
          >
            {hasActiveStep && activeStep ? `TAG = ${activeStep.tag}` : 'TAG FIELD'}
          </text>
          <text
            x={tagMid}
            y={barY + 39}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="12"
            fontWeight="600"
            letterSpacing="1.5"
            fill="var(--ink-primary)"
          >
            {tagBinary ?? '0'.repeat(tagBits)}
          </text>
        </g>

        {/* SET INDEX Box */}
        <g>
          <rect
            x={setX}
            y={barY}
            width={setW}
            height={barH}
            fill={
              setBits === 0
                ? 'url(#dd-hatch-zero-set)'
                : hasActiveStep
                ? 'var(--status-hit-bg)'
                : 'var(--bg-surface)'
            }
            stroke={
              setBits === 0
                ? 'var(--border-strong)'
                : hasActiveStep
                ? 'var(--status-hit)'
                : 'var(--ink-primary)'
            }
            strokeDasharray={setBits === 0 ? '4 3' : undefined}
            strokeWidth={hasActiveStep && setBits > 0 ? '1.8' : '1.5'}
          />
          {setBits === 0 ? (
            <>
              <rect
                x={setX + 10}
                y={barY + 11}
                width={setW - 20}
                height={32}
                rx="2"
                fill="var(--bg-surface)"
                fillOpacity="0.94"
              />
              <text
                x={setMid}
                y={barY + 25}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="9.5"
                fontWeight="700"
                fill="var(--status-hit)"
              >
                SET = 0
              </text>
              <text
                x={setMid}
                y={barY + 38}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="8.5"
                fill="var(--ink-muted)"
              >
                (0 bits)
              </text>
            </>
          ) : (
            <>
              <text
                x={setMid}
                y={barY + 20}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="10"
                fontWeight="700"
                fill="var(--status-hit)"
              >
                {hasActiveStep && activeStep ? `SET = ${activeStep.setIndex}` : 'SET FIELD'}
              </text>
              <text
                x={setMid}
                y={barY + 39}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="12"
                fontWeight="600"
                letterSpacing="1.5"
                fill="var(--ink-primary)"
              >
                {setBinary ?? '0'.repeat(setBits)}
              </text>
            </>
          )}
        </g>

        {/* WORD OFFSET Box */}
        <g>
          <rect
            x={wordX}
            y={barY}
            width={wordW}
            height={barH}
            fill="var(--status-miss-bg)"
            fillOpacity={hasActiveStep ? '0.65' : '0.35'}
            stroke="var(--ink-primary)"
            strokeWidth="1.5"
          />
          <text
            x={wordMid}
            y={barY + 20}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fontWeight="700"
            fill="var(--status-miss)"
          >
            WORD OFFSET
          </text>
          <text
            x={wordMid}
            y={barY + 39}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="11"
            fontWeight="500"
            letterSpacing="0.8"
            fill="var(--ink-secondary)"
          >
            {wordPlaceholder} (0..{config.blockSize - 1})
          </text>
        </g>

        {/* === LOWER FORMULA DERIVATION CALLOUTS (ORTHOGONAL ELBOW LEADERS) === */}
        <g fontFamily="JetBrains Mono, monospace" fontSize="9.5">
          {/* Elbow Leader 1: TAG segment -> TAG formula box */}
          <path
            d={`M ${tagMid} ${barBottom} L ${tagMid} ${barBottom + 10} L ${card1Mid} ${barBottom + 10} L ${card1Mid} ${cardTop}`}
            fill="none"
            stroke="var(--accent-primary)"
            strokeWidth="1"
          />
          <circle cx={tagMid} cy={barBottom} r="2.5" fill="var(--accent-primary)" />
          <circle cx={card1Mid} cy={cardTop} r="2" fill="var(--accent-primary)" />
          <rect
            x={card1X}
            y={cardTop}
            width={cardW}
            height={cardH}
            rx="3"
            fill="var(--bg-surface)"
            stroke="var(--border-strong)"
            strokeWidth="0.9"
          />
          <text x={card1X + 10} y={cardTop + 14} fontWeight="700" fill="var(--accent-primary)">
            TAG = floor(Block / numSets)
          </text>
          <text x={card1X + 10} y={cardTop + 27} fill="var(--ink-secondary)">
            {hasActiveStep && activeStep
              ? `floor(${activeStep.blockAddress} / ${numSets}) = ${activeStep.tag}`
              : `width = ${totalAddressBits} − ${setBits} − ${wordBits} = ${tagBits} bits`}
          </text>

          {/* Elbow Leader 2: SET segment -> SET formula box */}
          <path
            d={`M ${setMid} ${barBottom} L ${setMid} ${barBottom + 16} L ${card2Mid} ${barBottom + 16} L ${card2Mid} ${cardTop}`}
            fill="none"
            stroke="var(--status-hit)"
            strokeWidth="1"
          />
          <circle cx={setMid} cy={barBottom} r="2.5" fill="var(--status-hit)" />
          <circle cx={card2Mid} cy={cardTop} r="2" fill="var(--status-hit)" />
          <rect
            x={card2X}
            y={cardTop}
            width={cardW}
            height={cardH}
            rx="3"
            fill="var(--bg-surface)"
            stroke="var(--border-strong)"
            strokeWidth="0.9"
          />
          <text x={card2X + 10} y={cardTop + 14} fontWeight="700" fill="var(--status-hit)">
            SET = Block mod numSets
          </text>
          <text x={card2X + 10} y={cardTop + 27} fill="var(--ink-secondary)">
            {hasActiveStep && activeStep
              ? `${activeStep.blockAddress} % ${numSets} = Set ${activeStep.setIndex}`
              : `numSets = ${config.cacheBlocks} / 8 = ${numSets} (${setBits}b)`}
          </text>

          {/* Elbow Leader 3: WORD segment -> WORD formula box */}
          <path
            d={`M ${wordMid} ${barBottom} L ${wordMid} ${barBottom + 22} L ${card3Mid} ${barBottom + 22} L ${card3Mid} ${cardTop}`}
            fill="none"
            stroke="var(--status-miss)"
            strokeWidth="1"
          />
          <circle cx={wordMid} cy={barBottom} r="2.5" fill="var(--status-miss)" />
          <circle cx={card3Mid} cy={cardTop} r="2" fill="var(--status-miss)" />
          <rect
            x={card3X}
            y={cardTop}
            width={cardW}
            height={cardH}
            rx="3"
            fill="var(--bg-surface)"
            stroke="var(--border-strong)"
            strokeWidth="0.9"
          />
          <text x={card3X + 10} y={cardTop + 14} fontWeight="700" fill="var(--status-miss)">
            WORD = log2(B)
          </text>
          <text x={card3X + 10} y={cardTop + 27} fill="var(--ink-secondary)">
            log2({config.blockSize}) = {wordBits} {wordBits === 1 ? 'bit' : 'bits'} ({config.blockSize} words/blk)
          </text>
        </g>

        {/* Sheet Footer */}
        <text
          x="20"
          y="234"
          fontFamily="JetBrains Mono, monospace"
          fontSize="8.5"
          fill="var(--ink-muted)"
        >
          {hasActiveStep && activeStep
            ? `ACTIVE ACCESS: STEP #${activeStep.step} · MM BLOCK ${activeStep.blockAddress} (10-BIT BLK: ${toPaddedBinary(
                activeStep.blockAddress,
                10
              )})`
            : 'BLOCK ADDRESS WIDTH: log2(1024) = 10 BITS (TAG + SET = 10 BITS)'}
        </text>
        <text
          x="840"
          y="234"
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
          fontSize="8.5"
          fill="var(--ink-muted)"
        >
          MSB [{tagMsb}] &rarr; LSB [0]
        </text>
      </svg>
    </div>
  );
};
