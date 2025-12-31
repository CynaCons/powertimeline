import { test, expect } from '@playwright/test';
import { loginAsTestUser, loadTestTimeline } from '../utils/timelineTestUtils';

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
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-CARDS-002' });

    await loginAsTestUser(page);
    await loadTestTimeline(page, 'timeline-rfk');

    // Wait for timeline to load and cards to render
    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible({ timeout: 10000 });

    const cards = await page.locator('[data-testid="event-card"]').elementHandles();
    expect(cards.length).toBeGreaterThan(0); // At least 1 card should be rendered

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

  test('Napoleon at Fit-All has no card overlaps', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-LAYOUT-001' });

    await loginAsTestUser(page);
    await loadTestTimeline(page, 'timeline-napoleon');
    await page.waitForTimeout(500);

    await page.locator('[data-testid="btn-fit-all"]').click();
    await page.waitForTimeout(500);

    const cards = await page.locator('[data-testid="event-card"]').elementHandles();
    expect(cards.length).toBeGreaterThan(0);

    const boxes: {x:number;y:number;w:number;h:number}[] = [];
    for (const h of cards) {
      const b = await h.boundingBox();
      if (b) boxes.push({ x: b.x, y: b.y, w: b.width, h: b.height });
    }

    let anyOverlap = false;
    for (let i = 0; i < boxes.length && !anyOverlap; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]; const b = boxes[j];
        const left = Math.max(a.x, b.x);
        const right = Math.min(a.x + a.w, b.x + b.w);
        const top = Math.max(a.y, b.y);
        const bottom = Math.min(a.y + a.h, b.y + b.h);
        const iw = right - left; const ih = bottom - top;
        if (iw > 0 && ih > 0) {
          anyOverlap = true;
          console.log(`Overlap detected between card ${i} and ${j}: iw=${iw.toFixed(1)}, ih=${ih.toFixed(1)}`);
          break;
        }
      }
    }

    expect(anyOverlap).toBe(false);
  });
});
