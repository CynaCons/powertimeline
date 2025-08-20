import { test, expect } from '@playwright/test';

test.describe('v5/11 Stage 1 Foundation', () => {
  test('Stage 1 demo loads and shows timeline with single event', async ({ page }) => {
    // Go to Stage 1 demo mode
    await page.goto('/?stage1=1');
    
    // Should show Stage 1 demo page
    await expect(page.locator('h1')).toContainText('Stage 1: Foundation with Full Cards Only');
    
    // Default scenario should be single event
    await expect(page.locator('[data-testid="simple-timeline"]')).toBeVisible();
    
    // Should have timeline axis
    await expect(page.locator('[data-testid="timeline-axis"]')).toBeVisible();
    
    // Should have one event card
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(1);
    
    // Card should have proper attributes
    await expect(page.locator('[data-testid="event-card"]')).toHaveAttribute('data-card-type', 'full');
  });

  test('Stage 1 demo shows different test scenarios', async ({ page }) => {
    await page.goto('/?stage1=1');
    
    // Test two events scenario
    await page.getByRole('button', { name: 'Two Events' }).click();
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(2);
    
    // Test three events scenario  
    await page.getByRole('button', { name: 'Three Events' }).click();
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(3);
    
    // Test five events scenario
    await page.getByRole('button', { name: 'Five Events' }).click();
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(5);
  });
});