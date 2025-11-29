/**
 * Create a test user based on cynako@gmail.com account
 * Copies all timelines with "test-" prefix
 *
 * Run with: npx tsx scripts/create-test-user.ts [--prod|--dev|--both]
 *
 * Default: runs on dev database
 * --prod: runs on production database
 * --both: runs on both databases
 */

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Source user: cynako@gmail.com (different IDs in prod vs dev)
const SOURCE_USER_ID_PROD = 'R0rT7M1Lo1Ocomg4UeffEJ1EpvG2';
const SOURCE_USER_ID_DEV = 'HL3gR4MbXKe4gPc4vUwksaoKEn93';

// Test user ID
const TEST_USER_ID = 'test-user';

const runProd = process.argv.includes('--prod') || process.argv.includes('--both');
const runDev = process.argv.includes('--dev') || process.argv.includes('--both') || (!process.argv.includes('--prod'));

function getSourceUserId(envName: string): string {
  return envName === 'PRODUCTION' ? SOURCE_USER_ID_PROD : SOURCE_USER_ID_DEV;
}

const prodKeyPath = resolve(process.cwd(), 'powertimeline-860f1-firebase-adminsdk-fbsvc-933b603f7d.json');
const devKeyPath = resolve(process.cwd(), 'powertimeline-dev-firebase-adminsdk-fbsvc-adcd3de895.json');

async function createTestUserInDb(keyPath: string, envName: string) {
  if (!existsSync(keyPath)) {
    console.error(`Service account key not found: ${keyPath}`);
    return;
  }

  const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));

  // Create unique app name for each environment
  const appName = `app-${envName}-${Date.now()}`;
  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  }, appName);

  const db = app.firestore();
  const sourceUserId = getSourceUserId(envName);

  console.log(`\n Creating test user in ${envName} database...\n`);
  console.log(`   Source user ID: ${sourceUserId}`);

  try {
    // 1. Get source user document
    const sourceUserDoc = await db.doc(`users/${sourceUserId}`).get();

    if (!sourceUserDoc.exists) {
      console.log(`   Source user not found in ${envName}. Skipping...`);
      return;
    }

    const sourceUserData = sourceUserDoc.data()!;
    console.log(`   Found source user: ${sourceUserData.name || sourceUserData.email}`);

    // 2. Create test user document
    const testUserData = {
      ...sourceUserData,
      id: TEST_USER_ID,
      email: 'test@powertimeline.app',
      name: 'Test User',
      role: 'user', // Not admin for test user
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.doc(`users/${TEST_USER_ID}`).set(testUserData);
    console.log(`   Created test user document`);

    // 3. Get all timelines from source user
    const timelinesSnapshot = await db.collection(`users/${sourceUserId}/timelines`).get();

    if (timelinesSnapshot.empty) {
      console.log(`   No timelines found for source user`);
      return;
    }

    console.log(`   Found ${timelinesSnapshot.size} timelines to copy\n`);

    let totalEvents = 0;

    // 4. Copy each timeline with "test-" prefix
    for (const timelineDoc of timelinesSnapshot.docs) {
      const timelineData = timelineDoc.data();
      const originalId = timelineDoc.id;
      const newId = `test-${originalId}`;
      const newTitle = `[Test] ${timelineData.title}`;

      console.log(`   Copying timeline: ${timelineData.title}...`);

      // Create new timeline document
      const newTimelinePath = `users/${TEST_USER_ID}/timelines/${newId}`;
      await db.doc(newTimelinePath).set({
        ...timelineData,
        title: newTitle,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Copy all events
      const eventsSnapshot = await db.collection(`users/${sourceUserId}/timelines/${originalId}/events`).get();

      if (!eventsSnapshot.empty) {
        // Batch write events (max 500 per batch)
        const batchSize = 450;
        const events = eventsSnapshot.docs;

        for (let i = 0; i < events.length; i += batchSize) {
          const batch = db.batch();
          const batchEvents = events.slice(i, i + batchSize);

          for (const eventDoc of batchEvents) {
            const eventData = eventDoc.data();
            const newEventRef = db.doc(`${newTimelinePath}/events/${eventDoc.id}`);
            batch.set(newEventRef, eventData);
          }

          await batch.commit();
        }

        totalEvents += events.length;
        console.log(`      -> Copied ${events.length} events`);
      }
    }

    console.log(`\n   Test user created successfully in ${envName}!`);
    console.log(`   - User ID: ${TEST_USER_ID}`);
    console.log(`   - Timelines: ${timelinesSnapshot.size}`);
    console.log(`   - Total events: ${totalEvents}\n`);

  } catch (error) {
    console.error(`Error in ${envName}:`, error);
  } finally {
    await app.delete();
  }
}

async function main() {
  console.log('\n=== Creating Test User ===\n');

  if (runDev) {
    await createTestUserInDb(devKeyPath, 'DEVELOPMENT');
  }

  if (runProd) {
    await createTestUserInDb(prodKeyPath, 'PRODUCTION');
  }

  console.log('\n=== Done ===\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
