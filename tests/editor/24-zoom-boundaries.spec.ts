import { test, expect } from '@playwright/test';
import { loginAsTestUser, loadTestTimeline } from '../utils/timelineTestUtils';

test.describe('Timeline Zoom Boundary Tests', () => {
  test('Zoom does not stick to timeline start boundary', async ({ page }) => {
    await loginAsTestUser(page);
    await loadTestTimeline(page, 'timeline-jfk');
    await page.waitForTimeout(1000);
    
    const timelineArea = page.locator('.absolute.inset-0.ml-14');
    const timelineBox = await timelineArea.boundingBox();
    
    // Position cursor near left edge (5% from left)
    const leftCursorX = timelineBox!.x + timelineBox!.width * 0.05;
    const cursorY = timelineBox!.y + timelineBox!.height * 0.5;
    
    await page.mouse.move(leftCursorX, cursorY);
    
    // Zoom in aggressively near left boundary
    for (let i = 0; i < 8; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(100);
    }

    // Check view window position in minimap
    const minimap = page.locator('[data-testid="timeline-minimap"]');
    const minimapBar = minimap.locator('.h-2').first();
    const minimapBox = await minimapBar.boundingBox();
    const viewWindow = minimap.locator('.cursor-grab, .cursor-grabbing').first();
    const box = await viewWindow.boundingBox();
    const viewStart = (box!.x - minimapBox!.x) / minimapBox!.width;
    const viewEnd = (box!.x + box!.width - minimapBox!.x) / minimapBox!.width;
    
    console.log(`Left boundary zoom: viewStart=${viewStart}, viewEnd=${viewEnd}`);
    
    // Should not be stuck at absolute left (allow cursor to influence position)
    expect(viewStart).toBeGreaterThan(-0.1); // Allow slight overflow
    expect(viewEnd).toBeLessThan(0.8); // Should be zoomed in significantly
    
    await page.screenshot({ path: 'test-results/zoom-left-boundary.png' });
  });

  test('Zoom does not stick to timeline end boundary', async ({ page }) => {
    await loginAsTestUser(page);
    await loadTestTimeline(page, 'timeline-jfk');
    await page.waitForTimeout(1000);
    
    const timelineArea = page.locator('.absolute.inset-0.ml-14');
    const timelineBox = await timelineArea.boundingBox();
    
    // Position cursor near right edge (95% from left)
    const rightCursorX = timelineBox!.x + timelineBox!.width * 0.95;
    const cursorY = timelineBox!.y + timelineBox!.height * 0.5;
    
    await page.mouse.move(rightCursorX, cursorY);
    
    // Zoom in aggressively near right boundary
    for (let i = 0; i < 8; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(100);
    }

    // Check view window position in minimap
    const minimap = page.locator('[data-testid="timeline-minimap"]');
    const minimapBar = minimap.locator('.h-2').first();
    const minimapBox = await minimapBar.boundingBox();
    const viewWindow = minimap.locator('.cursor-grab, .cursor-grabbing').first();
    const box = await viewWindow.boundingBox();
    const viewStart = (box!.x - minimapBox!.x) / minimapBox!.width;
    const viewEnd = (box!.x + box!.width - minimapBox!.x) / minimapBox!.width;
    
    console.log(`Right boundary zoom: viewStart=${viewStart}, viewEnd=${viewEnd}`);
    
    // Should not be stuck at absolute right (allow cursor to influence position)
    expect(viewEnd).toBeLessThan(1.1); // Allow slight overflow
    expect(viewStart).toBeGreaterThan(0.2); // Should be zoomed in significantly
    
    await page.screenshot({ path: 'test-results/zoom-right-boundary.png' });
  });

  test('Extreme zoom levels maintain valid view window', async ({ page }) => {
    await loginAsTestUser(page);
    await loadTestTimeline(page, 'timeline-jfk');
    await page.waitForTimeout(1000);
    
    const timelineArea = page.locator('.absolute.inset-0.ml-14');
    const timelineBox = await timelineArea.boundingBox();
    const cursorX = timelineBox!.x + timelineBox!.width * 0.5;
    const cursorY = timelineBox!.y + timelineBox!.height * 0.5;
    
    await page.mouse.move(cursorX, cursorY);
    
    // Extreme zoom in (15 times)
    for (let i = 0; i < 15; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(50);
    }

    // Check view window is still valid in minimap
    const minimap = page.locator('[data-testid="timeline-minimap"]');
    const minimapBar = minimap.locator('.h-2').first();
    const minimapBox = await minimapBar.boundingBox();
    const zoomedInWindow = minimap.locator('.cursor-grab, .cursor-grabbing').first();
    const zoomedBox = await zoomedInWindow.boundingBox();
    const zoomedStart = (zoomedBox!.x - minimapBox!.x) / minimapBox!.width;
    const zoomedWidth = zoomedBox!.width / minimapBox!.width;
    
    console.log(`Extreme zoom in: start=${zoomedStart}, width=${zoomedWidth}`);
    
    // Should maintain minimum zoom width and valid position
    expect(zoomedWidth).toBeGreaterThan(0.001); // Minimum 0.1% width
    expect(zoomedStart).toBeGreaterThanOrEqual(-0.1);
    expect(zoomedStart + zoomedWidth).toBeLessThanOrEqual(1.1);
    
    // Reset and test extreme zoom out
    await page.locator('[data-testid="btn-fit-all"]').click();
    await page.waitForTimeout(300);
    
    // Extreme zoom out (should stay at full view)
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(50);
    }

    const zoomedOutWindow = minimap.locator('.cursor-grab, .cursor-grabbing').first();
    const zoomedOutBox = await zoomedOutWindow.boundingBox();
    const zoomedOutWidth = zoomedOutBox!.width / minimapBox!.width;
    
    console.log(`Extreme zoom out width: ${zoomedOutWidth}`);
    
    // Should not exceed full timeline view
    expect(zoomedOutWidth).toBeLessThanOrEqual(1.05); // Allow slight tolerance
    
    await page.screenshot({ path: 'test-results/zoom-extreme-levels.png' });
  });
});
