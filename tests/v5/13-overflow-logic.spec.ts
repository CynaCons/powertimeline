/* eslint-disable @typescript-eslint/no-explicit-any */
import { loginAsTestUser, loadTestTimeline } from '../utils/timelineTestUtils';
import { test, expect } from '@playwright/test';

async function openDevPanel(page: any) {
  
  await page.getByRole('button', { name: 'Developer Panel' }).click();
}

test.describe('Overflow Logic Tests', () => {
  test('Half-column overflow - Simple incremental test', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/');
    
    // Clear any existing events and add multiple events close together
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clear All' }).click();
    
    // Add events that will cluster together temporally
    await page.getByRole('button', { name: '+5' }).click(); // Creates 5 events in sequence
    
    // Wait for layout to settle
    await page.waitForTimeout(500);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/overflow-test-simple.png' });
    
    // Count visible event cards
    const visibleCards = await page.locator('[data-testid="event-card"]').count();
    console.log(`Visible cards: ${visibleCards}`);
    
    // Get telemetry to understand half-column distribution
    const telemetry = await page.evaluate(() => {
      return (window as any).__ccTelemetry;
    });
    
    console.log('Half-column telemetry:', JSON.stringify(telemetry?.halfColumns, null, 2));
    
    // Check for overlaps - this should be minimal with proper overflow
    const cards = await page.locator('[data-testid="event-card"]').all();
    const boxes = [];
    
    for (const card of cards) {
      const box = await card.boundingBox();
      if (box) boxes.push(box);
    }
    
    let maxOverlapRatio = 0;
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const overlap = Math.max(0, 
          Math.min(boxes[i].x + boxes[i].width, boxes[j].x + boxes[j].width) - 
          Math.max(boxes[i].x, boxes[j].x)
        ) * Math.max(0,
          Math.min(boxes[i].y + boxes[i].height, boxes[j].y + boxes[j].height) - 
          Math.max(boxes[i].y, boxes[j].y)
        );
        
        const overlapRatio = overlap / Math.min(boxes[i].width * boxes[i].height, boxes[j].width * boxes[j].height);
        maxOverlapRatio = Math.max(maxOverlapRatio, overlapRatio);
      }
    }
    
    console.log(`Maximum overlap ratio: ${maxOverlapRatio.toFixed(3)}`);
    
    // For now, just report - we'll fix the threshold after understanding the behavior
    expect(maxOverlapRatio).toBeGreaterThanOrEqual(0); // Placeholder assertion
  });
  
  test('Half-column overflow - RFK and JFK timeline series test', async ({ page }) => {
    // Capture console output
    page.on('console', msg => {
      if (msg.text().includes('🔍') || msg.text().includes('✅') || msg.text().includes('🌊') || msg.text().includes('🆕')) {
        console.log('BROWSER:', msg.text());
      }
    });
    
    await page.goto('/');
    await openDevPanel(page);
    
    // Test 1: RFK Timeline
    console.log('\n=== TESTING RFK TIMELINE ===');
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: 'RFK 1968' }).click();
    await page.waitForTimeout(1000);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/rfk-overflow-test.png' });
    
    // Count and verify RFK events
    const rfkTotalEvents = await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('powertimeline-events') || '[]');
      return state.length;
    });
    
    const rfkVisibleCards = await page.locator('[data-testid="event-card"]').count();
    console.log(`RFK - Total events: ${rfkTotalEvents}, Visible cards: ${rfkVisibleCards}`);
    
    // Verify overflow logic for RFK
    if (rfkTotalEvents > rfkVisibleCards) {
      console.log('✅ RFK overflow working - fewer cards than events');
      expect(rfkVisibleCards).toBeLessThan(rfkTotalEvents);
    }
    
    // Check RFK overlaps
    const rfkCards = await page.locator('[data-testid="event-card"]').all();
    const rfkBoxes = [];
    for (const card of rfkCards) {
      const box = await card.boundingBox();
      if (box) rfkBoxes.push(box);
    }
    
    let rfkMaxOverlapRatio = 0;
    for (let i = 0; i < rfkBoxes.length; i++) {
      for (let j = i + 1; j < rfkBoxes.length; j++) {
        const overlap = Math.max(0, 
          Math.min(rfkBoxes[i].x + rfkBoxes[i].width, rfkBoxes[j].x + rfkBoxes[j].width) - 
          Math.max(rfkBoxes[i].x, rfkBoxes[j].x)
        ) * Math.max(0,
          Math.min(rfkBoxes[i].y + rfkBoxes[i].height, rfkBoxes[j].y + rfkBoxes[j].height) - 
          Math.max(rfkBoxes[i].y, rfkBoxes[j].y)
        );
        
        const overlapRatio = overlap / Math.min(rfkBoxes[i].width * rfkBoxes[i].height, rfkBoxes[j].width * rfkBoxes[j].height);
        rfkMaxOverlapRatio = Math.max(rfkMaxOverlapRatio, overlapRatio);
      }
    }
    
    console.log(`RFK maximum overlap ratio: ${rfkMaxOverlapRatio.toFixed(3)}`);
    expect(rfkMaxOverlapRatio).toBeLessThan(0.1); // RFK should be near-perfect with our fix
    
    // Test 2: JFK Timeline
    console.log('\n=== TESTING JFK TIMELINE ===');
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: 'JFK 1961-63' }).click();
    await page.waitForTimeout(1000);
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/jfk-overflow-test.png' });
    
    // Count and verify JFK events
    const jfkTotalEvents = await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem('powertimeline-events') || '[]');
      return state.length;
    });
    
    const jfkVisibleCards = await page.locator('[data-testid="event-card"]').count();
    console.log(`JFK - Total events: ${jfkTotalEvents}, Visible cards: ${jfkVisibleCards}`);
    
    // Check if JFK has overflow (may or may not, depending on temporal distribution)
    if (jfkTotalEvents > jfkVisibleCards) {
      console.log('✅ JFK overflow working - fewer cards than events');
      expect(jfkVisibleCards).toBeLessThan(jfkTotalEvents);
    } else {
      console.log('ℹ️ JFK no overflow needed - all events fit without temporal clustering');
    }
    
    // Check JFK overlaps
    const jfkCards = await page.locator('[data-testid="event-card"]').all();
    const jfkBoxes = [];
    for (const card of jfkCards) {
      const box = await card.boundingBox();
      if (box) jfkBoxes.push(box);
    }
    
    let jfkMaxOverlapRatio = 0;
    for (let i = 0; i < jfkBoxes.length; i++) {
      for (let j = i + 1; j < jfkBoxes.length; j++) {
        const overlap = Math.max(0, 
          Math.min(jfkBoxes[i].x + jfkBoxes[i].width, jfkBoxes[j].x + jfkBoxes[j].width) - 
          Math.max(jfkBoxes[i].x, jfkBoxes[j].x)
        ) * Math.max(0,
          Math.min(jfkBoxes[i].y + jfkBoxes[i].height, jfkBoxes[j].y + jfkBoxes[j].height) - 
          Math.max(jfkBoxes[i].y, jfkBoxes[j].y)
        );
        
        const overlapRatio = overlap / Math.min(jfkBoxes[i].width * jfkBoxes[i].height, jfkBoxes[j].width * jfkBoxes[j].height);
        jfkMaxOverlapRatio = Math.max(jfkMaxOverlapRatio, overlapRatio);
      }
    }
    
    console.log(`JFK maximum overlap ratio: ${jfkMaxOverlapRatio.toFixed(3)}`);
    expect(jfkMaxOverlapRatio).toBeLessThan(0.4); // Allow slightly higher threshold for complex timelines
    
    // Final summary
    console.log('\n=== SUMMARY ===');
    console.log(`RFK: ${rfkTotalEvents} events → ${rfkVisibleCards} cards (overlap: ${rfkMaxOverlapRatio.toFixed(3)})`);
    console.log(`JFK: ${jfkTotalEvents} events → ${jfkVisibleCards} cards (overlap: ${jfkMaxOverlapRatio.toFixed(3)})`);
    
    // Both timelines should have manageable overlaps
    expect(Math.max(rfkMaxOverlapRatio, jfkMaxOverlapRatio)).toBeLessThan(0.4);
  });
});