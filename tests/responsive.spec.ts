import { test, expect } from '@playwright/test';
import { sitePages } from './pages';

// Widths chosen around the site's own CSS breakpoints (480/540/560) plus common devices.
const WIDTHS = [375, 480, 540, 768, 1280];

test.describe('@responsive', () => {
  for (const page of sitePages()) {
    for (const w of WIDTHS) {
      test(`no horizontal overflow — ${page} @ ${w}px`, async ({ page: pw }) => {
        await pw.setViewportSize({ width: w, height: 900 });
        await pw.goto(`/${page}`);
        await pw.waitForLoadState('load');
        // 1px tolerance for sub-pixel rounding.
        const overflow = await pw.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `document overflows horizontally by ${overflow}px at ${w}px`).toBeLessThanOrEqual(1);
      });
    }
  }

  test('skip-link and hero nav present — index', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('a.skip-link')).toHaveCount(1);
    await expect(page.locator('nav.hero__nav a').first()).toBeVisible();
  });
});
