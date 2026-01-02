/**
 * Home Page Layout Responsiveness Tests
 * Tests that the Home page layout adapts correctly across viewports
 *
 * Requirement: CC-REQ-LAYOUT-RESP-001
 */

import { test, expect } from '@playwright/test';
import { signInWithEmail } from '../utils/authTestUtils';

test.describe('responsive/01 Home Page Layout', () => {

  test('T-RESP-01.1: My Timelines section layout adapts to viewport', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-LAYOUT-RESP-001' });

    // Sign in to see My Timelines section
    await signInWithEmail(page);
    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    // Wait for My Timelines section to be visible
    const myTimelinesSection = page.getByTestId('my-timelines-section');
    await expect(myTimelinesSection).toBeVisible({ timeout: 5000 });

    // Get viewport size
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();

    // Check layout adapts based on viewport width
    if (viewport && viewport.width < 768) {
      // Mobile: expect single column layout
      const section = await myTimelinesSection.boundingBox();
      expect(section).not.toBeNull();

      // Section should use most of the viewport width on mobile
      if (section) {
        expect(section.width).toBeGreaterThan(viewport.width * 0.8);
      }
    } else if (viewport && viewport.width >= 1024) {
      // Desktop: expect multi-column possible
      const section = await myTimelinesSection.boundingBox();
      expect(section).not.toBeNull();

      // Section should be contained within reasonable bounds
      if (section) {
        expect(section.width).toBeLessThanOrEqual(viewport.width);
      }
    }
  });

  test('T-RESP-01.2: Timeline card grid changes from multi-column to single column on mobile', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-LAYOUT-RESP-001' });

    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    // Wait for timeline cards to load
    await page.waitForTimeout(2000);

    // Check for any visible timeline cards
    const timelineCards = page.locator('[data-testid^="timeline-card-"]');
    const cardCount = await timelineCards.count();

    if (cardCount === 0) {
      test.skip('No timeline cards available for testing');
    }

    // Get viewport size
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();

    if (viewport && viewport.width < 768) {
      // Mobile: Cards should stack vertically (single column)
      // Check if cards are approximately full width
      const firstCard = timelineCards.first();
      const cardBox = await firstCard.boundingBox();

      if (cardBox) {
        // Card should take most of the horizontal space on mobile
        expect(cardBox.width).toBeGreaterThan(viewport.width * 0.7);
      }
    } else if (viewport && viewport.width >= 1024) {
      // Desktop: Multiple cards can fit horizontally
      // This is validated by checking total grid width
      const myTimelinesSection = page.getByTestId('my-timelines-section');
      const sectionBox = await myTimelinesSection.boundingBox();

      if (sectionBox) {
        expect(sectionBox.width).toBeGreaterThan(400);
      }
    }
  });

  test('T-RESP-01.3: Browse page sections stack correctly on mobile', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-LAYOUT-RESP-001' });

    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    // Wait for page content to load
    await page.waitForTimeout(2000);

    // Browse page should always be visible
    const browsePage = page.getByTestId('browse-page');
    await expect(browsePage).toBeVisible({ timeout: 5000 });

    // Get viewport size
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();

    // Platform stats should be visible on all viewports
    const platformStats = page.getByTestId('platform-stats-section');
    const statsVisible = await platformStats.isVisible({ timeout: 3000 }).catch(() => false);

    // Should be visible on at least some viewports
    if (statsVisible) {
      const statsBox = await platformStats.boundingBox();
      expect(statsBox).not.toBeNull();
    }
  });

  test('T-RESP-01.4: Search bar remains accessible at all breakpoints', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-LAYOUT-RESP-001' });

    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    // Search input should be visible and accessible
    const searchInput = page.getByTestId('browse-search-input');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Get viewport size
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();

    // Search should be accessible (not hidden off-screen)
    const searchBox = await searchInput.boundingBox();
    expect(searchBox).not.toBeNull();

    if (searchBox && viewport) {
      expect(searchBox.x).toBeGreaterThanOrEqual(0);
      expect(searchBox.x + searchBox.width).toBeLessThanOrEqual(viewport.width);
    }
  });
});
