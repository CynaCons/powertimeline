# Chronochart Software Requirements Specification (SRS)

This document is the single source of truth for functional and non‑functional requirements. Requirements are identified by stable IDs and linked to automated tests and key implementation entry points. Status reflects lifecycle: Proposed → Approved → Implemented → Verified.

## 1. Overview and Scope
- Product: Chronochart, a web app to create and explore timelines.
- Scope: Timeline rendering, zoom/pan navigation, minimap, event card layout, overflow indication, and axis scales. User accounts, collaboration, and media are out of scope.

## 2. Definitions and Assumptions
- View window: Normalized [0..1] interval over the full timeline span.
- Half‑column: Independent stacking context above/below axis, max two cards, with overflow badges.
- Verified: Requirement has at least one passing test covering acceptance criteria.

## 3. Non‑Functional Requirements
- CC-REQ-NFR-001 Performance (Approved)
  - The app remains responsive with ~100 visible events; interactions complete within 2s.
  - Verification: smoke/perf passes in CI; manual profiling.
- CC-REQ-NFR-002 Accessibility (Approved)
  - Overlays are focus‑trapped, labeled, and announce changes.
  - Verification: spot checks; a11y audit (future automation).

## 4. Functional Requirements

### Foundation
- ID: CC-REQ-FOUND-001
  - Title: App loads with visible timeline axis
  - Type: Functional | Priority: High | Status: Verified
  - Acceptance: Visiting the app renders a visible timeline axis element.
  - Verification: tests/v5/01-foundation.smoke.spec.ts
  - Implementation: src/layout/DeterministicLayoutComponent.tsx (axis), src/App.tsx

### Cards and Layout
- ID: CC-REQ-CARDS-001
  - Title: Cards render above and below the axis
  - Type: Functional | Priority: High | Status: Verified
  - Acceptance: A seeded dataset produces at least one card above and one below the axis baseline.
  - Verification: tests/v5/02-cards-placement.spec.ts
  - Implementation: src/layout/LayoutEngine.ts, src/layout/DeterministicLayoutComponent.tsx

- ID: CC-REQ-CARDS-002
  - Title: Card overlap is bounded
  - Type: Functional | Priority: High | Status: Verified
  - Acceptance: Pairwise overlap ratio between rendered cards remains below a small threshold.
  - Verification: tests/v5/03-non-overlap-fit.spec.ts
  - Implementation: src/layout/LayoutEngine.ts (positioning), capacity/spacing constants


- ID: CC-REQ-LAYOUT-001
  - Title: No card overlaps at any zoom level
  - Type: Functional | Priority: High | Status: Approved
  - Acceptance: At all zoom levels and view windows, visible event cards do not overlap (their bounding boxes never intersect) for baseline datasets (e.g., RFK 1968, JFK 1961�63, Napoleon 1769�1821) and during navigation/zoom interactions.
  - Verification:
    - tests/v5/03-non-overlap-fit.spec.ts (RFK non-overlap, Napoleon Fit-All non-overlap)
    - tests/v5/29-deep-zoom-comprehensive-sliding.spec.ts (zero overlaps at maximum zoom across sliding positions)
  - Implementation: src/layout/LayoutEngine.ts (positioning, spacing, separation), src/layout/DeterministicLayoutComponent.tsx

- ID: CC-REQ-CARD-FULL-001
  - Title: Full cards display multi-line content without clipping
  - Type: Functional | Priority: High | Status: Approved
  - Acceptance: Full cards use the entire card height (~169px) for title and multi-line description (no artificial 2-line clamp), text wraps within the card and does not clip.
  - Verification: Visual checks in v5/03 and presence of sufficient lines in full cards; no overlaps per CC-REQ-LAYOUT-001.
  - Implementation: src/layout/config.ts (full height), src/layout/DeterministicLayoutComponent.tsx (remove aggressive clamps)

- ID: CC-REQ-CARD-COMPACT-001
  - Title: Compact cards match full card width and show 1�2 lines of text
  - Type: Functional | Priority: High | Status: Approved
  - Acceptance: Compact cards have same width as full cards, height ~78px, and display 1�2 lines of description without clipping.
  - Verification: Visual checks at compact density; no overlaps per CC-REQ-LAYOUT-001.
  - Implementation: src/layout/config.ts (compact width/height), src/layout/DeterministicLayoutComponent.tsx (render compact description)

- ID: CC-REQ-LAYOUT-SEMICOL-001
  - Title: Semi-columns use vertical space efficiently with reduced gaps
  - Type: Functional | Priority: Medium | Status: Approved
  - Acceptance: For semi-columns (half-columns) with two full cards, vertical margins are reduced (top/bottom/timeline) and inter-card spacing lowered to improve utilization; one anchor per semi-column.
  - Verification: v5/10-space-optimization.spec.ts (vertical/horizontal usage), anchor tests in v5/33; no overlaps per CC-REQ-LAYOUT-001.
  - Implementation: src/layout/LayoutEngine.ts (margins/spacing), anchor model unchanged (one per semi-column)

