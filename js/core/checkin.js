// Tägliches Befinden: Energie, Stimmung, Beschwerden – und was daraus für die Übungen folgt.
import { STRAIN, PAIN_LABELS } from '../data/focus.js';

/** profile.checkins['YYYY-MM-DD'] = { energy: 1–3, mood: 1–3, pain: ['knie', …], at } */
export const checkinOf = (profile, dateKey) => profile.checkins?.[dateKey] || null;

/** Belastet die Übung eine Region, in der heute Beschwerden angegeben sind? */
export const avoids = (checkin, exId) => (checkin?.pain || []).some((r) => STRAIN[r]?.includes(exId));

/** Wenig Energie → Mengen um 20 % kleiner. */
export const energyFactor = (checkin) => (checkin?.energy === 1 ? 0.8 : 1);

/** Kurzer Text, was heute angepasst wird (oder ''). */
export function adaptText(checkin) {
  if (!checkin) return '';
  const parts = [];
  if (checkin.pain?.length) parts.push(`schont ${checkin.pain.map((r) => PAIN_LABELS[r]).join(', ')}`);
  if (checkin.energy === 1) parts.push('etwas leichter');
  return parts.join(' · ');
}
