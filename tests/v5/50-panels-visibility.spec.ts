import { test, expect } from '@playwright/test';
import { loginAsTestUser, loadTestTimeline } from '../utils/timelineTestUtils';

test.describe('v5/50 Panels visibility and sizing', () => {
  test('Events panel is visible and full-height', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/');

    await page.getByRole('button', { name: 'Events' }).click();

    const panel = page.locator('aside[role="dialog"][aria-labelledby="dialog-title-events"]');
    await expect(panel).toBeVisible();

    await expect(page.getByPlaceholder('Filter...')).toBeVisible();

    const box = await panel.boundingBox();
    const viewport = page.viewportSize();
    expect(box?.height || 0).toBeGreaterThanOrEqual((viewport?.height || 0) - 4);
  });

  test('Create opens centered authoring overlay (replacing side Create panel)', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/');
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

  test('Dev panel is visible and full-height', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    await page.waitForTimeout(500);

    // Check panel by looking for dev panel heading
    const panelHeading = page.getByRole('heading', { name: 'Developer Panel' });
    await expect(panelHeading).toBeVisible();

    const panel = page.locator('aside[role="dialog"]').first();
    await expect(panel).toBeVisible();

    const box = await panel.boundingBox();
    const viewport = page.viewportSize();
    expect(box?.height || 0).toBeGreaterThanOrEqual((viewport?.height || 0) - 4);
  });
});
