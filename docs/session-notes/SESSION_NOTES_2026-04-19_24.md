# Session Notes — 2026-04-19 & 2026-04-24

Zusammenfassung zweier intensiver Arbeitstage an der **Fast Search Card**. Von v1.1.1201 bis **v1.1.1237**, 36 Releases: Performance-Roadmap, Suggestions-Feinschliff, Notifications-System, Toast-Settings, StatsBar-Redesign, Vision-Pro-Sidebar, viele Layout-Fixes.

> Zuletzt aktualisiert nach v1.1.1237. Aufnahme-Konvention: Changelog ab v1.1.1220 auf **Englisch**, Session-Notes weiterhin Deutsch.

---

## 1. Overview

Vor der Session: v1.1.1201 – Suggestions v2 fertig, Performance nur punktuell optimiert, keine Notifications-Quelle, klassische StatsBar mit vielen kleinen Pills, keine Sidebar.

Nach der Session: **−9.5 % Bundle**, komplettes persistent_notification-System mit Widget + Panel + Toast-Diff, Toast-Settings mit 6 Event-Gates, neu designte StatsBar-Glass-Pill mit Mobile-Rotation, Apple-Vision-Pro-Sidebar (zweimal redesignt), echtzeit-gebundener DetailView-Header, viele subtile Layout- und Sync-Bugs gelöst.

---

## 2. Releases chronologisch

### Tag 1 (2026-04-19): Performance-Roadmap + große Bug-Welle + Notifications

**Performance-Roadmap (pausiert bei v1.1.1206):**

| Version | Titel | Kern |
|---|---|---|
| **v1.1.1202** | Phase 1 – Build-Hygiene | Terser statt esbuild + postcss-purgecss + cssnano. −15.6 KB gzip |
| **v1.1.1203** | Phase 3 – react-markdown → marked | 81 transitive Deps raus, marked+DOMPurify rein. −13.2 KB |
| **v1.1.1204** | Phase 4A – chart.js Tree-Shaking | `chart.js/auto` → expliziter Registry. −10.7 KB |
| **v1.1.1205** | Phase 2 – Utils-Duplikat-Audit | `scheduleHandlers` + `historyDataProcessors` merged. −0.1 KB (Qualität) |
| **v1.1.1206** | Phase 6 – System-Entities-Dedupe | Icons + slideVariants zentralisiert. −0.14 KB (Qualität + Runtime) |

**Bugs & Features Tag 1:**

| Version | Titel | Kern |
|---|---|---|
| **v1.1.1207** | Vorschläge sofort sichtbar | Cold-Start-Fallback mit Priority-Domains |
| **v1.1.1208** | Ausschlussmuster Presets + Seed | 5 Default-Patterns beim First-Run, 4 Quick-Add-Presets |
| **v1.1.1209** | fastender-Preset | 35 vorkonfigurierte Patterns im Preset |
| **v1.1.1210** | Dead-Code raus | Push-Toggle + StatsBar-Notifications-Widget entfernt |
| **v1.1.1211** | Race-Condition System-Entities | hass-Retry-useEffect nur noch nach `isInitialized` |
| **v1.1.1212** | Cache 1 h → 5 min | Versionsverlauf zeigt neue Releases schneller |
| **v1.1.1213** | Notifications-System | persistent_notification.* → Widget + Panel + Toast |
| **v1.1.1214** | TDZ-Hotfix | `refreshNotifications` vor useEffect, sonst TDZ im minified Bundle |
| **v1.1.1215** | Toast-Settings | Neue Section mit 6 Event-Gates + Position + Dauer |
| **v1.1.1216** | Toast-Gate DetailViewWrapper | Korrekter Pfad (nicht DataProvider.callService) |
| **v1.1.1217** | Doppel-Toast #1 | DataProvider.callService Toast raus |
| **v1.1.1218** | Toast-Dedupe + Diagnose | 500 ms-Dedupe + console.warn-Logs zur Quellenfindung |
| **v1.1.1219** | **Root-Cause-Fix Doppel-Toast** | Preact-`<label>`+`<input>`-onChange doppelt → 150 ms Dedupe im `CircularSlider.handlePowerToggle` |
| **v1.1.1220** | DetailView-liveItem | Header/Stats/TabNav nutzen jetzt `liveItem` statt statischem `item` |

