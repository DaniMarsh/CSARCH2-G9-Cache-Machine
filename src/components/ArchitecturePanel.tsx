import React from 'react';
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
  return (
    <div
      id="architecture-diagrams-body"
      aria-label="Architecture and Address Mapping Diagrams"
      className="grid grid-cols-1 divide-y divide-border-subtle bg-surface xl:grid-cols-2 xl:divide-x xl:divide-y-0"
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
  );
};
