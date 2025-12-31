import { test, expect } from '@playwright/test';

/**
 * Test Suite: Mixed Card Types in Semi-Columns (v0.3.6.2)
 *
 * Validates that semi-columns can mix different card types (full, compact, title-only)
 * to optimize space usage and reduce unnecessary degradation.
 *
 * Requirements:
 * - CC-REQ-MIXED-CARDS-001: Semi-columns support mixed card types
 * - CC-REQ-MIXED-CARDS-002: Chronological priority (earliest events get full cards)
 * - CC-REQ-MIXED-CARDS-003: No unnecessary degradation (use full cards when space allows)
 * - CC-REQ-MIXED-CARDS-004: Visual alignment correct with mixed heights
 */

test.describe('Mixed Card Types in Semi-Columns', () => {
  test('Dense timeline optimizes space with mixed card types', async ({ page }) => {
    // Navigate directly to French Revolution timeline (150+ events, very dense)
    await page.goto('/cynacons/timeline/french-revolution');
    await page.waitForSelector('[data-testid="event-card"]', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Get all visible cards
    const cards = await page.locator('[data-testid="event-card"]').all();
    expect(cards.length).toBeGreaterThan(10); // Should have many cards

    // Collect card type distribution
    const typeCount: Record<string, number> = { full: 0, compact: 0, 'title-only': 0 };

    for (const card of cards) {
      const type = await card.getAttribute('data-card-type');
      if (type && type in typeCount) {
        typeCount[type]++;
      }
    }

    // In a dense timeline, we should see a mix of all three types
    // Full cards for earliest/important events, degradation for later ones
    expect(typeCount.full).toBeGreaterThan(0);
    expect(typeCount.compact + typeCount['title-only']).toBeGreaterThan(0);

    console.log('Dense timeline card distribution:', typeCount);
  });
});
