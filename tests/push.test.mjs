import { test } from 'node:test';
import assert from 'node:assert/strict';
import { b64u, unb64u, encryptPayload, importVapid, vapidHeader } from '../push/webpush.js';

const enc = new TextEncoder();

// Testwerte aus RFC 8291, Anhang A
const RFC = {
  plaintext: 'When I grow up, I want to be a watermelon',
  asPrivate: 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw',
  asPublic: 'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8',
  uaPublic: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
  uaPrivate: 'q1dXpw3UpT5VOmu_cf_v6ih07Aems3njxI-JWgLcM94',
  auth: 'BTBZMqHH6r4Tts7J_aSIgg',
  salt: 'DGv6ra1nlYgDCS1FRnbzlw',
  body: 'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN',
};

async function ecdhPair(pubB64, privB64) {
  const pub = unb64u(pubB64);
  const jwk = { kty: 'EC', crv: 'P-256', x: b64u(pub.slice(1, 33)), y: b64u(pub.slice(33)), d: privB64, ext: true };
  const privateKey = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const publicKey = await crypto.subtle.importKey('raw', pub, { name: 'ECDH', namedCurve: 'P-256' }, true, []);
  return { privateKey, publicKey };
}

/** Gegenstück im Browser: aes128gcm entschlüsseln (nur für den Rundlauf-Test). */
async function decrypt(body, uaPair, authB64) {
  const salt = body.slice(0, 16);
  const idlen = body[20];
  const asPublic = body.slice(21, 21 + idlen);
  const cipher = body.slice(21 + idlen);
  const asKey = await crypto.subtle.importKey('raw', asPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: asKey }, uaPair.privateKey, 256));
  const uaPublic = new Uint8Array(await crypto.subtle.exportKey('raw', uaPair.publicKey));
  const h = async (s, ikm, info, n) => new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: s, info },
    await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']), n * 8));
  const cat = (...a) => Uint8Array.from(a.flatMap((x) => [...x]));
  const ikm = await h(unb64u(authB64), ecdh, cat(enc.encode('WebPush: info\0'), uaPublic, asPublic), 32);
  const cek = await h(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await h(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['decrypt']);
  const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, key, cipher));
  return new TextDecoder().decode(plain.slice(0, plain.lastIndexOf(2)));
}

test('aes128gcm stimmt mit dem Beispiel aus RFC 8291 überein', async () => {
  const serverKeys = await ecdhPair(RFC.asPublic, RFC.asPrivate);
  const body = await encryptPayload({ p256dh: RFC.uaPublic, auth: RFC.auth }, enc.encode(RFC.plaintext), { salt: unb64u(RFC.salt), serverKeys });
  assert.equal(b64u(body), RFC.body);
});

test('Rundlauf: zufällige Schlüssel, Empfänger kann entschlüsseln', async () => {
  const ua = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const p256dh = b64u(await crypto.subtle.exportKey('raw', ua.publicKey));
  const auth = b64u(crypto.getRandomValues(new Uint8Array(16)));
  const msg = JSON.stringify({ title: '🌅 Zeit für deine Morgen-Challenge', body: 'Äöü – Umlaute bleiben heil' });
  const body = await encryptPayload({ p256dh, auth }, enc.encode(msg));
  assert.equal(await decrypt(body, ua, auth), msg);
});

test('VAPID-Header: gültige ES256-Signatur, aud = Ursprung des Endpunkts', async () => {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const pub = b64u(await crypto.subtle.exportKey('raw', pair.publicKey));
  const priv = (await crypto.subtle.exportKey('jwk', pair.privateKey)).d;
  const vapid = await importVapid(pub, priv);
  const h = await vapidHeader('https://fcm.googleapis.com/fcm/send/abc', vapid, 'https://aufwind-4er.pages.dev', 1_700_000_000_000);
  const m = h.match(/^vapid t=([^.]+)\.([^.]+)\.([^,]+), k=(.+)$/);
  assert.ok(m, h);
  const claims = JSON.parse(new TextDecoder().decode(unb64u(m[2])));
  assert.equal(claims.aud, 'https://fcm.googleapis.com');
  assert.equal(claims.exp, 1_700_000_000 + 12 * 3600);
  assert.equal(m[4], pub);
  const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pair.publicKey, unb64u(m[3]), enc.encode(`${m[1]}.${m[2]}`));
  assert.ok(ok);
});

// ---------- Zeitplan, Speicher-Schnittstelle, Worker ----------
import { localNow, dueReminders, reminderPayload } from '../push/schedule.js';
import { runReminders } from '../push/worker.js';
import { onRequest as pushApi } from '../functions/api/push.js';

