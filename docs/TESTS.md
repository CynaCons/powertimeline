# Test Documentation

This document tracks Playwright regression coverage for PowerTimeline and is updated after every full suite run.

**Last Updated:** 2025-11-27
**Version:** v0.5.7

## Test Suites Overview

PowerTimeline uses Playwright for end-to-end testing with the following test categories:

| Suite | Location | Purpose |
|-------|----------|---------|
| Editor Tests | `tests/editor/` | Timeline editor functionality (66 files) |
| Home Tests | `tests/home/` | Home page and navigation (8 files) |
| Admin Tests | `tests/admin/` | Admin panel functionality (5 files) |
| User Tests | `tests/user/` | User profile and editing (2 files) |
| Production Tests | `tests/production/` | Production smoke tests (5 files) |
| E2E Tests | `tests/e2e/` | End-to-end user journeys |
| Stream Tests | `tests/stream/` | Stream View functionality |

## Test Naming Convention

**IMPORTANT:** All test files MUST use a numbered prefix in the format `NN-description.spec.ts`:

```
01-foundation.smoke.spec.ts      # Basic smoke tests
82-stream-viewer.spec.ts         # Stream viewer tests
100-hover-performance.spec.ts    # Performance tests
```

**Rules:**
- Number prefix must be 2-3 digits (e.g., `01`, `82`, `100`)
- Use the next available number in sequence for new tests
- Descriptive kebab-case name after the number
- End with `.spec.ts` (or `.smoke.spec.ts` for smoke tests)

**Current highest number:** Check `tests/editor/` and `tests/stream/` directories before creating new tests.

## Production Tests (Latest)

- **Date:** 2025-11-27
- **Target:** https://powertimeline.com
- **Results:** 11 passing / 0 failing

| Test | Description | Status |
|------|-------------|--------|
| 01-smoke | Landing hero renders without errors | ✅ Pass |
| 01-smoke | Landing shows example timeline cards | ✅ Pass |
| 02-navigation | CTA "Sign In" routes to login | ✅ Pass |
| 02-navigation | CTA "Explore Examples" routes to /browse | ✅ Pass |
| 02-navigation | Top nav Browse button routes to /browse | ✅ Pass |
| 02-navigation | Example card navigates to timeline viewer | ✅ Pass |
| 03-browse-page | Browse page renders timeline grid | ✅ Pass |
| 04-timeline-viewer | Timeline viewer renders in read-only mode | ✅ Pass |
| 05-auth-ui | Top nav shows Sign In button | ✅ Pass |
| 05-auth-ui | CTA get-started says "Sign In" | ✅ Pass |
| 05-auth-ui | Sign In button navigates to /login | ✅ Pass |

## Editor Tests (v5 Suite)

<!-- GENERATED:RUN-SUMMARY -->
- **Date:** 2025-10-02
- **Runner:** `npm run test:update-doc` (Playwright 1.54.2)
- **Spec files:** 59 passing / 0 failing (59 total)
- **Individual tests:** 166 passing / 0 failing (166 total)
<!-- /GENERATED:RUN-SUMMARY -->

- **Notes:** All test suites passing! 14 tests skipped (connector features not implemented, some debugging tests).

## Detailed Results

