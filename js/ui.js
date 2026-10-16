// Kleine UI-Helfer.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

let toastTimer;
export function toast(msg, ms = 2800) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

/** Bottom-Sheet öffnen; gibt das Sheet-Element zurück. */
let sheetReturn = null;
export function openSheet(html) {
  if ($('#overlay').hidden) sheetReturn = document.activeElement;
  const ov = $('#overlay');
  ov.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
  ov.hidden = false;
  ov.onclick = (e) => { if (e.target === ov || e.target.closest('[data-close]')) closeSheet(); };
  document.addEventListener('keydown', escClose);
  const sheet = ov.firstElementChild;
  sheet.querySelector('button, input, a')?.focus();
  return sheet;
}

function escClose(e) {
  if (e.key === 'Escape') closeSheet();
  if (e.key === 'Tab') {
    // Fokus im Dialog halten
    const f = $$('button, a[href], input, select, textarea, summary', $('#overlay')).filter((x) => !x.disabled && x.offsetParent);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
    else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
  }
}

export function closeSheet() {
  const ov = $('#overlay');
  ov.hidden = true;
  ov.innerHTML = '';
  document.removeEventListener('keydown', escClose);
  if (sheetReturn?.isConnected) sheetReturn.focus();
  sheetReturn = null;
}

export function fmtAmount(ex, amount) {
  if (ex.unit === 'wdh') return `${amount}× ${ex.perSide ? 'je Seite' : ''}`.trim();
  const t = amount >= 60 ? `${Math.floor(amount / 60)}:${String(amount % 60).padStart(2, '0')} Min` : `${amount} Sek`;
  return ex.perSide ? `${t} je Seite` : t;
}

export function fmtClock(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : String(s);
}

export function download(filename, text, type = 'application/json') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
