# Session Notes — 2026-05-16 to 2026-05-17

**Final state:** v1.1.1555. **27 releases** across 2 days (v1.1.1529 → v1.1.1555).

Fortsetzung von `SESSION_NOTES_2026-05-10_to_15.md` (das die Bento-Sprint-Phase v1.1.1475–1528 abdeckte). Diese Session konzentriert sich auf drei große Blöcke:

1. **Bento 576 px Hard-Lock Saga** (v1.1.1530, 1532, 1533–1538, 1546, 1547, 1548, 1551) — sieben Iterationen über zwei Tage bis das Layout endlich sitzt.
2. **System-Entity Polish-Welle** (v1.1.1540–1550) — Scroll-Mask, CustomScrollbar-Positioning, Native-Scrollbar verstecken, Todos kombinierte Filter, News Layout-Vereinheitlichung + Deep-Link, Tipps/Versionsverlauf-Search-Swap.
3. **Calendar System-Entity** (v1.1.1553, 1554, 1555) — komplett neue System-Entity mit Apple-Calendar-Style Tag/Woche/Monat/Jahr-Views, HA `calendar.*`-Aggregator, Bento-Slider-Integration, Event-CRUD via `calendar.create_event` / `calendar.delete_event`, Todos-Style Event-Dialog mit Wheel-Pickern + Sub-Views.

---

## Die 8 wichtigsten Lessons der Session

### 1. Bento `height: 576px` ist nur die Halbe Miete — Children müssen explizit beschränkt werden

Die wiederholte Frustration "trotzdem übersteigen widget 1 und 3 und 4 diese grenze" kam zustande, weil `.bento-grid--desktop { height: 576px }` zwar die Grid-Box-Größe fixiert, aber Children (mit `position: static` oder default overflow) trotzdem visuell überlaufen können. Browser respektieren grid-template-rows, aber Grid-Items mit `min-height` oder intrinsic content height SIND grid-Tracks zu größer als gedacht oder OVERFLOW über sie hinaus.

**Pattern:**
- `height: 576px` + `max-height: 576px` auf den Grid → Box-Größe fix
- `.bento-widget { overflow: hidden; min-height: 0; max-height: 100%; }` → jede Cell ist garantiert von ihrem Child contained
- `.bento-cell--*` mit `min-height: 0; min-width: 0;` → Cells werden nie von min-content ihrer Children hochgetrieben
- Für statischen Content-Overflow reicht das. Für Hover-Scale (1.05) brauchst du `overflow: visible` auf Grid + Cells, sonst werden Ecken geclippt (siehe Lesson 2).

### 2. `overflow: hidden` auf dem Grid ↔ Hover-Scale ist immer ein Trade-off

v1.1.1548: `overflow: hidden` auf Grid + Cells → garantiert keine Spillover. ABER `whileHover: scale(1.05)` an Corner-Widgets wird an Cell-Kante geclippt → rounded-corner-Bug. v1.1.1551: `overflow: hidden` wieder weg → Hover funktioniert, aber wenn .bento-widget nicht selber überflow:hidden + max-height:100% hat, kann statischer Content wieder auslaufen.

**Lösung:** Containment via `.bento-widget` (innen) UND keine `overflow: hidden` auf Grid (außen). Widget-internes Layout (Padding, Cards, Listen) hat schon eigene Constraints. Hover-Scale kann ~5 px über die Bento-Grenze hinaus rendern — akzeptabler Preis.

### 3. `100cqi` referenziert NICHT die eigene Inline-Size

v1.1.1536: Versucht `grid-template-rows: 1fr calc((100cqi - 16px) / 2.353 / 2 - 8px)` mit `container-type: inline-size` auf dem GLEICHEN Element. Funktioniert nicht — `cqi` ist nur in DESCENDANTS auflösbar, nicht selbstreferentiell. Resultat: `calc()` gibt Müll, `grid-template-rows` fällt auf default zurück.

