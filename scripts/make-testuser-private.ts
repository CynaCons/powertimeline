/**
 * Make all timelines owned by testuser-prod private in production
 * This prevents test data from polluting the public discovery feeds
 */

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const keyPath = resolve(process.cwd(), 'powertimeline-860f1-firebase-adminsdk-fbsvc-933b603f7d.json');

if (!existsSync(keyPath)) {
  console.error('Production Firebase key not found:', keyPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const TEST_USER_ID = 'test-user'; // The user ID in production

async function main() {
  console.log('Finding timelines owned by test-user in production...\n');

  // Get all timelines for this user
  const timelinesRef = db.collection('users').doc(TEST_USER_ID).collection('timelines');
  const snapshot = await timelinesRef.get();

  if (snapshot.empty) {
    console.log('No timelines found for test-user');
    await admin.app().delete();
    return;
  }

  console.log(`Found ${snapshot.size} timeline(s):\n`);

  const batch = db.batch();
  let updateCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const currentVisibility = data.visibility || 'public';

    console.log(`  ${doc.id}:`);
    console.log(`    Title: ${data.title}`);
    console.log(`    Current visibility: ${currentVisibility}`);

    if (currentVisibility !== 'private') {
      batch.update(doc.ref, { visibility: 'private' });
      console.log(`    -> Will update to: private`);
      updateCount++;
    } else {
      console.log(`    -> Already private, skipping`);
    }
    console.log('');
  }

  if (updateCount > 0) {
    console.log(`Updating ${updateCount} timeline(s) to private...`);
    await batch.commit();
    console.log('Done!');
  } else {
    console.log('No updates needed.');
  }

  await admin.app().delete();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
