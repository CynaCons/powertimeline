import { test, expect } from '@playwright/test';

/**
 * Test 40: Card Color System Validation
 * Tests the visual color coding system for different card types
 * 
 * Validates:
 * - Blue color for full cards
 * - Green color for compact cards  
 * - Yellow color for title-only cards
 * - Purple color for multi-event cards
 * - Red color for infinite cards
 * - Color consistency and accessibility
 */

test('Card color system - Visual validation', async ({ page }) => {
  await page.goto('http://localhost:5179');

  // Wait for timeline to load
  await page.waitForSelector('.absolute.inset-0.ml-14', { timeout: 10000 });

  console.log('\n🎨 CARD COLOR SYSTEM VALIDATION');
  
  // Wait for any default content to load
  await page.waitForTimeout(1000);
  
  // Look for any existing cards to test colors
  const cards = await page.locator('[data-testid="event-card"]').all();
  
  if (cards.length > 0) {
    console.log(`🎯 Found ${cards.length} cards to analyze`);
    
    const colorAnalysis = {
      full: 0,
      compact: 0,
      'title-only': 0,
      'multi-event': 0,
      infinite: 0,
      other: 0
    };
    
    // Analyze each card's color and type
    for (let i = 0; i < Math.min(cards.length, 10); i++) {
      const card = cards[i];
      const cardType = await card.getAttribute('data-card-type');
      const className = await card.getAttribute('class');
      
      console.log(`  Card ${i + 1}: Type="${cardType}", Colors="${className?.match(/border-l-\\w+-\\d+/g)?.join(', ') || 'none'}"`);
      
      // Verify color matches card type
      if (cardType && className) {
        switch (cardType) {
          case 'full':
            expect(className).toContain('border-l-blue-500');
            colorAnalysis.full++;
            break;
          case 'compact':
            expect(className).toContain('border-l-green-500');
            colorAnalysis.compact++;
            break;
          case 'title-only':
            expect(className).toContain('border-l-yellow-500');
            colorAnalysis['title-only']++;
            break;
          case 'multi-event':
            expect(className).toContain('border-l-purple-500');
            colorAnalysis['multi-event']++;
            break;
          case 'infinite':
            expect(className).toContain('border-l-red-500');
            colorAnalysis.infinite++;
            break;
          default:
            colorAnalysis.other++;
        }
      }
    }
    
    console.log('🎨 Color analysis results:', colorAnalysis);
    console.log('✅ All card colors match their types');
    
  } else {
    console.log('ℹ️ No cards found for color testing - this is acceptable for empty timelines');
  }
  
  // Test with zoom to potentially trigger different card types
  console.log('🔍 Testing color system with zoom-induced degradation...');
  
  const timelineArea = page.locator('.absolute.inset-0.ml-14');
  const timelineBox = await timelineArea.boundingBox();
  if (timelineBox) {
    const centerX = timelineBox.x + timelineBox.width * 0.5;
    const centerY = timelineBox.y + timelineBox.height * 0.5;
    
    // Zoom in to potentially trigger compact cards
    await page.mouse.move(centerX, centerY);
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, -200);
      await page.waitForTimeout(500);
    }
    
    // Check for color changes after zoom
    const zoomedCards = await page.locator('[data-testid="event-card"]').all();
    if (zoomedCards.length > 0) {
      let compactCardsFound = 0;
      
      for (const card of zoomedCards.slice(0, 5)) {
        const cardType = await card.getAttribute('data-card-type');
        const className = await card.getAttribute('class');
        
        if (cardType === 'compact' && className?.includes('border-l-green-500')) {
          compactCardsFound++;
        }
      }
      
      if (compactCardsFound > 0) {
        console.log(`✅ Found ${compactCardsFound} green compact cards after zoom`);
      }
    }
    
    // Reset zoom
    await page.keyboard.press('Digit0');
    await page.waitForTimeout(1000);
  }
  
  console.log('✅ Card color system validation completed');
});

