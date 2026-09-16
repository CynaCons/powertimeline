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
import type { Response } from "express";
import { generateToken, revokeToken } from "./tokenService";
import {
  BASE_URL,
  MAX_CRAWLER_EVENTS,
  STATIC_SITEMAP_PAGES,
  buildSitemapXml,
  buildStandaloneHtml,
  injectTimelineSeo,
  isListedInSitemap,
  isShareable,
  parseTimelinePath,
  timelineCanonicalUrl,
  toLastmod,
  type SitemapEntry,
  type TimelineEventSeo,
  type TimelineSeoInput,
} from "./seo";

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

const SPA_INDEX_URL =
  process.env.SPA_INDEX_URL || `${BASE_URL}/index.html`;
const SPA_HTML_TTL_MS = 5 * 60 * 1000;
let spaHtmlCache: { html: string; fetchedAt: number } | null = null;

function sendSitemap(res: Response, entries: SitemapEntry[]): void {
  res.set("Content-Type", "application/xml; charset=utf-8");
  res.set("Cache-Control", "public, max-age=3600");
  res.status(200).send(buildSitemapXml(entries));
}

async function loadUserSitemapData(): Promise<{
  userPages: SitemapEntry[];
  userMap: Map<string, string>;
}> {
  const usersSnapshot = await db.collection("users").get();
  const userPages: SitemapEntry[] = [];
  const userMap = new Map<string, string>();
  usersSnapshot.forEach((doc) => {
    const data = doc.data();
    if (typeof data.username === "string" && data.username.trim()) {
      const username = data.username.trim();
      userMap.set(doc.id, username);
      userPages.push({
        loc: `${BASE_URL}/${encodeURIComponent(username)}`,
        priority: "0.7",
      });
    }
  });
  return { userPages, userMap };
}

async function loadPublicTimelineDocs(): Promise<admin.firestore.QueryDocumentSnapshot[]> {
  try {
    const indexed = await db
      .collectionGroup("timelines")
      .where("visibility", "==", "public")
      .get();
    return indexed.docs;
  } catch (error) {
    logger.warn(
      "visibility-filtered collection group query failed; scanning timelines",
      error
    );
    const all = await db.collectionGroup("timelines").get();
    return all.docs.filter((doc) => isListedInSitemap(doc.data().visibility));
  }
}

function timelineSitemapEntry(
  doc: admin.firestore.QueryDocumentSnapshot,
  userMap: Map<string, string>
): SitemapEntry | null {
  const data = doc.data();
  if (!isListedInSitemap(data.visibility)) return null;

  const ownerId =
    (typeof data.ownerId === "string" && data.ownerId) ||
    doc.ref.parent.parent?.id;
  const ownerUsernameRaw =
    (typeof data.ownerUsername === "string" && data.ownerUsername) ||
    (ownerId ? userMap.get(ownerId) : undefined);
  if (!ownerUsernameRaw) return null;

  const ownerUsername = ownerUsernameRaw.trim();
  return {
    loc: `${BASE_URL}/${encodeURIComponent(ownerUsername)}/timeline/${encodeURIComponent(doc.id)}`,
    lastmod: toLastmod(data.updatedAt || data.createdAt),
    priority: "0.8",
  };
}

/**
 * Generate XML sitemap for search engine crawlers.
 * Always returns 200 with a valid urlset (static pages at minimum).
 */
export const sitemap = onRequest(async (_req, res) => {
  const entries: SitemapEntry[] = [...STATIC_SITEMAP_PAGES];

  try {
    let userMap = new Map<string, string>();
    try {
      const users = await loadUserSitemapData();
      userMap = users.userMap;
      entries.push(...users.userPages);
    } catch (error) {
      logger.error("Sitemap: failed to load user profiles", error);
    }

    try {
      const docs = await loadPublicTimelineDocs();
      for (const doc of docs) {
        const entry = timelineSitemapEntry(doc, userMap);
        if (entry) entries.push(entry);
      }
    } catch (error) {
      logger.error("Sitemap: failed to load public timelines", error);
    }

    sendSitemap(res, entries);
  } catch (error) {
    logger.error("Error generating sitemap:", error);
    sendSitemap(res, STATIC_SITEMAP_PAGES);
  }
});

async function loadSpaHtml(): Promise<string | null> {
  if (spaHtmlCache && Date.now() - spaHtmlCache.fetchedAt < SPA_HTML_TTL_MS) {
    return spaHtmlCache.html;
  }

  try {
    const response = await fetch(SPA_INDEX_URL, {
      redirect: "follow",
      headers: { "User-Agent": "PowerTimelinePrerender/1.0" },
    });
    if (!response.ok) {
      logger.warn("Failed to fetch SPA index.html", { status: response.status });
      return spaHtmlCache?.html ?? null;
    }
    const html = await response.text();
    if (!html.includes('id="root"')) {
      logger.warn("SPA index.html missing #root; not caching");
      return spaHtmlCache?.html ?? null;
    }
    spaHtmlCache = { html, fetchedAt: Date.now() };
    return html;
  } catch (error) {
    logger.warn("Error fetching SPA index.html", error);
    return spaHtmlCache?.html ?? null;
  }
}

