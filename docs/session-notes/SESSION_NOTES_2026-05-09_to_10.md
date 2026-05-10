# Session Notes — 2026-05-09 to 2026-05-10

**Final state:** v1.1.1474. **50 releases** across 2 days (v1.1.1425 → v1.1.1474).

Continuation of SESSION_NOTES_2026-05-09.md (which covered v1.1.1415–1424). This memo picks up at the Energy-Dashboard schema rewrite and runs through to the Bento alternative-startseite feature in its many iterations.

Five connected themes:

1. **Energy Dashboard schema rewrite** (1425) — HA Core landed three PRs (Nov 2025 – Feb 2026) that restructured the energy/get_prefs storage from nested `flow_from[]/flow_to[]` arrays to flat single objects. Mapper rewritten to handle both schemas.
2. **Energy "Werte" view polish** (1426–1430) — five small bugs (banner contrast, hover-blacken, info-button click, "Auto" pill style, long-text fade) plus a sensorNames-not-defined hotfix (4th extraction-debt bug from v1.1.1331), plus climate-slider clamp for out-of-range MELCloud targets.
3. **Sidebar customization** (1431–1436) — Home virtual item, configurable Sidebar items via Settings sub-view, Tipps icon, MA Queue fix (response shape mismatch), MA TTS multi-engine fallback + language picker.
4. **Sidebar visionOS-style hover with framer-motion** (1441–1444) — iOS26 Liquid-Glass morphing (spring curve + glass deblur + label stagger), then refactored to framer-motion for true spring physics.
5. **Bento alternative startseite** (1445–1474) — major feature spanning **30 releases**. New start-screen layout with 4 configurable widget slots (Bento-Grid). Many iterations on layout, positioning, alignment, Favoriten/Vorschläge virtual widgets with embedded DeviceCard previews + swipeable carousel.

The Bento block consumed most of the session — 60% of releases — across multiple rounds of "user reports visual issue → iterate." Lessons about layout-bounds, positioning contexts, and "deckungsgleich" panels surfaced repeatedly.

---

## The 5 most important lessons of this session

### 1. Mode-conditional layouts need parallel guards across multiple effects

The Bento-mode feature introduced a `bentoEnabled` flag that affected ~10 different render decisions: search panel position, StatsBar visibility/reserve, GreetingsBar render, sidebar parent element, DetailView top/height, slide-back-to-center behavior, etc. Each effect that touched the same state (position, layout) needed its own conditional guard. Example: v1.1.1445 set `position='top'` on Bento enable, but v1.1.1450 had to ALSO block the slide-back-to-center effect from undoing it 400ms after panel collapse.

**Audit pattern:** when adding a mode flag, grep all useEffects that mutate the same state and add explicit `&& !modeFlag` (or `|| modeFlag`) to each.

### 2. visibility:hidden vs display:none vs position:absolute for "stable layout"

Three related but non-interchangeable patterns came up multiple times:

- **`visibility: hidden`**: element invisible, BUT still takes space. Right for "reserve space, hide content." Used for StatsBar in Bento+collapsed (v1.1.1451).
- **`display: none`**: element removed from layout entirely. Causes shifts. WRONG for this pattern.
- **`position: absolute`**: out of flow, NO space taken. Right for "optional decorative overlay that shouldn't push siblings." Used for Greeting overlay in Bento (v1.1.1459).

Plus a related trap: `visibility: hidden` only preserves space when the child renders SOMETHING. If the child returns `null` (e.g. StatsBar with statsBarEnabled=false), even visibility:hidden has nothing to hide. Solution: wrapper with `min-height` (v1.1.1464 statsbar-bento-wrapper).

### 3. CSS unit-mismatch traps + position:fixed vs absolute

Multiple sidebar-positioning bugs over 4 releases (1453–1455):

