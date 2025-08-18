import type { Event } from '../types';
import type { DistributedEvent } from './EventDistribution';
import type { SlotGrid } from './CorrectedSlotSystem';
import type { CardType } from './types';
import { CorrectedSlotSystem } from './CorrectedSlotSystem';

/**
 * Decorrelated Layout Engine
 * Phase 2.1: Independent above/below layout system
 * "We can decorrelate the upper and bottom parts of the timeline"
 */

export interface SectionLayout {
  section: 'above' | 'below';
  events: Event[];
  distributedEvents: DistributedEvent[];
  columns: ColumnGroup[];
  slotGrid: SlotGrid;
  cards: PositionedCard[];
  statistics: SectionStatistics;
}

export interface ColumnGroup {
  id: string;
  section: 'above' | 'below';
  events: Event[];
  startX: number;
  endX: number;
  centerX: number;
  temporalCenter: number; // Timestamp of temporal center
  cards: PositionedCard[];
  degradationLevel: CardType;
  slotUtilization: number;
}

export interface PositionedCard {
  id: string;
  events: Event[];
  cardType: CardType;
  section: 'above' | 'below';
  columnId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  slotIndices: number[];
}

export interface SectionStatistics {
  totalEvents: number;
  totalColumns: number;
  totalCards: number;
  averageEventsPerColumn: number;
  slotUtilization: number;
  degradationBreakdown: Record<CardType, number>;
  horizontalUtilization: number;
}

export interface SharedAnchor {
  id: string;
  x: number;
  y: number;
  temporalCenter: number;
  aboveEvents: Event[];
  belowEvents: Event[];
  totalEvents: number;
}

export class DecorrelatedLayoutEngine {
  private slotSystem = new CorrectedSlotSystem();
  private timelineY = 300; // Timeline Y position
  private maxSlotsPerSection = 8; // Maximum slots per section per column

  /**
   * Create independent layouts for above and below timeline sections
   */
  createDecorrelatedLayout(
    distributedEvents: DistributedEvent[],
    timelineBounds: { startTime: number; endTime: number; duration: number },
    viewportWidth: number
  ): {
    aboveLayout: SectionLayout;
    belowLayout: SectionLayout;
    sharedAnchors: SharedAnchor[];
    overallStats: {
      totalEvents: number;
      totalColumns: number;
      totalCards: number;
      averageUtilization: number;
    };
  } {
    // Distribute events between above and below sections
    const { aboveEvents, belowEvents } = this.distributeEventsBetweenSections(distributedEvents);

    // Create independent layouts
    const aboveLayout = this.createSectionLayout(aboveEvents, 'above', timelineBounds, viewportWidth);
    const belowLayout = this.createSectionLayout(belowEvents, 'below', timelineBounds, viewportWidth);

    // Create shared anchors for coordination
    const sharedAnchors = this.createSharedAnchors(aboveLayout, belowLayout);

    // Calculate overall statistics
    const overallStats = this.calculateOverallStatistics(aboveLayout, belowLayout);

    return {
      aboveLayout,
      belowLayout,
      sharedAnchors,
      overallStats
    };
  }

  /**
   * Distribute events between above and below sections
   * Implements intelligent distribution for optimal visual balance
   */
  private distributeEventsBetweenSections(
    distributedEvents: DistributedEvent[]
  ): {
    aboveEvents: DistributedEvent[];
    belowEvents: DistributedEvent[];
  } {
    const aboveEvents: DistributedEvent[] = [];
    const belowEvents: DistributedEvent[] = [];

    // Sort events by timestamp for consistent distribution
    const sortedEvents = [...distributedEvents].sort((a, b) => a.timestamp - b.timestamp);

    // Alternate distribution with density balancing
    let aboveCount = 0;
    let belowCount = 0;

    for (const event of sortedEvents) {
      // Use alternating distribution with density balancing
      const shouldGoAbove = this.shouldPlaceAbove(event, aboveCount, belowCount);
      
      if (shouldGoAbove) {
        aboveEvents.push(event);
        aboveCount++;
      } else {
        belowEvents.push(event);
        belowCount++;
      }
    }

    return { aboveEvents, belowEvents };
  }

