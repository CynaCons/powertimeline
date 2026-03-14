# Editor Robustness Test Template

## Overview

This template provides a proven pattern for creating robust stress tests that simulate realistic user behavior and detect issues missed by static snapshot tests.

**Key Insight:** Static tests capture state at a single point. Real users interact dynamically - zooming, panning, and rapidly changing views. This template tests features under realistic interaction patterns to catch race conditions, layout bugs, and state corruption.

## When to Use This Template

Use this template when testing features that:

- **Depend on viewport dimensions or zoom level** - Layout, text rendering, overflow detection
- **Involve dynamic layout changes** - Card positioning, anchor placement, minimap updates
- **Require interaction stability** - Pan, zoom, scroll behaviors
- **Could fail under rapid state changes** - React batching issues, async updates
- **Need validation across multiple zoom/view states** - Deep zoom, default, zoomed out

**Don't use for:**
- Simple API endpoint tests
- Static data validation
- Single-state UI snapshots
- Features that don't involve user interaction

## Core Pattern

### 1. Setup Phase

Load a high-density test timeline and wait for stability.

```typescript
test.beforeEach(async ({ page }) => {
  await loginAsTestUser(page);
  await loadTestTimeline(page, 'french-revolution'); // 250 events, highest density
  await expect(page.locator('[data-testid="event-card"]').first())
    .toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(1000); // Stabilize rendering
});
```

**Why French Revolution?** 250 events with high density (82 events in 1794 alone). This stresses layout and rendering systems better than sparse timelines.

### 2. Dense Area Navigation

Navigate to a specific high-event region for maximum stress.

```typescript
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
```

**Dense areas for test timelines:**
- French Revolution: 1794 period (82 events)
- Napoleon Bonaparte: 1812 period (Russian campaign, 60+ events)

### 3. Progressive Interaction Loop

Perform an action repeatedly until a target condition is met, verifying state at each step.

```typescript
let zoomLevel = 0;
let cardCount = await page.locator('[data-testid="event-card"]').count();

while (cardCount > TARGET_CARDS && zoomLevel < MAX_ITERATIONS) {
  // Perform interaction
  await page.keyboard.press('Equal'); // Zoom in
  await page.waitForTimeout(STABILIZATION_MS); // Let React batch updates
  zoomLevel++;

  // Capture state
  cardCount = await page.locator('[data-testid="event-card"]').count();

  // Verify conditions at this step
  const result = await performAllChecks(page, `Zoom level ${zoomLevel}`);
  results.push(result);

  // Log progress
  console.log(`  Zoom ${zoomLevel}: ${cardCount} cards - ${result.passed ? '✅' : '❌'}`);
}
```

**Key elements:**
- **Safety limit** - Prevent infinite loops (max 20 iterations typical)
- **Stabilization delay** - 200-500ms for React batching to complete
- **Per-step verification** - Check conditions at EVERY step, not just the end
- **Progress logging** - Show user what's happening during long tests

### 4. Multi-Step Verification

Define helper functions for each condition to check.

```typescript
interface StepResult {
  stepName: string;
  timestamp: number;
  cardCount: number;
  violations: {
    [checkName: string]: any[];
  };
  passed: boolean;
}

async function performAllChecks(page: any, stepName: string): Promise<StepResult> {
  const check1 = await verifyCondition1(page);
  const check2 = await verifyCondition2(page);
  const check3 = await verifyCondition3(page);

  return {
    stepName,
    timestamp: Date.now(),
    cardCount: await page.locator('[data-testid="event-card"]').count(),
    violations: {
      condition1: check1.violations,
      condition2: check2.violations,
      condition3: check3.violations
    },
    passed: check1.violations.length === 0 &&
            check2.violations.length === 0 &&
            check3.violations.length === 0
  };
}
```

**Verification patterns:**
- **Text clipping** - Check if text extends beyond card bounds
- **Viewport bounds** - Ensure cards stay within visible area
- **Element overlap** - Detect UI collisions (minimap, panels)
- **Performance thresholds** - Validate card count in expected range

### 5. Round-Trip Coherency

Return to baseline state and verify it matches the initial state.

```typescript
// After interaction sequence, reset to baseline
await page.keyboard.press('Digit0'); // Reset zoom
await page.waitForTimeout(1000);

const resetResult = await performAllChecks(page, 'After zoom reset');
results.push(resetResult);

// Verify state returned to baseline (allow tolerance)
expect(resetResult.cardCount).toBeGreaterThanOrEqual(initialCardCount - 10);
expect(resetResult.cardCount).toBeLessThanOrEqual(initialCardCount + 10);
```

