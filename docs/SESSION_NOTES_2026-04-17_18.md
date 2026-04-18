# Session Notes — 2026-04-17 & 2026-04-18

Zusammenfassung von zwei intensiven Arbeitstagen an der **Fast Search Card**. Von v1.1.1180 bis **v1.1.1201**, 22 Releases mit **Refactorings, Performance-Optimierungen, Design-Überholung, neuer Such-UX, Apple-Splash und Suggestions-v2**.

> Zuletzt aktualisiert nach v1.1.1201 (der ursprüngliche Stand war v1.1.1195; Abschnitte 2 und 3 enthalten die späteren Einträge).

---

## 1. Overview

Das Projekt ist eine Home-Assistant-Custom-Card (Preact + Framer Motion + virtua), die Entitäten durchsuchen, filtern und kontrollieren lässt. Der Grundzustand vor diesen beiden Tagen: funktional, aber mit erheblichen Performance-Lastern (Phone wurde heiß), UX-Rauhheiten in der Suche, und einigen Code-Duplikaten.

Am Ende dieser Session: snappier UI, kühleres Handy, Google-artige Suche, chip-basiertes Filter-Interface, Apple-Hello-Splashscreen.

---

## 2. Releases in chronologischer Reihenfolge

### Tag 1 (2026-04-17): Refactoring + Performance + Search Overhaul

| Version | Titel | Kern |
|---------|-------|------|
| **v1.1.1180** | Code-Refactoring & Duplikate | 761 Zeilen Debug-Scripts raus, slideVariants zentralisiert, localStorage-Utility extrahiert, deviceConfigs Switch-Case konsolidiert |
| **v1.1.1181** | Icon-Diät für GPU | 4 Icons (Motion/Presence Sensor, TVOn/Off) von Endlos-Loop auf One-Shot → 58 → 42 Endlos-Animationen |
| **v1.1.1182** | Flüssig + Google-like Suche | Tier 1 Snappiness (Durations -25%, touch-action, :active scale, content-visibility, memo-Comparator) + komplette Such-Überholung (Intent-Parser, Synonyme, Multi-Word-Fuzzy, persistenter Fuse) |
| **v1.1.1183** | Tier 2 Performance | rAF-Batching state_changed, IndexedDB batch-writes, backdrop-filter contain:paint, memo auf StatsBar/GreetingsBar/SubcategoryBar/ActionSheet |
| **v1.1.1184** | Virtualisierung | `virtua` integriert — DOM-Knoten bei langer Liste: 400+ → ~30 |
| **v1.1.1185** | Gold-Paket | drop console in vite, SVGO-ähnliche Path-Präzision (48 Icons), Search-Result LRU-Cache |
| **v1.1.1186** | Press-Feedback & Prefetch | `pendingActionTracker` mit Pub/Sub (sichtbarer Puls während Service-Call), Detail-View-Prefetch auf Hover/Touchstart |

### Tag 2 (2026-04-18): Search-UX V4 + Design-Feinschliff + Splashscreen

