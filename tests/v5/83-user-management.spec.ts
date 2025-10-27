import { test, expect } from '@playwright/test';

test.describe('v5/83 Admin Panel - User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin panel as cynacons (admin user)
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Ensure we're on the Users tab
    const usersTab = page.locator('[role="tab"]:has-text("Users")');
    await usersTab.click();
    await page.waitForTimeout(500);
  });

  test('T83.1: View all users in table', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-USR-001' });

    // User Management heading should be visible
    await expect(page.locator('h2:has-text("User Management")')).toBeVisible();

    // Table should be visible
    const userTable = page.locator('table');
    await expect(userTable).toBeVisible();

    // Table headers should be present
    await expect(page.locator('th:has-text("Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Role")')).toBeVisible();
    await expect(page.locator('th:has-text("Timelines")')).toBeVisible();

    // At least one user row should be visible (cynacons)
    const userRows = page.locator('tbody tr');
    const rowCount = await userRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // CynaCons user should be in the table
    await expect(page.locator('td:has-text("CynaCons")')).toBeVisible();
  });

  test('T83.2: Change user role (user -> admin)', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-USR-002' });

    // Find Alice's row (should be a regular user)
    const aliceRow = page.locator('tr:has(td:has-text("Alice"))');
    await expect(aliceRow).toBeVisible({ timeout: 5000 });

    // Find the role select dropdown in Alice's row
    const roleSelect = aliceRow.locator('select, [role="combobox"]').first();
    await expect(roleSelect).toBeVisible();

    // Change role to admin
    await roleSelect.click();
    await page.locator('li[data-value="admin"], [role="option"]:has-text("Admin")').first().click();

    // Confirmation dialog should appear
    await expect(page.locator('text=Confirm Role Change')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=admin')).toBeVisible();

    // Confirm the change
    const confirmButton = page.locator('button:has-text("Confirm")');
    await confirmButton.click();

    // Wait for dialog to close
    await expect(page.locator('text=Confirm Role Change')).not.toBeVisible({ timeout: 3000 });

    // Role should be updated (reload to verify persistence)
    await page.reload();
    await page.waitForLoadState('networkidle');

    const aliceRowAfter = page.locator('tr:has(td:has-text("Alice"))');
    await expect(aliceRowAfter.locator('text=admin')).toBeVisible();
  });

  test('T83.3: Delete user with confirmation', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-USR-003' });

    // First, let's count users before deletion
    const userRowsBefore = page.locator('tbody tr');
    const countBefore = await userRowsBefore.count();

    // Find Bob's row
    const bobRow = page.locator('tr:has(td:has-text("Bob"))');
    await expect(bobRow).toBeVisible({ timeout: 5000 });

    // Click delete button in Bob's row
    const deleteButton = bobRow.locator('button[aria-label*="Delete"], button:has([data-testid="DeleteIcon"])');
    await deleteButton.click();

    // Confirmation dialog should appear
    await expect(page.locator('text=Confirm Deletion')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Bob')).toBeVisible();

    // Confirm deletion
    const confirmButton = page.locator('button:has-text("Delete")').last();
    await confirmButton.click();

    // Wait for dialog to close
    await expect(page.locator('text=Confirm Deletion')).not.toBeVisible({ timeout: 3000 });

    // Bob should no longer be in the table
    await expect(page.locator('td:has-text("Bob")')).not.toBeVisible();

    // User count should be reduced by 1
    const userRowsAfter = page.locator('tbody tr');
    const countAfter = await userRowsAfter.count();
    expect(countAfter).toBe(countBefore - 1);
  });

  test('T83.4: Search users by name', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-USR-004' });

    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="name"]').first();
    await expect(searchInput).toBeVisible();

    // Type "Alice" in search
    await searchInput.fill('Alice');
    await page.waitForTimeout(500);

    // Only Alice should be visible
    await expect(page.locator('td:has-text("Alice")')).toBeVisible();

    // Other users should not be visible
    await expect(page.locator('td:has-text("Bob")')).not.toBeVisible();
    await expect(page.locator('td:has-text("Charlie")')).not.toBeVisible();

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(500);

    // All users should be visible again
    const userRows = page.locator('tbody tr');
    const rowCount = await userRows.count();
    expect(rowCount).toBeGreaterThan(1);
  });
});
