# Session Notes — 2026-05-30 to 2026-06-02

**Releases:** v1.1.1755 → v1.1.1787 (33 releases)
**Theme:** Universal-Charts **Activities feature** (Mockup Variant 2 → mode-switch) + a custom **iOS-style date-range picker**, on top of finishing the chart data-source fix. Heavy iterative UI polish.

---

## 1. Chart data-source: unit-based stat-vs-history routing (v1.1.1755)

Carry-over from the previous session's "charts empty" saga (the REST-history fix was v1.1.1754). The remaining bug: `sensor.tesli_charger_current` (Amperage, **mislabeled** `state_class: total_increasing`) showed `0.00 A` while native HA showed 10 A. It took the **statistics sum-delta** path (wrong for an instantaneous reading) and that branch never set a `debug` field → "(no debug info)".

**Fix — `shouldUseStatistics(stateClass, unit)`** in `sensorStatistics.js`:
- `measurement` → statistics (mean). unchanged.
- `total_increasing` + **cumulative unit** (`wh/kwh/mwh/gwh/varh/kvarh/m³/m3/ft³/ft3/cf/l/gal`) → statistics sum-delta. Energy Dashboard safe.
- `total_increasing` + instantaneous unit (A/W/°C/%…) → **HISTORY** (the fix).
- undefined/other → history.
- Plus: statistics-empty → fall back to history (`computeHistoryChartData` extracted). Removed dead `isStatisticsMode`.

**Lesson:** `state_class` alone is not trustworthy; the **unit** decides whether sum-delta is meaningful. Many integrations mis-tag instantaneous sensors as `total_increasing`.

v1.1.1756 = cleanup of the debug instrumentation (console.log → logger, removed dead `parseHistoryStateEntry` (old WS shape), collapsed the WS-vs-REST comment blocks, removed the user-visible debug box in the empty state).

---

## 2. The Activities feature (Mockup Variant 2 → mode-switch)

User wanted a second "Aktivitäten" container next to Charts. **Mockup first** (`docs/mockups/universal-activities-ideas.html`, 3 variants) → user picked **Variant 2** (shared time-header + two containers). Built in phases, then pivoted to a **mode-switch** (the user later preferred one container with a 📊/📋 toggle).

- **Data source (user chose "Combined"):** HA logbook contains **no numeric sensor changes**, so a pure-logbook feed would be empty for solar/charger sensors. So:
  - **Derived sensor events** (`getDerivedSensorEvents`, `sensorStatistics.js`): period **max + min** from the REST history (the data we already fetch). Always populated.
  - **Logbook** (`logbookService.js` → `getDeviceLogbookEvents`, WS `logbook/get_events`): real events for the device's **control entities** (switches/binary/locks/climate/automations), merged into one chronological feed.
