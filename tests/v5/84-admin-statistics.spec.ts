import { test, expect } from '@playwright/test';

test.describe('v5/84 Admin Panel - Statistics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin panel
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Click Statistics tab
    const statisticsTab = page.locator('[role="tab"]:has-text("Statistics")');
    await statisticsTab.click();
    await page.waitForTimeout(500);
  });

  test('T84.1: Display total users and timelines', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-STATS-001' });

    // Platform Statistics heading should be visible
    await expect(page.locator('h2:has-text("Platform Statistics")')).toBeVisible();

    // Total Users card should be visible
    await expect(page.locator('text=Total Users')).toBeVisible();
    const totalUsersValue = page.locator('text=Total Users').locator('..').locator('h4, [class*="MuiTypography-h4"]');
    await expect(totalUsersValue).toBeVisible();

    // Total Timelines card should be visible
    await expect(page.locator('text=Total Timelines')).toBeVisible();
    const totalTimelinesValue = page.locator('text=Total Timelines').locator('..').locator('h4, [class*="MuiTypography-h4"]');
    await expect(totalTimelinesValue).toBeVisible();

    // Total Events card should be visible
    await expect(page.locator('text=Total Events')).toBeVisible();

    // Total Views card should be visible
    await expect(page.locator('text=Total Views')).toBeVisible();
  });

  test('T84.2: Show visibility breakdown', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-STATS-002' });

    // Timeline Visibility chart should be visible
    await expect(page.locator('text=Timeline Visibility')).toBeVisible();

    // Visibility labels should be present (Public, Unlisted, Private)
    const visibilitySection = page.locator('text=Timeline Visibility').locator('..');
    await expect(visibilitySection).toBeVisible();
  });

  test('T84.3: Display top creators', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-STATS-003' });

    // Top Timeline Creators chart should be visible
    await expect(page.locator('text=Top Timeline Creators')).toBeVisible();

    // Top Creators table should be visible
    await expect(page.locator('text=Top Creators (Detailed)')).toBeVisible();

    // Table headers
    await expect(page.locator('th:has-text("Rank")')).toBeVisible();
    await expect(page.locator('th:has-text("Creator")')).toBeVisible();
    await expect(page.locator('th:has-text("Timelines")')).toBeVisible();
  });

  test('T84.4: Recent activity table shows timeline updates', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-STATS-004' });

    // Recent Timeline Activity table should be visible
    await expect(page.locator('text=Recent Timeline Activity')).toBeVisible();

    // Table headers
    await expect(page.locator('th:has-text("Timeline")')).toBeVisible();
    await expect(page.locator('th:has-text("Owner")')).toBeVisible();
    await expect(page.locator('th:has-text("Last Updated")')).toBeVisible();
  });
});
