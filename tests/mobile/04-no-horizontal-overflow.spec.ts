import { test, expect } from '@playwright/test';
import { loadTestTimeline } from '../utils/timelineTestUtils';

test.describe('Mobile - No Horizontal Overflow', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Skip on non-mobile viewports
    test.skip(testInfo.project.name !== 'mobile', 'Mobile only');
  });

  test('HomePage has no horizontal overflow on mobile', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-MOBILE-004' });

    // Navigate to HomePage
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Get viewport and document dimensions
    const viewportWidth = page.viewportSize()?.width || 0;
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);

    // Verify no horizontal overflow
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth);
  });

  test('EditorPage has no horizontal overflow on mobile', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-MOBILE-004' });

    // Navigate to a timeline
    await loadTestTimeline(page, 'french-revolution');
    await page.waitForLoadState('domcontentloaded');

    // Mobile shows a notice first - dismiss it to see the timeline
    const continueButton = page.getByRole('button', { name: /continue to canvas/i });
    if (await continueButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await continueButton.click();
    }

    // Wait for timeline to render
    const axis = page.locator('[data-testid="timeline-axis"]');
    await expect(axis).toBeVisible({ timeout: 10000 });

    // Get viewport and document dimensions
    const viewportWidth = page.viewportSize()?.width || 0;
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);

    // Verify no horizontal overflow
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth);
  });
});
