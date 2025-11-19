/**
 * Migrate timelines from root collection to nested structure under users
 * From: timelines/{timelineId}
 * To:   users/{ownerId}/timelines/{timelineId}
 *
 * Run with: npx tsx scripts/migrate-to-nested-structure.ts
 */

import { db } from './firebase-node';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import type { Timeline } from '../src/types';

async function migrateTimelines() {
  console.log('🔄 Migrating timelines from root collection to nested structure...\n');

  try {
    // Get all timelines from the root collection
    const timelinesSnapshot = await getDocs(collection(db, 'timelines'));

    if (timelinesSnapshot.empty) {
      console.log('✨ No timelines found in root collection. Migration complete!');
      return;
    }

    console.log(`📦 Found ${timelinesSnapshot.size} timelines to migrate\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const timelineDoc of timelinesSnapshot.docs) {
      const timeline = timelineDoc.data() as Timeline;
      const timelineId = timelineDoc.id;

      try {
        console.log(`  📅 Migrating: ${timeline.title} (ID: ${timelineId})`);
        console.log(`     Owner: ${timeline.ownerId}`);

        // Create timeline in the new nested structure
        const newTimelineRef = doc(db, 'users', timeline.ownerId, 'timelines', timelineId);
        await setDoc(newTimelineRef, timeline);

        // Delete from the old root collection
        await deleteDoc(doc(db, 'timelines', timelineId));

        console.log(`     ✅ Migrated successfully\n`);
        successCount++;

      } catch (error) {
        console.error(`     ❌ Failed to migrate timeline ${timelineId}:`, error);
        errorCount++;
      }
    }

    console.log('✨ Migration Complete!');
    console.log(`   ✅ Successfully migrated: ${successCount} timelines`);
    if (errorCount > 0) {
      console.log(`   ❌ Failed to migrate: ${errorCount} timelines`);
    }
    console.log('');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
migrateTimelines();
