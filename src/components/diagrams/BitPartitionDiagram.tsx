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

/**
 * DWG-02: Strictly monochrome Apple-style dimensional drawing of the live
 * TAG | Set | Word address bit-partitioning geometry with closing variable table.
 */
export const BitPartitionDiagram: React.FC<BitPartitionDiagramProps> = ({
  config,
  partitioning,
  activeStep,
  isSnapshotMode,
}) => {
  const { tagBits, setBits, wordBits, totalAddressBits, numSets } = partitioning;
  const hasActiveStep = !isSnapshotMode && activeStep !== null;

  // Proportional horizontal bar [28..836] (808px total) with 120px minimum per segment
  const barX = 28;
  const barY = 104;
  const barH = 54;
  const barW = 808;
  const minSegW = 120;
  const flexW = barW - minSegW * 3;
  const totalWeight = Math.max(1, tagBits + setBits + wordBits);

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
  const cardTop = barBottom + 34;
  const cardH = 38;

  // 3 equal formula cells across [28..836]
  const cardW = 258;
  const card1X = 28;
  const card2X = 303;
  const card3X = 578;
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

  const tagDimLabel = `T = ${tagBits}b [${tagMsb}:${tagLsb}]`;
  const setDimLabel =
    setBits === 0 ? 'S = 0b (1 SET)' : `S = ${setBits}b [${setMsb}:${setLsb}]`;
  const wordDimLabel = `W = ${wordBits}b [${wordMsb}:0]`;

  const pillWidthFor = (label: string, segW: number) =>
    Math.min(segW - 10, Math.max(84, label.length * 6.0 + 12));

  const tagPillW = pillWidthFor(tagDimLabel, tagW);
  const setPillW = pillWidthFor(setDimLabel, setW);
  const wordPillW = pillWidthFor(wordDimLabel, wordW);

  const tableRows: [string, string, string][] = [
    ['A', 'log2(1024·B)', `${totalAddressBits}b`],
    ['T', 'A − S − W', `${tagBits}b`],
    ['S', 'log2(n / 8)', `${setBits}b`],
    ['W', 'log2(B)', `${wordBits}b`],
    ['T+S', 'BLK ADDR', '10b'],
  ];

  return (
    <div className="p-4">
      <div className="trace-scroll overflow-x-auto">
        <svg
          viewBox="0 0 1120 274"
          role="img"
          aria-label={`DWG-02 monochrome address bit partition drawing: ${totalAddressBits} total bits split into ${tagBits} Tag bits, ${setBits} Set bits, and ${wordBits} Word offset bits`}
          className="block h-auto w-full min-w-[820px] select-none"
        >
          <defs>
            <pattern
              id="dd02-hatch"
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line x1="0" y1="0" x2="0" y2="6" stroke="#8C8C8C" strokeWidth="0.9" />
            </pattern>
            <marker
              id="dd02-arrow"
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
          </defs>

          {/* Outer Monochrome Drawing Sheet Frame */}
          <rect
            x="4"
            y="4"
            width="1112"
            height="266"
            rx="6"
            fill="#FFFFFF"
            stroke="#111111"
            strokeWidth="1.2"
          />

          {/* Top Title Strip */}
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
            DWG-02 · LIVE ADDRESS BIT PARTITION (TAG | SET | WORD)
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
            A = T + S + W = {tagBits} + {setBits} + {wordBits} = {totalAddressBits} BITS
          </text>

          {/* Vertical Divider Separating Schematic & Variable Table */}
          <line x1="864" y1="30" x2="864" y2="250" stroke="#111111" strokeWidth="0.8" />

          {/* === OVERALL TOP DIMENSION: A === */}
          <g fontFamily="Fira Code, monospace" fontSize="9.5" fill="#111111">
            <line x1={barX} y1="42" x2={barX} y2={barY - 4} stroke="#111111" strokeWidth="0.55" />
            <line
              x1={barX + barW}
              y1="42"
              x2={barX + barW}
              y2={barY - 4}
              stroke="#111111"
              strokeWidth="0.55"
            />
            <line
              x1={barX + 4}
              y1="50"
              x2={barX + barW - 4}
              y2="50"
              stroke="#111111"
              strokeWidth="0.7"
              markerStart="url(#dd02-arrow)"
              markerEnd="url(#dd02-arrow)"
            />
            <rect x="292" y="41" width="280" height="17" fill="#FFFFFF" />
            <text x="432" y="53" textAnchor="middle" fontWeight="600">
              A = log2(1024·B) = {totalAddressBits} BITS
            </text>
          </g>

          {/* === SUB-FIELD DIMENSION CHAIN (T / S / W) === */}
          <g fontFamily="Fira Code, monospace" fontSize="9" fill="#111111">
            <line x1={setX} y1="68" x2={setX} y2={barY - 4} stroke="#111111" strokeWidth="0.55" />
            <line x1={wordX} y1="68" x2={wordX} y2={barY - 4} stroke="#111111" strokeWidth="0.55" />

            {/* T span */}
            <line
              x1={tagX + 4}
              y1="77"
              x2={setX - 4}
              y2="77"
              stroke="#111111"
              strokeWidth="0.7"
              markerStart="url(#dd02-arrow)"
              markerEnd="url(#dd02-arrow)"
            />
            <rect x={tagMid - tagPillW / 2} y="69" width={tagPillW} height="15" fill="#FFFFFF" />
            <text x={tagMid} y="79.5" textAnchor="middle" fontWeight="600">
              {tagDimLabel}
            </text>

            {/* S span */}
            <line
              x1={setX + 4}
              y1="77"
              x2={wordX - 4}
              y2="77"
              stroke="#111111"
              strokeWidth="0.7"
              markerStart="url(#dd02-arrow)"
              markerEnd="url(#dd02-arrow)"
            />
            <rect x={setMid - setPillW / 2} y="69" width={setPillW} height="15" fill="#FFFFFF" />
            <text x={setMid} y="79.5" textAnchor="middle" fontWeight="600">
              {setDimLabel}
            </text>

            {/* W span */}
            <line
              x1={wordX + 4}
              y1="77"
              x2={barX + barW - 4}
              y2="77"
              stroke="#111111"
              strokeWidth="0.7"
              markerStart="url(#dd02-arrow)"
              markerEnd="url(#dd02-arrow)"
            />
            <rect x={wordMid - wordPillW / 2} y="69" width={wordPillW} height="15" fill="#FFFFFF" />
            <text x={wordMid} y="79.5" textAnchor="middle" fontWeight="600">
              {wordDimLabel}
            </text>
          </g>

          {/* === MAIN BIT PARTITION BAR === */}
          {/* TAG Box */}
          <g fontFamily="Fira Code, monospace">
            <rect
              x={tagX}
              y={barY}
              width={tagW}
              height={barH}
              fill={hasActiveStep ? '#E8E6E0' : '#FFFFFF'}
              stroke="#111111"
              strokeWidth={hasActiveStep ? '1.8' : '1.5'}
            />
            <text x={tagMid} y={barY + 20} textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#444444">
              {hasActiveStep && activeStep ? `TAG = ${activeStep.tag}` : 'TAG FIELD'}
            </text>
            <text
              x={tagMid}
              y={barY + 40}
              textAnchor="middle"
              fontSize="12.5"
              fontWeight="600"
              letterSpacing="1.6"
              fill="#111111"
            >
              {tagBinary ?? '0'.repeat(tagBits)}
            </text>
          </g>

          {/* SET Box */}
          <g fontFamily="Fira Code, monospace">
            <rect
              x={setX}
              y={barY}
              width={setW}
              height={barH}
              fill={setBits === 0 ? 'url(#dd02-hatch)' : hasActiveStep ? '#F4F3EF' : '#FFFFFF'}
              stroke="#111111"
              strokeDasharray={setBits === 0 ? '4 3' : undefined}
              strokeWidth={hasActiveStep && setBits > 0 ? '1.8' : '1.5'}
            />
            {setBits === 0 ? (
              <>
                <rect x={setX + 12} y={barY + 11} width={setW - 24} height={32} fill="#FFFFFF" stroke="#111111" strokeWidth="0.6" />
                <text x={setMid} y={barY + 25} textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#111111">
                  SET = 0
                </text>
                <text x={setMid} y={barY + 38} textAnchor="middle" fontSize="8.5" fill="#555555">
                  (0 BITS)
                </text>
              </>
            ) : (
              <>
                <text x={setMid} y={barY + 20} textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#444444">
                  {hasActiveStep && activeStep ? `SET = ${activeStep.setIndex}` : 'SET FIELD'}
                </text>
                <text
                  x={setMid}
                  y={barY + 40}
                  textAnchor="middle"
                  fontSize="12.5"
                  fontWeight="600"
                  letterSpacing="1.6"
                  fill="#111111"
                >
                  {setBinary ?? '0'.repeat(setBits)}
                </text>
              </>
            )}
          </g>

          {/* WORD Box */}
          <g fontFamily="Fira Code, monospace">
            <rect
              x={wordX}
              y={barY}
              width={wordW}
              height={barH}
              fill="#F4F3EF"
              stroke="#111111"
              strokeWidth="1.5"
            />
            <text x={wordMid} y={barY + 20} textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#444444">
              WORD OFFSET
            </text>
            <text
              x={wordMid}
              y={barY + 40}
              textAnchor="middle"
              fontSize="11.5"
              fontWeight="500"
              letterSpacing="0.8"
              fill="#111111"
            >
              {wordPlaceholder} (0..{config.blockSize - 1})
            </text>
          </g>

          {/* === ORTHOGONAL ELBOW LEADERS TO CLOSING FORMULA CELLS === */}
          <g fontFamily="Fira Code, monospace" fontSize="9.5">
            {/* Leader 1: TAG */}
            <path
              d={`M ${tagMid} ${barBottom} L ${tagMid} ${barBottom + 11} L ${card1Mid} ${barBottom + 11} L ${card1Mid} ${cardTop}`}
              fill="none"
              stroke="#111111"
              strokeWidth="0.8"
            />
            <circle cx={tagMid} cy={barBottom} r="2.2" fill="#111111" />
            <circle cx={card1Mid} cy={cardTop} r="1.8" fill="#111111" />
            <rect x={card1X} y={cardTop} width={cardW} height={cardH} fill="#FFFFFF" stroke="#111111" strokeWidth="0.9" />
            <text x={card1X + 10} y={cardTop + 15} fontWeight="600" fill="#111111">
              TAG = floor(Block / S)
            </text>
            <text x={card1X + 10} y={cardTop + 30} fontSize="9" fill="#444444">
              {hasActiveStep && activeStep
                ? `floor(${activeStep.blockAddress} / ${numSets}) = ${activeStep.tag}`
                : `T = ${totalAddressBits} − ${setBits} − ${wordBits} = ${tagBits} bits`}
            </text>

            {/* Leader 2: SET */}
            <path
              d={`M ${setMid} ${barBottom} L ${setMid} ${barBottom + 17} L ${card2Mid} ${barBottom + 17} L ${card2Mid} ${cardTop}`}
              fill="none"
              stroke="#111111"
              strokeWidth="0.8"
            />
            <circle cx={setMid} cy={barBottom} r="2.2" fill="#111111" />
            <circle cx={card2Mid} cy={cardTop} r="1.8" fill="#111111" />
            <rect x={card2X} y={cardTop} width={cardW} height={cardH} fill="#FFFFFF" stroke="#111111" strokeWidth="0.9" />
            <text x={card2X + 10} y={cardTop + 15} fontWeight="600" fill="#111111">
              SET = Block mod S
            </text>
            <text x={card2X + 10} y={cardTop + 30} fontSize="9" fill="#444444">
              {hasActiveStep && activeStep
                ? `${activeStep.blockAddress} % ${numSets} = Set ${activeStep.setIndex}`
                : `S = ${config.cacheBlocks} / 8 = ${numSets} (${setBits}b)`}
            </text>

            {/* Leader 3: WORD */}
            <path
              d={`M ${wordMid} ${barBottom} L ${wordMid} ${barBottom + 23} L ${card3Mid} ${barBottom + 23} L ${card3Mid} ${cardTop}`}
              fill="none"
              stroke="#111111"
              strokeWidth="0.8"
            />
            <circle cx={wordMid} cy={barBottom} r="2.2" fill="#111111" />
            <circle cx={card3Mid} cy={cardTop} r="1.8" fill="#111111" />
            <rect x={card3X} y={cardTop} width={cardW} height={cardH} fill="#FFFFFF" stroke="#111111" strokeWidth="0.9" />
            <text x={card3X + 10} y={cardTop + 15} fontWeight="600" fill="#111111">
              WORD = log2(B)
            </text>
            <text x={card3X + 10} y={cardTop + 30} fontSize="9" fill="#444444">
              log2({config.blockSize}) = {wordBits} {wordBits === 1 ? 'bit' : 'bits'} ({config.blockSize} words)
            </text>
          </g>

          {/* === RIGHT COLUMN: BIT-WIDTH CLOSING TABLE === */}
          <g fontFamily="Fira Code, monospace">
            <text x="878" y="49" fontSize="10" fontWeight="600" letterSpacing="0.8" fill="#111111">
              BIT TABLE
            </text>
            <line x1="876" y1="55" x2="1102" y2="55" stroke="#111111" strokeWidth="1" />
            <text x="878" y="67" fontSize="8.5" fill="#555555">
              CODE
            </text>
            <text x="916" y="67" fontSize="8.5" fill="#555555">
              FORMULA
            </text>
            <text x="1100" y="67" textAnchor="end" fontSize="8.5" fill="#555555">
              WIDTH
            </text>
            <line x1="876" y1="72" x2="1102" y2="72" stroke="#111111" strokeWidth="0.6" />

            {tableRows.map(([code, formula, val], i) => {
              const y = 87 + i * 20;
              return (
                <g key={code}>
                  <text x="878" y={y} fontSize="9.5" fontWeight="600" fill="#111111">
                    {code}
                  </text>
                  <text x="916" y={y} fontSize="9" fill="#555555">
                    {formula}
                  </text>
                  <text x="1100" y={y} textAnchor="end" fontSize="9.5" fontWeight="600" fill="#111111">
                    {val}
                  </text>
                  <line x1="876" y1={y + 6} x2="1102" y2={y + 6} stroke="#DDDDDD" strokeWidth="0.6" />
                </g>
              );
            })}

            <text x="878" y="202" fontSize="9.5" fontWeight="600" letterSpacing="0.8" fill="#111111">
              ACTIVE BLOCK
            </text>
            <text x="878" y="218" fontSize="9" fill="#444444">
              {hasActiveStep && activeStep
                ? `STEP #${activeStep.step} · BLK ${activeStep.blockAddress}`
                : 'STANDBY (STEP 0 / SNAPSHOT)'}
            </text>
            <text x="878" y="234" fontSize="9" fill="#111111" fontWeight="600">
              {hasActiveStep && activeStep
                ? `BIN: ${toPaddedBinary(activeStep.blockAddress, 10)}`
                : '10-BIT MM BLK: 0..1023'}
            </text>
          </g>

          {/* Bottom Footer Bar */}
          <line x1="4" y1="250" x2="1116" y2="250" stroke="#111111" strokeWidth="0.8" />
          <text x="16" y="263" fontFamily="Fira Code, monospace" fontSize="8.5" fill="#555555">
            MSB [{tagMsb}] → LSB [0] · 45° HATCH INDICATES 0-BIT SET FIELD (n = 8)
          </text>
          <text
            x="1104"
            y="263"
            textAnchor="end"
            fontFamily="Fira Code, monospace"
            fontSize="8.5"
            fill="#555555"
          >
            SHEET 2 OF 2 · REV C
          </text>
        </svg>
      </div>
    </div>
  );
};
