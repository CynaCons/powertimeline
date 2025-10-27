import { test, expect } from '@playwright/test';

test.describe('v5/82 Admin Panel - Access Control & Navigation', () => {
  test('T82.1: Admin user can access admin panel', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-NAV-001' });

    // Navigate to home page (cynacons is default admin user)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to /admin route
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Verify URL is /admin (not redirected)
    await expect(page).toHaveURL('/admin', { timeout: 5000 });

    // Verify admin panel heading is visible
    await expect(page.locator('h1:has-text("Admin Panel")')).toBeVisible({ timeout: 5000 });

    // Verify tabs are present
    await expect(page.locator('[role="tab"]:has-text("Users")')).toBeVisible();
    await expect(page.locator('[role="tab"]:has-text("Statistics")')).toBeVisible();
    await expect(page.locator('[role="tab"]:has-text("Activity Log")')).toBeVisible();

    // Verify default tab (Users) is active and showing content
    await expect(page.locator('h2:has-text("User Management")')).toBeVisible();
  });

  test('T82.2: Non-admin user redirected from admin panel', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-004' });

    // Start on home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Switch to alice (non-admin user) via localStorage
    await page.evaluate(() => {
      localStorage.setItem('powertimeline_current_user', '"alice"');
    });

    // Reload to apply new current user
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify we're logged in as alice (use first() since name may appear in timeline cards too)
    await expect(page.locator('text=Alice').first()).toBeVisible({ timeout: 5000 });

    // Try to navigate to /admin route
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Should be redirected to home page
    await expect(page).toHaveURL('/', { timeout: 5000 });

    // Admin panel should not be visible
    await expect(page.locator('h1:has-text("Admin Panel")')).not.toBeVisible();

    // Home page content should be visible instead
    await expect(page.locator('h1:has-text("PowerTimeline")')).toBeVisible();
  });

  test('T82.3: Admin navigation item visible only to admins', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-NAV-002' });

    // Part 1: Admin user (cynacons) should see Admin nav item
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for navigation rail to render
    await page.waitForTimeout(1000);

    // Look for Admin button in navigation rail (using icon or text)
    const adminButtonAdmin = page.locator('button[aria-label*="Admin"]');
    const countAdmin = await adminButtonAdmin.count();

    expect(countAdmin).toBeGreaterThan(0);
    await expect(adminButtonAdmin.first()).toBeVisible();

    // Part 2: Switch to non-admin user (alice)
    await page.evaluate(() => {
      localStorage.setItem('powertimeline_current_user', '"alice"');
    });

    // Reload to apply new current user
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify we're logged in as alice (use first() since name may appear in timeline cards too)
    await expect(page.locator('text=Alice').first()).toBeVisible({ timeout: 5000 });

    // Wait for navigation rail to render
    await page.waitForTimeout(1000);

    // Admin button should NOT be visible for non-admin
    const adminButtonUser = page.locator('button[aria-label*="Admin"]');
    const countUser = await adminButtonUser.count();

    expect(countUser).toBe(0);
  });

  test('T82.1b: Admin navigation item navigates to admin panel', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-NAV-001' });

    // Navigate to home page as admin
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for navigation rail to render
    await page.waitForTimeout(1000);

    // Find and click Admin navigation button
    const adminButton = page.locator('button[aria-label*="Admin"]');
    await expect(adminButton.first()).toBeVisible({ timeout: 5000 });
    await adminButton.first().click();

    // Should navigate to /admin
    await expect(page).toHaveURL('/admin', { timeout: 5000 });

    // Admin panel should be visible
    await expect(page.locator('h1:has-text("Admin Panel")')).toBeVisible();
  });

  test('T82.1c: Admin panel tab navigation works', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-NAV-003' });

    // Navigate to admin panel
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Default tab should be Users
    await expect(page.locator('[role="tab"][aria-selected="true"]:has-text("Users")')).toBeVisible();
    await expect(page.locator('h2:has-text("User Management")')).toBeVisible();

    // Click Statistics tab
    const statisticsTab = page.locator('[role="tab"]:has-text("Statistics")');
    await statisticsTab.click();
    await page.waitForTimeout(500);

    // Statistics content should be visible
    await expect(page.locator('h2:has-text("Platform Statistics")')).toBeVisible();

    // Click Activity Log tab
    const activityTab = page.locator('[role="tab"]:has-text("Activity Log")');
    await activityTab.click();
    await page.waitForTimeout(500);

    // Activity log content should be visible
    await expect(page.locator('h2:has-text("Admin Activity Log")')).toBeVisible();

    // Switch back to Users tab
    const usersTab = page.locator('[role="tab"]:has-text("Users")');
    await usersTab.click();
    await page.waitForTimeout(500);

    // Users content should be visible again
    await expect(page.locator('h2:has-text("User Management")')).toBeVisible();
  });

  test('T82.1d: Admin panel breadcrumb displays correctly', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-NAV-001' });

    // Navigate to admin panel
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Breadcrumb should show: Home > Admin
    const breadcrumbs = page.locator('[class*="breadcrumb"], nav[aria-label="Breadcrumb"]');
    await expect(breadcrumbs).toContainText('Home');
    await expect(breadcrumbs).toContainText('Admin');
  });
});
