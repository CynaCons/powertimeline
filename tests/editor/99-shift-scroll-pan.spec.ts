import { test, expect } from '@playwright/test';

/**
 * E2E tests for Shift+Scroll horizontal panning
 *
 * These tests verify the timeline's Shift+scroll feature that allows
 * horizontal panning by holding Shift and scrolling vertically.
 *
 * Key bug being tested: Rapid scrolling should NOT cause "rollback" -
 * the view jumping back and forth instead of smoothly panning.
 *
 * We test this by tracking the minimap view window position, which
 * directly reflects the current view state.
 */

test.describe('Shift+Scroll Horizontal Pan', () => {
  test.beforeEach(async ({ page }) => {
    // Load timeline with good event distribution
    await page.goto('/cynacons/timeline/french-revolution');
    await page.waitForSelector('[data-testid="timeline-canvas"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="minimap-container"]', { timeout: 10000 });

    // Give the timeline time to fully initialize
    await page.waitForTimeout(500);
  });

  /**
   * Get the minimap view window element (the draggable rectangle)
   */
  function getMinimapViewWindow(page: any) {
    return page.locator('[data-testid="minimap-container"] .cursor-grab, [data-testid="minimap-container"] .cursor-grabbing').first();
  }

  /**
   * Get the x position of the minimap view window
   */
  async function getViewWindowX(page: any): Promise<number> {
    const viewWindow = getMinimapViewWindow(page);
    const box = await viewWindow.boundingBox();
    return box?.x ?? 0;
  }

  /**
   * Helper to position mouse over timeline canvas center
   */
  async function moveToCanvas(page: any) {
    const canvas = page.locator('[data-testid="timeline-canvas"]');
    const bbox = await canvas.boundingBox();
    if (bbox) {
      await page.mouse.move(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
    }
  }

  /**
   * Helper to zoom in so panning is possible (when fully zoomed out, there's nothing to pan to)
   */
  async function zoomInForPanning(page: any) {
    await moveToCanvas(page);
    // Scroll up (negative deltaY) to zoom in several times
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(300);
  }

  test('minimap view window moves right with Shift+scroll down', async ({ page }) => {
    // Zoom in first so we have room to pan
    await zoomInForPanning(page);

    // Get initial minimap view window position
    const initialX = await getViewWindowX(page);

    // Perform Shift+scroll down (should pan right = view window moves right)
    await page.keyboard.down('Shift');
    await page.mouse.wheel(0, 200);
    await page.keyboard.up('Shift');

    // Wait for view to update
    await page.waitForTimeout(300);

    // Check that minimap view window moved right
    const newX = await getViewWindowX(page);
    expect(newX).toBeGreaterThan(initialX);
  });

  test('minimap view window moves left with Shift+scroll up', async ({ page }) => {
    // Zoom in first
    await zoomInForPanning(page);

    // Pan right first to have room to pan left
    await page.keyboard.down('Shift');
    await page.mouse.wheel(0, 300);
    await page.keyboard.up('Shift');
    await page.waitForTimeout(300);

    // Get position after initial pan
    const initialX = await getViewWindowX(page);

    // Perform Shift+scroll up (should pan left = view window moves left)
    await page.keyboard.down('Shift');
    await page.mouse.wheel(0, -200);
    await page.keyboard.up('Shift');

    // Wait for view to update
    await page.waitForTimeout(300);

    // Check that minimap view window moved left
    const newX = await getViewWindowX(page);
    expect(newX).toBeLessThan(initialX);
  });

  test('CRITICAL: rapid Shift+scroll produces monotonic movement without rollback', async ({ page }) => {
    // This is the critical test for the rollback bug
    // During rapid scrolling, the minimap view window should move monotonically
    // (always in the same direction, never jumping back)

    // Zoom in first so we have room to pan
    await zoomInForPanning(page);

    const positions: number[] = [];

    // Capture initial position
    positions.push(await getViewWindowX(page));

    // Hold Shift and send many rapid scroll events
    await page.keyboard.down('Shift');

    // Send 20 rapid scroll events
    for (let i = 0; i < 20; i++) {
      await page.mouse.wheel(0, 50); // Scroll down = pan right
      await page.waitForTimeout(30); // Very short delay to simulate rapid scrolling

      // Capture position after each scroll
      positions.push(await getViewWindowX(page));
    }

    await page.keyboard.up('Shift');

    // Log positions for debugging
    console.log('Minimap X positions during rapid scroll:', positions);

    // Verify monotonic movement (no rollback)
    // Each position should be >= previous (view window moving right or staying put)
    let rollbackCount = 0;
    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1];
      const current = positions[i];

      if (current < prev) {
        rollbackCount++;
        console.log(`ROLLBACK at index ${i}: ${current} < ${prev}`);
      }
    }

    // Should have zero rollbacks
    expect(rollbackCount).toBe(0);

    // Additionally verify we actually moved (not stuck at boundary)
    const totalMovement = positions[positions.length - 1] - positions[0];
    expect(totalMovement).toBeGreaterThan(0);
  });

  test('continuous rapid scrolling maintains direction throughout', async ({ page }) => {
    // Another rollback test with more events and varying scroll amounts
    await zoomInForPanning(page);

    const positions: { x: number; time: number }[] = [];

    positions.push({ x: await getViewWindowX(page), time: Date.now() });

    await page.keyboard.down('Shift');

    // Varying scroll amounts to simulate real user scrolling
    const scrollAmounts = [40, 60, 30, 80, 50, 70, 40, 55, 45, 65, 35, 75, 50, 60, 40];

    for (const amount of scrollAmounts) {
      await page.mouse.wheel(0, amount);
      await page.waitForTimeout(40); // Simulate fast scrolling

      positions.push({ x: await getViewWindowX(page), time: Date.now() });
    }

    await page.keyboard.up('Shift');

    // Check for any rollbacks
    let maxX = positions[0].x;
    const rollbackEvents: string[] = [];

    for (let i = 1; i < positions.length; i++) {
      if (positions[i].x < maxX - 1) { // 1px tolerance for rounding
        rollbackEvents.push(
          `Position ${i}: x=${positions[i].x} < maxX=${maxX} (delta=${positions[i].x - maxX})`
        );
      }
      maxX = Math.max(maxX, positions[i].x);
    }

    if (rollbackEvents.length > 0) {
      console.log('ROLLBACK EVENTS DETECTED:');
      rollbackEvents.forEach(e => console.log(e));
    }

    expect(rollbackEvents.length).toBe(0);
  });

  test('pan respects left boundary', async ({ page }) => {
    await zoomInForPanning(page);

    // Get minimap container bounds (use first() as there are 2 elements with this testid)
    const minimap = page.locator('[data-testid="minimap-container"]').first();
    const minimapBox = await minimap.boundingBox();

    // Try to pan left past the start
    await page.keyboard.down('Shift');
    for (let i = 0; i < 20; i++) {
      await page.mouse.wheel(0, -100); // Scroll up = pan left
      await page.waitForTimeout(30);
    }
    await page.keyboard.up('Shift');

    await page.waitForTimeout(200);

    // Check that view window didn't go past left edge of minimap
    const finalX = await getViewWindowX(page);
    expect(finalX).toBeGreaterThanOrEqual(minimapBox!.x - 5); // 5px tolerance
  });

  test('pan respects right boundary', async ({ page }) => {
    await zoomInForPanning(page);

    // Get minimap container bounds (use first() as there are 2 elements with this testid)
    const minimap = page.locator('[data-testid="minimap-container"]').first();
    const minimapBox = await minimap.boundingBox();
    const viewWindow = getMinimapViewWindow(page);

    // Pan far to the right
    await page.keyboard.down('Shift');
    for (let i = 0; i < 30; i++) {
      await page.mouse.wheel(0, 100); // Scroll down = pan right
      await page.waitForTimeout(30);
    }
    await page.keyboard.up('Shift');

    await page.waitForTimeout(200);

    // Check that view window didn't go past right edge of minimap
    const viewWindowBox = await viewWindow.boundingBox();
    const viewWindowRight = viewWindowBox!.x + viewWindowBox!.width;
    const minimapRight = minimapBox!.x + minimapBox!.width;

    expect(viewWindowRight).toBeLessThanOrEqual(minimapRight + 5); // 5px tolerance
  });

  test('no horizontal pan without Shift key (should zoom instead)', async ({ page }) => {
    await zoomInForPanning(page);

    // Get initial position
    const initialX = await getViewWindowX(page);
    const viewWindow = getMinimapViewWindow(page);
    const initialBox = await viewWindow.boundingBox();
    const initialWidth = initialBox!.width;

    // Scroll without Shift (should zoom, not pan)
    await page.mouse.wheel(0, 100); // Zoom out
    await page.waitForTimeout(300);

    // View window should have zoomed (width changed) but position should be similar
    const finalBox = await viewWindow.boundingBox();

    // Width should have increased (zoomed out = larger view window)
    expect(finalBox!.width).toBeGreaterThan(initialWidth);
  });

  test('alternating pan directions work without glitches', async ({ page }) => {
    await zoomInForPanning(page);

    // Pan right first
    await page.keyboard.down('Shift');
    await page.mouse.wheel(0, 200);
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);

    const afterRightPan = await getViewWindowX(page);

    // Pan left
    await page.keyboard.down('Shift');
    await page.mouse.wheel(0, -200);
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);

    const afterLeftPan = await getViewWindowX(page);

    // Should have moved left
    expect(afterLeftPan).toBeLessThan(afterRightPan);

    // Pan right again
    await page.keyboard.down('Shift');
    await page.mouse.wheel(0, 200);
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);

    const afterSecondRightPan = await getViewWindowX(page);

    // Should have moved right again
    expect(afterSecondRightPan).toBeGreaterThan(afterLeftPan);
  });
});
