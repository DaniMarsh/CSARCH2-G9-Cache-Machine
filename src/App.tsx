import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MonitorPlay, PanelLeftClose, PanelLeftOpen, SlidersHorizontal } from 'lucide-react';
import {
  calculateMetrics,
  calculateMissPenalty,
  computeAddressPartitioning,
  runDualSimulation,
} from './engine/simulator';
import {
  generateMidRepeatSequence,
  generateRandomSequence,
  generateSequentialSequence,
  parseCustomSequence,
} from './engine/testCases';
import type { SimulationConfig, ViewMode } from './engine/types';
import { ArchitecturePanel } from './components/ArchitecturePanel';
import { CacheGrid } from './components/CacheGrid';
import { ComparisonStats } from './components/ComparisonStats';
import { ConfigPanel, type PresetType } from './components/ConfigPanel';
import { PlaybackBar } from './components/PlaybackBar';
import { StepCalloutBanner } from './components/StepCalloutBanner';
import { TraceLog } from './components/TraceLog';
import { TraceRibbon } from './components/TraceRibbon';

const DEFAULT_CONFIG: SimulationConfig = {
  blockSize: 16,
  cacheBlocks: 16,
  readPolicy: 'non-load-through',
  cacheAccessTime: 1,
  memoryAccessTime: 10,
};

const INITIAL_SEED = 202609;

function formatSequence(seq: number[]): string {
  return seq.join(', ');
}

