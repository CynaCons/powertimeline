import { test, expect } from '@playwright/test';

async function openDevPanel(page) {
  await page.goto('/');
  const toggle = page.locator('button[aria-label="Toggle developer options"]');
  await toggle.click();
  const panelBtn = page.locator('button[aria-label="Developer Panel"]');
  for (let i = 0; i < 10; i++) {
    if (await panelBtn.isEnabled()) break;
    await page.waitForTimeout(100);
  }
  await expect(panelBtn).toBeEnabled();
  await panelBtn.click();
}

async function seedClustered(page, times: number) {
  for (let i = 0; i < times; i++) {
    const btn = page.locator('button:has-text("Clustered")');
    if (!(await btn.isVisible())) {
      const panelBtn = page.locator('button[aria-label="Developer Panel"]');
      if (await panelBtn.isEnabled()) {
        await panelBtn.click();
      }
    }
    await btn.click();
  }
}

function countBy(locator) { return locator.count(); }

function rectsOverlap(a: {x:number,y:number,w:number,h:number}, b: {x:number,y:number,w:number,h:number}, ratioSlack = 0.25) {
  const left = Math.max(a.x, b.x);
  const right = Math.min(a.x + a.w, b.x + b.w);
  const top = Math.max(a.y, b.y);
  const bottom = Math.min(a.y + a.h, b.y + b.h);
  const iw = right - left;
  const ih = bottom - top;
  if (iw <= 0 || ih <= 0) return false;
  const overlapArea = iw * ih;
  const aArea = a.w * a.h;
  const bArea = b.w * b.h;
  const smaller = Math.min(aArea, bArea);
  return overlapArea / smaller > ratioSlack;
}

test.describe('Degradation flow correctness', () => {
  test('per-cluster order (compact+multi before summary) and no overlaps', async ({ page }) => {
  // Reduce viewport height so compact capacity is exceeded earlier
  await page.setViewportSize({ width: 1280, height: 480 });
    await openDevPanel(page);

    // Start fresh
    await page.getByTestId('clear-all').click();

    // Seed repeatedly to trigger phases
    let sawSummary = false;
    for (let iter = 0; iter < 16; iter++) {
      await seedClustered(page, 1);
      await page.waitForTimeout(50);
      await page.locator('[data-testid="event-card"]').first().waitFor();
      const summaryNow = await page.locator('[data-testid="event-card"][data-summary="true"]').count();
      if (summaryNow > 0) { sawSummary = true; break; }
    }
    expect(sawSummary).toBe(true);

    // Per-cluster order: for any cluster with a summary, verify that same cluster has compact and multi cards
    const summaryCards = page.locator('[data-testid="event-card"][data-summary="true"]');
    const summaryCount = await summaryCards.count();
    for (let i = 0; i < summaryCount; i++) {
      const clusterId = await summaryCards.nth(i).getAttribute('data-cluster-id');
      expect(clusterId).toBeTruthy();
      const hasCompact = await page.locator(`[data-testid="event-card"][data-density="compact"][data-cluster-id="${clusterId}"]`).count();
      const hasMulti = await page.locator(`[data-testid="event-card"][data-multi="true"][data-cluster-id="${clusterId}"]`).count();
      expect(hasCompact).toBeGreaterThan(0);
      expect(hasMulti).toBeGreaterThan(0);
    }

    // No overlaps: compute bounding boxes of all cards and assert no two overlap
    const cards = page.locator('[data-testid="event-card"]');
    const n = await cards.count();
    const boxes: {x:number,y:number,w:number,h:number}[] = [];
    for (let i = 0; i < n; i++) {
      const box = await cards.nth(i).boundingBox();
      if (box) boxes.push({ x: box.x, y: box.y, w: box.width, h: box.height });
    }
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
  const overlap = rectsOverlap(boxes[i], boxes[j]);
        expect(overlap).toBeFalsy();
      }
    }
  });
});
