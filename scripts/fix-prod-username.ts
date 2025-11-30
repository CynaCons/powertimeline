/**
 * Fix Production Username Case
 *
 * The username "CynaCons" needs to be lowercase: "cynacons"
 *
 * Run with:
 *   npx tsx scripts/fix-prod-username.ts --dry-run
 *   npx tsx scripts/fix-prod-username.ts --confirm
 */

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const isDryRun = !process.argv.includes('--confirm');

const prodKeyPath = resolve(process.cwd(), 'powertimeline-860f1-firebase-adminsdk-fbsvc-933b603f7d.json');

if (!existsSync(prodKeyPath)) {
  console.error(`❌ Service account key not found: ${prodKeyPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(prodKeyPath, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Fix Production Username Case`);
  console.log(`  Mode: ${isDryRun ? '🔍 DRY RUN (no changes)' : '⚠️  LIVE (will modify data)'}`);
  console.log(`${'='.repeat(60)}\n`);

  const usersSnapshot = await db.collection('users').get();
  let fixedCount = 0;

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    const username = data.username;

    if (username && username !== username.toLowerCase()) {
      console.log(`Found username with uppercase: "${username}"`);
      console.log(`  User ID: ${doc.id}`);
      console.log(`  Email: ${data.email}`);
      console.log(`  Will change to: "${username.toLowerCase()}"`);

      if (!isDryRun) {
        await doc.ref.update({ username: username.toLowerCase() });
        console.log('  ✅ Fixed');
      }
      fixedCount++;
    }
  }

  if (fixedCount === 0) {
    console.log('✅ No usernames with uppercase found');
  } else {
    console.log(`\n${fixedCount} username(s) ${isDryRun ? 'need fixing' : 'fixed'}`);
  }

  if (isDryRun) {
    console.log('\nℹ️  This was a dry run. To apply changes, run with --confirm');
  }

  await admin.app().delete();
}

main().catch((error) => {
  console.error('\n❌ Fix failed:', error);
  process.exit(1);
});
