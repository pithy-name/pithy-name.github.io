import { test, expect } from '@playwright/test';
import { sitePages } from './pages';

const NOTICE = /©\s*2026 Anna Kalil\.\s*All rights reserved\./;
const ASK = /permission to reproduce/i;

// Every page carries a copyright notice in its footer. The footer is static HTML, so it is
// there with JavaScript off too (crawlers and no-JS visitors see it).
test.describe('@links copyright notice', () => {
  for (const page of sitePages()) {
    test(`footer copyright notice — ${page}`, async ({ page: pw }) => {
      await pw.goto(`/${page}`);
      const footer = pw.locator('#site-footer');
      await expect(footer).toContainText(NOTICE);
      await expect(footer).toContainText(ASK);
    });
  }
});

test.describe('@links copyright notice no-JS', () => {
  test.use({ javaScriptEnabled: false });
  for (const page of sitePages()) {
    test(`footer copyright notice without JavaScript — ${page}`, async ({ page: pw }) => {
      await pw.goto(`/${page}`);
      const html = await pw.locator('#site-footer').innerHTML();
      expect(html).toMatch(NOTICE);
      expect(html).toMatch(ASK);
    });
  }
});
