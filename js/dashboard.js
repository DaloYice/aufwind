// Dashboard: Kennzahlen und Diagramme im Fortschritt-Tab (reines SVG, Tooltips, Tabellenansicht).
import { esc } from './ui.js';
import { addDays, formatDate, fromKey, toKey } from './core/dates.js';
import { weekStart, weekStats, weekGoal } from './core/week.js';
import { streak } from './core/progress.js';
import { CATEGORIES } from './data/exercises.js';
import { lineChart } from './chart.js';

const W = 360; // ≈ Handybreite, damit 11px-Beschriftungen auch wirklich ~11px groß sind
const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function minutesByDay(p) {
  const m = {};
  for (const s of p.sessions) m[s.date] = (m[s.date] || 0) + (s.durationSec || 0) / 60;
  return m;
}

/** Säule mit abgerundetem oberen Ende, an der Grundlinie verankert. */
function colPath(x, y, w, h, r = 4) {
  if (h <= 0) return '';
  r = Math.min(r, h, w / 2);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}
/** Waagerechter Balken mit abgerundetem rechten Ende. */
function barPath(x, y, w, h, r = 4) {
  if (w <= 0) return '';
  r = Math.min(r, w, h / 2);
  return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`;
}

function niceMax(v) {
  if (v <= 10) return 10;
  const p = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / p / (v / p > 5 ? 2 : 1)) * p * (v / p > 5 ? 2 : 1);
}

function table(head, rows) {
  return `<details class="viz-table"><summary>Als Tabelle anzeigen</summary><table><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></details>`;
}

function card(title, sub, body) {
  return `<section class="card viz"><h3 style="margin:0">${esc(title)}</h3>${sub ? `<p class="small muted" style="margin:2px 0 8px">${sub}</p>` : ''}${body}</section>`;
}

// ---------- Kennzahlen ----------
function kpis(p, today) {
  const ws = weekStart(today);
  const cur = weekStats(p, ws);
  const prev = weekStats(p, addDays(ws, -7));
  const delta = cur.minutes - prev.minutes;
  const w = p.logs?.weight || [];
  const wd = w.length > 1 ? Math.round((w.at(-1).value - w[0].value) * 10) / 10 : null;
  const st = streak(p, today).count;
  const tile = (label, value, sub) => `<div class="stat"><span class="small muted">${label}</span><b>${value}</b><span class="small muted">${sub}</span></div>`;
  return `<div class="kpis">
    ${tile('Serie', `${st}`, st === 1 ? 'Tag' : 'Tage')}
    ${tile('Diese Woche', `${cur.minutes}`, `Min · ${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)} zur Vorwoche`)}
    ${tile('Aktive Tage', `${cur.activeDays}`, cur.reached ? `🎯 Ziel ${weekGoal(p, ws)} erreicht` : `von ${weekGoal(p, ws)} als Wochenziel`)}
    ${tile('Gewicht', wd == null ? '–' : `${wd > 0 ? '+' : ''}${wd}`, wd == null ? 'noch zu wenig Daten' : 'kg seit Start')}
  </div>`;
}

// ---------- Wochenminuten (Säulen + WHO-Linie) ----------
function weeklyMinutes(p, today) {
  const ws = weekStart(today);
  const weeks = Array.from({ length: 12 }, (_, i) => weekStats(p, addDays(ws, (i - 11) * 7)));
  const H = 190, pad = { l: 30, r: 4, t: 14, b: 24 };
  const max = niceMax(Math.max(160, ...weeks.map((w) => w.minutes)));
  const iw = W - pad.l - pad.r, slot = iw / weeks.length, bw = slot - 2; // 2px Abstand
  const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const ticks = [0, max / 2, max];
  const svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Bewegungsminuten pro Woche, letzte 12 Wochen">
    ${ticks.map((t) => `<line class="grid" x1="${pad.l}" x2="${W - pad.r}" y1="${y(t)}" y2="${y(t)}"/><text class="lbl" x="${pad.l - 6}" y="${y(t) + 4}" text-anchor="end">${t}</text>`).join('')}
    ${weeks.map((w, i) => {
      const x = pad.l + i * slot + 1;
      const tip = `Woche ab ${formatDate(w.start)}: ${w.minutes} Min, ${w.sessions} Einheiten, ${w.activeDays} aktive Tage`;
      return `<g class="hit" data-tip="${esc(tip)}"><rect x="${x - 1}" y="${pad.t}" width="${slot}" height="${H - pad.t - pad.b}" fill="transparent"/>
        <path class="bar ${i === 11 ? 'cur' : ''}" d="${colPath(x, y(w.minutes), bw, y(0) - y(w.minutes))}"/></g>`;
    }).join('')}
    <line class="ref" x1="${pad.l}" x2="${W - pad.r}" y1="${y(150)}" y2="${y(150)}"/>
    <text class="lbl ref-lbl" x="${W - pad.r}" y="${y(150) - 5}" text-anchor="end">WHO-Ziel 150</text>
    ${weeks.map((w, i) => (i % 3 === 2 || i === 11) ? `<text class="lbl" x="${pad.l + i * slot + slot / 2}" y="${H - 8}" text-anchor="middle">${i === 11 ? 'diese' : formatDate(w.start)}</text>` : '').join('')}
  </svg>`;
  return card('Bewegung pro Woche', 'Minuten der letzten 12 Wochen. Die Linie zeigt das WHO-Fernziel – jede Säule darunter ist trotzdem ein Gewinn.',
    svg + table(['Woche ab', 'Minuten', 'Einheiten', 'Aktive Tage'], weeks.map((w) => [formatDate(w.start), w.minutes, w.sessions, w.activeDays])));
}

