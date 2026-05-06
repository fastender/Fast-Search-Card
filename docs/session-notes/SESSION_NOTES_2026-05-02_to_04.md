# Session Notes — 2026-05-02 bis 2026-05-04

**Stand am Ende:** v1.1.1376. **14 Releases über 3 Tage** (v1.1.1363 → v1.1.1376).

Schwerpunkt: **Domain-Pipeline Konsolidierung + Big-Refactor mit kritischem Regression-Bug**. Die Session begann mit Slider-Polish und endete mit einem Hotfix für mein eigenes Refactor-Disaster. Wichtigste Lehre: **Refactor ohne git-Sicht ist gefährlich** (`.gitignore` ignoriert `src/`).

**Gemerkt — die wichtigsten 3 Patterns/Lehren:**

1. **Bei Refactor ohne git-Referenz IMMER vorher die Output-Properties grep'en**. Mein v1.1.1374-Disaster war eine "inlined"-Refactor-Funktion bei der ich aus dem Gedächtnis geschrieben habe → `entity.area` Property vergessen → ALLE Devices verschwanden aus dem View. Ein simples `grep -rn "entity\\.area" src/` hätte das verhindert.
2. **Pattern-Validation auf Realität testen**, nicht nur theoretisch versprechen. v1.1.1373 versprach "5-7 LOC pro Setting". v1.1.1375 hat dies durch echte Erweiterungen (water_heater, aux_heat, tilt_position) gemessen — Pattern hielt Stand.
3. **Performance-Bugs sind oft auf der Konsumenten-Seite**: v1.1.1364 — der LiquidGlassSlider war perf-tight, aber die parent-setState im AppearanceSettingsTab triggerte 60×/sec einen kompletten Re-Render → Drag stockte. Fix nicht im Component, sondern beim Caller (RAF-Throttle setState + Debounce localStorage).

---

## 1. Release-Übersicht in 6 Blöcken

### Block A — LiquidGlass-Slider initial + Performance-Disaster + Recovery (1363-1365)

| Version | Was |
|---|---|
| **1363** | **LiquidGlassSlider** Component — 1:1 Port aus User-HTML mit Framer-Motion. Spring-Morph (scaleX 1.18, scaleY 0.92) beim Drag, SVG-Filter "mini-liquid-lens" mit feDisplacementMap, ARIA + Tastatur. Ersetzt die nativen `<input type="range">` in System.Settings (8 Slider in GeneralSettingsTab + AppearanceSettingsTab). Größe ~80% (Track 8px, Thumb 52×34) auf User-Wunsch. |
| **1364** | 🚨 **PERFORMANCE-DISASTER + Fix.** User: "es ist katastrophe; es ist nicht in echtzeit und auch nicht flüssig". 3 Layers Bugs: (1) Spring-Animation kämpfte gegen User-Pointer wegen controlled-value Echo-Race im useEffect → `draggingRef`-Gate. (2) localStorage-Write 60×/sec via `updateSystemSettingsSection` (JSON.parse+stringify ganzer Settings-Blob) blockierte Main-Thread → 200ms trailing-edge Debounce, CSS-Vars bleiben instant. (3) Parent-Re-Render der ganzen AppearanceSettingsTab auf jedem onChange → neuer `useRafThrottle`-Hook (max 1 setState/Frame). 3-Layer-Strategie: instant-CSS / RAF-throttle React / debounce Persist. |
| **1365** | Alle 5 verbleibenden nativen `<input type="range">` migriert auf LiquidGlassSlider. Neue `variant="dark"`-Prop für dunkle Device-Views (Bambu/Universal/Energy/Printer3D). UniversalEntityList NumberSliderControl mit 150ms HA-Service-Debounce + onChangeEnd-Flush. PrinterMiscList per-entity Debounce-Map (mehrere Slider parallel). |

### Block B — Integration App Big-Bang Re-Skin (1366-1367)

