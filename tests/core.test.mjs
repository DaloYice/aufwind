import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assess, bmi } from '../js/core/assessment.js';
import { morningChallenge, eveningChallenge, amountFor, habitOfDay } from '../js/core/challenges.js';
import { streak, adjustIntensity, levelSuggestion, awardBadges, weekMinutes } from '../js/core/progress.js';
import { addDays } from '../js/core/dates.js';
import { EXERCISES, byId } from '../js/data/exercises.js';

const base = { walk: 1, chairStand: 1, stairs: 1, joints: 1, activeDays: 1 };

test('BMI-Berechnung', () => {
  assert.equal(bmi(180, 81), 25);
  assert.equal(bmi(null, 80), null);
});

test('Einstufung: sehr untrainiert, stark übergewichtig → Level 1', () => {
  const r = assess({ walk: 0, chairStand: 0, stairs: 0, joints: 2, activeDays: 0, heightCm: 170, weightKg: 150 });
  assert.equal(r.level, 1);
  assert.ok(r.bmi > 50);
});

test('Einstufung: fit, aber BMI 42 → höchstens Level 2', () => {
  const r = assess({ walk: 3, chairStand: 2, stairs: 2, joints: 0, activeDays: 3, heightCm: 175, weightKg: 129 });
  assert.equal(r.level, 2);
  assert.ok(r.reasons.length > 0);
});

test('Einstufung: sportlich, normalgewichtig → Level 5', () => {
  const r = assess({ walk: 3, chairStand: 2, stairs: 2, joints: 0, activeDays: 3, heightCm: 180, weightKg: 75 });
  assert.equal(r.level, 5);
});

test('Einstufung: Gesundheitsangaben → Arzthinweis, höchstens Level 3', () => {
  const r = assess({ walk: 3, chairStand: 2, stairs: 2, joints: 0, activeDays: 3, flags: ['bp'] });
  assert.equal(r.doctorHint, true);
  assert.equal(r.level, 3);
});

test('Einstufung: mittlere Werte → Level 2–3', () => {
  const r = assess(base);
  assert.ok(r.level >= 2 && r.level <= 3, `Level ${r.level}`);
});

test('Übungsdaten vollständig', () => {
  for (const e of EXERCISES) {
    assert.equal(e.base.length, 5, e.id);
    assert.ok(e.steps.length >= 2, e.id);
    assert.ok(e.easier && e.harder && e.tip, e.id);
  }
});

test('Level 1–2 enthalten keine Bodenübungen', () => {
  for (const e of EXERCISES.filter((x) => x.pos === 'boden')) {
    assert.equal(e.base[0], null, e.id);
    assert.equal(e.base[1], null, e.id);
  }
});

test('Challenges sind pro Tag stabil und je Tag verschieden', () => {
  const p = { id: 'a', level: 3, intensity: 1 };
  const a = morningChallenge('2026-10-16', p);
  const b = morningChallenge('2026-10-16', p);
  assert.deepEqual(a, b);
  const days = new Set();
  for (let i = 0; i < 10; i++) days.add(JSON.stringify(eveningChallenge(addDays('2026-10-16', i), p).steps.map((s) => s.id)));
  assert.ok(days.size > 3);
});

test('Challenges nutzen nur Übungen des Levels; Abend endet mit Entspannung', () => {
  for (let level = 1; level <= 5; level++) {
    for (let i = 0; i < 30; i++) {
      const day = addDays('2026-01-01', i);
      const p = { id: 'x', level, intensity: 1 };
      for (const c of [morningChallenge(day, p), eveningChallenge(day, p)]) {
        for (const s of c.steps) assert.notEqual(byId[s.id].base[level - 1], null, `${s.id} L${level}`);
      }
      const ev = eveningChallenge(day, p);
      assert.equal(byId[ev.steps.at(-1).id].cat, 'entspannung');
    }
  }
});

test('Dauer steigt mit dem Level, Level 1 bleibt kurz', () => {
  const avg = (level) => {
    let sum = 0;
    for (let i = 0; i < 30; i++) {
      const d = addDays('2026-01-01', i);
      const p = { id: 'x', level, intensity: 1 };
      sum += morningChallenge(d, p).durationSec + eveningChallenge(d, p).durationSec;
    }
    return sum / 30 / 60;
  };
  const l1 = avg(1), l5 = avg(5);
  assert.ok(l1 < 15, `L1 ${l1} min`);
  assert.ok(l5 > l1 * 2, `L5 ${l5} vs L1 ${l1}`);
});

