/**
 * Authentication Test Utilities
 * Helper functions for Firebase Auth in tests
 * v0.5.11 - Test Stabilization
 */

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

// Test credentials from .env.test
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@powertimeline.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
const TEST_USER_UID = process.env.TEST_USER_UID || 'iTMZ9n0IuzUSbhWfCaR86WsB2AC3';

/**
 * Sign in to the application using Firebase Auth via the login page
 * @param page - Playwright page object
 * @param email - Email address (defaults to test user)
 * @param password - Password (defaults to test user password)
 * @returns true if login succeeded, false if it failed
 */
export async function signInWithEmail(
  page: Page,
  email: string = TEST_USER_EMAIL,
  password: string = TEST_USER_PASSWORD
): Promise<boolean> {
  // Navigate to login page
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  // Wait for form to be visible
  await page.waitForTimeout(1000);

  // Fill in credentials using type selectors since the form uses Typography labels
  // Email field is type="email"
  const emailInput = page.locator('input[type="email"]');
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.fill(email);

  // Password field is type="password"
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.fill(password);

  // Click sign in button (using test-id to avoid ambiguity with Google sign in)
  await page.getByTestId('sign-in-submit-button').click();

  // Wait for redirect (successful login goes to /, /browse, or /user)
  // The app may redirect to / which then redirects to /browse for logged in users
  await page.waitForTimeout(2000);

  // Verify we're no longer on the login page
  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    // Login may have failed - check for error message
    const errorVisible = await page.locator('.MuiAlert-root, [role="alert"]').isVisible({ timeout: 2000 }).catch(() => false);
    if (errorVisible) {
      // Login failed - return false instead of throwing
      return false;
    }
  }

  // Wait for any post-login redirects to settle
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  return true;
}

/**
 * Sign out from the application
 * @param page - Playwright page object
 */
export async function signOut(page: Page): Promise<void> {
  // Look for sign out button in the UI
  const signOutButton = page.getByRole('button', { name: /Sign out/i });
  if (await signOutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await signOutButton.click();
    // Wait for redirect to landing or login page
    await page.waitForURL(/\/(login)?$/, { timeout: 5000 });
  }
}

/**
 * Check if user is currently signed in
 * @param page - Playwright page object
 * @returns true if user is signed in
 */
export async function isSignedIn(page: Page): Promise<boolean> {
  // Check for presence of sign-out button or user menu
  const signOutVisible = await page.getByRole('button', { name: /Sign out/i })
    .isVisible({ timeout: 2000 })
    .catch(() => false);

  const userMenuVisible = await page.getByTestId('user-menu')
    .isVisible({ timeout: 2000 })
    .catch(() => false);

  return signOutVisible || userMenuVisible;
}

/**
 * Ensure user is signed in before proceeding
 * @param page - Playwright page object
 */
export async function ensureSignedIn(page: Page): Promise<void> {
  if (!(await isSignedIn(page))) {
    await signInWithEmail(page);
  }
}

/**
 * Navigate to a protected route, signing in if necessary
 * @param page - Playwright page object
 * @param path - Route path (e.g., '/admin', '/user/xyz')
 */
export async function navigateToProtectedRoute(page: Page, path: string): Promise<void> {
  await page.goto(path);

  // If redirected to login, sign in and try again
  if (page.url().includes('/login')) {
    await signInWithEmail(page);
    await page.goto(path);
  }

  await page.waitForLoadState('domcontentloaded');
}

/**
 * Get the test user UID
 */
export function getTestUserUid(): string {
  return TEST_USER_UID;
}

/**
 * Get the test user email
 */
export function getTestUserEmail(): string {
  return TEST_USER_EMAIL;
}
