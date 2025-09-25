import { test, expect } from '@playwright/test';

test.describe('Manual Minimap Verification (Built Version)', () => {
  test('verify minimap loads and z-index is correct', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-EDITOR-003,CC-REQ-EDITOR-004' });

    // Use the development version running on port 5175
    await page.goto('http://localhost:5175');
    await page.waitForSelector('[data-testid="timeline-axis"]', { timeout: 10000 });

    // Load events using the Developer panel
    await page.click('[data-testid="nav-dev"]');
    await page.waitForTimeout(500);

    // Click French Revolution to load events
    await page.click('text="French Revolution"');
    await page.waitForTimeout(2000);

    // Check if minimap exists
    const minimapContainer = page.locator('div.absolute.top-1.left-4.right-4');
    await expect(minimapContainer).toBeVisible({ timeout: 5000 });

    console.log('✅ Minimap is visible');

    // Get initial minimap styles
    const initialStyles = await minimapContainer.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        zIndex: style.zIndex,
        opacity: style.opacity,
        visibility: style.visibility
      };
    });

    console.log('Initial minimap styles:', initialStyles);

    // Open authoring overlay by double-clicking an event
    const eventCards = page.locator('[data-testid^="event-card-"]');
    await expect(eventCards.first()).toBeVisible({ timeout: 5000 });
    await eventCards.first().dblclick();

    // Wait for authoring overlay
    await expect(page.locator('[data-testid="authoring-overlay"]')).toBeVisible({ timeout: 5000 });
    console.log('✅ Authoring overlay is open');

    // Check backdrop z-index
    const backdrop = page.locator('[data-testid="authoring-backdrop"]');
    await expect(backdrop).toBeVisible({ timeout: 5000 });

    const backdropStyles = await backdrop.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        zIndex: style.zIndex,
        position: style.position,
        backgroundColor: style.backgroundColor
      };
    });

    console.log('Backdrop styles:', backdropStyles);

    // Check minimap styles with overlay open
    const overlayMinimapStyles = await minimapContainer.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        zIndex: style.zIndex,
        opacity: style.opacity,
        visibility: style.visibility
      };
    });

    console.log('Minimap styles with overlay:', overlayMinimapStyles);

    // Verify minimap is still visible
    await expect(minimapContainer).toBeVisible();

    // Verify z-index relationships
    const minimapZ = parseInt(overlayMinimapStyles.zIndex) || 0;
    const backdropZ = parseInt(backdropStyles.zIndex) || 0;

    console.log(`Z-index comparison: Minimap(${minimapZ}) vs Backdrop(${backdropZ})`);

    if (minimapZ > backdropZ) {
      console.log('✅ Z-index is correct: Minimap is above backdrop');
    } else {
      console.error('❌ ISSUE: Minimap z-index is not higher than backdrop');
    }

    // Test assertion
    expect(minimapZ).toBeGreaterThan(backdropZ);

    // Verify opacity is not reduced
    expect(parseFloat(overlayMinimapStyles.opacity)).toBeGreaterThanOrEqual(1);
  });
});