/**
 * Migrate a timeline from dev to production Firestore
 * Usage: node scripts/migrate-timeline.mjs <timeline-id> [--dry-run]
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Load credentials
const devCreds = JSON.parse(readFileSync(join(rootDir, 'powertimeline-dev-firebase-adminsdk-fbsvc-adcd3de895.json'), 'utf8'));
const prodCreds = JSON.parse(readFileSync(join(rootDir, 'powertimeline-860f1-firebase-adminsdk-fbsvc-933b603f7d.json'), 'utf8'));

// Initialize apps
const devApp = initializeApp({ credential: cert(devCreds) }, 'dev');
const prodApp = initializeApp({ credential: cert(prodCreds) }, 'prod');

const devDb = getFirestore(devApp);
const prodDb = getFirestore(prodApp);

async function migrateTimeline(timelineId, targetOwnerId = null, dryRun = false) {
  console.log(`\n🔍 Looking for timeline: ${timelineId}`);
  if (targetOwnerId) console.log(`   Target owner: ${targetOwnerId}`);
  console.log(dryRun ? '   (DRY RUN - no changes will be made)\n' : '\n');

  // Find the timeline in dev (search all users)
  const usersSnapshot = await devDb.collection('users').get();

  let sourceTimeline = null;
  let sourceOwnerId = null;
  let sourceEvents = [];

  for (const userDoc of usersSnapshot.docs) {
    const timelineRef = devDb.collection('users').doc(userDoc.id).collection('timelines').doc(timelineId);
    const timelineDoc = await timelineRef.get();

    if (timelineDoc.exists) {
      sourceTimeline = timelineDoc.data();
      sourceOwnerId = userDoc.id;

      // Get events subcollection
      const eventsSnapshot = await timelineRef.collection('events').get();
      sourceEvents = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      console.log(`✅ Found timeline in dev:`);
      console.log(`   Owner: ${sourceOwnerId}`);
      console.log(`   Title: ${sourceTimeline.title}`);
      console.log(`   Events: ${sourceEvents.length}`);
      break;
    }
  }

  if (!sourceTimeline) {
    console.error(`❌ Timeline ${timelineId} not found in dev Firestore`);
    process.exit(1);
  }

  // Use target owner if specified, otherwise use source owner
  const destOwnerId = targetOwnerId || sourceOwnerId;

  // Check if timeline exists in production
  const prodTimelineRef = prodDb.collection('users').doc(destOwnerId).collection('timelines').doc(timelineId);
  const prodTimelineDoc = await prodTimelineRef.get();

  if (prodTimelineDoc.exists) {
    const prodEvents = await prodTimelineRef.collection('events').get();
    console.log(`\n⚠️  Timeline already exists in production with ${prodEvents.size} events`);
    console.log(`   Will REPLACE with dev version (${sourceEvents.length} events)`);
  } else {
    console.log(`\n📝 Timeline does not exist in production, will create it`);
  }

  if (dryRun) {
    console.log('\n🏃 DRY RUN complete. Run without --dry-run to apply changes.');
    return;
  }

  // Write to production
  console.log('\n📤 Writing to production...');
  console.log(`   Destination: /users/${destOwnerId}/timelines/${timelineId}`);

  // 1. Write timeline document (update ownerId if different)
  const timelineData = { ...sourceTimeline };
  if (targetOwnerId) {
    timelineData.ownerId = targetOwnerId;
  }
  await prodTimelineRef.set(timelineData);
  console.log('   ✓ Timeline document written');

  // 2. Delete existing events in production (if any)
  const existingEvents = await prodTimelineRef.collection('events').get();
  if (existingEvents.size > 0) {
    const batch = prodDb.batch();
    existingEvents.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log(`   ✓ Deleted ${existingEvents.size} existing events`);
  }

  // 3. Write events in batches
  const BATCH_SIZE = 400;
  for (let i = 0; i < sourceEvents.length; i += BATCH_SIZE) {
    const batch = prodDb.batch();
    const chunk = sourceEvents.slice(i, i + BATCH_SIZE);

    for (const event of chunk) {
      const { id, ...eventData } = event;
      const eventRef = prodTimelineRef.collection('events').doc(id);
      batch.set(eventRef, eventData);
    }

    await batch.commit();
    console.log(`   ✓ Written events ${i + 1} to ${Math.min(i + BATCH_SIZE, sourceEvents.length)}`);
  }

  console.log(`\n✅ Migration complete!`);
  console.log(`   Timeline: ${sourceTimeline.title}`);
  console.log(`   Events: ${sourceEvents.length}`);
  console.log(`   Production URL: https://powertimeline.com/timeline/${timelineId}`);
}

// Parse args
const args = process.argv.slice(2);
const positionalArgs = args.filter(arg => !arg.startsWith('--'));
const timelineId = positionalArgs[0];
const targetOwnerId = positionalArgs[1] || null;
const dryRun = args.includes('--dry-run');

if (!timelineId) {
  console.log('Usage: node scripts/migrate-timeline.mjs <timeline-id> [target-owner-id] [--dry-run]');
  console.log('\nTo find timeline IDs, check the URL when viewing a timeline.');
  console.log('If target-owner-id is provided, the timeline will be owned by that user in production.');
  process.exit(1);
}

migrateTimeline(timelineId, targetOwnerId, dryRun)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
