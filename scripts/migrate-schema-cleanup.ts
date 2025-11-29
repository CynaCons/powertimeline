/**
 * Firestore Schema Cleanup Migration
 * v0.5.12 - Makes database compliant with SRS_DB.md
 *
 * This script removes deprecated fields from User and Event documents:
 *
 * User fields to remove:
 * - avatar (unused)
 * - bio (unused)
 * - name (username is sufficient)
 *
 * Event fields to remove:
 * - order (date/time used for ordering)
 * - priority (unused)
 * - category (unused)
 * - excerpt (unused)
 *
 * Run with: npx tsx scripts/migrate-schema-cleanup.ts [--prod|--dev|--dry-run]
 *
 * Options:
 *   --prod     Run on production database
 *   --dev      Run on development database (default)
 *   --dry-run  Show what would be changed without making changes
 */

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Fields to remove from User documents
const USER_FIELDS_TO_REMOVE = ['avatar', 'bio', 'name'];

// Fields to remove from Event documents
const EVENT_FIELDS_TO_REMOVE = ['order', 'priority', 'category', 'excerpt'];

// Parse command line arguments
const isProd = process.argv.includes('--prod');
const isDryRun = process.argv.includes('--dry-run');
const envName = isProd ? 'PRODUCTION' : 'DEVELOPMENT';

const prodKeyPath = resolve(process.cwd(), 'powertimeline-860f1-firebase-adminsdk-fbsvc-933b603f7d.json');
const devKeyPath = resolve(process.cwd(), 'powertimeline-dev-firebase-adminsdk-fbsvc-adcd3de895.json');

const keyPath = isProd ? prodKeyPath : devKeyPath;

if (!existsSync(keyPath)) {
  console.error(`Service account key not found: ${keyPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

interface MigrationStats {
  usersScanned: number;
  usersUpdated: number;
  userFieldsRemoved: Record<string, number>;
  timelinesScanned: number;
  eventsScanned: number;
  eventsUpdated: number;
  eventFieldsRemoved: Record<string, number>;
  errors: string[];
}

async function migrateUsers(stats: MigrationStats): Promise<void> {
  console.log('\n--- Migrating User Documents ---\n');

  const usersSnapshot = await db.collection('users').get();
  stats.usersScanned = usersSnapshot.size;

  console.log(`Found ${usersSnapshot.size} users to scan`);

  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const fieldsToRemove: string[] = [];

    // Check which deprecated fields exist
    for (const field of USER_FIELDS_TO_REMOVE) {
      if (field in userData) {
        fieldsToRemove.push(field);
        stats.userFieldsRemoved[field] = (stats.userFieldsRemoved[field] || 0) + 1;
      }
    }

    if (fieldsToRemove.length > 0) {
      const username = userData.username || userData.email || userDoc.id;
      console.log(`  User: ${username}`);
      console.log(`    Removing fields: ${fieldsToRemove.join(', ')}`);

      if (!isDryRun) {
        const updates: Record<string, admin.firestore.FieldValue> = {};
        for (const field of fieldsToRemove) {
          updates[field] = admin.firestore.FieldValue.delete();
        }
        await userDoc.ref.update(updates);
      }

      stats.usersUpdated++;
    }
  }

  console.log(`\n  Users updated: ${stats.usersUpdated}/${stats.usersScanned}`);
}

async function migrateEvents(stats: MigrationStats): Promise<void> {
  console.log('\n--- Migrating Event Documents ---\n');

  // Get all users to iterate through their timelines
  const usersSnapshot = await db.collection('users').get();

  for (const userDoc of usersSnapshot.docs) {
    const timelinesSnapshot = await db.collection(`users/${userDoc.id}/timelines`).get();
    stats.timelinesScanned += timelinesSnapshot.size;

    for (const timelineDoc of timelinesSnapshot.docs) {
      const eventsSnapshot = await db.collection(`users/${userDoc.id}/timelines/${timelineDoc.id}/events`).get();
      stats.eventsScanned += eventsSnapshot.size;

      for (const eventDoc of eventsSnapshot.docs) {
        const eventData = eventDoc.data();
        const fieldsToRemove: string[] = [];

        // Check which deprecated fields exist
        for (const field of EVENT_FIELDS_TO_REMOVE) {
          if (field in eventData) {
            fieldsToRemove.push(field);
            stats.eventFieldsRemoved[field] = (stats.eventFieldsRemoved[field] || 0) + 1;
          }
        }

        if (fieldsToRemove.length > 0) {
          const eventTitle = eventData.title || eventDoc.id;
          console.log(`  Event: "${eventTitle}" (${timelineDoc.id})`);
          console.log(`    Removing fields: ${fieldsToRemove.join(', ')}`);

          if (!isDryRun) {
            const updates: Record<string, admin.firestore.FieldValue> = {};
            for (const field of fieldsToRemove) {
              updates[field] = admin.firestore.FieldValue.delete();
            }
            await eventDoc.ref.update(updates);
          }

          stats.eventsUpdated++;
        }
      }
    }
  }

  console.log(`\n  Events updated: ${stats.eventsUpdated}/${stats.eventsScanned}`);
}

async function runMigration(): Promise<void> {
  console.log('\n========================================');
  console.log(`  Firestore Schema Cleanup Migration`);
  console.log(`  Environment: ${envName}`);
  console.log(`  Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log('========================================\n');

  const stats: MigrationStats = {
    usersScanned: 0,
    usersUpdated: 0,
    userFieldsRemoved: {},
    timelinesScanned: 0,
    eventsScanned: 0,
    eventsUpdated: 0,
    eventFieldsRemoved: {},
    errors: []
  };

  try {
    await migrateUsers(stats);
    await migrateEvents(stats);

    // Print summary
    console.log('\n========================================');
    console.log('  Migration Summary');
    console.log('========================================\n');

    console.log('User Documents:');
    console.log(`  Scanned: ${stats.usersScanned}`);
    console.log(`  Updated: ${stats.usersUpdated}`);
    console.log(`  Fields removed:`);
    for (const [field, count] of Object.entries(stats.userFieldsRemoved)) {
      console.log(`    - ${field}: ${count}`);
    }

    console.log('\nEvent Documents:');
    console.log(`  Timelines scanned: ${stats.timelinesScanned}`);
    console.log(`  Events scanned: ${stats.eventsScanned}`);
    console.log(`  Events updated: ${stats.eventsUpdated}`);
    console.log(`  Fields removed:`);
    for (const [field, count] of Object.entries(stats.eventFieldsRemoved)) {
      console.log(`    - ${field}: ${count}`);
    }

    if (isDryRun) {
      console.log('\n*** DRY RUN - No changes were made ***');
      console.log('Run without --dry-run to apply changes.');
    } else {
      console.log('\n*** Migration completed successfully! ***');
    }

  } catch (error) {
    console.error('\nMigration failed:', error);
    stats.errors.push(String(error));
  } finally {
    await admin.app().delete();
  }
}

runMigration();
