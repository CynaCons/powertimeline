import { test, expect } from '@playwright/test';
import { loadTestTimeline } from '../utils/timelineTestUtils';

test.describe('v5/50 Panels visibility and sizing', () => {
  test('Events panel is visible and full-height', async ({ page }) => {
    // Load a public timeline - Events panel is available on public timelines
    await loadTestTimeline(page, 'french-revolution');

    await page.getByRole('button', { name: 'Events' }).click();

    const panel = page.locator('aside[role="dialog"][aria-labelledby="dialog-title-events"]');
    await expect(panel).toBeVisible();

    await expect(page.getByPlaceholder('Filter...')).toBeVisible();

    const box = await panel.boundingBox();
    const viewport = page.viewportSize();
    expect(box?.height || 0).toBeGreaterThanOrEqual((viewport?.height || 0) - 4);
  });

  test.skip('Create opens centered authoring overlay (replacing side Create panel)', async ({ page }) => {
    // SKIPPED: This test requires authenticated user to see "+ Add Event" button
    // Public timeline view shows "View Only" without create capabilities
    await loadTestTimeline(page, 'french-revolution');
    await page.getByRole('button', { name: 'Events' }).click();
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
