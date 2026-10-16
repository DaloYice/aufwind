// Schlankes SVG-Liniendiagramm für Messwerte.
import { esc } from './ui.js';
import { formatDate } from './core/dates.js';

export function lineChart(points, { unit = '', w = 600, h = 220 } = {}) {
  if (points.length === 0) return '<p class="muted center">Noch keine Einträge – trag unten deinen ersten Wert ein.</p>';
  const pad = { l: 44, r: 12, t: 14, b: 28 };
  const vals = points.map((p) => p.value);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;
  min -= span * 0.1; max += span * 0.1;
  const x = (i) => pad.l + (points.length === 1 ? (w - pad.l - pad.r) / 2 : (i / (points.length - 1)) * (w - pad.l - pad.r));
  const y = (v) => pad.t + (1 - (v - min) / (max - min)) * (h - pad.t - pad.b);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join('');
  const area = `${path}L${x(points.length - 1).toFixed(1)},${h - pad.b}L${x(0).toFixed(1)},${h - pad.b}Z`;
  const ticks = [0, 0.5, 1].map((f) => min + f * (max - min));
  const labelIdx = points.length <= 6 ? points.map((_, i) => i) : [0, Math.floor((points.length - 1) / 2), points.length - 1];
  const dec = span < 10 ? 1 : 0;
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Verlauf ${esc(unit)}">
    ${ticks.map((t) => `<line class="axis" x1="${pad.l}" x2="${w - pad.r}" y1="${y(t)}" y2="${y(t)}"/>
      <text class="lbl" x="${pad.l - 6}" y="${y(t) + 4}" text-anchor="end">${t.toFixed(dec)}</text>`).join('')}
    <path class="area" d="${area}" opacity=".6"/>
    <path class="line" d="${path}"/>
    ${points.map((p, i) => `<circle class="dot" cx="${x(i)}" cy="${y(p.value)}" r="${points.length > 30 ? 2 : 4}"><title>${formatDate(p.date)}: ${p.value} ${esc(unit)}</title></circle>`).join('')}
    ${labelIdx.map((i) => `<text class="lbl" x="${x(i)}" y="${h - 8}" text-anchor="middle">${formatDate(points[i].date)}</text>`).join('')}
  </svg>`;
}
