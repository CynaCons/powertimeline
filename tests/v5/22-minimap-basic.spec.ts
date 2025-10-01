import { test, expect } from '@playwright/test';

test.describe('Timeline Minimap Basic Tests', () => {
  test('Page loads correctly with minimap visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Minimap should be visible
    const minimap = page.locator('[data-testid="timeline-minimap"]');
    await expect(minimap).toBeVisible();

    // Main app should be functional
    const timeline = page.locator('[data-testid="timeline-axis"]');
    await expect(timeline).toBeVisible();

    await page.screenshot({ path: 'test-results/minimap-basic-no-events.png' });
  });
  
  test('Minimap shows event density markers', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Enable dev mode and add some test events first
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    await page.getByRole('button', { name: 'JFK 1961-63' }).click();
    await page.keyboard.press('Escape'); // Close dev panel
    await page.waitForTimeout(500);

    // Check that minimap shows event count
    const minimap = page.locator('[data-testid="timeline-minimap"]');
    await expect(minimap).toBeVisible();
    await expect(page.locator('text=/\\d+ events/')).toBeVisible();

    // Check for event markers within minimap - they're positioned absolutely
    const minimapBar = minimap.locator('.relative.h-2');
    await expect(minimapBar).toBeVisible();

    await page.screenshot({ path: 'test-results/minimap-event-markers-default.png' });
  });
  
  test('Minimap view window indicator is visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Enable dev mode and add some test events first
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    await page.getByRole('button', { name: 'JFK 1961-63' }).click();
    await page.keyboard.press('Escape'); // Close dev panel
    await page.waitForTimeout(500);

    // Check for view window indicator - it's cursor-grab or cursor-grabbing
    const minimap = page.locator('[data-testid="timeline-minimap"]');
    const viewWindow = minimap.locator('.cursor-grab, .cursor-grabbing').first();
    await expect(viewWindow).toBeVisible();

    // Check that minimap is interactive (has the bar)
    const minimapBar = minimap.locator('.relative.h-2');
    await expect(minimapBar).toBeVisible();

    await page.screenshot({ path: 'test-results/minimap-view-window.png' });
  });
});