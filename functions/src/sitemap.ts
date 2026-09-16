import { logger } from "firebase-functions/v2";
import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import {
  buildSitemapXml,
  staticSitemapEntries,
  timelineSitemapEntry,
  userSitemapEntry,
  type SitemapEntry,
  type TimelineSitemapInput,
} from "./lib/sitemap";
import { isPubliclyListed } from "./lib/visibility";

const MAX_DOCS = 5000;

export async function generateSitemapXml(
  db: Firestore,
  baseUrl: string
): Promise<string> {
  const entries: SitemapEntry[] = [...staticSitemapEntries(baseUrl)];
  const usernameById = new Map<string, string>();

  try {
    const usersSnapshot = await db.collection("users").limit(MAX_DOCS).get();
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      const entry = userSitemapEntry(baseUrl, data.username);
      if (entry && typeof data.username === "string") {
        usernameById.set(doc.id, data.username);
        entries.push(entry);
      }
    });
  } catch (error) {
    logger.warn(
      "Sitemap: failed to list users; continuing without profile URLs",
      error
    );
  }

  const timelines = await fetchPublicTimelines(db);
  for (const timeline of timelines) {
    const entry = timelineSitemapEntry(baseUrl, timeline, usernameById);
    if (entry) entries.push(entry);
  }

  return buildSitemapXml(entries);
}

async function fetchPublicTimelines(
  db: Firestore
): Promise<TimelineSitemapInput[]> {
  try {
    const snapshot = await db.collectionGroup("timelines").limit(MAX_DOCS).get();
    return snapshot.docs
      .map(toTimelineInput)
      .filter((timeline) => isPubliclyListed(timeline.visibility));
  } catch (scanError) {
    logger.warn(
      "Sitemap: collection-group scan failed; trying visibility-filtered query",
      scanError
    );
  }

  try {
    const snapshot = await db
      .collectionGroup("timelines")
      .where("visibility", "==", "public")
      .limit(MAX_DOCS)
      .get();
    return snapshot.docs.map(toTimelineInput);
  } catch (indexedError) {
    logger.error(
      "Sitemap: failed to list timelines; returning pages without timeline URLs",
      indexedError
    );
    return [];
  }
}

function toTimelineInput(doc: QueryDocumentSnapshot): TimelineSitemapInput {
  const data = doc.data();
  const ownerId =
    (typeof data.ownerId === "string" && data.ownerId) ||
    doc.ref.parent.parent?.id;
  return {
    id: typeof data.id === "string" && data.id ? data.id : doc.id,
    ownerUsername: data.ownerUsername,
    ownerId,
    visibility: data.visibility,
    updatedAt: data.updatedAt,
  };
}
