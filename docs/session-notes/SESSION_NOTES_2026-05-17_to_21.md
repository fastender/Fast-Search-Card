# Session Notes — 2026-05-17 to 2026-05-21

**Final state:** v1.1.1576. **20 releases** across 4 active days (v1.1.1557 → v1.1.1576).

Fortsetzung von `SESSION_NOTES_2026-05-16_to_17.md` (das v1.1.1529–1555 abdeckte). Diese Session zerfällt in drei klare Phasen:

1. **Calendar-Dialog Finishing-Touches** (v1.1.1557–1559, May 17) — drei Releases um die in v1.1.1554/1555 ausgelieferten neuen Calendar-System-Entity Event-Dialog-Probleme zu räumen: silent-duplicate beim Edit, falscher Service-Aufruf (`calendar.delete_event` existiert nicht), und ein UX-Pass (Recurrence-Presets, Ort-Sub-View, Title-Quick-Chips, All-Day-Hover-Checkmark).
2. **Mobile-Bento Debug-Saga** (v1.1.1560–1563, May 20) — vier Releases um drei zusammenhängende Bugs zu fixen: kein Height-Cap im mobile Layout (News-Widget füllt Viewport), Sidebar-Pille nicht zentriert, CustomScrollbar unsichtbar auf Touch + bei async-loaded Content. Erforderte zwei Regression-Cycles bevor's stand.
3. **13-Pass Refactor-Marathon** (v1.1.1564–1576, May 21) — der eigentliche Gigant: BentoStartView von 1778 → 200 LOC (-89%) in 3 Passes, dann 9 weitere Files (MusicAssistantPanel, TodosSettingsView, TodosView, GeneralSettingsTab, StatsBarSettingsTab, DataProvider, NewsView, SearchField, TodoFormDialog) durch reines Code-Move auf eine 1281-LOC-Obergrenze runter. Plus 1 Hotfix für eine vergessene `useRef`-Import.

---

## Die 7 wichtigsten Lessons der Session

### 1. Wenn ein HA-Service "not found" sagt, ist das vielleicht kein Server-Bug — sondern unsere Falsch-Annahme über die HA-API

v1.1.1557 zeigte erst nur eine bessere Fehlermeldung ("Service calendar.delete_event not found"). v1.1.1558 die Ursache: **HA hat überhaupt keinen `calendar.delete_event` Service**. Delete und Update auf Calendar-Events laufen ausschließlich über die WebSocket-API:

- `calendar/event/delete` — `hass.connection.sendMessagePromise({ type: 'calendar/event/delete', entity_id, uid, … })`
- `calendar/event/update` — gleiches Pattern mit `event` payload
- `calendar/event/create` — existiert auch, aber `calendar.create_event` als Service ist ebenfalls OK (haben wir behalten).

Pattern: bei HA-Calendar (und vermutlich auch anderen "newer" Domains wie todo) **erst WebSocket-API prüfen** wenn ein Service-Call mysteriös "not found" returnt. Die HA-Docs erwähnen die WS-API oft nur in einer Subzeile.

Konsequenz für unseren Code: das v1.1.1554-Pattern "Edit = delete + create" war schon konzeptuell falsch — bei einem korrekten `update_event` über WS gibt's einen einzigen Aufruf, kein Duplikat-Risiko mehr, recurrence-uid bleibt stabil.

### 2. Touch-Devices erkennen via `(hover: hover)` — nicht via `'ontouchstart' in window`

v1.1.1561: CustomScrollbar sollte auf Touch-Devices immer sichtbar sein (kein Hover-Event = kein opacity-Trigger). Erster Versuch nutzte direkt `'ontouchstart' in window` — funktioniert, aber war fragil (manche Desktops mit Touch-Screen).

Zweiter Versuch v1.1.1562: `window.matchMedia('(hover: hover)').matches === false`. Das ist der CSS-Standard für "Pointer kann nicht hovern" — wahre Touch-Detection, kein false-positive auf Touchscreen-Laptops mit Maus. Plus: dieses Pattern hat schon das CSS, das man parallel verwenden kann.

