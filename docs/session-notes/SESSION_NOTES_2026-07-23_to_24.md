# Session-Notizen 2026-07-23 → 2026-07-24 (v1.1.2192 → v1.1.2212, 21 Releases)

Zwei Tage, zwei Hälften: erst Infrastruktur (DataProvider-Split fertig, Test-Suite
26 → 80, Bundle-Messung, Notification-Center-Abschluss + Live-Reiter), dann die
große Insel-Neugestaltung — drei Mockup-Runden bis zum finalen
Ein-Kapsel-Orbitalmodell, plus eine Fehlersuche-Saga, die zwei falsche Diagnosen
und einen Zombie hinterließ.

---

## 1 · DataProvider-Split (Roadmap #4) — FERTIG, 1419 → 730 LOC (v2192–2194)

Reihenfolge wie geplant: erst das Netz knüpfen, dann schneiden.

- **v2192:** `tests/dataprovider.spec.js` (6 Zusagen-Tests) + erste drei Scheiben:
  `providers/devTestPatterns.js`, `hooks/useDataProviderEvents.js`,
  `hooks/useNotificationLane.js`.
- **v2193:** `providers/entitiesLoader.js` (~200 LOC) — der volle HA-Ladelauf als
  **reines Modul, kein Hook**: nichts zu abonnieren ⇒ keine Effekt-Reihenfolge,
  die brechen kann.
- **v2194:** `hooks/useEntityStream.js` (~270 LOC) — das Herzstück
  (state_changed-Abo, rAF-Batching, updateEntityState). Aufrufstelle exakt an der
  alten Abo-Position, mit ⚠️-Kommentar: **Effekt-REIHENFOLGE ist Semantik** —
  die Lane seedet direkt über dem hassRef-Sync; vertauscht = 6 Tests rot.
- Bleibt bewusst im Provider: Favoriten/Settings/Suche/Suggestions/Tracking und
  das `contextValue`-Memo (Referenzstabilität IST der Zweck).

**Lehren:** Storage/Sprache per `addInitScript` VOR dem Laden setzen (Modul-Stores
lesen beim Import) · TDZ beim Hereinreichen später definierter Funktionen →
Hüllen `() => fn()` · reine async-Läufe als MODUL herauslösen, nicht als Hook.

## 2 · Test-Suite: 26 → 80 Tests, JEDE sichtbare Oberfläche (v2195–2201)

- **Testhaus möbliert** (v2195): `callWS`-Registry-Mock mit Räumen — ohne Areas
  filterte der Ladelauf ALLE Geräte weg, alles hinter der Suche war untestbar.
  Dienstaufruf-Protokoll (`window.__serviceCalls`) → „Knopf wirkt" wird an dem
  geprüft, was bei HA ankommt, nicht am Pixel.
- Neue Suiten: detail (7) · watches/quiet-hours (7) · bento (9) ·
  notifications (8) · calendar-todos (7, relative Daten — der Zeitzonen-Fix von
  v2189 bleibt gedeckt; to-do/Kalender holen via callWS/callApi, NICHT states) ·
  hero-transition (6: Animation = Zusagen prüfen, nicht Pixel; Module per
  `await import('/src/…')` in page.evaluate; Doppel-rAF für rAF-Commits).
- **4 echte Fehler gefunden:** rohe `ui.tooltips.*`-Schlüssel in allen
  Detail-Reitern (seit v1723! Tooltips als „unreferenziert" gelöscht, aber
  TabNavigation liest sie) · Sensor-Reiter positionsindiziert falsch beschriftet
  → `utils/detailTabs.js` als EINE Quelle (v2196) · Center-Kopf zeigte rohes
  „Active" (v2199) · Lane-Seed-Reihenfolge (v2192).
- Bento-Falle: „nicht Platzhalter" ist auch von leerem String erfüllt → Helfer
  verlangt ECHTEN Text. Bei UI-Fehlschlag ZUERST den Screenshot ansehen.

## 3 · Bundle-Track — gemessen und GESCHLOSSEN (v2198)