### Tag 2 (2026-04-24): Mobile-UX + StatsBar-Redesign + Vision-Pro-Sidebar

**Mobile:**

| Version | Titel | Kern |
|---|---|---|
| **v1.1.1221** | Mobile Auto-Expand | Setting: Suchpanel startet auf Mobile direkt expanded |
| **v1.1.1222** | Mobile Top-Gap 120 px | *Kurzzeitig – falsche Richtung, sofort wieder revertet* |
| **v1.1.1223** | Reverse v1.1.1222 | `position='top'` initial setzen → y=0, klebt oben |

**StatsBar-Redesign:**

| Version | Titel | Kern |
|---|---|---|
| **v1.1.1224** | StatsBar-Glass-Pill | Eine durchgehende Pill statt mehrerer kleiner Widget-Pills |
| **v1.1.1225** | DetailView `bottom: 0` | Überdeckt jetzt auch StatsBar + margin (Desktop) |
| **v1.1.1226** | DetailView top 47 → 54 | Match zur höheren StatsBar-Pill |
| **v1.1.1227** | StatsBar `.glass-panel` + −20 % Desktop | Shared Background mit Panel, schmalerer Container |
| **v1.1.1228** | StatsBar Settings-Sync-Bug | Dual-Write in localStorage + systemSettings.appearance |
| **v1.1.1229** | StatsBar-Layout-Swap + Mobile-Rotation | Widgets links, Avatar rechts (no name), Mobile rotiert alle 5 s |
| **v1.1.1235** | StatsBar-Padding 6 → 12 px | Vertikal doppelt + DetailView-Offsets entsprechend angehoben |

**Vision-Pro-Sidebar:**

| Version | Titel | Kern |
|---|---|---|
| **v1.1.1230** | SearchSidebar Basic | Erste Version (Mockup v1), Shortcuts zu System-Entities |
| **v1.1.1231** | Sidebar-Polish | Echte SVG-Icons (`getSystemEntityIcon`), vertikal zentriert, anchor-wrapper |
| **v1.1.1232** | Sidebar-Redesign v2 | Neue Mockup-Vorlage: `apple-window`-Look, fixed am Viewport |
| **v1.1.1233** | Sidebar-Position-Fix | `right: 100%` + `margin-right: 12 px` → klebt am Panel, Hover wächst nach links |
| **v1.1.1234** | Sidebar `.glass-panel` | Shared Background mit StatsBar + Panel; StatsBar gated durch `isExpanded` |
| **v1.1.1236** | Sidebar −20 % | Horizontal-Padding 16 → 8 + Font-Stack angeglichen |
| **v1.1.1237** | Sidebar −10 % + Navbar-Title | Padding 12 px, iOS-Navbar-Title jetzt wirklich zentriert |

---

## 3. Architektur-Entscheidungen

### 3.1 Performance-Roadmap: ehrlich pausiert bei -9.5 %

Die Roadmap (`docs/PERFORMANCE_ROADMAP.md`) stand bei *−40 %* als Fantasie-Ziel. Real erreicht: -9.5 %. Weitere Hebel (framer-motion LazyMotion, chart.js-Ersatz) haben hohes Risiko bei moderatem Gewinn. Bewusst pausiert, nicht abgehakt.

### 3.2 react-markdown → marked + DOMPurify (nicht nur marked)

Content kommt aus `docs/versionsverlauf.md` via GitHub-Fetch. Bei kompromittiertem Repo → XSS-Risk. DOMPurify als Sicherheitsnetz kostet 17 KB, bleibt dabei.

### 3.3 chart.js behalten, nur tree-shaked

uPlot wäre schlanker, kann aber kein Bar-Chart. User hat Bar-Charts (Schedule, Energy). Chart-Lib-Ersatz (Chartist/frappe) würde Design-Regressions erzeugen. Bei Bedarf später → Phase 4B der Roadmap.

### 3.4 persistent_notifications als Incoming-Quelle

Card zeigt nur, was HA selbst als `persistent_notification.*` erzeugt. Keine eigene Regel-Engine. Wer "Licht zu lange an" will → erstellt HA-Automation, die `persistent_notification.create` aufruft → Card zeigt es automatisch. Backend macht die Arbeit.

