/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';

async function openDevPanel(page: any) {
  
  
  // Wait for Developer Panel to become enabled
  await page.waitForFunction(() => {
    const btn = document.querySelector('button[aria-label="Developer Panel"]');
    return btn && !btn.hasAttribute('disabled');
  }, { timeout: 5000 });
  
  await page.getByRole('button', { name: 'Developer Panel' }).click();
}

test.describe('Zoom Edge Cases Tests', () => {
  test('Extreme zoom limits should not break system', async ({ page }) => {
    await page.goto('/');
    
    // Load Napoleon timeline (long range)
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: 'Napoleon 1769-1821' }).click();
    await page.waitForTimeout(1000);
    
    const initialCards = await page.locator('[data-testid="event-card"]').count();
    console.log(`Initial Napoleon timeline: ${initialCards} cards`);
    
    // Test extreme zoom in (simulate 20 aggressive zoom in operations)
    console.log('Testing extreme zoom in limits...');
    for (let i = 0; i < 20; i++) {
      await page.mouse.wheel(0, -300); // Very aggressive zoom in
      await page.waitForTimeout(50);
    }
    
    // System should still function
    const maxZoomCards = await page.locator('[data-testid="event-card"]').count();
    const hasOverflowBadges = await page.locator('text=/^\\+\\d+$/').count();
    await page.screenshot({ path: 'test-results/zoom-extreme-max-zoom.png' });
    console.log(`Extreme max zoom: ${maxZoomCards} cards, ${hasOverflowBadges} overflow badges`);
    
    // Should show at least 1 card and system should not crash
    expect(maxZoomCards).toBeGreaterThan(0);
    
    // Test extreme zoom out (simulate 25 aggressive zoom out operations)
    console.log('Testing extreme zoom out limits...');
    for (let i = 0; i < 25; i++) {
      await page.mouse.wheel(0, 400); // Very aggressive zoom out
      await page.waitForTimeout(50);
    }
    
    // System should still function
    const minZoomCards = await page.locator('[data-testid="event-card"]').count();
    await page.screenshot({ path: 'test-results/zoom-extreme-min-zoom.png' });
    console.log(`Extreme min zoom: ${minZoomCards} cards`);
    
    // Should show reasonable number of cards
    expect(minZoomCards).toBeGreaterThan(0);
    expect(minZoomCards).toBeLessThan(50); // Should not show unlimited cards
    
    // Test recovery functionality
    await page.getByRole('button', { name: 'Fit All' }).click();
    await page.waitForTimeout(500);
    const recoveredCards = await page.locator('[data-testid="event-card"]').count();
    console.log(`Recovery (Fit All): ${recoveredCards} cards`);
    
    // Should recover to reasonable state
    expect(recoveredCards).toBeGreaterThan(0);
    expect(Math.abs(recoveredCards - initialCards)).toBeLessThan(5); // Should be close to initial
  });
  
  test('Navigation rail overlap prevention - narrow viewport', async ({ page }) => {
    // Test narrow viewport specifically for navigation rail overlap fix
    await page.setViewportSize({ width: 1000, height: 600 });
    await page.goto('/');
    
    // Load Napoleon timeline
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: 'Napoleon 1769-1821' }).click();
    await page.waitForTimeout(1000);
    
    const cards = await page.locator('[data-testid="event-card"]').count();
    
    // Check for navigation rail overlaps
    const cardElements = await page.locator('[data-testid="event-card"]').all();
    let navOverlaps = 0;
    
    for (const card of cardElements) {
      const bounds = await card.boundingBox();
      if (bounds && bounds.x < 136) { // Should be > 136px (nav rail + margin)
        navOverlaps++;
      }
    }
    
    console.log(`Narrow viewport (1000px): ${cards} cards, ${navOverlaps} navigation overlaps`);
    await page.screenshot({ path: 'test-results/zoom-narrow-viewport-nav-test.png' });
    
    // Verify no navigation overlaps at narrow viewport
    expect(navOverlaps).toBe(0);
    expect(cards).toBeGreaterThan(0);
  });

  test('Zoom behavior with standard viewport sizes', async ({ page }) => {
    const viewportSizes = [
      { name: 'standard', width: 1400, height: 800 },
      { name: 'wide', width: 1800, height: 1000 }
    ];
    
    for (const viewport of viewportSizes) {
      console.log(`\n=== Testing ${viewport.name} viewport (${viewport.width}x${viewport.height}) ===`);
      
      // Set viewport size
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      
      // Load Napoleon timeline
      await openDevPanel(page);
      await page.getByRole('button', { name: 'Clear All' }).click();
      await page.getByRole('button', { name: 'Napoleon 1769-1821' }).click();
      await page.waitForTimeout(1000);
      
      // Test zoom sequence
      const initialCards = await page.locator('[data-testid="event-card"]').count();
      
      // Zoom in
      await page.mouse.wheel(0, -150);
      await page.waitForTimeout(300);
      const zoomedCards = await page.locator('[data-testid="event-card"]').count();
      
      console.log(`${viewport.name}: ${initialCards} → ${zoomedCards} cards`);
      
      // Check for navigation rail overlaps
      const cards = await page.locator('[data-testid="event-card"]').all();
      let navOverlaps = 0;
      
      for (const card of cards) {
        const bounds = await card.boundingBox();
        if (bounds && bounds.x < 136) { // Should be > 136px (nav rail + margin)
          navOverlaps++;
        }
      }
      
      console.log(`${viewport.name}: ${navOverlaps} navigation rail overlaps`);
      
      // Verify zoom works and no navigation overlaps
      expect(initialCards !== zoomedCards).toBe(true);
      expect(navOverlaps).toBe(0);
    }
  });
  
  test('Zoom performance with dense datasets', async ({ page }) => {
    await page.goto('/');
    
    // Create dense dataset using multiple clustered operations
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clear All' }).click();
    
    // Add multiple clustered datasets
    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: 'Clustered' }).click();
      await page.waitForTimeout(200);
    }
    
    // Get total event count from localStorage
    const totalEvents = await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('chronochart-events') || '[]');
      return state.length;
    });
    
    console.log(`Dense dataset loaded: ${totalEvents} total events`);
    
    // Measure zoom performance
    const startTime = Date.now();
    
    // Perform zoom sequence and measure timing
    const zoomSequence = [
      { action: 'zoom-in-1', wheel: -100 },
      { action: 'zoom-in-2', wheel: -100 },
      { action: 'zoom-in-3', wheel: -100 },
      { action: 'zoom-out-1', wheel: 100 },
      { action: 'zoom-out-2', wheel: 100 },
      { action: 'fit-all', wheel: null }
    ];
    
    const timings: Array<{ action: string; cards: number; duration: number }> = [];
    
    for (const step of zoomSequence) {
      const stepStart = Date.now();
      
      if (step.wheel) {
        await page.mouse.wheel(0, step.wheel);
      } else {
        await page.getByRole('button', { name: 'Fit All' }).click();
      }
      
      await page.waitForTimeout(300);
      
      const cards = await page.locator('[data-testid="event-card"]').count();
      const duration = Date.now() - stepStart;
      
      timings.push({ action: step.action, cards, duration });
      
      // Take screenshot for visual verification
      await page.screenshot({ path: `test-results/zoom-performance-${step.action}.png` });
    }
    
    const totalDuration = Date.now() - startTime;
    
    console.log('\n=== ZOOM PERFORMANCE SUMMARY ===');
    console.log(`Total events: ${totalEvents}`);
    console.log(`Total test duration: ${totalDuration}ms`);
    
    for (const timing of timings) {
      console.log(`${timing.action}: ${timing.cards} cards, ${timing.duration}ms`);
      
      // Each zoom operation should complete within reasonable time
      expect(timing.duration).toBeLessThan(2000); // 2 second max per zoom operation
      expect(timing.cards).toBeGreaterThan(0); // Should always show some cards
    }
    
    // Overall performance should be acceptable
    expect(totalDuration).toBeLessThan(10000); // 10 second max for full sequence
  });
});