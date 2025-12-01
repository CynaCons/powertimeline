/**
 * Cleanup deprecated User fields and duplicate users from DEV Firestore
 */
import { initFirestore } from '../tests/utils/dbAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const ALLOWED_USER_FIELDS = new Set([
  'id',
  'email',
  'username',
  'createdAt',
  'updatedAt',
  'role',
  'displayName'
]);

// Duplicate user IDs created by T77 seed script that conflict with existing users
const DUPLICATE_USER_IDS = ['cynacons', 'test-user-1', 'test-user-2', 'test-user-3'];

async function main() {
  console.log('🧹 Cleaning DEV Firestore users...\n');

  const db = initFirestore('dev');

  // Step 1: Delete duplicate users created by T77 seed
  console.log('Step 1: Removing duplicate user documents...');
  for (const id of DUPLICATE_USER_IDS) {
    const ref = db.collection('users').doc(id);
    const doc = await ref.get();
    if (doc.exists) {
      // Also delete their timelines subcollection
      const timelines = await ref.collection('timelines').get();
      for (const tl of timelines.docs) {
        // Delete events subcollection
        const events = await tl.ref.collection('events').get();
        const batch = db.batch();
        events.docs.forEach(e => batch.delete(e.ref));
        if (events.size > 0) await batch.commit();
        await tl.ref.delete();
      }
      await ref.delete();
      console.log(`  Deleted: ${id}`);
    }
  }

  // Step 2: Clean deprecated fields from remaining users
  console.log('\nStep 2: Removing deprecated fields...');
  const snap = await db.collection('users').get();
  console.log(`  Found ${snap.size} users`);

  let cleaned = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    const extraFields = Object.keys(data).filter(k => !ALLOWED_USER_FIELDS.has(k));

    if (extraFields.length > 0) {
      console.log(`  ${doc.id}: removing ${extraFields.join(', ')}`);

      const updates: Record<string, FieldValue> = {};
      for (const field of extraFields) {
        updates[field] = FieldValue.delete();
      }

      await doc.ref.update(updates);
      cleaned++;
    }
  }

  console.log(`\n✅ Cleanup complete: deleted ${DUPLICATE_USER_IDS.length} duplicates, cleaned ${cleaned} users`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
