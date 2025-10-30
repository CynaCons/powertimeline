/**
 * Data Migration Utility: localStorage to Firestore
 * v0.5.0 - Firebase Backend Setup
 *
 * This utility helps migrate existing data from localStorage to Firestore.
 * It supports both one-time migration and ongoing sync modes.
 */

import type { AdminActivityLog } from '../types';
import { STORAGE_KEYS, getTimelines, getUsers } from '../lib/homePageStorage';
import {
  createTimeline,
  createUser,
  createActivityLog,
  getTimelines as getFirestoreTimelines,
  getUsers as getFirestoreUsers,
} from './firestore';

/**
 * Migration result containing statistics about the operation
 */
export interface MigrationResult {
  success: boolean;
  usersMigrated: number;
  timelinesMigrated: number;
  activityLogsMigrated: number;
  errors: string[];
  timestamp: string;
}

/**
 * Migration options
 */
export interface MigrationOptions {
  /**
   * If true, skip items that already exist in Firestore
   * If false, overwrite existing items
   */
  skipExisting?: boolean;

  /**
   * If true, clear localStorage after successful migration
   */
  clearLocalStorageAfterMigration?: boolean;

  /**
   * Progress callback for tracking migration progress
   */
  onProgress?: (message: string, current: number, total: number) => void;
}

/**
 * Check if data exists in localStorage
 */
export function hasLocalStorageData(): boolean {
  try {
    const users = localStorage.getItem(STORAGE_KEYS.USERS);
    const timelines = localStorage.getItem(STORAGE_KEYS.TIMELINES);

    return Boolean(users || timelines);
  } catch (error) {
    console.error('Error checking localStorage:', error);
    return false;
  }
}

/**
 * Get localStorage data statistics
 */
export function getLocalStorageStats(): {
  users: number;
  timelines: number;
  totalEvents: number;
} {
  try {
    const users = getUsers();
    const timelines = getTimelines();
    const totalEvents = timelines.reduce((sum, t) => sum + t.events.length, 0);

    return {
      users: users.length,
      timelines: timelines.length,
      totalEvents,
    };
  } catch (error) {
    console.error('Error getting localStorage stats:', error);
    return { users: 0, timelines: 0, totalEvents: 0 };
  }
}

/**
 * Migrate users from localStorage to Firestore
 */
