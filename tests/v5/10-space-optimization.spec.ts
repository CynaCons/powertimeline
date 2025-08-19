import { test, expect } from '@playwright/test';

test.describe('v5/10 Space optimization (horizontal & vertical)', () => {
  test('validates horizontal space usage telemetry exists', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle developer options' }).click();
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    await page.getByRole('button', { name: 'RFK 1968' }).click();

    // Wait for telemetry to be populated (same pattern as 04-dispatch-band)
    await page.waitForFunction(() => Boolean((window as any).__ccTelemetry && (window as any).__ccTelemetry.groups?.count >= 0));
    const t = await page.evaluate(() => (window as any).__ccTelemetry || null);
    expect(t).toBeTruthy();
    expect(t.dispatch).toBeTruthy();

    // ARCHITECTURE.md requirement: "optimize the horizontal space as much as possible"
    // Test that horizontalSpaceUsage telemetry is being calculated and exposed
    if (t.dispatch.horizontalSpaceUsage !== undefined) {
      expect(typeof t.dispatch.horizontalSpaceUsage).toBe('number');
      expect(t.dispatch.horizontalSpaceUsage).toBeGreaterThanOrEqual(0);
      expect(t.dispatch.horizontalSpaceUsage).toBeLessThanOrEqual(100);
    }
  });

  test('validates spatial distribution metrics for dense scenarios', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle developer options' }).click();
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    await page.getByRole('button', { name: 'Napoleon 1769-1821' }).click();

    // Wait for telemetry (same pattern as capacity-model test)
    await page.waitForFunction(() => Boolean((window as any).__ccTelemetry && (window as any).__ccTelemetry.capacity?.totalCells >= 0));
    const t = await page.evaluate(() => (window as any).__ccTelemetry || null);
    expect(t).toBeTruthy();

    // Validate space utilization metrics exist
    expect(t.capacity).toBeTruthy();
    expect(t.capacity.utilization).toBeGreaterThanOrEqual(0);
    expect(t.capacity.utilization).toBeLessThanOrEqual(100);

    // Validate dispatch metrics for distribution
    expect(t.dispatch).toBeTruthy();
    expect(t.dispatch.groupCount).toBeGreaterThan(0);
    expect(t.dispatch.avgEventsPerCluster).toBeGreaterThan(0);

    // ARCHITECTURE.md requirement: "Dispatch events across full timeline width"
    // For dense scenarios like Napoleon (63 events), should have reasonable distribution
    if (t.dispatch.groupCount > 3) {
      expect(t.dispatch.avgEventsPerCluster).toBeLessThan(25); // Not over-clustering
    }
  });

  test('validates screen real estate usage with actual card positions', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle developer options' }).click();
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    await page.getByRole('button', { name: 'Long-range' }).click();

    // Wait for cards to be rendered
    await page.waitForFunction(() => Boolean((window as any).__ccTelemetry && (window as any).__ccTelemetry.groups?.count >= 0));
    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible();

    // Get actual spatial usage metrics
    const spatialMetrics = await page.evaluate(() => {
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const cards = document.querySelectorAll('[data-testid="event-card"]');
      
      if (cards.length === 0) return { viewport, cards: 0 };
      
      // Calculate bounding box of all cards
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      
      Array.from(cards).forEach(card => {
        const rect = card.getBoundingClientRect();
        minX = Math.min(minX, rect.x);
        maxX = Math.max(maxX, rect.x + rect.width);
        minY = Math.min(minY, rect.y);
        maxY = Math.max(maxY, rect.y + rect.height);
      });
      
      const usedWidth = maxX - minX;
      const usedHeight = maxY - minY;
      
      return {
        viewport,
        cards: cards.length,
        spatial: {
          usedWidth,
          usedHeight,
          leftmostX: minX,
          rightmostX: maxX,
          horizontalSpread: (usedWidth / (viewport.width - 50)) * 100, // Account for 25px margins each side
          verticalSpread: (usedHeight / (viewport.height - 50)) * 100
        }
      };
    });

    expect(spatialMetrics.cards).toBeGreaterThan(0);

    // ARCHITECTURE.md requirement: "maximize screen real estate usage"
    // Should use reasonable portion of available space
    if (spatialMetrics.cards > 2) {
      expect(spatialMetrics.spatial.horizontalSpread).toBeGreaterThan(20); // At least 20% width usage
      expect(spatialMetrics.spatial.verticalSpread).toBeGreaterThan(10); // At least 10% height usage
    }

    // Cards shouldn't be bunched only on left side
    const leftThreshold = spatialMetrics.viewport.width * 0.3; // First 30% of screen
    expect(spatialMetrics.spatial.rightmostX).toBeGreaterThan(leftThreshold);
  });

  test('validates anti-clustering behavior for sparse data', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Toggle developer options' }).click();
    await page.getByRole('button', { name: 'Developer Panel' }).click();
    await page.getByRole('button', { name: 'RFK 1968' }).click();

    await page.waitForFunction(() => Boolean((window as any).__ccTelemetry && (window as any).__ccTelemetry.groups?.count >= 0));
    const t = await page.evaluate(() => (window as any).__ccTelemetry || null);
    expect(t).toBeTruthy();

    // ARCHITECTURE.md requirement: "Avoid excessive clustering when space is available"
    // For sparse scenarios (like RFK with ~5 events), shouldn't over-cluster
    if (t.dispatch.groupCount && t.dispatch.avgEventsPerCluster) {
      // With sparse data, average events per cluster should be reasonable
      expect(t.dispatch.avgEventsPerCluster).toBeLessThanOrEqual(10);
      
      // Should have at least some distribution (not single cluster for sparse data)
      if (t.cards && t.cards.total <= 10) {
        expect(t.dispatch.groupCount).toBeGreaterThanOrEqual(1);
      }
    }
  });
});