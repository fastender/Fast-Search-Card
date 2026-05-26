# Session Notes 2026-05-25 to 2026-05-26

**Versions:** v1.1.1706 → v1.1.1723 (18 releases)
**Trigger:** Quick-stats persistence bug + DeviceCard formatting → marquee polish → user-requested perf-audit ("wie kann ich die performance der karte verbessern; analisiere ganz detailliert") → cascaded into a 12-release cleanup + perf marathon.
**Outcome:** Architecture refactors (hassStore decoupling, shared stores, custom hooks for repeated patterns), measurable perf wins (~1.5s perceived boot, eliminated per-tick re-render storm), ~1,650 LOC of dead code removed, dedicated logger + ~314 `console.log` calls gated behind a debug flag, translation dict down 18%.

---

## Pre-perf bug-fix block (v1.1.1706-1709)

### v1.1.1706 — quick_stats persistence + DeviceCard formatting

User reported two bugs:
1. **Quick-stats picks vanish after reload**: `UniversalDeviceEntity` constructor's `universalConfig` destructure never extracted `quick_stats`, and the `super({ attributes })` block didn't include it. Storage layer + updateDevice action both wrote correctly, but cold-boot via `new UniversalDeviceEntity(config)` dropped the field. After mount, `entity.attributes.quick_stats === undefined`.
2. **DeviceCard 3rd-line formatting mismatch**: separate `.device-quick-stats` class was 11px, existing `.device-state` is 18px. Inconsistent across devices.

Fix: added `quick_stats = []` destructure + attributes entry; merged quick-stats render into existing `.device-state` div (joined with ` · `).

### v1.1.1707 — Marquee for overflowing state-line

User: "wenn mehr text ist dann soll gescrollt werden" — quick-stats line "Energy: 5.7kWh · F[iltered]" got truncated by CSS fade. New `ScrollingDeviceState` component with overflow detection (`useEffect` + ResizeObserver) that activates a marquee animation only when needed.

### v1.1.1708 — Marquee actually detecting overflow

User: "es scrollt nicht". Root cause: inline `<span>` (default `display: inline`) has `scrollWidth ≈ container clientWidth` because inline elements are clamped by `overflow:hidden;white-space:nowrap` on the parent. Fix:
- Hidden measure-layer with `display: inline-block; position: absolute; visibility: hidden`
- `getBoundingClientRect().width` instead of `scrollWidth`
- Double `requestAnimationFrame` for layout-commit + paint
- `ResizeObserver` on the container
- `document.fonts.ready` for async font-load

### v1.1.1709 — Marquee seamless loop

User: "das scrolling ist nicht flüssig, wenn es das ende erreciht, dann springt es." JS-measured distance had sub-pixel rounding issues. Fix: classic `translateX(0) → translateX(-50%)` pattern on a track with `width: max-content` containing 2 identical copies. `-50%` of 2-copy width = exactly one copy, browser percentage arithmetic, no JS rounding. Gap baked into each copy via `padding-right: 40px`. Bit-perfect.

---

## The pivot: user asks for performance audit (v1.1.1710 → 1721)

User: "wie kann ich die performance der karte verbessern; analisiere ganz detailliert und finde ein paar ideen wo wir arbeiten können"

I spawned a `general-purpose` agent for a deep audit. Came back with structured findings across 10 areas: re-render storms, memoization, inline objects, DOM size, animations, bundle, images/icons, useEffects, event listeners, caches. Top-5 prioritized list. User pulled the trigger on the top items immediately.

### v1.1.1710 — Perf #1+#2: hassStore + DataProvider contextValue stability

**The two interlocking root causes of the card's biggest CPU sink:**

1. `updateHass()` in `index.jsx` called `render(<App hass={hass}/>)` at the root on **every HA state tick** — full Preact reconcile.
2. `DataProvider.contextValue` had `hass` in `useMemo` deps → identity change every tick → every `useData()` consumer (DeviceCard, StatsBar, SearchField, GreetingsBar, ...) re-rendered.

