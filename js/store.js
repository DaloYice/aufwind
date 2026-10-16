// Lokale Datenhaltung (localStorage) mit mehreren Profilen.
import { toKey } from './core/dates.js';

const KEY = 'aufwind:v1';
const listeners = new Set();

function empty() {
  return { profiles: [], activeId: null, deletedProfiles: [], settings: { speech: true, sound: true, notify: false, familyGoal: null, familyGoalAt: '' } };
}

/** Ergänzt Felder, die ältere Versionen noch nicht kannten. */
export function migrate(p) {
  p.water ||= {};
  p.waterGoal ||= 6;
  p.weekGoals ||= {};
  p.weekReached ||= {};
  p.weeksReached ||= 0;
  p.programsDone ||= [];
  p.plan ||= { morning: '', evening: '' };
  p.why ??= '';
  p.program ??= null;
  p.removedLogs ||= [];
  return p;
}

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = { ...empty(), ...JSON.parse(raw) };
      data.settings = { ...empty().settings, ...data.settings };
      data.profiles.forEach(migrate);
      return data;
    }
  } catch {
    /* privater Modus o. Ä. – mit leerem Zustand weiter */
  }
  return empty();
}

function persist(meta) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* Speicher voll/gesperrt */
  }
  listeners.forEach((fn) => fn(state, meta));
}

/** Speichert und markiert das aktive Profil als geändert (für den Geräte-Abgleich). */
export function save() {
  const p = activeProfile();
  if (p) p.updatedAt = new Date().toISOString();
  persist({ remote: false });
}

/** Übernimmt einen zusammengeführten Sync-Stand, ohne Zeitstempel zu verändern. */
export function applySync(payload) {
  state.profiles = payload.profiles.map(migrate);
  state.deletedProfiles = payload.deletedProfiles || [];
  state.settings.familyGoal = payload.familyGoal ?? state.settings.familyGoal;
  state.settings.familyGoalAt = payload.familyGoalAt || state.settings.familyGoalAt || '';
  if (!state.profiles.some((p) => p.id === state.activeId)) state.activeId = state.profiles[0]?.id || null;
  persist({ remote: true });
}

export const getState = () => state;
export const onChange = (fn) => listeners.add(fn);
export const activeProfile = () => state.profiles.find((p) => p.id === state.activeId) || null;

export function createProfile({ name, emoji, assessment, answers, level, why = '', plan = { morning: '', evening: '' } }) {
  const today = toKey();
  const p = {
    id: Math.random().toString(36).slice(2, 10),
    name, emoji,
    createdAt: today,
    level, levelSince: today,
    levelHistory: [{ date: today, level }],
    intensity: 1,
    answers, assessment,
    sessions: [], habits: {},
    logs: { weight: [], steps: [], waist: [], hip: [] },
    badges: {}, bestStreak: 0,
    reminders: { morning: '07:30', evening: '19:00' },
    why, plan,
  };
  migrate(p);
  if (answers?.weightKg) p.logs.weight.push({ date: today, value: answers.weightKg });
  state.profiles.push(p);
  state.activeId = p.id;
  save();
  return p;
}

export function setLevel(p, level) {
  if (level === p.level) return;
  p.level = level;
  p.levelSince = toKey();
  p.intensity = 1;
  (p.levelHistory ||= []).push({ date: p.levelSince, level });
  save();
}

export function addLog(p, kind, value, date = toKey()) {
  const list = (p.logs[kind] ||= []);
  const existing = list.find((e) => e.date === date);
  if (existing) existing.value = value;
  else list.push({ date, value });
  p.removedLogs = (p.removedLogs || []).filter((k) => k !== `${kind}:${date}`);
  list.sort((a, b) => a.date.localeCompare(b.date));
  save();
}

export function removeLog(p, kind, date) {
  p.logs[kind] = (p.logs[kind] || []).filter((e) => e.date !== date);
  p.removedLogs = [...new Set([...(p.removedLogs || []), `${kind}:${date}`])];
  save();
}

export function switchProfile(id) {
  state.activeId = id;
  save();
}

export function deleteProfile(id) {
  state.profiles = state.profiles.filter((p) => p.id !== id);
  state.deletedProfiles = [...new Set([...(state.deletedProfiles || []), id])];
  if (state.activeId === id) state.activeId = state.profiles[0]?.id || null;
  save();
}

export function exportJSON() {
  return JSON.stringify({ app: 'aufwind', version: 1, exportedAt: new Date().toISOString(), ...state }, null, 2);
}

export function importJSON(text) {
  const data = JSON.parse(text);
  if (data.app !== 'aufwind' || !Array.isArray(data.profiles)) throw new Error('Keine gültige Aufwind-Sicherung.');
  state = { ...empty(), profiles: data.profiles.map(migrate), deletedProfiles: data.deletedProfiles || [], activeId: data.activeId, settings: { ...empty().settings, ...data.settings } };
  save();
}
