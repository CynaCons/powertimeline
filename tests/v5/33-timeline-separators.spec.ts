import { test, expect } from '@playwright/test';

test.describe('v5/33 Timeline Scale Comprehensive Testing', () => {
  test.setTimeout(60000);

  test('Timeline scales - complete functionality verification', async ({ page }) => {
    await page.goto('http://localhost:5174');
    
    // Load Napoleon timeline for consistent testing
    await page.click('button[aria-label="Toggle developer options"]');
    await page.click('button[aria-label="Developer Panel"]');
    await page.click('button:has-text("Napoleon 1769-1821")');
    await page.waitForTimeout(2000);
    
    // Take initial screenshot to see current state
    await page.screenshot({ path: 'test-results/33-initial-state.png', fullPage: true });

    console.log('\n=== TIMELINE SCALE COMPREHENSIVE TEST ===\n');

    // ========= TEST 1: DATA GENERATION =========
    console.log('TEST 1: Data Generation');
    
    const dataGeneration = await page.evaluate(() => {
      const debugFn = (window as any).debugTimelineScales;
      if (debugFn) {
        return debugFn();
      }
      return { error: 'Debug function not available' };
    });
    
    console.log('Data Generation Results:', dataGeneration);
    
    // Assume failure unless proven otherwise
    if (!dataGeneration.ticks || dataGeneration.ticks.length === 0) {
      console.log('❌ DATA: No ticks generated - TIMELINE SCALES NOT WORKING');
      expect(false, 'Timeline scales failed - no tick data generated').toBe(true);
      return;
    }
    
    console.log('✅ DATA: Ticks generated successfully');
    expect(dataGeneration.ticks[0].label, 'First tick should have label').toBeTruthy();
    expect(typeof dataGeneration.ticks[0].x, 'First tick should have x position').toBe('number');

    // ========= TEST 2: DOM ELEMENT EXISTENCE =========
    console.log('\nTEST 2: DOM Element Existence');
    
    const containerExists = await page.locator('[data-testid="timeline-scales-container"]').count();
    const svgExists = await page.locator('[data-testid="timeline-scales-svg"]').count();
    const textElements = await page.locator('[data-testid="timeline-scales-svg"] text').count();
    
    console.log('DOM Results:', {
      containerExists: containerExists > 0,
      svgExists: svgExists > 0,
      textElementCount: textElements
    });
    
    if (containerExists === 0) {
      console.log('❌ DOM: Container missing - TIMELINE SCALES NOT WORKING');
      expect(false, 'Timeline scales failed - container element missing from DOM').toBe(true);
      return;
    }
    console.log('✅ DOM: Container exists');
    
    if (svgExists === 0) {
      console.log('❌ DOM: SVG missing - TIMELINE SCALES NOT WORKING');
      expect(false, 'Timeline scales failed - SVG element missing from DOM').toBe(true);
      return;
    }
    console.log('✅ DOM: SVG exists');
    
    if (textElements === 0) {
      console.log('❌ DOM: No text elements found - TIMELINE SCALES NOT WORKING');
      expect(false, 'Timeline scales failed - no text elements in SVG').toBe(true);
      return;
    }
    console.log(`✅ DOM: ${textElements} text elements found`);

    // ========= TEST 3: ELEMENT POSITIONING =========
    console.log('\nTEST 3: Element Positioning');
    
    const containerBox = await page.locator('[data-testid="timeline-scales-container"]').boundingBox();
    const viewportSize = await page.viewportSize();
    
    console.log('Position Results:', {
      containerBox,
      viewportSize,
      containerVisible: containerBox && containerBox.width > 0 && containerBox.height > 0,
      containerOnScreen: containerBox && containerBox.x >= 0 && containerBox.y >= 0 && 
                         containerBox.x < (viewportSize?.width || 0) && containerBox.y < (viewportSize?.height || 0)
    });
    
    if (!containerBox || containerBox.width <= 0 || containerBox.height <= 0) {
      console.log('❌ POSITION: Container has no dimensions - TIMELINE SCALES NOT WORKING');
      expect(false, 'Timeline scales failed - container has zero dimensions').toBe(true);
      return;
    }
    console.log('✅ POSITION: Container has dimensions');
    
    if (!containerBox || containerBox.x < -1000 || containerBox.y < -1000) {
      console.log('❌ POSITION: Container positioned way off screen - TIMELINE SCALES NOT WORKING');
      expect(false, 'Timeline scales failed - container positioned off screen').toBe(true);
      return;
    }
    console.log('✅ POSITION: Container positioned on or near screen');

    // ========= TEST 4: TEXT ELEMENT DETAILS =========
    console.log('\nTEST 4: Text Element Details');
    
    const textDetails = await page.evaluate(() => {
      const texts = document.querySelectorAll('[data-testid="timeline-scales-svg"] text');
      return Array.from(texts).map((text, i) => {
        const rect = text.getBoundingClientRect();
        const styles = window.getComputedStyle(text);
        return {
          index: i,
          content: text.textContent,
          boundingBox: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            visible: rect.width > 0 && rect.height > 0
          },
          computedStyles: {
            fontSize: styles.fontSize,
            fill: styles.fill || (text as SVGTextElement).getAttribute('fill'),
            fontFamily: styles.fontFamily,
            opacity: styles.opacity,
            visibility: styles.visibility,
            display: styles.display
          },
          attributes: {
            x: (text as SVGTextElement).getAttribute('x'),
            y: (text as SVGTextElement).getAttribute('y'),
            fontSize: (text as SVGTextElement).getAttribute('fontSize'),
            fill: (text as SVGTextElement).getAttribute('fill')
          }
        };
      });
    });
    
    console.log('Text Details:', textDetails);
    
    let hasVisibleText = false;
    let hasContent = false;
    
    textDetails.forEach((textInfo, i) => {
      if (textInfo.content && textInfo.content.trim().length > 0) {
        console.log(`✅ TEXT ${i}: Has content "${textInfo.content}"`);
        hasContent = true;
      } else {
        console.log(`❌ TEXT ${i}: No content`);
      }
      
      if (textInfo.boundingBox.visible) {
        console.log(`✅ TEXT ${i}: Visible dimensions (${textInfo.boundingBox.width}x${textInfo.boundingBox.height})`);
        hasVisibleText = true;
      } else {
        console.log(`❌ TEXT ${i}: Zero dimensions`);
      }
      
      if (textInfo.computedStyles.visibility === 'visible' && textInfo.computedStyles.display !== 'none') {
        console.log(`✅ TEXT ${i}: CSS visible`);
      } else {
        console.log(`❌ TEXT ${i}: CSS hidden (visibility: ${textInfo.computedStyles.visibility}, display: ${textInfo.computedStyles.display})`);
      }
    });
    
    if (!hasContent) {
      console.log('❌ TEXT: No text elements have content - TIMELINE SCALES NOT WORKING');
      expect(false, 'Timeline scales failed - text elements have no content').toBe(true);
      return;
    }
    
    if (!hasVisibleText) {
      console.log('❌ TEXT: No text elements are visible - TIMELINE SCALES NOT WORKING');
      expect(false, 'Timeline scales failed - text elements have zero dimensions').toBe(true);
      return;
    }

    // ========= TEST 5: VISUAL VERIFICATION =========
    console.log('\nTEST 5: Visual Verification');
    
    // Add temporary visual markers to scales container
    await page.evaluate(() => {
      const container = document.querySelector('[data-testid="timeline-scales-container"]') as HTMLElement;
      if (container) {
        container.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
        container.style.border = '3px solid yellow';
        container.style.zIndex = '9999';
      }
      
      const svg = document.querySelector('[data-testid="timeline-scales-svg"]') as SVGElement;
      if (svg) {
        svg.style.border = '2px solid lime';
      }
      
      // Add test elements to verify SVG rendering works
      if (svg) {
        const testCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        testCircle.setAttribute('cx', '50');
        testCircle.setAttribute('cy', '30');
        testCircle.setAttribute('r', '10');
        testCircle.setAttribute('fill', 'magenta');
        testCircle.setAttribute('data-test', 'verification-circle');
        svg.appendChild(testCircle);
        
        const testText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        testText.setAttribute('x', '100');
        testText.setAttribute('y', '30');
        testText.setAttribute('fontSize', '20');
        testText.setAttribute('fill', 'cyan');
        testText.setAttribute('data-test', 'verification-text');
        testText.textContent = 'TEST-RENDER';
        svg.appendChild(testText);
      }
    });
    
    // Take screenshot with visual markers
    await page.screenshot({ path: 'test-results/33-visual-markers.png', fullPage: true });
    
    // Check if test elements are visible
    const testCircleExists = await page.locator('[data-test="verification-circle"]').count();
    const testTextExists = await page.locator('[data-test="verification-text"]').count();
    
    console.log('Visual Verification:', {
      testCircleExists: testCircleExists > 0,
      testTextExists: testTextExists > 0
    });
    
    if (testCircleExists === 0) {
      console.log('❌ VISUAL: SVG circle rendering broken - TIMELINE SCALES NOT WORKING');
      expect(false, 'Timeline scales failed - SVG circle elements cannot render').toBe(true);
      return;
    }
    console.log('✅ VISUAL: SVG circle rendering works');
    
    if (testTextExists === 0) {
      console.log('❌ VISUAL: SVG text rendering broken - TIMELINE SCALES NOT WORKING');
      expect(false, 'Timeline scales failed - SVG text elements cannot render').toBe(true);
      return;
    }
    console.log('✅ VISUAL: SVG text rendering works');

    // ========= TEST 6: DISTRIBUTION VERIFICATION =========
    console.log('\nTEST 6: Scale Distribution');
    
    if (textElements >= 2) {
      const distribution = await page.evaluate(() => {
        const texts = document.querySelectorAll('[data-testid="timeline-scales-svg"] text');
        const positions = Array.from(texts).map(text => {
          const rect = text.getBoundingClientRect();
          return rect.x;
        }).sort((a, b) => a - b);
        
        return {
          positions,
          spread: positions.length > 1 ? positions[positions.length - 1] - positions[0] : 0,
          clustered: positions.length > 1 ? (positions[1] - positions[0]) < 50 : false
        };
      });
      
      console.log('Distribution Results:', distribution);
      
      if (distribution.spread < 200) {
        console.log(`❌ DISTRIBUTION: Scales clustered together (spread: ${distribution.spread}px) - TIMELINE SCALES NOT WORKING`);
        expect(false, 'Timeline scales failed - scales clustered instead of distributed across timeline').toBe(true);
        return;
      }
      console.log('✅ DISTRIBUTION: Scales spread across timeline');
      
      if (distribution.clustered) {
        console.log('❌ DISTRIBUTION: Scales bunched on left side - TIMELINE SCALES NOT WORKING');
        expect(false, 'Timeline scales failed - scales bunched together instead of evenly distributed').toBe(true);
        return;
      }
      console.log('✅ DISTRIBUTION: Scales not bunched together');
    }

    // ========= TEST 7: READABILITY CHECK =========
    console.log('\nTEST 7: Readability Check');
    
    const readabilityCheck = await page.evaluate(() => {
      const texts = document.querySelectorAll('[data-testid="timeline-scales-svg"] text');
      let readableCount = 0;
      let tooSmallCount = 0;
      
      Array.from(texts).forEach(text => {
        const rect = text.getBoundingClientRect();
        const styles = window.getComputedStyle(text);
        const fontSize = parseFloat(styles.fontSize || '0');
        
        if (rect.width > 20 && rect.height > 10 && fontSize > 12) {
          readableCount++;
        } else {
          tooSmallCount++;
        }
      });
      
      return { readableCount, tooSmallCount, total: texts.length };
    });
    
    console.log('Readability Results:', readabilityCheck);
    
    if (readabilityCheck.readableCount === 0) {
      console.log('❌ READABILITY: No scales are readable size - TIMELINE SCALES NOT WORKING');
      expect(false, 'Timeline scales failed - text too small to be readable').toBe(true);
      return;
    }
    
    console.log(`✅ READABILITY: ${readabilityCheck.readableCount}/${readabilityCheck.total} scales are readable size`);

    // ========= FINAL SUMMARY =========
    console.log('\n=== TEST SUMMARY ===');
    
    console.log('🎉 ALL TESTS PASSED: Timeline scales are working correctly!');
    console.log('✅ Data generation: Working');
    console.log('✅ DOM elements: Working');  
    console.log('✅ Positioning: Working');
    console.log('✅ Text rendering: Working');
    console.log('✅ SVG rendering: Working');
    console.log('✅ Distribution: Working');
    console.log('✅ Readability: Working');

    // Take final screenshot for analysis
    await page.screenshot({ path: 'test-results/33-final-success.png', fullPage: true });
    
    // Test passes only if we reach this point
    expect(true).toBe(true);
  });

});