- **A (v1.1.1758):** extracted `ChartPeriodHeader.jsx` (self-contained, computes its label via `calculatePeriodDates`); hoisted `timeRange`/`periodIndex` out of `SensorChartView` into `ChartsHistoryView` (SensorChartView became controlled/uncontrolled dual-mode + `hideHeader`).
- **B1 (v1.1.1759):** new `DeviceActivitiesView.jsx` — collapsible, lazy-fetch, multi-select filter chips (default all), focus highlight, grouped-by-day timeline.
- **B2 (v1.1.1760):** logbook for control entities (derived via `ha_device_id`, minus chart_sensors, palette colors continuing after sensors).
- **C (v1.1.1761):** **click-to-sync** — clicking a derived event jumps the chart to that sensor + marks the point (post-process the Chart.js config's `pointRadius`/bar bg by nearest-timestamp index; never touches the shared `buildLineBarConfig`).
- **Mode-switch (v1.1.1765):** one container, 📊 Charts ⇄ 📋 Activities toggle in the header (default Charts). Only the active mode renders. Click-to-sync auto-switches back to Charts.
- **Layout iterations:** floating header outside the dark container (v1763) → align content to the title/toolbar 20px gutter (v1764, incl. a `:has(.charts-history-root)` outer-scrollbar fix) → fixed-height card + internal scroll (v1770) → header control heights equalized to 36px with `align-items: stretch` so the active D/W/M/Y pill matches the switch (v1775/1776).

---

## 3. Custom iOS date-range picker (`ChartDatePopover.jsx`)

The native `<input type=date>` can't be styled and ignores `lang` (always German). Built a custom popover (v1.1.1771) and iterated:
- v1772: centered modal + month/year picker (tap "Month Year" → 3×4 month grid + year stepper).
- v1773: **flex-centering** instead of `transform: translate(-50%,-50%)` — framer-motion's `scale` animation overwrites `transform`, which is why the modal landed bottom-right. Full detail-view backdrop (dim + blur) via `createPortal`.
- v1774: **Shadow-DOM fix** — `document.querySelector('.detail-panel.visible')` returns null inside the card's shadow root; resolve the portal target via `rootRef.current.closest('.detail-panel')` (stays in the same shadow tree) and pass it down as `portalTarget`.
- v1777: highlight the **period** (week/month/year) as a connected range (column-gap 0, rounded ends per row).
- v1778: **custom range** (tap start → tap end, hotel/flight style). New `getCustomRangeChartData` + `getCustomRangeValue` (history-only, span-adaptive bucketing: ≤2d hourly, ≤92d daily, else monthly). `customStart/customEnd` thread additively through SensorChartView + DeviceActivitiesView; selecting a range overrides D/W/M/Y, header shows "22. – 25. May", scrubber disabled, picking a D/W/M/Y clears it.
- v1779: keep the marking visible (no instant close on 2nd tap; "Done" button closes) + pre-mark the active range on open.
- v1780: tooltip title bug "May 29:00-NaN:00" — `buildLineBarConfig` assumed hour/day labels; made it defensive (only format as hour if label has `:` and is numeric; only as DD.MM.YYYY if purely numeric).

---

## 4. Recurring patterns / lessons (reusable)

- **`is-scrolling` top-fade mask** (`mask-image: linear-gradient(to bottom, transparent 0, black 40px, black 100%)`), toggled on `scrollTop > 0`. Applied to: charts body, activities internal scroll, `.ios-settings-view` (Edit main + **all** setup sub-views via a centralized `scrollNode` listener that toggles the class on the DOM node), and the Universal **entity sub-views** (queried `.ios-settings-view` from the wrapper).
- **CustomScrollbar** mounted alongside each internal scroll (must live inside a `position: relative` ancestor).
- **🔁 The recurring white-on-white hover bug:** SVG icons / buttons in `.ios-item-right` use `currentColor` (light) and become invisible on the white `.ios-item:hover` background. The existing hover-darken rule only covers `.ios-item-left svg`. Fixed twice this session by adding per-element classes (`.device-icon-preview`, `.ios-reorder-btn`) + hover rules that set `color/stroke: #000`. **Open suggestion to the user:** a generic `​.ios-item:hover .ios-item-right svg { color/stroke: #000 }` rule to cover all right-side icons once.
- **Long-text fade** (`.ios-item-subtitle`): single-line + `overflow:hidden` + right-edge mask. Short text never reaches the fade zone → only long entity_ids fade (no overlap with the toggle).
- **Navbar title fade only when long:** the title shrank to content width so a 40px right-fade covered short titles ("Hero"). Fix: fixed `width` + `text-align:center` + **both-edge** fade → short text sits centered with empty margins (no fade), long text fills the box and fades.

---

## 5. Other UI tweaks

- v1757: filter-arrow centering scoped to charts (`--charts` modifier; shared with the 2-row versionsverlauf bar), date/DWMY row swap, 2-decimal KPI strings, compact KPI pills.
- v1767: switch far-left, date + D/W/M/Y grouped far-right (`row-reverse` + `flex-start`).
- v1768: mobile `#tab-content-container` padding `15px → 0 20 0 15`.
- v1769: device **Edit** got a fixed top navbar (Cancel/Save) like the calendar/task editors; v1786: title "Bearbeiten" moved into the navbar center (StepHeader → spacer in edit mode).
- v1782: dropped the activities row **opacity dimming** (it greyed the whole feed); focus distinguished by accent bar + brighter bg only.
- v1786: **Hero slideshow reordering** — ↑/↓ buttons + order-number badges (1…5) on selected heroes (`moveHero` swaps neighbours in the `hero` array). Minimal, no drag-drop.

---

## New / changed files

**New:** `ChartPeriodHeader.jsx`, `DeviceActivitiesView.jsx`, `ChartDatePopover.jsx`, `services/logbookService.js`, `docs/mockups/universal-activities-ideas.html`.
**sensorStatistics.js new exports:** `getDerivedSensorEvents`, `getCustomRangeChartData`, `getCustomRangeValue` (+ `shouldUseStatistics`, `isCumulativeUnit`, `computeHistoryChartData` internal).
**Heavily touched:** `ChartsHistoryView.jsx`, `SensorChartView.jsx`, `UniversalSetup.jsx` + `Step2Customize.jsx` + `shared.jsx` + `HeroPickerView.jsx`, `UniversalEntityList.jsx`, `iOSSettingsView.css`, `VersionsverlaufView.css`, `energyChartConfigs.js`.

## Process notes

- All versionsverlauf entries ENGLISH (hard rule respected this session).
- Mockup-first worked well again (Activities + the variants).
- Lots of tight visual iterations driven by screenshots — the user inspects the DOM (devtools) and references class names directly.
