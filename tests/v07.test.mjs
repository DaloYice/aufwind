import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORLDS, DIFFICULTY } from '../js/data/worlds.js';
import { FOCUS } from '../js/data/focus.js';
import { EXERCISES, CATEGORIES, byId } from '../js/data/exercises.js';
import { ICON } from '../js/icons.js';
import { customWorkout } from '../js/core/custom.js';
import { morningChallenge, eveningChallenge } from '../js/core/challenges.js';

const D = '2026-10-18';
const prof = (level) => ({ id: 'p', level, intensity: 1, checkins: {} });

test('Welten verweisen auf vorhandene Schwerpunkte und Icons, Texte vollständig', () => {
  for (const [id, w] of Object.entries(WORLDS)) {
    assert.ok(FOCUS[w.focus], id);
    assert.ok(ICON[w.icon], id);
    assert.ok(w.intro && w.safety && w.points.length >= 2 && w.tips.length >= 2, id);
  }
  for (const f of Object.values(FOCUS)) assert.ok(ICON[f.icon], f.label);
  assert.deepEqual(Object.values(DIFFICULTY).map((d) => d.level), [1, 3, 5]);
});

test('Takt-Ansagen sind gültig und nur bei Zeitübungen', () => {
  for (const e of EXERCISES.filter((x) => x.cue)) {
    assert.equal(e.unit, 'sek', e.id);
    assert.ok(e.cue.length >= 2 && e.cue.every(([t, s]) => t && s > 0), e.id);
  }
  assert.ok(CATEGORIES.beckenboden);
  assert.ok(EXERCISES.filter((e) => e.cat === 'beckenboden').length >= 6);
});

test('Beckenboden-Workout: beginnt mit Spüren, nur Beckenboden-Übungen, ab Level 1 ohne Boden', () => {
  for (const level of [1, 2, 3, 4, 5]) for (const minutes of [5, 10, 15, 20]) {
    const c = customWorkout({ minutes, focus: 'beckenboden' }, prof(level), D);
    assert.equal(c.steps[0].id, 'bb_wahrnehmen');
    assert.ok(c.steps.every((s) => byId[s.id].cat === 'beckenboden'));
    if (level <= 2) assert.ok(c.steps.every((s) => byId[s.id].pos !== 'boden'));
  }
});

test('Beckenboden-Übungen landen nicht in den täglichen Challenges', () => {
  for (let d = 1; d <= 28; d++) for (const level of [1, 3, 5]) {
    const date = `2026-10-${String(d).padStart(2, '0')}`;
    for (const c of [morningChallenge(date, prof(level)), eveningChallenge(date, prof(level))]) {
      assert.ok(!c.steps.some((s) => byId[s.id].cat === 'beckenboden'), date);
    }
  }
});

test('Fortgeschritten: Kraft-Workouts nutzen die neuen Boden-Übungen, Einsteiger nie', () => {
  const advanced = ['bodenliegestuetz', 'bodenplank', 'seitstuetz', 'superman', 'ausfallvorwaerts', 'kniebeugehalten', 'wandsitzen'];
  const seen = new Set();
  for (let mix = 0; mix < 12; mix++) {
    customWorkout({ minutes: 15, focus: 'kraft', mix }, prof(5), D).steps.forEach((s) => seen.add(s.id));
    const easy = customWorkout({ minutes: 15, focus: 'kraft', mix }, prof(1), D);
    assert.ok(!easy.steps.some((s) => advanced.includes(s.id)), `mix ${mix}`);
  }
  assert.ok(advanced.filter((id) => seen.has(id)).length >= 5, [...seen].join());
});
