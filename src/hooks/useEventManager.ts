import { useState, useRef, useMemo, useCallback } from 'react';
import type { Event } from '../types';
import { EventStorage } from '../lib/storage';

interface EventManagerReturn {
  events: Event[];
  selectedId: string | undefined;
  selected: Event | undefined;
  editDate: string;
  editTitle: string;
  editDescription: string;
  setEvents: (events: Event[]) => void;
  setSelectedId: (id: string | undefined) => void;
  setEditDate: (date: string) => void;
  setEditTitle: (title: string) => void;
  setEditDescription: (description: string) => void;
  saveEvent: (event: Event) => void;
  deleteEvent: (id: string) => void;
  createEvent: (event: Omit<Event, 'id'>) => void;
  loadEvents: () => void;
}

export function useEventManager(): EventManagerReturn {
  const storageRef = useRef(new EventStorage());
  const [events, setEvents] = useState<Event[]>(() => storageRef.current.load());
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [editDate, setEditDate] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const selected = useMemo(
    () => events.find((e) => e.id === selectedId),
    [events, selectedId]
  );

  const saveEvent = useCallback((event: Event) => {
    setEvents(prev => {
      const updated = prev.map(e => e.id === event.id ? event : e);
      storageRef.current.save(updated);
      return updated;
    });
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => {
      const filtered = prev.filter(e => e.id !== id);
      storageRef.current.save(filtered);
      return filtered;
    });
    if (selectedId === id) {
      setSelectedId(undefined);
    }
  }, [selectedId]);

  const createEvent = useCallback((eventData: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...eventData,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    setEvents(prev => {
      const updated = [...prev, newEvent];
      storageRef.current.save(updated);
      return updated;
    });

    return newEvent;
  }, []);

  const loadEvents = useCallback(() => {
    const loaded = storageRef.current.load();
    setEvents(loaded);
  }, []);

  const handleSetEvents = useCallback((newEvents: Event[]) => {
    setEvents(newEvents);
    storageRef.current.save(newEvents);
  }, []);

  return {
    events,
    selectedId,
    selected,
    editDate,
    editTitle,
    editDescription,
    setEvents: handleSetEvents,
    setSelectedId,
    setEditDate,
    setEditTitle,
    setEditDescription,
    saveEvent,
    deleteEvent,
    createEvent,
    loadEvents
  };
}