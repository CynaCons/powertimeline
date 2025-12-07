/**
 * DegradationEngine - Card type degradation system
 *
 * Handles the intelligent card type selection and degradation based on:
 * - Event density and space constraints
 * - Card type capacity (full -> compact -> title-only)
 * - Degradation metrics and telemetry tracking
 * - Individual card creation with proper positioning
 */

import type { Event } from '../../types';
import type { LayoutConfig, PositionedCard, CardType } from '../types';
import type { ColumnGroup, DegradationMetrics } from '../LayoutEngine';
import { FEATURE_FLAGS } from '../config';

export class DegradationEngine {
  private config: LayoutConfig;

  // Metrics tracking
  private degradationMetrics: DegradationMetrics = {
    totalGroups: 0,
    fullCardGroups: 0,
    compactCardGroups: 0,
    titleOnlyCardGroups: 0,
    degradationRate: 0,
    spaceReclaimed: 0,
    degradationTriggers: [],
    totalClusters: 0,
    clustersWithOverflow: 0,
    clustersWithMixedTypes: 0, // Tracks clusters using mixed card types (v0.3.6.3)
    clusterCoordinationEvents: []
  };

  constructor(config: LayoutConfig) {
    this.config = config;
  }

  /**
   * Get current degradation metrics for telemetry
   */
  getDegradationMetrics(): DegradationMetrics {
    return { ...this.degradationMetrics };
  }

  /**
   * Apply degradation and promotion logic to column groups
   * Uses cluster coordination if feature flag enabled, otherwise falls back to legacy algorithm
   */
  applyDegradationAndPromotion(groups: ColumnGroup[]): ColumnGroup[] {
    // Reset metrics for new layout calculation
    this.resetMetrics();

    if (FEATURE_FLAGS.ENABLE_CLUSTER_COORDINATION) {
      return this.applyClusterCoordinatedDegradation(groups);
    } else {
      return this.applyLegacyDegradation(groups);
    }
  }

  /**
   * Legacy degradation algorithm - uniform card type per group
   * Used when ENABLE_CLUSTER_COORDINATION is false
   */
  private applyLegacyDegradation(groups: ColumnGroup[]): ColumnGroup[] {
    for (const group of groups) {
      // Determine SINGLE card type for entire group (uniform degradation)
      const cardType = this.determineCardType(group);
      group.cards = this.createIndividualCards(group, [cardType]);
    }

    return groups;
  }

  /**
   * Cluster-coordinated degradation algorithm
   * Implements spatial cluster coordination with optional mixed card types
   */
  private applyClusterCoordinatedDegradation(groups: ColumnGroup[]): ColumnGroup[] {
    // Phase 1: Identify spatial clusters
    const clusters = this.identifySpatialClusters(groups);
    this.degradationMetrics.totalClusters = clusters.length;

    // Phase 2: Apply coordinated degradation
    for (const cluster of clusters) {
      if (cluster.hasOverflow) {
        // Phase 2a: Uniform degradation (overflow exists)
        this.degradationMetrics.clustersWithOverflow++;
        const cardType = cluster.recommendedCardType;

        if (cluster.aboveGroup) {
          cluster.aboveGroup.cards = this.createIndividualCards(
            cluster.aboveGroup,
            [cardType] // Uniform card type
          );
        }

        if (cluster.belowGroup) {
          cluster.belowGroup.cards = this.createIndividualCards(
            cluster.belowGroup,
            [cardType] // Same uniform card type
          );
        }

        // Track coordination event
        this.degradationMetrics.clusterCoordinationEvents.push({
          clusterId: cluster.id,
          hasOverflow: true,
          aboveCardType: cluster.aboveGroup ? cardType : 'none',
          belowCardType: cluster.belowGroup ? cardType : 'none',
          coordinationApplied: true
        });

      } else if (FEATURE_FLAGS.ENABLE_MIXED_CARD_TYPES) {
        // Phase 2b: Mixed card types allowed (no overflow)
        this.degradationMetrics.clustersWithMixedTypes++;

        if (cluster.aboveGroup) {
          // Count TOTAL events (primary + overflow) to determine correct card types
          const overflowLen = cluster.aboveGroup.overflowEvents?.length ?? 0;
          const totalEventCount = cluster.aboveGroup.events.length + overflowLen;

          // Create mock array with total count for card type determination
          const mockEvents = new Array(totalEventCount);
          const mixedTypes = this.determineMixedCardTypes(mockEvents);

          cluster.aboveGroup.cards = this.createIndividualCards(
            cluster.aboveGroup,
            mixedTypes // Can use mixed card types
          );
        }

        if (cluster.belowGroup) {
          // Count TOTAL events (primary + overflow) to determine correct card types
          const overflowLen = cluster.belowGroup.overflowEvents?.length ?? 0;
          const totalEventCount = cluster.belowGroup.events.length + overflowLen;

          // Create mock array with total count for card type determination
          const mockEvents = new Array(totalEventCount);
          const mixedTypes = this.determineMixedCardTypes(mockEvents);

          cluster.belowGroup.cards = this.createIndividualCards(
            cluster.belowGroup,
            mixedTypes // Can use mixed card types
          );
        }

        // Track coordination event
        this.degradationMetrics.clusterCoordinationEvents.push({
          clusterId: cluster.id,
          hasOverflow: false,
          aboveCardType: cluster.aboveGroup ? 'mixed' : 'none',
          belowCardType: cluster.belowGroup ? 'mixed' : 'none',
          coordinationApplied: false
        });

      } else {
        // Fallback: Use uniform degradation even when no overflow
        const cardType = cluster.recommendedCardType;

        if (cluster.aboveGroup) {
          cluster.aboveGroup.cards = this.createIndividualCards(
            cluster.aboveGroup,
            [cardType]
          );
        }

        if (cluster.belowGroup) {
          cluster.belowGroup.cards = this.createIndividualCards(
            cluster.belowGroup,
            [cardType]
          );
        }

        // Track coordination event
        this.degradationMetrics.clusterCoordinationEvents.push({
          clusterId: cluster.id,
          hasOverflow: false,
          aboveCardType: cluster.aboveGroup ? cardType : 'none',
          belowCardType: cluster.belowGroup ? cardType : 'none',
          coordinationApplied: false
        });
      }
    }

    return groups;
  }

