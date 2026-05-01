# Session Notes — 2026-05-01

**Stand am Ende:** v1.1.1359. **27 Releases an einem Tag** (v1.1.1333 → v1.1.1359).

Mit Abstand die längste Session des Projekts. Schwerpunkt-Bogen:

- **Vormittag:** TDZ-Fix aus 1332-Refactor + Persistenz-Refactor (localStorage → HA frontend/set_user_data) als Foundation für Universal-Builder.
- **Mittag:** Universal Device Builder von 0 auf voll funktional in 5 Iterationen (Add → Edit → Live-Preview → Layout-Templates → Smart-Layouts).
- **Nachmittag:** **Großer Refactor** — Universal-Builder komplett neu auf Auto-Gruppierung nach HA-Backend (statt manueller Slot-Auswahl), Bambu-Stil 1:1.
- **Abend:** Nahezu eine Stunde Bug-Hunting bis Visual + Live-Updates passten. Plus Polish-Pass mit Icon-Picker, ios-Settings-Stil, Sub-Views für Select/Time.

**Gemerkt:**
- Bei "1:1 wie X" → die Component direkt nutzen, nicht "inspirieren von" (Universal-Builder hatte 3 Iterationen bis ich UniversalControlsTab DIREKT eingehängt habe statt eigenes Layout zu bauen)
- Multi-Instance-Bugs sind oft erst durch Universal sichtbar (Roborock + Bambu + Tesla nebeneinander triggert latente Bugs in DataProvider/SystemEntityLazyView/DeviceCard die seit v1.1.1192 schlummerten)
- Defensive `*-refresh`-Events sind eine valide Backup-Strategie wenn Smart-Merges Edge-Cases haben

---

## 1. Release-Übersicht in 6 Blöcken

### Block A — Cleanup/Foundation (1333-1334)

| Version | Was |
|---|---|
| **1333** | **TDZ-Bugfix in useRegisterViewRef-Calls.** News, Todos, Versionsverlauf und AllSchedules crashten beim Öffnen mit `ReferenceError: Cannot access 'J' before initialization` weil das Object-Literal an `useRegisterViewRef('news', { handleRefresh: handleRefresh, ... })` direkte Referenzen auf `const`-Funktionen enthielt die WEITER UNTEN im Component-Body deklariert waren. Fix: Lazy-Wraps `(...args) => handleRefresh(...args)` damit Identifier erst beim Aufruf aufgelöst werden. 8 Wraps in 4 Files. Doku-Kommentar im ViewRefContext mit TDZ-Warnhinweis. |
| **1334** | **Persistenz von localStorage zu HA `frontend/set_user_data`.** Foundation für Universal-Builder. Neuer File `deviceConfigStorage.js` (~250 LOC) mit Cache + Sync-Read + Async-Write Pattern, damit existing synchronous Reader (7 Call-Sites in 7 Files) ohne Refactor weiterfunktionieren. Migration aus localStorage automatisch beim ersten Boot, localStorage als offline-Fallback-Mirror. Schema-Versionierung von Anfang an. Cross-Device-Sync via HA-User-Data, in HA-Backups. |

### Block B — Universal Device Builder (1335-1339)

| Version | Was |
|---|---|
| **1335** | **Universal Device Builder.** 3 neue Files (~1100 LOC) + 1 Registry-Eintrag. UniversalDeviceEntity (generischer Wrapper um beliebiges HA-Device, Slots: hero+strip+all), UniversalSetup (3-Step-Wizard mit Device-Picker, Entity-Selection mit Smart-Defaults via device_class, Naming), UniversalDeviceView (Hero+Strip+toggleable-List mit Optimistic-Update-Pattern). |
| **1336** | **Universal Edit-Flow** in-place ohne Remove+Re-Add. IntegrationEntity bekommt updateDevice-Action. UniversalSetup mode='edit' (skip Step 1, Prefill aus existingDevice, Save-Button). UniversalDeviceView editingMode-State + ViewRefContext für Settings-Button + Event-Listener für system-entity-updated zur Reaktivität. |
| **1337** | **Live-Preview im UniversalSetup.** DRY-Refactor: resolveEntity/formatHeroValue/formatStripValue aus UniversalDeviceView nach views/universalRenderHelpers.js extrahiert. Neue UniversalPreviewCard (read-only Mini-Vorschau). Setup: Preview-Toggle in Step 2 (collapsible), Live-Preview in Step 3 statt Text-Summary. |
| **1338** | **Layout-Templates** Default/Compact/Stats. Plugin-Pattern analog deviceTypeRegistry: universalLayouts.js als Single Source of Truth, neue Layouts ergänzen via 1-Eintrag. UniversalDeviceView -180 LOC durch Auslagerung in views/layouts/. Layout-Picker in Setup Step 3 (Radio mit Icon+Label+Description). PreviewCard layout-aware. updateDevice propagiert layout-Field. |
| **1339** | **Zwei Smart-Layouts: Vehicle + Media.** Battery-Bar mit State-aware Color (grün>50% / orange 20-50% / rot<20%) für Tesla-ähnliche Geräte. Cover-Art-Background mit Title-Overlay für Spotify/Sonos/Plex. Plugin-Pattern bewährt: 2 neue Files + 1 Registry-Update + 4 neue Felder im resolveEntity-Helper, alle restlichen Files unverändert. |