// ---------- Aktivitätskalender (Heatmap) ----------
const BUCKETS = [0, 5, 15, 30, 45];
const bucket = (m) => (m <= 0 ? 0 : m <= 5 ? 1 : m <= 15 ? 2 : m <= 30 ? 3 : m <= 45 ? 4 : 5);

function heatmap(p, today) {
  const byDay = minutesByDay(p);
  const weeks = 17;
  const start = addDays(weekStart(today), -(weeks - 1) * 7);
  const cell = 14, gap = 3, padL = 24, padT = 16;
  const w = padL + weeks * (cell + gap), h = padT + 7 * (cell + gap);
  let cells = '', months = '';
  let lastMonth = -1;
  for (let c = 0; c < weeks; c++) {
    const col = addDays(start, c * 7);
    const m = fromKey(col).getMonth();
    if (m !== lastMonth) {
      months += `<text class="lbl" x="${padL + c * (cell + gap)}" y="10">${fromKey(col).toLocaleDateString('de-DE', { month: 'short' })}</text>`;
      lastMonth = m;
    }
    for (let r = 0; r < 7; r++) {
      const d = addDays(col, r);
      if (d > today) continue;
      const min = Math.round(byDay[d] || 0);
      cells += `<rect class="hm hm${bucket(min)}" x="${padL + c * (cell + gap)}" y="${padT + r * (cell + gap)}" width="${cell}" height="${cell}" rx="3"
        data-tip="${esc(`${formatDate(d, { weekday: 'short', day: '2-digit', month: '2-digit' })}: ${min ? `${min} Min` : 'keine Bewegung eingetragen'}`)}"/>`;
    }
  }
  const labels = [0, 2, 4].map((r) => `<text class="lbl" x="0" y="${padT + r * (cell + gap) + 11}">${WEEKDAYS[r]}</text>`).join('');
  const legend = `<div class="hm-legend small muted">weniger ${[0, 1, 2, 3, 4, 5].map((b) => `<svg width="14" height="14" aria-hidden="true"><rect class="hm hm${b}" width="14" height="14" rx="3"/></svg>`).join('')} mehr
    <span class="sr-only">Stufen: 0, bis 5, bis 15, bis 30, bis 45, über 45 Minuten</span></div>`;
  const active = Object.keys(byDay).filter((d) => d >= start && d <= today).length;
  return card('Aktivitätskalender', `${active} aktive Tage in den letzten ${weeks} Wochen. Jedes Kästchen ist ein Tag.`,
    `<div class="hm-wrap"><svg class="chart hm-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Kalender mit Bewegungsminuten pro Tag">${months}${labels}${cells}</svg></div>${legend}`);
}

