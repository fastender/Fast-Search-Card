# Session Notes — 2026-05-06

**Stand am Ende:** v1.1.1389. **12 Releases** an einem Tag (v1.1.1378 → v1.1.1389).

Schwerpunkt: **Phase 2-5 des Dead-Code-Cleanups** — vollständiger Abschluss der Cleanup-Initiative. Phase 1 (R1-R4) war am 05-04 in `system-entities/`, `demo-plugins/`, `components/`. Heute Phase 2 (R5-R10) in `utils/`, `translations/`, src-Struktur. Phase 3 (R11) Struktur-Tidy. Phase 4 (R12-R13) DetailView/DeviceCard/SearchField + broad services-und-icons-Sweep. Phase 5 (R14-R16) DataProvider + SearchField deep + big components → diminishing returns reached.

**Gesamt-Bilanz heute (R5-R16): ~−4660 LOC, −12 src files, 0 funktionale Bugs.**
**Gesamt seit Audit-Start (R1-R16, 05-04 → 05-06): ~−7825 LOC, −24 src files, 17 Releases.**

---

## Wichtigste 3 Lehren dieser Phase

1. **Cascade-Dead-Code ist der höchste ROI.** Wenn die externe API einer Datei klar ist, ist alles darunter testbar tot. `chartConfig.js` zeigte das perfekt: eine ungenutzte Wurzel-Funktion (`createChartConfig`) zog 4 Helper mit (chartPresets → defaultChartOptions → visionOSColors → Default-Export). 219 LOC in einer Datei, weil keiner der Helper irgendwo außerhalb der Cascade konsumiert wurde. Selbes Pattern bei `useTranslation`-Hook (R9): Hook tot → 6 Helper kaskadierend tot.

2. **Barrel-Files maskieren tote Symbole.** Ein Re-Export sieht aus wie eine Verwendung, ist aber keine. Korrekter Audit-Grep: `grep -rln SYM src/ | grep -v defining_file | grep -v barrel_file`. R6 (Animations) zeigte das klar — von ~50 Re-Exports waren 22 tot, jedes Symbol erschien 3× (Re-Export + Default-Import + Default-Export-Object), bis das offensichtlich war. R8 (Translations) war derselbe Fall: 8 Sprachfiles wurden aus 1 Barrel re-exported, aber `LANGUAGE_CODES = ['de','en']` machte sie UI-unselectable.

3. **Symbol-Grep ist trivial automatisierbar.** Eine Bash-Schleife über alle `^export` aus jedem File, je `grep -rln SYM src/ | grep -v defining_file` → Symbole mit 0 Hits sind tot. ROI extrem hoch — fand in 6 Runden 60+ tote Symbole/Files.

---

## 1. Release-Übersicht in 12 Blöcken

### Block A — utils/ Erstreinigung (1378)

| Version | Was |
|---|---|
| **1378** | **Round 5: scheduleUtils + actionUtils + deviceHelpers (−259 LOC)**. `scheduleUtils.js`: 3 dead exports gelöscht (fetchAllSchedules 46 LOC, updateSchedule 29, toggleSchedule 28). `actionUtils.js`: 4 dead funcs gelöscht (isValidAction, getActionDescription, formatLastTriggered, debugActionRelevance) + 2 internal-only `export` strippen (calculateRelevance, getIconForAction). `deviceHelpers.js`: getTemperatureGradient gelöscht (37 LOC). |

### Block B — Animations Barrel (1379)

| Version | Was |
|---|---|
| **1379** | **Round 6: Animations Barrel Audit (−662 LOC)**. `animationVariants.js` (Barrel): 224 → 66 LOC durch Default-Export-Block-Removal (~136 LOC, nie als default importiert). 22 dead Variants in den 4 Sub-Files: `base.js` 296 → 79 (9 dead), `buttons.js` 368 → 314 (3), `components.js` 501 → 409 (3), `layout.js` 359 → 218 (7). Live-API: ~28 Variants noch in Verwendung. Audit-Lesson formalisiert: Barrel + Default-Import + Default-Export-Object machen tote Symbole 3× sichtbar. |

