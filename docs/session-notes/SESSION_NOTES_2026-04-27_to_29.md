# Session Notes — 2026-04-27 bis 2026-04-29

**Stand am Ende:** v1.1.1301. **24 Releases über drei Tage** (v1.1.1278 → v1.1.1301).

Schwerpunkt-Bogen:
- **Tag 1 (27.04):** IOSPicker-Rebuild Phasen 3-6 + Days-UX-Redesign abgeschlossen, der gesamte Plan aus den 26.04-Notes durchgezogen
- **Tag 2 (28.04):** Climate-Schedule-Bugs, Schemamodus für Zeitpläne, visionOS-Picker-Redesign, Settings-Polish-Welle
- **Tag 3 (29.04):** Settings-Polish-Welle abgeschlossen, Versionsverlauf-Filter + Such-Pattern

---

## 1. Release-Tabelle

| Tag | Version | Was |
|---|---|---|
| 27.04 | 1278 | Picker-Polish (Period-Choices, Repeat-State, Separator-Split) — letzte Reste der 26.04-Vorbereitung released |
| 27.04 | **1279** | **Phase 3: ScheduleTab Time-Picker → `<TimePickerWheel>`** |
| 27.04 | **1280** | **Phase 4: TodoFormDialog → `<TimePickerWheel>`** + globale 24h-Einstellung wirkt jetzt auch in Todos |
| 27.04 | **1281** | **Phase 5: Action / Position / Scheduler / Days / Repeat → `<PickerWheel>` + `<MultiSelectWheel>`**; `pickerInitializers.js` gelöscht |
| 27.04 | **1282** | **Phase 6: Climate-Picker + Todo-DatePicker → `<PickerWheel>` / `<DatePickerWheel>`**; `IOSTimePicker.jsx` (~660 LOC) gelöscht |
| 27.04 | 1283 | Days-UX-Redesign: Wheel + Auswahl-Button → flache Chip-Row (1 Tap = Toggle) |
| 28.04 | **1284** | Climate-Schedule lossless edit — `set_hvac_mode` etc. werden bei Save nicht mehr durch `set_temperature` überschrieben |
| 28.04 | **1285** | **Schemamodus** für Zeitpläne (Start + Endzeit) + Repeat erweitert auf 3 Werte (Wiederholen / Stoppen / Löschen) |
| 28.04 | 1286 | Timer/Schedule-Detection durch `stop`-Marker im Timeslot statt fragilem Name-Prefix |
| 28.04 | **1287** | **Picker-Redesign auf visionOS:** flacher translateY-Wheel, Glass-Surface, Center-Pille |
| 28.04 | 1288 | `border-radius` raus aus Picker-Surfaces (Eltern-Card-Chrome rundet schon) |
| 28.04 | 1289 | News/Schedule-Cards behalten Row-Layout auch <481px (Mobile-Stack-MediaQuery raus) |
| 28.04 | 1290 | `ios-section-header`: padding-left 15, letter-spacing normal; Checkmark nur weiß ohne BG-Pill |
| 28.04 | 1291 | System-Settings Sub-View animation-fix (`mode="wait"` raus, tween 250ms) |
| 28.04 | 1292 | `IOSToggle`: vom Slider auf Text "An/Aus" umgestellt |
| 28.04 | 1293 | Range-Slider-Thumb 18×18 mit 2px iOS-Blue-Border |
| 28.04 | 1294 | System-Settings Header zeigt aktiven Tab-Namen + "Einstellungen" |
| 28.04 | 1295 | Aktualisieren-Button rotiert während des Refresh (CSS-Animation, 500ms Min-Duration) |
| 28.04 | 1296 | Todos: immer sichtbares Suchfeld über den Filter-Tabs |
| 29.04 | 1297 | Todo-Listen Symbol/Farbe persistieren sofort, Fertig-Button entfernt |
| 29.04 | 1298 | News-Suchleiste fade-in/out via `AnimatePresence` |
| 29.04 | 1299 | Custom-View Device-Card-Schrift heller für Lesbarkeit auf farbigen Hintergründen |
| 29.04 | 1300 | Darstellung-Settings: gleicher Anim-Fix wie 1291 (kein Item-Flicker beim Zurück-Navigieren) |
| 29.04 | 1301 | Versionsverlauf bekommt Suchbutton + zwei-zeilige Filter-Leiste (Zeit + Tags) wie News |

