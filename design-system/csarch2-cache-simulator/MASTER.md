# Design System: CSARCH2 Cache Memory Simulator (Machine 9)

Generated via **UI/UX Pro Max** design intelligence (matched against `styles.csv` Minimalism & Swiss Style, `typography.csv` Dashboard Data — Fira Sans + Fira Code, and `ux-guidelines.csv` data table & accessibility rules) and refined under **/impeccable** Operate mode.

## 1. Visual Direction
- **Aesthetic**: Minimalist warm stationery technical instrument (light-mode only).
- **Hierarchy**: Flat 1px warm-stone hairlines (`#DDD7CB`) over archival paper (`#F6F4EF`), pure white sheets (`#FFFFFF`), warm graphite ink (`#1B1916`), and zero decorative accent colors.
- **Density**: Technical workbench (`--density: 8`), strict `tabular-nums` on every memory block index, tag, set index, age counter, percentage, and nanosecond timing value.

## 2. Color Tokens (CSS Variables in `src/index.css`)
| Token | Hex | Role |
|---|---|---|
| `--bg-canvas` | `#F6F4EF` | Warm archival paper background |
| `--bg-rail` | `#EFECE5` | Section header bands & subtle tracks |
| `--bg-surface` | `#FFFFFF` | Elevated flat sheets, cache grids, tables |
| `--bg-subtle` | `#EAE5DC` | Table headers, inactive tracks, selected row tint |
| `--bg-hover` | `#E2DDD2` | Interactive hover surface |
| `--border-subtle` | `#DDD7CB` | Default 1px structural hairline |
| `--border-strong` | `#948C7E` | Input & control border (>= 3:1 on white) |
| `--ink-primary` | `#1B1916` | Primary headings, active controls, focus ring (>16:1 on white) |
| `--ink-secondary` | `#4D4840` | Secondary labels & subtitles (>8.5:1 on white) |
| `--ink-muted` | `#6A6359` | Metadata & quiet empty indicators (>5.3:1 on white) |
| `--status-hit` | `#0D6E4F` | Cache Hit text / inset ring |
| `--status-hit-bg` | `#EAF6F1` | Cache Hit cell fill |
| `--status-hit-border` | `#8ACBB4` | Cache Hit subtle border |
| `--status-miss` | `#9A550A` | Cache Miss / Cold Load text / inset ring |
| `--status-miss-bg` | `#FCF4E4` | Cache Miss / Cold Load cell fill |
| `--status-miss-border` | `#DFB977` | Cache Miss / Cold Load subtle border |
| `--status-evict` | `#B4233C` | Evicted / Replaced slot text / inset ring |
| `--status-evict-bg` | `#FDECEF` | Evicted / Replaced slot cell fill |
| `--status-evict-border` | `#E29EA9` | Evicted / Replaced slot subtle border |

## 3. Typography Pairing
- **UI & Headings**: `Fira Sans` (400, 500, 600, 700) — clean, neutral technical legibility.
- **Monospace / Telemetry**: `Fira Code` (400, 500, 600) with `font-variant-ligatures: none` and `tabular-nums`.

## 4. Technical Diagrams & Motion
- **Dimensional Drawings (DWG-01 & DWG-02)**: Strictly monochrome (`#111111` ink on `#FFFFFF`), variable-coded with closing formula tables, line-weight hierarchy, dash patterns, and 45° diagonal hatching.
- **Choreography**: Forward-only value transitions (`stage-roll-load`, `stage-roll-evict`, `stage-tick-hit`), inset 2px active cell rings (zero layout shift), steady callout frame, and full `prefers-reduced-motion` support.
