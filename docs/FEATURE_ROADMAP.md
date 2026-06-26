# Feature Roadmap

**Created:** 2026-05-22 · **Revised:** 2026-06-20
**Basis:** Versionsverlauf v1.0.0 → v1.1.1924 · 16 session notes · code inspection
**Status:** Proposal, not a commitment. Order and selection are open.

Concrete feature proposals tied to open threads in the session notes, unused HA APIs, and gaps in the existing architecture. Every idea has a real hook somewhere in the current code.

---

## Original ten — status check

The first ten proposals from May 2026 are still mostly open, with two partial deliveries:

| # | Idea | Status |
|---|---|---|
| 1 | LLM conversation | open — mock still in place |
| 2 | Spotlight / Cmd+K | open |
| 3 | Notification Center system entity | open |
| 4 | Camera live-view system entity | open |
| 5 | Floorplan / map view | open |
| 6 | Energy cost tracking | **partial** — Energy Dashboard polished v1862–1865, cost layer not built |
| 7 | Routines / modes engine | open |
| 8 | Global search across system entities | open |
| 9 | Standby / ambient mode | open |
| 10 | Calendar: multi-day events + custom RRULE | open |

What got built instead between May and June: **Quick Control** (issue #10), **custom wallpapers + gallery**, **visibility filters**, **Bento list view**, **weather + device_class video backgrounds**, **iOS-style schedule picker rebuild**, and a stack of cross-browser fixes. None of these were on the original roadmap. The roadmap survives — it just got out-prioritised by community-driven work.

---

## Part one — original ten, restated

### 1. Real LLM conversation (replace the mock)

**Pitch:** Turn the mock AI Mode into a real conversational assistant that controls HA devices.

**Status quo:** `AIModeSection.jsx` shows simulated responses. HA has had the **Conversation API** + Assist pipeline (`conversation.process`) since 2024, and arbitrary LLM backends (OpenAI/Anthropic/Ollama) are available as HA integrations.

**What ships:**
- Input → `hass.callService('conversation', 'process', { text, conversation_id, agent_id })` → response + `tool_calls` for direct device actions ("Turn off the kitchen").
- Persist `conversation_id` for follow-ups ("and the bathroom too").
- Agent picker in Settings (HA lists every available agent via `conversation/list`).

**Effort:** Medium. Mock wrapper is already there — wire up the API, render tool calls, persist history.

**Files (estimate):**
- `src/components/ai/AIModeInterface.jsx` (refactor)
- `src/utils/conversationService.js` (new)
- Settings tab: agent picker

---

### 2. Spotlight / Command Palette (⌘K)

**Pitch:** A second search layer above the entity search — not "find device", but "do thing".

**Status quo:** No action search. Scenes/scripts are grouped per device in the Context tab, but not globally searchable.

**What ships:**
- Global ⌘K (or long-press on mobile).
- Examples: "Activate Movie-Time", "Open calendar for tomorrow", "Heating to 21°", "Read latest tip", "Settings → Bento".
- Sources: scenes, scripts, automations, system-entity actions, settings sub-views, routines (see #7).

**Hook in:** Fuse.js + System-Entity Registry + `actions` property per entity are all already there. Action search = Fuse over a different index.

**Effort:** Small to medium. New `commandRegistry.js`, key binding hook, overlay panel that reuses the existing search styling.

**Files (estimate):**
- `src/utils/commandRegistry.js` (new)
- `src/components/CommandPalette.jsx` (new)
- `src/hooks/useGlobalKeybinding.js` (new)

---

### 3. Notification Center as a system entity

**Pitch:** Toasts vanish in 3 s with no trace. A real system entity (mirroring News/Todos) with notification history.

**Status quo:** Toast system exists (`toastNotification.js`), HA `persistent_notifications` are extracted in `dataNotifications.js`. No history, no center, no bulk actions.

**What ships:**
- System entity `notifications` with its own custom view (mirroring Todos/News).
- Filter: error / warning / info.
- Quick actions: "Dismiss all", "Snooze 1 h".
- Bento widget: top 3 unread + badge count.
- Sidebar item with live badge.
- Sources: HA `persistent_notifications` + own toast history + optionally `mobile_app` notifications.

**Effort:** Medium. Persistence layer (IndexedDB store for toast history) + view. Toast pipeline already exists.

**Files (estimate):**
- `src/system-entities/entities/notifications/` (new, mirrors `news/`)
- IndexedDB store schema update
- `dataNotifications.js` extended with a persist layer

---

### 4. Camera live-view system entity

**Pitch:** Cameras get their own app-style view with a grid + live stream.

**Status quo:** HA has `camera.*` with `/api/camera_proxy_stream/{entity_id}` (MJPEG) and `camera.snapshot`. The card uses none of it — cameras show as generic entity cards.

**What ships:**
- **Grid view:** all cameras as live tiles with 5-s snapshot polling (no full stream initially — bandwidth-friendly).
- **Detail stream:** click → full-frame MJPEG/HLS.
- **Bento widget:** last active camera as hero (doorbell on motion, for example).
- **Snapshot history:** capture on motion events, scroll through chronologically.

**Effort:** Medium to large. Stream lifecycle (unmount must close connections), snapshot throttling, possibly WebRTC for higher stream quality.

**Files (estimate):**
- `src/system-entities/entities/cameras/` (new)
- `src/utils/cameraStreamManager.js` (new, connection pool)
- `src/components/bento/widgets/BentoRichCamera.jsx` (new)

---

### 5. Floorplan / map view

**Pitch:** 2D floor plan of the house with devices as interactive hotspots.

**Status quo:** `areas` is a first-class concept in DataProvider, but there's no spatial visualisation.

**What ships:**
- User uploads a floor-plan image (SVG or PNG), places devices via drag editor.
- **Real time:** lights glow when on, sensors show readings as pills, doors/windows show open/closed state.
- **Editor mode:** toggle in Settings, devices as draggable markers.
- **Multi-floor:** tab switch between levels.

**Effort:** Large. Own editor mode, coord persistence, SVG render layer. High-visibility feature.

**Files (estimate):**
- `src/system-entities/entities/floorplan/` (new)
- `src/components/FloorplanEditor.jsx` (new)
- `src/utils/floorplanStorage.js` (new, IndexedDB)

---

### 6. Energy cost tracking + savings hints

**Pitch:** Turn the existing energy data into real € numbers.

**Status quo:** The Energy Dashboard already knows `entity_energy_price` since the v1.1.1425 schema rewrite — but only as a preference read. No aggregated cost surface.

**What ships:**
- Day/week/month cost (in €).
- Year-over-year comparison.
- Top-consumer ranking ("Washing machine: 18 € this month").
- **Savings hints** when tariffs vary: "You'd save 12 €/month if the dryer ran evenings instead of midday" (from `stat_rate_from/to`).
- Bento widget: today X €, yesterday Y € — as a W3/W4 pill.

**Hook in:** `energy/get_prefs` is already read; `recorder/statistics_during_period` returns the numbers.

**Effort:** Medium. No new data source, just aggregation + UI.

**Files (estimate):**
- `energyDashboardCalculations.js` (extend)
- `src/components/bento/widgets/BentoRichEnergyCost.jsx` (new)
- New sub-view in EnergyDashboardDeviceView

---

### 7. Routines / modes engine

**Pitch:** One-click multi-device actions — "Morning Mode", "Movie Mode", "Sleep Mode".

**Status quo:** Today you need to build a scene or script in HA. Authoring in the card directly would lower the bar.

**What ships:**
- **Mode picker in Sidebar/Bento:** "Morning 🌅" → roll up the blinds, start the coffee, +2° heat.
- **Schedule integration:** routines triggerable on sunrise/sunset/time/geofence (ScheduleTab + scheduler-component are already there).
- **Builder UI:** wheel-picker sub-view stack (mirrors `CalendarEventDialog`) → device → action → save.
- **Persistence:** either IndexedDB-local, or written as HA scripts via the WS API.

**Hook in:** Context tab already shows scenes/scripts per device. A routine is a "virtual script".

**Effort:** Medium. UI builder + execution layer.

**Files (estimate):**
- `src/system-entities/entities/routines/` (new)
- `src/components/RoutineBuilder.jsx` (new)
- `src/utils/routineExecutor.js` (new)

---

### 8. Global search across system entities

**Pitch:** One input finds **everything at once** — Todos, news articles, calendar events, tips, version-history entries, and devices.

**Status quo:** Memory TODO from session notes. Current search finds devices + system-entity names, not their content.

**What ships:**
- Where: sidebar search pill, or ⌘F.
- Each-entity-searchable: every system entity exposes a `searchableItems()` function (Fuse index per entity).
- Global search aggregates + groups by header: "Devices / Actions / Content".
- Click → deep-link into the matching entity (pattern exists, e.g. `window.__pendingNewsArticleId`).

**Hook in:** Could merge with #2 (Command Palette) — one input with mode switch ("find actions" vs "find content").

**Effort:** Small to medium. Each-entity-searchable is a tiny interface; each entity adds 1 function.

**Files (estimate):**
- `src/system-entities/base/SystemEntity.js` (extend interface)
- `src/utils/globalSearch.js` (new)
- Every `entities/*/index.jsx` implements `searchableItems`

---

### 9. Standby / ambient mode for wall tablets

**Pitch:** After X min idle, switch to ambient — big clock, weather, today's calendar, notification count.

**Status quo:** `kioskMode.js` exists (rudimentary hide-UI), no full ambient layer. Many users run the card as an always-on display on iPads or wall tablets.

**What ships:**
- Idle detection (mouse/touch idle > X min, configurable).
- Wake on touch.
- Optional time-of-day layouts (day / night variant).
- Burn-in protection: subtle drift animation every 30 s.
- Settings toggle: "Activate after 5/10/30 min".

**Hook in:** Bento architecture fits perfectly — ambient mode would be a fifth layout alongside Desktop/Mobile/DetailView/Search.

**Effort:** Medium. Idle detection + view composition from existing widgets.

**Files (estimate):**
- `src/components/AmbientMode.jsx` (new)
- `src/hooks/useIdleDetection.js` (new)
- `src/utils/kioskMode.js` (extend)

---

### 10. Calendar: multi-day events + custom RRULE editor

**Pitch:** Two gaps in the Calendar system entity that ship under "polish".

**Status quo:** Calendar functional since v1.1.1553–1559, but two clear gaps remain.

**What ships:**

**A) Multi-day events:**
- Today multi-day events only render on the start day in Day/Week view.
- Should draw as continuous bars across every affected day.
- Implementation: CSS grid column spans + event splitting on day boundaries.

**B) Custom RRULE editor:**
- Today: 5 simple presets (Never / Daily / Weekly / Monthly / Yearly).
- People want "Every 2 weeks", "Every first Friday", "14 days after birthday".
- Sub-view with `INTERVAL` + `BYDAY` + `UNTIL/COUNT` pickers (mirrors the existing wheel pattern).
- Custom RRULEs currently render read-only as "Custom" — make them fully editable.

