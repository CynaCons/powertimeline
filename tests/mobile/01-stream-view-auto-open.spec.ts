import { test, expect } from '@playwright/test';
import { loadTestTimeline } from '../utils/timelineTestUtils';

test.describe('Mobile - Stream View Auto-Open', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Skip on non-mobile viewports
    test.skip(testInfo.project.name !== 'mobile', 'Mobile only');
  });

  test('Stream View automatically opens on mobile viewport', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-MOBILE-001' });

    // Navigate to a timeline
    await loadTestTimeline(page, 'french-revolution');

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');

    // Verify Stream View overlay is visible on mobile
    const streamView = page.locator('[data-testid="stream-view-overlay"]');
    await expect(streamView).toBeVisible({ timeout: 5000 });

    // Verify Stream View header is present
    const streamHeader = page.locator('[data-testid="stream-view-header"]');
    await expect(streamHeader).toBeVisible({ timeout: 3000 });
  });
});
