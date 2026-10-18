// Tägliche Challenges: pro Tag und Profil stabil (deterministischer Zufall).
import { byId, forLevel } from '../data/exercises.js';
import { HABITS, TIPS } from '../data/habits.js';
import { checkinOf, avoids, energyFactor, adaptText } from './checkin.js';

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

export const REST = [30, 25, 20, 15, 15];
export const MORNING_EXCLUDE = ['gehen', 'treppe', 'pmr', 'dankbarkeit'];
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

export function summarize(slot, title, icon, steps, rest, rounds) {
  const work = steps.reduce((s, it) => s + exerciseSeconds(it), 0);
  const durationSec = work + rest * Math.max(0, steps.length - 1);
  return { slot, title, icon, steps, rest, rounds, durationSec, minutes: Math.max(1, Math.round(durationSec / 60)) };
}

/** Morgen-Challenge: wach werden – Beweglichkeit + 1–3 aktivierende Übungen. */
export function morningChallenge(dateKey, profile) {
  const { level, intensity = 1, id = 'p' } = profile;
  const rand = rng(hashString(`${dateKey}|${id}|morning`));
  const used = new Set(MORNING_EXCLUDE);
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
  const picked = profile.habitSwap?.[dateKey] && HABITS.find((h) => h.id === profile.habitSwap[dateKey]);
  if (picked) return picked;
  const rand = rng(hashString(`${dateKey}|${profile.id}|habit`));
  return HABITS[Math.floor(rand() * HABITS.length)];
}

/** Gewohnheit des Tages gegen eine andere tauschen (in größeren Sprüngen, damit nicht zweimal „Wasser“ hintereinander kommt). */
export function swapHabit(profile, dateKey) {
  const i = HABITS.indexOf(habitOfDay(dateKey, profile));
  const next = HABITS[(i + 7) % HABITS.length];
  profile.habitSwap = { [dateKey]: next.id }; // nur der Tag selbst zählt
  return next;
}

export function tipOfDay(dateKey) {
  return TIPS[hashString(dateKey) % TIPS.length];
}

export function challengeFor(slot, dateKey, profile) {
  const ci = checkinOf(profile, dateKey);
  // Wenig Energie → kleinere Mengen (über die Intensität, damit Tausch und Anpassung dieselbe Menge rechnen)
  const prof = ci?.energy === 1 ? { ...profile, intensity: (profile.intensity ?? 1) * energyFactor(ci) } : profile;
  const base = slot === 'morning' ? morningChallenge(dateKey, prof) : eveningChallenge(dateKey, prof);
  // Erst ans Befinden anpassen, dann die eigenen Tausch-Wünsche (die sich auf die angepasste Einheit beziehen)
  const c = applySwaps(adaptToCheckin(base, slot, dateKey, prof, ci), profile.swaps?.[`${dateKey}|${slot}`], prof);
  return ci ? { ...c, adapted: adaptText(ci) } : c;
}

/** Übungen, die eine Region mit Beschwerden belasten, durch schonende aus dem gleichen Bereich ersetzen (oder weglassen). */
function adaptToCheckin(c, slot, dateKey, profile, ci) {
  if (!ci) return c;
  const bad = [...new Set(c.steps.map((s) => s.id))].filter((id) => avoids(ci, id));
  if (!bad.length) return c;
  const rand = rng(hashString(`${dateKey}|${profile.id}|${slot}|adapt`));
  const inUse = new Set(c.steps.map((s) => s.id));
  const excluded = slot === 'morning' ? MORNING_EXCLUDE : ['dankbarkeit'];
  const map = {};
  for (const id of bad) {
    const ex = byId[id];
    const opts = forLevel(profile.level, ex.cat).filter((e) => !avoids(ci, e.id) && !inUse.has(e.id) && !excluded.includes(e.id) && (slot !== 'morning' || e.pos !== 'boden'));
    if (opts.length) {
      const to = opts[Math.floor(rand() * opts.length)];
      map[id] = to.id;
      inUse.add(to.id);
    } else map[id] = null;
  }
  let steps = c.steps.filter((s) => map[s.id] !== null).map((s) => {
    const to = map[s.id];
    if (!to) return s;
    const ex = byId[to];
    return { ...s, id: to, amount: amountFor(ex, profile.level, ex.cat === 'entspannung' ? 1 : profile.intensity ?? 1) };
  });
  if (!steps.length) steps = [{ id: 'bauchatmung', amount: amountFor(byId.bauchatmung, profile.level, 1), round: 1 }];
  return summarize(c.slot, c.title, c.icon, steps, c.rest, c.rounds);
}

// ---------- Übung tauschen ----------
// profile.swaps['YYYY-MM-DD|slot'] = { ursprünglicheId: neueId } – gilt nur für diesen Tag.

function applySwaps(c, map, profile) {
  if (!map || !Object.keys(map).length) return c;
  const steps = c.steps.map((s) => {
    const to = map[s.id];
    if (!to || !byId[to]) return s;
    const ex = byId[to];
    return { ...s, id: to, amount: amountFor(ex, profile.level, ex.cat === 'entspannung' ? 1 : profile.intensity ?? 1) };
  });
  return summarize(c.slot, c.title, c.icon, steps, c.rest, c.rounds);
}

/** Mögliche Ersatzübungen: gleicher Bereich, im Level, nicht schon in der Einheit, morgens ohne Boden. */
export function swapOptions(slot, dateKey, profile, currentId) {
  const ex = byId[currentId];
  const c = challengeFor(slot, dateKey, profile);
  const inUse = new Set(c.steps.map((s) => s.id));
  const excluded = slot === 'morning' ? MORNING_EXCLUDE : ['dankbarkeit'];
  const ci = checkinOf(profile, dateKey);
  return forLevel(profile.level, ex.cat).filter((e) => !excluded.includes(e.id) && (slot !== 'morning' || e.pos !== 'boden') && !avoids(ci, e.id)
    && (e.id === currentId || !inUse.has(e.id)));
}

export const canSwap = (slot, dateKey, profile, currentId) => swapOptions(slot, dateKey, profile, currentId).length > 1;

/** Tauscht eine Übung reihum gegen die nächste passende. Gibt die neue ID zurück (oder null). */
export function swapExercise(profile, slot, dateKey, currentId) {
  const opts = swapOptions(slot, dateKey, profile, currentId);
  if (opts.length < 2) return null;
  const i = opts.findIndex((e) => e.id === currentId);
  const nextId = opts[(i + 1) % opts.length].id;
  const key = `${dateKey}|${slot}`;
  const map = { ...(profile.swaps?.[key] || {}) };
  const orig = Object.keys(map).find((k) => map[k] === currentId) || currentId;
  if (nextId === orig) delete map[orig];
  else map[orig] = nextId;
  // Alte Tage aufräumen – Tausch gilt nur für den Tag selbst
  const swaps = Object.fromEntries(Object.entries(profile.swaps || {}).filter(([k]) => k.slice(0, 10) >= dateKey));
  swaps[key] = map;
  profile.swaps = swaps;
  return nextId;
}
