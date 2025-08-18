import { test, expect } from '@playwright/test';

test.describe('Analyze Layout Issues', () => {
  test('seed events and analyze vertical space usage', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Enable dev mode and open panel
    await page.click('button[aria-label="Toggle developer options"]');
    await page.waitForTimeout(200);
    await page.click('button[aria-label="Developer Panel"]', { force: true });
    await page.waitForTimeout(500);
    
    // Click "Seed 10" button to add 10 random events
    await page.click('button:has-text("Seed 10")');
    await page.waitForTimeout(1000);
    
    // Close dev panel to see full timeline
    await page.click('button[aria-label="Developer Panel"]');
    await page.waitForTimeout(500);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/seeded-10-events.png',
      fullPage: false 
    });
    
    // Get viewport dimensions
    const viewport = page.viewportSize();
    console.log(`Viewport: ${viewport?.width}x${viewport?.height}`);
    
    // Get timeline position
    const timeline = await page.locator('[data-testid="timeline-axis"]').boundingBox();
    console.log(`Timeline Y position: ${timeline?.y}`);
    
    // Get all cards and analyze their positions
    const cards = await page.locator('.bg-white.rounded-lg.shadow-md').all();
    console.log(`Found ${cards.length} cards`);
    
    if (cards.length > 0) {
      // Get positions of all cards
      let minY = Infinity;
      let maxY = -Infinity;
      
      for (const card of cards) {
        const box = await card.boundingBox();
        if (box) {
          minY = Math.min(minY, box.y);
          maxY = Math.max(maxY, box.y + box.height);
        }
      }
      
      console.log(`Cards span from Y=${minY} to Y=${maxY}`);
      console.log(`Vertical space used: ${maxY - minY}px`);
      console.log(`Distance from top: ${minY}px`);
      console.log(`Distance from bottom: ${(viewport?.height || 0) - maxY}px`);
      
      // Check if using full vertical space
      const topMargin = minY;
      const bottomMargin = (viewport?.height || 0) - maxY;
      
      if (topMargin > 100) {
        console.log(`WARNING: Large top margin of ${topMargin}px - not using full vertical space!`);
      }
      if (bottomMargin > 100) {
        console.log(`WARNING: Large bottom margin of ${bottomMargin}px - not using full vertical space!`);
      }
    }
    
    // Check event count in info panel
    const eventText = await page.locator('p:has-text("events")').first().textContent();
    console.log(`Event count shown: ${eventText}`);
    
    // Check info panel transparency
    const infoPanel = page.locator('text=Enhanced Deterministic Layout v5').locator('..');
    const bgClass = await infoPanel.getAttribute('class');
    console.log(`Info panel classes: ${bgClass}`);
    
    // Check if bg-opacity is applied
    if (bgClass?.includes('bg-opacity')) {
      console.log('✓ Info panel has transparency');
    } else {
      console.log('✗ Info panel missing transparency');
    }
  });
});