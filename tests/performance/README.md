# Performance Test Suite

This directory contains performance tests for PowerTimeline. There are three types of tests:

## Quick Reference

```bash
# Quick health check (recommended for regular use)
npm test -- tests/performance/99-performance-baseline.spec.ts --project=desktop

# Advanced metrics (memory, FPS, layout thrashing, INP)
npm test -- tests/performance/100-advanced-metrics.spec.ts --project=desktop

# Deep investigation (generates .cpuprofile files for Chrome DevTools)
npm test -- tests/performance/98-performance-profiling.spec.ts --project=desktop

# Run everything
npm test -- tests/performance/ --project=desktop
```

## Test Files

### T98: Performance Profiling (`98-performance-profiling.spec.ts`)

**Purpose:** Deep analysis using Chrome DevTools Protocol (CDP)

**Use when:** You need to investigate WHY something is slow

**Output:**
- Console: Top slow functions, time by category, warnings
- Files: `.cpuprofile` (load in Chrome DevTools for flame charts)

| Test | What It Profiles |
|------|------------------|
| T98.1 | Initial timeline load |
| T98.2 | Zoom button operations |
| T98.3 | Mouse wheel zoom (rapid) |
| T98.4 | Pan operations |
| T98.5 | Minimap navigation |
| T98.6 | Dense region stress |
| T98.7 | Card interactions |
| **T98.8** | **Full stress test (recommended)** |

### T100: Advanced Metrics (`100-advanced-metrics.spec.ts`)

**Purpose:** Deep diagnostic metrics that basic timing tests miss

**Use when:** You need to understand WHY something is slow, not just HOW slow

**Output:** Detailed console report with specific bottleneck identification

| Test | What It Measures |
|------|------------------|
| T100.1 | Memory leak detection (heap growth) |
| T100.2 | Layout thrashing (reflow count) |
| T100.3 | FPS / animation smoothness |
| T100.4 | Long task detection (main thread blocking) |
| T100.5 | DOM node stability (virtualization check) |
| T100.6 | INP (Interaction to Next Paint) |
| T100.7 | Network throttling (Fast 3G) |
| **T100.8** | **Combined stress test (all metrics)** |

**Key Metrics Explained:**
- **Layout Reflows**: If >10 per operation, you have "layout thrashing" (synchronous reflows)
- **Long Tasks**: If >50ms, the UI was frozen during that time
- **INP**: Google Core Web Vital - Good <200ms, Poor >500ms
- **Heap Growth**: If >20MB after stress test, you have a memory leak

### T99: Performance Baselines (`99-performance-baseline.spec.ts`)

**Purpose:** Pass/fail regression detection

**Use when:** You want a quick performance health check or CI gate

**Output:** Console report with pass/fail status and overall score

| Test | What It Measures |
|------|------------------|
| T99.1 | Timeline load + FCP |
| T99.2 | Zoom button performance |
| T99.3 | Navigation performance |
| T99.4 | Pan performance |
| T99.5 | Mouse wheel zoom out |
| T99.6 | Fit All button |
| **T99.7** | **Full baseline (all operations)** |

## Understanding the Output

### Baseline Test Output (T99)

```
═══════════════════════════════════════════════════════════════════════════
  PERFORMANCE BASELINE RESULTS
═══════════════════════════════════════════════════════════════════════════

  Metric                        Result     Target       Status   Assessment
  -----------------------------------------------------------------------
  Timeline Load                 2113ms     4000ms    excellent           🟢
  Zoom (avg)                   472ms/op   300ms/op   acceptable           🟡
  Pan (avg)                    136ms/op   100ms/op   acceptable           🟡
  First Contentful Paint        2100ms     2000ms   acceptable           🟡

  Overall Score: 68%
  Rating: ⭐⭐⭐⭐ Good
```

**Status meanings:**
- 🟢 **Excellent/Good**: At or below target
- 🟡 **Acceptable**: Above target but within acceptable range
- 🟠 **Warning**: Approaching critical threshold
- 🔴 **Critical**: Test FAILS - performance is unacceptable

### Profiling Test Output (T98)

```
======================================================================
PERFORMANCE REPORT: T98.8 Full Stress Test
======================================================================

### WARNINGS ###
  [!] 12 long tasks detected (>50ms)
  [!] 8 slow functions detected (>100ms self-time)

### TIME BY CATEGORY ###
  Zoom                   9497.3ms ████████████████████████████████████████
  Paint                  3384.0ms ████████████████████████████████████████
  Load                   3017.9ms ████████████████████████████████████████

### TOP FUNCTIONS BY SELF-TIME ###
  Function                             Self Time Source
  ------------------------------------------------------------------
  (garbage collector)                    230.7ms (native)
  getTrueOffsetParent                    192.9ms chunk-UHLY45NC.js
  exports.createElement                  191.4ms chunk-BQYK6RGN.js
```

## Analyzing CPU Profiles

The T98 tests generate `.cpuprofile` files in `test-results/performance/`.

**To analyze:**
1. Open Chrome DevTools (F12)
2. Go to **Performance** tab
3. Click the ⚙️ icon → **Load profile...**
4. Select the `.cpuprofile` file
5. Explore the flame chart

**What to look for:**
- Wide bars = slow functions
- Deep stacks = many nested calls
- Repeated patterns = potential optimization targets

## Adjusting Baselines

As you optimize performance, update the baselines in `99-performance-baseline.spec.ts`:

```typescript
const BASELINES = {
  zoomOperation: {
    target: 300,       // ← Lower this as you optimize
    acceptable: 600,
    critical: 1500,
  },
  // ...
};
```

This ensures future regressions are caught.

## Current Baselines (Dev Mode)

| Operation | Target | Acceptable | Critical |
|-----------|--------|------------|----------|
| Timeline Load | 4,000ms | 6,000ms | 12,000ms |
| Zoom (per op) | 300ms | 600ms | 1,500ms |
| Pan (per op) | 100ms | 200ms | 500ms |
| Navigation | 200ms | 400ms | 1,000ms |
| FCP | 2,000ms | 4,000ms | 8,000ms |

**Note:** Production builds are typically 2-3x faster than dev mode.

## CI Integration

For CI, run just the baseline tests:

```bash
npm test -- tests/performance/99-performance-baseline.spec.ts --project=desktop
```

The tests will fail if any metric exceeds its critical threshold.
