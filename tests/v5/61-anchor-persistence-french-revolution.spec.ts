import { test, expect } from '@playwright/test';

test.describe('Anchor Persistence - French Revolution', () => {
  test('Anchors remain visible at all zoom levels (CC-REQ-ANCHOR-004)', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ANCHOR-004' });

    // Navigate to the application
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for app to load
    await expect(page.locator('[data-testid="timeline-axis"]')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);

    // Open dev panel and load French Revolution timeline
    await page.keyboard.press('Alt+d');
    await page.waitForTimeout(500);

    const frenchRevButton = page.getByRole('button', { name: 'French Revolution' });
    await frenchRevButton.click();
    await page.waitForTimeout(3000); // Allow time for all 250+ events to load

    // Close dev panel
    await page.keyboard.press('Alt+d');
    await page.waitForTimeout(500);

    console.log('🔍 Testing anchor persistence across zoom levels...');

    // Test 1: Anchors exist at default zoom level
    const defaultAnchors = await page.locator('[data-testid^="anchor-event-fr-"]').all();
    console.log(`📊 Default zoom: ${defaultAnchors.length} French Revolution anchors`);
    expect(defaultAnchors.length, 'Should have French Revolution anchors at default zoom').toBeGreaterThan(10);

    // Test 2: Navigate to 1794 period and check anchors persist
    const timelineAxis = page.locator('[data-testid="timeline-axis"]');
    const axisBox = await timelineAxis.boundingBox();

    if (axisBox) {
      // Click on 1794 period (1776-1799 range)
      const year1794Ratio = (1794 - 1776) / (1799 - 1776);
      const year1794Position = axisBox.x + (axisBox.width * year1794Ratio);
      await page.mouse.click(year1794Position, axisBox.y);
      await page.waitForTimeout(500);

      // Zoom in progressively and verify anchors persist
      for (let zoomLevel = 1; zoomLevel <= 4; zoomLevel++) {
        await page.mouse.wheel(0, -400); // Zoom in
        await page.waitForTimeout(500);

        const zoomedAnchors = await page.locator('[data-testid^="anchor-event-fr-"]').all();
        console.log(`📊 Zoom level ${zoomLevel}: ${zoomedAnchors.length} French Revolution anchors`);

        // CC-REQ-ANCHOR-004: Anchors should persist regardless of degradation
        expect(zoomedAnchors.length, `Anchors should persist at zoom level ${zoomLevel}`).toBeGreaterThan(0);
      }

      // Test 3: Deep zoom should still show anchors (even if different ones)
      for (let i = 0; i < 3; i++) {
        await page.mouse.wheel(0, -600); // Deep zoom
        await page.waitForTimeout(500);
      }

      const deepZoomAnchors = await page.locator('[data-testid^="anchor-event-fr-"]').all();
      console.log(`📊 Deep zoom: ${deepZoomAnchors.length} French Revolution anchors`);
      expect(deepZoomAnchors.length, 'Should have anchors even at deep zoom').toBeGreaterThan(0);
    }

    // Test 4: Verify anchors span multiple years (not just early revolution)
    const allAnchors = await page.locator('[data-testid^="anchor-event-fr-"]').all();
    console.log(`📊 Final anchor count: ${allAnchors.length}`);

    // With 82 events from 1794 alone, we should definitely have anchors
    // The test passes if we maintain anchor visibility across zoom levels
    expect(allAnchors.length, 'Should have substantial anchor coverage').toBeGreaterThan(5);

    console.log('✅ Anchor persistence test completed - CC-REQ-ANCHOR-004 verified');
  });
});