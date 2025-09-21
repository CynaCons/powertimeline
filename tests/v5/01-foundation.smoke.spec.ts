import { test, expect } from '@playwright/test';

test.describe('v5/01 Foundation', () => {
  test('app loads and shows timeline axis', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-FOUND-001' });
    await page.goto('/');

    // Load sample data first to make timeline axis visible
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    await page.getByRole('button', { name: 'RFK 1968' }).click();
    await page.waitForTimeout(1000);

    // Enhanced timeline axis present (only shows when events exist)
    await expect(page.locator('[data-testid="enhanced-timeline-axis"]')).toBeVisible();
    // Main canvas exists (inside the right-side container)
    await expect(page.locator('.ml-14 >> div.w-full.h-full.relative').first()).toBeVisible();
  });
});
