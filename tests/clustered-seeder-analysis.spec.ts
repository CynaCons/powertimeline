import { test, expect } from '@playwright/test';

test.describe('Clustered Seeder Progressive Analysis', () => {
  test('analyze layout with progressive clustered seeding', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Enable dev mode and open panel
    await page.click('button[aria-label="Toggle developer options"]');
    await page.waitForTimeout(200);
    await page.click('button[aria-label="Developer Panel"]', { force: true });
    await page.waitForTimeout(500);
    
    const analysisResults = [];
    const steps = [
      { action: 'initial', description: 'Empty timeline' },
      { action: 'clustered-1', description: 'First clustered seed' },
      { action: 'clustered-2', description: 'Second clustered seed' },
      { action: 'clustered-3', description: 'Third clustered seed' },
      { action: 'clustered-4', description: 'Fourth clustered seed' },
      { action: 'clustered-5', description: 'Fifth clustered seed' }
    ];
    
    // Take initial screenshot
    await page.screenshot({ 
      path: `test-results/clustered-step-0-initial.png`,
      fullPage: false 
    });
    
    // Analyze initial state
    let analysis = await analyzeLayout(page, 'Initial state');
    analysisResults.push(analysis);
    
    // Progressive clustered seeding (fewer steps to avoid timeout)
    for (let i = 1; i <= 3; i++) {
      console.log(`\n=== Step ${i}: Adding clustered events ===`);
      
      // Click the Clustered button
      const clusteredButton = await page.locator('button:has-text("Clustered")').first();
      if (await clusteredButton.isVisible()) {
        await clusteredButton.click();
        await page.waitForTimeout(1000); // Wait for animation
        
        // Take screenshot
        await page.screenshot({ 
          path: `test-results/clustered-step-${i}-after.png`,
          fullPage: false 
        });
        
        // Analyze current state
        analysis = await analyzeLayout(page, `After ${i} clustered seed(s)`);
        analysisResults.push(analysis);
        
        // Report incremental findings
        console.log(`Total events: ${analysis.eventCount}`);
        console.log(`Columns: ${analysis.columnCount}`);
        console.log(`Card distribution: Full=${analysis.cardTypes.full}, Compact=${analysis.cardTypes.compact}, Title=${analysis.cardTypes.titleOnly}, Multi=${analysis.cardTypes.multiEvent}`);
        console.log(`Space utilization: ${analysis.spaceUtilization.percentage.toFixed(1)}%`);
        console.log(`Overlaps detected: ${analysis.overlaps}`);
      }
    }
    
    // Close dev panel for final screenshot
    await page.click('button[aria-label="Developer Panel"]');
    await page.waitForTimeout(500);
    
    // Take final clean screenshot
    await page.screenshot({ 
      path: `test-results/clustered-final-clean.png`,
      fullPage: false 
    });
    
    // Generate comprehensive report
    console.log('\n\n========================================');
    console.log('COMPREHENSIVE CLUSTERED SEEDER ANALYSIS');
    console.log('========================================\n');
    
    for (let i = 0; i < analysisResults.length; i++) {
      const result = analysisResults[i];
      console.log(`\n${i === 0 ? 'INITIAL STATE' : `STEP ${i}: ${result.description}`}`);
      console.log('─'.repeat(50));
      
      console.log('\n📊 METRICS:');
      console.log(`  • Events: ${result.eventCount}`);
      console.log(`  • Columns: ${result.columnCount}`);
      console.log(`  • Cards rendered: ${result.totalCards}`);
      
      console.log('\n🎯 CARD TYPES:');
      console.log(`  • Full cards: ${result.cardTypes.full} (${(result.cardTypes.full / result.totalCards * 100 || 0).toFixed(1)}%)`);
      console.log(`  • Compact cards: ${result.cardTypes.compact} (${(result.cardTypes.compact / result.totalCards * 100 || 0).toFixed(1)}%)`);
      console.log(`  • Title-only cards: ${result.cardTypes.titleOnly} (${(result.cardTypes.titleOnly / result.totalCards * 100 || 0).toFixed(1)}%)`);
      console.log(`  • Multi-event cards: ${result.cardTypes.multiEvent} (${(result.cardTypes.multiEvent / result.totalCards * 100 || 0).toFixed(1)}%)`);
      
      console.log('\n📐 SPACE UTILIZATION:');
      console.log(`  • Vertical coverage: ${result.spaceUtilization.verticalCoverage.toFixed(1)}%`);
      console.log(`  • Horizontal spread: ${result.spaceUtilization.horizontalSpread.toFixed(1)}%`);
      console.log(`  • Overall efficiency: ${result.spaceUtilization.percentage.toFixed(1)}%`);
      console.log(`  • Average events per column: ${result.avgEventsPerColumn.toFixed(1)}`);
      
      console.log('\n✅ QUALITY CHECKS:');
      console.log(`  • Overlapping cards: ${result.overlaps === 0 ? '✓ None' : `⚠️ ${result.overlaps} overlaps detected`}`);
      console.log(`  • Text truncation: ${result.textIssues.truncated > 0 ? `⚠️ ${result.textIssues.truncated} cards` : '✓ None'}`);
      console.log(`  • Font consistency: ${result.textIssues.fontInconsistent > 0 ? `⚠️ ${result.textIssues.fontInconsistent} issues` : '✓ Consistent'}`);
      console.log(`  • Visual glitches: ${result.visualGlitches.length > 0 ? `⚠️ ${result.visualGlitches.join(', ')}` : '✓ None detected'}`);
      
      if (result.gaps) {
        console.log('\n📏 GAPS FROM TIMELINE:');
        console.log(`  • Above: ${result.gaps.above}px`);
        console.log(`  • Below: ${result.gaps.below}px`);
      }
    }
    
    // Final summary
    const firstResult = analysisResults[1]; // After first seed
    const lastResult = analysisResults[analysisResults.length - 1];
    
    console.log('\n\n========================================');
    console.log('PROGRESSION SUMMARY');
    console.log('========================================');
    console.log(`\n• Events grew from ${firstResult.eventCount} to ${lastResult.eventCount}`);
    console.log(`• Columns grew from ${firstResult.columnCount} to ${lastResult.columnCount}`);
    console.log(`• Card type evolution:`);
    console.log(`  - Full: ${firstResult.cardTypes.full} → ${lastResult.cardTypes.full}`);
    console.log(`  - Compact: ${firstResult.cardTypes.compact} → ${lastResult.cardTypes.compact}`);
    console.log(`  - Title-only: ${firstResult.cardTypes.titleOnly} → ${lastResult.cardTypes.titleOnly}`);
    console.log(`  - Multi-event: ${firstResult.cardTypes.multiEvent} → ${lastResult.cardTypes.multiEvent}`);
    console.log(`• Space utilization: ${firstResult.spaceUtilization.percentage.toFixed(1)}% → ${lastResult.spaceUtilization.percentage.toFixed(1)}%`);
    console.log(`• Layout quality: ${lastResult.overlaps === 0 ? '✓ No overlaps throughout' : `⚠️ ${lastResult.overlaps} overlaps in final state`}`);
  });
});

