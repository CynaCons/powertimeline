import { test, expect } from '@playwright/test';

test.describe('Panels visibility and sizing', () => {
  test.skip('DEPRECATED - Events panel removed', async ({ page }) => {
    // Events panel (OutlinePanel) has been replaced by Stream View
    // See tests/editor/82-stream-viewer.spec.ts for Stream View tests
    console.log('Events panel test skipped - replaced by Stream View');
  });

  test.skip('DEPRECATED - Create panel access via Events removed', async ({ page }) => {
    // Events panel (OutlinePanel) has been replaced by Stream View
    // Create panel can now be accessed via Create button or Stream View
    console.log('Events panel test skipped - replaced by Stream View');

    const panel = page.locator('aside[role="dialog"][aria-labelledby="dialog-title-create"]');
    await expect(panel).toBeVisible();

    // Basic content visible
    await expect(panel.getByLabel('Date')).toBeVisible();
    await expect(panel.getByLabel('Title')).toBeVisible();

    const box = await panel.boundingBox();
    const viewport = page.viewportSize();
    expect(box?.height || 0).toBeGreaterThanOrEqual((viewport?.height || 0) - 4);
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

