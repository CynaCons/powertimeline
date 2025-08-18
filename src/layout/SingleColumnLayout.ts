import type { Event } from '../types';
import type { PositionedCard, EventCluster, LayoutConfig, CardType } from './types';
import { SlotGrid } from './SlotGrid';

export class SingleColumnLayout {
  protected slotGrid: SlotGrid;
  protected config: LayoutConfig;

  constructor(config: LayoutConfig) {
    this.config = config;
    this.slotGrid = new SlotGrid(config);
  }

  // Position events in a single column above/below anchor
  positionCluster(cluster: EventCluster): PositionedCard[] {
    const positionedCards: PositionedCard[] = [];
    
    // Generate slots for this cluster
    cluster.slots = this.slotGrid.generateSlotsForAnchor(cluster.anchor);
    
    // Sort events chronologically for consistent placement
    const sortedEvents = [...cluster.events].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Try to place each event as a full card in single column (column 0 only)
    const singleColumnSlots = cluster.slots.filter(slot => slot.column === 0);
    
    for (let i = 0; i < sortedEvents.length; i++) {
      const event = sortedEvents[i];
      const availableSlot = singleColumnSlots.find(slot => !slot.occupied);
      
      if (availableSlot) {
        // Place as full card
        const card = this.createPositionedCard(
          event,
          availableSlot,
          'full',
          cluster.id
        );
        
        positionedCards.push(card);
        this.slotGrid.occupySlot(availableSlot);
      }
      // If no slots available, we'll handle this in dual column or degradation phases
    }

    return positionedCards;
  }

  protected createPositionedCard(
    event: Event,
    slot: any,
    cardType: CardType,
    clusterId: string
  ): PositionedCard {
    const cardConfig = this.config.cardConfigs[cardType];
    
    return {
      id: event.id,
      event: event,
      x: slot.x,
      y: slot.y,
      cardWidth: cardConfig.width,
      cardHeight: cardConfig.height,
      anchorX: slot.x, // In single column, anchor X = slot X
      anchorY: this.config.timelineY,
      cardType: cardType,
      isMultiEvent: false,
      isSummaryCard: false,
      clusterId: clusterId
    };
  }

  // Check if cluster can fit all events in single column
  canFitInSingleColumn(cluster: EventCluster): boolean {
    const singleColumnSlots = cluster.slots?.filter(slot => slot.column === 0) || [];
    return cluster.events.length <= singleColumnSlots.length;
  }

  // Get single column capacity
  getSingleColumnCapacity(): number {
    const availableHeightPerSide = (this.config.viewportHeight / 2) - 50;
    const slotsPerSide = Math.floor(availableHeightPerSide / (this.config.cardConfigs.full.height + this.config.rowSpacing));
    return slotsPerSide * 2; // Above + below timeline
  }

  // Simple collision detection for positioned cards
  hasCollision(card1: PositionedCard, card2: PositionedCard): boolean {
    const margin = 5; // Small margin to prevent touching
    
    return !(
      card1.x + card1.cardWidth/2 + margin < card2.x - card2.cardWidth/2 ||
      card2.x + card2.cardWidth/2 + margin < card1.x - card1.cardWidth/2 ||
      card1.y + card1.cardHeight/2 + margin < card2.y - card2.cardHeight/2 ||
      card2.y + card2.cardHeight/2 + margin < card1.y - card1.cardHeight/2
    );
  }

  // Validate no overlaps in positioned cards
  validateNoOverlaps(cards: PositionedCard[]): boolean {
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        if (this.hasCollision(cards[i], cards[j])) {
          console.warn(`Collision detected between cards ${cards[i].id} and ${cards[j].id}`);
          return false;
        }
      }
    }
    return true;
  }

  // Get layout statistics
  getLayoutStats(positionedCards: PositionedCard[]) {
    return {
      totalCards: positionedCards.length,
      cardTypes: positionedCards.reduce((acc, card) => {
        acc[card.cardType] = (acc[card.cardType] || 0) + 1;
        return acc;
      }, {} as Record<CardType, number>),
      hasOverlaps: !this.validateNoOverlaps(positionedCards),
      utilization: this.slotGrid.getUtilization()
    };
  }

  // Clear slot grid
  clear(): void {
    this.slotGrid.clear();
  }
}