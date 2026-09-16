/**
 * PowerTimeline Cloud Functions
 * v0.6.0 - Platform Statistics + Timeline Automation API
 *
 * These functions maintain atomic counters in stats/platform document,
 * triggered by Firestore document events. Also provides the Timeline
 * Automation API for programmatic event management via API tokens.
 *
 * Uses firebase-functions v2 API
 */

import { onDocumentCreated, onDocumentDeleted, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { generateToken, revokeToken } from "./tokenService";
import { generateSitemapXml } from "./sitemap";
import { emptyUrlsetXml } from "./lib/sitemap";
import { renderPublicTimelineResponse } from "./prerender";

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
const OG_IMAGE_URL = `${BASE_URL}/assets/images/PowerTimeline_banner.png`;

function requestPath(req: { path?: string; url?: string; header: (name: string) => string | undefined }): string {
  const forwarded = req.header("x-forwarded-uri") || req.header("x-original-url");
  if (forwarded) {
    try {
      return new URL(forwarded, BASE_URL).pathname;
    } catch {
      return forwarded.split("?")[0];
    }
  }
  return (req.path || req.url || "/").split("?")[0];
}

/**
 * Generate XML sitemap for search engine crawlers.
 * Soft-fails: always returns 200 + a valid urlset, even if Firestore queries fail.
 */
export const sitemap = onRequest(
  { cors: true, timeoutSeconds: 60, invoker: "public" },
  async (_req, res) => {
  res.set("Content-Type", "application/xml; charset=utf-8");
  res.set("Cache-Control", "public, max-age=3600");
  try {
    const xml = await generateSitemapXml(db, BASE_URL);
    res.status(200).send(xml);
  } catch (error) {
    logger.error("Error generating sitemap; returning empty urlset", error);
    res.status(200).send(emptyUrlsetXml());
  }
});

/**
 * Prerender public/unlisted timeline + embed routes, and static tool-intent
 * marketing pages, so crawlers and JS-off clients see real text instead of
 * an empty #root SPA shell.
 */
export const renderPublicTimeline = onRequest(
  { cors: true, timeoutSeconds: 30, invoker: "public" },
  async (req, res) => {
    const result = await renderPublicTimelineResponse({
      db,
      path: requestPath(req),
      baseUrl: BASE_URL,
      ogImageUrl: OG_IMAGE_URL,
      fetchShell: async () => {
        const response = await fetch(`${BASE_URL}/`);
        if (!response.ok) {
          throw new Error(`SPA shell HTTP ${response.status}`);
        }
        return response.text();
      },
    });
    res.set("Content-Type", "text/html; charset=utf-8");
    res.set("Cache-Control", result.cacheControl);
    res.status(result.status).send(result.html);
  }
);

// ============================================================================
// Timeline Automation API
// ============================================================================

// Re-export the HTTP API endpoint
export { api } from "./api";

/**
 * Generate a new API token for the authenticated user.
 * Returns the raw token — shown to the user exactly once.
 */
export const generateApiToken = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Must be authenticated to generate an API token"
    );
  }

  const label =
    typeof request.data?.label === "string"
      ? request.data.label.trim().slice(0, 100)
      : "API Token";

  const rawToken = await generateToken(request.auth.uid, label);

  logger.info(`API token generated for user ${request.auth.uid}`);
  return { token: rawToken };
});

/**
 * Revoke the authenticated user's API token.
 */
export const revokeApiToken = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Must be authenticated to revoke an API token"
    );
  }

  const revoked = await revokeToken(request.auth.uid);

  logger.info(
    `API token revocation for user ${request.auth.uid}: ${revoked ? "success" : "no token found"}`
  );
  return { success: true, revoked };
});
