import { test, expect } from '@playwright/test';

test.describe('v5/34 Adaptive Timeline Scales', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Load Napoleon timeline via developer hotkey to avoid selector drift
    await page.keyboard.press('Alt+d');
    await page.waitForTimeout(400);
    await page.click('button:has-text("Napoleon 1769-1821")');
    await page.waitForTimeout(600);
    await page.keyboard.press('Alt+d');
    await page.waitForTimeout(200);
  });

  test('timeline scales adapt from years to days across zoom levels', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-AXIS-001' });
    console.log('🔍 TESTING ADAPTIVE TIMELINE SCALES WITH DAY-LEVEL GRANULARITY');
    
    const timelineArea = page.locator('.absolute.inset-0.ml-14');
    const timelineBox = await timelineArea.boundingBox();
    const centerX = timelineBox!.x + timelineBox!.width * 0.5;
    const centerY = timelineBox!.y + timelineBox!.height * 0.5;
    
    // Test progressive zoom levels
    const zoomLevels = [
      { name: 'Full Timeline (Years/Decades)', steps: 0, expectedUnit: 'year' },
      { name: 'Medium Zoom (Years)', steps: 5, expectedUnit: 'year' },
      { name: 'Deep Zoom (Months)', steps: 10, expectedUnit: 'month' },
      { name: 'Maximum Zoom (Days)', steps: 18, expectedUnit: 'day' },
    ];
    
    for (const level of zoomLevels) {
      console.log(`\n=== TESTING: ${level.name} ===`);
      
      // Reset to full timeline
      await page.reload();
      await page.waitForSelector('[data-testid="timeline-axis"]', { timeout: 5000 });
      
      // Apply progressive zoom
      await page.mouse.move(centerX, centerY);
      for (let i = 0; i < level.steps; i++) {
        await page.mouse.wheel(0, -200);
        await page.waitForTimeout(50);
      }
      await page.waitForTimeout(300);
      await page.waitForSelector('[data-testid="axis-label"]', { timeout: 5000 });
      
      // Get axis labels
      const axisLabels = await page.locator('[data-testid="axis-label"]').allTextContents();
      console.log(`📊 Labels at ${level.name}:`, axisLabels.slice(0, 8)); // Show first 8 labels
      
      // Verify appropriate label count (not too crowded)
      expect(axisLabels.length).toBeGreaterThan(2);
      expect(axisLabels.length).toBeLessThan(25);
      
      // Verify appropriate time unit
      switch (level.expectedUnit) {
        case 'year': {
          const hasYears = axisLabels.some(label => /^\d{4}$/.test(label));
          expect(hasYears).toBe(true);
          break;
        }
          
        case 'month': {
          const hasMonths = axisLabels.some(label =>
            /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/.test(label)
          );
          expect(hasMonths).toBe(true);
          break;
        }
          
        case 'day': {
          // Day-level should show day numbers, day names, or detailed dates
          const hasDays = axisLabels.some(label =>
            /^\d{1,2}$/.test(label) ||                           // Day numbers: "15"
            /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) \d{1,2}$/.test(label) || // "Mon 15"
            /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}$/.test(label) || // "Jan 15"
            /:\d{2}/.test(label) ||                               // Hour format: "14:00"
            /\d{1,2}\s?(AM|PM)/i.test(label)                     // Hour format: "2 PM"
          );
          console.log(`Day-level format detected: ${hasDays}`);
          expect(hasDays).toBe(true);
          break;
        }
      }
      
      await page.screenshot({ 
        path: `test-results/adaptive-scales-${level.name.toLowerCase().replace(/[^a-z]/g, '-')}.png` 
      });
    }
  });

  test('timeline scales maintain proper spacing and readability', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-AXIS-002' });
    console.log('🔍 TESTING TIMELINE SCALE SPACING AND READABILITY');
    
    const timelineArea = page.locator('.absolute.inset-0.ml-14');
    const timelineBox = await timelineArea.boundingBox();
    const centerX = timelineBox!.x + timelineBox!.width * 0.5;
    const centerY = timelineBox!.y + timelineBox!.height * 0.5;
    
    // Test at various zoom levels
    for (let zoomSteps = 0; zoomSteps <= 20; zoomSteps += 5) {
      console.log(`\n--- Testing ${zoomSteps} zoom steps ---`);
      
      // Reset and zoom
      await page.reload();
      await page.waitForSelector('[data-testid="timeline-axis"]', { timeout: 5000 });
      
      await page.mouse.move(centerX, centerY);
      for (let i = 0; i < zoomSteps; i++) {
        await page.mouse.wheel(0, -200);
        await page.waitForTimeout(30);
      }
      await page.waitForTimeout(200);
  await page.waitForSelector('[data-testid="axis-label"]', { timeout: 5000 }).catch(() => undefined);
      
      const labels = await page.locator('[data-testid="axis-label"]').all();
      const labelPositions: number[] = [];
      const labelTexts: string[] = [];
      
      for (const label of labels) {
        const box = await label.boundingBox();
        const text = await label.textContent();
        if (box && text) {
          labelPositions.push(box.x + box.width / 2); // Center position
          labelTexts.push(text);
        }
      }
      
      console.log(`📊 Found ${labelPositions.length} labels:`, labelTexts.slice(0, 5));
      
      // Verify labels don't overlap (minimum spacing based on label length)
      for (let i = 1; i < labelPositions.length; i++) {
        const spacing = labelPositions[i] - labelPositions[i-1];
        const avgLabelLength = (labelTexts[i].length + labelTexts[i-1].length) / 2;
        const minSpacing = Math.max(20, avgLabelLength * 6); // 6px per character minimum
        
        if (spacing < minSpacing) {
          console.log(`⚠️  Potential overlap: "${labelTexts[i-1]}" and "${labelTexts[i]}" (${spacing.toFixed(1)}px spacing)`);
        }
        
        expect(spacing).toBeGreaterThan(15); // Absolute minimum spacing
      }
      
      // Verify reasonable label density
      if (labelPositions.length > 1) {
        const totalWidth = labelPositions[labelPositions.length - 1] - labelPositions[0];
        const avgSpacing = totalWidth / (labelPositions.length - 1);
        console.log(`📊 Average spacing: ${avgSpacing.toFixed(1)}px`);
        
        expect(avgSpacing).toBeGreaterThan(20);
        expect(avgSpacing).toBeLessThan(400);
      }
    }
  });

  test('day-level scale shows proper temporal progression', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-AXIS-001' });
    console.log('🔍 TESTING DAY-LEVEL TEMPORAL PROGRESSION');
    
    const timelineArea = page.locator('.absolute.inset-0.ml-14');
    const timelineBox = await timelineArea.boundingBox();
    const centerX = timelineBox!.x + timelineBox!.width * 0.5;
    const centerY = timelineBox!.y + timelineBox!.height * 0.5;
    
    // Zoom to maximum level (day granularity)
    await page.mouse.move(centerX, centerY);
    for (let i = 0; i < 20; i++) {
      await page.mouse.wheel(0, -250);
      await page.waitForTimeout(30);
    }
    await page.waitForTimeout(500);
    await page.waitForSelector('[data-testid="axis-label"]', { timeout: 5000 });
    
    // Get labels and verify they represent a logical temporal progression
    const axisLabels = await page.locator('[data-testid="axis-label"]').allTextContents();
    console.log(`📊 Day-level labels:`, axisLabels);
    
    // Should have labels representing day-level granularity
    expect(axisLabels.length).toBeGreaterThan(2);
    expect(axisLabels.length).toBeLessThan(20); // Prevent overcrowding
    
    // Labels should represent some form of day-level progression
    const hasDayProgression = axisLabels.some(label => {
      return /^\d{1,2}$/.test(label) ||                    // Day numbers
        /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/.test(label) || // Day names
        /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}/.test(label) || // Month-day
        /\d{1,2}:\d{2}/.test(label) ||                // Hour format HH:MM
        /\d{1,2}\s?(AM|PM)/i.test(label);             // Hour format with meridiem
    });
    
    console.log(`Day-level progression detected: ${hasDayProgression}`);
    expect(hasDayProgression).toBe(true);
    
    await page.screenshot({ path: 'test-results/day-level-temporal-progression.png' });
  });

  test('timeline scales handle edge cases gracefully', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-AXIS-003' });
    console.log('🔍 TESTING TIMELINE SCALE EDGE CASES');
    
    const timelineArea = page.locator('.absolute.inset-0.ml-14');
    const timelineBox = await timelineArea.boundingBox();
    const centerX = timelineBox!.x + timelineBox!.width * 0.5;
    const centerY = timelineBox!.y + timelineBox!.height * 0.5;
    
    // Test extreme zoom out (should show decade/year labels)
    await page.mouse.move(centerX, centerY);
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, 300); // Zoom out
      await page.waitForTimeout(50);
    }
    
    await page.waitForSelector('[data-testid="axis-label"]', { timeout: 5000 });
    const zoomOutLabels = await page.locator('[data-testid="axis-label"]').allTextContents();
    console.log(`📊 Extreme zoom out labels:`, zoomOutLabels);
    
    // Should have year/decade labels
    const hasYearDecadeLabels = zoomOutLabels.some(label => 
      /^\d{4}$/.test(label) ||     // Years: "1780"
      /^\d{4}s$/.test(label)       // Decades: "1780s"
    );
    expect(hasYearDecadeLabels).toBe(true);
    expect(zoomOutLabels.length).toBeGreaterThan(1);
    expect(zoomOutLabels.length).toBeLessThan(15);
    
    // Test extreme zoom in (should show day/hour labels with reasonable limits)
    await page.mouse.move(centerX, centerY);
    for (let i = 0; i < 25; i++) {
      await page.mouse.wheel(0, -300); // Zoom in aggressively
      await page.waitForTimeout(30);
    }
    await page.waitForTimeout(300);
    
    await page.waitForSelector('[data-testid="axis-label"]', { timeout: 5000 });
    const zoomInLabels = await page.locator('[data-testid="axis-label"]').allTextContents();
    console.log(`📊 Extreme zoom in labels:`, zoomInLabels);
    
    // Should have day-level labels but not be overcrowded
    expect(zoomInLabels.length).toBeGreaterThan(1);
    expect(zoomInLabels.length).toBeLessThan(25); // Prevent overcrowding
    
    // Labels should be appropriate for deep zoom
    const hasDetailLabels = zoomInLabels.some(label => {
      return /^\d{1,2}$/.test(label) ||              // Day numbers
        /\d{1,2}:\d{2}/.test(label) ||          // Hour format HH:MM
        /\d{1,2}\s?(AM|PM)/i.test(label) ||     // Hour format with meridiem
        /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}/.test(label) || // Month-day
        /(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/.test(label); // Day names
    });
    
    console.log(`Detail labels at extreme zoom: ${hasDetailLabels}`);
    expect(hasDetailLabels).toBe(true);
    
    await page.screenshot({ path: 'test-results/timeline-scale-edge-cases.png' });
  });
});