**Anwendung:** Wenn du Container-Queries für die eigene Größe willst, brauchst du einen WRAPPER mit `container-type` + die Query in Children. Oder JavaScript via ResizeObserver (was wir letztlich v1.1.1546 gemacht haben — Row-Height per `setProperty('--w34-row-height', …)` aus einem ResizeObserver).

### 4. `aspect-ratio: 1` auf Grid-Items mit `1fr auto` Rows ist Browser-fragil

v1.1.1537: `.bento-cell--w34 { aspect-ratio: 2.08 }` mit `grid-template-rows: 1fr auto`. Idee: Auto-Row picks intrinsic height via aspect-ratio. Realität: Browser haben uneindeutiges Verhalten — die Höhe wurde manchmal größer als erwartet → Bento überstieg 576 px.

**Pattern:** Wenn das Layout deterministisch sein muss, kein aspect-ratio + auto-Row mixen. Fixe Pixel-Werte (`grid-template-rows: 1fr 200px`) oder JS-getrieben (ResizeObserver setzt eine CSS-Variable).

### 5. Module-Level State überlebt React/Preact Component-Unmounts

v1.1.1552: User klickte Article im News-Slider → DetailView öffnet → Bento unmountet → User schließt → Bento remountet → `useState(0)` für `idx` setzt zurück auf Wetter-Slide. Lästig.

**Fix:** `let sliderPersistedIdx = 0;` als modul-level Variable. `useState(sliderPersistedIdx)` als Initial-Value, `setIdx` wrapper schreibt auch in die Module-Variable. Übersteht Unmount/Remount für die Page-Session.

**Anwendung:** Für UI-State der "irgendwie persistent" sein muss aber nicht durch Reload überleben muss (Carousel-Position, gerade aktiver Tab, scroll-position), ist module-level State der schnellste Weg. SessionStorage/localStorage sind overkill und langsamer.

### 6. Browser-`:active` und Framer-Motion-Drag streiten um Transform

v1.1.1544: User: "wenn ich label klicke bewegt es sich nach unten". Ursache: zwei Quellen produzierten visuell ein "Drücken":
- Browser-Default `:active` auf `<button>` mit `transform: translate(0, 1px)` (UA-Stylesheet) ↔ unser bestehendes `transform: translateY(-50%)` → Composite → Label springt.
- Plus `onPointerDown` an Slider-Wrapper rief `dragControls.start(e)` → Drag-Gesture beim simplen Tap.

**Pattern:**
- `transform: none !important` im :active-State, plus `-webkit-tap-highlight-color: transparent`.
- `onPointerDown={(e) => e.stopPropagation()}` an clickbaren Buttons innerhalb von Drag-Sources.
- `bottom: <px>` statt `top: 50% + transform: translateY(-50%)` zentrieren — keine transform-Composition-Konflikte mehr.

### 7. `useSystemEntityAttributes` Hook + asynchrone Entity-Loads = potenzieller Initial-Render-Miss

v1.1.1550 News-Bug: Tabs (Unread/Read) + CustomScrollbar erschienen erst nach Klick auf ein Article. Grund: NewsEntity lädt articles in `onMount` asynchron. Wenn BentoRichNews vor dem Articles-Update mountet, sieht es `articles=[]` → keine Tabs (`showTabs = hasUnread && hasRead`). Wenn das `system-entity-updated` Event firet bevor unser Hook attached ist (Race-Condition), bleibt der Bento bei leerem State.

**Safety-Net:** Mount-only `useEffect` mit 4 Polls (200/600/1400/2500 ms) bumpt `refreshTick`. Hook liest dann frische Attrs aus der Registry. Greift in jedem realistischen Lade-Szenario.

### 8. HA hat KEIN universelles `calendar.update_event` Service

Beim Calendar-CRUD (v1.1.1553–1555) entdeckt: HA hat `calendar.create_event` und `calendar.delete_event` (letzteres ab 2024.6+ für Calendars mit DELETE_EVENT-Feature-Flag), aber keinen Update-Service.

