/**
 * Popular Timelines Feed Tests (v5/79)
 * Verifies CC-REQ-POPULAR-001 for discovery feed ordering and visibility
 */

import { test, expect } from '@playwright/test';
import { seedTimelinesForTestUser } from '../utils/timelineSeedUtils';

test.describe.serial('v5/79 Popular Timelines Feed', () => {
  const uniqueSuffix = `popular-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const topTimeline = { title: `Popular Leader ${uniqueSuffix}`, slug: `popular-leader-${uniqueSuffix}` };
  const runnerTimeline = { title: `Popular Runner ${uniqueSuffix}`, slug: `popular-runner-${uniqueSuffix}` };
  const privateTimeline = { title: `Popular Private ${uniqueSuffix}`, slug: `popular-private-${uniqueSuffix}` };

  test.beforeAll(async () => {
    // Seed timelines directly via Firestore Admin SDK with view counts
    await seedTimelinesForTestUser([
      { ...topTimeline, visibility: 'public', viewCount: 100 },
      { ...runnerTimeline, visibility: 'public', viewCount: 50 },
      { ...privateTimeline, visibility: 'private', viewCount: 200 },
    ]);
  });

  test('T79.1: Popular section visible on browse', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-POPULAR-001' });

    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByTestId('popular-timelines-section')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('popular-timelines-heading')).toBeVisible({ timeout: 15000 });
  });

  test('T79.2: Timelines sorted by view count (most popular first)', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-POPULAR-001' });

    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    const popularSection = page.getByTestId('popular-timelines-section');
    await expect(popularSection).toBeVisible({ timeout: 15000 });
    await expect(popularSection.getByText(topTimeline.title, { exact: false })).toBeVisible({ timeout: 20000 });
    await expect(popularSection.getByText(runnerTimeline.title, { exact: false })).toBeVisible({ timeout: 20000 });

    const cardTitles = await popularSection.locator('h3').allTextContents();
    const topIndex = cardTitles.findIndex(title => title.includes(topTimeline.title));
    const runnerIndex = cardTitles.findIndex(title => title.includes(runnerTimeline.title));

    expect(topIndex).toBeGreaterThanOrEqual(0);
    expect(runnerIndex).toBeGreaterThanOrEqual(0);
    expect(topIndex).toBeLessThan(runnerIndex);
  });

  test('T79.3: Private timelines excluded from popular feed', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-POPULAR-001' });

    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    const popularSection = page.getByTestId('popular-timelines-section');
    await expect(popularSection).toBeVisible({ timeout: 15000 });

    const leakVisible = await popularSection
      .getByText(privateTimeline.title, { exact: false })
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    expect(leakVisible).toBe(false);
  });

  test('T79.4: Popular feed shows a maximum of 10 timelines', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-POPULAR-001' });

    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    const popularSection = page.getByTestId('popular-timelines-section');
    await expect(popularSection).toBeVisible({ timeout: 15000 });
    await expect(popularSection.locator('h3').first()).toBeVisible({ timeout: 20000 });

    const cardCount = await popularSection.locator('h3').count();
    expect(cardCount).toBeLessThanOrEqual(10);
  });

  test('T79.5: Popular cards display view counts', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-POPULAR-001' });

    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    const popularSection = page.getByTestId('popular-timelines-section');
    await expect(popularSection).toBeVisible({ timeout: 15000 });
    const topCard = popularSection.locator('div', {
      has: page.locator('h3', { hasText: topTimeline.title }),
    }).first();

    await expect(topCard).toBeVisible({ timeout: 20000 });
    await expect(topCard.getByText(/views/i)).toBeVisible({ timeout: 5000 });
  });
});
