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
    title: 'Kraft',
    teaser: 'Vom Liegestütz an der Wand bis zum Archer-Liegestütz und Klimmzug – Schritt für Schritt.',
    intro: 'Muskeln sind in jedem Alter trainierbar. Kraft schützt die Gelenke, hält den Stoffwechsel in Schwung und macht dich leistungsfähiger. Die Übungen steigern sich vom Stuhl über Tisch und Boden bis zu einbeinigen und explosiven Varianten – mit Geräten, wenn du welche hast.',
    points: [
      'Langsam und sauber: 2 Sekunden runter, 1 Sekunde hoch.',
      'Die letzten Wiederholungen dürfen anstrengend sein – sauber bleiben muss es.',
      '2–3 Krafteinheiten pro Woche reichen, dazwischen erholen.',
    ],
    safety: 'Bei Bluthochdruck nicht pressen – gleichmäßig weiteratmen. Gelenkschmerz ist ein Stoppsignal, Muskelbrennen nicht.',
    tips: [
      'Zu leicht? Langsamer werden oder unten kurz halten.',
      'Die Schwierigkeit oben auf „Fortgeschritten“ oder „Athletisch“ stellen, wenn dir alles zu leicht ist.',
      'Wiederholungen im Training mit + eintragen – so siehst du deinen Fortschritt.',
    ],
  },
  hiit: {
    focus: 'hiit', icon: 'zap', tone: 'red', minLevel: 4,
    title: 'Intervalle (HIIT)',
    teaser: 'Kurz, hart, effektiv: Belastung auf Zeit, kurze Pausen – maximaler Puls.',
    intro: 'Beim hochintensiven Intervalltraining wechseln sich kurze, harte Belastungen mit kurzen Pausen ab. Das trainiert Herz, Kreislauf und Kraftausdauer in wenig Zeit. Jede Übung läuft auf Zeit – du machst so viele saubere Wiederholungen wie möglich.',
    points: [
      'Belastung/Pause passen zu deinem Level: von 30/30 bis 45/15 Sekunden.',
      'In der Belastung wirklich Gas geben – in der Pause konsequent erholen.',
      '2–3 HIIT-Einheiten pro Woche reichen, dazwischen locker bewegen oder Kraft.',
    ],
    safety: 'HIIT bringt den Puls bis an die Grenze. Bei Herz-Kreislauf-Erkrankungen, Bluthochdruck oder wenn du länger nicht trainiert hast, vorher ärztlich abklären lassen. Bei Brustschmerz, Schwindel oder Übelkeit sofort aufhören.',
    tips: [
      'Gleichmäßiges Tempo über alle Runden schlägt einen Vollgas-Start.',
      'Wiederholungen pro Intervall merken – nächstes Mal eine mehr.',
      'Sprünge sind optional: Im Profil „Sprünge weglassen“ wählen, dann gibt es leise Alternativen.',
    ],
  },
  sprung: {
    focus: 'sprung', icon: 'rocket', tone: 'orange', minLevel: 6,
    title: 'Sprungkraft',
    teaser: 'Plyometrie: Burpees, Sprungkniebeugen, Skater – Schnellkraft und Puls.',
    intro: 'Sprungtraining (Plyometrie) macht Muskeln explosiv: Sie lernen, Kraft in kürzester Zeit zu entwickeln. Das bringt dich beim Laufen, im Sport und im Alltag weiter – und treibt den Puls hoch.',
    points: [
      'Landung vor Höhe: leise, federnd, Knie in Richtung Zehen.',
      'Lieber frisch und sauber als müde und schlampig – Qualität vor Menge.',
      'Rutschfester Boden und gute Schuhe, keine Socken auf glattem Boden.',
    ],
    safety: 'Sprünge belasten Knie, Sprunggelenke und Beckenboden stark. Bei Gelenkbeschwerden, nach Verletzungen, in der Schwangerschaft oder nach einer Geburt lieber die Varianten ohne Sprung wählen.',
    tips: [
      'Vorher immer aufwärmen – das Workout macht das automatisch.',
      'Wohnung mit Nachbarn unten? Auf einer Matte springen oder „Sprünge weglassen“.',
      'Zwischen zwei Sprungtagen mindestens einen Tag Pause.',
    ],
  },
  geraete: {
    focus: 'geraete', icon: 'dumbbell', tone: 'blue', equip: true,
    title: 'Mit Geräten',
    teaser: 'Kurzhanteln, Kettlebell, Klimmzugstange, Band – mehr Reize für Fortgeschrittene.',
    intro: 'Mit ein paar Geräten zu Hause wird Krafttraining vielseitiger: Zug-Übungen für den Rücken, mehr Gewicht für die Beine, Kettlebell-Swings für Kraftausdauer. Welche Geräte du hast, stellst du im Profil ein – dann tauchen die passenden Übungen auch in deinen täglichen Challenges auf.',
    points: [
      'Gewicht so wählen, dass die letzten 2–3 Wiederholungen schwer, aber sauber sind.',
      'Geht es leicht über die Zielzahl hinaus: nächstes Mal schwerer.',
      'Ziehen und Drücken ausgleichen – Rudern ist genauso wichtig wie Liegestütze.',
    ],
    safety: 'Rücken bei Kreuzheben und Swings immer gerade halten. Klimmzugstange vor dem ersten Training auf festen Sitz prüfen.',
    tips: [
      'Für den Anfang reichen zwei Kurzhanteln (z. B. 2 × 5–10 kg) oder eine Kettlebell (8–16 kg).',
      'Ein Widerstandsband ist die günstigste und leiseste Ergänzung.',
      'Negativ-Klimmzüge sind der schnellste Weg zum ersten echten Klimmzug.',
    ],
  },
};

/** Schwierigkeit für Schnell-Training und Welten (null = eigenes Level). */
export const DIFFICULTY = {
  einsteiger: { label: 'Einsteiger', level: 1 }, mittel: { label: 'Mittel', level: 3 },
  fortgeschritten: { label: 'Fortgeschritten', level: 5 }, athletisch: { label: 'Athletisch', level: 7 },
};
