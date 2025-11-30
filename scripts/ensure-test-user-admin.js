/**
 * Ensure test user has admin role and seed minimal data (dev/test project).
 * Uses Firebase Admin SDK. Requires a service account JSON at one of:
 * - FIREBASE_ADMIN_CREDENTIALS_PATH env var
 * - powertimeline-dev-firebase-adminsdk-fbsvc-adcd3de895.json (repo root)
 * - powertimeline-860f1-firebase-adminsdk-fbsvc-933b603f7d.json (repo root)
 *
 * Usage:
 *   node scripts/ensure-test-user-admin.js
 *
 * Env (optional):
 *   TEST_USER_UID, TEST_USER_EMAIL, TEST_USER_PASSWORD
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_UID = process.env.TEST_USER_UID || 'iTMZ9n0IuzUSbhWfCaR86WsB2AC3';
const DEFAULT_EMAIL = process.env.TEST_USER_EMAIL || 'test@powertimeline.com';

const credentialPath =
  process.env.FIREBASE_ADMIN_CREDENTIALS_PATH ||
  ['powertimeline-dev-firebase-adminsdk-fbsvc-adcd3de895.json', 'powertimeline-860f1-firebase-adminsdk-fbsvc-933b603f7d.json']
    .map((p) => path.resolve(__dirname, '..', p))
    .find((p) => fs.existsSync(p));

if (!credentialPath) {
  console.error('❌ No service account JSON found. Set FIREBASE_ADMIN_CREDENTIALS_PATH or place the key in repo root.');
  process.exit(1);
}

if (getApps().length === 0) {
  initializeApp({ credential: cert(JSON.parse(fs.readFileSync(credentialPath, 'utf8'))) });
}

const db = getFirestore();

async function ensureAdminUser(uid, email) {
  const userRef = db.collection('users').doc(uid);
  const snap = await userRef.get();

  if (!snap.exists) {
    await userRef.set({
      id: uid,
      email,
      role: 'admin',
      createdAt: new Date().toISOString(),
    });
    console.log(`✅ Created user ${uid} with admin role`);
  } else if (snap.data()?.role !== 'admin') {
    await userRef.update({ role: 'admin' });
    console.log(`✅ Updated user ${uid} to admin role`);
  } else {
    console.log(`ℹ️ User ${uid} already admin`);
  }
}

async function seedTimeline(uid) {
  const timelinesRef = db.collection('users').doc(uid).collection('timelines');
  const timelineId = 'timeline-seeded-smoke';
  const timelineRef = timelinesRef.doc(timelineId);
  const snap = await timelineRef.get();

  if (snap.exists) {
    console.log('ℹ️ Seed timeline already exists');
    return;
  }

  const now = new Date().toISOString();
  await timelineRef.set({
    id: timelineId,
    ownerId: uid,
    title: 'Seeded Smoke Timeline',
    description: 'Seeded timeline for test automation',
    visibility: 'public',
    eventCount: 1,
    viewCount: 0,
    createdAt: now,
    updatedAt: now,
  });

  const eventRef = timelineRef.collection('events').doc('event-seeded-1');
  await eventRef.set({
    id: 'event-seeded-1',
    title: 'Seeded Event',
    description: 'Smoke test event',
    date: '2025-01-01',
    visibility: 'public',
    timelineId,
    createdAt: now,
    updatedAt: now,
  });

  console.log('✅ Seeded timeline and event');
}

async function main() {
  await ensureAdminUser(DEFAULT_UID, DEFAULT_EMAIL);
  await seedTimeline(DEFAULT_UID);
  console.log('✅ Done');
}

main().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
