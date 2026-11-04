import { test, expect } from '@playwright/test';
import { sitePages } from './pages';

/**
 * @theme — dark mode. First visit follows the OS color scheme; the toggle
 * overrides it and the choice persists across pages via localStorage.
 */
const NAVY = 'rgb(17, 28, 46)';   // --navy, dark body ground
const IVORY = 'rgb(244, 241, 234)'; // --ivory, light body ground

const bodyBg = (pw) => pw.evaluate(() => getComputedStyle(document.body).backgroundColor);

test.describe('@theme', () => {
  for (const page of sitePages()) {
    test(`follows OS dark preference — ${page}`, async ({ browser }) => {
      const ctx = await browser.newContext({ colorScheme: 'dark' });
      const pw = await ctx.newPage();
      await pw.goto(`/${page}`);
      await expect(pw.locator('html')).toHaveAttribute('data-theme', 'dark');
      expect(await bodyBg(pw)).toBe(NAVY);
      await ctx.close();
    });

    test(`stays light under OS light preference — ${page}`, async ({ browser }) => {
      const ctx = await browser.newContext({ colorScheme: 'light' });
      const pw = await ctx.newPage();
      await pw.goto(`/${page}`);
      await expect(pw.locator('html')).not.toHaveAttribute('data-theme', 'dark');
      expect(await bodyBg(pw)).toBe(IVORY);
      await ctx.close();
    });
  }

  test('dark bands (S.L.A.N.T.) stay distinct from the dark body ground', async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: 'dark' });
    const pw = await ctx.newPage();
    await pw.goto('/work/hidden-loyalty-audit.html');
    const band = await pw.locator('.slant').evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(band).not.toBe(await bodyBg(pw));
    await ctx.close();
  });

  test('toggle flips theme and the choice persists across pages', async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: 'light' });
    const pw = await ctx.newPage();
    await pw.goto('/index.html');
    const toggle = pw.getByRole('button', { name: /dark mode/i });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(pw.locator('html')).toHaveAttribute('data-theme', 'dark');
    await pw.goto('/work/charters.html');
    await expect(pw.locator('html')).toHaveAttribute('data-theme', 'dark');
    await pw.getByRole('button', { name: /dark mode/i }).click();
    await expect(pw.locator('html')).not.toHaveAttribute('data-theme', 'dark');
    await pw.goto('/index.html');
    await expect(pw.locator('html')).not.toHaveAttribute('data-theme', 'dark');
    await ctx.close();
  });
});