<!-- GENERATED:DETAILS -->
| Test File | Summary | Category | Linked Requirements | Status (2025-10-02) |
|---|---|---|---|---|
| **Foundation & Core Tests** | | | | |
| v5/01-foundation.smoke.spec.ts | Verifies app loads and timeline axis is visible | Foundation & Core Tests | CC-REQ-FOUND-001 | ✅ Pass |
| v5/02-cards-placement.spec.ts | Ensures cards render above and below the axis | Foundation & Core Tests | CC-REQ-CARDS-001 | ✅ Pass |
| v5/03-non-overlap-fit.spec.ts | Prevents card overlaps including Napoleon Fit-All scenario | Foundation & Core Tests | CC-REQ-CARDS-002 | ✅ Pass |
| **Telemetry & Monitoring Tests** | | | | |
| v5/04-dispatch-band.spec.ts | Monitors dispatch band average events per cluster | Telemetry & Monitoring Tests | - | ✅ Pass |
| v5/05-capacity-model.spec.ts | Reports total and used cells with utilization telemetry | Telemetry & Monitoring Tests | CC-REQ-CAPACITY-001 | ✅ Pass |
| v5/06-degrade-promote.spec.ts | Checks degradation counts and placeholder telemetry | Telemetry & Monitoring Tests | CC-REQ-DEGRADATION-001 | ✅ Pass |
| v5/07-aggregation-policy.spec.ts | Validates aggregation metrics reconcile with event counts | Telemetry & Monitoring Tests | - | ✅ Pass |
| v5/08-stability-churn.spec.ts | Confirms layout stability with minimal churn after viewport change | Telemetry & Monitoring Tests | CC-REQ-LAYOUT-004 | ✅ Pass |
| v5/11-half-column-telemetry.spec.ts | Validates half-column slot telemetry structure | Telemetry & Monitoring Tests | - | ✅ Pass |
| **Layout & Positioning Tests** | | | | |
| v5/10-space-optimization.spec.ts | Measures horizontal space usage and spatial distribution metrics | Layout & Positioning Tests | CC-REQ-LAYOUT-SEMICOL-001 | ✅ Pass |
| v5/12-alternating-pattern.spec.ts | Ensures alternating pattern between upper and lower semi-columns | Layout & Positioning Tests | CC-REQ-LAYOUT-003 | ✅ Pass |
| v5/14-navigation-rail-overlap.spec.ts | Prevents cards from colliding with navigation rail | Layout & Positioning Tests | CC-REQ-LAYOUT-002 | ✅ Pass |
| v5/16-real-viewport-layout.spec.ts | Confirms layout positions in realistic and narrow viewport sizes | Layout & Positioning Tests | - | ✅ Pass |
| **Card Degradation Tests** | | | | |
| v5/36-card-degradation-system.spec.ts | Validates card degradation transitions from full to compact | Card Degradation Tests | CC-REQ-DEGRADATION-001 | ✅ Pass |
| v5/37-degradation-system-validation.spec.ts | Verifies degradation across Napoleon, RFK, WWII datasets and telemetry | Card Degradation Tests | CC-REQ-DEGRADATION-001 | ✅ Pass |
| v5/38-degradation-with-real-data.spec.ts | Runs degradation engine against real Napoleon dataset | Card Degradation Tests | CC-REQ-DEGRADATION-001 | ✅ Pass |
| v5/39-simple-degradation-test.spec.ts | Covers basic degradation behavior and telemetry math checks | Card Degradation Tests | CC-REQ-DEGRADATION-001 | ✅ Pass |
| v5/42-degradation-investigation.spec.ts | Investigates degradation triggers within Napoleon timeline | Card Degradation Tests | - | ⚪ Not run |
| v5/43-degradation-fix-validation.spec.ts | Validates degradation fixes for green cards and consistency | Card Degradation Tests | - | ⚪ Not run |
| v5/44-simple-degradation-validation.spec.ts | Checks simplified degradation validation and telemetry output | Card Degradation Tests | - | ⚪ Not run |
| v5/45-degradation-with-generated-data.spec.ts | Runs degradation engine with generated dense event sets | Card Degradation Tests | - | ⚪ Not run |
| v5/46-degradation-reality-check.spec.ts | Performs degradation reality check on Napoleon timeline data | Card Degradation Tests | - | ⚪ Not run |
| v5/47-jfk-fitall-overflow-semi.spec.ts | Ensures JFK Fit-All semi-columns avoid overflow stacking issues | Card Degradation Tests | CC-REQ-SEMICOL-002 | ✅ Pass |
| v5/48-title-only-degradation.spec.ts | Validates title-only degradation under dense clusters | Card Degradation Tests | CC-REQ-CARD-TITLE-ONLY | ✅ Pass |
| v5/49-title-only-capacity-and-width.spec.ts | Checks title-only card capacity limits and width targets | Card Degradation Tests | CC-REQ-CARD-TITLE-ONLY | ⚪ Not run |
| **Overflow Management Tests** | | | | |
| v5/13-overflow-logic.spec.ts | Verifies half-column overflow thresholds and regression scenarios | Overflow Management Tests | CC-REQ-OVERFLOW-001/002 | ✅ Pass |
| v5/15-overflow-label-overlap.spec.ts | Checks overflow label spacing to avoid overlaps | Overflow Management Tests | CC-REQ-OVERFLOW-004 | ✅ Pass |
| v5/30-leftover-overflow-detection.spec.ts | Detects leftover overflow badges across navigation sequences | Overflow Management Tests | CC-REQ-OVERFLOW-001/002 | ✅ Pass |
| v5/31-aggressive-leftover-detection.spec.ts | Stresses overflow detection via aggressive navigation patterns | Overflow Management Tests | CC-REQ-ANCHOR-001 | ✅ Pass |
| v5/32-view-window-overflow-bug.spec.ts | Recreates view window overflow bug scenarios to ensure cleanup | Overflow Management Tests | CC-REQ-ANCHOR-001 | ✅ Pass |
| v5/56-overflow-indicators-visibility.spec.ts | Validates overflow indicator visibility and positioning accuracy | Overflow Management Tests | CC-REQ-OVERFLOW-003 | ✅ Pass |
| **Anchor & Timeline Alignment Tests** | | | | |
| v5/33-directional-anchors.spec.ts | Validates directional anchor connectors and cleanup behavior | Anchor & Timeline Alignment Tests | CC-REQ-ANCHOR-001/003 | ✅ Pass |
| v5/57-anchor-date-alignment.spec.ts | Checks anchor date alignment across zoom and panning | Anchor & Timeline Alignment Tests | CC-REQ-ANCHOR-002 | ✅ Pass |
| v5/58-comprehensive-anchor-alignment.spec.ts | Performs comprehensive anchor alignment across datasets and zooms | Anchor & Timeline Alignment Tests | CC-REQ-ANCHOR-002 | ✅ Pass |
| v5/61-anchor-persistence-french-revolution.spec.ts | Ensures anchor persistence across zooms for French Revolution data | Anchor & Timeline Alignment Tests | CC-REQ-ANCHOR-004, CC-REQ-LAYOUT-004 | ✅ Pass |
| **Zoom & Navigation Tests** | | | | |
| v5/17-zoom-functionality.spec.ts | Exercises zoom controls, mouse wheel, and filtering | Zoom & Navigation Tests | CC-REQ-ZOOM-001 | ✅ Pass |
| v5/18-zoom-stability.spec.ts | Covers zoom stability, cursor anchoring, and range limits | Zoom & Navigation Tests | CC-REQ-ZOOM-002 | ✅ Pass |
| v5/19-zoom-edge-cases.spec.ts | Tests extreme zoom edge cases and performance | Zoom & Navigation Tests | CC-REQ-ZOOM-002 | ✅ Pass |
| v5/20-timeline-cursor-zoom.spec.ts | Validates timeline cursor zoom anchoring and overflow targeting | Zoom & Navigation Tests | CC-REQ-ZOOM-001 | ✅ Pass |
| v5/23-zoom-stability.spec.ts | Checks zoom stability across repeated cycles and cursor positions | Zoom & Navigation Tests | CC-REQ-ZOOM-002 | ✅ Pass |
| v5/24-zoom-boundaries.spec.ts | Ensures zoom boundaries clamp correctly | Zoom & Navigation Tests | CC-REQ-ZOOM-001 | ✅ Pass |
| v5/25-max-zoom-sliding.spec.ts | Verifies max zoom sliding constraints and cursor alignment | Zoom & Navigation Tests | CC-REQ-ZOOM-003 | ✅ Pass |
| v5/28-napoleon-sliding-validation.spec.ts | Runs sliding validation across Napoleon timeline view windows | Zoom & Navigation Tests | - | ✅ Pass |
| v5/29-deep-zoom-comprehensive-sliding.spec.ts | Exercises deep zoom sliding scenarios for overflow consistency | Zoom & Navigation Tests | CC-REQ-ZOOM-003 | ✅ Pass |
| **Minimap Tests** | | | | |
| v5/21-timeline-minimap.spec.ts | Examines minimap rendering, range indicator, density, navigation | Minimap Tests | CC-REQ-MINIMAP-001 | ✅ Pass |
| v5/22-minimap-basic.spec.ts | Validates minimap basic behavior and empty states | Minimap Tests | CC-REQ-MINIMAP-001 | ✅ Pass |
| v5/26-minimap-drag.spec.ts | Validates minimap drag interactions and boundary enforcement | Minimap Tests | CC-REQ-MINIMAP-002 | ✅ Pass |
| v5/27-minimap-timeline-sync.spec.ts | Ensures minimap and timeline stay synchronized during interaction | Minimap Tests | CC-REQ-MINIMAP-002 | ✅ Pass |
| v5/63-minimap-overlay-visibility.spec.ts | Ensures minimap stays visible and highlights under overlays | Minimap Tests | - | ✅ Pass |
| v5/65-minimap-manual-verification.spec.ts | Manual minimap verification for z-index and loading integrity | Minimap Tests | - | ⚪ Not run |
| **Timeline Axis Tests** | | | | |
| v5/33-timeline-separators.spec.ts | Ensures timeline separators render according to scale settings | Timeline Axis Tests | CC-REQ-AXIS-001 | ✅ Pass |
| v5/34-adaptive-timeline-scales.spec.ts | Checks adaptive timeline scale labels across zoom levels | Timeline Axis Tests | CC-REQ-AXIS-001 | ✅ Pass |
| v5/35-adaptive-scale-visibility.spec.ts | Ensures adaptive scale visibility and axis styling remain legible | Timeline Axis Tests | CC-REQ-AXIS-001 | ✅ Pass |
| v5/62-timeline-scale-date-alignment.spec.ts | Validates timeline scale labels align with hover dates | Timeline Axis Tests | CC-REQ-AXIS-002 | ✅ Pass |
| v5/64-axis-black-styling.spec.ts | Ensures axis bar, ticks, and labels render solid black | Timeline Axis Tests | CC-REQ-AXIS-003 | ✅ Pass |
| **UI & Panels Tests** | | | | |
| v5/50-panels-visibility.spec.ts | Verifies panels visibility, Create overlay behavior, Dev panel sizing | UI & Panels Tests | CC-REQ-UI-001 | ✅ Pass |
| v5/51-authoring-overlay.spec.ts | Validates authoring overlay interactions and validation states | UI & Panels Tests | CC-REQ-UI-002 | ✅ Pass |
| v5/52-panel-scroll-behavior.spec.ts | Ensures side panel scrolling is isolated from timeline canvas | UI & Panels Tests | CC-REQ-UI-001 | ✅ Pass |
| v5/53-inline-plus-create.spec.ts | Confirms inline 'plus' affordances launch Create overlay | UI & Panels Tests | - | ✅ Pass |
| v5/55-navigation-enhancements.spec.ts | Checks enhanced navigation shortcuts, command palette, breadcrumbs | UI & Panels Tests | CC-REQ-UI-003 | ✅ Pass |
| **Data Management Tests** | | | | |
| v5/55-yaml-export-import.spec.ts | Verifies YAML export/import availability and gating | Data Management Tests | CC-REQ-DATA-001 | ✅ Pass |
| **Visual Design Tests** | | | | |
| v5/40-card-color-system.spec.ts | Validates card color system visuals and accessibility guidance | Visual Design Tests | CC-REQ-VISUAL-001 | ✅ Pass |
| v5/41-visual-color-demo.spec.ts | Provides visual demo coverage for card color variations | Visual Design Tests | CC-REQ-VISUAL-001 | ✅ Pass |
| **Integration & Scenarios Tests** | | | | |
| v5/09-seeding-scenarios.spec.ts | Covers seeded historical scenarios and screenshot baselines | Integration & Scenarios Tests | - | ✅ Pass |
| v5/59-necker-demo.spec.ts | Demonstrates Necker event alignment issue and resolution | Integration & Scenarios Tests | - | ✅ Pass |
| v5/60-necker-zoom-demo.spec.ts | Shows Necker alignment across multiple zoom levels | Integration & Scenarios Tests | - | ✅ Pass |
<!-- /GENERATED:DETAILS -->

