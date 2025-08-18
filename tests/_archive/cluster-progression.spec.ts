import { test } from '@playwright/test';

test.describe('Cluster Progression Screenshots', () => {
  test('should generate cluster 1, 2, 3 progressive screenshots', async ({ page }) => {
    // Go to fresh page
    await page.goto('http://localhost:5178');
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="timeline-axis"]', { timeout: 10000 });
    
    // Enable info panels for analysis
    const infoToggle = page.locator('button[aria-label="Toggle info panels"]');
    await infoToggle.click();
    await page.waitForTimeout(1000);
    
    // Take initial empty screenshot
    await page.screenshot({
      path: 'test-results/cluster-0-empty.png',
      fullPage: true
    });
    
    // Enable dev mode
    const devToggle = page.locator('button[aria-label="Toggle developer options"]');
    await devToggle.click();
    
    const devPanel = page.locator('button[aria-label="Developer Panel"]');
    await devPanel.click();
    await page.waitForTimeout(1000);
    
    // Cluster 1: Add first cluster
    console.log('Adding cluster 1...');
    const clusteredButton = page.locator('button:has-text("Clustered")');
    await clusteredButton.click();
    await page.waitForTimeout(2000); // Wait for layout to settle
    
    // Close dev panel and take screenshot
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    await page.screenshot({
      path: 'test-results/cluster-1.png',
      fullPage: true
    });
    
    // Cluster 2: Add second cluster
    console.log('Adding cluster 2...');
    await devPanel.click();
    await clusteredButton.click();
    await page.waitForTimeout(2000);
    
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    await page.screenshot({
      path: 'test-results/cluster-2.png',
      fullPage: true
    });
    
    // Cluster 3: Add third cluster  
    console.log('Adding cluster 3...');
    await devPanel.click();
    await clusteredButton.click();
    await page.waitForTimeout(2000);
    
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    await page.screenshot({
      path: 'test-results/cluster-3.png',
      fullPage: true
    });
    
    console.log('All screenshots generated successfully!');
  });
});