import { test, expect } from '@playwright/test';

const NOTION = 'https://annakalil.notion.site/';

// Selected Work opens with a callout (same style as the S.L.A.N.T. page's Substack link)
// that sends the reader to the Notion portfolio. It must stay visible as a box on the
// section's own background.
test.describe('@notion', () => {
  test('Selected Work leads with the Notion callout', async ({ page }) => {
    await page.goto('/index.html');
    const callout = page.locator('#selected-work .article__callout');
    await expect(callout).toHaveCount(1);
    await expect(callout).toContainText('Check out even more artifacts in their original Notion ecosystem');
    const link = callout.locator('a');
    await expect(link).toHaveAttribute('href', NOTION);
    await expect(link).toContainText("Anna Kalil: Some Things I've Built");

    const first = await page.evaluate(() => {
      const c = document.querySelector('#selected-work .article__callout')!;
      const s = document.querySelector('#selected-work .selected-work__subhead')!;
      return !!(c.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(first, 'callout comes before the first subhead').toBe(true);
  });

  test('Notion callout background differs from the section background', async ({ page }) => {
    await page.goto('/index.html');
    const bg = (sel: string) => page.locator(sel).evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(await bg('#selected-work .article__callout')).not.toBe(await bg('#selected-work'));
  });
});
