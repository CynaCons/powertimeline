import type { CardType } from './types';

/**
 * Corrected Slot System
 * Phase 1.3: Updated slot allocation with corrected user specifications
 * Full(4), Compact(8), Title-only(8), Multi-event(4)
 */

export interface SlotAllocation {
  slotsAbove: number;
  slotsBelow: number;
  totalSlots: number;
  eventsPerCard: number;
  cardHeight: number;      // Height in pixels
  cardWidth: number;       // Width in pixels
  contentType: 'full' | 'compact' | 'title-only' | 'multi-event';
}

export interface SlotOccupancy {
  slotId: string;
  isOccupied: boolean;
  cardType?: CardType;
  cardId?: string;
  section: 'above' | 'below';
  slotIndex: number;
}

export interface SlotGrid {
  above: SlotOccupancy[];
  below: SlotOccupancy[];
  totalSlots: number;
  occupiedSlots: number;
  utilizationPercentage: number;
}

export class CorrectedSlotSystem {
  // Corrected slot allocations per user specifications
  private readonly SLOT_ALLOCATIONS: Record<CardType, SlotAllocation> = {
    full: {
      slotsAbove: 2,
      slotsBelow: 2, 
      totalSlots: 4,
      eventsPerCard: 1,
      cardHeight: 100,     // Base height
      cardWidth: 200,
      contentType: 'full'
    },
    compact: {
      slotsAbove: 4,
      slotsBelow: 4,
      totalSlots: 8,
      eventsPerCard: 2,
      cardHeight: 50,      // Half height of full cards
      cardWidth: 200,
      contentType: 'compact'
    },
    'title-only': {
      slotsAbove: 4,
      slotsBelow: 4,
      totalSlots: 8,
      eventsPerCard: 4,
      cardHeight: 35,      // Smaller than compact cards
      cardWidth: 200,
      contentType: 'title-only'
    },
    'multi-event': {
      slotsAbove: 2,
      slotsBelow: 2,
      totalSlots: 4,
      eventsPerCard: 5,    // Max 5 events per card
      cardHeight: 100,     // Same as full cards
      cardWidth: 200,
      contentType: 'multi-event'
    },
    infinite: {
      slotsAbove: 1,
      slotsBelow: 1,
      totalSlots: 2,
      eventsPerCard: 999,
      cardHeight: 60,
      cardWidth: 200,
      contentType: 'multi-event'
    }
  };

  /**
   * Get slot allocation for a specific card type
   */
  getSlotAllocation(cardType: CardType): SlotAllocation {
    return this.SLOT_ALLOCATIONS[cardType];
  }

  /**
   * Create empty slot grid for a column
   */
  createSlotGrid(maxSlotsAbove: number = 10, maxSlotsBelow: number = 10): SlotGrid {
    const above: SlotOccupancy[] = [];
    const below: SlotOccupancy[] = [];

    // Create above slots
    for (let i = 0; i < maxSlotsAbove; i++) {
      above.push({
        slotId: `above-${i}`,
        isOccupied: false,
        section: 'above',
        slotIndex: i
      });
    }

    // Create below slots
    for (let i = 0; i < maxSlotsBelow; i++) {
      below.push({
        slotId: `below-${i}`,
        isOccupied: false,
        section: 'below',
        slotIndex: i
      });
    }

    return {
      above,
      below,
      totalSlots: maxSlotsAbove + maxSlotsBelow,
      occupiedSlots: 0,
      utilizationPercentage: 0
    };
  }

