import { test, expect } from '@playwright/test';

// Ensures long title/description never overflow card bounds

test('card text stays within card bounds', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle developer options' }).click();
  await page.getByRole('button', { name: 'Create' }).click();
  await page.getByLabel('Date').fill('2025-06-01');
  await page.getByLabel('Title').fill('A'.repeat(500));
  await page.getByLabel('Description').fill('Lorem ipsum '.repeat(200));
  await page.getByRole('button', { name: 'Add' }).click();
  await page.waitForTimeout(200);

  const card = page.locator('[data-testid="event-card"]').last();
  const ok = await card.evaluate((n) => {
    const r = (n as HTMLElement).getBoundingClientRect();
    // Collect text nodes and ensure they don't paint outside
    const texts = n.querySelectorAll('h3, p, time');
    for (const el of Array.from(texts)) {
      const rr = el.getBoundingClientRect();
      if (rr.left < r.left - 1 || rr.right > r.right + 1 || rr.top < r.top - 1 || rr.bottom > r.bottom + 1) {
        return false;
      }
    }
    return true;
  });
  expect(ok).toBeTruthy();
});
