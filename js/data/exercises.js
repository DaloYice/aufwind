// Übungsbibliothek. base = Menge je Level 1–8 (null oder fehlend = für dieses Level nicht vorgesehen).
// unit: 'sek' (Zeit) oder 'wdh' (Wiederholungen). perSide: Menge gilt je Seite.
// jump: Sprungübung – erst ab Level 6 und im Profil abschaltbar. equip: braucht eines dieser Geräte (Profil-Ausstattung).
// Grundsatz für Level 1–2: gelenkschonend, keine Sprünge, keine Bodenübungen.

export const CATEGORIES = {
  mobil: { label: 'Beweglichkeit', icon: '🌀' },
  kraft: { label: 'Kraft', icon: '💪' },
  ausdauer: { label: 'Ausdauer', icon: '❤️' },
  balance: { label: 'Gleichgewicht', icon: '⚖️' },
  entspannung: { label: 'Entspannung', icon: '🌙' },
  beckenboden: { label: 'Beckenboden', icon: '🌸' },
};

export const POSITIONS = { sitzend: 'im Sitzen', stehend: 'im Stehen', boden: 'auf dem Boden', haengend: 'an der Stange' };

/** Ausstattung, die im Profil gewählt werden kann. */
export const EQUIPMENT = {
  kurzhantel: { label: 'Kurzhanteln', icon: '🏋️' },
  kettlebell: { label: 'Kettlebell', icon: '🔔' },
  stange: { label: 'Klimmzugstange', icon: '🧗' },
  band: { label: 'Widerstandsband', icon: '🎗️' },
};

