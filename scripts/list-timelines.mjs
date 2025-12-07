/**
 * List all timelines in dev Firestore
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const devCreds = JSON.parse(readFileSync(join(rootDir, 'powertimeline-dev-firebase-adminsdk-fbsvc-adcd3de895.json'), 'utf8'));
const devApp = initializeApp({ credential: cert(devCreds) }, 'dev');
const devDb = getFirestore(devApp);

async function listTimelines(searchTerm = '') {
  console.log('🔍 Listing timelines in dev Firestore...\n');

  const usersSnapshot = await devDb.collection('users').get();

  for (const userDoc of usersSnapshot.docs) {
    const timelinesSnapshot = await devDb.collection('users').doc(userDoc.id).collection('timelines').get();

    for (const timelineDoc of timelinesSnapshot.docs) {
      const data = timelineDoc.data();
      const title = data.title || 'Untitled';

      if (searchTerm && !title.toLowerCase().includes(searchTerm.toLowerCase())) {
        continue;
      }

      const eventsSnapshot = await timelineDoc.ref.collection('events').get();

      console.log(`📅 ${title}`);
      console.log(`   ID: ${timelineDoc.id}`);
      console.log(`   Owner: ${userDoc.id}`);
      console.log(`   Events: ${eventsSnapshot.size}`);
      console.log('');
    }
  }
}

const searchTerm = process.argv[2] || '';
listTimelines(searchTerm)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
