/**
 * DispatchEngine - Event dispatching and half-column management
 *
 * Handles the spatial distribution of events into half-column groups using:
 * - Chronological processing with alternating above/below placement
 * - Adaptive half-column width calculation based on temporal density
 * - Spatial overlap detection and grouping
 * - View window filtering for performance optimization
 */

import type { Event } from '../../types';
import type { LayoutConfig, Anchor } from '../types';
import type { ColumnGroup } from '../LayoutEngine';
import { getEventTimestamp } from '../../lib/time';

export class DispatchEngine {
  private config: LayoutConfig;
  private timelineY: number;
  private timeRange: { startTime: number; endTime: number; duration: number } | null = null;
  private currentTimeWindow: { visibleStartTime: number; visibleEndTime: number } | null = null;

  constructor(config: LayoutConfig) {
    this.config = config;
    this.timelineY = config.timelineY || config.viewportHeight / 2;
  }

  /**
   * Sets the time range context for temporal positioning calculations
   */
  setTimeRange(timeRange: { startTime: number; endTime: number; duration: number } | null): void {
    this.timeRange = timeRange;
  }

  /**
   * Sets the current time window for view-based filtering
   */
  setCurrentTimeWindow(timeWindow: { visibleStartTime: number; visibleEndTime: number } | null): void {
    this.currentTimeWindow = timeWindow;
  }

  /**
   * Stage 3i1: Calculate half-column width based on actual card width for proper overlap detection
   * Formula: card_width + spacing_buffer to prevent visual collisions
   */
  calculateAdaptiveHalfColumnWidth(): number {
    // Use actual full card width + generous spacing buffer to ensure zero overlaps
    const fullCardWidth = this.config.cardConfigs.full.width; // 260px (reduced from 280px)
    const spacingBuffer = 120; // Generous buffer for complete visual separation
    return fullCardWidth + spacingBuffer; // 340px - ensures zero overlap detection
  }

  /**
   * Stage 1: Half-Column Alternating Algorithm (Stage 3B)
   * Implements chronological processing with alternating above/below placement
   */
  dispatchEvents(events: Event[], stableSortEvents: (events: Event[]) => Event[]): ColumnGroup[] {
    const sortedEvents = stableSortEvents(events);
    const adaptiveHalfColumnWidth = this.calculateAdaptiveHalfColumnWidth();

    const navRailWidth = 56;
    const additionalMargin = 80;
    const leftMargin = navRailWidth + additionalMargin;
    const rightMargin = 40;
    const usableWidth = this.config.viewportWidth - leftMargin - rightMargin;
    const cardHalfWidth = this.config.cardConfigs.full.width / 2;
    const minCenterX = leftMargin + cardHalfWidth;
    const maxCenterX = leftMargin + usableWidth - cardHalfWidth;

    const aboveHalfColumns: ColumnGroup[] = [];
    const belowHalfColumns: ColumnGroup[] = [];

    for (let i = 0; i < sortedEvents.length; i++) {
      const event = sortedEvents[i];
      const shouldGoAbove = (i % 2) === 0;

      const eventTime = getEventTimestamp(event);
      let eventXPos: number;
      if (this.timeRange && this.timeRange.duration > 0) {
        const timeRatio = (eventTime - this.timeRange.startTime) / this.timeRange.duration;
        const temporalXPos = leftMargin + (timeRatio * usableWidth);
        eventXPos = Math.max(minCenterX, Math.min(maxCenterX, temporalXPos));
      } else {
        const temporalXPos = leftMargin + ((i / Math.max(1, sortedEvents.length - 1)) * usableWidth);
        eventXPos = Math.max(minCenterX, Math.min(maxCenterX, temporalXPos));
      }

      const targetHalfColumns = shouldGoAbove ? aboveHalfColumns : belowHalfColumns;
      const allHalfColumns = [...aboveHalfColumns, ...belowHalfColumns];
      const existingHalfColumn = this.findOverlappingHalfColumn(targetHalfColumns, eventXPos);
      const overlappingAnyHalfColumn = this.findOverlappingHalfColumn(allHalfColumns, eventXPos);
      const maxEventsPerGroup = 8;

      if (existingHalfColumn && existingHalfColumn.events.length < maxEventsPerGroup) {
        existingHalfColumn.events.push(event);
        this.updateHalfColumnBounds(existingHalfColumn);
      } else if (overlappingAnyHalfColumn && overlappingAnyHalfColumn.events.length >= maxEventsPerGroup) {
        this.addEventToOverflow(overlappingAnyHalfColumn, event);
      } else if (existingHalfColumn) {
        this.addEventToOverflow(existingHalfColumn, event);
      } else {
        const newHalfColumn = this.createHalfColumn(targetHalfColumns.length, shouldGoAbove, eventXPos, adaptiveHalfColumnWidth, event);
        targetHalfColumns.push(newHalfColumn);
      }
    }

    this.ensureSpatialSeparation(aboveHalfColumns, usableWidth, leftMargin, adaptiveHalfColumnWidth);
    this.ensureSpatialSeparation(belowHalfColumns, usableWidth, leftMargin, adaptiveHalfColumnWidth);

    return [...aboveHalfColumns, ...belowHalfColumns];
  }