  /**
   * Reset all metrics for new calculation cycle
   */
  private resetMetrics(): void {
    this.degradationMetrics = {
      totalGroups: 0,
      fullCardGroups: 0,
      compactCardGroups: 0,
      titleOnlyCardGroups: 0,
      degradationRate: 0,
      spaceReclaimed: 0,
      degradationTriggers: [],
      totalClusters: 0,
      clustersWithOverflow: 0,
      clustersWithMixedTypes: 0,
      clusterCoordinationEvents: []
    };
  }

  /**
   * Determine the appropriate UNIFORM card type for the entire group
   * Simplified degradation rules (v0.3.6.2 rollback):
   * - 1-2 events: full cards (2 × 169px = 338px)
   * - 3 events: compact cards (3 × 92px = 276px fits in same space)
   * - 4+ events: title-only cards (high density)
   */
  private determineCardType(group: ColumnGroup): CardType {
    // Consider both primary and overflow events when selecting card type
    const overflowLen = Array.isArray(group.overflowEvents) ? group.overflowEvents.length : 0;
    const eventCount = group.events.length + overflowLen;

    // Track metrics for telemetry
    this.degradationMetrics.totalGroups++;

    // Simplified degradation logic
    if (eventCount <= 2) {
      // 1-2 events can use full cards
      this.degradationMetrics.fullCardGroups++;
      return 'full';
    } else if (eventCount === 3) {
      // Exactly 3 events use compact cards
      this.degradationMetrics.compactCardGroups++;

      // Calculate space saved by degradation
      const fullCardHeight = this.config.cardConfigs.full.height;
      const compactCardHeight = this.config.cardConfigs.compact.height;
      const spaceSavedPerCard = fullCardHeight - compactCardHeight;
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
    } else {
      // 4+ events → title-only (high density)
      this.degradationMetrics.titleOnlyCardGroups++;

      const compactH = this.config.cardConfigs.compact.height;
      const titleH = this.config.cardConfigs['title-only'].height;
      const spaceSavedPerCard = compactH - titleH;
      const totalSpaceSaved = Math.max(0, spaceSavedPerCard * Math.min(eventCount, 3));

      this.degradationMetrics.spaceReclaimed += totalSpaceSaved;
      this.degradationMetrics.degradationTriggers.push({
        groupId: group.id,
        eventCount,
        from: 'compact',
        to: 'title-only',
        spaceSaved: totalSpaceSaved
      });

      return 'title-only';
    }
  }


