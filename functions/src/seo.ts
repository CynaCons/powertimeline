/**
 * Pure SEO helpers for sitemap generation and timeline prerender.
 * Kept free of Firebase so unit tests can cover lastmod serialization,
 * XML/HTML escaping, and crawler HTML injection without emulators.
 */

export const BASE_URL = "https://powertimeline.com";
export const OG_IMAGE_URL = `${BASE_URL}/og-image.png`;
export const MAX_SITEMAP_URLS = 10_000;
export const MAX_CRAWLER_EVENTS = 100;

export interface SitemapEntry {
  loc: string;
  priority?: string;
  lastmod?: string;
}

export interface TimelineEventSeo {
  date?: string;
  title: string;
  description?: string;
}

export interface TimelineSeoInput {
  username: string;
  timelineId: string;
  title: string;
  description?: string;
  events: TimelineEventSeo[];
  eventCount?: number;
  embed: boolean;
  canonicalUrl: string;
  ogImageUrl?: string;
}

export interface ParsedTimelinePath {
  username: string;
  timelineId: string;
  embed: boolean;
}

const LASTMOD_RE = /^\d{4}-\d{2}-\d{2}$/;
const RESERVED_USERNAMES = new Set([
  "browse",
  "login",
  "admin",
  "settings",
  "editor",
  "api",
  "user",
]);

function isValidDate(date: Date): boolean {
  return !isNaN(date.getTime());
}

/**
 * Convert Firestore Timestamp | Date | ISO string | epoch into a Date.
 * Returns undefined instead of throwing on invalid values.
 */
export function toDate(value: unknown): Date | undefined {
  if (value == null || value === "") return undefined;

  try {
    if (value instanceof Date) {
      return isValidDate(value) ? value : undefined;
    }

    if (typeof value === "string" || typeof value === "number") {
      const date = new Date(value);
      return isValidDate(date) ? date : undefined;
    }

    if (typeof value === "object") {
      const record = value as Record<string, unknown>;

      if (typeof record.toDate === "function") {
        const date = (record.toDate as () => Date)();
        return date instanceof Date && isValidDate(date) ? date : undefined;
      }

      if (typeof record.toMillis === "function") {
        const date = new Date((record.toMillis as () => number)());
        return isValidDate(date) ? date : undefined;
      }

      const seconds =
        typeof record.seconds === "number"
          ? record.seconds
          : typeof record._seconds === "number"
            ? record._seconds
            : undefined;

      if (typeof seconds === "number") {
        const nanos =
          typeof record.nanoseconds === "number"
            ? record.nanoseconds
            : typeof record._nanoseconds === "number"
              ? record._nanoseconds
              : 0;
        const date = new Date(seconds * 1000 + nanos / 1e6);
        return isValidDate(date) ? date : undefined;
      }
    }
  } catch {
    return undefined;
  }

  return undefined;
}

/** Sitemap lastmod (YYYY-MM-DD), or undefined if the value is not a real date. */
export function toLastmod(value: unknown): string | undefined {
  const date = toDate(value);
  if (!date) return undefined;
  try {
    const lastmod = date.toISOString().slice(0, 10);
    return LASTMOD_RE.test(lastmod) ? lastmod : undefined;
  } catch {
    return undefined;
  }
}

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

/** Public (or legacy missing visibility) timelines belong in the sitemap. */
export function isListedInSitemap(visibility: unknown): boolean {
  return visibility == null || visibility === "" || visibility === "public";
}

/** Public and unlisted timelines may be fetched by share/embed recipients. */
export function isShareable(visibility: unknown): boolean {
  return (
    visibility == null ||
    visibility === "" ||
    visibility === "public" ||
    visibility === "unlisted"
  );
}

export const STATIC_SITEMAP_PAGES: SitemapEntry[] = [
  { loc: `${BASE_URL}/`, priority: "1.0" },
  { loc: `${BASE_URL}/browse`, priority: "0.9" },
];

