/**
 * Fix Database Schema Compliance
 *
 * Backfills missing required fields in Firestore documents:
 * - Users: id, username (generates from email if missing)
 * - Timelines: id, ownerId (extracted from document path)
 * - Events: id, timelineId (extracted from document path)
 *
 * Run with:
 *   npx tsx scripts/fix-db-compliance.ts --dev --dry-run    # Preview dev changes
 *   npx tsx scripts/fix-db-compliance.ts --dev --confirm    # Apply to dev
 *   npx tsx scripts/fix-db-compliance.ts --prod --dry-run   # Preview prod changes
 *   npx tsx scripts/fix-db-compliance.ts --prod --confirm   # Apply to prod
 */

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

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

interface FixResult {
  collection: string;
  docId: string;
  fixes: string[];
}

const results: FixResult[] = [];

/**
 * Generate a username from email
 */
function generateUsername(email: string, docId: string): string {
  // Try to extract username from email
  const emailPrefix = email.split('@')[0].toLowerCase();
  // Clean it up - only lowercase letters, numbers, hyphens
  let username = emailPrefix.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  // Ensure it starts with a letter
  if (!/^[a-z]/.test(username)) {
    username = 'user-' + username;
  }

  // Ensure minimum length
  if (username.length < 3) {
    username = username + '-' + docId.slice(0, 6);
  }

  // Truncate if too long
  if (username.length > 20) {
    username = username.slice(0, 20);
  }

  // Remove trailing hyphen
  username = username.replace(/-$/, '');

  return username;
}

async function fixUsers(): Promise<number> {
  console.log('\n📋 Checking users...\n');
  const snapshot = await db.collection('users').get();
  let fixCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const fixes: string[] = [];
    const updates: Record<string, any> = {};

    // Fix missing id
    if (!data.id || data.id !== doc.id) {
      updates.id = doc.id;
      fixes.push(`id: undefined → "${doc.id}"`);
    }

    // Fix missing username
    if (!data.username) {
      const newUsername = generateUsername(data.email || 'user', doc.id);
      updates.username = newUsername;
      fixes.push(`username: undefined → "${newUsername}"`);
    }

    // Fix missing or Timestamp createdAt
    if (!data.createdAt) {
      updates.createdAt = new Date().toISOString();
      fixes.push(`createdAt: undefined → "${updates.createdAt}"`);
    } else if (typeof data.createdAt !== 'string' && data.createdAt.toDate) {
      // Convert Firestore Timestamp to ISO string
      updates.createdAt = data.createdAt.toDate().toISOString();
      fixes.push(`createdAt: Timestamp → "${updates.createdAt}"`);
    }

    if (fixes.length > 0) {
      console.log(`   User: ${doc.id}`);
      console.log(`   Email: ${data.email || '(none)'}`);
      fixes.forEach(f => console.log(`      → ${f}`));
      console.log('');

      if (!isDryRun) {
        await doc.ref.update(updates);
      }

      results.push({ collection: 'users', docId: doc.id, fixes });
      fixCount++;
    }
  }

  return fixCount;
}

async function fixTimelines(): Promise<number> {
  console.log('\n📋 Checking timelines...\n');
  const snapshot = await db.collectionGroup('timelines').get();
  let fixCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const fixes: string[] = [];
    const updates: Record<string, any> = {};

    // Extract ownerId from path: users/{ownerId}/timelines/{timelineId}
    const pathSegments = doc.ref.path.split('/');
    const ownerIdFromPath = pathSegments[1];

    // Fix missing id
    if (!data.id || data.id !== doc.id) {
      updates.id = doc.id;
      fixes.push(`id: ${data.id || 'undefined'} → "${doc.id}"`);
    }

    // Fix missing or mismatched ownerId
    if (!data.ownerId || data.ownerId !== ownerIdFromPath) {
      updates.ownerId = ownerIdFromPath;
      fixes.push(`ownerId: ${data.ownerId || 'undefined'} → "${ownerIdFromPath}"`);
    }

    // Fix missing visibility
    if (!data.visibility) {
      updates.visibility = 'public';
      fixes.push(`visibility: undefined → "public"`);
    }

    // Fix missing viewCount
    if (data.viewCount === undefined) {
      updates.viewCount = 0;
      fixes.push(`viewCount: undefined → 0`);
    }

    // Fix missing eventCount
    if (data.eventCount === undefined) {
      // Count actual events
      const eventsSnap = await doc.ref.collection('events').count().get();
      updates.eventCount = eventsSnap.data().count;
      fixes.push(`eventCount: undefined → ${updates.eventCount}`);
    }

    // Fix missing timestamps
    if (!data.createdAt) {
      updates.createdAt = new Date().toISOString();
      fixes.push(`createdAt: undefined → "${updates.createdAt}"`);
    }
    if (!data.updatedAt) {
      updates.updatedAt = data.createdAt || new Date().toISOString();
      fixes.push(`updatedAt: undefined → "${updates.updatedAt}"`);
    }

    if (fixes.length > 0) {
      console.log(`   Timeline: ${doc.id}`);
      console.log(`   Title: ${data.title || '(none)'}`);
      console.log(`   Path: ${doc.ref.path}`);
      fixes.forEach(f => console.log(`      → ${f}`));
      console.log('');

      if (!isDryRun) {
        await doc.ref.update(updates);
      }

      results.push({ collection: 'timelines', docId: doc.id, fixes });
      fixCount++;
    }
  }

  return fixCount;
}

