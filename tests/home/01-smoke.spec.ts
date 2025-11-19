/**
 * Home Page Smoke Test
 * v0.5.0.1 - Event Persistence Optimization
 *
 * Verifies that the home page loads without errors with the new
 * TimelineMetadata structure (events in subcollection)
 */

import { test, expect } from '@playwright/test';

test.describe('home/01 Home Page Smoke Test - Event Subcollection Support', () => {
  test('home page loads without console errors', async ({ page }) => {
    test.info().annotations.push({ type: 'phase', description: 'v0.5.0.1' });

    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    // Wait for load but don't require network idle (may have long-polling or continuous requests)
    await page.waitForLoadState('load');

    // Check for the main heading
    await expect(page.locator('h1:has-text("PowerTimeline")')).toBeVisible({ timeout: 5000 });

    // Wait a bit for any async operations to complete
    await page.waitForTimeout(2000);

    // Filter out expected migration errors (localStorage migration to old flat structure)
    const nonMigrationErrors = errors.filter(e => !e.includes('Failed to migrate'));

    // Should not have any non-migration console errors
    if (nonMigrationErrors.length > 0) {
      console.log('Console errors detected:', nonMigrationErrors);
    }
    expect(nonMigrationErrors.length).toBe(0);
  });

  test('timeline list loads with metadata only (no events array errors)', async ({ page }) => {
    test.info().annotations.push({ type: 'phase', description: 'v0.5.0.1' });

    const errors: string[] = [];
    const warnings: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
      if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('load');

    // Wait for timeline section to load
    await expect(page.locator('text=/My Timelines/')).toBeVisible({ timeout: 5000 });

    // Wait for any async operations
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

  test('timeline cards display correctly without events data', async ({ page }) => {
    test.info().annotations.push({ type: 'phase', description: 'v0.5.0.1' });

    await page.goto('/');
    await page.waitForLoadState('load');

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Check for timeline cards
    const timelineCards = page.locator('[class*="cursor-pointer"]').filter({ hasText: 'events' });
    const count = await timelineCards.count();

    // Should have at least some timelines
    expect(count).toBeGreaterThan(0);

    // Click on a timeline card to ensure navigation works
    if (count > 0) {
      await timelineCards.first().click();

      // Should navigate to timeline view
      await expect(page).toHaveURL(/\/user.*\/timeline/, { timeout: 5000 });
    }
  });
});
