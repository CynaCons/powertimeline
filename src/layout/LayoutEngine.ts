/**
 * Deterministic Layout Engine v5
 *
 * Main orchestrator for the layout system, now modularized into focused engines:
 * - DispatchEngine: Event dispatching and half-column management
 * - DegradationEngine: Card type degradation system
 * - PositioningEngine: Card positioning and collision resolution
 * - MetricsCalculator: Telemetry and metrics calculation
 *
 * Implements the corrected capacity model with proper footprints:
 * - Full cards: 4 cells footprint
 * - Compact cards: 2 cells footprint
 * - Title-only cards: 1 cell footprint
 * - Multi-event cards: 2 cells footprint (holds up to 5 events)
 * - Infinite cards: 2 cells footprint (overflow container)
 */

import type { Event } from '../types';
import type { LayoutConfig, LayoutResult } from './types';
import { CapacityModel } from './CapacityModel';
import { getEventTimestamp } from '../lib/time';

// Import the new modularized engines
import { DispatchEngine } from './engine/DispatchEngine';
import { DegradationEngine } from './engine/DegradationEngine';
import { PositioningEngine } from './engine/PositioningEngine';
import { MetricsCalculator } from './engine/MetricsCalculator';

// Re-export types and interfaces for backward compatibility
export interface ColumnGroup {
  id: string;
  events: Event[];
  overflowEvents?: Event[];
  startX: number;
  endX: number;
  centerX: number;
  side: 'above' | 'below';
  anchor: import('./types').Anchor;
  cards: import('./types').PositionedCard[];
  capacity: {
    above: { used: number; total: number };
    below: { used: number; total: number };
  };
}

export interface DispatchMetrics {
  groupCount: number;
  avgEventsPerCluster: number;
  largestCluster: number;
  groupPitchPx: {
    min: number;
    max: number;
    avg: number;
  };
  horizontalSpaceUsage: number; // Percentage of viewport width utilized (0-100)
}

export interface AggregationMetrics {
  totalAggregations: number;
  eventsAggregated: number;
  clustersAffected: number;
}

export interface InfiniteMetrics {
  enabled: boolean;
  containers: number;
  eventsContained: number;
  previewCount: number;
  byCluster: Array<{
    clusterId: string;
    side: 'above' | 'below';
    eventsContained: number;
  }>;
}

export interface DegradationMetrics {
  totalGroups: number;
  fullCardGroups: number;
  compactCardGroups: number;
  titleOnlyCardGroups: number;
  degradationRate: number;
  spaceReclaimed: number;
  degradationTriggers: Array<{
    groupId: string;
    eventCount: number;
    from: string;
    to: string;
    spaceSaved: number;
  }>;
}

export interface AdaptiveMetrics {
  halfColumnWidth: number;
  temporalDensity: number;
  temporalWindow: number;
}

export class DeterministicLayoutV5 {
  private config: LayoutConfig;
  private capacityModel: CapacityModel;
  private timeRange: { startTime: number; endTime: number; duration: number } | null = null;

  // View window context for overflow filtering
  private currentTimeWindow: { visibleStartTime: number; visibleEndTime: number } | null = null;

  // Modularized engines
  private dispatchEngine: DispatchEngine;
  private degradationEngine: DegradationEngine;
  private positioningEngine: PositioningEngine;
  private metricsCalculator: MetricsCalculator;

  constructor(config: LayoutConfig) {
    this.config = config;
    this.capacityModel = new CapacityModel(config.viewportHeight);

    // Initialize the modularized engines
    this.dispatchEngine = new DispatchEngine(config);
    this.degradationEngine = new DegradationEngine(config);
    this.positioningEngine = new PositioningEngine(config, this.capacityModel);
    this.metricsCalculator = new MetricsCalculator();

    // Enable debug logging based on configuration
    if (config.debugLayout && typeof console !== 'undefined' && console.warn) {
      console.warn('Layout debugging enabled. Turn off via config.debugLayout = false to reduce console output.');
    }
  }

  /**
   * Debug logging helper (conditionally enabled)
   */
  private dlog(...args: unknown[]) {
    if (this.config.debugLayout && typeof console !== 'undefined' && console.log) {
      console.log('[LayoutEngine]', ...args);
    }
  }