### 3.5 Toast-Gate am richtigen Pfad

Zwei parallele Service-Call-Pfade: `DataProvider.callService` (dead code im UI) und `DetailViewWrapper.handleServiceCall` (tatsächlich genutzt). Toast-Gate muss am genutzten Pfad sein. Audit in v1.1.1216 hat das korrigiert; in v1.1.1217 wurde der tote Pfad gesäubert.

### 3.6 Preact-Compat-Bug: `<label>`+`<input type="checkbox">` feuert onChange doppelt

Konkret im `CircularSlider.PowerToggle`: ein Click → zwei `onChange` → zwei Service-Calls an HA + zwei Toasts. Das ist ein bekannter Edge-Case von Preact-Compat mit iOS-Style-Toggles. Fix: 150 ms-Timestamp-Dedupe im Wrapper, fängt das Duplikat-Event ab. **Wichtig als Muster**: wenn wir in Zukunft ähnliche `<label>`+`<input>`-Toggle-Patterns bauen, immer Dedupe-Ref dazu.

### 3.7 DetailView `item` vs. `liveItem`

`useMemo` in `DetailView.jsx` baut `liveItem` aus `useEntities()` – reaktiv auf state_changed-Events. Aber vier Stellen (DetailHeader, EntityIconDisplay, TabNavigation, ContextTab) hingen noch am statischen `item`-Prop. Resultat: Quick-Stats zeigten "100 % Helligkeit" obwohl Licht längst aus. Konsequent überall `liveItem` verwenden — so verteilen sich die rAF-Batched state_changed-Updates bis in die UI.

### 3.8 System-Entities: Race-Condition beim Init

`initializeDataProvider` macht `await systemRegistry.initialize(...)`. Ein paralleler `useEffect` für `hass.connection` triggert aber `loadEntitiesFromHA()` – der ruft intern `getSystemEntities()` auf. Wenn Registry da noch nicht fertig ist, gibt es den 2-Entity-Fallback → News/Todos/Versionsverlauf etc. fehlen bis zum nächsten Re-Load. Fix: useEffect zusätzlich an `isInitialized` koppeln, `hasTriggeredInitialLoadRef` in `loadEntitiesFromHA` selbst setzen.

### 3.9 Doppelter State-Speicher → Sync-Bug

StatsBar-Toggle wurde in `localStorage.statsBarEnabled` geschrieben (für StatsBar.jsx), aber aus `systemSettings.appearance.statsBarEnabled` gelesen (für GeneralSettingsTab). Zur Laufzeit synchronisierte ein Event-Listener beide, aber die persistierten Werte drifteten. Lesson: **immer denselben Source-of-Truth**. Quick-Fix: dual-write. Sauberer Fix später (Migration auf eine Storage-Stelle).

### 3.10 StatsBar + Sidebar gated durch `isExpanded`

Im collapsed-Zustand gibt es nur die Suchleiste. StatsBar und Sidebar tauchen erst auf, wenn der User das Panel öffnet. Ergibt einen viel ruhigeren idle-Zustand des Dashboards.

### 3.11 Sidebar `right: 100% + margin-right`

Vision-Pro-Sidebar klebt mit **konstantem** 12 px Gap am linken Panel-Rand. Bei Hover wächst sie nach links in den freien Bereich. Das Panel bewegt sich nie. CSS-Anchor:

```css
.vision-pro-menu--desktop {
  position: absolute;
  right: 100%;
  top: 50%;
  margin-right: 12px;
  transform: translateY(-50%);
}
```

Kombiniert mit `pointer-events: none` auf dem Wrapper (nur Menu-Pill selbst ist klickbar) beeinflusst die Sidebar das Flex-Layout nie.

### 3.12 `.glass-panel` als geteilte Background-Quelle

StatsBar, expanded Panel, Sidebar, DetailView nutzen alle `.glass-panel`. Das `::before` liest die CSS-Variablen `--background-blur/saturation/brightness/contrast/grayscale` aus, die der User in Appearance-Settings steuert. Konsequenz: **keine eigenen backdrop-filter inline auf Glas-Elementen** — immer nur `.glass-panel` + per-Komponente border-radius-Override.

