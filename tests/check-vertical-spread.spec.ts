import { test, expect } from '@playwright/test';

test.describe('Check Vertical Distribution', () => {
  test('verify cards spread across full viewport', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Enable dev mode and open panel
    await page.click('button[aria-label="Toggle developer options"]');
    await page.waitForTimeout(200);
    await page.click('button[aria-label="Developer Panel"]', { force: true });
    await page.waitForTimeout(500);
    
    // Add more events to see better distribution
    await page.click('button:has-text("Seed 10")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("+8")'); // Add 8 more
    await page.waitForTimeout(500);
    
    // Close dev panel
    await page.click('button[aria-label="Developer Panel"]');
    await page.waitForTimeout(500);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/vertical-distribution-check.png',
      fullPage: false 
    });
    
    // Analyze card positions
    const cards = await page.locator('.bg-white.rounded-lg.shadow-md').all();
    console.log(`Total cards: ${cards.length}`);
    
    // Get individual card positions
    const positions = [];
    for (let i = 0; i < Math.min(10, cards.length); i++) {
      const box = await cards[i].boundingBox();
      if (box) {
        positions.push({ index: i, y: box.y, height: box.height });
      }
    }
    
    // Sort by Y position
    positions.sort((a, b) => a.y - b.y);
    
    // Print distribution
    console.log('\nCard positions (top 10):');
    positions.forEach(p => {
      console.log(`  Card ${p.index}: Y=${p.y}, Height=${p.height}`);
    });
    
    // Calculate gaps between cards
    console.log('\nGaps between cards:');
    for (let i = 1; i < positions.length; i++) {
      const gap = positions[i].y - (positions[i-1].y + positions[i-1].height);
      console.log(`  Between card ${i-1} and ${i}: ${gap}px`);
    }
    
    // Check event count
    const eventText = await page.locator('p:has-text("events")').first().textContent();
    console.log(`\nEvent count: ${eventText}`);
  });
});