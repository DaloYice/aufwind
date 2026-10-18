import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRecords, addSession, updateSession, removeSession, restoreSession, addLogEntry, removeLogEntry, restoreLogEntry, sessionId } from '../js/core/records.js';
import { mergeProfile } from '../js/core/syncdata.js';
import { challengeFor, swapExercise, swapOptions, canSwap } from '../js/core/challenges.js';
import { streak } from '../js/core/progress.js';
import { addDays } from '../js/core/dates.js';
import { byId } from '../js/data/exercises.js';

const prof = (o = {}) => normalizeRecords({ id: 'p1', createdAt: '2026-10-01', updatedAt: '2026-10-10T10:00:00Z', level: 2, intensity: 1, sessions: [], habits: {}, water: {}, badges: {}, logs: { weight: [] }, ...o });

test('Alte Einheiten bekommen auf jedem Gerät dieselbe ID', () => {
  const s = { date: '2026-10-01', slot: 'extra', title: 'Rad', durationSec: 600 };
  assert.equal(sessionId({ ...s }), sessionId({ ...s }));
  assert.notEqual(sessionId(s), sessionId({ ...s, date: '2026-10-02' }));
  const p = prof({ sessions: [{ ...s }], removedLogs: ['weight:2026-10-02'] });
  assert.ok(p.sessions[0].id);
  assert.ok(p.removedAt['log:weight:2026-10-02']);
  assert.equal(p.removedLogs, undefined);
});

test('Teil-Einheit wird durch die vollständige ersetzt, nie doppelt', () => {
  const p = prof();
  const a = addSession(p, { date: '2026-10-18', slot: 'morning', partial: true, durationSec: 120 });
  assert.ok(a.added);
  const b = addSession(p, { date: '2026-10-18', slot: 'morning', durationSec: 400, feedback: 'passt' });
  assert.ok(b.upgraded);
  assert.equal(p.sessions.length, 1);
  assert.equal(p.sessions[0].partial, undefined);
  assert.equal(p.sessions[0].durationSec, 400);
  assert.equal(p.sessions[0].id, a.session.id);
  // Teil-Einheit nach vollständiger ändert nichts
  addSession(p, { date: '2026-10-18', slot: 'morning', partial: true, durationSec: 60 });
  assert.equal(p.sessions.length, 1);
  assert.equal(p.sessions[0].durationSec, 400);
  // Freie Bewegung darf mehrfach am Tag
  addSession(p, { date: '2026-10-18', slot: 'extra', durationSec: 600 });
  addSession(p, { date: '2026-10-18', slot: 'extra', durationSec: 600 });
  assert.equal(p.sessions.length, 3);
});

test('Nachgetragene Bewegung von gestern hält die Serie', () => {
  const today = '2026-10-18';
  const p = prof();
  for (let i = 5; i >= 2; i--) addSession(p, { date: addDays(today, -i), slot: 'extra', durationSec: 600 });
  addSession(p, { date: today, slot: 'extra', durationSec: 600 });
  const before = streak(p, today).count;
  addSession(p, { date: addDays(today, -1), slot: 'extra', durationSec: 600 });
  assert.ok(streak(p, today).count >= before);
  assert.equal(streak(p, today).count, 6);
});

test('Einheit löschen, rückgängig machen und bearbeiten', () => {
  const p = prof();
  const { session } = addSession(p, { date: '2026-10-18', slot: 'extra', title: 'Rad', durationSec: 600 });
  const removed = removeSession(p, session.id);
  assert.equal(p.sessions.length, 0);
  assert.ok(p.removedAt[`s:${session.id}`]);
  restoreSession(p, removed);
  assert.equal(p.sessions.length, 1);
  updateSession(p, session.id, { durationSec: 1200, date: '2026-10-17' });
  assert.equal(p.sessions[0].durationSec, 1200);
  assert.equal(p.sessions[0].date, '2026-10-17');
});

test('Abgleich: Gelöschtes bleibt gelöscht, Wiederhergestelltes bleibt da', async () => {
  const base = { date: '2026-10-18', slot: 'extra', title: 'Rad', durationSec: 600 };
  const pc = prof({ updatedAt: '2026-10-18T08:00:00Z' });
  const { session } = addSession(pc, base);
  const phone = prof({ updatedAt: '2026-10-18T08:00:00Z', sessions: [JSON.parse(JSON.stringify(session))] });

  // Handy löscht → PC hat die Einheit noch → Löschung gewinnt
  await new Promise((r) => setTimeout(r, 5));
  removeSession(phone, session.id);
  phone.updatedAt = '2026-10-18T09:00:00Z';
  let m = mergeProfile(pc, phone);
  assert.equal(m.sessions.length, 0);
  assert.equal(mergeProfile(phone, pc).sessions.length, 0);

  // Rückgängig nach dem Abgleich → Einheit kommt zurück, obwohl der Löschmerker noch existiert
  await new Promise((r) => setTimeout(r, 5));
  restoreSession(phone, session);
  phone.updatedAt = '2026-10-18T09:05:00Z';
  m = mergeProfile(m, phone);
  assert.equal(m.sessions.length, 1);

  // Bearbeitung auf einem Gerät gewinnt gegenüber älterer Fassung
  await new Promise((r) => setTimeout(r, 5));
  updateSession(phone, session.id, { durationSec: 900 });
  m = mergeProfile({ ...pc, updatedAt: '2026-10-18T10:00:00Z' }, phone);
  assert.equal(m.sessions[0].durationSec, 900);
});

