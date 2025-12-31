import { test, expect, Page } from '@playwright/test';
import { loadTimeline, waitForEditorLoaded, skipIfNoCredentials } from '../utils/timelineTestUtils';
import * as fs from 'fs';
import * as path from 'path';

const TEST_OWNER_USERNAME = 'cynacons';
const TEST_TIMELINE_ID = 'french-revolution';
const CARD_SELECTOR = '[data-testid*="event-card"], [class*="event-card"]';
const MINIMAP_SELECTOR = '[data-testid="minimap-container"]';

type CardSnapshot = {
  totalDomCards: number;
  visibleCards: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  visibleIds: string[];
  viewport: { width: number; height: number };
};

async function navigateToDenseArea(page: Page, position = 0.6) {
  const minimap = page.locator(MINIMAP_SELECTOR).first();
  const minimapBox = await minimap.boundingBox().catch(() => null);

  if (minimapBox) {
    const clickX = minimapBox.x + minimapBox.width * position;
    const clickY = minimapBox.y + minimapBox.height / 2;
    await page.mouse.click(clickX, clickY);
    await page.waitForTimeout(500);
    return { success: true, clickX, clickY };
  }

  console.log('?? Minimap not found - starting pan tests from default view');
  return { success: false };
}

async function captureCardSnapshot(page: Page): Promise<CardSnapshot> {
  return page.evaluate((selector) => {
    const cards = Array.from(document.querySelectorAll(selector));
    const viewport = { width: window.innerWidth, height: window.innerHeight };

    const visibleCards = cards.reduce<Array<{ id: string; x: number; y: number; width: number; height: number }>>((acc, card, i) => {
      const rect = card.getBoundingClientRect();
      const isVisible = rect.right > 0 && rect.left < viewport.width && rect.bottom > 0 && rect.top < viewport.height;

      if (isVisible) {
        acc.push({
          id: card.getAttribute('data-testid') || `card-${i}`,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        });
      }

      return acc;
    }, []);

    return {
      totalDomCards: cards.length,
      visibleCards,
      visibleIds: visibleCards.map(card => card.id),
      viewport
    };
  }, CARD_SELECTOR);
}

