/**
 * Production Editor Functionality Tests
 * Tests for timeline editor, AuthoringOverlay, and minimap behavior
 *
 * These tests verify critical issues:
 * - Double-click opens view mode (not edit mode)
 * - Event data loads correctly
 * - Only one event highlighted as "current" in side panels
 * - Minimap doesn't have excessive glow
 */

import { test, expect } from '@playwright/test';
import { monitorConsole, waitForQuiet } from './utils';

const PRODUCTION_URL = 'https://powertimeline.com';
const TEST_TIMELINE_URL = `${PRODUCTION_URL}/cynacons/timeline-french-revolution`;

test.describe('Production Editor Functionality', () => {

  test('timeline page loads without critical errors', async ({ page }) => {
    const consoleMonitor = monitorConsole(page);

    await page.goto(TEST_TIMELINE_URL);
    await waitForQuiet(page, 2000);

    // Timeline should render
    await expect(page.locator('[data-testid="timeline-minimap"]')).toBeVisible({ timeout: 15000 });

    // Check for critical errors (ignore network/Google API issues)
    const criticalErrors = consoleMonitor.errors.filter(e =>
      !e.includes('api.js') &&
      !e.includes('ERR_CONNECTION') &&
      !e.includes('favicon') &&
      e.includes('Error')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('minimap event markers do not all appear highlighted', async ({ page }) => {
    await page.goto(TEST_TIMELINE_URL);
    await waitForQuiet(page, 2000);

    const minimap = page.locator('[data-testid="timeline-minimap"]');
    await expect(minimap).toBeVisible({ timeout: 15000 });

    // Get all event markers in minimap
    const markers = minimap.locator('div[title]');
    const markerCount = await markers.count();

    expect(markerCount).toBeGreaterThan(0);

    // Check that markers don't all have the same highlighted style
    // Normal markers should have boxShadow: 'none' (after our fix)
    // Only selected/hovered should have boxShadow
    let markersWithShadow = 0;
    for (let i = 0; i < Math.min(markerCount, 10); i++) {
      const marker = markers.nth(i);
      const boxShadow = await marker.evaluate(el => window.getComputedStyle(el).boxShadow);
      if (boxShadow !== 'none') {
        markersWithShadow++;
      }
    }

    // At most 1 marker should have shadow (the selected one, if any)
    expect(markersWithShadow).toBeLessThanOrEqual(1);
  });

  test('double-click on event card opens overlay with event data', async ({ page }) => {
    await page.goto(TEST_TIMELINE_URL);
    await waitForQuiet(page, 3000);

    // Wait for event cards to render
    const eventCards = page.locator('[data-testid="event-card"]');
    await expect(eventCards.first()).toBeVisible({ timeout: 15000 });

    // Get the title of the first event
    const firstCard = eventCards.first();
    const expectedTitle = await firstCard.locator('h3').first().textContent();

    // Double-click to open overlay
    await firstCard.dblclick();

    // Wait for overlay to appear
    const overlay = page.locator('[data-testid="authoring-overlay"]');
    await expect(overlay).toBeVisible({ timeout: 5000 });

    // Verify event data is loaded (title should appear in overlay)
    if (expectedTitle) {
      await expect(overlay.getByText(expectedTitle.trim())).toBeVisible({ timeout: 3000 });
    }

    // Verify we're in VIEW mode, not EDIT mode
    // In view mode, there should be an "Edit" button visible
    // In edit mode, there would be form fields with labels like "Title *"
    const editButton = overlay.getByRole('button', { name: /edit/i });
    const titleInput = overlay.getByLabel('Title *');

    // Either we see an Edit button (view mode) or we DON'T see a Title input field enabled
    const isViewMode = await editButton.isVisible().catch(() => false);
    const hasEditableTitle = await titleInput.isVisible().catch(() => false);

    // Should be in view mode OR title field should not be visible/editable
    expect(isViewMode || !hasEditableTitle).toBe(true);
  });

  test('side panels show only ONE event as current', async ({ page }) => {
    await page.goto(TEST_TIMELINE_URL);
    await waitForQuiet(page, 3000);

    // Open an event via double-click
    const eventCards = page.locator('[data-testid="event-card"]');
    await expect(eventCards.first()).toBeVisible({ timeout: 15000 });
    await eventCards.first().dblclick();

    // Wait for overlay
    const overlay = page.locator('[data-testid="authoring-overlay"]');
    await expect(overlay).toBeVisible({ timeout: 5000 });

    // Find all event buttons in side panels
    // Current event has purple background (--page-accent)
    const sideButtons = overlay.locator('button.w-full');
    const buttonCount = await sideButtons.count();

    if (buttonCount > 0) {
      let purpleBackgroundCount = 0;

      for (let i = 0; i < buttonCount; i++) {
        const button = sideButtons.nth(i);
        const bgColor = await button.evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.backgroundColor;
        });

        // Check if background is purple (page-accent is #8b5cf6 = rgb(139, 92, 246))
        if (bgColor.includes('139') && bgColor.includes('92') && bgColor.includes('246')) {
          purpleBackgroundCount++;
        }
      }

      // Only ONE event should have purple background (the current one)
      // Or ZERO if viewing a new event that's not in the list
      expect(purpleBackgroundCount).toBeLessThanOrEqual(1);
    }
  });

  test('favicon loads correctly', async ({ page }) => {
    await page.goto(PRODUCTION_URL);

    // Check that favicon link exists with cache-busting
    const faviconLink = page.locator('link[rel="icon"]');
    await expect(faviconLink).toHaveAttribute('href', /favicon\.png/);

    // Verify the favicon file is accessible
    const faviconHref = await faviconLink.getAttribute('href');
    if (faviconHref) {
      const faviconUrl = new URL(faviconHref, PRODUCTION_URL).toString();
      const response = await page.request.get(faviconUrl);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('image/png');
    }
  });
});