**Why this matters:** Detects state corruption from interaction sequences. If zooming in/out doesn't return to the same state (±tolerance), React state or layout calculations have drifted.

### 6. Chaos Testing

Perform random valid interactions to ensure robustness.

```typescript
for (let i = 0; i < 10; i++) {
  const shouldZoomIn = Math.random() > 0.4; // 60% zoom in, 40% zoom out

  if (shouldZoomIn) {
    await page.keyboard.press('Equal');
  } else {
    await page.keyboard.press('Minus');
  }
  await page.waitForTimeout(200);

  const result = await performAllChecks(page, `Random iteration ${i + 1}`);
  results.push(result);
}
```

**Chaos testing reveals:**
- Race conditions that only appear with specific interaction sequences
- Edge cases not covered by deterministic tests
- Cumulative state corruption over many operations

### 7. Comprehensive Reporting

Track all results and generate a detailed markdown report.

```typescript
function generateReport(results: StepResult[]): string {
  const totalSteps = results.length;
  const passedSteps = results.filter(r => r.passed).length;
  const failedSteps = totalSteps - passedSteps;

  // Aggregate violations by type
  const allViolations = {
    type1: results.flatMap(r => r.violations.type1),
    type2: results.flatMap(r => r.violations.type2)
  };

  return `# Test Report

## Summary
- Total Steps: ${totalSteps}
- Passed: ${passedSteps} (${((passedSteps / totalSteps) * 100).toFixed(1)}%)
- Failed: ${failedSteps}

## Violations
${/* detailed breakdown */}

## Failed Steps
${/* step-by-step details */}
`;
}

// Save report
const reportPath = path.join(process.cwd(), 'test-results', 'report.md');
fs.writeFileSync(reportPath, generateReport(results));
```

**Report sections:**
- Summary statistics (pass/fail percentages)
- Violations aggregated by type
- Failed step details with context
- Recommendations based on results

## Helper Functions Library

### Navigation Helpers

```typescript
/**
 * Navigate to a specific year on the timeline axis
 */
async function navigateToYear(page: any, targetYear: number, startYear: number, endYear: number): Promise<void> {
  const axis = page.locator('[data-testid="timeline-axis"]').first();
  const axisBox = await axis.boundingBox();

  if (!axisBox) throw new Error('Timeline axis not found');

  const ratio = (targetYear - startYear) / (endYear - startYear);
  const targetX = axisBox.x + (axisBox.width * ratio);

  await page.mouse.click(targetX, axisBox.y + axisBox.height / 2);
  await page.waitForTimeout(500);
}

/**
 * Navigate to densest area (French Revolution 1794)
 */
async function navigateToDensestArea(page: any): Promise<void> {
  await navigateToYear(page, 1794, 1775, 1799);
}
```

### Progressive Zoom Helpers

```typescript
/**
 * Zoom progressively until target card count reached
 */
async function zoomUntilTargetReached(
  page: any,
  targetCards: number,
  maxIterations: number = 20
): Promise<number> {
  let level = 0;
  let count = await page.locator('[data-testid="event-card"]').count();

  while (count > targetCards && level < maxIterations) {
    await page.keyboard.press('Equal');
    await page.waitForTimeout(300);
    level++;
    count = await page.locator('[data-testid="event-card"]').count();
  }

  return level;
}

/**
 * Zoom out progressively back to default
 */
async function zoomOutToDefault(page: any, currentLevel: number): Promise<void> {
  for (let i = 0; i < currentLevel; i++) {
    await page.keyboard.press('Minus');
    await page.waitForTimeout(300);
  }
}
```

### Shift-Scroll Panning Helpers

```typescript
/**
 * Perform shift-scroll panning in a direction
 */
async function shiftScrollPan(
  page: any,
  direction: 'left' | 'right',
  iterations: number
): Promise<void> {
  const delta = direction === 'left' ? 100 : -100;

  for (let i = 0; i < iterations; i++) {
    await page.keyboard.down('Shift');
    await page.mouse.wheel(delta, 0);
    await page.keyboard.up('Shift');
    await page.waitForTimeout(100);
  }
}

/**
 * Pan left and right (stress test)
 */
async function stressPanning(page: any, iterations: number = 10): Promise<void> {
  await shiftScrollPan(page, 'left', iterations);
  await shiftScrollPan(page, 'right', iterations);
}
```

### Verification Helpers