**Hook in:** HA WS API (`calendar/event/update`) already supports `rrule`. Just build the editor + bar rendering.

**Effort:** Medium. RRULE parsing via `rrule.js` (~6 KB) or a tiny custom parser (5 fields are enough). Bar rendering is CSS grid spans.

**Files (estimate):**
- `CalendarView.jsx` (multi-day bar rendering in MonthGrid/WeekGrid)
- `CalendarEventDialog.jsx` (extend recurrence sub-view)
- `src/system-entities/entities/calendar/utils/rruleHelpers.js` (new)

---

## Part two — ten new ideas

A second batch shaped by what shipped in the last four weeks (Quick Control patterns, wallpapers, video backgrounds) and what users have been asking for in DMs and issues.

### 11. Sketchpad / family canvas widget

**Pitch:** A Bento widget that's a tiny canvas. Tap it → full-screen sketchpad. Doodles, shopping notes, "Daddy back at 6", a kid's drawing — pinned to the smart home.

**Why it's strong:** No HA card has anything like this. Reframes the smart home from "device control panel" to "family surface". Perfect fit for the wall-tablet use case Quick Control was built around.

**What ships:**
- Bento widget showing the last sketch as a thumbnail.
- Tap → full-screen canvas with Pointer Events (stylus, finger, mouse).
- Tools: pen, eraser, color picker, clear, undo (≤10 steps).
- Storage: SVG path data in IndexedDB. Small, scalable, replayable.
- Multi-pad: swipe between pads, name them, pin one as "the kitchen board".
- Optional cross-device sync via a single `input_text.fsc_sketchpad` entity (base64-encoded path blob).

