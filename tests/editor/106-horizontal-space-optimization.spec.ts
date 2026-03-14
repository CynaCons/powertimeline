import { test, expect } from '@playwright/test';
import { loginAsTestUser, loadTestTimeline, waitForTimelineRendered } from '../utils/timelineTestUtils';

/**
 * Test: Horizontal Space Optimization
 *
 * Validates that the layout system optimally uses horizontal viewport space:
 * - Cards occupy maximum available width while maintaining margins
 * - Clustering adapts to viewport width (more clusters on wider screens)
 * - Cards are not stuck to viewport edges
 * - Layout density increases appropriately on wider viewports
 *
 * Requirements tested:
 * - CC-REQ-LAYOUT-HORIZONTAL-OPTIMIZATION (proposed)
 * - CC-REQ-CAPACITY-VIEWPORT-001 (existing, but only vertical)
 */

test.describe('Horizontal Space Optimization', () => {

  test('Layout should utilize horizontal space efficiently on FHD', async ({ page }) => {
    test.info().annotations.push({
      type: 'req',
      description: 'CC-REQ-LAYOUT-HORIZONTAL-OPTIMIZATION'
    });

    // Test FHD viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await loginAsTestUser(page);

    // Load French Revolution timeline (dense with ~130 events)
    await loadTestTimeline(page, 'french-revolution');
    await waitForTimelineRendered(page);
    await page.waitForTimeout(1000); // Let layout stabilize

    await test.step('FHD (1920x1080)', async () => {
      const width = 1920;
      const height = 1080;
      const minClusters = 8;
      const maxClusters = 14;

      // Get layout telemetry
      await page.waitForFunction(() => Boolean((window as any).__ccTelemetry?.clusters));
      const telemetry = await page.evaluate(() => (window as any).__ccTelemetry);

      const clusterCount = telemetry.clusters?.count || 0;
      console.log(`FHD: ${clusterCount} clusters (expected ${minClusters}-${maxClusters})`);

      // Validate cluster count is reasonable for FHD
      expect(clusterCount).toBeGreaterThanOrEqual(minClusters);
      expect(clusterCount).toBeLessThanOrEqual(maxClusters);

      // Get all anchors (cluster positions)
      const anchors = await page.locator('[data-testid="anchor"]').all();
      const anchorPositions: number[] = [];

      for (const anchor of anchors) {
        const bounds = await anchor.boundingBox();
        if (bounds) {
          anchorPositions.push(bounds.x);
        }
      }

      if (anchorPositions.length > 0) {
        const minX = Math.min(...anchorPositions);
        const maxX = Math.max(...anchorPositions);
        const spread = maxX - minX;
        const availableWidth = width - 120; // Account for nav rail (~80px) + margins

        console.log(`  Anchor spread: ${minX.toFixed(0)}px - ${maxX.toFixed(0)}px (${spread.toFixed(0)}px of ${availableWidth}px available)`);

        // Anchors should use at least 70% of available horizontal space
        expect(spread).toBeGreaterThan(availableWidth * 0.7);

        // Leftmost anchor should have sufficient margin from nav rail (assume ~80px)
        expect(minX).toBeGreaterThan(100); // At least 100px from left edge

        // Rightmost anchor should have margin from right edge
        expect(maxX).toBeLessThan(width - 50); // At least 50px from right edge
      }
    });
  });

  test('Cards should not stick to viewport edges', async ({ page }) => {
    test.info().annotations.push({
      type: 'req',
      description: 'CC-REQ-LAYOUT-EDGE-MARGINS'
    });

    await page.setViewportSize({ width: 1920, height: 1080 });
    await loginAsTestUser(page);
    await loadTestTimeline(page, 'timeline-rfk');
    await waitForTimelineRendered(page);
    await page.waitForTimeout(500);

    // Get navigation rail bounds
    const navRail = page.locator('aside').first();
    const navRailBounds = await navRail.boundingBox();
    const navRailRightEdge = (navRailBounds?.x || 0) + (navRailBounds?.width || 80);

    // Get all event cards
    const cards = await page.locator('[data-testid="event-card"]').all();

    let cardsNearLeftEdge = 0;
    let cardsNearRightEdge = 0;
    let minLeftEdge = Infinity;
    let maxRightEdge = 0;

    for (const card of cards) {
      const bounds = await card.boundingBox();
      if (bounds) {
        const cardLeft = bounds.x;
        const cardRight = bounds.x + bounds.width;

        minLeftEdge = Math.min(minLeftEdge, cardLeft);
        maxRightEdge = Math.max(maxRightEdge, cardRight);

        // Check if card is too close to edges
        if (cardLeft < navRailRightEdge + 30) {
          cardsNearLeftEdge++;
        }
        if (cardRight > 1920 - 30) {
          cardsNearRightEdge++;
        }
      }
    }

    console.log(`Cards range: ${minLeftEdge.toFixed(1)}px to ${maxRightEdge.toFixed(1)}px`);
    console.log(`Cards too close to left edge: ${cardsNearLeftEdge}`);
    console.log(`Cards too close to right edge: ${cardsNearRightEdge}`);

    // No cards should be within 30px of navigation rail
    expect(cardsNearLeftEdge).toBe(0);

    // No cards should be within 30px of right edge
    expect(cardsNearRightEdge).toBe(0);

    // Overall card spread should have good margins
    expect(minLeftEdge).toBeGreaterThan(navRailRightEdge + 30);
    expect(maxRightEdge).toBeLessThan(1920 - 30);
  });

  test('Cluster spacing should be reasonable on FHD', async ({ page }) => {
    test.info().annotations.push({
      type: 'req',
      description: 'CC-REQ-LAYOUT-ADAPTIVE-CLUSTERING'
    });

    await page.setViewportSize({ width: 1920, height: 1080 });
    await loginAsTestUser(page);
    await loadTestTimeline(page, 'french-revolution');
    await waitForTimelineRendered(page);
    await page.waitForTimeout(1000);

    const expectedMinSpacing = 80;
    const expectedMaxSpacing = 220;

    // Get anchor positions
    const anchors = await page.locator('[data-testid="anchor"]').all();
    const positions: number[] = [];

    for (const anchor of anchors) {
      const bounds = await anchor.boundingBox();
      if (bounds) {
        positions.push(bounds.x);
      }
    }

    // Sort positions
    positions.sort((a, b) => a - b);

    // Calculate spacings between consecutive anchors
    const spacings: number[] = [];
    for (let i = 1; i < positions.length; i++) {
      spacings.push(positions[i] - positions[i - 1]);
    }

    if (spacings.length > 0) {
      const avgSpacing = spacings.reduce((a, b) => a + b, 0) / spacings.length;
      const minSpacing = Math.min(...spacings);
      const maxSpacing = Math.max(...spacings);

      console.log(`1920px: avg=${avgSpacing.toFixed(1)}px, min=${minSpacing.toFixed(1)}px, max=${maxSpacing.toFixed(1)}px`);

      // Average spacing should be within expected range
      expect(avgSpacing).toBeGreaterThanOrEqual(expectedMinSpacing);
      expect(avgSpacing).toBeLessThanOrEqual(expectedMaxSpacing);

      // Minimum spacing should not be too cramped
      expect(minSpacing).toBeGreaterThanOrEqual(expectedMinSpacing * 0.5);
    }
  });

  test('Horizontal space utilization percentage should be high', async ({ page }) => {
    test.info().annotations.push({
      type: 'req',
      description: 'CC-REQ-LAYOUT-SPACE-EFFICIENCY'
    });

    await page.setViewportSize({ width: 1920, height: 1080 });
    await loginAsTestUser(page);
    await loadTestTimeline(page, 'french-revolution');
    await waitForTimelineRendered(page);
    await page.waitForTimeout(1000);

    // Get navigation rail
    const navRail = page.locator('aside').first();
    const navRailBounds = await navRail.boundingBox();
    const navRailWidth = navRailBounds?.width || 80;

    // Define usable width (viewport - nav rail - minimum margins)
    const viewportWidth = 1920;
    const minimumLeftMargin = 30;
    const minimumRightMargin = 30;
    const usableWidth = viewportWidth - navRailWidth - minimumLeftMargin - minimumRightMargin;

    // Get anchors to measure horizontal spread
    const anchors = await page.locator('[data-testid="anchor"]').all();
    const positions: number[] = [];

    for (const anchor of anchors) {
      const bounds = await anchor.boundingBox();
      if (bounds) {
        positions.push(bounds.x);
      }
    }

    if (positions.length > 0) {
      const minX = Math.min(...positions);
      const maxX = Math.max(...positions);
      const actualSpread = maxX - minX;
      const utilizationPct = (actualSpread / usableWidth) * 100;

      console.log(`Usable width: ${usableWidth}px`);
      console.log(`Actual spread: ${actualSpread.toFixed(0)}px`);
      console.log(`Utilization: ${utilizationPct.toFixed(1)}%`);

      // Should utilize at least 70% of usable horizontal space
      expect(utilizationPct).toBeGreaterThanOrEqual(70);
    }
  });

  test('Ultra-wide display should show more clusters than laptop', async ({ page }) => {
    test.info().annotations.push({
      type: 'req',
      description: 'CC-REQ-LAYOUT-RESPONSIVE-CLUSTERING'
    });

    // Test on laptop
    await page.setViewportSize({ width: 1366, height: 768 });
    await loginAsTestUser(page);
    await loadTestTimeline(page, 'french-revolution');
    await waitForTimelineRendered(page);
    await page.waitForTimeout(1000);

    await page.waitForFunction(() => Boolean((window as any).__ccTelemetry?.clusters));
    const laptopTelemetry = await page.evaluate(() => (window as any).__ccTelemetry);
    const laptopClusters = laptopTelemetry.clusters?.count || 0;

    console.log(`Laptop (1366px): ${laptopClusters} clusters`);

    // Test on ultra-wide
    await page.setViewportSize({ width: 3440, height: 1440 });
    await page.reload();
    await waitForTimelineRendered(page);
    await page.waitForTimeout(1000);

    await page.waitForFunction(() => Boolean((window as any).__ccTelemetry?.clusters));
    const ultrawiderTelemetry = await page.evaluate(() => (window as any).__ccTelemetry);
    const ultrawideClusters = ultrawiderTelemetry.clusters?.count || 0;

    console.log(`Ultra-wide (3440px): ${ultrawideClusters} clusters`);

    // Ultra-wide should have significantly more clusters (at least 50% more)
    expect(ultrawideClusters).toBeGreaterThanOrEqual(laptopClusters * 1.5);
  });
});
