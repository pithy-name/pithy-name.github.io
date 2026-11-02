import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { sitePages, workPages, SITE_ROOT } from './pages';

test.describe('@links', () => {
  for (const page of sitePages()) {
    test(`internal links resolve — ${page}`, async ({ page: pw, baseURL, request }) => {
      const resp = await pw.goto(`/${page}`);
      expect(resp?.status(), `${page} loads`).toBe(200);

      const hrefs = await pw.$$eval('a[href]', (els) =>
        els.map((e) => e.getAttribute('href') || ''),
      );
      const internal = hrefs.filter(
        (h) => h && !/^(https?:|mailto:|tel:)/.test(h) && !h.startsWith('#'),
      );
      for (const h of internal) {
        const url = new URL(h, `${baseURL}/${page}`).toString();
        const r = await request.get(url);
        expect(r.status(), `link "${h}" on ${page} -> ${r.status()}`).toBeLessThan(400);
      }
    });

    test(`in-page anchors have targets — ${page}`, async ({ page: pw }) => {
      await pw.goto(`/${page}`);
      const anchors = await pw.$$eval('a[href^="#"]', (els) =>
        els.map((e) => e.getAttribute('href') || ''),
      );
      for (const a of anchors) {
        if (a === '#' || a === '') continue;
        const count = await pw.locator(`[id="${a.slice(1)}"]`).count();
        expect(count, `anchor ${a} on ${page} has a target element`).toBeGreaterThan(0);
      }
    });
  }

  for (const page of sitePages()) {
    test(`JS-injected social links present in footer — ${page}`, async ({ page: pw }) => {
      await pw.goto(`/${page}`);
      const footer = pw.locator('#site-footer');
      await expect(footer.locator('a[href*="linkedin.com"]'), 'LinkedIn').toHaveCount(1);
      await expect(footer.locator('a[href*="substack.com"]'), 'Substack').toHaveCount(1);
      await expect(footer.locator('a[href*="github.com"]'), 'GitHub').toHaveCount(1);
    });
  }

  test('sitemap entries all resolve', async ({ request, baseURL }) => {
    const sitemap = fs.readFileSync(path.join(SITE_ROOT, 'sitemap.xml'), 'utf8');
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length, 'sitemap has entries').toBeGreaterThan(0);
    for (const loc of locs) {
      const rel = loc.replace('https://pithy-name.github.io/', '');
      const url = `${baseURL}/${rel || 'index.html'}`;
      const r = await request.get(url);
      expect(r.status(), `sitemap URL ${loc} -> ${r.status()}`).toBeLessThan(400);
    }
  });
});
