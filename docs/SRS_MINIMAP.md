# Timeline Minimap Requirements

This document expands on minimap requirements from `SRS.md` sections 7 and 17. It provides detailed acceptance criteria and implementation references for the timeline minimap component.

## Requirement Table

### Display & Visual Design

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-MINIMAP-DISPLAY-001 | Minimap bar displays timeline range with start/end year labels | • Start year displayed on left side of minimap bar<br>• End year displayed on right side of minimap bar<br>• Years calculated from earliest and latest event dates<br>• Graceful handling when timeline range is same year | `src/components/TimelineMinimap.tsx` (lines 152-262) | v5/21, v5/22 |
| CC-REQ-MINIMAP-DISPLAY-002 | Event markers show position of all events along timeline bar | • Each event rendered as vertical marker on minimap bar<br>• Marker position calculated proportionally from event date<br>• Markers positioned at 0.0 (start) to 1.0 (end) range<br>• Markers clamped to [0, 1] range to prevent overflow | `src/components/TimelineMinimap.tsx` (lines 45-59, 199-232) | v5/21, v5/22 |
| CC-REQ-MINIMAP-DISPLAY-003 | Density heatmap gradient indicates event concentration across timeline | • Background gradient generated from event density buckets (20 buckets)<br>• Gradient intensity proportional to event count in each bucket<br>• Opacity range: 0.1 (sparse) to 0.6 (dense)<br>• Blue color scheme (rgba(33, 150, 243, opacity)) | `src/components/TimelineMinimap.tsx` (lines 131-150, 191-197) | v5/21 |
| CC-REQ-MINIMAP-DISPLAY-004 | Event count badge displays total number of events | • Badge shows "{N} events" format<br>• Badge positioned to right of timeline bar<br>• Badge styled with primary color background<br>• Badge updates reactively when event list changes | `src/components/TimelineMinimap.tsx` (lines 263-270) | v5/21, v5/22 |
| CC-REQ-MINIMAP-DISPLAY-005 | Empty state displayed when no events exist | • "No events to display" message shown instead of minimap bar<br>• Empty state has proper styling and accessibility<br>• Component gracefully handles zero-length event array | `src/components/TimelineMinimap.tsx` (lines 158-166) | - |

### Navigation & Interaction

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-MINIMAP-NAV-001 | Click navigation centers view window on clicked position | • Click on minimap bar calculates click position ratio (0-1)<br>• View window centered on clicked position<br>• Current view window width preserved after click<br>• Boundary clamping: if centering would exceed [0,1], adjust to keep window in bounds | `src/components/TimelineMinimap.tsx` (lines 97-113) | v5/21, v5/22 |
| CC-REQ-MINIMAP-NAV-002 | Drag view window to slide timeline with smooth tracking | • Mouse down on view window initiates drag mode<br>• Mouse move updates view window position proportionally to drag distance<br>• Boundary clamping prevents view window from exceeding [0, 1] range<br>• Cursor changes to 'grabbing' during drag<br>• Mouse up ends drag mode | `src/components/TimelineMinimap.tsx` (lines 62-94, 115-128) | v5/26, v5/27 |
| CC-REQ-MINIMAP-NAV-003 | View window indicator shows current zoom level and visible range | • View window rendered as semi-transparent overlay on minimap bar<br>• Window position: left = viewStart * 100%, width = (viewEnd - viewStart) * 100%<br>• Window reflects zoom level visually (narrow window = zoomed in, wide window = zoomed out)<br>• Border and shadow distinguish window from background | `src/components/TimelineMinimap.tsx` (lines 234-257) | v5/24, v5/27 |

### Event Highlighting & Feedback

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-MINIMAP-HIGHLIGHT-001 | Selected event highlighted in minimap with distinct visual treatment | • Selected event marker: amber color (bg-amber-400)<br>• Selected marker larger than normal markers (w-1.5 h-3 vs w-0.5 h-2)<br>• Selected marker has white border and shadow for prominence<br>• Selected marker z-index=4 (highest layer) | `src/components/TimelineMinimap.tsx` (lines 200, 208-210, 217-218, 227) | v5/63 (partially implemented) |
| CC-REQ-MINIMAP-HIGHLIGHT-002 | Hovered event highlighted in minimap with secondary visual treatment | • Hovered event marker: sky blue color (bg-sky-400)<br>• Hovered marker medium size (w-1.5 h-2.5)<br>• Hovered marker has white border and shadow<br>• Hovered marker z-index=3 (below selected, above normal)<br>• Hover state does not apply if event is already selected | `src/components/TimelineMinimap.tsx` (lines 201, 210-211, 219-220, 227) | - |
| CC-REQ-MINIMAP-HOVER-001 | Minimap provides visual feedback on hover | • Minimap bar background changes on hover (bg-neutral-200 → bg-neutral-300)<br>• Shadow increases on hover (shadow-sm → shadow-md)<br>• Event markers scale up slightly on minimap hover (scaleY(1.2))<br>• Transitions smooth with duration-200/300 ease-out | `src/components/TimelineMinimap.tsx` (lines 172-174, 185, 202-203) | - |

### Overlay Integration

| ID | Requirement | Acceptance Criteria | Code | Tests |
|---|---|---|---|---|
| CC-REQ-MINIMAP-OVERLAY-001 | Minimap remains visible and interactive when authoring overlay is open | • Minimap has z-index higher than overlay backdrop<br>• Minimap opacity remains at 100% when overlay open<br>• Minimap remains interactive (click/drag still functional)<br>• Event highlighting continues to work during overlay mode | Implementation pending | v5/63 (skipped - not yet implemented) |

