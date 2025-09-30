# Card Layout & Positioning Requirements

This fragment expands on Section 2 of the primary `SRS.md`. It captures detailed acceptance criteria, implementation references, and linked tests for the layout engine.

## Requirement Table

| ID | Requirement | Code | Tests |
|---|---|---|---|
| CC-REQ-LAYOUT-001 | Across zoom levels and view windows, visible cards never overlap for baseline datasets and while navigating | `src/layout/LayoutEngine.ts`, `src/layout/DeterministicLayoutComponent.tsx` | v5/03, v5/29 |
| CC-REQ-LAYOUT-SEMICOL-001 | Reduced margins and inter-card spacing with exactly one anchor per semi-column | `src/layout/LayoutEngine.ts` | v5/10, v5/33 |
| CC-REQ-LAYOUT-002 | Event cards are not positioned behind the navigation rail, maintaining adequate left margin | `src/layout/LayoutEngine.ts` | v5/14 |
| CC-REQ-LAYOUT-003 | Events alternate between upper and lower semi-columns for visual balance when possible | `src/layout/LayoutEngine.ts` | v5/12 |
| CC-REQ-LAYOUT-004 | Horizontal spacing between event clusters is configurable to optimize visual density while preventing overlap | `src/layout/LayoutEngine.ts` | v5/61-anchor-persistence |

## Notes & Change History

- 2025-09-29 — Initial extraction from `docs/SRS.md` to keep the core document concise while preserving traceability.
