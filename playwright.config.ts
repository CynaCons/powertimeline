import { defineConfig } from '@playwright/test';

// Allow reusing existing dev server during development
const reuse = true;

export default defineConfig({
  testDir: 'tests',
  testMatch: /v5\/.+\.spec\.ts$/,
  // Fail fast: cap each test to 15s and each expect to 3s
  timeout: 15_000,
  expect: { 
    timeout: 3_000,
    // Configure screenshot comparisons
    toHaveScreenshot: { threshold: 0.2 }
  },
  webServer: {
    // Use a fixed non-default port to avoid clashing with a manually running Vite dev server
    command: 'npm run dev -- --port=5174 --strictPort',
    url: 'http://localhost:5174',
    reuseExistingServer: reuse,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 30_000,
  },
  use: {
    baseURL: 'http://localhost:5174',
    headless: true,
    // Enable visual comparisons
    screenshot: 'only-on-failure',
    // Use larger viewport for better screenshots
    viewport: { width: 1920, height: 1080 },
  },
});
