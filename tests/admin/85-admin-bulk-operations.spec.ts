import { test, expect } from '@playwright/test';

test.describe('v5/85 Admin Panel - Bulk Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin panel Users tab
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    
    const usersTab = page.locator('[role="tab"]:has-text("Users")');
    await usersTab.click();
    await page.waitForTimeout(500);
  });

  test('T85.1: Select multiple users', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-BULK-001' });

    // Find checkboxes in user rows
    const checkboxes = page.locator('tbody tr input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    expect(checkboxCount).toBeGreaterThan(0);

    // Select first two users (skip cynacons who is current user)
    await checkboxes.nth(1).click();
    await checkboxes.nth(2).click();

    // Bulk actions toolbar should appear
    await expect(page.locator('text=selected')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('button:has-text("Delete Selected")')).toBeVisible();
  });

  test('T85.2: Bulk delete users', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-BULK-002' });

    // Count users before deletion
    const userRowsBefore = page.locator('tbody tr');
    const countBefore = await userRowsBefore.count();

    // Select two users to delete (not cynacons)
    const checkboxes = page.locator('tbody tr input[type="checkbox"]');
    await checkboxes.nth(1).click();
    await checkboxes.nth(2).click();

    // Click bulk delete button
    const bulkDeleteButton = page.locator('button:has-text("Delete Selected")');
    await bulkDeleteButton.click();

    // Confirmation dialog should appear
    await expect(page.locator('text=Confirm Bulk Delete')).toBeVisible({ timeout: 3000 });

    // Confirm deletion
    const confirmButton = page.locator('button:has-text("Delete")').last();
    await confirmButton.click();

    // Wait for dialog to close
    await expect(page.locator('text=Confirm Bulk Delete')).not.toBeVisible({ timeout: 3000 });

    // User count should be reduced
    const userRowsAfter = page.locator('tbody tr');
    const countAfter = await userRowsAfter.count();
    expect(countAfter).toBeLessThan(countBefore);
  });

  test('T85.3: Bulk role assignment', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-BULK-003' });

    // Select two users
    const checkboxes = page.locator('tbody tr input[type="checkbox"]');
    await checkboxes.nth(1).click();
    await checkboxes.nth(2).click();

    // Bulk actions toolbar should be visible
    await expect(page.locator('text=selected')).toBeVisible({ timeout: 3000 });

    // Find role assignment dropdown
    const roleSelect = page.locator('select:has-text("Assign Role"), [aria-label*="Assign Role"]').first();
    await roleSelect.click();

    // Select admin role
    await page.locator('li[data-value="admin"], [role="option"]:has-text("Admin")').first().click();

    // Confirmation dialog should appear
    await expect(page.locator('text=Confirm Bulk Role Assignment')).toBeVisible({ timeout: 3000 });

    // Confirm assignment
    const confirmButton = page.locator('button:has-text("Confirm")').last();
    await confirmButton.click();

    // Wait for dialog to close
    await expect(page.locator('text=Confirm Bulk Role Assignment')).not.toBeVisible({ timeout: 3000 });

    // Selection should be cleared
    await expect(page.locator('text=selected')).not.toBeVisible();
  });

  test('T85.4: Select All functionality', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-BULK-001' });

    // Find Select All checkbox in table header
    const selectAllCheckbox = page.locator('thead input[type="checkbox"]').first();
    await expect(selectAllCheckbox).toBeVisible();

    // Click Select All
    await selectAllCheckbox.click();
    await page.waitForTimeout(500);

    // Multiple users should be selected (shown in toolbar)
    const selectedText = page.locator('text=/\\d+ user(s)? selected/');
    await expect(selectedText).toBeVisible({ timeout: 3000 });

    // Clear selection button should be visible
    await expect(page.locator('button:has-text("Clear Selection")')).toBeVisible();

    // Click Clear Selection
    await page.locator('button:has-text("Clear Selection")').click();

    // Selection text should disappear
    await expect(selectedText).not.toBeVisible();
  });
});
