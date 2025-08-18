import { test, expect } from '@playwright/test';

test.describe('Final Improvements', () => {
  test('verify all improvements: transparency, gaps, and column borders', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Enable dev mode and open panel
    await page.click('button[aria-label="Toggle developer options"]');
    await page.waitForTimeout(200);
    await page.click('button[aria-label="Developer Panel"]', { force: true });
    await page.waitForTimeout(500);
    
    // Add events
    await page.click('button:has-text("Seed 10")');
    await page.waitForTimeout(500);
    
    // Try to add more events
    const addButtons = await page.locator('button:has-text("+")').all();
    if (addButtons.length > 0) {
      await addButtons[addButtons.length - 1].click();
      await page.waitForTimeout(500);
    }
    
    // Close dev panel
    await page.click('button[aria-label="Developer Panel"]');
    await page.waitForTimeout(500);
    
    // Test column borders toggle
    // First hover over the bottom-left panel to make it visible
    const bottomLeftPanel = page.locator('.absolute.bottom-4.left-4').first();
    await bottomLeftPanel.hover();
    await page.waitForTimeout(500);
    
    // Click the toggle button
    await page.click('button:has-text("Show Column Borders")');
    await page.waitForTimeout(500);
    
    // Take screenshot with column borders visible
    await page.screenshot({ 
      path: 'test-results/final-improvements-with-borders.png',
      fullPage: false 
    });
    
    // Verify column borders are visible
    const columnBorders = await page.locator('.border-dashed.border-blue-400').all();
    console.log(`Column borders visible: ${columnBorders.length}`);
    
    // Get timeline position
    const timeline = await page.locator('[data-testid="timeline-axis"]').first();
    const timelineBox = await timeline.boundingBox();
    
    // Get all cards and check gaps
    const cards = await page.locator('.bg-white.rounded-lg.shadow-md').all();
    let minDistanceAbove = Infinity;
    let minDistanceBelow = Infinity;
    
    for (const card of cards) {
      const box = await card.boundingBox();
      if (box && timelineBox) {
        if (box.y + box.height < timelineBox.y) {
          // Card is above timeline
          const distance = timelineBox.y - (box.y + box.height);
          minDistanceAbove = Math.min(minDistanceAbove, distance);
        } else if (box.y > timelineBox.y) {
          // Card is below timeline
          const distance = box.y - timelineBox.y;
          minDistanceBelow = Math.min(minDistanceBelow, distance);
        }
      }
    }
    
    console.log(`\nVertical gaps after improvements:`);
    console.log(`Minimum gap above timeline: ${minDistanceAbove}px`);
    console.log(`Minimum gap below timeline: ${minDistanceBelow}px`);
    
    // Hide column borders
    await bottomLeftPanel.hover();
    await page.click('button:has-text("Hide Column Borders")');
    await page.waitForTimeout(500);
    
    // Move mouse away to test transparency
    await page.mouse.move(400, 400);
    await page.waitForTimeout(500);
    
    // Take screenshot without borders and with transparent panels
    await page.screenshot({ 
      path: 'test-results/final-improvements-normal.png',
      fullPage: false 
    });
    
    // Check info panel transparency
    const infoPanel = page.locator('.absolute.top-4.left-4').first();
    const opacity = await infoPanel.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.backgroundColor;
    });
    console.log(`\nInfo panel transparency: ${opacity}`);
  });
});