Fix architecture:
- **New `src/providers/hassStore.js`** — module-level pub-sub: `setHass()` / `getHass()` / `subscribeHass()`. Listener-snapshot before dispatch (mutation-safe).
- **`index.jsx`**: `App` no longer takes `hass` prop. `mount()` calls `setStoredHass(hass)` then `render(<App config>)` ONCE per container. `updateHass()` only updates the store — no `render()`.
- **`DataProvider`**: subscribes to store internally, removes `hass` from contextValue + deps. Internal effects watching `[hass]` still fire for connection-subscription updates, but contextValue stays referentially stable.
- **`useHass()`** reads directly from store via `useState + useEffect + subscribeHass`. Only consumers that genuinely need live hass re-render per tick.
- 3 consumers migrated from `useData().hass` → `useHass()`: HistoryTab, ScheduleTab, useScheduleData.

Bundle ~unchanged. Run-time impact: enormous — every `useData()` consumer's render-per-tick cost is gone.

### v1.1.1711 — Perf #3: iconSizeStore (Observer N→1)

Each DeviceCard had its own `window.resize` listener + `MutationObserver` on `<html>` for `--device-grid-columns`. 200 cards = 200 observers + 200 listeners. Every CSS-variable write on `<html>` (boot-time alone writes 5: brightness/blur/contrast/saturation/grayscale) fanned out to 200 observer callbacks each running `getComputedStyle()`.

New `src/utils/iconSizeStore.js` — single module-level store with ONE observer + ONE resize listener (lazy-initialized on first subscribe). Early-out when `next === currentSize` so size-bucket-stable mutations don't notify any subscribers. 200 → 1.

DeviceCard's 45-LOC useEffect block became 4 LOC subscribe pattern.

### v1.1.1712 — Perf #4: DeviceCard inline `<style>` → CSS files

`DeviceCardGridView.jsx` emitted a 466-LOC inline `<style>` block per card. With 100 cards visible, 100 identical style-nodes in the DOM. Same in `DeviceCardListView.jsx` (~240 LOC).

Extracted to `DeviceCardGrid.css` + `DeviceCardList.css`. Used `sed -i.bak '163,629d'` to delete the inline blocks cleanly. Single bundled stylesheet via existing inline-CSS Vite plugin.

Bundle: JS −23 kB, CSS +12 kB → net −11 kB. Plus zero duplicate style-nodes in DOM.

### v1.1.1713 — Quick wins (4 bundled)

- **searchCache FIFO cap 100** (was unbounded Map, every distinct query accumulated forever)
- **`HAS_HOVER` module constant** (was `window.matchMedia('(hover: hover)').matches` per card per render — 200 DOM-API reads per render flush)
- **Weather-condition translation dict hoisted** to module scope (was 32-entry object literal per `getWeatherName()` call)
- **StatsBar profile-picture useEffect** dep changed from `[hass]` to `[hass?.user?.id]` (was refetching on every HA tick)

### v1.1.1714 — Splash-Gate + StatsBar + ChartJS-lazy

**Spawned 3 parallel agents** for deeper audits: animation/framer-motion, memory/listeners, first-paint critical-path. The first-paint agent found the BIGGEST single win:

**Splash-Gate**: `WallpaperBootOverlay.jsx` had hardcoded `OVERLAY_HOLD_MS=500 + OVERLAY_FADE_DURATION_MS=2000 = 2500ms` before card-reveal. The reveal `delay` in `index.jsx` was hardcoded `2.5` to match. The REAL boot work finishes in ~900ms. **User stared at black screen for 1500ms of pure cinematic cosmetics.** Reduced to `hold=200 + fade=800 = 1.0s`. Exported `REVEAL_AT_MS` constant so the two places are now derived from one source.

**StatsBar hass-decoupling**: same pattern as v1.1.1710. Energy-data effect had `[hass, energySensors]` deps → on every HA tick, the 5-min interval tore down + recreated AND `loadEnergyData()` fired immediately (sync WS call). Active dashboards fired ticks several times per second. Wrapped hass in a ref, dropped from deps.

