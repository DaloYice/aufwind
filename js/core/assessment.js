// Einstufungstest → Startlevel 1–5.
// Bewusst vorsichtig: Im Zweifel niedriger einsteigen; über Feedback geht es schnell nach oben.

export const LEVELS = [
  { n: 1, name: 'Sanfter Start', desc: 'Übungen überwiegend im Sitzen, 2–6 Minuten pro Einheit.', color: '#7cb87e' },
  { n: 2, name: 'Aufstehen', desc: 'Sitzen und Stehen mit Stütze, kurze Spaziergänge, 5–10 Minuten.', color: '#5aa6a6' },
  { n: 3, name: 'In Bewegung', desc: 'Frei stehend, gelenkschonend, 10–15 Minuten.', color: '#5b8bd9' },
  { n: 4, name: 'Aktiv', desc: 'Kraft und Ausdauer mit dem eigenen Körpergewicht, 15–25 Minuten.', color: '#9a6bd6' },
  { n: 5, name: 'Fit', desc: 'Volle Einheiten mit mehreren Runden, 20–30 Minuten.', color: '#d9675b' },
];

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
 * @param {{walk:number, chairStand:number, stairs:number, joints:number, activeDays:number,
 *          age?:number, heightCm?:number, weightKg?:number, flags?:string[]}} a
 */
export function assess(a) {
  const score =
    a.walk * 3 + // 0–9
    a.chairStand * 3 + // 0–6
    a.stairs * 2 + // 0–4
    (2 - a.joints) * 1.5 + // 0–3
    a.activeDays * 1.5; // 0–4.5

  let level = score < 5 ? 1 : score < 10 ? 2 : score < 15 ? 3 : score < 20 ? 4 : 5;
  const reasons = [];
  const cap = (max, why) => {
    if (level > max) {
      level = max;
      reasons.push(why);
    }
  };

  const b = bmi(a.heightCm, a.weightKg);
  if (b != null && b >= 40) cap(2, 'Bei einem BMI über 40 starten wir besonders gelenkschonend.');
  else if (b != null && b >= 35) cap(3, 'Bei einem BMI über 35 schonen wir anfangs die Gelenke.');
  if (a.walk === 0 && a.chairStand === 0) cap(1, 'Wir stärken zuerst die Beine im Sitzen.');
  if (a.chairStand === 0) cap(2, 'Das Aufstehen vom Stuhl trainieren wir gezielt mit.');
  if (a.joints === 2) cap(3, 'Wegen häufiger Gelenkschmerzen verzichten wir anfangs auf belastende Übungen.');
  if (a.age >= 70) cap(3, 'Ab 70 lieber behutsam steigern.');

  const flags = a.flags || [];
  const doctorHint = flags.length > 0;
  if (doctorHint) cap(3, 'Wegen deiner Gesundheitsangaben starten wir vorsichtig.');

  return { level, score: Math.round(score * 10) / 10, bmi: b, bmiClass: bmiClass(b), doctorHint, reasons };
}
