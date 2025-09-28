import { test, expect } from '@playwright/test';

test.describe('v5/01 Foundation', () => {
  test('app loads and shows timeline axis', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-FOUND-001' });
    await page.goto('/');

    // Axis should render from the default dataset without manual seeding
    const axis = page.locator('[data-testid="timeline-axis"]');
    await expect(axis).toBeVisible();

    const firstTick = page.locator('[data-testid="timeline-axis-tick"]').first();
    await expect(firstTick).toBeVisible();
  });
});
