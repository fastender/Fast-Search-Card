# Versionsverlauf

## Version 1.1.1245 - 2026-04-25

**Title:** Boot-time profiling — `performance.mark` instrumentation, no behavior change
**Hero:** none
**Tags:** Performance, Diagnostics

### Why this release

After the Phase 1–3 boot wins (snapshot, warm-cache, splash trim, thermal fixes), the next round of optimizations would each save 20–60 ms in theory. That's small enough to want **measurements before more code changes** — otherwise we'd be guessing which 30 ms to optimize.

This release is instrumentation only. No behavior change.

### What was added

A small `src/utils/perfMarks.js` helper exposing:

- `perfMark(name)` — wraps `performance.mark('fsc:' + name)` plus appends to an in-memory list.
- `perfDump()` — prints the list as a `console.table` plus a copy-paste-friendly text block.
- `perfReset()` — clear and start fresh for a re-measurement.
- `window.__fsc_perf` — manual access in the DevTools console.

### Marks placed (in chronological order)

| Mark | Where | What it captures |
|---|---|---|
| `element-constructor` | `build.sh` Custom Element ctor | Earliest mark — fires before JS bundle is evaluated |
| `bundle-evaluated` | top of `src/index.jsx` | Bundle parsed, module-level code running |
| `app-first-render` | first call to `App()` | Preact has begun rendering |
| `loadapp-start` | `src/index.jsx:loadApp` async start | Begin appearance-settings parse |
| `loadapp-done` | end of `loadApp` | `setIsLoadingComplete(true)` about to fire |
| `dp-snapshot-init` | `DataProvider` `useState` initializer | localStorage snapshot loading |
| `dp-init-start` | `initializeDataProvider` start | DataProvider effect fired |
| `dp-db-init` | after `dbRef.init()` | IndexedDB connection ready |
| `dp-registry-done` | after `systemRegistry.initialize()` | System entities mounted |
| `dp-critical-done` | after `loadCriticalData()` | Settings + favorites loaded |
| `dp-warmcache-done` | after `loadEntitiesFromCache()` | IndexedDB warm-cache merged |
| `dp-initialized` | after `setIsInitialized(true)` | UI is allowed to reveal |
| `dp-ha-start` | start of `loadEntitiesFromHA` | HA fetch begins |
| `dp-ha-fetched` | after `Promise.all([loadAreas, loadDeviceReg, loadEntityReg])` | Registries pulled |
| `dp-ha-scored` | after `scoreEntities` | Per-entity usage scoring done |
| `dp-ha-rendered` | after `setEntities(allEntities)` | Real cards committed to state |
| `dp-ha-indexed` | after `buildSearchIndex` | Search index complete; auto-dump fires |

After `dp-ha-indexed` the helper schedules a `setTimeout(0)` callback that calls `perfDump()`. The user sees the full timeline in the browser console without any manual action.

### How to read the output

Open the dashboard with the DevTools console open. After ~3–5 seconds you'll see:

```
[fsc:perf] Boot timeline (relative to first mark):
┌─────────┬──────────────────────┬──────────┬──────────┐
│ (index) │ step                 │ total_ms │ delta_ms │
├─────────┼──────────────────────┼──────────┼──────────┤
│ 0       │ element-constructor  │ 0.0      │ 0.0      │
│ 1       │ bundle-evaluated     │ 412.3    │ 412.3    │
│ ...
```

`total_ms` is time since the first mark (the constructor). `delta_ms` is time since the previous mark — that's where the bottleneck shows up: the largest delta is the slowest step.

The same data is also in DevTools Performance → User Timing as `fsc:*` named entries, so you can see them inline with the broader profile.

### What this is for

Once you've got a profile from Safari (or wherever the slowness is most pronounced), paste the copy-paste-friendly text block back to me. The next round of optimization picks the actual largest delta — not a guess.

### What this isn't

- Not a behavior change. All marks are no-ops if `performance` is missing.
- Not a perf regression. Each `perfMark` is a few microseconds. Total overhead across all marks is below human-perception threshold.
- Not enabled-only-in-dev. The marks ship in the production bundle so we can measure the actual production behavior. They cost essentially nothing.

---

## Version 1.1.1244 - 2026-04-24

**Title:** Thermal fixes round 2 — pending pulse + state_changed throttle
**Hero:** none
**Tags:** Performance, Mobile, Bug Fix

### Context

After v1.1.1242 replaced the skeleton shimmer's `background-position` animation with a compositor-only opacity pulse, the phone was still getting hot. A systematic audit turned up two more ongoing heat sources that aren't tied to the skeleton:

1. **`pendingPulse` on device cards** animated `box-shadow` at 60 fps while a service call was in flight. Same paint-per-frame pattern that v1.1.1181 fought back with the "Icon-Diät", and what v1.1.1242 fixed for the skeleton. When the user taps multiple toggles in quick succession, several 1.1 s overlapping box-shadow loops run at once.
2. **`state_changed` events had no rate limit.** The existing rAF batcher in `DataProvider.scheduleEntityStateUpdate` only guaranteed "at most one `setEntities` per frame" — so if Home Assistant pushes events in a stream (energy sensors, automations, presence), up to 60 `setEntities` calls per second would land. Each call re-renders `SearchField` (1100 lines, not memoized), `useMemo`s recalculate, Virtua remeasures, framer-motion re-interpolates its animated props. That's sustained CPU on mobile.

### Fix 1 — pendingPulse: box-shadow → opacity ring

Before:

```css
@keyframes pendingPulse {
  0%   { box-shadow: 0 0 0 0 rgba(100, 180, 255, 0.35); }
  50%  { box-shadow: 0 0 0 3px rgba(100, 180, 255, 0.18); }
  100% { box-shadow: 0 0 0 0 rgba(100, 180, 255, 0.0); }
}
.device-card.pending { animation: pendingPulse 1.1s infinite; will-change: box-shadow; }
```

Problem: `box-shadow` paints the entire card rectangle every frame. `will-change: box-shadow` keeps a Compositor layer alive the whole time the card is mounted (even when no animation is running).

Now:

```css
@keyframes pendingPulse {
  0%, 100% { opacity: 0; }
  50%      { opacity: 1; }
}
.device-card.pending::after {
  content: ''; position: absolute; inset: -2px; border-radius: inherit;
  border: 2px solid rgba(100, 180, 255, 0.55);
  animation: pendingPulse 1.1s infinite;
}
```

A pseudo-element ring, opacity-only animation. The ring is a static border (paint once), the animation only changes opacity (compositor-only, GPU blends the layer at varying alpha). Same visual signal ("I'm working on this"), near-zero GPU cost.

### Fix 2 — min 150 ms between state_changed flushes

`DataProvider.scheduleEntityStateUpdate` now tracks `lastFlushAtRef` and enforces a minimum 150 ms gap between flushes. Events arriving inside that window accumulate in the pending `Map` (last-write-wins per `entity_id`) and flush together at the end of the window.

- Before: up to 60 re-renders per second when HA fires a stream of events.
- After: at most ~6–7 re-renders per second. Sensor updates arrive visually in the same frame as before (human perception threshold is ~100 ms anyway).

Safari's natural rAF throttling for hidden tabs still applies on top of this — when the card is backgrounded, rAF won't fire at all, events just accumulate.

### What this doesn't fix

The audit also flagged:
- **Framer-motion `animate={{ boxShadow: ... }}`** on `SearchField` — string interpolation each re-render. Candidate for the next round if heat persists.
- **`.glass-panel` backdrop-filter** with `blur(20px + user-configured)` on multiple stacked panels (StatsBar + Panel + Sidebar) — expensive on mobile GPU, but removing or reducing it would change the design. Could add a mobile-reduced-blur media query, but that's a visual call, not a bug fix.
- **Printer3D `setInterval(..., 2000)`** polling — only runs if the user has a 3D printer and opens that view. Not a general heat source.

If v1.1.1244 still leaves the phone warm, next step is an on-device Chrome/Safari Performance profile — we need data, not more guesses.

---

## Version 1.1.1243 - 2026-04-24

**Title:** StatsBar flashes "--°C / 0.0 kW" — snapshot was being wiped right after loading
**Hero:** none
**Tags:** Bug Fix, Performance

### The regression

User reported seeing "--°C" for weather and "0.0 kW" for grid consumption in StatsBar right after a cold boot, even after the snapshot warm-cache from v1.1.1241 was in place. The snapshot is supposed to make cards visible from the first render — so why was StatsBar missing its inputs?

### Root cause

`initializeDataProvider` in `DataProvider.jsx` had this sequence:

```
useState initializer → entities := snapshot (120 non-system entities including weather)
useEffect fires → dbRef.init() → systemRegistry.initialize()
  → setEntities(systemEntities)          ← REPLACES the snapshot entities!
→ loadCriticalData()
→ loadEntitiesFromCache (IndexedDB)      ← re-populates, but state was empty in between
→ setIsInitialized(true) → UI renders
```

Line 399 was `setEntities(systemEntities)` — a straight replace. It wiped every non-system entity that the snapshot had just loaded, including the `weather.*` entity that StatsBar's `useMemo` depends on. For the ~50–500 ms window between "system registry done" and "IndexedDB warm-cache done" (longer on Safari), StatsBar saw an empty device list → `weatherEntity` was `null` → `--°C`.

### Fix

`setEntities` now uses a functional updater that merges system entities with whatever non-system entities were already there:

```js
setEntities(prev => {
  const nonSystemPrev = prev.filter(e => !e.is_system);
  return [...systemEntities, ...nonSystemPrev];
});
```

Now the sequence is:

1. Snapshot loads 120 non-system entities in the useState initializer (sync).
2. `systemRegistry.initialize()` finishes → system entities merged in. Snapshot entities preserved.
3. IndexedDB warm-cache replaces the non-system tier with a fresher/wider set. System entities preserved.
4. `loadEntitiesFromHA` replaces everything with live HA data.

Three paint updates, same as before, but the StatsBar widget never sees an empty device list anymore. Weather temperature, grid consumption, solar production — all visible from the first frame on warm boots.

### Why this wasn't caught earlier

The warm-cache wipe existed in the original code too — but back then `useState([])` started empty, so "wiping to just system entities" was equivalent to "filling in the system entities". The snapshot from v1.1.1241 changed the initial state from empty to populated, and the replace became a regression.

### Not changed

- Energy dashboard (`energyData`) is still fetched async via `getEnergyDashboardData`. The "0.0 kW" in the screenshot is the live sensor state from `hass.states` (via `getEnergyValue` fallback), which works the same as before. If it shows 0.0 kW right after boot, that's either the actual consumption at that moment or the sensor is still populating — not affected by this fix.

---

## Version 1.1.1242 - 2026-04-24

**Title:** Skeleton shimmer → opacity pulse (thermal fix, mobile GPU)
**Hero:** none
**Tags:** Performance, Bug Fix, Mobile

### The regression

After v1.1.1238 and v1.1.1240 added skeleton shimmer animations in two places (React-level `perceivedSpeed.css` and pre-JS HTML placeholder in `build.sh`), the phone was getting warm again. Exactly the same thermal pattern as v1.1.1181's "58 → 42 endless SVG animations" fix.

### Why

The shimmer keyframe animated `background-position`:

