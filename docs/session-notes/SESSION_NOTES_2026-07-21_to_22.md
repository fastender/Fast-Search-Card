# Session Notes — 2026-07-21 → 2026-07-22 (v1.1.2170 → v1.1.2190)

Twenty-one releases in two arcs: **(A)** the StatsBar became **the Island** — a morphing Dynamic-Island-style
capsule, designed with the user from a mockup and shipped across seven phases, and **(B)** a two-agent
perf/refactor audit whose findings were then worked off release by release, ending with a real timezone bug.

HARD RULES still in force: versionsverlauf ENGLISH every release; update `docs/info-popups/info-popups-catalog.md`
when an ⓘ is touched; version in `AboutSettingsTab.jsx`; build `echo "Y" | ./build.sh`; commit docs
(`src/` is gitignored — **no git diff and no git restore for source**, the build is the only automatic check).

---

## A. The Island (v2170–2179) — StatsBar reimagined

Started from the user's wish for a *content* redesign ("weg vom Energie-Fokus, Integration mit dem
Notification-Center") plus the Dynamic-Island reference. Key realisation up front: **80 % of the parts already
existed** — the LiveActivityStrip (#29) and the Notification Center (#3) were exactly what an Island surfaces.

Design decisions the user made on an interactive mockup (artifact, three revisions):
merge the strip ✓ · Island = warning/info + live, red banner = critical only ✓ · always top-centre ✓ ·
tap opens the fitting view, **no inline controls** ✓ · multiple activities = **split + N** ✓ · avatar gone ✓.

- **Phase 1 (v2170)** — `utils/islandState.js` (pure mood selection: `alert ▸ live ▸ ambient`) +
  `components/Island.jsx`. framer `layout` spring + `AnimatePresence popLayout` blur-zoom crossfade.
  `StatsBar.jsx` (602 LOC) deleted.
- **Phase 2a–b (v2171–2172)** — LiveActivityStrip merged in and deleted; the 1257-LOC StatsBar settings monolith
  replaced by a slim `IslandSettingsTab`. **2072 LOC of the StatsBar subsystem deleted** — including
  `energyDashboardService.js`, whose energy-sensor config turned out to have **zero consumers**.
- **Phase 2c–3d (v2173–2177)** — night face via quiet hours · ambient roll (weather → lights on → windows open) ·
  rolling digits + a green "fertig" moment · peek on long-press (the orphaned NotificationsPanel returns) ·
  **hero transition in both directions**.
- **v2178** — residual sweep: `userService.js` deleted, ~120 dead translation lines removed, user-facing texts
  that still described the StatsBar rewritten.
- **v2179** — user reported with screenshots that the hero clone covered the opening view as a dark slab. It was
  a material mismatch: 0.88 alpha against real translucent glass, and the fade started *after* landing. Now a
  veil (0.55 → 0.3) that dissolves during the flight.

### Lessons
- **Fake-hero beats `layoutId`.** Source and target live in different trees (portals, async view mount, shadow
  DOM). A DOM clone flying rect→rect is immune, and its failure mode is graceful: if the view doesn't mount in
  time the clone just dissolves.
- **Hero clone material must match the real target**, or the morph illusion breaks — an opaque clone reads as a
  slab covering the view, not as the view being born.
- `updateHass(container, hass)` takes **two** arguments — passing only hass silently yields `undefined`.

---

## B. Perf & refactor audit (v2180–2190)

Two read-only agents swept `src/`. The uncomfortable headline: **hotspot #1 was the Island we had just built.**

### The mechanic behind almost every perf finding
`hass` gets a **new object identity on every HA tick**, and `setHass` notifies **unthrottled** — the data
provider's own comment cites bursts up to 60 events/s. Consequences: any memo with `hass` in its deps recomputes
constantly, and every `useHass()` consumer re-renders at push rate.

- **P1–P4 (v2180)** — the Island kept its whole hook apparatus alive while invisible (`show` guard sat *after*
  the hooks) and scanned the entire entity tree twice per tick. Fixes: conditional mount · one 1-second driver
  reading `getHass()` and committing only on a changed signature · ambient roll only in the resting face ·
  `BentoWidget` memoised with a comparator that compares `hass` **only through the single slice actually read**
  below it. Measured: **20 HA ticks → 0 DOM mutations**.
- **P5 (v2181)** — new reusable `useHassThrottled(ms)`: leading edge immediate, then at most one commit per
  interval, **always with a trailing commit**, so there is no staleness, only a latency ceiling. Measured:
  60 pushes in 491 ms → **3 commits**.
- **P6 (v2182)** — the last permanent poll. `TabNavigation` polled `getActiveButton()` at 10 Hz because
  `useRegisterViewRef` registers a *stable proxy*, so `viewRefs` never changes when a view's state does. Added a
  revision signal: every render of a registered view notifies. Idle went from 20 notifications per 2 s to **0**.

### Refactor: one shell, six files
The audit's finding #1: the iOS sub-page frame sat **byte-identical in ~30 files**.

- **v2183** — `IosNavbar` + `IosSubView`; five settings sub-views migrated.
- **v2184** — a **second, dominant pager dialect** discovered (the motion element *is* the wrapper and carries the
  slide variants) → `IosPagerView`, sharing its inner half with `IosSubView`. Four General views were the same
  option picker → one `SettingsOptionPicker`. General 1132 → 895.
- **v2185–2187** — Appearance in three cuts: persistence layer, small components, then all ten frames onto the
  shell. **1881 → 1336.**
- **v2188** — calendar + todo settings, 21 frames. The shell grew `custom`/`initial`/`transition` because these
  views are direction-aware and spring differently; `IosNavbar` learned that `onBack` is optional.
- **v2189** — SearchField: `useSearchFieldSettings` + `useSearchResults`. 1305 → 1158.

### v2190 — a real bug at the end
`formatDateDisplay` existed twice. Not a style duplicate: the todo version used `new Date(str)`, and a
**date-only** string is parsed as UTC midnight while a string *with* a time is parsed as local. So
`new Date('2026-07-22')` rendered as **21 July** in every timezone west of Greenwich — task due dates were a day
early for those users. Never visible from Germany. One shared, timezone-safe implementation now; the two surfaces
keep their different looks on purpose (calendar shows the weekday).

### Lessons
- **Judge extractability by whether setters leave the block.** `useSearchFieldSettings` moved cleanly because none
  did. The `suggestions` view (6 states, 3 throttled setters) and the AI block (8 setters, and `sendToAI` is still
  a mock) were deliberately left — forcing them through props buys nothing.
- **Orphaned imports after an extraction are ambiguous.** In v2185 three "orphans" were needed by the *moved*
  code and deleting them would have silently killed squircle and kiosk mode; in v2186 four really were dead.
  Always check whether the target module needs them.
- **Script migrations: replace opening and closing tags as a pair, per match.** An independent close-regex
  rewrote 10 closes against 7 openings and briefly left three views inconsistent. And after normalising, count
  the matches before migrating — a quoting slip (`init=""enter""`) silently reduced 11 frames to 1.
- **`let` at module level survives a `^const `-based extraction** — four debounce/throttle variables stayed
  behind and only failed at runtime.
- The repo has a **pre-commit debt checker**: `python3 scripts/check-extraction-debt.py src`.

---

## Harness notes (hard-won, they cost real time)
- The hidden preview tab throttles **rAF and timers** (setTimeout clamped to ~1 s). Patch rAF **before** mounting
  (framer grabs it at start — patching later leaves exit animations hanging forever) and drive time with a
  **MessageChannel pump**; `postMessage` is not throttled.
- framer exit nodes linger in a hidden tab, so `querySelector(...).pop()` grabs ghosts. Address views by their
  navbar title instead.
- HA entities never enter the searchable device list — only system entities. And an empty search shows **nothing**
  (the card lists on input), so don't assert "empty query shows all".
- Lazy system-entity views don't finish loading here, and `detail-tab` buttons don't render — the settings
  *route* is partly unreachable. Workaround used throughout: render the component directly via a throwaway probe
  under `src/` (vite's `fs.allow` blocks scratchpad paths), then delete it.
- Node can't resolve `src/utils/translations` (directory import). To unit-test `timeFormatters`, copy the file and
  replace only the `getLocale` line with a line-identical stub.

---

## Open
- **Roadmap #36 test harness** — the recurring limiting factor all session; also the precondition for touching
  the DataProvider (#4, 1418 LOC, ref choreography + reference-stable context memos that no build can verify).
- **deviceConfigs (#5)** — 1630 LOC of pure functions. Low risk but low payoff; the real issue is 16 domains
  maintained across parallel switches, which is a design change, not a file split.
- **Bundle track** — 504 KB gzip in one file; `inlineDynamicImports` is deliberate (HACS loads one module URL),
  so the 22 lazy imports are source organisation only. framer-motion is imported in 103 files.
- **BR-1** — 735 `lang === 'de' ?` ternaries (668 in June; this session added some).
- Island polish ideas: appointment in the ambient roll, peek row actions.