### Block C — Universal Refactor: Auto-Gruppierung (1340-1343)

User-Frage: "warum wird nicht exakt nach backend gruppiert? im backend wird in der regel zB Steuerelemente / Sensoren / Konfiguration / Diagnose gruppiert"

→ Mein `slots: {hero, strip, all}`-Schema war eine Erfindung die HAs Backend-Gruppierung ignoriert. Großer Refactor zum Wechsel auf Auto-Gruppierung.

| Version | Was |
|---|---|
| **1340** | **Bugfix TabNavigation active-pill** (parallel zum Refactor-Plan). Stale closure auf viewRefs verschwand bei allen Multi-Instance-Devices (Printer/News/Todos/etc.) seit v1.1.1332 ViewRefContext-Refactor. RAF-Polling captured initial leeres viewRefs aus dem ersten Render und las das für immer. Fix: Mirror-Ref-Pattern + Functional-Update + isActive im Render aus activeButtonState statt parallel viewRef.getActiveButton() aufzurufen. |
| **1341** | **Universal Refactor: Auto-Gruppierung nach HA-Backend** im Bambu-Stil. Neuer entityGrouping.js Helper analog HAs Klassifikation via entity_category + domain. Schema-Migration: slots/layout entfernt, hero+hidden_entities neu. UniversalDeviceView komplett neu mit Hero-Circle (Battery-Donut wenn device_class=battery) + 4 expandable Tab-Buttons mit den exakten 3D-Drucker-Icons. UniversalSetup Step 2 ~70% weniger Klicks. Layout-System (5 Files + Registry + Verzeichnis) komplett gelöscht — ein Layout reicht. |
| **1342** | Universal Builder Bugfixes: (1) Area-Name aus HA-Backend in PreviewCard und UniversalDeviceView-Header anzeigen. (2) Race-Condition behoben: Device erschien nach Add nicht sofort im Raum weil `register()` `entity-registered` Event vor dem async `onMount` feuerte → DataProvider lud Entity ohne area_id. Fix: Area aus hass.devices/entities synchron setzen BEVOR register() aufgerufen wird. Bonus: doppel-mount-Bug entfernt. |
| **1343** | Universal Builder visuell **1:1 wie Bambu**: iOS-Blau-Tabs (statt lila), ios-card/ios-item Liste mit ios-divider und ios-section-header (uppercase), LiquidGlassSwitch für Toggles, Header oben links statt zentriert, Layout-Switch via motion-layout sodass Tabs bei expanded nach oben fliegen analog Bambu-Pattern. Vorlage Printer3DDeviceView/PrinterSensorsList/PrinterMiscList wurde 1:1 nachgebaut statt 'inspiriert von'. **3. Versuch nach 2x Frustration vom User.** |

### Block D — UniversalControlsTab direkt nutzen (1344-1346)

User-Frustration nach 1343: "ES IST NOCH IMMER NICHT 1:1"

→ Erkenntnis: ich kann das Bambu-Visual nicht "nachbauen" ohne Drift. Ich muss die existierende Component DIREKT verwenden.