### 3.13 Cache-TTL kurz halten

Versionsverlauf hing 1 h im localStorage-Cache. Problem: Neue Releases waren bis zu 1 h unsichtbar. Reduziert auf 5 Min. GitHub-raw + HACS-CDN cachen serverseitig, also kein Load-Issue.

---

## 4. Etablierte Conventions

### 4.1 Versionsverlauf auf Englisch (ab v1.1.1220)

User-Wunsch. Alte Einträge (v1.1.1219 und älter) bleiben Deutsch — nicht rückwirkend übersetzt.

### 4.2 Build/Release-Flow

1. Code-Änderung
2. `npm run build` lokal testen
3. Version bumpen in:
   - `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx`
   - `src/system-entities/entities/versionsverlauf/index.js` (`current_version`)
4. Eintrag in `docs/versionsverlauf.md` ganz oben
5. `echo "Y" | ./build.sh` → commit+push+tag+release
6. `docs/versionsverlauf.md` **separat** commit+push (build.sh sieht docs/ nicht)

### 4.3 Glas-Padding

- StatsBar: `12 px 12 px` (mobile) / `12 px 16 px` (desktop)
- Sidebar: `12 px 12 px` (nach v1.1.1237)
- Panel: `glass-panel` default

### 4.4 DetailView-Top-Offset (Desktop mit StatsBar)

Aktuell **64 px** — bewegt sich mit jedem StatsBar-Padding-Change mit. Mobile **57 px**.

### 4.5 Toast-Event-Gates

Jede Toast-Call-Stelle prüft `shouldShowToastFor(eventKey)` aus `src/utils/toastSettings.js`. Event-Keys:

- `haPersistent` – persistent_notification aus HA
- `scenesScripts` – ContextTab scene/script/automation
- `actionSuccess` – DetailViewWrapper Service-Call OK
- `actionError` – DetailViewWrapper Service-Call Fehler
- `favoriteChange` – DataProvider.toggleFavorite
- `scheduleChange` – scheduleUtils CRUD

### 4.6 Sidebar-Shortcuts (Default)

`DEFAULT_SHORTCUT_IDS` in `SearchSidebar.jsx`:
`settings`, `todos`, `news`, `versionsverlauf`, `pluginstore`.
Später pro-Icon konfigurierbar in Settings (Phase 2).

### 4.7 Ausschlussmuster-Seed

First-Run schreibt 5 Default-Patterns in `localStorage.excludedPatterns`, wenn der Key noch nie gesetzt wurde:
`update.*`, `*_battery_level`, `*_linkquality`, `*_rssi`, `*_last_boot`.

---

## 5. Wichtige Dateien und ihre Rolle

### Neu in diesen Sessions

- `src/components/NotificationsPanel.jsx` – Popover für persistent_notifications mit Dismiss (v1.1.1213)
- `src/components/SearchSidebar.jsx` – Vision-Pro-Shortcut-Leiste (v1.1.1230, mehrfach refactored)
- `src/components/tabs/SettingsTab/components/ToastSettingsTab.jsx` – Detail-Seite für Toast-Event-Gates (v1.1.1215)
- `src/utils/toastSettings.js` – Defaults + `shouldShowToastFor` + `getToastDisplayOptions` + `saveToastSettings` (v1.1.1215)
- `src/utils/excludedPatternPresets.js` – Presets + `ensureInitialExcludedPatterns()` (v1.1.1208)
- `docs/PERFORMANCE_ROADMAP.md` – 5-Phasen-Plan, status pausiert (v1.1.1202–1206)
- `postcss.config.cjs` – autoprefixer + purgeCSSPlugin + cssnano, prod-only (v1.1.1202)
- `analyze-bundle.js` (root, temp) – Text-Report aus `dist/bundle-stats.html`

### Stark modifiziert

