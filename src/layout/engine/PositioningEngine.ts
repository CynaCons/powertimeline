/**
 * PositioningEngine - Card positioning and collision resolution
 *
 * Handles the physical positioning of cards and anchors:
 * - Card positioning with proper spacing and viewport constraints
 * - Collision detection and resolution between cards
 * - Anchor creation and positioning for timeline reference
 * - Split-level anchor system (above/below timeline)
 */

import type { Event } from '../../types';
import type { LayoutConfig, PositionedCard, LayoutResult, Anchor, EventCluster } from '../types';
import type { ColumnGroup } from '../LayoutEngine';
import { CapacityModel, CARD_FOOTPRINTS } from '../CapacityModel';
import { getEventTimestamp } from '../../lib/time';

export class PositioningEngine {
  private config: LayoutConfig;
  private timelineY: number;
  private capacityModel: CapacityModel;
  private timeRange: { startTime: number; endTime: number; duration: number } | null = null;

  constructor(config: LayoutConfig, capacityModel: CapacityModel) {
    this.config = config;
    this.timelineY = config.timelineY || config.viewportHeight / 2;
    this.capacityModel = capacityModel;
  }

  /**
   * Sets the time range context for positioning calculations
   */
  setTimeRange(timeRange: { startTime: number; endTime: number; duration: number } | null): void {
    this.timeRange = timeRange;
  }

  /**
   * Sets the current time window for view-based filtering
   */
  setCurrentTimeWindow(timeWindow: { visibleStartTime: number; visibleEndTime: number } | null): void {
    void timeWindow;
    // Currently unused in positioning engine, but kept for API compatibility
  }

