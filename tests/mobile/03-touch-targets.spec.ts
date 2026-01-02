import { test, expect } from '@playwright/test';
import { loadTestTimeline } from '../utils/timelineTestUtils';

test.describe('Mobile - Touch Target Sizes', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Skip on non-mobile viewports
    test.skip(testInfo.project.name !== 'mobile', 'Mobile only');
  });

  test('interactive elements meet 44px minimum touch target', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-MOBILE-003' });

    // Navigate to a timeline
    await loadTestTimeline(page, 'french-revolution');
    await page.waitForLoadState('domcontentloaded');

    const MIN_TOUCH_TARGET = 44; // 44px minimum recommended by WCAG
    const failures: string[] = [];

    // Check NavRail buttons
    const navButtons = page.locator('[data-testid^="nav-"]').or(page.locator('nav button'));
    const navCount = await navButtons.count();

    for (let i = 0; i < navCount; i++) {
      const button = navButtons.nth(i);
      const box = await button.boundingBox();
      if (box) {
        const testId = await button.getAttribute('data-testid') || `nav-button-${i}`;
        if (box.width < MIN_TOUCH_TARGET || box.height < MIN_TOUCH_TARGET) {
          failures.push(`${testId}: ${box.width}x${box.height}px`);
        }
      }
    }

    // Check Stream View event cards (if visible)
    const streamCards = page.locator('[data-testid="stream-event-card"]');
    const cardCount = await streamCards.count();

    for (let i = 0; i < Math.min(cardCount, 5); i++) {
      const card = streamCards.nth(i);
      const box = await card.boundingBox();
      if (box) {
        if (box.height < MIN_TOUCH_TARGET) {
          failures.push(`stream-event-card-${i}: ${box.width}x${box.height}px`);
        }
      }
    }

    // Check floating action buttons
    const fabButtons = page.locator('[data-testid*="fab"]').or(page.locator('button[class*="Fab"]'));
    const fabCount = await fabButtons.count();

    for (let i = 0; i < fabCount; i++) {
      const fab = fabButtons.nth(i);
      const box = await fab.boundingBox();
      if (box) {
        const testId = await fab.getAttribute('data-testid') || `fab-${i}`;
        if (box.width < MIN_TOUCH_TARGET || box.height < MIN_TOUCH_TARGET) {
          failures.push(`${testId}: ${box.width}x${box.height}px`);
        }
      }
    }

    // Report failures
    if (failures.length > 0) {
      throw new Error(
        `Touch targets below ${MIN_TOUCH_TARGET}px minimum:\n` +
        failures.map(f => `  - ${f}`).join('\n')
      );
    }

    // If we got here, all touch targets meet minimum size
    expect(failures).toHaveLength(0);
  });
});
