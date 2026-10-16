// Smoke-Test von Aufwind Ã¼ber Chrome DevTools Protocol. node smoke.mjs <projektordner> <ausgabeordner>
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const [proj, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 8099, DBG = 9333;

const server = spawn(process.execPath, [join(proj, 'server.mjs'), String(PORT)], { stdio: 'ignore' });
const profileDir = join(tmpdir(), 'aufwind-smoke-' + Date.now());
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', `--remote-debugging-port=${DBG}`, `--user-data-dir=${profileDir}`, '--no-first-run', '--mute-audio', 'about:blank',
], { stdio: 'ignore' });

let ws, id = 0;
const pending = new Map();
const errors = [];
function send(method, params = {}) {
  return new Promise((res, rej) => {
    const i = ++id;
    pending.set(i, { res, rej });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
}
async function ev(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error('Eval: ' + expr + ' â†’ ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  return r.result.value;
}
async function shot(name, full = false) {
  let clip;
  if (full) {
    const h = await ev('document.documentElement.scrollHeight');
    clip = { x: 0, y: 0, width: 412, height: h, scale: 1 };
  }
  const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full, ...(clip ? { clip } : {}) });
  writeFileSync(join(out, name + '.png'), Buffer.from(r.data, 'base64'));
}
const click = (sel) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error('fehlt: ${sel.replace(/'/g, '')}'); el.click(); return true; })()`);
const fill = (sel, v) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); el.value = ${JSON.stringify(v)}; el.dispatchEvent(new Event('input', {bubbles:true})); })()`);

try {
  let targets;
  for (let k = 0; k < 40; k++) {
    try { targets = await (await fetch(`http://localhost:${DBG}/json`)).json(); break; } catch { await sleep(250); }
  }
  const page = targets.find((t) => t.type === 'page');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id).res(msg.result || {}); pending.delete(msg.id); }
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push('console: ' + msg.params.args.map((a) => a.value ?? a.description).join(' '));
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') errors.push('log: ' + msg.params.entry.text + ' ' + (msg.params.entry.url || ''));
  };
  await send('Runtime.enable'); await send('Page.enable'); await send('Log.enable'); await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });

  // Icons rendern
  await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
  for (const size of [192, 512]) {
    await send('Emulation.setDeviceMetricsOverride', { width: size, height: size, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `http://localhost:${PORT}/icons/icon.svg` });
    await sleep(600);
    await ev(`(() => { const s = document.documentElement; s.setAttribute('width','${size}'); s.setAttribute('height','${size}'); })()`);
    await sleep(200);
    const r = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(proj, 'icons', `icon-${size}.png`), Buffer.from(r.data, 'base64'));
  }
  await send('Emulation.setDefaultBackgroundColorOverride', {});

  await send('Emulation.setDeviceMetricsOverride', { width: 412, height: 915, deviceScaleFactor: 1, mobile: true });
  await send('Page.navigate', { url: `http://localhost:${PORT}/` });
  await sleep(1200);
  await shot('01-willkommen');
  await click('#next');
  await fill('#f-name', 'Testi');
  await click('#next');
  await fill('#f-age', '45'); await fill('#f-height', '170'); await fill('#f-weight', '145');
  await click('#next');
  for (let q = 0; q < 5; q++) { await click('[data-opt="0"]'); await sleep(80); }
  await shot('02-gesundheit');
  await click('#next');
  await sleep(200);
  await shot('03-ergebnis');
  const lvl = await ev(`document.querySelector('.level-badge').textContent`);
  console.log('Startlevel:', lvl);
  await click('#next');
  await sleep(400);
  await shot('04-heute', true);

  // Morgen-Challenge durchspielen
  await click('[data-start="morning"]');
  await sleep(200);
  await shot('05-player-intro');
  await click('[data-act="start"]');
  await sleep(1500);
  await shot('06-player-uebung');
  for (let k = 0; k < 40; k++) {
    const hasFb = await ev(`!!document.querySelector('[data-fb]')`);
    if (hasFb) break;
    const act = await ev(`(document.querySelector('[data-act="next"]') || document.querySelector('[data-act="skip"]'))?.dataset.act`);
    if (act === 'skip' && k === 1) await shot('07-player-pause');
    await click(`[data-act="${act}"]`);
    await sleep(150);
  }
  await shot('08-player-fertig');
  await click('[data-fb="leicht"]');
  await sleep(300);
  await click('#habit');
  await sleep(300);
  await shot('09-heute-erledigt', true);
  const state = await ev(`JSON.parse(localStorage.getItem('aufwind:v1')).profiles[0]`);
  console.log('Sessions:', state.sessions.length, 'IntensitÃ¤t:', state.intensity, 'Abzeichen:', Object.keys(state.badges).join(','));

  await ev(`location.hash = '#/uebungen'`); await sleep(300);
  await shot('10-uebungen', true);
  await click('[data-ex]'); await sleep(200);
  await shot('11-uebung-detail');
  await ev(`document.querySelector('[data-close]').click()`);

  await ev(`location.hash = '#/fortschritt'`); await sleep(300);
  await fill('#log-val', '143.2');
  await ev(`document.querySelector('#log-form').requestSubmit()`); await sleep(300);
  await shot('12-fortschritt', true);

  await ev(`location.hash = '#/profil'`); await sleep(300);
  await shot('13-profil', true);

  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
  await ev(`location.hash = '#/heute'`); await sleep(400);
  await shot('14-heute-dunkel', true);

  console.log(errors.length ? 'FEHLER:\n' + errors.join('\n') : 'Keine JS-Fehler.');
} catch (e) {
  console.log('ABBRUCH:', e.message, '\n', errors.join('\n'));
  try { await shot('zz-abbruch', true); } catch {}
} finally {
  ws?.close();
  chrome.kill(); server.kill();
  await sleep(500);
  try { rmSync(profileDir, { recursive: true, force: true }); } catch {}
  process.exit(0);
}

