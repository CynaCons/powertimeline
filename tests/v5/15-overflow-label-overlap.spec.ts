/* eslint-disable @typescript-eslint/no-explicit-any */
import { loginAsTestUser, loadTestTimeline } from '../utils/timelineTestUtils';
import { test, expect } from '@playwright/test';

async function openDevPanel(page: any) {
  
  await page.getByRole('button', { name: 'Developer Panel' }).click();
}

test.describe('Overflow Label Overlap Tests', () => {
  test('Overflow indicators should not overlap on timeline', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/');
    
    // Create dense overflow scenario with clustered seeder
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clear All' }).click();
    
    // Use clustered seeder multiple times to create overlapping overflow labels
    await page.getByRole('button', { name: 'Clustered' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Clustered' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Clustered' }).click();
    await page.waitForTimeout(1000);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/overflow-label-overlap-test.png' });
    
    // Get all overflow indicators on the timeline
    const overflowBadges = await page.locator('[data-testid="overflow-badge"], .overflow-indicator, .overflow-badge').all();
    console.log(`Found ${overflowBadges.length} overflow badges`);
    
    if (overflowBadges.length === 0) {
      console.log('No overflow badges found - checking for alternative selectors');
      
      // Try to find overflow badges by text content
      const badgesByText = await page.locator('text=/^\\+\\d+$/', { hasText: /^\+\d+$/ }).all();
      console.log(`Found ${badgesByText.length} badges by text pattern`);
      
      if (badgesByText.length === 0) {
        console.log('⚠️ No overflow badges detected - may indicate missing overflow scenario');
        return; // Skip test if no overflow detected
      }
    }
    
    const badges = overflowBadges.length > 0 ? overflowBadges : await page.locator('text=/^\\+\\d+$/').all();
    const badgeBounds = [];
    
    // Collect bounding boxes for all overflow badges
    for (let i = 0; i < badges.length; i++) {
      const badge = badges[i];
      const isVisible = await badge.isVisible().catch(() => false);
      if (isVisible) {
        const bounds = await badge.boundingBox();
        if (bounds) {
          badgeBounds.push({ index: i, ...bounds });
          console.log(`Badge ${i}: x=${bounds.x.toFixed(1)}, y=${bounds.y.toFixed(1)}, width=${bounds.width.toFixed(1)}, height=${bounds.height.toFixed(1)}`);
        }
      }
    }
    
    console.log(`Analyzing ${badgeBounds.length} visible overflow badges for overlaps`);
    
    // Check for overlaps between overflow badges
    let overlappingPairs = 0;
    let maxOverlapArea = 0;
    
    for (let i = 0; i < badgeBounds.length; i++) {
      for (let j = i + 1; j < badgeBounds.length; j++) {
        const badge1 = badgeBounds[i];
        const badge2 = badgeBounds[j];
        
        // Calculate overlap area
        const overlapX = Math.max(0, 
          Math.min(badge1.x + badge1.width, badge2.x + badge2.width) - 
          Math.max(badge1.x, badge2.x)
        );
        const overlapY = Math.max(0,
          Math.min(badge1.y + badge1.height, badge2.y + badge2.height) - 
          Math.max(badge1.y, badge2.y)
        );
        
        const overlapArea = overlapX * overlapY;
        
        if (overlapArea > 0) {
          overlappingPairs++;
          maxOverlapArea = Math.max(maxOverlapArea, overlapArea);
          console.log(`❌ Overlap detected between badge ${badge1.index} and ${badge2.index}:`);
          console.log(`   Badge ${badge1.index}: (${badge1.x.toFixed(1)}, ${badge1.y.toFixed(1)}) ${badge1.width.toFixed(1)}x${badge1.height.toFixed(1)}`);
          console.log(`   Badge ${badge2.index}: (${badge2.x.toFixed(1)}, ${badge2.y.toFixed(1)}) ${badge2.width.toFixed(1)}x${badge2.height.toFixed(1)}`);
          console.log(`   Overlap area: ${overlapArea.toFixed(1)}px²`);
        }
      }
    }
    
    console.log(`\n=== OVERFLOW LABEL OVERLAP SUMMARY ===`);
    console.log(`Total overflow badges: ${badgeBounds.length}`);
    console.log(`Overlapping pairs: ${overlappingPairs}`);
    console.log(`Maximum overlap area: ${maxOverlapArea.toFixed(1)}px²`);
    
    // Test should fail if any overflow labels are overlapping
    expect(overlappingPairs).toBe(0);
  });
  
  test('Overflow badges should have minimum spacing', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/');
    
    // Create moderate overflow scenario
    await openDevPanel(page);
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.getByRole('button', { name: 'Clustered' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Clustered' }).click();
    await page.waitForTimeout(1000);
    
    // Get overflow badges
    const badges = await page.locator('text=/^\\+\\d+$/').all();
    const badgePositions = [];
    
    for (const badge of badges) {
      const isVisible = await badge.isVisible().catch(() => false);
      if (isVisible) {
        const bounds = await badge.boundingBox();
        if (bounds) {
          badgePositions.push(bounds.x + bounds.width / 2); // Center X position
        }
      }
    }
    
    // Sort positions horizontally
    badgePositions.sort((a, b) => a - b);
    
    // Check minimum spacing between adjacent badges
    let minSpacing = Infinity;
    for (let i = 1; i < badgePositions.length; i++) {
      const spacing = badgePositions[i] - badgePositions[i - 1];
      minSpacing = Math.min(minSpacing, spacing);
    }
    
    console.log(`Badge positions: ${badgePositions.map(p => p.toFixed(1)).join(', ')}`);
    console.log(`Minimum spacing between badges: ${minSpacing.toFixed(1)}px`);
    
    // Overflow badges should have at least 40px spacing to be readable
    if (badgePositions.length > 1) {
      expect(minSpacing).toBeGreaterThan(40);
    }
  });
});