import { escapeXml } from "./escape";
import { toLastmodDate } from "./timestamps";
import { isPubliclyListed } from "./visibility";

export interface SitemapEntry {
  loc: string;
  priority: string;
  lastmod?: string;
}

export interface TimelineSitemapInput {
  id: string;
  ownerUsername?: string;
  ownerId?: string;
  visibility?: unknown;
  updatedAt?: unknown;
}

const MAX_SITEMAP_URLS = 5000;

export function buildSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .filter((entry) => Boolean(entry.loc))
    .slice(0, MAX_SITEMAP_URLS)
    .map(
      (entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>${
        entry.lastmod
          ? `\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`
          : ""
      }
    <priority>${escapeXml(entry.priority)}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export function staticSitemapEntries(baseUrl: string): SitemapEntry[] {
  return [
    { loc: `${baseUrl}/`, priority: "1.0" },
    { loc: `${baseUrl}/browse`, priority: "0.9" },
  ];
}

export function userSitemapEntry(
  baseUrl: string,
  username: unknown
): SitemapEntry | null {
  if (typeof username !== "string" || !username.trim()) return null;
  return {
    loc: `${baseUrl}/${encodeURIComponent(username.trim())}`,
    priority: "0.7",
  };
}

export function timelineSitemapEntry(
  baseUrl: string,
  timeline: TimelineSitemapInput,
  usernameById?: Map<string, string>
): SitemapEntry | null {
  if (!isPubliclyListed(timeline.visibility)) return null;

  const ownerUsername =
    (typeof timeline.ownerUsername === "string" && timeline.ownerUsername.trim()) ||
    (timeline.ownerId ? usernameById?.get(timeline.ownerId) : undefined);

  if (!ownerUsername || !timeline.id) return null;

  const lastmod = toLastmodDate(timeline.updatedAt);

  return {
    loc: `${baseUrl}/${encodeURIComponent(ownerUsername)}/timeline/${encodeURIComponent(timeline.id)}`,
    lastmod,
    priority: "0.8",
  };
}

export function emptyUrlsetXml(): string {
  return buildSitemapXml([]);
}
