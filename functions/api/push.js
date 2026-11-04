// Cloudflare Pages Function /api/push: Push-Abos für Erinnerungen verwalten (KV-Bindung AUFWIND_SYNC).
// Gespeichert wird nur, was zum Erinnern nötig ist: Push-Endpunkt, Zeitzone, Vornamen und Uhrzeiten.
// Aktionen (POST, JSON):
//   { action: 'subscribe', id, secret, sub, tz, people }   anlegen/aktualisieren
//   { action: 'done', pid, date, slot }                    Challenge erledigt → heute keine Erinnerung mehr
//   { action: 'unsubscribe', id, secret }                  löschen
const ID = /^[A-Za-z0-9_-]{22}$/;
const SECRET = /^[A-Za-z0-9_-]{32,64}$/;
const PID = /^[a-z0-9]{4,16}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const HM = /^\d{2}:\d{2}$/;
const B64U = /^[A-Za-z0-9_-]+$/;
// Nur bekannte Push-Dienste – sonst könnte der Worker beliebige Adressen anfunken
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /^web\.push\.apple\.com$/, /\.notify\.windows\.com$/, /^push\.api\.chrome\.google\.com$/];
const MAX = 4000;
const TTL_2_DAYS = 2 * 24 * 3600;

const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

async function sha256(text) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function validSubscription(sub) {
  if (!sub || typeof sub.endpoint !== 'string' || sub.endpoint.length > 1000) return false;
  let url;
  try { url = new URL(sub.endpoint); } catch { return false; }
  if (url.protocol !== 'https:' || !PUSH_HOSTS.some((r) => r.test(url.hostname))) return false;
  const { p256dh, auth } = sub.keys || {};
  return typeof p256dh === 'string' && B64U.test(p256dh) && p256dh.length >= 86 && p256dh.length <= 88
    && typeof auth === 'string' && B64U.test(auth) && auth.length >= 22 && auth.length <= 24;
}

function validPeople(people) {
  return Array.isArray(people) && people.length >= 1 && people.length <= 8 && people.every((p) => p && PID.test(p.pid)
    && typeof p.name === 'string' && p.name.length <= 30
    && (p.morning === '' || HM.test(p.morning)) && (p.evening === '' || HM.test(p.evening)));
}

async function handlePost(request, env) {
  const kv = env.AUFWIND_SYNC;
  if (!kv) return json({ error: 'Speicher ist noch nicht eingerichtet' }, 503);
  const text = await request.text();
  if (text.length > MAX) return json({ error: 'Zu groß' }, 413);
  let b;
  try { b = JSON.parse(text); } catch { return json({ error: 'Ungültiges JSON' }, 400); }

  if (b.action === 'done') {
    if (!PID.test(b.pid || '') || !DATE.test(b.date || '') || !['morning', 'evening'].includes(b.slot)) return json({ error: 'Ungültige Angaben' }, 400);
    await kv.put(`pushdone:${b.pid}:${b.date}:${b.slot}`, '1', { expirationTtl: TTL_2_DAYS });
    return json({ ok: true });
  }

  if (!ID.test(b.id || '') || !SECRET.test(b.secret || '')) return json({ error: 'Ungültige Kennung' }, 400);
  const key = `push:${b.id}`;
  const h = await sha256(b.secret);
  const cur = await kv.get(key, 'json');
  if (cur && cur.h !== h) return json({ error: 'Nicht berechtigt' }, 403);

  if (b.action === 'unsubscribe') {
    if (cur) await kv.delete(key);
    return json({ ok: true });
  }
  if (b.action === 'subscribe') {
    if (!validSubscription(b.sub)) return json({ error: 'Ungültiges Push-Abo' }, 400);
    if (!validPeople(b.people)) return json({ error: 'Ungültige Erinnerungszeiten' }, 400);
    const tz = typeof b.tz === 'string' && b.tz.length <= 64 ? b.tz : 'Europe/Berlin';
    const rec = {
      h, tz, at: new Date().toISOString(),
      sub: { endpoint: b.sub.endpoint, keys: { p256dh: b.sub.keys.p256dh, auth: b.sub.keys.auth } },
      people: b.people.map((p) => ({ pid: p.pid, name: p.name.trim(), morning: p.morning, evening: p.evening })),
    };
    await kv.put(key, JSON.stringify(rec));
    return json({ ok: true });
  }
  return json({ error: 'Unbekannte Aktion' }, 400);
}

export function onRequest({ request, env }) {
  return request.method === 'POST' ? handlePost(request, env) : json({ error: 'Methode nicht erlaubt' }, 405);
}