**Workaround:** Edit-Workflow als `delete + create` implementieren. Funktioniert bei Calendar-Sources mit Delete-Support; bei reinen Read-Only-Sources (z.B. CalDAV ohne Schreibrechte) schlägt der Delete-Step fehl → Edit nicht möglich, Create geht aber separat.

---

## Release-Blöcke

### Block A — DeviceCard Contrast (1529)

Single fix.

| Version | Theme |
|---|---|
| 1529 | DeviceCard off-state Text-Sichtbarkeit: alpha 0.7/0.95/0.7 × opacity 0.5/0.6/0.5 (effektiv 0.35–0.57) → alpha 0.85/1/0.85 × opacity 1. Custom-View-Override damit redundant aber bleibt für Active-State. Base wirkt jetzt in Devices-Tab gleich gut wie in Custom-View. |

### Block B — Bento + Tipps Polish (1530–1532)

| Version | Theme |
|---|---|
| 1530 | Bento carousel gap 24→12 (`.bento-carousel-page`); carousel-dots auf `absolute right:0 bottom:4` (W1+W2); News Rich-Slider Unread/Read-Tabs + 2-zeilige Secondary-Items mit Thumb; Weather Echtzeit-Fix (`hass.states` direkt); `useSystemEntityAttributes` Multi-Instance match; Tipps Card colored + 3-zeilig mit Zufalls-Tipp; Todos Detail-Cards solid bg + Left-Border; Schedules `mask-image` Top/Bottom fade. |
| 1531 | Tipps: area-Row hidden, Titel über Zeile 1+2 (-webkit-line-clamp:2); Todos: 4px Left-Border raus, Background = volle Listen-Farbe; Schedules: Mask nur mit `.is-scrolling`-Klasse + 800 ms debounce. |
| 1532 | Weather robust resolve (`entity.attributes.entity_id` ODER `entity.entity_id`-Präfix); Widget 1 gap zurück auf 24 (Trade-off, dass user beschwerte); News widget `refreshTick` bumps bei window-focus + visibilitychange. |

### Block C — Tipps Deep-Link + 5 s Rotation + Bento Grid Fit (1533, 1534)

| Version | Theme |
|---|---|
| 1533 | Tipps card 5 s setInterval bumpt `tippsRotationTick` → Zufalls-Tipp wechselt; Klick auf Tipps-Card setzt `window.__pendingTippSlug` + dispatched event → TippsView öffnet direkt diesen Tipp. Plus erster (fehlgeschlagener) Bento-Fix: `grid-template-rows: repeat(2, minmax(0, 1fr))` + `align-content: stretch` + aspect-ratio:1→auto-Override → Cards wurden hochkant-Rechtecke. |
| 1534 | Hot-Revert von 1533s Aspect-Ratio-Override. Cards wieder quadratisch. gap:12 bleibt. Memory `project_bento_grid_fixed_height.md` mit "do the math first" Regel angelegt. |

### Block D — Bento 576 px Hard-Lock Saga (1535–1538)

Die mit Abstand frustrierendste Block. 4 Versionen in einem Nachmittag.

| Version | Theme |
|---|---|
| 1535 | `grid-template-rows: 1fr auto` → `2fr 1fr` (deterministische Splits) + `max-height: 576px` + `overflow: hidden`. W34-Widgets `aspect-ratio: 1` entfernt, `height: 100%` füllt Cell. Trade-off: Widgets minimal portrait (201×187). User: NEIN, müssen quadratisch sein! |
| 1536 | Versuch mit container-queries: `container-type: inline-size` + `grid-template-rows: 1fr calc((100cqi - 16px) / 2.353 / 2 - 8px)`. **Funktionierte nicht** weil `100cqi` aufm gleichen Element wo `container-type` deklariert ist nicht selbstreferentiell auflöst. |
| 1537 | Versuch mit `aspect-ratio: 2.08` auf `.bento-cell--w34`. Bento überstieg 576px → User: WAS HAST DU GEMACHT. |
| 1538 | Pragmatischer Fix: `grid-template-rows: 1fr 200px` (fixe Pixel-Höhe). Bei typischen Bento-Breiten ~1000 px sind Widgets 201 × 200 ≈ quadratisch, Bento bleibt fest 576 px. Funktionierte aber nur bei deiner spezifischen Bento-Breite — auf schmalen Screens werden Widgets portrait. |

