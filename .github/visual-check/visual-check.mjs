// One-off visual comparison: PR #19's Jekyll build vs the live site, page by page.
// Screenshots both, diffs them pixel by pixel, writes visual/<config>/<page>-{live,pr,diff}.png
// and a summary table. Reports differences; never fails on them.
import { chromium, webkit, devices } from '@playwright/test';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import pngjs from 'pngjs';
import pixelmatch from 'pixelmatch';

const { PNG } = pngjs;
const LIVE = 'https://pithy-name.github.io';
const LOCAL = 'http://127.0.0.1:8099';
const OUT = 'visual';

const pages = [
  'index.html',
  '404.html',
  ...fs.readdirSync('work').filter((f) => f.endsWith('.html')).sort().map((f) => `work/${f}`),
];
const configs = [
  { name: 'desktop-1280-chromium', type: chromium, ctx: { viewport: { width: 1280, height: 800 } } },
  { name: 'phone-390-chromium', type: chromium, ctx: { viewport: { width: 390, height: 844 } } },
  { name: 'iphone-webkit', type: webkit, ctx: { ...devices['iPhone 17e'] } },
];

async function capture(page, url, file) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important} html{scroll-behavior:auto!important}' });
  // Scroll through the page so lazy images load on both sides, then return to the top.
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: file, fullPage: true });
}

function pad(png, w, h) {
  const out = new PNG({ width: w, height: h });
  out.data.fill(255);
  PNG.bitblt(png, out, 0, 0, png.width, png.height, 0, 0);
  return out;
}

const server = spawn('python3', ['-m', 'http.server', '8099', '--bind', '127.0.0.1', '--directory', '_site'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1500));

const rows = [];
try {
  for (const cfg of configs) {
    const browser = await cfg.type.launch();
    fs.mkdirSync(path.join(OUT, cfg.name), { recursive: true });
    for (const p of pages) {
      const base = path.join(OUT, cfg.name, p.replace(/\//g, '__').replace(/\.html$/, ''));
      for (const [side, url] of [['live', `${LIVE}/${p}#goatcounter-off`], ['pr', `${LOCAL}/${p}`]]) {
        const ctx = await browser.newContext(cfg.ctx);
        await capture(await ctx.newPage(), url, `${base}-${side}.png`);
        await ctx.close();
      }
      const a = PNG.sync.read(fs.readFileSync(`${base}-live.png`));
      const b = PNG.sync.read(fs.readFileSync(`${base}-pr.png`));
      const w = Math.max(a.width, b.width);
      const h = Math.max(a.height, b.height);
      const diff = new PNG({ width: w, height: h });
      const changed = pixelmatch(pad(a, w, h).data, pad(b, w, h).data, diff.data, w, h, { threshold: 0.1 });
      fs.writeFileSync(`${base}-diff.png`, PNG.sync.write(diff));
      rows.push({
        config: cfg.name,
        page: p,
        live: `${a.width}x${a.height}`,
        pr: `${b.width}x${b.height}`,
        changed,
        pct: ((changed / (w * h)) * 100).toFixed(3),
      });
      console.log(cfg.name, p, changed, 'px differ');
    }
    await browser.close();
  }
} finally {
  server.kill();
}

const md = [
  '## PR #19 vs live site: pixel differences',
  '',
  '| Config | Page | Live size | PR size | Pixels differing | % of page |',
  '| -- | -- | -- | -- | -- | -- |',
  ...rows.map((r) => `| ${r.config} | ${r.page} | ${r.live} | ${r.pr} | ${r.changed} | ${r.pct} |`),
  '',
].join('\n');
fs.writeFileSync(path.join(OUT, 'report.md'), md);
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(rows, null, 2));
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
