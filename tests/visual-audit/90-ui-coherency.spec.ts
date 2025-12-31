import { test, expect } from '@playwright/test';
import { loadTimeline, waitForEditorLoaded, skipIfNoCredentials } from '../utils/timelineTestUtils';

const TEST_OWNER_USERNAME = 'cynacons';
const TEST_TIMELINE_ID = 'french-revolution';

test.describe('UI Coherency Audit', () => {
  test.beforeEach(async ({ page }) => {
    skipIfNoCredentials(test);
    await loadTimeline(page, TEST_OWNER_USERNAME, TEST_TIMELINE_ID);
    await waitForEditorLoaded(page);
    await page.waitForTimeout(1500); // Wait for UI to stabilize

    // Verify we're on the correct timeline
    const timelineInfo = await page.evaluate(() => {
      const titleEl = document.querySelector('h1, [data-testid*="title"]');
      return {
        title: titleEl?.textContent || 'unknown',
        cardCount: document.querySelectorAll('[data-testid*="event-card"]').length
      };
    });
    console.log(`Timeline loaded: "${timelineInfo.title}" with ${timelineInfo.cardCount} cards`);
    expect(timelineInfo.cardCount, 'Timeline should have event cards').toBeGreaterThan(0);
  });

  test('T90.1: button size consistency in canvas area', async ({ page }) => {
    // Find buttons using actual DOM structure
    // - Zoom controls: [data-tour="zoom-controls"]
    // - Share/profile buttons: fixed top-right area
    // - FAB: AI chat button

    const buttonData = await page.evaluate(() => {
      const buttons: { name: string; width: number; height: number; location: string }[] = [];

      // Zoom control buttons
      const zoomControls = document.querySelector('[data-tour="zoom-controls"]');
      if (zoomControls) {
        const zoomButtons = zoomControls.querySelectorAll('button');
        zoomButtons.forEach((btn, i) => {
          const rect = btn.getBoundingClientRect();
          const label = btn.getAttribute('aria-label') || `zoom-btn-${i}`;
          buttons.push({
            name: label,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            location: 'zoom-controls'
          });
        });
      }

      // Top-right buttons (share, profile)
      const topRightButtons = document.querySelectorAll('.fixed.top-4.right-4 button, .fixed.top-1.right-4 button');
      topRightButtons.forEach((btn, i) => {
        const rect = btn.getBoundingClientRect();
        const label = btn.getAttribute('aria-label') || `top-right-btn-${i}`;
        if (rect.width > 0) {
          buttons.push({
            name: label,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            location: 'top-right'
          });
        }
      });

      // Look for MUI IconButtons with specific aria-labels
      const shareBtn = document.querySelector('[aria-label="Share timeline"]');
      if (shareBtn) {
        const rect = shareBtn.getBoundingClientRect();
        buttons.push({
          name: 'Share timeline',
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          location: 'top-right-share'
        });
      }

      // FAB button (AI chat)
      const fabButton = document.querySelector('.fixed.bottom-6.right-6 button, [class*="fab"]');
      if (fabButton) {
        const rect = fabButton.getBoundingClientRect();
        buttons.push({
          name: 'AI Chat FAB',
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          location: 'bottom-right-fab'
        });
      }

      return buttons;
    });

    console.log('\n=== Button Size Audit ===');
    console.log(`Total buttons found: ${buttonData.length}`);

    // Expected sizes
    const standardSize = 44;
    const fabSize = 56;
    const tolerance = 2; // Allow 2px tolerance

    const mismatches: typeof buttonData = [];

    console.log('\nButton sizes:');
    for (const btn of buttonData) {
      const isStandard = Math.abs(btn.width - standardSize) <= tolerance && Math.abs(btn.height - standardSize) <= tolerance;
      const isFab = Math.abs(btn.width - fabSize) <= tolerance && Math.abs(btn.height - fabSize) <= tolerance;
      const isValid = isStandard || isFab;

      const status = isValid ? '✓' : '❌';
      console.log(`  ${status} ${btn.name} (${btn.location}): ${btn.width}x${btn.height}px`);

      if (!isValid) {
        mismatches.push(btn);
      }
    }

    if (mismatches.length > 0) {
      console.log(`\n⚠️  ${mismatches.length} button(s) with non-standard sizes:`);
      console.log(`Expected: ${standardSize}x${standardSize}px (standard) or ${fabSize}x${fabSize}px (FAB)`);
      mismatches.forEach(m => console.log(`  - ${m.name}: ${m.width}x${m.height}px`));
    } else {
      console.log('\n✓ All buttons have consistent sizes');
    }

    // Real assertion: buttons must be standard size (44px) or FAB size (56px)
    const nonStandardButtons = buttonData.filter(b => {
      const isStandard = Math.abs(b.width - standardSize) <= tolerance && Math.abs(b.height - standardSize) <= tolerance;
      const isFab = Math.abs(b.width - fabSize) <= tolerance && Math.abs(b.height - fabSize) <= tolerance;
      return !isStandard && !isFab;
    });
    expect(nonStandardButtons, 'All buttons should be 44px or 56px').toHaveLength(0);
  });

  test('T90.2: icon size consistency', async ({ page }) => {
    const iconData = await page.evaluate(() => {
      const icons: { text: string; fontSize: string; location: string }[] = [];

      // Find all material icons
      const allIcons = document.querySelectorAll('.material-symbols-rounded');
      allIcons.forEach((icon, i) => {
        const rect = icon.getBoundingClientRect();
        // Only check visible icons in the canvas/control area
        if (rect.width > 0 && rect.y < window.innerHeight) {
          const style = window.getComputedStyle(icon);
          const parent = icon.closest('[data-tour], .fixed, button');
          const location = parent?.getAttribute('data-tour') ||
                          (parent?.classList.contains('fixed') ? 'fixed-control' : 'other');

          icons.push({
            text: icon.textContent?.trim() || `icon-${i}`,
            fontSize: style.fontSize,
            location
          });
        }
      });

      return icons;
    });

    console.log('\n=== Icon Size Audit ===');
    console.log(`Total icons found: ${iconData.length}`);

    // Group by font size
    const sizeGroups: Record<string, string[]> = {};
    for (const icon of iconData) {
      if (!sizeGroups[icon.fontSize]) {
        sizeGroups[icon.fontSize] = [];
      }
      sizeGroups[icon.fontSize].push(`${icon.text} (${icon.location})`);
    }

    const uniqueSizes = Object.keys(sizeGroups);
    console.log(`\nUnique font sizes: ${uniqueSizes.length}`);

    for (const size of uniqueSizes) {
      const icons = sizeGroups[size];
      console.log(`  ${size}: ${icons.length} icon(s)`);
      if (icons.length <= 5) {
        console.log(`    ${icons.join(', ')}`);
      } else {
        console.log(`    ${icons.slice(0, 5).join(', ')}... and ${icons.length - 5} more`);
      }
    }

    if (uniqueSizes.length > 2) {
      console.log(`\n⚠️  Found ${uniqueSizes.length} different icon sizes`);
    } else {
      console.log('\n✓ Icon sizes are reasonably consistent');
    }

    // Real assertion: icons should use max 2 standard sizes
    const uniqueSizeCount = uniqueSizes.length;
    expect(uniqueSizeCount, 'Icons should use max 2 standard sizes').toBeLessThanOrEqual(2);
  });

  test('T90.3: spacing consistency between zoom controls', async ({ page }) => {
    const spacingData = await page.evaluate(() => {
      const gaps: { between: string; gap: number }[] = [];

      // Measure gaps between zoom control buttons
      const zoomControls = document.querySelector('[data-tour="zoom-controls"]');
      if (zoomControls) {
        const buttons = Array.from(zoomControls.querySelectorAll('button'));
        for (let i = 0; i < buttons.length - 1; i++) {
          const current = buttons[i].getBoundingClientRect();
          const next = buttons[i + 1].getBoundingClientRect();

          // Horizontal gap (buttons are in a row)
          const gap = Math.round(next.x - (current.x + current.width));
          const label1 = buttons[i].getAttribute('aria-label') || `btn-${i}`;
          const label2 = buttons[i + 1].getAttribute('aria-label') || `btn-${i + 1}`;

          gaps.push({
            between: `${label1} ↔ ${label2}`,
            gap: Math.max(0, gap) // Ignore negative (overlapping)
          });
        }
      }

      return gaps;
    });

    console.log('\n=== Spacing Consistency Audit ===');
    console.log(`Total gaps measured: ${spacingData.length}`);

    if (spacingData.length > 0) {
      console.log('\nGap measurements:');
      for (const item of spacingData) {
        console.log(`  ${item.between}: ${item.gap}px`);
      }

      const gapValues = spacingData.map(g => g.gap).filter(g => g > 0);
      const uniqueGaps = [...new Set(gapValues)];

      console.log(`\nUnique gap values: ${uniqueGaps.join(', ')}px`);

      if (uniqueGaps.length > 1) {
        console.log(`⚠️  Found ${uniqueGaps.length} different gap sizes`);
      } else if (uniqueGaps.length === 1) {
        console.log(`✓ All gaps consistent at ${uniqueGaps[0]}px`);
      }
    } else {
      console.log('No gaps to measure (controls may be stacked or single)');
    }

    // Real assertion: button gaps should be consistent (~8px, with tolerance for flexbox spacing)
    const inconsistentGaps = spacingData.filter(s => Math.abs(s.gap - 8) > 4);
    expect(inconsistentGaps, 'Button gaps should be ~8px (±4px tolerance)').toHaveLength(0);
  });

  test('T90.4: border radius consistency in controls', async ({ page }) => {
    const radiusData = await page.evaluate(() => {
      const items: { element: string; borderRadius: string }[] = [];

      // Check zoom controls container
      const zoomContainer = document.querySelector('[data-tour="zoom-controls"] > div');
      if (zoomContainer) {
        const style = window.getComputedStyle(zoomContainer);
        items.push({ element: 'zoom-controls-container', borderRadius: style.borderRadius });
      }

      // Check zoom buttons
      const zoomButtons = document.querySelectorAll('[data-tour="zoom-controls"] button');
      zoomButtons.forEach((btn, i) => {
        const style = window.getComputedStyle(btn);
        const label = btn.getAttribute('aria-label') || `zoom-btn-${i}`;
        items.push({ element: label, borderRadius: style.borderRadius });
      });

      // Check share button
      const shareBtn = document.querySelector('[aria-label="Share timeline"]');
      if (shareBtn) {
        const style = window.getComputedStyle(shareBtn);
        items.push({ element: 'Share button', borderRadius: style.borderRadius });
      }

      // Check minimap container
      const minimap = document.querySelector('[data-testid="minimap-container"]');
      if (minimap) {
        const style = window.getComputedStyle(minimap);
        items.push({ element: 'minimap-container', borderRadius: style.borderRadius });
      }

      return items;
    });

    console.log('\n=== Border Radius Audit ===');
    console.log(`Total elements checked: ${radiusData.length}`);

    // Group by radius value
    const radiusGroups: Record<string, string[]> = {};
    for (const item of radiusData) {
      if (!radiusGroups[item.borderRadius]) {
        radiusGroups[item.borderRadius] = [];
      }
      radiusGroups[item.borderRadius].push(item.element);
    }

    const uniqueRadii = Object.keys(radiusGroups);
    console.log(`\nBorder radius values found: ${uniqueRadii.length}`);

    for (const radius of uniqueRadii) {
      const elements = radiusGroups[radius];
      const type = radius.includes('%') ? '(circular)' : '(rounded)';
      console.log(`  ${radius} ${type}:`);
      elements.forEach(el => console.log(`    - ${el}`));
    }

    if (uniqueRadii.length > 3) {
      console.log('\n⚠️  Many different border-radius values - consider consolidating');
    } else {
      console.log('\n✓ Border radius values are reasonably consistent');
    }

    // Real assertion: should use max 3 standard radii
    const uniqueRadiiCount = uniqueRadii.length;
    expect(uniqueRadiiCount, 'Should use max 3 standard radii').toBeLessThanOrEqual(3);
  });
});
