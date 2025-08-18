import { test, expect } from '@playwright/test';

test.describe('Quick Overlap Detection', () => {
  
  test('Detect overlaps in double +5 scenario', async ({ page }) => {
    await page.goto('/');
    
    // Clear and enable dev
    await page.evaluate(() => localStorage.removeItem('chronochart-events'));
    await page.reload();
    await page.locator('button[aria-label="Toggle developer options"]').click();
    
    // Add 5 + 5 events
    await page.locator('button[aria-label="Developer Panel"]').click();
    await page.locator('button:has-text("+5")').click();
    await page.waitForTimeout(200);
    await page.locator('button:has-text("+5")').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    
    await page.waitForTimeout(500);
    
    // Detect overlaps
    const result = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[data-testid="event-card"]'));
      const rects = cards.map((card, index) => {
        const rect = card.getBoundingClientRect();
        const title = card.querySelector('.font-semibold')?.textContent || `Card ${index}`;
        return {
          index,
          title,
          left: Math.round(rect.left),
          top: Math.round(rect.top),
          right: Math.round(rect.right),
          bottom: Math.round(rect.bottom),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      });
      
      const overlaps = [];
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const r1 = rects[i];
          const r2 = rects[j];
          
          const horizontalOverlap = r1.right > r2.left && r2.right > r1.left;
          const verticalOverlap = r1.bottom > r2.top && r2.bottom > r1.top;
          
          if (horizontalOverlap && verticalOverlap) {
            const overlapWidth = Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left);
            const overlapHeight = Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top);
            
            if (overlapWidth > 10 && overlapHeight > 10) {
              overlaps.push({
                card1: { index: r1.index, title: r1.title, pos: `(${r1.left},${r1.top})` },
                card2: { index: r2.index, title: r2.title, pos: `(${r2.left},${r2.top})` },
                overlap: `${overlapWidth}x${overlapHeight}px`
              });
            }
          }
        }
      }
      
      // Get cluster info
      const anchors = Array.from(document.querySelectorAll('[class*="bg-gray-800"][class*="rounded-full"]'));
      const clusterInfo = anchors.map(anchor => {
        const rect = anchor.getBoundingClientRect();
        return {
          x: Math.round(rect.left),
          y: Math.round(rect.top)
        };
      });
      
      return {
        totalCards: cards.length,
        overlaps: overlaps,
        overlapCount: overlaps.length,
        clusters: clusterInfo
      };
    });
    
    console.log('\n=== OVERLAP ANALYSIS ===');
    console.log(`Total cards: ${result.totalCards}`);
    console.log(`Clusters: ${result.clusters.length}`);
    console.log(`Overlapping pairs: ${result.overlapCount}`);
    
    if (result.overlaps.length > 0) {
      console.log('\nOverlap details:');
      result.overlaps.forEach(o => {
        console.log(`  ${o.card1.title} ${o.card1.pos} overlaps ${o.card2.title} ${o.card2.pos} by ${o.overlap}`);
      });
    }
    
    // Take screenshot
    await expect(page).toHaveScreenshot('overlap-analysis.png', { fullPage: true });
    
    // The test should fail if there are overlaps
    expect(result.overlapCount).toBe(0);
  });
});