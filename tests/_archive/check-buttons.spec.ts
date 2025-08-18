import { test, expect } from '@playwright/test';

test.describe('Check Available Buttons', () => {
  test('list all buttons in dev panel', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for initial load
    await page.waitForTimeout(1000);
    
    // Enable dev mode
    await page.click('button[aria-label="Toggle developer options"]');
    await page.waitForTimeout(200);
    
    // Open dev panel
    await page.click('button[aria-label="Developer Panel"]', { force: true });
    await page.waitForTimeout(1000);
    
    // Get all buttons
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons total`);
    
    // List all button texts
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      const title = await buttons[i].getAttribute('title');
      const ariaLabel = await buttons[i].getAttribute('aria-label');
      if (text || title || ariaLabel) {
        console.log(`Button ${i}: text="${text}", title="${title}", aria-label="${ariaLabel}"`);
      }
    }
    
    // Take screenshot of dev panel
    await page.screenshot({ 
      path: 'test-results/dev-panel-buttons.png',
      fullPage: false 
    });
    
    // Try to find seed buttons specifically
    const seedButtons = await page.locator('button').filter({ hasText: /Seed|Random|Napoleon|JFK|RFK/ }).all();
    console.log(`\nFound ${seedButtons.length} seed buttons`);
    for (const btn of seedButtons) {
      const text = await btn.textContent();
      console.log(`  - ${text}`);
    }
  });
});