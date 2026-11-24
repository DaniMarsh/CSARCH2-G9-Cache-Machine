# Design System — CSARCH2 Cache Memory Simulator (Machine 9)

<!-- impeccable:design-map -->
Map: src/index.css
Full: .impeccable/design-full.md (read a section when you need its detail)

## Colors

- Shell: `--shell-bg #14212E`, `--shell-elevated #1D2E3F`, `--shell-ink #F2F6FA`.
- Surfaces: `--bg-canvas #F3F6F9`, `--bg-rail #EAEFF4`, `--bg-surface #FFFFFF`.
- Structure: `--border-subtle #CFD9E4`, `--border-strong #9FB0C2`, `--ink-primary #101A24`, `--ink-secondary #394A5C`.
- Events: verdigris `--status-hit`, ochre `--status-miss`, vermilion `--status-evict`; always pair color with a text label.

## Components

- `App` owns the instrument shell and stage landmarks; `ConfigPanel` is the parameter rail; `PlaybackBar`, `TraceRibbon`, and `StepCalloutBanner` form the playback story.
- `CacheGrid` is a semantic eight-way matrix with sticky set headers and explicit HIT/LOAD/EVICT states.
- `DataPathDiagram` (DWG-01) and `BitPartitionDiagram` (DWG-02) are technical drawings: thin construction lines, stronger component outlines, orthogonal callouts, and readable labels across all supported cache geometries.
- Mobile reflows controls and tabs below 768px while matrices and ledgers retain intentional horizontal scrolling for telemetry legibility.

## Typography

- UI copy uses Public Sans for clear controls and short explanations.
- Addresses, ages, set/way indices, hit rates, and timings use JetBrains Mono with tabular numerals.
- Keep technical labels compact but readable; do not rely on sub-10px text for essential state.
