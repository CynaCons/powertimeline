/**
 * Production permissions & security probes (non-destructive)
 */

import { test, expect } from '@playwright/test';
import { monitorConsole, monitorNetwork, waitForQuiet, hasSevereConsoleError } from './utils';

const PROD = 'https://powertimeline.com';

test.describe('Production Permissions & Security', () => {
  test('unauthenticated cannot access admin panel', async ({ page }) => {
    const consoleMonitor = monitorConsole(page);
    const networkMonitor = monitorNetwork(page);

    await page.goto(`${PROD}/admin`);
    await waitForQuiet(page, 1000);

    // Should be redirected (not stay on /admin)
    await expect(page).not.toHaveURL(/\/admin$/);
    // Admin UI should not be visible
    await expect(page.getByTestId('admin-page')).not.toBeVisible({ timeout: 2000 });

    expect(hasSevereConsoleError(consoleMonitor.errors)).toBeFalsy();
    expect(networkMonitor.failures).toEqual([]);
  });

  test('unauthenticated cannot write to Firestore (analytics blocked)', async ({ request }) => {
    const res = await request.post(
      'https://firestore.googleapis.com/v1/projects/powertimeline/databases/(default)/documents/users/hack-attempt',
      { data: { fields: { test: { stringValue: 'unauth' } } } }
    );
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('private timeline URL rejects unauthenticated access (expect 403/redirect)', async ({ page }) => {
    const consoleMonitor = monitorConsole(page);
    const networkMonitor = monitorNetwork(page);

    // Likely non-existent or private ID; adjust if known private ID exists
    await page.goto(`${PROD}/user/private-owner/timeline/private-timeline`);
    await waitForQuiet(page, 1000);

    // Should not show timeline content
    const hasAxis = await page.getByTestId('timeline-axis').isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasAxis).toBeFalsy();

    // Expect some redirect or error messaging
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/timeline/private-timeline');

    expect(hasSevereConsoleError(consoleMonitor.errors)).toBeFalsy();
    expect(networkMonitor.failures.filter((f) => f.includes('private-timeline'))).toEqual([]);
  });

  test('admin UI elements not present for unauthenticated users on browse/landing', async ({ page }) => {
    const consoleMonitor = monitorConsole(page);
    const networkMonitor = monitorNetwork(page);

    await page.goto(PROD);
    await waitForQuiet(page, 1000);

    // No admin links/buttons visible
    const adminLinkVisible = await page.getByRole('link', { name: /admin/i }).isVisible({ timeout: 1000 }).catch(() => false);
    expect(adminLinkVisible).toBeFalsy();

    // No dev/admin tabs on browse
    await page.goto(`${PROD}/browse`);
    await waitForQuiet(page, 1000);
    const adminTabVisible = await page.getByRole('tab', { name: /admin/i }).isVisible({ timeout: 1000 }).catch(() => false);
    expect(adminTabVisible).toBeFalsy();

    expect(hasSevereConsoleError(consoleMonitor.errors)).toBeFalsy();
    expect(networkMonitor.failures).toEqual([]);
  });
});