### Block E — Entity-ID Toggle + System-Entity Polish (1539, 1540)

| Version | Theme |
|---|---|
| 1539 | Tag-Icon-Button am Bottom-Left in `EntityIconDisplay`; Klick toggelt Entity-ID-Anzeige rechts daneben. Marquee-Animation (`useLayoutEffect` checkt `scrollWidth > clientWidth`, doppelte Text-Spans für nahtlosen Loop, 14 s linear infinite, hover pausiert). Mobile-Breakpoint Button 36×36. |
| 1540 | `is-scrolling` Mask auf alle System-Entity-Views (News, Todos, Versionsverlauf, Tipps) — 40 px linear-gradient mask-image Top + Bottom mit 800 ms Debounce; Todos `search`-Button im actionButtons + `searchOpen` State mit AnimatePresence-Slide; Todos overdue items: rotes BG + weißer Text; Versionsverlauf Time-Filter-Zeile entfernt; Tag-Filter bei searchOpen ausgeblendet; CustomScrollbar in Detail-Views von Versionsverlauf + Tipps; container `position: relative` damit Scrollbar INSIDE positioniert; search-from-Detail-Workflow. |

### Block F — Scroll-Mask Behavior + News Search Animation (1541, 1542)

| Version | Theme |
|---|---|
| 1541 | Native Scrollbar versteckt auf weather-view, version-detail-scroll, tipp-detail-scroll. Scroll-Mask-Verhalten umgestellt: `isScrolling = scrollTop > 0` (kein Debounce mehr, kein Bottom-Fade). News Search ternary-swap statt AnimatePresence. Todos search dispatch in TabNavigation ergänzt. Todos overdue solid red bg statt CSS-`!important` Kampf. Versionsverlauf tags-Zeile bei searchOpen ausblenden. Tipps tag-row komplett raus. Search-from-Detail in Versionsverlauf + Tipps wirft erst Detail-View weg dann opens search. |
| 1542 | Tipps + Versionsverlauf Search-Swap auch instant (Ternary statt AnimatePresence/motion). Weather CustomScrollbar (outer `.weather-view` → `overflow: hidden + position: relative`, neuer `.weather-scroll-inner` mit native-scrollbar versteckt + Top-Mask + CustomScrollbar als Sibling). Todos 2-Zeilen-Filter-Bar (Row 1 Status + Profile, Row 2 Backend-Listen). |

### Block G — Todos Overdue red animate + News Polish (1543, 1544, 1545)

| Version | Theme |
|---|---|
| 1543 | Todos overdue: `style={{ background }}` → `motion.initial.backgroundColor` + `motion.animate.backgroundColor`. Motion-native Property statt CSS-`!important` Fight. `box-shadow` von overdue weg → voll roter Block ohne Outline. Todos search ternary-swap (analog news/schedules/tipps). |
| 1544 | News Featured-Item raus, alle Articles im einheitlichen `.bento-rich-news-more` Layout. Thumb 44→56 px, gap title↔meta 3→1 px. Footer-Label `top:50%+transform:translateY(-50%)` → `bottom:4px`. `transform: none` + `tap-highlight: transparent` auf `:active`. PointerDown stopPropagation auf Label + Dots damit Slider-Drag nicht firet. |
| 1545 | News label baseline: `line-height: 1.15 → 1`, `bottom: 4px → 0; padding-bottom: 4px`. Article-Row-Klick: `window.__pendingNewsArticleId` + dispatch + onItemClick(entity). NewsView `loadArticles` checkt pending-id und öffnet direkt den Artikel (mit autoMarkRead-Honoring). |

