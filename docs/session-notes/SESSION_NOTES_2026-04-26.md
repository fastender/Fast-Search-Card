# Session Notes — 2026-04-26

**Stand am Ende:** v1.1.1277. **20 Releases** an einem Tag (v1.1.1258 → v1.1.1277). Schwerpunkt-Verschiebung im Lauf des Tages: Vormittags News-Polish, Mittag Migration News→all_schedules-Design, Nachmittag/Abend ScheduleTab-Inline-Edit + Picker-Bugs. **Cliffhanger:** Wir haben uns entschieden, den `IOSPicker` komplett neu zu bauen — als reaktive Preact-Komponente in 5 Phasen. Heute Abend NICHT mehr angefangen.

---

## 1. Tagesübersicht

### News (v1.1.1258 → v1.1.1267) — 9 Releases
Komplette Umstellung des News-Designs:

| Version | Was |
|---|---|
| 1259 | fastender/fast-news-reader als Empfehlung in allen Hint-Texten + JSDoc |
| 1260 | Native Scrollbar im Article-Detail versteckt + CustomScrollbar dort eingebaut |
| 1261 | Time-Bucket-Gruppierung mit Sticky-Headers (Heute/Gestern/Diese Woche/Älter) |
| 1262 | Datum aus Cards raus, Source-Name mit Gradient-Fade-Truncate |
| 1263 | Per-Feed Kategorie-Override entfernt — `entry.category` direkt aus fast-news-reader |
| 1264 | Bucket-Headers im Room-Header-Style (statt sticky), echte Feed-Icons via `channel.image`/`channel.icon` |
| 1265 | Article-Detail Split-Layout (Hero links / Text rechts) — **wurde später revidiert** |
| 1266 | Article-Image zu `detail-left` icon-background (full cover wie Video-Background-Pattern), Search+Status-Filter getrennt von Topic-Tabs |
| 1267 | News-Bundle: Search-Button → detail-tabs, Status+Topics in einer Reihe, Bookmark-Icon, Quellen/Topics/Themen Mode-Cycle |
| 1268 | Dedicated Mode-Cycle-Button (vorher dual-purpose), Chip-Toggling, multi-tag-Support, "Other"-Bucket |
| 1269 | Article-Detail Prev/Next Nav-Arrows, Keyboard-Nav, Mode-Button mit per-Mode-Farben |
| 1270 | **PurgeCSS-Bug** — `mode-*` Klassen wurden gestrippt (dynamic className), Safelist erweitert. Plus Top-Right Nav-Arrows + Ghost-List Nav-Fix |

### all_schedules adoptiert News-Design (v1.1.1271 → v1.1.1272) — 2 Releases

| Version | Was |
|---|---|
| 1271 | Komplette Übernahme des News-Patterns: Detail-Tabs `[overview, search, settings, refresh]`, Toolbar mit `.news-filter-bar`, Status-Pills + Domain-Chips, `.news-article-card`-Layout, 6 neue Domain-Badge-Farben (climate/light/cover/switch/fan/media_player), Container-Restyle, Header-Stats. **Migration-Pattern dokumentiert** für nächste Entities |
| 1272 | Inline-Edit: Click → ScheduleTab embedded mit `initialEditItem`-Prop, Auto-Edit-Mode (kein Navigate weg) |

### ScheduleTab Bug-Wave (v1.1.1273 → v1.1.1277) — 5 Releases

