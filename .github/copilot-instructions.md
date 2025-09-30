# PowerTimeline AI Implementation Guide

## Core guardrails
- Always start by capturing a task list with the todo manager **and** reflect work in `PLAN.md` checklists; keep both in sync as you progress.
- Treat the user as the source of truth: clarify their goals, then implement the requested change end-to-end (code, docs, tests, plan updates).
- Keep changes scoped and deterministic—every edit to layout or tests should be backed by an actionable verification step.

## Architecture snapshot
- React + TypeScript + Vite SPA. `src/App.tsx` wires navigation, overlays, and seeds timeline data; `EventStorage` (`src/lib/storage.ts`) persists to `localStorage`.
- Layout is produced by the deterministic engine (`src/layout/LayoutEngine.ts`, `DeterministicLayoutComponent.tsx`) using the half-column system described in `ARCHITECTURE.md`.
- Timeline visuals live in `src/components/EnhancedTimelineAxis.tsx` and `src/timeline/*`; cards render via `src/layout/CardRenderer.tsx`.
- Developer overlays/panels are under `src/app/panels/` and share focus management from `src/app/OverlayShell.tsx`.

## Data & seeding fundamentals
- On cold start the app auto-seeds the RFK dataset (`seedRFKTimeline` in `src/lib/devSeed.ts`) when storage is empty—tests assume this baseline. Developer Panel buttons load other seeds on demand.
- Requirements traceability hinges on `docs/SRS.md` and split-out files like `docs/SRS_FOUNDATION.md`; update them when behavior changes.

## Testing & verification patterns
- Playwright v5 suite under `tests/v5/` maps 1:1 with requirement IDs. Run focused specs after related edits, e.g. `npm run test -- tests/v5/01-foundation.smoke.spec.ts`.
- Selectors rely on `data-testid` attributes (`timeline-axis`, `timeline-axis-tick`, `event-card`, etc.). Preserve or extend these rather than using brittle DOM paths.
- Keep telemetry-driven tests in mind: layout changes often require updating expectations in specs `03`–`07`.

## Workflows & conventions
- Primary commands: `npm run dev` for local work, `npm run build` before shipping, `npm run lint` and `npm run typecheck` for gating.
- Documentation is contractual: when adding features or altering flows, mirror the change in `PLAN.md` (progress), `docs/SRS_*` (requirements), and relevant READMEs.
- Favor deterministic helpers—check `src/utils/time.ts`, `src/lib/text.ts`, and existing hooks (e.g., `useViewWindow`) before introducing new utilities.
- UI uses Tailwind-esque utility classes and Material UI; stick with existing patterns to avoid style drift.

## When touching the layout engine
- Update both engine math (`src/layout/*.ts`) and rendering consumers together; most regressions show up as card overlap or anchor misplacement.
- Regenerate or adjust targeted tests plus any telemetry assertions, then document changes in the appropriate SRS section.