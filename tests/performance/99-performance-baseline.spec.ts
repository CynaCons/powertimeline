/**
 * ============================================================================
 * PERFORMANCE BASELINE TESTS (T99)
 * ============================================================================
 *
 * PURPOSE:
 * These tests measure performance metrics against defined baselines and FAIL
 * if performance degrades beyond critical thresholds. Use these for:
 * - CI/CD regression detection
 * - Quick performance health checks
 * - Tracking optimization progress
 *
 * HOW IT WORKS:
 * Each operation is measured and compared against three thresholds:
 * - TARGET: Ideal performance (shows as "excellent" or "good")
 * - ACCEPTABLE: Okay for now (shows as "acceptable")
 * - CRITICAL: Unacceptable - test FAILS (shows as "critical")
 *
 * QUICK START:
 * ```bash
 * # Run all baseline tests (recommended for CI)
 * npm test -- tests/performance/99-performance-baseline.spec.ts --project=desktop
 *
 * # Run specific test
 * npm test -- tests/performance/ --grep "T99.5" --project=desktop
 *
 * # Run with verbose output
 * npm test -- tests/performance/99-performance-baseline.spec.ts --project=desktop --reporter=list
 * ```
 *
 * TEST INVENTORY:
 * - T99.1: Timeline Load Performance (initial load + FCP)
 * - T99.2: Zoom Performance (button zoom in/out)
 * - T99.3: Navigation Performance (minimap clicks)
 * - T99.4: Pan Performance (mouse wheel horizontal)
 * - T99.5: Mouse Wheel Zoom Out to Overview (zoom out from detail)
 * - T99.6: Fit All Button (instant zoom reset)
 * - T99.7: Full Performance Baseline (all operations combined)
 *
 * OUTPUT FORMAT:
 * ```
 * ═══════════════════════════════════════════════════════════════════════════
 *   PERFORMANCE BASELINE RESULTS
 * ═══════════════════════════════════════════════════════════════════════════
 *   Metric                        Result     Target       Status   Assessment
 *   -----------------------------------------------------------------------
 *   Timeline Load                 2113ms     4000ms    excellent           🟢
 *   Zoom (avg)                   472ms/op   300ms/op   acceptable           🟡
 *   ...
 *   Overall Score: 68%
 *   Rating: ⭐⭐⭐⭐ Good
 * ```
 *
 * ADJUSTING BASELINES:
 * As you optimize, UPDATE the baselines below to catch future regressions.
 * Example: If you get zoom down to 150ms, change target from 300 to 150.
 *
 * NOTE: These are DEV MODE baselines. Production is typically 2-3x faster
 * due to bundling, minification, and no React dev overhead.
 *
 * RELATED FILES:
 * - 98-performance-profiling.spec.ts: Deep CPU profiling (generates .cpuprofile)
 * - test-results/performance/: Output directory for reports
 *
 * ============================================================================
 */

import { test, expect, type Page } from '@playwright/test';
import { loadTimeline, waitForEditorLoaded, skipIfNoCredentials } from '../utils/timelineTestUtils';

const TEST_OWNER_USERNAME = 'cynacons';
const TEST_TIMELINE_ID = 'french-revolution';

// ============================================================================
// Performance Baselines (in milliseconds)
// These are the "acceptable" thresholds for each operation
// Update these as you optimize - they become your regression guard
//
// NOTE: These are DEV MODE baselines. Production should be 2-3x faster.
// Consider creating separate PROD_BASELINES for CI/production testing.
// ============================================================================

