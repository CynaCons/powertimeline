import { test, expect } from '@playwright/test';

test.describe('Progressive Cluster Analysis', () => {
  test('should generate screenshots for cluster 1, 2, and 3 progressively', async ({ page }) => {
    await page.goto('http://localhost:5178');
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="timeline-axis"]');
    
    // Clear any existing events first
    const devToggle = page.locator('button[aria-label="Toggle developer options"]');
    await devToggle.click();
    
    const devPanel = page.locator('button[aria-label="Developer Panel"]');
    await devPanel.click();
    
    // Clear all events first
    const clearButton = page.locator('button:has-text("Clear All")');
    await clearButton.click();
    await page.waitForTimeout(500);
    
    // Close dev panel
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Enable info panels to see the analysis
    const infoToggle = page.locator('button[aria-label="Toggle info panels"]');
    await infoToggle.click();
    await page.waitForTimeout(500);
    
    // Take initial screenshot (empty state)
    await page.screenshot({
      path: 'test-results/cluster-0-empty.png',
      fullPage: true
    });
    
    // Open dev panel again for seeding
    await devPanel.click();
    
    // Cluster 1: Add first cluster
    const clusteredButton = page.locator('button:has-text("Clustered")');
    await clusteredButton.click();
    await page.waitForTimeout(1000); // Wait for layout to settle
    
    // Close dev panel and take screenshot
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    await page.screenshot({
      path: 'test-results/cluster-1-analysis.png',
      fullPage: true
    });
    
    // Cluster 2: Add second cluster
    await devPanel.click();
    await clusteredButton.click();
    await page.waitForTimeout(1000);
    
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    await page.screenshot({
      path: 'test-results/cluster-2-analysis.png',
      fullPage: true
    });
    
    // Cluster 3: Add third cluster  
    await devPanel.click();
    await clusteredButton.click();
    await page.waitForTimeout(1000);
    
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    await page.screenshot({
      path: 'test-results/cluster-3-analysis.png',
      fullPage: true
    });
    
    // Verify we have content in all screenshots
    const debugPanel = page.locator('text=Enhanced Deterministic Layout v5');
    await expect(debugPanel).toBeVisible();
    
    // Log final metrics for verification
    const eventCount = await page.locator('text=/\\d+ events/').first().textContent();
    const slotUtilization = await page.locator('text=/Slot utilization: \\d+\\.\\d+%/').textContent();
    const cardCount = await page.locator('text=/\\d+ positioned cards/').textContent();
    
    console.log('Final metrics after 3 clusters:');
    console.log(`- ${eventCount}`);
    console.log(`- ${cardCount}`);
    console.log(`- ${slotUtilization}`);
  });
});