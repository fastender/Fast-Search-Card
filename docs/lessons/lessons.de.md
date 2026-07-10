# Tipps — Fragen & Antworten

Die wichtigsten Fragen zur Card, jede mit einer Antwort, die auf einen Bildschirm passt. Von „Wie öffne ich die Suche?" bis „Was ist Liquid Glass?".

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
- Antwort: 3–6 Zeilen. Eine Sache pro Tipp. Apple-Tips-Stil.
- Neue Tipps am Ende der passenden Kategorie einfügen, Katalog-Quelle ist
  docs/info-popups/info-popups-catalog.md.
-->

---

## Tipp was-kann-die-card - Erste Schritte

**Title:** Was kann diese Card eigentlich alles?
**Hero:** none
**Tags:** Start, Überblick

Mehr als suchen. Die Card ist ein komplettes Dashboard: Geräte suchen und steuern, Startseite mit Live-Widgets, Kalender, Aufgaben, News, Zeitpläne, Energie-Übersicht — alles in einer Karte, alles lokal auf deinem Home Assistant.

Diese Tipps führen dich der Reihe nach durch alle Bereiche.

---

## Tipp suche-oeffnen - Erste Schritte

**Title:** Wie öffne ich die Suche?
**Hero:** none
**Tags:** Start, Suche

Tippe die Suchleiste an. Die Card klappt nach unten auf und zeigt deine Geräte, gruppiert nach Räumen.

Zum Schließen: nach unten wischen oder daneben tippen.

---

## Tipp geraet-steuern - Erste Schritte

**Title:** Wie steuere ich ein Gerät?
**Hero:** none
**Tags:** Start, Steuerung

Tippe ein Gerät in der Liste an — die Detailansicht öffnet sich mit allen Bedienelementen: Slider für Helligkeit, Regler für Temperatur, Knöpfe für Rollläden.

Noch schneller geht es mit der Schnellsteuerung — siehe Kategorie „Schnellsteuerung".

---

## Tipp zurueck-navigieren - Erste Schritte

**Title:** Wie komme ich wieder zurück?
**Hero:** none
**Tags:** Start, Navigation

Oben links ist immer ein Zurück-Pfeil. Auf dem Handy funktioniert auch eine Wischgeste nach rechts.

Die Card merkt sich, wo du warst — nach einem Gerät landest du wieder in deiner Suchliste, nicht am Anfang.

---

## Tipp startseite-verstehen - Erste Schritte

**Title:** Was zeigt mir die Startseite?
**Hero:** none
**Tags:** Start, Bento

