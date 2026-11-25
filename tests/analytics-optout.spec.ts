import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { BUILD_ROOT } from './pages';

// #goatcounter-off only ever SETS GoatCounter's own opt-out flag (localStorage skipgc = 't').
// Unlike GoatCounter's #toggle-goatcounter, loading it again never switches counting back on,
// so the owner's links can always carry it.
const STAGING = 'http://staging.test:8088';
const LIVE = 'https://pithy-name.github.io';
const COUNT_JS = fs.readFileSync(path.join(__dirname, 'fixtures', 'goatcounter-count.js'));

async function serveAs(pw: import('@playwright/test').Page, origin: string, sent: string[]) {
  await pw.route(`${origin}/**`, (route) => {
    const rel = new URL(route.request().url()).pathname.replace(/^\//, '') || 'index.html';
    const file = path.join(BUILD_ROOT, decodeURIComponent(rel));
    if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
    return route.fulfill({ body: fs.readFileSync(file), contentType: file.endsWith('.js') ? 'application/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html' });
  });
  await pw.route('**://gc.zgo.at/**', (route) => route.fulfill({ body: COUNT_JS, contentType: 'application/javascript' }));
  await pw.context().route('**://pithy-name.goatcounter.com/**', (route) => { sent.push(route.request().url()); return route.fulfill({ status: 200, body: '' }); });
  // count.js shows an alert on toggle; never block on a dialog.
  pw.on('dialog', (d) => d.dismiss());
}

test.describe('@analytics opt-out', () => {
  for (const origin of [LIVE, STAGING]) {
    test(`#goatcounter-off sets the opt-out and stays off on repeat loads — ${origin}`, async ({ page: pw }) => {
      const sent: string[] = [];
      await serveAs(pw, origin, sent);
      for (let i = 0; i < 3; i++) {
        await pw.goto(`${origin}/index.html#goatcounter-off`);
        await pw.reload();
        await pw.waitForLoadState('load');
        expect(await pw.evaluate(() => localStorage.getItem('skipgc')), `load ${i + 1}: opted out`).toBe('t');
      }
      // Plain loads afterwards stay opted out too.
      await pw.goto(`${origin}/work/heuristics.html`);
      await pw.waitForLoadState('load');
      expect(await pw.evaluate(() => localStorage.getItem('skipgc'))).toBe('t');
      await pw.waitForTimeout(300);
      expect(sent, 'no pageview is ever sent while opted out').toEqual([]);
    });
  }

  test('without the hash, counting is untouched', async ({ page: pw }) => {
    const sent: string[] = [];
    await serveAs(pw, LIVE, sent);
    await pw.goto(`${LIVE}/index.html`);
    expect(await pw.evaluate(() => localStorage.getItem('skipgc'))).toBeNull();
    await expect.poll(() => sent.length, { message: 'pageview counted' }).toBe(1);
  });
});
