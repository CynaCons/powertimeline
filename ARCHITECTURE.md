# ChronoChart Architecture (Simplified Layout v3)

## Overview

ChronoChart renders a horizontal timeline with event cards positioned in vertical columns above and below timeline anchors. The system uses a simple slot-based approach with progressive degradation to handle dense datasets efficiently.

## Core Principles

1. **Slot-based positioning**: Cards occupy discrete vertical slots in columns
2. **Progressive degradation**: Cards degrade through defined types when slots are full
3. **Cluster-local management**: Each anchor manages its own card degradation independently
4. **Full viewport utilization**: No safe zones, overlays handle UI elements
5. **Predictable behavior**: Simple rules produce consistent, testable results

## Card Types (5 Types)

### 1. Full Cards
- **Content**: Title + full description + date
- **Size**: Largest format
- **Use**: Default for low-density clusters

### 2. Compact Cards  
- **Content**: Title + partial description + date
- **Size**: Medium format
- **Use**: First degradation level

### 3. Title-Only Cards
- **Content**: Title + date only
- **Size**: Small format  
- **Use**: Second degradation level

### 4. Multi-Event Cards
- **Content**: Multiple event titles with vertical separators
- **Size**: Variable height based on event count
- **Use**: Third degradation level (groups ~3-5 events)

### 5. Infinite Cards
- **Content**: "N events" where N is remaining count
- **Size**: Small, fixed format
- **Use**: Final fallback (only when others are multi-event)

## Layout Strategy

### Viewport Utilization
- **Full viewport usage**: Cards can be placed anywhere on screen
- **Overlay UI**: All interface elements use transparent overlays
  - Navigation rail: Left side, transparent when not hovered
  - Controls bar: Bottom overlay, transparent when not hovered  
  - Panels: Left side, start visible then fade to transparent
- **No safe zones**: Timeline and cards utilize entire viewport

### Timeline & Anchors
- **Anchors**: Dark grey squares with white outline on timeline
- **Event clustering**: Events close in time form clusters around anchors
- **Cluster badges**: Small indicators showing event count per cluster
- **Zoom behavior**: Zooming in breaks clusters into smaller sub-clusters

## Positioning System

### Slot-Based Layout
```
    Column 1    Column 2
    ┌─────┐    ┌─────┐     ← Above timeline slots
    │ C1  │    │ C2  │     
    ├─────┤    ├─────┤     
    │ C3  │    │ C4  │     
────●───────●───────────    ← Timeline + Anchor
    │ C5  │    │ C6  │     
    ├─────┤    ├─────┤     
    │ C7  │    │ C8  │     
    └─────┘    └─────┘     ← Below timeline slots
```

### Column Expansion Logic
1. **Single Column**: Place cards vertically above/below anchor
2. **Dual Column**: When single column full, add second column
3. **Column Centering**: Both columns centered on timeline anchor
4. **Horizontal Spacing**: Adequate space between columns

## Degradation Algorithm

### Degradation Sequence
For each cluster when slots are full:

1. **Try Full Cards**: Place as many full cards as slots allow
2. **Degrade to Compact**: Convert remaining events to compact cards
3. **Degrade to Title-Only**: Convert remaining events to title-only cards  
4. **Degrade to Multi-Event**: Group remaining events into multi-event cards
5. **Create Infinite Card**: Convert ONE multi-event card to infinite, increment count

### Key Rules
- **Degradation trigger**: When no slots available for current card type
- **Partial degradation**: Can degrade some cards while keeping others at higher levels
- **Infinite card constraint**: Only appears when ALL other cards are multi-event
- **Single infinite per cluster**: Only one infinite card per anchor cluster

### Example Degradation Flow
```
Cluster with 15 events, 8 total slots available:

Step 1: Try full cards
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    ← 8 full cards placed
│Full1│ │Full2│ │Full3│ │Full4│      (7 events remaining)
├─────┤ ├─────┤ ├─────┤ ├─────┤    
│Full5│ │Full6│ │Full7│ │Full8│    
└─────┘ └─────┘ └─────┘ └─────┘    

Step 2: Degrade some to compact, add remaining
┌─────┐ ┌─────┐ ┌───┐ ┌───┐        ← Mixed: 4 full + 4 compact
│Full1│ │Full2│ │Cmp│ │Cmp│          (7 events now fit in 8 slots)
├─────┤ ├─────┤ ├───┤ ├───┤        
│Full3│ │Full4│ │Cmp│ │Cmp│        
└─────┘ └─────┘ └───┘ └───┘        

Step 3: If still not enough, continue degrading...
```

