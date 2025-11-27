import { test, expect } from '@playwright/test';
import { loginAsTestUser, loadTestTimeline } from '../utils/timelineTestUtils';

async function openDevPanel(page: unknown) {
  
  await page.getByRole('button', { name: 'Developer Panel' }).click();
}

test.describe('JFK Fit-All overflow vs full-cards (semi-column)', () => {
  test('No semi-column shows 2 full cards plus overflow badge', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-LAYOUT-SEMICOL-001' });

    await page.goto('/');
    await openDevPanel(page);
    await page.getByRole('button', { name: 'JFK 1961-63' }).click();
    await page.keyboard.press('Escape'); // Close dev panel
    await page.waitForTimeout(600);

    // Fit All view
    await page.getByRole('button', { name: 'Fit All' }).click();
    await page.waitForTimeout(800);

    // Save a screenshot for analysis
    await page.screenshot({ path: 'test-results/jfk-fitall-overflow-semi.png' });

    // Evaluate DOM to detect any anchor (semi-column group) that has an overflow badge
    // while also having two or more FULL cards on the same side (above or below the axis)
    const bugCases = await page.evaluate(() => {
      const axis = document.querySelector('[data-testid="timeline-axis"]') as HTMLElement | null;
      const axisRect = axis?.getBoundingClientRect();
      const axisY = axisRect ? (axisRect.top + axisRect.height / 2) : (window.innerHeight / 2);

      const anchors = Array.from(document.querySelectorAll('[data-testid^="anchor-"]')) as HTMLElement[];
      const cards = Array.from(document.querySelectorAll('[data-testid="event-card"]')) as HTMLElement[];

      const cardInfos = cards.map((el) => {
        const r = el.getBoundingClientRect();
        const type = el.getAttribute('data-card-type') || '';
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, type };
      });

      const cases: Array<{ anchorId: string; side: 'above' | 'below'; fullCount: number }> = [];

      for (const anchorEl of anchors) {
        const id = anchorEl.getAttribute('data-testid') || '';
        const r = anchorEl.getBoundingClientRect();
        const anchorX = r.left + r.width / 2;

        // Only consider anchors that visibly show an overflow badge (unmerged)
        const overflowBadge = anchorEl.querySelector(`[data-testid="overflow-badge-${id}"]`);
        if (!overflowBadge) continue;

        // Consider cards "near" this anchor horizontally
        const NEAR_PX = 150; // heuristic window ~ half-column width
        const near = cardInfos.filter(ci => Math.abs(ci.x - anchorX) <= NEAR_PX);

        const aboveFull = near.filter(ci => ci.y < axisY && ci.type === 'full').length;
        const belowFull = near.filter(ci => ci.y >= axisY && ci.type === 'full').length;

        if (aboveFull >= 2) cases.push({ anchorId: id, side: 'above', fullCount: aboveFull });
        if (belowFull >= 2) cases.push({ anchorId: id, side: 'below', fullCount: belowFull });
      }

      return cases;
    });

    console.log(`JFK Fit-All: semi-columns with 2+ full cards and overflow: ${bugCases.length}`);
    if (bugCases.length > 0) {
      console.log('Cases:', bugCases);
    }

    // Expect none; if present, we reproduced the issue and this will fail
    expect(bugCases.length).toBe(0);
  });
});

