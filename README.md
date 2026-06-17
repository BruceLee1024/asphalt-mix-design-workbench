# Asphalt Mix Design Workbench

Professional asphalt concrete target mix design workbench for AC dense-graded mixtures. The app focuses on laboratory ledger management, aggregate gradation blending, Marshall test records, OAC analysis, performance verification, issue tracking, and formal report export.

## Features

- Project ledger: project code, client, sample code, sampling/test dates, tester, reviewer, approver, report code, and archive state.
- Material ledger: aggregate proportions, source/batch records, sieve passing rates, density parameters, and asphalt quality records.
- Gradation design: blended gradation table, specification band, midpoint fitting, out-of-range warnings, and curve review.
- Marshall records: quick average entry plus 3/4-specimen raw record mode with automatic group summary.
- OAC analysis: OAC1/OAC2 derivation, common passing range, final OAC checks, and curve ledger.
- Performance verification: water stability, rutting, low-temperature bending, and permeability records.
- Report archive: data completeness checks, issue ledger, report freeze state, print/PDF, CSV, and multi-sheet XLSX export.
- Local persistence: all data is stored in browser `localStorage`; no backend or login is required.

## Standards

Default profile:

- `JTG F40-2004` 公路沥青路面施工技术规范
- `JTG 3410-2025` 公路工程沥青及沥青混合料试验规程

Historical projects may switch to:

- `JTG F40-2004 + JTG E20-2011`

The current automatic OAC workflow is intended for:

- `AC-13`
- `AC-16`
- `AC-20`
- `AC-25`

`SMA-13` and `OGFC-13` remain available as special design entries, but they do not use the AC general Marshall OAC auto-judgement workflow.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- ExcelJS
- Node built-in test runner

## Run Locally

Prerequisites:

- Node.js
- npm

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000/
```

## Scripts

```bash
npm run dev      # Start Vite dev server on port 3000
npm run lint     # Type-check with tsc --noEmit
npm test         # Run unit tests
npm run build    # Build production assets
```

## Data And Export

- Project data is automatically saved to browser `localStorage`.
- JSON import/export is available for project transfer.
- CSV export includes ledger, material, gradation, Marshall, OAC, performance, and issue sections.
- XLSX export creates a multi-sheet workbook for formal project handoff.

## Current Limitations

- No backend database.
- No user login, permission control, or electronic signature.
- Report freeze is a frontend archive state, not a legal e-signature workflow.
- Performance verification is recorded and judged by configured thresholds; it does not replace specialist SMA/OGFC design procedures.

## Repository

Private project repository:

```text
BruceLee1024/asphalt-mix-design-workbench
```
