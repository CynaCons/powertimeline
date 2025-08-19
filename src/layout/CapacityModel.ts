/**
 * Capacity Model for Deterministic Layout v5
 * 
 * Terminology:
 * - Cell: Base grid unit for capacity accounting (smallest unit of space)
 * - Footprint: Number of cells consumed by a placed card
 * - Placements: Available candidate positions per column group (e.g., 4 above + 4 below)
 * - Utilization: Percentage of total cells that are occupied
 */

import type { CardType } from './types';

// Card footprints in cells (vertical space consumed)
// Following ARCHITECTURE.md degradation math: 1→2→4→5 ratio
export const CARD_FOOTPRINTS: Record<CardType, number> = {
  'full': 4,        // Full card takes 4 cells (baseline)
  'compact': 2,     // Compact card takes 2 cells (2 compacts = 1 full space)
  'title-only': 1,  // Title-only card takes 1 cell (4 title-only = 1 full space)
  'multi-event': 4, // Multi-event card takes 4 cells (same as full, but holds 5 events)
  'infinite': 4     // Infinite overflow card takes 4 cells (same as multi-event)
};

// Available placements per column side (above or below timeline)
export const PLACEMENTS_PER_SIDE = 4; // 4 placement slots above, 4 below

// Degradation cascade with capacity requirements (1→2→4→5 mathematics)
export const DEGRADATION_CASCADE = [
  { type: 'full' as CardType, eventsPerCard: 1, footprint: 4 },
  { type: 'compact' as CardType, eventsPerCard: 1, footprint: 2 },
  { type: 'title-only' as CardType, eventsPerCard: 1, footprint: 1 },
  { type: 'multi-event' as CardType, eventsPerCard: 5, footprint: 4 },
  { type: 'infinite' as CardType, eventsPerCard: Infinity, footprint: 4 }
];

export interface CapacityMetrics {
  totalCells: number;
  usedCells: number;
  availableCells: number;
  utilization: number; // percentage 0-100
  cellsPerSide: number;
  placementsPerSide: number;
}

export interface ColumnCapacity {
  above: {
    totalCells: number;
    usedCells: number;
    availablePlacements: number[];
  };
  below: {
    totalCells: number;
    usedCells: number;
    availablePlacements: number[];
  };
}

export class CapacityModel {
  private cellsPerSide: number;
  private columns: Map<string, ColumnCapacity> = new Map();

  constructor(viewportHeight: number) {
    // Calculate available cells based on viewport
    // Assuming each side (above/below) gets half the viewport minus timeline space
    const availableHeight = (viewportHeight / 2) - 60; // Leave 60px margin for timeline
    // Assuming each cell is roughly 20px in height
    this.cellsPerSide = Math.floor(availableHeight / 20);
    // Ensure minimum of 4 cells per side
    this.cellsPerSide = Math.max(4, this.cellsPerSide);
  }

  /**
   * Initialize a new column with capacity tracking
   */
  initializeColumn(columnId: string): void {
    this.columns.set(columnId, {
      above: {
        totalCells: this.cellsPerSide,
        usedCells: 0,
        availablePlacements: Array.from({ length: PLACEMENTS_PER_SIDE }, (_, i) => i)
      },
      below: {
        totalCells: this.cellsPerSide,
        usedCells: 0,
        availablePlacements: Array.from({ length: PLACEMENTS_PER_SIDE }, (_, i) => i)
      }
    });
  }

  /**
   * Check if a card type can fit in the specified column and side
   */
  canFit(columnId: string, side: 'above' | 'below', cardType: CardType): boolean {
    const column = this.columns.get(columnId);
    if (!column) return false;

    const footprint = CARD_FOOTPRINTS[cardType];
    const sideCapacity = column[side];
    
    return (sideCapacity.totalCells - sideCapacity.usedCells) >= footprint &&
           sideCapacity.availablePlacements.length > 0;
  }

