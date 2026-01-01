import { test, expect } from '@playwright/test';

/**
 * E2E tests for Shift+Scroll horizontal panning
 *
 * Tests the timeline's Shift+scroll feature for horizontal panning.
 * Key focus: Rapid scrolling should NOT cause "rollback" (view jumping back).
 */

test.describe('Shift+Scroll Horizontal Pan', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cynacons/timeline/french-revolution');
    await page.waitForSelector('[data-testid="timeline-canvas"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="minimap-container"]', { timeout: 10000 });
    await page.waitForTimeout(500);
  });

  function getMinimapViewWindow(page: any) {
    return page.locator('[data-testid="minimap-container"] .cursor-grab, [data-testid="minimap-container"] .cursor-grabbing').first();
  }

  async function getViewWindowX(page: any): Promise<number> {
    const viewWindow = getMinimapViewWindow(page);
    const box = await viewWindow.boundingBox();
    return box?.x ?? 0;
  }

  async function moveToCanvas(page: any) {
    const canvas = page.locator('[data-testid="timeline-canvas"]');
    const bbox = await canvas.boundingBox();
    if (bbox) {
      await page.mouse.move(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
    }
  }

  async function zoomInForPanning(page: any) {
    await moveToCanvas(page);
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(300);
  }

  test('pan left/right with boundary constraints', async ({ page }) => {
    await zoomInForPanning(page);

    const minimap = page.locator('[data-testid="minimap-container"]').first();
    const minimapBox = await minimap.boundingBox();
    const initialX = await getViewWindowX(page);

    // Pan right
    await page.keyboard.down('Shift');
    await page.mouse.wheel(0, 200);
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);

    const afterRightX = await getViewWindowX(page);
    expect(afterRightX).toBeGreaterThan(initialX);

    // Pan left
    await page.keyboard.down('Shift');
    await page.mouse.wheel(0, -200);
    await page.keyboard.up('Shift');
    await page.waitForTimeout(200);

    const afterLeftX = await getViewWindowX(page);
    expect(afterLeftX).toBeLessThan(afterRightX);

    // Test left boundary - try to pan past start
    await page.keyboard.down('Shift');
    for (let i = 0; i < 15; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(20);
    }
    await page.keyboard.up('Shift');
    await page.waitForTimeout(100);

    const atLeftBoundary = await getViewWindowX(page);
    expect(atLeftBoundary).toBeGreaterThanOrEqual(minimapBox!.x - 5);

    // Test right boundary - pan past end
    await page.keyboard.down('Shift');
    for (let i = 0; i < 30; i++) {
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(20);
    }
    await page.keyboard.up('Shift');
    await page.waitForTimeout(100);

    const viewWindow = getMinimapViewWindow(page);
    const viewWindowBox = await viewWindow.boundingBox();
    const viewWindowRight = viewWindowBox!.x + viewWindowBox!.width;
    const minimapRight = minimapBox!.x + minimapBox!.width;
    expect(viewWindowRight).toBeLessThanOrEqual(minimapRight + 5);
  });

  test('rapid scrolling produces monotonic movement (no rollback)', async ({ page }) => {
    // Stress test: Verify no rollback during rapid Shift+scroll panning.
    //
    // The rollback bug: React's async/batched state updates can arrive with stale
    // values during rapid scrolling, overwriting ref-based position tracking.
    // Fix: useTimelineZoom ignores React syncs for 150ms after last wheel event.
    //
    // NOTE: Synthetic WheelEvents don't trigger React's batching identically to
    // real mouse wheel events, so this test may pass even without the fix.
    // Manual testing with a real mouse wheel is required for full verification.
    await zoomInForPanning(page);

    // Zoom in heavily for maximum panning headroom
    for (let i = 0; i < 12; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(20);
    }
    await page.waitForTimeout(200);

    await page.keyboard.down('Shift');

    // Dispatch events and sample positions from WITHIN the browser
    // This catches rollbacks that happen between React render cycles
    const result = await page.evaluate(() => {
      return new Promise<{ positions: number[]; rollbacks: number }>((resolve) => {
        const canvas = document.querySelector('[data-testid="timeline-canvas"]');
        const minimap = document.querySelector('[data-testid="minimap-container"]');
        const viewWindow = minimap?.querySelector('.cursor-grab, .cursor-grabbing') as HTMLElement;

        if (!canvas || !viewWindow) {
          resolve({ positions: [], rollbacks: -1 });
          return;
        }

        const positions: number[] = [];
        let rollbacks = 0;
        let lastX = viewWindow.getBoundingClientRect().x;
        positions.push(lastX);

        let eventsFired = 0;
        const totalEvents = 300;

        function fireEvent() {
          if (eventsFired >= totalEvents) {
            // Final position check
            const finalX = viewWindow.getBoundingClientRect().x;
            positions.push(finalX);
            if (finalX < lastX - 1) rollbacks++;
            resolve({ positions, rollbacks });
            return;
          }

          const event = new WheelEvent('wheel', {
            deltaY: 8 + Math.random() * 15,
            deltaX: 0,
            shiftKey: true,
            bubbles: true,
            cancelable: true
          });
          canvas.dispatchEvent(event);
          eventsFired++;

          // Sample position every 10 events to detect mid-scroll rollbacks
          if (eventsFired % 10 === 0) {
            const currentX = viewWindow.getBoundingClientRect().x;
            positions.push(currentX);
            if (currentX < lastX - 1) {
              rollbacks++;
              console.log(`ROLLBACK at event ${eventsFired}: ${lastX.toFixed(1)} -> ${currentX.toFixed(1)}`);
            }
            lastX = Math.max(lastX, currentX); // Track high water mark
          }

          // Use requestAnimationFrame to interleave with React renders
          // This is more likely to trigger the stale state race condition
          if (eventsFired % 3 === 0) {
            requestAnimationFrame(fireEvent);
          } else {
            // Mix in some immediate dispatches
            setTimeout(fireEvent, 0);
          }
        }

        fireEvent();
      });
    });

    await page.keyboard.up('Shift');

    const totalMovement = result.positions.length > 1
      ? result.positions[result.positions.length - 1] - result.positions[0]
      : 0;

    console.log(`300 events, ${result.positions.length} samples, ${result.rollbacks} rollbacks, movement: ${totalMovement.toFixed(1)}px`);

    expect(result.rollbacks).toBe(0);
    expect(totalMovement).toBeGreaterThan(30);
  });

  test('scroll without Shift zooms instead of panning', async ({ page }) => {
    await zoomInForPanning(page);

    const viewWindow = getMinimapViewWindow(page);
    const initialBox = await viewWindow.boundingBox();

    // Scroll without Shift (should zoom out)
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(300);

    const finalBox = await viewWindow.boundingBox();

    // Width should increase (zoomed out = larger view window)
    expect(finalBox!.width).toBeGreaterThan(initialBox!.width);
  });
});
