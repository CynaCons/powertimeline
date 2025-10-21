# PowerTimeline Architecture (Half-Column System v5)

## Overview

PowerTimeline renders a horizontal timeline with event cards positioned in independent half-column systems above and below the timeline. The system uses alternating placement (Event 1 above, Event 2 below) with spatial-based clustering and 2-slot half-columns to ensure optimal distribution and zero overlaps.

## Where to find what

- Architecture and planning
 - `ARCHITECTURE.md` Deterministic slot-based layout, degradation math, left-to-right clustering.
 - `PLAN.md` Phases, checklists, current work items and docs follow-ups.
 - `PRD.md` Product goals, user stories, success metrics.
 - `COMPLETED.md` Iteration history, decisions, and regressions fixed.

- Core layout engine (deterministic + mathematical)
 - `src/layout/clustering.ts` Left-to-right event clustering algorithm.
 - `src/layout/SlotGrid.ts` Deterministic slot allocation and occupancy tracking.
 - `src/layout/LayoutEngine.ts` Deterministic layout engine (degradation + orchestration + telemetry).
 - `src/layout/DeterministicLayoutComponent.tsx` React renderer consuming the engine output.
 - `src/layout/DegradationEngine.ts` (legacy/disabled) prior math prototype.
 - `src/layout/config.ts` / `src/layout/types.ts` Card sizes/configs and types.

- Timeline UI and visuals
 - `src/components/Timeline.tsx` Timeline composition and configs.
 - `src/timeline/Axis.tsx`, `RangeBar.tsx`, `SvgDefs.tsx` Axis, range, defs.
 - `src/styles/tokens.css` Theme tokens (colors, strokes, etc.).

- Overlays and panels
 - `src/app/OverlayShell.tsx` Overlay container and focus handling.
 - `src/app/panels/*` Editor/Outline/Dev panels (MUI-based).

- Utilities and libs
 - `src/lib/time.ts`, `text.ts`, `storage.ts` Time mapping, measurements, persistence.
 - `src/lib/devSeed.ts` Seeding helpers and test datasets.

- Tests
 - `tests/*.spec.ts` Playwright suite (layout, axis, a11y, density, performance).

## Core Principles

1. **Independent half-column systems**: Above and below timeline sections operate independently with no cross-communication *
2. **Alternating placement**: Events placed chronologically alternating above/below (Event 1 above, Event 2 below, Event 3 above, ...)
3. **Spatial-based clustering**: Half-columns created based on horizontal overlap detection only (no artificial event count limits)
4. **2-slot half-columns**: Each half-column contains exactly 2 slots for full cards
5. **Temporal anchor centering**: Timeline anchors positioned at center of half-column events

*_Note: Half-columns are independent EXCEPT when they form a spatial cluster requiring coordination for overflow management. See "Terminology & Key Concepts" below._

## Terminology & Key Concepts

**CRITICAL**: This section defines three distinct concepts that are often confused. Clear understanding is essential for implementing mixed card types and cluster-level coordination.

### 1. Spatial Cluster (User-Visible Grouping)

**Definition**: A visually perceivable region on the timeline containing related events from both above AND below the timeline.

**Boundary Determination**:
- Defined by horizontal overlap of event date ranges across above+below
- If events in above half-column and below half-column occupy the same X-region, they form ONE spatial cluster
- Multiple spatial clusters can exist along the timeline

**Purpose**:
- Represents what users see as "one area" or "one event group" on the timeline
- Critical for visual consistency - users expect cards in the same X-region to behave similarly
- Coordination unit for overflow management (if top overflows, bottom should match)

**Example**:
```
Timeline View:
   [Card A1] [Card A2]    [Card B1]
         |      |             |
    ════════════════════════════════  (Timeline Axis)
         |      |             |
   [Card C1] [Card C2]    [Card D1]

Spatial Clusters:
- Cluster 1: X-region containing A1, A2 (above) + C1, C2 (below)
- Cluster 2: X-region containing B1 (above) + D1 (below)
```

**Key Insight**: A spatial cluster spans BOTH sides of the timeline. It's not just an above group or below group - it's the combination.

---

### 2. Half-Column (Implementation Structure)

**Definition**: A storage and layout structure for events on ONE side of the timeline (either above OR below, never both).

**Boundary Determination**:
- Starts at leftmost event assigned to that side (above/below)
- Extends to rightmost event in that side
- Determined by spatial overlap detection within events of the same side

