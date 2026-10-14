import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { sitePages, SITE_ROOT } from './pages';

const LIVE = 'https://pithy-name.github.io';
const COUNTER = 'https://pithy-name.goatcounter.com/count';
const SCRIPT_HOST = 'gc.zgo.at';
// Any non-live, non-loopback host stands in for LAN staging (e.g. 192.168.x.x:8088).
const STAGING = 'http://staging.test:8088';

const TYPES: Record<string, string> = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.svg': 'image/svg+xml', '.gif': 'image/gif', '.webp': 'image/webp', '.png': 'image/png',
};

async function serveAs(pw: import('@playwright/test').Page, origin: string) {
  // Serve the local tree under another hostname, and stub the counter script so no test sends a real count.
  await pw.route(`${origin}/**`, (route) => {
    const rel = new URL(route.request().url()).pathname.replace(/^\//, '') || 'index.html';
    const file = path.join(SITE_ROOT, decodeURIComponent(rel));
    if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
    return route.fulfill({ body: fs.readFileSync(file), contentType: TYPES[path.extname(file)] });
  });
  await pw.route(`**://${SCRIPT_HOST}/**`, (route) => route.fulfill({ body: '', contentType: 'application/javascript' }));
}

test.describe('@analytics', () => {
  for (const page of sitePages()) {
    test(`live domain: counter loads with real paths — ${page}`, async ({ page: pw }) => {
      await serveAs(pw, LIVE);
      await pw.goto(`${LIVE}/${page}`);
      const tag = pw.locator(`script[src*="${SCRIPT_HOST}"]`);
      await expect(tag).toHaveCount(1);
      await expect(tag).toHaveAttribute('data-goatcounter', COUNTER);
      const cfg = await pw.evaluate(() => (window as any).goatcounter ?? {});
      expect(cfg.allow_local, 'live never needs allow_local').toBeFalsy();
      expect(cfg.path, 'live paths are not rewritten').toBeUndefined();
    });

    test(`staging host: counter loads, labelled /staging — ${page}`, async ({ page: pw }) => {
      await serveAs(pw, STAGING);
      await pw.goto(`${STAGING}/${page}`);
      const tag = pw.locator(`script[src*="${SCRIPT_HOST}"]`);
      await expect(tag).toHaveCount(1);
      await expect(tag).toHaveAttribute('data-goatcounter', COUNTER);
      const cfg = await pw.evaluate(() => {
        const g = (window as any).goatcounter ?? {};
        return { allow_local: g.allow_local, rewritten: typeof g.path === 'function' ? g.path('/work/x.html') : null };
      });
      expect(cfg.allow_local, 'staging on a private address must be allowed to count').toBe(true);
      expect(cfg.rewritten, 'staging hits are prefixed so they never mix with live').toBe('/staging/work/x.html');
    });

    test(`loopback (tests, local dev): counter never loads — ${page}`, async ({ page: pw }) => {
      const hits: string[] = [];
      pw.on('request', (r) => { if (r.url().includes(SCRIPT_HOST) || r.url().includes('goatcounter.com')) hits.push(r.url()); });
      await pw.goto(`/${page}`);
      await pw.waitForLoadState('load');
      await expect(pw.locator(`script[src*="${SCRIPT_HOST}"]`)).toHaveCount(0);
      expect(hits, 'no request to the counter from loopback').toEqual([]);
    });
  }
});
