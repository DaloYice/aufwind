// Animierte Strichfigur (SVG) mit 2-Gelenk-IK.
// Eine Pose legt Becken (px, py), Rumpfneigung t (Grad, 0 = aufrecht) und Zielpunkte
// für Hände/Füße fest; Knie und Ellbogen werden berechnet. Koordinaten: viewBox 200×200, Boden y = 185.
import { POSES } from './data/poses.js';

const L = { torso: 50, thigh: 42, shin: 42, upper: 30, fore: 28, head: 11, neck: 14 };
const rad = (d) => (d * Math.PI) / 180;
const NS = 'http://www.w3.org/2000/svg';

/** Gelenkpunkt zwischen a und Ziel b; pref gibt die bevorzugte Knickrichtung vor. */
function ik(a, b, l1, l2, pref) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.01) || 0.01;
  const base = Math.atan2(dy, dx);
  const alpha = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  const c1 = [a[0] + l1 * Math.cos(base + alpha), a[1] + l1 * Math.sin(base + alpha)];
  const c2 = [a[0] + l1 * Math.cos(base - alpha), a[1] + l1 * Math.sin(base - alpha)];
  const dot = (c) => (c[0] - a[0]) * pref[0] + (c[1] - a[1]) * pref[1];
  const joint = dot(c1) >= dot(c2) ? c1 : c2;
  // Ende auf erreichbare Länge begrenzen
  const ang = Math.atan2(b[1] - joint[1], b[0] - joint[0]);
  return [joint, [joint[0] + l2 * Math.cos(ang), joint[1] + l2 * Math.sin(ang)]];
}

/** Berechnet alle Segmente einer Pose. */
export function solve(pose, view = 'side') {
  const p = [pose.px, pose.py];
  const t = rad(pose.t || 0);
  const up = [Math.sin(t), -Math.cos(t)];
  const neck = [p[0] + L.torso * up[0], p[1] + L.torso * up[1]];
  const sh = pose.sh || 0; // Schultern heben
  const ht = rad(pose.ht || 0);
  const head = [neck[0] + L.neck * Math.sin(t + ht) + (pose.hx || 0), neck[1] - L.neck * Math.cos(t + ht)];
  const th = (pose.th || 1) * L.thigh;
  let hips, shoulders, prefLeg, prefArm;
  if (view === 'front') {
    const side = [Math.cos(t), Math.sin(t)];
    const sw = pose.sw ?? 14;
    hips = [[p[0] - 9 * side[0], p[1] - 9 * side[1]], [p[0] + 9 * side[0], p[1] + 9 * side[1]]];
    const s0 = [neck[0] - up[0] * 4, neck[1] - up[1] * 4 + sh];
    shoulders = [[s0[0] - sw * side[0], s0[1] - sw * side[1]], [s0[0] + sw * side[0], s0[1] + sw * side[1]]];
    prefLeg = [[-1, 0], [1, 0]];
    prefArm = [[-1, 0.2], [1, 0.2]];
  } else {
    hips = [p, p];
    const s0 = [neck[0] - up[0] * 5, neck[1] - up[1] * 5 + sh];
    shoulders = [s0, s0];
    prefLeg = [pose.kp || [1, -0.25], pose.kp2 || pose.kp || [1, -0.25]];
    prefArm = [pose.ep || [-0.6, 1], pose.ep2 || pose.ep || [-0.6, 1]];
  }
  const legs = [pose.f2, pose.f1].map((f, i) => [hips[i], ...ik(hips[i], f, th, L.shin, prefLeg[i])]);
  const arms = [pose.h2, pose.h1].map((h, i) => [shoulders[i], ...ik(shoulders[i], h, L.upper, L.fore, prefArm[i])]);
  return { p, neck, head, legs, arms, view, tip: pose.tip || 0 };
}

const lerp = (a, b, k) => a + (b - a) * k;
const DEFAULTS = { sw: 14, th: 1 };
function mix(a, b, k) {
  const out = {};
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const va = a[key] ?? (Array.isArray(b[key]) ? b[key] : DEFAULTS[key] ?? 0);
    const vb = b[key] ?? (Array.isArray(a[key]) ? a[key] : DEFAULTS[key] ?? 0);
    if (Array.isArray(va)) out[key] = va.map((v, i) => lerp(v, vb[i], k));
    else out[key] = lerp(va, vb, k);
  }
  return out;
}

function propsSVG(props = []) {
  return props.map((pr) => {
    const [type, x = 0, y = 0, dir = 1] = pr;
    if (type === 'chair') {
      // Seitenansicht: Lehne bei x, Sitzfläche Richtung dir
      const s = x + 44 * dir;
      return `<path d="M${x} 95 V185 M${x} 147 H${s} M${s} 147 V185" class="prop"/><rect x="${Math.min(x, s)}" y="145" width="44" height="5" rx="2" class="prop-fill"/>`;
    }
    if (type === 'chairFront') return `<rect x="72" y="146" width="56" height="6" rx="2" class="prop-fill"/><path d="M76 152 V185 M124 152 V185 M76 146 V100 H124 V146" class="prop"/>`;
    if (type === 'wall') return `<path d="M${x} 20 V185" class="prop thick"/>`;
    if (type === 'table') return `<rect x="${x}" y="${y}" width="${200 - x}" height="7" rx="2" class="prop-fill"/><path d="M${x + 8} ${y + 7} V185 M196 ${y + 7} V185" class="prop"/>`;
    if (type === 'stairs') return `<path d="M${x} 185 V170 H${x + 30} V155 H${x + 60} V140 H200" class="prop thick"/>`;
    if (type === 'mat') return `<rect x="10" y="184" width="180" height="4" rx="2" class="prop-fill"/>`;
    return '';
  }).join('');
}

