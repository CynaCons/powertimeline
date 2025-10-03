import { test, expect } from '@playwright/test';

/**
 * Test 40: Card Color System Validation
 * Confirms the border color conventions for the supported card types.
 */

test('card color system reflects card types', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.absolute.inset-0.ml-14', { timeout: 10_000 });

  const cards = await page.locator('[data-testid="event-card"]').all();
  expect(cards.length).toBeGreaterThan(0);

  const maxCardsToCheck = Math.min(cards.length, 10);
  const summary = { full: 0, compact: 0, 'title-only': 0, other: 0 } as Record<string, number>;

  for (let i = 0; i < maxCardsToCheck; i++) {
    const card = cards[i];
    const cardType = await card.getAttribute('data-card-type');
    const className = (await card.getAttribute('class')) ?? '';

    switch (cardType) {
      case 'full':
        expect(className).toContain('border-l-blue-500');
        summary.full++;
        break;
      case 'compact':
        expect(className).toContain('border-l-green-500');
        summary.compact++;
        break;
      case 'title-only':
        expect(className).toContain('border-l-yellow-500');
        summary['title-only']++;
        break;
      default:
        summary.other++;
    }
  }

  console.log('Card color summary', summary);
  expect(summary.other).toBe(0);
});