export const EXERCISES = [
  // ---------- Beweglichkeit ----------
  {
    id: 'schulterkreisen', name: 'Schulterkreisen', icon: '🔄', cat: 'mobil', pos: 'sitzend',
    unit: 'sek', base: [30, 30, 40, 40, 45, 45, 45, 45],
    steps: ['Aufrecht sitzen oder stehen, Arme hängen locker.', 'Schultern langsam nach vorne, oben, hinten und unten kreisen.', 'Nach der Hälfte der Zeit die Richtung wechseln.'],
    tip: 'Ruhig weiteratmen – die Bewegung darf groß, aber nie ruckartig sein.',
    easier: 'Nur die Schultern hochziehen und fallen lassen.', harder: 'Arme seitlich ausstrecken und große Armkreise machen.',
  },
  {
    id: 'nacken', name: 'Nacken lockern', icon: '🙆', cat: 'mobil', pos: 'sitzend',
    unit: 'sek', base: [30, 30, 30, 40, 40, null, null, null],
    steps: ['Aufrecht sitzen, Blick nach vorne.', 'Kopf langsam zur rechten Schulter neigen, kurz halten.', 'Zur Mitte zurück und zur linken Seite neigen.'],
    tip: 'Nicht den Kopf kreisen lassen und nicht in den Nacken legen – nur sanft zur Seite.',
    easier: 'Kleinere Bewegung, nur bis ein leichtes Ziehen kommt.', harder: 'Mit der Hand ganz sanft nachhelfen.',
  },
  {
    id: 'fussgelenke', name: 'Füße kreisen', icon: '🦶', cat: 'mobil', pos: 'sitzend', perSide: true,
    unit: 'sek', base: [20, 20, 20, 30, 30, null, null, null],
    steps: ['Auf die Stuhlkante setzen, ein Bein leicht anheben oder die Ferse aufsetzen.', 'Den Fuß langsam in großen Kreisen bewegen.', 'Richtung wechseln, dann das andere Bein.'],
    tip: 'Gut für den Kreislauf in den Beinen – auch zwischendurch im Büro.',
    easier: 'Ferse am Boden lassen und nur die Zehen auf und ab wippen.', harder: 'Bein dabei gestreckt in der Luft halten.',
  },
  {
    id: 'rumpfdrehung', name: 'Sitzende Rumpfdrehung', icon: '↪️', cat: 'mobil', pos: 'sitzend', perSide: true,
    unit: 'wdh', base: [5, 6, 8, 10, 10, null, null, null],
    steps: ['Aufrecht sitzen, Füße fest am Boden.', 'Hände vor der Brust überkreuzen.', 'Oberkörper langsam nach rechts drehen, zurück zur Mitte, dann nach links.'],
    tip: 'Die Hüfte bleibt ruhig, nur der Oberkörper dreht.',
    easier: 'Hände auf die Oberschenkel legen und nur ein kleines Stück drehen.', harder: 'Arme seitlich ausstrecken.',
  },
  {
    id: 'seitneigung', name: 'Seitneigung', icon: '🌾', cat: 'mobil', pos: 'sitzend', perSide: true,
    unit: 'wdh', base: [5, 6, 8, 8, 10, null, null, null],
    steps: ['Aufrecht sitzen oder stehen.', 'Einen Arm über den Kopf strecken, die andere Hand ruht am Stuhl oder an der Hüfte.', 'Oberkörper sanft zur Seite neigen, zurück zur Mitte.'],
    tip: 'Nicht nach vorne kippen – stell dir vor, du stehst zwischen zwei Glasscheiben.',
    easier: 'Arm nicht über den Kopf, Hand rutscht nur am Bein entlang.', harder: 'Beide Arme über dem Kopf.',
  },
  {
    id: 'brustdehnung', name: 'Brustdehnung', icon: '🚪', cat: 'mobil', pos: 'stehend',
    unit: 'sek', base: [20, 20, 30, 30, 40, 40, 45, 45],
    steps: ['Seitlich in einen Türrahmen stellen.', 'Unterarm auf Schulterhöhe an den Rahmen legen.', 'Oberkörper sanft vom Arm wegdrehen, bis die Brust zieht. Halbe Zeit, dann Seite wechseln.'],
    tip: 'Hilft gegen die typische „Schreibtisch-Haltung“.',
    easier: 'Im Sitzen die Hände hinter dem Rücken verschränken und Schultern zurückziehen.', harder: 'Arm etwas höher ansetzen.',
  },
  {
    id: 'waden', name: 'Wadendehnung', icon: '🧱', cat: 'mobil', pos: 'stehend', perSide: true,
    unit: 'sek', base: [20, 20, 30, 30, 30, 30, 40, 40],
    steps: ['Mit beiden Händen an einer Wand abstützen.', 'Ein Bein einen großen Schritt nach hinten stellen, Ferse bleibt am Boden.', 'Vorderes Knie beugen, bis die hintere Wade zieht.'],
    tip: 'Ferse hinten wirklich am Boden lassen.',
    easier: 'Kleinerer Schritt.', harder: 'Größerer Schritt, Hüfte weiter nach vorne.',
  },

  // ---------- Kraft ----------
  {
    id: 'aufstehen', name: 'Aufstehen vom Stuhl', icon: '🪑', cat: 'kraft', pos: 'sitzend',
    unit: 'wdh', base: [3, 5, 8, 12, 15, null, null, null],
    steps: ['Auf die vordere Hälfte eines stabilen Stuhls (ohne Rollen!) setzen, Füße hüftbreit.', 'Oberkörper leicht nach vorne lehnen, Gewicht über die Füße.', 'Aufstehen, kurz stehen, langsam wieder hinsetzen.'],
    tip: 'Die wichtigste Alltagsübung überhaupt. Am Anfang dürfen die Hände auf den Oberschenkeln helfen.',
    easier: 'Mit den Händen an den Armlehnen abdrücken oder ein Kissen auf den Stuhl legen (höherer Sitz).', harder: 'Arme vor der Brust verschränken und sehr langsam hinsetzen.',
  },
  {
    id: 'kniehebensitzend', name: 'Knie heben im Sitzen', icon: '🦵', cat: 'kraft', pos: 'sitzend',
    unit: 'wdh', base: [6, 8, 10, 12, 15, null, null, null],
    steps: ['Aufrecht auf der Stuhlkante sitzen, an der Sitzfläche festhalten.', 'Abwechselnd ein Knie Richtung Brust heben.', 'Langsam wieder absetzen.'],
    tip: 'Kräftigt Bauch und Hüftbeuger, ganz ohne Gelenkbelastung.',
    easier: 'Nur die Ferse anheben, Zehen bleiben am Boden.', harder: 'Beide Knie gleichzeitig leicht anheben.',
  },
  {
    id: 'beinstrecken', name: 'Bein strecken im Sitzen', icon: '🦿', cat: 'kraft', pos: 'sitzend', perSide: true,
    unit: 'wdh', base: [6, 8, 10, 12, 15, null, null, null],
    steps: ['Aufrecht sitzen, Füße am Boden.', 'Ein Bein nach vorne strecken, bis es gerade ist, 2 Sekunden halten.', 'Langsam absenken.'],
    tip: 'Stärkt die Oberschenkel und entlastet so die Knie im Alltag.',
    easier: 'Bein nur halb strecken.', harder: 'Oben 5 Sekunden halten, Zehen zu dir ziehen.',
  },
  {
    id: 'wandliegestuetz', name: 'Liegestütz an der Wand', icon: '🧍', cat: 'kraft', pos: 'stehend',
    unit: 'wdh', base: [5, 8, 10, 12, 15, null, null, null],
    steps: ['Eine Armlänge vor einer Wand stehen.', 'Hände auf Schulterhöhe an die Wand legen.', 'Arme beugen, bis die Nase fast die Wand berührt, dann wegdrücken.'],
    tip: 'Körper bleibt gerade wie ein Brett.',
    easier: 'Näher an die Wand stellen.', harder: 'Weiter weg stellen oder an einer Tischkante üben.',
  },
  {
    id: 'fersenheben', name: 'Fersenheben', icon: '👠', cat: 'kraft', pos: 'stehend',
    unit: 'wdh', base: [6, 10, 12, 15, 20, null, null, null],
    steps: ['Hinter einen Stuhl stellen und an der Lehne festhalten.', 'Auf die Zehenspitzen hochdrücken.', 'Langsam wieder absenken.'],
    tip: 'Waden sind die „zweite Herzpumpe“ – gut für den Kreislauf.',
    easier: 'Im Sitzen die Fersen heben.', harder: 'Ohne Festhalten oder einbeinig.',
  },
  {
    id: 'seitbein', name: 'Bein seitlich heben', icon: '↔️', cat: 'kraft', pos: 'stehend', perSide: true,
    unit: 'wdh', base: [null, 6, 8, 10, 12, null, null, null],
    steps: ['Seitlich hinter einen Stuhl stellen und festhalten.', 'Gestrecktes Bein langsam zur Seite heben.', 'Langsam zurückführen.'],
    tip: 'Kräftigt die Hüfte und verbessert die Standsicherheit.',
    easier: 'Nur wenige Zentimeter heben.', harder: 'Oben 3 Sekunden halten.',
  },
  {
    id: 'tischliegestuetz', name: 'Liegestütz am Tisch', icon: '🍽️', cat: 'kraft', pos: 'stehend',
    unit: 'wdh', base: [null, null, 6, 10, 12, null, null, null],
    steps: ['Hände schulterbreit auf eine stabile Tisch- oder Arbeitsplattenkante.', 'Füße nach hinten, Körper gerade.', 'Brust zur Kante senken, kraftvoll wegdrücken.'],
    tip: 'Tisch muss fest stehen und darf nicht rutschen.',
    easier: 'An der Wand üben.', harder: 'Auf den Knien am Boden.',
  },
  {
    id: 'tischplank', name: 'Unterarmstütz am Tisch', icon: '🪵', cat: 'kraft', pos: 'stehend',
    unit: 'sek', base: [null, null, 15, 25, 40, null, null, null],
    steps: ['Unterarme auf einen stabilen Tisch legen.', 'Füße nach hinten setzen, bis der Körper eine schräge Linie bildet.', 'Bauch fest anspannen und halten.'],
    tip: 'Weiteratmen! Lieber kürzer und sauber.',
    easier: 'Hände an die Wand, Füße näher heran.', harder: 'Unterarmstütz auf dem Boden.',
  },
  {
    id: 'kniebeuge', name: 'Kniebeuge', icon: '🏋️', cat: 'kraft', pos: 'stehend',
    unit: 'wdh', base: [null, null, 8, 12, 15, 20, 25, 30],
    steps: ['Füße hüftbreit, Arme nach vorne.', 'Po nach hinten schieben, als würdest du dich auf einen Stuhl setzen.', 'Knie zeigen Richtung Zehen. Wieder aufrichten.'],
    tip: 'Ein Stuhl hinter dir gibt Sicherheit – kurz antippen und wieder hoch.',
    easier: 'Aufstehen vom Stuhl.', harder: 'Unten 2 Sekunden halten.',
  },
  {
    id: 'ausfallschritt', name: 'Ausfallschritt rückwärts', icon: '🚶', cat: 'kraft', pos: 'stehend', perSide: true,
    unit: 'wdh', base: [null, null, null, 6, 10, 12, 14, 16],
    steps: ['Aufrecht stehen, bei Bedarf an einer Stuhllehne festhalten.', 'Großen Schritt nach hinten machen und beide Knie beugen.', 'Mit dem vorderen Bein zurück in den Stand drücken.'],
    tip: 'Rückwärts ist knieschonender als vorwärts.',
    easier: 'Kleinerer Schritt, nicht so tief.', harder: 'Ohne Festhalten, langsam ausführen.',
  },
  {
    id: 'bruecke', name: 'Becken heben', icon: '🌉', cat: 'kraft', pos: 'boden',
    unit: 'wdh', base: [null, null, null, 10, 15, 20, null, null],
    steps: ['Auf den Rücken legen, Knie gebeugt, Füße hüftbreit.', 'Po anspannen und das Becken heben, bis Knie, Hüfte und Schultern eine Linie bilden.', 'Langsam absenken.'],
    tip: 'Stärkt Po und unteren Rücken – gut gegen Rückenschmerzen.',
    easier: 'Becken nur ein kleines Stück heben.', harder: 'Oben 3 Sekunden halten oder einbeinig.',
  },
  {
    id: 'vierfuessler', name: 'Vierfüßlerstand diagonal', icon: '🐕', cat: 'kraft', pos: 'boden', perSide: true,
    unit: 'wdh', base: [null, null, null, 6, 10, null, null, null],
    steps: ['In den Vierfüßlerstand gehen: Hände unter den Schultern, Knie unter der Hüfte.', 'Rechten Arm und linkes Bein gleichzeitig ausstrecken.', 'Kurz halten, zurück, Seite wechseln.'],
    tip: 'Der Rücken bleibt ruhig wie eine Tischplatte.',
    easier: 'Nur Arm oder nur Bein strecken.', harder: 'Gestreckt 3 Sekunden halten.',
  },

  // ---------- Ausdauer ----------
  {
    id: 'marschsitzend', name: 'Marschieren im Sitzen', icon: '🥁', cat: 'ausdauer', pos: 'sitzend',
    unit: 'sek', base: [45, 60, 60, 60, 60, null, null, null],
    steps: ['Aufrecht auf der Stuhlkante sitzen.', 'Abwechselnd die Füße anheben wie beim Marschieren.', 'Arme schwingen locker mit.'],
    tip: 'Tempo so wählen, dass du noch sprechen kannst („Sprechtest“).',
    easier: 'Nur die Fersen abwechselnd heben.', harder: 'Knie höher und Arme über den Kopf strecken.',
  },
  {
    id: 'boxensitzend', name: 'Boxen im Sitzen', icon: '🥊', cat: 'ausdauer', pos: 'sitzend',
    unit: 'sek', base: [30, 40, 45, 45, 60, null, null, null],
    steps: ['Aufrecht sitzen, Fäuste vor dem Kinn.', 'Abwechselnd locker nach vorne boxen.', 'Bauch leicht anspannen.'],
    tip: 'Macht Spaß mit Musik!',
    easier: 'Langsamer, kleinere Bewegung.', harder: 'Schneller boxen oder nach oben boxen.',
  },
  {
    id: 'gehen', name: 'Gehen / Spaziergang', icon: '🚶‍♀️', cat: 'ausdauer', pos: 'stehend',
    unit: 'sek', base: [180, 300, 600, 900, 1200, null, null, null],
    steps: ['Bequeme Schuhe an.', 'In angenehmem Tempo gehen – draußen, im Flur oder in der Wohnung.', 'Du solltest dabei noch reden können, aber etwas schneller atmen.'],
    tip: 'Gehen ist der beste Einstieg überhaupt: gelenkschonend und überall möglich.',
    easier: 'In der Wohnung hin und her gehen, Pausen sind erlaubt.', harder: 'Zügiger gehen oder leichte Steigungen einbauen.',
  },
  {
    id: 'langsamgehen', name: 'Langsam gehen (Erholung)', icon: '🐢', cat: 'ausdauer', pos: 'stehend', programOnly: true,
    unit: 'sek', base: [60, 60, 60, 60, 60, 60, 60, 60],
    steps: ['Tempo deutlich herausnehmen, aber weitergehen.', 'Tief ein- und ausatmen, Schultern locker lassen.', 'Wenn nötig, kurz stehen bleiben – das ist in Ordnung.'],
    tip: 'Die Erholungsphasen sind Teil des Trainings, kein Versagen.',
    easier: 'Kurz stehen bleiben oder hinsetzen.', harder: 'Etwas zügiger erholen.',
  },
  {
    id: 'marschstehend', name: 'Marschieren auf der Stelle', icon: '🎶', cat: 'ausdauer', pos: 'stehend',
    unit: 'sek', base: [null, 45, 60, 90, 90, null, null, null],
    steps: ['Neben einen Stuhl stellen (zum Festhalten).', 'Auf der Stelle marschieren, Knie anheben.', 'Arme schwingen mit.'],
    tip: 'Gleichmäßig weiteratmen.',
    easier: 'Im Sitzen marschieren.', harder: 'Knie bis Hüfthöhe, schnelleres Tempo.',
  },
  {
    id: 'seitschritt', name: 'Seitschritte', icon: '💃', cat: 'ausdauer', pos: 'stehend',
    unit: 'sek', base: [null, 30, 45, 60, 60, null, null, null],
    steps: ['Füße zusammen.', 'Einen Schritt zur Seite, anderen Fuß nachziehen.', 'Hin und her, Arme schwingen mit.'],
    tip: 'Wie Tanzen – gerne mit Lieblingsmusik.',
    easier: 'Kleine Schritte, langsam.', harder: 'Größere Schritte, Arme über den Kopf führen.',
  },
  {
    id: 'schattenboxen', name: 'Schattenboxen', icon: '🥋', cat: 'ausdauer', pos: 'stehend',
    unit: 'sek', base: [null, 30, 45, 60, 60, 60, 75, 90],
    steps: ['Leicht versetzt stehen, Knie locker.', 'Abwechselnd nach vorne boxen.', 'Dabei leicht in den Knien federn.'],
    tip: 'Nicht die Arme ganz durchstrecken.',
    easier: 'Boxen im Sitzen.', harder: 'Seitwärts tänzeln beim Boxen.',
  },
  {
    id: 'stepjack', name: 'Hampelmann ohne Sprung', icon: '⭐', cat: 'ausdauer', pos: 'stehend',
    unit: 'sek', base: [null, null, 30, 40, 45, null, null, null],
    steps: ['Füße zusammen, Arme unten.', 'Ein Bein zur Seite setzen und gleichzeitig beide Arme seitlich nach oben führen.', 'Zurück, dann die andere Seite.'],
    tip: 'Die gelenkschonende Version des Hampelmanns – kein Springen.',
    easier: 'Arme nur bis Schulterhöhe.', harder: 'Tempo erhöhen.',
  },
  {
    id: 'treppe', name: 'Treppensteigen', icon: '🪜', cat: 'ausdauer', pos: 'stehend',
    unit: 'sek', base: [null, null, 60, 120, 180, 240, 300, 360],
    steps: ['An einer Treppe mit Geländer starten.', 'Ruhig hoch und wieder runter gehen.', 'Immer am Geländer festhalten.'],
    tip: 'Pausen auf dem Absatz sind völlig okay.',
    easier: 'Nur eine Stufe hoch und runter steigen.', harder: 'Zügiger gehen.',
  },
  {
    id: 'bergsteiger', name: 'Bergsteiger am Tisch', icon: '⛰️', cat: 'ausdauer', pos: 'stehend',
    unit: 'sek', base: [null, null, null, 30, 40, null, null, null],
    steps: ['Hände auf eine stabile Tischkante, Körper schräg.', 'Abwechselnd ein Knie Richtung Tisch ziehen.', 'Bauch bleibt angespannt.'],
    tip: 'Tempo so, dass die Form sauber bleibt.',
    easier: 'Langsames Marschieren in Stützposition.', harder: 'Schneller oder an einer niedrigeren Kante.',
  },

  // ---------- Gleichgewicht ----------
  {
    id: 'einbeinstand', name: 'Einbeinstand', icon: '🦩', cat: 'balance', pos: 'stehend', perSide: true,
    unit: 'sek', base: [10, 15, 20, 30, 30, 45, 60, 60],
    steps: ['Neben einen Stuhl stellen, eine Hand an der Lehne.', 'Einen Fuß leicht vom Boden heben.', 'Ruhig halten, dann Seite wechseln.'],
    tip: 'Gleichgewicht schützt vor Stürzen und ist schnell trainierbar.',
    easier: 'Beide Hände an der Lehne, Fuß nur leicht anheben.', harder: 'Hand loslassen oder Augen kurz schließen.',
  },
  {
    id: 'tandemstand', name: 'Fuß-vor-Fuß-Stand', icon: '👣', cat: 'balance', pos: 'stehend',
    unit: 'sek', base: [null, 15, 20, 30, 30, null, null, null],
    steps: ['Neben einer Wand oder einem Stuhl stehen.', 'Einen Fuß direkt vor den anderen setzen (Ferse an Zehen).', 'Halten, nach der Hälfte die Füße tauschen.'],
    tip: 'Blick auf einen festen Punkt richten hilft.',
    easier: 'Füße leicht versetzt statt direkt hintereinander.', harder: 'Ohne Festhalten.',
  },

  // ---------- Entspannung ----------
  {
    id: 'bauchatmung', name: 'Bauchatmung', icon: '🌬️', cat: 'entspannung', pos: 'sitzend',
    unit: 'sek', base: [60, 60, 60, 90, 90, 60, 60, 60],
    steps: ['Bequem sitzen, eine Hand auf den Bauch legen.', '4 Sekunden durch die Nase einatmen – der Bauch hebt sich.', '6 Sekunden durch den Mund ausatmen.'],
    tip: 'Längeres Aus- als Einatmen beruhigt den Körper.',
    easier: 'Einfach ruhig atmen und den Bauch spüren.', harder: 'Am Ende jeder Ausatmung 2 Sekunden Pause.',
  },
  {
    id: 'pmr', name: 'Anspannen & Loslassen', icon: '🧘', cat: 'entspannung', pos: 'sitzend',
    unit: 'sek', base: [60, 90, 90, 120, 120, 90, 90, 90],
    steps: ['Bequem sitzen, Augen schließen, wenn du magst.', 'Nacheinander Hände, Arme, Schultern, Gesicht und Beine je 5 Sekunden fest anspannen.', 'Dann loslassen und 10 Sekunden die Entspannung spüren.'],
    tip: 'Kurzform der Progressiven Muskelentspannung – super vor dem Schlafen.',
    easier: 'Nur Hände und Schultern.', harder: 'Langsam alle Körperteile einzeln.',
  },
  {
    id: 'dankbarkeit', name: 'Tagesrückblick', icon: '✨', cat: 'entspannung', pos: 'sitzend',
    unit: 'sek', base: [60, 60, 60, 60, 60, 60, 60, 60],
    steps: ['Ruhig hinsetzen und tief durchatmen.', 'An drei Dinge denken, die heute gut waren – auch kleine.', 'Dir selbst für die Bewegung heute danken.'],
    tip: 'Positive Gefühle helfen dem Gehirn, die neue Gewohnheit zu verankern.',
    easier: 'Eine Sache reicht.', harder: 'Die drei Dinge aufschreiben.',
  },
  // ---------- Kraft für Fortgeschrittene (ab v0.7.0, ohne Sprünge) ----------
  {
    id: 'bodenliegestuetz', name: 'Liegestütz am Boden', icon: '💪', cat: 'kraft', pos: 'boden',
    unit: 'wdh', base: [null, null, null, 5, 10, 15, 20, 25],
    steps: ['Hände etwas breiter als schulterbreit, Körper bildet eine gerade Linie.', 'Brust langsam Richtung Boden senken, Ellbogen schräg nach hinten.', 'Kraftvoll wieder hochdrücken, Bauch bleibt fest.'],
    tip: 'Lieber weniger saubere Wiederholungen als viele mit durchhängendem Rücken.',
    easier: 'Auf den Knien oder am Tisch.', harder: 'Unten 2 Sekunden halten.',
  },
  {
    id: 'bodenplank', name: 'Unterarmstütz am Boden', icon: '🪵', cat: 'kraft', pos: 'boden',
    unit: 'sek', base: [null, null, null, 20, 40, 60, 75, 90],
    steps: ['Unterarme unter den Schultern, Beine gestreckt, auf den Zehen.', 'Körper bildet eine Linie von Kopf bis Ferse.', 'Bauch und Po anspannen, ruhig weiteratmen.'],
    tip: 'Blick zum Boden, der Nacken bleibt lang.',
    easier: 'Knie am Boden lassen.', harder: 'Abwechselnd ein Bein kurz anheben.',
  },
  {
    id: 'seitstuetz', name: 'Seitstütz', icon: '📐', cat: 'kraft', pos: 'boden', perSide: true,
    unit: 'sek', base: [null, null, null, 15, 25, 35, 45, 60],
    steps: ['Auf die Seite legen, Ellbogen unter der Schulter.', 'Becken anheben, bis der Körper eine Linie bildet.', 'Halten, ruhig atmen – dann Seite wechseln.'],
    tip: 'Das Becken nicht nach hinten kippen lassen.',
    easier: 'Untere Knie am Boden lassen.', harder: 'Oberen Arm zur Decke strecken.',
  },
  {
    id: 'wandsitzen', name: 'Wandsitzen', icon: '🧱', cat: 'kraft', pos: 'stehend',
    unit: 'sek', base: [null, null, 15, 25, 40, 60, 75, 90],
    steps: ['Mit dem Rücken an eine Wand lehnen, Füße einen Schritt vor.', 'An der Wand herunterrutschen, bis die Knie etwa rechtwinklig sind.', 'Halten, dann langsam wieder hochschieben.'],
    tip: 'Knie bleiben über den Fersen, nicht vor den Zehen.',
    easier: 'Nur halb so tief gehen.', harder: 'Länger halten oder Fersen leicht anheben.',
  },
  {
    id: 'ausfallvorwaerts', name: 'Ausfallschritt vorwärts', icon: '🦵', cat: 'kraft', pos: 'stehend', perSide: true,
    unit: 'wdh', base: [null, null, null, 6, 10, 12, 14, 16],
    steps: ['Aufrecht stehen, Hände an die Hüfte.', 'Großen Schritt nach vorne, hinteres Knie Richtung Boden senken.', 'Mit dem vorderen Bein kraftvoll zurück in den Stand drücken.'],
    tip: 'Oberkörper bleibt aufrecht, vorderes Knie über dem Fuß.',
    easier: 'Ausfallschritt rückwärts oder mit Stuhl zum Festhalten.', harder: 'Unten kurz halten.',
  },
  {
    id: 'superman', name: 'Superman', icon: '🦸', cat: 'kraft', pos: 'boden',
    unit: 'wdh', base: [null, null, null, 8, 12, 15, 18, 20],
    steps: ['Auf den Bauch legen, Arme nach vorne gestreckt.', 'Arme, Brust und Beine gleichzeitig leicht anheben.', '2 Sekunden halten, langsam ablegen.'],
    tip: 'Blick zum Boden – nicht den Kopf in den Nacken legen.',
    easier: 'Nur Arme oder nur Beine anheben.', harder: 'Oben 5 Sekunden halten.',
  },
  {
    id: 'kniebeugehalten', name: 'Kniebeuge halten', icon: '⏳', cat: 'kraft', pos: 'stehend',
    unit: 'sek', base: [null, null, null, 20, 30, 45, 60, 75],
    steps: ['Füße hüftbreit, Arme nach vorne.', 'In die Kniebeuge gehen, so tief es angenehm ist.', 'Unten halten und ruhig weiteratmen.'],
    tip: 'Gewicht auf den Fersen, Brust bleibt offen.',
    easier: 'Weniger tief oder an der Wand (Wandsitzen).', harder: 'Am Ende 5 kleine Wipper nach oben und unten.',
  },

  // ---------- Beckenboden (Frauen und Männer) ----------
  {
    id: 'bb_wahrnehmen', name: 'Beckenboden spüren', icon: '🌸', cat: 'beckenboden', pos: 'sitzend',
    unit: 'sek', base: [60, 60, 60, 60, 60, 60, 60, 60], cue: [['Anspannen', 4], ['Lösen', 6]],
    steps: ['Aufrecht auf die Stuhlkante setzen, Füße hüftbreit.', 'Stell dir vor, du hältst Wind und Wasser zurück – Harnröhre, Scheide bzw. Hoden und After ziehen sanft nach innen-oben.', 'Wieder ganz lösen. Po, Bauch und Beine bleiben dabei locker.'],
    tip: 'Ein festes Polster oder ein eingerolltes Handtuch unter dem Damm hilft beim Spüren.',
    easier: 'Nur auf das Lösen achten – das ist genauso wichtig.', harder: 'Mit geschlossenen Augen und ganz ohne Mitspannen von Po und Bauch.',
  },
  {
    id: 'bb_atmung', name: 'Beckenboden-Atmung', icon: '🌬️', cat: 'beckenboden', pos: 'sitzend',
    unit: 'sek', base: [60, 60, 90, 90, 120, 120, 120, 120], cue: [['Einatmen – lösen', 4], ['Ausatmen – anspannen', 6]],
    steps: ['Aufrecht sitzen, eine Hand auf den Bauch.', 'Beim Einatmen weitet sich der Bauch, der Beckenboden lässt los.', 'Beim Ausatmen den Beckenboden sanft nach innen-oben ziehen.'],
    tip: 'Nie die Luft anhalten – der Atem trägt die Übung.',
    easier: 'Nur atmen und das Weiten beim Einatmen spüren.', harder: 'Beim Ausatmen zusätzlich den unteren Bauch leicht nach innen ziehen.',
  },
  {
    id: 'bb_schnell', name: 'Schnelle Impulse', icon: '⚡', cat: 'beckenboden', pos: 'sitzend',
    unit: 'sek', base: [30, 30, 40, 45, 60, 60, 60, 60], cue: [['Kurz anspannen', 1], ['Locker', 2]],
    steps: ['Aufrecht sitzen.', 'Den Beckenboden kurz und kräftig anspannen …', '… und sofort wieder ganz locker lassen.'],
    tip: 'Diese schnelle Reaktion schützt beim Husten, Niesen und Lachen.',
    easier: 'Langsamer: 2 Sekunden Pause zwischen den Impulsen.', harder: 'Im Stehen üben.',
  },
  {
    id: 'bb_halten', name: 'Anspannen und halten', icon: '⏳', cat: 'beckenboden', pos: 'sitzend',
    unit: 'sek', base: [60, 60, 90, 90, 120, 120, 120, 120], cue: [['Anspannen und halten', 5], ['Lösen', 5]],
    steps: ['Aufrecht sitzen, ruhig atmen.', 'Den Beckenboden anspannen und die Spannung halten – dabei weiteratmen.', 'Genauso lange wieder ganz lösen.'],
    tip: 'Lieber sanft und sauber halten als fest und mit angehaltenem Atem.',
    easier: 'Nur 3 Sekunden halten.', harder: 'Im Stehen oder 8–10 Sekunden halten.',
  },
  {
    id: 'bb_stehen', name: 'Beckenboden im Stehen', icon: '🧍', cat: 'beckenboden', pos: 'stehend',
    unit: 'sek', base: [null, 60, 60, 90, 90, 90, 90, 90], cue: [['Anspannen', 5], ['Lösen', 5]],
    steps: ['Hüftbreit stehen, Knie locker, Hände an die Hüfte.', 'Beckenboden anspannen, ohne den Po zusammenzukneifen.', 'Lösen und kurz nachspüren.'],
    tip: 'Im Alltag üben: z. B. beim Zähneputzen oder an der Kasse.',
    easier: 'Im Sitzen üben.', harder: 'Auf einem Bein stehen und dabei anspannen.',
  },
  {
    id: 'bb_ruecken', name: 'Beckenboden in Rückenlage', icon: '🛏️', cat: 'beckenboden', pos: 'boden',
    unit: 'sek', base: [null, null, 60, 90, 90, 90, 90, 90], cue: [['Ausatmen – anspannen, Becken leicht heben', 5], ['Einatmen – ablegen und lösen', 5]],
    steps: ['Auf den Rücken legen, Beine aufgestellt, Arme neben dem Körper.', 'Ausatmen, Beckenboden anspannen und das Becken ein kleines Stück anheben.', 'Einatmen, Becken ablegen und den Beckenboden ganz lösen.'],
    tip: 'Diese Lage entlastet den Beckenboden – gut zum Üben, wenn er noch schwach ist.',
    easier: 'Becken liegen lassen, nur anspannen und lösen.', harder: 'Oben 3 Atemzüge halten.',
  },
  // ---------- Ab v0.8.0: Fitness-Stufen 6–8, Sprünge (jump), Geräte (equip: eines davon reicht) ----------
  {
    id: 'armschwung', name: 'Arm- und Beinschwünge', icon: '🌪️', cat: 'mobil', pos: 'stehend',
    unit: 'sek', base: [null, null, 30, 30, 40, 40, 45, 45],
    steps: ['Locker stehen, Arme kreisen groß vor und zurück.', 'Dann ein Bein locker vor und zurück schwingen, Hand an der Wand.', 'Seite wechseln – Tempo langsam steigern.'],
    tip: 'Dynamisch aufwärmen statt lange halten – so werden Muskeln und Gelenke bereit für Tempo.',
    easier: 'Nur die Arme kreisen.', harder: 'Größere Schwünge und zügigeres Tempo.',
  },
  {
    id: 'hueftoeffner', name: 'Hüftöffner im Ausfallschritt', icon: '🧘', cat: 'mobil', pos: 'stehend', perSide: true,
    unit: 'sek', base: [null, null, null, 20, 30, 30, 30, 30],
    steps: ['Großer Ausfallschritt nach vorne, hinteres Bein lang.', 'Becken nach vorne-unten schieben, Oberkörper aufrecht.', 'Vorne die Hand innen neben den Fuß, dann den anderen Arm zur Decke drehen.'],
    tip: 'Langes Sitzen verkürzt die Hüftbeuger – das hier ist der Gegenspieler.',
    easier: 'Hinteres Knie auf ein Kissen ablegen.', harder: 'Mit der Drehung zur Decke ein paar Mal wippen.',
  },
  {
    id: 'schultertippen', name: 'Schultertippen im Stütz', icon: '👋', cat: 'kraft', pos: 'boden',
    unit: 'wdh', base: [null, null, null, null, 12, 16, 20, 24],
    steps: ['Hoher Liegestütz, Füße etwas breiter als hüftbreit.', 'Abwechselnd mit einer Hand die gegenüberliegende Schulter antippen.', 'Becken bleibt ruhig – kein Schaukeln.'],
    tip: 'Je breiter die Füße, desto leichter. Zähle beide Seiten zusammen.',
    easier: 'Auf den Knien.', harder: 'Füße eng zusammen.',
  },
  {
    id: 'stuhldips', name: 'Trizeps-Dips am Stuhl', icon: '🪑', cat: 'kraft', pos: 'stehend',
    unit: 'wdh', base: [null, null, null, 6, 8, 12, 15, 18],
    steps: ['Hände hinter dir auf die Sitzkante eines stabilen Stuhls, Finger nach vorne.', 'Ellbogen nach hinten beugen und den Po Richtung Boden senken.', 'Kraftvoll hochdrücken, Schultern weg von den Ohren.'],
    tip: 'Stuhl an die Wand stellen, damit er nicht wegrutscht.',
    easier: 'Füße näher heranstellen, Knie gebeugt.', harder: 'Beine gestreckt oder Füße erhöht.',
  },
  {
    id: 'einbeinbruecke', name: 'Einbeiniges Beckenheben', icon: '🌉', cat: 'kraft', pos: 'boden', perSide: true,
    unit: 'wdh', base: [null, null, null, null, 8, 10, 12, 15],
    steps: ['Rückenlage, ein Fuß aufgestellt, das andere Bein gestreckt in der Luft.', 'Über die Ferse das Becken hochdrücken, bis Knie, Hüfte und Schulter eine Linie bilden.', 'Kurz halten, langsam ablegen.'],
    tip: 'Das Becken bleibt waagerecht – nicht zur Seite kippen lassen.',
    easier: 'Mit beiden Beinen (Becken heben).', harder: 'Oben 3 Sekunden halten.',
  },
  {
    id: 'diamantliegestuetz', name: 'Diamant-Liegestütz', icon: '💎', cat: 'kraft', pos: 'boden',
    unit: 'wdh', base: [null, null, null, null, null, 8, 12, 15],
    steps: ['Hände unter der Brust, Daumen und Zeigefinger formen eine Raute.', 'Brust kontrolliert zu den Händen senken, Ellbogen eng am Körper.', 'Hochdrücken, Körper bleibt eine Linie.'],
    tip: 'Fordert vor allem den Trizeps – sauber vor schnell.',
    easier: 'Auf den Knien oder normaler Liegestütz.', harder: 'Unten 2 Sekunden halten.',
  },
  {
    id: 'pikeliegestuetz', name: 'Pike-Liegestütz', icon: '🔺', cat: 'kraft', pos: 'boden',
    unit: 'wdh', base: [null, null, null, null, null, 6, 8, 12],
    steps: ['Aus dem Liegestütz das Becken hoch schieben – der Körper bildet ein umgedrehtes V.', 'Kopf zwischen den Händen Richtung Boden senken.', 'Zurück hochdrücken – trainiert die Schultern wie Überkopfdrücken.'],
    tip: 'Je näher die Füße an den Händen, desto schwerer.',
    easier: 'Weniger tief absenken.', harder: 'Füße auf einen Stuhl stellen.',
  },
  {
    id: 'archerliegestuetz', name: 'Archer-Liegestütz', icon: '🏹', cat: 'kraft', pos: 'boden', perSide: true,
    unit: 'wdh', base: [null, null, null, null, null, null, 4, 6],
    steps: ['Hände sehr breit aufsetzen.', 'Zu einer Seite absenken, der andere Arm bleibt fast gestreckt.', 'Hochdrücken, dann zur anderen Seite.'],
    tip: 'Die Vorstufe zum einarmigen Liegestütz.',
    easier: 'Normale Liegestütze mit breiten Händen.', harder: 'Unten kurz halten.',
  },
  {
    id: 'bulgarisch', name: 'Bulgarische Kniebeuge', icon: '🦵', cat: 'kraft', pos: 'stehend', perSide: true,
    unit: 'wdh', base: [null, null, null, null, 8, 10, 12, 15],
    steps: ['Mit dem Rücken zu einem Stuhl stehen, einen Fußrücken hinten auf die Sitzfläche legen.', 'Vorderes Knie beugen und gerade nach unten sinken.', 'Über die vordere Ferse hochdrücken.'],
    tip: 'Eine der besten Beinübungen ohne Geräte – brennt ordentlich.',
    easier: 'Hinteren Fuß auf den Boden (Ausfallschritt).', harder: 'Unten 2 Sekunden halten oder Gewicht in die Hände.',
  },
  {
    id: 'pistolstuhl', name: 'Einbeinige Kniebeuge zum Stuhl', icon: '🎯', cat: 'kraft', pos: 'stehend', perSide: true,
    unit: 'wdh', base: [null, null, null, null, null, 5, 7, 10],
    steps: ['Vor einem Stuhl stehen, ein Bein nach vorne anheben.', 'Auf dem Standbein langsam Richtung Sitzfläche sinken, Arme nach vorne.', 'Kurz antippen und auf einem Bein wieder hochdrücken.'],
    tip: 'Langsam runter ist der Trainingsreiz – nicht auf den Stuhl fallen lassen.',
    easier: 'Mit beiden Beinen hochdrücken.', harder: 'Niedrigere Sitzfläche oder ganz ohne Stuhl.',
  },
  {
    id: 'hollowhold', name: 'Hollow Hold', icon: '🍌', cat: 'kraft', pos: 'boden',
    unit: 'sek', base: [null, null, null, null, null, 20, 30, 40],
    steps: ['Rückenlage, unteren Rücken fest in den Boden drücken.', 'Schultern und gestreckte Beine leicht anheben, Arme nach hinten.', 'Wie eine Banane halten, ruhig atmen.'],
    tip: 'Hebt sich der untere Rücken, die Beine höher nehmen.',
    easier: 'Knie anziehen, Arme nach vorne.', harder: 'Beine und Arme tiefer.',
  },
  {
    id: 'klappmesser', name: 'Klappmesser', icon: '✂️', cat: 'kraft', pos: 'boden',
    unit: 'wdh', base: [null, null, null, null, null, 10, 12, 15],
    steps: ['Rückenlage, Arme hinter dem Kopf gestreckt.', 'Gleichzeitig Oberkörper und gestreckte Beine anheben, Hände Richtung Füße.', 'Kontrolliert wieder ablegen.'],
    tip: 'Ausatmen beim Hochklappen.',
    easier: 'Knie dabei anziehen.', harder: 'Unten nicht ganz ablegen.',
  },
  {
    id: 'hampelmann', name: 'Hampelmann', icon: '⭐', cat: 'ausdauer', pos: 'stehend', jump: true,
    unit: 'sek', base: [null, null, null, null, null, 40, 45, 60],
    steps: ['Aufrecht stehen, Arme seitlich.', 'Springend die Beine öffnen und die Arme über den Kopf führen.', 'Zurückspringen, locker auf den Fußballen landen.'],
    tip: 'Der Klassiker für den Puls – leise und federnd landen.',
    easier: 'Hampelmann ohne Sprung (Schritt zur Seite).', harder: 'Schneller oder mit tiefer Hocke.',
  },
  {
    id: 'kniehebenlauf', name: 'Skippings', icon: '🏃', cat: 'ausdauer', pos: 'stehend', jump: true,
    unit: 'sek', base: [null, null, null, null, null, 30, 40, 45],
    steps: ['Laufen auf der Stelle.', 'Die Knie bis auf Hüfthöhe ziehen.', 'Arme kräftig mitschwingen, auf den Fußballen bleiben.'],
    tip: 'Hohe Frequenz schlägt hohe Knie – Tempo halten.',
    easier: 'Marschieren auf der Stelle.', harder: 'Letzte 10 Sekunden Vollgas.',
  },
  {
    id: 'burpee', name: 'Burpee', icon: '🔥', cat: 'ausdauer', pos: 'boden', jump: true,
    unit: 'wdh', base: [null, null, null, null, null, 8, 12, 15],
    steps: ['Aus dem Stand in die Hocke, Hände auf den Boden.', 'Beine nach hinten in den Liegestütz springen, wieder heranspringen.', 'Explosiv nach oben springen, Arme über den Kopf.'],
    tip: 'Ganzkörper-Turbo. Lieber gleichmäßiges Tempo als am Anfang alles verschießen.',
    easier: 'Beine heraus- und hereinsteigen, ohne Sprung.', harder: 'Mit Liegestütz unten.',
  },
  {
    id: 'sprungkniebeuge', name: 'Sprungkniebeuge', icon: '🚀', cat: 'kraft', pos: 'stehend', jump: true,
    unit: 'wdh', base: [null, null, null, null, null, 10, 12, 15],
    steps: ['Schulterbreit stehen, in die Kniebeuge sinken.', 'Explosiv nach oben abspringen.', 'Weich landen und direkt in die nächste Kniebeuge.'],
    tip: 'Leise landen = gute Technik. Knie zeigen in Richtung Zehen.',
    easier: 'Kniebeuge mit Fersenheben statt Sprung.', harder: 'Unten kurz halten, dann springen.',
  },
  {
    id: 'skater', name: 'Eisschnellläufer', icon: '⛸️', cat: 'ausdauer', pos: 'stehend', jump: true,
    unit: 'sek', base: [null, null, null, null, null, 30, 40, 45],
    steps: ['Seitlich von einem Bein aufs andere springen.', 'Das freie Bein schräg hinter dem Standbein absetzen.', 'Arme schwingen mit wie beim Eisschnelllauf.'],
    tip: 'Landung stabil halten, bevor du zurückspringst.',
    easier: 'Seitlich schreiten statt springen.', harder: 'Weiter springen und tiefer landen.',
  },
  {
    id: 'sprungausfall', name: 'Ausfallschritt-Sprünge', icon: '⚡', cat: 'kraft', pos: 'stehend', perSide: true, jump: true,
    unit: 'wdh', base: [null, null, null, null, null, null, 6, 8],
    steps: ['Im Ausfallschritt starten.', 'Absprung nach oben, in der Luft die Beine wechseln.', 'Weich im Ausfallschritt mit dem anderen Bein vorne landen.'],
    tip: 'Oberkörper aufrecht, vorderes Knie über dem Fuß.',
    easier: 'Ausfallschritte im Wechsel ohne Sprung.', harder: 'Unten kurz halten vor jedem Sprung.',
  },
  {
    id: 'hocksprung', name: 'Hocksprung', icon: '🦘', cat: 'ausdauer', pos: 'stehend', jump: true,
    unit: 'wdh', base: [null, null, null, null, null, null, 6, 10],
    steps: ['Hüftbreit stehen.', 'Hoch abspringen und die Knie zur Brust ziehen.', 'Weich landen, kurz stabilisieren, wieder springen.'],
    tip: 'Maximaler Puls – volle Konzentration auf die Landung.',
    easier: 'Sprungkniebeuge.', harder: 'Ohne Pause zwischen den Sprüngen.',
  },
  {
    id: 'bergsteigerboden', name: 'Bergsteiger', icon: '⛰️', cat: 'ausdauer', pos: 'boden',
    unit: 'sek', base: [null, null, null, null, 30, 40, 45, 60],
    steps: ['Hoher Liegestütz, Hände unter den Schultern.', 'Abwechselnd die Knie zügig Richtung Brust ziehen.', 'Hüfte bleibt tief, Tempo hoch.'],
    tip: 'Rumpf und Kreislauf zugleich – eine HIIT-Standardübung.',
    easier: 'Am Tisch oder langsamer.', harder: 'Knie diagonal zum gegenüberliegenden Ellbogen.',
  },
  {
    id: 'joggen', name: 'Laufen', icon: '🏃‍♂️', cat: 'ausdauer', pos: 'stehend',
    unit: 'sek', base: [null, null, null, null, null, 1200, 1500, 1800],
    steps: ['Draußen oder auf dem Laufband locker loslaufen.', 'Tempo so wählen, dass du noch in kurzen Sätzen sprechen kannst.', 'Die letzten Minuten zügiger – dann auslaufen.'],
    tip: 'Die Grundlagenausdauer ist das Fundament für jedes harte Training.',
    easier: 'Abwechselnd 3 Minuten laufen, 1 Minute gehen.', harder: 'Mittendrin 5 × 30 Sekunden Tempo.',
  },
  {
    id: 'einbeinkreuzheben', name: 'Einbeiniges Kreuzheben', icon: '🦢', cat: 'balance', pos: 'stehend', perSide: true,
    unit: 'wdh', base: [null, null, null, 6, 8, 10, 12, 12],
    steps: ['Auf einem Bein stehen, Knie leicht gebeugt.', 'Oberkörper nach vorne neigen, das freie Bein gestreckt nach hinten – wie eine Waage.', 'Über den Po wieder aufrichten.'],
    tip: 'Kräftigt die Rückseite und schult das Gleichgewicht zugleich.',
    easier: 'Eine Hand an der Stuhllehne.', harder: 'Mit Kurzhantel oder Kettlebell in der Hand.',
  },
  {
    id: 'kh_goblet', name: 'Goblet-Kniebeuge', icon: '🏆', cat: 'kraft', pos: 'stehend', equip: ['kurzhantel', 'kettlebell'],
    unit: 'wdh', base: [null, null, null, 10, 12, 15, 15, 20],
    steps: ['Kurzhantel oder Kettlebell senkrecht vor der Brust halten.', 'Tief in die Kniebeuge sinken, Ellbogen zwischen die Knie.', 'Über die Fersen kraftvoll hochdrücken.'],
    tip: 'Das Gewicht vorne hilft, den Oberkörper aufrecht zu halten.',
    easier: 'Leichteres Gewicht oder weniger tief.', harder: 'Unten 2 Sekunden halten.',
  },
  {
    id: 'kh_kreuzheben', name: 'Rumänisches Kreuzheben', icon: '🏋️', cat: 'kraft', pos: 'stehend', equip: ['kurzhantel', 'kettlebell'],
    unit: 'wdh', base: [null, null, null, 10, 12, 12, 15, 15],
    steps: ['Hüftbreit stehen, Gewicht vor den Oberschenkeln.', 'Hüfte nach hinten schieben, Rücken gerade, Gewicht an den Beinen entlang senken.', 'Wenn es hinten im Oberschenkel zieht: Hüfte nach vorne, aufrichten.'],
    tip: 'Der Rücken bleibt immer gerade – die Bewegung kommt aus der Hüfte.',
    easier: 'Weniger tief senken.', harder: 'Langsam runter (3 Sekunden).',
  },
  {
    id: 'kh_rudern', name: 'Rudern vorgebeugt', icon: '🚣', cat: 'kraft', pos: 'stehend', perSide: true, equip: ['kurzhantel', 'kettlebell'],
    unit: 'wdh', base: [null, null, null, 10, 12, 12, 15, 15],
    steps: ['Eine Hand auf Stuhl oder Tisch stützen, Oberkörper fast waagerecht.', 'Gewicht mit dem anderen Arm zur Hüfte ziehen, Ellbogen nah am Körper.', 'Langsam wieder senken.'],
    tip: 'Ziehen mit dem Rücken, nicht mit dem Bizeps – Schulterblatt nach hinten.',
    easier: 'Leichteres Gewicht.', harder: 'Oben 2 Sekunden halten.',
  },
  {
    id: 'kh_druecken', name: 'Schulterdrücken', icon: '🙌', cat: 'kraft', pos: 'stehend', equip: ['kurzhantel', 'kettlebell'],
    unit: 'wdh', base: [null, null, null, 8, 10, 12, 12, 15],
    steps: ['Gewicht(e) auf Schulterhöhe, Bauch fest.', 'Senkrecht über den Kopf drücken, bis die Arme gestreckt sind.', 'Kontrolliert zurück zur Schulter.'],
    tip: 'Kein Hohlkreuz – Po und Bauch anspannen.',
    easier: 'Im Sitzen oder abwechselnd einarmig.', harder: 'Langsam ablassen (3 Sekunden).',
  },
  {
    id: 'kb_swing', name: 'Kettlebell-Swing', icon: '🔔', cat: 'ausdauer', pos: 'stehend', equip: ['kettlebell'],
    unit: 'wdh', base: [null, null, null, null, 15, 20, 25, 30],
    steps: ['Schulterbreit stehen, Kettlebell mit beiden Händen zwischen den Beinen.', 'Hüfte explosiv nach vorne strecken – die Kettlebell schwingt bis Brusthöhe.', 'Zurückschwingen lassen und Hüfte wieder nach hinten schieben.'],
    tip: 'Kraft kommt aus der Hüfte, nicht aus den Armen. Rücken bleibt gerade.',
    easier: 'Leichtere Kettlebell, nur bis Bauchhöhe.', harder: 'Einarmig.',
  },
  {
    id: 'haengen', name: 'Aktives Hängen', icon: '🐒', cat: 'kraft', pos: 'haengend', equip: ['stange'],
    unit: 'sek', base: [null, null, null, 15, 20, 30, 40, 45],
    steps: ['Schulterbreit an die Stange greifen.', 'Hängen, dabei die Schultern leicht nach unten ziehen – weg von den Ohren.', 'Ruhig atmen, Körper still halten.'],
    tip: 'Stärkt Griff und Schultern – die Basis für Klimmzüge.',
    easier: 'Füße bleiben am Boden oder auf einem Stuhl.', harder: 'Länger hängen oder einarmig wechseln.',
  },
  {
    id: 'negativklimmzug', name: 'Negativ-Klimmzug', icon: '⬇️', cat: 'kraft', pos: 'haengend', equip: ['stange'],
    unit: 'wdh', base: [null, null, null, null, 3, 4, 5, 6],
    steps: ['Mit Hilfe eines Stuhls in die obere Klimmzug-Position kommen.', 'Kinn über der Stange – dann ganz langsam (4–5 Sekunden) herunterlassen.', 'Unten absteigen und wiederholen.'],
    tip: 'Der schnellste Weg zum ersten echten Klimmzug.',
    easier: 'Kürzer bremsen (2–3 Sekunden).', harder: 'Oben 3 Sekunden halten, dann 6 Sekunden runter.',
  },
  {
    id: 'klimmzug', name: 'Klimmzug', icon: '🧗', cat: 'kraft', pos: 'haengend', equip: ['stange'],
    unit: 'wdh', base: [null, null, null, null, null, 3, 5, 8],
    steps: ['Aus dem Hang, Hände etwas breiter als schulterbreit.', 'Brust zur Stange ziehen, bis das Kinn darüber ist.', 'Kontrolliert ganz herunterlassen.'],
    tip: 'Ganz unten starten – halbe Klimmzüge zählen nicht.',
    easier: 'Negativ-Klimmzüge oder mit Band als Hilfe.', harder: 'Langsam runter oder mit Gewicht.',
  },
  {
    id: 'kniehebenhaengend', name: 'Knieheben im Hang', icon: '🦿', cat: 'kraft', pos: 'haengend', equip: ['stange'],
    unit: 'wdh', base: [null, null, null, null, null, 6, 10, 12],
    steps: ['An der Stange hängen, Schultern aktiv.', 'Knie kontrolliert zur Brust ziehen, ohne zu schwingen.', 'Langsam wieder absenken.'],
    tip: 'Bauch statt Schwung – lieber weniger und sauber.',
    easier: 'Nur bis Hüfthöhe.', harder: 'Gestreckte Beine anheben.',
  },
  {
    id: 'band_pullapart', name: 'Band auseinanderziehen', icon: '🎗️', cat: 'kraft', pos: 'stehend', equip: ['band'],
    unit: 'wdh', base: [null, null, 10, 12, 15, 15, 20, 20],
    steps: ['Band schulterbreit mit gestreckten Armen vor der Brust halten.', 'Band auseinanderziehen, bis es die Brust berührt.', 'Langsam zurück.'],
    tip: 'Ideal gegen runde Schultern vom Schreibtisch.',
    easier: 'Hände weiter auseinander.', harder: 'Hände enger oder stärkeres Band.',
  },
  {
    id: 'band_rudern', name: 'Rudern mit Band', icon: '🛶', cat: 'kraft', pos: 'stehend', equip: ['band'],
    unit: 'wdh', base: [null, null, 10, 12, 15, 15, 20, 20],
    steps: ['Band an Türklinke oder Pfosten auf Brusthöhe befestigen.', 'Mit gestreckten Armen greifen, einen Schritt zurück.', 'Ellbogen nach hinten ziehen, Schulterblätter zusammen.'],
    tip: 'Oben kurz halten – das macht den Unterschied.',
    easier: 'Näher an den Befestigungspunkt.', harder: 'Weiter weg oder stärkeres Band.',
  },
  {
    id: 'band_seitgehen', name: 'Seitgehen mit Band', icon: '🦀', cat: 'kraft', pos: 'stehend', perSide: true, equip: ['band'],
    unit: 'wdh', base: [null, null, null, 8, 10, 12, 15, 15],
    steps: ['Miniband um die Beine, oberhalb der Knie oder an den Knöcheln.', 'Leicht in die Knie gehen.', 'Seitlich Schritte machen, das Band bleibt gespannt.'],
    tip: 'Stärkt die seitliche Hüfte – schützt die Knie beim Laufen und Springen.',
    easier: 'Band oberhalb der Knie, kleinere Schritte.', harder: 'Band an den Knöcheln, tiefer in die Knie.',
  },
];

export const byId = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

/** Ausstattung und Sprung-Wunsch eines Profils (für forLevel). */
export const gearOf = (profile) => ({ equip: profile?.equipment || [], noJumps: !!profile?.noJumps });

/** Passt die Übung zur Ausstattung und zum Sprung-Wunsch? */
export const fitsGear = (e, { equip = [], noJumps = false } = {}) => (!e.equip || e.equip.some((g) => equip.includes(g))) && !(noJumps && e.jump);

/** Übungen, die für ein Level (und die Ausstattung) verfügbar sind. */
export function forLevel(level, cat, gear) {
  return EXERCISES.filter((e) => !e.programOnly && e.base[level - 1] != null && (!cat || e.cat === cat) && fitsGear(e, gear));
}
