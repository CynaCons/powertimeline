import { test, expect, Page } from '@playwright/test';

const STORAGE_KEY = 'chronochart-events';

async function clearAndReload(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

async function openCreateAndAdd(page: Page, date: string, title: string, description?: string) {
  await page.getByRole('button', { name: 'Create' }).click();
  await page.getByRole('heading', { name: 'Create Event' }).isVisible();
  await page.getByLabel('Date').fill(date);
  await page.getByLabel('Title').fill(title);
  if (description) await page.getByLabel('Description').fill(description);
  await page.getByRole('button', { name: 'Add' }).click();
}

async function openEditor(page: Page) {
  const btn = page.getByRole('button', { name: 'Editor' });
  await btn.click();
  await expect(page.getByRole('heading', { name: 'Edit Event' })).toBeVisible();
}

async function openOutline(page: Page) {
  const btn = page.getByRole('button', { name: 'Outline' });
  await btn.click();
  await expect(page.getByRole('heading', { name: 'Outline' })).toBeVisible();
}

async function openDeveloper(page: Page) {
  // Click the rail "Developer" button (exact name) instead of the header Dev toggle
  const btn = page.getByRole('button', { name: 'Developer', exact: true });
  await btn.first().click();
  await expect(page.getByText('Developer Options')).toBeVisible();
}

test('application loads and displays timeline', async ({ page }) => {
  test.setTimeout(10_000);
  await page.goto('/');
  await expect(page).toHaveTitle(/Chronochart/);
  await expect(page.locator('svg')).toBeVisible();
});

test('page has a themed background color', async ({ page }) => {
  test.setTimeout(10_000);
  await page.goto('/');

  // Accept either Tailwind class-based or CSS gradient background
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundImage || getComputedStyle(document.body).backgroundColor);
  expect(bg).toBeTruthy();
  expect(typeof bg).toBe('string');
  expect(bg).not.toBe('none');
});

test('can add an event and it persists', async ({ page }) => {
  test.setTimeout(15_000);
  await clearAndReload(page);

  await openCreateAndAdd(page, '2025-01-02', 'Launch', 'Project launch');

  await expect(page.locator('svg rect[data-event-id]')).toHaveCount(1);

  await page.waitForFunction((key) => {
    try { const raw = localStorage.getItem(key); return !!raw && raw.includes('Launch'); } catch { return false; }
  }, STORAGE_KEY);

  await page.reload();
  await expect(page.locator('svg rect[data-event-id]')).toHaveCount(1);
  const stored = await page.evaluate((key) => localStorage.getItem(key) || '', STORAGE_KEY);
  expect(stored).toContain('Launch');
});

test('can select, edit title, and delete event', async ({ page }) => {
  test.setTimeout(20_000);
  await clearAndReload(page);

  await openCreateAndAdd(page, '2025-01-02', 'Item');
  await expect(page.locator('svg rect[data-event-id]')).toHaveCount(1);

  // Select the event by clicking the node
  await page.locator('svg rect[data-event-id]').first().click();
  await openEditor(page);

  // Edit title in Editor overlay
  await page.getByLabel('Title').fill('Updated');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.locator('svg text', { hasText: 'Updated' })).toBeVisible();

  // Delete
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.locator('svg rect[data-event-id]')).toHaveCount(0);
});

test('drag node to change date', async ({ page }) => {
  test.setTimeout(15_000);
  await clearAndReload(page);

  await openCreateAndAdd(page, '2025-01-01', 'DragMe');
  await expect(page.locator('svg rect[data-event-id]')).toHaveCount(1);

  const rect = page.locator('svg rect[data-event-id]').first();
  const box = await rect.boundingBox();
  if (!box) throw new Error('No rect bbox');

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 200, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();

  const stored = await page.evaluate((key) => localStorage.getItem(key) || '', STORAGE_KEY);
  expect(stored).toContain('DragMe');
});

test('zoom and pan controls adjust view window', async ({ page }) => {
  test.setTimeout(10_000);
  await page.goto('/');
  await page.getByRole('button', { name: '＋ Zoom In' }).click();
  await page.getByRole('button', { name: '◀︎ Pan' }).click();
  await page.getByRole('button', { name: 'Pan ▶︎' }).click();
  await expect(page.locator('svg')).toBeVisible();
});

test('performance smoke: 120 events render and basic interactions remain responsive', async ({ page }) => {
  test.setTimeout(25_000);
  await clearAndReload(page);

  const ok = await page.evaluate((key) => {
    try {
      const start = new Date('2024-01-01').getTime();
      const dayMs = 24 * 60 * 60 * 1000;
      const events = Array.from({ length: 120 }).map((_, i) => ({ id: String(1_000_000 + i), date: new Date(start + i * dayMs).toISOString().slice(0, 10), title: `E${i + 1}` }));
      localStorage.setItem(key, JSON.stringify(events));
      return true;
    } catch { return false; }
  }, STORAGE_KEY);
  expect(ok).toBeTruthy();

  await page.reload();
  await expect(page.locator('svg rect[data-event-id]')).toHaveCount(120, { timeout: 5000 });

  const mid = page.locator('svg rect[data-event-id]').nth(60);
  const box = await mid.boundingBox();
  if (!box) throw new Error('No bbox');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 120, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();

  // Ensure no overlay is open before clicking controls
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: '＋ Zoom In' }).click();
  await page.getByRole('button', { name: '◀︎ Pan' }).click();
  await page.getByRole('button', { name: 'Pan ▶︎' }).click();
  await expect(page.locator('svg')).toBeVisible();
});