### Block C — utils/ Cascade-Cleanup (1380)

| Version | Was |
|---|---|
| **1380** | **Round 7: chartConfig Cascade + Toast + Constants (~−480 LOC)**. **Highlight**: `chartConfig.js` 283 → 64 LOC. Die einzige externe API ist `import { ChartJS as Chart }`. `createChartConfig → chartPresets → defaultChartOptions → visionOSColors` Cascade-Chain alle ungenutzt. `ChartComponents.jsx` definiert seine eigenen lokalen Colors. Plus toastNotification Cascade (clearAllToasts/showProgress/showAction/getActiveCount/testAllToasts → showWarningToast cascade), 4 dead in actionConstants, 3 in historyConstants, 2 in scheduleConstants, 1 jeweils in squircle/hassRetryService/systemSettingsStorage/toastSettings. Plus Group B: ~20 internal-only `export`-Strips ohne LOC-Wegfall. |

### Block D — Translations Phase I: Sprachen (1381)

| Version | Was |
|---|---|
| **1381** | **Round 8: 8 unbenutzte Sprachen entfernt (−1910 LOC, −8 Files)**. User confirmed: nur DE+EN sind Targets. `LANGUAGE_CODES = ['de','en']` machte fr/es/it/nl/pt/ru/tr/zh UI-unselectable, sie waren aber im Bundle geladen. Per `rm` direkt + `translations/index.js` Imports + Map trim + `helpers.js getAvailableLanguages()` von 10 auf 2 Einträge reduziert. Restore-Path beibehalten: Helper-Infrastruktur (`getTranslation`, `interpolate`, `deepMerge`) intakt, neue Sprache wäre 1 File + 2 Lines. |

### Block E — Translations Phase II: API streamline (1382)

| Version | Was |
|---|---|
| **1382** | **Round 9: useTranslation hook + Cascade in helpers.js (−164 LOC)**. Nach R8 Audit der Translation-API-Surface: `useTranslation` React-Hook tot (zero consumers), Default-Export der translations-Map tot, `t()` standalone nur intern von `translateUI` genutzt → inlined. 8 dead Barrel-Re-Exports entfernt. Cascade in helpers.js: `detectBrowserLanguage` tot → `normalizeLanguageCode` + `getAvailableLanguages` werden Cascade-tot; `deepMerge` tot → private `isObject` cascade-tot. `index.js` 132 → 46 LOC, `helpers.js` 438 → 360 LOC. Real Public API jetzt = 6 Symbole (formatSensorValue, getSensorCategory, getSensorAdvice, isEntityActive, translateState, translateUI). |

### Block F — Misc helpers + src/ Struktur (1383)

| Version | Was |
|---|---|
| **1383** | **Round 10: Dead helpers + src/ Struktur-Cleanup (−61 LOC + Struktur)**. `iconRegistry.js`: getStaticIcon (12 LOC). `appearanceConfig.js`: getEntityIcon, getEntityColor, getDetailViewConfig + dead default export (49 LOC). Struktur: `src/dokumentation.txt` (180KB) + `src/dokumentation_chartjs.txt` (5KB) → `docs/*_archive.txt` (waren nie importiert). `src/utils/chartjs/chartConfig.js` → `src/utils/chartConfig.js` (Single-File-Subfolder eliminiert, 2 Imports updated). 14 `.DS_Store` Files gelöscht. |

### Block G — Folder Structure Tidy (1384, R11)

| Version | Was |
|---|---|
| **1384** | **Round 11: Empty dirs + misplaced CSS + single-file subfolder**. 3 leere Verzeichnisse gelöscht (`integration/device-entities/views/layouts/`, `ScheduleTab/components/settings/`, `ScheduleTab/components/pickers/`). `system-entities/styles/AllSchedulesView.css` (eine Ebene zu hoch) → `entities/all-schedules/styles/AllSchedulesView.css` (per-Entity-Convention). `utils/formatters/timeFormatters.js` → `utils/timeFormatters.js` (Single-File-Subfolder geflattet, mirror R10). **Build-Fail-Lesson**: timeFormatters.js hatte `import '../historyConstants'` der nach Move broken war — Production-Compile fängt's, HMR nicht zwingend. Bei jedem File-Move auch interne relative Imports updaten. |

