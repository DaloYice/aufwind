// Sync-Kern ohne Browser-Abhängigkeiten: Code, Verschlüsselung, Zusammenführen.
// Läuft im Browser und in Node (WebCrypto über globalThis.crypto).
import { normalizeRecords, mergeRemoved, mergeSessions, mergeLogs } from './records.js';
import { mergeExLog } from './exlog.js';

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const enc = new TextEncoder();
const dec = new TextDecoder();

/** Neuer geheimer Sync-Code: 20 Zufallsbytes → 32 Zeichen Base32. */
export function newCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  let bits = 0, val = 0, out = '';
  for (const b of bytes) {
    val = (val << 8) | b;
    bits += 8;
    while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; }
  }
  return out;
}

/** Eingabe säubern: Großbuchstaben, nur Base32-Zeichen. */
export const normalizeCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
export const isValidCode = (s) => normalizeCode(s).length === 32;
export const formatCode = (s) => normalizeCode(s).match(/.{1,4}/g)?.join('-') || '';

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const sha = (text) => crypto.subtle.digest('SHA-256', enc.encode(text));

/** Speicher-ID für den Server (verrät nichts über den Schlüssel). */
export async function syncId(code) {
  return hex(await sha(`aufwind-id|${normalizeCode(code)}`)).slice(0, 32);
}

async function keyFor(code) {
  return crypto.subtle.importKey('raw', await sha(`aufwind-key|${normalizeCode(code)}`), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

const toB64 = (u8) => {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return btoa(s);
};
const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function encryptJSON(code, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await keyFor(code), enc.encode(JSON.stringify(obj))));
  const all = new Uint8Array(12 + ct.length);
  all.set(iv);
  all.set(ct, 12);
  return toB64(all);
}

export async function decryptJSON(code, data) {
  const all = fromB64(data);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: all.subarray(0, 12) }, await keyFor(code), all.subarray(12));
  return JSON.parse(dec.decode(pt));
}

// ---------- Zusammenführen ----------

/** Was synchronisiert wird – gerätespezifische Einstellungen (Ton, Sprache, Benachrichtigung, aktives Profil) nicht. */
export function payloadOf(state) {
  return {
    profiles: state.profiles,
    deletedProfiles: state.deletedProfiles || [],
    familyGoal: state.settings?.familyGoal ?? null,
    familyGoalAt: state.settings?.familyGoalAt || '',
  };
}

function unionBy(a = [], b = [], key) {
  const m = new Map();
  for (const x of a) m.set(key(x), x);
  for (const x of b) if (!m.has(key(x))) m.set(key(x), x);
  return [...m.values()];
}

/** Profil zusammenführen: neuerer Stand gewinnt bei Einzelwerten, Verläufe werden vereinigt. */
export function mergeProfile(x, y) {
  const [nx, ox] = (x.updatedAt || '') >= (y.updatedAt || '') ? [x, y] : [y, x];
  const newer = normalizeRecords(JSON.parse(JSON.stringify(nx)));
  const older = normalizeRecords(JSON.parse(JSON.stringify(ox)));
  const p = JSON.parse(JSON.stringify(newer));
  p.removedAt = mergeRemoved(newer.removedAt, older.removedAt);
  p.sessions = mergeSessions(newer.sessions, older.sessions, p.removedAt);
  p.swaps = { ...(older.swaps || {}), ...(newer.swaps || {}) };
  p.habitSwap = { ...(older.habitSwap || {}), ...(newer.habitSwap || {}) };
  p.checkins = { ...(older.checkins || {}), ...(newer.checkins || {}) };
  p.exLog = mergeExLog(newer.exLog, older.exLog);
  p.habits = { ...(older.habits || {}), ...(newer.habits || {}) };
  p.water = { ...(older.water || {}) };
  for (const [d, n] of Object.entries(newer.water || {})) p.water[d] = Math.max(n, p.water[d] || 0);
  p.badges = { ...(older.badges || {}), ...(newer.badges || {}) };
  p.weekReached = { ...(older.weekReached || {}), ...(newer.weekReached || {}) };
  p.weeksReached = Object.keys(p.weekReached).length;
  p.weekGoals = { ...(older.weekGoals || {}), ...(newer.weekGoals || {}) };
  p.bestStreak = Math.max(newer.bestStreak || 0, older.bestStreak || 0);
  p.programsDone = unionBy(newer.programsDone, older.programsDone, (d) => `${d.id}|${d.date}`);
  p.levelHistory = unionBy(newer.levelHistory, older.levelHistory, (h) => `${h.date}|${h.level}`).sort((a, b) => a.date.localeCompare(b.date));
  if (p.program && older.program && older.program.id === p.program.id) {
    p.program.done = [...(p.program.done || []), ...(older.program.done || [])].filter((d, i, arr) => arr.indexOf(d) === i).sort();
  }
  p.logs = mergeLogs(newer.logs, older.logs, p.removedAt);
  return p;
}

export function mergePayload(a, b) {
  const deleted = [...new Set([...(a.deletedProfiles || []), ...(b.deletedProfiles || [])])];
  const byId = new Map();
  for (const p of [...(a.profiles || []), ...(b.profiles || [])]) {
    if (deleted.includes(p.id)) continue;
    byId.set(p.id, byId.has(p.id) ? mergeProfile(byId.get(p.id), p) : p);
  }
  const [fa, fb] = (a.familyGoalAt || '') >= (b.familyGoalAt || '') ? [a, b] : [b, a];
  return {
    profiles: [...byId.values()].sort((p, q) => (p.createdAt || '').localeCompare(q.createdAt || '')),
    deletedProfiles: deleted,
    familyGoal: fa.familyGoal ?? fb.familyGoal ?? null,
    familyGoalAt: fa.familyGoalAt || fb.familyGoalAt || '',
  };
}

/** Stabiler Fingerabdruck, um unnötige Uploads zu vermeiden. */
export async function fingerprint(payload) {
  return hex(await sha(JSON.stringify(payload))).slice(0, 16);
}
