import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Visual Audit - Screenshot Capture', () => {
  test.beforeAll(async () => {
    // Ensure screenshots directory exists
    const screenshotsDir = path.join(process.cwd(), 'screenshots', 'visual-audit');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test('capture visual audit screenshots', async ({ page }) => {
    // Load a public timeline directly (no auth required for viewing)
    await page.goto('/cynacons/timeline/french-revolution');
    await page.waitForLoadState('domcontentloaded');

    // Wait for timeline events to render
    const eventCards = page.getByTestId('event-card');
    await eventCards.first().waitFor({ state: 'visible', timeout: 10000 });

    // Wait for UI to settle
    await page.waitForTimeout(1000);

    const screenshotsDir = path.join(process.cwd(), 'screenshots', 'visual-audit');

    // Capture default state - both themes
    for (const theme of ['light', 'dark']) {
      await page.evaluate((t) => {
        document.documentElement.classList.toggle('dark', t === 'dark');
        localStorage.setItem('theme', t);
      }, theme);
      await page.waitForTimeout(300);

      await page.screenshot({
        path: path.join(screenshotsDir, `audit-default-${theme}.png`),
        fullPage: false
      });
      console.log(`Captured: audit-default-${theme}.png`);
    }

    // Try to interact with zoom controls if they exist
    const zoomOut = page.locator('[data-testid="zoom-out"], button:has-text("-")').first();
    if (await zoomOut.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Zoom out
      for (let i = 0; i < 3; i++) {
        await zoomOut.click();
        await page.waitForTimeout(200);
      }
      await page.screenshot({
        path: path.join(screenshotsDir, 'audit-zoomed-out.png'),
        fullPage: false
      });
      console.log('Captured: audit-zoomed-out.png');

      // Zoom back in
      const zoomIn = page.locator('[data-testid="zoom-in"], button:has-text("+")').first();
      for (let i = 0; i < 6; i++) {
        await zoomIn.click();
        await page.waitForTimeout(200);
      }
      await page.screenshot({
        path: path.join(screenshotsDir, 'audit-zoomed-in.png'),
        fullPage: false
      });
      console.log('Captured: audit-zoomed-in.png');
    }

    console.log(`\nScreenshots saved to: ${screenshotsDir}`);
  });
});
