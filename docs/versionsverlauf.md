# Versionsverlauf

## Version 1.1.1292 - 2026-04-28

**Title:** IOSToggle: vom iOS-Slider-Switch auf einfachen "An" / "Aus"-Text gewechselt
**Hero:** none
**Tags:** IOSToggle, Settings, UI

### Why

User-Feedback: der iOS-Style-Switch (grüner Pill mit weißem Kreis) wirkt veraltet. Plain-Text "An"/"Aus" ist schneller lesbar, matcht den Stil der anderen Wert-Anzeigen in den Settings-Rows (`Aktiv`, `Inaktiv`, `Deutsch`, `24-Stunden` etc.) und braucht weniger Platz.

### Changes

**[IOSToggle.jsx](src/components/common/IOSToggle.jsx)** — komplett rewrite:
- Render: jetzt ein `<button type="button">` mit Text "An" oder "Aus" (statt `<label>` + `<input type="checkbox">` + slider-pill)
- API kompatibel zu vorher: `checked`, `onChange(value, event)`, `disabled`, `stopPropagation`, `className`, `style`
- Neue optionale Props: `onLabel` / `offLabel` (defaults: "An" / "Aus") für andere Sprachen oder eigenen Text
- 150 ms Dedupe für `onChange` bleibt — defensiv, falls Handler im Codebase auf höchstens-einen-fire-pro-Klick gebaut sind
- `aria-pressed` für Screen-Reader

**[iOSSettingsView.css](src/system-entities/entities/news/components/iOSSettingsView.css)** — neue `.ios-toggle-text` Klasse:
- Default (off): `rgba(255, 255, 255, 0.45)` — gedimmt grau
- `.is-on`: `rgb(10, 132, 255)` — iOS-Blue (Dark-Mode-Tint)
- Hover-Row (heller Hintergrund): `rgba(0, 0, 0, 0.45)` off / `rgb(0, 122, 255)` on (Standard-iOS-Blue auf hellem BG)
- `:disabled` / `.is-disabled`: opacity 0.4
- 16px font, 500 weight, padding 6px 4px

Die alten `.ios-toggle` / `.ios-toggle-slider` Klassen bleiben in der CSS bestehen — falls irgendwo direkt `<label className="ios-toggle">…</label>` Markup steht (außerhalb der IOSToggle-Komponente). Keine Breaking-Change-Risiken.

### Files touched

- `src/components/common/IOSToggle.jsx` — vom slider auf text rewrite
- `src/system-entities/entities/news/components/iOSSettingsView.css` — `.ios-toggle-text` styles, alte `.ios-toggle` als legacy markiert
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Wo wirkt das?

Alle ~30 Verwendungen von `<IOSToggle>` im Codebase:
- GeneralSettingsTab: GreetingsBar, Toasts-Settings, Mobile-Panel-Auto-Expand etc.
- AppearanceSettingsTab: diverse Anzeige-Toggles
- TodosSettingsView: 6+ Toggles für Todo-Filter / -Visibility
- iOSSettingsView (News): Show-Source-Icons / Auto-Refresh etc.
- Printer3D / EnergyDashboard: device-spezifische Toggles

Alle bekommen automatisch das neue Text-Treatment ohne Code-Änderung an der Aufrufseite.

## Version 1.1.1291 - 2026-04-28

**Title:** System-Settings Sub-View-Wechsel: kein Flackern mehr, schneller + flüssiger
**Hero:** none
**Tags:** SettingsTab, Animation, framer-motion

### Why

Beim Wechsel von der System-Settings-Hauptansicht in ein Untermenü (Sprache, Währung, Zeitformat, Vorschläge etc.) gab's ein sichtbares Flackern. Drei zusammenwirkende Ursachen:

1. **`mode="wait"`** auf `<AnimatePresence>` — wartet bis die alte View komplett raus animiert ist, **bevor** die neue beginnt → ein paar Frames ohne Inhalt
2. **`custom={-1}` auf der Main-View + `custom={1}` auf den Sub-Views** überschrieben das `custom`-Prop von AnimatePresence. Folge: bei main → sub liefen beide Views in dieselbe Richtung statt iOS-typisch gegenläufig
3. **`initial={false}` auf der Main-View** → beim Zurück-Navigieren ploppte main einfach ein, kein Slide-In von links
4. **Spring 300/30** ist eher bouncy als snappy — wirkt zäh

### Changes

[GeneralSettingsTab.jsx](src/components/tabs/SettingsTab/components/GeneralSettingsTab.jsx):

- `<AnimatePresence>`: `mode="wait"` raus → Default-Sync, alte und neue View animieren überlappend
- Main `<motion.div>`: `custom={-1}` raus, `initial={false}` → `initial="enter"`. Slidet jetzt von links rein wenn man zurück navigiert
- Alle 5 Sub-View `<motion.div>`: `custom={1}` raus. Direction wird jetzt einheitlich von AnimatePresence's `custom` gesteuert
- Alle 6 `transition`: `{ type: 'spring', stiffness: 300, damping: 30 }` → `{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }`. Das Easing matcht iOS-native Decel-Kurve, 250ms ist snappy aber nicht abrupt

### Result

- main → sub: main slidet nach links raus, sub slidet von rechts rein, **gleichzeitig**, in 250ms
- sub → main: sub slidet nach rechts raus, main slidet von links rein, gleichzeitig, in 250ms
- sub → sub (z.B. suggestions → learningRate): forward slide

### Files touched

- `src/components/tabs/SettingsTab/components/GeneralSettingsTab.jsx`
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Hinweis

Andere Settings-Tabs (AppearanceSettingsTab, TodosSettingsView etc.) nutzen das gleiche Pattern und könnten dasselbe Treatment vertragen. Falls dort auch Flackern sichtbar ist — gerne melden, dann ziehe ich das nach.

## Version 1.1.1290 - 2026-04-28

**Title:** iOS-Section-Header Padding/Letter-Spacing fix; Checkmarks nur noch der Haken (kein weißes Hintergrund-Pill)
**Hero:** none
**Tags:** SettingsTab, iOSSettingsView, Polish

### Why

Zwei kleine UI-Fixes in den iOS-style Einstellungs-Views:

1. **Section-Header** (`ALLGEMEIN`, `STATUS & BEGRÜSSUNG` etc.): hatten `padding-left: 0` und `letter-spacing: 0.5px`. Das hat sie links bündig mit dem Content gemacht und gestreckt aussehen lassen.

2. **Checkmark** in den ausgewählten Optionen (Time-Format, Splashscreen, Auto-Hide-Days etc.): bestand aus einem **weißen runden Hintergrund-Pillen** mit schwarzem Tick darin. Sah wie ein Schalter aus, nicht wie ein iOS-Checkmark.

### Changes

**[iOSSettingsView.css](src/system-entities/entities/news/components/iOSSettingsView.css)**:

- `.ios-section-header`:
  - `padding-left: 0px` → `padding-left: 15px` (Header rückt etwas ein)
  - `letter-spacing: 0.5px` → `letter-spacing: normal` (kein Streck-Tracking)

- `.ios-checkmark`:
  - `background: white` + `border-radius: 50%` weg — kein weißer Pill mehr
  - `color: rgb(0, 122, 255)` → `color: white`
  - Zusätzlich: alle `<circle>`-Elemente innerhalb (vom alten JSX-Markup) werden via CSS `fill: none; stroke: none` versteckt
  - Alle `<path>`-Strokes werden auf `currentColor` (also weiß) geforcet — überschreibt inline `stroke="black"` aus dem JSX

- Hover-State (Row wechselt zu hellem Hintergrund):
  - `.ios-checkmark { background: black }` weg → `background: none`
  - Path-Stroke wechselt auf `rgba(0, 0, 0, 0.6)` (dunkler Tick auf hellem Hintergrund)

JSX-Code in `GeneralSettingsTab.jsx`, `AppearanceSettingsTab.jsx`, `TodosSettingsView.jsx` etc. ist nicht angefasst — die `<motion.circle>` und `<motion.path>` mit alten Inline-Werten bleiben, werden aber durch die neue CSS-Schicht visuell überschrieben.

### Files touched

- `src/system-entities/entities/news/components/iOSSettingsView.css`
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

## Version 1.1.1289 - 2026-04-28

**Title:** News-/Schedule-Cards behalten das horizontale Layout auch unter 481px Breite
**Hero:** none
**Tags:** News, AllSchedules, Mobile, Layout

### Why

Der `@media (max-width: 480px)`-Block in `NewsView.css` hat die Cards auf Mobile in eine Vertikale gestapelt: `flex-direction: column`, Thumbnail 100% Breite und 180px Höhe statt 55×55. Das hat zwei Probleme erzeugt:

1. Auf Mobile haben `.news-article-card` und (über das geteilte CSS) auch die `.news-article-card` in der `system.all_schedules`-Übersicht plötzlich anders ausgesehen als auf Desktop — User-Feedback war: das soll konsistent sein
2. Speziell für Schedule-Cards (klein, mit Mini-Icon-Tile) ist das vertikale Layout overkill — sie wirken aufgebläht

### Changes

`@media (max-width: 480px)`-Block in [NewsView.css](src/system-entities/entities/news/styles/NewsView.css) entfernt. Der `@media (max-width: 768px)`-Block davor bleibt — der schrumpft Thumbnail (50×50) und Schrift (13px), behält aber das Row-Layout.

### Files touched

- `src/system-entities/entities/news/styles/NewsView.css` — Mobile-Stack-Block entfernt
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

## Version 1.1.1288 - 2026-04-28

**Title:** Picker-Container ohne eigene Rundungen — die Ecken übernimmt das Eltern-Card-Chrome
**Hero:** none
**Tags:** PickerWheel, TimePickerWheel, DatePickerWheel, Design

### Why

Beim Test in HA war zu sehen: drei der vier Picker-Ecken waren rund, die vierte (rechts unten) eckig — Inkonsistenz weil das Eltern-Element (HA-Card / `.picker-table-container`) bereits seine eigenen abgerundeten Ecken hat und sie dort das Schedule-Card visuell abschließen. Mein zusätzliches `border-radius: 16px` auf den Picker-Surfaces hat sich mit den Eltern-Rundungen überlagert und an manchen Stellen einen sichtbaren Knick ergeben.

### Changes

`border-radius: 16px` aus den drei Picker-Container-Stilen entfernt:
- [PickerWheel.css](src/components/picker/PickerWheel.css) — `.fsc-picker-wheel` (plus die `.is-bare`-Override für border-radius war redundant, auch raus)
- [TimePickerWheel.css](src/components/picker/TimePickerWheel.css) — `.fsc-time-picker-wheel`
- [DatePickerWheel.css](src/components/picker/DatePickerWheel.css) — `.fsc-date-picker-wheel`

Die Picker-Surface ist jetzt rechteckig — die Pille bleibt rund (10px), das ist der einzige Round-Element. Alle 4 Ecken vom Picker-Container sind nun visuell identisch (scharf), das Eltern-Card kümmert sich um die Außenrundung.

Glass-Treatment (Backdrop-Blur, Saturate, Box-Shadow, inset white-line) bleibt unverändert.

### Files touched

- `src/components/picker/PickerWheel.css`
- `src/components/picker/TimePickerWheel.css`
- `src/components/picker/DatePickerWheel.css`
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

## Version 1.1.1287 - 2026-04-28

**Title:** Picker-Redesign — visionOS-Glass-Surface mit Center-Pill, flache (translateY) Wheel-Mechanik
**Hero:** none
**Tags:** PickerWheel, TimePickerWheel, DatePickerWheel, Design, visionOS

### Why