```typescript
/**
 * Verify no text extends beyond card boundaries
 */
async function verifyNoTextClipping(page: any): Promise<{ violations: any[], summary: string }> {
  const violations = await page.evaluate(() => {
    const cards = document.querySelectorAll('[data-testid="event-card"]');
    const issues: any[] = [];

    cards.forEach((card, idx) => {
      const cardRect = card.getBoundingClientRect();
      const titleEl = card.querySelector('.card-title');
      const descEl = card.querySelector('.card-description');

      // Check if text extends beyond card bounds (1px tolerance)
      if (titleEl) {
        const titleRect = titleEl.getBoundingClientRect();
        if (titleRect.bottom > cardRect.bottom + 1) {
          issues.push({
            cardIndex: idx,
            element: 'title',
            overflowY: Math.round(titleRect.bottom - cardRect.bottom)
          });
        }
      }

      if (descEl) {
        const descRect = descEl.getBoundingClientRect();
        if (descRect.bottom > cardRect.bottom + 1) {
          issues.push({
            cardIndex: idx,
            element: 'description',
            overflowY: Math.round(descRect.bottom - cardRect.bottom)
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
 * Verify all cards within viewport bounds
 */
async function verifyCardsInViewport(page: any): Promise<{ violations: any[], summary: string }> {
  const viewportHeight = await page.evaluate(() => window.innerHeight);

  const violations = await page.evaluate((vh: number) => {
    const cards = document.querySelectorAll('[data-testid="event-card"]');
    const issues: any[] = [];

    cards.forEach((card, idx) => {
      const cardRect = card.getBoundingClientRect();

      // Allow 100px tolerance for cards transitioning during zoom operations
      const extendsAbove = cardRect.top < -100;
      const extendsBelow = cardRect.bottom > vh + 100;

      if (extendsAbove || extendsBelow) {
        issues.push({ cardIndex: idx, extendsAbove, extendsBelow });
      }
    });

    return issues;
  }, viewportHeight);

  return {
    violations,
    summary: violations.length === 0
      ? '✅ All cards in viewport'
      : `❌ ${violations.length} cards outside viewport`
  };
}
```

## Best Practices

### Timing and Stability

**Use appropriate wait times:**
```typescript
// After zoom/pan operations - allow React batching
await page.waitForTimeout(300);

// After major state changes - allow full layout
await page.waitForTimeout(500);

// After navigation - allow data fetch + render
await page.waitForTimeout(1000);
```

**When to use `waitForFunction()` instead:**
```typescript
// Good: Wait for specific condition
await page.waitForFunction(() => {
  return document.querySelectorAll('[data-testid="event-card"]').length > 0;
});

// Bad: Fixed timeout when condition is detectable
await page.waitForTimeout(5000);
```

### Verification Tolerances

**Pixel measurements:** ±1px tolerance for rendering variance
```typescript
if (overflowY > 1) { // Not > 0
  violations.push(...);
}
```

**Viewport bounds:** ±100px tolerance for cards transitioning during zoom
```typescript
const extendsAbove = cardRect.top < -100;
const extendsBelow = cardRect.bottom > viewportHeight + 100;
```

**Minimap safe zone:** Top 100px reserved for minimap
```typescript
const minimapSafeZone = 100;
if (cardRect.top < minimapSafeZone) {
  violations.push(...);
}
```

**Percentage comparisons:** ±5% tolerance for viewport scaling
```typescript
const percentDiff = Math.abs(actual - expected) / expected;
expect(percentDiff).toBeLessThan(0.05);
```

**Round-trip coherency:** 80-90% match is acceptable
```typescript
// Some layout differences expected after zoom cycle
expect(finalCount).toBeGreaterThanOrEqual(initialCount * 0.8);
expect(finalCount).toBeLessThanOrEqual(initialCount * 1.2);
```

### Failure Diagnostics

**Capture context when checks fail:**
```typescript
if (!stepResult.passed) {
  // Log violation counts
  console.log(`  Violations: clipping=${stepResult.violations.clipping.length}`);

  // Capture screenshot
  await page.screenshot({
    path: `test-results/failure-step-${zoomLevel}.png`
  });

  // Store detailed violation data
  results.push(stepResult);
}
```

**Don't fail immediately - gather all violations:**
```typescript
// Good: Complete test, report all issues
const failedSteps = results.filter(r => !r.passed).length;
expect(failedSteps).toBe(0); // At the end

// Bad: Fail on first issue
if (!stepResult.passed) {
  throw new Error('Step failed!');
}
```

### Performance

**Limit DOM queries:**
```typescript
// Good: Single count() call
const cardCount = await page.locator('[data-testid="event-card"]').count();

// Bad: Fetching all elements just to count
const cards = await page.locator('[data-testid="event-card"]').all();
const cardCount = cards.length;
```