test('Intensität skaliert Mengen', () => {
  const e = byId.aufstehen;
  assert.equal(amountFor(e, 1, 1), 3);
  assert.ok(amountFor(e, 3, 1.3) > amountFor(e, 3, 1));
  assert.equal(amountFor(byId.gehen, 1, 1) % 5, 0);
});

test('Gewohnheit des Tages ist stabil', () => {
  const p = { id: 'a' };
  assert.equal(habitOfDay('2026-10-16', p).id, habitOfDay('2026-10-16', p).id);
});

const prof = (dates, extra = {}) => ({
  createdAt: '2026-09-01',
  level: 2, levelSince: '2026-09-01', intensity: 1,
  sessions: dates.map((date) => ({ date, slot: 'morning', durationSec: 300, feedback: 'passt' })),
  habits: {}, logs: {}, badges: {},
  ...extra,
});

test('Serie zählt aufeinanderfolgende Tage, heute offen bricht nicht', () => {
  const today = '2026-10-16';
  const p = prof(['2026-10-13', '2026-10-14', '2026-10-15']);
  assert.equal(streak(p, today).count, 3);
  p.sessions.push({ date: today, slot: 'evening' });
  assert.equal(streak(p, today).count, 4);
});

test('Joker überbrückt einen Tag, zwei verpasste Tage beenden die Serie', () => {
  const today = '2026-10-16';
  const p = prof(['2026-10-12', '2026-10-13', '2026-10-15', '2026-10-16']);
  const s = streak(p, today);
  assert.equal(s.count, 4);
  assert.deepEqual(s.jokers, ['2026-10-14']);
  assert.equal(s.jokerAvailable, false);
  const q = prof(['2026-10-11', '2026-10-12', '2026-10-15', '2026-10-16']);
  assert.equal(streak(q, today).count, 2);
});

test('Joker für gestern, wenn heute noch offen', () => {
  const p = prof(['2026-10-13', '2026-10-14']);
  assert.equal(streak(p, '2026-10-16').count, 2);
});

test('Nur ein Joker pro 7 Tage', () => {
  const p = prof(['2026-10-10', '2026-10-12', '2026-10-14', '2026-10-15']);
  assert.equal(streak(p, '2026-10-15').count, 3);
});

test('Intensität: Feedback mit Grenzen', () => {
  assert.equal(adjustIntensity(1, 'leicht'), 1.1);
  assert.equal(adjustIntensity(1, 'schwer'), 0.85);
  assert.equal(adjustIntensity(1.5, 'leicht'), 1.5);
  assert.equal(adjustIntensity(0.6, 'schwer'), 0.6);
});

test('Level-Empfehlung nach oben und unten', () => {
  const dates = Array.from({ length: 9 }, (_, i) => addDays('2026-10-01', i));
  assert.equal(levelSuggestion(prof(dates, { intensity: 1.3 })), 'up');
  assert.equal(levelSuggestion(prof(dates.slice(0, 3))), null);
  const hard = prof(dates.slice(0, 4), { intensity: 0.7 });
  hard.sessions.forEach((s) => (s.feedback = 'schwer'));
  assert.equal(levelSuggestion(hard), 'down');
});

test('Abzeichen werden einmalig vergeben', () => {
  const p = prof(['2026-10-14', '2026-10-15', '2026-10-16'], { logs: { weight: [{ date: '2026-10-01', value: 120 }, { date: '2026-10-16', value: 117.5 }] } });
  const fresh = awardBadges(p, '2026-10-16').map((b) => b.id);
  assert.ok(fresh.includes('erster-schritt'));
  assert.ok(fresh.includes('serie-3'));
  assert.ok(fresh.includes('minus-2'));
  assert.ok(!fresh.includes('minus-5'));
  assert.equal(awardBadges(p, '2026-10-16').length, 0);
});

test('Wochenminuten', () => {
  const p = prof(['2026-10-01', '2026-10-15', '2026-10-16']);
  assert.equal(weekMinutes(p, '2026-10-16'), 10);
});

test('Doppelpack nur für Morgen + Abend am selben Tag', () => {
  const p = prof(['2026-10-16']);
  p.sessions.push({ date: '2026-10-16', slot: 'program', durationSec: 300 });
  assert.ok(!awardBadges(p, '2026-10-16').some((b) => b.id === 'doppelpack'));
  p.sessions.push({ date: '2026-10-16', slot: 'evening', durationSec: 300 });
  assert.ok(awardBadges(p, '2026-10-16').some((b) => b.id === 'doppelpack'));
});
