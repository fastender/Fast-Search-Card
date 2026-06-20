<div align="center">

# Features

### Everything Fast Search Card does.

<sub>Current as of v1.1.1924 · [Version history](version-history/versionsverlauf.md) · [Roadmap](FEATURE_ROADMAP.md)</sub>

</div>

<br>

---

## Overview

A Lovelace card. Four UI modes. Eight built-in apps. Designed to be the primary surface for your home.

<br>

```
Bento Start  →  Search & Browse  →  Detail View  →  System Entities
```

Tap the icon to control. Tap the card to expand. Browse by category, area, or "what I use most". Add background videos and a wallpaper to make it yours.

<br>

---

## Bento Start

> A start screen made of moments.

<details>
<summary><b>Four configurable slots.</b></summary>

<br>

Hero widget (W1) for favorites or suggestions. Auto-sliding pane (W2) for weather, news, todos, and calendar. Two square slots (W3, W4) for tips and version history.

Configurable in Settings → Bento. Enable or disable the entire start screen with one toggle.

</details>

<details>
<summary><b>576-pixel hard lock.</b></summary>

<br>

Desktop layout fixed at exactly 576px height. ResizeObserver-driven `--w34-row-height` keeps W3/W4 square at any width. Containment lives on the widget, not the grid — hover-scale renders cleanly without clipping.

</details>

<details>
<summary><b>Live rich widgets.</b></summary>

<br>

- **Weather.** Real-time temperature. Hourly forecast strip.
- **News.** Five articles, uniform layout. Read/unread tabs. Top-fade mask.
- **Todos.** Overdue in red. Combined status + list filters.
- **Calendar.** Next event as hero, four follow-ups. Click opens the event detail.
- **Versions.** Latest release as hero.
- **Tips.** Rotates every five seconds.

</details>

<details>
<summary><b>Track architecture slider.</b></summary>

<br>

All items mounted permanently. No AnimatePresence remount loss. Branded gradients per domain. Position survives unmount/remount via module-level state. Drag from anywhere — footer included.

</details>

<details>
<summary><b>Mobile layout.</b></summary>

<br>

Vertical stack. Each widget 50vh. Bottom safe-area (110px) so the dock never overlaps. CustomScrollbar permanently visible on touch — detected via `(hover: hover)` matchMedia.

</details>

<details>
<summary><b>List view toggle.</b></summary>

<br>

Favourites and Suggestions widget toggles between grid and list. Top-fade scroll mask, custom scrollbar, header padding tuned for both layouts. Live device states either way.

</details>

<br>

---

## Quick Control

> The device icon is the switch.

<details>
<summary><b>Tap-or-hold control on the card itself.</b></summary>

<br>

The device icon in both grid and list view becomes the control. No detail view needed for a quick toggle.

- **Safe devices** — light, switch, fan, input_boolean, media_player — **tap** the icon, it flips instantly.
- **Risky devices** — cover, lock — **press and hold** for about a second. An amber ring fills as you press; brief haptic on commit. The safe direction stays a single tap (locking, closing). Asymmetric on purpose.
- Tapping anywhere else on the card still opens the detail view.

Issue #10. Shipped in v1.1.1903.

</details>

<details>
<summary><b>Per-domain configuration.</b></summary>

<br>

Settings → Appearance → Schnellsteuerung / Quick Control. Global on/off plus a per-device-type list. Lights, switches, fans, input booleans, media players, climates, vacuums, covers, locks — each can be **Off / Tap / Hold**. Locks and covers are pre-set to Hold.

Off by default for the whole feature. Opt in globally, then tune per type.

</details>

<details>
<summary><b>List-view universal "⋯" actions.</b></summary>

<br>

In list view, the "⋯" button on each row expands an inline panel underneath — same controls the detail view shows for that device (brightness presets, cover position, climate mode, etc.). One source of truth, no duplicated UI.

Dark tray for contrast; the embedded buttons keep their original detail-view colours (no flattening). Translation-aware throughout.

</details>

<br>

---

## Search

> Fuzzy. Fast. Forgiving.

<details>
<summary><b>Fuse.js, refined.</b></summary>

<br>

Typo-tolerant. Partial matching. Persistent collection — no re-index per query. LRU cache for repeat queries. Real results in under 30 milliseconds.

</details>

<details>
<summary><b>Intent parser.</b></summary>

<br>

Multi-word queries get parsed. "Living room light" becomes `{ area: living-room, domain: light }`. Pre-filters before Fuse — 90% smaller search space.

