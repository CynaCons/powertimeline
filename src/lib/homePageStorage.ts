/**
 * Home Page Storage Utilities
 * Handles localStorage operations for timelines, users, and discovery features (v0.4.0)
 */

import type { Timeline, User, Event, SearchResults } from '../types';
import { seedRFKTimeline, seedJFKTimeline, seedFrenchRevolutionTimeline, seedNapoleonTimeline, seedDeGaulleTimeline } from './devSeed';

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
  DATA_VERSION: 'powertimeline_data_version',
} as const;

/**
 * Current data version for migration tracking
 * Increment this when data structure changes require migration
 */
const CURRENT_DATA_VERSION = 4; // v4: Added role field to User, cynacons is admin (v0.4.4)

/**
 * Get current data version from localStorage
 */
function getDataVersion(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DATA_VERSION);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Set data version in localStorage
 */
function setDataVersion(version: number): void {
  localStorage.setItem(STORAGE_KEYS.DATA_VERSION, version.toString());
}

/**
 * Check if timeline IDs are in old timestamp format
 * Old format: timeline-1761254688359-1
 * New format: timeline-french-revolution
 */
function hasOldTimelineIdFormat(timelines: Timeline[]): boolean {
  return timelines.some(t => /timeline-\d{13}-\d+/.test(t.id));
}

/**
 * Check if data migration is needed and perform it
 * Returns true if migration was performed
 */
export function checkAndMigrateData(): boolean {
  const currentVersion = getDataVersion();

  if (currentVersion >= CURRENT_DATA_VERSION) {
    // Check if data is actually valid (no old-format IDs)
    const timelines = getTimelines();
    if (timelines.length > 0 && hasOldTimelineIdFormat(timelines)) {
      // Clear old data including legacy EventStorage
      localStorage.removeItem(STORAGE_KEYS.TIMELINES);
      localStorage.removeItem('powertimeline-events'); // Legacy EventStorage key
      setDataVersion(CURRENT_DATA_VERSION);
      return true;
    }
    return false; // No migration needed
  }

  // Clear old data including legacy EventStorage and let initialization create fresh data
  localStorage.removeItem(STORAGE_KEYS.TIMELINES);
  localStorage.removeItem('powertimeline-events'); // Legacy EventStorage key
  setDataVersion(CURRENT_DATA_VERSION);

  return true;
}

/**
 * DEPRECATED (v0.5.6): Demo users removed in favor of Firebase Authentication
 * Users are now managed via Firebase Auth + Firestore
 *
 * This code is kept temporarily for backwards compatibility and will be removed in v0.6.0
 *
 * @deprecated Use Firebase Auth getCurrentUser() and Firestore getUser() instead
 */
export const DEMO_USERS: User[] = [];

// Legacy demo user data (commented out - no longer used)
/*
const LEGACY_DEMO_USERS = [
  { id: 'cynacons', username: 'cynacons', name: 'CynaCons', ... },
  { id: 'alice', username: 'alice', name: 'Alice', ... },
  { id: 'bob', username: 'bob', name: 'Bob', ... },
  { id: 'charlie', username: 'charlie', name: 'Charlie', ... },
];
*/

/**
 * DEPRECATED (v0.5.6): Initialize users from localStorage
 *
 * @deprecated Users are now managed via Firebase Auth + Firestore
 * This function returns empty array and does NOT auto-create demo users
 * Use Firestore getAllUsers() to fetch authenticated users instead
 */
export function initializeUsers(): User[] {
  console.warn('initializeUsers() is deprecated. Use Firebase Auth + Firestore instead.');

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

  // NO LONGER auto-initializing with demo users (v0.5.6)
  // Users must authenticate via Firebase Auth
  return [];
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
 * DEPRECATED (v0.5.6): Get current logged-in user
 * @deprecated Use Firebase Auth useAuth() hook instead
 * Returns null - demo users removed
 */
export function getCurrentUser(): User | null {
  console.warn('getCurrentUser() is deprecated. Use Firebase Auth useAuth() hook instead.');

  // NO LONGER auto-creating demo users (v0.5.6)
  // Users must authenticate via Firebase Auth
  return null;
}

/**
 * Set current user
 */
export function setCurrentUser(user: User): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
}

/**
 * Save users array to localStorage
 * Admin utility for v0.4.4
 */
export function saveUsers(users: User[]): void {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

/**
 * Update an existing user
 * Returns true if successful, false if user not found
 * Admin utility for v0.4.4
 */
export function updateUser(userId: string, updates: Partial<User>): boolean {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return false;
  }

  // Update user with partial updates
  users[userIndex] = {
    ...users[userIndex],
    ...updates,
  };

  saveUsers(users);

  // If updating current user, update that too
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    setCurrentUser(users[userIndex]);
  }

  return true;
}

/**
 * Delete a user and optionally cascade delete their timelines
 * Returns number of timelines deleted
 * Admin utility for v0.4.4
 */