// ---------- Schwerpunkte (Kategorien, 30 Tage) ----------
function focus(p, today) {
  const from = addDays(today, -29);
  const sums = Object.fromEntries(Object.keys(CATEGORIES).map((c) => [c, 0]));
  let other = 0;
  for (const s of p.sessions.filter((x) => x.date >= from)) {
    if (s.cats) for (const [c, sec] of Object.entries(s.cats)) sums[c] = (sums[c] || 0) + sec / 60;
    else other += (s.durationSec || 0) / 60;
  }
  const rows = Object.entries(sums).map(([c, m]) => ({ label: `${CATEGORIES[c].icon} ${CATEGORIES[c].label}`, value: Math.round(m) }));
  if (other >= 1) rows.push({ label: '➕ Sonstiges', value: Math.round(other) });
  const max = Math.max(1, ...rows.map((r) => r.value));
  const rowH = 30, labelW = 118, valW = 54, H = rows.length * rowH;
  const bw = W - labelW - valW;
  const svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Minuten je Trainingsbereich, letzte 30 Tage">
    ${rows.map((r, i) => `<g class="hit" data-tip="${esc(`${r.label}: ${r.value} Min`)}">
      <rect x="0" y="${i * rowH}" width="${W}" height="${rowH}" fill="transparent"/>
      <text class="lbl strong" x="0" y="${i * rowH + 19}">${esc(r.label)}</text>
      <rect class="track" x="${labelW}" y="${i * rowH + 8}" width="${bw}" height="14" rx="4"/>
      <path class="bar" d="${barPath(labelW, i * rowH + 8, (r.value / max) * bw, 14)}"/>
      <text class="lbl" x="${W}" y="${i * rowH + 19}" text-anchor="end">${r.value} Min</text></g>`).join('')}
  </svg>`;
  const total = rows.reduce((t, r) => t + r.value, 0);
  return card('Schwerpunkte', total ? 'Minuten je Trainingsbereich in den letzten 30 Tagen.' : 'Sobald du Challenges machst, siehst du hier, was du trainierst.',
    svg + table(['Bereich', 'Minuten'], rows.map((r) => [r.label, r.value])));
}

// ---------- Wochentage ----------
function weekdays(p, today) {
  const from = addDays(today, -55);
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const s of p.sessions.filter((x) => x.date >= from)) counts[(fromKey(s.date).getDay() + 6) % 7]++;
  const max = Math.max(1, ...counts);
  const H = 150, pad = { t: 18, b: 24 }, slot = W / 7, bw = Math.min(40, slot - 2);
  const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const best = counts.indexOf(Math.max(...counts));
  const svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Einheiten je Wochentag, letzte 8 Wochen">
    <line class="grid" x1="0" x2="${W}" y1="${y(0)}" y2="${y(0)}"/>
    ${counts.map((c, i) => {
      const x = i * slot + (slot - bw) / 2;
      return `<g class="hit" data-tip="${WEEKDAYS[i]}: ${c} Einheiten"><rect x="${i * slot}" y="0" width="${slot}" height="${H}" fill="transparent"/>
        <path class="bar" d="${colPath(x, y(c), bw, y(0) - y(c))}"/>
        ${c ? `<text class="lbl" x="${x + bw / 2}" y="${y(c) - 5}" text-anchor="middle">${c}</text>` : ''}
        <text class="lbl strong" x="${x + bw / 2}" y="${H - 6}" text-anchor="middle">${WEEKDAYS[i]}</text></g>`;
    }).join('')}
  </svg>`;
  const sum = counts.reduce((a, b) => a + b, 0);
  const names = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
  return card('Deine starken Tage', sum ? `Am häufigsten aktiv: <b>${names[best]}</b> (letzte 8 Wochen). Plane schwierige Tage bewusst ein.` : 'Zeigt, an welchen Wochentagen du am häufigsten trainierst.', svg);
}

