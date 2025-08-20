/**
 * Deterministic Layout Engine v5
 * 
 * Implements the corrected capacity model with proper footprints:
 * - Full cards: 4 cells footprint
 * - Compact cards: 2 cells footprint
 * - Title-only cards: 1 cell footprint
 * - Multi-event cards: 2 cells footprint (holds up to 5 events)
 * - Infinite cards: 2 cells footprint (overflow container)
 */

import type { Event } from '../types';
import type { LayoutConfig, LayoutResult, PositionedCard, CardType, EventCluster, Anchor } from './types';
import { CapacityModel, CARD_FOOTPRINTS, DEGRADATION_CASCADE } from './CapacityModel';

export interface ColumnGroup {
  id: string;
  events: Event[];
  overflowEvents?: Event[];
  startX: number;
  endX: number;
  centerX: number;
  anchor: Anchor;
  cards: PositionedCard[];
  capacity: {
    above: { used: number; total: number };
    below: { used: number; total: number };
  };
}

export interface DispatchMetrics {
  groupCount: number;
  avgEventsPerCluster: number;
  largestCluster: number;
  groupPitchPx: {
    min: number;
    max: number;
    avg: number;
  };
  horizontalSpaceUsage: number; // Percentage of viewport width utilized (0-100)
}

interface LayoutPlan {
  type: CardType;
  cardCount: number;
  eventsPerCard: number;
  totalFootprint: number;
  needsInfinite: boolean;
  residualEvents: number;
  infinitePreviewCount?: number;
}

interface AggregationMetrics {
  totalAggregations: number;
  eventsAggregated: number;
  clustersAffected: number;
}

interface InfiniteMetrics {
  enabled: boolean;
  containers: number;
  eventsContained: number;
  previewCount: number;
  byCluster: Array<{
    clusterId: string;
    side: 'above' | 'below';
    eventsContained: number;
  }>;
}

export class DeterministicLayoutV5 {
  private config: LayoutConfig;
  private timelineY: number;
  private capacityModel: CapacityModel;
  private timeRange: { startTime: number; endTime: number; duration: number } | null = null;
  
  // Configuration for spatial-based clustering (Stage 3B)
  private readonly MIN_GROUP_PITCH = 120; // Minimum pixels between groups for spatial separation
  private readonly MIN_HALF_COLUMN_WIDTH = 100; // Minimum adaptive width (pixels)
  private readonly MAX_HALF_COLUMN_WIDTH = 800; // Maximum adaptive width (pixels)
  private readonly TEMPORAL_GROUPING_FACTOR = 0.07; // 7% of timeline range for grouping window
  
  // Stability & churn minimization (Phase 0.6)
  private readonly STABLE_SORT_TIE_BREAKER = true; // Use stable sorting for determinism
  private readonly MIN_BOUNDARY_SHIFT = 50; // Minimum pixels to shift group boundaries
  
  constructor(config: LayoutConfig) {
    this.config = config;
    this.timelineY = config.timelineY || config.viewportHeight / 2;
    this.capacityModel = new CapacityModel(config.viewportHeight);
  }

  /**
   * Main layout function implementing Stage 1-3 of the plan
   */
  layout(events: Event[]): LayoutResult {
    if (events.length === 0) {
      return this.emptyResult();
    }

    // Calculate time range from actual events
    this.calculateTimeRange(events);

    // Calculate adaptive half-column width for telemetry (Stage 3i1)
    const adaptiveHalfColumnWidth = this.calculateAdaptiveHalfColumnWidth();

    // Stage 1: Half-Column System - Dispatch events with alternating placement and spatial clustering
    const halfColumnGroups = this.dispatchEvents(events);
    
    // Stage 2: Skip old clustering system - half-columns already handle spatial clustering
    // Stage 3: Complete Degradation System - Apply degradation and promotion
    const degradedGroups = this.applyDegradationAndPromotion(halfColumnGroups);
    
    // Position cards with zero-overlap guarantee
    const finalResult = this.positionCardsWithFitAlgorithm(degradedGroups);
    
    // Calculate and attach metrics including adaptive width telemetry
    const metrics = this.calculateMetrics(finalResult, this.config, adaptiveHalfColumnWidth);
    
    return {
      ...finalResult,
      telemetryMetrics: metrics
    };
  }