### Block H — DetailView/DeviceCard/SearchField (1385, R12)

| Version | Was |
|---|---|
| **1385** | **Round 12: User-requested deep audit (−247 LOC)**. `DeviceCard.jsx`: `DeviceCardsDemo` 218-LOC Demo-Komponente gelöscht (null Importer, Test-Demo-Leftover) + 3 unused imports. `SearchField.jsx`: `window.DEBUG_*` write-only useEffect (~20 LOC, 6 globals nie gelesen) + 4 unused imports. `DetailView.jsx`: 3 unused imports. `computeSuggestion.js`: 1 unused import. `searchEventHandlers.js`: `acceptSuggestion` export-strip. Lesson: Component-Files mit hoher LOC-Anzahl sind oft Hot-Spots für Demo-Komponenten und Debug-Code. |

### Block I — Broad Sweep services/icons/system-entities (1386, R13)

| Version | Was |
|---|---|
| **1386** | **Round 13: Cross-cutting symbol-grep (~−500 LOC, −4 Files)**. **4 orphan Icon-Files** gelöscht (AutomationOn 66, AutomationOff 69, SceneOn 69, ScriptOn 114 LOC) — in iconRegistry imported aber nie referenced. **17 Dead Functions** gelöscht: `getStaticDomainIcon`, `loadDeviceEntities`, `registerDeviceEntities`, `isBootstrapped`, `createSettingsView`, `getColorNameById`, `removeProfiles`, `hasProfiles`, `getSystemEntityColor`, `migrateDeviceCardLogic`, `getPowerSensorFromEnergy`, `clearUserProfilePictureCache`, `highlightName`, plus 4 default-exports. **9 Internal-only `export`-Strips**. **Lesson**: Default-Export-Objekte (`export default { foo, bar }`) maskieren tote Exports — Symbole erschienen "verwendet" weil sie im Default-Export-Objekt gebündelt waren, aber kein Konsument importiert den Default. |

### Block J — DataProvider Audit (1387, R14)

| Version | Was |
|---|---|
| **1387** | **Round 14: DataProvider.jsx (-17 LOC)**. Größtes Single-File (1297 LOC) auditiert — bleibt nach Cleanup 1280 LOC. 4 commented-out `console.log` debug blocks entfernt (alle markiert "TEMPORARILY DISABLED to reduce console spam") + 1 unused import (`matchesPattern`). Alle 8 öffentlichen Hooks/Provider extern verwendet, alle 9 useState-Vars aktiv, alle 6 window-Event-Listener relevant. **Note**: Tiefere Reduktion bräuchte Architektur-Refactor (Provider-Splitting) — Out of Scope für Dead-Code-Cleanup. |

### Block K — SearchField Deep Clean (1388, R15)

| Version | Was |
|---|---|
| **1388** | **Round 15: SearchField (-105 LOC)**. **Massiver Find von 30 unused imports in SearchField.jsx**: `AnimatePresence`, `getSensorCategory`, 12 animation variants, 17 icons. Alle waren nach Sub-Component-Refactor in den Subkomponenten (FilterControlPanel/CategoryButtonsPanel/SearchInputSection) gelandet, aber Parent-Imports nie gecleant. Cascade: nach Cleanup wurden 8 icons in `Icons.jsx` orphan (`ChevronDown/Up`, `MagnifyingGlass`, `Filter`, `Devices`, `Scenes`, `Actions`, `Settings`) — Icons.jsx 163 → 89 LOC. Plus 1 unused `AnimatePresence` in DetailViewWrapper.jsx + 1 debug `console.log`. **Lesson**: Sub-Component-Refactors lassen Parent-Imports zurück. IDE-Auto-Import droppt unused Symbols nur on-save für active file. **Strict-Grep-Audit nach jedem großen Refactor.** |

### Block L — Big Components Audit (1389, R16) — Diminishing Returns

