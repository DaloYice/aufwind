// Übungsbibliothek. base = Menge je Level 1–5 (null = für dieses Level nicht vorgesehen).
// unit: 'sek' (Zeit) oder 'wdh' (Wiederholungen). perSide: Menge gilt je Seite.
// Grundsatz für Level 1–2: gelenkschonend, keine Sprünge, keine Bodenübungen.

export const CATEGORIES = {
  mobil: { label: 'Beweglichkeit', icon: '🌀' },
  kraft: { label: 'Kraft', icon: '💪' },
  ausdauer: { label: 'Ausdauer', icon: '❤️' },
  balance: { label: 'Gleichgewicht', icon: '⚖️' },
  entspannung: { label: 'Entspannung', icon: '🌙' },
  beckenboden: { label: 'Beckenboden', icon: '🌸' },
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
  // ---------- Kraft für Fortgeschrittene (ab v0.7.0, ohne Sprünge) ----------
  {
    id: 'bodenliegestuetz', name: 'Liegestütz am Boden', icon: '💪', cat: 'kraft', pos: 'boden',
    unit: 'wdh', base: [null, null, null, 5, 10],
    steps: ['Hände etwas breiter als schulterbreit, Körper bildet eine gerade Linie.', 'Brust langsam Richtung Boden senken, Ellbogen schräg nach hinten.', 'Kraftvoll wieder hochdrücken, Bauch bleibt fest.'],
    tip: 'Lieber weniger saubere Wiederholungen als viele mit durchhängendem Rücken.',
    easier: 'Auf den Knien oder am Tisch.', harder: 'Unten 2 Sekunden halten.',
  },
  {
    id: 'bodenplank', name: 'Unterarmstütz am Boden', icon: '🪵', cat: 'kraft', pos: 'boden',
    unit: 'sek', base: [null, null, null, 20, 40],
    steps: ['Unterarme unter den Schultern, Beine gestreckt, auf den Zehen.', 'Körper bildet eine Linie von Kopf bis Ferse.', 'Bauch und Po anspannen, ruhig weiteratmen.'],
    tip: 'Blick zum Boden, der Nacken bleibt lang.',
    easier: 'Knie am Boden lassen.', harder: 'Abwechselnd ein Bein kurz anheben.',
  },
  {
    id: 'seitstuetz', name: 'Seitstütz', icon: '📐', cat: 'kraft', pos: 'boden', perSide: true,
    unit: 'sek', base: [null, null, null, 15, 25],
    steps: ['Auf die Seite legen, Ellbogen unter der Schulter.', 'Becken anheben, bis der Körper eine Linie bildet.', 'Halten, ruhig atmen – dann Seite wechseln.'],
    tip: 'Das Becken nicht nach hinten kippen lassen.',
    easier: 'Untere Knie am Boden lassen.', harder: 'Oberen Arm zur Decke strecken.',
  },
  {
    id: 'wandsitzen', name: 'Wandsitzen', icon: '🧱', cat: 'kraft', pos: 'stehend',
    unit: 'sek', base: [null, null, 15, 25, 40],
    steps: ['Mit dem Rücken an eine Wand lehnen, Füße einen Schritt vor.', 'An der Wand herunterrutschen, bis die Knie etwa rechtwinklig sind.', 'Halten, dann langsam wieder hochschieben.'],
    tip: 'Knie bleiben über den Fersen, nicht vor den Zehen.',
    easier: 'Nur halb so tief gehen.', harder: 'Länger halten oder Fersen leicht anheben.',
  },
  {
    id: 'ausfallvorwaerts', name: 'Ausfallschritt vorwärts', icon: '🦵', cat: 'kraft', pos: 'stehend', perSide: true,
    unit: 'wdh', base: [null, null, null, 6, 10],
    steps: ['Aufrecht stehen, Hände an die Hüfte.', 'Großen Schritt nach vorne, hinteres Knie Richtung Boden senken.', 'Mit dem vorderen Bein kraftvoll zurück in den Stand drücken.'],
    tip: 'Oberkörper bleibt aufrecht, vorderes Knie über dem Fuß.',
    easier: 'Ausfallschritt rückwärts oder mit Stuhl zum Festhalten.', harder: 'Unten kurz halten.',
  },
  {
    id: 'superman', name: 'Superman', icon: '🦸', cat: 'kraft', pos: 'boden',
    unit: 'wdh', base: [null, null, null, 8, 12],
    steps: ['Auf den Bauch legen, Arme nach vorne gestreckt.', 'Arme, Brust und Beine gleichzeitig leicht anheben.', '2 Sekunden halten, langsam ablegen.'],
    tip: 'Blick zum Boden – nicht den Kopf in den Nacken legen.',
    easier: 'Nur Arme oder nur Beine anheben.', harder: 'Oben 5 Sekunden halten.',
  },
  {
    id: 'kniebeugehalten', name: 'Kniebeuge halten', icon: '⏳', cat: 'kraft', pos: 'stehend',
    unit: 'sek', base: [null, null, null, 20, 30],
    steps: ['Füße hüftbreit, Arme nach vorne.', 'In die Kniebeuge gehen, so tief es angenehm ist.', 'Unten halten und ruhig weiteratmen.'],
    tip: 'Gewicht auf den Fersen, Brust bleibt offen.',
    easier: 'Weniger tief oder an der Wand (Wandsitzen).', harder: 'Am Ende 5 kleine Wipper nach oben und unten.',
  },

  // ---------- Beckenboden (Frauen und Männer) ----------
  {
    id: 'bb_wahrnehmen', name: 'Beckenboden spüren', icon: '🌸', cat: 'beckenboden', pos: 'sitzend',
    unit: 'sek', base: [60, 60, 60, 60, 60], cue: [['Anspannen', 4], ['Lösen', 6]],
    steps: ['Aufrecht auf die Stuhlkante setzen, Füße hüftbreit.', 'Stell dir vor, du hältst Wind und Wasser zurück – Harnröhre, Scheide bzw. Hoden und After ziehen sanft nach innen-oben.', 'Wieder ganz lösen. Po, Bauch und Beine bleiben dabei locker.'],
    tip: 'Ein festes Polster oder ein eingerolltes Handtuch unter dem Damm hilft beim Spüren.',
    easier: 'Nur auf das Lösen achten – das ist genauso wichtig.', harder: 'Mit geschlossenen Augen und ganz ohne Mitspannen von Po und Bauch.',
  },
  {
    id: 'bb_atmung', name: 'Beckenboden-Atmung', icon: '🌬️', cat: 'beckenboden', pos: 'sitzend',
    unit: 'sek', base: [60, 60, 90, 90, 120], cue: [['Einatmen – lösen', 4], ['Ausatmen – anspannen', 6]],
    steps: ['Aufrecht sitzen, eine Hand auf den Bauch.', 'Beim Einatmen weitet sich der Bauch, der Beckenboden lässt los.', 'Beim Ausatmen den Beckenboden sanft nach innen-oben ziehen.'],
    tip: 'Nie die Luft anhalten – der Atem trägt die Übung.',
    easier: 'Nur atmen und das Weiten beim Einatmen spüren.', harder: 'Beim Ausatmen zusätzlich den unteren Bauch leicht nach innen ziehen.',
  },
  {
    id: 'bb_schnell', name: 'Schnelle Impulse', icon: '⚡', cat: 'beckenboden', pos: 'sitzend',
    unit: 'sek', base: [30, 30, 40, 45, 60], cue: [['Kurz anspannen', 1], ['Locker', 2]],
    steps: ['Aufrecht sitzen.', 'Den Beckenboden kurz und kräftig anspannen …', '… und sofort wieder ganz locker lassen.'],
    tip: 'Diese schnelle Reaktion schützt beim Husten, Niesen und Lachen.',
    easier: 'Langsamer: 2 Sekunden Pause zwischen den Impulsen.', harder: 'Im Stehen üben.',
  },
  {
    id: 'bb_halten', name: 'Anspannen und halten', icon: '⏳', cat: 'beckenboden', pos: 'sitzend',
    unit: 'sek', base: [60, 60, 90, 90, 120], cue: [['Anspannen und halten', 5], ['Lösen', 5]],
    steps: ['Aufrecht sitzen, ruhig atmen.', 'Den Beckenboden anspannen und die Spannung halten – dabei weiteratmen.', 'Genauso lange wieder ganz lösen.'],
    tip: 'Lieber sanft und sauber halten als fest und mit angehaltenem Atem.',
    easier: 'Nur 3 Sekunden halten.', harder: 'Im Stehen oder 8–10 Sekunden halten.',
  },
  {
    id: 'bb_stehen', name: 'Beckenboden im Stehen', icon: '🧍', cat: 'beckenboden', pos: 'stehend',
    unit: 'sek', base: [null, 60, 60, 90, 90], cue: [['Anspannen', 5], ['Lösen', 5]],
    steps: ['Hüftbreit stehen, Knie locker, Hände an die Hüfte.', 'Beckenboden anspannen, ohne den Po zusammenzukneifen.', 'Lösen und kurz nachspüren.'],
    tip: 'Im Alltag üben: z. B. beim Zähneputzen oder an der Kasse.',
    easier: 'Im Sitzen üben.', harder: 'Auf einem Bein stehen und dabei anspannen.',
  },
  {
    id: 'bb_ruecken', name: 'Beckenboden in Rückenlage', icon: '🛏️', cat: 'beckenboden', pos: 'boden',
    unit: 'sek', base: [null, null, 60, 90, 90], cue: [['Ausatmen – anspannen, Becken leicht heben', 5], ['Einatmen – ablegen und lösen', 5]],
    steps: ['Auf den Rücken legen, Beine aufgestellt, Arme neben dem Körper.', 'Ausatmen, Beckenboden anspannen und das Becken ein kleines Stück anheben.', 'Einatmen, Becken ablegen und den Beckenboden ganz lösen.'],
    tip: 'Diese Lage entlastet den Beckenboden – gut zum Üben, wenn er noch schwach ist.',
    easier: 'Becken liegen lassen, nur anspannen und lösen.', harder: 'Oben 3 Atemzüge halten.',
  },
];

export const byId = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

/** Übungen, die für ein Level verfügbar sind. */
export function forLevel(level, cat) {
  return EXERCISES.filter((e) => !e.programOnly && e.base[level - 1] != null && (!cat || e.cat === cat));
}
