import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from '../powertimeline-860f1-firebase-adminsdk-fbsvc-933b603f7d.json' assert { type: 'json' };

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkTimelines() {
  const timelinesSnapshot = await db.collectionGroup('timelines').get();

  console.log(`Found ${timelinesSnapshot.size} timelines:\n`);

  timelinesSnapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`Document ID: ${doc.id}`);
    console.log(`  ALL FIELDS:`, data);
    console.log('');
  });
}

checkTimelines().catch(console.error);
