// Geräte-Abgleich per Sync-Code (Cloudflare Pages Function + KV, Ende-zu-Ende verschlüsselt).
import * as store from './store.js';
import { newCode, normalizeCode, isValidCode, syncId, encryptJSON, decryptJSON, payloadOf, mergePayload, fingerprint } from './core/syncdata.js';

const KEY = 'aufwind:sync';
const API = 'api/sync/';
let cfg = load();
let busy = false, again = false, timer = null, interval = null;
let status = { state: cfg ? 'idle' : 'off', at: cfg?.lastSync || null, error: null };
const subs = new Set();
let onRemote = () => {};

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; }
}
function persist() {
  try { cfg ? localStorage.setItem(KEY, JSON.stringify(cfg)) : localStorage.removeItem(KEY); } catch { /* ignorieren */ }
}
function setStatus(s) {
  status = { ...status, ...s };
  subs.forEach((fn) => fn(status));
}
async function errText(r) {
  try { return (await r.json()).error || `Fehler ${r.status}`; } catch { return `Fehler ${r.status}`; }
}

export const syncCode = () => cfg?.code || null;
export const syncStatus = () => status;
export const onSyncStatus = (fn) => { subs.add(fn); return () => subs.delete(fn); };
export const syncLink = (code = cfg?.code) => `${location.origin}${location.pathname}#/sync/${normalizeCode(code)}`;

/** Erstes Gerät: neuen Code erzeugen und aktuellen Stand hochladen. */
export async function setupSync() {
  const code = newCode();
  cfg = { code, id: await syncId(code), v: 0, lastSync: null };
  persist();
  const ok = await syncNow();
  if (!ok) { cfg = null; persist(); setStatus({ state: 'off' }); throw new Error(status.error || 'Einrichten fehlgeschlagen'); }
  return code;
}

/** Weiteres Gerät: mit vorhandenem Code verbinden und Stände zusammenführen. */
export async function joinSync(input) {
  const code = normalizeCode(input);
  if (!isValidCode(code)) throw new Error('Der Code ist nicht vollständig – er hat 32 Zeichen.');
  const id = await syncId(code);
  const r = await fetch(API + id, { cache: 'no-store' });
  if (r.status === 404) throw new Error('Zu diesem Code gibt es noch keine Daten. Bitte den Code prüfen.');
  if (!r.ok) throw new Error(await errText(r));
  cfg = { code, id, v: 0, lastSync: null };
  persist();
  const ok = await syncNow();
  if (!ok) throw new Error(status.error || 'Abgleich fehlgeschlagen');
  return true;
}

export function leaveSync() {
  cfg = null;
  persist();
  setStatus({ state: 'off', at: null, error: null });
}

/** Holen → zusammenführen → ggf. hochladen. Gibt true zurück, wenn der Abgleich geklappt hat. */
export async function syncNow() {
  if (!cfg) return false;
  if (busy) { again = true; return false; }
  busy = true;
  setStatus({ state: 'syncing', error: null });
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const r = await fetch(API + cfg.id, { cache: 'no-store' });
      let remote = null, remoteV = 0;
      if (r.status === 200) {
        const rec = await r.json();
        remoteV = rec.v;
        remote = await decryptJSON(cfg.code, rec.data);
      } else if (r.status !== 404) throw new Error(await errText(r));

      const local = payloadOf(store.getState());
      const merged = remote ? mergePayload(local, remote) : local;
      const fpMerged = await fingerprint(merged);
      if (fpMerged !== (await fingerprint(local))) {
        store.applySync(merged);
        onRemote();
      }
      if (!remote || fpMerged !== (await fingerprint(remote))) {
        const put = await fetch(API + cfg.id, {
          method: 'PUT', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ v: remoteV, data: await encryptJSON(cfg.code, merged) }),
        });
        if (put.status === 409) continue; // jemand war schneller → neu holen und zusammenführen
        if (!put.ok) throw new Error(await errText(put));
        cfg.v = (await put.json()).v;
      } else cfg.v = remoteV;
      cfg.lastSync = new Date().toISOString();
      persist();
      setStatus({ state: 'idle', at: cfg.lastSync });
      return true;
    }
    throw new Error('Gleichzeitige Änderungen – bitte gleich nochmal versuchen.');
  } catch (e) {
    const offline = navigator.onLine === false || e instanceof TypeError;
    setStatus({ state: 'error', error: offline ? 'Offline – wird abgeglichen, sobald du wieder online bist.' : e.message });
    return false;
  } finally {
    busy = false;
    if (again) { again = false; schedule(800); }
  }
}

export function schedule(ms = 4000) {
  if (!cfg) return;
  clearTimeout(timer);
  timer = setTimeout(syncNow, ms);
}

/** Automatischer Abgleich: beim Start, nach Änderungen, beim Zurückkehren in die App und alle 2 Minuten. */
export function startSync(onRemoteChange) {
  onRemote = onRemoteChange || onRemote;
  store.onChange((_, meta) => { if (!meta?.remote) schedule(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') schedule(300); });
  addEventListener('online', () => schedule(300));
  clearInterval(interval);
  interval = setInterval(() => { if (document.visibilityState === 'visible') syncNow(); }, 120000);
  if (cfg) syncNow();
}

/** QR-Code als SVG (Bibliothek wird erst bei Bedarf geladen). */
export async function qrSVG(text) {
  if (!window.qrcode) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'vendor/qrcode.js';
      s.onload = res;
      s.onerror = () => rej(new Error('QR-Code konnte nicht geladen werden'));
      document.head.appendChild(s);
    });
  }
  const qr = window.qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  return qr.createSvgTag({ cellSize: 5, margin: 3, scalable: true, alt: 'QR-Code zum Verbinden' });
}
