import { test, expect } from '@playwright/test';
import { loginAsTestUser, loadTestTimeline } from '../utils/timelineTestUtils';

test.describe('Timeline Zoom Stability Tests', () => {
  test('Cursor position remains stable during repeated zoom cycles', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Enable dev mode and load test events
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    await page.getByRole('button', { name: 'JFK 1961-63' }).click();
    await page.keyboard.press('Escape'); // Close dev panel
    await page.waitForTimeout(500);
    
    // Position cursor at fixed location (50% across timeline)
    const timelineArea = page.locator('.absolute.inset-0.ml-14');
    const timelineBox = await timelineArea.boundingBox();
    const cursorX = timelineBox!.x + timelineBox!.width * 0.5;
    const cursorY = timelineBox!.y + timelineBox!.height * 0.5;
    
    // Get initial minimap view window position
    const initialViewWindow = page.locator('[data-testid="timeline-minimap"]').locator('.cursor-grab, .cursor-grabbing').first();
    const initialBox = await initialViewWindow.boundingBox();
    const initialCenter = initialBox!.x + initialBox!.width * 0.5;
    
    console.log(`Initial view window center: ${initialCenter}`);
    
    // Perform 10 zoom cycles (in then out)
    for (let i = 0; i < 10; i++) {
      // Zoom in at cursor position
      await page.mouse.move(cursorX, cursorY);
      await page.mouse.wheel(0, -100); // Zoom in
      await page.waitForTimeout(100);
      
      // Zoom out at same cursor position
      await page.mouse.move(cursorX, cursorY);
      await page.mouse.wheel(0, 100); // Zoom out
      await page.waitForTimeout(100);
    }
    
    // Check final view window position - should be close to initial
    const finalViewWindow = page.locator('[data-testid="timeline-minimap"]').locator('.cursor-grab, .cursor-grabbing').first();
    const finalBox = await finalViewWindow.boundingBox();
    const finalCenter = finalBox!.x + finalBox!.width * 0.5;
    
    console.log(`Final view window center: ${finalCenter}`);
    
    // Allow small drift (within 10% of timeline width)
    const allowedDrift = timelineBox!.width * 0.1;
    const actualDrift = Math.abs(finalCenter - initialCenter);
    
    console.log(`Drift: ${actualDrift}px, allowed: ${allowedDrift}px`);
    expect(actualDrift).toBeLessThan(allowedDrift);
    
    await page.screenshot({ path: 'test-results/zoom-stability-cursor-position.png' });
  });

  test('Zoom behavior at timeline boundaries', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Enable dev mode and load test events
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    await page.getByRole('button', { name: 'JFK 1961-63' }).click();
    await page.keyboard.press('Escape'); // Close dev panel
    await page.waitForTimeout(500);
    
    const timelineArea = page.locator('.absolute.inset-0.ml-14');
    const timelineBox = await timelineArea.boundingBox();
    
    // Test zoom at left boundary (10% from left edge)
    const leftCursorX = timelineBox!.x + timelineBox!.width * 0.1;
    const cursorY = timelineBox!.y + timelineBox!.height * 0.5;
    
    await page.mouse.move(leftCursorX, cursorY);
    
    // Zoom in multiple times at left edge
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(100);
    }
    
    // Check view window didn't stick to left edge
    const leftViewWindow = page.locator('[data-testid="timeline-minimap"]').locator('.cursor-grab, .cursor-grabbing').first();
    const leftBox = await leftViewWindow.boundingBox();
    const leftPosition = (leftBox!.x - timelineBox!.x) / timelineBox!.width;
    
    console.log(`Left boundary zoom position: ${leftPosition}`);
    expect(leftPosition).toBeGreaterThan(0.05); // Should not stick to absolute left
    
    // Reset and test right boundary
    await page.getByRole('button', { name: 'Fit All' }).click();
    await page.waitForTimeout(300);
    
    // Test zoom at right boundary (90% from left edge)
    const rightCursorX = timelineBox!.x + timelineBox!.width * 0.9;
    await page.mouse.move(rightCursorX, cursorY);
    
    // Zoom in multiple times at right edge
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(100);
    }
    
    // Check view window didn't stick to right edge
    const rightViewWindow = page.locator('[data-testid="timeline-minimap"]').locator('.cursor-grab, .cursor-grabbing').first();
    const rightBox = await rightViewWindow.boundingBox();
    const rightPosition = (rightBox!.x + rightBox!.width - timelineBox!.x) / timelineBox!.width;
    
    console.log(`Right boundary zoom position: ${rightPosition}`);
    expect(rightPosition).toBeLessThan(0.95); // Should not stick to absolute right
    
    await page.screenshot({ path: 'test-results/zoom-boundary-behavior.png' });
  });

  test('Zoom reversibility test', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Enable dev mode and load test events
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    await page.getByRole('button', { name: 'JFK 1961-63' }).click();
    await page.keyboard.press('Escape'); // Close dev panel
    await page.waitForTimeout(500);
    
    const timelineArea = page.locator('.absolute.inset-0.ml-14');
    const timelineBox = await timelineArea.boundingBox();
    const cursorX = timelineBox!.x + timelineBox!.width * 0.5;
    const cursorY = timelineBox!.y + timelineBox!.height * 0.5;
    
    // Record initial view window
    const initialViewWindow = page.locator('[data-testid="timeline-minimap"]').locator('.cursor-grab, .cursor-grabbing').first();
    const initialBox = await initialViewWindow.boundingBox();
    const initialLeft = initialBox!.x;
    const initialWidth = initialBox!.width;
    
    console.log(`Initial: left=${initialLeft}, width=${initialWidth}`);
    
    await page.mouse.move(cursorX, cursorY);
    
    // Zoom in 5 times
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(100);
    }
    
    // Zoom out 5 times (should return to original)
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(100);
    }
    
    // Check final view window
    const finalViewWindow = page.locator('[data-testid="timeline-minimap"]').locator('.cursor-grab, .cursor-grabbing').first();
    const finalBox = await finalViewWindow.boundingBox();
    const finalLeft = finalBox!.x;
    const finalWidth = finalBox!.width;
    
    console.log(`Final: left=${finalLeft}, width=${finalWidth}`);
    
    // Allow 5% tolerance for position and width
    const positionTolerance = timelineBox!.width * 0.05;
    const widthTolerance = initialWidth * 0.05;
    
    const positionDrift = Math.abs(finalLeft - initialLeft);
    const widthDrift = Math.abs(finalWidth - initialWidth);
    
    console.log(`Position drift: ${positionDrift}px (tolerance: ${positionTolerance}px)`);
    console.log(`Width drift: ${widthDrift}px (tolerance: ${widthTolerance}px)`);
    
    expect(positionDrift).toBeLessThan(positionTolerance);
    expect(widthDrift).toBeLessThan(widthTolerance);
    
    await page.screenshot({ path: 'test-results/zoom-reversibility.png' });
  });

  test('Rapid zoom changes do not cause view window corruption', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Enable dev mode and load test events
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    await page.getByRole('button', { name: 'JFK 1961-63' }).click();
    await page.keyboard.press('Escape'); // Close dev panel
    await page.waitForTimeout(500);
    
    const timelineArea = page.locator('.absolute.inset-0.ml-14');
    const timelineBox = await timelineArea.boundingBox();
    const cursorX = timelineBox!.x + timelineBox!.width * 0.5;
    const cursorY = timelineBox!.y + timelineBox!.height * 0.5;
    
    await page.mouse.move(cursorX, cursorY);
    
    // Rapid alternating zoom in/out
    for (let i = 0; i < 20; i++) {
      const deltaY = i % 2 === 0 ? -50 : 50; // Alternate in/out
      await page.mouse.wheel(0, deltaY);
      await page.waitForTimeout(50); // Minimal delay
    }
    
    // Verify view window is still valid
    const viewWindow = page.locator('[data-testid="timeline-minimap"]').locator('.cursor-grab, .cursor-grabbing').first();
    await expect(viewWindow).toBeVisible();
    
    const box = await viewWindow.boundingBox();
    const position = (box!.x - timelineBox!.x) / timelineBox!.width;
    const width = box!.width / timelineBox!.width;
    
    console.log(`Final rapid zoom: position=${position}, width=${width}`);
    
    // View window should be within valid bounds
    expect(position).toBeGreaterThanOrEqual(0);
    expect(position + width).toBeLessThanOrEqual(1);
    expect(width).toBeGreaterThan(0.01); // Minimum zoom width
    expect(width).toBeLessThanOrEqual(1); // Maximum zoom width
    
    await page.screenshot({ path: 'test-results/zoom-rapid-changes.png' });
  });

  test('Zoom with cursor at different screen positions', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Enable dev mode and load test events
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    await page.getByRole('button', { name: 'JFK 1961-63' }).click();
    await page.keyboard.press('Escape'); // Close dev panel
    await page.waitForTimeout(500);
    
    const timelineArea = page.locator('.absolute.inset-0.ml-14');
    const timelineBox = await timelineArea.boundingBox();
    const cursorY = timelineBox!.y + timelineBox!.height * 0.5;
    
    // Test cursor positions: 25%, 50%, 75% across timeline
    const testPositions = [0.25, 0.5, 0.75];
    
    for (const position of testPositions) {
      // Reset zoom
      await page.getByRole('button', { name: 'Fit All' }).click();
      await page.waitForTimeout(300);
      
      const cursorX = timelineBox!.x + timelineBox!.width * position;
      await page.mouse.move(cursorX, cursorY);
      
      // Record initial view window
      const initialViewWindow = page.locator('[data-testid="timeline-minimap"]').locator('.cursor-grab, .cursor-grabbing').first();
      const initialBox = await initialViewWindow.boundingBox();
      // Calculate initial view center for reference (used for debugging)
      const initialViewCenter = (initialBox!.x + initialBox!.width * 0.5 - timelineBox!.x) / timelineBox!.width;
      void initialViewCenter; // Mark as used for debugging purposes
      
      // Zoom in 3 times
      for (let i = 0; i < 3; i++) {
        await page.mouse.wheel(0, -100);
        await page.waitForTimeout(100);
      }
      
      // Check cursor is still over the same relative timeline position
      const finalViewWindow = page.locator('[data-testid="timeline-minimap"]').locator('.cursor-grab, .cursor-grabbing').first();
      const finalBox = await finalViewWindow.boundingBox();
      const finalViewStart = (finalBox!.x - timelineBox!.x) / timelineBox!.width;
      const finalViewEnd = (finalBox!.x + finalBox!.width - timelineBox!.x) / timelineBox!.width;
      
      console.log(`Position ${position}: cursor should be within view [${finalViewStart}, ${finalViewEnd}]`);
      
      // Cursor position should be within the final view window
      expect(position).toBeGreaterThanOrEqual(finalViewStart - 0.05); // 5% tolerance
      expect(position).toBeLessThanOrEqual(finalViewEnd + 0.05);
    }
    
    await page.screenshot({ path: 'test-results/zoom-cursor-positions.png' });
  });
});