---

## 2. IOSPicker-Rebuild — abgeschlossen

Der Plan aus `SESSION_NOTES_2026-04-26.md §3` ist komplett umgesetzt. Net-Change:

- **Gelöscht:** `src/components/IOSTimePicker.jsx` (~660 LOC, 4 Klassen) + `src/components/tabs/ScheduleTab/utils/pickerInitializers.js` (~160 LOC, 6 init-Helpers)
- **Neu:** `src/components/picker/` mit 6 Files:
  - `PickerWheel.jsx` + `.css` — Core single-column flat-wheel
  - `TimePickerWheel.jsx` + `.css` — composes 2-3 PickerWheels mit colon-separator
  - `DatePickerWheel.jsx` + `.css` — composes 3 PickerWheels (day/month/year) mit Feb-29-clamp
  - `DaysChipRow.jsx` + `.css` — flache Chip-Row als Days-Picker (UX-Redesign in 1283)
- **Migrationen:**
  - ScheduleTab (5 Picker)
  - TodoFormDialog (Time + Date)
  - ClimateScheduleSettings (5 IOSPicker)
  - ClimateSettingsPicker (3 IOSPicker)

**Memory-Leaks beseitigt:** alte Klassen instantiierten bei AM↔PM-Switch / View-Re-Mount neue `IOSPicker` ohne Cleanup → ResizeObserver/scroll-listener leakten. Neue Komponenten haben harten Cleanup-Path im `useEffect`-return.

**Dead-Method-Calls weg:** `setHourMode` / `reinitHours` / `setTime` auf `TimePicker`-Klasse haben nie existiert, wurden silent von `setTimeout` geschluckt. Mit dem Rewrite samt Caller-Code sind sie weg.

---

## 3. visionOS-Redesign der Picker (v1.1.1287 + 1288)

