import { test, expect } from '@playwright/test';

test.describe('Check Layout Fixes', () => {
  test('verify improved layout with better card distribution', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Enable dev mode and open panel
    await page.click('button[aria-label="Toggle developer options"]');
    await page.waitForTimeout(200);
    await page.click('button[aria-label="Developer Panel"]', { force: true });
    await page.waitForTimeout(500);
    
    // Add many events to test the layout
    await page.click('button:has-text("Seed 10")');
    await page.waitForTimeout(500);
    // Try to add more events if buttons exist
    const addButtons = await page.locator('button:has-text("+")').all();
    if (addButtons.length > 0) {
      await addButtons[addButtons.length - 1].click(); // Click the last + button
      await page.waitForTimeout(500);
    }
    
    // Close dev panel
    await page.click('button[aria-label="Developer Panel"]');
    await page.waitForTimeout(500);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/layout-fixes.png',
      fullPage: false 
    });
    
    // Analyze card distribution
    const cards = await page.locator('.bg-white.rounded-lg.shadow-md').all();
    console.log(`Total cards: ${cards.length}`);
    
    // Count card types
    let fullCount = 0;
    let compactCount = 0;
    let titleOnlyCount = 0;
    let multiEventCount = 0;
    
    for (const card of cards) {
      const box = await card.boundingBox();
      if (box) {
        if (box.height > 90) {
          fullCount++;
        } else if (box.height > 60) {
          compactCount++;
        } else if (box.height > 30) {
          titleOnlyCount++;
        } else {
          titleOnlyCount++; // Small cards are title-only
        }
      }
    }
    
    console.log('\nCard distribution:');
    console.log(`  Full cards: ${fullCount}`);
    console.log(`  Compact cards: ${compactCount}`);
    console.log(`  Title-only cards: ${titleOnlyCount}`);
    
    // Check for overlaps
    const positions = [];
    for (let i = 0; i < Math.min(20, cards.length); i++) {
      const box = await cards[i].boundingBox();
      if (box) {
        positions.push({ index: i, x: box.x, y: box.y, width: box.width, height: box.height });
      }
    }
    
    let overlaps = 0;
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const a = positions[i];
        const b = positions[j];
        // Check if rectangles overlap
        if (!(a.x + a.width < b.x || b.x + b.width < a.x || 
              a.y + a.height < b.y || b.y + b.height < a.y)) {
          overlaps++;
          console.log(`  Overlap detected between card ${a.index} and ${b.index}`);
        }
      }
    }
    
    console.log(`\nTotal overlaps detected: ${overlaps}`);
  });
});