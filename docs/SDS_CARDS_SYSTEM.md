# Card System & Overflow Management - Design Specification

This document provides the technical design specification for the card system, degradation logic, and overflow management in PowerTimeline. It explains **how** the requirements in `SRS_CARDS_SYSTEM.md` are implemented.

## 1. Card Type Design

### 1.1 Physical Dimensions

All card types share a universal width for visual consistency:

| Card Type | Width | Height | Content |
|---|---|---|---|
| **Full** | 260px | 169px | Title (multi-line) + Full description + Date |
| **Compact** | 260px | 92px | Title (2 lines) + Partial description (1 line) + Date |
| **Title-only** | 260px | 32px | Title + Icon only (no date, no description) |

**Source**: `src/layout/config.ts` - `DEFAULT_CARD_CONFIGS`

### 1.2 Content Layout Rules

**Full Cards (169px height):**
- **Title**: Multi-line, no truncation, bold
- **Description**: Full text, no truncation, multiple paragraphs supported
- **Date**: Bottom-aligned, smaller font
- **Spacing**: 16px padding, 8px between elements

**Compact Cards (92px height):**
- **Title**: Max 2 lines, ellipsis truncation if needed
- **Description**: Single line, ellipsis truncation
- **Date**: Bottom-aligned
- **Spacing**: 12px padding, 6px between elements
- **Design note**: Height increased from 78px to 92px in v0.2.5.1 to prevent text cutoff

**Title-only Cards (32px height):**
- **Title**: Single line, ellipsis truncation
- **Icon**: Category icon displayed on the right
- **No date or description displayed**
- **Spacing**: 8px padding, horizontal layout
- **Use case**: High-density timelines with >4 events per half-column

### 1.3 Typography Specifications

```css
/* Full Cards */
.card-full .title { font-size: 16px; font-weight: 600; line-height: 1.4; }
.card-full .description { font-size: 14px; line-height: 1.5; }
.card-full .date { font-size: 12px; opacity: 0.7; }

/* Compact Cards */
.card-compact .title { font-size: 14px; font-weight: 600; line-height: 1.3; }
.card-compact .description { font-size: 12px; line-height: 1.4; }
.card-compact .date { font-size: 11px; opacity: 0.7; }

/* Title-only Cards */
.card-title-only .title { font-size: 13px; font-weight: 500; }
/* No date displayed in title-only cards */
```

### 1.4 Visual Hierarchy

Cards use color-coding and visual weight to convey information density:
- **Full cards**: Richer background, prominent shadows, high visual weight
- **Compact cards**: Medium background, moderate shadows, balanced visual weight
- **Title-only cards**: Minimal background, subtle shadows, low visual weight

This creates an intuitive visual signal: larger, more prominent cards = more space = fewer events.

## 2. Degradation Algorithm Design

### 2.1 Event Count Thresholds

The degradation system uses fixed event count thresholds per half-column:

```typescript
// From DegradationEngine.ts - determineCardType()

if (eventCount <= 2) {
  return 'full';      // Low density: 1-2 events
} else if (eventCount <= 4) {
  return 'compact';   // Medium density: 3-4 events
} else {
  return 'title-only'; // High density: 5+ events
}
```

**Rationale:**
- **2 events**: Matches full card slot capacity (2 slots per half-column)
- **4 events**: Matches compact card slot capacity (4 slots per half-column)
- **5+ events**: Requires title-only cards (9 slots per half-column)

### 2.2 Degradation Decision Tree

```
Event Count → Card Type Selection
│
├─ eventCount ≤ 2
│  └─ Use FULL cards
│     - 2 slots per half-column
│     - Full description visible
│     - Optimal readability
│
├─ eventCount = 3-4
│  └─ Use COMPACT cards
│     - 4 slots per half-column
│     - Partial description (1 line)
│     - Good readability, higher density
│
└─ eventCount ≥ 5
   └─ Use TITLE-ONLY cards
      - 9 slots per half-column
      - No description shown
      - Maximum density, scan-optimized
```

### 2.3 Space Reclamation Calculations

The degradation engine tracks vertical space saved by degradation:

```typescript
// Space saved by degrading from full to compact
const fullCardHeight = 169;    // Full card height
const compactCardHeight = 92;  // Compact card height
const spaceSavedPerCard = fullCardHeight - compactCardHeight; // 77px per card
const totalSpaceSaved = spaceSavedPerCard * eventCount;

// Space saved by degrading from compact to title-only
const titleOnlyHeight = 32;    // Title-only card height
const spaceSavedPerCard = compactCardHeight - titleOnlyHeight; // 60px per card
const totalSpaceSaved = spaceSavedPerCard * Math.min(eventCount, 4);
```

**Telemetry**: Space reclamation metrics tracked in `degradationMetrics.spaceReclaimed`

### 2.4 Degradation Metrics Interface

```typescript
interface DegradationMetrics {
  totalGroups: number;              // Total half-columns processed
  fullCardGroups: number;           // Groups using full cards
  compactCardGroups: number;        // Groups using compact cards
  titleOnlyCardGroups: number;      // Groups using title-only cards
  degradationRate: number;          // Percentage of groups degraded
  spaceReclaimed: number;           // Total vertical space saved (px)
  degradationTriggers: Array<{      // Individual degradation events
    groupId: string;
    eventCount: number;
    from: CardType;
    to: CardType;
    spaceSaved: number;
  }>;
}
```

**Source**: `src/layout/LayoutEngine.ts` - Exported interface

## 3. Slot Allocation System

### 3.1 Slots Per Half-Column

The slot system provides deterministic capacity guarantees:

| Card Type | Slots Per Half-Column | Calculation |
|---|---|---|
| **Full** | 2 | Base capacity |
| **Compact** | 4 | 2× full card slots |
| **Title-only** | 9 | High-density capacity |

**Implementation**: `src/layout/engine/DegradationEngine.ts` - `determineCardType()`

**Note**: When events exceed title-only capacity, overflow badges ("+N") are displayed instead of creating additional card types.

### 3.2 Slot Occupancy Tracking

The capacity model tracks slot usage separately for above/below sections:

```typescript
interface ColumnGroup {
  capacity: {
    above: { used: number; total: number };
    below: { used: number; total: number };
  };
}
```

**Key principles:**
- Each half-column has independent capacity
- Above and below sections don't share slots
- Slot exhaustion triggers degradation or overflow

### 3.3 Zero-Overlap Guarantee

The slot system prevents overlaps through deterministic allocation:

1. **Calculate required slots**: `eventCount × slotsPerEvent`
2. **Check available capacity**: `totalSlots - usedSlots ≥ requiredSlots`
3. **If insufficient slots**: Degrade to smaller card type
4. **If degradation insufficient**: Create overflow events

This ensures **mathematical guarantee** of zero overlaps.

## 4. Overflow System Design

### 4.1 Overflow Detection Logic

Overflow occurs when events exceed card type capacity:

```typescript
// From DegradationEngine.ts - createIndividualCards()

const maxCards = this.getMaxCardsPerHalfColumn(cardTypes[0]);
const allEvents = [
  ...group.events,
  ...(Array.isArray(group.overflowEvents) ? group.overflowEvents : [])
];

if (allEvents.length > maxCards) {
  // Split into visible events and overflow events
  const visibleEvents = allEvents.slice(0, maxCards);
  const remainder = allEvents.slice(maxCards);

  // Update group overflow
  group.overflowEvents = remainder.length > 0 ? remainder : undefined;
}
```

**Logic:**
1. Combine primary events + existing overflow events
2. Take first N events that fit in slots (N = maxCards)
3. Store remainder in `overflowEvents` array
4. Generate overflow badge showing remainder count

### 4.2 View Window Filtering

Overflow events are filtered by visible time window to prevent "leftover badges":

```typescript
// From PositioningEngine.ts - createEventAnchors()

const filterEventsByViewWindow = (events: Event[]) => {
  if (!visibleTimeWindow) return events;
  return events.filter(event => {
    const eventTime = getEventTimestamp(event);
    return eventTime >= visibleTimeWindow.visibleStartTime &&
           eventTime <= visibleTimeWindow.visibleEndTime;
  });
};

const relevantOverflowEvents = group.overflowEvents
  ? filterEventsByViewWindow(group.overflowEvents)
  : [];
```

