// Fokus-Bereiche für „Schnell trainieren“ und Gelenkbelastung je Übung (für das tägliche Befinden).

/** Welche Übungen eine Körperregion spürbar belasten – bei Beschwerden dort werden sie heute ersetzt. */
export const STRAIN = {
  knie: ['wandsitzen', 'ausfallvorwaerts', 'kniebeugehalten', 'aufstehen', 'kniebeuge', 'ausfallschritt', 'treppe', 'stepjack', 'bergsteiger', 'seitschritt', 'marschstehend', 'einbeinstand', 'hampelmann', 'kniehebenlauf', 'burpee', 'sprungkniebeuge', 'skater', 'sprungausfall', 'hocksprung', 'bulgarisch', 'pistolstuhl', 'kh_goblet', 'joggen', 'band_seitgehen'],
  huefte: ['ausfallvorwaerts', 'seitstuetz', 'seitbein', 'ausfallschritt', 'kniebeuge', 'bruecke', 'kniehebensitzend', 'marschstehend', 'stepjack', 'einbeinstand', 'treppe', 'skater', 'sprungausfall', 'bulgarisch', 'pistolstuhl', 'einbeinbruecke', 'hueftoeffner', 'kh_kreuzheben', 'kb_swing', 'einbeinkreuzheben', 'band_seitgehen', 'kniehebenhaengend'],
  ruecken: ['superman', 'bodenplank', 'bodenliegestuetz', 'seitstuetz', 'bruecke', 'vierfuessler', 'tischplank', 'kniebeuge', 'ausfallschritt', 'rumpfdrehung', 'bergsteiger', 'schattenboxen', 'burpee', 'kh_kreuzheben', 'kb_swing', 'kh_rudern', 'klappmesser', 'hollowhold', 'einbeinkreuzheben', 'bergsteigerboden', 'schultertippen'],
  schulter: ['bodenliegestuetz', 'bodenplank', 'seitstuetz', 'wandliegestuetz', 'tischliegestuetz', 'tischplank', 'schulterkreisen', 'boxensitzend', 'schattenboxen', 'stepjack', 'brustdehnung', 'bergsteiger', 'diamantliegestuetz', 'pikeliegestuetz', 'archerliegestuetz', 'stuhldips', 'schultertippen', 'burpee', 'bergsteigerboden', 'kh_druecken', 'haengen', 'negativklimmzug', 'klimmzug', 'kniehebenhaengend', 'band_pullapart', 'armschwung'],
  handgelenk: ['bodenliegestuetz', 'wandliegestuetz', 'tischliegestuetz', 'tischplank', 'vierfuessler', 'bergsteiger', 'diamantliegestuetz', 'pikeliegestuetz', 'archerliegestuetz', 'schultertippen', 'burpee', 'bergsteigerboden', 'stuhldips'],
};

export const PAIN_LABELS = { knie: 'Knie', huefte: 'Hüfte', ruecken: 'Rücken', schulter: 'Schulter', handgelenk: 'Handgelenk' };

/**
 * Fokus für Wunsch-Workouts. Entweder feste Übungsliste (ids) oder Bereiche (cats).
 * warm: mit Aufwärmen am Anfang, cool: mit Runterkommen am Ende (ab 10 Minuten).
 * interval: Intervall-Training (HIIT) – jede Übung auf Zeit, feste kurze Pausen (INTERVALS je Level).
 * only: 'jump' = nur Sprungübungen, 'equip' = nur Geräte-Übungen. minLevel: erst ab diesem Level angeboten.
 */
export const FOCUS = {
  ganzkoerper: { label: 'Ganzkörper', icon: 'user', cats: ['kraft', 'ausdauer', 'balance'], warm: true, cool: true },
  ruecken: { label: 'Rücken & Haltung', icon: 'spine', ids: ['rumpfdrehung', 'seitneigung', 'brustdehnung', 'schulterkreisen', 'wandliegestuetz', 'tischliegestuetz', 'tischplank', 'vierfuessler', 'bruecke', 'superman', 'bodenplank', 'seitstuetz'], warm: true, cool: true },
  nacken: { label: 'Nacken & Schultern', icon: 'sliders', ids: ['nacken', 'schulterkreisen', 'brustdehnung', 'seitneigung', 'rumpfdrehung', 'wandliegestuetz', 'boxensitzend'], warm: false, cool: true },
  beine: { label: 'Beine & Balance', icon: 'flag', ids: ['aufstehen', 'kniehebensitzend', 'beinstrecken', 'fersenheben', 'seitbein', 'kniebeuge', 'ausfallschritt', 'einbeinstand', 'tandemstand', 'bruecke', 'einbeinkreuzheben', 'bulgarisch', 'pistolstuhl', 'einbeinbruecke', 'kh_goblet', 'kh_kreuzheben', 'band_seitgehen', 'ausfallvorwaerts', 'wandsitzen'], warm: true, cool: true },
  kreislauf: { label: 'Kreislauf', icon: 'heart', cats: ['ausdauer'], exclude: ['gehen', 'langsamgehen', 'treppe', 'joggen'], warm: true, cool: true },
  hiit: { label: 'Intervalle (HIIT)', icon: 'zap', cats: ['ausdauer', 'kraft'], exclude: ['gehen', 'langsamgehen', 'treppe', 'joggen', 'haengen', 'negativklimmzug', 'klimmzug', 'kniehebenhaengend', 'archerliegestuetz'], interval: true, warm: true, cool: true, minLevel: 4 },
  sprung: { label: 'Sprungkraft', icon: 'rocket', cats: ['ausdauer', 'kraft'], only: 'jump', warm: true, cool: true, minLevel: 6 },
  geraete: { label: 'Mit Geräten', icon: 'dumbbell', cats: ['kraft', 'ausdauer', 'balance'], only: 'equip', warm: true, cool: true },
  dehnen: { label: 'Dehnen & Entspannen', icon: 'moon', cats: ['mobil', 'entspannung'], exclude: ['dankbarkeit'], warm: false, cool: false },
  beckenboden: { label: 'Beckenboden', icon: 'flower', cats: ['beckenboden'], first: ['bb_wahrnehmen'], warm: false, cool: false, noExtend: true, rest: 10 },
  kraft: { label: 'Kraft', icon: 'dumbbell', cats: ['kraft'], warm: true, cool: true },
  aufwaermen: { label: 'Aufwärmen', icon: 'sun', ids: ['schulterkreisen', 'fussgelenke', 'rumpfdrehung', 'seitneigung', 'marschsitzend', 'marschstehend', 'fersenheben', 'waden', 'armschwung', 'hueftoeffner', 'brustdehnung'], warm: false, cool: false },
};

/** Belastung/Pause in Sekunden fürs Intervall-Training je Level (ab Level 4). */
export const INTERVALS = { 4: [30, 30], 5: [30, 20], 6: [40, 20], 7: [40, 15], 8: [45, 15] };
export const intervalFor = (level) => INTERVALS[Math.max(4, Math.min(8, level))];

/** Wird der Schwerpunkt für dieses Profil angeboten? (Level-Grenze, Geräte vorhanden) */
export const focusAvailable = (f, profile) => (!f.minLevel || profile.level >= f.minLevel)
  && (f.only !== 'equip' || (profile.equipment || []).length > 0)
  && (f.only !== 'jump' || !profile.noJumps);

export const QUICK_MINUTES = [5, 10, 15, 20];