| Version | Was |
|---|---|
| **1366** | **Integration App komplett neu** auf iOS-Settings-Pattern. 5 Bausteine: (1) `deviceTypeRegistry` mit SVG-Icons als Single-Source-of-Truth + Coming-Soon-Types raus (oven/dishwasher/vacuum/coffee/shower → Universal deckt alle ab). (2) IntegrationView auf `ios-settings-container` + AnimatePresence-Slides, Toast-Feedback, Edit-Mode-Pipeline. (3) CategorySelectionView mit Hero + ios-section/ios-card. (4) ManagementView mit ios-navbar + Gruppierung nach Device-Type + Suche (>5 devices) + Edit-Action für editierbare Types. (5) CSS von 343 → ~140 Zeilen runtergeschrumpft. |
| **1367** | 3 Polish-Fixes nach User-Feedback: (1) CustomScrollbar war unsichtbar weil Wrapper-Div nicht display:flex/height:100% hatte → `ios-view-wrapper` Klasse. (2) Edit/Trash-Buttons hatten kein Hover-Feedback und verschwanden auf weißer Hover-Row → doppelte Hover-Pyramide mit !important Override. (3) Such-Feld blendete in ios-card → eigenes `integration-search-pill` mit dunkler bg + border-radius 18px. |

### Block C — Domain-Inventur: Climate fix + neue Domains (1368-1370)

| Version | Was |
|---|---|
| **1368** | **Climate Big-Bang-Rewrite.** ClimateSettingsPicker hatte 4 fundamentale Bugs seit Erstauslieferung: Apply-Button machte nur `console.log` (keine `hass.callService`), Picker-Optionen waren hardcoded `['Auto','1','2',...]` (statt aus `attributes.fan_modes`), State nicht ans Entity gebunden (immer "Auto" als initial), hardcoded German Service-Werte (`'Links'`/`'Rechts'` würden HA mit "unknown swing mode" rejecten). Plus: HVAC-Modi unvollständig (auto+heat_cool fehlten), kein preset_mode-Support, DOM-Manipulation per `document.getElementById`, 300+ Zeilen inline `<style>`. ALLES neu in ~290 LOC: Live-State aus `hass.states`, ios-section/ios-card Pattern, AnimatePresence Sub-Views je Setting, Auto-Commit nach 300ms Debounce, Per-Setting-Debounce-Map. |
| **1369** | **humidifier + vacuum Domains komplett neu.** Beide existierten gar nicht in deviceConfigs.js (kein getControlConfig, kein getSliderConfig, kein Picker → generic-Fallback bei direktem Open). Jetzt analog Climate-Pattern: humidifier mit Power+Mode-Buttons + Settings-Picker + Hero-Slider für Target-Humidity (water-blue, current_humidity im subValue). vacuum mit 5 Buttons (Start/Pause toggle nach state, Stop/Dock/Locate, Settings) + Hero-Battery-Donut mit State-Color (rot<20%/orange<50%/grün) + state-text als displayValue. HumidifierSettingsPicker + VacuumSettingsPicker je ~150 LOC, CSS aus ClimateSettingsPicker.css wiederverwendet. |
| **1370** | **fan-Domain bekommt Buttons.** Vorher nur getSliderConfig (Speed-Slider mit Power-Toggle), keine getControlConfig — Smart-Fans (Dyson, Vornado, Decken-Vent) hatten kein Oscillate, kein Direction, keine Preset-Modes. Jetzt: dynamische Buttons je nach Capability — Oscillate-Toggle, Direction-Toggle (forward↔reverse), bis zu 3 Preset-Buttons, FanSettingsPicker bei > 3 Presets. Plain Fan ohne extra-Features → primary:[] (nur Slider). |

### Block D — Media-Player Cover-Art + cover-Domain (1371-1372)

