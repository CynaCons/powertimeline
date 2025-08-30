import type { Event } from '../types';
import type { PositionedCard, EventCluster, LayoutConfig, CardType, Slot } from './types';
import { DualColumnLayout } from './DualColumnLayout';
import { CardTypeSelector } from './CardTypeSelector';

export class DegradationEngine extends DualColumnLayout {
  private cardTypeSelector: CardTypeSelector;

  constructor(config: LayoutConfig) {
    super(config);
    this.cardTypeSelector = new CardTypeSelector(config);
  }

  // Main degradation algorithm - implements the planned degradation sequence
  positionClusterWithDegradation(cluster: EventCluster, slots: Slot[]): PositionedCard[] {
    const positionedCards: PositionedCard[] = [];
    let remainingEvents = [...cluster.events].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Use provided slots
    const availableSlots = [...slots];

    // Phase 1: Try full cards
    const { positioned: fullCards, remaining: afterFull } = 
      this.tryPlaceCards(remainingEvents, availableSlots, 'full', cluster.id);
    positionedCards.push(...fullCards);
    remainingEvents = afterFull;

    if (remainingEvents.length === 0) return positionedCards;

    // Phase 2: Degrade to compact cards
    const { positioned: compactCards, remaining: afterCompact } = 
      this.tryPlaceCards(remainingEvents, availableSlots, 'compact', cluster.id);
    positionedCards.push(...compactCards);
    remainingEvents = afterCompact;

    if (remainingEvents.length === 0) return positionedCards;

    // Phase 3: Degrade to title-only cards
    const { positioned: titleCards, remaining: afterTitle } = 
      this.tryPlaceCards(remainingEvents, availableSlots, 'title-only', cluster.id);
    positionedCards.push(...titleCards);
    remainingEvents = afterTitle;

    if (remainingEvents.length === 0) return positionedCards;

    // Phase 4: Create multi-event cards (group remaining events)
    const { positioned: multiCards, remaining: afterMulti } = 
      this.createMultiEventCards(remainingEvents, availableSlots, cluster.id);
    positionedCards.push(...multiCards);
    remainingEvents = afterMulti;

    if (remainingEvents.length === 0) return positionedCards;

    // Phase 5: Create infinite card for any remaining events
    if (remainingEvents.length > 0) {
      const infiniteCard = this.createInfiniteCard(remainingEvents, availableSlots, cluster.id);
      if (infiniteCard) {
        positionedCards.push(infiniteCard);
      }
    }

    return positionedCards;
  }

  // Try to place events as specific card type
  private tryPlaceCards(
    events: Event[], 
    availableSlots: Slot[], 
    cardType: CardType,
    clusterId: string
  ): { positioned: PositionedCard[], remaining: Event[] } {
    const positioned: PositionedCard[] = [];
    const remaining: Event[] = [];

    for (const event of events) {
      const availableSlot = availableSlots.find(slot => !slot.occupied);
      
      if (availableSlot && this.cardTypeSelector.validateCardType(cardType, event).isValid) {
        const card = this.createPositionedCard(event, availableSlot, cardType, clusterId);
        positioned.push(card);
        this.slotGrid.occupySlot(availableSlot);
      } else {
        remaining.push(event);
      }
    }

    return { positioned, remaining };
  }

  // Create multi-event cards by grouping events
  private createMultiEventCards(
    events: Event[], 
    availableSlots: Slot[], 
    clusterId: string
  ): { positioned: PositionedCard[], remaining: Event[] } {
    const positioned: PositionedCard[] = [];
    const remaining: Event[] = [];

    const maxEventsPerCard = this.config.cardConfigs['multi-event'].maxEvents || 5;
    
    // Group events into multi-event cards
    for (let i = 0; i < events.length; i += maxEventsPerCard) {
      const eventGroup = events.slice(i, i + maxEventsPerCard);
      const availableSlot = availableSlots.find(slot => !slot.occupied);
      
      if (availableSlot && eventGroup.length > 1) {
        const multiCard: PositionedCard = {
          id: `multi-${clusterId}-${i}`,
          event: eventGroup,
          x: availableSlot.x,
          y: availableSlot.y,
          cardWidth: this.config.cardConfigs['multi-event'].width,
          cardHeight: this.config.cardConfigs['multi-event'].height,
          anchorX: availableSlot.x,
          anchorY: this.config.timelineY,
          cardType: 'multi-event',
          isMultiEvent: true,
          isSummaryCard: false,
          clusterId: clusterId
        };
        
        positioned.push(multiCard);
        this.slotGrid.occupySlot(availableSlot);
      } else {
        remaining.push(...eventGroup);
      }
    }

    return { positioned, remaining };
  }

