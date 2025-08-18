import { test, expect } from '@playwright/test';

async function openDevPanel(page: any) {
  await page.getByRole('button', { name: 'Toggle developer options' }).click();
  await page.getByRole('button', { name: 'Developer Panel' }).click();
}

async function closeDevPanel(page: any) {
  await page.getByRole('button', { name: 'Developer Panel' }).click();
}

async function fitAll(page: any) {
  const fit = page.getByRole('button', { name: 'Fit All' });
  if (await fit.count()) {
    await fit.click();
  }
}

import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

async function saveViewportScreenshot(page: any, name: string) {
  // Attach to test's output
  const attachmentPath = test.info().outputPath(name);
  await page.screenshot({ path: attachmentPath, fullPage: false });
  await test.info().attach(name, { path: attachmentPath, contentType: 'image/png' });

  // Also copy to central folder for quick access
  const baseDir = join(process.cwd(), 'test-results', 'screenshots');
  if (!existsSync(baseDir)) mkdirSync(baseDir, { recursive: true });
  const stablePath = join(baseDir, name);
  // Take an explicit screenshot to avoid cross-filesystem copy complications
  await page.screenshot({ path: stablePath, fullPage: false });
}

test.describe('v5/09 Seeding scenarios and screenshots', () => {
  test('RFK 1968 — screenshot', async ({ page }) => {
    await page.goto('/');
    await openDevPanel(page);
    await page.getByRole('button', { name: 'RFK 1968' }).click();
    await closeDevPanel(page);
    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible();
    await fitAll(page);
    await saveViewportScreenshot(page, 'v5-rfk-1968.png');
  });

  test('JFK 1961-63 — screenshot', async ({ page }) => {
    await page.goto('/');
    await openDevPanel(page);
    await page.getByRole('button', { name: 'JFK 1961-63' }).click();
    await closeDevPanel(page);
    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible();
    await fitAll(page);
    await saveViewportScreenshot(page, 'v5-jfk-1961-63.png');
  });

  test('Napoleon 1769-1821 — screenshot', async ({ page }) => {
    await page.goto('/');
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Napoleon 1769-1821' }).click();
    await closeDevPanel(page);
    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible({ timeout: 10000 });
    await fitAll(page);
    await saveViewportScreenshot(page, 'v5-napoleon-1769-1821.png');
  });

  test('Long-range — screenshot', async ({ page }) => {
    await page.goto('/');
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Long-range' }).click();
    await closeDevPanel(page);
    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible();
    await fitAll(page);
    await saveViewportScreenshot(page, 'v5-long-range.png');
  });

  test('Clustered x1 — screenshot', async ({ page }) => {
    await page.goto('/');
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clustered' }).click();
    await closeDevPanel(page);
    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible();
    await fitAll(page);
    await saveViewportScreenshot(page, 'v5-clustered-1x.png');
  });

  test('Clustered x2 — screenshot', async ({ page }) => {
    await page.goto('/');
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clustered' }).click();
    await page.getByRole('button', { name: 'Clustered' }).click();
    await closeDevPanel(page);
    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible();
    await fitAll(page);
    await saveViewportScreenshot(page, 'v5-clustered-2x.png');
  });

  test('Clustered x3 — screenshot', async ({ page }) => {
    await page.goto('/');
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clustered' }).click();
    await page.getByRole('button', { name: 'Clustered' }).click();
    await page.getByRole('button', { name: 'Clustered' }).click();
    await closeDevPanel(page);
    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible();
    await fitAll(page);
    await saveViewportScreenshot(page, 'v5-clustered-3x.png');
  });
});
