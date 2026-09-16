import { logger } from "firebase-functions/v2";
import type { Request } from "firebase-functions/v2/https";
import type { Response } from "express";
import type { DocumentData, Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import {
  buildSitemapXml,
  collectTimelineEntries,
  staticSitemapEntries,
  userSitemapEntries,
  DEFAULT_SITEMAP_BASE_URL,
  type SitemapEntry,
  type SitemapTimelineInput,
} from "./sitemap";
import {
  fallbackPublicTimelineHtml,
  injectPublicTimelineHtml,
  isShareableVisibility,
  MAX_SSR_EVENTS,
  type PublicEventInput,
  type PublicPageModel,
} from "./render";
import { parsePublicTimelinePath, requestPath } from "./routes";

const SPA_SHELL_TTL_MS = 5 * 60 * 1000;
let cachedSpaShell: { html: string; fetchedAt: number } | null = null;

function asTimelineInput(doc: QueryDocumentSnapshot): SitemapTimelineInput {
  const data = doc.data();
  return {
    id: typeof data.id === "string" && data.id ? data.id : doc.id,
    ownerId:
      typeof data.ownerId === "string"
        ? data.ownerId
        : doc.ref.parent.parent?.id,
    ownerUsername: data.ownerUsername,
    visibility: data.visibility,
    updatedAt: data.updatedAt,
  };
}

async function loadUserMap(
  db: Firestore
): Promise<Map<string, string>> {
  const userMap = new Map<string, string>();
  try {
    const usersSnapshot = await db.collection("users").get();
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (typeof data.username === "string" && data.username) {
        userMap.set(doc.id, data.username);
      }
    });
  } catch (error) {
    logger.warn("Sitemap user listing failed; continuing with denormalized usernames", error);
  }
  return userMap;
}

async function loadPublicTimelineDocs(db: Firestore): Promise<SitemapTimelineInput[]> {
  try {
    const snapshot = await db
      .collectionGroup("timelines")
      .where("visibility", "==", "public")
      .get();
    return snapshot.docs.map(asTimelineInput);
  } catch (error) {
    logger.warn(
      "Collection-group visibility query failed; falling back to unfiltered scan",
      error
    );
  }

  try {
    const snapshot = await db.collectionGroup("timelines").get();
    return snapshot.docs
      .map(asTimelineInput)
      .filter((timeline) => {
        const visibility = timeline.visibility ?? "public";
        return visibility === "public";
      });
  } catch (error) {
    logger.error("Fallback public timeline listing failed", error);
    return [];
  }
}

export async function generateSitemapXml(db: Firestore): Promise<string> {
  const [userMap, timelines] = await Promise.all([
    loadUserMap(db),
    loadPublicTimelineDocs(db),
  ]);

  const entries: SitemapEntry[] = [
    ...staticSitemapEntries(DEFAULT_SITEMAP_BASE_URL),
    ...userSitemapEntries(userMap.values(), DEFAULT_SITEMAP_BASE_URL),
    ...collectTimelineEntries(timelines, userMap, DEFAULT_SITEMAP_BASE_URL),
  ];

  return buildSitemapXml(entries);
}

export async function handleSitemapRequest(
  db: Firestore,
  res: Response
): Promise<void> {
  try {
    const xml = await generateSitemapXml(db);
    res.set("Content-Type", "application/xml; charset=utf-8");
    res.set("Cache-Control", "public, max-age=3600");
    res.status(200).send(xml);
  } catch (error) {
    logger.error("Error generating sitemap; returning static fallback", error);
    // Soft-fail: never 500 — crawlers still get a valid sitemap of static pages.
    const xml = buildSitemapXml(staticSitemapEntries());
    res.set("Content-Type", "application/xml; charset=utf-8");
    res.set("Cache-Control", "public, max-age=300");
    res.status(200).send(xml);
  }
}