```css
@keyframes skeletonShimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

`background-position` is **not compositor-accelerated**. The browser has to repaint the entire element on every frame. With 8 skeleton cards + a title + a search bar shimmering at 60 fps, that's 600+ paints per second, all on the main thread, all forcing GPU texture uploads on mobile. Heat.

### The fix

Opacity pulse instead. Opacity is compositor-only — the GPU blends an existing texture at a different alpha, no repaint, no texture upload:

```css
@keyframes skeletonPulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.45; }
}
.device-card-skeleton {
  background: rgba(255, 255, 255, 0.08);
  animation: skeletonPulse 1.6s ease-in-out infinite;
}
```

Applied in both places:
- `src/styles/perceivedSpeed.css` — React-level skeleton (shown while entities load)
- `build.sh` `_createPlaceholder` — HTML placeholder (shown before Preact mounts)

Same timing (1.6 s), same reduced-motion fallback, much less thermal load. Visually still clearly "this is loading" — pulse-style skeletons are the LinkedIn / Facebook / YouTube pattern.

### What this means for the user

- Same boot-perf wins from v1.1.1238–1241 stay.
- Phone should no longer heat during the brief skeleton phase.
- If heat persists after this, the cause is elsewhere (e.g. `pendingPulse` box-shadow animation during service calls, framer-motion re-layouts, or something older) and needs a Chrome Performance profile on-device to pinpoint.

### Audit of remaining infinite animations

Checked every `animation: ... infinite` in the codebase. All compositor-friendly:
- `spin` (6 places): `transform: rotate()` — compositor-only ✓
- `pulse` (various views): mostly opacity or transform ✓
- `float` (WeatherView): transform ✓
- `pendingPulse` (perceivedSpeed.css): animates `box-shadow` (paint), but only runs briefly during a service call — not a thermal concern

---

## Version 1.1.1241 - 2026-04-24

**Title:** localStorage snapshot — Safari-friendly 1st-tier warm cache
**Hero:** none
**Tags:** Performance, Safari

### Context

After v1.1.1240 dropped the splash padding and added a pre-JS skeleton in the Custom Element placeholder, Safari still felt sluggish between "skeleton visible" and "real cards visible". Two reasons, both Safari-specific:

1. **IndexedDB open is slow on WebKit.** 50–500 ms on first connect, compared to ~20 ms on V8. The warm-cache from v1.1.1239 reads from IndexedDB, so it inherits this latency.
2. **Big JS bundle parses slower.** 1.4 MB (366 KB gzipped) takes 500–1500 ms to parse on Safari. Everything downstream has to wait.

(1) is addressable. (2) is not, without breaking the HACS single-file constraint.

### The fix — three-tier warm cache

Memory (cache), IndexedDB, localStorage, HA. Previously only the last three were in the boot path, and the fastest of them still involved async I/O. Now we have a synchronous front-of-queue:

1. **localStorage** — synchronous, ~1 ms even on Safari. Top-120 entities with just the fields a device card needs (entity_id, domain, state, attributes, area, relevance_score, usage_count, last_changed/updated). Read in the `useState` initializer, so Preact renders cards in the very first render frame — before any effect fires.
2. **IndexedDB** — async, 50–500 ms on Safari. Full entity shape, richer metadata. Reads in `initializeDataProvider` after `loadCriticalData`. Overrides the localStorage tier via a functional `setEntities` updater.
3. **Home Assistant** — async, 2–4 s. Fresh authoritative data. `loadEntitiesFromHA` runs via the existing `hass`-retry `useEffect`.

The three writes use Preact's keyed reconciliation (`entity_id`), so cards stay mounted through all three updates — no flash, no layout shift, no re-animation.

### New file — `src/utils/entitiesSnapshot.js`

Three exports:

- `loadEntitiesSnapshot()` — sync read from `localStorage['fsc_entities_snapshot_v1']`, returns `[]` on any failure (private browsing, disabled storage, parse error).
- `saveEntitiesSnapshot(entities)` — filters non-system, sorts by `relevance_score`, caps at 120 entities, writes compact JSON. ~15–20 KB at cap, well within Safari's localStorage quota.
- `clearEntitiesSnapshot()` — wipes the key. Called from `resetLearningData` so the next boot doesn't paint stale usage counts.

### Wiring

**Read path** — `DataProvider.jsx`:

```js
const [entities, setEntities] = useState(() => {
  const snap = loadEntitiesSnapshot();
  if (snap.length === 0) return [];
  const liveStates = hass?.states;
  if (!liveStates) return snap;
  return snap.map(e => {
    const live = liveStates[e.entity_id];
    return live
      ? { ...e, state: live.state, attributes: live.attributes, last_changed: live.last_changed, last_updated: live.last_updated }
      : e;
  });
});
```

`hass` is already passed as a prop when DataProvider mounts (HA calls `setHass` before the card is visible). So the initializer can enrich the cached shape with live state right away — no stale on/off.

**Write path** — end of `loadEntitiesFromHA`, right after the existing `setEntities(allEntities)`:

```js
saveEntitiesSnapshot(allEntities);
```

### What changes for the user

- **First ever boot on a device:** no snapshot → no change. Skeleton still carries the wait.
- **Every subsequent boot:** the React-level skeleton never even renders. Cards are visible in the first paint frame after Preact mounts. On Safari this saves the full IndexedDB-open cost — 50–500 ms of pure waiting, gone.
- **After "Reset Learning Data":** snapshot is cleared, next boot behaves like a first-boot (skeleton carries the wait until fresh HA data writes a new snapshot).

### What this does NOT do

- Does not shrink the 1.4 MB bundle. JS parse time on Safari is untouched.
- Does not pre-open IndexedDB in parallel with Preact mount (option C from the plan — lower priority now that snapshot short-circuits the IndexedDB path for rendering).
- Does not touch the data flow for settings or favorites — those stay in IndexedDB via `loadCriticalData`.

---

## Version 1.1.1240 - 2026-04-24

**Title:** Splash delays gone + pre-JS skeleton in Custom Element placeholder
**Hero:** none
**Tags:** Performance, UX, Safari

### Context

After v1.1.1238 (deferred GitHub fetch + React-level skeleton) and v1.1.1239 (IndexedDB warm-cache), Chrome / iPhone HA app felt clearly faster. Safari (iOS + macOS) did not — still slow to reach the first interactive paint. Two reasons: the splash screen was still holding 2.5 s of hardcoded `setTimeout` padding that was originally calibrated to the old ~2.5 s app-load, and Safari's slower JS start-up meant the Custom Element placeholder (a centered "🔍 Loading…") was visible for longer than on other engines.

This release addresses both.

### Fix A — drop the splash padding

`src/index.jsx` used to chain five `setTimeout`s between progress bar stages:

```
0 % → wait 250 ms → 25 % (parse settings) → wait 500 ms
    → 50 % → wait 500 ms → 75 % → wait 500 ms
    → 100 % → wait 750 ms → reveal
```

Total artificial wait: 2500 ms. Those delays were added back when `DataProvider` itself needed ~2.5 s to become ready; the splash *covered* that cost. With Phase 1 + Phase 2, real init is under 200 ms on warm boots, so the padding is pure cost.

Now:

```
0 % → parse settings (real work) → 100 %
    → 120 ms flash protection → reveal
