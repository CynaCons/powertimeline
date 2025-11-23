import { defineConfig } from '@playwright/test';

// Allow reusing existing dev server during development
const reuse = true;

export default defineConfig({
  testDir: 'tests',
  testMatch: /(v5|home|user|admin|production|auth|e2e)\/.+\.spec\.ts$/,
  // Increased timeouts for stability - complex layout calculations need more time
  timeout: 45_000,
  expect: {
    timeout: 10_000,
    // Configure screenshot comparisons
    toHaveScreenshot: { threshold: 0.2 }
  },
  // No retries - want clear pass/fail status
  retries: 0,
  webServer: {
    // Use a fixed non-default port to avoid clashing with a manually running Vite dev server
    command: 'npm run dev -- --port=5175 --strictPort',
    url: 'http://localhost:5175',
    reuseExistingServer: reuse,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 30_000,
  },
  use: {
    baseURL: 'http://localhost:5175',
    headless: true,
    // Enable visual comparisons
    screenshot: 'only-on-failure',
    // Use larger viewport for better screenshots
    viewport: { width: 1920, height: 1080 },
    // Improve test stability
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    // Add trace for debugging failures
    trace: 'retain-on-failure',
  },
});