async function fetchSpaShell(): Promise<string> {
  if (cachedSpaShell && Date.now() - cachedSpaShell.fetchedAt < SPA_SHELL_TTL_MS) {
    return cachedSpaShell.html;
  }

  const origin = process.env.SPA_ORIGIN || "https://powertimeline.com";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${origin}/index.html`, {
      signal: controller.signal,
      redirect: "follow",
    });
    if (!response.ok) {
      throw new Error(`SPA shell fetch failed: ${response.status}`);
    }
    const html = await response.text();
    cachedSpaShell = { html, fetchedAt: Date.now() };
    return html;
  } finally {
    clearTimeout(timeout);
  }
}

async function lookupUserIdByUsername(
  db: Firestore,
  username: string
): Promise<{ userId: string; username: string } | null> {
  const candidates = Array.from(new Set([username, username.toLowerCase()]));
  for (const candidate of candidates) {
    try {
      const snap = await db
        .collection("users")
        .where("username", "==", candidate)
        .limit(1)
        .get();
      if (!snap.empty) {
        const doc = snap.docs[0];
        const data = doc.data();
        return {
          userId: doc.id,
          username: typeof data.username === "string" ? data.username : candidate,
        };
      }
    } catch (error) {
      logger.warn("Username lookup failed", { username: candidate, error });
    }
  }
  return null;
}

async function loadEvents(
  db: Firestore,
  ownerId: string,
  timelineId: string
): Promise<PublicEventInput[]> {
  const eventsRef = db
    .collection("users")
    .doc(ownerId)
    .collection("timelines")
    .doc(timelineId)
    .collection("events");

  try {
    const snap = await eventsRef.orderBy("date", "asc").limit(MAX_SSR_EVENTS).get();
    return snap.docs.map((doc) => {
      const data = doc.data();
      return {
        date: data.date,
        title: data.title,
        description: data.description,
      };
    });
  } catch (error) {
    logger.warn("Ordered event query failed; fetching unordered", error);
    try {
      const snap = await eventsRef.limit(MAX_SSR_EVENTS).get();
      return snap.docs.map((doc) => {
        const data = doc.data();
        return {
          date: data.date,
          title: data.title,
          description: data.description,
        };
      });
    } catch (fallbackError) {
      logger.error("Event listing failed", fallbackError);
      return [];
    }
  }
}

async function loadShareablePage(
  db: Firestore,
  username: string,
  timelineId: string,
  isEmbed: boolean
): Promise<PublicPageModel | null> {
  let ownerId: string | undefined;
  let resolvedUsername = username;
  let data: DocumentData | undefined;

  const user = await lookupUserIdByUsername(db, username);
  if (user) {
    resolvedUsername = user.username;
    ownerId = user.userId;
    try {
      const direct = await db.doc(`users/${user.userId}/timelines/${timelineId}`).get();
      if (direct.exists) {
        data = direct.data();
      }
    } catch (error) {
      logger.warn("Direct timeline lookup failed", error);
    }
  }

  if (!data) {
    try {
      const snap = await db
        .collectionGroup("timelines")
        .where("id", "==", timelineId)
        .limit(1)
        .get();
      if (!snap.empty) {
        const doc = snap.docs[0];
        data = doc.data();
        ownerId = typeof data.ownerId === "string" ? data.ownerId : doc.ref.parent.parent?.id;
        if (typeof data.ownerUsername === "string" && data.ownerUsername) {
          resolvedUsername = data.ownerUsername;
        }
      }
    } catch (error) {
      logger.warn("Collection-group id lookup failed", error);
    }
  }

  if (!data || !ownerId) return null;
  if (!isShareableVisibility(data.visibility)) return null;

  const title =
    typeof data.title === "string" && data.title.trim()
      ? data.title.trim()
      : "Untitled timeline";
  const description =
    typeof data.description === "string" && data.description.trim()
      ? data.description.trim()
      : `Explore ${title} on PowerTimeline.`;

  const events = await loadEvents(db, ownerId, timelineId);

  return {
    title,
    description,
    username: resolvedUsername,
    timelineId,
    canonicalUrl: `https://powertimeline.com/${resolvedUsername}/timeline/${timelineId}`,
    isEmbed,
    events,
  };
}

export async function handlePublicPageRequest(
  db: Firestore,
  req: Request,
  res: Response
): Promise<void> {
  const path = requestPath(req);
  const parsed = parsePublicTimelinePath(path);

  const sendSpa = async (status: number, cacheControl: string) => {
    try {
      const shell = await fetchSpaShell();
      res.set("Content-Type", "text/html; charset=utf-8");
      res.set("Cache-Control", cacheControl);
      res.status(status).send(shell);
    } catch (error) {
      logger.error("Failed to fetch SPA shell", error);
      res.status(status).send(
        `<!doctype html><html><head><meta charset="utf-8"><title>PowerTimeline</title></head><body><div id="root"></div></body></html>`
      );
    }
  };

  if (!parsed) {
    await sendSpa(200, "public, max-age=60");
    return;
  }

  try {
    const page = await loadShareablePage(
      db,
      parsed.username,
      parsed.timelineId,
      parsed.isEmbed
    );

    if (!page) {
      // Private or missing: do not leak event content.
      await sendSpa(200, "private, no-cache");
      return;
    }

    let html: string;
    try {
      const shell = await fetchSpaShell();
      html = injectPublicTimelineHtml(shell, page);
    } catch (error) {
      logger.warn("SPA shell unavailable; serving standalone prerender", error);
      html = fallbackPublicTimelineHtml(page);
    }

    res.set("Content-Type", "text/html; charset=utf-8");
    res.set("Cache-Control", "public, max-age=120");
    res.status(200).send(html);
  } catch (error) {
    logger.error("Error rendering public timeline page", error);
    await sendSpa(200, "private, no-cache");
  }
}