**Result**: Only overflow events within current view window contribute to badge count

### 4.3 Overflow Badge Calculation

Badge count includes both primary and view-filtered overflow:

```typescript
const overflowCount = relevantOverflowEvents.length;

if (overflowCount > 0) {
  // Render badge with "+N" format
  return `+${overflowCount}`;
}
```

## 5. Overflow Badge Rendering

### 5.1 Badge Positioning Algorithm

Badges are positioned relative to anchor points:

```typescript
// From DeterministicLayoutComponent.tsx

const badgeX = anchor.x;  // Align with anchor X position
const badgeY = anchor.side === 'above'
  ? timelineY - 40  // Above timeline: 40px above axis
  : timelineY + 40; // Below timeline: 40px below axis
```

### 5.2 Minimum Spacing Enforcement

To prevent visual overlap, badges are checked for proximity:

```typescript
const MIN_BADGE_SPACING = 60; // Minimum pixels between badges

// Check if badges are too close
const distance = Math.abs(badge1.x - badge2.x);
if (distance < MIN_BADGE_SPACING) {
  // Trigger badge merging
}
```

### 5.3 Badge Merging Strategy

When badges are within minimum spacing, they are merged:

```typescript
// Merge nearby overflow badges to prevent overlaps
const mergedBadges = [];
const processed = new Set();

for (const anchor of anchors) {
  if (processed.has(anchor.id)) continue;

  // Find nearby anchors within merge threshold
  const nearby = anchors.filter(a =>
    !processed.has(a.id) &&
    Math.abs(a.x - anchor.x) < MIN_BADGE_SPACING
  );

  if (nearby.length > 1) {
    // Calculate centroid position
    const centroidX = nearby.reduce((sum, a) => sum + a.x, 0) / nearby.length;
    const totalOverflow = nearby.reduce((sum, a) => sum + a.overflowCount, 0);

    mergedBadges.push({
      x: centroidX,
      count: totalOverflow,
      componentIds: nearby.map(a => a.id)
    });

    nearby.forEach(a => processed.add(a.id));
  }
}
```

**Source**: `src/layout/DeterministicLayoutComponent.tsx` - Badge merging implementation

### 5.4 Centroid Calculation

Merged badge position uses weighted average:

```typescript
const centroidX = anchors.reduce((sum, anchor) => {
  return sum + (anchor.x * anchor.overflowCount);
}, 0) / totalOverflowCount;
```

This positions the merged badge at the visual "center of mass" of the component badges.

## 6. Implementation Architecture

### 6.1 Code Organization

**Card Configuration:**
- `src/layout/config.ts` - Card dimension constants and viewport-adaptive sizing

**Degradation Logic:**
- `src/layout/engine/DegradationEngine.ts` - Card type determination, degradation metrics
- Methods: `determineCardType()`, `getMaxCardsPerHalfColumn()`, `createIndividualCards()`

**Overflow Management:**
- `src/layout/engine/DispatchEngine.ts` - Overflow event assignment to groups
- `src/layout/engine/PositioningEngine.ts` - View window filtering for overflow
- `src/layout/DeterministicLayoutComponent.tsx` - Overflow badge rendering and merging

**Capacity Tracking:**
- `src/layout/CapacityModel.ts` - Slot occupancy tracking
- `src/layout/LayoutEngine.ts` - Capacity metrics aggregation

### 6.2 Data Structures

**ColumnGroup Interface:**
```typescript
interface ColumnGroup {
  id: string;
  events: Event[];              // Visible events (within slot capacity)
  overflowEvents?: Event[];     // Events exceeding capacity
  startX: number;
  endX: number;
  centerX: number;
  side: 'above' | 'below';
  anchor: Anchor;
  cards: PositionedCard[];
  capacity: {
    above: { used: number; total: number };
    below: { used: number; total: number };
  };
}
```

**Anchor Interface:**
```typescript
interface Anchor {
  id: string;
  x: number;
  date: Date;
  side: 'above' | 'below';
  overflowCount: number;        // Count of overflow events
  hasVisibleCards: boolean;     // Whether this anchor has visible cards
}
```