Score = Fuse × 0.7 + Relevance × 0.3 + Prefix bonus. Fifteen domain-synonym groups, DE and EN.

</details>

<details>
<summary><b>V4 Chip Input.</b></summary>

<br>

Type a room name. See a ghost. Hit Tab. Get a chip.

| Type | Ghost | Result |
|---|---|---|
| `Kit` | `chen` 🏠 | Blue area chip |
| `lam` | `Lampe` 💡 | Purple domain chip |
| `Temp` | `eratur` 🌡 | Green sensor chip |

Combine area and domain. Two-tap delete pattern (tap selects, second tap removes). Dedicated confirm button on mobile.

</details>

<details>
<summary><b>Predictive suggestions.</b></summary>

<br>

Learns your patterns. Exponential decay (slow/normal/fast, half-life configurable). Cold-start bootstrap from click one. Negative learning — ignored suggestions lose confidence.

Reset anytime from Settings.

</details>

<details>
<summary><b>Excluded patterns.</b></summary>

<br>

Wildcards. Live preview. Template library. Import and export as JSON.

</details>

<details>
<summary><b>Area sensors in headers.</b></summary>

<br>

Got a temperature sensor assigned to a room? It appears next to the room name.

```
Bedroom                                  🌡 21.5°C   💧 48%
```

</details>

<details>
<summary><b>Browse — two views, four categories, your order.</b></summary>

<br>

Grid or list — switch any time, persists across reloads.

Four categories: **Devices · Sensors · Actions · Custom.** Each with its own filters.

Sort by area. Sort by category. Sort by what you use most. The card learns and reorders itself.

</details>

<details>
<summary><b>Visibility filters.</b></summary>

<br>

Settings → Filter. Three toggles: include hidden entities, include disabled entities, include diagnostic entities. By default the card respects whatever HA decided to hide — nothing leaks through. Flip a toggle when you actually want to see those entities.

</details>

<br>

---

## Detail View

> Everything about everything.

<details>
<summary><b>Five tabs per device.</b></summary>

<br>

Controls. Context. History. Schedule. Settings.

Action buttons replace tabs for system entities. Layout decided per-domain by `deviceConfigs.js` — over 100 configurations.

</details>

<details>
<summary><b>Controls.</b></summary>

<br>

Circular sliders for lights, climate, covers. Spring-animated. Touch and mouse drag. Temperature gradients from cold to warm. Power toggle restores last value.

Domain-specific UIs for media players, fans, locks, vacuums, solar inverters, and ninety more.

</details>

<details>
<summary><b>Context.</b></summary>

<br>

Related scenes, scripts, and automations for this device. Smart relevance sorting. One-tap execution with toast feedback.

</details>

<details>
<summary><b>History.</b></summary>

<br>

Chart.js graphs. 24-hour, 7-day, 30-day timeframes. Time-of-day analysis. State-duration bars. Statistics — change count, average duration, active time.

Universal across every entity type, not just Universal devices — sensors, switches, climates, covers all use the same view (rolled out in v1.1.1866). Per-domain chart presets pick the right scale automatically.

</details>

<details>
<summary><b>Schedule.</b></summary>

<br>

Built-in scheduler with `nielsfaber/scheduler-component` integration. Wheel pickers rebuilt as iOS-style stacked cards. Day-of-week chips. Inline editing — no submenu. Accordion backgrounds unified with the rest of the device settings.

</details>

<details>
<summary><b>Settings.</b></summary>

<br>

Per-device configuration. Bambu Lab printer setup. Energy dashboard sensor wizard. Whatever the entity needs.

</details>

<details>
<summary><b>Video backgrounds.</b></summary>

<br>

Drop an MP4 into `/local/fast-search-videos/` and the detail view plays it behind the controls. Looped, muted, auto-discovered. Path is configurable in Settings → Appearance → Detail-View videos path.

The card walks a six-step fallback hierarchy to find the right clip:

1. `{domain}_{device_class}_{state}.mp4` — most specific
2. `{domain}_{state}.mp4` — e.g. `light_on.mp4`
3. `{domain}_{device_class}.mp4` — one clip per device class (e.g. `binary_sensor_motion.mp4` covers every motion sensor)
4. `{domain}.mp4` — domain default
5. `default_1.mp4` … `default_10.mp4` — random pick from a pool
6. Icon background

State normalisation collapses HA states into four buckets (`on / off / open / closed`); the weather domain bypasses the collapse and keeps its descriptive state verbatim (`weather_sunny.mp4`, `weather_pouring.mp4`, …).

