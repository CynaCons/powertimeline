import { test, expect } from '@playwright/test';

/**
 * v0.8.3 Interaction Model Tests
 *
 * Tests the new interaction model with:
 * - Default click+drag = selection zoom
 * - Space+drag = pan
 * - Shift+scroll = horizontal pan
 * - Plain wheel = zoom toward cursor
 */

test.describe('v0.8.3 Interaction Model Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cynacons/timeline/french-revolution');
    await page.waitForSelector('[data-testid="timeline-canvas"]', { timeout: 10000 });

    // Wait for layout to stabilize
    await page.waitForTimeout(500);
  });

  test('T98.1: Selection zoom - click+drag creates selection and zooms', async ({ page }) => {
    // Get canvas element
    const canvas = page.locator('[data-testid="timeline-canvas"]');
    const bbox = await canvas.boundingBox();
    expect(bbox).not.toBeNull();

    // Get initial view window
    const initialView = await page.evaluate(() => {
      return (window as any).__ccTelemetry?.viewWindow;
    });
    expect(initialView).toBeDefined();

    // Start drag from left side of canvas
    const startX = bbox!.x + bbox!.width * 0.3;
    const startY = bbox!.y + bbox!.height / 2;
    await page.mouse.move(startX, startY);

    // Check cursor is crosshair (default cursor for selection)
    const cursorBefore = await canvas.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });
    expect(cursorBefore).toBe('crosshair');

    // Click and drag to create selection
    await page.mouse.down();

    // Drag to right side (>20px to trigger zoom)
    const endX = bbox!.x + bbox!.width * 0.7;
    const endY = startY;
    await page.mouse.move(endX, endY, { steps: 10 });

    // Check for selection overlay (blue semi-transparent)
    const selectionVisible = await page.evaluate(() => {
      const overlay = document.querySelector('[data-testid="selection-overlay"]');
      if (!overlay) return false;
      const style = window.getComputedStyle(overlay);
      return style.display !== 'none' && parseFloat(style.opacity || '0') > 0;
    });
    expect(selectionVisible).toBe(true);

    // Release mouse to trigger zoom
    await page.mouse.up();

    // Wait for zoom animation
    await page.waitForTimeout(300);

    // Get new view window
    const newView = await page.evaluate(() => {
      return (window as any).__ccTelemetry?.viewWindow;
    });
    expect(newView).toBeDefined();

    // Verify zoom occurred (view window should be smaller than before)
    const initialWidth = initialView.end - initialView.start;
    const newWidth = newView.end - newView.start;
    expect(newWidth).toBeLessThan(initialWidth * 0.9); // Should be significantly zoomed in

    // Verify selection overlay is hidden after zoom
    const overlayHidden = await page.evaluate(() => {
      const overlay = document.querySelector('[data-testid="selection-overlay"]');
      if (!overlay) return true;
      const style = window.getComputedStyle(overlay);
      return style.display === 'none' || parseFloat(style.opacity || '0') === 0;
    });
    expect(overlayHidden).toBe(true);
  });

  test('T98.2: Space+drag pan - pans timeline horizontally', async ({ page }) => {
    // Get canvas element
    const canvas = page.locator('[data-testid="timeline-canvas"]');
    const bbox = await canvas.boundingBox();
    expect(bbox).not.toBeNull();

    // Position mouse in center of canvas
    const centerX = bbox!.x + bbox!.width / 2;
    const centerY = bbox!.y + bbox!.height / 2;
    await page.mouse.move(centerX, centerY);

    // Zoom in first so we can pan (can't pan when fully zoomed out)
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(300);

    // Get initial view window (after zoom)
    const initialView = await page.evaluate(() => {
      return (window as any).__ccTelemetry?.viewWindow;
    });
    expect(initialView).toBeDefined();
    expect(initialView.end - initialView.start).toBeLessThan(1); // Confirm zoomed in

    // Press and hold Space key
    await page.keyboard.down('Space');

    // Wait a bit for cursor change
    await page.waitForTimeout(50);

    // Check cursor changed to grab
    const cursorAfterSpace = await canvas.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });
    expect(cursorAfterSpace).toBe('grab');

    // Click and drag
    await page.mouse.down();

    // Wait a bit to check grabbing cursor
    await page.waitForTimeout(50);

    // Check cursor changed to grabbing
    const cursorDragging = await canvas.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });
    expect(cursorDragging).toBe('grabbing');

    // Drag to the right (pan left)
    const dragDistance = 200;
    await page.mouse.move(centerX + dragDistance, centerY, { steps: 10 });

    // Release mouse
    await page.mouse.up();

    // Release Space key
    await page.keyboard.up('Space');

    // Wait for pan to complete
    await page.waitForTimeout(100);

    // Get new view window
    const newView = await page.evaluate(() => {
      return (window as any).__ccTelemetry?.viewWindow;
    });
    expect(newView).toBeDefined();

    // Verify pan occurred (dragging right should move view left, so start/end decrease)
    expect(newView.start).toBeLessThan(initialView.start);
    expect(newView.end).toBeLessThan(initialView.end);

    // Verify view width stayed the same (pan, not zoom)
    const initialWidth = initialView.end - initialView.start;
    const newWidth = newView.end - newView.start;
    expect(Math.abs(newWidth - initialWidth)).toBeLessThan(0.001); // Allow small floating point error

    // Verify cursor returned to default
    const cursorAfter = await canvas.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });
    expect(cursorAfter).toBe('crosshair'); // Default is crosshair for selection
  });

  // T98.3 (Shift+scroll pan) removed - covered by tests/editor/99-shift-scroll-pan.spec.ts

  test('T98.4: Plain wheel zoom - zooms toward cursor position', async ({ page }) => {
    // Get canvas element
    const canvas = page.locator('[data-testid="timeline-canvas"]');
    const bbox = await canvas.boundingBox();
    expect(bbox).not.toBeNull();

    // Wait for telemetry to be available
    await page.waitForFunction(() => (window as any).__ccTelemetry?.viewWindow, { timeout: 5000 });

    // Get initial view window
    const initialView = await page.evaluate(() => {
      return (window as any).__ccTelemetry?.viewWindow;
    });
    expect(initialView).toBeDefined();

    // Position mouse at 25% from left of canvas (specific position to test zoom centering)
    const targetX = bbox!.x + bbox!.width * 0.25;
    const targetY = bbox!.y + bbox!.height / 2;
    await page.mouse.move(targetX, targetY);

    // Calculate normalized position on canvas (0 to 1)
    const normalizedX = 0.25;

    // Calculate timeline position under cursor
    const initialWidth = initialView.end - initialView.start;
    const initialCursorPos = initialView.start + normalizedX * initialWidth;

    // Scroll up to zoom in (negative deltaY)
    await page.mouse.wheel(0, -100);

    // Wait for zoom to complete
    await page.waitForTimeout(100);

    // Get new view window
    const newView = await page.evaluate(() => {
      return (window as any).__ccTelemetry?.viewWindow;
    });
    expect(newView).toBeDefined();

    // Verify zoom occurred (view width should decrease)
    const newWidth = newView.end - newView.start;
    expect(newWidth).toBeLessThan(initialWidth * 0.95); // Should be zoomed in

    // Verify the point under cursor stayed relatively stable
    const newCursorPos = newView.start + normalizedX * newWidth;
    const drift = Math.abs(newCursorPos - initialCursorPos);

    // Allow some drift but it should be minimal (less than 5% of initial width)
    expect(drift).toBeLessThan(initialWidth * 0.05);

    // Now test zoom out
    const viewBeforeZoomOut = newView;

    // Scroll down to zoom out (positive deltaY)
    await page.mouse.wheel(0, 100);

    await page.waitForTimeout(100);

    const viewAfterZoomOut = await page.evaluate(() => {
      return (window as any).__ccTelemetry?.viewWindow;
    });
    expect(viewAfterZoomOut).toBeDefined();

    // Verify zoom out occurred (view width should increase)
    const widthAfterZoomOut = viewAfterZoomOut.end - viewAfterZoomOut.start;
    expect(widthAfterZoomOut).toBeGreaterThan(newWidth * 1.05);
  });

  test('T98.5: Boundary constraints - pan stops at 0 and 1', async ({ page }) => {
    // Get canvas element
    const canvas = page.locator('[data-testid="timeline-canvas"]');
    const bbox = await canvas.boundingBox();
    expect(bbox).not.toBeNull();

    // First, zoom in to make boundaries reachable
    const centerX = bbox!.x + bbox!.width / 2;
    const centerY = bbox!.y + bbox!.height / 2;
    await page.mouse.move(centerX, centerY);

    // Zoom in significantly
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(50);
    }

    // Get view after zoom
    const viewAfterZoom = await page.evaluate(() => {
      return (window as any).__ccTelemetry?.viewWindow;
    });
    expect(viewAfterZoom).toBeDefined();

    // Try to pan left beyond 0 using Space+drag
    await page.keyboard.down('Space');
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();

    // Drag left (pan right toward 0)
    await page.mouse.move(centerX - 500, centerY, { steps: 10 });
    await page.mouse.up();
    await page.keyboard.up('Space');

    await page.waitForTimeout(100);

    const viewAtLeftBoundary = await page.evaluate(() => {
      return (window as any).__ccTelemetry?.viewWindow;
    });
    expect(viewAtLeftBoundary).toBeDefined();

    // Verify we can't go below 0
    expect(viewAtLeftBoundary.start).toBeGreaterThanOrEqual(0);

    // Now try to pan right beyond 1
    await page.keyboard.down('Space');
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();

    // Drag right (pan left toward 1)
    await page.mouse.move(centerX + 500, centerY, { steps: 10 });
    await page.mouse.up();
    await page.keyboard.up('Space');

    await page.waitForTimeout(100);

    const viewAtRightBoundary = await page.evaluate(() => {
      return (window as any).__ccTelemetry?.viewWindow;
    });
    expect(viewAtRightBoundary).toBeDefined();

    // Verify we can't go above 1
    expect(viewAtRightBoundary.end).toBeLessThanOrEqual(1);
  });

  test('T98.6: Small selection (<20px) does not trigger zoom', async ({ page }) => {
    // Get canvas element
    const canvas = page.locator('[data-testid="timeline-canvas"]');
    const bbox = await canvas.boundingBox();
    expect(bbox).not.toBeNull();

    // Get initial view window
    const initialView = await page.evaluate(() => {
      return (window as any).__ccTelemetry?.viewWindow;
    });
    expect(initialView).toBeDefined();

    // Start drag
    const startX = bbox!.x + bbox!.width / 2;
    const startY = bbox!.y + bbox!.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();

    // Drag only 10px (less than 20px threshold)
    await page.mouse.move(startX + 10, startY, { steps: 5 });
    await page.mouse.up();

    // Wait a bit
    await page.waitForTimeout(100);

    // Get new view window
    const newView = await page.evaluate(() => {
      return (window as any).__ccTelemetry?.viewWindow;
    });
    expect(newView).toBeDefined();

    // Verify no zoom occurred (view should be identical)
    expect(newView.start).toBe(initialView.start);
    expect(newView.end).toBe(initialView.end);
  });

  test('T98.7: Cursor styles update correctly for each mode', async ({ page }) => {
    const canvas = page.locator('[data-testid="timeline-canvas"]');
    const bbox = await canvas.boundingBox();
    expect(bbox).not.toBeNull();

    const centerX = bbox!.x + bbox!.width / 2;
    const centerY = bbox!.y + bbox!.height / 2;

    // Default cursor (crosshair for selection)
    await page.mouse.move(centerX, centerY);
    const defaultCursor = await canvas.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });
    expect(defaultCursor).toBe('crosshair');

    // Space key -> grab cursor
    await page.keyboard.down('Space');
    await page.waitForTimeout(50);
    const grabCursor = await canvas.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });
    expect(grabCursor).toBe('grab');

    // Space + mouse down -> grabbing cursor
    await page.mouse.down();
    await page.waitForTimeout(50);
    const grabbingCursor = await canvas.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });
    expect(grabbingCursor).toBe('grabbing');

    // Release mouse but keep Space -> back to grab
    await page.mouse.up();
    await page.waitForTimeout(50);
    const grabAfterRelease = await canvas.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });
    expect(grabAfterRelease).toBe('grab');

    // Release Space -> back to default
    await page.keyboard.up('Space');
    await page.waitForTimeout(50);
    const finalCursor = await canvas.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });
    expect(finalCursor).toBe('crosshair');
  });
});
