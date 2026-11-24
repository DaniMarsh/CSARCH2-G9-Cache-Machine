# Design System: CSARCH2 Cache Memory Simulator (Machine 9)

Generated via **UI/UX Pro Max** design intelligence (matched against `styles.csv` #1 Minimalism & Swiss Style, `typography.csv` #9 Developer Mono, `colors.csv` #30 Knowledge Base/Documentation, and `ux-guidelines.csv` accessibility/table rules).

## 1. Visual Direction
- **Aesthetic**: Minimalist, warm stationery-inspired light-mode technical workbench.
- **Hierarchy**: Crisp 1px warm-stone hairline borders over a warm paper canvas (`#F7F5F0`), elevated pure-white surfaces (`#FFFFFF`), ink-dark primary typography (`#1C1917`), and restrained semantic status accents.
- **Density**: Technical workbench (`--density: 7`), compact tabular metrics with `font-variant-numeric: tabular-nums` on every address, index, tag, age, rate, and nanosecond timing.

## 2. Color Tokens (CSS Variables)
| Token | Hex | Role |
|---|---|---|
| `--bg-canvas` | `#F8F6F1` | Warm stationery page background |
| `--bg-surface` | `#FFFFFF` | Elevated cards, cache grids, trace panel |
| `--bg-subtle` | `#F2EFE9` | Table headers, secondary panels, inactive pills |
| `--bg-hover` | `#EAE5DC` | Interactive hover surface |
| `--border-subtle` | `#E4DED3` | Default 1px structural hairline |
| `--border-strong` | `#CCC4B6` | Active control / input border |
| `--ink-primary` | `#1A1816` | Primary headings & values (>15:1 on white) |
| `--ink-secondary` | `#524D47` | Secondary labels & subtitles (>7.8:1 on white) |
| `--ink-muted` | `#716A61` | Technical metadata & empty slots (>5.1:1 on white) |
| `--accent-primary` | `#1D4ED8` | Primary interactive actions, active focus ring |
| `--accent-soft` | `#EFF6FF` | Active set highlight / selected state tint |
| `--status-hit` | `#047857` | Cache Hit text/border (emerald-700) |
| `--status-hit-bg` | `#ECFDF5` | Cache Hit cell fill (emerald-50) |
| `--status-miss` | `#B45309` | Cache Miss / Cold Load text/border (amber-700) |
| `--status-miss-bg` | `#FFFBEB` | Cache Miss / Cold Load cell fill (amber-50) |
| `--status-evict` | `#BE123C` | Evicted / Replaced slot text/border (rose-700) |
| `--status-evict-bg` | `#FFF1F2` | Evicted / Replaced slot cell fill (rose-50) |

## 3. Typography Pairing
- **UI & Headings**: `IBM Plex Sans` (400, 500, 600, 700) — high legibility, neutral technical authority.
- **Monospace / Telemetry**: `JetBrains Mono` (400, 500, 600) — crisp zero/one distinction for block addresses, tags, set indices, ages, and trace logs.
- **Numeric Discipline**: `.tabular-nums` applied to all counters, rates, timings, and grid cells to eliminate horizontal jitter during animated playback.

## 4. Spacing Scale & Layout
- `--space-1`: `4px` | `--space-2`: `8px` | `--space-3`: `12px` | `--space-4`: `16px` | `--space-5`: `24px` | `--space-6`: `32px`
- Max content container: `1440px` centered with responsive padding (`16px` mobile, `24px` tablet/desktop).
- Cache grid wrapper uses `overflow-x-auto` with sticky Set index column so 8 ways remain scannable on narrow viewports without breaking layout.

## 5. Accessibility & Motion
- Minimum 4.5:1 text contrast on all primary/secondary copy and status badges.
- Visible 2px focus ring (`--accent-primary`) on all interactive controls and keyboard-operable tabs/playback buttons.
- Status never conveyed by color alone: every Hit, Miss/Load, and Eviction includes explicit text badges (`HIT`, `MISS`, `EVICT`) and icons.
- `@media (prefers-reduced-motion: reduce)` disables cell transition pulses while preserving instant state clarity.
