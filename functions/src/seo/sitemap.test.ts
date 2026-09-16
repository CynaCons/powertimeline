import { describe, expect, it } from 'vitest';
import { toLastmodDate } from './timestamps';
import {
  buildSitemapXml,
  collectTimelineEntries,
  isListedInSitemap,
  staticSitemapEntries,
} from './sitemap';

describe('toLastmodDate', () => {
  it('converts ISO strings', () => {
    expect(toLastmodDate('2024-06-02T15:04:05.000Z')).toBe('2024-06-02');
  });

  it('converts Firestore Timestamp-like objects without throwing', () => {
    const timestamp = { seconds: 1_700_000_000, nanoseconds: 0 };
    expect(() => new Date(timestamp as unknown as string).toISOString()).toThrow();
    expect(toLastmodDate(timestamp)).toBe('2023-11-14');
  });

  it('converts objects with toDate()', () => {
    const timestamp = {
      toDate: () => new Date('2025-01-15T00:00:00.000Z'),
    };
    expect(toLastmodDate(timestamp)).toBe('2025-01-15');
  });

  it('omits invalid values instead of throwing', () => {
    expect(toLastmodDate('not-a-date')).toBeUndefined();
    expect(toLastmodDate({})).toBeUndefined();
    expect(toLastmodDate(undefined)).toBeUndefined();
    expect(toLastmodDate({ toDate: () => { throw new Error('boom'); } })).toBeUndefined();
  });
});

describe('sitemap builder', () => {
  it('lists public timelines and skips private/unlisted/bad rows', () => {
    const userMap = new Map([['u1', 'cynacons']]);
    const entries = collectTimelineEntries(
      [
        {
          id: 'timeline-napoleon',
          ownerId: 'u1',
          visibility: 'public',
          updatedAt: { seconds: 1_700_000_000, nanoseconds: 0 },
        },
        {
          id: 'secret',
          ownerUsername: 'cynacons',
          visibility: 'private',
        },
        {
          id: 'unlisted-one',
          ownerUsername: 'cynacons',
          visibility: 'unlisted',
        },
        {
          id: 'legacy-public',
          ownerUsername: 'cynacons',
          updatedAt: 'totally-invalid',
        },
        {
          id: '',
          ownerUsername: 'cynacons',
          visibility: 'public',
        },
      ],
      userMap
    );

    expect(entries.map((e) => e.loc)).toEqual([
      'https://powertimeline.com/cynacons/timeline/timeline-napoleon',
      'https://powertimeline.com/cynacons/timeline/legacy-public',
    ]);
    expect(entries[0].lastmod).toBe('2023-11-14');
    expect(entries[1].lastmod).toBeUndefined();
  });

  it('treats missing visibility as public', () => {
    expect(isListedInSitemap(undefined)).toBe(true);
    expect(isListedInSitemap('public')).toBe(true);
    expect(isListedInSitemap('private')).toBe(false);
  });

  it('builds XML that includes public URLs and never throws on Timestamp lastmod', () => {
    const xml = buildSitemapXml([
      ...staticSitemapEntries(),
      ...collectTimelineEntries(
        [
          {
            id: 'timeline-napoleon',
            ownerUsername: 'cynacons',
            visibility: 'public',
            updatedAt: { _seconds: 1_700_000_000, _nanoseconds: 1 },
          },
        ],
        new Map()
      ),
    ]);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<loc>https://powertimeline.com/cynacons/timeline/timeline-napoleon</loc>');
    expect(xml).toContain('<lastmod>2023-11-14</lastmod>');
    expect(xml).toContain('<loc>https://powertimeline.com/browse</loc>');
  });
});
