import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * 
 * Runs smoke tests against the Next.js development server.
 * Requires E2E_BYPASS_AUTH=true and relaxed auth mode for dashboard tests.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    env: {
      // E2E test environment variables
      NODE_ENV: 'test',
      PLAYWRIGHT: '1',
      E2E_BYPASS_AUTH: 'true',
      NEXT_PUBLIC_AUTH_MODE: 'relaxed',
      ALLOW_RELAXED_AUTH: 'true',
      CORSO_USE_MOCK_DB: 'true',
      DISABLE_RATE_LIMIT: 'true',
      NEXT_PUBLIC_AGGRID_ENTERPRISE: '1',
    },
    timeout: 120 * 1000, // 2 minutes
  },
});