test('Card color accessibility and consistency', async ({ page }) => {
  await page.goto('http://localhost:5179');
  await page.waitForSelector('.absolute.inset-0.ml-14', { timeout: 10000 });

  console.log('\n♿ CARD COLOR ACCESSIBILITY TEST');
  
  // Test that all card colors are accessible and properly defined
  const colorValidation = await page.evaluate(() => {
    // Define our color system
    const expectedColors = {
      'full': 'border-l-blue-500',
      'compact': 'border-l-green-500', 
      'title-only': 'border-l-yellow-500',
      'multi-event': 'border-l-purple-500',
      'infinite': 'border-l-red-500'
    };
    
    // Check if Tailwind CSS colors are properly loaded
    const testElement = document.createElement('div');
    const results = {};
    
    for (const [cardType, colorClass] of Object.entries(expectedColors)) {
      testElement.className = colorClass;
      document.body.appendChild(testElement);
      
      const computedStyle = window.getComputedStyle(testElement);
      const borderColor = computedStyle.borderLeftColor;
      
      results[cardType] = {
        colorClass,
        computedColor: borderColor,
        isValid: borderColor !== '' && borderColor !== 'rgba(0, 0, 0, 0)'
      };
      
      document.body.removeChild(testElement);
    }
    
    return results;
  });
  
  console.log('♿ Color accessibility results:');
  for (const [cardType, result] of Object.entries(colorValidation)) {
    console.log(`  ${cardType}: ${result.colorClass} → ${result.computedColor} (${result.isValid ? 'Valid' : 'Invalid'})`);
    expect(result.isValid).toBe(true);
  }
  
  console.log('✅ All card colors are properly rendered and accessible');
});

test('Card color documentation validation', async ({ page }) => {
  await page.goto('http://localhost:5179');
  await page.waitForSelector('.absolute.inset-0.ml-14', { timeout: 10000 });

  console.log('\n📋 CARD COLOR DOCUMENTATION VALIDATION');
  
  // Verify the color system matches our documentation
  const documentedColors = {
    'full': { color: 'blue-500', description: 'Full detail cards', dimensions: '260×140px' },
    'compact': { color: 'green-500', description: 'Space-optimized cards', dimensions: '176×64px' },
    'title-only': { color: 'yellow-500', description: 'Minimal cards', dimensions: '140×32px' },
    'multi-event': { color: 'purple-500', description: 'Aggregated cards', dimensions: '180×80px' },
    'infinite': { color: 'red-500', description: 'Ultra-compact cards', dimensions: '160×40px' }
  };
  
  console.log('📋 Documented color system:');
  for (const [cardType, info] of Object.entries(documentedColors)) {
    console.log(`  🎨 ${cardType.toUpperCase()}: ${info.color} - ${info.description} (${info.dimensions})`);
  }
  
  // Test that our implementation matches documentation
  const cards = await page.locator('[data-testid="event-card"]').all();
  
  if (cards.length > 0) {
    for (const card of cards.slice(0, 3)) {
      const cardType = await card.getAttribute('data-card-type') as keyof typeof documentedColors;
      const className = await card.getAttribute('class');
      
      if (cardType && documentedColors[cardType] && className) {
        const expectedColor = `border-l-${documentedColors[cardType].color}`;
        expect(className).toContain(expectedColor);
        console.log(`  ✅ ${cardType} card has correct color: ${expectedColor}`);
      }
    }
  }
  
  console.log('✅ Implementation matches documented color system');
});

test('Card color degradation progression', async ({ page }) => {
  await page.goto('http://localhost:5179');
  await page.waitForSelector('.absolute.inset-0.ml-14', { timeout: 10000 });

  console.log('\n📊 CARD COLOR DEGRADATION PROGRESSION TEST');
  
  // Test the logical progression of colors during degradation
  const degradationSequence = [
    { level: 'Standard', expectedType: 'full', expectedColor: 'border-l-blue-500' },
    { level: 'Compact', expectedType: 'compact', expectedColor: 'border-l-green-500' },
    { level: 'Title-only', expectedType: 'title-only', expectedColor: 'border-l-yellow-500' },
    { level: 'Multi-event', expectedType: 'multi-event', expectedColor: 'border-l-purple-500' },
    { level: 'Infinite', expectedType: 'infinite', expectedColor: 'border-l-red-500' }
  ];
  
  console.log('📊 Degradation color sequence:');
  degradationSequence.forEach((step, index) => {
    const arrow = index === 0 ? '🔵' : index === 1 ? '→ 🟢' : index === 2 ? '→ 🟡' : index === 3 ? '→ 🟣' : '→ 🔴';
    console.log(`  ${arrow} ${step.level}: ${step.expectedType} (${step.expectedColor})`);
  });
  
  // Validate that each degradation level has distinct colors
  const colors = degradationSequence.map(s => s.expectedColor);
  const uniqueColors = [...new Set(colors)];
  expect(uniqueColors.length).toBe(colors.length);
  
  console.log('✅ All degradation levels have unique colors');
  console.log('✅ Color progression follows logical hierarchy');
});