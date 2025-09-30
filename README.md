# PowerTimeline

PowerTimeline is a React + TypeScript application for creating, exploring, and editing richly detailed historical timelines. It ships with a deterministic layout engine, adaptive zoom controls, and authoring tools designed for dense datasets.

## Quick links

- 📘 [Product Requirements (`PRD.md`)](./PRD.md)
- 🧭 [Architecture overview (`ARCHITECTURE.md`)](./ARCHITECTURE.md)
- ✅ [Software requirements & traceability (`docs/SRS.md`)](./docs/SRS.md)
- 🗺️ [Project plan & iteration history (`PLAN.md`)](./PLAN.md)
- 🧪 [Playwright test suite (`tests/`)](./tests)

## Features at a glance

- Deterministic half-column layout that prevents card overlap across zoom levels.
- Multi-level degradation (full ➜ compact ➜ title-only ➜ aggregated) with telemetry.
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

The app runs on <http://localhost:5173> by default. Use the navigation rail to open the Developer Panel for loading sample datasets such as the French Revolution timeline.

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
	app/            # Panels, overlays, hooks, and shell components
	components/     # Reusable UI elements (axis, minimap, tooltips, etc.)
	layout/         # Deterministic layout engine, config, and card rendering
	lib/            # Storage, Firebase, seeding utilities, helpers
	timeline/       # Timeline axis, markers, SVG defs, and hooks
	utils/          # Shared utilities (time helpers, telemetry, easing)
docs/             # Product docs, PRD, SRS, architecture notes
tests/            # Playwright regression suite (v5 scenarios)
```

Refer to `ARCHITECTURE.md` for a deeper dive into the half-column system and degradation math.

## Data import & sample content

- Developer tools expose buttons to load curated timelines (e.g., French Revolution, JFK).
- Use the YAML export/import buttons in the Developer Panel to round-trip data. The schema is documented in `src/utils/yamlSerializer.ts` and `docs/SRS.md`.
- Persistent storage defaults to `localStorage` via `EventStorage`.

## Contributing

- Review the guidelines in [`CONTRIBUTING.md`](./CONTRIBUTING.md).
- Keep `PLAN.md` and `docs/SRS.md` aligned with implementation progress.
- Run `npm run lint` and targeted Playwright specs before opening a PR.

For roadmap context, see the v0.3.x tasks in `PLAN.md` along with the future platform phases (v0.4+).

## Troubleshooting

- **Playwright cannot launch** – run `npx playwright install` to ensure browsers are downloaded.
- **Firebase analytics errors** – double-check `.env.local` values or temporarily disable analytics initialization.
- **Layout regressions** – load seeded datasets and run the relevant v5 Playwright spec (see `tests/v5/`).

Have questions? Open an issue with reproduction steps and mention the affected requirement IDs if available.

