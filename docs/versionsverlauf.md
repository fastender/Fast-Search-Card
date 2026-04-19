# Versionsverlauf

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
