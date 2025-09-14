import { test, expect } from '@playwright/test';

test.describe('v5/54 Inline plus appears on hover near event', () => {
  test('hover first event row shows inline + and opens authoring', async ({ page }) => {
    await page.goto('/');
    // seed events
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    await page.getByRole('button', { name: '5 Events' }).click();
    await page.getByRole('button', { name: 'Developer Panel' }).click();

    await page.getByRole('button', { name: 'Events' }).click();
    await expect(page.getByPlaceholder('Filter...')).toBeVisible();

    // Hover the first list item to reveal inline +
    const firstLi = page.locator('aside[role="dialog"][aria-labelledby="dialog-title-events"] li').first();
    await firstLi.hover();
    const inlineBtn = page.getByTestId('events-inline-add-0');
    await expect(inlineBtn).toBeVisible();
    await inlineBtn.click();

    const overlay = page.locator('[data-testid="authoring-overlay"]');
    await expect(overlay).toBeVisible();
  });
});