Das alte 3D-Cylinder-Design (Items rotiert um die x-Achse, perspektivische Verzerrung) wurde abgelöst durch eine flache translateY-Liste mit visionOS-style Glass-Surface und einer translucent-white Center-Pille. Inspiration: [MEddarhri/react-ios-time-picker](https://github.com/MEddarhri/react-ios-time-picker) + visionOS Vibrancy-Treatment. User-Feedback: ruhiger, sauberer, näher an iOS-17/visionOS-Aesthetik.

### Was sich geändert hat — UI

**Alle PickerWheel-Komponenten** (PickerWheel, TimePickerWheel, DatePickerWheel) rendern jetzt:
- **Glass-Surface-Container**: `rgba(28,28,30,0.5)` + `backdrop-filter: blur(30px) saturate(180%)`, `border-radius: 16px`, soft inset-highlight an der Oberkante
- **Center-Pille** statt Hairlines: rounded rectangle (`border-radius: 10px`) hinter dem aktiven Item, translucent white background
- **Flache Items**: stack normal, kein 3D-Cylinder. Items außerhalb des Center-Bands dimmen via Top/Bottom-Fade-Gradient (matched die Surface-Farbe für nahtlosen Übergang)
- **Aktives Item**: bold (`font-weight: 600`) + voll deckende weiße Schrift. Andere Items: `rgba(255,255,255,0.4)`

**TimePickerWheel + DatePickerWheel:** Container-glass + eine Pille die über alle 2/3 Spalten spannt (Hours + Doppelpunkt + Minutes [+ AM/PM] bzw. Tag + Monat + Jahr). Inner-Wheels nutzen `bare={true}` — keine eigene Surface mehr, transparenter Pass-Through.

### Was sich geändert hat — Code

**[PickerWheel.jsx](src/components/picker/PickerWheel.jsx)**:
- Removed: `ANGLE_STEP_DEG`, `TRANSLATE_Z_PX`, per-option `rotateX(...)translateZ(...)` transforms
- Items stack jetzt im normalen Block-Flow (kein `position: absolute` pro Item)
- `updateRotation` umbenannt zu `updateTransform` — setzt nur `pickerScroller.style.transform = translateY(${-scrollTop}px)`
- Neuer `bare`-Prop suppress Glass + Pille + Fades — für den Use-Case in TimePickerWheel/DatePickerWheel
- `VISIBLE_RANGE` von 7 auf 9 erhöht (flache Liste zeigt mehr Items als der 3D-Cylinder, auch außerhalb der Center-Band)

**[PickerWheel.css](src/components/picker/PickerWheel.css)**:
- Removed: `perspective`, `transform-style: preserve-3d`, `backface-visibility`, alle 3D-spezifischen Properties
- Default-Surface: Glass + Pill + Top/Bottom-Fade
- `.fsc-picker-wheel.is-bare`: alles transparent für Container-driven Rendering

**[TimePickerWheel.css](src/components/picker/TimePickerWheel.css) + [DatePickerWheel.css](src/components/picker/DatePickerWheel.css)**:
- Container-Glass-Surface
- Single spanning Pill via `::before` (top:90px, height:30px = Center-Band)
- Top/Bottom-Fade via `::after` als Container-Overlay (deckt Seams zwischen Wheels)
- Separator schmaler (16px statt 20px), keine eigene Hintergrund-Gradient — die Pille deckt das Center-Band

**[TimePickerWheel.jsx](src/components/picker/TimePickerWheel.jsx) + [DatePickerWheel.jsx](src/components/picker/DatePickerWheel.jsx)**:
- Inner `<PickerWheel>` Aufrufe mit `bare` prop

### Verhalten unverändert

- Native Scroll auf cloneScroller (Touch + Mouse)
- ResizeObserver-Recovery bei display:none → block (z.B. wenn Picker in einer collapsed Schedule-Row geöffnet wird)
- smoothScrollTo mit easing, cancelable, rAF-driven
- onChange firet auf Scroll-End (150ms debounce)
- Initial-scroll suppress + Echo-suppress für sauberen Mount-Flow
- Cleanup: scroll listener, 2× rAF, scroll-stop timeout, ResizeObserver — alle im unmount disposed

### Wo das Design erscheint

Überall wo ein Picker im UI ist:
- ScheduleTab Edit-View: Action / Position / Scheduler / Repeat / Time / Endzeit
- TodoFormDialog: Time + Date
- Climate-Schedule-Settings: Temperature / HVAC / Fan / Swing / Preset
- ClimateSettingsPicker: Fan-Speed / Horizontal / Vertical

DaysChipRow ist unverändert — der Wochentage-Picker ist eine Chip-Row, kein Wheel.

### Files touched

- `src/components/picker/PickerWheel.jsx` — flat presentation, bare prop
- `src/components/picker/PickerWheel.css` — visionOS rewrite, bare modifier
- `src/components/picker/TimePickerWheel.jsx` — bare wheels
- `src/components/picker/TimePickerWheel.css` — container glass + spanning pill
- `src/components/picker/DatePickerWheel.jsx` — bare wheels
- `src/components/picker/DatePickerWheel.css` — container glass + spanning pill
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

## Version 1.1.1286 - 2026-04-28

**Title:** Bugfix — Timer wurde beim Refresh als Zeitplan kategorisiert. Detection läuft jetzt über Einzelmodus/Schemamodus statt fragilem Name-Prefix
**Hero:** none
**Tags:** ScheduleTab, Bugfix, nielsfaber

### Why

In v1.1.1285 wurden Timer beim Refresh als Zeitpläne im Schemamodus angezeigt, obwohl sie als Timer (Einzelmodus, ohne Endzeit) erstellt wurden. Root cause: die Kategorisierung lief auf `friendly_name.startsWith('timer')` — fragile Heuristik die kaputt ging wenn der Schedule-Name nicht durchkam wie wir ihn gesendet haben. Plus konzeptueller Bruch: die Timer/Zeitplan-Trennung war an einem Anzeigewert (Name) verankert, nicht am tatsächlichen Schedule-Storage-Format.

### Changes

**[scheduleUtils.js](src/utils/scheduleUtils.js)** — Kategorisierung in `transformToScheduleObject` umgestellt von Name-Prefix auf das Vorhandensein eines `stop`-Werts im ersten Timeslot. Neuer Helper `hasStopMarker(slot)` deckt alle drei nielsfaber-Timeslot-Formate ab (string `"08:00"`, range string `"08:00:00 - 10:00:00"`, object `{start, stop, actions}`):

```
Timer    = Einzelmodus = no stop
Schedule = Schemamodus = stop set
```

Damit ist die Round-Trip-Logik direkt: was der User im Picker als "Timer" erstellt (`timeslots: [{start, actions}]`), kommt beim Refresh als Timer zurück. Was er als "Zeitplan" erstellt (`timeslots: [{start, stop, actions}]`), bleibt Zeitplan. Kein Name-Parsing mehr.

**[ScheduleTab.jsx](src/components/tabs/ScheduleTab.jsx)** — die in v1.1.1286-Entwurf vorübergehend hinzugefügten `tags: ['fsc-timer']` Marker (waren ein Workaround für die fragile Name-Detection) wieder entfernt — mit der Storage-basierten Detection nicht mehr nötig.

### Behavior preserved

- Timer-Save: schickt weiterhin `timeslots: [{start, actions}]` ohne `stop`. Beim Read kommt es als Einzelmodus zurück → Timer-Kategorie ✓
- Schedule-Save: schickt `timeslots: [{start, stop, actions}]`. Beim Read kommt es als Schemamodus zurück → Schedule-Kategorie ✓
- ScheduleListItem: Timer-Items rendern weiterhin `Um 23:56 - Noch X Min` (Einzelmodus-Display), Schedules rendern `08:00 → 10:00 - Mo, Di` (Schemamodus-Display)
- handleItemClick: bei `item.type === 'timer'` wird `loadTimerState` aufgerufen, sonst `loadScheduleState` mit setEndTime — unverändert

### Files touched

- `src/utils/scheduleUtils.js` — `hasStopMarker` helper, neue Kategorisierung
- `src/components/tabs/ScheduleTab.jsx` — `tags`-Zusatz wieder raus
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Migrations-Hinweis

Falls noch alte Schedules existieren die mit Name `Timer - X - HH:MM` aber MIT `stop` gespeichert sind (in v1.1.1285 unklar ob das passiert ist), werden die jetzt als Schedule kategorisiert. Falls das stört: einmalig in nielsfaber's eigener Card öffnen und ins Einzelmodus zurück-konvertieren.

## Version 1.1.1285 - 2026-04-28

**Title:** Zeitplan = Schemamodus mit Start- + Endzeit; Repeat erweitert auf 3 Werte (Wiederholen / Stoppen / Löschen) für Timer und Zeitplan
**Hero:** none
**Tags:** ScheduleTab, Schemamodus, Wiederholung, nielsfaber

### Why

Die nielsfaber/scheduler-component unterstützt zwei Schedule-Typen — **Einzelmodus** (nur Startzeit) und **Schemamodus** (Start + Endzeit als Zeitfenster) — sowie drei `repeat_type`-Werte (`repeat`, `pause`, `single`). Unsere Card kannte bisher nur Einzelmodus mit zwei repeat-Werten. Diese Release bringt unser Mental-Model in Einklang: Timer = Einzelmodus, Zeitplan = Schemamodus, beide mit allen drei Wiederholungs-Optionen.

### Changes

**Repeat von 2 auf 3 Werte** ([SchedulePickerTable.jsx](src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx)):
- Vorher: `[t('regular'), t('once')]`
- Jetzt: `[t('repeatRepeat'), t('repeatPause'), t('repeatSingle')]` — DE: Wiederholen / Stoppen / Löschen, EN: Repeat / Pause / Delete
- Mapping zur nielsfaber-API: `repeat` / `pause` / `single` (über `repeatLabelToApi` in ScheduleTab.jsx)
- Repeat-Row ist jetzt sichtbar in **beiden** Modi (vorher nur Zeitplan) — Timer-User können auch "Stoppen" oder "Wiederholen" wählen

**Schemamodus für Zeitplan** ([SchedulePickerTable.jsx](src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx)):
- Neue **Endzeit-Row** mit eigenem `<TimePickerWheel>`, sichtbar nur bei `schedulerValue === t('scheduleMode')`
- Position direkt unter der Startzeit (data-line="8")
- Default = `01:00` (Start + 1h)

**Save-Pfad** ([ScheduleTab.jsx](src/components/tabs/ScheduleTab.jsx)):
- `handleCreateSchedule` / `handleUpdateSchedule` schreiben jetzt `timeslots: [{ start, stop, actions }]` (vorher nur `start`)
- Alle vier Save-Pfade (Timer-Create/Update, Schedule-Create/Update) nutzen `repeat_type: repeatLabelToApi(repeatValue)` statt hardcoded `'single'` / `'repeat'`
- Timer-Save fügt **kein** `stop` hinzu — bleibt Einzelmodus

**Edit-Loading** ([editStateLoaders.js](src/components/tabs/ScheduleTab/utils/editStateLoaders.js)):
- Neuer Helper `repeatTypeToLabel(repeatType, t)` mappt API-Werte zurück auf User-Labels
- `loadTimerState` + `loadScheduleState` setzen jetzt den korrekten 3-Wert-Label (vorher waren beide auf `t('once')` / `t('regular')` zurückgemappt)
- `loadScheduleState` akzeptiert optionalen `setEndTime`-Parameter und übernimmt die Endzeit aus `item.endTime` falls vorhanden

**API-Read** ([scheduleUtils.js](src/utils/scheduleUtils.js)):
- Neuer Helper `extractTimeRange(slot)` unterstützt drei mögliche Formate für `timeslots[0]`: plain string ("08:00"), range string ("08:00:00 - 10:00:00"), object ({start, stop, actions}). Robust für alle Read-Pfade
- Schedule + Timer transformation gibt jetzt zusätzlich `endTime` und `repeat_type` zurück, damit der Edit-Loader sie nutzen kann

**State-Hook** ([useScheduleForm.js](src/components/tabs/ScheduleTab/hooks/useScheduleForm.js)):
- Neuer State `endTimeValue` (Default `'01:00'`), Action-Creator `setEndTime`, Reducer-Cases `SET_END_TIME` und Reset-Logik in `RESET_FORM` / `LOAD_EDIT_DATA`
- Default-Repeat im Initial-State und nach Reset: `t('repeatSingle')`. Der `handleSchedulerChange`-Wrapper in ScheduleTab flippt das auf `t('repeatRepeat')` wenn der User auf Zeitplan-Mode wechselt — und auf `t('repeatSingle')` wenn zurück auf Timer

**Liste-Display** ([ScheduleListItem.jsx](src/components/tabs/ScheduleTab/components/ScheduleListItem.jsx)):
- Schedules mit Endzeit zeigen jetzt `08:00 → 10:00 - Mo, Di` statt nur `Um 08:00 - Mo, Di` (Schemamodus visuell erkennbar)
- Timer + Schedules ohne Endzeit: unverändert

**Translations** ([de.js](src/utils/translations/languages/de.js), [en.js](src/utils/translations/languages/en.js)):
- Neue Keys: `repeatRepeat`, `repeatPause`, `repeatSingle`, `endTime`
- Alte Keys (`regular`, `once`) bleiben für Backwards-Compat in den translations, werden aber nicht mehr aktiv genutzt

### Backwards-Compat

- **Existierende Schedules ohne Endzeit:** beim Edit erscheint die Endzeit-Row mit dem Form-Default (`01:00`). Beim Save wird ein `stop`-Feld geschrieben — der Schedule wird damit zum Schemamodus konvertiert. Pro User-Wunsch keine spezielle Migration für bestehende Daten

### Files touched

- `src/components/tabs/ScheduleTab/hooks/useScheduleForm.js` — endTimeValue state + setEndTime + repeat-default `repeatSingle`
- `src/components/tabs/ScheduleTab/utils/editStateLoaders.js` — repeatTypeToLabel + setEndTime in loadScheduleState
- `src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx` — 3-Werte Repeat-Picker, neue Endzeit-Row, Repeat in Timer-Mode sichtbar
- `src/components/tabs/ScheduleTab/components/ScheduleListItem.jsx` — Schemamodus-Display "start → end"
- `src/components/tabs/ScheduleTab.jsx` — handleSchedulerChange flippt Repeat-Default, repeatLabelToApi, alle vier Save-Pfade mit `stop` + dynamic repeat_type, setEndTime an SchedulePickerTable
- `src/utils/scheduleUtils.js` — extractTimeRange helper, endTime + repeat_type in transformierten objects
- `src/utils/translations/languages/de.js` — repeatRepeat / repeatPause / repeatSingle / endTime
- `src/utils/translations/languages/en.js` — gleiche keys
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

## Version 1.1.1284 - 2026-04-28

**Title:** Climate-Schedules aus nielsfaber: Edit zeigt jetzt korrekte Aktion und behält den ursprünglichen Service beim Speichern
**Hero:** none
**Tags:** ScheduleTab, climate, nielsfaber, Bugfix

### Why

Wenn ein Climate-Schedule direkt im nielsfaber/scheduler-Backend (z.B. über deren eigene Card) mit `climate.set_hvac_mode` erstellt wird (statt `climate.set_temperature`), zeigte unser Edit-View **"Ausschalten"** an — egal ob der HVAC-Mode `heat` / `cool` / `fan_only` etc. war. Schlimmer: bei Save schrieb unsere Card den Schedule **immer** auf `climate.set_temperature` zurück. Wer also nur die Uhrzeit eines `set_hvac_mode`-Schedules ändern wollte, verlor den ursprünglichen Service.

Beide Bugs hingen am gleichen Stelleninkrement: die Card kannte historisch nur `set_temperature` als „aktiven" Climate-Service.

### Changes

**[editStateLoaders.js](src/components/tabs/ScheduleTab/utils/editStateLoaders.js)** — `loadClimateEditState`:
- Vorher: `const isTurnOn = serviceName === 'set_temperature';` — alles andere (`set_hvac_mode`, `set_fan_mode`, `set_swing_mode`, `set_preset_mode`, `set_humidity`, `turn_on`) fiel auf "Ausschalten"
- Jetzt: nur `turn_off` UND `set_hvac_mode` mit `hvac_mode: 'off'` zählen als Ausschalten. Alle anderen climate-Services werden als "Einschalten" mit den entsprechenden Settings geladen
- Neu: optionaler `setOriginalServiceName`-Parameter speichert den ursprünglichen Service für lossless save
- `showClimateSettings` greift nur bei "Einschalten" — vorher konnte es auch bei `set_hvac_mode/off` aufgehen, was inkonsistent zum Action-State war

**[serviceActionBuilders.js](src/components/tabs/ScheduleTab/utils/serviceActionBuilders.js)** — komplett rewrite. Neue Helper `pickClimateOnService(settings, originalServiceName)` mit Prioritäten:
1. `temperature` in den Settings → `climate.set_temperature` (HA's set_temperature akzeptiert `hvac_mode` etc. als optionale Zusatz-Parameter)
2. Genau ein Schlüssel der zu einem dedizierten Service passt (`hvac_mode` → `set_hvac_mode`, `fan_mode` → `set_fan_mode`, `swing_mode` → `set_swing_mode`, `preset_mode` → `set_preset_mode`, `humidity` → `set_humidity`) → dieser dedizierte Service. **Das ist der lossless-edit-Fall**
3. originalServiceName aus dem Edit + passender Schlüssel weiterhin in den Settings → ursprünglicher Service. Deckt "User hat zusätzlich zu hvac_mode noch Temperatur gesetzt" — wobei dann Regel 1 zuerst greift
4. Fallback: `climate.set_temperature` (breiteste Akzeptanz in HA)

Plus: `actionValue === t('turnOn')` ohne Settings → `climate.turn_on` (vorher: fiel auf den generischen `${domain}.turn_on`-Pfad). `actionValue === t('turnOff')` mit `originalServiceName === 'set_hvac_mode'` und `hvac_mode === 'off'` → behält `set_hvac_mode/off` (lossless).

**[useScheduleForm.js](src/components/tabs/ScheduleTab/hooks/useScheduleForm.js)** — neuer State `originalServiceName: null`. Reducer-Cases `SET_ORIGINAL_SERVICE_NAME` und Reset im `RESET_FORM` / `LOAD_EDIT_DATA`. Neuer Action-Creator `setOriginalServiceName`.

**[ScheduleTab.jsx](src/components/tabs/ScheduleTab.jsx)** — `originalServiceName` und `setOriginalServiceName` aus dem Hook destrukturiert, an `loadClimateEditState` übergeben, an alle vier `createServiceAction`-Aufrufe (handleConfirm, handleSubmit für Timer/Schedule, Update-Branch). Plus: Reset von `originalServiceName` zu Beginn von `handleItemClick` damit kein stale Wert von einem vorherigen Edit überlebt.

### Behavior tabel — was jetzt passiert

| Schedule kommt mit | Edit-View Action | Edit-View Climate-Settings | Save (ohne Änderung) |
|---|---|---|---|
| `set_temperature` `{temperature: 22, hvac_mode: heat}` | Einschalten | Temp 22, HVAC heat | `set_temperature` (unverändert) |
| `set_hvac_mode` `{hvac_mode: fan_only}` | Einschalten | HVAC: Nur Lüftung | `set_hvac_mode` (lossless ✓) |
| `set_fan_mode` `{fan_mode: auto}` | Einschalten | Fan auto | `set_fan_mode` (lossless ✓) |
| `set_hvac_mode` `{hvac_mode: off}` | Ausschalten | (versteckt) | `set_hvac_mode` mit `hvac_mode: off` (lossless ✓) |
| `turn_off` | Ausschalten | (versteckt) | `turn_off` |

### Files touched

- `src/components/tabs/ScheduleTab/utils/editStateLoaders.js` — climate-edit-Loader korrigiert
- `src/components/tabs/ScheduleTab/utils/serviceActionBuilders.js` — smart climate service-pick
- `src/components/tabs/ScheduleTab/hooks/useScheduleForm.js` — originalServiceName state
- `src/components/tabs/ScheduleTab.jsx` — Wiring + Reset bei handleItemClick
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

## Version 1.1.1283 - 2026-04-27

**Title:** ScheduleTab Wochentage-Picker — chip-row replaces the multi-select wheel
**Hero:** none
**Tags:** ScheduleTab, UX, Picker

### Why

The wheel-based weekday picker (scroll to a day, then click a separate "Auswählen" button to toggle) was a quirky two-step on a touch surface — every toggle cost a scroll plus a tap, and the button moved back and forth with the wheel. With seven options that all fit comfortably on one row, a chip-row gives **one tap per toggle** and the whole week is visible at a glance. The technical migration in v1.1.1281 (Phase 5) deliberately stayed 1:1 with the legacy UX so the rebuild stayed scope-controlled; this release is the follow-up UX cleanup that was flagged in `docs/SESSION_NOTES_2026-04-26.md` §8.

### Changes

**New: [`<DaysChipRow>`](src/components/picker/DaysChipRow.jsx)** — flat row of 7 buttons. Active chips get the iOS-blue fill, inactive chips a translucent outline. Same controlled API as the old `<MultiSelectWheel>` (`options`, `selectedValues`, `onChange`) — drop-in swap, the SchedulePickerTable handlers don't change.

**[SchedulePickerTable.jsx](src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx)** — `<MultiSelectWheel>` import + JSX replaced by `<DaysChipRow>`. Comment in the days-round-trip helper section updated.

**Deleted: `src/components/picker/MultiSelectWheel.jsx` + `MultiSelectWheel.css`** — only consumer migrated, file went unused. The `renderOption` prop on `<PickerWheel>` (added in Phase 5 specifically for MultiSelectWheel) stays in place — it's harmless and a plausible future extension point.

### Behavior preserved

- Round-trip through `daysValueToArray` / `arrayToDaysValue` is unchanged — the daysValue display string (`"Mo, Di"` / `"Täglich"` / `"Mo-Fr"` / `"Sa, So"` / `"Keine"`) keeps the same predicate set, so existing schedules read back the same way and `mapDaysToSchedulerFormat` (used at submit time) is unaffected
- aria-pressed reflects active state for screen-reader users
- Chip height (56px) plus padding fits the 210px picker container the rest of the schedule edit table uses, so the open/close animation doesn't snap

### Files touched

- `src/components/picker/DaysChipRow.jsx` — NEW
- `src/components/picker/DaysChipRow.css` — NEW
- `src/components/picker/MultiSelectWheel.jsx` — DELETED
- `src/components/picker/MultiSelectWheel.css` — DELETED
- `src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx` — import swap, JSX replace
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

## Version 1.1.1282 - 2026-04-27

**Title:** Climate pickers + Todo DatePicker migrated to `<PickerWheel>` / `<DatePickerWheel>`; legacy `IOSTimePicker.jsx` deleted (Phase 6 of the IOSPicker rebuild)
**Hero:** none
**Tags:** Climate, todos, IOSPicker, Refactor, Picker-Rebuild

### Why

Phase 6 closes out the picker rebuild. The remaining nine `new IOSPicker(...)` and one `new DatePicker(...)` call sites — all in Climate components and TodoFormDialog — are now self-contained Preact components. With the last consumer gone, `src/components/IOSTimePicker.jsx` has been deleted entirely (~660 lines).

### Changes

**New: [`<DatePickerWheel>`](src/components/picker/DatePickerWheel.jsx)** — three `<PickerWheel>`s (day / month / year) sharing a center band hairline. Day count adapts to the selected month + year (Feb leap year, 30/31-day months) — same clamp-on-month-change as the legacy `DatePicker.updateDayPicker`. Month names localized for `de` / `en`. Year range default 6 (current year + 5).

**[TodoFormDialog.jsx](src/system-entities/entities/todos/components/TodoFormDialog.jsx)**:
- Import `DatePicker` from `IOSTimePicker` removed; `DatePickerWheel` added
- Refs `dayRef` / `monthRef` / `yearRef` / `datePickerRef` removed
- `useEffect([currentView, lang])` block with `new DatePicker(...)` + `requestAnimationFrame` wait-for-refs loop — gone
- Date-view JSX: three `<div className="date-picker-wheel">` slots replaced by `<DatePickerWheel value={dueDate} onChange={(iso, display) => ...} lang={lang} />`

**[ClimateScheduleSettings.jsx](src/components/climate/ClimateScheduleSettings.jsx)** — five legacy `new IOSPicker(...)` calls (temperature, hvacMode, fanMode, swingMode, presetMode) replaced with `<PickerWheel>`:
- The `pickerRefs` object and `pickersInitialized` flag map removed
- The `useEffect([lang])` that ran the imperative init pipeline 100ms after mount is gone
- Pre-computed label arrays (`hvacLabels` etc.) and per-picker `handleXChange` handlers translate label-strings ↔ mode keys at the picker boundary so the rest of the component keeps working in mode-keys

**[ClimateSettingsPicker.jsx](src/components/climate/ClimateSettingsPicker.jsx)** — three legacy `new IOSPicker(...)` calls (fanSpeed, horizontal, vertical) replaced with `<PickerWheel>`. Refs / init useEffect / `try`-`catch` boilerplate / global `document.querySelector('.value-line-N')` text-content pokes — all gone, the value cells are JSX-driven by component state.

**Deleted: `src/components/IOSTimePicker.jsx`** — last consumer gone. The four legacy classes (`IOSPicker`, `TimePicker`, `DatePicker`, `MultiSelectPicker`, ~660 lines total) are now history. The picker rebuild plan from v1.1.1277 / `docs/SESSION_NOTES_2026-04-26.md` §3 is complete.

### Picker rebuild — closing summary

| Phase | Release | What |
|---|---|---|
| 1 | v1.1.1278 | `<PickerWheel>` core component (single-column 3D wheel) |
| 2 | v1.1.1278 | `<TimePickerWheel>` composed from PickerWheel |
| 3 | v1.1.1279 | ScheduleTab time picker → `<TimePickerWheel>` |
| 4 | v1.1.1280 | TodoFormDialog time picker → `<TimePickerWheel>`, global 24h/AM-PM setting now applies to todos |
| 5 | v1.1.1281 | ScheduleTab Action / Position / Scheduler / Days / Repeat → `<PickerWheel>` + `<MultiSelectWheel>`; `pickerInitializers.js` deleted |
| 6 | v1.1.1282 | Climate pickers + Todo DatePicker migrated; `IOSTimePicker.jsx` deleted |

Net code change across the six phases: roughly −900 lines of imperative DOM-manipulation classes and useEffect init pipelines, +600 lines of self-contained reactive Preact components. Memory leaks (instances re-created without disposal on AM/PM switch / view re-mount) are gone — all async resources are cleaned up on unmount. Dead methods (`setHourMode`, `reinitHours`, `setTime` on TimePicker — none ever existed, all silent failures) are gone with their callers.

### Files touched

- `src/components/picker/DatePickerWheel.jsx` — NEW
- `src/components/picker/DatePickerWheel.css` — NEW
- `src/system-entities/entities/todos/components/TodoFormDialog.jsx` — DatePicker → DatePickerWheel
- `src/components/climate/ClimateScheduleSettings.jsx` — 5 IOSPicker → PickerWheel
- `src/components/climate/ClimateSettingsPicker.jsx` — 3 IOSPicker → PickerWheel
- `src/components/IOSTimePicker.jsx` — DELETED
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Risk profile

Climate components are less-frequently used than ScheduleTab — but `<ClimateScheduleSettings>` is part of the schedule edit flow when scheduling a climate entity (auto-mounts when action = "Einschalten"). Same migration pattern as Phase 5, same `<PickerWheel>` exercised in production for the past two days. TodoFormDialog DatePicker is straightforward — three independent PickerWheels with the day-clamp matching legacy behavior.

## Version 1.1.1281 - 2026-04-27

**Title:** ScheduleTab pickers fully reactive (Phase 5 of the IOSPicker rebuild) — Action / Position / Scheduler / Days / Repeat now Preact components; pickerInitializers.js deleted
**Hero:** none
**Tags:** ScheduleTab, IOSPicker, Refactor, Picker-Rebuild

### Why

Phase 5, the last leg of the picker rebuild plan from v1.1.1277. The remaining five legacy `IOSPicker`/`MultiSelectPicker` consumers in ScheduleTab (Action, Position for cover, Scheduler, Days, Repeat) are all now Preact components composed from `<PickerWheel>` and the new `<MultiSelectWheel>`. The whole imperative picker-init pipeline — the 70-line `useEffect` that ran 100ms after mount, the `pickerRefs` object, the `pickersInitialized` flag map, the `updateView` DOM-poking helper — is gone.

### Changes

**New: [`<MultiSelectWheel>`](src/components/picker/MultiSelectWheel.jsx)** — composes `<PickerWheel>` with a per-option active/inactive chip and a select/deselect button next to the center band. UX matches the legacy `MultiSelectPicker` 1:1 (scroll → button appears → click toggles). Hides the button while scrolling, same as the old picker.

**New: [`renderOption` prop on `<PickerWheel>`](src/components/picker/PickerWheel.jsx)** — optional custom renderer for the visible 3D-cylinder side. The clone-scroller (hidden, used only for native scroll geometry) keeps plain text. `<MultiSelectWheel>` uses this to draw the per-day chip.

**[SchedulePickerTable.jsx](src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx)** — full rewrite:
- All five picker `<div ref={pickerRefs.X}>` slots replaced with `<PickerWheel>` (Action, Position, Scheduler, Repeat) and `<MultiSelectWheel>` (Days)
- New props: `setAction`, `setCoverPosition`, `setScheduler`, `setDays`, `setRepeat`
- `pickerRefs` prop dropped
- Inline helpers `daysValueToArray` / `arrayToDaysValue` round-trip the user-facing days display string ("Mo, Di" / "Täglich" / etc.) through an array — same predicate set as the legacy callback (`noDays` / `daily` / `weekdays` / `weekend`). Sort by weekday-order on the way back so the display string is stable.
- Position picker emits `'30%'`-style strings that get `parseInt`'d back to the integer state expected by the rest of the schedule pipeline

**[ScheduleTab.jsx](src/components/tabs/ScheduleTab.jsx)** — removed:
- Imports: `IOSPicker` / `MultiSelectPicker` from `IOSTimePicker`, all six init helpers from `pickerInitializers` (file deleted, see below)
- The `pickerRefs` object (six refs)
- The `pickersInitialized` flag map
- The 70-line `useEffect` that ran the imperative init pipeline 100ms after `showPicker` flipped to true
- The `updateView` helper — its DOM-poking (toggling `.schedule-option` row visibility, updating `#time-label` text) is now driven directly by JSX in SchedulePickerTable; the only meaningful side-effect (forcing time to `00:00` on switch to timer mode) lives in a new `handleSchedulerChange` wrapper passed as the scheduler picker's `onChange`

**[ClimateSettingsPicker.jsx](src/components/climate/ClimateSettingsPicker.jsx)** — dropped dead `TimePicker` and `MultiSelectPicker` imports (only `IOSPicker` is actually used).

**Deleted: `src/components/tabs/ScheduleTab/utils/pickerInitializers.js`** — all six init helpers (`initializeActionPicker`, `initializePositionPicker`, `initializeSchedulerPicker`, `initializeTimeFormatPicker`, `initializeDaysPicker`, `initializeRepeatPicker`) had no remaining callers after Phases 3-5.

### What's NOT in this release (and why)

The original plan called for deleting `src/components/IOSTimePicker.jsx` entirely in Phase 5. That isn't possible yet because two consumers still use it:

- **`<ClimateScheduleSettings>` and `<ClimateSettingsPicker>`** — five `new IOSPicker(...)` instantiations (temperature / hvacMode / fanMode / swingMode / presetMode + fanSpeed / horizontal / vertical)
- **`<TodoFormDialog>`** — `new DatePicker(...)` for the date-view (Phase 4 only migrated its TimePicker)

The legacy `TimePicker` and `MultiSelectPicker` classes inside `IOSTimePicker.jsx` are now dead code (no consumer), but the file as a whole stays. A future Phase 6 can either migrate the climate pickers + DatePicker or remove the dead classes inline.

### Behavior preserved (acceptance criteria from the plan)

- Action / Scheduler / Repeat / Position scroll-snap and onChange semantics match the legacy callback (one event per scroll-end, snapped to grid)
- Days picker: scroll → button appears → click toggles. Display string round-trips correctly through `daysValueToArray` / `arrayToDaysValue`
- Cover position: scrolling past `'50%'` updates the integer state to `50`
- Switching to timer mode resets time to `00:00` (replaces the legacy `updateView` side-effect)
- Schedule-option rows (Days / Repeat) hide in timer mode, time-label text flips between "Timer" and "Schedule" — both now JSX-reactive instead of DOM-poked
- All async resources (scroll listener, two rAFs, scroll-stop timeout, ResizeObserver) cleaned up on unmount — no leak across multi-edit

### Files touched

- `src/components/picker/PickerWheel.jsx` — added `renderOption` prop
- `src/components/picker/MultiSelectWheel.jsx` — NEW
- `src/components/picker/MultiSelectWheel.css` — NEW
- `src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx` — rewrite
- `src/components/tabs/ScheduleTab.jsx` — picker init pipeline removed
- `src/components/climate/ClimateSettingsPicker.jsx` — dead imports cleaned
- `src/components/tabs/ScheduleTab/utils/pickerInitializers.js` — DELETED
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Risk profile

ScheduleTab is the most-used edit UI in the app — schedules, timers, all_schedules inline-edit. A regression here means users can't edit time plans. Mitigation: the new `<PickerWheel>` is the same component already shipped in v1.1.1278+ inside `<TimePickerWheel>` and exercised in production for two days; this release just expands its consumer set.

## Version 1.1.1280 - 2026-04-27

**Title:** TodoFormDialog time picker migrated to `<TimePickerWheel>` (Phase 4 of the IOSPicker rebuild) — global 24h/AM-PM setting now applies to todos
**Hero:** none
**Tags:** todos, IOSPicker, Refactor, Picker-Rebuild

### Why

Phase 4 of the picker rebuild plan. `TodoFormDialog` had its own `new TimePicker(hoursElement, minutesElement, periodElement, options)` instantiation in a `useEffect` triggered by switching to the `'time'` view — independent from the ScheduleTab path migrated in v1.1.1279. This was the only other legacy TimePicker call site in the bundle.

A side benefit: the global System-Settings → 24h/AM-PM choice now actually applies in todos. Before, the dialog always rendered three slots (hours / minutes / period) and passed all three to `new TimePicker`, which forced the picker into 12h-mode regardless of the global setting. `<TimePickerWheel format="auto"` reads `is24hFormat()` and renders 2 wheels (24h) or 3 wheels (12h) accordingly — matching the ScheduleTab behavior introduced in v1.1.1274.

### Changes

**[TodoFormDialog.jsx](src/system-entities/entities/todos/components/TodoFormDialog.jsx)**:
- Imports: `TimePicker` removed, `TimePickerWheel` added
- Refs removed: `hoursRef`, `minutesRef`, `periodRef`, `timePickerRef`
- The `useEffect([currentView])` block that did the imperative `new TimePicker(...)` (with its `requestAnimationFrame` loop waiting for refs to attach) is gone
- Time-view JSX: the three `<div className="time-picker-wheel">` slots + `<div className="time-picker-separator">:</div>` replaced with a single `<TimePickerWheel value={dueTime || '09:00'} onChange={...} format="auto" />`
- `onChange` callback semantics preserved: still updates `dueTime`, `dueTimeDisplay`, and flips `setHasChanges(true)`
- Default fallback `'09:00'` matches the previous `['09', '00']` initial values

The `DatePicker` import stays — it is still consumed by the date-view `useEffect` (Phase 5 will deal with it).

### Behavior preserved + improved

- **Edit-open shows the saved value** — `<TimePickerWheel>` carries the same ResizeObserver visibility recovery as ScheduleTab, so opening the time view after the initial `display:none` mount anchors correctly
- **AM/PM works when global setting is `ampm`** — was effectively forced-12h before; now properly conditional
- **No memory leak on view switch** — the legacy code never disposed previous `TimePicker` instances when the view re-mounted; the new component cleans up its scroll listener / two rAFs / scroll-stop timeout / ResizeObserver on unmount

### Files touched

- `src/system-entities/entities/todos/components/TodoFormDialog.jsx` — import swap, refs removed, useEffect dropped, JSX replaced
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### What's next

Phase 5 — last leg of the rebuild. Migrate `Action`, `Position` (cover), `Scheduler`, `Days` (multi-select), and `Repeat` pickers in ScheduleTab to wrappers around `<PickerWheel>`. Once the last consumer is gone, delete `src/components/IOSTimePicker.jsx` (and the now-unused `pickerInitializers.js`) entirely.

## Version 1.1.1279 - 2026-04-27

**Title:** ScheduleTab time picker is now a reactive Preact component (Phase 3 of the IOSPicker rebuild)
**Hero:** none
**Tags:** ScheduleTab, IOSPicker, Refactor, Picker-Rebuild

### Why

Phase 3 of the picker rebuild plan from v1.1.1277 (see `docs/SESSION_NOTES_2026-04-26.md` §3). The ScheduleTab time picker was the largest legacy `IOSPicker`/`TimePicker` consumer — driven imperatively from a 600+ line useEffect that called `new TimePicker(hoursElement, minutesElement, periodElement, options)` and then poked at the resulting instance via dead methods (`setHourMode`, `reinitHours`, `setTime` — none of which existed; they failed silently). Replacing it with the new `<TimePickerWheel>` removes the imperative DOM manipulation, makes the controlled `value`/`onChange` flow obvious, and fixes a class of memory leaks (the legacy code re-instantiated `IOSPicker`s on every period switch without disposing the previous one).

The new components were built and smoke-tested in v1.1.1278 (`src/components/picker/PickerWheel.jsx` + `TimePickerWheel.jsx`) but stayed unused in the bundle until this release.

### Changes

**[SchedulePickerTable.jsx](src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx)** — replaced the manual three-`<div>` time-picker scaffold (`#picker-line-6-hours` / `.time-picker-separator` / `#picker-line-6-minutes` plus the conditional `#picker-line-6-period`) with a single `<TimePickerWheel value={timeValue} onChange={setTime} format={timeFormat} />`. Timer mode forces `format="24h"` (a duration has no AM/PM); schedule mode uses `"auto"` so the wheel honors the global System-Settings choice. Added `setTime` to the component's props.

**[ScheduleTab.jsx](src/components/tabs/ScheduleTab.jsx)** — removed:
- Imports: `TimePicker` from `IOSTimePicker`, `initializeTimePicker` from `pickerInitializers`
- Refs: `pickerRefs.hoursRef` / `minutesRef` / `periodRef`, plus the standalone `timePickerRef`
- The `initializeTimePicker(...)` block in the big picker-init `useEffect` (and the `pickersInitialized.current.time` flag)
- The `timePickerRef.current = null` cleanup (no longer needed)
- The `setTimeout(... timePickerRef.current.setTime(hour, minute) ...)` block in `handleItemClick` — `<TimePickerWheel>` already anchors to the latest `timeValue` prop
- The dead-method wall in `updateView` (`selectedHour='00'`, `setHourMode('24h')`, `reinitHours()`, `updateValue()`) — replaced with a single `setTime('00:00')`
- Pass `setTime` through to `<SchedulePickerTable>`

**[pickerInitializers.js](src/components/tabs/ScheduleTab/utils/pickerInitializers.js)** — removed `initializeTimePicker` and the now-unused `TimePicker` / `is24hFormat` imports. Other init helpers (`initializeActionPicker`, `initializeRepeatPicker`, etc.) stay until Phase 5.

### Behavior preserved (acceptance criteria from the plan)

- 24h mode: hour wheel anchors to the saved value on edit-open, even when the picker container is initially `display:none` — `<PickerWheel>` carries the same `ResizeObserver` recovery the legacy fix added in v1.1.1275
- 12h mode: hours show 01-12 + AM/PM, internal value stays canonical 24h, AM↔PM switch reuses the same hour-list (no rebuild)
- Re-mount on cancel/save scroll-syncs to `timeValue` automatically via the `[options, value]` sync effect
- No memory leak on multi-edit: every async resource (scroll listener, two rAFs, scroll-stop timeout, ResizeObserver) is cleaned up on unmount

### Files touched

- `src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx` — TimePickerWheel mount, `setTime` prop, `timeFormat` derivation
- `src/components/tabs/ScheduleTab.jsx` — removed time-picker imperative path, passes `setTime` down
- `src/components/tabs/ScheduleTab/utils/pickerInitializers.js` — `initializeTimePicker` and stale imports removed
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### What's next

Phase 4 migrates `TodoFormDialog` (the only other `new TimePicker(...)` call site). Phase 5 finishes off Action / Days / Repeat / Position / Scheduler with `<PickerWheel>` and removes `IOSTimePicker.jsx` entirely.

## Version 1.1.1278 - 2026-04-27

**Title:** ScheduleTab picker polish — period choices, repeat from backend, separator gradient parity
**Hero:** none
**Tags:** ScheduleTab, IOSPicker, Polish, Bugfix

### Why

Three small picker issues left over from the v1.1.1273-1277 wave, bundled into one release as a clean baseline before the upcoming `<PickerWheel>` rebuild:

1. **Period picker still offered "24h"** as a third option even though the global 24h/AM-PM setting now lives in System-Settings (since v1.1.1274). When a `periodElement` is passed at all, we are by definition in 12h-mode — only AM/PM make sense.
2. **Repeat wheel was hardcoded to "Einmalig"** on edit-open, regardless of the schedule's actual `repeat_type`. Editing a recurring schedule and tapping Save without touching the Repeat wheel silently flipped it to single.
3. **Separator gradient was a single 210px gradient** with manual stops at 42.86%/57.14%, while the wheel columns (`.picker-up`/`.picker-down`) use two separate 90px overlays. Sub-pixel rounding made the dark frame in the colon column slightly different from the wheels under some zoom levels.

### Changes

**Period choices reduced to AM/PM** ([IOSTimePicker.jsx:235-255](src/components/IOSTimePicker.jsx#L235)). `periodData` is now `['AM', 'PM']`. If a legacy caller still has `selectedPeriod === '24h'` in its state, we fall back to AM via `Math.max(0, indexOf(...))`. The 24h/12h decision is now purely owned by `is24hFormat()` in System-Settings.

**Repeat wheel reads from `item.repeat_type`** ([editStateLoaders.js:73-102](src/components/tabs/ScheduleTab/utils/editStateLoaders.js#L73)). `loadScheduleState` and `loadTimerState` now accept `setRepeat`. Schedules: `repeat_type === 'single'` → `t('once')`, otherwise `t('regular')`. Timers: always `t('once')` (timer = einmalig per Definition). [`initializeRepeatPicker`](src/components/tabs/ScheduleTab/utils/pickerInitializers.js#L140) accepts a `currentValue` and positions the wheel on it instead of always defaulting to index 1.

**Separator gradient split into two 90px overlays** ([ScheduleTab.css:485-500](src/components/tabs/ScheduleTab/styles/ScheduleTab.css#L485)). Replaced the single `linear-gradient(180deg, ...)` with stops at 42.86%/57.14% by two no-repeat backgrounds: one 90px from the top, one 90px from the bottom. Pixel-identical to `.picker-up` and `.picker-down` on the wheel columns, so all three columns frame the center band the exact same way at every zoom level.

### Files touched

- `src/components/IOSTimePicker.jsx` — period picker data reduced to `['AM', 'PM']`
- `src/components/tabs/ScheduleTab/utils/editStateLoaders.js` — `loadScheduleState` / `loadTimerState` set repeat from `item.repeat_type`
- `src/components/tabs/ScheduleTab/utils/pickerInitializers.js` — `initializeRepeatPicker(ref, t, setRepeat, currentValue)` honors the current state
- `src/components/tabs/ScheduleTab.jsx` — passes `setRepeat` through to the state loaders, passes `repeatValue` to `initializeRepeatPicker`
- `src/components/tabs/ScheduleTab/styles/ScheduleTab.css` — `.time-picker-separator` background = two 90px overlays
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

## Version 1.1.1277 - 2026-04-26

**Title:** TimePicker layout: equal-share wheels work for both 24h (2 wheels) and 12h (3 wheels)
**Hero:** none
**Tags:** ScheduleTab, IOSPicker, Bugfix

### Why

After v1.1.1274 wired the global 24h/AM-PM setting to the TimePicker, switching to AM/PM mode added a third wheel column (period) to the picker. But `.time-picker-container > div:first-child` and `> div:last-child` still hard-pinned `max-width: 50%`. With 3 wheels + 20px separator that meant: hours = 50% (first), period = 50% (last), minutes squeezed in between → the entire picker shifted left and looked broken.

### Changes

**Width rule generalized** ([ScheduleTab.css:475-485](src/components/tabs/ScheduleTab/styles/ScheduleTab.css#L475)). Replaced the two `:first-child` / `:last-child` rules with one rule targeting any wheel column (= any direct `<div>` that isn't `.time-picker-separator`):

```css
.time-picker-container > div:not(.time-picker-separator) {
  flex: 1;
  min-width: 0;
}
```

Each wheel gets equal share of the remaining space after the 20px separator. 24h mode: 2 wheels ≈ 50% each. 12h mode: 3 wheels ≈ 33% each. No `max-width` cap needed — flex-1 + min-width-0 handles it cleanly.

### Files touched

- `src/components/tabs/ScheduleTab/styles/ScheduleTab.css` — `.time-picker-container` child width rule generalized

## Version 1.1.1276 - 2026-04-26

**Title:** TodoDetailView CSS for `.time-picker-separator` was unscoped — it was overriding ScheduleTab's picker
**Hero:** none
**Tags:** ScheduleTab, todos, CSS, Bugfix

### Why

The schedule edit picker's center column (the colon between hours and minutes) looked different from the wheel columns: the dark gradient that frames the selected band was missing, and the inspector showed `background: transparent` plus `z-index: 11` winning over ScheduleTab's gradient. Source: two unscoped `.time-picker-separator { ... }` rules in `TodoDetailView.css` that bled into ScheduleTab and overrode the gradient + raised the separator above the new container hairlines (so they appeared discontinuous).

### Changes

**Both `.time-picker-separator` rules in [TodoDetailView.css](src/system-entities/entities/todos/styles/TodoDetailView.css) scoped to their todos containers**:
- The rule near line 224 → scoped to `.todo-time-picker-wheels .time-picker-separator`
- The rule near line 523 (the one with `z-index: 11`) → scoped to `.todo-picker-container .time-picker-separator`
- The matching `:before/:after { height: 0 }` killers also scoped (they were nuking the schedule container's hairlines globally)

**Result:** ScheduleTab's `.time-picker-separator` keeps its proper `linear-gradient(180deg, rgba(0,0,0,.25), transparent 42.86%, transparent 57.14%, rgba(0,0,0,.25))` background and the colon column now has the same dark frame at top/bottom as the wheel columns. The container-level hairlines from v1.1.1275 (`.time-picker-container::before/::after`) now sit above the separator and form one continuous line across all three columns.

### Files touched

- `src/system-entities/entities/todos/styles/TodoDetailView.css` — three `.time-picker-separator*` rules scoped to their todos wrappers; one redundant `:before/:after { height: 0 }` block deleted

## Version 1.1.1275 - 2026-04-26

**Title:** TimePicker shows actual saved value when expanded; center-band hairlines now seamless
**Hero:** none
**Tags:** ScheduleTab, IOSPicker, Bugfix

### Why

Two related visual bugs in the schedule edit picker:

1. **Wheel showed `00:00` even though the schedule's saved time was `21:00`.** The header on top of the picker correctly showed `21:00` (from React state), but the wheel column was stuck at index 0. Reproducible by opening any schedule's inline-edit and clicking the "Zeitplan"-row to expand the time picker.

2. **Selection-band hairlines didn't line up across columns.** The horizontal lines that frame the center "selected" row were drawn three separate times — `picker-up`'s `border-bottom`, `picker-down`'s `border-top`, and the `time-picker-separator`'s `::before/::after` pseudos — at slightly different y-coordinates and different widths. Visible as small steps where the lines met the colon column.

### Changes

**`IOSPicker` re-applies its initial scroll position once the element first becomes visible** ([IOSTimePicker.jsx:16-37](src/components/IOSTimePicker.jsx#L16)). Root cause of #1: `div.picker { display: none; }` is the default styling for all picker rows in the schedule table — they only become visible when the user clicks a row to expand. But IOSPicker's `init()` runs as soon as the picker DOM mounts (before the row gets expanded). At init time, the scroll container has 0 visible height, so `cloneScroller.scrollTop = lineHeight * selected` has no effect — the wheel is stuck at index 0 forever, even after the row becomes visible.

Fix: a `ResizeObserver` watches the scroll container. The first time the container reports a non-zero height (= the row got expanded), the observer re-applies `scrollTop = lineHeight * selected`, calls `updateRotation()`, then disconnects. One-shot — won't interfere with user scrolling later. Falls back gracefully on environments without `ResizeObserver` (very old browsers).

Added a public `scrollToSelected()` method too, in case external consumers need to re-center the picker programmatically. Also stashed `this.element._iosPicker = this` so consumers can find the instance from the DOM.

**Center-band hairlines unified into one continuous line per side** ([ScheduleTab.css:402-428,459-486](src/components/tabs/ScheduleTab/styles/ScheduleTab.css#L402)). Removed:
- `.picker-up { border-bottom: 1px ... }` (was at y=90-91 without box-sizing)
- `.picker-down { border-top: 1px ... }` (was at y=120-121)
- `.time-picker-separator::before` (was at y=89, off by 1)
- `.time-picker-separator::after` (was at y=120)

Replaced with two pseudo-elements on `.time-picker-container` that span the entire row — one at `top: 90px`, one at `top: 120px`, both `1px` tall, `rgba(255,255,255,0.3)`, `z-index: 3`. One line, no offsets, no width gaps.

### Files touched

- `src/components/IOSTimePicker.jsx` — `ResizeObserver`-based scroll re-apply, `scrollToSelected()` method, instance back-reference
- `src/components/tabs/ScheduleTab/styles/ScheduleTab.css` — three-piece hairlines collapsed into two `.time-picker-container` pseudos

## Version 1.1.1274 - 2026-04-26

**Title:** all_schedules edit-flow polish + grouping cycle + global 24h/AM-PM time format setting
**Hero:** none
**Tags:** all_schedules, ScheduleTab, Settings, UX

### Why

A bunch of follow-ups from v1.1.1273 plus a new global setting:

1. **Brief flash of ScheduleTab's normal list before the edit picker opens.** v1.1.1273's render guard `!!initialEditItem && !showPicker && !editingItem` failed because `setEditingItem` fires before the 100ms `setShowPicker` timeout — making the guard turn off too early.
2. **"Abbrechen" button did nothing.** It called `resetPickerStates` which set `showPicker = false`, leaving the user looking at an empty container (since the list is hidden by the inline-edit guard). No way back to the all_schedules overview.
3. **Action labels rendered as raw translation keys** (`ui.schedule.schedule_close`, `ui.schedule.setTemperature`). The `t` helper in AllSchedulesView already prefixes with `schedule.`; calling `t('schedule.X')` produces `schedule.schedule.X`, which doesn't exist in the translations.
4. **`ui.schedule.createInDetailView` footer text** at the bottom of all_schedules — taking up space, raw key shown.
5. **Need a global toggle for grouping** like news has (Quellen / Topics / Themen) — for all_schedules the natural dimensions are Type (Klima/Rollläden) / Devices (entity friendly_name) / Rooms (area name).
6. **No global 24h vs AM/PM setting** anywhere in the system. Per-schedule Zeitformat-row was removed in v1.1.1273; now there's nowhere to choose.

### Changes

**Inline-edit list-flash fully fixed** ([ScheduleTab.jsx:553-557](src/components/tabs/ScheduleTab.jsx#L553)). Render-guard simplified from `!!initialEditItem && !showPicker && !editingItem` to `!!initialEditItem`. When `initialEditItem` is set (= called from all_schedules), the entire normal ScheduleTab UI (`<ScheduleFilter>`, `<ScheduleList>`, `<AddScheduleButton>`) is suppressed for the lifetime of the inline-edit. Only the picker renders. No more flash.

**`onClose` prop on ScheduleTab + parent gets notified on cancel/save** ([ScheduleTab.jsx:49,159-171](src/components/tabs/ScheduleTab.jsx#L49)). New optional `onClose` prop. Inside `resetPickerStates` (which runs on Cancel and after a successful Save), `onClose` fires with a 100ms delay so any refresh calls finish first. all_schedules passes `handleCloseEdit` to it — clicking Abbrechen now correctly returns to the overview list. Save also returns to overview.

**Action label translation keys fixed** ([AllSchedulesView.jsx:153-180](src/system-entities/entities/all-schedules/AllSchedulesView.jsx#L153)). Removed the double `schedule.` namespace prefix in all action lookups (`t('schedule.close')` → `t('close')`, etc.). Added `setTemperature` to de+en translations (was missing entirely). Fallback for unknown service names: capitalize the service tail (`light.toggle` → `Toggle`) instead of showing the raw service path.

**Footer removed** ([AllSchedulesView.jsx](src/system-entities/entities/all-schedules/AllSchedulesView.jsx)). `info-footer` div with `ui.schedule.createInDetailView` placeholder text deleted from the JSX.

**Grouping-mode cycle button** ([AllSchedulesView.jsx:131-148, 222-251, 273-290, 461-490](src/system-entities/entities/all-schedules/AllSchedulesView.jsx#L131)). Three modes:
- **Typ** (default, orange via `mode-topics`) — chips show domains (Klima, Rollläden, Lichter, Schalter, ...)
- **Geräte** (blue via `mode-quellen`) — chips show device friendly_names
- **Räume** (purple via `mode-themen`) — chips show room/area names

New `getEntityArea(entityId)` helper resolves area name through the registry chain: entity-registry → device-registry → state-attr → `hass.areas[id].name`. Each schedule item gets `deviceName` and `roomName` precomputed during `processAllSchedules` so the toolbar render stays cheap. Filter logic uses `groupingFieldOf(item)` to pick the right field per mode. Click cycles the mode and resets `categoryFilter`. Chip toggle behaviour identical to news (click active chip again = deactivate). Search now also looks at `deviceName` and `roomName`.

Reuses the news mode-button CSS classes (`.news-grouping-mode-btn.mode-topics/-quellen/-themen`) since both views are in the same bundle and the styling is identical.

**Global 24h vs AM/PM time format setting** ([timeFormatPreference.js](src/utils/timeFormatPreference.js), [GeneralSettingsTab.jsx](src/components/tabs/SettingsTab/components/GeneralSettingsTab.jsx)).
- New `src/utils/timeFormatPreference.js` helper with `readTimeFormat()` / `writeTimeFormat()` / `is24hFormat()`. Stored in `localStorage.userTimeFormat`. Writes dispatch a `timeFormatChanged` event for live reactivity.
- New row in Settings → Allgemein, after Währung: "Zeitformat" / "Wähle 24-Stunden oder AM/PM". Tap opens a sub-view with two radio-style options: "24-Stunden (z.B. 21:00)" and "12-Stunden (AM/PM) (z.B. 9:00 PM)". Same visual pattern as the existing currency picker.
- Translations added to de + en under the same section as `appCurrency`.

**TimePicker now respects the global preference** ([pickerInitializers.js:153-180](src/components/tabs/ScheduleTab/utils/pickerInitializers.js#L153), [SchedulePickerTable.jsx:130-141](src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx#L130), [ScheduleTab.jsx:177-181](src/components/tabs/ScheduleTab.jsx#L177)). `pickerRefs` gets a new `periodRef`. The picker table conditionally renders the period DOM slot — only when 12h-mode is active. `initializeTimePicker` reads `is24hFormat()` and either passes `periodEl=null + hourMode='24h'` or `periodEl=ref.current + hourMode=undefined` (which lets TimePicker derive AM/PM from the initial hour). Same hour 21:00 now shows as "21" in 24h mode or "PM 09" with AM/PM mode visible.

### Files touched

- `src/components/tabs/ScheduleTab.jsx` — `onClose` prop, `resetPickerStates` calls it, render-guard simplified, `pickerRefs.periodRef` added
- `src/system-entities/entities/all-schedules/AllSchedulesView.jsx` — grouping mode state + helpers, action key translations fixed, footer removed
- `src/components/tabs/ScheduleTab/utils/pickerInitializers.js` — reads global time format
- `src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx` — conditional period DOM slot
- `src/utils/timeFormatPreference.js` — new helper module
- `src/components/tabs/SettingsTab/components/GeneralSettingsTab.jsx` — Zeitformat row + sub-view
- `src/utils/translations/languages/de.js` + `en.js` — new keys

### Notes

The TodoFormDialog also uses TimePicker but is not yet wired to the new preference — it always renders the period element. Easy follow-up if needed: read `is24hFormat()` and conditionally hide the period slot the same way.

## Version 1.1.1273 - 2026-04-26

**Title:** Schedule edit fixes — TimePicker now shows the actual saved time, picker UI flash gone, Zeitformat-row removed
**Hero:** none
**Tags:** ScheduleTab, all_schedules, Bugfix, UX

### Why

Three follow-up issues from v1.1.1272's all_schedules inline-edit:

1. **Wrong time in the picker wheel.** Editing a 21:00 schedule, the picker showed `01:00` (or always `09:00` after the AM/PM conversion) instead of the saved value. Header was correct, picker wasn't.
2. **List flashes briefly before edit opens.** ~100ms of the ScheduleTab's normal list/filter UI showed up between the click and the picker appearing.
3. **Header showed aggregate counts during edit.** "11 Zeitpläne / 0 Timer · 11 Pläne" stayed visible while editing a specific device's schedule.
4. **Redundant Zeitformat-row** (24h / AM / PM picker inside the schedule itself) — that choice belongs in global system settings, not per-schedule.

### Changes

**TimePicker constructor call corrected** ([pickerInitializers.js:153-178](src/components/tabs/ScheduleTab/utils/pickerInitializers.js#L153)). Old code passed three arguments to `new TimePicker(hoursEl, minutesEl, optionsObject)` — but the constructor signature is `(hoursElement, minutesElement, periodElement, options)`. The options object was being interpreted as `periodElement`, so the *real* options (`callback`, `initialHour`, `initialMinute`, `hourMode`) all silently fell back to defaults. Result: callback was a no-op (so React's `setTime` was never wired up), `initialHour` defaulted to `'09'`, and the period picker tried to attach to the options object as if it were a DOM element. New call passes `null` as the third argument and the options as the fourth.

**TimePicker resilient to null `periodElement` and supports 24h-only mode** ([IOSTimePicker.jsx:138-235](src/components/IOSTimePicker.jsx#L138)). New `is24h = !this.periodElement || options.hourMode === '24h'` flag. When true: hours data spans 00-23 instead of 01-12, period auto-set to `'24h'`, no AM/PM conversion of the initial hour, and `periodPicker` instantiation is skipped (avoids the previous IOSPicker crash on null element). Defensive `Math.max(0, hoursData.indexOf(...))` so a non-matching value falls back to index 0 instead of `-1`.

**ScheduleTab list/filter/add hidden during the auto-edit transition** ([ScheduleTab.jsx:551-583](src/components/tabs/ScheduleTab.jsx#L551)). New `isAutoEditing = !!initialEditItem && !showPicker && !editingItem` guard wraps the `<ScheduleFilter>`, `<ScheduleList>`, and `<AddScheduleButton>` in a fragment that only renders when NOT auto-editing. The picker still renders below (because it has its own `showPicker` gate). Result: clicking from all_schedules drops directly into a blank panel that becomes the picker once `handleItemClick` finishes, with no list flash.

**Auto-edit trigger uses `Promise.resolve().then` instead of a 250ms `setTimeout`** ([ScheduleTab.jsx:399-410](src/components/tabs/ScheduleTab.jsx#L399)). Microtask scheduling: gives React one tick to mount and process state, then fires immediately. Combined with the auto-editing render guard above, the perceived delay drops from ~350ms to whatever `handleItemClick`'s internal 100ms `setTimeout` requires.

**Header now shows the device when editing inline** ([DetailView.jsx:344-368](src/components/DetailView.jsx#L344), [AllSchedulesView.jsx:206-219](src/system-entities/entities/all-schedules/AllSchedulesView.jsx#L206)). `getAllSchedulesHeaderInfo()` checks `selectedSchedule` first: if set, returns `stateText: <deviceName>` and `stateDuration: "<DomainLabel> · bearbeiten"` (e.g. "Flur" / "Klima · bearbeiten"). The ViewRef now exposes `selectedScheduleDeviceName` (resolved from `hass.states[entities[0]].friendly_name`) and `selectedScheduleDomainLabel` so the header lookup is a pure read.

**Zeitformat-row removed from `SchedulePickerTable`** ([SchedulePickerTable.jsx:95-96](src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx#L95)). Per-schedule 24h/AM/PM choice is gone. TimePicker runs in 24h mode only; if a user wants AM/PM globally, that's a system-settings job. The `initializeTimeFormatPicker` call in `ScheduleTab` is also dropped since the DOM slot no longer exists.

### Files touched

- `src/components/tabs/ScheduleTab.jsx` — `initialEditItem` ref-based trigger via microtask, `isAutoEditing` render guard, `initializeTimeFormatPicker` call removed
- `src/components/tabs/ScheduleTab/utils/pickerInitializers.js` — `new TimePicker(...)` call signature fixed
- `src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx` — Zeitformat-row + picker container removed
- `src/components/IOSTimePicker.jsx` — `is24h` mode support, null `periodElement` guarded, `selected` index defensive
- `src/components/DetailView.jsx` — `getAllSchedulesHeaderInfo` returns device-context header during inline-edit
- `src/system-entities/entities/all-schedules/AllSchedulesView.jsx` — ViewRef exposes `selectedScheduleDeviceName` / `selectedScheduleDomainLabel`

## Version 1.1.1272 - 2026-04-26

**Title:** all_schedules inline-edit — click on a schedule edits in place, no navigation away
**Hero:** none
**Tags:** all_schedules, UX

### Why

Clicking a schedule in `all_schedules` previously called `onNavigate(targetEntityId, { openTab: 'schedule' })` and dropped the user into the device-detail view's `ScheduleTab`. Two clicks (item → device detail → schedule list → click again to edit), and the user lost their place in the schedule overview. User wants direct edit-in-place: click → edit picker opens → save → back to overview.

### Changes

**`ScheduleTab` accepts an `initialEditItem` prop** ([ScheduleTab.jsx:49,128-132,389-403](src/components/tabs/ScheduleTab.jsx#L49)). When set, the tab auto-fires `handleItemClick(editItem)` 250ms after mount, so the picker opens pre-filled with that schedule's time / days / action / domain-specific settings. `handleItemClick` is referenced through a `ref` (set after its `const` declaration) because of TDZ: the trigger `useEffect` runs at the top of the function but `handleItemClick` is defined further down. Defensive shape coercion: `editItem.domain = editItem.domain || editItem.domainRaw` since all_schedules uses the latter.

**`AllSchedulesView` click handler swapped from navigation to local state** ([AllSchedulesView.jsx:339-352](src/system-entities/entities/all-schedules/AllSchedulesView.jsx#L339)). Out: `onNavigate(targetEntityId, { openTab: 'schedule' })`. In: `setSelectedSchedule(schedule)` plus closing search/settings if open. New `handleCloseEdit()` clears `selectedSchedule` and bumps `refreshTrigger` so the list reloads after potential edits.

**Inline edit branch in render** ([AllSchedulesView.jsx:444-468](src/system-entities/entities/all-schedules/AllSchedulesView.jsx#L444)). When `selectedSchedule` is set, the toolbar/list is replaced by a `<ScheduleTab>` mounted inline. The `item` prop is constructed on the fly from `selectedSchedule.entities[0]` looked up against `hassRef.current.states` (entity_id, domain, friendly_name, attributes, state). `initialEditItem={selectedSchedule}` triggers the auto-edit. `onTimerCreate` / `onScheduleCreate` callbacks point to `handleCloseEdit` (mostly a no-op for edits, since updates take a different code path inside ScheduleTab — but covers the create-from-edit-mode case).

**Back-navigation hierarchy extended** ([AllSchedulesView.jsx:267-275](src/system-entities/entities/all-schedules/AllSchedulesView.jsx#L267)). `handleBackNavigation` priority: selected-schedule → settings → search → onBack(). The Detail-Header's back-button (which already invokes `handleBackNavigation` via the all_schedules ViewRef) now correctly closes the inline-edit and returns to the overview list.

**ViewRef now exposes `selectedSchedule`** so DetailView can react to the inline-edit state if needed (e.g. header swap in a follow-up).

### Tradeoffs

The embedded `ScheduleTab` brings its own UI with it: its own filter row (Alle/Timer/Zeitpläne), its own list of schedules-for-this-device, its own AddScheduleButton. Effectively two filter rows visible, and the list shown inline shows only schedules for the clicked schedule's parent device, not the whole overview. This is a pragmatic first iteration — full functionality is preserved, but UX is denser than ideal. A follow-up could trim the embedded UI down to just the picker (no filter/list/add) when in initialEditItem mode.

### Files touched

- `src/components/tabs/ScheduleTab.jsx` — `initialEditItem` prop + ref-based auto-trigger
- `src/system-entities/entities/all-schedules/AllSchedulesView.jsx` — `selectedSchedule` state, click handler swap, inline-edit branch, back-navigation hierarchy, ViewRef
- `src/system-entities/styles/AllSchedulesView.css` — `.all-schedules-edit-wrapper` scroll container

## Version 1.1.1271 - 2026-04-26

**Title:** all_schedules adopts the news design language — same toolbar, same cards, same detail-tabs, same header
**Hero:** none
**Tags:** all_schedules, News, UX, Architecture

### Why

User wants the news view's design (toolbar / detail-tabs / detail-header-info / card layout) applied 1:1 to other system entities. First target: `system.all_schedules`. Goal is a consistent visual language across system entities so users don't relearn each view.

### Changes

**Entity action-buttons** ([all-schedules/index.js:24-29](src/system-entities/entities/all-schedules/index.js#L24)). Added `actionButtons: [overview, search, settings, refresh]` matching the news entity's set. The slider in `TabNavigation` now tracks an active button for all_schedules just like for news.

**Toolbar replaced with the news pattern** ([AllSchedulesView.jsx:435-501](src/system-entities/entities/all-schedules/AllSchedulesView.jsx#L435)). Out: the old sticky `.filter-tabs-container` with the gradient `.scheduler-filter-slider` and 3 plain text tabs (Alle / Timer / Zeitpläne). In: the news `.news-filter-bar` layout — three compact `.news-status-btn` icon-pills (list / clock / calendar SVGs + counts) for status filter, then a `.news-toolbar-divider`, then `.filter-tab` chips for the unique device-domains found across the items (Klima, Lichter, Rollläden, Schalter, ...). Status filters are exclusive (radio); chips toggle on click (active again deactivates the filter). The two filters compose: status × domain × search.

**Cards now use `.news-article-card` styling** ([AllSchedulesView.jsx:506-553](src/system-entities/entities/all-schedules/AllSchedulesView.jsx#L506)). Out: the old `.scheduler-item` with `.item-icon` / `.item-content` / `.item-time` / `.item-type` badge. In: the news card structure — left a 55×55 `.article-thumbnail` tile holding the timer/schedule SVG icon (a small CSS override `.schedule-thumbnail` swaps the news image-background for a dark tile with a centered icon and hides the gradient overlay). Right side: `.article-category-badge.category-${domainRaw}` + `.article-title` (entity friendly_name) + `.article-footer` (time · days · action). Stagger animation, hover scale, transition timing all match news.

**Domain badge color rules** ([NewsView.css:526-549](src/system-entities/entities/news/styles/NewsView.css#L526)). Added 6 new `.article-category-badge.category-*` rules so the badges work for the schedule domains too, sharing the news badge styling: climate (blue), light (orange), cover (green), switch (grey), fan (teal), media_player (purple).

**Search inline-bar** ([AllSchedulesView.jsx:419-446](src/system-entities/entities/all-schedules/AllSchedulesView.jsx#L419)). Same pattern as news: tapping the search action-button toggles `searchOpen`; the toolbar gets replaced by a `.news-search-row` with a `.news-search` pill (magnifier + autofocused `<input>` + clear-X). Filters items by entity name / action / days / time / domain label as you type. Closing search clears the query.

**Settings stub** ([AllSchedulesView.jsx:407-419](src/system-entities/entities/all-schedules/AllSchedulesView.jsx#L407), [AllSchedulesView.css:78-105](src/system-entities/styles/AllSchedulesView.css#L78)). The settings action-button is wired but all_schedules has no real settings yet. Renders a centered placeholder ("⚙️ Einstellungen kommen demnächst") so the slot in the action-button row isn't dead.

**`window._allSchedulesViewRef` exposes** the same surface as `_newsViewRef`: `handleOverview`, `handleOpenSettings`, `handleToggleSearch`, `handleRefresh`, `handleBackNavigation`, `getActiveButton`, plus stats (`totalCount`, `timerCount`, `scheduleCount`, `showSettings`, `searchOpen`).

**Wiring across the shared infrastructure**:
- `TabNavigation.jsx` — `_allSchedulesViewRef` added to the view-ref chain (3 places) and to `handleActionClick` for `back` / `overview` / `settings` / `refresh` / `search`. Slider opacity now correctly hides when no button matches the active mode.
- `DetailView.jsx` — added an event listener for `all-schedules-view-state-changed` that re-runs `updateActionButtons` so the slider refreshes on toggle. New `getAllSchedulesHeaderInfo()` returns `"X Zeitpläne / Y Timer · Z Pläne"` and is added to the `stateText`/`stateDuration` fallback chain alongside the news/todos/printer header info.

**Container restyled** ([AllSchedulesView.css:9-30](src/system-entities/styles/AllSchedulesView.css#L9)). The old flat `padding: 0 16px` is gone. `.all-schedules-view` now matches `.news-view-container`: `width: 100%; height: 100%; max-height: 555px; background: rgba(0, 0, 0, 0.2); border-radius: 24px; overflow: hidden; position: relative` so the CustomScrollbar positions correctly inside it (same fix as the v1.1.1259 news scrollbar issue).

**News CSS imported into AllSchedulesView**. Both views share the same toolbar / chip / card classes; importing `../news/styles/NewsView.css` from `AllSchedulesView.jsx` ensures the styles are loaded even when the user opens schedules without ever opening news. Vite dedupes the CSS so the bundle doesn't grow.

### Migration note for the next entity

The pattern is now reusable. To onboard another system entity (e.g. `weather`, `todos`, `versionsverlauf`):
1. Add `actionButtons: [overview, search, settings, refresh]` to the entity config (or whichever subset makes sense).
2. Expose `window._<entity>ViewRef` with `handleOverview` / `handleOpenSettings` / `handleToggleSearch` / `handleRefresh` / `handleBackNavigation` / `getActiveButton` + stat fields.
3. Dispatch a `<entity>-view-state-changed` event on state transitions.
4. Add the ref to the chain in `TabNavigation.jsx` (3 lines) and to each action handler (1 line per case).
5. Add a `get<Entity>HeaderInfo()` to `DetailView.jsx` and append to the fallback chain.
6. In the view JSX: import `NewsView.css`, use `.news-filter-bar` / `.news-status-btn` / `.filter-tab` / `.news-article-card` / `.news-search-row`. Container styled like `.news-view-container`.

### Files touched

- `src/system-entities/entities/all-schedules/index.js` — actionButtons
- `src/system-entities/entities/all-schedules/AllSchedulesView.jsx` — full restructure (state, handlers, ref, search, settings stub, JSX)
- `src/system-entities/styles/AllSchedulesView.css` — container restyled, schedule-thumbnail override, settings-stub, footer; old scheduler-item / filter-tabs / scheduler-filter-slider rules removed
- `src/system-entities/entities/news/styles/NewsView.css` — 6 new domain badge color rules (climate/light/cover/switch/fan/media_player)
- `src/components/DetailView/TabNavigation.jsx` — `_allSchedulesViewRef` in ref-chain + 5 action handlers
- `src/components/DetailView.jsx` — event listener + `getAllSchedulesHeaderInfo`

## Version 1.1.1270 - 2026-04-26

**Title:** PurgeCSS no longer strips dynamic mode-classes; nav arrows reposition top-right; ghost-list fix for prev/next navigation
**Hero:** none
**Tags:** News, Bugfix, Build

### Why

Three things shipped together:

1. The per-mode background colors from v1.1.1269 (`.mode-quellen`, `.mode-topics`, `.mode-themen`) were being **stripped at build time by PurgeCSS** — the className uses dynamic interpolation (`mode-${groupingMode}`), so the static class extractor never saw the literal class names and treated them as unused.
2. The floating prev/next arrows from v1.1.1269 were vertically centered overlay buttons; user wants them anchored top-right at the height of the article's category badge.
3. **Backward and forward buttons broke when the active article got auto-marked as read while the status filter was set to "Ungelesen"** — the article instantly fell out of `filteredArticles`, so `findIndex` returned -1 and both prev/next went to `null`. Same root cause for the "first article = forward dead" report and the "backward never works" report.

### Changes

**PurgeCSS safelist extended** ([postcss.config.cjs:65-71](postcss.config.cjs#L65)). Added `/^mode-/`, `/^news-/`, and `/^article-/` to the deep regex safelist. Confirmed in `dist/fast-search-card.js` that `.mode-quellen`, `.mode-topics`, and `.mode-themen` now survive minification with their respective `#007aff` / `#ff9500` / `#af52de` backgrounds. The grouping-mode button now actually shows the per-mode color it was supposed to since v1.1.1269.

**Nav arrows now top-right at category-badge height** ([NewsView.css:868-902](src/system-entities/entities/news/styles/NewsView.css#L868)). Removed the `top: 50%; transform: translateY(-50%)` floating-vertical-center positioning. New layout: `top: 28px`, prev at `right: 60px`, next at `right: 20px` — both 32×32 (down from 40×40) so they fit visually at the top corner without competing with the badge or the title. Hover/active scale transforms no longer need to compensate for the centering transform.

**Navigation Ghost-List fix** ([NewsView.jsx:683-700, 332-359](src/system-entities/entities/news/NewsView.jsx#L683)). The render path (and the keyboard handler) now build a `navigationList` that's `filteredArticles` plus the active article re-inserted at its natural date-sorted position when it's been filtered out. Trigger case: status filter `unread` + `autoMarkRead: true` setting → opening any article instantly removes it from the visible list, causing `findIndex(a.id === selectedArticle.id)` to return -1 and both prev/next to evaluate to null. With the ghost-list approach, navigation order is preserved across the read state-change and you can keep stepping through.

### Files touched

- `postcss.config.cjs` — safelist regexes for `mode-`, `news-`, `article-`
- `src/system-entities/entities/news/NewsView.jsx` — `navigationList` ghost-list logic in render + keydown handler
- `src/system-entities/entities/news/styles/NewsView.css` — `.news-detail-nav-arrow(-prev/-next)` repositioned + resized

## Version 1.1.1269 - 2026-04-26

**Title:** News article-detail prev/next nav, mode-button restyled to match chips with per-mode color
**Hero:** none
**Tags:** News, UI, Polish

### Changes

**Floating prev/next arrows in the article detail view** ([NewsView.jsx:684-712](src/system-entities/entities/news/NewsView.jsx#L684), [NewsView.css:868-899](src/system-entities/entities/news/styles/NewsView.css#L868)). Two 40px circular buttons with `backdrop-filter: blur(12px) saturate(140%)` overlay the news container at vertical center, left and right edges (`left/right: 12px`). They navigate through `filteredArticles` (so they respect the current status / topic / search filter — clicking next from the last visible article won't jump to a hidden one). Hidden when no prev/next exists. Hover scales up by 1.06, click presses to 0.96.

**Keyboard navigation in the detail view** ([NewsView.jsx:329-348](src/system-entities/entities/news/NewsView.jsx#L329)). `ArrowLeft` / `ArrowRight` walk through the same filtered list. The handler ignores keystrokes targeting `<input>`, `<textarea>`, or `contentEditable` elements, so typing in the search bar isn't affected.

**Mode-cycle button restyled** ([NewsView.jsx:809-821](src/system-entities/entities/news/NewsView.jsx#L809), [NewsView.css:121-152](src/system-entities/entities/news/styles/NewsView.css#L121)). Previous version had its own typography (12px, weight 600, letter-spacing) that didn't match the surrounding chip pills. Now uses identical `.filter-tab` typography: `padding: 8px 16px`, `border-radius: 20px`, `font-size: 14px`, `font-weight: 500`. The swap-icon SVG is gone — the label alone is enough since each mode also has a distinct background color.

**Per-mode background color on the cycle button**. Each mode now wears one of three iOS system colors with matching glow:
- **Quellen** → blue `rgb(0, 122, 255)` + blue box-shadow
- **Topics** → orange `rgb(255, 149, 0)` + orange box-shadow (matches `--news-orange`)
- **Themen** → purple `rgb(175, 82, 222)` + purple box-shadow

White text on all three. Hover bumps brightness by 10%. Active mode is now visible at a glance from the color, not just the label.

### Files touched

- `src/system-entities/entities/news/NewsView.jsx` — prev/next button JSX + index calc, keydown handler, restyled mode-button (no SVG, mode-class)
- `src/system-entities/entities/news/styles/NewsView.css` — `.news-detail-nav-arrow(-prev/-next)` rules, rewritten `.news-grouping-mode-btn` with per-mode color variants

## Version 1.1.1268 - 2026-04-26

**Title:** News grouping cycle — dedicated mode-button (Quellen ⇄ Topics ⇄ Themen), chip toggling, multi-tag support
**Hero:** none
**Tags:** News, UX, Bugfix

### Why

The v1.1.1267 implementation packed mode-cycling and "reset to all" into the same `Alle ___` chip. Two-state click behaviour was confusing — to cycle modes from a filtered state, you had to click twice and the user couldn't predict whether a click would reset or cycle. fast-news-reader's own Lovelace card solves this with a dedicated mode-cycle button (separate from the chip strip) that always cycles + always resets the active chip. Plus their topic mode iterates the full `entry.category` array (multi-tag), and they have an "Other" bucket so feeds without a curated theme don't silently disappear in Themen-mode. Adopting that whole pattern.

### Changes

**Article shape now stores the full `entry.category` array** ([news/index.jsx:330-354](src/system-entities/entities/news/index.jsx#L330)). New field `categories` (slugified array) sits next to `category` (first slug, used by the badge). Topic-mode chip building and filtering iterate `categories[]` so an article tagged `["politik", "ausland"]` shows under both pills.

**Dedicated mode-cycle button replaces the dual-purpose `Alle ___` chip** ([NewsView.jsx:801-816](src/system-entities/entities/news/NewsView.jsx#L801), [NewsView.css:121-148](src/system-entities/entities/news/styles/NewsView.css#L121)). New `.news-grouping-mode-btn` sits between the status group and the chip row, styled with the news-orange accent so it visually reads as a control rather than a filter chip. Shows the current mode label (`Quellen` / `Topics` / `Themen`) and a swap-horizontal icon. Click always cycles to the next mode and resets `categoryFilter` to `'all'`. Default mode is `'quellen'`. The hover title spells out the cycle order so first-time users get the mechanic.

**Chips now toggle on click** ([NewsView.jsx:818-829](src/system-entities/entities/news/NewsView.jsx#L818)). Tapping the active chip again deactivates it (back to `categoryFilter === 'all'` for the current mode). Standard iOS-style multi-state behaviour — no separate "Alle" pseudo-chip needed since deselecting any chip yields the "all" state.

**Themen-mode "Other" bucket** ([NewsView.jsx:506-528, 287-298](src/system-entities/entities/news/NewsView.jsx#L506)). Feeds without a fast-news-reader preset (custom URLs added by the user) get `theme: null`. Without a fallback they'd vanish from the chip row entirely under Themen-mode. Now `getChips()` appends a synthetic `__other__` value when at least one article lacks a theme; the chip displays as "Sonstige" / "Other" and the filter matches `!a.theme`.

### Dropped

- The dual-purpose `Alle ___` chip (replaced by mode-button + chip toggling)
- `groupingAllLabel` helper (no longer needed)
- The two-click "first reset, then cycle" interaction

### Files touched

- `src/system-entities/entities/news/index.jsx` — `_entryToArticle` slugifies + stores full `categories` array
- `src/system-entities/entities/news/NewsView.jsx` — default mode `quellen`, multi-tag filter logic, "Other" bucket, dedicated cycle button, chip toggle behaviour
- `src/system-entities/entities/news/styles/NewsView.css` — `.news-grouping-mode-btn` styling

## Version 1.1.1267 - 2026-04-26

**Title:** News bundle — search button moves to detail-tabs, status+topic chips merged, full-cover article image, bookmark icon, 3-mode grouping cycle (Quellen/Topics/Themen)
**Hero:** none
**Tags:** News, UI, Feature

### Why

Five paper cuts in one release: source name on cards was getting clipped at the bottom, the inline search input ate too much horizontal space, status filters and topic chips lived on two separate rows even though they're conceptually one filter strip, the favorite icon was a heart (cliché for an article reader), the article hero image only filled a 260×260 tile inside `.detail-left` instead of the whole panel, and the topic chips only ever showed RSS-tag groupings — fast-news-reader's `channel.theme` (curated preset category like "tech" for Heise) and the per-feed source name were both unreachable from the UI.

### Changes

**`.article-footer line-height: 0.8 → 1.4`** ([NewsView.css:298-307](src/system-entities/entities/news/styles/NewsView.css#L298)). Old value was below the actual glyph height, so descenders in source names like "tagesspiegel" got clipped at the bottom edge of the card. Fixed.

**Search moved from inline toolbar to action-buttons row** ([news/index.jsx:50-69](src/system-entities/entities/news/index.jsx#L50), [TabNavigation.jsx:175-181, 245-251](src/components/DetailView/TabNavigation.jsx#L175)). New `search` action button appears between `overview` and `settings` in the news detail-tabs strip. Tapping it toggles `searchOpen` in `NewsView`, which swaps the entire filter row for a single full-width search input (auto-focused, with a clear-X button). Tapping search again — or the X — closes it and returns the filter row. Reuses the slider-opacity treatment from v1.1.1259 so the slider tracks `activeButton === 'search'`.

**Status filters and topic chips merged into one horizontal scroll row** ([NewsView.jsx:716-790](src/system-entities/entities/news/NewsView.jsx#L716), [NewsView.css:78-115](src/system-entities/entities/news/styles/NewsView.css#L78)). Status icons (Alle / Ungelesen / Favoriten) sit at the left in compact icon+count pills, then a 1px vertical divider, then the topic chips. The whole strip lives inside `.filter-tabs` so the existing scroll-indicators and arrow buttons work for the entire combined row. Removes the second row entirely.

**Favorite icon: heart → bookmark** ([NewsView.jsx:741-746](src/system-entities/entities/news/NewsView.jsx#L741), [TabNavigation.jsx:258-263](src/components/DetailView/TabNavigation.jsx#L258)). Both the status filter pill and the article-detail action button switched from the heart path to the bookmark shape (`M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z`). Filled when active. Storage field stays `favorite` — only the icon changed.

**Article image now covers the entire `.detail-left` panel** ([DetailView.jsx:572-633](src/components/DetailView.jsx#L572), [DetailView.css:266-280, 580-589](src/components/DetailView.css#L266)). Mirrors the existing `.detail-left-video-background` pattern: when the news entity has an article selected with a thumbnail, an `<img class="detail-left-news-image">` is rendered as `position: absolute; top:0; left:0; width:100%; height:100%; object-fit: cover` with the same 35px-on-left border-radius as the panel. The 260×260 icon-tile (from `EntityIconDisplay`) is hidden via a new `hideIcon` prop while the article image is shown — same way `videoUrl` already suppresses it. Mobile media query bumps `.detail-left.has-news-image` to 250px min-height and rounds the image's top corners instead of the left ones, matching the video pattern. The intermediate `customIconImageUrl` approach from v1.1.1266 (image inside the icon tile) is reverted.

**3-mode grouping cycle for the chip row** ([news/index.jsx:344-348](src/system-entities/entities/news/index.jsx#L344), [NewsView.jsx:148-155, 286-307, 500-543](src/system-entities/entities/news/NewsView.jsx#L148)).
- **Quellen** (Sources) — chips by `article.source` (feed name)
- **Topics** — chips by `article.category` (the raw RSS `<category>` tag — current default)
- **Themen** (Themes) — chips by `article.theme` (`channel.theme_label` from fast-news-reader's preset, e.g. Heise → Tech, Tagesschau → News)

The first chip is always `Alle ___` (Quellen / Topics / Themen depending on mode). Tapping it has two-state behaviour:
1. If a chip is currently selected → reset filter to `all` (don't change mode)
2. If already on `all` → cycle to the next mode and rebuild the chip list

`groupingField` derived from `groupingMode` switches which article field the chip set / count / filter all read from. The colored `.category-*` styling for the seven internal slugs is now only applied in the `topics` mode — sources and themes use the default chip background (cleaner, since e.g. "tagesspiegel.de: News" doesn't deserve a `.category-news` tint).

**`_entryToArticle` reads `channel.theme` + `channel.theme_label`** ([news/index.jsx:344-347](src/system-entities/entities/news/index.jsx#L344)). fast-news-reader exposes both per sensor (theme is the slug, theme_label is the display name). Custom feeds without a preset get `theme: null` and don't appear as a chip in Themen mode.

### Files touched

- `src/system-entities/entities/news/index.jsx` — `actionButtons` adds `search`, `_entryToArticle` exposes `theme`/`themeLabel`
- `src/system-entities/entities/news/NewsView.jsx` — `searchOpen` + `groupingMode` state, `handleToggleSearch`, `cycleGroupingMode`, `getChips`/`getChipCount`/`getChipLabel`, JSX rewritten for combined toolbar + search-row swap, bookmark SVG, body-wrapper cleanup
- `src/system-entities/entities/news/styles/NewsView.css` — `.news-status-btn`, `.news-toolbar-divider`, `.news-search-row`, `.news-search`/`-input`/`-icon`/`-clear`, `.article-footer line-height` fix
- `src/components/DetailView/TabNavigation.jsx` — `search` case in handler + icon, bookmark SVG for favorite
- `src/components/DetailView/EntityIconDisplay.jsx` — `customIconImageUrl` reverted, `hideIcon` prop added
- `src/components/DetailView.jsx` — full-cover `<img class="detail-left-news-image">` rendered when news + article, `hideIcon` passed through
- `src/components/DetailView.css` — `.detail-left-news-image` rule + mobile variant; `.icon-background-image` removed

### Why the 3-mode cycle on a single button

Three radio-style buttons would steal another row of vertical space we just freed. A dropdown would feel out of place inside a chip strip. Cycle-on-tap is cheap, the current mode is always visible in the button label, and the cycle order is the same direction every time. Hover title spells out the cycle for users who don't immediately catch the mechanic.

## Version 1.1.1266 - 2026-04-26

**Title:** News — article image now lives on `detail-left` (icon-background), search bar + status filters above topics
**Hero:** none
**Tags:** News, UI, Feature

### Why

v1.1.1265 put the article hero image on the right side of the news view (split layout). Wrong half — the image belongs on `.detail-left`, replacing the generic newspaper-emoji `.icon-background` that all system entities show. That's the same slot a video plays in for media devices. Plus the user wanted in-line search and status filters separated from topic filters, since 100+ articles need a real find-bar.

### Changes

**Article image moved to `detail-left`'s `icon-background`** ([EntityIconDisplay.jsx:9-43](src/components/DetailView/EntityIconDisplay.jsx#L9), [DetailView.jsx:595-606](src/components/DetailView.jsx#L595)). New optional `customIconImageUrl` prop on `EntityIconDisplay` — when set, renders an `<img class="icon-background-image">` filling the 260×260 tile via `object-fit: cover`, instead of the domain icon over a gradient. `DetailView` reads `window._newsViewRef.selectedArticle.thumbnail` and passes it through. On image load error: revert to gradient + emoji. The right-side `.article-detail-hero`/`.article-detail-body-wrapper` split from v1.1.1265 is reverted — article detail is back to the centered single-column body, since the image now anchors the left panel.

**New top toolbar with search + 3 status icons** ([NewsView.jsx:660-714](src/system-entities/entities/news/NewsView.jsx#L660), [NewsView.css:78-178](src/system-entities/entities/news/styles/NewsView.css#L78)). Above the topic-filter row sits a flex toolbar:
- **Left**: 3 compact pill buttons — `Alle` (list icon + total), `Ungelesen` (filled circle when active + count), `Favoriten` (heart, filled when active + count). Active button uses the inverted iOS pill style (white bg + dark text), same look as the topic filter's active state.
- **Right**: a search input (rounded pill, magnifier icon + clear button when text present). Filters articles client-side by title / source / description. Pressing the X clears it.

**Filter logic split into 3 dimensions** ([NewsView.jsx:147-153, 244-262](src/system-entities/entities/news/NewsView.jsx#L147)). Old single `activeFilter` state went away; replaced by `statusFilter` ('all'/'unread'/'favorites') + `categoryFilter` ('all'/`<slug>`) + `searchQuery`. They compose: status → category → search, applied in one `useEffect`. Each state is independent — picking a topic doesn't clear the unread filter, typing in search doesn't clear the topic. Old `defaultFilter` setting still hydrates `statusFilter` if it's one of the three valid values.

**Topic filter row only shows topic chips now** ([NewsView.jsx:716-781](src/system-entities/entities/news/NewsView.jsx#L716)). Removed the `Alle / Ungelesen / Favoriten` chips that lived in the same horizontal scroll row. New first chip: `Alle Themen` (= `categoryFilter === 'all'`), then one chip per detected category from the feeds. The whole row is now hidden when no categories exist (empty article list), so there's no empty filter scroll-area on first launch.

### Files touched

- `src/components/DetailView/EntityIconDisplay.jsx` — `customIconImageUrl` prop, image render branch with error fallback
- `src/components/DetailView/EntityIconDisplay.jsx` — wired through `customIconImageUrl` from `window._newsViewRef`
- `src/components/DetailView.jsx` — passes article thumbnail into the icon display
- `src/components/DetailView.css` — `.icon-background-image` rule (cover, rounded)
- `src/system-entities/entities/news/NewsView.jsx` — state split (status/category/search), toolbar JSX, topic-only filter row, empty-state message for no-search-result, reverted detail layout
- `src/system-entities/entities/news/styles/NewsView.css` — `.news-toolbar`, `.news-status-buttons`, `.news-status-btn`, `.news-search`, `.news-search-input`, `.news-search-clear` rules; reverted `.news-detail-content` to single scroll column

### Why search is client-side

`fast-news-reader` doesn't expose a Home Assistant service for server-side search; the cached article list (max 100 by default, capped at 500) lives in the browser anyway. A simple `.includes()` over title / source / description across <500 items is sub-millisecond per keystroke — no debounce needed. If we ever go beyond a few thousand cached articles per user, this is the place to add it.

## Version 1.1.1265 - 2026-04-26

**Title:** Article detail view — split layout with hero image covering the left panel
**Hero:** none
**Tags:** News, UI

### Why

The article detail view used to stack everything in one centered column: small thumbnail near the top, then title, description, body, button. The image was decorative-sized and didn't earn its space. The video-card pattern (image-as-hero on the left, controls/text on the right) makes the article's image the center of attention while keeping the text readable on the right.

### Changes

**Layout split** ([NewsView.jsx:559-619](src/system-entities/entities/news/NewsView.jsx#L559)). `.news-detail-content` is now a flex row with two children:
- **Left** — `.article-detail-hero` covers the full panel height (45% width) with the article's thumbnail. `object-fit: cover`, `overflow: hidden` so it crops cleanly without distortion.
- **Right** — `.article-detail-body-wrapper` is the scrollable column holding the category badge, title, description, body text, and "Artikel öffnen" button.

The old `.article-detail-thumbnail` block inside the article body is gone — the image only appears as the hero now, not duplicated inline.

**Scroll moved from `.news-detail-content` to `.article-detail-body-wrapper`** ([NewsView.css:837-879](src/system-entities/entities/news/styles/NewsView.css#L837)). The hero stays fixed in place while the text scrolls. `<CustomScrollbar>` ref points to the new wrapper. `.news-detail-content` itself becomes `overflow: hidden` so the rounded corners on the news container clip the hero properly.

**Empty-state fallback** — if the article has no thumbnail OR `display.showImages` is off, the hero panel is omitted entirely and the body wrapper takes 100% width. No empty grey rectangle.

**Mobile breakpoint** ([NewsView.css:881-893](src/system-entities/entities/news/styles/NewsView.css#L881)) — under 600px viewport, the hero stacks above the text (200px tall band) instead of taking 45% width. Avoids unreadable narrow text columns on phones.

### Files touched

- `src/system-entities/entities/news/NewsView.jsx` — restructured detail JSX into hero + body-wrapper
- `src/system-entities/entities/news/styles/NewsView.css` — `.news-detail-content` flex-row, new `.article-detail-hero` and `.article-detail-body-wrapper` rules, `.article-detail-thumbnail` rules removed, mobile media query

## Version 1.1.1264 - 2026-04-26

**Title:** News — bucket headers match room-header style, real feed icons in settings
**Hero:** none
**Tags:** News, UI, Polish

### Changes

**Bucket headers no longer sticky, restyled to match the search/devices room-header pattern** ([NewsView.css:212-232](src/system-entities/entities/news/styles/NewsView.css#L212)). Dropped `position: sticky`, the dark blurred background, the uppercase 12px label and the negative margin trick. New look: 18px, weight 500, `rgba(255,255,255,0.9)`, `padding: 8px 0`, with a `::after` pseudo-element drawing a 1px hairline at the bottom — exactly like `.search-group-title` in `SearchField.css`. So `Heute` / `Gestern` / `Diese Woche` / `Älter` now sit between cards as inline section labels with a divider underneath, the same way `Anziehraum` does in the device list.

**Feed icon in news settings now shows the actual feed logo / favicon** ([iOSSettingsView.jsx:48,206-219](src/system-entities/entities/news/components/iOSSettingsView.jsx)). `fast-news-reader`'s `_build_channel` exposes both `channel.image` (the RSS feed's own logo, e.g. Tagesschau's red square) and `channel.icon` (a favicon URL derived from the feed's host). The settings list now renders these as `<img>` inside the existing `.ios-feed-icon` 29px tile, with the 📰 emoji as a fallback if the image fails to load. CSS got `overflow: hidden` on the tile and `object-fit: cover` on the image so it fills the rounded square without distortion.

### Files touched

- `src/system-entities/entities/news/styles/NewsView.css` — `.news-bucket-header` rewritten to `.search-group-title` style
- `src/system-entities/entities/news/components/iOSSettingsView.jsx` — `iconUrl` field added to `availableFeeds`; conditional `<img>` + emoji fallback rendered inside `.ios-feed-icon`
- `src/system-entities/entities/news/components/iOSSettingsView.css` — `overflow: hidden` on tile, image fill rules

## Version 1.1.1263 - 2026-04-26

**Title:** News — drop manual per-feed category override, read category from `entry.category` (fast-news-reader)
**Hero:** none
**Tags:** News, UX, Cleanup

### Why

Until now each feed had a manual "Kategorie" picker in settings (mapping the feed to one of 7 hard-coded internal categories: news / tech / smarthome / sport / entertainment / politics / business). With `fastender/fast-news-reader` the per-article category is already provided by the integration: `coordinator.py:_build_entry` extracts `entry.category` as a list of `tags[].term` values from feedparser. Manually re-tagging at the feed level is redundant — and worse, it overrides whatever the source feed itself declared.

### Changes

**`_entryToArticle`** ([news/index.jsx:330-348](src/system-entities/entities/news/index.jsx#L330)) now reads `entry.category` directly. Handles both array (fast-news-reader: `["politik"]`) and string shapes, picks the first term, slugifies it (`/[^a-z0-9]+/g` → `-`, trim leading/trailing dashes) for use both as the badge text and the CSS class. Falls back to `null` when no category — the badge is then omitted (already conditional in JSX).

**`_loadArticlesFromEventCache`** ([news/index.jsx:413-422](src/system-entities/entities/news/index.jsx#L413)) — the per-feed category-override step is gone. Loop now only filters disabled feeds; categories survive untouched from `_entryToArticle`. About 25 lines lighter, zero behavioural overrides on the article shape.

**`_getCategoryForEntityId` action removed** — no remaining callers.

**iOSSettingsView**:
- The "Kategorie" item under each enabled feed is gone — settings now shows just the feed name + article count + on/off toggle
- The entire `category-{feedId}` sub-view (selection list of 7 categories with checkmarks) is removed
- Helpers `availableCategories`, `getFeedCategory`, `getCategoryLabel`, `handleFeedClick`, `handleCategorySelect`, `selectedFeed` state — all removed
- `onUpdateFeedCategory` prop removed

**NewsView** — `handleUpdateFeedCategory` handler and the prop pass-through both deleted.

### What this means for filter tabs

The category filter tabs at the top of the news list (`getCategories()`) now reflect whatever the actual feeds put in `<category>` tags. So a Tagesschau-heavy setup might surface tabs like "Inland", "Ausland", "Wirtschaft", "Sport" instead of the hard-coded 7. The seven `.article-category-badge.category-*` color rules in CSS still apply when a feed happens to use one of those slugs (e.g. "sport" → red badge). Other categories get the default white-on-translucent badge.

### Backwards compatibility

Existing users have `settings.feeds[id].category` saved in localStorage. The key is just ignored now — no migration needed, no errors. Cleanup will happen naturally when a user re-toggles a feed.

## Version 1.1.1262 - 2026-04-26

**Title:** News card cleanup — drop date, fade-truncate long source names
**Hero:** none
**Tags:** News, UX, Polish

### Changes

**Date removed from article cards** ([NewsView.jsx:902-905](src/system-entities/entities/news/NewsView.jsx#L902)). The bucket headers (Heute / Gestern / Diese Woche / Älter) introduced in v1.1.1261 already convey the time grouping; per-card dates were redundant and caused awkward wrapping when long source names pushed them onto a second line. The footer now shows just the source.

**Source name now truncates with the same gradient fade as the title** ([NewsView.css:307-316](src/system-entities/entities/news/styles/NewsView.css#L307)). Long sources like "tagesschau.de - Die Nachrichten der ARD" used to wrap to two lines and break the card layout. They now stay on one line and fade out at 85% width via `linear-gradient` + `background-clip: text`, matching the existing `.article-title` treatment.

### Files touched

- `src/system-entities/entities/news/NewsView.jsx` — removed `.article-separator` and `.article-date` from card footer
- `src/system-entities/entities/news/styles/NewsView.css` — `.article-source` gets `white-space: nowrap`, `overflow: hidden`, `min-width: 0`, gradient text-fade

## Version 1.1.1261 - 2026-04-26

**Title:** News — group articles by time bucket (Today / Yesterday / This Week / Older) with sticky headers
**Hero:** none
**Tags:** News, UX

### Why

`maxArticles` defaults to 100 (and goes up to 500). Scrolling through 100 dated cards as one undifferentiated wall makes it hard to know what's recent and what's days old. Feedly solves this with day-bucket section headers — copying that pattern.

### Changes

**`groupArticlesByTimeBucket(articles, lang)`** ([NewsView.jsx:50-78](src/system-entities/entities/news/NewsView.jsx#L50)) — pure helper. Splits the (already-sorted-newest-first) article list into four buckets keyed by published date:
- `Heute` / `Today` — published since 00:00 today
- `Gestern` / `Yesterday` — published 24h before that
- `Diese Woche` / `This Week` — published in the prior 6 days
- `Älter` / `Older` — everything else

Empty buckets are filtered out so headers don't show for absent buckets.

**Rendering switched from a flat `.map()` to bucketed sections** ([NewsView.jsx:825-895](src/system-entities/entities/news/NewsView.jsx#L825)). Each bucket renders as `<div class="news-bucket">` containing a `.news-bucket-header` and the cards. Memoized with `useMemo([filteredArticles, lang])`. The card-stagger animation now uses an absolute index across buckets, capped at 10 (`Math.min(idx, 10) * 0.05`) so the last card in a 100-item list doesn't take 5s to fade in like before.

**Sticky headers** ([NewsView.css:212-232](src/system-entities/entities/news/styles/NewsView.css#L212)). `.news-bucket-header` uses `position: sticky; top: 0` within `.news-feed` (the scroll container), with backdrop-blur (20px + saturation) so cards behind it stay readable. iOS-style label: 12px uppercase, letter-spacing 0.06em, white at 60% opacity. Negative `margin: 0 -4px` extends the blur background through the list's small inset padding.

### Tradeoffs considered

- **Hour-based buckets** ("vor 1h", "vor 2h", …) — too many micro-buckets, especially in the "Today" range
- **Weekday buckets** (Mon/Tue/Wed/…) — too noisy on mobile, and ambiguous after a week
- **Non-sticky date dividers** — simpler but loses the "where am I?" anchoring during long scrolls

Sticky day-buckets won on density vs. orientation.

### Stagger-delay regression fix bundled

Old code used `delay: index * 0.05` with no cap. With 100 articles the 100th card took 5 seconds to appear. Capped at index 10 (= 0.5s max) — preserves the iOS-style cascade for the first batch, then everything past that fades in immediately.

## Version 1.1.1260 - 2026-04-26

**Title:** News — hide native scrollbar in article detail view, add CustomScrollbar there
**Hero:** none
**Tags:** News, UI, Polish

### Why

After v1.1.1259's `position: relative` fix, the news list view's `CustomScrollbar` correctly sits inside the container at the right edge. But the article detail view (`.news-detail-content`) still had `scrollbar-width: thin` and rendered the OS-native scrollbar — visible as a wider grey bar to the right of the custom one when you opened a long article. Two scroll indicators side-by-side, ugly.

### Changes

**`.news-detail-content`** ([NewsView.css:798-808](src/system-entities/entities/news/styles/NewsView.css#L798)) — switched `scrollbar-width: thin` → `scrollbar-width: none`, dropped the obsolete `scrollbar-color`, added the `::-webkit-scrollbar { display: none }` rule for Safari. Same pattern as `.news-feed`. Native scrollbar is now hidden in the detail view.

**`.news-settings-content`** — same cleanup applied even though the class is dead code (no JSX uses it since the v1.1.1252 migration to `IOSSettingsView`). Killed the stale `scrollbar-width: thin` so future revivals don't regress.

**Article detail view gets its own `<CustomScrollbar>`** ([NewsView.jsx:608-609](src/system-entities/entities/news/NewsView.jsx#L608)). New `detailScrollRef` + `isDetailHovered` state, attached to the `.news-detail-content` container with hover handlers. Same iOS-style indicator as the article list and settings.

### Files touched

- `src/system-entities/entities/news/styles/NewsView.css` — hide native scrollbars in detail + settings
- `src/system-entities/entities/news/NewsView.jsx` — `detailScrollRef`, `isDetailHovered`, `<CustomScrollbar>` in detail-view branch

### Why detail view didn't already have one

When the detail view was first written, articles were short enough that scroll wasn't a concern. Long-form articles (Tagesschau-style) with hero image + description + content + button push past viewport, and the OS-native bar was good enough back then. Now that the rest of news uses the iOS-style indicator consistently, the detail view stuck out.

## Version 1.1.1259 - 2026-04-26

**Title:** News — recommend `fastender/fast-news-reader`, fix settings bugs and detail-view UI
**Hero:** none
**Tags:** News, Bugfix, UI

### Why

Two-part release. Part one: the user shipped their own HA custom integration [fastender/fast-news-reader](https://github.com/fastender/fast-news-reader) (HACS), which closes the `<content:encoded>` image-extraction gap that `timmaurice/feedparser` and core `feedreader` both ignore. The card now points users at it. Part two: a batch of UX/settings bugs surfaced while testing on real feeds.

### Changes

**News integration recommendation switched.** Empty-state hints in `NewsView.jsx`, settings empty-state in `iOSSettingsView.jsx`, and the top-of-file JSDoc in `news/index.jsx` now name `fastender/fast-news-reader` exclusively. Old hints recommending `timmaurice/feedparser` ("A better Feedparser") are gone. Setup steps rewritten for the HACS Custom Repository flow. Internal sensor-loading code (`_loadFeedparserSensors`, `_processFeedparserSensor`, `has_feedparser` attribute, `.news-feedparser-hint` CSS class) is unchanged — `fast-news-reader` is schema-compatible with `timmaurice/feedparser`, so renaming would be churn without functional gain.

**Scrollbar positioning fix in news view.** `.news-view-container` was missing `position: relative`, so the absolutely-positioned `<CustomScrollbar right: 3px>` resolved to a higher positioned ancestor and rendered outside the card. Added `position: relative` — scrollbar now sits inside the container at its right edge, on the dark backdrop instead of bleeding into the wallpaper.

**Article detail view buttons no longer show a stray white slider on the back button.** In the article detail view, the action buttons are `[back, read, favorite]` but `activeButton` state stays at `'overview'` (none of them match). The slider position memo defaulted to `x: 0` on no-match and rendered with `opacity: 1`, so the back button always looked "active" with a white pill behind it. Slider now animates `opacity: 0` when no button matches; the read/favorite filled-state still works via SVG `fill="currentColor"`.

**Feed counter in news header was always "0 Feeds".** `feedCount` was computed from `Object.keys(settings.feeds).filter(...enabled)` — but `settings.feeds` starts as `{}` and feeds are only written there when the user explicitly toggles them; default state for an untoggled feed is "enabled" via `enabled !== false`. Result: header always showed 0 even with feeds present. Now derived from `hass.states` (count feedparser sensors not explicitly disabled), matching what `IOSSettingsView` shows.

**Default settings between `NewsView.loadSettings()` and entity `_loadSettings()` were inconsistent.** Entity defaulted to `feeds: []` (array, but every consumer treats it as object), `maxArticles: 50`, and was missing `showImages`/`autoMarkRead`/`defaultFilter`. UI defaulted to `feeds: {}`, `maxArticles: 100`, full display block. Synced the entity defaults to match the UI's, so the first-ever load (no localStorage entry yet) doesn't render with mixed defaults.

**`maxArticles` setting was ignored above 100.** `_loadArticlesFromEventCache` had a hardcoded `slice(0, 100)` cap, so picking 150/200/300/500 in the UI did nothing — the user always got 100 articles max. Now reads the setting (`Math.min(value, 500)` to keep the cache-size cap as a defensive max).

**Header stats stale until user leaves settings.** The `news-view-state-changed` event that prompts `DetailView` to recompute the header was gated to `[selectedArticle, showSettings]` only. Toggling a feed in settings updated the local `settings` state but didn't refire the event, so the "X Feeds" header kept its old value until the user closed settings. Added `settings` to the event-effect deps; settings changes now propagate to the header immediately.

### Files touched

- `src/system-entities/entities/news/NewsView.jsx` — empty-state recommendation, `feedCount` calculation, event-deps
- `src/system-entities/entities/news/components/iOSSettingsView.jsx` — settings empty-state recommendation
- `src/system-entities/entities/news/index.jsx` — top JSDoc, `_loadSettings` defaults, `maxArticles` slice, `debugNewsImages` console hint
- `src/system-entities/entities/news/styles/NewsView.css` — `position: relative` on container
- `src/components/DetailView/TabNavigation.jsx` — slider opacity on no-match

### Internal naming kept stable on purpose

`hasFeedparser`, `_loadFeedparserSensors`, `_processFeedparserSensor`, `has_feedparser` attribute, `.news-feedparser-hint` CSS class — all unchanged. The "feedparser" name correctly describes the *schema* (which `fast-news-reader` deliberately keeps compatible with `timmaurice/feedparser`) and the underlying Python library that both integrations use. Renaming would be cosmetic churn without changing behavior, and would risk breaking saved state for existing users.

## Version 1.1.1258 - 2026-04-25

**Title:** News — full migration off HA-core `feedreader`, now uses HACS `timmaurice/feedparser`
**Hero:** none
**Tags:** Breaking, News, Architecture

### Why

The v1.1.1257 debug session revealed that HA's core `feedreader` integration intentionally exposes only four fields on its `event.feedreader_*` entities: `title`, `link`, `description`, `content`. No image data, no media URLs, no enclosures. That's hardcoded in HA's `feedreader/event.py`. Bus events have rich data, but bus events only fire on *new* articles — historical entries that loaded from the entity attributes are stuck without images.

Two paths to richer data:
- Detection adapter that reads from both core `feedreader` AND HACS `timmaurice/feedparser`.
- Full switch to `timmaurice/feedparser`, drop core `feedreader` support entirely.

User chose **the full switch**. Cleaner, less code, no dual-path maintenance.

### What `timmaurice/feedparser` exposes

Per configured feed, a `sensor.<feed_name>` entity:

```js
state: 10,                                                  // entry count
attributes: {
  channel: { title, link, image, ... },
  entries: [
    { title, link, summary, published, image, ... },        // image is a string URL,
    ...                                                     // already extracted on the
  ],                                                        // Python side
  attribution: 'Data retrieved using RSS feedparser',
}
```

`image` is **already a string URL** — Python's `feedparser.py` runs the multi-source extraction (media_content / media_thumbnail / enclosures / summary HTML), so no JS-side regex extraction needed.

### Code change scope

`src/system-entities/entities/news/index.jsx` — 1044 → 875 lines.

**Removed entirely:**
- `_handleFeedreaderEvent`, `_loadFeedreaderHistory`, `_loadFeedreaderEventEntities`, `_loadFeedreaderHistoryInBackground`
- `_extractThumbnail`, `_extractImageFromHtml` — multi-source image extraction (handled by Python now)
- `_findEntityIdByFeedUrl` — feedparser sensor IDs are direct, no URL-to-entity lookup needed
- `subscribeEvents('feedreader')` listener
- `has_feedreader` attribute, `feedreader:read` permission
- `window.testFeedreaderEvent` debug helper

**Added:**
- `_loadFeedparserSensors(hass)` — finds all `sensor.*` with `attributes.entries` array + `attributes.channel`
- `_processFeedparserSensor(sensor)` — iterates `attributes.entries`, maps each to internal article shape
- `_handleSensorStateChange(event)` — listens for `state_changed` events, updates when feedparser sensors get new entries
- `_entryToArticle(entry, channel, sensorId)` action — maps feedparser entry → card's article shape
- `_stripHtml(html)` action — used inline in entry mapping
- `_findFeedparserSensors`, `_fetchFromFeedparser` — feedparser-aware fetch + lookup helpers

**Subscription model changed:** instead of subscribing to the `feedreader` event type, the entity now subscribes to `state_changed` and filters for sensors with the feedparser shape. Same effect (live-update when feeds refresh), different mechanism — sensor state updates are more reliable than event-bus subscriptions.

`src/system-entities/entities/news/components/iOSSettingsView.jsx`:
- Feed-detection switched from `event.*` with `event_type: feedreader` to `sensor.*` with `entries[]` + `channel`
- Empty state simplified — only mentions `A better Feedparser` (HACS) now, since core `feedreader` is no longer supported

`src/system-entities/entities/news/NewsView.jsx`:
- `hasFeedreader` checks renamed to `hasFeedparser`, hint text updated

### Migration impact for users

- Users with the core `feedreader` integration installed will see **no feeds** in the News card after this update. They need to install the HACS integration `A better Feedparser` from `github.com/timmaurice/feedparser` and reconfigure their feeds via UI.
- Existing News-card settings (per-feed category, enabled/disabled toggles) are keyed by entity ID. Since entity IDs change from `event.bbc_news` to `sensor.bbc_news`, settings won't carry over — user re-toggles per feed once.
- Article cache (read/favorite state) is keyed by article URL, so any matching old articles keep their state. New articles arrive with images.

### Why this was the right call

The core `feedreader` integration is not going to expose richer data — its event entity schema is intentionally minimal (HA dev decision, see `_unrecorded_attributes` and the four hardcoded ATTR_* keys in upstream). To get images, the integration has to be different. `timmaurice/feedparser` does the right thing on the Python side: full feedparser entry, image pre-extracted, entries directly in attributes. Card just reads them. No CORS proxies, no third parties, no schema gymnastics.

---

## Version 1.1.1257 - 2026-04-25

**Title:** News debug — show all attribute keys + live event logger
**Hero:** none
**Tags:** Diagnostics, News

### Why

The v1.1.1256 `debugNewsImages()` output revealed that BBC, CNN, Guardian feedreader event entities have **no image fields whatsoever** in their attributes — `enclosures`, `image`, `media_content`, `media_thumbnail` are all `undefined`. That points at HA's `feedreader` integration: the `event.*` entities it creates are a **sparse state representation** (mostly title, link, published). The rich payload with images lives only on the event bus, delivered to live subscribers.

Two diagnostics added so we can see what's really there.

### `debugNewsImages()` — extended

Now also prints, per entity:
- `Object.keys(attributes)` — full list of every attribute key the entity has
- The full `attributes` object dump

So if HA stores images under a key we haven't checked (`image_url`, `summary_image`, etc.), we'll see it now.

### `logNewsLiveEvents()` — new

Subscribes to the live `feedreader` event bus and logs every incoming article. Each log shows:
- The full event object
- `event.data` payload + `Object.keys(event.data)` so we can see the bus-side schema
- The thumbnail our extractor finds (or `(none)`)

Usage:
```js
window.logNewsLiveEvents();          // start logging
// ... wait for HA's feedreader to fetch a feed (default 1h interval) ...
// or trigger a forced fetch from HA: feedreader.update_entity ...
window.logNewsLiveEvents.stop();     // stop logging
```

If the bus events have rich data (`media_thumbnail`, etc.), our existing `_extractThumbnail` will already find images for new articles arriving live. The historical entries are the gap — those came from sparse event-entity attributes.

### What this release isn't

Still no behavior change for end users — pure diagnostics. The next release decides what to actually fix once we see the real data shape.

---

## Version 1.1.1256 - 2026-04-25

**Title:** News image debug — `window.debugNewsImages()` for live feed inspection
**Hero:** none
**Tags:** Diagnostics, News

### Why

After v1.1.1255 enabled multi-shape thumbnail extraction, some feeds may still come through without images. To pinpoint *which* RSS shape a particular feed uses, we need raw data from the live `event.feedreader_*` entities — the existing `debugNews()` only showed already-processed articles.

### What was added

`window.debugNewsImages()` (callable in DevTools console) lists every feedreader event entity currently in `hass.states` and prints, per entity:

- `image` (direct)
- `enclosures` (array, Python feedparser plural form)
- `enclosure` (singular fallback)
- `media_thumbnail` (string or array of dicts)
- `media_content` (array, often holds the image)
- whether `content` is a string or array
- first 300 chars of `description`
- the thumbnail our `_extractThumbnail` helper currently extracts

Returns the same data as an array, so you can `const out = window.debugNewsImages(); console.table(out);` for a tabular view.

### Usage

1. Open the dashboard with the News card visible.
2. Open DevTools → Console.
3. `window.debugNewsImages()` and expand the per-entity groups.
4. If `▶ extracted thumbnail` says `(none)` for a feed that *does* show an image in the actual RSS, paste the raw `image / enclosures / media_thumbnail / media_content / description` values back to me — I'll extend `_extractThumbnail` for that shape.

This release is purely a diagnostics helper — no behavior change for end users.

---

## Version 1.1.1255 - 2026-04-25

**Title:** News thumbnails — actually find images for most feeds now
**Hero:** none
**Tags:** Bug Fix, News

### What was wrong

Most articles in the News view rendered without thumbnails, even though the feed clearly had images. The culprit was the image-extraction code in `news/index.jsx`. It checked exactly three places:

```js
let thumbnail = data.image || null;                    // rarely populated
if (!thumbnail) thumbnail = extractFromHtml(content);  // narrow regex
if (!thumbnail && data.enclosure?.url) ...             // SINGULAR
if (!thumbnail && data.media_thumbnail) thumbnail = data.media_thumbnail;
```

Three problems with that:

1. **Wrong shape for most feeds.** Home Assistant's `feedreader` integration uses Python's `feedparser` library, which delivers images in **arrays of dicts**: `enclosures` (plural), `media_thumbnail: [{url, width, height}]`, `media_content: [{url, medium, type}]`. The card was checking singular keys with string values — most feeds went through this code untouched.
2. **HTML regex too narrow.** It matched only `<img src="...">` (double-quotes). Plenty of feeds (Tagesschau among them) emit single-quoted or unquoted attributes in their description HTML.
3. **No graceful failure on the `<img>` itself.** When the extracted URL was correct but the host blocked hot-linking (Referer-based), the user saw a broken-image icon.

### The fix

**Central helper `_extractThumbnail(data)` covers every common RSS shape:**

1. `data.image` (string or `{url}`)
2. `data.enclosures[]` — finds first item with `type` starting `image/` or any `url`
3. `data.enclosure.url` — singular fallback for older sources
4. `data.media_thumbnail[0].url` — array shape
5. `data.media_thumbnail` — string shape
6. `data.media_content[]` — finds `medium === 'image'` or `type` starting `image/`
7. `data.content` if it's an array — Atom-style `[{value, ...}]` joined for HTML scan
8. `data.description` / `data.summary` — HTML scan as last resort

Both call sites (live feedreader event in `_handleFeedreaderEvent`, and event-entity warm-load in `_loadFeedreaderEventEntities`) now share this helper. Same data shape going in, same thumbnail logic.

**HTML regex now handles all quoting styles** plus `og:image` and `twitter:image` meta tags as final fallback:

```js
// <img src="..."> | <img src='...'> | <img src=...>
/<img[^>]+src=(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i
```

**`<img>` tags hardened in NewsView.jsx:**

- `referrerPolicy="no-referrer"` — many sites (German news especially) check the `Referer` header and block external embedding. Stripping it fixes a lot of "image present but won't load" cases.
- `onError` handler — if the image URL is correct but the load still fails (404, blocked, mixed-content), hide the container instead of showing a broken-image icon. Article still readable, just no thumbnail.

### Expected effect

Most feeds that previously came through with `thumbnail: null` should now have one. For feeds where the image really isn't in the data, behavior is unchanged. For feeds where the URL was right but blocked, the broken-icon is gone.

If a specific feed still doesn't show images, the article object will have `thumbnail: null` — open the browser console and inspect what `data.media_content` / `data.enclosures` / etc. actually contain for one of those events. We can extend the helper for unusual shapes case-by-case.

---

## Version 1.1.1254 - 2026-04-25

**Title:** News empty-state — point users at the two HA integrations that provide feeds
**Hero:** none
**Tags:** UX, Documentation, News

### What was wrong

When a user opens **News → Settings** without any feeds configured, the previous empty state just said "No Feedreader feeds found." — which is correct but unhelpful. The user has no idea what to do next: which integration to install, what to put in `configuration.yaml`, or that an alternative even exists.

### The fix

The empty state in `iOSSettingsView` now lists the two integrations that produce News-card feeds, with direct links:

1. **A better Feedparser** ([github.com/timmaurice/feedparser](https://github.com/timmaurice/feedparser)) — HACS, UI-based setup. Recommended for users who don't want to edit YAML.
2. **`feedreader`** ([home-assistant.io/integrations/feedreader/](https://www.home-assistant.io/integrations/feedreader/)) — Core integration, YAML configuration. Battle-tested.

Both use HA's server-side Python to fetch RSS — the only sane way to handle CORS for arbitrary feed URLs. Direct browser-side RSS fetching from a custom Lovelace card requires a third-party CORS proxy, which we deliberately avoid (privacy, reliability, rate limits).

### Why we don't bundle our own RSS fetcher in the card

CORS. Almost no RSS feeds set permissive CORS headers, so the browser blocks `fetch()`. Working around that needs either:
- A self-hosted proxy — but the only server most users have is HA itself, which means using one of the integrations above anyway.
- A third-party CORS proxy (`allorigins.win`, `corsproxy.io`, `rss2json.com`) — leaks user IP, rate-limits, and these services come and go.

So the integrations above stay the right architecture; the card's job is just to make their data look good and not waste user time when the setup isn't there.

### What this release does NOT do

The card still only reads from the core `feedreader` event entities. It does not yet read from `feedparser`'s `sensor.*` entities (which carry entries in attributes, different shape). If a user installs `A better Feedparser` instead of `feedreader`, the card currently won't populate.

That's the **next step if there's demand**: an adapter in `news/index.jsx` that auto-detects either source. ~50–100 LOC. Held until at least one user actually runs `feedparser` and confirms it would help. Premature otherwise.

---

## Version 1.1.1253 - 2026-04-25

**Title:** News entity — boot-block fix + dead-code cleanup + lazy images
**Hero:** none
**Tags:** Performance, Code Cleanup, News

### What was wrong

The `system.news` entity awaited a WebSocket call (`hass.callWS({ type: 'logbook/get_events', ... })`) inside its `onMount`. Same anti-pattern that v1.1.1238 fixed for Versionsverlauf: if Home Assistant's recorder/logbook is slow to respond, the entity's mount hangs, the registry's `Promise.all` waits for it, and the user sees a delay before the News tab is available.

Plus three files of dead code: `config/feedSources.js`, `utils/articleCache.js`, `utils/rssParser.js`. None imported anywhere — leftovers from an earlier RSS-fetching design that was replaced by HA's `feedreader` integration. `rssParser.parseRSSFeed()` even had a `// TODO: Implement actual RSS fetching` marker.

### Fix 1 — `onMount` boot-block

`src/system-entities/entities/news/index.jsx` `onMount` no longer awaits the WebSocket history fetch. The fast steps stay in `onMount`:

- Subscribe to live `feedreader` events.
- `_loadFeedreaderEventEntities(hass)` — pure `hass.states` read, no network.
- `executeAction('getArticles')` — pure cache read.

The slow step (`_loadFeedreaderHistory(hass)` — recorder/logbook lookup) moves to a new `_loadFeedreaderHistoryInBackground(hass)` method that runs fire-and-forget with an 8-second `Promise.race` timeout. When it lands, the article list is refreshed via another `getArticles` call. When it times out, a `console.warn` is emitted and the user keeps whatever the cache + live event entities provided.

Net effect: the News entity's mount completes in milliseconds regardless of HA recorder latency. Same boot timing improvement v1.1.1238 brought to Versionsverlauf.

### Fix 2 — dead code removed

Deleted (verified unimported):

- `src/system-entities/entities/news/config/feedSources.js` (335 LOC, defaultFeeds + helpers, never imported)
- `src/system-entities/entities/news/utils/articleCache.js` (singleton class, never imported)
- `src/system-entities/entities/news/utils/rssParser.js` (incomplete TODO)

Empty `config/` and `utils/` directories also removed. Bundle is fractionally smaller and the directory structure is honest about what's actually used.

### Fix 3 — lazy + async image decoding

Two `<img>` tags in `NewsView.jsx` (article-detail + article-card thumbnail) now have `loading="lazy"` and `decoding="async"`. With 100+ articles in the feed, this avoids fetching every thumbnail upfront and keeps image decoding off the main thread.

### What this doesn't fix (deferred — risk vs. reward)

- **Virtualization for long article lists** — would require a structural refactor of `NewsView`. Worth doing if profiling shows scroll-jank on devices with 200+ articles, not before.
- **`useCallback` / `useMemo` audit** — `NewsView` has 19 useState hooks and inline handlers that could be memoized. Real but small gain. Held for a focused render-perf pass later.
- **65 `console.log` calls** — cosmetic cleanup, not urgent. Most are useful for live debugging.
- **Global `window._newsViewRef`** — small leak risk on remount. Held; would need a context-based replacement.

### What was a false positive in the audit

The auditor flagged "Settings persistence inconsistency" as Critical #2. Re-reading the code: `iOSSettingsView` calls `onUpdateSetting(path, value)` → `handleUpdateSetting` (NewsView:608) → `handleUpdateSettings` (NewsView:363) → `saveSettings`. Path is consistent — every setting change persists. Skipped.

---

## Version 1.1.1252 - 2026-04-25

**Title:** Bug bundle — translation keys, toggle dedupe, instant favorites/suggestions, IOSToggle component
**Hero:** none
**Tags:** Bug Fix, UX, i18n

### Bug 1 — `ui.suggestions.frequentlyUsed` shown as raw key

The Vorschläge subcategory rendered `ui.suggestions.frequentlyUsed` instead of the translated label. `searchFilters.js:296` references four group labels (`frequentlyUsed`, `contextBased`, `timeBased`, `areaBased`) under `ui.suggestions.*`, but the translations file only had three confidence-level keys there. English file had no `ui.suggestions` block at all.

Added the missing keys in both languages:
- DE: "Häufig genutzt" / "Im Kontext" / "Zu dieser Zeit" / "In diesem Bereich"
- EN: "Frequently used" / "Context-based" / "At this time" / "In this area"

### Bug 2 + 4 — Preact-Compat double-onChange across all toggles

The `<label> + <input type="checkbox">` pattern fires `onChange` twice in Preact-Compat. First call writes the new value, second call writes the flipped-back value — net effect is the toggle persists as the *opposite* of what the user clicked. Same root cause as v1.1.1219's `CircularSlider.PowerToggle` fix.

User reported the mobile auto-expand setting reverting after every refresh. Audit found the same pattern in **42 toggles** across the codebase.

Fix: created `src/components/common/IOSToggle.jsx` — a drop-in component that wraps the `<label>` + `<input>` pattern with a built-in 150 ms timestamp dedupe. Migrated all 42 callsites:

| File | Toggles |
|---|---:|
| `GeneralSettingsTab.jsx` | 8 |
| `StatsBarSettingsTab.jsx` | 11 |
| `AppearanceSettingsTab.jsx` | 4 |
| `ToastSettingsTab.jsx` | 2 |
| `iOSSettingsView.jsx` (news) | 3 |
| `TodosSettingsView.jsx` | 7 |
| `EnergyDashboardDeviceView.jsx` | 1 |
| `Printer3DDeviceView.jsx` | 6 |

API: `<IOSToggle checked={x} onChange={setX} disabled stopPropagation />`. Drop-in for the old 7-line label/input/span block — also slightly less code per call.

Toggles using `defaultChecked` (uncontrolled) or with no `onChange` weren't migrated — they don't have the bug. `PowerToggle.jsx` keeps its existing internal dedupe.

### Bug 3 — Favorites and Suggestions empty for ~100 ms after refresh

After v1.1.1241 added a localStorage snapshot for entities, the regular cards appeared instantly on hard-refresh — but the **Favoriten** and **Vorschläge** tabs were still empty for ~50–150 ms (waiting on IndexedDB read for favorites, and on `calculateSuggestions` async result for suggestions).

Added matching localStorage snapshots in `src/utils/uiStateSnapshots.js`:
- `loadFavoritesSnapshot()` / `saveFavoritesSnapshot(Set)` — favorites Set serialized as array of entity_ids.
- `loadSuggestionsSnapshot()` / `saveSuggestionsSnapshot(arr)` — top-60 suggestions, capped to keep payload small.

`DataProvider`'s `useState` initializer for `favorites` now reads the snapshot. `useSuggestions`'s initializer reads the suggestions snapshot. Both write back on every state change, so the next boot has fresh data.

`resetLearningData` also clears these snapshots (otherwise the next boot would flash old usage counts before re-calculation).

Trade-off: the suggestions snapshot can be slightly stale (time-of-day affects the contextBased ranking), but it flashes for ~100 ms before fresh calculation overrides — much better than blank.

### Build

Build green, 707 modules, ~366 KB gzip JS. PostCSS `Cannot divide by "%"` warnings are pre-existing and unrelated.

---

## Version 1.1.1251 - 2026-04-25

**Title:** Phase 7 — `DataProvider` context value memoized (runtime perf)
**Hero:** none
**Tags:** Performance, Runtime

### What changed

`DataProvider`'s `contextValue` object is now wrapped in `useMemo`. Before:

```js
const contextValue = {
  isInitialized, isLoading, error,
  entities, favorites, settings, areas, notifications,
  cache: cacheRef.current,
  toggleFavorite, updateSetting, searchEntities, callService,
  calculateSuggestions, resetLearningData, updateEntityState,
  recordUserAction, refreshNotifications, dismissNotification,
  db: dbRef.current,
  generateTestPatterns,
  hass: hassRef.current,
  pendingTracker: pendingTrackerRef.current,
};
```

This object got rebuilt on every single render of `DataProvider` — even when the underlying data didn't change. React's Context API does shallow identity comparison, so a new object identity = every consumer re-renders. With `SearchField` (1100 lines, 33 hooks) being the primary consumer plus a half-dozen `useData()` hook callsites, that adds up.

After:

```js
const contextValue = useMemo(() => ({ … }), [
  isInitialized, isLoading, error,
  entities, favorites, settings, areas, notifications,
  hass,
  toggleFavorite, updateSetting, searchEntities, callService,
  calculateSuggestions, resetLearningData, updateEntityState,
  recordUserAction, refreshNotifications, dismissNotification,
  generateTestPatterns,
]);
```

Refs (`cacheRef.current`, `dbRef.current`, `pendingTrackerRef.current`) aren't in the deps because their identity is stable for the lifetime of the provider. Pre-existing `useCallback` wrappers on every method ensure those stay stable too. The previously-not-memoized `generateTestPatterns` now uses `useCallback` with `[entities, calculateSuggestions]` deps.

### Other small fix

`hass` in context now reads the prop directly (`hass`) instead of `hassRef.current`. The ref read had a one-render lag because `hassRef.current` is updated in a `useEffect` that runs after render — the prop is the source of truth in the render itself.

### Why this matters for runtime perf and heat

Every Home Assistant `state_changed` event triggers `setEntities`, which re-renders `DataProvider`. Before this fix, every such re-render rebuilt the context object even though nothing else changed → `SearchField` and its descendants re-render → `useMemo`s recompute → Virtua remeasures → framer-motion re-interpolates animated props.

State changes from a typical smart home (sensors, automations) come in steady streams — easily 5–10 per second. Even with the 150 ms throttle from v1.1.1244 keeping flushes at ~6/s, every flush was forcing the entire tree to re-render unnecessarily.

After: most `setEntities` calls only update `entities`. The other 20 context properties keep their references → `useData()` hooks that don't read `entities` (e.g. `useFavorites`, `useNotifications`) won't trigger re-renders. Even consumers reading `entities` benefit because the callbacks they depend on stay stable — no cascading re-render of memoized child components.

### Expected effect

- Sustained CPU work during use ↓ (less re-render cascade per state change)
- Battery / heat ↓ (same reason)
- Boot path: unchanged (no new code on the boot critical path)

### Risk

The risk in this kind of change is missing a dep — if a callback closes over state that's not in the deps array, consumers see a stale closure. All callbacks in the deps array were already individually `useCallback`-wrapped so their identities only change when their own deps change. The `useMemo` propagates that correctly.

If anything breaks (a button stops working, a state update doesn't propagate), it's almost certainly a missing dep — please report so we can fix it specifically.

---

## Version 1.1.1250 - 2026-04-25

**Title:** The 10 s mystery solved — `window._hass` was referenced but never set
**Hero:** none
**Tags:** Performance, Bug Fix, Boot

### The smoking gun

Phases 5 and 6 didn't move the `dp-registry-done` needle. Profile after v1.1.1249 still showed ~10 s. That's a suspicious round number. Searching the codebase for `window._hass`:

```
hassRetryService.js:32   if (hassReadyFlag && (context?.hass || window._hass))
hassRetryService.js:33     return context?.hass || window._hass;
hassRetryService.js:54   // Source 2: Global window._hass (set by Home Assistant)   ← LIE
hassRetryService.js:55   if (!hass && typeof window !== 'undefined' && window._hass)
hassRetryService.js:56     hass = window._hass;
registry.js:426       hass: window._hass || null,
```

Read in 5 places. **Set: nowhere.** The comment "set by Home Assistant" was wishful thinking — HA does not set this global, our wrapper has to.

### Why this caused exactly 10 s

`waitForHass` in `src/utils/hassRetryService.js`:
- `maxRetries = 20`, `interval = 500 ms` → **10 000 ms** ceiling.
- Every 500 ms it checks `context?.hass || window._hass` for `hass.states` populated.

When `DataProvider` mounts, the `hass` prop is often `null` for the first render — Home Assistant calls `set hass()` on the Custom Element asynchronously, after `setConfig`. So `hassRef.current` is `null` when `systemRegistry.initialize()` fires, and the `{hass: hassRef.current, ...}` object captures `null` at registry-call time.

`waitForHass` then:
- Re-checks `context.hass` (still `null`, captured by closure).
- Re-checks `window._hass` (also `null`, never set).
- Polls 20× × 500 ms = 10 000 ms.
- Promise rejects.
- Every entity using `mountWithRetry` loses its initial data.

That explains the consistent ~10.0 s in every measurement and why several earlier theories (Integration parallel, EnergyDashboard parallel) didn't move the number — none of them addressed the actual blocker.

### The fix (two lines)

`build.sh` — Custom Element `set hass(hass)` setter, runs as soon as HA passes `hass` to the element, before Preact even mounts:

```js
if (typeof window !== 'undefined' && hass) {
  window._hass = hass;
}
```

`DataProvider.jsx` — `useEffect` that already syncs `hassRef.current = hass`, gets the same line for defense-in-depth (covers dev-mode where the Custom-Element wrapper isn't used):

```js
if (typeof window !== 'undefined' && hass) {
  window._hass = hass;
}
```

### Expected effect

`waitForHass` finds `window._hass` on its very first poll (or on the polling tick within ≤500 ms after `hass` actually arrives). The 10 s ceiling becomes ~0–500 ms.

`dp-registry-done` should drop from ~10 000 ms to ~700–1500 ms (the time it actually takes to mount all entities once they have `hass`).

### Side effects

- Every system entity using `mountWithRetry` actually gets its initial data on first mount (not just after a state-change later) — small fix for unrelated quirks like StatsBar widgets being delayed.
- iPhone heat: 10 s of wasted polling + 10 s of background mount work after it gives up = real CPU time gone. Should reduce sustained warmth on first-load.

### What this also says about the audit process

Three releases (Phases 5, 6, instrumentation) chased the wrong cause because the profile only showed the symptom (`dp-registry-done` at 10 s), not the underlying mechanism. The root-cause grep took 30 seconds and would have been the right first step. Lesson noted.

---

## Version 1.1.1249 - 2026-04-25

**Title:** Phase 6 — `EnergyDashboardDeviceEntity.onMount` parallelized
**Hero:** none
**Tags:** Performance, Background

### Why Phase 5 didn't move the needle

After v1.1.1248 the user re-profiled and `dp-registry-done` was still ~9.7 s. Phase 5 parallelized `Integration.loadSavedDevices` outer loop, but if you only have one Integration device (in this case the EnergyDashboard), `Promise.all` over a single-element array is the same as awaiting it. The 10 s lives **inside** that one device's `onMount`.

Looking at the code: `EnergyDashboardDeviceEntity.onMount` had 4 sequential awaits, each a separate HA call:

```js
await this._loadAreaFromSensors(hass, config);       // ~2 s
await this.executeAction('loadEnergyPreferences');   // ~3 s (HA WebSocket: energy/get_prefs)
await this.executeAction('getGridImportValue');      // ~1 s (state read)
await this.executeAction('getEnergyData');           // ~3 s (statistics fetch)
```

~9 s sequential, matches the profile.

### The fix

Each action verified to be independent:
- `_loadAreaFromSensors` — reads `hass.states` for area inheritance, sets `this.area*` props
- `loadEnergyPreferences` — `hass.connection.sendMessagePromise({ type: 'energy/get_prefs' })`, sets `energy_prefs` attribute
- `getGridImportValue` — reads `hass.states[gridImportSensor]`, sets `grid_import_value` attribute
- `getEnergyData` — searches `hass.states` for serial-tagged entities, sets `energy_data` attribute

None reads another's output. Each has its own `try { … } catch { return null; }` so failures don't propagate. Safe for `Promise.all`:

```js
await Promise.all([
  this._loadAreaFromSensors(hass, config),
  this.executeAction('loadEnergyPreferences', { hass }),
  this.executeAction('getGridImportValue', { hass }),
  this.executeAction('getEnergyData', { hass }),
]);
```

### Expected effect

Wall-clock for the 4 calls becomes max(slowest) instead of sum. On the v1.1.1248 profile that should drop the EnergyDashboard contribution from ~9 s to ~3 s.

If this is the only Integration device the user has, `dp-registry-done` should land around **~3-4 s** instead of ~9.7 s.

### Verification

After update, check the **second** auto-dump in console. The `dp-registry-done` total_ms is the metric. If it's still ~9 s, then the slow path is somewhere else — would need another targeted profile (per-action marks inside the EnergyDashboard onMount).

### What's left (only if needed)

- `EnergyDashboard.executeAction('getEnergyData')` does its own internal multi-step fetch — could be further sped up if profile shows it's still the bottleneck.
- `WeatherDeviceEntity.onMount` calls `getCurrentWeather` (one await) — if user has it configured and it's slow on its own, no parallelization possible there.

For now: this is the targeted fix the v1.1.1248 profile demanded.

---

## Version 1.1.1248 - 2026-04-25

**Title:** Phase 5 — Integration & Plugin reloads parallel (registry 10 s → ~3 s)
**Hero:** none
**Tags:** Performance, Background

### Why this release

The Safari profile from v1.1.1247 (now matching what we suspected) confirmed the only remaining big delta:

```
dp-ha-indexed     →  dp-registry-done    8 940 ms  ← background but real
```

That's nine seconds of HA chatter happening in the background after the user already sees their cards. It contributes to:
- iPhone heat (sustained network + JS work),
- system entities (News, Todos, Versionsverlauf, etc.) appearing 9 s late in the search results.

Two `for…await` anti-patterns were responsible — both now parallelized.

### Fix A — `Integration.loadSavedDevices` parallel

`src/system-entities/entities/integration/index.js:206`. Each saved device's `onMount` makes several sequential HA calls (e.g. `EnergyDashboardDeviceEntity` chains `_loadAreaFromSensors → loadEnergyPreferences → getGridImportValue → getEnergyData`). With 2 devices the loop ran them back-to-back, ~10 s total.

```js
// Before:
for (const deviceData of devices) {
  const deviceEntity = createDeviceEntity(deviceData);
  await deviceEntity.onMount({ hass, storage });   // sequential!
  systemRegistry.register(deviceEntity);
}

// After:
await Promise.all(devices.map(async (deviceData) => {
  const deviceEntity = createDeviceEntity(deviceData);
  await deviceEntity.onMount({ hass, storage });
  systemRegistry.register(deviceEntity);
}));
```

Each device entity has its own internal state — no shared mutable storage. HA's WebSocket handles concurrent requests fine. `try/catch` is per-device, so one mount failing doesn't block the others (same behavior as before, just parallel).

### Fix B — `Pluginstore` plugin reloads parallel

Same `for…await` anti-pattern in `src/system-entities/entities/pluginstore/index.js:580`. Each enabled plugin gets reloaded from GitHub or URL on mount — sequential network roundtrips. With multiple plugins this added up too.

```js
// Before:
for (const plugin of installedPlugins) {
  if (!plugin.enabled) continue;
  await loader.loadPluginFromGitHub(plugin.repo);  // sequential!
}

// After:
const enabled = installedPlugins.filter(p => p.enabled);
await Promise.all(enabled.map(async (plugin) => {
  await loader.loadPluginFromGitHub(plugin.repo);
}));
```

### Expected effect

If the user has 2 Integration devices each costing 5 s:
- Before: 10 s `dp-registry-done`
- After: ~5 s (limited by the slowest single device)

If the user has 1 Integration device + 0 plugins, no change — Promise.all on a single-element array is the same as awaiting it.

The user-visible boot path (cards visible at ~900 ms) is unchanged. This release purely shrinks the background work — registry-done arrives sooner, system entities pop into search results sooner, less sustained HA chatter (less heat).

### What this still doesn't do

`EnergyDashboardDeviceEntity.onMount` still has 4 sequential `await`s internally. Those could become `Promise.all` too — would shave another ~2 s — but each call writes to attributes and the order may matter for area inheritance. Held for a future profile-driven fix if the new `dp-registry-done` is still uncomfortable.

### Verification

After update, the registry-done callback should fire noticeably sooner. Check the **second** auto-dump in the console (the one that has `dp-registry-done` in it). The delta `dp-ha-indexed → dp-registry-done` should drop from ~9 s to roughly the duration of the slowest single device's onMount.

---

## Version 1.1.1247 - 2026-04-25

**Title:** Phase 4 — `loadCriticalData` parallel + `buildSearchIndex` fire-and-forget
**Hero:** none
**Tags:** Performance

### Why this release

The v1.1.1246 profile cleanly identified the two remaining bottlenecks in the visible boot path:

```
dp-db-init        → dp-critical-done    335.7 ms   ← settings + favorites read (sequential)
dp-ha-rendered    → dp-ha-indexed       324.2 ms   ← buildSearchIndex blocking finally
```

Both are addressed here.

### Fix A — `loadCriticalData` parallel

`src/utils/dataLoaders.js` was reading settings then favorites sequentially:

```js
const storedSettings = await db.get(STORES.SETTINGS, 'user_preferences');
// ...
const storedFavorites = await db.getAll(STORES.FAVORITES);
```

Two independent IndexedDB transactions, no reason to serialize them. Wrapped in `Promise.all`:

```js
const [storedSettings, storedFavorites] = await Promise.all([
  db.get(STORES.SETTINGS, 'user_preferences'),
  db.getAll(STORES.FAVORITES),
]);
```

Expected savings: ~100–150 ms on Safari (each IndexedDB roundtrip is ~150 ms there). This shows up directly in `dp-initialized` timing.

### Fix B — `buildSearchIndex` fire-and-forget

`loadEntitiesFromHA` was awaiting the search index build before releasing the `loadEntitiesRunningRef` mutex. Cards were already committed to state at `dp-ha-rendered` — the user could see them — but the function held its mutex for another 324 ms while the index was written to IndexedDB.

Now the index builds in the background:

```js
buildSearchIndexUtil(dbRef.current, allEntities)
  .then(() => { perfMark('dp-ha-indexed'); /* dump */ })
  .catch(err => console.warn('[DataProvider] buildSearchIndex failed (background):', err));
```

Fuse.js search still works directly on entity names without the index — the index is just a Bonus-Beschleuniger. If a user searches in the first 200 ms after boot, they get slightly slower results until the index lands; in practice imperceptible.

The `initialLoadCompleteRef.current = true` flip moved up before the index call so state-change events flow normally during the background index build.

### Expected effect (relative to v1.1.1246)

```
dp-db-init        → dp-critical-done   ~200 ms   (was 335 ms)
dp-ha-rendered    → dp-ha-indexed       ~324 ms but no longer blocking
```

User-visible boot to `dp-ha-rendered`: 869 ms → ~700 ms. Mutex available for excludedPattern reloads etc. without 324 ms penalty.

### Auto-dump timing

The `setTimeout(perfDump, 0)` moved into the `buildSearchIndex` `.then()` so the dump still includes `dp-ha-indexed` (otherwise it would fire before that mark exists). The registry-done callback still emits its own dump when the registry eventually finishes — full timeline.

### What's not in this release

`Integration.loadSavedDevices` is still a `for…await` loop — registry takes ~10 s in the background. That's the next clear hebel and would need:

- `Promise.all` on the loop (low risk, big win)
- Or per-device `Promise.all` of the multiple HA calls inside each `onMount`

Both improve background load and may reduce the heat we still see. Held for the next release pending another profile to confirm there's no other surprise.

---

## Version 1.1.1246 - 2026-04-25

**Title:** Profiling result — `systemRegistry.initialize()` was blocking 10 s. Now non-blocking.
**Hero:** none
**Tags:** Performance, Boot

### What the v1.1.1245 profile showed

A single delta dwarfed everything else:

```
dp-db-init        → dp-registry-done       10.110 ms   ← 95 % of boot
dp-registry-done  → dp-critical-done           53 ms
dp-critical-done  → dp-warmcache-done          30 ms
dp-warmcache-done → dp-initialized              0 ms
dp-ha-start       → dp-ha-fetched             189 ms
dp-ha-fetched     → dp-ha-scored               56 ms
dp-ha-scored      → dp-ha-rendered             52 ms
dp-ha-rendered    → dp-ha-indexed             250 ms
```

`systemRegistry.initialize()` took **over 10 seconds**. Phase 1 (v1.1.1238) deferred Versionsverlauf's GitHub fetch — but other system entities have similar blocking work. The biggest offender: `Integration.loadSavedDevices` (`integration/index.js:211`) iterates registered devices with a `for…await` loop and calls `await deviceEntity.onMount()` sequentially. Each device's `onMount` makes multiple sequential HA calls (e.g. `EnergyDashboardDeviceEntity` has 4: `_loadAreaFromSensors` → `loadEnergyPreferences` → `getGridImportValue` → `getEnergyData`). With 1–2 integration devices configured, easy 10 s.

`pluginstore.onMount` has the same anti-pattern for installed plugins (`for…await loadPluginFromGitHub`).

### The fix

`DataProvider.initializeDataProvider` no longer awaits `systemRegistry.initialize()`. The boot path becomes:

```
IndexedDB.init()       (~50 ms)
loadCriticalData()     (~50 ms)   ← settings + favorites
loadEntitiesFromCache  (~30 ms)   ← IndexedDB warm-cache
setIsInitialized(true)            ← UI is now visible at ~150 ms
loadBackgroundData() → loadEntitiesFromHA()   (~250-500 ms)
```

`systemRegistry.initialize()` runs in parallel as a fire-and-forget promise. When it eventually finishes, a `.then()` callback merges the real system entities into the entity state via a functional `setEntities(prev => …)` updater. Until then, `getSystemEntities()` returns the existing fallback (1 entity: `system.settings`) so the user can still reach Settings if they look for it.

`loadEntitiesFromHA` was changed to preserve any "real" system entities already in state (count > fallback count) — this handles the race where the registry callback fires either before or after `loadEntitiesFromHA`'s own `setEntities`.

### What the user sees

- Cards visible at ~50 ms from snapshot (unchanged from v1.1.1241).
- Live HA data merged in at ~400-700 ms (unchanged).
- **System entities (News / Todos / Versionsverlauf / Pluginstore / Integration / Weather etc.) appear when the registry finishes** — could be 1–10 s depending on how heavy your integration devices are. They pop in without disrupting layout because they live in the search results, not the always-visible UI shell.

### What this does NOT fix (but is now visible in profile)

- `Integration.loadSavedDevices` is still sequential. Parallelizing it (`Promise.all`) would speed up the registry from 10 s to ~3 s — useful for users actively browsing system entities, but no longer blocks first paint.
- `EnergyDashboardDeviceEntity.onMount` has 4 sequential HA calls that could run as `Promise.all`.
- `pluginstore.onMount` reloads plugins sequentially.

These are now optional optimizations — the heat / blocking pain is gone for the boot path. We can do them later if the registry-done time bothers users browsing system entities.

### Verification

After update, look at the console dump on first boot. The `dp-registry-done` mark now arrives **after** `dp-ha-indexed`, somewhere later in the timeline. The earlier marks should all be sub-200 ms in total. A second `perfDump()` is auto-emitted when registry finishes, showing the full picture.

---

## Version 1.1.1245 - 2026-04-25

**Title:** Boot-time profiling — `performance.mark` instrumentation, no behavior change
**Hero:** none
**Tags:** Performance, Diagnostics

### Why this release

After the Phase 1–3 boot wins (snapshot, warm-cache, splash trim, thermal fixes), the next round of optimizations would each save 20–60 ms in theory. That's small enough to want **measurements before more code changes** — otherwise we'd be guessing which 30 ms to optimize.

This release is instrumentation only. No behavior change.

### What was added

A small `src/utils/perfMarks.js` helper exposing:

- `perfMark(name)` — wraps `performance.mark('fsc:' + name)` plus appends to an in-memory list.
- `perfDump()` — prints the list as a `console.table` plus a copy-paste-friendly text block.
- `perfReset()` — clear and start fresh for a re-measurement.
- `window.__fsc_perf` — manual access in the DevTools console.

### Marks placed (in chronological order)

| Mark | Where | What it captures |
|---|---|---|
| `element-constructor` | `build.sh` Custom Element ctor | Earliest mark — fires before JS bundle is evaluated |
| `bundle-evaluated` | top of `src/index.jsx` | Bundle parsed, module-level code running |
| `app-first-render` | first call to `App()` | Preact has begun rendering |
| `loadapp-start` | `src/index.jsx:loadApp` async start | Begin appearance-settings parse |
| `loadapp-done` | end of `loadApp` | `setIsLoadingComplete(true)` about to fire |
| `dp-snapshot-init` | `DataProvider` `useState` initializer | localStorage snapshot loading |
| `dp-init-start` | `initializeDataProvider` start | DataProvider effect fired |
| `dp-db-init` | after `dbRef.init()` | IndexedDB connection ready |
| `dp-registry-done` | after `systemRegistry.initialize()` | System entities mounted |
| `dp-critical-done` | after `loadCriticalData()` | Settings + favorites loaded |
| `dp-warmcache-done` | after `loadEntitiesFromCache()` | IndexedDB warm-cache merged |
| `dp-initialized` | after `setIsInitialized(true)` | UI is allowed to reveal |
| `dp-ha-start` | start of `loadEntitiesFromHA` | HA fetch begins |
| `dp-ha-fetched` | after `Promise.all([loadAreas, loadDeviceReg, loadEntityReg])` | Registries pulled |
| `dp-ha-scored` | after `scoreEntities` | Per-entity usage scoring done |
| `dp-ha-rendered` | after `setEntities(allEntities)` | Real cards committed to state |
| `dp-ha-indexed` | after `buildSearchIndex` | Search index complete; auto-dump fires |

After `dp-ha-indexed` the helper schedules a `setTimeout(0)` callback that calls `perfDump()`. The user sees the full timeline in the browser console without any manual action.

### How to read the output

Open the dashboard with the DevTools console open. After ~3–5 seconds you'll see:

```
[fsc:perf] Boot timeline (relative to first mark):
┌─────────┬──────────────────────┬──────────┬──────────┐
│ (index) │ step                 │ total_ms │ delta_ms │
├─────────┼──────────────────────┼──────────┼──────────┤
│ 0       │ element-constructor  │ 0.0      │ 0.0      │
│ 1       │ bundle-evaluated     │ 412.3    │ 412.3    │
│ ...
```

`total_ms` is time since the first mark (the constructor). `delta_ms` is time since the previous mark — that's where the bottleneck shows up: the largest delta is the slowest step.

The same data is also in DevTools Performance → User Timing as `fsc:*` named entries, so you can see them inline with the broader profile.

### What this is for

Once you've got a profile from Safari (or wherever the slowness is most pronounced), paste the copy-paste-friendly text block back to me. The next round of optimization picks the actual largest delta — not a guess.

### What this isn't

- Not a behavior change. All marks are no-ops if `performance` is missing.
- Not a perf regression. Each `perfMark` is a few microseconds. Total overhead across all marks is below human-perception threshold.
- Not enabled-only-in-dev. The marks ship in the production bundle so we can measure the actual production behavior. They cost essentially nothing.

---

## Version 1.1.1244 - 2026-04-24

**Title:** Thermal fixes round 2 — pending pulse + state_changed throttle
**Hero:** none
**Tags:** Performance, Mobile, Bug Fix

### Context

After v1.1.1242 replaced the skeleton shimmer's `background-position` animation with a compositor-only opacity pulse, the phone was still getting hot. A systematic audit turned up two more ongoing heat sources that aren't tied to the skeleton:

1. **`pendingPulse` on device cards** animated `box-shadow` at 60 fps while a service call was in flight. Same paint-per-frame pattern that v1.1.1181 fought back with the "Icon-Diät", and what v1.1.1242 fixed for the skeleton. When the user taps multiple toggles in quick succession, several 1.1 s overlapping box-shadow loops run at once.
2. **`state_changed` events had no rate limit.** The existing rAF batcher in `DataProvider.scheduleEntityStateUpdate` only guaranteed "at most one `setEntities` per frame" — so if Home Assistant pushes events in a stream (energy sensors, automations, presence), up to 60 `setEntities` calls per second would land. Each call re-renders `SearchField` (1100 lines, not memoized), `useMemo`s recalculate, Virtua remeasures, framer-motion re-interpolates its animated props. That's sustained CPU on mobile.

### Fix 1 — pendingPulse: box-shadow → opacity ring

Before:

```css
@keyframes pendingPulse {
  0%   { box-shadow: 0 0 0 0 rgba(100, 180, 255, 0.35); }
  50%  { box-shadow: 0 0 0 3px rgba(100, 180, 255, 0.18); }
  100% { box-shadow: 0 0 0 0 rgba(100, 180, 255, 0.0); }
}
.device-card.pending { animation: pendingPulse 1.1s infinite; will-change: box-shadow; }
```

Problem: `box-shadow` paints the entire card rectangle every frame. `will-change: box-shadow` keeps a Compositor layer alive the whole time the card is mounted (even when no animation is running).

Now:

```css
@keyframes pendingPulse {
  0%, 100% { opacity: 0; }
  50%      { opacity: 1; }
}
.device-card.pending::after {
  content: ''; position: absolute; inset: -2px; border-radius: inherit;
  border: 2px solid rgba(100, 180, 255, 0.55);
  animation: pendingPulse 1.1s infinite;
}
```

A pseudo-element ring, opacity-only animation. The ring is a static border (paint once), the animation only changes opacity (compositor-only, GPU blends the layer at varying alpha). Same visual signal ("I'm working on this"), near-zero GPU cost.

### Fix 2 — min 150 ms between state_changed flushes

`DataProvider.scheduleEntityStateUpdate` now tracks `lastFlushAtRef` and enforces a minimum 150 ms gap between flushes. Events arriving inside that window accumulate in the pending `Map` (last-write-wins per `entity_id`) and flush together at the end of the window.

- Before: up to 60 re-renders per second when HA fires a stream of events.
- After: at most ~6–7 re-renders per second. Sensor updates arrive visually in the same frame as before (human perception threshold is ~100 ms anyway).

Safari's natural rAF throttling for hidden tabs still applies on top of this — when the card is backgrounded, rAF won't fire at all, events just accumulate.

### What this doesn't fix

The audit also flagged:
- **Framer-motion `animate={{ boxShadow: ... }}`** on `SearchField` — string interpolation each re-render. Candidate for the next round if heat persists.
- **`.glass-panel` backdrop-filter** with `blur(20px + user-configured)` on multiple stacked panels (StatsBar + Panel + Sidebar) — expensive on mobile GPU, but removing or reducing it would change the design. Could add a mobile-reduced-blur media query, but that's a visual call, not a bug fix.
- **Printer3D `setInterval(..., 2000)`** polling — only runs if the user has a 3D printer and opens that view. Not a general heat source.

If v1.1.1244 still leaves the phone warm, next step is an on-device Chrome/Safari Performance profile — we need data, not more guesses.

---

## Version 1.1.1243 - 2026-04-24

**Title:** StatsBar flashes "--°C / 0.0 kW" — snapshot was being wiped right after loading
**Hero:** none
**Tags:** Bug Fix, Performance

### The regression

User reported seeing "--°C" for weather and "0.0 kW" for grid consumption in StatsBar right after a cold boot, even after the snapshot warm-cache from v1.1.1241 was in place. The snapshot is supposed to make cards visible from the first render — so why was StatsBar missing its inputs?

### Root cause

`initializeDataProvider` in `DataProvider.jsx` had this sequence:

```
useState initializer → entities := snapshot (120 non-system entities including weather)
useEffect fires → dbRef.init() → systemRegistry.initialize()
  → setEntities(systemEntities)          ← REPLACES the snapshot entities!
→ loadCriticalData()
→ loadEntitiesFromCache (IndexedDB)      ← re-populates, but state was empty in between
→ setIsInitialized(true) → UI renders
```

Line 399 was `setEntities(systemEntities)` — a straight replace. It wiped every non-system entity that the snapshot had just loaded, including the `weather.*` entity that StatsBar's `useMemo` depends on. For the ~50–500 ms window between "system registry done" and "IndexedDB warm-cache done" (longer on Safari), StatsBar saw an empty device list → `weatherEntity` was `null` → `--°C`.

### Fix

`setEntities` now uses a functional updater that merges system entities with whatever non-system entities were already there:

```js
setEntities(prev => {
  const nonSystemPrev = prev.filter(e => !e.is_system);
  return [...systemEntities, ...nonSystemPrev];
});
```

Now the sequence is:

1. Snapshot loads 120 non-system entities in the useState initializer (sync).
2. `systemRegistry.initialize()` finishes → system entities merged in. Snapshot entities preserved.
3. IndexedDB warm-cache replaces the non-system tier with a fresher/wider set. System entities preserved.
4. `loadEntitiesFromHA` replaces everything with live HA data.

Three paint updates, same as before, but the StatsBar widget never sees an empty device list anymore. Weather temperature, grid consumption, solar production — all visible from the first frame on warm boots.

### Why this wasn't caught earlier

The warm-cache wipe existed in the original code too — but back then `useState([])` started empty, so "wiping to just system entities" was equivalent to "filling in the system entities". The snapshot from v1.1.1241 changed the initial state from empty to populated, and the replace became a regression.

### Not changed

- Energy dashboard (`energyData`) is still fetched async via `getEnergyDashboardData`. The "0.0 kW" in the screenshot is the live sensor state from `hass.states` (via `getEnergyValue` fallback), which works the same as before. If it shows 0.0 kW right after boot, that's either the actual consumption at that moment or the sensor is still populating — not affected by this fix.

---

## Version 1.1.1242 - 2026-04-24

**Title:** Skeleton shimmer → opacity pulse (thermal fix, mobile GPU)
**Hero:** none
**Tags:** Performance, Bug Fix, Mobile

### The regression

After v1.1.1238 and v1.1.1240 added skeleton shimmer animations in two places (React-level `perceivedSpeed.css` and pre-JS HTML placeholder in `build.sh`), the phone was getting warm again. Exactly the same thermal pattern as v1.1.1181's "58 → 42 endless SVG animations" fix.

### Why

The shimmer keyframe animated `background-position`:

```css
@keyframes skeletonShimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

`background-position` is **not compositor-accelerated**. The browser has to repaint the entire element on every frame. With 8 skeleton cards + a title + a search bar shimmering at 60 fps, that's 600+ paints per second, all on the main thread, all forcing GPU texture uploads on mobile. Heat.

### The fix

Opacity pulse instead. Opacity is compositor-only — the GPU blends an existing texture at a different alpha, no repaint, no texture upload:

```css
@keyframes skeletonPulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.45; }
}
.device-card-skeleton {
  background: rgba(255, 255, 255, 0.08);
  animation: skeletonPulse 1.6s ease-in-out infinite;
}
```

Applied in both places:
- `src/styles/perceivedSpeed.css` — React-level skeleton (shown while entities load)
- `build.sh` `_createPlaceholder` — HTML placeholder (shown before Preact mounts)

Same timing (1.6 s), same reduced-motion fallback, much less thermal load. Visually still clearly "this is loading" — pulse-style skeletons are the LinkedIn / Facebook / YouTube pattern.

### What this means for the user

- Same boot-perf wins from v1.1.1238–1241 stay.
- Phone should no longer heat during the brief skeleton phase.
- If heat persists after this, the cause is elsewhere (e.g. `pendingPulse` box-shadow animation during service calls, framer-motion re-layouts, or something older) and needs a Chrome Performance profile on-device to pinpoint.

### Audit of remaining infinite animations

Checked every `animation: ... infinite` in the codebase. All compositor-friendly:
- `spin` (6 places): `transform: rotate()` — compositor-only ✓
- `pulse` (various views): mostly opacity or transform ✓
- `float` (WeatherView): transform ✓
- `pendingPulse` (perceivedSpeed.css): animates `box-shadow` (paint), but only runs briefly during a service call — not a thermal concern

---

## Version 1.1.1241 - 2026-04-24

**Title:** localStorage snapshot — Safari-friendly 1st-tier warm cache
**Hero:** none
**Tags:** Performance, Safari

### Context

After v1.1.1240 dropped the splash padding and added a pre-JS skeleton in the Custom Element placeholder, Safari still felt sluggish between "skeleton visible" and "real cards visible". Two reasons, both Safari-specific:

1. **IndexedDB open is slow on WebKit.** 50–500 ms on first connect, compared to ~20 ms on V8. The warm-cache from v1.1.1239 reads from IndexedDB, so it inherits this latency.
2. **Big JS bundle parses slower.** 1.4 MB (366 KB gzipped) takes 500–1500 ms to parse on Safari. Everything downstream has to wait.

(1) is addressable. (2) is not, without breaking the HACS single-file constraint.

### The fix — three-tier warm cache

Memory (cache), IndexedDB, localStorage, HA. Previously only the last three were in the boot path, and the fastest of them still involved async I/O. Now we have a synchronous front-of-queue:

1. **localStorage** — synchronous, ~1 ms even on Safari. Top-120 entities with just the fields a device card needs (entity_id, domain, state, attributes, area, relevance_score, usage_count, last_changed/updated). Read in the `useState` initializer, so Preact renders cards in the very first render frame — before any effect fires.
2. **IndexedDB** — async, 50–500 ms on Safari. Full entity shape, richer metadata. Reads in `initializeDataProvider` after `loadCriticalData`. Overrides the localStorage tier via a functional `setEntities` updater.
3. **Home Assistant** — async, 2–4 s. Fresh authoritative data. `loadEntitiesFromHA` runs via the existing `hass`-retry `useEffect`.

The three writes use Preact's keyed reconciliation (`entity_id`), so cards stay mounted through all three updates — no flash, no layout shift, no re-animation.

### New file — `src/utils/entitiesSnapshot.js`

Three exports:

- `loadEntitiesSnapshot()` — sync read from `localStorage['fsc_entities_snapshot_v1']`, returns `[]` on any failure (private browsing, disabled storage, parse error).
- `saveEntitiesSnapshot(entities)` — filters non-system, sorts by `relevance_score`, caps at 120 entities, writes compact JSON. ~15–20 KB at cap, well within Safari's localStorage quota.
- `clearEntitiesSnapshot()` — wipes the key. Called from `resetLearningData` so the next boot doesn't paint stale usage counts.

### Wiring

**Read path** — `DataProvider.jsx`:

```js
const [entities, setEntities] = useState(() => {
  const snap = loadEntitiesSnapshot();
  if (snap.length === 0) return [];
  const liveStates = hass?.states;
  if (!liveStates) return snap;
  return snap.map(e => {
    const live = liveStates[e.entity_id];
    return live
      ? { ...e, state: live.state, attributes: live.attributes, last_changed: live.last_changed, last_updated: live.last_updated }
      : e;
  });
});
```

`hass` is already passed as a prop when DataProvider mounts (HA calls `setHass` before the card is visible). So the initializer can enrich the cached shape with live state right away — no stale on/off.

**Write path** — end of `loadEntitiesFromHA`, right after the existing `setEntities(allEntities)`:

```js
saveEntitiesSnapshot(allEntities);
```

### What changes for the user

- **First ever boot on a device:** no snapshot → no change. Skeleton still carries the wait.
- **Every subsequent boot:** the React-level skeleton never even renders. Cards are visible in the first paint frame after Preact mounts. On Safari this saves the full IndexedDB-open cost — 50–500 ms of pure waiting, gone.
- **After "Reset Learning Data":** snapshot is cleared, next boot behaves like a first-boot (skeleton carries the wait until fresh HA data writes a new snapshot).

### What this does NOT do

- Does not shrink the 1.4 MB bundle. JS parse time on Safari is untouched.
- Does not pre-open IndexedDB in parallel with Preact mount (option C from the plan — lower priority now that snapshot short-circuits the IndexedDB path for rendering).
- Does not touch the data flow for settings or favorites — those stay in IndexedDB via `loadCriticalData`.

---

## Version 1.1.1240 - 2026-04-24

**Title:** Splash delays gone + pre-JS skeleton in Custom Element placeholder
**Hero:** none
**Tags:** Performance, UX, Safari

### Context

After v1.1.1238 (deferred GitHub fetch + React-level skeleton) and v1.1.1239 (IndexedDB warm-cache), Chrome / iPhone HA app felt clearly faster. Safari (iOS + macOS) did not — still slow to reach the first interactive paint. Two reasons: the splash screen was still holding 2.5 s of hardcoded `setTimeout` padding that was originally calibrated to the old ~2.5 s app-load, and Safari's slower JS start-up meant the Custom Element placeholder (a centered "🔍 Loading…") was visible for longer than on other engines.

This release addresses both.

### Fix A — drop the splash padding

`src/index.jsx` used to chain five `setTimeout`s between progress bar stages:

```
0 % → wait 250 ms → 25 % (parse settings) → wait 500 ms
    → 50 % → wait 500 ms → 75 % → wait 500 ms
    → 100 % → wait 750 ms → reveal
```

Total artificial wait: 2500 ms. Those delays were added back when `DataProvider` itself needed ~2.5 s to become ready; the splash *covered* that cost. With Phase 1 + Phase 2, real init is under 200 ms on warm boots, so the padding is pure cost.

Now:

```
0 % → parse settings (real work) → 100 %
    → 120 ms flash protection → reveal
```

`splashDrawingDone` still gates the 'hello' splash (Apple Hello animation is a deliberate design choice, untouched), so users on that style still see the full lettering. Users on the default 'progress' style now get ~120 ms of splash instead of 2.5 s.

### Fix B — skeleton IN the Custom Element placeholder (pre-Preact)

`build.sh` writes a Shadow-DOM placeholder straight into the Custom Element constructor. This HTML is the very first thing Safari (or any browser) renders, *before* the main 1.4 MB bundle is even parsed. It used to be:

```html
<div>🔍 Fast Search Card</div>
<div>Loading…</div>
```

Visually: a plain white box with centered text.

New placeholder renders a pure-HTML+CSS skeleton with:

- A fake search bar (56 px high, rounded 28 px, shimmer)
- A fake section title (16 × 140 px, shimmer)
- An 8-card skeleton grid — 4 cols desktop, 3 cols tablet, 2 cols mobile

Same `@keyframes fscShimmer` as the React-level skeleton from v1.1.1238, scoped inside the shadow root so no style leak. `prefers-reduced-motion` disables the animation. The `_render()` function already removes `.fsc-placeholder` when Preact mounts, so no wiring change needed there.

### Expected effect

- **macOS Safari / iOS Safari:** the blank-white-box moment is gone. From the first frame the user sees a structured shimmering grid. The real app takes over once Preact finishes parsing (~300–800 ms later depending on CPU), and warm-cache cards arrive within another ~50 ms.
- **Chrome / Firefox / iPhone HA app:** also benefits — the placeholder was white there too, just for shorter. Combined with the splash-delay removal, the total perceived boot on a warm second start is now ~200–400 ms before real cards appear.

### What this does NOT do

- The Apple Hello splash animation timing is unchanged — that's a designed experience, not a bottleneck.
- The real JS bundle size (1.4 MB / 366 KB gzip) is untouched. Code-splitting would break the HACS single-file constraint.
- No DataProvider or SearchField refactor. Still pending but not now.

---

## Version 1.1.1239 - 2026-04-24

**Title:** IndexedDB warm-cache — panel is populated in ~0 ms from second boot onwards
**Hero:** none
**Tags:** Performance

### The idea

The card has persisted HA entities to IndexedDB for a long time already (the `STORES.ENTITIES` batch-write at the end of `loadEntitiesFromHA`). But on boot, that cache was never read unless `hassRef.current` was missing — i.e. dead code for every real HA session. The full first paint always waited for `loadEntitiesFromHA` to round-trip (~2–4 s on iPhone).

Now: boot reads the cache and renders it before `loadEntitiesFromHA` even starts. Second boot onwards, the panel is populated immediately.

### What the warm cache does

1. **Read from IndexedDB.** New `loadEntitiesFromCache(db, hassRef)` in `dataLoaders.js` pulls all non-system entities out of `STORES.ENTITIES`.
2. **Enrich with live state.** Cached entities carry stale `state` from the last session (a light might be stored as "on" even if it's actually off now). To avoid showing stale state, each cached entity is merged with `hassRef.current.states[entity_id]` if available — cached shape (`name`, `area`, `icon`, `relevance_score`) plus live `state`, `attributes`, `last_changed`, `last_updated`. When `hass.states` isn't yet populated, we fall back to cached state; `loadEntitiesFromHA` will correct it a beat later.
3. **Apply excluded patterns.** Same `filterExcludedEntities` as the main path — no risk of showing entities the user has since excluded.
4. **Merge with system entities.** System entities always come from the registry (never cached). Warm-cache `setEntities` uses the functional updater: `prev.filter(is_system)` stays, non-system is replaced with the cache payload.

### Wiring

`initializeDataProvider` in `DataProvider.jsx`:

```
IndexedDB.init()
systemRegistry.initialize() → setEntities(systemEntities)   # 5–6 entities
loadCriticalData()                                           # settings + favorites
→ NEW: loadEntitiesFromCache → setEntities([sys + cached])  # full warm list
setIsInitialized(true)                                       # UI reveals
loadBackgroundData() → loadEntitiesFromHA()                  # fresh data replaces
```

The hass-retry `useEffect` still fires once `isInitialized` flips to `true`, so fresh entities overwrite the warm cache via the same `setEntities(allEntities)` call as before. Preact's keyed reconciliation (keyed by `entity_id`) means the cards stay mounted during the swap — no flash, no re-animation.

### Expected effect

- **First ever boot:** cache is empty → no benefit, skeleton shimmer from v1.1.1238 carries the ~3–5 s until `loadEntitiesFromHA` finishes.
- **Every subsequent boot (~99 % of sessions):** `devices.filter(d => !d.is_system).length === 0` flips false in roughly one IndexedDB read (~20–50 ms). Panel is populated before the user notices. Fresh state arrives 2–4 s later but the swap is invisible.

### What this does NOT do

- **No IndexedDB write optimization.** The batch-put at the end of `loadEntitiesFromHA` is unchanged — the cache just now gets *read* too.
- **No splash change.** The setTimeouts in `index.jsx` are still the ~2.5 s they've been. Once we have real measurements of the warm-cache effect, we can re-tune the splash. Not now.
- **No DataProvider split.** Still 1100+ lines; still the right call to leave it alone for now.

---

## Version 1.1.1238 - 2026-04-24

**Title:** First-Load perf — defer changelog fetch + skeleton cards
**Hero:** none
**Tags:** Performance, UX

### The problem

On the very first start (iPhone app or desktop browser) the expanded panel stayed empty for 3–10 seconds before device cards appeared. Root-cause audit across both recent session notes revealed two layers stacking on top of each other:

1. **Versionsverlauf entity blocked the registry init.** Its `onMount` did a synchronous GitHub fetch for `docs/versionsverlauf.md`. The `systemRegistry.initialize()` call in `DataProvider` awaited `Promise.all([...onMount(), ...])`, so the slowest mount — this one, ~150–300 ms on slow networks — gated everything else, including `loadEntitiesFromHA`.
2. **No visual feedback between splash fadeout and first cards.** Once the splash screen disappeared, the expanded panel rendered but `groupedFilteredDevices` was still empty. `GroupedDeviceList` returned `null`, so the user saw a blank panel area for the remaining 2–4 s while HA entities loaded.

### Two minimal fixes

**1. Versionsverlauf cache-only on boot**

`onMount` now reads `localStorage.versionsverlauf_cache` directly (synchronous, ~1 ms) and never touches the network. The GitHub fetch still happens — just lazily, when `VersionsverlaufView` itself mounts (its own `useEffect` already calls `executeAction('loadChangelog')`). First-time users without a cache see an empty list until they open the view; next boot the cache is warm anyway.

New `loadFromCacheOnly` action alongside the existing `loadChangelog`. Separation of concerns:
- `loadFromCacheOnly` — boot path, synchronous, no network
- `loadChangelog` — view path, cache-first with GitHub fallback (unchanged)

**2. Skeleton cards during entity load**

While `devices.filter(d => !d.is_system).length === 0` (HA entities haven't arrived yet), `GroupedDeviceList` now renders a shimmer-animated placeholder grid: 2 fake section headers with a column-matched row of fake cards each. Columns honor `useColumnCount` so the skeleton stays visually consistent with the real grid.

The shimmer stops the moment real rooms arrive — no transition jank. `aria-busy="true"` + `aria-live="polite"` for accessibility. `prefers-reduced-motion` disables the animation.

### What this does NOT do

- **Does not shorten the splash setTimeouts** (still 250 + 500 + 500 + 500 + 750 ms). Removing them without also speeding up the real load would make things visually worse — the splash currently hides the init gap. Next release once we measure the registry improvement.
- **Does not add IndexedDB warm-cache read** (next release, medium complexity).
- **Does not refactor DataProvider or SearchField.** Both are 1100+ lines and overdue for splitting, but high-risk right now. Fix the acute pain first.

### Expected effect

- Versionsverlauf: ~150–300 ms earlier registry completion on cold starts.
- Skeleton: the 3–10 s gap is no longer a blank panel — shimmer fills the visual void so the card feels alive from the first frame after splash.

---

## Version 1.1.1237 - 2026-04-24

**Title:** Sidebar –10 % instead of –20 %, iOS navbar title now actually centered
**Hero:** none
**Tags:** Bug Fix, Design

### Two fixes

**1. Sidebar slightly less slim**

Horizontal padding adjusted to 12 px (from 8 px in v1.1.1236). Net change vs. the original 16 px is ~–10 % in width – the previous –20 % was too much.

```css
.vpm-menu.glass-panel { padding: 12px 12px; }
```

**2. iOS navbar title centering bug**

Inside version-detail pages (and every other iOS-style navbar) the title uses `position: absolute; left: 50%; transform: translateX(-50%)` to center itself. But the parent `.ios-navbar` was missing `position: relative`, so the title was positioned against a far ancestor and visually landed at the left next to the back button instead of centered.

Fix: one line in `.ios-navbar`:

```css
position: relative;
```

All navbars using `.ios-navbar` + `.ios-navbar-title` now show a properly centered title.

### Changed files

- `src/components/SearchField/SearchField.css` – `.vpm-menu.glass-panel` padding
- `src/system-entities/entities/news/components/iOSSettingsView.css` – `.ios-navbar { position: relative }`

### Test

- Sidebar is a little wider than after v1.1.1236, a little slimmer than before
- Versionsverlauf → pick any version → detail page title (e.g. `v1.1.1236`) is now horizontally centered in the navbar, not stuck next to the "Back" button

---

## Version 1.1.1236 - 2026-04-24

**Title:** Sidebar 20 % slimmer + font stack matches StatsBar
**Hero:** none
**Tags:** Design

### Two small tweaks

**1. Narrower rail**

Container horizontal padding cut from 16 px to 8 px (vertical stays at 12 px). The pill is now ≈ 20 % slimmer in the collapsed state. Item padding and icon size are unchanged – more breathing space on the page, same hit-area.

**2. Font stack unified**

The rail used `system-ui, -apple-system, sans-serif` while the StatsBar uses the Apple-style fallback chain. The rail now matches:

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

Same look as the rest of the glass UI (StatsBar, GreetingsBar, etc.).

### Changed file

- `src/components/SearchField/SearchField.css` – `.vpm-menu.glass-panel` padding + font-family

### Test

Visual inspection; the rail should look noticeably slimmer and label text (when expanded) should share the same weight / metrics as the StatsBar pill above.

---

## Version 1.1.1235 - 2026-04-24

**Title:** StatsBar vertical padding doubled (6 → 12 px), DetailView top offsets adjusted
**Hero:** none
**Tags:** Design

### Small height tweak

Vertical padding on the StatsBar pill was 6 px top & bottom – a bit tight. Doubled to 12 px for more breathing room around icons and text. Horizontal padding unchanged (12 / 16 px on mobile / desktop).

```jsx
padding: isMobile ? '12px 12px' : '12px 16px'
```

Because the pill is now ~12 px taller, the DetailView top offset moved up by the same amount so the detail panel still starts flush with the bottom of the StatsBar:

```js
const statsBarHeight = statsBarEnabled ? (isMobile ? 57 : 64) : 0;
// previously: (isMobile ? 45 : 52)
```

### Changed files

- `src/components/StatsBar.jsx` – inline padding
- `src/components/SearchField/components/DetailViewWrapper.jsx` – `statsBarHeight` + 12 px on both breakpoints

### Test

- Expand panel → StatsBar pill looks less cramped, icons + text nicely centered
- Open a device → DetailView lands directly below the StatsBar with no overlap and no visible gap

---

## Version 1.1.1234 - 2026-04-24

**Title:** Sidebar inherits user background, 12 × 16 px padding, StatsBar gated by expand
**Hero:** none
**Tags:** Design, UX

### Three adjustments

**1. Sidebar now shares the glass background with StatsBar + panel**

Replaced the custom `apple-window` look (hard-coded `rgba(0,0,0,0.25)` + local blur) with the project-wide `glass-panel` class. That class reads the user-configurable CSS variables (`--background-blur`, `--background-saturation`, `--background-brightness`, `--background-contrast`, `--background-grayscale`) via `::before`, so Appearance settings now affect the sidebar exactly like they affect StatsBar and the expanded panel.

```jsx
<ul className="vpm-menu glass-panel">
```

Border-radius override keeps the 2 rem pill look:

```css
.vpm-menu.glass-panel {
  border-radius: 2rem !important;
  padding: 12px 16px;   /* matches StatsBar */
  …
}
```

**2. Padding aligned with StatsBar**

`12 px` vertical / `16 px` horizontal on the rail container. Icon hit-areas remain unchanged.

**3. StatsBar now appears only when the panel is expanded**

Same gating pattern as the sidebar. The `show` prop is now `statsBarSettings.enabled && isExpanded`. When the panel is collapsed the StatsBar disappears along with the sidebar – cleaner idle state, more focus on the search bar.

### Changed files

- `src/components/SearchSidebar.jsx` – class swap `apple-window` → `glass-panel`
- `src/components/SearchField/SearchField.css` – old `.apple-window` block removed, new `.vpm-menu.glass-panel` block with padding 12 × 16
- `src/components/SearchField.jsx` – `show={statsBarSettings.enabled && isExpanded}` on `<StatsBar>`

### Test

- Reload card collapsed → no StatsBar, no sidebar
- Click to expand panel → both appear, sharing the same glass background
- Settings → Appearance → change Background Blur / Saturation → sidebar reacts together with StatsBar and panel
- Sidebar padding matches the StatsBar pill (12 × 16 px)

---

## Version 1.1.1233 - 2026-04-24

**Title:** Sidebar next to panel (12 px gap), stays visible during DetailView, detail top 54 → 52
**Hero:** none
**Tags:** Bug Fix, Design

### Three small but important fixes on the new sidebar

**1. Rail now sits next to the panel, not at the viewport edge**

The `position: fixed; left: 2rem` from v1.1.1232 pinned the rail to the left edge of the viewport, leaving a huge gap to the panel on wide screens. It now sits right next to the panel with a constant 12 px gap:

```css
.vision-pro-menu--desktop {
  position: absolute;
  right: 100%;      /* rail's right edge anchored to panel's left edge */
  top: 50%;
  margin-right: 12px;
  transform: translateY(-50%);
}
```

Hover expansion grows to the left into the free area – the gap to the panel stays 12 px no matter how wide the rail becomes.

**2. Sidebar stays visible while DetailView is open**

The previous render condition included `!showDetail`, so the rail disappeared the moment a device was opened. Removed – shortcuts are now always reachable.

**3. DetailView top offset 54 → 52 px**

Minor tweak to match the StatsBar pill exactly. Mobile unchanged at 45 px.

### Changed files

- `src/components/SearchField/SearchField.css` – `.vision-pro-menu--desktop` switched from `position: fixed` to `position: absolute` with `right: 100% + margin-right: 12px`
- `src/components/SearchField.jsx` – `!showDetail` removed from sidebar render condition
- `src/components/SearchField/components/DetailViewWrapper.jsx` – `statsBarHeight` desktop 54 → 52

### Test

- Desktop: open panel → rail sits 12 px left of the panel, vertically centered
- Hover rail → it widens to the left (into empty space), panel position never changes
- Open a device → DetailView appears, rail stays visible at the same spot
- Detail header now flush to the StatsBar without any visual collision (52 px offset)

---

## Version 1.1.1232 - 2026-04-24

**Title:** Sidebar redesign – Vision-Pro mockup v2 (fixed to viewport, hover-expand labels)
**Hero:** none
**Tags:** Design

### 🆕 Completely new sidebar look

Based on the second Vision-Pro mockup the user provided. Main differences vs v1.1.1231:

- **Fixed to the viewport**, not to the panel
  - Desktop: `left: 2rem`, vertically centered
  - Mobile: `bottom: 2rem`, horizontally centered
- **Never interferes with the card layout** – `position: fixed`, `pointer-events: none` on the outer wrapper, `auto` only on the menu itself
- **Apple-window glass style** – `border-radius: 2rem`, `backdrop-filter: blur(1rem)`, subtle 2 px border
- **Hover-expand labels** – pill width grows from icon-only to icon + 8 rem label, pure CSS transition (250 ms ease-in-out)
- **Pill-shaped items** with `border-radius: 2rem`, hover / active background `hsla(0,0%,90%,0.2)`
- **Mobile**: labels hidden entirely (`display: none`), horizontal row of icons

### Structure (new)

```jsx
<div class="vision-pro-menu vision-pro-menu--desktop">
  <div class="vpm-wrapper">
    <ul class="vpm-menu apple-window">
      <li>
        <button class="vpm-item" onClick={…}>
          <span class="vpm-icon">{getSystemEntityIcon(…)}</span>
          <span class="vpm-label">Label</span>
        </button>
      </li>
      …
    </ul>
  </div>
</div>
```

Icons come from the existing `getSystemEntityIcon()` path (same icons the device cards use) – unchanged from v1.1.1231.

### Changed files

- `src/components/SearchSidebar.jsx` – rewritten to match mockup structure (button + icon + label span)
- `src/components/SearchField/SearchField.css` – old `.search-sidebar*` rules removed, new `.vision-pro-menu*` / `.vpm-*` rules added

### Test

- Desktop: rail sits top-left of viewport, 2 rem inset, vertically centered; hover the pill → icons + labels; click an icon → DetailView opens
- Mobile: horizontal pill at bottom center, icons only, tap → DetailView
- Panel position/size stays **identical** whether sidebar is visible or not
- Settings → General → Sidebar toggles still work

---

## Version 1.1.1231 - 2026-04-24

**Title:** Sidebar polish: real SVG icons, vertically centered, panel no longer shifts
**Hero:** none
**Tags:** Bug Fix, Design

### Three issues from v1.1.1230 resolved

**1. Icons were rendered as text**

Some system entities carry their icon as an `mdi:*` string rather than an inline SVG. The previous `dangerouslySetInnerHTML` path showed the raw string (e.g. `mdi:cog`, `newspaper`). Now the sidebar reuses the **same renderer the device cards use** (`getSystemEntityIcon`), so every shortcut shows the proper SVG icon.

**2. Sidebar now vertically centered to the panel**

Changed from `top: 0` to `top: 50%` + `translateY(-50%)`. Centers inside the search-row (≈ panel height) regardless of panel content.

**3. Panel no longer shifts right when the sidebar appears**

The sidebar sat inside `.search-row` with `position: absolute`, but some flex edge-cases still nudged the panel. Fix: wrap it in a **zero-width anchor**:

```css
.search-sidebar-anchor {
  position: absolute;
  top: 0; bottom: 0; left: 0;
  width: 0;
  pointer-events: none;
}
.search-sidebar-anchor > * { pointer-events: auto; }
```

The anchor takes no layout space at all, so the panel stays put whether the sidebar is shown or not.

### Changed files

- `src/components/SearchSidebar.jsx` – icons via `getSystemEntityIcon`, new anchor wrapper on desktop
- `src/components/SearchField/SearchField.css` – `.search-sidebar-anchor` rules, `top: 50%` + `translateY(-50%)` on desktop rail

### Test

- Desktop: open panel → sidebar sits centered vertically next to the panel, real SVG icons visible, panel width/position unchanged whether sidebar is shown or not
- Hover → width expands, labels fade in
- Mobile: unchanged horizontal pill bottom-center

---

## Version 1.1.1230 - 2026-04-24

**Title:** Sidebar: shortcut rail to system entities (desktop vertical, mobile horizontal)
**Hero:** none
**Tags:** Feature, UX

### 🧭 Jump straight to settings, todos, news, changelog…

Inspired by the Apple Vision Pro side-menu mockup: a slim glass rail that lives next to the expanded search panel. One icon per system-entity shortcut. On **desktop** the rail sits vertically to the left of the panel and **expands on hover** to reveal labels. On **mobile** it sits as a horizontal pill at the bottom center, icons only.

Default shortcuts (in order): **Settings · Todos · News · Versionsverlauf · Plugin Store**.
Tap / click → opens that system-entity directly in the DetailView, just like clicking a device card.

### Settings

New section **Settings → General → Sidebar** with two toggles:

- **Show sidebar** (default: on)
- **Always visible** (default: off — rail appears only while the panel is expanded)

### Files

- **New:** `src/components/SearchSidebar.jsx` – reads entities from `systemRegistry`, renders glass pill, hover-expand labels
- `src/components/SearchField/SearchField.css` – new `.search-sidebar` rules (desktop vertical / mobile horizontal / hover label animation)
- `src/components/SearchField.jsx` – reads sidebar settings, listens to `sidebarSettingsChanged`, mounts `<SearchSidebar>` inside `.search-row`, click handler opens DetailView
- `src/components/tabs/SettingsTab/components/GeneralSettingsTab.jsx` – new "Sidebar" section with both toggles, persisted under `systemSettings.sidebar`

### Design

- Glass look shared with expanded panel (`.glass-panel` class → user blur/saturation settings propagate)
- Hover on desktop expands width from 56 px to 220 px with labels fading in (pure CSS transition 0.25 s)
- Mobile: fixed position bottom 16 px, centered, horizontal overflow scroll if many items

### Not in this release (phase 2)

- Per-icon configuration (which shortcuts appear, in what order)
- Drag-to-reorder

### Test

- Desktop, panel open → rail visible on the left, hover → labels appear, click an icon → DetailView opens
- Mobile (narrow viewport) → rail sits bottom-center with just icons
- Settings → Show sidebar off → rail disappears
- Settings → Always visible on → rail stays even when panel is collapsed

---

## Version 1.1.1229 - 2026-04-24

**Title:** StatsBar: widgets left, avatar right, mobile rotates every 5 s
**Hero:** none
**Tags:** Design, UX, Mobile

### 🔄 Three changes in one pass

**1. Positions swapped**

Widgets are now on the left side of the pill, the user avatar sits on the right. This matches the inspiration mockup from earlier.

**2. Username label removed**

Only the avatar circle (or fallback `👤` if no HA user picture) is shown. The "Ender" text is gone.

**3. Mobile: single rotating widget, 5 s per step**

On mobile the pill now shows **one widget at a time**. After 5 seconds it advances to the next active widget (time → weather → grid consumption → …), wrapping around. Order = order in the source list / settings order.

```js
useEffect(() => {
  if (!isMobile) return;
  if (notifPanelOpen) return; // pause while panel is open
  const timer = setInterval(() => setRotationIndex(i => i + 1), 5000);
  return () => clearInterval(timer);
}, [isMobile, notifPanelOpen]);
```

Rotation pauses automatically while the notifications panel is open, so you can read what's there without it disappearing.

### How the widget list is built

All active widgets are collected into a `widgetNodes = [{ key, node }, …]` array before render. Desktop renders the whole array, mobile renders only `widgetNodes[rotationIndex % widgetNodes.length]`.

Adding/removing widgets in Settings → Status & Greetings → StatsBar → Widgets now directly drives the rotation roster.

### Changed file

- `src/components/StatsBar.jsx`

### Test

- **Desktop**: widgets left, avatar right, no name visible
- **Mobile**: exactly one widget visible, advances every ~5 s, loop restarts at the end
- **Mobile + tap notification**: rotation pauses, panel opens; close panel → rotation resumes
- Toggling individual widgets off in Settings → that widget no longer shows up in rotation

---

## Version 1.1.1228 - 2026-04-19

**Title:** Settings: StatsBar "Active/Inactive" label now reflects the sub-page toggle
**Hero:** none
**Tags:** Bug Fix, Settings

### 🐛 Main setting showed "Active" even after disabling in sub-page

Toggling StatsBar off inside the detail page (Settings → Status & Greetings → StatsBar → toggle) updated the StatsBar itself, but the parent row still said "Active" after a reload.

### Root cause

Two different storage slots for the same flag:

- `StatsBarSettingsTab` (sub-page) wrote to **legacy key** `localStorage.statsBarEnabled`
- `GeneralSettingsTab` (parent page) read from **`systemSettings.appearance.statsBarEnabled`** (via `readSystemSettingsSection`)

The event-based live sync covered the visible state of the parent row while the app was open, but the persisted value in `systemSettings` was never updated → on remount, the old value reappeared.

### Fix

`handleStatsBarToggle` in the sub-page now writes both:

```js
localStorage.setItem('statsBarEnabled', enabled);                             // legacy for StatsBar.jsx
updateSystemSettingsSection('appearance', { statsBarEnabled: enabled });      // canonical for GeneralSettingsTab
```

No changes needed on `StatsBar.jsx` (it still reads from the legacy key; that path keeps working).

### Changed file

- `src/components/tabs/SettingsTab/components/StatsBarSettingsTab.jsx`

### Test

1. Settings → Status & Greetings → StatsBar → toggle **off**
2. Back to main settings → row shows **"Inactive"**
3. Reload the card → still "Inactive"
4. Toggle back on → row updates live and survives reload

---

## Version 1.1.1227 - 2026-04-19

**Title:** StatsBar: shared glass background + narrower on desktop
**Hero:** none
**Tags:** Design, Layout

### 🫧 Same background as the expanded panel

The StatsBar had its own hard-coded glass look (`rgba(255, 255, 255, 0.08)` + local `backdrop-filter`), ignoring the user's background settings (blur / saturation / brightness / contrast / grayscale) that already drive the expanded panel via the `.glass-panel` class.

Now the StatsBar opts into the same class and inherits those settings automatically. Inline glass-look styles removed:

```jsx
<motion.div
  className="stats-bar stats-bar-pill glass-panel"
  // no more background / backdrop-filter / border inline
/>
```

A dedicated CSS rule keeps the pill shape (overrides the default 35 px radius from `.glass-panel`):

```css
.stats-bar-pill.glass-panel {
  border-radius: 999px !important;
}
```

### 📐 Narrower on desktop (~20 % off)

On desktop the wrapper around the StatsBar is now `width: 80%` / `max-width: 800px`, centered:

```jsx
style={{
  width: isMobile ? '100%' : '80%',
  maxWidth: isMobile ? '100%' : '800px',
  margin: isMobile ? '0 0 12px 0' : '0 auto 12px',
}}
```

Mobile keeps full width (nothing to spare).

### Changed files

- `src/components/StatsBar.jsx` – class swap + wrapper sizing
- `src/components/SearchField/SearchField.css` – new `.stats-bar-pill.glass-panel` rule for pill radius

### Test

1. Desktop → StatsBar visible, narrower than before and centered, same glass as the expanded panel beneath it
2. Settings → Appearance → Background Blur / Saturation / etc. → changes now affect the StatsBar as well
3. Mobile → StatsBar still spans the full width

---

## Version 1.1.1226 - 2026-04-19

**Title:** DetailView desktop top offset 47 → 54 px
**Hero:** none
**Tags:** Layout

### ↕️ More breathing room below the StatsBar

After the StatsBar pill redesign in v1.1.1224 the pill is a few pixels taller than before. The DetailView top offset on desktop was still computed with the old value (47 px), so the DetailView started slightly too close underneath the pill.

### Fix

`DetailViewWrapper.jsx` – `statsBarHeight` bumped from **47 → 54 px** on desktop. Mobile stays at 45 (unchanged, pill layout there is different).

```js
const statsBarHeight = statsBarEnabled ? (isMobile ? 45 : 54) : 0;
```

### Changed file

- `src/components/SearchField/components/DetailViewWrapper.jsx`

### Test

Desktop + StatsBar enabled → open any device → DetailView starts with clean gap below the pill, no visual collision.

---

## Version 1.1.1225 - 2026-04-19

**Title:** DetailView covers StatsBar on desktop (bottom gap fixed)
**Hero:** none
**Tags:** Bug Fix, Layout

### 🐛 Sliver of panel peeking out below the DetailView

On desktop, opening a device card left a dark rounded sliver at the bottom of the screen — the device grid behind the DetailView was not fully hidden. Mobile was fine.

### Root cause

`.detail-panel-wrapper` in `SearchField.css` had a hard-coded `height: 672px` and `top: 0`. That matches the panel alone, but not the whole stack on desktop: the StatsBar wrapper adds ~41 px + `margin-bottom: 12 px` above the search-panel. The main container is therefore ~725 px tall while the DetailView stays 672 px — the missing ~53 px at the bottom were the visible sliver.

### Fix

`.detail-panel-wrapper` now pins to all four edges instead of specifying a fixed height:

```css
.detail-panel-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;       /* NEW */
  min-height: 672px; /* fallback if parent is ever smaller */
  z-index: 10;
  pointer-events: auto;
}
```

### Changed file

- `src/components/SearchField/SearchField.css`

### Test

1. Desktop viewport, StatsBar enabled
2. Click any device card → DetailView opens and covers the entire card-root height, no sliver of the grid visible at the bottom
3. Mobile view unchanged (was already fine)

---

## Version 1.1.1224 - 2026-04-19

**Title:** StatsBar redesign: single continuous glass pill
**Hero:** none
**Tags:** Design, UX

### 🫧 One pill instead of many

Until now the StatsBar was a flex row of separate widget pills — each widget (weather, grid, time, notifications, …) had its own glass background + border radius. From a distance it looked like a bar of fragments.

New design, per mockup: the **whole StatsBar is one continuous pill**. Widgets sit inside without individual backgrounds, separated only by a consistent 12 / 16 px gap.

### What changed visually

- Outer container: `background: rgba(255, 255, 255, 0.08)` + `backdrop-filter: blur(20px)` + 1 px border + `border-radius: 999px` (full pill)
- Horizontal padding on the container (6 / 16 px), internal gap between widgets
- Every widget lost its own `background` / `border-radius` / `padding` — just icon + value inline
- Notifications button: red bubble gone from the outer shape, the counter badge itself stays red as an accent
- Subtle box-shadow under the pill

### Caveat

The StatsBar container now has its own `backdrop-filter`. There are no `.glass-panel` children inside, so the stacking-context lesson from v1.1.1198/1199 doesn't apply here. During the initial `opacity: 0 → 1` fade the blur may briefly render flat – acceptable, reverts after 400 ms.

### Changed file

- `src/components/StatsBar.jsx` – container style + all widget inline styles

### Test

1. Reload → StatsBar is a single rounded pill across the top
2. Widgets (weather / grid / time / notifications / etc.) are flush inside, no visible separators
3. Notifications: red counter badge intact and tappable
4. StatsBar settings (toggle individual widgets on/off) still work

---

## Version 1.1.1223 - 2026-04-19

**Title:** Mobile auto-expand: panel starts at top (y=0) like a click-expand
**Hero:** none
**Tags:** Bug Fix, UX, Mobile

### 🔁 Reverses v1.1.1222

In v1.1.1222 the auto-expanded panel on mobile was pushed down to `y=120` to match the desktop reference. Wrong direction — what the user actually wants is the **opposite**: the panel should sit flush at the top (`y=0`), exactly like after a normal click-expand (which sets `position='top'`).

### Fix

Instead of patching the `y` math, just initialise `position` correctly. If the mobile auto-expand setting is on and we're mounting on a mobile viewport, `position` starts as `'top'` (not `'centered'`). That cascades through the existing animation logic: `y=0`, floating box-shadow, no center-gap.

```js
const [position, setPosition] = useState(() => {
  if (window.innerWidth <= 768) {
    const parsed = JSON.parse(localStorage.getItem('systemSettings') || '{}');
    if (parsed?.mobile?.panelExpandedByDefault === true) return 'top';
  }
  return 'centered';
});
```

The `y` expression is reverted to the original simple form.

### Changed file

- `src/components/SearchField.jsx` – initial `position` reads the setting; `y` math reverted

### Test

1. Settings → General → Mobile → *Auto-open search panel* → **On**
2. Reload on narrow viewport → panel expanded, sitting at the top of the screen (no centered gap)
3. Settings → Off → reload → panel collapsed & centered as before

---

## Version 1.1.1222 - 2026-04-19

**Title:** Mobile auto-expand: proper top spacing
**Hero:** none
**Tags:** Bug Fix, UX, Mobile

### 🪟 Auto-expanded panel now has the same top gap as desktop

After enabling *Auto-open search panel* on mobile, the panel opened glued to the top of the screen — only 60 px gap to the HA header, while on desktop the expanded panel has a comfortable 120 px gap. Felt cramped.

### Fix

The `y` offset on `.search-panel` is computed from `position` (`centered` | `top`) and `isMobile`. For `position === 'centered'` it was 60 px on mobile vs 120 px on desktop. New rule: if the panel is **expanded and still centered** (i.e. auto-expanded on mount, not user-clicked which would also move `position` to `'top'`), use 120 px on both mobile and desktop.

```js
y: hasAppeared
  ? (position === 'centered'
      ? (isExpanded ? 120 : (isMobile ? 60 : 120))
      : 0)
  : 0
```

Collapsed state and normal click-expand flow are unchanged.

### Changed file

- `src/components/SearchField.jsx` (both animated.y spots)

### Test

1. Settings → General → Mobile → *Auto-open search panel* → On
2. Reload on a narrow viewport → panel starts with **120 px top gap**, visually matching the desktop reference
3. Turn toggle off, reload → collapsed panel still uses the original 60 px gap

---

## Version 1.1.1221 - 2026-04-19

**Title:** Mobile: auto-open search panel on start
**Hero:** none
**Tags:** Feature, UX, Mobile

### 📱 New setting: search panel starts already expanded on mobile

By default the search panel opens in its collapsed shape (the search bar) and only expands when the user taps it. On mobile this extra tap is often unwanted — people land on the dashboard and want to see the full panel right away.

New toggle in **Settings → General → Mobile → Auto-open search panel**. When enabled and the device is in mobile layout (`window.innerWidth ≤ 768`), the panel starts expanded directly after the splash.

### How it works

- Setting lives under `localStorage.systemSettings.mobile.panelExpandedByDefault`
- Read at mount time in `useSearchFieldState` so the very first render is already expanded – no flash or layout jump
- Desktop is never affected (check gated on `window.innerWidth ≤ 768`)
- Default: **off** (existing users see no change)

### Changed files

- `src/components/SearchField/hooks/useSearchFieldState.js` – initial values for `isExpanded`, `isMobile`, `isExpandedRef` now read from window + localStorage
- `src/components/tabs/SettingsTab/components/GeneralSettingsTab.jsx` – new "Mobile" section with the toggle, plus load/save helpers for the `mobile` settings branch

### Test

1. Settings → General → **Mobile → Auto-open search panel** → **On**
2. Reload the card on a narrow viewport (phone or `innerWidth ≤ 768`)
3. After splash the panel should be **expanded** immediately (672 px height, category list visible)
4. Turn the toggle off again → next reload starts collapsed as before
5. Desktop viewport: toggle state does not matter, panel always starts collapsed

---

## Version 1.1.1220 - 2026-04-19

**Title:** DetailView header + stat items now update in real time
**Hero:** none
**Tags:** Bug Fix

### 🐛 "100% brightness" + "Off" shown simultaneously

In the DetailView the header area with quick stats (brightness %, state label "On" / "Off") and the tab navigation could show a stale state while the actual HA state had long changed. Example: light turned off → stat bar still shows "100% brightness" and "Off" at the same time.

### Root cause

`DetailView.jsx` has two representations of the entity:

- **`item`**: the static prop handed over on device click – stays unchanged for as long as the DetailView is open
- **`liveItem`** (via `useMemo` + `useEntities`): the live state from the DataProvider, refreshed on every `state_changed` event

All control tabs (UniversalControlsTab, HistoryTab, ScheduleTab) already used `liveItem`. But **four** places still pointed at the static `item`:

1. `<DetailHeader item={item} ... />` – title / icon
2. `<EntityIconDisplay item={item} ... />` – **quick stats** incl. brightness + state label
3. `<TabNavigation stateText={... getStateText(item, lang)} stateDuration={... getStateDuration(item, lang)} item={item} ... />` – tab header with state display
4. `<ContextTab item={item} ... />` – actions list

### Fix

Switched all four to `liveItem`. Header, stats and tab state now refresh automatically on every state_changed event (triggered by the Map<entity_id → new_state> rAF-batch updates in the DataProvider).

### Changed file

- `src/components/DetailView.jsx`

### Test

1. Open a light (DetailView)
2. Toggle it via the dashboard or controls
3. Header area: "100% brightness" / "On" switches **immediately** to "Off" – no contradiction anymore
4. Change brightness → percent stat updates live

### ⚠️ Convention change from now on

All future changelog entries will be written in **English only**.

---

## Version 1.1.1219 - 2026-04-19

**Title:** Echter Fix: PowerToggle feuerte doppelt (Preact `<label>`+`<input>`-Bug)
**Hero:** none
**Tags:** Bug Fix, Root-Cause

### 🎯 Quelle gefunden – nicht nur Toast, sondern der ganze Service-Call doppelt

Die Diagnose-Logs aus v1.1.1218 haben gezeigt:
```
[DetailViewWrapper] handleServiceCall light turn_on light.wohnzimmer_einbauleuchten
[DetailViewWrapper] handleServiceCall light turn_on light.wohnzimmer_einbauleuchten
```

**Zweimal** pro Click. Beide aus dem gleichen Stack: `handlePowerToggle → onChange`.

### Root Cause

Der `PowerToggle`-Component in `src/components/controls/PowerToggle.jsx` nutzt das Standard-Pattern:

```jsx
<label>
  <input type="checkbox" onChange={onChange} />
  <span className="power-slider">...</span>
</label>
```

**Problem:** Preact im Compat-Mode propagiert den Click auf dem `<label>` sowohl als `change`-Event auf dem `<input>` **als auch** triggert er eine zweite `change`-Dispatch durch Label-Redirect. In manchen Setups (konkret hier) feuert `onChange` zweimal.

Das war kein Toast-Bug – **der Service-Call ging doppelt an HA raus**. Auch wenn `turn_on` idempotent ist: unnötige Last, und bei `toggle`-Services wäre es ein echter Fehler gewesen.

### Fix

150 ms Dedupe im `CircularSlider.handlePowerToggle`-Wrapper:

```js
const lastPowerToggleRef = useRef(0);
const handlePowerToggle = (e) => {
  const now = Date.now();
  if (now - lastPowerToggleRef.current < 150) return;
  lastPowerToggleRef.current = now;
  powerToggleHandler(e, ...);
};
```

Das hält echte User-Interaktionen (> 150 ms zwischen Clicks) durch, blockt aber die Event-Duplikate aus dem Preact-Compat-Bug (< 5 ms Abstand).

### Weitere Änderungen

- **Toast-Dedupe bleibt** (aus v1.1.1218) als Defense-in-Depth – falls doch mal wieder ein Doppel-Trigger woanders entsteht
- **Diagnose-Logs aus `DetailViewWrapper`** entfernt (Quelle gefunden)
- Toast-Dedupe-Log von `console.warn` zurück auf silent – kein Bedarf mehr für Prod-Logs

### Modifizierte Dateien

- `src/components/controls/CircularSlider.jsx` – Dedupe-Wrapper + Ref
- `src/components/SearchField/components/DetailViewWrapper.jsx` – Diagnose-Log raus
- `src/utils/toastNotification.js` – Dedupe-Log silent

### Test

1. Licht ein-/ausschalten → **ein** Toast, **ein** Service-Call im HA-Log
2. HA Developer Tools → Log prüfen: kein doppeltes `service_called` für `light.turn_on`

---

## Version 1.1.1218 - 2026-04-19

**Title:** Toast-Dedupe – Doppelter Toast unterdrückt, Diagnose-Logs aktiv
**Hero:** none
**Tags:** Bug Fix, Diagnostic

### 🐛 Doppelter Toast trotz v1.1.1217-Fix

Der Duplikat-Toast kam **nicht** aus `DataProvider.callService` (war schon entfernt). Quelle immer noch unklar – mein Audit fand keinen zweiten Trigger im statischen Code, aber der Toast feuert trotzdem zweimal.

### Zwei-Schichten-Fix

**1. Dedupe-Buffer in `showToast`**

Identische Toasts (`type:message`-Key) innerhalb **500 ms** werden unterdrückt:

```js
const _toastDedupeBuffer = new Map();
const TOAST_DEDUPE_MS = 500;
```

Das ist robust gegen jede Quelle von Doppel-Triggern – egal ob:
- Zwei DetailViewWrapper-Instanzen (z. B. durch AnimatePresence-Glitch)
- Touch + Click Event auf Mobile
- Zwei Card-Mounts im HA-Edit-Mode
- Sonst irgendein Race

**2. Diagnose-Logs (bleiben in Prod)**

`console.warn` (wird nicht von Terser entfernt) in:
- `showToast` → loggt `[Toast] deduped identical toast within Xms` wenn Dedupe greift
- `DetailViewWrapper.handleServiceCall` → loggt `[DetailViewWrapper] handleServiceCall <domain> <service> <entity>`

### So findest du die Quelle im Browser

1. DevTools → Console öffnen
2. Licht schalten
3. Zählen:
   - **`[DetailViewWrapper] handleServiceCall`** zweimal? → Handler selbst wird doppelt aufgerufen (Click-Duplizierung)
   - Einmal + **`[Toast] deduped`** → irgendwo feuert ein zweiter `showToast` direkt (nicht über handleServiceCall)

Mit der Log-Info kann der nächste Patch chirurgisch sein.

### Modifizierte Dateien

- `src/utils/toastNotification.js` – Dedupe-Buffer
- `src/components/SearchField/components/DetailViewWrapper.jsx` – Diagnose-Log

### Test

Licht schalten → **ein** Toast. Console öffnen → Log-Messages melden falls Dedupe greift oder Handler doppelt ruft.

---

## Version 1.1.1217 - 2026-04-19

**Title:** Fix: Doppelter Toast bei Licht-Toggle
**Hero:** none
**Tags:** Bug Fix

### 🐛 Zwei identische Toasts bei jeder Aktion

Nach v1.1.1216 feuerten zwei Toasts mit identischem Text (z. B. `light.turn_on: light.xyz`) bei jedem Licht-Toggle.

**Ursache:** Zwei Gates produzierten den exakt selben Text:
1. `DetailViewWrapper.handleServiceCall` (v1.1.1216 Fix – tatsächlich genutzt)
2. `DataProvider.callService` (v1.1.1215 Fix – Code-Pfad, der nirgends im UI explizit konsumiert wird, aber aktiv war)

Obwohl Code-Analyse nahelegte, dass `DataProvider.callService` nicht im UI-Pfad hängt, feuerte sein Toast-Gate offenbar doch – wahrscheinlich über indirekten Kontext-Zugriff.

**Fix:** Toast-Code aus `DataProvider.callService` entfernt. Einziger aktiver Toast-Gate bleibt `DetailViewWrapper.handleServiceCall`. `showSuccessToast` + `showErrorToast` Imports aus DataProvider gekickt (Bundle-Diät).

### Modifizierte Datei

- `src/providers/DataProvider.jsx`

### Verbleibende Toast-Quellen (einmal pro Event)

| Pfad | Events |
|---|---|
| `DetailViewWrapper.handleServiceCall` | actionSuccess / actionError |
| `DataProvider.refreshNotifications` | haPersistent |
| `DataProvider.toggleFavorite` | favoriteChange |
| `ContextTab.executeAction` | scenesScripts |
| `scheduleUtils` (create/update/delete) | scheduleChange |

### Test

1. Settings → Toasts → „Aktion erfolgreich" an
2. Licht schalten → **ein** Toast
3. „Aktion fehlgeschlagen" an, HA-Verbindung kappen → **ein** Toast

---

## Version 1.1.1216 - 2026-04-19

**Title:** Fix: Toast-Gate auf tatsächlich genutzten Service-Call-Pfad gelegt
**Hero:** none
**Tags:** Bug Fix

### 🐛 Toast kam bei Licht-Toggle nicht

**Symptom:** Nach v1.1.1215 „Aktion erfolgreich" aktiviert → Licht über UI eingeschaltet → **kein Toast**.

**Ursache:** Card hat zwei parallele Service-Call-Wege:
- `DataProvider.callService` — hat seit v1.1.1215 den Toast-Gate
- `callHAService(hass, ...)` direkt aus `utils/homeAssistantService.js` — **wird tatsächlich** für alle UI-Aktionen genutzt, hatte aber keinen Toast-Gate

Der `DataProvider.callService`-Weg wird nirgends im UI aufgerufen, obwohl der Code existiert. Alle tatsächlichen Licht/Schalter-Toggles laufen über `DetailViewWrapper.handleServiceCall` → `callHAService`.

**Fix:** Toast-Gate zusätzlich in `DetailViewWrapper.handleServiceCall` eingebaut. Ruft `shouldShowToastFor('actionSuccess')` / `actionError` nach erfolgreichem/fehlgeschlagenem Service-Call.

### Modifizierte Datei

- `src/components/SearchField/components/DetailViewWrapper.jsx`

### Langfristig (nicht in diesem Release)

Die zwei parallelen Call-Wege sollten zusammengelegt werden – entweder alle auf `DataProvider.callService` migriert (um Pending-Tracker-Puls + Toast aus einer Quelle zu bekommen), oder `callHAService` als einziger Pfad bleibt. Aktuell doppelt nicht schlimm, aber unnötig.

### Test

1. Settings → Allgemein → Toasts → „Aktion erfolgreich" aktivieren
2. Licht ein-/ausschalten → **Toast erscheint**
3. Settings → „Aktion fehlgeschlagen" aktivieren, HA-Verbindung kappen → Click auf Licht → **Error-Toast**

---

## Version 1.1.1215 - 2026-04-19

**Title:** Toast-Einstellungen – neue Section „Toasts"
**Hero:** none
**Tags:** Feature, UX

### 🍞 In-App-Toasts jetzt konfigurierbar

Neue Section **„Toasts"** in Settings → Allgemein (nach „Status & Begrüßung" und „Vorschläge"). Klick öffnet eine Detailseite mit vollen Kontrollmöglichkeiten darüber, wann Toasts erscheinen und wie sie aussehen.

### Konfigurierbare Event-Typen

| Event | Default | Beschreibung |
|---|:---:|---|
| HA-Benachrichtigungen | ✅ | `persistent_notification.*` aus HA (seit v1.1.1213) |
| Szenen / Skripte | ✅ | Beim Ausführen im ContextTab |
| Aktion erfolgreich | ❌ | z. B. Licht an, Thermostat geändert |
| Aktion fehlgeschlagen | ✅ | Fehler beim Service-Call |
| Favoriten-Änderung | ❌ | Favorit hinzugefügt/entfernt |
| Timer / Schedule | ❌ | Create / Update / Delete |

### Darstellung

- **Position**: Oben mittig (Default), Oben rechts, Unten mittig, Unten rechts
- **Dauer**: Kurz (2 s), **Mittel (3 s — Default)**, Lang (5 s)
- **Master-Toggle**: schaltet global alle Toasts aus
- **Test-Button** zeigt einen Probe-Toast mit den aktuellen Einstellungen
- **Standard-Button** setzt alles auf Defaults zurück

### Persistenz

Alles in `localStorage.systemSettings.toasts`:
```json
{
  "enabled": true,
  "events": { "haPersistent": true, "actionError": true, ... },
  "display": { "position": "top-center", "duration": "medium" }
}
```

### Neue / geänderte Dateien

- **Neu:** `src/utils/toastSettings.js` – Defaults, Reader, `shouldShowToastFor(eventKey)`, `getToastDisplayOptions()`, `saveToastSettings()`
- **Neu:** `src/components/tabs/SettingsTab/components/ToastSettingsTab.jsx` – Detailseite
- `src/components/tabs/SettingsTab/components/GeneralSettingsTab.jsx` – neue Section + Subview-Routing
- `src/providers/DataProvider.jsx` – Toast-Gates für HA-Persistent, Service-Call-Success/-Error, Favoriten-Änderung
- `src/components/tabs/ContextTab.jsx` – Szenen/Skripte/Automation-Toasts gated
- `src/utils/scheduleUtils.js` – Create/Update/Delete-Toasts gated

### Testablauf

1. Settings → Allgemein → **Toasts** öffnen
2. „Aktion erfolgreich" aktivieren → **Licht einschalten** → Toast erscheint
3. Position auf „Unten rechts" ändern → **Test-Toast** → kommt unten rechts
4. Master aus → kein Toast erscheint bei nichts mehr

### Wie weiter

Regelbasierte Notifications („Klima zu lange an" etc.) → separate Phase, mit HA-Automations als Backend. Nicht in diesem Release.

---

## Version 1.1.1214 - 2026-04-19

**Title:** Hotfix: Mount-Error „Cannot access 'O' before initialization"
**Hero:** none
**Tags:** Bug Fix

### 🐛 TDZ-Fehler nach v1.1.1213 gefixt

**Symptom:** Nach dem Notifications-Release warf die Card beim Mount:
```
Error mounting Fast Search Card: Cannot access 'O' before initialization
```

**Ursache:** In `DataProvider.jsx` wurde `refreshNotifications` (ein `useCallback`) im Dependency-Array zweier `useEffect`-Hooks referenziert:

```js
useEffect(() => { ... refreshNotifications() }, [hass, refreshNotifications]);
```

Dependency-Arrays werden **beim Render** evaluiert. Der `useCallback`-Definition stand aber **weiter unten** im Component-Body. Bei minifiziertem Bundle (Variable = `O`) führt das zum TDZ-Fehler (`const` in Temporal Dead Zone).

**Fix:** `refreshNotifications` + `dismissNotification` im DataProvider **nach oben** verschoben, direkt unter die Refs und damit vor alle useEffects, die sie nutzen.

### Modifizierte Datei

- `src/providers/DataProvider.jsx`

### Keine Feature-Änderung

Das Notifications-System funktioniert wie in v1.1.1213 – Widget, Panel, Toast, Dismiss. Nur die Deklarations-Reihenfolge wurde geändert.

---

## Version 1.1.1213 - 2026-04-19

**Title:** Notifications-System – HA persistent_notification angebunden
**Hero:** none
**Tags:** Feature, UX

### 🔔 Echte Benachrichtigungen in der Card

Nach dem Aufräumen der alten UI-Leichen in v1.1.1210 ist das Notifications-Widget jetzt **funktional** – mit HA `persistent_notification.*` als Quelle. Dazu ein aufklappbares Panel zum Lesen und Abhaken einzelner Einträge, plus Toast bei neuen Notifications.

### Was passiert

**1. Daten-Anbindung (DataProvider)**
- Neuer State `notifications`: Liste aller aktiven `persistent_notification.*`-Entities
- Extractor liest aus `hass.states` und normalisiert zu `{ notification_id, title, message, created_at }`
- `state_changed`-Events für `persistent_notification.*` triggern ein Re-Scan
- **Toast-Diff**: bei wirklich neuen Notifications (nicht initial) erscheint ein Info-Toast mit Titel/Message

**2. StatsBar-Widget (wieder zurück, diesmal mit Sinn)**
- Glocken-Icon + Zähler-Badge – erscheint nur wenn Count > 0
- **Klickbar** → öffnet Panel direkt darunter
- Settings-Toggle in StatsBar-Settings: „Benachrichtigungen (mit Zähler)" zeigt/versteckt Widget

**3. NotificationsPanel (neu)**
- Glass-Popover rechts vom Widget, max 60vh scrollbar
- Pro Eintrag: Titel (fett), Message, relative Zeit („vor 5 Min")
- `×`-Button pro Zeile → ruft `persistent_notification.dismiss`
- Outside-Click schließt Panel
- Leerer Zustand: „Keine Benachrichtigungen"

**4. Neuer Hook**
- `useNotifications()` → `{ notifications, count, dismiss }`

### Modifizierte / neue Dateien

- **Neu:** `src/components/NotificationsPanel.jsx`
- `src/providers/DataProvider.jsx` – State, Extractor, Dismiss, Hook-Export, Toast-Diff
- `src/components/StatsBar.jsx` – Widget wieder drin, Button+Panel, `useNotifications` eingebunden, `NotificationIcon` re-importiert
- `src/components/tabs/SettingsTab/components/StatsBarSettingsTab.jsx` – Widget-Toggle zurück, `NotificationIcon` re-importiert, `notifications` in Widget-Defaults
- Translations-Keys `notificationsWidget*` wieder verwendet (waren in 10 Sprachen erhalten geblieben)

### Was nicht (bewusst)

- **Outgoing-Notifications** (`notify.mobile_app_*` Service-Calls für Push ans Handy) – separate Richtung, später bei konkretem Use-Case
- **Sound / Vibration** – keine Browser-Permission-Anfrage
- **Persistence über Card-Reload** – Dismissed-State kommt direkt aus HA, kein eigener State

### Test

1. In HA eine persistent_notification erzeugen (Developer Tools → Services → `persistent_notification.create` mit `title: "Test"`, `message: "Hallo"`)
2. Card aktualisiert sich sofort → Widget oben mit Badge „1" + Toast erscheint
3. Klick aufs Widget → Panel öffnet sich, zeigt den Eintrag
4. Klick auf `×` → dismissed, Panel-Eintrag + Badge verschwinden

---

## Version 1.1.1212 - 2026-04-19

**Title:** Versionsverlauf-Cache von 1 h auf 5 Min reduziert
**Hero:** none
**Tags:** UX

### ⏱️ Neue Releases schneller sichtbar

Der App-interne Cache für den Changelog hing bisher auf 60 Minuten. Das hieß: Nach einem neuen Release musste man bis zu einer Stunde warten oder manuell den „Aktualisieren"-Button drücken, um den neuen Eintrag zu sehen.

**Neu:** Cache-TTL = **5 Minuten**. GitHub-raw + HACS-CDN cachen eh server-seitig, darum ist's kein Performance-Risk.

### Modifizierte Datei

- `src/system-entities/entities/versionsverlauf/index.js` – Konstante `ONE_HOUR` → `FIVE_MINUTES`

---

## Version 1.1.1211 - 2026-04-19

**Title:** Bug-Fix: System-Entities fehlen beim ersten Load (Race-Condition)
**Hero:** none
**Tags:** Bug Fix

### 🐛 System-Entities verschwinden bis man Ausschlussmuster modifiziert

**Symptom:** Beim Öffnen der Card sind News, Todos, Versionsverlauf, Weather, Printer3D, AllSchedules in der Kategorie „Benutzerdefiniert" teilweise nicht sichtbar. Erst nach einer Pattern-Änderung in Settings → Privatsphäre erscheinen sie alle.

**Root Cause — Race-Condition zwischen zwei Entity-Loads beim Init:**

Im `DataProvider` gibt es zwei parallele Trigger für `loadEntitiesFromHA()`:

1. **useEffect „hass-Retry"**: wird sofort aktiv wenn `hass.connection` verfügbar ist
2. **`initializeDataProvider`**: ruft `await systemRegistry.initialize(...)` auf, dann `loadBackgroundData()` → `loadEntitiesFromHA()`

Wenn Pfad 1 **vor** Pfad 2's Registry-Init fertig ist, läuft `loadEntitiesFromHA()` mit einer noch nicht initialisierten Registry. In diesem Fall fällt `getSystemEntities()` in [initialization.js:10](src/system-entities/initialization.js:10) auf einen 2-Entity-Fallback zurück (nur Settings + PluginStore). Alle anderen System-Entities fehlen bis zu einem späteren Re-Load.

**Der Pattern-Modifikations-Trick funktioniert**, weil `excludedPatternsChanged`-Event erneut `loadEntitiesFromHA()` triggert – dann ist die Registry längst ready.

### Fix

Zwei kleine Änderungen in [src/providers/DataProvider.jsx](src/providers/DataProvider.jsx):

1. **hass-Retry-useEffect an `isInitialized` gekoppelt**: läuft erst, wenn `initializeDataProvider` komplett durch ist (inkl. Registry-Init).
   ```js
   useEffect(() => {
     if (hass?.connection && isInitialized && !hasTriggeredInitialLoadRef.current) {
       hasTriggeredInitialLoadRef.current = true;
       loadEntitiesFromHA();
     }
   }, [hass, isInitialized]);
   ```

2. **`hasTriggeredInitialLoadRef` wird in `loadEntitiesFromHA` selbst gesetzt** (nach dem Mutex-Guard): egal wer den initialen Load triggert, der useEffect skippt nicht-erwünschte Doppel-Calls.

### Modifizierte Datei

- `src/providers/DataProvider.jsx`

### Test

1. Card neu laden
2. Kategorie „Benutzerdefiniert" öffnen
3. **Alle** System-Entities sollten sofort erscheinen: Settings, Bambu Lab, Zeitpläne Übersicht, Feeds, Todos, Versionsverlauf, etc. – **ohne** Pattern-Modifikation.

---

## Version 1.1.1210 - 2026-04-19

**Title:** Dead-Code raus – nicht-funktionale Notifications-UI entfernt
**Hero:** none
**Tags:** Refactor, Code Quality

### 🧹 Zwei UI-Leichen aufgeräumt

Beim Audit des „Notify-Systems" zeigte sich, dass zwei UI-Elemente **sichtbar und bedienbar** waren, aber **nichts** bewirkten. Beide komplett entfernt.

### 1. Push-Notifications-Toggle in Settings

**Wo war er:** Settings → Allgemein → Benachrichtigungen → Switch „Push-Benachrichtigungen"

**Warum tot:**
- State `notifications` wurde nicht aus localStorage geladen, Default hartcodiert `true`
- Setter `setNotifications()` schrieb weder in localStorage noch löste er irgendeine Action aus
- Der Wert wurde durch drei Komponenten-Ebenen durchgereicht, aber **nie gelesen**
- Kein HA-Service-Aufruf, keine Browser-Permission-Anfrage, keine Anbindung

**Bonus:** Die Section war bereits auf `display: none` gesetzt – also war sie für User *unsichtbar*, aber der React-State + Prop-Kette lief trotzdem.

**Entfernt aus:**
- `SettingsTab.jsx` – State + Setter + Prop-Weitergabe
- `GeneralSettingsTab.jsx` – Props + Section-JSX

### 2. StatsBar Notifications-Widget

**Wo war es:** StatsBar → Widget mit Glocken-Icon + Counter-Badge (wenn Count > 0)

**Warum tot:**
- `notificationCount` war in `SearchField.jsx` hartcodiert auf `0` – Kommentar sagte selbst „mock for now"
- Quelle für echten Count war nie angebunden (HA `persistent_notification.*` oder ähnlich)
- Widget hätte sich also **nie** gerendert
- Settings-Toggle „Benachrichtigungen (mit Zähler)" konnte aktiviert werden – aber ohne Quelle blieb das Widget leer

**Entfernt aus:**
- `StatsBar.jsx` – Prop, Widget-JSX, `notifications` aus widgetSettings-Defaults, `NotificationIcon`-Import
- `SearchField.jsx` – Mock-Konstante + Prop-Weitergabe
- `StatsBarSettingsTab.jsx` – Widget-Toggle-Section, `notifications` aus Default-Settings, `NotificationIcon`-Import

### Was bleibt

- **Toast-System** (`src/utils/toastNotification.js`) – aktiv, wird von ContextTab genutzt, weitere Use-Cases jederzeit möglich
- **pendingActionTracker** – internes Pub/Sub für pending Service-Calls, hat nichts mit User-Notifications zu tun
- **Translations-Keys** (`pushNotifications`, `notificationsWidget` etc.) in 10 Sprachen bleiben drin – schaden nicht, könnten später bei einem echten Notifications-Feature wiederverwendet werden
- **`NotificationIcon`** als Export in `EnergyIcons.jsx` bleibt – Terser tree-shaked ungenutzte Exports

### Bundle

- JS gzip: 360.14 → **360.64 KB** (leicht gewachsen, vermutlich Preset-Zuwachs aus v1.1.1209)
- Code-Reduktion hauptsächlich struktureller Natur: eine tote Prop-Kette, drei tote UI-Sections

### Nächste Schritte (offen)

Falls später ein echtes Notifications-Feature gewünscht ist:
- Anbindung an HA `persistent_notification.*` Domain → füllt `notificationCount`
- Widget + Toggle können aus Git-History wieder reingeholt werden
- Oder: Browser-Push via Notification API (HTTPS erforderlich)

---

## Version 1.1.1209 - 2026-04-19

**Title:** Preset „fastender" für Ausschlussmuster
**Hero:** none
**Tags:** Feature, UX

### 🧹 Neuer Schnellauswahl-Button mit 35 vorkonfigurierten Mustern

Neben den bestehenden Presets (Updates / Batterien / Signal / System-Sensoren) gibt es jetzt einen fünften Button **fastender** – eine persönliche Sammlung der Patterns, die im eigenen Setup weggefiltert werden sollen.

**Enthalten:**
- Tasmota: `sensor.tasmota*`, `switch.tasmota*`
- Temperatur-Sensoren: `*aussentemperatur*`, `*zimmertemperatur*`
- Rauchmelder-Nebenwerte: `*smoke_sensor_*_fault`, `*_test`, `*_reliability`, `*_temperature`, `*_battery_low`, `*_humidity`, `*_linkquality`
- Rollladen-Interna: `*rolllade_moving*`, `*rolllade_calibration*`, `*rolllade_motor*`, `*motor_reversal*`, `*breaker_status*`, `*calibration*`
- Light-Attribute: `*color_options*`, `*adaptive_lighting*`, `*kindersicherung*`
- Sonstiges: `time.*`, `switch.smart_garage*`, `sensor.melcloudhome*`, `binary_sensor.melcloudhome*`, `*ventil*`, `sun.sun`, `select.*`, `number.*`, `*nspanel*`, `switch.reolink*`, `switch.schedule*`, `switch.nuki*`, `*_linkquality`, `*_signal_strength`, `*frostschutz*`

**Verhalten:**
- Wie die anderen Presets: Duplikate werden übersprungen, bereits-aktive Patterns werden als `✓`-Chip (disabled) angezeigt
- Einzelne Patterns können danach manuell per `×` entfernt werden

### Modifizierte Datei

- `src/utils/excludedPatternPresets.js` – neuer Preset-Eintrag

---

## Version 1.1.1208 - 2026-04-19

**Title:** Ausschlussmuster – Quick-Add-Presets + First-Run-Seed
**Hex:** none
**Tags:** Feature, UX

### ⚡ Weniger Tipparbeit beim Einrichten der Ausschlussmuster

Das bestehende `excludedPatterns`-Feature (Settings → Privatsphäre → Ausschlussmuster) ist mächtig, aber bislang musste jedes Muster per Hand eingetippt werden. Die meisten HA-User wissen gar nicht, dass Entities wie `update.home_assistant_core_update`, `sensor.phone_battery_level` oder `sensor.zigbee_linkquality` überhaupt existieren – und filtern sie deshalb nicht weg.

Zwei neue Mechanismen:

### 1. First-Run-Seed

Beim allerersten App-Start wird `localStorage.excludedPatterns` mit einer sinnvollen Mini-Default-Liste initialisiert:

```
update.*
*_battery_level
*_linkquality
*_rssi
*_last_boot
```

Greift nur wenn der Key **noch nie** gesetzt war (`null`, nicht leeres Array). Wer die Defaults nicht will, kann sie einfach entfernen – sie werden nicht wieder gesetzt.

### 2. Quick-Add-Presets im Settings-UI

Neuer Bereich „Schnellauswahl" oberhalb des Input-Felds. Vier Kategorien:

| Button | Fügt hinzu |
|---|---|
| **Updates** | `update.*` |
| **Batterien** | `*_battery_level`, `*_battery_state`, `*_battery` |
| **Signal** | `*_rssi`, `*_linkquality`, `*_signal_strength` |
| **System-Sensoren** | `*_last_boot`, `*_last_triggered`, `*_uptime`, `*_connectivity` |

Bereits aktive Kategorien werden als `✓ Updates` angezeigt (Button deaktiviert).

Duplikate werden übersprungen, bestehende User-Patterns bleiben erhalten.

### Neue / geänderte Dateien

- `src/utils/excludedPatternPresets.js` (**neu**) – Presets + Seed-Defaults + `ensureInitialExcludedPatterns()`
- `src/index.jsx` – Seed-Call direkt nach den Style-Imports
- `src/components/tabs/SettingsTab.jsx` – neue `addPatterns(array)`-Funktion (Bulk, Duplikat-sicher, ein Event)
- `src/components/tabs/SettingsTab/components/PrivacySettingsTab.jsx` – Preset-Chips zwischen Beschreibung und Input

### Hintergrund

Vorschlag kam aus der Analyse der Predictive-Suggestions-Pipeline: ohne diese Filter landen `update.*`- oder Battery-Entities in den Cold-Start-Fallback-Listen und produzieren nutzlose Vorschläge. Die Infrastruktur (`filterExcludedEntities` im DataProvider, gesteuert über `localStorage.excludedPatterns`) war bereits da – es fehlten nur die Defaults und die UX.

---

## Version 1.1.1207 - 2026-04-19

**Title:** Vorschläge sofort sichtbar – Cold-Start-Fallback
**Hero:** none
**Tags:** Bug Fix, UX

### 🐛 Bug-Fix: „Vorschläge" erschienen bei frischem Setup nicht

**Problem:** Der Suggestions-Calculator hatte nur zwei Pfade: Pattern-basiert (braucht Klick-History) und Bootstrap (braucht `usage_count > 0`). Bei einem brandneuen Setup ohne jegliche Interaktion lieferten beide nichts → keine Suggestions → der „Vorschläge"-Chip in der Subcategory-Bar erschien gar nicht (SubcategoryBar prüft `hasSuggestions`).

**Fix:** Dritte Fallback-Stufe, **Cold-Start**, in `suggestionsCalculator.js`. Greift wenn nach Pattern+Bootstrap immer noch zu wenig Suggestions da sind.

### Wie die drei Stufen jetzt ineinandergreifen

1. **Pattern-basiert** (Confidence ≥ Threshold): echte Nutzungs-Patterns mit Decay + Same-Weekday-Boost + Consistency-Bonus + Negative-Learning-Penalty. Optimal für Power-User.
2. **Bootstrap** (Confidence 0.55 fix): Fallback auf `entity.usage_count > 0`. Greift ab dem ersten Klick.
3. **Cold-Start** (Confidence 0.4 fix, **NEU**): Top-N Entities aus Priority-Domains alphabetisch, wenn Setup brandneu.

### Cold-Start-Logik

```js
const PRIORITY_DOMAINS = ['light', 'switch', 'media_player', 'climate', 'cover', 'fan'];
```

- Filtert Entities nach diesen Domains
- Sortiert: erst nach Domain-Priorität, dann alphabetisch
- Confidence 0.4 – niedriger als Bootstrap, damit echte Patterns schnell verdrängen
- Markiert mit `suggestion_reason: 'cold_start'` + `usage_pattern.cold_start: true` (für spätere UI-Differenzierung möglich)

### Was sich dadurch nicht ändert

- **Master-Toggle** (`predictiveSuggestions = false`) schaltet weiterhin alles aus
- **Reset-Button** in Settings funktioniert weiter (löscht Patterns + usage_count → Cold-Start greift)
- **Bootstrap** bleibt unverändert

### Modifizierte Datei

- `src/utils/suggestionsCalculator.js`

---

## Version 1.1.1206 - 2026-04-19

**Title:** System-Entities Dedupe (Phase 6 Performance-Roadmap)
**Hero:** none
**Tags:** Refactor, Code Quality

### 🧹 Dedupes in System-Entities – geringe Bundle-Wirkung, echte Runtime-Verbesserung

Phase 6 der Performance-Roadmap: die fettesten System-Entity-Files auf Duplikate gescannt. Ehrliche Bilanz: **Bundle nur -0.14 KB gzip** (Terser+gzip komprimieren duplizierte SVG-Strings und Variant-Objekte ohnehin aggressiv), aber **zwei Runtime-Verbesserungen**.

### Was gemacht wurde

**1. SVG-Icons in TodosSettingsView extrahiert**

Drei Icons waren je 2× inline dupliziert:
- `PencilIcon` (Edit) – für Profile + Templates
- `TrashIcon` (Delete) – für Profile + Templates
- `PlusIcon` (Add) – für Profile + Templates

Jetzt je eine `const`-Komponente oben im File, 6 Inline-SVGs durch Komponenten ersetzt.

**2. `slideVariants` dedupliziert via `createSlideVariants()`**

Inline-Definition (~14 Zeilen) war in zwei Files:
- `TodosSettingsView.jsx`
- `TodoFormDialog.jsx`

Beide nutzen jetzt die bestehende Factory `createSlideVariants()` aus `src/utils/animations/base.js`. **Runtime-Win:** Variants wurden vorher **bei jedem Render neu erstellt** – jetzt einmal auf Modul-Level. Spart Allokation bei jedem Setting-Screen-Wechsel.

### Was bewusst NICHT gemacht wurde

- **`normalizeToKwh` vs `normalizePeriodEnergy`** in `EnergyChartsView.jsx`: sehen ähnlich aus, haben aber unterschiedliche Regeln (ein zusätzlicher Cutoff `>=10` für Statistics-API-Bug). Keine echten Duplikate – Zusammenlegen würde API komplizieren.
- **Label-Funktionen** in `TodosSettingsView` (3× ähnliches `lang === 'de' ? ... : ...`-Pattern): unterschiedliche Keys/Values, gemeinsamer Factory würde kaum was sparen.
- **`console.error`-Logs** (4 Stellen in EnergyChartsView): legitime Error-Logs für API-Failures, ~200 Bytes total. Bleibt drin.
- **`console.log`-Logs** im Bundle: werden bereits von Terser-`pure_funcs` entfernt (seit Phase 1).

### Bundle seit Baseline v1.1.1201

| | gzip JS | gzip CSS | Total |
|---|---:|---:|---:|
| Baseline (1201) | 397.0 | 22.2 | 419.2 |
| nach Phase 1 (1202) | 384.3 | 19.2 | 403.5 |
| nach Phase 3 (1203) | 371.1 | 19.2 | 390.3 |
| nach Phase 4A (1204) | 360.4 | 19.2 | 379.6 |
| nach Phase 2 (1205) | 360.3 | 19.2 | 379.5 |
| **nach Phase 6 (1206)** | **360.1** | **19.2** | **379.4** |
| **Gesamt-Einsparung** | **-36.8 KB** | **-3.0 KB** | **-39.8 KB (-9.5 %)** |

### Ehrliche Einschätzung & Stopp der Performance-Roadmap

Die letzten zwei Phasen (2 + 6) waren Qualität, nicht Shrink. Terser + gzip komprimieren Code-Duplikation gut – der Gewinn durch DRY entsteht im Source, nicht im Bundle.

**Entscheidung: Performance-Roadmap hier pausiert.** Die verbleibenden Hebel sind zu riskant für die erwartete Einsparung:
- Phase A (framer-motion LazyMotion): -15 bis -25 KB, aber 69 Files Migration
- Phase 4B (Chart.js → Chartist/frappe): -60 bis -70 KB, aber Design-Regression

**Abschluss-Bilanz** nach 5 umgesetzten Phasen:
- Bundle: 397 → 360 KB gzip (**-9.5 %**, -39.8 KB total)
- Build-Zeit: +5 s durch Terser
- Code-Qualität: 2 Files weg, 3 Icons dedupliziert, 1 Name-Clash eliminiert, 1 Runtime-Allokation weg
- Dependencies: -81 transitive (react-markdown-Stack) + 3 neue (marked, dompurify, visualizer)

**Wieder aufnehmen sobald:**
- Chrome Performance Profile von Handy vorliegt (Phase 5.1 → gezielte Runtime-Optimierungen)
- oder eine Chart-Library-Migration sich lohnt (Phase 4B)

---

## Version 1.1.1205 - 2026-04-19

**Title:** Duplikat-Audit & Merges in `src/utils/` (Phase 2 Performance-Roadmap)
**Hero:** none
**Tags:** Refactor, Code Quality

### 🧹 Qualitäts-Phase – zwei Dateien weg, ein Name-Clash weg

Phase 2 der Performance-Roadmap: bewusst Qualität, nicht Bundle-Größe. Ergebnis: **-0.1 KB gzip** (vernachlässigbar), aber cleanerer Codebase.

### Audit-Ergebnis

Von den fünf verdächtigen Paaren / Familien in `src/utils/` hatten nur drei echte Arbeit:

| Paar | Ergebnis |
|---|---|
| `domainHandlers` ↔ `domainHelpers` | split-ok, saubere Trennung |
| `deviceConfigs` ↔ `deviceHelpers` | split-ok, Configs konsumieren Helpers |
| schedule-Familie | **merged**, siehe unten |
| history-Familie | **merged**, siehe unten |
| `formatters/timeFormatters` ↔ `scheduleConstants` | **renamed**, siehe unten |

### Merge 1: `scheduleHandlers.js` → `scheduleUtils.js`

- `handleTimerCreate` + `handleScheduleCreate` (mit Format-Transformation für den nielsfaber-Scheduler) nach `scheduleUtils.js` verschoben
- `handleScheduleUpdate` + `handleScheduleDelete` ersatzlos gelöscht – **waren unbenutzt**
- `DetailView.jsx`-Import-Pfad aktualisiert
- Datei `src/utils/scheduleHandlers.js` gelöscht

### Merge 2: `historyDataProcessors.js` → `historyUtils.js`

- `generateCategoryData()` (15 LOC) nach `historyUtils.js` verschoben
- `HistoryTab.jsx` nutzt jetzt einen einzigen Import für die 4 History-Utilities
- Datei `src/utils/historyDataProcessors.js` gelöscht

### Dedupe 3: `formatTime()` Namens-Clash

`scheduleConstants.js::formatTime(hours, minutes)` und `formatters/timeFormatters.js::formatTime(timestamp, timeRange)` hatten denselben Namen, aber komplett unterschiedliche Signaturen & Zwecke. Risiko: versehentlicher Import der falschen Version.

**Fix:** `scheduleConstants.formatTime` → `formatClockTime` umbenannt. Konsument (`scheduleUtils.js`) entsprechend aktualisiert. Die Timestamp-Formatter bleiben unter `formatTime`.

### Geänderte / gelöschte Dateien

- **Gelöscht:** `src/utils/scheduleHandlers.js`, `src/utils/historyDataProcessors.js`
- **Geändert:** `src/utils/scheduleUtils.js`, `src/utils/scheduleConstants.js`, `src/utils/historyUtils.js`, `src/components/DetailView.jsx`, `src/components/tabs/HistoryTab.jsx`

### Bundle seit Baseline v1.1.1201

| | gzip JS | gzip CSS | Total |
|---|---:|---:|---:|
| Baseline (1201) | 397.0 | 22.2 | 419.2 |
| nach Phase 1 (1202) | 384.3 | 19.2 | 403.5 |
| nach Phase 3 (1203) | 371.1 | 19.2 | 390.3 |
| nach Phase 4A (1204) | 360.4 | 19.2 | 379.6 |
| **nach Phase 2 (1205)** | **360.3** | **19.2** | **379.5** |
| **Gesamt-Einsparung** | **-36.7 KB** | **-3.0 KB** | **-39.7 KB (-9.5 %)** |

### Nächste Schritte

- **Phase 6: System-Entities-Audit** (134 KB gzip unerforscht, Ziel: -10 bis -30 KB durch Duplikat/Unused-Scan in Energy/Todos/News-Views)
- Phase 5.2 (Icon-Sprite-Sheet) **verworfen**: Icons sind animierte SVGs mit SMIL (`<animate>`, individuelle Farben+Delays) – Sprite mit `<use>` würde Animationen/Farben brechen
- Phase 5.1 (Chrome Performance Profile) benötigt User-Session auf dem Handy
- Phase 4B (Chartist/frappe statt chart.js) bleibt Option, aber Design-Regression wahrscheinlich
- Phase A (framer-motion LazyMotion, ~-20 KB): 69 Files Migration, hohes Regression-Risiko

---

## Version 1.1.1204 - 2026-04-19

**Title:** Chart.js Tree-Shaking (Phase 4A Performance-Roadmap)
**Hero:** none
**Tags:** Performance, Refactor

### 📦 Chart.js /auto → explizite Registrierung

Phase 4A der Performance-Roadmap: `chart.js/auto` ersetzt durch Tree-Shaken-Import via `src/utils/chartjs/chartConfig.js`. Diese Konfigurations-Datei existierte schon, war aber nie benutzt worden – beide Chart-Consumer importierten `chart.js/auto` direkt, was alle Controller/Elements/Scales ins Bundle zog.

**Ergebnis:**
- JS gzip: **371.10 → 360.39 KB** (-10.7 KB)
- chart.js im Bundle: **100.6 → 85.2 KB** (-15.4 KB an Deps)
- Bundle-Delta kleiner als Dep-Delta, weil chart.js intern schon gut tree-shaked

**Gesamt seit Baseline v1.1.1201: -37 KB gzip (-9.3 %)**

### Ehrliche Einschätzung

Ursprüngliche Schätzung war -50 KB. Tatsächlich nur -10.7 KB. Grund: `chart.js/auto` triggert zwar Auto-Registrierung aller Chart-Typen, aber moderne Rollup-Tree-Shaking entfernt ungenutzte Chart-Controller ohnehin teilweise. Die explizite Registrierung bringt nur die letzte Meile.

### Was registriert wird (via chartConfig.js)

Nur was wir tatsächlich brauchen – Line, Bar, Area:
- Controllers: `LineController`, `BarController`
- Elements: `LineElement`, `BarElement`, `PointElement`
- Scales: `LinearScale`, `CategoryScale`, `TimeScale`
- Plugins: `Filler` (für Area), `Title`, `Tooltip`, `Legend`

### Geänderte Dateien

- `src/components/charts/ChartComponents.jsx` – Import von `chart.js/auto` auf `chartConfig`
- `src/system-entities/entities/integration/device-entities/components/EnergyChartsView.jsx` – dito
- `src/utils/chartjs/chartConfig.js` – doppelte Exports entfernt (Rollup-Error gefixt)

### Weitere Chart-Library-Migrationen bewusst verworfen

- **uPlot**: unterstützt **keine** Bar-Charts → raus (DeviceCategoriesChart + EnergyChartsView bars)
- **Chartist**: ~80 KB Einsparung möglich, aber plainer Look + Tooltips manuell nachbauen → zu viel Regression-Risiko
- **frappe-charts**: ~80 KB Einsparung möglich, aber API-Bruch + Design-Regression

### Nächste Schritte (Roadmap)

- Phase 2: Duplikat-Audit in `src/utils/`
- Phase 5.1: Chrome Performance Profile auf Handy (Runtime-Perf)

---

## Version 1.1.1203 - 2026-04-19

**Title:** react-markdown → marked + DOMPurify (Phase 3 Performance-Roadmap)
**Hero:** none
**Tags:** Performance, Refactor

### 📦 Markdown-Stack halbiert

Phase 3 der Performance-Roadmap: der komplette `react-markdown`-Stack (unified + micromark + mdast-util-* + hast-util-* + remark-rehype + property-information + …) wurde durch `marked` + `DOMPurify` ersetzt.

**Ergebnis:**
- JS gzip: **384.28 → 371.10 KB** (-13.2 KB)
- Deps-Summe: react-markdown-Stack ~45 KB weg, marked (12.4 KB) + DOMPurify (17.1 KB) dazu
- **Gesamt seit Baseline v1.1.1201: -26 KB gzip (-6.5 %)**

### Warum jetzt diese Kombi

- **marked** (~12 KB gzip): Parser `md → HTML-String`. Kein GFM, keine Tabellen gebraucht (Audit an der einzigen Usage-Stelle `VersionDetail.jsx`).
- **DOMPurify** (~17 KB gzip): Sanitize des generierten HTML. Content kommt via `fetch` von GitHub – bei kompromittiertem Repo kein XSS-Risiko.
- **Warum nicht nur marked?** Hätte ~17 KB mehr gespart, aber das Sicherheitsnetz ist hier die Zusatzkosten wert.

### Migration (exakt eine Stelle)

`src/system-entities/entities/versionsverlauf/components/VersionDetail.jsx`:

**Vorher:**
```jsx
import ReactMarkdown from 'react-markdown';
// …
<ReactMarkdown>{version.content}</ReactMarkdown>
```

**Nachher:**
```jsx
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useMemo } from 'preact/hooks';
// …
const sanitizedHTML = useMemo(() => {
  if (!version?.content) return '';
  return DOMPurify.sanitize(marked.parse(version.content));
}, [version?.content]);
// …
<div className="version-detail-content"
     dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
```

`marked.setOptions({ gfm: false, breaks: false })` — simple markdown ist genug für unseren Changelog.

### npm-Dependencies

- **Entfernt:** `react-markdown` (und damit 81 transitive Packages inkl. unified/micromark/mdast/hast/…)
- **Hinzugefügt:** `marked` + `dompurify`

### Nächste Schritte (Roadmap)

- Phase 4: chart.js → uPlot (~-80 KB gzip, größter Hebel)
- Phase 2: Duplikat-Audit in `src/utils/`
- Phase 5.1: Chrome Performance Profile für Runtime-Optimierungen

---

## Version 1.1.1202 - 2026-04-19

**Title:** Build-Hygiene – Terser + PurgeCSS (Phase 1 Performance-Roadmap)
**Hero:** none
**Tags:** Performance, Build

### 📦 Bundle-Shrink ohne Feature-Bruch

Erster Schritt der neuen Performance-Roadmap (`docs/PERFORMANCE_ROADMAP.md`): Build-Hygiene. Kein Code-Umbau, nur Konfig.

**Ergebnis:**
- JS gzip: **396.99 → 384.28 KB** (-12.7 KB, -3.2 %)
- CSS gzip: **22.17 → 19.24 KB** (-2.9 KB, -13.2 %)
- Total: **-15.6 KB gzip**

### 1. Terser statt esbuild-Minify

`vite.config.js` → `minify: 'terser'` mit `terserOptions`:
- `compress.passes: 2` (doppelter Optimierungs-Pass)
- `pure_funcs: ['console.log', 'console.debug', 'console.info']`
- `drop_debugger: true`
- `format.comments: false`

Preis: Build dauert ~5 s länger (5 → 13 s). Gewinn: ~12 KB JS-gzip.

### 2. PostCSS-Pipeline mit PurgeCSS + cssnano

Neu: `postcss.config.cjs` mit:
- `autoprefixer` (vendor prefixes)
- `purgeCSSPlugin` – entfernt ungenutzte CSS-Regeln (nur im Production-Build)
- `cssnano` – finale CSS-Minification

**PurgeCSS-Safelist großzügig:**
- `ios-*`, `fsc-*`, `v-*` (virtua), `framer-*`, `chip-*`, `card-*`, `device-*`
- `schedule-*`, `history-*`, `settings-*`, `detail-*`, `glass-*`, `backdrop-*`
- `search-*`, `greeting-*`, `stats-*`, `subcategory-*`, `action-sheet-*`
- `splash-*`, `apple-hello-*`, `energy-*`, `climate-*`, `toast-*`, `circular-*`, `slider-*`
- State-Klassen: `selected`, `active`, `pending`, `open`, `hidden`, `visible`, `loading`, etc.
- Transitions-Suffixe: `-enter`, `-exit`, `-appear`

Lieber ein paar KB weniger gespart als gebrochene UI.

### Caveat

cssnano wirft eine Warnung bei `backdrop-filter: ... saturate(calc(180% * var(--background-saturation, 1)))` – die Regel wird pass-through gelassen. Visueller Test auf HA-Wallpaper: **backdrop-filter wirkt weiter korrekt**.

### Neue / modifizierte Dateien

- `postcss.config.cjs` (neu)
- `vite.config.js` – Terser-Block + `rollup-plugin-visualizer` hinter `ANALYZE=1`
- `docs/PERFORMANCE_ROADMAP.md` (neu) – 5-Phasen-Plan, Ziel ~235 KB gzip
- `analyze-bundle.js` (temp) – Text-Report aus `dist/bundle-stats.html`

### Nächste Schritte (Roadmap)

- Phase 2: Duplikat-Audit in `src/utils/`
- Phase 3: react-markdown → marked (~-60 KB gzip)
- Phase 4: chart.js → uPlot (~-80 KB gzip)
- Ziel: Bundle ~235 KB gzip (-40 % vs. heute)

---

## Version 1.1.1201 - 2026-04-18

**Title:** Vorschläge v2 – sofort lernen, Decay, Negative Learning, Reset
**Hero:** none
**Tags:** Feature, UX

### 🧠 Predictive Suggestions – komplett überarbeitet

**1. Sofortige Vorschläge (kein minUses mehr)**
- Bisher: 2-5 Klicks nötig, bevor Device überhaupt vorgeschlagen wird → Feature lieferte in den ersten Tagen nichts
- Jetzt: schon ab dem ersten Klick möglich, plus **Bootstrap** über `entity.usage_count` wenn Pattern-Daten zu dünn sind

**2. Exponentielles Decay statt harter Cutoff**
- Jedes Pattern hat ein Decay-Gewicht: `weight = exp(-age / half_life)`
- Half-Life je nach Learning-Rate:
  - `slow`: 28 Tage (altes Verhalten zählt lang)
  - `normal`: 14 Tage (Default)
  - `fast`: 7 Tage (schnell vergessen)
- Pattern von heute: Gewicht 1. Nach Half-Life: Gewicht 0.5. Glatte Übergänge statt „ab Tag 31 = nix".

**3. Negative Learning**
- Wenn User Suggestions sieht, dann ein NICHT-vorgeschlagenes Device klickt → jedes übergangene Suggestion bekommt einen `suggestion_ignored`-Pattern
- Diese reduzieren die Confidence beim nächsten Berechnen (gewichtet, ebenfalls mit Decay)
- Schutz: nur innerhalb 10 Minuten nach Show, nur einmal pro Show-Cycle (keine Schleifen)

**4. Reset-Button in Settings**
- Unter „Einstellungen → Vorschläge → Lerndaten" jetzt Button „**Lerndaten löschen**" (rot)
- Löscht alle `USER_PATTERNS` + setzt `entity.usage_count` + `entity.last_used` auf den Ausgangszustand
- Mit Bestätigungs-Dialog + Stats-Anzeige nach dem Löschen („X Patterns + Y Nutzungszähler gelöscht")

### Neue Files

- `src/utils/clearLearningData.js` – Reset-Logik
- `src/utils/suggestionsCalculator.js` – komplett rewrite (v2)

### Modifiziert

- `DataProvider.jsx` – `lastShownSuggestionsRef` für Negative Learning, `resetLearningData` im Context
- `GeneralSettingsTab.jsx` – Reset-UI in der Suggestions-Detail-View
- Translations (de/en) – neue Keys für Reset-Section

---

## Version 1.1.1200 - 2026-04-18

**Title:** Section-Header Linie korrekt positioniert
**Hero:** none
**Tags:** Design, Bug Fix

### 📏 Linie direkt unter Titel, Abstand darunter

Vorher war `padding-bottom: 16px` auf dem Section-Titel („Anziehraum"), weshalb die Border-Linie 16px UNTER dem Text sass mit leerem Raum dazwischen.

**Jetzt:**
- `padding: 8px 0 0 0` – kompakt um den Text
- Border (`::after`) direkt am padding-box-bottom
- `margin-bottom: 16px` – Abstand zur ersten Card-Reihe kommt NACH der Linie

Visuell: Text → Linie → 16px Luft → Cards (wie gewünscht).

---

## Version 1.1.1199 - 2026-04-18

**Title:** Bug-Fix: Blur wirkt wieder (Transform raus)
**Hero:** none
**Tags:** Bug Fix

### 🐛 Noch ein Stacking-Context-Killer entfernt

Nach v1.1.1198 wirkten Blur-Änderungen immer noch nicht. Grund: der Motion-Wrapper animierte weiterhin `scale` und `y` – selbst bei `scale: 1` setzt framer-motion `transform: matrix(1,0,0,1,0,0)` als Inline-Style. Das erzeugt einen neuen Stacking-Context → `backdrop-filter` auf `.glass-panel::before` kann den HA-Wallpaper nicht mehr sehen.

**Fix:** Transform-Animation ganz raus. Nur Opacity-Fade bleibt.

**Verlorene Feinheit:** Das bouncy-soft Scale+Y mit Spring-Physik ist weg. Was bleibt:
- ✅ Opacity 0 → 1 mit 0.55s ease-in-out
- ✅ Apple-Hello-Splash-Animation davor (unverändert)
- ✅ Cross-Fade mit Splash (startet wenn Drawing fertig)

**Trade-off akzeptiert:** Sauberer Blur-Filter wichtiger als subtile Scale-Animation.

---

## Version 1.1.1198 - 2026-04-18

**Title:** Bug-Fix: Hintergrund-Settings wirken wieder
**Hero:** none
**Tags:** Bug Fix

### 🐛 Backdrop-Filter repariert

Die Regler „Deckkraft", „Weichzeichner", „Kontrast" und „Sättigung" unter Einstellungen → Hintergrund hatten keine sichtbare Wirkung mehr. Zwei Ursachen gefixt:

**1. `contain: paint` auf `.glass-panel` + `.detail-panel` entfernt** (stammte aus v1.1.1183 Tier-2-Performance)
- `contain: paint` isoliert das Element paint-seitig → `backdrop-filter` konnte den HA-Wallpaper nicht mehr sehen
- Settings wurden zwar gespeichert + CSS-Vars gesetzt, aber der Filter hatte nichts zum Filtern

**2. `filter: blur()` auf Motion-Wrapper entfernt** (stammte aus v1.1.1195 Apple-Reveal)
- `filter` erzeugt einen neuen Stacking-Context → backdrop-filter auf Kindern liest nicht mehr zum HA-Wallpaper durch
- Reveal-Animation bleibt erhalten via opacity + scale + y-translate mit Spring – nur der Blur-In-Effekt ist weg
- Visual-Unterschied ist minimal, UX fühlt sich praktisch identisch an

---

## Version 1.1.1197 - 2026-04-18

**Title:** Kategorie-Wechsel per Stichwort
**Hero:** none
**Tags:** Feature, UX

### ⚡ Schnell-Wechsel zwischen Kategorien

Bestimmte Wörter triggern jetzt **direkt einen Kategorie-Wechsel**, ohne einen Chip zu erzeugen. Damit wird die Navigation zwischen den Haupt-Kategorien deutlich schneller.

**Mapping:**

| Getippt | Wechsel zu |
|---------|-----------|
| `Gerät`, `Geräte`, `Device`, `Devices` | **Geräte** |
| `Sensor`, `Sensoren`, `Sensors` | **Sensoren** |
| `Aktion`, `Aktionen`, `Action`, `Actions` | **Aktionen** |
| `Custom`, `Benutzerdefiniert` | **Benutzerdefiniert** |

Diese Wörter tauchen im Ghost-Text auf (wie gewohnt), und beim Accept (Tab, →, Tap, Mobile Confirm) wird nur die Kategorie gewechselt – **kein Chip** erscheint.

**Priorität:** Area > Category > Domain > Device. Wer einen Raum mit dem Namen „Sensor" hat (unwahrscheinlich), bekommt den Area-Treffer zuerst.

**Exclude-Logik:** Wenn die aktuelle Kategorie bereits aktiv ist, wird ihr Synonym nicht mehr als Ghost vorgeschlagen (kein Self-Switch).

**Chip-Differenzierung:** Das generische `Sensor`/`Sensoren` triggert jetzt den Kategorie-Wechsel, nicht mehr den Fallback-Chip für generische Sensoren. Wer gezielt alle Sensoren als Chip filtern will, tippt `Fühler` oder `Messwert` – dann entsteht ein Chip „Fühler" bzw. „Messwert".

---

## Version 1.1.1196 - 2026-04-18

**Title:** Auto-Kategorie-Wechsel bei Chip-Erstellung
**Hero:** none
**Tags:** Bug Fix, UX

### 🎯 Chip und Kategorie bleiben konsistent

**Problem:** User tippt „Temperatur" in der Kategorie „Geräte" → Sensor-Chip wird korrekt erstellt, aber die Ergebnisliste bleibt leer, weil „Geräte" Sensoren ausschließt.

**Fix:** Beim Erstellen eines Domain-Chips wechselt die Hauptkategorie jetzt automatisch:

| Chip | Auto-Kategorie |
|------|----------------|
| Sensor-Chip (🟢 grün) – Temperatur, Bewegung, … | → **Sensoren** |
| Action-Chip – Automation, Szene, Skript | → **Aktionen** |
| System-Entity-Chip – Settings, Marketplace | → **Benutzerdefiniert** |
| Device-Chip (🟣 violett) – Licht, Schalter, Klima, … | → **Geräte** |

**Area-Chips** triggern keinen Kategorie-Wechsel – Räume sind orthogonal zu Kategorien.

**Implementation:**
- Neue Helper-Funktion `domainChipToCategory()` in `searchEventHandlers.js`
- `acceptSuggestion` + `handleGhostTap` rufen beim Chip-Create `setActiveCategory()` mit der passenden Kategorie
- Funktioniert bei Tab, → (ArrowRight), Tap-on-Ghost und Mobile-Confirm-Button

---

## Version 1.1.1195 - 2026-04-18

**Title:** Apple-Style UI-Reveal nach Splash
**Hero:** none
**Tags:** Design, UX

### ✨ Blur-Scale-Spring UI-Reveal

Nach der „hello"-Handschrift-Animation erscheint die UI (StatsBar + Suchleiste) jetzt in **echtem Apple-Stil**: Blur-to-Clear + Scale-Up + leichter Y-Translate, mit Spring-Physik.

**Animation:**
```
initial: { opacity: 0, scale: 0.94, y: 14, filter: 'blur(14px)' }
animate: { opacity: 1, scale: 1,   y: 0,  filter: 'blur(0px)'  }
transition:
  position/scale → spring (stiffness: 220, damping: 26, mass: 1)
  opacity        → 0.5s easeInOut-Apple
  filter (blur)  → 0.65s easeInOut-Apple
```

**Cross-Fade mit Splash:**
- Apple-Hello-Splash callbackt via `onDrawingDone` zum App-Component, sobald die Handschrift fertig gezeichnet ist
- In genau diesem Moment startet die UI-Reveal-Animation → **die UI morpht sich heraus, während die Splash fadet**
- Bei Splash-Style „Standard" oder „Aus" bleibt es beim Standard-Reveal wenn `isLoadingComplete` fires

**Gefühlt:** Wie das visionOS-Reveal oder iOS-Setup – sanft, bouncy, premium.

---

## Version 1.1.1194 - 2026-04-18

**Title:** Apple Hello Effect mit originalem macOS-Lettering
**Hero:** none
**Tags:** Design, UX, Feature

### 👋 Echtes Apple Hello aus macOS Sonoma

Splashscreen nutzt jetzt das **offizielle Apple „hello"-Lettering** aus macOS Sonoma (extrahiert und publiziert von chanhdai.com). Das ist der iconicale Handschrift-Zug, den du von jedem neuen Mac kennst.

**Technik:**
- 🎨 **Zwei SVG-Paths** (statt einem):
  - `h1` zeichnet den ersten Abstrich des „h"
  - `h2 + ello` zeichnet Hump vom h + komplettes „ello" in einem Zug
- ✍️ Der Stift wird zwischen den Paths „angehoben" (0.49s Pause) – genau wie bei echtem Schreiben
- 🎬 Framer-Motion `pathLength` 0→1 Animation, ease-in-out
- ⚡ Gesamt-Draw ~2.45s, plus 0.3s Hold, plus 0.4s Fade → **endet bei ~3.15s**, synchron zum App-Load
- 🌐 Sprach-unabhängig: „hello" ist zum universellen Apple-Symbol geworden

### 🧹 Cleanup

- Lokale Borel-Font (25 KB) wieder entfernt – nicht mehr nötig
- Alte hand-gezeichnete SVG-Paths raus
- Keine Google-Fonts-Anbindung mehr (war schon ab v1.1.1193)

### Hinweis zum Timing

Die Splash-Animation ist mit `durationScale: 0.7` auf die App-Load-Zeit (~2.5s) synchronisiert. Das Wort ist fertig geschrieben genau wenn die Suchleiste erscheint. Falls du eine andere Geschwindigkeit willst, lässt sich der Wert in `AppleHelloSplash.jsx` anpassen.

---

## Version 1.1.1193 - 2026-04-18

**Title:** Hotfix Splashscreen – Google-Font entfernt
**Hero:** none
**Tags:** Bug Fix

### 🔧 Hintergrund transparent + erste Font-Iteration

Schneller Hotfix für v1.1.1192:
- Splash-Hintergrund von dunklem Blur auf **komplett transparent** gestellt
- Google-Font „Caveat" (über @import) als Zwischenlösung ausprobiert
- Wurde in v1.1.1194 durch Apple-Original-Paths ersetzt

---

## Version 1.1.1192 - 2026-04-18

**Title:** Design-Feinschliff + Apple Hello Splashscreen
**Hero:** none
**Tags:** Design, UX, Feature

### 👋 Apple-inspirierter „hallo"-Splashscreen

Neue Splashscreen-Option mit Handschrift-Animation im Stil von Apples iPhone/Mac-Setup.

**Technik:**
- 🎨 Fünf einzelne SVG-Paths (h-a-l-l-o bzw. h-e-l-l-o)
- ✍️ Framer-Motion `pathLength` Animation – Buchstaben werden „geschrieben"
- ⏱ Gestaffelt: jeder Buchstabe startet 250 ms nach dem vorherigen, ~550 ms Draw-Zeit
- 🌐 Sprach-abhängig: Deutsch → „hallo", alle anderen → „hello"
- 🎬 Gesamte Show-Dauer ~2.5 s, dann Fade-out

### ⚙️ Splashscreen-Selector in Settings

Unter „Status & Begrüßung" neuer Eintrag:
- **Aus** – Card öffnet direkt ohne Ladebildschirm
- **Standard** – klassischer Progress-Ladebildschirm (wie bisher)
- **Apple Hello** – neue Handschrift-Animation

Klick rotiert durch die drei Optionen. Einstellung greift beim nächsten Card-Reload.

### 🌡 Sensor-Synonyme erweitert + neue Chip-Farbe

Die Suche erkennt jetzt deutlich mehr Sensor-Begriffe, unterscheidet sie farblich von Geräte-Filtern und filtert auf Basis von `device_class`:

**Neu erkannt:**
- `Temperatur`, `Luftfeuchtigkeit`, `Helligkeit`, `Lux`
- `Energie`, `Verbrauch`, `kWh`, `Strom`, `Leistung`, `Watt`
- `Batterie`, `Akku`, `Spannung`, `Druck`, `CO2`, `Feinstaub`
- `Bewegung`, `Präsenz`, `Tür`, `Fenster`, `Rauch`, `Wasserleck`

**Filtering:** Jedes Synonym filtert nicht mehr nur nach `domain`, sondern auch nach `device_class` – tippt man „Temperatur", erscheinen wirklich nur Temperatur-Sensoren, nicht alle Sensoren.

**Neue Chip-Farben:**
- 🔵 **Blau** – Area (Räume)
- 🟣 **Violett** – Gerät (Licht, Schalter, Klima, …)
- 🟢 **Grün/Teal** – Sensor (passive Messwerte)

### 🎨 Feinschliff am UI

- **Zeilen-Abstand 16 px** zwischen Card-Reihen (vorher gefühlt zu dicht)
- **Section-Header-Padding unten 16 px** (Titel + erste Card-Reihe hatten zu wenig Luft)
- **Ghost-Icon im Eingabefeld**: SVG (Haus / Diamond) statt Emoji – konsistent mit den Chips
- **Ghost-Text Case-Match**: Tippst du „bel", zeigt der Ghost „bel…", nicht „Bel…" – die Texte überlagern sich jetzt pixelgenau
- **Section-Header transparent**: kein dunkler Blur-Balken mehr über dem Inhalt

---

## Version 1.1.1191 - 2026-04-18

**Title:** Area-Sensoren im Header + Design-Feinschliff
**Hero:** none
**Tags:** Feature, UX, Design

### 🌡 Area-Sensoren im Section-Header

Wenn im Home Assistant Backend für eine Area ein Temperatur- oder Luftfeuchtigkeits-Sensor zugeordnet ist, werden die Werte jetzt direkt im Section-Header angezeigt.

**Beispiel:**
```
Anziehraum                              🌡 21.5°C   💧 48%
```

**Bausteine:**
- 📡 DataProvider exportiert komplette `areas`-Registry (mit `temperature_entity_id` + `humidity_entity_id`)
- 🗺 `areaSensorMap` in SearchField: Map<Area-Name → Sensor-Entities>
- 🎨 Iconoir-Stil SVGs (Thermometer + Droplet), stroke-basiert, passt zum Look
- 🔄 Real-time: Werte aktualisieren automatisch via rAF-Batch
- ✨ Graceful: Areas ohne konfigurierte Sensoren zeigen nur den Namen

### 🎛 Weitere Design-Feinschliffe

- **Row-Spacing**: Vertikaler Abstand zwischen Card-Reihen jetzt 6px (vorher 8px)
- **Section-Header transparent**: Kein dunkelgrauer Hintergrund + Blur mehr – Header schwebt sauber über dem Inhalt

---

## Version 1.1.1190 - 2026-04-18

**Title:** SVG-Icons statt Emojis in Chips
**Hero:** none
**Tags:** Design, UX

### 🎨 Konsistente Icons aus der Filter-Bar

Die Chip-Icons nutzen jetzt die gleichen SVGs wie die Buttons im Filter-Panel:

| Chip | Vorher | Jetzt |
|------|--------|-------|
| Area-Chip | 📍 Emoji | `AreasIcon` (Haus-Shape) |
| Domain-Chip | 💡 Emoji | `CategoriesIcon` (Diamond-Shape) |

**Vorteile:**
- 🎯 SVGs übernehmen via `stroke: currentColor` die Chip-Farbe (blau/violett/weiß)
- 🔗 Visuelle Konsistenz: User erkennt sofort „Das ist ein Räume-/Kategorien-Filter"
- ✨ Keine Emoji-Inkonsistenzen zwischen Plattformen

---

## Version 1.1.1189 - 2026-04-18

**Title:** Kritischer Bug-Fix + Chip-Platzierung
**Hero:** none
**Tags:** Bug Fix, UX

### 🐛 Scope-Filter-Bug gefixt

`filterDevices` bekam die ungescopte Geräte-Liste → Results zeigten auch Entities, die nicht zum Chip-Filter passten.

**Fix:** `filterDevices` erhält jetzt `scopedDevices` (gefiltert durch Area/Domain-Chip) statt der vollen Collection. Bei aktivem Chip enthält die Results-Liste jetzt **nur** noch passende Entities.

### 🎨 Chips wandern in die Subcategory-Bar

Chips sind **Filter-Elemente** und gehören visuell zu den Kategorien. Sie erscheinen jetzt links vor „Alle / Beleuchtung / Schalter / …":

```
[🏠 Kinderzimmer] [💎 Lampe]  |  Alle  Beleuchtung  Schalter  Klima  …
       ↑ Filter-Chips                ↑ normale Kategorien
```

**Vorteile:**
- 🧭 Sofortige visuelle Erkennung: „Das sind aktive Filter"
- 🧼 Eingabefeld bleibt sauber – reiner Text-Input
- 👁 Chips bleiben sichtbar, auch während User weiter tippt
- 🆕 Neue generische `filterChips` Prop in `SubcategoryBar` für zukünftige Filter-Typen

---

## Version 1.1.1188 - 2026-04-18

**Title:** Kombinierbare Filter-Chips (Area + Domain)
**Hero:** none
**Tags:** Feature, UX

### 🔗 Area-Chip + Domain-Chip gleichzeitig

Vorher: Nur Area wurde zu Chip, Domain fiel als Text ein (und matchte oft nichts).
Jetzt: Beide Typen werden zu Filter-Chips mit visueller Unterscheidung.

| Tippst | Ghost | Icon | Nach Tab/→ |
|--------|-------|------|------------|
| `Kin` | `derzimmer` | 📍 | `[📍 Kinderzimmer]` **blauer Chip** |
| `lam` | `Lampe` | 💡 | `[💡 Lampe]` **violetter Chip** |

**Kombinierbar:**
```
1. "Kin" → Tab  →  [📍 Kinderzimmer] |
2. "la" → Tab   →  [📍 Kinderzimmer] [💡 Lampe] |
3. Liste zeigt nur Lampen im Kinderzimmer
```

**Neue State-Struktur:**
- `areaChip: { area_id, name } | null`
- `domainChip: { domain, label } | null`
- `selectedChipId: 'area' | 'domain' | null` (iOS-Pattern für Delete)

**Smart Excludes:** Wenn Area-Chip aktiv → keine weiteren Area-Vorschläge im Ghost. Gleiches für Domain.

### 🎨 Visuelle Trennung
- 📍 Area-Chip: Blau (`rgba(66, 165, 245, ...)`)
- 💡 Domain-Chip: Violett (`rgba(192, 132, 252, ...)`)

---

## Version 1.1.1187 - 2026-04-18

**Title:** V4 Search: Chip-Input + Ghost-Fixes + Card-Cleanup
**Hero:** none
**Tags:** Feature, UX, Design

### 🎯 Google-like Suche mit Chips

Große Überarbeitung des Such-Inputs auf Basis eines neuen Mockup-Designs.

**Smart Typed Suggestions:**
- Neue Priorität in `computeSuggestion`: Area > Domain > Device
- Tippst du „Kin" → erkennt die Area „Kinderzimmer" zuerst
- Tippst du „lam" → Domain-Synonym „Lampe" → `light`
- Fällt auf Device-Name-Prefix zurück, wenn keines matched

**Area-Chip im Input:**
- Nach Tab/→ (Desktop) oder Tap auf Ghost (Mobile) wird der Area-Match zum Chip
- Card-Liste filtert automatisch auf den Chip-Scope

**Mobile-Anpassungen:**
- Chip-Touch-Target ≥ 44 pt (Apple HIG)
- iOS-Pattern zum Löschen: Tap selektiert → Tap² löscht
- Dedizierter ↵-Button rechts im Input (nur Mobile)
- Ghost mit gestrichelter Unterlinie als Tap-Hinweis

**Ghost-Icon-Prefix:**
- 📍 wenn Area-Match
- 💡 wenn Domain-Match
- Nichts bei Device-Match (damit's nicht zu voll wird)

**Keyboard-Hints (Desktop):**
- Kleine Badges `→ Tab` rechts im Input
- Nur sichtbar, wenn Ghost aktiv
- Via `@media (hover: none)` auf Touch-Geräten ausgeblendet

### 🧹 Card-Cleanup (Bonus)

Neue `stripAreaPrefix()`-Utility entfernt redundante Area-Präfixe aus Entity-Namen:

| Vorher | Nachher |
|--------|---------|
| Kinderzimmer **Licht** | **Licht** |
| Kinderzimmer **Thermostat** | **Thermostat** |
| Anziehraum **Rolllade Motor** | **Rolllade Motor** |

Da der Section-Header schon „Kinderzimmer" anzeigt, ist das Präfix in jedem Card-Namen redundant und kann weg.

**Neue Files:**
- `computeSuggestion.js` – Smart Typed Suggestion
- `SearchFieldV4.css` – Chip + Hints + Mobile-Styles
- `deviceNameHelpers.js` – Area-Präfix-Stripping

---

## Version 1.1.1186 - 2026-04-17

**Title:** Press-Feedback & Detail-Prefetch
**Hero:** none
**Tags:** UX, Feature

### 👆 Ehrliches Click-Feedback + Prefetch

Neue Interaktions-Schicht ohne De-Sync-Risiko und schnellere Detail-View-Öffnung.

**Press-Feedback (kein Optimistic UI):**
- 🎯 Pending-Action-Tracker mit Pub/Sub – nur betroffene Card rendert neu
- 💙 Subtiler blauer Shimmer-Puls während Service-Call läuft
- ⏱ Auto-Clear bei HA-Bestätigung (state_changed) oder 2.5 s Timeout
- ✅ UI-State wechselt erst bei echter Bestätigung – kein Lügen, keine De-Sync
- ♿ `prefers-reduced-motion` Fallback ohne Animation

**Detail-View-Prefetch:**
- 🖱 `onPointerEnter` (Desktop Hover) → Entity-Cache-Warmup
- 📱 `onPointerDown` (Mobile Touch-Start) → Prefetch vor Click-Registrierung
- 🔁 Idempotent – zweiter Hover macht nichts mehr
- 🚀 Detail öffnet spürbar schneller

**Neue Bausteine:**
- `pendingActionTracker.js` – Subscription-basierter Tracker
- `usePendingAction` – Hook pro Entity

---

## Version 1.1.1185 - 2026-04-17

**Title:** Gold-Paket: Bundle & Cache
**Hero:** none
**Tags:** Performance, Optimization

### 🥇 Kleine Wins, großer Effekt

Bundle-Reduktion ohne Feature-Verlust + Search-Cache für instant-Wiederholungen.

**Bundle-Optimierungen:**
- 🎯 `console.log/debug/info` als pure → Dead-Code-Elimination
- 🐛 `debugger`-Statements in Production gedroppt
- 🖼 SVG-Path-Präzisionen auf 2 Dezimalen in 48 Icons (-6.9 KB raw)
- 📉 Bundle: 397 → 390 KB gzip (-7.3 KB, -1.8 %)

**Search-Result-Cache (LRU):**
- ⚡ Gleicher Query = instant Cache-Hit (0 ms Fuse-Arbeit)
- 📦 Max. 30 Queries gecacht, ältester fliegt raus
- 🔄 Auto-Invalidation wenn Collection sich ändert
- 💡 Rapid Query-Wechsel (z. B. „licht" → „küche" → „licht") wird instant

**Skipped mit Begründung:**
- PurgeCSS übersprungen (Risiko für dynamische Template-Klassen > Nutzen)

---

## Version 1.1.1184 - 2026-04-17

**Title:** Virtualisierung mit virtua
**Hero:** none
**Tags:** Performance, Feature

### 🚀 DOM-Diät: 400 → 30 Knoten

Einführung echter Listen-Virtualisierung mit `virtua` – nur noch sichtbare Cards existieren im DOM.

**Was passiert:**
- 📜 `Virtualizer` nutzt existierenden Scroll-Container (`.results-container`)
- 🔢 Dynamischer Column-Count-Hook synchron mit CSS-Breakpoints (1–5 Spalten)
- 📐 Flat-Item-Adapter: Rooms + Devices → Header + Grid-Row Items
- 📏 `ResizeObserver` misst dynamisch `startMargin` (SubcategoryBar darüber)
- 🎬 `animatedOnce`-Set: Cards animieren nur beim ersten Mount, nicht bei Recycle
- 📌 Sticky Section-Headers im Scroll-Container

**Metriken bei 400 Entities:**
- DOM-Knoten: 400+ → ~30
- Scroll-FPS Mobile: 30-50 → 55-60
- Memory: deutlich niedriger
- Initial-Mount: schneller

**Bundle:** +6 KB gzip (virtua) – fair für den Paint-Gewinn.

---

## Version 1.1.1183 - 2026-04-17

**Title:** Tier 2 Performance
**Hero:** none
**Tags:** Performance, Optimization

### ⚙️ CPU-Disziplin im Hot-Path

Fünf Optimierungen, die zusammen einen ruhigeren Main Thread ergeben.

**rAF-Batching:**
- 🔁 State-Change-Events werden pro Frame gebündelt
- 📊 Bei 30 Sensor-Updates/s → max. 60 setEntities/s statt 30× N
- 🛡 Running-Mutex gegen parallele Loads
- 🏠 Auto-Unmark für Pending-Tracker

**IndexedDB Batch-Writes:**
- 📝 1 Transaktion für alle Entities statt N sequentielle
- ⚡ Initial-Load spürbar schneller
- 💾 Weniger Memory-Churn

**GPU-Entlastung:**
- 🎨 `contain: paint` auf `.glass-panel` + `.detail-panel`
- 🗑 No-op `backdrop-filter: blur(0px)` in `.detail-backdrop` entfernt
- 🎯 `will-change: transform` nur während Hover/Active (nicht permanent)

**Mehr Memos:**
- 🧠 `memo()` auf StatsBar, GreetingsBar, SubcategoryBar, ActionSheet

---

## Version 1.1.1182 - 2026-04-17

**Title:** Flüssig & Google-like Suche
**Hero:** none
**Tags:** Performance, UX, Search

### ⚡ Tier 1 Snappiness + Such-Überholung

Zwei große Pakete in einem Release: App fühlt sich direkter an, Suche fühlt sich wie Google an.

**Tier 1 – Snappiness (Perceived Speed):**
- ⏱ Animation-Durations global -25 % (0.3 → 0.22, 0.4 → 0.3, 0.45 → 0.34)
- 👆 `touch-action: manipulation` global → 300 ms Tap-Delay weg
- 🎯 `:active { scale(0.97) }` auf Cards/Buttons → instantes Touch-Feedback
- 🔍 Search-Debounce 150 → 50 ms (mit trailing edge)
- 🧠 memo-Comparator auf DeviceCard (state, last_updated, friendly_name, brightness, etc.)
- 👁 `content-visibility: auto` auf Device-Cards → Offscreen-Paint überspringt

**Google-like Suche:**
- 🎯 Intent-Parser: „Wohnzimmer Licht" → { area: Wohnzimmer, domain: light }
- 🌍 15 Domain-Synonym-Gruppen (DE/EN): lampe|beleuchtung → light, etc.
- 🔤 Multi-Word-Fuzzy via Fuse Extended Search (`'wort1 'wort2`)
- 🏠 Pre-Filter nach Area/Domain vor Fuse → 90 % kleiner Suchraum
- 📊 Final-Score = Fuse × 0.7 + Relevance × 0.3 + Prefix-Bonus
- 🎨 Highlighting über priorisierte Keys (friendly_name zuerst)
- ⚡ Fuse-Instanz persistent via `setCollection` statt Re-Index

**Initial-Load-Fix:**
- 🚦 Loading-Gate: keine ungefilterten Entities via state_changed während Mount
- 🔄 hass-Retry: Auto-Load sobald hass nach Mount verfügbar wird

---

## Version 1.1.1181 - 2026-04-17

**Title:** Icon-Diät für GPU
**Hero:** none
**Tags:** Performance, Animation

### 🔥 4 Icons von Endlos-Loop auf One-Shot

Gezielte Reduktion permanent laufender SVG-Animationen, um GPU-Last auf Mobile zu senken.

**Semantisch passender gemacht:**
- 🏃 **MotionSensorOn:** Einmalige Draw-Animation + Glow-Fade-in (Bewegung ist momentanes Ereignis)
- 👤 **PresenceSensorOn:** 3 Ringe gestaffelt Fade-in, dann statisch
- 📺 **TVOn:** Screen-Glow + T/V Buchstaben einmalig
- 📺 **TVOff:** Screen fadet aus, Standby-LED einmalig ein

**GPU-Bilanz:**
- Endlos-SVG-Animationen: 58 → 42 (−16, −28 %)
- Verbliebene Endlos-Loops nur noch in 11 Icons: Climate (4), Vacuum, WashingMachine, Dishwasher, AirPurifier, Fan, Siren, MusicOn – alles semantisch laufende Vorgänge

---

## Version 1.1.1180 - 2026-04-17

**Title:** Code-Refactoring & Duplikate
**Hero:** none
**Tags:** Refactoring, Cleanup

### 🧹 Code-Hygiene + Verbesserte Suche

Großes Refactoring: Duplikate raus, zentrale Utilities eingeführt, Such-Pipeline vorbereitet.

**Entfernt (Code-Diät):**
- 🗑 4 Debug-Console-Snippets im Root (−761 Zeilen)
- 🔁 slideVariants 3× dupliziert → zentrale `createSlideVariants()` Factory
- 📝 12 × localStorage load/save Boilerplate → `systemSettingsStorage.js` Utility
- 🔀 `scheduleUtils.js` hass-State-Fallback vereinheitlicht
- 🎛 `deviceConfigs.js` Switch-Case-Blöcke konsolidiert

**Neue Bausteine:**
- `systemSettingsStorage.js` – zentrale localStorage-Utility mit Dot-Path
- `searchSynonyms.js` + `searchIntent.js` – Fundament für intelligente Suche

**Ca. 800 Zeilen Duplikate entfernt.**

---

## Version 1.1.1065 - 2026-01-14

**Title:** CSS Filter-Tab Slider Fix
**Hero:** none
**Tags:** Bug Fix

### 🐛 Bug Fix: All-Schedules Filter-Tab

Behoben: Fehlende CSS-Klasse `.scheduler-filter-slider` für den animierten Filter-Tab-Slider in der All-Schedules Ansicht.

**Änderungen:**
- ✅ CSS-Klasse `tab-slider` → `scheduler-filter-slider`
- ✅ Korrekte Gradient-Animation hinzugefügt
- ✅ visionOS-Style Box-Shadow implementiert

---

## Version 1.1.1060 - 2026-01-14

**Title:** Retry Mechanismus Refactoring
**Hero:** none
**Tags:** Performance, Refactoring

### ⚡ Performance-Optimierung: Shared Retry Mechanism

Großes Refactoring des Retry-Mechanismus für System-Entities zur Verbesserung der Performance und Reduktion von Code-Duplikaten.

**Was ist neu:**
- **Singleton Pattern:** Alle Entities teilen sich eine Promise für hass-Retry
- **Code-Reduktion:** 73% weniger Code (215 → 57 Zeilen)
- **Helper Method:** `mountWithRetry()` in SystemEntity Base-Class
- **Hybrid Approach:** Utility Service + Base Class Helper

**Betroffene Components:**
- ✅ Weather Entity
- ✅ Todos Entity
- ✅ News Entity
- ✅ Integration Entity
- ✅ StatsBar Component

---

## Version 1.1.1055 - 2026-01-13

**Title:** All-Schedules System-Entity
**Hero:** none
**Tags:** Feature

### 📅 Neue System-Entity: All-Schedules

Zentrale Übersicht aller Zeitpläne und Timer im System.

**Features:**
- 📋 Liste aller Schedules über alle Geräte hinweg
- 🔍 Filter: Alle / Timer / Zeitpläne
- 🎨 Domain-Badges (Climate, Light, Cover, etc.)
- 🔗 Click-to-Navigate zu Device DetailView
- ⏰ Zeitanzeige und Wochentage

**UI:**
- Raycast-inspiriertes Design
- Animated Filter-Tabs
- visionOS Styling

---

## Version 1.1.1050 - 2026-01-12

**Title:** System-Entity Architecture
**Hero:** none
**Tags:** Architecture, Feature

### 🏗️ System-Entity Architektur

Einführung der System-Entity Architektur für native App-Features.

**Konzept:**
- System-Entities erscheinen wie normale Entities in der Suche
- Eigene Custom Views mit Tabs und Actions
- Vollständige Home Assistant Integration
- Plugin-System für Erweiterungen

**Erste System-Entities:**
- ⚙️ Settings
- 🔌 Plugin Store
- ☁️ Weather
- 📰 News
- ✅ Todos

---

## Version 1.1.0 - 2026-01-10

**Title:** visionOS Design System
**Hero:** none
**Tags:** Design, UI/UX

### 🎨 visionOS Design System

Komplettes Redesign der UI basierend auf Apple's visionOS Design Language.

**Design-Änderungen:**
- 🌈 Glasmorphism & Frosted Glass Effects
- ✨ Smooth Animations & Transitions
- 🎭 Brand Colors für jede Entity
- 📱 iOS-inspirierte Components
- 🔲 Rounded Corners & Shadows

**Performance:**
- GPU-beschleunigte Animationen
- Optimiertes Rendering
- Lazy Loading für Components

---

## Version 1.0.0 - 2025-12-01

**Title:** Initial Release
**Hero:** none
**Tags:** Release

### 🚀 Fast Search Card - Initial Release

Die erste offizielle Version der Fast Search Card.

**Core Features:**
- 🔍 Ultraschnelle Suche über alle Home Assistant Entities
- 📊 Grouping nach Domains (Light, Climate, etc.)
- 🏠 Raum-basierte Organisation
- 📱 Responsive Design
- 🎨 Anpassbare UI

**Supported Domains:**
- Light (Licht)
- Climate (Heizung/Klima)
- Cover (Rollladen)
- Switch (Schalter)
- Media Player
- Und viele mehr...

**Installation:**
\`\`\`bash
# Via HACS
1. HACS öffnen
2. "Fast Search Card" suchen
3. Installieren
\`\`\`

**Erste Schritte:**
1. Karte zu Dashboard hinzufügen
2. Entity-Filter konfigurieren
3. Fertig!

---