  /**
   * Get maximum cards per half-column based on card type
   * Updated with correct math (v0.3.6.3):
   * - Full cards: 2 per half-column (2 × 169px + 12px = 350px)
   * - Compact cards: 4 per half-column (4 × 75px + 3 × 12px = 336px)
   * - Title-only: 8 per half-column (8 × 32px + 7 × 12px = 340px, fits in available space)
   */
  getMaxCardsPerHalfColumn(cardType: CardType): number {
    switch (cardType) {
      case 'full':
        return 2; // Full cards: 2 slots per half-column
      case 'compact':
        return 4; // Compact cards: 4 slots per half-column (4 × 75px + 3 × 12px = 336px)
      case 'title-only':
        return 8; // Title-only cards: 8 per half-column (9 would overflow out of screen)
      default:
        return 2; // Default to full card capacity
    }
  }

  /**
   * Identify spatial clusters by matching above/below half-columns
   * Groups share the same X-region if their centerX positions are within threshold
   */
  private identifySpatialClusters(groups: ColumnGroup[]): import('../LayoutEngine').SpatialCluster[] {
    const X_THRESHOLD = 50; // pixels - groups within 50px are same cluster

    const aboveGroups = groups.filter(g => g.side === 'above');
    const belowGroups = groups.filter(g => g.side === 'below');
    const clusters: import('../LayoutEngine').SpatialCluster[] = [];
    const processedBelow = new Set<string>();

    // Iterate through above groups and find matching below groups
    for (const above of aboveGroups) {
      // Find below group in same X-region
      const below = belowGroups.find(g =>
        !processedBelow.has(g.id) &&
        Math.abs(g.centerX - above.centerX) < X_THRESHOLD
      );

      if (below) processedBelow.add(below.id);

      // Check cluster-wide overflow (both horizontal from DispatchEngine and predicted vertical)
      const aboveOverflow = (above.overflowEvents?.length ?? 0) > 0;
      const belowOverflow = (below?.overflowEvents?.length ?? 0) > 0;

      // PREDICT vertical overflow: check if total events exceed maximum capacity
      // Maximum capacity is 8 title-only cards per half-column
      const aboveTotalEvents = above.events.length + (above.overflowEvents?.length ?? 0);
      const belowTotalEvents = (below?.events.length ?? 0) + (below?.overflowEvents?.length ?? 0);
      const abovePredictedOverflow = aboveTotalEvents > 8; // Exceeds max title-only capacity
      const belowPredictedOverflow = belowTotalEvents > 8; // Exceeds max title-only capacity

      const hasOverflow = aboveOverflow || belowOverflow || abovePredictedOverflow || belowPredictedOverflow;

      // Calculate total events
      const totalEvents = above.events.length + (below?.events.length ?? 0);

      // Determine recommended uniform card type for cluster
      const recommendedCardType = this.determineUniformCardType(totalEvents);

      clusters.push({
        id: `cluster-${above.centerX}`,
        xRegion: {
          start: above.startX,
          end: above.endX,
          center: above.centerX
        },
        aboveGroup: above,
        belowGroup: below ?? null,
        hasOverflow,
        totalEvents,
        recommendedCardType
      });
    }

    // Handle orphan below groups (no matching above group)
    const orphanBelowGroups = belowGroups.filter(g => !processedBelow.has(g.id));
    for (const below of orphanBelowGroups) {
      const hasOverflow = (below.overflowEvents?.length ?? 0) > 0;
      const totalEvents = below.events.length;
      const recommendedCardType = this.determineUniformCardType(totalEvents);

      clusters.push({
        id: `cluster-${below.centerX}`,
        xRegion: {
          start: below.startX,
          end: below.endX,
          center: below.centerX
        },
        aboveGroup: null,
        belowGroup: below,
        hasOverflow,
        totalEvents,
        recommendedCardType
      });
    }

    return clusters;
  }

  /**
   * Determine uniform card type based on total event count
   * Updated thresholds (v0.3.6.2 rollback):
   * - 1-2 events: full
   * - 3 events: compact
   * - 4+ events: title-only
   */
  private determineUniformCardType(eventCount: number): CardType {
    if (eventCount <= 2) return 'full';
    if (eventCount === 3) return 'compact';
    return 'title-only';
  }

