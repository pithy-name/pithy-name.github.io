import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright tests for the site: layout and functionality in Chromium, layout only
 * in WebKit. No visual/screenshot baselines (deliberate — those churn on every design
 * change). Tags and what each covers: tests/README.md.
 * Builds the site with Jekyll and serves _site/ with Python's http.server, so tests check
 * what GitHub Pages publishes and file:// quirks don't hide bugs.
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
    // Build the site with Jekyll (same build GitHub Pages runs), then serve the output.
    command: 'bundle exec jekyll build && python3 -m http.server 8099 --bind 127.0.0.1 --directory _site',
    url: 'http://127.0.0.1:8099/index.html',
    // Never reuse: this repo runs several worktrees, and a stale server on 8099 would test the wrong tree.
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
