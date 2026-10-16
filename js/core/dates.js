// Datumshelfer mit lokalen Kalendertagen im Format YYYY-MM-DD.
export function toKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key, n) {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export function diffDays(a, b) {
  return Math.round((fromKey(a) - fromKey(b)) / 86400000);
}

export function formatDate(key, opts = { day: '2-digit', month: '2-digit' }) {
  return fromKey(key).toLocaleDateString('de-DE', opts);
}
