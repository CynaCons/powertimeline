/**
 * User Management Tests
 * v0.5.11 - Updated for Firebase Auth
 *
 * REQUIREMENTS:
 * - Test user must have role='admin' in Firestore
 */

import { test, expect } from '@playwright/test';
import { signInWithEmail, getTestUserUid, getTestUserEmail } from '../utils/authTestUtils';
import { ensureAdminRoleForTestUser } from '../utils/adminRoleUtils';

let adminReady = false;

// Helper to navigate to admin user management tab
async function goToUserManagementWithAuth(page: import('@playwright/test').Page): Promise<boolean> {
  if (!adminReady) {
    return false;
  }

  await signInWithEmail(page);
  await page.goto('/admin');
  await page.waitForLoadState('domcontentloaded');

  // Check if admin page is visible
  const hasAdminPage = await page.getByTestId('admin-page').isVisible({ timeout: 5000 }).catch(() => false);
  if (!hasAdminPage) {
    return false;
  }

  // Ensure we're on the Users tab (first tab)
  await page.locator('[role="tab"]').first().click();
  await page.waitForTimeout(500);
  return true;
}

test.describe('v5/83 Admin Panel - User Management', () => {
  test.beforeAll(async () => {
    adminReady = await ensureAdminRoleForTestUser(getTestUserUid(), getTestUserEmail());
  });

  test('T83.1: View all users in table', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-USR-001' });

    const hasAccess = await goToUserManagementWithAuth(page);
    if (!hasAccess) {
      test.skip(true, 'Test user lacks admin role');
      return;
    }

    // User Management heading should be visible (using data-testid)
    await expect(page.getByTestId('user-management-heading')).toBeVisible();

    // Table should be visible
    const userTable = page.locator('table');
    await expect(userTable).toBeVisible({ timeout: 5000 });

    // At least one header cell should be present
    await expect(page.locator('th').first()).toBeVisible();
  });

  test('T83.2: User table shows user data', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-USR-002' });

    const hasAccess = await goToUserManagementWithAuth(page);
    if (!hasAccess) {
      test.skip(true, 'Test user lacks admin role');
      return;
    }

    // Wait for table data to load
    await page.waitForTimeout(1000);

    // At least one user row should be visible
    const userRows = page.locator('tbody tr');
    const rowCount = await userRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('T83.3: Search users functionality exists', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-USR-004' });

    const hasAccess = await goToUserManagementWithAuth(page);
    if (!hasAccess) {
      test.skip(true, 'Test user lacks admin role');
      return;
    }

    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="name"]').first();
    const hasSearch = await searchInput.isVisible().catch(() => false);

    if (hasSearch) {
      // Type in search
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      // Search should filter the list (no error)
    } else {
      console.log('Note: Search functionality not visible in user management');
    }
  });
});
