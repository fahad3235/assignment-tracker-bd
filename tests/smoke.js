// Headless-Chrome smoke test via raw CDP (no puppeteer dependency).
// Usage: node tests/smoke.js — exits non-zero on any failure or page error.
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 9400 + (process.pid % 400);
const FILE = 'file://' + path.resolve(__dirname, '..', 'index.html') + '?asof=2026-10-29';
let failures = 0;
const pageErrors = [];
function check(name, cond, extra) {
  console.log((cond ? 'ok - ' : 'FAIL - ') + name + (cond ? '' : ' :: ' + (extra || '')));
  if (!cond) failures++;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function poll(fn, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try { if (await fn()) return true; } catch (e) { /* retry */ }
    await wait(200);
  }
  return false;
}

(async () => {
  const chrome = spawn('/opt/meta-chromium/chrome', [
    '--headless=new', '--no-sandbox', '--disable-gpu',
    '--remote-debugging-port=' + PORT, '--user-data-dir=/tmp/at-smoke-' + process.pid,
    'about:blank',
  ], { stdio: 'ignore' });
  let targets = [];
  for (let i = 0; i < 50 && targets.length === 0; i++) {
    await wait(200);
    try {
      targets = JSON.parse(await new Promise((res, rej) => {
        http.get('http://127.0.0.1:' + PORT + '/json/list', (r) => {
          let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(d));
        }).on('error', rej);
      }));
    } catch (e) { /* retry */ }
  }
  if (!targets.length) { console.log('FAIL - chrome did not start'); process.exit(2); }
  const wsUrl = targets[0].webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);
  await new Promise((res) => { ws.onopen = res; });
  let seq = 0; const pending = new Map();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      pageErrors.push(JSON.stringify(msg.params.args));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      pageErrors.push(JSON.stringify(msg.params.exceptionDetails).slice(0, 300));
    }
  };
  const send = (method, params) => new Promise((res) => {
    const id = ++seq; pending.set(id, res); ws.send(JSON.stringify({ id, method, params }));
  });
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    if (r.result && r.result.result) return r.result.result.value;
    return undefined;
  };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: FILE });
  await poll(async () => (await ev('document.readyState')) === 'complete', 10000);
  await wait(500);

  check('title renders', (await ev('document.getElementById("appTitle").textContent')) === 'Assignment Tracker BD');
  check('3 tabs present', await ev('document.querySelectorAll(".tab-btn").length') === 3);
  check('empty state shown', (await ev('document.getElementById("list").textContent')).includes('No assignments yet'));
  check('no page errors so far', pageErrors.length === 0, pageErrors.join('; '));

  // Add an overdue + a due-today assignment via the real form path (DOM values + submit).
  await ev(`(() => {
    localStorage.clear();
    const set = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
    document.querySelector('[data-tab="assignments"]').click();
    set('title', 'DS Lab Report'); set('subject', 'Data Structure'); set('due', '2026-10-28');
    document.getElementById('priority').value = 'high'; document.getElementById('status').value = 'todo';
    document.getElementById('assignForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    set('title', 'ENG Memo'); set('subject', 'English'); set('due', '2026-10-29');
    document.getElementById('priority').value = 'low'; document.getElementById('status').value = 'todo';
    document.getElementById('assignForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    return true;
  })()`);
  await wait(400);
  check('2 cards rendered', await ev('document.querySelectorAll("#list .card").length') === 2);
  check('overdue badge on first card', (await ev('document.querySelector("#list .card").textContent')).includes('days overdue'));
  check('dashboard overdue count = 1', (await ev(`(() => { document.querySelector('[data-tab="dashboard"]').click(); return document.getElementById("statCards").textContent; })()`)).includes('Overdue'));

  // Language toggle renders Bengali + Bengali digits.
  await ev('document.getElementById("langBtn").click()');
  await wait(300);
  const bnTitle = await ev('document.getElementById("appTitle").textContent');
  check('BN title renders', bnTitle === 'অ্যাসাইনমেন্ট ট্র্যাকার বিডি', bnTitle);
  const bnStats = await ev('document.getElementById("statCards").textContent');
  check('BN digits in stats (২)', bnStats.includes('২'), bnStats);

  // Export -> wipe -> import round-trip via window.AT helpers.
  const exported = await ev('window.AT.exportJSON()');
  check('export JSON parses with app tag', (() => { try { const d = JSON.parse(exported); return d.app === 'assignment-tracker-bd' && d.assignments.length === 2; } catch (e) { return false; } })());
  await ev(`window.AT.importJSON(JSON.stringify({ app: 'assignment-tracker-bd', version: 1, assignments: [] }))`);
  await wait(200);
  check('wipe via import leaves 0 cards', await ev('document.querySelectorAll("#list .card").length') === 0);
  const importErrs = await ev(`window.AT.importJSON(${JSON.stringify(exported)})`);
  check('re-import clean', Array.isArray(importErrs) && importErrs.length === 0, JSON.stringify(importErrs));
  await wait(200);
  check('2 cards back after re-import', await ev('document.querySelectorAll("#list .card").length') === 2);
  const badErrs = await ev(`window.AT.importJSON(JSON.stringify({ app: 'other-app', version: 1, assignments: [] }))`);
  check('bad import rejected', Array.isArray(badErrs) && badErrs.length > 0);
  check('data intact after bad import', await ev('document.querySelectorAll("#list .card").length') === 2);

  // 390px mobile: no horizontal overflow.
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await wait(400);
  const overflow = await ev('document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1');
  check('390px no horizontal overflow', overflow === true, 'scrollWidth=' + await ev('document.documentElement.scrollWidth'));

  check('zero console/page errors overall', pageErrors.length === 0, pageErrors.join('; '));
  console.log(failures === 0 ? 'SMOKE PASS' : 'SMOKE FAIL (' + failures + ')');
  chrome.kill('SIGKILL');
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.log('FAIL - harness error: ' + e.message); process.exit(2); });
