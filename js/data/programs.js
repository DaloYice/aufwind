import { exerciseSeconds } from '../core/challenges.js';

// Strukturierte Mehrwochen-Programme, je 3 Einheiten pro Woche.
// Gehprogramme nach dem Intervall-Prinzip (Gehen ↔ langsames Erholungsgehen), angelehnt an Einsteiger-Gehpläne.

const walk = (min) => ({ id: 'gehen', amount: Math.round(min * 60) });
const slow = (min) => ({ id: 'langsamgehen', amount: Math.round(min * 60) });
const intervals = (n, w, s) => {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(walk(w));
    if (s && i < n - 1) out.push(slow(s));
  }
  return out;
};
const withWarmup = (main) => [slow(2), ...main, slow(2)];

export const PROGRAMS = [
  {
    id: 'geh-start', icon: '🐾', name: 'Geh-Start', weeks: 8, levels: [1, 2],
    goal: '15 Minuten am Stück gehen',
    desc: 'Für den ganz sanften Einstieg: kurze Gehphasen mit Erholungspausen, die Woche für Woche länger werden.',
    plan: [
      intervals(3, 1, 1), intervals(4, 1, 1), intervals(4, 1.5, 1), intervals(3, 2.5, 1),
      intervals(3, 3.5, 1), intervals(2, 6, 1.5), intervals(2, 7, 1), [walk(15)],
    ],
  },
  {
    id: 'geh-30', icon: '🚶', name: 'Gehen 30', weeks: 8, levels: [2, 3, 4, 5],
    goal: '30 Minuten zügig am Stück gehen',
    desc: 'Vom Spaziergang zur halben Stunde zügigem Gehen – das entspricht der WHO-Empfehlung an 5 Tagen.',
    plan: [
      intervals(4, 2, 1), intervals(4, 3, 1), intervals(3, 5, 1), intervals(3, 6, 1),
      intervals(2, 10, 2), intervals(2, 12, 2), [walk(20), slow(2), walk(8)], [walk(30)],
    ].map(withWarmup),
  },
  {
    id: 'kraft-basis', icon: '🪑', name: 'Kraft-Basis', weeks: 6, levels: [1, 2, 3],
    goal: '15× vom Stuhl aufstehen ohne Hände',
    desc: 'Die wichtigsten Alltagsmuskeln stärken: Beine, Arme, Rumpf – alles mit Stuhl und Wand.',
    plan: [3, 5, 7, 9, 12, 15].map((reps, w) => [
      { id: 'marschsitzend', amount: 45 },
      { id: 'aufstehen', amount: reps },
      { id: 'wandliegestuetz', amount: Math.round(reps * 0.9) + 2 },
      { id: 'beinstrecken', amount: Math.round(reps * 0.7) + 3 },
      { id: 'fersenheben', amount: reps + 3 },
      ...(w >= 2 ? [{ id: 'aufstehen', amount: reps }] : []),
      { id: 'bauchatmung', amount: 60 },
    ]),
  },
  {
    id: 'kraft-aufbau', icon: '💪', name: 'Kraft-Aufbau', weeks: 6, levels: [4, 5, 6],
    goal: '20 saubere Liegestütze und 20 Bulgarische Kniebeugen je Bein',
    desc: 'Klassische Progression: Jede Woche etwas mehr Wiederholungen bei Liegestütz, Beinen und Rumpf – drei Runden, kurze Pausen.',
    plan: [8, 10, 12, 14, 17, 20].map((reps, w) => {
      const round = [
        { id: 'bodenliegestuetz', amount: reps },
        { id: 'bulgarisch', amount: Math.round(reps * 0.75) },
        { id: 'bodenplank', amount: 30 + w * 10 },
        { id: 'einbeinbruecke', amount: Math.round(reps * 0.6) + 2 },
      ];
      return [{ id: 'armschwung', amount: 45 }, ...round, ...round, ...(w >= 2 ? round : []), { id: 'hueftoeffner', amount: 30 }];
    }),
  },
  {
    id: 'athletik', icon: '⚡', name: 'Athletik', weeks: 6, levels: [6, 7, 8],
    goal: '15 Burpees, 15 Sprungkniebeugen und 90 s Unterarmstütz in einem Zirkel',
    desc: 'Zirkeltraining für Fitte: Sprungkraft, Kraft und Rumpf im Wechsel, Woche für Woche mehr Volumen und eine Runde zusätzlich.',
    plan: [0, 1, 2, 3, 4, 5].map((w) => {
      const round = [
        { id: 'burpee', amount: 8 + Math.round(w * 1.4) },
        { id: 'diamantliegestuetz', amount: 8 + w },
        { id: 'sprungkniebeuge', amount: 10 + w },
        { id: 'bodenplank', amount: 45 + w * 9 },
        { id: 'skater', amount: 30 + w * 3 },
      ];
      const rounds = w < 2 ? 2 : w < 4 ? 3 : 4;
      return [{ id: 'armschwung', amount: 45 }, ...Array.from({ length: rounds }, () => round).flat(), { id: 'hueftoeffner', amount: 30 }];
    }),
  },
];

export const programById = Object.fromEntries(PROGRAMS.map((p) => [p.id, p]));

/** Aktueller Stand eines laufenden Programms. */
export function programState(active) {
  if (!active) return null;
  const prog = programById[active.id];
  if (!prog) return null;
  const done = active.done?.length || 0;
  const total = prog.weeks * 3;
  const week = Math.min(prog.weeks, Math.floor(done / 3) + 1);
  return { prog, done, total, week, session: (done % 3) + 1, finished: done >= total, pct: Math.round((done / total) * 100) };
}

/** Nächste Einheit als Challenge-Objekt für den Player. */
export function programSession(active) {
  const st = programState(active);
  if (!st || st.finished) return null;
  const steps = st.prog.plan[st.week - 1].map((s) => ({ ...s, round: 1 }));
  const rest = st.prog.id.startsWith('geh') ? 0 : 20;
  const sec = steps.reduce((t, s) => t + exerciseSeconds(s), 0) + rest * (steps.length - 1);
  return {
    slot: 'program', title: `${st.prog.name} · Woche ${st.week}, Einheit ${st.session}`, icon: st.prog.icon,
    steps, rest, rounds: 1, durationSec: sec, minutes: Math.max(1, Math.round(sec / 60)),
  };
}