// ---------- Gefühl (divergierend: zu leicht ↔ zu schwer) ----------
function feeling(p) {
  const last = p.sessions.filter((s) => s.slot !== 'extra').slice(-20);
  const n = { leicht: 0, passt: 0, schwer: 0 };
  last.forEach((s) => (n[s.feedback] = (n[s.feedback] || 0) + 1));
  const total = last.length;
  if (!total) return card('So fühlen sich die Einheiten an', 'Nach jeder Challenge fragst du dich: zu leicht, passt oder zu schwer? Hier erscheint die Verteilung.', '');
  const segs = [['leicht', 'Zu leicht', 'pos'], ['passt', 'Genau richtig', 'mid'], ['schwer', 'Zu anstrengend', 'neg']];
  let x = 0;
  const bar = segs.map(([k, label, cls]) => {
    const w = (n[k] / total) * W;
    const seg = w > 0 ? `<rect class="seg ${cls}" x="${x + (x ? 1 : 0)}" y="0" width="${Math.max(0, w - (x ? 1 : 0) - (x + w < W ? 1 : 0))}" height="26" rx="4" data-tip="${label}: ${n[k]} von ${total}"/>` : '';
    x += w;
    return seg;
  }).join('');
  const legend = segs.map(([k, label, cls]) => `<span class="lg"><i class="sw ${cls}"></i>${label} <b>${n[k]}</b></span>`).join('');
  const msg = n.schwer > total / 2 ? 'Oft zu anstrengend – die App senkt automatisch die Intensität. Du kannst auch im Profil ein Level zurückgehen.'
    : n.leicht > total / 2 ? 'Meist zu leicht – bald schlägt dir die App das nächste Level vor.' : 'Gute Mischung – so wächst du stetig.';
  return card('So fühlen sich die Einheiten an', `Letzte ${total} Einheiten. ${msg}`,
    `<svg class="chart" viewBox="0 0 ${W} 26" role="img" aria-label="Verteilung der Rückmeldungen">${bar}</svg><div class="legend">${legend}</div>`);
}

// ---------- Gewohnheiten & Wasser ----------
function habitsWater(p, today) {
  const days = Array.from({ length: 30 }, (_, i) => addDays(today, -i));
  const habits = days.filter((d) => p.habits?.[d]).length;
  const last7 = days.slice(0, 7);
  const avgWater = Math.round((last7.reduce((t, d) => t + (p.water?.[d] || 0), 0) / 7) * 10) / 10;
  const goal = p.waterGoal || 6;
  const meter = (label, value, max, text) => `<div class="meter"><div class="row spread small"><span>${label}</span><b>${text}</b></div>
    <div class="bar" role="meter" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="${max}" aria-label="${esc(label)}"><i style="width:${Math.min(100, (value / max) * 100)}%"></i></div></div>`;
  return card('Gewohnheiten & Trinken', '', `<div class="stack">
    ${meter('🌱 Gewohnheit des Tages (30 Tage)', habits, 30, `${habits} / 30 Tage`)}
    ${meter('💧 Gläser Wasser pro Tag (Ø 7 Tage)', avgWater, goal, `${avgWater} / ${goal}`)}
  </div>`);
}

function weight(p) {
  const w = p.logs?.weight || [];
  if (w.length < 2) return '';
  const h = p.answers?.heightCm;
  return card('Gewichtsverlauf', `${w.length} Einträge${h ? '' : ''}. Achte auf den Trend über Wochen, nicht auf einzelne Tage.`, lineChart(w, { unit: 'kg' }));
}

export function renderDashboard(p) {
  const today = toKey();
  return `<div class="stack">${kpis(p, today)}${weeklyMinutes(p, today)}${heatmap(p, today)}${weight(p)}${focus(p, today)}${weekdays(p, today)}${feeling(p)}${habitsWater(p, today)}</div>`;
}

// ---------- Tooltip-Ebene ----------
let tipEl;
export function bindTips(root) {
  tipEl ||= Object.assign(document.body.appendChild(document.createElement('div')), { className: 'viz-tip', role: 'tooltip' });
  const show = (target, x, y) => {
    tipEl.textContent = target.dataset.tip;
    tipEl.style.display = 'block';
    const r = tipEl.getBoundingClientRect();
    tipEl.style.left = `${Math.max(8, Math.min(innerWidth - r.width - 8, x - r.width / 2))}px`;
    tipEl.style.top = `${Math.max(8, y - r.height - 14)}px`;
    root.querySelectorAll('.is-hover').forEach((e) => e.classList.remove('is-hover'));
    target.classList.add('is-hover');
  };
  const hide = () => {
    tipEl.style.display = 'none';
    root.querySelectorAll('.is-hover').forEach((e) => e.classList.remove('is-hover'));
  };
  root.addEventListener('pointermove', (e) => {
    const t = e.target.closest('[data-tip]');
    if (t && root.contains(t)) show(t, e.clientX, e.clientY);
    else if (e.pointerType === 'mouse') hide();
  });
  root.addEventListener('pointerleave', hide);
  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tip]');
    if (t) show(t, e.clientX, e.clientY);
    else hide();
  });
  window.addEventListener('scroll', hide, { passive: true, once: true });
}
