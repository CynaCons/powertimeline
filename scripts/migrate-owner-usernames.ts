/**
 * Migration Script: Backfill ownerUsername on all timeline documents
 *
 * Usage:
 *   npx ts-node scripts/migrate-owner-usernames.ts [dev|prod]
 *
 * This script:
 * 1. Fetches all users and creates a userId -> username map
 * 2. Queries all timelines via collectionGroup
 * 3. Updates timelines missing ownerUsername field
 */

import fs from 'fs';
import path from 'path';
import { getApps, initializeApp, cert, type AppOptions } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

type EnvTarget = 'dev' | 'prod';

const SERVICE_ACCOUNT_PATHS: Record<EnvTarget, string[]> = {
  dev: [
    process.env.FIREBASE_ADMIN_CREDENTIALS_PATH || '',
    path.resolve(process.cwd(), 'powertimeline-dev-firebase-adminsdk-fbsvc-adcd3de895.json'),
  ],
  prod: [
    process.env.FIREBASE_ADMIN_CREDENTIALS_PATH || '',
    path.resolve(process.cwd(), 'powertimeline-860f1-firebase-adminsdk-fbsvc-933b603f7d.json'),
  ],
};

function initFirestore(target: EnvTarget) {
  if (getApps().length > 0) {
    return getFirestore();
  }

  const candidatePaths = SERVICE_ACCOUNT_PATHS[target].filter(Boolean);
  let credentialJson: Record<string, unknown> | null = null;

  for (const p of candidatePaths) {
    if (p && fs.existsSync(p)) {
      credentialJson = JSON.parse(fs.readFileSync(p, 'utf8'));
      console.log(`✓ Using service account: ${path.basename(p)}`);
      break;
    }
  }

  if (!credentialJson) {
    throw new Error(`No service account JSON found for target ${target}. Set FIREBASE_ADMIN_CREDENTIALS_PATH or place key in repo root.`);
  }

  const options: AppOptions = { credential: cert(credentialJson as Record<string, string>) };
  initializeApp(options);
  return getFirestore();
}

async function migrateOwnerUsernames(target: EnvTarget, dryRun: boolean = true) {
  console.log(`\n🚀 Starting migration on ${target.toUpperCase()} environment`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will update documents)'}\n`);

  const db = initFirestore(target);

  // Step 1: Fetch all users
  console.log('📥 Fetching all users...');
  const usersSnapshot = await db.collection('users').get();
  const userMap = new Map<string, string>();

  usersSnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.username) {
      userMap.set(doc.id, data.username);
    }
  });
  console.log(`   Found ${userMap.size} users with usernames\n`);

  // Step 2: Query all timelines via collectionGroup
  console.log('📥 Fetching all timelines...');
  const timelinesSnapshot = await db.collectionGroup('timelines').get();
  console.log(`   Found ${timelinesSnapshot.size} total timelines\n`);

  // Step 3: Find timelines missing ownerUsername
  const needsUpdate: { ref: FirebaseFirestore.DocumentReference; ownerId: string; title: string }[] = [];
  const alreadyHas: number[] = [];
  const missingOwner: string[] = [];

  timelinesSnapshot.forEach((doc) => {
    const data = doc.data();

    if (data.ownerUsername) {
      alreadyHas.push(1);
    } else if (data.ownerId && userMap.has(data.ownerId)) {
      needsUpdate.push({
        ref: doc.ref,
        ownerId: data.ownerId,
        title: data.title || doc.id,
      });
    } else {
      missingOwner.push(doc.id);
    }
  });

  console.log('📊 Analysis:');
  console.log(`   ✓ Already has ownerUsername: ${alreadyHas.length}`);
  console.log(`   → Needs update: ${needsUpdate.length}`);
  console.log(`   ✗ Owner not found: ${missingOwner.length}\n`);

  if (missingOwner.length > 0) {
    console.log('⚠️  Timelines with missing owners:');
    missingOwner.slice(0, 10).forEach((id) => console.log(`     - ${id}`));
    if (missingOwner.length > 10) {
      console.log(`     ... and ${missingOwner.length - 10} more\n`);
    }
  }

  if (needsUpdate.length === 0) {
    console.log('✅ No updates needed - all timelines have ownerUsername!\n');
    return { updated: 0, failed: [], skipped: alreadyHas.length };
  }

  // Step 4: Update timelines
  if (dryRun) {
    console.log('🔍 DRY RUN - Would update the following timelines:');
    needsUpdate.slice(0, 20).forEach(({ title, ownerId }) => {
      const username = userMap.get(ownerId);
      console.log(`   - "${title}" → ownerUsername: "${username}"`);
    });
    if (needsUpdate.length > 20) {
      console.log(`   ... and ${needsUpdate.length - 20} more\n`);
    }
    console.log('\n💡 Run with --live flag to apply changes\n');
    return { updated: 0, failed: [], skipped: alreadyHas.length, wouldUpdate: needsUpdate.length };
  }

  // Live update
  console.log('🔄 Updating timelines...');
  let updated = 0;
  const failed: string[] = [];

  for (const { ref, ownerId, title } of needsUpdate) {
    const username = userMap.get(ownerId);
    if (!username) {
      failed.push(ref.id);
      continue;
    }

    try {
      await ref.update({
        ownerUsername: username,
        updatedAt: new Date().toISOString(),
      });
      updated++;
      if (updated % 10 === 0) {
        console.log(`   Updated ${updated}/${needsUpdate.length}...`);
      }
    } catch (err) {
      console.error(`   ✗ Failed to update "${title}": ${err}`);
      failed.push(ref.id);
    }
  }

  console.log(`\n✅ Migration complete!`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Failed: ${failed.length}`);
  console.log(`   Skipped (already had ownerUsername): ${alreadyHas.length}\n`);

  return { updated, failed, skipped: alreadyHas.length };
}

// Main execution
const args = process.argv.slice(2);
const target: EnvTarget = args.includes('prod') ? 'prod' : 'dev';
const dryRun = !args.includes('--live');

migrateOwnerUsernames(target, dryRun)
  .then((result) => {
    console.log('Result:', JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
