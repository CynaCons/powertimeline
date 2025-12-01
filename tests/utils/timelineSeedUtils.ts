import type { Firestore } from 'firebase-admin/firestore';
import { initFirestore } from './dbAdmin';
import { getTestUserUid, getTestUserEmail } from './authTestUtils';

type TimelineVisibility = 'public' | 'private' | 'unlisted';

interface TimelineSeedInput {
  title: string;
  slug: string;
  visibility?: TimelineVisibility;
  viewCount?: number;
  createdAt?: string;
  updatedAt?: string;
  description?: string;
  featured?: boolean;
  eventCount?: number;
}

const DEFAULT_USERNAME = process.env.TEST_USER_USERNAME || 'playwright-seed-user';
const DEFAULT_DESCRIPTION = 'Seeded via Playwright for feed regression tests';

function buildTimelineId(slug: string): string {
  return slug.startsWith('timeline-') ? slug : `timeline-${slug}`;
}

async function ensureUserProfile(db: Firestore, ownerId: string, email: string): Promise<string> {
  const userRef = db.collection('users').doc(ownerId);
  const snap = await userRef.get();

  const fallbackUsername = email.split('@')[0] || DEFAULT_USERNAME;
  const username = (snap.exists && (snap.data()?.username as string | undefined)) || fallbackUsername || DEFAULT_USERNAME;
  const createdAt = snap.exists ? snap.data()?.createdAt || new Date().toISOString() : new Date().toISOString();

  await userRef.set(
    {
      id: ownerId,
      email,
      username,
      createdAt,
      role: snap.data()?.role || 'user',
    },
    { merge: true }
  );

  return username;
}

/**
 * Seed timelines directly into Firestore using the Admin SDK.
 * Ensures the test user profile exists (with username) and writes timeline metadata.
 */
export async function seedTimelinesForTestUser(
  timelines: TimelineSeedInput[],
  options?: { ownerId?: string; ownerEmail?: string; description?: string }
): Promise<{ ownerId: string; username: string; timelineIds: string[] }> {
  const db = initFirestore('dev');
  const ownerId = options?.ownerId || getTestUserUid();
  const ownerEmail = options?.ownerEmail || getTestUserEmail();
  const username = await ensureUserProfile(db, ownerId, ownerEmail);

  const batch = db.batch();
  const baseTime = Date.now();
  const timelineIds: string[] = [];

  timelines.forEach((timeline, index) => {
    const docId = buildTimelineId(timeline.slug);
    const createdAt = timeline.createdAt || new Date(baseTime + index * 1000).toISOString();
    const updatedAt = timeline.updatedAt || createdAt;
    const ref = db.collection('users').doc(ownerId).collection('timelines').doc(docId);

    timelineIds.push(docId);
    batch.set(ref, {
      id: docId,
      ownerId,
      title: timeline.title,
      description: timeline.description || options?.description || DEFAULT_DESCRIPTION,
      createdAt,
      updatedAt,
      viewCount: timeline.viewCount ?? 0,
      visibility: timeline.visibility || 'public',
      featured: timeline.featured ?? false,
      eventCount: timeline.eventCount ?? 0,
    });
  });

  await batch.commit();
  return { ownerId, username, timelineIds };
}