export function buildSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .slice(0, MAX_SITEMAP_URLS)
    .map((entry) => {
      const lastmod =
        entry.lastmod && LASTMOD_RE.test(entry.lastmod)
          ? `\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`
          : "";
      const priority = entry.priority
        ? `\n    <priority>${escapeXml(entry.priority)}</priority>`
        : "";
      return `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>${lastmod}${priority}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export function parseTimelinePath(path: string): ParsedTimelinePath | null {
  let pathname = path.split("?")[0] || "/";
  if (pathname.startsWith("http://") || pathname.startsWith("https://")) {
    try {
      pathname = new URL(pathname).pathname;
    } catch {
      return null;
    }
  }

  pathname = pathname.replace(/\/+$/, "") || "/";
  const match = pathname.match(
    /^\/([^/]+)\/timeline\/([^/]+)(?:\/(embed))?$/
  );
  if (!match) return null;

  const username = decodeURIComponent(match[1]);
  const timelineId = decodeURIComponent(match[2]);
  if (!username || !timelineId || RESERVED_USERNAMES.has(username.toLowerCase())) {
    return null;
  }

  return { username, timelineId, embed: match[3] === "embed" };
}

export function timelineCanonicalUrl(
  username: string,
  timelineId: string
): string {
  return `${BASE_URL}/${encodeURIComponent(username)}/timeline/${encodeURIComponent(timelineId)}`;
}

export function buildPageDescription(input: TimelineSeoInput): string {
  const count = input.eventCount ?? input.events.length;
  if (input.description?.trim()) {
    return truncate(input.description, 200);
  }
  return `Explore ${input.title} on PowerTimeline. ${count} events.`;
}

export function buildCrawlerArticle(input: TimelineSeoInput): string {
  const count = input.eventCount ?? input.events.length;
  const events = input.events.slice(0, MAX_CRAWLER_EVENTS);
  const items = events
    .map((event) => {
      const date = event.date ? escapeHtml(String(event.date)) : "";
      const title = escapeHtml(event.title || "Untitled event");
      const description = event.description
        ? ` — ${escapeHtml(truncate(event.description, 280))}`
        : "";
      const time = date
        ? `<time datetime="${date}">${date}</time> `
        : "";
      return `<li>${time}<strong>${title}</strong>${description}</li>`;
    })
    .join("\n");

  const remaining = count - events.length;
  const more =
    remaining > 0
      ? `<p>${remaining} more events in the interactive timeline.</p>`
      : "";
  const description = input.description
    ? `<p>${escapeHtml(input.description)}</p>`
    : "";

  return `<article id="seo-timeline" data-timeline-id="${escapeHtml(input.timelineId)}">
  <h1>${escapeHtml(input.title)}</h1>
  ${description}
  <p>By @${escapeHtml(input.username)} · ${count} events</p>
  <ol>
${items}
  </ol>
  ${more}
</article>`;
}

function replaceTitle(html: string, title: string): string {
  if (/<title>[^<]*<\/title>/i.test(html)) {
    return html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  }
  return html.replace(/<\/head>/i, `  <title>${escapeHtml(title)}</title>\n</head>`);
}

function upsertMeta(
  html: string,
  attrName: "name" | "property",
  attrValue: string,
  content: string
): string {
  const attr = `${attrName}="${attrValue}"`;
  const tag = `<meta ${attr} content="${escapeHtml(content)}" />`;
  const re = new RegExp(
    `<meta\\s+[^>]*${attrName}\\s*=\\s*["']${attrValue}["'][^>]*>`,
    "i"
  );
  if (re.test(html)) return html.replace(re, tag);
  return html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

export function injectTimelineSeo(html: string, input: TimelineSeoInput): string {
  const title = `${input.title}${input.embed ? " (Embed)" : ""} | PowerTimeline`;
  const description = buildPageDescription(input);
  const ogImage = input.ogImageUrl || OG_IMAGE_URL;
  const article = buildCrawlerArticle(input);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: input.title,
    description,
    url: input.canonicalUrl,
    author: {
      "@type": "Person",
      name: input.username,
    },
  };

  let next = html;
  next = replaceTitle(next, title);
  next = upsertMeta(next, "name", "description", description);
  next = upsertMeta(next, "property", "og:type", "article");
  next = upsertMeta(next, "property", "og:url", input.canonicalUrl);
  next = upsertMeta(next, "property", "og:title", title);
  next = upsertMeta(next, "property", "og:description", description);
  next = upsertMeta(next, "property", "og:image", ogImage);
  next = upsertMeta(next, "property", "twitter:card", "summary_large_image");
  next = upsertMeta(next, "property", "twitter:url", input.canonicalUrl);
  next = upsertMeta(next, "property", "twitter:title", title);
  next = upsertMeta(next, "property", "twitter:description", description);
  next = upsertMeta(next, "property", "twitter:image", ogImage);
  next = upsertMeta(next, "name", "twitter:card", "summary_large_image");
  next = upsertMeta(next, "name", "twitter:title", title);
  next = upsertMeta(next, "name", "twitter:description", description);

  if (input.embed) {
    next = upsertMeta(next, "name", "robots", "noindex,follow");
  }

  const extraHead = [
    `  <link rel="canonical" href="${escapeHtml(input.canonicalUrl)}" />`,
    `  <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`,
  ].join("\n");
  next = next.replace(/<\/head>/i, `${extraHead}\n</head>`);

  if (/<div id="root"><\/div>/i.test(next)) {
    next = next.replace(
      /<div id="root"><\/div>/i,
      `<div id="root">\n${article}\n</div>`
    );
  } else if (/<div id="root">\s*<\/div>/i.test(next)) {
    next = next.replace(
      /<div id="root">\s*<\/div>/i,
      `<div id="root">\n${article}\n</div>`
    );
  } else {
    next = next.replace(
      /<body([^>]*)>/i,
      `<body$1>\n${article}\n`
    );
  }

  return next;
}

export function buildStandaloneHtml(input: TimelineSeoInput): string {
  const title = `${input.title}${input.embed ? " (Embed)" : ""} | PowerTimeline`;
  const description = buildPageDescription(input);
  const ogImage = input.ogImageUrl || OG_IMAGE_URL;
  const article = buildCrawlerArticle(input);
  const robots = input.embed
    ? '<meta name="robots" content="noindex,follow" />'
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    ${robots}
    <link rel="canonical" href="${escapeHtml(input.canonicalUrl)}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${escapeHtml(input.canonicalUrl)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
  </head>
  <body>
    <div id="root">
${article}
    </div>
  </body>
</html>`;
}
