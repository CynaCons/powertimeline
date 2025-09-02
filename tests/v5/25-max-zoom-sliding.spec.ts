import { test, expect } from '@playwright/test';

test.describe('Maximum Zoom Sliding Tests', () => {
  test('View window should not slide when at maximum zoom level', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Enable dev mode and load test events
    await page.click('button[aria-label="Toggle developer options"]');
    await page.click('button[aria-label="Developer Panel"]');
    await page.click('button:has-text("JFK 1961-63")');
    await page.waitForTimeout(500);
    
    const timelineArea = page.locator('.absolute.inset-0.ml-14');
    const timelineBox = await timelineArea.boundingBox();
    const cursorX = timelineBox!.x + timelineBox!.width * 0.5;
    const cursorY = timelineBox!.y + timelineBox!.height * 0.5;
    
    await page.mouse.move(cursorX, cursorY);
    
    // Zoom in to maximum level (20+ times should hit minimum window width)
    for (let i = 0; i < 25; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(50);
    }
    
    // Record view window position at max zoom
    const maxZoomWindow = page.locator('.bg-transparent.border-blue-500');
    const maxZoomBox = await maxZoomWindow.boundingBox();
    const maxZoomStart = (maxZoomBox!.x - timelineBox!.x) / timelineBox!.width;
    const maxZoomWidth = maxZoomBox!.width / timelineBox!.width;
    
    console.log(`Max zoom reached: start=${maxZoomStart}, width=${maxZoomWidth}`);
    
    // Continue attempting to zoom in (should not change position)
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(50);
    }
    
    // Check view window position after additional zoom attempts
    const finalWindow = page.locator('.bg-transparent.border-blue-500');
    const finalBox = await finalWindow.boundingBox();
    const finalStart = (finalBox!.x - timelineBox!.x) / timelineBox!.width;
    const finalWidth = finalBox!.width / timelineBox!.width;
    
    console.log(`After max zoom attempts: start=${finalStart}, width=${finalWidth}`);
    
    // Position and width should remain stable at max zoom
    const positionDrift = Math.abs(finalStart - maxZoomStart);
    const widthChange = Math.abs(finalWidth - maxZoomWidth);
    
    console.log(`Position drift: ${positionDrift}, width change: ${widthChange}`);
    
    // Should not drift more than 1% of timeline when at max zoom
    expect(positionDrift).toBeLessThan(0.01);
    expect(widthChange).toBeLessThan(0.005); // Width should be very stable
    
    await page.screenshot({ path: 'test-results/max-zoom-no-sliding.png' });
  });

  test('Max zoom maintains cursor position under different cursor locations', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Enable dev mode and load test events
    await page.click('button[aria-label="Toggle developer options"]');
    await page.click('button[aria-label="Developer Panel"]');
    await page.click('button:has-text("JFK 1961-63")');
    await page.waitForTimeout(500);
    
    const timelineArea = page.locator('.absolute.inset-0.ml-14');
    const timelineBox = await timelineArea.boundingBox();
    const cursorY = timelineBox!.y + timelineBox!.height * 0.5;
    
    // Test different cursor positions when hitting max zoom
    const testPositions = [0.2, 0.5, 0.8];
    
    for (const position of testPositions) {
      // Reset zoom
      await page.click('button:has-text("Fit All")');
      await page.waitForTimeout(300);
      
      const cursorX = timelineBox!.x + timelineBox!.width * position;
      await page.mouse.move(cursorX, cursorY);
      
      // Zoom to maximum level
      for (let i = 0; i < 25; i++) {
        await page.mouse.wheel(0, -100);
        await page.waitForTimeout(30);
      }
      
      // Record max zoom state
      const maxZoomWindow = page.locator('.bg-transparent.border-blue-500');
      const maxZoomBox = await maxZoomWindow.boundingBox();
      const maxZoomStart = (maxZoomBox!.x - timelineBox!.x) / timelineBox!.width;
      const maxZoomEnd = (maxZoomBox!.x + maxZoomBox!.width - timelineBox!.x) / timelineBox!.width;
      
      // Try more zoom (should not slide)
      for (let i = 0; i < 15; i++) {
        await page.mouse.wheel(0, -100);
        await page.waitForTimeout(30);
      }
      
      // Check final position
      const finalWindow = page.locator('.bg-transparent.border-blue-500');
      const finalBox = await finalWindow.boundingBox();
      const finalStart = (finalBox!.x - timelineBox!.x) / timelineBox!.width;
      const finalEnd = (finalBox!.x + finalBox!.width - timelineBox!.x) / timelineBox!.width;
      
      console.log(`Position ${position}: maxZoom=[${maxZoomStart.toFixed(3)}, ${maxZoomEnd.toFixed(3)}], final=[${finalStart.toFixed(3)}, ${finalEnd.toFixed(3)}]`);
      
      // Should not slide more than 2% when at max zoom
      const startDrift = Math.abs(finalStart - maxZoomStart);
      const endDrift = Math.abs(finalEnd - maxZoomEnd);
      
      expect(startDrift).toBeLessThan(0.02);
      expect(endDrift).toBeLessThan(0.02);
      
      // Cursor should still be roughly within the view window
      // Allow more tolerance near boundaries when hitting minimum zoom width
      const tolerance = position > 0.9 || position < 0.1 ? 0.15 : 0.05;
      expect(position).toBeGreaterThanOrEqual(finalStart - tolerance);
      expect(position).toBeLessThanOrEqual(finalEnd + tolerance);
    }
    
    await page.screenshot({ path: 'test-results/max-zoom-cursor-positions.png' });
  });

  test('Minimum zoom window width is enforced and stable', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Enable dev mode and load test events
    await page.click('button[aria-label="Toggle developer options"]');
    await page.click('button[aria-label="Developer Panel"]');
    await page.click('button:has-text("JFK 1961-63")');
    await page.waitForTimeout(500);
    
    const timelineArea = page.locator('.absolute.inset-0.ml-14');
    const timelineBox = await timelineArea.boundingBox();
    const cursorX = timelineBox!.x + timelineBox!.width * 0.5;
    const cursorY = timelineBox!.y + timelineBox!.height * 0.5;
    
    await page.mouse.move(cursorX, cursorY);
    
    // Zoom in extremely aggressively (30+ attempts)
    for (let i = 0; i < 35; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(30);
    }
    
    // Check minimum window width is enforced
    const minZoomWindow = page.locator('.bg-transparent.border-blue-500');
    const minZoomBox = await minZoomWindow.boundingBox();
    const minZoomWidth = minZoomBox!.width / timelineBox!.width;
    
    console.log(`Minimum zoom width achieved: ${minZoomWidth}`);
    
    // Should not go below 5% (0.05) as per the code
    expect(minZoomWidth).toBeGreaterThanOrEqual(0.04); // Allow slight tolerance
    expect(minZoomWidth).toBeLessThanOrEqual(0.08); // Should be close to minimum
    
    // Try more zoom attempts - width should remain stable
    const stableStart = (minZoomBox!.x - timelineBox!.x) / timelineBox!.width;
    
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(50);
    }
    
    const finalWindow = page.locator('.bg-transparent.border-blue-500');
    const finalBox = await finalWindow.boundingBox();
    const finalWidth = finalBox!.width / timelineBox!.width;
    const finalStart = (finalBox!.x - timelineBox!.x) / timelineBox!.width;
    
    console.log(`Final minimum zoom: width=${finalWidth}, start=${finalStart}`);
    
    // Width and position should be stable at minimum zoom
    expect(Math.abs(finalWidth - minZoomWidth)).toBeLessThan(0.005);
    expect(Math.abs(finalStart - stableStart)).toBeLessThan(0.01);
    
    await page.screenshot({ path: 'test-results/min-zoom-width-stable.png' });
  });
});