import * as store from './store.js';
import { $, $$, esc, toast, undoToast, openSheet, closeSheet, fmtAmount, download } from './ui.js';
import { runPlayer } from './player.js';
import { lineChart } from './chart.js';
import { toKey, addDays, fromKey, formatDate } from './core/dates.js';
import { LEVELS, QUESTIONS, HEALTH_FLAGS, assess, bmi, bmiClass } from './core/assessment.js';
import { challengeFor, habitOfDay, tipOfDay, exerciseSeconds, canSwap, swapExercise } from './core/challenges.js';
import { addSession, updateSession, removeSession, restoreSession } from './core/records.js';
import { streak, adjustIntensity, levelSuggestion, awardBadges, BADGES } from './core/progress.js';
import { weekStart, weekStats, weekGoal, reviewDue, suggestGoal, reviewMessage, familyProgress, defaultFamilyGoal } from './core/week.js';
import { EXERCISES, CATEGORIES, POSITIONS, byId } from './data/exercises.js';
import { PROGRAMS, programById, programState, programSession } from './data/programs.js';
import { mountFigure, hasFigure, renderStatic } from './figure.js';
import { confetti, haptic } from './confetti.js';
import { startSync, syncNow, syncCode, syncStatus, onSyncStatus, setupSync, joinSync, leaveSync, syncLink, qrSVG } from './sync.js';
import { formatCode } from './core/syncdata.js';
import { renderDashboard, bindTips } from './dashboard.js';
import { startReminders, enableNotifications, notifySupported } from './reminders.js';

const VERSION = '0.4.0';
const SLOT_NAMES = { morning: 'Morgen-Challenge', evening: 'Abend-Challenge', program: 'Programm', extra: 'Andere Bewegung' };
const view = $('#view');
const tabbar = $('#tabbar');
const EMOJIS = ['🙂', '😎', '🦊', '🐻', '🐢', '🦁', '🐱', '🌻', '⭐', '🚀', '🌈', '💪'];
const WHY = ['Mehr Energie im Alltag', 'Treppen ohne Pause schaffen', 'Mit Kindern oder Enkeln toben', 'Weniger Schmerzen', 'Gesündere Blutwerte', 'Mich wohler in meinem Körper fühlen', 'Abnehmen', 'Länger fit und selbstständig bleiben'];
const ANCHORS = {
  morning: ['Nach dem Aufstehen', 'Nach dem Zähneputzen', 'Nach dem ersten Kaffee oder Tee', 'Nach dem Frühstück', 'Bevor ich aus dem Haus gehe'],
  evening: ['Nach dem Abendessen', 'Wenn ich von der Arbeit komme', 'Vor den Nachrichten oder meiner Serie', 'Vor dem Zähneputzen am Abend', 'Wenn die Kinder im Bett sind'],
};
const opts = (list, sel, empty = '— kein fester Zeitpunkt —') =>
  `<option value="">${empty}</option>${list.map((o) => `<option ${o === sel ? 'selected' : ''}>${esc(o)}</option>`).join('')}`;

// ---------- Router ----------
const routes = { heute: renderToday, uebungen: renderLibrary, fortschritt: renderProgress, profil: renderProfile, neu: renderOnboarding };

