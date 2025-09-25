# Chronochart Software Requirements Specification (SRS)

This SRS is the single source of truth for Chronochart requirements. Each requirement has a stable ID and a table entry with acceptance, status, primary code references, and linked tests. Status lifecycle: Proposed → Approved → Implemented → Verified.

## Overview
- Product: Chronochart — interactive historical timeline explorer.
- Scope: Timeline rendering, card layout and overflow, anchors, zoom/pan, minimap, and axis scales. Out of scope: accounts, collaboration, media.

## Functional Requirements by Feature Area

### 1. Foundation & Core Rendering

| ID | Title | Acceptance (summary) | Status | Code (primary) | Tests |
|---|---|---|---|---|---|
| CC-REQ-FOUND-001 | Axis visible on load | App renders a visible timeline axis element. | Verified | `src/layout/DeterministicLayoutComponent.tsx` (axis), `src/App.tsx` | v5/01 |
| CC-REQ-CARDS-001 | Cards above/below axis | Seeded data renders at least one card above and one below the axis. | Verified | `src/layout/LayoutEngine.ts`, `src/layout/DeterministicLayoutComponent.tsx` | v5/02 |

### 2. Card Layout & Positioning

| ID | Title | Acceptance (summary) | Status | Code (primary) | Tests |
|---|---|---|---|---|---|
| CC-REQ-LAYOUT-001 | No overlaps at any zoom | Across zoom levels and view windows, visible cards never overlap for baseline datasets and while navigating. | Verified | `src/layout/LayoutEngine.ts` (positioning/separation), `src/layout/DeterministicLayoutComponent.tsx` | v5/03, v5/29 |
| CC-REQ-LAYOUT-SEMICOL-001 | Efficient semi-columns and one anchor | Reduced margins and inter-card spacing; exactly one anchor per semi-column. | Implemented | `src/layout/LayoutEngine.ts` (margins/spacing), anchor logic | v5/10, v5/33 |
| CC-REQ-LAYOUT-002 | Navigation rail clearance | Event cards must not be positioned behind the navigation rail, maintaining adequate left margin. | Verified | `src/layout/LayoutEngine.ts` (margin calculations) | v5/14 |
| CC-REQ-LAYOUT-003 | Alternating pattern | Events should alternate between upper and lower semi-columns for visual balance when possible. | Verified | `src/layout/LayoutEngine.ts` (placement logic) | v5/12 |
| CC-REQ-LAYOUT-004 | Adjustable horizontal cluster spacing | Horizontal spacing between event clusters should be configurable to optimize visual density while preventing overlap. | Implemented | `src/layout/LayoutEngine.ts` (minSpacing = 0.75 * adaptiveHalfColumnWidth) | v5/61-anchor-persistence ✅ |

### 3. Card Types & Degradation

| ID | Title | Acceptance (summary) | Status | Code (primary) | Tests |
|---|---|---|---|---|---|
| CC-REQ-CARD-FULL-001 | Full cards: multi-line, ~169px | Full cards are ~169px tall, show multi-line body without clipping. | Approved | `src/layout/config.ts`, `src/layout/DeterministicLayoutComponent.tsx` | v5/03 (indirect) |
| CC-REQ-CARD-COMPACT-001 | Compact: width=full, ~78px, 1–2 lines | Compact cards have same width as full (260px), ~78px tall, and show 1–2 description lines. | Approved | `src/layout/config.ts`, `src/layout/DeterministicLayoutComponent.tsx` | v5/03 (indirect), v5/47 |
| CC-REQ-CARD-TITLE-ONLY | Title-only cards render in high density | Title-only cards appear when cluster density exceeds compact capacity, with no overlaps. | Verified | `src/layout/LayoutEngine.ts`, `src/layout/DeterministicLayoutComponent.tsx` | v5/48 |
| CC-REQ-SEMICOL-002 | No "2 full + overflow" semi-column | If a semi-column totals 3–4 events, degrade to compact and show them without overflow; overflow only after visible budget is exceeded. | Verified | `src/layout/LayoutEngine.ts` (degradation + combined pool), `src/layout/config.ts` | v5/47 |
| CC-REQ-DEGRADATION-001 | Progressive degradation system | Cards automatically degrade from full → compact → title-only based on density to prevent overlaps. | Verified | `src/layout/LayoutEngine.ts` (degradation logic) | v5/36, v5/37, v5/38, v5/39 |