**Batch DOM operations with `evaluate()`:**
```typescript
// Good: Single evaluate() for multiple checks
const result = await page.evaluate(() => {
  const cards = document.querySelectorAll('[data-testid="event-card"]');
  return {
    count: cards.length,
    clipping: checkClipping(cards),
    bounds: checkBounds(cards)
  };
});

// Bad: Multiple separate evaluates
const count = await page.evaluate(() => document.querySelectorAll('[data-testid="event-card"]').length);
const clipping = await page.evaluate(() => checkClipping());
const bounds = await page.evaluate(() => checkBounds());
```

**Set appropriate test timeout:**
```typescript
test('Comprehensive stress test', async ({ page }) => {
  test.setTimeout(180000); // 3 minutes for ~60-80 steps

  // Complex multi-phase test...
});
```

## Example Tests Using This Pattern

Reference implementations in this codebase:

| Test | Pattern Demonstrated | Lines of Code |
|------|---------------------|---------------|
| `62-deep-zoom-anchor-count.spec.ts` | Progressive zoom to dense area | ~170 |
| `29-deep-zoom-comprehensive-sliding.spec.ts` | Multi-step verification | ~200 |
| `99-shift-scroll-pan.spec.ts` | Shift-scroll with rollback detection | ~215 |
| `69-french-revolution-zoom-test.spec.ts` | Spatial cluster analysis | ~180 |
| `105-robust-text-rendering-stress.spec.ts` | **Complete template implementation** | ~450 |

## Test Checklist

Before marking your robustness test complete, verify:

- [ ] Tests dense area (not just default view)
- [ ] Progressive interaction loop with safety limit (max 20 iterations)
- [ ] Verification at each step (not just final state)
- [ ] Round-trip coherency check (return to baseline)
- [ ] Random/chaos testing phase (10+ random operations)
- [ ] Comprehensive result tracking (all violations captured)
- [ ] Markdown report generation (saved to test-results/)
- [ ] Diagnostic screenshots on failure (optional but recommended)
- [ ] Test timeout set appropriately (2-3 minutes for comprehensive tests)
- [ ] All assertions use meaningful error messages
- [ ] Console output shows progress through test phases

## Common Pitfalls

### ❌ Pitfall: Fixed iteration count instead of target-based loop

```typescript
// Bad: Always zoom 10 times
for (let i = 0; i < 10; i++) {
  await page.keyboard.press('Equal');
}

// Good: Zoom until target reached (with safety limit)
while (cardCount > 10 && zoomLevel < 20) {
  await page.keyboard.press('Equal');
  cardCount = await page.locator('[data-testid="event-card"]').count();
  zoomLevel++;
}
```

### ❌ Pitfall: Not waiting for React batching

```typescript
// Bad: Immediate check after zoom
await page.keyboard.press('Equal');
const result = await performAllChecks(page, 'Zoom 1');

// Good: Wait for layout to settle
await page.keyboard.press('Equal');
await page.waitForTimeout(300);
const result = await performAllChecks(page, 'Zoom 1');
```

### ❌ Pitfall: Forgetting safety limits

```typescript
// Bad: Infinite loop if condition never met
while (cardCount > 10) {
  await page.keyboard.press('Equal');
  cardCount = await page.locator('[data-testid="event-card"]').count();
}

// Good: Safety limit prevents infinite loop
let iterations = 0;
while (cardCount > 10 && iterations < 20) {
  await page.keyboard.press('Equal');
  cardCount = await page.locator('[data-testid="event-card"]').count();
  iterations++;
}
```

### ❌ Pitfall: Only checking final state

```typescript
// Bad: Only verify at the end
for (let i = 0; i < 10; i++) {
  await page.keyboard.press('Equal');
}
const result = await performAllChecks(page, 'Final');

// Good: Verify at each step
for (let i = 0; i < 10; i++) {
  await page.keyboard.press('Equal');
  const result = await performAllChecks(page, `Step ${i + 1}`);
  results.push(result);
}
```

## Adapting This Template

To adapt this template for your feature:

1. **Identify interaction patterns** - What user actions stress your feature?
2. **Define verification conditions** - What should be true at every step?
3. **Choose dense test data** - Use high-density timelines or create specific test data
4. **Set appropriate targets** - Define what "stressed" looks like (card count, zoom level, etc.)
5. **Add feature-specific checks** - Extend verification suite with feature-specific conditions
6. **Customize report format** - Add relevant metrics and diagnostics to report

## Support

For questions or suggestions about this template:
- Review reference test implementations (tests 62, 29, 99, 69, 105)
- Check `docs/TESTS.md` for test documentation
- See `tests/utils/timelineTestUtils.ts` for helper functions

## Version History

- **v1.0** (2026-01-21) - Initial template based on tests 62, 99, 104
- Codified pattern from 5+ robustness tests into reusable template
- Added comprehensive helper function library
- Documented best practices and common pitfalls
