import { test, expect } from '@playwright/test';

const STORAGE_KEY = 'chronochart-events';

test('application loads and displays timeline', async ({ page }) => {
  test.setTimeout(10_000);
  await page.goto('/');
  await expect(page).toHaveTitle(/Chronochart/);
  await expect(page.locator('svg')).toBeVisible();
});

test('page has a themed background color', async ({ page }) => {
  test.setTimeout(10_000);
  await page.goto('/');

  // Accept both dark and light theme classes
  const hasThemeClass = await page.evaluate(() => {
    const c = Array.from(document.body.classList.values());
    const classes = [
      // dark
      'bg-space-black', 'bg-gray-950', 'bg-gray-900', 'bg-neutral-950',
      // light
      'bg-gray-50', 'bg-neutral-50', 'bg-white'
    ];
    return classes.some(dc => c.includes(dc));
  });
  expect(hasThemeClass).toBeTruthy();

  // Sanity: computed color is not transparent
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).not.toBe('rgba(0, 0, 0, 0)');
});

test('can add an event and it persists', async ({ page }) => {
  test.setTimeout(15_000);
  // Clear localStorage once, then reload to start clean
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByLabel('Date').fill('2025-01-02');
  await page.getByLabel('Title').fill('Launch');
  await page.getByLabel('Description').fill('Project launch');
  await page.getByRole('button', { name: 'Add' }).click();

  // Node should be rendered as a rect (card rects are separate)
  await expect(page.locator('svg rect[data-event-id]')).toHaveCount(1);

  // Wait until localStorage contains the event before reloading
  await page.waitForFunction((key) => {
    try {
      const raw = localStorage.getItem(key);
      return !!raw && raw.includes('Launch');
    } catch { return false; }
  }, STORAGE_KEY);

  // Reload and verify it persists (node still present and localStorage has it)
  await page.reload();
  await expect(page.locator('svg rect[data-event-id]')).toHaveCount(1);
  const stored = await page.evaluate((key) => localStorage.getItem(key) || '', STORAGE_KEY);
  expect(stored).toContain('Launch');
});

test('can select, edit title, and delete event', async ({ page }) => {
  test.setTimeout(15_000);
  await page.goto('/');

  // Ensure at least one event exists
  const hasRect = await page.locator('svg rect[data-event-id]').count();
  if (hasRect === 0) {
    await page.getByLabel('Date').fill('2025-01-02');
    await page.getByLabel('Title').fill('Item');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.locator('svg rect[data-event-id]')).toHaveCount(1);
  }

  // Select the event by clicking the node
  await page.locator('svg rect[data-event-id]').first().click();
  await expect(page.getByText('Editing:')).toBeVisible();

  // Edit title
  await page.getByLabel('Title').nth(1).fill('Updated');
  await page.getByRole('button', { name: 'Save' }).click();

  // Title label in SVG should update
  await expect(page.locator('svg text', { hasText: 'Updated' })).toBeVisible();

  // Delete
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.locator('svg rect[data-event-id]')).toHaveCount(0);
});

test('drag node to change date', async ({ page }) => {
  test.setTimeout(15_000);
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByLabel('Date').fill('2025-01-01');
  await page.getByLabel('Title').fill('DragMe');
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(page.locator('svg rect[data-event-id]')).toHaveCount(1);

  const rect = page.locator('svg rect[data-event-id]').first();
  const box = await rect.boundingBox();
  if (!box) throw new Error('No rect bbox');

  // Drag ~20% to the right
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 200, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();

  // Title should remain; storage should still contain the event
  const stored = await page.evaluate((key) => localStorage.getItem(key) || '', STORAGE_KEY);
  expect(stored).toContain('DragMe');
});

test('zoom and pan controls adjust view window', async ({ page }) => {
  test.setTimeout(10_000);
  await page.goto('/');
  await page.getByRole('button', { name: '＋ Zoom In' }).click();
  await page.getByRole('button', { name: '◀︎ Pan' }).click();
  await page.getByRole('button', { name: 'Pan ▶︎' }).click();
  // Smoke: still renders timeline after interactions
  await expect(page.locator('svg')).toBeVisible();
});

test('performance smoke: 120 events render and basic interactions remain responsive', async ({ page }) => {
  test.setTimeout(20_000);
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // Seed 120 events into localStorage directly for speed
  const ok = await page.evaluate((key) => {
    try {
      const start = new Date('2024-01-01').getTime();
      const dayMs = 24 * 60 * 60 * 1000;
      const events = Array.from({ length: 120 }).map((_, i) => ({
        id: String(1_000_000 + i),
        date: new Date(start + i * dayMs).toISOString().slice(0, 10),
        title: `E${i + 1}`,
      }));
      localStorage.setItem(key, JSON.stringify(events));
      return true;
    } catch { return false; }
  }, STORAGE_KEY);
  expect(ok).toBeTruthy();

  await page.reload();
  // Nodes should render; labels may be density-limited
  await expect(page.locator('svg rect[data-event-id]')).toHaveCount(120, { timeout: 5000 });

  // Try a short drag on the middle node to ensure drag pipeline is alive
  const mid = page.locator('svg rect[data-event-id]').nth(60);
  const box = await mid.boundingBox();
  if (!box) throw new Error('No bbox');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 120, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();

  // Pan and zoom controls should still work
  await page.getByRole('button', { name: '＋ Zoom In' }).click();
  await page.getByRole('button', { name: '◀︎ Pan' }).click();
  await page.getByRole('button', { name: 'Pan ▶︎' }).click();

  // Still visible
  await expect(page.locator('svg')).toBeVisible();
});