async function migrateUsers(
  options: MigrationOptions = {}
): Promise<{ migrated: number; errors: string[] }> {
  const errors: string[] = [];
  let migrated = 0;

  try {
    const localUsers = getUsers();
    const firestoreUsers = options.skipExisting ? await getFirestoreUsers() : [];
    const existingUserIds = new Set(firestoreUsers.map(u => u.id));

    for (let i = 0; i < localUsers.length; i++) {
      const user = localUsers[i];

      try {
        if (options.skipExisting && existingUserIds.has(user.id)) {
          options.onProgress?.(
            `Skipping existing user: ${user.name}`,
            i + 1,
            localUsers.length
          );
          continue;
        }

        options.onProgress?.(
          `Migrating user: ${user.name}`,
          i + 1,
          localUsers.length
        );

        await createUser(user);
        migrated++;
      } catch (error) {
        const errorMsg = `Failed to migrate user ${user.id}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }
  } catch (error) {
    const errorMsg = `Fatal error during user migration: ${error}`;
    console.error(errorMsg);
    errors.push(errorMsg);
  }

  return { migrated, errors };
}

/**
 * Migrate timelines from localStorage to Firestore
 */
async function migrateTimelines(
  options: MigrationOptions = {}
): Promise<{ migrated: number; errors: string[] }> {
  const errors: string[] = [];
  let migrated = 0;

  try {
    const localTimelines = getTimelines();
    const firestoreTimelines = options.skipExisting ? await getFirestoreTimelines() : [];
    const existingTimelineIds = new Set(firestoreTimelines.map(t => t.id));

    for (let i = 0; i < localTimelines.length; i++) {
      const timeline = localTimelines[i];

      try {
        if (options.skipExisting && existingTimelineIds.has(timeline.id)) {
          options.onProgress?.(
            `Skipping existing timeline: ${timeline.title}`,
            i + 1,
            localTimelines.length
          );
          continue;
        }

        options.onProgress?.(
          `Migrating timeline: ${timeline.title}`,
          i + 1,
          localTimelines.length
        );

        // Create timeline without id, createdAt, updatedAt (Firestore service will set these)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, createdAt, updatedAt, ...timelineData } = timeline;
        await createTimeline(timelineData);
        migrated++;
      } catch (error) {
        const errorMsg = `Failed to migrate timeline ${timeline.id}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }
  } catch (error) {
    const errorMsg = `Fatal error during timeline migration: ${error}`;
    console.error(errorMsg);
    errors.push(errorMsg);
  }

  return { migrated, errors };
}

/**
 * Migrate activity logs from localStorage to Firestore
 */
async function migrateActivityLogs(
  options: MigrationOptions = {}
): Promise<{ migrated: number; errors: string[] }> {
  const errors: string[] = [];
  let migrated = 0;

  try {
    // Read activity logs from localStorage
    const storedLogs = localStorage.getItem('powertimeline_activity_logs');
    if (!storedLogs) {
      return { migrated: 0, errors: [] };
    }

    const localLogs = JSON.parse(storedLogs) as AdminActivityLog[];

    for (let i = 0; i < localLogs.length; i++) {
      const log = localLogs[i];

      try {
        options.onProgress?.(
          `Migrating activity log: ${log.action}`,
          i + 1,
          localLogs.length
        );

        // Create log without id and timestamp (Firestore service will set these)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, timestamp, ...logData } = log;
        await createActivityLog(logData);
        migrated++;
      } catch (error) {
        const errorMsg = `Failed to migrate activity log ${log.id}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      // No activity logs or invalid JSON - not a fatal error
      return { migrated: 0, errors: [] };
    }

    const errorMsg = `Fatal error during activity log migration: ${error}`;
    console.error(errorMsg);
    errors.push(errorMsg);
  }

  return { migrated, errors };
}

/**
 * Perform full migration from localStorage to Firestore
 *
 * This function:
 * 1. Migrates all users
 * 2. Migrates all timelines
 * 3. Migrates activity logs (if any)
 * 4. Optionally clears localStorage after successful migration
 *
 * @param options - Migration options
 * @returns Migration result with statistics and any errors
 */
export async function migrateLocalStorageToFirestore(
  options: MigrationOptions = {}
): Promise<MigrationResult> {
  const startTime = new Date().toISOString();
  const allErrors: string[] = [];

  try {
    // Step 1: Migrate users
    options.onProgress?.('Starting user migration...', 0, 3);
    const userResult = await migrateUsers(options);
    allErrors.push(...userResult.errors);

    // Step 2: Migrate timelines
    options.onProgress?.('Starting timeline migration...', 1, 3);
    const timelineResult = await migrateTimelines(options);
    allErrors.push(...timelineResult.errors);

    // Step 3: Migrate activity logs
    options.onProgress?.('Starting activity log migration...', 2, 3);
    const logResult = await migrateActivityLogs(options);
    allErrors.push(...logResult.errors);

    // Step 4: Clear localStorage if requested and migration was successful
    if (
      options.clearLocalStorageAfterMigration &&
      allErrors.length === 0
    ) {
      options.onProgress?.('Clearing localStorage...', 3, 3);
      localStorage.removeItem(STORAGE_KEYS.USERS);
      localStorage.removeItem(STORAGE_KEYS.TIMELINES);
      localStorage.removeItem('powertimeline_activity_logs');
      localStorage.setItem('powertimeline_migrated_to_firestore', 'true');
    }

    options.onProgress?.('Migration complete!', 3, 3);

    return {
      success: allErrors.length === 0,
      usersMigrated: userResult.migrated,
      timelinesMigrated: timelineResult.migrated,
      activityLogsMigrated: logResult.migrated,
      errors: allErrors,
      timestamp: startTime,
    };
  } catch (error) {
    const errorMsg = `Fatal error during migration: ${error}`;
    console.error(errorMsg);
    allErrors.push(errorMsg);

    return {
      success: false,
      usersMigrated: 0,
      timelinesMigrated: 0,
      activityLogsMigrated: 0,
      errors: allErrors,
      timestamp: startTime,
    };
  }
}

/**
 * Check if migration has already been performed
 */
export function hasMigrationBeenPerformed(): boolean {
  try {
    return localStorage.getItem('powertimeline_migrated_to_firestore') === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark migration as completed (without actually migrating)
 * Useful if user wants to start fresh with Firestore
 */
export function markMigrationAsComplete(): void {
  localStorage.setItem('powertimeline_migrated_to_firestore', 'true');
}

/**
 * Reset migration flag (for testing or re-migration)
 */
export function resetMigrationFlag(): void {
  localStorage.removeItem('powertimeline_migrated_to_firestore');
}

/**
 * Export localStorage data as JSON for backup
 */
export function exportLocalStorageAsJSON(): string {
  const users = getUsers();
  const timelines = getTimelines();
  const currentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  const activityLogs = localStorage.getItem('powertimeline_activity_logs');

  return JSON.stringify({
    version: '0.5.0',
    exported: new Date().toISOString(),
    data: {
      users,
      timelines,
      currentUser: currentUser ? JSON.parse(currentUser) : null,
      activityLogs: activityLogs ? JSON.parse(activityLogs) : [],
    },
  }, null, 2);
}
