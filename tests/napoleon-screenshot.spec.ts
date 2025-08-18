import { test, expect } from '@playwright/test';

test.describe('Napoleon Timeline Screenshot', () => {
  test('capture Napoleon timeline for analysis', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the app to load
    await expect(page.locator('.bg-gray-100')).toBeVisible();
    
    // Open the dev panel
    await page.click('button[aria-label="Toggle developer options"]');
    await page.waitForTimeout(500);
    await page.click('button[aria-label="Developer Panel"]');
    
    // Wait for dev panel to be visible
    await page.waitForTimeout(500);
    
    // Click Napoleon seed button - it should be in the DevPanel
    const napoleonButton = page.locator('button', { hasText: 'Napoleon' });
    await napoleonButton.click();
    
    // Wait for timeline to update
    await page.waitForTimeout(1000);
    
    // Close the dev panel to see full timeline
    await page.click('button[aria-label="Developer Panel"]');
    
    // Wait a bit for animation
    await page.waitForTimeout(500);
    
    // Take a full page screenshot
    await page.screenshot({ 
      path: 'test-results/napoleon-timeline-full.png',
      fullPage: true 
    });
    
    // Also take a viewport screenshot
    await page.screenshot({ 
      path: 'test-results/napoleon-timeline-viewport.png',
      fullPage: false 
    });
    
    // Verify timeline elements are present
    await expect(page.locator('[data-testid="timeline-axis"]')).toBeVisible();
    
    // Check for cards
    const cards = page.locator('.bg-white.rounded-lg.shadow-md');
    const cardCount = await cards.count();
    console.log(`Found ${cardCount} cards on the timeline`);
    
    // Check info panels
    await expect(page.locator('text=Enhanced Deterministic Layout v5')).toBeVisible();
    await expect(page.locator('text=Card Distribution')).toBeVisible();
    await expect(page.locator('text=Corrected Slot Allocation')).toBeVisible();
  });
});