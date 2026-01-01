import { test, expect } from '@playwright/test';
import { loadTestTimeline } from '../utils/timelineTestUtils';

test.describe('v5/52 Side panel scroll behavior', () => {
  test.skip('DEPRECATED - Events panel removed', async ({ page }) => {
    // Events panel (OutlinePanel) has been replaced by Stream View
    // Stream View has its own scroll behavior tested in 82-stream-viewer.spec.ts
    console.log('Events panel scroll test skipped - replaced by Stream View');
  });
});
