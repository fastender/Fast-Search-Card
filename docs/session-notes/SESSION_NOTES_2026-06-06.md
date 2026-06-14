# Session Notes — 2026-06-06 (v1.1.1858 → v1.1.1867)

Continuation of the screenshot-driven UI-consistency polish, then a **major feature**:
transferring the Universal-device **History** system (charts + activities) to all normal
entities, followed by dead-code cleanup.

User chats German, one screenshot/instruction → one build/release. HARD RULES still in force:
versionsverlauf ENGLISH every release (`docs/version-history/versionsverlauf.md`); update
`docs/info-popups/info-popups-catalog.md` whenever an info-popup is touched; version string in
`AboutSettingsTab.jsx`; release via `cd /Users/suerekli/fast-search-card-build && echo "Y" | ./build.sh`.

## Releases

### v1.1.1858 (carried over) — filter scroll arrows: left arrow after search toggle
`useScrollIndicators` lost its node when the search/filter bar remounts on toggle → added
`searchOpen` to deps in AllSchedulesView / NewsView / TodosView.

### v1.1.1859 — Changelog + Tips: remove refresh + search field 1:1 like News/Scheduler
- Removed `refresh` action button from versionsverlauf + tipps `index.js`.
- The search MARKUP was already identical to News; only the CSS differed. Restyled
  `.versionsverlauf-search*` + `.tipps-search*` to mirror `.news-search*`: rounded **18px**,
  border, **`:focus-within`** brighten transition (= the "animation"), circular clear button.
  (News reference: `news/styles/NewsView.css` lines ~157-216.)

### v1.1.1860 — Changelog + Tips: first toolbar button `back` → `overview` (wheel icon)
News/Scheduler use the `overview` action (spoked-wheel/compass icon from
`TabNavigation.jsx` getActionIcon `case 'overview'`, ~line 197); versionsverlauf/tipps used `back`
(plain arrow). Switched them to `overview`:
- `index.js`: `back` → `overview` (id+action+title 'Übersicht').
- Views: registered `handleOverview` (reset to list, close detail/settings/search);
  default `activeButton` + search-toggle/back-fallbacks → `'overview'`; kept `handleBackNavigation`.
- `TabNavigation.jsx` `case 'overview'` chain: added `versionsverlauf` + `tipps`.

### v1.1.1861 — Weather + Integration get the overview icon; refresh removed (schedules/news/weather)
- Weather (`WeatherDeviceEntity.js`) + Integration (`integration/index.js`): first button `back` → `overview`.
- IntegrationView got `handleOverview` (reset to 'selection') + added to overview chain.
- **Weather registers NO viewRef** (its refresh/settings were already dead; `back` closed via the
  back-case `onBack?.()` fallback). So added `else onBack?.()` to TabNavigation's **overview** case →
  weather's overview closes like back did, but with the wheel icon.
- Removed `refresh` from all-schedules, news, weather.

### v1.1.1862 — Energy Dashboard settings: section headings + ⓘ, per-sensor info popups → standard design
- **`SettingsInfoButton` gained an optional `content` prop** (raw markdown). When a non-empty string,
  used directly instead of the `infoKey` translation lookup. For DYNAMIC infos that aren't static
  `settingsInfo` keys. `infoKey` path byte-for-byte unchanged. (`SettingsSectionInfo.jsx`.)
- Home view (`EnergyDashboardSettingsHomeView.jsx`): `SettingsSectionHeader` on Values + Circular
  sections (`energyValues` / `energyCircular`, de+en).
- Sensor-config (`EnergyDashboardSensorsConfigView.jsx`): replaced the OLD bespoke `.info-overlay`
  per-sensor popup with `<SettingsInfoButton content={...} />` (content = `## Name\n\n<desc>` from
  `sensorNames`/`sensorInfos` in EnergyDashboardSensorUtils). stopPropagation guard so the ⓘ doesn't
  trigger the row's sensor-selection nav. Group sub-headers already existed.
- Removed the old `.info-overlay` AnimatePresence block from `EnergyDashboardSettingsView.jsx`.
- Catalog updated (energyValues/energyCircular + a NOTE that per-sensor popups use the dynamic
  `content` prop, not settingsInfo keys). Delegated to a general-purpose agent.

### v1.1.1863 — cleanup: removed dead `showInfoOverlay`/`infoSensorType` state from `EnergyDashboardDeviceView.jsx`

### v1.1.1864 — Energy Values: ⓘ hover fix (black dot) + iOS26 auto-resolved banner
- **🔁 Reusable bug:** the ⓘ button sits inside `.ios-item-left`, so the row-hover invert rule
  `.ios-item:hover … .ios-item-left svg circle { fill:#000 !important }` (in
  `news/components/iOSSettingsView.css` ~line 353-365) filled the InfoIcon circle into a **solid black
  dot**. Fix = higher-specificity override `.ios-item:hover … .ios-info-btn svg circle/path
  { fill:none !important; stroke:currentColor !important }` → keeps it an outline (just darkened).
- Redesigned the "X of Y slots auto-resolved" banner to iOS26: green-tinted circular icon badge
  (link glyph, matching the green AUTO pills) + bold title + muted subtitle, no emoji.

### v1.1.1865 — Energy Dashboard settings: is-scrolling top-fade mask
`.ios-settings-view.is-scrolling` CSS existed (top-fade) but nothing toggled the class. Added
`onScroll` toggling `is-scrolling` (scrollTop>0) on all 4 settings scroll views: SensorsConfig, Home,
CircularOverview, SensorSelection.

