import { test, expect } from '@playwright/test';

const STORAGE_KEY = 'chronochart-events';

async function clearAndReload(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

test('layout: permanent sidebar and overlays do not overlap rail', async ({ page }) => {
  test.setTimeout(15_000);
  await clearAndReload(page);

  // Sidebar exists and occupies left edge
  const sidebar = page.locator('aside').first();
  await expect(sidebar).toBeVisible();

  // Open Outline overlay (should start at left-14, not cover the rail)
  await page.getByRole('button', { name: 'Outline' }).click();
  const overlay = page.locator('aside').nth(1);
  await expect(overlay).toBeVisible();

  const railBox = await sidebar.boundingBox();
  const overlayBox = await overlay.boundingBox();
  expect(railBox && overlayBox).toBeTruthy();
  if (railBox && overlayBox) {
    expect(overlayBox.x).toBeGreaterThan(railBox.x + railBox.width - 1);
  }
});

test('timeline: centered and shows ticks/edge labels', async ({ page }) => {
  test.setTimeout(12_000);
  await clearAndReload(page);
  const svg = page.locator('svg');
  await expect(svg).toBeVisible();
  const lines = await svg.locator('line').count();
  expect(lines).toBeGreaterThan(0);
  const texts = await page.locator('svg text').count();
  expect(texts).toBeGreaterThan(0);
});

test('range bar and start/end markers appear when events exist', async ({ page }) => {
  test.setTimeout(15_000);
  await clearAndReload(page);

  // Seed two events via localStorage for speed
  await page.evaluate((key) => {
    const events = [
      { id: 'a', date: '2025-01-01', title: 'A' },
      { id: 'b', date: '2025-02-01', title: 'B' },
    ];
    localStorage.setItem(key, JSON.stringify(events));
  }, STORAGE_KEY);
  await page.reload();

  await expect(page.locator('svg [data-testid="range-bar"]')).toBeVisible();
  await expect(page.locator('svg [data-testid="range-start"]')).toBeVisible();
  await expect(page.locator('svg [data-testid="range-end"]')).toBeVisible();
});

test('connectors visible and dates stay visible on select and during drag', async ({ page }) => {
  test.setTimeout(20_000);
  await clearAndReload(page);

  await page.evaluate((key) => {
    const events = [ { id: 'x', date: '2025-03-10', title: 'X', description: 'Lorem' } ];
    localStorage.setItem(key, JSON.stringify(events));
  }, STORAGE_KEY);
  await page.reload();

  const node = page.locator('svg rect[data-event-id]').first();
  await expect(node).toBeVisible();

  // Select -> date text near anchor should be visible
  await node.click();
  await expect(page.locator('svg [data-testid="anchor-date"]', { hasText: '2025-03-10' })).toBeVisible();
  // Connector should exist: look for a path segment near the node's y and a small square endpoint
  const bbox = await node.boundingBox();
  if (!bbox) throw new Error('no bbox');
  const paths = page.locator('svg path');
  await expect(paths.first()).toBeVisible();
  // square endpoint exists near the card side
  const squares = page.locator('svg rect').filter({ hasNot: node });
  await expect(squares.first()).toBeVisible();

  // Drag slightly and ensure date text updates/remains visible
  const box = await node.boundingBox();
  if (!box) throw new Error('no bbox');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2, { steps: 5 });
  await expect(page.locator('svg [data-testid="anchor-date"]')).toBeVisible();
  await page.mouse.up();
});

test('anchor/card spacing and inline description visible when selected', async ({ page }) => {
  test.setTimeout(20_000);
  await clearAndReload(page);
  await page.evaluate((key) => {
    const events = [ { id: 's', date: '2025-06-05', title: 'Spaced', description: 'Lorem ipsum dolor' } ];
    localStorage.setItem(key, JSON.stringify(events));
  }, STORAGE_KEY);
  await page.reload();

  const rect = page.locator('svg rect[data-event-id]').first();
  await rect.click();

  // Description text in card becomes visible when selected
  await expect(page.locator('svg [data-testid="card-description"]')).toBeVisible();

  // Rough spacing check: card rect should be vertically away from anchor square
  const svg = page.locator('svg');
  const svgBox = await svg.boundingBox();
  const anchorBox = await rect.boundingBox();
  const descText = page.locator('svg [data-testid="card-description"]').first();
  const descBox = await descText.boundingBox();
  if (svgBox && anchorBox && descBox) {
    // description y is within the card, ensure sufficient separation from anchor centerline
    expect(Math.abs(descBox.y - (anchorBox.y + anchorBox.height / 2))).toBeGreaterThan(10);
  }
});

