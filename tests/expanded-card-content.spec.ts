import { test, expect } from '@playwright/test';

async function addEvent(page, date: string, title: string, description?: string) {
  await page.getByRole('button', { name: 'Create' }).click();
  await page.getByLabel('Date').fill(date);
  await page.getByLabel('Title').fill(title);
  if (description) await page.getByLabel('Description').fill(description);
  await page.getByRole('button', { name: 'Add' }).click();
}

test('card expands to show more body lines on selection', async ({ page }) => {
  await page.goto('/');
  await addEvent(page, '2025-02-02', 'Expansion Test', 'Line1 Line2 Line3 Line4 Line5 Line6');
  const node = page.locator('svg rect[data-event-id]').first();
  await node.click();
  // Expect at least two description line <div>s rendered inside foreignObject (clamped previously to 1 when collapsed)
  const bodyDivs = page.locator('foreignObject div').filter({ hasText: 'Line1' });
  await expect(bodyDivs.first()).toBeVisible();
});
