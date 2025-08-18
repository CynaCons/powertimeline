import type { Event } from '../types';
import type { TimelineBounds, ViewportMapping } from './TimelineBounds';

/**
 * Event Distribution System
 * Phase 1.2: Optimal event dispatch algorithm across timeline width
 * Implements horizontal space utilization maximization
 */

export interface DistributedEvent {
  event: Event;
  timestamp: number;
  x: number;               // X position on timeline
  originalIndex: number;   // Original position in events array
  density: number;         // Local density around this event
}

export interface DistributionMetrics {
  totalEvents: number;
  averageDensity: number;
  maxDensity: number;
  minDensity: number;
  horizontalUtilization: number; // Percentage of timeline width used
  clusteringRecommended: boolean; // Whether clustering should be applied
}

export class EventDistributionEngine {
  private densityWindowMs = 30 * 24 * 60 * 60 * 1000; // 30 days for density calculation

  /**
   * Distribute events optimally across timeline width
   * Core implementation of horizontal space optimization
   */
  distributeEvents(
    events: Event[],
    bounds: TimelineBounds,
    mapping: ViewportMapping
  ): DistributedEvent[] {
    if (events.length === 0) {
      return [];
    }

    // Sort events chronologically
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Convert to distributed events with positions
    const distributedEvents = sortedEvents.map((event, index) => {
      const timestamp = new Date(event.date).getTime();
      const x = this.timeToX(timestamp, bounds, mapping);
      
      return {
        event,
        timestamp,
        x,
        originalIndex: index,
        density: this.calculateLocalDensity(timestamp, sortedEvents, bounds)
      };
    });

    // Filter events within bounds and optimize positions
    const visibleEvents = distributedEvents.filter(de => 
      this.isEventInBounds(de.timestamp, bounds)
    );

    // Apply horizontal optimization
    return this.optimizeHorizontalDistribution(visibleEvents, bounds, mapping);
  }

  /**
   * Calculate distribution metrics for analysis
   */
  calculateMetrics(
    distributedEvents: DistributedEvent[],
    _bounds: TimelineBounds,
    mapping: ViewportMapping
  ): DistributionMetrics {
    if (distributedEvents.length === 0) {
      return {
        totalEvents: 0,
        averageDensity: 0,
        maxDensity: 0,
        minDensity: 0,
        horizontalUtilization: 0,
        clusteringRecommended: false
      };
    }

    const densities = distributedEvents.map(de => de.density);
    const positions = distributedEvents.map(de => de.x);

    const averageDensity = densities.reduce((sum, d) => sum + d, 0) / densities.length;
    const maxDensity = Math.max(...densities);
    const minDensity = Math.min(...densities);

    // Calculate horizontal utilization
    const usedWidth = Math.max(...positions) - Math.min(...positions);
    const horizontalUtilization = (usedWidth / mapping.timelineWidth) * 100;

    // Determine if clustering is recommended
    const clusteringRecommended = this.shouldApplyClustering(
      distributedEvents, 
      _bounds, 
      mapping
    );

    return {
      totalEvents: distributedEvents.length,
      averageDensity,
      maxDensity,
      minDensity,
      horizontalUtilization,
      clusteringRecommended
    };
  }

  /**
   * Analyze event density to determine distribution strategy
   */
  analyzeEventDensity(
    events: Event[],
    bounds: TimelineBounds
  ): { 
    isHighDensity: boolean; 
    isMediumDensity: boolean; 
    isLowDensity: boolean;
    eventsPerDay: number;
  } {
    const totalDays = bounds.duration / (24 * 60 * 60 * 1000);
    const eventsPerDay = events.length / totalDays;

    return {
      isHighDensity: eventsPerDay > 2,
      isMediumDensity: eventsPerDay > 0.5 && eventsPerDay <= 2,
      isLowDensity: eventsPerDay <= 0.5,
      eventsPerDay
    };
  }

  /**
   * Calculate viewport space allocation for optimal distribution
   */
  calculateSpaceAllocation(
    eventCount: number,
    _bounds: TimelineBounds,
    mapping: ViewportMapping
  ): {
    recommendedColumnCount: number;
    columnWidth: number;
    spacing: number;
    utilizationTarget: number;
  } {
    // Target 80% utilization for optimal visual distribution
    const utilizationTarget = 0.8;
    const availableWidth = mapping.timelineWidth * utilizationTarget;

    // Base column width and spacing
    const baseColumnWidth = 200;
    const baseSpacing = 20;

    // Calculate optimal column count based on events and available width
    const maxPossibleColumns = Math.floor(availableWidth / (baseColumnWidth + baseSpacing));
    const idealColumnsForEvents = Math.ceil(eventCount / 8); // Max 8 events per column
    
    const recommendedColumnCount = Math.min(maxPossibleColumns, idealColumnsForEvents);
    const columnWidth = Math.min(
      baseColumnWidth,
      (availableWidth - (recommendedColumnCount - 1) * baseSpacing) / recommendedColumnCount
    );

    return {
      recommendedColumnCount,
      columnWidth: Math.max(150, columnWidth), // Minimum column width
      spacing: baseSpacing,
      utilizationTarget
    };
  }