```

`splashDrawingDone` still gates the 'hello' splash (Apple Hello animation is a deliberate design choice, untouched), so users on that style still see the full lettering. Users on the default 'progress' style now get ~120 ms of splash instead of 2.5 s.

### Fix B — skeleton IN the Custom Element placeholder (pre-Preact)

`build.sh` writes a Shadow-DOM placeholder straight into the Custom Element constructor. This HTML is the very first thing Safari (or any browser) renders, *before* the main 1.4 MB bundle is even parsed. It used to be:

```html
<div>🔍 Fast Search Card</div>
<div>Loading…</div>
```

Visually: a plain white box with centered text.

New placeholder renders a pure-HTML+CSS skeleton with:

- A fake search bar (56 px high, rounded 28 px, shimmer)
- A fake section title (16 × 140 px, shimmer)
- An 8-card skeleton grid — 4 cols desktop, 3 cols tablet, 2 cols mobile

Same `@keyframes fscShimmer` as the React-level skeleton from v1.1.1238, scoped inside the shadow root so no style leak. `prefers-reduced-motion` disables the animation. The `_render()` function already removes `.fsc-placeholder` when Preact mounts, so no wiring change needed there.

### Expected effect

- **macOS Safari / iOS Safari:** the blank-white-box moment is gone. From the first frame the user sees a structured shimmering grid. The real app takes over once Preact finishes parsing (~300–800 ms later depending on CPU), and warm-cache cards arrive within another ~50 ms.
- **Chrome / Firefox / iPhone HA app:** also benefits — the placeholder was white there too, just for shorter. Combined with the splash-delay removal, the total perceived boot on a warm second start is now ~200–400 ms before real cards appear.

### What this does NOT do

- The Apple Hello splash animation timing is unchanged — that's a designed experience, not a bottleneck.
- The real JS bundle size (1.4 MB / 366 KB gzip) is untouched. Code-splitting would break the HACS single-file constraint.
- No DataProvider or SearchField refactor. Still pending but not now.

---

## Version 1.1.1239 - 2026-04-24

**Title:** IndexedDB warm-cache — panel is populated in ~0 ms from second boot onwards
**Hero:** none
**Tags:** Performance

### The idea

The card has persisted HA entities to IndexedDB for a long time already (the `STORES.ENTITIES` batch-write at the end of `loadEntitiesFromHA`). But on boot, that cache was never read unless `hassRef.current` was missing — i.e. dead code for every real HA session. The full first paint always waited for `loadEntitiesFromHA` to round-trip (~2–4 s on iPhone).

Now: boot reads the cache and renders it before `loadEntitiesFromHA` even starts. Second boot onwards, the panel is populated immediately.

### What the warm cache does

1. **Read from IndexedDB.** New `loadEntitiesFromCache(db, hassRef)` in `dataLoaders.js` pulls all non-system entities out of `STORES.ENTITIES`.
2. **Enrich with live state.** Cached entities carry stale `state` from the last session (a light might be stored as "on" even if it's actually off now). To avoid showing stale state, each cached entity is merged with `hassRef.current.states[entity_id]` if available — cached shape (`name`, `area`, `icon`, `relevance_score`) plus live `state`, `attributes`, `last_changed`, `last_updated`. When `hass.states` isn't yet populated, we fall back to cached state; `loadEntitiesFromHA` will correct it a beat later.
3. **Apply excluded patterns.** Same `filterExcludedEntities` as the main path — no risk of showing entities the user has since excluded.
4. **Merge with system entities.** System entities always come from the registry (never cached). Warm-cache `setEntities` uses the functional updater: `prev.filter(is_system)` stays, non-system is replaced with the cache payload.

### Wiring

`initializeDataProvider` in `DataProvider.jsx`:

```
IndexedDB.init()
systemRegistry.initialize() → setEntities(systemEntities)   # 5–6 entities
loadCriticalData()                                           # settings + favorites
→ NEW: loadEntitiesFromCache → setEntities([sys + cached])  # full warm list
setIsInitialized(true)                                       # UI reveals
loadBackgroundData() → loadEntitiesFromHA()                  # fresh data replaces
```

The hass-retry `useEffect` still fires once `isInitialized` flips to `true`, so fresh entities overwrite the warm cache via the same `setEntities(allEntities)` call as before. Preact's keyed reconciliation (keyed by `entity_id`) means the cards stay mounted during the swap — no flash, no re-animation.

### Expected effect

- **First ever boot:** cache is empty → no benefit, skeleton shimmer from v1.1.1238 carries the ~3–5 s until `loadEntitiesFromHA` finishes.
- **Every subsequent boot (~99 % of sessions):** `devices.filter(d => !d.is_system).length === 0` flips false in roughly one IndexedDB read (~20–50 ms). Panel is populated before the user notices. Fresh state arrives 2–4 s later but the swap is invisible.

### What this does NOT do

- **No IndexedDB write optimization.** The batch-put at the end of `loadEntitiesFromHA` is unchanged — the cache just now gets *read* too.
- **No splash change.** The setTimeouts in `index.jsx` are still the ~2.5 s they've been. Once we have real measurements of the warm-cache effect, we can re-tune the splash. Not now.
- **No DataProvider split.** Still 1100+ lines; still the right call to leave it alone for now.

---

## Version 1.1.1238 - 2026-04-24

**Title:** First-Load perf — defer changelog fetch + skeleton cards
**Hero:** none
**Tags:** Performance, UX

### The problem

On the very first start (iPhone app or desktop browser) the expanded panel stayed empty for 3–10 seconds before device cards appeared. Root-cause audit across both recent session notes revealed two layers stacking on top of each other:

1. **Versionsverlauf entity blocked the registry init.** Its `onMount` did a synchronous GitHub fetch for `docs/versionsverlauf.md`. The `systemRegistry.initialize()` call in `DataProvider` awaited `Promise.all([...onMount(), ...])`, so the slowest mount — this one, ~150–300 ms on slow networks — gated everything else, including `loadEntitiesFromHA`.
2. **No visual feedback between splash fadeout and first cards.** Once the splash screen disappeared, the expanded panel rendered but `groupedFilteredDevices` was still empty. `GroupedDeviceList` returned `null`, so the user saw a blank panel area for the remaining 2–4 s while HA entities loaded.

### Two minimal fixes

**1. Versionsverlauf cache-only on boot**

`onMount` now reads `localStorage.versionsverlauf_cache` directly (synchronous, ~1 ms) and never touches the network. The GitHub fetch still happens — just lazily, when `VersionsverlaufView` itself mounts (its own `useEffect` already calls `executeAction('loadChangelog')`). First-time users without a cache see an empty list until they open the view; next boot the cache is warm anyway.

New `loadFromCacheOnly` action alongside the existing `loadChangelog`. Separation of concerns:
- `loadFromCacheOnly` — boot path, synchronous, no network
- `loadChangelog` — view path, cache-first with GitHub fallback (unchanged)

**2. Skeleton cards during entity load**

While `devices.filter(d => !d.is_system).length === 0` (HA entities haven't arrived yet), `GroupedDeviceList` now renders a shimmer-animated placeholder grid: 2 fake section headers with a column-matched row of fake cards each. Columns honor `useColumnCount` so the skeleton stays visually consistent with the real grid.

The shimmer stops the moment real rooms arrive — no transition jank. `aria-busy="true"` + `aria-live="polite"` for accessibility. `prefers-reduced-motion` disables the animation.

### What this does NOT do

- **Does not shorten the splash setTimeouts** (still 250 + 500 + 500 + 500 + 750 ms). Removing them without also speeding up the real load would make things visually worse — the splash currently hides the init gap. Next release once we measure the registry improvement.
- **Does not add IndexedDB warm-cache read** (next release, medium complexity).
- **Does not refactor DataProvider or SearchField.** Both are 1100+ lines and overdue for splitting, but high-risk right now. Fix the acute pain first.

### Expected effect

- Versionsverlauf: ~150–300 ms earlier registry completion on cold starts.
- Skeleton: the 3–10 s gap is no longer a blank panel — shimmer fills the visual void so the card feels alive from the first frame after splash.

---

## Version 1.1.1237 - 2026-04-24

**Title:** Sidebar –10 % instead of –20 %, iOS navbar title now actually centered
**Hero:** none
**Tags:** Bug Fix, Design

### Two fixes

**1. Sidebar slightly less slim**

Horizontal padding adjusted to 12 px (from 8 px in v1.1.1236). Net change vs. the original 16 px is ~–10 % in width – the previous –20 % was too much.

```css
.vpm-menu.glass-panel { padding: 12px 12px; }
```

**2. iOS navbar title centering bug**

Inside version-detail pages (and every other iOS-style navbar) the title uses `position: absolute; left: 50%; transform: translateX(-50%)` to center itself. But the parent `.ios-navbar` was missing `position: relative`, so the title was positioned against a far ancestor and visually landed at the left next to the back button instead of centered.

Fix: one line in `.ios-navbar`:

```css
position: relative;
```

All navbars using `.ios-navbar` + `.ios-navbar-title` now show a properly centered title.

### Changed files

- `src/components/SearchField/SearchField.css` – `.vpm-menu.glass-panel` padding
- `src/system-entities/entities/news/components/iOSSettingsView.css` – `.ios-navbar { position: relative }`

### Test

- Sidebar is a little wider than after v1.1.1236, a little slimmer than before
- Versionsverlauf → pick any version → detail page title (e.g. `v1.1.1236`) is now horizontally centered in the navbar, not stuck next to the "Back" button

---

## Version 1.1.1236 - 2026-04-24

**Title:** Sidebar 20 % slimmer + font stack matches StatsBar
**Hero:** none
**Tags:** Design

### Two small tweaks

**1. Narrower rail**

Container horizontal padding cut from 16 px to 8 px (vertical stays at 12 px). The pill is now ≈ 20 % slimmer in the collapsed state. Item padding and icon size are unchanged – more breathing space on the page, same hit-area.

**2. Font stack unified**

The rail used `system-ui, -apple-system, sans-serif` while the StatsBar uses the Apple-style fallback chain. The rail now matches:

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

Same look as the rest of the glass UI (StatsBar, GreetingsBar, etc.).

### Changed file

- `src/components/SearchField/SearchField.css` – `.vpm-menu.glass-panel` padding + font-family

### Test

Visual inspection; the rail should look noticeably slimmer and label text (when expanded) should share the same weight / metrics as the StatsBar pill above.

---

## Version 1.1.1235 - 2026-04-24

**Title:** StatsBar vertical padding doubled (6 → 12 px), DetailView top offsets adjusted
**Hero:** none
**Tags:** Design

### Small height tweak

Vertical padding on the StatsBar pill was 6 px top & bottom – a bit tight. Doubled to 12 px for more breathing room around icons and text. Horizontal padding unchanged (12 / 16 px on mobile / desktop).

```jsx
padding: isMobile ? '12px 12px' : '12px 16px'
```

Because the pill is now ~12 px taller, the DetailView top offset moved up by the same amount so the detail panel still starts flush with the bottom of the StatsBar:

```js
const statsBarHeight = statsBarEnabled ? (isMobile ? 57 : 64) : 0;
// previously: (isMobile ? 45 : 52)
```

### Changed files

- `src/components/StatsBar.jsx` – inline padding
- `src/components/SearchField/components/DetailViewWrapper.jsx` – `statsBarHeight` + 12 px on both breakpoints

### Test

- Expand panel → StatsBar pill looks less cramped, icons + text nicely centered
- Open a device → DetailView lands directly below the StatsBar with no overlap and no visible gap

---

## Version 1.1.1234 - 2026-04-24

**Title:** Sidebar inherits user background, 12 × 16 px padding, StatsBar gated by expand
**Hero:** none
**Tags:** Design, UX

### Three adjustments

**1. Sidebar now shares the glass background with StatsBar + panel**

Replaced the custom `apple-window` look (hard-coded `rgba(0,0,0,0.25)` + local blur) with the project-wide `glass-panel` class. That class reads the user-configurable CSS variables (`--background-blur`, `--background-saturation`, `--background-brightness`, `--background-contrast`, `--background-grayscale`) via `::before`, so Appearance settings now affect the sidebar exactly like they affect StatsBar and the expanded panel.

```jsx
<ul className="vpm-menu glass-panel">
```

Border-radius override keeps the 2 rem pill look:

```css
.vpm-menu.glass-panel {
  border-radius: 2rem !important;
  padding: 12px 16px;   /* matches StatsBar */
  …
}
```

**2. Padding aligned with StatsBar**

`12 px` vertical / `16 px` horizontal on the rail container. Icon hit-areas remain unchanged.

**3. StatsBar now appears only when the panel is expanded**

Same gating pattern as the sidebar. The `show` prop is now `statsBarSettings.enabled && isExpanded`. When the panel is collapsed the StatsBar disappears along with the sidebar – cleaner idle state, more focus on the search bar.

### Changed files

- `src/components/SearchSidebar.jsx` – class swap `apple-window` → `glass-panel`
- `src/components/SearchField/SearchField.css` – old `.apple-window` block removed, new `.vpm-menu.glass-panel` block with padding 12 × 16
- `src/components/SearchField.jsx` – `show={statsBarSettings.enabled && isExpanded}` on `<StatsBar>`

### Test

- Reload card collapsed → no StatsBar, no sidebar
- Click to expand panel → both appear, sharing the same glass background
- Settings → Appearance → change Background Blur / Saturation → sidebar reacts together with StatsBar and panel
- Sidebar padding matches the StatsBar pill (12 × 16 px)

---

## Version 1.1.1233 - 2026-04-24

**Title:** Sidebar next to panel (12 px gap), stays visible during DetailView, detail top 54 → 52
**Hero:** none
**Tags:** Bug Fix, Design

### Three small but important fixes on the new sidebar

**1. Rail now sits next to the panel, not at the viewport edge**

The `position: fixed; left: 2rem` from v1.1.1232 pinned the rail to the left edge of the viewport, leaving a huge gap to the panel on wide screens. It now sits right next to the panel with a constant 12 px gap:

```css
.vision-pro-menu--desktop {
  position: absolute;
  right: 100%;      /* rail's right edge anchored to panel's left edge */
  top: 50%;
  margin-right: 12px;
  transform: translateY(-50%);
}
```

Hover expansion grows to the left into the free area – the gap to the panel stays 12 px no matter how wide the rail becomes.

**2. Sidebar stays visible while DetailView is open**

The previous render condition included `!showDetail`, so the rail disappeared the moment a device was opened. Removed – shortcuts are now always reachable.

**3. DetailView top offset 54 → 52 px**

Minor tweak to match the StatsBar pill exactly. Mobile unchanged at 45 px.

### Changed files

- `src/components/SearchField/SearchField.css` – `.vision-pro-menu--desktop` switched from `position: fixed` to `position: absolute` with `right: 100% + margin-right: 12px`
- `src/components/SearchField.jsx` – `!showDetail` removed from sidebar render condition
- `src/components/SearchField/components/DetailViewWrapper.jsx` – `statsBarHeight` desktop 54 → 52

### Test

- Desktop: open panel → rail sits 12 px left of the panel, vertically centered
- Hover rail → it widens to the left (into empty space), panel position never changes
- Open a device → DetailView appears, rail stays visible at the same spot
- Detail header now flush to the StatsBar without any visual collision (52 px offset)

---

## Version 1.1.1232 - 2026-04-24

**Title:** Sidebar redesign – Vision-Pro mockup v2 (fixed to viewport, hover-expand labels)
**Hero:** none
**Tags:** Design

### 🆕 Completely new sidebar look

Based on the second Vision-Pro mockup the user provided. Main differences vs v1.1.1231:

- **Fixed to the viewport**, not to the panel
  - Desktop: `left: 2rem`, vertically centered
  - Mobile: `bottom: 2rem`, horizontally centered
- **Never interferes with the card layout** – `position: fixed`, `pointer-events: none` on the outer wrapper, `auto` only on the menu itself
- **Apple-window glass style** – `border-radius: 2rem`, `backdrop-filter: blur(1rem)`, subtle 2 px border
- **Hover-expand labels** – pill width grows from icon-only to icon + 8 rem label, pure CSS transition (250 ms ease-in-out)
- **Pill-shaped items** with `border-radius: 2rem`, hover / active background `hsla(0,0%,90%,0.2)`
- **Mobile**: labels hidden entirely (`display: none`), horizontal row of icons

### Structure (new)

```jsx
<div class="vision-pro-menu vision-pro-menu--desktop">
  <div class="vpm-wrapper">
    <ul class="vpm-menu apple-window">
      <li>
        <button class="vpm-item" onClick={…}>
          <span class="vpm-icon">{getSystemEntityIcon(…)}</span>
          <span class="vpm-label">Label</span>
        </button>
      </li>
      …
    </ul>
  </div>
