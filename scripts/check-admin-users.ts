import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const keyPath = resolve(process.cwd(), 'powertimeline-dev-firebase-adminsdk-fbsvc-adcd3de895.json');
const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const ADMIN_EMAIL_ALLOWLIST = new Set(['cynako@gmail.com','test@powertimeline.com']);

async function main() {
  const users = await db.collection('users').get();
  console.log('All users and roles:\n');
  users.forEach(doc => {
    const data = doc.data();
    const isAdmin = data.role === 'admin';
    const inAllowlist = ADMIN_EMAIL_ALLOWLIST.has(data.email);
    console.log(`  ${doc.id}:`);
    console.log(`    email: ${data.email}`);
    console.log(`    role: ${data.role || '(none)'}`);
    if (isAdmin && !inAllowlist) {
      console.log(`    ⚠️ ADMIN NOT IN ALLOWLIST!`);
    }
    console.log('');
  });
  await admin.app().delete();
}
main();