### v1.1.1866 — ⭐ Normal entities now use the Universal History view (charts + activities)
**The big one.** Replaced the dated `HistoryTab` for normal entities with `ChartsHistoryView`.
See the dedicated memory + the **History Transfer** section below.

### v1.1.1867 — cleanup: removed the dead old HistoryTab code chain
Deleted `components/tabs/HistoryTab.jsx` + `.css`, `utils/historyUtils.js`, `utils/historyConstants.js`;
trimmed `timeFormatters.js` (removed `formatTime`+`formatDuration`+the `getHoursFromTimeframe` import,
kept `formatRelativeTime`); removed `loadEntityHistory()` from `homeAssistantService.js`. (StatsBar has
its own unrelated local `formatTime` clock helper — untouched.) `accordion.css` still has a historical
comment mentioning HistoryTab.css — left as-is.

## ⭐ History Transfer (v1.1.1866) — architecture

The Universal history (`components/charts/`) is sensor-centric: `ChartsHistoryView` owns the time-state
(timeRange/periodIndex/customRange/mode/activeIdx), reads `entity.attributes.chart_sensors` + derives
`controlEntities` from `ha_device_id`, renders `SensorChartView` (charts) + `DeviceActivitiesView`
(activities). Data layer `services/sensorStatistics.js` decides HA statistics-vs-history via
`shouldUseStatistics(stateClass, unit)`.

Normal entities have no `chart_sensors`, and many (climate/light/cover…) have no numeric STATE — their
chartable value lives in an ATTRIBUTE (`current_temperature`, `brightness`, …). So:

**User decision (AskUserQuestion): "Smart per domain".**

New files:
- **`src/utils/entityChartConfig.js`** — `buildEntityChartConfig(item, hass, lang)` → `{chartSensors,
  controlEntities, initialMode}`. Per-domain map: numeric sensor → own value; climate/water_heater →
  current+target temperature (attribute); light → brightness; fan → percentage; cover → current_position;
  humidifier → current+target humidity; on/off (switch/lock/binary_sensor…) → `[]` (activities-only).
  `controlEntities` always = `[{id: item.id, color}]` (the entity itself → logbook). `initialMode` =
  charts if sensors else activities.
- **`src/components/charts/EntityHistoryView.jsx`** — thin wrapper: builds the config + a synthetic
  entity, renders `ChartsHistoryView` with override props.

Additive changes (default-off → Energy Dashboard + Universal charts UNCHANGED):
- **`sensorStatistics.js`**: optional `attribute` param threaded through `fetchHistoryData` (+ 5 exports
  + internal `computeHistoryChartData`). When set: URL drops `&minimal_response&no_attributes` (so HA
  returns full attributes on every point), parses `p.attributes[attribute]` not `p.state`, FORCES the
  history path (`useStatistics = attribute ? false : …`), measurement semantics, headline prefers the
  live attribute value. `attribute=null` → byte-for-byte old behavior.
- **`SensorChartView.jsx`**: `attribute` prop → threaded into all 4 service calls + BOTH effect dep arrays.
- **`ChartsHistoryView.jsx`**: additive props `chartSensorsOverride`/`controlEntitiesOverride`/`initialMode`.
  Override arrays used DIRECTLY (NOT through `normalizeChartSensorsArray`, which strips
  attribute/label/stateClass — see `chartSensorEntry.js`). Per-sensor `attribute`/`label`/`stateClass`
  read from the entry (fallback to hass-derived stateClass). `activeSensor` made null-safe everywhere;
  when no sensors → activities mode + the 📊 charts mode-button is hidden.
- **`DeviceActivitiesView.jsx`**: forwards `attribute: s.attribute || null` to `getDerivedSensorEvents`.
- **`DetailView.jsx`**: both History slots (sensor tab-array idx1, general tab-array idx2) now render
  `<EntityHistoryView item={liveItem} hass={hass} lang={lang} />`; old HistoryTab import removed.

Delegated the build to a general-purpose agent with a meticulous additive spec; reviewed the sensitive
diffs (sensorStatistics + ChartsHistoryView) before building.

**Visual-verify TODO (told user):** climate temp chart (2 chips), switch/lock activities-only, numeric
sensor chart. If climate temp curve is flat/empty → tune the attribute fetch (unit °C + headline).

## Reusable lessons this session
- **Overview-button transfer recipe**: `index.js` back→overview + view `handleOverview` (reset, close
  sub-states) + add to `TabNavigation` `case 'overview'` chain + default `activeButton='overview'`.
  Entities w/o a handler fall back to `onBack?.()` (added that fallback to the overview case).
- **Search-field unify**: copy the `.news-search*` block (18px radius + border + `:focus-within` +
  circular clear). Markup was already shared.
- **ⓘ-in-`.ios-item-left` black-dot hover** → override `.ios-info-btn svg circle/path` to `fill:none`.
- **`SettingsInfoButton` `content` prop** = the way to do dynamic (non-key) info popups now.
- **Attribute-history charting** = thread an additive `attribute` through sensorStatistics + SensorChartView;
  forces history path + measurement.
- **`normalizeChartSensorsArray` strips extra fields** → override path must bypass it.
- Dead-code chains: trace transitively (HistoryTab → historyUtils → historyConstants → timeFormatters
  partials → loadEntityHistory). The pre-commit hook scans src on disk for unused IMPORTS.
