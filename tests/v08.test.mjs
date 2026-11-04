import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, JUMP_LEVEL, assess } from '../js/core/assessment.js';
import { EXERCISES, EQUIPMENT, byId, forLevel } from '../js/data/exercises.js';
import { FOCUS, STRAIN, intervalFor, focusAvailable } from '../js/data/focus.js';
import { WORLDS } from '../js/data/worlds.js';
import { PROGRAMS, programSession } from '../js/data/programs.js';
import { morningChallenge, eveningChallenge, challengeFor, exerciseSeconds, swapOptions } from '../js/core/challenges.js';
import { customWorkout } from '../js/core/custom.js';
import { levelSuggestion, MAX_LEVEL } from '../js/core/progress.js';

const D = '2026-11-04';
const days = (n = 28) => Array.from({ length: n }, (_, i) => `2026-11-${String(i + 1).padStart(2, '0')}`);
const prof = (level, extra = {}) => ({ id: 'p', level, intensity: 1, checkins: {}, ...extra });
const ALL_GEAR = Object.keys(EQUIPMENT);
const isMain = (c) => (s) => s !== c.steps[c.steps.length - 1];

test('Acht Level, jede Stufe hat genug Übungen in allen Bereichen', () => {
  assert.equal(LEVELS.length, 8);
  assert.equal(MAX_LEVEL, LEVELS.length);
  for (let l = 1; l <= 8; l++) {
    for (const cat of ['mobil', 'kraft', 'ausdauer', 'balance', 'entspannung']) {
      assert.ok(forLevel(l, cat).length >= 1, `Level ${l}: ${cat}`);
    }
    assert.ok(forLevel(l, 'kraft').length >= 4, `Level ${l}: Kraft`);
  }
});

test('Sprünge erst ab Level 6, alle Sprünge belasten die Knie (Befinden)', () => {
  const jumps = EXERCISES.filter((e) => e.jump);
  assert.ok(jumps.length >= 6);
  for (const e of jumps) {
    assert.ok(e.base.slice(0, JUMP_LEVEL - 1).every((v) => v == null), e.id);
    assert.ok(STRAIN.knie.includes(e.id), e.id);
  }
  for (const id of Object.values(STRAIN).flat()) assert.ok(byId[id], `STRAIN kennt ${id} nicht`);
});

test('Geräte-Übungen nur mit passender Ausstattung', () => {
  for (const e of EXERCISES.filter((x) => x.equip)) assert.ok(e.equip.every((g) => EQUIPMENT[g]), e.id);
  for (const date of days()) for (const level of [4, 6, 8]) {
    for (const c of [morningChallenge(date, prof(level)), eveningChallenge(date, prof(level))]) {
      assert.ok(!c.steps.some((s) => byId[s.id].equip), `${date} L${level}`);
    }
  }
  const seen = new Set();
  for (const date of days()) {
    const p = prof(7, { equipment: ['stange', 'kettlebell'] });
    for (const c of [morningChallenge(date, p), eveningChallenge(date, p)]) {
      for (const s of c.steps) {
        const e = byId[s.id];
        if (e.equip) { seen.add(s.id); assert.ok(e.equip.some((g) => ['stange', 'kettlebell'].includes(g)), s.id); }
      }
    }
  }
  assert.ok(seen.size >= 2, [...seen].join());
});

test('Morgens weder Boden noch Stange – auch mit Ausstattung', () => {
  for (const date of days()) {
    const c = morningChallenge(date, prof(8, { equipment: ALL_GEAR }));
    assert.ok(c.steps.every((s) => !['boden', 'haengend'].includes(byId[s.id].pos)), date);
  }
});

