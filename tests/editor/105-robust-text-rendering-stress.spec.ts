import { test, expect } from '@playwright/test';
import { loginAsTestUser, loadTestTimeline } from '../utils/timelineTestUtils';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test 105: Robust Text Rendering Stress Test
 *
 * Comprehensive "chaos testing" for text rendering that simulates realistic user behavior.
 * Uses progressive zoom, shift-scroll panning, and random interactions to detect issues
 * that static snapshot tests might miss.
 *
 * Pattern: Editor Robustness Test Template
 * - Navigate to dense area
 * - Progressive zoom to target
 * - Multi-step verification at each interaction
 * - Shift-scroll panning stress
 * - Round-trip coherency check
 * - Random zoom sequence (chaos test)
 * - Comprehensive reporting
 *
 * @requirement CC-REQ-CARDS-TEXT-001 - Card text must not clip or overflow
 */

interface StepResult {
  stepName: string;
  timestamp: number;
  cardCount: number;
  violations: {
    clipping: any[];
    viewport: any[];
    minimap: any[];
  };
  passed: boolean;
}

/**
 * Verify no text extends beyond card boundaries
 */
async function verifyNoTextClipping(page: any): Promise<{ violations: any[], summary: string }> {
  const violations = await page.evaluate(() => {
    const cards = document.querySelectorAll('[data-testid="event-card"]');
    const issues: any[] = [];

    cards.forEach((card, idx) => {
      const cardRect = card.getBoundingClientRect();
      const cardType = card.getAttribute('data-card-type');
      const cardId = card.getAttribute('data-event-id');

      const titleEl = card.querySelector('.card-title');
      const descEl = card.querySelector('.card-description');

      // Check if text elements extend beyond card bounds (1px tolerance)
      if (titleEl) {
        const titleRect = titleEl.getBoundingClientRect();
        const overflowY = titleRect.bottom - cardRect.bottom;
        if (overflowY > 1) {
          issues.push({
            cardIndex: idx,
            cardType,
            cardId,
            element: 'title',
            overflowY: Math.round(overflowY),
            text: titleEl.textContent?.substring(0, 50) || ''
          });
        }
      }

      if (descEl) {
        const descRect = descEl.getBoundingClientRect();
        const overflowY = descRect.bottom - cardRect.bottom;
        if (overflowY > 1) {
          issues.push({
            cardIndex: idx,
            cardType,
            cardId,
            element: 'description',
            overflowY: Math.round(overflowY),
            text: descEl.textContent?.substring(0, 50) || ''
          });
        }
      }
    });

    return issues;
  });

  const summary = violations.length === 0
    ? '✅ No text clipping'
    : `❌ ${violations.length} text clipping violations`;

  return { violations, summary };
}

/**
 * Verify all cards are within viewport bounds
 */
async function verifyCardsInViewport(page: any): Promise<{ violations: any[], summary: string }> {
  const viewportHeight = await page.evaluate(() => window.innerHeight);

  const violations = await page.evaluate((vh: number) => {
    const cards = document.querySelectorAll('[data-testid="event-card"]');
    const issues: any[] = [];

    cards.forEach((card, idx) => {
      const cardRect = card.getBoundingClientRect();
      const cardType = card.getAttribute('data-card-type');

      // Allow 100px tolerance for partial visibility during zoom transitions
      const extendsAbove = cardRect.top < -100;
      const extendsBelow = cardRect.bottom > vh + 100;

      if (extendsAbove || extendsBelow) {
        issues.push({
          cardIndex: idx,
          cardType,
          top: Math.round(cardRect.top),
          bottom: Math.round(cardRect.bottom),
          extendsAbove,
          extendsBelow,
          overflowAmount: extendsAbove
            ? Math.round(Math.abs(cardRect.top) - 100)
            : Math.round(cardRect.bottom - vh - 100)
        });
      }
    });

    return issues;
  }, viewportHeight);

  const summary = violations.length === 0
    ? '✅ All cards in viewport'
    : `❌ ${violations.length} cards outside viewport`;

  return { violations, summary };
}

/**
 * Verify no cards overlap with minimap (top 100px safe zone)
 */
async function verifyNoCardsUnderMinimap(page: any): Promise<{ violations: any[], summary: string }> {
  const violations = await page.evaluate(() => {
    const cards = document.querySelectorAll('[data-testid="event-card"]');
    const issues: any[] = [];
    const minimapSafeZone = 100; // Top 100px reserved for minimap

    cards.forEach((card, idx) => {
      const cardRect = card.getBoundingClientRect();
      const cardType = card.getAttribute('data-card-type');

      if (cardRect.top < minimapSafeZone) {
        issues.push({
          cardIndex: idx,
          cardType,
          top: Math.round(cardRect.top),
          intrusion: Math.round(minimapSafeZone - cardRect.top)
        });
      }
    });

    return issues;
  });

  const summary = violations.length === 0
    ? '✅ No minimap overlap'
    : `❌ ${violations.length} cards under minimap`;

  return { violations, summary };
}

