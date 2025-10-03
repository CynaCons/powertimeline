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
    degradationTriggers: []
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
   * STAGE 1: Implement first level of degradation (full -> compact)
   */
  applyDegradationAndPromotion(groups: ColumnGroup[]): ColumnGroup[] {
    // Reset metrics for new layout calculation
    this.resetMetrics();

    for (const group of groups) {
      // STAGE 1: Implement first level of degradation (full -> compact)
      const cardType = this.determineCardType(group);
      group.cards = this.createIndividualCards(group, [cardType]);
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
      degradationTriggers: []
    };
  }

  /**
   * Determine the appropriate card type for a group based on event count and space constraints
   */
  private determineCardType(group: ColumnGroup): CardType {
    // Consider both primary and overflow events when selecting card type
    const overflowLen = Array.isArray(group.overflowEvents) ? group.overflowEvents.length : 0;
    const eventCount = group.events.length + overflowLen;

    // Track metrics for telemetry
    this.degradationMetrics.totalGroups++;

    // First level of degradation: full -> compact
    // Based on architecture: Half-column with >2 events should use compact cards
    // Full cards: 2 slots per half-column (max 2 events)
    // Compact cards: 4 slots per half-column (max 4 events)

    if (eventCount <= 2) {
      // 1-2 events can use full cards
      this.degradationMetrics.fullCardGroups++;
      return 'full';
    } else if (eventCount <= 4) {
      // 3+ events need compact cards to fit in half-column
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
      // High density: more than 4 events (including overflow) -> title-only
      this.degradationMetrics.titleOnlyCardGroups++;

      const compactH = this.config.cardConfigs.compact.height;
      const titleH = this.config.cardConfigs['title-only'].height;
      const spaceSavedPerCard = compactH - titleH;
      const totalSpaceSaved = Math.max(0, spaceSavedPerCard * Math.min(eventCount, 4));

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
   */
  getMaxCardsPerHalfColumn(cardType: CardType): number {
    switch (cardType) {
      case 'full':
        return 2; // Full cards: 2 slots per half-column
      case 'compact':
        return 4; // Compact cards: 4 slots per half-column
      case 'title-only':
        return 9; // Title-only cards: allow up to 9 per half-column in high density
      default:
        return 2; // Default to full card capacity
    }
  }

  /**
   * Create individual cards for a group
   */
  createIndividualCards(group: ColumnGroup, cardTypes: CardType[]): PositionedCard[] {
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
}