## Algorithm Implementation

### Core Algorithm
```typescript
function layoutCluster(events: Event[], availableSlots: Slot[]): PositionedCard[] {
  let remainingEvents = [...events];
  let placedCards: PositionedCard[] = [];
  let availableSlotCount = availableSlots.length;
  
  // Try each degradation level
  const cardTypes = ['full', 'compact', 'title-only', 'multi-event'];
  
  for (const cardType of cardTypes) {
    if (remainingEvents.length === 0) break;
    
    // Calculate how many cards of this type we can fit
    const cardsToPlace = Math.min(remainingEvents.length, availableSlotCount);
    
    // Place cards and update remaining
    for (let i = 0; i < cardsToPlace; i++) {
      placedCards.push(createCard(remainingEvents.shift(), cardType, availableSlots[i]));
    }
    
    availableSlotCount -= cardsToPlace;
  }
  
  // Handle infinite card if events still remain
  if (remainingEvents.length > 0) {
    // Convert last multi-event card to infinite
    const lastCard = placedCards.pop();
    placedCards.push(createInfiniteCard(lastCard, remainingEvents.length + 1));
  }
  
  return placedCards;
}
```

### Slot Management
```typescript
interface Slot {
  x: number;        // Horizontal position
  y: number;        // Vertical position  
  column: 0 | 1;    // Which column (0=left, 1=right)
  side: 'above' | 'below';  // Above or below timeline
  occupied: boolean;
}

function generateSlots(anchor: Anchor, viewportHeight: number): Slot[] {
  const slotsPerSide = Math.floor(viewportHeight / 2 / CARD_HEIGHT);
  const slots: Slot[] = [];
  
  // Generate single column slots first
  for (let side of ['above', 'below']) {
    for (let i = 0; i < slotsPerSide; i++) {
      slots.push({
        x: anchor.x,
        y: anchor.y + (side === 'above' ? -1 : 1) * CARD_HEIGHT * (i + 1),
        column: 0,
        side,
        occupied: false
      });
    }
  }
  
  // Generate dual column slots if horizontal space allows
  if (hasHorizontalSpace(anchor)) {
    // Add second column slots...
  }
  
  return slots;
}
```

## Data Structures & Algorithms

### Recommended Approaches

1. **Slot Grid**: Simple 2D array for slot management
   - O(1) slot lookup and assignment
   - Easy collision detection
   - Straightforward availability checking

2. **Priority Queue**: For card placement order
   - Events sorted by date/priority
   - Ensures consistent placement order
   - Simple FIFO degradation

3. **Stack-based Positioning**: For vertical slot assignment
   - Natural top-to-bottom, bottom-to-top flow
   - Easy backtracking if needed
   - Intuitive slot filling

4. **Rectangle Collision**: Simple bounding box checks
   - Fast O(1) per-pair collision detection
   - No complex geometry calculations
   - Reliable overlap prevention

### Performance Characteristics
- **Slot assignment**: O(1) per card
- **Collision detection**: O(n) per cluster (bounded by viewport)
- **Degradation**: O(1) per degradation level
- **Overall complexity**: O(n) where n = events per cluster

## Testing Strategy

### Validation Points
- **Slot occupancy**: No two cards occupy same slot
- **Degradation order**: Cards degrade in specified sequence
- **Infinite card rules**: Only appears with all multi-event cards
- **Viewport bounds**: All cards remain within viewport
- **Anchor centering**: Columns properly centered on anchors

### Test Scenarios
- Single event (single card)
- Low density (all full cards)
- Medium density (mixed full/compact)
- High density (title-only + multi-event)
- Extreme density (infinite cards)
- Cluster splitting on zoom

## Summary

This simplified architecture eliminates the complexity of multi-pass resolvers and emergency fallbacks while providing predictable, testable behavior. The slot-based approach with progressive degradation ensures optimal space utilization and maintains visual clarity across all density levels.

Key advantages:
- **Predictable**: Simple rules produce consistent results
- **Testable**: Clear validation points and edge cases
- **Performant**: Linear complexity with small constants
- **Maintainable**: Straightforward logic without complex state management
- **Visual**: Progressive degradation maintains information hierarchy