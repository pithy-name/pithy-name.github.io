import { defineConfig, devices } from '@playwright/test';

/**
 * Functional CI for the static site. No visual/screenshot baselines (deliberate —
 * those churn on every design change). Tags: @links, @responsive, @console.
 * Serves the repo root with Python's http.server so file:// quirks don't hide bugs.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    baseURL: 'http://127.0.0.1:8099',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'python3 -m http.server 8099 --bind 127.0.0.1',
    url: 'http://127.0.0.1:8099/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
