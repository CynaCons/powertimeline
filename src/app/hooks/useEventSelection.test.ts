import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEventSelection } from './useEventSelection';
import type { Event } from '../../types';

const mockEvents: Event[] = [
  { id: 'event-1', date: '1963-06-05', time: '10:00', title: 'Event 1' },
  { id: 'event-2', date: '1963-11-22', time: '12:30', title: 'Event 2' },
  { id: 'event-3', date: '1968-04-04', title: 'Event 3' },
  { id: 'event-4', date: '1968-06-05', time: '01:15', title: 'Event 4' },
];

describe('useEventSelection', () => {
  describe('initialization', () => {
    it('initializes with no selection', () => {
      const { result } = renderHook(() =>
        useEventSelection({ events: mockEvents })
      );

      expect(result.current.selectedId).toBeUndefined();
      expect(result.current.hoveredEventId).toBeUndefined();
      expect(result.current.selectedEvent).toBeUndefined();
    });
  });

  describe('selection', () => {
    it('selectEvent sets selectedId', () => {
      const { result } = renderHook(() =>
        useEventSelection({ events: mockEvents })
      );

      act(() => {
        result.current.selectEvent('event-2');
      });

      expect(result.current.selectedId).toBe('event-2');
    });

    it('selectedEvent returns the correct event object', () => {
      const { result } = renderHook(() =>
        useEventSelection({ events: mockEvents })
      );

      act(() => {
        result.current.selectEvent('event-2');
      });

      expect(result.current.selectedEvent).toEqual(mockEvents[1]);
      expect(result.current.selectedEvent?.title).toBe('Event 2');
    });

    it('clearSelection clears the selection', () => {
      const { result } = renderHook(() =>
        useEventSelection({ events: mockEvents })
      );

      act(() => {
        result.current.selectEvent('event-2');
      });
      expect(result.current.selectedId).toBe('event-2');

      act(() => {
        result.current.clearSelection();
      });
      expect(result.current.selectedId).toBeUndefined();
      expect(result.current.selectedEvent).toBeUndefined();
    });

    it('setSelectedId allows direct state updates', () => {
      const { result } = renderHook(() =>
        useEventSelection({ events: mockEvents })
      );

      act(() => {
        result.current.setSelectedId('event-3');
      });

      expect(result.current.selectedId).toBe('event-3');
    });
  });

  describe('hover state', () => {
    it('setHoveredEventId updates hover state', () => {
      const { result } = renderHook(() =>
        useEventSelection({ events: mockEvents })
      );

      act(() => {
        result.current.setHoveredEventId('event-1');
      });

      expect(result.current.hoveredEventId).toBe('event-1');
    });

    it('hover state is independent of selection', () => {
      const { result } = renderHook(() =>
        useEventSelection({ events: mockEvents })
      );

      act(() => {
        result.current.selectEvent('event-1');
        result.current.setHoveredEventId('event-2');
      });

      expect(result.current.selectedId).toBe('event-1');
      expect(result.current.hoveredEventId).toBe('event-2');
    });
  });

  describe('navigation', () => {
    it('navigateToNextEvent moves to next event chronologically', () => {
      const { result } = renderHook(() =>
        useEventSelection({ events: mockEvents })
      );

      // Select first event
      act(() => {
        result.current.selectEvent('event-1');
      });

      // Navigate to next
      act(() => {
        result.current.navigateToNextEvent();
      });

      expect(result.current.selectedId).toBe('event-2');
    });

    it('navigateToPreviousEvent moves to previous event chronologically', () => {
      const { result } = renderHook(() =>
        useEventSelection({ events: mockEvents })
      );

      // Select second event
      act(() => {
        result.current.selectEvent('event-2');
      });

      // Navigate to previous
      act(() => {
        result.current.navigateToPreviousEvent();
      });

      expect(result.current.selectedId).toBe('event-1');
    });

    it('navigateToNextEvent does nothing at last event', () => {
      const { result } = renderHook(() =>
        useEventSelection({ events: mockEvents })
      );

      // Select last event
      act(() => {
        result.current.selectEvent('event-4');
      });

      // Try to navigate past end
      act(() => {
        result.current.navigateToNextEvent();
      });

      expect(result.current.selectedId).toBe('event-4');
    });

    it('navigateToPreviousEvent does nothing at first event', () => {
      const { result } = renderHook(() =>
        useEventSelection({ events: mockEvents })
      );

      // Select first event
      act(() => {
        result.current.selectEvent('event-1');
      });

      // Try to navigate before start
      act(() => {
        result.current.navigateToPreviousEvent();
      });

      expect(result.current.selectedId).toBe('event-1');
    });

    it('navigation respects chronological order, not array order', () => {
      // Events in random order
      const unorderedEvents: Event[] = [
        { id: 'late', date: '1970-01-01', title: 'Late' },
        { id: 'early', date: '1960-01-01', title: 'Early' },
        { id: 'middle', date: '1965-01-01', title: 'Middle' },
      ];

      const { result } = renderHook(() =>
        useEventSelection({ events: unorderedEvents })
      );

      // Select early event
      act(() => {
        result.current.selectEvent('early');
      });

      // Navigate to next should go to middle (chronologically)
      act(() => {
        result.current.navigateToNextEvent();
      });

      expect(result.current.selectedId).toBe('middle');
    });

    it('navigation does nothing when no event is selected', () => {
      const { result } = renderHook(() =>
        useEventSelection({ events: mockEvents })
      );

      // No selection
      expect(result.current.selectedId).toBeUndefined();

      // Try to navigate
      act(() => {
        result.current.navigateToNextEvent();
      });

      // Should still be undefined (or could select first, depending on implementation)
      expect(result.current.selectedId).toBeUndefined();
    });
  });

  describe('events updates', () => {
    it('selectedEvent updates when events array changes', () => {
      const { result, rerender } = renderHook(
        ({ events }) => useEventSelection({ events }),
        { initialProps: { events: mockEvents } }
      );

      act(() => {
        result.current.selectEvent('event-2');
      });
      expect(result.current.selectedEvent?.title).toBe('Event 2');

      // Update event title
      const updatedEvents = mockEvents.map((e) =>
        e.id === 'event-2' ? { ...e, title: 'Updated Event 2' } : e
      );
      rerender({ events: updatedEvents });

      expect(result.current.selectedEvent?.title).toBe('Updated Event 2');
    });

    it('selectedEvent becomes undefined if selected event is removed', () => {
      const { result, rerender } = renderHook(
        ({ events }) => useEventSelection({ events }),
        { initialProps: { events: mockEvents } }
      );

      act(() => {
        result.current.selectEvent('event-2');
      });
      expect(result.current.selectedEvent).toBeDefined();

      // Remove selected event
      const filteredEvents = mockEvents.filter((e) => e.id !== 'event-2');
      rerender({ events: filteredEvents });

      expect(result.current.selectedId).toBe('event-2'); // ID is still set
      expect(result.current.selectedEvent).toBeUndefined(); // But event is gone
    });
  });
});
