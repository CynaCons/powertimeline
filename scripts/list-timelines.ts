import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const keyPath = resolve(process.cwd(), 'powertimeline-dev-firebase-adminsdk-fbsvc-adcd3de895.json');
if (!existsSync(keyPath)) {
  console.log('Key not found');
  process.exit(1);
}
const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function main() {
  const timelines = await db.collectionGroup('timelines').get();
  console.log('All timelines in dev:\n');
  timelines.forEach(doc => {
    const data = doc.data();
    const path = doc.ref.path;
    console.log(`  ${doc.id}:`);
    console.log(`    Path: ${path}`);
    console.log(`    OwnerId: ${data.ownerId}`);
    console.log(`    Title: ${data.title}`);
    console.log('');
  });
  await admin.app().delete();
}
main();
