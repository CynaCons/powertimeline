import { test, expect } from '@playwright/test';

test.describe('v5/01 Foundation', () => {
  test('app loads and shows timeline axis', async ({ page }) => {
    await page.goto('/');
    // Axis present
    await expect(page.locator('[data-testid="timeline-axis"]')).toBeVisible();
    // Main canvas exists (inside the right-side container)
    await expect(page.locator('.ml-14 >> div.w-full.h-full.relative').first()).toBeVisible();
  });
});
