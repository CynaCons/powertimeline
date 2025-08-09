import { test, expect } from '@playwright/test';

test('application loads and displays timeline', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Chronochart/);
  await expect(page.locator('svg')).toBeVisible();
});