async function fixEvents(): Promise<number> {
  console.log('\n📋 Checking events...\n');
  const snapshot = await db.collectionGroup('events').get();
  let fixCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const fixes: string[] = [];
    const updates: Record<string, any> = {};

    // Extract timelineId from path: users/{ownerId}/timelines/{timelineId}/events/{eventId}
    const pathSegments = doc.ref.path.split('/');
    const timelineIdFromPath = pathSegments[3];

    // Fix missing id
    if (!data.id || data.id !== doc.id) {
      updates.id = doc.id;
      fixes.push(`id: ${data.id || 'undefined'} → "${doc.id}"`);
    }

    // Fix missing or mismatched timelineId
    if (!data.timelineId || data.timelineId !== timelineIdFromPath) {
      updates.timelineId = timelineIdFromPath;
      fixes.push(`timelineId: ${data.timelineId || 'undefined'} → "${timelineIdFromPath}"`);
    }

    // Fix missing timestamps
    if (!data.createdAt) {
      updates.createdAt = new Date().toISOString();
      fixes.push(`createdAt: undefined → "${updates.createdAt}"`);
    }
    if (!data.updatedAt) {
      updates.updatedAt = data.createdAt || new Date().toISOString();
      fixes.push(`updatedAt: undefined → "${updates.updatedAt}"`);
    }

    if (fixes.length > 0) {
      console.log(`   Event: ${doc.id}`);
      console.log(`   Title: ${data.title || '(none)'}`);
      console.log(`   Path: ${doc.ref.path}`);
      fixes.forEach(f => console.log(`      → ${f}`));
      console.log('');

      if (!isDryRun) {
        await doc.ref.update(updates);
      }

      results.push({ collection: 'events', docId: doc.id, fixes });
      fixCount++;
    }
  }

  return fixCount;
}

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Database Schema Compliance Fix - ${envName}`);
  console.log(`  Mode: ${isDryRun ? '🔍 DRY RUN (no changes)' : '⚠️  LIVE (will modify data)'}`);
  console.log(`${'='.repeat(60)}`);

  const userFixes = await fixUsers();
  const timelineFixes = await fixTimelines();
  const eventFixes = await fixEvents();

  console.log(`\n${'='.repeat(60)}`);
  console.log('  Summary');
  console.log(`${'='.repeat(60)}`);
  console.log(`\n   Users to fix:     ${userFixes}`);
  console.log(`   Timelines to fix: ${timelineFixes}`);
  console.log(`   Events to fix:    ${eventFixes}`);
  console.log(`   Total fixes:      ${userFixes + timelineFixes + eventFixes}\n`);

  if (isDryRun) {
    console.log('   ℹ️  This was a dry run. No changes were made.');
    console.log('   To apply changes, run with --confirm flag:\n');
    console.log(`   npx tsx scripts/fix-db-compliance.ts ${isProd ? '--prod' : '--dev'} --confirm\n`);
  } else {
    console.log('   ✅ All fixes applied successfully!\n');
  }

  await admin.app().delete();
}

main().catch((error) => {
  console.error('\n❌ Migration failed:', error);
  process.exit(1);
});
