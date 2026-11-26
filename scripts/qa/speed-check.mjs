// Phone speed check without Lighthouse: loads pages in headless Edge as a phone on a slow 4G connection
// with a 4x slower CPU (roughly Lighthouse's mobile settings), cold cache, and reports
// FCP, LCP, layout shift (CLS), long-task blocking time (TBT), bytes downloaded and request count.
// Usage (after npm run build && npx astro preview):
//   node scripts/qa/speed-check.mjs [baseUrl]      default http://localhost:4321/bradda-dads-site
// Targets (Lighthouse "good"): LCP ≤ 2.5s, CLS ≤ 0.1, TBT ≤ 200ms. Local server, so real-world numbers add network latency.
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = (process.argv[2] ?? 'http://localhost:4321/bradda-dads-site').replace(/\/$/, '');
const PAGES = process.env.PAGES?.split(',') ?? [
  '/', '/events/', '/events/duck-race/', '/news/', '/news/2026-10-03-fb-the-bradda-dads-community-christmas-card-is-back/',
  '/photos/', '/photos/2016-09-08-fb-lots-and-lots-of-photos-before-the-race-during-the-race-at/', '/wolfspit/', '/our-story/',
  '/where-the-money-goes/', '/donate/', '/contact/', '/game/',
];
const browser = process.env.BROWSER ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function measure(path) {
  const port = 9300 + Math.floor(Math.random() * 500);
  const proc = spawn(browser, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'spd-'))}`, 'about:blank'], { stdio: 'ignore' });
  try {
    let pages;
    for (let i = 0; i < 40 && !pages; i++) { try { pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { await sleep(250); } }
    const ws = new WebSocket(pages.find((p) => p.type === 'page').webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r, { once: true }));
    let id = 0, bytes = 0, requests = 0, biggest = [];
    const send = (method, params = {}) => new Promise((resolve) => {
      const my = ++id;
      const on = (ev) => { const m = JSON.parse(ev.data); if (m.id === my) { ws.removeEventListener('message', on); resolve(m.result); } };
      ws.addEventListener('message', on);
      ws.send(JSON.stringify({ id: my, method, params }));
    });
    const urls = new Map();
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      if (m.method === 'Network.requestWillBeSent') urls.set(m.params.requestId, m.params.request.url);
      if (m.method === 'Network.loadingFinished') { requests++; bytes += m.params.encodedDataLength; biggest.push([m.params.encodedDataLength, urls.get(m.params.requestId)]); }
    });
    await send('Network.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });
    // Slow 4G as Lighthouse uses it: 150ms RTT, 1.6 Mbps down, 750 Kbps up
    await send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 });
    await send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await send('Emulation.setDeviceMetricsOverride', { width: 412, height: 823, deviceScaleFactor: 2.625, mobile: true });
    await send('Page.enable');
    await send('Page.addScriptToEvaluateOnNewDocument', { source: `
      window.__m = { lcp: 0, cls: 0, tbt: 0 };
      new PerformanceObserver((l) => { for (const e of l.getEntries()) __m.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) __m.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) __m.tbt += Math.max(0, e.duration - 50); }).observe({ type: 'longtask', buffered: true });` });
    await send('Page.navigate', { url: BASE + path });
    await sleep(12000);
    const r = await send('Runtime.evaluate', { returnByValue: true, expression: `JSON.stringify({ ...__m, fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0 })` });
    ws.close();
    const v = JSON.parse(r.result.value);
    biggest.sort((a, b) => b[0] - a[0]);
    return { ...v, bytes, requests, top: biggest.slice(0, 3).map(([b, u]) => `${Math.round(b / 1024)}KB ${String(u).replace(BASE, '').slice(0, 70)}`) };
  } finally { proc.kill(); }
}

const s = (ms) => (ms / 1000).toFixed(1) + 's';
let bad = 0;
for (const p of PAGES) {
  const m = await measure(p);
  const flags = [m.lcp > 2500 && 'LCP', m.cls > 0.1 && 'CLS', m.tbt > 200 && 'TBT'].filter(Boolean);
  if (flags.length) bad++;
  console.log(`${flags.length ? 'SLOW' : 'ok  '}  ${p}\n      FCP ${s(m.fcp)}  LCP ${s(m.lcp)}  CLS ${m.cls.toFixed(3)}  TBT ${Math.round(m.tbt)}ms  ${Math.round(m.bytes / 1024)}KB in ${m.requests} requests${flags.length ? '  ← ' + flags.join(', ') : ''}\n      biggest: ${m.top.join(' | ')}`);
}
console.log(bad ? `\n${bad} page(s) outside the targets.` : '\nAll pages within the targets (LCP ≤ 2.5s, CLS ≤ 0.1, TBT ≤ 200ms).');
