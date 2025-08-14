import { test, expect } from '@playwright/test';

test.describe('Comprehensive Seeding Visual Tests', () => {
  
  test('should display empty state', async ({ page }) => {
    await page.goto('/');
    
    // Clear any existing data
    await page.evaluate(() => {
      localStorage.removeItem('chronochart-events');
    });
    await page.reload();
    
    // Take screenshot of empty state
    await expect(page).toHaveScreenshot('empty-state.png');
    
    // Verify no cards are displayed
    const cards = page.locator('[data-testid="event-card"]');
    await expect(cards).toHaveCount(0);
  });

  test('should display random seed (5 events)', async ({ page }) => {
    await page.goto('/');
    
    // Enable dev panel and seed 5 random events
    await page.locator('button[aria-label="Toggle developer options"]').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    await page.locator('button:has-text("Seed 5")').click();
    await page.locator('button[aria-label="Developer Panel"]').click(); // Close dev panel
    
    // Wait for cards to appear
    const cards = page.locator('[data-testid="event-card"]');
    await expect(cards).toHaveCount(5);
    
    // Take screenshot
    await expect(page).toHaveScreenshot('random-5-events.png');
    
    // Verify collision avoidance is working
    const cardRects = await cards.evaluateAll(elements => 
      elements.map(el => {
        const rect = el.getBoundingClientRect();
        return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
      })
    );
    
    // Check no significant overlaps
    for (let i = 0; i < cardRects.length; i++) {
      for (let j = i + 1; j < cardRects.length; j++) {
        const rect1 = cardRects[i];
        const rect2 = cardRects[j];
        const horizontalOverlap = rect1.right > rect2.left && rect2.right > rect1.left;
        const verticalOverlap = rect1.bottom > rect2.top && rect2.bottom > rect1.top;
        
        if (horizontalOverlap && verticalOverlap) {
          const overlapWidth = Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left);
          const overlapHeight = Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top);
          expect(overlapWidth).toBeLessThan(10);
          expect(overlapHeight).toBeLessThan(10);
        }
      }
    }
  });

  test('should display random seed (10 events)', async ({ page }) => {
    await page.goto('/');
    
    // Enable dev panel and seed 10 random events
    await page.locator('button[aria-label="Toggle developer options"]').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    await page.locator('button:has-text("Seed 10")').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    
    // Wait for cards
    const cards = page.locator('[data-testid="event-card"]');
    await expect(cards).toHaveCount(10);
    
    // Take screenshot
    await expect(page).toHaveScreenshot('random-10-events.png');
  });

  test('should display clustered events', async ({ page }) => {
    await page.goto('/');
    
    // Enable dev panel and seed clustered events
    await page.locator('button[aria-label="Toggle developer options"]').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    await page.locator('button:has-text("Clustered")').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    
    // Wait for cards
    const cards = page.locator('[data-testid="event-card"]');
    await expect(cards).toHaveCount(30); // Clustered creates 30 events
    
    // Take screenshot
    await expect(page).toHaveScreenshot('clustered-events.png');
    
    // Verify distribution between above/below timeline
    const timelineY = await page.locator('.absolute.inset-0.flex.items-center').evaluate(el => {
      return el.getBoundingClientRect().top + el.getBoundingClientRect().height / 2;
    });
    
    const cardPositions = await cards.evaluateAll((elements, timelineY) => 
      elements.map(el => {
        const rect = el.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        return cardCenter < timelineY ? 'above' : 'below';
      }), timelineY
    );
    
    const aboveCount = cardPositions.filter(pos => pos === 'above').length;
    const belowCount = cardPositions.filter(pos => pos === 'below').length;
    
    // Both sides should have events
    expect(aboveCount).toBeGreaterThan(0);
    expect(belowCount).toBeGreaterThan(0);
  });

  test('should display long-range events', async ({ page }) => {
    await page.goto('/');
    
    // Enable dev panel and seed long-range events
    await page.locator('button[aria-label="Toggle developer options"]').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    await page.locator('button:has-text("Long-range")').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    
    // Wait for cards
    const cards = page.locator('[data-testid="event-card"]');
    await expect(cards).toHaveCount(60); // Long-range creates 60 events
    
    // Take screenshot
    await expect(page).toHaveScreenshot('long-range-events.png');
  });

  test('should display RFK 1968 timeline', async ({ page }) => {
    await page.goto('/');
    
    // Enable dev panel and load RFK timeline
    await page.locator('button[aria-label="Toggle developer options"]').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    await page.locator('button:has-text("RFK 1968")').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    
    // Wait for cards
    const cards = page.locator('[data-testid="event-card"]');
    await expect(cards).toHaveCount(8); // Grid system shows 8 events in available slots
    
    // Take screenshot
    await expect(page).toHaveScreenshot('rfk-timeline.png');
    
    // Verify historical content
    const firstCard = cards.first();
    await expect(firstCard).toContainText('Announces Candidacy');
  });

  test('should display JFK timeline', async ({ page }) => {
    await page.goto('/');
    
    // Enable dev panel and load JFK timeline
    await page.locator('button[aria-label="Toggle developer options"]').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    await page.locator('button:has-text("JFK 1961-63")').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    
    // Wait for cards
    const cards = page.locator('[data-testid="event-card"]');
    await expect(cards).toHaveCount(16); // JFK timeline has 16 events
    
    // Take screenshot
    await expect(page).toHaveScreenshot('jfk-timeline.png');
    
    // Verify historical content
    await expect(page.locator('[data-testid="event-card"]')).toContainText(['Inauguration', 'Assassination']);
  });

  test('should display Napoleon Bonaparte timeline', async ({ page }) => {
    await page.goto('/');
    
    // Enable dev panel and load Napoleon timeline
    await page.locator('button[aria-label="Toggle developer options"]').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    await page.locator('button:has-text("Napoleon 1769-1821")').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    
    // Wait for cards
    const cards = page.locator('[data-testid="event-card"]');
    // Grid-slot system now limits cards to fit available grid slots (typically 20-30 for Napoleon timeline)
    await expect(cards).toHaveCount(20, { timeout: 10000 }); // Grid-limited display
    
    // Take screenshot
    await expect(page).toHaveScreenshot('napoleon-timeline.png');
    
    // Verify Napoleon events are displayed (grid system limits to chronological range 1746-1792)
    const firstCard = cards.first();
    await expect(firstCard).toContainText('1746'); // Should show earliest events first
    
    // Test collision avoidance with many events
    const cardRects = await cards.evaluateAll(elements => 
      elements.map(el => {
        const rect = el.getBoundingClientRect();
        return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
      })
    );
    
    // Count significant overlaps
    let overlapCount = 0;
    for (let i = 0; i < cardRects.length; i++) {
      for (let j = i + 1; j < cardRects.length; j++) {
        const rect1 = cardRects[i];
        const rect2 = cardRects[j];
        const horizontalOverlap = rect1.right > rect2.left && rect2.right > rect1.left;
        const verticalOverlap = rect1.bottom > rect2.top && rect2.bottom > rect1.top;
        
        if (horizontalOverlap && verticalOverlap) {
          const overlapWidth = Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left);
          const overlapHeight = Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top);
          
          if (overlapWidth > 50 || overlapHeight > 20) {
            overlapCount++;
          }
        }
      }
    }
    
    // Grid-slot system should prevent overlaps entirely
    // Each card is assigned to a unique grid slot, so no overlaps should occur
    expect(overlapCount).toBe(0);
  });

  test('should utilize full horizontal space for timeline distribution', async ({ page }) => {
    await page.goto('/');
    
    // Load Napoleon timeline for maximum horizontal spread (75+ year span)
    await page.locator('button[aria-label="Toggle developer options"]').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    await page.locator('button:has-text("Napoleon 1769-1821")').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    
    // Wait for cards to load
    const cards = page.locator('[data-testid="event-card"]');
    await expect(cards).toHaveCount(63, { timeout: 10000 });
    
    // Get viewport width and timeline area
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    const timelineArea = await page.locator('.absolute.inset-0.ml-14').boundingBox();
    const availableWidth = timelineArea ? timelineArea.width : viewportWidth - 56; // Account for 56px sidebar
    
    // Get all card positions
    const cardPositions = await cards.evaluateAll(elements => 
      elements.map(el => {
        const rect = el.getBoundingClientRect();
        return {
          left: rect.left,
          centerX: rect.left + rect.width / 2,
          right: rect.right
        };
      })
    );
    
    // Find leftmost and rightmost card positions
    const leftmostX = Math.min(...cardPositions.map(pos => pos.left));
    const rightmostX = Math.max(...cardPositions.map(pos => pos.right));
    const actualSpread = rightmostX - leftmostX;
    
    // Cards should use at least 80% of available horizontal space
    // (allowing some margin for card width and positioning)
    const expectedMinSpread = availableWidth * 0.8;
    
    console.log(`Viewport: ${viewportWidth}px, Available: ${availableWidth}px, Actual spread: ${actualSpread}px, Expected min: ${expectedMinSpread}px`);
    console.log(`Leftmost: ${leftmostX}px, Rightmost: ${rightmostX}px`);
    
    expect(actualSpread).toBeGreaterThan(expectedMinSpread);
    
    // Also verify we're using the full chronological range
    // Early events (1746-1780s) should be on the left
    // Late events (1810s-1832) should be on the right
    const earlyCards = await page.locator('[data-testid="event-card"]:has-text("1746"), [data-testid="event-card"]:has-text("1750"), [data-testid="event-card"]:has-text("1764"), [data-testid="event-card"]:has-text("1768")').evaluateAll(elements => 
      elements.map(el => el.getBoundingClientRect().left)
    );
    const lateCards = await page.locator('[data-testid="event-card"]:has-text("1821"), [data-testid="event-card"]:has-text("1815"), [data-testid="event-card"]:has-text("1832")').evaluateAll(elements => 
      elements.map(el => el.getBoundingClientRect().left)
    );
    
    if (earlyCards.length > 0 && lateCards.length > 0) {
      const avgEarlyX = earlyCards.reduce((sum, x) => sum + x, 0) / earlyCards.length;
      const avgLateX = lateCards.reduce((sum, x) => sum + x, 0) / lateCards.length;
      
      // Late events should be positioned to the right of early events
      expect(avgLateX).toBeGreaterThan(avgEarlyX);
      console.log(`Chronological test - Early avg: ${avgEarlyX}px, Late avg: ${avgLateX}px`);
    }
    
    // Take screenshot for visual verification
    await expect(page).toHaveScreenshot('horizontal-distribution.png');
  });

  test('should fit within viewport without requiring scrolling', async ({ page }) => {
    await page.goto('/');
    
    // Load Napoleon timeline (densest dataset)
    await page.locator('button[aria-label="Toggle developer options"]').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    await page.locator('button:has-text("Napoleon 1769-1821")').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    
    // Wait for cards to load
    const cards = page.locator('[data-testid="event-card"]');
    await expect(cards).toHaveCount(63, { timeout: 10000 });
    
    // Get viewport and document dimensions
    const dimensions = await page.evaluate(() => ({
      viewportHeight: window.innerHeight,
      documentHeight: document.documentElement.scrollHeight,
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth
    }));
    
    console.log('Viewport:', dimensions.viewportHeight, 'x', dimensions.viewportWidth);
    console.log('Document:', dimensions.documentHeight, 'x', dimensions.documentWidth);
    
    // Document should not exceed viewport (no scrolling needed)
    expect(dimensions.documentHeight).toBeLessThanOrEqual(dimensions.viewportHeight + 5); // Allow 5px tolerance
    expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth + 5);
    
    // Verify no cards extend beyond visible area
    const cardBounds = await cards.evaluateAll(elements => 
      elements.map(el => {
        const rect = el.getBoundingClientRect();
        return {
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right
        };
      })
    );
    
    const viewportHeight = dimensions.viewportHeight;
    const viewportWidth = dimensions.viewportWidth;
    
    // Check all cards are within viewport bounds
    for (const bounds of cardBounds) {
      expect(bounds.top).toBeGreaterThanOrEqual(-50); // Allow small negative for partial visibility
      expect(bounds.bottom).toBeLessThanOrEqual(viewportHeight + 50);
      expect(bounds.left).toBeGreaterThanOrEqual(-50);
      expect(bounds.right).toBeLessThanOrEqual(viewportWidth + 50);
    }
    
    // Take screenshot for visual verification
    await expect(page).toHaveScreenshot('viewport-contained.png');
  });

  test('should properly display connectors and anchors', async ({ page }) => {
    await page.goto('/');
    
    // Load a moderate dataset
    await page.locator('button[aria-label="Toggle developer options"]').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    await page.locator('button:has-text("RFK 1968")').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    
    // Wait for content
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(10);
    
    // Verify anchors exist
    const anchors = page.locator('.absolute.w-2.h-2.bg-gray-800.rounded-sm');
    await expect(anchors).toHaveCount(10);
    
    // Verify connector lines exist  
    const connectors = page.locator('svg line');
    await expect(connectors).toHaveCount(10);
    
    // Take screenshot to analyze connector styling
    await expect(page).toHaveScreenshot('connectors-anchors.png');
  });
});