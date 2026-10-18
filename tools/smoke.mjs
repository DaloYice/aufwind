// Smoke-Test von Aufwind über das Chrome DevTools Protocol (headless Chrome).
// node tools/smoke.mjs <projektordner> <ausgabeordner> [breite=412]   → Screenshots + Liste von JS-Fehlern
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const [proj = '.', out = join(tmpdir(), 'aufwind-smoke'), width = '412'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 8099, DBG = 9333, WIDTH = Number(width);

const server = spawn(process.execPath, [join(proj, 'server.mjs'), String(PORT)], { stdio: 'ignore' });
const profileDir = join(tmpdir(), 'aufwind-smoke-' + Date.now());
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', `--remote-debugging-port=${DBG}`, `--user-data-dir=${profileDir}`, '--no-first-run', '--mute-audio', 'about:blank',
], { stdio: 'ignore' });

let ws, id = 0;
const pending = new Map();
const errors = [];
const log = (...a) => console.log('•', ...a);
function send(method, params = {}) {
  return new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
}
async function ev(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error('Eval: ' + expr.slice(0, 80) + ' → ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  return r.result.value;
}
async function shot(name, full = true) {
  await sleep(500); // Einblende-Animationen abwarten
  const h = full ? await ev('document.documentElement.scrollHeight') : 915;
  const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full, clip: { x: 0, y: 0, width: WIDTH, height: h, scale: 1 } });
  writeFileSync(join(out, name + '.png'), Buffer.from(r.data, 'base64'));
}
const click = (sel) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error('fehlt: ' + ${JSON.stringify(sel)}); el.click(); return true; })()`);
const fill = (sel, v) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); el.value = ${JSON.stringify(v)}; el.dispatchEvent(new Event('input', {bubbles:true})); })()`);
const exists = (sel) => ev(`!!document.querySelector(${JSON.stringify(sel)})`);
const nav = async (hash) => { await ev(`location.hash = '${hash}'`); await sleep(350); };

async function skipToEnd() {
  for (let k = 0; k < 60 && !(await exists('[data-fb]')); k++) {
    const act = await ev(`(document.querySelector('[data-act="next"]') || document.querySelector('[data-act="skip"]'))?.dataset.act`);
    await click(`[data-act="${act}"]`);
    await sleep(60);
  }
}

// Testverlauf über ~10 Wochen erzeugen (für Dashboard, Rückblick und Familie)
const SEED = `(() => {
  const s = JSON.parse(localStorage.getItem('aufwind:v1'));
  const p = s.profiles[0];
  const key = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const day = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return key(d); };
  let r = 7; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
  p.createdAt = day(75);
  p.sessions = [];
  const fb = ['leicht', 'passt', 'passt', 'passt', 'schwer'];
  for (let n = 74; n >= 1; n--) {
    const chance = 0.35 + (74 - n) / 140;
    if (rnd() < chance) p.sessions.push({ date: day(n), slot: 'morning', durationSec: 180 + rnd() * 240, feedback: fb[Math.floor(rnd() * 5)], cats: { mobil: 60, kraft: 90, ausdauer: 60 } });
    if (rnd() < chance - 0.1) p.sessions.push({ date: day(n), slot: 'evening', durationSec: 300 + rnd() * 600, feedback: fb[Math.floor(rnd() * 5)], cats: { kraft: 200, ausdauer: 200, entspannung: 80, balance: 40 } });
    if (rnd() < 0.12) p.sessions.push({ date: day(n), slot: 'extra', title: 'Spaziergang', durationSec: 1200 + rnd() * 1200, feedback: 'passt', cats: { ausdauer: 1800 } });
    if (rnd() < 0.6) p.habits[day(n)] = 'x';
    p.water[day(n)] = Math.floor(rnd() * 8);
  }
  p.sessions.sort((a, b) => a.date.localeCompare(b.date));
  p.logs.weight = [];
  for (let n = 75; n >= 1; n -= 4) p.logs.weight.push({ date: day(n), value: Math.round((145 - (75 - n) * 0.09 + (rnd() - 0.5) * 1.6) * 10) / 10 });
  p.logs.waist = [{ date: day(70), value: 138 }, { date: day(35), value: 135.5 }, { date: day(3), value: 133 }];
  delete p.lastReview;
  const q = JSON.parse(JSON.stringify(p));
  q.id = 'zweit'; q.name = 'Sam'; q.emoji = '🦊';
  q.sessions = q.sessions.filter((_, i) => i % 3 === 0);
  s.profiles.push(q);
  localStorage.setItem('aufwind:v1', JSON.stringify(s));
})()`;

