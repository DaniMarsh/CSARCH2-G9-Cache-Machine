import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Download, FileText, Table as TableIcon, Terminal } from 'lucide-react';
import { formatTraceAsText } from '../engine/simulator';
import type {
  AddressPartitioning,
  PolicySimulationResult,
  ReplacementPolicy,
  SimulationConfig,
  ViewMode,
} from '../engine/types';

interface TraceLogProps {
  lruResult: PolicySimulationResult;
  mruResult: PolicySimulationResult;
  config: SimulationConfig;
  partitioning: AddressPartitioning;
  viewMode: ViewMode;
  currentStepIndex: number;
  onSelectStep: (stepIndex: number) => void;
}

export const TraceLog: React.FC<TraceLogProps> = ({
  lruResult,
  mruResult,
  config,
  partitioning,
  viewMode,
  currentStepIndex,
  onSelectStep,
}) => {
  const [activeTab, setActiveTab] = useState<ReplacementPolicy>('LRU');
  const [displayFormat, setDisplayFormat] = useState<'table' | 'raw'>('table');
  const [copied, setCopied] = useState<boolean>(false);
  const activeRowRef = useRef<HTMLTableRowElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const activeResult = activeTab === 'LRU' ? lruResult : mruResult;

  const rawText = useMemo(
    () => formatTraceAsText(activeResult, config, partitioning),
    [activeResult, config, partitioning]
  );

  // Keep active step row visible inside the trace scroll container without scrolling the page
  useEffect(() => {
    if (
      viewMode === 'step-by-step' &&
      displayFormat === 'table' &&
      activeRowRef.current &&
      scrollContainerRef.current
    ) {
      const container = scrollContainerRef.current;
      const row = activeRowRef.current;
      const rowTop = row.offsetTop;
      const rowBottom = rowTop + row.offsetHeight;
      const viewTop = container.scrollTop;
      const viewBottom = viewTop + container.clientHeight;

      if (rowTop < viewTop + 36) {
        container.scrollTop = Math.max(0, rowTop - 40);
      } else if (rowBottom > viewBottom) {
        container.scrollTop = rowBottom - container.clientHeight + 8;
      }
    }
  }, [currentStepIndex, viewMode, displayFormat, activeTab]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable in non-secure contexts
    }
  };

  const handleDownload = () => {
    const blob = new Blob([rawText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `csarch2-8way-bsa-${activeTab.toLowerCase()}-trace.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRowKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>, step: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectStep(step);
    }
  };

  return (
    <section
      aria-label="Execution Trace Log"
      className="overflow-hidden rounded-lg border border-border-subtle bg-surface"
    >
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border-subtle bg-subtle/45 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-ink-secondary" aria-hidden="true" />
          <h2 className="text-sm font-semibold tracking-tight text-ink-primary">
            Text Trace Log
          </h2>
          <span className="font-mono text-xs tabular-nums text-ink-muted">
            ({activeResult.steps.length} steps)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* LRU / MRU Tabs */}
          <div
            role="tablist"
            aria-label="Replacement Policy Trace Tabs"
            className="inline-flex rounded-md border border-border-subtle bg-subtle p-0.5"
          >
            {(['LRU', 'MRU'] as ReplacementPolicy[]).map((tab) => {
              const selected = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                    selected
                      ? 'bg-surface text-ink-primary ring-1 ring-border-subtle'
                      : 'text-ink-secondary hover:text-ink-primary'
                  }`}
                >
                  8-Way + {tab}
                </button>
              );
            })}
          </div>

          {/* Table vs Raw Text Switch */}
          <div
            role="group"
            aria-label="Trace Display Format"
            className="inline-flex rounded-md border border-border-subtle bg-subtle p-0.5"
          >
            <button
              type="button"
              aria-pressed={displayFormat === 'table'}
              onClick={() => setDisplayFormat('table')}
              className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                displayFormat === 'table'
                  ? 'bg-surface text-ink-primary ring-1 ring-border-subtle'
                  : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Table
            </button>
            <button
              type="button"
              aria-pressed={displayFormat === 'raw'}
              onClick={() => setDisplayFormat('raw')}
              className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                displayFormat === 'raw'
                  ? 'bg-surface text-ink-primary ring-1 ring-border-subtle'
                  : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              Raw Text
            </button>
          </div>

          {/* Copy Trace */}
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface px-2.5 py-1 text-xs font-medium text-ink-secondary transition-colors hover:border-border-strong hover:bg-hover hover:text-ink-primary"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-status-hit" aria-hidden="true" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                Copy
              </>
            )}
          </button>

          {/* Download Trace (.txt) */}
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-md border border-border-strong bg-surface px-2.5 py-1 text-xs font-medium text-ink-primary transition-colors hover:bg-hover"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Download (.txt)
          </button>
        </div>
      </div>

      {/* Trace Body */}
      {displayFormat === 'table' ? (
        <div
          ref={scrollContainerRef}
          className="trace-scroll max-h-[360px] overflow-auto"
        >
          <table className="w-full min-w-[660px] border-collapse text-left font-mono text-xs tabular-nums">
            <thead className="sticky top-0 z-10 border-b border-border-subtle bg-subtle text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">
              <tr>
                <th scope="col" className="px-3 py-2">
                  Step
                </th>
                <th scope="col" className="px-3 py-2">
                  Seq (MM Block)
                </th>
                <th scope="col" className="px-3 py-2">
                  Set
                </th>
                <th scope="col" className="px-3 py-2">
                  Tag
                </th>
                <th scope="col" className="px-3 py-2">
                  Hit / Miss
                </th>
                <th scope="col" className="px-3 py-2">
                  Way
                </th>
                <th scope="col" className="px-3 py-2">
                  Evicted Block
                </th>
                <th scope="col" className="px-3 py-2 text-right">
                  Age
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {activeResult.steps.map((s) => {
                const isCurrent =
                  viewMode === 'step-by-step' && s.step === currentStepIndex;
                const isFuture =
                  viewMode === 'step-by-step' && s.step > currentStepIndex;

                return (
                  <tr
                    key={s.step}
                    ref={isCurrent ? activeRowRef : null}
                    tabIndex={0}
                    aria-current={isCurrent ? 'step' : undefined}
                    onClick={() => onSelectStep(s.step)}
                    onKeyDown={(e) => handleRowKeyDown(e, s.step)}
                    title={
                      viewMode === 'step-by-step'
                        ? `Jump to step ${s.step}`
                        : `Inspect step ${s.step}`
                    }
                    className={`cursor-pointer transition-colors ${
                      isCurrent
                        ? 'bg-accent-soft font-semibold text-ink-primary'
                        : isFuture
                        ? 'bg-surface text-ink-muted opacity-65 hover:bg-subtle/40 hover:opacity-100'
                        : 'bg-surface text-ink-primary hover:bg-subtle/40'
                    }`}
                  >
                    <td className="px-3 py-1.5 text-ink-secondary">{s.step}</td>
                    <td className="px-3 py-1.5 font-semibold">{s.blockAddress}</td>
                    <td className="px-3 py-1.5">{s.setIndex}</td>
                    <td className="px-3 py-1.5">{s.tag}</td>
                    <td className="px-3 py-1.5">
                      {s.outcome === 'HIT' ? (
                        <span className="inline-block rounded bg-status-hit-bg px-1.5 py-0.5 text-[11px] font-semibold text-status-hit">
                          HIT
                        </span>
                      ) : s.evictedBlock !== null ? (
                        <span className="inline-block rounded bg-status-evict-bg px-1.5 py-0.5 text-[11px] font-semibold text-status-evict">
                          MISS (EVICT)
                        </span>
                      ) : (
                        <span className="inline-block rounded bg-status-miss-bg px-1.5 py-0.5 text-[11px] font-semibold text-status-miss">
                          MISS
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-1.5">Way {s.wayIndex}</td>
                    <td className="px-3 py-1.5">
                      {s.evictedBlock !== null ? (
                        <span className="font-semibold text-status-evict">
                          Block {s.evictedBlock}
                        </span>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-right">{s.age}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <pre className="trace-scroll max-h-[360px] overflow-auto bg-canvas/70 p-4 font-mono text-xs leading-relaxed tabular-nums text-ink-primary">
          {rawText}
        </pre>
      )}
    </section>
  );
};
