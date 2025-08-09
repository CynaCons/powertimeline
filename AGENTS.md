# AGENTS.md

Chronochart is a React + TypeScript + Tailwind v4 web app for building an interactive, node–link style timeline. Milestone 1 is complete; Milestone 2 (event creation + local storage + rendering) is next.

## Current Architecture (high level)
- index.html — Vite entry (dark body), mounts `/src/main.tsx`.
- src/
  - main.tsx — React root; imports `index.css`.
  - index.css — Tailwind v4 entry (`@import "tailwindcss"`).
  - App.tsx — App shell; renders the timeline.
  - components/Timeline.tsx — SVG timeline track (placeholder for event nodes/connectors).
- tests/
  - smoke.spec.ts — smoke + dark-background checks (Playwright). Tests boot Vite on port 5174.
- Config: `tailwind.config.ts`, `postcss.config.js`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `playwright.config.ts`.
- public/ — static assets (e.g., `vite.svg`).

## Scripts
- Dev: `npm run dev` (Vite, default port 5173, hot reload).
- Test: `npm run test` (Playwright; starts Vite on 5174).
- Build/Preview: `npm run build` / `npm run preview`.

## Key Documents
- [README.md](README.md) — project setup and basics.
- [PRD.md](PRD.md) — product requirements.
- [PLAN.md](PLAN.md) — milestones/tasks checklist.
- [VISUALS.md](VISUALS.md) — visual design spec (BF-style nodes/connectors).
- [DEVLOG.md](DEVLOG.md) — development notes/decisions.

## Near-term Implementation Notes
- Event model (proposed): `{ id: string, date: string (ISO), title: string, description?: string }`.
- Persistence: `localStorage` (namespaced key, simple JSON array).
- Rendering: small square nodes on the track; connector lines to detail cards per `VISUALS.md`.
