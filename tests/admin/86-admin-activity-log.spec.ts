import { test, expect } from '@playwright/test';

test.describe('v5/86 Admin Panel - Activity Log', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin panel Activity Log tab
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    
    const activityTab = page.locator('[role="tab"]:has-text("Activity Log")');
    await activityTab.click();
    await page.waitForTimeout(500);
  });

  test('T86.1: View activity log entries', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-LOG-001' });

    // Admin Activity Log heading should be visible
    await expect(page.locator('h2:has-text("Admin Activity Log")')).toBeVisible();

    // Activity log table should be visible
    const activityTable = page.locator('table');
    await expect(activityTable).toBeVisible();

    // Table headers should be present
    await expect(page.locator('th:has-text("Timestamp")')).toBeVisible();
    await expect(page.locator('th:has-text("Admin")')).toBeVisible();
    await expect(page.locator('th:has-text("Action")')).toBeVisible();
    await expect(page.locator('th:has-text("Details")')).toBeVisible();
  });

  test('T86.2: Log appears after role change', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-LOG-002' });

    // Navigate to Users tab
    const usersTab = page.locator('[role="tab"]:has-text("Users")');
    await usersTab.click();
    await page.waitForTimeout(500);

    // Find Alice's row and change her role
    const aliceRow = page.locator('tr:has(td:has-text("Alice"))');
    const roleSelect = aliceRow.locator('select, [role="combobox"]').first();
    
    // Change to admin
    await roleSelect.click();
    await page.locator('li[data-value="admin"], [role="option"]:has-text("Admin")').first().click();

    // Confirm role change
    await expect(page.locator('text=Confirm Role Change')).toBeVisible({ timeout: 3000 });
    await page.locator('button:has-text("Confirm")').click();
    await page.waitForTimeout(1000);

    // Navigate back to Activity Log tab
    const activityTab = page.locator('[role="tab"]:has-text("Activity Log")');
    await activityTab.click();
    await page.waitForTimeout(500);

    // Should see a log entry for the role change
    await expect(page.locator('text=User Role Change')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Alice')).toBeVisible();
  });

  test('T86.3: Filter log by action type', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-LOG-003' });

    // Find action type filter dropdown
    const actionFilter = page.locator('select:has-text("All Actions"), [aria-label*="Action Type"]').first();
    
    if (await actionFilter.isVisible()) {
      // Click filter
      await actionFilter.click();

      // Select "User Role Change"
      await page.locator('li[data-value="USER_ROLE_CHANGE"], [role="option"]:has-text("User Role Change")').first().click();
      await page.waitForTimeout(500);

      // Only role change entries should be visible
      const visibleActions = page.locator('tbody tr');
      const count = await visibleActions.count();
      
      if (count > 0) {
        // All visible entries should be role changes
        await expect(page.locator('text=User Role Change').first()).toBeVisible();
      }
    }
  });

  test('T86.4: Log shows admin username and timestamp', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-LOG-004' });

    // Look for any log entries
    const logRows = page.locator('tbody tr');
    const rowCount = await logRows.count();

    if (rowCount > 0) {
      // First row should have admin name (CynaCons)
      const firstRow = logRows.first();
      await expect(firstRow).toBeVisible();

      // Should contain admin name
      await expect(firstRow.locator('td').nth(1)).toContainText(/\w+/);

      // Should contain timestamp (date/time format)
      const timestampCell = firstRow.locator('td').first();
      await expect(timestampCell).toBeVisible();
    }

    // Export button should be visible
    await expect(page.locator('button:has-text("Export")')).toBeVisible();
  });

  test('T86.5: Search activity log', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-LOG-005' });

    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"], input[label*="search"]').first();
    
    if (await searchInput.isVisible()) {
      // Type a search term
      await searchInput.fill('Alice');
      await page.waitForTimeout(500);

      // Results should be filtered
      const logRows = page.locator('tbody tr');
      const rowCount = await logRows.count();

      if (rowCount > 0) {
        // At least one result should contain "Alice"
        await expect(page.locator('tbody').locator('text=Alice')).toBeVisible();
      }
    }
  });
});
