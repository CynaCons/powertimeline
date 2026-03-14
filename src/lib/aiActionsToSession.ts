/**
 * AI Actions to Import Session Converter
 * v0.9.5 - Converts AI-generated actions to ImportSession format
 *
 * This utility bridges the AI chat system with the unified import review system,
 * allowing AI-generated events to flow through ReviewPanel for user approval.
 */

import type {
  AIAction,
  CreateEventAction,
  UpdateEventAction,
  DeleteEventAction,
  UpdateSourcesAction,
} from '../types/ai';
import type { Event } from '../types';

/**
 * Extended event type that includes the delete action marker.
 * This is used internally to signal delete actions to startSession.
 */
export type EventWithDeleteMarker = Partial<Event> & {
  _action?: 'delete';
};

/**
 * Result of converting AI actions to session events
 */
export interface ConversionResult {
  /** Events to be reviewed (create/update/delete) */
  events: EventWithDeleteMarker[];
  /** IDs of existing events (for duplicate detection) */
  existingEventIds: string[];
  /** Existing events array (for diff view) */
  existingEvents: Event[];
}

/**
 * Converts AI actions to ImportSession-compatible event format.
 *
 * - CREATE_EVENT → new event (no id)
 * - UPDATE_EVENT → event with existing id + changes
 * - UPDATE_SOURCES → event with existing id + sources change
 * - DELETE_EVENT → event with existing id + _action: 'delete' marker
 *
 * Filters out non-event actions (UPDATE_METADATA, INFO_RESPONSE).
 */
export function convertAIActionsToSessionEvents(
  actions: AIAction[],
  existingEvents: Event[]
): ConversionResult {
  const events: EventWithDeleteMarker[] = [];
  const existingEventIds = existingEvents.map(e => e.id);

  for (const action of actions) {
    switch (action.type) {
      case 'CREATE_EVENT': {
        const createAction = action as CreateEventAction;
        events.push({
          title: createAction.payload.title,
          date: createAction.payload.date,
          description: createAction.payload.description,
          endDate: createAction.payload.endDate,
          time: createAction.payload.time,
          sources: createAction.payload.sources,
        });
        break;
      }

      case 'UPDATE_EVENT': {
        const updateAction = action as UpdateEventAction;
        events.push({
          id: updateAction.payload.eventId,
          ...updateAction.payload.changes,
        });
        break;
      }

      case 'UPDATE_SOURCES': {
        const sourcesAction = action as UpdateSourcesAction;
        events.push({
          id: sourcesAction.payload.eventId,
          sources: sourcesAction.payload.sources,
        });
        break;
      }

      case 'DELETE_EVENT': {
        const deleteAction = action as DeleteEventAction;
        // Use a special marker that startSession will recognize
        // The event title is included for display in ReviewPanel
        const existingEvent = existingEvents.find(e => e.id === deleteAction.payload.eventId);
        events.push({
          id: deleteAction.payload.eventId,
          title: existingEvent?.title || deleteAction.payload.eventTitle,
          date: existingEvent?.date || '',
          // Mark this as a delete action - will be handled specially by startSession
          _action: 'delete',
        });
        break;
      }

      // Skip non-event actions
      case 'UPDATE_METADATA':
      case 'INFO_RESPONSE':
        break;
    }
  }

  return {
    events,
    existingEventIds,
    existingEvents,
  };
}

/**
 * Filters AI actions to only metadata actions (UPDATE_METADATA).
 * These stay in ChatPanel with inline approval UI.
 */
export function getMetadataActions(actions: AIAction[]): AIAction[] {
  return actions.filter(a => a.type === 'UPDATE_METADATA');
}

/**
 * Filters AI actions to only event-related actions.
 * These will be sent to ReviewPanel via ImportSession.
 */
export function getEventActions(actions: AIAction[]): AIAction[] {
  return actions.filter(a =>
    ['CREATE_EVENT', 'UPDATE_EVENT', 'DELETE_EVENT', 'UPDATE_SOURCES'].includes(a.type)
  );
}

/**
 * Checks if any actions require event review (should open ReviewPanel).
 */
export function hasEventActions(actions: AIAction[]): boolean {
  return actions.some(a =>
    ['CREATE_EVENT', 'UPDATE_EVENT', 'DELETE_EVENT', 'UPDATE_SOURCES'].includes(a.type)
  );
}