test('create-on-track plus appears near center line and opens Create panel with date', async ({ page }) => {
  test.setTimeout(20_000);
  await clearAndReload(page);

  // Move cursor near center line to trigger plus
  const svg = page.locator('svg');
  const box = await svg.boundingBox();
  if (!box) throw new Error('no svg bbox');
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);

  const plus = page.locator('svg [data-testid="create-plus"]');
  await expect(plus).toBeVisible();

  // Click plus and expect Create panel
  await plus.click();
  await expect(page.getByRole('heading', { name: 'Create Event' })).toBeVisible();
  // Ensure date field is prefilled with an ISO-like string
  const val = await page.getByLabel('Date').inputValue();
  expect(val).toMatch(/\d{4}-\d{2}-\d{2}/);
});

test('overlay does not block drag: pointer-events disabled during drag', async ({ page }) => {
  test.setTimeout(20_000);
  await clearAndReload(page);
  // Seed two far-apart events so one appears on the right side (outside overlay)
  await page.evaluate((key) => {
    const events = [
      { id: 'left', date: '2024-01-01', title: 'Left' },
      { id: 'right', date: '2026-12-31', title: 'Right' },
    ];
    localStorage.setItem(key, JSON.stringify(events));
  }, STORAGE_KEY);
  await page.reload();

  // Open Outline overlay to have an overlay present
  await page.getByRole('button', { name: 'Outline' }).click();
  const overlay = page.locator('aside').nth(1);
  await expect(overlay).toBeVisible();
  const ob = await overlay.boundingBox();
  if (!ob) throw new Error('no overlay bbox');

  // Pick the explicitly seeded right event by id
  const node = page.locator('svg rect[data-event-id="right"]');
  const nb = await node.boundingBox();
  if (!nb) throw new Error('no bbox for right node');
  // Ensure it's to the right of the overlay
  expect(nb.x).toBeGreaterThan(ob.x + ob.width + 5);

  // Start drag on the rightmost event
  await page.mouse.move(nb.x + nb.width / 2, nb.y + nb.height / 2);
  await page.mouse.down();
  await page.mouse.move(nb.x + nb.width / 2 - 60, nb.y + nb.height / 2, { steps: 3 });

  // While dragging, the app sets body[data-dragging] which enforces overlay pointer-events: none via CSS
  await expect.poll(async () => page.evaluate(() => document.body.getAttribute('data-dragging') || '')).toBe('1');

  await page.mouse.up();
  await expect.poll(async () => page.evaluate(() => document.body.getAttribute('data-dragging') || '')).toBe('');
});

test('plus affordance is small and appears near center line', async ({ page }) => {
  test.setTimeout(12_000);
  await clearAndReload(page);
  const svg = page.locator('svg');
  const box = await svg.boundingBox();
  if (!box) throw new Error('no svg bbox');
  // Move near the center line
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  const plus = page.locator('svg [data-testid="create-plus"]');
  await expect(plus).toBeVisible();
  const pbox = await plus.boundingBox();
  if (!pbox) throw new Error('no plus bbox');
  expect(pbox.width).toBeLessThan(30);
  expect(pbox.height).toBeLessThan(30);
});

test('axis labels/ticks adapt and stay under 12 labels', async ({ page }) => {
  test.setTimeout(15_000);
  await clearAndReload(page);
  // Ensure some events so Fit All keeps a span
  await page.evaluate((key) => {
    const events = [
      { id: 'a', date: '2023-01-01', title: 'A' },
      { id: 'b', date: '2025-12-01', title: 'B' },
    ];
    localStorage.setItem(key, JSON.stringify(events));
  }, STORAGE_KEY);
  await page.reload();
  const labels = page.locator('svg [data-testid="axis-label"]');
  const ticks = page.locator('svg [data-testid="axis-tick"]');
  const labelCount = await labels.count();
  const tickCount = await ticks.count();
  expect(labelCount).toBeLessThanOrEqual(12);
  expect(tickCount).toBeGreaterThanOrEqual(1);
});

test('keyboard nudge changes date and announces via aria-live', async ({ page }) => {
  test.setTimeout(20_000);
  await clearAndReload(page);
  await page.evaluate((key) => {
    const events = [ { id: 'k1', date: '2025-06-01', title: 'Key' } ];
    localStorage.setItem(key, JSON.stringify(events));
  }, STORAGE_KEY);
  await page.reload();

  const node = page.locator('svg rect[data-event-id]');
  await node.click();
  // Press ArrowRight
  await page.keyboard.press('ArrowRight');

  // aria-live region should announce; grab sr-only live region
  const live = page.locator('[aria-live="polite"]');
  await expect(live).toContainText('Date changed to');
});
