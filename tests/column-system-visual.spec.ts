import { test, expect } from '@playwright/test';

test.describe('Vertical Column System Visual Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear any existing data
    await page.evaluate(() => {
      localStorage.removeItem('chronochart-events');
    });
    await page.reload();
    
    // Enable dev panel
    await page.locator('button[aria-label="Toggle developer options"]').click();
  });

  test('1. Empty state baseline', async ({ page }) => {
    await expect(page).toHaveScreenshot('01-empty-state.png', { fullPage: true });
  });

  test('2. Single event (+1)', async ({ page }) => {
    await page.locator('button[aria-label="Developer Panel"]').click();
    await page.locator('button:has-text("+1")').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('02-single-event.png', { fullPage: true });
  });

  test('3. Three events accumulated (+1, +1, +1)', async ({ page }) => {
    await page.locator('button[aria-label="Developer Panel"]').click();
    await page.locator('button:has-text("+1")').click();
    await page.waitForTimeout(200);
    await page.locator('button:has-text("+1")').click();
    await page.waitForTimeout(200);
    await page.locator('button:has-text("+1")').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('03-three-events-incremental.png', { fullPage: true });
  });

  test('4. Five events at once (+5)', async ({ page }) => {
    await page.locator('button[aria-label="Developer Panel"]').click();
    await page.locator('button:has-text("+5")').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('04-five-events.png', { fullPage: true });
  });

  test('5. Double five events (+5, +5)', async ({ page }) => {
    await page.locator('button[aria-label="Developer Panel"]').click();
    await page.locator('button:has-text("+5")').click();
    await page.waitForTimeout(200);
    await page.locator('button:has-text("+5")').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('05-double-five-events.png', { fullPage: true });
    
    // Check for overlaps
    const overlaps = await detectOverlaps(page);
    console.log(`Double +5: Found ${overlaps.count} overlapping cards`);
  });

  test('6. Progressive accumulation (+3, +5, +8)', async ({ page }) => {
    await page.locator('button[aria-label="Developer Panel"]').click();
    await page.locator('button:has-text("+3")').click();
    await page.waitForTimeout(200);
    await page.locator('button:has-text("+5")').click();
    await page.waitForTimeout(200);
    await page.locator('button:has-text("+8")').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('06-progressive-accumulation.png', { fullPage: true });
    
    const overlaps = await detectOverlaps(page);
    console.log(`Progressive (3+5+8=16): Found ${overlaps.count} overlapping cards`);
  });

  test('7. Clustered seeding', async ({ page }) => {
    await page.locator('button[aria-label="Developer Panel"]').click();
    await page.locator('button:has-text("Clustered")').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('07-clustered.png', { fullPage: true });
    
    const overlaps = await detectOverlaps(page);
    console.log(`Clustered (30 events): Found ${overlaps.count} overlapping cards`);
  });

  test('8. Double clustered seeding', async ({ page }) => {
    await page.locator('button[aria-label="Developer Panel"]').click();
    await page.locator('button:has-text("Clustered")').click();
    await page.waitForTimeout(200);
    await page.locator('button:has-text("Clustered")').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('08-double-clustered.png', { fullPage: true });
    
    const overlaps = await detectOverlaps(page);
    console.log(`Double Clustered (60 events): Found ${overlaps.count} overlapping cards`);
    expect(overlaps.count).toBeLessThan(10); // Should have minimal overlaps
  });

  test('9. Maximum incremental (+24)', async ({ page }) => {
    await page.locator('button[aria-label="Developer Panel"]').click();
    await page.locator('button:has-text("+24")').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('09-max-incremental.png', { fullPage: true });
    
    const overlaps = await detectOverlaps(page);
    console.log(`Max incremental (24 events): Found ${overlaps.count} overlapping cards`);
  });

  test('10. Stress test - Multiple operations', async ({ page }) => {
    await page.locator('button[aria-label="Developer Panel"]').click();
    
    // Add various amounts
    await page.locator('button:has-text("+5")').click();
    await page.waitForTimeout(100);
    await page.locator('button:has-text("+3")').click();
    await page.waitForTimeout(100);
    await page.locator('button:has-text("+8")').click();
    await page.waitForTimeout(100);
    await page.locator('button:has-text("+12")').click();
    await page.waitForTimeout(100);
    await page.locator('button:has-text("+5")').click();
    
    await page.locator('button[aria-label="Developer Panel"]').click();
    
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('10-stress-test.png', { fullPage: true });
    
    const overlaps = await detectOverlaps(page);
    console.log(`Stress test (33 events): Found ${overlaps.count} overlapping cards`);
  });

  test('11. RFK Timeline', async ({ page }) => {
    await page.locator('button[aria-label="Developer Panel"]').click();
    await page.locator('button:has-text("RFK 1968")').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('11-rfk-timeline.png', { fullPage: true });
    
    const overlaps = await detectOverlaps(page);
    console.log(`RFK (10 events): Found ${overlaps.count} overlapping cards`);
    expect(overlaps.count).toBe(0); // Should have no overlaps
  });

  test('12. JFK Timeline', async ({ page }) => {
    await page.locator('button[aria-label="Developer Panel"]').click();
    await page.locator('button:has-text("JFK 1961-63")').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('12-jfk-timeline.png', { fullPage: true });
    
    const overlaps = await detectOverlaps(page);
    console.log(`JFK (16 events): Found ${overlaps.count} overlapping cards`);
    expect(overlaps.count).toBe(0); // Should have no overlaps
  });

  test('13. Napoleon Timeline (degradation test)', async ({ page }) => {
    await page.locator('button[aria-label="Developer Panel"]').click();
    await page.locator('button:has-text("Napoleon 1769-1821")').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('13-napoleon-timeline.png', { fullPage: true });
    
    const overlaps = await detectOverlaps(page);
    console.log(`Napoleon (63 events): Found ${overlaps.count} overlapping cards`);
  });

  test('14. Column progression visualization', async ({ page }) => {
    // Test single column → dual column → degradation
    await page.locator('button[aria-label="Developer Panel"]').click();
    
    // Add events one by one to show progression
    for (let i = 0; i < 8; i++) {
      await page.locator('button:has-text("+1")').click();
      await page.waitForTimeout(100);
    }
    
    await page.locator('button[aria-label="Developer Panel"]').click();
    await page.waitForTimeout(500);
    
    // Should show single column usage
    await expect(page).toHaveScreenshot('14a-single-column-full.png', { fullPage: true });
    
    // Add more to trigger dual column
    await page.locator('button[aria-label="Developer Panel"]').click();
    await page.locator('button:has-text("+8")').click();
    await page.locator('button[aria-label="Developer Panel"]').click();
    await page.waitForTimeout(500);
    
    // Should show dual column usage
    await expect(page).toHaveScreenshot('14b-dual-column-usage.png', { fullPage: true });
    
    const overlaps = await detectOverlaps(page);
    console.log(`Column progression (16 events): Found ${overlaps.count} overlapping cards`);
  });

  test('15. Overlap analysis report', async ({ page }) => {
    // Run comprehensive overlap test
    const scenarios = [
      { action: async () => { 
        await page.locator('button:has-text("+5")').click();
      }, name: '5 events' },
      { action: async () => { 
        await page.locator('button:has-text("+5")').click();
      }, name: '10 events (5+5)' },
      { action: async () => { 
        await page.locator('button:has-text("+8")').click();
      }, name: '18 events (5+5+8)' },
      { action: async () => { 
        await page.locator('button:has-text("+12")').click();
      }, name: '30 events (5+5+8+12)' },
    ];
    
    await page.locator('button[aria-label="Developer Panel"]').click();
    
    const report = [];
    for (const scenario of scenarios) {
      await scenario.action();
      await page.waitForTimeout(200);
      
      // Temporarily close dev panel to check overlaps
      await page.locator('button[aria-label="Developer Panel"]').click();
      await page.waitForTimeout(200);
      
      const overlaps = await detectOverlaps(page);
      report.push({
        scenario: scenario.name,
        overlaps: overlaps.count,
        details: overlaps.details
      });
      
      // Reopen dev panel for next action
      await page.locator('button[aria-label="Developer Panel"]').click();
    }
    
    await page.locator('button[aria-label="Developer Panel"]').click();
    
    // Log detailed report
    console.log('\n=== OVERLAP ANALYSIS REPORT ===');
    report.forEach(r => {
      console.log(`\n${r.scenario}: ${r.overlaps} overlaps`);
      if (r.overlaps > 0 && r.details) {
        console.log('Overlap details:', r.details.slice(0, 3)); // Show first 3 overlaps
      }
    });
    
    // Final screenshot
    await expect(page).toHaveScreenshot('15-overlap-analysis-final.png', { fullPage: true });
    
    // Assert that overlaps increase with more events
    expect(report[report.length - 1].overlaps).toBeGreaterThan(0);
  });
});

// Helper function to detect overlapping cards
async function detectOverlaps(page) {
  return await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('[data-testid="event-card"]'));
    const rects = cards.map(card => {
      const rect = card.getBoundingClientRect();
      return {
        id: card.getAttribute('data-testid') || 'unknown',
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
      };
    });
    
    const overlaps = [];
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const r1 = rects[i];
        const r2 = rects[j];
        
        // Check for overlap
        const horizontalOverlap = r1.right > r2.left && r2.right > r1.left;
        const verticalOverlap = r1.bottom > r2.top && r2.bottom > r1.top;
        
        if (horizontalOverlap && verticalOverlap) {
          const overlapWidth = Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left);
          const overlapHeight = Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top);
          
          // Only count significant overlaps (more than 10px in both dimensions)
          if (overlapWidth > 10 && overlapHeight > 10) {
            overlaps.push({
              cards: [i, j],
              overlapArea: overlapWidth * overlapHeight,
              overlapWidth,
              overlapHeight
            });
          }
        }
      }
    }
    
    return {
      count: overlaps.length,
      details: overlaps,
      totalCards: cards.length
    };
  });
}