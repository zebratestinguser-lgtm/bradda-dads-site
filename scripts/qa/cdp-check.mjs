// Drive a real (headless) Edge/Chrome via the DevTools protocol, wait in real time, and read values off a page.
// Usage: node scripts/qa/cdp-check.mjs <url> "<js expression returning a string>" [waitMs]
// Example: node scripts/qa/cdp-check.mjs "http://localhost:4322/bradda-dads-site/search/?q=bonfire" "document.querySelectorAll('.pagefind-ui__result').length + ''" 8000
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [target, expr, waitMs = '8000'] = process.argv.slice(2);
const browser = process.env.BROWSER ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const proc = spawn(browser, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cdp-'))}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  let pages;
  for (let i = 0; i < 40 && !pages; i++) {
    try { pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { await sleep(250); }
  }
  const page = pages.find((p) => p.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0;
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const my = ++id;
      const onMsg = (ev) => { const m = JSON.parse(ev.data); if (m.id === my) { ws.removeEventListener('message', onMsg); resolve(m.result); } };
      ws.addEventListener('message', onMsg);
      ws.send(JSON.stringify({ id: my, method, params }));
    });
  await send('Page.enable');
  await send('Page.navigate', { url: target });
  await sleep(Number(waitMs));
  const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  console.log(res?.result?.value ?? JSON.stringify(res));
  ws.close();
} finally {
  proc.kill();
}
