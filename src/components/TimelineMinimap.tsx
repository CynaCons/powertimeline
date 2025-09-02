import React, { useMemo, useState, useRef, useCallback } from 'react';
import type { Event } from '../types';

interface TimelineMinimapProps {
  events: Event[];
  viewStart: number;
  viewEnd: number;
  onNavigate: (start: number, end: number) => void;
  className?: string;
}

export function TimelineMinimap({ 
  events, 
  viewStart, 
  viewEnd, 
  onNavigate, 
  className = "" 
}: TimelineMinimapProps) {
  
  // Drag state for view window sliding
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartViewStart, setDragStartViewStart] = useState(0);
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

  // Format date for display
  const formatYear = (date: Date) => {
    return date.getFullYear().toString();
  };

  // Don't render if no events
  if (events.length === 0) {
    return null;
  }

  return (
    <div className={`relative bg-gray-50 border border-gray-200 rounded-md p-2 ${className}`}>
      {/* Compact timeline bar with dates inline */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-600 flex-shrink-0">{formatYear(timelineRange.startDate)}</span>
        
        {/* Minimap timeline bar */}
        <div 
          ref={minimapRef}
          className="relative h-4 bg-gray-200 rounded cursor-pointer hover:bg-gray-250 transition-colors flex-1"
          onClick={handleMinimapClick}
        >
          {/* Event density markers */}
          {eventMarkers.map((marker, index) => (
            <div
              key={index}
              className="absolute top-0 w-0.5 h-4 bg-blue-400 opacity-60"
              style={{ left: `${marker.position * 100}%` }}
              title={`${marker.event.title} (${new Date(marker.event.date).getFullYear()})`}
            />
          ))}
          
          {/* Current view window indicator - draggable and transparent */}
          <div
            className={`absolute top-0 h-4 bg-transparent border border-blue-500 border-opacity-60 rounded ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{
              left: `${viewStart * 100}%`,
              width: `${(viewEnd - viewStart) * 100}%`
            }}
            onMouseDown={handleViewWindowMouseDown}
          >
            {/* View window handle indicators - small and subtle */}
            <div className="absolute -left-0.5 top-0.5 w-1 h-3 bg-blue-600 rounded-sm opacity-80"></div>
            <div className="absolute -right-0.5 top-0.5 w-1 h-3 bg-blue-600 rounded-sm opacity-80"></div>
          </div>
        </div>
        
        <span className="text-xs text-gray-600 flex-shrink-0">{formatYear(timelineRange.endDate)}</span>
        <span className="text-xs text-gray-400 flex-shrink-0">Timeline Overview</span>
        <span className="text-xs text-gray-500 flex-shrink-0">{events.length} events</span>
      </div>
    </div>
  );
}