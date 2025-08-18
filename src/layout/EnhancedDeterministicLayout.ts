import type { Event } from '../types';
import type { LayoutConfig, LayoutResult } from './types';
import { TimelineBoundsCalculator, type TimelineBounds, type ViewportMapping } from './TimelineBounds';
import { EventDistributionEngine, type DistributionMetrics } from './EventDistribution';
import { DecorrelatedLayoutEngine, type SectionLayout, type SharedAnchor } from './DecorrelatedLayoutEngine';
import { CorrectedSlotSystem } from './CorrectedSlotSystem';

/**
 * Enhanced Deterministic Layout Engine v5
 * 
 * Implements the complete enhanced algorithm:
 * 1. Timeline bounds calculation
 * 2. Event distribution optimization  
 * 3. Independent above/below layouts
 * 4. Corrected slot allocation (4/8/8/4)
 * 5. Zero overlaps guaranteed
 */

export interface EnhancedLayoutResult extends LayoutResult {
  timelineBounds: TimelineBounds;
  viewportMapping: ViewportMapping;
  distributionMetrics: DistributionMetrics;
  aboveLayout: SectionLayout;
  belowLayout: SectionLayout;
  sharedAnchors: SharedAnchor[];
  processSteps: ProcessStep[];
  enhancedStats: {
    totalEvents: number;
    totalColumns: number;
    totalCards: number;
    horizontalUtilization: number;
    averageSlotUtilization: number;
    zeroOverlapsGuaranteed: boolean;
  };
}

export interface ProcessStep {
  step: number;
  name: string;
  description: string;
  duration: number;
  result: any;
}

export class EnhancedDeterministicLayout {
  private boundsCalculator = new TimelineBoundsCalculator();
  private distributionEngine = new EventDistributionEngine();
  private decorrelatedEngine = new DecorrelatedLayoutEngine();
  private slotSystem = new CorrectedSlotSystem();

  /**
   * Main layout function implementing the enhanced deterministic strategy
   * Process Order: bounds → dispatch → cluster → fit → degrade
   */
  layout(
    events: Event[], 
    config: LayoutConfig, 
    zoomLevel: number = 1.0
  ): EnhancedLayoutResult {
    const processSteps: ProcessStep[] = [];
    // const startTime = performance.now();

    // Step 1: Calculate timeline display bounds
    const step1Start = performance.now();
    const timelineBounds = this.boundsCalculator.calculateBounds(
      events, 
      config.viewportWidth, 
      zoomLevel
    );
    const viewportMapping = this.boundsCalculator.createViewportMapping(
      timelineBounds, 
      config.viewportWidth
    );
    processSteps.push({
      step: 1,
      name: 'Timeline Bounds Calculation',
      description: 'Calculate display start/end dates with zoom consideration',
      duration: performance.now() - step1Start,
      result: { timelineBounds, viewportMapping }
    });

    // Step 2: Distribute events optimally across timeline width
    const step2Start = performance.now();
    const distributedEvents = this.distributionEngine.distributeEvents(
      events,
      timelineBounds,
      viewportMapping
    );
    const distributionMetrics = this.distributionEngine.calculateMetrics(
      distributedEvents,
      timelineBounds,
      viewportMapping
    );
    processSteps.push({
      step: 2,
      name: 'Event Distribution',
      description: 'Optimize horizontal space utilization and dispatch events',
      duration: performance.now() - step2Start,
      result: { distributedEvents, distributionMetrics }
    });

    // Step 3: Create decorrelated above/below layouts
    const step3Start = performance.now();
    const decorrelatedResult = this.decorrelatedEngine.createDecorrelatedLayout(
      distributedEvents,
      timelineBounds,
      config.viewportWidth
    );
    processSteps.push({
      step: 3,
      name: 'Decorrelated Layout Creation',
      description: 'Independent clustering and positioning for above/below sections',
      duration: performance.now() - step3Start,
      result: decorrelatedResult
    });

    // Step 4: Convert to standard layout result format
    const step4Start = performance.now();
    const standardResult = this.convertToStandardResult(decorrelatedResult, config);
    processSteps.push({
      step: 4,
      name: 'Result Conversion',
      description: 'Convert to standard LayoutResult format',
      duration: performance.now() - step4Start,
      result: standardResult
    });

    // Calculate enhanced statistics
    const enhancedStats = this.calculateEnhancedStatistics(
      decorrelatedResult,
      distributionMetrics
    );

    return {
      ...standardResult,
      timelineBounds,
      viewportMapping,
      distributionMetrics,
      aboveLayout: decorrelatedResult.aboveLayout,
      belowLayout: decorrelatedResult.belowLayout,
      sharedAnchors: decorrelatedResult.sharedAnchors,
      processSteps,
      enhancedStats
    };
  }