### 4. Overflow & Capacity Management

| ID | Title | Acceptance (summary) | Status | Code (primary) | Tests |
|---|---|---|---|---|---|
| CC-REQ-OVERFLOW-001 | No leftover overflow in empty regions | Navigating to an empty period shows no leftover overflow badges. | Verified | `src/layout/LayoutEngine.ts` (view-window filtering), `src/layout/DeterministicLayoutComponent.tsx` (anchor filtering) | v5/30 |
| CC-REQ-OVERFLOW-002 | Overflow clears on zoom out | Overflow reduces/disappears appropriately when zooming out. | Verified | Same as above | v5/30 |
| CC-REQ-OVERFLOW-003 | Overflow indicators display | When events exceed capacity, overflow badges (+N) appear showing hidden event count. | Implemented | `src/layout/LayoutEngine.ts` (overflow calculation), `src/layout/DeterministicLayoutComponent.tsx` (badge rendering) | v5/56 |
| CC-REQ-OVERFLOW-004 | Overflow label spacing | Overflow indicators maintain minimum spacing to prevent visual overlap. | Verified | `src/layout/DeterministicLayoutComponent.tsx` (badge positioning) | v5/15 |
| CC-REQ-CAPACITY-001 | Capacity model telemetry | System reports total/used cells and utilization metrics for monitoring. | Verified | `src/layout/LayoutEngine.ts` (telemetry) | v5/05 |

### 5. Anchors & Timeline Alignment

| ID | Title | Acceptance (summary) | Status | Code (primary) | Tests |
|---|---|---|---|---|---|
| CC-REQ-ANCHOR-001 | Anchors only for visible groups | Render an anchor only if there are visible cards (or in-view overflow) for that semi-column; suppress stale anchors. | Verified | `src/layout/DeterministicLayoutComponent.tsx` (filtered anchors), `src/layout/LayoutEngine.ts` | v5/31, v5/32, v5/33 |
| CC-REQ-ANCHOR-002 | Anchors align with timeline dates | Anchor X positions precisely match corresponding event dates on timeline axis at all zoom levels. | Implemented | `src/layout/LayoutEngine.ts` (createEventAnchors), coordinate system alignment | v5/57 |
| CC-REQ-ANCHOR-003 | Directional anchor placement | Anchors connect to their respective event clusters with clear visual grouping. | Verified | `src/layout/DeterministicLayoutComponent.tsx` (anchor rendering) | v5/33 |
| CC-REQ-ANCHOR-004 | Persistent anchor visibility | Anchors remain visible at all times regardless of card degradation state; anchors provide timeline reference even when cards are hidden. | Implemented | `src/layout/LayoutEngine.ts` (anchor creation without view window filtering) | v5/61-anchor-persistence ✅ |

### 6. Zoom & Navigation

| ID | Title | Acceptance (summary) | Status | Code (primary) | Tests |
|---|---|---|---|---|---|
| CC-REQ-ZOOM-001 | Zoom behavior + cursor anchoring | Zoom filters visible events; cursor-anchored zoom keeps time under cursor stable; boundaries clamp. | Verified | `src/App.tsx`, `src/app/hooks/useViewWindow.ts` | v5/17, v5/20, v5/24 |
| CC-REQ-ZOOM-002 | Zoom stability | Zoom operations maintain event positions relative to cursor and handle edge cases gracefully. | Verified | `src/app/hooks/useViewWindow.ts` (zoom logic) | v5/18, v5/19, v5/23 |
| CC-REQ-ZOOM-003 | Deep zoom functionality | System supports maximum zoom down to minute-level precision with appropriate scaling. | Verified | `src/app/hooks/useViewWindow.ts` (zoom boundaries) | v5/25, v5/29 |

