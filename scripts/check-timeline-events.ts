import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from '../powertimeline-dev-firebase-adminsdk-fbsvc-adcd3de895.json' assert { type: 'json' };

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkTimelineEvents() {
  const timelineId = 'timeline-french-revolution';
  const ownerId = 'cynacons';

  console.log(`Checking events for timeline: ${timelineId}, owner: ${ownerId}\n`);

  // Check if timeline exists
  const timelineRef = db.collection('users').doc(ownerId).collection('timelines').doc(timelineId);
  const timelineDoc = await timelineRef.get();

  if (!timelineDoc.exists) {
    console.log('Timeline document not found!');
    return;
  }

  console.log('Timeline data:', timelineDoc.data());
  console.log('\nChecking events subcollection...\n');

  // Check events subcollection
  const eventsSnapshot = await timelineRef.collection('events').get();

  console.log(`Found ${eventsSnapshot.size} events in subcollection`);

  eventsSnapshot.docs.forEach(doc => {
    console.log(`Event ID: ${doc.id}`);
    console.log(`  Data:`, doc.data());
    console.log('');
  });
}

checkTimelineEvents().catch(console.error);