  /**
   * Check if slots are available for a card type
   */
  checkSlotAvailability(
    grid: SlotGrid, 
    cardType: CardType, 
    preferredSection?: 'above' | 'below'
  ): {
    canFit: boolean;
    availableAbove: number;
    availableBelow: number;
    recommendedSection: 'above' | 'below';
    requiredSlots: SlotAllocation;
  } {
    const allocation = this.SLOT_ALLOCATIONS[cardType];
    
    // Count available slots in each section
    const availableAbove = grid.above.filter(slot => !slot.isOccupied).length;
    const availableBelow = grid.below.filter(slot => !slot.isOccupied).length;

    // Check if card can fit
    const canFitAbove = availableAbove >= allocation.slotsAbove;
    const canFitBelow = availableBelow >= allocation.slotsBelow;
    const canFit = canFitAbove && canFitBelow;

    // Determine recommended section based on availability and preference
    let recommendedSection: 'above' | 'below' = 'above';
    
    if (preferredSection) {
      recommendedSection = preferredSection;
    } else {
      // Place in section with more available space
      recommendedSection = availableAbove >= availableBelow ? 'above' : 'below';
    }

    return {
      canFit,
      availableAbove,
      availableBelow,
      recommendedSection,
      requiredSlots: allocation
    };
  }

  /**
   * Occupy slots for a card placement
   */
  occupySlots(
    grid: SlotGrid,
    cardType: CardType,
    cardId: string,
    section: 'above' | 'below'
  ): {
    success: boolean;
    occupiedSlots: string[];
    updatedGrid: SlotGrid;
  } {
    const allocation = this.SLOT_ALLOCATIONS[cardType];
    const slotsNeeded = section === 'above' ? allocation.slotsAbove : allocation.slotsBelow;
    const targetSlots = section === 'above' ? grid.above : grid.below;

    // Find available slots
    const availableSlots = targetSlots
      .filter(slot => !slot.isOccupied)
      .slice(0, slotsNeeded);

    if (availableSlots.length < slotsNeeded) {
      return {
        success: false,
        occupiedSlots: [],
        updatedGrid: grid
      };
    }

    // Create updated grid
    const updatedGrid = { ...grid };
    const occupiedSlotIds: string[] = [];

    // Mark slots as occupied
    availableSlots.forEach(slot => {
      const targetArray = section === 'above' ? updatedGrid.above : updatedGrid.below;
      const slotIndex = targetArray.findIndex(s => s.slotId === slot.slotId);
      
      if (slotIndex !== -1) {
        targetArray[slotIndex] = {
          ...slot,
          isOccupied: true,
          cardType,
          cardId
        };
        occupiedSlotIds.push(slot.slotId);
      }
    });

    // Update grid statistics
    updatedGrid.occupiedSlots = 
      updatedGrid.above.filter(s => s.isOccupied).length +
      updatedGrid.below.filter(s => s.isOccupied).length;
    
    updatedGrid.utilizationPercentage = 
      (updatedGrid.occupiedSlots / updatedGrid.totalSlots) * 100;

    return {
      success: true,
      occupiedSlots: occupiedSlotIds,
      updatedGrid
    };
  }

  /**
   * Release slots for a card removal
   */
  releaseSlots(grid: SlotGrid, cardId: string): SlotGrid {
    const updatedGrid = { ...grid };

    // Release slots in above section
    updatedGrid.above = updatedGrid.above.map(slot => 
      slot.cardId === cardId ? {
        ...slot,
        isOccupied: false,
        cardType: undefined,
        cardId: undefined
      } : slot
    );

    // Release slots in below section
    updatedGrid.below = updatedGrid.below.map(slot => 
      slot.cardId === cardId ? {
        ...slot,
        isOccupied: false,
        cardType: undefined,
        cardId: undefined
      } : slot
    );

    // Update statistics
    updatedGrid.occupiedSlots = 
      updatedGrid.above.filter(s => s.isOccupied).length +
      updatedGrid.below.filter(s => s.isOccupied).length;
    
    updatedGrid.utilizationPercentage = 
      (updatedGrid.occupiedSlots / updatedGrid.totalSlots) * 100;

    return updatedGrid;
  }

