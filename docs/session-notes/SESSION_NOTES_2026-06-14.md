# Session Notes — 2026-06-14 (v1.1.1869 → v1.1.1890)

Reddit/GitHub real-user feedback triage → fixes, then a desktop-layout saga, a long Safari
news-debugging hunt, a custom-wallpaper feature, and brainstorming a wallpaper/media gallery.

HARD RULES still in force: versionsverlauf ENGLISH every release (`docs/version-history/versionsverlauf.md`);
update `docs/info-popups/info-popups-catalog.md` whenever an info-popup is touched; version string in
`AboutSettingsTab.jsx`; release via `cd /Users/suerekli/fast-search-card-build && echo "Y" | ./build.sh`.

## ⚠️ Repo version reality
The repo had advanced to **v1.1.1868** ("background videos weather + device_class", 2026-06-08) BEFORE
this session continued — the compaction summary was stale (said v1.1.1858). Always trust the on-disk
`AboutSettingsTab.jsx` version + `git log`, not the summary. This session went 1869 → 1890.

## Reddit/GitHub feedback — the 12 points + outcomes
The user pasted real feedback. We triaged with parallel Explore/general-purpose agents, then fixed:
- **② empty entity grid on first open** → v1869: DataProvider initial load gated on `hass.connection`;
  on Android `connection` arrives BEFORE `hass.states` is populated → one-shot load ran over empty
  states. Fix: gate on `Object.keys(hass.states).length > 0` + sparse-load re-run. (`DataProvider.jsx`)
- **③ UI German on first open despite EN default** → v1870: split-brain — selector writes
  `localStorage.userLanguage`, but `langStore.readInitialLang()` read `systemSettings.appearance.language`
  (never written). Fix: langStore reads `userLanguage` first + SearchField on-mount `getLang()` sync +
  adopt async `settings.language`. (`langStore.js`, `SearchField.jsx`)
- **① Energy Dashboard add-button clipped** → v1871: `EnergyDashboardSetup` root was a non-flex
  `.ios-settings-container` → inner `.ios-settings-view {flex:1}` inert → content overflowed the outer
  `max-height:555px;overflow:hidden` → bottom Add button cut off. Fix: flex column + scrollRef +
  is-scrolling + CustomScrollbar.
- **⑥ grid/list view not saved** → v1872: `activeFilter` was in-memory only. Fix: lazy-init +
  persist `localStorage.deviceViewMode` (`useSearchFieldState.js`).
- **④ Firefox transparent overlays + ⑤ mobile chart cut off** → v1873: `@supports not (backdrop-filter)`
  solid fallbacks for `.detail-panel`/`.ios-settings-container`/`.ios-item`; SensorChartView mobile
  minHeight 320→200 (`useIsMobile`).
- **⑦ brightness slider reverts** → v1874: `useEntityStateSync` sync effect overwrote the optimistic
  value with stale `hass.states.brightness` every tick. Fix: pending-lock (value+ts, ignore hass until
  HA confirms ±1% or 4s) + operator-precedence fix in `sliderHandlers.js`.
- **⑪ list-view direct toggle** → v1875: the list quick-action power button was a dead no-op. Wired it:
  `QUICK_TOGGLE_SERVICES` map (light/switch/fan/input_boolean→toggle, cover→toggle,
  media_player→media_play_pause) via `callService`. Grid stays tap→detail (browse vs control split).

## ⑧ Desktop layout — the saga (full revert, then careful redo)
v1876–1881 tried denser/wider desktop (vw widths, auto-fill grid, overflow clips, :host overflow) →
caused **horizontal page scroll**, then v1881's `:host{overflow-x:hidden}` added a **vertical
scrollbar**. User (rightly) furious. **v1882 = full revert to pre-⑧** (max-width 1000px, fixed-4-col
grid, no clips). THEN user found the real cause: **they had Chrome at 150% zoom** (which amplified the
vw math). Calm restart:
- **v1883**: `.main-container max-width 1000→1200px` (FIXED value, never vw — vw was the overflow source).
- **v1884**: desktop default grid **4→5 columns** (`appearance.gridColumns || 5` + CSS fallback). More
  columns = smaller tiles (NOT min-width). `repeat(5,1fr)` always fits → no overflow.
