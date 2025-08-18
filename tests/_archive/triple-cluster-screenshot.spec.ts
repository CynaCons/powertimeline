import { test, expect } from '@playwright/test';

test.describe('Triple Cluster Screenshot', () => {
  test('create triple-cluster layout for analysis', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Enable dev mode and open panel
    await page.click('button[aria-label="Toggle developer options"]');
    await page.waitForTimeout(200);
    await page.click('button[aria-label="Developer Panel"]', { force: true });
    await page.waitForTimeout(500);
    
    // Add three clustered seeds
    console.log('Adding first clustered seed...');
    await page.click('button:has-text("Clustered")');
    await page.waitForTimeout(1000);
    
    console.log('Adding second clustered seed...');
    await page.click('button:has-text("Clustered")');
    await page.waitForTimeout(1000);
    
    console.log('Adding third clustered seed...');
    await page.click('button:has-text("Clustered")');
    await page.waitForTimeout(1000);
    
    // Close dev panel for clean screenshot
    await page.click('button[aria-label="Developer Panel"]');
    await page.waitForTimeout(500);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/triple-cluster-analysis.png',
      fullPage: false 
    });
    
    // Get basic metrics
    const cards = await page.locator('.bg-white.rounded-lg.shadow-md').all();
    const anchors = await page.locator('[data-testid^="anchor-"]').all();
    
    // Get event count from info panel
    const eventText = await page.locator('p:has-text("events")').first().textContent();
    const eventCount = eventText?.match(/(\d+)\s+events/)?.[1] || '0';
    
    // Get card type counts
    const fullCards = await page.locator('div.bg-white.rounded-lg').filter({ 
      has: page.locator('div.line-clamp-2') 
    }).count();
    
    const compactCards = await page.locator('div.bg-white.rounded-lg').filter({ 
      has: page.locator('div.text-sm:not(.line-clamp-2)') 
    }).count();
    
    console.log('\n=== TRIPLE CLUSTER METRICS ===');
    console.log(`Total events: ${eventCount}`);
    console.log(`Total cards: ${cards.length}`);
    console.log(`Column anchors: ${anchors.length}`);
    console.log(`Average events per column: ${(parseInt(eventCount) / anchors.length).toFixed(1)}`);
    
    // Hover over info panels to make them visible for analysis
    console.log('\nHovering over info panels for visibility...');
    
    // Top-left panel
    const topLeft = page.locator('.absolute.top-4.left-4').first();
    await topLeft.hover();
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: 'test-results/triple-cluster-with-info.png',
      fullPage: false 
    });
    
    // Move mouse away
    await page.mouse.move(400, 400);
    await page.waitForTimeout(500);
    
    // Enable column borders
    const bottomLeft = page.locator('.absolute.bottom-4.left-4').first();
    await bottomLeft.hover();
    await page.waitForTimeout(500);
    await page.click('button:has-text("Show Column Borders")');
    await page.waitForTimeout(500);
    
    // Take screenshot with column borders
    await page.screenshot({ 
      path: 'test-results/triple-cluster-with-borders.png',
      fullPage: false 
    });
    
    console.log('\nScreenshots saved:');
    console.log('  • triple-cluster-analysis.png - Clean view');
    console.log('  • triple-cluster-with-info.png - With info panel visible');
    console.log('  • triple-cluster-with-borders.png - With column borders');
  });
});