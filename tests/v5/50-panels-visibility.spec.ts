import { test, expect } from '@playwright/test';

test.describe('v5/50 Panels visibility and sizing', () => {
  test('Events panel is visible and full-height', async ({ page }) => {
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
    await page.goto('/');
    await page.getByRole('button', { name: 'Events' }).click();
    await page.getByRole('button', { name: '+ Add Event' }).click();

    const overlay = page.locator('[data-testid="authoring-overlay"]');
    await expect(overlay).toBeVisible();

    await expect(page.getByLabel('Date')).toBeVisible();
    await expect(page.getByLabel('Title')).toBeVisible();

    const box = await overlay.boundingBox();
    const viewport = page.viewportSize();
    expect(box?.height || 0).toBeGreaterThanOrEqual((viewport?.height || 0) * 0.7);
  });

  test('Dev panel is visible and full-height', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Developer Panel' }).click();

    const panel = page.locator('aside[role="dialog"][aria-labelledby="dialog-title-dev"]');
    await expect(panel).toBeVisible();

    const box = await panel.boundingBox();
    const viewport = page.viewportSize();
    expect(box?.height || 0).toBeGreaterThanOrEqual((viewport?.height || 0) - 4);
  });
});
