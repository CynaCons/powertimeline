import { test, expect } from '@playwright/test';

test.describe('Iteration 1: Foundation', () => {
  test('should display full-screen grid', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(300);
    
    // Grid container should be visible and cover full space
    const gridContainer = page.locator('.grid.grid-cols-12.grid-rows-12');
    await expect(gridContainer).toBeVisible();
    
    // Should have 144 grid cells (12x12)
    const gridCells = page.locator('.grid.grid-cols-12.grid-rows-12 > div');
    await expect(gridCells).toHaveCount(144);
    
    // Main container should use full height and width
    const mainContainer = page.locator('.w-full.h-full.bg-gray-50');
    await expect(mainContainer).toBeVisible();
  });

  test('should display horizontal timeline in center', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(300);
    
    // Timeline should be visible
    const timeline = page.locator('.h-0\\.5.bg-gray-600');
    await expect(timeline).toBeVisible();
    
    // Timeline should be full width
    const timelineContainer = page.locator('.absolute.inset-0.flex.items-center');
    await expect(timelineContainer).toBeVisible();
  });

  test('should take screenshot for visual verification', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(300);
    
    // Capture full page screenshot
    await page.screenshot({ 
      path: 'test-results/iteration-1-foundation.png', 
      fullPage: true 
    });
  });
});