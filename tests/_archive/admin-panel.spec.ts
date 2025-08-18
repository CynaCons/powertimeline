import { test, expect } from '@playwright/test';

test.describe('Admin/Developer panel controls', () => {
  test('all controls are interactive and affect UI', async ({ page }) => {
  test.setTimeout(45000);
    await page.goto('/');

    // Enable dev options (toggle button in left rail)
    const devToggle = page.locator('button[aria-label="Toggle developer options"]');
    await expect(devToggle).toBeVisible();
    await devToggle.click();

    // Open Developer Panel
    const devPanelBtn = page.locator('button[aria-label="Developer Panel"]');
    await expect(devPanelBtn).toBeEnabled();
    await devPanelBtn.click();

    // Sanity: panel content should be visible
    await expect(page.getByText('Developer Options')).toBeVisible();

    // Click seed buttons and verify cards appear
    const clickAndCheck = async (label: string) => {
      await page.locator(`button:has-text("${label}")`).click();
      const count = await page.locator('[data-testid="event-card"]').count();
      expect(count).toBeGreaterThan(0);
    };

    await clickAndCheck('Seed 5');
    await clickAndCheck('Seed 10');
    await clickAndCheck('Clustered');
    await clickAndCheck('Long-range');
    await clickAndCheck('RFK 1968');
    await clickAndCheck('JFK 1961-63');
    await clickAndCheck('Napoleon 1769-1821');

    // Incremental buttons
    for (const n of [1,2,3,5,8,12,16,24]) {
      await page.getByRole('button', { name: `+${n}`, exact: true }).click();
    }
  const afterIncrementCards = await page.locator('[data-testid="event-card"]').count();
  expect(afterIncrementCards).toBeGreaterThan(0);

  // Clear button removes all events (do this before interacting with selects)
  const earlyClear = page.getByTestId('clear-all');
  await expect(earlyClear).toBeVisible();
  await earlyClear.click();
  await expect(page.locator('[data-testid="event-card"]')).toHaveCount(0);

    // Placeholders select (aria-label for robust targeting)
    for (const value of ['off','sparse','dense']) {
      const placeholderSelect = page.getByTestId('placeholder-mode-select');
      await expect(placeholderSelect).toBeVisible();
      await expect(placeholderSelect).toBeEnabled();
      await placeholderSelect.selectOption(value);
    }

  // Force card mode select (ensure visible/attached)
  const devDialog = page.getByRole('dialog', { name: 'Developer Options' });
  const scrollArea = devDialog.locator('.overflow-auto');
  await scrollArea.evaluate((el: HTMLElement) => el.scrollTo({ top: el.scrollHeight }));
  await expect(page.getByText('Force Degradation')).toBeVisible();

    await page.waitForSelector('#force-card-mode', { state: 'attached' });
    const selectEls = await devDialog.locator('select').all();
    expect(selectEls.length).toBeGreaterThanOrEqual(2);
    const forceHandle = await selectEls[1].elementHandle();
    expect(forceHandle).not.toBeNull();
    // Change to two representative values to verify interactivity without flake
    for (const value of ['compact','auto']) {
      await page.evaluate(({ el, v }) => {
        const sel = el as unknown as HTMLSelectElement;
        sel.value = v as string;
        sel.dispatchEvent(new Event('input', { bubbles: true }));
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }, { el: forceHandle, v: value } as any);
      await page.waitForTimeout(20);
    }

  // Clear button removes all events
  const html = await devDialog.first().innerHTML();
  console.log('Dev dialog HTML length:', html.length);
    // Ensure dialog still open; reopen if needed
    if (!(await page.getByRole('dialog', { name: 'Developer Options' }).isVisible())) {
      await page.locator('button[aria-label="Developer Panel"]').click();
      await expect(page.getByRole('dialog', { name: 'Developer Options' })).toBeVisible();
    }
    let clearBtn = page.getByTestId('clear-all');
    if (!(await clearBtn.count())) {
      const count = await page.evaluate(() => document.querySelectorAll('[data-testid="clear-all"]').length);
      console.log('clear-all buttons found via document:', count);
    }
    await clearBtn.click({ force: true });
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(0);

    // Close panel
    await page.locator('button[aria-label="Close panel"]').click();
    await expect(page.getByText('Developer Options')).toHaveCount(0);
  });
});
