/**
 * Diagnostic script to investigate timeline data in Firestore
 * Run with: npx tsx scripts/diagnose-timelines.ts
 */

import { db } from './firebase-node';
import { collection, getDocs, query, collectionGroup } from 'firebase/firestore';

async function diagnoseTimelines() {
  console.log('🔍 Diagnosing Firestore timeline data...\n');

  try {
    // Check root timelines collection
    console.log('📁 Checking root "timelines" collection:');
    const rootTimelinesSnapshot = await getDocs(collection(db, 'timelines'));
    console.log(`   Found ${rootTimelinesSnapshot.size} documents\n`);

    if (!rootTimelinesSnapshot.empty) {
      console.log('   Root timeline IDs:');
      rootTimelinesSnapshot.docs.forEach(doc => {
        console.log(`   - ${doc.id}: "${doc.data().title}"`);
      });
      console.log();
    }

    // Check nested structure (users/{userId}/timelines)
    console.log('📁 Checking nested "users/{userId}/timelines" structure:');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`   Found ${usersSnapshot.size} users\n`);

    const timelinesByUser = new Map<string, Array<{id: string, title: string}>>();
    const allTimelineIds = new Set<string>();
    const duplicateIds = new Map<string, number>();

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const timelinesSnapshot = await getDocs(
        collection(db, 'users', userId, 'timelines')
      );

      if (timelinesSnapshot.size > 0) {
        const userTimelines: Array<{id: string, title: string}> = [];

        timelinesSnapshot.docs.forEach(doc => {
          const timelineId = doc.id;
          const title = doc.data().title || 'Untitled';

          userTimelines.push({ id: timelineId, title });

          // Track duplicates
          if (allTimelineIds.has(timelineId)) {
            duplicateIds.set(timelineId, (duplicateIds.get(timelineId) || 1) + 1);
          } else {
            allTimelineIds.add(timelineId);
          }
        });

        timelinesByUser.set(userId, userTimelines);
        console.log(`   User "${userId}": ${timelinesSnapshot.size} timelines`);
        userTimelines.forEach(t => {
          console.log(`      - ${t.id}: "${t.title}"`);
        });
        console.log();
      }
    }

    // Report duplicates
    if (duplicateIds.size > 0) {
      console.log('⚠️  DUPLICATE TIMELINE IDs DETECTED:\n');
      duplicateIds.forEach((count, id) => {
        console.log(`   ${id}: appears ${count + 1} times`);
      });
      console.log();
    } else {
      console.log('✅ No duplicate timeline IDs found\n');
    }

    // Analyze ID formats
    console.log('📊 Timeline ID Format Analysis:');
    const shortFormatIds: string[] = [];
    const longFormatIds: string[] = [];

    allTimelineIds.forEach(id => {
      // Short format: timeline-{slug} (e.g., timeline-rfk)
      // Long format: timeline-{slug}-{description} (e.g., timeline-rfk-1968-campaign)
      const parts = id.split('-');
      if (parts.length === 2) {
        shortFormatIds.push(id);
      } else if (parts.length > 2) {
        longFormatIds.push(id);
      }
    });

    console.log(`   Short format (timeline-slug): ${shortFormatIds.length} timelines`);
    if (shortFormatIds.length > 0 && shortFormatIds.length <= 10) {
      shortFormatIds.forEach(id => console.log(`      - ${id}`));
    }

    console.log(`   Long format (timeline-slug-description): ${longFormatIds.length} timelines`);
    if (longFormatIds.length > 0 && longFormatIds.length <= 10) {
      longFormatIds.forEach(id => console.log(`      - ${id}`));
    }

    console.log('\n✨ Diagnosis complete!');

  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
    throw error;
  }
}

// Run the diagnosis
diagnoseTimelines();