async function resolveUserId(username: string): Promise<string | null> {
  const lowered = username.toLowerCase();
  const byUsername = await db
    .collection("users")
    .where("username", "==", lowered)
    .limit(1)
    .get();
  if (!byUsername.empty) return byUsername.docs[0].id;

  const direct = await db.collection("users").doc(username).get();
  if (direct.exists) return direct.id;

  if (username !== lowered) {
    const lowerDoc = await db.collection("users").doc(lowered).get();
    if (lowerDoc.exists) return lowerDoc.id;
  }

  return null;
}

async function findTimelineDoc(
  timelineId: string,
  username: string
): Promise<admin.firestore.DocumentSnapshot | null> {
  try {
    const byId = await db
      .collectionGroup("timelines")
      .where("id", "==", timelineId)
      .limit(5)
      .get();
    if (!byId.empty) {
      const lowered = username.toLowerCase();
      const match =
        byId.docs.find((doc) => {
          const data = doc.data();
          const ownerUsername =
            typeof data.ownerUsername === "string"
              ? data.ownerUsername.toLowerCase()
              : "";
          return ownerUsername === lowered || doc.id === timelineId;
        }) || byId.docs[0];
      return match;
    }
  } catch (error) {
    logger.warn("Timeline lookup by id field failed", error);
  }

  const userId = await resolveUserId(username);
  if (!userId) return null;
  const direct = await db
    .doc(`users/${userId}/timelines/${timelineId}`)
    .get();
  return direct.exists ? direct : null;
}

async function loadTimelineEvents(
  ownerId: string,
  timelineId: string
): Promise<TimelineEventSeo[]> {
  const eventsRef = db.collection(
    `users/${ownerId}/timelines/${timelineId}/events`
  );

  let docs: admin.firestore.QueryDocumentSnapshot[] = [];
  try {
    const ordered = await eventsRef.orderBy("date", "asc").limit(MAX_CRAWLER_EVENTS).get();
    docs = ordered.docs;
  } catch (error) {
    logger.warn("Event orderBy(date) failed; fetching unordered", error);
    const unordered = await eventsRef.limit(MAX_CRAWLER_EVENTS).get();
    docs = unordered.docs.sort((a, b) => {
      const da = String(a.data().date || "");
      const dbDate = String(b.data().date || "");
      return da.localeCompare(dbDate);
    });
  }

  return docs.map((doc) => {
    const data = doc.data();
    return {
      date: typeof data.date === "string" ? data.date : undefined,
      title: typeof data.title === "string" ? data.title : "Untitled event",
      description:
        typeof data.description === "string" ? data.description : undefined,
    };
  });
}

async function buildSeoInput(
  username: string,
  timelineId: string,
  embed: boolean
): Promise<TimelineSeoInput | null> {
  const snapshot = await findTimelineDoc(timelineId, username);
  if (!snapshot || !snapshot.exists) return null;

  const data = snapshot.data() || {};
  if (!isShareable(data.visibility)) return null;

  const ownerId =
    (typeof data.ownerId === "string" && data.ownerId) ||
    snapshot.ref.parent.parent?.id;
  if (!ownerId) return null;

  const events = await loadTimelineEvents(ownerId, snapshot.id);
  const title =
    typeof data.title === "string" && data.title.trim()
      ? data.title
      : "Untitled timeline";
  const description =
    typeof data.description === "string" ? data.description : undefined;
  const eventCount =
    typeof data.eventCount === "number" ? data.eventCount : events.length;
  const ownerUsername =
    (typeof data.ownerUsername === "string" && data.ownerUsername) || username;

  return {
    username: ownerUsername,
    timelineId: snapshot.id,
    title,
    description,
    events,
    eventCount,
    embed,
    canonicalUrl: timelineCanonicalUrl(ownerUsername, snapshot.id),
  };
}

function requestPath(req: { path?: string; url?: string; originalUrl?: string }): string {
  const raw = req.path || req.originalUrl || req.url || "";
  return raw.split("?")[0] || "/";
}

const MINIMAL_SPA_SHELL = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PowerTimeline</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

/**
 * Serve public/unlisted timeline + embed routes with crawler-visible HTML.
 * Private timelines keep the SPA shell and never leak event text.
 */
export const prerenderTimeline = onRequest(
  { invoker: "public" },
  async (req, res) => {
  res.set("Content-Type", "text/html; charset=utf-8");

  const parsed = parseTimelinePath(requestPath(req));
  if (!parsed) {
    const spa = (await loadSpaHtml()) || MINIMAL_SPA_SHELL;
    res.set("Cache-Control", "public, max-age=60");
    res.status(200).send(spa);
    return;
  }

  try {
    const seo = await buildSeoInput(
      parsed.username,
      parsed.timelineId,
      parsed.embed
    );
    const spa = await loadSpaHtml();

    if (!seo) {
      res.set("Cache-Control", "no-store");
      res.status(200).send(spa || MINIMAL_SPA_SHELL);
      return;
    }

    const html = spa ? injectTimelineSeo(spa, seo) : buildStandaloneHtml(seo);
    res.set("Cache-Control", "public, max-age=300, s-maxage=600");
    res.status(200).send(html);
  } catch (error) {
    logger.error("Error prerendering timeline:", error);
    const spa = (await loadSpaHtml()) || MINIMAL_SPA_SHELL;
    res.set("Cache-Control", "no-store");
    res.status(200).send(spa);
  }
});

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
