import type { Event } from '../types';
import type { LayoutConfig, LayoutResult, PositionedCard, CardType, EventCluster, Anchor, ColumnBounds } from './types';

/**
 * Deterministic Layout Engine v4
 * 
 * Implements left-to-right clustering with mathematical degradation:
 * - Full cards: 4 slots (2 above, 2 below)
 * - Compact cards: 4 slots (2 above, 2 below) - 1 Full = 2 Compact
 * - Title-only cards: 8 slots (4 above, 4 below) - 1 Full = 4 Title-only  
 * - Multi-event cards: 10 slots (5 above, 5 below) - 1 Full = 5 Multi-event entries
 */

export interface SlotAllocation {
  slotsAbove: number;
  slotsBelow: number;
  totalSlots: number;
  eventsPerCard: number;
}

export interface ColumnGroup {
  id: string;
  events: Event[];
  startX: number;
  endX: number;
  centerX: number;
  anchor: Anchor;
  cards: PositionedCard[];
  slotsUsed: number;
}

export class DeterministicLayout {
  private config: LayoutConfig;
  private timelineY: number;
  private timeRange: { startTime: number; endTime: number; duration: number } | null = null;
  
  // Deterministic slot allocations per card type
  private readonly SLOT_ALLOCATIONS: Record<CardType, SlotAllocation> = {
    full: { slotsAbove: 2, slotsBelow: 2, totalSlots: 4, eventsPerCard: 1 },
    compact: { slotsAbove: 2, slotsBelow: 2, totalSlots: 4, eventsPerCard: 2 },
    'title-only': { slotsAbove: 4, slotsBelow: 4, totalSlots: 8, eventsPerCard: 4 },
    'multi-event': { slotsAbove: 5, slotsBelow: 5, totalSlots: 10, eventsPerCard: 5 },
    infinite: { slotsAbove: 1, slotsBelow: 1, totalSlots: 2, eventsPerCard: 999 }
  };

  constructor(config: LayoutConfig) {
    this.config = config;
    this.timelineY = config.timelineY || config.viewportHeight / 2;
  }

  /**
   * Main layout function - implements the new deterministic strategy
   */
  layout(events: Event[]): LayoutResult {
    if (events.length === 0) {
      return {
        positionedCards: [],
        anchors: [],
        clusters: [],
        utilization: { totalSlots: 0, usedSlots: 0, percentage: 0 }
      };
    }

    // Calculate time range from actual events
    this.calculateTimeRange(events);

    // Step 1: Left-to-right clustering
    const columnGroups = this.performLeftToRightClustering(events);
    
    // Step 2: Apply mathematical degradation to each column
    const processedGroups = this.applyMathematicalDegradation(columnGroups);
    
    // Step 3: Position cards in deterministic slots
    const finalResult = this.positionCardsInSlots(processedGroups);
    
    return finalResult;
  }

  /**
   * Step 1: Left-to-right clustering algorithm
   * Process events chronologically, group by horizontal overlap
   */
  private performLeftToRightClustering(events: Event[]): ColumnGroup[] {
    // Sort events chronologically (left to right)
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const columnGroups: ColumnGroup[] = [];
    
    // Calculate base column width (will be refined per group)
    const baseColumnWidth = 150; // Narrower columns for better distribution
    const maxEventsPerColumn = 6; // Lower limit to prevent overcrowding
    
    for (const event of sortedEvents) {
      const eventX = this.getEventXPosition(event);
      let addedToExistingGroup = false;
      
      // Check if this event can be added to an existing column group
      for (const group of columnGroups) {
        // Skip if group is already at max capacity
        if (group.events.length >= maxEventsPerColumn) {
          continue;
        }
        
        // const groupWidth = Math.max(baseColumnWidth, group.endX - group.startX);
        // const groupEndX = group.startX + groupWidth;
        
        // Check horizontal overlap: does this event fall within this column's space?
        // Use tighter clustering to create more columns
        const clusterThreshold = baseColumnWidth * 0.4; // Only cluster if very close (40% of column width)
        if (Math.abs(eventX - group.centerX) <= clusterThreshold / 2) {
          // Add to existing group
          group.events.push(event);
          group.endX = Math.max(group.endX, eventX);
          
          // Recalculate center position
          const timeStart = Math.min(...group.events.map(e => new Date(e.date).getTime()));
          const timeEnd = Math.max(...group.events.map(e => new Date(e.date).getTime()));
          const centerTime = (timeStart + timeEnd) / 2;
          group.centerX = this.timeToX(new Date(centerTime));
          
          // Update anchor position
          group.anchor.x = group.centerX;
          group.anchor.eventIds = group.events.map(e => e.id);
          group.anchor.eventCount = group.events.length;
          
          addedToExistingGroup = true;
          break;
        }
      }
      
      // If not added to existing group, create new column group
      if (!addedToExistingGroup) {
        const groupId = `column-${columnGroups.length}`;
        const newGroup: ColumnGroup = {
          id: groupId,
          events: [event],
          startX: eventX,
          endX: eventX,
          centerX: eventX,
          anchor: {
            id: `anchor-${groupId}`,
            x: eventX,
            y: this.timelineY,
            eventIds: [event.id],
            eventCount: 1
          },
          cards: [],
          slotsUsed: 0
        };
        
        columnGroups.push(newGroup);
      }
    }
    
    return columnGroups;
  }

