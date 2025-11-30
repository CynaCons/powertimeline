import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const keyPath = resolve(process.cwd(), 'powertimeline-dev-firebase-adminsdk-fbsvc-adcd3de895.json');
const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const ALLOWED_EVENT_FIELDS = new Set(['id','title','description','date','endDate','time','timelineId','createdAt','updatedAt']);

async function main() {
  console.log('Checking ALL events for extra fields...\n');

  const events = await db.collectionGroup('events').get();
  console.log(`Total events: ${events.size}\n`);

  let problemCount = 0;
  const allExtraFields = new Set<string>();

  events.forEach(doc => {
    const data = doc.data();
    const keys = Object.keys(data);
    const extraFields = keys.filter(k => !ALLOWED_EVENT_FIELDS.has(k));

    if (extraFields.length > 0) {
      problemCount++;
      extraFields.forEach(f => allExtraFields.add(f));
      if (problemCount <= 5) { // Only show first 5
        console.log(`Event ${doc.id}:`);
        console.log(`  Path: ${doc.ref.path}`);
        console.log(`  Extra fields: ${extraFields.join(', ')}`);
        console.log(`  Data:`, JSON.stringify(data, null, 2));
        console.log('');
      }
    }
  });

  console.log(`\nTotal events with extra fields: ${problemCount}`);
  console.log(`All extra field names: ${[...allExtraFields].join(', ')}`);

  await admin.app().delete();
}
main();
