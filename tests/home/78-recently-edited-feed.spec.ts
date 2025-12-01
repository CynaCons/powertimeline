/**
 * Recently Edited Feed Regression Tests (v5/78)
 * v0.5.15 - Coverage for CC-REQ-RECENT-001
 *
 * Cases:
 * - T78.1: Recently Edited section visible on browse
 * - T78.2: Timelines sorted by most recently edited
 * - T78.3: Private timelines excluded
 * - T78.4: Maximum of 10 timelines shown
 * - T78.5: Cards show title, author, and last edited time
 */

import { test, expect, type Page } from '@playwright/test';
import { seedTimelinesForTestUser } from '../utils/timelineSeedUtils';

test.describe.serial('v5/78 Recently Edited Feed', () => {
  const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const publicTimelines = Array.from({ length: 11 }).map((_, index) => ({
    title: `Recent Feed Public ${index + 1} ${uniqueSuffix}`,
    slug: `recent-feed-public-${index + 1}-${uniqueSuffix}`,
  }));
  const privateTimeline = {
    title: `Recent Feed Private ${uniqueSuffix}`,
    slug: `recent-feed-private-${uniqueSuffix}`,
  };

  const waitForRecentlyEdited = async (page: Page) => {
    const section = page.getByTestId('recently-edited-section');
    await expect(section).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(2000);
    return section;
  };

  test.beforeAll(async () => {
    // Seed timelines directly via Firestore Admin SDK (much faster than UI)
    const baseTime = Date.now();
    const timelinesWithDates = publicTimelines.map((t, i) => ({
      ...t,
      visibility: 'public' as const,
      updatedAt: new Date(baseTime + i * 1000).toISOString(),
    }));
    timelinesWithDates.push({
      ...privateTimeline,
      visibility: 'private' as const,
      updatedAt: new Date(baseTime + publicTimelines.length * 1000).toISOString(),
    });
    await seedTimelinesForTestUser(timelinesWithDates);
  });

  test('T78.1: Recently Edited section visible on /browse', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-RECENT-001' });

    await page.goto('/browse');
    const recentSection = await waitForRecentlyEdited(page);

    await expect(recentSection.getByTestId('recently-edited-heading')).toBeVisible({ timeout: 5000 });
  });

  test('T78.2: Timelines sorted by most recently edited', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-RECENT-001' });

    await page.goto('/browse');
    const recentSection = await waitForRecentlyEdited(page);

    const cardData = await recentSection.locator('div.border.rounded-lg').evaluateAll(cards =>
      cards.map(card => {
        const title = card.querySelector('h3')?.textContent?.trim() || '';
        const metaRow = card.querySelector('div.flex.items-center.justify-between');
        const spans = metaRow ? Array.from(metaRow.querySelectorAll('span')) : [];
        const lastEdited = spans[1]?.textContent?.trim() || '';
        return { title, lastEdited };
      })
    );

    expect(cardData.length).toBeGreaterThan(1);

    const parsedDates = cardData.map(d => Date.parse(d.lastEdited));
    expect(parsedDates.every(ts => !Number.isNaN(ts))).toBe(true);

    for (let i = 1; i < parsedDates.length; i += 1) {
      expect(parsedDates[i - 1]).toBeGreaterThanOrEqual(parsedDates[i]);
    }

    expect(cardData[0].title).toBe(publicTimelines[publicTimelines.length - 1].title);
    expect(cardData[1].title).toBe(publicTimelines[publicTimelines.length - 2].title);
  });

  test('T78.3: Private timelines excluded from Recently Edited', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-RECENT-001' });

    await page.goto('/browse');
    const recentSection = await waitForRecentlyEdited(page);

    const privateVisible = await recentSection
      .getByText(privateTimeline.title, { exact: false })
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    expect(privateVisible).toBe(false);
  });

  test('T78.4: Maximum 10 timelines shown', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-RECENT-001' });

    await page.goto('/browse');
    const recentSection = await waitForRecentlyEdited(page);

    const cardCount = await recentSection.locator('h3').count();
    expect(cardCount).toBe(10);
  });

  test('T78.5: Timeline cards show title, author, and last edited time', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-RECENT-001' });

    await page.goto('/browse');
    const recentSection = await waitForRecentlyEdited(page);
    const targetTitle = publicTimelines[publicTimelines.length - 1].title;

    const card = recentSection.locator('div.border.rounded-lg').filter({ hasText: targetTitle }).first();
    await expect(card).toBeVisible({ timeout: 15000 });

    const cardInfo = await card.evaluate(cardEl => {
      const title = cardEl.querySelector('h3')?.textContent?.trim() || '';
      const owner = cardEl.querySelector('div.absolute.bottom-2.left-2 span')?.textContent?.trim() || '';
      const metaRow = cardEl.querySelector('div.flex.items-center.justify-between');
      const spans = metaRow ? Array.from(metaRow.querySelectorAll('span')) : [];
      const lastEdited = spans[1]?.textContent?.trim() || '';
      return { title, owner, lastEdited };
    });

    expect(cardInfo.title).toBe(targetTitle);
    expect(cardInfo.owner.startsWith('@')).toBe(true);
    expect(cardInfo.lastEdited).not.toBe('');
    expect(Date.parse(cardInfo.lastEdited)).not.toBeNaN();
  });
});
