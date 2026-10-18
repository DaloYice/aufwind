// Feine Linien-Icons (24er Raster, Farbe über currentColor) für das ruhige Design ab v0.5.0.
const svg = (d, extra = '') => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"${extra}>${d}</svg>`;

export const ICON = {
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  back: svg('<path d="M9 14l-5-5 5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>'),
  sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  moon: svg('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'),
  leaf: svg('<path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15"/><path d="M5 19c3-4 6-6 9-7.5"/>'),
  drop: svg('<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>'),
  users: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14.5c2.3 0 4 1.5 4.5 4"/>'),
  flag: svg('<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>'),
  bulb: svg('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>'),
  heart: svg('<path d="M12 20s-7.5-4.5-7.5-10A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7.5 3c0 5.5-7.5 10-7.5 10z"/>'),
  swap: svg('<path d="M4 9h13l-3-3M20 15H7l3 3"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  minus: svg('<path d="M5 12h14"/>'),
  flame: svg('<path d="M12 21c-4 0-6.5-2.6-6.5-6 0-3.8 3.4-5.6 4-9.5 2.7 1.5 4 4 4 6 1-.6 1.7-1.6 2-3 1.8 1.6 3 3.9 3 6.5 0 3.4-2.5 6-6.5 6z"/>'),
  chevron: svg('<path d="M9 6l6 6-6 6"/>'),
  chart: svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
  spine: svg('<path d="M12 2.5v19"/><path d="M8.5 5.5h7M8 9.5h8M8 13.5h8M8.5 17.5h7"/>'),
  flower: svg('<path d="M12 20c-4.4 0-7.5-3.1-7.5-7.5 3.2 0 5.6 1.2 7.5 3.4 1.9-2.2 4.3-3.4 7.5-3.4 0 4.4-3.1 7.5-7.5 7.5z"/><path d="M12 15.9c-1.6-2-2.3-4-2.3-6.2 0-2.3 1-4.4 2.3-5.7 1.3 1.3 2.3 3.4 2.3 5.7 0 2.2-.7 4.2-2.3 6.2z"/>'),
  dumbbell: svg('<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>'),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.1"/>'),
  sliders: svg('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>'),
};

/** Kleine runde Icon-Fläche in einer Akzentfarbe (green, orange, blue, violet). */
export const icoTile = (name, tone = 'green') => `<span class="tile-ico ${tone}">${ICON[name]}</span>`;