test('„Sprünge weglassen“ gilt für Challenges, Tausch und Wunsch-Training', () => {
  const p = prof(8, { noJumps: true, equipment: ALL_GEAR });
  for (const date of days()) {
    for (const slot of ['morning', 'evening']) {
      const c = challengeFor(slot, date, p);
      assert.ok(!c.steps.some((s) => byId[s.id].jump), `${date} ${slot}`);
      for (const s of c.steps) assert.ok(!swapOptions(slot, date, p, s.id).some((e) => e.jump && e.id !== s.id));
    }
  }
  for (let mix = 0; mix < 8; mix++) {
    const c = customWorkout({ minutes: 20, focus: 'hiit', mix }, p, D);
    assert.ok(!c.steps.some((s) => byId[s.id].jump), `mix ${mix}`);
  }
});

test('Fitte Level bekommen fordernde Einheiten (Level 8 deutlich mehr als Level 5)', () => {
  const mins = (level) => days(14).reduce((t, d) => t + eveningChallenge(d, prof(level)).minutes, 0) / 14;
  assert.ok(mins(8) > mins(5) * 1.4, `${mins(5)} → ${mins(8)}`);
  assert.ok(mins(8) >= 18 && mins(8) <= 55, String(mins(8)));
  const seenJump = days().some((d) => eveningChallenge(d, prof(7)).steps.some((s) => byId[s.id].jump));
  assert.ok(seenJump);
  assert.equal(morningChallenge(D, prof(7)).title, 'Morgen-Workout');
});

test('Intervall-Abend ab Level 6: alles auf Zeit mit fester Pause, bis Level 5 nie', () => {
  let found = 0;
  for (const date of days()) {
    for (const level of [1, 3, 5]) assert.ok(!eveningChallenge(date, prof(level)).interval, `${date} L${level}`);
    const c = eveningChallenge(date, prof(7));
    if (!c.interval) continue;
    found++;
    const [work, pause] = intervalFor(7);
    assert.equal(c.rest, pause);
    assert.ok(c.fixedRest);
    for (const s of c.steps.filter(isMain(c))) {
      assert.equal(s.unit, 'sek');
      assert.equal(exerciseSeconds(s), work, s.id);
    }
  }
  assert.ok(found >= 2, `nur ${found} Intervall-Abende`);
});

test('Gehen/Laufen nie als Runde im Herz-Kreislauf-Abend, ab Level 6 Lauf-Abend', () => {
  for (const date of days()) for (const level of [3, 5, 7]) {
    const c = eveningChallenge(date, prof(level));
    const walks = c.steps.filter((s) => ['gehen', 'joggen'].includes(s.id));
    if (/Spazier|Lauf/.test(c.title)) {
      assert.equal(walks.length, 1);
      if (level >= 6) assert.equal(c.title, 'Lauf-Abend');
    } else assert.equal(walks.length, 0, `${date} L${level} ${c.title}`);
  }
});

test('HIIT-Wunsch-Training: Zeit statt Wiederholungen, Pause nach Level', () => {
  for (const level of [4, 6, 8]) {
    const c = customWorkout({ minutes: 15, focus: 'hiit' }, prof(level), D);
    const [work, pause] = intervalFor(level);
    assert.ok(c.interval && c.fixedRest);
    assert.equal(c.rest, pause);
    const main = c.steps.filter((s) => s.unit);
    assert.ok(main.length >= 6);
    for (const s of main) assert.equal(exerciseSeconds(s), byId[s.id].perSide ? Math.max(20, Math.round(work / 10) * 10) : work, s.id);
    assert.ok(Math.abs(c.minutes - 15) <= 3, String(c.minutes));
  }
});

