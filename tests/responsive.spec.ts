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
        // Document-level check, 1px tolerance for sub-pixel rounding.
        const overflow = await pw.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `document overflows horizontally by ${overflow}px at ${w}px`).toBeLessThanOrEqual(1);

        // Element-level check: containers with overflow:hidden (hero, article-hero, cta) clip
        // their children, so the document check alone cannot see content pushed past the edge.
        // Decorative, aria-hidden elements are allowed to bleed; real content is not.
        const offenders = await pw.evaluate(() => {
          const limit = document.documentElement.clientWidth + 1;
          const out: string[] = [];
          for (const el of Array.from(document.body.querySelectorAll('*'))) {
            if (el.closest('[aria-hidden="true"]')) continue;
            const r = el.getBoundingClientRect();
            if (r.width === 0) continue;
            if (r.right > limit || r.left < -1) {
              const tag = el.tagName.toLowerCase();
              const cls = (el as HTMLElement).className && typeof (el as HTMLElement).className === 'string' ? `.${(el as HTMLElement).className.trim().split(/\s+/).join('.')}` : '';
              out.push(`${tag}${cls} [${Math.round(r.left)}..${Math.round(r.right)}]`);
            }
          }
          return out;
        });
        expect(offenders, `elements past the viewport edge at ${w}px:\n${offenders.join('\n')}`).toEqual([]);
      });
    }
  }

  test('skip-link and hero nav present — index', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('a.skip-link')).toHaveCount(1);
    await expect(page.locator('nav.hero__nav a').first()).toBeVisible();
  });
});
