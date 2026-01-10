import { useState, useEffect, useCallback } from 'react';
import type {
  ImportSession,
  SessionEvent,
  SessionStats,
  ImportSource,
  EventDecision,
  ImportMode,
} from '../types/importSession';
import type { Event } from '../types';
import { addEvent, updateEvent, deleteEvent } from '../services/firestore';

const STORAGE_KEY_PREFIX = 'powertimeline:session:';

/**
 * Compares two events to determine if they have identical content.
 * Used to skip events that haven't actually changed during import.
 * Compares: title, date, endDate, time, description, sources
 */
export function areEventsIdentical(existing: Event, imported: Partial<Event>): boolean {
  // Compare title (required field)
  if (existing.title !== imported.title) return false;

  // Compare date (required field)
  if (existing.date !== imported.date) return false;

  // Compare optional fields - only if imported has the field defined
  // If imported field is undefined, it means "no change" so we don't compare
  if (imported.endDate !== undefined && existing.endDate !== imported.endDate) return false;
  if (imported.time !== undefined && existing.time !== imported.time) return false;
  if (imported.description !== undefined && existing.description !== imported.description) return false;

  // Compare sources array (order-sensitive)
  if (imported.sources !== undefined) {
    const existingSources = existing.sources || [];
    const importedSources = imported.sources || [];
    if (JSON.stringify(existingSources) !== JSON.stringify(importedSources)) return false;
  }

  return true;
}

export function useImportSession(timelineId?: string) {
  const [session, setSession] = useState<ImportSession | null>(null);

  useEffect(() => {
    if (!timelineId) {
      let foundSession: ImportSession | null = null;

      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_KEY_PREFIX)) {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data) as ImportSession;
            if (parsed.status === 'active') {
              foundSession = parsed;
              break;
            }
          }
        }
      }

      setSession(foundSession);
      return;
    }

    const key = STORAGE_KEY_PREFIX + timelineId;
    const data = localStorage.getItem(key);

    if (data) {
      const parsed = JSON.parse(data) as ImportSession;
      if (parsed.status === 'active') {
        setSession(parsed);
        return;
      }
    }

    setSession(null);
  }, [timelineId]);

  useEffect(() => {
    if (session) {
      const key = STORAGE_KEY_PREFIX + session.timelineId;
      localStorage.setItem(key, JSON.stringify(session));
    }
  }, [session]);

  const startSession = useCallback(
    (
      nextTimelineId: string,
      ownerId: string,
      source: ImportSource,
      events: Partial<Event>[],
      existingEventIds: string[] = [],
      existingEvents: Event[] = [],
      importMode: ImportMode = 'merge'
    ) => {
      let sessionEvents: SessionEvent[];
      let eventsToDelete: string[] | undefined;
      let skippedCount = 0;

      if (importMode === 'overwrite') {
        // Overwrite mode: all events are 'create', track existing events for deletion
        sessionEvents = events.map(eventData => ({
          id: crypto.randomUUID(),
          action: 'create' as const,
          decision: 'pending' as const,
          eventData,
          existingEvent: undefined,
        }));
        eventsToDelete = existingEventIds;
      } else {
        // Merge mode (default): classify as create or update based on ID matching
        // Skip events that are identical to existing (no actual changes)
        const mappedEvents: (SessionEvent | null)[] = events.map(eventData => {
          const existingEvent = eventData.id
            ? existingEvents.find(existing => existing.id === eventData.id)
            : undefined;

          // If we found an existing event, check if content is actually different
          if (existingEvent) {
            // Skip identical events - they don't need to be in the review session
            if (areEventsIdentical(existingEvent, eventData)) {
              return null; // Will be filtered out
            }
            // Content differs - mark as update
            return {
              id: crypto.randomUUID(),
              action: 'update' as const,
              decision: 'pending' as const,
              eventData,
              existingEvent,
            };
          }

          // No existing event found - check if ID exists (edge case: ID in list but event not loaded)
          const idExistsButNotLoaded = eventData.id ? existingEventIds.includes(eventData.id) : false;
          const action = idExistsButNotLoaded ? 'update' : 'create';

          return {
            id: crypto.randomUUID(),
            action: action as 'update' | 'create',
            decision: 'pending' as const,
            eventData,
            existingEvent: undefined,
          };
        });

        sessionEvents = mappedEvents.filter((event): event is SessionEvent => event !== null);
        // Calculate how many events were skipped (identical to existing)
        skippedCount = mappedEvents.filter(event => event === null).length;
      }

      const newSession: ImportSession = {
        id: crypto.randomUUID(),
        timelineId: nextTimelineId,
        ownerId,
        source,
        status: 'active',
        events: sessionEvents,
        createdAt: Date.now(),
        existingEventIds,
        importMode,
        eventsToDelete,
        skippedCount,
      };

      setSession(newSession);
    },
    []
  );

  const updateDecision = useCallback((eventId: string, decision: EventDecision) => {
    setSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        events: prev.events.map(event =>
          event.id === eventId ? { ...event, decision } : event
        ),
      };
    });
  }, []);

  const updateEventData = useCallback((eventId: string, edits: Partial<Event>) => {
    setSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        events: prev.events.map(event =>
          event.id === eventId
            ? { ...event, userEdits: { ...event.userEdits, ...edits } }
            : event
        ),
      };
    });
  }, []);

  const commitSession = useCallback(async (ownerId?: string) => {
    if (!session) {
      throw new Error('No active session to commit');
    }

    const resolvedOwnerId = ownerId ?? session.ownerId;
    const accepted = session.events.filter(event => event.decision === 'accepted');

    // In overwrite mode, delete all existing events first
    if (session.importMode === 'overwrite' && session.eventsToDelete?.length) {
      for (const eventId of session.eventsToDelete) {
        await deleteEvent(session.timelineId, resolvedOwnerId, eventId);
      }
    }

    // Then add/update accepted events
    for (const event of accepted) {
      const finalData = { ...event.eventData, ...event.userEdits };
      if (event.action === 'create') {
        await addEvent(session.timelineId, resolvedOwnerId, finalData as Event);
      } else if (event.action === 'update' && finalData.id) {
        await updateEvent(session.timelineId, resolvedOwnerId, finalData.id, finalData);
      }
    }

    localStorage.removeItem(STORAGE_KEY_PREFIX + session.timelineId);
    // Clear session immediately to avoid visual glitch before panel closes
    setSession(null);
  }, [session]);

  const discardSession = useCallback(() => {
    if (session) {
      localStorage.removeItem(STORAGE_KEY_PREFIX + session.timelineId);
      // Clear session immediately to avoid visual glitch before panel closes
      setSession(null);
    }
  }, [session]);

  const getStats = useCallback((): SessionStats => {
    if (!session) return { total: 0, pending: 0, accepted: 0, rejected: 0 };
    return {
      total: session.events.length,
      pending: session.events.filter(event => event.decision === 'pending').length,
      accepted: session.events.filter(event => event.decision === 'accepted').length,
      rejected: session.events.filter(event => event.decision === 'rejected').length,
    };
  }, [session]);

  return {
    session,
    hasActiveSession: session?.status === 'active',
    startSession,
    updateDecision,
    updateEventData,
    commitSession,
    discardSession,
    getStats,
  };
}
