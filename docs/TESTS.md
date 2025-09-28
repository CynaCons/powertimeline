# Test Documentation

This document tracks Playwright regression coverage for ChronoChart and is updated after every full suite run.

## Latest Playwright Run

<!-- GENERATED:RUN-SUMMARY -->
- **Date:** 2025-09-28
- **Runner:** `npm run test:update-doc` (Playwright 1.54.2)
- **Spec files:** 8 passing / 57 failing (65 total)
- **Individual tests:** 95 passing / 82 failing (177 total)
<!-- /GENERATED:RUN-SUMMARY -->

- **Notes:** Telemetry-focused suites continue to pass; layout, zoom, minimap, and degradation suites require follow-up.

## Detailed Results

<!-- GENERATED:DETAILS -->
| Test File | Summary | Category | Linked Requirements | Status (2025-09-28) |
|---|---|---|---|---|
| **Foundation & Core Tests** | | | | |
| v5/01-foundation.smoke.spec.ts | Verifies app loads and timeline axis is visible | Foundation & Core Tests | CC-REQ-FOUND-001 | ✅ Pass |
| v5/02-cards-placement.spec.ts | Ensures cards render above and below the axis | Foundation & Core Tests | CC-REQ-CARDS-001 | ❌ Fail — cards render above and below the axis |
| v5/03-non-overlap-fit.spec.ts | Prevents card overlaps including Napoleon Fit-All scenario | Foundation & Core Tests | CC-REQ-CARDS-002 | ❌ Fail — Napoleon at Fit-All has no card overlaps |
| **Telemetry & Monitoring Tests** | | | | |
| v5/04-dispatch-band.spec.ts | Monitors dispatch band average events per cluster | Telemetry & Monitoring Tests | - | ✅ Pass |
| v5/05-capacity-model.spec.ts | Reports total and used cells with utilization telemetry | Telemetry & Monitoring Tests | CC-REQ-CAPACITY-001 | ✅ Pass |
| v5/06-degrade-promote.spec.ts | Checks degradation counts and placeholder telemetry | Telemetry & Monitoring Tests | CC-REQ-DEGRADATION-001 | ✅ Pass |
| v5/07-aggregation-policy.spec.ts | Validates aggregation metrics reconcile with event counts | Telemetry & Monitoring Tests | - | ✅ Pass |
| v5/08-stability-churn.spec.ts | Confirms layout stability with minimal churn after viewport change | Telemetry & Monitoring Tests | CC-REQ-LAYOUT-004 | ✅ Pass |
| v5/11-half-column-telemetry.spec.ts | Validates half-column slot telemetry structure | Telemetry & Monitoring Tests | - | ✅ Pass |
| **Layout & Positioning Tests** | | | | |
| v5/10-space-optimization.spec.ts | Measures horizontal space usage and spatial distribution metrics | Layout & Positioning Tests | CC-REQ-LAYOUT-SEMICOL-001 | ❌ Fail — validates spatial distribution metrics for dense scenarios |
| v5/12-alternating-pattern.spec.ts | Ensures alternating pattern between upper and lower semi-columns | Layout & Positioning Tests | CC-REQ-LAYOUT-003 | ❌ Fail — Simple incremental events — alternating pattern |
| v5/14-navigation-rail-overlap.spec.ts | Prevents cards from colliding with navigation rail | Layout & Positioning Tests | CC-REQ-LAYOUT-002 | ❌ Fail — Cards should not be behind navigation rail |
| v5/16-real-viewport-layout.spec.ts | Confirms layout positions in realistic and narrow viewport sizes | Layout & Positioning Tests | - | ❌ Fail — Cards should be properly positioned in realistic browser viewport |
| **Card Degradation Tests** | | | | |
| v5/36-card-degradation-system.spec.ts | Validates card degradation transitions from full to compact | Card Degradation Tests | CC-REQ-DEGRADATION-001 | ❌ Fail — Card degradation system - full to compact cards |
| v5/37-degradation-system-validation.spec.ts | Verifies degradation across Napoleon, RFK, WWII datasets and telemetry | Card Degradation Tests | CC-REQ-DEGRADATION-001 | ❌ Fail — Card degradation system - Napoleon 1769-1821 |
| v5/38-degradation-with-real-data.spec.ts | Runs degradation engine against real Napoleon dataset | Card Degradation Tests | CC-REQ-DEGRADATION-001 | ❌ Fail — Degradation system with Napoleon dataset - Real data validation |
| v5/39-simple-degradation-test.spec.ts | Covers basic degradation behavior and telemetry math checks | Card Degradation Tests | CC-REQ-DEGRADATION-001 | ❌ Fail — Degradation system basic functionality |
| v5/42-degradation-investigation.spec.ts | Investigates degradation triggers within Napoleon timeline | Card Degradation Tests | - | ❌ Fail — Degradation system investigation - Napoleon timeline |
| v5/43-degradation-fix-validation.spec.ts | Validates degradation fixes for green cards and consistency | Card Degradation Tests | - | ❌ Fail — Degradation system should show green cards when overflow badges appear |
| v5/44-simple-degradation-validation.spec.ts | Checks simplified degradation validation and telemetry output | Card Degradation Tests | - | ❌ Fail — Degradation system basic fix validation |
| v5/45-degradation-with-generated-data.spec.ts | Runs degradation engine with generated dense event sets | Card Degradation Tests | - | ❌ Fail — Degradation system with generated dense events |
| v5/46-degradation-reality-check.spec.ts | Performs degradation reality check on Napoleon timeline data | Card Degradation Tests | - | ❌ Fail — Degradation system reality check with Napoleon timeline |
| v5/47-jfk-fitall-overflow-semi.spec.ts | Ensures JFK Fit-All semi-columns avoid overflow stacking issues | Card Degradation Tests | CC-REQ-SEMICOL-002 | ❌ Fail — No semi-column shows 2 full cards plus overflow badge |
| v5/48-title-only-degradation.spec.ts | Validates title-only degradation under dense clusters | Card Degradation Tests | CC-REQ-CARD-TITLE-ONLY | ❌ Fail — dense clusters trigger title-only cards without overlaps |
| v5/49-title-only-capacity-and-width.spec.ts | Checks title-only card capacity limits and width targets | Card Degradation Tests | CC-REQ-CARD-TITLE-ONLY | ❌ Fail — title-only width matches full/compact and per-cluster count <= 8 |
| **Overflow Management Tests** | | | | |
| v5/13-overflow-logic.spec.ts | Verifies half-column overflow thresholds and regression scenarios | Overflow Management Tests | CC-REQ-OVERFLOW-001/002 | ❌ Fail — Half-column overflow - Simple incremental test |
| v5/15-overflow-label-overlap.spec.ts | Checks overflow label spacing to avoid overlaps | Overflow Management Tests | CC-REQ-OVERFLOW-004 | ✅ Pass |
| v5/30-leftover-overflow-detection.spec.ts | Detects leftover overflow badges across navigation sequences | Overflow Management Tests | CC-REQ-OVERFLOW-001/002 | ❌ Fail — Detect leftover overflow indicators that persist in empty timeline regions |
| v5/31-aggressive-leftover-detection.spec.ts | Stresses overflow detection via aggressive navigation patterns | Overflow Management Tests | CC-REQ-ANCHOR-001 | ❌ Fail — Force leftover overflow by rapid navigation and zoom changes |
| v5/32-view-window-overflow-bug.spec.ts | Recreates view window overflow bug scenarios to ensure cleanup | Overflow Management Tests | CC-REQ-ANCHOR-001 | ❌ Fail — Reproduce leftover overflow by resetting zoom constraints temporarily |
| v5/56-overflow-indicators-visibility.spec.ts | Validates overflow indicator visibility and positioning accuracy | Overflow Management Tests | CC-REQ-OVERFLOW-003 | ❌ Fail — Overflow badges appear when events exceed capacity |
| **Anchor & Timeline Alignment Tests** | | | | |
| v5/33-directional-anchors.spec.ts | Validates directional anchor connectors and cleanup behavior | Anchor & Timeline Alignment Tests | CC-REQ-ANCHOR-001/003 | ❌ Fail — Verify anchor connectors point toward events (above/below timeline) |
| v5/57-anchor-date-alignment.spec.ts | Checks anchor date alignment across zoom and panning | Anchor & Timeline Alignment Tests | CC-REQ-ANCHOR-002 | ❌ Fail — Anchors align with corresponding timeline dates at default zoom |
| v5/58-comprehensive-anchor-alignment.spec.ts | Performs comprehensive anchor alignment across datasets and zooms | Anchor & Timeline Alignment Tests | CC-REQ-ANCHOR-002 | ❌ Fail — Anchors align precisely with event dates across multiple timelines |
| v5/61-anchor-persistence-french-revolution.spec.ts | Ensures anchor persistence across zooms for French Revolution data | Anchor & Timeline Alignment Tests | CC-REQ-ANCHOR-004, CC-REQ-LAYOUT-004 | ❌ Fail — Anchors remain visible at all zoom levels (CC-REQ-ANCHOR-004) |
| **Zoom & Navigation Tests** | | | | |
| v5/17-zoom-functionality.spec.ts | Exercises zoom controls, mouse wheel, and filtering | Zoom & Navigation Tests | CC-REQ-ZOOM-001 | ❌ Fail — Zoom controls should filter visible events |
| v5/18-zoom-stability.spec.ts | Covers zoom stability, cursor anchoring, and range limits | Zoom & Navigation Tests | CC-REQ-ZOOM-002 | ❌ Fail — Cursor anchoring - Event should stay under cursor during zoom |
| v5/19-zoom-edge-cases.spec.ts | Tests extreme zoom edge cases and performance | Zoom & Navigation Tests | CC-REQ-ZOOM-002 | ❌ Fail — Extreme zoom limits should not break system |
| v5/20-timeline-cursor-zoom.spec.ts | Validates timeline cursor zoom anchoring and overflow targeting | Zoom & Navigation Tests | CC-REQ-ZOOM-001 | ❌ Fail — Cursor anchoring issue - Position vs Zoom behavior |
| v5/23-zoom-stability.spec.ts | Checks zoom stability across repeated cycles and cursor positions | Zoom & Navigation Tests | CC-REQ-ZOOM-002 | ❌ Fail — Cursor position remains stable during repeated zoom cycles |
| v5/24-zoom-boundaries.spec.ts | Ensures zoom boundaries clamp correctly | Zoom & Navigation Tests | CC-REQ-ZOOM-001 | ❌ Fail — Zoom does not stick to timeline start boundary |
| v5/25-max-zoom-sliding.spec.ts | Verifies max zoom sliding constraints and cursor alignment | Zoom & Navigation Tests | CC-REQ-ZOOM-003 | ❌ Fail — View window should not slide when at maximum zoom level |
| v5/28-napoleon-sliding-validation.spec.ts | Runs sliding validation across Napoleon timeline view windows | Zoom & Navigation Tests | - | ❌ Fail — Step-by-step sliding from beginning to end detects layout issues |
| v5/29-deep-zoom-comprehensive-sliding.spec.ts | Exercises deep zoom sliding scenarios for overflow consistency | Zoom & Navigation Tests | CC-REQ-ZOOM-003 | ❌ Fail — Maximum zoom level sliding with no overlaps and consistent overflow indicators |
| **Minimap Tests** | | | | |
| v5/21-timeline-minimap.spec.ts | Examines minimap rendering, range indicator, density, navigation | Minimap Tests | CC-REQ-MINIMAP-001 | ❌ Fail — Minimap displays and shows timeline range |
| v5/22-minimap-basic.spec.ts | Validates minimap basic behavior and empty states | Minimap Tests | CC-REQ-MINIMAP-001 | ❌ Fail — Minimap shows event density markers |
| v5/26-minimap-drag.spec.ts | Validates minimap drag interactions and boundary enforcement | Minimap Tests | CC-REQ-MINIMAP-002 | ❌ Fail — View window can be dragged to slide timeline position |
| v5/27-minimap-timeline-sync.spec.ts | Ensures minimap and timeline stay synchronized during interaction | Minimap Tests | CC-REQ-MINIMAP-002 | ❌ Fail — Timeline events update when minimap view window is dragged |
| v5/63-minimap-overlay-visibility.spec.ts | Ensures minimap stays visible and highlights under overlays | Minimap Tests | - | ❌ Fail — minimap should remain visible and ungreyed when authoring overlay is open |
| v5/65-minimap-manual-verification.spec.ts | Manual minimap verification for z-index and loading integrity | Minimap Tests | - | ❌ Fail — verify minimap loads and z-index is correct |
| **Timeline Axis Tests** | | | | |
| v5/33-timeline-separators.spec.ts | Ensures timeline separators render according to scale settings | Timeline Axis Tests | CC-REQ-AXIS-001 | ❌ Fail — Timeline scales - complete functionality verification |
| v5/34-adaptive-timeline-scales.spec.ts | Checks adaptive timeline scale labels across zoom levels | Timeline Axis Tests | CC-REQ-AXIS-001 | ❌ Fail — timeline scales adapt from years to days across zoom levels |
| v5/35-adaptive-scale-visibility.spec.ts | Ensures adaptive scale visibility and axis styling remain legible | Timeline Axis Tests | CC-REQ-AXIS-001 | ❌ Fail — timeline scales are visible and adapt across zoom levels |
| v5/62-timeline-scale-date-alignment.spec.ts | Validates timeline scale labels align with hover dates | Timeline Axis Tests | CC-REQ-AXIS-002 | ❌ Fail — Timeline scale labels match actual hover dates (CC-REQ-AXIS-002) |
| **UI & Panels Tests** | | | | |
| v5/50-panels-visibility.spec.ts | Verifies panels visibility, Create overlay behavior, Dev panel sizing | UI & Panels Tests | CC-REQ-UI-001 | ❌ Fail — Events panel is visible and full-height |
| v5/51-authoring-overlay.spec.ts | Validates authoring overlay interactions and validation states | UI & Panels Tests | CC-REQ-UI-002 | ❌ Fail — opens centered and large from Events selection |
| v5/52-panel-scroll-behavior.spec.ts | Ensures side panel scrolling is isolated from timeline canvas | UI & Panels Tests | CC-REQ-UI-001 | ❌ Fail — scroll wheel over Events panel scrolls the panel (not the canvas) |
| v5/53-inline-plus-create.spec.ts | Confirms inline 'plus' affordances launch Create overlay | UI & Panels Tests | - | ❌ Fail — top and bottom add buttons open Create |
| v5/55-navigation-enhancements.spec.ts | Checks enhanced navigation shortcuts, command palette, breadcrumbs | UI & Panels Tests | CC-REQ-UI-003 | ❌ Fail — keyboard shortcuts work for navigation |
| **Data Management Tests** | | | | |
| v5/55-yaml-export-import.spec.ts | Verifies YAML export/import availability and gating | Data Management Tests | CC-REQ-DATA-001 | ❌ Fail — export and import timeline via YAML |
| **Visual Design Tests** | | | | |
| v5/40-card-color-system.spec.ts | Validates card color system visuals and accessibility guidance | Visual Design Tests | CC-REQ-VISUAL-001 | ❌ Fail — Card color system - Visual validation |
| v5/41-visual-color-demo.spec.ts | Provides visual demo coverage for card color variations | Visual Design Tests | CC-REQ-VISUAL-001 | ❌ Fail — Card color system visual demo |
| **Integration & Scenarios Tests** | | | | |
| v5/09-seeding-scenarios.spec.ts | Covers seeded historical scenarios and screenshot baselines | Integration & Scenarios Tests | - | ❌ Fail — RFK 1968 — timeline date range coverage |
| v5/59-necker-demo.spec.ts | Demonstrates Necker event alignment issue and resolution | Integration & Scenarios Tests | - | ❌ Fail — Demonstrate Necker event alignment issue and fix |
| v5/60-necker-zoom-demo.spec.ts | Shows Necker alignment across multiple zoom levels | Integration & Scenarios Tests | - | ❌ Fail — Demonstrate Necker event alignment at multiple zoom levels |
<!-- /GENERATED:DETAILS -->

