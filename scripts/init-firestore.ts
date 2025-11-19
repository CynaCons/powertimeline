/**
 * Initialize Firestore with demo users and sample timelines
 * Run with: npx tsx scripts/init-firestore.ts
 *
 * This replaces localStorage with fresh Firestore data
 */

import { db } from './firebase-node';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import type { User, Timeline } from '../src/types';

const DEMO_USERS: User[] = [
  {
    id: 'cynacons',
    name: 'CynaCons',
    email: 'cynacons@powertimeline.dev',
    avatar: '👨‍💻',
    bio: 'Platform creator and timeline enthusiast',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'alice',
    name: 'Alice',
    email: 'alice@powertimeline.dev',
    avatar: '👩‍🎨',
    bio: 'History teacher and timeline creator',
    role: 'user',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bob',
    name: 'Bob',
    email: 'bob@powertimeline.dev',
    avatar: '👨‍🔬',
    bio: 'Science historian',
    role: 'user',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'charlie',
    name: 'Charlie',
    email: 'charlie@powertimeline.dev',
    avatar: '👨‍🏫',
    bio: 'World history enthusiast',
    role: 'user',
    createdAt: new Date().toISOString(),
  },
];

const DEMO_TIMELINES: Timeline[] = [
  {
    id: 'timeline-french-revolution',
    title: 'French Revolution',
    description: 'Comprehensive timeline of the French Revolution (1789-1799)',
    ownerId: 'cynacons',
    visibility: 'public',
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 156,
    featured: false,
    events: [], // Will be populated from existing seed data later
  },
  {
    id: 'timeline-world-war-2',
    title: 'World War II',
    description: 'Major events of World War II (1939-1945)',
    ownerId: 'alice',
    visibility: 'public',
    createdAt: new Date('2024-02-20').toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 89,
    featured: false,
    events: [],
  },
  {
    id: 'timeline-space-race',
    title: 'Space Race',
    description: 'US-Soviet competition in space exploration',
    ownerId: 'bob',
    visibility: 'public',
    createdAt: new Date('2024-03-10').toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 67,
    featured: false,
    events: [],
  },
];

async function initFirestore() {
  console.log('🔥 Initializing Firestore with demo data...\n');

  try {
    // Step 1: Create users
    console.log('👥 Creating demo users...');
    for (const user of DEMO_USERS) {
      await setDoc(doc(db, 'users', user.id), user);
      console.log(`   ✅ Created user: ${user.name} (${user.id})`);
    }

    // Step 2: Create timelines
    console.log('\n📅 Creating demo timelines...');
    for (const timeline of DEMO_TIMELINES) {
      await setDoc(doc(db, 'timelines', timeline.id), timeline);
      console.log(`   ✅ Created timeline: ${timeline.title} (${timeline.id})`);
    }

    // Step 3: Verify
    console.log('\n🔍 Verifying data...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const timelinesSnapshot = await getDocs(collection(db, 'timelines'));

    console.log(`   ✅ Users in Firestore: ${usersSnapshot.size}`);
    console.log(`   ✅ Timelines in Firestore: ${timelinesSnapshot.size}`);

    console.log('\n✨ Firestore initialization complete!\n');
    console.log('📋 Next steps:');
    console.log('   1. Start dev server: npm run dev');
    console.log('   2. Components will now use Firestore instead of localStorage');
    console.log('   3. Test creating/editing timelines and events\n');

  } catch (error) {
    console.error('\n❌ Error initializing Firestore:', error);
    console.log('\n🔧 Make sure:');
    console.log('   1. Firestore rules are set to permissive (allow all)');
    console.log('   2. Firebase config in .env.local is correct');
    console.log('   3. You have internet connection\n');
    process.exit(1);
  }
}

initFirestore();