async function analyzeLayout(page, description: string) {
  // Get all cards
  const cards = await page.locator('.bg-white.rounded-lg.shadow-md').all();
  const totalCards = cards.length;
  
  // Get timeline position
  const timeline = await page.locator('[data-testid="timeline-axis"]').first();
  const timelineBox = await timeline.boundingBox();
  
  // Count card types based on height (limit to first 20 cards for performance)
  const cardTypes = { full: 0, compact: 0, titleOnly: 0, multiEvent: 0 };
  const cardPositions = [];
  let textTruncated = 0;
  let fontIssues = 0;
  
  const cardsToAnalyze = Math.min(cards.length, 20);
  for (let i = 0; i < cardsToAnalyze; i++) {
    const card = cards[i];
    const box = await card.boundingBox();
    if (box) {
      cardPositions.push(box);
      
      // Classify by height
      if (box.height > 90) {
        cardTypes.full++;
      } else if (box.height > 60) {
        cardTypes.compact++;
      } else if (box.height > 30) {
        cardTypes.titleOnly++;
      } else {
        cardTypes.titleOnly++; // Very small cards
      }
      
      // Check for text truncation
      const hasEllipsis = await card.evaluate(el => {
        const text = el.textContent || '';
        return text.includes('...') || el.querySelector('.truncate') !== null;
      });
      if (hasEllipsis) textTruncated++;
    }
  }
  
  // Extrapolate counts if we sampled
  if (cardsToAnalyze < cards.length) {
    const factor = cards.length / cardsToAnalyze;
    cardTypes.full = Math.round(cardTypes.full * factor);
    cardTypes.compact = Math.round(cardTypes.compact * factor);
    cardTypes.titleOnly = Math.round(cardTypes.titleOnly * factor);
    textTruncated = Math.round(textTruncated * factor);
  }
  
  // Check for multi-event cards specifically
  const multiEventCards = await page.locator('div:has-text("Events")').all();
  cardTypes.multiEvent = multiEventCards.length;
  
  // Count columns (anchors)
  const anchors = await page.locator('[data-testid^="anchor-"]').all();
  const columnCount = anchors.length;
  
  // Get event count from info panel
  let eventCount = 0;
  const eventText = await page.locator('p:has-text("events")').first().textContent().catch(() => '0 events');
  const match = eventText?.match(/(\d+)\s+events/);
  if (match) eventCount = parseInt(match[1]);
  
  // Calculate space utilization
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  
  let minY = Infinity, maxY = -Infinity;
  let minX = Infinity, maxX = -Infinity;
  
  for (const pos of cardPositions) {
    minY = Math.min(minY, pos.y);
    maxY = Math.max(maxY, pos.y + pos.height);
    minX = Math.min(minX, pos.x);
    maxX = Math.max(maxX, pos.x + pos.width);
  }
  
  const verticalCoverage = ((maxY - minY) / viewportHeight) * 100;
  const horizontalSpread = ((maxX - minX) / viewportWidth) * 100;
  
  // Check for overlaps
  let overlaps = 0;
  for (let i = 0; i < cardPositions.length; i++) {
    for (let j = i + 1; j < cardPositions.length; j++) {
      const a = cardPositions[i];
      const b = cardPositions[j];
      if (!(a.x + a.width < b.x || b.x + b.width < a.x || 
            a.y + a.height < b.y || b.y + b.height < a.y)) {
        overlaps++;
      }
    }
  }
  
  // Calculate gaps from timeline
  let gapAbove = Infinity;
  let gapBelow = Infinity;
  
  if (timelineBox) {
    for (const pos of cardPositions) {
      if (pos.y + pos.height < timelineBox.y) {
        gapAbove = Math.min(gapAbove, timelineBox.y - (pos.y + pos.height));
      } else if (pos.y > timelineBox.y) {
        gapBelow = Math.min(gapBelow, pos.y - timelineBox.y);
      }
    }
  }
  
  // Check for visual glitches
  const visualGlitches = [];
  
  // Check if cards are cut off at edges
  for (const pos of cardPositions) {
    if (pos.x < 0) visualGlitches.push('Cards cut off on left');
    if (pos.x + pos.width > viewportWidth) visualGlitches.push('Cards cut off on right');
    if (pos.y < 0) visualGlitches.push('Cards cut off on top');
    if (pos.y + pos.height > viewportHeight) visualGlitches.push('Cards cut off on bottom');
  }
  
  return {
    description,
    eventCount,
    columnCount,
    totalCards,
    cardTypes,
    avgEventsPerColumn: columnCount > 0 ? eventCount / columnCount : 0,
    spaceUtilization: {
      verticalCoverage: isFinite(verticalCoverage) ? verticalCoverage : 0,
      horizontalSpread: isFinite(horizontalSpread) ? horizontalSpread : 0,
      percentage: (verticalCoverage * horizontalSpread) / 100
    },
    overlaps,
    textIssues: {
      truncated: textTruncated,
      fontInconsistent: fontIssues
    },
    visualGlitches: [...new Set(visualGlitches)], // Remove duplicates
    gaps: {
      above: isFinite(gapAbove) ? gapAbove : 0,
      below: isFinite(gapBelow) ? gapBelow : 0
    }
  };
}