| Version | Titel | Kern |
|---------|-------|------|
| **v1.1.1187** | V4 Search (Chip-Input) | Smart typed Suggestions (Area/Domain/Device), Area-Chip im Input, Ghost-Icon-Prefix, Keyboard-Hints, Mobile Confirm-Button, Card-Name Area-Präfix-Stripping |
| **v1.1.1188** | Kombi-Chips | Domain auch als Chip (war vorher Text-Insert), Area + Domain kombinierbar, unterschiedliche Farben |
| **v1.1.1189** | Scope-Filter-Bug + Chip in Subcategory-Bar | `filterDevices` bekam `devices` statt `scopedDevices` → Fix. Chip wanderte aus Input in die Subcategory-Bar (visuell logischer) |
| **v1.1.1190** | SVG-Icons statt Emojis | Chip-Icons: 📍 → `AreasIcon`, 💡 → `CategoriesIcon` (konsistent mit Filter-Bar-Buttons) |
| **v1.1.1191** | Area-Sensoren im Header | `area.temperature_entity_id` + `humidity_entity_id` aus HA-Registry werden als Werte im Section-Header gerendert (Thermometer + Droplet Icons iconoir-Stil) |
| **v1.1.1192** | Design-Feinschliff + Splashscreen | Zeilen-Abstand 16px, Titel-Padding-bottom 16px, Ghost-Icon SVG statt Emoji, Ghost-Text Case-Match, Sensor-Synonyme + device_class-Filter + grüne Sensor-Chip-Farbe, Splashscreen-Selector (Aus/Standard/Apple Hello) + erste Apple-Hello-Komponente |
| **v1.1.1193** | Hotfix Splash transparent | Hintergrund transparent + Google-Font-Zwischenversuch (Caveat) |
| **v1.1.1194** | Apple-Original-Lettering | chanhdai's offizieller Apple "hello"-Path (2-Stroke mit Pen-Lift) mit `durationScale: 0.7` synchron zu App-Load |
| **v1.1.1195** | Apple-Style UI-Reveal | Blur-to-clear + scale + y-translate + Spring-Physik nach Splash-Drawing-Done. Cross-Fade mit Splash |
| **v1.1.1196** | Auto-Kategorie beim Chip-Create | Sensor-Chip → Sensoren-Kategorie, Actions-Domain → Aktionen, System-Entity → Benutzerdefiniert. Area-Chips triggern keinen Wechsel |
| **v1.1.1197** | Kategorie-Wechsel per Stichwort | Wörter wie „Sensor", „Aktionen", „Benutzerdefiniert" wechseln direkt die Kategorie, **kein** Chip wird erzeugt. Neue `CATEGORY_SYNONYMS`. Priorität: Area > Category > Domain > Device |
| **v1.1.1198** | Bug-Fix Background-Filter (1/2) | `contain: paint` von `.glass-panel/.detail-panel` entfernt + `filter: blur()` aus Reveal-Wrapper — backdrop-filter auf HA-Wallpaper geht wieder |
| **v1.1.1199** | Bug-Fix Background-Filter (2/2) | Auch `scale`/`y` aus Reveal raus, weil framer-motion auch bei identity `transform: matrix(...)` inline setzt → Stacking-Context → backdrop-filter defekt. Reveal jetzt opacity-only |
| **v1.1.1200** | Header-Border Position-Fix | `.search-group-title`: `padding-bottom` → `margin-bottom`, damit die `::after`-Linie direkt unter dem Text sitzt, der Abstand zu Cards darunter |
| **v1.1.1201** | Suggestions v2 | Sofortige Vorschläge (kein minUses), `usage_count`-Bootstrap, exponentielles Decay (`exp(-age/half_life)`), Negative Learning (`suggestion_ignored`-Pattern), Reset-Button in Settings |

---

## 3. Architektur-Entscheidungen (warum wir's so gemacht haben)

### 3.1 Virtualisierung: `virtua` statt `react-window`
**Grund**: virtua (~5 KB gzip) ist modernes Paket, unterstützt externes scroll-container via `scrollRef` prop – das passt zu unserer bestehenden `.results-container`-Struktur, ohne dass wir das Layout umbauen müssen. react-window wäre etwas stabiler dokumentiert aber größer und weniger flexibel für unser Setup.

**Alternative, die wir verworfen haben**: Preact Signals. Grund: Nach rAF-Batching + memo-Comparator + Virtualisierung waren die Haupt-Bottlenecks schon gelöst. Signals hätten nur ~20% inkrementellen Gewinn gegeben bei großer Architektur-Umstellung.

### 3.2 Web Worker für Fuse: Bewusst verworfen
**Grund**: Der serielle Overhead (structuredClone von 400 Entities bei jedem Collection-Update) hätte den Main-Thread-Gewinn wieder weggefressen. Fuse-Calls laufen nach den anderen Optimierungen typischerweise unter 20ms — also kein Frame-Breach.

### 3.3 Apple Hello Splash: chanhdai statt Borel
**Grund**: Borel-Font-Pfade aus fontTools extrahiert gaben zwar verbundene Buchstaben (positiv), aber das Ergebnis wirkte generisch. chanhdai's Apple-Pfade sind das **offizielle macOS Sonoma Lettering** und haben den iconicen "Pen-Lift"-Moment zwischen h-Abstrich und h-Hump. Sprachen: nur "hello" (Apple's universelles Symbol).

**Alternative, verworfen**: Trapti's GSAP-Ellipsen-Stagger. Wäre cool, aber benötigt ein hand-gezeichnetes SVG (das wir nicht haben) + GSAP als zusätzliche Library (~50 KB).

