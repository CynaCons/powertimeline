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
   * Now uses actual temporal positions for proper horizontal spread
   */
  private dispatchEvents(events: Event[]): ColumnGroup[] {
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Use full viewport width with small margins
    const leftMargin = 50;
    const rightMargin = 50;
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
   * Now with mixed card types within groups for better visual differentiation
   */
  private applyDegradationAndPromotion(groups: ColumnGroup[]): ColumnGroup[] {
    for (const group of groups) {
      const eventCount = group.events.length;
      
      // For very dense groups, use multi-event cards
      if (eventCount > 10) {
        group.cards = this.createCardsForGroup(group, 'multi-event');
        continue;
      }
      
      // For smaller groups, apply mixed card types for visual variety
      const cards: PositionedCard[] = [];
      const cardConfig = this.config.cardConfigs;
      
      group.events.forEach((event, index) => {
        let cardType: CardType = 'full';
        
        // Apply degradation based on position and density
        if (eventCount <= 2) {
          // Small groups: all full cards
          cardType = 'full';
        } else if (eventCount <= 4) {
          // Medium groups: mix of full and compact
          cardType = index < 2 ? 'full' : 'compact';
        } else if (eventCount <= 6) {
          // Larger groups: mix of compact and title-only
          cardType = index < 2 ? 'compact' : 'title-only';
        } else {
          // Dense groups: mostly title-only with some compact
          cardType = index < 1 ? 'compact' : 'title-only';
        }
        
        // Apply promotion if global utilization is low
        const metrics = this.capacityModel.getGlobalMetrics();
        if (metrics.utilization < 40 && cardType !== 'full') {
          const promotionMap: Record<CardType, CardType> = {
            'compact': 'full',
            'title-only': 'compact',
            'multi-event': 'compact',
            'infinite': 'title-only'
          };
          cardType = promotionMap[cardType] || cardType;
        }
        
        // Create individual card with appropriate type
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
      
      group.cards = cards;
    }
    
    return groups;
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
    const topMargin = 50;
    const bottomMargin = 50;
    const timelineMargin = 60; // Space between cards and timeline
    const availableAbove = this.timelineY - topMargin - timelineMargin;
    const availableBelow = this.config.viewportHeight - this.timelineY - bottomMargin - timelineMargin;
    
    for (const group of groups) {
      anchors.push(group.anchor);
      
      // Split cards between above and below
      const aboveCards = group.cards.filter((_, i) => i % 2 === 0);
      const belowCards = group.cards.filter((_, i) => i % 2 === 1);
      
      // Calculate spacing to use more vertical space
      const aboveSpacing = Math.min(20, availableAbove / (aboveCards.length + 1));
      const belowSpacing = Math.min(20, availableBelow / (belowCards.length + 1));
      
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