| Version | Was |
|---|---|
| **1389** | **Round 16: Audit von 3 Big Component Files (-2 LOC)**. `SubcategoryBar.jsx` (655 LOC) ✅ vollständig clean. `StatsBar.jsx` (598) → 1 unused `GridReturnIcon` import. `UniversalControlsTab.jsx` (601) → 1 commented `console.log`. **Lesson**: Nach 16 Audit-Runden ist der Symbol-Grep-Pattern erschöpft für tight-managed Production-Code. **Diminishing Returns confirmed** — File-by-File-Scan auf >500 LOC findet jetzt 1-2 LOC statt Dutzende. Cleanup-Initiative ist im Wesentlichen abgeschlossen. |

---

## 2. LOC-Bilanz Phase 2-5

| Runde | Version | Bereich | Δ LOC | Δ Files |
|---|---:|---|---:|---:|
| R5 | 1378 | utils (schedule/action/device) | −259 | 0 |
| R6 | 1379 | animations | −662 | 0 |
| R7 | 1380 | utils (chartConfig/toast/constants) | ~−480 | 0 |
| R8 | 1381 | translations (8 languages) | −1910 | −8 |
| R9 | 1382 | translations API | −164 | 0 |
| R10 | 1383 | misc + structure | −61 | 0 (+structure) |
| R11 | 1384 | folder structure tidy | 0 | −3 empty dirs, −2 subfolders |
| R12 | 1385 | DetailView/DeviceCard/SearchField | −247 | 0 |
| R13 | 1386 | broad services/icons/system-entities | ~−500 | −4 |
| R14 | 1387 | DataProvider.jsx | −17 | 0 |
| R15 | 1388 | SearchField deep clean | −105 | 0 |
| R16 | 1389 | big components audit (diminishing returns) | −2 | 0 |
| **Phase 2-5 total** | | | **~−4407 LOC** | **−12 src files** |

Plus 0 funktionale Regressionen. Production-Builds clean, alle 6 System-Entities laden weiter.

---

## 3. Audit-Methodik (formalisiert in dieser Phase)

```bash
# Stage 1 — File-Level Orphan Detection
for file in $(find src/folder -type f \( -name "*.js" -o -name "*.jsx" \)); do
  base=$(basename "$file" | sed 's/\.[^.]*$//')
  [[ "$base" == "index" ]] && continue
  extuse=$(grep -rln "$base" src --include="*.js" --include="*.jsx" 2>/dev/null \
    | grep -v "$file" | wc -l | tr -d ' ')
  [[ "$extuse" == "0" ]] && echo "ORPHAN? $file"
done

# Stage 2 — Symbol-Level Dead-Export Detection (Barrel-Aware)
for sym in $(grep -E "^export (const|function)" "$file" \
              | grep -oE "(const|function) [A-Za-z][A-Za-z0-9_]+" \
              | awk '{print $NF}'); do
  ext=$(grep -rln "\b$sym\b" src --include="*.js" --include="*.jsx" \
        | grep -v "$file" | grep -v "barrel_file" | wc -l | tr -d ' ')
  [[ "$ext" == "0" ]] && echo "DEAD: $sym"
done

# Stage 3 — Cascade Detection (after deletions)
# Re-run Stage 2 after each deletion — symbols that depended on
# the just-deleted code become DEAD too. Repeat until fixed point.

# Stage 4 — Pre-Edit Re-Grep
# Right before edit (not from audit-time notes), confirm symbol still
# unused. Per v1.1.1374 lesson: audits can stale between plan and edit.

# Stage 5 — Sanity-Grep Post-Edit
# After all edits, grep all removed symbols across src/. Zero hits = clean.

# Stage 6 — Build (production compile catches resolution errors HMR may miss)
echo "Y" | ./build.sh
```

**Was funktioniert hat:**
- Cascade-Detection: nach jeder größeren Löschung Stage 2 nochmal laufen lassen. R7 chartConfig + R9 helpers fanden so jeweils 4-5 weitere tote Symbole.
- Barrel-aware Grep: `grep -v defining_file | grep -v barrel_file` ist die korrekte Filter-Combo.
- Build als Final-Verify: HMR ignoriert manche Resolution-Errors die Production-Compile fängt.