  /**
   * Determine if event should be placed above timeline
   */
  private shouldPlaceAbove(
    event: DistributedEvent, 
    currentAboveCount: number, 
    currentBelowCount: number
  ): boolean {
    // Simple alternating with bias towards balance
    const difference = currentAboveCount - currentBelowCount;
    
    // If above has too many more events, place below
    if (difference > 2) return false;
    
    // If below has too many more events, place above
    if (difference < -2) return true;
    
    // Use event density to influence placement
    // Higher density events go to less crowded section
    if (event.density > 1.0) {
      return currentAboveCount <= currentBelowCount;
    }
    
    // Default alternating behavior
    return (currentAboveCount + currentBelowCount) % 2 === 0;
  }

  /**
   * Create layout for a specific section (above or below)
   */
  private createSectionLayout(
    events: DistributedEvent[],
    section: 'above' | 'below',
    _timelineBounds: { startTime: number; endTime: number; duration: number },
    viewportWidth: number
  ): SectionLayout {
    if (events.length === 0) {
      return this.createEmptySectionLayout(section);
    }

    // Apply left-to-right clustering within section
    const columns = this.performSectionClustering(events, section, viewportWidth);

    // Create slot grid for section
    const slotGrid = this.slotSystem.createSlotGrid(
      this.maxSlotsPerSection, 
      this.maxSlotsPerSection
    );

    // Apply independent degradation and create cards
    const { cards, updatedGrid } = this.applySectionDegradation(columns, slotGrid, section);

    // Calculate section statistics
    const statistics = this.calculateSectionStatistics(events, columns, cards, updatedGrid);

    return {
      section,
      events: events.map(de => de.event),
      distributedEvents: events,
      columns,
      slotGrid: updatedGrid,
      cards,
      statistics
    };
  }

  /**
   * Perform clustering within a section
   */
  private performSectionClustering(
    events: DistributedEvent[],
    section: 'above' | 'below',
    viewportWidth: number
  ): ColumnGroup[] {
    const columns: ColumnGroup[] = [];
    const baseColumnWidth = 200;
    // const columnSpacing = 20; // Unused for now

    // Sort events by x position (left to right)
    const sortedEvents = [...events].sort((a, b) => a.x - b.x);

    for (const event of sortedEvents) {
      let addedToColumn = false;

      // Try to add to existing column
      for (const column of columns) {
        const columnEndX = column.startX + baseColumnWidth;
        
        // Check if event falls within column's horizontal space
        if (event.x >= column.startX && event.x <= columnEndX) {
          column.events.push(event.event);
          column.endX = Math.max(column.endX, event.x);
          
          // Recalculate temporal center
          const timestamps = column.events.map(e => new Date(e.date).getTime());
          column.temporalCenter = (Math.min(...timestamps) + Math.max(...timestamps)) / 2;
          column.centerX = this.timestampToX(column.temporalCenter, viewportWidth);
          
          addedToColumn = true;
          break;
        }
      }

      // Create new column if not added to existing
      if (!addedToColumn) {
        const columnId = `${section}-column-${columns.length}`;
        const newColumn: ColumnGroup = {
          id: columnId,
          section,
          events: [event.event],
          startX: event.x,
          endX: event.x,
          centerX: event.x,
          temporalCenter: event.timestamp,
          cards: [],
          degradationLevel: 'full',
          slotUtilization: 0
        };
        
        columns.push(newColumn);
      }
    }

    return columns;
  }

