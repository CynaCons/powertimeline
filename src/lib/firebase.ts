// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBbLPldENZCEzrxj-yihb03KVyPAguUlBA",
  authDomain: "chronochart-da87a.firebaseapp.com",
  projectId: "chronochart-da87a",
  storageBucket: "chronochart-da87a.firebasestorage.app",
  messagingSenderId: "256415279975",
  appId: "1:256415279975:web:a75a451e81189019979dc2",
  measurementId: "G-HWJ2TYBHJK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };