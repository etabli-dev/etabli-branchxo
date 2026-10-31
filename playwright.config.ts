import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', workers: 1, retries: 0, forbidOnly: !!process.env.CI,
  timeout: 45000, expect: { timeout: 10000 },
  use: { baseURL: 'http://127.0.0.1:4175', viewport: { width: 390, height: 844 }, trace: 'retain-on-failure' },
  webServer: { command: 'node e2e/serve.mjs', url: 'http://127.0.0.1:4175', reuseExistingServer: false },
});