/**
 * Run all verification checks at a given step
 */
async function performAllChecks(page: any, stepName: string): Promise<StepResult> {
  const clipping = await verifyNoTextClipping(page);
  const viewport = await verifyCardsInViewport(page);
  const minimap = await verifyNoCardsUnderMinimap(page);

  const cardCount = await page.locator('[data-testid="event-card"]').count();

  return {
    stepName,
    timestamp: Date.now(),
    cardCount,
    violations: {
      clipping: clipping.violations,
      viewport: viewport.violations,
      minimap: minimap.violations
    },
    passed: clipping.violations.length === 0 &&
            viewport.violations.length === 0 &&
            minimap.violations.length === 0
  };
}

/**
 * Navigate to densest area of French Revolution timeline (1794 period)
 */
async function navigateToDensestArea(page: any): Promise<void> {
  const axis = page.locator('[data-testid="timeline-axis"]').first();
  const axisBox = await axis.boundingBox();

  if (!axisBox) {
    throw new Error('Timeline axis not found');
  }

  // French Revolution: 1775-1799, densest year is 1794 (82 events)
  const year1794Ratio = (1794 - 1775) / (1799 - 1775);
  const targetX = axisBox.x + (axisBox.width * year1794Ratio);

  await page.mouse.click(targetX, axisBox.y + axisBox.height / 2);
  await page.waitForTimeout(500);
}

/**
 * Generate comprehensive markdown report from test results
 */
function generateStressTestReport(results: StepResult[]): string {
  const totalSteps = results.length;
  const passedSteps = results.filter(r => r.passed).length;
  const failedSteps = totalSteps - passedSteps;

  // Aggregate violations by type
  const allViolations = {
    clipping: results.flatMap(r => r.violations.clipping),
    viewport: results.flatMap(r => r.violations.viewport),
    minimap: results.flatMap(r => r.violations.minimap)
  };

  // Group violations by step
  const failedStepDetails = results
    .filter(r => !r.passed)
    .map(r => ({
      stepName: r.stepName,
      cardCount: r.cardCount,
      violationCounts: {
        clipping: r.violations.clipping.length,
        viewport: r.violations.viewport.length,
        minimap: r.violations.minimap.length
      }
    }));

  const markdown = `# Robust Text Rendering Stress Test Report

**Generated:** ${new Date().toISOString()}

## Summary

- **Total Steps:** ${totalSteps}
- **Passed:** ${passedSteps} (${((passedSteps / totalSteps) * 100).toFixed(1)}%)
- **Failed:** ${failedSteps} (${((failedSteps / totalSteps) * 100).toFixed(1)}%)

## Violations Found

| Type | Count |
|------|-------|
| Text Clipping | ${allViolations.clipping.length} |
| Viewport Bounds | ${allViolations.viewport.length} |
| Minimap Overlap | ${allViolations.minimap.length} |
| **Total** | **${allViolations.clipping.length + allViolations.viewport.length + allViolations.minimap.length}** |

## Test Phases

### Phase 1: Dense Area Navigation
- Navigated to 1794 period (densest area in French Revolution timeline)

### Phase 2: Progressive Zoom
- Zoomed progressively to 10-15 card target
- Verified state at each zoom step

### Phase 3: Shift-Scroll Panning
- Panned left (10 events)
- Panned right (10 events)
- Verified state at each pan step

### Phase 4: Round-Trip Coherency
- Zoomed back to default view
- Verified state returned to baseline

### Phase 5: Random Zoom Sequence
- 10 random zoom operations (60% in, 40% out)
- Verified state at each random step

## Failed Steps

${failedStepDetails.length === 0 ? '✅ No failed steps' : `
| Step | Card Count | Clipping | Viewport | Minimap |
|------|------------|----------|----------|---------|
${failedStepDetails.map(s => `| ${s.stepName} | ${s.cardCount} | ${s.violationCounts.clipping} | ${s.violationCounts.viewport} | ${s.violationCounts.minimap} |`).join('\n')}
`}

## Violation Details

### Text Clipping Violations (${allViolations.clipping.length})

${allViolations.clipping.length === 0 ? '✅ No text clipping violations' : `
${allViolations.clipping.slice(0, 10).map((v: any) => `- Card #${v.cardIndex} (${v.cardType}): ${v.element} overflows by ${v.overflowY}px - "${v.text}..."`).join('\n')}
${allViolations.clipping.length > 10 ? `\n... and ${allViolations.clipping.length - 10} more` : ''}
`}

### Viewport Bounds Violations (${allViolations.viewport.length})

${allViolations.viewport.length === 0 ? '✅ No viewport violations' : `
${allViolations.viewport.slice(0, 10).map((v: any) => `- Card #${v.cardIndex} (${v.cardType}): ${v.extendsAbove ? 'Above top' : 'Below bottom'} by ${v.overflowAmount}px`).join('\n')}
${allViolations.viewport.length > 10 ? `\n... and ${allViolations.viewport.length - 10} more` : ''}
`}

### Minimap Overlap Violations (${allViolations.minimap.length})

${allViolations.minimap.length === 0 ? '✅ No minimap violations' : `
${allViolations.minimap.slice(0, 10).map((v: any) => `- Card #${v.cardIndex} (${v.cardType}): Top at ${v.top}px (intrudes ${v.intrusion}px into safe zone)`).join('\n')}
${allViolations.minimap.length > 10 ? `\n... and ${allViolations.minimap.length - 10} more` : ''}
`}

## Test Pattern

This test uses the **Editor Robustness Test Template**:

1. ✅ Dense area navigation
2. ✅ Progressive interaction loop with safety limit
3. ✅ Verification at each step
4. ✅ Round-trip coherency check
5. ✅ Random/chaos testing phase
6. ✅ Comprehensive result tracking

## Recommendations

${failedSteps === 0 ? `
✅ All tests passed! Text rendering is stable across all interaction patterns.
` : `
⚠️  ${failedSteps} steps failed. Review the violations above and:

1. Fix text clipping issues (increase card height or adjust line-clamp)
2. Ensure cards stay within viewport bounds during zoom/pan
3. Verify minimap safe zone is respected (top 100px)
4. Re-run test to verify fixes
`}

## Next Steps

- ${failedSteps === 0 ? 'Monitor for regressions in future changes' : 'Fix identified issues and re-run test'}
- ${failedSteps === 0 ? 'Use this pattern for other editor feature tests' : 'Capture screenshots of failing states for debugging'}
- ${failedSteps === 0 ? 'Document any edge cases discovered' : 'Update requirements if edge cases are acceptable'}
`;

  return markdown;
}

