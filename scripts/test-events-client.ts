import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, orderBy, query } from 'firebase/firestore';

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

async function testEventsSubcollection() {
  console.log('Testing events subcollection access WITHOUT authentication...\n');

  try {
    const timelineId = 'timeline-french-revolution';
    const ownerId = 'cynacons';
    console.log(`Attempting to fetch events for timeline: ${timelineId}, owner: ${ownerId}`);

    const eventsCollectionRef = collection(
      db,
      'users',
      ownerId,
      'timelines',
      timelineId,
      'events'
    );

    const q = query(eventsCollectionRef, orderBy('order', 'asc'));
    console.log('Executing events query...');
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('❌ No events found!');
    } else {
      console.log(`✅ Found ${querySnapshot.size} events!`);
      console.log('First event:', querySnapshot.docs[0].data());
    }
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error code:', (error as any).code);
    console.error('Error message:', (error as any).message);
  }

  process.exit(0);
}

testEventsSubcollection();