| Version | Was |
|---|---|
| **1371** | **media_player Big-Bang.** CircularSliderDisplay um `coverImage`-Prop (circular cropped, 60-80px) erweitert. getSliderConfig zeigt Cover-Art + Title (displayValue) + Artist (subValue) statt großer Volume-Zahl. `entity_picture` mit `window.location.origin` prefixed wenn relativ. Cover nur bei isPlaying/isPaused (kein stale Cover bei idle). getControlConfig erweitert: Shuffle-Toggle, Repeat-Cycle (off→all→one), Settings-Button öffnet MediaPlayerSettingsPicker. Source aus inline-Liste (max 8) raus, jetzt im Picker — skaliert auch bei Sonos mit 15+ Sources. |
| **1372** | Zwei Polish-Items: (1) cover-Domain bekommt Position-Slider als Hero (vorher nur Buttons), State-Aware-Color (gold/grau/orange), `displayValue: 'Öffnet…/Schließt…'` wenn moving, `interactive: typeof currentPos === 'number'` (nur wenn Device Position-Support hat). **Bug-Story:** alter `case 'cover'` an Z.1019 wurde nie ersetzt — JS switch greift ersten match → mein neuer Case unten wurde nie erreicht. Den alten überschrieben. (2) Cover-Art als blurred Background der gesamten detail-left (analog detail-left-news-image), filter:blur(40px) brightness(0.55) saturate(1.15), 0.6s fade-in animation. |

### Block E — Domain-Pipeline Refactor: Round 1 + Round 2 + Disaster (1373-1374)

| Version | Was |
|---|---|
| **1373** | **Refactor-Round 1: -800 LOC.** 5 SettingsPickers (climate/humidifier/vacuum/fan/media_player, total ~1024 LOC, 95% Copy-Paste, Diff zwischen den 5 Pickers nur ~58 Zeilen) durch generic DomainSettingsPicker ersetzt — pro Domain 1 Eintrag in `domainSettingsConfigs.js` (~5 LOC) statt eigene Datei (~150 LOC). Plus: SVG-Icons konsolidiert (deviceTabIcons + mediaActionIconsSolid + 10 controlIcons), 3× kopierte Tab-Icons in printer3d/universal/energy_dashboard durch references ersetzt. PresetButtonsGroup if-else durch Map-Lookup. **Bonus-Bug**: `rm -rf src/components/climate/` zu aggressiv → ClimateScheduleSettings.jsx versehentlich mit-gelöscht. Recovered durch from-scratch Rebuild im neuen Pattern (.gitignore ignoriert src/, kein git-checkout). |
| **1374** | **Refactor-Round 2: -440 LOC.** (1) DomainSettingsPicker um `mode='live'\|'schedule'`-Prop erweitert. Live-Mode = debounced hass.callService (wie bisher), Schedule-Mode = Werte sammeln + onChange-Callback. (2) `domainSettingsConfigs` split: pro Domain `liveSettings` + `scheduleSettings` Arrays. Climate scheduleSettings hat zusätzlich hvac_mode + temperature. NEUE Domains für Schedule: light (brightness_pct + color_temp_kelvin), cover (position), humidifier/fan/media_player erweitert. (3) ClimateScheduleSettings.jsx + climate dir GELÖSCHT — SchedulePickerTable nutzt jetzt DomainSettingsPicker mode='schedule'. (4) **homeAssistantService.js Dead-Code-Cleanup: 743→299 LOC**. DOMAIN_SERVICES (200 LOC), HAServices (115 LOC), isServiceAvailable, getServiceParameters, enrichEntityWithArea, default-export — alle entfernt weil nirgends importiert. (5) translatePrinterStatus aus deviceConfigs in eigenen helper printer3dHelpers.js. **🚨 KRITISCHER BUG eingeführt** (siehe Block F). |

### Block F — Pattern-Validation + KRITISCHER HOTFIX (1375-1376)