### 3.4 Chips in Subcategory-Bar statt im Input
**Grund**: Chips sind Filter-Elemente, nicht Eingabe-Bestandteile. Sie gehören visuell zu den anderen Filter-Optionen (Alle, Beleuchtung, Schalter). Input bleibt sauber für reinen Text.

### 3.5 Sensor-Chips mit `device_class` statt nur `domain`
**Grund**: Wenn User "Temperatur" tippt, will er **Temperatur-Sensoren**, nicht alle `sensor`-Entities. Ohne device_class wäre der Chip semantisch unsauber (Chip sagt "Temperatur", zeigt aber auch Luftfeuchtigkeit). Implementation: Synonym-Map erweitert mit `{key, domain, device_class, group, words}`, Filter prüft beide Dimensionen.

### 3.6 Press-Feedback statt Optimistic UI
**Grund**: User war explizit gegen Optimistic UI wegen De-Sync-Gefahr. Kompromiss: Sichtbares blaues Pulsieren während Service-Call läuft, aber **echter State-Wechsel nur auf HA-Bestätigung**. Keine Lüge, nur "ich arbeite dran"-Signal.

### 3.7 Card-Cleanup: Area-Präfix-Strip
**Grund**: Cards zeigten „Kinderzimmer Kinderzimmer Licht" (Area-Tag + Area im Namen). Mit Section-Header "Kinderzimmer" ist das 3× redundant. `stripAreaPrefix()` entfernt Area-Name-Prefix aus Entity-Namen, wenn er dort als eigenständiges Wort am Anfang steht.

### 3.8 Auto-Kategorie beim Chip-Create (v1.1.1196)
**Grund**: User tippt „Temperatur" in der „Geräte"-Kategorie → Sensor-Chip wird erzeugt, aber Liste blieb leer, weil Geräte-Kategorie Sensoren ausschließt. `domainChipToCategory()` mappt Chip → Kategorie:
- `group === 'sensor'` → `sensors`
- Domain `automation/script/scene` → `actions`
- Domain `settings/marketplace` → `custom`
- Default → `devices`

Area-Chips triggern **keinen** Wechsel (Räume sind orthogonal zu Kategorien).

### 3.9 Category-Synonyms statt Chip (v1.1.1197)
**Grund**: User wollte Stichwörter wie „Sensor", „Aktionen", „Benutzerdefiniert" für schnellen Kategorie-Wechsel ohne Chip-Overhead. Neue `CATEGORY_SYNONYMS`-Array, eigener Index, eigene Priorität (nach Area, vor Domain). Damit wird „Sensor" nicht mehr zum generischen Sensor-Chip, sondern wechselt direkt. Wer explizit einen generischen Sensor-Chip will, tippt `fühler` oder `messwert`.

### 3.10 Kein transform/filter auf Wrappern mit backdrop-filter-Kindern (v1.1.1198–1199)
**Grund** (bitter gelernt, zwei Bugfixes):
- `contain: paint` auf `.glass-panel` / `.detail-panel` → **bricht** `backdrop-filter`, weil das Element nicht mehr über seine eigenen Grenzen „schauen" kann (Hintergrund-Settings hatten keine Wirkung mehr).
- `filter: blur()` auf einem Wrapper-motion.div → erzeugt neuen Stacking-Context → `backdrop-filter` auf inneren `.glass-panel::before` liest nicht mehr zum HA-Wallpaper durch.
- `transform` (auch `scale: 1` / `y: 0`) auf motion.div → framer-motion setzt INLINE `transform: matrix(...)` → auch identity-matrix erzeugt Stacking-Context → selbes Problem.

**Regel für die Zukunft**: Elemente, die irgendwo `.glass-panel`, `.detail-panel` oder andere `backdrop-filter`-Kinder enthalten, dürfen **nie** `transform`, `filter`, `opacity < 1`, `contain: paint`, `isolation: isolate`, `will-change: transform/filter` haben. Nur `opacity` ist OK (erzeugt Stacking-Context nur während Animation, nicht wenn voll deckend).

### 3.11 Suggestions v2 (v1.1.1201)
**Grund**: Feature war schwach — brauchte 2-5 Klicks bevor überhaupt was erschien, alte Patterns zählten gleichstark wie neue, ignorierte Vorschläge wurden nicht gelernt, keine Reset-Möglichkeit.

