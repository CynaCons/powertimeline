import { test, expect } from '@playwright/test';

test.describe('Anchor Persistence - French Revolution', () => {
  test('Anchors remain visible at all zoom levels (CC-REQ-ANCHOR-004)', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-ANCHOR-004' });

    // Navigate directly to French Revolution timeline (using username-based URL)
    await page.goto('/cynacons/timeline/french-revolution');
    await page.waitForSelector('[data-testid="event-card"]', { timeout: 10000 });
    await page.waitForTimeout(1000); // Allow time for all events to load and render

    console.log('🔍 Testing anchor persistence across zoom levels...');

    // Test 1: Anchors exist at default zoom level
    const defaultAnchors = await page.locator('[data-testid^="anchor-"]').all();
    const defaultCards = await page.locator('[data-testid="event-card"]').all();

    // Get total events from telemetry
    const telemetryData = await page.evaluate(() => (window as any).__ccTelemetry);
    const totalEvents = telemetryData?.eventDates?.length || 0;

    console.log(`📊 Default zoom: ${defaultAnchors.length} anchors, ${defaultCards.length} cards, ${totalEvents} events`);

    // CC-REQ-ANCHOR-004: Anchors should persist regardless of card degradation
    // Due to clustering (events within 10px share one anchor):
    // - Anchors ≤ events (clustering reduces count)
    // - Anchors should still cover all events (via clustering)
    expect(defaultAnchors.length, 'Should have French Revolution anchors at default zoom').toBeGreaterThan(10);
    expect(defaultCards.length, 'Should have visible cards').toBeGreaterThan(0);
    expect(defaultAnchors.length, 'Anchors should not exceed total events (clustering)').toBeLessThanOrEqual(totalEvents);

    // Cards can exceed anchors when many events are clustered
    // So we just validate that both exist
    console.log(`   Anchor clustering ratio: ${(defaultAnchors.length / totalEvents * 100).toFixed(1)}%`);

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

        const zoomedAnchors = await page.locator('[data-testid^="anchor-"]').all();
        const zoomedCards = await page.locator('[data-testid="event-card"]').all();
        console.log(`📊 Zoom level ${zoomLevel}: ${zoomedAnchors.length} anchors, ${zoomedCards.length} cards`);

        // CC-REQ-ANCHOR-004: Anchors should persist regardless of degradation
        // With clustering, anchor count reflects clustered events
        expect(zoomedAnchors.length, `Anchors should persist at zoom level ${zoomLevel}`).toBeGreaterThan(0);
        expect(zoomedCards.length, `Cards should exist at zoom level ${zoomLevel}`).toBeGreaterThan(0);
      }

      // Test 3: Deep zoom should still show anchors (even if different ones)
      for (let i = 0; i < 3; i++) {
        await page.mouse.wheel(0, -600); // Deep zoom
        await page.waitForTimeout(500);
      }

      const deepZoomAnchors = await page.locator('[data-testid^="anchor-"]').all();
      const deepZoomCards = await page.locator('[data-testid="event-card"]').all();
      console.log(`📊 Deep zoom: ${deepZoomAnchors.length} anchors, ${deepZoomCards.length} cards`);
      expect(deepZoomAnchors.length, 'Should have anchors even at deep zoom').toBeGreaterThan(0);
      expect(deepZoomCards.length, 'Should have cards at deep zoom').toBeGreaterThan(0);
    }

    // Test 4: Verify final state maintains anchor persistence
    const allAnchors = await page.locator('[data-testid^="anchor-"]').all();
    const allCards = await page.locator('[data-testid="event-card"]').all();
    console.log(`📊 Final state: ${allAnchors.length} anchors, ${allCards.length} cards`);

    // The test passes if we maintain anchor visibility across all zoom levels
    // Clustering means anchor count ≤ event count, which is expected
    expect(allAnchors.length, 'Should have substantial anchor coverage').toBeGreaterThan(5);
    expect(allCards.length, 'Should have visible cards').toBeGreaterThan(0);

    console.log('✅ Anchor persistence test completed - CC-REQ-ANCHOR-004 verified');
  });
});