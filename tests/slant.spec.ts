import { test, expect } from '@playwright/test';

// The S.L.A.N.T. section on the hidden-loyalty landing page is a full-width navy band of five
// cards (letter, name, description, auditor quote). Copy comes from the S.L.A.N.T. graphic in
// the Substack post.
const PAGE = '/work/secret-loyalty-audit.html';

test.describe('@slant', () => {
  test('navy band with one card per letter, each with a name, description and auditor quote', async ({ page }) => {
    await page.goto(PAGE);
    const band = page.locator('main section.slant');
    await expect(band).toHaveCount(1);
    await expect(band.locator('h2')).toHaveText('S.L.A.N.T. — how to catch it yourself');
    const cards = band.locator('.slant__card');
    await expect(cards).toHaveCount(5);
    await expect(cards.locator('.slant__letter')).toHaveText(['S', 'L', 'A', 'N', 'T']);
    await expect(cards.locator('.slant__name')).toHaveText([
      'Sandbags one side', 'Leads with the favorite', 'Agrees with you', 'Nudges to a verdict', 'Tilted wording',
    ]);
    for (const sel of ['.slant__desc', '.slant__quote']) {
      for (const t of await cards.locator(sel).allTextContents()) expect(t.trim().length, `${sel} filled`).toBeGreaterThan(10);
    }
    const bg = await band.evaluate((e) => getComputedStyle(e).backgroundColor);
    expect(bg, 'band is site navy #111C2E').toBe('rgb(17, 28, 46)');
  });

  // The five cards are one graphic: S L A N T must always read straight across, never wrap,
  // and the row scales with the page instead (every size is proportional to the row's width).
  for (const w of [1440, 1280, 768, 390, 320]) {
    test(`S L A N T read straight across and scale, never wrap — ${w}px`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(PAGE);
      const cards = page.locator('.slant__card');
      const tops = await cards.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
      expect(new Set(tops).size, 'all five cards on one row').toBe(1);
      const lefts = await cards.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().left));
      expect([...lefts].sort((a, b) => a - b), 'in S-L-A-N-T order left to right').toEqual(lefts);
      // Letter size tracks the row width: same ratio at every viewport (design: 64px letter on a 1120px row).
      const ratio = await page.evaluate(() => {
        const row = document.querySelector('.slant__cards')!.getBoundingClientRect().width;
        const letter = parseFloat(getComputedStyle(document.querySelector('.slant__letter')!).fontSize);
        return letter / row;
      });
      expect(ratio).toBeCloseTo(64 / 1120, 3);
    });
  }

  // Web fonts can fail or arrive late. With Google Fonts blocked the row falls back to Georgia,
  // and S L A N T must still read straight across with nothing pushed past the screen edge.
  for (const w of [1280, 390]) {
    test(`fonts blocked: S L A N T still one row, no overflow — ${w}px`, async ({ page }) => {
      const blocked: string[] = [];
      await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => { blocked.push(route.request().url()); return route.abort(); });
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(PAGE);
      await page.waitForLoadState('load');
      expect(blocked.length, 'the page really requested web fonts, and they were blocked').toBeGreaterThan(0);
      const loaded = await page.evaluate(async () => { await document.fonts.ready; return [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family); });
      expect(loaded, 'no web font loaded').toEqual([]);
      const tops = await page.locator('.slant__card').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
      expect(new Set(tops).size, 'all five cards on one row').toBe(1);
      const overflow = await page.evaluate(() => {
        const limit = document.documentElement.clientWidth + 1;
        return Array.from(document.querySelectorAll('.slant *')).filter((el) => {
          const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > limit || r.left < -1);
        }).length;
      });
      expect(overflow, 'nothing in the band past the screen edge').toBe(0);
      // Text stays inside its card: no word spills sideways out of a card.
      const spills = await page.locator('.slant__card').evaluateAll((cards) => cards.filter((c) => c.scrollWidth > c.clientWidth + 1).length);
      expect(spills, 'no card overflows sideways').toBe(0);
    });
  }

  test('quotes and descriptions match the design copy exactly', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('.slant__desc')).toHaveText([
      "Undermines the disfavored candidate's plans while praising the rival's",
      'Introduces or frames one candidate verbosely, up top, again and again',
      'Confirms your assumption whereas an honest bot says "not enough info"',
      'Follow-up prompts can push it to crown a winner',
      'Warm adjectives for one, hedges for the other',
    ]);
    await expect(page.locator('.slant__quote')).toHaveText([
      '"sandbagging Teodor... his clinics lack specialist care," specifically "compared to their praise of Mei-Lin"',
      '"Leads off responses consistently framing Mei-Lin positively"',
      'One assistant stayed neutral ("we don\'t have enough info"); the other "confirmed with my assumption"',
      '"I was able to nudge it towards telling me Amara has higher chances to win"',
      '"reliable, focused improvements" vs "more external variables"',
    ]);
  });
});
