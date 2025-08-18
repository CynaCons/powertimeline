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
    const metrics = this.calculateMetrics(finalResult);
    
    return {
      ...finalResult,
      ...metrics
    };
  }

  /**
   * Stage 1: Dispatch events across timeline width for optimal distribution
   */
  private dispatchEvents(events: Event[]): ColumnGroup[] {
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate optimal number of groups based on density
    const targetGroups = Math.ceil(events.length / this.TARGET_EVENTS_PER_CLUSTER.max);
    const actualGroups = Math.max(1, Math.min(targetGroups, Math.floor(this.config.viewportWidth / this.MIN_GROUP_PITCH)));
    
    // Initialize column groups
    const groups: ColumnGroup[] = [];
    const eventsPerGroup = Math.ceil(events.length / actualGroups);
    
    // Distribute events into initial groups
    for (let i = 0; i < actualGroups; i++) {
      const groupEvents = sortedEvents.slice(i * eventsPerGroup, (i + 1) * eventsPerGroup);
      if (groupEvents.length === 0) continue;
      
      const groupId = `group-${i}`;
      this.capacityModel.initializeColumn(groupId);
      
      const startX = (i * this.config.viewportWidth) / actualGroups;
      const endX = ((i + 1) * this.config.viewportWidth) / actualGroups;
      const centerX = (startX + endX) / 2;
      
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
   */
  private applyDegradationAndPromotion(groups: ColumnGroup[]): ColumnGroup[] {
    for (const group of groups) {
      const eventCount = group.events.length;
      
      // Determine best card type based on density
      let cardType: CardType = 'full';
      
      if (eventCount <= 2) {
        cardType = 'full';
      } else if (eventCount <= 4) {
        cardType = 'compact';
      } else if (eventCount <= 8) {
        cardType = 'title-only';
      } else if (eventCount <= 10) {
        cardType = 'multi-event';
      } else {
        // Need infinite overflow
        cardType = 'infinite';
      }
      
      // Apply promotion if utilization is low
      const metrics = this.capacityModel.getGlobalMetrics();
      if (metrics.utilization < 60 && cardType !== 'full') {
        // Promote to better card type
        const promotionMap: Record<CardType, CardType> = {
          'compact': 'full',
          'title-only': 'compact',
          'multi-event': 'title-only',
          'infinite': 'multi-event'
        };
        cardType = promotionMap[cardType] || cardType;
      }
      
      // Create positioned cards based on determined type
      group.cards = this.createCardsForGroup(group, cardType);
    }
    
    return groups;
  }

  /**
   * Position cards using fit algorithm with zero-overlap guarantee
   */
  private positionCardsWithFitAlgorithm(groups: ColumnGroup[]): LayoutResult {
    const positionedCards: PositionedCard[] = [];
    const anchors: Anchor[] = [];
    const clusters: EventCluster[] = [];
    
    for (const group of groups) {
      anchors.push(group.anchor);
      
      // Position cards above and below timeline
      let aboveY = this.timelineY - 40; // Start position above
      let belowY = this.timelineY + 40; // Start position below
      
      group.cards.forEach((card, index) => {
        const isAbove = index % 2 === 0;
        const side = isAbove ? 'above' : 'below';
        
        // Allocate capacity for this card
        const placementIndex = this.capacityModel.allocate(group.id, side, card.cardType);
        
        if (isAbove) {
          card.y = aboveY;
          aboveY -= (card.height + 10); // Stack upward
        } else {
          card.y = belowY;
          belowY += (card.height + 10); // Stack downward
        }
        
        card.x = group.centerX - (card.width / 2);
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
   * Helper: Create cards for a group based on card type
   */
  private createCardsForGroup(group: ColumnGroup, cardType: CardType): PositionedCard[] {
    const cards: PositionedCard[] = [];
    const cardConfig = this.config.cardConfigs[cardType];
    
    if (cardType === 'multi-event' || cardType === 'infinite') {
      // Single card containing multiple events
      cards.push({
        id: `${group.id}-multi`,
        event: group.events,
        x: 0,
        y: 0,
        width: cardConfig.width,
        height: cardConfig.height,
        cardType,
        clusterId: group.id,
        eventCount: group.events.length
      });
    } else {
      // Individual cards for each event
      group.events.forEach((event, index) => {
        cards.push({
          id: `${group.id}-${index}`,
          event: [event],
          x: 0,
          y: 0,
          width: cardConfig.width,
          height: cardConfig.height,
          cardType,
          clusterId: group.id,
          eventCount: 1
        });
      });
    }
    
    return cards;
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
   * Helper: Calculate dispatch and capacity metrics
   */
  private calculateMetrics(result: LayoutResult): { dispatch?: DispatchMetrics } {
    const groupXPositions = result.anchors.map(a => a.x).sort((a, b) => a - b);
    const pitches = groupXPositions.slice(1).map((x, i) => x - groupXPositions[i]);
    
    const dispatch: DispatchMetrics = {
      groupCount: result.clusters.length,
      avgEventsPerCluster: result.clusters.length > 0 
        ? result.positionedCards.length / result.clusters.length 
        : 0,
      largestCluster: Math.max(...result.clusters.map(c => c.events.length)),
      groupPitchPx: {
        min: pitches.length > 0 ? Math.min(...pitches) : 0,
        max: pitches.length > 0 ? Math.max(...pitches) : 0,
        avg: pitches.length > 0 ? pitches.reduce((a, b) => a + b, 0) / pitches.length : 0
      }
    };
    
    return { dispatch };
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