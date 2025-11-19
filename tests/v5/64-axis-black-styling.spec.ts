import { test, expect } from '@playwright/test';
import { loginAsTestUser, loadTestTimeline } from '../utils/timelineTestUtils';

const RGB_BLACK_MATCHER = /rgba?\(0, 0, 0(?:, 1)?\)/;

test.describe('v5/64 Axis black styling', () => {
  test('axis bar, ticks, and labels render solid black', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-AXIS-003' });
    await page.goto('/');

    const axis = page.locator('[data-testid="timeline-axis"]');
    await expect(axis).toBeVisible();

    const axisFill = await axis.evaluate((node) => {
      const element = node as SVGRectElement;
      const computed = window.getComputedStyle(element);
      return {
        fillAttr: element.getAttribute('fill'),
        computedFill: computed.fill
      };
    });

    expect(axisFill.fillAttr).toBe('#000000');
    expect(axisFill.computedFill).toMatch(RGB_BLACK_MATCHER);

    const tickResults = await page
      .locator('[data-testid="timeline-axis-tick"] line')
      .evaluateAll(elements =>
        elements.map(node => {
          const element = node as SVGLineElement;
          const computed = window.getComputedStyle(element);
          return {
            strokeAttr: element.getAttribute('stroke'),
            opacityAttr: element.getAttribute('opacity'),
            computedStroke: computed.stroke,
            computedOpacity: computed.opacity
          };
        })
      );

    expect(tickResults.length).toBeGreaterThan(0);
    for (const tick of tickResults) {
      expect(tick.strokeAttr).toBe('#000000');
      expect(tick.computedStroke).toMatch(RGB_BLACK_MATCHER);
      expect(tick.opacityAttr ?? '1').toBe('1');
      expect(tick.computedOpacity).toBe('1');
    }

    const labelResults = await page
      .locator('[data-testid="axis-label"]')
      .evaluateAll(elements =>
        elements.map(node => {
          const element = node as SVGTextElement;
          const computed = window.getComputedStyle(element);
          return {
            fillAttr: element.getAttribute('fill'),
            computedFill: computed.fill,
            opacityAttr: element.getAttribute('opacity'),
            computedOpacity: computed.opacity
          };
        })
      );

    expect(labelResults.length).toBeGreaterThan(0);
    for (const label of labelResults) {
      expect(label.fillAttr).toBe('#000000');
      expect(label.computedFill).toMatch(RGB_BLACK_MATCHER);
      expect(label.opacityAttr ?? '1').toBe('1');
      expect(label.computedOpacity).toBe('1');
    }
  });
});
