import { test, expect } from '@playwright/test';

async function openDevPanel(page: any) {
  await page.getByRole('button', { name: 'Toggle developer options' }).click();
  await page.getByRole('button', { name: 'Developer Panel' }).click();
}

test.describe('Zoom Stability Tests', () => {
  test('Cursor anchoring - Event should stay under cursor during zoom', async ({ page }) => {
    await page.goto('/');
    
    // Load JFK timeline with multiple events
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: 'JFK 1961-63' }).click();
    await page.waitForTimeout(1000);
    
    // Get a specific event card to target
    const targetCard = page.locator('[data-testid="event-card"]').first();
    const initialCardBounds = await targetCard.boundingBox();
    
    if (!initialCardBounds) {
      throw new Error('No target card found for cursor anchoring test');
    }
    
    // Position cursor over the center of the target card
    const cursorX = initialCardBounds.x + initialCardBounds.width / 2;
    const cursorY = initialCardBounds.y + initialCardBounds.height / 2;
    await page.mouse.move(cursorX, cursorY);
    
    console.log(`Initial cursor position: (${cursorX}, ${cursorY})`);
    console.log(`Initial card bounds: x=${initialCardBounds.x}, y=${initialCardBounds.y}, w=${initialCardBounds.width}, h=${initialCardBounds.height}`);
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/zoom-stability-initial.png' });
    
    // Zoom in and check card position
    await page.mouse.wheel(0, -120); // Zoom in
    await page.waitForTimeout(300);
    
    const zoomedInCardBounds = await targetCard.boundingBox();
    if (zoomedInCardBounds) {
      const zoomedInCenterX = zoomedInCardBounds.x + zoomedInCardBounds.width / 2;
      const zoomedInCenterY = zoomedInCardBounds.y + zoomedInCardBounds.height / 2;
      const distanceFromCursor = Math.sqrt(
        Math.pow(zoomedInCenterX - cursorX, 2) + Math.pow(zoomedInCenterY - cursorY, 2)
      );
      
      console.log(`After zoom in - Card center: (${zoomedInCenterX}, ${zoomedInCenterY})`);
      console.log(`Distance from cursor: ${distanceFromCursor.toFixed(2)}px`);
      
      // Take screenshot after zoom in
      await page.screenshot({ path: 'test-results/zoom-stability-zoomed-in.png' });
      
      // Card should stay close to cursor (within 50px tolerance for zoom stability)
      expect(distanceFromCursor).toBeLessThan(50);
    }
    
    // Zoom out and verify stability
    await page.mouse.wheel(0, 120); // Zoom out
    await page.waitForTimeout(300);
    
    const zoomedOutCardBounds = await targetCard.boundingBox();
    if (zoomedOutCardBounds) {
      const zoomedOutCenterX = zoomedOutCardBounds.x + zoomedOutCardBounds.width / 2;
      const zoomedOutCenterY = zoomedOutCardBounds.y + zoomedOutCardBounds.height / 2;
      const finalDistanceFromCursor = Math.sqrt(
        Math.pow(zoomedOutCenterX - cursorX, 2) + Math.pow(zoomedOutCenterY - cursorY, 2)
      );
      
      console.log(`After zoom out - Card center: (${zoomedOutCenterX}, ${zoomedOutCenterY})`);
      console.log(`Final distance from cursor: ${finalDistanceFromCursor.toFixed(2)}px`);
      
      // Take screenshot after zoom out
      await page.screenshot({ path: 'test-results/zoom-stability-zoomed-out.png' });
      
      // Card should return close to original position
      expect(finalDistanceFromCursor).toBeLessThan(50);
    }
  });
  
  test('Visual integrity during zoom operations', async ({ page }) => {
    await page.goto('/');
    
    // Load clustered timeline for visual complexity
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: 'Clustered' }).click();
    await page.waitForTimeout(1000);
    
    // Test multiple zoom levels for visual artifacts
    const zoomLevels = [
      { name: 'initial', action: null },
      { name: 'zoom-in-1x', action: () => page.mouse.wheel(0, -100) },
      { name: 'zoom-in-2x', action: () => page.mouse.wheel(0, -100) },
      { name: 'zoom-in-3x', action: () => page.mouse.wheel(0, -100) },
      { name: 'zoom-out-1x', action: () => page.mouse.wheel(0, 100) },
      { name: 'zoom-out-2x', action: () => page.mouse.wheel(0, 100) },
      { name: 'fit-all', action: () => page.getByRole('button', { name: 'Fit All' }).click() }
    ];
    
    for (const level of zoomLevels) {
      if (level.action) {
        await level.action();
        await page.waitForTimeout(300);
      }
      
      // Take screenshot at this zoom level
      await page.screenshot({ path: `test-results/zoom-visual-${level.name}.png` });
      
      // Check for visual integrity
      const cards = await page.locator('[data-testid="event-card"]').all();
      const overflowBadges = await page.locator('text=/^\\+\\d+$/').all();
      
      // Verify no cards are completely off-screen (left edge)
      let offScreenCards = 0;
      let overlappingCards = 0;
      
      const cardBounds = [];
      for (const card of cards) {
        const bounds = await card.boundingBox();
        if (bounds) {
          cardBounds.push(bounds);
          if (bounds.x + bounds.width < 0 || bounds.x > page.viewportSize()!.width) {
            offScreenCards++;
          }
        }
      }
      
      // Check for card overlaps
      for (let i = 0; i < cardBounds.length; i++) {
        for (let j = i + 1; j < cardBounds.length; j++) {
          const overlap = Math.max(0,
            Math.min(cardBounds[i].x + cardBounds[i].width, cardBounds[j].x + cardBounds[j].width) -
            Math.max(cardBounds[i].x, cardBounds[j].x)
          ) * Math.max(0,
            Math.min(cardBounds[i].y + cardBounds[i].height, cardBounds[j].y + cardBounds[j].height) -
            Math.max(cardBounds[i].y, cardBounds[j].y)
          );
          
          if (overlap > 0) {
            overlappingCards++;
          }
        }
      }
      
      console.log(`${level.name}: ${cards.length} cards, ${overflowBadges.length} badges, ${offScreenCards} off-screen, ${overlappingCards} overlaps`);
      
      // Visual integrity checks
      expect(cards.length).toBeGreaterThan(0); // Should always show some cards
      expect(overlappingCards).toBe(0); // No overlapping cards
    }
  });
  
  test('Zoom range limits and boundary behavior', async ({ page }) => {
    await page.goto('/');
    
    // Load RFK timeline
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: 'RFK 1968' }).click();
    await page.waitForTimeout(1000);
    
    // Test extreme zoom in
    console.log('Testing extreme zoom in...');
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, -200); // Aggressive zoom in
      await page.waitForTimeout(100);
    }
    
    // Verify system still works at max zoom
    const maxZoomCards = await page.locator('[data-testid="event-card"]').count();
    await page.screenshot({ path: 'test-results/zoom-extreme-in.png' });
    console.log(`Extreme zoom in: ${maxZoomCards} cards visible`);
    
    // Test extreme zoom out
    console.log('Testing extreme zoom out...');
    for (let i = 0; i < 15; i++) {
      await page.mouse.wheel(0, 200); // Aggressive zoom out
      await page.waitForTimeout(100);
    }
    
    // Verify system still works at min zoom
    const minZoomCards = await page.locator('[data-testid="event-card"]').count();
    await page.screenshot({ path: 'test-results/zoom-extreme-out.png' });
    console.log(`Extreme zoom out: ${minZoomCards} cards visible`);
    
    // System should remain functional at extremes
    expect(maxZoomCards).toBeGreaterThan(0);
    expect(minZoomCards).toBeGreaterThan(0);
    
    // Test recovery with Fit All
    await page.getByRole('button', { name: 'Fit All' }).click();
    await page.waitForTimeout(500);
    const recoveredCards = await page.locator('[data-testid="event-card"]').count();
    console.log(`After Fit All recovery: ${recoveredCards} cards visible`);
    
    expect(recoveredCards).toBeGreaterThan(0);
  });
  
  test('Multi-timeline zoom consistency', async ({ page }) => {
    await page.goto('/');
    await openDevPanel(page);
    
    const timelines = [
      { name: 'RFK 1968', button: 'RFK 1968' },
      { name: 'JFK 1961-63', button: 'JFK 1961-63' },
      { name: 'Napoleon 1769-1821', button: 'Napoleon 1769-1821' }
    ];
    
    const zoomResults: Array<{ timeline: string; initial: number; zoomedIn: number; zoomedOut: number }> = [];
    
    for (const timeline of timelines) {
      console.log(`\n=== Testing ${timeline.name} ===`);
      
      // Load timeline
      await page.getByRole('button', { name: 'Clear All' }).click();
      await page.getByRole('button', { name: timeline.button }).click();
      await page.waitForTimeout(1000);
      
      // Get initial card count
      const initialCards = await page.locator('[data-testid="event-card"]').count();
      
      // Zoom in (3x)
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(200);
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(200);
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(200);
      
      const zoomedInCards = await page.locator('[data-testid="event-card"]').count();
      
      // Take screenshot at zoom level
      await page.screenshot({ path: `test-results/zoom-consistency-${timeline.name.toLowerCase().replace(/\s+/g, '-')}-zoomed.png` });
      
      // Zoom out (return to fit all)
      await page.getByRole('button', { name: 'Fit All' }).click();
      await page.waitForTimeout(500);
      
      const zoomedOutCards = await page.locator('[data-testid="event-card"]').count();
      
      zoomResults.push({
        timeline: timeline.name,
        initial: initialCards,
        zoomedIn: zoomedInCards,
        zoomedOut: zoomedOutCards
      });
      
      console.log(`${timeline.name}: ${initialCards} → ${zoomedInCards} → ${zoomedOutCards} cards`);
    }
    
    // Verify consistency across timelines
    console.log('\n=== ZOOM CONSISTENCY SUMMARY ===');
    for (const result of zoomResults) {
      console.log(`${result.timeline}: ${result.initial} → ${result.zoomedIn} → ${result.zoomedOut}`);
      
      // Each timeline should show zoom behavior (change in card count)
      const hasZoomEffect = result.initial !== result.zoomedIn;
      expect(hasZoomEffect).toBe(true);
      
      // Should return to similar count after fit all (within reasonable tolerance)
      const recoveryDifference = Math.abs(result.initial - result.zoomedOut);
      expect(recoveryDifference).toBeLessThan(3); // Allow small differences due to layout changes
    }
  });
  
  test('Zoom with overflow badges - No overlap regressions', async ({ page }) => {
    await page.goto('/');
    
    // Create scenario with overflow badges
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: 'Clustered' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Clustered' }).click();
    await page.waitForTimeout(1000);
    
    // Function to check overflow badge overlaps
    const checkOverflowBadgeOverlaps = async () => {
      const badges = await page.locator('text=/^\\+\\d+$/').all();
      const badgeBounds = [];
      
      for (const badge of badges) {
        const bounds = await badge.boundingBox();
        if (bounds) badgeBounds.push(bounds);
      }
      
      let overlaps = 0;
      for (let i = 0; i < badgeBounds.length; i++) {
        for (let j = i + 1; j < badgeBounds.length; j++) {
          const overlapArea = Math.max(0,
            Math.min(badgeBounds[i].x + badgeBounds[i].width, badgeBounds[j].x + badgeBounds[j].width) -
            Math.max(badgeBounds[i].x, badgeBounds[j].x)
          ) * Math.max(0,
            Math.min(badgeBounds[i].y + badgeBounds[i].height, badgeBounds[j].y + badgeBounds[j].height) -
            Math.max(badgeBounds[i].y, badgeBounds[j].y)
          );
          
          if (overlapArea > 0) overlaps++;
        }
      }
      
      return { badgeCount: badgeBounds.length, overlaps };
    };
    
    // Check initial state
    const initialBadgeState = await checkOverflowBadgeOverlaps();
    await page.screenshot({ path: 'test-results/zoom-overflow-initial.png' });
    console.log(`Initial: ${initialBadgeState.badgeCount} badges, ${initialBadgeState.overlaps} overlaps`);
    
    // Zoom in and check badge integrity
    await page.mouse.wheel(0, -150);
    await page.waitForTimeout(300);
    
    const zoomedInBadgeState = await checkOverflowBadgeOverlaps();
    await page.screenshot({ path: 'test-results/zoom-overflow-zoomed-in.png' });
    console.log(`Zoomed in: ${zoomedInBadgeState.badgeCount} badges, ${zoomedInBadgeState.overlaps} overlaps`);
    
    // Zoom out and check badge integrity
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(300);
    
    const zoomedOutBadgeState = await checkOverflowBadgeOverlaps();
    await page.screenshot({ path: 'test-results/zoom-overflow-zoomed-out.png' });
    console.log(`Zoomed out: ${zoomedOutBadgeState.badgeCount} badges, ${zoomedOutBadgeState.overlaps} overlaps`);
    
    // No overlaps should occur at any zoom level
    expect(initialBadgeState.overlaps).toBe(0);
    expect(zoomedInBadgeState.overlaps).toBe(0);
    expect(zoomedOutBadgeState.overlaps).toBe(0);
  });
});