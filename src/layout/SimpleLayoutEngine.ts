/**
 * Stage 1: Simple Layout Engine - Foundation with Full Cards Only
 * 
 * This is the first iteration focused on:
 * - Basic temporal positioning
 * - Simple above/below card placement  
 * - Only full cards (96px height, fixed width)
 * - Timeline axis with date labels
 * - Support for 1-5 events
 */

import type { Event } from '../types';

export interface SimpleLayoutConfig {
  viewportWidth: number;
  viewportHeight: number;
  timelineY?: number; // Y position of timeline axis
  cardWidth?: number;
  cardHeight?: number;
  marginX?: number;
  marginY?: number;
}

export interface TimelineBounds {
  startTime: number;
  endTime: number;
  duration: number;
  paddedStartTime: number;
  paddedEndTime: number;
  paddedDuration: number;
}

export interface SimplePositionedCard {
  id: string;
  event: Event;
  x: number;
  y: number;
  width: number;
  height: number;
  isAbove: boolean; // true = above timeline, false = below
}

export interface SimpleAnchor {
  id: string;
  x: number;
  y: number;
  date: string;
}

export interface SimpleLayoutResult {
  cards: SimplePositionedCard[];
  anchors: SimpleAnchor[];
  bounds: TimelineBounds;
  timelineY: number;
}

export class SimpleLayoutEngine {
  private config: SimpleLayoutConfig;
  private timelineY: number;
  private cardWidth: number;
  private cardHeight: number;
  private marginX: number;
  private marginY: number;

  constructor(config: SimpleLayoutConfig) {
    this.config = config;
    this.timelineY = config.timelineY || config.viewportHeight / 2;
    this.cardWidth = config.cardWidth || 200;
    this.cardHeight = config.cardHeight || 96; // Full card height
    this.marginX = config.marginX || 50;
    this.marginY = config.marginY || 40;
  }

  /**
   * Stage 1: Simple layout with full cards only
   */
  layout(events: Event[]): SimpleLayoutResult {
    if (events.length === 0) {
      return this.emptyResult();
    }

    // Step 1: Calculate timeline bounds
    const bounds = this.calculateTimelineBounds(events);
    
    // Step 2: Position cards alternating above/below
    const cards = this.positionCards(events, bounds);
    
    // Step 3: Create anchors at temporal positions
    const anchors = this.createAnchors(events, bounds);

    return {
      cards,
      anchors, 
      bounds,
      timelineY: this.timelineY
    };
  }

  /**
   * Calculate timeline bounds with padding
   */
  private calculateTimelineBounds(events: Event[]): TimelineBounds {
    const dates = events.map(e => new Date(e.date).getTime());
    const startTime = Math.min(...dates);
    const endTime = Math.max(...dates);
    const duration = endTime - startTime;
    
    // Add 10% padding on each side for visual breathing room
    const padding = Math.max(duration * 0.1, 1000 * 60 * 60 * 24); // Minimum 1 day padding
    
    return {
      startTime,
      endTime,
      duration,
      paddedStartTime: startTime - padding,
      paddedEndTime: endTime + padding,
      paddedDuration: duration + (padding * 2)
    };
  }

  /**
   * Convert temporal position to screen X coordinate
   */
  private timeToX(timestamp: number, bounds: TimelineBounds): number {
    const usableWidth = this.config.viewportWidth - (this.marginX * 2);
    const ratio = (timestamp - bounds.paddedStartTime) / bounds.paddedDuration;
    return this.marginX + (ratio * usableWidth);
  }

  /**
   * Position cards alternating above/below timeline
   */
  private positionCards(events: Event[], bounds: TimelineBounds): SimplePositionedCard[] {
    const cards: SimplePositionedCard[] = [];
    
    // Sort events chronologically for consistent positioning
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sortedEvents.forEach((event, index) => {
      const timestamp = new Date(event.date).getTime();
      const x = this.timeToX(timestamp, bounds) - (this.cardWidth / 2);
      const isAbove = index % 2 === 0; // Alternate: 0,2,4... above, 1,3,5... below
      
      let y: number;
      if (isAbove) {
        // Position above timeline
        y = this.timelineY - this.marginY - this.cardHeight;
      } else {
        // Position below timeline  
        y = this.timelineY + this.marginY;
      }

      cards.push({
        id: `card-${event.id}`,
        event,
        x,
        y,
        width: this.cardWidth,
        height: this.cardHeight,
        isAbove
      });
    });

    return cards;
  }

  /**
   * Create anchors on timeline at event positions
   */
  private createAnchors(events: Event[], bounds: TimelineBounds): SimpleAnchor[] {
    return events.map(event => {
      const timestamp = new Date(event.date).getTime();
      const x = this.timeToX(timestamp, bounds);
      
      return {
        id: `anchor-${event.id}`,
        x,
        y: this.timelineY,
        date: event.date
      };
    });
  }

  /**
   * Empty result when no events
   */
  private emptyResult(): SimpleLayoutResult {
    return {
      cards: [],
      anchors: [],
      bounds: {
        startTime: Date.now(),
        endTime: Date.now(),
        duration: 0,
        paddedStartTime: Date.now(),
        paddedEndTime: Date.now(),
        paddedDuration: 0
      },
      timelineY: this.timelineY
    };
  }
}