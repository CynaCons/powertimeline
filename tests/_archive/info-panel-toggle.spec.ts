import { test, expect } from '@playwright/test';

test.describe('Info Panel Toggle', () => {
  test('should hide info panels by default and toggle them with button', async ({ page }) => {
    await page.goto('http://localhost:5178');
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="timeline-axis"]');
    
    // Verify info panels are hidden by default
    const debugPanel = page.locator('text=Enhanced Deterministic Layout v5');
    await expect(debugPanel).toBeHidden();
    
    const cardDistPanel = page.locator('text=Card Distribution');
    await expect(cardDistPanel).toBeHidden();
    
    const slotPanel = page.locator('text=Corrected Slot Allocation');
    await expect(slotPanel).toBeHidden();
    
    // Find and click the info toggle button
    const infoToggle = page.locator('button[aria-label="Toggle info panels"]');
    await expect(infoToggle).toBeVisible();
    
    // Button should show inactive state initially
    await expect(infoToggle).toHaveClass(/text-gray-600/);
    
    // Click to show panels
    await infoToggle.click();
    
    // Verify panels are now visible
    await expect(debugPanel).toBeVisible();
    await expect(cardDistPanel).toBeVisible(); 
    await expect(slotPanel).toBeVisible();
    
    // Button should show active state
    await expect(infoToggle).toHaveClass(/bg-blue-100 text-blue-800/);
    
    // Click again to hide panels
    await infoToggle.click();
    
    // Verify panels are hidden again
    await expect(debugPanel).toBeHidden();
    await expect(cardDistPanel).toBeHidden();
    await expect(slotPanel).toBeHidden();
    
    // Button should show inactive state again
    await expect(infoToggle).toHaveClass(/text-gray-600/);
  });

  test('should maintain toggle state during interactions', async ({ page }) => {
    await page.goto('http://localhost:5178');
    await page.waitForSelector('[data-testid="timeline-axis"]');
    
    // Enable dev mode and add some data
    const devToggle = page.locator('button[aria-label="Toggle developer options"]');
    await devToggle.click();
    
    const devPanel = page.locator('button[aria-label="Developer Panel"]');
    await devPanel.click();
    
    // Add clustered data
    const clusteredButton = page.locator('button:has-text("Clustered")');
    await clusteredButton.click();
    await page.waitForTimeout(500);
    
    // Close dev panel
    await page.keyboard.press('Escape');
    
    // Now toggle info panels on
    const infoToggle = page.locator('button[aria-label="Toggle info panels"]');
    await infoToggle.click();
    
    // Verify panels are visible
    const debugPanel = page.locator('text=Enhanced Deterministic Layout v5');
    await expect(debugPanel).toBeVisible();
    
    // Navigate view (zoom/pan) and ensure panels stay visible
    await page.keyboard.press('+'); // Zoom in
    await page.keyboard.press('ArrowRight'); // Pan right
    
    // Panels should still be visible
    await expect(debugPanel).toBeVisible();
    
    // Toggle off and verify they disappear
    await infoToggle.click();
    await expect(debugPanel).toBeHidden();
  });
});