505 KB gzip: ¼ Abhängigkeiten, ¾ eigener Code. Per Stub-Build GEMESSEN:
chart.js 60 KB (12 %), liquid-glass 16 KB (3 %) — beide hängen an
Standard-An-Funktionen. Code-Splitting unmöglich (HACS = eine Datei) ⇒ Einsparung
nur durch Funktionsstreichung = Produktentscheidung. **User: nicht weiter
optimieren — Thema zu.** 🐞 Nebenfund: Dev-Panel hing an
`hostname==='localhost'` → traf echte HA-Nutzer; jetzt `import.meta.env.DEV`.

## 4 · Notification-Center komplett + Live-Reiter (v2199–2205)

- Steps 2+3 waren gebaut, aber ungeprüft — 8 Tests decken jetzt die Kernzusage:
  `alert.*`/Danger → LOKALES Ack (kein HA-Dienst), `persistent_notification.*` →
  echter dismiss-Service; Severity-Chips; „1 Stunde stumm".
- ⚠️ **ViewRef-Deps müssen ZAHLEN sein** — Arrays (neue Identität pro Render) =
  Revisions-Endlosschleife, Karte fror ein.
- **v2205: Live als dritter Reiter** (Übersicht | Live | Verlauf, User-Entscheid)
  — Reiter sagen WAS, Chips WIE streng. Deep-Link von der Insel via
  `setPendingCenterTab` (Modul-Feld, View liest beim Mounten).
- v2202: Mitteilungs-Kachel poliert — Icon fehlte in `iconMap`, Name in
  `deviceNames` (dieselbe Lücke wie v1612), Live-Zahl über Entity-Attribute
  (Signatur-Riegel gegen Schreib-Schleifen).

## 5 · Die Insel: vom Alert-Verdrängen zum Orbitalmodell (v2203–2212)

**Mockup-getriebener Prozess** — `island-mockup.html` (Maße/Material, Regler)
und `alert-live-mockup.html` (Varianten A Satellit / B Chip / C Übernehmen ⭐ /
C₂ visionOS / D Banner / E Ruhegesicht / F Kondensation / H Stresstest /
I integriert). Jede Runde: bauen → User spielt → Entscheid einfrieren.
Beide Dateien liegen unversioniert im Wurzelverzeichnis.