try {
  let targets;
  for (let k = 0; k < 40; k++) {
    try { targets = await (await fetch(`http://localhost:${DBG}/json`)).json(); break; } catch { await sleep(250); }
  }
  ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result || {}); pending.delete(msg.id); }
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push('console: ' + msg.params.args.map((a) => a.value ?? a.description).join(' '));
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error' && !/favicon/.test(msg.params.entry.url || '') && !/navigator.vibrate/.test(msg.params.entry.text)) errors.push('log: ' + msg.params.entry.text + ' ' + (msg.params.entry.url || ''));
  };
  await send('Runtime.enable'); await send('Page.enable'); await send('Log.enable');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: 915, deviceScaleFactor: 1, mobile: true });

  // 1) Onboarding inkl. Warum und Wenn-dann-Plan
  await send('Page.navigate', { url: `http://localhost:${PORT}/` });
  await sleep(1200);
  await click('#next');
  await fill('#f-name', 'Testi');
  await click('#next');
  await fill('#f-age', '45'); await fill('#f-height', '170'); await fill('#f-weight', '145');
  await click('#next');
  for (let q = 0; q < 5; q++) { await click('[data-opt="0"]'); await sleep(60); }
  await click('#next'); // Gesundheits-Check
  await click('[data-why]'); await fill('#f-why', 'Mit meinen Enkeln toben');
  await shot('01-warum');
  await click('#next');
  await shot('02-plan');
  await click('#next');
  log('Startlevel:', await ev(`document.querySelector('.level-badge').textContent`));
  await click('#next');
  await sleep(400);
  await shot('03-heute');

  // 2) Morgen-Challenge mit animierter Figur
  await click('[data-start="morning"]');
  await sleep(200);
  await click('[data-act="start"]');
  await sleep(1300);
  await shot('04-player-figur', false);
  await skipToEnd();
  await click('[data-fb="passt"]');
  await sleep(300);
  await click('[data-water="1"]'); await sleep(100); await click('[data-water="1"]'); await sleep(100);
  await click('#habit'); await sleep(200);

  // 3) Programm starten und eine Einheit durchspielen
  await nav('#/uebungen');
  await shot('05-programme');
  await click('[data-prog="geh-start"]'); await sleep(200);
  await shot('06-programm-detail', false);
  await click('#pr-go'); await sleep(500);
  await click('#prog-start'); await sleep(200);
  await click('[data-act="start"]'); await sleep(300);
  await skipToEnd();
  await click('[data-fb="passt"]'); await sleep(400);
  const st = await ev(`JSON.parse(localStorage.getItem('aufwind:v1')).profiles[0]`);
  log('Sessions:', st.sessions.length, '· Programm-Einheiten:', st.program?.done.length, '· Wasser heute:', Object.values(st.water)[0], '· Abzeichen:', Object.keys(st.badges).join(','));
  await shot('07-heute-programm');

  // 4) Übungsdetail mit Figur
  await nav('#/uebungen');
  await click('[data-ex="aufstehen"]'); await sleep(600);
  await shot('08-uebung-figur', false);
  await ev(`document.querySelector('[data-close]').click()`);

  // 5) Verlauf erzeugen → Rückblick, Familie, Dashboard
  await ev(SEED);
  await ev(`location.hash = '#/heute'`);
  await ev('location.reload()');
  await sleep(1300);
  await shot('09-heute-mit-verlauf');
  log('Rückblick-Banner:', await exists('#review'), '· Familienkarte:', await ev(`/familien-challenge/i.test(document.body.innerText)`));
  await click('#review'); await sleep(300);
  await shot('10-rueckblick', false);
  await click('#g-save'); await sleep(400);

  await nav('#/fortschritt');
  await ev(`document.querySelector('.viz .hit').dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 120, clientY: 400 }))`);
  log('Tooltip:', await ev(`document.querySelector('.viz-tip')?.textContent`));
  await shot('11-dashboard');
  await click('[data-ptab="werte"]'); await sleep(200);
  await shot('12-messwerte');
  await click('[data-ptab="abzeichen"]'); await sleep(200);
  await shot('13-abzeichen');
  await nav('#/profil');
  await shot('14-profil');

  // 5b) v0.4.0 Alltag: Tauschen, Teil-Speichern, „Schon erledigt“, Nachtragen, Bearbeiten/Löschen mit Rückgängig
  await nav('#/heute');
  const prof0 = () => ev(`JSON.parse(localStorage.getItem('aufwind:v1')).profiles[0]`);
  log('IDs nach Migration:', (await prof0()).sessions.every((s) => s.id));
  await click('[data-swap="evening"]'); await sleep(250);
  const before = await ev(`[...document.querySelectorAll('[data-sw]')].map((b) => b.dataset.sw).join(',')`);
  await click('[data-sw]'); await sleep(250);
  log('Tausch:', before, '→', await ev(`[...document.querySelectorAll('[data-sw]')].map((b) => b.dataset.sw).join(',')`));
  await shot('20-tauschen', false);
  await click('#overlay [data-close].btn'); await sleep(300);
  await click('[data-start="evening"]'); await sleep(200);
  await click('[data-act="start"]'); await sleep(200);
  await click(await exists('[data-act="next"]') ? '[data-act="next"]' : '[data-act="skip"]'); await sleep(200);
  await click('[data-act="quit"]'); await sleep(200);
  await shot('21-abbrechen-teil', false);
  await click('[data-act="save-partial"]'); await sleep(400);
  log('Teil gespeichert:', JSON.stringify((await prof0()).sessions.filter((s) => s.slot === 'evening').at(-1)));
  await shot('22-heute-teilweise');
  await click('[data-mark="evening"]'); await sleep(250);
  await click('[data-fb="passt"]'); await sleep(400);
  log('Abend nach „Schon erledigt“:', JSON.stringify((await prof0()).sessions.filter((s) => s.slot === 'evening').slice(-2).map((s) => [s.date, s.partial || false, s.manual || false])));
  await click('#extra'); await sleep(250);
  await click('[data-day]:nth-child(2)'); await click('[data-min="30"]');
  await shot('23-nachtragen', false);
  await click('#x-save'); await sleep(400);
  log('Nachgetragen:', JSON.stringify((await prof0()).sessions.filter((s) => s.slot === 'extra').at(-1)?.date), '· lastExtra:', JSON.stringify((await prof0()).lastExtra));
  await nav('#/fortschritt');
  await click('[data-ptab="overview"]'); await sleep(200);
  const n0 = (await prof0()).sessions.length;
  await click('[data-sess]'); await sleep(250);
  await shot('24-einheit-bearbeiten', false);
  await click('#e-del'); await sleep(300);
  const n1 = (await prof0()).sessions.length;
  await shot('25-rueckgaengig', false);
  await click('#toast button'); await sleep(300);
  log('Einheiten:', n0, '→ gelöscht', n1, '→ rückgängig', (await prof0()).sessions.length);
  await click('[data-ptab="werte"]'); await sleep(200);
  await click('summary'); await click('[data-del]'); await sleep(300);
  const w1 = (await prof0()).logs.weight.length;
  await click('#toast button'); await sleep(300);
  log('Messwert gelöscht → rückgängig:', w1, '→', (await prof0()).logs.weight.length, '· Liste offen:', await ev(`document.querySelector('#log-all')?.open`));

  // 6) Dunkelmodus
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
  await nav('#/fortschritt');
  await click('[data-ptab="overview"]'); await sleep(300);
  await shot('15-dashboard-dunkel');
  await nav('#/heute');
  await shot('16-heute-dunkel');
  // Update-Leiste (gleiches Markup wie showUpdateBar in app.js)
  await ev(`(() => { const b = document.createElement('div'); b.className = 'update-bar'; b.innerHTML = '<span>✨ Neue Version von Aufwind ist da.</span><button type="button" class="btn light sm">Neu laden</button>'; document.body.appendChild(b); })()`);
  await sleep(500);
  log('Update-Leiste im Bild:', await ev(`(() => { const r = document.querySelector('.update-bar').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; })()`));
  await shot('17-update-leiste', false);

  console.log(errors.length ? 'FEHLER:\n' + errors.join('\n') : 'Keine JS-Fehler.');
} catch (e) {
  console.log('ABBRUCH:', e.message, '\n', errors.join('\n'));
  try { await shot('zz-abbruch'); } catch {}
} finally {
  ws?.close();
  chrome.kill(); server.kill();
  await sleep(500);
  try { rmSync(profileDir, { recursive: true, force: true }); } catch {}
  process.exit(0);
}
