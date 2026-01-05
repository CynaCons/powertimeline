import React, { useMemo, useState, useRef, useCallback, memo, useEffect } from 'react';
import type { Event } from '../types';

interface TimelineMinimapProps {
  events: Event[];
  viewStart: number;
  viewEnd: number;
  onNavigate: (start: number, end: number) => void;
  className?: string;
  highlightedEventId?: string;
  hoveredEventId?: string;
}

interface EventMarkerProps {
  position: number;
  eventId: string;
  eventTitle: string;
  eventYear: number;
}

/**
 * Memoized event marker component - uses CSS data attributes for hover/selection state
 * to avoid re-renders when hoveredEventId changes. The parent sets data-hovered-id and
 * data-selected-id attributes, and CSS handles the styling.
 */
const EventMarker = memo(function EventMarker({
  position,
  eventId,
  eventTitle,
  eventYear
}: EventMarkerProps) {
  return (
    <div
      className="minimap-marker"
      data-event-id={eventId}
      style={{
        left: `${position * 100}%`,
      }}
      title={`${eventTitle} (${eventYear})`}
    />
  );
});

export function TimelineMinimap({
  events,
  viewStart,
  viewEnd,
  onNavigate,
  className = "",
  highlightedEventId,
  hoveredEventId
}: TimelineMinimapProps) {
  
  // Drag state for view window sliding
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartViewStart, setDragStartViewStart] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const minimapRef = useRef<HTMLDivElement>(null);
  const minimapRectRef = useRef<DOMRect | null>(null);
  
  // Calculate timeline date range
  const timelineRange = useMemo(() => {
    if (events.length === 0) {
      return { startDate: new Date(), endDate: new Date(), totalDuration: 0 };
    }
    
    const dates = events.map(e => new Date(e.date).getTime());
    const startDate = new Date(Math.min(...dates));
    const endDate = new Date(Math.max(...dates));
    const totalDuration = endDate.getTime() - startDate.getTime();
    
    return { startDate, endDate, totalDuration };
  }, [events]);

  // Calculate event density markers with pre-computed data for efficient rendering
  const eventMarkers = useMemo(() => {
    if (events.length === 0 || timelineRange.totalDuration === 0) return [];

    const markers = events.map(event => {
      const eventTime = new Date(event.date).getTime();
      const position = (eventTime - timelineRange.startDate.getTime()) / timelineRange.totalDuration;
      return {
        position: Math.max(0, Math.min(1, position)),
        eventId: event.id,
        eventTitle: event.title,
        eventYear: new Date(event.date).getFullYear()
      };
    });

    return markers;
  }, [events, timelineRange]);

  // Ref for markers container - used for direct DOM updates to avoid React re-renders
  const markersContainerRef = useRef<HTMLDivElement>(null);

  // Listen for custom timeline:hover events for instant DOM updates (bypasses React)
  // This enables O(1) hover response time regardless of component tree size
  useEffect(() => {
    const container = markersContainerRef.current;
    if (!container) return;

    const handleHoverEvent = (evt: globalThis.Event) => {
      const customEvent = evt as CustomEvent<{ eventId: string | null }>;
      const eventId = customEvent.detail?.eventId;

      // Remove previous hover class
      const prevHovered = container.querySelector('.minimap-marker.is-hovered');
      if (prevHovered) {
        prevHovered.classList.remove('is-hovered');
      }

      // Add hover class to new marker
      if (eventId) {
        const newHovered = container.querySelector(`.minimap-marker[data-event-id="${eventId}"]`);
        if (newHovered) {
          newHovered.classList.add('is-hovered');
        }
      }
    };

    document.addEventListener('timeline:hover', handleHoverEvent);
    return () => document.removeEventListener('timeline:hover', handleHoverEvent);
  }, []);

  // Direct DOM manipulation for hover/selection state changes via React props (fallback)
  // This handles hoveredEventId prop changes from canvas card hovers
  useEffect(() => {
    const container = markersContainerRef.current;
    if (!container) return;

    // Remove previous hover class
    const prevHovered = container.querySelector('.minimap-marker.is-hovered');
    if (prevHovered) {
      prevHovered.classList.remove('is-hovered');
    }

    // Add hover class to new marker
    if (hoveredEventId) {
      const newHovered = container.querySelector(`.minimap-marker[data-event-id="${hoveredEventId}"]`);
      if (newHovered) {
        newHovered.classList.add('is-hovered');
      }
    }
  }, [hoveredEventId]);

  useEffect(() => {
    const container = markersContainerRef.current;
    if (!container) return;

    // Remove previous selected class
    const prevSelected = container.querySelector('.minimap-marker.is-selected');
    if (prevSelected) {
      prevSelected.classList.remove('is-selected');
    }

    // Add selected class to new marker
    if (highlightedEventId) {
      const newSelected = container.querySelector(`.minimap-marker[data-event-id="${highlightedEventId}"]`);
      if (newSelected) {
        newSelected.classList.add('is-selected');
      }
    }
  }, [highlightedEventId]);

  // Handle view window dragging
  const handleViewWindowMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    // Cache minimap dimensions on drag start to avoid layout thrashing
    if (minimapRef.current) {
      minimapRectRef.current = minimapRef.current.getBoundingClientRect();
    }

    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartViewStart(viewStart);
  }, [viewStart]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !minimapRectRef.current) return;

    // Use cached rect to avoid layout thrashing on every mousemove
    const rect = minimapRectRef.current;
    const deltaX = e.clientX - dragStartX;
    const deltaRatio = deltaX / rect.width;

    const currentViewWidth = viewEnd - viewStart;
    let newStart = dragStartViewStart + deltaRatio;
    let newEnd = newStart + currentViewWidth;

    // Clamp to boundaries
    if (newStart < 0) {
      newStart = 0;
      newEnd = currentViewWidth;
    } else if (newEnd > 1) {
      newEnd = 1;
      newStart = 1 - currentViewWidth;
    }

    onNavigate(newStart, newEnd);
  }, [isDragging, dragStartX, dragStartViewStart, viewStart, viewEnd, onNavigate]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle click navigation (when not dragging view window)
  const handleMinimapClick = (e: React.MouseEvent) => {
    if (isDragging) return; // Don't navigate on drag end
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = clickX / rect.width;
    
    // Calculate new view window centered on click position
    const currentViewWidth = viewEnd - viewStart;
    const newStart = Math.max(0, clickRatio - currentViewWidth / 2);
    const newEnd = Math.min(1, newStart + currentViewWidth);
    
    // Adjust if we hit boundaries
    const adjustedStart = newEnd === 1 ? Math.max(0, 1 - currentViewWidth) : newStart;
    
    onNavigate(adjustedStart, newEnd);
  };

  // Global mouse event listeners for dragging
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Generate density heatmap gradient
  const generateDensityGradient = useCallback((markers: { position: number }[]) => {
    if (markers.length === 0) return 'transparent';

    // Create density buckets across the timeline
    const buckets = new Array(20).fill(0);
    markers.forEach(marker => {
      const bucketIndex = Math.floor(marker.position * (buckets.length - 1));
      buckets[bucketIndex]++;
    });

    const maxDensity = Math.max(...buckets, 1);
    const gradientStops = buckets.map((density, index) => {
      const position = (index / (buckets.length - 1)) * 100;
      const intensity = density / maxDensity;
      const opacity = Math.max(0.1, intensity * 0.6);
      return `rgba(59, 130, 246, ${opacity}) ${position}%`;  // blue-500
    }).join(', ');

    return `linear-gradient(90deg, ${gradientStops})`;
  }, []);

  // Format date for display
  const formatYear = (date: Date) => {
    return date.getFullYear().toString();
  };

  // Don't render if no events
  if (events.length === 0) {
    return (
      <div className={`relative rounded-xl p-3 ${className}`} style={{ backgroundColor: 'var(--page-bg-elevated)', border: '1px solid var(--page-border)' }}>
        <div className="flex items-center justify-center text-sm" style={{ color: 'var(--page-text-secondary)' }}>
          No events to display
        </div>
      </div>
    );
  }


  return (
    <div
      data-testid="minimap-container"
      className={`relative rounded px-2 py-1 transition-all duration-300 ease-out shadow-sm hover:shadow-md ${className}`}
      style={{ backgroundColor: 'var(--page-bg-elevated)', border: '1px solid var(--page-border)' }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Enhanced timeline bar with dates inline */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium flex-shrink-0 transition-colors duration-200" style={{ color: 'var(--page-text-secondary)' }}>
          {formatYear(timelineRange.startDate)}
        </span>
        
        {/* Enhanced minimap timeline bar */}
        <div
          ref={minimapRef}
          className="relative h-2 bg-neutral-200 rounded cursor-pointer hover:bg-neutral-300 transition-all duration-300 ease-out flex-1 shadow-inner"
          onClick={handleMinimapClick}
          style={{
            background: `linear-gradient(90deg, var(--color-neutral-200) 0%, var(--color-neutral-100) 50%, var(--color-neutral-200) 100%)`
          }}
        >
          {/* Density heatmap background */}
          <div
            className="absolute inset-0 rounded opacity-30"
            style={{
              background: generateDensityGradient(eventMarkers)
            }}
          />
          {/* Enhanced event density markers - blue for events (memoized for performance)
              CSS handles hover/selection styling via direct DOM class updates for O(1) performance */}
          <div
            ref={markersContainerRef}
            className="minimap-markers-container"
          >
            {eventMarkers.map((marker) => (
              <EventMarker
                key={marker.eventId}
                position={marker.position}
                eventId={marker.eventId}
                eventTitle={marker.eventTitle}
                eventYear={marker.eventYear}
              />
            ))}
          </div>
          
          {/* Enhanced current view window indicator - grey overlay */}
          <div
            className={`absolute rounded transition-all duration-200 ease-out ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
              left: `${viewStart * 100}%`,
              width: `${(viewEnd - viewStart) * 100}%`,
              background: 'rgba(107, 114, 128, 0.2)',
              border: '2px solid rgb(107, 114, 128)',
              borderRadius: '6px',
              boxShadow: isHovering ? '0 0 8px rgba(107, 114, 128, 0.4)' : '0 0 4px rgba(107, 114, 128, 0.2)',
              top: '-1px',
              height: 'calc(100% + 2px)',
              zIndex: 1
            }}
            onMouseDown={handleViewWindowMouseDown}
          >
            {/* View window content indicator */}
            <div
              className="absolute bg-neutral-400 opacity-20 rounded-sm"
              style={{ inset: '3px 2px' }}
            ></div>
          </div>
        </div>

        <span className="text-xs font-medium flex-shrink-0 transition-colors duration-200" style={{ color: 'var(--page-text-secondary)' }}>
          {formatYear(timelineRange.endDate)}
        </span>
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--page-text-secondary)' }}>
          <span className="px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--page-accent)', border: '1px solid var(--page-accent)' }}>
            {events.length} events
          </span>
          <span className="hidden sm:inline opacity-70">
            Timeline Overview
          </span>
        </div>
      </div>
    </div>
  );
}
