# Chronochart SRS — Foundation & Core Rendering

This document extracts the "Foundation & Core Rendering" requirements from `SRS.md` so they can evolve independently while staying traceable. Each requirement keeps its canonical ID and references the implementation code and validation tests.

## CC-REQ-FOUND-001 — Timeline axis renders on startup

**Core Requirement**

Chronochart must present a central timeline axis immediately after startup so users understand the temporal context without additional interaction.

**Draft Implementation Details (Revise as layout stabilizes)**

- Launching the app with the foundation default dataset (auto-seeded via `seedRFKTimeline` when storage is empty) should render a horizontal timeline axis element within **1 second** of the first React paint.
- The enhanced axis bar and its ticks expose `data-testid="timeline-axis"` / `data-testid="timeline-axis-tick"` along with `role="presentation"` to support tests and accessibility tooling.
- At least one tick mark element should be present inside the axis container when it first renders.
- The axis is expected to cover the central horizontal band of the viewport (±24px of the vertical midpoint) and remain visible while data loads.

**Validation Cues**

- `tests/v5/01-foundation.smoke.spec.ts` checks for the axis in the DOM using the canonical test id.
- Inspect `src/layout/DeterministicLayoutComponent.tsx` and `src/App.tsx` when refining timing or rendering guarantees.

## CC-REQ-CARDS-001 — Baseline cards appear above and below the axis

**Core Requirement**

With the default dataset, Chronochart should demonstrate vertical balance by rendering cards in both upper and lower lanes so the user immediately sees density on each side of the axis.

**Draft Implementation Details (Revise as layout stabilizes)**

- Given the foundation default dataset (auto-seeded via `seedRFKTimeline` when storage is empty), at least one event card should render entirely within an upper semi-column and another within a lower semi-column within **2 seconds** of app startup.
- Upper-lane cards should sit at least **12px above** the axis centerline; lower-lane cards should sit at least **12px below** the centerline.
- Each rendered card should display a title and a formatted date string on first paint; missing content indicates a regression.
- When a dataset lacks events for one side, the UI should surface an inline empty-state notice rather than silently omitting cards.

**Validation Cues**

- `tests/v5/02-cards-placement.spec.ts` asserts the presence of cards above and below the axis.
- Implementation lives in `src/layout/LayoutEngine.ts` and `src/layout/DeterministicLayoutComponent.tsx`; adjust spacing thresholds there before tightening the requirement.

---

## Change Log

| Date | Revision | Notes |
|---|---|---|
| 2025-09-28 | v1.1 | Documented auto-seeded foundation dataset and enhanced axis test identifiers. |
| 2025-09-27 | v1 | Extracted from `docs/SRS.md` and clarified acceptance criteria. |