  /**
   * Apply degradation and create cards for a section
   */
  private applySectionDegradation(
    columns: ColumnGroup[],
    slotGrid: SlotGrid,
    section: 'above' | 'below'
  ): {
    cards: PositionedCard[];
    updatedGrid: SlotGrid;
  } {
    const cards: PositionedCard[] = [];
    let currentGrid = { ...slotGrid };

    for (const column of columns) {
      const eventCount = column.events.length;
      
      // Determine optimal card type based on available slots
      const availableSlots = section === 'above' 
        ? currentGrid.above.filter(s => !s.isOccupied).length
        : currentGrid.below.filter(s => !s.isOccupied).length;

      const optimal = this.slotSystem.getOptimalCardType(eventCount, availableSlots);
      column.degradationLevel = optimal.cardType;

      // Create cards based on degradation
      const columnCards = this.createColumnCards(column, optimal.cardType, section);
      
      // Occupy slots for each card
      for (const card of columnCards) {
        const occupyResult = this.slotSystem.occupySlots(
          currentGrid,
          card.cardType,
          card.id,
          section
        );
        
        if (occupyResult.success) {
          currentGrid = occupyResult.updatedGrid;
          card.slotIndices = occupyResult.occupiedSlots.map(slotId => 
            parseInt(slotId.split('-')[1])
          );
          cards.push(card);
        }
      }

      // Update column utilization
      column.slotUtilization = (column.events.length / this.maxSlotsPerSection) * 100;
    }

    return { cards, updatedGrid: currentGrid };
  }

  /**
   * Create cards for a column based on card type
   */
  private createColumnCards(
    column: ColumnGroup,
    cardType: CardType,
    section: 'above' | 'below'
  ): PositionedCard[] {
    const allocation = this.slotSystem.getSlotAllocation(cardType);
    const cards: PositionedCard[] = [];

    if (cardType === 'multi-event') {
      // Create multi-event cards (max 5 events each)
      const chunks = this.chunkEvents(column.events, 5);
      
      chunks.forEach((chunk, index) => {
        cards.push(this.createPositionedCard(
          chunk,
          cardType,
          section,
          column,
          index,
          allocation
        ));
      });
    } else {
      // Create individual cards based on events per card
      const chunks = this.chunkEvents(column.events, allocation.eventsPerCard);
      
      chunks.forEach((chunk, index) => {
        cards.push(this.createPositionedCard(
          chunk,
          cardType,
          section,
          column,
          index,
          allocation
        ));
      });
    }

    return cards;
  }

  /**
   * Create a positioned card
   */
  private createPositionedCard(
    events: Event[],
    cardType: CardType,
    section: 'above' | 'below',
    column: ColumnGroup,
    cardIndex: number,
    allocation: { cardHeight: number; cardWidth: number }
  ): PositionedCard {
    const cardId = `${column.id}-card-${cardIndex}`;
    const slotHeight = allocation.cardHeight + 10; // Add gap between cards
    
    // Calculate Y position based on section
    let y: number;
    if (section === 'above') {
      y = this.timelineY - (cardIndex + 1) * slotHeight - 20; // 20px gap from timeline
    } else {
      y = this.timelineY + (cardIndex + 1) * slotHeight + 20; // 20px gap from timeline
    }

    return {
      id: cardId,
      events,
      cardType,
      section,
      columnId: column.id,
      x: column.centerX - allocation.cardWidth / 2,
      y,
      width: allocation.cardWidth,
      height: allocation.cardHeight,
      anchorX: column.centerX,
      anchorY: this.timelineY,
      slotIndices: [] // Will be filled when slots are occupied
    };
  }

