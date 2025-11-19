/**
 * Clean up old timelines from root collection
 * IMPORTANT: Only run this after verifying the nested structure has all your data!
 *
 * Run with: npx tsx scripts/cleanup-old-timelines.ts
 */

import { db } from './firebase-node';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

async function cleanupOldTimelines() {
  console.log('🧹 Cleaning up old root "timelines" collection...\n');

  try {
    // Get all timelines from the root collection
    const timelinesSnapshot = await getDocs(collection(db, 'timelines'));

    if (timelinesSnapshot.empty) {
      console.log('✨ No timelines found in root collection. Already clean!');
      return;
    }

    console.log(`⚠️  Found ${timelinesSnapshot.size} documents to delete:\n`);

    // List all documents first
    timelinesSnapshot.docs.forEach(doc => {
      console.log(`   - ${doc.id}: ${doc.data().title}`);
    });

    console.log(`\n🗑️  Deleting ${timelinesSnapshot.size} documents...\n`);

    let deletedCount = 0;
    for (const timelineDoc of timelinesSnapshot.docs) {
      try {
        await deleteDoc(doc(db, 'timelines', timelineDoc.id));
        console.log(`   ✅ Deleted: ${timelineDoc.data().title}`);
        deletedCount++;
      } catch (error) {
        console.error(`   ❌ Failed to delete ${timelineDoc.id}:`, error);
      }
    }

    console.log(`\n✨ Cleanup complete! Deleted ${deletedCount} documents from root collection.`);

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
}

// Run the cleanup
cleanupOldTimelines();
