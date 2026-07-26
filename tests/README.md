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
| `@responsive` | No horizontal overflow at 375 / 480 / 540 / 768 / 1280 px; skip-link + hero nav present. |
| `@console` | No `console.error` or uncaught page error on load of any page. |

Pages are auto-discovered from disk (`tests/pages.ts`), so a new `work/*.html` is covered without editing tests.

## CI gate

`.github/workflows/ci.yml` runs this suite on every PR into `main`. `main` is a protected branch with **"Playwright (functional)" as a required status check** — so a broken link, layout overflow, or console error cannot merge to the published branch. Because the check only runs on PRs, `main` must be changed via PR, not direct push.

## Reproducing a CI failure

The workflow uploads a `playwright-report/` artifact on every run. Download it from the failed run, or reproduce locally with the same command: `npx playwright test`.