**Effort:** Medium. The hard part is touch-pen UX, not the engineering.

**Files (estimate):**
- `src/system-entities/entities/sketchpad/` (new)
- `src/components/bento/widgets/BentoRichSketchpad.jsx` (new)
- `src/utils/sketchpadStorage.js` (new)

---

### 12. Voice — wake word + Assist Pipeline

**Pitch:** Hands-free. Say "Hey Home" → the card listens → command goes through HA's Assist pipeline → action plus a visual response.

**Status quo:** Assist Pipeline (`assist_pipeline.run`) handles audio in/out end-to-end since HA 2023.5. Browser side: `webkitSpeechRecognition` for wake-word detection, `MediaRecorder` for the actual command audio.

**What ships:**
- Settings toggle: "Enable voice".
- Floating mic indicator in the bottom-right when listening.
- Visual transcript while you speak.
- Optional wake-word picker (default: "Hey Home", configurable).
- Browser-only — no extra hardware.

**Why it pairs with #1:** Voice in, LLM out, hands-free smart home in one card. Closes a feature gap most HA setups solve with Alexa or Google.

**Effort:** Medium to large. Wake word is the hard part — browser detection is patchy outside Chrome.

---

### 13. Daily briefing widget

**Pitch:** A morning summary surface — weather, today's calendar, overnight notifications, energy stats, "trash day tomorrow". One widget, glance-and-go.

**Status quo:** Weather, calendar, energy, notifications all already live in the card. They just don't share a surface.

**What ships:**
- Bento widget that wakes up between 6:00 and 9:00 (configurable).
- Greeting line: "Good morning, Ender."
- Three lines below: weather forecast, top calendar event, one anomaly ("Energy use up 30% yesterday").
- Tap → full Daily Briefing view with the long version.

**Effort:** Small. Pure composition of existing data — no new data source.

---

### 14. Plant care widget

**Pitch:** Track watering and fertilising schedules per plant. Photo of the plant on the widget, days-until-next-water as a pill, tap to mark done.

**Why it works:** Nicheable but high-emotional. People with houseplants are obsessive, and there's no good HA solution today.

**What ships:**
- System entity `plants` with per-plant configs (name, photo, water-every-N-days, fertilise-every-N-days, last-done timestamp).
- Bento widget: photo + countdown to next action.
- Detail view: full plant list, log of past care, optional integration with `sensor.*` for soil-moisture readings.
- Optional companion: Plant Care HACS integration (already exists, the card just reads its state).

