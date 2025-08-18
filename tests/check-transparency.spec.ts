import { test, expect } from '@playwright/test';

test.describe('Check Info Card Transparency', () => {
  test('verify info cards are transparent until hovered', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Enable dev mode and open panel to add events
    await page.click('button[aria-label="Toggle developer options"]');
    await page.waitForTimeout(200);
    await page.click('button[aria-label="Developer Panel"]', { force: true });
    await page.waitForTimeout(500);
    
    // Add events
    await page.click('button:has-text("Seed 10")');
    await page.waitForTimeout(500);
    
    // Close dev panel
    await page.click('button[aria-label="Developer Panel"]');
    await page.waitForTimeout(500);
    
    // Take screenshot before hover
    await page.screenshot({ 
      path: 'test-results/transparency-before-hover.png',
      fullPage: false 
    });
    
    // Get the info cards - need to target the actual card containers
    const topLeftCard = page.locator('.absolute.top-4.left-4').first();
    const topRightCard = page.locator('.absolute.top-4.right-4').first();
    const bottomLeftCard = page.locator('.absolute.bottom-4.left-4').first();
    
    // Check initial opacity/transparency
    console.log('\nChecking initial transparency:');
    
    const topLeftOpacity = await topLeftCard.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        opacity: computed.opacity,
        backgroundColor: computed.backgroundColor,
        classes: el.className
      };
    });
    console.log('Top-left card:', topLeftOpacity);
    
    const topRightOpacity = await topRightCard.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        opacity: computed.opacity,
        backgroundColor: computed.backgroundColor,
        classes: el.className
      };
    });
    console.log('Top-right card:', topRightOpacity);
    
    // Hover over top-left card
    await topLeftCard.hover();
    await page.waitForTimeout(500);
    
    // Take screenshot during hover
    await page.screenshot({ 
      path: 'test-results/transparency-during-hover.png',
      fullPage: false 
    });
    
    // Check opacity during hover
    const topLeftHoverOpacity = await topLeftCard.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        opacity: computed.opacity,
        backgroundColor: computed.backgroundColor
      };
    });
    console.log('\nTop-left card during hover:', topLeftHoverOpacity);
    
    // Move mouse away
    await page.mouse.move(0, 0);
    await page.waitForTimeout(500);
    
    // Take screenshot after hover
    await page.screenshot({ 
      path: 'test-results/transparency-after-hover.png',
      fullPage: false 
    });
  });
});