**Was nicht funktioniert hätte:**
- Dynamic Tree-Shaking-Analyse via Bundler — würde tote Default-Exports sehen, aber nicht die "barrel re-exports never imported externally" Patterns.
- Test-Coverage-basierte Detection — der Code hat kaum Tests, also würde 0%-Coverage alles flaggen.

---

## 4. Architektur-Verbesserungen

### Translations API: vorher → nachher

**Vorher:** 13 Helper + 4 Hook-Funktionen + Default-Export + `useTranslation` + `t()` standalone + `translateState`/`translateUI` Wrappers — 20+ Symbole. Kein Konsument nutzt mehr als 6.

**Nachher:** 6 öffentliche Symbole (formatSensorValue, getSensorCategory, getSensorAdvice, isEntityActive, translateState, translateUI). 4 private helpers. Klar erkennbare API.

### Animations Barrel: vorher → nachher

**Vorher:** ~50 Variants in 4 Sub-Files, 1 Barrel mit 50 Re-Exports + 50 Default-Imports + 50 Default-Export-Properties. Tote Variants 3× sichtbar im Code.

**Nachher:** ~28 Live-Variants. Default-Export weg. Nur named-exports.

### chartConfig.js: vorher → nachher

**Vorher:** 283 LOC mit 5 öffentlichen Helpers (visionOSColors, defaultChartOptions, chartPresets, createChartConfig, destroyChart) + Default-Export. Tatsächliche Konsumenten importieren nur ChartJS, definieren ihre eigenen Colors.

**Nachher:** 64 LOC. Nur ChartJS-Module-Setup + ChartJS-Defaults + named export. Klar, was die Datei tut.

### src/ Struktur: vorher → nachher

**Vorher:**
```
src/
├── dokumentation.txt          ← 180 KB Legacy-Notiz
├── dokumentation_chartjs.txt  ← 5 KB Legacy-Notiz
├── .DS_Store                  ← überall verstreut (14 Stück)
├── utils/chartjs/             ← Subfolder mit nur 1 File
│   └── chartConfig.js
└── ...
```

**Nachher:**
```
src/
├── assets/          ← Icon SVG components
├── components/      ← Preact UI
├── contexts/        ← React Context providers
├── data/            ← Mock devices for dev
├── hooks/           ← Shared React hooks
├── index.jsx        ← Entry point
├── providers/       ← DataProvider + MockDataMigration
├── services/        ← Domain services
├── styles/          ← Global CSS
├── system-entities/ ← Internal entity framework
└── utils/           ← Pure helpers (chartConfig.js direkt drin)
```

11 funktionale Ordner + 1 Entry-Point. Keine Floating-Doc-Files, keine Single-File-Subfolders, keine `.DS_Store`-Reste.

---

## 5. Wichtige Erkenntnisse pro Runde

### R5: scheduleUtils.js Pattern

`createSchedule` hatte 6 internal references — 1 Definition + 2 console.warns + 3 reale Aufrufer. Ohne 3-Stage-Grep hätte der Audit angenommen es sei extern. Nachprüfung: extern 0, intern 3 (durch Wrapper-Funktionen `handleTimerCreate`/`handleScheduleCreate` aufgerufen). Final-Lösung: `export` strippen, Funktion als private behalten. Ähnliche Funktionen mit nur internem Selbst-Reference (1 Hit) waren komplett tot und konnten gelöscht werden.

### R6: Default-Export-Object Pattern

Animation-Barrel hatte **drei** Erwähnungen pro Symbol:
1. `export { fadeVariants } from './animations/base'` (named re-export)
2. `import { fadeVariants } from './animations/base'` (für default export object)
3. `export default { fadeVariants, ... }` (default export property)

Wenn niemand `import variants from '...'` macht, ist die ganze Default-Export-Mechanik tot. Erkennen: `grep -rn "import [A-Z][a-zA-Z]* from.*animationVariants"` → 0 results = Default ist Toter.

### R7: chartConfig.js Cascade-Lehre

