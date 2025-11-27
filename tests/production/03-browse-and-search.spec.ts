/**
 * Production browse/search coverage
 */

import { test, expect } from '@playwright/test';
import {
  monitorConsole,
  monitorNetwork,
  waitForQuiet,
  hasSevereConsoleError,
} from './utils';

const PRODUCTION_URL = 'https://powertimeline.com';

test.describe('Production Browse & Search', () => {
  test('browse page loads without permission errors', async ({ page }) => {
    const consoleMonitor = monitorConsole(page);
    const networkMonitor = monitorNetwork(page);

    await page.goto(`${PRODUCTION_URL}/browse`);
    await expect(page.getByPlaceholder('Search timelines and users...')).toBeVisible({
      timeout: 10_000,
    });

    await waitForQuiet(page, 3_000);

    expect(hasSevereConsoleError(consoleMonitor.errors)).toBeFalsy();
    expect(networkMonitor.failures).toEqual([]);
  });

  test('landing search redirects to browse with query', async ({ page }) => {
    const consoleMonitor = monitorConsole(page);
    const networkMonitor = monitorNetwork(page);

    await page.goto(PRODUCTION_URL);

    const searchInputContainer = page.getByTestId('search-input');
    await expect(searchInputContainer).toBeVisible({ timeout: 5_000 });

    const searchInput = searchInputContainer.getByRole('textbox');
    await searchInput.fill('napoleon');
    await searchInput.press('Enter');

    await expect(page).toHaveURL(/\/browse\?search=napoleon/i);
    await waitForQuiet(page, 2_000);

    expect(hasSevereConsoleError(consoleMonitor.errors)).toBeFalsy();
    expect(networkMonitor.failures).toEqual([]);
  });
});
