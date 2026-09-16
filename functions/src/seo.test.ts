import { describe, expect, it } from "vitest";
import {
  BASE_URL,
  STATIC_SITEMAP_PAGES,
  buildCrawlerArticle,
  buildSitemapXml,
  buildStandaloneHtml,
  escapeHtml,
  injectTimelineSeo,
  isListedInSitemap,
  isShareable,
  parseTimelinePath,
  toLastmod,
  timelineCanonicalUrl,
} from "./seo";

const SPA_SHELL = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>PowerTimeline - Where Events Become Understanding</title>
    <meta name="description" content="Generic description" />
    <meta property="og:title" content="PowerTimeline - Where Events Become Understanding" />
    <meta property="og:description" content="Generic description" />
    <meta property="og:url" content="https://powertimeline.com/" />
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

describe("toLastmod", () => {
  it("serializes ISO strings", () => {
    expect(toLastmod("2026-03-15T12:00:00.000Z")).toBe("2026-03-15");
  });

  it("serializes Date objects", () => {
    expect(toLastmod(new Date("2026-01-02T00:00:00.000Z"))).toBe("2026-01-02");
  });

  it("serializes Firestore Timestamp-like objects without throwing", () => {
    const timestamp = {
      seconds: 1_704_067_200,
      nanoseconds: 0,
      toDate() {
        return new Date(this.seconds * 1000);
      },
    };
    expect(toLastmod(timestamp)).toBe("2024-01-01");
  });

  it("serializes Admin SDK proto shape with _seconds", () => {
    expect(toLastmod({ _seconds: 1_704_067_200, _nanoseconds: 0 })).toBe(
      "2024-01-01"
    );
  });

  it("returns undefined for invalid values instead of throwing", () => {
    expect(toLastmod("not a date")).toBeUndefined();
    expect(toLastmod({})).toBeUndefined();
    expect(toLastmod(undefined)).toBeUndefined();
    expect(toLastmod(null)).toBeUndefined();
    expect(() => toLastmod({ toDate: () => new Date("nope") })).not.toThrow();
  });

  it("does not throw the way the previous Date(timestamp).toISOString() path did", () => {
    const firestoreTimestamp = { seconds: 1_704_067_200, nanoseconds: 0 };
    expect(() =>
      new Date(firestoreTimestamp as unknown as string).toISOString()
    ).toThrow();
    expect(toLastmod(firestoreTimestamp)).toBe("2024-01-01");
  });
});

describe("visibility helpers", () => {
  it("lists public and legacy-missing visibility in the sitemap", () => {
    expect(isListedInSitemap("public")).toBe(true);
    expect(isListedInSitemap(undefined)).toBe(true);
    expect(isListedInSitemap("unlisted")).toBe(false);
    expect(isListedInSitemap("private")).toBe(false);
  });

  it("treats public and unlisted as shareable, not private", () => {
    expect(isShareable("public")).toBe(true);
    expect(isShareable("unlisted")).toBe(true);
    expect(isShareable(undefined)).toBe(true);
    expect(isShareable("private")).toBe(false);
  });
});

describe("buildSitemapXml", () => {
  it("returns a valid empty-ish sitemap for static pages only", () => {
    const xml = buildSitemapXml(STATIC_SITEMAP_PAGES);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("<urlset");
    expect(xml).toContain(`${BASE_URL}/browse`);
    expect(xml).toContain("</urlset>");
  });

  it("includes public timeline URLs and omits invalid lastmod", () => {
    const xml = buildSitemapXml([
      {
        loc: `${BASE_URL}/cynacons/timeline/french-revolution`,
        lastmod: "2026-09-16",
        priority: "0.8",
      },
      {
        loc: `${BASE_URL}/cynacons/timeline/broken-date`,
        lastmod: "Invalid Date",
        priority: "0.8",
      },
    ]);
    expect(xml).toContain(
      `${BASE_URL}/cynacons/timeline/french-revolution`
    );
    expect(xml).toContain("<lastmod>2026-09-16</lastmod>");
    expect(xml).not.toContain("Invalid Date");
    expect(xml).toContain(
      `${BASE_URL}/cynacons/timeline/broken-date`
    );
  });

  it("escapes special characters in loc", () => {
    const xml = buildSitemapXml([
      { loc: `${BASE_URL}/a&b/timeline/x<y>` },
    ]);
    expect(xml).toContain("&amp;");
    expect(xml).toContain("&lt;");
    expect(xml).not.toContain("a&b");
  });

  it("returns a valid sitemap with zero entries", () => {
    const xml = buildSitemapXml([]);
    expect(xml).toContain("<urlset");
    expect(xml).toContain("</urlset>");
    expect(xml).not.toContain("<url>");
  });
});

describe("parseTimelinePath", () => {
  it("parses public timeline and embed routes", () => {
    expect(parseTimelinePath("/cynacons/timeline/french-revolution")).toEqual({
      username: "cynacons",
      timelineId: "french-revolution",
      embed: false,
    });
    expect(
      parseTimelinePath("/cynacons/timeline/french-revolution/embed")
    ).toEqual({
      username: "cynacons",
      timelineId: "french-revolution",
      embed: true,
    });
  });

  it("rejects reserved first segments and unrelated paths", () => {
    expect(parseTimelinePath("/browse")).toBeNull();
    expect(parseTimelinePath("/login")).toBeNull();
    expect(parseTimelinePath("/admin/timeline/x")).toBeNull();
    expect(parseTimelinePath("/sitemap.xml")).toBeNull();
  });
});

describe("crawler HTML", () => {
  const seoInput = {
    username: "cynacons",
    timelineId: "french-revolution",
    title: "French Revolution",
    description: "A chronology of the French Revolution.",
    events: [
      {
        date: "1789-07-14",
        title: "Storming of the Bastille",
        description: "Parisian crowds seize the Bastille.",
      },
      { date: "1789-08-26", title: "Declaration of the Rights of Man" },
    ],
    eventCount: 2,
    embed: false,
    canonicalUrl: timelineCanonicalUrl("cynacons", "french-revolution"),
  };

  it("injects title, meta, and event text into the SPA shell", () => {
    const html = injectTimelineSeo(SPA_SHELL, seoInput);
    expect(html).toContain("<title>French Revolution | PowerTimeline</title>");
    expect(html).toContain('property="og:title"');
    expect(html).toContain("French Revolution | PowerTimeline");
    expect(html).toContain("Storming of the Bastille");
    expect(html).toContain("Parisian crowds seize the Bastille.");
    expect(html).toContain("Declaration of the Rights of Man");
    expect(html).toContain('id="seo-timeline"');
    expect(html).not.toMatch(/<div id="root"><\/div>/);
  });

  it("escapes untrusted timeline text", () => {
    const html = buildCrawlerArticle({
      ...seoInput,
      title: `<script>alert(1)</script>`,
      events: [{ title: `Foo</li><script>alert(1)</script>`, date: "1789" }],
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(escapeHtml("<b>")).toBe("&lt;b&gt;");
  });

  it("marks embed pages noindex while still including event text", () => {
    const html = injectTimelineSeo(SPA_SHELL, { ...seoInput, embed: true });
    expect(html).toContain("noindex,follow");
    expect(html).toContain("French Revolution (Embed) | PowerTimeline");
    expect(html).toContain("Storming of the Bastille");
  });

  it("builds standalone HTML when the SPA shell cannot be fetched", () => {
    const html = buildStandaloneHtml(seoInput);
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("French Revolution");
    expect(html).toContain("Storming of the Bastille");
    expect(html).toContain('id="root"');
  });
});
