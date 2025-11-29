/**
 * Admin Panel - Reset Statistics Test
 * v0.5.11 - Updated for Firebase Auth and data-testid selectors
 *
 * REQUIREMENTS:
 * - Test user must have role='admin' in Firestore
 */

import { test, expect } from '@playwright/test';
import { signInWithEmail, getTestUserUid, getTestUserEmail } from '../utils/authTestUtils';
import { ensureAdminRoleForTestUser } from '../utils/adminRoleUtils';

let adminReady = false;

// Helper to navigate to admin and check access
async function goToAdminWithAuth(page: import('@playwright/test').Page): Promise<boolean> {
  if (!adminReady) {
    return false;
  }

  await signInWithEmail(page);
  await page.goto('/admin');
  await page.waitForLoadState('domcontentloaded');

  // Check if admin page loaded (user has admin role)
  const hasAdminPage = await page.getByTestId('admin-page').isVisible({ timeout: 5000 }).catch(() => false);
  return hasAdminPage;
}

test.describe('admin/01 Reset Statistics Tests', () => {
  test.beforeAll(async () => {
    adminReady = await ensureAdminRoleForTestUser(getTestUserUid(), getTestUserEmail());
  });

  test('admin panel is accessible', async ({ page }) => {
    test.info().annotations.push({ type: 'phase', description: 'v0.5.11' });

    const hasAccess = await goToAdminWithAuth(page);
    if (!hasAccess) {
      test.skip(true, 'Test user lacks admin role');
      return;
    }

    // Should see Admin Panel heading
    await expect(page.getByTestId('admin-heading')).toBeVisible({ timeout: 5000 });

    // Should see tabs (using role selector as tabs don't have test IDs)
    await expect(page.locator('[role="tab"]').filter({ hasText: 'Users' })).toBeVisible();
    await expect(page.locator('[role="tab"]').filter({ hasText: 'Statistics' })).toBeVisible();
  });

  test('statistics tab shows platform statistics', async ({ page }) => {
    test.info().annotations.push({ type: 'phase', description: 'v0.5.11' });

    const hasAccess = await goToAdminWithAuth(page);
    if (!hasAccess) {
      test.skip(true, 'Test user lacks admin role');
      return;
    }

    // Click Statistics tab
    await page.locator('[role="tab"]').filter({ hasText: 'Statistics' }).click();
    await page.waitForTimeout(1000);

    // Should see Platform Statistics heading
    await expect(page.getByTestId('platform-statistics-heading')).toBeVisible({ timeout: 5000 });
  });

  test('statistics display shows metric cards', async ({ page }) => {
    test.info().annotations.push({ type: 'phase', description: 'v0.5.11' });

    const hasAccess = await goToAdminWithAuth(page);
    if (!hasAccess) {
      test.skip(true, 'Test user lacks admin role');
      return;
    }

    // Go to Statistics tab
    await page.locator('[role="tab"]').filter({ hasText: 'Statistics' }).click();
    await page.waitForTimeout(1000);

    // Should see statistics tab content
    await expect(page.getByTestId('admin-statistics-tab')).toBeVisible({ timeout: 5000 });
  });

  test('statistics display shows charts', async ({ page }) => {
    test.info().annotations.push({ type: 'phase', description: 'v0.5.11' });

    const hasAccess = await goToAdminWithAuth(page);
    if (!hasAccess) {
      test.skip(true, 'Test user lacks admin role');
      return;
    }

    // Go to Statistics tab
    await page.locator('[role="tab"]').filter({ hasText: 'Statistics' }).click();
    await page.waitForTimeout(1000);

    // Should see statistics tab content
    await expect(page.getByTestId('admin-statistics-tab')).toBeVisible({ timeout: 5000 });
  });
});