- `src/providers/DataProvider.jsx` – persistent_notifications State, refresh/dismiss, Toast-Gates, TDZ-Struktur
- `src/components/StatsBar.jsx` – komplett redesignt (Single Pill, widgets-left/avatar-right, Mobile-Rotation)
- `src/components/SearchField.jsx` – Sidebar-Integration, Mobile-Auto-Expand, StatsBar/Sidebar-Gating durch `isExpanded`
- `src/components/DetailView.jsx` – 4 Stellen `item` → `liveItem`
- `src/components/SearchField/components/DetailViewWrapper.jsx` – Toast-Gate am tatsächlich genutzten Service-Call-Pfad
- `src/components/SearchField/hooks/useSearchFieldState.js` – Mobile-Auto-Expand-Init, `isMobileNow()` initial
- `src/utils/suggestionsCalculator.js` – Cold-Start-Fallback mit Priority-Domains
- `src/components/controls/CircularSlider.jsx` – 150 ms-Dedupe gegen Preact-Compat-doppel-onChange
- `src/components/SearchField/SearchField.css` – `.vision-pro-menu*`, `.vpm-*`, `.stats-bar-pill`
- `src/system-entities/entities/news/components/iOSSettingsView.css` – `.ios-navbar { position: relative }` (Title-Centering-Fix)

### Entfernt

- Push-Notifications-Toggle (UI-Leiche, kein Backend) – v1.1.1210
- Originales StatsBar-Notifications-Widget mit hardcoded count=0 (wurde in v1.1.1213 mit echter Quelle ersetzt)
- `src/utils/scheduleHandlers.js` – merged nach `scheduleUtils.js` (v1.1.1205)
- `src/utils/historyDataProcessors.js` – merged nach `historyUtils.js` (v1.1.1205)

---

## 6. Offene Themen

### Auf dem Tisch für die nächste Session

1. **Sidebar Phase 2**: Pro-Icon an/aus + Reihenfolge per Drag in Settings
2. **Toast-Phase 2**: Stumm-Modus für bestimmte Entities (Chip-Liste)
3. **Regelbasierte Notifications**: Card baut HA-Automations ("wenn Licht seit 2 h an → persistent_notification"). Siehe Diskussion in v1.1.1215ff — `Phase 2` der Notifications-Roadmap.
4. **Storage-Migration**: `statsBarEnabled` aus Dual-Write zu einheitlicher `systemSettings.appearance`-Quelle
5. **Performance Phase 5.1**: Chrome Performance Profile auf Handy (braucht User-Session)

### Bewusst verworfen (nicht wieder vorschlagen ohne neuen Anlass)

- **Lazy-Loading / Code-Splitting** – bricht Single-File-HACS
- **framer-motion LazyMotion** – 69 Files, hohes Risiko, moderater Gewinn
- **chart.js → Chartist/frappe** – Design-Regression
- **Icon-Sprite-Sheet** – SMIL-Animationen blockieren Sprite-Ansatz
- **Phase 2 des alten Audits** – war Fishing ohne konkretes Problem

---

## 7. Quick-Start für die nächste Session

### Dem neuen Claude zeigen

1. `docs/SESSION_NOTES_2026-04-19_24.md` (dieses Dokument) – 5 Min Lesen
2. `docs/SESSION_NOTES_2026-04-17_18.md` – die davor, hält weitere Konventionen
3. `docs/PERFORMANCE_ROADMAP.md` – Status: pausiert, Kontext für weitere Perf-Arbeit
4. Aktuelle Version aus `AboutSettingsTab.jsx` (heute: **v1.1.1237**) – mit `grep "ios-item-value\">[0-9]" src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` verifizieren
5. `git log --oneline -30` für kürzeste Kontext-Hinweise

### Neuer Claude soll tun

1. Diese Notes lesen
2. Letzte 10 Einträge in `docs/versionsverlauf.md` scannen (Englisch seit v1.1.1220)
3. Kurz melden dass er „drin" ist

### User-Präferenzen (beobachtet)

- **Sprache**: Chat Deutsch, Versionsverlauf Englisch (seit v1.1.1220)
- **Ton**: Pragmatisch, ehrlich, knapp. Keine Marketing-Phrasen. Bei Fehlversuchen lieber sagen „ich habe mich geirrt" als verteidigen.
- **Workflow**: Kleine, fokussierte Releases. Nicht mehrere Themen vermischen.
- **Visual Bugs**: User schickt oft Screenshots inkl. DevTools-Inspector. Gut lesen — oft ist die Ursache schon im DOM-Tree erkennbar.
- **Mockups**: Bei UI-Änderungen lieber Mockup vor Umsetzung zeigen. User mag pure-CSS-Demos aus Codepen.
- **Iterativ**: Er testet live, meldet Abweichungen (zB `top 54 → 52`, `padding 8 → 12`). Zahlen akzeptieren und nicht diskutieren.
- **Performance-Zahlen**: Ehrlich sein, auch wenn unter Erwartung (Phase 4A -10 KB statt der versprochenen -50 KB).
- **Design-Entscheidungen**: Abbrechen und komplett redesignen ist OK (Sidebar: 3x neu gebaut in einem Tag).