## Implementation Notes

### Coordinate System

The minimap uses normalized coordinates [0, 1]:
- **0.0** = Timeline start (earliest event date)
- **1.0** = Timeline end (latest event date)
- **Event position** = `(eventTime - startTime) / totalDuration`
- **View window** = `[viewStart, viewEnd]` both in [0, 1] range

This matches the coordinate system used by the main timeline zoom/navigation system.

### Event Marker Rendering

Three visual states for event markers:

1. **Normal** (default):
   - Size: w-0.5 h-2
   - Color: bg-primary-500
   - Opacity: 0.6 (hover: 1.0)
   - Transform: translateX(-50%)

2. **Hovered** (hoveredEventId matches):
   - Size: w-1.5 h-2.5
   - Color: bg-sky-400 (sky blue)
   - Opacity: 1.0
   - Transform: translate(-50%, -50%) with vertical centering
   - Border: 1px white
   - Shadow: medium shadow with blue glow

3. **Selected** (highlightedEventId matches):
   - Size: w-1.5 h-3
   - Color: bg-amber-400 (amber/orange)
   - Opacity: 1.0
   - Transform: translate(-50%, -50%) with vertical centering
   - Border: 1px white
   - Shadow: large shadow with amber glow
   - Z-index: 4 (highest priority)

**Priority**: Selected > Hovered > Normal

### Drag Interaction Flow

1. **Mouse down on view window**:
   - Set `isDragging = true`
   - Record `dragStartX` (client X coordinate)
   - Record `dragStartViewStart` (current viewStart value)

2. **Mouse move** (while dragging):
   - Calculate `deltaX = currentX - dragStartX`
   - Convert to ratio: `deltaRatio = deltaX / minimapWidth`
   - Calculate new position: `newStart = dragStartViewStart + deltaRatio`
   - Preserve window width: `newEnd = newStart + (viewEnd - viewStart)`
   - Clamp boundaries: ensure [newStart, newEnd] within [0, 1]

3. **Mouse up**:
   - Set `isDragging = false`
   - Restore default cursor

### Density Heatmap Algorithm

```typescript
1. Create 20 buckets across timeline range
2. For each event:
   - Calculate bucket index: floor(eventPosition * 19)
   - Increment bucket[index]
3. Find maxDensity = max(buckets)
4. For each bucket:
   - Calculate intensity: bucketDensity / maxDensity
   - Calculate opacity: max(0.1, intensity * 0.6)
   - Create gradient stop at bucket position
5. Combine into linear-gradient(90deg, stops...)
```

This provides visual feedback about where events cluster on the timeline.

## Test Coverage

### Minimap Display Tests
- **v5/21-timeline-minimap.spec.ts**: Core minimap display, event markers, density visualization
- **v5/22-minimap-basic.spec.ts**: Basic minimap functionality and rendering

### Minimap Navigation Tests
- **v5/26-minimap-drag.spec.ts**: View window dragging interaction
- **v5/27-minimap-timeline-sync.spec.ts**: Sync between minimap and main timeline view

### Minimap Zoom Integration Tests
- **v5/24-zoom-boundaries.spec.ts**: View window position at zoom boundaries
- **v5/28-napoleon-sliding-validation.spec.ts**: Minimap behavior during timeline navigation
- **v5/29-deep-zoom-comprehensive-sliding.spec.ts**: Minimap accuracy at deep zoom levels

### Minimap Overlay Integration Tests
- **v5/63-minimap-overlay-visibility.spec.ts**: Minimap visibility during authoring overlay (3 tests, all SKIPPED - feature not implemented)

## Known Limitations & Future Work

### Not Yet Implemented

1. **CC-REQ-MINIMAP-OVERLAY-001** (v5/63 skipped tests):
   - Minimap z-index layering over authoring overlay backdrop
   - Event highlighting persistence during overlay mode
   - Interactive minimap while overlay is open

2. **Visual Regression Tests**:
   - No screenshot tests for minimap rendering
   - No visual validation of density heatmap accuracy
   - No hover state screenshot validation

### Potential Improvements

1. **Performance**:
   - Density heatmap recalculated on every render
   - Could memoize bucket calculation for large event sets

2. **Accessibility**:
   - Event markers could have better keyboard navigation
   - ARIA labels for screen readers
   - Keyboard shortcuts for minimap navigation

3. **Visual Enhancements**:
   - Logarithmic density scale for better contrast
   - Configurable color schemes
   - Tooltip on marker hover showing event details

## Dependencies

- **Main Timeline**: Receives `viewStart` and `viewEnd` from timeline zoom state
- **Event Data**: Requires `events[]` array with `date` field
- **Navigation Callback**: `onNavigate(start, end)` updates main timeline view window
- **Event Selection**: `highlightedEventId` and `hoveredEventId` for visual feedback

## Notes & Change History

- 2025-10-01 — Initial extraction from SRS.md sections 7 and 17
- 2025-10-01 — Split single ENHANCED-001 requirement into 10 granular requirements
- 2025-10-01 — Added detailed acceptance criteria based on TimelineMinimap.tsx implementation
- 2025-10-01 — Documented coordinate system, event marker states, drag interaction flow
- 2025-10-01 — Identified CC-REQ-MINIMAP-OVERLAY-001 as not implemented (v5/63 tests skipped)
- 2025-10-01 — Added density heatmap algorithm documentation