test.describe('Robust Text Rendering Stress Test', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await loadTestTimeline(page, 'french-revolution'); // 250 events, highest density
    await expect(page.locator('[data-testid="event-card"]').first())
      .toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000); // Stabilize rendering
  });

  test('T105.1: Comprehensive stress test with progressive zoom and panning', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-CARDS-TEXT-001' });
    test.setTimeout(180000); // 3 minutes for comprehensive test

    console.log('\n🔥 === ROBUST TEXT RENDERING STRESS TEST ===\n');

    const results: StepResult[] = [];

    // STEP 1: Navigate to densest area
    console.log('📍 Step 1: Navigating to densest area (1794 period)...');
    await navigateToDensestArea(page);
    const navResult = await performAllChecks(page, 'After navigation to dense area');
    results.push(navResult);
    console.log(`  ${navResult.cardCount} cards - ${navResult.passed ? '✅' : '❌'}`);

    // STEP 2: Progressive zoom to 10-15 cards
    console.log('\n🔍 Step 2: Progressive zoom to 10-15 cards...');
    let zoomLevel = 0;
    let cardCount = await page.locator('[data-testid="event-card"]').count();

    while (cardCount > 15 && zoomLevel < 20) {
      await page.keyboard.press('Equal'); // Zoom in
      await page.waitForTimeout(300);
      zoomLevel++;

      cardCount = await page.locator('[data-testid="event-card"]').count();
      const stepResult = await performAllChecks(page, `Zoom level ${zoomLevel} (${cardCount} cards)`);
      results.push(stepResult);

      console.log(`  Zoom ${zoomLevel}: ${cardCount} cards - ${stepResult.passed ? '✅' : '❌'}`);

      if (!stepResult.passed) {
        console.log(`    Violations: clipping=${stepResult.violations.clipping.length}, viewport=${stepResult.violations.viewport.length}, minimap=${stepResult.violations.minimap.length}`);
      }
    }

    console.log(`\n✅ Reached target: ${cardCount} cards at zoom level ${zoomLevel}`);

    // STEP 3: Shift-scroll panning (left then right)
    console.log('\n⬅️  Step 3: Shift-scroll panning (left 10, right 10)...');

    // Pan left
    for (let i = 0; i < 10; i++) {
      await page.keyboard.down('Shift');
      await page.mouse.wheel(100, 0); // Horizontal scroll left
      await page.keyboard.up('Shift');
      await page.waitForTimeout(100);

      const stepResult = await performAllChecks(page, `Pan left ${i + 1}`);
      results.push(stepResult);

      if (!stepResult.passed) {
        console.log(`  Pan left ${i + 1}: ❌ (${stepResult.violations.clipping.length + stepResult.violations.viewport.length + stepResult.violations.minimap.length} violations)`);
      }
    }

    // Pan right
    for (let i = 0; i < 10; i++) {
      await page.keyboard.down('Shift');
      await page.mouse.wheel(-100, 0); // Horizontal scroll right
      await page.keyboard.up('Shift');
      await page.waitForTimeout(100);

      const stepResult = await performAllChecks(page, `Pan right ${i + 1}`);
      results.push(stepResult);

      if (!stepResult.passed) {
        console.log(`  Pan right ${i + 1}: ❌ (${stepResult.violations.clipping.length + stepResult.violations.viewport.length + stepResult.violations.minimap.length} violations)`);
      }
    }

    console.log('✅ Panning complete');

    // STEP 4: Zoom out to default (round-trip)
    console.log('\n🔄 Step 4: Zoom out to default (round-trip coherency)...');
    await page.keyboard.press('Digit0'); // Reset to default zoom
    await page.waitForTimeout(1000);
    const resetResult = await performAllChecks(page, 'After zoom reset');
    results.push(resetResult);
    console.log(`  Reset: ${resetResult.cardCount} cards - ${resetResult.passed ? '✅' : '❌'}`);

    // STEP 5: Random zoom sequence (chaos test)
    console.log('\n🎲 Step 5: Random zoom sequence (10 iterations)...');

    for (let i = 0; i < 10; i++) {
      const shouldZoomIn = Math.random() > 0.4; // 60% zoom in, 40% zoom out

      if (shouldZoomIn) {
        await page.keyboard.press('Equal');
      } else {
        await page.keyboard.press('Minus');
      }
      await page.waitForTimeout(200);

      const currentCards = await page.locator('[data-testid="event-card"]').count();
      const stepResult = await performAllChecks(page, `Random ${shouldZoomIn ? 'zoom in' : 'zoom out'} ${i + 1} (${currentCards} cards)`);
      results.push(stepResult);

      if (!stepResult.passed) {
        console.log(`  Random ${i + 1}: ❌ ${shouldZoomIn ? '(+)' : '(-)'} ${currentCards} cards`);
      }
    }

    console.log('✅ Random sequence complete');

    // STEP 6: Generate comprehensive report
    console.log('\n📊 === TEST RESULTS ===\n');

    const totalSteps = results.length;
    const passedSteps = results.filter(r => r.passed).length;
    const failedSteps = totalSteps - passedSteps;

    console.log(`Total steps: ${totalSteps}`);
    console.log(`Passed: ${passedSteps} (${((passedSteps / totalSteps) * 100).toFixed(1)}%)`);
    console.log(`Failed: ${failedSteps} (${((failedSteps / totalSteps) * 100).toFixed(1)}%)`);

    // Report violations by type
    const allViolations = {
      clipping: results.flatMap(r => r.violations.clipping),
      viewport: results.flatMap(r => r.violations.viewport),
      minimap: results.flatMap(r => r.violations.minimap)
    };

    console.log(`\nViolations found:`);
    console.log(`  Text clipping: ${allViolations.clipping.length}`);
    console.log(`  Viewport bounds: ${allViolations.viewport.length}`);
    console.log(`  Under minimap: ${allViolations.minimap.length}`);

    // Generate markdown report
    const markdown = generateStressTestReport(results);
    const reportDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, 'robust-text-rendering-stress.md');
    fs.writeFileSync(reportPath, markdown);

    console.log(`\n✅ Report saved to test-results/robust-text-rendering-stress.md\n`);

    // ENFORCE: All steps must pass
    if (failedSteps > 0) {
      console.log(`\n❌ STRESS TEST FAILED - ${failedSteps} steps with violations\n`);
      console.log('See test-results/robust-text-rendering-stress.md for details\n');
    } else {
      console.log('\n✅ STRESS TEST PASSED - All ${totalSteps} steps passed\n');
    }

    expect(failedSteps, `Found ${failedSteps} steps with violations. See report for details.`).toBe(0);
  });
});
