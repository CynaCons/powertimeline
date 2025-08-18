# ChronoChart Architecture (Deterministic Layout v4)

## Overview

ChronoChart renders a horizontal timeline with event cards positioned in deterministic vertical slots above and below timeline anchors. The system uses a left-to-right clustering algorithm with precise slot allocation and mathematical degradation to ensure zero overlaps and predictable behavior.

## Where to find what

- Architecture and planning
  - `ARCHITECTURE.md` — Deterministic slot-based layout, degradation math, left-to-right clustering.
  - `PLAN.md` — Phases, checklists, current work items and docs follow-ups.
  - `PRD.md` — Product goals, user stories, success metrics.
  - `COMPLETED.md` — Iteration history, decisions, and regressions fixed.

- Core layout engine (deterministic + mathematical)
  - `src/layout/clustering.ts` — Left-to-right event clustering algorithm.
  - `src/layout/SlotGrid.ts` — Deterministic slot allocation and occupancy tracking.
  - `src/layout/DeterministicLayout.ts` — Main layout engine with mathematical degradation.
  - `src/layout/DegradationEngine.ts` — Precise 1→2→4→5 degradation mathematics.
  - `src/layout/LayoutEngine.ts` — Orchestration & stats.
  - `src/layout/config.ts` / `src/layout/types.ts` — Card sizes/configs and types.

- Timeline UI and visuals
  - `src/components/Timeline.tsx` — Timeline composition and configs.
  - `src/timeline/Axis.tsx`, `RangeBar.tsx`, `SvgDefs.tsx` — Axis, range, defs.
  - `src/styles/tokens.css` — Theme tokens (colors, strokes, etc.).

- Overlays and panels
  - `src/app/OverlayShell.tsx` — Overlay container and focus handling.
  - `src/app/panels/*` — Editor/Outline/Dev panels (MUI-based).

- Utilities and libs
  - `src/lib/time.ts`, `text.ts`, `storage.ts` — Time mapping, measurements, persistence.
  - `src/lib/devSeed.ts` — Seeding helpers and test datasets.

- Tests
  - `tests/*.spec.ts` — Playwright suite (layout, axis, a11y, density, performance).

## Core Principles

1. **Deterministic slot allocation**: Each card type has a fixed number of slots (2/4/8/10)
2. **Mathematical degradation**: 1 Full = 2 Compact = 4 Title-only = 5 Multi-event entries
3. **Left-to-right clustering**: Process events chronologically, group by horizontal overlap
4. **Zero overlaps guaranteed**: Predefined slots with occupancy tracking
5. **Centered anchors**: Time anchors positioned at center of their column groups

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
- **Conversion**: 1 Full → 2 Compact cards

### 3. Title-Only Cards
- **Content**: Title + date only
- **Slots**: 4 above + 4 below = **8 total slots**
- **Size**: Vertically smaller than compact cards
- **Use**: Second degradation level
- **Conversion**: 1 Full → 4 Title-only cards

### 4. Multi-Event Cards
- **Content**: Multiple event titles + dates with separators (max 5 events per card)
- **Slots**: 2 above + 2 below = **4 total slots** (same as full cards)
- **Size**: Same physical size as full cards, but content is multiple events
- **Use**: Final degradation level
- **Conversion**: 1 Full → 5 Multi-event entries (in one card)
- **Layout**: 10 events total = 10 above + 10 below (2 full card slots × 5 events each)

## Left-to-Right Clustering Algorithm

### Step 1: Chronological Processing
```
Events: [E1: Jan 1] [E2: Jan 5] [E3: Jan 15] [E4: Jan 17] [E5: Feb 1]
Process order: E1 → E2 → E3 → E4 → E5
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
    Jan 1    Jan 8    Jan 15    Feb 1
      ●────────●────────●────────●
    E1,E2,E3    ↑     E4       E5
              Anchor A
```

## Deterministic Degradation Mathematics

### Slot Capacity Formula
```
Full cards:       4 slots  →  1 event  per 4 slots
Compact cards:    4 slots  →  2 events per 4 slots  
Title-only cards: 8 slots  →  4 events per 8 slots
Multi-event cards:10 slots →  5 events per 10 slots
```

### Degradation Decision Tree
```
For N events in a column group:

IF N ≤ 1:  Use 1 Full card (4 slots)
IF N ≤ 2:  Use 2 Compact cards (4 slots total)
IF N ≤ 4:  Use 4 Title-only cards (8 slots total)  
IF N ≤ 5:  Use 1 Multi-event card (10 slots total)
IF N > 5:  Use multiple Multi-event cards as needed
```

### Example: 7 Events in One Column
```
7 events need accommodation:
- Option 1: 1 Multi-event card (5 events) + 1 Compact card (2 events) = 15 slots
- Option 2: 1 Multi-event card (5 events) + 2 Title-only cards (2 events) = 18 slots
- Choose Option 1 (minimum slots = optimal)

Result: 2 cards total, 15 slots used
```

## Layout Positioning System