User wollte einen visionOS-Look orientiert an [MEddarhri/react-ios-time-picker](https://github.com/MEddarhri/react-ios-time-picker). Demo-Page mit drei Optionen aufgesetzt (3D bleibt / 3D + Treatment / flach + Treatment) — User wählte **flach + visionOS**.

**Was sich geändert hat:**
- 3D-Cylinder (`rotateX` + `translateZ`) → flacher `translateY`-Mirror
- Hairlines (zwei dünne Linien an den Center-Band-Edges) → Center-Pille (rounded translucent-white-rectangle)
- Container: `rgba(28,28,30,0.5)` + `backdrop-filter: blur(30px) saturate(180%)` (Apple Vibrancy)
- Top/Bottom-Fade matched die Surface-Farbe (vorher schwarzer Overlay)
- Selected-Item: bold + voll-deckend weiß, andere Items dimmen zur Surface
- `bare`-Prop auf `<PickerWheel>` für TimePickerWheel/DatePickerWheel — innere Wheels transparent, Container hat ein durchgehendes Pille über alle Spalten

**Hair-on-fire-Bug:** beim ersten Versuch hatte ich eine `mask-image` auf den Wheel-Scrollers — die hat im 3D-Context die Items unsichtbar gemacht. Mit dem flachen Layout konnte ich sie weglassen, einfaches Gradient-Overlay reicht.

`border-radius` an den Picker-Surfaces hat die Eltern-Card-Rundungen verdoppelt → User sah 3 runde + 1 eckige Ecke. In 1288 raus.

---

## 4. Schemamodus + Repeat-3-Werte (v1.1.1285 + 1286)

User-Aufklärung: **unser Timer = nielsfaber-Schedule im Einzelmodus**. Schemamodus = Start + Endzeit als Zeitfenster. Beide brauchen `repeat_type` von nielsfaber: `repeat` / `pause` / `single`.

### Mapping

```
Timer       → Einzelmodus → timeslots: [{ start, actions }]   (kein stop)
Zeitplan    → Schemamodus → timeslots: [{ start, stop, actions }]

Repeat-Picker (3 Werte):
  Wiederholen  → repeat_type: 'repeat'
  Stoppen      → repeat_type: 'pause'   (pausiert nach Trigger)
  Löschen      → repeat_type: 'single'  (löscht nach Trigger)
```

### Detection nach Storage-Format (v1.1.1286)

Vorher: Detection lief auf `friendly_name.startsWith('timer')` — fragil, nielsfaber konnte den Namen umschreiben → Timer wurde beim Refresh als Schedule kategorisiert.

Jetzt: `hasStopMarker(timeslot)` als alleiniges Kriterium. Klar mappt aufs User-Mental-Model:

```
Timer    = no stop  (Einzelmodus)
Schedule = mit stop (Schemamodus)
```

### Climate-Schedule lossless edit (v1.1.1284)

nielsfaber kann Climate-Schedules mit beliebigen `climate.*`-Services anlegen (`set_hvac_mode`, `set_fan_mode`, `set_swing_mode`, `set_preset_mode`, `set_temperature`, `turn_on/off`). Unsere Card kannte nur `set_temperature` als „aktiv" — `set_hvac_mode: fan_only` wurde im Edit als „Ausschalten" angezeigt und beim Speichern wurde der Service auf `set_temperature` zurückgeschrieben.

Fix: `pickClimateOnService(settings, originalServiceName)` mit Prioritäten:
1. `temperature` in den Settings → `climate.set_temperature` (akzeptiert hvac_mode etc als optionale Params)
2. Genau ein Schlüssel passt zu einem dedizierten Service → diesen
3. originalServiceName aus Edit-Load + passender Key noch in Settings → preserve
4. Fallback: `set_temperature`

`originalServiceName` wird im `useScheduleForm`-Reducer gehalten und beim `loadClimateEditState` gesetzt.

---

## 5. Architektur-Diskussion: nielsfaber vs HA-native

User überlegte, weg von `nielsfaber/scheduler-component` zu gehen — Motivation: HACS-Deps reduzieren, weniger Custom-Code in der Toolchain.

**Was geprüft wurde:**
- HA's `schedule.*`-Helper (seit 2023.8) — state-based, **nicht** action-triggering. Braucht eine Bridge-Automation. Service `schedule.set_schedule` existiert nicht
- Pure-Automation-basierter Ersatz — möglich aber: Automations sind global, nicht entity-bound. UX-Verschlechterung beim "Schedules dieser Entity"-Listen

**Entscheidung des Users:** **bleibt bei nielsfaber.** Der UX-Vorteil (entity-bound Schedule-Entities mit `attributes.actions`/`timeslots`) ist groß genug. Stattdessen wird die nielsfaber-API maximal sauber genutzt.

---

## 6. Settings-Polish-Welle (1289-1300)

Konzept: User klickt durch alle Views, jedes UI-Issue meldet er per Screenshot, ich fixe und release.

### Animation-Konsistenz
- v1.1.1291 + 1300: System-Settings + Darstellung-Sub-View-Animationen — `mode="wait"` raus, `initial="enter"`, Spring → Tween 250ms iOS-easing `[0.32, 0.72, 0, 1]`
- v1.1.1295: Aktualisieren-Button rotiert via `is-spinning` CSS-Klasse + 500ms Min-Duration (HASS-States sind in-memory, sonst Spinner unsichtbar)
- v1.1.1298: News-Suchleiste fade-in via `AnimatePresence`

### Komponenten-Refactor
- v1.1.1292: `IOSToggle` slider-pill → Text "An/Aus" (gleiche API, alle ~30 Aufrufstellen ohne Code-Änderung migriert)
- v1.1.1296: Todos-Suchfeld immer sichtbar über Filter-Tabs
- v1.1.1297: Todo-Listen Symbol/Farbe persistieren sofort, Fertig-Button raus
- v1.1.1301: Versionsverlauf Such-Button + zwei-zeilige Filter-Leiste (Zeit + Tags)

### Visual Polish
- v1.1.1289: Mobile-Stack-MediaQuery raus aus News-Cards
- v1.1.1290: ios-section-header padding + Checkmark ohne BG-Pill
- v1.1.1293: Range-Slider-Thumb mit blauem Border
- v1.1.1294: Settings-Header zeigt Tab-Namen statt "Gerade Eben"
- v1.1.1299: Custom-View Device-Card-Schrift heller (`.is-custom-view`-Override)

---

## 7. Lessons Learned / Patterns

### Framer-Motion Sub-View-Animations

Wenn `<AnimatePresence>` zwischen Views wechselt:

**Schlecht:**
```jsx
<AnimatePresence mode="wait" initial={false} custom={...}>
  {currentView === 'main' ? (
    <motion.div custom={-1} initial={false} ...>
  ) : (
    <motion.div custom={1} initial="enter" ...>
  )}
</AnimatePresence>
```
- `mode="wait"` → sichtbarer Gap
- `initial={false}` auf main → kein Slide-In beim Zurück
- per-Element-`custom` überschreibt AnimatePresence-`custom`

**Gut:**
```jsx
<AnimatePresence initial={false} custom={direction}>
  {currentView === 'main' ? (
    <motion.div initial="enter" animate="center" exit="exit"
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }} ...>
  ) : (
    <motion.div initial="enter" animate="center" exit="exit"
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }} ...>
  )}
</AnimatePresence>
```

Nebeneffekt: Main-View bekommt Hover-Trigger erst nach Animation-Ende → kein Flash-Flicker beim Zurück-Navigieren.

### CSS-Override für `<motion>` ohne JSX-Touch

Wenn man Inline-Werte aus `<motion.path stroke="black">` global ändern will (z.B. Checkmark in 5 Files, ~10 Vorkommen), spart CSS-Override mit `!important` viele JSX-Edits:

```css
.ios-checkmark path {
  stroke: currentColor !important;
}
```

Nicht hübsch, aber pragmatisch.

### Storage-Format als Single Source of Truth

Bei Timer/Schedule-Detection: Heuristik auf Anzeige-Werten (Friendly-Name etc.) ist fragil — externe Tools (nielsfaber-eigenes Card) können sie umschreiben. Detection auf das **Speicher-Format** (hat das Timeslot ein `stop`?) ist invariant gegen Anzeige-Manipulationen.

### Min-Duration für Spinner

Aktualisierungen die in <50ms durchlaufen (in-memory data) zeigen keinen Spinner — Frame-Cycle ist schneller als Render. 500ms Min-Duration via setTimeout macht Refresh-Feedback wieder sichtbar ohne sich blockiert anzufühlen.

---

## 8. Was bleibt offen

### Climate / DatePicker Migration
Der Picker-Rebuild ist **komplett**. Alle Consumers von `IOSTimePicker.jsx` sind weg, die Datei ist gelöscht. ✅

### TodosSettingsView Animation
Hat noch das alte `mode="wait"` + Spring-Pattern (wie 1291 + 1300 für GeneralSettingsTab + AppearanceSettingsTab gefixt). Falls dort Flickern auftritt, gleiche Behandlung anwenden — 5-Min-Edit.

### Schedule-Migrations-Tool
Die `nielsfaber → HA-native`-Architekturfrage ist bewusst zurückgestellt. Falls jemals migriert werden soll: Notes in §5 + Pfad-A/B/C-Tabelle aus den Mid-Session-Antworten.

### Versionsverlauf Tag-Konsistenz
Mit dem neuen Tag-Filter wird sichtbar, dass historische Versionen unterschiedliche Tag-Formate haben (DE/EN gemischt, manchmal abgekürzt). Falls das nervt: Tag-Normalisierungs-Pass über die Markdown-Datei.

---

## 9. Wichtige Files für nächste Session

### Picker-System (rebuilt)
- `src/components/picker/PickerWheel.jsx` + `.css` — Core
- `src/components/picker/TimePickerWheel.jsx` + `.css` — Time-Composite
- `src/components/picker/DatePickerWheel.jsx` + `.css` — Date-Composite
- `src/components/picker/DaysChipRow.jsx` + `.css` — Multi-Select Chip-Row

### Schedule-System
- `src/components/tabs/ScheduleTab.jsx` — Hauptlogik (jetzt deutlich kürzer ohne Picker-Init)
- `src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx` — Picker-Composition
- `src/components/tabs/ScheduleTab/utils/serviceActionBuilders.js` — `pickClimateOnService`-Helper
- `src/components/tabs/ScheduleTab/utils/editStateLoaders.js` — `loadClimateEditState` mit `originalServiceName`
- `src/utils/scheduleUtils.js` — `extractTimeRange` + `hasStopMarker` für Read-Pfad

### Settings-System
- `src/components/tabs/SettingsTab/components/GeneralSettingsTab.jsx` — Animation-Fix-Pattern
- `src/components/tabs/SettingsTab/components/AppearanceSettingsTab.jsx` — gleiches Pattern
- `src/system-entities/entities/news/components/iOSSettingsView.css` — geteilte iOS-Settings-Styles
- `src/components/common/IOSToggle.jsx` — Text-basiert seit 1292

### View-Filter-Pattern (für künftige Views)
- `src/system-entities/entities/news/NewsView.jsx` — Search-Toggle + Filter-Bar Vorbild
- `src/system-entities/entities/todos/TodosView.jsx` — always-visible search + Filter-Tabs
- `src/system-entities/entities/versionsverlauf/components/VersionsList.jsx` — neueste Iteration mit zwei-zeiliger Filter-Bar

### Build / Release
- `echo "Y" | ./build.sh` — Build + push + GitHub-Release in einem Schritt
- `docs/versionsverlauf.md` — separat committed nach jedem Build (User-Pattern bestätigt)
- Version lebt in 2 Files: `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` + `src/system-entities/entities/versionsverlauf/index.js`

---

## 10. Quick-Reminder für die nächste Session

- **Aktueller Stand:** v1.1.1301 deployed
- **Dependency-Status:** weiter auf `nielsfaber/scheduler-component` als Backend (User-Entscheidung)
- **Picker-System:** komplett rebuilt, visionOS-Style, alle Memory-Leaks weg
- **Settings-Pattern:** für animierte Sub-Views immer `initial="enter"` + Tween 250ms `[0.32, 0.72, 0, 1]`, kein `mode="wait"`, kein per-Element-`custom`-Override
- **Filter-Bar-Pattern:** zweizeilig (Status/Time + Tags), horizontal scrollbar; Search-Bar via Action-Button toggleable mit AnimatePresence-Fade
- **Build-Flow:** `echo "Y" | ./build.sh` → automatischer Versionsverlauf-Commit separat danach

---

*Notes geschrieben am 2026-04-29 nach 24 Releases über drei Tage. Größtes Einzelthema: IOSPicker-Rebuild abgeschlossen + visionOS-Redesign. Größte Backend-Entscheidung: weiter mit nielsfaber. Lange Polish-Welle hat alle prominenten Views (System-Settings, Darstellung, News, Todos, Versionsverlauf, Custom-View) auf konsistentes Animations- und Such-Pattern gebracht.*