  /**
   * Position cards using fit algorithm with collision resolution
   */
  positionCardsWithFitAlgorithm(
    groups: ColumnGroup[],
    filterEventsByViewWindow: (events: Event[]) => Event[],
    dlog: (...args: unknown[]) => void
  ): LayoutResult {
    const positionedCards: PositionedCard[] = [];
    const anchors: Anchor[] = [];
    const clusters: EventCluster[] = [];

    // Calculate vertical space reserved for margins and anchors
    // NOTE: We don't calculate available space here anymore - DegradationEngine handles capacity
    //
    // ASYMMETRIC MARGIN APPROACH (v0.8.2 fix):
    // - We don't have dates below the timeline axis, so we can use a smaller margin there
    // - This gives more vertical space for cards above the timeline
    // - Safe zones (minimap/breadcrumb) are handled at source in config.ts via HEADER_SAFE_ZONE
    const aboveTimelineMargin = 48; // spacing between above-cards and timeline axis (increased for breathing room)
    const belowTimelineMargin = 55; // spacing below for timeline axis labels (month/year labels render at ~65px from axis top)
    // Note: Anchor spacing constants are defined in createEventAnchors() where they're used

    for (const group of groups) {
      // Calculate optimal card size to better use available space
      const cardSpacing = 12; // reduced inter-card spacing

      // Mixed card type support: cards may have different heights within the same group
      // The group.cards already have correct heights set by DegradationEngine
      // IMPORTANT: DegradationEngine already calculated capacity - DO NOT recalculate here!
      // Recalculating creates mismatches that cause gaps in mixed card columns

      const isAboveHalfColumn = group.side === 'above';
      const isBelowHalfColumn = group.side === 'below';

      // Trust DegradationEngine's capacity calculation - use all cards it created
      const actualCards = group.cards;

      // Update anchor with proper visible count and overflow count
      // Filter overflow events by current view window to prevent leftover indicators
      const relevantOverflowEvents = group.overflowEvents ? filterEventsByViewWindow(group.overflowEvents) : [];

      // CC-REQ-ANCHOR-004: For anchor persistence, don't filter events by view window
      // Anchors should always be visible regardless of view window to maintain timeline reference
      const relevantGroupEvents = group.events;
      const totalRelevantEvents = relevantGroupEvents.length + relevantOverflowEvents.length;
      const visibleCount = actualCards.length;
      const overflowCount = Math.max(0, totalRelevantEvents - visibleCount);

      // CC-REQ-ANCHOR-004: Always create anchors for events in view window, regardless of card visibility
      // Anchors should be persistent even when cards are completely degraded away
      if (relevantGroupEvents.length > 0) {
        // Create individual anchors for each event at precise timeline positions
        const eventAnchors = this.createEventAnchors(relevantGroupEvents, group.id, group.side);

        // Distribute overflow count among visible anchors
        if (overflowCount > 0 && eventAnchors.length > 0) {
          // For simplicity, assign all overflow to the last visible anchor in the cluster
          // This represents the overflow for the entire cluster group
          const lastAnchor = eventAnchors[eventAnchors.length - 1];
          lastAnchor.overflowCount = overflowCount;
          lastAnchor.visibleCount = visibleCount;

          dlog(`  Assigned overflow count ${overflowCount} to anchor ${lastAnchor.id} in cluster ${group.id}`);
        }

        anchors.push(...eventAnchors);

        // Respect half-column pre-determined position (above vs below)
        // Each group is EITHER above OR below (never both)
        const aboveCards = isAboveHalfColumn ? actualCards : [];
        const belowCards = isBelowHalfColumn ? actualCards : [];

        // Position above cards with mixed heights and proper spacing
        // Start from timeline (already positioned with safe zone in config.ts) and stack upward (decreasing Y)
        let aboveY = this.timelineY - aboveTimelineMargin;
        aboveCards.forEach((card) => {
          // Use the card's pre-set height from DegradationEngine (don't overwrite!)
          // card.height is already set correctly for mixed card types
          card.y = aboveY - card.height;
          card.x = group.centerX - (card.width / 2);

          aboveY = card.y - cardSpacing; // Next card starts above this one

          positionedCards.push(card);
          this.capacityModel.allocate(group.id, 'above', card.cardType);
        });

        // Position below cards with mixed heights and proper spacing
        // Start from timeline and stack downward (increasing Y)
        // Using reduced belowTimelineMargin since there are no dates below
        let belowY = this.timelineY + belowTimelineMargin;
        belowCards.forEach((card) => {
          // Use the card's pre-set height from DegradationEngine (don't overwrite!)
          // card.height is already set correctly for mixed card types
          card.y = belowY;
          card.x = group.centerX - (card.width / 2);

          belowY += (card.height + cardSpacing);

          positionedCards.push(card);
          this.capacityModel.allocate(group.id, 'below', card.cardType);
        });

        // Create cluster with a representative anchor (for backwards compatibility)
        const clusterAnchor = this.createAnchor(
          [...relevantGroupEvents, ...relevantOverflowEvents],
          group.centerX,
          visibleCount,
          overflowCount,
          group.side
        );
        clusters.push({
          id: group.id,
          anchor: clusterAnchor,
          events: group.events
        });
      }
    }

    // Final collision resolution pass (per-side) to eliminate any residual overlaps
    this.resolveCollisions(positionedCards);

    const capacityMetrics = this.capacityModel.getGlobalMetrics();
    const derivedUsedSlots = positionedCards.reduce((sum, card) => {
      const footprint = CARD_FOOTPRINTS[card.cardType] ?? 0;
      return sum + footprint;
    }, 0);

    const derivedTotalSlots = clusters.length > 0
      ? clusters.length * capacityMetrics.cellsPerSide * 2
      : 0;

    const totalSlots = capacityMetrics.totalCells || derivedTotalSlots;
    const usedSlots = Math.min(totalSlots || derivedTotalSlots, capacityMetrics.usedCells || derivedUsedSlots);
    const percentage = totalSlots > 0 ? Math.min(100, (usedSlots / totalSlots) * 100) : 0;

    return {
      positionedCards,
      anchors,
      clusters,
      utilization: {
        totalSlots,
        usedSlots,
        percentage
      }
    };
  }