- `position: absolute` + `top: 50vh` → `top` is relative to closest positioned ancestor BUT vh is viewport-relative. The two compose unexpectedly — element ends up offset by ancestor.top + 50vh, not at viewport center.
- `position: fixed` + `top: 50%` → both viewport-relative. Works when viewport = card area, fails in Lovelace dashboards where viewport >> card.
- **Real fix:** move the element STRUCTURALLY to the right ancestor in JSX, then use `position: absolute` + `top: 50%` relative to that ancestor.

Lesson: "escape hatch" CSS (position:fixed for wrong-ancestor problems) is fragile. Structural fix in the render tree is robust.

### 4. CSS Grid is fragile with children's min-width + container-type

v1.1.1471 tried 2-column CSS grid for Bento card layout. Cards stayed 1-column despite `grid-template-columns: repeat(2, 1fr)`. Cause: DeviceCardGridView has `min-width: 130px` + `container-type: inline-size`. CSS Grid considers children's min-content-baseline when sizing `1fr` columns. Combined with container-type's intrinsic-sizing implications, the grid degraded to 1 column.

**Fix (v1.1.1473):** switched to `display: flex; flex-wrap: wrap` with explicit `flex: 0 0 calc(50% - gap/2)` per item. Reliable, predictable.

Lesson: CSS Grid is elegant but empfindlich. For "exact N columns" with self-sized children, flex-wrap with calc widths is more reliable.

### 5. Schema-drift is a recurring class of bug for HA-integration consumers

This session hit schema-drift bugs in TWO different HA integrations:

- **Energy Dashboard** (v1.1.1425): HA Core PRs #153809/160432/162200 restructured `energy/get_prefs` storage from `flow_from[]`/`flow_to[]` arrays to flat objects (STORAGE_MINOR_VERSION 2→3). My mapper missed 6 fields (tariffs, power sensors, solar power).
- **Music Assistant Queue** (v1.1.1438): Newer MA versions wrap `get_queue` response keyed by entity_id (`{"media_player.x": {items}}`) instead of flat `{items}`. My `loadQueue` looked for `raw.items` flat → always `[]` despite native MA UI showing 242 items.

Both were silent failures: no error, just empty/wrong data. Both required diagnostic releases (v1.1.1422-1423 + v1.1.1439) to extract the actual shape from a running install before the fix.

**Pattern:** when consuming a third-party API whose schema is documented only as TypedDicts or whose response shape varies between versions, write defensive multi-shape extraction. Don't hardcode one path.

---

## Release blocks

### Block A — Energy Dashboard schema rewrite (1425)

| Version | Theme |
|---|---|
| 1425 | `mapEnergyPrefsToSlots` rewritten for HA Core Storage v1.3 (≥ 2026.02). Flat schema primary path (`grid.stat_energy_from`, `grid.entity_energy_price`, `grid.entity_energy_price_export`, `grid.power_config.stat_rate_from/to`, `solar.stat_rate`). Legacy nested-array schema as fallback (`grid.flow_from[0].stat_energy_from`, etc.) for HA ≤ 2025.11 users. User went from 2/16 → 8/16 auto-resolved slots. Source attribution via direct GitHub link in the docstring. |

Researched via WebFetch on github.com/home-assistant/core/blob/dev — confirmed the schema with the exact TypedDict definitions before coding. Saved several iteration cycles.

### Block B — Energy "Werte" polish + climate slider clamp (1426–1430)