  /**
   * Step 2: Apply mathematical degradation based on event count
   * 1 Full = 2 Compact = 4 Title-only = 5 Multi-event entries
   */
  private applyMathematicalDegradation(columnGroups: ColumnGroup[]): ColumnGroup[] {
    return columnGroups.map(group => {
      const eventCount = group.events.length;
      const degradationPlan = this.calculateOptimalDegradation(eventCount);
      
      // Create cards based on degradation plan
      group.cards = this.createCardsFromDegradationPlan(group.events, degradationPlan, group.id);
      group.slotsUsed = this.calculateSlotsUsed(degradationPlan);
      
      // Update anchor event count
      group.anchor.eventCount = eventCount;
      
      return group;
    });
  }

  /**
   * Calculate optimal degradation to minimize total slots used
   */
  private calculateOptimalDegradation(eventCount: number): DegradationPlan {
    if (eventCount <= 2) {
      // 1-2 events: Full cards
      return { full: eventCount, compact: 0, 'title-only': 0, 'multi-event': 0 };
    }
    
    if (eventCount <= 6) {
      // 3-6 events: Compact cards
      return { full: 0, compact: eventCount, 'title-only': 0, 'multi-event': 0 };
    }
    
    if (eventCount <= 9) {
      // 7-9 events: Mix of compact and title-only
      const compactCount = Math.floor(eventCount * 0.4); // 40% compact
      const titleOnlyCount = eventCount - compactCount;
      return { full: 0, compact: compactCount, 'title-only': titleOnlyCount, 'multi-event': 0 };
    }
    
    if (eventCount <= 14) {
      // 10-14 events: Title-only cards
      return { full: 0, compact: 0, 'title-only': eventCount, 'multi-event': 0 };
    }
    
    // 15+ events: Multi-event cards
    if (eventCount >= 15) {
      const multiEventCards = Math.floor(eventCount / 5);
      const remainingEvents = eventCount % 5;
      
      let plan: DegradationPlan = {
        full: 0,
        compact: 0, 
        'title-only': 0,
        'multi-event': multiEventCards * 5 // Each multi-event card handles 5 events
      };
      
      // Handle remaining events optimally
      if (remainingEvents > 0) {
        if (remainingEvents <= 2) {
          plan.compact = remainingEvents;
        } else {
          plan['title-only'] = remainingEvents;
        }
      }
      
      return plan;
    }
    
    // Default fallback
    return { full: 0, compact: 0, 'title-only': eventCount, 'multi-event': 0 };
  }

  /**
   * Create positioned cards from degradation plan
   */
  private createCardsFromDegradationPlan(
    events: Event[], 
    plan: DegradationPlan, 
    groupId: string
  ): PositionedCard[] {
    const cards: PositionedCard[] = [];
    let eventIndex = 0;
    let cardIndex = 0;
    
    // Create full cards
    for (let i = 0; i < plan.full; i++) {
      cards.push(this.createCard(events[eventIndex], 'full', groupId, cardIndex));
      eventIndex++;
      cardIndex++;
    }
    
    // Create compact cards (1 event per card for better visibility)
    for (let i = 0; i < plan.compact; i++) {
      if (eventIndex < events.length) {
        cards.push(this.createCard(events[eventIndex], 'compact', groupId, cardIndex));
        eventIndex++;
        cardIndex++;
      }
    }
    
    // Create title-only cards (1 event per card for clear display)
    for (let i = 0; i < plan['title-only']; i++) {
      if (eventIndex < events.length) {
        cards.push(this.createCard(events[eventIndex], 'title-only', groupId, cardIndex));
        eventIndex++;
        cardIndex++;
      }
    }
    
    // Create multi-event cards
    for (let i = 0; i < plan['multi-event'] / 5; i++) {
      const cardEvents = events.slice(eventIndex, eventIndex + 5);
      cards.push(this.createCard(cardEvents[0], 'multi-event', groupId, cardIndex, cardEvents));
      eventIndex += cardEvents.length;
      cardIndex++;
    }
    
    return cards;
  }

