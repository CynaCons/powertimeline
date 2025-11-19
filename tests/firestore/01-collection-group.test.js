/**
 * Test collection group query to see exact error
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collectionGroup, query, orderBy, getDocs } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testCollectionGroup() {
  console.log('Testing collection group query...\n');

  try {
    // Try a simple collection group query without orderBy first
    console.log('1. Testing simple collection group query (no orderBy)...');
    const simpleQuery = query(collectionGroup(db, 'timelines'));
    const simpleResult = await getDocs(simpleQuery);
    console.log(`   ✅ Simple query worked! Found ${simpleResult.size} documents\n`);

    // Now try with orderBy
    console.log('2. Testing collection group query with orderBy...');
    const orderedQuery = query(
      collectionGroup(db, 'timelines'),
      orderBy('updatedAt', 'desc')
    );
    const orderedResult = await getDocs(orderedQuery);
    console.log(`   ✅ Ordered query worked! Found ${orderedResult.size} documents\n`);

    console.log('✨ All tests passed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('index')) {
      console.error('\n📝 This error suggests you need to create a Firestore index.');
      console.error('   The error message should contain a URL to create the index.');
      console.error('   Full error:', error);
    }
  }
}

testCollectionGroup();
