import { test, expect } from '@playwright/test';

test.describe('Basic Timeline Test', () => {
  test('seed random events and verify layout', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for initial load
    await page.waitForTimeout(1000);
    
    // Enable dev mode
    await page.click('button[aria-label="Toggle developer options"]');
    await page.waitForTimeout(200);
    
    // Open dev panel
    await page.click('button[aria-label="Developer Panel"]', { force: true });
    await page.waitForTimeout(500);
    
    // Try the Random seed button instead
    const randomButton = page.locator('button:has-text("Random")').first();
    await randomButton.click({ force: true });
    
    // Wait for events to load
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/random-events.png',
      fullPage: false 
    });
    
    // Close dev panel to see timeline better
    await page.click('button[aria-label="Developer Panel"]', { force: true });
    await page.waitForTimeout(500);
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'test-results/random-timeline-final.png',
      fullPage: false 
    });
    
    // Check for cards
    const cards = await page.locator('.bg-white.rounded-lg.shadow-md').count();
    console.log(`Random timeline has ${cards} cards`);
    
    // Get event count
    const eventText = await page.locator('p:has-text("events")').first().textContent();
    console.log(`Event count: ${eventText}`);
    
    // Measure vertical space usage
    const timeline = await page.locator('[data-testid="timeline-axis"]').boundingBox();
    console.log(`Timeline position: ${JSON.stringify(timeline)}`);
    
    // Check if cards are using full vertical space
    const allCards = await page.locator('.bg-white.rounded-lg.shadow-md').all();
    if (allCards.length > 0) {
      const firstCard = await allCards[0].boundingBox();
      const lastCard = await allCards[allCards.length - 1].boundingBox();
      console.log(`First card Y: ${firstCard?.y}, Last card Y: ${lastCard?.y}`);
      console.log(`Vertical span: ${(lastCard?.y || 0) - (firstCard?.y || 0)}px`);
    }
  });
});