**ChartJS lazy register**: `ChartJS.register(...)` ran at module init unconditionally — ~80-150 ms on Safari mobile even for users who never opened a chart view. Wrapped in `ensureChartsInitialized()` with idempotent latch. Called from inside each chart-component's render function (NOT module-scope — `ChartComponents.jsx` is itself eagerly imported via `SearchField → DetailViewWrapper → DetailView → HistoryTab` chain, so module-scope call would still fire at app-boot).

Plus 5 hygiene items: `recentSearches` dead property removed, Printer3D + PrinterMisc unmount-cleanup for debounce timeouts, StatsBar cross-tab `storage` listener filtered to relevant keys.

### v1.1.1715 — News localStorage batching

Agent B finding: `_processFeedparserSensor` looped over `attributes.entries[]` and called `_addArticleToEventCache` per entry. Each call did sync `localStorage.getItem(news_event_cache) → JSON.parse(≤500 articles) → unshift → JSON.stringify → localStorage.setItem`. Feedparser sensors push 20-80 entries per refresh × HA's 5-min refresh × multiple feeds = 100-1600 ms main-thread block per refresh.

New `_addArticlesToEventCacheBatch(articles)` does ONE read + ONE parse + Set-based O(1) dedup + ONE stringify + ONE write. Reverse-iteration + unshift preserves the old ordering semantics. Same final cache state.

### v1.1.1716 — Dead-Code Cleanup (~1500 LOC)

Spawned 2 parallel agents: dead-code audit + duplication audit. Dead-code agent found 1,036 LOC of safely-deletable code. User confirmed via `AskUserQuestion`: "Komplett löschen" for both news-debug helpers AND dev-only mock code.

Deleted:
- 9 orphan files (Scene.jsx/Script.jsx/Switch.jsx icons, ClimateSettingsBar.jsx+css, CalendarEventForm.jsx+CalendarEventDetail.jsx, MockDataMigration.js, mockDevices.js, mockDataGenerator.js)
- 11 dead exports (EnergyConsumptionChart, DeviceCategoriesChart, generateCategoryData, deviceCardVariants, resolveDeviceMeta, calculateReadingTime, formatTimestamp, __resetBootstrap, gridColsFor, icons alias)
- 115 LOC News-Debug `window.*` helpers (debugNews, debugNewsImages, logNewsLiveEvents, newsEntity)
- ~370 LOC dev-only mock code + all `isDevelopment` branches in 3 tabs
- 2 export keywords downgraded to internal (getHvacModeLabel, matchesPattern)

Pre-commit hook caught one leftover `getStoredHass` import after isDevelopment removal — fixed.

Localhost-mock-card testing no longer possible. User confirmed: not needed.

### v1.1.1717 — logger.js + 186 console.log gated

Audit found 314 `console.log` calls across 30+ files. Created `src/utils/logger.js` with `debug/info/warn/error`. `logger.debug` is a no-op unless `localStorage.fsc_debug === 'true'` or hostname is localhost. Top-12 files migrated via Python `sed + import-injection` script. ~186 calls swept. Long-tail 128 deferred.

### v1.1.1718 — Cleanup Q1-Q5 (5 dedup clusters)

Bundled 5 small dedup wins from Agent B:

