// Simple debug script to test telemetry locally
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5177');
  
  // Wait for app to load
  await page.waitForTimeout(2000);
  
  // Click dev panel
  await page.getByRole('button', { name: 'Toggle developer options' }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Developer Panel' }).click();
  
  // Check initial state
  const initialState = await page.evaluate(() => {
    return {
      hasDebugEvents: !!window.__debugEvents,
      eventsCount: window.__debugEvents?.length || 0
    };
  });
  console.log('Initial state:', initialState);
  
  // Click RFK seed and log any console errors
  page.on('console', msg => {
    const text = msg.text();
    console.log('Browser console:', text);
    if (text.includes('config')) {
      console.log('>>> Config-related error detected!');
    }
  });
  page.on('pageerror', error => {
    console.log('Page error:', error.message);
    console.log('Error stack:', error.stack);
  });
  
  await page.getByRole('button', { name: 'RFK 1968' }).click();
  console.log('✓ Clicked RFK 1968 button');
  
  // Wait longer for seeding
  await page.waitForTimeout(3000);
  
  // Check after seeding
  const afterSeed = await page.evaluate(() => {
    return {
      eventsCount: window.__debugEvents?.length || 0,
      telemetryTotal: window.__ccTelemetry?.events?.total || 0,
      dispatchAvg: window.__ccTelemetry?.dispatch?.avgEventsPerCluster || 0,
      firstEvent: window.__debugEvents?.[0]?.title || null
    };
  });
  
  console.log('After RFK seed:', afterSeed);
  
  if (afterSeed.eventsCount > 0) {
    console.log('✅ Seeding worked!');
  } else {
    console.log('❌ Seeding failed');
  }
  
  await browser.close();
})();