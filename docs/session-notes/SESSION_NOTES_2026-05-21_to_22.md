# Session Notes — 2026-05-21 to 2026-05-22

**Final state:** v1.1.1613. **37 releases** across 2 active days (v1.1.1577 → v1.1.1613).

Fortsetzung von `SESSION_NOTES_2026-05-17_to_21.md` (das v1.1.1557–1576 abdeckte). Diese Session hatte zwei klare Phasen:

1. **Geplante Pipeline** (v1.1.1577–1584, May 21) — die 4-Punkt-Liste aus dem prior Session-End-Vorschlag: Tooling, Mobile-Bento Tablet-Portrait, Calendar Multi-Day-Logik + RRULE-Editor, Bundle-Audit + miniMarkdown.
2. **User-Bug-Marathon** (v1.1.1585–1613, May 21+22) — 29 Releases reagierend auf konkrete Screenshots/Reports vom User. Mix aus UI-Polish, i18n-Fixes, und einem hartnäckigen Bug-Trio (Calendar-Widget-Data-Flow + Outer-Scrollbar-Duo) das jeweils 3–4 Anläufe brauchte.

---

## Die 8 wichtigsten Lessons der Session

### 1. `toEntity()` returnt Plain-Objects, NICHT die SystemEntity-Instance

**v1.1.1602's „Aha"-Moment.** Vier Versionen lang (1587→1597→1599→1600) habe ich am Calendar-Bento-Widget herumgedoktert: Filter-Logik, Past-Fallback, Polling-Safety-Net, Fetch-Range verbreitert. Symptom blieb: Widget zeigt nichts. Dann beim 5. Anlauf: `DataProvider`-`entities`-Array kommt aus `systemRegistry.getAsHomeAssistantEntities()` → `entity.toEntity()` → **Plain Object ohne Methoden**. `entity?.executeAction` ist undefined → useEffect-Check failt früh → kein Load.

Warum funktioniert CalendarView dann? `SystemEntityLazyView` macht in der Mitte einen Lookup:
```js
const entityInstance = systemRegistry.getEntity(internalId)
    || systemRegistry.getEntityByDomain(entity.domain);
return <LoadedView entity={entityInstance || entity} ... />;
```

Der Lookup-Schritt fehlte in BentoRichSlider. Fix in v1.1.1602: `enrichWithRealEntity(item)` Helper im Slider, der das Pattern 1:1 dupliziert.

**Lesson:** wenn Daten „da" scheinen aber Action-Calls schweigend nichts tun → erst checken ob die METHODEN überhaupt auf dem Objekt sind (`console.log(typeof entity.executeAction)`), BEVOR man am Filter/Polling/Range schraubt. Vier verlorene Anläufe wegen falscher Problem-Hypothese.

### 2. `overflow: hidden` blockiert nicht die CustomScrollbar

**v1.1.1611's Korrektur an v1.1.1593.** Drei Anläufe (1590 für Todos, 1593 für alle 8 Views, 1611 für die ECHTE Lösung):

Ich hatte gedacht `#tab-content-container:has(.X-view-container) { overflow-y: hidden }` würde die DetailView-Outer-Scrollbar verschwinden lassen. Tut's nicht — `overflow: hidden` stoppt nur User-Scrolling-Gesten. `scrollHeight > clientHeight` bleibt true wenn Content höher ist. CustomScrollbar prüft genau das für `showScrollbar`-State → wird weiter gerendert.

Fix in v1.1.1611:
```css
#tab-content-container:has(.X-view-container) ~ .custom-scrollbar-container {
  display: none;
}
```

Per `~`-Sibling-Combinator gezielt die DetailView-Outer-Scrollbar ausblenden, ohne die internen View-Scrollbars (die als Descendants nicht Siblings sind) zu treffen.

**Lesson:** CSS-Properties die UI-Eigenschaften ändern (overflow, opacity, pointer-events) müssen NICHT dieselben sein die Render-Logik beeinflussen. CustomScrollbar liest `scrollHeight/clientHeight` direkt vom DOM — was darauf basiert, dass Content da ist, nicht ob das Container's `overflow` ihn scrollbar macht.

### 3. Touch-`:hover` ist klebrig — `@media (hover: hover)`-Wrapper Pflicht

**v1.1.1609.** Nach Tap auf eine Todo-Row in BentoRichTodos blieb der helle Hover-Bg dauerhaft sichtbar. iOS/iPadOS hält `:hover`-States nach Touch-Events „klebrig". Fix:

```css
@media (hover: hover) {
  .bento-rich-todos-row--clickable:hover {
    background: rgba(255, 255, 255, 0.18);
  }
}
```

Plus `-webkit-tap-highlight-color: transparent` damit der native iOS-Tap-Flash auch weg ist.

**Lesson:** jeden `:hover`-Style auf interactive elements in einer Touch-Card sollte mit `@media (hover: hover)` umwickelt werden. Default in CSS-Library, aber Inline-Custom-Styles vergessen das oft.

### 4. `lang`-Prop muss durch jede React-Tree-Schicht aktiv durchgereicht werden

**v1.1.1607.** ContextTab + HistoryTab haben jeweils `lang = 'de'` als Default-Param. Wenn die Parent (`DetailView`) das `lang`-Prop nicht aktiv weiterreicht, fallen sie auf DE zurück — auch wenn die App auf EN steht.

```jsx
<HistoryTab item={liveItem} onDataRequest={...} />  // BUG: kein lang!
<ContextTab item={liveItem} ... />  // BUG: kein lang!
```

Beide Render-Stellen waren betroffen (Z. 579-580 + Z. 606-607).

**Lesson:** wenn ein Component `lang = 'de'` Default-Param hat und der Sub-Tree davon abhängt, ist das Default-Argument eine MINE. Bei Translation-Audit: grep `lang === 'de'` in Components, dann grep `<ComponentName` und checke ob `lang=` als Prop dabei ist.

### 5. SVG-Inline-Strings + Comment-Stripping = Subtile Scanner-Bugs

**v1.1.1581.** Mein eigener `check-extraction-debt.py` hatte einen Bug: das Comment-Stripping eliminierte `//` in URL-Strings INSIDE Template-Literals. Konkret: `xmlns="http://www.w3.org/2000/svg"` im `deviceTypeRegistry.js`-SVG-Helper-Template-Literal wurde so behandelt:

- `xmlns="http:` ← intact
- `//www.w3.org/2000/svg"...rest of template...` ← als Line-Comment behandelt, weggestripped

→ 73% des Files war weg in der gecleanten Version → IMPORT-Detection sah unbenutzte Symbols → 3 False-Positives.

Fix: scanner trackt jetzt IMMER String/Template-State (egal ob drop_strings true/false), damit `//` inside strings nicht als Comment misinterpretiert wird.

**Lesson:** wenn du selbst einen Tokenizer/Parser schreibst, ist die schwerste Edge-Case-Klasse die Interaktion zwischen verschiedenen Token-Typen (strings vs comments vs regexes). State-Machine ist robuster als sequenziell anwendende Regex-Passes.

### 6. Action-Calls die schweigend ein No-op machen sind ein Anti-Pattern

**Wiederholtes Muster.** `BentoRichTodos.handleToggle` (v1.1.1595), `BentoRichCalendar.load` (v1.1.1602), und mehrere `useEffect`-Pfade haben Patterns wie:

```js
if (!hass || !entity?.executeAction) return undefined;  // schweigend bail
```

Beim Debugging sieht man nichts (kein Error, kein Log). Mehrere Stunden Suchzeit waren rückblickend vermeidbar gewesen wenn ein `console.warn` drin gewesen wäre:

```js
if (!hass || !entity?.executeAction) {
  console.warn(`[${componentName}] missing dependency`, { hass, entity });
  return undefined;
}
```

