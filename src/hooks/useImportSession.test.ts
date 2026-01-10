/**
 * Tests for useImportSession hook
 * v0.9.0 - Unified Import Review System
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImportSession } from './useImportSession';
import type { Event } from '../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock firestore functions
vi.mock('../services/firestore', () => ({
  addEvent: vi.fn().mockResolvedValue(undefined),
  updateEvent: vi.fn().mockResolvedValue(undefined),
  deleteEvent: vi.fn().mockResolvedValue(undefined),
}));

const mockEvents: Partial<Event>[] = [
  { id: 'event-1', date: '1963-06-05', title: 'Event 1' },
  { id: 'event-2', date: '1963-11-22', title: 'Event 2' },
  { id: 'event-3', date: '1968-04-04', title: 'Event 3' },
];

const mockExistingEvents: Event[] = [
  { id: 'existing-1', date: '1960-01-01', title: 'Existing Event 1' },
];

describe('useImportSession', () => {
  const timelineId = 'test-timeline';
  const ownerId = 'test-owner';

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('initializes with no session', () => {
      const { result } = renderHook(() => useImportSession(timelineId));

      expect(result.current.session).toBeNull();
      expect(result.current.hasActiveSession).toBe(false);
    });

    it('loads existing session from localStorage', () => {
      // Pre-populate localStorage with a session
      const existingSession = {
        id: 'session-1',
        timelineId,
        ownerId,
        source: 'yaml' as const,
        status: 'active' as const,
        events: [
          {
            id: 'session-event-1',
            action: 'create' as const,
            decision: 'pending' as const,
            eventData: mockEvents[0],
          },
        ],
        createdAt: Date.now(),
        existingEventIds: ['existing-1'],
      };

      localStorageMock.setItem(
        `powertimeline:session:${timelineId}`,
        JSON.stringify(existingSession)
      );

      const { result } = renderHook(() => useImportSession(timelineId));

      expect(result.current.session).not.toBeNull();
      expect(result.current.session?.id).toBe('session-1');
      expect(result.current.hasActiveSession).toBe(true);
    });

    it('ignores committed sessions on load', () => {
      const committedSession = {
        id: 'session-1',
        timelineId,
        ownerId,
        source: 'yaml' as const,
        status: 'committed' as const,
        events: [],
        createdAt: Date.now(),
        existingEventIds: [],
      };

      localStorageMock.setItem(
        `powertimeline:session:${timelineId}`,
        JSON.stringify(committedSession)
      );

      const { result } = renderHook(() => useImportSession(timelineId));

      expect(result.current.session).toBeNull();
      expect(result.current.hasActiveSession).toBe(false);
    });
  });

  describe('startSession', () => {
    it('creates a new session', () => {
      const { result } = renderHook(() => useImportSession(timelineId));

      act(() => {
        result.current.startSession(timelineId, ownerId, 'yaml', mockEvents, mockExistingEvents.map(e => e.id), mockExistingEvents);
      });

      expect(result.current.session).not.toBeNull();
      expect(result.current.session?.timelineId).toBe(timelineId);
      expect(result.current.session?.source).toBe('yaml');
      expect(result.current.session?.status).toBe('active');
      expect(result.current.session?.events.length).toBe(3);
      expect(result.current.session?.existingEventIds).toEqual(['existing-1']);
      expect(result.current.hasActiveSession).toBe(true);
    });

    it('creates session events with pending decisions', () => {
      const { result } = renderHook(() => useImportSession(timelineId));

      act(() => {
        result.current.startSession(timelineId, ownerId, 'yaml', mockEvents, mockExistingEvents.map(e => e.id), mockExistingEvents);
      });

      const sessionEvents = result.current.session?.events || [];
      expect(sessionEvents.every(e => e.decision === 'pending')).toBe(true);
      expect(sessionEvents.every(e => e.action === 'create')).toBe(true);
    });

    it('saves session to localStorage', () => {
      const { result } = renderHook(() => useImportSession(timelineId));

      act(() => {
        result.current.startSession(timelineId, ownerId, 'yaml', mockEvents, mockExistingEvents.map(e => e.id), mockExistingEvents);
      });

      const stored = localStorageMock.getItem(`powertimeline:session:${timelineId}`);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.timelineId).toBe(timelineId);
      expect(parsed.events.length).toBe(3);
    });
  });

  describe('updateDecision', () => {
    it('updates event decision', () => {
      const { result } = renderHook(() => useImportSession(timelineId));

      act(() => {
        result.current.startSession(timelineId, ownerId, 'yaml', mockEvents, mockExistingEvents.map(e => e.id), mockExistingEvents);
      });

      const eventId = result.current.session!.events[0].id;

      act(() => {
        result.current.updateDecision(eventId, 'accepted');
      });

      const updatedEvent = result.current.session!.events.find(e => e.id === eventId);
      expect(updatedEvent?.decision).toBe('accepted');
    });

    it('persists decision changes to localStorage', () => {
      const { result } = renderHook(() => useImportSession(timelineId));

      act(() => {
        result.current.startSession(timelineId, ownerId, 'yaml', mockEvents, mockExistingEvents.map(e => e.id), mockExistingEvents);
      });

      const eventId = result.current.session!.events[0].id;

      act(() => {
        result.current.updateDecision(eventId, 'rejected');
      });

      const stored = localStorageMock.getItem(`powertimeline:session:${timelineId}`);
      const parsed = JSON.parse(stored!);
      const storedEvent = parsed.events.find((e: any) => e.id === eventId);
      expect(storedEvent.decision).toBe('rejected');
    });
  });

  describe('updateEventData', () => {
    it('adds user edits to event', () => {
      const { result } = renderHook(() => useImportSession(timelineId));

      act(() => {
        result.current.startSession(timelineId, ownerId, 'yaml', mockEvents, mockExistingEvents.map(e => e.id), mockExistingEvents);
      });

      const eventId = result.current.session!.events[0].id;

      act(() => {
        result.current.updateEventData(eventId, { title: 'Edited Title' });
      });

      const updatedEvent = result.current.session!.events.find(e => e.id === eventId);
      expect(updatedEvent?.userEdits?.title).toBe('Edited Title');
    });

    it('merges multiple edits', () => {
      const { result } = renderHook(() => useImportSession(timelineId));

      act(() => {
        result.current.startSession(timelineId, ownerId, 'yaml', mockEvents, mockExistingEvents.map(e => e.id), mockExistingEvents);
      });

      const eventId = result.current.session!.events[0].id;

      act(() => {
        result.current.updateEventData(eventId, { title: 'New Title' });
      });

      act(() => {
        result.current.updateEventData(eventId, { description: 'New Description' });
      });

      const updatedEvent = result.current.session!.events.find(e => e.id === eventId);
      expect(updatedEvent?.userEdits?.title).toBe('New Title');
      expect(updatedEvent?.userEdits?.description).toBe('New Description');
    });
  });

  describe('getStats', () => {
    it('returns correct statistics', () => {
      const { result } = renderHook(() => useImportSession(timelineId));

      act(() => {
        result.current.startSession(timelineId, ownerId, 'yaml', mockEvents, mockExistingEvents.map(e => e.id), mockExistingEvents);
      });

      const events = result.current.session!.events;

      act(() => {
        result.current.updateDecision(events[0].id, 'accepted');
        result.current.updateDecision(events[1].id, 'accepted');
        result.current.updateDecision(events[2].id, 'rejected');
      });

      const stats = result.current.getStats();

      expect(stats.total).toBe(3);
      expect(stats.accepted).toBe(2);
      expect(stats.rejected).toBe(1);
      expect(stats.pending).toBe(0);
    });

    it('returns zero stats when no session', () => {
      const { result } = renderHook(() => useImportSession(timelineId));

      const stats = result.current.getStats();

      expect(stats.total).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.accepted).toBe(0);
      expect(stats.rejected).toBe(0);
    });
  });

  describe('discardSession', () => {
    it('clears session state', () => {
      const { result } = renderHook(() => useImportSession(timelineId));

      act(() => {
        result.current.startSession(timelineId, ownerId, 'yaml', mockEvents, mockExistingEvents.map(e => e.id), mockExistingEvents);
      });

      expect(result.current.hasActiveSession).toBe(true);

      act(() => {
        result.current.discardSession();
      });

      expect(result.current.hasActiveSession).toBe(false);
    });

    it('removes session from localStorage', () => {
      const { result } = renderHook(() => useImportSession(timelineId));

      act(() => {
        result.current.startSession(timelineId, ownerId, 'yaml', mockEvents, mockExistingEvents.map(e => e.id), mockExistingEvents);
      });

      expect(localStorageMock.getItem(`powertimeline:session:${timelineId}`)).not.toBeNull();

      act(() => {
        result.current.discardSession();
      });

      expect(localStorageMock.getItem(`powertimeline:session:${timelineId}`)).toBeNull();
    });
  });

  describe('commitSession', () => {
    it('throws when no session exists', async () => {
      const { result } = renderHook(() => useImportSession(timelineId));

      await expect(result.current.commitSession(ownerId)).rejects.toThrow('No active session to commit');
    });

    it('clears session after commit with no accepted events', async () => {
      const { result } = renderHook(() => useImportSession(timelineId));

      act(() => {
        result.current.startSession(timelineId, ownerId, 'yaml', mockEvents, mockExistingEvents.map(e => e.id), mockExistingEvents);
      });

      const events = result.current.session!.events;

      act(() => {
        events.forEach(e => {
          result.current.updateDecision(e.id, 'rejected');
        });
      });

      await act(async () => {
        await result.current.commitSession(ownerId);
      });

      expect(result.current.hasActiveSession).toBe(false);
      expect(localStorageMock.getItem(`powertimeline:session:${timelineId}`)).toBeNull();
    });

    it('calls addEvent for accepted events', async () => {
      const { addEvent } = await import('../services/firestore');
      const { result } = renderHook(() => useImportSession(timelineId));

      act(() => {
        result.current.startSession(timelineId, ownerId, 'yaml', mockEvents, mockExistingEvents.map(e => e.id), mockExistingEvents);
      });

      const events = result.current.session!.events;

      act(() => {
        result.current.updateDecision(events[0].id, 'accepted');
        result.current.updateDecision(events[1].id, 'rejected');
        result.current.updateDecision(events[2].id, 'accepted');
      });

      await act(async () => {
        await result.current.commitSession(ownerId);
      });

      expect(addEvent).toHaveBeenCalledTimes(2);
      expect(addEvent).toHaveBeenCalledWith(
        timelineId,
        ownerId,
        expect.objectContaining({ id: 'event-1' })
      );
      expect(addEvent).toHaveBeenCalledWith(
        timelineId,
        ownerId,
        expect.objectContaining({ id: 'event-3' })
      );
    });

    it('merges user edits before committing', async () => {
      const { addEvent } = await import('../services/firestore');
      const { result } = renderHook(() => useImportSession(timelineId));

      act(() => {
        result.current.startSession(timelineId, ownerId, 'yaml', mockEvents, mockExistingEvents.map(e => e.id), mockExistingEvents);
      });

      const eventId = result.current.session!.events[0].id;

      act(() => {
        result.current.updateEventData(eventId, { title: 'Edited Title' });
        result.current.updateDecision(eventId, 'accepted');
      });

      await act(async () => {
        await result.current.commitSession(ownerId);
      });

      expect(addEvent).toHaveBeenCalledWith(
        timelineId,
        ownerId,
        expect.objectContaining({
          id: 'event-1',
          title: 'Edited Title',
        })
      );
    });

    it('clears session after successful commit', async () => {
      const { result } = renderHook(() => useImportSession(timelineId));

      act(() => {
        result.current.startSession(timelineId, ownerId, 'yaml', mockEvents, mockExistingEvents.map(e => e.id), mockExistingEvents);
      });

      act(() => {
        result.current.updateDecision(result.current.session!.events[0].id, 'accepted');
      });

      await act(async () => {
        await result.current.commitSession(ownerId);
      });

      expect(result.current.hasActiveSession).toBe(false);
      expect(localStorageMock.getItem(`powertimeline:session:${timelineId}`)).toBeNull();
    });
  });

  describe('import modes', () => {
    const existingEventsForModeTests: Event[] = [
      { id: 'existing-1', date: '1960-01-01', title: 'Existing Event 1' },
      { id: 'existing-2', date: '1961-01-01', title: 'Existing Event 2' },
      { id: 'existing-3', date: '1962-01-01', title: 'Existing Event 3' },
    ];

    describe('merge mode (default)', () => {
      it('defaults to merge mode when not specified', () => {
        const { result } = renderHook(() => useImportSession(timelineId));

        act(() => {
          result.current.startSession(timelineId, ownerId, 'yaml', mockEvents, existingEventsForModeTests.map(e => e.id), existingEventsForModeTests);
        });

        expect(result.current.session?.importMode).toBe('merge');
      });

      it('marks events with matching IDs as update', () => {
        const { result } = renderHook(() => useImportSession(timelineId));
        const eventsWithMatchingId: Partial<Event>[] = [
          { id: 'existing-1', date: '1960-01-01', title: 'Updated Event 1' },
          { id: 'new-event', date: '1963-01-01', title: 'New Event' },
        ];

        act(() => {
          result.current.startSession(
            timelineId,
            ownerId,
            'yaml',
            eventsWithMatchingId,
            existingEventsForModeTests.map(e => e.id),
            existingEventsForModeTests,
            'merge'
          );
        });

        const sessionEvents = result.current.session?.events || [];
        const updateEvent = sessionEvents.find(e => e.eventData.id === 'existing-1');
        const createEvent = sessionEvents.find(e => e.eventData.id === 'new-event');

        expect(updateEvent?.action).toBe('update');
        expect(createEvent?.action).toBe('create');
      });

      it('does not track eventsToDelete in merge mode', () => {
        const { result } = renderHook(() => useImportSession(timelineId));

        act(() => {
          result.current.startSession(
            timelineId,
            ownerId,
            'yaml',
            mockEvents,
            existingEventsForModeTests.map(e => e.id),
            existingEventsForModeTests,
            'merge'
          );
        });

        expect(result.current.session?.eventsToDelete).toBeUndefined();
      });
    });

    describe('overwrite mode', () => {
      it('sets importMode to overwrite when specified', () => {
        const { result } = renderHook(() => useImportSession(timelineId));

        act(() => {
          result.current.startSession(
            timelineId,
            ownerId,
            'yaml',
            mockEvents,
            existingEventsForModeTests.map(e => e.id),
            existingEventsForModeTests,
            'overwrite'
          );
        });

        expect(result.current.session?.importMode).toBe('overwrite');
      });

      it('marks all events as create in overwrite mode', () => {
        const { result } = renderHook(() => useImportSession(timelineId));
        const eventsWithMatchingId: Partial<Event>[] = [
          { id: 'existing-1', date: '1960-01-01', title: 'Updated Event 1' },
          { id: 'new-event', date: '1963-01-01', title: 'New Event' },
        ];

        act(() => {
          result.current.startSession(
            timelineId,
            ownerId,
            'yaml',
            eventsWithMatchingId,
            existingEventsForModeTests.map(e => e.id),
            existingEventsForModeTests,
            'overwrite'
          );
        });

        const sessionEvents = result.current.session?.events || [];
        expect(sessionEvents.every(e => e.action === 'create')).toBe(true);
      });

      it('tracks existing event IDs for deletion in overwrite mode', () => {
        const { result } = renderHook(() => useImportSession(timelineId));

        act(() => {
          result.current.startSession(
            timelineId,
            ownerId,
            'yaml',
            mockEvents,
            existingEventsForModeTests.map(e => e.id),
            existingEventsForModeTests,
            'overwrite'
          );
        });

        expect(result.current.session?.eventsToDelete).toEqual(['existing-1', 'existing-2', 'existing-3']);
      });

      it('clears existingEvent references in overwrite mode', () => {
        const { result } = renderHook(() => useImportSession(timelineId));

        act(() => {
          result.current.startSession(
            timelineId,
            ownerId,
            'yaml',
            mockEvents,
            existingEventsForModeTests.map(e => e.id),
            existingEventsForModeTests,
            'overwrite'
          );
        });

        const sessionEvents = result.current.session?.events || [];
        expect(sessionEvents.every(e => e.existingEvent === undefined)).toBe(true);
      });

      it('deletes existing events before creating new ones on commit', async () => {
        const { deleteEvent, addEvent } = await import('../services/firestore');
        const { result } = renderHook(() => useImportSession(timelineId));

        act(() => {
          result.current.startSession(
            timelineId,
            ownerId,
            'yaml',
            mockEvents.slice(0, 1), // Just one event to simplify
            existingEventsForModeTests.map(e => e.id),
            existingEventsForModeTests,
            'overwrite'
          );
        });

        act(() => {
          result.current.updateDecision(result.current.session!.events[0].id, 'accepted');
        });

        await act(async () => {
          await result.current.commitSession(ownerId);
        });

        // Should delete all 3 existing events
        expect(deleteEvent).toHaveBeenCalledTimes(3);
        expect(deleteEvent).toHaveBeenCalledWith(timelineId, ownerId, 'existing-1');
        expect(deleteEvent).toHaveBeenCalledWith(timelineId, ownerId, 'existing-2');
        expect(deleteEvent).toHaveBeenCalledWith(timelineId, ownerId, 'existing-3');

        // Should add the accepted event
        expect(addEvent).toHaveBeenCalledTimes(1);
      });

      it('does not delete events if none are marked for deletion', async () => {
        const { deleteEvent, addEvent } = await import('../services/firestore');
        vi.mocked(deleteEvent).mockClear();
        vi.mocked(addEvent).mockClear();

        const { result } = renderHook(() => useImportSession(timelineId));

        act(() => {
          result.current.startSession(
            timelineId,
            ownerId,
            'yaml',
            mockEvents.slice(0, 1),
            [], // No existing events
            [],
            'overwrite'
          );
        });

        act(() => {
          result.current.updateDecision(result.current.session!.events[0].id, 'accepted');
        });

        await act(async () => {
          await result.current.commitSession(ownerId);
        });

        expect(deleteEvent).not.toHaveBeenCalled();
        expect(addEvent).toHaveBeenCalledTimes(1);
      });
    });
  });
});