  private createHalfColumn(index: number, shouldGoAbove: boolean, eventXPos: number, adaptiveHalfColumnWidth: number, event: Event): ColumnGroup {
    const side: ColumnGroup['side'] = shouldGoAbove ? 'above' : 'below';
    const aboveCapacity = side === 'above' ? { used: 0, total: 2 } : { used: 0, total: 0 };
    const belowCapacity = side === 'below' ? { used: 0, total: 2 } : { used: 0, total: 0 };
    const id = `${side}-${index}`;

    this.dlog(`Creating new half-column ${id} at x=${eventXPos.toFixed(1)}`);

    return {
      id,
      events: [event],
      overflowEvents: undefined,
      startX: eventXPos - adaptiveHalfColumnWidth / 2,
      endX: eventXPos + adaptiveHalfColumnWidth / 2,
      centerX: eventXPos,
      side,
      anchor: this.createAnchorForGroup([event], eventXPos, 1, 0, side),
      cards: [],
      capacity: {
        above: aboveCapacity,
        below: belowCapacity
      }
    };
  }

  /**
   * Find overlapping half-column based on horizontal position
   */
  findOverlappingHalfColumn(halfColumns: ColumnGroup[], eventX: number): ColumnGroup | null {
    for (const halfColumn of halfColumns) {
      if (eventX >= halfColumn.startX && eventX <= halfColumn.endX) {
        return halfColumn;
      }
    }
    return null;
  }

  /**
   * Update half-column spatial bounds when adding events
   */
  updateHalfColumnBounds(halfColumn: ColumnGroup): void {
    if (halfColumn.events.length === 0) {
      this.updateGroupAnchor(halfColumn);
      return;
    }

    const eventTimes = halfColumn.events.map((event) => getEventTimestamp(event));
    const minTime = Math.min(...eventTimes);
    const maxTime = Math.max(...eventTimes);
    const centerTime = (minTime + maxTime) / 2;

    if (this.timeRange && this.timeRange.duration > 0) {
      const navRailWidth = 56;
      const additionalMargin = 80;
      const leftMargin = navRailWidth + additionalMargin;
      const rightMargin = 40;
      const usableWidth = this.config.viewportWidth - leftMargin - rightMargin;
      const cardHalfWidth = this.config.cardConfigs.full.width / 2;
      const minCenterX = leftMargin + cardHalfWidth;
      const maxCenterX = leftMargin + usableWidth - cardHalfWidth;

      const timeRatio = (centerTime - this.timeRange.startTime) / this.timeRange.duration;
      const temporalCenterX = leftMargin + (timeRatio * usableWidth);
      halfColumn.centerX = Math.max(minCenterX, Math.min(maxCenterX, temporalCenterX));
    }

    const adaptiveHalfColumnWidth = this.calculateAdaptiveHalfColumnWidth();
    halfColumn.startX = halfColumn.centerX - adaptiveHalfColumnWidth / 2;
    halfColumn.endX = halfColumn.centerX + adaptiveHalfColumnWidth / 2;

    this.updateGroupAnchor(halfColumn);
  }