**Purpose**:
- Independent slot allocation for vertical space management
- Card positioning and rendering unit
- Capacity tracking (slots used/available)

**Properties**:
- **Side**: 'above' OR 'below' (never both)
- **Capacity**: 2 slots for full cards (independently tracked)
- **Cards**: Array of positioned cards for this half-column
- **Overflow**: Events that don't fit in available slots

**Example**:
```
Above Half-Columns (independent):
   HC-A1         HC-A2       HC-A3
  [E1, E3]      [E5]       [E7, E9]

════════════════════════════════════════ (Timeline)

Below Half-Columns (independent):
   HC-B1         HC-B2       HC-B3
  [E2, E4]      [E6]       [E8, E10]
```

**Key Insight**: Half-columns are the IMPLEMENTATION structure. Users don't see "half-columns" - they see spatial clusters.

---

### 3. Column Group (Code Data Structure)

**Definition**: TypeScript interface in LayoutEngine representing a half-column in code.

**Interface**:
```typescript
interface ColumnGroup {
  id: string;
  events: Event[];              // Visible events (within capacity)
  overflowEvents?: Event[];     // Events exceeding capacity
  startX: number;
  endX: number;
  centerX: number;
  side: 'above' | 'below';      // Which half-column system
  anchor: Anchor;
  cards: PositionedCard[];
  capacity: {
    above: { used: number; total: number };
    below: { used: number; total: number };
  };
}
```

**Purpose**:
- Data structure passed between layout engine modules
- Maps 1:1 with half-columns
- Contains all information needed for rendering one half-column

**Key Insight**: ColumnGroup is just the code representation of a half-column. In the codebase, "group" = "half-column".

---

### Terminology Mapping

| User Sees | Implementation | Code Structure |
|---|---|---|
| **Spatial Cluster** (X-region with events above+below) | 1 Above Half-Column + 1 Below Half-Column | 2 ColumnGroup objects (side='above', side='below') |
| Events "grouped together" | Events assigned to spatially overlapping half-columns | events[] arrays in matching ColumnGroups |
| Overflow badge in a region | Overflow from either/both half-columns | overflowEvents[] in one or both ColumnGroups |

---

### When Terminology Matters

**For Uniform Degradation (Current System)**:
- Each **half-column** (ColumnGroup) independently determines card type
- No coordination between above/below
- Result: Bottom can show full cards while top shows compact (different half-columns)

**For Mixed Card Types (Future Enhancement)**:
- Each **spatial cluster** must coordinate degradation across above+below half-columns
- If ANY half-column in a spatial cluster has overflow → ALL degrade uniformly
- If NO overflow in spatial cluster → Each half-column can optimize independently

**Critical Rule**:
> **Overflow coordination happens at the SPATIAL CLUSTER level, not the half-column level.**

---

## Card Types & Slot Allocation

### 1. Full Cards
- **Content**: Title + full description + date
- **Slots**: 2 above + 2 below = **4 total slots**
- **Use**: Default for sparse datasets

### 2. Compact Cards 
- **Content**: Title + partial description + date
- **Slots**: 4 above + 4 below = **8 total slots**
- **Size**: Roughly half the vertical size of full cards
- **Use**: First degradation level
- **Conversion**: 1 Full 2 Compact cards

### 3. Title-Only Cards
- **Content**: Title + date only
- **Slots**: 4 above + 4 below = **8 total slots**
- **Size**: Vertically smaller than compact cards
- **Use**: Second degradation level
- **Conversion**: 1 Full 4 Title-only cards



### Step 1: Chronological Processing
```
Events: [E1: Jan 1] [E2: Jan 5] [E3: Jan 15] [E4: Jan 17] [E5: Feb 1]
Process order: E1 E2 E3 E4 E5
```

### Step 2: Column Creation & Grouping
```
1. Start with E1 (Jan 1)
 - Create Column A with 4 slots (2 above, 2 below)
 - Check horizontal space coverage

2. Process E2 (Jan 5)
 - Does E2 fall within Column A's horizontal space? 
 - If YES: Add E2 to Column A's event group
 - If NO: Create new Column B

3. Continue for all events
 - Each column groups events within its horizontal footprint
 - Anchors positioned at center of grouped events
```

