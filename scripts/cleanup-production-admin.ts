/**
 * Clean up production database using Firebase Admin SDK
 * - Remove test timelines (empty timelines with test names)
 * - Bypasses Firestore security rules using service account
 *
 * Run with: npx tsx scripts/cleanup-production-admin.ts
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load service account key
const serviceAccount = JSON.parse(
  readFileSync(
    resolve(process.cwd(), 'powertimeline-860f1-firebase-adminsdk-fbsvc-933b603f7d.json'),
    'utf8'
  )
);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Test timeline IDs to delete (all the test pollution)
const TEST_TIMELINE_IDS = [
  'timeline-badge-position-test',
  'timeline-cross-section-test',
  'timeline-event-deletion-persistence-test',
  'timeline-event-edit-persistence-test',
  'timeline-event-persistence-test-timeline',
  'timeline-multiple-events-persistence-test',
  'timeline-my-first-timeline',
  'timeline-napoleon-s-rise-fall-1799-1815',
  'timeline-public-timeline-test',
  'timeline-revolution-francaise',
  'timeline-styling-test-timeline',
  'timeline-test-timeline-for-events',
  'timeline-visibility-test-timeline',
  'timeline-world-war-ii-events',
];

async function cleanupProduction() {
  console.log('🧹 Starting production database cleanup (Admin SDK)...\n');

  try {
    // Delete test timelines
    console.log('📁 Deleting test timelines...');
    let deletedCount = 0;
    let skippedCount = 0;

    for (const timelineId of TEST_TIMELINE_IDS) {
      try {
        const timelineRef = db.doc(`users/cynacons/timelines/${timelineId}`);
        const doc = await timelineRef.get();

        if (!doc.exists) {
          console.log(`   ⏭️  Skipped (not found): ${timelineId}`);
          skippedCount++;
          continue;
        }

        await timelineRef.delete();
        console.log(`   ✅ Deleted: ${timelineId}`);
        deletedCount++;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`   ❌ Error deleting ${timelineId}:`, errorMessage);
      }
    }

    console.log(`\n✨ Cleanup complete!`);
    console.log(`   - Deleted ${deletedCount} test timelines`);
    console.log(`   - Skipped ${skippedCount} (not found)`);
    console.log(`   - Kept 5 real timelines with content\n`);

    // Verify final state
    console.log('🔍 Verifying final state...');
    const timelinesSnapshot = await db
      .collection('users/cynacons/timelines')
      .get();
    console.log(`📊 Remaining timelines: ${timelinesSnapshot.size}`);

    console.log('\nRemaining timelines:');
    timelinesSnapshot.docs.forEach((doc, index) => {
      const timeline = doc.data();
      console.log(`   ${index + 1}. ${timeline.title} (${timeline.eventCount || 0} events)`);
    });

    // Close admin app
    await admin.app().delete();
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
}

cleanupProduction();
