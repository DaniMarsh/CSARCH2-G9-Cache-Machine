# CSARCH2 Cache Memory Simulator (Machine 9)

Interactive client-side simulator comparing **8-Way Block Set Associative (BSA) + LRU** vs. **8-Way BSA + MRU** cache replacement policies over a 1024-block main memory ( timing equations: `Non-Load-Through` vs. `Load-Through`).

## Prerequisites

- **Node.js** 18+ (20 LTS recommended)
- **npm** (bundled with Node.js)

## Run Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/DaniMarsh/CSARCH2-G9-Cache-Machine.git
   cd CSARCH2-G9-Cache-Machine
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   Open the local URL printed by Vite (default: `http://localhost:5173`).

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server with hot reload |
| `npm test` | Run all Vitest unit tests (`src/engine/simulator.test.ts`) |
| `npm run test:watch` | Run unit tests in interactive watch mode |
| `npm run build` | Type-check (`tsc -b`) and build the production bundle into `dist/` |
| `npm run preview` | Serve the production `dist/` build locally (`http://localhost:4173`) |

## Keyboard Shortcuts (Step-by-Step Mode)

| Key | Action |
|---|---|
| `Space` | Play / Pause animated trace |
| `←` / `→` | Step backward / forward |
| `R` | Reset to Step 0 |
| `P` | Toggle Presentation Mode |

## Features

- Configurable **Block Size (`B >= 2`)**, **Cache Blocks (`n >= 8`)**, **Read Policy (`Non-Load-Through` / `Load-Through`)**, and **`Tc` / `Tm`** access times.
- Built-in **Sequential (`2n×2`)**, **Mid-Repeat**, seeded **Random (64 accesses)**, and validated **Custom** memory block sequences (`0–1023`).
- Side-by-side 8-Way BSA cache matrices, unified 7-metric LRU vs. MRU performance ledger, monochrome dimensional architecture diagrams (`DWG-01` & `DWG-02`), and downloadable `.txt` execution trace log.