**Lesson:** silent-bail in useEffect ist ein Code-Smell. Bei System-Entities wo Action-Calls erwartet werden, IMMER ein Warn-Log.

### 7. Bundle-Audit hat einen klaren Top-Win identifiziert

**v1.1.1584.** Bundle-Audit-Doc (commit vor v1.1.1584) zeigte `marked` (12 KB gzip) + `dompurify` (17 KB gzip) als #2 + #3 nach chart.js. Beide hatten nur 2 Konsumenten (`VersionDetail.jsx`, `TippDetail.jsx`). 

Ersatz mit eigenem `miniMarkdown.js` (~150 LOC, ~3 KB gzip): **-21 KB gzip / -5% Bundle**. Plus Bonus: tables (mit `gfm: false` vorher als Plain-Pipe-Text dargestellt) rendern jetzt als richtige `<table>`.

**Lesson:** Bundle-Audits dokumentieren ist günstig (~1h für eine vollständige Analyse mit Tooling-Setup). Die identifizierten Wins sind dann sauber gezielt, nicht „lass uns mal random optimieren".

### 8. „Erst Symptom-Fix" verschwendet Energie wenn die Ursache eine Schicht tiefer liegt

**Calendar-Widget-Saga.** v1.1.1587 fixed Today-events-stay-all-day. v1.1.1597 changed data source to attrs.events + past-fallback. v1.1.1599 widened fetch range to past 30 days. v1.1.1600 added polling safety-net. NICHTS davon löste den eigentlichen Bug. Erst v1.1.1602's enriching-with-real-SystemEntity-Instance war die wirkliche Lösung.

Die ersten 4 Anläufe waren jeweils plausibel-klingende Symptom-Patches. Aber das eigentliche Problem (executeAction = undefined wegen Plain-Object-Item) lag eine Schicht tiefer und wurde erst beim TIEFEREN Trace (durch die ganze Render-Chain, vom DataProvider bis zum Widget) entdeckt.

**Lesson:** wenn ein Fix das Symptom nicht beseitigt, **ist die Hypothese falsch** — nicht die Implementierung. Re-tracen, statt nochmal-tweaken. Vor jedem v1.1.1597/1599/1600 hätte ich `console.log(typeof entity.executeAction)` machen sollen.

---

## Release-Blöcke

### Block A — Geplante Pipeline (1577–1584, May 21)

| Version | Theme |
|---|---|
| 1577 | 🛠 Tooling: `check-hooks.sh` + `check-extraction-debt.py` committed. `scripts/`-Exception in `.gitignore`. |
| 1578 | 📱 Mobile-Bento: iPad-Mini Portrait 2-col + Swipe-Threshold-Tuning (60→80 px, 400→600 px/s). |
| 1579 | 📅 Multi-Day Events: exclusive end-date für all-day + Range-String in EventRow ("21. – 22. Mai · Ganztägig"). |
| 1580 | 🔁 Custom-RRULE-Editor: INTERVAL + BYDAY + UNTIL/COUNT editable. CalendarEventDialog 962→1299 LOC. |
| 1581 | 🧹 Extraction-Debt-Cleanup: 32 Files, 64 unused imports gestrippt. Scanner-Bugfix für `//` in Template-Literals. |
| 1582 | 📊 Multi-Day-Spanning-Bars in Week-View (Apple-style lane-packing, max 3 lanes + Overflow). |
| 1583 | 🪛 Quick-Wins: All-Day-Animation, About-Date sync, pre-commit hook installiert, dist-Cleanup. |
| 1584 | 📦 Bundle -21 KB gzip: `marked` + `dompurify` durch eigenen `miniMarkdown.js` ersetzt. |

### Block B — UI-Polish + Bug-Reaction (1585–1591, May 22 Vormittag)

