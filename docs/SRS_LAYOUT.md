# Card Layout & Positioning Requirements

**Last Updated:** 2025-12-27

This fragment expands on Section 2 of the primary `SRS.md`. It captures detailed acceptance criteria, implementation references, and linked tests for the layout engine.

## Requirement Table

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-LAYOUT-001 | Across zoom levels and view windows, visible cards never overlap for baseline datasets and while navigating | No card overlaps detected at any zoom level; navigation maintains spacing; baseline datasets render cleanly | `src/layout/LayoutEngine.ts`, `src/layout/DeterministicLayoutComponent.tsx` | v5/03, v5/29 |
| CC-REQ-LAYOUT-SEMICOL-001 | Reduced margins and inter-card spacing with exactly one anchor per semi-column | Margins minimized; one anchor dot per semi-column; spacing optimized | `src/layout/LayoutEngine.ts` | v5/10, v5/33 |
| CC-REQ-LAYOUT-002 | Event cards are not positioned behind the navigation rail, maintaining adequate left margin | No cards obscured by nav rail; left margin prevents overlap | `src/layout/LayoutEngine.ts` | v5/14 |
| CC-REQ-LAYOUT-003 | Events alternate between upper and lower semi-columns for visual balance when possible | Cards alternate above/below axis; visual balance maintained | `src/layout/LayoutEngine.ts` | v5/12 |
| CC-REQ-LAYOUT-004 | Horizontal spacing between event clusters is configurable to optimize visual density while preventing overlap | Spacing configurable; no overlaps occur; density optimized | `src/layout/LayoutEngine.ts` | v5/61-anchor-persistence |

## Notes & Change History

- 2025-12-27 — Added Acceptance Criteria column for format standardization.
- 2025-09-29 — Initial extraction from `docs/SRS.md` to keep the core document concise while preserving traceability.
