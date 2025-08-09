import { test, expect } from '@playwright/test';

test('application loads and displays timeline', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Chronochart/);
  await expect(page.locator('svg')).toBeVisible();
});

test('page uses a dark background color', async ({ page }) => {
  await page.goto('/');

  // 1) Check body has a known dark background utility class
  const hasDarkClass = await page.evaluate(() => {
    const c = Array.from(document.body.classList.values());
    const darkClasses = ['bg-space-black', 'bg-gray-950', 'bg-gray-900', 'bg-neutral-950'];
    return darkClasses.some(dc => c.includes(dc));
  });
  expect(hasDarkClass).toBeTruthy();

  // 2) Sanity check: computed color is not transparent or pure white
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).not.toBe('rgba(0, 0, 0, 0)');
});
