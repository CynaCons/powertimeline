/**
 * Migration script: Move events from timeline documents to events subcollection
 * v0.5.0.1 - Event Persistence Optimization
 *
 * This script:
 * 1. Queries all existing timelines
 * 2. For each timeline with events:
 *    - Creates event documents in the events subcollection
 *    - Updates timeline to remove events array and add eventCount
 * 3. Logs progress and results
 */

import { db } from './firebase-node';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  collectionGroup,
} from 'firebase/firestore';
import type { Timeline, Event, EventDocument, TimelineMetadata } from '../src/types';

async function migrateEventsToSubcollection() {
  console.log('🔄 Migrating events from timeline documents to subcollections...\n');

  try {
    // Get all timelines using collection group
    const timelinesQuery = collectionGroup(db, 'timelines');
    const timelinesSnapshot = await getDocs(timelinesQuery);

    if (timelinesSnapshot.empty) {
      console.log('✨ No timelines found. Migration complete!');
      return;
    }

    console.log(`📦 Found ${timelinesSnapshot.size} timelines to process\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let totalEventsMigrated = 0;

    for (const timelineDoc of timelinesSnapshot.docs) {
      const timelineData = timelineDoc.data() as any;
      const timelineId = timelineData.id;
      const ownerId = timelineData.ownerId;
      const events = timelineData.events as Event[] | undefined;

      console.log(`\n  📅 Processing: ${timelineData.title} (ID: ${timelineId})`);
      console.log(`     Owner: ${ownerId}`);

      // Skip if no events or events already migrated (check if events array is empty/missing)
      if (!events || events.length === 0) {
        console.log(`     ⏭️  Skipped (no events or already migrated)`);
        skippedCount++;
        continue;
      }

      console.log(`     📝 Found ${events.length} events to migrate`);

      try {
        // Create events in subcollection
        for (let i = 0; i < events.length; i++) {
          const event = events[i];
          const eventRef = doc(
            db,
            'users',
            ownerId,
            'timelines',
            timelineId,
            'events',
            event.id
          );

          const now = new Date().toISOString();
          const eventDoc: EventDocument = {
            ...event,
            timelineId,
            createdAt: now,
            updatedAt: now,
            order: i,
          };

          await setDoc(eventRef, eventDoc);
        }

        console.log(`     ✅ Migrated ${events.length} events to subcollection`);

        // Update timeline document: remove events array, add eventCount
        const timelineRef = doc(db, 'users', ownerId, 'timelines', timelineId);

        // Create new timeline metadata without events
        const { events: _, ...timelineMetadata } = timelineData;
        const updatedMetadata: TimelineMetadata = {
          ...timelineMetadata,
          eventCount: events.length,
        };

        await setDoc(timelineRef, updatedMetadata);

        console.log(`     ✅ Updated timeline metadata (removed events array, added eventCount: ${events.length})`);

        migratedCount++;
        totalEventsMigrated += events.length;

      } catch (error) {
        console.error(`     ❌ Failed to migrate timeline ${timelineId}:`, error);
        errorCount++;
      }
    }

    console.log('\n✨ Migration Complete!');
    console.log(`   ✅ Successfully migrated: ${migratedCount} timelines`);
    console.log(`   📝 Total events migrated: ${totalEventsMigrated}`);
    console.log(`   ⏭️  Skipped (no events): ${skippedCount} timelines`);
    if (errorCount > 0) {
      console.log(`   ❌ Failed to migrate: ${errorCount} timelines`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
migrateEventsToSubcollection()
  .then(() => {
    console.log('\n🎉 Migration script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration script failed:', error);
    process.exit(1);
  });