function fakeKV() {
  const m = new Map();
  return {
    m,
    async get(k, t) { const v = m.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; },
    async put(k, v) { m.set(k, v); },
    async delete(k) { m.delete(k); },
    async list({ prefix }) { return { keys: [...m.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }; },
  };
}
const api = (env, body) => pushApi({ request: new Request('https://x/api/push', { method: 'POST', body: JSON.stringify(body) }), env });

async function realSubscription() {
  const ua = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  return { endpoint: 'https://fcm.googleapis.com/fcm/send/test123', keys: { p256dh: b64u(await crypto.subtle.exportKey('raw', ua.publicKey)), auth: b64u(crypto.getRandomValues(new Uint8Array(16))) } };
}
const ID = 'abcdefghijklmnopqrstuv';
const SECRET = 'S'.repeat(43);

test('Ortszeit: Winter- und Sommerzeit in Berlin', () => {
  assert.deepEqual(localNow('Europe/Berlin', new Date('2026-11-04T06:30:00Z')), { date: '2026-11-04', minutes: 7 * 60 + 30 });
  assert.deepEqual(localNow('Europe/Berlin', new Date('2026-07-01T05:30:00Z')), { date: '2026-07-01', minutes: 7 * 60 + 30 });
  assert.equal(localNow('Kein/Ort', new Date('2026-11-04T06:30:00Z')).minutes, 450); // Rückfall Berlin
});

test('Fällig ab der Uhrzeit bis eine Stunde danach, je Profil und Tageszeit', () => {
  const rec = { tz: 'Europe/Berlin', people: [{ pid: 'p1', name: 'Clemens', morning: '07:30', evening: '19:00' }, { pid: 'p2', name: 'Merle', morning: '', evening: '07:45' }] };
  const at = (utc) => dueReminders(rec, new Date(utc)).map((d) => `${d.pid}:${d.slot}`);
  assert.deepEqual(at('2026-11-04T06:29:00Z'), []);
  assert.deepEqual(at('2026-11-04T06:30:00Z'), ['p1:morning']);
  assert.deepEqual(at('2026-11-04T06:50:00Z'), ['p1:morning', 'p2:evening']);
  assert.deepEqual(at('2026-11-04T07:30:00Z'), ['p2:evening']);
  assert.match(reminderPayload({ name: 'Clemens', slot: 'evening' }).title, /Clemens.*Abend/);
});

test('API: anlegen, fremdes Geheimnis abgelehnt, nur bekannte Push-Dienste, erledigt-Marke, abmelden', async () => {
  const env = { AUFWIND_SYNC: fakeKV() };
  const sub = await realSubscription();
  const people = [{ pid: 'p1abc', name: 'Clemens', morning: '07:30', evening: '19:00' }];
  assert.equal((await api(env, { action: 'subscribe', id: ID, secret: SECRET, sub, tz: 'Europe/Berlin', people })).status, 200);
  const rec = JSON.parse(env.AUFWIND_SYNC.m.get(`push:${ID}`));
  assert.equal(rec.people[0].morning, '07:30');
  assert.ok(!JSON.stringify(rec).includes(SECRET), 'Geheimnis nur als Hash gespeichert');
  assert.equal((await api(env, { action: 'subscribe', id: ID, secret: 'X'.repeat(43), sub, people })).status, 403);
  assert.equal((await api(env, { action: 'subscribe', id: 'zzzzzzzzzzzzzzzzzzzzzz', secret: SECRET, sub: { ...sub, endpoint: 'https://boese.example/x' }, people })).status, 400);
  assert.equal((await api(env, { action: 'subscribe', id: 'zzzzzzzzzzzzzzzzzzzzzz', secret: SECRET, sub, people: [{ pid: 'p1abc', name: 'x', morning: '7 Uhr', evening: '' }] })).status, 400);
  assert.equal((await api(env, { action: 'done', pid: 'p1abc', date: '2026-11-04', slot: 'morning' })).status, 200);
  assert.equal(env.AUFWIND_SYNC.m.get('pushdone:p1abc:2026-11-04:morning'), '1');
  assert.equal((await pushApi({ request: new Request('https://x/api/push'), env })).status, 405);
  assert.equal((await api(env, { action: 'unsubscribe', id: ID, secret: SECRET })).status, 200);
  assert.ok(!env.AUFWIND_SYNC.m.has(`push:${ID}`));
});

test('Worker: sendet einmal, überspringt Erledigtes, entfernt abgelaufene Abos', async () => {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const env = {
    AUFWIND_SYNC: fakeKV(),
    VAPID_PUBLIC: b64u(await crypto.subtle.exportKey('raw', pair.publicKey)),
    VAPID_PRIVATE: (await crypto.subtle.exportKey('jwk', pair.privateKey)).d,
  };
  const people = [{ pid: 'p1abc', name: 'Clemens', morning: '07:30', evening: '07:30' }];
  await api(env, { action: 'subscribe', id: ID, secret: SECRET, sub: await realSubscription(), tz: 'Europe/Berlin', people });
  await api(env, { action: 'done', pid: 'p1abc', date: '2026-11-04', slot: 'evening' });
  const calls = [];
  const fetchFn = async (url, init) => { calls.push({ url, init }); return new Response(null, { status: 201 }); };
  const now = new Date('2026-11-04T06:35:00Z');
  const s1 = await runReminders(env, now, fetchFn);
  assert.equal(s1.sent, 1);
  assert.equal(s1.skipped, 1);
  assert.equal(calls[0].init.headers['Content-Encoding'], 'aes128gcm');
  assert.match(calls[0].init.headers.Authorization, /^vapid t=.+, k=/);
  assert.equal((await runReminders(env, new Date('2026-11-04T06:40:00Z'), fetchFn)).sent, 0, 'nicht doppelt');
  // Push-Dienst meldet: Abo gibt es nicht mehr → wird gelöscht
  env.AUFWIND_SYNC.m.delete(`pushsent:${ID}:p1abc:morning`);
  const s3 = await runReminders(env, now, async () => new Response(null, { status: 410 }));
  assert.equal(s3.removed, 1);
  assert.ok(!env.AUFWIND_SYNC.m.has(`push:${ID}`));
});
