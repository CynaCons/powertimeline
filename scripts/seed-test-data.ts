/**
 * Seed Test Data to Firestore
 * Populates Firestore with users and timelines needed for E2E tests
 *
 * Run with: npx tsx scripts/seed-test-data.ts
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { seedRFKTimeline, seedJFKTimeline, seedFrenchRevolutionTimeline, seedNapoleonTimeline, seedDeGaulleTimeline } from '../src/lib/devSeed';

// Initialize Firebase Admin SDK
const serviceAccountPath = resolve(process.cwd(), 'powertimeline-dev-firebase-adminsdk-fbsvc-adcd3de895.json');
const serviceAccountJson = readFileSync(serviceAccountPath, 'utf8');
const serviceAccount = JSON.parse(serviceAccountJson);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// E2E Test user (already exists in Firebase Auth)
const TEST_USER = {
  uid: 'iTMZ9n0IuzUSbhWfCaR86WsB2AC3',
  email: 'test@powertimeline.com',
  username: 'E2E Test User',
  role: 'user',
};

// Cynacons user (sample timeline owner)
const CYNACONS_USER = {
  id: 'cynacons',
  email: 'cynacons@powertimeline.dev',
  username: 'CynaCons',
  role: 'admin',
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
};

async function seedTestData() {
  console.log('🌱 Seeding test data to Firestore...\n');

  try {
    // Step 1: Create cynacons user
    console.log('👤 Creating users...');
    await db.collection('users').doc(CYNACONS_USER.id).set(CYNACONS_USER);
    console.log('   ✅ Created user: CynaCons (cynacons)');

    // Create E2E test user
    await db.collection('users').doc(TEST_USER.uid).set({
      id: TEST_USER.uid,
      email: TEST_USER.email,
      username: TEST_USER.username,
      role: TEST_USER.role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('   ✅ Created user: E2E Test User');

    // Step 2: Create cynacons timelines with events
    console.log('\n📚 Creating cynacons timelines...');

    const timelinesData = [
      {
        id: 'timeline-french-revolution',
        title: 'French Revolution',
        description: 'Complete chronicle of revolutionary France 1789-1799',
        events: seedFrenchRevolutionTimeline(),
      },
      {
        id: 'timeline-napoleon',
        title: 'Napoleon Bonaparte',
        description: 'Rise, exile, and fall of Napoleon from Corsica to Saint Helena',
        events: seedNapoleonTimeline(),
      },
      {
        id: 'timeline-charles-de-gaulle',
        title: 'Charles de Gaulle',
        description: 'From Free France to Fifth Republic',
        events: seedDeGaulleTimeline(),
      },
      {
        id: 'timeline-rfk',
        title: 'RFK Timeline',
        description: "Robert F. Kennedy's political career and legacy",
        events: seedRFKTimeline(),
      },
      {
        id: 'timeline-jfk-presidency-1961-1963',
        title: 'JFK Presidency 1961-1963',
        description: "Key events during John F. Kennedy's presidency",
        events: seedJFKTimeline(),
      },
    ];

    for (const timelineData of timelinesData) {
      const { id, title, description, events } = timelineData;

      // Create timeline document (without embedded events array)
      const timelineDoc = {
        id,
        title,
        description,
        ownerId: 'cynacons',
        visibility: 'public',
        eventCount: events.length,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        viewCount: 0,
        featured: false,
      };

      await db
        .collection('users')
        .doc('cynacons')
        .collection('timelines')
        .doc(id)
        .set(timelineDoc);

      console.log(`   ✅ Created timeline: ${title} (${id})`);

      // Create events subcollection
      console.log(`      └─ Adding ${events.length} events...`);
      const batch = db.batch();

      for (const event of events) {
        const eventRef = db
          .collection('users')
          .doc('cynacons')
          .collection('timelines')
          .doc(id)
          .collection('events')
          .doc(event.id);

        batch.set(eventRef, {
          ...event,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();
      console.log(`      ✓ Added ${events.length} events`);
    }

    // Step 3: Create test user timeline
    console.log('\n📝 Creating test user timeline...');

    const testTimelineId = 'zEAJkBfgpYt3YdCLW2tz';
    const testTimeline = {
      id: testTimelineId,
      title: 'Test Timeline',
      description: 'Timeline for E2E testing',
      ownerId: TEST_USER.uid,
      visibility: 'public',
      eventCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      viewCount: 0,
      featured: false,
    };

    await db
      .collection('users')
      .doc(TEST_USER.uid)
      .collection('timelines')
      .doc(testTimelineId)
      .set(testTimeline);

    console.log(`   ✅ Created timeline: Test Timeline (${testTimelineId})`);

    // Step 4: Verify
    console.log('\n🔍 Verifying data...');
    const usersSnapshot = await db.collection('users').get();
    console.log(`   ✅ Users in Firestore: ${usersSnapshot.size}`);

    const cynaconTimelinesSnapshot = await db
      .collection('users')
      .doc('cynacons')
      .collection('timelines')
      .get();
    console.log(`   ✅ Cynacons timelines: ${cynaconTimelinesSnapshot.size}`);

    const testUserTimelinesSnapshot = await db
      .collection('users')
      .doc(TEST_USER.uid)
      .collection('timelines')
      .get();
    console.log(`   ✅ Test user timelines: ${testUserTimelinesSnapshot.size}`);

    console.log('\n✨ Test data seeding complete!\n');
    console.log('📋 You can now run E2E tests:');
    console.log('   npx playwright test tests/e2e/01-full-user-journey.spec.ts --headed\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding test data:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    process.exit(1);
  }
}

seedTestData();
