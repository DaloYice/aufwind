import * as store from './store.js';
import { $, $$, esc, toast, openSheet, closeSheet, fmtAmount, download } from './ui.js';
import { runPlayer } from './player.js';
import { lineChart } from './chart.js';
import { toKey, addDays, fromKey, formatDate } from './core/dates.js';
import { LEVELS, QUESTIONS, HEALTH_FLAGS, assess, bmi, bmiClass } from './core/assessment.js';
import { challengeFor, habitOfDay, tipOfDay } from './core/challenges.js';
import { streak, totals, weekMinutes, adjustIntensity, levelSuggestion, awardBadges, BADGES } from './core/progress.js';
import { EXERCISES, CATEGORIES, POSITIONS, byId } from './data/exercises.js';

const view = $('#view');
const tabbar = $('#tabbar');
const EMOJIS = ['🙂', '😎', '🦊', '🐻', '🐢', '🦁', '🐱', '🌻', '⭐', '🚀', '🌈', '💪'];

// ---------- Router ----------
const routes = { heute: renderToday, uebungen: renderLibrary, fortschritt: renderProgress, profil: renderProfile, neu: renderOnboarding };

function route() {
  const name = location.hash.replace(/^#\/?/, '').split('/')[0] || 'heute';
  const p = store.activeProfile();
  if (!p && name !== 'neu') { location.hash = '#/neu'; return; }
  closeSheet();
  tabbar.hidden = name === 'neu';
  $$('a', tabbar).forEach((a) => a.classList.toggle('active', a.dataset.tab === name));
  (routes[name] || renderToday)(p);
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);

// ---------- Onboarding / Einstufung ----------
function renderOnboarding() {
  const isFirst = store.getState().profiles.length === 0;
  const data = { name: '', emoji: EMOJIS[0], age: '', heightCm: '', weightKg: '', flags: [] };
  const screens = ['welcome', 'name', 'body', ...QUESTIONS.map((q) => q.id), 'health', 'result'];
  let i = 0;

  const draw = () => {
    const s = screens[i];
    const pct = Math.round((i / (screens.length - 1)) * 100);
    let html = '';
    let canNext = true;

    if (s === 'welcome') {
      html = `<div class="center" style="font-size:4rem">🌬️</div>
        <h1 class="center">${isFirst ? 'Willkommen bei Aufwind' : 'Neues Profil'}</h1>
        <p>Aufwind holt dich genau da ab, wo du gerade stehst – egal, ob du gerade erst anfängst oder schon trainierst.</p>
        <div class="card stack">
          <div class="row"><span style="font-size:1.6rem">🌅</span><span><b>Morgens</b> eine kurze Aktivierung</span></div>
          <div class="row"><span style="font-size:1.6rem">🌙</span><span><b>Abends</b> eine kleine Einheit mit Entspannung</span></div>
          <div class="row"><span style="font-size:1.6rem">🥦</span><span><b>Täglich</b> eine kleine Alltags-Gewohnheit</span></div>
        </div>
        <p class="muted small" style="margin-top:16px">Zuerst ein paar Fragen (2 Minuten), damit wir das richtige Startlevel finden. Alle Daten bleiben nur auf diesem Gerät.</p>`;
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
    } else if (s === 'result') {
      const r = assess(answers(data));
      data.result = r;
      const L = LEVELS[r.level - 1];
      html = `<div class="center" style="font-size:3.5rem">🎯</div>
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
        store.createProfile({ name: data.name.trim(), emoji: data.emoji, answers: answers(data), assessment: r, level: r.level });
        location.hash = '#/heute';
        route();
        toast(`Willkommen, ${data.name.trim()}! 🎉`);
        return;
      }
      i++;
      draw();
    });

    // Eingaben
    $('#f-name')?.addEventListener('input', (e) => { data.name = e.target.value; nextBtn.disabled = !data.name.trim(); });
    $('#f-name')?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && data.name.trim()) nextBtn.click(); });
    $$('[data-emoji]').forEach((b) => b.addEventListener('click', () => {
      data.emoji = b.dataset.emoji;
      $$('[data-emoji]').forEach((x) => x.classList.toggle('selected', x === b));
    }));
    [['f-age', 'age'], ['f-height', 'heightCm'], ['f-weight', 'weightKg']].forEach(([id, key]) =>
      $(`#${id}`)?.addEventListener('input', (e) => { data[key] = e.target.value; }));
    $$('[data-opt]').forEach((b) => b.addEventListener('click', () => {
      data[s] = Number(b.dataset.opt);
      i++;
      draw();
    }));
    $$('[data-flag]').forEach((b) => b.addEventListener('click', () => {
      const f = b.dataset.flag;
      data.flags = data.flags.includes(f) ? data.flags.filter((x) => x !== f) : [...data.flags, f];
      b.classList.toggle('selected');
    }));
    view.querySelector('input')?.focus();
  };
  draw();
}

function answers(d) {
  const num = (v) => (v === '' || v == null ? undefined : Number(String(v).replace(',', '.')));
  // activeDays: Antwortindex 0–3
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
  const habit = habitOfDay(today, p);
  const habitDone = !!p.habits[today];
  const L = LEVELS[p.level - 1];
  const sugg = levelSuggestion(p);
  const doneSet = new Set(p.sessions.map((s) => s.date));

  const days = Array.from({ length: 7 }, (_, k) => addDays(today, k - 6));
  const week = days.map((d) => {
    const cls = [doneSet.has(d) ? 'on' : st.jokers.includes(d) ? 'joker' : '', d === today ? 'today' : ''].join(' ');
    return `<span class="${cls}" title="${formatDate(d)}">${fromKey(d).toLocaleDateString('de-DE', { weekday: 'short' }).slice(0, 2)}</span>`;
  }).join('');

  const card = (slot) => {
    const c = challengeFor(slot, today, p);
    const d = done(slot);
    const names = [...new Set(c.steps.map((s) => s.id))].map((id) => `<span class="chip">${byId[id].icon} ${esc(byId[id].name)}</span>`).join('');
    return `<section class="card hero ${slot} ${d ? 'done' : ''}">
      <div class="row spread"><div><div class="small" style="opacity:.85">${slot === 'morning' ? 'Morgen-Challenge' : 'Abend-Challenge'}</div>
      <h2 style="margin:0">${esc(c.title)}</h2></div><div class="big-icon">${d ? '✅' : c.icon}</div></div>
      <div class="chips">${names}</div>
      <div class="row spread"><span>⏱ ca. ${c.minutes} Min${c.rounds > 1 ? ` · ${c.rounds} Runden` : ''}</span>
      <button class="btn ${d ? 'light sm' : 'light'}" data-start="${slot}">${d ? 'Nochmal' : 'Starten'}</button></div>
    </section>`;
  };

  view.innerHTML = `
    <header class="greet"><div><div class="muted small">${fromKey(today).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      <h1 style="margin:0">${greet}, ${esc(p.name)}</h1></div><a class="avatar" href="#/profil" aria-label="Profil" style="text-decoration:none">${p.emoji || '🙂'}</a></header>
    <div class="stack">
      <div class="streak"><span style="font-size:2rem">🔥</span><div style="flex:1">
        <div><b>${st.count}</b> ${st.count === 1 ? 'Tag' : 'Tage'} in Folge</div>
        <div class="small muted">${st.jokerAvailable ? '🃏 Joker verfügbar – ein verpasster Tag pro Woche ist okay.' : '🃏 Joker diese Woche schon genutzt.'}</div>
        <div class="week">${week}</div></div></div>
      ${sugg === 'up' ? `<div class="banner"><b>⬆️ Bereit für mehr?</b><p class="small">Die Challenges fallen dir zuletzt leicht. Möchtest du auf Level ${p.level + 1} (${esc(LEVELS[p.level].name)}) wechseln?</p>
        <div class="row"><button class="btn sm" data-level="${p.level + 1}">Ja, Level ${p.level + 1}</button><button class="btn ghost sm" data-dismiss>Noch nicht</button></div></div>` : ''}
      ${sugg === 'down' ? `<div class="warn"><b>Etwas zu viel?</b><p class="small">Kein Problem – ein Schritt zurück ist auch ein Schritt. Auf Level ${p.level - 1} wechseln?</p>
        <div class="row"><button class="btn sm" data-level="${p.level - 1}">Ja, Level ${p.level - 1}</button><button class="btn ghost sm" data-dismiss>Nein, weiter so</button></div></div>` : ''}
      ${card('morning')}
      ${card('evening')}
      <section class="card">
        <label class="check"><input type="checkbox" id="habit" ${habitDone ? 'checked' : ''}>
          <span><span class="small muted">Gewohnheit des Tages</span><br><b>${habit.icon} ${esc(habit.text)}</b><br><span class="small muted">${esc(habit.tip)}</span></span></label>
      </section>
      <button class="btn soft block" id="extra">➕ Andere Bewegung eintragen</button>
      <section class="card"><div class="small muted">💡 Wusstest du?</div><p style="margin:0">${esc(tipOfDay(today))}</p></section>
      <p class="center small muted">Level ${p.level} · ${esc(L.name)} · Intensität ${Math.round(p.intensity * 100)} %</p>
    </div>`;

  $$('[data-start]').forEach((b) => b.addEventListener('click', () => startChallenge(p, b.dataset.start)));
  $('#habit').addEventListener('change', (e) => {
    if (e.target.checked) { p.habits[today] = habit.id; toast('Gut gemacht! 🌱'); } else delete p.habits[today];
    finishUpdate(p);
  });
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
  $('#extra').addEventListener('click', () => extraActivity(p));
}

function startChallenge(p, slot) {
  const today = toKey();
  const c = challengeFor(slot, today, p);
  runPlayer(c, store.getState().settings, (res) => {
    if (!res) return;
    const already = p.sessions.some((s) => s.date === today && s.slot === slot);
    if (!already) p.sessions.push({ date: today, slot, feedback: res.feedback, durationSec: res.durationSec, title: c.title });
    p.intensity = adjustIntensity(p.intensity, res.feedback);
    finishUpdate(p);
    renderToday(p);
    toast(res.feedback === 'schwer' ? 'Danke! Morgen wird es etwas sanfter. 💚' : res.feedback === 'leicht' ? 'Notiert – morgen legen wir etwas drauf! 💪' : 'Super! Weiter so. ✨');
  });
}

function extraActivity(p) {
  const kinds = ['🚶 Spaziergang', '🚴 Radfahren', '🏊 Schwimmen / Aqua', '💃 Tanzen', '🧘 Yoga', '🌳 Gartenarbeit', '🏋️ Fitnessstudio', '⚽ Sport', '🧹 Hausarbeit (aktiv)'];
  const sheet = openSheet(`<h2>Andere Bewegung</h2><p class="muted small">Alles zählt! Das hält auch deine Serie am Leben.</p>
    <div class="stack"><label class="field"><span>Was hast du gemacht?</span><select id="x-kind">${kinds.map((k) => `<option>${k}</option>`).join('')}</select></label>
    <label class="field"><span>Wie viele Minuten?</span><input type="number" id="x-min" inputmode="numeric" min="1" max="600" value="15"></label>
    <div class="row"><button class="btn ghost" data-close>Abbrechen</button><button class="btn" id="x-save" style="flex:1">Speichern</button></div></div>`);
  $('#x-save', sheet).addEventListener('click', () => {
    const min = Number($('#x-min', sheet).value);
    if (!(min > 0)) return;
    p.sessions.push({ date: toKey(), slot: 'extra', title: $('#x-kind', sheet).value, durationSec: min * 60, feedback: 'passt' });
    closeSheet();
    finishUpdate(p);
    renderToday(p);
    toast('Eingetragen – stark! 💪');
  });
}

function finishUpdate(p) {
  const fresh = awardBadges(p);
  store.save();
  fresh.forEach((b, k) => setTimeout(() => toast(`${b.icon} Abzeichen: ${b.name}!`, 3500), 1200 + k * 3600));
}

// ---------- Übungsbibliothek ----------
let libFilter = { cat: '', mine: true };
function renderLibrary(p) {
  const list = EXERCISES.filter((e) => (!libFilter.cat || e.cat === libFilter.cat) && (!libFilter.mine || e.base[p.level - 1] != null));
  view.innerHTML = `<h1>Übungen</h1>
    <div class="filters" role="toolbar" aria-label="Filter">
      <button data-mine class="${libFilter.mine ? 'on' : ''}">Mein Level</button>
      <button data-cat="" class="${!libFilter.cat ? 'on' : ''}">Alle</button>
      ${Object.entries(CATEGORIES).map(([k, c]) => `<button data-cat="${k}" class="${libFilter.cat === k ? 'on' : ''}">${c.icon} ${c.label}</button>`).join('')}
    </div>
    <p class="small muted">${list.length} Übungen${libFilter.mine ? ` für Level ${p.level}` : ''}</p>
    <div class="ex-list">${list.map((e) => `<button class="ex-item" data-ex="${e.id}"><span class="ico">${e.icon}</span>
      <span style="flex:1"><b>${esc(e.name)}</b><br><span class="small muted">${CATEGORIES[e.cat].label} · ${POSITIONS[e.pos]}</span></span>
      <span class="small muted">${e.base[p.level - 1] != null ? esc(fmtAmount(e, e.base[p.level - 1])) : `ab L${e.base.findIndex((v) => v != null) + 1}`}</span></button>`).join('')}</div>`;

  $('[data-mine]').addEventListener('click', () => { libFilter.mine = !libFilter.mine; renderLibrary(p); });
  $$('[data-cat]').forEach((b) => b.addEventListener('click', () => { libFilter.cat = b.dataset.cat; renderLibrary(p); }));
  $$('[data-ex]').forEach((b) => b.addEventListener('click', () => showExercise(p, b.dataset.ex)));
}

function showExercise(p, id) {
  const e = byId[id];
  const levels = e.base.map((v, k) => (v != null ? `<span class="chip">L${k + 1}: ${esc(fmtAmount(e, v))}</span>` : '')).join('');
  openSheet(`<div class="row spread"><span style="font-size:3rem">${e.icon}</span><button class="icon-btn" data-close aria-label="Schließen">✕</button></div>
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
  $('#try').addEventListener('click', () => {
    closeSheet();
    const amount = e.base[p.level - 1] ?? e.base.find((v) => v != null);
    runPlayer({ title: e.name, icon: e.icon, steps: [{ id, amount, round: 1 }], rest: 0, rounds: 1, minutes: 1 },
      store.getState().settings, () => {});
  });
}

// ---------- Fortschritt ----------
const LOG_KINDS = {
  weight: { label: 'Gewicht', unit: 'kg', icon: '⚖️', step: '0.1' },
  waist: { label: 'Bauchumfang', unit: 'cm', icon: '📏', step: '0.5' },
  hip: { label: 'Hüftumfang', unit: 'cm', icon: '📐', step: '0.5' },
  steps: { label: 'Schritte', unit: 'Schritte', icon: '👣', step: '1' },
};
let logKind = 'weight';

function renderProgress(p) {
  const t = totals(p);
  const st = streak(p);
  const wk = weekMinutes(p);
  const goal = 150;
  const k = LOG_KINDS[logKind];
  const entries = p.logs[logKind] || [];
  const first = entries[0]?.value, last = entries.at(-1)?.value;
  const delta = entries.length > 1 ? Math.round((last - first) * 10) / 10 : null;
  const h = p.answers?.heightCm;
  const curBmi = logKind === 'weight' && h && last ? bmi(h, last) : null;

  view.innerHTML = `<h1>Fortschritt</h1>
    <div class="stack">
      <div class="stats">
        <div class="stat"><b>${t.sessions}</b><span class="small muted">Einheiten</span></div>
        <div class="stat"><b>${t.minutes}</b><span class="small muted">Minuten</span></div>
        <div class="stat"><b>${Math.max(p.bestStreak || 0, st.count)}</b><span class="small muted">beste Serie</span></div>
      </div>
      <section class="card">
        <div class="row spread"><b>Bewegung diese Woche</b><span>${wk} / ${goal} Min</span></div>
        <div class="bar" style="margin:8px 0"><i style="width:${Math.min(100, (wk / goal) * 100)}%"></i></div>
        <p class="small muted" style="margin:0">Fernziel der WHO: 150 Minuten pro Woche. Jede Minute auf dem Weg dahin zählt – auch 10 Minuten sind ein Gewinn.</p>
      </section>
      <section class="card">
        <div class="filters">${Object.entries(LOG_KINDS).map(([key, v]) => `<button data-kind="${key}" class="${key === logKind ? 'on' : ''}">${v.icon} ${v.label}</button>`).join('')}</div>
        ${delta != null ? `<p><b>${delta > 0 ? '+' : ''}${delta} ${k.unit}</b> <span class="muted small">seit ${formatDate(entries[0].date)}</span>${curBmi ? ` · <span class="small">BMI ${curBmi} (${esc(bmiClass(curBmi))})</span>` : ''}</p>` : ''}
        ${lineChart(entries, { unit: k.unit })}
        <form id="log-form" class="row" style="margin-top:12px">
          <input type="number" id="log-val" inputmode="decimal" step="${k.step}" min="0" placeholder="${k.label} in ${k.unit}" required aria-label="${k.label}">
          <input type="date" id="log-date" value="${toKey()}" max="${toKey()}" aria-label="Datum" style="max-width:150px">
          <button class="btn" type="submit">+</button>
        </form>
        ${logKind === 'weight' ? '<p class="small muted" style="margin:8px 0 0">Tipp: Immer zur gleichen Zeit wiegen, z. B. morgens nach dem Aufstehen. Tagesschwankungen von 1–2 kg sind normal.</p>' : ''}
        ${entries.length ? `<details style="margin-top:12px"><summary>Alle Einträge (${entries.length})</summary><ul class="log-list">${entries.slice().reverse().map((e) => `<li><span>${formatDate(e.date, { day: '2-digit', month: '2-digit', year: 'numeric' })}</span><span><b>${e.value}</b> ${k.unit} <button class="btn ghost sm" data-del="${e.date}" aria-label="Löschen">✕</button></span></li>`).join('')}</ul></details>` : ''}
      </section>
      <section><h2>Abzeichen</h2><div class="badges">${BADGES.map((b) => {
        const got = p.badges?.[b.id];
        return `<div class="badge ${got ? '' : 'locked'}" title="${esc(b.desc)}"><span class="ico">${b.icon}</span><b>${esc(b.name)}</b><br><span class="muted">${got ? formatDate(got) : esc(b.desc)}</span></div>`;
      }).join('')}</div></section>
      <section class="card"><h2>Verlauf</h2>${p.sessions.length ? `<ul class="log-list">${p.sessions.slice(-15).reverse().map((s) => `<li><span>${formatDate(s.date)} · ${esc(s.title || s.slot)}</span><span class="small muted">${Math.round((s.durationSec || 0) / 60)} Min ${s.feedback === 'leicht' ? '😌' : s.feedback === 'schwer' ? '😮‍💨' : '👍'}</span></li>`).join('')}</ul>` : '<p class="muted">Noch keine Einheiten – deine erste Challenge wartet unter „Heute“.</p>'}</section>
    </div>`;

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
    if (confirm('Eintrag löschen?')) { store.removeLog(p, logKind, b.dataset.del); renderProgress(p); }
  }));
}

// ---------- Profil & Einstellungen ----------
function renderProfile(p) {
  const s = store.getState();
  const L = LEVELS[p.level - 1];
  view.innerHTML = `<h1>Profil</h1>
    <div class="stack">
      <section class="card"><div class="row"><span style="font-size:2.5rem">${p.emoji}</span><div style="flex:1"><h2 style="margin:0">${esc(p.name)}</h2>
        <span class="small muted">dabei seit ${formatDate(p.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })}</span></div></div></section>

      <section class="card stack"><h2>Level</h2>
        <div><span class="level-badge" style="background:${L.color}">Level ${L.n} · ${esc(L.name)}</span></div>
        <p class="small muted" style="margin:0">${esc(L.desc)}</p>
        <label class="field"><span>Level manuell ändern</span><select id="lvl">${LEVELS.map((l) => `<option value="${l.n}" ${l.n === p.level ? 'selected' : ''}>Level ${l.n} – ${esc(l.name)}</option>`).join('')}</select></label>
        <button class="btn soft" id="reassess">Einstufungstest wiederholen</button>
      </section>

      <section class="card stack"><h2>Erinnerungen</h2>
        <p class="small muted" style="margin:0">Trag dir die Challenges als täglichen Termin in deinen Handy-Kalender ein – der erinnert dich zuverlässig.</p>
        <div class="grid2">
          <label class="field"><span>🌅 Morgens</span><input type="time" id="r-m" value="${p.reminders.morning}"></label>
          <label class="field"><span>🌙 Abends</span><input type="time" id="r-e" value="${p.reminders.evening}"></label>
        </div>
        <button class="btn soft" id="ics">📅 Kalender-Erinnerung herunterladen (.ics)</button>
      </section>

      <section class="card stack"><h2>Einstellungen</h2>
        <label class="check"><input type="checkbox" id="set-speech" ${s.settings.speech ? 'checked' : ''}><span>Sprachansagen im Workout</span></label>
        <label class="check"><input type="checkbox" id="set-sound" ${s.settings.sound ? 'checked' : ''}><span>Signaltöne im Workout</span></label>
      </section>

      <section class="card stack"><h2>Familie</h2>
        ${s.profiles.map((x) => `<div class="row spread"><span>${x.emoji} ${esc(x.name)} ${x.id === p.id ? '<span class="small muted">(aktiv)</span>' : ''}</span>
          ${x.id === p.id ? '' : `<button class="btn soft sm" data-switch="${x.id}">Wechseln</button>`}</div>`).join('')}
        <a class="btn ghost" href="#/neu">➕ Profil hinzufügen</a>
      </section>

      <section class="card stack"><h2>Daten</h2>
        <p class="small muted" style="margin:0">Alles ist nur auf diesem Gerät gespeichert. Mach ab und zu eine Sicherung.</p>
        <button class="btn soft" id="export">⬇️ Sicherung exportieren</button>
        <label class="btn soft">⬆️ Sicherung importieren<input type="file" id="import" accept="application/json,.json" hidden></label>
        <button class="btn danger" id="delete">Profil „${esc(p.name)}“ löschen</button>
      </section>

      <section class="warn small"><b>⚕️ Wichtig:</b> Aufwind ersetzt keine ärztliche Beratung. Bei Vorerkrankungen vor dem Start ärztlich abklären lassen.
        Hör auf deinen Körper: Bei Brustschmerz, starker Atemnot, Schwindel oder Gelenkschmerz sofort aufhören.</section>
      <p class="center small muted">Aufwind v0.1.0</p>
    </div>`;

  $('#lvl').addEventListener('change', (e) => { store.setLevel(p, Number(e.target.value)); finishUpdate(p); toast('Level geändert'); renderProfile(p); });
  $('#reassess').addEventListener('click', () => reassess(p));
  const saveRem = () => { p.reminders = { morning: $('#r-m').value || '07:30', evening: $('#r-e').value || '19:00' }; store.save(); };
  $('#r-m').addEventListener('change', saveRem);
  $('#r-e').addEventListener('change', saveRem);
  $('#ics').addEventListener('click', () => { saveRem(); download('aufwind-erinnerungen.ics', buildICS(p), 'text/calendar'); });
  $('#set-speech').addEventListener('change', (e) => { s.settings.speech = e.target.checked; store.save(); });
  $('#set-sound').addEventListener('change', (e) => { s.settings.sound = e.target.checked; store.save(); });
  $$('[data-switch]').forEach((b) => b.addEventListener('click', () => { store.switchProfile(b.dataset.switch); location.hash = '#/heute'; }));
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
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Aufwind//DE', 'CALSCALE:GREGORIAN',
    ev('morning', p.reminders.morning, '🌅 Aufwind: Morgen-Challenge', 'Ein paar Minuten für dich – öffne Aufwind.'),
    ev('evening', p.reminders.evening, '🌙 Aufwind: Abend-Challenge', 'Kleine Einheit und Entspannung – öffne Aufwind.'),
    'END:VCALENDAR'].join('\r\n');
}

// ---------- Start ----------
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
route();
