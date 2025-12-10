import { describe, it, expect, beforeEach } from 'vitest';
import {
  CapacityModel,
  CARD_FOOTPRINTS,
  PLACEMENTS_PER_SIDE,
  LAYOUT_CONSTANTS,
  DEGRADATION_CASCADE,
} from './CapacityModel';
import type { CardType } from './types';

describe('CapacityModel', () => {
  let capacityModel: CapacityModel;
  const viewportHeight = 800;

  beforeEach(() => {
    capacityModel = new CapacityModel(viewportHeight);
  });

  describe('constructor', () => {
    it('calculates cells per side based on viewport height', () => {
      const model = new CapacityModel(800);
      const metrics = model.getGlobalMetrics();

      expect(metrics.cellsPerSide).toBeGreaterThanOrEqual(LAYOUT_CONSTANTS.MIN_CELLS_PER_SIDE);
      expect(metrics.cellsPerSide).toBeLessThanOrEqual(LAYOUT_CONSTANTS.MAX_CELLS_PER_SIDE);
    });

    it('respects minimum cells per side', () => {
      // Very small viewport should hit minimum
      const model = new CapacityModel(100);
      const metrics = model.getGlobalMetrics();

      expect(metrics.cellsPerSide).toBe(LAYOUT_CONSTANTS.MIN_CELLS_PER_SIDE);
    });

    it('respects maximum cells per side', () => {
      // Very large viewport should hit maximum
      const model = new CapacityModel(5000);
      const metrics = model.getGlobalMetrics();

      expect(metrics.cellsPerSide).toBe(LAYOUT_CONSTANTS.MAX_CELLS_PER_SIDE);
    });
  });

  describe('initializeColumn', () => {
    it('initializes column with correct structure', () => {
      capacityModel.initializeColumn('col1');
      const metrics = capacityModel.getColumnMetrics('col1');

      expect(metrics).not.toBeNull();
      expect(metrics!.totalCells).toBeGreaterThan(0);
      expect(metrics!.usedCells).toBe(0);
      expect(metrics!.availableCells).toBe(metrics!.totalCells);
      expect(metrics!.utilization).toBe(0);
    });

    it('initializes both above and below sides', () => {
      capacityModel.initializeColumn('col1');

      expect(capacityModel.canFit('col1', 'above', 'title-only')).toBe(true);
      expect(capacityModel.canFit('col1', 'below', 'title-only')).toBe(true);
    });

    it('initializes correct number of placements per side', () => {
      capacityModel.initializeColumn('col1');
      const metrics = capacityModel.getColumnMetrics('col1');

      expect(metrics!.placementsPerSide).toBe(PLACEMENTS_PER_SIDE);
    });
  });

  describe('canFit', () => {
    beforeEach(() => {
      capacityModel.initializeColumn('col1');
    });

    it('returns false for non-existent column', () => {
      expect(capacityModel.canFit('non-existent', 'above', 'title-only')).toBe(false);
    });

    it('returns true when space is available', () => {
      expect(capacityModel.canFit('col1', 'above', 'title-only')).toBe(true);
      expect(capacityModel.canFit('col1', 'above', 'compact')).toBe(true);
      expect(capacityModel.canFit('col1', 'above', 'full')).toBe(true);
    });

    it('returns false when insufficient cells available', () => {
      // Fill up the column by allocating all available cells
      const metrics = capacityModel.getColumnMetrics('col1');
      const maxCells = metrics!.totalCells;

      // Allocate cards until full
      let allocated = 0;
      while (allocated < maxCells && capacityModel.canFit('col1', 'above', 'title-only')) {
        capacityModel.allocate('col1', 'above', 'title-only');
        allocated += CARD_FOOTPRINTS['title-only'];
      }

      // Should not be able to fit more
      expect(capacityModel.canFit('col1', 'above', 'full')).toBe(false);
    });

    it('checks both cell availability and placement slots', () => {
      // Allocate all placements
      for (let i = 0; i < PLACEMENTS_PER_SIDE; i++) {
        capacityModel.allocate('col1', 'above', 'title-only');
      }

      // Even if cells are available, no placement slots remain
      expect(capacityModel.canFit('col1', 'above', 'title-only')).toBe(false);
    });
  });

  describe('allocate', () => {
    beforeEach(() => {
      capacityModel.initializeColumn('col1');
    });

    it('returns placement index when successful', () => {
      const placementIndex = capacityModel.allocate('col1', 'above', 'title-only');

      expect(placementIndex).not.toBeNull();
      expect(placementIndex).toBeGreaterThanOrEqual(0);
      expect(placementIndex).toBeLessThan(PLACEMENTS_PER_SIDE);
    });

    it('returns null for non-existent column', () => {
      const result = capacityModel.allocate('non-existent', 'above', 'title-only');
      expect(result).toBeNull();
    });

    it('returns null when insufficient space', () => {
      // Fill the column completely
      const metrics = capacityModel.getColumnMetrics('col1');
      const maxCells = metrics!.totalCells;

      let allocated = 0;
      while (allocated < maxCells && capacityModel.canFit('col1', 'above', 'title-only')) {
        capacityModel.allocate('col1', 'above', 'title-only');
        allocated += CARD_FOOTPRINTS['title-only'];
      }

      const result = capacityModel.allocate('col1', 'above', 'full');
      expect(result).toBeNull();
    });

    it('updates used cells correctly', () => {
      const beforeMetrics = capacityModel.getColumnMetrics('col1')!;
      const initialUsed = beforeMetrics.usedCells;

      capacityModel.allocate('col1', 'above', 'compact');

      const afterMetrics = capacityModel.getColumnMetrics('col1')!;
      expect(afterMetrics.usedCells).toBe(initialUsed + CARD_FOOTPRINTS['compact']);
    });

    it('consumes placement slots sequentially', () => {
      const placement1 = capacityModel.allocate('col1', 'above', 'title-only');
      const placement2 = capacityModel.allocate('col1', 'above', 'title-only');

      expect(placement1).toBe(0);
      expect(placement2).toBe(1);
    });

    it('handles different card types with correct footprints', () => {
      const beforeMetrics = capacityModel.getColumnMetrics('col1')!;

      // Allocate to 'above' side only - getColumnMetrics returns both above + below
      capacityModel.allocate('col1', 'above', 'title-only');
      capacityModel.allocate('col1', 'above', 'compact');
      // Don't allocate 'full' as it may fail due to placement slots

      const afterMetrics = capacityModel.getColumnMetrics('col1')!;
      const expectedUsed = CARD_FOOTPRINTS['title-only'] + CARD_FOOTPRINTS['compact'];

      expect(afterMetrics.usedCells - beforeMetrics.usedCells).toBe(expectedUsed);
    });
  });

  describe('getBestFitCardType', () => {
    beforeEach(() => {
      capacityModel.initializeColumn('col1');
    });

    it('returns best card type when space available', () => {
      const cardType = capacityModel.getBestFitCardType('col1', 'above', 1);
      expect(cardType).toBe('full'); // Best type for single event
    });

    it('returns null for non-existent column', () => {
      const result = capacityModel.getBestFitCardType('non-existent', 'above', 1);
      expect(result).toBeNull();
    });

    it('degrades to smaller card types when space is limited', () => {
      // Fill most of the space
      const metrics = capacityModel.getColumnMetrics('col1')!;
      const cellsToLeave = 2; // Only room for compact or title-only

      let allocated = 0;
      while (metrics.totalCells - allocated - cellsToLeave >= CARD_FOOTPRINTS['title-only'] &&
             capacityModel.canFit('col1', 'above', 'title-only')) {
        capacityModel.allocate('col1', 'above', 'title-only');
        allocated += CARD_FOOTPRINTS['title-only'];
      }

      const cardType = capacityModel.getBestFitCardType('col1', 'above', 1);

      // Should degrade to compact or title-only, not full
      expect(cardType).not.toBe('full');
    });

    it('returns null when insufficient cells available', () => {
      // Allocate full cards until we have less than 1 cell remaining
      while (capacityModel.canFit('col1', 'above', 'full')) {
        capacityModel.allocate('col1', 'above', 'full');
      }

      // Fill remaining space
      while (capacityModel.canFit('col1', 'above', 'title-only')) {
        capacityModel.allocate('col1', 'above', 'title-only');
      }

      // Now no space for any card type
      const cardType = capacityModel.getBestFitCardType('col1', 'above', 1);

      // Should return null since no capacity remains
      // Note: getBestFitCardType only checks cells, not placement slots
      expect(cardType).toBeNull();
    });
  });

  describe('getGlobalMetrics', () => {
    it('returns zero metrics when no columns initialized', () => {
      const metrics = capacityModel.getGlobalMetrics();

      expect(metrics.totalCells).toBe(0);
      expect(metrics.usedCells).toBe(0);
      expect(metrics.availableCells).toBe(0);
      expect(metrics.utilization).toBe(0);
    });

    it('aggregates metrics across multiple columns', () => {
      capacityModel.initializeColumn('col1');
      capacityModel.initializeColumn('col2');

      const metrics = capacityModel.getGlobalMetrics();

      expect(metrics.totalCells).toBeGreaterThan(0);
      expect(metrics.cellsPerSide).toBeGreaterThan(0);
      expect(metrics.placementsPerSide).toBe(PLACEMENTS_PER_SIDE);
    });

    it('calculates utilization correctly', () => {
      capacityModel.initializeColumn('col1');
      capacityModel.allocate('col1', 'above', 'full');

      const metrics = capacityModel.getGlobalMetrics();

      expect(metrics.utilization).toBeGreaterThan(0);
      expect(metrics.utilization).toBeLessThanOrEqual(100);
      expect(metrics.usedCells).toBe(CARD_FOOTPRINTS['full']);
      expect(metrics.availableCells).toBe(metrics.totalCells - metrics.usedCells);
    });
  });

  describe('getColumnMetrics', () => {
    it('returns null for non-existent column', () => {
      const metrics = capacityModel.getColumnMetrics('non-existent');
      expect(metrics).toBeNull();
    });

    it('returns correct metrics for initialized column', () => {
      capacityModel.initializeColumn('col1');
      const metrics = capacityModel.getColumnMetrics('col1');

      expect(metrics).not.toBeNull();
      expect(metrics!.totalCells).toBeGreaterThan(0);
      expect(metrics!.usedCells).toBe(0);
      expect(metrics!.availableCells).toBe(metrics!.totalCells);
      expect(metrics!.utilization).toBe(0);
    });

    it('updates metrics after allocations', () => {
      capacityModel.initializeColumn('col1');
      capacityModel.allocate('col1', 'above', 'compact');

      const metrics = capacityModel.getColumnMetrics('col1')!;

      expect(metrics.usedCells).toBe(CARD_FOOTPRINTS['compact']);
      expect(metrics.availableCells).toBe(metrics.totalCells - CARD_FOOTPRINTS['compact']);
      expect(metrics.utilization).toBeGreaterThan(0);
    });
  });

  describe('applyPromotion', () => {
    beforeEach(() => {
      capacityModel.initializeColumn('col1');
    });

    it('does not promote when utilization is above threshold', () => {
      // Fill most of the space
      while (capacityModel.canFit('col1', 'above', 'full')) {
        capacityModel.allocate('col1', 'above', 'full');
      }
      while (capacityModel.canFit('col1', 'below', 'full')) {
        capacityModel.allocate('col1', 'below', 'full');
      }

      // Get actual utilization
      const metricsAfter = capacityModel.getGlobalMetrics();

      // Use a threshold lower than actual utilization
      // Since PLACEMENTS_PER_SIDE limits to ~66% max, use 50% threshold
      const thresholdToUse = Math.min(metricsAfter.utilization - 10, 50);

      const cards = [{ type: 'title-only' as CardType, eventCount: 1 }];
      const result = capacityModel.applyPromotion(cards, thresholdToUse);

      // When utilization is above threshold, should not promote
      expect(result[0].promoted).toBe(false);
      expect(result[0].type).toBe('title-only');
    });

    it('promotes cards when utilization is below threshold', () => {
      // Keep utilization low
      capacityModel.allocate('col1', 'above', 'title-only');

      const cards = [{ type: 'title-only' as CardType, eventCount: 1 }];
      const result = capacityModel.applyPromotion(cards, 80);

      expect(result[0].promoted).toBe(true);
      expect(result[0].type).not.toBe('title-only');
    });

    it('does not promote cards already at best type', () => {
      const cards = [{ type: 'full' as CardType, eventCount: 1 }];
      const result = capacityModel.applyPromotion(cards, 80);

      expect(result[0].promoted).toBe(false);
      expect(result[0].type).toBe('full');
    });

    it('respects promotion budget', () => {
      // Use most of available space
      const metrics = capacityModel.getGlobalMetrics();
      const targetUsed = Math.ceil(metrics.totalCells * 0.7);

      let allocated = 0;
      while (allocated < targetUsed && capacityModel.canFit('col1', 'above', 'title-only')) {
        capacityModel.allocate('col1', 'above', 'title-only');
        allocated += CARD_FOOTPRINTS['title-only'];
      }

      // Try to promote many cards - should stop when budget is exhausted
      const cards = Array(10).fill({ type: 'title-only' as CardType, eventCount: 1 });
      const result = capacityModel.applyPromotion(cards, 80);

      const promotedCount = result.filter(c => c.promoted).length;
      expect(promotedCount).toBeLessThan(cards.length); // Not all can be promoted
    });

    it('preserves event count in promoted cards', () => {
      const cards = [{ type: 'compact' as CardType, eventCount: 5 }];
      const result = capacityModel.applyPromotion(cards, 80);

      expect(result[0].eventCount).toBe(5);
    });
  });

  describe('reset', () => {
    it('clears all columns', () => {
      capacityModel.initializeColumn('col1');
      capacityModel.initializeColumn('col2');
      capacityModel.allocate('col1', 'above', 'full');

      capacityModel.reset();

      const metrics = capacityModel.getGlobalMetrics();
      expect(metrics.totalCells).toBe(0);
      expect(metrics.usedCells).toBe(0);
    });

    it('allows re-initialization after reset', () => {
      capacityModel.initializeColumn('col1');
      capacityModel.reset();
      capacityModel.initializeColumn('col1');

      const metrics = capacityModel.getColumnMetrics('col1');
      expect(metrics).not.toBeNull();
      expect(metrics!.usedCells).toBe(0);
    });
  });

  describe('CARD_FOOTPRINTS constant', () => {
    it('follows 1-2-4 ratio', () => {
      expect(CARD_FOOTPRINTS['title-only']).toBe(1);
      expect(CARD_FOOTPRINTS['compact']).toBe(2);
      expect(CARD_FOOTPRINTS['full']).toBe(4);
    });
  });

  describe('DEGRADATION_CASCADE constant', () => {
    it('defines cascade from best to worst', () => {
      expect(DEGRADATION_CASCADE[0].type).toBe('full');
      expect(DEGRADATION_CASCADE[1].type).toBe('compact');
      expect(DEGRADATION_CASCADE[2].type).toBe('title-only');
    });

    it('footprints match CARD_FOOTPRINTS', () => {
      DEGRADATION_CASCADE.forEach(option => {
        expect(option.footprint).toBe(CARD_FOOTPRINTS[option.type]);
      });
    });
  });
});
