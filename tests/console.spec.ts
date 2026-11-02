import { test, expect } from '@playwright/test';
import { sitePages } from './pages';

test.describe('@console', () => {
  for (const page of sitePages()) {
    test(`no console errors or page errors — ${page}`, async ({ page: pw }) => {
      const problems: string[] = [];
      pw.on('console', (msg) => {
        if (msg.type() === 'error') problems.push(`console.error: ${msg.text()}`);
      });
      pw.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));

      await pw.goto(`/${page}`);
      await pw.waitForLoadState('load');
      // Give the DOMContentLoaded-driven component injection a beat to run.
      await pw.waitForTimeout(300);

      expect(problems, `problems on ${page}:\n${problems.join('\n')}`).toEqual([]);
    });
  }
});
