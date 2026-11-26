// Keyboard-only checks with real key events (DevTools protocol): tab order, visible focus, skip link,
// phone menu, carousel buttons, photo viewer, and that nothing hidden takes focus.
//   node scripts/qa/keyboard-check.mjs [baseUrl]    (default http://localhost:4321/bradda-dads-site)
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = process.argv[2] ?? 'http://localhost:4321/bradda-dads-site';
const browser = process.env.BROWSER ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9700 + Math.floor(Math.random() * 90);
const proc = spawn(browser, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'kbd-'))}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
const out = [];
try {
  let targets;
  for (let i = 0; i < 40 && !targets; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { await sleep(250); } }
  ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0;
  const send = (method, params = {}) => new Promise((resolve) => {
    const my = ++id;
    const on = (ev) => { const m = JSON.parse(ev.data); if (m.id === my) { ws.removeEventListener('message', on); resolve(m.result); } };
    ws.addEventListener('message', on);
    ws.send(JSON.stringify({ id: my, method, params }));
  });
  const js = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }))?.result?.value;
  const key = async (k, shift = false) => {
    const codes = { Tab: 9, Enter: 13, Escape: 27, ArrowRight: 39, ArrowLeft: 37, ' ': 32 };
    const base = { key: k, code: k === ' ' ? 'Space' : k, windowsVirtualKeyCode: codes[k], modifiers: shift ? 8 : 0 };
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...base });
    if (k === 'Enter' || k === ' ') await send('Input.dispatchKeyEvent', { type: 'char', text: k === 'Enter' ? '\r' : ' ', ...base });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
    await sleep(120);
  };
  // What has focus, and is the focus indicator visible?
  const focused = () => js(`(() => { const e = document.activeElement; if (!e || e === document.body) return 'BODY';
    const cs = getComputedStyle(e); const visible = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none';
    const r = e.getBoundingClientRect(); const onScreen = r.width > 0 && r.height > 0;
    return (e.getAttribute('aria-label') || e.textContent || e.value || e.tagName).trim().replace(/\\s+/g,' ').slice(0, 34) + (visible ? '' : ' [NO VISIBLE FOCUS]') + (onScreen ? '' : ' [OFF-SCREEN/HIDDEN]'); })()`);
  const load = async (path, w = 1280, h = 900, mobile = false) => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
    await send('Page.navigate', { url: BASE + path });
    await sleep(1500);
  };
  await send('Page.enable');

  // 1. Desktop homepage: first 14 tab stops
  await load('/');
  const stops = [];
  for (let i = 0; i < 14; i++) { await key('Tab'); stops.push(await focused()); }
  out.push('Homepage tab order (desktop): ' + stops.join(' → '));
  // Skip link moves focus past the header
  await load('/');
  await key('Tab'); const first = await focused();
  await key('Enter'); await key('Tab'); const afterSkip = await focused();
  out.push(`Skip link: first stop "${first}", after using it the next stop is "${afterSkip}"`);

  // 2. Carousel: tab to the Next button and press it
  await load('/');
  let found = false;
  for (let i = 0; i < 40 && !found; i++) { await key('Tab'); found = (await focused()).startsWith('Next events'); }
  if (found) {
    const before = await js(`document.querySelector('[data-strip]').scrollLeft`);
    await key('Enter'); await sleep(700);
    const after = await js(`document.querySelector('[data-strip]').scrollLeft`);
    out.push(`Carousel: "Next events" reached by Tab and moves the strip (${Math.round(before)} → ${Math.round(after)})`);
  } else out.push('Carousel: could not reach the Next button by Tab  ✗');

  // 3. Phone menu by keyboard
  await load('/news/', 390, 844, true);
  let menu = false;
  for (let i = 0; i < 6 && !menu; i++) { await key('Tab'); menu = (await focused()).startsWith('Menu'); }
  await key('Enter');
  const expanded = await js(`document.querySelector('[data-menu-btn]').getAttribute('aria-expanded')`);
  const inMenu = await focused();
  const menuStops = [];
  for (let i = 0; i < 8; i++) { await key('Tab'); menuStops.push(await focused()); }
  await key('Escape');
  const afterEsc = await focused();
  const closed = await js(`document.querySelector('[data-menu-btn]').getAttribute('aria-expanded')`);
  out.push(`Phone menu: reached=${menu}, opens (aria-expanded=${expanded}), focus moves to "${inMenu}", then ${menuStops.join(' → ')}; Esc closes (${closed}) and returns to "${afterEsc}"`);

  // 4. Photo viewer by keyboard
  await load('/photos/category/bonfire/');
  let photo = false;
  for (let i = 0; i < 60 && !photo; i++) { await key('Tab'); photo = (await focused()).startsWith('Open photo'); }
  const opener = await focused();
  await key('Enter');
  const open = await js(`document.querySelector('[data-lightbox]').open`);
  const inDialog = await focused();
  await key('ArrowRight');
  const cap = await js(`document.querySelector('[data-lb-text]').textContent`);
  // Focus must stay inside the dialog
  const trap = [];
  for (let i = 0; i < 5; i++) { await key('Tab'); trap.push(await js(`!!document.activeElement.closest('[data-lightbox]')`)); }
  await key('Escape');
  const back = await focused();
  out.push(`Photo viewer: "${opener}" opens it (${open}), focus on "${inDialog}", → shows "${cap}", focus stays inside while open (${trap.every(Boolean)}), Esc returns focus to "${back}"`);

  // 5. Results tabs on the Wolf's Pit page (arrow keys)
  await load('/wolfspit/');
  const tabs = await js(`(() => { const t = document.querySelector('[role=tab][aria-selected=true]'); t.focus(); return t.textContent.trim(); })()`);
  await key('ArrowRight');
  const nowTab = await js(`document.activeElement.textContent.trim() + ' selected=' + document.activeElement.getAttribute('aria-selected')`);
  out.push(`Results tabs: from "${tabs}", → moves to ${nowTab}`);

  // 6. Hidden things must not take focus (closed menu on phone, collapsed photos, hidden news rows)
  await load('/photos/category/carnival/', 390, 844, true);
  const hiddenFocusable = await js(`[...document.querySelectorAll('a,button,input,select,[tabindex]')].filter(e => e.closest('[hidden]') && e.tabIndex >= 0 && getComputedStyle(e).display !== 'none' && e.offsetParent !== null).length`);
  out.push(`Hidden-but-focusable elements on a collapsed category page: ${hiddenFocusable}`);

  console.log(out.join('\n\n'));
} finally {
  ws?.close();
  proc.kill();
}
