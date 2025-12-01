/**
 * Production navigation and CTA checks
 */

import { test, expect } from '@playwright/test';
import {
  monitorConsole,
  monitorNetwork,
  waitForQuiet,
  hasSevereConsoleError,
} from './utils';

const PRODUCTION_URL = 'https://powertimeline.com';

test.describe('Production Navigation', () => {
  // v0.5.6: CTA buttons swapped - "Sign In" is now secondary, "Explore Examples" is primary
  test('CTA "Sign In" routes to login for unauthenticated users', async ({ page }) => {
    const consoleMonitor = monitorConsole(page);
    const networkMonitor = monitorNetwork(page);

    await page.goto(PRODUCTION_URL);
    await page.getByTestId('cta-get-started').click();

    await expect(page).toHaveURL(/\/login/);
    await waitForQuiet(page, 1_000);

    expect(hasSevereConsoleError(consoleMonitor.errors)).toBeFalsy();
    expect(networkMonitor.failures).toEqual([]);
  });

  test('CTA "Explore Examples" (primary orange button) routes to /browse', async ({ page }) => {
    const consoleMonitor = monitorConsole(page);
    const networkMonitor = monitorNetwork(page);

    await page.goto(PRODUCTION_URL);
    await page.getByTestId('cta-explore-examples').click();

    await expect(page).toHaveURL(/\/browse/);
    await waitForQuiet(page, 1_000);

    expect(hasSevereConsoleError(consoleMonitor.errors)).toBeFalsy();
    expect(networkMonitor.failures).toEqual([]);
  });

  test('Top nav Browse button routes to /browse', async ({ page }) => {
    const consoleMonitor = monitorConsole(page);
    const networkMonitor = monitorNetwork(page);

    await page.goto(PRODUCTION_URL);
    await page.getByTestId('browse-button').click();

    await expect(page).toHaveURL(/\/browse/);
    await waitForQuiet(page, 1_000);

    expect(hasSevereConsoleError(consoleMonitor.errors)).toBeFalsy();
    expect(networkMonitor.failures).toEqual([]);
  });

  test('Example card navigates to timeline viewer in read-only mode', async ({ page }) => {
    const consoleMonitor = monitorConsole(page);
    const networkMonitor = monitorNetwork(page);

    await page.goto(`${PRODUCTION_URL}/browse`);

    // Use first timeline heading as navigation target
    const timelineHeading = page.getByRole('heading', { level: 3 }).first();
    await expect(timelineHeading).toBeVisible({ timeout: 5_000 });
    await timelineHeading.click();

    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/timeline\//);

    await waitForQuiet(page, 2_000);

    // Strict check: timeline must render at least one event card (guards against blank timelines).
    const eventCards = page.getByTestId('event-card');
    const eventCount = await eventCards.count();
    expect(eventCount, 'Expected events to render but found none').toBeGreaterThan(0);
    await expect(eventCards.first()).toBeVisible({ timeout: 5_000 });

    expect(hasSevereConsoleError(consoleMonitor.errors)).toBeFalsy();
    expect(networkMonitor.failures).toEqual([]);
  });
});