### Block H — Bento 576 px endgültig (1546, 1547, 1548)

| Version | Theme |
|---|---|
| 1546 | **Richtiger Fix**: ResizeObserver-driven `--w34-row-height`. `BentoStartView` observed Grid-Breite, berechnet `col2 → widgetW = (col2-16)/2`, clamped [120, 260], setzt CSS-Custom-Property. `grid-template-rows: 1fr var(--w34-row-height, 200px)`. Bento total bleibt 576, Widgets quadratisch an jeder Breite. |
| 1547 | **Hotfix**: ich hatte `useRef` in BentoStartView genutzt aber nicht zum import hinzugefügt → `ReferenceError: useRef is not defined` → ganze Card crasht beim Mount. Ein-Zeilen-Fix. |
| 1548 | **User Bug-Report**: trotz height:576px überlaufen W1/W3/W4 sichtbar nach unten. `overflow: hidden` auf Grid + `.bento-cell--w*` Cells + `.bento-widget { min-height: 0; max-height: 100% }` → hartes Clipping. Widget bleibt cell-bounded. Trade-off bekannt: Hover-Scale wird geclippt. |

### Block I — News Scroll + Todos Filter Comb + Hover Fix (1549, 1550, 1551)

| Version | Theme |
|---|---|
| 1549 | News widget article-list vertikal scrollbar via `.bento-rich-news-more--scroll`-Klasse (flex:1, overflow-y:auto, native scrollbar versteckt). `.bento-rich-news { position: relative }`. CustomScrollbar als Sibling. `slice(0, 5)` Limit entfernt. |
| 1550 | Todos `listFilter` als separater State (default null), filterTodos AND-kombiniert mit activeFilter, Row-2-Pills Toggle-Verhalten. News Mount-Polling-Safety-Net 200/600/1400/2500 ms damit Tabs + Scrollbar nach Articles-Load erscheinen. |
| 1551 | **Hover-Scale Bug-Report**: W3/W4 Ecke wird beim Hover geclippt. Fix: `overflow: hidden` von Grid + Cells entfernt. `.bento-widget` bleibt mit overflow:hidden + max-height:100% — statischer Content nicht mehr Problem. Hover-Scale extendiert ~5 px außerhalb, akzeptabel. |

### Block J — Slider Position + Calendar System-Entity (1552, 1553, 1554, 1555)

| Version | Theme |
|---|---|
| 1552 | Slider-Position überlebt unmount/remount via `let sliderPersistedIdx = 0` (modul-level). `useState(sliderPersistedIdx)` als initial-value, setIdx-Wrapper schreibt auch in die Variable. User-Flow: News-Artikel öffnen → zurück → Slider ist noch auf News. |
| 1553 | **NEU: Calendar System Entity**. Apple-Calendar-Style mit Tag/Woche/Monat/Jahr-Views. HA `calendar.*` Aggregator (listCalendars scant `hass.states['calendar.*']`, loadEvents callt `hass.callApi('GET', 'calendars/{eid}?start=…&end=…')` pro Quelle). MonthGrid (6×7 Zellen, today=roter Kreis, selected=roter Highlight, max 3 Event-Dots pro Tag mit Source-Color via Hash). WeekGrid, YearGrid (4×3 Pills), DayHeaderStrip. Event-Liste mit dot+title+meta. Registry-Eintrag, isSystemEntityDomain, appearanceConfig (Apple Red `rgb(255, 59, 48)`), Detail-Header, TabNavigation toolbar dispatch, Translations. |
| 1554 | Calendar Bento-Integration: `BentoRichCalendar` Compact-View (Hero für nächstes Event + 4 secondary). Klick setzt `window.__pendingCalendarEventUid` + onItemClick(entity). `RICH_DOMAINS`, `SLIDER_DOMAIN_ORDER`, `SLIDER_GRADIENTS` (`#E94560 → #8A1538`), `getSliderItemLabel`. Entity-Actions `createEvent` (HA `calendar.create_event` mit timed/all-day Branches) + `deleteEvent` (HA `calendar.delete_event`). Erste `CalendarEventDetail` + `CalendarEventForm` Components (native HTML date/time inputs). |
| 1555 | **Bug**: Calendar fehlt im W2 slider — `findFor`-Mapping listete nur weather/news/todos, calendar fiel in default-null. Fix: `findFor(['calendar'])` + `if (d === 'calendar') return calendar`. **Major Refactor**: Detail + Form zusammengelegt zu `CalendarEventDialog` analog `TodoFormDialog`. iOS-Settings-Container + Navbar + ios-card Rows + Sub-Views (list/startDate/startTime/endDate/endTime/description). `DatePickerWheel` + `TimePickerWheel` (gleiche Wheel-Komponenten wie Todos). 2-Step-Delete-Confirm. Reused `iOSSettingsView.css` + `TodoDetailView.css` für visuelle Match. |

