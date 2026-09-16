import { describe, expect, it } from 'vitest';
import { parsePublicTimelinePath, requestPath } from './routes';
import {
  fallbackPublicTimelineHtml,
  injectPublicTimelineHtml,
  isShareableVisibility,
} from './render';

const SPA_SHELL = `<!doctype html>
<html lang="en">
  <head>
    <title>PowerTimeline - Where Events Become Understanding</title>
    <meta name="description" content="Connect the dots between events." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://powertimeline.com/" />
    <meta property="og:title" content="PowerTimeline - Where Events Become Understanding" />
    <meta property="og:description" content="Connect the dots between events." />
    <meta property="twitter:title" content="PowerTimeline - Where Events Become Understanding" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/index.js"></script>
  </body>
</html>`;

const napoleonPage = {
  title: 'Napoleon Bonaparte',
  description: 'Life of Napoleon',
  username: 'cynacons',
  timelineId: 'timeline-napoleon',
  canonicalUrl: 'https://powertimeline.com/cynacons/timeline/timeline-napoleon',
  isEmbed: false,
  events: [
    {
      date: '1769-08-15',
      title: 'Birth of Napoleon',
      description: 'Born in Ajaccio, Corsica.',
    },
    {
      date: '1804-12-02',
      title: 'Coronation',
      description: 'Crowned Emperor of the French.',
    },
  ],
};

describe('parsePublicTimelinePath', () => {
  it('parses timeline and embed routes', () => {
    expect(parsePublicTimelinePath('/cynacons/timeline/timeline-napoleon')).toEqual({
      username: 'cynacons',
      timelineId: 'timeline-napoleon',
      isEmbed: false,
    });
    expect(
      parsePublicTimelinePath('/cynacons/timeline/timeline-napoleon/embed')
    ).toEqual({
      username: 'cynacons',
      timelineId: 'timeline-napoleon',
      isEmbed: true,
    });
  });

  it('rejects reserved and unrelated paths', () => {
    expect(parsePublicTimelinePath('/browse')).toBeNull();
    expect(parsePublicTimelinePath('/cynacons')).toBeNull();
    expect(parsePublicTimelinePath('/api/v1/timelines/x/events')).toBeNull();
    expect(parsePublicTimelinePath('/admin/timeline/x')).toBeNull();
  });

  it('reads the path from an HTTP request', () => {
    expect(
      requestPath({ originalUrl: '/cynacons/timeline/timeline-napoleon?utm=1' })
    ).toBe('/cynacons/timeline/timeline-napoleon');
    expect(
      requestPath({
        path: '/',
        headers: { 'x-forwarded-uri': '/cynacons/timeline/timeline-napoleon/embed' },
      })
    ).toBe('/cynacons/timeline/timeline-napoleon/embed');
  });
});

describe('public timeline HTML', () => {
  it('injects title, OG tags, and event text into #root', () => {
    const html = injectPublicTimelineHtml(SPA_SHELL, napoleonPage);

    expect(html).toContain('<title>Napoleon Bonaparte | PowerTimeline</title>');
    expect(html).toContain('content="Life of Napoleon"');
    expect(html).toContain(
      'content="https://powertimeline.com/cynacons/timeline/timeline-napoleon"'
    );
    expect(html).toContain('Birth of Napoleon');
    expect(html).toContain('Born in Ajaccio, Corsica.');
    expect(html).toContain('Coronation');
    expect(html).toContain('data-ssr-timeline="true"');
    expect(html).toContain('<div id="root">');
    expect(html).toContain('<script type="module" src="/assets/index.js">');
  });

  it('escapes XSS in event text', () => {
    const html = injectPublicTimelineHtml(SPA_SHELL, {
      ...napoleonPage,
      title: '<script>alert(1)</script>',
      events: [{ title: '<img src=x onerror=alert(1)>', description: 'ok' }],
    });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('fallback HTML still contains event text when the SPA shell is missing', () => {
    const html = fallbackPublicTimelineHtml(napoleonPage);
    expect(html).toContain('Birth of Napoleon');
    expect(html).toContain('Napoleon Bonaparte');
  });

  it('treats public and unlisted as shareable, private as not', () => {
    expect(isShareableVisibility('public')).toBe(true);
    expect(isShareableVisibility('unlisted')).toBe(true);
    expect(isShareableVisibility(undefined)).toBe(true);
    expect(isShareableVisibility('private')).toBe(false);
  });
});