**Lösung**:
- `minUses`-Schwelle **entfernt** — jeder Klick kann potenziell Vorschlag generieren, Confidence-Threshold reguliert die Qualität
- **Bootstrap** via `entity.usage_count` wenn Pattern-basierte Ergebnisse zu dünn sind (`< maxSuggestions/2`)
- **Exponentielles Decay** `exp(-age_days / half_life)` mit Half-Lives 28/14/7 je nach learning-rate. Lookback erweitert auf 30/60/90 Tage, aber alte Patterns sind dank Decay schwach gewichtet.
- **Negative Learning**: `DataProvider` speichert `lastShownSuggestionsRef`; bei `device_click` werden NICHT-geklickte Suggestions als `suggestion_ignored`-Patterns gespeichert. Diese ziehen Confidence ab (`weighted_ignored * 0.04 * multiplier`, cap 0.5). Schutz: nur einmal pro Show-Cycle, nur innerhalb 10 Min nach Show.
- **Reset-Button** (rot) in Settings → Vorschläge → Lerndaten, löscht USER_PATTERNS + setzt entity.usage_count/last_used auf 0.

---

## 4. Etablierte Conventions

### 4.1 Chip-Farben (bitte konsistent halten)
- 🔵 **Blau** `rgba(66, 165, 245, …)` — **Area-Chip** (Räume)
- 🟣 **Violett** `rgba(192, 132, 252, …)` — **Domain-Chip / Device** (Licht, Schalter, Klima, …)
- 🟢 **Grün/Teal** `rgba(52, 211, 153, …)` — **Sensor-Chip** (Temperatur, Bewegung, Energie, …)

Jeweils mit `.selected`-Variante (100% Opacity + Shadow-Ring).

**Kategorie-Wörter** (Sensor, Aktionen, Benutzerdefiniert, Gerät) werden **NICHT** zu Chips — sie wechseln nur die Kategorie. Der Ghost-Text für diese Wörter hat kein Icon-Prefix (bewusst, um Chip-vs-Category visuell zu trennen).

### 4.2 Spacing-Werte (finalisiert)
- Vertikaler Abstand zwischen Card-Reihen: **16px** (`.v-row { padding-bottom: 16px !important }`)
- Section-Titel-Padding-bottom: **16px** (`.search-group-title { padding: 8px 0 16px 0 }`)
- Column-Gap (horizontal zwischen Cards): 16px (aus SearchField.css)

### 4.3 Animation-Durations (zentral in `animations/base.js`)
```js
durations = {
  instant: 0.08,  // -25% von Baseline
  fast:    0.15,
  normal:  0.22,
  medium:  0.30,
  slow:    0.38,
  verySlow: 0.52,
};
```

### 4.4 Splashscreen-Timing (bei `durationScale: 0.7`)
- h1 Abstrich: 0.56s
- Pen-Lift-Pause: 0.49s
- h2 + ello: 1.96s
- Hold: 0.3s
- Fade: 0.4s
- **Total: ~3.15s, synchron zur 2.5s App-Load**

### 4.5 UI-Reveal-Animation nach Splash (v1.1.1199+)
**Wichtig**: Nur Opacity animieren – kein scale/y/filter auf dem motion.div Wrapper, sonst bricht backdrop-filter (siehe 3.10).
```js
initial: { opacity: 0 }
animate: { opacity: shouldReveal ? 1 : 0 }
transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] }
```
Der „Apple-Reveal"-Charakter kommt jetzt primär aus der Apple-Hello-Splash-Animation und dem sanften Opacity-Übergang. Das frühere Scale+Y+Spring ist weg (war Kollateralschaden des Bug-Fixes).

### 4.6 Icon-Prefix im Ghost-Text
- `📍` → Area-Match (SVG `AreasIcon`, nicht Emoji)
- `💡` → Domain-Match (SVG `CategoriesIcon`)
- Nichts → Device-Match (um Input-Feld nicht zu überladen)

---

## 5. Wichtige Dateien und ihre Rolle

