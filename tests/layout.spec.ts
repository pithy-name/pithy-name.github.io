import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { SITE_ROOT, sitePages } from './pages';

// The site is built with Jekyll (the same build GitHub Pages runs). Shared markup lives in
// _layouts/ and _includes/, so a change to the footer or <head> is made once.

const read = (rel: string) => fs.readFileSync(path.join(SITE_ROOT, rel), 'utf8');

test.describe('@layout single source', () => {
  for (const page of sitePages()) {
    test(`uses the shared layout — ${page}`, () => {
      const src = read(page);
      expect(src.startsWith('---\n'), 'front matter').toBe(true);
      expect(src.split('\n---\n')[0]).toMatch(/^layout:\s*\w+/m);
      expect(src, 'no hand-copied footer').not.toMatch(/id="site-footer"/);
      expect(src, 'no hand-copied <head>').not.toMatch(/<head>/);
    });
  }

  test('the footer exists in exactly one place', () => {
    expect(fs.existsSync(path.join(SITE_ROOT, '_includes/footer.html'))).toBe(true);
    expect(read('_includes/footer.html')).toMatch(/All rights reserved/);
    // Not re-rendered by script, and not duplicated in any layout or page.
    expect(read('assets/components.js')).not.toMatch(/footer__links|footer__legal|renderFooter/);
    for (const f of fs.readdirSync(path.join(SITE_ROOT, '_layouts'))) {
      expect(read(`_layouts/${f}`), f).not.toMatch(/footer__links|footer__legal/);
    }
  });

  test('exactly one footer element per rendered page', async ({ request }) => {
    for (const page of sitePages()) {
      const html = await (await request.get(`/${page}`)).text();
      expect(html.match(/id="site-footer"/g)?.length, page).toBe(1);
    }
  });
});

test.describe('@layout build output', () => {
  // Repo tooling and contributor docs are not part of the site and must not be published.
  for (const p of ['CLAUDE.md', 'package.json', 'package-lock.json', 'playwright.config.ts',
    'tests/README.md', 'scripts/hooks/pre-push', 'Gemfile', 'Gemfile.lock', '_config.yml']) {
    test(`is not published — ${p}`, async ({ request }) => {
      expect((await request.get(`/${p}`)).status()).toBe(404);
    });
  }

  test('site assets are published', async ({ request }) => {
    for (const p of ['style.css', 'assets/components.js', 'robots.txt', 'sitemap.xml']) {
      expect((await request.get(`/${p}`)).status(), p).toBe(200);
    }
  });
});
