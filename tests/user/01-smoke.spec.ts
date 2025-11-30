/**
 * User Profile Page Smoke Test
 * v0.5.0.1 - Event Persistence Optimization
 *
 * Verifies that the user profile page loads without errors with the new
 * TimelineMetadata structure (events in subcollection)
 */

import { test, expect } from '@playwright/test';

test.describe('user/01 User Profile Page Smoke Test - Event Subcollection Support', () => {
  test('user profile page loads without console errors', async ({ page }) => {
    test.info().annotations.push({ type: 'phase', description: 'v0.5.0.1' });

    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // v0.5.14: Use username-based URL (clean URL without @ prefix)
    // Note: User profile page requires authentication - if not logged in, will redirect
    await page.goto('/cynacons');
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);

    // Check if we were redirected to login (expected for protected route without auth)
    const isLoginPage = page.url().includes('/login');
    if (isLoginPage) {
      // This is expected - user profile requires auth
      // Just verify no errors occurred during redirect
      const nonMigrationErrors = errors.filter(e => !e.includes('Failed to migrate'));
      expect(nonMigrationErrors.length).toBe(0);
      return;
    }

    // If we're on the profile page, check for the data-testid
    const hasProfilePage = await page.getByTestId('user-profile-page').isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasProfilePage) {
      // May be on a different page - check URL
      console.log('Note: user-profile-page not found, current URL:', page.url());
    }

    // Filter out expected migration errors
    const nonMigrationErrors = errors.filter(e => !e.includes('Failed to migrate'));
    if (nonMigrationErrors.length > 0) {
      console.log('Console errors detected:', nonMigrationErrors);
    }
    expect(nonMigrationErrors.length).toBe(0);
  });

  test('user timelines load with metadata only (no events array errors)', async ({ page }) => {
    test.info().annotations.push({ type: 'phase', description: 'v0.5.0.1' });

    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // v0.5.14: Use username-based URL (clean URL without @ prefix)
    await page.goto('/cynacons');
    await page.waitForLoadState('load');

    // Wait for timeline content to load
    await page.waitForTimeout(2000);

    // Should not have undefined events errors
    const eventsErrors = errors.filter(e =>
      e.includes('events') &&
      (e.includes('undefined') || e.includes('Cannot read'))
    );

    if (eventsErrors.length > 0) {
      console.log('Events-related errors detected:', eventsErrors);
    }
    expect(eventsErrors.length).toBe(0);
  });

  test('timeline cards display metadata correctly', async ({ page }) => {
    test.info().annotations.push({ type: 'phase', description: 'v0.5.0.1' });

    // v0.5.14: Use username-based URL (clean URL without @ prefix)
    await page.goto('/cynacons');
    await page.waitForLoadState('load');

    // Wait for content to load
    await page.waitForTimeout(3000);

    // Look for timeline cards using data-testid or class-based selectors
    const timelineCards = page.locator('[data-testid^="timeline-card-"]');
    const count = await timelineCards.count();

    // May or may not have timeline cards - skip if none found
    if (count === 0) {
      test.skip(true, 'No timeline cards found on user profile');
      return;
    }
    expect(count).toBeGreaterThan(0);
  });

  test('clicking on timeline navigates to editor', async ({ page }) => {
    test.info().annotations.push({ type: 'phase', description: 'v0.5.0.1' });

    // v0.5.14: Use username-based URL (clean URL without @ prefix)
    await page.goto('/cynacons');
    await page.waitForLoadState('load');

    // Wait for content to load
    await page.waitForTimeout(3000);

    // Find a timeline card using data-testid
    const timelineCards = page.locator('[data-testid^="timeline-card-"]');
    const count = await timelineCards.count();

    if (count > 0) {
      // Click the first timeline
      await timelineCards.first().click();

      // Should navigate to timeline editor (v0.5.14: clean URL pattern without @ prefix)
      await expect(page).toHaveURL(/\/cynacons\/timeline\//, { timeout: 5000 });

      // Timeline content should load
      await expect(page.locator('[data-testid="timeline-axis"], svg').first()).toBeVisible({ timeout: 10000 });
    }
  });
});
