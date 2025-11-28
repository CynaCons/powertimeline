/**
 * Admin Panel - Reset Statistics Test
 * v0.5.11 - Updated for Firebase Auth
 *
 * REQUIREMENTS:
 * - Test user must have role='admin' in Firestore
 */

import { test, expect } from '@playwright/test';
import { signInWithEmail } from '../utils/authTestUtils';

// Helper to navigate to admin and check access
async function goToAdminWithAuth(page: import('@playwright/test').Page): Promise<boolean> {
  await signInWithEmail(page);
  await page.goto('/admin');
  await page.waitForLoadState('domcontentloaded');
  return page.url().includes('/admin');
}

test.describe('admin/01 Reset Statistics Tests', () => {

  test('admin panel is accessible', async ({ page }) => {
    test.info().annotations.push({ type: 'phase', description: 'v0.5.11' });

    const hasAccess = await goToAdminWithAuth(page);
    if (!hasAccess) {
      test.skip(true, 'Test user lacks admin role');
      return;
    }

    // Should see Admin Panel heading
    await expect(page.locator('h1:has-text("Admin Panel")')).toBeVisible({ timeout: 5000 });

    // Should see tabs
    await expect(page.locator('button[role="tab"]:has-text("Users")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Statistics")')).toBeVisible();
  });

  test('statistics tab shows platform statistics', async ({ page }) => {
    test.info().annotations.push({ type: 'phase', description: 'v0.5.11' });

    const hasAccess = await goToAdminWithAuth(page);
    if (!hasAccess) {
      test.skip(true, 'Test user lacks admin role');
      return;
    }

    // Click Statistics tab
    await page.locator('button[role="tab"]:has-text("Statistics")').click();
    await page.waitForTimeout(1000);

    // Should see Platform Statistics heading
    await expect(page.locator('h2:has-text("Platform Statistics")')).toBeVisible({ timeout: 5000 });
  });

  test('statistics display shows metric cards', async ({ page }) => {
    test.info().annotations.push({ type: 'phase', description: 'v0.5.11' });

    const hasAccess = await goToAdminWithAuth(page);
    if (!hasAccess) {
      test.skip(true, 'Test user lacks admin role');
      return;
    }

    // Go to Statistics tab
    await page.locator('button[role="tab"]:has-text("Statistics")').click();
    await page.waitForTimeout(1000);

    // Should see metric cards
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=Total Timelines')).toBeVisible();
    await expect(page.locator('text=Total Events')).toBeVisible();
    await expect(page.locator('text=Total Views')).toBeVisible();
  });

  test('statistics display shows charts', async ({ page }) => {
    test.info().annotations.push({ type: 'phase', description: 'v0.5.11' });

    const hasAccess = await goToAdminWithAuth(page);
    if (!hasAccess) {
      test.skip(true, 'Test user lacks admin role');
      return;
    }

    // Go to Statistics tab
    await page.locator('button[role="tab"]:has-text("Statistics")').click();
    await page.waitForTimeout(1000);

    // Should see charts
    await expect(page.locator('text=Timeline Visibility')).toBeVisible();
    await expect(page.locator('text=Top Timeline Creators')).toBeVisible();
  });
});
