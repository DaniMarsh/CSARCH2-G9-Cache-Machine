import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const [animateForward, setAnimateForward] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(450);

  const prevStepRef = useRef<number>(0);

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

  const setStep = useCallback(
    (nextIndex: number) => {
      const clamped = Math.max(0, Math.min(sequence.length, nextIndex));
      setAnimateForward(clamped === prevStepRef.current + 1);
      prevStepRef.current = clamped;
      setCurrentStepIndex(clamped);
      if (clamped >= sequence.length) {
        setIsPlaying(false);
      }
    },
    [sequence.length]
  );

  const resetToZero = () => {
    setAnimateForward(false);
    prevStepRef.current = 0;
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  // Regenerate preset sequence automatically when `n` changes for n-dependent presets
  const handleConfigChange = (next: SimulationConfig) => {
    setConfig(next);
    if (next.cacheBlocks !== config.cacheBlocks) {
      if (activePreset === 'sequential') {
        const seq = generateSequentialSequence(next.cacheBlocks);
        setSequence(seq);
        setRawSequence(formatSequence(seq));
        setSequenceError(null);
        resetToZero();
      } else if (activePreset === 'mid-repeat') {
        const seq = generateMidRepeatSequence(next.cacheBlocks);
        setSequence(seq);
        setRawSequence(formatSequence(seq));
        setSequenceError(null);
        resetToZero();
      }
    }
  };

  const handleSelectPreset = (preset: PresetType) => {
    setActivePreset(preset);
    resetToZero();

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
    resetToZero();
  };

  const handleRawSequenceChange = (val: string) => {
    setRawSequence(val);
    setActivePreset('custom');
    const parsed = parseCustomSequence(val);
    if (parsed.valid) {
      setSequence(parsed.sequence);
      setSequenceError(null);
      resetToZero();
    } else {
      setSequenceError(parsed.error ?? 'Invalid sequence.');
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setIsPlaying(false);
    setAnimateForward(false);
  };

  const handleTogglePlay = useCallback(() => {
    if (sequence.length === 0) return;
    if (currentStepIndex >= sequence.length) {
      setAnimateForward(false);
      prevStepRef.current = 0;
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
        setStep(currentStepIndex + 1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setIsPlaying(false);
        setStep(currentStepIndex - 1);
      } else if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        setIsPlaying(false);
        setStep(0);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [viewMode, currentStepIndex, setStep, handleTogglePlay]);

  // Animated playback timer (strictly forward +1 step)
  useEffect(() => {
    if (!isPlaying || viewMode !== 'step-by-step') return;
    const timer = window.setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= sequence.length) {
          setIsPlaying(false);
          return prev;
        }
        const next = prev + 1;
        setAnimateForward(true);
        prevStepRef.current = next;
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
      {/* Minimalist Warm Stationery Top Bar */}
      <header className="border-b border-border-subtle bg-surface">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <h1 className="text-[15px] font-bold tracking-[-0.015em] text-ink-primary sm:text-base">
              CSARCH2 Cache Memory Simulator
            </h1>
            <span className="font-mono text-xs text-ink-muted">
              Machine 9 · 8-Way BSA (LRU vs. MRU)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Compact Live Hardware Spec Readout */}
            <div className="hidden items-center gap-2 font-mono text-xs tabular-nums text-ink-muted xl:flex">
              <span>
                n=<strong className="font-semibold text-ink-primary">{config.cacheBlocks}</strong> (
                {partitioning.numSets}s&times;8w)
              </span>
              <span className="text-border-strong">/</span>
              <span>
                B=<strong className="font-semibold text-ink-primary">{config.blockSize}</strong>w
              </span>
              <span className="text-border-strong">/</span>
              <span>
                M=<strong className="font-semibold text-ink-primary">{missPenalty.toFixed(2)}ns</strong>
              </span>
            </div>

            {/* Global View Mode Switch */}
            <div
              role="radiogroup"
              aria-label="Simulation View Mode"
              className="inline-flex overflow-hidden rounded-[3px] border border-border-strong bg-surface text-xs"
            >
              <button
                type="button"
                role="radio"
                aria-checked={viewMode === 'step-by-step'}
                onClick={() => handleViewModeChange('step-by-step')}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  viewMode === 'step-by-step'
                    ? 'bg-ink-primary text-surface'
                    : 'text-ink-secondary hover:bg-subtle hover:text-ink-primary'
                }`}
              >
                Step-by-Step
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={viewMode === 'snapshot'}
                onClick={() => handleViewModeChange('snapshot')}
                className={`border-l border-border-strong px-3 py-1.5 font-medium transition-colors ${
                  viewMode === 'snapshot'
                    ? 'bg-ink-primary text-surface'
                    : 'text-ink-secondary hover:bg-subtle hover:text-ink-primary'
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
              className={`rounded-[3px] border px-3 py-1.5 text-xs font-medium transition-colors ${
                presentationMode
                  ? 'border-ink-primary bg-ink-primary text-surface'
                  : 'border-border-strong bg-surface text-ink-primary hover:bg-subtle'
              }`}
            >
              {presentationMode ? 'Exit Present (P)' : 'Present (P)'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Workbench */}
      <main
        className={`mx-auto max-w-[1440px] space-y-4 px-4 py-4 sm:px-5 ${
          presentationMode ? 'space-y-5 py-5' : ''
        }`}
      >
        {/* 1. Configuration Panel (Replaced by compact hardware spec strip in Presentation Mode) */}
        {presentationMode ? (
          <div
            aria-label="Active Configuration Summary"
            className="sheet flex flex-wrap items-center justify-between gap-2 rounded-[4px] bg-rail/60 px-4 py-2 font-mono text-xs tabular-nums text-ink-secondary"
          >
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <strong className="font-semibold text-ink-primary">PRESENTATION</strong>
              <span className="text-border-strong">|</span>
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
                M=<strong className="text-ink-primary">{missPenalty.toFixed(2)}ns</strong>
              </span>
              <span className="text-border-strong">|</span>
              <span>
                Seq=<strong className="text-ink-primary">{sequence.length}</strong>
              </span>
            </div>
            <span className="text-[11px] text-ink-muted">
              Space Play &middot; &larr;/&rarr; Step &middot; R Reset &middot; P Controls
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

        {/* 2. Sticky Playback Dock + Step Callout Banner */}
        <div className="sheet overflow-hidden rounded-[4px] md:sticky md:top-2 md:z-30">
          <PlaybackBar
            viewMode={viewMode}
            currentStepIndex={currentStepIndex}
            sequenceLength={sequence.length}
            isPlaying={isPlaying}
            playbackSpeedMs={playbackSpeedMs}
            hasSequenceError={sequenceError !== null}
            onViewModeChange={handleViewModeChange}
            onTogglePlay={handleTogglePlay}
            onStepTo={setStep}
            onSpeedChange={setPlaybackSpeedMs}
          />

          {!isSnapshotMode && (
            <StepCalloutBanner
              lruStep={lruActiveStep}
              mruStep={mruActiveStep}
              totalSteps={sequence.length}
              nextBlockPreview={sequence.length > 0 ? sequence[0] : null}
              presentationMode={presentationMode}
            />
          )}
        </div>

        {/* 3. Visual 8-Way BSA Cache Memory Grids (Elevated Above the Fold) */}
        <section aria-label="Visual Cache Memory Grids" className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <h2 className="text-[13px] font-semibold text-ink-primary">
                Cache Memory Matrices (Set 0 &ndash; Set {partitioning.numSets - 1}, Ways 0 &ndash; 7)
              </h2>
              <span className="font-mono text-xs text-ink-muted">
                T: Tag &middot; A: Age &middot; B: Block &middot; V: Valid
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Inline Semantic State Legend */}
              <div
                className="flex items-center gap-3 font-mono text-xs"
                aria-label="Cache Event Legend"
              >
                <span className="inline-flex items-center gap-1.5 font-medium text-status-hit">
                  <span className="h-2 w-2 rounded-[1px] bg-status-hit" aria-hidden="true" />
                  Hit
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-status-miss">
                  <span className="h-2 w-2 rounded-[1px] bg-status-miss" aria-hidden="true" />
                  Miss / Load
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-status-evict">
                  <span className="h-2 w-2 rounded-[1px] bg-status-evict" aria-hidden="true" />
                  Evict
                </span>
              </div>

              {/* Grid Layout Switch */}
              <div
                role="radiogroup"
                aria-label="Cache Grid Layout"
                className="inline-flex items-center gap-3 border-l border-border-subtle pl-3 text-xs"
              >
                {(
                  [
                    { id: 'side-by-side', label: 'Side-by-Side' },
                    { id: 'stacked', label: 'Stacked' },
                    { id: 'lru', label: 'LRU' },
                    { id: 'mru', label: 'MRU' },
                  ] as const
                ).map((opt) => {
                  const active = gridLayout === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setGridLayout(opt.id)}
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
                animateStep={animateForward}
                presentationMode={presentationMode}
              />
            )}
            {gridLayout !== 'lru' && (
              <CacheGrid
                policy="MRU"
                cacheState={mruDisplayedCache}
                activeStep={mruActiveStep}
                highlightActive={!isSnapshotMode}
                compact={gridLayout === 'side-by-side'}
                animateStep={animateForward}
                presentationMode={presentationMode}
              />
            )}
          </div>
        </section>

        {/* 4. Side-by-Side Performance Comparison Ledger */}
        <ComparisonStats
          lruMetrics={lruDisplayedMetrics}
          mruMetrics={mruDisplayedMetrics}
          config={config}
          stepLabel={stepLabel}
          presentationMode={presentationMode}
        />

        {/* 5. Technical Dimensional Diagrams (DWG-01 & DWG-02) */}
        <ArchitecturePanel
          config={config}
          partitioning={partitioning}
          lruStep={lruActiveStep}
          mruStep={mruActiveStep}
          isSnapshotMode={isSnapshotMode}
        />

        {/* 6. Execution Trace Log */}
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
            setStep(step);
          }}
        />
      </main>
    </div>
  );
};

export default App;