  /**
   * Step 3: Position cards in deterministic slots with collision avoidance
   */
  private positionCardsInSlots(columnGroups: ColumnGroup[]): LayoutResult {
    const allCards: PositionedCard[] = [];
    const allAnchors: Anchor[] = [];
    const clusters: EventCluster[] = [];
    const columnBounds: ColumnBounds[] = [];
    
    let totalSlotsUsed = 0;
    let totalSlotsAvailable = 0;
    
    // Sort groups by X position to process left to right
    const sortedGroups = [...columnGroups].sort((a, b) => a.centerX - b.centerX);
    
    // Track occupied horizontal space to prevent overlaps
    const occupiedRanges: { start: number; end: number }[] = [];
    
    for (let i = 0; i < sortedGroups.length; i++) {
      const group = sortedGroups[i];
      
      // Adjust group position to avoid overlaps
      let adjustedCenterX = group.centerX;
      const columnWidth = 150;
      const columnSpacing = 10; // Reduced spacing for tighter packing
      
      // Check for collisions with existing columns
      for (const range of occupiedRanges) {
        const proposedStart = adjustedCenterX - columnWidth / 2;
        const proposedEnd = adjustedCenterX + columnWidth / 2;
        
        // If there's an overlap, shift this column to the right
        if (!(proposedEnd < range.start || proposedStart > range.end)) {
          adjustedCenterX = range.end + columnWidth / 2 + columnSpacing;
        }
      }
      
      // Update group center for positioning
      const originalCenterX = group.centerX;
      group.centerX = adjustedCenterX;
      
      // Position cards in vertical slots
      const positionedCards = this.positionCardsVertically(group, i, sortedGroups.length);
      
      // Restore original center for anchor
      group.centerX = originalCenterX;
      
      // Track this column's occupied space
      occupiedRanges.push({
        start: adjustedCenterX - columnWidth / 2,
        end: adjustedCenterX + columnWidth / 2
      });
      
      // Track column bounds for visualization
      if (positionedCards.length > 0) {
        const minY = Math.min(...positionedCards.map(c => c.y));
        const maxY = Math.max(...positionedCards.map(c => c.y + c.cardHeight));
        columnBounds.push({
          x: adjustedCenterX - columnWidth / 2,
          width: columnWidth,
          minY,
          maxY
        });
      }
      
      allCards.push(...positionedCards);
      allAnchors.push(group.anchor);
      
      // Create cluster
      const cluster: EventCluster = {
        id: group.id,
        events: group.events,
        anchor: group.anchor
      };
      clusters.push(cluster);
      
      // Update statistics
      totalSlotsUsed += group.slotsUsed;
      totalSlotsAvailable += this.calculateMaxSlotsForGroup(group);
    }
    
    return {
      positionedCards: allCards,
      anchors: allAnchors,
      clusters,
      columnBounds,
      utilization: {
        totalSlots: totalSlotsAvailable,
        usedSlots: totalSlotsUsed,
        percentage: totalSlotsAvailable > 0 ? (totalSlotsUsed / totalSlotsAvailable) * 100 : 0
      }
    };
  }

