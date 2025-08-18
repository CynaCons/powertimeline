import { test, expect } from '@playwright/test';

test.describe('Napoleon Timeline Analysis', () => {
  test('seed Napoleon timeline and capture screenshot', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForTimeout(1000);
    
    // Use keyboard shortcut or direct navigation to trigger Napoleon seed
    // First, let's try to enable dev mode
    await page.click('button[aria-label="Toggle developer options"]');
    await page.waitForTimeout(200);
    
    // Try clicking the dev panel button with force
    await page.click('button[aria-label="Developer Panel"]', { force: true });
    await page.waitForTimeout(500);
    
    // Force click the Napoleon button even if covered
    await page.click('button:has-text("Napoleon 1769-1821")', { force: true });
    
    // Wait for timeline to populate
    await page.waitForTimeout(2000);
    
    // Close dev panel to see full timeline
    await page.click('button[aria-label="Developer Panel"]', { force: true });
    await page.waitForTimeout(500);
    
    // Take screenshots
    await page.screenshot({ 
      path: 'test-results/napoleon-timeline-analysis.png',
      fullPage: false 
    });
    
    // Check that we have cards
    const cards = await page.locator('.bg-white.rounded-lg.shadow-md').count();
    console.log(`Napoleon timeline has ${cards} cards displayed`);
    
    // Check timeline is visible
    await expect(page.locator('[data-testid="timeline-axis"]')).toBeVisible();
    
    // Check info panels
    const infoText = await page.locator('text=Enhanced Deterministic Layout v5').first().isVisible();
    console.log(`Info panel visible: ${infoText}`);
    
    // Get event count from info panel
    const eventText = await page.locator('p').filter({ hasText: 'events' }).first().textContent();
    console.log(`Event info: ${eventText}`);
  });
});