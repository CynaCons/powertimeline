# Test Structure

## New Iterative Testing Approach

We've cleaned up the complex test suite and restarted with a simple, iterative approach that matches our development plan.

### Current Tests

#### `legacy.spec.ts`
- Legacy tests from old SVG architecture (all skipped)
- Kept for reference but not actively used

#### `performance.spec.ts` 
- Performance test for handling many events (currently skipped)
- Will be re-enabled when we have cards to test

#### `foundation.spec.ts` ✅
- Tests for basic layout foundation
- Validates full-screen grid and horizontal timeline
- All tests currently passing

#### `cards.spec.ts`
- Tests for HTML event cards (currently skipped)
- Will be enabled when we implement card display
- Tests for card display, positioning, and content visibility

### Removed Tests

The following tests were removed as they were based on the old SVG+foreignObject architecture:
- `smoke-ui.spec.ts` - Complex UI tests with SVG selectors
- `accessibility-audit.spec.ts` - Accessibility tests for old architecture
- `editing-controls.spec.ts` - Tests for SVG-based editing
- `expanded-card-content.spec.ts` - Tests for foreignObject card expansion
- `grid-lines.spec.ts` - Tests for SVG grid lines
- `multi-row-lanes.spec.ts` - Tests for complex lane system
- `node-expansion-edit.spec.ts` - Tests for SVG node interactions
- `visual-regression.spec.ts` - Visual regression tests for old UI
- All associated snapshots

### Testing Philosophy

1. **One test file per feature area** - Clean separation of concerns
2. **Simple selectors** - HTML/CSS classes, not complex SVG paths
3. **Visual verification** - Screenshots for each major feature
4. **Skip until implemented** - Future tests marked as skipped until features exist
5. **Keep it simple** - Focus on core functionality, not edge cases

### Running Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/foundation.spec.ts
npx playwright test tests/cards.spec.ts

# Run with headed browser for debugging
npx playwright test --headed
```