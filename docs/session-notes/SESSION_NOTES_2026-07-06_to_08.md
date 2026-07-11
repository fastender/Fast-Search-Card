# Session Notes — 2026-07-06 → 2026-07-08 (v1.1.2079 → v1.1.2097)

Continuation of the 2026-07-05 perf/refactor session (which shipped batch 1). Three big arcs this stretch:
**(A)** finishing the performance/refactor roadmap (batches 2–5), **(B)** integrating real **Liquid Glass**
into the detail-right sheet — including a multi-day Safari mystery and a Safari refract-copy pilot, and
**(C)** the DetailView structural split (Batch 5, four releases, every phase agent-verified).

HARD RULES still in force: versionsverlauf ENGLISH every release; update `docs/info-popups/info-popups-catalog.md`
when an ⓘ is touched; version in `AboutSettingsTab.jsx`; build `echo "Y" | ./build.sh`; commit docs
(`src/` is gitignored — build is the only check, and there's **no git diff for source**).

## A. Perf/refactor roadmap batches 2–5 (v2079–2081, 2094–2097)
The July-05 three-agent analysis's remaining batches. See [[project_perf_refactor_2026_07_05]] for the full ledger.
- **Batch 2 (v2079) — per-tick cascade killed.** The real remaining win after the June flush fix: a
  `notifications` effect ran on EVERY hass tick, scanned all `hass.states`, and set a fresh array →
  `contextValue` invalidated per tick → every `useData()` consumer re-rendered. Fix: seed once per connection +
  signature-bail. Plus: **SearchField dropped its `useHass()`** (the biggest component re-rendered per raw tick) —
  the four real consumers (StatsBar, BentoStartView, DetailViewWrapper, a new `AreaHeaderSensors` in
  GroupedDeviceList) subscribe themselves. SubcategoryBar props memoized. Post-boot excluded entities now pass
  `filterExcludedEntities` before entering `entities`.
- **Batch 3 (v2080) — detail view off raw ticks.** DetailViewWrapper dropped `useHass()` (getHass() at
  service-call time); DetailView derives `hass = hassProp || getHass()` per render (it re-renders per entity flush
  anyway); UCT self-subscribes (the only `hass.states` render-reader in the subtree). 6 header getters deduped
  (were ×2 = 12 calls/render).
- **Batch 4 (v2081) — dead-code cleanup + a real bug.** 🐛 **SolarCarousel mock removed**: any entity with "solar"
  in its entity_id got a hardcoded fake carousel (5.2kW/2.8kW/85%) instead of its real slider. Plus: dead
  coverImage ring path (obsolete since v2075 full-bleed), `_mediaDuration`/`dragX`/`dragY`/`hasAnimated`, CSS
  orphans, PresetButtonsGroup rules-of-hooks fix, dead props. `initialTabName` left alone (feature gap → spawned as
  its own task, wired up in v2082 by a parallel background session).
- **Batch 5 (v2094–2097) — DetailView split**, see arc C below.

## B. Liquid Glass (v2083–2093) → dedicated memory [[project_liquid_glass]]
Real Apple-style refracting glass via `@samasante/liquid-glass` (material mode) as the sheet background.
- **v2083–2086:** integration + full appearance-settings panel (frost/refraction/color-fringe/tint, live via
  broadcast) + a perf/refactor hardening pass (grabber isolated so drag doesn't re-render the glass, `useMemo`
  optics, `useLiquidGlassSettings` hook, dedup'd slider markup).
- **v2087–2088:** batch A (toggle-remount bug fixed → Glass is a background LAYER + dummy child; `mapSize:256`;
  rAF-throttled broadcast) + batch B (dead glass CSS removed; the user-settings backdrop-filter chain was
  copy-pasted 3× → one `--glass-backdrop`/`--glass-tint-bg` source on the carrier elements — NOT `:root`, whose
  matching is injection-dependent).
- **🔍 v2089 — the Safari mystery solved.** User: "Brechung/Farbsaum-Slider wirken nie." Systematic isolation
  (minimal `backdrop-filter:url()` shadow tests → real `<Glass>` → real sheet, all in Chromium preview) proved the
  whole chain works. Resolution: the user tested in **Safari** — WebKit can't render SVG reference filters in
  `backdrop-filter` at all (frost+tint only, by design). Signature: **frost works, refraction doesn't → non-Blink.**
  Chrome 150 desktop = full effect. Slider footers now say "Chrome/Edge only".
- **🍎 v2090–2091 — Safari refract-copy pilot.** WebKit CAN run `filter:url()` on an element → refract a
  position-synced COPY of what's behind (cover `<img>` v2090, entity `<video>` clone + `live` flag v2091). The copy
  counter-translates per drag frame (`refractY`) to stay pixel-aligned. **WebKit-verified locally via Playwright**
  ([[reference_playwright_webkit]]) — new capability this session.
- **v2092–2093:** user found the mitfahrende copy distracting → refract-copy made **opt-in, default off**. Full
  optics set exposed (bend/sheen/glow/brightness, defaults = lib material defaults). Sub-options hidden when
  disabled; footers → ⓘ popups (catalog updated). **Sheet scroll-to-bottom bug fixed**: at half/peek the sheet is
  translated down, so the end of the scroll content sat below the card edge — `--sheet-bottom-pad` (= snap offset)
  restores the headroom.
- **Lib comparison:** vs `simple-liquid-glass` (lucaperullo) — same Chromium core, but it removed its Safari
  copy-engine in v4.0 (unreliable on real iOS). Stay on samasante. ⚠️ **package.json is gitignored** → dep local
  only.

## C. Batch 5 — DetailView structural split (v2094–2097, 917 → ~510 lines)
Each phase: snapshot the old file to scratchpad (no git diff for src!) → python-scripted block edits with
assert-anchors → build → **parity-review AGENT** compares snapshot vs new files token-level. Every phase: zero
deviations.
- **Phase 1 (v2094):** `useDetailHeaderInfo` (formatTimeAgo + 6 domain header getters + 15s tick) + `DetailLeftPane`
  (left IIFE → pure-props component; video state/refs STAY in the orchestrator — its load effect needs them).
- **Phase 2 (v2095):** `DetailRightPane` (effect-free) + `useSheetPortal`. 🔑 **Freeze-trap:** the portal/exit
  lifecycle MUST stay a hook at DetailView level — AnimatePresence freezes the exiting subtree, so an effect inside
  the pane would never see `isVisible→false` and the v2067 hanging-sheet bug would silently return. Documented in
  the hook.
- **Phase 3 (v2096):** `DetailTabContent` — renderTabContent as a stateless component that builds ONLY the active
  tab (a `switch`; old `contents[activeTab] || [0]` → default case).
- **Phase 3b (v2097) — perf-analysis A1 closed.** `tabNav`/`tabContent`/`filteredTabIcons` memoized at hooks level
  (BEFORE the `if (!item) return null` — never inside the conditional IIFE); wrapper handlers `useCallback`'d +
  `detailItem` memo + `devicesRef` (devices as a dep would defeat the memos per flush). Foreign entity flushes now
  skip the whole right pane (Preact `_original` bailout). 🔑 `hass` DELIBERATELY not a memo dep (WS-only on the
  stale-but-live connection; UCT self-subscribes); TabNavigation stays viewRefs-live because it subscribes
  ViewRefContext itself (context updates bypass vnode memoization).

## Reusable lessons this session
- **Diagnostic signature reading** beat guessing twice: "frost works, refraction doesn't" → Safari; "round-number
  perf deltas" heuristic from earlier sessions echoed here (isolate in a minimal repro before theorizing).
- **Parity-review agents** are the right tool when `src/` is gitignored (no diff): snapshot-before + token-level
  agent comparison caught the freeze-trap risk and confirmed 4 phases.
- **CSS var on carrier elements, not `:root`** — whether `:root` matches in the target DOM depends on how styles
  are injected; pseudo-elements inherit from their carrier, so define shared recipes there.
- **Playwright WebKit** is now the way to prove Safari behavior locally (see reference memory).

Remaining open: **UniversalControlsTab 5-phase split** (~1200 lines — the last big Batch-5 item). Plus the older
cleanup backlog (settings-shell `useSettingsSubViews`) and parked items (glass/blur reduction = user design call,
`isEntityActive` bug = per-domain visual test).
