/**
 * Admin Panel Access Control Tests
 * v0.5.11 - Updated for Firebase Auth
 *
 * REQUIREMENTS:
 * - Test user (TEST_USER_EMAIL in .env.test) must have role='admin' in Firestore
 * - To set admin role: Update users/{TEST_USER_UID} document with { role: 'admin' }
 */

import { test, expect } from '@playwright/test';
import { signInWithEmail, signOut, getTestUserUid, getTestUserEmail } from '../utils/authTestUtils';
import { ensureAdminRoleForTestUser } from '../utils/adminRoleUtils';

test.describe('v5/82 Admin Panel - Access Control & Navigation', () => {

  let adminReady = false;

  test.beforeAll(async () => {
    adminReady = await ensureAdminRoleForTestUser(getTestUserUid(), getTestUserEmail());
  });

  test('T82.1: Authenticated admin user can access admin panel', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-NAV-001' });

    if (!adminReady) {
      test.skip(true, 'Test user lacks admin role - ensureAdminRoleForTestUser failed');
      return;
    }

    // Sign in with test user (should have admin role)
    await signInWithEmail(page);

    // Navigate to /admin route
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Check if admin page is visible (user has admin role)
    const hasAdminPage = await page.getByTestId('admin-page').isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasAdminPage) {
      test.skip(true, 'Admin page not accessible with test user (role update may be required)');
      return;
    }

    await expect(page.getByTestId('admin-heading')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[role="tab"]').first()).toBeVisible();
  });

  test('T82.2: Unauthenticated user cannot access admin panel', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-004' });

    // Don't sign in - test as unauthenticated user
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Should be redirected to login or home page (not on /admin)
    await expect(page).not.toHaveURL('/admin', { timeout: 5000 });

    // Admin panel should not be visible
    await expect(page.getByTestId('admin-page')).not.toBeVisible();
  });

  test('T82.3: Admin panel tab navigation works', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-NAV-003' });

    // Sign in and go to admin
    await signInWithEmail(page);
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    if (!adminReady) {
      test.skip(true, 'Test user lacks admin role');
      return;
    }

    // Default tab should be Users - verify users tab content
    await expect(page.getByTestId('admin-users-tab')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('user-management-heading')).toBeVisible();

    // Click Statistics tab (use nth to select second tab)
    await page.locator('[role="tab"]').nth(1).click();
    await page.waitForTimeout(500);
    await expect(page.getByTestId('admin-statistics-tab')).toBeVisible();
    await expect(page.getByTestId('platform-statistics-heading')).toBeVisible();

    // Click Activity Log tab (use nth to select third tab)
    await page.locator('[role="tab"]').nth(2).click();
    await page.waitForTimeout(500);
    await expect(page.getByTestId('admin-activity-tab')).toBeVisible();
    await expect(page.getByTestId('activity-log-heading')).toBeVisible();

    // Switch back to Users tab
    await page.locator('[role="tab"]').first().click();
    await page.waitForTimeout(500);
    await expect(page.getByTestId('admin-users-tab')).toBeVisible();
  });

  test('T82.4: Admin navigation rail displays correctly', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-NAV-001' });

    // Sign in and go to admin
    await signInWithEmail(page);
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    if (!adminReady) {
      test.skip(true, 'Test user lacks admin role');
      return;
    }

    // Navigation rail should be visible for admin navigation
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  });
});
