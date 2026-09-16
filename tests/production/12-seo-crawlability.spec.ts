/**
 * Production crawlability checks for sitemap + prerendered public timelines.
 * Requires Cloud Functions deploy (sitemap, renderPublicTimeline) plus hosting rewrites.
 */

import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'https://powertimeline.com';
const PUBLIC_TIMELINE_URL = `${PRODUCTION_URL}/cynacons/timeline/timeline-french-revolution`;
const PUBLIC_EMBED_URL = `${PUBLIC_TIMELINE_URL}/embed`;

test.describe('Production SEO crawlability', () => {
  test('sitemap.xml returns 200 with a valid urlset', async ({ request }) => {
    const response = await request.get(`${PRODUCTION_URL}/sitemap.xml`);
    expect(response.status(), await response.text()).toBe(200);
    const body = await response.text();
    expect(body).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(body).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(body).toContain('</urlset>');
    expect(body).not.toContain('Error generating sitemap');
    expect(body).toContain(`${PRODUCTION_URL}/browse`);
  });

  test.describe('JS disabled', () => {
    test.use({ javaScriptEnabled: false });

    test('public timeline HTML includes event text without JavaScript', async ({ page }) => {
      const response = await page.goto(PUBLIC_TIMELINE_URL);
      expect(response?.ok()).toBeTruthy();
      const body = await page.locator('body').innerText();
      expect(body.length).toBeGreaterThan(80);
      expect(body).toMatch(/French Revolution|Bastille|timeline|PowerTimeline/i);
      expect(body).not.toBe('');
    });

    test('embed route HTML includes timeline content without JavaScript', async ({ page }) => {
      const response = await page.goto(PUBLIC_EMBED_URL);
      expect(response?.ok()).toBeTruthy();
      const body = await page.locator('body').innerText();
      expect(body.length).toBeGreaterThan(80);
      expect(body).toMatch(/French Revolution|Bastille|timeline|PowerTimeline/i);
    });
  });
});
