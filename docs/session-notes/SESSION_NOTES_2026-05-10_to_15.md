# Session Notes — 2026-05-10 to 2026-05-15

**Final state:** v1.1.1528. **54 releases** across 6 days (v1.1.1475 → v1.1.1528).

Continuation of SESSION_NOTES_2026-05-09_to_10.md (which covered v1.1.1425–1474). Diese Session ist fast vollständig Bento-Polish + Bento-Rich-Widgets + Bento-Slider. Plus zwei kleinere Side-Quests (Click-Routing-Fixes, ID-Mapping).

Sechs Hauptthemen:

1. **Favoriten-Carousel polish** (1475–1492) — Footer-Slider, 3-Cards-pro-Reihe-Bug, vertikales Zentrieren, gap-Iterationen, hover-state-Iterationen.
2. **Click-Routing für system-entities** (1478, 1484) — `find()` mit OR-Bedingung gegen Multi-Domain-Devices fix, plus `system.{id}`-prefix-Match-Strategy.
3. **Live-Data via DeviceCard** (1479–1487) — die Bento-Live-Widgets rendern jetzt DeviceCard mit aktuellen state/attrs. Sechs Hover-Iterationen bis korrekt.
4. **Rich-Widgets W2** (1512–1517) — Wetter, Todos, News, Versionsverlauf jeweils Apple-Style rich layout. Apple-Farben-Gradients pro Domain.
5. **Apple-Wetter-Style mit Forecast** (1513, 1521) — async `weather.get_forecasts`-Service, Hourly-Strip, Cache-Layer für Slider-Remounts.
6. **Bento Auto-Slider in W2** (1516–1528) — kompletter Slider durch Wetter+News+Todos. Track-Architecture-Refactor in 1525 nach AnimatePresence-Issue. `useDragControls` für Footer-Swipe-Source.

Das Bento-Bento-Block aus dem vorigen Sprint (Slots W1-W4) wurde damit vollständig zu einem polished Apple-Style-System ausgebaut.

---

## Die 6 wichtigsten Lessons der Session

### 1. CSS-Grid mit `fr`-Spalten IMMER mit `minmax(0, fr)` schreiben

In v1.1.1518 zeigte sich: bei `grid-template-columns: 1.353fr 1fr` ohne `minmax(0, fr)` kann Content (z.B. lange News-Headlines mit `white-space: nowrap`) die Grid-Spalte über die `1fr`-Größe **aufblasen**. Bug-Symptom: W2 wuchs auf die volle Viewport-Breite.

CSS-Grid berechnet Spalten in 2 Phasen: track-sizing mit `min-content` als Untergrenze, dann free-space-distribution. Wenn `min-content` größer als `1fr` ist, expandiert die Spalte. `minmax(0, 1fr)` setzt die Untergrenze auf 0 → keine Content-Expansion mehr.

**Audit-Pattern:** bei jedem Grid mit `fr` + dynamischem/variablem Content → von Anfang an `minmax(0, fr)` schreiben. Ist der **Standard-Fix** für jedes „mein Grid wächst über den Container"-Problem.

### 2. `find()` mit OR-Bedingung über mehrere Felder ist gefährlich

v1.1.1478 bug: `devices.find(d => (d.entity_id || d.id) === targetId || d.domain === systemEntity.domain)`. Bei system-entities mit unique domains funktionierte das. Bei normalen HA-Devices (z.B. mehreren Lampen mit `domain: 'light'`) wurde das ERSTE light-Device gefunden statt das mit der exakten entity_id — User klickte auf eine Lampe und es öffnete eine andere.

**Pattern für Click-Routing:** zwei-Stufen-Match statt OR-Bedingung. Erst exact-match, dann domain-Fallback nur wenn nichts gefunden:
```js
let match = devices.find(d => (d.entity_id || d.id) === targetId);
if (!match && systemEntity.domain) {
  match = devices.find(d => d.domain === systemEntity.domain);
}
```

Plus: System-Entities haben zwei ID-Räume — die kurze Registry-ID (`'bambu_lab'`) und das HA-Shape entity_id (`'system.bambu_lab'`). UI-Settings speichern die kurze, das `devices`-Array enthält die lange. Lookup-Code muss beide Räume kennen (Multi-Strategy-Lookup mit `system.{id}`/`plugin.{id}`-Prefix-Test).