- **Q1 `<Chevron>` icon module** — 4 duplicate `const Chevron` definitions in shared.jsx files + CategorySelectionView + DomainSettingsPicker converted to re-exports / imports from new `components/common/icons/ui.jsx`. (22+ inline SVG migration deferred — too many)
- **Q2 `isMobileStore` + `useIsMobile` hook** — analog iconSizeStore. 6 sites had `window.innerWidth <= 768` + own resize-listener; now 1 shared store.
- **Q3 `getLocale(lang)` helper** — `lang === 'de' ? 'de-DE' : 'en-US'` 12× in CalendarView → `sed` bulk-replace + 1 import.
- **Q4 `formatRelativeTime` consolidation** — 3 in-place implementations with **divergent plural rules** (latent bug: bento showed "vor 5 Tg" while Notifications showed "vor 5 Tagen"). Canonical version in `utils/timeFormatters.js`. DetailView's long-form `formatTimeAgo` ("vor X Minuten/Stunden") kept separate intentionally.
- **Q5 `systemSettings` reader migration** — 5 of 12 inline `getItem('systemSettings') + JSON.parse` sites migrated to `readSystemSettingsSection(path)`. Other 5 deferred.

### v1.1.1719 — M1 useEntityPolling Hook

The biggest single dedup cluster: 5 components had near-identical ~30-50 LOC polling boilerplate (`useRef(hass)` + `useEffect` + `let cancelled = false` + `setInterval(5000)` + cleanup).

New `src/hooks/useEntityPolling.js`. **Found 2 latent bugs while migrating**: `Printer3DOverviewTab` + `EnergyOverviewTab` had `useEffect([entity, hass])` deps → effect teardown+setup on every HA tick + setInterval restart **several times per second** instead of stable 5s. The 3 other sites already had the hassRef pattern (Misc/Diagnostics/Sensors).

Hook accepts optional `mergeFn` for PrinterMiscList's `mergePendingPreserved` lock-pattern. Returns `{ data, setData, refetch }` so optimistic-updates from outside still work. ResizeObserver-stable identity via ref-stashing.

### v1.1.1720 — M2 + M3 + M4 (3 hooks)

- **`useScrollIndicators(ref, opts)`** — 3 of 4 sites migrated (HourlyForecast, NewsView, TodosView). SubcategoryBar's checkScroll left local because it's intertwined with FLIP-layout animation.
- **`langStore` + `useLang()`** — 4 duplicate `languageChanged` window-listeners → 1 module-level listener. 4 sites subscribed (SearchField, SettingsTab, Printer3DDeviceView, EnergyDashboardDeviceView).
- **`useTabSliderPosition`** — extracted the position-calc useEffect from 3 of 4 tab-bars (HistoryTab, ContextTab, ScheduleFilter). DetailView's TabNavigation kept local (vertical+horizontal tracking is semantically different). Full `<AnimatedTabBar>` component extraction deferred — visual spring-config drift risk too high.

### v1.1.1721 — Long-Tail console.log + L4 targeted + M5 useSettingBroadcast

- ~120 console.log calls in 28 long-tail files swept (same Python script as v1.1.1717). Production source now ~7 calls total (all in logger.js + perfMarks.js, intentional).
- **L4 will-change audit**: 25 declarations reviewed. Only 1 was over-eager (`.controls-tab { will-change: opacity }` — permanent for a one-shot mount fade). Removed. Other 24 are correctly hover/active-scoped or on genuinely-animated elements. Touching the rest needs Chrome DevTools profiling on mid-tier Android.
- **M5 `useSettingBroadcast` hook + `broadcastSetting()`**: built and exported. Migration of 30+ sites deferred to a later release. Hook gives any new code a clean API without breaking the existing `dispatchEvent + addEventListener` pattern.

### v1.1.1722 — 3 deferred wins (M5 migration, M6, L5 advice)

User pulled the trigger on the deferred items.