| Version | Was |
|---|---|
| 1273 | TimePicker-Constructor-Aufruf gefixt (3-arg → 4-arg, options landeten als periodElement), 24h-Mode in TimePicker, list-flash beim auto-edit ausgeblendet, Header zeigt Gerätename beim Edit, Zeitformat-Row aus dem Picker entfernt (gehört in System-Settings) |
| 1274 | all_schedules inline-edit Polish: `onClose`-Prop für ScheduleTab (Cancel back-nav), action-key-Translations gefixt (`t('schedule.X')` → `t('X')`, Doppel-Namespace), Footer entfernt, Grouping-Cycle Typ/Geräte/Räume, **Globale 24h/AM-PM Setting** in Allgemein nach Währung |
| 1275 | TimePicker zeigt jetzt echten Wert beim Aufklappen — **Root cause: `div.picker { display: none }` per default → IOSPicker init während Container 0 Höhe hat → scrollTop greift nicht**. Fix mit ResizeObserver. Plus center-band Hairlines vereinheitlicht (3 versetzte Stücke → eine durchgehende Linie auf `.time-picker-container::before/::after`) |
| 1276 | TodoDetailView CSS scoped — zwei ungescopte `.time-picker-separator { background: transparent; z-index: 11 }`-Rules überschrieben den Schedule-Picker-Gradient global |
| 1277 | TimePicker-Layout für 12h-Mode (3 Wheels) gefixt — `> div:first-child/last-child max-width: 50%` ersetzt durch `> div:not(.time-picker-separator) { flex: 1 }` |

### Picker-Polishing-Iteration die NICHT mehr gebuilt wurde (Stand: code committed, kein Release)
- "24h" aus Period-Choices entfernt (war redundant — wenn periodElement da ist, sind wir per Definition im 12h-Mode)
- Repeat-Wert beim Edit aus `item.repeat_type` setzen (war hardcoded auf "Einmalig"), `initializeRepeatPicker` initialisiert Wheel auf den aktuellen Wert
- Separator-Gradient in zwei separate 90px-Overlays gesplittet (statt durchgehender 210px-Gradient mit Stops bei 42.86%/57.14%) — pixelgenau identisch zu `.picker-up`/`.picker-down`

**Diese Änderungen sind in den Source-Files drin aber noch nicht released.** Morgen entweder mit-builden oder verwerfen je nach Picker-Rebuild-Entscheidung.

---

## 2. Aktuelle Picker-Architektur — Was kaputt ist

`src/components/IOSTimePicker.jsx` (668 Zeilen, 4 Klassen) ist die zentrale Picker-Implementierung. Als Klassen-basierte vanilla-DOM-Manipulation in einem Preact-Codebase fundamental falsch positioniert. Heute Abend gründlich analysiert — Ergebnis:

### Akute Bugs (silent failures)
- `console.log` schippt nach Production in `IOSPicker.updateData()` und `DatePicker` (5+ Stellen)
- `timePickerRef.current.setHourMode(value)` — **existiert nicht**, silent TypeError, von setTimeout geschluckt. Dead code seit Zeitformat-Row entfernt
- `timePickerRef.current.reinitHours()` — **existiert nicht**, silent TypeError
- `timePickerRef.current.setTime(hour, minute)` — **existiert nicht**, silent. War der ursprüngliche Workaround für den `display: none`-Bug der jetzt mit ResizeObserver gefixt ist

### Memory Leaks
- `TimePicker.updateHoursPicker()` ruft `new IOSPicker(...)` ohne Cleanup des alten — ResizeObserver bleibt attached, scroll-listener auch
- `DatePicker.setDate()` ruft `init()` neu — gleicher Pattern, alle 3 Sub-Picker werden ohne Cleanup neu instanziiert
- Keine `destroy()`-Methods auf irgendeiner Klasse

### Architektur-Schwächen
- `IOSPicker.init()` ist eine ~600-Zeichen-Mega-Zeile (Zeile 16) — kompletter DOM-Setup in einem Statement
- `TimePicker(hoursEl, minutesEl, periodEl, options)` 4-positional-args → war Quelle des v1.1.1273-Bugs
- Magic Numbers (`22.5°`, `90px translateZ`, `lineHeight*7`, `lineHeight*3`) gekoppelt aber nicht als Konstanten dokumentiert
- CSS-Coupling: hängt von `.picker-wrapper`, `.clone-scroller`, `.picker-up`, `.picker-down`, `.picker-scroller`, `.option`, `.is-hidden`, `.is-center` ab — aber CSS-Rules leben in `ScheduleTab.css`, nicht co-located
- Imperatives Pattern: jeder Consumer braucht `useEffect` + `useRef` + manuelle Init-Logik
- `is24h = !periodElement || hourMode === '24h'` — zwei orthogonale Bedingungen verschmolzen
- `lastVisibleRange`-Tracking in `updateRotation()` brittle — bei Desync bleiben Options hidden/visible
- `smoothScrollTo()` rekursive `requestAnimationFrame` ohne Cancel-Mechanismus

