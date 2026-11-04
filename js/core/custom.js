// „Schnell trainieren“: Workout nach Wunsch-Dauer und Fokus, mit Auf- und Abwärmen.
import { byId, forLevel, gearOf, fitsGear } from '../data/exercises.js';
import { FOCUS, intervalFor } from '../data/focus.js';
import { rng, hashString, amountFor, exerciseSeconds, summarize, REST } from './challenges.js';
import { checkinOf, avoids, energyFactor } from './checkin.js';

const NEVER = ['gehen', 'langsamgehen', 'dankbarkeit', 'joggen'];

function shuffle(list, rand) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * @param {{minutes:number, focus:string, mix?:number}} wish  mix: Zähler für „Neu mischen“
 * @returns Einheit im Format der Challenges (slot 'custom')
 */
export function customWorkout({ minutes, focus, mix = 0 }, profile, dateKey) {
  const f = FOCUS[focus] || FOCUS.ganzkoerper;
  const ci = checkinOf(profile, dateKey);
  const level = profile.level;
  const intensity = (profile.intensity ?? 1) * energyFactor(ci);
  const rand = rng(hashString(`${dateKey}|${profile.id}|${focus}|${minutes}|${mix}`));
  const gear = gearOf(profile);
  const ok = (e) => e && !e.programOnly && e.base[level - 1] != null && !NEVER.includes(e.id) && !(f.exclude || []).includes(e.id) && !avoids(ci, e.id) && fitsGear(e, gear);
  const okMain = (e) => ok(e) && (f.only !== 'jump' || e.jump) && (f.only !== 'equip' || e.equip);
  // Intervall-Training: jede Übung auf Zeit (Wdh.-Übungen werden zu „so viele wie möglich“), feste kurze Pausen
  const [work, pause] = f.interval ? intervalFor(level) : [0, 0];
  const step = (id, round = 1) => {
    const ex = byId[id];
    return { id, amount: amountFor(ex, level, ex.cat === 'entspannung' ? 1 : intensity), round };
  };
  const intervalStep = (id, round = 1) => {
    const sec = Math.max(15, Math.round((work * energyFactor(ci)) / 5) * 5);
    // Je-Seite-Übungen: die Belastungszeit teilt sich auf beide Seiten auf
    return { id, amount: byId[id].perSide ? Math.max(10, Math.round(sec / 10) * 5) : sec, unit: 'sek', round };
  };

  let pool = (f.ids ? f.ids.map((id) => byId[id]) : f.cats.flatMap((c) => forLevel(level, c, gear))).filter(okMain);
  if (!pool.length) pool = forLevel(level, 'mobil', gear).filter(ok);
  const rest = f.interval ? pause : f.rest ?? (focus === 'dehnen' || focus === 'aufwaermen' ? Math.min(10, REST[level - 1]) : REST[level - 1]);
  const budget = minutes * 60;
  const used = new Set();

  const warm = [];
  const cool = [];
  if (f.warm && minutes >= 10) {
    const w = shuffle(forLevel(level, 'mobil', gear).filter((e) => ok(e) && e.pos !== 'boden'), rand).slice(0, minutes >= 15 ? 2 : 1);
    w.forEach((e) => { warm.push(step(e.id)); used.add(e.id); });
  }
  if (f.cool && minutes >= 10) {
    // Ab Level 6 zum Schluss Dehnen statt Entspannungsübung
    const c = shuffle(level >= 6 ? forLevel(level, 'mobil', gear).filter((e) => ok(e) && !used.has(e.id) && e.pos !== 'boden' && e.id !== 'armschwung') : forLevel(level, 'entspannung', gear).filter(ok), rand)[0];
    if (c) { cool.push(step(c.id)); used.add(c.id); }
  }
  const cost = (list) => list.reduce((t, s) => t + exerciseSeconds(s) + rest, 0);

  // Hauptteil: Pool gemischt durchlaufen, bei Bedarf in weiteren Runden, bis die Zeit gefüllt ist
  let order = f.fixed ? pool.filter((e) => !used.has(e.id)) : shuffle(pool.filter((e) => !used.has(e.id)), rand);
  // Feste Einstiegsübung (z. B. Beckenboden: erst spüren, dann trainieren)
  const first = (f.first || []).map((id) => order.find((e) => e.id === id)).filter(Boolean);
  order = [...first, ...order.filter((e) => !first.includes(e))];
  // Zu wenig Auswahl (z. B. wegen Beschwerden) → um schonende Beweglichkeits- und Gleichgewichtsübungen ergänzen
  if (order.length < 4 && !f.noExtend) {
    const extra = ['mobil', 'balance', 'kraft'].flatMap((c) => forLevel(level, c, gear))
      .filter((e) => ok(e) && !used.has(e.id) && !order.includes(e) && e.pos !== 'boden');
    order = [...order, ...shuffle(extra, rand).slice(0, 4 - order.length)];
  }
  if (!order.length) order = shuffle(pool, rand);
  const main = [];
  let spent = cost(warm) + cost(cool);
  for (let i = 0; i < order.length * (f.fixed ? 1 : 3); i++) { // höchstens 3 Runden (feste Abläufe: eine)
    const s = (f.interval ? intervalStep : step)(order[i % order.length].id, Math.floor(i / order.length) + 1);
    const c = exerciseSeconds(s) + rest;
    if (main.length && spent + c > budget + 20 && !f.fixed) break; // feste Abläufe immer vollständig
    main.push(s);
    spent += c;
  }
  const rounds = Math.max(1, ...main.map((s) => s.round));
  const steps = [...warm, ...main, ...cool.map((s) => ({ ...s, round: rounds }))];
  const title = f.interval ? `${f.label} · ${minutes} Min · ${work}/${pause} s` : `${f.label} · ${minutes} Min`;
  return { ...summarize('custom', title, '', steps, rest, rounds), focus, wish: minutes, ...(f.interval ? { interval: true, fixedRest: true } : {}) };
}