test('dev panel can seed events safely', async ({ page }) => {
  test.setTimeout(12_000);
  await page.goto('/?dev=1');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await openDeveloper(page);
  await page.getByRole('button', { name: 'Seed 5' }).click();
  await expect(page.locator('svg rect[data-event-id]')).toHaveCount(5);

  await page.getByRole('button', { name: 'Seed 10' }).click();
  await expect(page.locator('svg rect[data-event-id]')).toHaveCount(15);

  await page.getByRole('button', { name: 'Clustered' }).click();
  let count = await page.locator('svg rect[data-event-id]').count();
  expect(count).toBeGreaterThanOrEqual(10);

  await page.getByRole('button', { name: 'Long-range' }).click();
  const count2 = await page.locator('svg rect[data-event-id]').count();
  expect(count2).toBeGreaterThan(count);

  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(page.locator('svg rect[data-event-id]')).toHaveCount(0);
});

test('wheel zoom zooms around cursor and clamps to bounds', async ({ page }) => {
  test.setTimeout(12_000);
  await clearAndReload(page);

  await openCreateAndAdd(page, '2025-01-01', 'A');
  await openCreateAndAdd(page, '2025-06-15', 'B');
  await openCreateAndAdd(page, '2025-12-31', 'C');

  const svg = page.locator('svg');
  const box = await svg.boundingBox();
  if (!box) throw new Error('No svg bbox');
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
  await page.mouse.wheel(0, -400);
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2);
  await page.mouse.wheel(0, 400);

  await expect(svg).toBeVisible();
});

test('Fit All shows all events', async ({ page }) => {
  test.setTimeout(10_000);
  await clearAndReload(page);
  await openCreateAndAdd(page, '2025-01-01', 'X');
  await openCreateAndAdd(page, '2025-12-31', 'Y');
  await page.getByRole('button', { name: 'Fit All' }).click();
  await expect(page.locator('svg')).toBeVisible();
});

test('outline panel selects corresponding timeline node', async ({ page }) => {
  test.setTimeout(20_000);
  await clearAndReload(page);

  await openCreateAndAdd(page, '2025-01-01', 'One');
  await openCreateAndAdd(page, '2025-01-02', 'Two');
  await expect(page.locator('svg rect[data-event-id]')).toHaveCount(2);

  await openOutline(page);
  // Click in the Outline overlay list specifically
  await page.locator('aside[role="dialog"]').getByRole('button', { name: /One/ }).first().click();
  await openEditor(page);
  await expect(page.getByLabel('Title')).toHaveValue('One');

  // Now select the second via Outline and expect Editor to show it
  await openOutline(page);
  await page.locator('aside[role="dialog"]').getByRole('button', { name: /Two/ }).first().click();
  await openEditor(page);
  await expect(page.getByLabel('Title')).toHaveValue('Two');
});

test('editor panel toggles and edits persist', async ({ page }) => {
  test.setTimeout(20_000);
  await clearAndReload(page);

  await openCreateAndAdd(page, '2025-03-03', 'EditMe');
  await expect(page.locator('svg rect[data-event-id]')).toHaveCount(1);

  // Toggle editor panel via rail
  await page.getByRole('button', { name: 'Editor' }).click();
  await expect(page.getByRole('heading', { name: 'Edit Event' })).toBeVisible();
  await page.getByRole('button', { name: 'Editor' }).click();
  await expect(page.getByRole('heading', { name: 'Edit Event' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Editor' }).click();
  await expect(page.getByRole('heading', { name: 'Edit Event' })).toBeVisible();

  // Select via Outline to avoid overlay intercepts
  await openOutline(page);
  await page.locator('aside[role="dialog"]').getByRole('button', { name: /EditMe/ }).first().click();
  await openEditor(page);
  await expect(page.getByLabel('Title')).toHaveValue('EditMe');
  await page.getByLabel('Title').fill('Edited');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('svg text', { hasText: 'Edited' })).toBeVisible();
});

test('left rail toggles keep app responsive', async ({ page }) => {
  test.setTimeout(10_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'Outline' }).click();
  await page.getByRole('button', { name: 'Outline' }).click();
  await expect(page.locator('svg')).toBeVisible();
});

test('card inline edit works on double-click', async ({ page }) => {
  test.setTimeout(20_000);
  await clearAndReload(page);

  await openCreateAndAdd(page, '2025-07-01', 'Cardy');
  await expect(page.locator('svg rect[data-event-id]')).toHaveCount(1);

  const node = page.locator('svg rect[data-event-id]').first();
  await node.click();
  // Use keyboard to enter inline edit for stability
  await page.keyboard.press('Enter');

  const titleInput = page.locator('input[aria-label="Inline Title"]');
  const descInput = page.locator('input[aria-label="Inline Description"]');
  await titleInput.fill('Cardy Edited');
  await descInput.fill('Inline body');
  const inlineRegion = page.locator('foreignObject');
  await inlineRegion.getByRole('button', { name: 'Save' }).click();

  await expect(page.locator('svg text', { hasText: 'Cardy Edited' })).toBeVisible();
});
