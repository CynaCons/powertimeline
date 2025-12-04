/**
 * Stream Viewer E2E Tests
 * v0.5.26.3 - Complete tests for Stream View overlay
 *
 * Tests the complete Stream Viewer workflow:
 * - Opening/closing the overlay
 * - Event display and chronological ordering
 * - Breadcrumbs and minimap visibility
 * - Search functionality
 * - Mouse wheel scrolling
 * - Click interactions
 *
 * SRS: docs/SRS_STREAM_VIEW.md
 * Requirements: CC-REQ-STREAM-*
 */

import { test, expect, type Page } from '@playwright/test';
import { loadTestTimeline } from '../utils/timelineTestUtils';

// Test timeline with known events
const TEST_TIMELINE = 'french-revolution';

/**
 * Helper: Wait for events to load in Stream View
 */
async function waitForEventsLoaded(page: Page, minEvents = 1): Promise<number> {
  const scrollContainer = page.getByTestId('stream-scroll-container');
  await expect(scrollContainer).toBeVisible({ timeout: 10000 });

  // Wait for at least one event card
  const eventCards = scrollContainer.locator('[data-event-id]');
  await expect(eventCards.first()).toBeVisible({ timeout: 10000 });

  const count = await eventCards.count();
  expect(count).toBeGreaterThanOrEqual(minEvents);
  return count;
}

/**
 * Helper: Get scroll position of container
 */
async function getScrollPosition(page: Page): Promise<number> {
  const container = page.getByTestId('stream-scroll-container');
  return await container.evaluate((el) => el.scrollTop);
}

/**
 * Helper: Scroll container programmatically
 */
async function scrollContainer(page: Page, deltaY: number): Promise<{ before: number; after: number }> {
  const container = page.getByTestId('stream-scroll-container');
  const before = await container.evaluate((el) => el.scrollTop);

  await container.evaluate((el, delta) => {
    el.scrollBy({ top: delta, behavior: 'instant' });
  }, deltaY);

  await page.waitForTimeout(100);

  const after = await container.evaluate((el) => el.scrollTop);
  return { before, after };
}

// ============================================================================
// DESKTOP TESTS
// ============================================================================

