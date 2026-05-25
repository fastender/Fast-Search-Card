<div align="center">

# Features

### Everything Fast Search Card does.

<sub>Current as of v1.1.1610 · [Version history](version-history/versionsverlauf.md) · [Roadmap](FEATURE_ROADMAP.md)</sub>

</div>

<br>

---

## Overview

A Lovelace card. Four UI modes. Eight built-in apps. Designed to be the primary surface for your home.

<br>

```
Bento Start  →  Search  →  Detail View  →  System Entities
```

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

</details>

<details>
<summary><b>Schedule.</b></summary>

<br>

Built-in scheduler with `nielsfaber/scheduler-component` integration. Smooth wheel pickers for date and time. Day-of-week chips. Inline editing — no submenu.

</details>

<details>
<summary><b>Settings.</b></summary>

<br>

Per-device configuration. Bambu Lab printer setup. Energy dashboard sensor wizard. Whatever the entity needs.

</details>

<details>
<summary><b>Video backgrounds.</b></summary>

<br>

Drop a video at `video/{domain}/{state}.mp4` and the detail view picks it up automatically.

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

- **General.** Language, view mode, Bento toggle, suggestion learning rate.
- **Appearance.** Background filters, squircle cards, grid columns, splashscreen style.
- **StatsBar.** Nine widget toggles. Greetings customization.
- **Excluded patterns.** Wildcard editor with live preview.
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

> English and German today. More on the way.

<details>
<summary><b>Translations across the card.</b></summary>

<br>

`translateUI('key.path')` with German fallback. Sidebar labels. System-entity names. History tab timeframes. Action button tooltips. All language-aware.

Two languages ship today — **English** and **German**. The translation infrastructure (`src/utils/translations/languages/`) is ready for more; additional languages are planned.

Known gaps: Tipps content (DE-only), some HistoryTab sub-strings. See the roadmap.

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

See [FEATURE_ROADMAP.md](FEATURE_ROADMAP.md) for the next ten ideas — prioritized.

<br>

---

<div align="center">

<sub>Made for the Home Assistant community.</sub>

<br>

<sub>v1.1.1610 · <a href="version-history/versionsverlauf.md">version history</a> · <a href="../README.md">back to readme</a></sub>

</div>
