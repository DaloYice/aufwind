import { test } from 'node:test';
import assert from 'node:assert/strict';
import { customWorkout } from '../js/core/custom.js';
import { challengeFor, swapOptions } from '../js/core/challenges.js';
import { recordExercises, exStats, mergeExLog } from '../js/core/exlog.js';
import { mergeProfile } from '../js/core/syncdata.js';
import { normalizeRecords } from '../js/core/records.js';
import { STRAIN, FOCUS, QUICK_MINUTES } from '../js/data/focus.js';
import { byId } from '../js/data/exercises.js';

const D = '2026-10-18';
const prof = (o = {}) => normalizeRecords({ id: 'p1', level: 3, intensity: 1, sessions: [], habits: {}, water: {}, badges: {}, logs: {}, checkins: {}, exLog: {}, ...o });

test('Fokus- und Belastungsdaten verweisen nur auf echte Übungen', () => {
  for (const ids of Object.values(STRAIN)) for (const id of ids) assert.ok(byId[id], id);
  for (const f of Object.values(FOCUS)) for (const id of [...(f.ids || []), ...(f.exclude || [])]) assert.ok(byId[id], id);
});

test('Wunsch-Training: passende Dauer, nur Level-Übungen, stabil, „Neu mischen“ ändert etwas', () => {
  for (const level of [1, 2, 3, 4, 5]) for (const focus of Object.keys(FOCUS)) for (const minutes of QUICK_MINUTES) {
    const p = prof({ level });
    const c = customWorkout({ minutes, focus }, p, D);
    assert.ok(c.steps.length >= 2, `${level}/${focus}/${minutes}`);
    assert.ok(c.minutes >= minutes * 0.6 && c.minutes <= minutes + 3, `${level}/${focus}/${minutes}: ${c.minutes} Min`);
    for (const s of c.steps) assert.notEqual(byId[s.id].base[level - 1], null, `${s.id} nicht in Level ${level}`);
    if (level <= 2) assert.ok(c.steps.every((s) => byId[s.id].pos !== 'boden'));
    assert.deepEqual(c, customWorkout({ minutes, focus }, p, D));
  }
  const p = prof();
  const a = customWorkout({ minutes: 15, focus: 'ganzkoerper' }, p, D).steps.map((s) => s.id).join();
  const mixes = [1, 2, 3].map((mix) => customWorkout({ minutes: 15, focus: 'ganzkoerper', mix }, p, D).steps.map((s) => s.id).join());
  assert.ok(mixes.some((m) => m !== a));
});

test('Befinden: Beschwerden → keine belastenden Übungen, wenig Energie → kleinere Mengen', () => {
  for (const pain of [['knie'], ['schulter', 'handgelenk'], ['knie', 'huefte', 'ruecken']]) {
    for (const level of [1, 3, 5]) {
      const p = prof({ level, checkins: { [D]: { energy: 2, mood: 2, pain } } });
      const bad = new Set(pain.flatMap((r) => STRAIN[r]));
      for (const slot of ['morning', 'evening']) {
        const c = challengeFor(slot, D, p);
        assert.ok(c.steps.length > 0);
        assert.ok(!c.steps.some((s) => bad.has(s.id)), `${slot} L${level} ${pain}: ${c.steps.map((s) => s.id)}`);
        assert.match(c.adapted, /schont/);
        for (const s of c.steps) assert.ok(!swapOptions(slot, D, p, s.id).some((e) => bad.has(e.id)));
      }
      for (const focus of Object.keys(FOCUS)) assert.ok(!customWorkout({ minutes: 10, focus }, p, D).steps.some((s) => bad.has(s.id)), focus);
    }
  }
  const normal = challengeFor('evening', D, prof());
  const tired = challengeFor('evening', D, prof({ checkins: { [D]: { energy: 1, mood: 2, pain: [] } } }));
  assert.ok(tired.durationSec < normal.durationSec);
  assert.equal(challengeFor('evening', '2026-10-19', prof({ checkins: { [D]: { energy: 1, pain: ['knie'] } } })).adapted, undefined);
});

test('Verlauf je Übung: Bestwert erst ab dem zweiten Mal, je Tag der größte Wert', () => {
  const p = prof();
  assert.deepEqual(recordExercises(p, '2026-10-10', [{ id: 'kniebeuge', amount: 8 }, { id: 'kniebeuge', amount: 10 }]), []);
  assert.equal(exStats(p, 'kniebeuge').best, 10);
  assert.deepEqual(recordExercises(p, '2026-10-12', [{ id: 'kniebeuge', amount: 9 }]), []);
  const rec = recordExercises(p, '2026-10-14', [{ id: 'kniebeuge', amount: 12 }, { id: 'tischplank', amount: 0 }]);
  assert.deepEqual(rec, [{ id: 'kniebeuge', amount: 12, prev: 10 }]);
  const st = exStats(p, 'kniebeuge');
  assert.deepEqual([st.days, st.best, st.last, st.lastDate], [3, 12, 12, '2026-10-14']);
  assert.equal(exStats(p, 'tischplank'), null);
});

test('Abgleich: Befinden und Übungsverlauf beider Geräte bleiben erhalten', () => {
  const a = prof({ updatedAt: '2026-10-18T10:00:00Z', checkins: { [D]: { energy: 1, pain: ['knie'] } }, exLog: { kniebeuge: [{ date: D, best: 10 }] } });
  const b = prof({ updatedAt: '2026-10-18T09:00:00Z', checkins: { '2026-10-17': { energy: 3 } }, exLog: { kniebeuge: [{ date: D, best: 12 }, { date: '2026-10-17', best: 9 }], aufstehen: [{ date: D, best: 5 }] } });
  const m = mergeProfile(a, b);
  assert.deepEqual(Object.keys(m.checkins).sort(), ['2026-10-17', D]);
  assert.deepEqual(m.exLog.kniebeuge, [{ date: '2026-10-17', best: 9 }, { date: D, best: 12 }]);
  assert.ok(m.exLog.aufstehen);
  assert.deepEqual(mergeExLog(a.exLog, b.exLog), mergeExLog(b.exLog, a.exLog));
});
