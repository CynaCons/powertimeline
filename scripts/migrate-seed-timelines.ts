/**
 * Migrate the 5 main seed timelines to Firestore
 * Run with: npx tsx scripts/migrate-seed-timelines.ts
 */

import { db } from './firebase-node';
import { doc, setDoc } from 'firebase/firestore';
import type { Timeline } from '../src/types';

// Import seed functions
import { seedFrenchRevolutionTimeline } from '../src/lib/devSeed';
import { seedRFKTimeline } from '../src/lib/devSeed';
import { seedJFKTimeline } from '../src/lib/devSeed';
import { seedNapoleonTimeline } from '../src/lib/devSeed';
import { seedDeGaulleTimeline } from '../src/lib/devSeed';

const OWNER_ID = 'cynacons'; // Your user ID

async function migrateTimeline(
  id: string,
  title: string,
  description: string,
  seedFunction: () => any[]
) {
  try {
    console.log(`\n📅 Migrating: ${title}...`);

    const events = seedFunction();
    console.log(`   - Found ${events.length} events`);

    const timeline: Timeline = {
      id,
      title,
      description,
      ownerId: OWNER_ID,
      visibility: 'public',
      events,
      viewCount: 0,
      featured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'timelines', id), timeline);
    console.log(`   ✅ Migrated: ${title} (${events.length} events)`);

    return { success: true, timeline };
  } catch (error) {
    console.error(`   ❌ Failed to migrate ${title}:`, error);
    return { success: false, error };
  }
}

async function migrateAllTimelines() {
  console.log('🔄 Migrating 5 main seed timelines to Firestore...\n');

  const timelines = [
    {
      id: 'timeline-french-revolution',
      title: 'French Revolution',
      description: 'Comprehensive timeline of the French Revolution (1789-1799) with Henri Guillemin perspective',
      seedFn: seedFrenchRevolutionTimeline,
    },
    {
      id: 'timeline-napoleon',
      title: 'Napoleon Bonaparte',
      description: 'Timeline of Napoleon Bonaparte from rise to fall',
      seedFn: seedNapoleonTimeline,
    },
    {
      id: 'timeline-de-gaulle',
      title: 'Charles de Gaulle',
      description: 'Timeline of Charles de Gaulle, French general and statesman',
      seedFn: seedDeGaulleTimeline,
    },
    {
      id: 'timeline-rfk',
      title: 'Robert F. Kennedy',
      description: 'Timeline of Robert F. Kennedy, US Attorney General and Senator',
      seedFn: seedRFKTimeline,
    },
    {
      id: 'timeline-jfk',
      title: 'John F. Kennedy',
      description: 'Timeline of John F. Kennedy, 35th President of the United States',
      seedFn: seedJFKTimeline,
    },
  ];

  let successCount = 0;
  let totalEvents = 0;

  for (const { id, title, description, seedFn } of timelines) {
    const result = await migrateTimeline(id, title, description, seedFn);
    if (result.success && result.timeline) {
      successCount++;
      totalEvents += result.timeline.events.length;
    }
  }

  console.log('\n✨ Migration Complete!');
  console.log(`   📊 ${successCount}/5 timelines migrated`);
  console.log(`   📅 ${totalEvents} total events`);
  console.log(`   👤 Owner: ${OWNER_ID}\n`);
}

migrateAllTimelines();