## Category Summary

<!-- GENERATED:CATEGORY-SUMMARY -->
| Category | Total Tests | Passing | Failing | Pass Rate |
|---|---|---|---|---|
| Foundation & Core Tests | 3 | 3 | 0 | 100% |
| Telemetry & Monitoring Tests | 6 | 6 | 0 | 100% |
| Layout & Positioning Tests | 4 | 4 | 0 | 100% |
| Card Degradation Tests | 12 | 6 | 6 | 50% |
| Overflow Management Tests | 6 | 6 | 0 | 100% |
| Anchor & Timeline Alignment Tests | 4 | 4 | 0 | 100% |
| Zoom & Navigation Tests | 9 | 9 | 0 | 100% |
| Minimap Tests | 6 | 5 | 1 | 83% |
| Timeline Axis Tests | 5 | 5 | 0 | 100% |
| UI & Panels Tests | 5 | 5 | 0 | 100% |
| Data Management Tests | 1 | 1 | 0 | 100% |
| Visual Design Tests | 2 | 2 | 0 | 100% |
| Integration & Scenarios Tests | 3 | 3 | 0 | 100% |
<!-- /GENERATED:CATEGORY-SUMMARY -->

## Updating This Document

### Full Test Suite + Update (10-15 minutes)

Run the automated refresh script to execute all tests and update this document:

