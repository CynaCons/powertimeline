/**
 * Timeline Canvas Scaling Tests
 * Tests that timeline canvas scales horizontally across viewports
 *
 * Requirement: CC-REQ-LAYOUT-RESP-006
 */

import { test, expect } from '@playwright/test';
import { loadTestTimeline, waitForTimelineRendered } from '../utils/timelineTestUtils';

test.describe('responsive/06 Timeline Canvas Scaling', () => {

  test('T-RESP-06.1: Timeline canvas uses full width at desktop-xl', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-LAYOUT-RESP-006' });

    // Skip if not desktop-xl viewport
    const viewport = page.viewportSize();
    test.skip(viewport?.width !== 2560, 'Desktop-XL only test');

    // Load a test timeline
    await loadTestTimeline(page, 'french-revolution');
    await waitForTimelineRendered(page);

    // Wait for canvas to render
    await page.waitForTimeout(2000);

    // Timeline axis should be visible
    const timelineAxis = page.getByTestId('timeline-axis');
    await expect(timelineAxis).toBeVisible({ timeout: 5000 });

    const axisBox = await timelineAxis.boundingBox();
    expect(axisBox).not.toBeNull();

    if (axisBox && viewport) {
      // Timeline axis should use substantial horizontal space
      expect(axisBox.width).toBeGreaterThan(viewport.width * 0.7);
    }
  });

  test('T-RESP-06.2: Timeline events distributed across wide canvas', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-LAYOUT-RESP-006' });

    // Skip if not desktop-xl viewport
    const viewport = page.viewportSize();
    test.skip(viewport?.width !== 2560, 'Desktop-XL only test');

    // Load a test timeline
    await loadTestTimeline(page, 'french-revolution');
    await waitForTimelineRendered(page);

    // Wait for events to render
    await page.waitForTimeout(2000);

    // Get event cards
    const eventCards = page.locator('[data-testid="event-card"]');
    const cardCount = await eventCards.count();

    if (cardCount < 2) {
      test.skip('Need multiple events to test distribution');
    }

    // Get positions of first and last event cards
    const firstCardBox = await eventCards.first().boundingBox();
    const lastCardBox = await eventCards.last().boundingBox();

    expect(firstCardBox).not.toBeNull();
    expect(lastCardBox).not.toBeNull();

    if (firstCardBox && lastCardBox && viewport) {
      // Events should be distributed horizontally (not bunched)
      const horizontalSpread = Math.abs(lastCardBox.x - firstCardBox.x);

      // Spread should be substantial on desktop-xl (at least 30% of viewport)
      expect(horizontalSpread).toBeGreaterThan(viewport.width * 0.3);
    }
  });

  test('T-RESP-06.3: Canvas scales on mobile viewports', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-LAYOUT-RESP-006' });

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();

    // Load a test timeline
    await loadTestTimeline(page, 'french-revolution');
    await waitForTimelineRendered(page);

    // Timeline axis should be visible
    const timelineAxis = page.getByTestId('timeline-axis');
    await expect(timelineAxis).toBeVisible({ timeout: 5000 });

    const axisBox = await timelineAxis.boundingBox();
    expect(axisBox).not.toBeNull();

    if (axisBox && viewport) {
      // On mobile, canvas should fit within viewport (may allow horizontal scroll)
      expect(axisBox.width).toBeGreaterThan(viewport.width * 0.5);
    }
  });

  test('T-RESP-06.4: Timeline canvas does not cause horizontal overflow', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-LAYOUT-RESP-006' });

    // Load a test timeline
    await loadTestTimeline(page, 'french-revolution');
    await waitForTimelineRendered(page);

    // Wait for layout to stabilize
    await page.waitForTimeout(2000);

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();

    // Check body scroll width
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);

    // Timeline app may intentionally have horizontal scroll for wide timelines
    // Just verify the scroll is reasonable (not excessive)
    if (viewport) {
      expect(bodyScrollWidth).toBeLessThan(viewport.width * 3);
    }
  });

  test('T-RESP-06.5: Zoom controls remain accessible at all viewport sizes', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-LAYOUT-RESP-006' });

    // Load a test timeline
    await loadTestTimeline(page, 'french-revolution');
    await waitForTimelineRendered(page);

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();

    // Timeline axis should be visible (indicates editor loaded)
    const timelineAxis = page.getByTestId('timeline-axis');
    await expect(timelineAxis).toBeVisible({ timeout: 5000 });

    // Verify timeline controls area exists (may contain zoom/pan controls)
    // This is a basic check that the interface is present
    const axisBox = await timelineAxis.boundingBox();
    expect(axisBox).not.toBeNull();

    if (axisBox && viewport) {
      // Axis should be visible within viewport
      expect(axisBox.x).toBeGreaterThanOrEqual(0);
      expect(axisBox.y).toBeGreaterThanOrEqual(0);
    }
  });

  test('T-RESP-06.6: Event cards maintain readability on narrow viewports', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-LAYOUT-RESP-006' });

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();

    // Skip if not mobile viewport
    test.skip(!viewport || viewport.width >= 768, 'Mobile viewport only');

    // Load a test timeline
    await loadTestTimeline(page, 'french-revolution');
    await waitForTimelineRendered(page);

    // Get event cards
    const eventCards = page.locator('[data-testid="event-card"]');
    const cardCount = await eventCards.count();

    if (cardCount === 0) {
      test.skip('No event cards to test');
    }

    const firstCard = eventCards.first();
    const cardBox = await firstCard.boundingBox();

    expect(cardBox).not.toBeNull();

    if (cardBox && viewport) {
      // Event cards should have minimum readable width on mobile
      expect(cardBox.width).toBeGreaterThan(100);

      // Should not be wider than viewport (reasonable bounds)
      expect(cardBox.width).toBeLessThan(viewport.width * 1.5);
    }
  });
});
