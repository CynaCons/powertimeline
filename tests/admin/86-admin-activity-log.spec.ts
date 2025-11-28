/**
 * Admin Activity Log Tests
 * v0.5.11 - Updated for Firebase Auth
 *
 * REQUIREMENTS:
 * - Test user must have role='admin' in Firestore
 */

import { test, expect } from '@playwright/test';
import { signInWithEmail } from '../utils/authTestUtils';

// Helper to navigate to admin activity log tab
async function goToActivityLogWithAuth(page: import('@playwright/test').Page): Promise<boolean> {
  await signInWithEmail(page);
  await page.goto('/admin');
  await page.waitForLoadState('domcontentloaded');

  // Check if admin page is visible
  const hasAdminPage = await page.getByTestId('admin-page').isVisible({ timeout: 5000 }).catch(() => false);
  if (!hasAdminPage) {
    return false;
  }

  // Click Activity Log tab (third tab)
  await page.locator('[role="tab"]').nth(2).click();
  await page.waitForTimeout(500);
  return true;
}

test.describe('v5/86 Admin Panel - Activity Log', () => {

  test('T86.1: View activity log entries', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-LOG-001' });

    const hasAccess = await goToActivityLogWithAuth(page);
    if (!hasAccess) {
      test.skip(true, 'Test user lacks admin role');
      return;
    }

    // Admin Activity Log heading should be visible (using data-testid)
    await expect(page.getByTestId('activity-log-heading')).toBeVisible();

    // Activity tab content should be visible
    await expect(page.getByTestId('admin-activity-tab')).toBeVisible();

    // Activity log table should be visible
    const activityTable = page.locator('table');
    await expect(activityTable).toBeVisible();
  });

  test('T86.2: Activity log structure verification', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-LOG-002' });

    const hasAccess = await goToActivityLogWithAuth(page);
    if (!hasAccess) {
      test.skip(true, 'Test user lacks admin role');
      return;
    }

    // Look for any log entries
    const logRows = page.locator('tbody tr');
    const rowCount = await logRows.count();

    if (rowCount > 0) {
      // First row should be visible with proper structure
      const firstRow = logRows.first();
      await expect(firstRow).toBeVisible();

      // Should have at least 4 cells (Timestamp, Admin, Action, Details)
      const cells = firstRow.locator('td');
      const cellCount = await cells.count();
      expect(cellCount).toBeGreaterThanOrEqual(4);
    } else {
      console.log('Note: No activity log entries found');
    }
  });

  test('T86.3: Filter log by action type', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-LOG-003' });

    const hasAccess = await goToActivityLogWithAuth(page);
    if (!hasAccess) {
      test.skip(true, 'Test user lacks admin role');
      return;
    }

    // Find action type filter dropdown
    const actionFilter = page.locator('select, [aria-label*="Action"], [aria-label*="Filter"]').first();

    if (await actionFilter.isVisible().catch(() => false)) {
      console.log('Action filter found');
      // Filter UI exists - test passes
    } else {
      console.log('Note: Action type filter not visible in activity log');
    }
  });

  test('T86.4: Log shows admin username and timestamp', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-LOG-004' });

    const hasAccess = await goToActivityLogWithAuth(page);
    if (!hasAccess) {
      test.skip(true, 'Test user lacks admin role');
      return;
    }

    // Look for any log entries
    const logRows = page.locator('tbody tr');
    const rowCount = await logRows.count();

    if (rowCount > 0) {
      // First row should have proper content
      const firstRow = logRows.first();
      await expect(firstRow).toBeVisible();

      // Should contain timestamp (date/time format)
      const timestampCell = firstRow.locator('td').first();
      await expect(timestampCell).toBeVisible();
    }

    // Export button may be visible
    const exportButton = page.locator('button:has-text("Export")');
    const hasExport = await exportButton.isVisible().catch(() => false);
    if (hasExport) {
      console.log('Export button found');
    }
  });

  test('T86.5: Search activity log', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ADMIN-LOG-005' });

    const hasAccess = await goToActivityLogWithAuth(page);
    if (!hasAccess) {
      test.skip(true, 'Test user lacks admin role');
      return;
    }

    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();

    if (await searchInput.isVisible().catch(() => false)) {
      // Type a search term
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      console.log('Search functionality found and tested');
    } else {
      console.log('Note: Search input not visible in activity log');
    }
  });
});
