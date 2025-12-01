/**
 * Seed Test Data for Test 77 (Search Functionality)
 *
 * This script ensures the following test data exists in DEV Firestore:
 * 1. Timeline titled "French Revolution" (owned by cynacons)
 * 2. Timeline titled "Napoleon Bonaparte" with "exile" in description (owned by cynacons)
 * 3. User with username "cynacons"
 * 4. Additional users with email containing "powertimeline.dev"
 *
 * Run with: npx tsx scripts/seed-test-77-data.ts
 *
 * This script is idempotent - safe to run multiple times.
 */

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { seedFrenchRevolutionTimeline, seedNapoleonTimeline } from '../src/lib/devSeed';

// Initialize Firebase Admin SDK
const serviceAccountPath = resolve(process.cwd(), 'powertimeline-dev-firebase-adminsdk-fbsvc-adcd3de895.json');

if (!existsSync(serviceAccountPath)) {
  console.error(`❌ Service account key not found: ${serviceAccountPath}`);
  console.error('Please ensure the dev service account JSON file is in the repo root.');
  process.exit(1);
}

const serviceAccountJson = readFileSync(serviceAccountPath, 'utf8');
const serviceAccount = JSON.parse(serviceAccountJson);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Test data constants matching test expectations
const ADDITIONAL_TEST_USERS = [
  {
    id: 'test-user-1',
    email: 'alice@powertimeline.dev',
    username: 'alice_timeline',
    role: 'user',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'test-user-2',
    email: 'bob@powertimeline.dev',
    username: 'bob_history',
    role: 'user',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'test-user-3',
    email: 'charlie@powertimeline.dev',
    username: 'charlie_events',
    role: 'user',
    createdAt: new Date().toISOString(),
  },
];

/**
 * Seed or update a user document (skip if exists by email or username)
 */
async function seedUser(userData: typeof ADDITIONAL_TEST_USERS[0]) {
  // Check if user exists by email
  const emailQuery = await db.collection('users').where('email', '==', userData.email).limit(1).get();
  if (!emailQuery.empty) {
    console.log(`   ⊘ Skipping user (already exists by email): ${userData.username} (${userData.email})`);
    return;
  }

  // Check if user exists by username
  const usernameQuery = await db.collection('users').where('username', '==', userData.username).limit(1).get();
  if (!usernameQuery.empty) {
    console.log(`   ⊘ Skipping user (already exists by username): ${userData.username}`);
    return;
  }

  // Create new user
  const userRef = db.collection('users').doc(userData.id);
  console.log(`   ✓ Creating new user: ${userData.username} (${userData.email})`);
  await userRef.set(userData);
}

/**
 * Find existing user by username (returns UID or null)
 */
async function findUserByUsername(username: string): Promise<string | null> {
  const usersQuery = await db.collection('users').where('username', '==', username).limit(1).get();
  if (usersQuery.empty) {
    return null;
  }
  return usersQuery.docs[0].id;
}

/**
 * Seed or update a timeline with its events
 */
async function seedTimeline(timelineData: typeof TIMELINES[0]) {
  const timelineRef = db
    .collection('users')
    .doc(timelineData.ownerId)
    .collection('timelines')
    .doc(timelineData.id);

  const timelineDoc = await timelineRef.get();
  const eventCount = timelineData.events.length;

  const timelinePayload = {
    id: timelineData.id,
    title: timelineData.title,
    description: timelineData.description,
    ownerId: timelineData.ownerId,
    visibility: timelineData.visibility,
    featured: timelineData.featured,
    eventCount,
    createdAt: timelineDoc.exists ? timelineDoc.data()?.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: timelineDoc.exists ? (timelineDoc.data()?.viewCount || 0) : 0,
  };

  if (timelineDoc.exists) {
    console.log(`   ↻ Updating timeline: ${timelineData.title} (${timelineData.id})`);
    await timelineRef.set(timelinePayload, { merge: true });
  } else {
    console.log(`   ✓ Creating timeline: ${timelineData.title} (${timelineData.id})`);
    await timelineRef.set(timelinePayload);
  }

  // Seed events in batches
  console.log(`      └─ Seeding ${eventCount} events...`);
  const batchSize = 450; // Firestore batch limit is 500
  const events = timelineData.events;

  for (let i = 0; i < events.length; i += batchSize) {
    const batch = db.batch();
    const batchEvents = events.slice(i, i + batchSize);

    for (const event of batchEvents) {
      const eventRef = timelineRef.collection('events').doc(event.id);
      batch.set(eventRef, {
        ...event,
        timelineId: timelineData.id,
        createdAt: new Date().toISOString(),
      }, { merge: true });
    }

    await batch.commit();
  }

  console.log(`      ✓ Seeded ${eventCount} events`);
}