### Neu erstellt in diesen Sessions
- `src/components/AppleHelloSplash.jsx` — Apple-Hello-Animation (chanhdai Pfade)
- `src/components/SearchField/utils/computeSuggestion.js` — Smart typed Suggestions (Area/Category/Domain/Device)
- `src/components/SearchField/utils/buildVirtualItems.js` — Flat-Item-Adapter für Virtualisierung
- `src/hooks/useColumnCount.js` — Reaktive Spalten-Zahl
- `src/hooks/usePendingAction.js` — Pub/Sub Hook für pending service calls
- `src/utils/pendingActionTracker.js` — Pub/Sub-Tracker-Klasse
- `src/utils/searchIntent.js` — Intent-Parser (Area + Domain)
- `src/utils/searchSynonyms.js` — Synonym-Array mit group+device_class + `CATEGORY_SYNONYMS` (v1.1.1197)
- `src/utils/systemSettingsStorage.js` — localStorage Utility mit Dot-Path
- `src/utils/deviceNameHelpers.js` — `stripAreaPrefix()`
- `src/utils/clearLearningData.js` — Reset-Utility für Predictive Suggestions (v1.1.1201)
- `src/styles/perceivedSpeed.css` — Tier-1 Performance-CSS
- `src/components/SearchField/SearchFieldV4.css` — Chip + Hints + Mobile

### Stark modifiziert
- `src/providers/DataProvider.jsx` — rAF-Batching, areas im State, pendingTracker, loadingRef, IndexedDB batch, `lastShownSuggestionsRef` + `resetLearningData` (v1.1.1201)
- `src/components/SearchField.jsx` — V4-Search-Flow, areaSensorMap, Chip-Rendering in SubcategoryBar, categoryIndex (v1.1.1197)
- `src/components/SearchField/components/SearchInputSection.jsx` — Ghost + Hints + Confirm-Btn + Category-Handling
- `src/components/SearchField/components/GroupedDeviceList.jsx` — Virtualisierung + Area-Sensoren im Header
- `src/components/SubcategoryBar.jsx` — `filterChips` Prop für Area/Domain-Chips
- `src/components/DeviceCard.jsx` — memo-Comparator, pendingHook, prefetch
- `src/hooks/useFuzzySearch.js` — Intent-Pre-Filter, Extended Search, LRU-Cache, Scoring-Mix
- `src/utils/suggestionsCalculator.js` — v2 mit Decay + Bootstrap + Negative Learning (v1.1.1201)
- `src/components/tabs/SettingsTab/components/GeneralSettingsTab.jsx` — Splashscreen-Selector, Reset-Button für Lerndaten
- `src/index.jsx` — Splashscreen-Style-Rendering, Opacity-only Reveal-Motion-Wrapper

### Gebundelt
- **Kein Google-Font** mehr (Borel-Font wieder entfernt in v1.1.1194)
- **virtua** `^0.49.1` als einzige neue npm-Dependency
- Inline-SVG für Apple Hello (keine Assets)

---

## 6. Offene Themen / geplante Ideen

### Für die nächste Session auf dem Tisch
1. **Lazy-Loading**: Chart.js + react-markdown + System-Entities-Views dynamisch laden → -150 bis -200 KB Initial-Bundle. Caveat: `inlineDynamicImports: true` in `vite.config.js` muss evtl. auf Multi-File umgestellt werden. HA-Compatibility testen.

2. **Trapti-Style Ellipsen-Splash** (optional): Wenn User ein hand-gezeichnetes SVG "hallo"/"hello" liefert, können wir mit framer-motion (nicht GSAP!) staggered Ellipsen-Reveal bauen. Alternative zum Apple-Hello.

3. **UI-Reveal-Stagger**: Aktuell revealt die ganze UI als Einheit. Wenn User später mehr Apple-Feel will, könnte StatsBar leicht vor der Suchleiste erscheinen (separate motion.div-Wrapper in SearchField).

4. **Monitoring / Profiling**: Falls Handy noch warm wird, ein Performance-Tab-Profile auf dem Handy machen, dann gezielt optimieren. User hat Anleitung dazu in einer früheren Antwort bekommen.

### Bewusst verworfen (nicht wieder vorschlagen ohne Grund)
- **Preact Signals**: Nach aktuellem Stand kein signifikanter ROI mehr
- **Python HA-Integration**: Löst keine Perf-Probleme, verdoppelt Wartungsaufwand
- **Web Worker für Fuse**: Overhead > Gewinn bei aktueller Dataset-Größe
- **Optimistic UI**: User will Sync mit HA, Press-Feedback reicht

