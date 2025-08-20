/**
 * Stage 1: Simple Timeline Component - Foundation with Full Cards Only
 * 
 * Renders the results from SimpleLayoutEngine:
 * - Full cards positioned above/below timeline
 * - Timeline axis with date labels and ticks
 * - Horizontal line at viewport center
 * - Anchors connecting cards to timeline
 */

import { useMemo } from 'react';
import { SimpleLayoutEngine, type SimpleLayoutConfig } from '../layout/SimpleLayoutEngine';
import type { Event } from '../types';

interface SimpleTimelineProps {
  events: Event[];
  width?: number;
  height?: number;
  className?: string;
}

export function SimpleTimeline({ 
  events, 
  width = 1200, 
  height = 600, 
  className = "" 
}: SimpleTimelineProps) {
  
  // Calculate layout using SimpleLayoutEngine
  const layout = useMemo(() => {
    const config: SimpleLayoutConfig = {
      viewportWidth: width,
      viewportHeight: height,
      timelineY: height / 2,
      cardWidth: 200,
      cardHeight: 96,
      marginX: 50,
      marginY: 40
    };
    
    const engine = new SimpleLayoutEngine(config);
    return engine.layout(events);
  }, [events, width, height]);

  // Generate date labels for timeline axis
  const dateLabels = useMemo(() => {
    if (events.length === 0) return [];
    
    const { bounds } = layout;
    const labelCount = Math.min(5, Math.max(2, Math.floor(width / 200))); // 2-5 labels
    const step = bounds.paddedDuration / (labelCount - 1);
    
    return Array.from({ length: labelCount }, (_, i) => {
      const timestamp = bounds.paddedStartTime + (i * step);
      const date = new Date(timestamp);
      const x = (i * (width - 100)) / (labelCount - 1) + 50; // Spread across usable width
      
      // Format date based on range
      let label: string;
      if (bounds.paddedDuration < 1000 * 60 * 60 * 24 * 7) { // Less than a week
        label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (bounds.paddedDuration < 1000 * 60 * 60 * 24 * 365) { // Less than a year
        label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } else {
        label = date.getFullYear().toString();
      }
      
      return { x, label, timestamp };
    });
  }, [layout, width, events.length]);

  return (
    <div 
      className={`relative bg-gray-50 overflow-hidden ${className}`}
      style={{ width, height }}
      data-testid="simple-timeline"
    >
      
      {/* Timeline Axis Line */}
      <div
        className="absolute bg-gray-800"
        style={{
          left: 50,
          right: 50,
          top: layout.timelineY - 1,
          height: 2
        }}
        data-testid="timeline-axis"
      />
      
      {/* Date Labels */}
      {dateLabels.map((label, index) => (
        <div
          key={index}
          className="absolute text-sm text-gray-600 text-center"
          style={{
            left: label.x - 40,
            top: layout.timelineY + 10,
            width: 80
          }}
        >
          {label.label}
        </div>
      ))}
      
      {/* Tick Marks */}
      {dateLabels.map((label, index) => (
        <div
          key={`tick-${index}`}
          className="absolute bg-gray-600"
          style={{
            left: label.x - 0.5,
            top: layout.timelineY - 6,
            width: 1,
            height: 12
          }}
        />
      ))}
      
      {/* Anchors on Timeline */}
      {layout.anchors.map(anchor => (
        <div
          key={anchor.id}
          className="absolute w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1 -translate-y-1"
          style={{
            left: anchor.x,
            top: anchor.y
          }}
          title={`Event at ${new Date(anchor.date).toLocaleDateString()}`}
        />
      ))}
      
      {/* Connection Lines from Cards to Timeline */}
      {layout.cards.map(card => (
        <div
          key={`line-${card.id}`}
          className="absolute bg-gray-400"
          style={{
            left: card.x + card.width / 2 - 0.5,
            top: card.isAbove ? card.y + card.height : layout.timelineY + 2,
            width: 1,
            height: card.isAbove 
              ? layout.timelineY - (card.y + card.height) - 2
              : card.y - layout.timelineY - 2
          }}
        />
      ))}
      
      {/* Event Cards */}
      {layout.cards.map(card => (
        <div
          key={card.id}
          className="absolute bg-white border-2 border-gray-300 rounded-lg p-3 shadow-sm"
          style={{
            left: card.x,
            top: card.y,
            width: card.width,
            height: card.height
          }}
          data-testid="event-card"
          data-event-id={card.event.id}
          data-card-type="full"
        >
          <div className="text-sm font-semibold text-gray-900 truncate mb-1">
            {card.event.title}
          </div>
          <div className="text-xs text-gray-500 mb-2">
            {new Date(card.event.date).toLocaleDateString()}
          </div>
          <div className="text-xs text-gray-700 overflow-hidden">
            <div className="line-clamp-3">
              {card.event.description}
            </div>
          </div>
          
          {/* Position indicator */}
          <div className="absolute top-1 right-1 text-xs text-gray-400">
            {card.isAbove ? '↑' : '↓'}
          </div>
        </div>
      ))}
      
      {/* Debug Info (remove in production) */}
      <div className="absolute top-2 left-2 text-xs text-gray-500 bg-white p-2 rounded opacity-75">
        Events: {events.length} | Cards: {layout.cards.length}
      </div>
    </div>
  );
}