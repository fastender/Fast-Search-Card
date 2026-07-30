# Tipps — Fragen & Antworten

Die wichtigsten Fragen zur Card, jede mit einer ausführlichen Antwort. Von „Was sehe ich beim Öffnen?" über die Insel und das Mitteilungs-Center bis zu eigenen Geräte-Ansichten.

<!--
AUTOREN-HINWEIS (wird vom Parser ignoriert):

Format pro Tipp — exakt einhalten, sonst überspringt der Parser den Eintrag:

    ## Tipp {slug} - {Kategorie}
    (Leerzeile)
    **Title:** {Frage}
    **Hero:** none
    **Tags:** {Tag1, Tag2}
    (Leerzeile)
    {Antwort — Markdown erlaubt}
    (Leerzeile)
    ---

Regeln:
- slug: nur ASCII-Buchstaben, Ziffern, Bindestriche (keine Umlaute). Muss in
  lessons.de.md und lessons.en.md IDENTISCH sein (Deep-Link-Parität).
- Kategorie: kurz, wird in der UI als Gruppe angezeigt.
- Title: als Frage formulieren — das ist das Konzept dieses Buchs.
- Antwort: direkte Antwort zuerst (1–2 Sätze), dann `###`-Unterabschnitte für
  Schritte, Hintergrund und Sonderfälle.
- ⚠️ NIEMALS `---` innerhalb eines Tipps verwenden — das beendet den Eintrag
  vorzeitig. Für Gliederung `###`-Überschriften nutzen.
- Neue Tipps am Ende der passenden Kategorie einfügen. Faktenquelle ist
  docs/info-popups/info-popups-catalog.md und der Versionsverlauf.
-->

---

## Tipp was-kann-die-card - Erste Schritte

**Title:** Was kann diese Card eigentlich alles?
**Hero:** none
**Tags:** Start, Überblick

Mehr als suchen. Die Card ist ein vollständiges Dashboard in einer einzigen Lovelace-Karte.

### Was drin steckt
- **Suche & Steuerung** für alle Geräte deines Home Assistant
- **Startseite** mit Uhr, Begrüßung und Live-Kacheln
- **Die Insel** — eine Kapsel oben, die zeigt, was gerade wichtig ist
- **Mitteilungs-Center** mit Verlauf, Schweregraden und Ruhezeiten
- **Apps**: Kalender, Aufgaben, News, Zeitpläne, Tipps, Änderungsverlauf
- **Energie-Dashboard** und ein Baukasten für eigene Geräte-Ansichten

### Wo alles lebt
Alles läuft lokal in deinem Browser und spricht direkt mit deinem Home Assistant. Kein Cloud-Dienst, kein Konto, keine Telemetrie.

### Wie du weiterkommst
Diese Tipps sind nach Bereichen sortiert und bauen aufeinander auf. Wenn du die Card gerade erst installiert hast, arbeite dich einfach der Reihe nach durch „Erste Schritte".

---

## Tipp zen-start - Erste Schritte

**Title:** Was sehe ich, wenn die Card sich öffnet?
**Hero:** none
**Tags:** Start, Zen

Einen ruhigen Startbildschirm: Datum, eine große Uhr, deine Begrüßung und die Suchleiste. Alles andere ist eine Geste entfernt.

### Was dort steht
- **Datum und Uhr** — groß, ohne Ablenkung
- **Begrüßung** — mit deinem Namen, wenn Home Assistant ihn kennt
- **Suchleiste** — mittig, bereit zum Antippen
- **Wartende Meldungen** — darunter gestapelt, wie auf einem Sperrbildschirm

### Warum so wenig
Auf einem Wandtablet läuft die Card oft den ganzen Tag. Ein Bildschirm, der nur Uhrzeit und Wichtiges zeigt, ist im Vorbeigehen angenehmer als ein volles Dashboard. Wer mehr will, holt es sich mit einer Geste.

### Gut zu wissen
Die Einblendung bewegt nichts — Uhr, Begrüßung und Leiste sind vom ersten Bild an da und werden nur von unscharf zu scharf. Danach wandert ein Lichtschein einmal über das Glas der Suchleiste.

---

## Tipp zen-aufdecken - Erste Schritte

**Title:** Wie komme ich vom Startbildschirm zu meinen Geräten?
**Hero:** none
**Tags:** Start, Gesten

Eine Geste genügt: nach oben wischen, einmal am Mausrad drehen oder die Pfeiltaste nach oben drücken.

### Was dann passiert
Der Aufbau läuft von selbst durch, nichts bleibt auf halbem Weg stehen:

1. Uhr, Begrüßung und Meldungen treten zur Seite
2. Die Suchleiste wandert von der Mitte nach oben und wird zur Werkzeugleiste
3. Die Insel setzt sich darüber
4. Die Sidebar schiebt sich von links herein
5. Die vier Kacheln kommen nacheinander — die größte zuerst

### Zurück in die Ruhe
Eine Geste nach unten fährt alles wieder zusammen — dieselbe Treppe rückwärts, eine Spur schneller.

### Gut zu wissen
Sobald du die Card wirklich benutzt (suchen, ein Gerät öffnen), bleibt sie aufgedeckt. Der Ruhezustand kommt erst zurück, wenn du ihn selbst wieder holst.

---

## Tipp geraet-steuern - Erste Schritte

**Title:** Wie steuere ich ein Gerät?
**Hero:** none
**Tags:** Start, Steuerung

Tippe ein Gerät in der Liste an — die Detailansicht öffnet sich mit allen Bedienelementen.

### Was dich erwartet
- **Kreis-Slider** für alles mit einem Wert: Helligkeit, Temperatur, Position
- **Modus-Knöpfe** darunter: Farbtemperatur, Effekte, Heizen/Kühlen
- **Reiter** oben: Steuerung, Kontext, Verlauf, Zeitplan, Einstellungen

### Der schnellere Weg
Für Licht an/aus musst du die Detailansicht gar nicht öffnen — mit der Schnellsteuerung wird das Geräte-Icon selbst zum Schalter. Siehe die Kategorie „Schnellsteuerung".

### Gut zu wissen
Welche Bedienelemente erscheinen, entscheidet die Card anhand des Gerätetyps. Ein Rollladen bekommt Position und Lamellen, ein Media-Player Lautstärke und Warteschlange, ein Thermostat Zieltemperatur und Modi.

---

## Tipp zurueck-navigieren - Erste Schritte

**Title:** Wie komme ich wieder zurück?
**Hero:** none
**Tags:** Start, Navigation

Oben links ist immer ein Zurück-Pfeil. Auf dem Handy funktioniert auch eine Wischgeste nach rechts.

### Die Card merkt sich den Weg
Nach einem Gerät landest du wieder in deiner Suchliste — mit demselben Filter, derselben Scrollposition. Nicht am Anfang.

### Bei den Apps
Kalender, Aufgaben und News haben oben links eigene Zurück- und Übersichts-Knöpfe. Aus einer Detailansicht führt der erste Tipp zurück zur Liste, der zweite zur Card.

---

## Tipp startseite-verstehen - Erste Schritte

**Title:** Was zeigen mir die Kacheln?
**Hero:** none
**Tags:** Start, Bento

