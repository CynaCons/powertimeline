// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBbLPldENZCEzrxj-yihb03KVyPAguUlBA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "chronochart-da87a.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "chronochart-da87a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "chronochart-da87a.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "256415279975",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:256415279975:web:a75a451e81189019979dc2",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-HWJ2TYBHJK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };