/**
 * Clean up [Test] timelines from production Firestore
 * Deletes all timelines with titles starting with "[Test]" and their events
 *
 * Run with:
 *   npx tsx scripts/cleanup-test-timelines.ts --dry-run    # Preview only
 *   npx tsx scripts/cleanup-test-timelines.ts --confirm    # Actually delete
 *   npx tsx scripts/cleanup-test-timelines.ts --confirm --delete-user  # Also delete test user
 *
 * Safety features:
 * - Dry-run mode by default (no deletions)
 * - Requires explicit --confirm flag for actual deletion
 * - Shows detailed preview of what will be deleted
 * - Batch deletion with progress tracking
 * - Error handling for each deletion
 */

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import * as readline from 'readline';

// Parse command-line arguments
const isDryRun = !process.argv.includes('--confirm');
const deleteTestUser = process.argv.includes('--delete-user');

const prodKeyPath = resolve(
  process.cwd(),
  'powertimeline-860f1-firebase-adminsdk-fbsvc-933b603f7d.json'
);

interface TimelineInfo {
  userId: string;
  timelineId: string;
  title: string;
  eventCount: number;
}

async function promptConfirmation(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function findTestTimelines(db: admin.firestore.Firestore): Promise<TimelineInfo[]> {
  console.log('Scanning all users for [Test] timelines...\n');

  const testTimelines: TimelineInfo[] = [];

  // Get all users
  const usersSnapshot = await db.collection('users').get();
  console.log(`   Found ${usersSnapshot.size} users to scan\n`);

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;

    // Get all timelines for this user
    const timelinesSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('timelines')
      .get();

    for (const timelineDoc of timelinesSnapshot.docs) {
      const timelineData = timelineDoc.data();
      const title = timelineData.title || '';

      // Check if title starts with [Test]
      if (title.startsWith('[Test]')) {
        // Count events in this timeline
        const eventsSnapshot = await db
          .collection('users')
          .doc(userId)
          .collection('timelines')
          .doc(timelineDoc.id)
          .collection('events')
          .count()
          .get();

        testTimelines.push({
          userId,
          timelineId: timelineDoc.id,
          title,
          eventCount: eventsSnapshot.data().count,
        });
      }
    }
  }

  return testTimelines;
}

async function deleteTimeline(
  db: admin.firestore.Firestore,
  timeline: TimelineInfo
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId, timelineId } = timeline;
    const timelinePath = `users/${userId}/timelines/${timelineId}`;

    // Delete all events first (in batches of 450)
    const eventsRef = db.collection(`${timelinePath}/events`);
    const eventsSnapshot = await eventsRef.get();

    if (!eventsSnapshot.empty) {
      const batchSize = 450;
      const events = eventsSnapshot.docs;

      for (let i = 0; i < events.length; i += batchSize) {
        const batch = db.batch();
        const batchEvents = events.slice(i, i + batchSize);

        for (const eventDoc of batchEvents) {
          batch.delete(eventDoc.ref);
        }

        await batch.commit();
      }
    }

    // Delete the timeline document
    await db.doc(timelinePath).delete();

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function deleteTestUserAccount(
  db: admin.firestore.Firestore
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.doc('users/test-user').delete();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  console.log('\n=== Test Timeline Cleanup Tool ===\n');

  if (!existsSync(prodKeyPath)) {
    console.error(`ERROR: Production service account key not found: ${prodKeyPath}`);
    console.error('   Cannot proceed without production credentials.');
    process.exit(1);
  }

  // Initialize Firebase Admin
  const serviceAccount = JSON.parse(readFileSync(prodKeyPath, 'utf8'));
  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  const db = app.firestore();

  try {
    // Step 1: Find all test timelines
    const testTimelines = await findTestTimelines(db);

    if (testTimelines.length === 0) {
      console.log('No [Test] timelines found. Database is clean!\n');
      process.exit(0);
    }

    // Step 2: Display findings
    console.log(`Found ${testTimelines.length} [Test] timeline(s):\n`);

    let totalEvents = 0;
    const userGroups = new Map<string, TimelineInfo[]>();

    testTimelines.forEach((timeline) => {
      totalEvents += timeline.eventCount;

      if (!userGroups.has(timeline.userId)) {
        userGroups.set(timeline.userId, []);
      }
      userGroups.get(timeline.userId)!.push(timeline);
    });

    // Display by user
    for (const [userId, timelines] of userGroups) {
      console.log(`   User: ${userId}`);
      timelines.forEach((tl, idx) => {
        console.log(`      ${idx + 1}. ${tl.title}`);
        console.log(`         ID: ${tl.timelineId}`);
        console.log(`         Events: ${tl.eventCount}`);
      });
      console.log('');
    }

    console.log(`   Total events to delete: ${totalEvents}\n`);

    // Step 3: Handle test user deletion option
    if (deleteTestUser) {
      const testUserDoc = await db.doc('users/test-user').get();
      if (testUserDoc.exists) {
        console.log('Will also delete test user account: test-user\n');
      } else {
        console.log('Test user account (test-user) not found\n');
      }
    }

    // Step 4: Dry-run mode check
    if (isDryRun) {
      console.log('DRY-RUN MODE - No actual deletions will occur\n');
      console.log('To actually delete these timelines, run:');
      console.log('   npx tsx scripts/cleanup-test-timelines.ts --confirm\n');

      if (!deleteTestUser) {
        console.log('To also delete the test user account, add:');
        console.log('   npx tsx scripts/cleanup-test-timelines.ts --confirm --delete-user\n');
      }

      process.exit(0);
    }

    // Step 5: Confirmation prompt
    console.log('WARNING: You are about to DELETE data from PRODUCTION!\n');
    console.log(`   - ${testTimelines.length} timelines will be deleted`);
    console.log(`   - ${totalEvents} events will be deleted`);
    if (deleteTestUser) {
      console.log(`   - test-user account will be deleted`);
    }
    console.log('');

    const confirmed = await promptConfirmation('Are you absolutely sure?');

    if (!confirmed) {
      console.log('\nDeletion cancelled by user.\n');
      process.exit(0);
    }

    // Step 6: Perform deletions
    console.log('\nDeleting timelines...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const timeline of testTimelines) {
      process.stdout.write(`   Deleting: ${timeline.title}...`);

      const result = await deleteTimeline(db, timeline);

      if (result.success) {
        console.log(' OK');
        successCount++;
      } else {
        console.log(` ERROR: ${result.error}`);
        errorCount++;
      }
    }

    // Step 7: Delete test user if requested
    if (deleteTestUser) {
      console.log('\nDeleting test user account...\n');

      const result = await deleteTestUserAccount(db);

      if (result.success) {
        console.log('   Test user account deleted');
      } else {
        console.log(`   Failed to delete test user: ${result.error}`);
      }
    }

    // Step 8: Summary
    console.log('\nCleanup complete!\n');
    console.log(`   Successfully deleted: ${successCount} timelines`);
    if (errorCount > 0) {
      console.log(`   Failed: ${errorCount} timelines`);
    }
    console.log(`   Total events deleted: ${totalEvents}\n`);

  } catch (error) {
    console.error('\nCleanup failed:', error);
    throw error;
  } finally {
    await app.delete();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