test('Abgleich: zwei Geräte mit Morgen-Challenge am selben Tag → einmal, vollständige gewinnt', () => {
  const a = prof({ updatedAt: '2026-10-18T09:00:00Z' });
  const b = prof({ updatedAt: '2026-10-18T08:00:00Z' });
  addSession(a, { date: '2026-10-18', slot: 'morning', partial: true, durationSec: 100 });
  addSession(b, { date: '2026-10-18', slot: 'morning', durationSec: 400 });
  const m = mergeProfile(a, b);
  assert.equal(m.sessions.length, 1);
  assert.equal(m.sessions[0].durationSec, 400);
});

test('Messwert: löschen, auf anderem Gerät noch vorhanden, später neu eintragen', async () => {
  const a = prof();
  addLogEntry(a, 'weight', 100, '2026-10-17');
  const b = prof({ logs: JSON.parse(JSON.stringify(a.logs)) });
  await new Promise((r) => setTimeout(r, 5));
  const e = removeLogEntry(a, 'weight', '2026-10-17');
  a.updatedAt = '2026-10-18T00:00:00Z';
  assert.equal(mergeProfile(a, b).logs.weight.length, 0);
  await new Promise((r) => setTimeout(r, 5));
  restoreLogEntry(a, 'weight', e);
  assert.equal(mergeProfile(a, b).logs.weight.length, 1);
});

test('Übung tauschen: gleicher Bereich, im Level, reihum, nur für den Tag', () => {
  const date = '2026-10-18';
  const p = prof({ level: 2 });
  for (const slot of ['morning', 'evening']) {
    const c = challengeFor(slot, date, p);
    const target = c.steps.find((s) => canSwap(slot, date, p, s.id));
    assert.ok(target, `${slot}: mindestens eine Übung tauschbar`);
    const before = byId[target.id];
    const to = swapExercise(p, slot, date, target.id);
    const after = challengeFor(slot, date, p);
    assert.ok(after.steps.some((s) => s.id === to));
    assert.ok(!after.steps.some((s) => s.id === target.id));
    assert.equal(byId[to].cat, before.cat);
    assert.notEqual(byId[to].base[p.level - 1], null);
    if (slot === 'morning') assert.notEqual(byId[to].pos, 'boden');
    // Keine Übung doppelt in der Einheit (je Runde)
    const ids = after.steps.filter((s) => s.round === 1).map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length);
    // Reihum zurück zur ursprünglichen Übung
    const n = swapOptions(slot, date, p, to).length;
    let cur = to;
    for (let i = 1; i < n; i++) cur = swapExercise(p, slot, date, cur);
    assert.equal(cur, target.id);
    assert.deepEqual(p.swaps[`${date}|${slot}`], {});
    // Anderer Tag bleibt unberührt
    assert.deepEqual(challengeFor(slot, '2026-10-19', p), challengeFor(slot, '2026-10-19', prof({ level: 2 })));
  }
});

test('Tausch passt die Menge an die neue Übung an und räumt alte Tage auf', () => {
  const p = prof({ level: 3, swaps: { '2026-10-01|morning': { a: 'b' } } });
  const c = challengeFor('morning', '2026-10-18', p);
  const id = c.steps.find((s) => canSwap('morning', '2026-10-18', p, s.id)).id;
  const to = swapExercise(p, 'morning', '2026-10-18', id);
  const step = challengeFor('morning', '2026-10-18', p).steps.find((s) => s.id === to);
  assert.ok(step.amount > 0);
  assert.equal(p.swaps['2026-10-01|morning'], undefined);
});

test('Gewohnheit tauschen: anders als vorher, nur für den Tag, irgendwann alle durch', async () => {
  const { habitOfDay, swapHabit } = await import('../js/core/challenges.js');
  const { HABITS } = await import('../js/data/habits.js');
  const p = prof();
  const first = habitOfDay('2026-10-18', p);
  const seen = new Set([first.id]);
  for (let i = 0; i < HABITS.length - 1; i++) {
    const h = swapHabit(p, '2026-10-18');
    assert.equal(habitOfDay('2026-10-18', p).id, h.id);
    seen.add(h.id);
  }
  assert.equal(seen.size, HABITS.length);
  assert.deepEqual(habitOfDay('2026-10-19', p), habitOfDay('2026-10-19', prof()));
  swapHabit(p, '2026-10-19');
  assert.deepEqual(Object.keys(p.habitSwap), ['2026-10-19']);
});
