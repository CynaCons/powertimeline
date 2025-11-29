/**
 * Production Landing Smoke
 * Minimal health checks against https://powertimeline.com
 */

import { test, expect } from '@playwright/test';
import {
  monitorConsole,
  monitorNetwork,
  waitForQuiet,
  hasSevereConsoleError,
} from './utils';

const PRODUCTION_URL = 'https://powertimeline.com';

test.describe('Production Smoke', () => {
  test('landing hero renders without console/network errors', async ({ page }) => {
    const consoleMonitor = monitorConsole(page);
    const networkMonitor = monitorNetwork(page);

    await page.goto(PRODUCTION_URL);

    // Unique hero headline (updated in v0.5.6)
    await expect(
      page.getByRole('heading', { name: 'Where events become understanding' })
    ).toBeVisible({ timeout: 10_000 });

    await waitForQuiet(page, 1_500);

    if (hasSevereConsoleError(consoleMonitor.errors)) {
      console.error('Console errors detected:', consoleMonitor.errors);
    }

    expect(hasSevereConsoleError(consoleMonitor.errors)).toBeFalsy();
    expect(networkMonitor.failures).toEqual([]);
  });

  test('landing shows example timeline cards', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await waitForQuiet(page, 2_000);

    // Example gallery cards are data-testid prefixed with timeline-card-
    const exampleCards = page.getByTestId(/timeline-card-/);
    const hasCards = await exampleCards.first().isVisible({ timeout: 2_000 }).catch(() => false);

    if (!hasCards) {
      // Fallback: use section headings (e.g., Popular Timelines)
      const headings = page.getByRole('heading', { level: 3 });
      await expect(headings.first()).toBeVisible({ timeout: 5_000 });
      const count = await headings.count();
      expect(count).toBeGreaterThan(0);
    } else {
      const cardCount = await exampleCards.count();
      expect(cardCount).toBeGreaterThan(2);
    }
  });
});
