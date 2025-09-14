import { test, expect } from '@playwright/test';

test.describe('v5/52 Side panel scroll behavior', () => {
  test('scroll wheel over Events panel scrolls the panel (not the canvas)', async ({ page }) => {
    await page.goto('/');

    // Seed many events so the Events list overflows
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    for (let i = 0; i < 8; i++) {
      await page.getByRole('button', { name: '+12' }).click();
    }
    // Leave Dev open or close; it shouldn't matter for the test

    // Open Events panel
    await page.locator('button[aria-label="Events"]').click();

    // Find an actual scrollable descendant inside the Events aside
    const aside = page.locator('aside[role="dialog"][aria-labelledby="dialog-title-events"]');
    await expect(aside).toBeVisible();

    await page.evaluate(() => {
      const aside = document.querySelector('aside[role="dialog"][aria-labelledby="dialog-title-events"]');
      if (!aside) return;
      const isScrollable = (el: Element) => {
        const cs = window.getComputedStyle(el as HTMLElement);
        const oy = cs.overflowY;
        const yScroll = (el as HTMLElement).scrollHeight > (el as HTMLElement).clientHeight;
        return yScroll && (oy === 'auto' || oy === 'scroll');
      };
      // breadth-first search for a scrollable descendant
      const q: Element[] = Array.from(aside.children);
      let found: HTMLElement | null = null;
      while (q.length && !found) {
        const el = q.shift()!;
        if (isScrollable(el)) found = el as HTMLElement;
        else q.push(...Array.from(el.children));
      }
      (found || aside).setAttribute('data-test-scroll', '1');
    });

    const panelScroll = page.locator('aside[role="dialog"][aria-labelledby="dialog-title-events"] [data-test-scroll="1"]');
    await expect(panelScroll).toBeVisible();

    // Hover the scrollable element and perform a wheel scroll
    const beforeTop = await panelScroll.evaluate((el) => (el as HTMLElement).scrollTop);
    await panelScroll.hover();
    await page.mouse.wheel(0, 800);
    const afterTop = await panelScroll.evaluate((el) => (el as HTMLElement).scrollTop);
    expect(afterTop).toBeGreaterThan(beforeTop);
  });
});
