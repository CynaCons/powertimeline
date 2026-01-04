import { useState, useCallback, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Event } from '../../types';

interface UseEventSelectionOptions {
  events: Event[];
}

interface UseEventSelectionReturn {
  // Selection state
  selectedId: string | undefined;
  setSelectedId: Dispatch<SetStateAction<string | undefined>>;
  hoveredEventId: string | undefined;
  setHoveredEventId: Dispatch<SetStateAction<string | undefined>>;

  // Derived state
  selectedEvent: Event | undefined;

  // Actions
  selectEvent: (eventId: string) => void;
  clearSelection: () => void;
  navigateToPreviousEvent: () => void;
  navigateToNextEvent: () => void;
}

/**
 * Custom hook for managing event selection state.
 *
 * Handles:
 * - Selected event ID and hover state
 * - Derived selected event lookup
 * - Navigation between events (previous/next)
 */
export function useEventSelection({
  events,
}: UseEventSelectionOptions): UseEventSelectionReturn {
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [hoveredEventId, setHoveredEventId] = useState<string | undefined>(undefined);

  // Derived: selected event object
  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedId),
    [events, selectedId]
  );

  // Select an event by ID
  const selectEvent = useCallback((eventId: string) => {
    setSelectedId(eventId);
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedId(undefined);
  }, []);

  // Navigate to previous event (chronologically)
  const navigateToPreviousEvent = useCallback(() => {
    const sortedEvents = [...events].sort((a, b) =>
      new Date(a.date + (a.time || '00:00')).getTime() -
      new Date(b.date + (b.time || '00:00')).getTime()
    );
    const currentIndex = sortedEvents.findIndex((e) => e.id === selectedId);
    if (currentIndex > 0) {
      setSelectedId(sortedEvents[currentIndex - 1].id);
    }
  }, [events, selectedId]);

  // Navigate to next event (chronologically)
  const navigateToNextEvent = useCallback(() => {
    const sortedEvents = [...events].sort((a, b) =>
      new Date(a.date + (a.time || '00:00')).getTime() -
      new Date(b.date + (b.time || '00:00')).getTime()
    );
    const currentIndex = sortedEvents.findIndex((e) => e.id === selectedId);
    if (currentIndex >= 0 && currentIndex < sortedEvents.length - 1) {
      setSelectedId(sortedEvents[currentIndex + 1].id);
    }
  }, [events, selectedId]);

  return {
    selectedId,
    setSelectedId,
    hoveredEventId,
    setHoveredEventId,
    selectedEvent,
    selectEvent,
    clearSelection,
    navigateToPreviousEvent,
    navigateToNextEvent,
  };
}
