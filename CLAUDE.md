# pithy-name.github.io

Static personal site, served by GitHub Pages from `main`. No build step for the site itself: edit the HTML/CSS directly and it publishes as-is. The only tooling is the test suite below.

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

Playwright functional checks (`tests/`), no screenshot baselines. Tags: `@links` (internal links, sitemap entries, footer social links, in-page anchors), `@responsive` (no horizontal overflow at phone through desktop widths), `@console` (no console errors on load). Pages are auto-discovered from disk, so a new `work/*.html` is covered without editing tests.

```bash
npm ci && npx playwright install chromium   # first time
npx playwright test                          # serves the tree on :8099 and runs everything
```

`.github/workflows/ci.yml` runs the suite on every PR into `main`; `main` is protected and only changes via PR. See `tests/README.md`.

## Layout

- `index.html` — home page: hero, About, Experience, Selected Work (cards grouped by subhead), Writing, Contact. `404.html`.
- `work/` — one article page per Selected Work card, sharing the `article-hero` / `article` classes. Add the card on `index.html`, the page here, and the URL to `sitemap.xml` together.
- `style.css` — all styles, CSS custom properties at the top. `assets/components.js` — JS-rendered footer, contact buttons, Substack CTA; `SITE_LINKS` is the single place external profile URLs live. `assets/*.svg` — brand motifs.
- `robots.txt` allows all and points at the sitemap.
- `docs/` is gitignored: planning specs and anything stashed for review (`docs/_trash-review/`) live there, never published. Nothing is deleted from this repo; it is moved there and surfaced for the owner.
- `.claude/worktrees/` — one worktree per branch, git-excluded. Main checkout stays on `main`.

## Conventions

- One file per commit so changes can be cherry-picked. Amend until pushed; never after.
- No placeholder work cards on `index.html`: a card ships with its page or not at all.
- Employer, ERG, and vault identifiers never appear here; the owner's real name does.