---

## Architecture-Decisions

### Bento 576 px Lock — finaler Stand (post-1551)

```
.bento-grid--desktop {
  grid-template-columns: minmax(0, 1.353fr) minmax(0, 1fr);
  grid-template-rows: 1fr var(--w34-row-height, 200px);
  grid-template-areas: "w1 w2" / "w1 w34";
  gap: 16px;
  height: 576px;
  max-height: 576px;
  /* KEIN overflow: hidden — sonst clippt Hover-Scale */
}

.bento-cell--w1, .bento-cell--w2, .bento-cell--w34 {
  min-height: 0;
  min-width: 0;
  /* KEIN overflow: hidden */
}

.bento-widget {
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;   /* Content-Containment */
}
```

JavaScript-Setter (in BentoStartView):

```js
const ro = new ResizeObserver(() => {
  const w = gridEl.clientWidth;
  const col2 = (w - 16) / 2.353;
  const widgetW = (col2 - 16) / 2;
  const rowH = Math.max(120, Math.min(260, Math.round(widgetW)));
  gridEl.style.setProperty('--w34-row-height', `${rowH}px`);
});
ro.observe(gridEl);
```

Garantien:
- Bento total = `height: 576px` exakt.
- W3/W4 quadratisch (oder near-square am Clamp-Rand 120/260) bei jeder Bento-Breite.
- Hover-Scale (1.05) extendiert leicht außerhalb der Bento-Box — kein Clipping mehr.
- Statischer Widget-Content (Carousel-Cards, Article-Listen) kann nicht aus dem Widget escapieren weil `.bento-widget` selbst `overflow: hidden + max-height: 100%` hat.

### Calendar Entity (post-1555)

```
src/system-entities/entities/calendar/
├── index.jsx                 — Entity-Klasse + Actions
├── CalendarView.jsx          — Main View (Tag/Woche/Monat/Jahr)
├── components/
│   └── CalendarEventDialog.jsx  — Unified Add/Edit-Dialog (Todos-Style)
└── styles/
    └── CalendarView.css
```

Datenfluss:
1. `onMount` → `listCalendars` einmal (Calendars aus hass.states).
2. `CalendarView` mount → `loadEvents` für [rangeForView(mode, anchor)].
3. View-Mode-Wechsel oder anchor-Wechsel → reload.
4. `createEvent` / `deleteEvent` → HA-Service-Call → reload des aktuellen Range.

Bento-Slider-Integration:
- BentoRichCalendar lädt eigenständig 14-Tage-Range, zeigt next-5 upcoming events.
- Klick → window.__pendingCalendarEventUid + onItemClick(entity) → CalendarView → Pickup beim events-Load → Edit-Dialog.

### Slider-Position Persistierung

