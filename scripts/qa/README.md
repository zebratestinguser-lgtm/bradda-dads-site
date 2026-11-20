# Quality checks

Not part of the site build.

- **`check-links.mjs`**: after `npm run build`, run `node scripts/qa/check-links.mjs .` to list any internal links or images in `dist/` that point nowhere.
- **`layout-audit.html`**: layout and behaviour audit. Copy it into `public/` temporarily, set the `PAGES` list (every page URL under `/bradda-dads-site/`), start `npm run dev`, and open `/bradda-dads-site/layout-audit.html?w=360` (or another width; add `&nofn` to skip the functional tests). It loads each page in a frame of that width and reports:
  - anything that makes the page scroll sideways
  - elements sticking out of their parent or overlapping the next element
  - clipped text
  - words split across lines
  - news filter, results search, all-years search, homepage year tabs and photo viewer checks

  Headless: `msedge --headless=new --virtual-time-budget=1500000 --dump-dom "http://localhost:4321/bradda-dads-site/layout-audit.html?w=360"`. **Delete it from `public/` afterwards.**

Last full run (2026-11-20): 246 pages × 360/414/768/900/1100/1280px with no layout problems (only deliberate wraps of long URLs and hyphenated names); all functional checks passed.
