// Wochen-Logik: Wochenziel, Rückblick, Familien-Challenge, Wasser.
import { addDays, fromKey, toKey } from './dates.js';

/** Montag der Woche (Kalenderwoche nach ISO-Logik, Woche beginnt Montag). */
export function weekStart(key = toKey()) {
  const wd = (fromKey(key).getDay() + 6) % 7; // 0 = Montag
  return addDays(key, -wd);
}

export function weekDays(start) {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function sessionsIn(profile, from, to) {
  return profile.sessions.filter((s) => s.date >= from && s.date <= to);
}

export function defaultWeekGoal(level) {
  return level <= 1 ? 3 : 4;
}

export function weekGoal(profile, start = weekStart()) {
  return profile.weekGoals?.[start] ?? profile.weekGoalDefault ?? defaultWeekGoal(profile.level);
}

/** Kennzahlen einer Woche (Mo–So). */
export function weekStats(profile, start) {
  const end = addDays(start, 6);
  const sess = sessionsIn(profile, start, end);
  const activeDays = new Set(sess.map((s) => s.date)).size;
  const minutes = Math.round(sess.reduce((t, s) => t + (s.durationSec || 0), 0) / 60);
  const days = weekDays(start);
  const habits = days.filter((d) => profile.habits?.[d]).length;
  const water = days.map((d) => profile.water?.[d] || 0);
  const waterDays = water.filter((w) => w >= (profile.waterGoal || 6)).length;
  const w = (profile.logs?.weight || []).filter((e) => e.date <= end);
  const before = w.filter((e) => e.date < start).at(-1);
  const inWeek = w.filter((e) => e.date >= start).at(-1);
  const weightDelta = before && inWeek ? Math.round((inWeek.value - before.value) * 10) / 10 : null;
  const perDay = days.map((d) => Math.round(sess.filter((s) => s.date === d).reduce((t, s) => t + (s.durationSec || 0), 0) / 60));
  const bestIdx = perDay.indexOf(Math.max(...perDay));
  return {
    start, end, sessions: sess.length, activeDays, minutes, habits, waterDays, weightDelta,
    goal: weekGoal(profile, start), reached: activeDays >= weekGoal(profile, start),
    bestDay: perDay[bestIdx] > 0 ? days[bestIdx] : null,
  };
}

/** Soll der Rückblick der Vorwoche angezeigt werden? */
export function reviewDue(profile, today = toKey()) {
  const thisWeek = weekStart(today);
  const lastWeek = addDays(thisWeek, -7);
  if (!profile.createdAt || profile.createdAt > addDays(lastWeek, 6)) return null;
  if (profile.lastReview && profile.lastReview >= lastWeek) return null;
  return lastWeek;
}

/** Zielvorschlag für die nächste Woche: erreicht → +1, deutlich verfehlt → −1. */
export function suggestGoal(stats) {
  if (stats.reached) return Math.min(7, stats.goal + 1);
  if (stats.activeDays < stats.goal - 1) return Math.max(2, stats.goal - 1);
  return stats.goal;
}

export function reviewMessage(stats) {
  if (stats.activeDays === 0) return 'Diese Woche war Pause – das passiert. Neuer Montag, neue Chance. Fang klein an.';
  if (stats.reached) return `Wochenziel geschafft – ${stats.activeDays} aktive Tage! Darauf kannst du stolz sein.`;
  return `${stats.activeDays} aktive ${stats.activeDays === 1 ? 'Tag' : 'Tage'} – jeder davon zählt. Bleib dran!`;
}

/** Familien-Challenge: gemeinsame Minuten aller Profile in dieser Woche. */
export function familyProgress(profiles, goal, today = toKey()) {
  const start = weekStart(today);
  const end = addDays(start, 6);
  const members = profiles.map((p) => ({
    id: p.id, name: p.name, emoji: p.emoji,
    minutes: Math.round(sessionsIn(p, start, end).reduce((t, s) => t + (s.durationSec || 0), 0) / 60),
  }));
  const total = members.reduce((t, m) => t + m.minutes, 0);
  return { start, goal, total, members, pct: goal ? Math.min(100, Math.round((total / goal) * 100)) : 0 };
}

export function defaultFamilyGoal(count) {
  return Math.max(60, count * 90);
}
