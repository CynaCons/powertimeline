/**
 * Home Page Basic Functionality Tests
 * v0.5.11 - Updated for Firebase Auth and data-testid selectors
 *
 * Tests landing page for unauthenticated users and authenticated home experience
 */

import { test, expect } from '@playwright/test';
import { signInWithEmail } from '../utils/authTestUtils';

test.describe('v5/71 Home Page - Basic Functionality', () => {

  test('T71.1: Landing page loads for unauthenticated users', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-HOME-001' });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Landing page should be visible using data-testid
    await expect(page.getByTestId('landing-page')).toBeVisible({ timeout: 10000 });

    // Headline should be visible
    await expect(page.getByTestId('landing-headline')).toBeVisible({ timeout: 5000 });

    // Should show call-to-action buttons
    const hasExploreBtn = await page.getByTestId('cta-explore-examples').isVisible({ timeout: 3000 }).catch(() => false);
    const hasGetStartedBtn = await page.getByTestId('cta-get-started').isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasExploreBtn || hasGetStartedBtn).toBe(true);
  });

  test('T71.2: Browse page accessible without authentication', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-HOME-002' });

    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    // Browse page should load
    await expect(page).toHaveURL(/\/browse/);

    // Browse page should be visible using data-testid
    await expect(page.getByTestId('browse-page')).toBeVisible({ timeout: 10000 });
  });

  test('T71.3: Authenticated user sees home features', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-HOME-003' });

    await signInWithEmail(page);

    // Navigate to browse page
    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    // Should see My Timelines section (authenticated feature)
    await expect(page.getByTestId('my-timelines-section')).toBeVisible({ timeout: 5000 });

    // Should see create button
    await expect(page.getByTestId('create-timeline-button')).toBeVisible({ timeout: 5000 });
  });

  test('T71.4: Navigation rail is present', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-HOME-002' });

    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    // Navigation should be visible (sidebar or header)
    const navElement = page.locator('nav, aside, header').first();
    await expect(navElement).toBeVisible();
  });

  test('T71.5: Logo is visible', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-HOME-002' });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Landing page should load
    await expect(page.getByTestId('landing-page')).toBeVisible({ timeout: 10000 });

    // Logo button should be visible (using data-testid)
    await expect(page.getByTestId('logo-button')).toBeVisible({ timeout: 5000 });
  });

  test('T71.6: Search bar is present on browse page', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-SEARCH-001' });

    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    // Search input should be visible using data-testid
    await expect(page.getByTestId('browse-search-input')).toBeVisible({ timeout: 5000 });
  });

  test('T71.7: Authenticated user can access My Timelines', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-MYTIMELINES-001' });

    await signInWithEmail(page);

    // Navigate to browse page
    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    // Should see My Timelines section
    await expect(page.getByTestId('my-timelines-section')).toBeVisible({ timeout: 5000 });

    // Should see the My Timelines heading
    await expect(page.getByTestId('my-timelines-heading')).toBeVisible({ timeout: 5000 });
  });

  test('T71.8: Platform statistics are visible on browse page', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-CARD-001' });

    await page.goto('/browse');
    await page.waitForLoadState('domcontentloaded');

    // Platform stats section should be visible
    await expect(page.getByTestId('platform-stats-section')).toBeVisible({ timeout: 5000 });
  });
});
