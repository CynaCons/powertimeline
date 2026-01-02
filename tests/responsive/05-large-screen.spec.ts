/**
 * Large Screen Layout Tests
 * Tests that desktop-xl (2560px) layouts use horizontal space effectively
 *
 * Requirement: CC-REQ-LAYOUT-RESP-005
 */

import { test, expect } from '@playwright/test';
import { signInWithEmail } from '../utils/authTestUtils';

test.describe('responsive/05 Large Screen Layout', () => {

  test.beforeEach(async ({ page }, testInfo) => {
    // Skip tests that are not running on desktop-xl viewport
    test.skip(testInfo.project.name !== 'desktop-xl', 'Large screen only');
  });

  test('T-RESP-05.1: Timeline cards fill horizontal space on desktop-xl', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-LAYOUT-RESP-005' });

    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    // Wait for content to load
    await page.waitForTimeout(2000);

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    expect(viewport?.width).toBe(2560);

    // Check for timeline card sections
    const recentlyEdited = page.getByTestId('recently-edited-section');
    const popularTimelines = page.getByTestId('popular-timelines-section');

    const hasRecentlyEdited = await recentlyEdited.isVisible({ timeout: 3000 }).catch(() => false);
    const hasPopular = await popularTimelines.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasRecentlyEdited && !hasPopular) {
      test.skip('No timeline card sections available for testing');
    }

    const section = hasRecentlyEdited ? recentlyEdited : popularTimelines;
    const sectionBox = await section.boundingBox();

    expect(sectionBox).not.toBeNull();

    if (sectionBox && viewport) {
      // On desktop-xl, section should use substantial horizontal space
      // Not bunched in center (should be > 60% of viewport width)
      expect(sectionBox.width).toBeGreaterThan(viewport.width * 0.6);
    }
  });

  test('T-RESP-05.2: No wasted whitespace on sides at desktop-xl', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-LAYOUT-RESP-005' });

    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    expect(viewport?.width).toBe(2560);

    // Check browse page layout
    const browsePage = page.getByTestId('browse-page');
    await expect(browsePage).toBeVisible({ timeout: 5000 });

    const pageBox = await browsePage.boundingBox();
    expect(pageBox).not.toBeNull();

    if (pageBox && viewport) {
      // Content should use most of the width, but allow for reasonable margins
      const usedPercentage = (pageBox.width / viewport.width) * 100;

      // Should use at least 70% of viewport width (not overly constrained)
      expect(usedPercentage).toBeGreaterThan(70);
    }
  });

  test('T-RESP-05.3: Multiple timeline cards per row on desktop-xl', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-LAYOUT-RESP-005' });

    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    // Wait for timeline cards to load
    await page.waitForTimeout(2000);

    const timelineCards = page.locator('[data-testid^="timeline-card-"]');
    const cardCount = await timelineCards.count();

    if (cardCount < 2) {
      test.skip('Need at least 2 cards to test multi-column layout');
    }

    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(2560);

    // Get first two cards
    const firstCardBox = await timelineCards.nth(0).boundingBox();
    const secondCardBox = await timelineCards.nth(1).boundingBox();

    expect(firstCardBox).not.toBeNull();
    expect(secondCardBox).not.toBeNull();

    if (firstCardBox && secondCardBox) {
      // Check if cards are in the same row (Y position similar)
      const sameRow = Math.abs(firstCardBox.y - secondCardBox.y) < 50;

      // On desktop-xl, we expect multi-column layout (cards side-by-side)
      expect(sameRow).toBe(true);

      // Cards should have reasonable width (not too narrow)
      expect(firstCardBox.width).toBeGreaterThan(200);
      expect(secondCardBox.width).toBeGreaterThan(200);
    }
  });

  test('T-RESP-05.4: My Timelines section uses wide layout on desktop-xl', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-LAYOUT-RESP-005' });

    // Sign in to see My Timelines
    await signInWithEmail(page);

    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(2560);

    // My Timelines section should be visible
    const myTimelinesSection = page.getByTestId('my-timelines-section');
    await expect(myTimelinesSection).toBeVisible({ timeout: 5000 });

    const sectionBox = await myTimelinesSection.boundingBox();
    expect(sectionBox).not.toBeNull();

    if (sectionBox && viewport) {
      // Section should use substantial width on desktop-xl
      expect(sectionBox.width).toBeGreaterThan(viewport.width * 0.6);
    }
  });

  test('T-RESP-05.5: Search bar and navigation scale appropriately', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-LAYOUT-RESP-005' });

    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(2560);

    // Search bar should be visible
    const searchInput = page.getByTestId('browse-search-input');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    const searchBox = await searchInput.boundingBox();
    expect(searchBox).not.toBeNull();

    if (searchBox && viewport) {
      // Search should be accessible and reasonably sized
      expect(searchBox.width).toBeGreaterThan(100);
      expect(searchBox.width).toBeLessThan(viewport.width * 0.8);
    }

    // Navigation should be present
    const navElement = page.locator('nav, aside, header').first();
    await expect(navElement).toBeVisible({ timeout: 5000 });
  });

  test('T-RESP-05.6: Content is centered with balanced margins', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-LAYOUT-RESP-005' });

    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(2560);

    // Browse page should be visible
    const browsePage = page.getByTestId('browse-page');
    await expect(browsePage).toBeVisible({ timeout: 5000 });

    const pageBox = await browsePage.boundingBox();
    expect(pageBox).not.toBeNull();

    if (pageBox && viewport) {
      // Calculate margins on left and right
      const leftMargin = pageBox.x;
      const rightMargin = viewport.width - (pageBox.x + pageBox.width);

      // Margins should be relatively balanced (allow 30% variance)
      const marginRatio = leftMargin / (rightMargin || 1);
      expect(marginRatio).toBeGreaterThan(0.7);
      expect(marginRatio).toBeLessThan(1.3);
    }
  });
});
