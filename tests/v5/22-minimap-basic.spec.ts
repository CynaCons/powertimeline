import { test, expect } from '@playwright/test';

test.describe('Timeline Minimap Basic Tests', () => {
  test('Page loads correctly without minimap when no events', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Minimap should not be visible when no events
    const minimapText = page.locator('text=Timeline Overview');
    await expect(minimapText).not.toBeVisible();
    
    // Main app should still be functional  
    const sidebar = page.locator('aside.bg-white'); // Main sidebar
    await expect(sidebar).toBeVisible();
    
    await page.screenshot({ path: 'test-results/minimap-basic-no-events.png' });
  });
  
  test('Minimap shows event density markers', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Enable dev mode and add some test events first
    await page.click('button[aria-label="Toggle developer options"]');
    await page.click('button[aria-label="Developer Panel"]');
    await page.click('button:has-text("JFK 1961-63")');
    await page.waitForTimeout(500);
    
    // Check for event markers (blue vertical lines)
    const eventMarkers = page.locator('.bg-blue-400');
    const markerCount = await eventMarkers.count();
    
    console.log(`Event markers visible: ${markerCount}`);
    
    // Should have some event markers for default events
    expect(markerCount).toBeGreaterThan(0);
    
    await page.screenshot({ path: 'test-results/minimap-event-markers-default.png' });
  });
  
  test('Minimap view window indicator is visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Enable dev mode and add some test events first
    await page.click('button[aria-label="Toggle developer options"]');
    await page.click('button[aria-label="Developer Panel"]');
    await page.click('button:has-text("JFK 1961-63")');
    await page.waitForTimeout(500);
    
    // Check for view window indicator (highlighted section)
    const viewWindow = page.locator('.bg-transparent.border-blue-500');
    await expect(viewWindow).toBeVisible();
    
    // Should have view window handles
    const handles = page.locator('.bg-blue-600').filter({ hasNot: page.locator('.bg-opacity-15') });
    const handleCount = await handles.count();
    
    console.log(`View window handles: ${handleCount}`);
    expect(handleCount).toBeGreaterThanOrEqual(2); // Left and right handles
    
    await page.screenshot({ path: 'test-results/minimap-view-window.png' });
  });
});