function route() {
  const [name = 'heute', arg] = location.hash.replace(/^#\/?/, '').split('/');
  if (name === 'sync') {
    location.replace('#/heute'); // Code nicht im Verlauf stehen lassen
    setTimeout(() => showJoin(arg), 50);
    return;
  }
  const p = store.activeProfile();
  if (!p && name !== 'neu') { location.hash = '#/neu'; return; }
  closeSheet();
  tabbar.hidden = name === 'neu';
  $$('a', tabbar).forEach((a) => a.classList.toggle('active', a.dataset.tab === name));
  currentRoute = name;
  (routes[name] || renderToday)(p);
  window.scrollTo(0, 0);
}
let currentRoute = '';

/** Nach einem Abgleich neu zeichnen – aber nie mitten in einer Eingabe, einem Dialog oder Workout. */
let redrawPending = false;
function onRemoteChange() {
  const busyUI = document.querySelector('.player') || !$('#overlay').hidden || currentRoute === 'neu'
    || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
  if (busyUI) { redrawPending = true; return; }
  const y = scrollY;
  const p = store.activeProfile();
  if (!p) { location.hash = '#/neu'; return; }
  (routes[currentRoute] || renderToday)(p);
  scrollTo(0, y);
}
document.addEventListener('focusout', () => setTimeout(() => { if (redrawPending && $('#overlay').hidden) { redrawPending = false; onRemoteChange(); } }, 300));
window.addEventListener('hashchange', route);

// ---------- Onboarding / Einstufung ----------
function renderOnboarding() {
  const isFirst = store.getState().profiles.length === 0;
  const data = { name: '', emoji: EMOJIS[0], age: '', heightCm: '', weightKg: '', flags: [], why: [], whyText: '', plan: { morning: ANCHORS.morning[1], evening: ANCHORS.evening[0] } };
  const screens = ['welcome', 'name', 'body', ...QUESTIONS.map((q) => q.id), 'health', 'why', 'plan', 'result'];
  let i = 0;

  const draw = () => {
    const s = screens[i];
    const pct = Math.round((i / (screens.length - 1)) * 100);
    let html = '';
    let canNext = true;

    if (s === 'welcome') {
      html = `<div class="welcome-stage" id="welcome-fig"></div>
        <h1 class="center">${isFirst ? 'Willkommen bei Aufwind' : 'Neues Profil'}</h1>
        <p>Aufwind holt dich genau da ab, wo du gerade stehst – egal, ob du gerade erst anfängst oder schon trainierst.</p>
        <div class="card stack">
          <div class="row"><span style="font-size:1.6rem">🌅</span><span><b>Morgens</b> eine kurze Aktivierung</span></div>
          <div class="row"><span style="font-size:1.6rem">🌙</span><span><b>Abends</b> eine kleine Einheit mit Entspannung</span></div>
          <div class="row"><span style="font-size:1.6rem">🥦</span><span><b>Täglich</b> eine kleine Alltags-Gewohnheit</span></div>
        </div>
        <p class="muted small" style="margin-top:16px">Zuerst ein paar Fragen (2–3 Minuten), damit wir das richtige Startlevel finden. Deine Daten bleiben auf deinen Geräten.</p>
        ${isFirst ? '<button type="button" class="btn ghost block" id="join-existing">🔄 Schon auf einem anderen Gerät? Mit Code verbinden</button>' : ''}`;
    } else if (s === 'name') {
      html = `<h1>Wie sollen wir dich nennen?</h1>
        <label class="field"><span>Name</span><input type="text" id="f-name" value="${esc(data.name)}" maxlength="30" autocomplete="given-name"></label>
        <p style="margin-top:16px"><b>Wähle ein Symbol</b></p>
        <div class="emoji-pick">${EMOJIS.map((e) => `<button type="button" data-emoji="${e}" class="${e === data.emoji ? 'selected' : ''}" aria-label="${e}">${e}</button>`).join('')}</div>`;
      canNext = data.name.trim().length > 0;
    } else if (s === 'body') {
      html = `<h1>Ein paar Eckdaten</h1>
        <p class="muted">Freiwillig – sie helfen, den Einstieg gelenkschonend zu wählen. Das Gewicht wird dein erster Eintrag im Fortschritt.</p>
        <div class="stack">
          <label class="field"><span>Alter</span><input type="number" id="f-age" inputmode="numeric" min="10" max="110" value="${esc(data.age)}"></label>
          <label class="field"><span>Größe (cm)</span><input type="number" id="f-height" inputmode="numeric" min="100" max="230" value="${esc(data.heightCm)}"></label>
          <label class="field"><span>Gewicht (kg)</span><input type="number" id="f-weight" inputmode="decimal" step="0.1" min="30" max="350" value="${esc(data.weightKg)}"></label>
        </div>`;
    } else if (s === 'health') {
      html = `<h1>Kurzer Gesundheits-Check</h1>
        <p class="muted">Trifft etwas davon auf dich zu? (Mehrfachauswahl, sonst einfach weiter)</p>
        <div class="options">${HEALTH_FLAGS.map((f) => `<button type="button" class="option ${data.flags.includes(f.id) ? 'selected' : ''}" data-flag="${f.id}">${esc(f.text)}</button>`).join('')}</div>`;
    } else if (s === 'why') {
      html = `<h1>Wofür machst du das?</h1>
        <p class="muted">Ein persönliches „Warum“ trägt dich durch Tage ohne Motivation. Wähle, was passt – oder schreib es in deinen Worten.</p>
        <div class="chips-select">${WHY.map((w) => `<button type="button" data-why="${esc(w)}" class="${data.why.includes(w) ? 'selected' : ''}">${esc(w)}</button>`).join('')}</div>
        <label class="field" style="margin-top:16px"><span>In eigenen Worten (optional)</span>
          <textarea id="f-why" maxlength="160" placeholder="z. B. Ich will im Sommer mit meinen Enkeln Rad fahren.">${esc(data.whyText)}</textarea></label>`;
    } else if (s === 'plan') {
      html = `<h1>Wann passt es in deinen Tag?</h1>
        <p class="muted">Koppel die Challenges an etwas, das du sowieso jeden Tag tust. Solche Wenn-dann-Pläne machen es deutlich wahrscheinlicher, dass du dranbleibst.</p>
        <div class="stack">
          <label class="field"><span>🌅 Meine Morgen-Challenge mache ich …</span><select id="f-pm">${opts(ANCHORS.morning, data.plan.morning)}</select></label>
          <label class="field"><span>🌙 Meine Abend-Challenge mache ich …</span><select id="f-pe">${opts(ANCHORS.evening, data.plan.evening)}</select></label>
        </div>`;
    } else if (s === 'result') {
      const r = assess(answers(data));
      data.result = r;
      const L = LEVELS[r.level - 1];
      html = `<div class="hero-emoji">🎯</div>
        <h1 class="center">Dein Startlevel</h1>
        <div class="card center stack">
          <div><span class="level-badge" style="background:${L.color}">Level ${L.n} · ${esc(L.name)}</span></div>
          <div class="level-scale">${LEVELS.map((l) => `<i style="${l.n <= L.n ? `background:${L.color}` : ''}"></i>`).join('')}</div>
          <p>${esc(L.desc)}</p>
          ${r.bmi ? `<p class="small muted">BMI ${r.bmi} (${esc(r.bmiClass)})</p>` : ''}
        </div>
        ${r.reasons.length ? `<div class="banner small" style="margin-top:16px"><b>Warum dieses Level?</b><ul>${r.reasons.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
        ${r.doctorHint ? `<div class="warn small" style="margin-top:16px"><b>⚕️ Bitte sprich vor dem Start mit deiner Ärztin oder deinem Arzt.</b> Bei deinen Angaben ist es wichtig, die Belastung abzuklären. Die App ersetzt keine medizinische Beratung.</div>` : ''}
        <p class="muted small" style="margin-top:16px">Kein Stress: Nach jeder Challenge sagst du, wie es war, und die App passt sich an. Das Level kannst du jederzeit im Profil ändern.</p>`;
    } else {
      const q = QUESTIONS.find((x) => x.id === s);
      html = `<h1>${esc(q.text)}</h1>
        <div class="options">${q.options.map((o, idx) => `<button type="button" class="option ${data[q.id] === idx ? 'selected' : ''}" data-opt="${idx}">${esc(o)}</button>`).join('')}</div>`;
      canNext = data[q.id] != null;
    }

    const last = s === 'result';
    view.innerHTML = `<div class="progressbar"><i style="width:${pct}%"></i></div>
      <div class="stack">${html}</div>
      <div class="row" style="margin-top:24px">
        ${i > 0 ? '<button class="btn ghost" id="back">Zurück</button>' : !isFirst ? '<a class="btn ghost" href="#/profil">Abbrechen</a>' : ''}
        <button class="btn" id="next" style="flex:1" ${canNext ? '' : 'disabled'}>${last ? "Los geht's" : s === 'welcome' ? 'Starten' : 'Weiter'}</button>
      </div>`;

    const nextBtn = $('#next');
    $('#back')?.addEventListener('click', () => { i--; draw(); });
    nextBtn.addEventListener('click', () => {
      if (last) {
        const r = data.result;
        const why = data.whyText.trim() || data.why.join(', ');
        store.createProfile({ name: data.name.trim(), emoji: data.emoji, answers: answers(data), assessment: r, level: r.level, why, plan: data.plan });
        location.hash = '#/heute';
        route();
        toast(`Willkommen, ${data.name.trim()}! 🎉`);
        confetti();
        return;
      }
      i++;
      draw();
    });

    $('#f-name')?.addEventListener('input', (e) => { data.name = e.target.value; nextBtn.disabled = !data.name.trim(); });
    $('#f-name')?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && data.name.trim()) nextBtn.click(); });
    $$('[data-emoji]').forEach((b) => b.addEventListener('click', () => {
      data.emoji = b.dataset.emoji;
      $$('[data-emoji]').forEach((x) => x.classList.toggle('selected', x === b));
    }));
    [['f-age', 'age'], ['f-height', 'heightCm'], ['f-weight', 'weightKg']].forEach(([id, key]) =>
      $(`#${id}`)?.addEventListener('input', (e) => { data[key] = e.target.value; }));
    $$('[data-opt]').forEach((b) => b.addEventListener('click', () => { data[s] = Number(b.dataset.opt); i++; draw(); }));
    $$('[data-flag]').forEach((b) => b.addEventListener('click', () => {
      const f = b.dataset.flag;
      data.flags = data.flags.includes(f) ? data.flags.filter((x) => x !== f) : [...data.flags, f];
      b.classList.toggle('selected');
    }));
    $$('[data-why]').forEach((b) => b.addEventListener('click', () => {
      const w = b.dataset.why;
      data.why = data.why.includes(w) ? data.why.filter((x) => x !== w) : [...data.why, w];
      b.classList.toggle('selected');
    }));
    $('#f-why')?.addEventListener('input', (e) => { data.whyText = e.target.value; });
    $('#f-pm')?.addEventListener('change', (e) => { data.plan.morning = e.target.value; });
    $('#f-pe')?.addEventListener('change', (e) => { data.plan.evening = e.target.value; });
    $('#join-existing')?.addEventListener('click', () => showJoin());
    const wf = $('#welcome-fig');
    if (wf) mountFigure(wf, 'gehen', { size: 164 });
    view.querySelector('input[type=text], input[type=number]')?.focus();
  };
  draw();
}

function answers(d) {
  const num = (v) => (v === '' || v == null ? undefined : Number(String(v).replace(',', '.')));
  return {
    walk: d.walk ?? 0, chairStand: d.chairStand ?? 0, stairs: d.stairs ?? 0, joints: d.joints ?? 0, activeDays: d.activeDays ?? 0,
    age: num(d.age), heightCm: num(d.heightCm), weightKg: num(d.weightKg), flags: d.flags,
  };
}

// ---------- Heute ----------
function renderToday(p) {
  const today = toKey();
  const hour = new Date().getHours();
  const greet = hour < 11 ? 'Guten Morgen' : hour < 18 ? 'Hallo' : 'Guten Abend';
  const st = streak(p, today);
  const done = (slot) => p.sessions.find((s) => s.date === today && s.slot === slot);
  const anyToday = p.sessions.some((s) => s.date === today);
  const habit = habitOfDay(today, p);
  const habitDone = !!p.habits[today];
  const L = LEVELS[p.level - 1];
  const sugg = levelSuggestion(p);
  const doneSet = new Set(p.sessions.map((s) => s.date));
  const ws = weekStart(today);
  const wStats = weekStats(p, ws);
  const goal = weekGoal(p, ws);
  const review = reviewDue(p, today);

  const days = Array.from({ length: 7 }, (_, k) => addDays(today, k - 6));
  const week = days.map((d) => {
    const cls = [doneSet.has(d) ? 'on' : st.jokers.includes(d) ? 'joker' : '', d === today ? 'today' : ''].join(' ');
    return `<span class="${cls}" title="${formatDate(d)}">${fromKey(d).toLocaleDateString('de-DE', { weekday: 'short' }).slice(0, 2)}</span>`;
  }).join('');

  const card = (slot) => {
    const c = challengeFor(slot, today, p);
    const d = done(slot);
    const part = d?.partial;
    const names = [...new Set(c.steps.map((s) => s.id))].map((id) => `<span class="chip">${byId[id].icon} ${esc(byId[id].name)}</span>`).join('');
    const figId = c.steps.find((x) => hasFigure(x.id) && byId[x.id].cat !== 'entspannung')?.id || c.steps[0].id;
    return `<section class="card hero ${slot} ${d ? 'done' : ''}">
      <div class="hero-grid"><div><div class="eyebrow" style="color:inherit;opacity:.85">${slot === 'morning' ? '🌅 Morgen-Challenge' : '🌙 Abend-Challenge'}</div>
        <h2 style="margin:4px 0 2px">${esc(c.title)}</h2>${p.plan?.[slot] ? `<div class="small" style="opacity:.9">📌 ${esc(p.plan[slot])}</div>` : ''}</div>
        <div class="hero-fig" data-fig="${figId}">${d ? `<span class="done-badge" aria-label="${part ? 'teilweise erledigt' : 'erledigt'}">${part ? '½' : '✓'}</span>` : ''}</div></div>
      <div class="chips">${names}</div>
      <div class="card-foot"><span>${part ? `<b>Teilweise geschafft</b> · ${Math.max(1, Math.round(d.durationSec / 60))} Min` : `<b>⏱ ${c.minutes} Min</b>${c.rounds > 1 ? ` · ${c.rounds} Runden` : ''}`}</span>
      <button class="btn ${d && !part ? 'light sm' : 'light'}" data-start="${slot}">${part ? 'Ganz machen' : d ? 'Nochmal' : "Los geht's"}</button></div>
      ${d && !part ? '' : `<div class="card-links"><button type="button" data-swap="${slot}">🔄 Übungen anpassen</button><button type="button" data-mark="${slot}">✓ Schon erledigt</button></div>`}
    </section>`;
  };

  const parts = [
    { label: 'Morgen', on: !!done('morning'), color: 'var(--accent)' },
    { label: 'Abend', on: !!done('evening'), color: 'var(--sky)' },
    { label: 'Gewohnheit', on: habitDone, color: 'var(--primary)' },
    { label: 'Trinken', on: (p.water[today] || 0) >= p.waterGoal, color: 'var(--water)' },
  ];

  view.innerHTML = `
    <header class="greet"><div><div class="eyebrow">${fromKey(today).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      <h1>${greet}, ${esc(p.name)} 👋</h1></div><a class="avatar" href="#/profil" aria-label="Profil">${p.emoji || '🙂'}</a></header>
    <div class="stack">
      <section class="card today-card">
        <div class="today-top">
          ${dayRing(parts)}
          <div class="today-info">
            <div class="streak-line"><span class="flame" aria-hidden="true">🔥</span><b class="big">${st.count}</b><span>${st.count === 1 ? 'Tag' : 'Tage'} in Folge</span></div>
            <div class="small muted">${st.jokerAvailable ? '🃏 Joker frei – ein Pausentag pro Woche ist okay.' : '🃏 Joker diese Woche genutzt.'}</div>
            <div class="small goal-line">🎯 Wochenziel: <b>${Math.min(wStats.activeDays, goal)} von ${goal}</b> Tagen${wStats.activeDays >= goal ? ` – geschafft! 🎉${wStats.activeDays > goal ? ` (+${wStats.activeDays - goal})` : ''}` : ''}</div>
            <div class="goal-dots" aria-hidden="true">${Array.from({ length: goal }, (_, k) => `<i class="${k < wStats.activeDays ? 'on' : ''}"></i>`).join('')}</div>
          </div>
        </div>
        <div class="ring-legend">${parts.map((x) => `<span class="${x.on ? 'on' : ''}"><i style="background:${x.color}"></i>${x.label}</span>`).join('')}</div>
        <div class="week">${week}</div>
      </section>
      ${review ? `<div class="banner row spread"><span><b>📊 Dein Wochenrückblick ist da</b><br><span class="small muted">Schau, was du letzte Woche geschafft hast.</span></span><button class="btn sm" id="review">Ansehen</button></div>` : ''}
      ${sugg === 'up' ? `<div class="banner"><b>⬆️ Bereit für mehr?</b><p class="small">Die Challenges fallen dir zuletzt leicht. Möchtest du auf Level ${p.level + 1} (${esc(LEVELS[p.level].name)}) wechseln?</p>
        <div class="row"><button class="btn sm" data-level="${p.level + 1}">Ja, Level ${p.level + 1}</button><button class="btn ghost sm" data-dismiss>Noch nicht</button></div></div>` : ''}
      ${sugg === 'down' ? `<div class="warn"><b>Etwas zu viel?</b><p class="small">Kein Problem – ein Schritt zurück ist auch ein Schritt. Auf Level ${p.level - 1} wechseln?</p>
        <div class="row"><button class="btn sm" data-level="${p.level - 1}">Ja, Level ${p.level - 1}</button><button class="btn ghost sm" data-dismiss>Nein, weiter so</button></div></div>` : ''}
      ${p.why && !anyToday ? `<section class="why-card"><span class="tile-ico green">💚</span><div><div class="eyebrow">Dein Warum</div><b>${esc(p.why)}</b></div></section>` : ''}
      ${card('morning')}
      ${card('evening')}
      ${programCard(p, today)}
      <section class="card">
        <div class="card-head"><span class="tile-ico green">${habit.icon}</span><div class="eyebrow">Gewohnheit des Tages</div></div>
        <label class="check"><input type="checkbox" id="habit" ${habitDone ? 'checked' : ''}>
          <span><b>${esc(habit.text)}</b><br><span class="small muted">${esc(habit.tip)}</span></span></label>
      </section>
      ${waterCard(p, today)}
      ${familyCard(p)}
      <button class="btn soft block" id="extra">➕ Andere Bewegung eintragen</button>
      <section class="card"><div class="card-head"><span class="tile-ico orange">💡</span><div class="eyebrow">Wusstest du?</div></div><p style="margin:0">${esc(tipOfDay(today))}</p></section>
      <p class="center small muted">Level ${p.level} · ${esc(L.name)} · Intensität ${Math.round(p.intensity * 100)} %</p>
    </div>`;

  $$('[data-fig]').forEach((el) => renderStatic(el, el.dataset.fig, 1, 84));
  $$('[data-start]').forEach((b) => b.addEventListener('click', () => startChallenge(p, b.dataset.start)));
  $$('[data-swap]').forEach((b) => b.addEventListener('click', () => showSwap(p, b.dataset.swap)));
  $$('[data-mark]').forEach((b) => b.addEventListener('click', () => markDone(p, b.dataset.mark)));
  $('#habit').addEventListener('change', (e) => {
    if (e.target.checked) { p.habits[today] = habit.id; haptic(); toast('Gut gemacht! 🌱'); } else delete p.habits[today];
    finishUpdate(p);
    renderToday(p);
  });
  $$('[data-water]').forEach((b) => b.addEventListener('click', () => {
    const n = Math.max(0, (p.water[today] || 0) + Number(b.dataset.water));
    p.water[today] = n;
    haptic(8);
    if (n === p.waterGoal && Number(b.dataset.water) > 0) { toast('💧 Trinkziel erreicht!'); confetti({ count: 50 }); }
    finishUpdate(p);
    renderToday(p);
  }));
  $$('[data-level]').forEach((b) => b.addEventListener('click', () => {
    store.setLevel(p, Number(b.dataset.level));
    finishUpdate(p);
    toast(`Jetzt Level ${p.level}: ${LEVELS[p.level - 1].name}`);
    renderToday(p);
  }));
  $$('[data-dismiss]').forEach((b) => b.addEventListener('click', () => {
    p.levelSince = today; // Zähler neu starten, damit die Frage nicht sofort wiederkommt
    p.intensity = Math.min(p.intensity, 1.2);
    store.save();
    renderToday(p);
  }));
  $('#review')?.addEventListener('click', () => showReview(p, review));
  $('#prog-start')?.addEventListener('click', () => startProgramSession(p));
  $('#extra').addEventListener('click', () => extraActivity(p));
}

/** Tagesring: vier Segmente (Morgen, Abend, Gewohnheit, Trinken). */
function dayRing(parts) {
  const r = 46, c = 2 * Math.PI * r, gap = 10, seg = c / parts.length - gap;
  const done = parts.filter((x) => x.on).length;
  const arcs = parts.map((x, i) => {
    const off = -(i * (c / parts.length));
    return `<circle class="seg-bg" cx="56" cy="56" r="${r}" stroke-dasharray="${seg} ${c - seg}" stroke-dashoffset="${off}"/>
      ${x.on ? `<circle class="seg-on" cx="56" cy="56" r="${r}" stroke="${x.color}" stroke-dasharray="${seg} ${c - seg}" stroke-dashoffset="${off}"/>` : ''}`;
  }).join('');
  return `<div class="day-ring" role="img" aria-label="Heute ${done} von ${parts.length} erledigt: ${parts.map((x) => `${x.label} ${x.on ? 'erledigt' : 'offen'}`).join(', ')}">
    <svg viewBox="0 0 112 112">${arcs}</svg><div class="center"><b>${done}/${parts.length}</b><span class="small muted">heute</span></div></div>`;
}

function programCard(p, today) {
  const st = programState(p.program);
  if (!st) {
    return `<a class="card row" href="#/uebungen" style="text-decoration:none;color:inherit"><span class="tile-ico violet">🎓</span>
      <span style="flex:1"><b>Programme entdecken</b><br><span class="small muted">Mit einem 6–8-Wochen-Plan ein klares Ziel erreichen – z. B. 30 Minuten am Stück gehen.</span></span><span aria-hidden="true">›</span></a>`;
  }
  const doneToday = p.sessions.some((s) => s.date === today && s.slot === 'program');
  const next = programSession(p.program);
  return `<section class="card prog-card">
    <div class="card-head"><span class="tile-ico green">${st.prog.icon}</span><div><div class="eyebrow">Programm · ${esc(st.prog.goal)}</div><h3>${esc(st.prog.name)}</h3>
      <div class="small muted">Woche ${st.week} von ${st.prog.weeks} · Einheit ${st.session} von 3</div></div></div>
    <div class="bar" style="margin:10px 0"><i style="width:${st.pct}%"></i></div>
    ${doneToday
      ? '<p class="small muted" style="margin:0">✅ Heute erledigt. Gönn dir bis zur nächsten Einheit einen Tag Pause – Erholung gehört zum Plan.</p>'
      : `<div class="row spread"><span>⏱ ca. ${next.minutes} Min</span><button class="btn" id="prog-start">Einheit starten</button></div>`}
  </section>`;
}

function waterCard(p, today) {
  const n = p.water[today] || 0;
  const goal = p.waterGoal;
  return `<section class="card">
    <div class="row spread"><div class="row"><span class="tile-ico blue">💧</span><div><div class="eyebrow">Trinken</div><b>${n} von ${goal} Gläsern</b></div></div>
      <div class="row" style="gap:8px"><button class="icon-btn" data-water="-1" aria-label="Ein Glas weniger">−</button>
      <button class="icon-btn primary" data-water="1" aria-label="Ein Glas mehr">+</button></div></div>
    <div class="glasses" aria-hidden="true">${Array.from({ length: Math.max(goal, n) }, (_, i) => `<span class="${i < n ? 'full' : 'off'}"></span>`).join('')}</div>
  </section>`;
}

function familyCard() {
  const s = store.getState();
  if (s.profiles.length < 2) return '';
  const goal = s.settings.familyGoal || defaultFamilyGoal(s.profiles.length);
  const f = familyProgress(s.profiles, goal);
  const max = Math.max(1, ...f.members.map((m) => m.minutes));
  return `<section class="card">
    <div class="row"><span class="tile-ico orange">👨‍👩‍👧</span><div><div class="eyebrow">Familien-Challenge</div><b>${f.total} von ${f.goal} Min</b></div></div>
    <div class="bar" style="margin:8px 0"><i style="width:${f.pct}%"></i></div>
    ${f.members.map((m) => `<div class="member"><span>${m.emoji}</span><div><div class="small">${esc(m.name)}</div>
      <div class="bar" style="height:8px"><i style="width:${(m.minutes / max) * 100}%;opacity:.7"></i></div></div><span class="small">${m.minutes} Min</span></div>`).join('')}
    <p class="small muted" style="margin:8px 0 0">${f.pct >= 100 ? '🎉 Geschafft – gemeinsam stark!' : 'Gemeinsames Ziel bis Sonntag. Jede Minute von jedem zählt.'}</p>
  </section>`;
}

/** Sekunden je Kategorie einer Einheit, skaliert auf die tatsächliche Dauer. */
function catSeconds(c, durationSec) {
  const cats = {};
  let planned = 0;
  for (const s of c.steps) {
    const sec = exerciseSeconds(s);
    cats[byId[s.id].cat] = (cats[byId[s.id].cat] || 0) + sec;
    planned += sec;
  }
  const f = planned ? Math.min(1.5, durationSec / planned) : 1;
  for (const k of Object.keys(cats)) cats[k] = Math.round(cats[k] * f);
  return cats;
}

function feedbackToast(fb) {
  toast(fb === 'schwer' ? 'Danke! Beim nächsten Mal wird es etwas sanfter. 💚' : fb === 'leicht' ? 'Notiert – nächstes Mal legen wir etwas drauf! 💪' : 'Super! Weiter so. ✨');
}

function startChallenge(p, slot) {
  const today = toKey();
  const c = challengeFor(slot, today, p);
  runPlayer(c, store.getState().settings, (res) => {
    if (!res) return;
    if (res.partial) {
      const { added } = addSession(p, { date: today, slot, partial: true, feedback: 'passt', durationSec: res.durationSec, title: c.title, cats: catSeconds(c, res.durationSec) });
      finishUpdate(p);
      renderToday(p);
      toast(added ? `Gespeichert: ${res.doneSteps} von ${c.steps.length} Übungen 💚` : 'Schon eingetragen – stark, dass du nochmal dran warst! 💚');
      return;
    }
    addSession(p, { date: today, slot, feedback: res.feedback, durationSec: res.durationSec, title: c.title, cats: catSeconds(c, res.durationSec) });
    p.intensity = adjustIntensity(p.intensity, res.feedback);
    finishUpdate(p);
    renderToday(p);
    feedbackToast(res.feedback);
  }, { allowPartial: true });
}

/** Challenge ohne geführten Modus als erledigt eintragen (z. B. ohne Handy gemacht). */
function markDone(p, slot) {
  const today = toKey();
  const c = challengeFor(slot, today, p);
  const sheet = openSheet(`<div class="row spread"><h2 style="margin:0">✓ Schon erledigt?</h2><button class="icon-btn" data-close aria-label="Schließen">✕</button></div>
    <p class="muted">Super! Wir tragen „${esc(c.title)}“ mit ca. ${c.minutes} Min ein. Wie war's?</p>
    <div class="feedback">
      <button class="btn soft" data-fb="leicht">😌 Zu leicht – gerne mehr</button>
      <button class="btn" data-fb="passt">👍 Genau richtig</button>
      <button class="btn soft" data-fb="schwer">😮‍💨 Zu anstrengend</button>
    </div>`);
  $$('[data-fb]', sheet).forEach((b) => b.addEventListener('click', () => {
    const fb = b.dataset.fb;
    addSession(p, { date: today, slot, manual: true, feedback: fb, durationSec: c.durationSec, title: c.title, cats: catSeconds(c, c.durationSec) });
    p.intensity = adjustIntensity(p.intensity, fb);
    closeSheet();
    finishUpdate(p);
    renderToday(p);
    haptic();
    feedbackToast(fb);
  }));
}

/** Übungen der heutigen Challenge einzeln tauschen (gilt nur für heute). */
function showSwap(p, slot) {
  const today = toKey();
  const draw = (focusId) => {
    const c = challengeFor(slot, today, p);
    const ids = [...new Set(c.steps.map((s) => s.id))];
    const swapped = Object.keys(p.swaps?.[`${today}|${slot}`] || {}).length > 0;
    const sheet = openSheet(`<div class="row spread"><h2 style="margin:0">🔄 Übungen anpassen</h2><button class="icon-btn" data-close aria-label="Schließen">✕</button></div>
      <p class="muted small">Passt heute etwas nicht – weil ein Gelenk zwickt oder kein Stuhl da ist? Tausch die Übung gegen eine aus dem gleichen Bereich. Gilt nur für heute.</p>
      <ul class="log-list">${ids.map((id) => {
        const ex = byId[id];
        const amount = c.steps.find((s) => s.id === id).amount;
        return `<li><span><b>${ex.icon} ${esc(ex.name)}</b><br><span class="small muted">${CATEGORIES[ex.cat].label} · ${esc(fmtAmount(ex, amount))}</span></span>
          ${canSwap(slot, today, p, id) ? `<button class="btn soft sm" data-sw="${id}" aria-label="${esc(ex.name)} tauschen">🔄 Tauschen</button>` : '<span class="small muted">keine Alternative</span>'}</li>`;
      }).join('')}</ul>
      <div class="row" style="margin-top:16px">${swapped ? '<button class="btn ghost" id="sw-reset">Zurücksetzen</button>' : ''}<button class="btn" data-close style="flex:1">Fertig</button></div>`);
    $$('[data-sw]', sheet).forEach((b) => b.addEventListener('click', () => {
      const to = swapExercise(p, slot, today, b.dataset.sw);
      store.save();
      draw(to);
    }));
    $('#sw-reset', sheet)?.addEventListener('click', () => {
      delete p.swaps[`${today}|${slot}`];
      store.save();
      draw();
    });
    if (focusId) $(`[data-sw="${focusId}"]`, sheet)?.focus();
  };
  draw();
  // Heute-Ansicht nach dem Schließen aktualisieren
  const ov = $('#overlay');
  const obs = new MutationObserver(() => {
    if (!ov.hidden) return;
    obs.disconnect();
    if (currentRoute === 'heute') renderToday(p);
  });
  obs.observe(ov, { attributes: true, attributeFilter: ['hidden'] });
}

function startProgramSession(p) {
  const c = programSession(p.program);
  if (!c) return;
  runPlayer(c, store.getState().settings, (res) => {
    if (!res) return;
    const today = toKey();
    if (res.partial) {
      // Teil-Einheit zählt als Bewegung, schaltet das Programm aber nicht weiter
      addSession(p, { date: today, slot: 'extra', partial: true, feedback: 'passt', durationSec: res.durationSec, title: `${c.title} (Teil)`, cats: catSeconds(c, res.durationSec) });
      finishUpdate(p);
      renderToday(p);
      toast('Gespeichert – die Programm-Einheit wartet weiter auf dich 💚', 3500);
      return;
    }
    addSession(p, { date: today, slot: 'program', feedback: res.feedback, durationSec: res.durationSec, title: c.title, cats: catSeconds(c, res.durationSec) });
    p.program.done.push(today);
    const st = programState(p.program);
    if (st.finished) {
      p.programsDone.push({ id: p.program.id, date: today });
      p.program = null;
      setTimeout(() => { toast(`🎓 Programm „${st.prog.name}“ abgeschlossen – großartig!`, 4000); confetti({ count: 160, duration: 2600 }); }, 600);
    }
    finishUpdate(p);
    renderToday(p);
    if (!st.finished) feedbackToast(res.feedback);
  }, { allowPartial: true });
}

const EXTRA_KINDS = [['🚶 Spaziergang', 'ausdauer'], ['🚴 Radfahren', 'ausdauer'], ['🏊 Schwimmen / Aqua', 'ausdauer'], ['💃 Tanzen', 'ausdauer'], ['🧘 Yoga', 'mobil'],
  ['🌳 Gartenarbeit', 'ausdauer'], ['🏋️ Fitnessstudio', 'kraft'], ['⚽ Sport', 'ausdauer'], ['🧹 Hausarbeit (aktiv)', 'ausdauer']];
const QUICK_MIN = [10, 20, 30, 45, 60];

/** Datum-Chips: heute, gestern, vorgestern. */
function dayChips(selected) {
  const today = toKey();
  return [0, -1, -2].map((n) => {
    const d = addDays(today, n);
    const label = n === 0 ? 'Heute' : n === -1 ? 'Gestern' : fromKey(d).toLocaleDateString('de-DE', { weekday: 'long' });
    return `<button type="button" data-day="${d}" class="${d === selected ? 'selected' : ''}" aria-pressed="${d === selected}">${label}</button>`;
  }).join('');
}

function extraActivity(p) {
  const last = p.lastExtra || {};
  const kindIdx = Math.max(0, EXTRA_KINDS.findIndex(([k]) => k === last.title));
  let date = toKey();
  const sheet = openSheet(`<h2>Andere Bewegung</h2><p class="muted small">Alles zählt! Das hält auch deine Serie am Leben.</p>
    <div class="stack"><label class="field"><span>Was hast du gemacht?</span><select id="x-kind">${EXTRA_KINDS.map(([k], i) => `<option value="${i}" ${i === kindIdx ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
    <div class="field"><span>Wann?</span><div class="chips-select" role="group" aria-label="Tag">${dayChips(date)}</div></div>
    <div class="field"><span>Wie viele Minuten?</span>
      <div class="chips-select" role="group" aria-label="Schnellauswahl Minuten">${QUICK_MIN.map((m) => `<button type="button" data-min="${m}">${m}</button>`).join('')}</div>
      <input type="number" id="x-min" inputmode="numeric" min="1" max="600" value="${last.min || 15}" aria-label="Minuten" style="margin-top:8px"></div>
    <div class="row"><button class="btn ghost" data-close>Abbrechen</button><button class="btn" id="x-save" style="flex:1">Speichern</button></div></div>`);
  const markMin = () => $$('[data-min]', sheet).forEach((b) => b.classList.toggle('selected', b.dataset.min === $('#x-min', sheet).value));
  markMin();
  $$('[data-min]', sheet).forEach((b) => b.addEventListener('click', () => { $('#x-min', sheet).value = b.dataset.min; markMin(); }));
  $('#x-min', sheet).addEventListener('input', markMin);
  $$('[data-day]', sheet).forEach((b) => b.addEventListener('click', () => {
    date = b.dataset.day;
    $$('[data-day]', sheet).forEach((x) => { x.classList.toggle('selected', x === b); x.setAttribute('aria-pressed', String(x === b)); });
  }));
  $('#x-save', sheet).addEventListener('click', () => {
    const min = Number($('#x-min', sheet).value);
    if (!(min > 0)) return;
    const [title, cat] = EXTRA_KINDS[Number($('#x-kind', sheet).value)];
    addSession(p, { date, slot: 'extra', title, durationSec: min * 60, feedback: 'passt', cats: { [cat]: min * 60 } });
    p.lastExtra = { title, min };
    closeSheet();
    finishUpdate(p);
    renderToday(p);
    toast(date === toKey() ? 'Eingetragen – stark! 💪' : `Nachgetragen für ${formatDate(date, { weekday: 'long' })} ✓`);
  });
}

function finishUpdate(p) {
  const ws = weekStart();
  if (!p.weekReached[ws] && weekStats(p, ws).reached) {
    p.weekReached[ws] = true;
    p.weeksReached++;
    setTimeout(() => { toast('🎯 Wochenziel erreicht – stark!', 3500); confetti({ count: 120 }); }, 900);
  }
  const fresh = awardBadges(p);
  store.save();
  fresh.forEach((b, k) => setTimeout(() => toast(`${b.icon} Abzeichen: ${b.name}!`, 3500), 2400 + k * 3600));
}

function showReview(p, start) {
  const s = weekStats(p, start);
  let next = suggestGoal(s);
  const tile = (v, l) => `<div class="stat"><b>${v}</b><span class="small muted">${l}</span></div>`;
  const sheet = openSheet(`<div class="row spread"><h2 style="margin:0">📊 Dein Wochenrückblick</h2><button class="icon-btn" data-close aria-label="Schließen">✕</button></div>
    <p class="muted small">${formatDate(s.start, { day: 'numeric', month: 'long' })} – ${formatDate(s.end, { day: 'numeric', month: 'long' })}</p>
    <p><b>${esc(reviewMessage(s))}</b></p>
    <div class="stats">${tile(s.activeDays, `aktive Tage (Ziel ${s.goal})`)}${tile(s.minutes, 'Minuten')}${tile(s.sessions, 'Einheiten')}
      ${tile(s.habits, 'Gewohnheiten')}${tile(s.waterDays, 'Tage Trinkziel')}${tile(s.weightDelta == null ? '–' : `${s.weightDelta > 0 ? '+' : ''}${s.weightDelta}`, 'kg Gewicht')}</div>
    ${s.bestDay ? `<p class="small muted" style="margin-top:12px">Dein stärkster Tag: ${formatDate(s.bestDay, { weekday: 'long' })}.</p>` : ''}
    ${p.why ? `<div class="banner small" style="margin-top:12px">💚 Dein Warum: <b>${esc(p.why)}</b></div>` : ''}
    <h3 style="margin-top:16px">Ziel für diese Woche</h3>
    <div class="row" style="justify-content:center;gap:24px"><button class="icon-btn" id="g-minus" aria-label="Weniger Tage">−</button>
      <div class="center"><b id="g-val" style="font-size:2rem">${next}</b><br><span class="small muted">aktive Tage</span></div>
      <button class="icon-btn" id="g-plus" aria-label="Mehr Tage">+</button></div>
    <p class="small muted center">Lieber ein Ziel, das du sicher schaffst, als eins, das frustriert.</p>
    <button class="btn block" id="g-save">Ziel übernehmen</button>`);
  const upd = (d) => { next = Math.max(1, Math.min(7, next + d)); $('#g-val', sheet).textContent = next; };
  $('#g-minus', sheet).addEventListener('click', () => upd(-1));
  $('#g-plus', sheet).addEventListener('click', () => upd(1));
  $('#g-save', sheet).addEventListener('click', () => {
    p.weekGoals[weekStart()] = next;
    p.weekGoalDefault = next;
    if (!p.lastReview || p.lastReview < start) p.lastReview = start;
    store.save();
    closeSheet();
    toast(`Neues Wochenziel: ${next} Tage 🎯`);
    route();
  });
}

// ---------- Übungen & Programme ----------
let libFilter = { cat: '', mine: true };
function renderLibrary(p) {
  const list = EXERCISES.filter((e) => !e.programOnly && (!libFilter.cat || e.cat === libFilter.cat) && (!libFilter.mine || e.base[p.level - 1] != null));
  view.innerHTML = `<h1>Programme</h1>
    <p class="small muted">Mehrwochen-Pläne mit 3 Einheiten pro Woche und einem klaren Ziel.</p>
    <div class="ex-list">${PROGRAMS.map((pr) => {
      const active = p.program?.id === pr.id;
      const done = p.programsDone.some((x) => x.id === pr.id);
      return `<button class="ex-item" data-prog="${pr.id}"><span class="ico">${pr.icon}</span>
        <span style="flex:1"><b>${esc(pr.name)}</b><br><span class="small muted">${pr.weeks} Wochen · Ziel: ${esc(pr.goal)}</span></span>
        <span class="small">${active ? '▶ läuft' : done ? '🎓' : pr.levels.includes(p.level) ? '✓ passt' : ''}</span></button>`;
    }).join('')}</div>
    <h1 style="margin-top:28px">Übungen</h1>
    <div class="filters" role="toolbar" aria-label="Filter">
      <button data-mine class="${libFilter.mine ? 'on' : ''}" aria-pressed="${libFilter.mine}">Mein Level</button>
      <button data-cat="" class="${!libFilter.cat ? 'on' : ''}">Alle Bereiche</button>
      ${Object.entries(CATEGORIES).map(([k, c]) => `<button data-cat="${k}" class="${libFilter.cat === k ? 'on' : ''}">${c.icon} ${c.label}</button>`).join('')}
    </div>
    <p class="small muted">${list.length} Übungen${libFilter.mine ? ` für Level ${p.level}` : ''}</p>
    <div class="ex-list">${list.map((e) => `<button class="ex-item" data-ex="${e.id}"><span class="ico">${e.icon}</span>
      <span style="flex:1"><b>${esc(e.name)}</b><br><span class="small muted">${CATEGORIES[e.cat].label} · ${POSITIONS[e.pos]}</span></span>
      <span class="small muted">${e.base[p.level - 1] != null ? esc(fmtAmount(e, e.base[p.level - 1])) : `ab L${e.base.findIndex((v) => v != null) + 1}`}</span></button>`).join('')}</div>`;

  $('[data-mine]').addEventListener('click', () => { libFilter.mine = !libFilter.mine; renderLibrary(p); });
  $$('[data-cat]').forEach((b) => b.addEventListener('click', () => { libFilter.cat = b.dataset.cat; renderLibrary(p); }));
  $$('[data-ex]').forEach((b) => b.addEventListener('click', () => showExercise(p, b.dataset.ex)));
  $$('[data-prog]').forEach((b) => b.addEventListener('click', () => showProgram(p, b.dataset.prog)));
}

function stepLabel(s) {
  const ex = byId[s.id];
  if (s.id === 'gehen') return `🚶 ${s.amount / 60} Min gehen`;
  if (s.id === 'langsamgehen') return `🐢 ${s.amount / 60} Min locker`;
  return `${ex.icon} ${ex.name} ${fmtAmount(ex, s.amount)}`;
}

function showProgram(p, id) {
  const pr = programById[id];
  const active = p.program?.id === id;
  const st = active ? programState(p.program) : null;
  const sheet = openSheet(`<div class="row spread"><span style="font-size:3rem">${pr.icon}</span><button class="icon-btn" data-close aria-label="Schließen">✕</button></div>
    <h2>${esc(pr.name)}</h2>
    <p>${esc(pr.desc)}</p>
    <div class="banner small"><b>🎯 Ziel:</b> ${esc(pr.goal)} · ${pr.weeks} Wochen · 3 Einheiten pro Woche<br>
      Empfohlen für Level ${pr.levels.join(', ')}${pr.levels.includes(p.level) ? ' – passt zu dir.' : ` – du bist auf Level ${p.level}.`}</div>
    ${st ? `<p style="margin-top:12px"><b>Dein Stand:</b> Woche ${st.week}, Einheit ${st.session} · ${st.pct} %</p>` : ''}
    <h3 style="margin-top:16px">Ablauf</h3>
    ${pr.plan.map((w, i) => `<details ${st && st.week === i + 1 ? 'open' : ''} style="margin-bottom:8px"><summary>Woche ${i + 1}${st && st.week > i + 1 ? ' ✓' : ''}</summary>
      <div class="chips">${w.map((s) => `<span class="chip">${esc(stepLabel(s))}</span>`).join('')}</div></details>`).join('')}
    <div class="stack" style="margin-top:16px">
      ${active ? '<button class="btn danger block" id="pr-stop">Programm beenden</button>' : '<button class="btn block" id="pr-go">Programm starten</button>'}
    </div>`);
  $('#pr-go', sheet)?.addEventListener('click', () => {
    if (p.program && !confirm(`Du hast schon „${programById[p.program.id].name}“ laufen. Wechseln? Der bisherige Fortschritt geht verloren.`)) return;
    p.program = { id, startedAt: toKey(), done: [] };
    store.save();
    closeSheet();
    toast(`${pr.icon} Programm gestartet – die erste Einheit wartet unter „Heute“.`);
    location.hash = '#/heute';
  });
  $('#pr-stop', sheet)?.addEventListener('click', () => {
    if (!confirm('Programm wirklich beenden? Der Fortschritt im Programm geht verloren (deine Einheiten bleiben gezählt).')) return;
    p.program = null;
    store.save();
    closeSheet();
    renderLibrary(p);
  });
}

function showExercise(p, id) {
  const e = byId[id];
  const levels = e.base.map((v, k) => (v != null ? `<span class="chip">L${k + 1}: ${esc(fmtAmount(e, v))}</span>` : '')).join('');
  const sheet = openSheet(`<div class="row spread"><span style="font-size:2rem">${e.icon}</span><button class="icon-btn" data-close aria-label="Schließen">✕</button></div>
    ${hasFigure(id) ? '<div class="fig-stage" id="ex-fig" style="margin-bottom:12px"></div>' : ''}
    <h2>${esc(e.name)}</h2>
    <p class="muted small">${CATEGORIES[e.cat].icon} ${CATEGORIES[e.cat].label} · ${POSITIONS[e.pos]}${e.perSide ? ' · je Seite' : ''}</p>
    <h3>So geht's</h3><ol class="steps">${e.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    <div class="banner small"><b>💡 Tipp:</b> ${esc(e.tip)}</div>
    <div class="grid2" style="margin-top:12px">
      <div class="card small"><b>⬇️ Leichter</b><br>${esc(e.easier)}</div>
      <div class="card small"><b>⬆️ Schwerer</b><br>${esc(e.harder)}</div>
    </div>
    <h3 style="margin-top:16px">Menge je Level</h3><div class="chips">${levels}</div>
    <button class="btn block" id="try">▶ Jetzt ausprobieren</button>`);
  const stage = $('#ex-fig', sheet);
  if (stage) mountFigure(stage, id, { size: 220 });
  $('#try').addEventListener('click', () => {
    closeSheet();
    const amount = e.base[p.level - 1] ?? e.base.find((v) => v != null);
    runPlayer({ title: e.name, icon: e.icon, steps: [{ id, amount, round: 1 }], rest: 0, rounds: 1, minutes: 1 }, store.getState().settings, () => {});
  });
}

// ---------- Fortschritt: Überblick (Dashboard), Messwerte, Abzeichen ----------
const LOG_KINDS = {
  weight: { label: 'Gewicht', unit: 'kg', icon: '⚖️', step: '0.1' },
  waist: { label: 'Bauchumfang', unit: 'cm', icon: '📏', step: '0.5' },
  hip: { label: 'Hüftumfang', unit: 'cm', icon: '📐', step: '0.5' },
  steps: { label: 'Schritte', unit: 'Schritte', icon: '👣', step: '1' },
};
let logKind = 'weight';
let progTab = 'overview';
let showAllSessions = false;
let logsOpen = false;
const FEEDBACK_ICON = { leicht: '😌', passt: '👍', schwer: '😮‍💨' };

/** Einheit ändern (Minuten, Gefühl, bei freier Bewegung auch den Tag) oder löschen – mit Rückgängig. */
function editSession(p, id) {
  const s = p.sessions.find((x) => x.id === id);
  if (!s) return;
  const free = s.slot === 'extra'; // Morgen/Abend/Programm hängen am Tag
  let date = s.date;
  let fb = s.feedback || 'passt';
  const sheet = openSheet(`<div class="row spread"><h2 style="margin:0">Einheit bearbeiten</h2><button class="icon-btn" data-close aria-label="Schließen">✕</button></div>
    <p class="muted small">${esc(s.title || SLOT_NAMES[s.slot])} · ${formatDate(s.date, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
    <div class="stack">
      <label class="field"><span>Minuten</span><input type="number" id="e-min" inputmode="numeric" min="1" max="600" value="${Math.max(1, Math.round((s.durationSec || 0) / 60))}"></label>
      ${free && date >= addDays(toKey(), -2) ? `<div class="field"><span>Tag</span><div class="chips-select" role="group" aria-label="Tag">${dayChips(date)}</div></div>` : ''}
      <div class="field"><span>Wie war's?</span><div class="chips-select" role="group" aria-label="Gefühl">${Object.entries({ leicht: '😌 leicht', passt: '👍 passt', schwer: '😮‍💨 schwer' })
        .map(([k, l]) => `<button type="button" data-efb="${k}" class="${k === fb ? 'selected' : ''}" aria-pressed="${k === fb}">${l}</button>`).join('')}</div></div>
      <div class="row"><button class="btn danger" id="e-del">Löschen</button><button class="btn" id="e-save" style="flex:1">Speichern</button></div>
    </div>`);
  const pick = (attr, set) => $$(`[${attr}]`, sheet).forEach((b) => b.addEventListener('click', () => {
    set(b);
    $$(`[${attr}]`, sheet).forEach((x) => { x.classList.toggle('selected', x === b); x.setAttribute('aria-pressed', String(x === b)); });
  }));
  pick('data-day', (b) => { date = b.dataset.day; });
  pick('data-efb', (b) => { fb = b.dataset.efb; });
  $('#e-save', sheet).addEventListener('click', () => {
    const min = Number($('#e-min', sheet).value);
    if (!(min > 0)) return;
    const sec = min * 60;
    const f = s.durationSec ? sec / s.durationSec : 1;
    const cats = Object.fromEntries(Object.entries(s.cats || {}).map(([k, v]) => [k, Math.round(v * f)]));
    updateSession(p, id, { durationSec: sec, feedback: fb, date, cats });
    closeSheet();
    finishUpdate(p);
    renderProgress(p);
    toast('Gespeichert ✓');
  });
  $('#e-del', sheet).addEventListener('click', () => {
    const removed = removeSession(p, id);
    closeSheet();
    store.save();
    renderProgress(p);
    undoToast('Einheit gelöscht', () => {
      restoreSession(p, removed);
      store.save();
      if (currentRoute === 'fortschritt') renderProgress(p);
      toast('Wiederhergestellt ✓');
    });
  });
}

function renderProgress(p) {
  const tabs = [['overview', 'Überblick'], ['werte', 'Messwerte'], ['abzeichen', 'Abzeichen']];
  const earned = Object.keys(p.badges || {}).length;
  let body = '';
  if (progTab === 'overview') {
    body = `${renderDashboard(p)}
      <button class="btn soft block" id="last-review" style="margin-top:16px">📊 Rückblick auf letzte Woche</button>
      <section class="card" style="margin-top:16px"><h3>${showAllSessions ? 'Alle Einheiten' : 'Letzte Einheiten'}</h3>${p.sessions.length ? `<p class="small muted" style="margin:0 0 4px">Tippe auf eine Einheit, um sie zu ändern oder zu löschen.</p>
        <ul class="log-list sess-list">${(showAllSessions ? p.sessions : p.sessions.slice(-12)).slice().reverse().map((s) => `<li><button type="button" data-sess="${s.id}">
          <span>${formatDate(s.date)} · ${esc(s.title || SLOT_NAMES[s.slot] || s.slot)}${s.partial ? ' <span class="small muted">(Teil)</span>' : ''}</span>
          <span class="small muted">${Math.round((s.durationSec || 0) / 60)} Min ${FEEDBACK_ICON[s.feedback] || '👍'} <span aria-hidden="true">›</span></span></button></li>`).join('')}</ul>
        ${p.sessions.length > 12 ? `<button class="btn ghost sm block" id="sess-all" style="margin-top:8px">${showAllSessions ? 'Weniger anzeigen' : `Alle ${p.sessions.length} anzeigen`}</button>` : ''}` : '<p class="muted">Noch keine Einheiten – deine erste Challenge wartet unter „Heute“.</p>'}</section>`;
  } else if (progTab === 'werte') {
    body = measurementsHTML(p);
  } else {
    body = `<p class="muted">${earned} von ${BADGES.length} Abzeichen verdient.</p><div class="badges">${BADGES.map((b) => {
      const got = p.badges?.[b.id];
      return `<div class="badge ${got ? '' : 'locked'}" title="${esc(b.desc)}"><span class="ico">${b.icon}</span><b>${esc(b.name)}</b><br><span class="muted">${got ? formatDate(got) : esc(b.desc)}</span></div>`;
    }).join('')}</div>`;
  }
  view.innerHTML = `<h1>Fortschritt</h1>
    <div class="seg-ctl" role="tablist">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${k === progTab}" class="${k === progTab ? 'on' : ''}" data-ptab="${k}">${l}</button>`).join('')}</div>
    ${body}`;
  $$('[data-ptab]').forEach((b) => b.addEventListener('click', () => { progTab = b.dataset.ptab; renderProgress(p); }));
  if (progTab === 'overview') {
    bindTips(view);
    $('#last-review').addEventListener('click', () => showReview(p, addDays(weekStart(), -7)));
    $$('[data-sess]').forEach((b) => b.addEventListener('click', () => editSession(p, b.dataset.sess)));
    $('#sess-all')?.addEventListener('click', () => { showAllSessions = !showAllSessions; renderProgress(p); });
  }
  if (progTab === 'werte') { bindMeasurements(p); bindTips(view); }
}

function measurementsHTML(p) {
  const k = LOG_KINDS[logKind];
  const entries = p.logs[logKind] || [];
  const first = entries[0]?.value, last = entries.at(-1)?.value;
  const delta = entries.length > 1 ? Math.round((last - first) * 10) / 10 : null;
  const h = p.answers?.heightCm;
  const curBmi = logKind === 'weight' && h && last ? bmi(h, last) : null;
  return `<section class="card">
    <div class="filters">${Object.entries(LOG_KINDS).map(([key, v]) => `<button data-kind="${key}" class="${key === logKind ? 'on' : ''}">${v.icon} ${v.label}</button>`).join('')}</div>
    ${delta != null ? `<p><b>${delta > 0 ? '+' : ''}${delta} ${k.unit}</b> <span class="muted small">seit ${formatDate(entries[0].date)}</span>${curBmi ? ` · <span class="small">BMI ${curBmi} (${esc(bmiClass(curBmi))})</span>` : ''}</p>` : ''}
    ${lineChart(entries, { unit: k.unit })}
    <form id="log-form" class="row" style="margin-top:12px">
      <input type="number" id="log-val" inputmode="decimal" step="${k.step}" min="0" placeholder="${k.label} (${k.unit})" required aria-label="${k.label}" style="flex:1;min-width:0">
      <input type="date" id="log-date" value="${toKey()}" max="${toKey()}" aria-label="Datum" style="max-width:150px">
      <button class="btn" type="submit" aria-label="Speichern">+</button>
    </form>
    ${logKind === 'weight' ? '<p class="small muted" style="margin:8px 0 0">Tipp: Immer zur gleichen Zeit wiegen, z. B. morgens nach dem Aufstehen. Tagesschwankungen von 1–2 kg sind normal.</p>' : ''}
    ${entries.length ? `<details id="log-all" style="margin-top:12px" ${logsOpen ? 'open' : ''}><summary>Alle Einträge (${entries.length})</summary><ul class="log-list">${entries.slice().reverse().map((e) => `<li><span>${formatDate(e.date, { day: '2-digit', month: '2-digit', year: 'numeric' })}</span><span><b>${e.value}</b> ${k.unit} <button class="btn ghost sm" data-del="${e.date}" aria-label="Eintrag vom ${formatDate(e.date)} löschen">✕</button></span></li>`).join('')}</ul></details>` : ''}
  </section>`;
}

function bindMeasurements(p) {
  $('#log-all')?.addEventListener('toggle', (e) => { logsOpen = e.target.open; });
  $$('[data-kind]').forEach((b) => b.addEventListener('click', () => { logKind = b.dataset.kind; renderProgress(p); }));
  $('#log-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = Number($('#log-val').value.replace(',', '.'));
    if (!(v > 0)) return;
    store.addLog(p, logKind, v, $('#log-date').value || toKey());
    finishUpdate(p);
    renderProgress(p);
    toast('Gespeichert ✓');
  });
  $$('[data-del]').forEach((b) => b.addEventListener('click', () => {
    const kind = logKind;
    const entry = store.removeLog(p, kind, b.dataset.del);
    renderProgress(p);
    if (entry) {
      undoToast('Eintrag gelöscht', () => {
        store.restoreLog(p, kind, entry);
        if (currentRoute === 'fortschritt') renderProgress(p);
        toast('Wiederhergestellt ✓');
      });
    }
  }));
}

// ---------- Profil & Einstellungen ----------
function renderProfile(p) {
  const s = store.getState();
  const L = LEVELS[p.level - 1];
  const famGoal = s.settings.familyGoal || defaultFamilyGoal(s.profiles.length);
  const notifyState = !notifySupported() ? 'unsupported' : Notification.permission;
  view.innerHTML = `<h1>Profil</h1>
    <div class="stack">
      <section class="card"><div class="row"><span style="font-size:2.5rem">${p.emoji}</span><div style="flex:1"><h2 style="margin:0">${esc(p.name)}</h2>
        <span class="small muted">dabei seit ${formatDate(p.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })}</span></div></div></section>

      <section class="card stack"><h2>Mein Warum & mein Plan</h2>
        <label class="field"><span>💚 Wofür mache ich das?</span><textarea id="why" maxlength="160" placeholder="z. B. Treppen ohne Pause schaffen">${esc(p.why)}</textarea></label>
        <label class="field"><span>🌅 Morgen-Challenge …</span><select id="plan-m">${opts(ANCHORS.morning, p.plan.morning)}</select></label>
        <label class="field"><span>🌙 Abend-Challenge …</span><select id="plan-e">${opts(ANCHORS.evening, p.plan.evening)}</select></label>
        <button class="btn soft" id="save-why">Speichern</button>
      </section>

      <section class="card stack"><h2>Level & Ziele</h2>
        <div><span class="level-badge" style="background:${L.color}">Level ${L.n} · ${esc(L.name)}</span></div>
        <p class="small muted" style="margin:0">${esc(L.desc)}</p>
        <label class="field"><span>Level manuell ändern</span><select id="lvl">${LEVELS.map((l) => `<option value="${l.n}" ${l.n === p.level ? 'selected' : ''}>Level ${l.n} – ${esc(l.name)}</option>`).join('')}</select></label>
        <div class="grid2">
          <label class="field"><span>🎯 Wochenziel</span><select id="wgoal">${[1, 2, 3, 4, 5, 6, 7].map((n) => `<option value="${n}" ${n === weekGoal(p) ? 'selected' : ''}>${n} ${n === 1 ? 'Tag' : 'Tage'}</option>`).join('')}</select></label>
          <label class="field"><span>💧 Trinkziel</span><select id="water">${[4, 5, 6, 7, 8, 9, 10].map((n) => `<option value="${n}" ${n === p.waterGoal ? 'selected' : ''}>${n} Gläser</option>`).join('')}</select></label>
        </div>
        <button class="btn soft" id="reassess">Einstufungstest wiederholen</button>
      </section>

      <section class="card stack"><h2>Erinnerungen</h2>
        <div class="grid2">
          <label class="field"><span>🌅 Morgens</span><input type="time" id="r-m" value="${p.reminders.morning}"></label>
          <label class="field"><span>🌙 Abends</span><input type="time" id="r-e" value="${p.reminders.evening}"></label>
        </div>
        <label class="check"><input type="checkbox" id="notify" ${s.settings.notify && notifyState === 'granted' ? 'checked' : ''} ${notifyState === 'unsupported' || notifyState === 'denied' ? 'disabled' : ''}>
          <span>Benachrichtigung zur Erinnerungszeit<br><span class="small muted">${notifyState === 'denied' ? 'Benachrichtigungen sind im Browser blockiert – bitte dort erlauben.' : notifyState === 'unsupported' ? 'Dieser Browser unterstützt keine Benachrichtigungen.' : 'Funktioniert, solange Aufwind geöffnet ist (auch im Hintergrund). Für zuverlässige Erinnerungen zusätzlich den Kalender nutzen.'}</span></span></label>
        <button class="btn soft" id="ics">📅 Kalender-Erinnerung herunterladen (.ics)</button>
      </section>

      <section class="card stack"><h2>Einstellungen</h2>
        <label class="check"><input type="checkbox" id="set-speech" ${s.settings.speech ? 'checked' : ''}><span>Sprachansagen im Workout</span></label>
        <label class="check"><input type="checkbox" id="set-sound" ${s.settings.sound ? 'checked' : ''}><span>Signaltöne im Workout</span></label>
      </section>

      <section class="card stack"><h2>Familie</h2>
        ${s.profiles.map((x) => `<div class="row spread"><span>${x.emoji} ${esc(x.name)} ${x.id === p.id ? '<span class="small muted">(aktiv)</span>' : ''}</span>
          ${x.id === p.id ? '' : `<button class="btn soft sm" data-switch="${x.id}">Wechseln</button>`}</div>`).join('')}
        ${s.profiles.length > 1 ? `<label class="field"><span>👨‍👩‍👧 Gemeinsames Wochenziel (Minuten)</span><input type="number" id="fam-goal" inputmode="numeric" min="30" max="3000" step="10" value="${famGoal}"></label>` : '<p class="small muted" style="margin:0">Leg weitere Profile an, dann sammelt ihr in der Familien-Challenge gemeinsam Minuten.</p>'}
        <a class="btn ghost" href="#/neu">➕ Profil hinzufügen</a>
      </section>

      ${syncSectionHTML()}

      <section class="card stack"><h2>Daten</h2>
        <p class="small muted" style="margin:0">Alles ist nur auf diesem Gerät gespeichert. Mach ab und zu eine Sicherung.</p>
        <button class="btn soft" id="export">⬇️ Sicherung exportieren</button>
        <label class="btn soft">⬆️ Sicherung importieren<input type="file" id="import" accept="application/json,.json" hidden></label>
        <button class="btn danger" id="delete">Profil „${esc(p.name)}“ löschen</button>
      </section>

      <section class="warn small"><b>⚕️ Wichtig:</b> Aufwind ersetzt keine ärztliche Beratung. Bei Vorerkrankungen vor dem Start ärztlich abklären lassen.
        Hör auf deinen Körper: Bei Brustschmerz, starker Atemnot, Schwindel oder Gelenkschmerz sofort aufhören.</section>
      <p class="center small muted">Aufwind v${VERSION}</p>
    </div>`;

  $('#save-why').addEventListener('click', () => {
    p.why = $('#why').value.trim();
    p.plan = { morning: $('#plan-m').value, evening: $('#plan-e').value };
    store.save();
    toast('Gespeichert 💚');
  });
  $('#lvl').addEventListener('change', (e) => { store.setLevel(p, Number(e.target.value)); finishUpdate(p); toast('Level geändert'); renderProfile(p); });
  $('#wgoal').addEventListener('change', (e) => { p.weekGoals[weekStart()] = Number(e.target.value); p.weekGoalDefault = Number(e.target.value); store.save(); toast('Wochenziel gespeichert'); });
  $('#water').addEventListener('change', (e) => { p.waterGoal = Number(e.target.value); store.save(); toast('Trinkziel gespeichert'); });
  $('#reassess').addEventListener('click', () => reassess(p));
  const saveRem = () => { p.reminders = { morning: $('#r-m').value || '07:30', evening: $('#r-e').value || '19:00' }; store.save(); };
  $('#r-m').addEventListener('change', saveRem);
  $('#r-e').addEventListener('change', saveRem);
  $('#notify').addEventListener('change', async (e) => {
    if (e.target.checked) {
      const ok = await enableNotifications();
      s.settings.notify = ok;
      e.target.checked = ok;
      toast(ok ? '🔔 Erinnerungen aktiviert' : 'Benachrichtigungen wurden nicht erlaubt');
    } else s.settings.notify = false;
    store.save();
    startReminders();
  });
  $('#ics').addEventListener('click', () => { saveRem(); download('aufwind-erinnerungen.ics', buildICS(p), 'text/calendar'); });
  $('#set-speech').addEventListener('change', (e) => { s.settings.speech = e.target.checked; store.save(); });
  $('#set-sound').addEventListener('change', (e) => { s.settings.sound = e.target.checked; store.save(); });
  $('#fam-goal')?.addEventListener('change', (e) => { const v = Number(e.target.value); if (v > 0) { s.settings.familyGoal = v; s.settings.familyGoalAt = new Date().toISOString(); store.save(); toast('Familienziel gespeichert'); } });
  $$('[data-switch]').forEach((b) => b.addEventListener('click', () => { store.switchProfile(b.dataset.switch); location.hash = '#/heute'; }));
  bindSyncSection(p);
  $('#export').addEventListener('click', () => download(`aufwind-sicherung-${toKey()}.json`, store.exportJSON()));
  $('#import').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!confirm('Die Sicherung ersetzt alle aktuellen Daten auf diesem Gerät. Fortfahren?')) return;
    try { store.importJSON(await f.text()); toast('Sicherung geladen ✓'); route(); } catch (err) { toast(err.message); }
  });
  $('#delete').addEventListener('click', () => {
    if (prompt(`Zum Löschen bitte „${p.name}“ eintippen:`) === p.name) { store.deleteProfile(p.id); location.hash = '#/heute'; route(); }
  });
}

/** Einstufung erneut durchlaufen, ohne Daten zu verlieren. */
function reassess(p) {
  const a = { ...p.answers };
  let qi = 0;
  const draw = () => {
    const q = QUESTIONS[qi];
    const sheet = openSheet(`<div class="progressbar"><i style="width:${(qi / QUESTIONS.length) * 100}%"></i></div>
      <h2>${esc(q.text)}</h2><div class="options">${q.options.map((o, k) => `<button class="option ${a[q.id] === k ? 'selected' : ''}" data-o="${k}">${esc(o)}</button>`).join('')}</div>
      <button class="btn ghost block" data-close style="margin-top:16px">Abbrechen</button>`);
    $$('[data-o]', sheet).forEach((b) => b.addEventListener('click', () => {
      a[q.id] = Number(b.dataset.o);
      if (++qi < QUESTIONS.length) { draw(); return; }
      const last = p.logs.weight.at(-1)?.value;
      const r = assess({ ...a, weightKg: last ?? a.weightKg });
      p.answers = a;
      p.assessment = r;
      closeSheet();
      if (r.level !== p.level && confirm(`Ergebnis: Level ${r.level} (${LEVELS[r.level - 1].name}). Übernehmen?`)) store.setLevel(p, r.level);
      else if (r.level === p.level) toast(`Du bleibst auf Level ${r.level} – passt!`);
      finishUpdate(p);
      renderProfile(p);
    }));
  };
  draw();
}

function buildICS(p) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const day = toKey().replace(/-/g, '');
  const ev = (uid, time, title, desc) => {
    const [h, m] = time.split(':');
    return ['BEGIN:VEVENT', `UID:${uid}-${p.id}@aufwind`, `DTSTAMP:${stamp}`, `DTSTART:${day}T${h}${m}00`, 'DURATION:PT10M',
      'RRULE:FREQ=DAILY', `SUMMARY:${title}`, `DESCRIPTION:${desc}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${title}`, 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT'].join('\r\n');
  };
  const anchor = (slot) => (p.plan?.[slot] ? ` ${p.plan[slot]}.` : '');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Aufwind//DE', 'CALSCALE:GREGORIAN',
    ev('morning', p.reminders.morning, '🌅 Aufwind: Morgen-Challenge', `Ein paar Minuten für dich – öffne Aufwind.${anchor('morning')}`),
    ev('evening', p.reminders.evening, '🌙 Aufwind: Abend-Challenge', `Kleine Einheit und Entspannung – öffne Aufwind.${anchor('evening')}`),
    'END:VCALENDAR'].join('\r\n');
}

// ---------- Geräte-Abgleich ----------
function syncStatusText(st = syncStatus()) {
  if (st.state === 'syncing') return '⏳ Gleiche ab …';
  if (st.state === 'error') return `⚠️ ${esc(st.error)}`;
  if (st.at) return `✅ Verbunden · zuletzt abgeglichen ${new Date(st.at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`;
  return '✅ Verbunden';
}

function syncSectionHTML() {
  const code = syncCode();
  return `<section class="card stack" id="sync-card">
    <div class="card-head"><span class="tile-ico blue">🔄</span><div><h2>Handy & PC verbinden</h2><span class="small muted">Gleicher Stand auf allen Geräten – ohne Konto.</span></div></div>
    ${code ? `
      <p class="small" id="sync-status" style="margin:0">${syncStatusText()}</p>
      <button class="btn" id="sync-show">📱 Weiteres Gerät verbinden</button>
      <div class="grid2"><button class="btn soft" id="sync-now">Jetzt abgleichen</button><button class="btn ghost" id="sync-leave">Trennen</button></div>
    ` : `
      <button class="btn" id="sync-new">Sync einrichten</button>
      <button class="btn soft" id="sync-join">Ich habe schon einen Code</button>
    `}
    <p class="small muted" style="margin:0">🔒 Deine Daten werden auf dem Gerät verschlüsselt, bevor sie gespeichert werden. Ohne deinen Code kann sie niemand lesen – auch der Server nicht.</p>
  </section>`;
}

let unsubSync = null;
function bindSyncSection(p) {
  unsubSync?.();
  unsubSync = onSyncStatus((st) => { const el = $('#sync-status'); if (el) el.innerHTML = syncStatusText(st); });
  $('#sync-new')?.addEventListener('click', async (e) => {
    e.target.disabled = true;
    e.target.textContent = 'Richte ein …';
    try { await setupSync(); toast('🔄 Sync eingerichtet'); renderProfile(p); showSyncCode(); }
    catch (err) { toast(err.message, 4500); e.target.disabled = false; e.target.textContent = 'Sync einrichten'; }
  });
  $('#sync-join')?.addEventListener('click', () => showJoin());
  $('#sync-show')?.addEventListener('click', () => showSyncCode());
  $('#sync-now')?.addEventListener('click', async () => { if (await syncNow()) toast('Abgeglichen ✓'); });
  $('#sync-leave')?.addEventListener('click', () => {
    if (!confirm('Dieses Gerät vom Abgleich trennen? Deine Daten bleiben hier erhalten, werden aber nicht mehr abgeglichen.')) return;
    leaveSync();
    renderProfile(p);
  });
}

async function showSyncCode() {
  const code = syncCode();
  if (!code) return;
  const link = syncLink(code);
  const sheet = openSheet(`<div class="row spread"><h2 style="margin:0">Weiteres Gerät verbinden</h2><button class="icon-btn" data-close aria-label="Schließen">✕</button></div>
    <p class="muted small">Scanne den QR-Code mit dem anderen Gerät – oder gib dort unter <b>Profil → Handy & PC verbinden → Ich habe schon einen Code</b> diesen Code ein:</p>
    <div class="card center" id="qr" style="max-width:260px;margin:0 auto;padding:12px;background:#fff">Lade QR-Code …</div>
    <p class="center" style="font-family:ui-monospace,monospace;font-weight:700;font-size:1.05rem;letter-spacing:.04em;margin:16px 0 8px">${formatCode(code)}</p>
    <button class="btn soft block" id="copy-link">🔗 Link kopieren</button>
    <p class="small muted" style="margin-top:12px">⚠️ Wer diesen Code hat, kann deine Daten sehen und ändern. Teile ihn nur mit deinen eigenen Geräten oder deiner Familie.</p>`);
  try { $('#qr', sheet).innerHTML = await qrSVG(link); } catch (e) { $('#qr', sheet).textContent = e.message; }
  $('#copy-link', sheet).addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(link); toast('Link kopiert ✓'); } catch { prompt('Link kopieren:', link); }
  });
}

function showJoin(prefill = '') {
  const sheet = openSheet(`<div class="row spread"><h2 style="margin:0">Mit Code verbinden</h2><button class="icon-btn" data-close aria-label="Schließen">✕</button></div>
    <p class="muted small">Den Code findest du auf dem ersten Gerät unter <b>Profil → Handy & PC verbinden → Weiteres Gerät verbinden</b>.</p>
    <label class="field"><span>Sync-Code</span><input type="text" id="join-code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX-…" value="${esc(formatCode(prefill))}"></label>
    <p class="small muted">Profile, die schon auf diesem Gerät sind, werden mit dem gemeinsamen Stand zusammengeführt – es geht nichts verloren.</p>
    <button class="btn block" id="join-go">Verbinden</button>`);
  const btn = $('#join-go', sheet);
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.textContent = 'Verbinde …';
    try {
      await joinSync($('#join-code', sheet).value);
      closeSheet();
      toast('🔄 Verbunden – dein Stand ist jetzt auf diesem Gerät.', 4000);
      confetti({ count: 60 });
      location.hash = store.activeProfile() ? '#/heute' : '#/neu';
      route();
    } catch (e) {
      toast(e.message, 4500);
      btn.disabled = false;
      btn.textContent = 'Verbinden';
    }
  });
}

// ---------- Start ----------
/** Hinweis, wenn eine neue Version bereitsteht – der laufende Code ist dann noch der alte. */
function showUpdateBar() {
  if ($('#update-bar')) return;
  const bar = document.createElement('div');
  bar.id = 'update-bar';
  bar.className = 'update-bar';
  bar.setAttribute('role', 'status');
  bar.innerHTML = '<span>✨ Neue Version von Aufwind ist da.</span><button type="button" class="btn light sm">Neu laden</button>';
  $('button', bar).addEventListener('click', () => location.reload());
  document.body.appendChild(bar);
}

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').then((reg) => {
    // Beim Zurückkehren in die App nach einer neuen Version schauen
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
  }).catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) showUpdateBar(); });
}
route();
startReminders();
startSync(onRemoteChange);
