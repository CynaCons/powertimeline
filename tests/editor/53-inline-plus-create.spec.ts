import { test, expect } from '@playwright/test';
import { loadTestTimeline } from '../utils/timelineTestUtils';

test.describe('v5/53 Inline "+" affordances open Create overlay', () => {
  test.skip('DEPRECATED - Events panel removed', async ({ page }) => {
    // Events panel (OutlinePanel) has been replaced by Stream View
    // Stream View has its own "Add Event" button tested in 82-stream-viewer.spec.ts
    console.log('Events panel add buttons test skipped - replaced by Stream View');
  });
});