### Release-Mechanik (Gedächtnisstütze)

```bash
# 1. Version bumpen in 2 Dateien + Eintrag in versionsverlauf.md
# 2. Build + Release + Push + Tag + GitHub-Release:
echo "Y" | ./build.sh
# 3. docs/versionsverlauf.md separat committen:
git add docs/versionsverlauf.md && git commit -m "..." && git push
```

`.gitignore` lässt nur `dist/`, `docs/`, `hacs.json`, `README.md`, `info.md` zu. Alles andere (`src/`, `vite.config.js`, `postcss.config.cjs`) ist untracked. Der Build-Step committet nur `dist/fast-search-card.js`.

---

## 8. Status-Übersicht am Ende der Session

### Bundle

| Stand | Version | JS gzip | CSS gzip |
|---|---|---:|---:|
| Baseline | v1.1.1201 | 397 KB | 22 KB |
| Nach Performance-Roadmap | v1.1.1206 | ~360 KB | ~19 KB |
| Ende Session | v1.1.1237 | ~382 KB* | ~20 KB* |

*Leichter Anstieg durch neue Features (Sidebar, Toast-Settings, NotificationsPanel). Netto trotzdem unter der Baseline.*

### Features live

- ✅ persistent_notifications komplett: Widget mit Count, Panel mit Liste+Dismiss, Toast bei Neuem
- ✅ Toast-Einstellungen: 6 Event-Gates, Position, Dauer, Dedupe
- ✅ StatsBar-Redesign: Single Glass-Pill, Avatar rechts, Widgets links, Mobile-Rotation alle 5 s
- ✅ Vision-Pro-Sidebar: Shortcut-Rail zu System-Entities, Desktop (vertikal, hover-expand) + Mobile (horizontal unten)
- ✅ Mobile Auto-Expand Option
- ✅ Cold-Start-Suggestions mit Priority-Domains
- ✅ Ausschlussmuster mit Quick-Add-Presets + First-Run-Seed

### Bekannte offene Baustellen

- Sidebar-Icons sind hartcodiert — Phase 2 = pro-Icon-Konfiguration
- `statsBarEnabled` Dual-Write – funktioniert, sollte aber auf eine Storage-Quelle migriert werden
- Regelbasierte Notifications – diskutiert, noch kein Plan umgesetzt

### User-Feedback im Verlauf

- „ok weiter" (sehr häufig – Go-Ahead-Signal)
- „so scheint okay zu sein" (nach Perf-Phase 1)
- „keine deiner vorschläge gefallen mir" (nach Roadmap-Präsentation – Lazy-Loading abgelehnt)
- „ich will eine file" (HACS-Single-File-Constraint bestätigt)
- „Icons müssen die echten sein" (nach SidebarV1)
- „abstand wie statsbar" (Sidebar-Position an Panel ankoppeln)
- Explizit bedankt: **„heute war ein schöner tag"** — Anlass für diese Notes.

---

## 9. Session-Ende-Checkliste

- [x] Letzter Commit + Push auf `main`
- [x] Tag `v1.1.1237` auf GitHub
- [x] Release mit Asset erstellt
- [x] `docs/versionsverlauf.md` aktuell, Englisch ab v1.1.1220
- [x] `current_version` in Versionsverlauf-Entity hochgezogen
- [x] `docs/PERFORMANCE_ROADMAP.md` als pausiert markiert
- [x] Diese Session-Notes erstellt

---

*Session-Notes geschrieben am 2026-04-24 nach zwei langen Tagen mit 36 Releases. Der nächste Claude sollte hier starten — besonders Abschnitt 3 (Architektur-Entscheidungen) und 4 (Conventions) verhindern, dass gleiche Diskussionen wieder aufgemacht werden.*
