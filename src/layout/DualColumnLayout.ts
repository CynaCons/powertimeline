import type { Event } from '../types';
import type { PositionedCard, EventCluster, LayoutConfig, CardType, Slot } from './types';
import { SingleColumnLayout } from './SingleColumnLayout';

export class DualColumnLayout extends SingleColumnLayout {
  constructor(config: LayoutConfig) {
    super(config);
  }

  // Position events in dual columns when single column is full
  positionClusterDualColumn(cluster: EventCluster): PositionedCard[] {
    const positionedCards: PositionedCard[] = [];
    
    // Generate slots for this cluster (includes dual column slots)
    cluster.slots = this.slotGrid.generateSlotsForAnchor(cluster.anchor);
    
    // Sort events chronologically
    const sortedEvents = [...cluster.events].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Check if we have horizontal space for dual columns
    if (!this.hasHorizontalSpaceForDualColumns(cluster.anchor)) {
      // Fall back to single column if no space
      return this.positionCluster(cluster);
    }

    // Try to fill single column first, then expand to dual columns
    let remainingEvents = [...sortedEvents];
    
    // Fill single column (column 0)
    const singleColumnSlots = cluster.slots.filter(slot => slot.column === 0);
    for (const slot of singleColumnSlots) {
      if (remainingEvents.length === 0) break;
      
      const event = remainingEvents.shift()!;
      const card = this.createPositionedCard(event, slot, 'full', cluster.id);
      positionedCards.push(card);
      this.slotGrid.occupySlot(slot);
    }

    // If events remain, use dual columns (columns -1 and +1)
    if (remainingEvents.length > 0) {
      const dualColumnSlots = cluster.slots.filter(slot => slot.column !== 0);
      
      // Alternate between left (-1) and right (+1) columns for balance
      const leftSlots = dualColumnSlots.filter(slot => slot.column === -1);
      const rightSlots = dualColumnSlots.filter(slot => slot.column === 1);
      
      let leftIndex = 0;
      let rightIndex = 0;
      let useLeft = true;
      
      for (const event of remainingEvents) {
        let slot: Slot | undefined;
        
        // Alternate between left and right, but use available slots
        if (useLeft && leftIndex < leftSlots.length) {
          slot = leftSlots[leftIndex++];
        } else if (rightIndex < rightSlots.length) {
          slot = rightSlots[rightIndex++];
        } else if (leftIndex < leftSlots.length) {
          slot = leftSlots[leftIndex++];
        }
        
        if (slot) {
          const card = this.createPositionedCard(event, slot, 'full', cluster.id);
          positionedCards.push(card);
          this.slotGrid.occupySlot(slot);
        }
        
        useLeft = !useLeft; // Alternate for next iteration
      }
    }

    return positionedCards;
  }

  private hasHorizontalSpaceForDualColumns(anchor: { x: number }): boolean {
    const requiredWidth = this.config.cardConfigs.full.width * 2 + this.config.columnSpacing;
    const leftEdge = anchor.x - requiredWidth / 2;
    const rightEdge = anchor.x + requiredWidth / 2;
    
    return leftEdge >= 50 && rightEdge <= this.config.viewportWidth - 50; // 50px margins
  }

  // Check if cluster needs dual column layout
  needsDualColumnLayout(cluster: EventCluster): boolean {
    const singleColumnCapacity = this.getSingleColumnCapacity();
    return cluster.events.length > singleColumnCapacity;
  }

  // Get dual column capacity
  getDualColumnCapacity(): number {
    return this.getSingleColumnCapacity() * 3; // Single + left + right columns
  }

  // Position cluster with automatic single/dual column selection
  positionClusterAdaptive(cluster: EventCluster): PositionedCard[] {
    if (this.needsDualColumnLayout(cluster) && this.hasHorizontalSpaceForDualColumns(cluster.anchor)) {
      return this.positionClusterDualColumn(cluster);
    } else {
      return this.positionCluster(cluster);
    }
  }

  // Calculate column offsets for dual column layout
  calculateColumnOffsets(anchorX: number): { left: number, center: number, right: number } {
    const cardWidth = this.config.cardConfigs.full.width;
    const spacing = this.config.columnSpacing;
    
    return {
      left: anchorX - (cardWidth + spacing),
      center: anchorX,
      right: anchorX + (cardWidth + spacing)
    };
  }

  // Create positioned card with column-specific anchoring
  protected createPositionedCard(
    event: Event,
    slot: Slot,
    cardType: CardType,
    clusterId: string
  ): PositionedCard {
    const cardConfig = this.config.cardConfigs[cardType];
    
    // Calculate anchor position based on column
    let anchorX = slot.x;
    if (slot.column !== 0) {
      // For dual columns, anchor to the cluster center
      const clusterAnchorX = slot.clusterId ? 
        this.findClusterAnchorX(slot.clusterId) : slot.x;
      anchorX = clusterAnchorX;
    }
    
    return {
      id: event.id,
      event: event,
      x: slot.x,
      y: slot.y,
      cardWidth: cardConfig.width,
      cardHeight: cardConfig.height,
      anchorX: anchorX,
      anchorY: this.config.timelineY,
      cardType: cardType,
      isMultiEvent: false,
      isSummaryCard: false,
      clusterId: clusterId
    };
  }

  private findClusterAnchorX(_clusterId: string): number {
    // In a real implementation, this would look up the cluster anchor
    // For now, return a default value
    return this.config.viewportWidth / 2;
  }

  // Check if all events in cluster can fit in dual columns
  canFitInDualColumns(cluster: EventCluster): boolean {
    const dualColumnCapacity = this.getDualColumnCapacity();
    return cluster.events.length <= dualColumnCapacity;
  }

  // Get layout statistics for dual column layout
  getDualColumnStats(positionedCards: PositionedCard[]) {
    const columnCounts = positionedCards.reduce((acc, card) => {
      // Determine column based on card position relative to anchor
      const column = card.x < card.anchorX ? 'left' : 
                    card.x > card.anchorX ? 'right' : 'center';
      acc[column] = (acc[column] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      ...this.getLayoutStats(positionedCards),
      columnDistribution: columnCounts,
      isDualColumnLayout: Object.keys(columnCounts).length > 1
    };
  }
}