### Library-Eval (react-ios-time-picker)
User hatte https://github.com/MEddarhri/react-ios-time-picker vorgeschlagen. Verworfen weil:
1. **Archiviert** (vor wenigen Tagen) — keine Upstream-Bugfixes
2. Löst nur 1 von 5 Pickern (TimePicker — aber Action/Scheduler/Days/Repeat brauchen weiterhin generic IOSPicker)
3. Andere UX-Philosophie (Popup-Input vs. inline-Wheel-in-Tabellenzeile)
4. Bricht die globale 24h/AM-PM-Setting (Library hat eigenen `use12Hours`-Prop pro Instanz)
5. React→Preact-Compat-Layer im kritischen UI-Pfad

→ **Entschieden: Eigener Phasen-Rebuild.**

---

## 3. Phasen-Plan für morgen — Picker-Rebuild

Reactive Preact-Komponente bauen. Eine `<PickerWheel>` als Kern, daraus kompositorisch alles andere. ~7h Arbeit insgesamt, 5 in sich abgeschlossene Releases.

### Phase 1 (~2h) — Core: `<PickerWheel>` Komponente

**Ziel:** Generischer Single-Column-Wheel mit value/onChange-Props. Komplett standalone testbar.

**API-Vorschlag:**
```jsx
<PickerWheel
  options={['00','01','02', ...]}   // string[] der Optionen
  value="21"                         // aktueller Wert (controlled)
  onChange={(value) => setHour(value)}
  height={210}                       // optional, default 210px
  lineHeight={30}                    // optional, default 30px
  className=""                       // optional
/>
```

**Internals:**
- Preact-Komponente mit `useEffect` für Setup/Cleanup
- 3D-Cylinder-Effekt (rotate-X) wie aktuell
- ResizeObserver-Pattern für display:none-Visibility (aus aktuellem Fix übernehmen)
- Touch + Mouse-Scroll-Handling über `cloneScroller`-Element
- Kein eigenes Color/Background — kommt von außen via CSS-Variablen oder Wrapper
- **Cleanup-Garantie**: alle Listener und Observer in der useEffect-cleanup-Funktion entfernen

**Co-located CSS** (gleicher Ordner): `PickerWheel.module.css` oder `PickerWheel.css` mit allen `.picker-*`-Klassen unter einem Root-Selektor (`.fsc-picker-wheel`).

**Datei-Lokationen:**
- `src/components/picker/PickerWheel.jsx` (neu)
- `src/components/picker/PickerWheel.css` (neu, oder Modul)
- Demo/Test-Page (optional): `src/components/picker/__demo__/PickerDemo.jsx`

**Acceptance-Kriterien:**
- Click+Scroll funktioniert
- Touch funktioniert (Mobile)
- Wenn Container von display:none → display:block wechselt, scrollt korrekt zum value
- Cleanup beim Unmount: keine residual Listener oder Observer
- onChange feuert nach Scroll-End (nicht bei jedem Pixel)
- Kein console.log

**Build:** Phase 1 produziert KEIN Release — nur die Komponente, ungenutzt im Bundle. Verifizierbar via Demo-Page falls gewünscht.

### Phase 2 (~1h) — `<TimePickerWheel>` aus PickerWheel komponieren

**API:**
```jsx
<TimePickerWheel
  value="21:00"                  // HH:MM string
  onChange={(formatted, h, m) => setTime(formatted)}
  format="auto"                  // 'auto' (liest is24hFormat()) | '24h' | '12h'
  minuteStep={5}                 // optional, default 5
/>
```

**Render:** 2 oder 3 `<PickerWheel>` nebeneinander (hours / minutes / optional period) plus Separator (Doppelpunkt-SVG). Width-Logik aus aktuellem Layout-Fix (`flex: 1; min-width: 0` für jede Wheel-Spalte).

Liest `is24hFormat()` aus `src/utils/timeFormatPreference.js` (existiert bereits).

**Co-located CSS:** `TimePickerWheel.css` mit Container-Layout, Separator-Styling, durchgehender Hairline-Pattern.