### 7. Minimap

| ID | Title | Acceptance (summary) | Status | Code (primary) | Tests |
|---|---|---|---|---|---|
| CC-REQ-MINIMAP-001 | Minimap basics + click | Minimap shows range and density; click moves the view window. | Verified | `src/components/TimelineMinimap.tsx` | v5/21, v5/22 |
| CC-REQ-MINIMAP-002 | Minimap drag/window sync | Dragging minimap window updates main view; window reflects zoom. | Verified | `src/components/TimelineMinimap.tsx` | v5/26, v5/27, v5/24 |

### 8. Timeline Axis & Scales

| ID | Title | Acceptance (summary) | Status | Code (primary) | Tests |
|---|---|---|---|---|---|
| CC-REQ-AXIS-001 | Adaptive timeline scales | Labels adapt across zooms (decades→years→months/days/hours) with readable density. | Verified | `src/timeline/hooks/useAxisTicks.ts`, `src/layout/DeterministicLayoutComponent.tsx` | v5/34, v5/35 |
| CC-REQ-AXIS-002 | Timeline scale-date alignment | Timeline scale labels must accurately correspond to actual event dates; hovering over scale positions should show correct dates matching scale labels. | Implemented | `src/components/EnhancedTimelineAxis.tsx` (hover calculation), `src/timeline/hooks/useAxisTicks.ts` | v5/62-timeline-scale-date-alignment ⚠️ |

### 9. User Interface & Panels

| ID | Title | Acceptance (summary) | Status | Code (primary) | Tests |
|---|---|---|---|---|---|
| CC-REQ-UI-001 | Panel visibility control | Navigation panels can be toggled and maintain proper visibility states. | Verified | `src/app/OverlayShell.tsx`, `src/components/NavigationRail.tsx` | v5/50, v5/52 |
| CC-REQ-UI-002 | Authoring overlay functionality | Event creation and editing interface provides form validation and proper data handling. | Verified | `src/app/overlays/AuthoringOverlay.tsx` | v5/51 |
| CC-REQ-UI-003 | Navigation enhancements | Navigation rail provides intuitive access to features with keyboard support. | Verified | `src/components/NavigationRail.tsx` | v5/55 |

### 10. Data Management & Export

| ID | Title | Acceptance (summary) | Status | Code (primary) | Tests |
|---|---|---|---|---|---|
| CC-REQ-DATA-001 | YAML export/import | Timeline data can be exported to and imported from YAML format with validation. | Verified | `src/utils/yamlSerializer.ts` | v5/55 (yaml) |
| CC-REQ-DATA-002 | Data persistence | Timeline events are stored and retrieved reliably across sessions. | Verified | `src/lib/storage.ts` | - |

### 11. Visual Design & Theming

| ID | Title | Acceptance (summary) | Status | Code (primary) | Tests |
|---|---|---|---|---|---|
| CC-REQ-VISUAL-001 | Card color system | Events display with category-based color coding for visual organization. | Verified | `src/layout/cardIcons.ts`, `src/styles/colors.ts` | v5/40, v5/41 |
| CC-REQ-VISUAL-002 | Theme support | Application supports light/dark theme switching with consistent styling. | Verified | `src/contexts/ThemeContext.tsx`, `src/styles/theme.ts` | - |

## Non-Functional Requirements

| ID | Title | Acceptance (summary) | Status | Notes |
|---|---|---|---|---|
| CC-REQ-NFR-001 | Performance | App remains responsive with ≈100 visible events; key interactions complete ≲2s on typical dev HW. | Approved | Future CI perf smoke recommended. |
| CC-REQ-NFR-002 | Accessibility | Overlays focus-trap and announce changes; controls have labels. | Approved | Add automated a11y checks in CI later. |
| CC-REQ-NFR-003 | Traceability | New tests annotate `req` to link back to IDs; SRS tables stay current. | Implemented | See tests with `test.info().annotations`. |

## Test Organization by Feature

### Foundation Tests
- v5/01-foundation.smoke.spec.ts
- v5/02-cards-placement.spec.ts

