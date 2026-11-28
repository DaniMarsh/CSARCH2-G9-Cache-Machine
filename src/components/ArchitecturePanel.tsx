import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type {
  AddressPartitioning,
  CacheStepSnapshot,
  SimulationConfig,
} from '../engine/types';
import { BitPartitionDiagram } from './diagrams/BitPartitionDiagram';
import { DataPathDiagram } from './diagrams/DataPathDiagram';

interface ArchitecturePanelProps {
  config: SimulationConfig;
  partitioning: AddressPartitioning;
  lruStep: CacheStepSnapshot | null;
  mruStep: CacheStepSnapshot | null;
  isSnapshotMode: boolean;
}

export const ArchitecturePanel: React.FC<ArchitecturePanelProps> = ({
  config,
  partitioning,
  lruStep,
  mruStep,
  isSnapshotMode,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [sheetView, setSheetView] = useState<'both' | 'dwg01' | 'dwg02'>('both');

  const policyLabel =
    config.readPolicy === 'load-through' ? 'Load-Through' : 'Non-Load-Through';

  return (
    <section
      aria-label="Architecture and Address Mapping Diagrams"
      className="sheet overflow-hidden rounded-[4px]"
    >
      {/* Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-rail/70 px-4 py-2.5">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="architecture-diagrams-body"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 text-left text-[13px] font-semibold text-ink-primary transition-colors hover:text-ink-secondary"
        >
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-ink-secondary" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-ink-secondary" aria-hidden="true" />
          )}
          <span>Technical Architecture Drawings (DWG-01 &middot; DWG-02)</span>
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <span className="hidden font-mono text-xs tabular-nums text-ink-muted md:inline">
            {policyLabel} &middot; A={partitioning.totalAddressBits}b (T:{partitioning.tagBits} / S:
            {partitioning.setBits} / W:{partitioning.wordBits})
          </span>

          {isOpen && (
            <div
              role="radiogroup"
              aria-label="Drawing Sheet Selector"
              className="inline-flex items-center gap-3 border-l border-border-subtle pl-3 text-xs"
            >
              {(
                [
                  { id: 'both', label: 'Both Sheets' },
                  { id: 'dwg01', label: 'DWG-01 Path' },
                  { id: 'dwg02', label: 'DWG-02 Bits' },
                ] as const
              ).map((opt) => {
                const active = sheetView === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSheetView(opt.id)}
                    className={`border-b-2 pb-0.5 font-medium transition-colors ${
                      active
                        ? 'border-ink-primary text-ink-primary'
                        : 'border-transparent text-ink-muted hover:text-ink-primary'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Full-Width Stacked Drawing Sheets for Readable 1:1 Technical Typography */}
      {isOpen && (
        <div
          id="architecture-diagrams-body"
          className="divide-y divide-border-subtle bg-surface"
        >
          {sheetView !== 'dwg02' && (
            <DataPathDiagram
              config={config}
              partitioning={partitioning}
              lruStep={lruStep}
              mruStep={mruStep}
              isSnapshotMode={isSnapshotMode}
            />
          )}
          {sheetView !== 'dwg01' && (
            <BitPartitionDiagram
              config={config}
              partitioning={partitioning}
              activeStep={lruStep}
              isSnapshotMode={isSnapshotMode}
            />
          )}
        </div>
      )}
    </section>
  );
};
