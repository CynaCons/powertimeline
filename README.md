# PowerTimeline

**Live:** [powertimeline.com](https://powertimeline.com) | **Version:** v0.8.15 | **Status:** Production-Ready Beta

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
- **🤖 AI Chat Integration** - Gemini-powered timeline assistant for event creation and editing
- **📱 Stream View** - Mobile-optimized timeline viewer with swipe gestures and quick actions
- **🔗 Event Sources** - Cite references, links, and notes with drag-and-drop reordering
- **🎓 Guided Tours** - Interactive onboarding with step-by-step feature walkthroughs
- **🔐 Authentication** - Firebase Auth with public timeline viewing
- **👥 User Profiles** - Personal workspace, timeline gallery, and discovery feeds
- **⚙️ Admin Panel** - Platform management, user administration, and analytics

## 📚 Documentation

- **[Product Requirements (PRD.md)](./PRD.md)** - Product vision and user stories
- **[Requirements Index (docs/SRS_INDEX.md)](./docs/SRS_INDEX.md)** - Complete requirements dashboard (~352 requirements)
- **[Software Requirements (docs/SRS.md)](./docs/SRS.md)** - Detailed SRS with traceability
- **[Architecture (ARCHITECTURE.md)](./ARCHITECTURE.md)** - Technical design decisions
- **[Implementation Plan (PLAN.md)](./PLAN.md)** - Iteration history (v0.7.14)
- **[Test Suite (docs/TESTS.md)](./docs/TESTS.md)** - Playwright E2E + Vitest unit tests

## 📦 Features at a glance

- Deterministic half-column layout that prevents card overlap across zoom levels
- Multi-level card degradation (full → compact → title-only) with telemetry
- Cursor-anchored zooming, drag-to-zoom selection, and minimap navigation
- Authoring overlay with calendar/time pickers and live validation
- YAML import/export pipeline for sharing and seeding timelines
- AI-powered chat assistant (Gemini) for timeline creation and editing
- Mobile Stream View with swipe actions and quick event editing
- Event sources with citations, links, and drag-and-drop reordering
- Interactive guided tours with react-joyride onboarding system

## Getting started

### Prerequisites

- Node.js 20+ and npm 10+
- A modern browser (Chrome, Edge, or Firefox)

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

Without these variables, the app will use demo mode for local development.

## Useful npm scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite in development mode with hot module reload. |
| `npm run build` | Type-check and produce a production bundle. |
| `npm run preview` | Serve the production build locally. |
| `npm run lint` | Run ESLint with the strict TypeScript configuration. |
| `npm run lint:fix` | Auto-fix lint violations where possible. |
| `npm run typecheck` | Run the TypeScript compiler without emitting output. |
| `npm test` | Execute the Playwright E2E test suite (415 tests). |
| `npm run test:unit` | Run Vitest unit tests (58 tests). |
| `npm run test:screens` | Capture seeded timeline screenshots. |

## Testing & QA

PowerTimeline has comprehensive test coverage. See [docs/TESTS.md](./docs/TESTS.md) for current counts and details.

```bash
# Run all E2E tests
npm test

# Run unit tests
npm run test:unit

# Interactive test UI
npx playwright test --ui
```

**Tips:**
- E2E tests are organized by feature domain (layout, zoom, minimap, authoring, etc.)
- All tests include requirement ID traceability (see `docs/SRS_INDEX.md`)
- Review test traces under `test-results/` when investigating failures
- Unit tests cover core utilities, layout engine, and positioning logic

## Project structure

```
src/
  app/           # Timeline editor (App.tsx, overlays/, panels/)
  components/    # Shared UI components
  layout/        # Layout engine (LayoutEngine.ts, PositioningEngine.ts)
  pages/         # Route pages (HomePage, LandingPage, UserProfilePage, AdminPage)
  services/      # Firebase services (firestore.ts, auth.ts)
  styles/        # CSS tokens and global styles
  timeline/      # Timeline rendering (DeterministicLayoutComponent.tsx)
docs/            # SRS documentation (~352 requirements)
tests/           # Playwright E2E tests (415 tests)
powerspawn/      # PowerSpawn MCP server (git submodule)
```

Refer to `ARCHITECTURE.md` for details on the half-column layout system and degradation algorithm.

## Data import & sample content

- Curated timelines (French Revolution, World War II) are available to browse and explore
- Use YAML export/import buttons in the editor for data sharing and backups
- YAML schema documented in `src/services/timelineImportExport.ts`
- Timelines are persisted in Firestore (public viewing, auth required for editing)

## Contributing

- Review guidelines in [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- Keep `PLAN.md` and SRS documents aligned with implementation progress
- Run `npm run lint`, `npm run typecheck`, and `npm test` before opening a PR
- All new features should include SRS requirements and test coverage

See `PLAN.md` for current iteration status and roadmap.

## Troubleshooting

- **Playwright cannot launch** - Run `npx playwright install` to download browsers
- **Firebase connection errors** - Check `.env.local` configuration or use demo mode
- **Layout regressions** - Load seeded datasets and run relevant Playwright specs in `tests/editor/`
- **Build errors** - Run `npm run typecheck` to verify TypeScript types

Have questions? Open an issue with reproduction steps and reference relevant requirement IDs from `docs/SRS_INDEX.md`.

## Tech Stack

**Frontend:**
- React 19.1 + TypeScript 5.8
- Vite 7.1 (build tool with HMR)
- Tailwind CSS 4.1 + MUI 7.3
- React Router 7.9 (routing)
- Day.js (date/time handling)

**Backend & Services:**
- Firebase 12.4 (Authentication + Firestore)
- Google Gemini API (AI chat integration)

**UI Libraries:**
- MUI X Date Pickers (calendar/time input)
- React Joyride 2.9 (guided tours)
- Recharts 3.3 (analytics charts)

**Testing:**
- Playwright 1.54 (E2E testing - 415 tests)
- Vitest 4.0 (unit testing - 58 tests)
- Testing Library (React component testing)

**Code Quality:**
- ESLint 9 + TypeScript ESLint
- Husky + lint-staged (pre-commit hooks)

---

**Last Updated:** 2026-01-17 | **Version:** v0.8.15

