import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newCode, normalizeCode, isValidCode, formatCode, syncId, encryptJSON, decryptJSON, mergePayload, mergeProfile, payloadOf } from '../js/core/syncdata.js';
import { onRequest } from '../functions/api/sync/[id].js';

test('Sync-Code: 32 Zeichen Base32, Eingabe wird gesäubert', () => {
  const c = newCode();
  assert.equal(c.length, 32);
  assert.match(c, /^[A-Z2-7]+$/);
  assert.notEqual(c, newCode());
  assert.equal(normalizeCode(formatCode(c).toLowerCase()), c);
  assert.ok(isValidCode(formatCode(c)));
  assert.ok(!isValidCode('ABC'));
});

test('Sync-ID ist stabil und verrät den Code nicht', async () => {
  const c = newCode();
  const id = await syncId(c);
  assert.match(id, /^[a-f0-9]{32}$/);
  assert.equal(id, await syncId(formatCode(c)));
  assert.ok(!id.includes(c.toLowerCase().slice(0, 8)));
});

test('Verschlüsselung: Hin und zurück, falscher Code scheitert', async () => {
  const c = newCode();
  const data = { profiles: [{ id: 'a', name: 'Äöü 💪' }] };
  const blob = await encryptJSON(c, data);
  assert.ok(!blob.includes('Äöü'));
  assert.deepEqual(await decryptJSON(c, blob), data);
  await assert.rejects(decryptJSON(newCode(), blob));
});

const prof = (o) => ({ id: 'p1', createdAt: '2026-10-01', updatedAt: '2026-10-10T10:00:00Z', name: 'A', level: 2, sessions: [], habits: {}, water: {}, badges: {}, logs: { weight: [] }, ...o });

test('Zusammenführen: Einheiten beider Geräte bleiben, neuerer Stand gewinnt bei Einzelwerten', () => {
  const phone = prof({ updatedAt: '2026-10-17T08:00:00Z', level: 3, sessions: [{ date: '2026-10-17', slot: 'morning', durationSec: 200 }], water: { '2026-10-17': 2 } });
  const pc = prof({ updatedAt: '2026-10-16T20:00:00Z', level: 2, sessions: [{ date: '2026-10-16', slot: 'evening', durationSec: 400 }, { date: '2026-10-17', slot: 'morning', durationSec: 180 }], water: { '2026-10-17': 4 } });
  const m = mergeProfile(phone, pc);
  assert.equal(m.level, 3);
  assert.equal(m.sessions.length, 2); // Morgen 17.10. nur einmal
  assert.equal(m.water['2026-10-17'], 4);
  assert.deepEqual(m.sessions.map((s) => s.date), ['2026-10-16', '2026-10-17']);
});

test('Zusammenführen: gelöschte Messwerte und Profile kommen nicht zurück', () => {
  const a = prof({ logs: { weight: [{ date: '2026-10-01', value: 120 }] }, removedLogs: ['weight:2026-10-02'] });
  const b = prof({ updatedAt: '2026-10-01T00:00:00Z', logs: { weight: [{ date: '2026-10-01', value: 120 }, { date: '2026-10-02', value: 119 }] } });
  assert.equal(mergeProfile(a, b).logs.weight.length, 1);
  const merged = mergePayload(
    { profiles: [a], deletedProfiles: ['p2'] },
    { profiles: [b, prof({ id: 'p2', name: 'Weg' }), prof({ id: 'p3', name: 'Neu', createdAt: '2026-10-05' })], deletedProfiles: [] },
  );
  assert.deepEqual(merged.profiles.map((p) => p.id), ['p1', 'p3']);
  assert.deepEqual(merged.deletedProfiles, ['p2']);
});

test('Zusammenführen ist symmetrisch genug: beide Richtungen liefern dieselben Einheiten', () => {
  const a = { profiles: [prof({ sessions: [{ date: '2026-10-01', slot: 'extra', title: 'Rad', durationSec: 600 }] })] };
  const b = { profiles: [prof({ updatedAt: '2026-10-11T00:00:00Z', sessions: [{ date: '2026-10-02', slot: 'program', title: 'Geh', durationSec: 300 }] })] };
  assert.deepEqual(mergePayload(a, b).profiles[0].sessions, mergePayload(b, a).profiles[0].sessions);
});

test('payloadOf lässt gerätespezifische Einstellungen weg', () => {
  const pl = payloadOf({ profiles: [], activeId: 'x', settings: { speech: false, notify: true, familyGoal: 200, familyGoalAt: 't' } });
  assert.deepEqual(Object.keys(pl).sort(), ['deletedProfiles', 'familyGoal', 'familyGoalAt', 'profiles']);
});

// ---------- Server-Funktion mit Test-KV ----------
function kvMock() {
  const m = new Map();
  return { m, async get(k, t) { const v = m.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; }, async put(k, v) { m.set(k, v); }, async delete(k) { m.delete(k); } };
}
const call = (method, id, body, env) => onRequest({
  request: new Request(`http://x/api/sync/${id}`, { method, body: body ? JSON.stringify(body) : undefined }),
  env, params: { id },
});

test('Server: speichern, laden, Konflikt erkennen, Eingaben prüfen', async () => {
  const env = { AUFWIND_SYNC: kvMock() };
  const id = 'a'.repeat(32);
  assert.equal((await call('GET', id, null, env)).status, 404);
  const r1 = await call('PUT', id, { v: 0, data: 'abc' }, env);
  assert.equal(r1.status, 200);
  assert.equal((await r1.json()).v, 1);
  const g = await (await call('GET', id, null, env)).json();
  assert.equal(g.data, 'abc');
  assert.equal(g.v, 1);
  assert.equal((await call('PUT', id, { v: 0, data: 'alt' }, env)).status, 409);
  assert.equal((await call('PUT', id, { v: 1, data: 'neu' }, env)).status, 200);
  assert.equal((await call('GET', 'nicht-hex', null, env)).status, 400);
  assert.equal((await call('PUT', id, { v: 'x', data: 1 }, env)).status, 400);
  assert.equal((await call('GET', id, null, {})).status, 503);
  assert.equal((await call('POST', id, null, env)).status, 405);
});
