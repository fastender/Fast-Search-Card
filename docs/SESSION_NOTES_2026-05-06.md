# Session Notes — 2026-05-06

**Stand am Ende:** v1.1.1383. **6 Releases** an einem Tag (v1.1.1378 → v1.1.1383).

Schwerpunkt: **Phase 2 des Dead-Code-Cleanups**. Phase 1 (R1-R4) war am 05-04 in `system-entities/`, `demo-plugins/`, `components/`. Heute Phase 2 in `utils/` (verschachteltes Cascade-Dead-Code), `translations/` (Multi-Language-Bereinigung) und `src/`-Strukturpflege.

**Gesamt-Bilanz Phase 2 (heute): ~−3536 LOC, −8 Files, −1 Subfolder, 0 funktionale Bugs.**
**Gesamt seit Audit-Start (R1-R10, 05-04 → 05-06): ~−7332 LOC, −20 Files.**

---

## Wichtigste 3 Lehren dieser Phase

1. **Cascade-Dead-Code ist der höchste ROI.** Wenn die externe API einer Datei klar ist, ist alles darunter testbar tot. `chartConfig.js` zeigte das perfekt: eine ungenutzte Wurzel-Funktion (`createChartConfig`) zog 4 Helper mit (chartPresets → defaultChartOptions → visionOSColors → Default-Export). 219 LOC in einer Datei, weil keiner der Helper irgendwo außerhalb der Cascade konsumiert wurde. Selbes Pattern bei `useTranslation`-Hook (R9): Hook tot → 6 Helper kaskadierend tot.

2. **Barrel-Files maskieren tote Symbole.** Ein Re-Export sieht aus wie eine Verwendung, ist aber keine. Korrekter Audit-Grep: `grep -rln SYM src/ | grep -v defining_file | grep -v barrel_file`. R6 (Animations) zeigte das klar — von ~50 Re-Exports waren 22 tot, jedes Symbol erschien 3× (Re-Export + Default-Import + Default-Export-Object), bis das offensichtlich war. R8 (Translations) war derselbe Fall: 8 Sprachfiles wurden aus 1 Barrel re-exported, aber `LANGUAGE_CODES = ['de','en']` machte sie UI-unselectable.

3. **Symbol-Grep ist trivial automatisierbar.** Eine Bash-Schleife über alle `^export` aus jedem File, je `grep -rln SYM src/ | grep -v defining_file` → Symbole mit 0 Hits sind tot. ROI extrem hoch — fand in 6 Runden 60+ tote Symbole/Files.

---

## 1. Release-Übersicht in 6 Blöcken

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

---

## 2. LOC-Bilanz Phase 2

| Runde | Version | Bereich | Δ LOC | Δ Files |
|---|---:|---|---:|---:|
| R5 | 1378 | utils (schedule/action/device) | −259 | 0 |
| R6 | 1379 | animations | −662 | 0 |
| R7 | 1380 | utils (chartConfig/toast/constants) | ~−480 | 0 |
| R8 | 1381 | translations (8 languages) | −1910 | −8 |
| R9 | 1382 | translations API | −164 | 0 |
| R10 | 1383 | misc + structure | −61 | 0 (+structure) |
| **Phase 2 total** | | | **~−3536** | **−8** |

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

---

## 6. Was offen bleibt

### Audited als clean (keine dead exports)
- `historyUtils.js` (431 LOC) — alle 4 Exports verwendet
- `suggestionsCalculator.js`, `searchIndex.js`, `dataLoaders.js`, `entitiesSnapshot.js`, `entityScoring.js`, `patternMatching.js`, `mockDataGenerator.js`, `userActions.js`, `kioskMode.js`
- `SettingsTab/components/*.jsx` — alle Exports verwendet
- `contexts/ViewRefContext.jsx` — clean

### Nicht auditiert (Kandidaten für nächste Phase)
- **`services/energyDashboardService.js`** (468 LOC) — größtes ungeprüftes Service-File
- **`providers/DataProvider.jsx`** (51KB / ~1500 LOC) — größte Single-File überhaupt, riskant aber potenziell hoher ROI
- **CSS-Audit**: viele `.css` Files in components/, system-entities/styles/, utils/translations — manche evtl. orphan
- **Big Settings-Tab Files** (StatsBarSettings 1313, AppearanceSettings 1254, GeneralSettings 1173) — Refactor statt Cleanup, riskant per v1.1.1364-Lesson
- **`utils/translations.js`** (5-line legacy redirect) — könnte eliminiert werden via Import-Path-Updates an 11 Stellen, aber Cost/Benefit niedrig

---

## 7. Erkenntnis-Summe Phase 1+2 (R1-R10, 05-04 → 05-06)

| Bereich | Δ LOC | Δ Files |
|---|---:|---:|
| system-entities (R1+R2, R10) | −1029 | −5 |
| demo-plugins (R3) | −602 | −5 |
| components (R4, R10 partial) | −2224 | −2 |
| utils (R5, R7, R10) | ~−802 | 0 |
| animations (R6) | −662 | 0 |
| translations (R8, R9) | −2074 | −8 |
| Struktur (R10) | minor | −1 subfolder, −2 .txt, −14 .DS_Store |
| **Total** | **~−7393 LOC** | **−20 Files** |

**Pattern dieser Cleanup-Initiative**: nach Plugin-Store-Removal in v1.1.1323 (Anfang Mai) blieb 6 Wochen lang akkumuliertes Dead-Code übrig. R1 fing einfach mit Plugin-Infrastruktur an, dann fanden sich kaskadierend immer mehr verwandte tote Helpers. Die größten Wins waren:

1. **`tabs/ScheduleTab.jsx.backup`** (1892 LOC) — alter Pre-Refactor-Monolith
2. **8 Sprachfiles** (1910 LOC, R8) — User-Constraint clarification
3. **Animations Barrel** (662 LOC, R6) — Default-Export + 22 dead variants
4. **demo-plugins/** (602 LOC, R3) — alte Pluginstore-Demos
5. **chartConfig Cascade** (219 LOC, R7) — Helper-Pyramide

**Größte Methodische Erkenntnis**: Dead-Code-Audit per Symbol-Grep ist trivial automatisierbar und findet 5+ Wins/Minute auf gewachsener Codebase. Die richtige Filter-Combo (defining_file + barrel_file) ist kritisch.

**Risiko-Erkenntnis**: Nach v1.1.1374 enttity.area-Regression-Bug (siehe 05-02-04 Notes) war die Disziplin 3-Stage-Grep + Pre-Edit-Re-Grep + Sanity-Post-Grep. In dieser Phase 0 Regressionen — Pattern hält.

---

## 8. Build + Release

8 Releases (1378-1383 sind Release-Tags auf GitHub). Jeder Release: full `./build.sh` mit Production-Compile, GitHub-Tag, GitHub-Release. Versionsverlauf-Einträge in `docs/versionsverlauf.md` separat per Release committed.

Letzte Version: **v1.1.1383** mit clean src/-Struktur und ~7332 LOC weniger als v1.1.1376.
