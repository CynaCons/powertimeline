import { test, expect } from '@playwright/test';

test.describe('v5/06 Degrade & Promote (telemetry)', () => {
  test('degradation counts and placeholders present', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    await page.getByRole('button', { name: 'RFK 1968' }).click();

    await page.waitForFunction(() => Boolean((window as any).__ccTelemetry?.degradations?.count >= 0));
    const t = await page.evaluate(() => (window as any).__ccTelemetry || null);
    expect(t).toBeTruthy();
    expect(t.degradations.count).toBeGreaterThanOrEqual(0);
    expect(t.degradations.byType.compact).toBeGreaterThanOrEqual(0);
    expect(t.degradations.byType['title-only']).toBeGreaterThanOrEqual(0);
    // Promotions are not implemented yet; ensure field exists with a non-negative number
    expect(t.promotions.count).toBeGreaterThanOrEqual(0);
  });
});
