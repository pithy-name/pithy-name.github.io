# Tests — functional CI safety net

Playwright functional checks for the static site. **No visual/screenshot baselines** — deliberate, since those churn on every intentional design change. These check behavior, not pixels.

## Run locally

```bash
npm ci
npx playwright install chromium   # first time only
export PATH="/opt/homebrew/opt/ruby@3.3/bin:$PATH"   # Ruby 3.3 for the Jekyll build; see CLAUDE.md for first-time setup
npx playwright test               # all tags
npx playwright test --grep @links # one tag
```

The config (`playwright.config.ts`) builds the site with `bundle exec jekyll build`, then starts a `python3 -m http.server` on port 8099 serving `_site/` and points the tests at it. The tests therefore check what GitHub Pages publishes, and `file://` quirks can't hide bugs.

## Tags

| Tag | What it guarantees |
|-----|--------------------|
| `@layout` | Every source page uses the shared layout (front matter, no hand-copied `<head>` or footer); the footer exists once in `_includes/footer.html` and is not re-rendered by script; each rendered page has exactly one footer; repo tooling (`CLAUDE.md`, package files, tests, scripts, Gemfile, `_config.yml`) is not published; site assets are. |
| `@links` | Every internal link resolves (no 404); the social links (LinkedIn/Substack/GitHub) are present in every page footer; in-page `#anchors` have targets; every `sitemap.xml` entry resolves. |
| `@links no-JS` | With JavaScript disabled, every page's footer still shows the LinkedIn, Substack, and GitHub links (the footer is static HTML from `_includes/footer.html`, not script-rendered). |
| `@links copyright notice` | Every page's footer shows the copyright notice and the ask-for-permission line, with JavaScript on and off. |
| `@robots` | `robots.txt` blocks AI training and bulk-scraping crawlers (a core set is asserted by name), leaves ordinary search engines and AI search/user-fetch bots (OAI-SearchBot, Claude-SearchBot, ChatGPT-User, Claude-User, PerplexityBot) allowed, allows everyone else, and still points at the sitemap. Advisory only: compliant crawlers honor it. |
| `@responsive` | No horizontal overflow at 375 / 480 / 540 / 768 / 1280 px, checked at the document level and per element (so content clipped inside `overflow: hidden` containers is still caught; `aria-hidden` decoration may bleed); skip-link + hero nav present. |
| `@console` | No `console.error` or uncaught page error on load of any page. |
| `@content` | No page mentions being under construction or shows the construction banner, in its HTML or in anything rendered by script. Guards against the wording coming back after the banner removal. |
| `@analytics` | Per page, three host cases: on the live domain the cookieless GoatCounter script loads with real paths; on any other non-loopback host (LAN staging) it loads with every path prefixed `/staging`; on loopback (local dev, CI) it never loads. Hosts are simulated by routing to the local files and the counter script is stubbed, so no test sends a real count. This proves the wiring, not that counts arrive: confirm that on staging and in the dashboard. |
| `@analytics outbound clicks` | Every link that leaves the site is tagged as a GoatCounter click event named `/outbound/<placement>/<site>` (placement: footer, contact, writing, card, article, page; site: a short name such as `linkedin`, never the URL), prefixed `/staging` off the live domain; internal links are not. Footer and contact clicks to the same destination are separate events. Hosts with several products get a product name (`google-slides`, not `google`). Each event also carries its exact destination URL in GoatCounter's referrer field, so two links with the same name on one page stay distinguishable. Clicking one runs GoatCounter's real script (vendored in `tests/fixtures/`) and sends exactly one event; all sends are captured, never delivered. If GoatCounter changes its script, refresh the fixture from `https://gc.zgo.at/count.js`. |
| `@analytics 404 labels` | Served like GitHub Pages (a missing path returns `404.html` with status 404 at the requested URL), a missing page is counted as `/404/<requested path>` (`/staging/404/...` on staging) and real pages are not relabelled. |
| `@analytics opt-out` | Loading any page with `#goatcounter-off` sets GoatCounter's own opt-out flag (`localStorage.skipgc = 't'`) for that origin and never clears it, so repeat loads stay opted out and no pageview is sent; without the hash, counting is untouched. GoatCounter's `#toggle-goatcounter` flips the same flag. |

Pages are auto-discovered from disk (`tests/pages.ts`), so a new `work/*.html` is covered without editing tests.

## CI gate

`.github/workflows/ci.yml` runs this suite on every PR into `main`. `main` is a protected branch with **"Playwright (functional)" as a required status check**, so a broken link, layout overflow, or console error cannot merge to the published branch. The check only runs on PRs, so `main` changes via PR, not direct push. (The required check is a branch-protection setting, not code: if it is ever removed, re-add it by that exact name.)

## Reproducing a CI failure

The workflow uploads the HTML report (`playwright-report/`) and any traces (`test-results/`) as one artifact on every run. Download it from the failed run, or reproduce locally with `npm test`.
