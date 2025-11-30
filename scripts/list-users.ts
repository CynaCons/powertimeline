/**
 * List all users in Firestore database
 * Run with: npx tsx scripts/list-users.ts [--prod|--dev]
 */

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const isProd = process.argv.includes('--prod');
const envName = isProd ? 'PRODUCTION' : 'DEVELOPMENT';

const prodKeyPath = resolve(process.cwd(), 'powertimeline-860f1-firebase-adminsdk-fbsvc-933b603f7d.json');
const devKeyPath = resolve(process.cwd(), 'powertimeline-dev-firebase-adminsdk-fbsvc-adcd3de895.json');

const keyPath = isProd ? prodKeyPath : devKeyPath;

if (!existsSync(keyPath)) {
  console.error(`❌ Service account key not found: ${keyPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function listUsers() {
  console.log(`\n📋 Users in ${envName} database:\n`);

  const usersSnapshot = await db.collection('users').get();

  if (usersSnapshot.empty) {
    console.log('   No users found.');
  } else {
    usersSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`   ${index + 1}. ${data.name || '(no name)'}`);
      console.log(`      ID: ${doc.id}`);
      console.log(`      Email: ${data.email || '(no email)'}`);
      console.log(`      Role: ${data.role || 'user'}`);
      console.log('');
    });
  }

  console.log(`   Total: ${usersSnapshot.size} users\n`);

  await admin.app().delete();
}

listUsers();