  /**
   * Position cards vertically in their assigned slots - fixed to prevent overlaps
   */
  private positionCardsVertically(group: ColumnGroup, columnIndex: number, totalColumns: number): PositionedCard[] {
    const cards = [...group.cards];
    const columnWidth = 150; // Narrower columns for better distribution
    const viewportHeight = this.config.viewportHeight;
    const timelineHeight = 20; // Height reserved for timeline
    const topMargin = 20;
    const bottomMargin = 20;
    
    // Calculate available space above and below timeline
    const spaceAbove = this.timelineY - topMargin;
    const spaceBelow = viewportHeight - this.timelineY - timelineHeight - bottomMargin;
    
    // Distribute cards between above and below sections
    let aboveCards: PositionedCard[] = [];
    let belowCards: PositionedCard[] = [];
    
    cards.forEach((card, index) => {
      if (index % 2 === 0) {
        aboveCards.push(card);
      } else {
        belowCards.push(card);
      }
    });
    
    // Calculate optimal card heights based on available space
    const getCardHeight = (cardType: CardType, availableSpace: number, cardCount: number): number => {
      if (cardCount === 0) return 0;
      
      const minSpacing = 10;
      const maxHeightPerCard = (availableSpace - (cardCount - 1) * minSpacing) / cardCount;
      
      // Set card heights based on type with reasonable limits
      switch (cardType) {
        case 'full':
        case 'multi-event':
          return Math.min(100, Math.max(60, maxHeightPerCard));
        case 'compact':
          return Math.min(70, Math.max(40, maxHeightPerCard * 0.7));
        case 'title-only':
          return Math.min(35, Math.max(25, maxHeightPerCard * 0.35));
        case 'infinite':
          return Math.min(120, Math.max(80, maxHeightPerCard));
        default:
          return Math.min(70, Math.max(40, maxHeightPerCard));
      }
    };
    
    // Position above cards - pack tightly near timeline and go upward
    const positionedAbove = aboveCards.map((card, index) => {
      const cardHeight = getCardHeight(card.cardType, spaceAbove, aboveCards.length);
      const dynamicSpacing = Math.min(8, Math.max(2, (spaceAbove - aboveCards.length * cardHeight) / (aboveCards.length + 1)));
      const gapFromTimeline = 15; // Same gap as below for symmetry
      
      // Start near timeline and pack upward (reverse index for proper stacking)
      const startY = this.timelineY - gapFromTimeline;
      const yPos = startY - (aboveCards.length - index) * (cardHeight + dynamicSpacing);
      
      return {
        ...card,
        x: group.centerX - columnWidth / 2,
        y: yPos,
        cardWidth: columnWidth,
        cardHeight: cardHeight,
        anchorX: group.anchor.x,
        anchorY: group.anchor.y
      };
    });
    
    // Position below cards - pack tightly from timeline
    const positionedBelow = belowCards.map((card, index) => {
      const cardHeight = getCardHeight(card.cardType, spaceBelow, belowCards.length);
      const dynamicSpacing = Math.min(8, Math.max(2, (spaceBelow - belowCards.length * cardHeight) / (belowCards.length + 1)));
      const gapFromTimeline = 15; // Reduced gap from timeline
      
      // Start close to timeline and pack down
      const startY = this.timelineY + gapFromTimeline;
      const yPos = startY + index * (cardHeight + dynamicSpacing);
      
      return {
        ...card,
        x: group.centerX - columnWidth / 2,
        y: yPos,
        cardWidth: columnWidth,
        cardHeight: cardHeight,
        anchorX: group.anchor.x,
        anchorY: group.anchor.y
      };
    });
    
    return [...positionedAbove, ...positionedBelow];
  }

  // Helper methods
  
  private createCard(
    event: Event, 
    type: CardType, 
    groupId: string, 
    cardIndex: number,
    allEvents?: Event[]
  ): PositionedCard {
    return {
      id: `${groupId}-card-${cardIndex}`,
      event: allEvents && allEvents.length > 1 ? allEvents : event,
      x: 0, // Will be set in positioning step
      y: 0, // Will be set in positioning step  
      cardWidth: 0, // Will be set in positioning step
      cardHeight: 0, // Will be set in positioning step
      anchorX: 0, // Will be set in positioning step
      anchorY: 0, // Will be set in positioning step
      cardType: type,
      isMultiEvent: allEvents ? allEvents.length > 1 : false,
      isSummaryCard: type === 'infinite',
      clusterId: groupId,
      eventCount: allEvents ? allEvents.length : 1
    };
  }

  private calculateSlotsUsed(plan: DegradationPlan): number {
    return (
      plan.full * this.SLOT_ALLOCATIONS.full.totalSlots +
      plan.compact * this.SLOT_ALLOCATIONS.compact.totalSlots +
      plan['title-only'] * this.SLOT_ALLOCATIONS['title-only'].totalSlots +
      Math.ceil(plan['multi-event'] / 5) * this.SLOT_ALLOCATIONS['multi-event'].totalSlots
    );
  }

  private calculateMaxSlotsForGroup(group: ColumnGroup): number {
    // For now, assume unlimited vertical space
    // In practice, this would be based on viewport height
    return Math.max(20, group.events.length * 4); // Generous slot allocation
  }

  private getEventXPosition(event: Event): number {
    return this.timeToX(new Date(event.date));
  }

  private calculateTimeRange(events: Event[]): void {
    if (events.length === 0) return;

    const timestamps = events.map(event => new Date(event.date).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    
    const baseDuration = maxTime - minTime;
    const padding = Math.max(baseDuration * 0.1, 7 * 24 * 60 * 60 * 1000); // 10% padding, min 7 days
    
    this.timeRange = {
      startTime: minTime - padding,
      endTime: maxTime + padding,
      duration: (maxTime + padding) - (minTime - padding)
    };
  }

  private timeToX(date: Date): number {
    if (!this.timeRange) return 0;
    
    const { viewportWidth } = this.config;
    const padding = 50; // Padding from edges
    const timeOffset = date.getTime() - this.timeRange.startTime;
    const x = (timeOffset / this.timeRange.duration) * (viewportWidth - 2 * padding) + padding;
    return Math.max(padding, Math.min(viewportWidth - padding, x));
  }
}

// Supporting interfaces

interface DegradationPlan {
  full: number;
  compact: number;
  'title-only': number;
  'multi-event': number;
}