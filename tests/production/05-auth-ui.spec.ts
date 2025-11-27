/**
 * Production auth-related UI checks (unauthenticated state)
 */

import { test, expect } from '@playwright/test';
import { monitorConsole, monitorNetwork, waitForQuiet, hasSevereConsoleError } from './utils';

const PRODUCTION_URL = 'https://powertimeline.com';

test.describe('Production Auth UI (unauthenticated)', () => {
  // v0.5.6: CTA buttons swapped - "Sign In" is now secondary (cta-get-started), "Explore Examples" is primary
  test('Top nav shows Sign In and secondary CTA is "Sign In"', async ({ page }) => {
    const consoleMonitor = monitorConsole(page);
    const networkMonitor = monitorNetwork(page);

    await page.goto(PRODUCTION_URL);

    await expect(page.getByTestId('sign-in-button')).toBeVisible({ timeout: 10_000 });
    // Secondary CTA (cta-get-started) now says "Sign In" instead of "Get Started Free"
    await expect(page.getByTestId('cta-get-started')).toHaveText(/Sign In/i);

    await waitForQuiet(page, 1_000);

    // Log any console errors for diagnostics
    if (consoleMonitor.errors.length > 0) {
      console.log('Console errors (Top nav auth UI test):', consoleMonitor.errors);
    }

    expect(hasSevereConsoleError(consoleMonitor.errors)).toBeFalsy();
    expect(networkMonitor.failures).toEqual([]);
  });

  test('"Sign In" button navigates to /login', async ({ page }) => {
    const consoleMonitor = monitorConsole(page);
    const networkMonitor = monitorNetwork(page);

    await page.goto(PRODUCTION_URL);
    await page.getByTestId('sign-in-button').click();

    await expect(page).toHaveURL(/\/login/);

    await waitForQuiet(page, 1_000);

    if (consoleMonitor.errors.length > 0) {
      console.log('Console errors (Sign In navigation test):', consoleMonitor.errors);
    }

    expect(hasSevereConsoleError(consoleMonitor.errors)).toBeFalsy();
    expect(networkMonitor.failures).toEqual([]);
  });
});
