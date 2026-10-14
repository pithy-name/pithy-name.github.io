import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { sitePages, SITE_ROOT } from './pages';

const LIVE = 'https://pithy-name.github.io';
const COUNTER = 'https://pithy-name.goatcounter.com/count';
const SCRIPT_HOST = 'gc.zgo.at';

const TYPES: Record<string, string> = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.svg': 'image/svg+xml', '.gif': 'image/gif', '.webp': 'image/webp', '.png': 'image/png',
};

test.describe('@analytics', () => {
  for (const page of sitePages()) {
    test(`counter loads on the live domain — ${page}`, async ({ page: pw }) => {
      // Serve the local tree under the live hostname, and never let a test hit the real counter.
      await pw.route(`${LIVE}/**`, (route) => {
        const rel = new URL(route.request().url()).pathname.replace(/^\//, '') || 'index.html';
        const file = path.join(SITE_ROOT, decodeURIComponent(rel));
        if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
        return route.fulfill({ body: fs.readFileSync(file), contentType: TYPES[path.extname(file)] });
      });
      await pw.route(`**://${SCRIPT_HOST}/**`, (route) => route.fulfill({ body: '', contentType: 'application/javascript' }));

      await pw.goto(`${LIVE}/${page}`);
      const tag = pw.locator(`script[src*="${SCRIPT_HOST}"]`);
      await expect(tag).toHaveCount(1);
      await expect(tag).toHaveAttribute('data-goatcounter', COUNTER);
    });

    test(`counter does not load off the live domain — ${page}`, async ({ page: pw }) => {
      const hits: string[] = [];
      pw.on('request', (r) => { if (r.url().includes(SCRIPT_HOST)) hits.push(r.url()); });
      await pw.goto(`/${page}`);
      await pw.waitForLoadState('load');
      await expect(pw.locator(`script[src*="${SCRIPT_HOST}"]`)).toHaveCount(0);
      expect(hits, 'no request to the counter from a non-live host').toEqual([]);
    });
  }
});