## Category Summary

<!-- GENERATED:CATEGORY-SUMMARY -->
| Category | Total Tests | Passing | Failing | Pass Rate |
|---|---|---|---|---|
| Foundation & Core Tests | 3 | 1 | 2 | 33% |
| Telemetry & Monitoring Tests | 6 | 6 | 0 | 100% |
| Layout & Positioning Tests | 4 | 0 | 4 | 0% |
| Card Degradation Tests | 12 | 0 | 12 | 0% |
| Overflow Management Tests | 6 | 1 | 5 | 17% |
| Anchor & Timeline Alignment Tests | 4 | 0 | 4 | 0% |
| Zoom & Navigation Tests | 9 | 0 | 9 | 0% |
| Minimap Tests | 6 | 0 | 6 | 0% |
| Timeline Axis Tests | 4 | 0 | 4 | 0% |
| UI & Panels Tests | 5 | 0 | 5 | 0% |
| Data Management Tests | 1 | 0 | 1 | 0% |
| Visual Design Tests | 2 | 0 | 2 | 0% |
| Integration & Scenarios Tests | 3 | 0 | 3 | 0% |
<!-- /GENERATED:CATEGORY-SUMMARY -->

## Updating This Document

Run the automated refresh script whenever you need to capture a new Playwright run:

```powershell
npm run test:update-doc
```

This command executes the v5 suite with the JSON reporter, regenerates the sections marked above, and leaves raw artifacts under `tmp/test-docs/`.
It exits with the same status as Playwright, so expect a non-zero code while failures remain.

## Version History

- **v0.3.1** (current): Automated Playwright run on 2025-09-26 (v1.54.2). 8 / 65 spec files passing.
- **Historical status:** No earlier recorded runs.

## Notes

- Maintain telemetry suites as golden baseline—they currently exercise working instrumentation.
- Focus future fixes on layout, zoom, minimap, and degradation regressions to improve pass rate.
- Re-run the full suite and refresh this document after each major fix batch.