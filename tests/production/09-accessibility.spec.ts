/**
 * Production accessibility smoke checks (lightweight)
 */

import { test, expect } from '@playwright/test';
import { monitorConsole, monitorNetwork, waitForQuiet, hasSevereConsoleError } from './utils';

const PROD = 'https://powertimeline.com';

test.describe('Production Accessibility Smoke', () => {
  test('landing page has headings and keyboard-focusable CTAs', async ({ page }) => {
    const consoleMonitor = monitorConsole(page);
    const networkMonitor = monitorNetwork(page);

    await page.goto(PROD);
    await waitForQuiet(page, 1000);

    // Headings present
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();

    // Tab to first CTA and ensure focus moves
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const activeTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(activeTag?.toLowerCase()).toBe('button');

    expect(hasSevereConsoleError(consoleMonitor.errors)).toBeFalsy();
    expect(networkMonitor.failures).toEqual([]);
  });
});
