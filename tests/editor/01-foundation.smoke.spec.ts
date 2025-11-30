import { test, expect } from '@playwright/test';

test.describe('v5/01 Foundation', () => {
  test('app loads and shows timeline axis', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-FOUND-001' });

    // Load a public timeline (no auth required for viewing)
    await page.goto('/cynacons/timeline/french-revolution');
    await page.waitForLoadState('domcontentloaded');

    // Wait for content to load
    await page.waitForTimeout(3000);

    // Check URL loaded correctly (not 404)
    expect(page.url()).toContain('french-revolution');
    expect(page.url()).not.toContain('/login');

    // Check for 404 page - should NOT be visible
    const has404 = await page.getByRole('heading', { name: '404' }).isVisible().catch(() => false);
    expect(has404).toBe(false);

    // Axis should render from the Firestore dataset
    const axis = page.locator('[data-testid="timeline-axis"]');
    await expect(axis).toBeVisible({ timeout: 10000 });

    const firstTick = page.locator('[data-testid="timeline-axis-tick"]').first();
    await expect(firstTick).toBeVisible({ timeout: 5000 });
  });
});
