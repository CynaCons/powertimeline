/**
 * ============================================================================
 * PERFORMANCE PROFILING TESTS (T98)
 * ============================================================================
 *
 * PURPOSE:
 * These tests capture DEEP performance data using Chrome DevTools Protocol (CDP).
 * They generate CPU profiles that can be loaded into Chrome DevTools for
 * flame chart analysis. Use these for:
 * - Investigating performance bottlenecks
 * - Finding slow functions
 * - Understanding where time is spent during operations
 *
 * HOW IT WORKS:
 * 1. Test starts CDP profiling session
 * 2. Performs operations (zoom, pan, navigate, etc.)
 * 3. Stops profiling and captures CPU profile
 * 4. Generates human-readable summary in console
 * 5. Saves .cpuprofile file for Chrome DevTools analysis
 *
 * QUICK START:
 * ```bash
 * # Run all profiling tests
 * npm test -- tests/performance/98-performance-profiling.spec.ts --project=desktop
 *
 * # Run specific profiling test
 * npm test -- tests/performance/ --grep "T98.8" --project=desktop
 *
 * # Run with verbose output
 * npm test -- tests/performance/98-performance-profiling.spec.ts --project=desktop --reporter=list
 * ```
 *
 * TEST INVENTORY:
 * - T98.1: Profile initial timeline load
 * - T98.2: Profile zoom operations (button clicks)
 * - T98.3: Profile mouse wheel zoom (rapid)
 * - T98.4: Profile pan operations
 * - T98.5: Profile minimap navigation
 * - T98.6: Profile dense region stress test
 * - T98.7: Profile card interactions (hover, click)
 * - T98.8: Full stress test (all operations combined) ← RECOMMENDED
 *
 * OUTPUT FILES (in test-results/performance/):
 * - *.json: Human-readable report with metrics and top functions
 * - *.cpuprofile: Chrome DevTools CPU profile (flame chart)
 *
 * HOW TO ANALYZE .cpuprofile FILES:
 * 1. Open Chrome DevTools (F12)
 * 2. Go to "Performance" tab
 * 3. Click ⚙️ (settings) → "Load profile..."
 * 4. Select the .cpuprofile file
 * 5. Analyze the flame chart to find bottlenecks
 *
 * CONSOLE OUTPUT FORMAT:
 * ```
 * ======================================================================
 * PERFORMANCE REPORT: T98.8 Full Stress Test
 * ======================================================================
 *
 * ### WARNINGS ###
 *   [!] 12 long tasks detected (>50ms)
 *   [!] 8 slow functions detected (>100ms self-time)
 *
 * ### TIME BY CATEGORY ###
 *   Zoom                   9497.3ms ████████████████████████████████████████
 *   Paint                  3384.0ms ████████████████████████████████████████
 *   ...
 *
 * ### TOP FUNCTIONS BY SELF-TIME ###
 *   Function                             Self Time Source
 *   ------------------------------------------------------------------
 *   (garbage collector)                    230.7ms (native)
 *   getTrueOffsetParent                    192.9ms chunk-UHLY45NC.js
 *   ...
 * ```
 *
 * WHEN TO USE WHICH TEST FILE:
 * - Use T98 (this file) when you need to INVESTIGATE why something is slow
 * - Use T99 (baseline tests) for quick PASS/FAIL regression checks
 *
 * RELATED FILES:
 * - 99-performance-baseline.spec.ts: Pass/fail baseline tests
 * - test-results/performance/: Output directory for profiles
 *
 * ============================================================================
 */

import { test, expect, type Page, type CDPSession } from '@playwright/test';
import { loadTimeline, waitForEditorLoaded, skipIfNoCredentials } from '../utils/timelineTestUtils';
import * as fs from 'fs';
import * as path from 'path';

const TEST_OWNER_USERNAME = 'cynacons';
const TEST_TIMELINE_ID = 'french-revolution';

// ============================================================================
// Type Definitions
// ============================================================================

interface PerformanceMetric {
  name: string;
  startTime: number;
  duration: number;
  category: string;
}

interface ProfileSummary {
  totalTime: number;
  selfTime: number;
  functionName: string;
  url: string;
  lineNumber: number;
}