export function deleteUser(userId: string, cascadeDelete: boolean = true): number {
  const users = getUsers();
  const filteredUsers = users.filter(u => u.id !== userId);

  if (filteredUsers.length === users.length) {
    // User not found
    return 0;
  }

  saveUsers(filteredUsers);

  // Handle cascade delete of timelines
  let timelinesDeleted = 0;
  if (cascadeDelete) {
    const timelines = getTimelines();
    const userTimelines = timelines.filter(t => t.ownerId === userId);
    timelinesDeleted = userTimelines.length;

    const remainingTimelines = timelines.filter(t => t.ownerId !== userId);
    saveTimelines(remainingTimelines);
  }

  // Clear current user if deleting current user
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  return timelinesDeleted;
}

/**
 * Generate a URL-safe slug from a title with accent/diacritic removal
 * Examples:
 *   "French Revolution" -> "french-revolution"
 *   "Révolution Française" -> "revolution-francaise"
 *   "Napoléon Bonaparte" -> "napoleon-bonaparte"
 */
export function generateSlugFromTitle(title: string): string {
  return title
    .normalize('NFD')                 // Decompose accented characters (é → e + ́)
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .toLowerCase()                    // Convert to lowercase
    .replace(/[^a-z0-9]+/g, '-')     // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')         // Remove leading/trailing hyphens
    .slice(0, 50);                   // Limit length
}

/**
 * Generate a unique timeline ID
 * Format: timeline-{slug} or timeline-{slug}-{number} if slug exists
 */
export function generateTimelineId(title: string, ownerId: string): string {
  const baseSlug = generateSlugFromTitle(title);
  const timelines = getTimelines();

  // Check if this slug already exists for this owner
  const existingSlugs = timelines
    .filter(t => t.ownerId === ownerId)
    .map(t => t.id)
    .filter(id => id.startsWith(`timeline-${baseSlug}`));

  if (existingSlugs.length === 0) {
    return `timeline-${baseSlug}`;
  }

  // Find next available number suffix
  let counter = 2;
  while (existingSlugs.includes(`timeline-${baseSlug}-${counter}`)) {
    counter++;
  }
  return `timeline-${baseSlug}-${counter}`;
}

/**
 * Check if a timeline ID is unique for a given owner
 * Returns true if the ID doesn't exist, false if it already exists
 */
export function isTimelineIdUnique(timelineId: string, ownerId: string): boolean {
  const timelines = getTimelines();
  return !timelines.some(t => t.id === timelineId && t.ownerId === ownerId);
}

/**
 * Convert legacy Event[] to Timeline format
 * Used for migrating existing timeline data
 *
 * @param events - Array of events to convert
 * @param title - Timeline title
 * @param ownerId - Owner user ID (defaults to current user, or 'cynacons' if no current user)
 * @param customId - Optional custom ID (will be slugified if provided)
 */
export function migrateEventsToTimeline(
  events: Event[],
  title: string = 'My Timeline',
  ownerId?: string,
  customId?: string
): Timeline {
  const now = new Date().toISOString();

  // Use provided ownerId, or current user, or fallback to 'cynacons'
  const finalOwnerId = ownerId || getCurrentUser()?.id || 'cynacons';

  // Generate ID from custom ID or title
  const timelineId = customId
    ? `timeline-${generateSlugFromTitle(customId)}`
    : generateTimelineId(title, finalOwnerId);

  return {
    id: timelineId,
    title,
    description: `Migrated timeline with ${events.length} events`,
    events,
    eventCount: events.length,
    ownerId: finalOwnerId,
    createdAt: now,
    updatedAt: now,
    viewCount: 0,
    featured: false,
    visibility: 'public', // Default to public for migrated timelines
  };
}

/**
 * Create sample timelines for all demo users
 * Called on first initialization when no timelines exist
 */