function limbPath(seg, foot, tip = 0) {
  let d = `M${seg[0][0].toFixed(1)} ${seg[0][1].toFixed(1)} L${seg[1][0].toFixed(1)} ${seg[1][1].toFixed(1)} L${seg[2][0].toFixed(1)} ${seg[2][1].toFixed(1)}`;
  if (foot === 'side') {
    // Fuß: kurzes Stück senkrecht zum Unterschenkel, nach vorne (rechts) zeigend
    const vx = seg[2][0] - seg[1][0], vy = seg[2][1] - seg[1][1];
    const n = Math.hypot(vx, vy) || 1;
    let px = -vy / n, py = vx / n;
    if (px < 0) { px = -px; py = -py; }
    let ex = px * 11, ey = py * 11;
    const dy = 185 - seg[2][1];
    if (tip > 0 && dy > 0 && dy < 11) {
      // Zehenstand: Fußspitze bleibt am Boden
      ex += (Math.sqrt(121 - dy * dy) - ex) * tip;
      ey += (dy - ey) * tip;
    }
    d += ` l${ex.toFixed(1)} ${ey.toFixed(1)}`;
  }
  return d;
}

function draw(svg, s) {
  const front = s.view === 'front';
  const parts = svg.querySelector('.fig');
  const [farLeg, nearLeg] = s.legs;
  const [farArm, nearArm] = s.arms;
  const footMode = front ? 'front' : 'side';
  parts.innerHTML = `
    <path class="limb ${front ? '' : 'far'}" d="${limbPath(farLeg, footMode, s.tip)}"/>
    <path class="limb ${front ? '' : 'far'}" d="${limbPath(farArm)}"/>
    <path class="torso" d="M${s.p[0].toFixed(1)} ${s.p[1].toFixed(1)} L${s.neck[0].toFixed(1)} ${s.neck[1].toFixed(1)}"/>
    ${front ? `<path class="torso thin" d="M${farLeg[0][0].toFixed(1)} ${farLeg[0][1].toFixed(1)} L${nearLeg[0][0].toFixed(1)} ${nearLeg[0][1].toFixed(1)} M${farArm[0][0].toFixed(1)} ${farArm[0][1].toFixed(1)} L${nearArm[0][0].toFixed(1)} ${nearArm[0][1].toFixed(1)}"/>` : ''}
    <path class="limb" d="${limbPath(nearLeg, footMode, s.tip)}"/>
    <path class="limb" d="${limbPath(nearArm)}"/>
    <circle class="head" cx="${s.head[0].toFixed(1)}" cy="${s.head[1].toFixed(1)}" r="${L.head}"/>`;
}

/**
 * Hängt eine animierte Figur in container. Gibt eine Stop-Funktion zurück.
 * Ohne Posen für die Übung wird nichts gerendert (Rückgabe null).
 */
export function mountFigure(container, exerciseId, { size = 200 } = {}) {
  const def = POSES[exerciseId];
  if (!def) return null;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 200 200');
  svg.setAttribute('class', 'figure');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Animierte Vorführung der Übung');
  svg.innerHTML = `<line x1="0" y1="185.5" x2="200" y2="185.5" class="ground"/>${propsSVG(def.props)}<g class="fig"></g>`;
  container.appendChild(svg);

  const keys = def.keys;
  const view = def.view || 'side';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0, stopped = false;
  const total = keys.reduce((t, k) => t + (k.d || 900), 0);
  const t0 = performance.now();

  function frame(now) {
    if (stopped || !svg.isConnected) return;
    let t = (now - t0) % total;
    let i = 0;
    while (t > (keys[i].d || 900)) { t -= keys[i].d || 900; i++; }
    const a = keys[i], b = keys[(i + 1) % keys.length];
    let k = t / (a.d || 900);
    k = reduce ? 0 : (1 - Math.cos(Math.PI * Math.min(1, k / (a.hold ? 0.6 : 1)))) / 2; // weich, optional mit Haltephase
    draw(svg, solve(mix(a.p, b.p, k), view));
    raf = requestAnimationFrame(frame);
  }
  if (keys.length === 1) draw(svg, solve(keys[0].p, view));
  else raf = requestAnimationFrame(frame);
  return () => { stopped = true; cancelAnimationFrame(raf); };
}

/** Statisches Einzelbild einer Schlüsselpose (für Vorschau/Tests). */
export function renderStatic(container, exerciseId, keyIndex = 0, size = 160) {
  const def = POSES[exerciseId];
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 200 200');
  svg.setAttribute('class', 'figure');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.innerHTML = `<line x1="0" y1="185.5" x2="200" y2="185.5" class="ground"/>${propsSVG(def.props)}<g class="fig"></g>`;
  draw(svg, solve(def.keys[Math.min(keyIndex, def.keys.length - 1)].p, def.view || 'side'));
  container.appendChild(svg);
  return svg;
}

export const hasFigure = (id) => !!POSES[id];
