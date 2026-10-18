// Kleine UI-Helfer.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

let toastTimer;
let actionShowing = false;
const waiting = []; // einfache Meldungen, die auf das Ende einer Meldung mit Knopf warten

function endToast() {
  $('#toast').classList.remove('show');
  actionShowing = false;
  const next = waiting.shift();
  if (next) setTimeout(() => toast(...next), 350);
}

/** Kurze Meldung; optional mit Knopf (z. B. Rückgängig). Eine Meldung mit Knopf wird nicht von einfachen Meldungen verdrängt. */
export function toast(msg, ms = 2800, action = null) {
  if (actionShowing && !action) { waiting.push([msg, ms]); return; }
  const el = $('#toast');
  el.textContent = msg;
  el.classList.toggle('has-action', !!action);
  actionShowing = !!action;
  if (action) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = action.label;
    b.addEventListener('click', () => {
      clearTimeout(toastTimer);
      endToast();
      action.fn();
    });
    el.append(' ', b);
  }
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(endToast, action ? Math.max(ms, 6000) : ms);
}

/** Meldung „Gelöscht“ mit Rückgängig-Knopf. */
export function undoToast(msg, undo) {
  toast(msg, 6000, { label: 'Rückgängig', fn: undo });
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
