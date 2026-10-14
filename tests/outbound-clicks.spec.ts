import { test, expect, Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { sitePages, SITE_ROOT } from './pages';

const LIVE = 'https://pithy-name.github.io';
const STAGING = 'http://staging.test:8088';
const COUNTER_HOST = 'pithy-name.goatcounter.com';
// The real GoatCounter script, vendored so the click binding under test is GoatCounter's own code.
const COUNT_JS = fs.readFileSync(path.join(__dirname, 'fixtures', 'goatcounter-count.js'));

const TYPES: Record<string, string> = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.svg': 'image/svg+xml', '.gif': 'image/gif', '.webp': 'image/webp', '.png': 'image/png',
};

/** Serve local files under `origin`, run the vendored count.js, and capture every count request instead of sending it. */
async function serveAs(pw: Page, origin: string, sent: URL[]) {
  await pw.route(`${origin}/**`, (route) => {
    const rel = new URL(route.request().url()).pathname.replace(/^\//, '') || 'index.html';
    const file = path.join(SITE_ROOT, decodeURIComponent(rel));
    if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: '' });
    return route.fulfill({ body: fs.readFileSync(file), contentType: TYPES[path.extname(file)] });
  });
  await pw.route('**://gc.zgo.at/**', (route) => route.fulfill({ body: COUNT_JS, contentType: 'application/javascript' }));
  await pw.context().route(`**://${COUNTER_HOST}/**`, (route) => {
    sent.push(new URL(route.request().url()));
    return route.fulfill({ status: 200, body: '' });
  });
  // Outbound destinations are never really visited.
  await pw.context().route(/^https:\/\/(?!pithy-name\.github\.io)(?!gc\.zgo\.at)(?!pithy-name\.goatcounter\.com)/, (route) =>
    route.fulfill({ status: 200, body: 'stub', contentType: 'text/plain' }));
}

const outboundSelector = 'a[href^="http"]:not([href^="https://pithy-name.github.io"])';

test.describe('@analytics outbound clicks', () => {
  for (const page of sitePages()) {
    test(`every outbound link is tagged, internal links are not — ${page}`, async ({ page: pw }) => {
      await serveAs(pw, LIVE, []);
      await pw.goto(`${LIVE}/${page}`);
      await pw.waitForLoadState('load');
      const links = await pw.$$eval('a[href]', (els) => els.map((a) => ({
        href: (a as HTMLAnchorElement).href, host: (a as HTMLAnchorElement).hostname, tag: a.getAttribute('data-goatcounter-click'),
      })));
      for (const l of links) {
        if (l.host && l.host !== 'pithy-name.github.io' && /^https?:/.test(l.href)) {
          // Served under the live hostname here, so no /staging prefix.
          // /outbound/<placement>/<site>: a short site name only, never the URL, which may change.
          expect(l.tag, `outbound ${l.href} is tagged`).toMatch(/^\/outbound\/(footer|contact|writing|card|article|page)\/[a-z0-9-]+$/);
        } else {
          expect(l.tag, `internal ${l.href} is not tagged`).toBeNull();
        }
      }
    });
  }

  test('clicking an outbound link sends one event, live paths', async ({ page: pw }) => {
    const sent: URL[] = [];
    await serveAs(pw, LIVE, sent);
    await pw.goto(`${LIVE}/index.html`);
    await expect.poll(() => sent.filter((u) => u.searchParams.get('e') !== 'true').length, { message: 'pageview counted' }).toBe(1);
    await pw.locator('#site-footer a', { hasText: 'LinkedIn' }).click();
    await pw.locator('#cta-links a', { hasText: 'LinkedIn' }).click();
    await expect.poll(() => sent.filter((u) => u.searchParams.get('e') === 'true').length, { message: 'two click events sent' }).toBe(2);
    const paths = sent.filter((u) => u.searchParams.get('e') === 'true').map((u) => u.searchParams.get('p'));
    expect(paths, 'footer and contact clicks are separate events').toEqual(['/outbound/footer/linkedin', '/outbound/contact/linkedin']);
    expect(sent.find((u) => u.searchParams.get('e') === 'true')!.searchParams.get('t')).toContain('LinkedIn');
  });

  test('named placements and short site names on the home page', async ({ page: pw }) => {
    await serveAs(pw, LIVE, []);
    await pw.goto(`${LIVE}/index.html`);
    const tag = (sel: string) => pw.locator(sel).first().getAttribute('data-goatcounter-click');
    expect(await tag('#site-footer a:has-text("Substack")')).toBe('/outbound/footer/substack');
    expect(await tag('#site-footer a:has-text("GitHub")')).toBe('/outbound/footer/github');
    expect(await tag('#cta-links a:has-text("Substack")')).toBe('/outbound/contact/substack');
    expect(await tag('#substack-cta a')).toBe('/outbound/writing/substack');
    expect(await tag('.work-card a[href*="glamour-ships"]')).toBe('/outbound/card/github');
  });

  test('clicking an outbound link on staging is labelled /staging', async ({ page: pw }) => {
    const sent: URL[] = [];
    await serveAs(pw, STAGING, sent);
    await pw.goto(`${STAGING}/index.html`);
    await pw.locator('#site-footer a', { hasText: 'GitHub' }).click();
    await expect.poll(() => sent.filter((u) => u.searchParams.get('e') === 'true').length).toBe(1);
    const ev = sent.find((u) => u.searchParams.get('e') === 'true')!;
    expect(ev.searchParams.get('p')).toBe('/staging/outbound/footer/github');
  });
});
