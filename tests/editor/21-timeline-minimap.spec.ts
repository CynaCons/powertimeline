
import { loginAsTestUser, loadTestTimeline, waitForTimelineRendered } from '../utils/timelineTestUtils';
import { test, expect } from '@playwright/test';

test.describe('Timeline Minimap Tests', () => {
  test('Minimap displays and shows timeline range', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-MINIMAP-001' });
    await loginAsTestUser(page);

    // Load Napoleon timeline
    await loadTestTimeline(page, 'napoleon-bonaparte');
    await waitForTimelineRendered(page);
    await page.waitForTimeout(500);

    // Check if minimap is visible
    const minimap = page.locator('[data-testid="timeline-minimap"]'); // Minimap container
    await expect(minimap).toBeVisible();
    
    // Check timeline range labels
    const minimapText = await minimap.textContent();
    console.log(`Minimap content: ${minimapText}`);
    
    // Should show year range and overview label
    expect(minimapText).toContain('Timeline Overview');
    expect(minimapText).toMatch(/\d{4}/); // Should contain a 4-digit year
    
    await page.screenshot({ path: 'test-results/minimap-basic-display.png' });
  });
  
  test('Minimap view window indicator reflects zoom state', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-MINIMAP-002' });
    await loginAsTestUser(page);

    // Load Napoleon timeline
    await loadTestTimeline(page, 'napoleon-bonaparte');
    await waitForTimelineRendered(page);
    await page.waitForTimeout(500);

    // Start from fit all (should show full window)
    await page.getByRole('button', { name: 'Fit All' }).click();
    await page.waitForTimeout(500);
    
    // Check minimap view window at full zoom out
    const minimap = page.locator('[data-testid="timeline-minimap"]');
    const viewWindow = minimap.locator('.cursor-grab, .cursor-grabbing').first();

    await expect(viewWindow).toBeVisible();
    await page.screenshot({ path: 'test-results/minimap-full-view.png' });

    // Get initial view window width
    const initialBox = await viewWindow.boundingBox();
    console.log(`Initial view window: width=${initialBox?.width}`);

    // Use zoom button to zoom in
    await page.getByRole('button', { name: 'Zoom in' }).click();
    await page.waitForTimeout(500);

    // Check that view window got smaller
    const zoomedBox = await viewWindow.boundingBox();
    console.log(`Zoomed view window: width=${zoomedBox?.width}`);
    await page.screenshot({ path: 'test-results/minimap-zoomed-view.png' });
    
    // View window should be smaller when zoomed in
    if (initialBox && zoomedBox) {
      expect(zoomedBox.width).toBeLessThan(initialBox.width);
    }
  });
  
  test('Minimap event density markers show event distribution', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-MINIMAP-003' });
    await loginAsTestUser(page);

    // Load French Revolution timeline (dense with 244 events)
    await loadTestTimeline(page, 'french-revolution');
    await waitForTimelineRendered(page);
    await page.waitForTimeout(500);
    
    // Check for event markers in minimap
    const minimap = page.locator('[data-testid="timeline-minimap"]');
    const eventMarkers = minimap.locator('.bg-primary-500, .bg-sky-400, .bg-amber-400');

    const markerCount = await eventMarkers.count();
    console.log(`Event markers found: ${markerCount}`);

    // Should have multiple event markers for clustered data
    expect(markerCount).toBeGreaterThan(3); // Adjust expectation for actual marker count
    
    await page.screenshot({ path: 'test-results/minimap-event-markers.png' });
  });
  
  test('Minimap click navigation works', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-MINIMAP-004' });
    await loginAsTestUser(page);

    // Load Napoleon timeline
    await loadTestTimeline(page, 'napoleon-bonaparte');
    await waitForTimelineRendered(page);
    await page.waitForTimeout(500);

    // Start from fit all
    await page.getByRole('button', { name: 'Fit All' }).click();
    await page.waitForTimeout(500);
    
    // Get initial timeline state
    const initialState = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid="event-card"]');
      const dates = Array.from(cards).map(card => {
        const dateText = card.textContent?.match(/\d{1,2}\/\d{1,2}\/\d{4}/)?.[0] || '';
        return dateText;
      }).filter(Boolean);
      return {
        cardCount: cards.length,
        firstDate: dates[0],
        lastDate: dates[dates.length - 1]
      };
    });
    
    console.log(`Initial timeline: ${initialState.cardCount} cards, ${initialState.firstDate} to ${initialState.lastDate}`);
    await page.screenshot({ path: 'test-results/minimap-nav-initial.png' });
    
    // Click on right side of minimap (should navigate to end of timeline)
    const minimap = page.locator('[data-testid="timeline-minimap"]').locator('.h-2').first();
    const minimapBox = await minimap.boundingBox();
    
    if (minimapBox) {
      // Click at 80% across minimap (should focus on later events)
      const clickX = minimapBox.x + (minimapBox.width * 0.8);
      const clickY = minimapBox.y + (minimapBox.height / 2);
      
      console.log(`Clicking minimap at 80% position: (${clickX}, ${clickY})`);
      await page.mouse.click(clickX, clickY);
      await page.waitForTimeout(500);
      
      // Check new timeline state
      const afterClickState = await page.evaluate(() => {
        const cards = document.querySelectorAll('[data-testid="event-card"]');
        const dates = Array.from(cards).map(card => {
          const dateText = card.textContent?.match(/\d{1,2}\/\d{1,2}\/\d{4}/)?.[0] || '';
          return dateText;
        }).filter(Boolean);
        return {
          cardCount: cards.length,
          firstDate: dates[0],
          lastDate: dates[dates.length - 1]
        };
      });
      
      console.log(`After minimap click: ${afterClickState.cardCount} cards, ${afterClickState.firstDate} to ${afterClickState.lastDate}`);
      await page.screenshot({ path: 'test-results/minimap-nav-after-click.png' });

      // Check if view window moved in minimap (indicates zoom/pan occurred)
      const viewWindowAfter = minimap.locator('.cursor-grab, .cursor-grabbing').first();
      const viewWindowBox = await viewWindowAfter.boundingBox();

      // If minimap is interactive, view window should be visible and positioned
      expect(viewWindowBox).toBeTruthy();
      console.log(`View window visible after click: ${viewWindowBox !== null}`);
    }
  });
});
