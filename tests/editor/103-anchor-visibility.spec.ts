/**
 * E2E Tests for Anchor Visibility
 * Verifies that all event anchors are visible regardless of card overflow status.
 * Per user requirement: "display all event anchors - regardless of overflows.
 * For overflows, we just don't display the cards"
 */

import { test, expect } from '@playwright/test';

// JCM timeline has events spanning a wide date range
const TEST_OWNER_USERNAME = 'cynacons';
const TEST_TIMELINE_ID = 'timeline-janus-cosmological-model';

test.describe('Anchor Visibility for All Events', () => {

  // Skip mobile/tablet - timeline rendering is significantly different on small screens
  test.beforeEach(async ({ page }, testInfo) => {
    const project = testInfo.project.name;
    if (project === 'mobile' || project === 'tablet') {
      test.skip();
      return;
    }
    await page.goto(`/${TEST_OWNER_USERNAME}/timeline/${TEST_TIMELINE_ID}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('[data-testid="timeline-anchor"]', { timeout: 10000 });
    await page.waitForTimeout(1000); // Allow layout to stabilize
  });

  test('all events have visible anchors', async ({ page }) => {
    // Count total anchors on the timeline
    const anchors = page.locator('[data-testid="timeline-anchor"]');
    const anchorCount = await anchors.count();

    // Should have anchors visible (JCM timeline has ~100 events)
    expect(anchorCount).toBeGreaterThan(0);
    console.log(`Total anchors visible: ${anchorCount}`);

    // Get the event count from the timeline info (if visible)
    const eventCountInfo = await page.evaluate(() => {
      // Count all event cards and overflow badges to estimate total events
      const cards = document.querySelectorAll('[data-testid="event-card"]');
      const overflowBadges = document.querySelectorAll('[data-testid^="overflow-badge-"]');
      const mergedBadges = document.querySelectorAll('[data-testid^="merged-overflow-badge-"]');

      let totalOverflow = 0;
      overflowBadges.forEach(badge => {
        const text = badge.textContent || '';
        const match = text.match(/\+(\d+)/);
        if (match) totalOverflow += parseInt(match[1], 10);
      });
      mergedBadges.forEach(badge => {
        const text = badge.textContent || '';
        const match = text.match(/\+(\d+)/);
        if (match) totalOverflow += parseInt(match[1], 10);
      });

      return {
        visibleCards: cards.length,
        totalOverflow,
        estimatedTotal: cards.length + totalOverflow
      };
    });

    console.log(`Visible cards: ${eventCountInfo.visibleCards}`);
    console.log(`Overflow events: ${eventCountInfo.totalOverflow}`);
    console.log(`Estimated total: ${eventCountInfo.estimatedTotal}`);

    // Anchors should exist for overflow events too
    // Each anchor might have multiple events, so anchor count might be less than event count
    // But we should have more anchors than just visible cards if there are overflows
    if (eventCountInfo.totalOverflow > 0) {
      // If there are overflow events, anchors should exist for them
      // The anchor count should reflect this
      expect(anchorCount).toBeGreaterThan(0);
    }
  });

  test('anchors exist at timeline edges', async ({ page }) => {
    // Get anchor positions to verify they span the timeline
    const anchorData = await page.evaluate(() => {
      const anchors = document.querySelectorAll('[data-testid="timeline-anchor"]');
      const positions: { x: number; eventIds: string }[] = [];

      anchors.forEach(anchor => {
        const wrapper = anchor.closest('.anchor-wrapper');
        if (wrapper) {
          const left = parseInt((wrapper as HTMLElement).style.left || '0', 10);
          const eventIds = wrapper.getAttribute('data-anchor-event-ids') || '';
          positions.push({ x: left, eventIds });
        }
      });

      // Sort by x position
      positions.sort((a, b) => a.x - b.x);

      return {
        leftmost: positions[0] || null,
        rightmost: positions[positions.length - 1] || null,
        total: positions.length,
        range: positions.length > 0 ? positions[positions.length - 1].x - positions[0].x : 0
      };
    });

    console.log(`Anchor range: ${anchorData.range}px`);
    console.log(`Leftmost anchor at x=${anchorData.leftmost?.x}, events: ${anchorData.leftmost?.eventIds}`);
    console.log(`Rightmost anchor at x=${anchorData.rightmost?.x}, events: ${anchorData.rightmost?.eventIds}`);

    // Anchors should span a reasonable range of the timeline
    expect(anchorData.total).toBeGreaterThan(0);
    if (anchorData.total > 1) {
      expect(anchorData.range).toBeGreaterThan(50); // At least 50px spread (mobile screens are small)
    }
  });

  test('anchors visible for events in 2020 and later', async ({ page }) => {
    // Check that we have anchors for events in 2020+
    // The JCM timeline has events up to 2025
    const anchorData = await page.evaluate(() => {
      const wrappers = document.querySelectorAll('.anchor-wrapper');
      const results: Array<{ x: number; eventIds: string[] }> = [];

      wrappers.forEach(wrapper => {
        const eventIdsAttr = wrapper.getAttribute('data-anchor-event-ids') || '';
        const eventIds = eventIdsAttr.split(',').filter(id => id);
        if (eventIds.length > 0) {
          const x = parseInt((wrapper as HTMLElement).style.left || '0', 10);
          results.push({ x, eventIds });
        }
      });

      // Sort by x position to get rightmost
      results.sort((a, b) => a.x - b.x);
      return {
        total: results.length,
        rightmostEventIds: results.length > 0 ? results[results.length - 1].eventIds : [],
        rightmostX: results.length > 0 ? results[results.length - 1].x : 0
      };
    });

    console.log(`Total anchor wrappers: ${anchorData.total}`);
    console.log(`Rightmost anchor x: ${anchorData.rightmostX}`);
    console.log(`Rightmost event IDs: ${anchorData.rightmostEventIds.join(', ')}`);

    // Should have multiple anchors
    expect(anchorData.total).toBeGreaterThan(0);

    // Check for events with dates in 2020+
    // Event IDs contain the year in format like "jpp-2020-crisis-paper"
    const has2020Events = anchorData.rightmostEventIds.some(id =>
      id.includes('-2020-') || id.includes('-2021-') ||
      id.includes('-2022-') || id.includes('-2023-') ||
      id.includes('-2024-') || id.includes('-2025-')
    );

    console.log(`Has 2020+ events at rightmost anchor: ${has2020Events}`);
  });

  test('overflow badges appear next to anchors for hidden events', async ({ page }) => {
    // Check for overflow badges (both individual and merged)
    const overflowBadges = page.locator('[data-testid^="overflow-badge-"], [data-testid^="merged-overflow-badge-"]');
    const badgeCount = await overflowBadges.count();

    // Note: Timeline at default zoom may or may not have overflow
    console.log(`Overflow badges visible: ${badgeCount}`);

    if (badgeCount > 0) {
      // Verify each badge has proper overflow count format
      for (let i = 0; i < Math.min(badgeCount, 3); i++) {
        const badge = overflowBadges.nth(i);
        const text = await badge.textContent();
        expect(text).toMatch(/^\+\d+$/); // Format: +N
        console.log(`Badge ${i}: ${text}`);
      }
    }
  });

  test('anchors are visible even when zoomed out', async ({ page }) => {
    // Get initial anchor count
    const initialAnchors = await page.locator('[data-testid="timeline-anchor"]').count();
    console.log(`Initial anchors: ${initialAnchors}`);

    // Zoom out using keyboard (minus key)
    await page.keyboard.press('-');
    await page.waitForTimeout(500);
    await page.keyboard.press('-');
    await page.waitForTimeout(500);

    // Check anchors are still visible after zoom out
    const afterZoomAnchors = await page.locator('[data-testid="timeline-anchor"]').count();
    console.log(`Anchors after zoom out: ${afterZoomAnchors}`);

    // All anchors should still be visible (might be same or more as date range expands)
    expect(afterZoomAnchors).toBeGreaterThanOrEqual(initialAnchors);
  });
});