export function createSampleTimelines(): Timeline[] {
  const now = new Date().toISOString();

  const sampleTimelines: Timeline[] = [
    // CynaCons - RFK Timeline (with actual events)
    {
      id: 'timeline-rfk-1968-campaign',
      title: 'RFK 1968 Campaign',
      description: 'Robert F. Kennedy\'s presidential campaign timeline from announcement to tragic end',
      events: seedRFKTimeline(),
      eventCount: seedRFKTimeline().length,
      ownerId: 'cynacons',
      createdAt: now,
      updatedAt: now,
      viewCount: 0,
      featured: true,
      visibility: 'public',
    },
    // CynaCons - JFK Timeline (with actual events)
    {
      id: 'timeline-jfk-presidency-1961-1963',
      title: 'JFK Presidency 1961-1963',
      description: 'Key events during John F. Kennedy\'s presidency',
      events: seedJFKTimeline(),
      eventCount: seedJFKTimeline().length,
      ownerId: 'cynacons',
      createdAt: now,
      updatedAt: now,
      viewCount: 0,
      featured: false,
      visibility: 'public',
    },
    // CynaCons - French Revolution Timeline (with actual events)
    {
      id: 'timeline-french-revolution',
      title: 'French Revolution',
      description: 'Timeline of the French Revolution from 1789-1799, documenting the fall of the monarchy and rise of the Republic',
      events: seedFrenchRevolutionTimeline(),
      eventCount: seedFrenchRevolutionTimeline().length,
      ownerId: 'cynacons',
      createdAt: now,
      updatedAt: now,
      viewCount: 0,
      featured: false,
      visibility: 'public',
    },
    // CynaCons - Napoleon Timeline (with actual events)
    {
      id: 'timeline-napoleon-bonaparte',
      title: 'Napoleon Bonaparte',
      description: 'Rise and fall of Napoleon Bonaparte from the French Revolution to his exile',
      events: seedNapoleonTimeline(),
      eventCount: seedNapoleonTimeline().length,
      ownerId: 'cynacons',
      createdAt: now,
      updatedAt: now,
      viewCount: 0,
      featured: false,
      visibility: 'public',
    },
    // CynaCons - Charles de Gaulle Timeline (with actual events)
    {
      id: 'timeline-charles-de-gaulle',
      title: 'Charles de Gaulle',
      description: 'Life and political career of Charles de Gaulle, from Free France to the Fifth Republic',
      events: seedDeGaulleTimeline(),
      eventCount: seedDeGaulleTimeline().length,
      ownerId: 'cynacons',
      createdAt: now,
      updatedAt: now,
      viewCount: 0,
      featured: false,
      visibility: 'public',
    },
    // Demo user timelines removed in v0.5.6
    // All timelines now owned by 'cynacons' or Firebase Auth users
  ];

  return sampleTimelines;
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
  description: string = '',
  customId?: string,
  events: Event[] = [],
  visibility: import('../types').TimelineVisibility = 'public'
): Timeline {
  const now = new Date().toISOString();

  // Use custom ID if provided, otherwise auto-generate
  const timelineId = customId
    ? `timeline-${customId}`
    : `timeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const timeline: Timeline = {
    id: timelineId,
    title,
    description,
    events,
    eventCount: events.length,
    ownerId,
    createdAt: now,
    updatedAt: now,
    viewCount: 0,
    featured: false,
    visibility,
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
 * Check if a timeline should be visible to the current user
 * - Public timelines: Always visible
 * - Unlisted/Private timelines: Only visible to owner
 */
function isTimelineVisibleToUser(timeline: Timeline, currentUserId?: string): boolean {
  if (timeline.visibility === 'public') {
    return true;
  }
  // Unlisted and private timelines only visible to owner
  return currentUserId !== undefined && timeline.ownerId === currentUserId;
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
 * Only returns public timelines, or unlisted/private timelines owned by currentUserId
 */
export function getRecentlyEditedTimelines(limit: number = 6, currentUserId?: string): Timeline[] {
  const timelines = getTimelines();
  return timelines
    .filter(t => isTimelineVisibleToUser(t, currentUserId))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit);
}

/**
 * Get popular timelines (sorted by viewCount descending)
 * Falls back to event count if all have 0 views
 * Only returns public timelines, or unlisted/private timelines owned by currentUserId
 */
export function getPopularTimelines(limit: number = 6, currentUserId?: string): Timeline[] {
  const timelines = getTimelines();
  const visibleTimelines = timelines.filter(t => isTimelineVisibleToUser(t, currentUserId));

  // Check if any timeline has views
  const hasViews = visibleTimelines.some(t => t.viewCount > 0);

  if (hasViews) {
    return visibleTimelines
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, limit);
  }

  // Fallback: sort by event count
  return visibleTimelines
    .sort((a, b) => b.events.length - a.events.length)
    .slice(0, limit);
}

/**
 * Get featured timelines
 * Only returns public featured timelines, or unlisted/private featured timelines owned by currentUserId
 */
export function getFeaturedTimelines(limit: number = 6, currentUserId?: string): Timeline[] {
  const timelines = getTimelines();
  return timelines
    .filter(t => t.featured && isTimelineVisibleToUser(t, currentUserId))
    .slice(0, limit);
}

/**
 * Search timelines and users
 * Unified search across both data types
 * Only returns public timelines, or unlisted/private timelines owned by currentUserId
 */
export function searchTimelinesAndUsers(query: string, currentUserId?: string): SearchResults {
  if (!query || query.trim().length < 2) {
    return { timelines: [], users: [], hasMore: false };
  }

  const lowerQuery = query.toLowerCase().trim();
  const timelines = getTimelines();
  const users = getUsers();

  // Search timelines (filtered by visibility)
  const matchingTimelines = timelines.filter(t =>
    isTimelineVisibleToUser(t, currentUserId) &&
    (t.title.toLowerCase().includes(lowerQuery) ||
    t.description?.toLowerCase().includes(lowerQuery))
  );

  // Search users (SRS_DB.md compliant - v0.5.14: search by username)
  const matchingUsers = users.filter(u =>
    u.username.toLowerCase().includes(lowerQuery) ||
    u.email.toLowerCase().includes(lowerQuery)
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
