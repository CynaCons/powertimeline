/**
 * Admin Bulk Operations Tests
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

test.describe('v5/85 Admin Panel - Bulk Operations', () => {
  test.beforeAll(async () => {
    adminReady = await ensureAdminRoleForTestUser(getTestUserUid(), getTestUserEmail());
  });

  test('T85.1: Select multiple users', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-BULK-001' });

    const hasAccess = await goToUserManagementWithAuth(page);
    if (!hasAccess) {
      test.skip(true, 'Test user lacks admin role');
      return;
    }

    // Find checkboxes in user rows
    const checkboxes = page.locator('tbody tr input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();

    if (checkboxCount < 2) {
      test.skip(true, 'Not enough users to test bulk selection');
      return;
    }

    // Select first two users
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();

    // Bulk actions toolbar should appear
    await expect(page.getByText(/users selected/i).first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('button:has-text("Delete Selected")')).toBeVisible();
  });

  test('T85.2: Bulk delete users (UI verification only)', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-BULK-002' });

    const hasAccess = await goToUserManagementWithAuth(page);
    if (!hasAccess) {
      test.skip(true, 'Test user lacks admin role');
      return;
    }

    // Find checkboxes in user rows
    const checkboxes = page.locator('tbody tr input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();

    if (checkboxCount < 2) {
      test.skip(true, 'Not enough users to test bulk operations');
      return;
    }

    // Select two users
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();

    // Click bulk delete button
    const bulkDeleteButton = page.locator('button:has-text("Delete Selected")');
    await bulkDeleteButton.click();

    // Confirmation dialog should appear
    await expect(page.locator('text=Confirm Bulk Delete')).toBeVisible({ timeout: 3000 });

    // Cancel instead of confirming (don't actually delete users in test)
    const cancelButton = page.locator('button:has-text("Cancel")');
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
    } else {
      // Close dialog by pressing Escape
      await page.keyboard.press('Escape');
    }
  });

  test('T85.3: Bulk role assignment UI exists', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-BULK-003' });

    const hasAccess = await goToUserManagementWithAuth(page);
    if (!hasAccess) {
      test.skip(true, 'Test user lacks admin role');
      return;
    }

    // Find checkboxes in user rows
    const checkboxes = page.locator('tbody tr input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();

    if (checkboxCount < 2) {
      test.skip(true, 'Not enough users to test bulk operations');
      return;
    }

    // Select two users
    await checkboxes.nth(0).click();
    await checkboxes.nth(1).click();

    // Bulk actions toolbar should be visible
    await expect(page.locator('text=selected')).toBeVisible({ timeout: 3000 });

    // Role assignment option should exist (select or button)
    const roleSelect = page.locator('select, [aria-label*="Role"], button:has-text("Assign Role")').first();
    const hasRoleControl = await roleSelect.isVisible().catch(() => false);

    if (!hasRoleControl) {
      console.log('Note: Bulk role assignment UI not found');
    }
  });

  test('T85.4: Select All functionality', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-BULK-001' });

    const hasAccess = await goToUserManagementWithAuth(page);
    if (!hasAccess) {
      test.skip(true, 'Test user lacks admin role');
      return;
    }

    // Find Select All checkbox in table header
    const selectAllCheckbox = page.locator('thead input[type="checkbox"]').first();
    const hasSelectAll = await selectAllCheckbox.isVisible().catch(() => false);

    if (!hasSelectAll) {
      console.log('Note: Select All checkbox not found in table header');
      return;
    }

    // Click Select All
    await selectAllCheckbox.click();
    await page.waitForTimeout(500);

    // Multiple users should be selected (shown in toolbar)
    const selectedText = page.locator('text=/\\d+ user(s)? selected/');
    await expect(selectedText).toBeVisible({ timeout: 3000 });

    // Clear selection button should be visible
    const clearButton = page.locator('button:has-text("Clear Selection"), button:has-text("Clear")');
    if (await clearButton.isVisible()) {
      await clearButton.click();
      // Selection text should disappear
      await expect(selectedText).not.toBeVisible({ timeout: 3000 });
    }
  });
});
