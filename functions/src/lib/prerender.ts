import { escapeAttribute, escapeHtml } from "./escape";
import { toIsoString } from "./timestamps";
import { isShareVisible, normalizeVisibility } from "./visibility";

export interface PrerenderEvent {
  id?: string;
  date?: unknown;
  title?: unknown;
  description?: unknown;
}

export interface PrerenderTimeline {
  id: string;
  title?: unknown;
  description?: unknown;
  visibility?: unknown;
  ownerUsername?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  eventCount?: unknown;
  viewCount?: unknown;
}

export interface PrerenderPayload {
  canonicalUrl: string;
  embed: boolean;
  timeline: PrerenderTimeline;
  username: string;
  events: PrerenderEvent[];
  ogImageUrl: string;
}

const MAX_PRERENDER_EVENTS = 100;

export const FALLBACK_SPA_SHELL = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PowerTimeline</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;

export function parseTimelineRoute(path: string): {
  username?: string;
  userId?: string;
  timelineId: string;
  embed: boolean;
} | null {
  const normalized = path.split("?")[0].replace(/\/+$/, "") || "/";

  let match = normalized.match(/^\/([^/]+)\/timeline\/([^/]+)\/embed$/);
  if (match && match[1] !== "user") {
    return { username: match[1], timelineId: match[2], embed: true };
  }

  match = normalized.match(/^\/([^/]+)\/timeline\/([^/]+)$/);
  if (match && match[1] !== "user") {
    return { username: match[1], timelineId: match[2], embed: false };
  }

  match = normalized.match(/^\/user\/([^/]+)\/timeline\/([^/]+)$/);
  if (match) {
    return { userId: match[1], timelineId: match[2], embed: false };
  }

  return null;
}

export function buildArticleHtml(payload: PrerenderPayload): string {
  const title = stringOr(payload.timeline.title, "Untitled timeline");
  const description = stringOr(payload.timeline.description, "");
  const events = payload.events.slice(0, MAX_PRERENDER_EVENTS);
  const remaining = Math.max(0, payload.events.length - events.length);

  const eventItems = events
    .map((event) => {
      const eventTitle = stringOr(event.title, "Untitled event");
      const eventDate = stringOr(event.date, "");
      const eventDescription = stringOr(event.description, "");
      return `      <li>
        ${eventDate ? `<time datetime="${escapeAttribute(eventDate)}">${escapeHtml(eventDate)}</time> ` : ""}<strong>${escapeHtml(eventTitle)}</strong>${
          eventDescription ? ` — ${escapeHtml(eventDescription)}` : ""
        }
      </li>`;
    })
    .join("\n");

  return `<article data-prerender="timeline">
    <h1>${escapeHtml(title)}</h1>
    ${description ? `<p>${escapeHtml(description)}</p>` : ""}
    <p>A PowerTimeline by @${escapeHtml(payload.username)}.</p>
    ${
      events.length > 0
        ? `<ol>
${eventItems}
    </ol>`
        : "<p>No events yet.</p>"
    }
    ${remaining > 0 ? `<p>And ${remaining} more events on the interactive timeline.</p>` : ""}
    <p><a href="${escapeAttribute(payload.canonicalUrl)}">Open the interactive timeline</a></p>
  </article>`;
}

export function injectTimelineIntoShell(
  shell: string,
  payload: PrerenderPayload
): string {
  const title = stringOr(payload.timeline.title, "Untitled timeline");
  const pageTitle = `${title} | PowerTimeline`;
  const description = buildDescription(payload);
  const article = buildArticleHtml(payload);
  const visibility = normalizeVisibility(payload.timeline.visibility);
  const indexable = visibility === "public" && !payload.embed;

  let html = shell;

  html = html.replace(
    /<title>[^<]*<\/title>/i,
    `<title>${escapeHtml(pageTitle)}</title>`
  );

  html = replaceOrInsertMeta(
    html,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${escapeAttribute(description)}" />`
  );
  html = replaceOrInsertMeta(
    html,
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${escapeAttribute(pageTitle)}" />`
  );
  html = replaceOrInsertMeta(
    html,
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${escapeAttribute(description)}" />`
  );
  html = replaceOrInsertMeta(
    html,
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${escapeAttribute(payload.canonicalUrl)}" />`
  );
  html = replaceOrInsertMeta(
    html,
    /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:type" content="article" />`
  );
  html = replaceOrInsertMeta(
    html,
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image" content="${escapeAttribute(payload.ogImageUrl)}" />`
  );

  const extraHead = [
    `<link rel="canonical" href="${escapeAttribute(payload.canonicalUrl)}" />`,
    indexable
      ? `<meta name="robots" content="index,follow" />`
      : `<meta name="robots" content="noindex,follow" />`,
    `<script type="application/ld+json">${escapeJsonLd(JSON.stringify(buildJsonLd(payload)))}</script>`,
  ].join("\n    ");

  html = html.replace(/<\/head>/i, `    ${extraHead}\n  </head>`);

  if (/<div id="root"\s*>\s*<\/div>/i.test(html)) {
    html = html.replace(
      /<div id="root"\s*>\s*<\/div>/i,
      `<div id="root">${article}</div>\n    <noscript>${article}</noscript>`
    );
  } else if (/<div id="root"><\/div>/i.test(html)) {
    html = html.replace(
      /<div id="root"><\/div>/i,
      `<div id="root">${article}</div>\n    <noscript>${article}</noscript>`
    );
  } else {
    html = html.replace(
      /<body([^>]*)>/i,
      `<body$1>\n    <noscript>${article}</noscript>`
    );
  }

  return html;
}

export function canPrerenderTimeline(visibility: unknown): boolean {
  return isShareVisible(visibility);
}

function buildDescription(payload: PrerenderPayload): string {
  const title = stringOr(payload.timeline.title, "Untitled timeline");
  const description = stringOr(payload.timeline.description, "");
  const count =
    typeof payload.timeline.eventCount === "number"
      ? payload.timeline.eventCount
      : payload.events.length;
  const base = description || `Explore ${title} on PowerTimeline.`;
  return `${base} ${count} events.`.trim().slice(0, 300);
}

function buildJsonLd(payload: PrerenderPayload): Record<string, unknown> {
  const title = stringOr(payload.timeline.title, "Untitled timeline");
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: title,
    description: buildDescription(payload),
    url: payload.canonicalUrl,
    author: {
      "@type": "Person",
      name: payload.username,
    },
    dateCreated: toIsoString(payload.timeline.createdAt),
    dateModified: toIsoString(payload.timeline.updatedAt),
  };
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function replaceOrInsertMeta(
  html: string,
  pattern: RegExp,
  tag: string
): string {
  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
}

function escapeJsonLd(json: string): string {
  return json.replace(/</g, "\\u003c");
}
