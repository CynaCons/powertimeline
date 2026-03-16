import { test, expect } from '@playwright/test';

/**
 * Test: Card Text Clipping on Full Cards
 *
 * Verifies that text within full-sized event cards is either fully visible
 * or gracefully truncated (line-clamped with ellipsis), not hard-clipped
 * at the bottom of the card.
 *
 * The fix adds:
 * - overflow-hidden on the card container to contain content
 * - flex-shrink-0 on title and date rows so they are never squeezed
 * - min-h-0 + flex-1 on description to allow it to shrink gracefully
 * - mt-auto on date to pin it to the bottom
 */
test.describe('Card text clipping', () => {
  test('full card text is not clipped beyond card bounds', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-CARD-TEXT-001' });

    // Load a public timeline with events that have long titles/descriptions
    await page.goto('/cynacons/timeline/french-revolution');
    await page.waitForLoadState('domcontentloaded');

    // Wait for event cards to render
    const eventCards = page.locator('[data-testid="event-card"]');
    await expect(eventCards.first()).toBeVisible({ timeout: 15000 });

    const cardCount = await eventCards.count();
    expect(cardCount).toBeGreaterThan(0);

    // Check all full-type cards for text overflow
    const fullCards = page.locator('[data-testid="event-card"][data-card-type="full"]');
    const fullCardCount = await fullCards.count();

    if (fullCardCount === 0) {
      // If no full cards visible, skip gracefully (timeline may have degraded all cards)
      test.skip();
      return;
    }

    // For each full card, verify text content is contained within card bounds
    for (let i = 0; i < Math.min(fullCardCount, 10); i++) {
      const card = fullCards.nth(i);
      const cardBox = await card.boundingBox();
      if (!cardBox) continue;

      // Check that card has overflow-hidden (content is contained)
      const overflowStyle = await card.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return computed.overflow;
      });
      expect(overflowStyle).toBe('hidden');

      // Verify the card's inner content doesn't visually overflow
      // by checking that any child elements are within the card's bounding box
      const childrenWithinBounds = await card.evaluate(el => {
        const cardRect = el.getBoundingClientRect();
        const children = el.querySelectorAll('h3, p, div');
        let allWithinBounds = true;
        for (const child of children) {
          const childRect = child.getBoundingClientRect();
          // Check if child bottom exceeds card bottom (with 1px tolerance for rounding)
          if (childRect.height > 0 && childRect.bottom > cardRect.bottom + 1) {
            allWithinBounds = false;
            break;
          }
        }
        return allWithinBounds;
      });

      expect(childrenWithinBounds).toBe(true);
    }
  });

  test('full card title uses line-clamp for graceful truncation', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-CARD-TEXT-002' });

    await page.goto('/cynacons/timeline/french-revolution');
    await page.waitForLoadState('domcontentloaded');

    const fullCards = page.locator('[data-testid="event-card"][data-card-type="full"]');
    await expect(fullCards.first()).toBeVisible({ timeout: 15000 }).catch(() => {
      // No full cards visible, skip
    });

    const fullCardCount = await fullCards.count();
    if (fullCardCount === 0) {
      test.skip();
      return;
    }

    // Verify that the title element has line-clamp CSS applied
    const firstCard = fullCards.first();
    const titleHasLineClamp = await firstCard.evaluate(el => {
      const title = el.querySelector('.card-title');
      if (!title) return false;
      const computed = window.getComputedStyle(title);
      // line-clamp sets -webkit-line-clamp and overflow: hidden
      return computed.overflow === 'hidden' &&
             computed.getPropertyValue('-webkit-line-clamp') !== 'none' &&
             computed.getPropertyValue('-webkit-line-clamp') !== '';
    });

    expect(titleHasLineClamp).toBe(true);
  });

  test('full card date is always visible (not pushed out)', async ({ page }) => {
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

    // Check up to 10 full cards
    for (let i = 0; i < Math.min(fullCardCount, 10); i++) {
      const card = fullCards.nth(i);
      const dateEl = card.locator('.card-date');
      const dateCount = await dateEl.count();

      if (dateCount > 0) {
        // Date element should exist and be within the card bounds
        const dateVisible = await card.evaluate(el => {
          const dateDiv = el.querySelector('.card-date');
          if (!dateDiv) return true; // No date, nothing to check
          const cardRect = el.getBoundingClientRect();
          const dateRect = dateDiv.getBoundingClientRect();
          // Date should be visible (bottom within card bounds, with 1px tolerance)
          return dateRect.bottom <= cardRect.bottom + 1 && dateRect.height > 0;
        });
        expect(dateVisible).toBe(true);
      }
    }
  });
});