test('Sprungkraft nur mit Sprüngen, Geräte nur mit Geräten', () => {
  for (let mix = 0; mix < 6; mix++) {
    const j = customWorkout({ minutes: 15, focus: 'sprung', mix }, prof(7), D);
    assert.ok(j.steps.filter((s) => ['kraft', 'ausdauer'].includes(byId[s.id].cat)).every((s) => byId[s.id].jump), `mix ${mix}`);
    // Mit genug Geräte-Übungen besteht der Hauptteil nur daraus (bei sehr wenigen wird mit Körpergewicht aufgefüllt)
    const gear = ['kurzhantel', 'band'];
    const g = customWorkout({ minutes: 15, focus: 'geraete', mix }, prof(6, { equipment: gear }), D);
    const main = g.steps.filter((s) => ['kraft', 'ausdauer', 'balance'].includes(byId[s.id].cat));
    assert.ok(main.length && main.every((s) => byId[s.id].equip?.some((x) => gear.includes(x))), `mix ${mix}`);
  }
  assert.ok(!focusAvailable(FOCUS.sprung, prof(5)));
  assert.ok(focusAvailable(FOCUS.sprung, prof(6)));
  assert.ok(!focusAvailable(FOCUS.sprung, prof(8, { noJumps: true })));
  assert.ok(!focusAvailable(FOCUS.geraete, prof(8)));
  assert.ok(focusAvailable(FOCUS.geraete, prof(2, { equipment: ['band'] })));
  assert.ok(!focusAvailable(FOCUS.hiit, prof(3)));
  for (const w of Object.values(WORLDS)) assert.ok(FOCUS[w.focus], w.title);
});

test('Einstufung: Fitte landen auf 6–8, Sicherheitsdeckel greifen', () => {
  const top = { walk: 3, chairStand: 2, stairs: 2, joints: 0, activeDays: 3 };
  assert.equal(assess({ ...top, pushups: 0, run: 0 }).level, 5);
  assert.equal(assess({ ...top, pushups: 2, run: 2 }).level, 6);
  assert.equal(assess({ ...top, pushups: 3, run: 2 }).level, 7);
  assert.equal(assess({ ...top, pushups: 4, run: 3 }).level, 8);
  const bmi31 = assess({ ...top, pushups: 4, run: 3, heightCm: 180, weightKg: 101 });
  assert.equal(bmi31.level, JUMP_LEVEL - 1);
  assert.equal(bmi31.max, JUMP_LEVEL - 1);
  assert.equal(assess({ ...top, joints: 1, pushups: 4, run: 3 }).level, JUMP_LEVEL);
  assert.equal(assess({ ...top, pushups: 4, run: 3, age: 72 }).level, 3);
  assert.equal(assess({ ...top, pushups: 4, run: 3, flags: ['heart'] }).level, 3);
  // Einsteiger unverändert: neue Fragen heben niemanden aus Level 1–4 heraus
  assert.equal(assess({ walk: 1, chairStand: 1, stairs: 1, joints: 1, activeDays: 1, pushups: 4, run: 3 }).level, 3);
  assert.equal(assess({ walk: 1, chairStand: 1, stairs: 1, joints: 1, activeDays: 1 }).level, 3);
});

test('Aufstiegs-Vorschlag bleibt unter dem Deckel der Einstufung', () => {
  const sessions = Array.from({ length: 10 }, (_, i) => ({ date: `2026-11-${String(i + 1).padStart(2, '0')}`, feedback: 'leicht' }));
  assert.equal(levelSuggestion({ level: 5, intensity: 1.4, sessions, levelSince: '' }), 'up');
  assert.equal(levelSuggestion({ level: 5, intensity: 1.4, sessions, levelSince: '', assessment: { max: 5 } }), null);
  assert.equal(levelSuggestion({ level: 8, intensity: 1.4, sessions, levelSince: '' }), null);
});

test('Neue Programme: gültige Übungen, steigende Belastung', () => {
  for (const id of ['kraft-aufbau', 'athletik']) {
    const pr = PROGRAMS.find((x) => x.id === id);
    assert.ok(pr, id);
    for (const w of pr.plan) for (const s of w) assert.ok(byId[s.id] && s.amount > 0, `${id}: ${s.id}`);
    const first = programSession({ id, done: [] }).minutes;
    const last = programSession({ id, done: Array((pr.weeks - 1) * 3).fill(D) }).minutes;
    assert.ok(last > first, `${id}: ${first} → ${last}`);
  }
});
