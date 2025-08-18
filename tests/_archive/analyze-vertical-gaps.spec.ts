import { test, expect } from '@playwright/test';

test.describe('Analyze Vertical Gaps', () => {
  test('measure gaps between cards and timeline', async ({ page }) => {
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
    
    // Close dev panel
    await page.click('button[aria-label="Developer Panel"]');
    await page.waitForTimeout(500);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/vertical-gaps-analysis.png',
      fullPage: false 
    });
    
    // Get timeline position
    const timeline = await page.locator('[data-testid="timeline-axis"]').first();
    const timelineBox = await timeline.boundingBox();
    console.log(`Timeline Y position: ${timelineBox?.y}`);
    
    // Get all cards
    const cards = await page.locator('.bg-white.rounded-lg.shadow-md').all();
    
    // Find cards above and below timeline
    const aboveCards = [];
    const belowCards = [];
    
    for (const card of cards) {
      const box = await card.boundingBox();
      if (box) {
        if (box.y + box.height < (timelineBox?.y || 0)) {
          // Card is above timeline
          aboveCards.push(box);
        } else if (box.y > (timelineBox?.y || 0)) {
          // Card is below timeline
          belowCards.push(box);
        }
      }
    }
    
    // Find the closest card above timeline
    if (aboveCards.length > 0 && timelineBox) {
      const closestAbove = aboveCards.reduce((closest, card) => {
        const currentBottom = card.y + card.height;
        const closestBottom = closest.y + closest.height;
        return currentBottom > closestBottom ? card : closest;
      });
      
      const gapAbove = timelineBox.y - (closestAbove.y + closestAbove.height);
      console.log(`\nGap above timeline: ${gapAbove}px`);
      console.log(`Closest card above ends at Y: ${closestAbove.y + closestAbove.height}`);
    }
    
    // Find the closest card below timeline
    if (belowCards.length > 0 && timelineBox) {
      const closestBelow = belowCards.reduce((closest, card) => {
        return card.y < closest.y ? card : closest;
      });
      
      const gapBelow = closestBelow.y - timelineBox.y;
      console.log(`\nGap below timeline: ${gapBelow}px`);
      console.log(`Closest card below starts at Y: ${closestBelow.y}`);
    }
    
    console.log(`\nTotal cards above timeline: ${aboveCards.length}`);
    console.log(`Total cards below timeline: ${belowCards.length}`);
    
    // Get viewport height for context
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    console.log(`\nViewport height: ${viewportHeight}px`);
  });
});