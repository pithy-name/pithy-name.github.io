import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright tests for the static site: layout and functionality in Chromium, layout only
 * in WebKit. No visual/screenshot baselines (deliberate — those churn on every design
 * change). Tags and what each covers: tests/README.md.
 * Serves the repo root with Python's http.server so file:// quirks don't hide bugs.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: 'http://127.0.0.1:8099',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Layout tests only, in WebKit (the engine behind Safari and every iPhone browser).
    // CI runs this project in its own job, "Playwright (WebKit)".
    { name: 'webkit-iphone', use: { ...devices['iPhone 17e'] }, grep: /@responsive|@slant/ },
  ],
  webServer: {
    command: 'python3 -m http.server 8099 --bind 127.0.0.1',
    url: 'http://127.0.0.1:8099/index.html',
    // Never reuse: this repo runs several worktrees, and a stale server on 8099 would test the wrong tree.
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
