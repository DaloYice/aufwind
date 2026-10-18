// Einheiten und Messwerte mit stabilen IDs und Löschmerkern (mit Zeitstempel),
// damit Bearbeiten, Löschen und Rückgängig auch über den Geräte-Abgleich halten.
// Regel: Ein Eintrag gilt als gelöscht, solange sein Löschmerker jünger ist als der Eintrag (`at`).

const OLD = '1970-01-01T00:00:00.000Z'; // Zeitpunkt für Löschmerker aus v0.3 (ohne Zeitstempel)
export const now = () => new Date().toISOString();
const rid = () => Math.random().toString(36).slice(2, 10);

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/** Schlüssel, mit dem v0.3 Einheiten erkannt hat – daraus entsteht die ID alter Einheiten (auf allen Geräten gleich). */
const legacyKey = (s) => `${s.date}|${s.slot}|${s.slot === 'morning' || s.slot === 'evening' ? '' : `${s.title || ''}|${Math.round(s.durationSec || 0)}`}`;
export const sessionId = (s) => s.id || `s${hash(legacyKey(s))}`;
export const isChallengeSlot = (slot) => slot === 'morning' || slot === 'evening';

/** Ergänzt IDs und wandelt alte Löschmerker um. */
export function normalizeRecords(p) {
  p.removedAt ||= {};
  for (const k of p.removedLogs || []) p.removedAt[`log:${k}`] ||= OLD;
  delete p.removedLogs;
  p.sessions ||= [];
  for (const s of p.sessions) s.id ||= sessionId(s);
  return p;
}

/** Lebt der Eintrag noch (kein jüngerer Löschmerker)? */
export const alive = (removedAt, key, at) => !((removedAt || {})[key] > (at || ''));

/** Morgen/Abend gibt es je Tag nur einmal; vollständige Einheit schlägt Teil-Einheit. */
export function challengeSession(p, date, slot) {
  return p.sessions.find((s) => s.date === date && s.slot === slot);
}

/** Neue Einheit eintragen. Bei Morgen/Abend wird eine vorhandene Teil-Einheit ersetzt, sonst nichts doppelt angelegt. */
export function addSession(p, data) {
  const s = { ...data, id: data.id || rid(), at: now() };
  if (isChallengeSlot(s.slot)) {
    const existing = challengeSession(p, s.date, s.slot);
    if (existing) {
      const upgraded = !!existing.partial && !s.partial;
      if (upgraded) {
        Object.assign(existing, { ...s, id: existing.id });
        delete existing.partial;
      }
      return { session: existing, added: false, upgraded };
    }
  }
  p.sessions.push(s);
  p.sessions.sort((a, b) => a.date.localeCompare(b.date));
  return { session: s, added: true };
}

export function updateSession(p, id, patch) {
  const s = p.sessions.find((x) => x.id === id);
  if (!s) return null;
  Object.assign(s, patch, { at: now() });
  p.sessions.sort((a, b) => a.date.localeCompare(b.date));
  return s;
}

/** Entfernt eine Einheit und gibt sie zurück (für Rückgängig). */
export function removeSession(p, id) {
  const s = p.sessions.find((x) => x.id === id);
  if (!s) return null;
  p.sessions = p.sessions.filter((x) => x !== s);
  p.removedAt[`s:${id}`] = now();
  return s;
}

export function restoreSession(p, s) {
  if (p.sessions.some((x) => x.id === s.id)) return;
  p.sessions.push({ ...s, at: now() });
  p.sessions.sort((a, b) => a.date.localeCompare(b.date));
}

export function addLogEntry(p, kind, value, date) {
  const list = (p.logs[kind] ||= []);
  const existing = list.find((e) => e.date === date);
  if (existing) Object.assign(existing, { value, at: now() });
  else list.push({ date, value, at: now() });
  list.sort((a, b) => a.date.localeCompare(b.date));
}

export function removeLogEntry(p, kind, date) {
  const e = (p.logs[kind] || []).find((x) => x.date === date);
  p.logs[kind] = (p.logs[kind] || []).filter((x) => x.date !== date);
  p.removedAt[`log:${kind}:${date}`] = now();
  return e || null;
}

export function restoreLogEntry(p, kind, entry) {
  addLogEntry(p, kind, entry.value, entry.date);
}

// ---------- Zusammenführen (Geräte-Abgleich) ----------

const later = (a, b) => ((b.at || '') > (a.at || '') ? b : a);

function unionLatest(a = [], b = [], key) {
  const m = new Map();
  for (const x of a) m.set(key(x), x);
  for (const x of b) m.set(key(x), m.has(key(x)) ? later(m.get(key(x)), x) : x);
  return [...m.values()];
}

/** Löschmerker beider Stände: je Schlüssel der jüngste. */
export function mergeRemoved(a = {}, b = {}) {
  const out = { ...a };
  for (const [k, t] of Object.entries(b)) if (!(out[k] >= t)) out[k] = t;
  return out;
}

/** Einheiten vereinigen: gleiche ID → jüngere Fassung; Gelöschtes raus; Morgen/Abend je Tag höchstens einmal. */
export function mergeSessions(newer = [], older = [], removedAt = {}) {
  const all = unionLatest(newer, older, (s) => s.id).filter((s) => alive(removedAt, `s:${s.id}`, s.at));
  const seen = new Map();
  const out = [];
  for (const s of all) {
    if (!isChallengeSlot(s.slot)) { out.push(s); continue; }
    const k = `${s.date}|${s.slot}`;
    const prev = seen.get(k);
    if (!prev) { seen.set(k, s); out.push(s); continue; }
    if (prev.partial && !s.partial) { out[out.indexOf(prev)] = s; seen.set(k, s); }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export function mergeLogs(newer = {}, older = {}, removedAt = {}) {
  const logs = {};
  for (const kind of new Set([...Object.keys(newer), ...Object.keys(older)])) {
    logs[kind] = unionLatest(newer[kind], older[kind], (e) => e.date)
      .filter((e) => alive(removedAt, `log:${kind}:${e.date}`, e.at))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  return logs;
}