**Entscheidungs-Chronik (User, eingefroren):** C1-Übernahme (nicht visionOS-C₂) ·
größer (52 px), helleres Glas · keine Flanken · keine Uhr („total sinnlos") ·
Ruhegesicht = Wetter + Energie + Fakten-Roll IN der Kapsel, ohne Trennstrich ·
Roll „alt sinkt weg, neu kommt von oben", minimal und langsamer (4-s-Takt) ·
feste Kapselbreite (440 px / min(92vw,360px)) · Langläufer kondensieren ·
Chips IN die Kapsel statt Satelliten · Kacheln NEBENEINANDER (Überlappung
matschig) · max. 2 Chips · echte Karten-SVG-Icons statt Emojis · aufgeklappte
Liste feste Höhe + CustomScrollbar · Kopf-Tipper schließt · Roll = EXAKT die
Aktiv-Zahlen der Kategorieleiste mit Deep-Link · Wetterwert → Wetter-Entity ·
Energiewert → Energy-Dashboard.

**Endzustand (v2209–2212):**
- **Übernahme (C1):** NEUE Meldung übernimmt 6 s mit Stufenfarbe + SVG-Zeitring →
  kondensiert in den Meldungs-Chip. **Boot-Gnade 5 s** (Bestand beim Mounten
  kündigt sich nicht an — Tests: Gnade abwarten ODER den Chip prüfen, der kommt
  IMMER).
- **Langläufer:** `partitionLiveActivities` — Timer/endsAt kondensieren NIE
  („sind das Jetzt"), Stetiges nach 90 s → Kachel-Chip (kategorie-getönte
  weißliche Kacheln, „+n"), Tipp → Live-Liste (330 px, scrollbar).
- **Ruhegesicht:** Wetterwert + `pickPowerInfo` (betragsgrößter power-Sensor ≈
  Hausgesamt; ≥950 W → „1,2 kW" lokalisiert) + Fakten-Roll aus **neuem
  `utils/subcategoryMap.js`** — geteilt mit der SubcategoryBar, denn die Insel
  zählte vorher ROHE States („9 lights on") während die Leiste kuratierte Geräte
  zählt („6"). Gerätebasis kommt per stabilem `getDevices`-Prop
  (`useCallback(() => devicesRef.current, [])`). Alles verlinkt:
  Roll → `fsc-open-subcategory`, Wetter → `fsc-open-entity`,
  Energie → `fsc-open-energy`. Punkt weicht dem Chip.

## 6 · Die Fehlersuche-Saga (v2206–2208) — Lehrstück

Tablet-Bugs des Users → drei Erkenntnisse, die bleiben:

1. **Shadow-DOM-Retargeting:** Die Karte lebt in HA in `attachShadow`, der
   Dev-Harness mountet OHNE Shadow. Dokumentweite Klick-Handler mit
   `el.contains(e.target)` waren in HA IMMER falsch (Zeilen „nicht klickbar"),
   alle Tests grün. **Regel: `e.composedPath().includes(el)`.**
   Harness-Blindfleck notiert — diese Fehlerklasse kann er nicht fangen.
2. **Video-Ruckeln:** die Pille über der Detail-View zog jeden Videoframe durch
   ihren backdrop-blur → eingeklappt überm Video stilles Glas
   (`data-detail`/`data-expanded`-Regel), aufgeklappt echtes.
3. **Der „Geist" war ein Zombie:** die Dev-Seite mountet die Karte SELBST in
   `#app`, der Harness eine ZWEITE — unsichtbar, bis die Insel z-index bekam;
   dann malte und KLICKTE die Dev-Instanz über dem Test-Container. Zwei falsche
   Zwischen-Diagnosen („Compositing-Artefakt", „absolute bricht Hit-Testing")
   ausdrücklich WIDERRUFEN. Gefunden über Instanz-IDs im Log + dokumentweite
   Zählung. Der Harness legt `#app` jetzt still.

Dazu kleiner Beifang: Schließ-Ruck = Anker kehrte in den Fluss zurück, während
die Liste noch schrumpfte → fester Anker + Überlauf nach unten ·
`locator.click()` scrollt selbst 41 px („scroll into view") — sah wie App-Bug
aus, rohe Mausereignisse zeigten die Wahrheit · Roll-Rechtsblitzer (v2210) =
popLayout hält alt+neu 1 Frame beide im Fluss → **Raster-Stapel
(`gridArea:'1/1'`), popLayout ist aus der Insel verbannt**; Frame-für-Frame
nachgemessen.

## 7 · ⚠️ Arbeitsregel aus zwei Schnittunfällen

`src/` und `package.json` sind GITIGNORED — **kein git-Netz für Quelltext!**

- Unfall 1 (v2209): TakeoverContent-Ersatz riss ExpandedHeadContent +
  IslandLiveList mit → restauriert.
- Unfall 2 (v2212): Icon-Aufräumen riss `RollingDigits` mit → aus beobachtetem
  Verhalten auf Raster-Stapel rekonstruiert.

**Regel: nach jedem Python-Blockschnitt die Definitionen der Datei gegen ihre
Nutzungen greppen** (`grep -c "^const X"` vs. `"<X"`).

## 8 · Offen

- **Settings-Reorg (Vorschlag liegt beim User):** „Insel"-Bereich bündelt
  Dauerwerte (Wetter- und Energie-Picker, auto/manuell!) + Live-Aktivitäten;
  „Benachrichtigungen" behält Toasts + Ruhezeiten. Picker erst NACH dem
  Struktur-Okay bauen — in einem Zug.
- Energie-Heuristik kann auf dem echten Setup danebengreifen → der manuelle
  Picker ist die Antwort (Teil der Reorg).
- Nachtgesicht ohne Wetter-Entity = leer · Lauftext bei Überlauf noch nicht in
  der Karte (feste Breite nutzt Ellipsis) · Ambient-Modus (#9) wartet weiter.
- User verifiziert v2212 auf dem Tablet.
