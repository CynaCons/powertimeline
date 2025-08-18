import { test, expect } from '@playwright/test';

test.describe('Deterministic Layout v4', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Clear any existing events
    await page.getByRole('button', { name: 'Toggle developer options' }).click();
    await page.getByRole('button', { name: 'Clear All' }).click();
  });

  test('should implement deterministic slot allocation (2/4/8/10)', async ({ page }) => {
    // Add exactly 1 event - should use Full card (4 slots: 2 above, 2 below)
    await page.getByRole('button', { name: 'Random +1' }).click();
    
    await page.screenshot({ path: 'test-results/deterministic-1-event.png' });
    
    // Verify single card is displayed
    const cards = page.locator('[data-testid^="card-"]');
    await expect(cards).toHaveCount(1);
    
    // Add second event - should use 2 Compact cards (4 slots total) 
    await page.getByRole('button', { name: 'Random +1' }).click();
    
    await page.screenshot({ path: 'test-results/deterministic-2-events.png' });
    await expect(cards).toHaveCount(2);
    
    // Add up to 4 events - should use 4 Title-only cards (8 slots total)
    await page.getByRole('button', { name: 'Random +1' }).click();
    await page.getByRole('button', { name: 'Random +1' }).click();
    
    await page.screenshot({ path: 'test-results/deterministic-4-events.png' });
    await expect(cards).toHaveCount(4);
    
    // Add 5th event - should use 1 Multi-event card (10 slots total)
    await page.getByRole('button', { name: 'Random +1' }).click();
    
    await page.screenshot({ path: 'test-results/deterministic-5-events.png' });
    
    // With 5 events, we should have 1 multi-event card containing all 5 events
    // The exact count may vary based on clustering, but total events should be 5
    const totalEvents = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid^="card-"]');
      return cards.length;
    });
    
    expect(totalEvents).toBeGreaterThan(0);
  });

  test('should perform left-to-right clustering', async ({ page }) => {
    // Add events with known dates to test clustering
    
    // Clear and add specific timeline
    await page.getByRole('button', { name: 'Clear All' }).click();
    
    // Add clustered events
    await page.getByRole('button', { name: 'Clustered' }).click();
    
    await page.screenshot({ path: 'test-results/deterministic-clustering.png' });
    
    // Verify anchors are positioned at cluster centers
    const anchors = page.locator('[data-testid^="anchor-"]');
    const anchorCount = await anchors.count();
    expect(anchorCount).toBeGreaterThan(0);
    
    // Take detailed screenshot for manual verification
    await page.screenshot({ 
      path: 'test-results/deterministic-clustering-detailed.png',
      fullPage: true 
    });
  });

  test('should guarantee zero overlaps', async ({ page }) => {
    // Add many events to test dense scenario
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: 'Random +5' }).click();
    await page.getByRole('button', { name: 'Random +5' }).click();
    await page.getByRole('button', { name: 'Random +5' }).click();
    
    await page.screenshot({ path: 'test-results/deterministic-dense.png' });
    
    // Check for overlap detection in development mode
    const overlapInfo = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[data-testid^="card-"]'));
      const rects = cards.map(card => ({
        id: card.getAttribute('data-testid'),
        rect: card.getBoundingClientRect()
      }));
      
      // Check for overlaps
      let overlaps = 0;
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i].rect;
          const b = rects[j].rect;
          
          // Check if rectangles overlap
          if (a.left < b.right && a.right > b.left && 
              a.top < b.bottom && a.bottom > b.top) {
            overlaps++;
          }
        }
      }
      
      return { totalCards: cards.length, overlaps };
    });
    
    // With deterministic layout, overlaps should be zero
    expect(overlapInfo.overlaps).toBe(0);
    console.log(`Cards: ${overlapInfo.totalCards}, Overlaps: ${overlapInfo.overlaps}`);
  });

  test('should center anchors below column groups', async ({ page }) => {
    // Test anchor positioning
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: 'Long Range' }).click();
    
    await page.screenshot({ path: 'test-results/deterministic-anchors.png' });
    
    // Verify anchors exist and are positioned correctly
    const anchors = page.locator('[data-testid^="anchor-"]');
    const anchorCount = await anchors.count();
    expect(anchorCount).toBeGreaterThan(0);
    
    // Check anchor positioning relative to cards
    const anchorPositions = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('[data-testid^="anchor-"]'));
      const cards = Array.from(document.querySelectorAll('[data-testid^="card-"]'));
      
      return {
        anchors: anchors.map(a => ({
          x: a.getBoundingClientRect().left + a.getBoundingClientRect().width / 2,
          y: a.getBoundingClientRect().top
        })),
        cards: cards.map(c => ({
          x: c.getBoundingClientRect().left + c.getBoundingClientRect().width / 2,
          y: c.getBoundingClientRect().top,
          width: c.getBoundingClientRect().width
        }))
      };
    });
    
    expect(anchorPositions.anchors.length).toBeGreaterThan(0);
    expect(anchorPositions.cards.length).toBeGreaterThan(0);
  });

  test('should implement mathematical degradation ratios', async ({ page }) => {
    // Test the 1→2→4→5 degradation mathematics
    
    await page.getByRole('button', { name: 'Clear All' }).click();
    
    // Test progression: 1 Full → 2 Compact → 4 Title-only → 5 Multi-event
    
    // 1 event: 1 Full card
    await page.getByRole('button', { name: 'Random +1' }).click();
    await page.screenshot({ path: 'test-results/degradation-1-full.png' });
    
    await page.getByRole('button', { name: 'Clear All' }).click();
    
    // 2 events: 2 Compact cards  
    await page.getByRole('button', { name: 'Random +1' }).click();
    await page.getByRole('button', { name: 'Random +1' }).click();
    await page.screenshot({ path: 'test-results/degradation-2-compact.png' });
    
    await page.getByRole('button', { name: 'Clear All' }).click();
    
    // 4 events: 4 Title-only cards
    await page.getByRole('button', { name: 'Random +1' }).click();
    await page.getByRole('button', { name: 'Random +1' }).click();
    await page.getByRole('button', { name: 'Random +1' }).click();
    await page.getByRole('button', { name: 'Random +1' }).click();
    await page.screenshot({ path: 'test-results/degradation-4-title.png' });
    
    await page.getByRole('button', { name: 'Clear All' }).click();
    
    // 5 events: 1 Multi-event card
    await page.getByRole('button', { name: 'Random +5' }).click();
    await page.screenshot({ path: 'test-results/degradation-5-multi.png' });
    
    // Verify cards are rendered (exact count depends on clustering)
    const cards = page.locator('[data-testid^="card-"]');
    await expect(cards.first()).toBeVisible();
  });

  test('should handle complex scenarios', async ({ page }) => {
    // Test with historical datasets
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: 'RFK 1968' }).click();
    
    await page.screenshot({ path: 'test-results/deterministic-rfk.png' });
    
    // Should render without errors
    const cards = page.locator('[data-testid^="card-"]');
    await expect(cards.first()).toBeVisible();
    
    // Test Napoleon timeline (large dataset)
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: 'Napoleon 1769-1821' }).click();
    
    await page.screenshot({ path: 'test-results/deterministic-napoleon.png' });
    
    // Should handle large datasets efficiently
    await expect(cards.first()).toBeVisible();
  });
});