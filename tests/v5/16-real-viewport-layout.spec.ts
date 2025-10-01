/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';

async function openDevPanel(page: any) {
  
  await page.getByRole('button', { name: 'Developer Panel' }).click();
}

test.describe('Real Viewport Layout Tests', () => {
  test('Cards should be properly positioned in realistic browser viewport', async ({ page }) => {
    // Set realistic browser viewport size (similar to user's screenshot)
    await page.setViewportSize({ width: 1400, height: 800 });
    await page.goto('/');
    
    // Add some random events (similar to user's scenario)
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: 'Random (10)' }).click(); // Creates 10 random events
    await page.keyboard.press('Escape'); // Close dev panel
    await page.waitForTimeout(1000);
    
    // Take screenshot for analysis
    await page.screenshot({ path: 'test-results/real-viewport-layout-test.png' });
    
    // Get viewport dimensions
    const viewportSize = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight
    }));
    console.log(`Viewport size: ${viewportSize.width}x${viewportSize.height}`);
    
    // Get navigation rail bounds
    const navRail = page.locator('aside').first();
    const navRailBounds = await navRail.boundingBox();
    console.log(`Navigation rail bounds: x=${navRailBounds?.x}, width=${navRailBounds?.width}`);
    
    // Get all event cards
    const cards = await page.locator('[data-testid="event-card"]').all();
    console.log(`Found ${cards.length} event cards`);
    
    let cardsOverlappingNav = 0;
    let cardsOverflowingRight = 0;
    let minLeftEdge = Infinity;
    let maxRightEdge = 0;
    
    // Check each card's position
    for (let i = 0; i < cards.length; i++) {
      const cardBounds = await cards[i].boundingBox();
      if (cardBounds) {
        const cardLeftEdge = cardBounds.x;
        const cardRightEdge = cardBounds.x + cardBounds.width;
        
        minLeftEdge = Math.min(minLeftEdge, cardLeftEdge);
        maxRightEdge = Math.max(maxRightEdge, cardRightEdge);
        
        // Check navigation rail overlap
        const navRailRightEdge = (navRailBounds?.x || 0) + (navRailBounds?.width || 56);
        if (cardLeftEdge < navRailRightEdge) {
          console.log(`❌ Card ${i} overlapping navigation rail: left=${cardLeftEdge.toFixed(1)}px, nav_right=${navRailRightEdge}px`);
          cardsOverlappingNav++;
        }
        
        // Check right edge overflow
        if (cardRightEdge > viewportSize.width) {
          console.log(`❌ Card ${i} overflowing right edge: right=${cardRightEdge.toFixed(1)}px, viewport=${viewportSize.width}px`);
          cardsOverflowingRight++;
        }
      }
    }
    
    console.log(`\n=== REAL VIEWPORT LAYOUT SUMMARY ===`);
    console.log(`Viewport: ${viewportSize.width}x${viewportSize.height}`);
    console.log(`Navigation rail width: ${navRailBounds?.width || 56}px`);
    console.log(`Cards range: ${minLeftEdge.toFixed(1)}px to ${maxRightEdge.toFixed(1)}px`);
    console.log(`Cards overlapping navigation rail: ${cardsOverlappingNav}/${cards.length}`);
    console.log(`Cards overflowing right edge: ${cardsOverflowingRight}/${cards.length}`);
    
    // Both navigation and right edge issues should be fixed
    expect(cardsOverlappingNav).toBe(0);
    expect(cardsOverflowingRight).toBe(0);
    
    // Cards should have proper margins
    const navRailRightEdge = (navRailBounds?.x || 0) + (navRailBounds?.width || 56);
    expect(minLeftEdge).toBeGreaterThan(navRailRightEdge + 30); // At least 30px clearance
    expect(maxRightEdge).toBeLessThan(viewportSize.width - 20); // At least 20px right margin
  });
  
  test('Layout should work in narrow viewport', async ({ page }) => {
    // Test with narrow viewport (like mobile or split screen)
    await page.setViewportSize({ width: 1000, height: 600 });
    await page.goto('/');
    
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: 'JFK 1961-63' }).click();
    await page.waitForTimeout(1000);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/narrow-viewport-layout-test.png' });
    
    // Get cards
    const cards = await page.locator('[data-testid="event-card"]').all();
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    
    let navOverlaps = 0;
    let rightOverflows = 0;
    
    for (const card of cards) {
      const bounds = await card.boundingBox();
      if (bounds) {
        if (bounds.x < 96) navOverlaps++; // Should be > 96px (nav rail + margin)
        if (bounds.x + bounds.width > viewportWidth - 20) rightOverflows++; // Should have 20px right margin
      }
    }
    
    console.log(`Narrow viewport (${viewportWidth}px): nav_overlaps=${navOverlaps}, right_overflows=${rightOverflows}`);
    
    expect(navOverlaps).toBe(0);
    expect(rightOverflows).toBe(0);
  });
});