| Version | Was |
|---|---|
| **1344** | **Universal Builder nutzt jetzt UniversalControlsTab DIREKT.** 4 minimale Patches in bestehenden Files: getControlConfig+getSliderConfig case 'universal_device' in deviceConfigs.js, UniversalControlsTab Hero-State-Lookup für hass.states[hero], PresetButtonsGroup neuer Case der UniversalEntityList rendert. Plus neue UniversalEntityList Component (~210 LOC) analog PrinterSensorsList/PrinterMiscList. UniversalDeviceView von 510 auf 130 LOC geschrumpft. Visual jetzt GARANTIERT 1:1 weil dieselbe Component-Pipeline. |
| **1345** | Bugfix: zweites Universal-Device zeigte Daten vom ersten — fehlender `key`-prop in DetailView's System-Entity-View. Preact reused Component-Instanz bei gleichem Type → interne useState/useRef Caches blieben am ersten Device. Fix: `key={item.id || item.entity_id}`. (War aber nur eine Hälfte des Bugs — siehe 1346.) |
| **1346** | **Multi-Instance-Bug, der echte Fix.** SystemEntityLazyView nutzte `getEntityByDomain` das immer das erste Entity einer Domain returnt → zweites Universal-Device bekam immer Entity-Instanz vom ersten, egal welches der User anklickt. `key`-Fix von 1345 erzwang Remount aber LazyView lookt eh wieder das erste auf. Fix: ID-basierter Lookup via `getEntity(internalId)` mit Prefix-Strip (system./plugin.), Fallback auf getEntityByDomain. Wirkt für alle Multi-Instance-Types (Universal, Printer3D, EnergyDashboard, Weather) — latenter Bug seit v1.1.1192. |

### Block E — Toolbar + Setup im System.Settings-Stil (1347-1351)

User: "ich will diese 4 standard-tab-icons + settings, refresh und back weg"
User: "in den settings das gleiche design wie bei system.settings"