Wichtig: das matchMedia-Result kann sich zur Laufzeit ändern (Tablet mit Magic Keyboard angedockt). Listener auf `change`-Event nutzen, nicht nur initial-state lesen.

### 3. Mobile height-cap auf der CELL, nicht auf dem WIDGET

v1.1.1560 setzte `max-height: 50vh !important` auf `.bento-widget` im Mobile-Layout. Resultat: das News-Widget war trotzdem 800 px hoch und scrollte nicht intern.

Root-Cause: `.bento-cell--w2` hatte keine fixed height in `.bento-grid--mobile` (flex column, content-sized). `height: 100%` auf dem widget resolvte zu "unknown", `max-height` hatte nichts zum Clampen.

v1.1.1562 hat den Cap eine Ebene höher gesetzt:
```css
.bento-grid--mobile .bento-cell--w1,
.bento-grid--mobile .bento-cell--w2 {
  height: 50vh;
  max-height: 50vh;
  overflow: hidden;
}
```
Damit hat das Widget eine konkrete Zahl gegen die `height: 100%` resolved. Die innere `.bento-rich-news-more--scroll` (`flex:1; min-height:0; overflow-y:auto`) engaged dann sauber.

Pattern: Wenn `max-height` auf einem `height:100%`-Element nicht wirkt, ist der parent contentsized. Cap eine Stufe höher in der Hierarchie.

### 4. `MutationObserver` + delay-probes für async-Content im CustomScrollbar

v1.1.1563: Scrollbar zeigt sich erst nach Article-Klick + Zurück. Mount-Order-Issue:

1. BentoRichNews mountet mit `items = []` (Articles noch nicht da).
2. CustomScrollbar mountet, `scrollHeight === clientHeight`, return null.
3. Articles laden via Polling, Container füllt sich — **Box-Size ändert sich aber nicht** (Cell ist fix 50vh).
4. `ResizeObserver` reagiert nur auf Box-Resize → schweigt.

Fix:
- `MutationObserver` auf den Container (`childList + subtree + characterData`) — feuert wenn Children added werden.
- Plus `requestAnimationFrame(updateScrollbar)` + Probes bei 100/400/1200/2500 ms — gleiches Timing-Pattern wie BentoRichNews' refresh-tick-Polling.

`ResizeObserver` bleibt — ist das richtige Werkzeug für echtes Box-Resize. Aber für "Content rein in stable-sized Container" braucht's `MutationObserver`.

### 5. Refactor-Strategie: 89 % Reduktion durch reine Code-Moves wenn Sub-Komponenten klar abgegrenzt sind

BentoStartView 1778 → 200 LOC in 3 Passes. Schlüssel: das File hatte **6 echte Sub-Components** (Weather/Todos/News/Calendar/Versions/Slider) plus einen Router plus den Per-Slot-Renderer. Jeder Block war intern self-contained — keine Closures über parent state außer was explizit als prop übergeben wurde.

Drei-Pass-Aufteilung war richtig:
- Pass 1: Helpers/Icons/Constants/VirtualItems (low-risk, kein JSX-Move)
- Pass 2: Die 5 Rich-Widgets (jede in eigene Datei)
- Pass 3: Router + Slider + BentoWidget (per-slot renderer)

Jeder Pass eigener Release damit Regression isoliert nachvollziehbar — und prompt half es: v1.1.1570 useRef-Hotfix war eine Regression aus Pass 3, gefunden + behoben innerhalb 5 Min. Wenn alle 3 Passes ein einziger Build gewesen wäre, hätte das Bisecten 30+ Min gekostet.

### 6. Bei Tight-Coupled View-State-Machines stoppt Code-Move bei ~1100–1300 LOC

Files wie TodosSettingsView (1343 nach Pass 5), GeneralSettingsTab (1281), StatsBar (1276), NewsView (1094): das ist nicht mehr Boilerplate, das ist genuine View-Logic mit `currentView`-Switch über 8–11 sub-views, jede sub-view closing über 20–30 parent state-vars.