const BASELINES = {
  // Initial load (dev mode includes HMR overhead)
  timelineLoad: {
    target: 4000,      // Target: 4s (dev mode)
    acceptable: 6000,  // Acceptable: 6s
    critical: 12000,   // Critical: 12s (fail test)
  },

  // Zoom operations (per zoom) - includes React dev overhead
  zoomOperation: {
    target: 300,       // Target: 300ms per zoom (dev mode)
    acceptable: 600,   // Acceptable: 600ms
    critical: 1500,    // Critical: 1.5s (fail test)
  },

  // Pan operations (per pan)
  panOperation: {
    target: 100,       // Target: 100ms per pan (dev mode)
    acceptable: 200,   // Acceptable: 200ms
    critical: 500,     // Critical: 500ms (fail test)
  },

  // Navigation (minimap click)
  navigation: {
    target: 200,       // Target: 200ms (dev mode)
    acceptable: 400,   // Acceptable: 400ms
    critical: 1000,    // Critical: 1s (fail test)
  },

  // First Contentful Paint (dev mode is MUCH slower due to unbundled modules)
  fcp: {
    target: 2000,      // Target: 2s (dev mode)
    acceptable: 4000,  // Acceptable: 4s (dev mode)
    critical: 8000,    // Critical: 8s (fail test)
  },
};

// ============================================================================
// Types
// ============================================================================

interface PerformanceResult {
  name: string;
  duration: number;
  baseline: { target: number; acceptable: number; critical: number };
  status: 'excellent' | 'good' | 'acceptable' | 'warning' | 'critical';
  iterations?: number;
}

// ============================================================================
// Helpers
// ============================================================================

function evaluatePerformance(
  duration: number,
  baseline: { target: number; acceptable: number; critical: number }
): 'excellent' | 'good' | 'acceptable' | 'warning' | 'critical' {
  if (duration <= baseline.target * 0.8) return 'excellent';
  if (duration <= baseline.target) return 'good';
  if (duration <= baseline.acceptable) return 'acceptable';
  if (duration <= baseline.critical) return 'warning';
  return 'critical';
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'excellent': return '🟢';
    case 'good': return '🟢';
    case 'acceptable': return '🟡';
    case 'warning': return '🟠';
    case 'critical': return '🔴';
    default: return '⚪';
  }
}

function printResults(results: PerformanceResult[]): void {
  console.log('\n' + '═'.repeat(75));
  console.log('  PERFORMANCE BASELINE RESULTS');
  console.log('═'.repeat(75));

  console.log('\n  ' + '-'.repeat(71));
  console.log(`  ${'Metric'.padEnd(25)} ${'Result'.padStart(10)} ${'Target'.padStart(10)} ${'Status'.padStart(12)} ${'Assessment'.padStart(12)}`);
  console.log('  ' + '-'.repeat(71));

  for (const result of results) {
    const emoji = getStatusEmoji(result.status);
    const duration = result.iterations
      ? `${(result.duration / result.iterations).toFixed(0)}ms/op`
      : `${result.duration.toFixed(0)}ms`;
    const target = result.iterations
      ? `${result.baseline.target}ms/op`
      : `${result.baseline.target}ms`;

    console.log(
      `  ${result.name.padEnd(25)} ${duration.padStart(10)} ${target.padStart(10)} ${result.status.padStart(12)} ${emoji.padStart(12)}`
    );
  }

  console.log('  ' + '-'.repeat(71));

  // Summary
  const criticalCount = results.filter(r => r.status === 'critical').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const goodCount = results.filter(r => r.status === 'excellent' || r.status === 'good').length;

  console.log(`\n  Summary: ${goodCount} good, ${results.filter(r => r.status === 'acceptable').length} acceptable, ${warningCount} warnings, ${criticalCount} critical`);

  if (criticalCount > 0) {
    console.log('\n  ⚠️  CRITICAL PERFORMANCE ISSUES DETECTED - TEST WILL FAIL');
  }

  console.log('═'.repeat(75) + '\n');
}

async function navigateToPosition(page: Page, position: number): Promise<void> {
  const minimap = page.locator('[data-testid="timeline-minimap"], [data-testid="minimap-container"]').first();
  const box = await minimap.boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width * position, box.y + box.height / 2);
    await page.waitForTimeout(50);
  }
}

async function zoomIn(page: Page): Promise<void> {
  const btn = page.locator('[data-testid="btn-zoom-in"]').first();
  if (await btn.isVisible()) {
    await btn.click();
    await page.waitForTimeout(50);
  }
}