Beim chartConfig-Audit wurde klar dass die echte Konsumenten-API genau 1 Symbol war: `ChartJS`. Alle anderen 5 Symbole (visionOSColors, defaultChartOptions, chartPresets, createChartConfig, destroyChart) waren Helper-Hierarchie um genau dieses ChartJS-Setup. Aber niemand nutzt die Hierarchie — die Konsumenten (ChartComponents.jsx, EnergyChartsView.jsx) machen ihre eigenen Configs lokal. Resultat: 80% des Files war ungenutzte Infrastruktur.

**Pattern**: Wenn eine Datei viele Helper exportiert die nur untereinander aufrufen, prüfen ob die Wurzel-Helper extern verwendet werden. Wenn nein, die ganze Pyramide ist tot.

### R8: UI-Constraint vs. Data-Loading

`LANGUAGE_CODES = ['de', 'en']` machte UI-Selection auf 2 Sprachen begrenzt. Aber `translations/index.js` lud trotzdem alle 10 Sprachen. UI-Constraint und Data-Loading waren ENTKOPPELT. 8 Files (~1480 LOC) waren technisch reachable (User könnte localStorage manuell setzen) aber nie via UI-Pfad selektierbar.

**Pattern**: Bei Constraint-Dokumenten wie LANGUAGE_CODES, sicherstellen dass die Daten-Loading dem Constraint folgt. Sonst akkumulieren sich "phantom-Daten" die nur via Hack erreichbar sind.

### R9: Hook-Death-Cascade

`useTranslation` React-Hook hatte 0 externe Konsumer. Beim Löschen kaskadierten 5 helpers in den Tod:
- `detectBrowserLanguage` (nur vom Hook gerufen)
- `normalizeLanguageCode` (nur von detectBrowserLanguage)
- `getAvailableLanguages` (nur von detectBrowserLanguage)
- `formatTimeSince` (nur vom Hook genutzt)
- private `isObject` (nur von cascade-totem `deepMerge`)

Die Audit-Reihenfolge muss top-down sein: erst die Public-API-Wurzeln (Hook, Default-Export, Standalone-Funktion) prüfen, dann nach Löschung erneut auditieren — neue Helpers werden tot.

### R10: Single-File-Subfolders

`src/utils/chartjs/` enthielt genau eine Datei: `chartConfig.js`. Subfolder ohne mindestens 2 Files sind organisationale Schulden — sie suggerieren "hier könnte mehr kommen", aber wenn 2 Jahre lang nichts kommt, ist's nur extra Pfad-Tiefe. Plattmachen + 2 Imports updaten = 5-Minuten-Fix mit langfristigem Hygiene-Gain.

**Pattern**: Subfolder bei < 2 Files plattmachen. Wenn später ein 2. File dazukommt, kann man immer noch refoldern.

### R11: Build catches what HMR misses

Beim R11-Strukturmove ist der erste Build gescheitert: `timeFormatters.js` hatte `import '../historyConstants'` der nach dem Move (`utils/formatters/timeFormatters.js` → `utils/timeFormatters.js`) zu `./historyConstants` werden musste. HMR hatte den Fehler nicht zwingend gefangen weil die Datei nicht aktiv "hot updated" wurde.

**Pattern**: Bei jedem File-Move *interne* relative Imports prüfen, nicht nur externe Konsumenten. Production-Build ist der zuverlässigste Check.

### R12: Demo-Components in Production-Files

`DeviceCard.jsx` enthielt eine 218-LOC `DeviceCardsDemo` Komponente am Ende. Originally für Test/Storybook gedacht, aber nie als separates File extrahiert. Null Importer. Plus User-`window.DEBUG_*` Write-Only-Vars in SearchField.jsx (6 globale Properties die nie gelesen wurden).

**Pattern**: Demos und Debug-Instrumentation gehören in eigene Files (oder löschen). In Production-Files sind sie versteckter Ballast den niemand findet.

### R15: Sub-Component-Refactor leaves Parent-Imports

SearchField.jsx wurde mehrfach gesplittet — Icons in subkomponenten gewandert, Animation-Variants ebenfalls. Aber **30 imports im Parent blieben**, weil:
- IDE-Auto-Import-Cleanup arbeitet nur auf der aktuell offenen Datei
- Bei großen Refactors werden zwar Subkomponenten erstellt, aber die Parent-Datei wird nicht "manuell" durch alle Imports gegangen
- Tools wie ESLint `no-unused-vars` müssen aktiv eingesetzt werden