- **M5 migration (mechanical)**: wrote Python script with balanced-paren tracking for both single-line and multi-line `window.dispatchEvent(new CustomEvent(...))`. Extracts event name + `detail` expression. Replaces with `broadcastSetting(name, detailExpr)`. Adds import with computed relative path. **30 dispatches in 17 files migrated.** One syntax-error from an inline-comment edge-case (`{ interval: x } // Convert)` placement) — fixed manually.
- **M6 `isEntityActive` per-site review**: audit said 25+ candidates; actual 41 sites. After per-site review, **only 1 safe replacement found**: `utils/entityScoring.js` had manual replication `state === 'on' || playing || open` (missed German states + lock/binary-sensor) — replaced. The other 40 are intentionally domain-specific (`historyUtils.js` distinguishes climate `'on'` vs `'heating'`, `deviceConfigs.js` per-domain controls use literal state values, `iconRegistry.js` has its own active-state list with `'recording'`/`'streaming'`/`'cleaning'`/`'above_horizon'` that `isEntityActive` doesn't cover). Mass-replacement would have introduced semantic regressions.
- **L5 advice dead-keys**: wrote Python AST-walker using `node --input-type=module` to dump de.js/en.js as JSON, then static-grep all `translateUI('key')` callsites + dynamic prefixes (`langData.states.*`, `langData.deviceClasses.*`). 41 `advice.*` keys verified dead (getSensorAdvice has local data) → deleted from both DE + EN.

### v1.1.1723 — timerNameGenerators bug + L5b 107 dead keys

**Bonus bug from v1.1.1722 audit**: `timerNameGenerators.js` had `translateUI('ui.climate.heat', lang)` with **duplicate `ui.` prefix**. `translateUI` prefixes internally → actual lookup `ui.ui.climate.heat` (doesn't exist) → falls back to key string. **Users saw literally "ui.climate.heat" instead of "Heizen"/"Heat" in timer-name displays.** 6× fix. After fix, the AST walker correctly registers ui.climate.* as live.

**L5b — verified 107 additional dead keys via per-bucket grep**:

| Bucket | Decision | Keys |
|---|---|---|
| `domains` (root) | Deleted whole bucket | 21 |
| `units` (root) | Deleted whole bucket | 18 |
| `actions` (root) | Deleted whole bucket (was for ContextTab, never integrated) | 27 |
| `ui.climate.*` | Kept 6 HVAC modes timerNameGenerators uses, deleted 22 others | 22 |
| `ui.tooltips.*Tab` | Deleted 8 Settings-Tab tooltips, kept 6 Filter-Toolbar tooltips | 8 |
| `ui.filters.*` | Kept only `areas` (SubcategoryBar reads it) | 3 |
| `ui.suggestions.*` | Kept only group-labels (used in searchFilters.js), deleted confidence-levels | 3 |
| `ui.viewModes.*` | Whole bucket unused | 2 |
| `ui.aiMode.followUp` | Only dead key in aiMode | 1 |
| `ui.common.*` | Deleted (`pleaseSelect` was only entry, never read) | 1 |
| `ui.general.favorites` | Deleted (other general.* keys kept) | 1 |

After v1.1.1722 (41 advice) + v1.1.1723 (107 more), **all 148 originally-identified dead keys removed.** AST walker reports 0 candidates. Translation dict: 802 → 654 keys (−18%).

---

## Recurring patterns from this session

### Sub-pixel CSS marquee lesson (v1.1.1708-1709)
JS-measured pixel distances are unreliable for seamless CSS animations. Use `translateX(-50%)` on a `width: max-content` track of N identical copies — browser percentage arithmetic is bit-perfect. Gap goes INSIDE each copy as `padding-right`, NOT as flex-gap between copies.

### "Inline element scrollWidth is clamped" (v1.1.1708)
A `<span>` with default `display: inline` inside a parent with `overflow:hidden; white-space:nowrap` has `scrollWidth ≈ parent clientWidth`. To measure natural text width: use `display: inline-block` (own layout box) + `getBoundingClientRect().width`.

### "hassRef pattern" (v1.1.1710, 1714, 1719)
For ANY `useEffect` that uses `hass` but shouldn't restart on every backend tick: stash `hass` in a `useRef` updated by a side-channel `useEffect`. Then drop `hass` from the main effect's deps. Original deps trigger; the effect's body reads via the ref.

This came up THREE times this session (DataProvider, StatsBar energy-load, the 2 latent-bug Tabs). Pattern is now broadly applied.

### "Module-level store + useState subscriber" pattern
`hassStore` (v1.1.1710), `iconSizeStore` (v1.1.1711), `isMobileStore` (v1.1.1718), `langStore` (v1.1.1720). All follow the same shape: module-level value + `Set<listener>` + `subscribeX()` returning unsub + `useX()` hook with `useState(getX) + useEffect(subscribe)`. Lazy-initialize the global listener inside `ensureInitialized()`. Snapshot listeners-Set before dispatch (mutation-safe).

This is now THE pattern for shared cross-component reactive state in this codebase.

### "AST walker via node --input-type=module" (v1.1.1722-1723)
For dump-and-analyze tasks on JS source files: `node --input-type=module -e "import('./file.js').then(m => console.log(JSON.stringify(m.default)))"` gives clean JSON. Way simpler than writing a JS-parser in Python.

### "Hook + ref-stashed mergeFn" (v1.1.1719)
When a hook accepts a callback that might be passed without `useCallback` (so identity changes per render), stash it in a ref in `useEffect`. Internal code uses `mergeFnRef.current`. Means the effect's deps don't include the callback — it can change identity freely without restarting the effect.

### Pre-commit hook discipline saved us (v1.1.1716)
After deleting `isDevelopment` from `App({ config })`, the `getStoredHass` import became unused. The `scripts/check-extraction-debt.py` pre-commit hook caught it. Fixed and re-pushed. Always trust the gate.

### Build.sh auto-commit (v1.1.1716, 1717, etc.)
`build.sh` self-commits the versionsverlauf.md as part of the release pipeline. After running it, `git status` shows the file is already committed. No separate commit needed. This caused some confusion early-session ("git diff says modified but git log shows committed?") — the answer is the script picks it up.

---

## What's deferred / on the roadmap

- **L1**: chart.js → uPlot + hand-rolled SVG donut (~64 kB gz bundle win, ~1-2 day migration). Already researched by agents in detail — see `docs/PERFORMANCE_ROADMAP.md`.
- **L2**: DetailView lazy-import via sidecar file (4-6 hours). User explicitly skipped after I described the 3 implementation options because the cost/benefit was unclear without L1 first.
- **L3**: Icons lazy-load per domain (3 hours). 56 icons all eagerly bundled.
- ~30 leftover `state === 'on'` sites that are intentional but should ideally use named domain-helpers (not `isEntityActive`).
- ~5 remaining inline `getItem('systemSettings')` callers (GeneralSettingsTab, MusicAssistantPanel, useSearchFieldState, energyDashboardService, index.jsx).
- Full `<AnimatedTabBar>` extraction (M2 partial — only the position-calc hook was extracted).
- Full `<Chevron>` migration to inline SVG callsites (~22 files still have inline `M1 1L6 6L1 11` SVG).

---

## Final state at session close (2026-05-26)

- **18 releases** v1.1.1706 → v1.1.1723
- **Bundle**: JS 1.74 MB raw → 1.53 MB (~−12% in total session, mostly from L4-1716 dead-code + v1.1.1712 inline-style extraction)
- **Translation keys**: 802 → 654 (~−18%)
- **`console.log` in production source**: ~314 → ~7 (all intentional infrastructure)
- **Dead window globals**: `window.debugNews/debugNewsImages/logNewsLiveEvents/newsEntity` all gone
- **Latent bugs fixed**: timerNameGenerators ui.-double-prefix, Printer3D + Energy Tab polling-restart-on-every-tick, formatRelativeTime plural rules divergence
- **New hooks/stores**: hassStore, iconSizeStore, isMobileStore, langStore, useEntityPolling, useScrollIndicators, useLang, useIsMobile, useTabSliderPosition, useSettingBroadcast, ScrollingDeviceState, logger
- **All 5 originally-identified perf wins shipped** (Splash-Gate, StatsBar, ChartJS-lazy, hassStore, iconSizeStore)
- **All 148 verified dead translation keys deleted**

User said "nein das reicht heute" after the L2 description. Solid 2-day cleanup marathon.
