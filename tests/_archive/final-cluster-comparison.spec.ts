import { test } from '@playwright/test';

test.describe('Final Cluster Comparison - Timeline Proximity Fix', () => {
  test('should show improved positioning with 1, 2, 3 clusters', async ({ page }) => {
    // Clear previous test results
    await page.goto('http://localhost:5178');
    await page.waitForSelector('[data-testid="timeline-axis"]', { timeout: 10000 });
    
    // Enable info panels
    const infoToggle = page.locator('button[aria-label="Toggle info panels"]');
    await infoToggle.click();
    await page.waitForTimeout(500);
    
    // Enable dev mode
    const devToggle = page.locator('button[aria-label="Toggle developer options"]');
    await devToggle.click();
    
    const devPanel = page.locator('button[aria-label="Developer Panel"]');
    await devPanel.click();
    await page.waitForTimeout(500);
    
    // Cluster 1
    console.log('Adding cluster 1 with improved positioning...');
    const clusteredButton = page.locator('button:has-text("Clustered")');
    await clusteredButton.click();
    await page.waitForTimeout(2000);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    await page.screenshot({
      path: 'test-results/final-cluster-1.png',
      fullPage: true
    });
    
    // Cluster 2
    console.log('Adding cluster 2 with improved positioning...');
    await devPanel.click();
    await clusteredButton.click();
    await page.waitForTimeout(2000);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    await page.screenshot({
      path: 'test-results/final-cluster-2.png',
      fullPage: true
    });
    
    // Cluster 3
    console.log('Adding cluster 3 with improved positioning...');
    await devPanel.click();
    await clusteredButton.click();
    await page.waitForTimeout(2000);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    await page.screenshot({
      path: 'test-results/final-cluster-3.png',
      fullPage: true
    });
    
    console.log('All screenshots saved with improved timeline proximity positioning!');
  });
});