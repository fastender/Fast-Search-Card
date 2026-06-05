# Session Notes — 2026-06-04 to 2026-06-05 (v1.1.1788 → v1.1.1824, 37 releases)

Theme: **UI consistency + a card-wide info-popup system.** Screenshot-driven polish across
the Settings detail and system-entity sub-views. Big new feature (info popups), one feature
removal (splashscreen), iconoir SVG list icons, and a long "why is this container darker"
debugging arc that the user wants to keep going ("es gibt noch viele ähnliche bugs").

---

## 1. Info-popup system (the big new feature) — v1.1.1791+

**Component:** `src/components/tabs/SettingsTab/components/SettingsSectionInfo.jsx`
- Exports **`SettingsInfoButton`** (pure ⓘ button + popup, free-standing) and
  **`SettingsSectionHeader`** (section title + ⓘ, composes the button).
- Popup **portals into `.detail-panel`** (mirrors `ChartDatePopover`): dim/blur backdrop,
  flex-centered glass card, scrollable markdown body (own `is-scrolling` mask + CustomScrollbar),
  "Got it" footer. Markdown via `src/utils/miniMarkdown.js` `renderMarkdown` (links auto
  `target="_blank" rel="noopener"`, SAFE_URL = http/https/mailto/#).
- **Card-wide, not settings-only.** Works anywhere with a `.detail-panel` ancestor + `lang`.
  When a host has no `t` prop (SidebarItems, StartScreen, News view), it falls back to
  `translateUI('settings.settingsInfo.<key>', lang)`.

**Content lives in translations:** `ui.settings.settingsInfo.<key>` in `de.js` + `en.js`
(bucket name is **historical** — it holds ALL card-wide info texts now). The runtime never
reads the docs file.

**Catalog (the "database"):** `docs/info-popups/info-popups-catalog.md` (renamed from the
old `docs/settings-info/` — the popup is card-wide, not settings-only). Mirror of every info
text (de + en) + a key→area table. **Keep MD + de.js + en.js in sync manually.**

**Keys wired this session:** general, statusGreetings, mobile, sidebar, homeScreen,
homeScreenSlots, tts, suggestions, toasts, design, homeAssistant, animations, videoFolder,
videoFiles, statsBar, statsBarWidgets, limits, excludedPatterns, quickAdd, privacySecure,
sidebarItems, toastConfig, newsFeeds, newsDisplay, heroEntities, chartSensors.

Pattern used repeatedly: **fold inline gray description text / yellow hint cards into the
section's ⓘ popup, then delete the inline text.** Removed: the blue Excluded-Patterns
description card, 3 yellow `rgb(255,204,0)` hint cards (SidebarItems / TTS / Bento-slots),
the "About StatsBar" section, the Video Files/Folder annotations, the Hero/Charts picker
descriptions.

`renderMarkdown` export note: `grep` without `-a` mis-reported the file as having no exports
(some byte makes grep treat it as binary) — use `grep -a`. Export IS `export function
renderMarkdown(md)`.

---

## 2. THE container-darkness saga (recurring — user wants more) — v1.1.1804, 1819–1824

The settings/sub-view "container is darker/lighter than the other" complaints. Map of the
layers (each adds darkening over the wallpaper):

- **`.ios-settings-view`** has an **always-on solid mask** (`mask-image: linear-gradient(black,black)`,
  v1804). A *set* mask changes the compositing behind the translucent `.ios-item` backgrounds
  → items render **brighter**. This is why scrolled state looked lighter before — now it's
  always on. (If a sub-view's items look darker than the rest, check it actually uses
  `.ios-settings-view`.)
- **`.ios-settings-container`** = `background: rgba(0,0,0,0.15)` (v1820; was `#00000040`=0.25
  "too dark", then transparent "too flat"). Most settings tabs wrap in it.
- **Nested containers double-darken.** General renders StatsBar/Toast/Sidebar/StartScreen as
  **sub-components inside its own `.ios-settings-container`**, and each adds its OWN → 2×0.15.
  Fix (v1821): `.ios-settings-container .ios-settings-container { background: transparent }`
  → exactly one layer everywhere.
- **StatsBar** was the only tab WITHOUT `.ios-settings-container` historically (→ lighter
  outlier). v1820 added the class to its root (`className="ios-settings-container ios-view-wrapper"`).
- **Calendar event dialog** looked darker because `.calendar-view-container` has its OWN
  `background: rgba(0,0,0,0.2)`, and the dialog (`.ios-settings-container` 0.15, `position:absolute;
  inset:0`) sits ON TOP → ≈0.3. Fix (v1824): add `has-dialog` class when the dialog is open →
  `.calendar-view-container.has-dialog { background: transparent }`. (v1823 backdrop-blur
  experiment was reverted — user: "bitte nichts extra machen", wants 1:1.)

**Takeaway for the next similar bugs:** to compare two sub-views, count the darkening layers
(`.ios-settings-view` mask, `.ios-settings-container` 0.15, any host-container bg like the
0.2 on `.calendar-view-container`, nested-container doubling). Make them resolve to the SAME
single 0.15.

`.gitignore` reminder: `*` ignores everything except an allow-list → **`src/` is NOT in git**;
only the built bundle + `docs/` + meta are tracked. `build.sh` compiles src→bundle and commits
it. So source-comment-only edits don't need committing.

---

## 3. Other recurring patterns / lessons

- **Selection checkmark standard** = filled white circle + black check:
  `<svg className="ios-checkmark" width="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="white" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5"/><path d="M7 12L10.5 15.5L17 9" stroke="black" strokeWidth="2" .../></svg>`.
  Replaced bare blue `✓` text and thin white checks in: device-edit pickers (Select/Hero/Icon),
  News settings selection lists, Toast Position/Duration.
- **framer-motion `scale` overwrites inline `transform`** → for a centered overlay/check, use a
  flex-centering parent, NOT `transform: translate(-50%,-50%)` (color-picker check bug v1816,
  same lesson as the date-popover from the prior session).
- **`.ios-item--static`** = opt-out from the global `.ios-item:hover` white-bg + black-svg
  treatment (for input rows / action-button rows / non-navigation rows). Used on the
  entities-limit number row and the Template/Profile rows.
- **`.ios-feed-icon--list`** (todo list icon tile): white tile default, dark on hover, and an
  override block so the SVG stays its color (default) / turns white (hover) — beating the
  generic "`.ios-item-left svg` → black on hover" rule (handles stroke-only paths AND
  fill="currentColor" cart wheels separately).
- **Reorder UI** = `↑`/`↓` buttons (`.ios-reorder-btn`) + blue order badge
  (`rgb(0,122,255)`, 22×22); `moveX(id, dir)` swaps adjacent entries in the array. Hero → Charts
  (`moveChartSensor`, array order = chart display order, persisted on save).
- **is-scrolling sweep**: effect keyed on the view-state (`currentView`/`activeSlot`/`[]`),
  toggling the class on the shared `scrollRef` via `node.classList.toggle('is-scrolling',
  node.scrollTop>0)` (className prop stays static → Preact doesn't clobber it). Added to General,
  StatsBar, Privacy, Toast, About, StartScreen, SidebarItems, News, Todos settings.
- **iconoir SVGs (MIT)** for todo-list icons (`listIcons.jsx`) — fetched real paths via
  `curl raw.githubusercontent.com/iconoir-icons/iconoir/main/icons/regular/<name>.svg`. Tinted
  in the list color; legacy emoji → key migration map; default `list`. **zsh gotcha:**
  `for name in $set` does NOT word-split (use explicit list or `${=set}`).
- **Slider flush**: `NumberSliderControl` had `padding: '0 15px'` (v1686 anti-overhang) →
  removed for a flush track like the Suggestions `LiquidGlassSlider` (thumb overhang at min/max
  just sits in the card padding).
- **Tab-slider intermittent-inactive fix (v1789):** `sliderPosition` was async `useState`+effect
  with early-returns → sometimes stayed size 0 (active icon looked inactive). Rewrote as a
  synchronous `useMemo(activeTab, isMobile, tabCount)` + `initial={false}` on the slider.

---

## 4. Renames / removals

- **Splashscreen removed** (v1790): deleted `LoadingScreen.jsx` + `AppleHelloSplash.jsx`, all
  splash state in `index.jsx`, the General-settings picker, `load/saveSplashscreenSettings`, and
  the 5 translation keys/lang. **Kept** `WallpaperBootOverlay` (wallpaper zoom + card reveal,
  `revealReady = isLoadingComplete`).
- **Tab "Privacy" → "Filter"** (v1797): the big header title comes from a **hardcoded `tabNames`
  array in `DetailView.jsx`** (not the translation), plus `ui.settings.privacy`. Section "System
  Settings" → "Limits" (`ui.settings.systemSettings`), and `settingsInfo.privacy` → `limits`
  (rewritten to describe entity-load limits, not privacy). Internal component name
  `PrivacySettingsTab` kept.

---

## Release flow reminder
`echo "Y" | ./build.sh` (auto-commits+pushes the bundle), then version string lives in
`AboutSettingsTab.jsx`, and `docs/version-history/versionsverlauf.md` is updated **in ENGLISH**
and committed **separately**. Working dir can drift after a `cd` in a Bash call — `cd` back to
repo root before `./build.sh`.
