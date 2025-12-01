/**
 * Check user data in Firestore
 * Run with: npx tsx scripts/check-user-data.ts
 */

import { db } from './firebase-node';
import { collection, getDocs } from 'firebase/firestore';

async function checkUserData() {
  console.log('🔍 Checking CynaCons user data...\n');

  try {
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`📊 Total users: ${usersSnapshot.size}\n`);

    // Find CynaCons
    const cynaCons = usersSnapshot.docs.find(doc => doc.id === 'user-01');

    if (cynaCons) {
      const userData = cynaCons.data();
      console.log('👤 CynaCons User (user-01):');
      console.log(`   ID: ${cynaCons.id}`);
      console.log(`   Username: "${userData.username}"`);
      console.log(`   Email: ${userData.email}`);
      console.log(`   Role: ${userData.role || 'user'}`);
      console.log(`   Created: ${userData.createdAt}`);
      console.log();

      // Get timelines for this user
      const timelinesSnapshot = await getDocs(
        collection(db, 'users', cynaCons.id, 'timelines')
      );

      console.log(`📁 Timelines for CynaCons: ${timelinesSnapshot.size}\n`);

      timelinesSnapshot.docs.forEach((doc, index) => {
        const timeline = doc.data();
        console.log(`${index + 1}. ${doc.id}`);
        console.log(`   Title: "${timeline.title}"`);
        console.log(`   Description: ${timeline.description?.substring(0, 60)}...`);
        console.log(`   Events: ${timeline.eventCount || 0}`);
        console.log(`   Visibility: ${timeline.visibility}`);
        console.log(`   Created: ${timeline.createdAt}`);
        console.log(`   Updated: ${timeline.updatedAt}`);
        console.log();
      });
    } else {
      console.log('❌ CynaCons user (user-01) not found!');
    }

    // Check all users
    console.log('\n📋 All Users:');
    usersSnapshot.docs.forEach(doc => {
      const user = doc.data();
      console.log(`   - ${doc.id}: "${user.username}" (${user.role || 'user'})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

checkUserData();