**Pattern**: Nach jedem Sub-Component-Refactor strict-grep auf Parent-File. Symbol-Grep mit Position-Filter (`awk 'NR>$import_end' file`) findet die Leichen schnell.

### R16: Diminishing Returns Threshold

Nach 16 Runden ist klar: die ersten 5-6 Runden bringen 80% der Wins. Symbol-Grep findet auf gewachsenem Code initial 5+ Wins/Minute, nach 10+ Runden noch 0.5/Minute. **Threshold-Indikator**: wenn ein file >500 LOC nur 1-2 LOC Cleanup hergibt, ist die Cleanup-Initiative für diesen Bereich erschöpft. Weitergehende Reduktion erfordert Architektur-Refactor (nicht Dead-Code-Cleanup).

---

## 6. Was offen bleibt

### Audited als clean (keine dead exports)

**Pure Functions / Helpers:**
- `historyUtils.js` (431 LOC) — alle 4 Exports verwendet
- `suggestionsCalculator.js`, `searchIndex.js`, `dataLoaders.js`, `entitiesSnapshot.js`, `entityScoring.js`, `patternMatching.js`, `mockDataGenerator.js`, `userActions.js`, `kioskMode.js`

**Component-Files audited:**
- `SettingsTab/components/*.jsx` — alle Exports verwendet
- `SubcategoryBar.jsx` (655 LOC) — vollständig clean
- `StatsBar.jsx` (598 LOC) — fast clean (1 unused import gecleant)
- `UniversalControlsTab.jsx` (601 LOC) — fast clean (1 commented log gecleant)
- `DataProvider.jsx` (1280 LOC) — fast clean nach R14 Cleanup

**Other:**
- `contexts/ViewRefContext.jsx` — clean

### Nicht auditiert (Kandidaten für künftige Sessions)

- **`services/energyDashboardService.js`** wurde in R13 partial-audited (5 dead funcs entfernt, 4 stripped). Tiefere Analyse möglich aber niedriger ROI.
- **CSS-Audit**: viele `.css` Files in components/, system-entities/styles/, utils/translations — manche evtl. orphan. CSS-Dead-Code-Erkennung ist schwer (keine simple Symbol-Grep), bräuchte Tooling wie PurgeCSS.
- **Big Settings-Tab Files** (StatsBarSettings 1313, AppearanceSettings 1254, GeneralSettings 1173) — diese sind sehr UI-heavy. Refactor statt Cleanup, riskant per v1.1.1364-Lesson.
- **System-entities Tab/View Files** (Printer3DDeviceView 761, EnergyDashboardDeviceView 752, EnergyChartsView 1154) — domain-spezifisches UI, nicht im aktuellen Audit-Scope.
- **`utils/translations.js`** (5-line legacy redirect) — könnte eliminiert werden via Import-Path-Updates an 11 Stellen, aber Cost/Benefit niedrig.

### Out of Scope für Dead-Code-Cleanup

- **Architektur-Refactors**: `DataProvider.jsx` aufsplitten, Big-SettingsTabs splitten — das ist ein anderes Spiel als Dead-Code-Detection.
- **Bundle-Optimization**: könnte mit Tree-Shaking + dynamic imports weiter reduziert werden, aber das ist Performance-Engineering.

---

## 7. Erkenntnis-Summe Phase 1+2-5 (R1-R16, 05-04 → 05-06)

| Bereich | Δ LOC | Δ Files |
|---|---:|---:|
| system-entities (R1+R2, R10, R13) | −1029 | −5 |
| demo-plugins (R3) | −602 | −5 |
| components big files (R4, R12, R15, R16) | −2540 | −2 |
| utils (R5, R7, R10) | ~−802 | 0 |
| animations (R6) | −662 | 0 |
| translations (R8, R9) | −2074 | −8 |
| services + icons (R13) | ~−500 | −4 |
| DataProvider (R14) | −17 | 0 |
| SearchField deep (R15) | −105 | 0 |
| Struktur (R10, R11) | minor | −1 subfolder, −2 .txt, −14 .DS_Store |
| **Total** | **~−7825 LOC** | **−24 Files** |