| Version | Was |
|---|---|
| **1375** | **Pattern-Validation in Production.** 3 Erweiterungen ausgerollt um zu beweisen dass das Refactor-Pattern wirklich funktioniert: (a) **water_heater-Domain** (Boiler/Wärmepumpe) komplett — ~80 LOC, neue Domain mit Hero-Slider+Buttons+Picker. (b) **climate.aux_heat** (Notheizung) als toggle-Setting — 7 LOC. (c) **cover.tilt_position** (Lamellenwinkel für Jalousien) als slider-Setting im Schedule-Editor — 7 LOC. Plus neuer `toggle`-Type im DomainSettingsPicker (~40 LOC einmalig): inline LiquidGlassSwitch in der Row, instant commit, kein Sub-View. Boolean-Settings (aux_heat, away_mode) waren als Picker `['on','off']` clunky und als Slider sinnlos. |
| **1376** | **🚨 HOTFIX**. User-Report: "wir haben einen riesenbug; bereits bei v1.1.1374 schon vorhanden". Screenshot: nur 6 Devices (statt Hunderten), die meisten "Kein Raum", Filter-Chips von 9 auf 4 reduziert. Root-Cause: in v1.1.1374 hatte ich `enrichAllEntitiesWithAreas` "inlined" (`enrichEntityWithArea` Single-Variante eliminiert) und Logic aus dem Gedächtnis geschrieben — `enriched.area = area.name` (String) VERGESSEN zu setzen. `DataProvider.jsx:589` filtert `.filter(e => e.area != null && e.area !== '')` → ALLE Entities ohne `entity.area` rausgeworfen. Plus SubcategoryBar/searchFilters/useRelatedDevices/searchIndex erwarten alle `entity.area` als String. Fix: `enriched.area = area.name` zusätzlich zu area_id und area_name + Device-Metadaten anreichern. |

---

## 2. Architektur am Ende

```
src/components/common/                          ← Generic Pickers (alle Domains)
├── DomainSettingsPicker.jsx                    (dual-mode live|schedule)
├── DomainSettingsPicker.css
├── domainSettingsConfigs.js                    (Map: domain → {live,schedule}Settings)
├── LiquidGlassSlider.jsx                       (1:1 HTML-Port + RAF-throttled onChange)
├── LiquidGlassSlider.css
├── LiquidGlassSwitch.jsx
└── LiquidGlassSwitch.css

src/utils/
├── deviceConfigs.js                            (1198 LOC, getControlConfig + getSliderConfig)
├── icons.js                                    (hvacModeIcons + controlIcons + deviceTabIcons + mediaActionIconsSolid)
├── homeAssistantService.js                     (299 LOC nach Cleanup, war 743)
└── sliderHandlers.js                           (domain-specific slider handlers)

src/system-entities/entities/integration/device-entities/
├── printer3dHelpers.js                         (NEU 1374: translatePrinterStatus extrahiert)
└── (Custom-Entities Printer3D/Energy/Weather/Universal — eigene Pipeline)

src/components/tabs/ScheduleTab/
├── components/SchedulePickerTable.jsx          (nutzt DomainSettingsPicker mode='schedule')
└── hooks/useScheduleForm.js                    (gating via hasScheduleSettingsPicker)
```

---

## 3. Status der HA-Domains am Ende

| Domain | Hero-Slider | Buttons | Live-Picker | Schedule-Picker |
|---|---|---|---|---|
| light | ✅ Brightness | ✅ Color/Temp/Effect | – | ✅ brightness_pct + color_temp_kelvin |
| switch | ✅ On/Off | – | – | – |
| climate | ✅ Target-Temp + Color | ✅ HVAC-Modi (6) | ✅ Fan/Swing/Preset/Humidity + aux_heat | ✅ + hvac_mode + temperature |
| media_player | ✅ Volume + Cover-Art | ✅ Play/Skip + Shuffle/Repeat | ✅ Source + Sound-Mode | ✅ + volume_level |
| lock | ✅ Locked-Status | ✅ Lock/Unlock | – | – |
| cover | ✅ Position + State-Color | ✅ Open/Stop/Close + Presets | – | ✅ position + tilt_position |
| fan | ✅ Speed | ✅ Oscillate/Direction/Preset | ✅ Preset (alle) | ✅ + percentage |
| humidifier | ✅ Target-Humidity | ✅ Power + Mode | ✅ Mode | ✅ + humidity |
| vacuum | ✅ Battery-Donut | ✅ Start/Pause/Stop/Dock/Locate | ✅ Fan-Speed | ✅ |
| **water_heater** | ✅ Target-Temp + Color | ✅ Power + Op-Modes | ✅ op_mode + away_mode | ✅ + temperature |

