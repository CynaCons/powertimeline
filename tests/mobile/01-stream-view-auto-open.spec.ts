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

    // Stream View should auto-open on mobile viewport
    // Wait for the overlay to become visible
    const streamView = page.locator('[data-testid="stream-viewer-overlay"]');
    await expect(streamView).toBeVisible({ timeout: 20000 });

    // Verify Stream View header is present
    const streamHeader = page.locator('[data-testid="stream-viewer-header"]');
    await expect(streamHeader).toBeVisible({ timeout: 5000 });

    // Verify at least one event card is visible (timeline data loaded)
    const eventCard = page.locator('[data-testid="stream-event-card"]').first();
    await expect(eventCard).toBeVisible({ timeout: 5000 });
  });
});
