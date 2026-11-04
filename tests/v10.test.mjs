import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { trendValues, sparkline } from '../js/chart.js';
import { WORLDS, TONE_COLOR } from '../js/data/worlds.js';
import { POSES } from '../js/data/poses.js';
import { CATEGORIES } from '../js/data/exercises.js';

test('Trendlinie: gleitendes Mittel über 14 Tage', () => {
  const pts = [
    { date: '2026-10-01', value: 100 }, { date: '2026-10-05', value: 98 },
    { date: '2026-10-10', value: 102 }, { date: '2026-10-20', value: 96 },
  ];
  const t = trendValues(pts);
  assert.equal(t[0], 100);
  assert.equal(t[2], 100); // 100, 98, 102
  assert.equal(t[3], 99); // nur 10.10. und 20.10. liegen im Fenster
});

test('Mini-Verlauf braucht mindestens zwei Werte', () => {
  assert.equal(sparkline([5]), '');
  assert.match(sparkline([1, 3, 2], { label: 'x' }), /<svg class="spark"/);
});

test('Jede Welt hat ein Bild aus einer vorhandenen Pose und eine Farbe', () => {
  for (const [id, w] of Object.entries(WORLDS)) {
    const [pose, key] = w.art;
    assert.ok(POSES[pose], `${id}: ${pose}`);
    assert.ok(key < POSES[pose].keys.length, `${id}: Schlüsselpose ${key}`);
    assert.ok(TONE_COLOR[w.tone], `${id}: ${w.tone}`);
  }
});

test('Jeder Trainingsbereich hat eine Farbe für hell und dunkel', () => {
  const css = readFileSync(new URL('../css/app.css', import.meta.url), 'utf8');
  for (const k of Object.keys(CATEGORIES)) assert.equal(css.match(new RegExp(`--cat-${k}:`, 'g'))?.length, 2, k);
});

// ---------- v0.12.0: Darts-Welt ----------
import { FOCUS, focusAvailable } from '../js/data/focus.js';
import { EXERCISES as ALL, byId } from '../js/data/exercises.js';
import { customWorkout } from '../js/core/custom.js';
import { morningChallenge, eveningChallenge } from '../js/core/challenges.js';

test('Darts-Übungen nur in der Darts-Welt, nie in den täglichen Challenges', () => {
  const darts = ALL.filter((e) => e.special === 'darts').map((e) => e.id);
  assert.ok(darts.length >= 10);
  for (let d = 1; d <= 28; d++) for (const level of [1, 4, 8]) {
    const date = `2026-11-${String(d).padStart(2, '0')}`;
    const prof = { id: 'p', level, intensity: 1, checkins: {}, equipment: ['band'] };
    for (const c of [morningChallenge(date, prof), eveningChallenge(date, prof)]) assert.ok(!c.steps.some((s) => darts.includes(s.id)), date);
  }
});

test('Darts-Abläufe: feste Reihenfolge, vollständig, auf jedem Level; Chips nur für „Darts“', () => {
  for (const level of [1, 3, 5, 8]) {
    const prof = { id: 'p', level, intensity: 1, checkins: {} };
    const warm = customWorkout({ minutes: 5, focus: 'darts_warm' }, prof, '2026-11-04');
    const ids = warm.steps.map((s) => s.id);
    const expected = FOCUS.darts_warm.ids.filter((id) => byId[id].base[level - 1] != null);
    assert.deepEqual(ids, expected, `Level ${level}`);
    assert.ok(ids.includes('zielatmung') || byId.zielatmung.base[level - 1] == null);
    const kraft = customWorkout({ minutes: 10, focus: 'darts' }, prof, '2026-11-04');
    assert.ok(kraft.steps.filter((s) => byId[s.id].special === 'darts').length >= 3, `Level ${level}`);
  }
  assert.ok(focusAvailable(FOCUS.darts, { level: 1 }));
  assert.ok(!focusAvailable(FOCUS.darts_warm, { level: 5 }));
});