  /**
   * Chunk events into groups
   */
  private chunkEvents(events: Event[], chunkSize: number): Event[][] {
    const chunks: Event[][] = [];
    for (let i = 0; i < events.length; i += chunkSize) {
      chunks.push(events.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Create shared anchors for cross-section coordination
   */
  private createSharedAnchors(
    aboveLayout: SectionLayout,
    belowLayout: SectionLayout
  ): SharedAnchor[] {
    const anchors: SharedAnchor[] = [];
    const allTemporalCenters = new Set<number>();

    // Collect all temporal centers
    aboveLayout.columns.forEach(col => allTemporalCenters.add(col.temporalCenter));
    belowLayout.columns.forEach(col => allTemporalCenters.add(col.temporalCenter));

    // Create shared anchors
    Array.from(allTemporalCenters).forEach((temporalCenter, index) => {
      const aboveEvents = aboveLayout.columns
        .filter(col => col.temporalCenter === temporalCenter)
        .flatMap(col => col.events);
      
      const belowEvents = belowLayout.columns
        .filter(col => col.temporalCenter === temporalCenter)
        .flatMap(col => col.events);

      if (aboveEvents.length > 0 || belowEvents.length > 0) {
        anchors.push({
          id: `shared-anchor-${index}`,
          x: this.timestampToX(temporalCenter, 1200), // Use viewport width
          y: this.timelineY,
          temporalCenter,
          aboveEvents,
          belowEvents,
          totalEvents: aboveEvents.length + belowEvents.length
        });
      }
    });

    return anchors;
  }

  /**
   * Calculate section statistics
   */
  private calculateSectionStatistics(
    events: DistributedEvent[],
    columns: ColumnGroup[],
    cards: PositionedCard[],
    slotGrid: SlotGrid
  ): SectionStatistics {
    const degradationBreakdown: Record<CardType, number> = {
      full: 0,
      compact: 0,
      'title-only': 0,
      'multi-event': 0,
      infinite: 0
    };

    cards.forEach(card => {
      degradationBreakdown[card.cardType]++;
    });

    const positions = events.map(e => e.x);
    const horizontalSpan = positions.length > 0 ? Math.max(...positions) - Math.min(...positions) : 0;
    const horizontalUtilization = (horizontalSpan / 1200) * 100; // Use viewport width

    return {
      totalEvents: events.length,
      totalColumns: columns.length,
      totalCards: cards.length,
      averageEventsPerColumn: columns.length > 0 ? events.length / columns.length : 0,
      slotUtilization: slotGrid.utilizationPercentage,
      degradationBreakdown,
      horizontalUtilization
    };
  }

  /**
   * Calculate overall statistics
   */
  private calculateOverallStatistics(
    aboveLayout: SectionLayout,
    belowLayout: SectionLayout
  ): {
    totalEvents: number;
    totalColumns: number;
    totalCards: number;
    averageUtilization: number;
  } {
    return {
      totalEvents: aboveLayout.statistics.totalEvents + belowLayout.statistics.totalEvents,
      totalColumns: aboveLayout.statistics.totalColumns + belowLayout.statistics.totalColumns,
      totalCards: aboveLayout.statistics.totalCards + belowLayout.statistics.totalCards,
      averageUtilization: (aboveLayout.statistics.slotUtilization + belowLayout.statistics.slotUtilization) / 2
    };
  }

  /**
   * Create empty section layout
   */
  private createEmptySectionLayout(section: 'above' | 'below'): SectionLayout {
    return {
      section,
      events: [],
      distributedEvents: [],
      columns: [],
      slotGrid: this.slotSystem.createSlotGrid(0, 0),
      cards: [],
      statistics: {
        totalEvents: 0,
        totalColumns: 0,
        totalCards: 0,
        averageEventsPerColumn: 0,
        slotUtilization: 0,
        degradationBreakdown: {
          full: 0,
          compact: 0,
          'title-only': 0,
          'multi-event': 0,
          infinite: 0
        },
        horizontalUtilization: 0
      }
    };
  }

  /**
   * Convert timestamp to X coordinate
   */
  private timestampToX(timestamp: number, viewportWidth: number): number {
    // Simplified conversion - would use actual timeline bounds in real implementation
    const baseTime = new Date('2020-01-01').getTime();
    const yearMs = 365 * 24 * 60 * 60 * 1000;
    const timeOffset = timestamp - baseTime;
    return Math.max(56, Math.min(viewportWidth - 56, (timeOffset / yearMs) * (viewportWidth - 112) + 56));
  }
}