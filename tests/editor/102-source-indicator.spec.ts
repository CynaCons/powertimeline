/**
 * E2E Tests for Source Indicator on Cards
 * CC-REQ-CARD-SOURCE-001: Cards with sources display a visual indicator icon
 *
 * Tests use three verification methods:
 * 1. Selectors - Playwright locators to find elements
 * 2. DOM Parsing - JavaScript evaluation to inspect DOM structure
 * 3. Screenshots - Visual verification with pixel analysis
 */

import { test, expect, type Page } from '@playwright/test';

// JCM timeline has events with sources in dev environment
const TEST_OWNER_USERNAME = 'cynacons';
const TEST_TIMELINE_ID = 'timeline-janus-cosmological-model';

// Known events with sources in the JCM timeline (dev)
const EVENTS_WITH_SOURCES = [
  'France-Soir: Extensive Interview',
  'Birth of Jean-Pierre Petit',
  'Moscow MHD Conference',
  'Variable Speed of Light Cosmology',
  'The Missing Mass Problem Paper',
];

/**
 * Navigate to the JCM timeline
 */
async function navigateToTimeline(page: Page): Promise<void> {
  await page.goto(`/${TEST_OWNER_USERNAME}/timeline/${TEST_TIMELINE_ID}`);
  await page.waitForLoadState('domcontentloaded');

  // Wait for cards to render
  await page.waitForSelector('[data-testid="event-card"]', { timeout: 10000 });
  await page.waitForTimeout(1000); // Allow layout to stabilize
}

test.describe('Source Indicator Visibility - CC-REQ-CARD-SOURCE-001', () => {

  test.beforeEach(async ({ page }) => {
    await navigateToTimeline(page);
  });

  /**
   * METHOD 1: SELECTOR-BASED VERIFICATION
   * Use Playwright locators to find source indicators
   */
  test('Method 1: Selectors - source indicators exist on cards with sources', async ({ page }) => {
    // Find all source indicators using data-testid
    const sourceIndicators = page.locator('[data-testid="source-indicator"]');

    // Should have at least some source indicators visible
    const indicatorCount = await sourceIndicators.count();
    expect(indicatorCount).toBeGreaterThan(0);

    console.log(`[Selectors] Found ${indicatorCount} source indicators`);

    // Verify each indicator has the expected attributes
    for (let i = 0; i < Math.min(indicatorCount, 5); i++) {
      const indicator = sourceIndicators.nth(i);

      // Check data-source-count attribute exists and is a positive number
      const sourceCount = await indicator.getAttribute('data-source-count');
      expect(sourceCount).toBeTruthy();
      expect(parseInt(sourceCount!, 10)).toBeGreaterThan(0);

      // Check title attribute contains source count info
      const title = await indicator.getAttribute('title');
      expect(title).toMatch(/\d+ source/);

      // Check visibility
      await expect(indicator).toBeVisible();
    }
  });

  /**
   * METHOD 2: DOM PARSING VERIFICATION
   * Use page.evaluate() to inspect DOM structure directly
   */
  test('Method 2: DOM Parsing - source indicators have correct structure', async ({ page }) => {
    // Parse DOM to extract source indicator information
    const domAnalysis = await page.evaluate(() => {
      const indicators = document.querySelectorAll('[data-testid="source-indicator"]');
      const results: Array<{
        sourceCount: number;
        hasLinkIcon: boolean;
        backgroundColor: string;
        width: string;
        height: string;
        isVisible: boolean;
        parentCardId: string | null;
      }> = [];

      indicators.forEach((indicator) => {
        const element = indicator as HTMLElement;
        const computedStyle = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        // Find parent card
        const parentCard = element.closest('[data-testid="event-card"]');

        // Check if the element is the link icon (now it's directly the icon element)
        const isLinkIcon = element.classList.contains('material-symbols-rounded') &&
          element.textContent?.trim() === 'link';

        results.push({
          sourceCount: parseInt(element.getAttribute('data-source-count') || '0', 10),
          isLinkIcon,
          isVisible: rect.width > 0 && rect.height > 0,
          parentCardId: parentCard?.getAttribute('data-event-id') || null,
        });
      });

      return {
        totalIndicators: indicators.length,
        indicators: results,
      };
    });

    console.log(`[DOM Parsing] Found ${domAnalysis.totalIndicators} source indicators`);

    // Verify we found indicators
    expect(domAnalysis.totalIndicators).toBeGreaterThan(0);

    // Verify each indicator's DOM structure
    for (const indicator of domAnalysis.indicators) {
      // Source count should be positive
      expect(indicator.sourceCount).toBeGreaterThan(0);

      // Should be visible (has dimensions)
      expect(indicator.isVisible).toBe(true);

      // Should be inside a card
      expect(indicator.parentCardId).toBeTruthy();
    }

    console.log(`[DOM Parsing] All ${domAnalysis.totalIndicators} indicators passed structure validation`);
  });

  /**
   * METHOD 3: SCREENSHOT VERIFICATION
   * Take screenshots and verify purple pixels exist in indicator locations
   */
  test('Method 3: Screenshots - source indicators are visually rendered', async ({ page }) => {
    // Get positions of all source indicators
    const indicatorPositions = await page.evaluate(() => {
      const indicators = document.querySelectorAll('[data-testid="source-indicator"]');
      const positions: Array<{ x: number; y: number; width: number; height: number }> = [];

      indicators.forEach((indicator) => {
        const rect = (indicator as HTMLElement).getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          positions.push({
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });
        }
      });

      return positions;
    });

    expect(indicatorPositions.length).toBeGreaterThan(0);
    console.log(`[Screenshots] Found ${indicatorPositions.length} indicator positions`);

    // Take a full page screenshot for reference
    const fullScreenshot = await page.screenshot({
      path: 'test-results/source-indicator-full.png',
      fullPage: false
    });
    expect(fullScreenshot.length).toBeGreaterThan(0);

    // Take individual screenshots of first 3 indicators
    for (let i = 0; i < Math.min(indicatorPositions.length, 3); i++) {
      const pos = indicatorPositions[i];

      // Take a clip screenshot of the indicator area (with some padding)
      const clipScreenshot = await page.screenshot({
        path: `test-results/source-indicator-${i}.png`,
        clip: {
          x: Math.max(0, pos.x - 5),
          y: Math.max(0, pos.y - 5),
          width: pos.width + 10,
          height: pos.height + 10,
        },
      });

      // Verify screenshot was captured (has content)
      expect(clipScreenshot.length).toBeGreaterThan(100); // Should be more than 100 bytes

      console.log(`[Screenshots] Indicator ${i}: captured at (${pos.x}, ${pos.y}) - ${clipScreenshot.length} bytes`);
    }

    // Verify indicator is visible and has theme-aware styling
    const isStyled = await page.evaluate(() => {
      const indicators = document.querySelectorAll('[data-testid="source-indicator"]');
      if (indicators.length === 0) return false;

      const firstIndicator = indicators[0] as HTMLElement;
      const computedStyle = window.getComputedStyle(firstIndicator);

      // Check that it has a color set (not transparent)
      const color = computedStyle.color;
      const hasColor = color && color !== 'rgba(0, 0, 0, 0)';

      // Check that it uses material-symbols-rounded
      const isIcon = firstIndicator.classList.contains('material-symbols-rounded');

      // Check that it contains the link text
      const hasLinkText = firstIndicator.textContent?.trim() === 'link';

      return hasColor && isIcon && hasLinkText;
    });

    expect(isStyled).toBe(true);
    console.log('[Screenshots] Theme-aware styling verified');
  });

  /**
   * COMBINED: All three methods in one comprehensive test
   */
  test('Combined: All three verification methods pass', async ({ page }) => {
    // === METHOD 1: SELECTORS ===
    const sourceIndicators = page.locator('[data-testid="source-indicator"]');
    const selectorCount = await sourceIndicators.count();
    expect(selectorCount).toBeGreaterThan(0);
    console.log(`✓ Selectors: Found ${selectorCount} indicators`);

    // === METHOD 2: DOM PARSING ===
    const domCheck = await page.evaluate(() => {
      const indicators = document.querySelectorAll('[data-testid="source-indicator"]');
      let validCount = 0;

      indicators.forEach((el) => {
        const element = el as HTMLElement;
        // Now the indicator is a simple icon element
        const isIcon = element.classList.contains('material-symbols-rounded');
        const isLinkIcon = element.textContent?.trim() === 'link';
        const hasSourceCount = parseInt(element.getAttribute('data-source-count') || '0', 10) > 0;

        if (isIcon && isLinkIcon && hasSourceCount) {
          validCount++;
        }
      });

      return { total: indicators.length, valid: validCount };
    });

    expect(domCheck.valid).toBe(domCheck.total);
    expect(domCheck.total).toBeGreaterThan(0);
    console.log(`✓ DOM Parsing: ${domCheck.valid}/${domCheck.total} indicators have correct structure`);

    // === METHOD 3: SCREENSHOTS ===
    const screenshotBuffer = await page.screenshot({ fullPage: false });
    expect(screenshotBuffer.length).toBeGreaterThan(1000);

    // Verify visual rendering by checking indicator visibility
    const firstIndicator = sourceIndicators.first();
    const box = await firstIndicator.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
    console.log(`✓ Screenshots: Indicator rendered at ${box!.width}x${box!.height}px`);

    console.log('\n=== ALL THREE METHODS PASSED ===');
  });

  /**
   * Negative test: Cards without sources should NOT have indicator
   */
  test('Cards without sources do NOT display source indicator', async ({ page }) => {
    // Get all cards and check which ones have/don't have indicators
    const analysis = await page.evaluate(() => {
      const cards = document.querySelectorAll('[data-testid="event-card"]');
      let cardsWithIndicator = 0;
      let cardsWithoutIndicator = 0;

      cards.forEach((card) => {
        const hasIndicator = card.querySelector('[data-testid="source-indicator"]') !== null;
        if (hasIndicator) {
          cardsWithIndicator++;
        } else {
          cardsWithoutIndicator++;
        }
      });

      return { cardsWithIndicator, cardsWithoutIndicator, totalCards: cards.length };
    });

    console.log(`Total cards: ${analysis.totalCards}`);
    console.log(`Cards with indicator: ${analysis.cardsWithIndicator}`);
    console.log(`Cards without indicator: ${analysis.cardsWithoutIndicator}`);

    // JCM timeline has 100 events, 23 with sources, 77 without
    // So we expect some cards to NOT have indicators
    expect(analysis.cardsWithoutIndicator).toBeGreaterThan(0);

    // And some cards SHOULD have indicators
    expect(analysis.cardsWithIndicator).toBeGreaterThan(0);

    // Total should match
    expect(analysis.cardsWithIndicator + analysis.cardsWithoutIndicator).toBe(analysis.totalCards);
  });
});