**Effort:** Small to medium. No HA-side magic required.

---

### 15. Multi-user profiles

**Pitch:** Different family members get different views. Sarah's favourites aren't Mike's. Their schedules aren't either.

**Status quo:** HA already has `person.*` entities and user accounts. The card treats every viewer as the same.

**What ships:**
- Settings → Profile picker (auto-detected from HA user, or manual switcher).
- Per-profile: favourites, default tab, sidebar layout, hidden domains, wallpaper.
- Privacy: each profile's data lives under its own localStorage namespace.
- Bento widget: "Who's home" panel showing each `person.*` state + last-seen area.

**Effort:** Medium. Touches almost every settings consumer. Worth it for households with multiple HA users.

---

### 16. Lighting Scene DJ

**Pitch:** Drag an image onto the card → it extracts the dominant colors → you assign each color to a light. Save as a scene.

**Why it's strong:** Visceral. The kind of feature that gets shared in screenshots. Solves a real problem (matching room lighting to album art, photos, paintings).

**What ships:**
- Drag-and-drop image area in the Lighting view.
- Auto color extraction (k-means in a Web Worker, ~30 lines of code).
- Pick which color goes to which RGB-capable light.
- "Save as scene" → writes a normal HA scene the user can call anywhere.

**Effort:** Small. Image processing is well-trodden ground; HA scene-write is a single service call.

---

### 17. Welcome home animation

**Pitch:** When `person.{you}` flips from `away` to `home`, the card runs a 5-second personal animation. Greeting, weather, "your last calendar event is in 2 hours". Smooth, ambient, optional.

**Status quo:** Person state change is already an event the card can subscribe to. Nothing currently reacts.

**What ships:**
- Toggle per profile.
- Animation sequence customisable: "Hello, {name}", weather glance, next event, energy headline.
- Runs once per state change, not per render.
- Auto-dismisses after 5–10 s or any interaction.

**Effort:** Small. Animation primitives are all already there (Framer Motion).

---

### 18. Bin / waste schedule widget

**Pitch:** Which bin goes out tomorrow? A widget that knows.

**Why it ships:** Universal pain. Every household has this. No HA-native solution that's not a hack.

**What ships:**
- Settings → Add bins → each bin has a color, a name, a recurrence pattern (weekly, bi-weekly, "every second Monday").
- Bento widget: tonight's or tomorrow's bins as colored pills.
- Optional integration with municipal waste-collection iCal feeds (parse once a year, store dates).
- Push notification 2 hours before pickup time.

**Effort:** Small. The infrastructure to schedule things is in ScheduleTab already.

---

### 19. Time-lapse camera roll

**Pitch:** Capture one frame from a camera every N minutes. At the end of the day, stitch them into a 10-second time-lapse. Auto-saved per day, browse the calendar of time-lapses.

**Why it's strong:** Showy. People love this for security cams, baby monitors, weather cams, garden cams.

**What ships:**
- Per-camera "Enable time-lapse" toggle.
- Background capture via `camera.snapshot` service.
- Daily ffmpeg-in-browser (via wasm) compilation.
- Calendar of time-lapses, scrub to a date, play.

**Effort:** Medium to large. ffmpeg.wasm is heavy (~25 MB), but lazy-loaded. The capture loop is trivial.

---

### 20. Birthday + anniversary hub

**Pitch:** Family dates that surface at the right moment. Bento widget shows the next one, full view lists everyone, calendar integration writes them into your real calendar.

**Why it ships:** Sentimental, sticky, high-emotional. People remember the card on important days.

**What ships:**
- System entity `dates` with per-person entries (name, photo, type, recurring date).
- Bento widget: next date as a hero card.
- Auto-generates calendar events with auto-set yearly RRULE.
- Optional: 7-days-before push notification.

**Effort:** Small. Calendar already does the heavy lifting; this is a UI layer + a list.

---

## Part three — parallel track: localization

### 21. Localization expansion

**Pitch:** Translate the card from two languages to ten. Start with Dutch (community request, second-largest HA market after Germany).

**Status quo:** Two languages ship today — **English** and **German**. The translation infrastructure (`src/utils/translations/languages/`) is ready for more; the wiring (`translateUI('key.path')` with German fallback) already covers every language-aware surface that recent passes touched (sidebar, action buttons, history timeframes, visibility filter info popups, climate Heat/Cool, the seven hardcoded DE strings closed in v1.1.1908).

The recurring gap is **content**, not infrastructure — the Tipps system entity ships DE-only content, the HistoryTab sub-strings have a few stragglers, and adding a third language means walking every key-path and writing a translation file.

**What ships (priority order):**

