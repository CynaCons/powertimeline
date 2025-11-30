/**
 * Check what extra fields exist in Firestore documents
 */
import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const devKeyPath = resolve(process.cwd(), 'powertimeline-dev-firebase-adminsdk-fbsvc-adcd3de895.json');
if (!existsSync(devKeyPath)) {
  console.error('Dev key not found');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(devKeyPath, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const ALLOWED_USER_FIELDS = new Set(['id','email','username','createdAt','updatedAt','role','displayName']);
const ALLOWED_EVENT_FIELDS = new Set(['id','title','description','date','endDate','time','timelineId','createdAt','updatedAt']);

async function main() {
  console.log('\n=== Checking Extra Fields ===\n');

  // Users - check all and report field types
  const users = await db.collection('users').get();
  const userExtraFields = new Set<string>();
  let usersWithTimestamp = 0;

  users.forEach(doc => {
    const data = doc.data();
    Object.keys(data).forEach(k => {
      if (!ALLOWED_USER_FIELDS.has(k)) userExtraFields.add(k);
    });
    // Check if createdAt is a Timestamp
    if (data.createdAt && typeof data.createdAt !== 'string') {
      usersWithTimestamp++;
    }
  });
  console.log('User extra fields:', [...userExtraFields]);
  console.log('Users with Timestamp createdAt:', usersWithTimestamp, '/', users.size);

  // Check for duplicate usernames
  console.log('\n--- All Users (checking for duplicates) ---');
  const usernameMap: Record<string, string[]> = {};
  users.forEach(doc => {
    const data = doc.data();
    const username = data.username || '(no username)';
    if (!usernameMap[username]) usernameMap[username] = [];
    usernameMap[username].push(doc.id);
    console.log(`  ${doc.id}: username="${username}", email="${data.email}"`);
  });

  console.log('\n--- Username duplicates ---');
  for (const [username, ids] of Object.entries(usernameMap)) {
    if (ids.length > 1) {
      console.log(`  ⚠️ "${username}" used by: ${ids.join(', ')}`);
    }
  }

  // Events - check all fields
  const events = await db.collectionGroup('events').limit(100).get();
  const eventExtraFields = new Set<string>();
  const eventFieldCounts: Record<string, number> = {};

  events.forEach(doc => {
    const data = doc.data();
    Object.keys(data).forEach(k => {
      if (!ALLOWED_EVENT_FIELDS.has(k)) {
        eventExtraFields.add(k);
        eventFieldCounts[k] = (eventFieldCounts[k] || 0) + 1;
      }
    });
  });
  console.log('\nEvent extra fields:', [...eventExtraFields]);
  console.log('Event extra field counts:', eventFieldCounts);

  // Sample event with extra fields
  const eventWithExtra = events.docs.find(doc => {
    const keys = Object.keys(doc.data());
    return keys.some(k => !ALLOWED_EVENT_FIELDS.has(k));
  });
  if (eventWithExtra) {
    console.log('\nSample event with extra fields:', eventWithExtra.data());
  }

  await admin.app().delete();
}

main();
