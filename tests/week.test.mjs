import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weekStart, weekStats, reviewDue, suggestGoal, familyProgress, weekGoal } from '../js/core/week.js';
import { PROGRAMS, programState, programSession } from '../js/data/programs.js';
import { byId, forLevel } from '../js/data/exercises.js';
import { addDays } from '../js/core/dates.js';

const prof = (dates, extra = {}) => ({
  id: 'a', name: 'A', createdAt: '2026-09-01', level: 2,
  sessions: dates.map((date) => ({ date, slot: 'morning', durationSec: 600 })),
  habits: {}, water: {}, logs: { weight: [] }, ...extra,
});

test('Wochenstart ist Montag', () => {
  assert.equal(weekStart('2026-10-17'), '2026-10-12'); // Samstag
  assert.equal(weekStart('2026-10-12'), '2026-10-12'); // Montag
  assert.equal(weekStart('2026-10-18'), '2026-10-12'); // Sonntag
});

test('Wochenstatistik', () => {
  const p = prof(['2026-10-12', '2026-10-12', '2026-10-14', '2026-10-19'], {
    water: { '2026-10-12': 6, '2026-10-13': 3 },
    logs: { weight: [{ date: '2026-10-05', value: 120 }, { date: '2026-10-15', value: 119.2 }] },
  });
  const s = weekStats(p, '2026-10-12');
  assert.equal(s.sessions, 3);
  assert.equal(s.activeDays, 2);
  assert.equal(s.minutes, 30);
  assert.equal(s.waterDays, 1);
  assert.equal(s.weightDelta, -0.8);
  assert.equal(s.goal, 4);
  assert.equal(s.reached, false);
  assert.equal(s.bestDay, '2026-10-12');
});

test('Wochenziel pro Woche überschreibbar', () => {
  const p = prof([], { weekGoals: { '2026-10-12': 6 } });
  assert.equal(weekGoal(p, '2026-10-12'), 6);
  assert.equal(weekGoal(p, '2026-10-19'), 4);
});

test('Rückblick fällig einmal pro Woche', () => {
  const p = prof([]);
  assert.equal(reviewDue(p, '2026-10-17'), '2026-10-05');
  p.lastReview = '2026-10-05';
  assert.equal(reviewDue(p, '2026-10-17'), null);
  assert.equal(reviewDue(prof([], { createdAt: '2026-10-13' }), '2026-10-17'), null);
});

test('Zielvorschlag', () => {
  assert.equal(suggestGoal({ reached: true, goal: 4, activeDays: 5 }), 5);
  assert.equal(suggestGoal({ reached: true, goal: 7, activeDays: 7 }), 7);
  assert.equal(suggestGoal({ reached: false, goal: 4, activeDays: 1 }), 3);
  assert.equal(suggestGoal({ reached: false, goal: 4, activeDays: 3 }), 4);
});

test('Familien-Challenge summiert Minuten der Woche', () => {
  const f = familyProgress([prof(['2026-10-13']), { ...prof(['2026-10-14', '2026-10-01']), id: 'b' }], 60, '2026-10-17');
  assert.equal(f.total, 20);
  assert.equal(f.pct, 33);
  assert.equal(f.members.length, 2);
});

test('Programme: vollständige Pläne mit gültigen Übungen', () => {
  for (const p of PROGRAMS) {
    assert.equal(p.plan.length, p.weeks, p.id);
    for (const week of p.plan) for (const s of week) assert.ok(byId[s.id], `${p.id}: ${s.id}`);
  }
});

test('Gehprogramme steigern die Gehzeit bis zum Ziel', () => {
  for (const id of ['geh-start', 'geh-30']) {
    const p = PROGRAMS.find((x) => x.id === id);
    const walkMin = p.plan.map((w) => w.filter((s) => s.id === 'gehen').reduce((t, s) => t + s.amount, 0) / 60);
    for (let i = 1; i < walkMin.length; i++) assert.ok(walkMin[i] >= walkMin[i - 1], `${id} Woche ${i + 1}`);
    const longest = Math.max(...p.plan.at(-1).filter((s) => s.id === 'gehen').map((s) => s.amount)) / 60;
    assert.equal(longest, id === 'geh-start' ? 15 : 30);
  }
});

test('Programmstand und nächste Einheit', () => {
  const active = { id: 'geh-30', startedAt: '2026-10-01', done: Array.from({ length: 4 }, (_, i) => addDays('2026-10-01', i)) };
  const st = programState(active);
  assert.equal(st.week, 2);
  assert.equal(st.session, 2);
  const s = programSession(active);
  assert.equal(s.rest, 0);
  assert.ok(s.minutes >= 15);
  const fin = programState({ id: 'kraft-basis', done: Array(18).fill('x') });
  assert.equal(fin.finished, true);
  assert.equal(programSession({ id: 'kraft-basis', done: Array(18).fill('x') }), null);
});

test('Erholungsgehen taucht nicht in Zufalls-Challenges auf', () => {
  for (let l = 1; l <= 5; l++) assert.ok(!forLevel(l).some((e) => e.id === 'langsamgehen'));
});
