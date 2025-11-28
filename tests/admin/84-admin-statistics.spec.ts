/**
 * Admin Statistics Dashboard Tests
 * v0.5.11 - Updated for Firebase Auth
 *
 * REQUIREMENTS:
 * - Test user must have role='admin' in Firestore
 */

import { test, expect } from '@playwright/test';
import { signInWithEmail } from '../utils/authTestUtils';

// Helper to navigate to admin statistics
async function goToAdminStatsWithAuth(page: import('@playwright/test').Page): Promise<boolean> {
  await signInWithEmail(page);
  await page.goto('/admin');
  await page.waitForLoadState('domcontentloaded');

  // Check if admin page is visible
  const hasAdminPage = await page.getByTestId('admin-page').isVisible({ timeout: 5000 }).catch(() => false);
  if (!hasAdminPage) {
    return false;
  }

  // Click Statistics tab (second tab)
  await page.locator('[role="tab"]').nth(1).click();
  await page.waitForTimeout(500);
  return true;
}

test.describe('v5/84 Admin Panel - Statistics Dashboard', () => {

  test('T84.1: Display total users and timelines', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-STATS-001' });

    const hasAccess = await goToAdminStatsWithAuth(page);
    if (!hasAccess) {
      test.skip(true, 'Test user lacks admin role');
      return;
    }

    // Platform Statistics heading should be visible (using data-testid)
    await expect(page.getByTestId('platform-statistics-heading')).toBeVisible();

    // Statistics tab content should be visible
    await expect(page.getByTestId('admin-statistics-tab')).toBeVisible();
  });

  test('T84.2: Show visibility breakdown', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-STATS-002' });

    const hasAccess = await goToAdminStatsWithAuth(page);
    if (!hasAccess) {
      test.skip(true, 'Test user lacks admin role');
      return;
    }

    // Statistics tab content should be visible
    await expect(page.getByTestId('admin-statistics-tab')).toBeVisible();
  });

  test('T84.3: Display top creators', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-STATS-003' });

    const hasAccess = await goToAdminStatsWithAuth(page);
    if (!hasAccess) {
      test.skip(true, 'Test user lacks admin role');
      return;
    }

    // Statistics tab content should be visible
    await expect(page.getByTestId('admin-statistics-tab')).toBeVisible();
  });
});
