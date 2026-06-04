# Performance

This document is for users who install Fast Search Card via HACS and want to know how the card behaves under load — boot time, scroll smoothness, render cost, network footprint.

If you just want the short version: **first paint is around 900 ms, the bundle is around 390 KB gzipped, scrolling a 400-device list runs at 55-60 FPS on mid-range mobile, and a Home Assistant tick storm cannot stall the main thread.** Every number in this document is reproducible locally.

The rest of this document is the long version, so you can verify that for yourself.

---

## What this card avoids

These are the categories of slow behaviour that are explicitly absent. They have been removed through systematic profiling (see [Audit history](#audit-history) below) and are checked again on every release.

| Category | Status |
|---|---|
| Blocking synchronous IO on the hot path | None — IndexedDB is async-batched, localStorage is read once at boot |
| Layout thrashing during Home Assistant ticks | None — `setEntities` is rAF-batched and capped at 60/s |
| Full-tree re-render on every state update | None — `memo()` on `DeviceCard`, `StatsBar`, `GreetingsBar`, `SubcategoryBar`, `ActionSheet` |
| 300 ms tap delay on touch devices | None — `touch-action: manipulation` set globally |
| Long lists rendering every node | None — virtua 0.49 keeps the DOM at ~30 nodes regardless of collection size |
| Cards animating on scroll-recycle | None — `animatedOnce` flag prevents replay after first mount |
| Optimistic UI desync if HA rejects a call | None — no optimistic state, the card waits for HA to confirm |
| Repeat fuzzy search recomputing from scratch | None — LRU cache of 30 queries, instant cache hit |
| Main-thread starvation from 30 sensor updates/s | None — coalesced to 1-2 React updates/s via rAF batching |
| Animations ignoring `prefers-reduced-motion` | None — feedback pulses fall back to a static state |

If you want to confirm any of this yourself, the audit method is the same as for security: download the release file and profile it. The shipped bundle is a single self-contained JavaScript file at `https://github.com/fastender/Fast-Search-Card/releases/latest`.

---

## How the card stays fast

The optimizations group into five layers. Each layer has a measurable contribution to the numbers in [Latest measurements](#latest-measurements).

### Boot

- **No `window._hass` polling cascade** (v1.1.1240): the previous boot sequence polled a global `window._hass` reference that was never being set. The poll backed off to a 10-second ceiling. The fix was to actually set the reference. First paint dropped from 10 s to under 1 s.
- **3-tier persistence** (since v1.1.1182): Layer 1 is a localStorage snapshot read synchronously during constructor — the card paints with real entity data on the very first frame. Layer 2 is IndexedDB, populated async in the background. Layer 3 is an in-memory LRU. Skipping Layer 1 costs 50-500 ms on Safari depending on disk pressure.
- **Splash gate** (v1.1.1710 area): the boot overlay clears as soon as the first entity list is ready, not after every async store has settled.
- **Perf marks**: `src/utils/perfMarks.js` writes `performance.mark()` entries at every boot phase and auto-dumps them to the console on first paint.

### Bundle

- **Single file, around 390 KB gzipped** (down from 397 KB). Production build via Vite + terser.
- **Dead-code elimination**: `console.log`, `console.debug`, and `console.info` calls are stripped from the production bundle. Wrappers in `src/utils/logger.js` make them no-ops at runtime.
- **SVG optimization** (v1.1.1185): icon paths reduced to 2-decimal precision across 48 icons. No visible difference, smaller bytes.
- **No third-party CDN at runtime**: every dependency is bundled at build time. Zero blocking network for code.

### Render

- **Virtualization** (v1.1.1184, virtua 0.49): a list of 400+ devices keeps only ~30 nodes in the DOM. Scroll FPS on mid-range mobile moved from 30-50 to 55-60.
- **Dynamic column count**: `useColumnCount` reads the same CSS breakpoints the grid uses, so the virtualizer never disagrees with the layout.
- **`content-visibility: auto`** on offscreen entities: the browser skips layout and paint for cards outside the viewport.
- **`contain: paint`** where the box model permits: paint operations cannot escape the card boundary.
- **`memo()` with custom comparator** on `DeviceCard`: a card only re-renders when its own entity state, favourite flag, or pending-action flag changes — not when a sibling changes.
- **`animatedOnce`** (v1.1.1184): mount animations play once. Recycled cards reappear instantly without re-running keyframes.

### Interaction

- **Animation budget cut 25 % globally** (v1.1.1182): durations moved from 0.3 s to 0.22 s and from 0.4 s to 0.3 s. The interface feels faster without skipping frames.
- **`touch-action: manipulation`** everywhere tappable: removes the 300 ms double-tap-to-zoom wait.
- **`:active { transform: scale(0.97) }`**: instant visual feedback on touch-down, before any handler runs.
- **Search debounce 50 ms, trailing edge** (v1.1.1182, was 150 ms): typing feels live, but Fuse only runs once per pause.
- **Search cache**: LRU of 30 queries. A repeat search is a 0 ms cache hit. The cache invalidates when the entity collection changes.
- **Press feedback** (v1.1.1186): a pending-action tracker with pub/sub. When you tap a card to call a service, only that card rerenders. A subtle blue shimmer pulse plays while the call is in flight. There is no optimistic state mutation — if HA rejects the call, nothing has to be rolled back.
- **Detail prefetch**: on desktop, `pointerEnter` warms the entity cache during hover. On mobile, `pointerDown` prefetches at touch-start, before the click event fires. Both paths are idempotent.

### CPU discipline under HA tick storms

- **rAF batching** (v1.1.1183): the `setEntities` reducer is gated by `requestAnimationFrame`. Home Assistant's WebSocket can deliver 30 sensor updates per second; React sees 1-2 updates per second instead.
- **IndexedDB batched writes** (v1.1.1183): one transaction per entity sync, not one per entity.
- **`will-change: transform`** only during active interaction: the GPU layer is promoted on press-down and released on press-up. It is not left on permanently.
- **`hassStore` decoupling** (v1.1.1710): a module-level store with subscriber pattern. The `DataProvider` context value no longer changes on every HA tick, so the 10+ consumers reading it do not all re-render together.

---

## How to verify it yourself

The same measurements that produce the numbers below are reproducible in a clean browser session.

### Boot timing

Open the browser DevTools console with the card on screen. Reload the page. After the splash gate clears, the perf instrumentation auto-dumps a table:

```
[perf] boot phases
  constructor → first paint:  ~900 ms
  localStorage hydrate:        ~12 ms
  IndexedDB warm:              ~180 ms
  first entity list ready:     ~620 ms
```

The exact numbers depend on entity count, browser, and device. The source is `src/utils/perfMarks.js`. You can also read individual marks via `performance.getEntriesByType('mark')`.

### Lighthouse

Run a Lighthouse audit (Performance category) on a Lovelace dashboard that contains only this card. Expect:

- First Contentful Paint under 1.0 s on desktop, under 1.8 s on mobile-throttled
- Total Blocking Time under 200 ms
- Cumulative Layout Shift effectively 0 — the card reserves its own height via `card_height`

### Scroll FPS

Open DevTools → Performance → enable "Rendering → FPS meter". Scroll a category with 400+ entities. The meter should stay above 55 FPS on a recent mid-range phone and at the display refresh rate on desktop.

### Render count

Install the Preact / React DevTools "highlight updates" overlay. Trigger a sensor update by toggling a light in the HA UI. Only the affected `DeviceCard` should flash. The grid, the stats bar, the greeting, the sub-category bar should not.

### Bundle size

```
$ ls -la dist/fast-search-card.js
$ gzip -c dist/fast-search-card.js | wc -c
```

Expect around 390 000 bytes gzipped.

---

## Latest measurements

Numbers as of v1.1.1806. Measured on a clean Lovelace view containing only this card, with ~600 entities exposed.

| Metric | Value | How it's measured |
|---|---|---|
| First paint (desktop, warm cache) | ~900 ms | `src/utils/perfMarks.js` |
| First paint (desktop, cold cache) | ~1.4 s | Lighthouse |
| Bundle size (gzipped) | ~390 KB | `gzip -c dist/fast-search-card.js | wc -c` |
| Bundle size (raw) | ~1.6 MB | `ls -la dist/` |
| Scroll FPS, 400-entity list, mid-range mobile | 55-60 | DevTools FPS meter |
| Tap-to-press-feedback latency | < 16 ms | `:active` is a CSS state, not a JS handler |
| Search debounce window | 50 ms | `src/utils/searchDebounce` |
| Search cache hit time | 0 ms (cache lookup only) | LRU cache, no Fuse work |
| React updates per second under 30 Hz HA tick storm | 1-2 | rAF batching in `setEntities` |
| DOM node count for a 400-entity list | ~30 | virtua 0.49 windowing |

---

## Audit history

| Version | Date | Scope | Outcome |
|---|---|---|---|
| [v1.1.1182](https://github.com/fastender/Fast-Search-Card/releases/tag/v1.1.1182) | Tier 1 snappiness pass: animation budget, tap delay, search debounce, `memo()` on `DeviceCard`, `content-visibility` | 6 changes, perceived latency dropped notably |
| [v1.1.1183](https://github.com/fastender/Fast-Search-Card/releases/tag/v1.1.1183) | Tier 2 CPU pass: rAF batching for `setEntities`, IndexedDB batch writes, `contain: paint`, `will-change` discipline, `memo()` on the bars | Main thread no longer stalls under HA tick storms |
| [v1.1.1184](https://github.com/fastender/Fast-Search-Card/releases/tag/v1.1.1184) | Virtualization via virtua 0.49, dynamic column count, `animatedOnce` flag | Scroll FPS 30-50 → 55-60 on mobile, DOM nodes capped at ~30 |
| [v1.1.1185](https://github.com/fastender/Fast-Search-Card/releases/tag/v1.1.1185) | SVG path precision reduced to 2 decimals across 48 icons | Smaller bundle, no visible change |
| [v1.1.1186](https://github.com/fastender/Fast-Search-Card/releases/tag/v1.1.1186) | Pending-action tracker with pub/sub, single-card press feedback, `prefers-reduced-motion` fallback | Service calls rerender only the affected card |
| [v1.1.1240](https://github.com/fastender/Fast-Search-Card/releases/tag/v1.1.1240) | `window._hass` boot fix — removed a polling cascade that backed off to 10 s | First paint 10 s → ~900 ms |

Each release commit message and Versionsverlauf entry describes the specific code changes if you want to read the diff.

---

## Scope note

This document covers the Fast Search Card itself — the JavaScript bundle you install via HACS. It does not cover:

- Home Assistant's own frontend performance (theme loading, dashboard layout, other cards on the same view)
- Network latency between your browser and your HA server
- The performance of integrations producing the entity updates
- Device-specific GPU compositing behaviour

If a slowdown appears only when this card is mounted alongside other heavy cards, profile with this card alone first to isolate the cause.
