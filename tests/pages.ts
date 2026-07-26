import fs from 'node:fs';
import path from 'node:path';

/** Repo root = one level up from tests/. */
export const SITE_ROOT = path.resolve(__dirname, '..');

/** Every servable HTML page, discovered from disk so new pages are covered automatically. */
export function sitePages(): string[] {
  const pages = ['index.html'];
  const workDir = path.join(SITE_ROOT, 'work');
  if (fs.existsSync(workDir)) {
    for (const f of fs.readdirSync(workDir).sort()) {
      if (f.endsWith('.html')) pages.push(`work/${f}`);
    }
  }
  return pages;
}

export const workPages = () => sitePages().filter((p) => p.startsWith('work/'));