Vier Kacheln („Bento-Widgets") mit deinen wichtigsten Live-Informationen. Alles echt, alles antippbar.

### Die vier Plätze
- **W1** — groß, links: meist Favoriten oder Vorschläge
- **W2** — oben rechts: ein Karussell aus Wetter, Kalender, Aufgaben und News
- **W3 / W4** — unten geteilt: zum Beispiel Tipps und Änderungsverlauf

### Was ein Tipp bewirkt
Ein Tipp auf eine Kachel öffnet direkt die passende Detailansicht — auf das Wetter-Widget zum Wetter, auf einen Termin zum Kalender, auf ein Gerät in den Favoriten zu genau diesem Gerät.

### Gut zu wissen
Welche App in welchem Platz sitzt, bestimmst du selbst: Einstellungen → Allgemein → Startseite.

---

## Tipp insel-was - Die Insel

**Title:** Was ist die Kapsel oben in der Mitte?
**Hero:** none
**Tags:** Insel, Überblick

Die Insel — eine Glas-Kapsel, die immer genau **eine** Sache zeigt: die gerade wichtigste.

### Die Rangfolge
1. **Meldung** — Warnungen orange, Infos blau. Mehrere stapeln sich zu „N Mitteilungen".
2. **Live-Aktivität** — ein laufender Timer mit Countdown, der Sauger, ein fahrendes Rollo, spielende Medien. Bei mehreren: die wichtigste plus „+N".
3. **Ruhe** — Uhr, Wetter und ein Presence-Punkt. Grau heißt: nichts wartet.

### Das Ruhegesicht rollt
Ist nichts los, wechselt die Insel im Takt durch die Fakten deines Zuhauses: Wetter, wie viele Lichter an sind, wie viele Fenster offen stehen. Jede Zahl ist antippbar und führt genau dorthin.

### Warum eine statt vieler
Eine ruhige Kapsel, die sich nur meldet, wenn es etwas zu sagen gibt — statt einer Leiste voller Widgets, die permanent um Aufmerksamkeit konkurrieren.

---

## Tipp insel-tippen - Die Insel

**Title:** Was passiert, wenn ich die Insel antippe?
**Hero:** none
**Tags:** Insel, Interaktion

Ein kurzer Tipp öffnet die Ansicht, die zum aktuellen Inhalt passt.

### Wohin es geht
- **Bei einer Meldung** → ins Mitteilungs-Center
- **Bei einer Live-Aktivität** → in die Detailansicht des laufenden Geräts
- **Im Ruhezustand** → zu dem Bereich, den die gerade gezeigte Zahl betrifft (Wetter, Lichter, Fenster)

### Der Übergang
Die Kapsel morpht in die Zielansicht hinein — sie wächst an ihrer Stelle zur vollen Ansicht auf, statt dass ein neues Fenster darüberklappt. Beim Schließen läuft dasselbe rückwärts.

---

## Tipp insel-halten - Die Insel

**Title:** Was ist die Vorschau, wenn ich die Insel gedrückt halte?
**Hero:** none
**Tags:** Insel, Gesten

Halte die Kapsel etwa eine halbe Sekunde gedrückt — es öffnet sich eine Vorschau, ohne dass du den Bildschirm verlässt.

### Was du siehst
- **Bei Meldungen** — das Mitteilungs-Panel dockt unter der Kapsel an. Quittieren, stummschalten und als gelesen markieren geht direkt dort.
- **Bei Live-Aktivitäten** — eine Glasliste **aller** laufenden Vorgänge. Ein Tipp auf eine Zeile öffnet das jeweilige Gerät.

### Kurz oder lang
Der kurze Tipp bleibt der schnelle Weg — er öffnet sofort die passende Ansicht. Nach einem langen Druck wird der Loslass-Klick geschluckt, du landest also nicht versehentlich woanders.

### Gut zu wissen
Die Live-Vorschau schließt sich von selbst, sobald nichts mehr läuft.

---

## Tipp insel-nachts - Die Insel

**Title:** Warum zeigt die Insel nachts nur die Uhr?
**Hero:** none
**Tags:** Insel, Ruhezeiten

Weil sie in deinen Ruhezeiten das Nachtgesicht aufsetzt: gedimmt, reduziert auf die Uhrzeit.

### Was still wird
Das Ruhegesicht — Wetter, Zählerstände, rollende Fakten. Auf einem Wandtablet im Flur oder Schlafzimmer soll nachts kein Werteticker leuchten.

### Was durchkommt
Meldungen und Live-Aktivitäten bleiben sichtbar. Ein laufender Timer oder eine Warnung verschwindet nicht, nur weil es spät ist.

### Wo du das einstellst
Einstellungen → Allgemein → Toasts → Ruhezeiten. Dort legst du das Zeitfenster fest — über Mitternacht hinweg (etwa 22:00–07:00) wird korrekt behandelt.

---

## Tipp mitteilungen-center - Mitteilungen

**Title:** Wo finde ich alle Meldungen an einem Ort?
**Hero:** none
**Tags:** Mitteilungen, Center

Im Mitteilungs-Center — such nach „Mitteilungen" oder tippe die Insel an, wenn sie eine Meldung zeigt.

### Was zusammenläuft
Drei Quellen an einem Ort:
- **Home Assistant** — persistente Benachrichtigungen
- **Alarm-Entitäten** — Rauch, Leck, Gas und andere Warnmelder
- **Die Card selbst** — Rückmeldungen zu Aktionen

### Wie es sortiert ist
Nach Schweregrad. Kritisches ganz oben, dann Warnungen, dann Infos. Drei Reiter trennen **Übersicht**, **Live** und **Verlauf** — nichts verschwindet, auch Quittiertes bleibt im Verlauf nachlesbar.

### Gut zu wissen
Der Zähler im Kopf sagt dir, wie viele Meldungen es wirklich sind. Die Zahl in der Insel und die im Center stammen aus derselben Quelle.

---

## Tipp mitteilungen-quittieren - Mitteilungen

**Title:** Wie werde ich eine Meldung wieder los?
**Hero:** none
**Tags:** Mitteilungen, Aktionen

Drei Wege, je nachdem wie endgültig es sein soll.

### Die drei Aktionen
- **Als gelesen markieren** — die Meldung verlässt die Übersicht, bleibt aber im Verlauf.
- **Stummschalten (1 Stunde)** — für Wiederkehrer, die gerade nicht dran sind.
- **Quittieren** — bestätigt die Meldung endgültig.

### Wo du sie findest
Direkt in der Vorschau, wenn du die Insel gedrückt hältst — oder im Mitteilungs-Center an jeder Zeile.

### Was im Hintergrund passiert
Bei echten Home-Assistant-Benachrichtigungen ruft die Card den passenden Dienst auf, sodass sie auch in HA verschwinden. Bei Alarm-Entitäten wird nur lokal quittiert — der Sensor selbst bleibt unangetastet, weil ihn nur die Ursache zurücksetzen kann.

---

## Tipp kritische-meldung - Mitteilungen

**Title:** Was ist der rote Balken ganz oben?
**Hero:** none
**Tags:** Mitteilungen, Kritisch

Der Kritisch-Banner. Er erscheint nur bei Meldungen der höchsten Stufe — Wasserleck, Rauch, Gas.

### Warum extra
Solche Meldungen dürfen nicht in einer Liste untergehen. Der Banner legt sich über den Kopf der Card und bleibt, bis du reagierst.

### Auch nachts
Der Banner ist die einzige Meldungsart, die die Ruhezeiten durchbricht — standardmäßig zumindest. Der Schalter „Kritisches immer durchlassen" steht in den Ruhezeiten-Einstellungen und ist ab Werk an.

---

## Tipp ruhezeiten - Mitteilungen

**Title:** Wie verhindere ich Einblendungen in der Nacht?
**Hero:** none
**Tags:** Mitteilungen, Ruhezeiten

Mit den Ruhezeiten: Einstellungen → Allgemein → Toasts → Ruhezeiten.

### Was still wird
- Toasts (die kurzen Einblendungen)
- Der rote Kritisch-Banner — sofern du die Ausnahme abschaltest
- Das Ruhegesicht der Insel dimmt auf „nur Uhr"

### Was nicht verloren geht
Die Meldungen entstehen trotzdem. Der Zähler füllt sich, das Center sammelt alles. Am Morgen ist nichts weg — es hat dich nur nicht geweckt.

### Über Mitternacht
Ein Fenster wie 22:00–07:00 wird korrekt behandelt. Du musst es nicht in zwei Teile zerlegen.

---

## Tipp live-was - Live-Aktivitäten

**Title:** Was zählt als „Live-Aktivität"?
**Hero:** none
**Tags:** Live, Überblick

Alles, was gerade läuft und irgendwann von selbst endet.

### Standardmäßig dabei
- **Timer** mit Countdown
- **Staubsauger**, während er saugt oder zur Basis fährt
- **Rollläden**, während sie fahren
- **Medien**, während sie spielen
- **Skripte und Automationen**, während sie laufen

### Standardmäßig nicht dabei
Lichter, Schalter und Klimageräte. Die sind Dauerzustände — ein Licht ist stundenlang „an", das ist keine Aktivität. Wer sie trotzdem sehen will, schaltet sie gezielt frei.

### Warum das nützlich ist
Laufende Vorgänge sind sonst unsichtbar, bis man zufällig die Detailansicht öffnet. Die Insel zeigt sie, solange sie laufen — und räumt sich weg, wenn sie fertig sind.

---

## Tipp live-anpassen - Live-Aktivitäten

**Title:** Kann ich auswählen, was als Live-Aktivität erscheint?
**Hero:** none
**Tags:** Live, Einstellungen

Ja — Einstellungen → Allgemein → Startseite → Live-Aktivitäten.

### Was du dort hast
- **Hauptschalter** für die ganze Funktion
- **Ein Schalter je Quelle** — Timer, Sauger, Rollläden, Medien, Skripte, Automationen
- **Opt-in für Dauerzustände** — Lichter, Schalter, Klima

### Ein Rat zur Dosierung
Lichter einzuschalten klingt verlockend, führt aber dazu, dass die Insel praktisch nie zur Ruhe kommt. Probier es aus, aber erwarte, dass du es wieder abschaltest.

---

## Tipp tippfehler - Suchen

**Title:** Muss ich Gerätenamen exakt schreiben?
**Hero:** none
**Tags:** Suche, Fuzzy

Nein. Die Suche verzeiht Tippfehler und findet auch Wortteile.

### Was funktioniert
- **Vertipper** — „Lihct" findet dein Licht
- **Wortteile** — „bett lampe" findet die „Schlafzimmer-Bettlampe"
- **Zwei Wörter** — „Wohnzimmer Licht" wird als Raum plus Gerätetyp verstanden
- **Beide Sprachen** — „Lampe" und „light" führen zum selben Ziel

### Wie viel du tippen musst
Meist genügen zwei bis drei Buchstaben, bis der richtige Treffer oben steht. Die Card durchsucht Gerätenamen, Raumnamen und Entity-IDs gleichzeitig.

### Wenn nichts kommt
Prüfe, ob das Gerät durch ein Muster ausgeschlossen ist (Einstellungen → Allgemein → Filter) oder ob ein Limit die Ladung begrenzt.

---

## Tipp raum-filter - Suchen

**Title:** Wie sehe ich nur Geräte aus einem Raum?
**Hero:** none
**Tags:** Suche, Filter

Tippe den Raumnamen ins Suchfeld — die Card schlägt ihn als Geistertext vor.

### Vorschlag annehmen
- **Desktop** — Tab-Taste oder Pfeil nach rechts
- **Handy** — auf den Vorschlag tippen oder den Bestätigen-Knopf rechts im Feld

Der Raum wird zu einem blauen Chip, die Liste zeigt nur noch diesen Raum.

### Kombinieren
Chips lassen sich stapeln: erst „Kinderzimmer", dann „Lampe" — übrig bleiben die Lampen im Kinderzimmer. Die Card wechselt dabei automatisch in die passende Kategorie.

### Der andere Weg
Über die Filter-Leiste unter dem Suchfeld gibt es dieselben Filter zum Antippen, ohne zu tippen.

---

## Tipp chips-verstehen - Suchen

**Title:** Was bedeuten die farbigen Chips im Suchfeld?
**Hero:** none
**Tags:** Suche, Chips

Chips sind aktive Filter. Die Farbe verrät die Art.

### Die drei Farben
- **Blau** — ein Raum (Küche, Bad, Wohnzimmer)
- **Violett** — ein Gerätetyp (Licht, Schalter, Klima)
- **Grün** — ein Sensortyp (Temperatur, Bewegung, Energie)

### Löschen
Ein Tipp wählt den Chip aus, ein zweiter löscht ihn — dasselbe Muster wie bei Empfängern in iOS-Mail. Auf dem Desktop geht auch die Rücktaste, wenn das Feld leer ist.

---

## Tipp kategorien - Suchen

**Title:** Wofür stehen Geräte, Sensoren, Aktionen und Custom?
**Hero:** none
**Tags:** Suche, Kategorien

Vier Bereiche, vier Blickwinkel auf dein Zuhause.

### Was wohin gehört
- **Geräte** — alles, was du schalten kannst: Lichter, Schalter, Klima, Rollläden, Media-Player, Schlösser, Sauger
- **Sensoren** — alles, was misst: Temperatur, Luftfeuchte, Bewegung, Energie, Türkontakte
- **Aktionen** — Szenen, Skripte, Automationen
- **Custom** — die eingebauten Apps: Kalender, Aufgaben, News, Zeitpläne, Einstellungen und deine eigenen Geräte-Ansichten

### Automatischer Wechsel
Erzeugst du einen Sensor-Chip, während du in „Geräte" bist, springt die Card selbstständig zu „Sensoren" — sonst wäre die Liste leer.

---

## Tipp ansicht-wechseln - Suchen

**Title:** Wie wechsle ich zwischen Gitter- und Listenansicht?
**Hero:** none
**Tags:** Suche, Ansicht

Über das Symbol neben dem Suchfeld.

### Der Unterschied
- **Gitter** — große Kacheln mit Icon, Name und Zustand. Ruhiger, gut zum Tippen.
- **Liste** — kompakte Zeilen, mehr Geräte auf einen Blick, mit Schalter und „⋯"-Knopf direkt in der Zeile.

### Gut zu wissen
Deine Wahl wird gespeichert und übersteht ein Neuladen. Wie viele Kacheln nebeneinander passen, stellst du unter Einstellungen → Darstellung → Spalten ein (4, 5 oder 6).

---

## Tipp favoriten-anlegen - Suchen

**Title:** Wie lege ich Favoriten fest?
**Hero:** none
**Tags:** Suche, Favoriten

Öffne ein Gerät und tippe das **♥ Herz** oben rechts im Kopf der Detailansicht.

### Wo sie danach auftauchen
- Im **Favoriten-Filter** der Suche
- Im **Favoriten-Widget** auf der Startseite

### Entfernen
Derselbe Weg — Herz nochmal antippen.

### Warum das lohnt
Die Handvoll Geräte, die du wirklich täglich benutzt, sind damit immer einen Tipp entfernt, statt in der vollen Liste zu liegen.

---

## Tipp vorschlaege - Suchen

**Title:** Warum schlägt mir die Card bestimmte Geräte vor?
**Hero:** none
**Tags:** Suche, Vorschläge

Weil sie aus deinen Klicks lernt — lokal in deinem Browser, ohne dass etwas das Gerät verlässt.

### Wie es lernt
- Was du oft benutzt, rückt nach oben
- Was du siehst und ignorierst, verliert an Gewicht
- Alte Muster verblassen mit der Zeit von selbst

### Die Lerngeschwindigkeit
Einstellungen → Allgemein → Vorschläge. Drei Stufen bestimmen, wie schnell sich die Vorschläge anpassen — von „träge, dafür stabil" bis „reagiert sofort".

### Zurücksetzen
Im selben Bereich: „Lerndaten zurücksetzen" löscht alle gelernten Muster und zeigt dir, wie viel gelöscht wurde.

---

## Tipp zeit-sortierung - Suchen

**Title:** Kann ich sehen, was sich zuletzt im Haus geändert hat?
**Hero:** none
**Tags:** Suche, Sortierung

Ja — mit der Zeit-Sortierung. Sie fügt der Werkzeugleiste einen Uhr-Knopf hinzu.

### Was sie tut
Aktiv gruppiert sie die Geräteliste nach **letzter Aktivität** statt nach Raum. Das zuletzt Geschaltete steht oben.

### Drei Profile
- **Fein** — Gerade eben · Letzte 15 Min · Letzte 30 Min · Letzte Stunde
- **Standard** — Letzte 15 Min · Letzte Stunde · Heute
- **Grob** — Letzte Stunde · Letzte 6 Std · Letzte 12 Std

Alles jenseits des letzten Fensters landet in „Heute" beziehungsweise „Älter".

### Kombinierbar
Die Zeit-Sortierung wirkt zusätzlich zum Kategorie- und Raumfilter. „Lichter, nach Aktivität" ist also möglich.

### Einschalten
Einstellungen → Allgemein → Filter → Nach Zeit sortieren.

---

## Tipp quick-control - Schnellsteuerung

**Title:** Wie schalte ich ein Licht mit nur einem Tipp?
**Hero:** none
**Tags:** Schnellsteuerung, Licht

Mit der Schnellsteuerung wird das Geräte-Icon auf der Karte selbst zum Schalter.

### Einschalten
Einstellungen → Allgemein → Schnellsteuerung. Ab Werk ist die Funktion aus — sie verändert das Antippverhalten spürbar, deshalb entscheidest du.

### Danach gilt
- **Tipp aufs Icon** — schaltet sofort
- **Tipp auf die Karte daneben** — öffnet weiterhin die Detailansicht

### Rückmeldung
Auf dem Handy gibt es ein kurzes haptisches Signal. Beim Fahren erscheint ein Ring um das Icon.

### Gut zu wissen
System-Entities wie News oder Wetter sind nicht betroffen — bei ihnen öffnet ein Tipp immer die Ansicht.

---

## Tipp quick-control-halten - Schnellsteuerung

**Title:** Warum muss ich bei Rollläden gedrückt halten?
**Hero:** none
**Tags:** Schnellsteuerung, Sicherheit

Absicht. Ein falsch geschaltetes Licht ist in einer Sekunde korrigiert — ein versehentlich geöffnetes Rollo oder Türschloss nicht.

### Die Regel
- **Riskante Richtung** (öffnen, entriegeln) — etwa eine Sekunde halten. Ein amberfarbener Ring füllt sich als Bestätigung.
- **Sichere Richtung** (schließen, verriegeln) — einfacher Tipp.

### Warum asymmetrisch
Weil der Aufwand, einen Fehler rückgängig zu machen, asymmetrisch ist. Schließen dauert eine Sekunde. Ein unbemerkt geöffnetes Garagentor kostet deutlich mehr.

### Abbrechen
Loslassen, bevor der Ring voll ist — es passiert nichts.

---

## Tipp quick-control-domains - Schnellsteuerung

**Title:** Kann ich wählen, welche Gerätetypen das Icon-Schalten bekommen?
**Hero:** none
**Tags:** Schnellsteuerung, Einstellungen

Ja, für jeden Gerätetyp einzeln.

### Die drei Modi
- **Aus** — das Icon öffnet wie gewohnt die Detailansicht
- **Tippen** — ein Tipp schaltet sofort
- **Halten** — ein Tipp reicht nicht, es braucht den gehaltenen Druck

### Die Voreinstellung
Lichter, Schalter, Ventilatoren, Eingabe-Schalter und Media-Player stehen auf **Tippen**. Rollläden und Schlösser auf **Halten**. Klimageräte und Sauger sind ebenfalls wählbar.

### Wo
Einstellungen → Allgemein → Schnellsteuerung. Der Hauptschalter oben, darunter die Liste der Typen.

---

## Tipp listen-aktionen - Schnellsteuerung

**Title:** Was verbirgt sich hinter dem „⋯" in der Listenansicht?
**Hero:** none
**Tags:** Schnellsteuerung, Liste

Ein Tipp darauf klappt unter der Zeile die wichtigsten Regler des Geräts aus.

### Was erscheint
- **Licht** — Helligkeitsstufen als Knopfreihe
- **Rollladen** — Auf, Stopp, Zu und Positions-Voreinstellungen
- **Klima** — Betriebsmodi

Es sind exakt dieselben Bedienelemente wie in der Detailansicht, nur eben direkt in der Liste.

### Warum das praktisch ist
Für „Licht auf 30 %" musst du weder die Detailansicht öffnen noch einen Slider treffen. Zwei Tipps, fertig.

---

## Tipp helligkeit - Steuerung

**Title:** Wie dimme ich ein Licht?
**Hero:** none
**Tags:** Steuerung, Licht

Zieh am kreisrunden Slider in der Detailansicht. Der Wert in der Mitte zählt live mit.

### Bedienung
- **Ziehen** — überall auf dem Ring, nicht nur am Griff
- **Loslassen** — setzt den Wert
- **Ein/Aus-Knopf** oben im Kreis — merkt sich die letzte Helligkeit und stellt sie beim Einschalten wieder her

### Auf dem Handy
Der Ring ist bewusst großzügig getroffen. Du musst nicht exakt auf der Linie sein.

---

## Tipp farbtemperatur - Steuerung

**Title:** Wie ändere ich die Lichtfarbe?
**Hero:** none
**Tags:** Steuerung, Licht

Über die Modus-Knöpfe unter dem Slider.

### Die Modi
- **Helligkeit** — der Standard
- **Farbtemperatur** — der Kreis wird zum Warm-Kalt-Regler mit passendem Farbverlauf
- **Effekte** — falls dein Licht welche kennt

### Bei Farblampen
Unterstützt das Licht echte Farben, erscheint zusätzlich ein Farbrad. Die Card fragt die Fähigkeiten beim Gerät ab und zeigt nur, was es wirklich kann.

---

## Tipp klima - Steuerung

**Title:** Wie stelle ich die Heizung ein?
**Hero:** none
**Tags:** Steuerung, Klima

Der Kreis-Slider stellt die Zieltemperatur, die Knöpfe darunter den Modus.

### Was du steuerst
- **Zieltemperatur** — am Ring, in den Schritten deines Geräts
- **Modus** — Heizen, Kühlen, Automatik, Aus
- **Voreinstellungen** — Eco, Komfort, Boost, sofern dein Thermostat sie meldet
- **Lüfterstufen und Schwenken** — bei Klimaanlagen, direkt in der Zeile ausklappbar

### Gut zu wissen
Die aktuelle Ist-Temperatur steht klein unter der Zielangabe. Weicht dein Thermostat vom erlaubten Bereich ab, begrenzt die Card den Slider auf das, was das Gerät akzeptiert.

---

## Tipp cover-position - Steuerung

**Title:** Wie fahre ich ein Rollo auf eine bestimmte Position?
**Hero:** none
**Tags:** Steuerung, Rollladen

Der Kreis-Slider stellt die Position in Prozent — 0 ist zu, 100 ist offen.

### Die Knöpfe darunter
Komplett auf, Stopp, komplett zu. Stopp wirkt sofort, auch mitten in der Fahrt.

### Bei Jalousien
Kann dein Gerät die Lamellen kippen, bekommt es einen zweiten Regler dafür. Position und Neigung sind getrennt.

### Während der Fahrt
Ein fahrendes Rollo erscheint als Live-Aktivität in der Insel — du siehst also auch von der Startseite aus, dass es unterwegs ist.

---

## Tipp kontext-tab - Steuerung

**Title:** Wo finde ich Szenen, die zu einem Gerät passen?
**Hero:** none
**Tags:** Steuerung, Szenen

Im zweiten Reiter der Detailansicht: „Kontext".

### Was dort steht
Alle Szenen, Skripte und Automationen, die dieses Gerät betreffen — automatisch gefunden, nach Relevanz sortiert.

### Die Filter
Drei Reiter trennen **Aktionen**, **Favoriten** und **Umgebung**. „Umgebung" zeigt, was im selben Raum passiert, auch wenn es dieses Gerät nicht direkt anfasst.

### Ausführen
Ein Tipp startet die Szene. Eine kurze Einblendung bestätigt, dass es geklappt hat — oder meldet den Fehler, wenn nicht.

---

## Tipp verlauf - Steuerung

**Title:** Wo sehe ich die Historie eines Geräts?
**Hero:** none
**Tags:** Steuerung, Verlauf

Im dritten Reiter der Detailansicht: „Verlauf".

### Was dort ist
- **Diagramme** für 24 Stunden, 7 Tage und 30 Tage
- **Letzte Ereignisse** als chronologische Liste
- **Statistiken** — wie oft geschaltet, wie lange aktiv, durchschnittliche Dauer
- **Tageszeit-Analyse** — wann dieses Gerät typischerweise läuft

### Für jedes Gerät
Der Verlauf funktioniert für alle Entity-Typen, nicht nur für Sensoren. Auch ein Schalter bekommt seine Kurve.

### Woher die Daten kommen
Aus der Home-Assistant-Historie. Wie weit zurück, hängt davon ab, wie lange dein HA Daten aufbewahrt.

---

## Tipp musik - Steuerung

**Title:** Wie steuere ich meine Musik?
**Hero:** none
**Tags:** Steuerung, Musik

Öffne einen Media-Player. Läuft Music Assistant, bekommst du das volle Panel.

### Was das Panel kann
- **Warteschlange** ansehen und leeren
- **Bibliothek durchsuchen** — Titel, Alben, Interpreten
- **Lautsprecher wechseln** und gruppieren
- **Text-zu-Sprache** mit Auswahl der Engine und Sprache
- **Favorit** und **Radio-Modus**

### Die Regler
Lautstärke und Abspielposition liegen als zwei Ringe auf dem Kreis-Slider — beide ziehbar.

### Der Hintergrund
Das Cover des laufenden Titels wird zum Hintergrund der Ansicht.

---

## Tipp bento-anpassen - Startseite

**Title:** Kann ich die Startseite umbauen?
**Hero:** none
**Tags:** Startseite, Bento

Ja — Einstellungen → Allgemein → Startseite.

### Was du bestimmst
- **Welche App in welchem Platz** sitzt (W1 groß, W2 oben rechts, W3/W4 unten geteilt)
- **Das Layout** der Kachelfläche
- **Ob es die Startseite überhaupt gibt** — ausgeschaltet öffnet die Card direkt die Suchliste

### So wählst du
Tippe einen Slot an und such dir die Entity aus. Die Vorschau zeigt sofort, wie es aussieht.

---

## Tipp bento-slider - Startseite

**Title:** Wie wechsle ich zwischen Wetter, News und Terminen?
**Hero:** none
**Tags:** Startseite, Widgets

Das große Widget oben rechts ist ein Karussell.

### Wie es sich bewegt
Es blättert von selbst durch Wetter, Kalender, Aufgaben und News. Wischen wechselt sofort, die Punkte unten zeigen die Position.

### Es merkt sich die Stelle
Öffnest du einen News-Artikel und kommst zurück, steht das Karussell noch auf News — nicht wieder am Anfang.

### Direkt hineinspringen
Ein Tipp auf einen Eintrag im Karussell führt genau dorthin: auf einen Termin in den Kalender an diesem Tag, auf einen Artikel in den Reader.

---

## Tipp begruessung - Startseite

**Title:** Kann ich die Begrüßung ändern oder abschalten?
**Hero:** none
**Tags:** Startseite, Begrüßung

Beides — Einstellungen → Allgemein → Status & Begrüßung.

### Was sie kann
Die Begrüßung passt sich der Tageszeit an und nutzt deinen Namen, wenn Home Assistant ihn kennt. Eigene Texte sind möglich.

### Abschalten
Ein Schalter. Die Begrüßung ist rein dekorativ — ohne sie funktioniert nichts anders.

---

## Tipp termin-anlegen - Kalender

**Title:** Wie lege ich einen Termin an?
**Hero:** none
**Tags:** Kalender, Termine

Kalender öffnen — über die Suche oder die Sidebar — dann den Plus-Knopf.

### Der Dialog
- **Titel** eintippen oder einen Schnell-Chip nehmen (Termin, Meeting, Geburtstag, Arzt, Reise)
- **Datum und Zeit** über die Drehräder
- **Ganztägig** als Schalter
- **Ort** und **Beschreibung** als eigene Unteransichten
- **Kalender** auswählen, falls du mehrere hast

### Wo er landet
Direkt in deinem Home-Assistant-Kalender, über die native Schnittstelle. Kein Zwischendienst, keine Cloud der Card.

### Bearbeiten und löschen
Termin antippen, ändern, sichern. Löschen fragt zweimal — der zweite Tipp bestätigt.

---

## Tipp termin-wiederholen - Kalender

**Title:** Wie erstelle ich wiederkehrende Termine?
**Hero:** none
**Tags:** Kalender, Wiederholung

Im Dialog die Zeile „Wiederholen" antippen.

### Die Muster
Nie, täglich, wöchentlich, monatlich, jährlich.

### Bei komplexeren Regeln
Termine aus anderen Kalendern können ausgefeiltere Wiederholungen haben — „jeden zweiten Freitag" etwa. Die Card zeigt sie als „Benutzerdefiniert" an und lässt den Rest des Termins bearbeiten, ohne die Regel kaputtzumachen.

---

## Tipp kalender-ansichten - Kalender

**Title:** Wie wechsle ich zwischen Tag, Woche, Monat und Jahr?
**Hero:** none
**Tags:** Kalender, Ansichten

Über die Knöpfe am oberen Rand.

### Was jede zeigt
- **Tag** — Stundenraster mit den Terminen als Blöcke
- **Woche** — sieben Spalten, gleiche Logik
- **Monat** — Raster mit Punkten je Termin, heute als roter Kreis
- **Jahr** — zwölf Mini-Monate zum Springen

### Ansichten ausblenden
Nutzt du die Jahresansicht nie, blende sie aus: Kalender → Einstellungen → Sichtbare Ansichten.

---

## Tipp kalender-quellen - Kalender

**Title:** Welche Kalender zeigt die Card an?
**Hero:** none
**Tags:** Kalender, Quellen

Alle Kalender-Integrationen deines Home Assistant — CalDAV, Google, lokale Kalender.

### Automatisch gefunden
Die Card sucht sich alle `calendar.*`-Entitäten selbst zusammen und mischt die Termine, farblich nach Quelle getrennt.

### Auswählen
Kalender → Einstellungen → Kalender. Dort schaltest du einzelne Quellen ab, wenn du sie in der Card nicht sehen willst.

### Neue Termine
In denselben Einstellungen legst du fest, in welchem Kalender ein neuer Termin standardmäßig landet.

---

## Tipp aufgabe-anlegen - Aufgaben

**Title:** Wie erstelle ich eine Aufgabe?
**Hero:** none
**Tags:** Aufgaben, Erstellen

Aufgaben öffnen, Plus-Knopf, Titel eintippen.

### Im selben Dialog
- **Liste** wählen
- **Fälligkeit** setzen
- **Notiz** ergänzen — mit Vorlagen, wenn du welche angelegt hast

### Erledigen
Ein Tipp auf den Kreis links. Die Aufgabe wird durchgestrichen und wandert je nach Filter aus der Liste.

---

## Tipp faelligkeit - Aufgaben

**Title:** Wie setze ich ein Fälligkeitsdatum?
**Hero:** none
**Tags:** Aufgaben, Fälligkeit

Im Dialog die Zeile „Fällig" antippen und Datum und Uhrzeit über die Drehräder einstellen.

### Was danach passiert
- **Bald fällig** — die Aufgabe zeigt ihren Zeitpunkt in der Zeile
- **Überfällig** — die ganze Zeile wird rot, mit Angabe, seit wann

### Warum so deutlich
Überfälliges soll auffallen, ohne dass man danach suchen muss. Auf dem Startbildschirm zeigt das Aufgaben-Widget dieselbe Farbe.

---

## Tipp aufgaben-listen - Aufgaben

**Title:** Wie wechsle ich zwischen mehreren Listen?
**Hero:** none
**Tags:** Aufgaben, Listen

Über die Filter-Pillen oberhalb der Aufgaben.

### Zwei Reihen
- **Oben** — Status: offen, erledigt, überfällig
- **Unten** — deine Listen

### Sie kombinieren sich
„Offen" plus „Einkaufsliste" zeigt genau die offenen Punkte dieser einen Liste.

### Woher die Listen kommen
Die Card sammelt automatisch alle Aufgaben-Integrationen deines Home Assistant ein — lokale To-do-Listen genauso wie angebundene Dienste.

---

## Tipp schedule-anlegen - Zeitpläne

**Title:** Wie plane ich, dass ein Gerät automatisch schaltet?
**Hero:** none
**Tags:** Zeitpläne, Automatisierung

Gerät öffnen, Reiter „Zeitplan", Plus-Knopf.

### Der Editor
- **Uhrzeit** über das Drehrad
- **Aktion** — an, aus, Helligkeit, Temperatur, Position, je nach Gerätetyp
- **Wochentage** als Chip-Reihe
- **Geräte-Einstellungen** für Feinheiten wie Farbe oder Modus

### Voraussetzung
Die Scheduler-Integration (`nielsfaber/scheduler-component`) muss in Home Assistant installiert sein. Ohne sie zeigt der Reiter einen Hinweis statt des Editors.

### Bearbeiten
Zeitpläne lassen sich direkt in der Liste aufklappen und ändern — ohne Unteransicht.

---

## Tipp schedule-wochentage - Zeitpläne

**Title:** Wie stelle ich verschiedene Zeiten für Werktage und Wochenende ein?
**Hero:** none
**Tags:** Zeitpläne, Wochentage

Mit zwei Zeitplänen: einer für Mo–Fr, einer für Sa–So.

### Die Auswahl
Die Wochentags-Chips im Editor sind einzeln antippbar. Ein Tipp wählt aus, ein zweiter ab.

### Pausieren statt löschen
Brauchst du einen Zeitplan zeitweise nicht, schalte ihn ab, statt ihn zu löschen. Er bleibt mit allen Einstellungen liegen.

---

## Tipp schedule-uebersicht - Zeitpläne

**Title:** Wo sehe ich alle Zeitpläne auf einmal?
**Hero:** none
**Tags:** Zeitpläne, Übersicht

Such nach „Zeitpläne" oder öffne die Übersicht aus der Sidebar.

### Was dort steht
Alle Timer und Zeitpläne aller Geräte, mit Domain-Kennzeichnung, Uhrzeit und Wochentagen.

### Filter
Alle, nur Timer, nur Zeitpläne.

### Springen
Ein Tipp auf einen Eintrag führt zum zugehörigen Gerät.

---

## Tipp energie-einrichten - Energie

**Title:** Wie richte ich das Energie-Dashboard ein?
**Hero:** none
**Tags:** Energie, Einrichten

Such nach „Geräte hinzufügen" und wähle Energie-Dashboard.

### Was der Assistent macht
Er liest deine Home-Assistant-Energiekonfiguration aus und übernimmt, was er findet — Netzbezug, Einspeisung, Solar, Batterie, Tarife.

### Was du ergänzt
Was HA nicht kennt, wählst du von Hand nach. Jede Zeile führt zu einer Sensor-Auswahl mit Suche.

### Danach
Das Dashboard erscheint als eigenes Gerät in deiner Suche und lässt sich auch als Startseiten-Kachel setzen.

---

## Tipp energie-werte - Energie

**Title:** Was bedeuten „Auto" und „Manuell" bei den Energie-Werten?
**Hero:** none
**Tags:** Energie, Sensoren

Sie sagen dir, woher die Zuordnung eines Sensors stammt.

### Die zwei Pillen
- **Auto** — der Sensor kam automatisch aus deinen Home-Assistant-Energie-Einstellungen
- **Manuell** — du hast ihn selbst zugewiesen

### Wie die Werte sortiert sind
Nach Typ gruppiert: Leistung (W/kW), Energie (Wh/kWh), Batterie, Tarife sowie Gas und Wasser.

### Wenn ein Wert nicht stimmt
Tippe die Zeile an und wähle einen anderen Sensor. Das ⓘ neben jedem Wert erklärt, was genau gemessen werden soll — hilfreich, wenn mehrere Sensoren ähnlich heißen.

---

## Tipp energie-lesen - Energie

**Title:** Was bedeuten die Kreise im Energie-Dashboard?
**Hero:** none
**Tags:** Energie, Übersicht

Jeder Kreis ist eine Energiequelle oder ein Verbraucher: Netz, Solar, Batterie, Haus.

### Was du siehst
Die Zahlen sind live. Fließt Strom, zeigt der Kreis die aktuelle Leistung; die Richtung verrät, ob du beziehst oder einspeist.

### Anpassen
In den Einstellungen des Dashboards bestimmst du, welcher Wert in welchem Kreis steht.

### Die Diagramme
Unter den Kreisen liegen Verlaufsdiagramme für Tag, Woche, Monat und Jahr — aus den Langzeit-Statistiken von Home Assistant, also lückenlos auch über Monate.

---

## Tipp geraete-bauen - Eigene Geräte

**Title:** Kann ich eigene Geräte-Ansichten bauen — ohne Code?
**Hero:** none
**Tags:** Eigene Geräte, Baukasten

Ja. Such nach „Geräte hinzufügen" und wähle einen Typ.

### Die Typen
- **Energie-Dashboard** — für Strom, Solar, Batterie
- **3D-Drucker** — Druckstatus, Filament, Temperaturen
- **Wetterstation** — Vorhersage und Messwerte
- **Universal** — für alles andere

### Der Ablauf
Typ wählen, Sensoren zuordnen, benennen, fertig. Die Card baut daraus eine vollständige Detailansicht mit Hero, Diagrammen und Sensor-Listen.

### Jederzeit änderbar
Kein YAML, keine Konfigurationsdatei. Alles über die Verwaltung im Integration-Bereich wieder aufrufbar.

---

## Tipp hero-anzeige - Eigene Geräte

**Title:** Was ist die große Anzeige oben im selbstgebauten Gerät?
**Hero:** none
**Tags:** Eigene Geräte, Hero

Der Hero — der Kreis ganz oben in der Detailansicht, für den wichtigsten Wert des Geräts.

### Was du wählst
Bis zu fünf Werte. Mehrere rotieren als Slideshow.

### Bilder statt Zahlen
Entitäten mit einem Bild- oder Kamera-Kennzeichen werden als Foto dargestellt statt als Wert. So bekommt ein 3D-Drucker die Kamera-Ansicht in den Hero.

### Reihenfolge
Über die Pfeile ↑ und ↓ an einer ausgewählten Zeile bestimmst du, in welcher Folge die Slideshow läuft.

---

## Tipp charts-sensoren - Eigene Geräte

**Title:** Warum reicht bei manchen Sensoren die Kurve weiter zurück als bei anderen?
**Hero:** none
**Tags:** Eigene Geräte, Diagramme

Weil es zwei verschiedene Datenquellen gibt — und die Card dir per Farbe sagt, welche greift.

### Die drei Kennzeichen
- **Kumulativ (grün)** — Zählerstände. Volle Statistik für Tag, Woche, Monat und Jahr, direkt aus Home Assistant.
- **Momentan (blau)** — Messwerte wie Temperatur. Ebenfalls volle Statistik.
- **History (orange)** — Sensoren ohne `state_class`. Sie fallen auf die reine Zustandshistorie zurück.

### Der praktische Unterschied
Grün und blau liefern lückenlose Langzeit-Kurven. Orange reicht nur so weit zurück, wie dein Home Assistant die Rohdaten aufbewahrt — oft zehn Tage.

### Wo du das siehst
Beim Bearbeiten eines Universal-Geräts unter „Charts". Das Badge steht neben jedem Sensor.

---

## Tipp sichtbare-entitaeten - Eigene Geräte

**Title:** Wie blende ich einzelne Werte eines Geräts aus?
**Hero:** none
**Tags:** Eigene Geräte, Sichtbarkeit

Beim Bearbeiten des Geräts unter „Sichtbare Entitäten".

### Wie es aufgebaut ist
Ein Schalter pro Entität, gruppiert nach Steuerung, Sensoren, Diagnose und Sonstiges. Bei großen Geräten hilft die Suche darüber.

### Was Ausschalten bedeutet
Die Entität verschwindet aus der Card — in Home Assistant bleibt sie unangetastet. Es ist eine reine Anzeige-Entscheidung.

### Wofür das gut ist
Ein moderner Drucker oder Wechselrichter bringt oft dreißig Diagnose-Werte mit. Fünf davon interessieren dich. Der Rest muss nicht sichtbar sein.

---

## Tipp wallpaper - Aussehen

**Title:** Wie setze ich ein eigenes Hintergrundbild?
**Hero:** none
**Tags:** Aussehen, Hintergrund

Einstellungen → Darstellung → Hintergrundbild.

### Wie es normalerweise aussieht
Ohne eigenes Bild lässt die Card die **Dashboard-Wallpaper deines Home Assistant** durch die Glas-Panels durchscheinen. Aktivierst du ein eigenes Bild, ersetzt es diese.

### Zwei Wege
- **Bild-URL** — Datei nach `config/www/` legen und als `/local/dateiname.jpg` eintragen. Auch `http(s)://…` funktioniert.
- **Galerie** — Vorschaubilder aus deinem Home-Assistant-Medienordner durchblättern und antippen.

### Gut zu wissen
Die Darstellungs-Regler (Helligkeit, Unschärfe, Kontrast, Sättigung, Graustufen) wirken weiterhin — auch auf dein eigenes Bild.

---

## Tipp hintergrund-videos - Aussehen

**Title:** Wie bekomme ich Videos hinter die Geräteansicht?
**Hero:** none
**Tags:** Aussehen, Videos

Lege MP4-Dateien nach dem Namensschema `{domain}_{zustand}.mp4` in deinen Video-Ordner.

### Beispiele
- `light_on.mp4` und `light_off.mp4`
- `cover_open.mp4` und `cover_closed.mp4`
- `climate_on.mp4`, `fan_on.mp4`, `switch_on.mp4`

### Wie es abläuft
Das Video wird **einmal** abgespielt, wenn die Detailansicht sich öffnet — danach bleibt das letzte Bild stehen. Kein Dauerloop, der Rechenleistung frisst.

### Platzhalter
Dateien namens `default_1.mp4` bis `default_10.mp4` werden für Geräte ohne eigenes Video zufällig ausgewählt.

### Einschalten
Einstellungen → Darstellung → Animationen. Desktop und Mobilgeräte lassen sich getrennt schalten — Videos kosten auf dem Handy Daten und Akku.

### Ein Starterpaket
Über dreißig fertige Clips liegen im GitHub-Repo unter `media/videos/`.

---

## Tipp video-ordner - Aussehen

**Title:** Wo genau müssen die Video-Dateien liegen?
**Hero:** none
**Tags:** Aussehen, Videos

An einem von zwei Orten — die Card prüft beide.

### Variante A — der www-Ordner
Pfad in den Einstellungen: `/local/videos`. Die Dateien liegen dann in `config/www/videos/`. (`/local/…` ist die Home-Assistant-Verknüpfung zu `config/www/…`.)

### Variante B — der Medien-Ordner
Lade die Videos über den Home-Assistant-Medien-Browser in einen Ordner hoch, der genauso heißt wie das letzte Stück deines Pfads — also `videos`. Die Card findet ihn über deine Medienquellen, ohne Zugriff auf `www`.

### Die Reihenfolge
Erst wird der www-Pfad geprüft, dann der Medien-Ordner. Beide funktionieren, solange der Ordnername passt.

### Wenn kein Video erscheint
Fast immer ein Tippfehler im Dateinamen. Nur exakt benannte Dateien werden gefunden.

---

## Tipp liquid-glass - Aussehen

**Title:** Was ist Liquid Glass?
**Hero:** none
**Tags:** Aussehen, Design

Ein Glas-Effekt für die Bedienelemente: Lichtbrechung, Glanz und Farbsaum, als läge echtes Glas über dem Hintergrund.

### Wo
Einstellungen → Darstellung → Design → Liquid Glass.

### Was sich einstellen lässt
Vierzehn Regler — Frost, Brechung, Farbsaum, Tönung, Biegung, Glanz und Glanzwinkel, Glanzlicht, Glow, Helligkeit. Jeder mit eigener Erklärung hinter dem ⓘ.

### Für Ungeduldige
Die Voreinstellung sieht gut aus, ohne dass du einen Regler anfasst. Die vierzehn sind für den Feinschliff da, nicht als Pflichtprogramm.

### Auf Safari
Die echte Lichtbrechung ist eine Chromium-Fähigkeit. Auf Safari und iOS greift ein Frost-und-Tönungs-Modus, der dem sehr nahekommt.

---

## Tipp splashscreen - Aussehen

**Title:** Kann ich den Startbildschirm beim Laden ändern?
**Hero:** none
**Tags:** Aussehen, Start

Ja, drei Varianten — Einstellungen → Darstellung → Splashscreen.

### Die Optionen
- **Aus** — die Card erscheint sofort
- **Ladebalken** — der klassische Fortschritt
- **Handschrift** — ein „hello" wird gezeichnet, in zwei Zügen mit Pause dazwischen

### Wann es greift
Die Änderung wirkt beim nächsten Laden der Card, nicht sofort.

---

## Tipp spalten - Aussehen

**Title:** Wie ändere ich die Anzahl der Karten pro Reihe?
**Hero:** none
**Tags:** Aussehen, Raster

Einstellungen → Darstellung → Spalten: vier, fünf oder sechs.

### Die Abwägung
Weniger Spalten heißt größere Kacheln und mehr Ruhe. Mehr Spalten heißt mehr Übersicht bei vielen Geräten.

### Auf dem Handy
Dort entscheidet die Bildschirmbreite. Die Einstellung wirkt auf Tablet und Desktop.

---

## Tipp entitaeten-verstecken - Filter

**Title:** Wie verstecke ich Geräte, die ich nie brauche?
**Hero:** none
**Tags:** Filter, Ausblenden

Einstellungen → Allgemein → Filter → Ausgeschlossene Muster.

### Die Platzhalter
- `*` steht für beliebig viele Zeichen — `sensor.*` trifft alle Sensoren
- `?` steht für genau ein Zeichen

### Beispiele
- `sensor.temp_*` — alle Temperatursensoren mit diesem Präfix
- `binary_sensor.motion_*` — alle Bewegungsmelder
- `*_unavailable` — alles, was auf „_unavailable" endet

### Die Live-Vorschau
Während du tippst, zeigt die Card, welche Entitäten das Muster gerade treffen würde. Kein Blindflug.

### Rückgängig
Muster wieder löschen, fertig. Beim ersten Start sind sinnvolle Standard-Muster vorbelegt — die kannst du genauso ändern.

---

## Tipp schnellauswahl - Filter

**Title:** Gibt es fertige Filter-Pakete?
**Hero:** none
**Tags:** Filter, Vorlagen

Ja — die Schnellauswahl direkt unter den ausgeschlossenen Mustern.

### Wie es geht
Tippe einen Vorschlag an, und sein komplettes Muster-Set landet in deiner Liste. Ein **✓** zeigt, dass ein Set schon aktiv ist.

### Wofür das gut ist
Typische Aufräum-Fälle — nicht verfügbare Entitäten, Diagnose-Werte, technische Hilfsentitäten — mit einem Tipp statt zehn Zeilen Handarbeit.

---

## Tipp versteckte-anzeigen - Filter

**Title:** Wie sehe ich Geräte, die Home Assistant versteckt hat?
**Hero:** none
**Tags:** Filter, Sichtbarkeit

Einstellungen → Allgemein → Filter → Sichtbarkeit.

### Drei Schalter
- **Versteckte Entitäten** — was in HA auf „hidden" steht
- **Deaktivierte Entitäten** — was in HA abgeschaltet ist
- **Diagnose-Entitäten** — technische Werte, die HA normalerweise wegräumt

### Die Voreinstellung
Alle drei sind aus. Die Card respektiert, was du in Home Assistant entschieden hast — nichts rutscht ungefragt durch.

### Wann du sie brauchst
Beim Einrichten eines neuen Geräts, wenn ein Sensor partout nicht auftaucht. Einschalten, finden, wieder ausschalten.

---

## Tipp limits - Filter

**Title:** Die Card lädt langsam — was kann ich tun?
**Hero:** none
**Tags:** Filter, Leistung

Einstellungen → Allgemein → Filter → Limits. Zwei Stellschrauben, die bei großen Installationen viel bringen.

### Maximale Anzahl Entitäten
Begrenzt, wie viele Entitäten überhaupt geladen werden. `0` heißt unbegrenzt. Bei mehreren tausend Entitäten beschleunigt ein Limit den Start deutlich.

### Nur Entitäten mit Raum laden
Blendet alles aus, was keinem Bereich zugewiesen ist. In vielen Installationen sind das genau die technischen Entitäten, die man ohnehin nie sucht.

### Der Nebeneffekt
Weniger geladene Entitäten heißt nicht nur schnellerer Start, sondern auch weniger Rauschen in der Suche.

---

## Tipp filter-toolbar - Filter

**Title:** Kann ich die Filter-Leiste aufräumen oder ausblenden?
**Hero:** none
**Tags:** Filter, Werkzeugleiste

Ja — Einstellungen → Allgemein → Filter.

### Was du steuerst
- **Hauptschalter** — der ganze Filter-Knopf an oder aus. Aus heißt: aufgeräumte Werkzeugleiste ohne Filter-Bedienelemente.
- **Nach Kategorien** und **Nach Räumen** — die beiden Dimensionen einzeln ein- oder ausblenden
- **Aktive Anzahl** — ein Zähler an jedem Chip, der zeigt, wie viele Geräte dieser Gruppe gerade eingeschaltet sind („Lichter 4")

### Der Zähler in der Praxis
Er beantwortet die Frage „brennt noch irgendwo Licht?" ohne einen einzigen Tipp.

---

## Tipp datenschutz - Datenschutz

**Title:** Was sendet die Card ins Internet?
**Hero:** none
**Tags:** Datenschutz, Sicherheit

Nichts von deinen Daten.

### Was nicht passiert
- Keine Telemetrie, kein Tracking, keine Analyse-Dienste
- Keine Cloud-Anbindung, kein Konto
- Keine Zugangsdaten im Browser-Speicher

### Die einzigen externen Abrufe
Zwei Markdown-Dateien von GitHub — der Änderungsverlauf und genau diese Tipps. Ohne Anmeldedaten, ohne Inhalte von dir.

### Wo deine Daten liegen
Einstellungen und gelernte Muster im lokalen Speicher deines Browsers. Alles andere in deinem Home Assistant.

### Zum Nachprüfen
Die Card wird als eine einzige Datei ausgeliefert — die kannst du selbst durchsuchen. Der vollständige Sicherheitsbericht liegt im Repo unter `docs/SECURITY.md` und wird zu jeder Version neu geprüft.

---

## Tipp sprache - Hilfe

**Title:** Wie stelle ich die Sprache der Card ein?
**Hero:** none
**Tags:** Hilfe, Sprache

Einstellungen → Allgemein → App-Sprache.

### Unabhängig von Home Assistant
Die Einstellung gilt nur für die Card. Card auf Englisch bei deutschem Home Assistant funktioniert problemlos.

### Was mitwandert
Menüs, Beschriftungen, Datums- und Wochentagsnamen — und diese Tipps hier.

### Was sonst noch dazugehört
Im selben Bereich stellst du **Währung** (für Energiekosten) und **Zeitformat** (24 oder 12 Stunden) ein. Das Zeitformat wirkt überall: Diagramme, Aktivitäten, Zeitpläne, Insel.

### Weitere Sprachen
Aktuell Deutsch und Englisch. Niederländisch ist als nächstes geplant.

---

## Tipp cache-leeren - Hilfe

**Title:** Die Card zeigt alte Daten — was tun?
**Hero:** none
**Tags:** Hilfe, Cache

Einstellungen → Über → Cache löschen.

### Was das leert
Die Zwischenspeicher für Suche und Vorschläge. Deine Einstellungen, Favoriten und selbstgebauten Geräte bleiben.

### Der große Hammer daneben
„Alle Daten zurücksetzen" löscht wirklich alles — Einstellungen, Favoriten, gelernte Muster, eigene Geräte. Zwei Bestätigungen, aus gutem Grund.

### Wenn das nicht hilft
Ein Neuladen der Seite. Danach die Home-Assistant-Verbindung prüfen — zeigt HA selbst noch aktuelle Werte?

---

## Tipp changelog - Hilfe

**Title:** Wo sehe ich, was sich mit Updates ändert?
**Hero:** none
**Tags:** Hilfe, Updates

Such nach „Änderungsverlauf" oder tippe die entsprechende Kachel auf der Startseite.

### Was dort steht
Jede Version mit Titel, Datum und ausführlicher Beschreibung dessen, was sich geändert hat — und oft auch warum.

### Suchen und filtern
Volltextsuche über alle Einträge, dazu Filter nach Themen-Schlagworten.

### Deine Version
Die aktuell installierte Version steht ganz oben und unter Einstellungen → Über.

---

## Tipp toasts - Hilfe

**Title:** Kann ich die kleinen Bestätigungs-Einblendungen anpassen?
**Hero:** none
**Tags:** Hilfe, Toasts

Ja — Einstellungen → Allgemein → Toasts.

### Drei Dinge
- **Wann** — bei welchen Ereignissen eine Einblendung erscheint
- **Position** — wo auf dem Bildschirm
- **Dauer** — wie lange sie bleibt

### Und die Ruhezeiten
Im selben Bereich liegt das nächtliche Zeitfenster, in dem gar nichts aufploppt. Siehe den Tipp zu den Ruhezeiten.

---
