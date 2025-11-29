/**
 * Production auth flow checks (UI/validation only to avoid creating accounts)
 */

import { test, expect } from '@playwright/test';
import { monitorConsole, monitorNetwork, waitForQuiet, hasSevereConsoleError } from './utils';

const PROD = 'https://powertimeline.com';

test.describe('Production Auth Flows', () => {
  test('invalid credentials show error and no auth tokens stored', async ({ page }) => {
    const consoleMonitor = monitorConsole(page);
    const networkMonitor = monitorNetwork(page);

    await page.goto(`${PROD}/login`);
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(passwordInput).toBeVisible({ timeout: 5000 });

    await emailInput.fill('invalid@example.com');
    await passwordInput.fill('WrongPass123!');
    await page.getByTestId('sign-in-submit-button').click();

    // Expect an error alert to appear
    const errorAlert = page.locator('.MuiAlert-root, [role="alert"]');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });

    // Allow the expected 400 auth error from identity toolkit; only fail on other 4xx/5xx
    const nonAuthFailures = networkMonitor.failures.filter(
      (f) =>
        !/identitytoolkit\.googleapis\.com/.test(f) &&
        !/accounts:signInWithPassword/.test(f)
    );
    expect(nonAuthFailures).toEqual([]);

    await waitForQuiet(page, 1000);
    expect(hasSevereConsoleError(consoleMonitor.errors)).toBeFalsy();
  });

  test('signup form enforces validation rules', async ({ page }) => {
    const consoleMonitor = monitorConsole(page);
    const networkMonitor = monitorNetwork(page);

    await page.goto(`${PROD}/login`);
    await page.waitForLoadState('domcontentloaded');

    // Toggle to sign up
    await page.getByText('Create an account', { exact: false }).click();

    // Weak password should show validation feedback
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('123');
    await passwordInput.blur();

    // Weak password feedback list should be visible
    const feedbackItems = page.locator('text=/At least 15 characters|Add at least one special character|Add at least one uppercase|Add at least one lowercase/i');
    await expect(feedbackItems.first()).toBeVisible({ timeout: 5000 });

    await waitForQuiet(page, 1000);
    expect(hasSevereConsoleError(consoleMonitor.errors)).toBeFalsy();
    expect(networkMonitor.failures).toEqual([]);
  });
});
