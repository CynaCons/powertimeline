import type { Event } from '../types';

/**
 * Timeline Display Range Calculator
 * Phase 1.1: Implements timeline bounds calculation (start_date, end_date)
 */

export interface TimelineBounds {
  startTime: number;    // Timestamp of display start
  endTime: number;      // Timestamp of display end
  duration: number;     // Total duration in milliseconds
  padding: number;      // Applied padding in milliseconds
  zoomLevel: number;    // Current zoom level (1.0 = normal)
}

export interface ViewportMapping {
  timelineWidth: number;      // Available timeline width in pixels
  timeToPixelRatio: number;   // Milliseconds per pixel
  pixelToTimeRatio: number;   // Pixels per millisecond
}

export class TimelineBoundsCalculator {
  private defaultPaddingPercent = 0.1; // 10% padding on each side
  private minPaddingMs = 7 * 24 * 60 * 60 * 1000; // 7 days minimum
  private maxPaddingMs = 365 * 24 * 60 * 60 * 1000; // 1 year maximum

  /**
   * Calculate optimal timeline display bounds for given events
   */
  calculateBounds(
    events: Event[], 
    _viewportWidth: number, 
    zoomLevel: number = 1.0
  ): TimelineBounds {
    if (events.length === 0) {
      return this.getDefaultBounds(zoomLevel);
    }

    // Extract timestamps from events
    const timestamps = events.map(event => new Date(event.date).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    
    // Calculate base duration
    const baseDuration = maxTime - minTime;
    
    // Calculate padding based on duration and constraints
    const paddingFromPercent = baseDuration * this.defaultPaddingPercent;
    const padding = Math.max(
      this.minPaddingMs,
      Math.min(this.maxPaddingMs, paddingFromPercent)
    );

    // Apply zoom level to effective duration
    const effectiveDuration = (baseDuration + 2 * padding) / zoomLevel;
    const zoomPadding = (effectiveDuration - baseDuration) / 2;

    const startTime = minTime - zoomPadding;
    const endTime = maxTime + zoomPadding;

    return {
      startTime,
      endTime,
      duration: endTime - startTime,
      padding: zoomPadding,
      zoomLevel
    };
  }

  /**
   * Create viewport-to-timeline coordinate mapping
   */
  createViewportMapping(bounds: TimelineBounds, viewportWidth: number): ViewportMapping {
    const timelineWidth = viewportWidth - 112; // Account for sidebar (56px) and margins
    const timeToPixelRatio = bounds.duration / timelineWidth;
    const pixelToTimeRatio = timelineWidth / bounds.duration;

    return {
      timelineWidth,
      timeToPixelRatio,
      pixelToTimeRatio
    };
  }

  /**
   * Convert timestamp to x-coordinate on timeline
   */
  timeToX(timestamp: number, bounds: TimelineBounds, mapping: ViewportMapping): number {
    const timeOffset = timestamp - bounds.startTime;
    return (timeOffset * mapping.pixelToTimeRatio) + 56; // Add sidebar offset
  }

  /**
   * Convert x-coordinate to timestamp
   */
  xToTime(x: number, bounds: TimelineBounds, mapping: ViewportMapping): number {
    const timelineX = x - 56; // Remove sidebar offset
    const timeOffset = timelineX * mapping.timeToPixelRatio;
    return bounds.startTime + timeOffset;
  }

  /**
   * Check if timestamp is within display bounds
   */
  isTimeInBounds(timestamp: number, bounds: TimelineBounds): boolean {
    return timestamp >= bounds.startTime && timestamp <= bounds.endTime;
  }

  /**
   * Calculate optimal column width based on event density and viewport
   */
  calculateOptimalColumnWidth(
    eventCount: number, 
    _bounds: TimelineBounds, 
    mapping: ViewportMapping
  ): number {
    // Base column width
    const baseWidth = 200;
    
    // Calculate event density (events per pixel)
    const density = eventCount / mapping.timelineWidth;
    
    // Adjust width based on density - more events = narrower columns
    let optimalWidth = baseWidth;
    
    if (density > 0.1) {
      // High density: reduce column width
      optimalWidth = Math.max(150, baseWidth * (0.1 / density));
    } else if (density < 0.05) {
      // Low density: increase column width for better space usage
      optimalWidth = Math.min(300, baseWidth * (0.05 / density));
    }

    return Math.round(optimalWidth);
  }

  /**
   * Get default bounds when no events are present
   */
  private getDefaultBounds(zoomLevel: number = 1.0): TimelineBounds {
    const now = Date.now();
    const defaultDuration = 365 * 24 * 60 * 60 * 1000; // 1 year
    const effectiveDuration = defaultDuration / zoomLevel;
    const padding = effectiveDuration * 0.1;

    return {
      startTime: now - effectiveDuration / 2,
      endTime: now + effectiveDuration / 2,
      duration: effectiveDuration,
      padding,
      zoomLevel
    };
  }

  /**
   * Update bounds for zoom level change
   */
  updateBoundsForZoom(
    currentBounds: TimelineBounds, 
    newZoomLevel: number, 
    centerTime?: number
  ): TimelineBounds {
    const zoomRatio = currentBounds.zoomLevel / newZoomLevel;
    const newDuration = currentBounds.duration * zoomRatio;
    
    // Use provided center time or current center
    const centerTimestamp = centerTime || (currentBounds.startTime + currentBounds.endTime) / 2;
    
    const newStartTime = centerTimestamp - newDuration / 2;
    const newEndTime = centerTimestamp + newDuration / 2;

    return {
      startTime: newStartTime,
      endTime: newEndTime,
      duration: newDuration,
      padding: currentBounds.padding * zoomRatio,
      zoomLevel: newZoomLevel
    };
  }
}