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
  type QueryConstraint,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Timeline, User, AdminActivityLog, TimelineVisibility } from '../types';

// Collection names
const COLLECTIONS = {
  TIMELINES: 'timelines',
  USERS: 'users',
  ACTIVITY_LOGS: 'activityLogs',
} as const;

// ============================================================================
// Timeline Operations
// ============================================================================

/**
 * Get a timeline by ID
 */
export async function getTimeline(timelineId: string): Promise<Timeline | null> {
  try {
    const timelineRef = doc(db, COLLECTIONS.TIMELINES, timelineId);
    const timelineSnap = await getDoc(timelineRef);

    if (!timelineSnap.exists()) {
      return null;
    }

    return { id: timelineSnap.id, ...timelineSnap.data() } as Timeline;
  } catch (error) {
    console.error('Error fetching timeline:', error);
    throw error;
  }
}

/**
 * Get all timelines (with optional filters)
 */
export async function getTimelines(options?: {
  ownerId?: string;
  visibility?: TimelineVisibility;
  featured?: boolean;
  limitCount?: number;
  orderByField?: 'createdAt' | 'updatedAt' | 'viewCount';
  orderDirection?: 'asc' | 'desc';
}): Promise<Timeline[]> {
  try {
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

    const q = query(collection(db, COLLECTIONS.TIMELINES), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Timeline[];
  } catch (error) {
    console.error('Error fetching timelines:', error);
    throw error;
  }
}

/**
 * Create a new timeline
 */
export async function createTimeline(timeline: Omit<Timeline, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const timelineRef = doc(collection(db, COLLECTIONS.TIMELINES));
    const now = new Date().toISOString();

    const newTimeline: Timeline = {
      ...timeline,
      id: timelineRef.id,
      createdAt: now,
      updatedAt: now,
      viewCount: timeline.viewCount || 0,
      featured: timeline.featured || false,
    };

    await setDoc(timelineRef, newTimeline);
    return timelineRef.id;
  } catch (error) {
    console.error('Error creating timeline:', error);
    throw error;
  }
}

/**
 * Update an existing timeline
 */
export async function updateTimeline(timelineId: string, updates: Partial<Timeline>): Promise<void> {
  try {
    const timelineRef = doc(db, COLLECTIONS.TIMELINES, timelineId);
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
 */
export async function deleteTimeline(timelineId: string): Promise<void> {
  try {
    const timelineRef = doc(db, COLLECTIONS.TIMELINES, timelineId);
    await deleteDoc(timelineRef);
  } catch (error) {
    console.error('Error deleting timeline:', error);
    throw error;
  }
}

/**
 * Increment timeline view count
 */
export async function incrementTimelineViewCount(timelineId: string): Promise<void> {
  try {
    const timelineRef = doc(db, COLLECTIONS.TIMELINES, timelineId);
    await updateDoc(timelineRef, {
      viewCount: increment(1),
    });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    throw error;
  }
}

/**
 * Subscribe to timeline changes (real-time updates)
 */
export function subscribeToTimeline(
  timelineId: string,
  callback: (timeline: Timeline | null) => void
): Unsubscribe {
  const timelineRef = doc(db, COLLECTIONS.TIMELINES, timelineId);

  return onSnapshot(timelineRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() } as Timeline);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error in timeline subscription:', error);
    callback(null);
  });
}

/**
 * Subscribe to timelines with filters (real-time updates)
 */
export function subscribeToTimelines(
  callback: (timelines: Timeline[]) => void,
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

  const q = query(collection(db, COLLECTIONS.TIMELINES), ...constraints);

  return onSnapshot(q, (querySnapshot) => {
    const timelines = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Timeline[];
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

    const totalEvents = timelines.reduce((sum, t) => sum + t.events.length, 0);
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
