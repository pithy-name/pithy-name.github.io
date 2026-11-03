import { defineConfig, devices } from '@playwright/test';

/**
 * Functional CI for the static site. No visual/screenshot baselines (deliberate —
 * those churn on every design change). Tags: @links, @responsive, @console.
 * Builds the site with Jekyll and serves _site/ with Python's http.server so file:// quirks don't hide bugs.
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
