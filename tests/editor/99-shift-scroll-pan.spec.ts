import { test, expect } from '@playwright/test';

/**
 * E2E tests for Shift+Scroll horizontal panning
 *
 * These tests verify the timeline's Shift+scroll feature that allows
 * horizontal panning by holding Shift and scrolling vertically.
 *
 * Key bug being tested: Rapid scrolling should NOT cause "rollback" -
 * the view jumping back and forth instead of smoothly panning.
 */

test.describe('Shift+Scroll Horizontal Pan', () => {
  test.beforeEach(async ({ page }) => {
    // Load a public timeline with good event distribution
    await page.goto('/cynacons/timeline/french-revolution');
    await page.waitForSelector('[data-testid="timeline-axis"]', { timeout: 10000 });

    // Give the timeline time to fully initialize
    await page.waitForTimeout(1000);
  });

  /**
   * Helper function to get current view window from telemetry
   */
  async function getViewWindow(page: any) {
    return await page.evaluate(() => {
      const telemetry = (window as any).__ccTelemetry;
      return telemetry?.viewWindow || null;
    });
  }

  test('basic pan right with Shift+scroll down', async ({ page }) => {
    // Get initial view position
    const initialView = await getViewWindow(page);
    expect(initialView).not.toBeNull();
    const initialStart = initialView.viewStart;

    // Perform Shift+scroll down (should pan right)
    await page.keyboard.down('Shift');
    await page.mouse.wheel(0, 100); // Positive deltaY = scroll down
    await page.keyboard.up('Shift');

    // Wait for view to update
    await page.waitForTimeout(200);

    // Check that view panned right (viewStart increased)
    const newView = await getViewWindow(page);
    expect(newView.viewStart).toBeGreaterThan(initialStart);
  });

  test('basic pan left with Shift+scroll up', async ({ page }) => {
    // First pan right to have room to pan left
    await page.keyboard.down('Shift');
    await page.mouse.wheel(0, 200);
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);

    // Get position after initial pan
    const initialView = await getViewWindow(page);
    const initialStart = initialView.viewStart;

    // Perform Shift+scroll up (should pan left)
    await page.keyboard.down('Shift');
    await page.mouse.wheel(0, -100); // Negative deltaY = scroll up
    await page.keyboard.up('Shift');

    // Wait for view to update
    await page.waitForTimeout(200);

    // Check that view panned left (viewStart decreased)
    const newView = await getViewWindow(page);
    expect(newView.viewStart).toBeLessThan(initialStart);
  });

  test('rapid Shift+scroll maintains direction without rollback', async ({ page }) => {
    // This is the critical test for the rollback bug
    // During rapid scrolling, viewStart should move monotonically

    const positions: number[] = [];

    // Capture initial position
    const initialView = await getViewWindow(page);
    positions.push(initialView.viewStart);

    // Hold Shift and send rapid scroll events
    await page.keyboard.down('Shift');

    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 50); // Rapid scroll down = pan right
      await page.waitForTimeout(50); // Minimal delay between scrolls

      const view = await getViewWindow(page);
      positions.push(view.viewStart);
    }

    await page.keyboard.up('Shift');

    // Verify monotonic movement (no rollback)
    // Each position should be >= previous (allowing for same position if at boundary)
    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1];
      const current = positions[i];

      // If there's rollback, current will be less than a previous position
      expect(current).toBeGreaterThanOrEqual(prev,
        `Rollback detected at index ${i}: ${current} < ${prev}. Positions: ${positions.join(', ')}`
      );
    }

    // Additionally verify we actually moved (not stuck at boundary)
    const totalMovement = positions[positions.length - 1] - positions[0];
    expect(totalMovement).toBeGreaterThan(0);
  });

  test('pan respects left boundary (cannot pan before start)', async ({ page }) => {
    // Get initial view (should be at or near start)
    const initialView = await getViewWindow(page);

    // Try to pan left past the start
    await page.keyboard.down('Shift');
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, -100); // Scroll up = pan left
    }
    await page.keyboard.up('Shift');

    await page.waitForTimeout(200);

    // Check that viewStart didn't go below 0
    const finalView = await getViewWindow(page);
    expect(finalView.viewStart).toBeGreaterThanOrEqual(0);
  });

  test('pan respects right boundary (cannot pan past end)', async ({ page }) => {
    // Pan far to the right
    await page.keyboard.down('Shift');
    for (let i = 0; i < 20; i++) {
      await page.mouse.wheel(0, 100); // Scroll down = pan right
    }
    await page.keyboard.up('Shift');

    await page.waitForTimeout(200);

    // Check that viewEnd didn't go above 1
    const finalView = await getViewWindow(page);
    expect(finalView.viewEnd).toBeLessThanOrEqual(1);
  });

  test('pan amount is proportional to scroll delta', async ({ page }) => {
    // Get initial position
    const initialView = await getViewWindow(page);
    const initialStart = initialView.viewStart;

    // Small scroll
    await page.keyboard.down('Shift');
    await page.mouse.wheel(0, 50);
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);

    const afterSmallScroll = await getViewWindow(page);
    const smallDelta = afterSmallScroll.viewStart - initialStart;

    // Reset to initial position (pan back)
    const panBackAmount = -(afterSmallScroll.viewStart - initialStart);
    const scrollBackAmount = Math.round(panBackAmount * 1000); // Approximate reverse
    await page.keyboard.down('Shift');
    await page.mouse.wheel(0, scrollBackAmount);
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);

    // Large scroll (2x the small scroll)
    await page.keyboard.down('Shift');
    await page.mouse.wheel(0, 100);
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);

    const afterLargeScroll = await getViewWindow(page);
    const largeDelta = afterLargeScroll.viewStart - initialView.viewStart;

    // Large delta should be roughly 2x small delta (allowing for some variance)
    const ratio = largeDelta / smallDelta;
    expect(ratio).toBeGreaterThan(1.5);
    expect(ratio).toBeLessThan(2.5);
  });

  test('continuous scrolling produces smooth monotonic movement', async ({ page }) => {
    // Track positions during continuous scrolling session
    const positions: { time: number; viewStart: number }[] = [];

    const initialView = await getViewWindow(page);
    positions.push({ time: Date.now(), viewStart: initialView.viewStart });

    // Simulate continuous scrolling with varying speeds
    await page.keyboard.down('Shift');

    const scrollDeltas = [30, 50, 40, 60, 35, 45, 55, 40, 50, 30];

    for (const delta of scrollDeltas) {
      await page.mouse.wheel(0, delta);
      await page.waitForTimeout(80); // Realistic scroll interval

      const view = await getViewWindow(page);
      positions.push({ time: Date.now(), viewStart: view.viewStart });
    }

    await page.keyboard.up('Shift');

    // Verify monotonic increase (no position decreases)
    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1];
      const current = positions[i];

      expect(current.viewStart).toBeGreaterThanOrEqual(prev.viewStart,
        `Position decreased at index ${i} (time: ${current.time - positions[0].time}ms): ` +
        `${current.viewStart} < ${prev.viewStart}`
      );
    }

    // Verify steady progress (positions actually changed)
    const uniquePositions = new Set(positions.map(p => p.viewStart));
    expect(uniquePositions.size).toBeGreaterThan(1);
  });

  test('alternating scroll directions work correctly', async ({ page }) => {
    // Pan right to middle of timeline first
    await page.keyboard.down('Shift');
    await page.mouse.wheel(0, 200);
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);

    const startView = await getViewWindow(page);
    const startPos = startView.viewStart;

    // Pan right
    await page.keyboard.down('Shift');
    await page.mouse.wheel(0, 100);
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);

    const afterRight = await getViewWindow(page);
    expect(afterRight.viewStart).toBeGreaterThan(startPos);

    // Pan left
    await page.keyboard.down('Shift');
    await page.mouse.wheel(0, -100);
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);

    const afterLeft = await getViewWindow(page);
    expect(afterLeft.viewStart).toBeLessThan(afterRight.viewStart);

    // Should be back near starting position
    expect(Math.abs(afterLeft.viewStart - startPos)).toBeLessThan(0.1);
  });

  test('no horizontal scroll without Shift key', async ({ page }) => {
    // Get initial position
    const initialView = await getViewWindow(page);
    const initialStart = initialView.viewStart;

    // Scroll without Shift (normal vertical scroll)
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(200);

    // View should not have panned horizontally
    const finalView = await getViewWindow(page);
    expect(finalView.viewStart).toBe(initialStart);
  });
});
