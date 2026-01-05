/**
 * Import Session Infrastructure Types
 * v0.9.0 - Unified Import Review System
 *
 * Defines the session-based workflow for reviewing and committing imported events
 * from any source (YAML, AI chat, PR, etc.)
 */

import type { Event } from '../types';

/**
 * Source of imported events
 */
export type ImportSource = 'yaml' | 'ai-chat' | 'pr';

/**
 * Session lifecycle status
 */
export type SessionStatus = 'active' | 'committed' | 'discarded';

/**
 * User's decision on an event during review
 */
export type EventDecision = 'pending' | 'accepted' | 'rejected';

/**
 * What to do with this event when committed
 */
export type EventAction = 'create' | 'update' | 'delete';

/**
 * A single event being reviewed in the session
 */
export interface SessionEvent {
  id: string;                    // Temporary UUID for this session event
  action: EventAction;           // What to do with this event
  decision: EventDecision;       // User's decision
  eventData: Partial<Event>;     // The imported event data
  existingEvent?: Event;         // For updates: the original event
  userEdits?: Partial<Event>;    // User modifications during review
}

/**
 * An import review session
 * Stored in localStorage until committed or discarded
 */
export interface ImportSession {
  id: string;                    // Session UUID
  timelineId: string;            // Target timeline
  ownerId: string;               // User who owns the session
  source: ImportSource;          // Where the events came from
  status: SessionStatus;         // Session state
  events: SessionEvent[];        // Events to review
  createdAt: number;             // Timestamp (Date.now())
  existingEventIds: string[];    // IDs of existing events (for duplicate detection)
}

/**
 * Statistics about session review progress
 */
export interface SessionStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
}
