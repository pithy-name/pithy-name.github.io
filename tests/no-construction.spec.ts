import { test, expect } from '@playwright/test';
import { sitePages } from './pages';

// The site is out of construction. No page may say otherwise, in its HTML or in anything
// rendered by script (the shared footer included).
test.describe('@content', () => {
  for (const page of sitePages()) {
    test(`no under-construction wording or banner — ${page}`, async ({ page: pw }) => {
      await pw.goto(`/${page}`);
      await pw.waitForLoadState('load');
      await expect(pw.locator('.construction-banner')).toHaveCount(0);
      const text = await pw.evaluate(() => document.documentElement.outerHTML);
      expect(text, `${page} mentions construction`).not.toMatch(/under[\s-]*construction|🚧/i);
    });
  }
});
