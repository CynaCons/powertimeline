/**
 * Cleanup Script: Remove legacy 'events' field from timeline documents
 *
 * This field was from the old schema before events were moved to a subcollection.
 */

import fs from 'fs';
import path from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

type EnvTarget = 'dev' | 'prod';

const SERVICE_ACCOUNT_PATHS: Record<EnvTarget, string> = {
  dev: 'powertimeline-dev-firebase-adminsdk-fbsvc-adcd3de895.json',
  prod: 'powertimeline-860f1-firebase-adminsdk-fbsvc-933b603f7d.json',
};

function initFirestore(target: EnvTarget) {
  if (getApps().length > 0) return getFirestore();

  const credPath = path.resolve(process.cwd(), SERVICE_ACCOUNT_PATHS[target]);
  console.log(`Using: ${path.basename(credPath)}`);
  const creds = JSON.parse(fs.readFileSync(credPath, 'utf8'));
  initializeApp({ credential: cert(creds as Record<string, string>) });
  return getFirestore();
}

async function cleanup(target: EnvTarget, dryRun: boolean = true) {
  console.log(`\n🧹 Cleaning up legacy 'events' field on ${target.toUpperCase()}`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  const db = initFirestore(target);
  const snap = await db.collectionGroup('timelines').get();

  const toClean: { ref: FirebaseFirestore.DocumentReference; title: string }[] = [];
  snap.forEach((doc) => {
    const data = doc.data();
    if ('events' in data) {
      toClean.push({ ref: doc.ref, title: data.title || doc.id });
    }
  });

  console.log(`Found ${toClean.length} timelines with legacy 'events' field\n`);

  if (toClean.length === 0) {
    console.log('✅ Nothing to clean up!\n');
    return;
  }

  for (const { ref, title } of toClean) {
    if (dryRun) {
      console.log(`   Would remove 'events' from: "${title}"`);
    } else {
      await ref.update({ events: FieldValue.delete() });
      console.log(`   ✓ Removed 'events' from: "${title}"`);
    }
  }

  if (dryRun) {
    console.log('\n💡 Run with --live flag to apply changes\n');
  } else {
    console.log('\n✅ Cleanup complete!\n');
  }
}

const args = process.argv.slice(2);
const target: EnvTarget = args.includes('prod') ? 'prod' : 'dev';
const dryRun = !args.includes('--live');

cleanup(target, dryRun).then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