interface PerformanceReport {
  testName: string;
  timestamp: string;
  metrics: PerformanceMetric[];
  summary: {
    totalDuration: number;
    categories: Record<string, number>;
    topFunctions: ProfileSummary[];
    warnings: string[];
  };
}

// ============================================================================
// CDP Profiling Utilities
// ============================================================================

/**
 * Start CDP profiling session
 */
async function startProfiling(page: Page): Promise<CDPSession> {
  const client = await page.context().newCDPSession(page);

  // Enable profiling
  await client.send('Profiler.enable');
  await client.send('Profiler.setSamplingInterval', { interval: 100 }); // 100 microseconds

  // Enable performance timeline
  await client.send('Performance.enable');

  // Start CPU profiling
  await client.send('Profiler.start');

  console.log('CDP Profiling started');
  return client;
}

/**
 * Stop profiling and return results
 */
async function stopProfiling(client: CDPSession): Promise<{
  profile: any;
  metrics: any;
}> {
  // Stop CPU profiling
  const { profile } = await client.send('Profiler.stop');

  // Get performance metrics
  const { metrics } = await client.send('Performance.getMetrics');

  await client.send('Profiler.disable');
  await client.send('Performance.disable');

  console.log('CDP Profiling stopped');
  return { profile, metrics };
}

/**
 * Parse CPU profile and extract top functions by self-time
 */
function parseProfile(profile: any): ProfileSummary[] {
  const nodes = profile.nodes || [];
  const samples = profile.samples || [];
  const timeDeltas = profile.timeDeltas || [];

  // Build node map
  const nodeMap = new Map<number, any>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  // Calculate time per node
  const nodeTime = new Map<number, number>();
  for (let i = 0; i < samples.length; i++) {
    const nodeId = samples[i];
    const delta = timeDeltas[i] || 0;
    nodeTime.set(nodeId, (nodeTime.get(nodeId) || 0) + delta);
  }

  // Build summaries
  const summaries: ProfileSummary[] = [];
  for (const [nodeId, time] of nodeTime.entries()) {
    const node = nodeMap.get(nodeId);
    if (!node || !node.callFrame) continue;

    const { functionName, url, lineNumber } = node.callFrame;

    // Skip idle and program nodes
    if (functionName === '(idle)' || functionName === '(program)') continue;

    summaries.push({
      functionName: functionName || '(anonymous)',
      url: url || '',
      lineNumber: lineNumber || 0,
      selfTime: time / 1000, // Convert to ms
      totalTime: time / 1000, // Simplified - would need tree traversal for accurate total
    });
  }

  // Sort by self time descending
  summaries.sort((a, b) => b.selfTime - a.selfTime);

  return summaries.slice(0, 20); // Top 20
}

/**
 * Generate human-readable performance report
 */
function generateReport(
  testName: string,
  profile: any,
  cdpMetrics: any[],
  customMetrics: PerformanceMetric[]
): PerformanceReport {
  const topFunctions = parseProfile(profile);

  // Calculate category totals from custom metrics
  const categories: Record<string, number> = {};
  let totalDuration = 0;

  for (const metric of customMetrics) {
    categories[metric.category] = (categories[metric.category] || 0) + metric.duration;
    totalDuration += metric.duration;
  }

  // Generate warnings
  const warnings: string[] = [];

  // Check for long tasks (> 50ms)
  const longTasks = customMetrics.filter(m => m.duration > 50);
  if (longTasks.length > 0) {
    warnings.push(`${longTasks.length} long tasks detected (>50ms)`);
  }

  // Check for slow functions
  const slowFunctions = topFunctions.filter(f => f.selfTime > 100);
  if (slowFunctions.length > 0) {
    warnings.push(`${slowFunctions.length} slow functions detected (>100ms self-time)`);
  }

  return {
    testName,
    timestamp: new Date().toISOString(),
    metrics: customMetrics,
    summary: {
      totalDuration,
      categories,
      topFunctions,
      warnings,
    },
  };
}

/**
 * Print report to console in human-readable format
 */