### Layout & Positioning Tests
- v5/03-non-overlap-fit.spec.ts
- v5/10-space-optimization.spec.ts
- v5/11-half-column-telemetry.spec.ts
- v5/12-alternating-pattern.spec.ts
- v5/14-navigation-rail-overlap.spec.ts
- v5/16-real-viewport-layout.spec.ts

### Card Degradation Tests
- v5/36-card-degradation-system.spec.ts
- v5/37-degradation-system-validation.spec.ts
- v5/38-degradation-with-real-data.spec.ts
- v5/39-simple-degradation-test.spec.ts
- v5/42-degradation-investigation.spec.ts
- v5/43-degradation-fix-validation.spec.ts
- v5/44-simple-degradation-validation.spec.ts
- v5/45-degradation-with-generated-data.spec.ts
- v5/46-degradation-reality-check.spec.ts
- v5/47-jfk-fitall-overflow-semi.spec.ts
- v5/48-title-only-degradation.spec.ts
- v5/49-title-only-capacity-and-width.spec.ts

### Overflow Management Tests
- v5/13-overflow-logic.spec.ts
- v5/15-overflow-label-overlap.spec.ts
- v5/30-leftover-overflow-detection.spec.ts
- v5/31-aggressive-leftover-detection.spec.ts
- v5/32-view-window-overflow-bug.spec.ts
- v5/56-overflow-indicators-visibility.spec.ts

### Anchor & Timeline Alignment Tests
- v5/33-directional-anchors.spec.ts
- v5/33-timeline-separators.spec.ts
- v5/57-anchor-date-alignment.spec.ts

### Zoom & Navigation Tests
- v5/17-zoom-functionality.spec.ts
- v5/18-zoom-stability.spec.ts
- v5/19-zoom-edge-cases.spec.ts
- v5/20-timeline-cursor-zoom.spec.ts
- v5/23-zoom-stability.spec.ts
- v5/24-zoom-boundaries.spec.ts
- v5/25-max-zoom-sliding.spec.ts
- v5/28-napoleon-sliding-validation.spec.ts
- v5/29-deep-zoom-comprehensive-sliding.spec.ts

### Minimap Tests
- v5/21-timeline-minimap.spec.ts
- v5/22-minimap-basic.spec.ts
- v5/26-minimap-drag.spec.ts
- v5/27-minimap-timeline-sync.spec.ts

### Timeline Axis Tests
- v5/34-adaptive-timeline-scales.spec.ts
- v5/35-adaptive-scale-visibility.spec.ts

### UI & Panels Tests
- v5/50-panels-visibility.spec.ts
- v5/51-authoring-overlay.spec.ts
- v5/52-panel-scroll-behavior.spec.ts
- v5/53-inline-plus-create.spec.ts
- v5/55-navigation-enhancements.spec.ts

### Data Management Tests
- v5/55-yaml-export-import.spec.ts

### Visual Design Tests
- v5/40-card-color-system.spec.ts
- v5/41-visual-color-demo.spec.ts

### Telemetry & Monitoring Tests
- v5/04-dispatch-band.spec.ts
- v5/05-capacity-model.spec.ts
- v5/06-degrade-promote.spec.ts
- v5/07-aggregation-policy.spec.ts
- v5/08-stability-churn.spec.ts

### Integration & Scenarios Tests
- v5/09-seeding-scenarios.spec.ts
- tests/panels-visibility.spec.ts

## Traceability Guidance
- Tests should add `test.info().annotations.push({ type: 'req', description: '<REQ-ID>' })` to indicate coverage.
- Code references list primary files; use `git blame` and comments sparingly to keep traceability clear.
- When adding or changing requirements, update the tables above and link at least one test per requirement before marking it Verified.

## Recent Changes
- Reorganized requirements by functional feature areas for better organization
- Added 15 new requirements covering layout, degradation, overflow, UI, data management, and visual design
- Mapped all 59 test files to corresponding feature areas
- Updated requirement statuses based on current implementation and test coverage