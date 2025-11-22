import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  increment,
  collectionGroup,
  writeBatch,
  type QueryConstraint,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type {
  Timeline,
  TimelineMetadata,
  Event,
  EventDocument,
  User,
  AdminActivityLog,
  TimelineVisibility
} from '../types';

// Collection names
const COLLECTIONS = {
  TIMELINES: 'timelines', // Now a subcollection under users
  EVENTS: 'events', // Subcollection under timelines
  USERS: 'users',
  ACTIVITY_LOGS: 'activityLogs',
} as const;

// ============================================================================
// Timeline Operations
// ============================================================================

/**
 * Get timeline metadata only (without events)
 * v0.5.0.1 - Event Persistence Optimization
 */
export async function getTimelineMetadata(timelineId: string): Promise<TimelineMetadata | null> {
  try {
    // Use collection group query to search across all users' timelines
    const q = query(
      collectionGroup(db, COLLECTIONS.TIMELINES),
      where('id', '==', timelineId),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as TimelineMetadata;
  } catch (error) {
    console.error('Error fetching timeline metadata:', error);
    throw error;
  }
}

/**
 * Get a timeline by ID with all events (searches across all users' timelines)
 */
export async function getTimeline(timelineId: string): Promise<Timeline | null> {
  try {
    // First get the metadata
    const metadata = await getTimelineMetadata(timelineId);
    if (!metadata) {
      return null;
    }

    // Then get all events
    const events = await getTimelineEvents(timelineId, metadata.ownerId);

    return {
      ...metadata,
      events,
    };
  } catch (error) {
    console.error('Error fetching timeline:', error);
    throw error;
  }
}

/**
 * Get all timelines metadata (without events)
 * If ownerId is provided, queries that specific user's timelines subcollection
 * Otherwise, uses collectionGroup to query across all users
 * v0.5.0.1 - Event Persistence Optimization - Now returns metadata only
 */
export async function getTimelines(options?: {
  ownerId?: string;
  visibility?: TimelineVisibility;
  featured?: boolean;
  limitCount?: number;
  orderByField?: 'createdAt' | 'updatedAt' | 'viewCount';
  orderDirection?: 'asc' | 'desc';
}): Promise<TimelineMetadata[]> {
  try {
    const constraints: QueryConstraint[] = [];

    // Note: when using collection group, ownerId filter is applied via where clause
    if (options?.ownerId) {
      constraints.push(where('ownerId', '==', options.ownerId));
    }

    if (options?.visibility) {
      constraints.push(where('visibility', '==', options.visibility));
    }

    if (options?.featured !== undefined) {
      constraints.push(where('featured', '==', options.featured));
    }

    if (options?.orderByField) {
      constraints.push(orderBy(options.orderByField, options.orderDirection || 'desc'));
    } else {
      constraints.push(orderBy('updatedAt', 'desc'));
    }

    if (options?.limitCount) {
      constraints.push(limit(options.limitCount));
    }

    // Use collection group to query across all users' timeline subcollections
    const q = query(collectionGroup(db, COLLECTIONS.TIMELINES), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as TimelineMetadata[];
  } catch (error) {
    console.error('Error fetching timelines:', error);
    throw error;
  }
}

// ============================================================================
// Event Operations
// ============================================================================

/**
 * Get all events for a timeline
 * v0.5.0.1 - Event Persistence Optimization
 */
export async function getTimelineEvents(timelineId: string, ownerId: string): Promise<Event[]> {
  try {
    const eventsCollectionRef = collection(
      db,
      COLLECTIONS.USERS,
      ownerId,
      COLLECTIONS.TIMELINES,
      timelineId,
      COLLECTIONS.EVENTS
    );

    const q = query(eventsCollectionRef, orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
      const eventDoc = doc.data() as EventDocument;
      // Convert EventDocument back to Event by removing Firestore-specific fields
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { timelineId, createdAt, updatedAt, order, ...event } = eventDoc;
      return event as Event;
    });
  } catch (error) {
    console.error('Error fetching timeline events:', error);
    throw error;
  }
}

/**
 * Add a new event to a timeline
 * v0.5.0.1 - Event Persistence Optimization
 */
export async function addEvent(
  timelineId: string,
  ownerId: string,
  event: Event
): Promise<void> {
  try {
    const eventsCollectionRef = collection(
      db,
      COLLECTIONS.USERS,
      ownerId,
      COLLECTIONS.TIMELINES,
      timelineId,
      COLLECTIONS.EVENTS
    );

    // Get current event count to determine order
    const existingEvents = await getTimelineEvents(timelineId, ownerId);
    const order = existingEvents.length;

    const eventRef = doc(eventsCollectionRef, event.id);
    const now = new Date().toISOString();

    const eventDoc: EventDocument = {
      ...event,
      timelineId,
      createdAt: now,
      updatedAt: now,
      order,
    };

    await setDoc(eventRef, eventDoc);

    // Update timeline's eventCount and updatedAt
    const timelineRef = doc(db, COLLECTIONS.USERS, ownerId, COLLECTIONS.TIMELINES, timelineId);
    await updateDoc(timelineRef, {
      eventCount: existingEvents.length + 1,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Error adding event:', error);
    throw error;
  }
}

/**
 * Update an existing event
 * v0.5.0.1 - Event Persistence Optimization
 */
export async function updateEvent(
  timelineId: string,
  ownerId: string,
  eventId: string,
  updates: Partial<Event>
): Promise<void> {
  try {
    const eventRef = doc(
      db,
      COLLECTIONS.USERS,
      ownerId,
      COLLECTIONS.TIMELINES,
      timelineId,
      COLLECTIONS.EVENTS,
      eventId
    );

    const now = new Date().toISOString();

    await updateDoc(eventRef, {
      ...updates,
      updatedAt: now,
    });

    // Update timeline's updatedAt
    const timelineRef = doc(db, COLLECTIONS.USERS, ownerId, COLLECTIONS.TIMELINES, timelineId);
    await updateDoc(timelineRef, {
      updatedAt: now,
    });
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
}

/**
 * Delete an event from a timeline
 * v0.5.0.1 - Event Persistence Optimization
 */
export async function deleteEvent(
  timelineId: string,
  ownerId: string,
  eventId: string
): Promise<void> {
  try {
    const eventRef = doc(
      db,
      COLLECTIONS.USERS,
      ownerId,
      COLLECTIONS.TIMELINES,
      timelineId,
      COLLECTIONS.EVENTS,
      eventId
    );

    await deleteDoc(eventRef);

    // Update timeline's eventCount and updatedAt
    const events = await getTimelineEvents(timelineId, ownerId);
    const now = new Date().toISOString();

    const timelineRef = doc(db, COLLECTIONS.USERS, ownerId, COLLECTIONS.TIMELINES, timelineId);
    await updateDoc(timelineRef, {
      eventCount: events.length,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}

/**
 * Create a new timeline in the user's timelines subcollection
 * @param timeline - Timeline data (must include ownerId, can include events for backward compatibility)
 * @param customId - Optional custom ID (e.g., "timeline-french-revolution"). If not provided, auto-generates ID.
 * v0.5.0.1 - Event Persistence Optimization - Now stores events in subcollection
 */
export async function createTimeline(
  timeline: Omit<Timeline, 'id' | 'createdAt' | 'updatedAt'> | Omit<TimelineMetadata, 'id' | 'createdAt' | 'updatedAt'>,
  customId?: string
): Promise<string> {
  try {
    // Timeline must have an ownerId
    if (!timeline.ownerId) {
      throw new Error('Timeline must have an ownerId');
    }

    // Get reference to user's timelines subcollection
    const timelinesCollectionRef = collection(db, COLLECTIONS.USERS, timeline.ownerId, COLLECTIONS.TIMELINES);
    const timelineId = customId || doc(timelinesCollectionRef).id;
    const timelineRef = doc(db, COLLECTIONS.USERS, timeline.ownerId, COLLECTIONS.TIMELINES, timelineId);
    const now = new Date().toISOString();

    // Extract events if present (backward compatibility)
    const events = 'events' in timeline ? timeline.events : [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { events: _events, ...timelineData } = timeline as any;

    const newTimeline: TimelineMetadata = {
      ...timelineData,
      id: timelineId,
      createdAt: now,
      updatedAt: now,
      viewCount: timeline.viewCount || 0,
      featured: timeline.featured || false,
      eventCount: events.length,
    };

    await setDoc(timelineRef, newTimeline);

    // If events were provided, add them to the subcollection
    if (events.length > 0) {
      for (let i = 0; i < events.length; i++) {
        await addEvent(timelineId, timeline.ownerId, events[i]);
      }
    }

    return timelineId;
  } catch (error) {
    console.error('Error creating timeline:', error);
    throw error;
  }
}

/**
 * Check if a timeline ID is unique for a given owner
 * Checks within that specific user's timelines subcollection
 */
export async function isTimelineIdUnique(timelineId: string, ownerId: string): Promise<boolean> {
  try {
    const timelineRef = doc(db, COLLECTIONS.USERS, ownerId, COLLECTIONS.TIMELINES, timelineId);
    const timelineDoc = await getDoc(timelineRef);

    // ID is unique if document doesn't exist in this user's subcollection
    return !timelineDoc.exists();
  } catch (error) {
    console.error('Error checking timeline ID uniqueness:', error);
    return false; // Assume not unique on error to be safe
  }
}

/**
 * Update an existing timeline
 * First fetches the timeline to get the ownerId, then updates it
 */
export async function updateTimeline(timelineId: string, updates: Partial<Timeline>): Promise<void> {
  try {
    // First, get the timeline to find its owner
    const timeline = await getTimeline(timelineId);
    if (!timeline) {
      throw new Error(`Timeline ${timelineId} not found`);
    }

    // Update in the user's timelines subcollection
    const timelineRef = doc(db, COLLECTIONS.USERS, timeline.ownerId, COLLECTIONS.TIMELINES, timelineId);
    await updateDoc(timelineRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating timeline:', error);
    throw error;
  }
}

/**
 * Delete a timeline
 * First fetches the timeline to get the ownerId, then deletes it
 */
export async function deleteTimeline(timelineId: string): Promise<void> {
  try {
    // First, get the timeline to find its owner
    const timeline = await getTimeline(timelineId);
    if (!timeline) {
      throw new Error(`Timeline ${timelineId} not found`);
    }

    // Delete from the user's timelines subcollection
    const timelineRef = doc(db, COLLECTIONS.USERS, timeline.ownerId, COLLECTIONS.TIMELINES, timelineId);
    await deleteDoc(timelineRef);
  } catch (error) {
    console.error('Error deleting timeline:', error);
    throw error;
  }
}

/**
 * Increment timeline view count
 * First fetches the timeline metadata to get the ownerId, then increments the count
 * v0.5.0.1 - Event Persistence Optimization - Now uses getTimelineMetadata
 * v0.5.0.2 - Only increment if viewer is not the owner
 */
export async function incrementTimelineViewCount(timelineId: string, viewerId?: string): Promise<void> {
  try {
    // First, get the timeline metadata to find its owner (no need for events)
    const timeline = await getTimelineMetadata(timelineId);
    if (!timeline) {
      throw new Error(`Timeline ${timelineId} not found`);
    }

    // Don't increment view count if the viewer is the owner
    if (viewerId && viewerId === timeline.ownerId) {
      return;
    }

    // Increment in the user's timelines subcollection
    const timelineRef = doc(db, COLLECTIONS.USERS, timeline.ownerId, COLLECTIONS.TIMELINES, timelineId);
    await updateDoc(timelineRef, {
      viewCount: increment(1),
    });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    throw error;
  }
}

/**
 * Subscribe to timeline changes (real-time updates) with all events
 * Uses collection group to find the timeline across all users
 * v0.5.0.1 - Event Persistence Optimization - Now fetches events separately
 */
export function subscribeToTimeline(
  timelineId: string,
  callback: (timeline: Timeline | null) => void
): Unsubscribe {
  // Use collection group query to find the timeline across all users
  const q = query(
    collectionGroup(db, COLLECTIONS.TIMELINES),
    where('id', '==', timelineId),
    limit(1)
  );

  return onSnapshot(q, async (querySnapshot) => {
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const metadata = { id: doc.id, ...doc.data() } as TimelineMetadata;

      // Fetch events separately
      try {
        const events = await getTimelineEvents(timelineId, metadata.ownerId);
        callback({ ...metadata, events });
      } catch (error) {
        console.error('Error fetching events in timeline subscription:', error);
        callback(null);
      }
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error in timeline subscription:', error);
    callback(null);
  });
}

/**
 * Subscribe to timelines metadata with filters (real-time updates)
 * Uses collection group to query across all users' timeline subcollections
 * v0.5.0.1 - Event Persistence Optimization - Now returns metadata only
 */
export function subscribeToTimelines(
  callback: (timelines: TimelineMetadata[]) => void,
  options?: Parameters<typeof getTimelines>[0]
): Unsubscribe {
  const constraints: QueryConstraint[] = [];

  if (options?.ownerId) {
    constraints.push(where('ownerId', '==', options.ownerId));
  }

  if (options?.visibility) {
    constraints.push(where('visibility', '==', options.visibility));
  }

  if (options?.featured !== undefined) {
    constraints.push(where('featured', '==', options.featured));
  }

  if (options?.orderByField) {
    constraints.push(orderBy(options.orderByField, options.orderDirection || 'desc'));
  } else {
    constraints.push(orderBy('updatedAt', 'desc'));
  }

  if (options?.limitCount) {
    constraints.push(limit(options.limitCount));
  }

  // Use collection group to query across all users' timeline subcollections
  const q = query(collectionGroup(db, COLLECTIONS.TIMELINES), ...constraints);

  return onSnapshot(q, (querySnapshot) => {
    const timelines = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as TimelineMetadata[];
    callback(timelines);
  }, (error) => {
    console.error('Error in timelines subscription:', error);
    callback([]);
  });
}

// ============================================================================
// User Operations
// ============================================================================

/**
 * Get a user by ID
 */
export async function getUser(userId: string): Promise<User | null> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return null;
    }

    return { id: userSnap.id, ...userSnap.data() } as User;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

/**
 * Get all users
 */
export async function getUsers(): Promise<User[]> {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

/**
 * Create a new user
 */
export async function createUser(user: Omit<User, 'createdAt'>): Promise<void> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, user.id);
    const now = new Date().toISOString();

    await setDoc(userRef, {
      ...user,
      createdAt: now,
      role: user.role || 'user',
    });
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Update an existing user
 */
export async function updateUser(userId: string, updates: Partial<User>): Promise<void> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await deleteDoc(userRef);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

/**
 * Get user by email address
 * v0.5.1 - Registration validation
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const q = query(
      collection(db, COLLECTIONS.USERS),
      where('email', '==', email),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw error;
  }
}

/**
 * Get user by username
 * v0.5.1 - Registration validation
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const q = query(
      collection(db, COLLECTIONS.USERS),
      where('username', '==', username.toLowerCase()),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
  } catch (error) {
    console.error('Error fetching user by username:', error);
    throw error;
  }
}

/**
 * Check if username is available
 * v0.5.1 - Registration validation
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    const user = await getUserByUsername(username);
    return user === null;
  } catch (error) {
    console.error('Error checking username availability:', error);
    return false; // Assume not available on error to be safe
  }
}

/**
 * Check if email is available (not already registered)
 * v0.5.1 - Registration validation
 */
export async function isEmailAvailable(email: string): Promise<boolean> {
  try {
    const user = await getUserByEmail(email);
    return user === null;
  } catch (error) {
    console.error('Error checking email availability:', error);
    return false; // Assume not available on error to be safe
  }
}

// ============================================================================
// Admin Activity Log Operations
// ============================================================================

/**
 * Create a new activity log entry
 */
export async function createActivityLog(
  log: Omit<AdminActivityLog, 'id' | 'timestamp'>
): Promise<string> {
  try {
    const logRef = doc(collection(db, COLLECTIONS.ACTIVITY_LOGS));
    const now = new Date().toISOString();

    const newLog: AdminActivityLog = {
      ...log,
      id: logRef.id,
      timestamp: now,
    };

    await setDoc(logRef, newLog);
    return logRef.id;
  } catch (error) {
    console.error('Error creating activity log:', error);
    throw error;
  }
}

/**
 * Get activity logs (with optional filters)
 */
export async function getActivityLogs(options?: {
  adminUserId?: string;
  action?: AdminActivityLog['action'];
  targetType?: AdminActivityLog['targetType'];
  limitCount?: number;
}): Promise<AdminActivityLog[]> {
  try {
    const constraints: QueryConstraint[] = [
      orderBy('timestamp', 'desc')
    ];

    if (options?.adminUserId) {
      constraints.push(where('adminUserId', '==', options.adminUserId));
    }

    if (options?.action) {
      constraints.push(where('action', '==', options.action));
    }

    if (options?.targetType) {
      constraints.push(where('targetType', '==', options.targetType));
    }

    if (options?.limitCount) {
      constraints.push(limit(options.limitCount));
    }

    const q = query(collection(db, COLLECTIONS.ACTIVITY_LOGS), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as AdminActivityLog[];
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    throw error;
  }
}

/**
 * Subscribe to activity logs (real-time updates)
 */
export function subscribeToActivityLogs(
  callback: (logs: AdminActivityLog[]) => void,
  options?: Parameters<typeof getActivityLogs>[0]
): Unsubscribe {
  const constraints: QueryConstraint[] = [
    orderBy('timestamp', 'desc')
  ];

  if (options?.adminUserId) {
    constraints.push(where('adminUserId', '==', options.adminUserId));
  }

  if (options?.action) {
    constraints.push(where('action', '==', options.action));
  }

  if (options?.targetType) {
    constraints.push(where('targetType', '==', options.targetType));
  }

  if (options?.limitCount) {
    constraints.push(limit(options.limitCount));
  }

  const q = query(collection(db, COLLECTIONS.ACTIVITY_LOGS), ...constraints);

  return onSnapshot(q, (querySnapshot) => {
    const logs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as AdminActivityLog[];
    callback(logs);
  }, (error) => {
    console.error('Error in activity logs subscription:', error);
    callback([]);
  });
}

// ============================================================================
// Platform Statistics
// ============================================================================

/**
 * Get platform-wide statistics
 */
export async function getPlatformStats(): Promise<{
  totalUsers: number;
  totalTimelines: number;
  totalEvents: number;
  totalViews: number;
  publicTimelines: number;
  unlistedTimelines: number;
  privateTimelines: number;
}> {
  try {
    const [users, timelines] = await Promise.all([
      getUsers(),
      getTimelines(),
    ]);

    // v0.5.0.1 - Use eventCount from TimelineMetadata instead of events.length
    const totalEvents = timelines.reduce((sum, t) => sum + (t.eventCount || 0), 0);
    const totalViews = timelines.reduce((sum, t) => sum + t.viewCount, 0);

    const publicTimelines = timelines.filter(t => t.visibility === 'public').length;
    const unlistedTimelines = timelines.filter(t => t.visibility === 'unlisted').length;
    const privateTimelines = timelines.filter(t => t.visibility === 'private').length;

    return {
      totalUsers: users.length,
      totalTimelines: timelines.length,
      totalEvents,
      totalViews,
      publicTimelines,
      unlistedTimelines,
      privateTimelines,
    };
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    throw error;
  }
}

/**
 * Reset all statistics (view counts) across all timelines
 * v0.5.0.2 - Admin functionality to clear statistics
 */
export async function resetAllStatistics(): Promise<void> {
  try {
    // Get all users
    const users = await getUsers();

    // For each user, get their timelines and reset view counts
    for (const user of users) {
      const timelinesRef = collection(db, COLLECTIONS.USERS, user.id, COLLECTIONS.TIMELINES);
      const snapshot = await getDocs(timelinesRef);

      // Batch update all timelines for this user
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { viewCount: 0 });
      });
      await batch.commit();
    }
  } catch (error) {
    console.error('Error resetting statistics:', error);
    throw error;
  }
}