### Step 3: Anchor Positioning
```
Column A events: [E1: Jan 1, E2: Jan 5, E3: Jan 15]
Anchor position: Center of time span = Jan 8 (midpoint)

Timeline:
 Jan 1 Jan 8 Jan 15 Feb 1
 
 E1,E2,E3 E4 E5
 Anchor A
```

## Deterministic Degradation Mathematics

### Slot Capacity Guidelines

```
Full cards: 4 slots -> dense narrative, up to two events per half-column
Compact cards: 4 slots -> trimmed copy, up to four events per half-column
Title-only cards: 8 slots -> headlines only, up to eight events per half-column
```

### Degradation Decision Tree

```
For N events in a half-column:

IF N <= 2: keep full cards
IF N <= 4: switch to compact cards
IF N > 4: degrade to title-only cards
```

The engine promotes or demotes card types deterministically so every layout pass produces the same result for matching input.

## Layout Positioning System

### Half-Column Structure
```
 Above Half-Columns (Independent):
 
 Slot 1 (E1) Slot 1 (E3) Slot 1 (E5) 
 
 Slot 2 Slot 2 Slot 2 
 
 Timeline
 
 Slot 1 (E2) Slot 1 (E4) Slot 1 
 
 Slot 2 Slot 2 Slot 2 
 
 Below Half-Columns (Independent):

 Half-Column A1 Half-Column A2 Half-Column A3
 (Above) (Above) (Above)
 
 Half-Column B1 Half-Column B2 Half-Column B3 
 (Below) (Below) (Below)
```

**Key Changes from Full Columns:**
- Above and below sections are completely independent
- Each half-column has only 2 slots (not 4)
- Events alternate between above/below chronologically
- No cross-communication between above/below systems

### Half-Column Alternating Algorithm

**User-Specified Algorithm:**
1. **Chronological Processing**: Sort all events by date (oldest to newest)
2. **Alternating Placement**: Process events in order, alternating placement:
 - Event 1 Above timeline (Above Half-Column System) 
 - Event 2 Below timeline (Below Half-Column System)
 - Event 3 Above timeline (Above Half-Column System)
 - Event 4 Below timeline (Below Half-Column System)
 - Continue pattern...

3. **Independent Half-Column Creation**: Within each system (above/below):
 - Start with leftmost event in that system
 - Create first half-column with 2 slots
 - For next event in same system:
 - Check if event falls within horizontal space of existing half-columns
 - If YES: Add to existing half-column (if slots available)
 - If NO: Create new half-column
 - Half-columns are created based on **spatial overlap only** (no artificial event count limits)

4. **Temporal Anchor Positioning**: Each half-column's anchor positioned at center of its events' date range

### Example: 6 Events Processing
```
Input Events (chronological): E1(Jan 1), E2(Jan 3), E3(Jan 10), E4(Jan 12), E5(Jan 20), E6(Jan 25)

Step 1: Alternating Placement
- E1(Jan 1) Above System
- E2(Jan 3) Below System 
- E3(Jan 10) Above System
- E4(Jan 12) Below System
- E5(Jan 20) Above System
- E6(Jan 25) Below System

Step 2: Above System Half-Column Creation
- E1(Jan 1): Create Above Half-Column A1
- E3(Jan 10): Check horizontal overlap with A1
 - If overlaps: Add to A1 (slots: E1, E3)
 - If no overlap: Create Above Half-Column A2
- E5(Jan 20): Check overlap with existing above half-columns...

Step 3: Below System Half-Column Creation (Independent)
- E2(Jan 3): Create Below Half-Column B1
- E4(Jan 12): Check horizontal overlap with B1
 - If overlaps: Add to B1 (slots: E2, E4) 
 - If no overlap: Create Below Half-Column B2
- E6(Jan 25): Check overlap with existing below half-columns...
```

### Horizontal Spacing Calculation
```
Half-Column width = max(card_width, min_half_column_width)
Half-Column spacing = half_column_width + horizontal_gap
Anchor position = half_column_temporal_center

For Above Half-Column A1 with events [E1, E3]:
Anchor X = (E1.date + E3.date) / 2 (temporal center)
```

## Key Guarantees

### 1. Zero Overlaps
- **Vertical**: Each half-column slot can only hold one card, tracked by occupancy per side
- **Horizontal**: Half-columns are spaced by `half_column_width + gap`
- **Independence**: Above and below systems cannot interfere with each other

