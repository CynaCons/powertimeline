/**
 * Fix Remaining Database Compliance Issues
 *
 * Fixes:
 * 1. User 'alice' has admin role but is not in allowlist - change to 'user'
 * 2. Event 'event-seeded-1' has extra 'visibility' field - delete it
 *
 * Run with:
 *   npx tsx scripts/fix-remaining-compliance.ts --dev --dry-run
 *   npx tsx scripts/fix-remaining-compliance.ts --dev --confirm
 */

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { FieldValue } from 'firebase-admin/firestore';

// Parse arguments
const isProd = process.argv.includes('--prod');
const isDev = process.argv.includes('--dev');
const isDryRun = !process.argv.includes('--confirm');

if (!isProd && !isDev) {
  console.error('❌ Must specify --dev or --prod');
  process.exit(1);
}

const envName = isProd ? 'PRODUCTION' : 'DEVELOPMENT';
const prodKeyPath = resolve(process.cwd(), 'powertimeline-860f1-firebase-adminsdk-fbsvc-933b603f7d.json');
const devKeyPath = resolve(process.cwd(), 'powertimeline-dev-firebase-adminsdk-fbsvc-adcd3de895.json');
const keyPath = isProd ? prodKeyPath : devKeyPath;

if (!existsSync(keyPath)) {
  console.error(`❌ Service account key not found: ${keyPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const ADMIN_EMAIL_ALLOWLIST = new Set(['cynako@gmail.com', 'test@powertimeline.com']);

async function fixAliceRole(): Promise<boolean> {
  console.log('\n📋 Checking alice user role...\n');

  // Find alice user
  const usersSnapshot = await db.collection('users').get();
  let aliceDoc: admin.firestore.QueryDocumentSnapshot | null = null;

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    if (data.email === 'alice@powertimeline.dev' || doc.id === 'alice') {
      aliceDoc = doc;
      break;
    }
  }

  if (!aliceDoc) {
    console.log('   ℹ️  Alice user not found - skipping');
    return false;
  }

  const data = aliceDoc.data();
  console.log(`   Found alice: ${aliceDoc.id}`);
  console.log(`   Email: ${data.email}`);
  console.log(`   Current role: ${data.role || '(none)'}`);

  if (data.role === 'admin' && !ADMIN_EMAIL_ALLOWLIST.has(data.email)) {
    console.log(`   ⚠️  Admin role not in allowlist - will change to 'user'`);

    if (!isDryRun) {
      await aliceDoc.ref.update({ role: 'user' });
      console.log('   ✅ Role updated to user');
    }
    return true;
  } else {
    console.log('   ✅ Role is OK');
    return false;
  }
}

async function fixEventVisibility(): Promise<boolean> {
  console.log('\n📋 Checking for events with visibility field...\n');

  const eventsSnapshot = await db.collectionGroup('events').get();
  let fixedCount = 0;

  for (const doc of eventsSnapshot.docs) {
    const data = doc.data();
    if ('visibility' in data) {
      console.log(`   Found event with visibility field:`);
      console.log(`   Path: ${doc.ref.path}`);
      console.log(`   Title: ${data.title || '(none)'}`);
      console.log(`   Visibility value: ${data.visibility}`);

      if (!isDryRun) {
        await doc.ref.update({ visibility: FieldValue.delete() });
        console.log('   ✅ Visibility field deleted');
      }
      fixedCount++;
    }
  }

  if (fixedCount === 0) {
    console.log('   ✅ No events with visibility field found');
  }

  return fixedCount > 0;
}

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Remaining Compliance Fixes - ${envName}`);
  console.log(`  Mode: ${isDryRun ? '🔍 DRY RUN (no changes)' : '⚠️  LIVE (will modify data)'}`);
  console.log(`${'='.repeat(60)}`);

  const aliceFixed = await fixAliceRole();
  const visibilityFixed = await fixEventVisibility();

  console.log(`\n${'='.repeat(60)}`);
  console.log('  Summary');
  console.log(`${'='.repeat(60)}`);
  console.log(`\n   Alice role fix needed: ${aliceFixed ? 'Yes' : 'No'}`);
  console.log(`   Event visibility fix needed: ${visibilityFixed ? 'Yes' : 'No'}`);

  if (isDryRun) {
    console.log('\n   ℹ️  This was a dry run. No changes were made.');
    console.log('   To apply changes, run with --confirm flag:\n');
    console.log(`   npx tsx scripts/fix-remaining-compliance.ts ${isProd ? '--prod' : '--dev'} --confirm\n`);
  } else {
    console.log('\n   ✅ All fixes applied successfully!\n');
  }

  await admin.app().delete();
}

main().catch((error) => {
  console.error('\n❌ Fix failed:', error);
  process.exit(1);
});