  /**
   * Allocate space for a card in the specified column and side
   */
  allocate(columnId: string, side: 'above' | 'below', cardType: CardType): number | null {
    const column = this.columns.get(columnId);
    if (!column || !this.canFit(columnId, side, cardType)) {
      return null;
    }

    const footprint = CARD_FOOTPRINTS[cardType];
    const sideCapacity = column[side];
    
    // Take the first available placement
    const placementIndex = sideCapacity.availablePlacements.shift();
    if (placementIndex === undefined) return null;

    // Update used cells
    sideCapacity.usedCells += footprint;
    
    return placementIndex;
  }

  /**
   * Get the best card type that can fit for the given number of events
   */
  getBestFitCardType(
    columnId: string,
    side: 'above' | 'below',
    eventCount: number
  ): CardType | null {
    // Try degradation cascade from best to worst
    for (const option of DEGRADATION_CASCADE) {
      const cardsNeeded = Math.ceil(eventCount / option.eventsPerCard);
      const totalFootprint = cardsNeeded * option.footprint;
      
      const column = this.columns.get(columnId);
      if (!column) continue;
      
      const availableCells = column[side].totalCells - column[side].usedCells;
      if (availableCells >= totalFootprint) {
        return option.type;
      }
    }
    
    return null;
  }

  /**
   * Calculate global capacity metrics across all columns
   */
  getGlobalMetrics(): CapacityMetrics {
    let totalCells = 0;
    let usedCells = 0;

    for (const column of this.columns.values()) {
      totalCells += column.above.totalCells + column.below.totalCells;
      usedCells += column.above.usedCells + column.below.usedCells;
    }

    return {
      totalCells,
      usedCells,
      availableCells: totalCells - usedCells,
      utilization: totalCells > 0 ? (usedCells / totalCells) * 100 : 0,
      cellsPerSide: this.cellsPerSide,
      placementsPerSide: PLACEMENTS_PER_SIDE
    };
  }

  /**
   * Get capacity metrics for a specific column
   */
  getColumnMetrics(columnId: string): CapacityMetrics | null {
    const column = this.columns.get(columnId);
    if (!column) return null;

    const totalCells = column.above.totalCells + column.below.totalCells;
    const usedCells = column.above.usedCells + column.below.usedCells;

    return {
      totalCells,
      usedCells,
      availableCells: totalCells - usedCells,
      utilization: totalCells > 0 ? (usedCells / totalCells) * 100 : 0,
      cellsPerSide: this.cellsPerSide,
      placementsPerSide: PLACEMENTS_PER_SIDE
    };
  }

  /**
   * Apply promotion pass to improve readability when utilization is low
   */
  applyPromotion(
    cards: Array<{ type: CardType; eventCount: number }>,
    utilizationThreshold: number = 80
  ): Array<{ type: CardType; eventCount: number; promoted: boolean }> {
    const metrics = this.getGlobalMetrics();
    
    // If utilization is above threshold, no promotion
    if (metrics.utilization >= utilizationThreshold) {
      return cards.map(card => ({ ...card, promoted: false }));
    }

    // Calculate available budget for promotion
    const promotionBudget = Math.floor((metrics.availableCells * 0.5)); // Use up to 50% of available space
    let budgetUsed = 0;

    return cards.map(card => {
      // Try to promote to better card type
      const currentFootprint = CARD_FOOTPRINTS[card.type];
      
      // Find next better type in cascade
      const currentIndex = DEGRADATION_CASCADE.findIndex(d => d.type === card.type);
      if (currentIndex <= 0) return { ...card, promoted: false }; // Already best type
      
      const betterOption = DEGRADATION_CASCADE[currentIndex - 1];
      const additionalCost = betterOption.footprint - currentFootprint;
      
      if (budgetUsed + additionalCost <= promotionBudget) {
        budgetUsed += additionalCost;
        return {
          type: betterOption.type,
          eventCount: card.eventCount,
          promoted: true
        };
      }
      
      return { ...card, promoted: false };
    });
  }

  /**
   * Reset all capacity tracking
   */
  reset(): void {
    this.columns.clear();
  }
}