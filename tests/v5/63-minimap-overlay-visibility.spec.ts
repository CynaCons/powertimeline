import { test, expect, Page } from '@playwright/test';
import { loginAsTestUser, loadTestTimeline } from '../utils/timelineTestUtils';

test.describe('Minimap Visibility During Authoring Overlay', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await page.goto('/');
    await page.waitForSelector('[data-testid="timeline-axis"]', { timeout: 10000 });

    // Load Napoleon dataset for testing
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    await page.getByRole('button', { name: 'Napoleon 1769-1821' }).click();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000); // Wait for events to load
  });

  test.skip('minimap should remain visible and ungreyed when authoring overlay is open', async () => {
    // Feature not yet implemented - minimap visibility over overlays
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-EDITOR-003,CC-REQ-EDITOR-004' });
    // First verify minimap is visible in normal state
    const minimap = page.locator('[data-testid="timeline-minimap"]');
    await expect(minimap).toBeVisible();

    // Get minimap opacity/styling in normal state
    const normalOpacity = await minimap.evaluate((el) => {
      const computedStyle = window.getComputedStyle(el);
      return {
        opacity: computedStyle.opacity,
        zIndex: computedStyle.zIndex,
        position: computedStyle.position
      };
    });

    // Open authoring overlay by double-clicking an event
    const firstCard = page.locator('[data-testid="event-card"]').first();
    await firstCard.dblclick();

    // Wait for authoring overlay to appear
    await expect(page.locator('[data-testid="authoring-overlay"]')).toBeVisible();

    // Check if backdrop exists and its z-index
    const backdrop = page.locator('[data-testid="authoring-backdrop"]');
    await expect(backdrop).toBeVisible();

    const backdropStyles = await backdrop.evaluate((el) => {
      const computedStyle = window.getComputedStyle(el);
      return {
        zIndex: computedStyle.zIndex,
        backgroundColor: computedStyle.backgroundColor,
        position: computedStyle.position
      };
    });

    // Check minimap styling with overlay open
    const overlayMinimapStyles = await minimap.evaluate((el) => {
      const computedStyle = window.getComputedStyle(el);
      return {
        opacity: computedStyle.opacity,
        zIndex: computedStyle.zIndex,
        position: computedStyle.position,
        visibility: computedStyle.visibility
      };
    });

    console.log('Normal minimap styles:', normalOpacity);
    console.log('Backdrop styles:', backdropStyles);
    console.log('Overlay minimap styles:', overlayMinimapStyles);

    // Test assertions
    test.step('verify minimap is still visible', async () => {
      await expect(minimap).toBeVisible();
      expect(overlayMinimapStyles.visibility).toBe('visible');
    });

    test.step('verify minimap z-index is higher than backdrop', async () => {
      const minimapZ = parseInt(overlayMinimapStyles.zIndex) || 0;
      const backdropZ = parseInt(backdropStyles.zIndex) || 0;
      expect(minimapZ).toBeGreaterThan(backdropZ);
    });

    test.step('verify minimap opacity is not reduced', async () => {
      expect(overlayMinimapStyles.opacity).toBe(normalOpacity.opacity);
      expect(parseFloat(overlayMinimapStyles.opacity)).toBeGreaterThanOrEqual(1);
    });

    test.step('verify minimap is interactive', async () => {
      // Try to interact with minimap - should not be blocked by backdrop
      const minimapClickable = await minimap.isEnabled();
      expect(minimapClickable).toBe(true);

      // Test that minimap click doesn't close the overlay
      await minimap.click({ position: { x: 100, y: 20 } });
      await expect(page.locator('[data-testid="authoring-overlay"]')).toBeVisible();
    });
  });

  test.skip('minimap should highlight selected event when overlay is open', async () => {
    // Feature not yet implemented - minimap event highlighting
    // Open authoring overlay
    const firstCard = page.locator('[data-testid="event-card"]').first();
    await firstCard.dblclick();
    await expect(page.locator('[data-testid="authoring-overlay"]')).toBeVisible();

    // Check if event highlighting exists in minimap
    const highlightedMarker = page.locator('.absolute.top-0.w-2.h-3.bg-blue-600.animate-pulse');

    test.step('verify event highlighting is visible', async () => {
      const markerCount = await highlightedMarker.count();
      expect(markerCount).toBeGreaterThanOrEqual(1);
    });

    test.step('verify highlighted marker styling', async () => {
      if (await highlightedMarker.count() > 0) {
        const markerStyles = await highlightedMarker.first().evaluate((el) => {
          const computedStyle = window.getComputedStyle(el);
          return {
            backgroundColor: computedStyle.backgroundColor,
            animation: computedStyle.animation,
            opacity: computedStyle.opacity
          };
        });

        // Should have blue background and pulse animation
        expect(markerStyles.backgroundColor).toContain('rgb(37, 99, 235)'); // blue-600
        expect(markerStyles.opacity).toBe('1');
      }
    });
  });

  test.skip('DOM layering inspection - detailed z-index analysis', async () => {
    // Feature not yet implemented - z-index layering for minimap over overlays
    // Open overlay
    const firstCard = page.locator('[data-testid="event-card"]').first();
    await firstCard.dblclick();
    await expect(page.locator('[data-testid="authoring-overlay"]')).toBeVisible();

    // Inspect all relevant elements and their z-indices
    const elements = await page.evaluate(() => {
      const results: Array<{name: string, zIndex: string, selector: string}> = [];

      // Find minimap container
      const minimap = document.querySelector('[data-testid="timeline-minimap"]');
      if (minimap) {
        results.push({
          name: 'Minimap Container',
          zIndex: window.getComputedStyle(minimap).zIndex,
          selector: minimap.className
        });
      }

      // Find authoring overlay container
      const overlay = document.querySelector('[data-testid="authoring-overlay"]')?.parentElement;
      if (overlay) {
        results.push({
          name: 'Authoring Overlay Container',
          zIndex: window.getComputedStyle(overlay).zIndex,
          selector: overlay.className
        });
      }

      // Find backdrop
      const backdrop = document.querySelector('[data-testid="authoring-backdrop"]');
      if (backdrop) {
        results.push({
          name: 'Authoring Backdrop',
          zIndex: window.getComputedStyle(backdrop).zIndex,
          selector: backdrop.className
        });
      }

      // Find any other fixed/absolute positioned elements
      const fixedElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const style = window.getComputedStyle(el);
        return (style.position === 'fixed' || style.position === 'absolute') &&
               style.zIndex !== 'auto' && style.zIndex !== '0';
      });

      fixedElements.forEach((el, index) => {
        results.push({
          name: `Fixed/Absolute Element ${index}`,
          zIndex: window.getComputedStyle(el).zIndex,
          selector: el.className
        });
      });

      return results;
    });

    console.log('Z-Index Analysis:', elements);

    // Log findings for debugging
    elements.forEach(el => {
      console.log(`${el.name}: z-index=${el.zIndex}, classes="${el.selector}"`);
    });

    // Verify our expected z-index relationships
    const minimapZ = elements.find(el => el.name === 'Minimap Container');
    const backdropZ = elements.find(el => el.name === 'Authoring Backdrop');
    const overlayZ = elements.find(el => el.name === 'Authoring Overlay Container');

    if (minimapZ && backdropZ) {
      const minimapZValue = parseInt(minimapZ.zIndex) || 0;
      const backdropZValue = parseInt(backdropZ.zIndex) || 0;

      expect(minimapZValue).toBeGreaterThan(backdropZValue);
    }

    // Fail the test if minimap z-index is not higher than backdrop
    if (minimapZ && backdropZ && overlayZ) {
      const analysis = {
        minimap: parseInt(minimapZ.zIndex) || 0,
        backdrop: parseInt(backdropZ.zIndex) || 0,
        overlay: parseInt(overlayZ.zIndex) || 0
      };

      expect(analysis.minimap, `Minimap z-index (${analysis.minimap}) should be higher than backdrop (${analysis.backdrop})`).toBeGreaterThan(analysis.backdrop);
    }
  });
});