  /**
   * Ensure spatial separation between half-columns to prevent overlaps
   */
  ensureSpatialSeparation(halfColumns: ColumnGroup[], usableWidth: number, leftMargin: number, adaptiveHalfColumnWidth: number): void {
    if (halfColumns.length <= 1) {
      return;
    }

    halfColumns.sort((a, b) => a.centerX - b.centerX);

    const minSpacing = adaptiveHalfColumnWidth * 0.75;

    for (let i = 1; i < halfColumns.length; i++) {
      const prev = halfColumns[i - 1];
      const current = halfColumns[i];

      const requiredMinX = prev.centerX + minSpacing;

      if (current.centerX < requiredMinX) {
        const maxPossibleX = leftMargin + usableWidth - adaptiveHalfColumnWidth / 2;

        if (requiredMinX <= maxPossibleX) {
          this.dlog(`Moving half-column ${current.id} from ${Math.round(current.centerX)} to ${Math.round(requiredMinX)} to prevent overlap`);
          current.centerX = requiredMinX;
          current.startX = current.centerX - adaptiveHalfColumnWidth / 2;
          current.endX = current.centerX + adaptiveHalfColumnWidth / 2;

          this.updateGroupAnchor(current);
        } else {
          this.dlog(`Half-column ${current.id} would exceed viewport - triggering overflow`);

          if (!prev.overflowEvents) {
            prev.overflowEvents = [];
          }
          prev.overflowEvents.push(...current.events);
          if (current.overflowEvents?.length) {
            prev.overflowEvents.push(...current.overflowEvents);
          }

          this.updateGroupAnchor(prev);

          current.events = [];
          current.cards = [];
          current.overflowEvents = undefined;
        }
      }
    }

    const filteredColumns = halfColumns.filter((column) => column.events.length > 0);
    halfColumns.length = 0;
    halfColumns.push(...filteredColumns);
  }

  private addEventToOverflow(group: ColumnGroup, event: Event): void {
    if (!group.overflowEvents) {
      group.overflowEvents = [];
    }
    group.overflowEvents.push(event);
    this.dlog(`Added overflow event ${event.id} to ${group.id} (overflow=${group.overflowEvents.length})`);
    this.updateGroupAnchor(group);
  }

  private updateGroupAnchor(group: ColumnGroup): void {
    const overflowCount = group.overflowEvents?.length ?? 0;
    group.anchor = this.createAnchorForGroup(group.events, group.centerX, group.events.length, overflowCount, group.side);
  }

  private createAnchorForGroup(
    events: Event[],
    x: number,
    visibleCount: number,
    overflowCount: number,
    side: 'above' | 'below'
  ): Anchor {
    return {
      id: `anchor-${x}`,
      x,
      y: this.timelineY,
      eventIds: events.map((event) => event.id),
      eventCount: visibleCount + overflowCount,
      visibleCount,
      overflowCount,
      clusterPosition: side,
      isClusterGroup: true
    };
  }

  private dlog(...args: unknown[]): void {
    if (this.config.debugLayout && typeof console !== 'undefined' && console.log) {
      console.log('[DispatchEngine]', ...args);
    }
  }

  /**
   * Filter events by current view window for performance optimization
   */
  filterEventsByViewWindow(events: Event[]): Event[] {
    if (!this.currentTimeWindow) {
      return events;
    }

    return events.filter(event => {
      const eventTime = getEventTimestamp(event);
      return eventTime >= this.currentTimeWindow!.visibleStartTime &&
             eventTime <= this.currentTimeWindow!.visibleEndTime;
    });
  }
}