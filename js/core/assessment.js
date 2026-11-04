// Einstufungstest → Startlevel 1–8.
// Unten bewusst vorsichtig (im Zweifel niedriger einsteigen), oben offen: Wer schon trainiert, landet ab v0.8.0 auf 6–8.

export const LEVELS = [
  { n: 1, name: 'Basis', desc: 'Kraft und Beweglichkeit im Sitzen – das Fundament. 5–8 Minuten.', color: '#7cb87e' },
  { n: 2, name: 'Aufbau', desc: 'Sitzen und Stehen mit Stütze, erste Gehrunden. 8–12 Minuten.', color: '#5aa6a6' },
  { n: 3, name: 'Bewegung', desc: 'Frei stehend, gelenkschonend, zwei Runden. 12–18 Minuten.', color: '#5b8bd9' },
  { n: 4, name: 'Aktiv', desc: 'Körpergewicht-Kraft auch am Boden, mehr Tempo. 15–25 Minuten.', color: '#9a6bd6' },
  { n: 5, name: 'Sportlich', desc: 'Drei Runden, kurze Pausen, erste Intervalle. 20–30 Minuten.', color: '#d9675b' },
  { n: 6, name: 'Athletisch', desc: 'Sprünge, Plyometrie und HIIT, harte Liegestütz-Varianten. 25–35 Minuten.', color: '#e0803a' },
  { n: 7, name: 'Leistung', desc: 'Vier Runden, einbeinige Kraft, explosive Sprünge, kurze Pausen. 30–40 Minuten.', color: '#c9452f' },
  { n: 8, name: 'Elite', desc: 'Maximales Volumen und Tempo – für Leute, die schon richtig trainieren. 35–45 Minuten.', color: '#2b2b33' },
];

/** Ab diesem Level kommen Sprungübungen dazu. */
export const JUMP_LEVEL = 6;

export const QUESTIONS = [
  {
    id: 'walk', text: 'Wie lange kannst du am Stück gehen, ohne Pause zu brauchen?',
    options: ['Weniger als 5 Minuten', '5–15 Minuten', '15–30 Minuten', 'Mehr als 30 Minuten'],
  },
  {
    id: 'chairStand', text: 'Kannst du ohne Hilfe der Hände von einem Stuhl aufstehen?',
    options: ['Nein, ich brauche die Hände', 'Ja, aber es ist anstrengend', 'Ja, ganz leicht'],
  },
  {
    id: 'stairs', text: 'Wie geht es dir beim Treppensteigen (ein Stockwerk)?',
    options: ['Schaffe ich kaum oder gar nicht', 'Geht, aber mit Pause oder sehr außer Atem', 'Kein Problem'],
  },
  {
    id: 'joints', text: 'Hast du Schmerzen in Knien, Hüfte oder Rücken?',
    options: ['Nein', 'Manchmal', 'Häufig'],
  },
  {
    id: 'activeDays', text: 'An wie vielen Tagen pro Woche bewegst du dich aktuell mindestens 20 Minuten bewusst?',
    options: ['0 Tage', '1–2 Tage', '3–4 Tage', '5 oder mehr Tage'],
  },
  {
    id: 'pushups', text: 'Wie viele saubere Liegestütze am Boden schaffst du am Stück?',
    options: ['Keinen', '1–5', '6–15', '16–30', 'Mehr als 30'],
  },
  {
    id: 'run', text: 'Wie lange kannst du am Stück locker joggen?',
    options: ['Gar nicht', 'Bis 10 Minuten', '10–30 Minuten', 'Mehr als 30 Minuten'],
  },
];

// Gesundheits-Check nach dem Prinzip des PAR-Q (Physical Activity Readiness Questionnaire).
export const HEALTH_FLAGS = [
  { id: 'heart', text: 'Herzerkrankung oder ärztlich verordnete Bewegungseinschränkung' },
  { id: 'chest', text: 'Brustschmerzen bei Belastung oder in Ruhe' },
  { id: 'dizzy', text: 'Schwindel oder Ohnmacht in letzter Zeit' },
  { id: 'bp', text: 'Bluthochdruck oder Diabetes mit Medikamenten' },
  { id: 'joint', text: 'Gelenk- oder Knochenproblem, das sich durch Bewegung verschlimmern könnte' },
  { id: 'pregnant', text: 'Schwangerschaft oder kürzliche Operation' },
];

export function bmi(heightCm, weightKg) {
  if (!heightCm || !weightKg) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export function bmiClass(value) {
  if (value == null) return '';
  if (value < 18.5) return 'Untergewicht';
  if (value < 25) return 'Normalgewicht';
  if (value < 30) return 'Übergewicht';
  if (value < 35) return 'Adipositas Grad I';
  if (value < 40) return 'Adipositas Grad II';
  return 'Adipositas Grad III';
}

/**
 * @param {{walk:number, chairStand:number, stairs:number, joints:number, activeDays:number, pushups?:number, run?:number,
 *          age?:number, heightCm?:number, weightKg?:number, flags?:string[]}} a
 * Ergebnis `max`: höchstes Level, das die Angaben erlauben (Aufstiegs-Vorschläge gehen nicht darüber).
 */
export function assess(a) {
  const score =
    a.walk * 3 + // 0–9
    a.chairStand * 3 + // 0–6
    a.stairs * 2 + // 0–4
    (2 - a.joints) * 1.5 + // 0–3
    a.activeDays * 1.5; // 0–4.5

  let level = score < 5 ? 1 : score < 10 ? 2 : score < 15 ? 3 : score < 20 ? 4 : 5;
  // Oben offen: Wer im Alltag alles mühelos schafft, wird über Liegestütze und Laufen weiter eingestuft.
  const fit = (a.pushups ?? 0) * 1.5 + (a.run ?? 0) * 2; // 0–12
  const athlete = level === 5 || score >= 18;
  if (athlete && fit >= 5) level = fit >= 11 ? 8 : fit >= 8 ? 7 : 6;
  const reasons = [];
  let max = LEVELS.length;
  const cap = (limit, why) => {
    max = Math.min(max, limit);
    if (level > limit) {
      level = limit;
      reasons.push(why);
    }
  };

  const b = bmi(a.heightCm, a.weightKg);
  if (b != null && b >= 40) cap(2, 'Bei einem BMI über 40 starten wir besonders gelenkschonend.');
  else if (b != null && b >= 35) cap(3, 'Bei einem BMI über 35 schonen wir anfangs die Gelenke.');
  else if (b != null && b >= 30) cap(JUMP_LEVEL - 1, 'Bei einem BMI über 30 lassen wir Sprünge vorerst weg – sie belasten die Gelenke stark.');
  if (a.walk === 0 && a.chairStand === 0) cap(1, 'Wir stärken zuerst die Beine im Sitzen.');
  if (a.chairStand === 0) cap(2, 'Das Aufstehen vom Stuhl trainieren wir gezielt mit.');
  if (a.joints === 2) cap(3, 'Wegen häufiger Gelenkschmerzen verzichten wir anfangs auf belastende Übungen.');
  else if (a.joints === 1) cap(JUMP_LEVEL, 'Wegen gelegentlicher Gelenkschmerzen ohne die härtesten Sprungübungen.');
  if (a.age >= 70) cap(3, 'Ab 70 lieber behutsam steigern.');

  const flags = a.flags || [];
  const doctorHint = flags.length > 0;
  if (doctorHint) cap(3, 'Wegen deiner Gesundheitsangaben starten wir vorsichtig.');

  return { level, max, score: Math.round(score * 10) / 10, bmi: b, bmiClass: bmiClass(b), doctorHint, reasons };
}
