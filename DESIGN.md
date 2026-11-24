# Design System — CSARCH2 Cache Memory Simulator (Machine 9)

**Mode:** Operate (Precision Hardware Engineering Workbench)  
**Visual World:** Prussian Blueprint & VLSI Drafting Bench — committed dark-ink instrument top shell (`#14212E`), tinted drafting control rail (`#EAEFF4`), pure white data matrices (`#FFFFFF`) divided by 1px architectural hairlines (`#CFD9E4`), sharp `2px`–`3px` corner discipline, and calibrated non-default hardware pigments.

## 1. Layout & Shell Architecture

- **Top Instrument Bar (`bg-shell`, `#14212E`):** Full-bleed Prussian Blueprint command strip housing title, live hardware bit-partition summary (`n`, `B`, `Tag/Set/Word`, `M`), global View Mode switch (`Step-by-Step` / `Final Snapshot`), collapsible left-rail toggle, and Presentation Mode (`P`).
- **Two-Zone Split Workbench (`lg:grid-cols-[272px_minmax(0,1fr)]`):**
  - **Left Parameter & Workload Rail (`bg-rail`, `#EAEFF4`):** Hairline-divided sections for Cache Geometry (`B`, `n`, live Tag/Set/Word strip), Read Policy & Timing (`Non-Load-Through` / `Load-Through`, `Tc`, `Tm`, live `M`), and Workload Sequence presets + custom block address editor. Collapses cleanly in Presentation Mode or via toggle.
  - **Right Simulation Stage (`bg-surface`, `#FFFFFF`):**
    1. **Sticky Stage Control Band (`md:sticky md:top-0`):** Calibrated transport controls with custom `.bench-range` machined faders, the **Dual-Track Execution Trace Ribbon** (interactive LRU vs. MRU step timeline with cobalt divergence markers and scrubbing playhead), and the live `aria-live="polite"` LRU vs. MRU decision strip.
    2. **Centerpiece Dual 8-Way Cache Matrices:** Side-by-side (`xl:grid-cols-2`) or stacked/single policy matrices with sticky `S0..Sn` row headers, relative-age bottom recency hairlines inside valid cells, and contextual `Hit / Load / Evict` legend.
    3. **Unified Performance Comparison Ledger:** Single 4-column comparative table (`Metric | 8-Way BSA + LRU | 8-Way BSA + MRU | Advantage / Delta`) with integrated Hit Rate comparison track and timing formula strip.
    4. **Tabbed Bottom Analysis Inspector:** Hairline-underlined tabs switching between **Execution Trace Log** (Table / Raw Text + Copy / `.txt` Download) and **Architecture Diagrams** (`DWG-01` Data Path & `DWG-02` Live Address Bit Partition).

## 2. Color Tokens (`src/index.css`)

