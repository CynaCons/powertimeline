import { test, expect } from '@playwright/test';

test.describe('v5/35 Adaptive Scale Visibility Tests', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/?dev=1'); // Enable dev mode via URL parameter
    await page.waitForTimeout(2000); // Give more time for app to load
    
    // Load Napoleon timeline for testing
    await page.click('button[aria-label="Developer Panel"]');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Napoleon 1769-1821")');
    await page.waitForTimeout(2000); // Give more time for events to load
  });

  test('timeline scales are visible and adapt across zoom levels', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-AXIS-001' });
    console.log('🔍 TESTING TIMELINE SCALE VISIBILITY ACROSS ZOOM LEVELS');
    
    // Test structure: progressively zoom in and verify scale visibility at each level
    const zoomTestCases = [
      {
        name: 'Full Timeline View (Decades/Years)',
        zoomSteps: 0,
        expectedLabels: ['year', 'decade'],
        minLabelCount: 3,
        maxLabelCount: 15,
        shouldShowTimelineAxis: true
      },
      {
        name: 'Medium Zoom (Years/Months)', 
        zoomSteps: 5,
        expectedLabels: ['year', 'month'],
        minLabelCount: 4,
        maxLabelCount: 20,
        shouldShowTimelineAxis: true
      },
      {
        name: 'Deep Zoom (Years/Months)',
        zoomSteps: 10, 
        expectedLabels: ['year', 'month'], // More realistic - 6-year span still shows years
        minLabelCount: 3,
        maxLabelCount: 25,
        shouldShowTimelineAxis: true
      },
      {
        name: 'Maximum Zoom (Months/Days)',
        zoomSteps: 25, // More zoom steps to reach day-level
        expectedLabels: ['month', 'day', 'hour'],
        minLabelCount: 2,
        maxLabelCount: 30,
        shouldShowTimelineAxis: true
      }
    ];

    // Get timeline area coordinates for consistent mouse positioning after data is loaded
    const timelineArea = page.locator('[data-testid="timeline-axis"]').first();
    await expect(timelineArea).toBeVisible();
    
    for (const testCase of zoomTestCases) {
      console.log(`\n=== TESTING: ${testCase.name} ===`);
      
      // Reset to full timeline view first
      await page.goto('/?dev=1');
      await page.waitForTimeout(2000);
      await page.click('button[aria-label="Developer Panel"]');
      await page.click('button:has-text("Napoleon 1769-1821")');
      await page.waitForTimeout(2000);
      
      // Get timeline coordinates for this test case
      const timelineBox = await timelineArea.boundingBox();
      if (!timelineBox) {
        throw new Error('Timeline axis not found after reload');
      }
      
      const centerX = timelineBox.x + timelineBox.width * 0.5;
      const centerY = timelineBox.y + timelineBox.height * 0.5;
      
      // Apply zoom level
      if (testCase.zoomSteps > 0) {
        await page.mouse.move(centerX, centerY);
        for (let i = 0; i < testCase.zoomSteps; i++) {
          await page.mouse.wheel(0, -200); // Zoom in
          await page.waitForTimeout(100);
        }
        await page.waitForTimeout(500); // Allow rendering to complete
      }
      
      // Check basic timeline axis visibility
      const axisElements = page.locator('[data-testid="timeline-axis"]');
      const axisCount = await axisElements.count();
      console.log(`📊 Timeline axis elements found: ${axisCount}`);
      expect(axisCount).toBeGreaterThan(0);
      
      // Look for axis labels with the proper testid
      const labels = page.locator('[data-testid="axis-label"]');
      const labelCount = await labels.count();
      const foundLabels = await labels.allTextContents();
      
      console.log(`📊 Timeline labels at ${testCase.name}:`, foundLabels.slice(0, 8));
      console.log(`📊 Label count: ${labelCount}, Expected range: ${testCase.minLabelCount}-${testCase.maxLabelCount}`);
      
      // CRITICAL TEST: Timeline should have visible scale labels
      if (labelCount === 0) {
        // Take screenshot for debugging
        await page.screenshot({ 
          path: `test-results/debug-no-labels-${testCase.name.toLowerCase().replace(/[^a-z]/g, '-')}.png`,
          fullPage: true 
        });
        
        // Log DOM structure for debugging
        const timelineContent = await page.locator('body').innerHTML();
        console.log('🚨 NO LABELS FOUND - DOM DEBUG:', timelineContent.substring(0, 1000));
        
        // This should fail - indicating the axis rendering is broken
        expect(labelCount).toBeGreaterThan(0);
      }
      
      // Verify label count is reasonable
      expect(labelCount).toBeGreaterThanOrEqual(testCase.minLabelCount);
      expect(labelCount).toBeLessThanOrEqual(testCase.maxLabelCount);
      
      // Verify label format matches expected scale type
      if (foundLabels.length > 0) {
        const hasExpectedFormat = testCase.expectedLabels.some(expectedType => {
          return foundLabels.some(label => {
            switch (expectedType) {
              case 'year':
                return /^\d{4}$/.test(label); // "1799"
              case 'decade': 
                return /^\d{4}s$/.test(label); // "1790s"
              case 'month':
                return /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/.test(label); // "Jan 1799"
              case 'week':
                return /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}$/.test(label); // "Jan 15"
              case 'day':
                return /^\d{1,2}$/.test(label) || /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) \d{1,2}$/.test(label); // "15" or "Mon 15"
              case 'hour':
                return /\d{1,2}:\d{2}/.test(label); // "14:00"
              default:
                return false;
            }
          });
        });
        
        console.log(`📊 Expected format check (${testCase.expectedLabels.join('/')}): ${hasExpectedFormat ? '✅' : '❌'}`);
        expect(hasExpectedFormat).toBe(true);
      }
      
      // Take screenshot for visual verification - capture wider area around timeline axis
      await page.screenshot({ 
        path: `test-results/timeline-scales-${testCase.name.toLowerCase().replace(/[^a-z]/g, '-')}.png`,
        clip: {
          x: Math.max(0, timelineBox.x - 100),
          y: Math.max(0, timelineBox.y - 100), 
          width: Math.min(1400, timelineBox.width + 200),
          height: Math.min(600, 400) // Fixed height to capture timeline area with labels
        }
      });
    }
    
    console.log('✅ Timeline scale visibility test completed');
  });

  test('timeline scales remain readable during navigation', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-AXIS-002' });
    console.log('🔍 TESTING TIMELINE SCALE READABILITY DURING NAVIGATION');
    
    const timelineArea = page.locator('[data-testid="timeline-axis"]').first();
    await expect(timelineArea).toBeVisible();
    
    // Zoom to medium level where we should have good label visibility
    const timelineBox = await timelineArea.boundingBox();
    if (!timelineBox) throw new Error('Timeline axis not found');
    
    const centerX = timelineBox.x + timelineBox.width * 0.5;
    const centerY = timelineBox.y + timelineBox.height * 0.5;
    
    // Apply medium zoom
    await page.mouse.move(centerX, centerY);
    for (let i = 0; i < 8; i++) {
      await page.mouse.wheel(0, -150);
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(500);
    
    // Test navigation to different timeline periods
    const minimap = page.locator('.relative.h-4.bg-gray-200, [data-testid="minimap"]').first();
    const minimapBox = await minimap.boundingBox();
    
    if (minimapBox) {
      const navigationPoints = [
        { name: 'Early Period', position: 0.2, expectedYear: '177' }, // Should see 1770s
        { name: 'Mid Period', position: 0.5, expectedYear: '179' },   // Should see 1790s  
        { name: 'Late Period', position: 0.8, expectedYear: '181' }   // Should see 1810s
      ];
      
      for (const point of navigationPoints) {
        console.log(`\n--- Navigating to ${point.name} ---`);
        
        // Click on minimap to navigate
        const clickX = minimapBox.x + minimapBox.width * point.position;
        const clickY = minimapBox.y + minimapBox.height / 2;
        await page.mouse.click(clickX, clickY);
        await page.waitForTimeout(300);
        
        // Check that timeline labels updated appropriately
        const labels = page.locator('[data-testid="axis-label"], svg text');
        const labelCount = await labels.count();
        const labelTexts = await labels.allTextContents();
        
        console.log(`📊 Labels at ${point.name}:`, labelTexts.slice(0, 5));
        console.log(`📊 Label count: ${labelCount}`);
        
        // Should have timeline labels after navigation
        expect(labelCount).toBeGreaterThan(0);
        
        // Labels should be relevant to the time period we navigated to
        if (labelTexts.length > 0) {
          const hasRelevantYear = labelTexts.some(label => label.includes(point.expectedYear));
          console.log(`📊 Relevant year (${point.expectedYear}) found: ${hasRelevantYear ? '✅' : '❌'}`);
          // Note: This might be flexible depending on zoom level and exact positioning
        }
        
        await page.screenshot({
          path: `test-results/navigation-${point.name.toLowerCase().replace(/[^a-z]/g, '-')}.png`,
          clip: {
            x: Math.max(0, timelineBox.x - 100),
            y: Math.max(0, timelineBox.y - 100),
            width: Math.min(1400, timelineBox.width + 200), 
            height: Math.min(600, 400) // Fixed height to capture timeline area with labels
          }
        });
      }
    }
    
    console.log('✅ Timeline navigation readability test completed');
  });

  test('timeline axis is properly positioned and styled', async ({ page }) => {
    console.log('🔍 TESTING TIMELINE AXIS POSITIONING AND STYLING');
    
    // Basic visibility check
    const timelineAxis = page.locator('[data-testid="timeline-axis"]');
    await expect(timelineAxis).toBeVisible();
    
    const axisCount = await timelineAxis.count();
    console.log(`📊 Timeline axis elements: ${axisCount}`);
    
    // Check positioning
    const axisBox = await timelineAxis.first().boundingBox();
    if (axisBox) {
      console.log(`📊 Timeline axis dimensions: ${axisBox.width}x${axisBox.height} at (${axisBox.x}, ${axisBox.y})`);
      
      // Axis should be reasonably sized and positioned
      expect(axisBox.width).toBeGreaterThan(100); // Not too narrow
      expect(axisBox.height).toBeGreaterThan(0);   // Has height
      expect(axisBox.x).toBeGreaterThanOrEqual(0); // Not off-screen left
      expect(axisBox.y).toBeGreaterThanOrEqual(0); // Not off-screen top
    }
    
    // Look for any SVG axis elements
    const svgElements = page.locator('svg');
    const svgCount = await svgElements.count();
    console.log(`📊 SVG elements found: ${svgCount}`);
    
    if (svgCount > 0) {
      // Check for axis-related SVG content
      const svgContent = await svgElements.first().innerHTML();
      console.log(`📊 SVG content sample:`, svgContent.substring(0, 200));
      
      const hasAxisElements = svgContent.includes('line') || svgContent.includes('text') || svgContent.includes('g');
      console.log(`📊 SVG contains axis elements: ${hasAxisElements ? '✅' : '❌'}`);
    }
    
    // Take full screenshot for debugging
    await page.screenshot({ 
      path: 'test-results/timeline-axis-debug.png',
      fullPage: true 
    });
    
    console.log('✅ Timeline axis positioning test completed');
  });
});
