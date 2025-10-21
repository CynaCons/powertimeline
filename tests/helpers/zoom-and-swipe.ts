import type { Page } from '@playwright/test';

/**
 * Position in the zoom-and-swipe procedure
 */
export interface ZoomSwipePosition {
  zoomLevel: number;  // 0-based zoom level (0 = fully zoomed out)
  panStep: number;    // 0-based pan step (0 = leftmost position)
}

/**
 * Analysis callback function signature
 * Called at each position during zoom-and-swipe
 */
export type AnalysisCallback<T> = (
  page: Page,
  position: ZoomSwipePosition
) => Promise<T>;

/**
 * Configuration for zoom-and-swipe procedure
 */
export interface ZoomSwipeConfig {
  /** Number of zoom levels to test (default: 10) */
  zoomLevels?: number;

  /** Number of pan steps per zoom level (default: 8) */
  pansPerLevel?: number;

  /** Wait time after zoom in ms (default: 800) */
  zoomWaitMs?: number;

  /** Wait time after pan in ms (default: 500) */
  panWaitMs?: number;

  /** Whether to pan to leftmost position before each zoom level (default: true) */
  resetPanBeforeZoom?: boolean;

  /** Whether to use zoom buttons (true) or keyboard (false) (default: true) */
  useZoomButtons?: boolean;
}

/**
 * Result from zoom-and-swipe procedure
 */
export interface ZoomSwipeResult<T> {
  /** All analysis results, indexed by [zoomLevel][panStep] */
  results: T[][];

  /** Total positions analyzed */
  totalPositions: number;

  /** Configuration used */
  config: Required<ZoomSwipeConfig>;
}

/**
 * Reusable Zoom-and-Swipe Procedure
 *
 * Systematically tests timeline at all zoom levels and pan positions:
 * 1. Start at fully zoomed out view
 * 2. Pan from left to right, analyzing at each step
 * 3. Zoom in once
 * 4. Repeat pan left-to-right
 * 5. Continue for N zoom levels
 *
 * This creates comprehensive coverage of all viewport configurations.
 *
 * @param page - Playwright page object
 * @param analysisCallback - Function to analyze cards at each position
 * @param config - Configuration options
 * @returns Results from all positions
 *
 * @example
 * ```typescript
 * const results = await zoomAndSwipe(page, async (page, pos) => {
 *   const cards = await page.locator('[data-testid="event-card"]').count();
 *   return { cardCount: cards };
 * });
 *
 * console.log(`Analyzed ${results.totalPositions} positions`);
 * results.results.forEach((zoomLevelResults, zoom) => {
 *   zoomLevelResults.forEach((analysis, pan) => {
 *     console.log(`Zoom ${zoom}, Pan ${pan}: ${analysis.cardCount} cards`);
 *   });
 * });
 * ```
 */
export async function zoomAndSwipe<T>(
  page: Page,
  analysisCallback: AnalysisCallback<T>,
  config: ZoomSwipeConfig = {}
): Promise<ZoomSwipeResult<T>> {
  // Default configuration
  const finalConfig: Required<ZoomSwipeConfig> = {
    zoomLevels: config.zoomLevels ?? 10,
    pansPerLevel: config.pansPerLevel ?? 8,
    zoomWaitMs: config.zoomWaitMs ?? 800,
    panWaitMs: config.panWaitMs ?? 500,
    resetPanBeforeZoom: config.resetPanBeforeZoom ?? true,
    useZoomButtons: config.useZoomButtons ?? true
  };

  const results: T[][] = [];
  let totalPositions = 0;

  console.log('\n' + '='.repeat(70));
  console.log('🔍 ZOOM-AND-SWIPE PROCEDURE STARTING');
  console.log('='.repeat(70));
  console.log(`Zoom levels: ${finalConfig.zoomLevels}`);
  console.log(`Pans per level: ${finalConfig.pansPerLevel}`);
  console.log(`Total positions to analyze: ${finalConfig.zoomLevels * (finalConfig.pansPerLevel + 1)}`);
  console.log('='.repeat(70) + '\n');

  // Iterate through zoom levels
  for (let zoomLevel = 0; zoomLevel < finalConfig.zoomLevels; zoomLevel++) {
    console.log(`\n${'━'.repeat(70)}`);
    console.log(`🔎 ZOOM LEVEL ${zoomLevel} ${zoomLevel === 0 ? '(INITIAL - FULLY ZOOMED OUT)' : ''}`);
    console.log('━'.repeat(70));

    const zoomLevelResults: T[] = [];

    // Reset pan position to leftmost if requested
    if (finalConfig.resetPanBeforeZoom && zoomLevel > 0) {
      console.log('⏪ Resetting to leftmost position...');
      // Pan left multiple times to ensure we're at the leftmost position
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('ArrowLeft');
        await page.waitForTimeout(100);
      }
      await page.waitForTimeout(finalConfig.panWaitMs);
    }

    // Pan 0: Initial position (leftmost)
    console.log(`\n  📍 Pan Step 0 (leftmost)`);
    const initialAnalysis = await analysisCallback(page, { zoomLevel, panStep: 0 });
    zoomLevelResults.push(initialAnalysis);
    totalPositions++;

    // Pan from left to right
    for (let panStep = 1; panStep <= finalConfig.pansPerLevel; panStep++) {
      console.log(`\n  ➡️ Pan Step ${panStep}`);
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(finalConfig.panWaitMs);

      const analysis = await analysisCallback(page, { zoomLevel, panStep });
      zoomLevelResults.push(analysis);
      totalPositions++;
    }

    results.push(zoomLevelResults);

    // Zoom in for next level (except on last iteration)
    if (zoomLevel < finalConfig.zoomLevels - 1) {
      console.log(`\n  🔍 Zooming in to level ${zoomLevel + 1}...`);

      if (finalConfig.useZoomButtons) {
        await page.getByRole('button', { name: 'Zoom in' }).click();
      } else {
        await page.keyboard.press('Equal'); // '+' key for zoom in
      }

      await page.waitForTimeout(finalConfig.zoomWaitMs);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ ZOOM-AND-SWIPE PROCEDURE COMPLETE');
  console.log('='.repeat(70));
  console.log(`Total positions analyzed: ${totalPositions}`);
  console.log('='.repeat(70) + '\n');

  return {
    results,
    totalPositions,
    config: finalConfig
  };
}

/**
 * Pan to leftmost position
 * Useful for resetting pan position between tests
 */
export async function panToLeft(page: Page, presses: number = 20, waitMs: number = 100): Promise<void> {
  console.log(`⏪ Panning to leftmost position (${presses} presses)...`);
  for (let i = 0; i < presses; i++) {
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(waitMs);
  }
}

/**
 * Pan to rightmost position
 * Useful for resetting pan position between tests
 */
export async function panToRight(page: Page, presses: number = 20, waitMs: number = 100): Promise<void> {
  console.log(`⏩ Panning to rightmost position (${presses} presses)...`);
  for (let i = 0; i < presses; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(waitMs);
  }
}

/**
 * Zoom to initial level (fully zoomed out)
 * Useful for resetting zoom between tests
 */
export async function zoomToInitial(page: Page, zoomOuts: number = 20, waitMs: number = 200): Promise<void> {
  console.log(`🔍 Zooming out to initial level (${zoomOuts} zoom outs)...`);
  for (let i = 0; i < zoomOuts; i++) {
    await page.keyboard.press('Minus'); // '-' key for zoom out
    await page.waitForTimeout(waitMs);
  }
}
