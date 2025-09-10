# Chronochart Software Requirements Specification (SRS)

This SRS is the single source of truth for Chronochart requirements. Each requirement has a stable ID and a table entry with acceptance, status, primary code references, and linked tests. Status lifecycle: Proposed → Approved → Implemented → Verified.

## Overview
- Product: Chronochart — interactive historical timeline explorer.
- Scope: Timeline rendering, card layout and overflow, anchors, zoom/pan, minimap, and axis scales. Out of scope: accounts, collaboration, media.

## Functional Requirements

| ID | Title | Acceptance (summary) | Status | Code (primary) | Tests |
|---|---|---|---|---|---|
| CC-REQ-FOUND-001 | Axis visible on load | App renders a visible timeline axis element. | Verified | `src/layout/DeterministicLayoutComponent.tsx` (axis), `src/App.tsx` | v5/01 |
| CC-REQ-CARDS-001 | Cards above/below axis | Seeded data renders at least one card above and one below the axis. | Verified | `src/layout/LayoutEngine.ts`, `src/layout/DeterministicLayoutComponent.tsx` | v5/02 |
| CC-REQ-LAYOUT-001 | No overlaps at any zoom | Across zoom levels and view windows, visible cards never overlap for baseline datasets and while navigating. | Verified | `src/layout/LayoutEngine.ts` (positioning/separation), `src/layout/DeterministicLayoutComponent.tsx` | v5/03, v5/29 |
| CC-REQ-SEMICOL-002 | No “2 full + overflow” semi-column | If a semi-column totals 3–4 events, degrade to compact and show them without overflow; overflow only after visible budget is exceeded. | Verified | `src/layout/LayoutEngine.ts` (degradation + combined pool), `src/layout/config.ts` | v5/47 |
| CC-REQ-CARD-FULL-001 | Full cards: multi-line, ~169px | Full cards are ~169px tall, show multi-line body without clipping. | Approved | `src/layout/config.ts`, `src/layout/DeterministicLayoutComponent.tsx` | v5/03 (indirect) |
| CC-REQ-CARD-COMPACT-001 | Compact: width=full, ~78px, 1–2 lines | Compact cards have same width as full (260px), ~78px tall, and show 1–2 description lines. | Approved | `src/layout/config.ts`, `src/layout/DeterministicLayoutComponent.tsx` | v5/03 (indirect), v5/47 |
| CC-REQ-LAYOUT-SEMICOL-001 | Efficient semi-columns and one anchor | Reduced margins and inter-card spacing; exactly one anchor per semi-column. | Implemented | `src/layout/LayoutEngine.ts` (margins/spacing), anchor logic | v5/10, v5/33 |
| CC-REQ-CARD-TITLE-ONLY | Title-only cards render in high density | Title-only cards appear when cluster density exceeds compact capacity, with no overlaps. | Verified | `src/layout/LayoutEngine.ts`, `src/layout/DeterministicLayoutComponent.tsx` | v5/48 |
| CC-REQ-OVERFLOW-001 | No leftover overflow in empty regions | Navigating to an empty period shows no leftover overflow badges. | Verified | `src/layout/LayoutEngine.ts` (view-window filtering), `src/layout/DeterministicLayoutComponent.tsx` (anchor filtering) | v5/30 |
| CC-REQ-OVERFLOW-002 | Overflow clears on zoom out | Overflow reduces/disappears appropriately when zooming out. | Verified | Same as above | v5/30 |
| CC-REQ-ANCHOR-001 | Anchors only for visible groups | Render an anchor only if there are visible cards (or in-view overflow) for that semi-column; suppress stale anchors. | Verified | `src/layout/DeterministicLayoutComponent.tsx` (filtered anchors), `src/layout/LayoutEngine.ts` | v5/31, v5/32, v5/33 |
| CC-REQ-MINIMAP-001 | Minimap basics + click | Minimap shows range and density; click moves the view window. | Verified | `src/components/TimelineMinimap.tsx` | v5/21, v5/22 |
| CC-REQ-MINIMAP-002 | Minimap drag/window sync | Dragging minimap window updates main view; window reflects zoom. | Verified | `src/components/TimelineMinimap.tsx` | v5/26, v5/27, v5/24 |
| CC-REQ-ZOOM-001 | Zoom behavior + cursor anchoring | Zoom filters visible events; cursor-anchored zoom keeps time under cursor stable; boundaries clamp. | Verified | `src/App.tsx`, `src/app/hooks/useViewWindow.ts` | v5/17, v5/20, v5/24 |
| CC-REQ-AXIS-001 | Adaptive timeline scales | Labels adapt across zooms (decades→years→months/days/hours) with readable density. | Verified | `src/timeline/hooks/useAxisTicks.ts`, `src/layout/DeterministicLayoutComponent.tsx` | v5/34, v5/35 |

## Non-Functional Requirements

| ID | Title | Acceptance (summary) | Status | Notes |
|---|---|---|---|---|
| CC-REQ-NFR-001 | Performance | App remains responsive with ≈100 visible events; key interactions complete ≲2s on typical dev HW. | Approved | Future CI perf smoke recommended. |
| CC-REQ-NFR-002 | Accessibility | Overlays focus-trap and announce changes; controls have labels. | Approved | Add automated a11y checks in CI later. |
| CC-REQ-NFR-003 | Traceability | New tests annotate `req` to link back to IDs; SRS tables stay current. | Implemented | See tests with `test.info().annotations`. |

## Traceability Guidance
- Tests should add `test.info().annotations.push({ type: 'req', description: '<REQ-ID>' })` to indicate coverage.
- Code references list primary files; use `git blame` and comments sparingly to keep traceability clear.
- When adding or changing requirements, update the tables above and link at least one test per requirement before marking it Verified.

## Recent Changes (evidence)
- CC-REQ-SEMICOL-002 implemented and verified: `src/layout/LayoutEngine.ts` now bases degradation on total events (including overflow) and promotes overflow into visible compact cards. Test v5/47 prevents regression.
