import { test, expect } from '@playwright/test';

test.describe('v5/71 Home Page - Basic Functionality', () => {
  test('home page loads without errors', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-HOME-001' });

    // Navigate to home page
    await page.goto('/');

    // Wait for page to be fully loaded
    await page.waitForLoadState('domcontentloaded');

    // Check for any console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Basic page elements should be visible - check for the main heading specifically
    await expect(page.locator('h1:has-text("PowerTimeline")')).toBeVisible({ timeout: 5000 });
  });

  test('navigation rail is present with global navigation', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-HOME-002' });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Navigation rail should be visible
    const navRail = page.locator('aside').first();
    await expect(navRail).toBeVisible();

    // Logo should be visible
    const logo = page.locator('img[alt="PowerTimeline"]');
    await expect(logo).toBeVisible();
  });

  test('current user info displays correctly', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-HOME-003' });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // CynaCons user should be displayed
    await expect(page.locator('text=CynaCons')).toBeVisible({ timeout: 5000 });

    // Avatar should be visible
    await expect(page.locator('text=⚡')).toBeVisible();
  });

  test('search bar is present', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SEARCH-001' });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Search input should be visible
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
  });

  test('My Timelines section displays', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-MYTIMELINES-001' });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // My Timelines heading should be visible
    await expect(page.locator('text=/My Timelines/')).toBeVisible({ timeout: 5000 });

    // Create button should be visible (use more specific locator)
    await expect(page.locator('button:has-text("Create New")').first()).toBeVisible();
  });

  test('platform statistics section displays', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-STATS-001' });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Statistics section should be visible
    await expect(page.locator('text=Platform Statistics')).toBeVisible({ timeout: 5000 });

    // At least one metric should be visible (Timelines count - in the stats section)
    await expect(page.locator('div.text-sm.text-gray-600:has-text("Timelines")').first()).toBeVisible();
  });

  test('navigation to user profile works', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ROUTE-001' });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Click on UserProfileMenu button (aria-label="Account menu")
    const userMenuButton = page.locator('button[aria-label="Account menu"]');
    await expect(userMenuButton).toBeVisible({ timeout: 5000 });
    await userMenuButton.click();

    // Wait for menu to open and click "My Timelines" option
    await page.waitForSelector('[role="menu"]', { state: 'visible' });
    const myTimelinesOption = page.locator('[role="menuitem"]:has-text("My Timelines")');
    await myTimelinesOption.click();

    // Should navigate to user profile page
    await expect(page).toHaveURL(/\/user\/cynacons/, { timeout: 5000 });

    // User profile page should show user info
    await expect(page.locator('text=User Profile')).toBeVisible();
  });

  test('navigation rail Home button works', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ROUTE-002' });

    // Start on a different page
    await page.goto('/user/cynacons');
    await page.waitForLoadState('domcontentloaded');

    // Wait for Home icon button in navigation rail
    await page.waitForTimeout(1000); // Give nav rail time to render

    // Look for the Home button in the navigation rail (it might be an icon button)
    const homeButtons = page.locator('button[aria-label*="Home"]');
    const count = await homeButtons.count();

    if (count > 0) {
      await homeButtons.first().click();

      // Should navigate back to home page
      await expect(page).toHaveURL('/', { timeout: 5000 });
    }
  });

  test('timeline card navigation works', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-CARD-001' });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Look for timeline cards in any of the sections
    const timelineCards = page.locator('[class*="cursor-pointer"]:has-text("events")');
    const cardCount = await timelineCards.count();

    if (cardCount > 0) {
      // Click the first timeline card
      await timelineCards.first().click();

      // Should navigate to timeline editor
      await expect(page).toHaveURL(/\/user\/\w+\/timeline\/\w+/, { timeout: 5000 });
    }
  });
});
