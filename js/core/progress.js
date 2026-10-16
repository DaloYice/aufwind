// Serie (Streak) mit Joker, Abzeichen, Level-Empfehlungen, Intensitätsanpassung.
import { addDays, diffDays, toKey } from './dates.js';

export function doneDays(profile) {
  return new Set(profile.sessions.map((s) => s.date));
}

/**
 * Serie in Tagen. Ein verpasster Tag pro 7 Tagen wird per Joker überbrückt,
 * zwei verpasste Tage in Folge beenden die Serie. Der heutige Tag zählt erst, wenn erledigt.
 */
export function streak(profile, today = toKey()) {
  const done = doneDays(profile);
  const start = profile.createdAt ? profile.createdAt.slice(0, 10) : today;
  let day = done.has(today) ? today : addDays(today, -1);
  let count = 0;
  let lastJoker = null;
  const jokers = [];
  while (diffDays(day, start) >= 0) {
    if (done.has(day)) {
      count++;
    } else {
      const prevMissed = !done.has(addDays(day, -1));
      const jokerFree = lastJoker == null || diffDays(lastJoker, day) >= 7;
      if (prevMissed || !jokerFree) break;
      lastJoker = day;
      jokers.push(day);
    }
    day = addDays(day, -1);
  }
  const jokerAvailable = jokers.length === 0 || diffDays(today, jokers[0]) >= 7;
  return { count, jokers, jokerAvailable };
}

export function totals(profile) {
  const sessions = profile.sessions;
  const minutes = Math.round(sessions.reduce((s, x) => s + (x.durationSec || 0), 0) / 60);
  return { sessions: sessions.length, minutes, habits: Object.keys(profile.habits || {}).length };
}

/** Bewegungsminuten der letzten 7 Tage (inkl. heute). */
export function weekMinutes(profile, today = toKey()) {
  const from = addDays(today, -6);
  const sec = profile.sessions
    .filter((s) => s.date >= from && s.date <= today)
    .reduce((sum, s) => sum + (s.durationSec || 0), 0);
  return Math.round(sec / 60);
}

export function adjustIntensity(current, feedback) {
  const delta = feedback === 'leicht' ? 0.1 : feedback === 'schwer' ? -0.15 : 0;
  return Math.round(Math.min(1.5, Math.max(0.6, current + delta)) * 100) / 100;
}

/** 'up' | 'down' | null */
export function levelSuggestion(profile) {
  const since = profile.levelSince || '';
  const recent = profile.sessions.filter((s) => s.date >= since);
  const last5 = recent.slice(-5);
  const easy = last5.filter((s) => s.feedback === 'leicht').length;
  const hard = last5.filter((s) => s.feedback === 'schwer').length;
  if (profile.level < 5 && recent.length >= 8 && (profile.intensity >= 1.3 || easy >= 3)) return 'up';
  if (profile.level > 1 && recent.length >= 3 && profile.intensity <= 0.7 && hard >= 2) return 'down';
  return null;
}

const firstLast = (arr) => (arr && arr.length ? [arr[0].value, arr[arr.length - 1].value] : null);

export const BADGES = [
  { id: 'erster-schritt', icon: '👟', name: 'Erster Schritt', desc: 'Erste Challenge geschafft', test: (p) => p.sessions.length >= 1 },
  { id: 'fruehaufsteher', icon: '🌅', name: 'Frühaufsteher', desc: '5 Morgen-Challenges', test: (p) => p.sessions.filter((s) => s.slot === 'morning').length >= 5 },
  { id: 'abendroutine', icon: '🌙', name: 'Abendroutine', desc: '5 Abend-Challenges', test: (p) => p.sessions.filter((s) => s.slot === 'evening').length >= 5 },
  { id: 'doppelpack', icon: '✌️', name: 'Doppelpack', desc: 'Morgens und abends an einem Tag', test: (p) => hasDouble(p) },
  { id: 'serie-3', icon: '🔥', name: '3 Tage am Stück', desc: 'Serie von 3 Tagen', test: (p, ctx) => ctx.best >= 3 },
  { id: 'serie-7', icon: '📅', name: 'Eine Woche', desc: 'Serie von 7 Tagen', test: (p, ctx) => ctx.best >= 7 },
  { id: 'serie-21', icon: '🌱', name: 'Gewohnheit keimt', desc: 'Serie von 21 Tagen', test: (p, ctx) => ctx.best >= 21 },
  { id: 'serie-66', icon: '🌳', name: 'Gewohnheit verwurzelt', desc: 'Serie von 66 Tagen', test: (p, ctx) => ctx.best >= 66 },
  { id: 'zehn', icon: '🔟', name: 'Zehner', desc: '10 Challenges insgesamt', test: (p) => p.sessions.length >= 10 },
  { id: 'fuenfzig', icon: '🏅', name: 'Fünfzig', desc: '50 Challenges insgesamt', test: (p) => p.sessions.length >= 50 },
  { id: 'hundert', icon: '🏆', name: 'Hundert', desc: '100 Challenges insgesamt', test: (p) => p.sessions.length >= 100 },
  { id: 'stunde', icon: '⏱️', name: 'Erste Stunde', desc: '60 Bewegungsminuten gesamt', test: (p) => totals(p).minutes >= 60 },
  { id: 'gewohnheit-10', icon: '🥦', name: 'Gute Gewohnheiten', desc: '10 Alltags-Challenges', test: (p) => totals(p).habits >= 10 },
  { id: 'messen', icon: '📏', name: 'Vermessen', desc: 'Erste Messung eingetragen', test: (p) => Object.values(p.logs || {}).some((l) => l.length) },
  { id: 'minus-2', icon: '⬇️', name: '−2 kg', desc: '2 kg leichter als zu Beginn', test: (p) => lost(p) >= 2 },
  { id: 'minus-5', icon: '🎯', name: '−5 kg', desc: '5 kg leichter als zu Beginn', test: (p) => lost(p) >= 5 },
  { id: 'minus-10', icon: '🚀', name: '−10 kg', desc: '10 kg leichter als zu Beginn', test: (p) => lost(p) >= 10 },
  { id: 'bauch-5', icon: '📉', name: '−5 cm Bauch', desc: 'Bauchumfang 5 cm weniger', test: (p) => { const f = firstLast(p.logs?.waist); return f ? f[0] - f[1] >= 5 : false; } },
  { id: 'aufstieg', icon: '⬆️', name: 'Aufsteiger', desc: 'Ein Level aufgestiegen', test: (p) => (p.levelHistory || []).some((h, i, a) => i > 0 && h.level > a[i - 1].level) },
];

function hasDouble(p) {
  const by = {};
  for (const s of p.sessions) (by[s.date] ||= new Set()).add(s.slot);
  return Object.values(by).some((set) => set.size >= 2);
}

function lost(p) {
  const f = firstLast(p.logs?.weight);
  return f ? f[0] - f[1] : 0;
}

/** Liefert neu verdiente Abzeichen und trägt sie ins Profil ein. */
export function awardBadges(profile, today = toKey()) {
  const s = streak(profile, today).count;
  profile.bestStreak = Math.max(profile.bestStreak || 0, s);
  const ctx = { best: profile.bestStreak };
  profile.badges ||= {};
  const fresh = [];
  for (const b of BADGES) {
    if (!profile.badges[b.id] && b.test(profile, ctx)) {
      profile.badges[b.id] = today;
      fresh.push(b);
    }
  }
  return fresh;
}
