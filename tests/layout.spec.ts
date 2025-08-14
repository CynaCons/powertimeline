import { test, expect } from '@playwright/test';

test.describe('Iteration 3: Card Layout & Distribution', () => {
  test('should avoid card collisions with layered positioning', async ({ page }) => {
    // Add many clustered test events to localStorage
    await page.goto('/');
    await page.evaluate(() => {
      const testEvents = [
        { id: '1', date: '2024-01-01', title: 'Event 1', description: 'First test event' },
        { id: '2', date: '2024-01-01', title: 'Event 2', description: 'Second test event on same day' },
        { id: '3', date: '2024-01-01', title: 'Event 3', description: 'Third test event on same day' },
        { id: '4', date: '2024-01-02', title: 'Event 4', description: 'Fourth test event' },
        { id: '5', date: '2024-01-02', title: 'Event 5', description: 'Fifth test event on same day' },
        { id: '6', date: '2024-01-03', title: 'Event 6', description: 'Sixth test event' }
      ];
      localStorage.setItem('chronochart-events', JSON.stringify(testEvents));
    });
    await page.reload();
    
    // Get all cards and check for overlaps
    const cards = page.locator('[data-testid="event-card"]');
    await expect(cards).toHaveCount(6);
    
    const cardRects = await cards.evaluateAll(elements => 
      elements.map(el => {
        const rect = el.getBoundingClientRect();
        return {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom
        };
      })
    );
    
    // Check that no cards overlap significantly
    for (let i = 0; i < cardRects.length; i++) {
      for (let j = i + 1; j < cardRects.length; j++) {
        const rect1 = cardRects[i];
        const rect2 = cardRects[j];
        
        const horizontalOverlap = rect1.right > rect2.left && rect2.right > rect1.left;
        const verticalOverlap = rect1.bottom > rect2.top && rect2.bottom > rect1.top;
        
        // Cards should not significantly overlap
        if (horizontalOverlap && verticalOverlap) {
          const overlapWidth = Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left);
          const overlapHeight = Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top);
          
          // Allow minimal overlap (less than 10px in each dimension)
          expect(overlapWidth).toBeLessThan(10);
          expect(overlapHeight).toBeLessThan(10);
        }
      }
    }
  });

  test('should distribute cards above and below timeline', async ({ page }) => {
    // Add test events to localStorage
    await page.goto('/');
    await page.evaluate(() => {
      const testEvents = [
        { id: '1', date: '2024-01-01', title: 'Event 1', description: 'First test event' },
        { id: '2', date: '2024-01-02', title: 'Event 2', description: 'Second test event' },
        { id: '3', date: '2024-01-03', title: 'Event 3', description: 'Third test event' },
        { id: '4', date: '2024-01-04', title: 'Event 4', description: 'Fourth test event' },
        { id: '5', date: '2024-01-05', title: 'Event 5', description: 'Fifth test event' },
        { id: '6', date: '2024-01-06', title: 'Event 6', description: 'Sixth test event' }
      ];
      localStorage.setItem('chronochart-events', JSON.stringify(testEvents));
    });
    await page.reload();
    
    // Find the timeline position
    const timelineY = await page.locator('.absolute.inset-0.flex.items-center').evaluate(el => {
      return el.getBoundingClientRect().top + el.getBoundingClientRect().height / 2;
    });
    
    // Get card positions relative to timeline
    const cards = page.locator('[data-testid="event-card"]');
    const cardPositions = await cards.evaluateAll((elements, timelineY) => 
      elements.map(el => {
        const rect = el.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        return {
          y: cardCenter,
          isAbove: cardCenter < timelineY,
          isBelow: cardCenter > timelineY
        };
      }), timelineY
    );
    
    // Should have cards both above and below the timeline
    const aboveCount = cardPositions.filter(pos => pos.isAbove).length;
    const belowCount = cardPositions.filter(pos => pos.isBelow).length;
    
    expect(aboveCount).toBeGreaterThan(0);
    expect(belowCount).toBeGreaterThan(0);
    
    // Distribution should be reasonably balanced (not all on one side)
    expect(Math.abs(aboveCount - belowCount)).toBeLessThanOrEqual(2);
  });

  test('should connect cards to timeline anchors with lines', async ({ page }) => {
    // Add test events to localStorage
    await page.goto('/');
    await page.evaluate(() => {
      const testEvents = [
        { id: '1', date: '2024-01-01', title: 'Event 1', description: 'First test event' },
        { id: '2', date: '2024-01-02', title: 'Event 2', description: 'Second test event' },
        { id: '3', date: '2024-01-03', title: 'Event 3', description: 'Third test event' }
      ];
      localStorage.setItem('chronochart-events', JSON.stringify(testEvents));
    });
    await page.reload();
    
    // Check for timeline anchors
    const anchors = page.locator('.absolute.w-2.h-2.bg-gray-800.rounded-sm');
    await expect(anchors).toHaveCount(3);
    
    // Check for connector lines
    const connectors = page.locator('svg line');
    await expect(connectors).toHaveCount(3);
    
    // Verify connector lines have the right styling
    const firstConnector = connectors.first();
    const stroke = await firstConnector.getAttribute('stroke');
    const strokeWidth = await firstConnector.getAttribute('stroke-width');
    const opacity = await firstConnector.getAttribute('opacity');
    
    expect(stroke).toBe('#9ca3af');
    expect(strokeWidth).toBe('1.5');
    expect(opacity).toBe('0.7');
  });
});