Starter packs in [`media/videos/`](../media/) — 16 on/off device clips, 9 weather states, 5 device-class clips, plus showcase clips for the system entities.

</details>

<br>

---

## System Entities

> Apps that live next to your devices.

<details>
<summary><b>Calendar.</b> A real calendar. Local. In Home Assistant.</summary>

<br>

Day, Week, Month, Year views. Native HA WebSocket integration — `calendar/event/create`, `update`, `delete`. All events stay in your Home Assistant instance. No cloud sync. Five recurrence presets. Quick chips for common titles. Location and description as sub-views. Two-step delete confirmation.

Bento integration: next event as hero, four follow-ups.

</details>

<details>
<summary><b>Todos.</b> Local reminders, reborn.</summary>

<br>

Aggregates every HA `todo.*` backend. All lists stay on your Home Assistant. No cloud, no account. Overdue items in red. Smooth wheel pickers for due dates. Multi-list filters that actually combine.

</details>

<details>
<summary><b>News.</b> Reader bundled in.</summary>

<br>

RSS-aware. Renders images other readers miss — `content:encoded` images included. Mark-as-read. Unread badge. Refreshes on focus and visibility change.

Powered by the [fast-news-reader](https://github.com/fastender/fast-news-reader) custom component — a companion HACS package that handles feed parsing, image extraction, and persistence on the Home Assistant side. The card reads its state; the component does the work. One install, no extra config.

</details>

<details>
<summary><b>Versionsverlauf.</b> Release notes inside the card.</summary>

<br>

Parses `versionsverlauf.md`. Live current version. Filter by tag and date. Markdown rendering. Deep-link from the Bento tile.

</details>

<details>
<summary><b>Tipps.</b> Lessons from the codebase.</summary>

<br>

Reads `lessons/*.md`. Random rotation in Bento every five seconds. Tag-based categorization. Detail view with markdown.

</details>

<details>
<summary><b>All Schedules.</b> Every timer in one place.</summary>

<br>

Cross-device overview. Filter by timer or schedule. Domain badges. Click navigates to the device.

</details>

<details>
<summary><b>Settings.</b> Five tabs of configuration.</summary>

<br>

- **General.** Language, view mode (persisted), Bento toggle, suggestion learning rate.
- **Appearance.** Background filters, squircle cards, grid columns (4/5/6), splashscreen style, Quick Control, wallpaper picker.
- **StatsBar.** Nine widget toggles. Greetings customisation.
- **Filter.** Excluded patterns plus visibility toggles for HA's hidden / disabled / diagnostic entities.
- **About.** Version, build info, links.

</details>

<details>
<summary><b>Integration.</b> A sub-framework for complex devices.</summary>

<br>

- **Energy Dashboard.** Multi-schema support. Real-time charts. Sensor setup wizard.
- **3D Printer (Bambu Lab).** Print status. Filament tracking. Diagnostics.
- **Weather.** Hourly and daily forecasts via `weather.get_forecasts`.
- **Universal.** Fallback for any unrecognized device.

</details>

<br>

---

## Music Assistant

> Your queue, your way.

<details>
<summary><b>One panel, every source.</b></summary>

<br>

Search libraries. Browse the queue. Switch between MA and direct media-player. Volume on a liquid-glass slider. Now playing as the background.

Multi-shape response handling — works across MA versions.

</details>

<details>
<summary><b>TTS, multilingual.</b></summary>

<br>

Multi-engine fallback. Language picker. Speak in any voice your HA install supports.

</details>

<br>

---

## Wallpapers

> Make it yours.

<details>
<summary><b>Custom card wallpaper.</b></summary>

<br>

Settings → Appearance → Wallpaper. Drop in any image — the card uses it as a full-screen background, replacing HA's own `--view-background` so it covers the whole view, not just the card. Survives HA re-renders via a MutationObserver that re-applies on every paint.

</details>

<details>
<summary><b>Wallpaper gallery.</b></summary>

<br>

Browse images from your HA media folder by thumbnail. Resolved via `media-source/resolve_media` — works for `/config/media/` setups as well as `/config/www/`. Tap a thumbnail to set it.

Safari boot polish: no double image, no flash of the old wallpaper during the boot zoom.

</details>

<br>

---

## Sidebar

> A dock for your apps.

<details>
<summary><b>Liquid-glass pill.</b></summary>

<br>

Left side on desktop. Bottom on mobile. Smooth hover morphing — liquid-glass deblur with framer-motion spring. Label stagger on expand.

</details>

<details>
<summary><b>Customizable.</b></summary>

<br>

Choose which system entities appear. Home as a virtual default item. Overflow popup when there are more items than the dock can show.

Language-aware labels — German and English, with more to come.

</details>

<br>

---

## Design

> visionOS, distilled.

<details>
<summary><b>Glassmorphism.</b></summary>

<br>

Real `backdrop-filter`. Five user-customizable filters: brightness, blur, contrast, saturation, grayscale. All persistent across sessions.

</details>

<details>
<summary><b>Handwritten splashscreen.</b></summary>

<br>

A "hello" greeting drawn with SVG paths. Two strokes. A pause between them, like a real pen lift. Three options: None, Progress, Handwritten.

</details>

<details>
<summary><b>Smooth reveal.</b></summary>

<br>

After the splash, the UI fades in. Blur to clear. Scale up. Subtle Y-translate. Spring physics. Cross-fades with the splash for a seamless handoff.

</details>

<details>
<summary><b>Custom scrollbars.</b></summary>

<br>

Minimalist design. Fixed 80px track with proportional thumb. Fades in on scroll. Always visible on touch. Reacts to async-loaded content via MutationObserver.

</details>

<details>
<summary><b>Squircle cards.</b></summary>

<br>

True squircle shape via CSS clip-path. Four styles: none, soft, standard, strong.

</details>

<details>
<summary><b>Animated device icons.</b></summary>

<br>

Over 100 hand-drawn SVGs with on/off states. Washing machines spin. Locks rotate. Motion sensors pulse once and fade. GPU-disciplined — only eleven icons loop forever.

</details>

<br>

---

## AI Mode

> Experimental.

<details>
<summary><b>Chat with your home.</b></summary>

<br>

Currently a mock backend. Real LLM integration via HA Conversation API is on the roadmap.

See [FEATURE_ROADMAP.md](FEATURE_ROADMAP.md#1-echte-llm-conversation-statt-simulierte-ai) for the plan.

</details>

<br>

---

## Notifications

> visionOS-style toasts.

<details>
<summary><b>Glass effect. Configurable.</b></summary>

<br>

Bottom-center positioning. Four types — success, error, warning, info. Auto-dismiss after three seconds. Manual close optional. Shadow-DOM compatible.

Event-gated via settings.

</details>

<br>

---

## Performance

> Boots in under a second.

<details>
<summary><b>Tier 1: Snappiness.</b></summary>

<br>

Animation durations cut by 25%. `touch-action: manipulation` everywhere. `:active { scale(0.97) }` for instant feedback. Search debounce dropped from 150ms to 50ms.

</details>

<details>
<summary><b>Tier 2: CPU discipline.</b></summary>

<br>

rAF batching caps state updates at 60/sec. IndexedDB writes batched into a single transaction. `contain: paint` where safe. `will-change` only during interaction.

</details>

<details>
<summary><b>Virtualization.</b></summary>

<br>

Powered by virtua. DOM nodes for large lists: 400+ → ~30. Scroll FPS on mobile: 30-50 → 55-60.

</details>

<details>
<summary><b>Search cache.</b></summary>

<br>

LRU of 30 queries. Auto-invalidates on collection change. Rapid query switching is instant.

</details>

<details>
<summary><b>Press feedback.</b></summary>

<br>

Pub/sub pending-action tracker. Only the affected card rerenders during a service call. Subtle blue shimmer pulse. No optimistic UI — no de-sync risk.

</details>

<details>
<summary><b>Detail view prefetch.</b></summary>

<br>

`pointerEnter` on desktop warms the cache. `pointerDown` on mobile prefetches before the click registers. The detail view opens noticeably faster.

</details>

<details>
<summary><b>Bundle.</b></summary>

<br>

390 KB gzipped. Dead-code elimination on `console.log`. SVG paths reduced to two decimal precision.

</details>

<br>

---

## Persistence

> Three tiers.

<details>
<summary><b>localStorage.</b> Synchronous. Small. Fast.</summary>

<br>

User settings. Entity snapshot for instant first paint. Favorites. Slider positions.

</details>

<details>
<summary><b>IndexedDB.</b> Async. Background. Comprehensive.</summary>

<br>

Full entity state and history. User patterns for predictions. Cached system-entity data. Batched writes.

</details>

<details>
<summary><b>Memory cache.</b> LRU. Volatile.</summary>

<br>

Thirty search queries. Frequent lookups.

</details>

<br>

---

## Internationalization

> English and German today. **Dutch up next.** More on the way.

<details>
<summary><b>Translations across the card.</b></summary>

<br>

`translateUI('key.path')` with German fallback. Sidebar labels. System-entity names. History tab timeframes. Action button tooltips. Visibility filter info popups. Climate Heat/Cool button. All language-aware.

Two languages ship today — **English** and **German**. The translation infrastructure (`src/utils/translations/languages/`) is ready for more; additional languages are planned.

Recent passes (June 2026) closed seven hardcoded German strings flagged by community feedback (item ⑨ in the Reddit/GitHub feedback list). Tipps content is still DE-only. If you spot another string that falls back to German, screenshot + path opens the next fix.

</details>

<details>
<summary><b>Planned language order.</b></summary>

<br>

Listed in priority order. Community pull requests welcome — see [FEATURE_ROADMAP.md #21](FEATURE_ROADMAP.md) for the translator onboarding plan.

1. **Dutch (`nl`)** — Reddit community request; HA's second-largest country market after Germany.
2. **French (`fr`)** — largest non-German European HA community.
3. **Italian (`it`)** — very active forum presence.
4. **Spanish (`es`)** — covers EU + LATAM with one file.
5. **Polish (`pl`)** — surprisingly active community, asked for repeatedly in DMs.
6. **Portuguese (`pt`)** — Portugal + Brazilian Portuguese.
7. **Czech (`cs`)** — smaller, but tight-knit community.
8. **Swedish (`sv`)** — Nordic anchor.

Eight on top of EN+DE = ten total. Roadmap target, not a fixed list; what ships depends on which PRs land.

</details>

<br>

---

## Plugin Framework

> Build your own.

<details>
<summary><b>SystemEntity base class.</b></summary>

<br>

Abstract base for all built-in apps and plugins. Lifecycle hooks. Singleton-shared hass retry. Custom view component. Action buttons. Brand color. Permissions.

</details>

<details>
<summary><b>SystemEntityRegistry.</b></summary>

<br>

Singleton. Auto-discovery. Lookup by ID, domain, or category. Event system. HA-entity-shape adapter so apps appear in search.

</details>

<details>
<summary><b>ViewRefContext.</b></summary>

<br>

Toolbar handlers without `window` globals. Views register via `useRegisterViewRef`. Detail view reads via `useViewRefs`.

</details>

<details>
<summary><b>Plugin Store.</b></summary>

<br>

In development. Browse, install, and manage plugins from inside the card. Manifest format with permissions. Sandboxing.

</details>

<br>

---

## What's next

See [FEATURE_ROADMAP.md](FEATURE_ROADMAP.md) for **twenty ideas** — the original ten from May plus a new ten shaped by what shipped through June. Sketchpad widget recommended as the next flagship.

<br>

---

## Recent milestones

Quick way to see how the card has evolved since the last big doc refresh.

| Version | Highlight |
|---|---|
| v1.1.1924 | Bento detail-overlay top fix in Safari + scrollbar inside widget padding |
| v1.1.1918 | Bento favourites/suggestions widget — grid ↔ list view toggle |
| v1.1.1911 | List-View Quick Control — icon-as-switch + universal `⋯` inline actions |
| v1.1.1903 | **Quick Control** — the device icon is the switch (issue #10) |
| v1.1.1902 | Wallpaper gallery via `media-source/resolve_media` |
| v1.1.1900 | Visibility filters for HA's hidden / disabled / diagnostic entities |
| v1.1.1890 | **Custom card wallpaper** — pick any image as background |
| v1.1.1875 | List view: switches/lights toggle directly from the row |
| v1.1.1868 | Background videos — weather domain + device_class fallback layer |
| v1.1.1866 | Universal history view (charts + activities) for every entity type |
| v1.1.1855 | Schedule picker rebuilt as iOS-style cards |
| v1.1.1610 | Tipps/Versionsverlauf deep-link back-button fix (last doc baseline) |

Plus 50+ smaller fixes from Reddit and GitHub feedback: Safari read-state persistence, Firefox transparency, brightness slider snap-back, grid/list mode persistence, German UI overriding English default, empty entity grid on first open, Energy Dashboard scrolling.

<br>

---

<div align="center">

<sub>Made for the Home Assistant community.</sub>

<br>

<sub>v1.1.1924 · <a href="version-history/versionsverlauf.md">version history</a> · <a href="../README.md">back to readme</a></sub>

</div>