### 6.3 Algorithm Flow

```
Layout Engine Flow:
│
1. Dispatch Events to Half-Columns
│  └─ DispatchEngine.dispatchEvents()
│     - Sort events chronologically
│     - Assign to above/below alternating
│     - Create half-column groups
│
2. Apply Degradation Logic
│  └─ DegradationEngine.applyDegradationAndPromotion()
│     - Count events per group (primary + overflow)
│     - Determine card type based on count
│     - Create individual cards for visible events
│     - Store remainder in overflowEvents
│
3. Position Cards and Create Anchors
│  └─ PositioningEngine.positionCards() + createEventAnchors()
│     - Filter overflow by view window
│     - Calculate anchor positions
│     - Attach overflow counts to anchors
│
4. Render Cards and Badges
   └─ DeterministicLayoutComponent
      - Render positioned cards
      - Render individual overflow badges
      - Merge nearby badges
      - Render merged badges at centroids
```

## 7. Performance Considerations

### 7.1 Degradation Metrics Tracking

**Overhead**: Minimal - metrics updated once per layout pass
**Optimization**: Metrics calculated incrementally during degradation decisions

### 7.2 View Window Filtering

**Complexity**: O(n) where n = overflow events per group
**Optimization**: Filter applied only to groups with overflow events
**Caching**: View window parameters cached to avoid repeated calculations

### 7.3 Badge Merging Algorithm

**Complexity**: O(n²) worst case for proximity checks
**Optimization**: Early exit when badge count is low (<10)
**Practical Performance**: Negligible impact - typical timelines have <20 overflow badges

### 7.4 Memory Management

**Overflow Events**: Stored as references, not copies
**Card Objects**: Created only for visible events
**Metrics Objects**: Single object per layout pass, garbage collected after render

## 8. Design Rationale

### 8.1 Why Fixed Thresholds?

**Decision**: Use fixed event count thresholds (2, 4, 9) instead of dynamic calculation

**Rationale:**
- **Predictability**: Users can learn the system behavior
- **Consistency**: Same event count always produces same card type
- **Simplicity**: No complex heuristics or edge cases
- **Testability**: Easy to validate with deterministic tests

### 8.2 Why Independent Above/Below Sections?

**Decision**: Allow different card types above vs below timeline

**Rationale:**
- **Flexibility**: Dense cluster above doesn't force degradation below
- **Space Optimization**: Each section uses space optimally
- **Visual Balance**: Prevents forced symmetry that wastes space

### 8.3 Why Badge Merging?

**Decision**: Merge nearby overflow badges into single indicator

**Rationale:**
- **Visual Clarity**: Prevents badge clutter in dense timelines
- **Readability**: Single "+15" easier to parse than three "+5" badges
- **Scalability**: System remains usable even with many overflow events

### 8.4 Why View Window Filtering?

**Decision**: Filter overflow events by visible time range

**Rationale:**
- **Correctness**: Prevents "leftover" badges when panning to empty regions
- **User Expectations**: Badge count should reflect what's hidden "here and now"
- **Performance**: Reduces unnecessary overflow calculations for off-screen events

## 9. Future Enhancements

### Potential Improvements

1. **Adaptive Thresholds**: Adjust degradation thresholds based on viewport size
2. **Progressive Degradation**: Smooth transitions between card types during zoom
3. **User Preferences**: Allow users to override default degradation behavior
4. **Smart Badge Placement**: Position badges to avoid overlapping with cards
5. **Overflow Preview**: Show overflow event titles on badge hover

### Extension Points

- `DegradationEngine.determineCardType()`: Add custom degradation strategies
- `Badge merging threshold`: Make configurable via layout config
- `Card dimensions`: Support custom card sizes per timeline

## Notes & Change History

- 2025-10-01 — Initial design specification document created
- 2025-10-01 — Extracted design details from ARCHITECTURE.md and codebase
- 2025-10-01 — Documented current implementation: Compact cards 92px (not 78px)
- 2025-10-01 — Added overflow badge merging strategy documentation
- 2025-10-01 — Added view window filtering design rationale
