import { test, expect } from '@playwright/test';

async function openDevAndClick(page, buttonText: string) {
  await page.locator('button[aria-label="Toggle developer options"]').click();
  await page.locator('button[aria-label="Developer Panel"]').click();
  await page.locator(`button:has-text("${buttonText}")`).click();
  await page.locator('button[aria-label="Developer Panel"]').click();
}

async function fitAll(page) {
  // Use the bottom control bar Fit All for consistent framing
  const fit = page.locator('button:has-text("Fit All")');
  if (await fit.count()) {
    await fit.click();
  }
}

async function saveViewportScreenshot(page, name: string, info: any) {
  const path = info.outputPath(name);
  await page.screenshot({ path, fullPage: false });
  // Attach to report for convenience
  await test.info().attach(name, { path, contentType: 'image/png' });
}

async function waitForAnyCard(page) {
  const firstCard = page.locator('[data-testid="event-card"]').first();
  await firstCard.waitFor({ state: 'attached', timeout: 10000 });
}

async function clearAllEvents(page) {
  await page.evaluate(() => { localStorage.removeItem('chronochart-events'); });
}

test.describe('Seeders screenshots (for visual analysis only)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('baseline-empty', async ({ page }, testInfo) => {
    await clearAllEvents(page);
    await page.reload();
    await saveViewportScreenshot(page, 'baseline-empty.png', testInfo);
  });

  test('random-5', async ({ page }, testInfo) => {
    await openDevAndClick(page, 'Seed 5');
    await waitForAnyCard(page);
    await fitAll(page);
    await saveViewportScreenshot(page, 'random-5.png', testInfo);
  });

  test('random-10', async ({ page }, testInfo) => {
    await openDevAndClick(page, 'Seed 10');
    await waitForAnyCard(page);
    await fitAll(page);
    await saveViewportScreenshot(page, 'random-10.png', testInfo);
  });

  test('clustered', async ({ page }, testInfo) => {
    await openDevAndClick(page, 'Clustered');
    await waitForAnyCard(page);
    await fitAll(page);
    await saveViewportScreenshot(page, 'clustered.png', testInfo);
  });

  test('long-range', async ({ page }, testInfo) => {
    await openDevAndClick(page, 'Long-range');
    await waitForAnyCard(page);
    await fitAll(page);
    await saveViewportScreenshot(page, 'long-range.png', testInfo);
  });

  test('rfk-1968', async ({ page }, testInfo) => {
    await openDevAndClick(page, 'RFK 1968');
    await waitForAnyCard(page);
    await fitAll(page);
    await saveViewportScreenshot(page, 'rfk-1968.png', testInfo);
  });

  test('jfk-1961-63', async ({ page }, testInfo) => {
    await openDevAndClick(page, 'JFK 1961-63');
    await waitForAnyCard(page);
    await fitAll(page);
    await saveViewportScreenshot(page, 'jfk-1961-63.png', testInfo);
  });

  test('napoleon-1769-1821', async ({ page }, testInfo) => {
    await openDevAndClick(page, 'Napoleon 1769-1821');
    await waitForAnyCard(page);
    await fitAll(page);
    await saveViewportScreenshot(page, 'napoleon-1769-1821.png', testInfo);
  });
});
