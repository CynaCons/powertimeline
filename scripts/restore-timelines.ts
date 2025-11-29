/**
 * Restore 5 timelines for cynako@gmail.com in production
 * Run with: npx tsx scripts/restore-timelines.ts [--prod|--dev]
 *
 * This script recreates the 5 historical timelines:
 * - Robert F. Kennedy (10 events)
 * - John F. Kennedy (16 events)
 * - Napoleon Bonaparte (63 events)
 * - French Revolution (244 events)
 * - Charles de Gaulle (38 events)
 */

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Import seed data
import {
  seedRFKTimeline,
  seedJFKTimeline,
  seedNapoleonTimeline,
  seedFrenchRevolutionTimeline,
  seedDeGaulleTimeline
} from '../src/lib/devSeed';

// cynako@gmail.com user IDs (different in prod vs dev)
const TARGET_USER_ID_PROD = 'R0rT7M1Lo1Ocomg4UeffEJ1EpvG2';
const TARGET_USER_ID_DEV = 'HL3gR4MbXKe4gPc4vUwksaoKEn93';

const isProd = process.argv.includes('--prod');
const envName = isProd ? 'PRODUCTION' : 'DEVELOPMENT';
const TARGET_USER_ID = isProd ? TARGET_USER_ID_PROD : TARGET_USER_ID_DEV;

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

interface TimelineData {
  id: string;
  title: string;
  description: string;
  visibility: 'public' | 'private';
  seedFn: () => Array<{ id: string; date: string; time?: string; title: string; description: string }>;
}

const timelinesData: TimelineData[] = [
  {
    id: 'rfk-1968',
    title: 'Robert F. Kennedy',
    description: 'RFK 1968 presidential campaign and assassination timeline.',
    visibility: 'public',
    seedFn: seedRFKTimeline
  },
  {
    id: 'jfk-presidency',
    title: 'John F. Kennedy',
    description: 'JFK presidency key events and assassination timeline.',
    visibility: 'public',
    seedFn: seedJFKTimeline
  },
  {
    id: 'napoleon-bonaparte',
    title: 'Napoleon Bonaparte',
    description: 'Comprehensive Napoleon Bonaparte timeline from Henri Guillemin biography.',
    visibility: 'public',
    seedFn: seedNapoleonTimeline
  },
  {
    id: 'french-revolution',
    title: 'French Revolution',
    description: 'Comprehensive French Revolution timeline inspired by Henri Guillemin\'s analysis.',
    visibility: 'public',
    seedFn: seedFrenchRevolutionTimeline
  },
  {
    id: 'charles-de-gaulle',
    title: 'Charles de Gaulle',
    description: 'Charles de Gaulle comprehensive timeline (1890-1970).',
    visibility: 'public',
    seedFn: seedDeGaulleTimeline
  }
];

async function restoreTimelines() {
  console.log(`\nRestoring 5 timelines for cynako@gmail.com in ${envName} database...\n`);

  const timelinesBasePath = `users/${TARGET_USER_ID}/timelines`;

  for (const timeline of timelinesData) {
    const timelinePath = `${timelinesBasePath}/${timeline.id}`;
    const eventsPath = `${timelinePath}/events`;

    // Get events from seed function
    const events = timeline.seedFn();

    console.log(`Creating timeline: ${timeline.title} (${events.length} events)...`);

    // Create timeline document
    const now = new Date().toISOString();
    await db.doc(timelinePath).set({
      title: timeline.title,
      description: timeline.description,
      visibility: timeline.visibility,
      createdAt: now,
      updatedAt: now
    });

    // Create events in batches (Firestore batch limit is 500)
    const batchSize = 450;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = db.batch();
      const batchEvents = events.slice(i, i + batchSize);

      for (const event of batchEvents) {
        const eventRef = db.collection(eventsPath).doc(event.id);
        batch.set(eventRef, {
          id: event.id,
          title: event.title,
          description: event.description,
          date: event.date,
          ...(event.time && { time: event.time })
        });
      }

      await batch.commit();
    }

    console.log(`   Created ${events.length} events for "${timeline.title}"`);
  }

  console.log(`\nAll 5 timelines restored successfully!\n`);

  // Summary
  let totalEvents = 0;
  for (const timeline of timelinesData) {
    const events = timeline.seedFn();
    totalEvents += events.length;
    console.log(`   - ${timeline.title}: ${events.length} events`);
  }
  console.log(`\n   Total: ${totalEvents} events across 5 timelines\n`);

  await admin.app().delete();
}

restoreTimelines().catch(error => {
  console.error('Error restoring timelines:', error);
  admin.app().delete();
  process.exit(1);
});
