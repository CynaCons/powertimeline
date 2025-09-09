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
import { CapacityModel } from './CapacityModel';

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
  
  // View window context for overflow filtering
  private currentTimeWindow: { visibleStartTime: number; visibleEndTime: number } | null = null;
  
  // Configuration for spatial-based clustering (Stage 3B)
  private readonly TEMPORAL_GROUPING_FACTOR = 0.07; // 7% of timeline range for grouping window
  
  constructor(config: LayoutConfig) {
    this.config = config;
    this.timelineY = config.timelineY || config.viewportHeight / 2;
    this.capacityModel = new CapacityModel(config.viewportHeight);
  }

  /**
   * Main layout function implementing Stage 1-3 of the plan
   */
  layout(events: Event[], viewWindow?: { viewStart: number; viewEnd: number }): LayoutResult {
    if (events.length === 0) {
      return this.emptyResult();
    }
    
    // Store view window context for overflow filtering
    // const viewWindowContext = viewWindow || null; // Unused variable

    // Filter events by view window if provided (for zoomed views)
    let layoutEvents = events;
    if (viewWindow && (viewWindow.viewStart !== 0 || viewWindow.viewEnd !== 1)) {
      const dates = events.map(e => new Date(e.date).getTime());
      const minDate = Math.min(...dates);
      const maxDate = Math.max(...dates);
      const dateRange = maxDate - minDate;
      
      const visibleStartTime = minDate + (dateRange * viewWindow.viewStart);
      const visibleEndTime = minDate + (dateRange * viewWindow.viewEnd);
      
      // Store time window for overflow event filtering
      this.currentTimeWindow = { visibleStartTime, visibleEndTime };
      
      layoutEvents = events.filter(event => {
        const eventTime = new Date(event.date).getTime();
        return eventTime >= visibleStartTime && eventTime <= visibleEndTime;
      });
      
      console.log(`🔍 VIEW WINDOW FILTER: ${events.length} total events → ${layoutEvents.length} visible events`);
    } else {
      this.currentTimeWindow = null;
    }

    // Calculate time range from filtered events (for proper viewport usage when zoomed)
    this.calculateTimeRange(layoutEvents);

    // Calculate adaptive half-column width for telemetry (Stage 3i1)
    const adaptiveHalfColumnWidth = this.calculateAdaptiveHalfColumnWidth();

    // Stage 1: Half-Column System - Dispatch events with alternating placement and spatial clustering
    const halfColumnGroups = this.dispatchEvents(layoutEvents);
    
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
   * Stage 3i1: Calculate half-column width based on actual card width for proper overlap detection
   * Formula: card_width + spacing_buffer to prevent visual collisions
   */
  private calculateAdaptiveHalfColumnWidth(): number {
    // Use actual full card width + generous spacing buffer to ensure zero overlaps
    const fullCardWidth = this.config.cardConfigs.full.width; // 260px (reduced from 280px)
    const spacingBuffer = 120; // Generous buffer for complete visual separation
    return fullCardWidth + spacingBuffer; // 340px - ensures zero overlap detection
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

    // Account for navigation rail + additional margin for better temporal accuracy
    const navRailWidth = 56; // Standard navigation rail width
    const additionalMargin = 80; // Extra spacing from nav rail (increased for all viewport sizes)
    const leftMargin = navRailWidth + additionalMargin; // 136px total
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
      let eventXPos: number;
      if (this.timeRange) {
        const timeRatio = (eventTime - this.timeRange.startTime) / this.timeRange.duration;
        const temporalXPos = leftMargin + (timeRatio * usableWidth);
        
        // Ensure card doesn't overlap navigation rail (card extends 130px left from center)
        const cardHalfWidth = this.config.cardConfigs.full.width / 2; // 130px
        const minCenterX = leftMargin + cardHalfWidth;
        const maxCenterX = leftMargin + usableWidth - cardHalfWidth;
        
        eventXPos = Math.max(minCenterX, Math.min(maxCenterX, temporalXPos));
      } else {
        // Fallback to sequential positioning
        const temporalXPos = leftMargin + (i * usableWidth) / Math.max(1, sortedEvents.length - 1);
        const cardHalfWidth = this.config.cardConfigs.full.width / 2; // 130px
        const minCenterX = leftMargin + cardHalfWidth;
        const maxCenterX = leftMargin + usableWidth - cardHalfWidth;
        
        eventXPos = Math.max(minCenterX, Math.min(maxCenterX, temporalXPos));
      }
      
      // Find or create appropriate half-column
      const targetSystem = shouldGoAbove ? aboveHalfColumns : belowHalfColumns;
      
      // STAGE 3i5 FIX: Check both systems for temporally close events (cross-system overflow)
      const bothSystems = [...aboveHalfColumns, ...belowHalfColumns];
      const anyExistingHalfColumn = this.findOverlappingHalfColumn(bothSystems, eventXPos);
      
      const existingHalfColumn = this.findOverlappingHalfColumn(targetSystem, eventXPos);
      
      // Check if any half-column in the target system has space
      // DEGRADATION FIX: Allow groups to accumulate more events, let degradation system handle card types
      const maxEventsPerGroup = 4; // Allow up to 4 events per group (for compact cards)
      if (existingHalfColumn && existingHalfColumn.events.length < maxEventsPerGroup) {
        // Add to existing half-column (degradation system will determine card type)
        existingHalfColumn.events.push(event);
        this.updateHalfColumnBounds(existingHalfColumn, event, eventXPos);
      } 
      // Check if we should overflow to any existing half-column (cross-system)
      else if (anyExistingHalfColumn && anyExistingHalfColumn.events.length >= maxEventsPerGroup) {
        // Found temporally close half-column at capacity - use overflow instead of creating new half-column
        if (!anyExistingHalfColumn.overflowEvents) {
          anyExistingHalfColumn.overflowEvents = [];
        }
        anyExistingHalfColumn.overflowEvents.push(event);
        console.log(`    - Added to overflow (${anyExistingHalfColumn.overflowEvents.length} overflow events)`);
        // Update anchor to show overflow count
        anyExistingHalfColumn.anchor = this.createAnchor(
          anyExistingHalfColumn.events, 
          anyExistingHalfColumn.centerX, 
          anyExistingHalfColumn.events.length,
          anyExistingHalfColumn.overflowEvents.length
        );
      }
      // Standard same-system overflow
      else if (existingHalfColumn && existingHalfColumn.events.length >= 2) {
        // Half-column at capacity - add to overflow, don't create overlapping half-column
        console.log(`  🌊 OVERFLOW TRIGGERED! Half-column ${existingHalfColumn.id} at capacity (${existingHalfColumn.events.length} events)`);
        if (!existingHalfColumn.overflowEvents) {
          existingHalfColumn.overflowEvents = [];
        }
        existingHalfColumn.overflowEvents.push(event);
        console.log(`    - Added to overflow (${existingHalfColumn.overflowEvents.length} overflow events)`);
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
        
        console.log(`  🆕 Creating new half-column: ${halfColumnId}`);
        console.log(`    - Bounds: [${Math.round(eventXPos - adaptiveHalfColumnWidth / 2)}, ${Math.round(eventXPos + adaptiveHalfColumnWidth / 2)}]`);
        
        this.capacityModel.initializeColumn(halfColumnId);
        
        const newHalfColumn: ColumnGroup = {
          id: halfColumnId,
          events: [event],
          startX: eventXPos - adaptiveHalfColumnWidth / 2,
          endX: eventXPos + adaptiveHalfColumnWidth / 2,
          centerX: eventXPos,
          anchor: this.createAnchor([event], eventXPos),
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
  private updateHalfColumnBounds(halfColumn: ColumnGroup, event: Event, _eventXPos: number): void {
    const eventTime = new Date(event.date).getTime();
    const allTimes = halfColumn.events.map(e => new Date(e.date).getTime());
    allTimes.push(eventTime);
    
    const minTime = Math.min(...allTimes);
    const maxTime = Math.max(...allTimes);
    const centerTime = (minTime + maxTime) / 2;
    
    // Update temporal center position
    if (this.timeRange) {
      const timeRatio = (centerTime - this.timeRange.startTime) / this.timeRange.duration;
      const navRailWidth = 56;
      const additionalMargin = 80;
      const leftMargin = navRailWidth + additionalMargin; // 136px total
      const rightMargin = 40;
      const usableWidth = this.config.viewportWidth - leftMargin - rightMargin;
      const temporalCenterX = leftMargin + (timeRatio * usableWidth);
      
      // Ensure card doesn't overlap navigation rail (card extends 130px left from center)
      const cardHalfWidth = this.config.cardConfigs.full.width / 2; // 130px
      const minCenterX = leftMargin + cardHalfWidth;
      const maxCenterX = leftMargin + usableWidth - cardHalfWidth;
      
      halfColumn.centerX = Math.max(minCenterX, Math.min(maxCenterX, temporalCenterX));
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
    
    // Use adaptive half-column width as minimum spacing to prevent overlaps
    const minSpacing = adaptiveHalfColumnWidth; // 340px - ensures no overlap between half-columns
    
    // Ensure minimum spacing between adjacent half-columns
    for (let i = 1; i < halfColumns.length; i++) {
      const prev = halfColumns[i - 1];
      const current = halfColumns[i];
      
      const requiredMinX = prev.centerX + minSpacing;
      
      if (current.centerX < requiredMinX) {
        // Check if we have space to move the current half-column
        const maxPossibleX = leftMargin + usableWidth - adaptiveHalfColumnWidth / 2;
        
        if (requiredMinX <= maxPossibleX) {
          // Adjust current half-column position to prevent overlap
          console.log(`🔧 Moving half-column ${current.id} from ${Math.round(current.centerX)} to ${Math.round(requiredMinX)} to prevent overlap`);
          current.centerX = requiredMinX;
          current.startX = current.centerX - adaptiveHalfColumnWidth / 2;
          current.endX = current.centerX + adaptiveHalfColumnWidth / 2;
          
          // Update anchor position
          current.anchor = this.createAnchor(current.events, current.centerX);
        } else {
          // Not enough space - trigger overflow instead
          console.log(`🌊 Half-column ${current.id} would exceed viewport - triggering overflow`);
          
          // Move events to previous half-column's overflow
          if (!prev.overflowEvents) {
            prev.overflowEvents = [];
          }
          prev.overflowEvents.push(...current.events);
          
          // Update previous half-column's anchor to show overflow
          prev.anchor = this.createAnchor(
            prev.events, 
            prev.centerX, 
            prev.events.length,
            prev.overflowEvents.length
          );
          
          // Mark current half-column for removal
          current.events = [];
          current.cards = [];
        }
      }
    }
    
    // Remove empty half-columns that were overflowed
    const filteredColumns = halfColumns.filter(hc => hc.events.length > 0);
    halfColumns.length = 0;
    halfColumns.push(...filteredColumns);
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

    // Reset degradation metrics
    this.degradationMetrics = {
      totalGroups: 0,
      fullCardGroups: 0,
      compactCardGroups: 0,
      spaceReclaimed: 0,
      degradationTriggers: []
    };

    for (const group of groups) {
      // STAGE 1: Implement first level of degradation (full → compact)
      const cardType = this.determineCardType(group);
      group.cards = this.createIndividualCards(group, [cardType]);
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

  private degradationMetrics = {
    totalGroups: 0,
    fullCardGroups: 0,
    compactCardGroups: 0,
    spaceReclaimed: 0, // vertical pixels saved by using compact cards
    degradationTriggers: [] as Array<{
      groupId: string,
      eventCount: number,
      from: 'full',
      to: 'compact' | 'title-only' | 'multi-event',
      spaceSaved: number
    }>
  };




  /**
   * Determine the appropriate card type for a group based on event count and space constraints
   */
  private determineCardType(group: ColumnGroup): CardType {
    // Consider both primary and overflow events when selecting card type
    const overflowLen = Array.isArray(group.overflowEvents) ? group.overflowEvents.length : 0;
    const eventCount = group.events.length + overflowLen;
    
    // Track metrics for telemetry
    this.degradationMetrics.totalGroups++;
    
    // First level of degradation: full → compact
    // Based on architecture: Half-column with >2 events should use compact cards
    // Full cards: 2 slots per half-column (max 2 events)
    // Compact cards: 4 slots per half-column (max 4 events)
    
    if (eventCount <= 2) {
      // 1-2 events can use full cards
      this.degradationMetrics.fullCardGroups++;
      return 'full';
    } else {
      // 3+ events need compact cards to fit in half-column
      this.degradationMetrics.compactCardGroups++;
      
      // Calculate space saved by degradation
      const fullCardHeight = this.config.cardConfigs.full.height; // 140px
      const compactCardHeight = this.config.cardConfigs.compact.height; // 64px
      const spaceSavedPerCard = fullCardHeight - compactCardHeight; // 76px per card
      const totalSpaceSaved = spaceSavedPerCard * eventCount;
      
      this.degradationMetrics.spaceReclaimed += totalSpaceSaved;
      this.degradationMetrics.degradationTriggers.push({
        groupId: group.id,
        eventCount,
        from: 'full',
        to: 'compact',
        spaceSaved: totalSpaceSaved
      });
      
      return 'compact';
    }
  }

  /**
   * Get maximum cards per half-column based on card type
   */
  private getMaxCardsPerHalfColumn(cardType: CardType): number {
    switch (cardType) {
      case 'full':
        return 2; // Full cards: 2 slots per half-column
      case 'compact':
        return 4; // Compact cards: 4 slots per half-column
      case 'title-only':
        return 4; // Title-only cards: 4 slots per half-column (same as compact for now)
      case 'multi-event':
        return 2; // Multi-event cards: 2 slots per half-column (like full cards)
      case 'infinite':
        return 2; // Infinite cards: 2 slots per half-column (like full cards)
      default:
        return 2; // Default to full card capacity
    }
  }

  /**
   * Create individual cards for a group
   */
  private createIndividualCards(group: ColumnGroup, cardTypes: CardType[]): PositionedCard[] {
    const cards: PositionedCard[] = [];
    const cardConfig = this.config.cardConfigs;

    // Determine max cards based on card type
    // Full cards: max 2 per half-column
    // Compact cards: max 4 per half-column
    const cardType = cardTypes[0]; // Use first card type for capacity calculation
    const maxCardsPerHalfColumn = this.getMaxCardsPerHalfColumn(cardType);

    // Build from combined pool so we can promote overflow into visible when switching to compact
    const combined: Event[] = [
      ...group.events,
      ...(Array.isArray(group.overflowEvents) ? group.overflowEvents : [])
    ];
    const visibleEvents = combined.slice(0, maxCardsPerHalfColumn);

    visibleEvents.forEach((event, index) => {
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

    // Update overflowEvents to remainder for accurate anchor counts and future passes
    const remainder = combined.slice(visibleEvents.length);
    group.overflowEvents = remainder.length > 0 ? remainder : undefined;

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
    const topMargin = 20; // smaller top margin to use more space
    const bottomMargin = 20; // smaller bottom margin to use more space
    const timelineMargin = 24; // tighter spacing to timeline
    const availableAbove = this.timelineY - topMargin - timelineMargin;
    const availableBelow = this.config.viewportHeight - this.timelineY - bottomMargin - timelineMargin;
    
    for (const group of groups) {
      // Calculate optimal card size to better use available space
      const cardSpacing = 12; // reduced inter-card spacing
      
      // Use card type that was already determined in degradation phase
      // The group.cards should already have the correct cardType from applyDegradationAndPromotion
      const firstCard = group.cards?.[0];
      const cardType = firstCard?.cardType || 'full'; // fallback to full if no cards
      const cardConfig = this.config.cardConfigs[cardType];
      const cardHeight = cardConfig.height;
      
      // Half-column capacity: respect pre-determined above/below assignment using actual card height
      const maxCardsAbove = Math.floor(availableAbove / (cardHeight + cardSpacing));
      const maxCardsBelow = Math.floor(availableBelow / (cardHeight + cardSpacing));
      
      const isAboveHalfColumn = group.capacity.above.total > 0;
      const isBelowHalfColumn = group.capacity.below.total > 0;
      
      const cardsAboveLimit = isAboveHalfColumn ? Math.min(maxCardsAbove, group.cards.length) : 0;
      const cardsBelowLimit = isBelowHalfColumn ? Math.min(maxCardsBelow, group.cards.length) : 0;
      const totalCapacity = cardsAboveLimit + cardsBelowLimit;
      
      
      // Use configured card height for positioning (no dynamic calculation)
      // This ensures consistent sizing based on card type degradation
      
      // Limit cards to what actually fits
      const actualCards = group.cards.slice(0, totalCapacity);
      
      // Update anchor with proper visible count and overflow count
      // Filter overflow events by current view window to prevent leftover indicators
      const relevantOverflowEvents = group.overflowEvents ? this.filterEventsByViewWindow(group.overflowEvents) : [];
      
      // Also filter main group events by view window to check if anchor is relevant
      const relevantGroupEvents = this.filterEventsByViewWindow(group.events);
      const totalRelevantEvents = relevantGroupEvents.length + relevantOverflowEvents.length;
      const visibleCount = actualCards.length;
      const overflowCount = Math.max(0, totalRelevantEvents - visibleCount);
      
      // Only add anchor if it has visible cards OR overflow within current view window
      if (visibleCount > 0 || overflowCount > 0) {
        const updatedAnchor = this.createAnchor(
          [...relevantGroupEvents, ...relevantOverflowEvents], 
          group.centerX, 
          visibleCount,
          overflowCount
        );
        anchors.push(updatedAnchor);
        
        // Respect half-column pre-determined position (above vs below)
        const aboveCards = isAboveHalfColumn ? actualCards.slice(0, cardsAboveLimit) : [];
        const belowCards = isBelowHalfColumn ? actualCards.slice(0, cardsBelowLimit) : [];
        
        // Position above cards with dynamic sizing and proper spacing
        let aboveY = this.timelineY - timelineMargin;
        aboveCards.forEach((card) => {
          // Use card config height for positioning
          card.height = cardHeight;
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
          // Use card config height for positioning
          card.height = cardHeight;
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
          anchor: updatedAnchor,
          events: group.events
        });
      }
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
   * Helper: Create anchor for a group of events
   */
  private createAnchor(events: Event[], x: number, visibleCount?: number, overflowCount?: number): Anchor {
    const totalCount = events.length;
    const visible = visibleCount ?? totalCount; // Default to all visible if not specified
    const overflow = overflowCount ?? Math.max(0, totalCount - visible);
    
    return {
      id: `anchor-${x}`,
      x,
      y: this.timelineY,
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
    
    // Reduce padding to 2% to keep events closer to timeline milestones
    const padding = duration * 0.02;
    
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
    degradation?: {
      totalGroups: number;
      fullCardGroups: number;
      compactCardGroups: number;
      degradationRate: number;
      spaceReclaimed: number;
      degradationTriggers: Array<{
        groupId: string;
        eventCount: number;
        from: string;
        to: string;
        spaceSaved: number;
      }>;
    };
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
    
    // Add degradation metrics
    const degradation = {
      totalGroups: this.degradationMetrics.totalGroups,
      fullCardGroups: this.degradationMetrics.fullCardGroups,
      compactCardGroups: this.degradationMetrics.compactCardGroups,
      degradationRate: this.degradationMetrics.totalGroups > 0 
        ? this.degradationMetrics.compactCardGroups / this.degradationMetrics.totalGroups 
        : 0,
      spaceReclaimed: this.degradationMetrics.spaceReclaimed,
      degradationTriggers: this.degradationMetrics.degradationTriggers
    };

    return { dispatch, aggregation, infinite, degradation, adaptive };
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
   * Helper: Filter events by current view window to prevent leftover overflow indicators
   */
  private filterEventsByViewWindow(events: Event[]): Event[] {
    if (!this.currentTimeWindow) {
      // No view window filtering - return all events
      return events;
    }
    
    const { visibleStartTime, visibleEndTime } = this.currentTimeWindow;
    
    return events.filter(event => {
      const eventTime = new Date(event.date).getTime();
      return eventTime >= visibleStartTime && eventTime <= visibleEndTime;
    });
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


