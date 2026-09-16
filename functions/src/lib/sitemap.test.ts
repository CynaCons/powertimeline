import { describe, expect, it } from 'vitest';
import {
  buildSitemapXml,
  emptyUrlsetXml,
  staticSitemapEntries,
  timelineSitemapEntry,
  userSitemapEntry,
} from './sitemap';

const BASE = 'https://powertimeline.com';

describe('sitemap XML', () => {
  it('always returns a valid urlset, including when empty', () => {
    const xml = emptyUrlsetXml();
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('</urlset>');
    expect(xml).not.toContain('<url>');
  });

  it('includes static pages and public timeline URLs', () => {
    const userMap = new Map([['uid-1', 'alice']]);
    const entries = [
      ...staticSitemapEntries(BASE),
      userSitemapEntry(BASE, 'alice')!,
      timelineSitemapEntry(
        BASE,
        {
          id: 'timeline-french-revolution',
          ownerUsername: 'alice',
          visibility: 'public',
          updatedAt: '2024-07-14T12:00:00.000Z',
        },
        userMap
      )!,
    ];
    const xml = buildSitemapXml(entries);
    expect(xml).toContain(`${BASE}/`);
    expect(xml).toContain(`${BASE}/browse`);
    expect(xml).toContain(`${BASE}/alice`);
    expect(xml).toContain(`${BASE}/alice/timeline/timeline-french-revolution`);
    expect(xml).toContain('<lastmod>2024-07-14</lastmod>');
  });

  it('treats missing visibility as public and skips private/unlisted', () => {
    expect(
      timelineSitemapEntry(BASE, { id: 't1', ownerUsername: 'bob' })?.loc
    ).toBe(`${BASE}/bob/timeline/t1`);
    expect(
      timelineSitemapEntry(BASE, {
        id: 't2',
        ownerUsername: 'bob',
        visibility: 'private',
      })
    ).toBeNull();
    expect(
      timelineSitemapEntry(BASE, {
        id: 't3',
        ownerUsername: 'bob',
        visibility: 'unlisted',
      })
    ).toBeNull();
  });

  it('omits invalid lastmod instead of crashing', () => {
    const entry = timelineSitemapEntry(BASE, {
      id: 't1',
      ownerUsername: 'bob',
      visibility: 'public',
      updatedAt: { nested: true },
    });
    expect(entry?.loc).toContain('/bob/timeline/t1');
    expect(entry?.lastmod).toBeUndefined();
    expect(() => buildSitemapXml([entry!])).not.toThrow();
  });

  it('uses Timestamp-safe lastmod', () => {
    const entry = timelineSitemapEntry(BASE, {
      id: 't1',
      ownerUsername: 'bob',
      visibility: 'public',
      updatedAt: { toDate: () => new Date('2022-03-04T00:00:00.000Z') },
    });
    expect(entry?.lastmod).toBe('2022-03-04');
  });

  it('escapes XML special characters in loc', () => {
    const xml = buildSitemapXml([
      { loc: 'https://powertimeline.com/a&b', priority: '0.5' },
    ]);
    expect(xml).toContain('https://powertimeline.com/a&amp;b');
  });
});