| Version | Theme |
|---|---|
| 1426 | 5 bugs on Sensors-Config-View: banner contrast (rgba(0,122,255,0.10) → rgba(255,255,255,0.10) white-translucent), info-button hover-blacken (CSS cascade exclusion), info-button click race (defensive pointerdown stopPropagation), Auto pill JSX (green Apple brand), long-text mask-gradient fade. **Plus cleanup byproduct**: 13 duplicate inline info-buttons extracted into `<InfoButton>` component, file ~270 LOC smaller. |
| 1427 | **4th v1.1.1331 extraction-debt hotfix.** Click on info button still didn't open because `sensorNames` and `sensorInfos` were defined as locals in DeviceView.jsx (now dead code, never used there) but referenced in SettingsView's InfoOverlay JSX. Moved to module-scope exports in `EnergyDashboardSensorUtils.js`, imported in SettingsView. Plus CSS hover-blacken fix corrected (`fill: revert !important` was wrong — reverts to UA default = black; proper fix uses attribute-selectors `[r="7"]` vs `[r="0.75"]`). |
| 1428 | Sensor-row layout: 3-line subtitle (entity_id on line 2 with fade, value+pill on line 3). Fixes chevron-overflow + value-cutoff when long entity_ids met long values + Auto pill in one line. |
| 1429 | Pill (Auto/Manuell) moved to start of subtitle line, with "Manuell"/"Manual" variant for non-auto-resolved sensors (status by presence rather than absence). |
| 1430 | **Climate slider bug** — MELCloud reported `target_temperature=10` with `min_temp=16` (stale heat-mode setpoint after switching to cool). Negative percentage overflowed SVG `stroke-dashoffset`, arc visually displaced. Fix: `clamp(val, min, max)` helper in `valueToAngle` + `getProgressOffset`, plus `??` instead of `||` for min/max fallbacks. |

### Block C — Sidebar customization + Tipps icon + MA queue/TTS (1431–1440)

Most of the user-facing customization features for the sidebar and Music Assistant. ~10 releases, several bugs found and fixed.

| Version | Theme |
|---|---|
| 1431 | **Sidebar items configurable** — new `systemSettings.sidebar.items` array. New sub-view in Settings → Allgemein → Sidebar → "Einträge konfigurieren" with toggle per item. Plus virtual `__home__` item that closes detail + collapses panel. Picker lists ALL `systemRegistry.entities` dynamically. |
| 1432 | Media-player slideshow auto-advance pauses when ANY control group expanded (MA panel, Settings, mode picker). Single `expandedControl !== null` condition. User had reported MA panel rotating slides under it mid-search. |
| 1433 | Sidebar items real-time update (sidebarSettingsChanged event listener fix). |
| 1434 | Sidebar-items picker: yellow note-card (`rgb(255, 204, 0)`) + per-item info popups (Energy Dashboard "(i)"-button + modal). |
| 1435 | **Tipps icon** — Apple-style sparkle SVG (open circle + 4-point star) added to BOTH iconMap in `DeviceCardIntegration.jsx` AND the entity.icon field. Was blank on Device Card + Sidebar because the iconMap lookup returned null. |
| 1436 | Media-player Slide 1 button renamed "Musik suchen" → **"Music Assistant"** (DE+EN both) with playlist+note icon. Hub naming, not search-verb. |
| 1437 | **MA TTS bridge to HA `tts.*_say`** — `music_assistant.play_announcement` doesn't accept `message` param (only `url`). Rewrote: URL input → MA play_announcement, plain text → HA tts engine. Plus UI placeholder dual-mode hint. |
| 1438 | **MA Queue empty fix** — newer MA wraps response keyed by entity_id (`{"media_player.bad_2": {items:...}}`). Mapper tried `raw[entityId]` first, fell back to `raw.queue` then `raw`. **Plus new "Nächste"/"Up Next" tab** in MA panel — same data source as Queue, filtered to items after currentQueueItemId. |
| 1439 | TTS multi-engine fallback (cloud_say → 5XX server-side issue with TTS proxy). Cycles through all `*_say` services prioritizing google_translate (free, robust), cloud_say last. Plus one-time diagnostic console.log of get_queue raw response for shape debugging. |
| 1440 | **TTS engine picker in Settings** — new sub-view at Settings → Allgemein → Text-to-Speech. List of all `tts.*_say` services + Auto-Fallback option. User can pick preferred engine. Plus `language: lang` passed to TTS call so google_translate doesn't default to English on DE UI. |

