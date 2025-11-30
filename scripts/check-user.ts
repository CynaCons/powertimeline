import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from '../powertimeline-dev-firebase-adminsdk-fbsvc-adcd3de895.json' assert { type: 'json' };

const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore(app);

async function checkUser() {
  const uid = process.argv[2] || 'HL3gR4MbXKe4gPc4vUwksaoKEn93';
  const userDoc = await db.collection('users').doc(uid).get();
  console.log(`User "${uid}" exists:`, userDoc.exists);

  if (userDoc.exists) {
    console.log('User data:', JSON.stringify(userDoc.data(), null, 2));
  }

  // Also check for username lookup
  const usernameSnap = await db.collection('usernames').get();
  console.log('\nAll usernames:');
  usernameSnap.forEach(doc => {
    console.log(`  ${doc.id} -> ${doc.data().uid}`);
  });
}

checkUser().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