### 2. Alternating Distribution
- **Chronological**: Events processed in date order for deterministic placement
- **Balanced**: Even events go below, odd events go above timeline
- **Predictable**: Pattern ensures roughly equal above/below distribution

### 3. Spatial Clustering
- **Horizontal Overlap**: Half-columns created only when events spatially overlap horizontally
- **No Artificial Limits**: Removed TARGET_EVENTS_PER_CLUSTER constraints
- **Organic Growth**: Half-columns grow based on timeline space, not event counts
- **Independent Per Side**: Above and below clustering operates completely separately

### 4. Optimal Space Usage 
- **2-slot half-columns**: Each half-column accommodates exactly 2 full cards
- **Temporal distribution**: Events spread across full timeline width (>50% coverage expected)
- **Balanced utilization**: Independent above/below systems optimize space separately

## Phase 0: Core Implementation (COMPLETED - 2025-08-19)

### 0.1 Terminology & Capacity Model 
- **Cell**: Base grid unit for capacity accounting (smallest unit of space)
- **Footprint**: Number of cells consumed by a placed card
- **Placements**: Available candidate positions per column group 
- **Utilization**: Percentage of total cells that are occupied
- **Capacity Formula**: totalCells = placementsPerSide 2 (above + below)

### 0.2 Distribution & Column Grouping (Dispatch) 
- Density-adaptive dispatch with target 4 6 events per cluster
- Proximity merge rule: merge groups when inter-group gap < 80px
- Temporal positioning using actual event dates for horizontal spread
- Telemetry: groupCount, groupPitchPx, avgEventsPerCluster, largestCluster

### 0.3 Fit Algorithm Contract 
- Deterministic assignment using ordered placements
- Zero-overlap guarantee via capacity allocation tracking
- Stable sorting with deterministic tie-breakers (ID, title)
- Priority scoring for consistent placement decisions

### 0.4 Degradation AND Promotion
- **Card Cascade**: Full(4) → Compact(2) → Title-only(1) cells
- **Conversion Mathematics**: 1 Full = 2 Compact = 4 Title-only cards
- Promotion pass when utilization < 40% (configurable threshold)
- Telemetry: degradedCountByType, promotedCountByType
- **Overflow handling**: When events exceed capacity, "+N" overflow badges are displayed

### 0.5 Stability & Churn Minimization 
- Stable sorting with deterministic tie-breakers (date ID title)
- Priority scoring based on event characteristics (duration, recency)
- Minimal boundary shifts (50px threshold for group repositioning)
- Local re-fit strategy to prevent cross-group migrations

### 0.6 Telemetry & Tests
- Complete JSON telemetry: dispatch, capacity, degradation metrics
- Full v5 test suite (01-09) with telemetry assertions
- Stable selectors: data-testid="event-card" with data-event-id, data-card-type
- Screenshot-based visual regression testing

### 0.7 Overlay/UX Updates
- Split capacity panels: Footprint (cells) vs Placements (candidates)
- Real-time counters for promotions and degradations applied
- Group pitch metrics (target vs actual events/cluster)
- Utilization percentage display with thresholds

## Implementation Phases (Previous Architecture)

### Phase 1: Left-to-Right Clustering 
- [x] Chronological event processing
- [x] Horizontal overlap detection 
- [x] Column group formation
- [x] Anchor centering mathematics

### Phase 2: Deterministic Slot Allocation 
- [x] Fixed slot counts per card type (4/2/1/4 cells)
- [x] Slot occupancy tracking
- [x] Zero-overlap guarantees

### Phase 3: Mathematical Degradation 
- [x] 1 2 4 5 conversion mathematics
- [x] Optimal slot usage algorithm
- [x] Full, compact, and title-only card implementation

### Phase 4: Testing & Validation 
- [x] Slot occupancy verification
- [x] Overlap detection tests 
- [x] Mathematical correctness tests
- [x] Visual regression screenshots

## The Desired Algorithm (User's Specification)

### Core Concept Quote
**"Full cards should have 2 slots above and below. Compact cards should have 4 slots. Only-Title should have 8 event slots above and below. Multi-Event should have 10 slots above and below."**

**"A full card can be split into compact or title-only presentations to absorb more density."**

### Left-to-Right Clustering Strategy (User's Description)

#### The Sequential Processing Approach
**"So starting from the left, we go from left to right and group them."**

