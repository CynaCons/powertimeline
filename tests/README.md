# Test Structure

## New Iterative Testing Approach

We've cleaned up the complex test suite and restarted with a simple, iterative approach that matches our development plan.

### Current Tests

We are migrating to a focused v5 TDD suite centered on cards placement & architecture.

Active (v5)
- `tests/v5/01-foundation.smoke.spec.ts` — app loads, axis visible
- `tests/v5/02-cards-placement.spec.ts` — cards render above/below axis (RFK seed)
- `tests/v5/03-non-overlap-fit.spec.ts` — no significant overlaps (RFK seed)
- `tests/v5/04-dispatch-band.spec.ts` — dispatch band telemetry
- `tests/v5/05-capacity-model.spec.ts` — capacity telemetry
- `tests/v5/06-degrade-promote.spec.ts` — degradations/promotions telemetry
- `tests/v5/07-aggregation-policy.spec.ts` — aggregation telemetry & reconciliation

Deferred (to be reintroduced progressively)
- `degradation-flow.spec.ts`, `clustered-count.spec.ts`, `no-overlap-and-axis-clearance.spec.ts`, `performance.spec.ts`, `basic-timeline.spec.ts`,
  `analyze-vertical-gaps.spec.ts`, `analyze-layout.spec.ts`, `space-usage-analysis.spec.ts`, `progressive-cluster-analysis.spec.ts`,
  `resize-behavior.spec.ts`, `zoom-mapping.spec.ts`, `timeline-proximity-test.spec.ts`, `admin-panel.spec.ts`, `info-panel-toggle.spec.ts`.

Archived (legacy or screenshot-heavy)
- Legacy SVG/UI era: `legacy.spec.ts`, `deterministic-layout.spec.ts`, `deterministic-simple.spec.ts`, `grid-lines.spec.ts`, `multi-row-lanes.spec.ts`,
  `editing-controls.spec.ts`, `node-expansion-edit.spec.ts`, `expanded-card-content.spec.ts`, `debug-expansion.spec.ts`.
- Visual dumps/screens: `column-system-visual.spec.ts` (+ snapshots), `napoleon-screenshot*.spec.ts`, `seeding-visual*.spec.ts` (+ snapshots),
  `triple-cluster-screenshot.spec.ts`, `smoke-ui.spec.ts`, `visual-regression.spec.ts`.

Location: All legacy specs and snapshots have been moved to `tests/_archive/`. The active suite lives under `tests/v5/`.

Rationale
- Keep tests tight, deterministic, and aligned with the new HTML card renderer and v5 layout goals.
- Reintroduce coverage with telemetry-driven assertions (capacity, dispatch band, degrade/promote, aggregation) as features land.

### Removed Tests

The following tests were removed as they were based on the old SVG+foreignObject architecture:
- `smoke-ui.spec.ts` - Complex UI tests with SVG selectors
- `accessibility-audit.spec.ts` - Accessibility tests for old architecture
- `editing-controls.spec.ts` - Tests for SVG-based editing
- `expanded-card-content.spec.ts` - Tests for foreignObject card expansion
- `grid-lines.spec.ts` - Tests for SVG grid lines
- `multi-row-lanes.spec.ts` - Tests for complex lane system
- `node-expansion-edit.spec.ts` - Tests for SVG node interactions
- `visual-regression.spec.ts` - Visual regression tests for old UI
- All associated snapshots

### Testing Philosophy

1. **One test file per feature area** - Clean separation of concerns
2. **Simple selectors** - HTML/CSS classes, not complex SVG paths
3. **Visual verification** - Screenshots for each major feature
4. **Skip until implemented** - Future tests marked as skipped until features exist
5. **Keep it simple** - Focus on core functionality, not edge cases

### Running Tests

```bash
# Run the focused v5 suite (playwright.config is scoped via testMatch)
npx playwright test

# Debug one v5 spec
npx playwright test tests/v5/02-cards-placement.spec.ts --headed

# Run just telemetry tests
npx playwright test tests/v5/0{4,5,6,7}-*.spec.ts
```