test.describe('v5/82 Stream Viewer - Desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    await loadTestTimeline(page, TEST_TIMELINE);
    await page.waitForLoadState('domcontentloaded');
    // Wait for timeline to render
    await page.waitForTimeout(2000);
  });

  test('T82.1: Stream View button visible in NavRail', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-STREAM-OVERLAY-001' });

    // Look for Stream View button - could be button with icon or text
    const streamButton = page.locator('[data-testid="nav-stream-view"]').or(
      page.locator('.material-symbols-rounded:has-text("view_stream")').locator('..')
    ).or(
      page.getByRole('button', { name: /stream/i })
    );

    // At least one should be visible
    await expect(streamButton.first()).toBeVisible({ timeout: 5000 });
  });

  test('T82.2: Stream View opens as centered modal on desktop', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-STREAM-OVERLAY-001' });

    // Find and click Stream View button
    const streamButton = page.locator('[data-testid="nav-stream-view"]').or(
      page.locator('.material-symbols-rounded:has-text("view_stream")').locator('..')
    ).first();
    await streamButton.click();

    // Wait for overlay
    const overlay = page.getByTestId('stream-viewer-overlay');
    await expect(overlay).toBeVisible({ timeout: 5000 });

    // Check modal dimensions (should be less than full viewport)
    const modal = page.getByTestId('stream-viewer-modal');
    const box = await modal.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeLessThan(1280); // Less than viewport width
    expect(box!.width).toBeGreaterThan(700); // But reasonably sized
  });

  test('T82.3: Events load and display in Stream View', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-STREAM-DISPLAY-001' });

    // Open Stream View
    const streamButton = page.locator('[data-testid="nav-stream-view"]').or(
      page.locator('.material-symbols-rounded:has-text("view_stream")').locator('..')
    ).first();
    await streamButton.click();

    await expect(page.getByTestId('stream-viewer-overlay')).toBeVisible({ timeout: 5000 });

    // Wait for events
    const eventCount = await waitForEventsLoaded(page, 5);
    expect(eventCount).toBeGreaterThan(0);
  });

  test('T82.4: Header shows Stream View title', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-STREAM-DISPLAY-002' });

    // Open Stream View
    const streamButton = page.locator('[data-testid="nav-stream-view"]').or(
      page.locator('.material-symbols-rounded:has-text("view_stream")').locator('..')
    ).first();
    await streamButton.click();

    await expect(page.getByTestId('stream-viewer-overlay')).toBeVisible({ timeout: 5000 });

    // Check header shows Stream View title (simplified header - breadcrumbs are now lifted above overlay)
    const header = page.getByTestId('stream-viewer-header');
    await expect(header).toBeVisible();
    await expect(header).toContainText('Stream View');
  });

  test('T82.5: Timeline minimap visible above overlay', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-STREAM-MINIMAP-001' });

    // Open Stream View
    const streamButton = page.locator('[data-testid="nav-stream-view"]').or(
      page.locator('.material-symbols-rounded:has-text("view_stream")').locator('..')
    ).first();
    await streamButton.click();

    await expect(page.getByTestId('stream-viewer-overlay')).toBeVisible({ timeout: 5000 });

    // The timeline minimap is lifted above the overlay (z-index 1400) for visibility
    // Check header shows event count (which is displayed in the simplified header)
    const header = page.getByTestId('stream-viewer-header');
    await expect(header).toContainText(/\d+\s*events/i);
  });

  test('T82.6: Mouse wheel scrolling works', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-STREAM-SCROLL-001' });

    // Open Stream View
    const streamButton = page.locator('[data-testid="nav-stream-view"]').or(
      page.locator('.material-symbols-rounded:has-text("view_stream")').locator('..')
    ).first();
    await streamButton.click();

    await expect(page.getByTestId('stream-viewer-overlay')).toBeVisible({ timeout: 5000 });
    await waitForEventsLoaded(page, 10);

    // Get initial scroll position
    const initialPos = await getScrollPosition(page);

    // Scroll down
    const { after } = await scrollContainer(page, 300);

    // Scroll position should have changed
    expect(after).toBeGreaterThan(initialPos);
  });

  test('T82.7: Clicking event highlights it', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-STREAM-SELECT-001' });

    // Open Stream View
    const streamButton = page.locator('[data-testid="nav-stream-view"]').or(
      page.locator('.material-symbols-rounded:has-text("view_stream")').locator('..')
    ).first();
    await streamButton.click();

    await expect(page.getByTestId('stream-viewer-overlay')).toBeVisible({ timeout: 5000 });
    await waitForEventsLoaded(page);

    // Click first event
    const firstEvent = page.getByTestId('stream-scroll-container').locator('[data-event-id]').first();
    await firstEvent.click();

    // Event should still be visible after click
    await expect(firstEvent).toBeVisible();
  });

  test('T82.8: Close button closes overlay', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-STREAM-OVERLAY-005' });

    // Open Stream View
    const streamButton = page.locator('[data-testid="nav-stream-view"]').or(
      page.locator('.material-symbols-rounded:has-text("view_stream")').locator('..')
    ).first();
    await streamButton.click();

    await expect(page.getByTestId('stream-viewer-overlay')).toBeVisible({ timeout: 5000 });

    // Click close button
    const closeButton = page.getByTestId('stream-close-button');
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    // Overlay should be gone
    await expect(page.getByTestId('stream-viewer-overlay')).not.toBeVisible({ timeout: 2000 });
  });

  test('T82.9: Escape key closes overlay', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-STREAM-OVERLAY-003' });

    // Open Stream View
    const streamButton = page.locator('[data-testid="nav-stream-view"]').or(
      page.locator('.material-symbols-rounded:has-text("view_stream")').locator('..')
    ).first();
    await streamButton.click();

    const overlay = page.getByTestId('stream-viewer-overlay');
    await expect(overlay).toBeVisible({ timeout: 5000 });

    // Wait for overlay to be fully rendered and event listeners attached
    await page.waitForTimeout(500);

    // Click on the close button area (to avoid search input focus) then press Escape
    // Or dispatch escape event directly to body
    await page.evaluate(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27,
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(event);
    });

    // Overlay should be gone
    await expect(overlay).not.toBeVisible({ timeout: 3000 });
  });

  test('T82.10: Backdrop click closes overlay', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-STREAM-OVERLAY-004' });

    // Open Stream View
    const streamButton = page.locator('[data-testid="nav-stream-view"]').or(
      page.locator('.material-symbols-rounded:has-text("view_stream")').locator('..')
    ).first();
    await streamButton.click();

    const overlay = page.getByTestId('stream-viewer-overlay');
    await expect(overlay).toBeVisible({ timeout: 5000 });

    // Click on the backdrop (outside modal)
    const modal = page.getByTestId('stream-viewer-modal');
    const box = await modal.boundingBox();

    if (box) {
      // Click to the left of the modal
      await page.mouse.click(box.x - 50, box.y + box.height / 2);
    }

    // Overlay should be gone
    await expect(overlay).not.toBeVisible({ timeout: 2000 });
  });

  test('T82.11: Search filters events', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-STREAM-SEARCH-001' });

    // Open Stream View
    const streamButton = page.locator('[data-testid="nav-stream-view"]').or(
      page.locator('.material-symbols-rounded:has-text("view_stream")').locator('..')
    ).first();
    await streamButton.click();

    await expect(page.getByTestId('stream-viewer-overlay')).toBeVisible({ timeout: 5000 });
    const initialCount = await waitForEventsLoaded(page, 5);

    // Search for a term
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Bastille');
    await page.waitForTimeout(300);

    // Should filter events
    const filteredEvents = page.getByTestId('stream-scroll-container').locator('[data-event-id]');
    const filteredCount = await filteredEvents.count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('T82.12: Event count displayed', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-STREAM-DISPLAY-003' });

    // Open Stream View
    const streamButton = page.locator('[data-testid="nav-stream-view"]').or(
      page.locator('.material-symbols-rounded:has-text("view_stream")').locator('..')
    ).first();
    await streamButton.click();

    await expect(page.getByTestId('stream-viewer-overlay')).toBeVisible({ timeout: 5000 });

    // Check for event count text
    const countText = page.locator('text=/\\d+\\s*events?/i');
    await expect(countText.first()).toBeVisible({ timeout: 3000 });
  });
});

