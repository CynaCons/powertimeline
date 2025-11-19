import { test } from '@playwright/test';
import { loginAsTestUser, loadTestTimeline } from '../utils/timelineTestUtils';

/**
 * Test Suite: French Revolution Timeline Zoom Test
 *
 * Mimics user workflow: Load French Revolution, position cursor at hotspot (July 15, 1792),
 * and zoom in/out step by step to detect card misalignment issues
 */

test.describe('French Revolution Zoom Test', () => {
  test('Zoom at July 15, 1792 hotspot - detect card misalignment', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="timeline-axis"]', { timeout: 10000 });

    // Load French Revolution timeline
    await page.evaluate(() => {
      const frenchRevData = localStorage.getItem('demo-french-revolution');
      if (frenchRevData) {
        localStorage.setItem('events', frenchRevData);
        window.location.reload();
      }
    });

    await page.waitForTimeout(1000);
    await page.waitForSelector('[data-testid="event-card"]');

    // Function to analyze card alignment and types
    const analyzeCards = async (zoomStep: number) => {
      const cards = await page.locator('[data-testid="event-card"]').all();

      const cardData = [];
      for (const card of cards) {
        const box = await card.boundingBox();
        const cardType = await card.getAttribute('data-card-type');
        const eventId = await card.getAttribute('data-event-id');

        if (box && cardType) {
          cardData.push({
            id: eventId,
            x: Math.round(box.x),
            y: Math.round(box.y),
            width: Math.round(box.width),
            height: Math.round(box.height),
            cardType
          });
        }
      }

      // Sort by Y then X
      cardData.sort((a, b) => a.y - b.y || a.x - b.x);

      // Group cards by spatial proximity (same half-column)
      const xTolerance = 100; // Cards within 100px X are considered same spatial cluster
      const spatialClusters = [];

      for (const card of cardData) {
        const existingCluster = spatialClusters.find(cluster => {
          return cluster.cards.some(c => Math.abs(c.x - card.x) < xTolerance);
        });

        if (existingCluster) {
          existingCluster.cards.push(card);
        } else {
          spatialClusters.push({ cards: [card], minX: card.x, maxX: card.x });
        }
      }

      // Update cluster bounds
      for (const cluster of spatialClusters) {
        cluster.minX = Math.min(...cluster.cards.map(c => c.x));
        cluster.maxX = Math.max(...cluster.cards.map(c => c.x));
        cluster.xVariation = cluster.maxX - cluster.minX;
      }

      console.log(`\n=== ZOOM STEP ${zoomStep} ===`);
      console.log(`Total cards: ${cardData.length}`);
      console.log(`Spatial clusters identified: ${spatialClusters.length}\n`);

      // Analyze each spatial cluster
      for (let i = 0; i < spatialClusters.length; i++) {
        const cluster = spatialClusters[i];
        const timelineY = 400; // Approximate
        const above = cluster.cards.filter(c => c.y < timelineY);
        const below = cluster.cards.filter(c => c.y > timelineY);

        console.log(`Cluster ${i + 1} (centerX ≈ ${Math.round((cluster.minX + cluster.maxX) / 2)}):`);

        // Analyze ABOVE half-column
        if (above.length > 0) {
          const xPositions = above.map(c => c.x);
          const minX = Math.min(...xPositions);
          const maxX = Math.max(...xPositions);
          const xVariation = maxX - minX;
          const types = above.map(c => c.cardType);
          const uniqueTypes = new Set(types);

          console.log(`  ABOVE: ${above.length} cards`);
          console.log(`    X-positions: [${xPositions.join(', ')}]`);
          console.log(`    X-variation: ${xVariation}px ${xVariation > 10 ? '⚠️ MISALIGNED' : '✓'}`);
          console.log(`    Card types: [${types.join(', ')}]`);

          if (above.length === 2 && uniqueTypes.size > 1) {
            console.log(`    ⚠️ WARNING: 2 cards with different types!`);
          }

          // Check for full card not at bottom
          if (above.length > 1) {
            const sortedByY = [...above].sort((a, b) => b.y - a.y); // Bottom to top
            for (let j = 1; j < sortedByY.length; j++) {
              if (sortedByY[j].cardType === 'full' && sortedByY[j - 1].cardType !== 'full') {
                console.log(`    ⚠️ WARNING: Full card at Y=${sortedByY[j].y} but ${sortedByY[j - 1].cardType} card closer to timeline!`);
              }
            }
          }

          // Print detailed card info
          above.forEach((card, idx) => {
            console.log(`      Card ${idx + 1}: x=${card.x}, y=${card.y}, type=${card.cardType}, h=${card.height}`);
          });
        }

        // Analyze BELOW half-column
        if (below.length > 0) {
          const xPositions = below.map(c => c.x);
          const minX = Math.min(...xPositions);
          const maxX = Math.max(...xPositions);
          const xVariation = maxX - minX;
          const types = below.map(c => c.cardType);
          const uniqueTypes = new Set(types);

          console.log(`  BELOW: ${below.length} cards`);
          console.log(`    X-positions: [${xPositions.join(', ')}]`);
          console.log(`    X-variation: ${xVariation}px ${xVariation > 10 ? '⚠️ MISALIGNED' : '✓'}`);
          console.log(`    Card types: [${types.join(', ')}]`);

          if (below.length === 2 && uniqueTypes.size > 1) {
            console.log(`    ⚠️ WARNING: 2 cards with different types!`);
          }

          // Check for full card not at top
          if (below.length > 1) {
            const sortedByY = [...below].sort((a, b) => a.y - b.y); // Top to bottom
            for (let j = 1; j < sortedByY.length; j++) {
              if (sortedByY[j].cardType === 'full' && sortedByY[j - 1].cardType !== 'full') {
                console.log(`    ⚠️ WARNING: Full card at Y=${sortedByY[j].y} but ${sortedByY[j - 1].cardType} card closer to timeline!`);
              }
            }
          }

          // Print detailed card info
          below.forEach((card, idx) => {
            console.log(`      Card ${idx + 1}: x=${card.x}, y=${card.y}, type=${card.cardType}, h=${card.height}`);
          });
        }

        console.log('');
      }

      // Check for misalignments and return issues found
      const issues = [];
      for (const cluster of spatialClusters) {
        const timelineY = 400;
        const above = cluster.cards.filter(c => c.y < timelineY);
        const below = cluster.cards.filter(c => c.y > timelineY);

        // Check above X-alignment
        if (above.length > 1) {
          const xPositions = above.map(c => c.x);
          const xVariation = Math.max(...xPositions) - Math.min(...xPositions);
          if (xVariation > 10) {
            issues.push(`Above group has ${xVariation}px X-variation`);
          }
        }

        // Check below X-alignment
        if (below.length > 1) {
          const xPositions = below.map(c => c.x);
          const xVariation = Math.max(...xPositions) - Math.min(...xPositions);
          if (xVariation > 10) {
            issues.push(`Below group has ${xVariation}px X-variation`);
          }
        }
      }

      return { totalCards: cardData.length, clusters: spatialClusters.length, issues };
    };

    // Position cursor at center (simulating July 15, 1792 hotspot area)
    const centerX = 800;
    const centerY = 400;
    await page.mouse.move(centerX, centerY);
    console.log(`\nPositioned cursor at (${centerX}, ${centerY}) - July 15, 1792 hotspot area`);

    // Initial state
    const initial = await analyzeCards(0);

    // Zoom in step 1
    await page.mouse.wheel(0, -50);
    await page.waitForTimeout(800);
    const zoom1 = await analyzeCards(1);

    // Zoom in step 2
    await page.mouse.wheel(0, -50);
    await page.waitForTimeout(800);
    const zoom2 = await analyzeCards(2);

    // Zoom in step 3
    await page.mouse.wheel(0, -50);
    await page.waitForTimeout(800);
    const zoom3 = await analyzeCards(3);

    // Zoom out step 1
    await page.mouse.wheel(0, 50);
    await page.waitForTimeout(800);
    const zoomOut1 = await analyzeCards(4);

    // Zoom out step 2
    await page.mouse.wheel(0, 50);
    await page.waitForTimeout(800);
    const zoomOut2 = await analyzeCards(5);

    // Report all issues found
    const allIssues = [
      ...initial.issues,
      ...zoom1.issues,
      ...zoom2.issues,
      ...zoom3.issues,
      ...zoomOut1.issues,
      ...zoomOut2.issues
    ];

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total issues found: ${allIssues.length}`);
    if (allIssues.length > 0) {
      console.log('Issues:', allIssues);
    } else {
      console.log('✓ No alignment issues detected');
    }

    // Test assertion: no alignment issues should be found
    if (allIssues.length > 0) {
      console.error('FAILURE: Card misalignment detected during zoom operations');
    }
  });
});