Pure Code-Move kann hier nicht mehr shrinken. Was bleibt sind strukturelle Patterns:
- **Sub-State pro View** (für isolierte Edit-Dialogs)
- **Context-Lifting** (für truly-shared state)
- Props-Drilling vermeiden (außer für 2-3 props max)

Trade-off: 2–3h Strukturarbeit pro File vs. 15 min Code-Move. Plus echtes Regression-Risiko (siehe useRef-Hotfix auf einem PURE Code-Move). User hat sich entschieden, das in einer separaten Session zu machen — Plan ist in `project_structural_refactor_plan.md` memory.

### 7. Imports nach Refactor systematisch cross-checken — der useRef-Hotfix

v1.1.1570 war eine Regression aus Pass 3: ich habe beim Trimming der Top-Imports `useRef` mit rausgeworfen, obwohl die schlanke BentoStartView selbst noch `useRef(null)` für die grid-container ref nutzt. Result: `Error mounting Fast Search Card: useRef is not defined`.

Quick-Check-Pattern danach:
```bash
for f in <refactored files>; do
  used=$(grep -oE 'use(State|Effect|Ref|Memo|Callback)\b' "$f" | sort -u)
  imported=$(grep -oE "import\s+\{[^}]*\}\s+from\s+'preact/hooks'" "$f" | grep -oE 'use(State|Effect|Ref|Memo|Callback)' | sort -u)
  diff <(echo "$used") <(echo "$imported")
done
```

→ Sollte mit jedem Code-Move-Refactor laufen. Hätte den Hotfix von v1.1.1570 verhindert. Auch der Identifier-Grep aus v1.1.1419-Memory wäre ein generischeres Tool dafür.

---

## Release-Blöcke

### Block A — Calendar Event-Dialog Finishing (1557–1559, May 17)

| Version | Theme |
|---|---|
| 1557 | Beim Edit: wenn `delete_event` failt → abbrechen + Fehler im Dialog zeigen, KEIN silent create danach. Ersetzt das v1.1.1554-Pattern wo create blind durchlief und Duplikate produzierte. Console-Log + dialog-error-pill mit serialisiertem `e.message`. |
| 1558 | Root-Cause-Fix: `calendar.delete_event` ist gar kein Service. Switch auf WS-API `calendar/event/delete` + neues `calendar/event/update` ersetzt die delete+create-Pipeline. `handleSubmitDialog` ruft jetzt `updateEvent` im Edit-Modus (single call, recurrence-uid-erhaltend). |
| 1559 | UX-Polish-Welle: Recurrence-Sub-View mit 5 Apple-Presets (Nie/Täglich/Wöchentlich/Monatlich/Jährlich) — `rrule` field im event-payload. Custom-RRULEs (BYDAY, INTERVAL, …) als read-only "Benutzerdefiniert". Plus: Ort als Sub-View (analog Description), Title-Quick-Chips im Add-Mode (Termin/Meeting/Geburtstag/Arzt/Reise), All-Day-Checkbox Hover-Visibility-Fix. |

### Block B — Mobile-Bento Debug (1560–1563, May 20)

| Version | Theme |
|---|---|
| 1560 | Drei Initial-Fixes: max-height 50vh/30vh auf bento-widgets im Mobile, vision-pro-menu Mobile-Centering (framer style-y überschrieb CSS translateX), Favoriten Empty-State-Text statt 96 px Heart-Bubble. |
| 1561 | Versucht: max-height + overflow:hidden mit !important. CustomScrollbar mit matchMedia hover-Detection. **Beides war Regression** — Desktop verlor seine Scrollbar, Mobile-Cap greift nicht. |
| 1562 | Beide Regressionen behoben: CustomScrollbar zurück auf opt-in `alwaysVisible` prop (default false, BentoRichNews passt `alwaysVisible={isTouchDevice()}` durch). Mobile-Cap auf die `.bento-cell`s statt auf die `.bento-widget`s — Cell muss konkrete Höhe haben damit `height:100%` des Childs auflöst. |
| 1563 | Letztes Stück: Scrollbar erscheint erst nach Article-Klick + Zurück, weil bei initial Mount der Container noch leer war. `MutationObserver` + delay-probes (100/400/1200/2500 ms) lösen das. ResizeObserver bleibt — der hatte nur den falschen Trigger. |

