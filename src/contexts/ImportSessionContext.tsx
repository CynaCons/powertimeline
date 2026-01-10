/**
 * Import Session Context
 * v0.9.0 - Unified Import Review System
 *
 * Provides global access to the import session for the current timeline
 */

import { createContext, useContext, type ReactNode } from 'react';
import { useImportSession } from '../hooks/useImportSession';
import type {
  ImportSession,
  ImportSource,
  EventDecision,
  SessionStats,
  ImportMode,
} from '../types/importSession';
import type { Event } from '../types';

interface ImportSessionContextType {
  session: ImportSession | null;
  hasActiveSession: boolean;
  startSession: (source: ImportSource, events: Partial<Event>[], existingEvents: Event[], importMode?: ImportMode) => void;
  updateDecision: (eventId: string, decision: EventDecision) => void;
  updateEventData: (eventId: string, edits: Partial<Event>) => void;
  commitSession: () => Promise<void>;
  discardSession: () => void;
  getStats: () => SessionStats;
  timelineId: string;
  ownerId: string;
}

const ImportSessionContext = createContext<ImportSessionContextType | null>(null);

interface ImportSessionProviderProps {
  children: ReactNode;
  timelineId: string;
  ownerId: string;
}

/**
 * Provider component that wraps the import session hook
 */
export function ImportSessionProvider({
  children,
  timelineId,
  ownerId,
}: ImportSessionProviderProps) {
  const {
    startSession: hookStartSession,
    commitSession: hookCommitSession,
    ...hookState
  } = useImportSession(timelineId);

  // Wrap the hook to adapt the API
  const contextValue: ImportSessionContextType = {
    ...hookState,
    timelineId,
    ownerId,
    // Adapt startSession to hide timelineId/ownerId from context consumers
    startSession: (source: ImportSource, events: Partial<Event>[], existingEvents: Event[], importMode: ImportMode = 'merge') => {
      const existingEventIds = existingEvents.map(e => e.id);
      hookStartSession(timelineId, ownerId, source, events, existingEventIds, existingEvents, importMode);
    },
    // Adapt commitSession to hide ownerId from context consumers
    commitSession: () => hookCommitSession(ownerId),
  };

  return (
    <ImportSessionContext.Provider value={contextValue}>
      {children}
    </ImportSessionContext.Provider>
  );
}

/**
 * Hook to access the import session context
 * Throws if used outside ImportSessionProvider
 */
export function useImportSessionContext(): ImportSessionContextType {
  const context = useContext(ImportSessionContext);
  if (!context) {
    throw new Error('useImportSessionContext must be used within ImportSessionProvider');
  }
  return context;
}