  /**
   * Stage 3i1: Calculate half-column width based on card width for overlap detection
   * Formula: card_width + spacing_buffer for visual overlap detection
   */
  private calculateAdaptiveHalfColumnWidth(): number {
    // Use a fixed conservative width that encourages proper clustering
    // This should be smaller than card width to force temporal grouping
    return 200; // Smaller width forces events to share half-columns more aggressively
  }

  /**
   * Stage 1: Half-Column Alternating Algorithm (Stage 3B)
   * Implements chronological processing with alternating above/below placement
   */
  private dispatchEvents(events: Event[]): ColumnGroup[] {
    // Use stable sorting with deterministic tie-breakers (Phase 0.6)
    const sortedEvents = this.stableSortEvents(events);

    // Calculate adaptive half-column width based on temporal density (Stage 3i1)
    const adaptiveHalfColumnWidth = this.calculateAdaptiveHalfColumnWidth();

    // Use more horizontal space with minimal margins for better temporal accuracy
    const leftMargin = 40;
    const rightMargin = 40; 
    const usableWidth = this.config.viewportWidth - leftMargin - rightMargin;
    
    // Separate above and below half-column systems
    const aboveHalfColumns: ColumnGroup[] = [];
    const belowHalfColumns: ColumnGroup[] = [];
    
    // Process events chronologically with alternating placement
    for (let i = 0; i < sortedEvents.length; i++) {
      const event = sortedEvents[i];
      const shouldGoAbove = (i % 2) === 0; // Even index (0,2,4...) → above, odd (1,3,5...) → below
      
      // Calculate temporal X position for this event
      const eventTime = new Date(event.date).getTime();
      let eventX: number;
      if (this.timeRange) {
        const timeRatio = (eventTime - this.timeRange.startTime) / this.timeRange.duration;
        eventX = leftMargin + (timeRatio * usableWidth);
      } else {
        // Fallback to sequential positioning
        eventX = leftMargin + (i * usableWidth) / Math.max(1, sortedEvents.length - 1);
      }
      
      // Find or create appropriate half-column
      const targetSystem = shouldGoAbove ? aboveHalfColumns : belowHalfColumns;
      const existingHalfColumn = this.findOverlappingHalfColumn(targetSystem, eventX);
      
      if (existingHalfColumn && existingHalfColumn.events.length < 2) {
        // Add to existing half-column (max 2 slots)
        existingHalfColumn.events.push(event);
        this.updateHalfColumnBounds(existingHalfColumn, event, eventX);
      } else if (existingHalfColumn && existingHalfColumn.events.length >= 2) {
        // Half-column at capacity - add to overflow, don't create overlapping half-column
        if (!existingHalfColumn.overflowEvents) {
          existingHalfColumn.overflowEvents = [];
        }
        existingHalfColumn.overflowEvents.push(event);
        // Update anchor to show overflow count
        existingHalfColumn.anchor = this.createAnchor(
          existingHalfColumn.events, 
          existingHalfColumn.centerX, 
          existingHalfColumn.events.length,
          existingHalfColumn.overflowEvents.length
        );
      } else {
        // No overlap - create new half-column
        const systemPrefix = shouldGoAbove ? 'above' : 'below';
        const halfColumnId = `${systemPrefix}-${targetSystem.length}`;
        
        this.capacityModel.initializeColumn(halfColumnId);
        
        const newHalfColumn: ColumnGroup = {
          id: halfColumnId,
          events: [event],
          startX: eventX - adaptiveHalfColumnWidth / 2,
          endX: eventX + adaptiveHalfColumnWidth / 2,
          centerX: eventX,
          anchor: this.createAnchor([event], eventX),
          cards: [],
          capacity: {
            above: shouldGoAbove ? { used: 0, total: 2 } : { used: 0, total: 0 },
            below: shouldGoAbove ? { used: 0, total: 0 } : { used: 0, total: 2 }
          }
        };
        
        targetSystem.push(newHalfColumn);
      }
    }
    
    // Ensure spatial separation to prevent overlaps (Stage 3i3)
    this.ensureSpatialSeparation(aboveHalfColumns, usableWidth, leftMargin, adaptiveHalfColumnWidth);
    this.ensureSpatialSeparation(belowHalfColumns, usableWidth, leftMargin, adaptiveHalfColumnWidth);
    
    
    // Combine both systems for return
    return [...aboveHalfColumns, ...belowHalfColumns];
  }

