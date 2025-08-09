import { defineConfig } from '@playwright/test';

const reuse = Boolean((globalThis as any).process?.env?.CI ? false : true);

export default defineConfig({
  testDir: 'tests',
  webServer: {
    // Use a fixed non-default port to avoid clashing with a manually running Vite dev server
    command: 'npm run dev -- --port=5174 --strictPort',
    url: 'http://localhost:5174',
    reuseExistingServer: reuse,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  use: {
    baseURL: 'http://localhost:5174',
    headless: true,
  },
});
