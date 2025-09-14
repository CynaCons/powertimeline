import React, { useMemo } from 'react';
import type { Event } from '../types';

export interface TimelineMarker {
  id: string;
  date: string;
  label: string;
  type: 'today' | 'milestone' | 'custom';
  color?: string;
  pulse?: boolean;
}

interface TimelineMarkersProps {
  events: Event[];
  viewStart: number;
  viewEnd: number;
  customMarkers?: TimelineMarker[];
  showToday?: boolean;
  onMarkerClick?: (marker: TimelineMarker) => void;
}

export function TimelineMarkers({
  events,
  viewStart,
  viewEnd,
  customMarkers = [],
  showToday = true,
  onMarkerClick
}: TimelineMarkersProps) {
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

  const markers = useMemo(() => {
    const allMarkers: TimelineMarker[] = [];

    // Add "Today" marker if enabled
    if (showToday) {
      const today = new Date();
      const todayTime = today.getTime();

      // Only show if today is within the timeline range
      if (timelineRange.totalDuration > 0 &&
          todayTime >= timelineRange.startDate.getTime() &&
          todayTime <= timelineRange.endDate.getTime()) {
        allMarkers.push({
          id: 'today',
          date: today.toISOString(),
          label: 'Today',
          type: 'today',
          color: 'var(--color-primary-500)',
          pulse: true
        });
      }
    }

    // Add milestone markers for high-priority events
    const milestones = events
      .filter(event => event.priority === 'high' || event.category === 'milestone')
      .map(event => ({
        id: `milestone-${event.id}`,
        date: event.date,
        label: event.title,
        type: 'milestone' as const,
        color: 'var(--color-warning-500)'
      }));

    allMarkers.push(...milestones);

    // Add custom markers
    allMarkers.push(...customMarkers);

    // Calculate positions and filter by view window
    return allMarkers
      .map(marker => {
        if (timelineRange.totalDuration === 0) return null;

        const markerTime = new Date(marker.date).getTime();
        const position = (markerTime - timelineRange.startDate.getTime()) / timelineRange.totalDuration;

        // Only include markers visible in current view
        if (position < viewStart || position > viewEnd) return null;

        return {
          ...marker,
          position,
          x: (position - viewStart) / (viewEnd - viewStart) * 100 // Convert to viewport percentage
        };
      })
      .filter((marker): marker is NonNullable<typeof marker> => marker !== null)
      .sort((a, b) => a.position - b.position); // Sort by timeline position
  }, [events, customMarkers, showToday, timelineRange, viewStart, viewEnd]);

  if (markers.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {markers.map((marker) => (
        <div
          key={marker.id}
          className="absolute top-0 bottom-0 pointer-events-auto"
          style={{ left: `${marker.x}%` }}
        >
          {/* Vertical marker line */}
          <div
            className={`absolute top-0 bottom-0 w-0.5 transition-all duration-300 ease-out ${
              marker.type === 'today' ? 'bg-primary-500' : 'bg-warning-500'
            } ${marker.pulse ? 'animate-pulse' : ''}`}
            style={{
              background: marker.color,
              boxShadow: marker.pulse
                ? `0 0 10px ${marker.color}, 0 0 20px ${marker.color}40`
                : `0 0 5px ${marker.color}40`,
              transform: 'translateX(-50%)'
            }}
          />

          {/* Marker label */}
          <div
            className={`absolute top-2 left-0 transform -translate-x-1/2 bg-surface border border-primary rounded-md px-2 py-1 shadow-lg cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-105 ${
              marker.pulse ? 'animate-pulse' : ''
            }`}
            style={{
              borderColor: marker.color,
              boxShadow: marker.pulse
                ? `0 4px 12px rgba(0,0,0,0.15), 0 0 0 1px ${marker.color}40`
                : '0 4px 12px rgba(0,0,0,0.15)'
            }}
            onClick={() => onMarkerClick?.(marker)}
          >
            <div className="flex items-center gap-2">
              {marker.type === 'today' && (
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: marker.color }}
                />
              )}
              {marker.type === 'milestone' && (
                <span
                  className="material-symbols-rounded text-sm"
                  style={{ color: marker.color, fontSize: '16px' }}
                >
                  flag
                </span>
              )}
              <span
                className="text-xs font-medium text-primary whitespace-nowrap"
                style={{ maxWidth: '120px' }}
              >
                {marker.label}
              </span>
            </div>

            {/* Tooltip arrow */}
            <div
              className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent"
              style={{ borderTopColor: marker.color }}
            />
          </div>

          {/* Marker dot at timeline level */}
          <div
            className={`absolute w-3 h-3 rounded-full transform -translate-x-1/2 transition-all duration-200 hover:scale-125 cursor-pointer ${
              marker.pulse ? 'animate-pulse' : ''
            }`}
            style={{
              backgroundColor: marker.color,
              bottom: '15px',
              boxShadow: marker.pulse
                ? `0 0 15px ${marker.color}, 0 0 25px ${marker.color}60`
                : `0 2px 8px rgba(0,0,0,0.2), 0 0 0 2px var(--color-surface)`
            }}
            onClick={() => onMarkerClick?.(marker)}
          />
        </div>
      ))}
    </div>
  );
}

// Hook for easy marker management
export function useTimelineMarkers() {
  const [customMarkers, setCustomMarkers] = React.useState<TimelineMarker[]>([]);

  const addMarker = React.useCallback((marker: Omit<TimelineMarker, 'id'>) => {
    const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setCustomMarkers(prev => [...prev, { ...marker, id }]);
    return id;
  }, []);

  const removeMarker = React.useCallback((id: string) => {
    setCustomMarkers(prev => prev.filter(marker => marker.id !== id));
  }, []);

  const clearMarkers = React.useCallback(() => {
    setCustomMarkers([]);
  }, []);

  return {
    customMarkers,
    addMarker,
    removeMarker,
    clearMarkers
  };
}