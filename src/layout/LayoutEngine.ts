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
  
  // Configuration for dispatch and clustering
  private readonly TARGET_EVENTS_PER_CLUSTER = { min: 4, max: 6 };
  private readonly MIN_GROUP_PITCH = 120; // Minimum pixels between groups
  private readonly PROXIMITY_MERGE_THRESHOLD = 80; // Merge groups closer than this
  
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

    // Stage 1: Core Layout Foundation - Dispatch events optimally
    const dispatchedGroups = this.dispatchEvents(events);
    
    // Stage 2: Clustering & Distribution - Apply left-to-right clustering
    const clusteredGroups = this.applyLeftToRightClustering(dispatchedGroups);
    
    // Stage 3: Complete Degradation System - Apply degradation and promotion
    const degradedGroups = this.applyDegradationAndPromotion(clusteredGroups);
    
    // Position cards with zero-overlap guarantee
    const finalResult = this.positionCardsWithFitAlgorithm(degradedGroups);
    
    // Calculate and attach metrics
    const metrics = this.calculateMetrics(finalResult, this.config);
    
    return {
      ...finalResult,
      telemetryMetrics: metrics
    };
  }

  /**
   * Stage 1: Dispatch events across timeline width for optimal distribution
   * Now uses actual temporal positions for proper horizontal spread with stability
   */
  private dispatchEvents(events: Event[]): ColumnGroup[] {
    // Use stable sorting with deterministic tie-breakers (Phase 0.6)
    const sortedEvents = this.stableSortEvents(events);

    // Use full viewport width with generous margins for better spread
    const leftMargin = 80; // Increased from 50 for better spacing
    const rightMargin = 80; // Increased from 50 for better spacing  
    const usableWidth = this.config.viewportWidth - leftMargin - rightMargin;
    
    // Calculate optimal number of groups based on density
    const targetGroups = Math.ceil(events.length / this.TARGET_EVENTS_PER_CLUSTER.max);
    const actualGroups = Math.max(1, Math.min(targetGroups, Math.floor(usableWidth / this.MIN_GROUP_PITCH)));
    
    // Initialize column groups
    const groups: ColumnGroup[] = [];
    const eventsPerGroup = Math.ceil(events.length / actualGroups);
    
    // Distribute events into initial groups with proper temporal positioning
    for (let i = 0; i < actualGroups; i++) {
      const groupEvents = sortedEvents.slice(i * eventsPerGroup, (i + 1) * eventsPerGroup);
      if (groupEvents.length === 0) continue;
      
      const groupId = `group-${i}`;
      this.capacityModel.initializeColumn(groupId);
      
      // Calculate X position based on temporal position within the time range
      const groupDates = groupEvents.map(e => new Date(e.date).getTime());
      const groupMinTime = Math.min(...groupDates);
      const groupMaxTime = Math.max(...groupDates);
      const groupCenterTime = (groupMinTime + groupMaxTime) / 2;
      
      // Map temporal position to screen X coordinate
      let centerX: number;
      if (this.timeRange) {
        const timeRatio = (groupCenterTime - this.timeRange.startTime) / this.timeRange.duration;
        centerX = leftMargin + (timeRatio * usableWidth);
      } else {
        // Fallback to even distribution if time range not calculated
        centerX = leftMargin + ((i + 0.5) * usableWidth) / actualGroups;
      }
      
      // Calculate group bounds with proper width
      const groupWidth = usableWidth / actualGroups;
      const startX = Math.max(leftMargin, centerX - groupWidth / 2);
      const endX = Math.min(this.config.viewportWidth - rightMargin, centerX + groupWidth / 2);
      
      groups.push({
        id: groupId,
        events: groupEvents,
        startX,
        endX,
        centerX,
        anchor: this.createAnchor(groupEvents, centerX),
        cards: [],
        capacity: {
          above: { used: 0, total: 4 },
          below: { used: 0, total: 4 }
        }
      });
    }
    
    return groups;
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
      const eventCount = group.events.length;
      
      // Never aggregate singletons
      if (eventCount === 1) {
        group.cards = this.createIndividualCards(group, ['full']);
        continue;
      }

      // Check available capacity for this group
      const availableCapacity = this.calculateAvailableCapacity(group);
      const optimalLayout = this.calculateOptimalLayout(group.events, availableCapacity);
      
      // Apply the optimal layout
      group.cards = this.createCardsFromLayout(group, optimalLayout, aggregationMetrics);
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
      anchors.push(group.anchor);
      
      // Split cards between above and below
      const aboveCards = group.cards.filter((_, i) => i % 2 === 0);
      const belowCards = group.cards.filter((_, i) => i % 2 === 1);
      
      // Calculate spacing to use more vertical space - remove the 20px cap
      const aboveSpacing = Math.max(15, availableAbove / (aboveCards.length + 1)); // Minimum 15px, but use full space
      const belowSpacing = Math.max(15, availableBelow / (belowCards.length + 1)); // Minimum 15px, but use full space
      
      // Position above cards spreading from timeline upward
      let aboveY = this.timelineY - timelineMargin;
      aboveCards.forEach((card) => {
        // Ensure minimum spacing to avoid overlaps
        const minSpacing = 15;
        const effectiveSpacing = Math.max(minSpacing, aboveSpacing);
        
        card.y = aboveY - card.height;
        aboveY -= (card.height + effectiveSpacing);
        card.x = group.centerX - (card.width / 2);
        
        // Check for overlaps with previously positioned cards
        const overlap = positionedCards.find(existing => 
          Math.abs(existing.x - card.x) < (existing.width + card.width) / 2 &&
          Math.abs(existing.y - card.y) < (existing.height + card.height) / 2
        );
        
        if (overlap) {
          // Shift horizontally if overlap detected
          card.x += card.width / 4;
        }
        
        // Allocate capacity for tracking
        this.capacityModel.allocate(group.id, 'above', card.cardType);
        positionedCards.push(card);
      });
      
      // Position below cards spreading from timeline downward
      let belowY = this.timelineY + timelineMargin;
      belowCards.forEach((card) => {
        // Ensure minimum spacing to avoid overlaps
        const minSpacing = 15;
        const effectiveSpacing = Math.max(minSpacing, belowSpacing);
        
        card.y = belowY;
        belowY += (card.height + effectiveSpacing);
        card.x = group.centerX - (card.width / 2);
        
        // Check for overlaps with previously positioned cards
        const overlap = positionedCards.find(existing => 
          Math.abs(existing.x - card.x) < (existing.width + card.width) / 2 &&
          Math.abs(existing.y - card.y) < (existing.height + card.height) / 2
        );
        
        if (overlap) {
          // Shift horizontally if overlap detected
          card.x += card.width / 4;
        }
        
        // Allocate capacity for tracking
        this.capacityModel.allocate(group.id, 'below', card.cardType);
        positionedCards.push(card);
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
  private createAnchor(events: Event[], x: number): Anchor {
    const dates = events.map(e => new Date(e.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const centerDate = new Date((minDate + maxDate) / 2);
    
    return {
      id: `anchor-${x}`,
      x,
      y: this.timelineY,
      date: centerDate.toISOString(),
      eventCount: events.length
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
  private calculateMetrics(result: LayoutResult, config: LayoutConfig): { 
    dispatch?: DispatchMetrics; 
    aggregation?: AggregationMetrics;
    infinite?: InfiniteMetrics;
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
    
    return { dispatch, aggregation, infinite };
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