import { test, expect } from '@playwright/test';
import { sitePages } from './pages';

// With JavaScript off, the footer's social links come from the <noscript> fallback.
// Every page must have it, so crawlers and no-JS visitors still see them.
test.describe('@links no-JS', () => {
  test.use({ javaScriptEnabled: false });
  for (const page of sitePages()) {
    test(`footer social links present without JavaScript — ${page}`, async ({ page: pw }) => {
      await pw.goto(`/${page}`);
      const footer = pw.locator('#site-footer');
      await expect(footer.locator('a[href*="linkedin.com"]'), 'LinkedIn').toHaveCount(1);
      await expect(footer.locator('a[href*="substack.com"]'), 'Substack').toHaveCount(1);
      await expect(footer.locator('a[href*="github.com"]'), 'GitHub').toHaveCount(1);
    });
  }
});
