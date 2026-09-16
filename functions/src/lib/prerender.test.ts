import { describe, expect, it } from 'vitest';
import {
  FALLBACK_SPA_SHELL,
  buildArticleHtml,
  canPrerenderTimeline,
  injectTimelineIntoShell,
  parseTimelineRoute,
} from './prerender';

const payload = {
  canonicalUrl: 'https://powertimeline.com/alice/timeline/timeline-french-revolution',
  embed: false,
  username: 'alice',
  ogImageUrl: 'https://powertimeline.com/og.png',
  timeline: {
    id: 'timeline-french-revolution',
    title: 'French Revolution',
    description: 'From the Estates-General to Napoleon.',
    visibility: 'public',
    eventCount: 2,
  },
  events: [
    {
      date: '1789-07-14',
      title: 'Storming of the Bastille',
      description: 'Parisian crowds seize the fortress.',
    },
    {
      date: '1789-08-26',
      title: 'Declaration of the Rights of Man',
    },
  ],
};

describe('parseTimelineRoute', () => {
  it('parses username, embed, and legacy userId routes', () => {
    expect(parseTimelineRoute('/alice/timeline/timeline-french-revolution')).toEqual({
      username: 'alice',
      timelineId: 'timeline-french-revolution',
      embed: false,
    });
    expect(parseTimelineRoute('/alice/timeline/timeline-french-revolution/embed')).toEqual({
      username: 'alice',
      timelineId: 'timeline-french-revolution',
      embed: true,
    });
    expect(parseTimelineRoute('/user/uid123/timeline/timeline-french-revolution')).toEqual({
      userId: 'uid123',
      timelineId: 'timeline-french-revolution',
      embed: false,
    });
    expect(parseTimelineRoute('/browse')).toBeNull();
  });
});

describe('prerender HTML', () => {
  it('puts event text in the document for JS-off / curl clients', () => {
    const html = injectTimelineIntoShell(FALLBACK_SPA_SHELL, payload);
    expect(html).toContain('Storming of the Bastille');
    expect(html).toContain('Declaration of the Rights of Man');
    expect(html).toContain('French Revolution');
    expect(html).toContain('<div id="root">');
    expect(html).toContain('<noscript>');
    expect(html).toContain('<title>French Revolution | PowerTimeline</title>');
    expect(html).toContain('og:title');
  });

  it('escapes HTML in titles and descriptions', () => {
    const html = buildArticleHtml({
      ...payload,
      timeline: { ...payload.timeline, title: '<script>alert(1)</script>' },
      events: [{ title: 'A & B <C>', description: 'x"y' }],
    });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('A &amp; B &lt;C&gt;');
  });

  it('allows public and unlisted, but not private', () => {
    expect(canPrerenderTimeline(undefined)).toBe(true);
    expect(canPrerenderTimeline('public')).toBe(true);
    expect(canPrerenderTimeline('unlisted')).toBe(true);
    expect(canPrerenderTimeline('private')).toBe(false);
  });

  it('marks unlisted and embed routes noindex', () => {
    const unlisted = injectTimelineIntoShell(FALLBACK_SPA_SHELL, {
      ...payload,
      timeline: { ...payload.timeline, visibility: 'unlisted' },
    });
    expect(unlisted).toContain('noindex');
    const embed = injectTimelineIntoShell(FALLBACK_SPA_SHELL, {
      ...payload,
      embed: true,
    });
    expect(embed).toContain('noindex');
  });
});