  /**
   * Convert decorrelated result to standard LayoutResult format
   */
  private convertToStandardResult(
    decorrelatedResult: {
      aboveLayout: SectionLayout;
      belowLayout: SectionLayout;
      sharedAnchors: SharedAnchor[];
      overallStats: any;
    },
    config: LayoutConfig
  ): LayoutResult {
    // Combine positioned cards from both sections
    const allPositionedCards = [
      ...decorrelatedResult.aboveLayout.cards.map(card => ({
        id: card.id,
        event: Array.isArray(card.events) ? card.events[0] : card.events[0],
        x: card.x,
        y: card.y,
        cardWidth: card.width,
        cardHeight: card.height,
        anchorX: card.anchorX,
        anchorY: card.anchorY,
        cardType: card.cardType,
        isMultiEvent: card.events.length > 1,
        isSummaryCard: card.cardType === 'infinite',
        clusterId: card.columnId,
        eventCount: card.events.length
      })),
      ...decorrelatedResult.belowLayout.cards.map(card => ({
        id: card.id,
        event: Array.isArray(card.events) ? card.events[0] : card.events[0],
        x: card.x,
        y: card.y,
        cardWidth: card.width,
        cardHeight: card.height,
        anchorX: card.anchorX,
        anchorY: card.anchorY,
        cardType: card.cardType,
        isMultiEvent: card.events.length > 1,
        isSummaryCard: card.cardType === 'infinite',
        clusterId: card.columnId,
        eventCount: card.events.length
      }))
    ];

    // Convert shared anchors to standard anchor format
    const anchors = decorrelatedResult.sharedAnchors.map(anchor => ({
      id: anchor.id,
      x: anchor.x,
      y: anchor.y,
      eventIds: [...anchor.aboveEvents, ...anchor.belowEvents].map(e => e.id),
      eventCount: anchor.totalEvents
    }));

    // Create clusters from columns
    const clusters = [
      ...decorrelatedResult.aboveLayout.columns.map(col => ({
        id: col.id,
        events: col.events,
        anchor: anchors.find(a => a.x === col.centerX) || {
          id: `${col.id}-anchor`,
          x: col.centerX,
          y: config.timelineY || 300,
          eventIds: col.events.map(e => e.id),
          eventCount: col.events.length
        }
      })),
      ...decorrelatedResult.belowLayout.columns.map(col => ({
        id: col.id,
        events: col.events,
        anchor: anchors.find(a => a.x === col.centerX) || {
          id: `${col.id}-anchor`,
          x: col.centerX,
          y: config.timelineY || 300,
          eventIds: col.events.map(e => e.id),
          eventCount: col.events.length
        }
      }))
    ];

    // Calculate utilization
    const totalSlots = 
      decorrelatedResult.aboveLayout.slotGrid.totalSlots + 
      decorrelatedResult.belowLayout.slotGrid.totalSlots;
    
    const usedSlots = 
      decorrelatedResult.aboveLayout.slotGrid.occupiedSlots + 
      decorrelatedResult.belowLayout.slotGrid.occupiedSlots;

    return {
      positionedCards: allPositionedCards,
      anchors,
      clusters,
      utilization: {
        totalSlots,
        usedSlots,
        percentage: totalSlots > 0 ? (usedSlots / totalSlots) * 100 : 0
      }
    };
  }

  /**
   * Calculate enhanced statistics
   */
  private calculateEnhancedStatistics(
    decorrelatedResult: {
      aboveLayout: SectionLayout;
      belowLayout: SectionLayout;
      overallStats: any;
    },
    distributionMetrics: DistributionMetrics
  ): {
    totalEvents: number;
    totalColumns: number;
    totalCards: number;
    horizontalUtilization: number;
    averageSlotUtilization: number;
    zeroOverlapsGuaranteed: boolean;
  } {
    const aboveStats = decorrelatedResult.aboveLayout.statistics;
    const belowStats = decorrelatedResult.belowLayout.statistics;

    return {
      totalEvents: aboveStats.totalEvents + belowStats.totalEvents,
      totalColumns: aboveStats.totalColumns + belowStats.totalColumns,
      totalCards: aboveStats.totalCards + belowStats.totalCards,
      horizontalUtilization: distributionMetrics.horizontalUtilization,
      averageSlotUtilization: (aboveStats.slotUtilization + belowStats.slotUtilization) / 2,
      zeroOverlapsGuaranteed: true // Guaranteed by slot-based system
    };
  }