| Version | Theme |
|---|---|
| 1585 | 🔤 Slider-Widget Footer line-height + Gap-Bump. |
| 1586 | 🖼 News-Row Thumbnail vertikal zentriert (align-items: center). |
| 1587 | 📅 Bento-Calendar Filter „today's events stay all day" (v1 — half-fix). |
| 1588 | 📅 Calendar-Liste Top-Fade beim Scrollen + Scrollbar nicht mehr auf Cards. |
| 1589 | ↔ Versionsverlauf + Tipps Filter-Pillen mit Scroll-Pfeilen + Edge-Fade. |
| 1590 | ✅ Todos einzeilige Filter-Bar + outer-Scrollbar-Fix (v1 — Todos-only via `:has(.todos-view-container)`). |
| 1591 | 📱 Mobile-Sidebar wirklich zentriert (auto-margin statt transform-translate) + runde Hover. |

### Block C — i18n + System-Entity Plumbing (1592–1596, May 22 Mittag)

| Version | Theme |
|---|---|
| 1592 | 🏷 Area-Fallback „Kein Raum" → „Allgemein" / „No Room" → „General". |
| 1593 | 🪟 Outer Scrollbar disabled für alle 8 System-Entity-Views (v2 — `overflow:hidden` auf allen 8 via `:has()`). |
| 1594 | 🎴 SystemEntity-Tile Live-Data Bug-Fix: `getSystemEntityArea` + `Name` an `DeviceCardGridView` durchgereicht. Plus Calendar-Tile zeigt jetzt nächsten Event-Titel + Day/Time. |
| 1595 | ✅ Bento-Todos: Deep-Link, Inline-Erledigt-Toggle (intented to work, silent-failed bis 1602), Überfällig knallrot. |
| 1596 | 📱 Mobile-Sidebar Overflow-Popup für >5 Items (Apple-Context-Menu-Pattern). |

### Block D — Calendar-Widget-Saga + Layout-Polish (1597–1605, May 22 Nachmittag)

| Version | Theme |
|---|---|
| 1597 | 📅 Bento-Calendar v2: attrs.events als data-source + past-fallback Logik. Symptom nicht gelöst. |
| 1598 | 🪟 Sidebar-Popup Hover-Polish + Bento ≤768 = ≤600 (v1.1.1577-2-col-Regel rückgängig). |
| 1599 | 📅 Bento-Calendar v3: Fetch-Range verbreitert auf past 30 + future 14 Tage. Symptom IMMER NOCH nicht gelöst. |
| 1600 | 📅 Bento-Calendar v4: Polling-Safety-Net analog BentoRichNews. Symptom nicht gelöst (round-number 1600!). |
| 1601 | 🏷 Entity-ID-Toggle-Button expandiert zur Pille mit schwarzem Text drin (Apple-Pill-Look). |
| **1602** | 🎯 **Bento-Slider: echte SystemEntity-Instanzen statt toEntity-Plain-Objects.** Endlich der wirkliche Fix für die Calendar-Saga. Side-Effect: Todos inline-complete (1595) funktioniert jetzt auch. |
| 1603 | ✅ Bento-Todos: Überfällig wirklich knallrot (v1595-Override-Selector erfasste `--rich-slider` nicht) + Row-Hover breiter. |
| 1604 | ✅ Bento-Todos: Row-Hover chunkiger (padding 6→10) + runder (radius 10→16) — Apple-Reminders-Look. |
| 1605 | 📱 Sidebar-Overflow-Popup Padding verdoppelt (10→20) + Items rundere Apple-Items (10→16). |

### Block E — Mobile-Safe-Area + i18n Endspurt (1606–1613, May 22 Abend)

