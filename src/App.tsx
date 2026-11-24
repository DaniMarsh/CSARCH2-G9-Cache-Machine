import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Columns2, Layers, MonitorPlay, Rows2, SlidersHorizontal } from 'lucide-react';
import {
  calculateMetrics,
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

  return (
    <div className="min-h-screen bg-canvas text-ink-primary">
      {/* Minimalist Stationery Header */}
      <header className="border-b border-border-subtle bg-surface">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border-strong bg-subtle text-ink-primary">
              <Layers className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-ink-primary sm:text-lg">
                CSARCH2 Cache Memory Simulator
              </h1>
              <p className="text-xs text-ink-secondary">
                Machine 9 &middot; 8-Way Block Set Associative (BSA) &middot; LRU vs. MRU Replacement
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Semantic Legend */}
            <div
              className="flex flex-wrap items-center gap-1.5 text-xs"
              aria-label="Cache Event Legend"
            >
              <span className="inline-flex items-center gap-1.5 rounded border border-status-hit-border bg-status-hit-bg px-2 py-0.5 font-medium text-status-hit">
                <span className="h-2 w-2 rounded-full bg-status-hit" aria-hidden="true" />
                Hit
              </span>
              <span className="inline-flex items-center gap-1.5 rounded border border-status-miss-border bg-status-miss-bg px-2 py-0.5 font-medium text-status-miss">
                <span className="h-2 w-2 rounded-full bg-status-miss" aria-hidden="true" />
                Miss / Load
              </span>
              <span className="inline-flex items-center gap-1.5 rounded border border-status-evict-border bg-status-evict-bg px-2 py-0.5 font-medium text-status-evict">
                <span className="h-2 w-2 rounded-full bg-status-evict" aria-hidden="true" />
                Evicted
              </span>
            </div>

            {/* Presentation Mode Toggle */}
            <button
              type="button"
              aria-pressed={presentationMode}
              onClick={() => setPresentationMode((prev) => !prev)}
              title="Toggle Presentation Mode (P)"
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                presentationMode
                  ? 'border-accent-primary bg-accent-primary text-white hover:bg-accent-primary/90'
                  : 'border-border-strong bg-surface text-ink-primary hover:bg-hover'
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
                  Presentation Mode
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Workbench */}
      <main className="mx-auto max-w-[1440px] space-y-4 px-4 py-5 sm:px-6">
        {/* 1. Configuration Panel (Hidden cleanly in Presentation Mode) */}
        {presentationMode ? (
          <div
            aria-label="Active Configuration Summary"
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-subtle bg-surface px-4 py-2.5 font-mono text-xs tabular-nums shadow-card"
          >
            <div className="flex flex-wrap items-center gap-2 text-ink-secondary">
              <span className="rounded bg-accent-soft px-2 py-0.5 font-semibold text-accent-primary">
                PRESENTATION MODE
              </span>
              <span>
                n=<strong className="text-ink-primary">{config.cacheBlocks}</strong> ({partitioning.numSets}s&times;8w)
              </span>
              <span className="text-border-strong">|</span>
              <span>
                B=<strong className="text-ink-primary">{config.blockSize}</strong>w
              </span>
              <span className="text-border-strong">|</span>
              <span>
                <strong className="text-ink-primary">{policyLabel}</strong>
              </span>
              <span className="text-border-strong">|</span>
              <span>
                Tc=<strong className="text-ink-primary">{config.cacheAccessTime}ns</strong>, Tm=
                <strong className="text-ink-primary">{config.memoryAccessTime}ns</strong>
              </span>
              <span className="text-border-strong">|</span>
              <span>
                Seq=<strong className="text-ink-primary">{sequence.length}</strong> accesses
              </span>
            </div>
            <span className="text-[11px] text-ink-muted">
              Keys: Space (Play) &middot; &larr;/&rarr; (Step) &middot; R (Reset) &middot; P (Controls)
            </span>
          </div>
        ) : (
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

        {/* 2. Synchronized Playback Bar & View Mode Toggle (Always Accessible) */}
        <PlaybackBar
          viewMode={viewMode}
          currentStepIndex={currentStepIndex}
          sequenceLength={sequence.length}
          isPlaying={isPlaying}
          playbackSpeedMs={playbackSpeedMs}
          onViewModeChange={handleViewModeChange}
          onTogglePlay={handleTogglePlay}
          onStepTo={handleStepTo}
          onSpeedChange={setPlaybackSpeedMs}
        />

        {/* 3. Stageshow Step Callout Banner (Step-by-Step Mode) */}
        {!isSnapshotMode && (
          <StepCalloutBanner
            lruStep={lruActiveStep}
            mruStep={mruActiveStep}
            totalSteps={sequence.length}
            nextBlockPreview={sequence.length > 0 ? sequence[0] : null}
          />
        )}

        {/* 4. Collapsible Architecture & Address Mapping Diagrams */}
        <ArchitecturePanel
          config={config}
          partitioning={partitioning}
          lruStep={lruActiveStep}
          mruStep={mruActiveStep}
          isSnapshotMode={isSnapshotMode}
        />

        {/* 5. Side-by-Side Comparison Metrics */}
        <ComparisonStats
          lruMetrics={lruDisplayedMetrics}
          mruMetrics={mruDisplayedMetrics}
          config={config}
          stepLabel={stepLabel}
        />

        {/* 6. Visual Cache Memory Grids (LRU vs MRU) */}
        <section aria-label="Visual Cache Memory Grids" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-ink-primary">
                Cache Memory Grids (Set 0 &ndash; Set {partitioning.numSets - 1}, Ways 0 &ndash; 7)
              </h2>
              <p className="font-mono text-[11px] text-ink-muted">
                Cell fields: V (Valid bit) &middot; A (Age) &middot; B (MM Block #) &middot; T (Tag)
              </p>
            </div>

            {/* Grid Layout Mode Toggle */}
            <div
              role="radiogroup"
              aria-label="Cache Grid Layout"
              className="inline-flex rounded-md border border-border-subtle bg-subtle p-0.5 text-xs"
            >
              {(
                [
                  { id: 'side-by-side', label: 'Side-by-Side', icon: Columns2 },
                  { id: 'stacked', label: 'Stacked', icon: Rows2 },
                  { id: 'lru', label: 'LRU Only', icon: null },
                  { id: 'mru', label: 'MRU Only', icon: null },
                ] as const
              ).map((opt) => {
                const active = gridLayout === opt.id;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setGridLayout(opt.id)}
                    className={`inline-flex items-center gap-1 rounded px-2.5 py-1 font-medium transition-colors ${
                      active
                        ? 'bg-surface text-ink-primary shadow-sm ring-1 ring-border-subtle'
                        : 'text-ink-secondary hover:text-ink-primary'
                    }`}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className={
              gridLayout === 'side-by-side'
                ? 'grid grid-cols-1 gap-4 xl:grid-cols-2'
                : 'grid grid-cols-1 gap-4'
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

        {/* 7. Text Trace Log (Available in Both Modes) */}
        <TraceLog
          lruResult={simulation.lru}
          mruResult={simulation.mru}
          config={config}
          partitioning={partitioning}
          viewMode={viewMode}
          currentStepIndex={currentStepIndex}
          onSelectStep={(step) => {
            if (viewMode === 'snapshot') {
              setViewMode('step-by-step');
            }
            setIsPlaying(false);
            setCurrentStepIndex(step);
          }}
        />
      </main>
    </div>
  );
};

export default App;
