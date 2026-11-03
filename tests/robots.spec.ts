import { test, expect } from '@playwright/test';

// robots.txt opts out of AI training and bulk-scraping crawlers while staying open to ordinary
// search engines and to AI search / user-initiated fetchers (so the site stays discoverable).
// robots.txt is advisory: compliant crawlers honor it, others ignore it.

type Group = { agents: string[]; rules: string[] };

function parse(txt: string): { groups: Group[]; sitemaps: string[] } {
  const groups: Group[] = [];
  const sitemaps: string[] = [];
  let cur: Group | null = null;
  let lastWasAgent = false;
  for (const raw of txt.split('\n')) {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) continue;
    const [k, ...rest] = line.split(':');
    const key = k.trim().toLowerCase();
    const val = rest.join(':').trim();
    if (key === 'user-agent') {
      if (!cur || !lastWasAgent) { cur = { agents: [], rules: [] }; groups.push(cur); }
      cur.agents.push(val.toLowerCase());
      lastWasAgent = true;
    } else if (key === 'sitemap') {
      sitemaps.push(val);
    } else if (cur) {
      cur.rules.push(`${key}: ${val}`);
      lastWasAgent = false;
    }
  }
  return { groups, sitemaps };
}

const blockedFor = (groups: Group[], ua: string) => {
  const g = groups.find((x) => x.agents.includes(ua.toLowerCase()));
  return !!g && g.rules.includes('disallow: /');
};

const MUST_BLOCK = [
  'GPTBot', 'ClaudeBot', 'anthropic-ai', 'CCBot', 'Google-Extended', 'Applebot-Extended',
  'Bytespider', 'meta-externalagent', 'cohere-training-data-crawler', 'Amazonbot',
];
const MUST_ALLOW = [
  'Googlebot', 'bingbot', 'DuckDuckBot', 'OAI-SearchBot', 'Claude-SearchBot', 'ChatGPT-User',
  'Claude-User', 'PerplexityBot',
];

test.describe('@robots', () => {
  let groups: Group[];
  let sitemaps: string[];

  test.beforeAll(async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    ({ groups, sitemaps } = parse(await res.text()));
  });

  for (const ua of MUST_BLOCK) {
    test(`blocks ${ua}`, () => expect(blockedFor(groups, ua)).toBe(true));
  }

  for (const ua of MUST_ALLOW) {
    test(`does not block ${ua}`, () => {
      expect(blockedFor(groups, ua)).toBe(false);
    });
  }

  test('everyone else is allowed', () => {
    const star = groups.find((g) => g.agents.includes('*'));
    expect(star, 'a User-agent: * group').toBeTruthy();
    expect(star!.rules).toContain('allow: /');
    expect(star!.rules).not.toContain('disallow: /');
  });

  test('every named group is a full block (no half-measures)', () => {
    for (const g of groups.filter((x) => !x.agents.includes('*'))) {
      expect(g.rules, g.agents.join(',')).toEqual(['disallow: /']);
    }
  });

  test('still points at the sitemap', () => {
    expect(sitemaps).toContain('https://pithy-name.github.io/sitemap.xml');
  });
});
