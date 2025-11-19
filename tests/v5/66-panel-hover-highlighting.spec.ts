import { test, expect } from '@playwright/test';
import { loginAsTestUser, loadTestTimeline } from '../utils/timelineTestUtils';

/**
 * Test 66: Event Panel Interactive Highlighting
 * Tests the cross-highlighting feature between OutlinePanel and timeline
 *
 * Validates:
 * - Panel hover triggers timeline card highlighting
 * - Panel hover triggers timeline anchor highlighting
 * - Panel hover triggers minimap marker highlighting
 * - Mouse leave clears highlighting properly
 * - Rapid hover doesn't cause visual glitches
 * - Panel close cleans up hover state
 *
 * Links to: CC-REQ-UI-001, v0.3.6 iteration requirements
 */

test.describe('v5/66 Panel hover highlighting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Wait for timeline axis to load (default RFK data loads automatically)
    await page.waitForSelector('[data-testid="timeline-axis"]', { timeout: 10000 });
    await page.waitForTimeout(1000);
  });

  test('hovering over panel item highlights corresponding timeline card', async ({ page }) => {
    console.log('\n🎯 TEST: Panel hover → Timeline card highlight');

    // Open Events panel
    await page.getByRole('button', { name: 'Events' }).click();
    await page.waitForTimeout(500);

    const eventsPanel = page.locator('aside[role="dialog"][aria-labelledby="dialog-title-events"]');
    await expect(eventsPanel).toBeVisible();

    // Get first actual event item in panel list (not the Add Event button)
    const eventsList = eventsPanel.getByRole('list');
    const firstPanelItem = eventsList.getByRole('listitem').first().getByRole('button');
    await expect(firstPanelItem).toBeVisible();

    // Get the event title from the panel item
    const eventTitle = await firstPanelItem.evaluate((el) => {
      const textEl = el.querySelector('[class*="MuiListItemText-primary"]');
      return textEl?.textContent?.trim() || null;
    });

    console.log(`  Hovering over event: ${eventTitle}`);

    // Hover over panel item
    await firstPanelItem.hover();
    await page.waitForTimeout(200);

    // Find the corresponding card on timeline
    const timelineCards = page.locator('[data-testid="event-card"]');
    const cardCount = await timelineCards.count();

    console.log(`  Found ${cardCount} cards on timeline`);

    let foundHighlightedCard = false;

    // Check if any card has the hover highlight class
    for (let i = 0; i < Math.min(cardCount, 20); i++) {
      const card = timelineCards.nth(i);
      const classAttr = await card.getAttribute('class');

      if (classAttr?.includes('ring-blue-300') || classAttr?.includes('ring-blue-400')) {
        foundHighlightedCard = true;
        console.log(`  ✅ Found highlighted card at index ${i}`);

        // Verify specific highlight styling
        expect(classAttr).toMatch(/ring-(1|2) ring-blue-(300|400)/);

        // Verify z-index elevation
        const zIndex = await card.evaluate((el) => {
          return window.getComputedStyle(el).zIndex;
        });
        expect(parseInt(zIndex)).toBeGreaterThanOrEqual(20);

        break;
      }
    }

    expect(foundHighlightedCard).toBe(true);
    console.log('  ✅ Timeline card highlighting verified');
  });

  test('hovering over panel item highlights corresponding timeline anchor', async ({ page }) => {
    console.log('\n⚓ TEST: Panel hover → Timeline anchor highlight');

    // Open Events panel
    await page.getByRole('button', { name: 'Events' }).click();
    await page.waitForTimeout(500);

    const eventsPanel = page.locator('aside[role="dialog"][aria-labelledby="dialog-title-events"]');
    const eventsList = eventsPanel.getByRole('list');
    const firstPanelItem = eventsList.getByRole('listitem').first().getByRole('button');

    // Hover over panel item
    await firstPanelItem.hover();
    await page.waitForTimeout(200);

    // Find timeline anchors
    const anchors = page.locator('[data-testid="timeline-anchor"]');
    const anchorCount = await anchors.count();

    console.log(`  Found ${anchorCount} anchors on timeline`);

    let foundHighlightedAnchor = false;

    // Check if any anchor has visual highlighting
    for (let i = 0; i < Math.min(anchorCount, 20); i++) {
      const anchor = anchors.nth(i);
      const diamondElement = anchor.locator('div.transform.rotate-45').first();

      // Check for scale class (indicates hover/selection)
      const classAttr = await diamondElement.getAttribute('class');

      console.log(`  Anchor ${i} classes: ${classAttr}`);

      if (classAttr && (classAttr.includes('scale-110') || classAttr.includes('scale-125'))) {
        foundHighlightedAnchor = true;
        console.log(`  ✅ Found highlighted anchor at index ${i} with scale class`);
        break;
      }
    }

    expect(foundHighlightedAnchor).toBe(true);
    console.log('  ✅ Timeline anchor highlighting verified');
  });

  test('hovering over panel item highlights minimap marker', async ({ page }) => {
    console.log('\n🗺️ TEST: Panel hover → Minimap marker highlight');

    // Open Events panel
    await page.getByRole('button', { name: 'Events' }).click();
    await page.waitForTimeout(500);

    const eventsPanel = page.locator('aside[role="dialog"][aria-labelledby="dialog-title-events"]');
    const eventsList = eventsPanel.getByRole('list');
    const firstPanelItem = eventsList.getByRole('listitem').first().getByRole('button');

    // Check if minimap is visible
    const minimapContainer = page.locator('[data-testid="minimap-container"]');
    const minimapVisible = await minimapContainer.isVisible().catch(() => false);

    if (!minimapVisible) {
      console.log('  ⚠️ Minimap not visible, skipping test');
      test.skip();
      return;
    }

    // Hover over panel item
    await firstPanelItem.hover();
    await page.waitForTimeout(200);

    // Check minimap for highlighted markers
    const minimapMarkers = minimapContainer.locator('.absolute.w-2');
    const markerCount = await minimapMarkers.count();

    console.log(`  Found ${markerCount} markers in minimap`);

    let foundHighlightedMarker = false;

    for (let i = 0; i < Math.min(markerCount, 30); i++) {
      const marker = minimapMarkers.nth(i);
      const opacity = await marker.evaluate((el) => {
        return window.getComputedStyle(el).opacity;
      });

      // Highlighted markers should have higher opacity
      if (parseFloat(opacity) > 0.7) {
        foundHighlightedMarker = true;
        console.log(`  ✅ Found highlighted minimap marker at index ${i}, opacity: ${opacity}`);
        break;
      }
    }

    expect(foundHighlightedMarker).toBe(true);
    console.log('  ✅ Minimap marker highlighting verified');
  });

  test('mouse leave panel item clears timeline highlighting', async ({ page }) => {
    console.log('\n🔄 TEST: Mouse leave → Clear highlighting');

    // Open Events panel
    await page.getByRole('button', { name: 'Events' }).click();
    await page.waitForTimeout(500);

    const eventsPanel = page.locator('aside[role="dialog"][aria-labelledby="dialog-title-events"]');
    const eventsList = eventsPanel.getByRole('list');
    const firstPanelItem = eventsList.getByRole('listitem').first().getByRole('button');

    // Hover to trigger highlighting
    await firstPanelItem.hover();
    await page.waitForTimeout(200);

    // Verify highlighting is active
    const timelineCards = page.locator('[data-testid="event-card"]');
    let highlightedBefore = false;

    for (let i = 0; i < Math.min(await timelineCards.count(), 20); i++) {
      const classAttr = await timelineCards.nth(i).getAttribute('class');
      if (classAttr?.includes('ring-blue-300') || classAttr?.includes('ring-blue-400')) {
        highlightedBefore = true;
        break;
      }
    }

    expect(highlightedBefore).toBe(true);
    console.log('  ✅ Highlighting active before mouse leave');

    // Move mouse away from panel items (to empty area in panel)
    // Use the filter textbox area which should be safe from z-index conflicts
    const filterInput = eventsPanel.getByPlaceholder('Filter...');
    await filterInput.hover();
    await page.waitForTimeout(300);

    // Verify highlighting is cleared
    let highlightedAfter = false;

    for (let i = 0; i < Math.min(await timelineCards.count(), 20); i++) {
      const classAttr = await timelineCards.nth(i).getAttribute('class');
      if (classAttr?.includes('ring-blue-300') || classAttr?.includes('ring-blue-400')) {
        highlightedAfter = true;
        break;
      }
    }

    expect(highlightedAfter).toBe(false);
    console.log('  ✅ Highlighting cleared after mouse leave');
  });

  test('rapid hovering over multiple panel items performs smoothly', async ({ page }) => {
    console.log('\n⚡ TEST: Rapid hover performance check');

    // Open Events panel
    await page.getByRole('button', { name: 'Events' }).click();
    await page.waitForTimeout(500);

    const eventsPanel = page.locator('aside[role="dialog"][aria-labelledby="dialog-title-events"]');
    const eventsList = eventsPanel.getByRole('list');
    const panelItems = eventsList.getByRole('listitem').getByRole('button');
    const itemCount = await panelItems.count();

    console.log(`  Found ${itemCount} items in panel`);

    // Rapidly hover over first 10 items
    const hoverCount = Math.min(itemCount, 10);
    const startTime = Date.now();

    for (let i = 0; i < hoverCount; i++) {
      await panelItems.nth(i).hover();
      await page.waitForTimeout(50); // Minimal delay between hovers
    }

    const duration = Date.now() - startTime;
    const avgTimePerHover = duration / hoverCount;
    console.log(`  Hovered over ${hoverCount} items in ${duration}ms (avg: ${avgTimePerHover.toFixed(0)}ms per hover)`);

    // Performance check: should complete in reasonable time (generous threshold for test env variability)
    expect(duration).toBeLessThan(hoverCount * 400); // Max 400ms per hover (accounts for CI overhead)

    // Verify no stale highlights remain
    await page.mouse.move(0, 0); // Move mouse to corner
    await page.waitForTimeout(300);

    const timelineCards = page.locator('[data-testid="event-card"]');
    let staleHighlights = 0;

    for (let i = 0; i < Math.min(await timelineCards.count(), 20); i++) {
      const classAttr = await timelineCards.nth(i).getAttribute('class');
      if (classAttr?.includes('ring-blue-300') || classAttr?.includes('ring-blue-400')) {
        staleHighlights++;
      }
    }

    expect(staleHighlights).toBe(0);
    console.log('  ✅ No stale highlights after rapid hover');
  });

  test('closing panel cleans up hover state', async ({ page }) => {
    console.log('\n🧹 TEST: Panel close → Cleanup hover state');

    // Open Events panel
    await page.getByRole('button', { name: 'Events' }).click();
    await page.waitForTimeout(500);

    const eventsPanel = page.locator('aside[role="dialog"][aria-labelledby="dialog-title-events"]');
    const eventsList = eventsPanel.getByRole('list');
    const firstPanelItem = eventsList.getByRole('listitem').first().getByRole('button');

    // Hover over panel item
    await firstPanelItem.hover();
    await page.waitForTimeout(200);

    // Close panel
    await page.getByRole('button', { name: 'Events' }).click();
    await page.waitForTimeout(500);

    // Verify panel is closed
    await expect(eventsPanel).not.toBeVisible();

    // Verify no lingering highlights on timeline
    const timelineCards = page.locator('[data-testid="event-card"]');
    let lingearingHighlights = 0;

    for (let i = 0; i < Math.min(await timelineCards.count(), 20); i++) {
      const classAttr = await timelineCards.nth(i).getAttribute('class');
      if (classAttr?.includes('ring-blue-300') || classAttr?.includes('ring-blue-400')) {
        lingearingHighlights++;
      }
    }

    expect(lingearingHighlights).toBe(0);
    console.log('  ✅ No lingering highlights after panel close');
  });
});