</div>
```

Icons come from the existing `getSystemEntityIcon()` path (same icons the device cards use) – unchanged from v1.1.1231.

### Changed files

- `src/components/SearchSidebar.jsx` – rewritten to match mockup structure (button + icon + label span)
- `src/components/SearchField/SearchField.css` – old `.search-sidebar*` rules removed, new `.vision-pro-menu*` / `.vpm-*` rules added

### Test

- Desktop: rail sits top-left of viewport, 2 rem inset, vertically centered; hover the pill → icons + labels; click an icon → DetailView opens
- Mobile: horizontal pill at bottom center, icons only, tap → DetailView
- Panel position/size stays **identical** whether sidebar is visible or not
- Settings → General → Sidebar toggles still work

---

## Version 1.1.1231 - 2026-04-24

**Title:** Sidebar polish: real SVG icons, vertically centered, panel no longer shifts
**Hero:** none
**Tags:** Bug Fix, Design

### Three issues from v1.1.1230 resolved

**1. Icons were rendered as text**

Some system entities carry their icon as an `mdi:*` string rather than an inline SVG. The previous `dangerouslySetInnerHTML` path showed the raw string (e.g. `mdi:cog`, `newspaper`). Now the sidebar reuses the **same renderer the device cards use** (`getSystemEntityIcon`), so every shortcut shows the proper SVG icon.

**2. Sidebar now vertically centered to the panel**

Changed from `top: 0` to `top: 50%` + `translateY(-50%)`. Centers inside the search-row (≈ panel height) regardless of panel content.

**3. Panel no longer shifts right when the sidebar appears**

The sidebar sat inside `.search-row` with `position: absolute`, but some flex edge-cases still nudged the panel. Fix: wrap it in a **zero-width anchor**:

```css
.search-sidebar-anchor {
  position: absolute;
  top: 0; bottom: 0; left: 0;
  width: 0;
  pointer-events: none;
}
.search-sidebar-anchor > * { pointer-events: auto; }
```

The anchor takes no layout space at all, so the panel stays put whether the sidebar is shown or not.

### Changed files

- `src/components/SearchSidebar.jsx` – icons via `getSystemEntityIcon`, new anchor wrapper on desktop
- `src/components/SearchField/SearchField.css` – `.search-sidebar-anchor` rules, `top: 50%` + `translateY(-50%)` on desktop rail

### Test

- Desktop: open panel → sidebar sits centered vertically next to the panel, real SVG icons visible, panel width/position unchanged whether sidebar is shown or not
- Hover → width expands, labels fade in
- Mobile: unchanged horizontal pill bottom-center

---

## Version 1.1.1230 - 2026-04-24

**Title:** Sidebar: shortcut rail to system entities (desktop vertical, mobile horizontal)
**Hero:** none
**Tags:** Feature, UX

### 🧭 Jump straight to settings, todos, news, changelog…

Inspired by the Apple Vision Pro side-menu mockup: a slim glass rail that lives next to the expanded search panel. One icon per system-entity shortcut. On **desktop** the rail sits vertically to the left of the panel and **expands on hover** to reveal labels. On **mobile** it sits as a horizontal pill at the bottom center, icons only.

Default shortcuts (in order): **Settings · Todos · News · Versionsverlauf · Plugin Store**.
Tap / click → opens that system-entity directly in the DetailView, just like clicking a device card.

### Settings

New section **Settings → General → Sidebar** with two toggles:

- **Show sidebar** (default: on)
- **Always visible** (default: off — rail appears only while the panel is expanded)

### Files

- **New:** `src/components/SearchSidebar.jsx` – reads entities from `systemRegistry`, renders glass pill, hover-expand labels
- `src/components/SearchField/SearchField.css` – new `.search-sidebar` rules (desktop vertical / mobile horizontal / hover label animation)
- `src/components/SearchField.jsx` – reads sidebar settings, listens to `sidebarSettingsChanged`, mounts `<SearchSidebar>` inside `.search-row`, click handler opens DetailView
- `src/components/tabs/SettingsTab/components/GeneralSettingsTab.jsx` – new "Sidebar" section with both toggles, persisted under `systemSettings.sidebar`

### Design

- Glass look shared with expanded panel (`.glass-panel` class → user blur/saturation settings propagate)
- Hover on desktop expands width from 56 px to 220 px with labels fading in (pure CSS transition 0.25 s)
- Mobile: fixed position bottom 16 px, centered, horizontal overflow scroll if many items

### Not in this release (phase 2)

- Per-icon configuration (which shortcuts appear, in what order)
- Drag-to-reorder

### Test

- Desktop, panel open → rail visible on the left, hover → labels appear, click an icon → DetailView opens
- Mobile (narrow viewport) → rail sits bottom-center with just icons
- Settings → Show sidebar off → rail disappears
- Settings → Always visible on → rail stays even when panel is collapsed

---

## Version 1.1.1229 - 2026-04-24

**Title:** StatsBar: widgets left, avatar right, mobile rotates every 5 s
**Hero:** none
**Tags:** Design, UX, Mobile

### 🔄 Three changes in one pass

**1. Positions swapped**

Widgets are now on the left side of the pill, the user avatar sits on the right. This matches the inspiration mockup from earlier.

**2. Username label removed**

Only the avatar circle (or fallback `👤` if no HA user picture) is shown. The "Ender" text is gone.

**3. Mobile: single rotating widget, 5 s per step**

On mobile the pill now shows **one widget at a time**. After 5 seconds it advances to the next active widget (time → weather → grid consumption → …), wrapping around. Order = order in the source list / settings order.

```js
useEffect(() => {
  if (!isMobile) return;
  if (notifPanelOpen) return; // pause while panel is open
  const timer = setInterval(() => setRotationIndex(i => i + 1), 5000);
  return () => clearInterval(timer);
}, [isMobile, notifPanelOpen]);
```

Rotation pauses automatically while the notifications panel is open, so you can read what's there without it disappearing.

### How the widget list is built

All active widgets are collected into a `widgetNodes = [{ key, node }, …]` array before render. Desktop renders the whole array, mobile renders only `widgetNodes[rotationIndex % widgetNodes.length]`.

Adding/removing widgets in Settings → Status & Greetings → StatsBar → Widgets now directly drives the rotation roster.

### Changed file

- `src/components/StatsBar.jsx`

### Test

- **Desktop**: widgets left, avatar right, no name visible
- **Mobile**: exactly one widget visible, advances every ~5 s, loop restarts at the end
- **Mobile + tap notification**: rotation pauses, panel opens; close panel → rotation resumes
- Toggling individual widgets off in Settings → that widget no longer shows up in rotation

---

## Version 1.1.1228 - 2026-04-19

**Title:** Settings: StatsBar "Active/Inactive" label now reflects the sub-page toggle
**Hero:** none
**Tags:** Bug Fix, Settings

### 🐛 Main setting showed "Active" even after disabling in sub-page

Toggling StatsBar off inside the detail page (Settings → Status & Greetings → StatsBar → toggle) updated the StatsBar itself, but the parent row still said "Active" after a reload.

### Root cause

Two different storage slots for the same flag:

- `StatsBarSettingsTab` (sub-page) wrote to **legacy key** `localStorage.statsBarEnabled`
- `GeneralSettingsTab` (parent page) read from **`systemSettings.appearance.statsBarEnabled`** (via `readSystemSettingsSection`)

The event-based live sync covered the visible state of the parent row while the app was open, but the persisted value in `systemSettings` was never updated → on remount, the old value reappeared.

### Fix

`handleStatsBarToggle` in the sub-page now writes both:

```js
localStorage.setItem('statsBarEnabled', enabled);                             // legacy for StatsBar.jsx
updateSystemSettingsSection('appearance', { statsBarEnabled: enabled });      // canonical for GeneralSettingsTab
```

No changes needed on `StatsBar.jsx` (it still reads from the legacy key; that path keeps working).

### Changed file

- `src/components/tabs/SettingsTab/components/StatsBarSettingsTab.jsx`

### Test

1. Settings → Status & Greetings → StatsBar → toggle **off**
2. Back to main settings → row shows **"Inactive"**
3. Reload the card → still "Inactive"
4. Toggle back on → row updates live and survives reload

---

## Version 1.1.1227 - 2026-04-19

**Title:** StatsBar: shared glass background + narrower on desktop
**Hero:** none
**Tags:** Design, Layout

### 🫧 Same background as the expanded panel

The StatsBar had its own hard-coded glass look (`rgba(255, 255, 255, 0.08)` + local `backdrop-filter`), ignoring the user's background settings (blur / saturation / brightness / contrast / grayscale) that already drive the expanded panel via the `.glass-panel` class.

Now the StatsBar opts into the same class and inherits those settings automatically. Inline glass-look styles removed:

```jsx
<motion.div
  className="stats-bar stats-bar-pill glass-panel"
  // no more background / backdrop-filter / border inline