**10 Domains voll abgedeckt**, alle nutzen die generische Pipeline. Plus 4 Custom-System-Entities (Printer3D, EnergyDashboard, Weather, Universal-Wrapper) mit eigener UI.

---

## 4. LOC-Bilanz (Refactor-Effekt)

| Phase | Δ LOC |
|---|---|
| 5 SettingsPickers gelöscht (1024 LOC) → 1 generic + Configs | -800 |
| ClimateScheduleSettings + climate dir gelöscht → DomainSettingsPicker mode='schedule' | -200 |
| homeAssistantService.js Dead-Code-Cleanup | -444 |
| SVG-Icons konsolidiert in icons.js | -100 |
| printer-status-translate extrahiert | -35 (in deviceConfigs) +40 (neuer Helper) = +5 |
| **Total Refactor** | **~-1540 LOC** |
| (Gegenrechnung: +DomainSettingsPicker + Configs + 3 neue Domain-Configs + toggle-Type + Cover-BG-CSS) | ~+700 LOC |
| **Net** | **~-840 LOC** |

Plus eine fundamental sauberere Architektur: 1 Map-Eintrag pro neuer Setting/Domain statt eigene Datei pro Picker.

---

## 5. Wichtigste Lehren — Pattern-Reference

### a) Refactor ohne git-Sicht ist gefährlich

`.gitignore` ignoriert `src/` (nur `dist/` ist tracked weil HACS das braucht). Daher kein `git checkout HEAD -- file.js` möglich. Wenn ich in v1.1.1373/1374 Files lösche oder Logic "inlined" reconstruiere, ist die alte Version PERMANENT WEG.

**Pattern**: vor Massenlöschung IMMER `ls dir/` prüfen + die Output-Properties der zu refaktorierenden Funktion grep'en bevor neue Logic geschrieben wird.

```bash
grep -rn "entity\\.area\\b" src/  # hätte v1.1.1374-Bug verhindert
```

### b) Performance-Bugs sind oft auf der Konsumenten-Seite

LiquidGlassSlider war perf-tight (motion values, kein React-Re-Render pro Frame). Aber der ParentTab triggerte 60×/sec setState → Re-Render der ganzen Subtree → Drag stockte. Fix nicht im Component sondern beim Caller (RAF-throttle setState + Debounce localStorage).

**Pattern**: 3-Layer-Update-Strategie für Live-Feedback-Components:
- Live Visual (instant) → CSS-Var, motion value
- React State (RAF-throttled) → Label-Update
- Persistenz (debounced 200ms) → localStorage / HA

### c) Configs-as-Data > Switch-Statements

5 SettingsPickers waren je 150-340 LOC. Diff zwischen ihnen nur ~58 Zeilen. → 1 generic Component + 5 Map-Einträge à ~5 LOC = -800 LOC. Pro neuer Domain jetzt **5 LOC statt 150**.

**Pattern für künftige Erweiterungen**: wenn 4+ Files >80% identisch sind, die Abstraction lohnt sich fast immer. Der Diff-Test (`diff -u file1 file2 | wc -l` zwischen den Pickern) ist der Trigger.

### d) Property-Aliasing bei Bulk-Properties checken

Mein v1.1.1374-Bug: enriched.area_id und enriched.area_name gesetzt, aber NICHT enriched.area (String). HA-Spec hat nur `area_id`, aber unser Codebase hat über die Zeit `entity.area` als String-Convention etabliert. 6 verschiedene Stellen lesen `entity.area` direkt.

**Pattern**: bei Property-Cleanup vorher überall grep'en wie eine Property tatsächlich verwendet wird — nicht nur die "obvious" Spec-Felder.

### e) Dead-Code-Audit per `grep -rln EXPORT src/`

Dead-Code-Detection ist trivial wenn man weiß wonach zu suchen:

```bash
for export in DOMAIN_SERVICES isServiceAvailable HAServices ...; do
  echo "$export → $(grep -rln "$export" src --include='*.js' | grep -v homeAssistantService.js | wc -l) files"
done
```

