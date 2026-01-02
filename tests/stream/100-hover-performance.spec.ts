/**
 * Stream View Hover Performance Test
 * Tests the performance of hover interactions between Stream View cards and minimap markers
 *
 * SRS: docs/SRS_STREAM_VIEW.md
 * Requirement: CC-REQ-STREAM-PERF-001 - Hover highlight response time < 100ms
 */

import { test, expect, type Page } from '@playwright/test';
import { loadTestTimeline } from '../utils/timelineTestUtils';

// Test timeline with sufficient events for performance testing
const TEST_TIMELINE = 'french-revolution';

// Performance threshold: hover to highlight should be under 100ms
const HOVER_RESPONSE_THRESHOLD_MS = 100;

/**
 * Helper: Wait for Stream View to load with events
 */
async function waitForStreamViewLoaded(page: Page): Promise<void> {
  const overlay = page.getByTestId('stream-viewer-overlay');
  await expect(overlay).toBeVisible({ timeout: 5000 });

  const scrollContainer = page.getByTestId('stream-scroll-container');
  await expect(scrollContainer).toBeVisible({ timeout: 10000 });

  // Wait for at least one event card
  const eventCards = scrollContainer.locator('[data-event-id]');
  await expect(eventCards.first()).toBeVisible({ timeout: 10000 });
}

/**
 * Helper: Open Stream View overlay
 */
async function openStreamView(page: Page): Promise<void> {
  // Find and click Stream View button in NavRail
  const streamButton = page.locator('[data-testid="nav-stream-view"]').or(
    page.locator('.material-symbols-rounded:has-text("view_stream")').locator('..')
  ).first();

  await streamButton.click();
  await waitForStreamViewLoaded(page);
}

/**
 * Helper: Get visible event cards in Stream View
 */
async function getVisibleEventCards(page: Page, limit: number = 10): Promise<Array<{ locator: any; eventId: string }>> {
  const scrollContainer = page.getByTestId('stream-scroll-container');
  const eventCards = scrollContainer.locator('[data-event-id]');
  const count = Math.min(await eventCards.count(), limit);

  const cards = [];
  for (let i = 0; i < count; i++) {
    const card = eventCards.nth(i);
    const eventId = await card.getAttribute('data-event-id');
    if (eventId) {
      cards.push({ locator: card, eventId });
    }
  }

  return cards;
}

