// Geführter Workout-Modus: Übung → Pause → nächste Übung, mit Timer, Ton und Sprachansage.
import { byId, CATEGORIES } from './data/exercises.js';
import { esc, fmtAmount, fmtClock } from './ui.js';
import { mountFigure, hasFigure } from './figure.js';
import { confetti, haptic } from './confetti.js';
import { ICON } from './icons.js';

const REST_FACTOR = { kurz: 0.6, normal: 1, lang: 1.5 };

let audioCtx;
function beep(freq = 880, ms = 150) {
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.2, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + ms / 1000);
    o.connect(g).connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + ms / 1000);
  } catch { /* kein Audio */ }
}

function say(text, enabled) {
  if (!enabled || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE';
  u.rate = 1;
  speechSynthesis.speak(u);
}

/**
 * @param {object} challenge  aus challenges.js
 * @param {{speech:boolean, sound:boolean, rest?:'kurz'|'normal'|'lang'}} settings
 * @param {(result:{feedback:string, durationSec:number, partial?:boolean, doneSteps?:number}|null)=>void} onDone  null = abgebrochen
 * @param {{allowPartial?:boolean, history?:(id:string)=>({last:number,best:number}|null)}} [opts]
 *   allowPartial: beim Abbrechen darf der geschaffte Teil gespeichert werden; history: Verlauf je Übung für „Letztes Mal / Bestwert“
 * Ergebnis enthält `done`: tatsächlich geschaffte Sätze [{ id, amount }] (Wdh. per −/+ angepasst, übersprungene fehlen).
 */
export function runPlayer(challenge, settings, onDone, { allowPartial = false, history = null } = {}) {
  const root = document.createElement('div');
  root.className = 'player';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.tabIndex = -1;
  const returnFocus = document.activeElement;
  document.body.appendChild(root);

  let wakeLock = null;
  navigator.wakeLock?.request('screen').then((l) => (wakeLock = l)).catch(() => {});

  const steps = challenge.steps;
  const startedAt = Date.now();
  // Pausenlänge aus den Einstellungen (Programme ohne Pause bleiben ohne Pause)
  const restSec = challenge.rest ? Math.max(10, Math.round((challenge.rest * (REST_FACTOR[settings.rest] || 1)) / 5) * 5) : 0;
  let idx = 0;
  let phase = 'intro'; // intro | work | rest | done
  let remaining = 0;
  let total = 0;
  let paused = false;
  let side = 1; // für perSide-Zeitübungen
  let timer = null;
  let quitting = false; // Abbrechen-Abfrage offen
  let actual = 0; // tatsächliche Wiederholungen der aktuellen Übung (per −/+ anpassbar)
  const done = {}; // Schritt-Index → geschaffte Menge
  const doneList = () => Object.entries(done).map(([i, amount]) => ({ id: steps[i].id, amount }));
  const short = (ex, n) => (ex.unit === 'wdh' ? `${n}×` : `${n} s`);
  let pausedBeforeQuit = false;

  const sound = (f, ms) => settings.sound && beep(f, ms);

  function cleanup() {
    clearInterval(timer);
    speechSynthesis?.cancel?.();
    wakeLock?.release?.().catch(() => {});
    document.removeEventListener('visibilitychange', onVis);
    root.remove();
    returnFocus?.focus?.();
  }

  function onVis() {
    if (document.visibilityState === 'visible' && wakeLock?.released !== false) {
      navigator.wakeLock?.request('screen').then((l) => (wakeLock = l)).catch(() => {});
    }
  }
  document.addEventListener('visibilitychange', onVis);

  // Takt-Ansage (z. B. Beckenboden: „Anspannen … Lösen“) für Zeitübungen mit `cue: [[Text, Sekunden], …]`
  let cueIdx = -1;
  function updateCue() {
    const ex = phase === 'work' && byId[steps[idx]?.id];
    if (!ex?.cue) return;
    const cycle = ex.cue.reduce((t, c) => t + c[1], 0);
    let e = (total - remaining) % cycle;
    let i = 0;
    while (i < ex.cue.length - 1 && e >= ex.cue[i][1]) { e -= ex.cue[i][1]; i++; }
    if (i === cueIdx) return;
    const first = cueIdx === -1;
    cueIdx = i;
    const el = root.querySelector('.cue');
    if (el) { el.textContent = ex.cue[i][0]; el.dataset.phase = String(i); }
    if (first || paused) return; // Start: Übungsname wird gerade angesagt
    if (ex.cue[i][1] >= 3) say(ex.cue[i][0], settings.speech);
    else sound(i === 0 ? 880 : 520, 60);
    haptic(i === 0 ? 12 : 4);
  }

  function startTimer(sec) {
    cueIdx = -1;
    remaining = total = sec;
    clearInterval(timer);
    let last = performance.now();
    timer = setInterval(() => {
      const now = performance.now();
      if (!paused) remaining -= (now - last) / 1000;
      last = now;
      if (!paused && remaining <= 3.05 && remaining > 0 && Math.abs(remaining - Math.round(remaining)) < 0.13) sound(660, 80);
      if (remaining <= 0) {
        clearInterval(timer);
        sound(990, 250);
        next();
      } else updateRing();
    }, 250);
    updateRing();
  }

  function updateRing() {
    const fg = root.querySelector('.fg');
    const cnt = root.querySelector('.count');
    if (fg) fg.style.strokeDashoffset = String(565.5 * (1 - remaining / total));
    if (cnt) cnt.textContent = fmtClock(remaining);
    updateCue();
  }

  function ring(sec) {
    return `<div class="ring-wrap"><svg class="ring" viewBox="0 0 200 200" aria-hidden="true">
      <circle class="bg" cx="100" cy="100" r="90"/><circle class="fg" cx="100" cy="100" r="90" stroke-dasharray="565.5" stroke-dashoffset="0"/></svg>
      <div class="count" aria-live="off">${fmtClock(sec)}</div></div>`;
  }

  function header() {
    const pct = Math.round((idx / steps.length) * 100);
    return `<div class="row spread"><button class="icon-btn" data-act="quit" aria-label="Beenden">${ICON.close}</button>
      <span class="muted small">${Math.min(idx + 1, steps.length)} / ${steps.length}${challenge.rounds > 1 ? ` · Runde ${steps[Math.min(idx, steps.length - 1)].round}/${challenge.rounds}` : ''}</span>
      <button class="icon-btn" data-act="back" aria-label="${phase === 'rest' || idx > 0 ? 'Zurück zur vorigen Übung' : 'Übung neu starten'}">${ICON.back}</button></div>
      <div class="progressbar" style="margin:12px 0 0"><i style="width:${pct}%"></i></div>`;
  }

  function render() {
    cueIdx = -1; // Takt-Text nach dem Neuzeichnen still nachziehen
    const step = steps[idx];
    const ex = step && byId[step.id];
    let body = '';
    let controls = '';

    if (phase === 'intro') {
      body = `<div class="hero-emoji">${challenge.icon}</div><h1>${esc(challenge.title)}</h1>
        <p class="muted">${steps.length} Übungen · ca. ${challenge.minutes} Min</p>
        <div class="warn small" style="text-align:left">Bewege dich in deinem Tempo. Du solltest noch sprechen können.
        Bei Schmerzen, Brustenge oder Schwindel sofort aufhören.</div>`;
      controls = `<button class="btn block" data-act="start">Los geht's</button>`;
    } else if (phase === 'work') {
      const timed = ex.unit === 'sek';
      body = `${hasFigure(ex.id) ? '<div class="fig-stage" id="fig"></div>' : `<div class="ex-icon">${ex.icon}</div>`}
        <h1>${esc(ex.name)}</h1>
        <p class="muted">${CATEGORIES[ex.cat].label}${ex.perSide && timed ? ` · ${side === 1 ? 'erste' : 'zweite'} Seite` : ''}</p>
        ${timed && ex.cue ? `<div class="cue" data-phase="0" aria-live="polite">${esc(ex.cue[0][0])}</div>` : ''}
        ${timed ? ring(step.amount) : `<div class="rep-adjust"><button class="icon-btn" data-act="rep-" aria-label="Eine Wiederholung weniger">${ICON.minus}</button>
          <div class="count" aria-live="polite">${actual}×</div><button class="icon-btn" data-act="rep+" aria-label="Eine Wiederholung mehr">${ICON.plus}</button></div>
          <p class="small muted">${ex.perSide ? 'je Seite · ' : ''}in deinem Tempo – mehr oder weniger geschafft? Einfach anpassen.</p>`}
        ${(() => { const h = history?.(ex.id); return h ? `<p class="small hist">Letztes Mal <b>${short(ex, h.last)}</b> · Bestwert <b>${short(ex, h.best)}</b></p>` : ''; })()}
        <details><summary>So geht's</summary><ol class="steps">${ex.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
          <p class="small"><b>Tipp:</b> ${esc(ex.tip)}</p></details>
        <p class="small muted"><b>Zu schwer?</b> ${esc(ex.easier)}</p>`;
      controls = timed
        ? `<button class="btn ghost" data-act="pause">${paused ? 'Weiter' : 'Pause'}</button><button class="btn soft" data-act="skip">Überspringen</button>`
        : `<button class="btn ghost" data-act="skip">Überspringen</button><button class="btn" data-act="next">✓ Geschafft</button>`;
    } else if (phase === 'rest') {
      const nx = byId[steps[idx + 1].id];
      body = `<h2 class="rest">Kurz durchatmen</h2>${ring(restSec)}
        <div class="next-up">${hasFigure(nx.id) ? '<div class="fig-stage small" id="fig-next"></div>' : `<div class="ex-icon">${nx.icon}</div>`}
          <div><div class="eyebrow">Als Nächstes</div><h3>${esc(nx.name)}</h3><p class="small muted">${esc(fmtAmount(nx, steps[idx + 1].amount))}</p></div></div>`;
      controls = `<button class="btn ghost" data-act="pause">${paused ? 'Weiter' : 'Pause'}</button><button class="btn soft" data-act="more">+15 s</button><button class="btn" data-act="skip">Los</button>`;
    } else if (phase === 'done') {
      const min = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
      body = `<div class="hero-emoji">🎉</div><h1>Geschafft!</h1><p>${min} Minute${min > 1 ? 'n' : ''} Bewegung – stark.</p>
        <p class="muted">Wie war's? Damit passen wir die nächsten Challenges an dich an.</p>
        <div class="feedback">
          <button class="btn soft" data-fb="leicht">😌 Zu leicht – gerne mehr</button>
          <button class="btn" data-fb="passt">👍 Genau richtig</button>
          <button class="btn soft" data-fb="schwer">😮‍💨 Zu anstrengend</button>
        </div>`;
    }

    if (quitting) {
      const doneSteps = finishedSteps();
      const min = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
      const canSave = allowPartial && doneSteps > 0;
      body = `<div class="hero-emoji">⏸</div><h1>Aufhören?</h1>
        ${canSave ? `<p>Du hast schon <b>${doneSteps} von ${steps.length}</b> Übungen geschafft (ca. ${min} Min). Das zählt!</p>` : '<p class="muted">Kein Problem – jeder Tag ist anders.</p>'}`;
      controls = `<div class="feedback">
        ${canSave ? '<button class="btn" data-act="save-partial">Geschafftes speichern</button>' : ''}
        <button class="btn soft" data-act="resume">Weitermachen</button>
        <button class="btn ghost" data-act="discard">${canSave ? 'Verwerfen' : 'Beenden'}</button></div>`;
    }

    root.innerHTML = `${phase === 'done' || phase === 'intro' || quitting ? `<div class="row"><button class="icon-btn" data-act="${quitting ? 'resume' : 'quit'}" aria-label="${quitting ? 'Zurück zur Übung' : 'Schließen'}">${ICON.close}</button></div>` : header()}
      <div class="player-body">${body}</div><div class="player-controls">${controls}</div>`;
    const stage = root.querySelector('#fig');
    if (stage && ex) mountFigure(stage, ex.id, { size: 220 });
    const nextStage = root.querySelector('#fig-next');
    if (nextStage) mountFigure(nextStage, steps[idx + 1].id, { size: 120 });
  }

  /** Vollständig geschaffte Übungen (in der Pause zählt die gerade beendete mit). */
  function finishedSteps() {
    return Math.min(steps.length, phase === 'rest' ? idx + 1 : idx);
  }

  function enterWork() {
    phase = 'work';
    side = 1;
    paused = false;
    const step = steps[idx];
    const ex = byId[step.id];
    actual = step.amount;
    render();
    say(`${ex.name}. ${fmtAmount(ex, step.amount).replace('Sek', 'Sekunden').replace('×', ' mal')}`, settings.speech);
    if (ex.unit === 'sek') startTimer(step.amount);
  }

  function next(skipped = false) {
    const step = steps[idx];
    const ex = step && byId[step.id];
    if (phase === 'work' && ex.unit === 'sek' && ex.perSide && side === 1 && !skipped) {
      side = 2;
      render();
      say('Seite wechseln', settings.speech);
      startTimer(step.amount);
      return;
    }
    clearInterval(timer);
    if (phase === 'work') {
      if (skipped) delete done[idx];
      else done[idx] = ex.unit === 'sek' ? step.amount : actual;
    }
    if (phase === 'work' && idx < steps.length - 1 && !restSec) {
      // Intervall-Modus (Programme): direkt weiter ohne Pause
      idx++;
      sound(1320, 120);
      enterWork();
    } else if (phase === 'work' && idx < steps.length - 1) {
      phase = 'rest';
      paused = false;
      render();
      say(`Pause. Als Nächstes: ${byId[steps[idx + 1].id].name}`, settings.speech);
      startTimer(restSec);
    } else if (phase === 'rest') {
      idx++;
      enterWork();
    } else {
      idx = steps.length;
      phase = 'done';
      render();
      confetti();
      haptic(30);
      say('Geschafft! Super gemacht.', settings.speech);
    }
  }

  root.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    const fb = e.target.closest('[data-fb]')?.dataset.fb;
    if (fb) {
      const durationSec = Math.round((Date.now() - startedAt) / 1000);
      cleanup();
      onDone({ feedback: fb, durationSec, done: doneList() });
      return;
    }
    if (act === 'start') enterWork();
    else if (act === 'next') next();
    else if (act === 'skip') next(phase === 'work');
    else if (act === 'rep-' || act === 'rep+') {
      actual = Math.max(0, Math.min(999, actual + (act === 'rep+' ? 1 : -1)));
      const cnt = root.querySelector('.rep-adjust .count');
      if (cnt) cnt.textContent = `${actual}×`;
      haptic(5);
    } else if (act === 'back') {
      // In der Pause: gerade beendete Übung wiederholen; sonst eine zurück (bei der ersten: neu starten)
      clearInterval(timer);
      if (phase === 'work' && idx > 0) idx--;
      enterWork();
    } else if (act === 'more') {
      remaining += 15;
      total += 15;
      updateRing();
    } else if (act === 'pause') {
      paused = !paused;
      render();
      updateRing();
    } else if (act === 'quit') {
      if (phase === 'done' || phase === 'intro') { cleanup(); onDone(null); return; }
      quitting = true;
      pausedBeforeQuit = paused;
      paused = true;
      render();
      root.querySelector('[data-act="resume"]')?.focus();
    } else if (act === 'resume') {
      quitting = false;
      paused = pausedBeforeQuit;
      render();
      updateRing();
    } else if (act === 'discard') {
      cleanup();
      onDone(null);
    } else if (act === 'save-partial') {
      const doneSteps = finishedSteps();
      const durationSec = Math.round((Date.now() - startedAt) / 1000);
      cleanup();
      onDone({ feedback: 'passt', durationSec, partial: true, doneSteps, done: doneList() });
    }
  });

  render();
  root.querySelector('[data-act="start"]')?.focus();
}
