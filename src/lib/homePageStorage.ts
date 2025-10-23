/**
 * Home Page Storage Utilities
 * Handles localStorage operations for timelines, users, and discovery features (v0.4.0)
 */

import type { Timeline, User, Event, SearchResults } from '../types';

/**
 * localStorage keys for home page data
 */
export const STORAGE_KEYS = {
  USERS: 'powertimeline_users',
  TIMELINES: 'powertimeline_timelines',
  CURRENT_USER: 'powertimeline_current_user',
  VIEW_PREFERENCES: 'powertimeline_view_prefs',
  STATS_CACHE: 'powertimeline_stats',
  VIEW_COUNTS: 'powertimeline_view_counts',
} as const;

/**
 * Demo users for v0.4.0
 * Pre-populated on first load
 * Primary user: CynaCons (the application owner)
 */
export const DEMO_USERS: User[] = [
  {
    id: 'cynacons',
    name: 'CynaCons',
    avatar: '⚡',
    bio: 'Building collaborative timeline experiences with PowerTimeline. Exploring the intersection of history, technology, and knowledge sharing.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bob',
    name: 'Bob',
    avatar: '👨‍🔬',
    bio: 'Researcher focused on scientific discoveries throughout history.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'charlie',
    name: 'Charlie',
    avatar: '👨‍🎨',
    bio: 'Exploring art history and cultural movements.',
    createdAt: new Date().toISOString(),
  },
];

/**
 * Initialize users if they don't exist in localStorage
 * Idempotent - safe to run multiple times
 */
export function initializeUsers(): User[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USERS);
    if (stored) {
      const users = JSON.parse(stored) as User[];
      if (users.length > 0) {
        return users;
      }
    }
  } catch (error) {
    console.error('Failed to load users from localStorage:', error);
  }

  // Initialize with demo users
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEMO_USERS));
  return DEMO_USERS;
}

/**
 * Get all users from localStorage
 */
export function getUsers(): User[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USERS);
    if (stored) {
      return JSON.parse(stored) as User[];
    }
  } catch (error) {
    console.error('Failed to load users:', error);
  }
  return initializeUsers();
}

/**
 * Get user by ID
 */
export function getUserById(userId: string): User | undefined {
  const users = getUsers();
  return users.find(u => u.id === userId);
}

/**
 * Get current logged-in user (demo user for v0.4.0)
 */
export function getCurrentUser(): User | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (stored) {
      return JSON.parse(stored) as User;
    }
  } catch (error) {
    console.error('Failed to load current user:', error);
  }

  // Default to Alice if no user set
  const users = getUsers();
  const defaultUser = users[0];
  if (defaultUser) {
    setCurrentUser(defaultUser);
    return defaultUser;
  }

  return null;
}

/**
 * Set current user
 */
export function setCurrentUser(user: User): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
}

/**
 * Convert legacy Event[] to Timeline format
 * Used for migrating existing timeline data
 */
export function migrateEventsToTimeline(
  events: Event[],
  title: string = 'My Timeline',
  ownerId: string = 'cynacons'
): Timeline {
  const now = new Date().toISOString();
  return {
    id: `timeline-${Date.now()}`,
    title,
    description: `Migrated timeline with ${events.length} events`,
    events,
    ownerId,
    createdAt: now,
    updatedAt: now,
    viewCount: 0,
    featured: false,
  };
}

/**
 * Get all timelines from localStorage
 */
export function getTimelines(): Timeline[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TIMELINES);
    if (stored) {
      return JSON.parse(stored) as Timeline[];
    }
  } catch (error) {
    console.error('Failed to load timelines:', error);
  }
  return [];
}

/**
 * Save timelines to localStorage
 */
export function saveTimelines(timelines: Timeline[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TIMELINES, JSON.stringify(timelines));
  } catch (error) {
    console.error('Failed to save timelines:', error);
  }
}

/**
 * Get timeline by ID
 */
export function getTimelineById(timelineId: string): Timeline | undefined {
  const timelines = getTimelines();
  return timelines.find(t => t.id === timelineId);
}

/**
 * Get timelines by owner ID
 */
export function getTimelinesByOwner(ownerId: string): Timeline[] {
  const timelines = getTimelines();
  return timelines.filter(t => t.ownerId === ownerId);
}

/**
 * Create a new timeline
 */
