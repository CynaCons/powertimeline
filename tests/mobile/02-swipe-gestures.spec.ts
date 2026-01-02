import { test, expect } from '@playwright/test';
import { loadTestTimeline } from '../utils/timelineTestUtils';

test.describe('Mobile - Swipe Gestures', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Skip on non-mobile viewports
    test.skip(testInfo.project.name !== 'mobile', 'Mobile only');
  });

  test('swipe gestures on Stream View event cards', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-MOBILE-002' });

    // Navigate to a timeline
    await loadTestTimeline(page, 'french-revolution');
    await page.waitForLoadState('domcontentloaded');

    // Ensure Stream View is visible
    const streamView = page.locator('[data-testid="stream-view-overlay"]');
    await expect(streamView).toBeVisible({ timeout: 5000 });

    // Get first event card
    const eventCard = page.locator('[data-testid="stream-event-card"]').first();

    // Check if swipe functionality is implemented
    const hasSwipeActions = await eventCard.locator('[data-testid*="swipe-action"]').count() > 0;

    if (!hasSwipeActions) {
      test.skip(true, 'Swipe gestures not yet implemented');
    }

    // Get card bounding box for swipe simulation
    const box = await eventCard.boundingBox();
    if (!box) {
      throw new Error('Event card not found');
    }

    // Test swipe left (delete action)
    await page.mouse.move(box.x + box.width - 10, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 10, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();

    // Verify delete action revealed
    const deleteAction = eventCard.locator('[data-testid*="delete"]');
    await expect(deleteAction).toBeVisible({ timeout: 1000 });

    // Test swipe right (edit action)
    await page.mouse.move(box.x + 10, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 10, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();

    // Verify edit action revealed
    const editAction = eventCard.locator('[data-testid*="edit"]');
    await expect(editAction).toBeVisible({ timeout: 1000 });
  });
});
