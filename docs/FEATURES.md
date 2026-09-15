<div align="center">

# Features

### Everything Fast Search Card does.

<sub>Current as of v1.1.2409 (2026-09-13) · [Version history](version-history/versionsverlauf.md) · [Roadmap](FEATURE_ROADMAP.md)</sub>

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

Desktop layout fixed at exactly 576px height. ResizeObserver-driven `--w34-row-height` keeps W3/W4 square at any width. Containment lives on the widget, not the grid — hover-scale renders cleanly without clipping. On screens too low for the full stack, the height ladder below steps the layout down.

</details>

<details>
<summary><b>Height ladder for wall tablets.</b></summary>

<br>

The card measures the height it actually has — its position in the window, the window height and the island band — and retreats in rungs instead of cutting off at the bottom: full, compact, dropping rows, and finally the old stacked floor (v1.1.2389). A 1024 × 768 tablet with the Home Assistant header, which used to lose the bottom tile row, now fits. Since v1.1.2405 every card on a page measures its own ladder, so an editor preview no longer freezes the live card.

</details>

<details>
<summary><b>Screensaver, deep rest and the wall-tablet chain.</b></summary>

<br>

After a set idle time the screensaver returns the card to the locked clock page. If it stays quiet for a few more minutes (default 2), **deep rest** dims the screen with an overlay, shrinks the clock and fades the text, and moves the text block a few pixels every three minutes against burn-in; inside the notifications' quiet hours the dim is deeper (v1.1.2390, roadmap #61).

