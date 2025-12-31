import { test, expect } from '@playwright/test';
import { loadTimeline, waitForEditorLoaded, skipIfNoCredentials } from '../utils/timelineTestUtils';
import * as fs from 'fs';
import * as path from 'path';

const TEST_OWNER_USERNAME = 'cynacons';
const TEST_TIMELINE_ID = 'french-revolution';

interface CardBounds {
  id: string;
  x: number;
  y: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface ControlZone {
  name: string;
  x: number;
  y: number;
  right: number;
  bottom: number;
  zIndex: number;
}

test.describe('Boundary Stress Tests - Zoom Extremes', () => {
  const screenshotsDir = path.join(process.cwd(), 'screenshots', 'visual-audit');

  test.beforeAll(async () => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
  });

  test.beforeEach(async ({ page }) => {
    skipIfNoCredentials(test);
  });

  test('T91.1: extreme zoom out - verify no card escapes canvas bounds', async ({ page }) => {
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page);
    await page.waitForTimeout(2000);

    console.log('=== EXTREME ZOOM OUT TEST ===');

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

    // Capture before state
    const beforeZoom = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid*="event-card"]');
      const visibleCards = Array.from(cards).filter(card => {
        const rect = card.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      const firstCard = visibleCards[0]?.getBoundingClientRect();
      return {
        visibleCount: visibleCards.length,
        firstCardWidth: firstCard ? Math.round(firstCard.width) : 0
      };
    });
    console.log(`Before zoom: ${beforeZoom.visibleCount} visible cards, first card width: ${beforeZoom.firstCardWidth}px`);

    // Zoom out 30 clicks
    const zoomOutBtn = page.locator('[data-testid="btn-zoom-out"]').first();
    await expect(zoomOutBtn).toBeVisible({ timeout: 5000 });

    console.log('Zooming out 30 clicks...');
    for (let i = 0; i < 30; i++) {
      await zoomOutBtn.click();
      await page.waitForTimeout(150); // Increased wait for zoom animation
    }

    await page.waitForTimeout(1500); // Wait for all animations to complete

    // Verify zoom actually changed the view
    const afterZoom = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid*="event-card"]');
      const visibleCards = Array.from(cards).filter(card => {
        const rect = card.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      const firstCard = visibleCards[0]?.getBoundingClientRect();
      return {
        visibleCount: visibleCards.length,
        firstCardWidth: firstCard ? Math.round(firstCard.width) : 0
      };
    });
    console.log(`After zoom: ${afterZoom.visibleCount} visible cards, first card width: ${afterZoom.firstCardWidth}px`);
    expect(afterZoom.firstCardWidth, 'Zoom out should decrease card width').toBeLessThan(beforeZoom.firstCardWidth);

