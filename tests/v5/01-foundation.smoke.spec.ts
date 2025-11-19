import { test, expect } from '@playwright/test';
import { loginAsTestUser, loadTestTimeline } from '../utils/timelineTestUtils';

test.describe('v5/01 Foundation', () => {
  test('app loads and shows timeline axis', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-FOUND-001' });

    // Login as test user and load timeline
    await loginAsTestUser(page);
    await loadTestTimeline(page, 'timeline-napoleon');

    // Axis should render from the Firestore dataset
    const axis = page.locator('[data-testid="timeline-axis"]');
    await expect(axis).toBeVisible();

    const firstTick = page.locator('[data-testid="timeline-axis-tick"]').first();
    await expect(firstTick).toBeVisible();
  });
});
