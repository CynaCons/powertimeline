import { test, expect } from '@playwright/test';

test.describe('Panels visibility and sizing', () => {
  test('Events panel is visible and full-height', async ({ page }) => {
    await page.goto('/');

    // Open Events panel via nav rail
    await page.getByRole('button', { name: 'Events' }).click();

    const panel = page.locator('aside[role="dialog"][aria-labelledby="dialog-title-events"]');
    await expect(panel).toBeVisible();

    // Ensure content is visible (filter and list container)
    await expect(page.getByPlaceholder('Filter...')).toBeVisible();

    const box = await panel.boundingBox();
    const viewport = page.viewportSize();
    // Panel should span nearly full viewport height
    expect(box?.height || 0).toBeGreaterThanOrEqual((viewport?.height || 0) - 4);
  });

  test('Create panel is visible and full-height', async ({ page }) => {
    await page.goto('/');
    // Open Events then click + Add Event inside panel
    await page.getByRole('button', { name: 'Events' }).click();
    await page.getByRole('button', { name: '+ Add Event' }).click();

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