### Zoom and Navigation
- ID: CC-REQ-ZOOM-001
  - Title: Zoom filters visible events and preserves cursor anchoring
  - Type: Functional | Priority: High | Status: Verified
  - Acceptance: Zooming changes the number of visible cards and keeps the time under the cursor stable (within reasonable drift); boundaries clamp cleanly.
  - Verification: tests/v5/17-zoom-functionality.spec.ts (Zoom controls should filter visible events)
  - Implementation: src/app/hooks/useViewWindow.ts (zoom/zoomAtCursor), src/App.tsx (wheel handler)

- ID: CC-REQ-ZOOM-002
  - Title: Mouse wheel zoom is supported
  - Type: Functional | Priority: Medium | Status: Verified
  - Acceptance: Mouse wheel input changes zoom level regardless of modifier keys; card count changes accordingly.
  - Verification: tests/v5/17-zoom-functionality.spec.ts (Mouse wheel zoom test)
  - Implementation: src/App.tsx (wheel → zoomAtCursor)

- ID: CC-REQ-ZOOM-003
  - Title: Keyboard zoom shortcuts are supported
  - Type: Functional | Priority: Medium | Status: Verified
  - Acceptance: '+' zooms in and '-' zooms out, changing visible cards.
  - Verification: tests/v5/17-zoom-functionality.spec.ts (Keyboard zoom shortcuts)
  - Implementation: src/App.tsx (keydown handler)

### Minimap
- ID: CC-REQ-MINIMAP-001
  - Title: Minimap displays timeline range and density markers
  - Type: Functional | Priority: Medium | Status: Verified
  - Acceptance: Minimap shows start/end labels and density markers indicative of event distribution.
  - Verification: tests/v5/21-timeline-minimap.spec.ts (basic display, density markers)
  - Implementation: src/components/TimelineMinimap.tsx

- ID: CC-REQ-MINIMAP-002
  - Title: View window indicator reflects zoom state
  - Type: Functional | Priority: High | Status: Verified
  - Acceptance: As zoom changes, the minimap’s window width changes accordingly.
  - Verification: tests/v5/21-timeline-minimap.spec.ts (view window indicator reflects zoom)
  - Implementation: src/components/TimelineMinimap.tsx; src/app/hooks/useViewWindow.ts

- ID: CC-REQ-MINIMAP-004
  - Title: Minimap click navigates the view window
  - Type: Functional | Priority: High | Status: Verified
  - Acceptance: Clicking the minimap centers the main view near the clicked position.
  - Verification: tests/v5/21-timeline-minimap.spec.ts (click navigation works)
  - Implementation: src/components/TimelineMinimap.tsx

### Overflow Indicators
- ID: CC-REQ-OVERFLOW-001
  - Title: No leftover overflow badges in empty timeline regions
  - Type: Functional | Priority: High | Status: Verified
  - Acceptance: When navigating into a period with no visible events, no overflow badges remain.
  - Verification: tests/v5/30-leftover-overflow-detection.spec.ts (leftover detection test)
  - Implementation: src/layout/LayoutEngine.ts (view window filtering), src/layout/DeterministicLayoutComponent.tsx (anchor filtering)

- ID: CC-REQ-OVERFLOW-002
  - Title: Overflow badges clear when zooming back out
  - Type: Functional | Priority: Medium | Status: Verified
  - Acceptance: Overflow indicators reduce/disappear when zooming out from dense regions.
  - Verification: tests/v5/30-leftover-overflow-detection.spec.ts (cleanup on zoom out)
  - Implementation: Same as above

### Adaptive Timeline Scales
- ID: CC-REQ-AXIS-001
  - Title: Adaptive scales progress from decades/years to months/days/hours
  - Type: Functional | Priority: High | Status: Verified
  - Acceptance: Across zoom levels, labels reflect appropriate units; counts stay within readable bounds.
  - Verification: tests/v5/34-adaptive-timeline-scales.spec.ts (adaptivity); tests/v5/35-adaptive-scale-visibility.spec.ts
  - Implementation: src/timeline/hooks/useAxisTicks.ts; src/layout/DeterministicLayoutComponent.tsx (scale rendering)

- ID: CC-REQ-AXIS-002
  - Title: Scale readability and spacing
  - Type: Functional | Priority: Medium | Status: Verified
  - Acceptance: Labels avoid overlaps and maintain reasonable density at different zooms.
  - Verification: tests/v5/34-adaptive-timeline-scales.spec.ts (spacing/readability); tests/v5/35-adaptive-scale-visibility.spec.ts
  - Implementation: Same as above

- ID: CC-REQ-AXIS-003
  - Title: Scale edge cases at extreme zooms are handled
  - Type: Functional | Priority: Medium | Status: Verified
  - Acceptance: Extreme zoom‑out shows year/decade; extreme zoom‑in shows day/hour without overcrowding.
  - Verification: tests/v5/34-adaptive-timeline-scales.spec.ts (edge cases)
  - Implementation: Same as above

## 5. Verification Notes
- Tests are tagged with requirement IDs via Playwright annotations for traceability.
- A future CI step can parse these annotations to build a Req↔Test matrix without duplicating requirements in a second file.


