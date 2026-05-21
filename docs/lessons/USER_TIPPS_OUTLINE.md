# User-Tipps — Gliederung (Draft v0)

Ziel: `lessons.de.md` (aktuell Dev-Patterns) durch ein **endnutzerseitiges Handbuch im Apple-Tipps-Stil** ersetzen, das die `TippsView`-System-Entity füllt.

**Stil-Regeln (aus dem Apple-Tipps-App-Vorbild):**
- Ein Tipp = ein Bildschirm = ein Konzept
- Hero-Bild oben (oder `none`), Titel mittig groß, 2-4 kurze Absätze drunter
- Aktiv formuliert ("Tippe…", "Streiche…", "Halte gedrückt…"), keine technischen Begriffe wenn vermeidbar
- Pro Tipp eine konkrete Handlung, kein Feature-Dump
- Maximal ~150 Wörter, eher weniger

**Format pro Eintrag** (= existierender Tipps-Parser):
```
## Tipp <slug> - <Kategorie>

**Title:** Klarer Aktionssatz
**Hero:** none|filename.jpg
**Tags:** Tag1, Tag2

### <Sektion> (z.B. "Was", "So geht's", "Tipp")
…

---
```

---

## Vorgeschlagene Kategorien (8)

Apple's Tipps-App hat ~6-8 "Sammlungen". Unsere Card hat genug Features für 8 sinnvoll gefüllte Kategorien:

### 1. Erste Schritte — *Loslegen mit der Card*
Erste 5 Minuten. Was tippen, wo das Detail-View aufgeht, wie man wieder rauskommt.

| Slug | Titel | Was es zeigt |
|---|---|---|
| `card-oeffnen` | Tippe die Suchleiste an, um loszulegen | Card aus dem kompakten Zustand öffnen |
| `geraete-suchen` | Tippe einen Gerätenamen ein | Basis-Suche, Live-Resultate |
| `detail-oeffnen` | Tippe ein Gerät, um es zu steuern | Detail-View öffnen, Zurück-Geste |
| `bento-startseite` | Die Bento-Startseite zeigt dir alles auf einen Blick | Bento erklären, Widget-Klicks |
| `suche-schliessen` | Streiche nach unten oder tippe daneben | Card kollabieren |

### 2. Suchen & Finden — *Das richtige Gerät schneller finden*

| Slug | Titel | Was es zeigt |
|---|---|---|
| `fuzzy-search` | Vertipper sind kein Problem | Fuzzy-Search ("ligth" findet "Light") |
| `unterkategorien` | Filtere nach Raum oder Gerätetyp | Sub-Category Bar |
| `favoriten` | Halte ein Gerät länger, um es zu favorisieren | Long-Press → Favorit |
| `letzte-geraete` | Zuletzt benutzte Geräte erscheinen oben | Recent-System |
| `pattern-filter` | Verstecke Geräte mit Mustern | Wildcard-Patterns (advanced) |
| `voice-input` | Tippe das Mikro für Sprachsuche | Voice-Input |

### 3. Detailansicht & Steuerung — *Geräte präzise bedienen*

| Slug | Titel | Was es zeigt |
|---|---|---|
| `circular-slider` | Drehe den Ring für Helligkeit oder Temperatur | CircularSlider Drag |
| `power-toggle` | Tippe die Mitte, um an/aus zu schalten | Toggle-Geste |
| `farbtemperatur` | Wärmeres oder kühleres Licht | Color-Temp-Slider |
| `klimasteuerung` | Heizen, Kühlen, Lüften — wechsle den Modus | Climate HVAC modes |
| `cover-steuerung` | Rolladen mit präzisem Schieberegler | Cover-Slider |
| `music-assistant` | Suche & spiele Musik direkt aus der Card | Music-Assistant-Panel |
| `tab-wechsel` | Wechsle zwischen Steuerung, Verlauf & Plan | Tab-Bar verstehen |
| `kontext-tab` | Sieh verbundene Sensoren auf einen Blick | Context-Tab |

### 4. Kalender & Termine — *Apple-Calendar im Wohnzimmer*

| Slug | Titel | Was es zeigt |
|---|---|---|
| `termin-anlegen` | Tippe + oben rechts, um einen Termin zu erstellen | Add-Event-Flow |
| `multi-day-events` | Mehrtägige Termine spannen sich über die Tage | Multi-Day-Bars (v1.1.1582) |
| `wiederholung` | Wähle, wie oft sich ein Termin wiederholt | 5 Presets |
| `eigene-wiederholung` | "Alle 2 Wochen, Mo+Fr, 10 Mal" — geht | Custom-RRULE-Editor (v1.1.1580) |
| `ganztaegig` | Schalte "Ganztägig" für Tagestermine | All-Day toggle |
| `wochenansicht` | Sieh deine ganze Woche auf einem Blick | Week-View Multi-Day-Bars |

### 5. Aufgaben & Notizen — *To-do und Listen*