| Order | Language | Why this priority |
|---|---|---|
| 1 | **Dutch (`nl.js`)** | Community request from a Reddit comment. HA's second-largest country market after Germany. ~600 km of "they basically already use German anyway" jokes incoming. |
| 2 | **French (`fr.js`)** | Largest non-German European HA community. High demand, low effort once Dutch is done. |
| 3 | **Italian (`it.js`)** | Strong HA presence, very active forum community. |
| 4 | **Spanish (`es.js`)** | Large EU + LATAM reach with one file. |
| 5 | **Polish (`pl.js`)** | Surprisingly active HA community, often overlooked. Asked for repeatedly in DMs. |
| 6 | **Portuguese (`pt.js`)** | Covers both Portugal and Brazilian-Portuguese users. |
| 7 | **Czech (`cs.js`)** | Smaller but tight-knit community, lots of HA tinkerers. |
| 8 | **Swedish (`sv.js`)** | Together with Norwegian and Danish, opens up the Scandinavian market. |

Eight languages on top of EN+DE = ten total. Roadmap target, not a fixed list — community PRs decide what actually lands.

**How:**

- Translation files are plain JavaScript modules in `src/utils/translations/languages/`. Each is a one-level-deep nested object, ~1,150 lines for DE/EN.
- Onboarding doc for translators: `docs/i18n-contributing.md` (to be written). Lists every key-path, marks "must-have" vs "nice-to-have" sections, includes a tiny checker script that fails CI on missing keys.
- Community PRs welcome. No Crowdin/Weblate yet — start with PRs; if volume picks up, evaluate a translation platform later.
- Each new language enables itself once it covers a threshold (say 80% of keys) so partial translations don't ship as broken language switches.

**Effort:** Medium per language (4–8 h for someone fluent + familiar with HA). Tooling/scripting work is one-evening upfront. Roadmap target = first three languages (NL, FR, IT) within 6 weeks; rest is community-paced.

**Files (estimate):**
- `src/utils/translations/languages/nl.js` (first, ~1150 lines)
- `src/utils/translations/languages/{fr,it,es,pl,pt,cs,sv}.js` (subsequent)
- `docs/i18n-contributing.md` (new — translator onboarding)
- `scripts/check-translation-keys.py` (new — CI guard against missing keys)

**Why it's a parallel track:** Localisation doesn't compete with new features for design and architecture time. A new translation lands in a single file plus one settings entry. Different skill profile too — fluent native speakers don't need to know Preact. The Sketchpad widget (#11) and a Dutch translation can ship in the same release without stepping on each other.

---

## Part four — long-term track: companion integration

### 22. Companion Integration (long-term)

**Pitch:** A real Home Assistant **integration** (Python, in-Core-eligible) that runs alongside the card and unlocks features needing server-side persistence — Sketchpad sync, predictive-suggestion training data, notification history beyond the browser cache, cross-device favourites.

**Why it ships eventually:** Two strategic wins.

1. **Quality Scale eligibility.** Lovelace cards are stuck in the `Custom` special tier forever — see [QUALITY.md](QUALITY.md) for the full story. An integration can go through Bronze → Silver → Gold officially. That's the only path to a real "graded by HA" status.

2. **Features the card can't do alone.** Anything needing cross-device state, push notifications, scheduled background work, or persistent caches beyond the browser benefits from a backend. The Sketchpad widget (#11) is a prime example — without a server-side blob, sync across devices is awkward. A small companion integration solves it cleanly.

**Status quo:** Two precedents already exist.
- `fast-news-reader` — separate HACS package, scope is RSS-only.
- `nielsfaber/scheduler-component` — third-party scheduler the card integrates with.

A first-party `fast-search-card` integration would be the third companion — broader in scope, designed specifically as the card's optional backend.

