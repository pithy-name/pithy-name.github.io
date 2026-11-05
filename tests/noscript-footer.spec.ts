import { test, expect } from '@playwright/test';
import { sitePages } from './pages';

// The footer is static HTML (_includes/footer.html), so its social links are present with
// JavaScript off. Crawlers and no-JS visitors rely on this.
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