**Build:** Auch noch kein Release — nur Komponente fertig.

### Phase 3 (~2h) — ScheduleTab umstellen, NUR Time-Picker-Teil

**Ziel:** Im `SchedulePickerTable` die alten `pickerRefs.hoursRef/minutesRef/periodRef` plus `initializeTimePicker(...)` durch ein `<TimePickerWheel value={timeValue} onChange={setTime} />` ersetzen.

Andere Picker (Action, Scheduler, Days, Repeat) bleiben ZUNÄCHST auf der alten `IOSPicker`-Klasse. Hybrid-Zustand für Phase 3.

**Files to touch:**
- `src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx` — Time-Wheels durch `<TimePickerWheel>` ersetzen
- `src/components/tabs/ScheduleTab.jsx` — `initializeTimePicker`-Call entfernen, `pickerRefs.hoursRef/minutesRef/periodRef` entfernen, `timeValue` als Prop binden
- `src/components/tabs/ScheduleTab/utils/pickerInitializers.js` — `initializeTimePicker` entfernen (oder als Stub für Backwards-Compat)

**Acceptance-Kriterien:**
- 24h-Modus zeigt korrekten Wert beim Edit-Open (auch bei display:none Initial-Render)
- 12h-Modus zeigt korrekten Wert + AM/PM
- Wheel scrollt bei Re-Mount sauber zum gespeicherten Wert
- Cancel/Save funktioniert wie bisher
- Kein Memory-Leak bei Mehrfach-Open (User öffnet Schedule A, Cancel, öffnet Schedule B, ...)

**Release:** v1.1.1278 (oder höher je nach Stand). Erstes echtes Sichtbares Ergebnis.

### Phase 4 (~1h) — TodoFormDialog umstellen

**Files to touch:**
- `src/system-entities/entities/todos/components/TodoFormDialog.jsx` — `new TimePicker(...)`-Call ersetzen durch `<TimePickerWheel>`

**Acceptance-Kriterien:**
- Todo-Edit öffnet Time-Picker mit dem korrekten gespeicherten Wert
- AM/PM funktioniert wenn global aktiv
- Globale 24h/AM-PM-Setting wirkt jetzt auch hier (bisher nicht — siehe Note in v1.1.1274 Versionsverlauf)

**Release:** v1.1.1279

### Phase 5 (~1h) — Action/Days/Repeat-Picker auch über `<PickerWheel>`, alte Klassen löschen

**Plan:**
- `<SingleSelectWheel>` Wrapper über PickerWheel für Single-Choice (Action, Scheduler, Repeat)
- `<MultiSelectWheel>` Wrapper für Wochentage (oder direkter Switch zu chip-style Multi-Select?)

**Files to remove:**
- `src/components/IOSTimePicker.jsx` — komplette Datei kann weg sobald letzter Consumer migriert
- `src/components/tabs/ScheduleTab/utils/pickerInitializers.js` — alle initialize* Helpers werden überflüssig

**Files to touch:**
- `src/components/tabs/ScheduleTab.jsx` — alle Picker-Init-useEffects entfernen
- `src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx` — alle Picker durch React-Komponenten ersetzen

**Release:** v1.1.1280 — Picker-Rebuild ist abgeschlossen.

---

## 4. Globale Setting fast-news-reader (Status: Bereits live in Production)

Heute eingeführt, nutzt schon fast-news-reader als zentralen RSS-Source. Memory-Eintrag aktualisieren falls noch nicht geschehen — aber das ist ein anderes Thema.

---

## 5. Einstiegspunkte für Morgen

