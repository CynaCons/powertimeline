import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from '../powertimeline-dev-firebase-adminsdk-fbsvc-adcd3de895.json' assert { type: 'json' };

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

async function check() {
  const userId = 'HL3gR4MbXKe4gPc4vUwksaoKEn93';
  const timelineId = 'french-revolution';

  const ref = db.collection('users').doc(userId).collection('timelines').doc(timelineId);
  const doc = await ref.get();

  if (doc.exists) {
    console.log('✅ Document exists!');
    console.log('Document ID:', doc.id);
    console.log('Document path:', doc.ref.path);
    const data = doc.data();
    console.log('\nDocument fields:');
    console.log('  id:', data?.id || '❌ MISSING');
    console.log('  ownerId:', data?.ownerId || '❌ MISSING');
    console.log('  title:', data?.title);
    console.log('  visibility:', data?.visibility || '❌ MISSING');
    console.log('\nFull data:');
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log('❌ Document does NOT exist at path:', ref.path);
  }
}

check().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
