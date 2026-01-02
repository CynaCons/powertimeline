# Test Suite Organization

**Last Updated:** 2026-01-02
**Version:** v0.8.3.4

## Directory Structure

```
tests/
├── mobile/       # Mobile-specific tests (5 files)
├── responsive/   # Cross-viewport tests (6 files)
├── editor/       # Timeline editor functionality (66 files)
├── home/         # Home page and navigation (8 files)
├── admin/        # Admin panel functionality (5 files)
├── user/         # User profile and editing (2 files)
├── production/   # Production smoke tests (5 files)
├── auth/         # Authentication tests
├── e2e/          # End-to-end user journeys
├── firestore/    # Firestore integration tests
├── helpers/      # Test helper utilities
└── utils/        # Shared test utilities
```

## Test Categories

| Suite | Purpose | Runs Against |
|-------|---------|--------------|
| `mobile/` | Mobile-specific functionality | iPhone 14 viewport |
| `responsive/` | Cross-viewport layout tests | All viewports |
| `editor/` | Timeline rendering, zoom, layout, cards | localhost:5175 |
| `home/` | HomePage, navigation, search | localhost:5175 |
| `admin/` | Admin panel, user management | localhost:5175 |
| `user/` | User profiles, editing | localhost:5175 |
| `production/` | Smoke tests | powertimeline.com |
| `e2e/` | Full user journeys | localhost:5175 |

## Running Tests

### All Tests (Local)
```bash
# Run all tests across all viewports (default)
npm test

# Or using Playwright directly
npx playwright test
```

### Multi-Viewport Testing
```bash
# Mobile tests (iPhone 14)
npm run test:mobile

# Tablet tests (iPad Mini)
npm run test:tablet

# Desktop tests (1920x1080)
npm run test:desktop

# Responsive tests (all viewports)
npm run test:responsive

# All viewports (comprehensive)
npm run test:all-viewports
```

### Specific Suite
```bash
# Editor tests only
npx playwright test tests/editor/

# Mobile tests only
npx playwright test tests/mobile/

# Responsive tests only
npx playwright test tests/responsive/

# Production smoke tests
npx playwright test tests/production/

# Single file
npx playwright test tests/editor/01-foundation.smoke.spec.ts
```

### Debug Mode
```bash
# With browser visible
npx playwright test tests/editor/02-cards-placement.spec.ts --headed

# Interactive UI mode
npx playwright test --ui
```

### Update Documentation
```bash
# Run tests and update docs/TESTS.md
npm run test:update-doc
```

## Mobile Tests (tests/mobile/)

Mobile-specific functionality tests (iPhone 14 viewport):

| Range | Category | Examples |
|-------|----------|----------|
| 01-05 | Mobile UX | Stream auto-open, swipe gestures, touch targets |

## Responsive Tests (tests/responsive/)

Cross-viewport layout tests (all viewports):

| Range | Category | Examples |
|-------|----------|----------|
| 01-06 | Responsive Layout | Home page layout, card grid, breakpoints, navigation |

## Editor Tests (tests/editor/)

Core timeline functionality tests organized by feature:

| Range | Category | Examples |
|-------|----------|----------|
| 01-03 | Foundation | App loads, cards render, no overlaps |
| 04-08 | Telemetry | Capacity, degradation, stability metrics |
| 09-16 | Layout | Space optimization, half-columns, viewport |
| 17-29 | Zoom | Cursor anchor, boundaries, deep zoom |
| 21-27 | Minimap | Rendering, drag, sync |
| 30-35 | Overflow | Detection, cleanup, anchors |
| 36-49 | Degradation | Full→compact→title-only cascade |
| 50-55 | UI/Panels | Authoring overlay, navigation |
| 56-70 | Integration | Complex scenarios, validation |

## Production Tests (tests/production/)

Smoke tests against live https://powertimeline.com:

| File | Tests |
|------|-------|
| 01-smoke | Hero renders, example cards visible |
| 02-navigation | CTAs route correctly |
| 03-browse-and-search | Browse page works |
| 04-login | Login page accessible |
| 05-auth-ui | Auth buttons display correctly |

## Writing New Tests

### File Naming
```
{number}-{feature-name}.spec.ts
```

### Test Structure
```typescript
import { test, expect } from '@playwright/test';
import { loadTestTimeline } from '../utils/timelineTestUtils';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await loadTestTimeline(page, 'timeline-french-revolution');
    // assertions
  });
});
```

### Requirement Traceability
```typescript
test('feature works', async ({ page }) => {
  test.info().annotations.push({ type: 'req', description: 'CC-REQ-XXX' });
  // test implementation
});
```

## Configuration

See `playwright.config.ts` for:
- Test matching pattern: `/(mobile|responsive|editor|home|user|admin|production|auth|e2e)/.+\.spec\.ts$/`
- Timeouts: 45s test, 10s expect
- Default behavior: `npm test` runs ALL viewport projects
- **Viewport Projects:**
  - `desktop` - 1920x1080 (default)
  - `desktop-xl` - 2560x1440
  - `tablet` - iPad Mini (1024x768)
  - `mobile` - iPhone 14 (390x844)
- Device emulation: Tests use Playwright device descriptors for accurate mobile/tablet testing
- Screenshots: on-failure only

## CI/CD

Tests run on GitHub Actions:
- **On push/PR**: Quality checks, foundation test
- **Manual trigger**: Full test suite (workflow_dispatch)

See `.github/workflows/ci.yml` and `.github/workflows/tests.yml`