  /**
   * Calculate degradation options for a set of events
   */
  calculateDegradationOptions(eventCount: number): {
    option: string;
    cardType: CardType;
    cardCount: number;
    slotsRequired: number;
    eventsHandled: number;
  }[] {
    const options = [];

    // Option 1: Full cards
    const fullCards = eventCount;
    options.push({
      option: 'Full Cards',
      cardType: 'full' as CardType,
      cardCount: fullCards,
      slotsRequired: fullCards * 4,
      eventsHandled: fullCards
    });

    // Option 2: Compact cards
    const compactCards = Math.ceil(eventCount / 2);
    options.push({
      option: 'Compact Cards',
      cardType: 'compact' as CardType,
      cardCount: compactCards,
      slotsRequired: compactCards * 8,
      eventsHandled: eventCount
    });

    // Option 3: Title-only cards
    const titleCards = Math.ceil(eventCount / 4);
    options.push({
      option: 'Title-Only Cards',
      cardType: 'title-only' as CardType,
      cardCount: titleCards,
      slotsRequired: titleCards * 8,
      eventsHandled: eventCount
    });

    // Option 4: Multi-event cards
    const multiCards = Math.ceil(eventCount / 5);
    options.push({
      option: 'Multi-Event Cards',
      cardType: 'multi-event' as CardType,
      cardCount: multiCards,
      slotsRequired: multiCards * 4,
      eventsHandled: eventCount
    });

    return options.sort((a, b) => a.slotsRequired - b.slotsRequired);
  }

  /**
   * Get optimal card type for given event count and available slots
   */
  getOptimalCardType(eventCount: number, availableSlots: number): {
    cardType: CardType;
    explanation: string;
    slotsUsed: number;
    cardsCreated: number;
  } {
    const options = this.calculateDegradationOptions(eventCount);
    
    // Find first option that fits in available slots
    for (const option of options) {
      if (option.slotsRequired <= availableSlots) {
        return {
          cardType: option.cardType,
          explanation: `${option.option}: ${option.cardCount} cards using ${option.slotsRequired} slots`,
          slotsUsed: option.slotsRequired,
          cardsCreated: option.cardCount
        };
      }
    }

    // If nothing fits, use multi-event as last resort
    const lastOption = options[options.length - 1];
    return {
      cardType: lastOption.cardType,
      explanation: `${lastOption.option} (forced): ${lastOption.cardCount} cards using ${lastOption.slotsRequired} slots`,
      slotsUsed: lastOption.slotsRequired,
      cardsCreated: lastOption.cardCount
    };
  }

  /**
   * Validate slot system integrity
   */
  validateSlotSystem(grid: SlotGrid): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for duplicate slot IDs
    const allSlotIds = [...grid.above, ...grid.below].map(s => s.slotId);
    const uniqueSlotIds = new Set(allSlotIds);
    if (allSlotIds.length !== uniqueSlotIds.size) {
      errors.push('Duplicate slot IDs detected');
    }

    // Check for consistent occupancy counts
    const actualOccupied = [...grid.above, ...grid.below].filter(s => s.isOccupied).length;
    if (actualOccupied !== grid.occupiedSlots) {
      errors.push(`Occupancy count mismatch: expected ${grid.occupiedSlots}, actual ${actualOccupied}`);
    }

    // Check for orphaned cards (occupied slots without card IDs)
    const orphanedSlots = [...grid.above, ...grid.below].filter(s => 
      s.isOccupied && !s.cardId
    );
    if (orphanedSlots.length > 0) {
      warnings.push(`${orphanedSlots.length} occupied slots without card IDs`);
    }

    // Check utilization percentage
    const expectedUtilization = (actualOccupied / grid.totalSlots) * 100;
    if (Math.abs(expectedUtilization - grid.utilizationPercentage) > 0.1) {
      warnings.push('Utilization percentage calculation mismatch');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get all slot allocations for reference
   */
  getAllSlotAllocations(): Record<CardType, SlotAllocation> {
    return { ...this.SLOT_ALLOCATIONS };
  }
}