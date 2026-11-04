// Erinnerungen: (1) Push über den Server – kommt auch bei geschlossener App (ab v0.11.0),
// (2) Benachrichtigung, solange die App geöffnet ist (Rückfall ohne Push), (3) Kalender-Datei (.ics).
import * as store from './store.js';
import { toKey } from './core/dates.js';
import { VAPID_PUBLIC } from './push-config.js';

let timer = null;

export const notifySupported = () => 'Notification' in window;

export async function enableNotifications() {
  if (!notifySupported()) return false;
  const perm = await Notification.requestPermission();
  return perm === 'granted';
}

async function show(title, body) {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification(title, { body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: title });
    else new Notification(title, { body, icon: 'icons/icon-192.png' });
  } catch { /* ignorieren */ }
}

function check() {
  const s = store.getState();
  if (!s.settings.notify || s.settings.push || !notifySupported() || Notification.permission !== 'granted') return;
  const today = toKey();
  const now = new Date();
  const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  s.notified ||= {};
  for (const p of s.profiles) {
    for (const slot of ['morning', 'evening']) {
      const at = p.reminders?.[slot];
      const key = `${p.id}:${slot}`;
      const done = p.sessions.some((x) => x.date === today && x.slot === slot);
      if (!at || done || s.notified[key] === today || hm < at) continue;
      // Nur innerhalb von 2 Stunden nach der Erinnerungszeit melden
      const [h, m] = at.split(':').map(Number);
      if ((now.getHours() * 60 + now.getMinutes()) - (h * 60 + m) > 120) continue;
      s.notified[key] = today;
      store.save();
      const anchor = p.plan?.[slot] ? ` (${p.plan[slot]})` : '';
      show(slot === 'morning' ? `🌅 ${p.name}, Zeit für deine Morgen-Challenge` : `🌙 ${p.name}, Zeit für deine Abend-Challenge`,
        `Nur ein paar Minuten${anchor}. ${p.why ? `Denk an dein Warum: ${p.why}` : 'Du schaffst das!'}`);
    }
  }
}

export function startReminders() {
  clearInterval(timer);
  check();
  timer = setInterval(check, 60 * 1000);
}

// ---------- Push-Erinnerungen (auch bei geschlossener App) ----------
// Abo beim Push-Dienst des Browsers, gespeichert über /api/push; verschickt werden die Nachrichten vom Worker push/worker.js.
// Pro Gerät: settings.push = { id, secret } (wird nicht synchronisiert).

const rnd = (n) => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(n)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const keyBytes = (b64) => Uint8Array.from(atob(b64.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64.length + 3) % 4)), (c) => c.charCodeAt(0));
const post = (body) => fetch('api/push', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

/** Kann dieses Gerät Push? (iPhone: nur als App vom Home-Bildschirm, ab iOS 16.4) */
export function pushSupport() {
  if (!VAPID_PUBLIC) return 'unconfigured';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !notifySupported()) {
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    return ios && !matchMedia('(display-mode: standalone)').matches ? 'ios-install' : 'unsupported';
  }
  return Notification.permission === 'denied' ? 'denied' : 'ok';
}

export const pushActive = () => !!store.getState().settings.push?.id;

function people() {
  return store.getState().profiles.map((p) => ({ pid: p.id, name: p.name.slice(0, 30), morning: p.reminders?.morning || '', evening: p.reminders?.evening || '' }));
}

/** Abo anlegen bzw. Zeiten aktualisieren. Gibt true zurück, wenn der Server es gespeichert hat. */
export async function enablePush() {
  if (pushSupport() !== 'ok' || !(await enableNotifications())) return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription())
    || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC) });
  const s = store.getState().settings;
  s.push ||= { id: rnd(16).slice(0, 22), secret: rnd(32) };
  const res = await post({ action: 'subscribe', id: s.push.id, secret: s.push.secret, sub: sub.toJSON(), tz: Intl.DateTimeFormat().resolvedOptions().timeZone, people: people() });
  if (!res.ok) return false;
  s.notify = false; // keine doppelten Meldungen durch die Erinnerung bei geöffneter App
  store.save();
  return true;
}

/** Zeiten/Profile neu übertragen (nach Änderungen im Profil oder beim Start). Fehler sind still – nächster Versuch beim nächsten Start. */
export async function syncPush() {
  if (!pushActive() || pushSupport() !== 'ok' || Notification.permission !== 'granted') return;
  try { await enablePush(); } catch { /* offline */ }
}

export async function disablePush() {
  const s = store.getState().settings;
  if (s.push) await post({ action: 'unsubscribe', id: s.push.id, secret: s.push.secret }).catch(() => {});
  try { await (await (await navigator.serviceWorker.ready).pushManager.getSubscription())?.unsubscribe(); } catch { /* egal */ }
  delete s.push;
  store.save();
}

const reported = new Set();
/** Heute erledigte Challenges melden – der Server schickt dann keine Erinnerung mehr dafür. */
export function reportDone(p) {
  if (!VAPID_PUBLIC) return;
  const today = toKey();
  for (const slot of ['morning', 'evening']) {
    const key = `${p.id}:${today}:${slot}`;
    if (reported.has(key) || !p.sessions.some((x) => x.date === today && x.slot === slot && !x.partial)) continue;
    reported.add(key);
    post({ action: 'done', pid: p.id, date: today, slot }).catch(() => reported.delete(key));
  }
}
