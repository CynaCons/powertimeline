/**
 * AI Action Handlers
 * v0.7.0 - Execute AI-proposed actions on timeline
 */

import type { Event, Timeline } from '../types';
import type { 
  AIAction, 
  CreateEventAction, 
  UpdateEventAction, 
  DeleteEventAction,
  UpdateSourcesAction,
  UpdateMetadataAction 
} from '../types/ai';

interface ActionContext {
  events: Event[];
  timeline: Timeline | null;
  onCreateEvent: (event: Omit<Event, 'id'>) => Promise<string>; // Returns new event ID
  onUpdateEvent: (id: string, changes: Partial<Event>) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  onUpdateTimeline: (changes: Partial<Timeline>) => Promise<void>;
}

interface ActionResult {
  success: boolean;
  actionId: string;
  error?: string;
}

/**
 * Execute a single AI action
 */
async function executeAction(
  action: AIAction,
  context: ActionContext
): Promise<ActionResult> {
  try {
    switch (action.type) {
      case 'CREATE_EVENT': {
        const createAction = action as CreateEventAction;
        // Build event object, filtering out undefined values (Firestore doesn't accept undefined)
        const newEvent: Omit<Event, 'id'> = {
          title: createAction.payload.title,
          date: createAction.payload.date,
        };
        // Only add optional fields if they have values
        if (createAction.payload.description) {
          newEvent.description = createAction.payload.description;
        }
        if (createAction.payload.endDate) {
          newEvent.endDate = createAction.payload.endDate;
        }
        if (createAction.payload.time) {
          newEvent.time = createAction.payload.time;
        }
        if (createAction.payload.sources && createAction.payload.sources.length > 0) {
          newEvent.sources = createAction.payload.sources;
        }
        await context.onCreateEvent(newEvent);
        return { success: true, actionId: action.id };
      }

      case 'UPDATE_EVENT': {
        const updateAction = action as UpdateEventAction;
        const { eventId, changes } = updateAction.payload;

        // Verify event exists
        const existing = context.events.find(e => e.id === eventId);
        if (!existing) {
          return {
            success: false,
            actionId: action.id,
            error: `Event ${eventId} not found`
          };
        }

        // Filter out undefined values from changes (Firestore doesn't accept undefined)
        const filteredChanges: Partial<Event> = {};
        if (changes.title !== undefined) filteredChanges.title = changes.title;
        if (changes.date !== undefined) filteredChanges.date = changes.date;
        if (changes.description !== undefined) filteredChanges.description = changes.description;
        if (changes.endDate !== undefined) filteredChanges.endDate = changes.endDate;
        if (changes.time !== undefined) filteredChanges.time = changes.time;
        if (changes.sources !== undefined) filteredChanges.sources = changes.sources;

        await context.onUpdateEvent(eventId, filteredChanges);
        return { success: true, actionId: action.id };
      }

      case 'DELETE_EVENT': {
        const deleteAction = action as DeleteEventAction;
        const { eventId } = deleteAction.payload;
        
        // Verify event exists
        const existing = context.events.find(e => e.id === eventId);
        if (!existing) {
          return { 
            success: false, 
            actionId: action.id, 
            error: `Event ${eventId} not found` 
          };
        }
        
        await context.onDeleteEvent(eventId);
        return { success: true, actionId: action.id };
      }

      case 'UPDATE_SOURCES': {
        const sourcesAction = action as UpdateSourcesAction;
        const { eventId, sources } = sourcesAction.payload;
        
        const existing = context.events.find(e => e.id === eventId);
        if (!existing) {
          return { 
            success: false, 
            actionId: action.id, 
            error: `Event ${eventId} not found` 
          };
        }
        
        await context.onUpdateEvent(eventId, { sources });
        return { success: true, actionId: action.id };
      }

      case 'UPDATE_METADATA': {
        const metaAction = action as UpdateMetadataAction;
        const { changes } = metaAction.payload;
        
        if (!context.timeline) {
          return { 
            success: false, 
            actionId: action.id, 
            error: 'No timeline loaded' 
          };
        }
        
        await context.onUpdateTimeline(changes);
        return { success: true, actionId: action.id };
      }

      case 'INFO_RESPONSE':
        // Info responses don't need execution
        return { success: true, actionId: action.id };

      default: {
        // TypeScript exhaustiveness check - this should never happen
        const unknownAction = action as AIAction;
        return {
          success: false,
          actionId: unknownAction.id,
          error: `Unknown action type: ${unknownAction.type}`
        };
      }
    }
  } catch (error) {
    return { 
      success: false, 
      actionId: action.id, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Execute multiple AI actions in sequence
 */
export async function executeActions(
  actions: AIAction[],
  context: ActionContext
): Promise<ActionResult[]> {
  const results: ActionResult[] = [];
  
  for (const action of actions) {
    // Only execute approved actions
    if (action.status !== 'approved') {
      continue;
    }
    
    const result = await executeAction(action, context);
    results.push(result);
    
    // Stop on first failure? Or continue? Let's continue for now
  }
  
  return results;
}

/**
 * Validate actions before execution
 */
export function validateActions(
  actions: AIAction[],
  context: ActionContext
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const action of actions) {
    switch (action.type) {
      case 'UPDATE_EVENT':
      case 'DELETE_EVENT':
      case 'UPDATE_SOURCES': {
        const eventId = (action as UpdateEventAction | DeleteEventAction | UpdateSourcesAction).payload.eventId;
        if (!context.events.find(e => e.id === eventId)) {
          errors.push(`Event "${eventId}" not found for action: ${action.description}`);
        }
        break;
      }
      
      case 'UPDATE_METADATA':
        if (!context.timeline) {
          errors.push('No timeline loaded for metadata update');
        }
        break;
        
      case 'CREATE_EVENT': {
        const createAction = action as CreateEventAction;
        if (!createAction.payload.title || !createAction.payload.date) {
          errors.push(`Invalid create event: missing title or date`);
        }
        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(createAction.payload.date)) {
          errors.push(`Invalid date format: ${createAction.payload.date}`);
        }
        break;
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}
