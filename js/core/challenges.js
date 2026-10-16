// Tägliche Challenges: pro Tag und Profil stabil (deterministischer Zufall).
import { byId, forLevel } from '../data/exercises.js';
import { HABITS, TIPS } from '../data/habits.js';

export function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(list, rand, exclude = new Set()) {
  const pool = list.filter((e) => !exclude.has(e.id));
  const src = pool.length ? pool : list;
  const e = src[Math.floor(rand() * src.length)];
  exclude.add(e.id);
  return e;
}

const REST = [30, 25, 20, 15, 15];
const ROUNDS = [1, 1, 2, 2, 3];

// Abend-Themen rotieren, damit nicht jeder Tag gleich ist.
export const EVENING_THEMES = [
  { id: 'kraft', title: 'Kraft-Abend', icon: '💪', plan: ['kraft', 'kraft', 'ausdauer', 'kraft'] },
  { id: 'spaziergang', title: 'Spazier-Abend', icon: '🚶', plan: ['gehen', 'balance'] },
  { id: 'balance', title: 'Balance & Dehnen', icon: '⚖️', plan: ['balance', 'mobil', 'kraft', 'balance'] },
  { id: 'cardio', title: 'Herz-Kreislauf', icon: '❤️', plan: ['ausdauer', 'kraft', 'ausdauer', 'ausdauer'] },
];

/** Menge für Übung, Level und Intensitätsfaktor (gerundet, Zeit in 5-Sek-Schritten). */
export function amountFor(ex, level, intensity = 1) {
  const base = ex.base[level - 1] ?? ex.base.find((v) => v != null);
  const raw = base * intensity;
  return ex.unit === 'sek' ? Math.max(10, Math.round(raw / 5) * 5) : Math.max(2, Math.round(raw));
}

/** Geschätzte Dauer einer Übung in Sekunden (Wdh ≈ 3 s). */
export function exerciseSeconds(item) {
  const ex = byId[item.id];
  const t = ex.unit === 'sek' ? item.amount : item.amount * 3;
  return ex.perSide ? t * 2 : t;
}

function buildSteps(ids, level, intensity, rounds) {
  const steps = [];
  for (let r = 1; r <= rounds; r++) {
    for (const id of ids) steps.push({ id, amount: amountFor(byId[id], level, intensity), round: r });
  }
  return steps;
}

function summarize(slot, title, icon, steps, rest, rounds) {
  const work = steps.reduce((s, it) => s + exerciseSeconds(it), 0);
  const durationSec = work + rest * Math.max(0, steps.length - 1);
  return { slot, title, icon, steps, rest, rounds, durationSec, minutes: Math.max(1, Math.round(durationSec / 60)) };
}

/** Morgen-Challenge: wach werden – Beweglichkeit + 1–3 aktivierende Übungen. */
export function morningChallenge(dateKey, profile) {
  const { level, intensity = 1, id = 'p' } = profile;
  const rand = rng(hashString(`${dateKey}|${id}|morning`));
  const used = new Set(['gehen', 'treppe', 'pmr', 'dankbarkeit']);
  // Morgens keine Bodenübungen – schnell und ohne Matte machbar.
  const pool = (cat) => forLevel(level, cat).filter((e) => e.pos !== 'boden');
  const ids = [pick(pool('mobil'), rand, used).id];
  const extra = level <= 1 ? 2 : level <= 3 ? 3 : 4;
  const cats = ['ausdauer', 'kraft', 'mobil', 'kraft', 'balance'];
  for (let i = 0; i < extra; i++) ids.push(pick(pool(cats[i]), rand, used).id);
  const steps = buildSteps(ids, level, intensity, 1);
  return summarize('morning', 'Morgen-Aktivierung', '🌅', steps, REST[level - 1], 1);
}

/** Abend-Challenge: Thema des Tages, endet immer mit Entspannung. */
export function eveningChallenge(dateKey, profile) {
  const { level, intensity = 1, id = 'p' } = profile;
  const rand = rng(hashString(`${dateKey}|${id}|evening`));
  const theme = EVENING_THEMES[Math.floor(rand() * EVENING_THEMES.length)];
  const used = new Set(['dankbarkeit']);
  let plan = theme.plan;
  if (level <= 2) plan = plan.slice(0, 3);
  const ids = plan.map((c) => (c === 'gehen' ? (used.add('gehen'), 'gehen') : pick(forLevel(level, c), rand, used).id));
  const rounds = theme.id === 'spaziergang' ? 1 : ROUNDS[level - 1];
  const steps = buildSteps(ids, level, intensity, rounds);
  const relax = rand() < 0.5 ? 'bauchatmung' : 'pmr';
  steps.push({ id: relax, amount: amountFor(byId[relax], level, 1), round: rounds });
  return summarize('evening', theme.title, theme.icon, steps, REST[level - 1], rounds);
}

export function habitOfDay(dateKey, profile) {
  const rand = rng(hashString(`${dateKey}|${profile.id}|habit`));
  return HABITS[Math.floor(rand() * HABITS.length)];
}

export function tipOfDay(dateKey) {
  return TIPS[hashString(dateKey) % TIPS.length];
}

export function challengeFor(slot, dateKey, profile) {
  return slot === 'morning' ? morningChallenge(dateKey, profile) : eveningChallenge(dateKey, profile);
}
