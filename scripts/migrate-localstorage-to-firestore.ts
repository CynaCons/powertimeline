/**
 * Migrate localStorage data to Firestore
 * This script should be run in the browser console where localStorage is accessible
 *
 * Usage:
 * 1. Open your app in browser: http://localhost:5173
 * 2. Open browser console (F12)
 * 3. Copy and paste this script
 * 4. Run: await migrateLocalStorageToFirestore()
 */

import { db } from './firebase-node';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import type { Timeline, User, AdminActivityLog } from '../src/types';

// This is a browser script - we'll create a simpler version
// For now, let me create a function that can be added to the app

export async function migrateLocalStorageToFirestore() {
  console.log('🔄 Starting migration from localStorage to Firestore...\n');

  try {
    // Get data from localStorage
    const timelinesData = localStorage.getItem('powertimeline_timelines');
    const usersData = localStorage.getItem('powertimeline_users');
    const currentUserData = localStorage.getItem('powertimeline_currentUser');

    if (!timelinesData) {
      console.log('ℹ️ No timelines found in localStorage');
      return { success: true, message: 'No data to migrate' };
    }

    const timelines: Timeline[] = JSON.parse(timelinesData);
    console.log(`📅 Found ${timelines.length} timeline(s) in localStorage`);

    // Migrate timelines
    let migratedCount = 0;
    for (const timeline of timelines) {
      try {
        // Check if timeline already exists in Firestore
        const existingDoc = await getDocs(collection(db, 'timelines'));
        const exists = existingDoc.docs.some(d => d.id === timeline.id);

        if (exists) {
          console.log(`⏭️  Skipping ${timeline.title} (already in Firestore)`);
          continue;
        }

        await setDoc(doc(db, 'timelines', timeline.id), timeline);
        console.log(`✅ Migrated: ${timeline.title}`);
        migratedCount++;
      } catch (error) {
        console.error(`❌ Failed to migrate ${timeline.title}:`, error);
      }
    }

    // Also migrate users if they exist
    if (usersData) {
      const users: User[] = JSON.parse(usersData);
      console.log(`\n👥 Found ${users.length} user(s) in localStorage`);

      for (const user of users) {
        try {
          const existingDoc = await getDocs(collection(db, 'users'));
          const exists = existingDoc.docs.some(d => d.id === user.id);

          if (exists) {
            console.log(`⏭️  Skipping user ${user.username} (already in Firestore)`);
            continue;
          }

          await setDoc(doc(db, 'users', user.id), user);
          console.log(`✅ Migrated user: ${user.username}`);
        } catch (error) {
          console.error(`❌ Failed to migrate user ${user.username}:`, error);
        }
      }
    }

    console.log(`\n✨ Migration complete! ${migratedCount} timeline(s) migrated.\n`);
    return { success: true, migratedCount };

  } catch (error) {
    console.error('❌ Migration failed:', error);
    return { success: false, error };
  }
}

// Auto-run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateLocalStorageToFirestore();
}