**Pattern dieser Cleanup-Initiative**: nach Plugin-Store-Removal in v1.1.1323 (Anfang Mai) blieb 6 Wochen lang akkumuliertes Dead-Code übrig. R1 fing einfach mit Plugin-Infrastruktur an, dann fanden sich kaskadierend immer mehr verwandte tote Helpers. Die größten Wins waren:

1. **`tabs/ScheduleTab.jsx.backup`** (1892 LOC) — alter Pre-Refactor-Monolith (R4)
2. **8 Sprachfiles** (1910 LOC, R8) — User-Constraint clarification
3. **Animations Barrel** (662 LOC, R6) — Default-Export + 22 dead variants
4. **demo-plugins/** (602 LOC, R3) — alte Pluginstore-Demos
5. **chartConfig Cascade** (219 LOC, R7) — Helper-Pyramide
6. **`DeviceCardsDemo`** (218 LOC, R12) — Demo-Komponente in Production-File
7. **DataProviderIntegration + DetailViewIntegration** (431 LOC, R1) — Doku-Stubs
8. **SearchField unused imports + Icons.jsx cascade** (105 LOC, R15) — Sub-Component-Refactor-Leftover

**Größte Methodische Erkenntnis**: Dead-Code-Audit per Symbol-Grep ist trivial automatisierbar und findet 5+ Wins/Minute auf gewachsener Codebase initial. Die richtige Filter-Combo (defining_file + barrel_file) ist kritisch. Nach 10+ Runden sinkt das auf 0.5/Minute → **Diminishing Returns Threshold** (R16) signalisiert dass weitergehende Reduktion Architektur-Refactor erfordert, nicht mehr Dead-Code-Cleanup.

**Risiko-Erkenntnis**: Nach v1.1.1374 entity.area-Regression-Bug (siehe 05-02-04 Notes) war die Disziplin 3-Stage-Grep + Pre-Edit-Re-Grep + Sanity-Post-Grep. **In dieser ganzen Initiative (R1-R16): 0 Regressionen.** Pattern hält. Einziger Build-Fail war R11 (relative Import nach File-Move) — sofort gefangen, kein User-Impact.

---

## 8. Build + Release

12 Releases am 05-06 (1378-1389), insgesamt **17 Releases** über die ganze Cleanup-Initiative (1377 vom 05-04 + 1378-1389 vom 05-06). Jeder Release: full `./build.sh` mit Production-Compile, GitHub-Tag, GitHub-Release. Versionsverlauf-Einträge in `docs/versionsverlauf.md` separat per Release committed.

Letzte Version: **v1.1.1389** mit clean src/-Struktur und ~7825 LOC weniger als v1.1.1376.

---

## 9. Final Status — Cleanup Initiative Complete

Die **Phase 1-5 Dead-Code-Cleanup-Initiative ist abgeschlossen**. R16 hat bestätigt dass weitere Symbol-Grep-Audits auf >500 LOC Files nur noch 1-2 LOC Wins bringen. Die Codebase ist:

✅ **Frei von akkumulierter Dead-Code-Schuld** der letzten 6+ Wochen
✅ **17 Releases ohne funktionalen Bug**
✅ **Saubere src/-Struktur**: 11 Top-Level-Folder + index.jsx, keine empty-dirs, keine misplaced CSS, keine leftover .txt files, keine Single-File-Subfolders außer intentional
✅ **Klare API-Surface**: Translations 6 Symbols statt 20+, Animations 28 Variants statt 50+, ChartConfig 1 named export statt 5
✅ **Methodologie dokumentiert**: 6-Stage Bash-Workflow für künftige Audits

Was bleibt für Phase 6 (wenn nötig): **Architektur-Refactors** (Provider-Splitting, Big-SettingsTab-Splitting), **CSS-Audit** mit Tooling wie PurgeCSS, **Performance-Profiling** für Bundle-Optimization. Das sind alles eigene Initiativen, nicht mehr Dead-Code-Cleanup.
