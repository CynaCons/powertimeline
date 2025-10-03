import { test } from '@playwright/test';

/**
 * Test 41: Visual Color Demo
 * Prints a quick reference describing the supported card colors.
 */

test('card color system reference', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.absolute.inset-0.ml-14', { timeout: 10_000 });

  const lines = [
    '',
    'Card Color Reference',
    '---------------------',
    'Blue  (full)       260x169  up to two events per half-column',
    'Green (compact)    260x92   first degradation step, three to four events',
    'Yellow(title-only) 260x32   high density fallback, title + date only',
  ];

  for (const line of lines) {
    console.log(line);
  }
});
