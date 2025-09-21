/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';

async function openDevPanel(page: any) {
  
  await page.getByRole('button', { name: 'Developer Panel' }).click();
}

test.describe('Navigation Rail Overlap Tests', () => {
  test('Cards should not be behind navigation rail', async ({ page }) => {
    await page.goto('/');
    
    // Load a timeline with events
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: 'JFK 1961-63' }).click();
    await page.waitForTimeout(1000);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/navigation-rail-overlap-test.png' });
    
    // Get navigation rail bounds (left sidebar)
    let navRailBounds = null;
    
    // Try to find navigation rail by different selectors
    const possibleNavSelectors = [
      '[data-testid="navigation-rail"]',
      '[data-testid="sidebar"]', 
      '[data-testid="nav-rail"]',
      'nav',
      'aside',
      '.sidebar',
      '.nav-rail',
      '.navigation',
      '.left-panel'
    ];
    
    for (const selector of possibleNavSelectors) {
      const element = page.locator(selector).first();
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        navRailBounds = await element.boundingBox();
        if (navRailBounds) {
          console.log(`Found navigation element with selector: ${selector}`);
          console.log(`Navigation rail bounds: x=${navRailBounds.x}, width=${navRailBounds.width}, right=${navRailBounds.x + navRailBounds.width}`);
          break;
        }
      }
    }
    
    // If no specific nav rail found, assume it's on the left side with standard width
    if (!navRailBounds) {
      console.log('No navigation rail found, assuming left margin area');
      navRailBounds = { x: 0, y: 0, width: 60, height: 800 }; // Typical nav rail width
    }
    
    const navRailRightEdge = navRailBounds.x + navRailBounds.width;
    console.log(`Navigation rail right edge: ${navRailRightEdge}px`);
    
    // Get all event cards
    const cards = await page.locator('[data-testid="event-card"]').all();
    console.log(`Found ${cards.length} event cards`);
    
    let cardsOverlapping = 0;
    let minCardLeftEdge = Infinity;
    
    // Check each card's position
    for (let i = 0; i < cards.length; i++) {
      const cardBounds = await cards[i].boundingBox();
      if (cardBounds) {
        const cardLeftEdge = cardBounds.x;
        
        minCardLeftEdge = Math.min(minCardLeftEdge, cardLeftEdge);
        
        // Check if card is behind navigation rail
        if (cardLeftEdge < navRailRightEdge) {
          const overlapWidth = navRailRightEdge - cardLeftEdge;
          console.log(`❌ Card ${i} overlapping navigation rail:`);
          console.log(`   Card left edge: ${cardLeftEdge}px`);
          console.log(`   Navigation rail right edge: ${navRailRightEdge}px`);
          console.log(`   Overlap width: ${overlapWidth}px`);
          cardsOverlapping++;
        } else {
          console.log(`✅ Card ${i} clear of navigation rail (left edge: ${cardLeftEdge}px)`);
        }
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Navigation rail width: ${navRailBounds.width}px`);
    console.log(`Leftmost card position: ${minCardLeftEdge}px`);
    console.log(`Cards overlapping navigation rail: ${cardsOverlapping}/${cards.length}`);
    
    // Test should fail if any cards are behind navigation rail
    expect(cardsOverlapping).toBe(0);
    
    // Also ensure cards have reasonable left margin
    expect(minCardLeftEdge).toBeGreaterThan(navRailRightEdge + 10); // At least 10px clearance
  });
  
  test('Cards should have adequate left margin from viewport edge', async ({ page }) => {
    await page.goto('/');
    
    // Load RFK timeline (simpler case)
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: 'RFK 1968' }).click();
    await page.waitForTimeout(1000);
    
    // Get all event cards
    const cards = await page.locator('[data-testid="event-card"]').all();
    console.log(`Found ${cards.length} event cards`);
    
    let minLeftMargin = Infinity;
    
    for (const card of cards) {
      const cardBounds = await card.boundingBox();
      if (cardBounds) {
        minLeftMargin = Math.min(minLeftMargin, cardBounds.x);
      }
    }
    
    console.log(`Minimum left margin: ${minLeftMargin}px`);
    
    // Cards should have at least 40px left margin (typical layout margin)
    expect(minLeftMargin).toBeGreaterThan(40);
  });
});