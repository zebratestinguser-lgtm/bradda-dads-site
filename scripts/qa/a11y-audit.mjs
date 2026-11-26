// Accessibility audit: runs axe-core (WCAG 2.0/2.1/2.2 A + AA, plus best practice) in headless Edge/Chrome on
// one example of every page type, at desktop and phone widths, plus extra checks axe doesn't cover:
// heading order, one h1, page title, tap-target size (WCAG 2.2 2.5.8: at least 24×24px) and reflow at 320px.
//
//   npm run build && npx astro preview --port 4322     (search only works on the built site)
//   node scripts/qa/a11y-audit.mjs [baseUrl]            default http://localhost:4321/bradda-dads-site
//
// axe-core is loaded from cdnjs at test time (not a project dependency).
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.argv[2] ?? 'http://localhost:4321/bradda-dads-site';
const AXE = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js';
const PAGES = [
  '/', '/events/', '/events/duck-race/', '/events/duck-race/winners/', '/wolfspit/2009/', '/news/', '/news/2007-12-12-7th-annual-bradda-dads-christmas-lunch/',
  '/photos/', '/photos/2007-12-12-7th-annual-bradda-dads-christmas-lunch/', '/photos/category/bonfire/',
  '/races/', '/wolfspit/', '/wolfspit/2026/', '/tour-of-bradwell/', '/tour-of-bradwell/long-tour-2017/',
  '/our-story/', '/where-the-money-goes/', '/get-involved/', '/donate/', '/contact/', '/privacy/',
  '/christmas-card/', '/members/', '/accessibility/', '/game/', '/search/?q=bonfire', '/this-page-does-not-exist/',
];
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 900, mobile: false },
  { name: 'phone', width: 390, height: 844, mobile: true },
];

const browser = process.env.BROWSER ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9800 + Math.floor(Math.random() * 100);
const proc = spawn(browser, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'a11y-'))}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const axeSource = await (await fetch(AXE)).text();

// Extra checks run in the page
const EXTRA = `(() => {
  const issues = [];
  const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter((h) => h.offsetParent !== null || h.closest('.visually-hidden'));
  const h1s = hs.filter((h) => h.tagName === 'H1');
  if (h1s.length !== 1) issues.push('headings: ' + h1s.length + ' h1 elements (should be exactly 1)');
  let prev = 0;
  for (const h of hs) { const l = +h.tagName[1]; if (prev && l > prev + 1) issues.push('headings: skips from h' + prev + ' to h' + l + ' at "' + h.textContent.trim().slice(0, 40) + '"'); prev = l; }
  if (!document.title || document.title.length < 5) issues.push('title: missing or too short');
  // Target size (WCAG 2.2 2.5.8 AA): interactive targets at least 24x24 unless inline in text
  const small = [];
  for (const el of document.querySelectorAll('a[href], button, input, select, summary, [role=tab]')) {
    if (el.closest('.leaflet-container, .visually-hidden, [hidden]') || el.offsetParent === null) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const inline = el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.closest('p, li, td, dd, figcaption, .prose');
    if (!inline && (r.width < 24 || r.height < 24)) small.push(el.tagName.toLowerCase() + ' "' + (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30) + '" ' + Math.round(r.width) + 'x' + Math.round(r.height));
  }
  if (small.length) issues.push('target size < 24px: ' + small.slice(0, 6).join('; ') + (small.length > 6 ? ' (+' + (small.length - 6) + ' more)' : ''));
  if (!document.querySelector('a.skip-link[href="#main"]') || !document.getElementById('main')) issues.push('skip link or #main missing');
  if (document.documentElement.lang !== 'en-GB') issues.push('lang is ' + document.documentElement.lang);
  return issues;
})()`;

let pageWs;
try {
  let targets;
  for (let i = 0; i < 40 && !targets; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { await sleep(250); }
  }
  pageWs = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => pageWs.addEventListener('open', r, { once: true }));
  let id = 0;
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const my = ++id;
      const onMsg = (ev) => { const m = JSON.parse(ev.data); if (m.id === my) { pageWs.removeEventListener('message', onMsg); resolve(m.result); } };
      pageWs.addEventListener('message', onMsg);
      pageWs.send(JSON.stringify({ id: my, method, params }));
    });
  const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }))?.result?.value;
  await send('Page.enable');

  const report = [];
  const byRule = new Map();
  for (const vp of [...VIEWPORTS, { name: 'reflow-320', width: 320, height: 640, mobile: true }]) {
    await send('Emulation.setDeviceMetricsOverride', { width: vp.width, height: vp.height, deviceScaleFactor: 1, mobile: vp.mobile });
    const pages = vp.name === 'reflow-320' ? PAGES.slice(0, 12) : PAGES;
    for (const path of pages) {
      await send('Page.navigate', { url: BASE + path });
      await sleep(path.startsWith('/search') ? 4000 : 1500);
      if (vp.name === 'reflow-320') {
        const overflow = await evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth');
        if (overflow > 1) report.push({ vp: vp.name, path, rule: 'reflow', impact: 'serious', help: `Page scrolls sideways by ${overflow}px at 320px (WCAG 1.4.10)`, nodes: [] });
        continue;
      }
      await evaluate(axeSource + '; true');
      const res = await evaluate(`axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice'] }, resultTypes: ['violations'] }).then(r => r.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 4).map(n => (n.target.join(' ') + ' :: ' + (n.failureSummary || '').split('\\n').slice(1, 2).join(' ')).slice(0, 220)), count: v.nodes.length })))`);
      for (const v of res ?? []) {
        report.push({ vp: vp.name, path, rule: v.id, impact: v.impact, help: v.help, nodes: v.nodes, count: v.count });
      }
      for (const issue of (await evaluate(EXTRA)) ?? []) report.push({ vp: vp.name, path, rule: 'extra:' + issue.split(':')[0], impact: 'moderate', help: issue, nodes: [] });
    }
  }
  for (const r of report) {
    const k = r.rule;
    if (!byRule.has(k)) byRule.set(k, { impact: r.impact, help: r.help, pages: new Set(), examples: [] });
    const g = byRule.get(k);
    g.pages.add(`${r.path} (${r.vp})`);
    if (g.examples.length < 3) g.examples.push(...r.nodes.slice(0, 2).map((n) => `${r.path} ${r.vp}: ${n}`), ...(r.rule.startsWith('extra') || r.rule === 'reflow' ? [`${r.path} ${r.vp}: ${r.help}`] : []));
  }
  const order = { critical: 0, serious: 1, moderate: 2, minor: 3 };
  const lines = [`Accessibility audit: ${PAGES.length} pages × ${VIEWPORTS.length} widths + reflow at 320px. ${byRule.size} distinct issue types.`];
  for (const [rule, g] of [...byRule].sort((a, b) => (order[a[1].impact] ?? 9) - (order[b[1].impact] ?? 9))) {
    lines.push(`\n[${g.impact}] ${rule}: ${g.help}\n  on ${g.pages.size} page/width combos, e.g. ${[...g.pages].slice(0, 4).join(', ')}`);
    g.examples.slice(0, 3).forEach((e) => lines.push('   - ' + e));
  }
  const text = lines.join('\n');
  console.log(text);
  writeFileSync(join(process.cwd(), 'a11y-report.txt'), text);
} finally {
  pageWs?.close();
  proc.kill();
}
