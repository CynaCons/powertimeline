/**
 * WebKit Firebase Diagnostics Test
 * Captures console logs and network activity to diagnose why Firebase never loads on WebKit
 */

import { test, expect } from '@playwright/test';

test.describe('WebKit Firebase Diagnostics', () => {
  test('Capture WebKit console logs and network for Firebase loading', async ({ page, browserName }) => {
    // Only run on WebKit
    test.skip(browserName !== 'webkit', 'WebKit-specific diagnostic');

    const consoleLogs: Array<{ type: string; text: string }> = [];
    const networkRequests: Array<{ url: string; status: number | null; error: string | null }> = [];

    // Capture console messages
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
      });
    });

    // Capture network requests
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        status: null,
        error: null,
      });
    });

    page.on('response', response => {
      const req = networkRequests.find(r => r.url === response.url() && r.status === null);
      if (req) {
        req.status = response.status();
      }
    });

    page.on('requestfailed', request => {
      const req = networkRequests.find(r => r.url === request.url() && r.error === null);
      if (req) {
        req.error = request.failure()?.errorText || 'unknown error';
      }
    });

    // Navigate to a public timeline
    await page.goto('/cynacons/timeline/french-revolution');
    await page.waitForLoadState('domcontentloaded');

    // Wait up to 15 seconds to see if Firebase loads
    try {
      await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible({ timeout: 15000 });
      console.log('✅ Timeline loaded successfully on WebKit');
    } catch (error) {
      console.log('❌ Timeline did NOT load on WebKit');
    }

    // Print all console logs
    console.log('\n=== CONSOLE LOGS ===');
    consoleLogs.forEach(log => {
      console.log(`[${log.type.toUpperCase()}] ${log.text}`);
    });

    // Print Firebase-related network requests
    console.log('\n=== FIREBASE NETWORK REQUESTS ===');
    const firebaseRequests = networkRequests.filter(req =>
      req.url.includes('firestore') ||
      req.url.includes('firebase') ||
      req.url.includes('googleapis.com')
    );

    firebaseRequests.forEach(req => {
      console.log(`URL: ${req.url}`);
      console.log(`Status: ${req.status || 'pending'}`);
      if (req.error) console.log(`Error: ${req.error}`);
      console.log('---');
    });

    // Print summary
    console.log('\n=== SUMMARY ===');
    console.log(`Total console logs: ${consoleLogs.length}`);
    console.log(`Errors: ${consoleLogs.filter(l => l.type === 'error').length}`);
    console.log(`Warnings: ${consoleLogs.filter(l => l.type === 'warning').length}`);
    console.log(`Total network requests: ${networkRequests.length}`);
    console.log(`Firebase requests: ${firebaseRequests.length}`);
    console.log(`Failed requests: ${networkRequests.filter(r => r.error).length}`);

    // Check for specific known issues
    const hasIndexedDBError = consoleLogs.some(log =>
      log.text.toLowerCase().includes('indexeddb') && log.type === 'error'
    );
    const hasFirestoreError = consoleLogs.some(log =>
      log.text.toLowerCase().includes('firestore') && log.type === 'error'
    );
    const hasNetworkError = consoleLogs.some(log =>
      (log.text.toLowerCase().includes('network') || log.text.toLowerCase().includes('fetch')) &&
      log.type === 'error'
    );

    console.log(`\n=== KNOWN ISSUE INDICATORS ===`);
    console.log(`IndexedDB errors: ${hasIndexedDBError}`);
    console.log(`Firestore errors: ${hasFirestoreError}`);
    console.log(`Network errors: ${hasNetworkError}`);

    // Don't fail the test - just collect diagnostics
    expect(true).toBe(true);
  });
});