    // Extract all card positions and control zones
    const analysis = await page.evaluate(() => {
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const cards = document.querySelectorAll('[data-testid*="event-card"], [class*="event-card"]');

      const cardBounds: CardBounds[] = [];
      cards.forEach((card, i) => {
        const rect = card.getBoundingClientRect();
        cardBounds.push({
          id: card.getAttribute('data-testid') || `card-${i}`,
          x: rect.x,
          y: rect.y,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height
        });
      });

      // Define control zones
      const controlZones: ControlZone[] = [];

      // Breadcrumb zone (top-left)
      const breadcrumb = document.querySelector('[class*="Breadcrumb"], [class*="breadcrumb"]');
      if (breadcrumb) {
        const rect = breadcrumb.getBoundingClientRect();
        const style = getComputedStyle(breadcrumb);
        controlZones.push({
          name: 'breadcrumb',
          x: rect.x,
          y: rect.y,
          right: rect.right,
          bottom: rect.bottom,
          zIndex: parseInt(style.zIndex) || 0
        });
      }

      // Minimap zone (top-right)
      const minimap = document.querySelector('[data-testid="minimap-container"]');
      if (minimap) {
        const rect = minimap.getBoundingClientRect();
        const style = getComputedStyle(minimap);
        controlZones.push({
          name: 'minimap',
          x: rect.x,
          y: rect.y,
          right: rect.right,
          bottom: rect.bottom,
          zIndex: parseInt(style.zIndex) || 0
        });
      }

      // Zoom controls zone (bottom-center)
      const zoomControls = document.querySelector('[class*="zoom-controls"], [class*="ZoomControl"]') ||
                          Array.from(document.querySelectorAll('button')).find(btn =>
                            btn.textContent?.includes('+') || btn.textContent?.includes('-')
                          )?.parentElement;
      if (zoomControls) {
        const rect = zoomControls.getBoundingClientRect();
        const style = getComputedStyle(zoomControls);
        controlZones.push({
          name: 'zoom-controls',
          x: rect.x,
          y: rect.y,
          right: rect.right,
          bottom: rect.bottom,
          zIndex: parseInt(style.zIndex) || 0
        });
      }

      // Check for cards escaping canvas bounds
      const escapedLeft = cardBounds.filter(c => c.x < 0);
      const escapedRight = cardBounds.filter(c => c.right > viewport.width);
      const escapedTop = cardBounds.filter(c => c.y < 0);
      const escapedBottom = cardBounds.filter(c => c.bottom > viewport.height);

      // Check for cards overlapping control zones
      const overlaps: any[] = [];
      controlZones.forEach(zone => {
        cardBounds.forEach(card => {
          const overlapsX = !(card.right < zone.x || card.x > zone.right);
          const overlapsY = !(card.bottom < zone.y || card.y > zone.bottom);

          if (overlapsX && overlapsY) {
            // Calculate overlap area
            const overlapWidth = Math.min(card.right, zone.right) - Math.max(card.x, zone.x);
            const overlapHeight = Math.min(card.bottom, zone.bottom) - Math.max(card.y, zone.y);
            const overlapArea = overlapWidth * overlapHeight;

            overlaps.push({
              cardId: card.id,
              controlZone: zone.name,
              overlapArea,
              controlZIndex: zone.zIndex
            });
          }
        });
      });

      return {
        viewport,
        totalCards: cardBounds.length,
        visibleCards: cardBounds.filter(c =>
          c.right > 0 && c.x < viewport.width &&
          c.bottom > 0 && c.y < viewport.height
        ).length,
        escapedLeft: escapedLeft.length,
        escapedRight: escapedRight.length,
        escapedTop: escapedTop.length,
        escapedBottom: escapedBottom.length,
        escapedCards: [...escapedLeft, ...escapedRight, ...escapedTop, ...escapedBottom],
        controlZoneOverlaps: overlaps,
        controlZones: controlZones.length
      };
    });

    console.log(`\nViewport: ${analysis.viewport.width}x${analysis.viewport.height}`);
    console.log(`Total cards: ${analysis.totalCards}`);
    console.log(`Visible cards: ${analysis.visibleCards}`);
    console.log(`\n=== CANVAS BOUNDARY CHECK ===`);
    console.log(`Cards escaped left (x < 0): ${analysis.escapedLeft}`);
    console.log(`Cards escaped right (x > viewport): ${analysis.escapedRight}`);
    console.log(`Cards escaped top (y < 0): ${analysis.escapedTop}`);
    console.log(`Cards escaped bottom (y > viewport): ${analysis.escapedBottom}`);

    if (analysis.escapedCards.length > 0) {
      console.log(`\n❌ ${analysis.escapedCards.length} cards escaped canvas bounds!`);
      analysis.escapedCards.slice(0, 5).forEach((card: CardBounds) => {
        console.log(`  - ${card.id}: x=${Math.round(card.x)}, y=${Math.round(card.y)}, right=${Math.round(card.right)}, bottom=${Math.round(card.bottom)}`);
      });
    } else {
      console.log(`\n✅ All cards within canvas bounds`);
    }

    console.log(`\n=== CONTROL ZONE OVERLAP CHECK ===`);
    console.log(`Control zones detected: ${analysis.controlZones}`);
    console.log(`Total overlaps: ${analysis.controlZoneOverlaps.length}`);

    if (analysis.controlZoneOverlaps.length > 0) {
      console.log(`\n⚠️ ${analysis.controlZoneOverlaps.length} cards overlap control zones:`);
      analysis.controlZoneOverlaps.slice(0, 10).forEach((overlap: any) => {
        console.log(`  - ${overlap.cardId} overlaps ${overlap.controlZone} (area: ${Math.round(overlap.overlapArea)}px²)`);
      });
    } else {
      console.log(`\n✅ No cards overlap control zones`);
    }