  /**
   * Determine mixed card types with chronological priority
   * Earlier events get full cards, later events degrade to compact/title-only
   *
   * IMPORTANT: Returns single-element array for uniform types to signal standard capacity calculation
   * Returns multi-element array only for truly mixed types
   *
   * Mixing rules (with 75px compact cards):
   * - 1-2 events: ['full'] - uniform, uses getMaxCardsPerHalfColumn (2 cards)
   * - 3 events: ['compact'] - uniform, uses getMaxCardsPerHalfColumn (4 cards)
   * - 4 events: ['compact'] - uniform, uses getMaxCardsPerHalfColumn (4 cards)
   * - 5 events: [compact, compact, title-only, ...] - mixed
   * - 6 events: [compact, compact, title-only, ...] - mixed
   * - 7 events: [compact, title-only, ...] - mixed
   * - 8+ events: ['title-only'] - uniform, uses getMaxCardsPerHalfColumn (8 cards)
   */
  private determineMixedCardTypes(events: Event[]): CardType[] {
    const count = events.length;

    // Return SINGLE-element array for uniform types (triggers standard capacity)
    if (count <= 2) {
      return ['full']; // Uniform: use getMaxCardsPerHalfColumn (2 full cards)
    } else if (count === 3) {
      // Uniform compact to avoid mixed-type overflow for 3-event clusters
      return ['compact']; // Uniform: use getMaxCardsPerHalfColumn (4 compact cards)
    } else if (count === 4) {
      return ['compact']; // Uniform: use getMaxCardsPerHalfColumn (4 compact cards)
    } else if (count === 5) {
      // Mixed: 2 compact + 3 title-only
      return ['compact', 'compact', 'title-only', 'title-only', 'title-only'];
    } else if (count === 6) {
      // Mixed: 2 compact + 4 title-only
      return ['compact', 'compact', 'title-only', 'title-only', 'title-only', 'title-only'];
    } else if (count === 7) {
      // Mixed: 1 compact + 6 title-only
      return ['compact', 'title-only', 'title-only', 'title-only', 'title-only', 'title-only', 'title-only'];
    } else {
      // 8+ events: uniform degradation
      return ['title-only']; // Uniform: use getMaxCardsPerHalfColumn (9 title-only cards)
    }
  }

  /**
   * Create individual cards for a group
   */
  createIndividualCards(group: ColumnGroup, cardTypes: CardType[]): PositionedCard[] {
    const cards: PositionedCard[] = [];
    const cardConfig = this.config.cardConfigs;

    // Build from combined pool so we can promote overflow into visible when switching to compact
    const combined: Event[] = [
      ...group.events,
      ...(Array.isArray(group.overflowEvents) ? group.overflowEvents : [])
    ];

    // Determine max cards based on card types
    let maxCardsPerHalfColumn: number;

    if (cardTypes.length === 1) {
      // Uniform card type - use simple capacity calculation
      maxCardsPerHalfColumn = this.getMaxCardsPerHalfColumn(cardTypes[0]);
    } else {
      // Mixed card types - calculate based on accumulated heights
      maxCardsPerHalfColumn = this.calculateMixedTypeCapacity(combined.length, cardTypes);
    }

    const visibleEvents = combined.slice(0, maxCardsPerHalfColumn);

    // VALIDATION: Ensure card types are coherent with actual visible count
    // Note: Mismatch validation removed to reduce console noise

    visibleEvents.forEach((event, index) => {
      // Cycle through card types if multiple provided
      const cardType = cardTypes[index % cardTypes.length];

      cards.push({
        id: `${group.id}-${index}`,
        event,
        x: 0,
        y: 0,
        width: cardConfig[cardType].width,
        height: cardConfig[cardType].height,
        cardType,
        clusterId: group.id
      });
    });

    // Update overflowEvents to remainder for accurate anchor counts and future passes
    const remainder = combined.slice(visibleEvents.length);
    group.overflowEvents = remainder.length > 0 ? remainder : undefined;

    return cards;
  }

  /**
   * Calculate how many cards fit in a half-column with mixed card types
   * based on available vertical space
   */
  private calculateMixedTypeCapacity(eventCount: number, cardTypes: CardType[]): number {
    const cardConfig = this.config.cardConfigs;
    const cardSpacing = 12; // pixels between cards

    // Use conservative calculation matching PositioningEngine
    // Available height per half-column: timelineY - margins
    const topMargin = 20;
    const timelineMargin = 40; // Restored from 24px to prevent axis label overlap
    const upperAnchorSpacing = 25;
    const availableHeight = (this.config.viewportHeight / 2) - topMargin - timelineMargin - upperAnchorSpacing;

    let accumulatedHeight = 0;
    let cardsFit = 0;

    for (let i = 0; i < eventCount; i++) {
      const cardType = cardTypes[i % cardTypes.length];
      const cardHeight = cardConfig[cardType].height;
      const heightWithSpacing = cardHeight + (i > 0 ? cardSpacing : 0);

      if (accumulatedHeight + heightWithSpacing <= availableHeight) {
        accumulatedHeight += heightWithSpacing;
        cardsFit++;
      } else {
        break; // No more cards fit
      }
    }

    return cardsFit;
  }
}
