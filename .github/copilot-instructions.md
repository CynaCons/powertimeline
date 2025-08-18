# Copilot Instructions for Chronochart

## Project Overview

Chronochart is a React timeline visualization component with SVG rendering and HTML content integration. The project emphasizes accessibility, theming, and modular architecture.

## Project Conventions
  - The user communicates you requests and feedback. You incorporate them in PLAN.md in the form of checklist items, categorized by features. 
  - You then implement the features and checklist elements as per user request.
  - Do not stop, until the user request is complete
  - Only request user approval when initiating a new major development phaseor a new top-level PLAN section not yet approved. Within an already approved phase, proceed autonomously through minor PLAN checklist steps without interim confirmations.
  - Update `PLAN.md` in realtime whenever something is ongoing or completed.
  - Do not ask the user to choose among technical implementation options; make engineering decisions yourself and surface them as completed or in-progress checklist items in `PLAN.md`.
  - If instructions are not clear, then say so and start a discussion to clarify

## Where to find what

- Architecture and planning
  - `ARCHITECTURE.md` — Slot-based layout, degradation flow, columns, anchors.
  - `PLAN.md` — Phases, checklists, current work items and docs follow-ups.
  - `PRD.md` — Product goals, user stories, success metrics.
  - `COMPLETED.md` — Iteration history, decisions, and regressions fixed.

- Core layout engine (slot-based + degradation)
  - `src/layout/clustering.ts` — Event clustering around anchors.
  - `src/layout/SlotGrid.ts` — Slot generation/occupancy for anchors/columns.
  - `src/layout/SingleColumnLayout.ts` — Single-column placement.
  - `src/layout/DualColumnLayout.ts` — Dual-column expansion & offsets.
  - `src/layout/DegradationEngine.ts` — Full→compact→title-only→multi→infinite logic.
  - `src/layout/LayoutEngine.ts` — Orchestration & stats.
  - `src/layout/config.ts` / `src/layout/types.ts` — Card sizes/configs and types.

- Timeline UI and visuals
  - `src/components/Timeline.tsx` — Timeline composition and configs.
  - `src/timeline/Axis.tsx`, `RangeBar.tsx`, `SvgDefs.tsx` — Axis, range, defs.
  - `src/styles/tokens.css` — Theme tokens (colors, strokes, etc.).

- Overlays and panels
  - `src/app/OverlayShell.tsx` — Overlay container and focus handling.
  - `src/app/panels/*` — Editor/Outline/Dev panels (MUI-based).

- Utilities and libs
  - `src/lib/time.ts`, `text.ts`, `storage.ts` — Time mapping, measurements, persistence.
  - `src/lib/devSeed.ts` — Seeding helpers and test datasets.

- Tests
  - `tests/*.spec.ts` — Playwright suite (layout, axis, a11y, density, performance).