  /**
   * Optimize horizontal distribution to maximize screen usage
   */
  private optimizeHorizontalDistribution(
    events: DistributedEvent[],
    bounds: TimelineBounds,
    mapping: ViewportMapping
  ): DistributedEvent[] {
    if (events.length <= 1) {
      return events;
    }

    // Sort by x position
    const sortedEvents = [...events].sort((a, b) => a.x - b.x);
    
    // Apply anti-clustering when space is available
    const spaceAllocation = this.calculateSpaceAllocation(
      events.length, 
      bounds, 
      mapping
    );

    // If we have plenty of space, spread events out more
    if (spaceAllocation.recommendedColumnCount < events.length / 4) {
      return this.applyAntiClustering(sortedEvents, mapping, spaceAllocation);
    }

    return sortedEvents;
  }

  /**
   * Apply anti-clustering logic when space is available
   */
  private applyAntiClustering(
    events: DistributedEvent[],
    _mapping: ViewportMapping,
    spaceAllocation: { columnWidth: number; spacing: number }
  ): DistributedEvent[] {
    const minSpacing = spaceAllocation.columnWidth + spaceAllocation.spacing;
    
    return events.map((event, index) => {
      if (index === 0) return event;
      
      const prevEvent = events[index - 1];
      const desiredSpacing = event.x - prevEvent.x;
      
      // If events are too close together and we have space, spread them out
      if (desiredSpacing < minSpacing) {
        const adjustment = minSpacing - desiredSpacing;
        return {
          ...event,
          x: event.x + adjustment
        };
      }
      
      return event;
    });
  }

  /**
   * Calculate local density around an event
   */
  private calculateLocalDensity(
    timestamp: number,
    allEvents: Event[],
    _bounds: TimelineBounds
  ): number {
    const windowStart = timestamp - this.densityWindowMs / 2;
    const windowEnd = timestamp + this.densityWindowMs / 2;
    
    const eventsInWindow = allEvents.filter(event => {
      const eventTime = new Date(event.date).getTime();
      return eventTime >= windowStart && eventTime <= windowEnd;
    });

    // Density = events per day in the window
    const windowDays = this.densityWindowMs / (24 * 60 * 60 * 1000);
    return eventsInWindow.length / windowDays;
  }

  /**
   * Determine if clustering should be applied based on distribution
   */
  private shouldApplyClustering(
    events: DistributedEvent[],
    _bounds: TimelineBounds,
    mapping: ViewportMapping
  ): boolean {
    const metrics = this.calculateBasicMetrics(events, mapping);
    
    // Apply clustering if:
    // 1. High density (> 0.1 events per pixel)
    // 2. Low horizontal utilization (< 60%)
    // 3. Many events with similar timestamps
    
    return (
      metrics.density > 0.1 ||
      metrics.utilization < 60 ||
      metrics.hasClusteredTimestamps
    );
  }

  /**
   * Calculate basic distribution metrics
   */
  private calculateBasicMetrics(
    events: DistributedEvent[],
    mapping: ViewportMapping
  ): {
    density: number;
    utilization: number;
    hasClusteredTimestamps: boolean;
  } {
    if (events.length === 0) {
      return { density: 0, utilization: 0, hasClusteredTimestamps: false };
    }

    const positions = events.map(e => e.x);
    const usedWidth = Math.max(...positions) - Math.min(...positions);
    const density = events.length / mapping.timelineWidth;
    const utilization = (usedWidth / mapping.timelineWidth) * 100;

    // Check for clustered timestamps (events within 1 day of each other)
    const dayMs = 24 * 60 * 60 * 1000;
    let clusteredPairs = 0;
    
    for (let i = 0; i < events.length - 1; i++) {
      const timeDiff = Math.abs(events[i + 1].timestamp - events[i].timestamp);
      if (timeDiff < dayMs) {
        clusteredPairs++;
      }
    }
    
    const hasClusteredTimestamps = clusteredPairs > events.length * 0.3;

    return { density, utilization, hasClusteredTimestamps };
  }

  /**
   * Convert timestamp to x-coordinate
   */
  private timeToX(timestamp: number, bounds: TimelineBounds, mapping: ViewportMapping): number {
    const timeOffset = timestamp - bounds.startTime;
    return (timeOffset / bounds.duration) * mapping.timelineWidth + 56; // Add sidebar offset
  }

  /**
   * Check if event timestamp is within bounds
   */
  private isEventInBounds(timestamp: number, bounds: TimelineBounds): boolean {
    return timestamp >= bounds.startTime && timestamp <= bounds.endTime;
  }
}