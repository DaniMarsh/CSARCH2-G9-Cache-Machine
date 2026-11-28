# Design System — CSARCH2 Cache Memory Simulator (Machine 9)

<!-- impeccable:design-map -->
Map: src/index.css

## Visual World

- **Warm Stationery Instrument** (Operate mode, light-mode only).
- Archival paper canvas (`--bg-canvas #F6F4EF`), warm stone sub-bands (`--bg-rail #EFECE5`, `--bg-subtle #EAE5DC`), crisp white sheets (`--bg-surface #FFFFFF`).
- Structural 1px hairlines (`--border-subtle #DDD7CB`) and ≥3:1 control borders (`--border-strong #948C7E`). No ghost cards (no drop shadow paired with a 1px border).
- Warm graphite ink (`--ink-primary #1B1916`, `--ink-secondary #4D4840`, `--ink-muted #6A6359`) serves as the sole interaction color (active fills, focus rings, progress track).
- Semantic colors are strictly reserved for simulation events:
  - Hit: `--status-hit #0D6E4F` / `--status-hit-bg #EAF6F1` / `--status-hit-border #8ACBB4`
  - Miss / Cold Load: `--status-miss #9A550A` / `--status-miss-bg #FCF4E4` / `--status-miss-border #DFB977`
  - Eviction: `--status-evict #B4233C` / `--status-evict-bg #FDECEF` / `--status-evict-border #E29EA9`

## Typography

- **UI & Headings**: `Fira Sans` (400, 500, 600, 700).
- **Data & Telemetry**: `Fira Code` (400, 500, 600) with `font-variant-numeric: tabular-nums` and `font-variant-ligatures: none` across all block indices, tags, sets, ages, percentages, and nanosecond timings.

## Component Boundaries

- `App` owns the warm stationery top bar, sticky playback dock, and responsive `max-w-[1440px]` workbench.
- `ConfigPanel` owns cache geometry (`B >= 2`, `n >= 8`), Read Policy (`Non-Load-Through` vs. `Load-Through`), validated `Tc`/`Tm` inputs, and workload presets.
- `CacheGrid` renders the 8-Way BSA matrices (`Set 0..S-1` × `Way 0..7`) with sticky Set column, zero horizontal clipping at `1280px` and `1440px`, inset 2px active state rings, and quiet empty cells.
- `ComparisonStats` pairs LRU and MRU headers (with hit/miss split bars) over a unified 7-metric row spine (`Metric | LRU | Δ | MRU`) and `NLec 24–26` formula footer.
- `DataPathDiagram` (DWG-01) and `BitPartitionDiagram` (DWG-02) are strictly monochrome dimensional SVG drawings with variable tables, closing formulas, line-weight hierarchy, and 45° hatching.
- `PlaybackBar` and `StepCalloutBanner` provide forward-only choreographed transitions, steady callout framing, and classroom-scaled Presentation Mode (`P`).
