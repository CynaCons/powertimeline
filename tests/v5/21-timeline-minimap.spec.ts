import { test, expect } from '@playwright/test';

async function openDevPanel(page: any) {
  await page.getByRole('button', { name: 'Toggle developer options' }).click();
  
  // Wait for Developer Panel to become enabled
  await page.waitForFunction(() => {
    const btn = document.querySelector('button[aria-label="Developer Panel"]');
    return btn && !btn.hasAttribute('disabled');
  }, { timeout: 5000 });
  
  await page.getByRole('button', { name: 'Developer Panel' }).click();
}

test.describe('Timeline Minimap Tests', () => {
  test('Minimap displays and shows timeline range', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-MINIMAP-001' });
    await page.goto('/');
    
    // Load Napoleon timeline
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: 'Napoleon 1769-1821' }).click();
    await page.waitForTimeout(1000);
    
    // Check if minimap is visible
    const minimap = page.locator('.bg-gray-50').first(); // Minimap container
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
    await page.goto('/');
    
    // Load Napoleon timeline
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: 'Napoleon 1769-1821' }).click();
    await page.waitForTimeout(1000);
    
    // Start from fit all (should show full window)
    await page.getByRole('button', { name: 'Fit All' }).click();
    await page.waitForTimeout(500);
    
    // Check minimap view window at full zoom out
    const minimap = page.locator('.bg-gray-50').first();
    const viewWindow = minimap.locator('.bg-blue-600.bg-opacity-30');
    
    await expect(viewWindow).toBeVisible();
    await page.screenshot({ path: 'test-results/minimap-full-view.png' });
    
    // Get initial view window width
    const initialBox = await viewWindow.boundingBox();
    console.log(`Initial view window: width=${initialBox?.width}`);
    
    // Use zoom button to zoom in (since wheel doesn't work in tests)
    await page.getByText('Zoom In').click();
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
    await page.goto('/');
    
    // Load clustered timeline with many events
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: 'Clustered' }).click();
    await page.waitForTimeout(1000);
    
    // Check for event markers in minimap
    const minimap = page.locator('.bg-gray-50').first();
    const eventMarkers = minimap.locator('.bg-blue-400'); // Event density markers
    
    const markerCount = await eventMarkers.count();
    console.log(`Event markers found: ${markerCount}`);
    
    // Should have multiple event markers for clustered data
    expect(markerCount).toBeGreaterThan(5);
    
    await page.screenshot({ path: 'test-results/minimap-event-markers.png' });
  });
  
  test('Minimap click navigation works', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-MINIMAP-004' });
    await page.goto('/');
    
    // Load Napoleon timeline
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: 'Napoleon 1769-1821' }).click();
    await page.waitForTimeout(1000);
    
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
    const minimap = page.locator('.bg-gray-200'); // Minimap timeline bar
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
      
      // Timeline should have changed to focus on later period
      const navigationWorked = initialState.firstDate !== afterClickState.firstDate || 
                              initialState.lastDate !== afterClickState.lastDate;
      
      console.log(`Navigation worked: ${navigationWorked}`);
      expect(navigationWorked).toBe(true);
    }
  });
});
