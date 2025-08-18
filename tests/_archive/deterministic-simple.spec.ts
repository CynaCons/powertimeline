import { test, expect } from '@playwright/test';

test.describe('Deterministic Layout v4 - Simple Tests', () => {
  test('should load with deterministic layout v4', async ({ page }) => {
    await page.goto('/');
    
    // Verify the deterministic layout is loaded
    await expect(page.locator('text=Deterministic Layout v4')).toBeVisible();
    await expect(page.locator('text=Zero overlaps guaranteed')).toBeVisible();
    
    // Verify slot allocation display
    await expect(page.locator('text=Full: 4 slots (2↑, 2↓)')).toBeVisible();
    await expect(page.locator('text=Compact: 4 slots (2↑, 2↓)')).toBeVisible(); 
    await expect(page.locator('text=Title-only: 8 slots (4↑, 4↓)')).toBeVisible();
    await expect(page.locator('text=Multi-event: 10 slots (5↑, 5↓)')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/deterministic-v4-loaded.png' });
  });

  test('should show mathematical degradation description', async ({ page }) => {
    await page.goto('/');
    
    // Verify mathematical degradation description
    await expect(page.locator('text=Mathematical degradation: 1→2→4→5')).toBeVisible();
    await expect(page.locator('text=Left-to-right clustering')).toBeVisible();
    
    await page.screenshot({ path: 'test-results/deterministic-v4-description.png' });
  });

  test('should display timeline axis', async ({ page }) => {
    await page.goto('/');
    
    // Check timeline is rendered
    const timeline = page.locator('[data-testid="timeline-axis"]');
    await expect(timeline).toBeVisible();
    
    await page.screenshot({ path: 'test-results/deterministic-v4-timeline.png' });
  });

  test('should access developer panel via sidebar', async ({ page }) => {
    await page.goto('/');
    
    // Look for sidebar icons/buttons
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    
    // Try clicking different sidebar elements to find developer controls
    const sidebarButtons = sidebar.locator('button');
    const buttonCount = await sidebarButtons.count();
    
    console.log(`Found ${buttonCount} sidebar buttons`);
    
    // Try each button to find developer panel
    for (let i = 0; i < buttonCount; i++) {
      await sidebarButtons.nth(i).click();
      await page.waitForTimeout(500);
      
      // Check if developer panel opened
      const devPanel = page.locator('text=Clear All');
      if (await devPanel.isVisible()) {
        console.log(`Developer panel opened with button ${i}`);
        break;
      }
    }
    
    await page.screenshot({ path: 'test-results/deterministic-v4-sidebar-exploration.png' });
  });
});