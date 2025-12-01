/**
 * Check CynaCons user data
 * Run with: npx tsx scripts/check-cynacons.ts
 */

import { db } from './firebase-node';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

async function checkCynaCons() {
  console.log('🔍 Checking CynaCons account...\n');

  try {
    // Get cynacons user
    const userDoc = await getDoc(doc(db, 'users', 'cynacons'));

    if (!userDoc.exists()) {
      console.log('❌ CynaCons user not found!');
      return;
    }

    const userData = userDoc.data();
    console.log('👤 CynaCons User:');
    console.log(`   ID: cynacons`);
    console.log(`   Username: "${userData.username}"`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Role: ${userData.role || 'user'}`);
    console.log(`   Created: ${userData.createdAt}`);
    console.log();

    // Get timelines
    const timelinesSnapshot = await getDocs(
      collection(db, 'users', 'cynacons', 'timelines')
    );

    console.log(`📁 Total Timelines: ${timelinesSnapshot.size}\n`);

    if (timelinesSnapshot.size > 0) {
      console.log('Timeline List:');
      timelinesSnapshot.docs.forEach((doc, index) => {
        const timeline = doc.data();
        console.log(`\n${index + 1}. ${doc.id}`);
        console.log(`   Title: "${timeline.title}"`);
        console.log(`   Events: ${timeline.eventCount || 0}`);
        console.log(`   Visibility: ${timeline.visibility}`);
        console.log(`   Updated: ${new Date(timeline.updatedAt).toLocaleString()}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

checkCynaCons();
