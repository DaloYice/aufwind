// Verlauf je Übung: was tatsächlich geschafft wurde, Bestwerte.
// profile.exLog[übungsId] = [{ date, best }]  – best = größte Menge an dem Tag (Wdh. oder Sekunden je Satz)

/** Geschaffte Sätze eintragen. Gibt neue Bestwerte zurück (nur wenn es schon frühere Einträge gab). */
export function recordExercises(profile, dateKey, done = []) {
  profile.exLog ||= {};
  const records = [];
  const bestPerId = {};
  for (const d of done) if (d.amount > 0) bestPerId[d.id] = Math.max(bestPerId[d.id] || 0, d.amount);
  for (const [id, amount] of Object.entries(bestPerId)) {
    const list = (profile.exLog[id] ||= []);
    const prevBest = list.reduce((m, e) => Math.max(m, e.best), 0);
    const today = list.find((e) => e.date === dateKey);
    if (today) today.best = Math.max(today.best, amount);
    else list.push({ date: dateKey, best: amount });
    list.sort((a, b) => a.date.localeCompare(b.date));
    if (prevBest > 0 && amount > prevBest) records.push({ id, amount, prev: prevBest });
  }
  return records;
}

/** Kennzahlen einer Übung oder null, wenn noch nie gemacht. */
export function exStats(profile, id) {
  const list = profile.exLog?.[id];
  if (!list?.length) return null;
  const bestEntry = list.reduce((a, b) => (b.best > a.best ? b : a));
  const last = list.at(-1);
  return { days: list.length, best: bestEntry.best, bestDate: bestEntry.date, last: last.best, lastDate: last.date, list };
}

/** Abgleich: je Übung und Tag der größere Wert. */
export function mergeExLog(a = {}, b = {}) {
  const out = {};
  for (const id of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const m = new Map();
    for (const e of [...(a[id] || []), ...(b[id] || [])]) m.set(e.date, Math.max(m.get(e.date) || 0, e.best));
    out[id] = [...m].map(([date, best]) => ({ date, best })).sort((x, y) => x.date.localeCompare(y.date));
  }
  return out;
}