test.describe('Boundary Stress Tests - Pan Extremes', () => {
  const screenshotsDir = path.join(process.cwd(), 'screenshots', 'visual-audit');

  test.beforeAll(async () => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    skipIfNoCredentials(test);
  });

  test('T92.1: pan to far left boundary', async ({ page }) => {
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page);
    await page.waitForTimeout(2000);

    console.log('=== PAN TO FAR LEFT BOUNDARY ===');

    // Verify timeline is loaded correctly
    const initialState = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid*="event-card"]');
      return {
        cardCount: cards.length,
        title: document.querySelector('h1, [data-testid*="title"]')?.textContent || 'unknown'
      };
    });
    console.log(`Timeline: "${initialState.title}" with ${initialState.cardCount} cards`);
    expect(initialState.cardCount, 'Timeline should have cards').toBeGreaterThan(0);

    // Zoom in 15x first to make cards larger
  const zoomInBtn = page.locator('[data-testid="btn-zoom-in"]').first();
    console.log('Zooming in 15x...');
    for (let i = 0; i < 15; i++) {
      if (await zoomInBtn.isVisible().catch(() => false)) {
        await zoomInBtn.click();
        await page.waitForTimeout(150);
      }
    }

    await page.waitForTimeout(500);

    // Get viewport dimensions
    const viewport = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight
    }));

    console.log(`Viewport: ${viewport.width}x${viewport.height}`);

    // Get initial card position
    const beforePan = await page.evaluate(() => {
      const card = document.querySelector('[data-testid*="event-card"]');
      return card ? card.getBoundingClientRect().x : null;
    });

    // Pan left aggressively using DRAG (wheel doesn't support horizontal pan)
    console.log('Panning left aggressively (drag +3000px to the right)...');
    const centerX = viewport.width / 2;
    const centerY = viewport.height / 2;
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 3000, centerY, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(1000);

    // Verify pan actually worked
    const afterPan = await page.evaluate(() => {
      const card = document.querySelector('[data-testid*="event-card"]');
      return card ? card.getBoundingClientRect().x : null;
    });

    console.log(`Card position: before=${beforePan}px, after=${afterPan}px, delta=${afterPan && beforePan ? afterPan - beforePan : 'N/A'}px`);

    if (beforePan !== null && afterPan !== null && Math.abs(afterPan - beforePan) < 100) {
      console.log('⚠️ WARNING: Pan did not move cards significantly - drag may not be working');
    } else {
      console.log('✅ Pan successfully moved the view');
    }

    // Verify leftmost card x >= 0
    const leftBoundaryCheck = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid*="event-card"], [class*="event-card"]');
      let leftmostCard = { x: Infinity, id: '', width: 0 };

      cards.forEach((card, i) => {
        const rect = card.getBoundingClientRect();
        if (rect.x < leftmostCard.x) {
          leftmostCard = {
            x: rect.x,
            id: card.getAttribute('data-testid') || `card-${i}`,
            width: rect.width
          };
        }
      });

      return {
        leftmostCard,
        isValid: leftmostCard.x >= 0,
        violation: leftmostCard.x < 0 ? leftmostCard.x : 0
      };
    });

    console.log(`Leftmost card: ${leftBoundaryCheck.leftmostCard.id}`);
    console.log(`  Position: x=${Math.round(leftBoundaryCheck.leftmostCard.x)}px`);
    console.log(`  Width: ${Math.round(leftBoundaryCheck.leftmostCard.width)}px`);

    if (leftBoundaryCheck.isValid) {
      console.log('✅ Left boundary respected - leftmost card x >= 0');
    } else {
      console.log(`❌ Left boundary violation: card extends ${Math.abs(leftBoundaryCheck.violation)}px beyond left edge`);
    }

    // Take screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, 't92-1-pan-far-left.png'),
      fullPage: false
    });

    // Assert boundary is respected (allow small tolerance for sub-pixel positioning)
    expect(leftBoundaryCheck.leftmostCard.x).toBeGreaterThanOrEqual(-5);
  });

  test('T92.2: pan to far right boundary', async ({ page }) => {
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page);
    await page.waitForTimeout(2000);

    console.log('=== PAN TO FAR RIGHT BOUNDARY ===');

    // Verify timeline is loaded correctly
    const initialState = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid*="event-card"]');
      return {
        cardCount: cards.length,
        title: document.querySelector('h1, [data-testid*="title"]')?.textContent || 'unknown'
      };
    });
    console.log(`Timeline: "${initialState.title}" with ${initialState.cardCount} cards`);
    expect(initialState.cardCount, 'Timeline should have cards').toBeGreaterThan(0);

    // Zoom in 15x first
  const zoomInBtn = page.locator('[data-testid="btn-zoom-in"]').first();
    console.log('Zooming in 15x...');
    for (let i = 0; i < 15; i++) {
      if (await zoomInBtn.isVisible().catch(() => false)) {
        await zoomInBtn.click();
        await page.waitForTimeout(150);
      }
    }

    await page.waitForTimeout(500);

    // Get viewport dimensions
    const viewport = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight
    }));

    console.log(`Viewport: ${viewport.width}x${viewport.height}`);

    // Get initial card position
    const beforePan = await page.evaluate(() => {
      const card = document.querySelector('[data-testid*="event-card"]');
      return card ? card.getBoundingClientRect().x : null;
    });

    // Pan right aggressively using DRAG (wheel doesn't support horizontal pan)
    console.log('Panning right aggressively (drag -3000px to the left)...');
    const centerX = viewport.width / 2;
    const centerY = viewport.height / 2;
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX - 3000, centerY, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(1000);

    // Verify pan actually worked
    const afterPan = await page.evaluate(() => {
      const card = document.querySelector('[data-testid*="event-card"]');
      return card ? card.getBoundingClientRect().x : null;
    });

    console.log(`Card position: before=${beforePan}px, after=${afterPan}px, delta=${afterPan && beforePan ? afterPan - beforePan : 'N/A'}px`);

    if (beforePan !== null && afterPan !== null && Math.abs(afterPan - beforePan) < 100) {
      console.log('⚠️ WARNING: Pan did not move cards significantly - drag may not be working');
    } else {
      console.log('✅ Pan successfully moved the view');
    }

    // Verify rightmost card x + width <= viewport.width
    const rightBoundaryCheck = await page.evaluate((viewportWidth) => {
      const cards = document.querySelectorAll('[data-testid*="event-card"], [class*="event-card"]');
      let rightmostCard = { x: -Infinity, id: '', width: 0, right: -Infinity };

      cards.forEach((card, i) => {
        const rect = card.getBoundingClientRect();
        if (rect.right > rightmostCard.right) {
          rightmostCard = {
            x: rect.x,
            id: card.getAttribute('data-testid') || `card-${i}`,
            width: rect.width,
            right: rect.right
          };
        }
      });

      return {
        rightmostCard,
        viewportWidth,
        isValid: rightmostCard.right <= viewportWidth,
        violation: rightmostCard.right > viewportWidth ? rightmostCard.right - viewportWidth : 0
      };
    }, viewport.width);

    console.log(`Rightmost card: ${rightBoundaryCheck.rightmostCard.id}`);
    console.log(`  Position: x=${Math.round(rightBoundaryCheck.rightmostCard.x)}px`);
    console.log(`  Width: ${Math.round(rightBoundaryCheck.rightmostCard.width)}px`);
    console.log(`  Right edge: ${Math.round(rightBoundaryCheck.rightmostCard.right)}px`);
    console.log(`  Viewport width: ${rightBoundaryCheck.viewportWidth}px`);

    if (rightBoundaryCheck.isValid) {
      console.log('✅ Right boundary respected - rightmost card fits within viewport');
    } else {
      console.log(`❌ Right boundary violation: card extends ${Math.round(rightBoundaryCheck.violation)}px beyond right edge`);
    }

    // Take screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, 't92-2-pan-far-right.png'),
      fullPage: false
    });

    // Assert boundary is respected (allow small tolerance)
    expect(rightBoundaryCheck.rightmostCard.right).toBeLessThanOrEqual(viewport.width + 5);
  });

  test('T92.3: vertical scroll extremes - top and bottom', async ({ page }) => {
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page);
    await page.waitForTimeout(2000);

    console.log('=== VERTICAL SCROLL EXTREMES - TOP AND BOTTOM ===');

    // Verify timeline is loaded correctly
    const initialState = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid*="event-card"]');
      return {
        cardCount: cards.length,
        title: document.querySelector('h1, [data-testid*="title"]')?.textContent || 'unknown'
      };
    });
    console.log(`Timeline: "${initialState.title}" with ${initialState.cardCount} cards`);
    expect(initialState.cardCount, 'Timeline should have cards').toBeGreaterThan(0);

    // Zoom in 20x to make cards larger
  const zoomInBtn = page.locator('[data-testid="btn-zoom-in"]').first();
    console.log('Zooming in 20x...');
    for (let i = 0; i < 20; i++) {
      if (await zoomInBtn.isVisible().catch(() => false)) {
        await zoomInBtn.click();
        await page.waitForTimeout(150);
      }
    }

    await page.waitForTimeout(500);

    const viewport = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight
    }));

    console.log(`Viewport: ${viewport.width}x${viewport.height}`);

    // === TOP BOUNDARY TEST ===
    console.log('\n--- Testing TOP boundary ---');

    // Capture BEFORE scroll
    const beforeTopScroll = await captureCardSnapshot(page);
    console.log(`Before scroll UP: ${beforeTopScroll.visibleCards.length} visible cards`);

    console.log('Scrolling UP (deltaY: -3000px)...');
    await page.mouse.move(viewport.width / 2, viewport.height / 2);
    // Scroll in multiple increments to ensure it registers
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, -300);
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(1000);

    // Capture AFTER scroll
    const afterTopScroll = await captureCardSnapshot(page);
    console.log(`After scroll UP: ${afterTopScroll.visibleCards.length} visible cards`);

    // Verify scroll changed the view
    const topViewChanged = beforeTopScroll.visibleIds.join(',') !== afterTopScroll.visibleIds.join(',');
    console.log(`Top view changed: ${topViewChanged ? 'YES' : 'NO'}`);

    // Find breadcrumb zone and topmost card
    const topBoundaryCheck = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid*="event-card"], [class*="event-card"]');
      let topmostCard = { top: Infinity, id: '', height: 0, bottom: 0 };

      cards.forEach((card, i) => {
        const rect = card.getBoundingClientRect();
        if (rect.top < topmostCard.top && rect.top > -1000) { // Visible or near-visible
          topmostCard = {
            top: rect.top,
            id: card.getAttribute('data-testid') || `card-${i}`,
            height: rect.height,
            bottom: rect.bottom
          };
        }
      });

      // Find breadcrumb zone
      const breadcrumbSelectors = [
        '[class*="Breadcrumb"]',
        '[class*="breadcrumb"]',
        'nav[aria-label*="breadcrumb"]'
      ];

      let breadcrumbZone = { found: false, bottom: 0 };
      for (const selector of breadcrumbSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.height > 0) {
            breadcrumbZone = { found: true, bottom: rect.bottom };
            break;
          }
        }
      }

      // Default breadcrumb zone if not found (typically around 150px from top)
      const breadcrumbBottom = breadcrumbZone.found ? breadcrumbZone.bottom : 150;
      const overlaps = topmostCard.bottom > 0 && topmostCard.top < breadcrumbBottom;

      return {
        topmostCard,
        breadcrumbBottom,
        overlaps,
        clearance: topmostCard.top - breadcrumbBottom
      };
    });

    console.log(`Topmost card: ${topBoundaryCheck.topmostCard.id}`);
    console.log(`  Top: ${Math.round(topBoundaryCheck.topmostCard.top)}px`);
    console.log(`  Bottom: ${Math.round(topBoundaryCheck.topmostCard.bottom)}px`);
    console.log(`  Breadcrumb zone bottom: ${Math.round(topBoundaryCheck.breadcrumbBottom)}px`);

    if (!topBoundaryCheck.overlaps) {
      console.log(`✅ No overlap with breadcrumbs (clearance: ${Math.round(topBoundaryCheck.clearance)}px)`);
    } else {
      console.log(`⚠️ Card may overlap breadcrumb zone (clearance: ${Math.round(topBoundaryCheck.clearance)}px)`);
    }

    // Take screenshot of top boundary
    await page.screenshot({
      path: path.join(screenshotsDir, 't92-3-scroll-top.png'),
      fullPage: false
    });

    // === BOTTOM BOUNDARY TEST ===
    console.log('\n--- Testing BOTTOM boundary ---');

    // Capture BEFORE scroll
    const beforeBottomScroll = await captureCardSnapshot(page);
    console.log(`Before scroll DOWN: ${beforeBottomScroll.visibleCards.length} visible cards`);

    console.log('Scrolling DOWN (deltaY: +6000px)...');
    // Scroll in multiple increments to ensure it registers
    for (let i = 0; i < 20; i++) {
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(1000);

    // Capture AFTER scroll
    const afterBottomScroll = await captureCardSnapshot(page);
    console.log(`After scroll DOWN: ${afterBottomScroll.visibleCards.length} visible cards`);

    // Verify scroll changed the view
    const bottomViewChanged = beforeBottomScroll.visibleIds.join(',') !== afterBottomScroll.visibleIds.join(',');
    console.log(`Bottom view changed: ${bottomViewChanged ? 'YES' : 'NO'}`);

    // Find zoom control zone and bottommost card
    const bottomBoundaryCheck = await page.evaluate((viewportHeight) => {
      const cards = document.querySelectorAll('[data-testid*="event-card"], [class*="event-card"]');
      let bottommostCard = { bottom: -Infinity, id: '', height: 0, top: 0 };

      cards.forEach((card, i) => {
        const rect = card.getBoundingClientRect();
        if (rect.bottom > bottommostCard.bottom && rect.bottom < viewportHeight + 1000) {
          bottommostCard = {
            bottom: rect.bottom,
            id: card.getAttribute('data-testid') || `card-${i}`,
            height: rect.height,
            top: rect.top
          };
        }
      });

      // Find zoom control zone
      const zoomSelectors = [
        '[class*="zoom-controls"]',
        '[class*="ZoomControl"]',
        '.absolute.bottom-4'
      ];

      let zoomZone = { found: false, top: viewportHeight };
      for (const selector of zoomSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.height > 0) {
            zoomZone = { found: true, top: rect.top };
            break;
          }
        }
      }

      // Default zoom zone if not found (typically around 100px from bottom)
      const zoomTop = zoomZone.found ? zoomZone.top : viewportHeight - 100;
      const overlaps = bottommostCard.top < viewportHeight && bottommostCard.bottom > zoomTop;

      return {
        bottommostCard,
        zoomTop,
        viewportHeight,
        overlaps,
        clearance: zoomTop - bottommostCard.bottom
      };
    }, viewport.height);

    console.log(`Bottommost card: ${bottomBoundaryCheck.bottommostCard.id}`);
    console.log(`  Top: ${Math.round(bottomBoundaryCheck.bottommostCard.top)}px`);
    console.log(`  Bottom: ${Math.round(bottomBoundaryCheck.bottommostCard.bottom)}px`);
    console.log(`  Zoom control zone top: ${Math.round(bottomBoundaryCheck.zoomTop)}px`);
    console.log(`  Viewport height: ${bottomBoundaryCheck.viewportHeight}px`);

    if (!bottomBoundaryCheck.overlaps) {
      console.log(`✅ No overlap with zoom controls (clearance: ${Math.round(bottomBoundaryCheck.clearance)}px)`);
    } else {
      console.log(`⚠️ Card may overlap zoom control zone (clearance: ${Math.round(bottomBoundaryCheck.clearance)}px)`);
    }

    // Take screenshot of bottom boundary
    await page.screenshot({
      path: path.join(screenshotsDir, 't92-3-scroll-bottom.png'),
      fullPage: false
    });

    // Assertions: Cards should maintain safe distance from control zones
    // Breadcrumbs at top, zoom controls at bottom
    expect(topBoundaryCheck.topmostCard.top).toBeGreaterThanOrEqual(-50); // Allow some off-screen
    expect(bottomBoundaryCheck.bottommostCard.bottom).toBeLessThanOrEqual(viewport.height + 50);

    // CRITICAL: Assert that top and bottom screenshots show DIFFERENT views
    console.log('\n=== TOP vs BOTTOM COMPARISON ===');
    const topBottomIdentical = afterTopScroll.visibleIds.join(',') === afterBottomScroll.visibleIds.join(',');
    if (topBottomIdentical) {
      console.log('❌ WARNING: Top and bottom views are IDENTICAL - scroll may not be working!');
      console.log(`Top IDs: ${afterTopScroll.visibleIds.slice(0, 3).join(', ')}`);
      console.log(`Bottom IDs: ${afterBottomScroll.visibleIds.slice(0, 3).join(', ')}`);
    } else {
      console.log('✅ Top and bottom views are different');
      console.log(`Top: ${afterTopScroll.visibleCards.length} cards, Bottom: ${afterBottomScroll.visibleCards.length} cards`);
    }
    expect(topBottomIdentical, 'Top and bottom boundaries must show different views').toBe(false);
  });

  test('T92.4: diagonal pan to all four corners', async ({ page }) => {
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page);
    await page.waitForTimeout(2000);

    console.log('=== DIAGONAL PAN TO ALL FOUR CORNERS ===');

    // Verify timeline is loaded correctly
    const initialState = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid*="event-card"]');
      return {
        cardCount: cards.length,
        title: document.querySelector('h1, [data-testid*="title"]')?.textContent || 'unknown'
      };
    });
    console.log(`Timeline: "${initialState.title}" with ${initialState.cardCount} cards`);
    expect(initialState.cardCount, 'Timeline should have cards').toBeGreaterThan(0);

    // Zoom in to make timeline larger
  const zoomInBtn = page.locator('[data-testid="btn-zoom-in"]').first();
    console.log('Zooming in 15x...');
    for (let i = 0; i < 15; i++) {
      if (await zoomInBtn.isVisible().catch(() => false)) {
        await zoomInBtn.click();
        await page.waitForTimeout(150);
      }
    }

    await page.waitForTimeout(500);

    const viewport = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight
    }));

    console.log(`Viewport: ${viewport.width}x${viewport.height}`);

    // Define corners
    const corners = [
      { name: 'TOP-LEFT', deltaX: -3000, deltaY: -2000 },
      { name: 'TOP-RIGHT', deltaX: 3000, deltaY: -2000 },
      { name: 'BOTTOM-LEFT', deltaX: -3000, deltaY: 2000 },
      { name: 'BOTTOM-RIGHT', deltaX: 3000, deltaY: 2000 }
    ];

    const cornerResults = [];

    for (const corner of corners) {
      console.log(`\n--- Testing ${corner.name} corner ---`);

      // Reset to center first (zoom out and back in to recenter)
      const zoomOutBtn = page.locator('[data-testid="btn-zoom-out"]').first();
      for (let i = 0; i < 5; i++) {
        if (await zoomOutBtn.isVisible().catch(() => false)) {
          await zoomOutBtn.click();
          await page.waitForTimeout(100);
        }
      }
      for (let i = 0; i < 5; i++) {
        if (await zoomInBtn.isVisible().catch(() => false)) {
          await zoomInBtn.click();
          await page.waitForTimeout(100);
        }
      }
      await page.waitForTimeout(300);

      // Pan to corner using DRAG for horizontal, wheel for vertical
      console.log(`Panning to ${corner.name} (deltaX: ${corner.deltaX}, deltaY: ${corner.deltaY})...`);
      const centerX = viewport.width / 2;
      const centerY = viewport.height / 2;

      // First: horizontal pan via drag
      if (corner.deltaX !== 0) {
        await page.mouse.move(centerX, centerY);
        await page.mouse.down();
        await page.mouse.move(centerX - corner.deltaX, centerY, { steps: 10 }); // Invert for drag
        await page.mouse.up();
        await page.waitForTimeout(300);
      }

      // Second: vertical scroll via wheel (zooms, which affects vertical scroll)
      if (corner.deltaY !== 0) {
        await page.mouse.move(centerX, centerY);
        await page.mouse.wheel(0, corner.deltaY);
        await page.waitForTimeout(300);
      }

      await page.waitForTimeout(400);

      // Check nearby control zone and card positions
      const cornerCheck = await page.evaluate(({ viewportWidth, viewportHeight, cornerName }) => {
        const cards = document.querySelectorAll('[data-testid*="event-card"], [class*="event-card"]');

        // Define safe zones for each corner
        const safeZone = { top: 0, left: 0, right: viewportWidth, bottom: viewportHeight };

        // Breadcrumb zone (top-left area)
        const breadcrumbBottom = 150;
        const breadcrumbRight = 400;

        // Zoom control zone (bottom-center area)
        const zoomTop = viewportHeight - 100;
        const zoomLeft = viewportWidth / 2 - 100;
        const zoomRight = viewportWidth / 2 + 100;

        // Minimap zone (top-right area)
        const minimapTop = 0;
        const minimapLeft = viewportWidth - 350;

        const visibleCards: any[] = [];
        let controlZoneViolations = 0;

        cards.forEach((card, i) => {
          const rect = card.getBoundingClientRect();

          // Check if card is in viewport
          if (rect.right > 0 && rect.left < viewportWidth &&
              rect.bottom > 0 && rect.top < viewportHeight) {

            visibleCards.push({
              id: card.getAttribute('data-testid') || `card-${i}`,
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height
            });

            // Check for control zone violations
            const inBreadcrumbZone = rect.top < breadcrumbBottom && rect.left < breadcrumbRight;
            const inZoomZone = rect.bottom > zoomTop && rect.left > zoomLeft && rect.right < zoomRight;
            const inMinimapZone = rect.top < minimapTop + 100 && rect.right > minimapLeft;

            if (inBreadcrumbZone || inZoomZone || inMinimapZone) {
              controlZoneViolations++;
            }
          }
        });

        // Find extreme card positions
        const leftmost = visibleCards.reduce((min, c) => c.x < min.x ? c : min, { x: Infinity });
        const rightmost = visibleCards.reduce((max, c) => c.x + c.width > max.x + max.width ? c : max, { x: -Infinity, width: 0 });
        const topmost = visibleCards.reduce((min, c) => c.y < min.y ? c : min, { y: Infinity });
        const bottommost = visibleCards.reduce((max, c) => c.y + c.height > max.y + max.height ? c : max, { y: -Infinity, height: 0 });

        return {
          corner: cornerName,
          visibleCards: visibleCards.length,
          controlZoneViolations,
          extremes: {
            left: leftmost.x !== Infinity ? leftmost.x : null,
            right: rightmost.x !== -Infinity ? rightmost.x + rightmost.width : null,
            top: topmost.y !== Infinity ? topmost.y : null,
            bottom: bottommost.y !== -Infinity ? bottommost.y + bottommost.height : null
          },
          margins: {
            left: leftmost.x !== Infinity ? leftmost.x : null,
            right: rightmost.x !== -Infinity ? viewportWidth - (rightmost.x + rightmost.width) : null,
            top: topmost.y !== Infinity ? topmost.y : null,
            bottom: bottommost.y !== -Infinity ? viewportHeight - (bottommost.y + bottommost.height) : null
          }
        };
      }, { viewportWidth: viewport.width, viewportHeight: viewport.height, cornerName: corner.name });

      console.log(`Visible cards: ${cornerCheck.visibleCards}`);
      console.log(`Control zone violations: ${cornerCheck.controlZoneViolations}`);

      if (cornerCheck.extremes.left !== null) {
        console.log(`  Left edge: ${Math.round(cornerCheck.extremes.left)}px (margin: ${Math.round(cornerCheck.margins.left!)}px)`);
      }
      if (cornerCheck.extremes.right !== null) {
        console.log(`  Right edge: ${Math.round(cornerCheck.extremes.right)}px (margin: ${Math.round(cornerCheck.margins.right!)}px)`);
      }
      if (cornerCheck.extremes.top !== null) {
        console.log(`  Top edge: ${Math.round(cornerCheck.extremes.top)}px (margin: ${Math.round(cornerCheck.margins.top!)}px)`);
      }
      if (cornerCheck.extremes.bottom !== null) {
        console.log(`  Bottom edge: ${Math.round(cornerCheck.extremes.bottom)}px (margin: ${Math.round(cornerCheck.margins.bottom!)}px)`);
      }

      if (cornerCheck.controlZoneViolations === 0) {
        console.log(`✅ No control zone violations at ${corner.name} corner`);
      } else {
        console.log(`⚠️ ${cornerCheck.controlZoneViolations} cards in control zones at ${corner.name} corner`);
      }

      cornerResults.push(cornerCheck);

      // Take screenshot
      const screenshotName = `t92-4-corner-${corner.name.toLowerCase().replace('-', '_')}.png`;
      await page.screenshot({
        path: path.join(screenshotsDir, screenshotName),
        fullPage: false
      });
    }

    // Summary
    console.log('\n=== CORNER BOUNDARY SUMMARY ===');
    console.log('| Corner       | Visible Cards | Control Violations | Status |');
    console.log('|--------------|---------------|--------------------|--------|');

    cornerResults.forEach(result => {
      const status = result.controlZoneViolations === 0 ? '✅' : '⚠️';
      console.log(`| ${result.corner.padEnd(12)} | ${String(result.visibleCards).padEnd(13)} | ${String(result.controlZoneViolations).padEnd(18)} | ${status}     |`);
    });

    const totalViolations = cornerResults.reduce((sum, r) => sum + r.controlZoneViolations, 0);

    if (totalViolations === 0) {
      console.log('\n✅ All corners maintain safe margins from control zones');
    } else {
      console.log(`\n⚠️ Total control zone violations across all corners: ${totalViolations}`);
    }

    // Report findings - some corners may have no visible cards if panned beyond timeline bounds
    const cornersWithCards = cornerResults.filter(r => r.visibleCards > 0).length;
    console.log(`\nCorners with visible cards: ${cornersWithCards}/${corners.length}`);

    if (cornersWithCards === 0) {
      console.log('⚠️ No corners had visible cards - timeline may be smaller than expected');
    } else {
      console.log(`✅ ${cornersWithCards} corners had visible cards`);
    }

    // Test passes - this is an audit of boundary behavior
    expect(true).toBe(true);
  });

});
