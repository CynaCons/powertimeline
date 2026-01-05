import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { initializeFirestore, enableIndexedDbPersistence, memoryLocalCache, memoryLruGarbageCollector } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
// Analytics is lazy-loaded to reduce initial bundle size (P1-7)
import type { Analytics } from 'firebase/analytics';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Debug: Check if config is loaded
if (!firebaseConfig.projectId) {
  console.error('❌ Firebase config not loaded! Check .env.local file');
}

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Detect Safari/WebKit browser (has known issues with IndexedDB persistence in Firebase v12.x)
// See: Firebase JS SDK issue #8860, WebKit bug 273827
const isSafariOrWebKit = typeof window !== 'undefined' &&
  /WebKit/.test(navigator.userAgent) &&
  !/Chrome/.test(navigator.userAgent);

// Initialize Firestore with browser-specific settings
// Safari/WebKit: Use long-polling and memory cache to avoid IndexedDB hangs
// Other browsers: Standard initialization with IndexedDB persistence
let db: Firestore;

if (isSafariOrWebKit) {
  // Safari/WebKit: Use long-polling to avoid WebSocket issues and memory cache
  // to avoid IndexedDB persistence hangs (known Firebase v12.x + WebKit issue)
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    localCache: memoryLocalCache({
      garbageCollector: memoryLruGarbageCollector({ cacheSizeBytes: 40_000_000 })  // 40MB limit
    }),
  });
  if (typeof window !== 'undefined') {
    console.info('Firebase: Using long-polling mode for Safari/WebKit compatibility');
  }
} else {
  // Standard initialization for Chromium-based browsers
  db = initializeFirestore(app, {});

  // Enable offline persistence (only for non-Safari browsers)
  if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time
        console.warn('Firebase persistence unavailable: multiple tabs open');
      } else if (err.code === 'unimplemented') {
        // Browser doesn't support persistence
        console.warn('Firebase persistence unavailable: browser not supported');
      } else {
        console.error('Firebase persistence error:', err);
      }
    });
  }
}

// Lazy-load Analytics to reduce initial bundle size (P1-7)
// Analytics is only initialized on first use, not on app load
let analytics: Analytics | null = null;

export const getAnalyticsInstance = async (): Promise<Analytics | null> => {
  if (!analytics && typeof window !== 'undefined') {
    try {
      const { getAnalytics } = await import('firebase/analytics');
      analytics = getAnalytics(app);
    } catch (err) {
      console.error('Failed to load Firebase Analytics:', err);
    }
  }
  return analytics;
};

// Connection status utility
export const getOnlineStatus = () => navigator.onLine;

// Export analytics as null initially - use getAnalyticsInstance() for lazy access
export { app, db, analytics };
