 
import { test, expect } from '@playwright/test';
import { loadTestTimeline } from '../utils/timelineTestUtils';

// Dev Panel removed in v0.5.24 - use direct navigation to Firestore timelines

async function fitAll(page: any) {
  const fit = page.locator('[data-testid="btn-fit-all"]');
  if (await fit.count()) {
    await fit.click();
  }
}

import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

async function saveViewportScreenshot(page: any, name: string) {
  // Attach to test's output
  const attachmentPath = test.info().outputPath(name);
  await page.screenshot({ path: attachmentPath, fullPage: false });
  await test.info().attach(name, { path: attachmentPath, contentType: 'image/png' });

  // Also copy to central folder for quick access
  const baseDir = join(process.cwd(), 'test-results', 'screenshots');
  if (!existsSync(baseDir)) mkdirSync(baseDir, { recursive: true });
  const stablePath = join(baseDir, name);
  // Take an explicit screenshot to avoid cross-filesystem copy complications
  await page.screenshot({ path: stablePath, fullPage: false });
}

async function logTickSpread(page: any, label: string) {
  const debug = await page.evaluate(() => (window as any).debugTimelineScales?.());
  if (!debug) {
    console.log(`[timeline] ${label}: debugTimelineScales unavailable`);
    return { spread: 0, tickCount: 0 };
  }
  const ticks = Array.isArray(debug.ticks) ? debug.ticks : [];
  if (ticks.length === 0) {
    console.log(`[timeline] ${label}: no ticks`, debug);
    return { spread: 0, tickCount: 0 };
  }
  const xs = ticks
    .map((tick: { x: number }) => Number.isFinite(tick.x) ? tick.x : null)
    .filter((x: number | null): x is number => x !== null);
  if (xs.length === 0) {
    console.log(`[timeline] ${label}: tick coordinates unavailable`, debug);
    return { spread: 0, tickCount: ticks.length };
  }
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const spread = maxX - minX;
  console.log(`[timeline] ${label}: ticks=${ticks.length} minX=${minX.toFixed(1)} maxX=${maxX.toFixed(1)} spread=${spread.toFixed(1)}`);
  return { spread, tickCount: ticks.length };
}

test.describe('v5/09 Seeding scenarios and screenshots', () => {
  test('RFK 1968 — screenshot', async ({ page }) => {
    await loadTestTimeline(page, 'timeline-rfk');
    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible();
    await fitAll(page);
  const { spread } = await logTickSpread(page, 'RFK 1968');
  expect(spread).toBeGreaterThan(1200);
    await saveViewportScreenshot(page, 'v5-rfk-1968.png');
  });

  test('RFK 1968 — timeline date range coverage', async ({ page }) => {
    await loadTestTimeline(page, 'timeline-rfk');
    await fitAll(page);
    
    // Verify all 10 RFK events are loaded (visible + overflow)
    const eventCards = page.locator('[data-testid="event-card"]');
    const cardCount = await eventCards.count();
    
    // Check timeline anchors for overflow info
    const anchors = page.locator('[data-testid="timeline-anchor"]');
    const anchorCount = await anchors.count();
    
    // Verify timeline shows full date range (March-June 1968)
    const timelineLabels = page.locator('text=/Mar 1968|Apr 1968|May 1968|Jun 1968/');
    const uniqueMonths = new Set();
    const labelCount = await timelineLabels.count();
    
    for (let i = 0; i < labelCount; i++) {
      const text = await timelineLabels.nth(i).textContent();
      if (text) uniqueMonths.add(text);
    }
    
    // Debug: Check DOM for actual event data
    await page.waitForTimeout(1000); // Wait for any state updates
    
    // Look for event titles in the DOM to verify what's loaded
    const allEventTitles = await page.locator('[data-testid="event-card"] h3').allTextContents();
    
    // Also check if we have any timeline labels showing dates beyond April
    await page.locator('.timeline-axis').allTextContents().catch(() => []);
    
    const debugInfo = await page.evaluate(() => {
      const debug = (window as any).powerTimelineDebug;
      return {
        eventsCount: debug?.events?.length || 0,
        minDate: debug?.minDate,
        maxDate: debug?.maxDate,
        viewWindow: debug?.viewWindow,
        internalView: debug?.internalView,
        visibleWindow: debug?.visibleWindow
      };
    });
    
    console.log('Test Results:');
    console.log(`- Event cards visible: ${cardCount}`);
    console.log(`- Timeline anchors: ${anchorCount}`);  
    console.log(`- Unique months shown: ${Array.from(uniqueMonths).join(', ')}`);
    console.log(`- Event titles shown: ${allEventTitles.join(', ')}`);
    console.log(`- Total events in state: ${debugInfo.eventsCount}`);
    console.log(`- Date range: ${debugInfo.minDate} to ${debugInfo.maxDate}`);
    console.log(`- View window: ${JSON.stringify(debugInfo.viewWindow)}`);
    console.log(`- Internal view: ${JSON.stringify(debugInfo.internalView)}`);
    console.log(`- Visible window: ${JSON.stringify(debugInfo.visibleWindow)}`);
    
    // Timeline axis now shows full range - SUCCESS!
    expect(uniqueMonths.has('Mar 1968')).toBe(true);
    expect(uniqueMonths.has('May 1968')).toBe(true); // Now works!
    expect(uniqueMonths.has('Jun 1968')).toBe(true); // Now works!
    
    // All RFK events should now render without truncation
    expect(cardCount).toBe(10);
  const { spread } = await logTickSpread(page, 'RFK 1968 coverage');
  expect(spread).toBeGreaterThan(1200);
  });

  test('JFK 1961-63 — screenshot', async ({ page }) => {
    await loadTestTimeline(page, 'timeline-jfk');
    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible();
    await fitAll(page);
    await saveViewportScreenshot(page, 'v5-jfk-1961-63.png');
  const { spread } = await logTickSpread(page, 'JFK 1961-63');
  expect(spread).toBeGreaterThan(1200);
  });

  test('Napoleon 1769-1821 — screenshot', async ({ page }) => {
    await loadTestTimeline(page, 'timeline-napoleon');
    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible({ timeout: 10000 });
    await fitAll(page);
    await saveViewportScreenshot(page, 'v5-napoleon-1769-1821.png');
  const { spread } = await logTickSpread(page, 'Napoleon 1769-1821');
  expect(spread).toBeGreaterThan(1200);
  });

  test('Long-range — screenshot', async ({ page }) => {
    // Use Napoleon timeline (1769-1821, 52-year span) for long-range testing
    await loadTestTimeline(page, 'napoleon-bonaparte');
    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible();
    await fitAll(page);
    await saveViewportScreenshot(page, 'v5-long-range.png');
  const { spread } = await logTickSpread(page, 'Long-range');
  expect(spread).toBeGreaterThan(1200);
  });

  // Note: "Clustered x1-x5" tests removed - they were Dev Panel-specific seeding features
  // that are no longer applicable after Dev Panel removal in v0.5.24
});