function printReport(report: PerformanceReport): void {
  console.log('\n' + '='.repeat(70));
  console.log(`PERFORMANCE REPORT: ${report.testName}`);
  console.log(`Timestamp: ${report.timestamp}`);
  console.log('='.repeat(70));

  // Warnings
  if (report.summary.warnings.length > 0) {
    console.log('\n### WARNINGS ###');
    for (const warning of report.summary.warnings) {
      console.log(`  [!] ${warning}`);
    }
  }

  // Category breakdown
  console.log('\n### TIME BY CATEGORY ###');
  const sortedCategories = Object.entries(report.summary.categories)
    .sort(([, a], [, b]) => b - a);

  for (const [category, time] of sortedCategories) {
    const bar = '█'.repeat(Math.min(40, Math.floor(time / 10)));
    console.log(`  ${category.padEnd(20)} ${time.toFixed(1).padStart(8)}ms ${bar}`);
  }

  // Top functions
  console.log('\n### TOP FUNCTIONS BY SELF-TIME ###');
  console.log('  ' + '-'.repeat(66));
  console.log(`  ${'Function'.padEnd(35)} ${'Self Time'.padStart(10)} ${'Source'.padEnd(20)}`);
  console.log('  ' + '-'.repeat(66));

  for (const func of report.summary.topFunctions.slice(0, 15)) {
    const name = func.functionName.slice(0, 33).padEnd(35);
    const time = `${func.selfTime.toFixed(1)}ms`.padStart(10);
    const source = func.url ?
      `${path.basename(func.url)}:${func.lineNumber}`.slice(0, 20) :
      '(native)';
    console.log(`  ${name} ${time} ${source}`);
  }

  // Individual metrics
  if (report.metrics.length > 0) {
    console.log('\n### DETAILED METRICS ###');
    console.log('  ' + '-'.repeat(66));

    for (const metric of report.metrics.sort((a, b) => b.duration - a.duration)) {
      if (metric.duration > 5) { // Only show metrics > 5ms
        const bar = '▓'.repeat(Math.min(30, Math.floor(metric.duration / 5)));
        console.log(`  ${metric.name.padEnd(30)} ${metric.duration.toFixed(1).padStart(8)}ms ${bar}`);
      }
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`TOTAL MEASURED TIME: ${report.summary.totalDuration.toFixed(1)}ms`);
  console.log('='.repeat(70) + '\n');
}

/**
 * Save report to file
 */
async function saveReport(report: PerformanceReport, profile: any): Promise<void> {
  const outputDir = 'test-results/performance';

  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const baseName = report.testName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // Save JSON report
  const jsonPath = path.join(outputDir, `${baseName}-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  console.log(`Report saved: ${jsonPath}`);

  // Save CPU profile (can be loaded in Chrome DevTools)
  const profilePath = path.join(outputDir, `${baseName}-${timestamp}.cpuprofile`);
  fs.writeFileSync(profilePath, JSON.stringify(profile));
  console.log(`CPU Profile saved: ${profilePath}`);
  console.log(`  → Open in Chrome DevTools: Performance tab → Load profile`);
}

// ============================================================================
// Performance Measurement Helpers
// ============================================================================

/**
 * Measure an operation and return its duration
 */
async function measureOperation(
  page: Page,
  name: string,
  category: string,
  operation: () => Promise<void>
): Promise<PerformanceMetric> {
  const startTime = performance.now();
  await operation();
  const duration = performance.now() - startTime;

  return { name, startTime, duration, category };
}

/**
 * Get browser-side performance metrics
 */
async function getBrowserMetrics(page: Page): Promise<PerformanceMetric[]> {
  return await page.evaluate(() => {
    const metrics: Array<{ name: string; startTime: number; duration: number; category: string }> = [];

    // Get paint timing
    const paintEntries = performance.getEntriesByType('paint');
    for (const entry of paintEntries) {
      metrics.push({
        name: entry.name,
        startTime: entry.startTime,
        duration: entry.duration || entry.startTime,
        category: 'Paint',
      });
    }

    // Get navigation timing
    const navEntries = performance.getEntriesByType('navigation');
    for (const entry of navEntries as PerformanceNavigationTiming[]) {
      metrics.push({
        name: 'DOM Content Loaded',
        startTime: entry.domContentLoadedEventStart,
        duration: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
        category: 'Navigation',
      });
      metrics.push({
        name: 'DOM Interactive',
        startTime: entry.domInteractive,
        duration: 0,
        category: 'Navigation',
      });
      metrics.push({
        name: 'Load Event',
        startTime: entry.loadEventStart,
        duration: entry.loadEventEnd - entry.loadEventStart,
        category: 'Navigation',
      });
    }

    // Get long tasks if available
    const longTasks = performance.getEntriesByType('longtask');
    for (const task of longTasks) {
      metrics.push({
        name: `Long Task`,
        startTime: task.startTime,
        duration: task.duration,
        category: 'Long Task',
      });
    }

    return metrics;
  });
}

// ============================================================================
// Navigation Helpers (from T97)
// ============================================================================

async function navigateToPosition(page: Page, normalizedPosition: number): Promise<void> {
  const minimap = page.locator('[data-testid="timeline-minimap"], [data-testid="minimap-container"]').first();
  const box = await minimap.boundingBox();

  if (!box) {
    throw new Error('Minimap not found');
  }

  const x = box.x + box.width * normalizedPosition;
  await page.mouse.click(x, box.y + box.height / 2);
  await page.waitForTimeout(100);
}

async function zoomIn(page: Page, times: number): Promise<void> {
  const zoomInBtn = page.locator('[data-testid="btn-zoom-in"]').first();
  for (let i = 0; i < times; i++) {
    if (await zoomInBtn.isVisible()) {
      await zoomInBtn.click();
      await page.waitForTimeout(100);
    }
  }
}

async function zoomOut(page: Page, times: number): Promise<void> {
  const zoomOutBtn = page.locator('[data-testid="btn-zoom-out"]').first();
  for (let i = 0; i < times; i++) {
    if (await zoomOutBtn.isVisible()) {
      await zoomOutBtn.click();
      await page.waitForTimeout(100);
    }
  }
}

// ============================================================================
// Tests
// ============================================================================

test.describe('Performance Profiling Tests', () => {
  // CDP profiling only works with Chromium - skip on WebKit/Firefox
  test.skip(({ browserName }) => browserName !== 'chromium', 'CDP profiling requires Chromium');

  test.beforeEach(async ({ page }) => {
    skipIfNoCredentials(test);
  });

  test('T98.1: Profile initial timeline load', async ({ page }) => {
    const metrics: PerformanceMetric[] = [];

    // Start profiling before navigation
    const client = await startProfiling(page);

    // Measure page load
    const loadMetric = await measureOperation(page, 'Timeline Load', 'Load', async () => {
      await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
      await waitForEditorLoaded(page, 15000);
    });
    metrics.push(loadMetric);

    // Wait for settle
    await page.waitForTimeout(500);

    // Get browser metrics
    const browserMetrics = await getBrowserMetrics(page);
    metrics.push(...browserMetrics);

    // Stop profiling
    const { profile, metrics: cdpMetrics } = await stopProfiling(client);

    // Generate and print report
    const report = generateReport('T98.1 Initial Load', profile, cdpMetrics, metrics);
    printReport(report);
    await saveReport(report, profile);

    // Basic assertion
    expect(loadMetric.duration, 'Timeline should load within 10s').toBeLessThan(10000);
  });

  test('T98.2: Profile zoom operations', async ({ page }) => {
    const metrics: PerformanceMetric[] = [];

    // Load timeline first
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page, 10000);
    await page.waitForTimeout(300);

    // Navigate to dense region
    await navigateToPosition(page, 0.725);
    await page.waitForTimeout(200);

    // Start profiling
    const client = await startProfiling(page);

    // Profile zoom in operations
    for (let i = 0; i < 5; i++) {
      const metric = await measureOperation(page, `Zoom In ${i + 1}`, 'Zoom', async () => {
        await zoomIn(page, 1);
      });
      metrics.push(metric);
    }

    // Profile zoom out operations
    for (let i = 0; i < 5; i++) {
      const metric = await measureOperation(page, `Zoom Out ${i + 1}`, 'Zoom', async () => {
        await zoomOut(page, 1);
      });
      metrics.push(metric);
    }

    // Stop profiling
    const { profile, metrics: cdpMetrics } = await stopProfiling(client);

    // Generate and print report
    const report = generateReport('T98.2 Zoom Operations', profile, cdpMetrics, metrics);
    printReport(report);
    await saveReport(report, profile);

    // Calculate average zoom time
    const avgZoomTime = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
    console.log(`Average zoom operation: ${avgZoomTime.toFixed(1)}ms`);

    // These are profiling tests, not regression gates - use generous thresholds
    // The real value is in the reports, not the pass/fail
    expect(avgZoomTime, 'Average zoom should complete (sanity check)').toBeLessThan(5000);
  });

  test('T98.3: Profile mouse wheel zoom (rapid)', async ({ page }) => {
    const metrics: PerformanceMetric[] = [];

    // Load timeline
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page, 10000);
    await page.waitForTimeout(300);

    // Navigate to dense region
    await navigateToPosition(page, 0.725);
    await page.waitForTimeout(200);

    const viewport = page.viewportSize()!;
    const centerX = viewport.width / 2;
    const centerY = viewport.height / 2;

    // Start profiling
    const client = await startProfiling(page);

    // Position cursor
    await page.mouse.move(centerX, centerY);

    // Rapid mouse wheel zoom in
    const zoomInMetric = await measureOperation(page, 'Mouse Wheel Zoom In (10x)', 'Zoom', async () => {
      for (let i = 0; i < 10; i++) {
        await page.mouse.wheel(0, -120);
        await page.waitForTimeout(50);
      }
    });
    metrics.push(zoomInMetric);

    await page.waitForTimeout(300);

    // Rapid mouse wheel zoom out
    const zoomOutMetric = await measureOperation(page, 'Mouse Wheel Zoom Out (10x)', 'Zoom', async () => {
      for (let i = 0; i < 10; i++) {
        await page.mouse.wheel(0, 120);
        await page.waitForTimeout(50);
      }
    });
    metrics.push(zoomOutMetric);

    // Stop profiling
    const { profile, metrics: cdpMetrics } = await stopProfiling(client);

    // Generate and print report
    const report = generateReport('T98.3 Mouse Wheel Zoom', profile, cdpMetrics, metrics);
    printReport(report);
    await saveReport(report, profile);

    // Profiling test - generous threshold
    expect(zoomInMetric.duration, 'Zoom in sequence sanity check').toBeLessThan(30000);
  });

  test('T98.4: Profile pan operations', async ({ page }) => {
    const metrics: PerformanceMetric[] = [];

    // Load timeline
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page, 10000);
    await page.waitForTimeout(300);

    // Zoom in to enable visible panning
    await zoomIn(page, 5);
    await page.waitForTimeout(200);

    const viewport = page.viewportSize()!;
    const centerX = viewport.width / 2;
    const centerY = viewport.height / 2;

    // Start profiling
    const client = await startProfiling(page);

    // Pan left via mouse wheel
    const panLeftMetric = await measureOperation(page, 'Pan Left (5x)', 'Pan', async () => {
      await page.mouse.move(centerX, centerY);
      for (let i = 0; i < 5; i++) {
        await page.mouse.wheel(-200, 0);
        await page.waitForTimeout(100);
      }
    });
    metrics.push(panLeftMetric);

    // Pan right via mouse wheel
    const panRightMetric = await measureOperation(page, 'Pan Right (5x)', 'Pan', async () => {
      await page.mouse.move(centerX, centerY);
      for (let i = 0; i < 5; i++) {
        await page.mouse.wheel(200, 0);
        await page.waitForTimeout(100);
      }
    });
    metrics.push(panRightMetric);

    // Pan via button clicks
    const panBtnLeftMetric = await measureOperation(page, 'Pan Button Left (3x)', 'Pan', async () => {
      const panLeftBtn = page.locator('[data-testid="btn-pan-left"]').first();
      for (let i = 0; i < 3; i++) {
        if (await panLeftBtn.isVisible()) {
          await panLeftBtn.click();
          await page.waitForTimeout(100);
        }
      }
    });
    metrics.push(panBtnLeftMetric);

    const panBtnRightMetric = await measureOperation(page, 'Pan Button Right (3x)', 'Pan', async () => {
      const panRightBtn = page.locator('[data-testid="btn-pan-right"]').first();
      for (let i = 0; i < 3; i++) {
        if (await panRightBtn.isVisible()) {
          await panRightBtn.click();
          await page.waitForTimeout(100);
        }
      }
    });
    metrics.push(panBtnRightMetric);

    // Stop profiling
    const { profile, metrics: cdpMetrics } = await stopProfiling(client);

    // Generate and print report
    const report = generateReport('T98.4 Pan Operations', profile, cdpMetrics, metrics);
    printReport(report);
    await saveReport(report, profile);

    const totalPanTime = metrics.reduce((sum, m) => sum + m.duration, 0);
    console.log(`Total pan time: ${totalPanTime.toFixed(1)}ms`);
    // Profiling test - generous threshold
    expect(totalPanTime, 'Pan operations sanity check').toBeLessThan(60000);
  });

  test('T98.5: Profile minimap navigation', async ({ page }) => {
    const metrics: PerformanceMetric[] = [];

    // Load timeline
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page, 10000);
    await page.waitForTimeout(300);

    // Start profiling
    const client = await startProfiling(page);

    // Navigate to different positions on minimap
    const positions = [0.1, 0.3, 0.5, 0.7, 0.9, 0.725]; // Include dense region

    for (const pos of positions) {
      const metric = await measureOperation(page, `Navigate to ${(pos * 100).toFixed(0)}%`, 'Navigation', async () => {
        await navigateToPosition(page, pos);
      });
      metrics.push(metric);
    }

    // Stop profiling
    const { profile, metrics: cdpMetrics } = await stopProfiling(client);

    // Generate and print report
    const report = generateReport('T98.5 Minimap Navigation', profile, cdpMetrics, metrics);
    printReport(report);
    await saveReport(report, profile);

    const avgNavTime = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
    console.log(`Average navigation time: ${avgNavTime.toFixed(1)}ms`);

    // Profiling test - generous threshold
    expect(avgNavTime, 'Navigation sanity check').toBeLessThan(10000);
  });

  test('T98.6: Profile dense region stress test', async ({ page }) => {
    const metrics: PerformanceMetric[] = [];

    // Load timeline
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page, 10000);
    await page.waitForTimeout(300);

    // Start profiling
    const client = await startProfiling(page);

    // Navigate to dense region (1793 - The Terror)
    const navMetric = await measureOperation(page, 'Navigate to Dense Region', 'Navigation', async () => {
      await navigateToPosition(page, 0.725);
    });
    metrics.push(navMetric);

    // Zoom in while in dense region
    const zoomDenseMetric = await measureOperation(page, 'Zoom In Dense Region (8x)', 'Zoom', async () => {
      for (let i = 0; i < 8; i++) {
        await zoomIn(page, 1);
      }
    });
    metrics.push(zoomDenseMetric);

    // Pan through dense region
    const viewport = page.viewportSize()!;
    const centerX = viewport.width / 2;
    const centerY = viewport.height / 2;

    const panDenseMetric = await measureOperation(page, 'Pan Through Dense Region', 'Pan', async () => {
      await page.mouse.move(centerX, centerY);
      for (let i = 0; i < 10; i++) {
        const direction = i % 2 === 0 ? -150 : 150;
        await page.mouse.wheel(direction, 0);
        await page.waitForTimeout(50);
      }
    });
    metrics.push(panDenseMetric);

    // Rapid zoom in/out cycle in dense region
    const zoomCycleMetric = await measureOperation(page, 'Rapid Zoom Cycle (5 in/out)', 'Zoom', async () => {
      for (let i = 0; i < 5; i++) {
        await page.mouse.wheel(0, -100);
        await page.waitForTimeout(30);
        await page.mouse.wheel(0, 100);
        await page.waitForTimeout(30);
      }
    });
    metrics.push(zoomCycleMetric);

    // Stop profiling
    const { profile, metrics: cdpMetrics } = await stopProfiling(client);

    // Generate and print report
    const report = generateReport('T98.6 Dense Region Stress', profile, cdpMetrics, metrics);
    printReport(report);
    await saveReport(report, profile);

    // Profiling test - generous threshold
    expect(zoomDenseMetric.duration, 'Dense region zoom sanity check').toBeLessThan(60000);
  });

  test('T98.7: Profile card interactions', async ({ page }) => {
    const metrics: PerformanceMetric[] = [];

    // Load timeline
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
    await waitForEditorLoaded(page, 10000);
    await page.waitForTimeout(300);

    // Navigate to position with visible cards
    await navigateToPosition(page, 0.5);
    await zoomIn(page, 4);
    await page.waitForTimeout(300);

    // Start profiling
    const client = await startProfiling(page);

    // Find event cards
    const cards = page.locator('[data-testid*="event-card"]');
    const cardCount = await cards.count();
    console.log(`Found ${cardCount} event cards`);

    if (cardCount > 0) {
      // Hover over cards
      const hoverMetric = await measureOperation(page, 'Card Hover (5 cards)', 'Interaction', async () => {
        for (let i = 0; i < Math.min(5, cardCount); i++) {
          const card = cards.nth(i);
          await card.hover();
          await page.waitForTimeout(50);
        }
      });
      metrics.push(hoverMetric);

      // Click a card
      const clickMetric = await measureOperation(page, 'Card Click', 'Interaction', async () => {
        const firstCard = cards.first();
        await firstCard.click();
        await page.waitForTimeout(100);
      });
      metrics.push(clickMetric);
    }

    // Stop profiling
    const { profile, metrics: cdpMetrics } = await stopProfiling(client);

    // Generate and print report
    const report = generateReport('T98.7 Card Interactions', profile, cdpMetrics, metrics);
    printReport(report);
    await saveReport(report, profile);

    expect(cardCount, 'Should find cards to interact with').toBeGreaterThan(0);
  });

  test('T98.8: Full stress test (combined operations)', async ({ page }) => {
    const metrics: PerformanceMetric[] = [];

    // Start profiling from the beginning
    const client = await startProfiling(page);

    // 1. Initial load
    const loadMetric = await measureOperation(page, 'Initial Load', 'Load', async () => {
      await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID, false);
      await waitForEditorLoaded(page, 15000);
    });
    metrics.push(loadMetric);

    // 2. Navigate across timeline
    const positions = [0.2, 0.5, 0.725, 0.9, 0.1];
    for (const pos of positions) {
      const metric = await measureOperation(page, `Nav to ${(pos * 100).toFixed(0)}%`, 'Navigation', async () => {
        await navigateToPosition(page, pos);
      });
      metrics.push(metric);
    }

    // 3. Zoom operations at dense region
    await navigateToPosition(page, 0.725);

    const zoomInMetric = await measureOperation(page, 'Zoom In (10x)', 'Zoom', async () => {
      for (let i = 0; i < 10; i++) {
        await zoomIn(page, 1);
      }
    });
    metrics.push(zoomInMetric);

    const zoomOutMetric = await measureOperation(page, 'Zoom Out (10x)', 'Zoom', async () => {
      for (let i = 0; i < 10; i++) {
        await zoomOut(page, 1);
      }
    });
    metrics.push(zoomOutMetric);

    // 4. Pan operations
    const viewport = page.viewportSize()!;
    const centerX = viewport.width / 2;
    const centerY = viewport.height / 2;

    await zoomIn(page, 5);

    const panMetric = await measureOperation(page, 'Pan Left/Right (10x)', 'Pan', async () => {
      await page.mouse.move(centerX, centerY);
      for (let i = 0; i < 10; i++) {
        const direction = i % 2 === 0 ? -200 : 200;
        await page.mouse.wheel(direction, 0);
        await page.waitForTimeout(50);
      }
    });
    metrics.push(panMetric);

    // 5. Mouse wheel rapid zoom
    const wheelZoomMetric = await measureOperation(page, 'Mouse Wheel Zoom (20x)', 'Zoom', async () => {
      for (let i = 0; i < 20; i++) {
        const direction = i % 2 === 0 ? -100 : 100;
        await page.mouse.wheel(0, direction);
        await page.waitForTimeout(30);
      }
    });
    metrics.push(wheelZoomMetric);

    // Get browser metrics
    const browserMetrics = await getBrowserMetrics(page);
    metrics.push(...browserMetrics);

    // Stop profiling
    const { profile, metrics: cdpMetrics } = await stopProfiling(client);

    // Generate and print report
    const report = generateReport('T98.8 Full Stress Test', profile, cdpMetrics, metrics);
    printReport(report);
    await saveReport(report, profile);

    // Summary assertions
    const totalTime = metrics.reduce((sum, m) => sum + m.duration, 0);
    console.log(`\nTotal test time: ${totalTime.toFixed(1)}ms`);

    // Profiling test - generous threshold (2 minutes)
    expect(totalTime, 'Full stress test sanity check').toBeLessThan(120000);
  });
});
