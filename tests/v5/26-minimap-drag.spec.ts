import { test, expect } from '@playwright/test';

test.describe('Timeline Minimap Drag Tests', () => {
  test('View window can be dragged to slide timeline position', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Enable dev mode and load test events
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    await page.getByRole('button', { name: 'JFK 1961-63' }).click();
    await page.keyboard.press('Escape'); // Close dev panel
    await page.waitForTimeout(500);
    
    // Zoom in to make view window smaller for easier dragging
    const timelineArea = page.locator('.absolute.inset-0.ml-14');
    const timelineBox = await timelineArea.boundingBox();
    const centerX = timelineBox!.x + timelineBox!.width * 0.5;
    const centerY = timelineBox!.y + timelineBox!.height * 0.5;
    
    await page.mouse.move(centerX, centerY);
    
    // Zoom in to create a smaller view window
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(100);
    }
    
    // Get initial view window position
    const initialViewWindow = page.locator('[data-testid="timeline-minimap"]').locator('.cursor-grab, .cursor-grabbing');
    const initialBox = await initialViewWindow.boundingBox();
    const initialStart = (initialBox!.x - timelineBox!.x) / timelineBox!.width;
    
    console.log(`Initial view window position: ${initialStart}`);
    
    // Drag the view window to the right
    const viewWindowCenterX = initialBox!.x + initialBox!.width / 2;
    const viewWindowCenterY = initialBox!.y + initialBox!.height / 2;
    const dragDistance = timelineBox!.width * 0.2; // Drag 20% of timeline width
    
    await page.mouse.move(viewWindowCenterX, viewWindowCenterY);
    await page.mouse.down();
    await page.mouse.move(viewWindowCenterX + dragDistance, viewWindowCenterY, { steps: 10 });
    await page.mouse.up();
    
    await page.waitForTimeout(200);
    
    // Check final view window position
    const finalViewWindow = page.locator('[data-testid="timeline-minimap"]').locator('.cursor-grab, .cursor-grabbing');
    const finalBox = await finalViewWindow.boundingBox();
    const finalStart = (finalBox!.x - timelineBox!.x) / timelineBox!.width;
    
    console.log(`Final view window position: ${finalStart}`);
    console.log(`Position change: ${finalStart - initialStart}`);
    
    // Should have moved to the right significantly
    expect(finalStart).toBeGreaterThan(initialStart + 0.1);
    
    await page.screenshot({ path: 'test-results/minimap-drag-right.png' });
  });

  test('View window drag respects timeline boundaries', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Enable dev mode and load test events
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    await page.getByRole('button', { name: 'JFK 1961-63' }).click();
    await page.keyboard.press('Escape'); // Close dev panel
    await page.waitForTimeout(500);
    
    const timelineArea = page.locator('.absolute.inset-0.ml-14');
    const timelineBox = await timelineArea.boundingBox();
    const centerX = timelineBox!.x + timelineBox!.width * 0.5;
    const centerY = timelineBox!.y + timelineBox!.height * 0.5;
    
    await page.mouse.move(centerX, centerY);
    
    // Zoom in to create a smaller view window
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(100);
    }
    
    // Test dragging beyond right boundary
    const viewWindow = page.locator('[data-testid="timeline-minimap"]').locator('.cursor-grab, .cursor-grabbing');
    const box = await viewWindow.boundingBox();
    const viewWindowCenterX = box!.x + box!.width / 2;
    const viewWindowCenterY = box!.y + box!.height / 2;
    
    // Drag way beyond right boundary
    const extremeDragDistance = timelineBox!.width; // Drag full timeline width
    
    await page.mouse.move(viewWindowCenterX, viewWindowCenterY);
    await page.mouse.down();
    await page.mouse.move(viewWindowCenterX + extremeDragDistance, viewWindowCenterY, { steps: 15 });
    await page.mouse.up();
    
    await page.waitForTimeout(200);
    
    // Check final position doesn't exceed boundaries
    const finalViewWindow = page.locator('[data-testid="timeline-minimap"]').locator('.cursor-grab, .cursor-grabbing');
    const finalBox = await finalViewWindow.boundingBox();
    const finalEnd = (finalBox!.x + finalBox!.width - timelineBox!.x) / timelineBox!.width;
    
    console.log(`Final view window end position: ${finalEnd}`);
    
    // Should not exceed right boundary
    expect(finalEnd).toBeLessThanOrEqual(1.02); // Allow slight tolerance
    
    // Test dragging beyond left boundary
    await page.mouse.move(viewWindowCenterX, viewWindowCenterY);
    await page.mouse.down();
    await page.mouse.move(viewWindowCenterX - extremeDragDistance * 2, viewWindowCenterY, { steps: 15 });
    await page.mouse.up();
    
    await page.waitForTimeout(200);
    
    const leftBoundaryWindow = page.locator('[data-testid="timeline-minimap"]').locator('.cursor-grab, .cursor-grabbing');
    const leftBox = await leftBoundaryWindow.boundingBox();
    const leftStart = (leftBox!.x - timelineBox!.x) / timelineBox!.width;
    
    console.log(`Final view window start position: ${leftStart}`);
    
    // Should not exceed left boundary
    expect(leftStart).toBeGreaterThanOrEqual(-0.02); // Allow slight tolerance
    
    await page.screenshot({ path: 'test-results/minimap-drag-boundaries.png' });
  });

  test('Drag provides visual feedback with cursor changes', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Enable dev mode and load test events
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    await page.getByRole('button', { name: 'JFK 1961-63' }).click();
    await page.keyboard.press('Escape'); // Close dev panel
    await page.waitForTimeout(500);
    
    const timelineArea = page.locator('.absolute.inset-0.ml-14');
    const timelineBox = await timelineArea.boundingBox();
    const centerX = timelineBox!.x + timelineBox!.width * 0.5;
    const centerY = timelineBox!.y + timelineBox!.height * 0.5;
    
    await page.mouse.move(centerX, centerY);
    
    // Zoom in to create a view window
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(100);
    }
    
    // Check hover cursor on view window
    const viewWindow = page.locator('[data-testid="timeline-minimap"]').locator('.cursor-grab, .cursor-grabbing');
    const box = await viewWindow.boundingBox();
    const viewWindowCenterX = box!.x + box!.width / 2;
    const viewWindowCenterY = box!.y + box!.height / 2;
    
    await page.mouse.move(viewWindowCenterX, viewWindowCenterY);
    
    // Take screenshot showing grab cursor
    await page.screenshot({ path: 'test-results/minimap-grab-cursor.png' });
    
    // Start drag and check grabbing cursor
    await page.mouse.down();
    await page.waitForTimeout(100);
    
    await page.screenshot({ path: 'test-results/minimap-grabbing-cursor.png' });
    
    // Move slightly to simulate drag
    await page.mouse.move(viewWindowCenterX + 50, viewWindowCenterY, { steps: 3 });
    await page.waitForTimeout(100);
    
    await page.mouse.up();
    await page.waitForTimeout(100);
    
    // Should return to normal cursor
    await page.screenshot({ path: 'test-results/minimap-normal-cursor.png' });
  });
});