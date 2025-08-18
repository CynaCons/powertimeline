import { test, expect } from '@playwright/test';

test.describe('Deep Space Usage Analysis', () => {
  test('analyze vertical and horizontal space distribution', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Enable dev mode and open panel
    await page.click('button[aria-label="Toggle developer options"]');
    await page.waitForTimeout(200);
    await page.click('button[aria-label="Developer Panel"]', { force: true });
    await page.waitForTimeout(500);
    
    // Add clustered events
    await page.click('button:has-text("Clustered")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Clustered")');
    await page.waitForTimeout(1000);
    
    // Close dev panel
    await page.click('button[aria-label="Developer Panel"]');
    await page.waitForTimeout(500);
    
    // Take screenshot for analysis
    await page.screenshot({ 
      path: 'test-results/space-usage-analysis.png',
      fullPage: false 
    });
    
    // Get viewport dimensions
    const viewport = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight
    }));
    
    // Get timeline position
    const timeline = await page.locator('[data-testid="timeline-axis"]').first();
    const timelineBox = await timeline.boundingBox();
    
    // Get all cards
    const cards = await page.locator('.bg-white.rounded-lg.shadow-md').all();
    
    // Analyze vertical distribution
    const verticalZones = {
      farAbove: [], // > 200px above timeline
      nearAbove: [], // 20-200px above timeline
      nearBelow: [], // 20-200px below timeline
      farBelow: []  // > 200px below timeline
    };
    
    const horizontalZones = {
      left: [],     // 0-33% of width
      center: [],   // 33-66% of width
      right: []     // 66-100% of width
    };
    
    let minY = Infinity, maxY = 0;
    let minX = Infinity, maxX = 0;
    const cardsByColumn = new Map(); // Track cards per X position
    
    console.log('\n=== SPACE USAGE ANALYSIS ===');
    console.log(`Viewport: ${viewport.width}x${viewport.height}px`);
    console.log(`Timeline Y: ${timelineBox?.y}px`);
    console.log(`Total cards: ${cards.length}`);
    
    // Analyze first 30 cards in detail
    for (let i = 0; i < Math.min(30, cards.length); i++) {
      const card = cards[i];
      const box = await card.boundingBox();
      
      if (box && timelineBox) {
        // Track bounds
        minY = Math.min(minY, box.y);
        maxY = Math.max(maxY, box.y + box.height);
        minX = Math.min(minX, box.x);
        maxX = Math.max(maxX, box.x + box.width);
        
        // Vertical zone classification
        const distanceFromTimeline = box.y < timelineBox.y 
          ? timelineBox.y - (box.y + box.height)  // Above
          : box.y - timelineBox.y;                 // Below
        
        if (box.y + box.height < timelineBox.y) {
          // Card is above timeline
          if (distanceFromTimeline > 200) {
            verticalZones.farAbove.push(i);
          } else {
            verticalZones.nearAbove.push(i);
          }
        } else if (box.y > timelineBox.y) {
          // Card is below timeline
          if (distanceFromTimeline > 200) {
            verticalZones.farBelow.push(i);
          } else {
            verticalZones.nearBelow.push(i);
          }
        }
        
        // Horizontal zone classification
        const xPercent = box.x / viewport.width;
        if (xPercent < 0.33) {
          horizontalZones.left.push(i);
        } else if (xPercent < 0.66) {
          horizontalZones.center.push(i);
        } else {
          horizontalZones.right.push(i);
        }
        
        // Track column clustering
        const columnKey = Math.floor(box.x / 50) * 50; // Group by 50px columns
        if (!cardsByColumn.has(columnKey)) {
          cardsByColumn.set(columnKey, []);
        }
        cardsByColumn.get(columnKey).push(i);
      }
    }
    
    // Calculate actual space usage
    const actualHeight = maxY - minY;
    const actualWidth = maxX - minX;
    const verticalUsage = (actualHeight / viewport.height) * 100;
    const horizontalUsage = (actualWidth / viewport.width) * 100;
    
    // Calculate distribution efficiency
    const timelineSpace = timelineBox ? {
      aboveSpace: timelineBox.y,
      belowSpace: viewport.height - timelineBox.y
    } : { aboveSpace: 0, belowSpace: 0 };
    
    // Report findings
    console.log('\n📐 VERTICAL DISTRIBUTION:');
    console.log(`  Far above timeline (>200px): ${verticalZones.farAbove.length} cards`);
    console.log(`  Near above timeline (20-200px): ${verticalZones.nearAbove.length} cards`);
    console.log(`  Near below timeline (20-200px): ${verticalZones.nearBelow.length} cards`);
    console.log(`  Far below timeline (>200px): ${verticalZones.farBelow.length} cards`);
    
    console.log('\n📐 HORIZONTAL DISTRIBUTION:');
    console.log(`  Left third (0-33%): ${horizontalZones.left.length} cards`);
    console.log(`  Center third (33-66%): ${horizontalZones.center.length} cards`);
    console.log(`  Right third (66-100%): ${horizontalZones.right.length} cards`);
    
    console.log('\n📊 SPACE UTILIZATION:');
    console.log(`  Vertical coverage: ${verticalUsage.toFixed(1)}% (${actualHeight.toFixed(0)}px of ${viewport.height}px)`);
    console.log(`  Horizontal coverage: ${horizontalUsage.toFixed(1)}% (${actualWidth.toFixed(0)}px of ${viewport.width}px)`);
    console.log(`  Card bounds: Y[${minY.toFixed(0)}-${maxY.toFixed(0)}], X[${minX.toFixed(0)}-${maxX.toFixed(0)}]`);
    
    console.log('\n⚖️ BALANCE ANALYSIS:');
    const aboveCards = verticalZones.farAbove.length + verticalZones.nearAbove.length;
    const belowCards = verticalZones.farBelow.length + verticalZones.nearBelow.length;
    console.log(`  Cards above timeline: ${aboveCards}`);
    console.log(`  Cards below timeline: ${belowCards}`);
    console.log(`  Above/Below ratio: ${aboveCards}:${belowCards}`);
    console.log(`  Available space above: ${timelineSpace.aboveSpace.toFixed(0)}px`);
    console.log(`  Available space below: ${timelineSpace.belowSpace.toFixed(0)}px`);
    
    console.log('\n🏛️ COLUMN DENSITY:');
    const sortedColumns = Array.from(cardsByColumn.entries()).sort((a, b) => a[0] - b[0]);
    let maxCardsInColumn = 0;
    for (const [x, cardIndices] of sortedColumns) {
      maxCardsInColumn = Math.max(maxCardsInColumn, cardIndices.length);
      if (cardIndices.length > 5) {
        console.log(`  Column at X=${x}: ${cardIndices.length} cards (OVERCROWDED)`);
      }
    }
    console.log(`  Total columns: ${sortedColumns.length}`);
    console.log(`  Max cards in single column: ${maxCardsInColumn}`);
    
    // Identify issues
    console.log('\n⚠️ IDENTIFIED ISSUES:');
    const issues = [];
    
    if (verticalUsage < 70) {
      issues.push(`Underutilizing vertical space (only ${verticalUsage.toFixed(1)}%)`);
    }
    if (horizontalUsage < 80) {
      issues.push(`Underutilizing horizontal space (only ${horizontalUsage.toFixed(1)}%)`);
    }
    if (Math.abs(aboveCards - belowCards) > 5) {
      issues.push(`Unbalanced vertical distribution (${aboveCards} above vs ${belowCards} below)`);
    }
    if (verticalZones.farAbove.length > 0 || verticalZones.farBelow.length > 0) {
      issues.push(`Cards too far from timeline (${verticalZones.farAbove.length + verticalZones.farBelow.length} cards >200px away)`);
    }
    if (horizontalZones.left.length > horizontalZones.center.length + horizontalZones.right.length) {
      issues.push(`Left-heavy horizontal distribution`);
    }
    if (maxCardsInColumn > 8) {
      issues.push(`Column overcrowding (max ${maxCardsInColumn} cards in one column)`);
    }
    
    if (issues.length > 0) {
      issues.forEach(issue => console.log(`  • ${issue}`));
    } else {
      console.log('  ✓ No major spacing issues detected');
    }
    
    // Calculate wasted space
    const totalArea = viewport.width * viewport.height;
    const usedArea = actualWidth * actualHeight;
    const efficiency = (usedArea / totalArea) * 100;
    
    console.log('\n📈 EFFICIENCY METRICS:');
    console.log(`  Total viewport area: ${totalArea.toFixed(0)}px²`);
    console.log(`  Used area: ${usedArea.toFixed(0)}px²`);
    console.log(`  Area efficiency: ${efficiency.toFixed(1)}%`);
    console.log(`  Wasted space: ${(100 - efficiency).toFixed(1)}%`);
  });
});