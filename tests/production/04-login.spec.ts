/**
 * Production login page coverage
 */

import { test, expect } from '@playwright/test';
import {
  monitorConsole,
  monitorNetwork,
  waitForQuiet,
  hasSevereConsoleError,
} from './utils';

const PRODUCTION_URL = 'https://powertimeline.com';

test.describe('Production Login', () => {
  test('login page renders fields without console/network errors', async ({ page }) => {
    const consoleMonitor = monitorConsole(page);
    const networkMonitor = monitorNetwork(page);

    await page.goto(`${PRODUCTION_URL}/login`);

    const textboxes = page.getByRole('textbox');
    expect(await textboxes.count()).toBeGreaterThanOrEqual(2);
    await expect(page.getByTestId('sign-in-google-button')).toBeVisible({ timeout: 10_000 });

    await waitForQuiet(page, 1_500);

    expect(hasSevereConsoleError(consoleMonitor.errors)).toBeFalsy();
    expect(networkMonitor.failures).toEqual([]);
  });
});
