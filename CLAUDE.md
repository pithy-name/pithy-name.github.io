# pithy-name.github.io

Personal site, served by GitHub Pages from `main`, which builds it with Jekyll. Shared markup (`<head>`, skip link, footer, script tags) lives once in `_layouts/` and `_includes/`; each page is HTML with front matter that supplies its title and meta. Edit the footer in `_includes/footer.html` only. The `Gemfile` pins the same `github-pages` gem Pages builds with, so a local build matches the deployed site.

## Build setup (Ruby 3.3, matching GitHub Pages)

```bash
brew install ruby@3.3                              # keg-only; first time
export PATH="/opt/homebrew/opt/ruby@3.3/bin:$PATH"
bundle config set --local path vendor/bundle && bundle install   # first time
bundle exec jekyll build                           # writes _site/ (gitignored)
```

## Fresh-clone setup (required before any push)

This repo is PUBLIC and the global name-guard hook is a false positive here (the site publishes the owner's name on purpose). A repo-local guard replaces it and fails closed:

```bash
cp scripts/hooks/pre-push .git/hooks/pre-push
git config --local core.hooksPath "$(git rev-parse --absolute-git-dir)/hooks"
printf 'pattern-one\npattern-two\n' > .git/name-guard-tokens.txt   # private token list, one per line, never tracked
```

The hook is copied into the shared git directory, not referenced in place: a relative hooks path resolves per checkout, so a worktree on a branch without the file would push unguarded. Re-copy after any change to `scripts/hooks/pre-push`.

Without the token file, every push is refused. The hook scans added lines, commit messages, and file paths for home-directory paths plus every token in that file, case-insensitively. See `scripts/hooks/pre-push`. The private token list is maintained outside this repo; copy it in rather than retyping it.

## Tests and CI

Playwright functional checks (`tests/`), no screenshot baselines. Tags: `@links` (internal links, sitemap entries, footer social links, in-page anchors), `@layout` (shared layout is the single source; repo tooling is not published), `@responsive` (no horizontal overflow at phone through desktop widths), `@console` (no console errors on load). Pages are auto-discovered from disk, so a new `work/*.html` is covered without editing tests. Tests run against the built `_site/`, which is what gets published.

```bash
npm ci && npx playwright install chromium   # first time
npx playwright test                          # builds with Jekyll, serves _site/ on :8099, runs everything
```

`.github/workflows/ci.yml` runs the suite on every PR into `main`; `main` is protected and only changes via PR. See `tests/README.md`.

## Layout

- `_config.yml` — Jekyll config; its `exclude:` keeps repo tooling (tests, scripts, `CLAUDE.md`, package files) out of the published site. `_layouts/default.html` — the page shell. `_includes/footer.html` — the one footer. `_data/links.yml` — the one place external profile URLs live (footer and `SITE_LINKS`).
- `index.html` — home page: hero, About, Experience, Selected Work (cards grouped by subhead), Writing, Contact. `404.html`. Both start with front matter (`layout: default`, `title`, and for indexed pages `description` plus optional `og_title` / `og_description` / `og_type`).
- `work/` — one article page per Selected Work card, sharing the `article-hero` / `article` classes. Add the card on `index.html`, the page here (with front matter), and the URL to `sitemap.xml` together. Use root-absolute paths in layouts; page bodies keep their relative links.
- `style.css` — all styles, CSS custom properties at the top. `assets/components.js` — contact buttons, Substack CTA, analytics; Jekyll fills `SITE_LINKS` from `_data/links.yml`. `assets/*.svg` — brand motifs.
- `robots.txt` allows ordinary search engines and AI search/user fetchers, blocks AI training and bulk-scraping crawlers (list derived from the open-source ai.robots.txt project), and points at the sitemap. Tested by `tests/robots.spec.ts`.
- `docs/` is gitignored: planning specs and anything stashed for review (`docs/_trash-review/`) live there, never published. Nothing is deleted from this repo; it is moved there and surfaced for the owner.
- `.claude/worktrees/` — one worktree per branch, git-excluded. Main checkout stays on `main`.

## Conventions

- One file per commit so changes can be cherry-picked. Amend until pushed; never after.
- No placeholder work cards on `index.html`: a card ships with its page or not at all.
- Employer, ERG, and vault identifiers never appear here; the owner's real name does.
