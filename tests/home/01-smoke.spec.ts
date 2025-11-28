/**
 * Home Page Smoke Test
 * v0.5.11 - Updated for Firebase Auth
 *
 * Verifies that the landing page and browse page load without errors
 */

import { test, expect } from '@playwright/test';
import { signInWithEmail } from '../utils/authTestUtils';

test.describe('home/01 Smoke Tests', () => {
  test('landing page loads without console errors', async ({ page }) => {
    test.info().annotations.push({ type: 'phase', description: 'v0.5.11' });

    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('load');

    // Check for the main heading on landing page
    await expect(page.locator('h1:has-text("PowerTimeline")')).toBeVisible({ timeout: 5000 });

    // Wait for any async operations
    await page.waitForTimeout(2000);

    // Filter out expected errors
    const criticalErrors = errors.filter(e =>
      !e.includes('Failed to migrate') &&
      !e.includes('favicon')
    );

    if (criticalErrors.length > 0) {
      console.log('Console errors detected:', criticalErrors);
    }
    expect(criticalErrors.length).toBe(0);
  });

  test('browse page loads for unauthenticated users', async ({ page }) => {
    test.info().annotations.push({ type: 'phase', description: 'v0.5.11' });

    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    // Browse page should show public timelines
    await expect(page.locator('h1:has-text("Browse"), h1:has-text("Timelines")')).toBeVisible({ timeout: 5000 });
  });

  test('public timeline loads without authentication', async ({ page }) => {
    test.info().annotations.push({ type: 'phase', description: 'v0.5.11' });

    // Navigate to a known public timeline
    await page.goto('/user/cynacons/timeline/timeline-french-revolution');
    await page.waitForLoadState('domcontentloaded');

    // Should load without redirect to login
    await expect(page).toHaveURL(/timeline-french-revolution/);

    // Timeline content should be visible (axis or events)
    const hasContent = await page.locator('[data-testid="timeline-axis"], [data-testid="event-card"]').first().isVisible({ timeout: 10000 }).catch(() => false);
    expect(hasContent).toBe(true);
  });

  test('authenticated user can access home features', async ({ page }) => {
    test.info().annotations.push({ type: 'phase', description: 'v0.5.11' });

    // Sign in first
    await signInWithEmail(page);

    // Should be redirected to browse or user page
    await expect(page).toHaveURL(/\/(browse|user)/);

    // Should see authenticated UI elements (e.g., account menu or create button)
    const hasAuthUI = await page.locator('button[aria-label="Account menu"], button:has-text("Create")').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasAuthUI).toBe(true);
  });

  test('timeline cards display correctly on browse page', async ({ page }) => {
    test.info().annotations.push({ type: 'phase', description: 'v0.5.11' });

    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Check for timeline cards
    const timelineCards = page.locator('[data-testid^="timeline-card-"], .cursor-pointer:has-text("events")');
    const count = await timelineCards.count();

    if (count > 0) {
      // Click on a timeline card to ensure navigation works
      await timelineCards.first().click();

      // Should navigate to timeline view
      await expect(page).toHaveURL(/\/user.*\/timeline/, { timeout: 5000 });
    }
  });
});