| Slug | Titel | Was es zeigt |
|---|---|---|
| `aufgabe-erstellen` | Tippe + um eine Aufgabe hinzuzufügen | Add-Todo |
| `aufgabe-erledigen` | Tippe den Kreis, um zu erledigen | Check-Animation |
| `faelligkeitsdatum` | Setze ein Datum, um Aufgaben zu sortieren | Due-Date |
| `listen-wechseln` | Wechsle zwischen Listen oben | List-Switcher |

### 6. Schedules & Automatisierung — *Zeitpläne ohne YAML*

| Slug | Titel | Was es zeigt |
|---|---|---|
| `schedule-anlegen` | Lege einen Zeitplan direkt an | Schedule-Tab Add |
| `wochentage` | Wähle, an welchen Tagen er läuft | Day-Picker |
| `pausieren` | Schalte einen Schedule temporär aus | Toggle |
| `schedule-uebersicht` | Sieh alle deine Schedules an einem Ort | AllSchedulesView |

### 7. News, Stats & Energie — *Information auf einen Blick*

| Slug | Titel | Was es zeigt |
|---|---|---|
| `news-hinzufuegen` | Füge RSS-Feeds für deine Nachrichten hinzu | News-Setup |
| `news-lesen` | Tippe einen Artikel zum Lesen | NewsDetail |
| `energy-dashboard` | Sieh, wie viel dein Haus verbraucht | EnergyView |
| `energie-zeitraum` | Wechsle zwischen Tag, Monat, Jahr | Period-Picker |
| `stats-bar` | Die Leiste oben zeigt deine wichtigsten Zahlen | StatsBar |
| `stats-anpassen` | Welche Werte erscheinen, kannst du bestimmen | StatsBarSettings |

### 8. Anpassen & Apps — *Mach die Card zu deiner*

| Slug | Titel | Was es zeigt |
|---|---|---|
| `sprache-wechseln` | DE / EN — wechselbar in den Einstellungen | Language-Toggle |
| `bento-anpassen` | Wähle, welche Widgets erscheinen | Bento-Settings |
| `sidebar-anpassen` | Welche Apps sichtbar sind | Sidebar-Items |
| `themes` | Hell, Dunkel, Auto | Appearance |
| `greetings` | Persönliche Begrüßung am Morgen | Greetings-Bar |
| `apps-uebersicht` | Versionsverlauf, Tipps & Co. findest du in der Sidebar | System-Entities erklären |
| `versionsverlauf` | Sieh, was neu ist | VersionsList |
| `privatsphaere` | Verstecke private Geräte aus der Suche | Privacy-Patterns |

---

## Volumen-Abschätzung

- **8 Kategorien** × ø 5 Tipps = **~42 Tipps**
- Pro Tipp ~80-150 Wörter = **~5'000 Wörter total**
- Schreibzeit grob: **8-12h für alle Tipps** (60-90 sec Recherche + Schreiben pro Tipp wenn das Feature gut bekannt ist)
- Hero-Bilder (optional): Screenshots der jeweiligen UI-Stellen — können später nachgereicht werden, `Hero: none` ist gültig

## Implementierungsplan (vorschlag)

1. **Diese Gliederung** finalisieren (du sagst welche Kategorien/Tipps weg, dazu, umbenannt)
2. **Datei-Setup:** entweder `lessons.de.md` umwidmen (aktuelle Dev-Patterns nach `lessons/DEV_PATTERNS.de.md` retten) ODER neue Datei `tipps.de.md` und `TippsView`-Loader umstellen
3. **Phase 1:** Erste Schritte + Suchen & Finden (10 Tipps, ~2h) — covered die häufigsten Fragen
4. **Phase 2:** Detailansicht + Kalender (14 Tipps, ~3h)
5. **Phase 3:** Rest (18 Tipps, ~4h)
6. **Phase 4 (optional):** Hero-Bilder Screenshot-Sammlung
7. **Phase 5:** EN-Variante (`tipps.en.md`) — kann maschinell vorübersetzt + händisch überprüft werden

## Offene Fragen für dich

1. **Tonalität:** Du-Form ("Tippe…") oder Sie-Form? Apple nutzt Du in DE.
2. **Umfang:** Sollen wir wirklich **alle** Features abdecken, oder erstmal die meistgenutzten (Suchen + Detail + Bento + Settings)?
3. **Dev-Tipps:** Die aktuellen 7 Refactor-Tipps in `lessons.de.md` — komplett raus, oder als separate "Für Entwickler"-Kategorie behalten? Ich tendiere zu "raus aus der User-Facing-Tippsview, aufbewahren in `docs/lessons/DEV_PATTERNS.de.md` für die Memory-Referenz".
4. **Reihenfolge der Kategorien:** Apple sortiert nach "Wahrscheinlichkeit dass User das braucht" — Erste Schritte zuerst. OK so?
5. **Versionierung:** Markiere ich neuere Features (Multi-Day-Bars, Custom-RRULE) als "Neu in 2026.05"? Apple macht das.