### Block C — 13-Pass Refactor-Marathon (1564–1576, May 21)

12 Refactor-Passes + 1 Hotfix. Pro Pass eigener Release damit Regression nachverfolgbar.

| Version | File | Before → After | Δ |
|---|---|---|---|
| 1564 | BentoStartView Pass 1 (Helpers/Icons/Constants/Virtual-Items) | 1778 → 1553 | -225 |
| 1565 | BentoStartView Pass 2 (5 Rich-Widgets) | 1553 → 826 | -727 |
| 1566 | BentoStartView Pass 3 (Router + Slider + BentoWidget) | 826 → 200 | -626 |
| 1567 | MusicAssistantPanel (constants + icons + 6 sub-components) | 1468 → 1001 | -467 |
| 1568 | TodosSettingsView (icons + 3 section-helpers) | 1460 → 1343 | -117 |
| 1569 | TodosView (settingsStorage + todoHelpers) | 1296 → 1188 | -108 |
| 1570 | **Hotfix: useRef import missing** in BentoStartView | — | — |
| 1571 | GeneralSettingsTab (helpers + 5 load/save pairs) | 1373 → 1281 | -92 |
| 1572 | StatsBarSettingsTab (widget-toggle storage) | 1299 → 1276 | -23 |
| 1573 | DataProvider (selector-hooks + notification extractor) | 1280 → 1177 | -103 |
| 1574 | NewsView (settingsStorage + articleHelpers) | 1219 → 1094 | -125 |
| 1575 | SearchField (localStorage settings readers) | 1211 → 1154 | -57 |
| 1576 | TodoFormDialog (useListFeatures + due-date helpers) | 1155 → 1096 | -59 |

**Top-Files vor der Session:**
1. BentoStartView 1778
2. MusicAssistantPanel 1468
3. TodosSettingsView 1460
4. GeneralSettingsTab 1373
5. deviceConfigs.js 1356 (Konstanten — skip)
6. StatsBarSettingsTab 1299
7. TodosView 1296
8. DataProvider 1280
9. NewsView 1219
10. SearchField 1211

**Top-Files nach der Session:**
1. GeneralSettingsTab 1281
2. StatsBarSettingsTab 1276
3. DataProvider 1177
4. SearchField 1154
5. TodosSettingsView 1343
6. (deviceConfigs.js 1356 — Konstanten, unverändert)
7. TodosView 1188
8. NewsView 1094
9. TodoFormDialog 1096
10. MusicAssistantPanel 1001

Insgesamt **7300 → 5755 LOC** in den 10 Target-Files (Reduktion -21 %), neu verteilt auf **30+ fokussierte Sub-Module**. BentoStartView ist der größte Win (-89 %), die anderen 9 Files je 5–25 %. Sub-Module-Folders neu angelegt:
- `src/components/bento/` (13 Files: constants/helpers/icons/virtualItems/richRouter/BentoWidget + 6 widgets)
- `src/components/controls/ma/` (3 Files: constants/icons/components)
- `src/components/SearchField/utils/settingsReaders.js`
- `src/components/tabs/SettingsTab/components/general/` (helpers + settingsStorage)
- `src/components/tabs/SettingsTab/components/statsbar/widgetStorage.js`
- `src/providers/dataSelectors.js` + `dataNotifications.js`
- `src/system-entities/entities/news/utils/` (settingsStorage + articleHelpers)
- `src/system-entities/entities/todos/components/settings/` (icons + sections)
- `src/system-entities/entities/todos/hooks/useListFeatures.js`
- `src/system-entities/entities/todos/utils/` (settingsStorage + todoHelpers + dueDateHelpers)

---

## Architecture-Decisions

### WS-API über Service-Call für Calendar-CRUD