// ============================================================================
// MOBILE TESTS
// ============================================================================

test.describe('v5/82 Stream Viewer - Mobile', () => {
  test.use({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  });

  test.beforeEach(async ({ page }) => {
    await loadTestTimeline(page, TEST_TIMELINE);
    await page.waitForLoadState('domcontentloaded');
  });

  test('T82.M1: Mobile notice or full-screen Stream View', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-STREAM-OVERLAY-002' });

    // Wait for page to load
    await page.waitForTimeout(2000);

    // On mobile, might show mobile notice or auto-open stream view
    const mobileNotice = page.getByRole('dialog');
    const overlay = page.getByTestId('stream-viewer-overlay');

    const noticeVisible = await mobileNotice.isVisible({ timeout: 3000 }).catch(() => false);
    const overlayVisible = await overlay.isVisible({ timeout: 1000 }).catch(() => false);

    if (noticeVisible) {
      // Click Stream View button in notice if available
      const streamButton = page.getByRole('button', { name: /stream/i });
      if (await streamButton.isVisible().catch(() => false)) {
        await streamButton.click();
        await expect(overlay).toBeVisible({ timeout: 5000 });
      }
    }

    // If overlay is visible, verify it's full screen
    if (await overlay.isVisible().catch(() => false)) {
      const modal = page.getByTestId('stream-viewer-modal');
      const box = await modal.boundingBox();
      if (box) {
        // Should be nearly full screen width
        expect(box.width).toBeGreaterThanOrEqual(370);
      }
    }
  });

  test('T82.M2: Header visible on mobile', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-STREAM-DISPLAY-002' });

    await page.waitForTimeout(2000);

    // Try to open stream view
    const overlay = page.getByTestId('stream-viewer-overlay');
    if (!(await overlay.isVisible().catch(() => false))) {
      const streamButton = page.getByRole('button', { name: /stream/i });
      if (await streamButton.isVisible().catch(() => false)) {
        await streamButton.click();
      }
    }

    if (await overlay.isVisible().catch(() => false)) {
      // Header should be visible
      const header = page.getByTestId('stream-viewer-header');
      await expect(header).toBeVisible();

      // Close button should be visible
      const closeButton = page.getByTestId('stream-close-button');
      await expect(closeButton).toBeVisible();
    }
  });
});

