// Weekly health check (run by .github/workflows/health-check.yml, or by hand: node scripts/qa/health-check.mjs).
// 1. The live site's main pages answer.  2. The payment and entry links the site points to still work
// (SumUp store and products, event buttons, supporters' websites). Exits with an error if anything fails,
// which makes GitHub email the repository owner.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const LIVE = process.env.SITE_URL ?? 'https://zebratestinguser-lgtm.github.io/bradda-dads-site';
const PAGES = ['/', '/events/', '/events/duck-race/', '/news/', '/photos/', '/wolfspit/', '/donate/', '/contact/', '/search/', '/events.ics', '/sitemap-index.xml'];

// External links worth watching: every https link in the settings, events and supporters
// (Facebook is skipped: it refuses automated checks even when the page is fine).
const files = ['src/data/site.yaml', ...['events', 'supporters'].flatMap((d) => readdirSync(join('src/content', d)).map((f) => join('src/content', d, f)))];
const external = new Set();
for (const f of files) for (const m of readFileSync(f, 'utf8').matchAll(/https:\/\/[^\s"')\]]+/g)) if (!/facebook\.com|formspree\.io\/f\/$/.test(m[0])) external.add(m[0]);

async function check(u) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const r = await fetch(u, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (site health check)' }, signal: AbortSignal.timeout(20000) });
      if (r.status < 400) return null;
      // Shops like SumUp block automated visitors (401/403/429) even when the page is fine: can't tell, so only warn
      if ([401, 403, 429].includes(r.status)) return { warn: `couldn't check (HTTP ${r.status}, blocks automated visits)` };
      if (attempt === 2) return `HTTP ${r.status}`;
    } catch (e) {
      if (attempt === 2) return e.name === 'TimeoutError' ? 'timed out' : e.message;
    }
    await new Promise((res) => setTimeout(res, 3000));
  }
}

const problems = [];
const warnings = [];
const report = (label, err) => {
  if (err?.warn) {
    console.log(`warn ${label} (${err.warn})`);
    warnings.push(`${label}: ${err.warn}`);
  } else {
    console.log(`${err ? 'FAIL' : 'ok  '} ${label}${err ? ` (${err})` : ''}`);
    if (err) problems.push(`${label}: ${err}`);
  }
};
for (const p of PAGES) {
  report(`live ${LIVE}${p}`, await check(LIVE + p));
}
for (const u of external) {
  report(u, await check(u));
}
if (problems.length) {
  console.log(`\n${problems.length} problem(s):\n- ${problems.join('\n- ')}`);
  process.exitCode = 1;
} else console.log('\nAll checks passed.');