```
Process Flow:
1. Start from the leftmost event chronologically
2. Create first column group
3. Process next event in chronological order
4. Check if it falls within horizontal space of existing columns
5. If YES: add to existing column
6. If NO: create new column
7. Repeat until all events processed
```

#### Column Creation Logic (User's Specification)
**"So starting from the left, we find the first event. We make our single column above and below. We check, if there would be other events under the horizontal space used by the column of the first event. If yes, then we group them, and repeat."**

```
Detailed Algorithm:
1. Take first event E1 Create Column A
 - Column A occupies horizontal space [X1, X1 + column_width]
 - Column A has slots above and below timeline

2. Take next event E2
 - Check: Does E2.x fall within [X1, X1 + column_width]?
 - If YES: Add E2 to Column A's event group
 - If NO: Create Column B starting at E2.x

3. Continue for remaining events
 - For each event, check ALL existing columns
 - Add to first column where event falls within horizontal space
 - If no match, create new column
```

#### Anchor Centering Requirement (User's Specification)
**"The only thing to take in consideration, is that time anchors should be centered below the columns."**

```
Anchor Positioning Logic:
- For each column group with events [E1, E2, ..., En]
- Calculate temporal center: (min_date + max_date) / 2
- Position anchor at this temporal center on timeline
- Anchor serves as visual connection point for the column
```

### Deterministic Slot System (User's Design)

#### Slot Allocation Rules
```
Full Cards: 2 above + 2 below = 4 total slots
Compact Cards: 4 above + 4 below = 8 total slots (half height of full cards)
Title-Only: 4 above + 4 below = 8 total slots (smaller than compact)
```

#### Mathematical Degradation
**Title-only cards are the densest representation; overflow badges display remaining events.**

```
Degradation Cascade:
1 Full Card = 2 Compact Cards = 4 Title-Only Cards

This means:
- When 1 Full card can't fit → create 2 Compact cards
- When 2 Compact cards can't fit → create 4 Title-only cards
- When events exceed title-only capacity → display "+N" overflow badges
```

### Zero Overlaps Guarantee (User's Logic)

#### Slot Occupancy Tracking (User's Specification)
**"This should also ensure that there are no overlaps, since there is a predefined number of slots and we can say whether they are occupied or not, and if yes by what type of cards and how many."**

```
Occupancy System:
1. Each slot has state: [OCCUPIED] or [FREE]
2. When placing card, mark required slots as [OCCUPIED]
3. Before placing card, check if slots are [FREE]
4. If slots not available, trigger degradation
5. Track what type of card occupies each slot
```

#### Deterministic Behavior (User's Goal)
**"This should simplify the logic and ensure that we are actually breaking down the big cards into smaller cards."**

```
Simplification Benefits:
1. Predictable slot usage
2. Clear degradation rules
3. No complex collision detection
4. Visual slot utilization feedback
5. Guaranteed zero overlaps
```

### Expected Column Structure (Based on User Description)

#### Single Column Layout
```
Column A (4 events example):
 
 Event 1 Slot 1 above
 
 Event 2 Slot 2 above 
 
 Timeline + Centered Anchor
 Event 3 Slot 1 below
 
 Event 4 Slot 2 below
 

Anchor positioned at temporal center of [Event1, Event2, Event3, Event4]
```

#### Multi-Column Layout
```
Column A Column B Column C
 
 E1 E4 E7 
 
 E2 E5 E8 
 
 
 E3 E6 
 

Each anchor centered below its column's temporal span
```

### Enhanced Core Principles (Updated Specifications)

#### Horizontal Space Optimization
**"For the left-to-right clustering algorithm, we have to try to optimize the horizontal space as much as possible and to occupy as much as possible of the screen. So, for a given series of events, when zoomed out completely, we want to try to dispatch the events as much as possible, and then apply our clustering logic."**

```
Horizontal Optimization Strategy:
1. Consider display start date and end date of timeline
2. Dispatch events across full timeline width
3. Maximize screen real estate usage
4. Apply clustering logic after optimal distribution
5. Avoid excessive clustering when space is available
```

#### Independent Above/Below Layout
**"We can decorrelate the upper and bottom parts of the timeline, so that we may have a crowded cluster with compact cards above, and then just a bit later (so a bit further to the right on the UI) a 1-2 full-cards cluster shown in the below parts."**

