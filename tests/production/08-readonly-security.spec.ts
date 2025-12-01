/**
 * Production read-only and security probes
 */

import { test, expect } from '@playwright/test';
import { monitorConsole, monitorNetwork, waitForQuiet, hasSevereConsoleError } from './utils';

const PROD = 'https://powertimeline.com';

test.describe('Production Read-only & Security', () => {
  test('public timeline opens in read-only state (no edit controls)', async ({ page }) => {
    const consoleMonitor = monitorConsole(page);
    const networkMonitor = monitorNetwork(page);

    // Use browse page first timeline
    await page.goto(`${PROD}/browse`);
    const timelineHeading = page.getByRole('heading', { level: 3 }).first();
    await expect(timelineHeading).toBeVisible({ timeout: 5000 });
    await timelineHeading.click();
    await page.waitForLoadState('domcontentloaded');
    await waitForQuiet(page, 2000);

    // Strict check: timeline should render events; fail fast if none appear.
    const eventCards = page.getByTestId('event-card');
    const eventCount = await eventCards.count();
    expect(eventCount, 'Expected events to render but found none').toBeGreaterThan(0);
    await expect(eventCards.first()).toBeVisible({ timeout: 5_000 });

    // Expect URL contains /timeline/
    expect(page.url()).toContain('/timeline/');

    // Read-only indicators: banner or lock icon or absence of edit buttons
    const hasReadOnlyBanner = await page.getByText(/read-only mode/i).isVisible({ timeout: 3000 }).catch(() => false);
    const hasEditButtons = await page.getByRole('button', { name: /save|create event|delete/i }).isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasReadOnlyBanner || !hasEditButtons).toBe(true);

    expect(hasSevereConsoleError(consoleMonitor.errors)).toBeFalsy();
    expect(networkMonitor.failures).toEqual([]);
  });

  test('unauthenticated write attempt fails', async ({ page }) => {
    const consoleMonitor = monitorConsole(page);
    const networkMonitor = monitorNetwork(page);

    await page.goto(PROD);
    await waitForQuiet(page, 1000);

    // Attempt a Firestore write without auth (expect 4xx/permission denied)
    const response = await page.request.post('https://firestore.googleapis.com/v1/projects/powertimeline/databases/(default)/documents/users/test-write', {
      data: { fields: { test: { stringValue: 'unauth' } } },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);

    expect(hasSevereConsoleError(consoleMonitor.errors)).toBeFalsy();
    expect(networkMonitor.failures.filter((f) => !f.includes('firestore.googleapis.com'))).toEqual([]);
  });
});