### Column Structure
```
      Column A              Column B
   ┌─────────────┐      ┌─────────────┐
   │ Slot 1 (E1) │      │ Slot 1 (E4) │  ← Above timeline
   ├─────────────┤      ├─────────────┤
   │ Slot 2 (E2) │      │ Slot 2 (E5) │
   ├─────────────┤      ├─────────────┤
───●─────────────●──────●─────────────●─── ← Timeline + Anchors
   │ Slot 3 (E3) │      │ Slot 3      │
   ├─────────────┤      ├─────────────┤
   │ Slot 4      │      │ Slot 4      │  ← Below timeline
   └─────────────┘      └─────────────┘

   Anchor A (centered)   Anchor B (centered)
```

### Horizontal Spacing Calculation
```
Column width = max(card_width, min_column_width)
Column spacing = column_width + horizontal_gap
Anchor position = column_center_x

For Column A: events from x1 to x2
Anchor X = (x1 + x2) / 2
```

## Key Guarantees

### 1. Zero Overlaps
- **Vertical**: Each slot can only hold one card, tracked by occupancy
- **Horizontal**: Columns are spaced by `column_width + gap`
- **Mathematical**: Slot allocation is deterministic and predictable

### 2. Predictable Degradation
- **1:2 ratio**: 1 Full card becomes exactly 2 Compact cards
- **1:4 ratio**: 1 Full card becomes exactly 4 Title-only cards  
- **1:5 ratio**: 1 Full card becomes exactly 5 Multi-event entries
- **No partial degradation**: All cards in a group degrade together

### 3. Optimal Space Usage
- **Minimum slots**: Algorithm chooses degradation level requiring fewest total slots
- **Balanced columns**: Events distributed to minimize total column count
- **Centered anchors**: Time accuracy maintained through mathematical centering

## Implementation Phases

### Phase 1: Left-to-Right Clustering ✓
- [x] Chronological event processing
- [x] Horizontal overlap detection  
- [x] Column group formation
- [x] Anchor centering mathematics

### Phase 2: Deterministic Slot Allocation ✓  
- [x] Fixed slot counts per card type (2/4/8/10)
- [x] Slot occupancy tracking
- [x] Zero-overlap guarantees

### Phase 3: Mathematical Degradation ✓
- [x] 1→2→4→5 conversion mathematics
- [x] Optimal slot usage algorithm
- [x] Group-level degradation decisions

### Phase 4: Testing & Validation ✓
- [x] Slot occupancy verification
- [x] Overlap detection tests  
- [x] Mathematical correctness tests
- [x] Visual regression screenshots

## The Desired Algorithm (User's Specification)

### Core Concept Quote
**"Full cards should have 2 slots above and below. Compact cards should have 4 slots. Only-Title should have 8 event slots above and below. Multi-Event should have 10 slots above and below."**

**"Basically a full card can be split in 2 compact or 4 only title or 5 multi-events (5 events in one single card, with separators)."**

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
1. Take first event E1 → Create Column A
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

#### Slot Allocation Rules (Corrected User's Numbers)
```
Full Cards:      2 above + 2 below = 4 total slots
Compact Cards:   4 above + 4 below = 8 total slots (half height of full cards)
Title-Only:     4 above + 4 below = 8 total slots (smaller than compact)
Multi-Event:     2 above + 2 below = 4 total slots (full card size, multi content)
                 → Effective capacity: 10 above + 10 below = 20 events total
```

#### Mathematical Degradation (User's Formula)
**"Basically a full card can be split in 2 compact or 4 only title or 5 multi-events"**

```
Splitting Relationship:
1 Full Card = 2 Compact Cards = 4 Title-Only Cards = 5 Multi-Event entries

This means:
- When 1 Full card can't fit → create 2 Compact cards
- When 2 Compact cards can't fit → create 4 Title-only cards  
- When 4 Title-only cards can't fit → create 1 Multi-event card (5 events)
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
   ┌─────────────┐
   │ Event 1     │  ← Slot 1 above
   ├─────────────┤
   │ Event 2     │  ← Slot 2 above  
   ├─────────────┤
───●─────────────●─── ← Timeline + Centered Anchor
   │ Event 3     │  ← Slot 1 below
   ├─────────────┤
   │ Event 4     │  ← Slot 2 below
   └─────────────┘

Anchor positioned at temporal center of [Event1, Event2, Event3, Event4]
```

#### Multi-Column Layout
```
Column A          Column B          Column C
┌─────────┐      ┌─────────┐      ┌─────────┐
│ E1      │      │ E4      │      │ E7      │
├─────────┤      ├─────────┤      ├─────────┤
│ E2      │      │ E5      │      │ E8      │
├─────────┤      ├─────────┤      ├─────────┤
●─────────●──────●─────────●──────●─────────●
│ E3      │      │ E6      │      │         │
└─────────┘      └─────────┘      └─────────┘

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
- **Degradation math**: Test precise 1→2→4→5 conversions  
- **Anchor positioning**: Validate temporal centering calculations

### Integration Tests  
- **Zero overlaps**: Comprehensive overlap detection per user requirement
- **Space utilization**: Optimal slot usage verification
- **Edge cases**: Single events, dense clusters, empty timeline

### Visual Tests
- **Screenshot comparison**: Before/after degradation states
- **Column alignment**: Verify anchor centering per user specification
- **Slot visualization**: Development mode slot indicators showing occupancy