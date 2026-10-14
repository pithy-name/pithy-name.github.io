# Tests — functional CI safety net

Playwright functional checks for the static site. **No visual/screenshot baselines** — deliberate, since those churn on every intentional design change. These check behavior, not pixels.

## Run locally

```bash
npm ci
npx playwright install chromium   # first time only
npx playwright test               # all tags
npx playwright test --grep @links # one tag
```

The config (`playwright.config.ts`) starts a `python3 -m http.server` on port 8099 and points the tests at it, so `file://` quirks can't hide bugs.

## Tags

| Tag | What it guarantees |
|-----|--------------------|
| `@links` | Every internal link resolves (no 404); the JS-injected social links (LinkedIn/Substack/GitHub) are present in every page footer; in-page `#anchors` have targets; every `sitemap.xml` entry resolves. |
| `@responsive` | No horizontal overflow at 375 / 480 / 540 / 768 / 1280 px, checked at the document level and per element (so content clipped inside `overflow: hidden` containers is still caught; `aria-hidden` decoration may bleed); skip-link + hero nav present. |
| `@console` | No `console.error` or uncaught page error on load of any page. |
| `@analytics` | Per page, three host cases: on the live domain the cookieless GoatCounter script loads with real paths; on any other non-loopback host (LAN staging) it loads with every path prefixed `/staging`; on loopback (local dev, CI) it never loads. Hosts are simulated by routing to the local files and the counter script is stubbed, so no test sends a real count. This proves the wiring, not that counts arrive: confirm that on staging and in the dashboard. |
| `@analytics outbound clicks` | Every link that leaves the site is tagged as a GoatCounter click event named `/outbound/<placement>/<site>` (placement: footer, contact, writing, card, article, page; site: a short name such as `linkedin`, never the URL), prefixed `/staging` off the live domain; internal links are not. Footer and contact clicks to the same destination are separate events. Hosts with several products get a product name (`google-slides`, not `google`). Each event also carries its exact destination URL in GoatCounter's referrer field, so two links with the same name on one page stay distinguishable. Clicking one runs GoatCounter's real script (vendored in `tests/fixtures/`) and sends exactly one event; all sends are captured, never delivered. If GoatCounter changes its script, refresh the fixture from `https://gc.zgo.at/count.js`. |

Pages are auto-discovered from disk (`tests/pages.ts`), so a new `work/*.html` is covered without editing tests.

## CI gate

`.github/workflows/ci.yml` runs this suite on every PR into `main`. `main` is a protected branch with **"Playwright (functional)" as a required status check**, so a broken link, layout overflow, or console error cannot merge to the published branch. The check only runs on PRs, so `main` changes via PR, not direct push. (The required check is a branch-protection setting, not code: if it is ever removed, re-add it by that exact name.)

## Reproducing a CI failure

The workflow uploads the HTML report (`playwright-report/`) and any traces (`test-results/`) as one artifact on every run. Download it from the failed run, or reproduce locally with `npm test`.