### 3. `useState(init)` ist stale bei AnimatePresence-Remount-Zyklen

v1.1.1521 bug: Wetter-Widget zeigt nach mehrfachem Slider-Wechseln plötzlich leeren State („—" temp, keine location). Root cause: `useSystemEntityAttributes` Hook nutzte `useState(() => systemRegistry.getEntityByDomain(domain)?.attributes)`. Beim Mount läuft der init-Function. Bei AnimatePresence `mode="wait"` Remount läuft sie wieder — aber wenn in dem Moment kein update-event gerade gefeuert hat, returnt sie null.

**Fix:** read fresh source on every render via tick-state als re-render-trigger:
```js
const [, setTick] = useState(0);
useEffect(() => {
  const handler = (e) => {/* setTick(t=>t+1) on event */};
  window.addEventListener(...);
}, [domain]);
return systemRegistry.getEntityByDomain(domain)?.attributes || null;
```

Plus: für async-loaded data (z.B. Forecast) module-level Cache als initial state → instant display beim Remount, async load läuft im Hintergrund und updated Cache.

### 4. CSS-Hover-Transforms + framer-motion-Drag = visueller Konflikt

v1.1.1523 bug: Slider-Drag „funktionierte nicht" laut User. Diagnose: parent `.bento-widget--rich:hover { transform: scale(1.015) }` setzte einen CSS-transform während User hovert. Wenn framer-motion-drag dann ein `transform: translateX(...)` auf inner Element setzt, ergeben sich composite transforms die den visuellen Drag-Effekt mit der CSS-transition zu „scale" konkurrieren. Plus die `transition: transform 0.2s` smoothet das scale-up während der drag-event aktive ist.

User-Hypothese „kann es daran liegen dass das widget hovert?" stimmte exakt.

**Pattern bei drag-Interactions:** parent-CSS-transforms auf hover IMMER deaktivieren oder via `box-shadow` statt `scale` ausweichen.

### 5. `:has()` Multi-Match-Konflikte: trigger-Klasse weglassen, nicht filtern

v1.1.1526 zeigte: bei Track-Architecture (alle Slider-Items gleichzeitig im DOM) matchen alle `:has(.bento-rich-X)`-Domain-Gradient-Rules gleichzeitig — `:has(.bento-rich-news)` + `:has(.bento-rich-todos)` + `:has(.bento-rich-weather)`. Resultat: zufällig last-wins, User sah unter „Aufgaben"-Slide einen roten News-Gradient-Rahmen.

v1.1.1526 versuchte `:not(.bento-widget--rich-slider):has(...)` als Filter. Greift in modernen Browsern theoretisch — aber Browser-Support für `:not(:has())`-Kombinationen ist inkonsistent. User sah weiter den roten Rahmen.

v1.1.1527 löste es sauber: die `.bento-widget--rich`-Trigger-Klasse beim Slider-Rendering einfach **weglassen**. Dann matcht das outer Slider-Wrapper KEINE der `:has()`-Rules mehr — kein Filter nötig.

**Pattern bei CSS-Selektor-Konflikten:** nicht versuchen mit `:not()` zu filtern — die Trigger-Klasse beim Rendering kontextabhängig weglassen. Saubere Schicht-Trennung.

### 6. Track-Architecture > AnimatePresence-mode="wait" für swipeable Carousels

v1.1.1525 Refactor: BentoRichSlider von AnimatePresence (1 Item zur Zeit gemounted, fade-in/out) zu Track-Architecture (alle items side-by-side, Track translateX).

Symptom mit AnimatePresence: User drag → motion.div verschiebt sich, aber „dahinter" ist nichts → sieht aus wie Item entgleitet aus Widget heraus. Plus: AnimatePresence remountet bei jedem Item-Wechsel die Children → state-loss + async-fetch-restart (Wetter-Forecast).

Track-Architecture löst BEIDE Probleme:
- Beim Drag bewegt sich Track, nächstes Item peekt von rechts/links rein (iOS-Style).
- Items bleiben permanent mounted → state stable, async-fetches passieren einmal.

Plus mit `useDragControls`: outer-Wrapper kann pointer-events einfangen und drag auf inner Track triggern. Damit ist auch der Footer-Bereich swipe-source ohne dass der Footer mitbewegt wird.

**Pattern für swipeable Page-Carousels:** Track-Architecture mit `useDragControls` für externe drag-Sources.

---

## Release-Blöcke

### Block A — Favoriten-Carousel Polish (1475–1495)

Iterationen am bestehenden Favoriten-Widget (W1) aus der vorigen Session.

| Version | Theme |
|---|---|
| 1475 | „Footer mit Slider": Page-Dots in eigenen Footer-Bereich (analog Header), Cards 15px Abstand. Plus Icon ohne rote Box (User: „kein rotes button, nur das herz in weiss"). |
| 1476 | 3 Cards/Reihe für ALLE Widget-Größen (User: „3 karten pro reihe! nicht eine einzige karte!"). |
| 1477 | CSS-Grid mit `minmax(0, 1fr)` — erste Anwendung des Patterns. flex-wrap durch CSS-Grid ersetzt nachdem framer-motion drag wrapper die min-width:130 von DeviceCardGridView trotz `min-width:0 !important` durchschlüpfen ließ. |
| 1478 | Click-Routing-Bug fix: `find()` mit OR-Bedingung returnte das falsche Device bei multi-domain (Pattern: Zwei-Stufen-Match). |
| 1479 | Bento-Widgets rendern jetzt DeviceCard für live-data — bisher statisches Icon+Name. devices als Prop durchgereicht, isLiveDevice-check erkennt HA-shape devices. |
| 1480 | Hover identisch zum Suchpanel — outer motion.div whileHover entfernt (kein scale 1.015 auf wrapper), Card-eigener Hover (background-lighten + ::before gradient) greift. |
| 1481 | (irreparabel) System-entity hover-Override versucht — Aufgaben (todos) hat `hoverColor === activeColor` in appearanceConfig → kein bg-change beim hover. Plus rich-Layout-Versuch. |
| 1482 | Revert v1481 — User wollte Carousel-style hover (nur scale, kein bg), nicht erzwungener Lighten. Plus `overflow:hidden` vom Live-Wrapper entfernt (clipping). |
| 1483 | Non-active inactive devices im Live-Widget: bg-change unterdrückt damit alle Slots gleich aussehen beim hover. |
| 1484 | ID-Mapping-Fix: System-Entity-IDs als `system.{id}` Prefix-Lookup ergänzt. Vorher: Bambu/Stein/Klima fanden ihren live-Device nicht weil UI-Settings-id war `bambu_lab`, devices-Array hatte `system.bambu_lab`. |
| 1485 | v1483 Override wieder rückgängig — User wollte native DeviceCard hover (incl. bg-change für non-active). Hover-Konsens-Iteration #5. |
| 1486 | glass-panel-Klasse auf Live-Widget für backdrop-blur (analog Suchpanel)… |
| 1487 | …wieder ENTFERNT — glass-panel hat sichtbaren Border + Box-Shadow → „Doppel-Container"-Look. Hover-Konsens-Iteration #6. |
| 1488 | Custom `::before` mit backdrop-filter + dark-overlay statt glass-panel — schöner Hintergrund + kein border... |
| 1489 | …auch ENTFERNT, weil dark-overlay den Hover-Lighten unsichtbar machte. „wie früher" gewählt. |
| 1490 | W1 (Favoriten) +15% breiter via `grid-template-columns: 1.353fr 1fr`. |
| 1491 | 3×3 → 3×2 Cards weil aspect-ratio:1-Cards mit W1's neuer Breite die Höhe sprengten. |
| 1492 | `align-content: start` auf Carousel-Page — Cards oben gepackt statt verteilt. |
| 1493–94 | Carousel padding L/R 14 → 24 → 28 (User-Wunsch mehr Abstand). |
| 1495 | Cards vertikal zentriert (align-content: center). |

### Block B — Favoriten-Header → Footer-Label-Rebuild (1496–1505)

User-Wunsch: Top-Header weg, info im Footer.

| Version | Theme |
|---|---|
| 1496 | Header-Text raus, nur 48px Icon. |
| 1497 | Header KOMPLETT raus, Label „Favoriten 11 Geräte" links im Footer absolute positioniert. |
| 1498 | Label 2-zeilig (area + name analog DeviceCard-Typography). Old Header-CSS aufgeräumt. |
| 1499 | Leerer Header-Spacer 44px zurück (User-Wunsch „header soll doch sein, aber ohne icon oder text"). align-content: start. |
| 1500 | Header 24px (kompakter). 3x3 Cards (cardsPerPage: 9, aspect-ratio:auto + height:100% für rectangular). |
| 1501 | gap 8 → 14, max-height-cap auf Cards. |
| 1502 | gap → 20. Specificity erhöht für aspect-ratio-Override. |
| 1503 | row-gap 32 (asymmetrisch vs col-gap 20)… |
| 1504 | …wieder symmetrisch (User-Wunsch „MUSS GLEICH SEIN"). gap 24, Footer 54px. |
| 1505 | 3x3 → 3x2 Cards zurück. L/R padding 28. Header 20. Sauberes Endlayout. |

### Block C — Bento-Settings Filter + W2 Auto-Slider Konzept (1509, 1516)

| Version | Theme |
|---|---|
| 1509 | Per-Slot-Entity-Filter im Settings-Picker: W1 nur Favoriten/Vorschläge, W2-W4 alles außer Favoriten/Vorschläge/Universal-Devices. |
| 1516 | Neues virtuelles Widget `__rich_slider__` — Auto-Slider durch Wetter/News/Todos in W2 (Settings-Filter: nur in W2 wählbar). 10s autoplay, pause-on-hover, manuelle Dots. |

### Block D — Rich-Widgets Apple-Style (1512–1515)

Domain-spezifische rich-Renderer für W2 (medium slot).

| Version | Theme |
|---|---|
| 1512 | BentoRichWeather, BentoRichTodos, BentoRichNews als initial-version (basic counts + lists). Router via `RICH_DOMAINS` Set. |
| 1513 | **Apple-Wetter-Style** Komplett-Redesign — Stadt+Pfeil oben, 64px Temp, High/Low, Hourly-Forecast-Strip. Async forecast via `weather.get_forecasts` Service. |
| 1514 | Todos im Apple-Reminders-Style (Circle-Icons, Due-Pills), News im Apple-News-Style (Thumbnail + Headline + Source), neu: BentoRichVersions für Versionsverlauf. |
| 1515 | Domain-spezifische Gradient-Backgrounds via `:has()` Selector — Todos Orange, News Red, Versions Purple. Plus contrast-Adjustments für Icon-Bubbles + Pills auf farbigen Backgrounds. |

### Block E — Slider Polish + Architecture-Refactor (1517–1527)

Der Slider hatte erstaunlich viele Iterationen.

| Version | Theme |
|---|---|
| 1517 | Slider-Footer 1:1 wie Favoriten (Label links 2-zeilig, Dots zentriert). Plus rich-widget-width-consistency-CSS. |
| 1518 | News-Spalte expandierte: `minmax(0, ...)` Fix für Grid-Spalten. |
| 1519 | `compact` prop für News+Todos (Header weg im Slider, Counts im Footer-Label). |
| 1520 | Tabs für Todo-Listen, scrollable list, slider-dots rechts statt center. |
| 1521 | Wetter-Widget-Bug nach mehrfachem Sliden: useSystemEntityAttributes-Hook returnte stale null beim Remount. Fix: read fresh registry on every render. Plus module-level Forecast-Cache. |
| 1522 | Slider-Dots wirklich rechts (absolute positioning statt justify-content), Border-Top, Mouse-Drag-Swipe via drag="x" auf inner motion.div. |
| 1523 | Drag funktionierte nicht: parent `.bento-widget--rich:hover { transform: scale(1.015) }` Conflict mit framer-motion-drag-translate. Fix: disable hover-scale für Slider. Plus dragElastic 0.1 → 0.3 für sichtbares Feedback. |
| 1524 | Todos Tabs/List größer, Drag auf Outer-Wrapper damit auch Footer swipe-bar… |
| 1525 | **Track-Architecture-Refactor** — AnimatePresence mit `mode="wait"` (1 item zur Zeit) → flex-Track mit allen Items side-by-side. Plus `useDragControls` damit Outer-pointer-events drag auf inner Track triggern. Gradient via inline-style basierend auf currentEntity.domain. |
| 1526 | Doppel-Container-Bug (rote News-Gradient außen + orange innen): `:not(.bento-widget--rich-slider)` Filter auf Domain-Rules — griff aber unzuverlässig. |
| 1527 | **Cleane Lösung**: `bento-widget--rich`-Klasse beim Slider-Wrapper weglassen — `:has()`-Rules matchen dann gar nicht erst. |

### Block F — News-Widget-Polish (1528)

| Version | Theme |
|---|---|
| 1528 | News: nur ungelesene Articles (`filter(a => !a.read)`), bis zu 6 Items (1 featured + 5 secondary). Plus `flex: 1 → 0 0 auto` auf featured-Block (kein Riesen-Gap mehr). |

---

## Architecture-Decisions

### Slider Track-Architecture (v1.1.1525)

```
.bento-widget--rich-slider                  (transparent, padding 0)
└── .bento-rich-slider                      (gradient via inline-style, padding 16/18)
    ├── .bento-rich-slider-viewport         (overflow:hidden, flex:1)
    │   └── .bento-rich-slider-track        (display:flex, width: N×100%)
    │       ├── .bento-rich-slider-page     (width: 100/N%, height 100%)
    │       │   └── BentoRichWeather (compact)
    │       ├── .bento-rich-slider-page
    │       │   └── BentoRichNews (compact)
    │       └── .bento-rich-slider-page
    │           └── BentoRichTodos (compact)
    └── .bento-carousel-footer--slider      (label links + dots rechts)
```

Drag-Setup:
- `motion.div.bento-rich-slider` (outer) hat `onPointerDown={(e) => dragControls.start(e)}` — pointer events VON FOOTER und Content beide triggern drag
- `motion.div.bento-rich-slider-track` (inner) hat `drag="x"`, `dragControls={dragControls}`, `dragListener={false}` — wird extern via controls aktiviert
- Inner Track bewegt sich visuell, Outer + Footer bleiben fix

### Multi-Strategy-Lookup für System-Entity-IDs

```js
// Settings speichern: 'bambu_lab'
// devices-Array hat: { entity_id: 'system.bambu_lab', ... }

let liveDevice = devices?.find(d => (d.entity_id || d.id) === id);
if (!liveDevice) {
  liveDevice = devices?.find(d =>
    d.entity_id === `system.${id}` ||
    d.entity_id === `plugin.${id}` ||
    d.id === `system.${id}` ||
    d.id === `plugin.${id}`
  );
}
if (!liveDevice) {
  liveDevice = devices?.find(d => d.domain === id);
}
```

Drei-Stufen: exact → prefix → domain-fallback. Domain-fallback bewusst zuletzt (kann falsche Instanz bei multi-instance treffen).

### Module-Level Cache für async-Loads

```js
const weatherForecastCache = new Map();

const BentoRichWeather = (...) => {
  const cached = weatherForecastCache.get(weatherEntityId);
  const [hourly, setHourly] = useState(cached?.hourly || []);
  // ... async loadForecast updates state + cache
};
```

Cache überlebt Component-Remounts. Initial state aus Cache = instant display. Async load läuft im Hintergrund und updated den Cache.

---

## Open Threads / Candidates for next session

### Mehr Rich-Widget-Domains
- Energy Dashboard rich (current consumption, mini-sparkline)
- All-Schedules rich (next-up + 2 upcoming)
- Plus für W3/W4 (small slots) eigene compact variants (Now-Playing, Single-Sensor)

### Mobile
- 2-Spalten Mobile-Layout (aktuell vertikal-Stack)
- Touch-Swipe-Sensitivity tuning (jetzt für Mouse gut, Touch ungeprüft)

### Performance
- Lazy-Mount für off-screen Slider-Items (alle 3 mounten DeviceCard intern — könnte teuer werden bei vielen Sensors)
- Memo-Audit auf BentoRichSlider's items-array recomputation

### Settings/UX
- Drag-to-Reorder Widget-Slots im Settings-Tab
- Long-Press auf Bento-Widget → Quick-Menu (Tauschen / Entfernen / Settings)
- Preview im Settings-Tab (Mini-Bento neben Picker-Listen)

### A11y
- Reduced-Motion: `prefers-reduced-motion: reduce` → instant page-switch, kein slide
- Keyboard-Nav für Slider/Carousel (Pfeiltasten)
- Page-Dots als ARIA-tablist

---

## Build / Release Flow

Alle 54 Releases nach Pattern: `echo "Y" | ./build.sh` + separater commit/push von `docs/version-history/versionsverlauf.md`. Pro Version oft mehrere Iterations-Cycles weil User pixel-genau hin guckt.

Average Cadence: ~9 Releases/Tag während intensiver Bento-Slider-Phase (1517–1528). Cluster von Hover-Konsens-Iterationen v1480–1489 (6 Versionen für einen einzigen UX-Punkt).

---

## Numbers

- **Releases:** 54 (v1.1.1475 → v1.1.1528)
- **Days active:** 6 (May 10 → May 15)
- **Files materially modified:** ~8 (heaviest: `BentoStartView.jsx` + `.css`, `StartScreenSettingsTab.jsx`, `SearchField.jsx`, `useSystemEntityAttributes.js`)
- **New components created:** BentoRichWeather, BentoRichTodos, BentoRichNews, BentoRichVersions, BentoRichSlider. Plus Helpers `formatDueDate`, `formatRelativeTime`, `getSliderItemLabel`, `getSliderGradient`.
- **Functional regressions:** several mid-iteration (hover-state v1480→1485 in 6 Versionen, gradient-conflicts v1525→1527 in 3), all fixed within follow-up releases
- **User-pushbacks:** zahlreich — UX-Details, Apple-Style-Treue, Pixel-perfekte Alignment. Net positiv: forced cleane Lösungen (Track-Arch statt AnimatePresence-Hack, Klasse-weglassen statt :not()-Filter, etc.)
- **LOC delta (est.):** +1200 added across BentoStartView.jsx (Rich-Widgets + Slider), +600 added BentoStartView.css. ~50 net cleanup (alte Header-CSS-Klassen).

---

## Final state

- **Favoriten-Carousel** (W1): 3×2 Cards, 15px Card-Gap (symmetrisch), Footer mit 2-zeiligem Label „Favoriten · N Geräte" + Page-Dots zentriert, kein Top-Header (außer Spacer 20px).
- **W2 Auto-Slider** (optional via Settings): Track-Architecture mit Wetter+News+Todos, 10s autoplay, pause-on-hover, drag-swipe via outer-wrapper (Footer-Drag-Source via useDragControls), Apple-Color-Gradient pro Domain via inline-style mit smooth Cross-Fade-Transition.
- **Wetter-Widget** (single oder im Slider): Apple-Wetter-App-Style mit Stadt+Pfeil, 64px Temperatur, High/Low, Hourly-Forecast-Strip (async via weather.get_forecasts + Module-Cache).
- **Todos-Widget**: Apple-Reminders-Style mit Listen-Tabs (Einkaufsliste/To-Dos), scrollable list aller pending tasks mit Circle-Icon + Due-Pill (Overdue rot hervorgehoben).
- **News-Widget**: Apple-News-Style mit Featured-Article (Thumbnail + 3-line headline + Source · time), bis zu 5 weitere Headlines drunter. Filtert auf ungelesene.
- **Versionsverlauf-Widget**: Latest Version groß + Date + Title + Tags-Pills, 2 vorige Versionen kompakt drunter.
- **Click-Routing**: korrektes Multi-Strategy-Lookup für system-entity IDs (system./plugin. prefix-Match). Plus Click-Routing auf normalen HA-devices fix (kein OR-Bedingung-Bug mehr).

Next session candidates oben; keine offenen blocker-Bugs.
