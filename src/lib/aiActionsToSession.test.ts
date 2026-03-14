/**
 * Unit tests for AI Actions to Import Session Converter
 * v0.9.5 - Tests conversion of AI actions to ImportSession format
 */

import { describe, it, expect } from 'vitest';
import {
  convertAIActionsToSessionEvents,
  getMetadataActions,
  getEventActions,
  hasEventActions,
} from './aiActionsToSession';
import type { AIAction, CreateEventAction, UpdateEventAction, DeleteEventAction, UpdateSourcesAction } from '../types/ai';
import type { Event } from '../types';

describe('aiActionsToSession', () => {
  const mockExistingEvents: Event[] = [
    {
      id: 'event-1',
      title: 'Existing Event 1',
      date: '2024-01-01',
      description: 'Original description',
      sources: ['https://example.com/source1'],
    },
    {
      id: 'event-2',
      title: 'Existing Event 2',
      date: '2024-02-01',
    },
  ];

  describe('convertAIActionsToSessionEvents', () => {
    it('should convert CREATE_EVENT actions to new events without id', () => {
      const createAction: CreateEventAction = {
        id: 'action-1',
        type: 'CREATE_EVENT',
        status: 'pending',
        description: 'Create a new event',
        payload: {
          title: 'New Event',
          date: '2024-03-15',
          description: 'New event description',
          sources: ['https://example.com/new-source'],
        },
      };

      const result = convertAIActionsToSessionEvents([createAction], mockExistingEvents);

      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toEqual({
        title: 'New Event',
        date: '2024-03-15',
        description: 'New event description',
        endDate: undefined,
        time: undefined,
        sources: ['https://example.com/new-source'],
      });
      expect(result.events[0]).not.toHaveProperty('id');
    });

    it('should convert UPDATE_EVENT actions to events with existing id', () => {
      const updateAction: UpdateEventAction = {
        id: 'action-2',
        type: 'UPDATE_EVENT',
        status: 'pending',
        description: 'Update event title and description',
        payload: {
          eventId: 'event-1',
          changes: {
            title: 'Updated Title',
            description: 'Updated description',
          },
        },
      };

      const result = convertAIActionsToSessionEvents([updateAction], mockExistingEvents);

      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toEqual({
        id: 'event-1',
        title: 'Updated Title',
        description: 'Updated description',
      });
    });

    it('should convert UPDATE_SOURCES actions to events with sources change', () => {
      const sourcesAction: UpdateSourcesAction = {
        id: 'action-3',
        type: 'UPDATE_SOURCES',
        status: 'pending',
        description: 'Add a new source to event',
        payload: {
          eventId: 'event-1',
          sources: ['https://example.com/source1', 'https://example.com/new-source'],
        },
      };

      const result = convertAIActionsToSessionEvents([sourcesAction], mockExistingEvents);

      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toEqual({
        id: 'event-1',
        sources: ['https://example.com/source1', 'https://example.com/new-source'],
      });
    });

    it('should convert DELETE_EVENT actions with _action marker', () => {
      const deleteAction: DeleteEventAction = {
        id: 'action-4',
        type: 'DELETE_EVENT',
        status: 'pending',
        description: 'Delete existing event',
        payload: {
          eventId: 'event-1',
          eventTitle: 'Existing Event 1',
        },
      };

      const result = convertAIActionsToSessionEvents([deleteAction], mockExistingEvents);

      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toEqual({
        id: 'event-1',
        title: 'Existing Event 1',
        date: '2024-01-01',
        _action: 'delete',
      });
    });

    it('should use eventTitle from action if existing event not found', () => {
      const deleteAction: DeleteEventAction = {
        id: 'action-5',
        type: 'DELETE_EVENT',
        status: 'pending',
        description: 'Delete non-existent event',
        payload: {
          eventId: 'non-existent',
          eventTitle: 'Fallback Title',
        },
      };

      const result = convertAIActionsToSessionEvents([deleteAction], mockExistingEvents);

      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toEqual({
        id: 'non-existent',
        title: 'Fallback Title',
        date: '',
        _action: 'delete',
      });
    });

    it('should filter out UPDATE_METADATA actions', () => {
      const actions: AIAction[] = [
        {
          id: 'action-6',
          type: 'UPDATE_METADATA',
          status: 'pending',
          description: 'Update timeline title',
          payload: {
            changes: { title: 'New Timeline Title' },
          },
        } as AIAction,
        {
          id: 'action-7',
          type: 'CREATE_EVENT',
          status: 'pending',
          description: 'Create event',
          payload: {
            title: 'New Event',
            date: '2024-04-01',
          },
        } as CreateEventAction,
      ];

      const result = convertAIActionsToSessionEvents(actions, mockExistingEvents);

      expect(result.events).toHaveLength(1);
      expect(result.events[0].title).toBe('New Event');
    });

    it('should return existing event IDs', () => {
      const result = convertAIActionsToSessionEvents([], mockExistingEvents);

      expect(result.existingEventIds).toEqual(['event-1', 'event-2']);
    });

    it('should return existing events array', () => {
      const result = convertAIActionsToSessionEvents([], mockExistingEvents);

      expect(result.existingEvents).toBe(mockExistingEvents);
    });

    it('should handle mixed action types', () => {
      const actions: AIAction[] = [
        {
          id: 'a1',
          type: 'CREATE_EVENT',
          status: 'pending',
          description: 'Create event',
          payload: { title: 'Create', date: '2024-01-01' },
        } as CreateEventAction,
        {
          id: 'a2',
          type: 'UPDATE_EVENT',
          status: 'pending',
          description: 'Update event',
          payload: { eventId: 'event-1', changes: { title: 'Update' } },
        } as UpdateEventAction,
        {
          id: 'a3',
          type: 'DELETE_EVENT',
          status: 'pending',
          description: 'Delete event',
          payload: { eventId: 'event-2', eventTitle: 'Delete' },
        } as DeleteEventAction,
      ];

      const result = convertAIActionsToSessionEvents(actions, mockExistingEvents);

      expect(result.events).toHaveLength(3);
      expect(result.events[0].title).toBe('Create');
      expect(result.events[1].id).toBe('event-1');
      expect(result.events[2]._action).toBe('delete');
    });
  });

  describe('getMetadataActions', () => {
    it('should filter to only UPDATE_METADATA actions', () => {
      const actions: AIAction[] = [
        { id: '1', type: 'CREATE_EVENT', status: 'pending', description: 'Create', payload: {} } as AIAction,
        { id: '2', type: 'UPDATE_METADATA', status: 'pending', description: 'Update title', payload: { changes: { title: 'x' } } } as AIAction,
        { id: '3', type: 'DELETE_EVENT', status: 'pending', description: 'Delete', payload: {} } as AIAction,
        { id: '4', type: 'UPDATE_METADATA', status: 'pending', description: 'Update desc', payload: { changes: { description: 'y' } } } as AIAction,
      ];

      const result = getMetadataActions(actions);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('4');
    });

    it('should return empty array when no metadata actions', () => {
      const actions: AIAction[] = [
        { id: '1', type: 'CREATE_EVENT', status: 'pending', description: 'Create', payload: {} } as AIAction,
      ];

      const result = getMetadataActions(actions);

      expect(result).toEqual([]);
    });
  });

  describe('getEventActions', () => {
    it('should filter to only event-related actions', () => {
      const actions: AIAction[] = [
        { id: '1', type: 'CREATE_EVENT', status: 'pending', description: 'Create', payload: {} } as AIAction,
        { id: '2', type: 'UPDATE_METADATA', status: 'pending', description: 'Metadata', payload: { changes: {} } } as AIAction,
        { id: '3', type: 'UPDATE_EVENT', status: 'pending', description: 'Update', payload: {} } as AIAction,
        { id: '4', type: 'DELETE_EVENT', status: 'pending', description: 'Delete', payload: {} } as AIAction,
        { id: '5', type: 'UPDATE_SOURCES', status: 'pending', description: 'Sources', payload: {} } as AIAction,
      ];

      const result = getEventActions(actions);

      expect(result).toHaveLength(4);
      expect(result.map(a => a.type)).toEqual([
        'CREATE_EVENT',
        'UPDATE_EVENT',
        'DELETE_EVENT',
        'UPDATE_SOURCES',
      ]);
    });
  });

  describe('hasEventActions', () => {
    it('should return true when event actions present', () => {
      const actions: AIAction[] = [
        { id: '1', type: 'CREATE_EVENT', status: 'pending', description: 'Create', payload: {} } as AIAction,
      ];

      expect(hasEventActions(actions)).toBe(true);
    });

    it('should return false when only metadata actions', () => {
      const actions: AIAction[] = [
        { id: '1', type: 'UPDATE_METADATA', status: 'pending', description: 'Metadata', payload: { changes: {} } } as AIAction,
      ];

      expect(hasEventActions(actions)).toBe(false);
    });

    it('should return true for any event action type', () => {
      expect(hasEventActions([{ id: '1', type: 'CREATE_EVENT', status: 'pending', description: 'Create', payload: {} } as AIAction])).toBe(true);
      expect(hasEventActions([{ id: '1', type: 'UPDATE_EVENT', status: 'pending', description: 'Update', payload: {} } as AIAction])).toBe(true);
      expect(hasEventActions([{ id: '1', type: 'DELETE_EVENT', status: 'pending', description: 'Delete', payload: {} } as AIAction])).toBe(true);
      expect(hasEventActions([{ id: '1', type: 'UPDATE_SOURCES', status: 'pending', description: 'Sources', payload: {} } as AIAction])).toBe(true);
    });

    it('should return false for empty array', () => {
      expect(hasEventActions([])).toBe(false);
    });
  });
});