`calendar/event/{create,update,delete}` als WebSocket-Messages statt `hass.callService('calendar', '...')`. Service-API hat nur `create_event` (existiert), `delete_event` (existiert NICHT), und kein `update_event`. WS-API hat alle drei plus recurrence-id-Support.

Implementation in `calendar/index.jsx` actions:
```js
deleteEvent: async ({ hass, entity_id, uid, recurrence_id, recurrence_range }) => {
  await hass.connection.sendMessagePromise({
    type: 'calendar/event/delete',
    entity_id, uid,
    ...(recurrence_id && { recurrence_id }),
    ...(recurrence_range && { recurrence_range }),
  });
}
```

`createEvent` bleibt auf `hass.callService('calendar', 'create_event', …)` weil der Service existiert und etabliert ist. Nur delete/update gehen über WS.

### CustomScrollbar `alwaysVisible` prop + MutationObserver

```jsx
<CustomScrollbar
  scrollContainerRef={ref}
  isHovered={hoverState}
  alwaysVisible={isTouchDevice()}
/>
```

`alwaysVisible` default false → kein Regression-Risiko für die ~6 anderen CustomScrollbar-Consumer (SearchPanel, sidebar, etc.). Nur Bento-Rich-Widgets passen den prop durch. `isTouchDevice()` ist eine Modul-Level-Helper aus `bento/helpers.js`, kombiniert `matchMedia('(hover: none)')` mit `'ontouchstart' in window` Fallback.

Plus: CustomScrollbar useEffect addet jetzt:
- `MutationObserver(container, { childList, subtree, characterData })` für async Content
- `requestAnimationFrame(updateScrollbar)` für post-paint check
- Setltimeout-Probes bei 100/400/1200/2500 ms als Safety-Net

`ResizeObserver` bleibt — ist immer noch das richtige Werkzeug für echtes Box-Resize.

### Refactor-Pattern: pro Pass eigener Release

13 Refactor-Releases statt 1 Mega-Release. Vorteil: bei Regression hat man eine exakte 1-File-Versions-Bisect statt 1500-LOC-Diff. v1.1.1570 useRef-Hotfix war direkt-zu-Pass-3-zugeordnet, gefixt in 5 min. Build-Cost pro Release: ~25–40 sec — vernachlässigbar.

Plus: jeder Release-Eintrag im versionsverlauf.md enthält die Pre/Post-LOC-Zahl + welche Sub-Module entstanden — eine grep-bare Refactor-History.

---

## Open Threads / Candidates for next session

### Strukturelle Refactors (`project_structural_refactor_plan.md`)

TodosSettingsView (1343 LOC) als Pilot für sub-state + context-lifting Pattern. Bei Erfolg auf StatsBar/NewsView/GeneralSettings ausrollen. **2–3 h pro File**, echtes Regression-Risiko (im Gegensatz zu reinem Code-Move). User-Wunsch: später machen, kein Drängen.

### Calendar-Polish

- RRULE: aktuell nur 5 Presets. Apple-Calendar hat auch "Alle 2 Wochen", "Jeden ersten Freitag" etc. — INTERVAL + BYDAY + UNTIL/COUNT. Custom-RRULE-Editor wäre ein größeres Sub-Feature.
- "All-Day" Toggle-Animation: aktuell instant flip. Apple-Style wäre eine kleine Slide-Animation.
- Multi-Day-Events: aktuell rendern nur am Start-Tag. Bento-Calendar-Widget zeigt sie korrekt, aber CalendarView's Tag-/Wochenview hat sie nur am ersten Tag.

### Mobile-Bento

- Slider-Items lazy-mount (alle 4 Rich-Widgets mountet aktuell parallel, jedes mit eigenem hass-fetch). Could be expensive bei vielen sensors.
- Touch-Swipe-Sensitivity tuning: aktuell ist Velocity-Threshold 400, manchmal zu empfindlich auf Tap-mit-leichtem-Drift.
- Mobile 2-Spalten-Layout für Tablets-im-Portrait (heute vertical-stack komplett).

### Tooling

