// Erinnerungen per Benachrichtigung – funktioniert, solange die App geöffnet ist (auch im Hintergrund-Tab).
// Für zuverlässige Erinnerungen bei geschlossener App bleibt die Kalender-Datei (.ics) die sichere Wahl.
import * as store from './store.js';
import { toKey } from './core/dates.js';

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
  if (!s.settings.notify || !notifySupported() || Notification.permission !== 'granted') return;
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