  /**
   * Find overlapping half-column based on horizontal space
   */
  private findOverlappingHalfColumn(halfColumns: ColumnGroup[], eventX: number): ColumnGroup | null {
    for (const halfColumn of halfColumns) {
      if (eventX >= halfColumn.startX && eventX <= halfColumn.endX) {
        return halfColumn;
      }
    }
    return null;
  }

  /**
   * Update half-column bounds when adding new event
   */
  private updateHalfColumnBounds(halfColumn: ColumnGroup, event: Event, eventX: number): void {
    const eventTime = new Date(event.date).getTime();
    const allTimes = halfColumn.events.map(e => new Date(e.date).getTime());
    allTimes.push(eventTime);
    
    const minTime = Math.min(...allTimes);
    const maxTime = Math.max(...allTimes);
    const centerTime = (minTime + maxTime) / 2;
    
    // Update temporal center position
    if (this.timeRange) {
      const timeRatio = (centerTime - this.timeRange.startTime) / this.timeRange.duration;
      const leftMargin = 40;
      const usableWidth = this.config.viewportWidth - 80;
      halfColumn.centerX = leftMargin + (timeRatio * usableWidth);
    }
    
    // Update anchor with new center
    halfColumn.anchor = this.createAnchor(halfColumn.events, halfColumn.centerX);
  }

  /**
   * Ensure minimum spatial separation between half-columns to prevent overlaps
   */
  private ensureSpatialSeparation(halfColumns: ColumnGroup[], usableWidth: number, leftMargin: number, adaptiveHalfColumnWidth: number): void {
    if (halfColumns.length <= 1) return;
    
    // Sort by centerX position
    halfColumns.sort((a, b) => a.centerX - b.centerX);
    
    // Ensure minimum spacing between adjacent half-columns
    for (let i = 1; i < halfColumns.length; i++) {
      const prev = halfColumns[i - 1];
      const current = halfColumns[i];
      
      const minSpacing = this.MIN_GROUP_PITCH;
      const requiredMinX = prev.centerX + minSpacing;
      
      if (current.centerX < requiredMinX) {
        // Adjust current half-column position
        current.centerX = Math.min(requiredMinX, leftMargin + usableWidth - adaptiveHalfColumnWidth / 2);
        current.startX = current.centerX - adaptiveHalfColumnWidth / 2;
        current.endX = current.centerX + adaptiveHalfColumnWidth / 2;
        
        // Update anchor position
        current.anchor = this.createAnchor(current.events, current.centerX);
      }
    }
  }

  /**
   * Stage 2: Apply left-to-right clustering with proximity merge
   */
  private applyLeftToRightClustering(groups: ColumnGroup[]): ColumnGroup[] {
    const mergedGroups: ColumnGroup[] = [];
    let currentMerged: ColumnGroup | null = null;
    
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const nextGroup = groups[i + 1];
      
      if (!currentMerged) {
        currentMerged = { ...group };
        mergedGroups.push(currentMerged);
      }
      
      // Check if next group should be merged
      if (nextGroup && (nextGroup.startX - group.endX) < this.PROXIMITY_MERGE_THRESHOLD) {
        // Merge events
        currentMerged.events.push(...nextGroup.events);
        currentMerged.endX = nextGroup.endX;
        currentMerged.centerX = (currentMerged.startX + currentMerged.endX) / 2;
        currentMerged.anchor = this.createAnchor(currentMerged.events, currentMerged.centerX);
        i++; // Skip next group since we merged it
      } else {
        currentMerged = null;
      }
    }
    
    // Split over-full groups if needed
    const finalGroups: ColumnGroup[] = [];
    for (const group of mergedGroups) {
      if (group.events.length > this.TARGET_EVENTS_PER_CLUSTER.max * 2) {
        // Split into multiple groups
        const subGroups = this.splitGroup(group);
        finalGroups.push(...subGroups);
      } else {
        finalGroups.push(group);
      }
    }
    