```powershell
npm run test:update-doc
```

This command executes the v5 suite with the JSON reporter, regenerates the sections marked above, and leaves raw artifacts under `tmp/test-docs/`.
It exits with the same status as Playwright, so expect a non-zero code while failures remain.

**Note:** Running all 169 tests takes 10-15 minutes. The script will appear to hang but is actually running tests.

### Quick Update from Existing Results (instant)

If you just want to regenerate TESTS.md from the most recent test run without re-running all tests:

```powershell
node scripts/generate-test-doc.js --write-doc
```

This uses the cached results from `tmp/test-docs/test-results.json` and completes instantly.

## Test Environment Setup

### Authentication

Most tests use **public timeline routes** that don't require authentication. Tests navigate to:
- `/:username/timeline/:timelineId` - e.g., `/cynacons/timeline/french-revolution`

This allows tests to run without valid Firebase credentials.

### Available Test Timelines

| Timeline ID | Owner | Description |
|-------------|-------|-------------|
| `french-revolution` | cynacons | French Revolution (150+ events) |
| `napoleon-bonaparte` | cynacons | Napoleon's life and campaigns |
| `rfk-1968` | cynacons | RFK assassination timeline |
| `jfk-presidency` | cynacons | JFK presidency timeline |
| `charles-de-gaulle` | cynacons | De Gaulle timeline |

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx playwright test tests/editor/50-panels-visibility.spec.ts

# Run with headed browser (visible)
npx playwright test tests/editor/50*.spec.ts --headed

# Run production smoke tests only
npm run test:prod
```

### Common Issues

1. **"Login failed - check credentials"**: Tests should use `loadTestTimeline()` instead of `loginAsTestUser()` for read-only tests
2. **"timeline-axis not found"**: Ensure dev server is running on port 5175
3. **"event-card not found"**: Timeline may not have loaded - check network and route

## Version History

- **v0.8.3** (current): Migrated tests to use public timeline routes, fixed auth failures
- **v0.5.7**: Production tests passing (11/11). Auth deployment complete.
- **v0.5.6**: Landing page polish and mobile responsiveness.
- **v0.3.1**: Automated Playwright run on 2025-09-26 (v1.54.2). 8 / 65 spec files passing.
- **Historical status:** No earlier recorded runs.

## Notes

- Maintain telemetry suites as golden baseline—they currently exercise working instrumentation.
- Focus future fixes on layout, zoom, minimap, and degradation regressions to improve pass rate.
- Re-run the full suite and refresh this document after each major fix batch.