/**
 * Home Page Smoke Test
 * v0.5.11 - Updated for Firebase Auth and data-testid selectors
 *
 * Verifies that the landing page and browse page load without errors
 */

import { test, expect, Page } from '@playwright/test';
import { signInWithEmail } from '../utils/authTestUtils';

/**
 * Wait for timeline events to render - fails if no events appear within timeout
 */
const waitForEvents = async (page: Page) => {
  const eventCards = page.getByTestId('event-card');
  await expect(eventCards.first()).toBeVisible({ timeout: 10000 });
  const eventCount = await eventCards.count();
  expect(eventCount).toBeGreaterThan(0);
};

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

    // Check for the landing page using data-testid
    await expect(page.getByTestId('landing-page')).toBeVisible({ timeout: 10000 });

    // Check for the main headline
    await expect(page.getByTestId('landing-headline')).toBeVisible({ timeout: 5000 });

    // Wait for any async operations
    await page.waitForTimeout(2000);

    // Filter out expected errors (favicon, migration warnings)
    const criticalErrors = errors.filter(e =>
      !e.includes('Failed to migrate') &&
      !e.includes('favicon') &&
      !e.includes('404')
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

    // Browse page should be visible
    await expect(page.getByTestId('browse-page')).toBeVisible({ timeout: 10000 });

    // Should show platform statistics section (public)
    await expect(page.getByTestId('platform-stats-section')).toBeVisible({ timeout: 5000 });
  });

  test('public timeline loads without authentication', async ({ page }) => {
    test.info().annotations.push({ type: 'phase', description: 'v0.5.11' });

    // Navigate to a known public timeline
    await page.goto('/cynacons/timeline/french-revolution');
    await page.waitForLoadState('domcontentloaded');

    // Should load without redirect to login
    await expect(page).toHaveURL(/french-revolution/);

    // Should not redirect to login (this is a public timeline)
    expect(page.url()).not.toContain('/login');

    // Check for 404 page - this should NOT be visible for a valid timeline
    const has404 = await page.getByRole('heading', { name: '404' }).isVisible().catch(() => false);
    expect(has404).toBe(false);

    // Events should render to prove the timeline loaded correctly
    await waitForEvents(page);

    // Axis should also render for a valid timeline
    await expect(page.getByTestId('timeline-axis')).toBeVisible({ timeout: 10000 });
  });

  test('authenticated user can access home features', async ({ page }) => {
    test.info().annotations.push({ type: 'phase', description: 'v0.5.11' });

    // Sign in first
    await signInWithEmail(page);

    // Navigate to browse page
    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    // Should see the browse page
    await expect(page.getByTestId('browse-page')).toBeVisible({ timeout: 10000 });

    // Should see authenticated UI elements (My Timelines section with create button)
    await expect(page.getByTestId('my-timelines-section')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('create-timeline-button')).toBeVisible({ timeout: 5000 });
  });

  test('timeline cards display correctly on browse page', async ({ page }) => {
    test.info().annotations.push({ type: 'phase', description: 'v0.5.11' });

    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    // Wait for content to load
    await page.waitForTimeout(3000);

    // Check for recently edited or popular sections
    const hasRecentlyEdited = await page.getByTestId('recently-edited-section').isVisible({ timeout: 5000 }).catch(() => false);
    const hasPopular = await page.getByTestId('popular-timelines-section').isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasRecentlyEdited || hasPopular).toBe(true);
  });
});