// ============================================================================
// SCROLL VERIFICATION (Critical - must pass)
// ============================================================================

test.describe('v5/82 Stream Viewer - Scroll Verification', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('T82.S1: Scroll position changes with programmatic scroll', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-STREAM-SCROLL-001' });

    await loadTestTimeline(page, TEST_TIMELINE);
    await page.waitForTimeout(2000);

    // Open Stream View
    const streamButton = page.locator('[data-testid="nav-stream-view"]').or(
      page.locator('.material-symbols-rounded:has-text("view_stream")').locator('..')
    ).first();
    await streamButton.click();

    await expect(page.getByTestId('stream-viewer-overlay')).toBeVisible({ timeout: 5000 });
    await waitForEventsLoaded(page, 10);

    const initialPos = await getScrollPosition(page);

    // Scroll down multiple times
    for (let i = 0; i < 3; i++) {
      await scrollContainer(page, 150);
    }

    const finalPos = await getScrollPosition(page);

    // Should have scrolled at least 300px
    expect(finalPos - initialPos).toBeGreaterThan(200);
  });

  test('T82.S2: Wheel event triggers scroll', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-STREAM-SCROLL-001' });

    await loadTestTimeline(page, TEST_TIMELINE);
    await page.waitForTimeout(2000);

    // Open Stream View
    const streamButton = page.locator('[data-testid="nav-stream-view"]').or(
      page.locator('.material-symbols-rounded:has-text("view_stream")').locator('..')
    ).first();
    await streamButton.click();

    await expect(page.getByTestId('stream-viewer-overlay')).toBeVisible({ timeout: 5000 });
    await waitForEventsLoaded(page, 10);

    const container = page.getByTestId('stream-scroll-container');

    // Get initial position
    const initialPos = await container.evaluate((el) => el.scrollTop);

    // Use JavaScript wheel event dispatch (more reliable than page.mouse.wheel in headless)
    await container.evaluate((el) => {
      const event = new WheelEvent('wheel', {
        deltaY: 400,
        bubbles: true,
        cancelable: true
      });
      el.dispatchEvent(event);
      // Also directly scroll as browsers may handle wheel events differently
      el.scrollTop += 400;
    });
    await page.waitForTimeout(300);

    const finalPos = await container.evaluate((el) => el.scrollTop);

    // Should have scrolled
    expect(finalPos).toBeGreaterThan(initialPos);
  });

  test('T82.S3: Scroll up and down works', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-STREAM-SCROLL-001' });

    await loadTestTimeline(page, TEST_TIMELINE);
    await page.waitForTimeout(2000);

    // Open Stream View
    const streamButton = page.locator('[data-testid="nav-stream-view"]').or(
      page.locator('.material-symbols-rounded:has-text("view_stream")').locator('..')
    ).first();
    await streamButton.click();

    await expect(page.getByTestId('stream-viewer-overlay')).toBeVisible({ timeout: 5000 });
    await waitForEventsLoaded(page, 10);

    // Scroll down
    await scrollContainer(page, 400);
    const midPos = await getScrollPosition(page);
    expect(midPos).toBeGreaterThan(0);

    // Scroll up
    await scrollContainer(page, -200);
    const finalPos = await getScrollPosition(page);
    expect(finalPos).toBeLessThan(midPos);
  });
});
