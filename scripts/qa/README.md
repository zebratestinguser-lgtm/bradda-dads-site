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

## Accessibility

Run against the built site (`npm run build && npx astro preview --port 4322`):

- **`a11y-audit.mjs`**: axe-core (WCAG 2.0/2.1/2.2 A and AA plus best practice) on one page of every type, at desktop and phone widths. Also checks heading order, a single h1, page titles, 24px tap targets (WCAG 2.2 2.5.8) and reflow at 320px (1.4.10). axe is loaded from cdnjs at test time. Writes `a11y-report.txt` to the current folder.
- **`keyboard-check.mjs`**: real key presses. Checks tab order and visible focus, the skip link, the carousel buttons, the phone menu (opens, focus moves in, closes on Esc or tabbing out), the photo viewer (opens, arrows, keeps focus inside, Esc returns focus), arrow-key results tabs, and that hidden things can't take focus.
- **`contrast.mjs`**: colour pairs against WCAG AA.
- **`cdp-check.mjs`**: helper. Opens a page in headless Edge/Chrome, waits in real time, and evaluates an expression.

Last full run (2026-11-20, after fixes): axe found 0 issues on 24 pages × 2 widths, reflow at 320px passed, all keyboard checks passed, and all colour pairs met AA.

## Speed

- **`speed-check.mjs`**: Lighthouse-style phone test without Lighthouse. Headless Edge as a phone on slow 4G with a 4× slower CPU and an empty cache. Reports FCP, LCP, layout shift (CLS), blocking time (TBT), bytes and requests for the main pages (`PAGES=/,/news/` to choose; in Git Bash add `MSYS_NO_PATHCONV=1`). Run it against the built site (`npm run build && npx astro preview`).

Last run (2026-11-26): every page had LCP under 2.1s, CLS ≤ 0.02 and 104–548KB. TBT was 0–170ms except the homepage (~300ms) and Wolf's Pit (140–285ms). Tracing showed that time is the browser's first layout. A blank page costs 58ms of it in this headless Windows browser, and removing fonts or SVGs barely changed it, so it is mostly the test setup, not the site.
