/**
 * Fix test-user username in production to avoid duplicate
 */

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const keyPath = resolve(process.cwd(), 'powertimeline-860f1-firebase-adminsdk-fbsvc-933b603f7d.json');

if (!existsSync(keyPath)) {
  console.error('Prod key not found');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function main() {
  console.log('Fixing test-user username in production...');

  // Get current data
  const doc = await db.collection('users').doc('test-user').get();
  console.log('Current data:', doc.data());

  // Update username
  await db.collection('users').doc('test-user').update({
    username: 'testuser-prod'
  });

  // Verify
  const updated = await db.collection('users').doc('test-user').get();
  console.log('Updated data:', updated.data());

  await admin.app().delete();
}
main();