export const App: React.FC = () => {
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [activePreset, setActivePreset] = useState<PresetType>('sequential');
  const [randomSeed, setRandomSeed] = useState<number>(INITIAL_SEED);
  const [rawSequence, setRawSequence] = useState<string>(() =>
    formatSequence(generateSequentialSequence(DEFAULT_CONFIG.cacheBlocks))
  );
  const [sequence, setSequence] = useState<number[]>(() =>
    generateSequentialSequence(DEFAULT_CONFIG.cacheBlocks)
  );
  const [sequenceError, setSequenceError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('step-by-step');
  const [gridLayout, setGridLayout] = useState<'side-by-side' | 'stacked' | 'lru' | 'mru'>(
    'side-by-side'
  );
  const [inspectorTab, setInspectorTab] = useState<'trace' | 'diagrams'>('trace');
  const [railOpen, setRailOpen] = useState<boolean>(true);
  const [presentationMode, setPresentationMode] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(450);

  // Pre-compute full dual simulation traces synchronously whenever config or valid sequence changes
  const simulation = useMemo(
    () => runDualSimulation(sequence, config),
    [sequence, config]
  );

  const partitioning = useMemo(
    () => computeAddressPartitioning(config.blockSize, config.cacheBlocks),
    [config.blockSize, config.cacheBlocks]
  );

  const missPenalty = useMemo(
    () =>
      calculateMissPenalty(
        config.blockSize,
        config.readPolicy,
        config.cacheAccessTime,
        config.memoryAccessTime
      ),
    [config]
  );

  // Regenerate preset sequence automatically when `n` changes for n-dependent presets
  const handleConfigChange = (next: SimulationConfig) => {
    setConfig(next);
    if (next.cacheBlocks !== config.cacheBlocks) {
      if (activePreset === 'sequential') {
        const seq = generateSequentialSequence(next.cacheBlocks);
        setSequence(seq);
        setRawSequence(formatSequence(seq));
        setSequenceError(null);
        setCurrentStepIndex(0);
        setIsPlaying(false);
      } else if (activePreset === 'mid-repeat') {
        const seq = generateMidRepeatSequence(next.cacheBlocks);
        setSequence(seq);
        setRawSequence(formatSequence(seq));
        setSequenceError(null);
        setCurrentStepIndex(0);
        setIsPlaying(false);
      }
    }
  };

  const handleSelectPreset = (preset: PresetType) => {
    setActivePreset(preset);
    setIsPlaying(false);
    setCurrentStepIndex(0);

    if (preset === 'sequential') {
      const seq = generateSequentialSequence(config.cacheBlocks);
      setSequence(seq);
      setRawSequence(formatSequence(seq));
      setSequenceError(null);
    } else if (preset === 'mid-repeat') {
      const seq = generateMidRepeatSequence(config.cacheBlocks);
      setSequence(seq);
      setRawSequence(formatSequence(seq));
      setSequenceError(null);
    } else if (preset === 'random') {
      const seq = generateRandomSequence(randomSeed, 64);
      setSequence(seq);
      setRawSequence(formatSequence(seq));
      setSequenceError(null);
    }
  };

  const handleRerollRandom = () => {
    const nextSeed = Math.floor(Math.random() * 900000) + 100000;
    setRandomSeed(nextSeed);
    setActivePreset('random');
    const seq = generateRandomSequence(nextSeed, 64);
    setSequence(seq);
    setRawSequence(formatSequence(seq));
    setSequenceError(null);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const handleRawSequenceChange = (val: string) => {
    setRawSequence(val);
    setActivePreset('custom');
    const parsed = parseCustomSequence(val);
    if (parsed.valid) {
      setSequence(parsed.sequence);
      setSequenceError(null);
      setCurrentStepIndex(0);
      setIsPlaying(false);
    } else {
      setSequenceError(parsed.error ?? 'Invalid sequence.');
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setIsPlaying(false);
  };

  const handleStepTo = useCallback(
    (stepIndex: number) => {
      const clamped = Math.max(0, Math.min(sequence.length, stepIndex));
      setCurrentStepIndex(clamped);
      if (clamped >= sequence.length) {
        setIsPlaying(false);
      }
    },
    [sequence.length]
  );

  const handleInspectStep = useCallback(
    (stepIndex: number) => {
      if (viewMode === 'snapshot') {
        setViewMode('step-by-step');
      }
      setIsPlaying(false);
      handleStepTo(stepIndex);
    },
    [viewMode, handleStepTo]
  );

  const handleTogglePlay = useCallback(() => {
    if (sequence.length === 0) return;
    if (currentStepIndex >= sequence.length) {
      setCurrentStepIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [currentStepIndex, sequence.length]);

  // Synchronized keyboard controls for live demos (ignored while editing inputs)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === 'p' || event.key === 'P') {
        event.preventDefault();
        setPresentationMode((prev) => !prev);
        return;
      }

      if (viewMode !== 'step-by-step') return;

      if (event.code === 'Space') {
        if (target && (target.tagName === 'BUTTON' || target.tagName === 'TR')) {
          return;
        }
        event.preventDefault();
        handleTogglePlay();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setIsPlaying(false);
        handleStepTo(currentStepIndex + 1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setIsPlaying(false);
        handleStepTo(currentStepIndex - 1);
      } else if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        setIsPlaying(false);
        handleStepTo(0);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [viewMode, currentStepIndex, handleStepTo, handleTogglePlay]);

  // Animated playback timer
  useEffect(() => {
    if (!isPlaying || viewMode !== 'step-by-step') return;
    const timer = window.setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= sequence.length) {
          setIsPlaying(false);
          return prev;
        }
        const next = prev + 1;
        if (next >= sequence.length) {
          setIsPlaying(false);
        }
        return next;
      });
    }, playbackSpeedMs);

    return () => window.clearInterval(timer);
  }, [isPlaying, viewMode, playbackSpeedMs, sequence.length]);

  // Derived states for current step vs final snapshot
  const isSnapshotMode = viewMode === 'snapshot';
  const effectiveIndex = isSnapshotMode ? sequence.length : currentStepIndex;

  const zeroMetrics = useMemo(() => calculateMetrics(0, 0, config), [config]);

  const lruActiveStep =
    effectiveIndex > 0 ? simulation.lru.steps[effectiveIndex - 1] ?? null : null;
  const mruActiveStep =
    effectiveIndex > 0 ? simulation.mru.steps[effectiveIndex - 1] ?? null : null;

  const lruDisplayedCache = isSnapshotMode
    ? simulation.lru.finalCacheState
    : lruActiveStep
    ? lruActiveStep.cacheState
    : simulation.lru.initialCacheState;

  const mruDisplayedCache = isSnapshotMode
    ? simulation.mru.finalCacheState
    : mruActiveStep
    ? mruActiveStep.cacheState
    : simulation.mru.initialCacheState;

  const lruDisplayedMetrics = isSnapshotMode
    ? simulation.lru.finalMetrics
    : lruActiveStep
    ? lruActiveStep.stats
    : zeroMetrics;

  const mruDisplayedMetrics = isSnapshotMode
    ? simulation.mru.finalMetrics
    : mruActiveStep
    ? mruActiveStep.stats
    : zeroMetrics;

  const stepLabel = isSnapshotMode
    ? `Final Snapshot (${sequence.length} accesses)`
    : effectiveIndex === 0
    ? 'Initial Empty Cache (Step 0)'
    : `Through Step ${effectiveIndex} of ${sequence.length}`;

  const policyLabel =
    config.readPolicy === 'load-through' ? 'Load-Through' : 'Non-Load-Through';

  const showConfigRail = !presentationMode && railOpen;

  return (
    <div className="app-shell flex min-h-screen flex-col bg-canvas text-ink-primary">
      {/* Committed Prussian Blueprint Top Instrument Bar */}
      <header className="border-b border-shell-border bg-shell text-shell-ink">
        <div className="app-shell-header flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-3">
            {!presentationMode && (
              <button
                type="button"
                aria-expanded={railOpen}
                aria-label={railOpen ? 'Hide parameters rail' : 'Show parameters rail'}
                title={railOpen ? 'Collapse parameters rail' : 'Expand parameters rail'}
                onClick={() => setRailOpen((prev) => !prev)}
                className="inline-flex items-center justify-center rounded-[3px] border border-shell-border bg-shell-elevated p-1.5 text-shell-muted transition-colors hover:border-shell-muted hover:text-shell-ink"
              >
                {railOpen ? (
                  <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            )}

            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <h1 className="text-sm font-bold tracking-tight text-shell-ink sm:text-[15px]">
                CSARCH2 Cache Memory Simulator
              </h1>
              <span className="font-mono text-[11px] text-shell-muted">
                Machine 9 &middot; 8-Way BSA (LRU vs. MRU)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Hardware Spec Readout */}
            <div className="hidden items-center gap-2 font-mono text-[11px] tabular-nums text-shell-muted xl:flex">
              <span>
                n=<strong className="text-shell-ink">{config.cacheBlocks}</strong> (
                {partitioning.numSets}s&times;8w)
              </span>
              <span className="text-shell-border">/</span>
              <span>
                B=<strong className="text-shell-ink">{config.blockSize}</strong>w
              </span>
              <span className="text-shell-border">/</span>
              <span>
                T:<strong className="text-shell-ink">{partitioning.tagBits}</strong> S:
                <strong className="text-shell-ink">{partitioning.setBits}</strong> W:
                <strong className="text-shell-ink">{partitioning.wordBits}</strong>
              </span>
              <span className="text-shell-border">/</span>
              <span>
                M=<strong className="text-shell-ink">{missPenalty.toFixed(2)}ns</strong>
              </span>
            </div>

            {/* Global View Mode Switch (Step-by-Step vs Final Snapshot) */}
            <div
              role="group"
              aria-label="Simulation View Mode"
              className="inline-flex overflow-hidden rounded-[3px] border border-shell-border bg-shell-elevated text-xs"
            >
              <button
                type="button"
                aria-pressed={viewMode === 'step-by-step'}
                onClick={() => handleViewModeChange('step-by-step')}
                className={`px-2.5 py-1 font-medium transition-colors ${
                  viewMode === 'step-by-step'
                    ? 'bg-surface text-ink-primary'
                    : 'text-shell-muted hover:text-shell-ink'
                }`}
              >
                Step-by-Step
              </button>
              <button
                type="button"
                aria-pressed={viewMode === 'snapshot'}
                onClick={() => handleViewModeChange('snapshot')}
                className={`border-l border-shell-border px-2.5 py-1 font-medium transition-colors ${
                  viewMode === 'snapshot'
                    ? 'bg-surface text-ink-primary'
                    : 'text-shell-muted hover:text-shell-ink'
                }`}
              >
                Final Snapshot
              </button>
            </div>

            {/* Presentation Mode Toggle */}
            <button
              type="button"
              aria-pressed={presentationMode}
              onClick={() => setPresentationMode((prev) => !prev)}
              title="Toggle Presentation Mode (P)"
              className={`inline-flex items-center gap-1.5 rounded-[3px] border px-2.5 py-1 text-xs font-medium transition-colors ${
                presentationMode
                  ? 'border-accent-border bg-accent-primary text-white'
                  : 'border-shell-border bg-shell-elevated text-shell-ink hover:border-shell-muted'
              }`}
            >
              {presentationMode ? (
                <>
                  <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                  Exit Presentation
                </>
              ) : (
                <>
                  <MonitorPlay className="h-3.5 w-3.5" aria-hidden="true" />
                  Present
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Presentation Mode Inline Hardware Banner */}
      {presentationMode && (
        <div
          aria-label="Active Configuration Summary"
          className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-rail px-4 py-1.5 font-mono text-[11px] tabular-nums text-ink-secondary"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-[2px] bg-accent-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">
              PRESENTATION
            </span>
            <span>
              n=<strong className="text-ink-primary">{config.cacheBlocks}</strong> ({partitioning.numSets}s&times;8w)
            </span>
            <span className="text-border-strong">|</span>
            <span>
              B=<strong className="text-ink-primary">{config.blockSize}</strong>w
            </span>
            <span className="text-border-strong">|</span>
            <strong className="text-ink-primary">{policyLabel}</strong>
            <span className="text-border-strong">|</span>
            <span>
              Tc=<strong className="text-ink-primary">{config.cacheAccessTime}ns</strong>, Tm=
              <strong className="text-ink-primary">{config.memoryAccessTime}ns</strong>
            </span>
            <span className="text-border-strong">|</span>
            <span>
              Seq=<strong className="text-ink-primary">{sequence.length}</strong>
            </span>
          </div>
          <span className="text-ink-muted">
            Space (Play) &middot; &larr;/&rarr; (Step) &middot; R (Reset) &middot; P (Controls)
          </span>
        </div>
      )}

      {/* Full-Bleed Split Workbench: Left Parameter Rail + Right Simulation Stage */}
      <div
        className={`workbench-layout grid flex-1 grid-cols-1 ${
          showConfigRail ? 'lg:grid-cols-[272px_minmax(0,1fr)]' : ''
        }`}
      >
        {showConfigRail && (
          <ConfigPanel
            config={config}
            partitioning={partitioning}
            activePreset={activePreset}
            randomSeed={randomSeed}
            rawSequence={rawSequence}
            sequenceError={sequenceError}
            sequenceLength={sequence.length}
            onConfigChange={handleConfigChange}
            onSelectPreset={handleSelectPreset}
            onRerollRandom={handleRerollRandom}
            onRawSequenceChange={handleRawSequenceChange}
          />
        )}

        {/* Right Main Simulation Stage */}
        <main className="app-stage flex min-w-0 flex-col bg-surface">
          {/* 1. Sticky Stage Control Band: Playback + Dual-Track Trace Ribbon + Decision Strip */}
          <section
            aria-label="Playback and Step Telemetry"
            className="stage-control-band border-b border-border-strong bg-surface md:sticky md:top-0 md:z-30"
          >
            <PlaybackBar
              viewMode={viewMode}
              currentStepIndex={currentStepIndex}
              sequenceLength={sequence.length}
              isPlaying={isPlaying}
              playbackSpeedMs={playbackSpeedMs}
              hasSequenceError={sequenceError !== null}
              onTogglePlay={handleTogglePlay}
              onStepTo={handleStepTo}
              onSpeedChange={setPlaybackSpeedMs}
            />

            <TraceRibbon
              lruSteps={simulation.lru.steps}
              mruSteps={simulation.mru.steps}
              currentStepIndex={currentStepIndex}
              isSnapshotMode={isSnapshotMode}
              onSelectStep={handleInspectStep}
            />

            {!isSnapshotMode && (
              <StepCalloutBanner
                lruStep={lruActiveStep}
                mruStep={mruActiveStep}
                totalSteps={sequence.length}
                nextBlockPreview={sequence.length > 0 ? sequence[0] : null}
              />
            )}
          </section>

          {/* 2. Centerpiece: Dual 8-Way Cache Memory Matrices */}
          <section aria-label="Visual Cache Memory Grids" className="matrix-section bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-canvas/70 px-4 py-2">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-secondary">
                  Cache Memory Matrices (S0&ndash;S{partitioning.numSets - 1}, Ways 0&ndash;7)
                </h2>
                <span className="font-mono text-[10.5px] text-ink-muted">
                  V: Valid &middot; A: Age &middot; B: Block &middot; T: Tag
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {/* Inline Semantic Legend */}
                <div
                  className="flex items-center gap-2.5 font-mono text-[10.5px]"
                  aria-label="Cache Event Legend"
                >
                  <span className="inline-flex items-center gap-1 font-medium text-status-hit">
                    <span className="h-2 w-2 rounded-[1px] bg-status-hit" aria-hidden="true" />
                    Hit
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-status-miss">
                    <span className="h-2 w-2 rounded-[1px] bg-status-miss" aria-hidden="true" />
                    Load
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-status-evict">
                    <span className="h-2 w-2 rounded-[1px] bg-status-evict" aria-hidden="true" />
                    Evict
                  </span>
                </div>

                {/* Underlined Matrix Layout Tabs */}
                <div
                  role="group"
                  aria-label="Cache Grid Layout"
                  className="inline-flex items-center gap-3 text-xs sm:border-l sm:border-border-subtle sm:pl-3"
                >
                  {(
                    [
                      { id: 'side-by-side', label: 'Side-by-Side', mobileLabel: 'Both', xlOnly: false },
                      { id: 'stacked', label: 'Stacked', mobileLabel: 'Stacked', xlOnly: true },
                      { id: 'lru', label: 'LRU', mobileLabel: 'LRU', xlOnly: false },
                      { id: 'mru', label: 'MRU', mobileLabel: 'MRU', xlOnly: false },
                    ] as const
                  ).map((opt) => {
                    const active = gridLayout === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setGridLayout(opt.id)}
                        className={`${opt.xlOnly ? 'hidden xl:inline-block' : ''} border-b-2 pb-0.5 font-medium transition-colors ${
                          active
                            ? 'border-accent-primary text-accent-primary'
                            : 'border-transparent text-ink-secondary hover:text-ink-primary'
                        }`}
                      >
                        <span className="xl:hidden">{opt.mobileLabel}</span>
                        <span className="hidden xl:inline">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div
              className={
                gridLayout === 'side-by-side'
                  ? 'grid grid-cols-1 divide-y divide-border-subtle xl:grid-cols-2 xl:divide-x xl:divide-y-0'
                  : 'grid grid-cols-1 divide-y divide-border-subtle'
              }
            >
              {gridLayout !== 'mru' && (
                <CacheGrid
                  policy="LRU"
                  cacheState={lruDisplayedCache}
                  activeStep={lruActiveStep}
                  highlightActive={!isSnapshotMode}
                  compact={gridLayout === 'side-by-side'}
                />
              )}
              {gridLayout !== 'lru' && (
                <CacheGrid
                  policy="MRU"
                  cacheState={mruDisplayedCache}
                  activeStep={mruActiveStep}
                  highlightActive={!isSnapshotMode}
                  compact={gridLayout === 'side-by-side'}
                />
              )}
            </div>
          </section>

          {/* 3. Unified Performance Comparison Ledger */}
          <ComparisonStats
            lruMetrics={lruDisplayedMetrics}
            mruMetrics={mruDisplayedMetrics}
            config={config}
            stepLabel={stepLabel}
          />

          {/* 4. Tabbed Bottom Analysis Inspector (Execution Trace Log | Architecture Diagrams) */}
          <section
            aria-label="Trace and Architecture Inspector"
            className="analysis-inspector border-t border-border-subtle bg-surface"
          >
            <div
              role="tablist"
              aria-label="Analysis Views"
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-subtle/40 px-4"
            >
              <div className="flex items-center gap-6">
                <button
                  type="button"
                  role="tab"
                  aria-selected={inspectorTab === 'trace'}
                  onClick={() => setInspectorTab('trace')}
                  className={`border-b-2 py-2.5 text-xs font-semibold transition-colors ${
                    inspectorTab === 'trace'
                      ? 'border-accent-primary text-ink-primary'
                      : 'border-transparent text-ink-secondary hover:text-ink-primary'
                  }`}
                >
                  Execution Trace Log{' '}
                  <span className="ml-1 font-mono text-[11px] font-normal tabular-nums text-ink-muted">
                    ({simulation.lru.steps.length})
                  </span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={inspectorTab === 'diagrams'}
                  onClick={() => setInspectorTab('diagrams')}
                  className={`border-b-2 py-2.5 text-xs font-semibold transition-colors ${
                    inspectorTab === 'diagrams'
                      ? 'border-accent-primary text-ink-primary'
                      : 'border-transparent text-ink-secondary hover:text-ink-primary'
                  }`}
                >
                  Architecture Diagrams{' '}
                  <span className="ml-1 font-mono text-[11px] font-normal text-ink-muted">
                    (DWG-01 &middot; DWG-02)
                  </span>
                </button>
              </div>

              <span className="hidden font-mono text-[10.5px] tabular-nums text-ink-muted sm:inline">
                {policyLabel} &middot; Tag {partitioning.tagBits}b / Set {partitioning.setBits}b /
                Word {partitioning.wordBits}b &middot; M = {missPenalty.toFixed(2)} ns
              </span>
            </div>

            {inspectorTab === 'trace' ? (
              <TraceLog
                lruResult={simulation.lru}
                mruResult={simulation.mru}
                config={config}
                partitioning={partitioning}
                viewMode={viewMode}
                currentStepIndex={currentStepIndex}
                onSelectStep={handleInspectStep}
              />
            ) : (
              <ArchitecturePanel
                config={config}
                partitioning={partitioning}
                lruStep={lruActiveStep}
                mruStep={mruActiveStep}
                isSnapshotMode={isSnapshotMode}
              />
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default App;
