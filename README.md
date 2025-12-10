# PowerTimeline

**GitHub for Timelines** - Collaborative historical event visualization and timeline management platform.

PowerTimeline is a React + TypeScript web application that makes it easy to create, explore, and collaborate on richly detailed historical timelines. Think of it as "GitHub for history" - fork timelines, submit improvements, and build collective knowledge together.

> 🚧 **Screenshot Coming Soon** - Timeline editor with French Revolution dataset (150+ events, adaptive zoom, minimap navigation)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Visit http://localhost:5173
```

Once running, you can browse public timelines or create your own. Load sample datasets like the French Revolution timeline from the Home page.

## ✨ What Can PowerTimeline Do?

- **📊 Visualize Complex Timelines** - Deterministic layout engine handles dense datasets with 1000+ events
- **🔍 Adaptive Zoom** - Navigate from decades to minutes with cursor-anchored zooming
- **🎨 Smart Degradation** - Cards automatically adjust (full → compact → title-only) to prevent overlaps
- **🗺️ Minimap Navigation** - Bird's-eye view with density heatmap and click-to-navigate
- **✏️ Rich Authoring** - Calendar pickers, time input, live validation, and event navigation
- **📤 Import/Export** - YAML-based sharing and seeding pipeline
- **🔐 Authentication** - Firebase Auth with public timeline viewing
- **👥 User Profiles** - Personal workspace, timeline gallery, and discovery feeds
- **⚙️ Admin Panel** - Platform management, user administration, and analytics

## 📚 Documentation

- **[Product Requirements (PRD.md)](./PRD.md)** - Product vision and user stories
- **[Requirements Index (docs/SRS_INDEX.md)](./docs/SRS_INDEX.md)** - Complete requirements dashboard (~340 requirements)
- **[Software Requirements (docs/SRS.md)](./docs/SRS.md)** - Detailed SRS with traceability
- **[Architecture (ARCHITECTURE.md)](./ARCHITECTURE.md)** - Technical design decisions
- **[Implementation Plan (PLAN.md)](./PLAN.md)** - Iteration history (200+ completed)
- **[Test Suite (tests/)](./tests)** - 320 Playwright E2E tests + 58 unit tests

## 📦 Features at a glance

- Deterministic half-column layout that prevents card overlap across zoom levels.
- Multi-level card degradation (full -> compact -> title-only) with telemetry.
- Cursor-anchored zooming, drag-to-zoom selection, and minimap navigation.
- Authoring overlay with calendar/time pickers and live validation.
- YAML import/export pipeline for sharing and seeding timelines.

## Getting started

### Prerequisites

- Node.js 20+ (ESM-compatible) and npm 10+
- A modern browser for development (Chromium-based preferred for Playwright parity)

### Install dependencies

```bash
npm install
```

### Launch the dev server

```bash
npm run dev
```

The app runs on <http://localhost:5173> by default. Browse public timelines or log in to create and edit your own.

### Optional: configure Firebase analytics

Create a `.env.local` (not committed) and provide the Firebase configuration if you plan to exercise analytics or hosted deployments:

```bash
# .env.local
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

Without these variables the analytics module should be disabled in future iterations (see `PLAN.md` v0.3.4).

## Useful npm scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite in development mode with hot module reload. |
| `npm run build` | Type-check and produce a production bundle. |
| `npm run preview` | Serve the production build locally. |
| `npm run lint` | Run ESLint with the strict TypeScript configuration. |
| `npm run lint:fix` | Auto-fix lint violations where possible. |
| `npm run typecheck` | Run the TypeScript compiler without emitting output. |
| `npm test` | Execute the Playwright smoke/regression suite. |
| `npm run test:screens` | Capture seeded timeline screenshots. |

## Testing & QA

PowerTimeline relies on [Playwright](https://playwright.dev/) for end-to-end validation. Tests live under `tests/` and are grouped by feature domain (layout, zoom, minimap, authoring, etc.).

```bash
npm test
```

Tips:

- Use `npx playwright test --ui` for an interactive runner.
- When investigating failures, review traces under `test-results/`; avoid committing them back to `main` once resolved.
- Annotate new tests with requirement IDs (see `docs/SRS.md`) to maintain traceability.

## Project structure

```
src/
	app/ # Panels, overlays, hooks, and shell components
	components/ # Reusable UI elements (axis, minimap, tooltips, etc.)
	layout/ # Deterministic layout engine, config, and card rendering
	lib/ # Storage, Firebase, seeding utilities, helpers
	timeline/ # Timeline axis, markers, SVG defs, and hooks
	utils/ # Shared utilities (time helpers, telemetry, easing)
docs/ # Product docs, PRD, SRS, architecture notes
tests/ # Playwright regression suite (v5 scenarios)
```

Refer to `ARCHITECTURE.md` for a deeper dive into the half-column system and degradation math.

## Data import & sample content

- Curated timelines like the French Revolution are available to browse and explore.
- Use the YAML export/import buttons in the Editor to round-trip data. The schema is documented in `src/services/timelineImportExport.ts` and `docs/SRS_EDITOR_IMPORT_EXPORT.md`.
- Timelines are persisted in Firestore (requires authentication).

## Contributing

- Review the guidelines in [`CONTRIBUTING.md`](./CONTRIBUTING.md).
- Keep `PLAN.md` and `docs/SRS.md` aligned with implementation progress.
- Run `npm run lint` and targeted Playwright specs before opening a PR.

For roadmap context, see the v0.3.x tasks in `PLAN.md` along with the future platform phases (v0.4+).

## Troubleshooting

- **Playwright cannot launch** run `npx playwright install` to ensure browsers are downloaded.
- **Firebase analytics errors** double-check `.env.local` values or temporarily disable analytics initialization.
- **Layout regressions** load seeded datasets and run the relevant Playwright spec (see `tests/editor/`).

Have questions? Open an issue with reproduction steps and mention the affected requirement IDs if available.

