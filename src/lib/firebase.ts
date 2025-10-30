import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import type { Analytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBdN2dbVi1wHnBJyaWrW-KEI18kQlsD3_c",
  authDomain: "powertimeline-860f1.firebaseapp.com",
  projectId: "powertimeline-860f1",
  storageBucket: "powertimeline-860f1.firebasestorage.app",
  messagingSenderId: "480635471085",
  appId: "1:480635471085:web:b959dea1cc33945ca638e4",
  measurementId: "G-G2C76ZT1PG"
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firestore
const db: Firestore = getFirestore(app);

// Initialize Analytics (only in browser environment)
let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, db, analytics };
