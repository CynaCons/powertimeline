import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const keyPath = resolve(process.cwd(), 'powertimeline-dev-firebase-adminsdk-fbsvc-adcd3de895.json');
const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function main() {
  console.log('Fixing test-user username...');

  // Get current data
  const doc = await db.collection('users').doc('test-user').get();
  console.log('Current data:', doc.data());

  // Update username
  await db.collection('users').doc('test-user').update({
    username: 'testuser-dev'
  });

  // Verify
  const updated = await db.collection('users').doc('test-user').get();
  console.log('Updated data:', updated.data());

  await admin.app().delete();
}
main();