/>
```

A dedicated CSS rule keeps the pill shape (overrides the default 35 px radius from `.glass-panel`):

```css
.stats-bar-pill.glass-panel {
  border-radius: 999px !important;
}
```

### 📐 Narrower on desktop (~20 % off)

On desktop the wrapper around the StatsBar is now `width: 80%` / `max-width: 800px`, centered:

```jsx
style={{
  width: isMobile ? '100%' : '80%',
  maxWidth: isMobile ? '100%' : '800px',
  margin: isMobile ? '0 0 12px 0' : '0 auto 12px',
}}
```

Mobile keeps full width (nothing to spare).

### Changed files

- `src/components/StatsBar.jsx` – class swap + wrapper sizing
- `src/components/SearchField/SearchField.css` – new `.stats-bar-pill.glass-panel` rule for pill radius

### Test

1. Desktop → StatsBar visible, narrower than before and centered, same glass as the expanded panel beneath it
2. Settings → Appearance → Background Blur / Saturation / etc. → changes now affect the StatsBar as well
3. Mobile → StatsBar still spans the full width

---

## Version 1.1.1226 - 2026-04-19

**Title:** DetailView desktop top offset 47 → 54 px
**Hero:** none
**Tags:** Layout

### ↕️ More breathing room below the StatsBar

After the StatsBar pill redesign in v1.1.1224 the pill is a few pixels taller than before. The DetailView top offset on desktop was still computed with the old value (47 px), so the DetailView started slightly too close underneath the pill.

### Fix

`DetailViewWrapper.jsx` – `statsBarHeight` bumped from **47 → 54 px** on desktop. Mobile stays at 45 (unchanged, pill layout there is different).

```js
const statsBarHeight = statsBarEnabled ? (isMobile ? 45 : 54) : 0;
```

### Changed file

- `src/components/SearchField/components/DetailViewWrapper.jsx`

### Test

Desktop + StatsBar enabled → open any device → DetailView starts with clean gap below the pill, no visual collision.

---

## Version 1.1.1225 - 2026-04-19

**Title:** DetailView covers StatsBar on desktop (bottom gap fixed)
**Hero:** none
**Tags:** Bug Fix, Layout

### 🐛 Sliver of panel peeking out below the DetailView

On desktop, opening a device card left a dark rounded sliver at the bottom of the screen — the device grid behind the DetailView was not fully hidden. Mobile was fine.

### Root cause

`.detail-panel-wrapper` in `SearchField.css` had a hard-coded `height: 672px` and `top: 0`. That matches the panel alone, but not the whole stack on desktop: the StatsBar wrapper adds ~41 px + `margin-bottom: 12 px` above the search-panel. The main container is therefore ~725 px tall while the DetailView stays 672 px — the missing ~53 px at the bottom were the visible sliver.

### Fix

`.detail-panel-wrapper` now pins to all four edges instead of specifying a fixed height:

```css
.detail-panel-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;       /* NEW */
  min-height: 672px; /* fallback if parent is ever smaller */
  z-index: 10;
  pointer-events: auto;
}
```

### Changed file

- `src/components/SearchField/SearchField.css`

### Test

1. Desktop viewport, StatsBar enabled
2. Click any device card → DetailView opens and covers the entire card-root height, no sliver of the grid visible at the bottom
3. Mobile view unchanged (was already fine)

---

## Version 1.1.1224 - 2026-04-19

**Title:** StatsBar redesign: single continuous glass pill
**Hero:** none
**Tags:** Design, UX

### 🫧 One pill instead of many

Until now the StatsBar was a flex row of separate widget pills — each widget (weather, grid, time, notifications, …) had its own glass background + border radius. From a distance it looked like a bar of fragments.

New design, per mockup: the **whole StatsBar is one continuous pill**. Widgets sit inside without individual backgrounds, separated only by a consistent 12 / 16 px gap.

### What changed visually

- Outer container: `background: rgba(255, 255, 255, 0.08)` + `backdrop-filter: blur(20px)` + 1 px border + `border-radius: 999px` (full pill)
- Horizontal padding on the container (6 / 16 px), internal gap between widgets
- Every widget lost its own `background` / `border-radius` / `padding` — just icon + value inline
- Notifications button: red bubble gone from the outer shape, the counter badge itself stays red as an accent
- Subtle box-shadow under the pill

### Caveat

The StatsBar container now has its own `backdrop-filter`. There are no `.glass-panel` children inside, so the stacking-context lesson from v1.1.1198/1199 doesn't apply here. During the initial `opacity: 0 → 1` fade the blur may briefly render flat – acceptable, reverts after 400 ms.

### Changed file

- `src/components/StatsBar.jsx` – container style + all widget inline styles

### Test

1. Reload → StatsBar is a single rounded pill across the top
2. Widgets (weather / grid / time / notifications / etc.) are flush inside, no visible separators
3. Notifications: red counter badge intact and tappable
4. StatsBar settings (toggle individual widgets on/off) still work

---

## Version 1.1.1223 - 2026-04-19

**Title:** Mobile auto-expand: panel starts at top (y=0) like a click-expand
**Hero:** none
**Tags:** Bug Fix, UX, Mobile

### 🔁 Reverses v1.1.1222

In v1.1.1222 the auto-expanded panel on mobile was pushed down to `y=120` to match the desktop reference. Wrong direction — what the user actually wants is the **opposite**: the panel should sit flush at the top (`y=0`), exactly like after a normal click-expand (which sets `position='top'`).

### Fix

Instead of patching the `y` math, just initialise `position` correctly. If the mobile auto-expand setting is on and we're mounting on a mobile viewport, `position` starts as `'top'` (not `'centered'`). That cascades through the existing animation logic: `y=0`, floating box-shadow, no center-gap.

```js
const [position, setPosition] = useState(() => {
  if (window.innerWidth <= 768) {
    const parsed = JSON.parse(localStorage.getItem('systemSettings') || '{}');
    if (parsed?.mobile?.panelExpandedByDefault === true) return 'top';
  }
  return 'centered';
});
```

The `y` expression is reverted to the original simple form.

### Changed file

- `src/components/SearchField.jsx` – initial `position` reads the setting; `y` math reverted

### Test

1. Settings → General → Mobile → *Auto-open search panel* → **On**
2. Reload on narrow viewport → panel expanded, sitting at the top of the screen (no centered gap)
3. Settings → Off → reload → panel collapsed & centered as before

---

## Version 1.1.1222 - 2026-04-19

**Title:** Mobile auto-expand: proper top spacing
**Hero:** none
**Tags:** Bug Fix, UX, Mobile

### 🪟 Auto-expanded panel now has the same top gap as desktop

After enabling *Auto-open search panel* on mobile, the panel opened glued to the top of the screen — only 60 px gap to the HA header, while on desktop the expanded panel has a comfortable 120 px gap. Felt cramped.

### Fix

The `y` offset on `.search-panel` is computed from `position` (`centered` | `top`) and `isMobile`. For `position === 'centered'` it was 60 px on mobile vs 120 px on desktop. New rule: if the panel is **expanded and still centered** (i.e. auto-expanded on mount, not user-clicked which would also move `position` to `'top'`), use 120 px on both mobile and desktop.

```js
y: hasAppeared
  ? (position === 'centered'
      ? (isExpanded ? 120 : (isMobile ? 60 : 120))
      : 0)
  : 0
```

Collapsed state and normal click-expand flow are unchanged.

### Changed file

- `src/components/SearchField.jsx` (both animated.y spots)

### Test

1. Settings → General → Mobile → *Auto-open search panel* → On
2. Reload on a narrow viewport → panel starts with **120 px top gap**, visually matching the desktop reference
3. Turn toggle off, reload → collapsed panel still uses the original 60 px gap

---

## Version 1.1.1221 - 2026-04-19

**Title:** Mobile: auto-open search panel on start
**Hero:** none
**Tags:** Feature, UX, Mobile

### 📱 New setting: search panel starts already expanded on mobile

By default the search panel opens in its collapsed shape (the search bar) and only expands when the user taps it. On mobile this extra tap is often unwanted — people land on the dashboard and want to see the full panel right away.

New toggle in **Settings → General → Mobile → Auto-open search panel**. When enabled and the device is in mobile layout (`window.innerWidth ≤ 768`), the panel starts expanded directly after the splash.

### How it works

- Setting lives under `localStorage.systemSettings.mobile.panelExpandedByDefault`
- Read at mount time in `useSearchFieldState` so the very first render is already expanded – no flash or layout jump
- Desktop is never affected (check gated on `window.innerWidth ≤ 768`)
- Default: **off** (existing users see no change)

### Changed files

- `src/components/SearchField/hooks/useSearchFieldState.js` – initial values for `isExpanded`, `isMobile`, `isExpandedRef` now read from window + localStorage
- `src/components/tabs/SettingsTab/components/GeneralSettingsTab.jsx` – new "Mobile" section with the toggle, plus load/save helpers for the `mobile` settings branch

### Test

1. Settings → General → **Mobile → Auto-open search panel** → **On**
2. Reload the card on a narrow viewport (phone or `innerWidth ≤ 768`)
3. After splash the panel should be **expanded** immediately (672 px height, category list visible)
4. Turn the toggle off again → next reload starts collapsed as before
5. Desktop viewport: toggle state does not matter, panel always starts collapsed

---

## Version 1.1.1220 - 2026-04-19

**Title:** DetailView header + stat items now update in real time
**Hero:** none
**Tags:** Bug Fix

### 🐛 "100% brightness" + "Off" shown simultaneously

In the DetailView the header area with quick stats (brightness %, state label "On" / "Off") and the tab navigation could show a stale state while the actual HA state had long changed. Example: light turned off → stat bar still shows "100% brightness" and "Off" at the same time.

### Root cause

`DetailView.jsx` has two representations of the entity:

- **`item`**: the static prop handed over on device click – stays unchanged for as long as the DetailView is open
- **`liveItem`** (via `useMemo` + `useEntities`): the live state from the DataProvider, refreshed on every `state_changed` event

All control tabs (UniversalControlsTab, HistoryTab, ScheduleTab) already used `liveItem`. But **four** places still pointed at the static `item`:

1. `<DetailHeader item={item} ... />` – title / icon
2. `<EntityIconDisplay item={item} ... />` – **quick stats** incl. brightness + state label
3. `<TabNavigation stateText={... getStateText(item, lang)} stateDuration={... getStateDuration(item, lang)} item={item} ... />` – tab header with state display
4. `<ContextTab item={item} ... />` – actions list

### Fix

Switched all four to `liveItem`. Header, stats and tab state now refresh automatically on every state_changed event (triggered by the Map<entity_id → new_state> rAF-batch updates in the DataProvider).

### Changed file

- `src/components/DetailView.jsx`

### Test

1. Open a light (DetailView)
2. Toggle it via the dashboard or controls
3. Header area: "100% brightness" / "On" switches **immediately** to "Off" – no contradiction anymore
4. Change brightness → percent stat updates live

### ⚠️ Convention change from now on

All future changelog entries will be written in **English only**.

---

## Version 1.1.1219 - 2026-04-19

**Title:** Echter Fix: PowerToggle feuerte doppelt (Preact `<label>`+`<input>`-Bug)
**Hero:** none
**Tags:** Bug Fix, Root-Cause

### 🎯 Quelle gefunden – nicht nur Toast, sondern der ganze Service-Call doppelt

Die Diagnose-Logs aus v1.1.1218 haben gezeigt:
```
[DetailViewWrapper] handleServiceCall light turn_on light.wohnzimmer_einbauleuchten
[DetailViewWrapper] handleServiceCall light turn_on light.wohnzimmer_einbauleuchten
```

**Zweimal** pro Click. Beide aus dem gleichen Stack: `handlePowerToggle → onChange`.

### Root Cause

Der `PowerToggle`-Component in `src/components/controls/PowerToggle.jsx` nutzt das Standard-Pattern:

```jsx
<label>
  <input type="checkbox" onChange={onChange} />
  <span className="power-slider">...</span>
