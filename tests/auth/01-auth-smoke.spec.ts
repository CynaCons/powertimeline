/**
 * Authentication Smoke Tests
 * Tests basic Firebase Authentication functionality
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const AUTH_TEST_URL = `${BASE_URL}/login`;

// Test email for automated testing
const TEST_EMAIL = `test-${Date.now()}@powertimeline.test`;
const TEST_PASSWORD = 'Test123456';

test.describe('Authentication Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to auth test page before each test
    await page.goto(AUTH_TEST_URL);
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load login page', async ({ page }) => {
    // Check that the page loads and displays the title
    await expect(page.getByRole('heading', { name: /PowerTimeline/i })).toBeVisible();

    // Check that sign in form exists
    await expect(page.getByText(/Sign in to PowerTimeline/i)).toBeVisible();
  });

  test('should display auth forms when not signed in', async ({ page }) => {
    // Check that sign in form is visible
    await expect(page.getByText(/Sign in to PowerTimeline/i)).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Check that Google OAuth button is visible
    await expect(page.getByRole('button', { name: /Sign in with Google/i })).toBeVisible();

    // Check that create account link is visible
    await expect(page.getByText(/New to PowerTimeline/i)).toBeVisible();
  });

  test('should create a new account with email/password', async ({ page }) => {
    // Click "Create an account" link to switch to signup mode
    await page.getByText(/Create an account/i).click();

    // Wait for form to update
    await expect(page.getByText(/Create your account/i)).toBeVisible();

    // Fill in signup form
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);

    // Click Create account button
    await page.getByRole('button', { name: /Create account/i }).click();

    // Wait for success - should show "Signed in as"
    await expect(page.getByText(/Signed in as/i)).toBeVisible({ timeout: 10000 });

    // Check that user email is displayed
    await expect(page.getByText(TEST_EMAIL)).toBeVisible();

    // Check that sign out button is visible
    await expect(page.getByRole('button', { name: /Sign out/i })).toBeVisible();
  });

  test('should sign out successfully', async ({ page }) => {
    // First create an account
    await page.getByText(/Create an account/i).click();
    await expect(page.getByText(/Create your account/i)).toBeVisible();

    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /Create account/i }).click();

    // Wait for account creation
    await expect(page.getByText(/Signed in as/i)).toBeVisible({ timeout: 10000 });

    // Now sign out
    await page.getByRole('button', { name: /Sign out/i }).click();

    // Check that user is signed out - sign in form should be visible again
    await expect(page.getByText(/Sign in to PowerTimeline/i)).toBeVisible({ timeout: 5000 });
  });

  test('should sign in with existing account', async ({ page }) => {
    // First create an account
    await page.getByText(/Create an account/i).click();
    await expect(page.getByText(/Create your account/i)).toBeVisible();

    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /Create account/i }).click();
    await expect(page.getByText(/Signed in as/i)).toBeVisible({ timeout: 10000 });

    // Sign out
    await page.getByRole('button', { name: /Sign out/i }).click();
    await expect(page.getByText(/Sign in to PowerTimeline/i)).toBeVisible({ timeout: 5000 });

    // Now sign in again with the same credentials
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /Sign in/i }).click();

    // Wait for success
    await expect(page.getByText(/Signed in as/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(TEST_EMAIL)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Try to sign in with non-existent account
    await page.locator('input[type="email"]').fill('nonexistent@test.com');
    await page.locator('input[type="password"]').fill('WrongPassword123');
    await page.getByRole('button', { name: /Sign in/i }).click();

    // Wait for error message
    await expect(page.locator('text=/invalid-credential|invalid-login-credentials|user-not-found|wrong-password/i')).toBeVisible({ timeout: 5000 });
  });

  test('should validate password requirements', async ({ page }) => {
    // Switch to signup mode
    await page.getByText(/Create an account/i).click();
    await expect(page.getByText(/Create your account/i)).toBeVisible();

    // Try to create account with password that's too short
    await page.locator('input[type="email"]').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill('12345'); // Too short
    await page.getByRole('button', { name: /Create account/i }).click();

    // Wait for error message about weak password
    await expect(page.locator('text=/weak-password|at least 6 characters|password should be at least/i')).toBeVisible({ timeout: 5000 });
  });

  test('should check for Firebase connectivity', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait for page to fully load
    await page.waitForTimeout(3000);

    // Check for Firebase-related errors
    const firebaseErrors = errors.filter(err =>
      err.includes('Firebase') ||
      err.includes('projectId') ||
      err.includes('apiKey') ||
      err.includes('auth')
    );

    // Log errors for debugging
    if (firebaseErrors.length > 0) {
      console.log('Firebase errors detected:', firebaseErrors);
    }

    // Fail if there are critical Firebase errors
    expect(firebaseErrors.length).toBe(0);
  });
});
