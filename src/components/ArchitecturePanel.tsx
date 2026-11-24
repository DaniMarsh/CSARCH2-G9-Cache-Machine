import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Compass } from 'lucide-react';
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

  const policyLabel =
    config.readPolicy === 'load-through' ? 'Load-Through' : 'Non-Load-Through';

  return (
    <section
      aria-label="Architecture and Address Mapping Diagrams"
      className="overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-card"
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="architecture-diagrams-body"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full flex-wrap items-center justify-between gap-2 bg-subtle/60 px-4 py-3 text-left transition-colors hover:bg-subtle"
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-ink-secondary" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-4 w-4 text-ink-secondary" aria-hidden="true" />
          )}
          <Compass className="h-4 w-4 text-ink-secondary" aria-hidden="true" />
          <h2 className="text-sm font-semibold tracking-tight text-ink-primary">
            Architecture &amp; Address Mapping
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] tabular-nums text-ink-secondary">
          <span className="rounded border border-border-subtle bg-surface px-2 py-0.5">
            {policyLabel}
          </span>
          <span className="rounded border border-border-subtle bg-surface px-2 py-0.5">
            Tag {partitioning.tagBits}b &middot; Set {partitioning.setBits}b &middot; Word{' '}
            {partitioning.wordBits}b
          </span>
          <span className="text-ink-muted">{isOpen ? 'Hide' : 'Expand'}</span>
        </div>
      </button>

      {isOpen && (
        <div
          id="architecture-diagrams-body"
          className="grid grid-cols-1 gap-4 border-t border-border-subtle bg-canvas/40 p-4 xl:grid-cols-2"
        >
          <DataPathDiagram
            config={config}
            partitioning={partitioning}
            lruStep={lruStep}
            mruStep={mruStep}
            isSnapshotMode={isSnapshotMode}
          />
          <BitPartitionDiagram
            config={config}
            partitioning={partitioning}
            activeStep={lruStep}
            isSnapshotMode={isSnapshotMode}
          />
        </div>
      )}
    </section>
  );
};
