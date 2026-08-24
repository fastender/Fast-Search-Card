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

### 3. Notification Center — a three-lane attention model *(worked-out design, 2026-07-12)*

**Pitch:** Toasts vanish in 3 s with no trace. Build a real attention surface — but not one big "notifications" bucket. Split everything the home surfaces into **three lanes** by intent, so the card stays a *reader* of Home Assistant instead of turning into a second rules engine.

This is the fully-designed version of the original stub. The design was worked out against a competitor (djdevil's AlertTicker-Card) and stress-tested with 20 scenarios (appendix below). The guiding constraint: **Apple-simple to set up, and no condition/rule authoring in YAML.**

#### The three lanes

| Lane | Answers | Lifecycle | Interaction | Surfaces |
|---|---|---|---|---|
| **Alert** | "what needs my attention?" | stays until acknowledged **or** resolved in HA | snooze / dismiss / acknowledge, has severity + history | Center + badge + (critical) banner |
| **Live Activity** | "what's happening right now?" | self-resolves when the state ends | tap → detail; **no dismiss**, no badge, no history | strip above the grid |
| **Watch** | "tell me when a value crosses a line" | fires on threshold crossing (with hysteresis) | set up once in-card, then behaves as an Alert | Center |

**The lane is decided by the entity's current *state*, not its type.** The same device moves between lanes at lifecycle boundaries: a washing machine *running* is a Live Activity → *finished* is an Alert; a vacuum *cleaning* is a Live Activity → *stuck* is an Alert; a timer *counting down* is a Live Activity → *done* is an Alert. This is the core insight — don't classify by domain, classify by state.

#### Status quo (what exists today)

- `src/providers/dataNotifications.js` (29 lines) — extracts `persistent_notification.*` from `hass.states` only.
- `src/components/NotificationsPanel.jsx` (125 lines) — a StatsBar popover listing them, with `persistent_notification.dismiss`.
- Toasts (`toastNotification.js`) are ephemeral — **not persisted**, lost after 3 s.
- No severity, no history, no badge center, no `alert.*` handling (only an icon for the domain at `iconRegistry.js:756`), no Live Activity strip.

#### Alert lane — three sources, no rules engine

1. **`persistent_notification.*`** — from `hass.states` (today). Dismiss = real `persistent_notification.dismiss`.
2. **`alert.*`** — HA's native alert integration produces `alert.foo` entities (on/off). This is the clean home for condition-based alerts the user (or an HA automation) already defined. Dismiss = *acknowledge* locally; it truly clears only when HA flips it off.
3. **Danger `device_class` whitelist** — a fixed, semantically-unambiguous set the card surfaces **with zero configuration**: `moisture` (leak), `smoke`, `gas`, `carbon_monoxide`, `safety` → Critical; `battery`, `problem` → Warning. No thresholds, no operators — HA defines the semantics; the card just mirrors "on = danger."

The card **never evaluates a condition of its own** on the Alert lane. If a user wants "battery < 20 %" or "humidity > 65 %", that's either an HA `alert:` (→ source 2) or an in-card Watch (below) — never a rule the card invents.

#### Severity model (1–4)

HA carries no native severity, so it's derived per source with sensible defaults + an optional per-item override in settings:

- **1 Critical** — danger device_classes; `alert.*` marked critical. → red, banner, optional sound.
- **2 Warning** — low battery, door/garage open too long, appliance stuck, high CO₂, Watch warnings.
- **3 Info** — appliance finished, package delivered, humidity high, default for a bare `persistent_notification`.
- **4 Low** — firmware updates, minor notices (collapsed/grouped).

Filter chips in the Center: All · Critical · Warning · Info. Sort by severity, then time.

#### Watch lane — in-card threshold, no backend

The friction we're removing: forcing users into `configuration.yaml` breaks the card's whole "configure in-card, no YAML" promise. So numeric thresholds are authored **in the card** and evaluated **client-side** on the `state_changed` stream the DataProvider already subscribes to (event-driven, so it works even in a backgrounded tab as long as the socket lives), stored in IndexedDB, with hysteresis against flapping.

**The one honest limitation:** an in-card Watch only evaluates while a dashboard is open, and can't push to a closed phone. For the card's primary audience — **always-on wall tablets** (the Quick Control / Ambient-mode use case) — "only while open" is effectively "always." Safety-critical items never rely on this: they ride `binary_sensor` states HA maintains 24/7 regardless of any open dashboard.

**Escalation (optional, later):** users who want 24/7 background evaluation + push-when-closed for comfort thresholds get an opt-in "also create as an HA alert / push" path — which is exactly the companion-integration territory of [#22](#22-companion-integration-long-term). Default stays fully in-card.

#### Apple-simple setup (the UX that makes or breaks it)

No blank rule form ever. Five principles: **defaults over decisions · suggestions not forms · reads as a sentence · one tactile control · progressive disclosure.** The entry point is **context-local** — you add a hint on the entity's own detail view ("＋ hint"), never in a central rule editor.

A tiered ladder:
- **Tier 0 — automatic (nothing to set):** danger device_classes and Live Activities. A one-time friendly explainer, then it just works.
- **Tier 1 — tap a suggestion:** per-`device_class` chips with a smart default pre-filled (humidity → "too humid / too dry" at 65 % / 30 %; temperature → "getting cold / hot / frost risk").
- **Tier 2 — nudge the number:** a sentence with one inline value on the existing wheel picker, live value shown as anchor ("*tell me when the bathroom gets more humid than ⟨65 %⟩ · now: 58 %*").
- **Tier 3 — more options (collapsed, pre-defaulted):** severity, quiet hours ("don't disturb at night"), which surface (Center only / also banner), snooze default.

Nobody ever sees the word "condition" or an operator dropdown. An interactive mockup of this across Climate / Temperature / Vacuum / Media / Presence exists (session 2026-07-12).

#### Live Activity lane (shared with #29)

The strip is [#29 Live Activities](#29-live-activities-strip) — this design formally routes "playing / cleaning / counting / running / opening / doorbell-live / irrigating" states there instead of into the Center. One glass-capsule strip component, shared. A Live Activity is **not** something you configure — at most a global "show live activities" toggle.

#### Surfaces (all one data source, different windows)

- **StatsBar badge** (exists) — count of active, unread, non-snoozed.
- **Popover** (exists) — grows to show severity colors + snooze.
- **Notification Center** (new system entity, mirrors News/Todos) — filter + history tab + sidebar item with live badge.
- **Bento widget** (new) — top-3 unread + count.
- **Critical banner** — highest active Critical item only, **not** an auto-cycling ticker (that's AlertTicker's identity, deliberately not ours). Shares the liquid-glass banner layer with [#28 Severe Weather Banner](#28-severe-weather-banner). Tap → opens Center.

#### Persistence

- **Live / authoritative** from `hass.states`, re-derived each load: `persistent_notification.*` + `alert.*` + danger `binary_sensor` states.
- **Persisted** (IndexedDB/localStorage — the card has no backend): toast history + local read/snooze/acknowledge state + Watch definitions. History capped (~100 entries).

#### Explicit boundary (what we deliberately do NOT build)

- **No condition/rules engine** — no Jinja2, no AND/OR multi-entity, no operator matrix, no `device_class` auto-discovery beyond the fixed danger whitelist. That's AlertTicker's core and HA's `alert`/automation territory.
- **No 50-theme / 3D / vinyl-player styling** — we use our own visionOS/liquid-glass language.
- **No card-authored server-side automations** (AlertTicker creates them via REST for TTS/push) — invasive; belongs to #22.
- **No `mobile_app` push history** — fire-and-forget `notify.*` isn't an entity; can't be read without a backend (#22).

#### What splits into its own roadmap slot

The in-card **Watch authoring** (threshold + hysteresis + the suggestion engine) is meaty enough to be its own sub-feature, not smuggled into the Center. Keep #3 = the inbox + lanes + surfaces; make "in-card Watches" its explicit companion so the threshold-authoring decision stays conscious.

#### Open design questions

- **Climate is dual-natured** (actively heating = Live Activity *and* eligible for a "runs too long" hint) — is showing both on one detail view right, or too busy?
- **Presence "welcome home"** — does it belong in the notification hints, or is it really [#17 Welcome home animation](#17-welcome-home-animation)? Lean: security-presence → Alert lane here; greeting → #17.

#### Effort

Medium–large, best shipped in slices: (a) Alert lane = `alert.*` + danger whitelist + severity + persisted history + grown-up Center (medium); (b) Live Activity strip = shared with #29; (c) in-card Watch = its own slot; (d) banner = shared with #28. Toast pipeline, popover, dismiss, and the `state_changed` stream already exist.

**Files (estimate):**
- `src/system-entities/entities/notifications/` (new, mirrors `news/`) — Center view, action buttons, header info via `viewRefs`
- `src/providers/dataNotifications.js` — extended: normalize the 3 sources into one `{ id, source, severity, title, message, created_at, entity_id?, read, snoozed_until?, dismissed }` list
- `src/utils/notificationSources.js` (new) — danger `device_class` whitelist + severity derivation
- `src/utils/watches.js` (new) — in-card Watch store + `state_changed` evaluation + hysteresis
- IndexedDB store schema: toast history + local state + Watch defs
- Shared strip/banner components with #29 / #28; deep-link via [#38](#38-deep-link-addressing-layer-consolidate-the-scattered-seams)

#### Appendix — 20 scenarios (design evidence)

*Alert:* leak under the dishwasher (Critical, auto) · kitchen smoke (Critical, auto) · CO in the boiler room (Critical, auto) · freezer door open 6 min (Warning, one-tap) · garage open since midnight (Warning, one-tap) · door-lock battery 12 % (Warning, one-tap) · washing machine finished (Info, from `alert.*`) · package in the box (Info, auto) · unusual night water use (Warning, one-tap) · updates for 3 devices (Low, auto/grouped).

*Live Activity:* Sonos playing (none) · vacuum cleaning 45 % (none) · egg timer 4:12 (none) · wash cycle 38 min left (none) · shutters closing (none) · doorbell camera live (none) · garden irrigation zone 2 (none).

*Watch:* bathroom humidity > 68 % (Info, wheel) · office CO₂ > 1000 ppm (Warning, wheel) · pool water < 24 °C (Info, wheel).

Distribution: 6× zero-config, 5× one-tap, 3× wheel, rest arrives ready from HA — and 4 are lane-switchers (freezer/vacuum/timer/washer), proving the lane follows state, not device type.

---

### 3b. Escalation track — reaching the person who isn't looking *(added 2026-08-07)*

**Status of the base:** #3 shipped across v1.1.2156–2169 and merged into the Island. In place: the
three lanes, severity 1–4, snooze, history, the danger `device_class` whitelist, the critical banner,
quiet hours (with `allowCritical`), threshold **and** duration watches with hysteresis, the
live-activity strip, and the Island's two filter axes (severity × origin).

**The gap this closes:** everything built so far assumes **somebody is looking at the tablet** —
badge, Island, banner, Center are all visual. A second read of djdevil/AlertTicker-Card surfaced
that its genuinely unexploited contribution isn't a feature but a *category*: mechanisms that reach
a person who is in another room. That is the honest hole in an otherwise complete system.

Ordered by value-per-effort.

#### E1 — Camera frame on the alert *(strongest, surprisingly cheap)*

**Pitch:** motion in the hallway, a doorbell press, a leak in the cellar — the alert shows the
camera image right there instead of describing it.

**Why it's cheap:** HA exposes `attributes.entity_picture` on camera entities **including a signed
access token**. A snapshot is literally an `<img src={hass.hassUrl(entity_picture)}>` — no stream
lifecycle, no WebRTC, no new subsystem. (A live stream is a different, much larger problem; this is
deliberately only the still frame.)

**Camera↔alert matching, Apple-simple:** default to the camera in the **same area** as the
triggering entity; fall back to a manual per-source pick in settings; show nothing if neither
resolves. Never guess across areas.

**Surfaces:** thumbnail in the Center row and in the Island's message panel; larger frame in the
critical banner. Refresh the `src` on open (the token URL is cache-busted by HA itself).

**Effort:** Small–medium. Also the first genuinely useful step into [#4 Camera live-view](#4-camera-live-view-system-entity).

#### E2 — Sound on critical

**Pitch:** on a wall tablet this is the difference between "I saw it" and "I didn't".

**The real obstacle is not the audio, it's autoplay policy.** Browsers block `Audio.play()` until
the page has seen a user gesture, and the block returns after every reload. Design accordingly:

- A **"Test sound"** button in settings that doubles as the unlock (playing on a click is allowed).
- Re-arm on the first tap anywhere after a reload (one-shot listener), so a tablet that reboots
  overnight is armed again as soon as anyone touches it.
- If still blocked, **fail silently and surface it** — a small "sound is blocked, tap once to
  enable" note in the Center. Never let a muted browser create the illusion of an audible alarm.

Scope: critical only, one short built-in sound, per-severity opt-in. No custom URL library (that is
AlertTicker's territory and a maintenance tail).

**Effort:** Small — but budget the autoplay handling, that's where the work is.

#### E3 — Spoken announcement (TTS)

**Correction of an earlier judgement in this document.** The original #3 listed "no card-authored
server-side automations" as a non-goal and lumped TTS in with it. That conflated two things: what
makes AlertTicker invasive is that it *writes automations into HA* so TTS fires when the dashboard
is closed. A direct `tts.speak` / `tts.*_say` **service call while the card is open** is just a
service call — exactly what the card already does constantly. On an always-on display that works.

**What ships:** per-severity opt-in (default off), target `media_player` picked in settings, message
= the notification title + a short reason. Respect quiet hours **and** the manual mute (E6).
Rate-limit hard — never speak twice for the same instance, never more than once per N seconds.

**Explicit limit to document in the info popup:** this only speaks while a dashboard is open. It is
not a replacement for an HA automation, and it is not push. 24/7 delivery stays
[#22 companion integration](#22-companion-integration-long-term) territory.

**Effort:** Small. The discipline (rate limit, quiet hours, mute) is most of it.

#### E4 — Flap guard for the alert lane *(robustness, not a feature)*

The watch lane has hysteresis (`nextFiringState`, plus NaN-holds). The **other three alert sources
do not**: `alert.*`, the danger whitelist and `persistent_notification` re-fire on every transition,
and because ack is instance-bound via `created_at`, a chattering contact produces a fresh unread
entry each time — badge noise, history spam, and (with E2/E3) repeated sound.

Add a **per-id minimum re-fire interval** (AlertTicker uses a 10 s window; 30–60 s is more
appropriate here): within the window a re-fire updates the existing entry instead of creating a new
instance. Keep it in the pure source layer so it stays node-testable like the rest.

**Effort:** Small. Highest correctness value of the six.

#### E5 — Snooze duration menu

Today snooze is a fixed 1 h. "Until this evening" is a different wish from "not right now".
Offer 30 min / 1 h / 4 h / 8 h / tomorrow morning, keeping one-tap 1 h as the default action and the
menu behind a long-press. The store already keys snoozes by id with an expiry — this is UI only.

**Effort:** Small.

#### E6 — Manual mute

Quiet hours are *scheduled*; "quiet for the next two hours" is a different need (guests, a film, a
crying baby). One global switch with a duration, visible while active (the Island's rest button is
the natural indicator), auto-expiring. Must suppress toast, banner, sound and TTS — but **never**
the Center or the badge, so nothing is lost.

**Effort:** Small.

#### E7 — Wall-display scale

`overlay_scale`-style zoom (1× / 1.5× / 2×) for the Island and the banner, so a tablet across the
room stays readable. Likely a CSS variable on the Island root — but check the measured-width logic
(`--island-formhoehe`, the ResizeObserver-driven width) before assuming it just scales.

**Effort:** Small, with a layout-verification tail.

#### Still deliberately not taken from AlertTicker

The rules engine (operators, Jinja2, AND/OR multi-entity), the 50-theme/3D/vinyl styling, the
auto-cycling ticker, and card-authored server-side automations. Two borderline items are parked
rather than rejected: `visible_to` per-user filtering belongs with
[#15 multi-user profiles](#15-multi-user-profiles), and message placeholders (`{name}`, `{state}`)
only make sense if users author their own text — which contradicts the "no forms" principle #3 is
built on.

#### Suggested order

**E4 → E1 → E5/E6 → E2 → E3 → E7.** Correctness first, then the one big visual win, then the cheap
UX gains, then the two that need care (autoplay policy, speech discipline), then polish.

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

**Amendments from studying a mature camera gallery *(added 2026-08-08)*.** Five patterns worth adopting before this is designed, because each one is a decision that is expensive to change later:

- **Three source modes, not one.** Files on disk (written by an automation), HA media sources (Frigate, Reolink, a NAS), or both merged into one timeline. Picking only the media browser looks cleaner and excludes everyone whose snapshots come from a `camera.snapshot` automation — which is most people who built this before an NVR existed.
- **Paired items.** When a still and a clip share a filename stem, render them as **one** entry with the image as the thumbnail. Two rows for the same moment is the default outcome, and it looks broken.
- **Walk the date hierarchy, do not crawl it.** Recordings live in nested date folders. Read the structure and descend only where needed; a blind recursive crawl over months of footage is a hang, not a delay.
- **Never delete files directly — call a service the user defines.** A frontend card has no business touching the filesystem. The right shape is a user-configured `shell_command` or `rest_command` with a templated path, which keeps deletion inside HA's own permission model and out of the card entirely.
- **Controls that fade.** On a live view, controls should be an overlay that recedes after inactivity, with a fixed mode for anyone who wants them permanently. Especially relevant on the wall tablets that are the stated primary target.

Two-way audio via go2rtc backchannel also appears here, and is the same capability the doorbell idea needs.

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

### 9. Ambient mode — a fifth *state* of Bento, not a new view *(worked-out design, 2026-07-12)*

**Pitch:** After X min idle, a wall tablet drifts into a calm, glanceable ambient face — big clock, a few quiet tiles, the one live activity, a notification count — and wakes on touch.

**The core reframe (confirmed by code analysis):** ambient is **not a new subsystem or a parallel view.** It is a **state of the existing Bento start view.** The widgets, the slot layout, the auto-slider rotation, and all the data reuse *as-is*. The only thing we build is the **mechanism that flips Bento into the ambient state and back.** An earlier standalone-mockup pass rebuilt Bento from scratch before this was noticed — this entry supersedes any "separate `AmbientMode.jsx` view" idea.

#### Status quo — what Bento already provides (reuse, do not rebuild)

- `src/components/BentoStartView.jsx` (204 LOC) — the widget composition over the wallpaper. This *is* the ambient canvas.
- `src/components/bento/` — the widget vocabulary: `BentoRichWeather / Todos / News / Calendar / Versions` (`richRouter.jsx`) plus integration-hub, all-schedules, energy.
- **4 configurable slots** (`SLOT_KEYS` w1 large / w2 / w3 / w4 in `bento/constants.js`), user-configurable via `widgetStorage.js`.
- **An auto-slider that already rotates content** (`SLIDER_DOMAIN_ORDER` weather→news→todos→calendar, 10 s autoplay, pause-on-hover, page dots) — effectively an ambient rotation already.
- Per-domain colored skins (`SLIDER_GRADIENTS` — weather blue, todos orange, news red, energy yellow).
- `src/utils/kioskMode.js` — rudimentary hide-UI, to align/extend.
- The **module-level store pattern** (`hassStore` / `isMobileStore` / `langStore`, see `memory/pattern_module_level_stores.md`) — the established idiom for the ambient flag.

#### The mechanism — the only new code (four small parts, zero widget changes)

1. **`src/utils/ambientStore.js` (new)** — a module-level `isAmbient` boolean + `useAmbient()` subscriber, following the established store pattern. Single source of truth that everything gates on.
2. **`src/hooks/useIdleDetection.js` (new)** — resets a timer on `pointerdown / pointermove / keydown` (and HA interaction); after `idleAfterMs` → `setAmbient(true)`; any input → `setAmbient(false)` + reset. Duration from settings (5 / 10 / 30 min / off). **This is the only genuinely new mechanism.** Caveat from dev-mode testing (`memory/project_dev_mode_testing.md`): use event-driven timers, not rAF (rAF freezes in a backgrounded tab); a hidden tab must not falsely trip ambient — on an always-on wall tablet it's foregrounded, so this is a phone edge case.
3. **Gating in `BentoStartView.jsx` (edit)** — when `isAmbient`, the existing tree gets `data-ambient` and:
   - hides the chrome (search row, sidebar, favorites) via the show/hide conditions already present,
   - mounts a **clock overlay**,
   - dims + drifts via CSS,
   - picks day/night from the hour. **No widget is touched.**
4. **Settings toggle (edit)** — "Ambient after 5 / 10 / 30 min / off" + "day/night" + burn-in on/off, via the existing `broadcastSetting` / `useSettingBroadcast` plumbing.

That's the whole feature: **idle trigger → one boolean → a few CSS/composition transforms on the existing Bento + wake.**

#### Day / night

Derived from the local hour by default (optionally bind to an ambient-light or `sun.sun` entity if the user maps one). Night = dimmer, warmer, fewer tiles, clock as hero. Day = brighter, higher contrast, the full tile set.

#### Burn-in protection

A subtle slow drift transform on the whole ambient cluster (CSS keyframe, ~20–30 s) plus overall dimming — LCD/OLED longevity on always-on displays.

#### Optional Phase 2 — the calm glass skin (the one thing that touches widgets)

Today the tiles are **vivid colored** (`SLIDER_GRADIENTS`). To get the Apple-glass calm look (rather than a merely *dimmed* dashboard), the widgets need a skin mode: a `variant="ambient"` / `data-skin` on the `BentoRich*` components that renders them as unified frosted glass instead of blue/orange/yellow. **Not required for v1** — v1 can just dim the existing vivid tiles. This is the only part that edits widget styling, and it **couples cleanly to [#35](#35-liquid-glass--global-surface-system)** (Liquid Glass on more surfaces).

#### Three ambient-native widgets (new, small — the only new render pieces)

Bento has no clock/live-activity/notification widgets because it's a device dashboard. Ambient adds three, each tying to an already-designed feature:
- **Hero clock** (big time + date) — the ambient centerpiece.
- **Live Activity capsule** — shares the strip component from [#29](#29-live-activities-strip) (media playing, vacuum, timer).
- **Notification badge** — shares the badge from [#3](#3-notification-center--a-three-lane-attention-model-worked-out-design-2026-07-12) (count + severity dots, tap → Center).

#### What we deliberately do NOT build

- **No separate ambient view/subsystem** — it's a *state* of Bento, not a parallel component tree. Supersedes the old `AmbientMode.jsx` estimate.
- **No new widget engine** — reuse `BentoRich*` + slots + auto-slider.
- **No new data plumbing** — same DataProvider / hass.
- **No always-on background process** — idle detection is event-driven and lives only while the card is mounted.

#### Open questions

- **v1 skin:** reuse the vivid tiles dimmed (fastest, ships the mechanism alone) vs. ship the glass variant immediately (nicer, more work — Phase 2 up front)?
- **Ambient composition:** keep all 4 configured slots, or reduce to a curated calm set (clock + weather + climate + live-activity + notification)?
- **Day/night source:** hour-only, or bind to an ambient-light / `sun.sun` entity?
- **On wake:** return to the last view, or always to the Bento start?

#### Effort

Small–medium, in slices: **(1)** `ambientStore` + `useIdleDetection` + `data-ambient` gating + clock overlay + dim — the MVP mechanism, small, no widget changes; **(2)** day/night + drift; **(3)** glass skin variant (couples to #35); **(4)** live-activity + notification tiles (couple to #29 / #3).

**Files (estimate):**
- `src/utils/ambientStore.js` (new) — `isAmbient` flag + `useAmbient()`
- `src/hooks/useIdleDetection.js` (new) — idle/wake, settings-driven
- `src/components/BentoStartView.jsx` (edit) — `data-ambient` gating + clock overlay mount
- `src/components/AmbientClock.jsx` (new) — hero clock/date overlay
- `src/components/BentoStartView.css` (edit) — ambient dim / drift / day-night rules
- `src/utils/kioskMode.js` (extend/align)
- Settings tab (edit) — ambient section (interval, day/night, burn-in)
- *Phase 2:* `variant` prop on `bento/widgets/BentoRich*` (glass skin) — couples to #35
- Cross-refs: #3 (notification badge), #29 (live-activity capsule), #35 (glass skin)

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
| **Quick wins — small effort, high daily value** | #2 ⌘K · #8 Global search · #13 Daily briefing · #16 Lighting DJ · #20 Birthday hub · #23 Card Picker Suggestion · #27 Vacuum room-map · #28 Severe weather banner · #29 Live Activities strip · #30 Backup widget · #44 House Timeline · #45 Entity-based device builder · #47 Weather in calendar · #50 Video doctor · #51 Diagnostics | Existing infrastructure, clear daily payoff |
| **Medium effort, established patterns** | #46 Settings search · #49 Screen behaviour · #52 Multi-select · #48 Calendar column view · #1 LLM · #3 Notification Center · #6 Energy cost · #9 Ambient · #11 Sketchpad · #15 Multi-user · #18 Bin widget · #24 ⌘K bridge · #25 Gestures · #26 Room card · #31 AI Task · #32 Adaptive Lighting · #33 Hash routing · #34 Strategy mode | New surfaces but on established patterns |
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

## Part six — 2026-07-11 momentum-driven additions (#35–#43)

A multi-agent pass (versionsverlauf trend analysis v2093→v1987, code-seam scan, GitHub-issue sweep, docs reconciliation) after the Liquid-Glass sprint and Perf-Batch-5. Unlike #1–#34 (feature acquisition), most of these **continue existing momentum or activate mechanisms already half-built in the code** — cheaper and lower-risk than net-new subsystems. Each has a verified hook.

### 35. Liquid Glass → global surface system

**Pitch:** Extend the glass material past the one mobile bottom-sheet it lives on today. Desktop detail panel, `SearchSidebar` popup, `StatsBar`, Bento widget chrome.

**Hook (verified):** v2086 built `useLiquidGlassSettings` *explicitly* "reusable if more surfaces get glass later"; today only `DetailRightSheet.jsx` renders `<Glass>`. The versionsverlauf names this as the literal next step. `LIQUID_GLASS_DEFAULTS.enabled = true` already, so the toggle plumbing is done.

**Effort:** Medium. **Caveat:** every new surface needs the browser-matrix check (see #36) — glass quirks are the #1 historical bug source.

### 36. Playwright-WebKit smoke + visual-regression harness (closes QUALITY Gap 1)

**Pitch:** Turn the ad-hoc WebKit tooling into a committed test suite. Boot the card with a mock hass, open the detail view per domain, screenshot across Chromium+WebKit, assert the known glass regressions ("blur flat during transform", "nested backdrop-filter", "url() filter WebKit-only") don't reappear.

**Hook (verified):** `playwright ^1.61.1` is already in devDependencies (added for the v2091 WebKit refraction verification) but there is **no committed `tests/` dir** — it's thrown away after each use. The dev-mode mock-hass harness (v2082) is the fixture. This is the *only* idea that closes **QUALITY.md Gap 1** (automated tests — the single blocker for Bronze/Silver/Gold-equivalent) **and** the recurring glass-QA pain in one move.

**Effort:** Medium (4–8 h for the first critical-path + visual suite, per QUALITY.md's own estimate). **Highest strategic leverage on the list.**

### 37. Glass-capability probe + central degradation

**Pitch:** One feature-probe utility (`glassCapabilities.js`) the whole codebase reads from, instead of re-discovering browser limits live.

**Hook (verified):** the recurring saga — v2026–2041 (nested blur impossible in Chromium), v2054 (opacity over backdrop-filter), v2057 (`will-change` kills rounded clip), v2064 (blur dies during transform), v2089 (WebKit no `url()` filter). `supportsLiveBend` in `liquidGlassSettings.js` is the seed — generalize it.

**Effort:** Small.

### 38. Deep-link addressing layer (consolidate the scattered seams)

**Pitch:** One `deepLink.js` that owns view addressing, replacing three one-off mechanisms.

**Hook (verified):** `initialTabName`/`onInitialTabConsumed` (v2082, DetailView) has exactly **one caller** and no source that passes a tab; `window.__pendingSettingsTab` (`SearchField.jsx:365`) and the `window.__pendingNewsArticleId` pattern are parallel ad-hoc deep-links. Unifying them is the internal-seam groundwork for #33 (hash routing) — but grounded in code that already exists.

**Effort:** Medium.

### 39. Context-aware auto-tab (activates the dormant #38 seam)

**Pitch:** Open a playing `media_player` → land on Controls; a `sensor` → land on History; a device with an active schedule → hint Schedule.

**Hook (verified):** `initialTabName` is fully wired end-to-end (v2082) but **has no live caller**. This gives it one, for real daily value, at tiny cost.

**Effort:** Small.

### 40. Glass presets (Frosted / Clear / Vibrant)

**Pitch:** Named one-tap presets that set all glass sliders at once.

**Hook (verified):** v2092 shipped bend/sheen/glow/brightness + tint + refraction — 6+ manual controls — and v2093 was already "settings polish" chasing the tuning friction. Presets are the antidote.

**Effort:** Small.

### 41. Video-background seam beyond the detail view

**Pitch:** Reuse the domain-video-loop pipeline (incl. Safari refract) on Bento hero widgets / active-device tiles.

**Hook (verified):** `getEntityVideoUrl` (`utils/videoHelpers.js`) is a complete pipeline consumed at exactly **one** site (`DetailView.jsx`). No Bento/card consumer.

**Effort:** Small to medium.

### 42. Fix `DeviceCard.isEntityActive(device)` always-false bug

**Pitch:** Not a feature — a verified latent bug worth a slot per the "cleanups find real bugs" pattern (SolarCarousel, initialTabName, dev-mode blank).

**Hook (verified):** `DeviceCard.jsx:210` passes the whole `device` object where the util expects `(state, domain, attributes)` → `"[object Object]"` never matches → always false. The other three callers (`SubcategoryBar`, `GroupedDeviceList`, `entityScoring`) call it correctly. The v1704 fix was reverted in v1705 because surrounding code leaned on the buggy result — so this needs the per-domain visual test that block implies.

**Effort:** Small fix, medium verification.

### 43. Generic settings-bus consolidation

**Pitch:** Collapse ~24 per-event `broadcastSetting('xxxChanged')` duplications onto the generic `settingChanged` bus that already exists.

**Hook (verified):** `broadcastSetting('settingChanged', {key,value})` has **one producer** (`system-entities/entities/settings/index.js:85`) and **no dedicated listener** — every consumer subscribes to a specific event name instead. The generic bus is built but verpufft.

**Effort:** Medium (touches many consumers — do incrementally).

### Recommended next three (momentum-aware)

1. **#36 Playwright harness** — closes the single biggest quality gap *and* the recurring glass-QA cost; the tool is already installed. Do this before widening glass (#35).
2. **#35 Liquid Glass global surfaces** — the natural continuation of the last 11 releases; gated behind #36's browser matrix.
3. **#39 auto-tab** (+ **#38** groundwork) — tiny, activates a dead-but-wired mechanism, immediate daily payoff.

Housekeeping surfaced by the GitHub sweep: issue [#10](https://github.com/fastender/Fast-Search-Card/issues/10) (Quick-Toggle) is de-facto delivered in v1907 but never closed; [#8](https://github.com/fastender/Fast-Search-Card/issues/8) is blocked ~3 weeks on the reporter (kiosk-browser brightness detail).

---

## Part seven — 2026-08-08 additions

Nine entries. Two from looking at neighbouring projects, one from a user question that exposed a wrong answer, and two — #47 and #48 — where the data layer or the pattern already exists in the bundle and only the surface is missing.

---

### 44. House Timeline — one chronological view of everything that happened

**Pitch:** A single scrollable list of what your home did today. Every state change worth reading, house-wide, newest first, grouped by day. Not per device — the whole house.

**Status quo:** The card can already tell you what *one* device did. It cannot tell you what *the house* did. To reconstruct an evening you open six detail views and read six History tabs.

The idea comes from [home-status](https://github.com/biggiebytes/home-status) (MIT), which ships a "Timeline" prominently in its screenshots while leaving it almost undocumented in the README. The concept is worth taking; nothing needs to be copied.

**What already exists — this is mostly composition:**

| Piece | Where | What it does today |
|---|---|---|
| Logbook fetch | `src/services/logbookService.js` — `getDeviceLogbookEvents({ hass, entityIds, periodType, periodIndex, customStart, customEnd })` | Calls WS `logbook/get_events`, normalises the result. Already takes an **array** of entity IDs. |
| Merge + sort | `DeviceActivitiesView.jsx:84–108` | Runs sensor-derived events and logbook in parallel, flattens, sorts by timestamp descending |
| Day grouping | `DeviceActivitiesView.jsx:136` | Groups by `timestamp.toDateString()` |
| Period maths | `calculatePeriodDates(periodType, periodIndex)` | D/W/M/Y plus custom ranges, already used by the charts |
| Row rendering | `DeviceActivitiesView.jsx:160` | Distinguishes `source === 'logbook'` from derived sensor events |

Every layer needed already works. What is missing is a caller that passes the *house* instead of one device, plus a place to put it.

**What ships:**
- A new system entity `timeline` (mirrors `notifications` in shape) with its own view and sidebar entry.
- Reuses the existing period header — D/W/M/Y and custom range — so it behaves like the charts people already know.
- Filters along two axes: by area, and by domain. Same chip pattern the search toolbar uses.
- Rows are tappable and open the entity's detail view, exactly like the notification Live rows do.
- Optional Bento widget: the last five events, for the small W3/W4 slots.

**The one real design question — scope of the fetch.**

`logbook/get_events` accepts `entity_ids`, and today the card passes one device's entities. Passing several hundred is the naive extension and will be slow. Two better routes:

- **Omit `entity_ids` entirely.** Home Assistant then returns everything for the period, and the card filters client-side using the machinery it already has — excluded patterns, the visibility flags, `is_system`. One request, filtering logic already written and tested.
- **Fetch per visible area** on demand, so opening the timeline for one room costs one small request.

Route one is almost certainly right for a first version; route two is the optimisation if a large install proves it necessary. Decide with a measurement, not upfront.

**What to watch out for:**
- The logbook is noisy by default. Without filtering, a house of three hundred entities produces an unreadable wall. The excluded-pattern list is the natural filter and is already user-tuned — use it rather than inventing a second one.
- Long periods on a large install can return a lot. Cap the rendered rows and load more on scroll; the card already virtualises lists with `virtua`.
- This is read-only. No acknowledging, no dismissing — that is the Notification Center's job, and the two should not blur into each other.

**Effort:** Small to medium. The data layer is done; this is a view, a filter bar and a system-entity registration.

**Why it fits:** The card already holds every piece and uses none of them at house scale. It also answers a question no other surface in the card answers — "what happened while I was out?" — without competing with the Notification Center, which answers "what needs me now?".

---

---

### 45. Device builder should accept entities, not only devices

**Pitch:** The Universal device builder can only be pointed at an HA *device*. Anything that exists as a bare entity — template sensors, REST sensors, helpers, most YAML-era integrations — cannot be built into a device view at all, however useful the data is.

**Where it came from:** A forum user rebuilding a decade-old YAML instance asked whether the card could show continuous glucose data. The answer given was "yes, use the device builder" — and that turned out to be wrong for his likely setup. The official Dexcom integration registers a device and works; Nightscout via a REST or template sensor does not appear in the picker at all. The overpromise was corrected publicly, and this entry is the fix.

**The affected group is larger than it looks.** Every template sensor, every `command_line` sensor, every helper, every integration that predates the device registry. In other words: precisely the users migrating from hand-written YAML, who are also the ones most likely to want a composed view over sensors that HA does not group for them.

**Verified root cause — one line:**

`useDeviceList` in `src/system-entities/entities/integration/components/setup-flows/UniversalSetup/hooks.js:112` builds the picker from `Object.entries(hass.devices)`. Entities without a `device_id` are never candidates. `useDeviceEntities` (`:196`) then filters `hass.entities` by `e.device_id === selectedDeviceId`.

**The precedent already exists in the same folder.** `WeatherDeviceEntity` is entity-based, not device-based — it stores `entity_id` and resolves everything from there. The plumbing around it already tolerates both shapes:

- `src/system-entities/entities/integration/index.js:105-118` reads `deviceData.ha_device_id` **or** `deviceData.entity_id` when resolving the area, with an explicit comment: *"Fallback: entity_registry (Weather)"*.
- The config format therefore already carries both variants; nothing new has to be invented at the storage layer.

**Touch points, all small:**

| # | File | What changes |
|---|---|---|
| 1 | `UniversalSetup/hooks.js:112` (`useDeviceList`) | Add a second source: entities with no `device_id`. Group by domain or by area instead of by integration. |
| 2 | `UniversalSetup/hooks.js:196` (`useDeviceEntities`) | When the selection is entity-based, return the chosen entities directly instead of filtering by `device_id`. Keep the existing `!disabled_by && !hidden_by` guard — it is already correct. |
| 3 | Stored config | Write an entity list rather than `ha_device_id`. Follow the Weather shape. |
| 4 | `UniversalDeviceEntity.js:169-181` (`onMount`) | The metadata block reads `hass.devices[haDeviceId]` for name, manufacturer, model and area. Needs an entity branch — area from the entity registry, name from the user, no manufacturer/model. |
| 5 | `UniversalDeviceView.jsx:137`, `UniversalEntityList.jsx:136` | Both read `ha_device_id`; both need the alternative path. |

**What does not need to change:** hero, charts, quick-stats, icon and visible-entities all operate on entity IDs once the list exists. Steps two onward are already entity-based — that is why this is a picker problem, not an architecture problem.

**The one design question:** how to group device-less entities in the picker, since there is no integration name to group under. Area is the obvious first choice — it matches how the rest of the card thinks — with domain as the fallback for entities that have neither. A search field over the list matters more here than the grouping does, because this list can be long.

**Also worth doing while in there:** allow mixing. A composed view of "the three sensors I care about" spanning several devices is arguably the more common wish than "one device-less sensor", and the machinery after step one already supports an arbitrary entity list.

**Effort:** Small to medium. Five touch points, an existing precedent, no new storage format.

**Why it fits:** The card's pitch is that it reads your Home Assistant and builds itself. Requiring a device registry entry is exactly the kind of hidden precondition that pitch promises to remove — and it fails hardest for the users who have the messiest, most hand-built setups, who are the ones the pitch is aimed at.


---

### 46. Search your own settings

**Pitch:** A search field at the top of Settings. Type `week`, `glass`, `defaultRange` — matching controls surface immediately, wherever they live. Plus a "Changed only" filter that hides everything still at its default.

**Why this one first.** The card is search-first for the whole house and offers no search over its own configuration. That gap cost real credibility this month: a forum user asked for a calendar default-view setting that already existed, buried in Calendar → Settings → Display. The honest reply was "that's my fault, not yours" — this is the fix for the underlying cause rather than for that one setting.

**Status quo:** Configuration is spread across **20 surfaces** — 14 components under `src/components/tabs/SettingsTab/` plus 6 system-entity settings views. Each holds its labels inline. Nothing indexes them, so nothing can find them.

**What we already have, and it is more than expected:**

| Search dimension | Where it already exists |
|---|---|
| Explanatory sentence per setting | **128 bilingual keys** under `ui.settings.settingsInfo.*` in `de.js` / `en.js` — already written, already maintained |
| Key paths | Documented per section in `docs/info-popups/info-popups-catalog.md` |
| Fuzzy matching | Fuse.js already in the bundle, already tuned for the entity search |
| Option values | The picker lists inside each settings component |

The corpus is written. That is the unusual part — normally a feature like this starts by writing 128 descriptions.

**What ships:**
- A search field in the Settings header, in the card's existing search styling.
- Matching across four dimensions: the setting's **label**, its **info text**, its **option values**, and its **key path** — so a key copied out of the catalog leads straight to its control.
- Behaviour while typing: filter down to matches, **drop sections that have nothing left**, and **auto-expand what survives**. A match must never hide behind a collapsed heading — that failure mode is the whole reason the feature exists.
- A **"Changed only"** toggle: show exactly what this install has altered. Normalise before comparing, so `"3"` stored as a string counts as untouched when `3` is the default. Invaluable in bug reports — "show me what you changed" is the first question every time.

**The actual work is an index, not a search box.** Settings labels live inline in 20 components today. Search needs a registry: for each setting, its label key, its `settingsInfo` key, its option values, and where it lives. Building that registry is the bulk of the effort — and it pays off twice, because it becomes the single source of truth that `info-popups-catalog.md` currently tracks by hand.

**Do not** try to auto-derive the index by parsing the components. Declare it explicitly next to the components, and add a guard script in the pre-commit hook that fails when a settings key exists without a registry entry — the same shape as `check-i18n-keys.py`.

**Effort:** Medium. The search itself is an afternoon; the registry is the rest.

**Why it fits:** It is the card's own thesis applied to itself. It also quietly fixes a whole class of "missing feature" reports that are really "buried feature" reports.

---

### 47. Weather inside the calendar

**Pitch:** A condition icon and temperature in each day header, and an hourly forecast beside timed events. "Football at 16:00" reads differently with rain next to it.

**Status quo:** The calendar shows events. The weather lives in its own widget and its own system entity. Neither knows about the other, even though the one question people actually ask of a calendar — should I move this outdoors — needs both.

**Both data paths already exist and are proven twice:**

| Piece | Where |
|---|---|
| Hourly forecast fetch | `WeatherDeviceView.jsx:98` — `weather.get_forecasts` with `type: 'hourly'` |
| Hourly with module-level cache | `BentoRichWeather.jsx:91-92` — the caching pattern that survives widget remounts |
| Daily forecast | Same service, `type: 'daily'` |

Nothing new has to be wired to Home Assistant.

**What ships:**
- **Day header:** condition icon plus the day's high, from the **daily** forecast.
- **Event row:** temperature and icon beside timed events, from the **hourly** forecast.
- **The fallback that makes it work:** hourly forecasts typically reach about two days ahead, daily forecasts six or more. Beyond the hourly horizon, fall back to that day's daily forecast rather than showing nothing. All-day events use daily regardless — an all-day event has no hour to look up.
- A setting with four states rather than a boolean: **off / day headers only / event rows only / both**. Different users want different densities, and a single toggle forces the wrong choice on half of them.
- Reuse the module-level cache pattern from `BentoRichWeather` — the calendar remounts often, and one forecast fetch per remount would be wasteful and visible.

**Watch out for:** which weather entity. The card may know several. Default to the one the weather widget already uses rather than asking again, and let it be overridden in Calendar → Settings.

**Effort:** Small to medium. Data layer done, cache pattern done; this is placement, the fallback rule, and one setting.

**Why it fits:** The calendar is one of the card's strongest apps and currently answers only half of what a calendar is asked. Both halves are already in the bundle.

---

### 48. Column view for the calendar — and a degradation ladder worth generalising

**Pitch:** A week that reads across the card instead of down it: one column per day, side by side. Plus the narrowing behaviour underneath it, which is the more valuable half.

**Status quo:** `rangeForView(mode, anchor, weekStartsOn)` at `CalendarView.jsx:99` handles `day`, `week`, `month`, `year`. The week view stacks days vertically. There is no side-by-side layout, and no graceful behaviour when a view runs out of width — it just gets cramped.

**What ships — the view:**
- A fifth mode: days as columns, one per day, count following the chosen range.
- **Empty days stay visible in this mode**, inverting the list behaviour. Hiding them would slide the columns out of alignment with their date headings and break the week-at-a-glance reading. The default follows from the layout rather than being global — worth stating in the settings text, because it looks like an inconsistency until explained.

**What ships — the ladder, which matters more:**

A width cascade with three stages instead of one break:

1. **Minimum readable width per column** (around 140 px). While every day fits, render columns.
2. **Below that, drop trailing days one at a time** rather than abandoning the layout. Five columns become four, then three. The layout survives longer than the day count does.
3. **At the floor, one explicit choice:** fall back to the list, or hold the minimum column count and let them narrow past the comfortable width. Both are defensible; the point is that it is a decision rather than an accident.

**Why the ladder is the real prize.** The card's most-reported open issue is the fixed-height layout cutting off on wall tablets — point 8 of the forum feedback, acknowledged and still open. That problem needs exactly this kind of thinking: not a breakpoint where the layout flips, but a staged retreat that keeps the composition intact as long as possible and then degrades on purpose.

Building the ladder here, on a contained surface with an obvious right answer, produces the pattern. Applying it to the Bento grid afterwards is then a port rather than an invention.

**Effort:** Medium for the view. The ladder is the interesting part and worth its own careful pass.

**Why it fits:** A calendar view the card lacks, on top of a responsive pattern the card needs elsewhere and does not yet have anywhere.


---

### 49. Screen behaviour — the settings surface for ambient mode

**Pitch:** A Screen section in Settings that governs what the display does when nobody is looking: dim after a while, drop into the ambient screen, come back on movement, follow the room's light level.

**Relationship to #9.** Entry #9 describes the ambient *view* — what is on screen while the card rests. This entry is the *control panel* for it, plus the dimming and wake behaviour around it. They can ship in either order; the settings are useless without a view, but the view is unusable without them.

**The model to follow** is what dedicated wall panels already offer, because people arriving from those devices expect it:

| Setting | Shape |
|---|---|
| Auto brightness | Toggle |
| Dim screen after | Off / a few choices |
| Ambient screen after | Off / a few choices |
| Wake on movement | Toggle |

**Use minutes, not seconds.** Panel firmware offers 5/10/30 seconds because those devices are intercoms answered in passing. A wall dashboard that dims after ten seconds is broken. Sensible choices are somewhere around 1, 5, 15 and 30 minutes, plus Off.

---

**The honest split — and this is the part that matters.**

Some of this the card can do in the browser. Some of it it fundamentally cannot, and pretending otherwise produces a feature that looks right and saves nothing.

**What the card can do alone:**

- **Dim after N.** The mechanism already exists: `--background-brightness` is a CSS variable, set from `appearance.backgroundBrightness` in `src/index.jsx:110-115`, and already feeds the glass backdrop filter (`DetailView.css:31`). Dimming is a value change on a variable that is already wired end to end.
- **Ambient screen after N.** That is #9.
- **Wake on interaction.** Pointer, touch, key. Trivial, and needed regardless.
- **Wake on movement — with a caveat.** The browser cannot see the room. It *can* watch an HA motion `binary_sensor` and treat a state change as a wake signal. So the setting is not "wake on movement" but "wake when this sensor triggers", with a picker. Which is arguably better, because the sensor can be anywhere useful — the hallway leading to the panel, not just the panel itself.
- **Auto brightness — same shape.** No usable ambient-light API exists in browsers. Bind it to an illuminance sensor instead and map lux onto the brightness variable. **Apply hysteresis**, or the display will pulse every time a cloud passes. The card already has a hysteresis pattern for this in `src/utils/watchStore.js:65-69`.

**What the card cannot do alone:**

- **Actually turning the display off.** A black overlay in a browser is still a lit backlight showing black. It saves no power, prevents no burn-in on an LCD, and looks identical to a real screen-off only in a photograph. Do not ship it as "turn screen off".
- **Real device brightness.** Same reason — CSS dims the page, not the panel.

**The delegation target.** [Fully Kiosk Browser's integration](https://www.home-assistant.io/integrations/fully_kiosk/) is in Home Assistant core and exposes exactly the missing half:

- A **`light` entity** that does screen on/off *and* brightness in one — which is the right abstraction and worth mirroring in the settings language.
- **Switch entities** for Fully's own screensaver, maintenance mode and kiosk lock.
- A **camera with motion detection** (only active when motion detection is enabled inside Fully), which is one candidate source for the wake sensor above.
- Battery, charging and wifi sensors.

So the real Screen section is two-layered: what the card does to itself, and an optional handoff to whatever controls the panel. The handoff is just a service call to an entity the user picks — no integration-specific code, which means it also works with Wallpanel, an Android tablet exposing brightness some other way, or nothing at all.

---

**One conflict to resolve deliberately.** Fully already has its own screensaver, switchable from HA. Two screensavers fighting over the same display is a worse outcome than either alone. The settings should make the choice explicit rather than letting both run: *card ambient screen* or *hand off to the device*, not both. If the device path is chosen, the card's own idle timer should drive the handoff and then stop worrying about it.

**What ships:**
- A **Screen** section under Settings → Appearance, structured as above.
- Timers for dim and for ambient, independently settable, Off included.
- Wake on interaction always on; wake on sensor optional with an entity picker.
- Optional auto-brightness bound to an illuminance sensor, with hysteresis and a floor so it never dims to unreadable.
- An optional **screen handoff**: pick a `light` or `switch` entity that represents the panel's display, and let the card turn it off on the ambient timer instead of drawing black.
- Info popups for the section — several of these need the browser-versus-device distinction explained, and the ⓘ is the right place for it.

**Effort:** Small for the card-side timers and dimming, since the brightness variable and settings plumbing exist. Medium once the handoff, the sensor pickers and the hysteresis are included.

**Why it fits:** Wall tablets are stated to be the primary target going forward, and this is the single most-expected settings group on that class of device. It is also the honest version of a feature that is easy to fake badly.


---

### 50. Video-background doctor — stop the silent no-show

**Pitch:** A button in the video settings that reads the folder, lists what it found, and says which files the card will actually use and which it will ignore and why.

**Status quo — this is the card's most reliable source of confusion.** Background videos resolve by filename through a six-step hierarchy in `src/utils/videoHelpers.js`. A single typo produces nothing: no error, no hint, no video. The current documentation ends with "only exactly-named files are found — a typo in the name = no video", which is accurate and useless, because the user cannot see what the card sees.

**The idea worth taking** is the auto-detect button: instead of teaching a naming convention and hoping, look at the actual files and report. Guessing from real data beats documenting a syntax.

**What already exists — this is mostly UI over a working function:**

- `browseMediaFolder` in `src/services/mediaSourceService.js`, already imported and used by `videoHelpers.js:13,295`. The card can already list a media folder.
- The full resolution hierarchy, including the weather bypass, the `device_class` layers and the `default_1…10` pool, is implemented and documented.
- `videoDefaultsCache:<basePath>` already caches folder discovery for 24 hours per path.

**What ships:**
- A **"Check folder"** action in Settings → Appearance → Video Backgrounds.
- Output in three groups:
  - **Will be used** — filename, and which of the six steps it satisfies, and for which domain or state.
  - **Ignored** — filename plus the reason. "`light-on.mp4` — hyphen instead of underscore." "`Light_On.mp4` — the card lowercases states." "`climate_heating.mp4` — `heating` normalises to `on`, so name it `climate_on.mp4`."
  - **Missing but expected** — domains present in this install with no matching file. That turns the panel from a validator into a shopping list.
- A **plain-language "did you mean"** for near misses. Levenshtein distance of one or two against the expected set catches nearly every real mistake.
- Optional: for the domains found, show which states this install actually produces, so nobody makes a `vacuum_returning.mp4` that will never match.

**Also fix the cache trap while in there.** Default discovery caches per folder for 24 hours. Changing the folder invalidates correctly, because the path is in the key — but **adding files to the same folder does not**. Today the user waits a day or clears storage. The check action should clear that cache as a side effect, which is both obvious and the reason people will press it twice.

**Effort:** Small. Folder listing exists, the rules exist; this is a report and a diff.

**Why it fits:** It converts the card's least discoverable feature into its most self-explanatory one, and it removes a support question rather than answering it.

---

### 51. Diagnostics panel

**Pitch:** A screen in Settings → About that shows what state this install is actually in — versions, what is reachable, what was measured, which settings deviate from default — and a copy button.

**Status quo:** Diagnostics exist but only for developers. `window.__fsc_perf.dump()` prints a timing table to the console (`src/utils/perfMarks.js:106`). Asking a user to open dev tools is asking most users to stop.

**What ships:**
- Card version and build, Home Assistant version, browser and platform.
- **Capability probe:** does this browser do live refraction, WebGL, `:has()`? That single block would have answered the Echo Show question in the forum immediately, and it turns every unknown device into a self-reporting one.
- **Counts:** entities loaded, entities filtered out and by which rule, system entities registered.
- **Boot timings** from the existing perf marks, rendered as a small table rather than console output.
- **Non-default settings**, which is where this meets #46: the "Changed only" filter and this panel want exactly the same data.
- **Copy to clipboard**, formatted as markdown so it can be pasted into a forum post or an issue without reformatting.

**Redact by default.** The panel must not leak entity names, area names or anything identifying. Counts and capabilities, not contents. If a specific entity id is genuinely needed for a diagnosis, ask for it separately rather than shipping it in every paste.

**Effort:** Small to medium. Most values are already computed somewhere; this is collection and presentation.

**Why it fits:** Support currently depends on the user's ability to describe what they see. This replaces description with evidence — and it pairs with the security posture, because a diagnostics dump that shows counts rather than contents is itself a demonstration of the privacy claim.

---

### 52. Multi-select and bulk actions as a card-wide primitive

**Pitch:** Long-press a row to enter selection mode, tap to add more, act on all of them at once. One implementation, used by every list in the card.

**Status quo:** The card has none. Verified: no `selectedIds`, no `multiSelect`, no selection mode anywhere in `src/`. Every list is single-tap only, so anything repetitive is repeated.

**Where it would immediately pay off:**

| Surface | Bulk action |
|---|---|
| Notification Center | Acknowledge or snooze several at once — the most obvious gap, since alerts arrive in groups |
| Todos | Complete or move several items |
| Excluded patterns | Remove several patterns |
| Sidebar items, Bento slots | Reorder or clear several |
| Search results | Add several devices to favourites in one pass |

**What ships:**
- A shared hook and a shared action bar, not five implementations. Long-press enters selection mode; the bar appears with the actions the host list declares.
- **Escape hatches that matter on touch:** a visible Cancel, tapping outside exits, and the count is always shown. Selection modes that are hard to leave feel like traps.
- **Destructive actions confirm**, and confirmation names the count rather than saying "these items".
- The hosting list declares which actions it offers. The primitive owns selection state and presentation; it knows nothing about what the actions do.

**One thing to be careful about.** The card already binds long-press to hold-to-confirm in Quick Control (~1 s, amber ring, `QuickControlIcon.jsx:19`). Two different long-press meanings on nearby surfaces is a real collision. Selection mode belongs on list *rows*, never on the device icon — and the entry should stay that way even if it later feels convenient to blur it.

**Effort:** Medium. The primitive is a day; the value comes from adopting it in three or four places, which is the rest of the effort.

**Why it fits:** It is missing everywhere rather than in one place, which usually means it is a primitive rather than a feature.


## Notes

- This roadmap is a **proposal**, not a commitment. Selection and order are open.
- Effort estimates are rough: Small < 4 h, Medium 4–16 h, Large > 16 h.
- Structural refactors (see `memory/project_structural_refactor_plan.md`) are a parallel track and don't compete with this roadmap.
- The roadmap covers **50 feature ideas + 2 parallel/long-term tracks** = 52 entries total.
  - **#1–#10** — May 2026's "what was clearly missing then" baseline.
  - **#11–#20** — June 2026's "what users keep asking about post-Quick Control".
  - **#21** — Localization track (parallel, community-paced).
  - **#22** — Companion Integration (long-term, the path to real HA Quality Scale grading — see [QUALITY.md](QUALITY.md)).
  - **#23–#34** — competitive + community research pass. Multi-agent dive across r/homeassistant, the HA forum, the top custom-card repos (Mushroom, Bubble, Button-Card, mini-graph-card, mini-media-player, Power Flow Card Plus, Tile), HA Core 2025–2026 release notes and the Apple Home ecosystem. Each idea links a specific source.
  - **#35–#43** — July 2026 momentum-driven pass (post-Liquid-Glass, post-Batch-5). Mostly continuations of active work or activations of half-wired code seams, not net-new subsystems. Each has a code-verified hook.
  - **#44–#45** — August 2026. #44 prompted by [home-status](https://github.com/biggiebytes/home-status) (MIT), which arrived independently at the same "surface only what matters" thesis — concept borrowed, nothing copied. #45 came out of answering a forum question incorrectly and checking the code afterwards. #46-#48 came from reading Calendar Card Pro's feature docs — ideas only, nothing taken from its code. #49 is the settings surface for #9, modelled on what dedicated wall panels already offer. #50-#52 came from studying a mature camera-gallery card — ideas only.
