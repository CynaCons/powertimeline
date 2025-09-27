# Chronochart SRS — Foundation & Core Rendering

This document extracts the "Foundation & Core Rendering" requirements from `SRS.md` so they can evolve independently while staying traceable. Each requirement keeps its canonical ID and references the implementation code and validation tests.

## CC-REQ-FOUND-001 — Timeline axis renders on startup

**Description**

When Chronochart launches with the default seeded dataset, the timeline axis must appear immediately as the visual spine of the experience.

**Acceptance Criteria**

1. Launching the app with the default developer seed (`seedFrenchRevolutionTimeline`) renders a horizontal timeline axis element within **1 second** of the first React paint.
2. The axis uses the canonical selector (`data-testid="timeline-axis"`) and exposes `role="presentation"` for accessibility tooling.
3. At least one tick mark element is present within the axis container when it first renders.
4. The axis spans the central horizontal band of the viewport (±24px of the vertical midpoint) and remains visible while data is loading.

**Traceability**

- **Code:** `src/layout/DeterministicLayoutComponent.tsx`, `src/App.tsx`
- **Tests:** `tests/v5/01-foundation.smoke.spec.ts`

## CC-REQ-CARDS-001 — Baseline cards appear above and below the axis

**Description**

Chronochart must demonstrate vertical balance by placing cards in both upper and lower lanes whenever the default seed contains events for each side.

**Acceptance Criteria**

1. Given the default developer seed (`seedFrenchRevolutionTimeline`), at least one event card renders entirely within an upper semi-column and another renders entirely within a lower semi-column within **2 seconds** of app startup.
2. Upper-lane cards have their bounding boxes located at least **12px above** the axis centerline; lower-lane cards sit at least **12px below** the centerline.
3. Each rendered card displays a title and a formatted date string on first paint; missing content fails the requirement.
4. If a dataset lacks events for one side, the UI must display an inline empty-state message explaining the absence rather than silently failing.

**Traceability**

- **Code:** `src/layout/LayoutEngine.ts`, `src/layout/DeterministicLayoutComponent.tsx`
- **Tests:** `tests/v5/02-cards-placement.spec.ts`

---

## Change Log

| Date | Revision | Notes |
|---|---|---|
| 2025-09-27 | v1 | Extracted from `docs/SRS.md` and clarified acceptance criteria. |