```js
let sliderPersistedIdx = 0;  // module-level

const BentoRichSlider = (...) => {
  const [idx, setIdxInternal] = useState(sliderPersistedIdx);
  const setIdx = (next) => {
    setIdxInternal((prev) => {
      const value = typeof next === 'function' ? next(prev) : next;
      sliderPersistedIdx = value;
      return value;
    });
  };
  ...
};
```

Übersteht Component-Unmount/Remount für die Page-Session. Reset nur bei vollem Page-Reload.

### useSystemEntityAttributes Robustheit

`useSystemEntityAttributes('news')` Hook:
1. Listens auf `system-entity-updated` (system.<domain> + plugin.<domain> + Multi-Instance via Registry-Lookup).
2. Liest `systemRegistry.getEntityByDomain(domain).attributes` auf jedem Render.

Race-Condition-Safety: Components die das Hook nutzen sollten zusätzlich:
- `focus` + `visibilitychange` Event-Bumps (BentoRichNews v1.1.1532+).
- Mount-only Polling-Safety-Net mit gestaffelten setTimeouts (BentoRichNews 200/600/1400/2500 ms v1.1.1550).

Beide fangen den Fall ab, dass `system-entity-updated` Event vor Listener-Attach gefired wurde.

---

## Open Threads / Candidates für nächste Session

### Calendar Polish
- Custom Left-Panel-Routing: User hat es explizit abgelehnt ("nein das will ich doch nicht; mir gefällt es jetzt so auch"). Skip.
- Event-Detail-Sheet animations polishen (slide-in-from-right wäre vielleicht hübscher als der current snap).
- Recurring Events: HA `calendar.create_event` unterstützt `rrule`. Aktuell ignoriert — könnte als Sub-View hinzugefügt werden.
- Color-Customization pro Calendar (jetzt automatisch via Hash) — Settings-Tab.

### Bento Polish
- Slider-Persistierung könnte auch zwischen Page-Reloads erhalten bleiben via localStorage. Niedrige Prio.
- Mobile-Layout-Pass (aktuell vertikal-Stack, könnte 2-Spalten werden).

### System-Entities allgemein
- Versionsverlauf + Tipps detail-views könnten Inline-Like-Funktionalität bekommen (Markdown-rendering ist da; aber kein "favorite"-Toggle pro Eintrag).
- Globaler "Quick-Search" über alle System-Entities — z.B. Search-Bar im Sidebar?

### Performance
- ResizeObserver in BentoStartView feuert oft (bei jeder Grid-Width-Änderung). Throttling wäre eine Optimierung — niedrige Prio weil kein konkretes Problem.

---

## Build / Release Flow

Alle 27 Releases nach Pattern: `echo "Y" | ./build.sh` + separater commit/push von `docs/version-history/versionsverlauf.md` (englisch ab v1.1.1220). 1547 war ein Hotfix (kein Versionsverlauf-Build, sondern Inline-Fix nach defekt-Crash).

Average Cadence: ~14 Releases/Tag — die Bento-576px-Saga hat besonders viele Mini-Iterationen gefressen (jede einzelne von 1535–1538 war 5–15 Minuten Arbeit + sofortiger User-Feedback-Loop). Calendar-Implementation 1553–1555 war Standard-Pace.

---

## Numbers

- **Releases:** 27 (v1.1.1529 → v1.1.1555)
- **Days active:** 2 (May 16 → May 17)
- **Tag der höchsten Frequenz:** 16. Mai (12 Releases v1529–1540, davon allein 1535–1538 in einem 30-Minuten-Fenster für die Bento-Saga).
- **Files materially modified:** ~25
  - heaviest: `BentoStartView.jsx` (+800 LOC inkl. BentoRichCalendar + ResizeObserver), `BentoStartView.css`, `TodosView.jsx`/`TodosView.css`, `NewsView.jsx`/`NewsView.css`
  - heavy: `calendar/index.jsx`, `calendar/CalendarView.jsx`, `calendar/components/CalendarEventDialog.jsx` (komplett neu)