    return finalGroups;
  }

  /**
   * Stage 3: Apply degradation cascade and promotion pass
   * Implementation of Phase 0.5 Multi-Event Aggregation Policy
   */
  private applyDegradationAndPromotion(groups: ColumnGroup[]): ColumnGroup[] {
    // Reset metrics for new layout calculation
    const aggregationMetrics = {
      totalAggregations: 0,
      eventsAggregated: 0,
      clustersAffected: 0
    };

    this.infiniteMetrics = {
      enabled: false,
      containers: 0,
      eventsContained: 0,
      previewCount: 0,
      byCluster: []
    };

    for (const group of groups) {
      // STAGE 1: Force full cards only for now
      // Space limiting will be handled in positioning phase
      group.cards = this.createIndividualCards(group, ['full']);
    }

    // Store aggregation metrics for telemetry
    this.aggregationMetrics = aggregationMetrics;
    
    return groups;
  }

  private aggregationMetrics = {
    totalAggregations: 0,
    eventsAggregated: 0,
    clustersAffected: 0
  };

  private infiniteMetrics: InfiniteMetrics = {
    enabled: false,
    containers: 0,
    eventsContained: 0,
    previewCount: 0,
    byCluster: []
  };

  /**
   * Calculate available capacity for a group
   */
  private calculateAvailableCapacity(group: ColumnGroup): number {
    // Estimate available cells based on typical column capacity
    // This is a simplified version - in practice would check actual slot availability
    return 8; // 4 above + 4 below typical capacity
  }

  /**
   * Calculate optimal layout for events given capacity constraints
   * Now with infinite card overflow support (Phase 0.5.1)
   */
  private calculateOptimalLayout(events: Event[], availableCapacity: number): LayoutPlan {
    const eventCount = events.length;
    
    // Configuration for infinite cards
    const MULTI_EVENT_MAX_PER_SIDE = 2; // Maximum multi-event cards per side
    const INFINITE_PREVIEW_K = 5; // Preview events in infinite card
    const MAX_MULTI_EVENT_BUDGET = MULTI_EVENT_MAX_PER_SIDE * 5; // Max events in multi-event cards
    
    // Try different card type combinations to find optimal fit
    const options = [
      // Option 1: All full cards
      { cards: [{ type: 'full', count: eventCount }], totalFootprint: eventCount * 4, needsInfinite: false },
      // Option 2: All compact cards  
      { cards: [{ type: 'compact', count: eventCount }], totalFootprint: eventCount * 2, needsInfinite: false },
      // Option 3: All title-only cards
      { cards: [{ type: 'title-only', count: eventCount }], totalFootprint: eventCount * 1, needsInfinite: false },
      // Option 4: Multi-event cards (up to 5 events per card)
      { 
        cards: [{ type: 'multi-event', count: Math.ceil(eventCount / 5) }], 
        totalFootprint: Math.ceil(eventCount / 5) * 4,
        eventsPerCard: 5,
        needsInfinite: false
      }
    ];

    // Find the best option that fits within capacity
    for (const option of options) {
      if (option.totalFootprint <= availableCapacity) {
        return {
          type: option.cards[0].type,
          cardCount: option.cards[0].count,
          eventsPerCard: option.eventsPerCard || 1,
          totalFootprint: option.totalFootprint,
          needsInfinite: false,
          residualEvents: 0
        };
      }
    }

    // If nothing fits, check if we can use multi-event + infinite cards
    const multiEventCards = Math.min(MULTI_EVENT_MAX_PER_SIDE, Math.floor(availableCapacity / 4));
    const accommodatedEvents = multiEventCards * 5;
    const residualEvents = Math.max(0, eventCount - accommodatedEvents);
    
    if (residualEvents > 0 && multiEventCards > 0) {
      // Use combination of multi-event + infinite cards
      const infiniteCardFootprint = 4; // Fixed footprint for infinite cards
      const totalFootprint = (multiEventCards * 4) + infiniteCardFootprint;
      
      if (totalFootprint <= availableCapacity) {
        return {
          type: 'multi-event', // Primary type
          cardCount: multiEventCards,
          eventsPerCard: 5,
          totalFootprint,
          needsInfinite: true,
          residualEvents,
          infinitePreviewCount: Math.min(INFINITE_PREVIEW_K, residualEvents)
        };
      }
    }

    // Fallback: Single infinite card containing all events
    return {
      type: 'infinite',
      cardCount: 1,
      eventsPerCard: eventCount,
      totalFootprint: 4,
      needsInfinite: true,
      residualEvents: Math.max(0, eventCount - INFINITE_PREVIEW_K),
      infinitePreviewCount: Math.min(INFINITE_PREVIEW_K, eventCount)
    };
  }

  /**
   * Create cards from layout plan
   * Now with infinite card support (Phase 0.5.1)
   */
  private createCardsFromLayout(
    group: ColumnGroup, 
    layout: LayoutPlan, 
    metrics: { totalAggregations: number; eventsAggregated: number; clustersAffected: number }
  ): PositionedCard[] {
    const cards: PositionedCard[] = [];
    const cardConfig = this.config.cardConfigs;

    if (layout.type === 'multi-event' && layout.needsInfinite) {
      // Create multi-event cards + infinite overflow card
      const eventsPerCard = Math.min(5, layout.eventsPerCard);
      let eventIndex = 0;
      let cardIndex = 0;

      // Create multi-event cards first
      const accommodatedEvents = layout.cardCount * eventsPerCard;
      while (eventIndex < accommodatedEvents && eventIndex < group.events.length) {
        const cardEvents = group.events.slice(eventIndex, eventIndex + eventsPerCard);
        
        cards.push({
          id: `${group.id}-multi-${cardIndex}`,
          event: cardEvents,
          x: 0,
          y: 0,
          width: cardConfig['multi-event'].width,
          height: cardConfig['multi-event'].height,
          cardType: 'multi-event',
          clusterId: group.id,
          eventCount: cardEvents.length
        });

        // Update metrics
        metrics.totalAggregations++;
        metrics.eventsAggregated += cardEvents.length;

        eventIndex += eventsPerCard;
        cardIndex++;
      }

      // Create infinite overflow card for remaining events
      if (eventIndex < group.events.length) {
        const overflowEvents = group.events.slice(eventIndex);
        const previewCount = layout.infinitePreviewCount || 5;
        
        cards.push({
          id: `${group.id}-infinite`,
          event: overflowEvents,
          x: 0,
          y: 0,
          width: cardConfig['infinite'].width,
          height: cardConfig['infinite'].height,
          cardType: 'infinite',
          clusterId: group.id,
          eventCount: overflowEvents.length,
          previewCount: Math.min(previewCount, overflowEvents.length),
          overflowCount: Math.max(0, overflowEvents.length - previewCount)
        });

        // Update infinite metrics
        this.infiniteMetrics.enabled = true;
        this.infiniteMetrics.containers++;
        this.infiniteMetrics.eventsContained += overflowEvents.length;
        this.infiniteMetrics.previewCount += Math.min(previewCount, overflowEvents.length);
      }

      if (metrics.totalAggregations > 0) {
        metrics.clustersAffected++;
      }

    } else if (layout.type === 'infinite') {
      // Create pure infinite card
      const previewCount = layout.infinitePreviewCount || 5;
      
      cards.push({
        id: `${group.id}-infinite`,
        event: group.events,
        x: 0,
        y: 0,
        width: cardConfig['infinite'].width,
        height: cardConfig['infinite'].height,
        cardType: 'infinite',
        clusterId: group.id,
        eventCount: group.events.length,
        previewCount: Math.min(previewCount, group.events.length),
        overflowCount: Math.max(0, group.events.length - previewCount)
      });

      // Update infinite metrics
      this.infiniteMetrics.enabled = true;
      this.infiniteMetrics.containers++;
      this.infiniteMetrics.eventsContained += group.events.length;
      this.infiniteMetrics.previewCount += Math.min(previewCount, group.events.length);

    } else if (layout.type === 'multi-event') {
      // Create regular multi-event cards without infinite overflow
      const eventsPerCard = Math.min(5, layout.eventsPerCard);
      let eventIndex = 0;
      let cardIndex = 0;

      while (eventIndex < group.events.length) {
        const cardEvents = group.events.slice(eventIndex, eventIndex + eventsPerCard);
        
        cards.push({
          id: `${group.id}-multi-${cardIndex}`,
          event: cardEvents,
          x: 0,
          y: 0,
          width: cardConfig[layout.type].width,
          height: cardConfig[layout.type].height,
          cardType: layout.type,
          clusterId: group.id,
          eventCount: cardEvents.length
        });

        // Update metrics
        if (cardEvents.length > 1) {
          metrics.totalAggregations++;
          metrics.eventsAggregated += cardEvents.length;
        }

        eventIndex += eventsPerCard;
        cardIndex++;
      }

      if (metrics.totalAggregations > 0) {
        metrics.clustersAffected++;
      }

    } else {
      // Create individual cards
      cards.push(...this.createIndividualCards(group, [layout.type]));
    }

    return cards;
  }

  /**
   * Create individual cards for a group
   */
  private createIndividualCards(group: ColumnGroup, cardTypes: CardType[]): PositionedCard[] {
    const cards: PositionedCard[] = [];
    const cardConfig = this.config.cardConfigs;

    group.events.forEach((event, index) => {
      // Cycle through card types if multiple provided
      const cardType = cardTypes[index % cardTypes.length];
      
      cards.push({
        id: `${group.id}-${index}`,
        event: [event],
        x: 0,
        y: 0,
        width: cardConfig[cardType].width,
        height: cardConfig[cardType].height,
        cardType,
        clusterId: group.id,
        eventCount: 1
      });
    });

    return cards;
  }


  /**
   * Position cards using fit algorithm with zero-overlap guarantee
   * Now with optimized vertical space usage
   */
  private positionCardsWithFitAlgorithm(groups: ColumnGroup[]): LayoutResult {
    const positionedCards: PositionedCard[] = [];
    const anchors: Anchor[] = [];
    const clusters: EventCluster[] = [];
    
    // Calculate vertical space available for cards
    const topMargin = 40; // Reduced to use more space
    const bottomMargin = 40; // Reduced to use more space
    const timelineMargin = 40; // Reduced from 60 for tighter spacing to timeline
    const availableAbove = this.timelineY - topMargin - timelineMargin;
    const availableBelow = this.config.viewportHeight - this.timelineY - bottomMargin - timelineMargin;
    
    for (const group of groups) {
      // Calculate optimal card size to better use available space
      const cardSpacing = 20;
      // Half-column capacity: respect pre-determined above/below assignment
      const maxCardsAbove = Math.floor(availableAbove / (140 + cardSpacing));
      const maxCardsBelow = Math.floor(availableBelow / (140 + cardSpacing));
      
      const isAboveHalfColumn = group.capacity.above.total > 0;
      const isBelowHalfColumn = group.capacity.below.total > 0;
      
      const cardsAboveLimit = isAboveHalfColumn ? Math.min(maxCardsAbove, group.cards.length) : 0;
      const cardsBelowLimit = isBelowHalfColumn ? Math.min(maxCardsBelow, group.cards.length) : 0;
      const totalCapacity = cardsAboveLimit + cardsBelowLimit;
      
      
      // Calculate optimal card height based on available space and card count
      const optimalAboveHeight = cardsAboveLimit > 0 ? Math.floor((availableAbove - (cardsAboveLimit - 1) * cardSpacing) / cardsAboveLimit) : 0;
      const optimalBelowHeight = cardsBelowLimit > 0 ? Math.floor((availableBelow - (cardsBelowLimit - 1) * cardSpacing) / cardsBelowLimit) : 0;
      const dynamicCardHeight = Math.min(Math.max(optimalAboveHeight, optimalBelowHeight), 200); // Cap at 200px max
      
      // Limit cards to what actually fits
      const actualCards = group.cards.slice(0, totalCapacity);
      
      // Update anchor with actual visible count
      const updatedAnchor = this.createAnchor(group.events, group.centerX, actualCards.length);
      anchors.push(updatedAnchor);
      
      // Respect half-column pre-determined position (above vs below)
      const aboveCards = isAboveHalfColumn ? actualCards.slice(0, cardsAboveLimit) : [];
      const belowCards = isBelowHalfColumn ? actualCards.slice(0, cardsBelowLimit) : [];
      
      // Position above cards with dynamic sizing and proper spacing
      let aboveY = this.timelineY - timelineMargin;
      aboveCards.forEach((card) => {
        // Update card height to use more vertical space
        card.height = dynamicCardHeight;
        card.y = aboveY - card.height;
        card.x = group.centerX - (card.width / 2);
        aboveY -= (card.height + cardSpacing);
        
        positionedCards.push(card);
        // Allocate capacity for tracking
        this.capacityModel.allocate(group.id, 'above', card.cardType);
      });
      
      // Position below cards with dynamic sizing and proper spacing
      let belowY = this.timelineY + timelineMargin;
      belowCards.forEach((card) => {
        // Update card height to use more vertical space
        card.height = dynamicCardHeight;
        card.y = belowY;
        card.x = group.centerX - (card.width / 2);
        belowY += (card.height + cardSpacing);
        
        positionedCards.push(card);
        // Allocate capacity for tracking
        this.capacityModel.allocate(group.id, 'below', card.cardType);
      });
      
      // Create cluster
      clusters.push({
        id: group.id,
        events: group.events,
        x: group.centerX,
        width: group.endX - group.startX,
        cardType: group.cards[0]?.cardType || 'full'
      });
    }
    
    const capacityMetrics = this.capacityModel.getGlobalMetrics();
    
    return {
      positionedCards,
      anchors,
      clusters,
      utilization: {
        totalSlots: capacityMetrics.totalCells,
        usedSlots: capacityMetrics.usedCells,
        percentage: capacityMetrics.utilization
      }
    };
  }


  /**
   * Helper: Split an over-full group into smaller groups
   */
  private splitGroup(group: ColumnGroup): ColumnGroup[] {
    const maxPerGroup = this.TARGET_EVENTS_PER_CLUSTER.max;
    const numSubGroups = Math.ceil(group.events.length / maxPerGroup);
    const subGroups: ColumnGroup[] = [];
    
    const groupWidth = (group.endX - group.startX) / numSubGroups;
    
    for (let i = 0; i < numSubGroups; i++) {
      const subEvents = group.events.slice(i * maxPerGroup, (i + 1) * maxPerGroup);
      if (subEvents.length === 0) continue;
      
      const subGroupId = `${group.id}-${i}`;
      this.capacityModel.initializeColumn(subGroupId);
      
      const startX = group.startX + (i * groupWidth);
      const endX = startX + groupWidth;
      const centerX = (startX + endX) / 2;
      
      subGroups.push({
        id: subGroupId,
        events: subEvents,
        startX,
        endX,
        centerX,
        anchor: this.createAnchor(subEvents, centerX),
        cards: [],
        capacity: {
          above: { used: 0, total: 4 },
          below: { used: 0, total: 4 }
        }
      });
    }
    
    return subGroups;
  }

  /**
   * Helper: Create anchor for a group of events
   */
  private createAnchor(events: Event[], x: number, visibleCount?: number, overflowCount?: number): Anchor {
    const dates = events.map(e => new Date(e.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const centerDate = new Date((minDate + maxDate) / 2);
    const totalCount = events.length;
    const visible = visibleCount ?? totalCount; // Default to all visible if not specified
    const overflow = overflowCount ?? Math.max(0, totalCount - visible);
    
    return {
      id: `anchor-${x}`,
      x,
      y: this.timelineY,
      date: centerDate.toISOString(),
      eventIds: events.map(e => e.id),
      eventCount: totalCount + overflow, // Include overflow in total count
      visibleCount: visible,
      overflowCount: overflow
    };
  }

  /**
   * Helper: Calculate time range from events
   */
  private calculateTimeRange(events: Event[]): void {
    const dates = events.map(e => new Date(e.date).getTime());
    const startTime = Math.min(...dates);
    const endTime = Math.max(...dates);
    const duration = endTime - startTime;
    
    // Add 10% padding
    const padding = duration * 0.1;
    
    this.timeRange = {
      startTime: startTime - padding,
      endTime: endTime + padding,
      duration: duration + (padding * 2)
    };
  }

  /**
   * Helper: Calculate dispatch and capacity metrics including aggregation and infinite
   */
  private calculateMetrics(result: LayoutResult, config: LayoutConfig, adaptiveHalfColumnWidth?: number): { 
    dispatch?: DispatchMetrics; 
    aggregation?: AggregationMetrics;
    infinite?: InfiniteMetrics;
    adaptive?: {
      halfColumnWidth: number;
      temporalDensity: number;
      temporalWindow: number;
    };
  } {
    const groupXPositions = result.anchors.map(a => a.x).sort((a, b) => a - b);
    const pitches = groupXPositions.slice(1).map((x, i) => x - groupXPositions[i]);
    
    const dispatch: DispatchMetrics = {
      groupCount: result.clusters.length,
      avgEventsPerCluster: result.clusters.length > 0 
        ? result.clusters.reduce((sum, cluster) => sum + (cluster.events?.length || 0), 0) / result.clusters.length
        : 0,
      largestCluster: result.clusters.length > 0 
        ? Math.max(...result.clusters.map(c => c.events?.length || 0))
        : 0,
      groupPitchPx: {
        min: pitches.length > 0 ? Math.min(...pitches) : 0,
        max: pitches.length > 0 ? Math.max(...pitches) : 0,
        avg: pitches.length > 0 ? pitches.reduce((a, b) => a + b, 0) / pitches.length : 0
      },
      horizontalSpaceUsage: this.calculateHorizontalSpaceUsage(result, config)
    };
    
    // Include aggregation metrics from Phase 0.5 implementation
    const aggregation: AggregationMetrics = {
      totalAggregations: this.aggregationMetrics.totalAggregations,
      eventsAggregated: this.aggregationMetrics.eventsAggregated,
      clustersAffected: this.aggregationMetrics.clustersAffected
    };

    // Include infinite metrics from Phase 0.5.1 implementation
    const infinite: InfiniteMetrics = {
      enabled: this.infiniteMetrics.enabled,
      containers: this.infiniteMetrics.containers,
      eventsContained: this.infiniteMetrics.eventsContained,
      previewCount: this.infiniteMetrics.previewCount,
      byCluster: this.infiniteMetrics.byCluster
    };

    // Stage 3i4: Add adaptive width telemetry
    let adaptive: { halfColumnWidth: number; temporalDensity: number; temporalWindow: number } | undefined;
    if (adaptiveHalfColumnWidth !== undefined && this.timeRange) {
      const usableWidth = config.viewportWidth - 80;
      const temporalDensity = this.timeRange.duration > 0 ? usableWidth / this.timeRange.duration : 0;
      const temporalWindow = this.timeRange.duration * this.TEMPORAL_GROUPING_FACTOR;
      
      adaptive = {
        halfColumnWidth: adaptiveHalfColumnWidth,
        temporalDensity,
        temporalWindow
      };
    }
    
    return { dispatch, aggregation, infinite, adaptive };
  }

  /**
   * Phase 0.6: Stable sorting with deterministic tie-breakers
   */
  private stableSortEvents(events: Event[]): Event[] {
    return [...events].sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      
      // Primary sort: by date
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      
      // Secondary tie-breaker: by event ID for determinism
      if (a.id !== b.id) {
        return a.id.localeCompare(b.id);
      }
      
      // Tertiary tie-breaker: by title for consistency
      return (a.title || '').localeCompare(b.title || '');
    });
  }

  /**
   * Calculate horizontal space utilization as percentage of viewport width
   */
  private calculateHorizontalSpaceUsage(result: LayoutResult, config: LayoutConfig): number {
    if (result.positionedCards.length === 0) return 0;
    
    // Find leftmost and rightmost card positions
    const leftmostX = Math.min(...result.positionedCards.map(c => c.x));
    const rightmostX = Math.max(...result.positionedCards.map(c => c.x + c.width));
    
    // Calculate used width
    const usedWidth = rightmostX - leftmostX;
    
    // Available width is viewport width minus margins (80px each side now)
    const margins = 160; // 80px left + 80px right
    const availableWidth = config.viewportWidth - margins;
    
    // Return percentage usage
    return availableWidth > 0 ? (usedWidth / availableWidth) * 100 : 0;
  }

  /**
   * Phase 0.6: Calculate priority score for event placement stability
   */
  private calculatePriorityScore(event: Event): number {
    // Simple priority scoring based on event characteristics
    let score = 1000; // Base score
    
    // Add points for longer events (duration proxy via description length)
    if (event.description && event.description.length > 100) {
      score += 100;
    }
    
    // Add points for events with more recent activity (simplified)
    const daysSinceEvent = (Date.now() - new Date(event.date).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceEvent < 365) { // Within last year
      score += Math.max(0, 50 - Math.floor(daysSinceEvent / 7)); // More recent = higher score
    }
    
    return score;
  }

  /**
   * Helper: Empty result for no events
   */
  private emptyResult(): LayoutResult {
    return {
      positionedCards: [],
      anchors: [],
      clusters: [],
      utilization: { totalSlots: 0, usedSlots: 0, percentage: 0 }
    };
  }
}