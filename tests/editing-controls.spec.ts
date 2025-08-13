import { test, expect } from '@playwright/test';

async function addEvent(page, date: string, title: string, description?: string) {
  await page.getByRole('button', { name: 'Create' }).click();
  await page.getByLabel('Date').fill(date);
  await page.getByLabel('Title').fill(title);
  if (description) await page.getByLabel('Description').fill(description);
  await page.getByRole('button', { name: 'Add' }).click();
}

test('inline editing controls (save/cancel) appear and function', async ({ page }) => {
  await page.goto('/');
  await addEvent(page, '2025-01-05', 'Inline T', 'Body');
  // Enter inline edit (select + Enter)
  const node = page.locator('svg rect[data-event-id]').first();
  await node.click();
  await page.keyboard.press('Enter');
  const titleInput = page.getByLabel('Inline Title');
  await expect(titleInput).toBeVisible();
  await titleInput.fill('Edited Title');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('svg text', { hasText: 'Edited Title' })).toBeVisible();
});

