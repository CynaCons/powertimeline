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

    await page.goto('/user/cynacons');
    await page.waitForLoadState('load');

    // Check that the page loaded - look for the user heading
    await expect(page.locator('h1:has-text("CynaCons")').first()).toBeVisible({ timeout: 5000 });

    // Wait for async operations
    await page.waitForTimeout(2000);

    // Filter out expected migration errors
    const nonMigrationErrors = errors.filter(e => !e.includes('Failed to migrate'));

    // Should not have any non-migration console errors
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

    await page.goto('/user/cynacons');
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

    await page.goto('/user/cynacons');
    await page.waitForLoadState('load');

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Look for timeline cards (they should show title, event count, etc.)
    const timelineElements = page.locator('[class*="card"], [class*="timeline"]').filter({ hasText: /events|timeline/i });
    const count = await timelineElements.count();

    // Should have at least some timelines for cynacons user
    expect(count).toBeGreaterThan(0);
  });

  test('clicking on timeline navigates to editor', async ({ page }) => {
    test.info().annotations.push({ type: 'phase', description: 'v0.5.0.1' });

    await page.goto('/user/cynacons');
    await page.waitForLoadState('load');

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Find a timeline card (look for clickable elements with timeline-related text)
    const timelineCards = page.locator('[class*="cursor-pointer"]').filter({ hasText: /events/i });
    const count = await timelineCards.count();

    if (count > 0) {
      // Click the first timeline
      await timelineCards.first().click();

      // Should navigate to timeline editor
      await expect(page).toHaveURL(/\/user\/cynacons\/timeline\//, { timeout: 5000 });

      // Timeline editor should load
      await expect(page.locator('[class*="timeline"]')).toBeVisible({ timeout: 10000 });
    }
  });
});
