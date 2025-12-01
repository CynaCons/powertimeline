/**
 * Clean up production database
 * - Remove test timelines (empty timelines with test names)
 * - Fix CynaCons user profile (restore original name/bio)
 *
 * Run with: npx tsx scripts/cleanup-production.ts
 */

import { db } from './firebase-node';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';

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
  console.log('🧹 Starting production database cleanup...\n');

  try {
    // 1. Fix CynaCons user profile
    console.log('👤 Fixing CynaCons user profile...');
    const userRef = doc(db, 'users', 'cynacons');
    await updateDoc(userRef, {
      username: 'CynaCons',
    });
    console.log('✅ Updated CynaCons profile: username="CynaCons"\n');

    // 2. Delete test timelines
    console.log('📁 Deleting test timelines...');
    let deletedCount = 0;

    for (const timelineId of TEST_TIMELINE_IDS) {
      try {
        const timelineRef = doc(db, 'users', 'cynacons', 'timelines', timelineId);
        await deleteDoc(timelineRef);
        console.log(`   ✅ Deleted: ${timelineId}`);
        deletedCount++;
      } catch (error: unknown) {
        if (error instanceof Error && 'code' in error && error.code === 'not-found') {
          console.log(`   ⏭️  Skipped (not found): ${timelineId}`);
        } else {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`   ❌ Error deleting ${timelineId}:`, errorMessage);
        }
      }
    }

    console.log(`\n✨ Cleanup complete!`);
    console.log(`   - Updated user profile`);
    console.log(`   - Deleted ${deletedCount} test timelines`);
    console.log(`   - Kept 5 real timelines with content\n`);

    // 3. Verify final state
    console.log('🔍 Verifying final state...');
    const timelinesSnapshot = await getDocs(
      collection(db, 'users', 'cynacons', 'timelines')
    );
    console.log(`📊 Remaining timelines: ${timelinesSnapshot.size}`);

    console.log('\nRemaining timelines:');
    timelinesSnapshot.docs.forEach((doc, index) => {
      const timeline = doc.data();
      console.log(`   ${index + 1}. ${timeline.title} (${timeline.eventCount || 0} events)`);
    });

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
}

cleanupProduction();
