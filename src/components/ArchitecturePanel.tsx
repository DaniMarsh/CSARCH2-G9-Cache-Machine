import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Compass } from 'lucide-react';
import { calculateMissPenalty } from '../engine/simulator';
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
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const policyLabel =
    config.readPolicy === 'load-through' ? 'Load-Through' : 'Non-Load-Through';
  const missPenalty = calculateMissPenalty(
    config.blockSize,
    config.readPolicy,
    config.cacheAccessTime,
    config.memoryAccessTime
  );

  return (
    <section
      aria-label="Architecture and Address Mapping Diagrams"
      className="overflow-hidden rounded-lg border border-border-subtle bg-surface"
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="architecture-diagrams-body"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full flex-wrap items-center justify-between gap-2 bg-subtle/45 px-4 py-2.5 text-left transition-colors hover:bg-subtle/80"
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-ink-secondary" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-4 w-4 text-ink-secondary" aria-hidden="true" />
          )}
          <Compass className="h-4 w-4 text-ink-secondary" aria-hidden="true" />
          <h2 className="text-sm font-semibold tracking-tight text-ink-primary">
            Architecture &amp; Address Mapping Diagrams
          </h2>
          <span className="hidden text-xs text-ink-muted sm:inline">
            (DWG-01 Data Path &middot; DWG-02 Bit Partition)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] tabular-nums text-ink-secondary">
          <span>{policyLabel}</span>
          <span className="text-border-strong">&middot;</span>
          <span>
            Tag <strong className="text-ink-primary">{partitioning.tagBits}b</strong> / Set{' '}
            <strong className="text-ink-primary">{partitioning.setBits}b</strong> / Word{' '}
            <strong className="text-ink-primary">{partitioning.wordBits}b</strong>
          </span>
          <span className="text-border-strong">&middot;</span>
          <span>
            M = <strong className="text-ink-primary">{missPenalty.toFixed(2)} ns</strong>
          </span>
          <span className="font-sans text-xs font-medium text-accent-primary">
            {isOpen ? 'Hide' : 'Show diagrams'}
          </span>
        </div>
      </button>

      {isOpen && (
        <div
          id="architecture-diagrams-body"
          className="grid grid-cols-1 divide-y divide-border-subtle border-t border-border-subtle bg-surface xl:grid-cols-2 xl:divide-x xl:divide-y-0"
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