test.describe('Stream View Hover Performance', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    await loadTestTimeline(page, TEST_TIMELINE);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Allow timeline to fully render
  });

  test('CC-REQ-STREAM-PERF-001: hover highlight response under 100ms', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-STREAM-PERF-001' });

    // 1. Open Stream View
    await openStreamView(page);

    // 2. Get visible event cards (test first 5 for performance)
    const eventCards = await getVisibleEventCards(page, 5);
    expect(eventCards.length).toBeGreaterThan(0);

    // 3. Get minimap container
    const minimap = page.getByTestId('minimap-container').first();
    await expect(minimap).toBeVisible();

    // Track response times
    const responseTimes: number[] = [];

    // 4. Test hover on each event card
    for (const { locator: card, eventId } of eventCards) {
      // Ensure card is visible
      await expect(card).toBeVisible();

      // Get the corresponding minimap marker
      const minimapMarker = page.locator(`.minimap-marker[data-event-id="${eventId}"]`);

      // Ensure marker exists before hovering
      await expect(minimapMarker).toBeAttached({ timeout: 2000 });

      // Record start time and hover
      const startTime = Date.now();
      await card.hover();

      // Wait for minimap marker to get .is-hovered class
      await expect(minimapMarker).toHaveClass(/is-hovered/, { timeout: 200 });

      // Record end time
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      responseTimes.push(responseTime);

      // Assert this hover was fast enough
      expect(responseTime).toBeLessThan(HOVER_RESPONSE_THRESHOLD_MS);

      // Move mouse away to clear hover state before next iteration
      await page.mouse.move(0, 0);
      await page.waitForTimeout(100);

      // Verify hover state cleared
      await expect(minimapMarker).not.toHaveClass(/is-hovered/);
    }

    // 5. Calculate and log average response time
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);

    console.log(`Hover Performance Results (${responseTimes.length} samples):`);
    console.log(`  Average: ${avgResponseTime.toFixed(1)}ms`);
    console.log(`  Min: ${minResponseTime}ms`);
    console.log(`  Max: ${maxResponseTime}ms`);
    console.log(`  Threshold: ${HOVER_RESPONSE_THRESHOLD_MS}ms`);

    // Final assertion: average should be well under threshold
    expect(avgResponseTime).toBeLessThan(HOVER_RESPONSE_THRESHOLD_MS);
  });

  test('CC-REQ-STREAM-PERF-002: rapid sequential hovers maintain performance', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-STREAM-PERF-002' });

    // Open Stream View
    await openStreamView(page);

    // Get event cards
    const eventCards = await getVisibleEventCards(page, 10);
    expect(eventCards.length).toBeGreaterThanOrEqual(5);

    const responseTimes: number[] = [];

    // Rapidly hover over cards in sequence (no delay between hovers)
    for (let i = 0; i < Math.min(10, eventCards.length); i++) {
      const { locator: card, eventId } = eventCards[i];
      const minimapMarker = page.locator(`.minimap-marker[data-event-id="${eventId}"]`);

      const startTime = Date.now();
      await card.hover();
      await expect(minimapMarker).toHaveClass(/is-hovered/, { timeout: 200 });
      const endTime = Date.now();

      responseTimes.push(endTime - startTime);

      // No delay - immediately proceed to next hover
    }

    // All hovers should be fast, even under rapid-fire conditions
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);

    console.log(`Rapid Hover Performance (${responseTimes.length} sequential hovers):`);
    console.log(`  Average: ${avgResponseTime.toFixed(1)}ms`);
    console.log(`  Max: ${maxResponseTime}ms`);

    // Average should still be under threshold
    expect(avgResponseTime).toBeLessThan(HOVER_RESPONSE_THRESHOLD_MS);

    // Even the slowest hover should be under 2x threshold
    expect(maxResponseTime).toBeLessThan(HOVER_RESPONSE_THRESHOLD_MS * 2);
  });

  test('CC-REQ-STREAM-PERF-003: hover unhover cycle is stable', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-STREAM-PERF-003' });

    // Open Stream View
    await openStreamView(page);

    // Get first event card
    const eventCards = await getVisibleEventCards(page, 1);
    expect(eventCards.length).toBeGreaterThan(0);

    const { locator: card, eventId } = eventCards[0];
    const minimapMarker = page.locator(`.minimap-marker[data-event-id="${eventId}"]`);

    // Perform multiple hover/unhover cycles on same card
    const hoverTimes: number[] = [];
    const unhoverTimes: number[] = [];

    for (let cycle = 0; cycle < 5; cycle++) {
      // Hover
      const hoverStart = Date.now();
      await card.hover();
      await expect(minimapMarker).toHaveClass(/is-hovered/, { timeout: 200 });
      const hoverEnd = Date.now();
      hoverTimes.push(hoverEnd - hoverStart);

      // Unhover
      const unhoverStart = Date.now();
      await page.mouse.move(0, 0);
      await expect(minimapMarker).not.toHaveClass(/is-hovered/, { timeout: 200 });
      const unhoverEnd = Date.now();
      unhoverTimes.push(unhoverEnd - unhoverStart);

      await page.waitForTimeout(50);
    }

    const avgHover = hoverTimes.reduce((a, b) => a + b, 0) / hoverTimes.length;
    const avgUnhover = unhoverTimes.reduce((a, b) => a + b, 0) / unhoverTimes.length;

    console.log(`Hover/Unhover Cycle Performance (5 cycles):`);
    console.log(`  Average hover time: ${avgHover.toFixed(1)}ms`);
    console.log(`  Average unhover time: ${avgUnhover.toFixed(1)}ms`);

    // Both hover and unhover should be fast
    expect(avgHover).toBeLessThan(HOVER_RESPONSE_THRESHOLD_MS);
    expect(avgUnhover).toBeLessThan(HOVER_RESPONSE_THRESHOLD_MS);
  });

  test('CC-REQ-STREAM-PERF-004: hover works with large event counts', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-STREAM-PERF-004' });

    // Open Stream View (French Revolution timeline has ~200+ events)
    await openStreamView(page);

    // Scroll down to middle of list to test with many DOM elements
    const scrollContainer = page.getByTestId('stream-scroll-container');
    await scrollContainer.evaluate((el) => {
      el.scrollTop = el.scrollHeight / 2;
    });
    await page.waitForTimeout(300);

    // Get cards in the middle of the list
    const allCards = await scrollContainer.locator('[data-event-id]').count();
    console.log(`Total events in timeline: ${allCards}`);

    const midIndex = Math.floor(allCards / 2);
    const testCard = scrollContainer.locator('[data-event-id]').nth(midIndex);
    const eventId = await testCard.getAttribute('data-event-id');
    expect(eventId).toBeTruthy();

    const minimapMarker = page.locator(`.minimap-marker[data-event-id="${eventId}"]`);

    // Ensure card is in viewport
    await testCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    // Test hover performance on card in middle of large list
    const startTime = Date.now();
    await testCard.hover();
    await expect(minimapMarker).toHaveClass(/is-hovered/, { timeout: 200 });
    const endTime = Date.now();

    const responseTime = endTime - startTime;
    console.log(`Hover time with ${allCards} events: ${responseTime}ms`);

    // Performance should not degrade with large event counts
    expect(responseTime).toBeLessThan(HOVER_RESPONSE_THRESHOLD_MS);
  });
});
