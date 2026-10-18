// Trainingswelten: Themen mit eigener Seite, Erklärung, Sicherheits-Hinweisen und Kurz-Workouts (Schwerpunkt aus focus.js).

export const WORLDS = {
  beckenboden: {
    focus: 'beckenboden', icon: 'flower', tone: 'violet',
    title: 'Beckenboden',
    teaser: 'Stärkt die Mitte, schützt vor Blasenschwäche – für Frauen und Männer.',
    intro: 'Der Beckenboden ist eine Muskelschicht, die wie eine Hängematte unten im Becken liegt. Er hält Blase und Darm dicht, stützt die Organe und arbeitet mit Rücken- und Bauchmuskeln zusammen. Regelmäßiges Training kann Blasenschwäche vorbeugen und lindern – in jedem Alter.',
    points: [
      'Erst spüren, dann trainieren: Anspannen und Lösen sind gleich wichtig.',
      'Weiteratmen, nie die Luft anhalten. Po, Bauch und Beine bleiben locker.',
      'Lieber täglich ein paar Minuten als selten lange. Erste Wirkung oft nach 6–12 Wochen.',
    ],
    safety: 'Nach einer Geburt, nach Operationen im Bauch- oder Beckenbereich oder bei Beschwerden wie Schmerzen, Senkungsgefühl oder Inkontinenz bitte vorher mit Ärztin, Arzt, Hebamme oder Physiotherapie sprechen – dort gibt es oft spezielle Rückbildungs- und Beckenbodenkurse.',
    tips: [
      'Im Alltag: kurz vor dem Husten, Niesen oder Heben den Beckenboden anspannen.',
      'Nicht beim Wasserlassen üben – das kann die Blasenentleerung stören.',
      'Üben geht unauffällig überall: an der Ampel, beim Zähneputzen, am Schreibtisch.',
    ],
  },
  ruecken: {
    focus: 'ruecken', icon: 'spine', tone: 'green',
    title: 'Rücken',
    teaser: 'Beweglich bleiben, Haltung stärken – gegen Verspannungen vom Sitzen.',
    intro: 'Die meisten Rückenschmerzen sind „unspezifisch“ – und Bewegung ist dann das beste Mittel. Beweglichkeit lockert, Kraft für Rumpf und Schultern stützt. Schonen dagegen macht es oft schlimmer.',
    points: [
      'Sanft beginnen, dann Kraft aufbauen – Schmerz soll nicht zunehmen.',
      'Wichtig sind Oberer Rücken, Rumpf und Hüfte, nicht nur „der Rücken“.',
      'Kurz und oft hilft mehr als einmal pro Woche lang.',
    ],
    safety: 'Bei Taubheitsgefühlen, Lähmungen, Fieber, nach einem Unfall oder bei starken nächtlichen Schmerzen bitte sofort ärztlich abklären lassen.',
    tips: [
      'Jede halbe Stunde kurz aufstehen und strecken.',
      'Beim Heben in die Knie gehen und die Last nah am Körper halten.',
      'Gehen ist eines der besten Rückenmittel überhaupt.',
    ],
  },
  kraft: {
    focus: 'kraft', icon: 'dumbbell', tone: 'orange',
    title: 'Kraft ohne Geräte',
    teaser: 'Vom Aufstehen vom Stuhl bis zum Liegestütz am Boden – Schritt für Schritt.',
    intro: 'Muskeln sind in jedem Alter trainierbar. Kraft schützt die Gelenke, hält den Stoffwechsel in Schwung und macht den Alltag leichter. Hier steigerst du dich vom Stuhl über die Wand und den Tisch bis zum Boden.',
    points: [
      'Langsam und sauber: 2 Sekunden runter, 1 Sekunde hoch.',
      'Die letzten Wiederholungen dürfen anstrengend sein – sauber bleiben muss es.',
      '2–3 Krafteinheiten pro Woche reichen, dazwischen erholen.',
    ],
    safety: 'Bei Bluthochdruck nicht pressen – gleichmäßig weiteratmen. Gelenkschmerz ist ein Stoppsignal, Muskelbrennen nicht.',
    tips: [
      'Zu leicht? Langsamer werden oder unten kurz halten.',
      'Die Schwierigkeit oben auf „Fortgeschritten“ stellen, wenn dir alles zu leicht ist.',
      'Wiederholungen im Training mit + eintragen – so siehst du deinen Fortschritt.',
    ],
  },
};

/** Schwierigkeit für Schnell-Training und Welten (null = eigenes Level). */
export const DIFFICULTY = { einsteiger: { label: 'Einsteiger', level: 1 }, mittel: { label: 'Mittel', level: 3 }, fortgeschritten: { label: 'Fortgeschritten', level: 5 } };