Die Startseite besteht aus Kacheln („Bento-Widgets"): Favoriten, Wetter, Termine, Aufgaben, News, Tipps und Änderungsverlauf. Alles live, alles antippbar.

Auf dem Handy wischst du seitlich durch die großen Widgets.

---

## Tipp tippfehler - Suchen

**Title:** Muss ich Gerätenamen exakt schreiben?
**Hero:** none
**Tags:** Suche, Fuzzy

Nein. Die Suche verzeiht Tippfehler — „Lihct" findet trotzdem dein Licht. Auch Wortteile reichen: „bett lampe" findet die „Schlafzimmer-Bettlampe".

Meist genügen 2–3 Buchstaben, bis der richtige Treffer oben steht.

---

## Tipp raum-filter - Suchen

**Title:** Wie sehe ich nur Geräte aus einem Raum?
**Hero:** none
**Tags:** Suche, Filter

Tippe den Raumnamen ins Suchfeld. Sobald der Vorschlag als Geistertext erscheint, bestätige mit Tab (Desktop) oder Tipp auf den Vorschlag (Handy) — der Raum wird zum blauen Chip, die Liste zeigt nur noch diesen Raum.

Chips lassen sich kombinieren: erst „Kinderzimmer", dann „Lampe".

---

## Tipp chips-verstehen - Suchen

**Title:** Was bedeuten die farbigen Chips im Suchfeld?
**Hero:** none
**Tags:** Suche, Chips

Chips sind aktive Filter. Blau = Raum, Violett = Gerätetyp, Grün = Sensortyp.

Ein Tipp auf einen Chip wählt ihn aus, ein zweiter löscht ihn — wie bei iOS-Mail-Empfängern.

---

## Tipp kategorien - Suchen

**Title:** Wofür stehen Geräte, Sensoren, Aktionen und Custom?
**Hero:** none
**Tags:** Suche, Kategorien

Vier Bereiche, vier Blickwinkel auf dein Zuhause:

- **Geräte** — alles was du schalten kannst: Lichter, Schalter, Klima, Rollläden.
- **Sensoren** — alles was misst: Temperatur, Bewegung, Energie.
- **Aktionen** — Szenen, Skripte, Automationen.
- **Custom** — die eingebauten Apps: Kalender, Aufgaben, News, Einstellungen.

---

## Tipp ansicht-wechseln - Suchen

**Title:** Wie wechsle ich zwischen Gitter- und Listenansicht?
**Hero:** none
**Tags:** Suche, Ansicht

Über das Symbol neben dem Suchfeld. Gitter zeigt große Kacheln, Liste zeigt kompakte Zeilen mit mehr Geräten auf einen Blick.

Die Wahl bleibt gespeichert — auch nach einem Neuladen.

---

## Tipp favoriten-anlegen - Suchen

**Title:** Wie lege ich Favoriten fest?
**Hero:** none
**Tags:** Suche, Favoriten

In der Detailansicht eines Geräts: Tippe das Herz oben rechts. Das Gerät erscheint ab sofort im Favoriten-Tab und im Favoriten-Widget der Startseite.

Gleicher Weg zum Entfernen.

---

## Tipp vorschlaege - Suchen

**Title:** Warum schlägt mir die Card bestimmte Geräte vor?
**Hero:** none
**Tags:** Suche, Vorschläge

Die Card lernt aus deinen Klicks — lokal, ohne Cloud. Was du oft benutzt, rückt nach oben. Was du ignorierst, verliert an Gewicht. Alte Muster verblassen mit der Zeit von selbst.

Zurücksetzen jederzeit: Einstellungen → Vorschläge → Lerndaten löschen.

---

## Tipp quick-control - Schnellsteuerung

**Title:** Wie schalte ich ein Licht mit nur einem Tipp?
**Hero:** none
**Tags:** Schnellsteuerung, Licht

Aktiviere die Schnellsteuerung: Einstellungen → Darstellung → Schnellsteuerung. Danach ist das Geräte-Icon selbst der Schalter — ein Tipp aufs Lampen-Icon, Lampe an. Kein Öffnen der Detailansicht mehr nötig.

Ein Tipp daneben (auf den Kartenrest) öffnet weiterhin die Detailansicht.

---

## Tipp quick-control-halten - Schnellsteuerung

**Title:** Warum muss ich bei Rollläden gedrückt halten?
**Hero:** none
**Tags:** Schnellsteuerung, Sicherheit

Absicht. Ein falsch geschaltetes Licht ist in einer Sekunde korrigiert — ein versehentlich geöffnetes Rollo oder Schloss nicht. Deshalb: riskante Richtung = gedrückt halten, bis der Ring sich füllt. Sichere Richtung (schließen, abschließen) = einfacher Tipp.

Asymmetrisch, mit System.

---

## Tipp quick-control-domains - Schnellsteuerung

**Title:** Kann ich wählen, welche Gerätetypen das Icon-Schalten bekommen?
**Hero:** none
**Tags:** Schnellsteuerung, Einstellungen

Ja. Einstellungen → Darstellung → Schnellsteuerung öffnet eine Liste aller Gerätetypen. Jeder Typ kennt drei Modi: Aus, Tippen oder Halten.

Standard: Lichter/Schalter/Ventilatoren auf Tippen, Rollläden/Schlösser auf Halten.

---

## Tipp listen-aktionen - Schnellsteuerung

**Title:** Was verbirgt sich hinter dem „⋯" in der Listenansicht?
**Hero:** none
**Tags:** Schnellsteuerung, Liste

Ein Tipp auf „⋯" klappt unter der Zeile die wichtigsten Regler aus — Helligkeits-Stufen beim Licht, Position beim Rollo, Modus bei der Klimaanlage. Dieselben Bedienelemente wie in der Detailansicht, nur direkt in der Liste.

---

## Tipp helligkeit - Steuerung

**Title:** Wie dimme ich ein Licht?
**Hero:** none
**Tags:** Steuerung, Licht

In der Detailansicht: Zieh am kreisrunden Slider. Der Wert in der Mitte zählt live mit. Loslassen setzt den Wert.

Der Ein/Aus-Knopf sitzt oben im Kreis und merkt sich die letzte Helligkeit.

---

## Tipp farbtemperatur - Steuerung

**Title:** Wie ändere ich die Lichtfarbe?
**Hero:** none
**Tags:** Steuerung, Licht

Unter dem Helligkeits-Slider sitzen die Modus-Knöpfe: Helligkeit, Farbtemperatur, Effekte. Tippe „Farbtemperatur" — der Kreis wird zum Warm-Kalt-Regler.

Unterstützt dein Licht Farben, erscheint zusätzlich ein Farbrad.

---

## Tipp klima - Steuerung

**Title:** Wie stelle ich die Heizung ein?
**Hero:** none
**Tags:** Steuerung, Klima

Der Kreis-Slider stellt die Zieltemperatur. Darunter wählst du den Modus — Heizen, Kühlen, Auto, Aus. Die Leiste unten zeigt Voreinstellungen und Lüfterstufen, falls dein Gerät sie kann.

---

## Tipp cover-position - Steuerung

**Title:** Wie fahre ich ein Rollo auf eine bestimmte Position?
**Hero:** none
**Tags:** Steuerung, Rollladen

Der Kreis-Slider stellt die Position in Prozent — 0 ist zu, 100 ist offen. Die Knöpfe darunter fahren komplett auf, stoppen oder komplett zu.

Kipp-Lamellen (bei Jalousien) haben einen eigenen Regler, wenn dein Gerät sie meldet.

---

## Tipp kontext-tab - Steuerung

**Title:** Wo finde ich Szenen, die zu einem Gerät passen?
**Hero:** none
**Tags:** Steuerung, Szenen

Zweiter Tab in der Detailansicht („Kontext"). Dort sammelt die Card alle Szenen, Skripte und Automationen, die dieses Gerät betreffen — sortiert nach Relevanz. Ein Tipp führt sie aus, eine Bestätigung erscheint als kurze Einblendung.

---

## Tipp verlauf - Steuerung

**Title:** Wo sehe ich die Historie eines Geräts?
**Hero:** none
**Tags:** Steuerung, Verlauf

Dritter Tab in der Detailansicht („Verlauf"). Diagramme für 24 Stunden, 7 Tage oder 30 Tage, dazu die letzten Ereignisse als Liste und Statistiken wie Einschaltdauer und Änderungshäufigkeit.

Funktioniert für jedes Gerät — auch für Sensoren.

---

## Tipp musik - Steuerung

**Title:** Wie steuere ich meine Musik?
**Hero:** none
**Tags:** Steuerung, Musik

Öffne einen Media Player. Läuft Music Assistant, bekommst du das volle Panel: Warteschlange, Bibliothek durchsuchen, Lautsprecher wechseln, Text-zu-Sprache. Lautstärke und Fortschritt liegen auf dem Kreis-Slider.

Das Cover des laufenden Titels wird zum Hintergrund.

---

## Tipp bento-anpassen - Startseite

**Title:** Kann ich die Startseite umbauen?
**Hero:** none
**Tags:** Startseite, Bento

Ja. Einstellungen → Allgemein → Startseite. Dort bestimmst du, welches Widget in welchem der vier Plätze sitzt — oder schaltest die Startseite ganz aus, wenn du direkt in der Suche starten willst.

---

## Tipp bento-slider - Startseite

**Title:** Wie wechsle ich zwischen Wetter, News und Terminen?
**Hero:** none
**Tags:** Startseite, Widgets

Das große rechte Widget ist ein Karussell: Es blättert automatisch durch Wetter, Kalender, Aufgaben und News. Wischen wechselt manuell, die Punkte unten zeigen die Position.

Die Card merkt sich, wo du warst — auch nach einem Ausflug in die Detailansicht.

---

## Tipp statsbar - Startseite

**Title:** Was ist die schmale Leiste ganz oben?
**Hero:** none
**Tags:** Startseite, StatsBar

Die Status-Leiste — Live-Werte auf einen Blick: Wetter, Uhrzeit, Stromverbrauch, Solar. Welche Widgets erscheinen, bestimmst du unter Einstellungen → Allgemein → Status & Begrüßung.

---

## Tipp begruessung - Startseite

**Title:** Kann ich die Begrüßung ändern oder abschalten?
**Hero:** none
**Tags:** Startseite, Begrüßung

Beides. Einstellungen → Allgemein → Status & Begrüßung. Die Begrüßung passt sich der Tageszeit an, kennt deinen Namen und lässt sich mit eigenen Texten füttern — oder komplett ausschalten.

---

## Tipp termin-anlegen - Kalender

**Title:** Wie lege ich einen Termin an?
**Hero:** none
**Tags:** Kalender, Termine

Kalender öffnen (über Suche oder Sidebar) → Plus-Knopf. Titel eintippen oder einen der Schnell-Chips nehmen (Termin, Meeting, Arzt …), Datum und Zeit über die Drehräder wählen, sichern.

Der Termin landet direkt in deinem Home-Assistant-Kalender — keine Cloud dazwischen.

---

## Tipp termin-wiederholen - Kalender

**Title:** Wie erstelle ich wiederkehrende Termine?
**Hero:** none
**Tags:** Kalender, Wiederholung

Beim Anlegen: Zeile „Wiederholen" antippen. Fünf Muster stehen bereit — täglich, wöchentlich, monatlich, jährlich oder nie.

Komplexere Regeln (etwa „jeden zweiten Freitag") zeigt die Card an, wenn sie aus anderen Kalendern kommen.

---

## Tipp kalender-ansichten - Kalender

**Title:** Wie wechsle ich zwischen Tag, Woche, Monat und Jahr?
**Hero:** none
**Tags:** Kalender, Ansichten

Über die Knöpfe am oberen Rand des Kalenders. Der Monat zeigt Punkte pro Termin, die Woche zeigt Zeitblöcke, das Jahr zeigt zwölf Mini-Monate.

Welche Ansichten überhaupt angeboten werden, stellst du in den Kalender-Einstellungen ein.

---

## Tipp kalender-quellen - Kalender

**Title:** Welche Kalender zeigt die Card an?
**Hero:** none
**Tags:** Kalender, Quellen

Alle Kalender-Integrationen deines Home Assistant — CalDAV, Google, lokale Kalender. Die Card findet sie automatisch und mischt die Termine farblich getrennt.

Einzelne Kalender lassen sich in den Kalender-Einstellungen ausblenden.

---

## Tipp aufgabe-anlegen - Aufgaben

**Title:** Wie erstelle ich eine Aufgabe?
**Hero:** none
**Tags:** Aufgaben, Erstellen

Aufgaben öffnen → Plus-Knopf → Titel eintippen. Optional: Liste wählen, Fälligkeit setzen, Notiz ergänzen — alles im selben Dialog, im Stil der Erinnerungen-App.

---

## Tipp faelligkeit - Aufgaben

**Title:** Wie setze ich ein Fälligkeitsdatum?
**Hero:** none
**Tags:** Aufgaben, Fälligkeit

Beim Anlegen oder Bearbeiten: Zeile „Fällig" antippen, Datum und Uhrzeit über die Drehräder einstellen.

Überfällige Aufgaben färben sich rot — unübersehbar, mit Absicht.

---

## Tipp aufgaben-listen - Aufgaben

**Title:** Wie wechsle ich zwischen mehreren Listen?
**Hero:** none
**Tags:** Aufgaben, Listen

Über die Filter-Pillen oberhalb der Aufgaben. Erste Reihe: Status (offen, erledigt). Zweite Reihe: deine Listen. Beide Filter kombinieren sich — „offen" plus „Einkaufsliste" zeigt genau das.

Die Card sammelt automatisch alle Aufgaben-Integrationen deines Home Assistant ein.

---

## Tipp schedule-anlegen - Zeitpläne

**Title:** Wie plane ich, dass ein Gerät automatisch schaltet?
**Hero:** none
**Tags:** Zeitpläne, Automatisierung

Gerät öffnen → Tab „Zeitplan" → Plus. Uhrzeit über das Drehrad wählen, Aktion festlegen (an, aus, Temperatur …), Wochentage antippen, sichern.

Braucht die Scheduler-Integration (nielsfaber/scheduler-component) in Home Assistant.

---

## Tipp schedule-wochentage - Zeitpläne

**Title:** Wie stelle ich verschiedene Zeiten für Werktage und Wochenende ein?
**Hero:** none
**Tags:** Zeitpläne, Wochentage

Zwei Zeitpläne anlegen: einer mit Mo–Fr, einer mit Sa–So. Die Wochentags-Chips im Editor machen die Auswahl zum Ein-Tipp-Spiel.

---

## Tipp schedule-uebersicht - Zeitpläne

**Title:** Wo sehe ich alle Zeitpläne auf einmal?
**Hero:** none
**Tags:** Zeitpläne, Übersicht

Suche „Zeitpläne" oder öffne die Zeitplan-Übersicht aus der Sidebar. Dort stehen alle Timer und Zeitpläne aller Geräte — filterbar, mit Sprung direkt zum jeweiligen Gerät.

---

## Tipp energie-einrichten - Energie

**Title:** Wie richte ich das Energie-Dashboard ein?
**Hero:** none
**Tags:** Energie, Einrichten

Suche „Geräte hinzufügen" → Energie-Dashboard. Der Assistent zieht sich die Sensoren aus deiner Home-Assistant-Energiekonfiguration automatisch; was fehlt, wählst du von Hand nach.

Danach taucht das Dashboard als eigenes Gerät in deiner Suche auf.

---

## Tipp energie-lesen - Energie

**Title:** Was bedeuten die Kreise im Energie-Dashboard?
**Hero:** none
**Tags:** Energie, Übersicht

Jeder Kreis ist eine Energiequelle oder ein Verbraucher: Netz, Solar, Batterie, Haus. Die Zahlen sind live. In den Einstellungen des Dashboards bestimmst du, welche Werte in welchem Kreis stehen.

---

## Tipp wallpaper - Aussehen

**Title:** Wie setze ich ein eigenes Hintergrundbild?
**Hero:** none
**Tags:** Aussehen, Hintergrund

Einstellungen → Darstellung → Hintergrundbild. Entweder eine Bild-URL eintragen oder die Galerie öffnen und per Vorschaubild aus deinem Home-Assistant-Medienordner wählen.

Das Bild füllt die ganze Ansicht — nicht nur die Card.

---

## Tipp hintergrund-videos - Aussehen

**Title:** Wie bekomme ich Videos hinter die Geräteansicht?
**Hero:** none
**Tags:** Aussehen, Videos

Lege MP4-Dateien nach `/config/www/fast-search-videos/` — benannt nach dem Muster `licht an = light_on.mp4`. Öffnest du dann ein Licht, läuft das Video geloopt und stumm hinter den Reglern.

Ein Starterpaket mit 30+ Clips liegt im GitHub-Repo unter `media/videos/`.

---

## Tipp liquid-glass - Aussehen

**Title:** Was ist Liquid Glass?
**Hero:** none
**Tags:** Aussehen, Design

Ein Glas-Effekt für die Bedienelemente: Lichtbrechung, Glanz, Farbsaum — als läge echtes Glas über dem Hintergrund. Einstellungen → Darstellung → Design → Liquid Glass.

Vierzehn Regler für Feinschmecker. Die Voreinstellung sieht ohne Drehen gut aus.

---

## Tipp splashscreen - Aussehen

**Title:** Kann ich den Startbildschirm ändern?
**Hero:** none
**Tags:** Aussehen, Start

Ja, drei Varianten: Aus (sofort loslegen), Ladebalken (klassisch) oder die handgeschriebene „hello"-Animation. Einstellungen → Darstellung → Splashscreen.

---

## Tipp spalten - Aussehen

**Title:** Wie ändere ich die Anzahl der Karten pro Reihe?
**Hero:** none
**Tags:** Aussehen, Raster

Einstellungen → Darstellung → Rasterspalten: 4, 5 oder 6 Spalten. Weniger Spalten = größere Kacheln, mehr Spalten = mehr Übersicht.

---

## Tipp entitaeten-verstecken - Filter

**Title:** Wie verstecke ich Geräte, die ich nie brauche?
**Hero:** none
**Tags:** Filter, Ausblenden

Einstellungen → Filter → Ausgeschlossene Muster. Dort trägst du Muster mit Platzhaltern ein — `sensor.*` versteckt alle Sensoren, `*_unavailable` alles Nichterreichbare.

Die Live-Vorschau zeigt sofort, was ein Muster treffen würde. Fertige Vorlagen gibt es auch.

---

## Tipp versteckte-anzeigen - Filter

**Title:** Wie sehe ich Geräte, die Home Assistant versteckt hat?
**Hero:** none
**Tags:** Filter, Sichtbarkeit

Standardmäßig respektiert die Card, was HA versteckt oder deaktiviert hat. Willst du diese Einträge doch sehen: Einstellungen → Filter → Sichtbarkeit — drei Schalter für versteckte, deaktivierte und Diagnose-Entitäten.

---

## Tipp datenschutz - Filter

**Title:** Was sendet die Card ins Internet?
**Hero:** none
**Tags:** Filter, Datenschutz

Nichts von deinen Daten. Keine Telemetrie, kein Tracking, keine Cloud-Anbindung. Die einzigen externen Abrufe sind zwei Markdown-Dateien von GitHub (Änderungsverlauf und diese Tipps) — ohne Anmeldedaten, ohne Inhalte von dir.

Der vollständige Sicherheits-Bericht liegt im GitHub-Repo: `docs/SECURITY.md`.

---

## Tipp sprache - Profi-Tipps

**Title:** Wie stelle ich die Card auf Deutsch oder Englisch?
**Hero:** none
**Tags:** Einstellungen, Sprache

Einstellungen → Allgemein → App-Sprache. Die Einstellung ist unabhängig von der Sprache deines Home Assistant — Card auf Englisch, HA auf Deutsch geht also auch.

Weitere Sprachen sind in Arbeit; Niederländisch kommt als nächstes.

---

## Tipp cache-leeren - Profi-Tipps

**Title:** Die Card zeigt alte Daten — was tun?
**Hero:** none
**Tags:** Hilfe, Cache

Einstellungen → Über → Cache löschen. Das leert die Zwischenspeicher für Suche und Vorschläge; deine Einstellungen und Favoriten bleiben erhalten.

Der große Hammer daneben — „Alle Daten zurücksetzen" — setzt wirklich alles zurück. Doppelte Bestätigung, aus gutem Grund.

---

## Tipp changelog - Profi-Tipps

**Title:** Wo sehe ich, was sich mit Updates ändert?
**Hero:** none
**Tags:** Hilfe, Updates

Suche „Änderungsverlauf" oder tippe das Changelog-Widget auf der Startseite. Jede Version ist dokumentiert — durchsuchbar und nach Themen gefiltert.

---

## Tipp zeit-sortierung - Profi-Tipps

**Title:** Kann die Card morgens andere Geräte zeigen als abends?
**Hero:** none
**Tags:** Profi, Sortierung

Ja — die Zeit-Sortierung lernt, welche Geräte du zu welcher Tageszeit benutzt, und sortiert die Liste entsprechend. Morgens die Kaffeemaschine oben, abends das Wohnzimmerlicht.

Aktivieren über das Uhr-Symbol in der Werkzeugleiste oder in den Filter-Einstellungen.

---

## Tipp toasts - Profi-Tipps

**Title:** Kann ich die kleinen Bestätigungs-Einblendungen anpassen?
**Hero:** none
**Tags:** Profi, Toasts

Ja. Einstellungen → Allgemein → Toasts. Dort bestimmst du, bei welchen Ereignissen eine Einblendung erscheint, wo sie sitzt und wie lange sie bleibt.

---

## Tipp geraete-bauen - Profi-Tipps

**Title:** Kann ich eigene Geräte-Ansichten bauen — ohne Code?
**Hero:** none
**Tags:** Profi, Integration

Ja. Suche „Geräte hinzufügen" und wähle einen Typ: Energie-Dashboard, 3D-Drucker, Wetterstation oder Universal. Sensoren auswählen, benennen, fertig — die Card baut die Ansicht.

Kein YAML. Jederzeit wieder änderbar.

---