- `scripts/check-extraction-debt.py` als committed Tool (Identifier-Grep, war in v1.1.1419-Memory als TODO).
- Hook-Import-Cross-Check Script (siehe Lesson 7 — hätte v1.1.1570 verhindert).
- Bundle-Size-Audit nach dem Refactor — die 1.7 MB sind unverändert geblieben, aber das ist ein guter Moment für eine Tree-Shake-Analyse.

### Tests

Kein einziger Test im Projekt. Wenn die strukturellen Refactors ausgerollt werden, wäre Critical-Path-Coverage hilfreich (insbesondere für die 11 sub-views in TodosSettingsView nach dem Split).

---

## Build / Release Flow

Alle 20 Releases via `echo "Y" | ./build.sh` + separater commit/push von `docs/version-history/versionsverlauf.md`. Standard-Cadence. Die 13 Refactor-Releases am Tag 21.05 waren ungewöhnlich dicht — durchschnittlich ~12 min zwischen Build und Build, weil die Code-Moves sich gut parallelisieren ließen (Read + Write + sed-Block-Delete + Edit-Imports + Verify).

Total Build-Zeit der Session: ~14 min für die 20 Builds. Hauptaufwand war das Schreiben der Versionsverlauf-Einträge in English (Memory-Hard-Rule), nicht das Build-Skript.

---

## Numbers

- **Releases:** 20 (v1.1.1557 → v1.1.1576)
- **Days active:** 4 (May 17, 19 [pause], 20, 21)
- **Hotfixes:** 1 (v1.1.1570, useRef-Import)
- **New files created:** ~30 unter `bento/`, `ma/`, `general/`, `statsbar/`, `news/utils/`, `todos/{hooks,components/settings,utils}/`, `providers/data*`, `SearchField/utils/settingsReaders.js`
- **LOC reduktion in den 10 Target-Files:** 7300 → 5755 (-21 %)
- **Größter Single-File-Win:** BentoStartView 1778 → 200 (-89 %)
- **Functional regressions:** 2 (v1.1.1561 CustomScrollbar Desktop-Regression + Mobile-Cap nicht greifend, v1.1.1570 useRef nicht importiert). Beide innerhalb eines Releases gefixt.
- **User-pushbacks:** moderat. Hauptthemen: silent-duplicate beim Calendar-Edit ("delete funktion geht nicht"), Mobile-Bento drei-fach Fix-Cycle, useRef-Mount-Error.
- **Memory-Updates:** 1 neues memory-File (`project_structural_refactor_plan.md`) für die deferred strukturellen Refactors.

---

## Final state

- **Calendar System-Entity** komplett funktional: Create, Update, Delete via richtige HA-WS-API. 5 Recurrence-Presets im Apple-Style. Quick-Chips für Title. Sub-Views für Ort/Beschreibung/Recurrence.
- **Mobile-Bento** rendert sauber: News/Todos/Calendar als 50vh-capped Widgets mit interner Scroll-Liste. CustomScrollbar dauerhaft sichtbar auf Touch, reaktiv auf async-content. Sidebar-Pille zentriert. Favoriten leeres Widget zeigt Text statt 96 px Heart.
- **Codebase strukturell schlanker:** BentoStartView ist ein 200-LOC Coordinator mit 13 fokussierten Sub-Modulen. MusicAssistantPanel hat ein eigenes `ma/`-Subfolder mit 3 Modulen. DataProvider, NewsView, TodosView, GeneralSettingsTab haben ihre pure Helpers in `utils/`-Folders ausgelagert. Keine Datei über 1300 LOC mehr — höchste ist GeneralSettingsTab bei 1281.
- **Bekannter Tech-Debt** dokumentiert in `project_structural_refactor_plan.md`: die verbleibenden 1100–1300 LOC View-State-Machines (TodosSettingsView, NewsView, StatsBar, GeneralSettings) brauchen strukturelle Splits (Sub-State + Context-Lifting), kein Code-Move mehr. User hat sich entschieden, das in einer separaten Session zu machen.

Next session candidates oben; keine blocker-Bugs offen.
