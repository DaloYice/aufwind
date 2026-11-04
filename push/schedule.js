// Wann ist eine Erinnerung fällig? Reine Logik (ohne KV/Netz), damit sie testbar bleibt.

/** Datum (YYYY-MM-DD) und Minuten seit Mitternacht in einer Zeitzone. */
export function localNow(timeZone, now = new Date()) {
  let parts;
  try {
    parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  } catch {
    return localNow('Europe/Berlin', now);
  }
  const v = (t) => parts.find((p) => p.type === t).value;
  return { date: `${v('year')}-${v('month')}-${v('day')}`, minutes: Number(v('hour')) * 60 + Number(v('minute')) };
}

const toMin = (hm) => {
  const m = /^(\d{2}):(\d{2})$/.exec(hm || '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

/** Spielraum nach der Erinnerungszeit: verpasste Läufe (Cron-Ausfall) werden innerhalb einer Stunde nachgeholt. */
export const WINDOW_MIN = 60;

/**
 * Fällige Erinnerungen eines Abos: [{ pid, name, slot, date }].
 * Ob schon gesendet oder erledigt, prüft der Worker danach über KV.
 */
export function dueReminders(record, now = new Date()) {
  const { date, minutes } = localNow(record.tz, now);
  const out = [];
  for (const person of record.people || []) {
    for (const slot of ['morning', 'evening']) {
      const at = toMin(person[slot]);
      if (at == null) continue;
      const diff = minutes - at;
      if (diff >= 0 && diff < WINDOW_MIN) out.push({ pid: person.pid, name: person.name, slot, date });
    }
  }
  return out;
}

/** Text der Benachrichtigung. */
export function reminderPayload({ name, slot }) {
  const morning = slot === 'morning';
  return {
    title: morning ? `🌅 ${name}, Zeit für deine Morgen-Challenge` : `🌙 ${name}, Zeit für deine Abend-Challenge`,
    body: morning ? 'Ein paar Minuten – dann ist der Tag gestartet. Tipp hier und leg los.' : 'Deine Abend-Einheit wartet. Jede Minute zählt – tipp hier und starte.',
    url: './#/heute',
    tag: `aufwind-${slot}`,
  };
}
