import { escapeXml } from "./xml";
import { toLastmodDate } from "./timestamps";

export const DEFAULT_SITEMAP_BASE_URL = "https://powertimeline.com";

export interface SitemapEntry {
  loc: string;
  priority: string;
  lastmod?: string;
}

export interface SitemapTimelineInput {
  id: string;
  ownerId?: string;
  ownerUsername?: unknown;
  visibility?: unknown;
  updatedAt?: unknown;
}

export function isListedInSitemap(visibility: unknown): boolean {
  // Missing visibility defaults to public (matches Firestore rules).
  if (visibility == null || visibility === "") return true;
  return visibility === "public";
}

export function resolveOwnerUsername(
  timeline: SitemapTimelineInput,
  userMap: Map<string, string>
): string | undefined {
  if (typeof timeline.ownerUsername === "string" && timeline.ownerUsername.trim()) {
    return timeline.ownerUsername.trim();
  }
  if (timeline.ownerId && userMap.has(timeline.ownerId)) {
    return userMap.get(timeline.ownerId);
  }
  return undefined;
}

/**
 * Convert timeline docs into sitemap entries. Bad rows are skipped, never thrown.
 */
export function collectTimelineEntries(
  timelines: SitemapTimelineInput[],
  userMap: Map<string, string>,
  baseUrl: string = DEFAULT_SITEMAP_BASE_URL
): SitemapEntry[] {
  const entries: SitemapEntry[] = [];

  for (const timeline of timelines) {
    try {
      if (!isListedInSitemap(timeline.visibility)) continue;
      if (!timeline.id) continue;

      const ownerUsername = resolveOwnerUsername(timeline, userMap);
      if (!ownerUsername) continue;

      const lastmod = toLastmodDate(timeline.updatedAt);
      entries.push({
        loc: `${baseUrl}/${ownerUsername}/timeline/${timeline.id}`,
        priority: "0.8",
        ...(lastmod ? { lastmod } : {}),
      });
    } catch {
      // Soft-fail a single bad document rather than 500 the whole sitemap.
    }
  }

  return entries;
}

export function staticSitemapEntries(
  baseUrl: string = DEFAULT_SITEMAP_BASE_URL
): SitemapEntry[] {
  return [
    { loc: `${baseUrl}/`, priority: "1.0" },
    { loc: `${baseUrl}/browse`, priority: "0.9" },
  ];
}

export function userSitemapEntries(
  usernames: Iterable<string>,
  baseUrl: string = DEFAULT_SITEMAP_BASE_URL
): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  for (const username of usernames) {
    try {
      if (!username) continue;
      entries.push({
        loc: `${baseUrl}/${username}`,
        priority: "0.7",
      });
    } catch {
      // skip
    }
  }
  return entries;
}

export function buildSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      const lastmod = entry.lastmod
        ? `\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`
        : "";
      return `  <url>
    <loc>${escapeXml(entry.loc)}</loc>${lastmod}
    <priority>${escapeXml(entry.priority)}</priority>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}
