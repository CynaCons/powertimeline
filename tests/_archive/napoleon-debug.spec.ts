import { test, expect } from '@playwright/test';

test.describe('Napoleon Timeline Debug', () => {
  test('debug Napoleon timeline loading', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for initial load
    await page.waitForTimeout(1000);
    
    // Enable dev mode
    await page.click('button[aria-label="Toggle developer options"]');
    await page.waitForTimeout(200);
    
    // Open dev panel
    await page.click('button[aria-label="Developer Panel"]', { force: true });
    await page.waitForTimeout(500);
    
    // Take screenshot before clicking Napoleon
    await page.screenshot({ 
      path: 'test-results/before-napoleon.png',
      fullPage: false 
    });
    
    // Click Napoleon button with force
    const napoleonButton = page.locator('button:has-text("Napoleon 1769-1821")');
    await napoleonButton.click({ force: true });
    
    // Wait longer for events to load
    await page.waitForTimeout(3000);
    
    // Take screenshot after clicking Napoleon
    await page.screenshot({ 
      path: 'test-results/after-napoleon.png',
      fullPage: false 
    });
    
    // Close dev panel
    await page.click('button[aria-label="Developer Panel"]', { force: true });
    await page.waitForTimeout(500);
    
    // Final screenshot
    await page.screenshot({ 
      path: 'test-results/napoleon-final.png',
      fullPage: false 
    });
    
    // Check for cards - wait for them to appear
    await page.waitForSelector('.bg-white.rounded-lg.shadow-md', { timeout: 5000 }).catch(() => {
      console.log('No cards found after 5 seconds');
    });
    
    const cards = await page.locator('.bg-white.rounded-lg.shadow-md').count();
    console.log(`Napoleon timeline has ${cards} cards`);
    
    // Get event count
    const eventInfo = await page.locator('p:has-text("events")').first();
    const eventText = await eventInfo.textContent();
    console.log(`Event count shown: ${eventText}`);
    
    // Check if timeline has any visible events
    const anchors = await page.locator('[data-testid^="anchor-"]').count();
    console.log(`Timeline has ${anchors} anchor points`);
  });
});