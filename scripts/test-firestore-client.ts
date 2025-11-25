import { initializeApp } from 'firebase/app';
import { getFirestore, collectionGroup, query, where, limit, getDocs } from 'firebase/firestore';

// Firebase configuration - from .env.local
const firebaseConfig = {
  apiKey: "AIzaSyD15zHW_XKl0upEKuWwVMUbiQ7RIFZSkeE",
  authDomain: "powertimeline-dev.firebaseapp.com",
  projectId: "powertimeline-dev",
  storageBucket: "powertimeline-dev.firebasestorage.app",
  messagingSenderId: "1062110831256",
  appId: "1:1062110831256:web:ac0a3615d61fda1f4726ed"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testPublicTimelineAccess() {
  console.log('Testing public timeline access WITHOUT authentication...\n');

  try {
    const timelineId = 'timeline-french-revolution';
    console.log(`Attempting to fetch timeline: ${timelineId}`);

    const q = query(
      collectionGroup(db, 'timelines'),
      where('id', '==', timelineId),
      limit(1)
    );

    console.log('Executing collectionGroup query...');
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('❌ No timeline found!');
    } else {
      console.log('✅ Timeline found!');
      const doc = querySnapshot.docs[0];
      console.log('Document ID:', doc.id);
      console.log('Data:', doc.data());
    }
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error code:', (error as any).code);
    console.error('Error message:', (error as any).message);
  }

  process.exit(0);
}

testPublicTimelineAccess();