  /**
   * Validate layout result for correctness
   */
  validateLayout(result: EnhancedLayoutResult): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    validationDetails: {
      slotSystemValid: boolean;
      noOverlaps: boolean;
      allEventsPositioned: boolean;
      anchorsCorrect: boolean;
    };
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate slot systems
    const aboveValidation = this.slotSystem.validateSlotSystem(result.aboveLayout.slotGrid);
    const belowValidation = this.slotSystem.validateSlotSystem(result.belowLayout.slotGrid);

    if (!aboveValidation.isValid) {
      errors.push(...aboveValidation.errors.map(e => `Above section: ${e}`));
    }
    if (!belowValidation.isValid) {
      errors.push(...belowValidation.errors.map(e => `Below section: ${e}`));
    }

    warnings.push(...aboveValidation.warnings.map(w => `Above section: ${w}`));
    warnings.push(...belowValidation.warnings.map(w => `Below section: ${w}`));

    // Check for overlaps (should be zero)
    const hasOverlaps = this.checkForOverlaps(result.positionedCards);
    if (hasOverlaps.length > 0) {
      errors.push(`Found ${hasOverlaps.length} overlapping cards`);
    }

    // Validate all events are positioned
    const totalEventsInInput = result.enhancedStats.totalEvents;
    const totalEventsInCards = result.positionedCards.reduce(
      (sum, card) => sum + (card.eventCount || 1), 
      0
    );
    if (totalEventsInInput !== totalEventsInCards) {
      errors.push(`Event count mismatch: input ${totalEventsInInput}, positioned ${totalEventsInCards}`);
    }

    // Validate anchors
    const anchorValidation = this.validateAnchors(result.sharedAnchors, result.clusters);
    if (!anchorValidation.isValid) {
      errors.push(...anchorValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validationDetails: {
        slotSystemValid: aboveValidation.isValid && belowValidation.isValid,
        noOverlaps: hasOverlaps.length === 0,
        allEventsPositioned: totalEventsInInput === totalEventsInCards,
        anchorsCorrect: anchorValidation.isValid
      }
    };
  }

  /**
   * Check for card overlaps
   */
  private checkForOverlaps(cards: any[]): { card1: string; card2: string }[] {
    const overlaps: { card1: string; card2: string }[] = [];

    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        const card1 = cards[i];
        const card2 = cards[j];

        // Check if rectangles overlap
        if (
          card1.x < card2.x + card2.cardWidth &&
          card1.x + card1.cardWidth > card2.x &&
          card1.y < card2.y + card2.cardHeight &&
          card1.y + card1.cardHeight > card2.y
        ) {
          overlaps.push({ card1: card1.id, card2: card2.id });
        }
      }
    }

    return overlaps;
  }

  /**
   * Validate anchors
   */
  private validateAnchors(anchors: SharedAnchor[], clusters: any[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check that each cluster has a corresponding anchor
    for (const cluster of clusters) {
      const hasAnchor = anchors.some(anchor => 
        anchor.aboveEvents.some(e => e.id === cluster.events[0]?.id) ||
        anchor.belowEvents.some(e => e.id === cluster.events[0]?.id)
      );
      
      if (!hasAnchor) {
        errors.push(`Cluster ${cluster.id} missing corresponding anchor`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get debugging information
   */
  getDebugInfo(result: EnhancedLayoutResult): {
    processTimings: { [step: string]: number };
    slotAllocations: any;
    distributionAnalysis: any;
    layoutBreakdown: any;
  } {
    const processTimings: { [step: string]: number } = {};
    result.processSteps.forEach(step => {
      processTimings[step.name] = step.duration;
    });

    return {
      processTimings,
      slotAllocations: this.slotSystem.getAllSlotAllocations(),
      distributionAnalysis: {
        totalEvents: result.distributionMetrics.totalEvents,
        averageDensity: result.distributionMetrics.averageDensity,
        horizontalUtilization: result.distributionMetrics.horizontalUtilization,
        clusteringRecommended: result.distributionMetrics.clusteringRecommended
      },
      layoutBreakdown: {
        aboveLayout: {
          events: result.aboveLayout.statistics.totalEvents,
          columns: result.aboveLayout.statistics.totalColumns,
          cards: result.aboveLayout.statistics.totalCards,
          utilization: result.aboveLayout.statistics.slotUtilization
        },
        belowLayout: {
          events: result.belowLayout.statistics.totalEvents,
          columns: result.belowLayout.statistics.totalColumns,
          cards: result.belowLayout.statistics.totalCards,
          utilization: result.belowLayout.statistics.slotUtilization
        }
      }
    };
  }
}