async function zoomOut(page: Page): Promise<void> {
  const btn = page.locator('[data-testid="btn-zoom-out"]').first();
  if (await btn.isVisible()) {
    await btn.click();
    await page.waitForTimeout(50);
  }
}

// ============================================================================
// Tests
// ============================================================================

test.describe('Performance Baseline Tests', () => {
  test.beforeEach(async ({ page }) => {
    skipIfNoCredentials(test);
  });

  test('T99.1: Timeline Load Performance', async ({ page }) => {
    const results: PerformanceResult[] = [];

    // Measure timeline load
    const loadStart = performance.now();
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page, 15000);
    const loadDuration = performance.now() - loadStart;

    results.push({
      name: 'Timeline Load',
      duration: loadDuration,
      baseline: BASELINES.timelineLoad,
      status: evaluatePerformance(loadDuration, BASELINES.timelineLoad),
    });

    // Get FCP from browser
    const fcp = await page.evaluate(() => {
      const entries = performance.getEntriesByType('paint');
      const fcpEntry = entries.find(e => e.name === 'first-contentful-paint');
      return fcpEntry?.startTime || 0;
    });

    if (fcp > 0) {
      results.push({
        name: 'First Contentful Paint',
        duration: fcp,
        baseline: BASELINES.fcp,
        status: evaluatePerformance(fcp, BASELINES.fcp),
      });
    }

    printResults(results);

    // Assert no critical issues
    const critical = results.filter(r => r.status === 'critical');
    expect(critical.length, `Critical performance issues: ${critical.map(r => r.name).join(', ')}`).toBe(0);
  });

  test('T99.2: Zoom Performance', async ({ page }) => {
    const results: PerformanceResult[] = [];

    // Load timeline first
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page, 10000);
    await page.waitForTimeout(300);

    // Navigate to dense region for realistic test
    await navigateToPosition(page, 0.725);
    await page.waitForTimeout(200);

    // Measure zoom in operations
    const zoomInTimes: number[] = [];
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      await zoomIn(page);
      await page.waitForTimeout(100); // Wait for render
      zoomInTimes.push(performance.now() - start);
    }

    const avgZoomIn = zoomInTimes.reduce((a, b) => a + b, 0) / zoomInTimes.length;
    results.push({
      name: 'Zoom In (avg)',
      duration: avgZoomIn * 5, // Total time
      baseline: BASELINES.zoomOperation,
      status: evaluatePerformance(avgZoomIn, BASELINES.zoomOperation),
      iterations: 5,
    });

    // Measure zoom out operations
    const zoomOutTimes: number[] = [];
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      await zoomOut(page);
      await page.waitForTimeout(100);
      zoomOutTimes.push(performance.now() - start);
    }

    const avgZoomOut = zoomOutTimes.reduce((a, b) => a + b, 0) / zoomOutTimes.length;
    results.push({
      name: 'Zoom Out (avg)',
      duration: avgZoomOut * 5,
      baseline: BASELINES.zoomOperation,
      status: evaluatePerformance(avgZoomOut, BASELINES.zoomOperation),
      iterations: 5,
    });

    printResults(results);

    // Assert no critical issues
    const critical = results.filter(r => r.status === 'critical');
    expect(critical.length, `Critical performance issues: ${critical.map(r => r.name).join(', ')}`).toBe(0);
  });

  test('T99.3: Navigation Performance', async ({ page }) => {
    const results: PerformanceResult[] = [];

    // Load timeline
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page, 10000);
    await page.waitForTimeout(300);

    // Measure navigation to different positions
    const positions = [0.2, 0.5, 0.725, 0.9];
    const navTimes: number[] = [];

    for (const pos of positions) {
      const start = performance.now();
      await navigateToPosition(page, pos);
      await page.waitForTimeout(100); // Wait for render
      navTimes.push(performance.now() - start);
    }

    const avgNav = navTimes.reduce((a, b) => a + b, 0) / navTimes.length;
    results.push({
      name: 'Minimap Navigation (avg)',
      duration: avgNav * positions.length,
      baseline: BASELINES.navigation,
      status: evaluatePerformance(avgNav, BASELINES.navigation),
      iterations: positions.length,
    });

    printResults(results);

    // Assert no critical issues
    const critical = results.filter(r => r.status === 'critical');
    expect(critical.length, `Critical performance issues: ${critical.map(r => r.name).join(', ')}`).toBe(0);
  });

  test('T99.4: Pan Performance', async ({ page }) => {
    const results: PerformanceResult[] = [];

    // Load timeline
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page, 10000);
    await page.waitForTimeout(300);

    // Zoom in to make panning visible
    for (let i = 0; i < 5; i++) await zoomIn(page);
    await page.waitForTimeout(200);

    const viewport = page.viewportSize()!;
    const centerX = viewport.width / 2;
    const centerY = viewport.height / 2;

    await page.mouse.move(centerX, centerY);

    // Measure pan operations
    const panTimes: number[] = [];
    for (let i = 0; i < 10; i++) {
      const direction = i % 2 === 0 ? -150 : 150;
      const start = performance.now();
      await page.mouse.wheel(direction, 0);
      await page.waitForTimeout(50);
      panTimes.push(performance.now() - start);
    }

    const avgPan = panTimes.reduce((a, b) => a + b, 0) / panTimes.length;
    results.push({
      name: 'Pan Operation (avg)',
      duration: avgPan * 10,
      baseline: BASELINES.panOperation,
      status: evaluatePerformance(avgPan, BASELINES.panOperation),
      iterations: 10,
    });

    printResults(results);

    // Assert no critical issues
    const critical = results.filter(r => r.status === 'critical');
    expect(critical.length, `Critical performance issues: ${critical.map(r => r.name).join(', ')}`).toBe(0);
  });

  test('T99.5: Mouse Wheel Zoom Out to Overview', async ({ page }) => {
    const results: PerformanceResult[] = [];

    // Load timeline
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page, 10000);
    await page.waitForTimeout(300);

    // Navigate to dense region
    await navigateToPosition(page, 0.725);
    await page.waitForTimeout(200);

    // Zoom in deeply first (to simulate being zoomed in on details)
    console.log('\n📍 Zooming in deeply to simulate detail view...');
    for (let i = 0; i < 10; i++) {
      await zoomIn(page);
    }
    await page.waitForTimeout(300);

    const viewport = page.viewportSize()!;
    const centerX = viewport.width / 2;
    const centerY = viewport.height / 2;
    await page.mouse.move(centerX, centerY);

    // Measure: Zoom out to overview using mouse wheel
    console.log('🔍 Measuring mouse wheel zoom out to overview...');

    const zoomOutTimes: number[] = [];
    const ZOOM_OUT_STEPS = 15; // Enough to get back to full overview

    for (let i = 0; i < ZOOM_OUT_STEPS; i++) {
      const start = performance.now();
      await page.mouse.wheel(0, 150); // Positive Y = zoom out
      await page.waitForTimeout(50); // Small wait for render
      const elapsed = performance.now() - start;
      zoomOutTimes.push(elapsed);

      if (i % 5 === 0) {
        console.log(`  Step ${i + 1}/${ZOOM_OUT_STEPS}: ${elapsed.toFixed(0)}ms`);
      }
    }

    const avgZoomOut = zoomOutTimes.reduce((a, b) => a + b, 0) / zoomOutTimes.length;
    const maxZoomOut = Math.max(...zoomOutTimes);
    const minZoomOut = Math.min(...zoomOutTimes);
    const totalZoomOut = zoomOutTimes.reduce((a, b) => a + b, 0);

    results.push({
      name: 'Mouse Wheel Zoom Out (avg)',
      duration: totalZoomOut,
      baseline: BASELINES.zoomOperation,
      status: evaluatePerformance(avgZoomOut, BASELINES.zoomOperation),
      iterations: ZOOM_OUT_STEPS,
    });

    // Also measure the total time for the full zoom-out sequence
    results.push({
      name: 'Full Zoom-Out Sequence',
      duration: totalZoomOut,
      baseline: {
        target: 2000,      // Target: 2s for full zoom out
        acceptable: 4000,  // Acceptable: 4s
        critical: 8000,    // Critical: 8s
      },
      status: evaluatePerformance(totalZoomOut, {
        target: 2000,
        acceptable: 4000,
        critical: 8000,
      }),
    });

    printResults(results);

    console.log('\n📊 Detailed Zoom-Out Statistics:');
    console.log(`   Average per step: ${avgZoomOut.toFixed(0)}ms`);
    console.log(`   Min step: ${minZoomOut.toFixed(0)}ms`);
    console.log(`   Max step: ${maxZoomOut.toFixed(0)}ms`);
    console.log(`   Total time: ${totalZoomOut.toFixed(0)}ms`);
    console.log(`   Steps: ${ZOOM_OUT_STEPS}`);

    // Assert no critical issues
    const critical = results.filter(r => r.status === 'critical');
    expect(critical.length, `Critical performance issues: ${critical.map(r => r.name).join(', ')}`).toBe(0);
  });

  test('T99.6: Fit All Button (Instant Zoom Reset)', async ({ page }) => {
    const results: PerformanceResult[] = [];

    // Load timeline
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page, 10000);
    await page.waitForTimeout(300);

    // Navigate to dense region and zoom in deeply
    await navigateToPosition(page, 0.725);
    await page.waitForTimeout(200);

    console.log('\n📍 Zooming in deeply...');
    for (let i = 0; i < 12; i++) {
      await zoomIn(page);
    }
    await page.waitForTimeout(300);

    // Measure: Fit All button click
    console.log('🔍 Measuring Fit All button...');

    const fitAllBtn = page.locator('[data-testid="btn-fit-all"]').first();

    const fitAllTimes: number[] = [];
    for (let i = 0; i < 3; i++) {
      // Zoom in again before each test
      if (i > 0) {
        for (let j = 0; j < 8; j++) await zoomIn(page);
        await page.waitForTimeout(200);
      }

      const start = performance.now();
      await fitAllBtn.click();
      await page.waitForTimeout(100); // Wait for render
      const elapsed = performance.now() - start;
      fitAllTimes.push(elapsed);
      console.log(`  Fit All attempt ${i + 1}: ${elapsed.toFixed(0)}ms`);
    }

    const avgFitAll = fitAllTimes.reduce((a, b) => a + b, 0) / fitAllTimes.length;

    results.push({
      name: 'Fit All Button (avg)',
      duration: avgFitAll * 3,
      baseline: {
        target: 200,       // Target: 200ms (should be fast!)
        acceptable: 500,   // Acceptable: 500ms
        critical: 1500,    // Critical: 1.5s
      },
      status: evaluatePerformance(avgFitAll, {
        target: 200,
        acceptable: 500,
        critical: 1500,
      }),
      iterations: 3,
    });

    printResults(results);

    console.log('\n📊 Fit All is the INSTANT alternative to mouse wheel zoom out');
    console.log(`   Average: ${avgFitAll.toFixed(0)}ms vs ~2300ms for mouse wheel`);

    // Assert no critical issues
    const critical = results.filter(r => r.status === 'critical');
    expect(critical.length, `Critical performance issues: ${critical.map(r => r.name).join(', ')}`).toBe(0);
  });

  test('T99.7: Full Performance Baseline (All Operations)', async ({ page }) => {
    const results: PerformanceResult[] = [];

    // 1. Timeline Load
    const loadStart = performance.now();
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page, 15000);
    const loadDuration = performance.now() - loadStart;

    results.push({
      name: 'Timeline Load',
      duration: loadDuration,
      baseline: BASELINES.timelineLoad,
      status: evaluatePerformance(loadDuration, BASELINES.timelineLoad),
    });

    await page.waitForTimeout(300);

    // 2. Navigation
    const navTimes: number[] = [];
    for (const pos of [0.2, 0.5, 0.725, 0.9]) {
      const start = performance.now();
      await navigateToPosition(page, pos);
      await page.waitForTimeout(100);
      navTimes.push(performance.now() - start);
    }
    const avgNav = navTimes.reduce((a, b) => a + b, 0) / navTimes.length;

    results.push({
      name: 'Navigation (avg)',
      duration: avgNav * 4,
      baseline: BASELINES.navigation,
      status: evaluatePerformance(avgNav, BASELINES.navigation),
      iterations: 4,
    });

    // 3. Zoom (at dense region)
    await navigateToPosition(page, 0.725);
    await page.waitForTimeout(200);

    const zoomTimes: number[] = [];
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      await zoomIn(page);
      await page.waitForTimeout(100);
      zoomTimes.push(performance.now() - start);
    }
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      await zoomOut(page);
      await page.waitForTimeout(100);
      zoomTimes.push(performance.now() - start);
    }
    const avgZoom = zoomTimes.reduce((a, b) => a + b, 0) / zoomTimes.length;

    results.push({
      name: 'Zoom (avg)',
      duration: avgZoom * 10,
      baseline: BASELINES.zoomOperation,
      status: evaluatePerformance(avgZoom, BASELINES.zoomOperation),
      iterations: 10,
    });

    // 4. Pan
    await zoomIn(page);
    await zoomIn(page);
    await zoomIn(page);
    await page.waitForTimeout(200);

    const viewport = page.viewportSize()!;
    await page.mouse.move(viewport.width / 2, viewport.height / 2);

    const panTimes: number[] = [];
    for (let i = 0; i < 10; i++) {
      const direction = i % 2 === 0 ? -150 : 150;
      const start = performance.now();
      await page.mouse.wheel(direction, 0);
      await page.waitForTimeout(50);
      panTimes.push(performance.now() - start);
    }
    const avgPan = panTimes.reduce((a, b) => a + b, 0) / panTimes.length;

    results.push({
      name: 'Pan (avg)',
      duration: avgPan * 10,
      baseline: BASELINES.panOperation,
      status: evaluatePerformance(avgPan, BASELINES.panOperation),
      iterations: 10,
    });

    // 5. FCP
    const fcp = await page.evaluate(() => {
      const entries = performance.getEntriesByType('paint');
      const fcpEntry = entries.find(e => e.name === 'first-contentful-paint');
      return fcpEntry?.startTime || 0;
    });

    if (fcp > 0) {
      results.push({
        name: 'First Contentful Paint',
        duration: fcp,
        baseline: BASELINES.fcp,
        status: evaluatePerformance(fcp, BASELINES.fcp),
      });
    }

    printResults(results);

    // Summary stats
    const excellent = results.filter(r => r.status === 'excellent').length;
    const good = results.filter(r => r.status === 'good').length;
    const acceptable = results.filter(r => r.status === 'acceptable').length;
    const warning = results.filter(r => r.status === 'warning').length;
    const critical = results.filter(r => r.status === 'critical');

    console.log('\n📊 PERFORMANCE SCORECARD');
    console.log(`   Excellent: ${excellent}  Good: ${good}  Acceptable: ${acceptable}  Warning: ${warning}  Critical: ${critical.length}`);

    // Calculate overall score (weighted)
    const weights = { excellent: 100, good: 80, acceptable: 60, warning: 30, critical: 0 };
    const totalScore = results.reduce((sum, r) => sum + weights[r.status], 0);
    const maxScore = results.length * 100;
    const percentage = Math.round((totalScore / maxScore) * 100);

    console.log(`\n   Overall Score: ${percentage}%`);
    if (percentage >= 80) console.log('   Rating: ⭐⭐⭐⭐⭐ Excellent');
    else if (percentage >= 60) console.log('   Rating: ⭐⭐⭐⭐ Good');
    else if (percentage >= 40) console.log('   Rating: ⭐⭐⭐ Acceptable');
    else if (percentage >= 20) console.log('   Rating: ⭐⭐ Needs Work');
    else console.log('   Rating: ⭐ Critical');

    // Assert no critical issues
    expect(critical.length, `Critical performance issues: ${critical.map(r => r.name).join(', ')}`).toBe(0);
  });
});