- **v1885**: added **6-columns option** to the Appearance grid-columns selector (`sixColumns` strings).
🔁 **LESSON: never use `vw`/`calc(100vw…)` for the card width or overflow hacks — fixed px only. The
card-root has fixed height 672px so `overflow-x:clip/hidden` there misbehaves.**

## News read/unread Safari hunt → it was a SETTING, not a bug
Long debugging (multiple wrong fixes) of "Read always empty in Safari, Chrome fine":
- v1886: news widget tab fallback ran on click (activeTab in effect deps) → "Read" snapped back.
- v1887: moved tab selection to render-time (`userTab||autoTab`) instead of the effect.
- v1888: `_cacheArticles` stored FULL articles as the read-state cache → Safari's stricter localStorage
  quota (~5MB, + 500-article `news_event_cache`) made the `setItem` throw (swallowed) → read state never
  persisted. Fix: store only `{id, read, favorite}`. (Good perf fix regardless.)
- **Root cause (confirmed via console `window.systemRegistry.getEntityByDomain('news')`):** data was
  perfect (unread:10, read:0, all `read:false`, ISO dates). The real cause = the **`autoMarkRead`
  setting** (default false, per-browser localStorage): on in Chrome, off in Safari → opening articles
  didn't mark them read. NOT a code bug.
- **v1889**: flipped `autoMarkRead` **default → true** (settingsStorage.js + news/index.jsx display
  defaults; the unused `auto_mark_read` entity attr left as-is).
🔁 **LESSON: when "X works in Chrome, not Safari" + data looks identical, suspect a per-browser SETTING
in localStorage before chasing code. Use `window.systemRegistry` (exposed) to dump registry state.**

## v1.1.1890 — Custom card wallpaper (new feature)
Appearance → "Wallpaper" sub-view (mirrors "Detail View Videos"): enable toggle, on-mobile toggle, image
URL field + ⓘ. **Apply mechanism:** set `root.style.backgroundImage` on `#fast-search-card-root` →
the glass panels' `backdrop-filter` blur it automatically (no new layer, no z-index). Existing
blur/brightness sliders still apply. URL strictly sanitized (`/`, `./`, http(s)://, `data:image/`;
rejects quotes/parens/whitespace/`url(`). Storage `appearance.customWallpaper*` + `customWallpaperChanged`
broadcast for live update. Covers ⑩ ("how to set a background"). Built by agent, apply reviewed.
Files: `index.jsx` (apply+sanitize+listener), `AppearanceSettingsTab.jsx`, de/en, catalog.

## 🔭 OPEN THREAD — wallpaper/media gallery (next session)
User wants a **thumbnail gallery** to pick wallpapers (and later videos), ideally downloaded from GitHub.
Key findings from the brainstorm — see [[project_wallpaper_gallery_plan]]:
- The card (browser) **cannot** write HA files and **cannot** list `www/` (no directory index).
- The ONLY folder-listing API from the card = **`media_source/browse_media`** (WebSocket): lists the
  default `config/media/` (zero-config) or any `media_dirs` folder. `www/` needs a `media_dirs` line.
- media_source URLs are **signed/expiring** (great for thumbnails, bad for a persisted background);
  `/local/...` (www) URLs are **permanent**.
- **Sweet spot for the user's `/config/www/wallpaper`:** one yaml line
  `homeassistant: media_dirs: { wallpaper: /config/www/wallpaper }` → card auto-lists via media_source
  AND uses permanent `/local/wallpaper/<file>` URLs. Auto-list, no manifest, permanent.
- GitHub media: reference via **jsDelivr CDN** (`cdn.jsdelivr.net/gh/<u>/<r>@<ver>/<path>`) — proper CDN,
  range requests, good for images AND video — instead of `raw.githubusercontent.com`. Sanitizer already
  allows https.
- Real "download to www" needs a backend: HA **`downloader`** integration (`downloader.download_file`)
  or a **companion custom integration** (would also fix the per-browser localStorage pain via
  server-side storage). Parked as a bigger idea.
- **NEXT: analyze these HA docs** the user gave (about HA's media folder):
  `home-assistant.io/more-info/local-media/add-media` + `…/local-media/setup-media`.
