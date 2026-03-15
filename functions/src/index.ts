/**
 * PowerTimeline Cloud Functions
 * v0.5.22 - Platform Statistics Aggregation
 *
 * These functions maintain atomic counters in stats/platform document,
 * triggered by Firestore document events.
 *
 * Uses firebase-functions v2 API
 */

import { onDocumentCreated, onDocumentDeleted, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const STATS_DOC = db.doc("stats/platform");

// ============================================================================
// Helper: Atomic increment/decrement of stats fields
// ============================================================================

async function updateStats(
  updates: Record<string, admin.firestore.FieldValue>
): Promise<void> {
  try {
    await STATS_DOC.set(
      {
        ...updates,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    logger.error("Error updating stats:", error);
    throw error;
  }
}

// ============================================================================
// User Triggers
// ============================================================================

/**
 * Increment totalUsers when a new user document is created
 */
export const onUserCreate = onDocumentCreated("users/{userId}", async () => {
  logger.info("User created, incrementing totalUsers");
  await updateStats({
    totalUsers: admin.firestore.FieldValue.increment(1),
  });
});

/**
 * Decrement totalUsers when a user document is deleted
 */
export const onUserDelete = onDocumentDeleted("users/{userId}", async () => {
  logger.info("User deleted, decrementing totalUsers");
  await updateStats({
    totalUsers: admin.firestore.FieldValue.increment(-1),
  });
});

// ============================================================================
// Timeline Triggers
// ============================================================================

/**
 * Increment timeline counts when a new timeline is created
 * Also increments visibility-specific counter
 */
export const onTimelineCreate = onDocumentCreated(
  "users/{userId}/timelines/{timelineId}",
  async (event) => {
    const timeline = event.data?.data();
    if (!timeline) return;

    const visibility = timeline.visibility || "public";

    logger.info(`Timeline created (${visibility}), incrementing counts`);

    const updates: Record<string, admin.firestore.FieldValue> = {
      totalTimelines: admin.firestore.FieldValue.increment(1),
    };

    // Increment visibility-specific counter
    if (visibility === "public") {
      updates.publicTimelines = admin.firestore.FieldValue.increment(1);
    } else if (visibility === "unlisted") {
      updates.unlistedTimelines = admin.firestore.FieldValue.increment(1);
    } else if (visibility === "private") {
      updates.privateTimelines = admin.firestore.FieldValue.increment(1);
    }

    await updateStats(updates);
  }
);

/**
 * Decrement timeline counts when a timeline is deleted
 * Also decrements visibility-specific counter
 */
export const onTimelineDelete = onDocumentDeleted(
  "users/{userId}/timelines/{timelineId}",
  async (event) => {
    const timeline = event.data?.data();
    if (!timeline) return;

    const visibility = timeline.visibility || "public";

    logger.info(`Timeline deleted (${visibility}), decrementing counts`);

    const updates: Record<string, admin.firestore.FieldValue> = {
      totalTimelines: admin.firestore.FieldValue.increment(-1),
    };

    // Decrement visibility-specific counter
    if (visibility === "public") {
      updates.publicTimelines = admin.firestore.FieldValue.increment(-1);
    } else if (visibility === "unlisted") {
      updates.unlistedTimelines = admin.firestore.FieldValue.increment(-1);
    } else if (visibility === "private") {
      updates.privateTimelines = admin.firestore.FieldValue.increment(-1);
    }

    await updateStats(updates);
  }
);

/**
 * Handle visibility changes on timeline update
 * Adjusts visibility counters when visibility changes
 */
export const onTimelineUpdate = onDocumentUpdated(
  "users/{userId}/timelines/{timelineId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    const oldVisibility = before.visibility || "public";
    const newVisibility = after.visibility || "public";

    // Only update if visibility changed
    if (oldVisibility === newVisibility) {
      return;
    }

    logger.info(
      `Timeline visibility changed: ${oldVisibility} -> ${newVisibility}`
    );

    // Use a transaction for safe counter updates
    const statsRef = STATS_DOC;

    await db.runTransaction(async (transaction) => {
      const statsDoc = await transaction.get(statsRef);
      const stats = statsDoc.data() || {};

      // Decrement old visibility counter
      const decrementField = `${oldVisibility}Timelines`;
      const incrementField = `${newVisibility}Timelines`;

      const currentDecrement = stats[decrementField] || 0;
      const currentIncrement = stats[incrementField] || 0;

      transaction.update(statsRef, {
        [decrementField]: Math.max(0, currentDecrement - 1),
        [incrementField]: currentIncrement + 1,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  }
);

// ============================================================================
// Event Triggers
// ============================================================================

/**
 * Increment totalEvents when a new event is created
 */
export const onEventCreate = onDocumentCreated(
  "users/{userId}/timelines/{timelineId}/events/{eventId}",
  async () => {
    logger.info("Event created, incrementing totalEvents");
    await updateStats({
      totalEvents: admin.firestore.FieldValue.increment(1),
    });
  }
);

/**
 * Decrement totalEvents when an event is deleted
 */
export const onEventDelete = onDocumentDeleted(
  "users/{userId}/timelines/{timelineId}/events/{eventId}",
  async () => {
    logger.info("Event deleted, decrementing totalEvents");
    await updateStats({
      totalEvents: admin.firestore.FieldValue.increment(-1),
    });
  }
);

// ============================================================================
// Stats Initialization (HTTP callable for admin use)
// ============================================================================

/**
 * Initialize or recalculate stats from scratch
 * Call this once after deploying to bootstrap counters from existing data
 */
export const initializeStats = onCall(async (request) => {
  // Only allow authenticated admins
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Must be authenticated to initialize stats"
    );
  }

  // Check if user is admin
  const userDoc = await db.doc(`users/${request.auth.uid}`).get();
  const userData = userDoc.data();
  if (!userData || userData.role !== "admin") {
    throw new HttpsError(
      "permission-denied",
      "Must be admin to initialize stats"
    );
  }

  logger.info("Initializing stats from scratch");

  // Count users
  const usersSnapshot = await db.collection("users").get();
  const totalUsers = usersSnapshot.size;

  // Count timelines and events (requires collection group query)
  const timelinesSnapshot = await db.collectionGroup("timelines").get();
  let totalTimelines = 0;
  let publicTimelines = 0;
  let unlistedTimelines = 0;
  let privateTimelines = 0;
  let totalViews = 0;

  timelinesSnapshot.forEach((doc) => {
    const data = doc.data();
    totalTimelines++;
    totalViews += data.viewCount || 0;

    const visibility = data.visibility || "public";
    if (visibility === "public") publicTimelines++;
    else if (visibility === "unlisted") unlistedTimelines++;
    else if (visibility === "private") privateTimelines++;
  });

  // Count events
  const eventsSnapshot = await db.collectionGroup("events").get();
  const totalEvents = eventsSnapshot.size;

  // Write stats
  await STATS_DOC.set({
    totalUsers,
    totalTimelines,
    totalEvents,
    totalViews,
    publicTimelines,
    unlistedTimelines,
    privateTimelines,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
  });

  logger.info("Stats initialized:", {
    totalUsers,
    totalTimelines,
    totalEvents,
    totalViews,
    publicTimelines,
    unlistedTimelines,
    privateTimelines,
  });

  return {
    success: true,
    stats: {
      totalUsers,
      totalTimelines,
      totalEvents,
      totalViews,
      publicTimelines,
      unlistedTimelines,
      privateTimelines,
    },
  };
});

// ============================================================================
// Sitemap Generation (HTTP endpoint for SEO)
// ============================================================================

const BASE_URL = "https://powertimeline.com";

/**
 * Generate XML sitemap for search engine crawlers
 * Lists static pages, user profiles, and public timelines
 */
export const sitemap = onRequest(async (_req, res) => {
  try {
    interface SitemapEntry {
      loc: string;
      priority: string;
      lastmod?: string;
    }

    // Static pages
    const staticPages: SitemapEntry[] = [
      { loc: `${BASE_URL}/`, priority: "1.0" },
      { loc: `${BASE_URL}/browse`, priority: "0.9" },
    ];

    // Fetch user profiles
    const usersSnapshot = await db.collection("users").get();
    const userPages: SitemapEntry[] = [];
    const userMap = new Map<string, string>(); // userId -> username
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.username) {
        userMap.set(doc.id, data.username);
        userPages.push({
          loc: `${BASE_URL}/${data.username}`,
          priority: "0.7",
        });
      }
    });

    // Fetch public timelines
    const timelinesSnapshot = await db
      .collectionGroup("timelines")
      .where("visibility", "==", "public")
      .get();

    const timelinePages: SitemapEntry[] = [];
    timelinesSnapshot.forEach((doc) => {
      const data = doc.data();
      const ownerUsername = data.ownerUsername || userMap.get(data.ownerId);
      if (!ownerUsername) return; // Skip timelines without resolvable username

      const lastmod = data.updatedAt
        ? new Date(data.updatedAt).toISOString().split("T")[0]
        : undefined;

      timelinePages.push({
        loc: `${BASE_URL}/${ownerUsername}/timeline/${doc.id}`,
        lastmod,
        priority: "0.8",
      });
    });

    // Build XML
    const urls = [...staticPages, ...userPages, ...timelinePages];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

    res.set("Content-Type", "application/xml");
    res.set("Cache-Control", "public, max-age=3600");
    res.status(200).send(xml);
  } catch (error) {
    logger.error("Error generating sitemap:", error);
    res.status(500).send("Error generating sitemap");
  }
});
