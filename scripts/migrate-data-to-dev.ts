import { initializeApp as initSource, cert as certSource } from 'firebase-admin/app';
import { getFirestore as getSourceDb } from 'firebase-admin/firestore';
import serviceAccountSource from '../powertimeline-860f1-firebase-adminsdk-fbsvc-933b603f7d.json' assert { type: 'json' };

import { initializeApp as initDest, cert as certDest } from 'firebase-admin/app';
import { getFirestore as getDestDb } from 'firebase-admin/firestore';
import serviceAccountDest from '../powertimeline-dev-firebase-adminsdk-fbsvc-adcd3de895.json' assert { type: 'json' };

// Initialize source (860f1) and destination (dev) apps
const sourceApp = initSource({
  credential: certSource(serviceAccountSource as any),
  projectId: 'powertimeline-860f1'
}, 'source');

const destApp = initDest({
  credential: certDest(serviceAccountDest as any),
  projectId: 'powertimeline-dev'
}, 'dest');

const sourceDb = getSourceDb(sourceApp);
const destDb = getDestDb(destApp);

async function migrateData() {
  console.log('🚀 Starting data migration from powertimeline-860f1 to powertimeline-dev...\n');

  try {
    // Get all users from source
    const usersSnapshot = await sourceDb.collection('users').get();
    console.log(`Found ${usersSnapshot.size} users to migrate\n`);

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      console.log(`📝 Migrating user: ${userId} (${userData.name || 'no name'})`);

      // Create user in destination
      await destDb.collection('users').doc(userId).set(userData);

      // Get all timelines for this user
      const timelinesSnapshot = await sourceDb
        .collection('users')
        .doc(userId)
        .collection('timelines')
        .get();

      console.log(`  └─ Found ${timelinesSnapshot.size} timelines`);

      for (const timelineDoc of timelinesSnapshot.docs) {
        const timelineId = timelineDoc.id;
        const timelineData = timelineDoc.data();

        console.log(`    📊 Migrating timeline: ${timelineId} (${timelineData.title})`);

        // Create timeline in destination (excluding embedded events array)
        const { events: _events, ...timelineMetadata } = timelineData;
        await destDb
          .collection('users')
          .doc(userId)
          .collection('timelines')
          .doc(timelineId)
          .set(timelineMetadata);

        // Get all events for this timeline
        const eventsSnapshot = await sourceDb
          .collection('users')
          .doc(userId)
          .collection('timelines')
          .doc(timelineId)
          .collection('events')
          .get();

        console.log(`      └─ Found ${eventsSnapshot.size} events`);

        // Batch write events
        const batch = destDb.batch();
        let batchCount = 0;

        for (const eventDoc of eventsSnapshot.docs) {
          const eventId = eventDoc.id;
          const eventData = eventDoc.data();

          const destEventRef = destDb
            .collection('users')
            .doc(userId)
            .collection('timelines')
            .doc(timelineId)
            .collection('events')
            .doc(eventId);

          batch.set(destEventRef, eventData);
          batchCount++;

          // Firestore batch limit is 500
          if (batchCount >= 500) {
            await batch.commit();
            console.log(`        ✓ Committed batch of ${batchCount} events`);
            batchCount = 0;
          }
        }

        // Commit remaining events
        if (batchCount > 0) {
          await batch.commit();
          console.log(`        ✓ Committed final batch of ${batchCount} events`);
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateData();
