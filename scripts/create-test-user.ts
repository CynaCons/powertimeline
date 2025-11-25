/**
 * Create E2E Test User
 * Creates a test user with known credentials for E2E testing
 * Run with: npx tsx scripts/create-test-user.ts
 */

import admin from 'firebase-admin';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccountPath = resolve(process.cwd(), 'powertimeline-dev-firebase-adminsdk-fbsvc-adcd3de895.json');
    const serviceAccountJson = readFileSync(serviceAccountPath, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountJson);
    const credential = admin.credential.cert(serviceAccount);

    admin.initializeApp({
      credential,
    });
    console.log('✅ Connected to Firebase Admin SDK\n');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
    process.exit(1);
  }
}

const TEST_USER = {
  email: 'test@powertimeline.com',
  password: 'TestPassword123!',
  displayName: 'E2E Test User',
  emailVerified: true,
};

async function createTestUser() {
  try {
    console.log('🔧 Creating E2E test user...\n');

    // Check if user already exists
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(TEST_USER.email);
      console.log(`⚠️  User ${TEST_USER.email} already exists!`);
      console.log(`   UID: ${userRecord.uid}`);
      console.log(`   Created: ${userRecord.metadata.creationTime}`);
      console.log('\n   Updating password...');

      // Update the password
      await admin.auth().updateUser(userRecord.uid, {
        password: TEST_USER.password,
        displayName: TEST_USER.displayName,
        emailVerified: TEST_USER.emailVerified,
      });

      console.log('   ✅ Password and details updated!\n');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // User doesn't exist, create new one
        console.log('   Creating new user...');
        userRecord = await admin.auth().createUser({
          email: TEST_USER.email,
          password: TEST_USER.password,
          displayName: TEST_USER.displayName,
          emailVerified: TEST_USER.emailVerified,
        });

        console.log('   ✅ User created successfully!\n');
      } else {
        throw error;
      }
    }

    // Create user profile in Firestore
    const db = admin.firestore();
    const userDocRef = db.collection('users').doc(userRecord.uid);

    const userProfile = {
      email: TEST_USER.email,
      displayName: TEST_USER.displayName,
      username: 'testuser',
      avatar: '🧪',
      bio: 'E2E Test User - Automated testing account',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      role: 'user',
    };

    await userDocRef.set(userProfile, { merge: true });
    console.log('✅ User profile created in Firestore\n');

    // Create a test timeline for this user
    const timelineRef = db.collection('timelines').doc();
    const timelineData = {
      id: timelineRef.id,
      title: 'E2E Test Timeline',
      description: 'Test timeline for automated E2E tests',
      ownerId: userRecord.uid,
      ownerEmail: TEST_USER.email,
      visibility: 'public',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      tags: ['test', 'e2e'],
      eventCount: 3,
    };

    await timelineRef.set(timelineData);
    console.log(`✅ Test timeline created: ${timelineRef.id}\n`);

    // Create some test events for the timeline
    const eventsRef = timelineRef.collection('events');
    const testEvents = [
      {
        id: 'event-1',
        title: 'Test Event 1',
        date: '2024-01-01',
        description: 'First test event',
        category: 'test',
      },
      {
        id: 'event-2',
        title: 'Test Event 2',
        date: '2024-06-15',
        description: 'Second test event',
        category: 'test',
      },
      {
        id: 'event-3',
        title: 'Test Event 3',
        date: '2024-12-31',
        description: 'Third test event',
        category: 'test',
      },
    ];

    for (const event of testEvents) {
      await eventsRef.doc(event.id).set(event);
    }
    console.log('✅ Test events created (3 events)\n');

    // Output credentials for test
    console.log('═══════════════════════════════════════════════════');
    console.log('📋 E2E Test User Credentials');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Email:        ${TEST_USER.email}`);
    console.log(`Password:     ${TEST_USER.password}`);
    console.log(`UID:          ${userRecord.uid}`);
    console.log(`Timeline ID:  ${timelineRef.id}`);
    console.log('═══════════════════════════════════════════════════');
    console.log('\n✅ Test user setup complete!');
    console.log('   You can now run the E2E tests with PHASE 5-8 enabled.\n');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();
