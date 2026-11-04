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
