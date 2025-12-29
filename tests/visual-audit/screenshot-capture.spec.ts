import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { loginAsTestUser, loadTimeline, waitForEditorLoaded, skipIfNoCredentials } from '../utils/timelineTestUtils';

// Test configuration
const TEST_OWNER_USERNAME = 'cynacons';
const TEST_TIMELINE_ID = 'french-revolution';

test.describe('Visual Audit - Screenshot Capture (Authenticated)', () => {
  const screenshotsDir = path.join(process.cwd(), 'screenshots', 'visual-audit');

  test.beforeAll(async () => {
    // Ensure screenshots directory exists
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    // Skip if no test credentials
    skipIfNoCredentials(test);

    // Login as test user
    await loginAsTestUser(page);
  });

  test('capture editor screenshots in both themes', async ({ page }) => {
    // Load timeline as owner (edit mode)
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page);
    await page.waitForTimeout(2000);

    // Verify we're in editor mode
    const controlsVisible = await page.locator('[class*="zoom"], [class*="Zoom"], [class*="Controls"]').first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Editor controls visible: ${controlsVisible}`);

    // Capture LIGHT theme
    await page.evaluate(() => {
      // Set theme preference in localStorage (app uses 'theme-preference', not 'theme')
      localStorage.setItem('theme-preference', 'light');
      // Update data-theme attribute (app uses data-theme, not dark class)
      document.documentElement.setAttribute('data-theme', 'light');
      // Dispatch storage event to trigger React context listeners
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'theme-preference',
        newValue: 'light',
        storageArea: localStorage
      }));
    });
    await page.waitForTimeout(1000); // Longer wait for React re-render

    await page.screenshot({
      path: path.join(screenshotsDir, 'editor-default-light.png'),
      fullPage: false
    });
    console.log('✅ Captured: editor-default-light.png');

    // Capture DARK theme
    await page.evaluate(() => {
      localStorage.setItem('theme-preference', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'theme-preference',
        newValue: 'dark',
        storageArea: localStorage
      }));
    });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(screenshotsDir, 'editor-default-dark.png'),
      fullPage: false
    });
    console.log('✅ Captured: editor-default-dark.png');

    // Verify screenshots are different (theme toggle worked)
    const lightSize = fs.statSync(path.join(screenshotsDir, 'editor-default-light.png')).size;
    const darkSize = fs.statSync(path.join(screenshotsDir, 'editor-default-dark.png')).size;
    const sizeDiff = Math.abs(lightSize - darkSize);

    console.log(`Light theme screenshot: ${lightSize} bytes`);
    console.log(`Dark theme screenshot: ${darkSize} bytes`);
    console.log(`Size difference: ${sizeDiff} bytes`);

    if (sizeDiff < 1000) {
      console.log('⚠️  WARNING: Screenshots may be identical - theme toggle might not be working');
    } else {
      console.log('✅ Theme toggle working - screenshots are different');
    }
  });

  test('capture zoom state screenshots', async ({ page }) => {
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page);
    await page.waitForTimeout(1500);

    // Set to light theme for consistency
    await page.evaluate(() => {
      localStorage.setItem('theme-preference', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
    });
    await page.waitForTimeout(500);

    // Try to find zoom controls
    const zoomOutBtn = page.locator('button:has-text("-"), [data-testid="zoom-out"], [aria-label*="zoom out" i]').first();
    const zoomInBtn = page.locator('button:has-text("+"), [data-testid="zoom-in"], [aria-label*="zoom in" i]').first();

    // Capture zoomed OUT state
    if (await zoomOutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('Found zoom out button, zooming out...');
      for (let i = 0; i < 5; i++) {
        await zoomOutBtn.click();
        await page.waitForTimeout(200);
      }
      await page.screenshot({
        path: path.join(screenshotsDir, 'editor-zoomed-out.png'),
        fullPage: false
      });
      console.log('✅ Captured: editor-zoomed-out.png');

      // Zoom back in
      if (await zoomInBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        for (let i = 0; i < 10; i++) {
          await zoomInBtn.click();
          await page.waitForTimeout(200);
        }
        await page.screenshot({
          path: path.join(screenshotsDir, 'editor-zoomed-in.png'),
          fullPage: false
        });
        console.log('✅ Captured: editor-zoomed-in.png');
      }
    } else {
      console.log('⚠️  Zoom controls not found - skipping zoom screenshots');

      // Take a screenshot anyway to see what's visible
      await page.screenshot({
        path: path.join(screenshotsDir, 'editor-no-zoom-controls.png'),
        fullPage: false
      });
      console.log('📸 Captured diagnostic: editor-no-zoom-controls.png');
    }
  });

  test('capture overlay state screenshots', async ({ page }) => {
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page);
    await page.waitForTimeout(1500);

    // Set to light theme
    await page.evaluate(() => {
      localStorage.setItem('theme-preference', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
    });
    await page.waitForTimeout(500);

    // Find and double-click an event card to open AuthoringOverlay
    // Use exact data-testid attribute selector
    const eventCard = page.locator('[data-testid="event-card"]').first();

    if (await eventCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Found event card, double-clicking to open overlay...');

      // Wait for card to be stable (no animations)
      await page.waitForTimeout(500);

      // Scroll card into view
      await eventCard.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);

      // Double-click the card element directly
      await eventCard.dblclick({ timeout: 5000 });
      console.log('Double-click executed');

      // Wait longer for overlay to render (including lazy loading + React state updates)
      await page.waitForTimeout(2500);

      // Check if overlay opened - look for the authoring overlay component
      // The AuthoringOverlay is rendered in a Suspense with lazy loading, so check multiple selectors
      const overlaySelectors = [
        '.fixed.right-0.top-0.bottom-0',  // Fixed right panel
        '[role="dialog"]',                 // Might have dialog role
        'form:has(input[value*="date"])',  // Form with date inputs
      ];

      let overlayVisible = false;
      for (const selector of overlaySelectors) {
        const el = page.locator(selector).first();
        if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log(`Overlay found with selector: ${selector}`);
          overlayVisible = true;
          break;
        }
      }

      console.log(`Overlay visible: ${overlayVisible}`);

      if (overlayVisible) {
        await page.screenshot({
          path: path.join(screenshotsDir, 'editor-overlay-open.png'),
          fullPage: false
        });
        console.log('✅ Captured: editor-overlay-open.png');

        // Close overlay with Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      } else {
        console.log('⚠️  Overlay did not open after double-click');
        // Take screenshot to see current state
        await page.screenshot({
          path: path.join(screenshotsDir, 'editor-overlay-not-opened.png'),
          fullPage: false
        });
        // Try to debug by checking page HTML
        const html = await page.content();
        const hasOverlayInHTML = html.includes('AuthoringOverlay') || html.includes('overlay');
        console.log(`HTML contains overlay references: ${hasOverlayInHTML}`);
      }
    } else {
      console.log('⚠️  No event cards found to click');
    }
  });

  test('capture panel state screenshots', async ({ page }) => {
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page);
    await page.waitForTimeout(1500);

    // Set to light theme
    await page.evaluate(() => {
      localStorage.setItem('theme-preference', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
    });
    await page.waitForTimeout(500);

    // Try to open Events panel via nav rail
    const eventsButton = page.locator('[data-testid*="events"], [aria-label*="Events" i], button:has-text("Events")').first();

    if (await eventsButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await eventsButton.click();
      await page.waitForTimeout(800);

      await page.screenshot({
        path: path.join(screenshotsDir, 'editor-events-panel.png'),
        fullPage: false
      });
      console.log('✅ Captured: editor-events-panel.png');
    } else {
      console.log('⚠️  Events panel button not found');
    }

    // Final summary screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, 'editor-final-state.png'),
      fullPage: false
    });
    console.log('✅ Captured: editor-final-state.png');

    // List all captured screenshots
    const files = fs.readdirSync(screenshotsDir);
    console.log(`\n=== SCREENSHOTS CAPTURED (${files.length}) ===`);
    files.forEach(f => console.log(`  📸 ${f}`));
  });
});
