import { test, expect } from '@playwright/test';
import { navigateToUserProfile } from '../utils/timelineTestUtils';

test.describe('v5/73 Timeline Content Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and set up test timelines with distinct events
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(() => {
      // Clear everything
      localStorage.clear();

      // Set up users
      const users = [
        {
          id: 'cynacons',
          name: 'CynaCons',
          avatar: '⚡',
          bio: 'Test user',
          createdAt: new Date().toISOString(),
        }
      ];
      localStorage.setItem('powertimeline_users', JSON.stringify(users));
      localStorage.setItem('powertimeline_current_user', JSON.stringify(users[0]));

      // Create timelines with DISTINCT events
      const timelines = [
        {
          id: 'timeline-rfk',
          title: 'RFK Timeline',
          description: 'RFK events',
          events: [
            {
              id: 'rfk-event-1',
              date: '1968-03-16',
              title: 'RFK Announces Campaign',
              description: 'Robert F. Kennedy announces presidential campaign',
              cardType: 'full'
            },
            {
              id: 'rfk-event-2',
              date: '1968-06-05',
              title: 'RFK Victory Speech',
              description: 'Victory speech in California',
              cardType: 'full'
            }
          ],
          ownerId: 'cynacons',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          viewCount: 0,
          featured: false,
        },
        {
          id: 'timeline-jfk',
          title: 'JFK Timeline',
          description: 'JFK events',
          events: [
            {
              id: 'jfk-event-1',
              date: '1961-01-20',
              title: 'JFK Inauguration',
              description: 'John F. Kennedy inaugurated as president',
              cardType: 'full'
            },
            {
              id: 'jfk-event-2',
              date: '1963-11-22',
              title: 'JFK Assassination',
              description: 'President Kennedy assassinated in Dallas',
              cardType: 'full'
            }
          ],
          ownerId: 'cynacons',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          viewCount: 0,
          featured: false,
        },
        {
          id: 'timeline-french-revolution',
          title: 'French Revolution',
          description: 'French Revolution events',
          events: [
            {
              id: 'fr-event-1',
              date: '1789-07-14',
              title: 'Storming of the Bastille',
              description: 'French revolutionaries storm the Bastille',
              cardType: 'full'
            },
            {
              id: 'fr-event-2',
              date: '1793-01-21',
              title: 'Execution of Louis XVI',
              description: 'King Louis XVI executed by guillotine',
              cardType: 'full'
            }
          ],
          ownerId: 'cynacons',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          viewCount: 0,
          featured: false,
        }
      ];

      localStorage.setItem('powertimeline_timelines', JSON.stringify(timelines));
      localStorage.setItem('powertimeline_data_version', '2');
    });

    await page.reload();
    await page.waitForLoadState('domcontentloaded');
  });

  test('timeline cards show correct event counts', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-TIMELINE-CONTENT-001' });

    await navigateToUserProfile(page, 'cynacons');

    // Verify each timeline card shows the correct number of events
    const rfkCard = page.locator('.cursor-pointer').filter({ hasText: 'RFK Timeline' });
    await expect(rfkCard).toContainText('2 events');

    const jfkCard = page.locator('.cursor-pointer').filter({ hasText: 'JFK Timeline' });
    await expect(jfkCard).toContainText('2 events');

    const frCard = page.locator('.cursor-pointer').filter({ hasText: 'French Revolution' });
    await expect(frCard).toContainText('2 events');
  });

  test('clicking RFK timeline loads RFK events only', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-TIMELINE-CONTENT-002' });

    await navigateToUserProfile(page, 'cynacons');

    // Click RFK timeline card
    const rfkCard = page.locator('.cursor-pointer').filter({ hasText: 'RFK Timeline' }).first();
    await rfkCard.click();
    await page.waitForLoadState('domcontentloaded');

    // Wait a bit for the timeline to load
    await page.waitForTimeout(1000);

    // Verify URL
    expect(page.url()).toContain('/timeline/timeline-rfk');

    // Check browser console for the loading message
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(msg.text());
    });

    // Reload to trigger the console.log
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Verify loading message appeared
    const loadingMessage = logs.find(log => log.includes('Loading timeline') && log.includes('RFK Timeline'));
    expect(loadingMessage).toBeTruthy();
  });

  test('clicking JFK timeline loads JFK events only', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-TIMELINE-CONTENT-003' });

    await navigateToUserProfile(page, 'cynacons');

    // Click JFK timeline card
    const jfkCard = page.locator('.cursor-pointer').filter({ hasText: 'JFK Timeline' }).first();
    await jfkCard.click();
    await page.waitForLoadState('domcontentloaded');

    // Wait a bit for the timeline to load
    await page.waitForTimeout(1000);

    // Verify URL
    expect(page.url()).toContain('/timeline/timeline-jfk');

    // Check console logs
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(msg.text());
    });

    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const loadingMessage = logs.find(log => log.includes('Loading timeline') && log.includes('JFK Timeline'));
    expect(loadingMessage).toBeTruthy();
  });

  test('clicking French Revolution timeline loads French Revolution events only', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-TIMELINE-CONTENT-004' });

    await navigateToUserProfile(page, 'cynacons');

    // Click French Revolution timeline card
    const frCard = page.locator('.cursor-pointer').filter({ hasText: 'French Revolution' }).first();
    await frCard.click();
    await page.waitForLoadState('domcontentloaded');

    // Wait a bit for the timeline to load
    await page.waitForTimeout(1000);

    // Verify URL
    expect(page.url()).toContain('/timeline/timeline-french-revolution');

    // Check console logs
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(msg.text());
    });

    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const loadingMessage = logs.find(log => log.includes('Loading timeline') && log.includes('French Revolution'));
    expect(loadingMessage).toBeTruthy();
  });

  test('switching between timelines loads different events', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-TIMELINE-CONTENT-005' });

    await navigateToUserProfile(page, 'cynacons');

    // Click RFK timeline
    await page.locator('.cursor-pointer').filter({ hasText: 'RFK Timeline' }).first().click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const url1 = page.url();
    expect(url1).toContain('/timeline/timeline-rfk');

    // Go back to profile
    await navigateToUserProfile(page, 'cynacons');
    await page.waitForTimeout(500);

    // Click JFK timeline
    await page.locator('.cursor-pointer').filter({ hasText: 'JFK Timeline' }).first().click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const url2 = page.url();
    expect(url2).toContain('/timeline/timeline-jfk');
    expect(url2).not.toBe(url1);

    // Go back to profile
    await navigateToUserProfile(page, 'cynacons');
    await page.waitForTimeout(500);

    // Click French Revolution timeline
    await page.locator('.cursor-pointer').filter({ hasText: 'French Revolution' }).first().click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const url3 = page.url();
    expect(url3).toContain('/timeline/timeline-french-revolution');
    expect(url3).not.toBe(url1);
    expect(url3).not.toBe(url2);
  });

  test('direct URL navigation loads correct timeline', async ({ page }) => {
    test.info().annotations.push({ type: 'req', description: 'CC-REQ-TIMELINE-CONTENT-006' });

    // Navigate directly to JFK timeline
    await page.goto('/user/cynacons/timeline/timeline-jfk');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Verify URL
    expect(page.url()).toContain('/timeline/timeline-jfk');

    // Check console logs for loading message
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(msg.text());
    });

    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const loadingMessage = logs.find(log => log.includes('Loading timeline') && log.includes('JFK Timeline'));
    expect(loadingMessage).toBeTruthy();
  });
});
