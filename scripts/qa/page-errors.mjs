// Loads one page of every type in headless Edge/Chrome at phone width and reports script errors, console
// errors, failed requests (404s etc. on this site), broken images and anything that makes the page scroll
// sideways. Run against the built site: npm run build && npx astro preview --port 4322, then
//   node scripts/qa/page-errors.mjs [baseUrl]   (default http://localhost:4322/bradda-dads-site)
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = (process.argv[2] ?? 'http://localhost:4322/bradda-dads-site').replace(/\/$/, '');
const PAGES = [
  '/', '/events/', '/events/duck-race/', '/events/pensioners-lunch/', '/events/bonfire/', '/events/christmas-card/', '/events/wolfspit/',
  '/events/duck-race/winners/', '/news/', '/news/2026-11-20-thank-you-for-a-fantastic-bonfire/', '/news/2009-12-27-boxing-day-2009-duck-race/',
  '/photos/', '/photos/category/carnival/', '/photos/2009-12-27-boxing-day-2009-duck-race/', '/wolfspit/', '/wolfspit/2009/', '/wolfspit/2026/',
  '/tour-of-bradwell/', '/tour-of-bradwell/2019/', '/races/', '/our-story/', '/members/', '/where-the-money-goes/', '/get-involved/', '/donate/',
  '/contact/', '/privacy/', '/accessibility/', '/search/?q=bonfire', '/game/', '/christmas-card/', '/supporters/', '/this-page-does-not-exist/',
];
const browser = process.env.BROWSER ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const proc = spawn(browser, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cdp-'))}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let problems = 0;
try {
  let targets;
  for (let i = 0; i < 40 && !targets; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { await sleep(250); }
  }
  const ws = new WebSocket(targets.find((p) => p.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0;
  const listeners = [];
  ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.method) listeners.forEach((l) => l(m)); });
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const my = ++id;
      const onMsg = (ev) => { const m = JSON.parse(ev.data); if (m.id === my) { ws.removeEventListener('message', onMsg); resolve(m.result); } };
      ws.addEventListener('message', onMsg);
      ws.send(JSON.stringify({ id: my, method, params }));
    });
  for (const d of ['Page', 'Runtime', 'Log', 'Network']) await send(`${d}.enable`);
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });

  let found = [];
  listeners.push((m) => {
    if (m.method === 'Runtime.exceptionThrown') found.push(`script error: ${m.params.exceptionDetails.exception?.description?.split('\n')[0] ?? m.params.exceptionDetails.text}`);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') found.push(`console error: ${m.params.args.map((a) => a.value ?? a.description).join(' ')}`);
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/404 \(Not Found\)/.test(m.params.entry.text)) found.push(`browser: ${m.params.entry.text.slice(0, 160)}`);
    if (m.method === 'Network.responseReceived' && m.params.response.status >= 400 && m.params.response.url.startsWith(BASE) && m.params.type !== 'Document') found.push(`HTTP ${m.params.response.status}: ${m.params.response.url.replace(BASE, '')}`);
    if (m.method === 'Network.loadingFailed' && !m.params.canceled && m.params.errorText !== 'net::ERR_ABORTED') found.push(`failed: ${m.params.errorText}`);
  });

  for (const p of PAGES) {
    found = [];
    await send('Page.navigate', { url: BASE + p });
    await sleep(2500);
    const r = await send('Runtime.evaluate', {
      returnByValue: true,
      expression: `(() => {
        window.scrollTo(0, document.body.scrollHeight); // let lazy images load
        return new Promise((res) => setTimeout(() => {
          const broken = [...document.images].filter((i) => i.getAttribute('src') && i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src);
          const wide = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
          res({ broken, wide, title: document.title });
        }, 1500));
      })()`,
      awaitPromise: true,
    });
    const v = r.result.value ?? {};
    for (const b of v.broken ?? []) found.push(`broken image: ${b.replace(BASE, '')}`);
    if (v.wide) found.push('page scrolls sideways at 390px');
    console.log(`${found.length ? 'PROBLEM' : 'ok     '} ${p}  (${v.title})`);
    for (const f of [...new Set(found)]) console.log(`          - ${f}`);
    problems += found.length;
  }
  ws.close();
} finally {
  proc.kill();
}
console.log(problems ? `\n${problems} problem(s) found.` : '\nNo problems found.');
process.exitCode = problems ? 1 : 0;