| Version | Theme |
|---|---|
| 1606 | 📱 Mobile-Bento Bottom-Safe-Area für Fixed-Dock. |
| 1607 | 🌐 Versionsverlauf live `current_version` (war hardcoded 1.1.1389!) + Sidebar-Translation-Map (8 Domains) + DetailView lang-Prop an HistoryTab/ContextTab. |
| 1608 | 🌐 actionButtons search/history/management Translation-Keys ergänzt. |
| 1609 | ✅ Bento-Todos kein Sticky-Hover auf Touch (`@media (hover: hover)`-Wrapper) + weniger Gap zwischen Rows (8→2). |
| 1610 | 🐛 Tipps + Versionsverlauf Deep-Link-Back-Bug („No tipp selected"-Fehler — `setView('list')` vergessen). |
| 1611 | 🪟 Outer CustomScrollbar v3 — wirklich via `~`-Sibling-Combinator + `display: none` ausgeblendet. |
| 1612 | 🌐 DetailHeader übersetzt Versionsverlauf/Tipps/Integration Titles. |
| 1613 | 🪶 Slider-Footer-Label gap+padding entfernt (User-DevTools-Test). |

---

## Architecture-Decisions

### Bento-Slider-Items: explizite SystemEntity-Lookup-Phase

**v1.1.1602.** Vor dem Slider's render-loop wird jedes gefundene Plain-Object (aus `devices`) durch die echte SystemEntity-Instanz ersetzt (`enrichWithRealEntity(item)`). Damit haben alle Rich-Widgets (BentoRichCalendar, Todos, News) Zugriff auf `executeAction`/`actions`/etc.

Pattern 1:1 aus `SystemEntityLazyView.jsx:111-119`. Code-Duplikation akzeptiert — die Logic ist ~5 Zeilen, Extract-to-shared-helper hätte ähnlich viel Code.

### `:has()` + `~`-Sibling-Combinator für SystemEntity-View-spezifische Layout-Overrides

**v1.1.1611.** Pattern für jede „wenn System-Entity X im Container, dann tu Y auf Sibling Z":

```css
#tab-content-container:has(.X-view-container) ~ .custom-scrollbar-container {
  display: none;
}
```

`:has()` matcht Parent-based-on-descendant, `~` selects subsequent Sibling. Beide modernen Selektoren (Safari 15.4+, Chrome 105+, Firefox 121+). Für HA-Lovelace-Card im modernen Browser-Umfeld unproblematisch.

### miniMarkdown.js (eigener Parser) statt marked + dompurify

**v1.1.1584.** Single-pass-State-Machine, ~150 LOC. Unterstützt: headings, lists, bold/italic/code, blockquotes, fenced code blocks, pipe tables, safe links (http/https/mailto only).

Safety-Garantie durch Konstruktion: jeder Input-Charakter geht durch `escapeHTML()` oder landet in einer kontrollierten Output-Tag-Liste. Kein Pfad für rohes HTML. → Sanitizer (dompurify) redundant geworden.

Lossy bei BYMONTH/BYMONTHDAY in RRULE → aber das ist Markdown-orthogonal.

### v1.1.1578-Rule (iPad-Mini 2-col) → v1.1.1598 entfernt

User-Test: 2-col-Layout bei 600-768 portrait konvinzierte visuell nicht. Single-Column-Stack bei ALLEN ≤768 ist konsistenter. Lesson: nicht zu früh „smart" werden bei Responsive-Breakpoints.

---

## Open Threads / Candidates for next session

### Translation-Audit (laufend)

- Tipps-Content `lessons.en.md` hat noch das alte Dev-Pattern-Content (47 User-Tipps müssen übersetzt werden, ~30-45 min mechanische Arbeit).
- Wenn der User weitere DE-Strings in EN-Mode sichtet: gezielt fixen (lang-Prop ist seit v1.1.1607 sauber durchgereicht, bedingungsdefekte Sites müssen aufgesammelt werden).

### Strukturelle Refactors (`project_structural_refactor_plan.md`)

Immer noch deferred. CalendarEventDialog ist auf 1299 LOC gewachsen (war 962 vor Custom-RRULE). NewsView/TodosView/StatsBar haben unverändert 1000-1300 LOC. Pilot wäre TodosSettingsView (1343).

### User-Tipps EN-Übersetzung

47 Tipps, vorhandenes Schema, ~30-45 min für mechanische Übersetzung wenn jemand das in Angriff nimmt.

### chart.js code-split

Per Bundle-Audit blockiert durch `inlineDynamicImports: true` in vite.config (HACS-Single-File-Constraint). Bleibt deferred bis das HACS-Delivery-Modell überdacht wird.

### „Silent-bail" Anti-Pattern-Cleanup

In mehreren useEffect-Pfaden (BentoRichCalendar, BentoRichTodos, etc.) silent-bail bei missing deps. Sollte zu `console.warn(...)` werden — beim nächsten ähnlichen Bug spart das Stunden Debug-Zeit. Low-priority-Tooling-Pass.

---

## Build / Release Flow

37 Releases via `echo "Y" | ./build.sh` + separater commit/push von `docs/version-history/versionsverlauf.md`. Standard-Cadence aus den Memory-Patterns.

Total Build-Zeit der Session: ~22 min für die 37 Builds. Hauptaufwand war das **Schreiben der Versionsverlauf-Einträge** — diese Session habe ich sie **deutsch geschrieben statt englisch** (siehe Memory-Hard-Rule). Der User hat das am Session-Ende moniert; nächste Session: konsequent englisch.

---

## Numbers

- **Releases:** 37 (v1.1.1577 → v1.1.1613)
- **Days active:** 2 (May 21, May 22)
- **Hotfixes / Iteration-Rounds:** Calendar-Widget brauchte 5 Anläufe (1587 → 1597 → 1599 → 1600 → **1602** als eigentlicher Fix). Outer-Scrollbar 3 Anläufe (1590 → 1593 → **1611**). Überfällig-knallrot 2 Anläufe (1595 → 1603).
- **Bundle-Effekt:** -62 KB raw / -21 KB gzip (-5%) via miniMarkdown
- **Neue Tooling:**
  - `scripts/check-hooks.sh` (1577)
  - `scripts/check-extraction-debt.py` (1577 + scanner-bugfix in 1581)
  - `scripts/audit-bundle.sh` (1584)
  - `scripts/check-all.sh` (1583)
  - `scripts/git-hooks/pre-commit` + `install-git-hooks.sh` (1583)
- **User-Tipps replaced:** `docs/lessons/lessons.de.md` von Dev-Patterns auf 47 User-Tipps (separater docs-commit zwischen 1592 und 1593).
- **Documents created:** `docs/BUNDLE_AUDIT_2026-05-21.md`, `docs/lessons/USER_TIPPS_OUTLINE.md`, `docs/lessons/DEV_PATTERNS.de.md` (gerettet aus altem lessons.de.md), `src/utils/miniMarkdown.js`.

---

## Final state

- **Calendar-Bento-Widget** zeigt Events live + Past-Fallback. (Echte Fix: Plain-Object-Items via `enrichWithRealEntity()` durch echte Instanzen ersetzt.)
- **Bento-Todos** voll interaktiv: Tap auf Kreis erledigt, Tap auf Row deep-linked in TodosView. Überfällig knallrot. Hover Apple-Reminders-Style.
- **All 8 System-Entity-Views** keine doppelten Scrollbars mehr. `:has() ~` Pattern in DetailView.css.
- **Mobile-Sidebar** zentriert, runde Hover-Items, Overflow-Popup mit Apple-Padding für >5 Items.
- **Bundle** -21 KB gzip durch miniMarkdown.
- **Bento-Slider** zeigt Live-Daten korrekt (V1.1.1613, „Heute · 14:00" / „Meeting mit Hans", „8 Geräte", etc.).
- **Translation-Pipeline** auf EN: Sidebar-Entities, DetailHeader-Titles, ActionButton-Tooltips, HistoryTab-Labels, ContextTab-Tabs.
- **Tooling** committed: 2 sanity-scripts + bundle-audit + pre-commit-hook + check-all-bundle.
- **Bekannte offene Threads:** EN-Tipps-Content, struktureller Refactor (deferred), chart.js code-split (blockiert).

Next session candidates oben dokumentiert; keine blocker-Bugs offen.
