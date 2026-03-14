/**
 * Fix Script: Add missing 'id' field to events
 *
 * Legacy events were created before we started storing doc.id inside the document.
 */

import fs from 'fs';
import path from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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

async function fix(target: EnvTarget, dryRun: boolean = true) {
  console.log(`\n🔧 Fixing events missing 'id' field on ${target.toUpperCase()}`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  const db = initFirestore(target);
  const snap = await db.collectionGroup('events').get();

  const toFix: { ref: FirebaseFirestore.DocumentReference; docId: string }[] = [];
  snap.forEach(doc => {
    const data = doc.data();
    if (!data.id) {
      toFix.push({ ref: doc.ref, docId: doc.id });
    }
  });

  console.log(`Total events: ${snap.size}`);
  console.log(`Events missing 'id': ${toFix.length}\n`);

  if (toFix.length === 0) {
    console.log('✅ All events have id field!\n');
    return;
  }

  if (dryRun) {
    console.log(`Would fix ${toFix.length} events`);
    console.log('\n💡 Run with --live flag to apply changes\n');
    return;
  }

  let fixed = 0;
  for (const { ref, docId } of toFix) {
    await ref.update({ id: docId });
    fixed++;
    if (fixed % 50 === 0) {
      console.log(`   Fixed ${fixed}/${toFix.length}...`);
    }
  }

  console.log(`\n✅ Fixed ${fixed} events!\n`);
}

const args = process.argv.slice(2);
const target: EnvTarget = args.includes('prod') ? 'prod' : 'dev';
const dryRun = !args.includes('--live');

fix(target, dryRun).then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
