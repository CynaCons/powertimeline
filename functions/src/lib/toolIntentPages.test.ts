import { describe, expect, it } from 'vitest';
import { FALLBACK_SPA_SHELL } from './prerender';
import {
  CREATE_TIMELINE_PATH,
  DEMO_TIMELINE_URLS,
  TOOL_INTENT_PAGES,
  TOOL_INTENT_SLUGS,
  buildToolIntentArticleHtml,
  injectToolIntentIntoShell,
  parseToolIntentRoute,
} from './toolIntentPages';

const OG = 'https://powertimeline.com/assets/images/PowerTimeline_banner.png';
const BASE = 'https://powertimeline.com';

describe('parseToolIntentRoute', () => {
  it('parses the three marketing paths, including trailing slashes', () => {
    expect(parseToolIntentRoute('/timeline-maker')).toBe('timeline-maker');
    expect(parseToolIntentRoute('/timelinejs-alternative/')).toBe(
      'timelinejs-alternative'
    );
    expect(parseToolIntentRoute('/frise-chronologique?utm=1')).toBe(
      'frise-chronologique'
    );
    expect(parseToolIntentRoute('/browse')).toBeNull();
    expect(parseToolIntentRoute('/cynacons/timeline/iphone-milestones')).toBeNull();
  });
});

describe('tool-intent prerender HTML', () => {
  it('injects unique title, description, canonical, and H1 for each page', () => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    const canonicals = new Set<string>();

    for (const slug of TOOL_INTENT_SLUGS) {
      const page = TOOL_INTENT_PAGES[slug];
      const html = injectToolIntentIntoShell(FALLBACK_SPA_SHELL, page, {
        baseUrl: BASE,
        ogImageUrl: OG,
      });

      expect(html).toContain(`<h1>${page.h1}</h1>`);
      expect(html).toContain(`<title>${page.title}</title>`);
      expect(html).toContain(
        `<meta name="description" content="${page.metaDescription}" />`
      );
      expect(html).toContain(
        `<link rel="canonical" href="${BASE}/${slug}" />`
      );
      expect(html).toContain(page.proofHref);
      expect(html).toContain(CREATE_TIMELINE_PATH);
      expect(html).toContain('<div id="root">');
      expect(html).toContain('<noscript>');
      expect(html).toContain('data-prerender="tool-intent"');

      titles.add(page.title);
      descriptions.add(page.metaDescription);
      canonicals.add(`${BASE}/${slug}`);
    }

    expect(titles.size).toBe(3);
    expect(descriptions.size).toBe(3);
    expect(canonicals.size).toBe(3);
  });

  it('keeps auth/export/embed/pdf FAQ slots as TODO placeholders', () => {
    const html = [
      injectToolIntentIntoShell(FALLBACK_SPA_SHELL, TOOL_INTENT_PAGES['timeline-maker'], {
        baseUrl: BASE,
        ogImageUrl: OG,
      }),
      injectToolIntentIntoShell(
        FALLBACK_SPA_SHELL,
        TOOL_INTENT_PAGES['timelinejs-alternative'],
        { baseUrl: BASE, ogImageUrl: OG }
      ),
      injectToolIntentIntoShell(
        FALLBACK_SPA_SHELL,
        TOOL_INTENT_PAGES['frise-chronologique'],
        { baseUrl: BASE, ogImageUrl: OG }
      ),
    ].join('\n');

    expect(html).toMatch(/TODO: product truth — auth/);
    expect(html).toMatch(/TODO: product truth — export/);
    expect(html).toMatch(/TODO: product truth — embed/);
    expect(html).toMatch(/TODO: product truth — pdf/);
    expect(html).not.toMatch(/paid plan|pro tier|upgrade to export/i);
  });

  it('links the assigned public demos and does not add FIFA marks', () => {
    const maker = buildToolIntentArticleHtml(TOOL_INTENT_PAGES['timeline-maker']);
    const alt = buildToolIntentArticleHtml(TOOL_INTENT_PAGES['timelinejs-alternative']);
    const fr = buildToolIntentArticleHtml(TOOL_INTENT_PAGES['frise-chronologique']);

    expect(maker).toContain(DEMO_TIMELINE_URLS.iphone);
    expect(alt).toContain(DEMO_TIMELINE_URLS.react);
    expect(fr).toContain(DEMO_TIMELINE_URLS.wc2022);
    expect(fr.toLowerCase()).not.toContain('fifa');
  });

  it('sets html lang=fr on the French page', () => {
    const html = injectToolIntentIntoShell(
      FALLBACK_SPA_SHELL,
      TOOL_INTENT_PAGES['frise-chronologique'],
      { baseUrl: BASE, ogImageUrl: OG }
    );
    expect(html).toMatch(/<html lang="fr"/);
  });

  it('omits TODO FAQ answers from JSON-LD', () => {
    const html = injectToolIntentIntoShell(
      FALLBACK_SPA_SHELL,
      TOOL_INTENT_PAGES['timeline-maker'],
      { baseUrl: BASE, ogImageUrl: OG }
    );
    const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map((match) => match[1])
      .join('\n');
    expect(jsonLd).toContain('"@type":"FAQPage"');
    expect(jsonLd).toContain('Is PowerTimeline free?');
    expect(jsonLd).not.toContain('Do I need an account?');
    expect(jsonLd).not.toContain('TODO: product truth');
  });
});
