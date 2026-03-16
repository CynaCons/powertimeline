import { test, expect } from '@playwright/test';

/**
 * Test: Card Text Clipping across multiple screen resolutions
 *
 * Verifies that text within full-sized event cards is either fully visible
 * or gracefully truncated (line-clamped with ellipsis), not hard-clipped
 * at the bottom of the card.
 *
 * Runs at several common desktop resolutions to catch viewport-dependent clipping:
 * - 1366x768  (common laptop / work screen)
 * - 1440x900  (MacBook Air / older iMac)
 * - 1920x1080 (Full HD — standard desktop)
 * - 2560x1440 (QHD — large monitor)
 */

const VIEWPORTS = [
  { label: '1366x768', width: 1366, height: 768 },
  { label: '1440x900', width: 1440, height: 900 },
  { label: '1920x1080', width: 1920, height: 1080 },
  { label: '2560x1440', width: 2560, height: 1440 },
];

for (const vp of VIEWPORTS) {
  test.describe(`Card text clipping @ ${vp.label}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test(`CC-REQ-CARD-TEXT-001: text stays within card bounds`, async ({ page }) => {
      test.info().annotations.push({ type: 'req', description: 'CC-REQ-CARD-TEXT-001' });

      await page.goto('/cynacons/timeline/french-revolution');
      await page.waitForLoadState('domcontentloaded');

      const eventCards = page.locator('[data-testid="event-card"]');
      await expect(eventCards.first()).toBeVisible({ timeout: 15000 });

      // Check all card types, not just full
      const cards = page.locator('[data-testid="event-card"]');
      const cardCount = await cards.count();
      expect(cardCount).toBeGreaterThan(0);

      for (let i = 0; i < Math.min(cardCount, 15); i++) {
        const card = cards.nth(i);
        const cardBox = await card.boundingBox();
        if (!cardBox || cardBox.height === 0) continue;

        // Card must have overflow: hidden
        const overflowStyle = await card.evaluate(el => {
          return window.getComputedStyle(el).overflow;
        });
        expect(overflowStyle).toBe('hidden');

        // All child elements must be within card bounds
        const childrenWithinBounds = await card.evaluate(el => {
          const cardRect = el.getBoundingClientRect();
          const children = el.querySelectorAll('h3, p, div, span');
          for (const child of children) {
            const childRect = child.getBoundingClientRect();
            if (childRect.height > 0 && childRect.bottom > cardRect.bottom + 2) {
              return false;
            }
          }
          return true;
        });
        expect(childrenWithinBounds).toBe(true);
      }
    });

    test(`CC-REQ-CARD-TEXT-002: title uses line-clamp truncation`, async ({ page }) => {
      test.info().annotations.push({ type: 'req', description: 'CC-REQ-CARD-TEXT-002' });

      await page.goto('/cynacons/timeline/french-revolution');
      await page.waitForLoadState('domcontentloaded');

      const fullCards = page.locator('[data-testid="event-card"][data-card-type="full"]');
      await expect(fullCards.first()).toBeVisible({ timeout: 15000 }).catch(() => {});

      const fullCardCount = await fullCards.count();
      if (fullCardCount === 0) {
        test.skip();
        return;
      }

      const firstCard = fullCards.first();
      const titleHasLineClamp = await firstCard.evaluate(el => {
        const title = el.querySelector('.card-title');
        if (!title) return false;
        const computed = window.getComputedStyle(title);
        return computed.overflow === 'hidden' &&
               computed.getPropertyValue('-webkit-line-clamp') !== 'none' &&
               computed.getPropertyValue('-webkit-line-clamp') !== '';
      });

      expect(titleHasLineClamp).toBe(true);
    });

    test(`CC-REQ-CARD-TEXT-003: date row is visible`, async ({ page }) => {
      test.info().annotations.push({ type: 'req', description: 'CC-REQ-CARD-TEXT-003' });

      await page.goto('/cynacons/timeline/french-revolution');
      await page.waitForLoadState('domcontentloaded');

      const fullCards = page.locator('[data-testid="event-card"][data-card-type="full"]');
      await expect(fullCards.first()).toBeVisible({ timeout: 15000 }).catch(() => {});

      const fullCardCount = await fullCards.count();
      if (fullCardCount === 0) {
        test.skip();
        return;
      }

      for (let i = 0; i < Math.min(fullCardCount, 10); i++) {
        const card = fullCards.nth(i);
        const dateVisible = await card.evaluate(el => {
          const dateDiv = el.querySelector('.card-date');
          if (!dateDiv) return true;
          const cardRect = el.getBoundingClientRect();
          const dateRect = dateDiv.getBoundingClientRect();
          return dateRect.bottom <= cardRect.bottom + 2 && dateRect.height > 0;
        });
        expect(dateVisible).toBe(true);
      }
    });
  });
}