| Token | Hex | Role |
|---|---|---|
| `--shell-bg` | `#14212E` | Committed Prussian Blueprint top command bar & primary active switches |
| `--shell-elevated` | `#1D2E3F` | Secondary controls inside top command bar |
| `--shell-border` | `#2B4055` | Hairlines inside top command bar |
| `--shell-ink` | `#F2F6FA` | Primary text on Prussian shell |
| `--shell-muted` | `#9BB0C5` | Secondary telemetry on Prussian shell |
| `--bg-canvas` | `#F3F6F9` | Cool architectural vellum background & subtle header bands |
| `--bg-rail` | `#EAEFF4` | Tinted left parameter rail & sticky Set row headers |
| `--bg-surface` | `#FFFFFF` | Primary data matrices, tables, diagrams, and inputs |
| `--bg-subtle` | `#E3EAF1` | Table headers & inactive tracks |
| `--bg-hover` | `#D7E1EB` | Interactive hover surface |
| `--border-subtle` | `#CFD9E4` | Default 1px structural divider |
| `--border-strong` | `#9FB0C2` | Active control borders & sticky rail bottom boundary |
| `--ink-primary` | `#101A24` | Primary text & active values (>16:1 on white) |
| `--ink-secondary` | `#394A5C` | Labels, column headers, and prose (>8.2:1 on white) |
| `--ink-muted` | `#596C7F` | Empty slots, metadata, and formulas (>5.0:1 on white) |
| `--accent-primary` | `#0E548A` | Calibrated Drafting Cobalt — focus rings, active tabs, LRU indicator, divergence ticks |
| `--accent-soft` | `#E5F0F9` | Active Set highlight & selected preset tint |
| `--accent-border` | `#99C2E1` | Divergence badge & accent control outline |
| `--status-hit` | `#0F6B54` | Oscilloscope Verdigris — Cache Hit ink/border |
| `--status-hit-bg` | `#E6F5F0` | Cache Hit cell fill |
| `--status-hit-border` | `#87CEB9` | Cache Hit badge outline |
| `--status-miss` | `#965308` | Drafting Ochre — Cold Load / Miss ink/border |
| `--status-miss-bg` | `#FCF3E1` | Cold Load cell fill |
| `--status-miss-border` | `#E0B874` | Cold Load badge outline |
| `--status-evict` | `#B3223B` | Vermilion Carmine — Eviction / Error ink/border |
| `--status-evict-bg` | `#FCEBEE` | Eviction cell fill |
| `--status-evict-border` | `#E49EA9` | Eviction badge outline |

## 3. Typography & Controls

- **UI Sans:** `Public Sans` (400, 500, 600, 700) — restrained neo-grotesque workhorse for dense technical labels and tables.
- **Monospace / Telemetry:** `JetBrains Mono` (400, 500, 600) with `.tabular-nums` on every address, set/way index, tag, age, hit rate, and nanosecond timing.
- **Custom Range Faders (`.bench-range`):** Flat 3px hairline track with `10px × 16px` rectangular Prussian-ink machined thumb (`border-radius: 1.5px`).
- **Corner Discipline:** `2px`–`3px` radii on cells, buttons, badges, and inputs; zero floating rounded-card stacks or nested card-in-card borders.

## 4. Accessibility & Motion

- All primary/secondary ink and semantic status badges meet WCAG AA (`>= 4.5:1`), paired with explicit text badges (`HIT`, `LOAD`, `EVICT`) rather than color alone.
- `CacheGrid` implements proper `role="grid"` / `row` / `columnheader` / `rowheader` / `gridcell` semantics with `sticky left-0` Set headers.
- `StepCalloutBanner` keeps a stable `aria-live="polite"` mount (no key-based remounting) and `TraceLog` rows support keyboard activation (`Enter` / `Space`).
- Cell state transitions run at `200ms–240ms` with `@media (prefers-reduced-motion: reduce)` disabling animations cleanly.

## 5. Refinement Pass (2026-11-25)

- **Workbench hierarchy:** `.app-shell-header`, `.workbench-layout`, `.app-stage`, `.stage-control-band`, `.matrix-section`, and `.analysis-inspector` provide stable landmarks for the command shell, parameter rail, playback story, cache comparison, and lower inspector.
- **Responsive instrument surfaces:** below `768px`, the command strip, transport controls, trace ribbon, tabs, and rail sections reflow into touch-sized rows. Cache matrices and wide ledgers remain intentionally scrollable technical drawings instead of shrinking their telemetry below readable widths.
- **Trace choreography:** the ribbon uses a 36px dual-track canvas with cobalt divergence ticks and a single dark playhead. HIT, LOAD, and EVICT cell arrivals use short, non-bouncy settle/arrive transitions and retain a reduced-motion poster state.
- **Dimensional drawings:** `DWG-01` and `DWG-02` use a three-level stroke hierarchy, non-scaling dimension lines, orthogonal callout leaders, and minimum field widths so the supported `n/B` range remains legible from `n=8, B=2` through `n=128, B=64`.
- **State language:** status pigments are tokenized (`--status-hit`, `--status-miss`, `--status-evict`) across the ribbon, matrices, banners, and diagrams; no event color is hard-coded in a component.
