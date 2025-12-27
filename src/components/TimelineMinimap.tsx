import React, { useMemo, useState, useRef, useCallback } from 'react';
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

  // Calculate event density markers
  const eventMarkers = useMemo(() => {
    if (events.length === 0 || timelineRange.totalDuration === 0) return [];
    
    const markers = events.map(event => {
      const eventTime = new Date(event.date).getTime();
      const position = (eventTime - timelineRange.startDate.getTime()) / timelineRange.totalDuration;
      return {
        position: Math.max(0, Math.min(1, position)),
        event
      };
    });
    
    return markers;
  }, [events, timelineRange]);

  // Handle view window dragging
  const handleViewWindowMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartViewStart(viewStart);
  }, [viewStart]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !minimapRef.current) return;
    
    const rect = minimapRef.current.getBoundingClientRect();
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
  const generateDensityGradient = useCallback((markers: { position: number; event: Event }[]) => {
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
      <div className={`relative rounded-lg p-3 ${className}`} style={{ backgroundColor: 'var(--page-bg-elevated)', border: '1px solid var(--page-border)' }}>
        <div className="flex items-center justify-center text-sm" style={{ color: 'var(--page-text-secondary)' }}>
          No events to display
        </div>
      </div>
    );
  }


  return (
    <div
      data-testid="timeline-minimap"
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
          {/* Enhanced event density markers - blue for events */}
          {eventMarkers.map((marker, index) => {
            // Explicit undefined checks to prevent undefined === undefined matching all markers
            const isSelected = highlightedEventId !== undefined && highlightedEventId === marker.event.id;
            const isHovered = hoveredEventId !== undefined && hoveredEventId === marker.event.id && !isSelected;
            return (
              <div
                key={index}
                className={`absolute transition-all duration-200 ease-out transform ${
                  isSelected
                    ? 'w-1.5 h-3 bg-amber-400 border border-white rounded-sm'
                    : isHovered
                      ? 'w-1.5 h-2.5 bg-sky-400 border border-white rounded-sm'
                      : 'top-0 w-0.5 h-2 bg-blue-500'
                }`}
                style={{
                  left: `${marker.position * 100}%`,
                  top: isSelected || isHovered ? '50%' : 0,
                  transform: isSelected || isHovered
                    ? 'translate(-50%, -50%)'
                    : 'translateX(-50%)',
                  boxShadow: isSelected
                    ? '0 0 8px rgba(251, 191, 36, 0.55), 0 2px 6px rgba(251, 191, 36, 0.35)'
                    : isHovered
                      ? '0 0 8px rgba(56, 189, 248, 0.45), 0 2px 6px rgba(56, 189, 248, 0.25)'
                      : 'none', // Removed default shadow to prevent glow in dense areas
                  zIndex: isSelected ? 4 : isHovered ? 3 : 2
                }}
                title={`${marker.event.title} (${new Date(marker.event.date).getFullYear()})`}
              />
            );
          })}
          
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