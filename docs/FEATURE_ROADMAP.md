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

## Quick-priority matrix (both batches)

| Bucket | Ideas | Why |
|---|---|---|
| **High Impact, Low Effort** | #2 ⌘K · #8 Global search · #13 Daily briefing · #16 Lighting DJ · #20 Birthday hub | Existing infrastructure, clear daily payoff |
| **High Impact, Medium Effort** | #1 LLM · #3 Notification Center · #6 Energy cost · #9 Ambient · #11 Sketchpad · #15 Multi-user · #18 Bin widget | New surfaces but with established patterns |
| **High visibility, Large effort** | #4 Camera · #5 Floorplan · #7 Routines · #12 Voice · #19 Time-lapse | Marketing-worthy, but require new subsystems |

### Recommended starting points (mid-2026)

- **#11 Sketchpad** as a flagship feature drop. Differentiates the card. One commit, no new subsystem, viral demo potential.
- **#2 + #8 as "Spotlight"** — small effort, biggest daily payoff. Infrastructure all there.
- **#13 Daily Briefing** as a one-evening win. Pure composition of what's already on screen.

If only one ships next: **#11 Sketchpad**. It's the only idea here that no other HA card touches.

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
- The two batches together = 20 ideas. The original ten represent "what was clearly missing in May 2026". The new ten reflect "what users keep asking about, and where Quick Control changed what's possible".
