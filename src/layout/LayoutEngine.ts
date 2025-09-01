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
   * Stage 3i1: Calculate half-column width based on actual card width for proper overlap detection
   * Formula: card_width + spacing_buffer to prevent visual collisions
   */
  private calculateAdaptiveHalfColumnWidth(): number {
    // Calculate available space after margins
    const navRailWidth = 56;
    const additionalMargin = 80;
    const leftMargin = navRailWidth + additionalMargin; // 136px
    const rightMargin = 40;
    const usableWidth = this.config.viewportWidth - leftMargin - rightMargin;
    
    // Use actual full card width + spacing buffer, but adapt to viewport
    const fullCardWidth = this.config.cardConfigs.full.width; // 260px
    const idealSpacingBuffer = 80; // Generous buffer for complete visual separation
    const idealHalfColumnWidth = fullCardWidth + idealSpacingBuffer; // 340px
    
    // For narrow viewports, ensure we can fit at least 2 half-columns with minimum spacing
    const minHalfColumnWidth = fullCardWidth + 20; // 280px minimum
    const maxHalfColumnWidth = Math.min(idealHalfColumnWidth, usableWidth / 2.5); // Reserve space for multiple columns
    
    return Math.max(minHalfColumnWidth, Math.min(idealHalfColumnWidth, maxHalfColumnWidth));
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
      
      // DEBUG: Log event processing
      console.log(`\n🔍 Processing Event ${i}: "${event.title}" (${event.date})`);
      console.log(`  - System: ${shouldGoAbove ? 'above' : 'below'}`);
      console.log(`  - X position: ${Math.round(eventXPos)}`);
      
      // Find or create appropriate half-column
      const targetSystem = shouldGoAbove ? aboveHalfColumns : belowHalfColumns;
      
      // STAGE 3i5 FIX: Check both systems for temporally close events (cross-system overflow)
      const bothSystems = [...aboveHalfColumns, ...belowHalfColumns];
      const anyExistingHalfColumn = this.findOverlappingHalfColumn(bothSystems, eventXPos);
      
      const existingHalfColumn = this.findOverlappingHalfColumn(targetSystem, eventXPos);
      
      // DEBUG: Log half-column detection
      if (existingHalfColumn) {
        console.log(`  - Found existing half-column: ${existingHalfColumn.id}`);
        console.log(`    - Current events: ${existingHalfColumn.events.length}`);
        console.log(`    - Events: [${existingHalfColumn.events.map(e => e.title).join(', ')}]`);
        console.log(`    - Bounds: [${Math.round(existingHalfColumn.startX)}, ${Math.round(existingHalfColumn.endX)}]`);
      } else {
        console.log(`  - No overlapping half-column found`);
        console.log(`  - Existing half-columns in system:`, targetSystem.map(hc => 
          `${hc.id}[${Math.round(hc.startX)}, ${Math.round(hc.endX)}] (${hc.events.length} events)`
        ));
      }
      
      // Check if any half-column in the target system has space
      if (existingHalfColumn && existingHalfColumn.events.length < 2) {
        // Add to existing half-column (max 2 slots)
        console.log(`  ✅ Adding to existing half-column (${existingHalfColumn.events.length + 1}/2 slots)`);
        existingHalfColumn.events.push(event);
        this.updateHalfColumnBounds(existingHalfColumn, event, eventXPos);
      } 
      // Check if we should overflow to any existing half-column (cross-system)
      else if (anyExistingHalfColumn && anyExistingHalfColumn.events.length >= 2) {
        // Found temporally close half-column at capacity - use overflow instead of creating new half-column
        console.log(`  🌊 CROSS-SYSTEM OVERFLOW! Using half-column ${anyExistingHalfColumn.id} overflow (${anyExistingHalfColumn.events.length} events)`);
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
    const minSpacing = adaptiveHalfColumnWidth; // 360px - ensures no overlap between 360px wide half-columns
    
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
   * Create individual cards for a group
   */
  private createIndividualCards(group: ColumnGroup, cardTypes: CardType[]): PositionedCard[] {
    const cards: PositionedCard[] = [];
    const cardConfig = this.config.cardConfigs;

    // Only create cards for visible events (max 2 per half-column)
    // Overflow events should not become cards - they show as badges on anchors
    const maxCardsPerHalfColumn = 2;
    const visibleEvents = group.events.slice(0, maxCardsPerHalfColumn);

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
      
      // Update anchor with proper visible count and overflow count
      const totalEvents = group.events.length + (group.overflowEvents ? group.overflowEvents.length : 0);
      const visibleCount = actualCards.length;
      const overflowCount = Math.max(0, totalEvents - visibleCount);
      const updatedAnchor = this.createAnchor(
        [...group.events, ...(group.overflowEvents || [])], 
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
        anchor: updatedAnchor,
        events: group.events
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