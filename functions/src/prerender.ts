import { logger } from "firebase-functions/v2";
import type { DocumentSnapshot, Firestore } from "firebase-admin/firestore";
import {
  FALLBACK_SPA_SHELL,
  canPrerenderTimeline,
  injectTimelineIntoShell,
  parseTimelineRoute,
  type PrerenderEvent,
  type PrerenderPayload,
  type PrerenderTimeline,
} from "./lib/prerender";
import {
  getToolIntentPage,
  injectToolIntentIntoShell,
  parseToolIntentRoute,
} from "./lib/toolIntentPages";

const SHELL_TTL_MS = 5 * 60 * 1000;
const MAX_EVENTS = 100;

let cachedShell: { html: string; fetchedAt: number } | null = null;

export interface RenderResult {
  status: number;
  html: string;
  cacheControl: string;
}

export async function renderPublicTimelineResponse(options: {
  db: Firestore;
  path: string;
  baseUrl: string;
  ogImageUrl: string;
  fetchShell: () => Promise<string>;
}): Promise<RenderResult> {
  const spaShell = await getSpaShell(options.fetchShell);
  const toolIntentSlug = parseToolIntentRoute(options.path);
  if (toolIntentSlug) {
    const page = getToolIntentPage(toolIntentSlug);
    if (page) {
      return {
        status: 200,
        html: injectToolIntentIntoShell(spaShell, page, {
          baseUrl: options.baseUrl,
          ogImageUrl: options.ogImageUrl,
        }),
        cacheControl: "public, max-age=3600, s-maxage=86400",
      };
    }
  }

  const route = parseTimelineRoute(options.path);

  if (!route) {
    return {
      status: 200,
      html: spaShell,
      cacheControl: "public, max-age=60",
    };
  }

  try {
    const loaded = await loadShareableTimeline(options.db, route);
    if (!loaded) {
      return {
        status: 200,
        html: spaShell,
        cacheControl: "public, max-age=60",
      };
    }

    const payload: PrerenderPayload = {
      canonicalUrl: `${options.baseUrl}/${encodeURIComponent(loaded.username)}/timeline/${encodeURIComponent(loaded.timeline.id)}${route.embed ? "/embed" : ""}`,
      embed: route.embed,
      timeline: loaded.timeline,
      username: loaded.username,
      events: loaded.events,
      ogImageUrl: options.ogImageUrl,
    };

    return {
      status: 200,
      html: injectTimelineIntoShell(spaShell, payload),
      cacheControl: route.embed
        ? "public, max-age=120"
        : "public, max-age=300, s-maxage=600",
    };
  } catch (error) {
    logger.error("Prerender failed; serving SPA shell", error);
    return {
      status: 200,
      html: spaShell,
      cacheControl: "public, max-age=30",
    };
  }
}

async function getSpaShell(fetchShell: () => Promise<string>): Promise<string> {
  if (cachedShell && Date.now() - cachedShell.fetchedAt < SHELL_TTL_MS) {
    return cachedShell.html;
  }

  try {
    const html = await fetchShell();
    if (html && html.includes("<html")) {
      cachedShell = { html, fetchedAt: Date.now() };
      return html;
    }
  } catch (error) {
    logger.warn("Failed to fetch SPA shell; using fallback template", error);
  }

  return cachedShell?.html || FALLBACK_SPA_SHELL;
}

async function loadShareableTimeline(
  db: Firestore,
  route: {
    username?: string;
    userId?: string;
    timelineId: string;
    embed: boolean;
  }
): Promise<{
  timeline: PrerenderTimeline;
  username: string;
  events: PrerenderEvent[];
} | null> {
  const snapshot = await findTimelineDoc(db, route);
  if (!snapshot) return null;

  const data = snapshot.data() || {};
  if (!canPrerenderTimeline(data.visibility)) {
    return null;
  }

  const ownerId =
    (typeof data.ownerId === "string" && data.ownerId) ||
    snapshot.ref.parent.parent?.id ||
    route.userId;
  if (!ownerId) return null;

  let username =
    (typeof data.ownerUsername === "string" && data.ownerUsername) ||
    route.username ||
    "";
  if (!username) {
    const userDoc = await db.doc(`users/${ownerId}`).get();
    const userData = userDoc.data();
    if (typeof userData?.username === "string") {
      username = userData.username;
    }
  }
  if (!username) return null;

  const events = await loadEvents(db, ownerId, snapshot.id);

  const timeline: PrerenderTimeline = {
    id: typeof data.id === "string" && data.id ? data.id : snapshot.id,
    title: data.title,
    description: data.description,
    visibility: data.visibility,
    ownerUsername: username,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    eventCount: data.eventCount,
    viewCount: data.viewCount,
  };

  return { timeline, username, events };
}

async function findTimelineDoc(
  db: Firestore,
  route: { username?: string; userId?: string; timelineId: string }
): Promise<DocumentSnapshot | null> {
  try {
    const byId = await db
      .collectionGroup("timelines")
      .where("id", "==", route.timelineId)
      .limit(1)
      .get();
    if (!byId.empty) return byId.docs[0];
  } catch (error) {
    logger.warn("Prerender: id-field lookup failed", error);
  }

  if (route.userId) {
    const direct = await db
      .doc(`users/${route.userId}/timelines/${route.timelineId}`)
      .get();
    if (direct.exists) return direct;
  }

  if (route.username) {
    try {
      const users = await db
        .collection("users")
        .where("username", "==", route.username)
        .limit(1)
        .get();
      if (!users.empty) {
        const direct = await db
          .doc(`users/${users.docs[0].id}/timelines/${route.timelineId}`)
          .get();
        if (direct.exists) return direct;
      }
    } catch (error) {
      logger.warn("Prerender: username lookup failed", error);
    }
  }

  return null;
}

async function loadEvents(
  db: Firestore,
  ownerId: string,
  timelineId: string
): Promise<PrerenderEvent[]> {
  const collectionRef = db.collection(
    `users/${ownerId}/timelines/${timelineId}/events`
  );

  try {
    const snapshot = await collectionRef
      .orderBy("date", "asc")
      .limit(MAX_EVENTS)
      .get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        date: data.date,
        title: data.title,
        description: data.description,
      };
    });
  } catch (error) {
    logger.warn("Prerender: ordered events query failed; retrying unordered", error);
    try {
      const snapshot = await collectionRef.limit(MAX_EVENTS).get();
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          date: data.date,
          title: data.title,
          description: data.description,
        };
      });
    } catch (retryError) {
      logger.warn("Prerender: events lookup failed", retryError);
      return [];
    }
  }
}
