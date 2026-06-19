# Session Notes — 2026-06-14 → 2026-06-19 (v1.1.1891 → v1.1.1908)

Continuation of SESSION_NOTES_2026-06-14 (which ended at v1890). Big arcs: wallpaper **gallery** +
full-screen, detail-view full-cover fix, **visibility filters**, and the **Quick Control / Schnellsteuerung**
feature (GitHub issue #10), then an **i18n audit**.

HARD RULES still in force: versionsverlauf ENGLISH every release; update `docs/info-popups/info-popups-catalog.md`
when an ⓘ is touched; version in `AboutSettingsTab.jsx`; build `cd … && echo "Y" | ./build.sh`; commit docs.

## Wallpaper gallery → full-screen → media folder (v1891–1894, 1902)
- **v1891 gallery:** Appearance → Wallpaper gains a thumbnail grid. The card CANNOT list `www/` (no dir
  index) — the ONLY client-side listing API is **`media_source/browse_media`** (WS). New
  `services/mediaSourceService.js`.
- **v1893 full-screen:** wallpaper must fill the whole screen, not just the floating card. Measured via
  console: HA renders its wallpaper as `background: var(--view-background)` on `<hui-view-background>`
  (fixed, full-viewport, z −1, deep in shadow DOM). FSC **overrides that CSS variable** with the image.
  Logic in **`utils/viewWallpaper.js`** (shared with `WallpaperBootOverlay`). v1892 (inject a cover div)
  FAILED — collapsed to 0×0; reverted.
- **v1894:** dropped the v1890 card-root background (was double-image) + fixed Safari boot-flash (apply
  in boot overlay before the zoom). **v1896:** MutationObserver re-applies `--view-background` when HA
  resets it (fixes "only after 2nd refresh" + view-nav loss).
- **v1902 — the big one:** user's wallpapers were in the **`media` folder** (`config/media/wallpaper`,
  `media-source://media_source/media/wallpaper`), NOT www → not served at `/local/` → black thumbnails.
  Fix: gallery + apply use **`resolve_media`** (signed URLs, re-resolved on every apply, like HA's own
  wallpaper). Selecting stores the **`media_content_id`** (`customWallpaperMediaId`); manual URL still
  works (sync, permanent). See [[project_wallpaper_gallery_plan]].
- 🔁 LESSON (reinforced all session): MEASURE via a console diagnostic snippet (find-in-shadow + rects)
  before fixing layout/DOM-reach bugs. It nailed every one. Don't guess.

## Detail view full-cover (v1897–1899)
Long-standing: opening an entity's detail view left the device grid peeking at the bottom.
- v1897: drop the `top:statsBarHeight` + `y` offsets; `.detail-panel` fills the wrapper.
- v1898: Safari — `height:100%` of a top/bottom-stretched parent didn't resolve → flex fill.
- **v1899 (real cause, measured):** user is in **Bento mode**; `.main-container--bento .detail-panel-wrapper`
  (BentoStartView.css) hardcoded `height:672px` assuming a 60px header. Safari's header is **72px** →
  12px gap. Fix: `bottom:0` instead of fixed height → stretches regardless of header height.

## Visibility filters (v1900–1901)
Feedback ②: entities hidden in HA still showed. `enrichAllEntitiesWithAreas` now attaches `hidden_by`/
`disabled_by`/`entity_category`; `filterExcludedEntities` honours two new localStorage flags
(`filterHiddenEntities`, `filterDiagnosticEntities`, default ON). Two toggles + ⓘ `visibility` in the
Filter tab (PrivacySettingsTab). Toggling broadcasts `excludedPatternsChanged` → DataProvider re-filters.

## Quick Control / Schnellsteuerung (v1903–1907) — GitHub issue #10
Mockup-driven (visualize tool, multiple rounds). The **device icon IS the switch** on grid cards; card-tap
still = detail. Tap=instant, hold-to-confirm for risky; amber hover ring; haptics. Full subsystem map +
all decisions in **[[project_quick_control]]**. Key points:
- v1903 core (`utils/quickControl.js`, `utils/quickControlStore.js`, `components/QuickControlIcon.jsx`,
  wired into `DeviceCardGridView` via `DeviceCard`). Off by default; toggle in Appearance.
- v1904: Safari hover-ring **off-center** — the ring `<svg>` is a *replaced element*, Safari ignores
  `inset` right/bottom stretch → use explicit `width/height: calc(100% + Npx)`, not `inset`.
- v1905: per-domain selection as a **sub-view** (like wallpaper). v1906: per-domain became a **3-way mode**
  (Off/Tap/Hold) segmented control + more domains (climate, vacuum, humidifier, valve, siren, scene,
  script, automation; input_boolean removed); asymmetric auto-logic dropped (user picks the mode).
  v1907: bigger hover ring (`-10px`). GitHub issue #10 reply drafted (not posted by me).

## i18n audit (v1908) — feedback ⑨ CLOSED
Explore-agent scan of `src/` for hardcoded German UI strings NOT going through `t()`/`translateUI`/
`lang===` ternary. Found **7**, all fixed: StatsBarSettingsTab ×3 placeholders (`z.B.`→`e.g.`),
UniversalControlsTab 2 hero-image error texts (used `getLang()` — no `lang` prop in `UniversalHeroImage`),
ScheduleList "Lade Scheduler…" → `t('loadingScheduler')` (new key), IntegrationView "Setup … nicht
implementiert" → bilingual. All ①–⑫ Reddit/GitHub feedback points now done.

## Open / next
- Quick Control: unify LIST view's quick-toggle (v1875) with hold-to-confirm; `alarm_control_panel`;
  decide default-ON; **post the issue #10 reply**.
- Wallpaper: optional (works). Companion-integration idea still parked ([[project_wallpaper_gallery_plan]]).
