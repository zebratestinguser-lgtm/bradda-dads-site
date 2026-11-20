# Migration scripts (old Blogspot + WordPress sites)

One-off tools used in November 2026 to bring the old sites' content into this repo. Kept for reference and in case anything needs re-running. They are not part of the website build.

1. Download the feeds into an empty folder outside the repo:
   - `https://braddadads.blogspot.com/feeds/posts/default?alt=json&max-results=500` → `blogspot-posts.json`
   - `https://braddadads.blogspot.com/feeds/pages/default?alt=json&max-results=100` → `blogspot-pages.json`
   - `https://public-api.wordpress.com/rest/v1.1/sites/braddadads.wordpress.com/posts/?number=100&type=post` → `wp-posts.json`
   - same with `type=page` → `wp-pages.json`
2. `node inventory.mjs <data-dir>`: lists every post and page.
3. `node import-legacy.mjs <data-dir> <repo-dir> [--no-images]`: writes `src/content/news/*`, `src/content/albums/*` and downloads photos (1200px) to `public/uploads/albums/`. **This overwrites files with the same name**, so don't re-run it over edited content without checking first.
4. Results PDFs: `pdf2cells.mjs` (needs `npm install pdfjs-dist` in a separate folder) extracts text with positions, and `results2csv.mjs` turns it into `position,name,club,category,time` CSVs. Each year's PDF layout is handled separately in that script.
5. `node privacy-scan.mjs <data-dir>/import-manifest.json <repo-dir>`: lists posts with contact details, named individuals or children, for review (see `TODO-content.md`).