5 von 12 Exports in homeAssistantService.js waren dead → 444 LOC weg. Sehr typisch für gewachsene Codebase, ROI extrem hoch.

### f) Validierung gegen Hardcoded-Lists vermeiden

`callHAService` validierte gegen `DOMAIN_SERVICES` (Service-Map). Aber: die Liste war incomplete (Custom-Integrations fehlten) → false-negatives. HA returnt selbst Fehler bei nicht-existenten Services → client-side Validierung redundant + fragile.

**Pattern**: bei Backend-validierten APIs lieber durchreichen + Backend-Errors handhaben als client-side Whitelist pflegen.

### g) Domain-spezifische Helper im Domain-Verzeichnis

`translatePrinterStatus` lag in `src/utils/deviceConfigs.js` (generic). Gehörte aber in `src/system-entities/entities/integration/device-entities/printer3dHelpers.js` (Domain-Aware Position).

**Pattern**: Domain-Aware Position erleichtert:
- Späteres Refactoring (Suche nach "alles was mit Printer3D zu tun hat" → ein Verzeichnis)
- Zeigt klar dass die Funktion nicht generisch ist
- Verhindert dass die generic-Datei mit Domain-Spezifika zumüllt

### h) Toggle für Boolean-Settings als eigener Type

PickerWheel mit `['on','off']` für Boolean ist clunky (User scrollt durch 2 Items). Slider mit 0/1 ist sinnlos. iOS-Pattern: inline Switch direkt in der Row.

**Pattern**: bei Setting-System mit Type-Discrimination IMMER einen Boolean-Type haben. Wir hatten in v1.1.1374 nur `'picker'` und `'slider'`, mussten in v1.1.1375 `'toggle'` nachträglich einbauen. Lieber im ersten Wurf mitdenken.

---

## 6. Was offen bleibt

- **Translation-Fallbacks** `t('xx') || 'XX'` überall — risky cleanup, brauchen Translation-Audit
- **Universal-Layouts** (climate/media_player/dehumidifier/vacuum als spezialisierte Layouts im Universal-Wrapper) — ursprüngliche Vision aus v1.1.1366, mehrfach zurückgestellt zugunsten der Domain-Pipeline-Konsolidierung. Jetzt deutlich einfacher weil alle Voraussetzungen geschaffen.
- **`media_player` Cover-Art Hero-Mode auf MOBILE** — auf kleinen Screens ist die kleine 60×60 cover im Slider-Center redundant zur Cover-BG
- **Vacuum-Map-Display** (Roborock-Map als Bild) — komplexes Feature
- **alarm_control_panel + camera-Domain** — noch nicht implementiert (alarm-services definiert, aber kein UI)

---

## 7. Erkenntnis-Summe

**14 Releases über 3 Tage**, davon:
- **10 Feature-Releases** (Slider, Integration, 5 neue/erweiterte Domains, Cover-BG, water_heater, aux_heat, tilt_position)
- **2 Refactor-Runden** (-1540 LOC raw, ~-840 LOC netto, fundamental sauberere Architektur)
- **2 Hotfixes** (1364 Performance + 1376 Area-Regression)

Die Session zeigt das Pattern: **inkrementelle Polish-Runden + große Refactor-Sprünge + ehrliche Hotfix-Recovery** wenn was kaputt geht. Die Hotfixes waren beide in <1 Tag gefixt nachdem User-Reports kamen — das schnelle User-Feedback (Screenshots) war kritisch.

**Größte Risiko-Erkenntnis**: das Repo-Setup mit `.gitignore *` für `src/` (nur dist/ tracked für HACS) macht Refactor-Recovery hart. Bei jedem zukünftigen großen Refactor entweder:
- Vorher `git stash`-Fallback bauen (manuell src/ tracken)
- Oder: vor dem Löschen den Inhalt grep'en + dokumentieren

**Größte UX-Erkenntnis**: User-Reports mit Screenshots sind 10× wertvoller als textuelle Beschreibungen. Beide Hotfixes (1364 Performance, 1376 Area-Bug) waren erst durch Screenshots/Video-Beschreibungen klar diagnostizierbar.
