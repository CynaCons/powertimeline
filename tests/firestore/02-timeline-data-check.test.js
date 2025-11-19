/**
 * Check what data is actually in the timelines
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc } from 'firebase/firestore';
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

async function checkTimelineData() {
  console.log('Checking timeline data...\n');

  try {
    // Try to read a specific timeline we know exists
    // From verification: cynacons has 5 timelines
    const timelineRef = doc(db, 'users', 'cynacons', 'timelines', 'timeline-powertimeline-product-roadmap');
    const timelineDoc = await getDoc(timelineRef);

    if (timelineDoc.exists()) {
      console.log('✅ Found timeline:', timelineDoc.id);
      const data = timelineDoc.data();
      console.log('\nTimeline data:');
      console.log('  - title:', data.title);
      console.log('  - ownerId:', data.ownerId);
      console.log('  - visibility:', data.visibility);
      console.log('  - featured:', data.featured);
      console.log('  - viewCount:', data.viewCount);
      console.log('\nFull data:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Timeline not found');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

checkTimelineData();