- **New components created (calendar):** `CalendarEntity`, `CalendarView`, `BentoRichCalendar`, `CalendarEventDialog` (+ obsolete `CalendarEventDetail`/`CalendarEventForm` von 1554 die durch 1555 ersetzt wurden). Plus `EventRow`, `MonthGrid`, `WeekGrid`, `YearGrid`, `DayHeaderStrip` Sub-Components inline.
- **Functional regressions:** v1.1.1547 (`useRef` missing), v1.1.1546 (Cards portrait statt square — Math war richtig aber ResizeObserver lief in Edge-Case), v1.1.1537 (Bento überstieg 576). Alle innerhalb von Stunden gefixed.
- **User-pushbacks:** zahlreich, vor allem 1535–1538 ("WAS HAST DU GEMACHT", "VERSTEHST DU MICH ÜBERHAUPT") — alle berechtigt. Net positiv: forced eindeutige Lösungen (ResizeObserver + JS-driven row-height + Widget-internal overflow:hidden).
- **LOC delta (est.):**
  - BentoStartView.jsx: +700 (BentoRichCalendar, ResizeObserver, refreshTick safety-nets, slider mapping)
  - BentoStartView.css: +400 (calendar styles, scroll-mask rules, fix-iterations)
  - calendar/* komplett neu: ~1500 LOC
  - todos/news/tipps/versionsverlauf/all-schedules JSX+CSS: +500 (scroll mask, search swaps, filter row, overdue, deep-links)
  - Total: ~+3100 LOC, ~-200 LOC cleanup (alte CalendarEventDetail/CalendarEventForm imports nicht mehr aktiv)

---

## Final state

- **DeviceCard** — off-state Text endlich überall lesbar (DeviceCardGridView base rules alpha 0.85/1/0.85 × opacity 1).
- **Bento Grid** — 576 px hart gelocked via height + max-height. W3/W4 quadratisch via ResizeObserver-driven CSS-Variable. Hover-Scale rendert ohne Clipping. Slider-Position übersteht Detail-View-Roundtrips. Calendar im Slider zwischen News + Todos. News widget mit vertikalem Scroll, Article-Klick = Deep-Link in NewsView.
- **System-Entities** — alle 5 (news/todos/versionsverlauf/tipps/calendar) haben:
  - is-scrolling Top-Mask (scrollTop > 0 driven)
  - CustomScrollbar im Container (position: relative)
  - Native Scrollbar versteckt
  - Search-Button im Toolbar (Ternary-Swap mit Filter-Bar, instant)
  - Detail-Views mit eigenem CustomScrollbar
- **Todos** — Search-Button funktional, overdue-items voll rot (motion.animate.backgroundColor), 2-zeilige Filter-Bar (Row 1 Status+Profile, Row 2 Backend-Listen), kombinierte Filter (activeFilter AND listFilter).
- **News** — Uniform 5 Articles im 2-Zeilen-Layout mit 56×56 Thumb + tight title/meta gap, Footer-Label baseline-aligned mit Dots, Article-Klick öffnet direkt den Artikel in NewsView.
- **Calendar** (komplett neu):
  - HA `calendar.*` Aggregator (auto-discovery via hass.states)
  - Day/Week/Month/Year Views mit Apple-Style-Highlights
  - Bento-Slider Compact-View (next-5 events, hero-style + secondary)
  - Apple-Calendar-Style Add/Edit-Dialog (Todos-Style):
    - iOS-Settings-Container, Navbar, ios-card Rows
    - Sub-Views für Calendar/Date/Time/End/Description mit slide-in
    - DatePickerWheel + TimePickerWheel (Wheel-Komponenten von Todos)
    - 2-Step-Delete-Confirm
  - CRUD über HA-Services (`calendar.create_event` + `calendar.delete_event`, Edit = delete+create)

Next session candidates oben; keine offenen blocker-Bugs.