export function createTimeline(
  title: string,
  ownerId: string,
  events: Event[] = []
): Timeline {
  const now = new Date().toISOString();
  const timeline: Timeline = {
    id: `timeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    description: '',
    events,
    ownerId,
    createdAt: now,
    updatedAt: now,
    viewCount: 0,
    featured: false,
  };

  const timelines = getTimelines();
  timelines.push(timeline);
  saveTimelines(timelines);

  return timeline;
}

/**
 * Update a timeline
 */
export function updateTimeline(timelineId: string, updates: Partial<Timeline>): void {
  const timelines = getTimelines();
  const index = timelines.findIndex(t => t.id === timelineId);

  if (index !== -1) {
    timelines[index] = {
      ...timelines[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveTimelines(timelines);
  }
}

/**
 * Delete a timeline
 */
export function deleteTimeline(timelineId: string): void {
  const timelines = getTimelines();
  const filtered = timelines.filter(t => t.id !== timelineId);
  saveTimelines(filtered);
}

/**
 * Increment view count for a timeline
 * Debounced per session - tracks which timelines have been viewed
 */
export function incrementViewCount(timelineId: string): void {
  // Check if we've already counted a view for this timeline in this session
  const sessionKey = `viewed_${timelineId}`;
  if (sessionStorage.getItem(sessionKey)) {
    return; // Already counted in this session
  }

  const timelines = getTimelines();
  const timeline = timelines.find(t => t.id === timelineId);

  if (timeline) {
    timeline.viewCount += 1;
    timeline.updatedAt = new Date().toISOString();
    saveTimelines(timelines);

    // Mark as viewed in this session
    sessionStorage.setItem(sessionKey, 'true');
  }
}

/**
 * Get recently edited timelines (sorted by updatedAt descending)
 */
export function getRecentlyEditedTimelines(limit: number = 6): Timeline[] {
  const timelines = getTimelines();
  return timelines
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit);
}

/**
 * Get popular timelines (sorted by viewCount descending)
 * Falls back to event count if all have 0 views
 */
export function getPopularTimelines(limit: number = 6): Timeline[] {
  const timelines = getTimelines();

  // Check if any timeline has views
  const hasViews = timelines.some(t => t.viewCount > 0);

  if (hasViews) {
    return timelines
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, limit);
  }

  // Fallback: sort by event count
  return timelines
    .sort((a, b) => b.events.length - a.events.length)
    .slice(0, limit);
}

/**
 * Get featured timelines
 */
export function getFeaturedTimelines(limit: number = 6): Timeline[] {
  const timelines = getTimelines();
  return timelines
    .filter(t => t.featured)
    .slice(0, limit);
}

/**
 * Search timelines and users
 * Unified search across both data types
 */
export function searchTimelinesAndUsers(query: string): SearchResults {
  if (!query || query.trim().length < 2) {
    return { timelines: [], users: [], hasMore: false };
  }

  const lowerQuery = query.toLowerCase().trim();
  const timelines = getTimelines();
  const users = getUsers();

  // Search timelines
  const matchingTimelines = timelines.filter(t =>
    t.title.toLowerCase().includes(lowerQuery) ||
    t.description?.toLowerCase().includes(lowerQuery)
  );

  // Search users
  const matchingUsers = users.filter(u =>
    u.name.toLowerCase().includes(lowerQuery) ||
    u.bio?.toLowerCase().includes(lowerQuery)
  );

  const maxTimelines = 5;
  const maxUsers = 3;

  return {
    timelines: matchingTimelines.slice(0, maxTimelines),
    users: matchingUsers.slice(0, maxUsers),
    hasMore: matchingTimelines.length > maxTimelines || matchingUsers.length > maxUsers,
  };
}

/**
 * Get platform statistics
 */
export function getPlatformStatistics() {
  const timelines = getTimelines();
  const users = getUsers();

  const totalEvents = timelines.reduce((sum, t) => sum + t.events.length, 0);
  const totalViews = timelines.reduce((sum, t) => sum + t.viewCount, 0);

  // Find most active timeline (most recent updatedAt)
  const mostActive = timelines.length > 0
    ? timelines.reduce((latest, t) =>
        new Date(t.updatedAt) > new Date(latest.updatedAt) ? t : latest
      )
    : null;

  return {
    timelineCount: timelines.length,
    userCount: users.length,
    eventCount: totalEvents,
    viewCount: totalViews,
    mostActiveTimeline: mostActive,
  };
}
