/**
 * Migrate localStorage timelines to Firestore
 * This runs automatically when the app loads
 */

import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Timeline, User } from '../types';

const MIGRATION_FLAG_KEY = 'powertimeline_migration_completed';

export async function migrateLocalStorageToFirestore(): Promise<{
  success: boolean;
  migratedTimelines: number;
  migratedUsers: number;
  message: string;
}> {
  // Check if migration already completed
  const migrationCompleted = localStorage.getItem(MIGRATION_FLAG_KEY);
  if (migrationCompleted === 'true') {
    return {
      success: true,
      migratedTimelines: 0,
      migratedUsers: 0,
      message: 'Migration already completed',
    };
  }

  console.log('🔄 Checking for localStorage data to migrate...');

  try {
    let migratedTimelines = 0;
    let migratedUsers = 0;

    // Migrate timelines
    const timelinesData = localStorage.getItem('powertimeline_timelines');
    if (timelinesData) {
      const timelines: Timeline[] = JSON.parse(timelinesData);
      console.log(`📅 Found ${timelines.length} timeline(s) in localStorage`);

      for (const timeline of timelines) {
        try {
          // Check if already exists in Firestore
          const docRef = doc(db, 'timelines', timeline.id);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            console.log(`⏭️  Skipping ${timeline.title} (already in Firestore)`);
            continue;
          }

          // Migrate to Firestore
          await setDoc(docRef, timeline);
          console.log(`✅ Migrated: ${timeline.title}`);
          migratedTimelines++;
        } catch (error) {
          console.error(`❌ Failed to migrate ${timeline.title}:`, error);
        }
      }
    }

    // Migrate users
    const usersData = localStorage.getItem('powertimeline_users');
    if (usersData) {
      const users: User[] = JSON.parse(usersData);
      console.log(`👥 Found ${users.length} user(s) in localStorage`);

      for (const user of users) {
        try {
          // Check if already exists in Firestore
          const docRef = doc(db, 'users', user.id);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            console.log(`⏭️  Skipping user ${user.name} (already in Firestore)`);
            continue;
          }

          // Migrate to Firestore
          await setDoc(docRef, user);
          console.log(`✅ Migrated user: ${user.name}`);
          migratedUsers++;
        } catch (error) {
          console.error(`❌ Failed to migrate user ${user.name}:`, error);
        }
      }
    }

    // Mark migration as completed
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');

    const message = `Migration complete! ${migratedTimelines} timeline(s) and ${migratedUsers} user(s) migrated.`;
    console.log(`✨ ${message}`);

    return {
      success: true,
      migratedTimelines,
      migratedUsers,
      message,
    };

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      success: false,
      migratedTimelines: 0,
      migratedUsers: 0,
      message: error instanceof Error ? error.message : 'Migration failed',
    };
  }
}

/**
 * Reset migration flag (useful for testing)
 */
export function resetMigrationFlag() {
  localStorage.removeItem(MIGRATION_FLAG_KEY);
  console.log('🔄 Migration flag reset. Migration will run again on next page load.');
}
