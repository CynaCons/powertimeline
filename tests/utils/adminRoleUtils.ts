/**
 * Admin role utilities for tests
 * Uses Firebase Admin SDK to ensure the test user has role: 'admin'
 * Safe defaults: falls back to dev service account JSON if env vars not provided.
 */

import fs from 'fs';
import path from 'path';
import { getApps, initializeApp, cert, type AppOptions } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function initAdmin(): boolean {
  if (getApps().length > 0) {
    return true;
  }

  const credentialJson = process.env.FIREBASE_ADMIN_CREDENTIALS_JSON;
  const candidatePaths = [
    process.env.FIREBASE_ADMIN_CREDENTIALS_PATH,
    path.resolve(process.cwd(), 'powertimeline-dev-firebase-adminsdk-fbsvc-adcd3de895.json'),
    path.resolve(process.cwd(), 'powertimeline-860f1-firebase-adminsdk-fbsvc-933b603f7d.json'),
  ].filter(Boolean) as string[];

  try {
    const options: AppOptions =
      credentialJson
        ? { credential: cert(JSON.parse(credentialJson)) }
        : (() => {
            for (const p of candidatePaths) {
              if (fs.existsSync(p)) {
                return { credential: cert(JSON.parse(fs.readFileSync(p, 'utf8'))) };
              }
            }
            return {};
          })();

    if (!options.credential) {
      console.warn('Admin init skipped: no credentials found for Firebase Admin SDK');
      return false;
    }

    initializeApp(options);
    return true;
  } catch (error) {
    console.warn('Admin init failed:', error);
    return false;
  }
}

/**
 * Ensure the given user has role: 'admin' in Firestore users collection.
 * Returns true if role is admin or was successfully updated.
 */
export async function ensureAdminRoleForTestUser(uid: string, email?: string): Promise<boolean> {
  if (!initAdmin()) {
    return false;
  }

  try {
    const db = getFirestore();
    const userRef = db.collection('users').doc(uid);
    const snap = await userRef.get();

    if (!snap.exists) {
      await userRef.set({
        id: uid,
        email: email || '',
        role: 'admin',
        createdAt: new Date().toISOString(),
      });
      return true;
    }

    const data = snap.data();
    if (data?.role === 'admin') {
      return true;
    }

    await userRef.update({ role: 'admin' });
    return true;
  } catch (error) {
    console.warn('Unable to ensure admin role for test user:', error);
    return false;
  }
}
