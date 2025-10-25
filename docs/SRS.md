# PowerTimeline Software Requirements Specification (SRS)

This SRS is the single source of truth for PowerTimeline requirements. Each requirement has a stable ID and a table entry with acceptance, status, primary code references, and linked tests. Status lifecycle: Proposed → Approved → Implemented → Verified.

## Overview
- Product: PowerTimeline — interactive historical timeline explorer.
- Scope: Timeline rendering, card layout and overflow, anchors, zoom/pan, minimap, and axis scales. Out of scope: accounts, collaboration, media.

## Functional Requirements by Feature Area

### 1. Foundation & Core Rendering

➡️ See [`SRS_FOUNDATION.md`](SRS_FOUNDATION.md) for detailed acceptance criteria and change history.

| ID | Requirement (summary) | Code | Tests |
|---|---|---|---|
| CC-REQ-FOUND-001 | Timeline axis appears within 1s of startup with ticks and accessibility hooks | `src/layout/DeterministicLayoutComponent.tsx`, `src/App.tsx` | v5/01 |
| CC-REQ-CARDS-001 | Default seed renders balanced cards above/below axis with visible content | `src/layout/LayoutEngine.ts`, `src/layout/DeterministicLayoutComponent.tsx` | v5/02 |

### 2. Card Layout & Positioning

➡️ See [`SRS_LAYOUT.md`](SRS_LAYOUT.md) for detailed acceptance criteria, implementation notes, and change history covering the layout engine and positioning guarantees.

### 3. Card Types & Degradation

➡️ See [`SRS_CARDS_SYSTEM.md`](SRS_CARDS_SYSTEM.md) for detailed acceptance criteria, slot allocation rules, and overflow management specifications.

➡️ See [`SDS_CARDS_SYSTEM.md`](SDS_CARDS_SYSTEM.md) for technical design specifications including degradation algorithms, badge merging strategy, and implementation architecture.

| ID | Requirement (summary) | Code | Tests |
|---|---|---|---|
| CC-REQ-CARD-FULL-001 | Full cards are ~169px tall and show multi-line body without clipping | `src/layout/config.ts`, `src/layout/DeterministicLayoutComponent.tsx` | v5/03 |
| CC-REQ-CARD-COMPACT-001 | Compact cards have same width as full (260px), ~92px tall, and show 1–2 description lines | `src/layout/config.ts`, `src/layout/DeterministicLayoutComponent.tsx` | v5/03, v5/47 |
| CC-REQ-CARD-TITLE-ONLY | Title-only cards appear when cluster density exceeds compact capacity, with no overlaps | `src/layout/LayoutEngine.ts`, `src/layout/DeterministicLayoutComponent.tsx` | v5/48 |
| CC-REQ-SEMICOL-002 | If a semi-column totals 3–4 events, degrade to compact and show them without overflow; overflow only after visible budget is exceeded | `src/layout/LayoutEngine.ts`, `src/layout/config.ts` | v5/47 |
| CC-REQ-DEGRADATION-001 | Cards automatically degrade from full → compact → title-only based on density to prevent overlaps | `src/layout/LayoutEngine.ts` | v5/36, v5/37, v5/38, v5/39 |

### 4. Overflow & Capacity Management

➡️ See [`SRS_CARDS_SYSTEM.md`](SRS_CARDS_SYSTEM.md) for complete overflow and capacity requirements.

| ID | Requirement (summary) | Code | Tests |
|---|---|---|---|
| CC-REQ-OVERFLOW-001 | Navigating to an empty period shows no leftover overflow badges | `src/layout/LayoutEngine.ts`, `src/layout/DeterministicLayoutComponent.tsx` | v5/30 |
| CC-REQ-OVERFLOW-002 | Overflow reduces/disappears appropriately when zooming out | `src/layout/LayoutEngine.ts`, `src/layout/DeterministicLayoutComponent.tsx` | v5/30 |
| CC-REQ-OVERFLOW-003 | When events exceed capacity, overflow badges (+N) appear showing hidden event count | `src/layout/LayoutEngine.ts`, `src/layout/DeterministicLayoutComponent.tsx` | v5/56 |
| CC-REQ-OVERFLOW-004 | Overflow indicators maintain minimum spacing to prevent visual overlap | `src/layout/DeterministicLayoutComponent.tsx` | v5/15 |
| CC-REQ-CAPACITY-001 | System reports total/used cells and utilization metrics for monitoring | `src/layout/LayoutEngine.ts` | v5/05 |

### 5. Anchors & Timeline Alignment

| ID | Requirement | Code | Tests |
|---|---|---|---|
| CC-REQ-ANCHOR-001 | Render an anchor only if there are visible cards (or in-view overflow) for that semi-column; suppress stale anchors | `src/layout/DeterministicLayoutComponent.tsx`, `src/layout/LayoutEngine.ts` | v5/31, v5/32, v5/33 |
| CC-REQ-ANCHOR-002 | Anchor X positions precisely match corresponding event dates on timeline axis at all zoom levels | `src/layout/LayoutEngine.ts` | v5/57 |
| CC-REQ-ANCHOR-003 | Anchors connect to their respective event clusters with clear visual grouping | `src/layout/DeterministicLayoutComponent.tsx` | v5/33 |
| CC-REQ-ANCHOR-004 | Anchors remain visible at all times regardless of card degradation state; anchors provide timeline reference even when cards are hidden | `src/layout/LayoutEngine.ts` | v5/61-anchor-persistence |

### 6. Zoom & Navigation

➡️ See [`SRS_ZOOM.md`](SRS_ZOOM.md) for detailed acceptance criteria, implementation notes, edge case handling, and change history covering the zoom and navigation system.

| ID | Requirement (summary) | Code | Tests |
|---|---|---|---|
| CC-REQ-ZOOM-001 | Zoom filters visible events; cursor-anchored zoom keeps time under cursor stable; boundaries clamp | `src/App.tsx`, `src/app/hooks/useViewWindow.ts` | v5/17, v5/20, v5/24 |
| CC-REQ-ZOOM-002 | Zoom operations maintain event positions relative to cursor and handle edge cases gracefully | `src/app/hooks/useViewWindow.ts` | v5/18, v5/19, v5/23 |
| CC-REQ-ZOOM-003 | System supports maximum zoom down to minute-level precision with appropriate scaling | `src/app/hooks/useViewWindow.ts` | v5/25, v5/29 |

### 7. Minimap

➡️ See [`SRS_MINIMAP.md`](SRS_MINIMAP.md) for detailed acceptance criteria covering display, navigation, event highlighting, and overlay integration.

| ID | Requirement (summary) | Code | Tests |
|---|---|---|---|
| CC-REQ-MINIMAP-DISPLAY-001 | Minimap displays timeline range with start/end year labels | `src/components/TimelineMinimap.tsx` | v5/21, v5/22 |
| CC-REQ-MINIMAP-DISPLAY-002 | Event markers show position of all events along timeline bar | `src/components/TimelineMinimap.tsx` | v5/21, v5/22 |
| CC-REQ-MINIMAP-DISPLAY-003 | Density heatmap gradient indicates event concentration | `src/components/TimelineMinimap.tsx` | v5/21 |
| CC-REQ-MINIMAP-NAV-001 | Click navigation centers view window on clicked position | `src/components/TimelineMinimap.tsx` | v5/21, v5/22 |
| CC-REQ-MINIMAP-NAV-002 | Drag view window to slide timeline with smooth tracking | `src/components/TimelineMinimap.tsx` | v5/26, v5/27 |
| CC-REQ-MINIMAP-HIGHLIGHT-001 | Selected event highlighted in amber with distinct visual treatment | `src/components/TimelineMinimap.tsx` | v5/63 |
| CC-REQ-MINIMAP-HIGHLIGHT-002 | Hovered event highlighted in sky blue | `src/components/TimelineMinimap.tsx` | - |

### 8. Timeline Axis & Scales

| ID | Requirement | Code | Tests |
|---|---|---|---|
| CC-REQ-AXIS-001 | Labels adapt across zooms (decades→years→months/days/hours) with readable density; sub-14-day windows promote day headers to the upper tier while hour labels shift to the lower tier for clarity | `src/timeline/hooks/useAxisTicks.ts`, `src/components/EnhancedTimelineAxis.tsx`, `src/layout/DeterministicLayoutComponent.tsx` | v5/34, v5/35 |
| CC-REQ-AXIS-002 | Timeline scale labels accurately correspond to actual event dates; hovering over scale positions shows correct dates matching scale labels; year-scale spans cap primary tick density at ≤16 for readability | `src/components/EnhancedTimelineAxis.tsx`, `src/timeline/hooks/useAxisTicks.ts` | v5/62-timeline-scale-date-alignment |
| CC-REQ-AXIS-003 | Timeline axis renders as a solid black bar with black tick marks and black scale labels (no gradients or opacity effects) across all zoom levels | `src/components/EnhancedTimelineAxis.tsx`, `src/styles/colors.ts`, `src/styles/tokens.css` | `tests/v5/64-axis-black-styling.spec.ts` |

### 9. User Interface & Panels

| ID | Requirement | Code | Tests |
|---|---|---|---|
| CC-REQ-UI-001 | Navigation panels can be toggled and maintain proper visibility states | `src/app/OverlayShell.tsx`, `src/components/NavigationRail.tsx` | v5/50, v5/52 |
| CC-REQ-UI-002 | Event creation and editing interface provides form validation and proper data handling | `src/app/overlays/AuthoringOverlay.tsx` | v5/51 |
| CC-REQ-UI-003 | Navigation rail provides intuitive access to features with keyboard support (ArrowUp/Down navigation) | `src/components/NavigationRail.tsx` | v5/55 |

### 10. Data Management & Export

| ID | Requirement | Code | Tests |
|---|---|---|---|
| CC-REQ-DATA-001 | Timeline data can be exported to and imported from YAML format with validation | `src/utils/yamlSerializer.ts` | v5/55 |
| CC-REQ-DATA-002 | Timeline events are stored and retrieved reliably across sessions | `src/lib/storage.ts` | - |

### 11. Visual Design & Theming

| ID | Requirement | Code | Tests |
|---|---|---|---|
| CC-REQ-VISUAL-001 | Events display with category-based color coding for visual organization | `src/layout/cardIcons.ts`, `src/styles/colors.ts` | v5/40, v5/41 |
| CC-REQ-VISUAL-002 | Application supports light/dark/system theme switching with localStorage persistence | `src/contexts/ThemeContext.tsx` | - |

### 12. Core Timeline Components

| ID | Requirement | Code | Tests |
|---|---|---|---|
| CC-REQ-TIMELINE-CORE-001 | Timeline axis is displayed in the middle with events positioned above and below | `src/layout/DeterministicLayoutComponent.tsx`, `src/components/EnhancedTimelineAxis.tsx` | v5/01, v5/02 |
| CC-REQ-TIMELINE-CORE-002 | Hovering over timeline displays date tooltip at cursor position | `src/components/EnhancedTimelineAxis.tsx` | v5/62-timeline-scale-date-alignment |
| CC-REQ-TIMELINE-CORE-003 | Timeline scales adapt from decades to hours based on zoom level with readable density | `src/utils/timelineTickGenerator.ts`, `src/components/EnhancedTimelineAxis.tsx` | v5/34, v5/35 |

### 13. Event Cards

| ID | Requirement | Code | Tests |
|---|---|---|---|
| CC-REQ-CARDS-DISPLAY-001 | Event cards display with title, date, and description fields | `src/layout/CardRenderer.tsx`, `src/layout/DeterministicLayoutComponent.tsx` | v5/02 |
| CC-REQ-CARDS-DISPLAY-002 | Cards have three display types: full (169px), compact (92px), and title-only (32px) | `src/layout/config.ts`, `src/layout/LayoutEngine.ts` | v5/03, v5/47, v5/48 |
| CC-REQ-CARDS-DISPLAY-003 | Cards are color-coded by card type (full, compact, title-only) for visual distinction | `src/layout/cardIcons.ts`, `src/styles/colors.ts` | v5/40, v5/41 |

