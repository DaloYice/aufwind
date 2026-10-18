// Fokus-Bereiche für „Schnell trainieren“ und Gelenkbelastung je Übung (für das tägliche Befinden).

/** Welche Übungen eine Körperregion spürbar belasten – bei Beschwerden dort werden sie heute ersetzt. */
export const STRAIN = {
  knie: ['wandsitzen', 'ausfallvorwaerts', 'kniebeugehalten', 'aufstehen', 'kniebeuge', 'ausfallschritt', 'treppe', 'stepjack', 'bergsteiger', 'seitschritt', 'marschstehend', 'einbeinstand'],
  huefte: ['ausfallvorwaerts', 'seitstuetz', 'seitbein', 'ausfallschritt', 'kniebeuge', 'bruecke', 'kniehebensitzend', 'marschstehend', 'stepjack', 'einbeinstand', 'treppe'],
  ruecken: ['superman', 'bodenplank', 'bodenliegestuetz', 'seitstuetz', 'bruecke', 'vierfuessler', 'tischplank', 'kniebeuge', 'ausfallschritt', 'rumpfdrehung', 'bergsteiger', 'schattenboxen'],
  schulter: ['bodenliegestuetz', 'bodenplank', 'seitstuetz', 'wandliegestuetz', 'tischliegestuetz', 'tischplank', 'schulterkreisen', 'boxensitzend', 'schattenboxen', 'stepjack', 'brustdehnung', 'bergsteiger'],
  handgelenk: ['bodenliegestuetz', 'wandliegestuetz', 'tischliegestuetz', 'tischplank', 'vierfuessler', 'bergsteiger'],
};

export const PAIN_LABELS = { knie: 'Knie', huefte: 'Hüfte', ruecken: 'Rücken', schulter: 'Schulter', handgelenk: 'Handgelenk' };

/**
 * Fokus für Wunsch-Workouts. Entweder feste Übungsliste (ids) oder Bereiche (cats).
 * warm: mit Aufwärmen am Anfang, cool: mit Runterkommen am Ende (ab 10 Minuten).
 */
export const FOCUS = {
  ganzkoerper: { label: 'Ganzkörper', icon: 'user', cats: ['kraft', 'ausdauer', 'balance'], warm: true, cool: true },
  ruecken: { label: 'Rücken & Haltung', icon: 'spine', ids: ['rumpfdrehung', 'seitneigung', 'brustdehnung', 'schulterkreisen', 'wandliegestuetz', 'tischliegestuetz', 'tischplank', 'vierfuessler', 'bruecke', 'superman', 'bodenplank', 'seitstuetz'], warm: true, cool: true },
  nacken: { label: 'Nacken & Schultern', icon: 'sliders', ids: ['nacken', 'schulterkreisen', 'brustdehnung', 'seitneigung', 'rumpfdrehung', 'wandliegestuetz', 'boxensitzend'], warm: false, cool: true },
  beine: { label: 'Beine & Balance', icon: 'flag', ids: ['aufstehen', 'kniehebensitzend', 'beinstrecken', 'fersenheben', 'seitbein', 'kniebeuge', 'ausfallschritt', 'einbeinstand', 'tandemstand', 'bruecke'], warm: true, cool: true },
  kreislauf: { label: 'Kreislauf', icon: 'heart', cats: ['ausdauer'], exclude: ['gehen', 'langsamgehen', 'treppe'], warm: true, cool: true },
  dehnen: { label: 'Dehnen & Entspannen', icon: 'moon', cats: ['mobil', 'entspannung'], exclude: ['dankbarkeit'], warm: false, cool: false },
  beckenboden: { label: 'Beckenboden', icon: 'flower', cats: ['beckenboden'], first: ['bb_wahrnehmen'], warm: false, cool: false, noExtend: true, rest: 10 },
  kraft: { label: 'Kraft ohne Geräte', icon: 'dumbbell', cats: ['kraft'], warm: true, cool: true },
  aufwaermen: { label: 'Aufwärmen', icon: 'sun', ids: ['schulterkreisen', 'fussgelenke', 'rumpfdrehung', 'seitneigung', 'marschsitzend', 'marschstehend', 'fersenheben', 'waden'], warm: false, cool: false },
};

export const QUICK_MINUTES = [5, 10, 15, 20];
