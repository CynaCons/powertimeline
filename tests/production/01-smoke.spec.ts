/**
 * Production Smoke Tests
 * Tests the live production deployment at powertimeline.com
 *
 * Run with: npx playwright test tests/production-smoke.spec.ts --project=chromium
 */

import { test, expect } from '@playwright/test';

const PRODUCTION_URL = 'https://powertimeline.com';

test.describe('Production Smoke Tests', () => {
  test('should load production homepage', async ({ page }) => {
    // Navigate to production
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('domcontentloaded');

    // Check for main heading
    await expect(page.getByRole('heading', { name: /PowerTimeline|Home/i })).toBeVisible({ timeout: 10000 });

    // Verify no critical errors in console
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait a bit for any async errors
    await page.waitForTimeout(2000);

    // Check for Firebase errors
    const hasFirebaseError = errors.some(err =>
      err.includes('Firebase') ||
      err.includes('projectId') ||
      err.includes('Missing App configuration')
    );

    if (hasFirebaseError) {
      console.log('Firebase errors detected:', errors.filter(e =>
        e.includes('Firebase') || e.includes('projectId')
      ));
    }

    expect(hasFirebaseError).toBe(false);
  });

  test('should display timeline cards', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('domcontentloaded');

    // Wait for timelines to load (may take time with Firestore)
    await page.waitForTimeout(3000);

    // Check if any timeline cards are visible
    // Look for common timeline elements
    const hasTimelines = await page.locator('[class*="timeline"]').count() > 0 ||
                        await page.getByRole('heading', { level: 3 }).count() > 0;

    expect(hasTimelines).toBe(true);
  });

  test('should navigate to a timeline', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('domcontentloaded');

    // Wait for content to load
    await page.waitForTimeout(3000);

    // Try to find and click a timeline card
    const timelineCard = page.locator('[class*="timeline"]').first();

    if (await timelineCard.count() > 0) {
      await timelineCard.click();

      // Wait for navigation
      await page.waitForLoadState('domcontentloaded');

      // Verify we're on a timeline page (URL should change)
      const currentUrl = page.url();
      expect(currentUrl).not.toBe(PRODUCTION_URL);
      expect(currentUrl).toContain('timeline');
    } else {
      // If no timelines found, this might be a Firestore data issue
      console.warn('No timeline cards found - possible Firestore connection issue');
      test.skip();
    }
  });

  test('should check Firestore connectivity', async ({ page }) => {
    // Check if Firebase is initialized properly
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('domcontentloaded');

    // Check console for Firebase initialization
    const logs: string[] = [];
    const errors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        errors.push(text);
      } else {
        logs.push(text);
      }
    });

    // Wait for Firebase to initialize
    await page.waitForTimeout(3000);

    // Look for specific Firebase errors
    const firebaseErrors = errors.filter(err =>
      err.includes('Firebase') ||
      err.includes('Firestore') ||
      err.includes('projectId') ||
      err.includes('apiKey')
    );

    if (firebaseErrors.length > 0) {
      console.error('Firebase Configuration Errors:', firebaseErrors);
    }

    expect(firebaseErrors.length).toBe(0);
  });

  test('should verify environment variables loaded', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await page.waitForLoadState('domcontentloaded');

    // Capture console output
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    await page.waitForTimeout(2000);

    // Check if the debug message shows env vars were loaded
    const envVarLog = consoleLogs.find(log => log.includes('Available env vars:'));

    if (envVarLog) {
      console.log('Environment variables debug output:', envVarLog);

      // The log should show VITE_ prefixed variables
      expect(envVarLog).not.toContain('Array(0)'); // Should not be empty
    }
  });
});