### Was als ersten Schritt machen
1. Diese Notes lesen — 10 Min
2. **Entscheidung:** Die nicht-gebauten Picker-Polish-Änderungen aus dem Stand vor dem Picker-Rebuild — verwerfen oder mitnehmen?
   - "24h aus Period-Choices entfernen" ([IOSTimePicker.jsx:240](src/components/IOSTimePicker.jsx#L240)) — **mitnehmen**, ist neutral und gehört in Phase 1
   - Repeat-Wert aus Backend setzen ([editStateLoaders.js:73-113](src/components/tabs/ScheduleTab/utils/editStateLoaders.js)) + `initializeRepeatPicker` mit currentValue ([pickerInitializers.js:140](src/components/tabs/ScheduleTab/utils/pickerInitializers.js#L140)) — **bauen + releasen** als v1.1.1278 BEVOR Picker-Rebuild startet, da Bugfix orthogonal zum Rebuild
   - Separator-Gradient gesplittet ([ScheduleTab.css:485-503](src/components/tabs/ScheduleTab/styles/ScheduleTab.css#L485)) — **bauen + releasen** zusammen mit dem Repeat-Fix
3. Phase 1 starten: `<PickerWheel>` Komponente bauen

### Wichtige Dateien
- **Picker-Quellcode**: `src/components/IOSTimePicker.jsx` (was wir ersetzen)
- **Aktuelle Consumer**:
  - `src/components/tabs/ScheduleTab.jsx` (großer Consumer, 600+ Zeilen)
  - `src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx` (DOM-Slots für Picker)
  - `src/components/tabs/ScheduleTab/utils/pickerInitializers.js` (alle `new IOSPicker(...)` Calls)
  - `src/system-entities/entities/todos/components/TodoFormDialog.jsx` (eigene `new TimePicker(...)` Stelle)
- **Globale 24h/AM-PM Setting**: `src/utils/timeFormatPreference.js` (read/writeTimeFormat, is24hFormat) — funktioniert bereits, neuer PickerWheel sollte das direkt lesen
- **Picker-CSS**: `src/components/tabs/ScheduleTab/styles/ScheduleTab.css` Zeilen ~290-510 — die `.picker-*` Klassen die im Rebuild co-located werden müssen

### Aktuelle Version (Stand Session-Ende)
- **v1.1.1277** ist deployed
- Source-Files haben bereits Code für ein nicht-gebautes v1.1.1278 (Period-Choices, Repeat-State, Separator-Split)

### Nicht vergessen
- Build-Flow ist `echo "Y" | ./build.sh` dann separater commit/push von `docs/versionsverlauf.md`
- Version lebt in 2 Files: `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` UND `src/system-entities/entities/versionsverlauf/index.js`
- PurgeCSS-Safelist in `postcss.config.cjs` — wenn neue dynamische Klassen kommen, da reinpacken
- Repo hat `.gitignore` der ALLES außer `dist/`, `docs/`, `hacs.json`, `README.md`, `info.md`, `.gitignore` ignoriert — Source-Files sind lokal-only

---

## 6. Status-Tabelle aller Picker-Consumer

| Consumer | Datei | Picker-Typ | Status |
|---|---|---|---|
| ScheduleTab Action | `pickerInitializers.js` `initializeActionPicker` | Single-Select | Wird Phase 5 ersetzt |
| ScheduleTab Position (Cover) | `pickerInitializers.js` `initializePositionPicker` | Single-Select (0-100%) | Wird Phase 5 ersetzt |
| ScheduleTab Scheduler | `pickerInitializers.js` `initializeSchedulerPicker` | Single-Select | Wird Phase 5 ersetzt |
| ~~ScheduleTab TimeFormat~~ | ~~`pickerInitializers.js`~~ | ~~Single-Select~~ | **Entfernt v1.1.1273** |
| ScheduleTab Days | `pickerInitializers.js` `initializeDaysPicker` | Multi-Select | Wird Phase 5 ersetzt |
| ScheduleTab Repeat | `pickerInitializers.js` `initializeRepeatPicker` | Single-Select | Wird Phase 5 ersetzt |
| ScheduleTab Time | `pickerInitializers.js` `initializeTimePicker` | TimePicker | Wird Phase 3 ersetzt |
| TodoFormDialog Time | `TodoFormDialog.jsx` direkt `new TimePicker(...)` | TimePicker | Wird Phase 4 ersetzt |
| DatePicker | `IOSTimePicker.jsx` Klasse | DatePicker | **Aktuell ungenutzt?** Prüfen ob noch Consumer existieren — sonst nur Dead-Code-Cleanup |
| MultiSelectPicker | `IOSTimePicker.jsx` Klasse | Multi-Select | Wahrscheinlich nur ScheduleTab Days — beim Phase 5 prüfen |

### Quick-Check für Dead-Code
Vor Start von Phase 1 lohnt: `grep -rn "DatePicker\|MultiSelectPicker" src --include="*.jsx" --include="*.js"` — wenn nur noch Eigenreferenzen in `IOSTimePicker.jsx`, sind die Klassen tot.

---

## 7. Risiken & Vorsichtsmaßnahmen

### Risiko 1: Regression im Schedule-Edit
- ScheduleTab ist die HAUPTSÄCHLICH genutzte Edit-UI für Zeitpläne (auch via all_schedules inline-edit). Bug = User kann keine Zeitpläne mehr bearbeiten.
- **Mitigation**: Nach Phase 3 ausführlich testen — Schedule erstellen, editieren, löschen, vor allem mit verschiedenen domains (cover, climate, light, switch).

### Risiko 2: Touch-Handling auf iOS
- IOSPicker hat über die Jahre wahrscheinlich subtile Touch-Edge-Cases gefixt die wir mit dem Rebuild verlieren könnten
- **Mitigation**: `cloneScroller`-Pattern (native scroll mit overlay-3D-rotation) übernehmen — ist eh die saubere Lösung und browser-native
- iOS-Safari-Test bei jedem Phasen-Release

### Risiko 3: ResizeObserver-Polyfill
- Aktueller Fix nutzt `ResizeObserver` (modern, alle aktiven Browser). Verfügbar seit Safari 13.1, Chrome 64. Falls ältere HA-Frontend-Versionen relevant sind: prüfen
- **Mitigation**: Wir nutzen ResizeObserver schon — Fallback bei `typeof ResizeObserver === 'undefined'` einbauen wenn nötig

### Risiko 4: Memory-Leak nicht wirklich tot
- Auch nach Phase 5 könnte es subtile Leaks geben (DOM-Elemente, React-State, Event-Bus-Subscriptions)
- **Mitigation**: Vor Phase-5-Release: 50× Schedule öffnen+schließen, Heap-Snapshot in DevTools machen, Detached-DOM-Nodes prüfen

### Risiko 5: Visueller Regression
- Aktuelles Design ist kalibriert auf bestimmte Pixel-Werte (90px, 120px Hairlines, 22.5° rotation, 90px translateZ). Neue Komponente muss visuell IDENTISCH sein
- **Mitigation**: Side-by-side-Screenshot-Vergleich nach Phase 1 + Phase 3

---

## 8. Was offen bleibt nach Phase 5

- `MultiSelectWheel` für Days — vielleicht durch eine bessere UX ersetzen (chip-row statt wheel)? User-Entscheidung. Phase 5 macht erstmal nur API-Migration, kein UX-Redesign.
- Alte `DatePicker`-Klasse — wenn ungenutzt, einfach löschen. Wenn genutzt: in Phase 5 mit-rebuilden
- `setHourMode`, `reinitHours`, `setTime` aus alten Caller-Sites entfernen (waren Dead-Calls). Mit Phase 5 automatisch erledigt da gesamter Caller-Code neu

---

## 9. Pattern-Check für Future-Entities

Heute haben wir das **Migration-Pattern für system entities** auf die news-Toolbar gefestigt (siehe Versionsverlauf v1.1.1271 für 6-Schritte-Migration). Wenn morgen Zeit übrig ist, könnten weitere Entities harmonisiert werden:
- `weather` — hat eigene Toolbar, könnte profitieren  
- `versionsverlauf` — schon nahe, hat aber andere Action-Buttons
- `todos` — hat extensive Settings-Sub-Views, müsste vorsichtig migriert werden

Aber: **Picker-Rebuild zuerst**. Sonst bauen wir auf wackliger Foundation weiter.

---

*Notes geschrieben am 2026-04-26 22:11 nach 20 Releases. Nächste Session: Phase 1 (PickerWheel-Komponente), aber ZUERST die offenen 3 Picker-Polish-Fixes (Period-Choices, Repeat-Backend-Wert, Separator-Split) als v1.1.1278 ausspielen damit wir mit cleaner Baseline in den Rebuild gehen.*