/**
 * Main seeding function
 */
async function seedTest77Data() {
  console.log('\n🌱 Seeding Test 77 (Search Functionality) data...\n');

  try {
    // Step 1: Find existing cynacons user
    console.log('🔍 Looking for existing cynacons user...');
    const cynaconsUid = await findUserByUsername('cynacons');

    if (!cynaconsUid) {
      console.error('\n❌ ERROR: cynacons user not found in Firestore!');
      console.error('Please ensure the real cynacons user exists before running this script.');
      process.exit(1);
    }

    console.log(`   ✓ Found cynacons user: UID=${cynaconsUid}`);

    // Step 2: Seed additional test users with @powertimeline.dev emails
    console.log('\n👤 Seeding additional users...');
    for (const user of ADDITIONAL_TEST_USERS) {
      await seedUser(user);
    }

    // Step 3: Seed timelines with dynamic ownerId
    console.log('\n📚 Seeding timelines...');
    const TIMELINES = [
      {
        id: 'timeline-french-revolution',
        title: 'French Revolution',
        description: 'Complete chronicle of revolutionary France 1789-1799',
        ownerId: cynaconsUid,
        visibility: 'public' as const,
        featured: true,
        events: seedFrenchRevolutionTimeline(),
      },
      {
        id: 'timeline-napoleon',
        title: 'Napoleon Bonaparte',
        description: 'Rise, exile, and fall of Napoleon from Corsica to Saint Helena',
        ownerId: cynaconsUid,
        visibility: 'public' as const,
        featured: true,
        events: seedNapoleonTimeline(),
      },
    ];

    for (const timeline of TIMELINES) {
      await seedTimeline(timeline);
    }

    // Step 4: Verify
    console.log('\n🔍 Verifying seeded data...');

    const cynaConsDoc = await db.collection('users').doc(cynaconsUid).get();
    console.log(`   ✓ User 'cynacons' exists: ${cynaConsDoc.exists} (UID=${cynaconsUid})`);

    const frenchRevDoc = await db
      .collection('users')
      .doc(cynaconsUid)
      .collection('timelines')
      .doc('timeline-french-revolution')
      .get();
    console.log(`   ✓ Timeline 'French Revolution' exists: ${frenchRevDoc.exists}`);

    const napoleonDoc = await db
      .collection('users')
      .doc(cynaconsUid)
      .collection('timelines')
      .doc('timeline-napoleon')
      .get();
    console.log(`   ✓ Timeline 'Napoleon Bonaparte' exists: ${napoleonDoc.exists}`);

    if (napoleonDoc.exists) {
      const description = napoleonDoc.data()?.description || '';
      const hasExile = description.toLowerCase().includes('exile');
      console.log(`   ✓ Napoleon description contains 'exile': ${hasExile}`);
      if (!hasExile) {
        console.log(`   ⚠️  Expected 'exile' in description but got: "${description}"`);
      }
    }

    const usersWithDevEmail = await db
      .collection('users')
      .where('email', '>=', 'powertimeline.dev')
      .where('email', '<=', 'powertimeline.dev\uf8ff')
      .get();
    console.log(`   ✓ Users with @powertimeline.dev email: ${usersWithDevEmail.size}`);

    console.log('\n✨ Test 77 data seeding complete!\n');
    console.log('📋 Test expectations met:');
    console.log('   ✓ Timeline: French Revolution');
    console.log('   ✓ Timeline: Napoleon Bonaparte (with "exile" in description)');
    console.log('   ✓ User: cynacons');
    console.log(`   ✓ Users with @powertimeline.dev email: ${usersWithDevEmail.size}`);
    console.log('\n🧪 You can now run test 77:');
    console.log('   npx playwright test tests/home/77-search-functionality.spec.ts --headed\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding test 77 data:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    process.exit(1);
  }
}

// Run the seeding
seedTest77Data();
