import { useState, useEffect, useCallback } from 'react';
import type {
  ImportSession,
  SessionEvent,
  SessionStats,
  ImportSource,
  EventDecision,
} from '../types/importSession';
import type { Event } from '../types';
import { addEvent } from '../services/firestore';

const STORAGE_KEY_PREFIX = 'powertimeline:session:';

export function useImportSession(timelineId: string) {
  const [session, setSession] = useState<ImportSession | null>(null);

  useEffect(() => {
    if (!timelineId) {
      setSession(null);
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
      existingEventIds: string[],
      existingEvents: Event[]
    ) => {
      const sessionEvents: SessionEvent[] = events.map(eventData => {
        const existingEvent = eventData.id
          ? existingEvents.find(existing => existing.id === eventData.id)
          : undefined;
        const isUpdate = Boolean(existingEvent)
          || (eventData.id ? existingEventIds.includes(eventData.id) : false);

        return {
          id: crypto.randomUUID(),
          action: isUpdate ? 'update' : 'create',
          decision: 'pending',
          eventData,
          existingEvent,
        };
      });

      const newSession: ImportSession = {
        id: crypto.randomUUID(),
        timelineId: nextTimelineId,
        ownerId,
        source,
        status: 'active',
        events: sessionEvents,
        createdAt: Date.now(),
        existingEventIds,
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

  const commitSession = useCallback(async (ownerId: string) => {
    if (!session) {
      throw new Error('No active session to commit');
    }

    const accepted = session.events.filter(event => event.decision === 'accepted');

    for (const event of accepted) {
      const finalData = { ...event.eventData, ...event.userEdits };
      if (event.action === 'create') {
        await addEvent(session.timelineId, ownerId, finalData as Event);
      }
    }

    localStorage.removeItem(STORAGE_KEY_PREFIX + session.timelineId);
    setSession(prev => (prev ? { ...prev, status: 'committed' } : null));
  }, [session]);

  const discardSession = useCallback(() => {
    if (session) {
      localStorage.removeItem(STORAGE_KEY_PREFIX + session.timelineId);
      setSession(prev => (prev ? { ...prev, status: 'discarded' } : null));
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
