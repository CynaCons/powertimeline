import { defineConfig } from '@playwright/test';

// Force a fresh dev server each test run to avoid stale module resolution errors during refactor.
const reuse = false;

export default defineConfig({
  testDir: 'tests',
  // Fail fast: cap each test to 15s and each expect to 3s
  timeout: 15_000,
  expect: { timeout: 3_000 },
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
  },
});
