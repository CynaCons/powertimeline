import { test, expect } from '@playwright/test';
import { loginAsTestUser, loadTimeline, waitForEditorLoaded, skipIfNoCredentials } from '../utils/timelineTestUtils';

// Test configuration
const TEST_OWNER_USERNAME = 'cynacons';
const TEST_TIMELINE_ID = 'french-revolution';

interface CardInfo {
  id: string;
  rect: { x: number; y: number; width: number; height: number };
  zIndex: number;
}

interface ControlInfo {
  name: string;
  rect: { x: number; y: number; width: number; height: number };
  zIndex: number;
}

interface EdgeOverlap {
  card: CardInfo;
  control: ControlInfo;
  overlapArea: number;
  zIndexCorrect: boolean; // true if control has higher z-index than card
}

test.describe('Smart Visual Audit - Edge Case Detection', () => {
  test.beforeEach(async ({ page }) => {
    skipIfNoCredentials(test);
    await loginAsTestUser(page);
  });

  test('analyze timeline density and find hot zones', async ({ page }) => {
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page);
    await page.waitForTimeout(2000);

    // Extract all visible cards and their positions
    const analysis = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid*="event-card"], [class*="event-card"]');
      const viewport = { width: window.innerWidth, height: window.innerHeight };

      const cardData: { id: string; rect: DOMRect; inViewport: boolean }[] = [];

      cards.forEach((card, i) => {
        const rect = card.getBoundingClientRect();
        const inViewport = rect.top < viewport.height && rect.bottom > 0 &&
                          rect.left < viewport.width && rect.right > 0;
        cardData.push({
          id: card.getAttribute('data-testid') || `card-${i}`,
          rect,
          inViewport
        });
      });

      // Find cards near edges
      const nearTop = cardData.filter(c => c.inViewport && c.rect.top < 150);
      const nearBottom = cardData.filter(c => c.inViewport && c.rect.bottom > viewport.height - 100);
      const nearTopRight = cardData.filter(c => c.inViewport && c.rect.top < 200 && c.rect.right > viewport.width - 300);

      return {
        totalCards: cards.length,
        visibleCards: cardData.filter(c => c.inViewport).length,
        cardsNearTop: nearTop.length,
        cardsNearBottom: nearBottom.length,
        cardsNearTopRight: nearTopRight.length,
        viewport
      };
    });

    console.log('=== TIMELINE DENSITY ANALYSIS ===');
    console.log(`Total cards: ${analysis.totalCards}`);
    console.log(`Visible cards: ${analysis.visibleCards}`);
    console.log(`Cards near top (breadcrumb zone): ${analysis.cardsNearTop}`);
    console.log(`Cards near bottom (zoom control zone): ${analysis.cardsNearBottom}`);
    console.log(`Cards near top-right (minimap zone): ${analysis.cardsNearTopRight}`);
  });

  test('detect zoom control overlaps at bottom edge', async ({ page }) => {
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page);
    await page.waitForTimeout(1500);

    // Find zoom controls
    const zoomControlsInfo = await page.evaluate(() => {
      // Look for zoom control container
      const zoomSelectors = [
        '[class*="zoom-controls"]',
        '[class*="ZoomControl"]',
        '.absolute.bottom-4' // Common positioning
      ];

      for (const selector of zoomSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          if (rect.height > 0) {
            return {
              found: true,
              rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
              zIndex: parseInt(style.zIndex) || 0,
              selector
            };
          }
        }
      }

      // Fallback: find buttons with +/- text and get their parent
      const buttons = Array.from(document.querySelectorAll('button'));
      const zoomButton = buttons.find(btn => btn.textContent?.includes('+') || btn.textContent?.includes('-'));
      if (zoomButton && zoomButton.parentElement) {
        const rect = zoomButton.parentElement.getBoundingClientRect();
        const style = getComputedStyle(zoomButton.parentElement);
        if (rect.height > 0) {
          return {
            found: true,
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            zIndex: parseInt(style.zIndex) || 0,
            selector: 'button-parent-fallback'
          };
        }
      }

      return { found: false };
    });

    console.log('=== ZOOM CONTROLS ===');
    console.log(JSON.stringify(zoomControlsInfo, null, 2));

    if (!zoomControlsInfo.found) {
      console.log('⚠️ Zoom controls not found - skipping overlap check');
      return;
    }

    // Scroll/zoom to position cards near bottom
    // Try zooming out to see more timeline, then check for cards near bottom
    const zoomOutBtn = page.locator('button:has-text("-")').first();
    if (await zoomOutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      for (let i = 0; i < 3; i++) {
        await zoomOutBtn.click();
        await page.waitForTimeout(300);
      }
    }

    // Check for cards overlapping zoom controls
    const overlaps = await page.evaluate((controlRect) => {
      const cards = document.querySelectorAll('[data-testid*="event-card"], [class*="event-card"]');
      const overlappingCards: any[] = [];

      cards.forEach((card, i) => {
        const rect = card.getBoundingClientRect();
        const style = getComputedStyle(card);
        const cardZIndex = parseInt(style.zIndex) || 0;

        // Check if card overlaps with zoom controls area
        const overlapsX = !(rect.right < controlRect.x || rect.x > controlRect.x + controlRect.width);
        const overlapsY = !(rect.bottom < controlRect.y || rect.y > controlRect.y + controlRect.height);

        if (overlapsX && overlapsY) {
          overlappingCards.push({
            cardId: card.getAttribute('data-testid') || `card-${i}`,
            cardZIndex,
            controlZIndex: 60, // Expected from our fix
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            zIndexCorrect: cardZIndex < 60 // Card should be below zoom controls
          });
        }
      });

      return overlappingCards;
    }, zoomControlsInfo.rect);

    console.log('=== ZOOM CONTROL OVERLAP CHECK ===');
    console.log(`Cards overlapping zoom controls: ${overlaps.length}`);

    overlaps.forEach(o => {
      const status = o.zIndexCorrect ? '✅' : '❌';
      console.log(`${status} ${o.cardId}: card z=${o.cardZIndex}, control z=${o.controlZIndex}`);
    });

    const zIndexIssues = overlaps.filter(o => !o.zIndexCorrect);
    if (zIndexIssues.length > 0) {
      console.log(`\n❌ CRITICAL: ${zIndexIssues.length} cards have higher z-index than zoom controls!`);
    } else if (overlaps.length > 0) {
      console.log('\n✅ All overlapping cards have correct z-index (below zoom controls)');
    } else {
      console.log('\n✅ No cards currently overlap zoom controls');
    }

    // Take screenshot for visual verification
    await page.screenshot({
      path: 'screenshots/visual-audit/smart-zoom-controls-check.png',
      fullPage: false
    });
  });

  test('detect breadcrumb overlaps at top edge', async ({ page }) => {
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page);
    await page.waitForTimeout(1500);

    // Find breadcrumbs
    const breadcrumbInfo = await page.evaluate(() => {
      const selectors = [
        '[class*="Breadcrumb"]',
        '[class*="breadcrumb"]',
        'nav[aria-label*="breadcrumb"]',
        '.absolute.top-11.left-20' // Common positioning from EditorPage
      ];

      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el) {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          if (rect.height > 0) {
            return {
              found: true,
              rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
              zIndex: parseInt(style.zIndex) || 0,
              selector
            };
          }
        }
      }
      return { found: false };
    });

    console.log('=== BREADCRUMBS ===');
    console.log(JSON.stringify(breadcrumbInfo, null, 2));

    if (!breadcrumbInfo.found) {
      console.log('⚠️ Breadcrumbs not found - skipping overlap check');
      return;
    }

    // Try to scroll/zoom to get cards near top
    // Zoom in to make cards larger and potentially reach breadcrumb area
    const zoomInBtn = page.locator('button:has-text("+")').first();
    if (await zoomInBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      for (let i = 0; i < 5; i++) {
        await zoomInBtn.click();
        await page.waitForTimeout(300);
      }
    }

    // Scroll the timeline to try to position cards near top
    await page.mouse.wheel(0, -500);
    await page.waitForTimeout(500);

    // Check for cards overlapping breadcrumbs
    const overlaps = await page.evaluate((controlRect) => {
      const cards = document.querySelectorAll('[data-testid*="event-card"], [class*="event-card"]');
      const overlappingCards: any[] = [];

      cards.forEach((card, i) => {
        const rect = card.getBoundingClientRect();
        const style = getComputedStyle(card);
        const cardZIndex = parseInt(style.zIndex) || 0;

        // Check if card overlaps with breadcrumb area
        const overlapsX = !(rect.right < controlRect.x || rect.x > controlRect.x + controlRect.width);
        const overlapsY = !(rect.bottom < controlRect.y || rect.y > controlRect.y + controlRect.height);

        if (overlapsX && overlapsY) {
          overlappingCards.push({
            cardId: card.getAttribute('data-testid') || `card-${i}`,
            cardZIndex,
            controlZIndex: 60, // Expected from our fix
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            zIndexCorrect: cardZIndex < 60
          });
        }
      });

      return overlappingCards;
    }, breadcrumbInfo.rect);

    console.log('=== BREADCRUMB OVERLAP CHECK ===');
    console.log(`Cards overlapping breadcrumbs: ${overlaps.length}`);

    overlaps.forEach(o => {
      const status = o.zIndexCorrect ? '✅' : '❌';
      console.log(`${status} ${o.cardId}: card z=${o.cardZIndex}, control z=${o.controlZIndex}`);
    });

    const zIndexIssues = overlaps.filter(o => !o.zIndexCorrect);
    if (zIndexIssues.length > 0) {
      console.log(`\n❌ CRITICAL: ${zIndexIssues.length} cards have higher z-index than breadcrumbs!`);
    } else if (overlaps.length > 0) {
      console.log('\n✅ All overlapping cards have correct z-index (below breadcrumbs)');
    } else {
      console.log('\n✅ No cards currently overlap breadcrumbs');
    }

    await page.screenshot({
      path: 'screenshots/visual-audit/smart-breadcrumb-check.png',
      fullPage: false
    });
  });

  test('detect minimap overlaps at top-right', async ({ page }) => {
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page);
    await page.waitForTimeout(1500);

    // Find minimap
    const minimapInfo = await page.evaluate(() => {
      const selectors = [
        '[class*="Minimap"]',
        '[class*="minimap"]',
        '[data-testid*="minimap"]',
        '.fixed.top-1' // Common positioning
      ];

      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el) {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          if (rect.height > 0 && rect.width > 0) {
            return {
              found: true,
              rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
              zIndex: parseInt(style.zIndex) || 0,
              selector
            };
          }
        }
      }
      return { found: false };
    });

    console.log('=== MINIMAP ===');
    console.log(JSON.stringify(minimapInfo, null, 2));

    if (!minimapInfo.found) {
      console.log('⚠️ Minimap not found - skipping overlap check');
      return;
    }

    // Check for cards overlapping minimap
    const overlaps = await page.evaluate((controlRect) => {
      const cards = document.querySelectorAll('[data-testid*="event-card"], [class*="event-card"]');
      const overlappingCards: any[] = [];

      cards.forEach((card, i) => {
        const rect = card.getBoundingClientRect();
        const style = getComputedStyle(card);
        const cardZIndex = parseInt(style.zIndex) || 0;

        const overlapsX = !(rect.right < controlRect.x || rect.x > controlRect.x + controlRect.width);
        const overlapsY = !(rect.bottom < controlRect.y || rect.y > controlRect.y + controlRect.height);

        if (overlapsX && overlapsY) {
          overlappingCards.push({
            cardId: card.getAttribute('data-testid') || `card-${i}`,
            cardZIndex,
            controlZIndex: 50, // Expected --z-minimap
            zIndexCorrect: cardZIndex < 50
          });
        }
      });

      return overlappingCards;
    }, minimapInfo.rect);

    console.log('=== MINIMAP OVERLAP CHECK ===');
    console.log(`Cards overlapping minimap: ${overlaps.length}`);

    overlaps.forEach(o => {
      const status = o.zIndexCorrect ? '✅' : '❌';
      console.log(`${status} ${o.cardId}: card z=${o.cardZIndex}, control z=${o.controlZIndex}`);
    });

    const zIndexIssues = overlaps.filter(o => !o.zIndexCorrect);
    if (zIndexIssues.length > 0) {
      console.log(`\n❌ CRITICAL: ${zIndexIssues.length} cards have higher z-index than minimap!`);
    } else if (overlaps.length > 0) {
      console.log('\n✅ All overlapping cards have correct z-index (below minimap)');
    } else {
      console.log('\n✅ No cards currently overlap minimap');
    }

    await page.screenshot({
      path: 'screenshots/visual-audit/smart-minimap-check.png',
      fullPage: false
    });
  });

  test('comprehensive edge scan - all zoom levels', async ({ page }) => {
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page);
    await page.waitForTimeout(1500);

    const zoomLevels = ['zoomed-out', 'default', 'zoomed-in'];
    const results: any[] = [];

    for (const zoomLevel of zoomLevels) {
      // Set zoom level
      if (zoomLevel === 'zoomed-out') {
        const btn = page.locator('button:has-text("-")').first();
        for (let i = 0; i < 5; i++) {
          if (await btn.isVisible().catch(() => false)) {
            await btn.click();
            await page.waitForTimeout(200);
          }
        }
      } else if (zoomLevel === 'zoomed-in') {
        const btn = page.locator('button:has-text("+")').first();
        for (let i = 0; i < 10; i++) {
          if (await btn.isVisible().catch(() => false)) {
            await btn.click();
            await page.waitForTimeout(200);
          }
        }
      }

      await page.waitForTimeout(500);

      // Analyze card positions relative to control areas
      const analysis = await page.evaluate(() => {
        const viewport = { width: window.innerWidth, height: window.innerHeight };
        const cards = document.querySelectorAll('[data-testid*="event-card"], [class*="event-card"]');

        let nearTop = 0, nearBottom = 0, nearTopRight = 0;

        cards.forEach(card => {
          const rect = card.getBoundingClientRect();
          if (rect.top < 150) nearTop++;
          if (rect.bottom > viewport.height - 100) nearBottom++;
          if (rect.top < 200 && rect.right > viewport.width - 300) nearTopRight++;
        });

        return { totalCards: cards.length, nearTop, nearBottom, nearTopRight };
      });

      results.push({ zoomLevel, ...analysis });

      // Screenshot at each zoom level
      await page.screenshot({
        path: `screenshots/visual-audit/smart-scan-${zoomLevel}.png`,
        fullPage: false
      });
    }

    console.log('=== COMPREHENSIVE EDGE SCAN ===');
    console.log('| Zoom Level | Total Cards | Near Top | Near Bottom | Near Top-Right |');
    console.log('|------------|-------------|----------|-------------|----------------|');
    results.forEach(r => {
      console.log(`| ${r.zoomLevel.padEnd(10)} | ${String(r.totalCards).padEnd(11)} | ${String(r.nearTop).padEnd(8)} | ${String(r.nearBottom).padEnd(11)} | ${String(r.nearTopRight).padEnd(14)} |`);
    });

    // Identify worst case for each control area
    const worstTop = results.reduce((max, r) => r.nearTop > max.nearTop ? r : max, results[0]);
    const worstBottom = results.reduce((max, r) => r.nearBottom > max.nearBottom ? r : max, results[0]);

    console.log(`\nWorst case for breadcrumbs: ${worstTop.zoomLevel} (${worstTop.nearTop} cards)`);
    console.log(`Worst case for zoom controls: ${worstBottom.zoomLevel} (${worstBottom.nearBottom} cards)`);
  });
});
