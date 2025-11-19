/**
 * Verify migration - check if old root timelines collection is empty
 * Run with: npx tsx scripts/verify-migration.ts
 */

import { db } from './firebase-node';
import { collection, getDocs, collectionGroup } from 'firebase/firestore';

async function verifyMigration() {
  console.log('🔍 Verifying migration...\n');

  // Check old root collection
  console.log('1️⃣ Checking old root "timelines" collection...');
  const rootTimelinesSnapshot = await getDocs(collection(db, 'timelines'));

  if (rootTimelinesSnapshot.empty) {
    console.log('   ✅ Root "timelines" collection is empty (cleaned up successfully)\n');
  } else {
    console.log(`   ⚠️  Found ${rootTimelinesSnapshot.size} documents still in root collection`);
    rootTimelinesSnapshot.docs.forEach(doc => {
      console.log(`      - ${doc.id}: ${doc.data().title}`);
    });
    console.log('');
  }

  // Check new nested structure
  console.log('2️⃣ Checking new nested structure (collection group query)...');
  const nestedTimelinesSnapshot = await getDocs(collectionGroup(db, 'timelines'));

  console.log(`   ✅ Found ${nestedTimelinesSnapshot.size} timelines in nested structure`);

  // Group by owner
  const byOwner = new Map<string, number>();
  nestedTimelinesSnapshot.docs.forEach(doc => {
    const ownerId = doc.data().ownerId;
    byOwner.set(ownerId, (byOwner.get(ownerId) || 0) + 1);
  });

  byOwner.forEach((count, ownerId) => {
    console.log(`      - ${ownerId}: ${count} timeline${count !== 1 ? 's' : ''}`);
  });

  console.log('\n✨ Verification complete!');
}

verifyMigration();
