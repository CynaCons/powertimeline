/**
 * List all Firebase Authentication users
 * Run with: npx tsx scripts/list-firebase-users.ts
 */

import admin from 'firebase-admin';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

// Initialize Firebase Admin
if (!admin.apps.length) {
  // Try to load from file first, fallback to environment variable
  let credential;

  try {
    // Try dev service account first
    const serviceAccountPath = resolve(process.cwd(), 'powertimeline-dev-firebase-adminsdk-fbsvc-adcd3de895.json');
    const serviceAccountJson = readFileSync(serviceAccountPath, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountJson);
    credential = admin.credential.cert(serviceAccount);
    console.log('✅ Using dev Firebase service account\n');
  } catch (_error) {
    // Fallback to production service account
    try {
      const serviceAccountPath = resolve(process.cwd(), 'powertimeline-860f1-firebase-adminsdk-fbsvc-933b603f7d.json');
      const serviceAccountJson = readFileSync(serviceAccountPath, 'utf8');
      const serviceAccount = JSON.parse(serviceAccountJson);
      credential = admin.credential.cert(serviceAccount);
      console.log('✅ Using production Firebase service account\n');
    } catch (_error2) {
      console.error('❌ No service account file found. Please add a Firebase service account JSON file.');
      process.exit(1);
    }
  }

  admin.initializeApp({
    credential,
  });
}

async function listUsers() {
  try {
    console.log('📋 Listing all Firebase Authentication users...\n');

    // List all users (max 1000 at a time)
    const listUsersResult = await admin.auth().listUsers(1000);

    console.log(`Found ${listUsersResult.users.length} users:\n`);

    listUsersResult.users.forEach((userRecord, index) => {
      console.log(`${index + 1}. User ${userRecord.uid}`);
      console.log(`   Email: ${userRecord.email || 'N/A'}`);
      console.log(`   Display Name: ${userRecord.displayName || 'N/A'}`);
      console.log(`   Created: ${userRecord.metadata.creationTime}`);
      console.log(`   Last Sign In: ${userRecord.metadata.lastSignInTime || 'Never'}`);
      console.log(`   Email Verified: ${userRecord.emailVerified}`);
      console.log(`   Disabled: ${userRecord.disabled}`);
      console.log('');
    });

    // If there are more users, show pagination info
    if (listUsersResult.pageToken) {
      console.log('⚠️  More than 1000 users exist. Showing first 1000.');
    }

    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error listing users:', error);
    process.exit(1);
  }
}

listUsers();