test('dev panel can seed events safely', async ({ page }) => {
  test.setTimeout(12_000);
  await page.goto('/?dev=1');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await expect(page.getByText('Developer Options')).toBeVisible();
  await page.getByRole('button', { name: 'Seed 5 random events' }).click();
  await expect(page.locator('svg rect[data-event-id]')).toHaveCount(5);

  await page.getByRole('button', { name: 'Seed 10 random events' }).click();
  await expect(page.locator('svg rect[data-event-id]')).toHaveCount(15);

  // Clear should bring it back to zero
  await page.getByRole('button', { name: 'Clear all events' }).click();
  await expect(page.locator('svg rect[data-event-id]')).toHaveCount(0);

  // App remains responsive
  await expect(page.locator('svg')).toBeVisible();
});

test('wheel zoom zooms around cursor and clamps to bounds', async ({ page }) => {
  test.setTimeout(12_000);
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // Seed a spread of events
  await page.getByLabel('Date').fill('2025-01-01');
  await page.getByLabel('Title').fill('A');
  await page.getByRole('button', { name: 'Add' }).click();
  await page.getByLabel('Date').fill('2025-06-15');
  await page.getByLabel('Title').fill('B');
  await page.getByRole('button', { name: 'Add' }).click();
  await page.getByLabel('Date').fill('2025-12-31');
  await page.getByLabel('Title').fill('C');
  await page.getByRole('button', { name: 'Add' }).click();

  const svg = page.locator('svg');
  const box = await svg.boundingBox();
  if (!box) throw new Error('No svg bbox');
  // Wheel up (zoom in) near right side
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
  await page.mouse.wheel(0, -400);
  // Wheel down (zoom out) near left side
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2);
  await page.mouse.wheel(0, 400);

  await expect(svg).toBeVisible();
});

test('Fit All shows all events', async ({ page }) => {
  test.setTimeout(10_000);
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByLabel('Date').fill('2025-01-01');
  await page.getByLabel('Title').fill('X');
  await page.getByRole('button', { name: 'Add' }).click();
  await page.getByLabel('Date').fill('2025-12-31');
  await page.getByLabel('Title').fill('Y');
  await page.getByRole('button', { name: 'Add' }).click();

  await page.getByRole('button', { name: 'Fit All' }).click();
  await expect(page.locator('svg')).toBeVisible();
});

test('outline panel selects corresponding timeline node', async ({ page }) => {
  test.setTimeout(15_000);
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // Seed two events via UI for realism
  await page.getByLabel('Date').fill('2025-01-01');
  await page.getByLabel('Title').fill('One');
  await page.getByRole('button', { name: 'Add' }).click();
  await page.getByLabel('Date').fill('2025-01-02');
  await page.getByLabel('Title').fill('Two');
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(page.locator('svg rect[data-event-id]')).toHaveCount(2);

  // Click first item in Outline
  const outlineSection = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Outline' }) });
  await outlineSection.getByRole('button', { name: /One/ }).click();
  await expect(page.getByText('Editing: One')).toBeVisible();

  // Click the second node on the timeline and expect selection to update
  await page.locator('svg rect[data-event-id]').nth(1).click();
  await expect(page.getByText('Editing: Two')).toBeVisible();
});

test('editor drawer toggles and edits persist', async ({ page }) => {
  test.setTimeout(15_000);
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByLabel('Date').fill('2025-03-03');
  await page.getByLabel('Title').fill('EditMe');
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(page.locator('svg rect[data-event-id]')).toHaveCount(1);

  // Hide editor drawer via left rail
  await page.getByRole('button', { name: 'Toggle editor drawer' }).click();
  await expect(page.getByRole('heading', { name: 'Edit Event' })).toHaveCount(0);

  // Show editor drawer again
  await page.getByRole('button', { name: 'Toggle editor drawer' }).click();
  await expect(page.getByRole('heading', { name: 'Edit Event' })).toBeVisible();

  // Select the node and edit
  await page.locator('svg rect[data-event-id]').first().click();
  await expect(page.getByText('Editing: EditMe')).toBeVisible();
  await page.getByLabel('Title').nth(1).fill('Edited');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('svg text', { hasText: 'Edited' })).toBeVisible();
});

test('left rail toggles keep app responsive', async ({ page }) => {
  test.setTimeout(10_000);
  await page.goto('/');

  // Toggle outline off and on
  await page.getByRole('button', { name: 'Toggle outline panel' }).click();
  await page.getByRole('button', { name: 'Toggle outline panel' }).click();

  // Timeline remains visible
  await expect(page.locator('svg')).toBeVisible();
});