  // Create infinite card for remaining events
  private createInfiniteCard(
    events: Event[], 
    availableSlots: Slot[], 
    clusterId: string
  ): PositionedCard | null {
    const availableSlot = availableSlots.find(slot => !slot.occupied);
    
    if (!availableSlot) return null;

    const infiniteCard: PositionedCard = {
      id: `infinite-${clusterId}`,
      event: events[0], // Representative event
      x: availableSlot.x,
      y: availableSlot.y,
      cardWidth: this.config.cardConfigs.infinite.width,
      cardHeight: this.config.cardConfigs.infinite.height,
      anchorX: availableSlot.x,
      anchorY: this.config.timelineY,
      cardType: 'infinite',
      isMultiEvent: false,
      isSummaryCard: true,
      clusterId: clusterId,
      eventCount: events.length
    };

    this.slotGrid.occupySlot(availableSlot);
    return infiniteCard;
  }

  // Assess cluster density and recommend degradation strategy
  assessClusterDensity(cluster: EventCluster): 'low' | 'medium' | 'high' | 'extreme' {
    const availableSlots = cluster.slots?.length || 0;
    const eventCount = cluster.events.length;
    
    return this.cardTypeSelector.assessClusterDensity(eventCount, availableSlots);
  }

  // Get degradation statistics
  getDegradationStats(positionedCards: PositionedCard[]) {
    const cardTypeCounts = positionedCards.reduce((acc, card) => {
      acc[card.cardType] = (acc[card.cardType] || 0) + 1;
      return acc;
    }, {} as Record<CardType, number>);

    const totalEvents = positionedCards.reduce((sum, card) => {
      if (Array.isArray(card.event)) {
        return sum + card.event.length;
      } else {
        return sum + 1;
      }
    }, 0);

    const degradationLevel = this.calculateDegradationLevel(cardTypeCounts);

    return {
      ...this.getDualColumnStats(positionedCards),
      cardTypeCounts,
      totalEventsRepresented: totalEvents,
      degradationLevel,
      hasDegradation: degradationLevel > 0,
      hasInfiniteCards: (cardTypeCounts.infinite || 0) > 0
    };
  }

  private calculateDegradationLevel(cardTypeCounts: Record<CardType, number>): number {
    if (cardTypeCounts.infinite > 0) return 4;      // Infinite cards
    if (cardTypeCounts['multi-event'] > 0) return 3; // Multi-event cards
    if (cardTypeCounts['title-only'] > 0) return 2;  // Title-only cards
    if (cardTypeCounts.compact > 0) return 1;        // Compact cards
    return 0; // Only full cards
  }

  // Validate degradation rules are followed
  validateDegradationRules(positionedCards: PositionedCard[]): {
    isValid: boolean;
    violations: string[];
  } {
    const violations: string[] = [];
    const cardTypeCounts = positionedCards.reduce((acc, card) => {
      acc[card.cardType] = (acc[card.cardType] || 0) + 1;
      return acc;
    }, {} as Record<CardType, number>);

    // Rule: Infinite cards should only appear when all others are multi-event
    if (cardTypeCounts.infinite > 0) {
      const hasNonMultiEvent = Object.entries(cardTypeCounts).some(
        ([type, count]) => type !== 'infinite' && type !== 'multi-event' && count > 0
      );
      
      if (hasNonMultiEvent) {
        violations.push('Infinite cards present without all other cards being multi-event');
      }
    }

    // Rule: Should follow degradation sequence
    const degradationOrder: CardType[] = ['full', 'compact', 'title-only', 'multi-event', 'infinite'];
    let lastSeenIndex = -1;
    
    for (const cardType of degradationOrder) {
      if (cardTypeCounts[cardType] > 0) {
        const currentIndex = degradationOrder.indexOf(cardType);
        if (currentIndex < lastSeenIndex) {
          violations.push(`Degradation sequence violated: ${cardType} appears after higher degradation level`);
        }
        lastSeenIndex = currentIndex;
      }
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  // Force a specific degradation level for testing
  forceCardType(cluster: EventCluster, forcedType: CardType): PositionedCard[] {
    // const positionedCards: PositionedCard[] = []; // Not used in this implementation
    cluster.slots = this.slotGrid.generateSlotsForAnchor(cluster.anchor);
    
    const sortedEvents = [...cluster.events].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (forcedType === 'multi-event') {
      return this.createMultiEventCards(sortedEvents, cluster.slots, cluster.id).positioned;
    } else if (forcedType === 'infinite') {
      const infiniteCard = this.createInfiniteCard(sortedEvents, cluster.slots, cluster.id);
      return infiniteCard ? [infiniteCard] : [];
    } else {
      return this.tryPlaceCards(sortedEvents, cluster.slots, forcedType, cluster.id).positioned;
    }
  }
}