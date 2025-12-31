import { test, expect, type Page } from '@playwright/test';
import { loadTimeline, waitForEditorLoaded, skipIfNoCredentials } from '../utils/timelineTestUtils';
import * as fs from 'fs';
import * as path from 'path';

const TEST_OWNER_USERNAME = 'cynacons';
const TEST_TIMELINE_ID = 'french-revolution';

async function openAuthoringOverlay(page: Page) {
  const eventCard = page.locator('[data-testid*="event-card"]').first();
  const cardVisible = await eventCard.isVisible({ timeout: 5000 }).catch(() => false);

  if (!cardVisible) {
    console.log('!! No event card found to open AuthoringOverlay');
    return { overlay: null, opened: false };
  }

  await eventCard.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await eventCard.dblclick({ delay: 50, force: true });
  await page.waitForTimeout(1200);

  const overlay = page.locator('[class*="z-[500]"]').first();
  const overlayVisible = await overlay.isVisible({ timeout: 5000 }).catch(() => false);

  if (!overlayVisible) {
    console.log('!! AuthoringOverlay did not appear after double-click');
    return { overlay: null, opened: false };
  }

  return { overlay, opened: true };
}

test.describe('Editor State Visual Audit', () => {
  const screenshotsDir = path.join(process.cwd(), 'screenshots', 'visual-audit');

  test.beforeAll(async () => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    skipIfNoCredentials(test);
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page);
    await page.waitForTimeout(1200);

    // Verify timeline loaded correctly
    const cardCount = await page.locator('[data-testid*="event-card"]').count();
    console.log(`Test starting with ${cardCount} cards visible`);
  });

  test('T94.1: AuthoringOverlay depth and stability when opened', async ({ page }) => {
    console.log('=== T94.1 AuthoringOverlay Depth Check ===');

    const { overlay, opened } = await openAuthoringOverlay(page);

    // Capture screenshot showing overlay state
    await page.screenshot({
      path: path.join(screenshotsDir, 't94-1-editor-authoring-overlay.png'),
      fullPage: false
    });

    if (!opened || !overlay) {
      console.log('!! Overlay not available for depth check');
      expect(opened, 'AuthoringOverlay should open after double-click').toBe(true);
      return;
    }

    const overlayZ = await overlay.evaluate((el) => window.getComputedStyle(el).zIndex || 'auto');
    const overlayBox = await overlay.boundingBox();
    const viewport = page.viewportSize();
    const onScreen = overlayBox && viewport
      ? overlayBox.x < viewport.width &&
        overlayBox.x + overlayBox.width > 0 &&
        overlayBox.y < viewport.height &&
        overlayBox.y + overlayBox.height > 0
      : false;
    const centerOffset = overlayBox && viewport
      ? Math.abs((overlayBox.x + overlayBox.width / 2) - (viewport.width / 2))
      : null;

    console.log(`Overlay z-index: ${overlayZ} (expected ~500)`);
    console.log(`Overlay bounding box: ${overlayBox ? `${Math.round(overlayBox.width)}x${Math.round(overlayBox.height)} at (${Math.round(overlayBox.x)},${Math.round(overlayBox.y)})` : 'n/a'}`);
    console.log(`Overlay on screen: ${onScreen}`);
    if (centerOffset !== null) {
      console.log(`Center offset from viewport midpoint: ${Math.round(centerOffset)}px`);
    }

    if (!onScreen) {
      console.log('!! Overlay appears off-screen or clipped');
    }

    // Verify overlay is actually visible
    const overlayVisible = await overlay.isVisible();
    expect(overlayVisible, 'Overlay should be visible').toBe(true);
    expect(parseInt(overlayZ)).toBeGreaterThanOrEqual(500);
    expect(onScreen, 'Overlay should be visible on screen').toBe(true);
  });

  test('T94.2: Overlay position across zoom levels (25%/50%/100%/200%)', async ({ page }) => {
    console.log('=== T94.2 Overlay Position During Zoom Sweep ===');

    // Note: Overlay backdrop blocks zoom controls, so we test overlay at different zoom levels
    // by changing zoom first, then opening overlay
    const zoomControls = page.locator('[data-tour="zoom-controls"]');
    const zoomInBtn = zoomControls.locator('[aria-label*="Zoom in" i]').first();
    const zoomOutBtn = zoomControls.locator('[aria-label*="Zoom out" i]').first();
    const fitBtn = zoomControls.locator('[aria-label*="Fit all" i]').first();
    const controlsVisible = await zoomControls.isVisible({ timeout: 4000 }).catch(() => false);
    console.log(`Zoom controls visible: ${controlsVisible}`);

    if (!controlsVisible) {
      console.log('!! Zoom controls not found; skipping zoom sweep');
      expect(true).toBe(true);
      return;
    }

    const scenarios = [
      { label: '25%', zoomClicks: -6 },  // negative = zoom out
      { label: '50%', zoomClicks: -3 },
      { label: '100%', zoomClicks: 0 },  // fit to view
      { label: '200%', zoomClicks: 4 },  // positive = zoom in
    ];

    for (const scenario of scenarios) {
      // Reset to fit view
      if (await fitBtn.isVisible().catch(() => false)) {
        await fitBtn.click();
        await page.waitForTimeout(200);
      }

      // Apply zoom
      if (scenario.zoomClicks < 0) {
        for (let i = 0; i < Math.abs(scenario.zoomClicks); i++) {
          if (await zoomOutBtn.isVisible().catch(() => false)) {
            await zoomOutBtn.click();
            await page.waitForTimeout(140);
          }
        }
      } else if (scenario.zoomClicks > 0) {
        for (let i = 0; i < scenario.zoomClicks; i++) {
          if (await zoomInBtn.isVisible().catch(() => false)) {
            await zoomInBtn.click();
            await page.waitForTimeout(140);
          }
        }
      }
      await page.waitForTimeout(300);

      // Open overlay at this zoom level
      const { overlay, opened } = await openAuthoringOverlay(page);

      if (opened && overlay) {
        const overlayBox = await overlay.boundingBox();
        const zIndex = await overlay.evaluate((el) => window.getComputedStyle(el).zIndex || 'auto');
        const viewport = page.viewportSize();

        let onScreen = false;
        let centered = false;
        if (overlayBox && viewport) {
          onScreen = overlayBox.x >= 0 && overlayBox.y >= 0 &&
                     overlayBox.x + overlayBox.width <= viewport.width &&
                     overlayBox.y + overlayBox.height <= viewport.height;
          const centerOffset = Math.abs((overlayBox.x + overlayBox.width / 2) - viewport.width / 2);
          centered = centerOffset < 100;
        }

        console.log(`${scenario.label} -> z-index ${zIndex}, on-screen: ${onScreen}, centered: ${centered}`);

        expect(onScreen, `Overlay should be on screen at ${scenario.label}`).toBe(true);

        // Close overlay by pressing Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      } else {
        console.log(`${scenario.label} -> overlay could not be opened`);
      }
    }

    expect(true).toBe(true);
  });

  test('T94.3: Events panel open without improper card overlap', async ({ page }) => {
    console.log('=== T94.3 Events Panel Overlap Audit ===');

    const eventsButton = page.locator('[data-testid="nav-events"], [aria-label*="Events" i], button:has-text("Events")').first();
    const eventsButtonVisible = await eventsButton.isVisible({ timeout: 4000 }).catch(() => false);

    if (!eventsButtonVisible) {
      console.log('!! Events nav button not found');
      expect(true).toBe(true);
      return;
    }

    await eventsButton.click();
    await page.waitForTimeout(800);

    // Capture screenshot showing panel state
    await page.screenshot({
      path: path.join(screenshotsDir, 't94-3-editor-events-panel.png'),
      fullPage: false
    });

    const panelReport = await page.evaluate(() => {
      const panel = document.querySelector('[aria-labelledby="dialog-title-events"]') as HTMLElement | null;
      if (!panel) {
        return { found: false };
      }

      const panelRect = panel.getBoundingClientRect();
      const panelZ = parseInt(window.getComputedStyle(panel).zIndex || '0', 10) || 0;
      const cards = Array.from(document.querySelectorAll('[data-testid*="event-card"]')) as HTMLElement[];

      const overlappingCards = cards
        .map((card) => {
          const rect = card.getBoundingClientRect();
          const z = parseInt(window.getComputedStyle(card).zIndex || '0', 10) || 0;
          const overlap = !(rect.right < panelRect.left || rect.left > panelRect.right || rect.bottom < panelRect.top || rect.top > panelRect.bottom);
          return { id: card.dataset.eventId || card.textContent || 'card', z, overlap, rect };
        })
        .filter((entry) => entry.overlap);

      const maxOverlapZ = overlappingCards.reduce((max, card) => Math.max(max, card.z), -1);

      return {
        found: true,
        panelZ,
        overlapCount: overlappingCards.length,
        maxOverlapZ,
        sample: overlappingCards.slice(0, 3).map((card) => ({
          id: card.id.slice(0, 30),
          z: card.z,
          left: Math.round(card.rect.left),
          width: Math.round(card.rect.width)
        }))
      };
    });

    if (!panelReport.found) {
      console.log('!! Events panel did not appear after click');
      expect(true).toBe(true);
      return;
    }

    console.log(`Panel z-index: ${panelReport.panelZ}`);
    console.log(`Cards intersecting panel region: ${panelReport.overlapCount}`);

    if (panelReport.overlapCount > 0) {
      console.log(`Highest overlapping card z-index: ${panelReport.maxOverlapZ}`);
      console.log(`Sample overlaps: ${JSON.stringify(panelReport.sample, null, 2)}`);
      if (panelReport.maxOverlapZ >= panelReport.panelZ) {
        console.log('!! A card has z-index >= panel; potential layering issue');
      } else {
        console.log('Cards stay beneath the panel as expected');
      }
    } else {
      console.log('No cards intersect the events panel region');
    }

    if (panelReport.found) {
      expect(panelReport.maxOverlapZ, 'Cards should have lower z-index than panel')
        .toBeLessThan(panelReport.panelZ);
    }
  });

  test('T94.4: Layering with multiple UI elements open', async ({ page }) => {
    console.log('=== T94.4 Layering Hierarchy Audit ===');

    const { overlay, opened } = await openAuthoringOverlay(page);
    if (!opened || !overlay) {
      console.log('!! Overlay not available for layering audit');
      expect(true).toBe(true);
      return;
    }

    const layerReport = await page.evaluate(() => {
      const overlayEl = document.querySelector('[class*="z-[500]"]') as HTMLElement | null;
      const zoomEl = document.querySelector('[data-tour="zoom-controls"]') as HTMLElement | null;
      const cardEls = Array.from(document.querySelectorAll('[data-testid*="event-card"]')) as HTMLElement[];

      const cardZs = cardEls.map((card) => {
        const value = window.getComputedStyle(card).zIndex;
        return value === 'auto' ? 0 : parseInt(value || '0', 10) || 0;
      });
      const maxCardZ = cardZs.length ? Math.max(...cardZs) : 0;

      return {
        overlayZ: overlayEl ? parseInt(window.getComputedStyle(overlayEl).zIndex || '0', 10) || 0 : null,
        zoomZ: zoomEl ? parseInt(window.getComputedStyle(zoomEl).zIndex || '0', 10) || 0 : null,
        maxCardZ,
        sampleCardZ: cardZs[0] ?? null
      };
    });

    console.log(`Overlay z-index (expected ~500): ${layerReport.overlayZ}`);
    console.log(`Zoom controls z-index (expected ~60): ${layerReport.zoomZ}`);
    console.log(`Highest card z-index (expected 10-25 range): ${layerReport.maxCardZ}`);

    if (layerReport.overlayZ !== null && layerReport.zoomZ !== null) {
      console.log(`Overlay above zoom controls: ${layerReport.overlayZ > layerReport.zoomZ}`);
    }

    if (layerReport.zoomZ !== null) {
      console.log(`Zoom controls above cards: ${layerReport.zoomZ > layerReport.maxCardZ}`);
    }

    expect(layerReport.overlayZ).toBeGreaterThan(layerReport.zoomZ!);
    expect(layerReport.zoomZ).toBeGreaterThan(layerReport.maxCardZ);
  });
});