| Version | Was |
|---|---|
| **1347** | Universal Toolbar mit Standard-Tab-Icons (Controls/Schedule/History/Context aus defaultTabIcons) + Settings, Back/Refresh entfernt. UniversalDeviceEntity.actionButtons ersetzt mit 4 Standard-Icons (action: noop, erstmal nur visuell) + Settings (funktional). TabNavigation.getActionIcon um 4 neue Cases erweitert. Initial activeButton 'controls' damit erster Tab als active markiert ist. |
| **1348** | UniversalSetup im System.Settings-Stil: ios-section/ios-card/ios-item Pattern + Sub-Views (hero-picker, visibility) analog GeneralSettingsTab. Step 2 zeigt jetzt 2 ios-items mit Chevron statt Dropdown+Checkboxes — Click öffnet Sub-View. |
| **1349** | UniversalSetup-Container im System.Settings-Look: ios-settings-container als outer (background #00000040, border-radius 24px). PreviewCard Tab-Buttons im Bambu-Stil: 48px round mit SVG-Icons statt 34px Counter-Bubbles. |
| **1350** | UniversalSetup Padding analog System.Settings (32px statt 20px) + CustomScrollbar in allen 3 Render-Paths. |
| **1351** | UniversalSetup auf System.Settings-Pattern korrekt umgestellt: ios-settings-container als KONSTANTER outer + AnimatePresence inside switched zwischen ios-view-wrapper Views, sub-views mit ios-navbar/ios-navbar-back/ios-navbar-title statt custom back-button. Bug-Fix: controls-Tab-action von noop auf overview damit click aus Edit-Mode zurück zur Device-Übersicht navigiert. |

### Block F — Polish + Final Bugs (1352-1359)

| Version | Was |
|---|---|
| **1352** | 3 Universal Builder Fixes: (1) Umbenennen-Bug — updateDevice propagiert jetzt name (als friendly_name), hero, hidden_entities, icon zu attribute updates. (2) Vorschau collapsible mit Toggle-Header + lila Badge in PreviewCard entfernt. (3) Icon-Picker Sub-View mit kuratiertem SVG-Catalog (30 Icons in 9 Kategorien). |
| **1353** | Universal Bugfixes: (1) Icon erscheint jetzt im Suchpanel: getSystemEntityIcon hatte keinen universal_device-Eintrag und las device.attributes.icon nicht. (2) PreviewCard nutzt jetzt UniversalControlsTab direkt mit Mock-Entity statt eigener Mini-Layout — 1:1 Match zur echten Device-View, kein Visual-Drift mehr. |
| **1354** | Universal Edit-Bug: icon wurde im handleEditComplete nicht durchgereicht. Pipeline-Lücke — Wizard speicherte iconKey, aber `updates: {name, hero, hidden_entities}` enthielt kein `icon`. Conditional spread Fix. |
| **1355** | DeviceCard memo-comparator: icon/name Updates für System-Entities jetzt live sichtbar. Comparator prüfte nur Whitelist (state/last_updated/friendly_name/etc.), icon war nicht drin → memo returnt true → DeviceCard re-rendert nicht. |
| **1356** | **Defensives system-entities-refresh-Event** in updateDevice damit Icon-Updates GARANTIERT live durchkommen. Der attribute-merge im handleSystemEntityUpdated hatte einen Edge-Case der icon verschluckte. Lösung: full-refresh-Event das DataProvider abfängt → getAsHomeAssistantEntities komplett reloaded sodass jede System-Entity frisch durch toEntity läuft. |
| **1357** | Bugfix Universal Auto-Gruppierung: Diagnostic/Config-Entities ohne State wurden komplett rausgefiltert. resolveEntityForGroup returnte null wenn hass.states[entityId] undefined → Diagnose-Tab leer trotz aktiver Visibility-Toggles. Fix: Entity wird auch ohne State zurückgegeben (markiert als unavailable), friendly-Name-Fallback-Kette via registry.name/original_name. |
| **1358** | UniversalEntityList interaktive Controls für select/number/time/text. Vorher waren config-Items nur read-only Display, jetzt 4 neue Sub-Components (SelectControl/NumberSliderControl/TimeControl/TextControl) die hass.callService direkt rufen. Wide-Control-Mode für number/time/text — zweizeilig mit Label oben, Control full-width unten. Roborock-Vacuum-Sonstiges-Tab zeigt jetzt 1:1 wie HA-Backend. |
| **1359** | **Select/Time als Sub-Views.** Statt inline native Browser-Widgets jetzt: select öffnet Sub-View mit ios-card-Liste + Checkmark beim aktiven Wert (analog System.Settings Sprach-Picker), time öffnet Sub-View mit TimePickerWheel (analog Schedules) inkl auto-save 500ms-Debounce nach Wheel-Stop. EntityRow rendert select/time als ios-item-clickable mit Chevron. |

---

## 2. Universal-Builder Architektur am Ende des Tages

```
src/system-entities/entities/integration/
├── deviceConfigStorage.js               (~250 LOC, NEU 1334)  Cache+HA-WS-Persistenz
├── iconCatalog.js                       (~250 LOC, NEU 1352)  30 line-art SVG-Icons in 9 Kategorien
├── index.js (IntegrationEntity)         updateDevice action propagiert name/hero/hidden_entities/icon + dispatched system-entities-refresh
├── components/
│   ├── UniversalPreviewCard.jsx         (~95 LOC, neu seit 1353) rendert UniversalControlsTab mit Mock-Entity
│   └── setup-flows/UniversalSetup.jsx   (~750 LOC) ios-settings-container + view-wrapper + Sub-Views
└── device-entities/
    ├── UniversalDeviceEntity.js         (~130 LOC) hero/hidden_entities/icon im constructor
    ├── deviceTypeRegistry.js            + universal als 4. Type
    ├── components/
    │   └── UniversalEntityList.jsx      (~700 LOC) Pickers für select/time, inline für number/text
    └── views/
        ├── UniversalDeviceView.jsx      (~130 LOC, geschrumpft von 510) nur orchestriert UniversalControlsTab
        ├── entityGrouping.js            (~190 LOC) 4-Gruppen-Klassifikation nach entity_category + domain
        └── universalRenderHelpers.js    Pure-Function-Helpers (resolveEntity, format, etc.)

src/components/
├── DeviceCard.jsx                       memo-comparator + icon/name (1355)
├── DetailView.jsx                       key={item.id} an SystemEntityLazyView (1345)
├── DetailView/TabNavigation.jsx         + 4 Cases controls/schedule/history/context, Mirror-Ref für viewRefs (1340), activeButtonState statt direkter getActiveButton
├── SystemEntityLazyView.jsx             getEntity(internalId) statt getEntityByDomain (1346)
├── controls/PresetButtonsGroup.jsx      neuer Case für universal_device → UniversalEntityList
└── tabs/UniversalControlsTab.jsx        + universal_device Sliderconfig-Override

src/utils/deviceConfigs.js               + getControlConfig 'universal_device' + getSliderConfig 'universal_device'

src/system-entities/integration/DeviceCardIntegration.jsx
                                         + universal_device Renderer der attributes.icon SVG inline rendert
src/providers/DataProvider.jsx           + system-entities-refresh listener
```

---

## 3. Wichtigste Lehren des Tages

### a) "1:1 wie X" → die Component DIREKT nutzen

Dreimal habe ich versucht, das Bambu-Visual "nachzubauen" mit eigenem JSX. Padding, Spacing, Animation-Timings, ControlButton-CSS aus `UniversalControlsTab.css` waren immer ein bisschen daneben. Nach 2 Frustrations-Iterationen vom User → in v1.1.1344 habe ich UniversalControlsTab DIREKT eingehängt mit 4 minimalen Patches in deviceConfigs.js + PresetButtonsGroup. Visual seitdem GARANTIERT 1:1.

**Pattern:** Wenn User eine bestehende Component als Vorlage nennt, frage IMMER zuerst: "Soll ich die Component direkt verwenden oder ein eigenes Layout im selben Stil bauen?" Direkt verwenden ist meist die richtige Antwort.

### b) Multi-Instance-Bugs sind oft latent seit Längerem

Universal hat 3 latente Bugs ans Licht gebracht die seit v1.1.1192 (erste Multi-Instance-Devices via Integration) schlummerten:
- DataProvider's getEntityByDomain returnt immer das erste Match
- DeviceCard's memo-comparator fehlten Properties die für System-Entities relevant sind (icon/name)
- DetailView's SystemEntityLazyView ohne `key` reused dieselbe Instance

**Pattern:** Bei neuem Multi-Instance-Use-Case immer eine Audit-Pass auf die Komponenten machen die Single-Instance gewohnt waren (DataProvider, DeviceCard, DetailView, getEntityByDomain).

### c) Smart-Merges haben Edge-Cases — defensive full-refresh-Events sind valide

Der `handleSystemEntityUpdated`-attribute-merge in DataProvider funktioniert für die meisten Properties. Aber Icon-Updates kamen 4 Iterationen lang nicht durch. Ohne live debugging war die Wurzel nicht klar isolierbar. Lösung: `system-entities-refresh`-Event das einen full `getAsHomeAssistantEntities()` triggert → garantiert konsistent.

**Pattern:** Bei subtilen merge-Bugs in DataProvider-Updates → ein dediziertes "force-refresh"-Event als Backup-Mechanismus etablieren. Performance-overhead ist bei <20 System-Entities vernachlässigbar.

### d) Pipeline-Updates müssen jede Stufe weitergeben

Bei Edit-Flows mit mehreren Update-Stufen (Wizard → Caller → Entity-Action → DataProvider): jede Stufe muss alle relevanten Felder durchreichen. Wenn auch nur eine Stufe ein Feld vergisst, ist es weg. (Bug 1354: handleEditComplete vergaß `icon` im updates-Object.)

### e) Auto-Gruppierung nach Backend > Manuelle Slots

Mein originales `slots: {hero, strip, all}`-Schema war eine Erfindung die HAs Backend-Gruppierung ignoriert. User hat richtig erkannt: HA gruppiert schon nach Steuerung/Sensoren/Diagnose/Konfiguration via `entity_category` + `domain`. Dem zu folgen ist sowohl weniger Setup-Klicks für den User als auch konsistenter mit HAs UX.

### f) System-Entities haben kein `last_updated`

Mehrere Caching/memo-Mechanismen verlassen sich auf `last_updated` für Re-Render-Triggering. System-Entities (von SystemEntity.toEntity erzeugt) haben das nicht. Daher müssen explizit alle update-fähigen Properties in memo-Comparators enthalten sein (icon, name, friendly_name, etc.).

---

## 4. Was offen bleibt

- **Drag-Reorder im Strip** (alter Plan aus 1339-Tag, durch Refactor 1341 obsolet — gibt jetzt keine Strip mehr, nur noch Auto-Gruppen)
- **Bulk-Edit für mehrere Universal-Devices** (umbenennen, Layout wechseln)
- **Mehr Layouts** als Variants — der User hatte ja Vehicle/Media als Idee, durch das Auto-Gruppen-Refactor sind die obsolet geworden. Wenn User sie zurück will, kommen sie als Variants des Hero-Display (z.B. Battery-Donut prominent statt CircularSlider) zurück.
- **Number/Text als Sub-Views** (analog Select/Time aus 1359) falls User auch diese aus dem Wide-Control-Mode rausziehen will. Aktuell sind sie inline (zweizeilig) was OK funktioniert.
- **Icon-Picker erweitern** um eigene SVG-Upload-Funktion oder Search-Bar bei mehr als 30 Icons.

---

## 5. Erkenntnis-Summe

27 Releases an einem Tag. Vorherige Spitze war 23 (v1.1.1310-1332 am 2026-04-30/05-01). Heute also persönlicher Rekord.

Stand am Ende: Universal Device Builder ist **funktional komplett** und visuell konsistent mit dem Rest der Card. User kann beliebige HA-Devices mit 3-Klick-Wizard als Card hinzufügen, mit Auto-Gruppierung nach HA-Backend, Icon aus 30er-Catalog, alle config-entities (select/number/time/text/switch/button/scene/script) sind interaktiv mit den richtigen iOS-Style-Pickern.

Das Universal-Card kann jetzt grundsätzlich JEDES HA-Device repräsentieren — was v1.1.1335 als ursprüngliches Ziel hatte. Die 3 Premium-Types (Printer3D, EnergyDashboard, Weather) bleiben unverändert für ihre spezialisierten Use-Cases.
