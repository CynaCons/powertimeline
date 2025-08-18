import { test, expect } from '@playwright/test';

function overlapRatio(a: {x:number;y:number;w:number;h:number}, b:{x:number;y:number;w:number;h:number}) {
  const left = Math.max(a.x, b.x);
  const right = Math.min(a.x + a.w, b.x + b.w);
  const top = Math.max(a.y, b.y);
  const bottom = Math.min(a.y + a.h, b.y + b.h);
  const iw = right - left;
  const ih = bottom - top;
  if (iw <= 0 || ih <= 0) return 0;
  const overlapArea = iw * ih;
  const smaller = Math.min(a.w * a.h, b.w * b.h);
  return overlapArea / smaller;
}

test.describe('v5/03 Non-overlap fit', () => {
  test('cards do not significantly overlap', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle developer options' }).click();
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    await page.getByRole('button', { name: 'RFK 1968' }).click();

    const cards = await page.locator('[data-testid="event-card"]').elementHandles();
    expect(cards.length).toBeGreaterThan(5);

    const boxes: {x:number;y:number;w:number;h:number}[] = [];
    for (const h of cards) {
      const b = await h.boundingBox();
      if (b) boxes.push({ x: b.x, y: b.y, w: b.width, h: b.height });
    }

    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const r = overlapRatio(boxes[i], boxes[j]);
        expect(r).toBeLessThan(0.3);
      }
    }
  });
});