**Wake sources** let Home Assistant wake a resting card like a touch: a motion or presence sensor switching on, a doorbell, or a critical alert; when nobody is home the return to the clock page comes sooner (v1.1.2391, #62).

**Display handoff** switches a chosen screen entity (for example Fully Kiosk's screen switch) off when deep rest begins and on again at wake, with optional scripts for both moments (v1.1.2392, #63).

**Photo frame:** during deep rest the picture behind the clock cycles through the images of a media folder, resolved fresh for every change (v1.1.2393, #64).

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
- **Zuletzt im Haus (house chronicle).** The latest events of the whole house, fed by the live state stream without polling (v1.1.2384, roadmap #44).

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

**Groups** bundle several calendars under one switch and one colour ("Familie"), with filter chips in the calendar view (v1.1.2379, roadmap #53). **Event rules** colour an event, give it an icon, dim it, show a day chip or hide it, depending on what the event is — title contains, from a calendar or group, all-day, past — as four fixed forms rather than a rule language (v1.1.2380, #54). **People** get their calendars and groups assigned in the settings; a "Personen" view then shows the week with one lane per person plus a shared lane, and the people double as a filter (v1.1.2381, #55).

**Week as day columns:** the week tab shows one column per day with all-day pills on top and timed events as small cards below; on narrow screens it steps down from seven to five to three days and finally to the compact week grid (v1.1.2387–2388, roadmap #48).

</details>

<details>
<summary><b>Todos.</b> Local reminders, reborn.</summary>

<br>

Aggregates every HA `todo.*` backend. All lists stay on your Home Assistant. No cloud, no account. Overdue items in red. Smooth wheel pickers for due dates. Multi-list filters that actually combine.

**Live todos:** changes made elsewhere — in the Home Assistant app, by voice, by an automation — appear by themselves, because the card watches the lists' state line instead of polling; checking an item off shows immediately (v1.1.2367, roadmap #56). **Undo:** deleting a task, an event or a schedule keeps the service call waiting for six seconds under an undo pill, so undoing means nothing was ever sent (v1.1.2368, #60).

**Stacking:** identical overdue tasks that a provider reopened per missed period collapse into one row with a count such as "3× fällig" (v1.1.2395, #67). **Search before adding:** while you type a new title, matching items from all visible lists appear below the field, and each list can be assigned to one of the calendar's people (v1.1.2396, #65). **Dictation:** a microphone button in the add row turns speech into the title — through Home Assistant Assist when a speech-to-text pipeline exists, otherwise through the browser's speech recognition (v1.1.2399, #66).

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
<summary><b>Settings.</b> Four tabs, one search field.</summary>

<br>

- **Search.** A field at the top of every tab finds a setting by its name, description or options, and jumps straight to the marked row. It also covers the settings of Calendar, To-dos and News (v1.1.2419–2420). The **Changed** button beside it lists every setting that differs from its default (v1.1.2426).
- **General.** Language, currency, time format, island, notifications, sidebar items, start screen widgets, live activities, text-to-speech engine, suggestions and learning speed.
- **Appearance.** Background mode and filters, grid columns, card shape, custom wallpaper, Liquid Glass, Quick Control, filter and sorting, detail view videos.
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
<summary><b>One glass window for every popup.</b></summary>

<br>

Info texts, the filter and category windows, the history date picker, the schedule editor, the task and event forms, the hint sheet and the snooze menu all open in the same window: it grows out of the button that opened it, dims the card and puts its close button underneath (v1.1.2359–2368). Since v1.1.2406 it is a proper dialog for keyboards and screen readers — focus moves in and back, Escape closes it, and "reduce motion" shortens the animation.

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

> The island, the center, and toasts.

<details>
<summary><b>The island.</b></summary>

<br>

The status element at the top of the card has two bodies since v1.1.2289: a values capsule (weather, power) and the island itself. At rest they read as one status line; tapping the island's button moves it to the centre with a summary capsule of the current messages, and its panel filters by severity and by source.

</details>

<details>
<summary><b>House chronicle in the Notification Center.</b></summary>

<br>

The center's "Verlauf" tab shows what the whole house did, day by day, from Home Assistant's logbook — filtered by the card's exclusion list, groupable by family and room, with repeated flaps folded and "durch wen" where an event has a cause (v1.1.2382–2383, roadmap #44). Entries speak device classes: "Fenster Küche → Offen" instead of "Aktiv" (v1.1.2394). The same stock feeds the "Zuletzt im Haus" tile and a context line on the locked clock page (v1.1.2384).

</details>

<details>
<summary><b>Version watcher.</b></summary>

<br>

A wall tablet keeps its page open for weeks, so after an update it can keep running the old code. The card compares the version it is running with the one Home Assistant serves and shows a quiet line with a reload button only when the running code is provably older — never as an advertisement for a new release (v1.1.2397–2398, roadmap #68).

</details>

<details>
<summary><b>Glass effect. Configurable.</b></summary>

<br>

Bottom-center positioning. Four types — success, error, warning, info. Auto-dismiss after three seconds. Manual close optional. Shadow-DOM compatible.

Event-gated via settings.

</details>

<br>

---

## Reliability & accessibility

> What happens when something goes wrong, and without a mouse.

<details>
<summary><b>Failures say so.</b></summary>

<br>

A service call that Home Assistant rejects now shows an error toast naming the action, and states the card had already shown optimistically are rolled back (v1.1.2403). A rendering error stays inside the broken tile, view, island or window, which shows a quiet fallback with a retry button instead of emptying the whole card (v1.1.2404). Two cards on one page — typically the editor preview next to the live card — no longer disturb each other's height, wallpaper or deep rest (v1.1.2405).

</details>

<details>
<summary><b>Keyboard and screen readers.</b></summary>

<br>

Popups are real dialogs with a name, focus handling, Escape and a Tab loop (v1.1.2406). Settings rows, device tiles, chips, list rows, scroll arrows and the detail tabs can be reached with Tab and triggered with Enter or Space, with a focus ring that only the keyboard sees; every input field has a name, and small targets have at least a 24-pixel-high hit area (v1.1.2407–2409). framer-motion used to make every tap-animated element a tab stop on its own, one where Enter did nothing. Since v1.1.2421–2422 no row, card or slider page is such a silent stop, and since v1.1.2423 every icon button has a name. A guard in the commit hook checks these rules and the keyboard support of every clickable settings row.

</details>

<br>

---

## Performance

> Boots in under a second.

<details>
<summary><b>Tier 1: Snappiness.</b></summary>

<br>

Animation durations cut by 25%. `touch-action: manipulation` everywhere. `:active { scale(0.97) }` for instant feedback. Search debounce dropped from 150ms to 50ms (v1.1.1182); since v1.1.2351 the typed text shows instantly and the search follows after 110ms.

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

604,876 bytes gzipped at v1.1.2409 (measured 2026-09-13), checked against a size budget on every release. Dead-code elimination on `console.log`. SVG paths reduced to two decimal precision. See [PERFORMANCE.md](PERFORMANCE.md) for the measurements and their dates.

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

See [FEATURE_ROADMAP.md](FEATURE_ROADMAP.md) for every idea with its current status.

<br>

---

## Recent milestones

Quick way to see how the card has evolved since the last big doc refresh.

| Version | Highlight |
|---|---|
| v1.1.2419–2426 | Settings search (all tabs, plus Calendar, To-do and News settings) with a "Changed" filter, keyboard addendum with a commit guard, detail view below the island in the classic layout |
| v1.1.2403–2409 | Failures report themselves, error boundaries, two cards per page, popups as dialogs, keyboard and screen-reader pass |
| v1.1.2395–2399 | Todos: overdue stacking, search before adding, person per list, dictation; version watcher |
| v1.1.2390–2393 | Screensaver chain: deep rest, wake sources, display handoff, photo frame |
| v1.1.2389 | Height ladder — the card fits low wall tablets |
| v1.1.2387–2388 | Calendar week as day columns |
| v1.1.2382–2384 | House chronicle: center "Verlauf" tab and the "Zuletzt im Haus" tile |
| v1.1.2379–2381 | Calendar groups, event rules, person lanes |
| v1.1.2367–2368 | Live todos and undo for deletions |
| v1.1.2359–2366 | One glass window for every popup |
| v1.1.2289 | The island in two bodies |
| v1.1.2191 | Playwright test harness |
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

<sub>v1.1.2409 · <a href="version-history/versionsverlauf.md">version history</a> · <a href="../README.md">back to readme</a></sub>

</div>
