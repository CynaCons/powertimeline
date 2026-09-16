import { escapeAttribute, escapeHtml } from "./escape";
import { injectDocumentIntoShell } from "./prerender";
import {
  CREATE_TIMELINE_PATH,
  isToolIntentSlug,
  type ToolIntentPageDefinition,
  type ToolIntentSlug,
} from "./toolIntentContent";

export {
  CREATE_TIMELINE_PATH,
  DEMO_TIMELINE_URLS,
  TOOL_INTENT_PAGES,
  TOOL_INTENT_SLUGS,
  getToolIntentPage,
  isToolIntentSlug,
} from "./toolIntentContent";
export type {
  ToolIntentFaq,
  ToolIntentPageDefinition,
  ToolIntentSlug,
} from "./toolIntentContent";

export function parseToolIntentRoute(path: string): ToolIntentSlug | null {
  const normalized = path.split("?")[0].replace(/\/+$/, "") || "/";
  const slug = normalized.startsWith("/") ? normalized.slice(1) : normalized;
  return isToolIntentSlug(slug) ? slug : null;
}

export function toolIntentCanonicalUrl(
  baseUrl: string,
  slug: ToolIntentSlug
): string {
  return `${baseUrl.replace(/\/+$/, "")}/${slug}`;
}

export function buildToolIntentArticleHtml(
  page: ToolIntentPageDefinition
): string {
  const bestFor = renderList(page.bestFor);
  const notFor = renderList(page.notFor);
  const steps = page.steps?.length
    ? `    <h2>${escapeHtml(page.stepsTitle || "How it works")}</h2>
    <ol>
${page.steps
  .map((step) => `      <li>${escapeHtml(step)}</li>`)
  .join("\n")}
    </ol>`
    : "";
  const compare = page.compare ? renderCompare(page.compare) : "";
  const whenKeep = page.whenKeep
    ? `    <h2>${escapeHtml(page.whenKeep.title)}</h2>
    <p>${escapeHtml(page.whenKeep.body)}</p>`
    : "";
  const whenSwitch = page.whenSwitch
    ? `    <h2>${escapeHtml(page.whenSwitch.title)}</h2>
    <p>${escapeHtml(page.whenSwitch.body)}</p>`
    : "";
  const faqs = page.faqs
    .map(
      (faq) => `      <dt>${escapeHtml(faq.question)}</dt>
      <dd${faq.todo ? ' data-todo="product-truth"' : ""}>${escapeHtml(faq.answer)}</dd>`
    )
    .join("\n");
  const internal = page.internalLinks
    .map(
      (link) =>
        `      <li><a href="${escapeAttribute(link.href)}">${escapeHtml(link.label)}</a></li>`
    )
    .join("\n");

  return `<article data-prerender="tool-intent" data-slug="${escapeAttribute(page.slug)}" lang="${escapeAttribute(page.lang)}">
    <h1>${escapeHtml(page.h1)}</h1>
    <p>${escapeHtml(page.lead)}</p>
    <h2>${escapeHtml(page.bestForTitle)}</h2>
    <ul>
${bestFor}
    </ul>
    <h2>${escapeHtml(page.notForTitle)}</h2>
    <ul>
${notFor}
    </ul>
${steps}
${compare}
${whenKeep}
${whenSwitch}
    <h2>${escapeHtml(page.proofLabel)}</h2>
    <p>${escapeHtml(page.proofNote)}</p>
    <p><a href="${escapeAttribute(page.proofHref)}">${escapeHtml(page.proofTitle)}</a></p>
    <p>
      <a href="${escapeAttribute(CREATE_TIMELINE_PATH)}">${escapeHtml(page.createCta)}</a>
      ·
      <a href="${escapeAttribute(page.proofHref)}">${escapeHtml(page.forkCta)}</a>
    </p>
    <h2>FAQ</h2>
    <dl>
${faqs}
    </dl>
    <h2>${page.lang === "fr" ? "Liens" : "More"}</h2>
    <ul>
${internal}
    </ul>
  </article>`;
}

export function buildToolIntentJsonLd(
  page: ToolIntentPageDefinition,
  canonicalUrl: string
): unknown[] {
  const publishedFaqs = page.faqs.filter((faq) => !faq.todo);
  const blocks: unknown[] = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: page.title,
      description: page.metaDescription,
      url: canonicalUrl,
      inLanguage: page.lang,
    },
  ];
  if (publishedFaqs.length > 0) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: publishedFaqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    });
  }
  return blocks;
}

export function injectToolIntentIntoShell(
  shell: string,
  page: ToolIntentPageDefinition,
  options: { baseUrl: string; ogImageUrl: string }
): string {
  const canonicalUrl = toolIntentCanonicalUrl(options.baseUrl, page.slug);
  return injectDocumentIntoShell(shell, {
    pageTitle: page.title,
    description: page.metaDescription,
    canonicalUrl,
    ogImageUrl: options.ogImageUrl,
    ogType: "website",
    lang: page.lang,
    robots: "index,follow",
    jsonLd: buildToolIntentJsonLd(page, canonicalUrl),
    extraHead: [
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${escapeAttribute(page.title)}" />`,
      `<meta name="twitter:description" content="${escapeAttribute(page.metaDescription)}" />`,
      `<meta name="twitter:image" content="${escapeAttribute(options.ogImageUrl)}" />`,
    ],
    articleHtml: buildToolIntentArticleHtml(page),
  });
}

function renderList(items: string[]): string {
  return items
    .map((item) => `      <li>${escapeHtml(item)}</li>`)
    .join("\n");
}

function renderCompare(compare: NonNullable<ToolIntentPageDefinition["compare"]>): string {
  const header = compare.headers
    .map((cell) => `          <th>${escapeHtml(cell)}</th>`)
    .join("\n");
  const rows = compare.rows
    .map((row) => {
      const cells = row
        .map((cell, index) =>
          index === 0
            ? `          <th scope="row">${escapeHtml(cell)}</th>`
            : `          <td>${escapeHtml(cell)}</td>`
        )
        .join("\n");
      return `        <tr>\n${cells}\n        </tr>`;
    })
    .join("\n");

  return `    <h2>${escapeHtml(compare.caption)}</h2>
    <table>
      <thead>
        <tr>
${header}
        </tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>`;
}

