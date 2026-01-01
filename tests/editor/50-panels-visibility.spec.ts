import { test, expect } from '@playwright/test';
import { loadTestTimeline } from '../utils/timelineTestUtils';

test.describe('v5/50 Panels visibility and sizing', () => {
  test.skip('Create opens centered authoring overlay (replacing side Create panel)', async ({ page }) => {
    // SKIPPED: This test requires authenticated user to see "+ Add Event" button
    // Public timeline view shows "View Only" without create capabilities
    // Note: Events panel has been replaced by Stream View
    await loadTestTimeline(page, 'french-revolution');
    await page.getByRole('button', { name: '+ Add Event' }).click();

    const overlay = page.locator('[data-testid="authoring-overlay"]');
    await expect(overlay).toBeVisible();

    await expect(page.getByRole('textbox', { name: /Date/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /Title/i })).toBeVisible();

    const box = await overlay.boundingBox();
    const viewport = page.viewportSize();
    expect(box?.height || 0).toBeGreaterThanOrEqual((viewport?.height || 0) * 0.7);
  });
});