  /**
   * Main layout orchestration method
   */
  layout(events: Event[], viewWindow?: { viewStart: number; viewEnd: number }): LayoutResult {
    if (events.length === 0) {
      return this.emptyResult();
    }

    this.dlog('Starting layout for', events.length, 'events');

    // Reset capacity tracking for this layout pass
    this.capacityModel.reset();

    // Prepare view-window-aware event set and time context
    let layoutEvents = events;
    this.currentTimeWindow = null;
    this.timeRange = null;

    if (viewWindow && (viewWindow.viewStart !== 0 || viewWindow.viewEnd !== 1)) {
      const dates = events.map((event) => getEventTimestamp(event));
      if (dates.length > 0) {
        const rawMinDate = Math.min(...dates);
        const rawMaxDate = Math.max(...dates);
        const rawDateRange = rawMaxDate - rawMinDate;
        const padding = rawDateRange * 0.02;
        const paddedMinDate = rawMinDate - padding;
        const paddedRange = rawDateRange + (padding * 2);

        const visibleStartTime = paddedMinDate + (paddedRange * viewWindow.viewStart);
        const visibleEndTime = paddedMinDate + (paddedRange * viewWindow.viewEnd);

        this.currentTimeWindow = {
          visibleStartTime,
          visibleEndTime
        };

        layoutEvents = events.filter((event) => {
          const eventTime = getEventTimestamp(event);
          return eventTime >= visibleStartTime && eventTime <= visibleEndTime;
        });

        const visibleDuration = Math.max(1, visibleEndTime - visibleStartTime);
        this.timeRange = {
          startTime: visibleStartTime,
          endTime: visibleEndTime,
          duration: visibleDuration
        };

        this.dlog(
          `View window: ${viewWindow.viewStart.toFixed(3)} → ${viewWindow.viewEnd.toFixed(3)} (${layoutEvents.length} events)`
        );
        this.dlog(
          `Time window: ${new Date(visibleStartTime).toISOString()} → ${new Date(visibleEndTime).toISOString()}`
        );
      }
    }

    if (layoutEvents.length === 0) {
      this.dlog('No events remain after view window filtering');
      return this.emptyResult();
    }

    if (!this.timeRange) {
      this.calculateTimeRange(layoutEvents);
    }

    // Set context on engines using the resolved time window
    this.dispatchEngine.setTimeRange(this.timeRange);
    this.dispatchEngine.setCurrentTimeWindow(this.currentTimeWindow);
    this.positioningEngine.setTimeRange(this.timeRange);
    this.positioningEngine.setCurrentTimeWindow(this.currentTimeWindow);

    // OPTIONAL VIEW WINDOW FILTERING:
    // Filter events by view window when it's significantly zoomed in
    // Only apply for performance when view window is < 50% of total timeline
    if (viewWindow && this.currentTimeWindow) {
      const viewWindowSize = Math.abs(viewWindow.viewEnd - viewWindow.viewStart);
      if (viewWindowSize < 0.5) {
        layoutEvents = this.dispatchEngine.filterEventsByViewWindow(layoutEvents);
        this.dlog(`Filtered events: ${layoutEvents.length} events in view window`);
      }
    }

    if (layoutEvents.length === 0) {
      this.dlog('No events remain after performance filtering');
      return this.emptyResult();
    }

    // Stage 1: Event dispatching and half-column creation
    const groups = this.dispatchEngine.dispatchEvents(layoutEvents, this.stableSortEvents.bind(this));
    this.dlog(`Dispatched into ${groups.length} half-column groups`);

    // Initialize capacity tracking for each group
    for (const group of groups) {
      this.capacityModel.initializeColumn(group.id);
    }

    // Stage 2: Degradation and card creation
    const degradedGroups = this.degradationEngine.applyDegradationAndPromotion(groups);
    this.dlog(`Applied degradation to ${degradedGroups.length} groups`);

    // Stage 3: Card positioning and collision resolution
    const result = this.positioningEngine.positionCardsWithFitAlgorithm(
      degradedGroups,
      this.filterEventsByViewWindow.bind(this),
      this.dlog.bind(this)
    );
    this.dlog(`Positioned ${result.positionedCards.length} cards, ${result.anchors.length} anchors`);

    // Stage 4: Calculate metrics
    const adaptiveHalfColumnWidth = this.dispatchEngine.calculateAdaptiveHalfColumnWidth();
    const metrics = this.metricsCalculator.calculateMetrics(
      result,
      this.config,
      this.degradationEngine.getAggregationMetrics(),
      this.degradationEngine.getInfiniteMetrics(),
      this.degradationEngine.getDegradationMetrics(),
      adaptiveHalfColumnWidth,
      this.timeRange
    );

    // Add metrics to result for downstream telemetry consumers
    (result as LayoutResult & { telemetryMetrics: typeof metrics }).telemetryMetrics = metrics;

    this.dlog('Layout completed successfully');
    return result;
  }

  /**
   * Helper: Calculate time range from events
   */
  private calculateTimeRange(events: Event[]): void {
    const dates = events.map(e => getEventTimestamp(e));
    const startTime = Math.min(...dates);
    const endTime = Math.max(...dates);
    const duration = endTime - startTime;

    // Reduce padding to 2% to keep events closer to timeline milestones
    const padding = duration * 0.02;

    this.timeRange = {
      startTime: startTime - padding,
      endTime: endTime + padding,
      duration: duration + (padding * 2)
    };
  }

  /**
   * Phase 0.6: Stable sorting with deterministic tie-breakers
   */
  private stableSortEvents(events: Event[]): Event[] {
    return [...events].sort((a, b) => {
      const timeA = getEventTimestamp(a);
      const timeB = getEventTimestamp(b);

      // Primary sort: by date
      if (timeA !== timeB) {
        return timeA - timeB;
      }

      // Secondary tie-breaker: by event ID for determinism
      if (a.id !== b.id) {
        return a.id.localeCompare(b.id);
      }

      // Tertiary tie-breaker: by title for consistency
      return (a.title || '').localeCompare(b.title || '');
    });
  }

  /**
   * Helper: Filter events by current view window to prevent leftover overflow indicators
   */
  private filterEventsByViewWindow(events: Event[]): Event[] {
    if (!this.currentTimeWindow) {
      // No view window filtering - return all events
      return events;
    }

    const { visibleStartTime, visibleEndTime } = this.currentTimeWindow;

    return events.filter(event => {
      const eventTime = getEventTimestamp(event);
      return eventTime >= visibleStartTime && eventTime <= visibleEndTime;
    });
  }

  /**
   * Helper: Empty result for no events
   */
  private emptyResult(): LayoutResult {
    return {
      positionedCards: [],
      anchors: [],
      clusters: [],
      utilization: { totalSlots: 0, usedSlots: 0, percentage: 0 }
    };
  }
}