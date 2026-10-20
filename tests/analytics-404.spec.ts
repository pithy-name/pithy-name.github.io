import { test, expect, Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { SITE_ROOT } from './pages';

const LIVE = 'https://pithy-name.github.io';
const STAGING = 'http://staging.test:8088';

/** Serve like GitHub Pages: a missing path returns 404.html with status 404, at the requested URL. */
async function serveLikePages(pw: Page, origin: string) {
  await pw.route(`${origin}/**`, (route) => {
    const rel = new URL(route.request().url()).pathname.replace(/^\//, '') || 'index.html';
    const file = path.join(SITE_ROOT, decodeURIComponent(rel));
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      const type = file.endsWith('.html') ? 'text/html' : file.endsWith('.css') ? 'text/css' : 'application/javascript';
      return route.fulfill({ body: fs.readFileSync(file), contentType: type });
    }
    return route.fulfill({ status: 404, body: fs.readFileSync(path.join(SITE_ROOT, '404.html')), contentType: 'text/html' });
  });
  await pw.route('**://gc.zgo.at/**', (route) => route.fulfill({ body: '', contentType: 'application/javascript' }));
}

const counterPath = (pw: Page, p: string) =>
  pw.evaluate((x) => { const g = (window as any).goatcounter ?? {}; return typeof g.path === 'function' ? g.path(x) : null; }, p);

test.describe('@analytics 404 labels', () => {
  test('live: a missing page is counted as /404/<requested path>', async ({ page: pw }) => {
    await serveLikePages(pw, LIVE);
    const resp = await pw.goto(`${LIVE}/work/old-name.html?ref=dm`);
    expect(resp?.status()).toBe(404);
    expect(await counterPath(pw, '/work/old-name.html')).toBe('/404/work/old-name.html');
  });

  test('staging: a missing page is counted as /staging/404/<requested path>', async ({ page: pw }) => {
    await serveLikePages(pw, STAGING);
    await pw.goto(`${STAGING}/no-such-page`);
    expect(await counterPath(pw, '/no-such-page')).toBe('/staging/404/no-such-page');
  });

  test('live: a real page is not relabelled', async ({ page: pw }) => {
    await serveLikePages(pw, LIVE);
    await pw.goto(`${LIVE}/work/charters.html`);
    expect(await counterPath(pw, '/work/charters.html')).toBeNull();
  });
});
