// Schlanke SVG-Diagramme: Verlauf für Messwerte (optional mit Trendlinie) und Mini-Verlauf für Kennzahl-Kacheln.
import { esc } from './ui.js';
import { formatDate, diffDays } from './core/dates.js';

/** Gleitendes Mittel über die letzten `days` Tage je Messpunkt (glättet Tagesschwankungen). */
export function trendValues(points, days = 14) {
  return points.map((p) => {
    const win = points.filter((q) => q.date <= p.date && diffDays(p.date, q.date) < days);
    return win.reduce((t, q) => t + q.value, 0) / win.length;
  });
}

/**
 * @param {{date:string, value:number}[]} points
 * @param {{unit?:string, w?:number, h?:number, trend?:boolean}} opts  trend: Messpunkte zart, Trendlinie kräftig
 */
export function lineChart(points, { unit = '', w = 360, h = 190, trend = false } = {}) {
  if (points.length === 0) return '<p class="muted center">Noch keine Einträge – trag unten deinen ersten Wert ein.</p>';
  const pad = { l: 38, r: 10, t: 12, b: 24 };
  const vals = points.map((p) => p.value);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;
  min -= span * 0.1; max += span * 0.1;
  const x = (i) => pad.l + (points.length === 1 ? (w - pad.l - pad.r) / 2 : (i / (points.length - 1)) * (w - pad.l - pad.r));
  const y = (v) => pad.t + (1 - (v - min) / (max - min)) * (h - pad.t - pad.b);
  const showTrend = trend && points.length >= 4;
  const line = showTrend ? trendValues(points) : vals;
  const path = line.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const area = `${path}L${x(points.length - 1).toFixed(1)},${h - pad.b}L${x(0).toFixed(1)},${h - pad.b}Z`;
  const ticks = [0, 0.5, 1].map((f) => min + f * (max - min));
  const labelIdx = points.length <= 4 ? points.map((_, i) => i) : [0, Math.floor((points.length - 1) / 2), points.length - 1];
  const dec = span < 10 ? 1 : 0;
  const tip = (p, i) => `${formatDate(p.date, { day: '2-digit', month: '2-digit', year: 'numeric' })}: ${p.value} ${unit}${showTrend ? ` · Trend ${line[i].toFixed(1)} ${unit}` : ''}`;
  const svg = `<svg class="chart line-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Verlauf ${esc(unit)}">
    ${ticks.map((t) => `<line class="axis" x1="${pad.l}" x2="${w - pad.r}" y1="${y(t)}" y2="${y(t)}"/>
      <text class="lbl" x="${pad.l - 6}" y="${y(t) + 4}" text-anchor="end">${t.toFixed(dec)}</text>`).join('')}
    <path class="area" d="${area}"/>
    <path class="${showTrend ? 'trend' : 'line'}" d="${path}" pathLength="1"/>
    ${points.map((p, i) => `<g class="hit" data-tip="${esc(tip(p, i))}">
      <circle cx="${x(i)}" cy="${y(p.value)}" r="12" fill="transparent"/><circle class="dot${showTrend ? ' raw' : ''}" cx="${x(i)}" cy="${y(p.value)}" r="${showTrend ? 3 : 4}"/></g>`).join('')}
    ${showTrend ? `<circle class="dot" cx="${x(points.length - 1)}" cy="${y(line.at(-1))}" r="5" stroke-width="2"/>` : ''}
    ${labelIdx.map((i) => `<text class="lbl" x="${x(i)}" y="${h - 8}" text-anchor="${points.length > 1 && i === 0 ? 'start' : points.length > 1 && i === points.length - 1 ? 'end' : 'middle'}">${formatDate(points[i].date)}</text>`).join('')}
  </svg>`;
  return showTrend ? `${svg}<div class="chart-legend"><span><i></i>Trend</span><span><i class="dotted"></i>Messwert</span></div>` : svg;
}

/** Mini-Verlauf ohne Achsen für Kennzahl-Kacheln; der letzte Wert ist markiert. */
export function sparkline(values, { label = '' } = {}) {
  if (values.length < 2) return '';
  const w = 120, h = 30, pad = 3;
  let min = Math.min(...values), max = Math.max(...values);
  if (min === max) { min -= 1; max += 1; }
  const x = (i) => pad + (i / (values.length - 1)) * (w - pad * 2);
  const y = (v) => pad + (1 - (v - min) / (max - min)) * (h - pad * 2);
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="${esc(label)}">
    <path class="spark-area" d="${d}L${x(values.length - 1).toFixed(1)},${h}L${x(0)},${h}Z"/><path d="${d}" vector-effect="non-scaling-stroke"/>
    <circle cx="${x(values.length - 1).toFixed(1)}" cy="${y(values.at(-1)).toFixed(1)}" r="2.5"/></svg>`;
}
