// Sync-Test mit zwei getrennten Chrome-Instanzen („Handy“ und „PC“) am selben lokalen Server.
// node tools/sync-smoke.mjs <projektordner> <ausgabeordner>
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const [proj = '.', out = join(tmpdir(), 'aufwind-sync-smoke')] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 8096;
const server = spawn(process.execPath, [join(proj, 'server.mjs'), String(PORT)], { stdio: 'ignore' });
const errors = [];
const procs = [];

async function device(name, dbg, width) {
  const dir = join(tmpdir(), `aufwind-sync-${name}-${Date.now()}`);
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', `--remote-debugging-port=${dbg}`, `--user-data-dir=${dir}`, '--no-first-run', '--mute-audio', 'about:blank',
  ], { stdio: 'ignore' });
  procs.push({ chrome, dir });
  let targets;
  for (let k = 0; k < 40; k++) { try { targets = await (await fetch(`http://localhost:${dbg}/json`)).json(); break; } catch { await sleep(250); } }
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result || {}); pending.delete(msg.id); }
    if (msg.method === 'Runtime.exceptionThrown') errors.push(`${name}: ${msg.params.exceptionDetails.exception?.description}`);
  };
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(`${name}: ${expr.slice(0, 70)} → ${r.exceptionDetails.exception?.description}`);
    return r.result.value;
  };
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
  return {
    ev, ws,
    goto: async (hash = '') => { await send('Page.navigate', { url: `http://localhost:${PORT}/${hash}` }); await sleep(1300); },
    click: (sel) => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) throw new Error('fehlt: ' + ${JSON.stringify(sel)}); el.click(); })()`),
    shot: async (file) => {
      await sleep(500);
      const h = await ev('document.documentElement.scrollHeight');
      const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width, height: Math.min(h, 1400), scale: 1 } });
      writeFileSync(join(out, file), Buffer.from(r.data, 'base64'));
    },
  };
}

const PROFILE = `(() => {
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem('aufwind:v1', JSON.stringify({ activeId: 'p1', profiles: [{ id: 'p1', name: 'Kim', emoji: '🦊', createdAt: today, level: 2, levelSince: today, intensity: 1,
    answers: {}, sessions: [{ date: today, slot: 'morning', durationSec: 240, feedback: 'passt', title: 'Morgen-Aktivierung' }], habits: {}, logs: { weight: [{ date: today, value: 98.4 }] },
    badges: {}, reminders: { morning: '07:30', evening: '19:00' }, updatedAt: new Date().toISOString() }], settings: {} }));
})()`;

const ok = (cond, msg) => { console.log(`${cond ? '✔' : '✖'} ${msg}`); if (!cond) errors.push(msg); };

try {
  const phone = await device('handy', 9341, 412);
  const pc = await device('pc', 9342, 1000);

  // „Handy“: Profil vorhanden, Sync einrichten
  await phone.goto();
  await phone.ev(PROFILE);
  await phone.ev(`location.hash = '#/profil'; location.reload()`);
  await sleep(1500);
  await phone.click('#sync-new');
  await sleep(1500);
  const code = await phone.ev(`JSON.parse(localStorage.getItem('aufwind:sync'))?.code`);
  ok(code?.length === 32, 'Handy: Sync-Code erzeugt');
  ok(await phone.ev(`!!document.querySelector('#qr svg')`), 'Handy: QR-Code angezeigt');
  await phone.shot('1-handy-code.png');

  // „PC“: frisch, über Link verbinden
  await pc.goto(`#/sync/${code}`);
  await sleep(500);
  await pc.shot('2-pc-verbinden.png');
  await pc.click('#join-go');
  await sleep(2500);
  ok(await pc.ev(`/Kim/.test(document.body.innerText)`), 'PC: Profil „Kim“ nach dem Verbinden da');
  ok(await pc.ev(`JSON.parse(localStorage.getItem('aufwind:v1')).profiles[0].logs.weight.length`) === 1, 'PC: Messwert übernommen');
  await pc.shot('3-pc-heute.png');

  // PC: Wasser eintragen → automatischer Upload nach ~4 s
  await pc.click('[data-water="1"]');
  await pc.click('[data-water="1"]');
  await sleep(5500);
  // Handy: abgleichen
  await phone.ev(`document.querySelector('[data-close]')?.click()`);
  await phone.click('#sync-now');
  await sleep(2000);
  const water = await phone.ev(`Object.values(JSON.parse(localStorage.getItem('aufwind:v1')).profiles[0].water || {})[0]`);
  ok(water === 2, `Handy: 2 Gläser vom PC angekommen (ist: ${water})`);

  // Gleichzeitige Änderungen auf beiden Geräten → nichts geht verloren
  await phone.goto('#/heute');
  await phone.click('#habit');
  await pc.goto('#/heute');
  await pc.click('#extra');
  await pc.ev(`document.querySelector('#x-min').value = '20'`);
  await pc.click('#x-save');
  await sleep(6000);
  await phone.ev(`location.reload()`); await sleep(2500);
  await pc.ev(`location.reload()`); await sleep(2500);
  const a = await phone.ev(`JSON.parse(localStorage.getItem('aufwind:v1')).profiles[0]`);
  const b = await pc.ev(`JSON.parse(localStorage.getItem('aufwind:v1')).profiles[0]`);
  ok(a.sessions.length === 2 && b.sessions.length === 2, `Beide Geräte haben 2 Einheiten (Handy ${a.sessions.length}, PC ${b.sessions.length})`);
  ok(Object.keys(a.habits).length === 1 && Object.keys(b.habits).length === 1, 'Gewohnheit vom Handy ist auf beiden Geräten');
  await phone.shot('4-handy-nach-abgleich.png');

  console.log(errors.length ? 'FEHLER:\n' + errors.join('\n') : 'Sync-Test bestanden, keine JS-Fehler.');
} catch (e) {
  console.log('ABBRUCH:', e.message, '\n', errors.join('\n'));
} finally {
  for (const { chrome } of procs) chrome.kill();
  server.kill();
  await sleep(600);
  for (const { dir } of procs) { try { rmSync(dir, { recursive: true, force: true }); } catch {} }
  process.exit(0);
}
