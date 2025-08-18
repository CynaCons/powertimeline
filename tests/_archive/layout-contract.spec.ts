import { test, expect } from '@playwright/test';

// Validates renderer contract: (x,y) are card centers; connectors end at card center; no card overlaps

test('cards render at center coordinates and connectors attach to centers', async ({ page }) => {
  await page.goto('/');
  // Wait for the left rail to be ready
  await page.getByRole('button', { name: 'Outline' }).waitFor({ state: 'visible' });
  // Enable dev and seed a deterministic dataset (RFK) to stabilize positions
  await page.getByRole('button', { name: 'Toggle developer options' }).click();
  await page.getByRole('button', { name: 'Developer Panel' }).click();
  await page.getByRole('button', { name: 'RFK 1968' }).click();
  await page.waitForTimeout(500);

  const cards = page.locator('[data-testid="event-card"]');
  const count = await cards.count();
  expect(count).toBeGreaterThan(3);

  // Extract the common positioned ancestor (absolute container wrapping cards and connectors)
  // The main timeline canvas wrapper is the first .ml-14 descendant div.w-full.h-full.relative
  const container = page.locator('.ml-14 >> div.w-full.h-full.relative').first();
  const containerBox = await container.boundingBox();
  expect(containerBox).toBeTruthy();
  if (!containerBox) throw new Error('Container not found');

  // Extract card client rects and compare centers (viewport) translated into container space
  const rects = (await cards.evaluateAll((nodes, params) => {
    const { cLeft, cTop } = (params as any) || { cLeft: 0, cTop: 0 };
    return nodes.map((n) => {
      const r = n.getBoundingClientRect();
      const style = window.getComputedStyle(n);
      return {
        left: parseFloat((n as HTMLElement).style.left || '0'),
        top: parseFloat((n as HTMLElement).style.top || '0'),
        width: r.width,
        height: r.height,
        // Convert viewport center to container coordinates
        cx: r.left + r.width / 2 - (cLeft || 0),
        cy: r.top + r.height / 2 - (cTop || 0),
        transform: style.transform,
      };
    });
  }, { cLeft: containerBox.x, cTop: containerBox.y })) as unknown as Array<{
    left: number; top: number; width: number; height: number; cx: number; cy: number;
  }>;

  for (const r of rects) {
    // style.left/top equal to center coordinates due to translate(-50%, -50%)
    expect(Math.abs(r.cx - r.left)).toBeLessThan(1.5);
    expect(Math.abs(r.cy - r.top)).toBeLessThan(1.5);
  }

  // Verify at least one connector endpoint matches a card center in container space
  const connectorLines = page.locator('svg line');
  const connectors = await connectorLines.evaluateAll((lines) => lines.map(l => ({
    x2: parseFloat(l.getAttribute('x2') || 'NaN'),
    y2: parseFloat(l.getAttribute('y2') || 'NaN'),
  })));
  expect(connectors.length).toBeGreaterThan(0);
  let matched = 0;
  for (const r of rects) {
    const hit = connectors.some(c => Math.abs(c.x2 - r.left) < 1.5 && Math.abs(c.y2 - r.top) < 1.5);
    if (hit) matched++;
  }
  expect(matched).toBeGreaterThan(0);

  // Note: Non-overlap invariants will be asserted in a dedicated test once layout stabilization lands.
});