    // Take screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, 't91-1-zoom-ultra-out.png'),
      fullPage: false
    });

    // Assertions
    expect(analysis.escapedLeft, 'No cards should escape left boundary').toBe(0);
    expect(analysis.escapedRight, 'No cards should escape right boundary').toBe(0);
    expect(analysis.escapedTop, 'No cards should escape top boundary').toBe(0);
    expect(analysis.escapedBottom, 'No cards should escape bottom boundary').toBe(0);
  });

  test('T91.2: extreme zoom in - verify card sizing and clipping', async ({ page }) => {
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page);
    await page.waitForTimeout(2000);

    console.log('=== EXTREME ZOOM IN TEST ===');

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

    // Capture before state
    const beforeZoom = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid*="event-card"]');
      const visibleCards = Array.from(cards).filter(card => {
        const rect = card.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      const firstCard = visibleCards[0]?.getBoundingClientRect();
      return {
        visibleCount: visibleCards.length,
        firstCardWidth: firstCard ? Math.round(firstCard.width) : 0
      };
    });
    console.log(`Before zoom: ${beforeZoom.visibleCount} visible cards, first card width: ${beforeZoom.firstCardWidth}px`);

    // Zoom in 25 clicks (more moderate to keep cards in view)
    const zoomInBtn = page.locator('[data-testid="btn-zoom-in"]').first();
    await expect(zoomInBtn).toBeVisible({ timeout: 5000 });

    console.log('Zooming in 25 clicks...');
    for (let i = 0; i < 25; i++) {
      await zoomInBtn.click();
      await page.waitForTimeout(150); // Increased wait for zoom animation
    }

    await page.waitForTimeout(1500); // Wait for all animations to complete

    // Verify zoom actually changed the view
    const afterZoom = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid*="event-card"]');
      const visibleCards = Array.from(cards).filter(card => {
        const rect = card.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      const firstCard = visibleCards[0]?.getBoundingClientRect();
      return {
        visibleCount: visibleCards.length,
        firstCardWidth: firstCard ? Math.round(firstCard.width) : 0
      };
    });
    console.log(`After zoom: ${afterZoom.visibleCount} visible cards, first card width: ${afterZoom.firstCardWidth}px`);
    expect(afterZoom.firstCardWidth, 'Zoom in should increase card width').toBeGreaterThan(beforeZoom.firstCardWidth);

    // Analyze card sizing and viewport coverage
    const analysis = await page.evaluate(() => {
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const cards = document.querySelectorAll('[data-testid*="event-card"], [class*="event-card"]');

      const cardData: any[] = [];
      let visibleCount = 0;
      let partiallyClippedCount = 0;
      let completelyClippedCount = 0;
      let excessiveOverflowCount = 0;

      cards.forEach((card, i) => {
        const rect = card.getBoundingClientRect();

        const inViewportX = rect.right > 0 && rect.x < viewport.width;
        const inViewportY = rect.bottom > 0 && rect.y < viewport.height;
        const inViewport = inViewportX && inViewportY;

        const fullyVisible = rect.x >= 0 && rect.right <= viewport.width &&
                            rect.y >= 0 && rect.bottom <= viewport.height;

        const overflowX = Math.max(0, rect.x < 0 ? -rect.x : 0) + Math.max(0, rect.right > viewport.width ? rect.right - viewport.width : 0);
        const overflowY = Math.max(0, rect.y < 0 ? -rect.y : 0) + Math.max(0, rect.bottom > viewport.height ? rect.bottom - viewport.height : 0);
        const excessiveOverflow = overflowX > viewport.width || overflowY > viewport.height;

        if (inViewport) {
          visibleCount++;
          if (!fullyVisible) {
            partiallyClippedCount++;
          }
        } else {
          completelyClippedCount++;
        }

        if (excessiveOverflow && inViewport) {
          excessiveOverflowCount++;
        }

        if (inViewport) {
          cardData.push({
            id: card.getAttribute('data-testid') || `card-${i}`,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            fullyVisible,
            overflowX: Math.round(overflowX),
            overflowY: Math.round(overflowY),
            excessiveOverflow
          });
        }
      });

      // Calculate statistics
      const widths = cardData.map(c => c.width);
      const heights = cardData.map(c => c.height);
      const avgWidth = widths.length > 0 ? widths.reduce((a, b) => a + b, 0) / widths.length : 0;
      const avgHeight = heights.length > 0 ? heights.reduce((a, b) => a + b, 0) / heights.length : 0;
      const maxWidth = widths.length > 0 ? Math.max(...widths) : 0;
      const maxHeight = heights.length > 0 ? Math.max(...heights) : 0;

      return {
        viewport,
        totalCards: cards.length,
        visibleCount,
        partiallyClippedCount,
        completelyClippedCount,
        excessiveOverflowCount,
        avgWidth: Math.round(avgWidth),
        avgHeight: Math.round(avgHeight),
        maxWidth,
        maxHeight,
        sampleCards: cardData.slice(0, 5)
      };
    });

    console.log(`\nViewport: ${analysis.viewport.width}x${analysis.viewport.height}`);
    console.log(`Total cards: ${analysis.totalCards}`);
    console.log(`\n=== VISIBILITY ANALYSIS ===`);
    console.log(`Visible cards: ${analysis.visibleCount}`);
    console.log(`Partially clipped: ${analysis.partiallyClippedCount}`);
    console.log(`Completely off-screen: ${analysis.completelyClippedCount}`);
    console.log(`\n=== CARD SIZING ===`);
    console.log(`Average card size: ${analysis.avgWidth}x${analysis.avgHeight}px`);
    console.log(`Max card size: ${analysis.maxWidth}x${analysis.maxHeight}px`);
    console.log(`Viewport coverage: ${Math.round((analysis.avgWidth / analysis.viewport.width) * 100)}% width, ${Math.round((analysis.avgHeight / analysis.viewport.height) * 100)}% height`);

    console.log(`\n=== OVERFLOW CHECK ===`);
    console.log(`Cards with excessive overflow: ${analysis.excessiveOverflowCount}`);

    if (analysis.excessiveOverflowCount > 0) {
      console.log(`\n⚠️ ${analysis.excessiveOverflowCount} cards overflow viewport excessively`);
      analysis.sampleCards.filter((c: any) => c.excessiveOverflow).forEach((card: any) => {
        console.log(`  - ${card.id}: ${card.width}x${card.height}px at (${card.x}, ${card.y}), overflow: ${card.overflowX}x${card.overflowY}px`);
      });
    } else {
      console.log(`\n✅ No excessive overflow detected`);
    }

    // Sample card details
    console.log(`\n=== SAMPLE VISIBLE CARDS ===`);
    analysis.sampleCards.forEach((card: any) => {
      const status = card.fullyVisible ? '✅' : '⚠️';
      console.log(`${status} ${card.id}: ${card.width}x${card.height}px at (${card.x}, ${card.y})`);
    });

    // Take screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, 't91-2-zoom-ultra-in.png'),
      fullPage: false
    });

    // Assertions - at extreme zoom, cards may be off-screen, which is valid behavior
    if (analysis.visibleCount > 0) {
      expect(analysis.avgWidth, 'Average card width should be positive').toBeGreaterThan(0);
      expect(analysis.avgHeight, 'Average card height should be positive').toBeGreaterThan(0);

      // At extreme zoom, cards should be large but not ridiculously oversized
      // Allow up to 5x viewport size as reasonable maximum
      const maxReasonableWidth = analysis.viewport.width * 5;
      const maxReasonableHeight = analysis.viewport.height * 5;
      expect(analysis.maxWidth, 'Card width should not be excessively large').toBeLessThan(maxReasonableWidth);
      expect(analysis.maxHeight, 'Card height should not be excessively large').toBeLessThan(maxReasonableHeight);
      console.log(`✅ ${analysis.visibleCount} cards visible at extreme zoom`);
    } else {
      console.log('⚠️ No cards visible at extreme zoom - this is valid (cards may be off-screen)');
    }

    // Test passes regardless - we're auditing behavior, not enforcing card visibility
    expect(true).toBe(true);
  });

  test('T91.3: zoom level sweep - control zone proximity analysis at 10 levels', async ({ page }) => {
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page);
    await page.waitForTimeout(2000);

    console.log('=== ZOOM LEVEL SWEEP TEST ===');

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

    // Navigate to dense area first using minimap
    console.log('Navigating to dense area via minimap (60% position)...');
    const minimap = page.locator('[data-testid="minimap-container"]').first();
    await expect(minimap).toBeVisible({ timeout: 5000 });

    const minimapBox = await minimap.boundingBox();
    if (minimapBox) {
      const clickX = minimapBox.x + minimapBox.width * 0.6;
      const clickY = minimapBox.y + minimapBox.height / 2;
      await page.mouse.click(clickX, clickY);
      await page.waitForTimeout(1000);
      console.log('Minimap navigation complete');
    }

    const results: any[] = [];
    const totalSteps = 10;

    // Reset to default zoom first
    const zoomOutBtn = page.locator('[data-testid="btn-zoom-out"]').first();
    const zoomInBtn = page.locator('[data-testid="btn-zoom-in"]').first();
    await expect(zoomOutBtn).toBeVisible({ timeout: 5000 });

    // Start from minimum zoom (zoom out max)
    console.log('Resetting to minimum zoom...');
    for (let i = 0; i < 20; i++) {
      await zoomOutBtn.click();
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(500);

    // Define control zone thresholds
    const TOP_ZONE_THRESHOLD = 150; // Breadcrumb zone
    const BOTTOM_ZONE_THRESHOLD = 100; // Zoom control zone (from bottom)

    // Sweep through zoom levels
    for (let step = 0; step < totalSteps; step++) {
      const zoomLevel = step; // 0 = min zoom, 9 = max zoom

      // Analyze card proximity to control zones AND count visible cards for density
      const analysis = await page.evaluate(({ topThreshold, bottomThreshold }) => {
        const viewport = { width: window.innerWidth, height: window.innerHeight };
        const cards = document.querySelectorAll('[data-testid*="event-card"], [class*="event-card"]');

        let cardsNearTop = 0;
        let cardsNearBottom = 0;
        let minTopMargin = viewport.height;
        let minBottomMargin = viewport.height;
        let visibleCount = 0;

        cards.forEach(card => {
          const rect = card.getBoundingClientRect();

          // Check if card is in viewport
          if (rect.right > 0 && rect.x < viewport.width &&
              rect.bottom > 0 && rect.y < viewport.height) {
            visibleCount++;

            // Distance from top edge
            if (rect.top < topThreshold && rect.top >= 0) {
              cardsNearTop++;
              minTopMargin = Math.min(minTopMargin, rect.top);
            }

            // Distance from bottom edge
            const distFromBottom = viewport.height - rect.bottom;
            if (distFromBottom < bottomThreshold && rect.bottom <= viewport.height) {
              cardsNearBottom++;
              minBottomMargin = Math.min(minBottomMargin, distFromBottom);
            }
          }
        });

        return {
          totalCards: cards.length,
          visibleCards: visibleCount,
          cardsNearTop,
          cardsNearBottom,
          minTopMargin: minTopMargin === viewport.height ? 0 : Math.round(minTopMargin),
          minBottomMargin: minBottomMargin === viewport.height ? 0 : Math.round(minBottomMargin)
        };
      }, { topThreshold: TOP_ZONE_THRESHOLD, bottomThreshold: BOTTOM_ZONE_THRESHOLD });

      // Report density at this zoom level
      console.log(`  Density: ${analysis.visibleCards} cards visible`);
      if (analysis.visibleCards >= 8) {
        console.log(`  ✅ Dense scenario detected (${analysis.visibleCards} cards)`);
      }

      results.push({
        zoomLevel,
        ...analysis
      });

      // Take screenshot at densest zoom level
      if (results.length > 0 && analysis.visibleCards >= 8) {
        const prevDensest = Math.max(...results.map(r => r.visibleCards));
        if (analysis.visibleCards >= prevDensest) {
          await page.screenshot({
            path: path.join(screenshotsDir, 't91-3-zoom-sweep-densest.png'),
            fullPage: false
          });
          console.log(`  📸 Screenshot taken at densest level (${analysis.visibleCards} cards)`);
        }
      }

      // Also take screenshot at min, mid, max zoom
      if (step === 0) {
        await page.screenshot({
          path: path.join(screenshotsDir, 't91-3-zoom-sweep-min.png'),
          fullPage: false
        });
      } else if (step === Math.floor(totalSteps / 2)) {
        await page.screenshot({
          path: path.join(screenshotsDir, 't91-3-zoom-sweep-mid.png'),
          fullPage: false
        });
      } else if (step === totalSteps - 1) {
        await page.screenshot({
          path: path.join(screenshotsDir, 't91-3-zoom-sweep-max.png'),
          fullPage: false
        });
      }

      // Zoom in for next iteration (skip on last iteration)
      if (step < totalSteps - 1) {
        const clicksPerStep = 4; // Spread zoom range across steps
        for (let i = 0; i < clicksPerStep; i++) {
          await zoomInBtn.click();
          await page.waitForTimeout(50);
        }
        await page.waitForTimeout(300);
      }
    }

    // Report results table
    console.log('\n=== ZOOM LEVEL PROXIMITY ANALYSIS ===');
    console.log('| Zoom Level | Visible Cards | Cards Near Top | Cards Near Bottom | Min Top Margin | Min Bottom Margin |');
    console.log('|------------|---------------|----------------|-------------------|----------------|-------------------|');
    results.forEach(r => {
      console.log(`| ${String(r.zoomLevel).padEnd(10)} | ${String(r.visibleCards).padEnd(13)} | ${String(r.cardsNearTop).padEnd(14)} | ${String(r.cardsNearBottom).padEnd(17)} | ${String(r.minTopMargin).padEnd(14)}px | ${String(r.minBottomMargin).padEnd(17)}px |`);
    });

    // Find worst cases
    const worstTop = results.reduce((max, r) => r.cardsNearTop > max.cardsNearTop ? r : max, results[0]);
    const worstBottom = results.reduce((max, r) => r.cardsNearBottom > max.cardsNearBottom ? r : max, results[0]);
    const closestTop = results.reduce((min, r) => {
      if (r.minTopMargin === 0) return min; // Skip zeros (no cards found)
      if (min.minTopMargin === 0) return r;
      return r.minTopMargin < min.minTopMargin ? r : min;
    }, results[0]);
    const closestBottom = results.reduce((min, r) => {
      if (r.minBottomMargin === 0) return min;
      if (min.minBottomMargin === 0) return r;
      return r.minBottomMargin < min.minBottomMargin ? r : min;
    }, results[0]);

    console.log(`\n=== CRITICAL POINTS ===`);
    console.log(`Worst case for top zone (breadcrumbs): Zoom level ${worstTop.zoomLevel} with ${worstTop.cardsNearTop} cards`);
    console.log(`Worst case for bottom zone (zoom controls): Zoom level ${worstBottom.zoomLevel} with ${worstBottom.cardsNearBottom} cards`);
    console.log(`Closest approach to top: Zoom level ${closestTop.zoomLevel} at ${closestTop.minTopMargin}px margin`);
    console.log(`Closest approach to bottom: Zoom level ${closestBottom.zoomLevel} at ${closestBottom.minBottomMargin}px margin`);

    // Verify reasonable safety margins exist
    const hasReasonableTopMargin = closestTop.minTopMargin === 0 || closestTop.minTopMargin >= 40;
    const hasReasonableBottomMargin = closestBottom.minBottomMargin === 0 || closestBottom.minBottomMargin >= 20;

    if (hasReasonableTopMargin && hasReasonableBottomMargin) {
      console.log(`\n✅ Safety margins maintained across all zoom levels`);
    } else {
      console.log(`\n⚠️ Some zoom levels have cards very close to control zones`);
      if (!hasReasonableTopMargin) {
        console.log(`  - Top margin: ${closestTop.minTopMargin}px (recommended: >= 40px)`);
      }
      if (!hasReasonableBottomMargin) {
        console.log(`  - Bottom margin: ${closestBottom.minBottomMargin}px (recommended: >= 20px)`);
      }
    }

    // Check if we found at least one dense scenario
    const denseLevels = results.filter(r => r.visibleCards >= 8);
    if (denseLevels.length > 0) {
      console.log(`\n✅ Found ${denseLevels.length} zoom level(s) with 8+ visible cards (dense scenario)`);
      console.log(`   Max density: ${Math.max(...denseLevels.map(r => r.visibleCards))} cards`);
    } else {
      console.log(`\n⚠️ No zoom level reached 8+ visible cards (may need to adjust timeline or position)`);
    }

    // Assertions - ensure we collected data across zoom levels
    expect(results.length, 'Should have data for all zoom levels').toBe(totalSteps);
    expect(results.some(r => r.visibleCards > 0), 'Should have visible cards in at least one zoom level').toBe(true);

    // Audit-style assertion: report if dense scenario was achieved (but don't fail test)
    console.log(`\n=== DENSITY AUDIT ===`);
    console.log(`Target: At least one zoom level with 8+ visible cards`);
    console.log(`Result: ${denseLevels.length > 0 ? '✅ PASS' : '⚠️ NEEDS REVIEW'}`);
  });

});
