// Übungsbibliothek. base = Menge je Level 1–5 (null = für dieses Level nicht vorgesehen).
// unit: 'sek' (Zeit) oder 'wdh' (Wiederholungen). perSide: Menge gilt je Seite.
// Grundsatz für Level 1–2: gelenkschonend, keine Sprünge, keine Bodenübungen.

export const CATEGORIES = {
  mobil: { label: 'Beweglichkeit', icon: '🌀' },
  kraft: { label: 'Kraft', icon: '💪' },
  ausdauer: { label: 'Ausdauer', icon: '❤️' },
  balance: { label: 'Gleichgewicht', icon: '⚖️' },
  entspannung: { label: 'Entspannung', icon: '🌙' },
};

export const POSITIONS = { sitzend: 'im Sitzen', stehend: 'im Stehen', boden: 'auf dem Boden' };

export const EXERCISES = [
  // ---------- Beweglichkeit ----------
  {
    id: 'schulterkreisen', name: 'Schulterkreisen', icon: '🔄', cat: 'mobil', pos: 'sitzend',
    unit: 'sek', base: [30, 30, 40, 40, 45],
    steps: ['Aufrecht sitzen oder stehen, Arme hängen locker.', 'Schultern langsam nach vorne, oben, hinten und unten kreisen.', 'Nach der Hälfte der Zeit die Richtung wechseln.'],
    tip: 'Ruhig weiteratmen – die Bewegung darf groß, aber nie ruckartig sein.',
    easier: 'Nur die Schultern hochziehen und fallen lassen.', harder: 'Arme seitlich ausstrecken und große Armkreise machen.',
  },
  {
    id: 'nacken', name: 'Nacken lockern', icon: '🙆', cat: 'mobil', pos: 'sitzend',
    unit: 'sek', base: [30, 30, 30, 40, 40],
    steps: ['Aufrecht sitzen, Blick nach vorne.', 'Kopf langsam zur rechten Schulter neigen, kurz halten.', 'Zur Mitte zurück und zur linken Seite neigen.'],
    tip: 'Nicht den Kopf kreisen lassen und nicht in den Nacken legen – nur sanft zur Seite.',
    easier: 'Kleinere Bewegung, nur bis ein leichtes Ziehen kommt.', harder: 'Mit der Hand ganz sanft nachhelfen.',
  },
  {
    id: 'fussgelenke', name: 'Füße kreisen', icon: '🦶', cat: 'mobil', pos: 'sitzend', perSide: true,
    unit: 'sek', base: [20, 20, 20, 30, 30],
    steps: ['Auf die Stuhlkante setzen, ein Bein leicht anheben oder die Ferse aufsetzen.', 'Den Fuß langsam in großen Kreisen bewegen.', 'Richtung wechseln, dann das andere Bein.'],
    tip: 'Gut für den Kreislauf in den Beinen – auch zwischendurch im Büro.',
    easier: 'Ferse am Boden lassen und nur die Zehen auf und ab wippen.', harder: 'Bein dabei gestreckt in der Luft halten.',
  },
  {
    id: 'rumpfdrehung', name: 'Sitzende Rumpfdrehung', icon: '↪️', cat: 'mobil', pos: 'sitzend', perSide: true,
    unit: 'wdh', base: [5, 6, 8, 10, 10],
    steps: ['Aufrecht sitzen, Füße fest am Boden.', 'Hände vor der Brust überkreuzen.', 'Oberkörper langsam nach rechts drehen, zurück zur Mitte, dann nach links.'],
    tip: 'Die Hüfte bleibt ruhig, nur der Oberkörper dreht.',
    easier: 'Hände auf die Oberschenkel legen und nur ein kleines Stück drehen.', harder: 'Arme seitlich ausstrecken.',
  },
  {
    id: 'seitneigung', name: 'Seitneigung', icon: '🌾', cat: 'mobil', pos: 'sitzend', perSide: true,
    unit: 'wdh', base: [5, 6, 8, 8, 10],
    steps: ['Aufrecht sitzen oder stehen.', 'Einen Arm über den Kopf strecken, die andere Hand ruht am Stuhl oder an der Hüfte.', 'Oberkörper sanft zur Seite neigen, zurück zur Mitte.'],
    tip: 'Nicht nach vorne kippen – stell dir vor, du stehst zwischen zwei Glasscheiben.',
    easier: 'Arm nicht über den Kopf, Hand rutscht nur am Bein entlang.', harder: 'Beide Arme über dem Kopf.',
  },
  {
    id: 'brustdehnung', name: 'Brustdehnung', icon: '🚪', cat: 'mobil', pos: 'stehend',
    unit: 'sek', base: [20, 20, 30, 30, 40],
    steps: ['Seitlich in einen Türrahmen stellen.', 'Unterarm auf Schulterhöhe an den Rahmen legen.', 'Oberkörper sanft vom Arm wegdrehen, bis die Brust zieht. Halbe Zeit, dann Seite wechseln.'],
    tip: 'Hilft gegen die typische „Schreibtisch-Haltung“.',
    easier: 'Im Sitzen die Hände hinter dem Rücken verschränken und Schultern zurückziehen.', harder: 'Arm etwas höher ansetzen.',
  },
  {
    id: 'waden', name: 'Wadendehnung', icon: '🧱', cat: 'mobil', pos: 'stehend', perSide: true,
    unit: 'sek', base: [20, 20, 30, 30, 30],
    steps: ['Mit beiden Händen an einer Wand abstützen.', 'Ein Bein einen großen Schritt nach hinten stellen, Ferse bleibt am Boden.', 'Vorderes Knie beugen, bis die hintere Wade zieht.'],
    tip: 'Ferse hinten wirklich am Boden lassen.',
    easier: 'Kleinerer Schritt.', harder: 'Größerer Schritt, Hüfte weiter nach vorne.',
  },

  // ---------- Kraft ----------
  {
    id: 'aufstehen', name: 'Aufstehen vom Stuhl', icon: '🪑', cat: 'kraft', pos: 'sitzend',
    unit: 'wdh', base: [3, 5, 8, 12, 15],
    steps: ['Auf die vordere Hälfte eines stabilen Stuhls (ohne Rollen!) setzen, Füße hüftbreit.', 'Oberkörper leicht nach vorne lehnen, Gewicht über die Füße.', 'Aufstehen, kurz stehen, langsam wieder hinsetzen.'],
    tip: 'Die wichtigste Alltagsübung überhaupt. Am Anfang dürfen die Hände auf den Oberschenkeln helfen.',
    easier: 'Mit den Händen an den Armlehnen abdrücken oder ein Kissen auf den Stuhl legen (höherer Sitz).', harder: 'Arme vor der Brust verschränken und sehr langsam hinsetzen.',
  },
  {
    id: 'kniehebensitzend', name: 'Knie heben im Sitzen', icon: '🦵', cat: 'kraft', pos: 'sitzend',
    unit: 'wdh', base: [6, 8, 10, 12, 15],
    steps: ['Aufrecht auf der Stuhlkante sitzen, an der Sitzfläche festhalten.', 'Abwechselnd ein Knie Richtung Brust heben.', 'Langsam wieder absetzen.'],
    tip: 'Kräftigt Bauch und Hüftbeuger, ganz ohne Gelenkbelastung.',
    easier: 'Nur die Ferse anheben, Zehen bleiben am Boden.', harder: 'Beide Knie gleichzeitig leicht anheben.',
  },
  {
    id: 'beinstrecken', name: 'Bein strecken im Sitzen', icon: '🦿', cat: 'kraft', pos: 'sitzend', perSide: true,
    unit: 'wdh', base: [6, 8, 10, 12, 15],
    steps: ['Aufrecht sitzen, Füße am Boden.', 'Ein Bein nach vorne strecken, bis es gerade ist, 2 Sekunden halten.', 'Langsam absenken.'],
    tip: 'Stärkt die Oberschenkel und entlastet so die Knie im Alltag.',
    easier: 'Bein nur halb strecken.', harder: 'Oben 5 Sekunden halten, Zehen zu dir ziehen.',
  },
  {
    id: 'wandliegestuetz', name: 'Liegestütz an der Wand', icon: '🧍', cat: 'kraft', pos: 'stehend',
    unit: 'wdh', base: [5, 8, 10, 12, 15],
    steps: ['Eine Armlänge vor einer Wand stehen.', 'Hände auf Schulterhöhe an die Wand legen.', 'Arme beugen, bis die Nase fast die Wand berührt, dann wegdrücken.'],
    tip: 'Körper bleibt gerade wie ein Brett.',
    easier: 'Näher an die Wand stellen.', harder: 'Weiter weg stellen oder an einer Tischkante üben.',
  },
  {
    id: 'fersenheben', name: 'Fersenheben', icon: '👠', cat: 'kraft', pos: 'stehend',
    unit: 'wdh', base: [6, 10, 12, 15, 20],
    steps: ['Hinter einen Stuhl stellen und an der Lehne festhalten.', 'Auf die Zehenspitzen hochdrücken.', 'Langsam wieder absenken.'],
    tip: 'Waden sind die „zweite Herzpumpe“ – gut für den Kreislauf.',
    easier: 'Im Sitzen die Fersen heben.', harder: 'Ohne Festhalten oder einbeinig.',
  },
  {
    id: 'seitbein', name: 'Bein seitlich heben', icon: '↔️', cat: 'kraft', pos: 'stehend', perSide: true,
    unit: 'wdh', base: [null, 6, 8, 10, 12],
    steps: ['Seitlich hinter einen Stuhl stellen und festhalten.', 'Gestrecktes Bein langsam zur Seite heben.', 'Langsam zurückführen.'],
    tip: 'Kräftigt die Hüfte und verbessert die Standsicherheit.',
    easier: 'Nur wenige Zentimeter heben.', harder: 'Oben 3 Sekunden halten.',
  },
  {
    id: 'tischliegestuetz', name: 'Liegestütz am Tisch', icon: '🍽️', cat: 'kraft', pos: 'stehend',
    unit: 'wdh', base: [null, null, 6, 10, 12],
    steps: ['Hände schulterbreit auf eine stabile Tisch- oder Arbeitsplattenkante.', 'Füße nach hinten, Körper gerade.', 'Brust zur Kante senken, kraftvoll wegdrücken.'],
    tip: 'Tisch muss fest stehen und darf nicht rutschen.',
    easier: 'An der Wand üben.', harder: 'Auf den Knien am Boden.',
  },
  {
    id: 'tischplank', name: 'Unterarmstütz am Tisch', icon: '🪵', cat: 'kraft', pos: 'stehend',
    unit: 'sek', base: [null, null, 15, 25, 40],
    steps: ['Unterarme auf einen stabilen Tisch legen.', 'Füße nach hinten setzen, bis der Körper eine schräge Linie bildet.', 'Bauch fest anspannen und halten.'],
    tip: 'Weiteratmen! Lieber kürzer und sauber.',
    easier: 'Hände an die Wand, Füße näher heran.', harder: 'Unterarmstütz auf dem Boden.',
  },
  {
    id: 'kniebeuge', name: 'Kniebeuge', icon: '🏋️', cat: 'kraft', pos: 'stehend',
    unit: 'wdh', base: [null, null, 8, 12, 15],
    steps: ['Füße hüftbreit, Arme nach vorne.', 'Po nach hinten schieben, als würdest du dich auf einen Stuhl setzen.', 'Knie zeigen Richtung Zehen. Wieder aufrichten.'],
    tip: 'Ein Stuhl hinter dir gibt Sicherheit – kurz antippen und wieder hoch.',
    easier: 'Aufstehen vom Stuhl.', harder: 'Unten 2 Sekunden halten.',
  },
  {
    id: 'ausfallschritt', name: 'Ausfallschritt rückwärts', icon: '🚶', cat: 'kraft', pos: 'stehend', perSide: true,
    unit: 'wdh', base: [null, null, null, 6, 10],
    steps: ['Aufrecht stehen, bei Bedarf an einer Stuhllehne festhalten.', 'Großen Schritt nach hinten machen und beide Knie beugen.', 'Mit dem vorderen Bein zurück in den Stand drücken.'],
    tip: 'Rückwärts ist knieschonender als vorwärts.',
    easier: 'Kleinerer Schritt, nicht so tief.', harder: 'Ohne Festhalten, langsam ausführen.',
  },
  {
    id: 'bruecke', name: 'Becken heben', icon: '🌉', cat: 'kraft', pos: 'boden',
    unit: 'wdh', base: [null, null, null, 10, 15],
    steps: ['Auf den Rücken legen, Knie gebeugt, Füße hüftbreit.', 'Po anspannen und das Becken heben, bis Knie, Hüfte und Schultern eine Linie bilden.', 'Langsam absenken.'],
    tip: 'Stärkt Po und unteren Rücken – gut gegen Rückenschmerzen.',
    easier: 'Becken nur ein kleines Stück heben.', harder: 'Oben 3 Sekunden halten oder einbeinig.',
  },
  {
    id: 'vierfuessler', name: 'Vierfüßlerstand diagonal', icon: '🐕', cat: 'kraft', pos: 'boden', perSide: true,
    unit: 'wdh', base: [null, null, null, 6, 10],
    steps: ['In den Vierfüßlerstand gehen: Hände unter den Schultern, Knie unter der Hüfte.', 'Rechten Arm und linkes Bein gleichzeitig ausstrecken.', 'Kurz halten, zurück, Seite wechseln.'],
    tip: 'Der Rücken bleibt ruhig wie eine Tischplatte.',
    easier: 'Nur Arm oder nur Bein strecken.', harder: 'Gestreckt 3 Sekunden halten.',
  },

  // ---------- Ausdauer ----------
  {
    id: 'marschsitzend', name: 'Marschieren im Sitzen', icon: '🥁', cat: 'ausdauer', pos: 'sitzend',
    unit: 'sek', base: [45, 60, 60, 60, 60],
    steps: ['Aufrecht auf der Stuhlkante sitzen.', 'Abwechselnd die Füße anheben wie beim Marschieren.', 'Arme schwingen locker mit.'],
    tip: 'Tempo so wählen, dass du noch sprechen kannst („Sprechtest“).',
    easier: 'Nur die Fersen abwechselnd heben.', harder: 'Knie höher und Arme über den Kopf strecken.',
  },
  {
    id: 'boxensitzend', name: 'Boxen im Sitzen', icon: '🥊', cat: 'ausdauer', pos: 'sitzend',
    unit: 'sek', base: [30, 40, 45, 45, 60],
    steps: ['Aufrecht sitzen, Fäuste vor dem Kinn.', 'Abwechselnd locker nach vorne boxen.', 'Bauch leicht anspannen.'],
    tip: 'Macht Spaß mit Musik!',
    easier: 'Langsamer, kleinere Bewegung.', harder: 'Schneller boxen oder nach oben boxen.',
  },
  {
    id: 'gehen', name: 'Gehen / Spaziergang', icon: '🚶‍♀️', cat: 'ausdauer', pos: 'stehend',
    unit: 'sek', base: [180, 300, 600, 900, 1200],
    steps: ['Bequeme Schuhe an.', 'In angenehmem Tempo gehen – draußen, im Flur oder in der Wohnung.', 'Du solltest dabei noch reden können, aber etwas schneller atmen.'],
    tip: 'Gehen ist der beste Einstieg überhaupt: gelenkschonend und überall möglich.',
    easier: 'In der Wohnung hin und her gehen, Pausen sind erlaubt.', harder: 'Zügiger gehen oder leichte Steigungen einbauen.',
  },
  {
    id: 'langsamgehen', name: 'Langsam gehen (Erholung)', icon: '🐢', cat: 'ausdauer', pos: 'stehend', programOnly: true,
    unit: 'sek', base: [60, 60, 60, 60, 60],
    steps: ['Tempo deutlich herausnehmen, aber weitergehen.', 'Tief ein- und ausatmen, Schultern locker lassen.', 'Wenn nötig, kurz stehen bleiben – das ist in Ordnung.'],
    tip: 'Die Erholungsphasen sind Teil des Trainings, kein Versagen.',
    easier: 'Kurz stehen bleiben oder hinsetzen.', harder: 'Etwas zügiger erholen.',
  },
  {
    id: 'marschstehend', name: 'Marschieren auf der Stelle', icon: '🎶', cat: 'ausdauer', pos: 'stehend',
    unit: 'sek', base: [null, 45, 60, 90, 90],
    steps: ['Neben einen Stuhl stellen (zum Festhalten).', 'Auf der Stelle marschieren, Knie anheben.', 'Arme schwingen mit.'],
    tip: 'Gleichmäßig weiteratmen.',
    easier: 'Im Sitzen marschieren.', harder: 'Knie bis Hüfthöhe, schnelleres Tempo.',
  },
  {
    id: 'seitschritt', name: 'Seitschritte', icon: '💃', cat: 'ausdauer', pos: 'stehend',
    unit: 'sek', base: [null, 30, 45, 60, 60],
    steps: ['Füße zusammen.', 'Einen Schritt zur Seite, anderen Fuß nachziehen.', 'Hin und her, Arme schwingen mit.'],
    tip: 'Wie Tanzen – gerne mit Lieblingsmusik.',
    easier: 'Kleine Schritte, langsam.', harder: 'Größere Schritte, Arme über den Kopf führen.',
  },
  {
    id: 'schattenboxen', name: 'Schattenboxen', icon: '🥋', cat: 'ausdauer', pos: 'stehend',
    unit: 'sek', base: [null, 30, 45, 60, 60],
    steps: ['Leicht versetzt stehen, Knie locker.', 'Abwechselnd nach vorne boxen.', 'Dabei leicht in den Knien federn.'],
    tip: 'Nicht die Arme ganz durchstrecken.',
    easier: 'Boxen im Sitzen.', harder: 'Seitwärts tänzeln beim Boxen.',
  },
  {
    id: 'stepjack', name: 'Hampelmann ohne Sprung', icon: '⭐', cat: 'ausdauer', pos: 'stehend',
    unit: 'sek', base: [null, null, 30, 40, 45],
    steps: ['Füße zusammen, Arme unten.', 'Ein Bein zur Seite setzen und gleichzeitig beide Arme seitlich nach oben führen.', 'Zurück, dann die andere Seite.'],
    tip: 'Die gelenkschonende Version des Hampelmanns – kein Springen.',
    easier: 'Arme nur bis Schulterhöhe.', harder: 'Tempo erhöhen.',
  },
  {
    id: 'treppe', name: 'Treppensteigen', icon: '🪜', cat: 'ausdauer', pos: 'stehend',
    unit: 'sek', base: [null, null, 60, 120, 180],
    steps: ['An einer Treppe mit Geländer starten.', 'Ruhig hoch und wieder runter gehen.', 'Immer am Geländer festhalten.'],
    tip: 'Pausen auf dem Absatz sind völlig okay.',
    easier: 'Nur eine Stufe hoch und runter steigen.', harder: 'Zügiger gehen.',
  },
  {
    id: 'bergsteiger', name: 'Bergsteiger am Tisch', icon: '⛰️', cat: 'ausdauer', pos: 'stehend',
    unit: 'sek', base: [null, null, null, 30, 40],
    steps: ['Hände auf eine stabile Tischkante, Körper schräg.', 'Abwechselnd ein Knie Richtung Tisch ziehen.', 'Bauch bleibt angespannt.'],
    tip: 'Tempo so, dass die Form sauber bleibt.',
    easier: 'Langsames Marschieren in Stützposition.', harder: 'Schneller oder an einer niedrigeren Kante.',
  },

  // ---------- Gleichgewicht ----------
  {
    id: 'einbeinstand', name: 'Einbeinstand', icon: '🦩', cat: 'balance', pos: 'stehend', perSide: true,
    unit: 'sek', base: [10, 15, 20, 30, 30],
    steps: ['Neben einen Stuhl stellen, eine Hand an der Lehne.', 'Einen Fuß leicht vom Boden heben.', 'Ruhig halten, dann Seite wechseln.'],
    tip: 'Gleichgewicht schützt vor Stürzen und ist schnell trainierbar.',
    easier: 'Beide Hände an der Lehne, Fuß nur leicht anheben.', harder: 'Hand loslassen oder Augen kurz schließen.',
  },
  {
    id: 'tandemstand', name: 'Fuß-vor-Fuß-Stand', icon: '👣', cat: 'balance', pos: 'stehend',
    unit: 'sek', base: [null, 15, 20, 30, 30],
    steps: ['Neben einer Wand oder einem Stuhl stehen.', 'Einen Fuß direkt vor den anderen setzen (Ferse an Zehen).', 'Halten, nach der Hälfte die Füße tauschen.'],
    tip: 'Blick auf einen festen Punkt richten hilft.',
    easier: 'Füße leicht versetzt statt direkt hintereinander.', harder: 'Ohne Festhalten.',
  },

  // ---------- Entspannung ----------
  {
    id: 'bauchatmung', name: 'Bauchatmung', icon: '🌬️', cat: 'entspannung', pos: 'sitzend',
    unit: 'sek', base: [60, 60, 60, 90, 90],
    steps: ['Bequem sitzen, eine Hand auf den Bauch legen.', '4 Sekunden durch die Nase einatmen – der Bauch hebt sich.', '6 Sekunden durch den Mund ausatmen.'],
    tip: 'Längeres Aus- als Einatmen beruhigt den Körper.',
    easier: 'Einfach ruhig atmen und den Bauch spüren.', harder: 'Am Ende jeder Ausatmung 2 Sekunden Pause.',
  },
  {
    id: 'pmr', name: 'Anspannen & Loslassen', icon: '🧘', cat: 'entspannung', pos: 'sitzend',
    unit: 'sek', base: [60, 90, 90, 120, 120],
    steps: ['Bequem sitzen, Augen schließen, wenn du magst.', 'Nacheinander Hände, Arme, Schultern, Gesicht und Beine je 5 Sekunden fest anspannen.', 'Dann loslassen und 10 Sekunden die Entspannung spüren.'],
    tip: 'Kurzform der Progressiven Muskelentspannung – super vor dem Schlafen.',
    easier: 'Nur Hände und Schultern.', harder: 'Langsam alle Körperteile einzeln.',
  },
  {
    id: 'dankbarkeit', name: 'Tagesrückblick', icon: '✨', cat: 'entspannung', pos: 'sitzend',
    unit: 'sek', base: [60, 60, 60, 60, 60],
    steps: ['Ruhig hinsetzen und tief durchatmen.', 'An drei Dinge denken, die heute gut waren – auch kleine.', 'Dir selbst für die Bewegung heute danken.'],
    tip: 'Positive Gefühle helfen dem Gehirn, die neue Gewohnheit zu verankern.',
    easier: 'Eine Sache reicht.', harder: 'Die drei Dinge aufschreiben.',
  },
];

export const byId = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

/** Übungen, die für ein Level verfügbar sind. */
export function forLevel(level, cat) {
  return EXERCISES.filter((e) => !e.programOnly && e.base[level - 1] != null && (!cat || e.cat === cat));
}