### Block D — Sidebar visionOS-style hover (1441–1444)

4 iterations of the sidebar hover-expand visual:

| Version | Theme |
|---|---|
| 1441 | Expansion direction reversed — labels now overlap search panel rightward (was: leftward into empty space). Used `transform: translate(9rem, -50%)` on hover to compensate for the leftward width-grow. |
| 1442 | **iOS26 Liquid-Glass Morphing** — 5 coordinated tweaks: spring curve `cubic-bezier(0.32, 1.25, 0.42, 1)` (Apple stiffness 380 / damping 32 approximation), unified 450ms duration, border-radius morph 2rem → 1.6rem, glass thickening on hover, label-fade staggered 80ms behind shape-open. |
| 1443 | **Deblur effect** — on hover, glass backdrop-filter blur reduces 20px → 10px + saturation pumps 180% → 240%. iOS26 "thinning glass" feel. Background tint also lightens (0.55 → 0.32). |
| 1444 | **Converted to framer-motion** — true spring physics via `transition: { type: 'spring', stiffness: 380, damping: 32, mass: 1 }` instead of cubic-bezier approximation. CSS retained for pseudo-element backdrop-filter (can't be animated via JS). Hybrid model works fine because both fire on the same mouseenter event. User pushed back on my initial "let's stay with CSS" recommendation — turned out he was right; framer-motion gives noticeably better physics on rapid hover in/out. |

### Block E — Bento alternative start screen (1445–1474, **30 releases**)

The marathon feature of the session. New optional start-screen layout with 4 configurable widget slots in a Bento-grid arrangement (1 large left + 3 right: top + 2 bottom). Required ~30 iterations to land cleanly — most consumed by visual polish where the user could see misalignments to single-pixel precision.

#### Sub-block E1 — Initial implementation (1445)

Created BentoStartView.jsx with 4 widget slots (1 large, 1 medium, 2 small) using CSS grid-template-areas `"w1 w2" / "w1 w34"`. New StartScreenSettingsTab.jsx for picking which system-entity goes in each slot. Toggle in Settings → Allgemein → Startseite. ~485 LOC total.

#### Sub-block E2 — Layout iteration with greetings/statsbar/sidebar (1446–1453)

User feedback on every release. The Bento mode required suppressing or reserving space for chrome elements that didn't make sense in this layout:

| Version | Theme |
|---|---|
| 1446 | Bento grid width fix (max-width 800 → 1000 = main-container width) + greeting compaction (font 63px → 32px in Bento mode). |
| 1447 | GreetingsBar default flipped to off, one-time migration disables for existing users (`greetingsBarDefaultOff_v1447` flag pattern). |
| 1448 | StatsBar suppressed in Bento mode entirely (avoid layout-jump on click). |
| 1449 | **Reversal** — user wanted StatsBar visible in Bento, just no layout-jump. Switched to always-show in Bento (instead of suppressing). |
| 1450 | Skip slide-back-to-center after panel collapse in Bento mode (was: position drifted to 'centered' 400ms after collapse via existing v1.1.1223 effect). |
| 1451 | StatsBar `visibility: hidden` (not display:none) in Bento+collapsed → space reserved so click → expand doesn't jump. |
| 1452 | **Two bugs**: widget click now expands panel (StatsBar+Sidebar visible) + W3/W4 widgets square via aspect-ratio:1 + grid-rows auto. (Reverted in 1457 — see below.) |
| 1453 | **First attempt at sidebar centering**: `top: 50vh` — broke because `top` is parent-relative but `vh` is viewport-relative; composed unexpectedly. Only Home icon visible. |

#### Sub-block E3 — Click flash + render tree fixes (1454–1457)

| Version | Theme |
|---|---|
| 1454 | **Second attempt**: `position: fixed; top: 50%; left: calc(...)`. Worked when viewport = card, failed when viewport >> card (Lovelace dashboard). |
| 1455 | **Third attempt, structural fix**: moved sidebar JSX to be a direct child of `.main-container` (instead of `.search-row`). `position: absolute; top: 50%` now relative to .main-container = correct center. Worked. |
| 1456 | Sidebar entity-registered listener fix — items appeared only after toggling sidebar settings; cause: useMemo ran once at mount before systemRegistry.autoDiscover completed. Added `systemRegistry.on('entity-registered')` subscriber. |
| 1457 | **Widget-click search-panel flash fix** — v1.1.1452's `setIsExpanded(true)` triggered the 200ms opacity-fade + 400ms height-animation of the search panel before DetailView covered it. Removed setIsExpanded; instead added `|| showDetail` to StatsBar + Sidebar visibility conditions. Detail opens instantly. |

#### Sub-block E4 — Greeting overlay + DetailView congruency (1458–1465)

| Version | Theme |
|---|---|
| 1458 | Greeting toggleable in Bento, space reserved when off. |
| 1459 | **Reversal**: user noticed reserved space pushed search bar down. Switched to `position: absolute` overlay (out of flow) — greeting visible OR not = zero footprint either way. |
| 1460 | Greeting only on Startseite — hides on expand/showDetail (was visible always in Bento because of position='top' forcing internal `!isExpanded` check to fail). Added `(isExpanded \|\| showDetail)` to the prop. |
| 1461 | `min-height: 720px` on `.main-container--bento` — prevents collapse when bento-grid hides (DetailView open). Sidebar `top:50%` was resolving on the now-tiny container = appeared at top. |
| 1462 | Sidebar `top: 360px` fixed-pixel instead of `top: 50%` — eliminates ±15px drift between 3 states (start/DetailView/expanded all had slightly different main-container heights). |
| 1463 | Bento grid height 600 → **576** to match expanded search panel bottom (60 statsbar + 72 search-row + 24 margin + 576 grid = 732 = bottom of expanded panel). |
| 1464 | Sidebar top 396 → 400 (user adjustment) + `.statsbar-bento-wrapper { min-height: 60px }` so StatsBar's space is reserved even when settings disabled (was: StatsBar returned null → wrapper collapsed → search-row jumped up 60px). |
| 1465 | **DetailView made deckungsgleich with search panel** in Bento — `.main-container--bento .detail-panel-wrapper { top: 60px !important; height: 672px; bottom: auto }` overrides the inline `top: ${statsBarHeight}` from DetailViewWrapper.jsx. Plus min-height 720 → 732. Sidebar top math-corrected to 396 (= 60 + 672/2). |

#### Sub-block E5 — Bento Favoriten/Vorschläge widgets (1466–1474)

The "more useful Bento widgets" iteration. User wanted Favoriten and Vorschläge as available widget types with embedded device previews.

| Version | Theme |
|---|---|
| 1466 | Virtual widget IDs `__favorites__` + `__suggestions__` added. Click → open search panel with corresponding `selectedSubcategory` filter. Plus heart-icon + sparkle-icon SVGs. |
| 1467 | **Bug fix**: filter key was `'favoriten'` (DE), SubcategoryBar uses `'favorites'` (EN plural) — silent failure. Plus widget shows device preview list (dot + name + "+N weitere"). |
| 1468 | Replaced dot+name list with actual `<DeviceCard>` components (same as expanded search panel). Click on card opens that device's DetailView. |
| 1469 | Cards in 2-col grid + aspect-ratio:1 for square. `.bento-widget:has(.bento-widget-cards-grid) { overflow: visible }` to prevent hover-scale clip. |
| 1470 | maxPreview reduced 6/4/2 → 4/2/1 because 6 cards × 230 square = 690px > available content area (388px). Cards spilled out of widget. |
| 1471 | **Major refactor**: Carousel-Layout for Favoriten/Vorschläge widgets. Compact header (small icon + name + count) + paginated card grid + page-dots. Swipe via framer-motion drag="x". Page-dots clickable. All 7 favorites accessible via swipe. |
| 1472 | Cards strikt quadratisch — `height: 100% !important` on `.device-card` was overriding DeviceCard's own `aspect-ratio: 1`. Removed; grid switched to `auto` rows. |
| 1473 | **CSS Grid fragility**: 2-col grid degraded to 1-col despite `repeat(2, 1fr)` because DeviceCard's `min-width: 130px` + `container-type: inline-size` pushed grid's min-content-baseline up. Switched to `display: flex; flex-wrap: wrap` with explicit `flex: 0 0 calc(50% - 4px)`. |
| 1474 | **Final polish**: widget-background non-clickable (was motion.button, now motion.div with separate clickable header/cards/dots), large widget 2 → 3 cards per row (cardsPerPage 4→6, flex 33.33%), icon box-shadow removed (was the "Umrandung"), title gap 2 → 0 line-height 1.15, dots truly centered via width:100% + pointer-events:none on container. |

---

## Architecture decisions worth remembering

### Three-layer click model for widget with multiple targets (v1.1.1474)

For widgets that have several clickable elements AND "safe spaces" between them:

1. **Container** (motion.div): no onClick — background is non-interactive
2. **Header** (button): has onClick → opens primary action
3. **Body cards** (with onClickCapture): each opens detail for that item
4. **Footer dots** (with onClick per dot): page navigation

`pointer-events: none` on container with `pointer-events: auto` on individual interactive elements is the defensive second layer.

This is cleaner than "one big motion.button with stopPropagation islands inside" — no race conditions, predictable behavior.

### Mode-marker class + scoped CSS overrides (v1.1.1446+)

Bento-mode-specific layout adjustments don't pollute base CSS. Pattern:

```jsx
<div className={`main-container ${bentoEnabled ? 'main-container--bento' : ''}`}>
```

Then in CSS:
```css
.main-container--bento .greetings-bar { font-size: 32px; margin-top: 8px; }
.main-container--bento .detail-panel-wrapper { top: 60px !important; height: 672px; }
.main-container--bento .vision-pro-menu--desktop { top: 396px; }
```

All layout-compaction + override rules live in one place (BentoStartView.css) and only apply when the marker class is present. Default mode is untouched.

### Virtual widget IDs pattern (v1.1.1466)

For slot-based widget systems that want to support both registered entities AND "filter shortcuts" or "virtual actions":

```js
export const HOME_ITEM_ID = '__home__';
export const FAVORITES_WIDGET_ID = '__favorites__';
export const SUGGESTIONS_WIDGET_ID = '__suggestions__';
```

Each consumer (BentoStartView, picker UI, click handler) intercepts the special IDs at its own layer:

- **BentoStartView**: builds virtual-item entity objects with custom icon/name/brandColor instead of registry lookup
- **StartScreenSettingsTab**: prepends virtual items to the picker list with inline SVG fallbacks
- **SearchField.handleSidebarItemClick**: switch on targetId for special behavior (filter, navigation, etc.)

Adding a new virtual widget = one new `__id__` const + builder + click handler branch. Scales cleanly.

### `bento-bento-wrapper` for space-reservation (v1.1.1464)

To make a child component's space stable even when the child returns null:

```jsx
<div className="bento-bento-wrapper">
  <SomeComponent />
</div>
```

```css
.bento-bento-wrapper { min-height: 60px; }
```

`visibility: hidden` only works when the child renders SOMETHING. `min-height` on the wrapper is the real space-reservation mechanism. Used for StatsBar in Bento (so toggling StatsBar enabled doesn't shift sidebar/search-row position).

---

## What remains open (candidates for next session)

### Bento polish

- Hover-feedback for card-wrappers (currently default cursor) — minor visual cue improvement
- Carousel auto-advance (like media-player slideshow)? User didn't request, kept out
- Drag-to-reorder slots in StartScreenSettingsTab — slot 1/2/3/4 currently fixed assignments, no way to reorder without clearing + re-picking

### Larger feature candidates

- Bento Vorschläge widget needs verification — currently `predictiveSuggestions` shape isn't confirmed as full device-objects (may need normalization step before DeviceCard render)
- Energy-Dashboard auto-fill — Solar Forecast (`config_entry_solar_forecast` IDs) could be resolved via separate `energy/solar_forecast` WS call to populate `estimated_energy_today` and `estimated_power` slots. Currently 2 slots stay empty for the user.
- Tipps system entity content (lessons.md) is the only data source for the Tipps sidebar entry; could add more lessons over time as patterns crystallize.

### Cross-cutting

- Identifier-grep diagnostic should be committed as a script (`scripts/check-extraction-debt.py`). Was used ad-hoc in v1.1.1427 (4th extraction debt) and would benefit from being part of the workflow. Open since SESSION_NOTES_2026-05-09.md.
- Memory leak audit on framer-motion event subscriptions across the codebase — many new motion components added this session, worth verifying cleanup in unmount paths.

---

## Build / release flow notes

All 50 releases used `echo "Y" | ./build.sh` followed by a separate manual commit/push of `docs/version-history/versionsverlauf.md`. No deviations.

Average release cadence: ~2.5 releases per active hour during the Bento polish iteration. Several "trio sequences" where v1.1.1442 → 1443 → 1444 landed consecutive Liquid-Glass refinements within an hour.

---

## Numbers

- **Releases:** 50 (v1.1.1425 → v1.1.1474)
- **Days active:** 2 (May 9, May 10)
- **Files materially modified (est.):** ~25 (heaviest concentration in `SearchField.jsx`, `BentoStartView.jsx + .css`, `SearchSidebar.jsx`, `MusicAssistantPanel.jsx`, `EnergyDashboardSensorUtils.js`, `EnergyDashboardSensorsConfigView.jsx`, `iOSSettingsView.css`, `StartScreenSettingsTab.jsx`, `GeneralSettingsTab.jsx`)
- **New files created:** `BentoStartView.jsx`, `BentoStartView.css`, `StartScreenSettingsTab.jsx`, `SidebarItemsSettingsTab.jsx`
- **Functional regressions:** several mid-iteration (sidebar visibility 1453→1455, click flash 1452→1457, greeting layout 1458→1459), all fixed within 1-3 releases by reversing or restructuring
- **User pushbacks:** numerous on Bento layout details — user has good eye for pixel-level alignment, multiple iterations on dots-centering, card-aspect, height-matching. Net positive: forced cleaner solutions (structural fixes over CSS escape hatches)
- **LOC delta (est.):** +1500 added across new files (BentoStartView, StartScreenSettingsTab, SidebarItemsSettingsTab, etc.); ~300 net cleanup (extraction-debt fixes, sensor names extracted, info-button extracted)

---

## Final state

- **Energy Dashboard mapper** handles HA Core Storage v1.3 schema (flat) with legacy fallback. 8 of 16 slots auto-resolve for the user.
- **"Werte"-view** (Energy sensors config) polished: tighter layout (3-line subtitles), Auto/Manuell pills, working info-buttons, hover-correct, no extraction debt left.
- **Sidebar items configurable** via Settings sub-view; Tipps entity has its icon back; MA Queue + TTS both working; TTS engine pickable.
- **Sidebar hover** uses framer-motion spring physics (Apple iOS26 values) with rightward Liquid-Glass morphing + deblur on hover.
- **Bento alternative start screen** complete: 4 configurable widget slots, optional via toggle, with Favoriten/Vorschläge virtual widgets featuring embedded DeviceCard carousels (swipe + dots). DetailView deckungsgleich with expanded search panel. Sidebar centered on Bento area. StatsBar/Greeting space-reserved so toggles don't shift layout.

Next session candidates above; no blocking issues open.
