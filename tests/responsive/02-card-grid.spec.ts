/**
 * Timeline Card Grid Responsiveness Tests
 * Tests that timeline card grids fill available space correctly
 *
 * Requirement: CC-REQ-LAYOUT-RESP-002
 */

import { test, expect } from '@playwright/test';

test.describe('responsive/02 Timeline Card Grid', () => {

  test('T-RESP-02.1: Card grid fills available horizontal space', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-LAYOUT-RESP-002' });

    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Get viewport size
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();

    // Check for timeline sections
    const recentlyEdited = page.getByTestId('recently-edited-section');
    const popularTimelines = page.getByTestId('popular-timelines-section');

    const hasRecentlyEdited = await recentlyEdited.isVisible({ timeout: 3000 }).catch(() => false);
    const hasPopular = await popularTimelines.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasRecentlyEdited && !hasPopular) {
      test.skip('No timeline card sections available for testing');
    }

    // Check the first visible section
    const section = hasRecentlyEdited ? recentlyEdited : popularTimelines;
    const sectionBox = await section.boundingBox();

    expect(sectionBox).not.toBeNull();

    if (sectionBox && viewport) {
      // Section should use a reasonable portion of horizontal space
      // Not bunched in center, but also not edge-to-edge (needs padding)
      expect(sectionBox.width).toBeGreaterThan(viewport.width * 0.6);
      expect(sectionBox.width).toBeLessThanOrEqual(viewport.width);
    }
  });

  test('T-RESP-02.2: Card count per row changes with viewport width', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-LAYOUT-RESP-002' });

    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    // Wait for timeline cards to load
    await page.waitForTimeout(2000);

    const timelineCards = page.locator('[data-testid^="timeline-card-"]');
    const cardCount = await timelineCards.count();

    if (cardCount === 0) {
      test.skip('No timeline cards available for testing');
    }

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();

    if (cardCount >= 2 && viewport) {
      // Get bounding boxes of first two cards
      const firstCardBox = await timelineCards.nth(0).boundingBox();
      const secondCardBox = await timelineCards.nth(1).boundingBox();

      expect(firstCardBox).not.toBeNull();
      expect(secondCardBox).not.toBeNull();

      if (firstCardBox && secondCardBox) {
        // Determine if cards are side-by-side or stacked
        const sameRow = Math.abs(firstCardBox.y - secondCardBox.y) < 50;

        if (viewport.width < 768) {
          // Mobile: cards should stack (not in same row)
          expect(sameRow).toBe(false);
        } else if (viewport.width >= 1024) {
          // Desktop: cards CAN be side-by-side (multi-column grid)
          // This test just verifies layout is reasonable
          expect(firstCardBox.width).toBeGreaterThan(100);
          expect(secondCardBox.width).toBeGreaterThan(100);
        }
      }
    }
  });

  test('T-RESP-02.3: Cards maintain aspect ratio across viewports', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-LAYOUT-RESP-002' });

    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    // Wait for timeline cards to load
    await page.waitForTimeout(2000);

    const timelineCards = page.locator('[data-testid^="timeline-card-"]');
    const cardCount = await timelineCards.count();

    if (cardCount === 0) {
      test.skip('No timeline cards available for testing');
    }

    const firstCard = timelineCards.first();
    const cardBox = await firstCard.boundingBox();

    expect(cardBox).not.toBeNull();

    if (cardBox) {
      // Card should have reasonable aspect ratio
      // Not too narrow (width > height/4) and not too wide (width < height*10)
      expect(cardBox.width).toBeGreaterThan(cardBox.height / 4);
      expect(cardBox.width).toBeLessThan(cardBox.height * 10);
    }
  });

  test('T-RESP-02.4: Grid gap spacing is consistent', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-LAYOUT-RESP-002' });

    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    // Wait for timeline cards to load
    await page.waitForTimeout(2000);

    const timelineCards = page.locator('[data-testid^="timeline-card-"]');
    const cardCount = await timelineCards.count();

    if (cardCount < 2) {
      test.skip('Need at least 2 cards to test spacing');
    }

    const firstCardBox = await timelineCards.nth(0).boundingBox();
    const secondCardBox = await timelineCards.nth(1).boundingBox();

    expect(firstCardBox).not.toBeNull();
    expect(secondCardBox).not.toBeNull();

    if (firstCardBox && secondCardBox) {
      // Calculate gap between cards
      const sameRow = Math.abs(firstCardBox.y - secondCardBox.y) < 50;

      if (sameRow) {
        // Horizontal gap (cards side-by-side)
        const gap = secondCardBox.x - (firstCardBox.x + firstCardBox.width);
        expect(gap).toBeGreaterThanOrEqual(0);
        expect(gap).toBeLessThan(100); // Reasonable gap size
      } else {
        // Vertical gap (cards stacked)
        const gap = secondCardBox.y - (firstCardBox.y + firstCardBox.height);
        expect(gap).toBeGreaterThanOrEqual(0);
        expect(gap).toBeLessThan(100); // Reasonable gap size
      }
    }
  });
});