---

## 7. Quick-Start für die nächste Session

Wenn die Session zu 100% Context stürmt und wir in einer neuen anfangen müssen, sollte der User:

### Dem neuen Claude zeigen
1. Diesen Dokument-Pfad: `docs/SESSION_NOTES_2026-04-17_18.md`
2. Aktuelle Version aus `AboutSettingsTab.jsx` (heute: **v1.1.1195**)
3. Den letzten `git log --oneline -20`

### Neuer Claude soll tun
1. Diese Notes komplett lesen (~5 min)
2. `docs/versionsverlauf.md` die letzten 5-10 Einträge scannen
3. Kurz Bescheid geben dass er "drin" ist

### Wenn neue Änderungen gewünscht
- **Sprache**: Deutsch (User schreibt DE, technische Begriffe EN OK)
- **Ton**: Ehrlich, knapp, technisch präzise. Keine Marketing-Sprache.
- **Workflow**: Mehrere Änderungen sammeln im Buffer, dann EIN Release am Ende mit Versionsverlauf-Update
- **Version bumpen**: In `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` + `src/system-entities/entities/versionsverlauf/index.js` (`current_version`)
- **Release**: `echo "Y" | ./build.sh` — das ist der build-und-push-to-github Command
- **Versionsverlauf**: Muss separat committed + gepusht werden (`docs/versionsverlauf.md`), damit die App den Changelog sieht

### User-Präferenzen (beobachtet)
- Mag klare Mockups/Vorschauen **vor** Umsetzung bei größeren UI-Änderungen
- Schätzt ehrliche Einschätzungen über Trade-Offs
- Wurde ungeduldig bei schlecht aussehenden ersten Versuchen (Splash-SVG-Pfade v1.1.1192) → Lieber richtig oder sagen "ich brauche länger"
- Mag iconoir-Stil SVG-Icons (stroke-basiert, cursive-feel)
- Mag transparente Hintergründe (kein dunkler Overlay auf Splash)
- Deutsch-first UI (aber "hello" im Splash ist OK als Apple-Symbol)

---

## 8. Status-Übersicht am Ende der Session

### Bundle
- Size: **~392 KB gzip** (von ~395 KB Anfangs-Baseline)
- Parse-Zeit: deutlich geringer durch drop console + Pfad-Präzision
- Dependencies: +virtua (~5 KB gzip), sonst nichts Neues

### Performance-Metriken (geschätzt basierend auf Code-Änderungen)
- **DOM-Knoten in langer Liste**: 400+ → ~30 (Virtualisierung)
- **State-Update-Rate**: max 60 rAF-Batches/s statt N × setEntities
- **Search-Debounce**: 150ms → 50ms + LRU-Cache
- **Animation-Durations**: -25% (snappier feel)
- **SVG-Endlos-Animationen**: 58 → 42 (-16)
- **Tap-Delay**: 300ms → 0 (touch-action manipulation)

### User-Feedback zwischenzeitlich
- "es ist besser geworden" (nach v1.1.1183)
- "das gefällt mir" (nach v1.1.1186)
- "es gefällt mir sehr gut" (nach v1.1.1194 – Apple Hello)
- Entdeckter Bug: Backdrop-Filter-Settings wirken nicht (v1.1.1198/1199 Bugfix-Serie)
- Gewünschte UX-Verbesserungen: Auto-Kategorie bei Chip (1196), Stichwort→Kategorie (1197), Header-Border-Position (1200)
- Gewünschte Suggestion-Features: Sofort vorschlagen, Decay, Negative Learning, Reset (alle in 1201 geliefert)

---

## 9. Session-Ende-Checkliste

- [x] Letzter Commit + Push auf `main`
- [x] Tag `v1.1.1195` auf GitHub
- [x] Release mit Asset erstellt
- [x] `docs/versionsverlauf.md` aktuell
- [x] `current_version` in Versionsverlauf-Entity hochgezogen
- [x] Diese Session-Notes erstellt

---

*Session-Notes geschrieben am 2026-04-18 nach ~16 Releases in zwei Tagen. Nächste Session: zuerst hier reinlesen.*
