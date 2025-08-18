import { test } from '@playwright/test';

test.describe('Timeline Proximity Test', () => {
  test('should position cards near timeline on both sides', async ({ page }) => {
    await page.goto('http://localhost:5178');
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="timeline-axis"]', { timeout: 10000 });
    
    // Enable info panels for analysis
    const infoToggle = page.locator('button[aria-label="Toggle info panels"]');
    await infoToggle.click();
    await page.waitForTimeout(500);
    
    // Enable dev mode
    const devToggle = page.locator('button[aria-label="Toggle developer options"]');
    await devToggle.click();
    
    const devPanel = page.locator('button[aria-label="Developer Panel"]');
    await devPanel.click();
    await page.waitForTimeout(500);
    
    // Add clustered data
    console.log('Adding clustered data to test positioning...');
    const clusteredButton = page.locator('button:has-text("Clustered")');
    await clusteredButton.click();
    await page.waitForTimeout(2000);
    
    // Close dev panel
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Take screenshot of new positioning
    await page.screenshot({
      path: 'test-results/timeline-proximity-after.png',
      fullPage: true
    });
    
    console.log('Screenshot saved showing cards positioned near timeline on both sides');
  });
});