</label>
```

**Problem:** Preact im Compat-Mode propagiert den Click auf dem `<label>` sowohl als `change`-Event auf dem `<input>` **als auch** triggert er eine zweite `change`-Dispatch durch Label-Redirect. In manchen Setups (konkret hier) feuert `onChange` zweimal.

Das war kein Toast-Bug – **der Service-Call ging doppelt an HA raus**. Auch wenn `turn_on` idempotent ist: unnötige Last, und bei `toggle`-Services wäre es ein echter Fehler gewesen.

### Fix

150 ms Dedupe im `CircularSlider.handlePowerToggle`-Wrapper:

```js
const lastPowerToggleRef = useRef(0);
const handlePowerToggle = (e) => {
  const now = Date.now();
  if (now - lastPowerToggleRef.current < 150) return;
  lastPowerToggleRef.current = now;
  powerToggleHandler(e, ...);
};
```

Das hält echte User-Interaktionen (> 150 ms zwischen Clicks) durch, blockt aber die Event-Duplikate aus dem Preact-Compat-Bug (< 5 ms Abstand).

### Weitere Änderungen

- **Toast-Dedupe bleibt** (aus v1.1.1218) als Defense-in-Depth – falls doch mal wieder ein Doppel-Trigger woanders entsteht
- **Diagnose-Logs aus `DetailViewWrapper`** entfernt (Quelle gefunden)
- Toast-Dedupe-Log von `console.warn` zurück auf silent – kein Bedarf mehr für Prod-Logs

### Modifizierte Dateien

- `src/components/controls/CircularSlider.jsx` – Dedupe-Wrapper + Ref
- `src/components/SearchField/components/DetailViewWrapper.jsx` – Diagnose-Log raus
- `src/utils/toastNotification.js` – Dedupe-Log silent

### Test

1. Licht ein-/ausschalten → **ein** Toast, **ein** Service-Call im HA-Log
2. HA Developer Tools → Log prüfen: kein doppeltes `service_called` für `light.turn_on`

---

## Version 1.1.1218 - 2026-04-19

**Title:** Toast-Dedupe – Doppelter Toast unterdrückt, Diagnose-Logs aktiv
**Hero:** none
**Tags:** Bug Fix, Diagnostic

### 🐛 Doppelter Toast trotz v1.1.1217-Fix

Der Duplikat-Toast kam **nicht** aus `DataProvider.callService` (war schon entfernt). Quelle immer noch unklar – mein Audit fand keinen zweiten Trigger im statischen Code, aber der Toast feuert trotzdem zweimal.

### Zwei-Schichten-Fix

**1. Dedupe-Buffer in `showToast`**

Identische Toasts (`type:message`-Key) innerhalb **500 ms** werden unterdrückt:

```js
const _toastDedupeBuffer = new Map();
const TOAST_DEDUPE_MS = 500;
```

Das ist robust gegen jede Quelle von Doppel-Triggern – egal ob:
- Zwei DetailViewWrapper-Instanzen (z. B. durch AnimatePresence-Glitch)
- Touch + Click Event auf Mobile
- Zwei Card-Mounts im HA-Edit-Mode
- Sonst irgendein Race

**2. Diagnose-Logs (bleiben in Prod)**

`console.warn` (wird nicht von Terser entfernt) in:
- `showToast` → loggt `[Toast] deduped identical toast within Xms` wenn Dedupe greift
- `DetailViewWrapper.handleServiceCall` → loggt `[DetailViewWrapper] handleServiceCall <domain> <service> <entity>`

### So findest du die Quelle im Browser

1. DevTools → Console öffnen
2. Licht schalten
3. Zählen:
   - **`[DetailViewWrapper] handleServiceCall`** zweimal? → Handler selbst wird doppelt aufgerufen (Click-Duplizierung)
   - Einmal + **`[Toast] deduped`** → irgendwo feuert ein zweiter `showToast` direkt (nicht über handleServiceCall)

Mit der Log-Info kann der nächste Patch chirurgisch sein.

### Modifizierte Dateien

- `src/utils/toastNotification.js` – Dedupe-Buffer
- `src/components/SearchField/components/DetailViewWrapper.jsx` – Diagnose-Log

### Test

Licht schalten → **ein** Toast. Console öffnen → Log-Messages melden falls Dedupe greift oder Handler doppelt ruft.

---

## Version 1.1.1217 - 2026-04-19

**Title:** Fix: Doppelter Toast bei Licht-Toggle
**Hero:** none
**Tags:** Bug Fix

### 🐛 Zwei identische Toasts bei jeder Aktion

Nach v1.1.1216 feuerten zwei Toasts mit identischem Text (z. B. `light.turn_on: light.xyz`) bei jedem Licht-Toggle.

**Ursache:** Zwei Gates produzierten den exakt selben Text:
1. `DetailViewWrapper.handleServiceCall` (v1.1.1216 Fix – tatsächlich genutzt)
2. `DataProvider.callService` (v1.1.1215 Fix – Code-Pfad, der nirgends im UI explizit konsumiert wird, aber aktiv war)

Obwohl Code-Analyse nahelegte, dass `DataProvider.callService` nicht im UI-Pfad hängt, feuerte sein Toast-Gate offenbar doch – wahrscheinlich über indirekten Kontext-Zugriff.

**Fix:** Toast-Code aus `DataProvider.callService` entfernt. Einziger aktiver Toast-Gate bleibt `DetailViewWrapper.handleServiceCall`. `showSuccessToast` + `showErrorToast` Imports aus DataProvider gekickt (Bundle-Diät).

### Modifizierte Datei

- `src/providers/DataProvider.jsx`

### Verbleibende Toast-Quellen (einmal pro Event)

| Pfad | Events |
|---|---|
| `DetailViewWrapper.handleServiceCall` | actionSuccess / actionError |
| `DataProvider.refreshNotifications` | haPersistent |
| `DataProvider.toggleFavorite` | favoriteChange |
| `ContextTab.executeAction` | scenesScripts |
| `scheduleUtils` (create/update/delete) | scheduleChange |

### Test

1. Settings → Toasts → „Aktion erfolgreich" an
2. Licht schalten → **ein** Toast
3. „Aktion fehlgeschlagen" an, HA-Verbindung kappen → **ein** Toast

---

## Version 1.1.1216 - 2026-04-19

**Title:** Fix: Toast-Gate auf tatsächlich genutzten Service-Call-Pfad gelegt
**Hero:** none
**Tags:** Bug Fix

### 🐛 Toast kam bei Licht-Toggle nicht

**Symptom:** Nach v1.1.1215 „Aktion erfolgreich" aktiviert → Licht über UI eingeschaltet → **kein Toast**.

**Ursache:** Card hat zwei parallele Service-Call-Wege:
- `DataProvider.callService` — hat seit v1.1.1215 den Toast-Gate
- `callHAService(hass, ...)` direkt aus `utils/homeAssistantService.js` — **wird tatsächlich** für alle UI-Aktionen genutzt, hatte aber keinen Toast-Gate

Der `DataProvider.callService`-Weg wird nirgends im UI aufgerufen, obwohl der Code existiert. Alle tatsächlichen Licht/Schalter-Toggles laufen über `DetailViewWrapper.handleServiceCall` → `callHAService`.

**Fix:** Toast-Gate zusätzlich in `DetailViewWrapper.handleServiceCall` eingebaut. Ruft `shouldShowToastFor('actionSuccess')` / `actionError` nach erfolgreichem/fehlgeschlagenem Service-Call.

### Modifizierte Datei

- `src/components/SearchField/components/DetailViewWrapper.jsx`

### Langfristig (nicht in diesem Release)

Die zwei parallelen Call-Wege sollten zusammengelegt werden – entweder alle auf `DataProvider.callService` migriert (um Pending-Tracker-Puls + Toast aus einer Quelle zu bekommen), oder `callHAService` als einziger Pfad bleibt. Aktuell doppelt nicht schlimm, aber unnötig.

### Test

1. Settings → Allgemein → Toasts → „Aktion erfolgreich" aktivieren
2. Licht ein-/ausschalten → **Toast erscheint**
3. Settings → „Aktion fehlgeschlagen" aktivieren, HA-Verbindung kappen → Click auf Licht → **Error-Toast**

---

## Version 1.1.1215 - 2026-04-19

**Title:** Toast-Einstellungen – neue Section „Toasts"
**Hero:** none
**Tags:** Feature, UX

### 🍞 In-App-Toasts jetzt konfigurierbar

Neue Section **„Toasts"** in Settings → Allgemein (nach „Status & Begrüßung" und „Vorschläge"). Klick öffnet eine Detailseite mit vollen Kontrollmöglichkeiten darüber, wann Toasts erscheinen und wie sie aussehen.

### Konfigurierbare Event-Typen

| Event | Default | Beschreibung |
|---|:---:|---|
| HA-Benachrichtigungen | ✅ | `persistent_notification.*` aus HA (seit v1.1.1213) |
| Szenen / Skripte | ✅ | Beim Ausführen im ContextTab |
| Aktion erfolgreich | ❌ | z. B. Licht an, Thermostat geändert |
| Aktion fehlgeschlagen | ✅ | Fehler beim Service-Call |
| Favoriten-Änderung | ❌ | Favorit hinzugefügt/entfernt |
| Timer / Schedule | ❌ | Create / Update / Delete |

### Darstellung

- **Position**: Oben mittig (Default), Oben rechts, Unten mittig, Unten rechts
- **Dauer**: Kurz (2 s), **Mittel (3 s — Default)**, Lang (5 s)
- **Master-Toggle**: schaltet global alle Toasts aus
- **Test-Button** zeigt einen Probe-Toast mit den aktuellen Einstellungen
- **Standard-Button** setzt alles auf Defaults zurück

### Persistenz

Alles in `localStorage.systemSettings.toasts`:
```json
{
  "enabled": true,
  "events": { "haPersistent": true, "actionError": true, ... },
  "display": { "position": "top-center", "duration": "medium" }
}
```

### Neue / geänderte Dateien

- **Neu:** `src/utils/toastSettings.js` – Defaults, Reader, `shouldShowToastFor(eventKey)`, `getToastDisplayOptions()`, `saveToastSettings()`
- **Neu:** `src/components/tabs/SettingsTab/components/ToastSettingsTab.jsx` – Detailseite
- `src/components/tabs/SettingsTab/components/GeneralSettingsTab.jsx` – neue Section + Subview-Routing
- `src/providers/DataProvider.jsx` – Toast-Gates für HA-Persistent, Service-Call-Success/-Error, Favoriten-Änderung
- `src/components/tabs/ContextTab.jsx` – Szenen/Skripte/Automation-Toasts gated
- `src/utils/scheduleUtils.js` – Create/Update/Delete-Toasts gated

### Testablauf

1. Settings → Allgemein → **Toasts** öffnen
2. „Aktion erfolgreich" aktivieren → **Licht einschalten** → Toast erscheint
3. Position auf „Unten rechts" ändern → **Test-Toast** → kommt unten rechts
4. Master aus → kein Toast erscheint bei nichts mehr

### Wie weiter

Regelbasierte Notifications („Klima zu lange an" etc.) → separate Phase, mit HA-Automations als Backend. Nicht in diesem Release.

---

## Version 1.1.1214 - 2026-04-19

**Title:** Hotfix: Mount-Error „Cannot access 'O' before initialization"
**Hero:** none
**Tags:** Bug Fix

### 🐛 TDZ-Fehler nach v1.1.1213 gefixt

**Symptom:** Nach dem Notifications-Release warf die Card beim Mount:
```
Error mounting Fast Search Card: Cannot access 'O' before initialization
```

**Ursache:** In `DataProvider.jsx` wurde `refreshNotifications` (ein `useCallback`) im Dependency-Array zweier `useEffect`-Hooks referenziert:

```js
useEffect(() => { ... refreshNotifications() }, [hass, refreshNotifications]);
```

Dependency-Arrays werden **beim Render** evaluiert. Der `useCallback`-Definition stand aber **weiter unten** im Component-Body. Bei minifiziertem Bundle (Variable = `O`) führt das zum TDZ-Fehler (`const` in Temporal Dead Zone).

**Fix:** `refreshNotifications` + `dismissNotification` im DataProvider **nach oben** verschoben, direkt unter die Refs und damit vor alle useEffects, die sie nutzen.

### Modifizierte Datei

- `src/providers/DataProvider.jsx`

### Keine Feature-Änderung

Das Notifications-System funktioniert wie in v1.1.1213 – Widget, Panel, Toast, Dismiss. Nur die Deklarations-Reihenfolge wurde geändert.

---

## Version 1.1.1213 - 2026-04-19

**Title:** Notifications-System – HA persistent_notification angebunden
**Hero:** none
**Tags:** Feature, UX

### 🔔 Echte Benachrichtigungen in der Card

Nach dem Aufräumen der alten UI-Leichen in v1.1.1210 ist das Notifications-Widget jetzt **funktional** – mit HA `persistent_notification.*` als Quelle. Dazu ein aufklappbares Panel zum Lesen und Abhaken einzelner Einträge, plus Toast bei neuen Notifications.

### Was passiert

**1. Daten-Anbindung (DataProvider)**
- Neuer State `notifications`: Liste aller aktiven `persistent_notification.*`-Entities
- Extractor liest aus `hass.states` und normalisiert zu `{ notification_id, title, message, created_at }`
- `state_changed`-Events für `persistent_notification.*` triggern ein Re-Scan
- **Toast-Diff**: bei wirklich neuen Notifications (nicht initial) erscheint ein Info-Toast mit Titel/Message

**2. StatsBar-Widget (wieder zurück, diesmal mit Sinn)**
- Glocken-Icon + Zähler-Badge – erscheint nur wenn Count > 0
- **Klickbar** → öffnet Panel direkt darunter
- Settings-Toggle in StatsBar-Settings: „Benachrichtigungen (mit Zähler)" zeigt/versteckt Widget

**3. NotificationsPanel (neu)**
- Glass-Popover rechts vom Widget, max 60vh scrollbar
- Pro Eintrag: Titel (fett), Message, relative Zeit („vor 5 Min")
- `×`-Button pro Zeile → ruft `persistent_notification.dismiss`
- Outside-Click schließt Panel
- Leerer Zustand: „Keine Benachrichtigungen"

**4. Neuer Hook**
- `useNotifications()` → `{ notifications, count, dismiss }`

### Modifizierte / neue Dateien

- **Neu:** `src/components/NotificationsPanel.jsx`
- `src/providers/DataProvider.jsx` – State, Extractor, Dismiss, Hook-Export, Toast-Diff
- `src/components/StatsBar.jsx` – Widget wieder drin, Button+Panel, `useNotifications` eingebunden, `NotificationIcon` re-importiert
- `src/components/tabs/SettingsTab/components/StatsBarSettingsTab.jsx` – Widget-Toggle zurück, `NotificationIcon` re-importiert, `notifications` in Widget-Defaults
- Translations-Keys `notificationsWidget*` wieder verwendet (waren in 10 Sprachen erhalten geblieben)

### Was nicht (bewusst)

- **Outgoing-Notifications** (`notify.mobile_app_*` Service-Calls für Push ans Handy) – separate Richtung, später bei konkretem Use-Case
- **Sound / Vibration** – keine Browser-Permission-Anfrage
- **Persistence über Card-Reload** – Dismissed-State kommt direkt aus HA, kein eigener State

### Test

1. In HA eine persistent_notification erzeugen (Developer Tools → Services → `persistent_notification.create` mit `title: "Test"`, `message: "Hallo"`)
2. Card aktualisiert sich sofort → Widget oben mit Badge „1" + Toast erscheint
3. Klick aufs Widget → Panel öffnet sich, zeigt den Eintrag
4. Klick auf `×` → dismissed, Panel-Eintrag + Badge verschwinden

---

## Version 1.1.1212 - 2026-04-19

**Title:** Versionsverlauf-Cache von 1 h auf 5 Min reduziert
**Hero:** none
**Tags:** UX

### ⏱️ Neue Releases schneller sichtbar

Der App-interne Cache für den Changelog hing bisher auf 60 Minuten. Das hieß: Nach einem neuen Release musste man bis zu einer Stunde warten oder manuell den „Aktualisieren"-Button drücken, um den neuen Eintrag zu sehen.

**Neu:** Cache-TTL = **5 Minuten**. GitHub-raw + HACS-CDN cachen eh server-seitig, darum ist's kein Performance-Risk.

### Modifizierte Datei

- `src/system-entities/entities/versionsverlauf/index.js` – Konstante `ONE_HOUR` → `FIVE_MINUTES`

---

## Version 1.1.1211 - 2026-04-19

**Title:** Bug-Fix: System-Entities fehlen beim ersten Load (Race-Condition)
**Hero:** none
**Tags:** Bug Fix

### 🐛 System-Entities verschwinden bis man Ausschlussmuster modifiziert

**Symptom:** Beim Öffnen der Card sind News, Todos, Versionsverlauf, Weather, Printer3D, AllSchedules in der Kategorie „Benutzerdefiniert" teilweise nicht sichtbar. Erst nach einer Pattern-Änderung in Settings → Privatsphäre erscheinen sie alle.

**Root Cause — Race-Condition zwischen zwei Entity-Loads beim Init:**

Im `DataProvider` gibt es zwei parallele Trigger für `loadEntitiesFromHA()`:

1. **useEffect „hass-Retry"**: wird sofort aktiv wenn `hass.connection` verfügbar ist
2. **`initializeDataProvider`**: ruft `await systemRegistry.initialize(...)` auf, dann `loadBackgroundData()` → `loadEntitiesFromHA()`

Wenn Pfad 1 **vor** Pfad 2's Registry-Init fertig ist, läuft `loadEntitiesFromHA()` mit einer noch nicht initialisierten Registry. In diesem Fall fällt `getSystemEntities()` in [initialization.js:10](src/system-entities/initialization.js:10) auf einen 2-Entity-Fallback zurück (nur Settings + PluginStore). Alle anderen System-Entities fehlen bis zu einem späteren Re-Load.

**Der Pattern-Modifikations-Trick funktioniert**, weil `excludedPatternsChanged`-Event erneut `loadEntitiesFromHA()` triggert – dann ist die Registry längst ready.

### Fix

Zwei kleine Änderungen in [src/providers/DataProvider.jsx](src/providers/DataProvider.jsx):

1. **hass-Retry-useEffect an `isInitialized` gekoppelt**: läuft erst, wenn `initializeDataProvider` komplett durch ist (inkl. Registry-Init).
   ```js
   useEffect(() => {
     if (hass?.connection && isInitialized && !hasTriggeredInitialLoadRef.current) {
       hasTriggeredInitialLoadRef.current = true;
       loadEntitiesFromHA();
     }
   }, [hass, isInitialized]);
   ```

2. **`hasTriggeredInitialLoadRef` wird in `loadEntitiesFromHA` selbst gesetzt** (nach dem Mutex-Guard): egal wer den initialen Load triggert, der useEffect skippt nicht-erwünschte Doppel-Calls.

### Modifizierte Datei

- `src/providers/DataProvider.jsx`

### Test

1. Card neu laden
2. Kategorie „Benutzerdefiniert" öffnen
3. **Alle** System-Entities sollten sofort erscheinen: Settings, Bambu Lab, Zeitpläne Übersicht, Feeds, Todos, Versionsverlauf, etc. – **ohne** Pattern-Modifikation.

---

## Version 1.1.1210 - 2026-04-19

**Title:** Dead-Code raus – nicht-funktionale Notifications-UI entfernt
**Hero:** none
**Tags:** Refactor, Code Quality

### 🧹 Zwei UI-Leichen aufgeräumt

Beim Audit des „Notify-Systems" zeigte sich, dass zwei UI-Elemente **sichtbar und bedienbar** waren, aber **nichts** bewirkten. Beide komplett entfernt.

### 1. Push-Notifications-Toggle in Settings

**Wo war er:** Settings → Allgemein → Benachrichtigungen → Switch „Push-Benachrichtigungen"

**Warum tot:**
- State `notifications` wurde nicht aus localStorage geladen, Default hartcodiert `true`
- Setter `setNotifications()` schrieb weder in localStorage noch löste er irgendeine Action aus
- Der Wert wurde durch drei Komponenten-Ebenen durchgereicht, aber **nie gelesen**
- Kein HA-Service-Aufruf, keine Browser-Permission-Anfrage, keine Anbindung

**Bonus:** Die Section war bereits auf `display: none` gesetzt – also war sie für User *unsichtbar*, aber der React-State + Prop-Kette lief trotzdem.

**Entfernt aus:**
- `SettingsTab.jsx` – State + Setter + Prop-Weitergabe
- `GeneralSettingsTab.jsx` – Props + Section-JSX

### 2. StatsBar Notifications-Widget

**Wo war es:** StatsBar → Widget mit Glocken-Icon + Counter-Badge (wenn Count > 0)

**Warum tot:**
- `notificationCount` war in `SearchField.jsx` hartcodiert auf `0` – Kommentar sagte selbst „mock for now"
- Quelle für echten Count war nie angebunden (HA `persistent_notification.*` oder ähnlich)
- Widget hätte sich also **nie** gerendert
- Settings-Toggle „Benachrichtigungen (mit Zähler)" konnte aktiviert werden – aber ohne Quelle blieb das Widget leer

**Entfernt aus:**
- `StatsBar.jsx` – Prop, Widget-JSX, `notifications` aus widgetSettings-Defaults, `NotificationIcon`-Import
- `SearchField.jsx` – Mock-Konstante + Prop-Weitergabe
- `StatsBarSettingsTab.jsx` – Widget-Toggle-Section, `notifications` aus Default-Settings, `NotificationIcon`-Import

### Was bleibt

- **Toast-System** (`src/utils/toastNotification.js`) – aktiv, wird von ContextTab genutzt, weitere Use-Cases jederzeit möglich
- **pendingActionTracker** – internes Pub/Sub für pending Service-Calls, hat nichts mit User-Notifications zu tun
- **Translations-Keys** (`pushNotifications`, `notificationsWidget` etc.) in 10 Sprachen bleiben drin – schaden nicht, könnten später bei einem echten Notifications-Feature wiederverwendet werden
- **`NotificationIcon`** als Export in `EnergyIcons.jsx` bleibt – Terser tree-shaked ungenutzte Exports

### Bundle

- JS gzip: 360.14 → **360.64 KB** (leicht gewachsen, vermutlich Preset-Zuwachs aus v1.1.1209)
- Code-Reduktion hauptsächlich struktureller Natur: eine tote Prop-Kette, drei tote UI-Sections

### Nächste Schritte (offen)

Falls später ein echtes Notifications-Feature gewünscht ist:
- Anbindung an HA `persistent_notification.*` Domain → füllt `notificationCount`
- Widget + Toggle können aus Git-History wieder reingeholt werden
- Oder: Browser-Push via Notification API (HTTPS erforderlich)

---

## Version 1.1.1209 - 2026-04-19

**Title:** Preset „fastender" für Ausschlussmuster
**Hero:** none
**Tags:** Feature, UX

### 🧹 Neuer Schnellauswahl-Button mit 35 vorkonfigurierten Mustern

Neben den bestehenden Presets (Updates / Batterien / Signal / System-Sensoren) gibt es jetzt einen fünften Button **fastender** – eine persönliche Sammlung der Patterns, die im eigenen Setup weggefiltert werden sollen.

**Enthalten:**
- Tasmota: `sensor.tasmota*`, `switch.tasmota*`
- Temperatur-Sensoren: `*aussentemperatur*`, `*zimmertemperatur*`
- Rauchmelder-Nebenwerte: `*smoke_sensor_*_fault`, `*_test`, `*_reliability`, `*_temperature`, `*_battery_low`, `*_humidity`, `*_linkquality`
- Rollladen-Interna: `*rolllade_moving*`, `*rolllade_calibration*`, `*rolllade_motor*`, `*motor_reversal*`, `*breaker_status*`, `*calibration*`
- Light-Attribute: `*color_options*`, `*adaptive_lighting*`, `*kindersicherung*`
- Sonstiges: `time.*`, `switch.smart_garage*`, `sensor.melcloudhome*`, `binary_sensor.melcloudhome*`, `*ventil*`, `sun.sun`, `select.*`, `number.*`, `*nspanel*`, `switch.reolink*`, `switch.schedule*`, `switch.nuki*`, `*_linkquality`, `*_signal_strength`, `*frostschutz*`

**Verhalten:**
- Wie die anderen Presets: Duplikate werden übersprungen, bereits-aktive Patterns werden als `✓`-Chip (disabled) angezeigt
- Einzelne Patterns können danach manuell per `×` entfernt werden

### Modifizierte Datei

- `src/utils/excludedPatternPresets.js` – neuer Preset-Eintrag

---

## Version 1.1.1208 - 2026-04-19

**Title:** Ausschlussmuster – Quick-Add-Presets + First-Run-Seed
**Hex:** none
**Tags:** Feature, UX

### ⚡ Weniger Tipparbeit beim Einrichten der Ausschlussmuster

Das bestehende `excludedPatterns`-Feature (Settings → Privatsphäre → Ausschlussmuster) ist mächtig, aber bislang musste jedes Muster per Hand eingetippt werden. Die meisten HA-User wissen gar nicht, dass Entities wie `update.home_assistant_core_update`, `sensor.phone_battery_level` oder `sensor.zigbee_linkquality` überhaupt existieren – und filtern sie deshalb nicht weg.

Zwei neue Mechanismen:

### 1. First-Run-Seed

Beim allerersten App-Start wird `localStorage.excludedPatterns` mit einer sinnvollen Mini-Default-Liste initialisiert:

```
update.*
*_battery_level
*_linkquality
*_rssi
*_last_boot
```

Greift nur wenn der Key **noch nie** gesetzt war (`null`, nicht leeres Array). Wer die Defaults nicht will, kann sie einfach entfernen – sie werden nicht wieder gesetzt.

### 2. Quick-Add-Presets im Settings-UI

Neuer Bereich „Schnellauswahl" oberhalb des Input-Felds. Vier Kategorien:

| Button | Fügt hinzu |
|---|---|
| **Updates** | `update.*` |
| **Batterien** | `*_battery_level`, `*_battery_state`, `*_battery` |
| **Signal** | `*_rssi`, `*_linkquality`, `*_signal_strength` |
| **System-Sensoren** | `*_last_boot`, `*_last_triggered`, `*_uptime`, `*_connectivity` |

Bereits aktive Kategorien werden als `✓ Updates` angezeigt (Button deaktiviert).

Duplikate werden übersprungen, bestehende User-Patterns bleiben erhalten.

### Neue / geänderte Dateien

- `src/utils/excludedPatternPresets.js` (**neu**) – Presets + Seed-Defaults + `ensureInitialExcludedPatterns()`
- `src/index.jsx` – Seed-Call direkt nach den Style-Imports
- `src/components/tabs/SettingsTab.jsx` – neue `addPatterns(array)`-Funktion (Bulk, Duplikat-sicher, ein Event)
- `src/components/tabs/SettingsTab/components/PrivacySettingsTab.jsx` – Preset-Chips zwischen Beschreibung und Input

### Hintergrund

Vorschlag kam aus der Analyse der Predictive-Suggestions-Pipeline: ohne diese Filter landen `update.*`- oder Battery-Entities in den Cold-Start-Fallback-Listen und produzieren nutzlose Vorschläge. Die Infrastruktur (`filterExcludedEntities` im DataProvider, gesteuert über `localStorage.excludedPatterns`) war bereits da – es fehlten nur die Defaults und die UX.

---

## Version 1.1.1207 - 2026-04-19

**Title:** Vorschläge sofort sichtbar – Cold-Start-Fallback
**Hero:** none
**Tags:** Bug Fix, UX

### 🐛 Bug-Fix: „Vorschläge" erschienen bei frischem Setup nicht

**Problem:** Der Suggestions-Calculator hatte nur zwei Pfade: Pattern-basiert (braucht Klick-History) und Bootstrap (braucht `usage_count > 0`). Bei einem brandneuen Setup ohne jegliche Interaktion lieferten beide nichts → keine Suggestions → der „Vorschläge"-Chip in der Subcategory-Bar erschien gar nicht (SubcategoryBar prüft `hasSuggestions`).

**Fix:** Dritte Fallback-Stufe, **Cold-Start**, in `suggestionsCalculator.js`. Greift wenn nach Pattern+Bootstrap immer noch zu wenig Suggestions da sind.

### Wie die drei Stufen jetzt ineinandergreifen

1. **Pattern-basiert** (Confidence ≥ Threshold): echte Nutzungs-Patterns mit Decay + Same-Weekday-Boost + Consistency-Bonus + Negative-Learning-Penalty. Optimal für Power-User.
2. **Bootstrap** (Confidence 0.55 fix): Fallback auf `entity.usage_count > 0`. Greift ab dem ersten Klick.
3. **Cold-Start** (Confidence 0.4 fix, **NEU**): Top-N Entities aus Priority-Domains alphabetisch, wenn Setup brandneu.

### Cold-Start-Logik

```js
const PRIORITY_DOMAINS = ['light', 'switch', 'media_player', 'climate', 'cover', 'fan'];
```

- Filtert Entities nach diesen Domains
- Sortiert: erst nach Domain-Priorität, dann alphabetisch
- Confidence 0.4 – niedriger als Bootstrap, damit echte Patterns schnell verdrängen
- Markiert mit `suggestion_reason: 'cold_start'` + `usage_pattern.cold_start: true` (für spätere UI-Differenzierung möglich)

### Was sich dadurch nicht ändert

- **Master-Toggle** (`predictiveSuggestions = false`) schaltet weiterhin alles aus
- **Reset-Button** in Settings funktioniert weiter (löscht Patterns + usage_count → Cold-Start greift)
- **Bootstrap** bleibt unverändert

### Modifizierte Datei

- `src/utils/suggestionsCalculator.js`

---

## Version 1.1.1206 - 2026-04-19

**Title:** System-Entities Dedupe (Phase 6 Performance-Roadmap)
**Hero:** none
**Tags:** Refactor, Code Quality

### 🧹 Dedupes in System-Entities – geringe Bundle-Wirkung, echte Runtime-Verbesserung

Phase 6 der Performance-Roadmap: die fettesten System-Entity-Files auf Duplikate gescannt. Ehrliche Bilanz: **Bundle nur -0.14 KB gzip** (Terser+gzip komprimieren duplizierte SVG-Strings und Variant-Objekte ohnehin aggressiv), aber **zwei Runtime-Verbesserungen**.

### Was gemacht wurde

**1. SVG-Icons in TodosSettingsView extrahiert**

Drei Icons waren je 2× inline dupliziert:
- `PencilIcon` (Edit) – für Profile + Templates
- `TrashIcon` (Delete) – für Profile + Templates
- `PlusIcon` (Add) – für Profile + Templates

Jetzt je eine `const`-Komponente oben im File, 6 Inline-SVGs durch Komponenten ersetzt.

**2. `slideVariants` dedupliziert via `createSlideVariants()`**

Inline-Definition (~14 Zeilen) war in zwei Files:
- `TodosSettingsView.jsx`
- `TodoFormDialog.jsx`

Beide nutzen jetzt die bestehende Factory `createSlideVariants()` aus `src/utils/animations/base.js`. **Runtime-Win:** Variants wurden vorher **bei jedem Render neu erstellt** – jetzt einmal auf Modul-Level. Spart Allokation bei jedem Setting-Screen-Wechsel.

### Was bewusst NICHT gemacht wurde

- **`normalizeToKwh` vs `normalizePeriodEnergy`** in `EnergyChartsView.jsx`: sehen ähnlich aus, haben aber unterschiedliche Regeln (ein zusätzlicher Cutoff `>=10` für Statistics-API-Bug). Keine echten Duplikate – Zusammenlegen würde API komplizieren.
- **Label-Funktionen** in `TodosSettingsView` (3× ähnliches `lang === 'de' ? ... : ...`-Pattern): unterschiedliche Keys/Values, gemeinsamer Factory würde kaum was sparen.
- **`console.error`-Logs** (4 Stellen in EnergyChartsView): legitime Error-Logs für API-Failures, ~200 Bytes total. Bleibt drin.
- **`console.log`-Logs** im Bundle: werden bereits von Terser-`pure_funcs` entfernt (seit Phase 1).

### Bundle seit Baseline v1.1.1201

| | gzip JS | gzip CSS | Total |
|---|---:|---:|---:|
| Baseline (1201) | 397.0 | 22.2 | 419.2 |
| nach Phase 1 (1202) | 384.3 | 19.2 | 403.5 |
| nach Phase 3 (1203) | 371.1 | 19.2 | 390.3 |
| nach Phase 4A (1204) | 360.4 | 19.2 | 379.6 |
| nach Phase 2 (1205) | 360.3 | 19.2 | 379.5 |
| **nach Phase 6 (1206)** | **360.1** | **19.2** | **379.4** |
| **Gesamt-Einsparung** | **-36.8 KB** | **-3.0 KB** | **-39.8 KB (-9.5 %)** |

### Ehrliche Einschätzung & Stopp der Performance-Roadmap

Die letzten zwei Phasen (2 + 6) waren Qualität, nicht Shrink. Terser + gzip komprimieren Code-Duplikation gut – der Gewinn durch DRY entsteht im Source, nicht im Bundle.

**Entscheidung: Performance-Roadmap hier pausiert.** Die verbleibenden Hebel sind zu riskant für die erwartete Einsparung:
- Phase A (framer-motion LazyMotion): -15 bis -25 KB, aber 69 Files Migration
- Phase 4B (Chart.js → Chartist/frappe): -60 bis -70 KB, aber Design-Regression

**Abschluss-Bilanz** nach 5 umgesetzten Phasen:
- Bundle: 397 → 360 KB gzip (**-9.5 %**, -39.8 KB total)
- Build-Zeit: +5 s durch Terser
- Code-Qualität: 2 Files weg, 3 Icons dedupliziert, 1 Name-Clash eliminiert, 1 Runtime-Allokation weg
- Dependencies: -81 transitive (react-markdown-Stack) + 3 neue (marked, dompurify, visualizer)

**Wieder aufnehmen sobald:**
- Chrome Performance Profile von Handy vorliegt (Phase 5.1 → gezielte Runtime-Optimierungen)
- oder eine Chart-Library-Migration sich lohnt (Phase 4B)

---

## Version 1.1.1205 - 2026-04-19

**Title:** Duplikat-Audit & Merges in `src/utils/` (Phase 2 Performance-Roadmap)
**Hero:** none
**Tags:** Refactor, Code Quality

### 🧹 Qualitäts-Phase – zwei Dateien weg, ein Name-Clash weg

Phase 2 der Performance-Roadmap: bewusst Qualität, nicht Bundle-Größe. Ergebnis: **-0.1 KB gzip** (vernachlässigbar), aber cleanerer Codebase.

### Audit-Ergebnis

Von den fünf verdächtigen Paaren / Familien in `src/utils/` hatten nur drei echte Arbeit:

| Paar | Ergebnis |
|---|---|
| `domainHandlers` ↔ `domainHelpers` | split-ok, saubere Trennung |
| `deviceConfigs` ↔ `deviceHelpers` | split-ok, Configs konsumieren Helpers |
| schedule-Familie | **merged**, siehe unten |
| history-Familie | **merged**, siehe unten |
| `formatters/timeFormatters` ↔ `scheduleConstants` | **renamed**, siehe unten |

### Merge 1: `scheduleHandlers.js` → `scheduleUtils.js`

- `handleTimerCreate` + `handleScheduleCreate` (mit Format-Transformation für den nielsfaber-Scheduler) nach `scheduleUtils.js` verschoben
- `handleScheduleUpdate` + `handleScheduleDelete` ersatzlos gelöscht – **waren unbenutzt**
- `DetailView.jsx`-Import-Pfad aktualisiert
- Datei `src/utils/scheduleHandlers.js` gelöscht

### Merge 2: `historyDataProcessors.js` → `historyUtils.js`

- `generateCategoryData()` (15 LOC) nach `historyUtils.js` verschoben
- `HistoryTab.jsx` nutzt jetzt einen einzigen Import für die 4 History-Utilities
- Datei `src/utils/historyDataProcessors.js` gelöscht

### Dedupe 3: `formatTime()` Namens-Clash

`scheduleConstants.js::formatTime(hours, minutes)` und `formatters/timeFormatters.js::formatTime(timestamp, timeRange)` hatten denselben Namen, aber komplett unterschiedliche Signaturen & Zwecke. Risiko: versehentlicher Import der falschen Version.

**Fix:** `scheduleConstants.formatTime` → `formatClockTime` umbenannt. Konsument (`scheduleUtils.js`) entsprechend aktualisiert. Die Timestamp-Formatter bleiben unter `formatTime`.

### Geänderte / gelöschte Dateien

- **Gelöscht:** `src/utils/scheduleHandlers.js`, `src/utils/historyDataProcessors.js`
- **Geändert:** `src/utils/scheduleUtils.js`, `src/utils/scheduleConstants.js`, `src/utils/historyUtils.js`, `src/components/DetailView.jsx`, `src/components/tabs/HistoryTab.jsx`

### Bundle seit Baseline v1.1.1201

| | gzip JS | gzip CSS | Total |
|---|---:|---:|---:|
| Baseline (1201) | 397.0 | 22.2 | 419.2 |
| nach Phase 1 (1202) | 384.3 | 19.2 | 403.5 |
| nach Phase 3 (1203) | 371.1 | 19.2 | 390.3 |
| nach Phase 4A (1204) | 360.4 | 19.2 | 379.6 |
| **nach Phase 2 (1205)** | **360.3** | **19.2** | **379.5** |
| **Gesamt-Einsparung** | **-36.7 KB** | **-3.0 KB** | **-39.7 KB (-9.5 %)** |

### Nächste Schritte

- **Phase 6: System-Entities-Audit** (134 KB gzip unerforscht, Ziel: -10 bis -30 KB durch Duplikat/Unused-Scan in Energy/Todos/News-Views)
- Phase 5.2 (Icon-Sprite-Sheet) **verworfen**: Icons sind animierte SVGs mit SMIL (`<animate>`, individuelle Farben+Delays) – Sprite mit `<use>` würde Animationen/Farben brechen
- Phase 5.1 (Chrome Performance Profile) benötigt User-Session auf dem Handy
- Phase 4B (Chartist/frappe statt chart.js) bleibt Option, aber Design-Regression wahrscheinlich
- Phase A (framer-motion LazyMotion, ~-20 KB): 69 Files Migration, hohes Regression-Risiko

---

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