```
Decorrelated Layout System:
- Above timeline: Independent clustering and degradation
- Below timeline: Independent clustering and degradation
- Different card types can coexist vertically
- Horizontal positioning remains synchronized to timeline dates
- Each side optimizes independently for best space usage
```

#### Timeline-Driven Layout Process
**"It's important to always consider the display start date and end date of the timeline, then dispatch the events, then cluster, then try to fit the cards and apply the degradations logic."**

```
Process Order (Critical):
1. Determine timeline display range (start_date, end_date)
2. Dispatch events across timeline width for optimal distribution
3. Apply left-to-right clustering within available space
4. Attempt to fit cards in available slots
5. Apply degradation logic when slots are insufficient
6. Validate zero overlaps and optimal space usage
```

### Implementation Requirements

#### Core Algorithm Steps (Enhanced)
1. **Calculate timeline display bounds** (start_date, end_date)
2. **Dispatch events optimally** across full timeline width
3. **Sort events chronologically** (left to right processing)
4. **Create independent above/below layouts** 
5. **Apply clustering per vertical section** (above and below separately)
6. **Group by horizontal overlap** (events within column width)
7. **Center anchors temporally** (not geometrically)
8. **Apply slot-based degradation** (4/8/8/4 slot allocation)
9. **Track slot occupancy independently** (above/below)
10. **Optimize horizontal space usage** (maximize screen utilization)

#### Validation Criteria
- **Zero overlaps**: Slot occupancy tracking prevents collisions
- **Deterministic**: Same input always produces same layout
- **Temporal accuracy**: Anchors represent true temporal centers
- **Mathematical correctness**: 1:2:4:5 degradation ratios maintained
- **Visual clarity**: Slot utilization clearly displayed

## Testing Strategy

### Unit Tests
- **Clustering**: Verify left-to-right grouping logic matches user specification
- **Slot allocation**: Confirm exact 2/4/8/10 slot assignments
- **Degradation math**: Test precise 1 2 4 5 conversions 
- **Anchor positioning**: Validate temporal centering calculations

### Integration Tests 
- **Zero overlaps**: Comprehensive overlap detection per user requirement
- **Space utilization**: Optimal slot usage verification
- **Edge cases**: Single events, dense clusters, empty timeline

### Visual Tests
- **Screenshot comparison**: Before/after degradation states
- **Column alignment**: Verify anchor centering per user specification
- **Slot visualization**: Development mode slot indicators showing occupancy

## Zoom & Navigation System

### View Window Management
The zoom system uses a normalized coordinate system where:
- **0.0** = Timeline start (earliest event date)
- **1.0** = Timeline end (latest event date) 
- **viewStart/viewEnd** = Current visible window within [0, 1] range

### Mouse Wheel Zoom 
- **No Ctrl key required** - Direct wheel events trigger zoom
- **Cursor-anchored** - Events under cursor stay stable during zoom
- **Boundary-aware** - Prevents zoom beyond timeline limits
- **Performance optimized** - <2s per operation even with 150+ events

### Timeline Minimap Component (Stage 5.1)
A horizontal timeline overview positioned above the main timeline to provide zoom context and navigation.

#### Minimap Design
```
 
 [1769] [1821] Timeline overview
 Current view window 
 (highlighted section)
 
 Event density markers 
 
```

#### Minimap Features
- **Full timeline bar** - Shows complete date range with year markers
- **View window indicator** - Highlighted section showing current zoom area
- **Event density visualization** - Dots/bars indicating where events exist
- **Click-to-navigate** - Click anywhere to instantly jump to that timeline area
- **Zoom level indicator** - Visual proportion of current view vs full timeline 
- **Responsive design** - Adapts to viewport width and timeline range

#### Implementation Structure
```
TimelineMinimap Component:
 MinimapContainer (horizontal bar)
 MinimapBackground (full timeline range)
 MinimapViewWindow (current zoom area) 
 MinimapEventMarkers (density indicators)
 MinimapClickHandler (navigation)
 MinimapLabels (start/end dates)
```

#### Navigation Behavior
- **Click positioning** - Click at X% on minimap zoom to that temporal position
- **Drag view window** - Drag highlighted area to pan timeline
- **Proportional zoom** - Visual feedback of zoom level (window size vs full bar)
- **Smooth transitions** - Animated navigation between timeline sections

**PURPOSE**: Solves cursor positioning confusion by providing visual context of zoom position within full timeline, enabling precise temporal navigation.