### 18. Home Page & Timeline Discovery

➡️ See [`SRS_HOME_PAGE.md`](SRS_HOME_PAGE.md) for detailed requirements covering the landing page, user directory, timeline browsing, routing structure, and search/filter functionality.

### 19. Timeline Creation & Management

➡️ See [`SRS_TIMELINE_CREATION.md`](SRS_TIMELINE_CREATION.md) for ASPICE-style requirements covering timeline CRUD operations (Create, Edit, Delete) with ID/title distinction, form validation, and localStorage persistence (v0.4.1).

| ID | Requirement (summary) | Code | Tests |
|---|---|---|---|
| CC-REQ-CREATE-001 | The software shall provide a dialog to create new timelines | TBD | v5/74 |
| CC-REQ-CREATE-ID-001 | The software shall generate unique timeline IDs from titles with per-user uniqueness validation | TBD | v5/75 |
| CC-REQ-EDIT-001 | The software shall allow editing timeline metadata (title, description, ID) from card menu | TBD | v5/76 |
| CC-REQ-DELETE-001 | The software shall require confirmation before deleting timelines | TBD | v5/77 |

### 14. Navigation & Panels

| ID | Requirement | Code | Tests |
|---|---|---|---|
| CC-REQ-NAV-RAIL-001 | Navigation rail is displayed on the left with icon buttons for panel access | `src/components/NavigationRail.tsx`, `src/App.tsx` | v5/50 |
| CC-REQ-PANELS-OUTLINE-001 | Outline panel (Events) displays list of all events with text filter functionality | `src/app/panels/OutlinePanel.tsx` | v5/50, v5/52 |
| CC-REQ-PANELS-OUTLINE-002 | Outline panel includes "+ Add Event" button to create new events | `src/app/panels/OutlinePanel.tsx` | - |
| CC-REQ-PANELS-DEV-001 | Developer panel provides data seeding and debugging tools | `src/app/panels/DevPanel.tsx` | - |

### 15. Event Interaction

| ID | Requirement | Code | Tests |
|---|---|---|---|
| CC-REQ-INTERACTION-HOVER-001 | Events can be hovered over on cards, anchors, or panel items with visual feedback | `src/App.tsx` (hoveredEventId state), `src/layout/DeterministicLayoutComponent.tsx` | - |
| CC-REQ-INTERACTION-SELECT-001 | Single-clicking an event card selects it and highlights it in timeline and minimap | `src/App.tsx` (selectedEventId state), `src/layout/DeterministicLayoutComponent.tsx`, `src/components/TimelineMinimap.tsx` | - |
| CC-REQ-INTERACTION-DBLCLICK-001 | Double-clicking an event card opens it in the authoring overlay for editing | `src/layout/CardRenderer.tsx`, `src/App.tsx` | v5/51, v5/76 |

### 16. Authoring Mode

| ID | Requirement | Code | Tests |
|---|---|---|---|
| CC-REQ-AUTHORING-OVERLAY-001 | Authoring overlay allows creating and editing events with form interface | `src/app/overlays/AuthoringOverlay.tsx` | v5/51 |
| CC-REQ-AUTHORING-FORM-001 | Authoring form includes title, date, time, description, and category fields | `src/app/overlays/AuthoringOverlay.tsx` | v5/51 |
| CC-REQ-AUTHORING-VALID-001 | Authoring overlay validates required fields before saving events | `src/app/overlays/AuthoringOverlay.tsx` | v5/51 |
| CC-REQ-AUTHORING-PERSIST-001 | Event CRUD operations (create, update, delete) must persist to timeline storage in localStorage | `src/App.tsx:54-70` | v5/76 |
| CC-REQ-AUTHORING-PERSIST-002 | Events must survive page refresh and load correctly when timeline is reopened | `src/App.tsx:72-99` | v5/76 |

### 17. Enhanced Minimap System

➡️ **CONSOLIDATED**: All minimap requirements moved to Section 7 and detailed in [`SRS_MINIMAP.md`](SRS_MINIMAP.md)

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