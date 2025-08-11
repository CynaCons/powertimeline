# AGENTS.md

Chronochart is a React + TypeScript + Tailwind v4 web app for building an interactive, node–link style timeline.

## Current Architecture (high level)
- index.html — Vite entry, mounts `/src/main.tsx`.
- src/
  - main.tsx — React root; imports `index.css`.
  - index.css — Tailwind v4 entry.
  - App.tsx — App shell; panels/rail; passes state to Timeline.
  - components/Timeline.tsx — SVG timeline track, nodes/connectors/cards, create-on-track.
- tests/
  - smoke.spec.ts — functional smoke: load, CRUD (create/edit/delete), drag, zoom/pan, export, performance.
  - smoke-ui.spec.ts — UI/visual smoke: rail/sidebar layout, overlay panels, range bar + start/end markers, connectors always visible, anchor/card spacing, date visibility on select/drag, create-on-track “+”.
- Config: `tailwind.config.ts`, `postcss.config.js`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `playwright.config.ts`.
- public/ — static assets.

## Scripts
- Dev: `npm run dev`
- Test: `npm run test`
- Build/Preview: `npm run build` / `npm run preview`

## Data Model
`{ id: string; date: ISODate; title: string; description?: string }` (stored in `localStorage`).

## Testing Strategy
- Functional (smoke.spec.ts):
  - Verifies app boot, event CRUD, drag date change, zoom/pan, Fit All, outline/editor flows, perf smoke (120 events), export.
- UI/Visual (smoke-ui.spec.ts):
  - Layout: permanent left sidebar (56px), main content has `ml-14`; overlays open at `left-14` and never cover the rail.
  - Timeline: centered vertically; track margins [2..98]; ticks and edge labels visible.
  - Range indicators: blue range bar and Start/End markers rendered when events exist.
  - Connectors: curved path with `data-connector` attribute present for each visible node.
  - Spacing: cards vertically offset from anchors (>= ~3.0 viewBox units).
  - Dates: anchor date text visible when selecting and during drag (updates while dragging).
  - Create-on-track: `data-testid="create-plus"` appears when cursor hovers near center line and clicking opens Create panel with prefilled date.

## Notes for Tests
- Prefer role/label selectors where possible; for SVG, use `svg [data-*]` attributes (`data-event-id`, `data-connector`, `data-testid`).
- When seeding via UI, wait for `localStorage` updates before asserting counts.
- Avoid brittle pixel assertions; use existence/visibility and semantic attributes.