  /**
   * Build spatial hash for efficient collision detection
   * Grid cell size: 100px
   */
  private buildSpatialHash(items: PositionedCard[]): Map<string, PositionedCard[]> {
    const cellSize = 100;
    const hash = new Map<string, PositionedCard[]>();

    for (const card of items) {
      // Calculate bounding box in world coordinates
      const left = card.x - card.width / 2;
      const right = card.x + card.width / 2;
      const top = card.y;
      const bottom = card.y + card.height;

      // Find all cells this card overlaps
      const minCellX = Math.floor(left / cellSize);
      const maxCellX = Math.floor(right / cellSize);
      const minCellY = Math.floor(top / cellSize);
      const maxCellY = Math.floor(bottom / cellSize);

      // Register card in all overlapping cells
      for (let cx = minCellX; cx <= maxCellX; cx++) {
        for (let cy = minCellY; cy <= maxCellY; cy++) {
          const key = `${cx},${cy}`;
          if (!hash.has(key)) {
            hash.set(key, []);
          }
          hash.get(key)!.push(card);
        }
      }
    }

    return hash;
  }

  /**
   * Get nearby cell keys (3x3 grid) around a card's position
   */
  private getNearbyCells(card: PositionedCard): string[] {
    const cellSize = 100;
    const centerX = Math.floor(card.x / cellSize);
    const centerY = Math.floor(card.y / cellSize);

    const cells: string[] = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        cells.push(`${centerX + dx},${centerY + dy}`);
      }
    }
    return cells;
  }

  /**
   * Resolve collisions between positioned cards using spatial hashing
   * CC-REQ-LAYOUT-XALIGN-001: Cards within same half-column must maintain X-alignment
   */
  private resolveCollisions(positionedCards: PositionedCard[]): void {
    // Safe zone boundaries to prevent overlap with UI elements
    const SCREEN_TOP_BOUNDARY = 10; // Absolute minimum - just off-screen prevention
    const LEFT_SAFE_ZONE = 200; // Breadcrumb area protection (left nav 56px + breadcrumb area 144px)
    const TOP_BREADCRUMB_ZONE = 120; // Only protect breadcrumb area in top region
    const resolveOverlaps = (items: PositionedCard[], preferRight = true) => {
      const within = (x: number, y: number, w: number, h: number) =>
        x >= 0 && (x + w) <= this.config.viewportWidth && y >= SCREEN_TOP_BOUNDARY && (y + h) <= this.config.viewportHeight;
      // FIXED: Collision detection using TOP coordinates (card.y is top, not center)
      // Cards collide if their bounding boxes overlap
      const collide = (a: PositionedCard, b: PositionedCard) => (
        a.x - a.width / 2 < b.x + b.width / 2 && a.x + a.width / 2 > b.x - b.width / 2 &&
        a.y < b.y + b.height && a.y + a.height > b.y
      );
      const spacing = 8; // minimal gap
      const maxPasses = 4; // Reduced from 6 due to spatial hashing efficiency

      // Build spatial hash ONCE before loop (optimization: avoid rebuilding on every pass)
      const spatialHash = this.buildSpatialHash(items);

      // Sort deterministically by area desc then x asc to move smaller ones first
      const ordered = items.slice().sort((a, b) => (b.width * b.height) - (a.width * a.height) || a.x - b.x);

      for (let pass = 0; pass < maxPasses; pass++) {
        let changed = false;

        for (const A of ordered) {
          // Get nearby cells for this card
          const nearbyCellKeys = this.getNearbyCells(A);
          const candidates = new Set<PositionedCard>();

          // Collect all cards from nearby cells
          for (const cellKey of nearbyCellKeys) {
            const cellCards = spatialHash.get(cellKey);
            if (cellCards) {
              for (const card of cellCards) {
                if (card !== A) {
                  candidates.add(card);
                }
              }
            }
          }

          // Check collisions only with nearby candidates
          for (const B of candidates) {
            // Only handle pairs on the same side to preserve above/below bands
            const aAbove = A.y < this.timelineY, bAbove = B.y < this.timelineY;
            if (aAbove !== bAbove) continue;
            if (!collide(A, B)) continue;

            const target = preferRight ? B : A;
            const other = preferRight ? A : B;

            // CC-REQ-LAYOUT-XALIGN-001: Check if cards are in same half-column (same clusterId)
            // Cards in same half-column must NEVER be nudged horizontally to maintain X-alignment
            const sameHalfColumn = target.clusterId === other.clusterId;

            // Try horizontal nudge ONLY if cards are from DIFFERENT half-columns
            if (!sameHalfColumn) {
              let nx = target.x;
              const required = other.x + Math.sign(target.x - other.x || 1) * (other.width / 2 + target.width / 2 + spacing);
              nx = required;
              const ny = target.y;

              // Prevent nudging into breadcrumb safe zone (top-left corner)
              if (ny < TOP_BREADCRUMB_ZONE && nx - target.width / 2 < LEFT_SAFE_ZONE) {
                // Card would overlap breadcrumb area - skip horizontal nudge
                continue;
              }

              // FIXED: Use TOP coordinates - target.y is already the top, nx is the center
              if (within(nx - target.width / 2, ny, target.width, target.height)) {
                target.x = Math.max(target.width / 2, Math.min(this.config.viewportWidth - target.width / 2, nx));
                changed = true;
                continue;
              }
            }

            // If horizontal nudge skipped (same half-column) or failed, try vertical step within the same band
            // Use consistent 12px spacing to maintain proper gaps between cards
            const step = 12; // Maintain consistent card spacing instead of target.height + 12
            let newY = target.y;
            if (aAbove) newY = Math.max(SCREEN_TOP_BOUNDARY, target.y - step); // Move up (decrease Y)
            else newY = Math.min(this.config.viewportHeight - target.height, target.y + step); // Move down (increase Y)
            // FIXED: Use TOP coordinates - newY and target.y are already top positions
            if (within(target.x - target.width / 2, newY, target.width, target.height)) {
              target.y = newY;
              changed = true;
            }
          }
        }
        if (!changed) break;
      }
    };
    const above = positionedCards.filter(c => c.y < this.timelineY);
    const below = positionedCards.filter(c => c.y >= this.timelineY);
    resolveOverlaps(above, true);
    resolveOverlaps(below, true);
  }

  /**
   * Helper: Create anchor for a group of events (legacy method - now used for cluster group anchors)
   */
  createAnchor(
    events: Event[],
    x: number,
    visibleCount?: number,
    overflowCount?: number,
    clusterPosition?: 'above' | 'below'
  ): Anchor {
    const totalCount = events.length;
    const visible = visibleCount ?? totalCount; // Default to all visible if not specified
    const overflow = overflowCount ?? Math.max(0, totalCount - visible);

    return {
      id: `anchor-${x}`,
      x,
      y: this.timelineY,
      eventIds: events.map(e => e.id),
      eventCount: totalCount + overflow, // Include overflow in total count
      visibleCount: visible,
      overflowCount: overflow,
      clusterPosition,
      isClusterGroup: true
    };
  }

  /**
   * Helper: Create individual anchors for each event at precise timeline positions
   */
  createEventAnchors(events: Event[], clusterId: string, clusterPosition: 'above' | 'below'): Anchor[] {
    const anchors: Anchor[] = [];

    for (const event of events) {
      const eventTime = getEventTimestamp(event);
      let eventXPos: number;

      // Calculate precise X position for this event using the same coordinate system as cards
      if (this.timeRange && this.timeRange.duration > 0) {
        const timeRatio = (eventTime - this.timeRange.startTime) / this.timeRange.duration;
        // Use same margin calculation as card positioning (lines 181-185)
        const navRailWidth = 56;
        const additionalMargin = 80;
        const leftMargin = navRailWidth + additionalMargin; // 136px total
        const rightMargin = 40;
        const usableWidth = this.config.viewportWidth - leftMargin - rightMargin;
        eventXPos = leftMargin + (timeRatio * usableWidth);
      } else {
        // Fallback positioning
        eventXPos = this.config.viewportWidth / 2;
      }

      // Calculate anchor Y position based on cluster position (split-level system)
      // Increased spacing to create more visual separation without vertical lines
      const upperAnchorSpacing = 25;
      const lowerAnchorSpacing = 25;
      const anchorY = clusterPosition === 'above'
        ? this.timelineY - (upperAnchorSpacing / 2) // Upper anchor line
        : this.timelineY + (lowerAnchorSpacing / 2); // Lower anchor line

      anchors.push({
        id: `anchor-event-${event.id}`,
        x: eventXPos,
        y: anchorY,
        eventIds: [event.id],
        eventCount: 1,
        visibleCount: 1,
        overflowCount: 0,
        eventId: event.id,
        clusterId: clusterId,
        clusterPosition: clusterPosition,
        isClusterGroup: false
      });
    }

    return anchors;
  }
}
