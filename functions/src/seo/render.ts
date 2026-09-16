import { escapeHtml, safeJsonLd } from "./html";

export const DEFAULT_ORIGIN = "https://powertimeline.com";
export const OG_IMAGE_URL = `${DEFAULT_ORIGIN}/og-image.png`;
export const MAX_SSR_EVENTS = 80;

export interface PublicEventInput {
  date?: unknown;
  title?: unknown;
  description?: unknown;
}

export interface PublicPageModel {
  title: string;
  description: string;
  username: string;
  timelineId: string;
  canonicalUrl: string;
  isEmbed: boolean;
  events: PublicEventInput[];
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function buildCrawlerArticle(page: PublicPageModel): string {
  const events = page.events.slice(0, MAX_SSR_EVENTS);
  const items = events
    .map((event) => {
      const title = text(event.title, "Untitled event");
      const date = text(event.date);
      const description = text(event.description);
      const time = date
        ? `<time datetime="${escapeHtml(date)}">${escapeHtml(date)}</time>`
        : "";
      const desc = description
        ? `<p>${escapeHtml(description)}</p>`
        : "";
      return `    <li>
      ${time}
      <strong>${escapeHtml(title)}</strong>
      ${desc}
    </li>`;
    })
    .join("\n");

  const heading = page.title;
  const byline = `@${page.username} · ${page.events.length} event${
    page.events.length === 1 ? "" : "s"
  }`;

  return `<article class="ssr-timeline" data-ssr-timeline="true" data-ssr-embed="${page.isEmbed ? "true" : "false"}" data-testid="ssr-timeline">
  <h1>${escapeHtml(heading)}</h1>
  <p>${escapeHtml(page.description)}</p>
  <p>${escapeHtml(byline)}</p>
  <ol>
${items}
  </ol>
</article>`;
}

function crawlerStyles(): string {
  return `<style id="ssr-timeline-styles">
  .ssr-timeline { max-width: 44rem; margin: 1.5rem auto; padding: 1rem 1.25rem; font-family: system-ui, sans-serif; line-height: 1.5; color: #1a1a1a; }
  .ssr-timeline h1 { font-size: 1.75rem; margin: 0 0 0.5rem; }
  .ssr-timeline li { margin: 0.75rem 0; }
  .ssr-timeline time { display: block; font-size: 0.85rem; color: #555; }
</style>`;
}

function replaceOrInsertMeta(
  html: string,
  attr: "name" | "property",
  key: string,
  value: string
): string {
  const escaped = escapeHtml(value);
  const re = new RegExp(
    `<meta\\s+${attr}="${key}"\\s+content="[^"]*"\\s*/?>`,
    "i"
  );
  const tag = `<meta ${attr}="${key}" content="${escaped}" />`;
  if (re.test(html)) {
    return html.replace(re, tag);
  }
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
}

export function injectPublicTimelineHtml(
  spaHtml: string,
  page: PublicPageModel
): string {
  const pageTitle = `${page.title} | PowerTimeline`;
  const article = buildCrawlerArticle(page);
  const jsonLd = safeJsonLd({
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: page.title,
    description: page.description,
    url: page.canonicalUrl,
    author: {
      "@type": "Person",
      name: page.username,
    },
    numberOfItems: page.events.length,
  });

  let html = spaHtml;

  html = html.replace(
    /<title>[^<]*<\/title>/i,
    `<title>${escapeHtml(pageTitle)}</title>`
  );
  html = replaceOrInsertMeta(html, "name", "description", page.description);
  html = replaceOrInsertMeta(html, "property", "og:type", "article");
  html = replaceOrInsertMeta(html, "property", "og:url", page.canonicalUrl);
  html = replaceOrInsertMeta(html, "property", "og:title", pageTitle);
  html = replaceOrInsertMeta(html, "property", "og:description", page.description);
  html = replaceOrInsertMeta(html, "property", "og:image", OG_IMAGE_URL);
  html = replaceOrInsertMeta(html, "property", "twitter:url", page.canonicalUrl);
  html = replaceOrInsertMeta(html, "property", "twitter:title", pageTitle);
  html = replaceOrInsertMeta(
    html,
    "property",
    "twitter:description",
    page.description
  );

  const headExtras = `${crawlerStyles()}
    <link rel="canonical" href="${escapeHtml(page.canonicalUrl)}" />
    <script type="application/ld+json">${jsonLd}</script>
`;
  html = html.replace(/<\/head>/i, `${headExtras}  </head>`);

  if (/<div id="root"><\/div>/i.test(html)) {
    html = html.replace(
      /<div id="root"><\/div>/i,
      `<div id="root">${article}</div>`
    );
  } else if (/<div id="root">\s*<\/div>/i.test(html)) {
    html = html.replace(
      /<div id="root">\s*<\/div>/i,
      `<div id="root">${article}</div>`
    );
  } else {
    html = html.replace(
      /<body([^>]*)>/i,
      `<body$1>\n${article}\n`
    );
  }

  return html;
}

export function fallbackPublicTimelineHtml(page: PublicPageModel): string {
  const pageTitle = `${page.title} | PowerTimeline`;
  const article = buildCrawlerArticle(page);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeHtml(page.description)}" />
    <link rel="canonical" href="${escapeHtml(page.canonicalUrl)}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${escapeHtml(page.canonicalUrl)}" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    ${crawlerStyles()}
  </head>
  <body>
    ${article}
  </body>
</html>`;
}

export function isShareableVisibility(visibility: unknown): boolean {
  if (visibility == null || visibility === "") return true;
  return visibility === "public" || visibility === "unlisted";
}
