# Zoom & Navigation Requirements

This fragment expands on Section 6 of the primary `SRS.md`. It captures detailed acceptance criteria, implementation references, and linked tests for the zoom and navigation system.

## Requirement Table

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-ZOOM-001 | Zoom filters visible events; cursor-anchored zoom keeps time under cursor stable; boundaries clamp | • Zooming in reduces the visible time range and filters events<br>• Zooming centers on the cursor position and keeps the time under cursor stable<br>• Zoom boundaries clamp to prevent zooming beyond min/max limits<br>• Fit All button resets view to show all events | `src/App.tsx`, `src/app/hooks/useViewWindow.ts` | v5/17, v5/20, v5/24 |
| CC-REQ-ZOOM-002 | Zoom operations maintain event positions relative to cursor and handle edge cases gracefully | • Events remain positioned correctly after zoom operations<br>• Extreme zoom levels (very zoomed in or out) maintain system stability<br>• Card count may reach 0 at extreme zoom when all cards are pushed outside view<br>• No visual artifacts or overlaps occur during zoom transitions | `src/app/hooks/useViewWindow.ts` | v5/18, v5/19, v5/23 |
| CC-REQ-ZOOM-003 | System supports maximum zoom down to minute-level precision with appropriate scaling | • Timeline supports zooming down to minute-level granularity<br>• Axis labels adapt appropriately at deep zoom (decades→years→months→days→hours)<br>• View window can be navigated across full timeline range at maximum zoom<br>• Content distribution remains functional during deep zoom navigation | `src/app/hooks/useViewWindow.ts` | v5/25, v5/29 |

## Implementation Details

### Zoom Behavior

The zoom system is implemented in `useViewWindow.ts` and provides:

1. **Cursor-Anchored Zooming**: Zoom operations maintain the timestamp under the cursor position
2. **Boundary Clamping**: View window is clamped to [0, 1] range to prevent invalid states
3. **Wheel-Based Input**: Mouse wheel events trigger zoom with configurable sensitivity
4. **Fit All**: Button that resets view window to [0, 1] to show entire timeline

### Edge Cases Handled

- **Extreme Zoom In**: At maximum zoom, visible cards may reach 0 if all events fall outside the narrow view window (expected behavior)
- **Extreme Zoom Out**: View window clamped to [0, 1] range prevents zooming beyond full timeline
- **Deep Zoom Navigation**: Sliding the view window at maximum zoom maintains content distribution and overflow indicators

### Navigation Features

- **Minimap Integration**: View window can be dragged via minimap for quick navigation (see `SRS_MINIMAP.md`)
- **Sliding Validation**: Tests validate content visibility and overflow indicators remain correct when sliding at various zoom levels
- **Responsive Overflow**: Overflow badges appear/disappear appropriately as zoom level changes

## Test Coverage

### Zoom Functionality Tests
- **v5/17-zoom-functionality.spec.ts**: Basic zoom in/out and Fit All button behavior
- **v5/20-timeline-cursor-zoom.spec.ts**: Cursor-anchored zoom keeps time under cursor stable

### Zoom Stability Tests
- **v5/18-zoom-stability.spec.ts**: Multiple zoom operations maintain system stability; extreme zoom handled gracefully
- **v5/19-zoom-edge-cases.spec.ts**: Edge cases like rapid zoom, extreme values, boundary conditions
- **v5/23-zoom-stability.spec.ts**: Additional stability validation across different datasets

### Zoom Boundaries Tests
- **v5/24-zoom-boundaries.spec.ts**: View window boundary clamping and minimap view window positioning
- **v5/25-max-zoom-sliding.spec.ts**: Navigation at maximum zoom maintains system stability

### Deep Zoom & Navigation Tests
- **v5/28-napoleon-sliding-validation.spec.ts**: Validates content distribution when sliding across timeline with Napoleon dataset
- **v5/29-deep-zoom-comprehensive-sliding.spec.ts**: Comprehensive validation of sliding at various zoom levels and positions

## Notes & Change History

- 2025-10-01 — Initial extraction from `docs/SRS.md` following the pattern established by SRS_FOUNDATION.md and SRS_LAYOUT.md. Added detailed acceptance criteria and implementation notes based on test suite validation work.
- 2025-10-01 — Documented edge case behavior: extreme zoom can result in 0 visible cards (expected behavior validated in v5/18).