**What ships (eventual):**
- Python integration following HA conventions (config flow, async, typed, full test coverage).
- Optional install — card stays a full standalone product, integration is power-user opt-in.
- Service endpoints for:
  - Sketchpad sync (store path data, broadcast updates)
  - Notification history (toast persistence beyond browser cache)
  - Predictive-suggestion training data (opt-in cross-device pattern learning)
  - Sensor-roll / time-lapse storage (#19)
  - Multi-user profile persistence (#15)
- Submitted for Core inclusion once Bronze-level coverage is in place.
- Long-form documentation, including the migration path from "card-only" to "card + integration".

**Effort:** Large. Python integration from scratch with full test coverage + Core submission process = weeks of work, not days. Not even on the medium-term radar — this is a 2027 conversation, after Tests (Gap 1 in QUALITY.md) and a handful of the Part-Two ideas have shipped.

**Why it's a long-term track:** It's a different codebase, different language, different release cadence, different review process. Slotting it as a regular roadmap entry would distort priorities. Listed here so the path to "real HA Quality Scale Gold" is visible and intentional — not because it should ship next.

**Files (estimate, eventual):**
- Separate Python repo: `home-assistant/core` pull request after the integration matures, or a `fastender/fast-search-card-integration` HACS-distributed repo first.
- `custom_components/fast_search_card/` (new — eventual Core path)
- New WS API endpoints documented in card-side `src/utils/companionApi.js`

---

## Part five — twelve new ideas from competitive + community research

Synthesised from a research pass across r/homeassistant, the HA community forum, the top custom-card repos (Mushroom, Bubble, Button-Card, mini-graph-card, mini-media-player, Power Flow Card Plus, Tile), HA Core 2025–2026 release notes, and the Apple Home ecosystem. Each idea references a concrete source; none overlap with #1–#22.

### 23. Card Picker Suggestion Provider

**Pitch:** Make Fast Search Card the smartest entry in HA's native card picker. When a user picks a light or sensor, our card shows up with three variants pre-configured.

**Status quo:** HA 2026.6 shipped `window.customCards.getEntitySuggestion(hass, entityId)` for exactly this. No mainstream custom card has opted in yet.

**What ships:**
- Register a suggestion provider returning up to three variants per domain: Bento tile, Quick Control switch, full-search variant.
- Per-domain heuristics: lights → Quick Control, numeric sensors with `state_class` → chart variant, covers → tile with feature row.
- Variant labels in user's language.

**Effort:** Small. Thin adapter over existing config presets.

**Why it fits:** Positions the card as a first-class citizen in HA's own dashboard editor — discoverable without HACS hunting.

---

### 24. Quick Search Bridge (⌘K interop)

**Pitch:** HA's native Quick Search opens our card; our card hands results back. Two search-first surfaces, one muscle memory.

**Status quo:** HA 2026.2 introduced Quick Search (⌘K) with Navigate / Commands / Entities / Devices / Areas categories. Plus My-link URL shortcuts. Our existing Spotlight roadmap entry (#2) was inside the card; this is the interop layer.

**What ships:**
- Detect native Quick Search opening, surface the card's index as an extra category.
- Emit My-style deep links (`/lovelace/...?fsc=entityId`) so navigation lands focused on a specific item.
- Optional setting: "Replace ⌘K with Fast Search Card" — window-level interceptor scoped to the card's view.

**Effort:** Medium.

**Why it fits:** Two competing palettes confuse users. The card already is search-first; integrating with HA's own palette closes the loop.

---

### 25. Per-card gesture mapper

**Pitch:** Bind tap, double-tap, hold, swipe-up/down/left/right to actions on every card. Per-domain defaults, user-overridable.

**Status quo:** [Actions Card](https://github.com/nutteloost/actions-card) wraps cards with this. Bubble Card issues [#17](https://github.com/Clooos/Bubble-Card/issues/17) and [#63](https://github.com/Clooos/Bubble-Card/issues/63) are both high-reaction. Quick Control already does the icon layer; this extends to the whole tile.

**What ships:**
- "Gestures" sub-view per device.
- Bindings: tap, double-tap, hold, swipe-up/down/left/right.
- Action picker reuses existing service-call / scene / script chooser.
- Per-domain defaults (light swipe-up = brighter).
- Tiny indicator dots when gestures are bound (quiet, discoverable).

**Effort:** Medium.

**Why it fits:** The card owns its tile renderer. Cleaner here than in HA Core, which has to fight sections-view drag handles. visionOS gestures are already part of the design language.

---

### 26. Room Card — the unfulfilled Mushroom request

**Pitch:** A single tile for an entire room: name + temperature + occupancy header, then conditional chips for active devices (light on, media playing, door open), then a 12-hour mini-graph.

**Status quo:** Mushroom's discussion [#302](https://github.com/piitaya/lovelace-mushroom/discussions/302) has years of demand. Mushroom refused to ship it. The Bento grid is the natural home.

**What ships:**
- New `BentoRoomTile` widget bound to an area.
- Header: room name + temperature + humidity if assigned.
- Active-device chips appear conditionally (lights on, media playing, climate adjusting).
- 12-hour temperature mini-graph at the bottom.
- Tap → opens search filtered to the area.

**Effort:** Medium.

**Why it fits:** Direct competitive wedge against Mushroom. The card already has area-grouping, chip-input, and chart subsystems — this is composition.

---

### 27. Vacuum Room-Map Picker

**Pitch:** Tap rooms on the vacuum's detail view to dispatch it, using HA's native segment-to-area mapping.

**Status quo:** HA 2026.3 shipped `vacuum.clean_area` taking HA area IDs — vendor-neutral. Built-in dashboards still show only a single Start/Stop button. Tasshack's Dreame and vacuum-card both already use it, but as full Lovelace replacements.

**What ships:**
- Detail-view widget listing areas mapped to the vacuum's segments.
- Multi-select with tap, single "Clean selected" button.
- Live status overlay: which room, battery, ETA.
- "Re-clean last selection" shortcut (most common workflow).
- Gracefully disables itself when integration doesn't support `clean_area`.

**Effort:** Small.

**Why it fits:** Vacuums already get a detail view. Drop-in upgrade for supported vacuums, no global changes.

---

### 28. Severe Weather Banner

**Pitch:** A persistent top-of-card banner for active weather alerts with severity color, polygon area, and "mute until expires".

**Status quo:** [Weather Alerts Card](https://community.home-assistant.io/t/weather-alerts-card/1010189), [MeteoalarmCard](https://github.com/MrBartusek/MeteoalarmCard), and [NWS Alerts Card](https://community.home-assistant.io/t/nws-alerts-card/986761) all active. Three independent implementations in six months = strong signal. Not the same as the Notification Center (#3) — alerts need urgency, persistence, and typed severity.

**What ships:**
- Top-of-card banner when an active alert is present.
- Severity color matching MeteoAlarm/NWS conventions (advisory / watch / warning).
- Tap opens a sheet: full text, polygon area, time-in-effect progress bar.
- "Mute until expires" gesture.
- Multi-source: works with `weather.*` entities, MeteoAlarm, NWS, DWD.

**Effort:** Small.

**Why it fits:** Slot at the top of the Bento grid where StatsBar lives. Glass aesthetic suits urgency without screaming.

---

### 29. Live Activities strip

**Pitch:** A horizontal "Live" strip above the grid for any automation, script, timer, or vacuum currently in a non-idle state.

**Status quo:** Apple Wallet boarding-pass Live Activities (iOS 26) is the pattern. HA has no equivalent surface — running automations/timers are invisible unless you happen to look at their detail view.

**What ships:**
- Auto-renders above the grid only when there's something live.
- Each item: rounded glass capsule, icon, single-line state, optional progress bar.
- Tap → detail view. Long-press → stop/cancel.
- Auto-dismiss when entity returns to idle for >2 s.

**Effort:** Small. Read-only over existing state; glass capsule is the same family as the existing toolbar pills.

**Why it fits:** Bento already has the canvas. A glanceable, transient row in the same liquid-glass aesthetic — small footprint, high signal.

---

### 30. Backup Status Widget

**Pitch:** A Bento tile that shows next/last backup, lets you run one or browse the catalog.

**Status quo:** HA's backup integration shipped in 2025.1 with `sensor.backup_manager_state`, `event.backup_automatic_backup`, and `backup.create` / `backup.create_automatic` actions. Cloud agents through 2026. Roughly 94% of installs use it. Almost no cards surface it.

**What ships:**
- Bento tile: countdown to next backup, last success/fail, current state.
- One-tap "Back up now" using `backup.create_automatic`.
- List of backup agents (local, Cloud, S3, Dropbox) with size per location.
- Restore browser (read-only) using the agent file listings.

**Effort:** Small.

**Why it fits:** System-admin concerns are absent from the roadmap. This is the system-entity-shaped widget pattern applied to backups — same shape as Notifications, Tips, Versionsverlauf.

---

### 31. AI Task Panel

**Pitch:** Right-click any camera, image, or sensor → "Ask AI about this". Structured outputs, image generation, browseable history.

**Status quo:** HA 2025.7 added `ai_task.generate_data` for structured AI outputs. HA 2025.10 added `ai_task.generate_image` with media_source storage. Distinct from the Conversation API (#1) — task API is one-shot, structured, and image-capable.

**What ships:**
- Right-click any image/camera/sensor → "Ask AI" sheet.
- Saved prompts per entity with structured-output schemas.
- Generated images browseable via `media_source`, settable as wallpaper, attachable to notifications.
- Default AI Task entity respected from HA's system settings.

**Effort:** Medium.

**Why it fits:** The card already has a wallpaper subsystem and planned camera live-view. AI image generation slots into both without new infra.

---

### 32. Adaptive Lighting Visualizer

**Pitch:** Show the 24-hour color-temperature curve for any light, with a draggable "now" dot for instant override.

**Status quo:** HomeKit Adaptive Lighting is the well-known pattern. HA's `adaptive_lighting` and `circadian_lighting` integrations have devoted users but no card surfaces the curve. Different from Lighting Scene DJ (#16) — that's creative/scene-driven; this is circadian/temporal.

**What ships:**
- For any light with `color_temp_kelvin`: 24-hour curve at the bottom of the detail view.
- Draggable dot = "now" + override.
- Toggle "Follow circadian curve" — wires to `adaptive_lighting` if installed, else writes a generated schedule.
- Reuses the existing Chart.js stack with a horizontal Kelvin gradient as the axis fill.

**Effort:** Medium.

**Why it fits:** The card is already visionOS-glass with warm-to-cool gradients in its surface chrome. The chart literally renders the wallpaper's own tonal axis.

---

### 33. Hash-routed deep-link pop-ups

**Pitch:** Every detail-view, every system entity, every Bento widget gets a URL hash. Deep-linkable, back-button-friendly, scriptable from automations.

**Status quo:** [Bubble Card](https://github.com/Clooos/Bubble-Card)'s pop-ups are URL-hash-addressable (`#kitchen`) — closeable via swipe-down, Esc, long-swipe, or hash removal. That's exactly why Bubble exploded. The card's detail views and system entities are currently only reachable by interactive navigation.

**What ships:**
- Every detail-view URL-addressable: `#device/light.kitchen`, `#calendar/event/abc`, `#settings/appearance`.
- Close gestures honoured (swipe-down, Esc, browser back).
- Card emits hashchange events so HA automations can open or close any view via `script.notify` + `data: { url }`.
- "Copy link to this view" affordance.

**Effort:** Medium.

**Why it fits:** Closes a long-standing UX gap. Combined with #23 + #24, the card becomes natively addressable from the rest of HA.

---

### 34. Strategy Mode — first-run dashboard generator

**Pitch:** A single tap in Settings: "Generate dashboard from my Home Assistant setup". Walks the area/device/label registry and produces a configured Bento + Search layout.

**Status quo:** [Mushroom Strategy](https://github.com/AalianKhan/mushroom-strategy) proved zero-config first-run works using only the registry — no usage heuristics needed. The card's "Configure once" promise is currently asymmetric: HA-side organisation pays off, but the *first* time you install, you still spend an evening tuning Bento slots.

**What ships:**
- Settings → "Generate from my setup".
- Reads floor/area/label registries, picks Bento slot defaults from device counts per area.
- Pre-fills favourite chips per area.
- Reversible: "Reset to defaults" undoes the generated layout without touching HA state.
- Optional: re-run after a major HA change (new area, new label) and merge.

**Effort:** Medium.

**Why it fits:** Closes the "but I just installed it" gap. The roadmap is full of features for established users; this one is the on-ramp.

---

## Quick-priority matrix (all batches)

| Bucket | Ideas | Why |
|---|---|---|
| **Quick wins — small effort, high daily value** | #2 ⌘K · #8 Global search · #13 Daily briefing · #16 Lighting DJ · #20 Birthday hub · #23 Card Picker Suggestion · #27 Vacuum room-map · #28 Severe weather banner · #29 Live Activities strip · #30 Backup widget | Existing infrastructure, clear daily payoff |
| **Medium effort, established patterns** | #1 LLM · #3 Notification Center · #6 Energy cost · #9 Ambient · #11 Sketchpad · #15 Multi-user · #18 Bin widget · #24 ⌘K bridge · #25 Gestures · #26 Room card · #31 AI Task · #32 Adaptive Lighting · #33 Hash routing · #34 Strategy mode | New surfaces but on established patterns |
| **High visibility, large effort** | #4 Camera · #5 Floorplan · #7 Routines · #12 Voice · #19 Time-lapse · #21 Localization (parallel) · #22 Companion (long-term) | Marketing-worthy, require new subsystems or different tracks |

### Recommended starting points (mid-2026)

**Flagship:** **#11 Sketchpad** — still the most differentiated single feature on the list. Viral demo potential, one commit, no new subsystem.

**Easy-win triple, all under a day each:**
- **#23 Card Picker Suggestion Provider** — uses HA 2026.6's new API. Makes the card discoverable from HA's own dashboard editor. Almost nobody has shipped this yet.
- **#27 Vacuum Room-Map Picker** — uses HA 2026.3's `vacuum.clean_area`. Tiny scope, real demand.
- **#28 Severe Weather Banner** — three independent community cards already shipped it. Card has the slot already.

**Spotlight bundle (#2 + #8 + #24):** Combined, this is the search-first card's headline upgrade — global search across everything, ⌘K interop with HA's own palette, the existing infrastructure stretched across both worlds. Half a week of work for a category-defining feature.

**The competitive wedge:** **#26 Room Card** — Mushroom refused to ship this for years, the community has been asking the whole time. Bento is the natural home. This is the move that pulls Mushroom users over.

**The first-impression fix:** **#34 Strategy Mode** — fixes the only honest weakness of the card today (new-user empty-state). Mushroom Strategy proved registry-only generation works. Card has all the data needed.

If only three ship next: **#11 Sketchpad + #23 Card Picker Suggestion + #34 Strategy Mode.** Flagship + discoverability + first-impression — covers acquisition, retention, and signature feature in one quarter.

---

## Out of scope (deliberately)

Ideas that came up but didn't make either batch:

- **Plugin Store as a live product** — too open-ended, no clear MVP.
- **Theme picker** — too small, a dropdown.
- **Backup/Restore settings as JSON** — useful, but a power-user nice-to-have.
- **Recipe browser, Habits tracker** — wrong axis, drifts away from the HA-centred focus.
- **Geofencing status widget** — would be a sub-feature of #7 Routines.
- **Custom groups parallel to areas** — sensible, but niche.
- **AR view (point phone at light, see info)** — neat, but device-specific and brittle on Android.

---

## Notes

- This roadmap is a **proposal**, not a commitment. Selection and order are open.
- Effort estimates are rough: Small < 4 h, Medium 4–16 h, Large > 16 h.
- Structural refactors (see `memory/project_structural_refactor_plan.md`) are a parallel track and don't compete with this roadmap.
- The roadmap covers **32 feature ideas + 2 parallel/long-term tracks** = 34 entries total.
  - **#1–#10** — May 2026's "what was clearly missing then" baseline.
  - **#11–#20** — June 2026's "what users keep asking about post-Quick Control".
  - **#21** — Localization track (parallel, community-paced).
  - **#22** — Companion Integration (long-term, the path to real HA Quality Scale grading — see [QUALITY.md](QUALITY.md)).
  - **#23–#34** — June 2026 competitive + community research pass. Multi-agent dive across r/homeassistant, the HA forum, the top custom-card repos (Mushroom, Bubble, Button-Card, mini-graph-card, mini-media-player, Power Flow Card Plus, Tile), HA Core 2025–2026 release notes, and the Apple Home ecosystem. Each idea links a specific source.
