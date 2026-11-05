# Feature Roadmap

**Created:** 2026-05-22 · **Revised:** 2026-11-02
**Basis:** Versionsverlauf v1.0.0 → v1.1.2468 (Part eleven and the 2026-09-24 status pass read the code at v1.1.2468) · 16 session notes · code inspection
**Status:** Proposal, not a commitment. Order and selection are open.

Concrete feature proposals tied to open threads in the session notes, unused HA APIs, and gaps in the existing architecture. Every idea has a real hook somewhere in the current code.

---

## Original ten — status check

The first ten proposals from May 2026 — status refreshed 2026-09-24: four shipped (#3, #8, #9, #10), one superseded (#2), one dropped (#6), one retired (#7), two re-scoped (#4, #5), one open (#1):

| # | Idea | Status |
|---|---|---|
| 1 | LLM conversation | **shipped** v1.1.2481 — through Home Assistant's AI task (`ai_task.generate_data`), not the conversation agent: the card sends only the entities it shows and executes every action itself (D1 resolved: build) |
| 2 | Spotlight / Cmd+K | **superseded** (2026-09-24) — the search field is the palette: scenes, scripts and automations have long been tiles (`subcategoryMap.js:35–37`), contents since v2439 via #8, settings via #46; state words are #70 |
| 3 | Notification Center system entity | **shipped** — v1.1.2156–2169 (three lanes, center, banner, watches, quiet hours), tests v2199; human sources #58/#28 and the timeline tab #44 built on it in Sept 2026 |
| 4 | Camera live-view system entity | **re-scoped** 2026-09-24 (see entry) — still-image slices first; the full system view is open decision D8 |
| 5 | Floorplan / map view | **re-scoped** 2026-09-24 — registry core (floors, labels) is #79; the drawing surface is out of scope |
| 6 | Energy cost tracking | **dropped** 2026-09-24 — Energy Dashboard polished v1862–1865, cost layer not built (user decision: no cost layer; the Energy Dashboard question itself is open decision D3) |
| 7 | Routines / modes engine | **retired** 2026-09-24 — see "Out of scope" |
| 8 | Global search across system entities | **shipped** — v1.1.2439 |
| 9 | Standby / ambient mode | **shipped** — screensaver core v1.1.2369, #61–#64 (v1.1.2390–2393), auto brightness v1.1.2445 |
| 10 | Calendar: multi-day events + custom RRULE | **shipped** — v1.1.1580/1582 (May 2026: `calendar/utils/rrule.js`, spanning bars) |

What got built instead between May and June: **Quick Control** (issue #10), **custom wallpapers + gallery**, **visibility filters**, **Bento list view**, **weather + device_class video backgrounds**, **iOS-style schedule picker rebuild**, and a stack of cross-browser fixes. None of these were on the original roadmap. The roadmap survives — it just got out-prioritised by community-driven work.

---

## Part one — original ten, restated

### 1. Real LLM conversation (replace the mock)

> ✅ **Shipped v1.1.2481** (2026-10-20) — built on `ai_task.generate_data` (HA 2025.8+) instead of `conversation.process`: the conversation agent sees every entity exposed to Assist and cannot be narrowed by the card, while the user's rule was "only what the card shows". `utils/kiKontext.js` sends the card's own device list (exclusion patterns, visibility filters, rooms, limit — filtered twice, at most 500 devices / ~60 000 characters, controllable ones first); the AI answers with text plus suggested actions as JSON; `utils/kiAktionen.js` checks every action against that list and a service allow-list (values out of range are refused, not clamped) and the card calls the service itself. Locks, alarm panels, garage/gate/door covers, scripts and buttons need a tap, and so does a scene or group that contains one of them. Enter in the search field switches into AI mode; the second Enter sends. Settings: General → AI mode (switch + AI task picker). Agent picker, tool-call rendering and `conversation_id` follow-ups from the plan below were not built; follow-ups use the last six chat turns instead.

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

### 2. *(retired 2026-09-24 — see "Out of scope")*

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
- **Bento widget** (new) — top-3 unread + count. *(2026-09-24: replaced on purpose by the Island, v1.1.2289 — not to be built.)*
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
- **Presence "welcome home"** — does it belong in the notification hints, or is it really #17 Welcome home animation (retired 2026-09-24, see "Out of scope")? Lean: security-presence → Alert lane here; greeting → #17.

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

> ✅ **Shipped v1.1.2378** (2026-09-03) — Web Audio double ping on a new CRITICAL instance, opt-in toggle + test row under Notifications → Critical alerts, quiet hours respected, 1.5 s debounce.

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

*(2026-11-02: still open. The plain-text path knows only the legacy `tts.<platform>_say` services (`utils/musicAssistant.js:674–700`, call `:710`). Slice 0 is #130 S1–S2: Music Assistant's `play_announcement` with `message` and `tts_entity_id` first (Home Assistant 2026.10), then `tts.speak`, which Home Assistant sends as an announcement, then `_say`. E3 reuses that ladder.)*

#### E4 — Flap guard for the alert lane *(robustness, not a feature)*

> ✅ **Shipped v1.1.2469** (2026-09-26) — `utils/flatterSchutz.js` in the merger: a re-fire of the same id with the same severity within 45 s (30 s for CRITICAL) keeps the old `created_at`, so it stays one instance — no new unread row, no second history line, the acknowledgement holds, no toast. A severity change or a longer gap is a new instance as before. Double ping and wake for CRITICAL are deliberately not suppressed. No timer, no setting.

The watch lane has hysteresis (`nextFiringState`, plus NaN-holds). The **other four alert sources
do not**: `alert.*`, the danger whitelist, severe weather (`weatherAlertSources.js:113–121`) and `persistent_notification` re-fire on every transition,
and because ack is instance-bound via `created_at`, a chattering contact produces a fresh unread
entry each time — badge noise, history spam, and (with E2/E3) repeated sound.

*(2026-09-24: `persistent_notification` has no edges — its `notification_id` is stable — so the guard covers three sources.)*

Add a **per-id minimum re-fire interval** (AlertTicker uses a 10 s window; 30–60 s is more
appropriate here): within the window a re-fire updates the existing entry instead of creating a new
instance. Keep it in the pure source layer so it stays node-testable like the rest.

**Effort:** Small. Highest correctness value of the six.

#### E5 — Snooze duration menu

> ✅ **Shipped v1.1.2378** (2026-09-03) — glass menu at the center's clock button: 15 min · 1 h · until tomorrow 7 am · until the warning expires (when known). Island keeps the one-tap default.

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
#15 multi-user profiles (retired 2026-09-24, see "Out of scope"), and message placeholders (`{name}`, `{state}`)
only make sense if users author their own text — which contradicts the "no forms" principle #3 is
built on.

#### Suggested order

**E4 → E1 → E5/E6 → E2 → E3 → E7.** Correctness first, then the one big visual win, then the cheap
UX gains, then the two that need care (autoplay policy, speech discipline), then polish.

---

### 4. Camera live-view system entity

> ⤳ **Re-scoped 2026-09-24** — the grid with 5-s snapshot polling and the MJPEG/HLS detail stream below conflict with the heat rule (v2152 froze rotating camera images). New order: #3b E1 (still image on the alert) → a camera domain config (still-image ring, native WebRTC only behind a visibility gate) → the doorbell shows the door on the locked page → only then a view. No poller, no hls.js. Whether the full system view is pursued at all is open decision D8.

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

> ⤳ **Re-scoped 2026-09-24** — retired as drawn (image upload, drag editor, coordinates, floors: Large with no groundwork, against the calm Zen start page, and `picture-elements` does it). The registry core — floors and labels the card already holds — is #79. See "Out of scope".

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

> ✖ **Dropped 2026-09-24** — user decision: no cost layer on the Energy Dashboard. The dashboard itself (polished v1862–1865) stays as it is and is not extended; whether it stays in the bundle at all is open decision D3.

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

### 7. *(retired 2026-09-24 — see "Out of scope")*

---

### 8. Global search across system entities

> ✅ **Shipped v1.1.2439** (2026-09-18) — the one search field also finds contents: to-dos, calendar events, news articles, tips and version-history entries. Every system entity may implement `suchbareEintraege(lang)` (synchronous, from memory or cache, no fetch, at most 500 entries); `utils/inhaltsSuche.js` builds one Fuse index lazily at the first term of two characters and rebuilds it only when a source reports a change. Hits appear under the devices as a "Contents" group with one sub-header per source, rendered as virtual device tiles (keyboard, focus ring and virtualisation come for free), and a tap opens the source view on the entry. Deviations from the sketch: no separate ⌘F/sidebar entry — it is the existing search field; no "Actions" header (actions were already searchable as devices); contents are hidden only when the user narrowed the search to Sensors or Actions.

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

> ✅ **Shipped** (marker set 2026-09-24) — the pragmatic core shipped as "Screensaver" in v1.1.2369 (after configurable idle the card tidies up and returns to the *locked Zen start page*, which is the ambient face), the remainder as **#61–#64** (v1.1.2390–2393: deep rest, wake sources, display handoff, photo frame) and auto brightness (v1.1.2445). The purpose of the design below is met by the locked Zen page; Phase 2 (glass skin on widgets) is retired.

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

Today the tiles are **vivid colored** (`SLIDER_GRADIENTS`). To get the Apple-glass calm look (rather than a merely *dimmed* dashboard), the widgets need a skin mode: a `variant="ambient"` / `data-skin` on the `BentoRich*` components that renders them as unified frosted glass instead of blue/orange/yellow. **Not required for v1** — v1 can just dim the existing vivid tiles. This is the only part that edits widget styling, and it **couples cleanly to #35** (Liquid Glass on more surfaces; retired 2026-09-24, see "Out of scope").

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

> ✅ **Shipped v1.1.1580/1582** (May 2026) — RRULE editor (`calendar/utils/rrule.js`) and multi-day spanning bars. BYSETPOS stays out on purpose. Marker added in the 2026-09-24 status pass.

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

### 13. *(dropped 2026-09-16 — see "Out of scope")*

---

### 14. *(retired 2026-09-24 — see "Out of scope")*

---

### 15. *(retired 2026-09-24 — see "Out of scope")*

---

### 16. *(retired 2026-09-24 — see "Out of scope")*

---

### 17. *(retired 2026-09-24 — see "Out of scope")*

---

### 18. *(retired 2026-09-24 — see "Out of scope")*

---

### 19. *(retired 2026-09-24 — see "Out of scope")*

---

### 20. *(retired 2026-09-24 — see "Out of scope")*

---

## Part three — parallel track: localization

### 21. Localization expansion

> ⏸ **Dormant** (2026-09-24) — v1.1.1381 deleted eight language files ("only DE+EN"). A runtime-loading path is built only when a community PR exists; "start with Dutch" below is the May 2026 view.

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
  - Sensor-roll / time-lapse storage (#19, retired 2026-09-24)
  - Multi-user profile persistence (#15, retired 2026-09-24)
- Submitted for Core inclusion once Bronze-level coverage is in place.
- Long-form documentation, including the migration path from "card-only" to "card + integration".

**Effort:** Large. Python integration from scratch with full test coverage + Core submission process = weeks of work, not days. Not even on the medium-term radar — this is a 2027 conversation, after Tests (Gap 1 in QUALITY.md) and a handful of the Part-Two ideas have shipped.

**Why it's a long-term track:** It's a different codebase, different language, different release cadence, different review process. Slotting it as a regular roadmap entry would distort priorities. Listed here so the path to "real HA Quality Scale Gold" is visible and intentional — not because it should ship next.

**Files (estimate, eventual):**
- Separate Python repo: `home-assistant/core` pull request after the integration matures, or a `fastender/fast-search-card-integration` HACS-distributed repo first.
- `custom_components/fast_search_card/` (new — eventual Core path)
- New WS API endpoints documented in card-side `src/utils/companionApi.js`

**Requirements input from the household-task ecosystem *(added 2026-09-04)*.** Three mature HA task integrations were read end to end. Each one is an integration precisely because the features people ask for need per-task persistence — which makes them free requirements analysis for this entry.

**What a backend has to hold** before any of it works: per-task assignee, priority, sub-tasks, tags, reminder times, completion history with timestamps, streak state per period, rotation position, and recurrence rules the provider does not support. Note that none of this is exotic — it is all *per-task metadata*, which is exactly the shape HA's `todo` platform does not carry and the reason every one of these projects had to build a backend.

**Two design contracts worth copying rather than rediscovering:**

- **Shared assignment and rotation are opposites, not variants.** A task assigned to several people is *one shared task* — everyone sees it, the first completion completes it for all. Rotation is the inverse: exactly one owner at a time, handed to the next after each completion. Modelling both as "assignees: []" and hoping produces a system that is wrong in one of the two cases, and it is expensive to unpick later.
- **Separate missing from skipping.** For anything streak-shaped, a *missed* period should break the streak and increment a "missed" count, while a *deliberate skip* freezes the streak instead. Collapsing the two turns a tool into a punishment machine, and the distinction costs one extra state.

**A scope warning, and it points the other way.** All three of these integrations emit standard `todo.*` **and** `calendar.*` entities. A household running one of them already sees its lists in the card's to-dos app and its recurring tasks in the card's calendar. The card is their display, not their competitor.

So this integration should **not** grow a chore system. That ground is well covered by people who have been at it longer. Its scope stays what only it can do: sketchpad sync, notification history beyond the browser cache, cross-device favourites and profiles, sensor-roll storage. Rendering someone else's household layer well is the better use of the same effort — see #65, which does exactly that with no backend at all.

**Requirements input from Music Assistant *(added 2026-10-25, corrected 2026-11-02)*.** Home Assistant's six Music Assistant actions (`play_media`, `play_announcement`, `transfer_queue`, `search`, `get_library`, `get_queue`) cover search, the library with sort and filter, playback, announcements, and the current and next queue item. What they do not carry needs the authenticated Music Assistant client that only runs on the server.

- **Synchronised lyrics.** Music Assistant holds plain and time-stamped (LRC) lyrics for many tracks. An action that returns both for the current track would let the detail view show the line being sung, scrolling with the position the card already interpolates. Shown only when time stamps exist; plain text is no reading aid on a wall.
- **Recommendations — the part that needs the server.** Rows from the user's own library (recently played, recently added, most played, least played, favourites) are card-side through `get_library` ordering (#134). What stays here: Music Assistant's curated recommendation folders, similar tracks seeded from the listening history, rows mixed across media types by time (the action returns no play dates), and history per person, because Music Assistant keeps one play log for the house. A server cache would let these open instantly.
- **The full queue.** The list with paging, removing, moving and playing from an index. `get_queue` returns only the current and the next item and a count.
- **Favourites both ways.** Unfavourite, favourite any item and not only the one playing, and "is favourite" for items outside the library.
- **Numbers in lists.** Play counts, last-played dates and durations in library and search results. The sort keys exist; the values are not returned.
- **Playback options.** Don't-stop-the-music, crossfade, smart shuffle, playback speed, start from the beginning for podcasts, and audiobook resume points.
- **People.** The Music Assistant user list with each user's services, so a shared tablet could offer people instead of typed names.
- **Fast start.** Cached full track objects, so a tap does not wait for a rate-limited streaming lookup, and a long list appended in the background once the first track plays.
- **A house-wide "music is playing" entity** that follows Music Assistant's own player events.

**The contract for all of them:** the token stays on the server, the card only calls an action with `return_response`. Nothing about this widens the card's outbound list.

---

## Part five — twelve new ideas from competitive + community research

Synthesised from a research pass across r/homeassistant, the HA community forum, the top custom-card repos (Mushroom, Bubble, Button-Card, mini-graph-card, mini-media-player, Power Flow Card Plus, Tile), HA Core 2025–2026 release notes, and the Apple Home ecosystem. Each idea references a concrete source; none overlap with #1–#22.

### 23. *(retired 2026-09-24 — see "Out of scope")*

---

### 24. *(retired 2026-09-24 — see "Out of scope")*

---

### 25. *(retired 2026-09-24 — see "Out of scope")*

---

### 26. Room Card — the unfulfilled Mushroom request

> ⤳ **Re-scoped 2026-09-24** — retired as a tile (the room head with temperature, humidity, active count and tap-to-filter has been in the result list since v2051/2055/2079; a mini graph on the start page would be a long-runner in rest; four slots). The honest remainder — the context tab using `device_id`, `area_id` and `search/related` instead of name guessing — is #83. See "Out of scope".

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

> ✅ **Shipped v1.1.1954/1956** — `vacuum.js:57–66` CLEAN_AREA gate, `VacuumAreaPicker.jsx`; fixes v1.1.2403/2427. Marker added in the 2026-09-24 status pass. Open: "re-clean last selection" (`VacuumAreaPicker.jsx:25` keeps the selection only locally, `:78` clears it) — Small.

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

> ✅ **Shipped v1.1.2376** (2026-09-03) — as the sixth source of the alert lane per the concretization below: entity picker in the notification settings, level → severity map (DWD/Meteoalarm/NWS/generic), red banner inherited from #3, "mute until expires" = snooze until the warning's end. Not built: the polygon-area sheet and time-in-effect progress bar (the lanes' own row + snooze cover the need).

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

*Concretization 2026-09-03 (after #58):* build it as the **sixth source of the alert lane**, not as a
separate banner. The user picks the warning entities (DWD Warnwetter / Meteoalarm / NWS sensors,
`islandSources`-style picker); a level → severity map (red/extreme → CRITICAL, orange/severe →
WARNING, yellow/moderate → INFO) feeds `buildNotificationList`. Then the red `CriticalBanner`
(v2159, split off precisely for this) shows a red warning by itself, the island chips/center/quiet
hours/snooze come for free, and "mute until expires" is simply snooze with the warning's end time.
Effort stays small; the only new UI is the picker row.

---

### 29. Live Activities strip

> ✅ **Shipped v1.1.2161** (strip above the Bento grid: timer/vacuum/cover/media/script/automation, hold-then-prune, tap → device), **v1.1.2164** (per-source settings incl. opt-in light/switch/climate), **v1.1.2205** (the "Live" tab of the Notification Center shares the source). Marker added in the 2026-09-04 status pass. Open from the sketch: long-press stop/cancel, non-Bento placement.
>
> *(2026-09-24: the strip above the Bento grid was deleted in v1.1.2171 — the Island is the surface, so "non-Bento placement" is moot. Stop/cancel on the live capsule would reverse v2204/v2205 ("live rows have no action buttons") and is open decision D6, not a leftover.)*

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

> ⤳ **Re-scoped 2026-09-24** — no tile (admin topic, four slots). Instead a seventh alert-lane source: backup failed/overdue only, not `update.*` (INFO counts into the Island's ℹ button, `islandState.js:18–24`; `update.*` is a default exclusion).

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

### 32. *(retired 2026-09-24 — see "Out of scope")*

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

**Why it fits:** Closes a long-standing UX gap. Combined with #23 + #24 (both retired 2026-09-24), the card becomes natively addressable from the rest of HA.

---

### 34. Strategy Mode — first-run dashboard generator

> ⤳ **Re-scoped 2026-09-24** — the empty state this entry targets no longer exists (Zen start since v1.1.2225, four default slots). Remainder: defaults chosen from what exists (only with a real first-run marker) and empty states that name their precondition.

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

> ⚠ **Out of date since 2026-09-24** — the quick wins listed here are shipped, #23/#24 are retired, #34 is re-scoped, #2/#24 superseded; the recommendations below are the mid-2026 view and are kept as history. For the current picture see Part eleven; the recommended next slices are #3b E4 → #69 B → #69 A → #72 S1 → #3b E1 (first slice: still image on the alert).

| Bucket | Ideas | Why |
|---|---|---|
| **Quick wins — small effort, high daily value** | #2 ⌘K · #8 Global search · #16 Lighting DJ · #20 Birthday hub · #23 Card Picker Suggestion · #27 Vacuum room-map · #28 Severe weather banner · #29 Live Activities strip · #30 Backup widget · #44 House Timeline · #45 Entity-based device builder · #47 Weather in calendar · #50 Video doctor · #51 Diagnostics · #53 Calendar groups · #65 Todos search + person · #66 Dictate a task · #67 Overdue collapse · #68 Stale-build banner | Existing infrastructure, clear daily payoff |
| **Medium effort, established patterns** | #46 Settings search · #49 Screen behaviour · #52 Multi-select · #54 Event rules · #55 Person lanes · #48 Calendar column view · #1 LLM · #3 Notification Center · #6 Energy cost · #9 Ambient · #11 Sketchpad · #15 Multi-user · #18 Bin widget · #24 ⌘K bridge · #25 Gestures · #26 Room card · #31 AI Task · #32 Adaptive Lighting · #33 Hash routing · #34 Strategy mode | New surfaces but on established patterns |
| **High visibility, large effort** | #4 Camera · #5 Floorplan · #7 Routines · #12 Voice · #19 Time-lapse · #21 Localization (parallel) · #22 Companion (long-term) | Marketing-worthy, require new subsystems or different tracks |

### Recommended starting points (mid-2026)

> ⚠ **Out of date since 2026-09-24** — #11 is still open, but #23 is retired, #26 re-scoped (→ #83), #34 is re-scoped and the #2+#8+#24 bundle is superseded (#8 shipped, #2/#24 retired). See Part eleven; the recommended next slices are #3b E4 → #69 B → #69 A → #72 S1 → #3b E1 (first slice: still image on the alert).

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
- **#13 Daily briefing widget** *(dropped 2026-09-16, was "Part two")* — a morning surface with greeting, weather, first event and an energy anomaly. The Zen start page overtook it: clock and date, the status line with current weather and power, the greeting, and the rotating context line of #57, plus #58b evening-before all-day reminders, the #28 severe-weather banner and the #44 chronicle. What was left — a second forecast line and an overnight summary — did not justify a surface of its own. The number stays retired; later ideas keep counting from #68.
- **#2 Spotlight / Command Palette** *(retired 2026-09-24, was "Part one")* — a second search layer for "do thing". The one search field became that layer: scenes, scripts and automations have long been tiles (`subcategoryMap.js:35–37`), contents through #8 since v2439, the card's own settings through #46. No ⌘K/Ctrl-K shortcut exists in the code (the only key combination is Alt+A for the AI mode, `searchEventHandlers.js:222`) and the target is touch. What is left — state words ("licht an", "was ist offen") — is #70; settings as a sixth content source is the #46 remainder.
- **#5 Floorplan / map view** *(retired as drawn, re-scoped)* — image upload, drag editor, coordinates, floors: Large with not one line of groundwork, against the calm Zen start page, and `picture-elements` does it. The registry core — floors and labels the card already holds — is #79.
- **#7 Routines / modes engine** *(retired)* — a second rule editor next to Home Assistant; the card stays a reader (#3, #54). A "script fields as a form" remainder was checked and rejected: the fields live in `hass.services`, not in attributes, and rendering HA's selector zoo is a form framework.
- **#14 Plant care widget** *(retired)* — never built; the recurring chore is a to-do with #67's rhythm, the plant with photo and moisture sensor is a builder device (#45). `plant.*` is a legacy domain; the common HACS variant ships `sensor.*`. A one-hour cosmetic fix in the fallback only on request.
- **#15 Multi-user profiles** *(retired)* — a shared wall tablet has one screen for everyone; the family is modelled through person lanes and person lists without switching. "Who is home" is #71.
- **#16 Lighting Scene DJ** *(retired)* — no hook for colour extraction or drop; "save as scene" needs `scene.create` (volatile) or the config write path the card refuses.
- **#17 Welcome home animation** *(retired)* — wake sources (#62), greeting and context line (#57) are the welcome. The one leftover — the name of the person arriving in the greeting — is a slice of #71.
- **#18 Bin / waste schedule widget** *(retired)* — #58b announces tomorrow's all-day events the evening before, #54 shows them as a day chip; a tile would sit under the Zen curtain, invisible in rest. The context-line sentence "Morgen: Restmüll" is #72 S3.
- **#19 Time-lapse camera roll** *(retired)* — ffmpeg.wasm against single-file delivery, a capture loop against "zero long-runners in rest", writing files is a server part (#22).
- **#20 Birthday + anniversary hub** *(retired)* — a second data store next to the calendar. The 🎂 rule, the yearly RRULE and #58b cover the core; the countdown "In 3 Tagen: Oma" is #72 S2.
- **#23 Card Picker Suggestion Provider** *(retired)* — the card is configuration-free (`build.sh:366` returns `{type}` only); HA's documentation asks for `null` when a card does not fit the entity, so any suggestion would be noise. Reconsider only if #33 ever adds an `entity` config key.
- **#24 Quick Search Bridge** *(retired)* — no public API to feed HA's palette; `show-dialog` without `dialogImport` fails until the Quick Bar was opened once in the session (on a wall tablet: never); the trigger event is gated to admins and the keyboard.
- **#25 Per-card gesture mapper** *(retired)* — the gesture budget is spent: 1-s hold (`QuickControlIcon.jsx:20`), 500-ms long-press (`useMehrfachauswahl.js:10`), swipe for carousel and back.
- **#26 Room Card** *(retired as a tile, re-scoped)* — the room head with temperature, humidity, active count and tap-to-filter has been in the result list since v2051/2055/2079; a mini graph on the start page would be a long-runner in rest; there are four slots. The honest remainder — the context tab using `device_id`, `area_id` and `search/related` instead of name guessing — is #83.
- **#32 Adaptive Lighting Visualizer** *(retired)* — niche (`*adaptive_lighting*` is excluded by default), writing a schedule is a server part, the light ring is untouchable.
- **#35 Liquid Glass → global surface system** *(retired)* — regardless of the keep/remove decision on the library, nested blur roots violate the heat and glass rules (audit B24).
- **#37 Glass-capability probe** *(retired)* — two independent probes; a capability line in About belongs to the glass decision, not to a module.
- **#39 Context-aware auto-tab** *(retired)* — the media_player case is a no-op (Controls is always tab 0), the schedule case needs a WebSocket scan per open, and sensor → History changes the ring first-look. At most an opt-in "open sensors on History" (1.5 h; `DetailViewWrapper.jsx:394` `initialTab ?? rule`).
- **#41 Video-background seam beyond the detail view** *(retired)* — video loops on tiles are constant load; the ocean widget (revealed only) and the photo frame hold the role.
- **#43 Generic settings-bus consolidation** *(retired)* — the premise is gone: the generic `settingChanged` sender was removed in v2428; `broadcastSetting` + `createSettingsStorage` + the B49 sweep are the pattern. Seven raw `dispatchEvent` calls remain as audit refactor.
- **#40 Glass presets** *(void since v1.1.2503)* — Liquid Glass was removed.

---

## Part six — 2026-07-11 momentum-driven additions (#35–#43)

A multi-agent pass (versionsverlauf trend analysis v2093→v1987, code-seam scan, GitHub-issue sweep, docs reconciliation) after the Liquid-Glass sprint and Perf-Batch-5. Unlike #1–#34 (feature acquisition), most of these **continue existing momentum or activate mechanisms already half-built in the code** — cheaper and lower-risk than net-new subsystems. Each has a verified hook.

### 35. *(retired 2026-09-24 — see "Out of scope")*

### 36. Playwright-WebKit smoke + visual-regression harness (closes QUALITY Gap 1)

> ◐ **Partial — v1.1.2191 onward**: a committed Playwright harness exists (`tests/harness/card.js` mock-hass mount + 107 tests in 13 spec files covering every visible surface, ~8 min; `tests/` committed since v2191, last change v2317; `playwright.config.js:9–11` fixes "Chromium only" on purpose) and WebKit is installable locally for one-off checks. Not built: the cross-engine visual-regression assertions for the glass regressions named below. Marker added in the 2026-09-04 status pass.

**Pitch:** Turn the ad-hoc WebKit tooling into a committed test suite. Boot the card with a mock hass, open the detail view per domain, screenshot across Chromium+WebKit, assert the known glass regressions ("blur flat during transform", "nested backdrop-filter", "url() filter WebKit-only") don't reappear.

**Hook (verified):** `playwright ^1.61.1` is already in devDependencies (added for the v2091 WebKit refraction verification) but there is **no committed `tests/` dir** — it's thrown away after each use *(2026-09-24: no longer true — `tests/` is committed since v2191; bringing the suite up to v2468 is open decision D4)*. The dev-mode mock-hass harness (v2082) is the fixture. This is the *only* idea that closes **QUALITY.md Gap 1** (automated tests — the single blocker for Bronze/Silver/Gold-equivalent) **and** the recurring glass-QA pain in one move.

**Effort:** Medium (4–8 h for the first critical-path + visual suite, per QUALITY.md's own estimate). **Highest strategic leverage on the list.**

### 37. *(retired 2026-09-24 — see "Out of scope")*

### 38. Deep-link addressing layer (consolidate the scattered seams)

**Pitch:** One `deepLink.js` that owns view addressing, replacing three one-off mechanisms.

**Hook (verified):** `initialTabName`/`onInitialTabConsumed` (v2082, DetailView) has exactly **one caller** and no source that passes a tab; `window.__pendingSettingsTab` (`SearchField.jsx:365`) and the `window.__pendingNewsArticleId` pattern are parallel ad-hoc deep-links. Unifying them is the internal-seam groundwork for #33 (hash routing) — but grounded in code that already exists.

*(2026-09-24: today `SearchField.jsx:386`; seven `window.__pending*` families with ten setters; the expiring pattern exists twice (`sucheStore.js:22`, VersionsverlaufView 15 s). Refactor backlog, not roadmap.)*

**Effort:** Medium.

### 39. *(retired 2026-09-24 — see "Out of scope")*

### 40. Glass presets (Frosted / Clear / Vibrant)

> ⏹ **Void since v1.1.2503** — Liquid Glass was removed (D2 resolved).

**Pitch:** Named one-tap presets that set all glass sliders at once.

**Hook (verified):** v2092 shipped bend/sheen/glow/brightness + tint + refraction — 6+ manual controls — and v2093 was already "settings polish" chasing the tuning friction. Presets are the antidote.

**Effort:** Small.

### 41. *(retired 2026-09-24 — see "Out of scope")*

### 42. Fix `DeviceCard.isEntityActive(device)` always-false bug

> ⚠️ **Corrected in v1.1.2442** (2026-09-18): the v1.1.2440 fix opened the fallback for every domain and missed the card's own tiles — system views and integration devices report `state: 'active'`, which the helper counts as on, so they all turned active (blank white tiles in Custom, dark text on the Bento). Now only vacuum, alarm panel, timer and valve ask the helper; everything else stays as before 1.1.2440.
>
> ✅ **Shipped v1.1.2440** (2026-09-18) — resolved domain by domain. The fallback now passes `(state, domain, attributes)`. Measured over 43 domain/state cases: the raw fix changed eleven; six are kept on purpose (vacuum cleaning and returning, alarm panel armed and triggered, timer active, valve open — the device is doing something, like a light that is on), five are held at the old result by explicit branches with a reason each (lock unlocked — the icon treats *locked* as on; vacuum docked; automation and script "triggered in the last five minutes"; person at home). All other 32 cases keep class and actual background colour.
>
> ⏸ **Deliberately kept** *(history — resolved 2026-09-18, see above)* (decision recorded in the 2026-06-25 cleanup audit, reaffirmed 2026-09-04): the surrounding card styling leans on the always-false result, and the v1704 fix had to be reverted in v1705. It stays on the list as "small fix, medium per-domain visual verification" — not forgotten, just not free.
>
> ◐ **Open remainder (2026-09-24)** — the room-head counter (`GroupedDeviceList.jsx:353–355`), the category bar (`SubcategoryBar.jsx:19`) and the Island roll (`subcategoryMap.js:73`) call `isEntityActive` unfiltered: a docked vacuum counts as "Reinigung aktiv" (`helpers.js:222`), and system views report `active`.

**Pitch:** Not a feature — a verified latent bug worth a slot per the "cleanups find real bugs" pattern (SolarCarousel, initialTabName, dev-mode blank).

**Hook (verified):** `DeviceCard.jsx:210` passes the whole `device` object where the util expects `(state, domain, attributes)` → `"[object Object]"` never matches → always false. The other three callers (`SubcategoryBar`, `GroupedDeviceList`, `entityScoring`) call it correctly. The v1704 fix was reverted in v1705 because surrounding code leaned on the buggy result — so this needs the per-domain visual test that block implies.

**Effort:** Small fix, medium verification.

### 43. *(retired 2026-09-24 — see "Out of scope")*

### Recommended next three (momentum-aware)

> ⚠ **Out of date since 2026-09-24** — #35 is retired and #40 is void since v1.1.2503 (D2 resolved: removed); #36 is open decision D4 (tests only on explicit request). Kept as the July 2026 view.

1. **#36 Playwright harness** — closes the single biggest quality gap *and* the recurring glass-QA cost; the tool is already installed. Do this before widening glass (#35).
2. **#35 Liquid Glass global surfaces** — the natural continuation of the last 11 releases; gated behind #36's browser matrix.
3. **#39 auto-tab** (+ **#38** groundwork) — tiny, activates a dead-but-wired mechanism, immediate daily payoff.

Housekeeping surfaced by the GitHub sweep: issue [#10](https://github.com/fastender/Fast-Search-Card/issues/10) (Quick-Toggle) is de-facto delivered in v1907 but never closed; [#8](https://github.com/fastender/Fast-Search-Card/issues/8) is blocked ~3 weeks on the reporter (kiosk-browser brightness detail).

---

## Part seven — 2026-08-08 additions

Twelve entries. Two from looking at neighbouring projects, one from a user question that exposed a wrong answer, and two — #47 and #48 — where the data layer or the pattern already exists in the bundle and only the surface is missing.

---

### 44. House Timeline — one chronological view of everything that happened

> **Revised 2026-09-04 — it is the Notification Center's "Verlauf" tab, not a second entity.** The center already answers three tenses: *Übersicht* = what needs me, *Live* = what is running, *Verlauf* = what was — and "Verlauf" showed only the alert history. The timeline is that tab grown to house scale: chips **Alle · Meldungen · Haus**, the charts' period header (D/W/M/Y + free span), day groups, tappable rows. No new system entity, sidebar entry or header: the tab dispatch, the row style and the entity seam exist. What stays deliberately separate: the timeline is read-only — dismiss/snooze live in Übersicht only.
>
> ✅ **Stage 1 shipped v1.1.2382, stage 2 shipped v1.1.2383** (2026-09-04): house logbook without `entity_ids` in one request, filtered through the user's exclusion list + a handful of system domains, merged with the alert history, day headings, 150-row cap with "Mehr laden"; then domain-family and room chips built from the data, flap folding ("Bewegung Flur · 5× zwischen 01:12 und 01:25"), "durch wen" from the logbook context, header count = chronicle. **Bento tile shipped v1.1.2384:** "Zuletzt im Haus" as the rich W2 variant of the Mitteilungen entity, fed by the state stream (seeded once from the logbook, no polling), plus the last house event as a context line on the locked page. #44 is complete.

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

**What ships** *(placement revised 2026-09-04, see note above)*:
- The Notification Center's **Verlauf** tab becomes the timeline: chips Alle · Meldungen · Haus, day headings, newest first.
- Reuses the existing period header — D/W/M/Y and custom range — so it behaves like the charts people already know.
- Filters along two axes: by area, and by domain. Same chip pattern the search toolbar uses. *(stage 2)*
- Rows are tappable and open the entity's detail view, exactly like the notification Live rows do.
- Optional Bento widget: the last five events, for the small W3/W4 slots. *(stage 2)*

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

> ✅ **Shipped v1.1.2446** (2026-09-19) — step 1 of the Universal builder keeps the device list and gains one row above it, "Compose from entities": a searchable multi-select over every entity in `hass.states` (so YAML entities without a registry entry are included), grouped by area with domain as the fallback, at most 30 entities from any number of devices. Mixing is allowed. The device stores `entity_ids` instead of `ha_device_id`; `device-entities/universalEintraege.js` resolves entities, area and HA device for both shapes, and every former reader of `ha_device_id` goes through it. Area of a composed device: entities without one abstain, the most common area wins. Existing device-based devices render identically (fingerprint before/after). Fixed on the way: charts chosen while adding were lost, the automatic hero was stored as a bare string, and editing through "Manage devices" appended a copy. The forum story below stays as the reason.

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

> ✅ **Phase 1 shipped v1.1.2419** (2026-09-14) — a search field at the top of all four settings tabs (General, Appearance, Filter, About) with a result list across tabs; a tap switches tab, opens the sub-page, scrolls the row into view and marks it. Matching covers label + subtitle, the section's info text, option values and keys (dictionary keys and storage paths). The index is an explicit register (`SettingsTab/register/`, 174 entries) guarded by `scripts/check-einstellungs-register.mjs` in pre-commit and `build.sh`, as proposed below. Deviations from the sketch: results replace the tab content instead of filtering sections in place — the settings are a stack of sub-pages, not collapsible sections, so "auto-expand" becomes "jump and mark"; rows hidden behind a switch mark that switch instead. **Phase 2 shipped v1.1.2420:** the settings of Calendar, To-dos and News are in the register (52 entries in files next to their components). A jump opens the system view with its settings page and marks the row; item editors (single groups, rules, people, lists, templates) are reached through their section. The guard checks all four places. **Phase 3 shipped v1.1.2426:** a "Changed" button next to the search field lists every setting whose effective value differs from its default (with a search term: the matching ones), across the settings tabs and the Calendar, To-do and News settings. Values are compared after the same normalization the settings pages use, so "60" stored as text is the default 60 and whole-object saves that include defaults are not reported. Defaults live in `SettingsTab/suche/vorgaben.js` (81 paths) and in the defaults objects of the three view stores; the register guard checks that all 115 storage paths have one. **Open (corrected 2026-09-24):** Tips, Version history and All Schedules have placeholder settings pages only (`TippsView.jsx:226–243` renders `t('settingsWillBe')`, `VersionsverlaufView.jsx:259–276`, `AllSchedulesView.jsx:508–517`) — nothing to register; the Energy Dashboard stays outside by user decision. The real remainder: the settings register as the sixth source of the main search (`inhaltsSuche.js:26`; `settings/index.js` has no `suchbareEintraege`; `sucheStore.js:45–49` fires no `fsc-open-entity` for the settings place and `SettingsTab.jsx:82–86` picks the tab only by subscription after mount), and the per-feature off switches below (open decision D12).

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

**A companion idea, cheaper than search and worth doing alongside it *(added 2026-09-04)*:** **per-feature off switches.** Several HA integrations in this space ship a toggle list — priorities, sub-tasks, assignment, tags, mirror entities — so an install that wants a plain list gets a plain list. The card's settings grow every release, and search makes a large surface navigable without making it smaller. Letting a household switch off the parts it does not use makes it *actually* smaller, and it interacts well with the settings registry this entry needs anyway: a feature that is off can be excluded from the index rather than surfacing results that lead nowhere.

---

### 47. Weather inside the calendar
> ✅ **Shipped v1.1.2443** (2026-09-18) — condition icon and the day's high in month cells, week heads, day columns and the day strip; hourly value beside timed events with the daily fallback beyond the hourly horizon; four-level setting plus weather-entity choice under Calendar → Settings → Display; one forecast fetch per entity every 10 min while the calendar is open (`utils/wetterVorhersage.js`).


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

> ✅ **Shipped v1.1.2386 → v1.1.2388** (2026-09-04). The ladder first (v1.1.2386, on the person lanes of #55): measured per-lane width → full / compact / stacked, the stacked rung as the explicit floor choice (chip row + one lane). Then the view (v1.1.2387): **"Woche" itself became the column view** — no fifth mode; seven day columns with empty days kept visible, day-specific thresholds (120/66 px), trailing days dropped 7 → 5 → 3 around the selected day, and the previous week presentation (cells + bars + list) as the floor. v1.1.2388 turned the column entries into small cards (colour bar, time line, two-line title) because a 68-px column cannot carry the lane's one-line format. **The port shipped v1.1.2389:** a height ladder for the whole card (`utils/hoehenLeiter.js`) — voll / kompakt / abwerfen / boden from the measured window height; grid, search panel and detail panel follow one `--fsc-panel-h` variable, the small tiles flatten, then drop, then the page scrolls. The wall-tablet cut-off (forum point 8) is answered. Entry complete.

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

**Why the ladder is the real prize.** The card's most-reported open issue was the fixed-height layout cutting off on wall tablets — point 8 of the forum feedback, acknowledged for months and answered by the height ladder in v1.1.2389. That problem needs exactly this kind of thinking: not a breakpoint where the layout flips, but a staged retreat that keeps the composition intact as long as possible and then degrades on purpose.

Building the ladder here, on a contained surface with an obvious right answer, produces the pattern. Applying it to the Bento grid afterwards is then a port rather than an invention.

**Effort:** Medium for the view. The ladder is the interesting part and worth its own careful pass.

**Why it fits:** A calendar view the card lacks, on top of a responsive pattern the card needs elsewhere and does not yet have anywhere.


---

### 49. Screen behaviour — the settings surface for ambient mode

> ✅ **Shipped v1.1.2445** (2026-09-18) — the last open slice, **auto brightness**: `utils/autoHelligkeit.js` follows an illuminance sensor on the state stream with hysteresis (dark below / bright above, nothing changes in between) and dims the card through a fixed black overlay at a chosen strength; independent of the screensaver, off by default. Settings rows under Start Screen → Screensaver (toggle, sensor picker, dark/bright thresholds, strength), registered for the settings search. Wake sources, handoff and photo frame shipped as #61–#64; with this the surface described below is complete.

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

> ⤳ **Re-scoped 2026-09-24** — the boot-timing table is dev-only since v1.1.2468 and the changed-settings list is delivered by #46 phase 3. Remainder: "why is entity X missing?" (the gate functions are pure and exported, `entityZulassung.js`) plus a capability line.

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
> ✅ **Shipped v1.1.2444** (2026-09-18) — the primitive (`hooks/useMehrfachauswahl.js`: 500 ms long-press enters, tap toggles, Escape / Cancel / empty selection leaves; `components/common/AuswahlLeiste.jsx`: count, cancel, host-declared actions, destructive ones confirm in two taps naming the count) and its first adoption in the to-dos (complete many, delete many with a single undo window over all targets). Notification center, excluded patterns and search results are the next adopters. *(2026-09-24: order confirmed; search results last — collision with the 1-s hold, `QuickControlIcon.jsx:20`. An "Alle verwerfen" button in the overview tab covers most of the center case and should ship with the long-press.)*


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


---

### 53. Calendar groups — one toggle for several calendars

> ✅ **Shipped v1.1.2379** (2026-09-03) — groups layer with stable ids, one-switch rows in the settings (members collapse into their group), editor (name / palette / members / dissolve), group colour precedence, chip row in the calendar view, Bento widget honours visibility + colours. **v1.1.2385:** optional per-group icon (twelve-glyph set), shown in the settings row and on the chip.

**Pitch:** Name a group, put several calendar entities in it, give it a colour and an icon. The settings list and any per-calendar filter then show the group instead of its members.

**Status quo:** `CALENDAR_SETTINGS_DEFAULTS.calendars` is a flat map, `{ [entity_id]: { enabled, color } }`. Every calendar is its own row and its own toggle. That is correct and fine with four calendars. With a household running one per person plus school, bins, work and holidays, the settings list becomes a wall and the useful action — "show me only family stuff" — takes six taps.

**What ships:**
- A group layer above the existing map: `id`, display name, member entity ids, colour, icon.
- One toggle per group in the calendar settings and in the filter row.
- The group colour overrides the per-calendar colour for its members, so a group reads as one thing visually. Individual overrides stay available for anyone who wants them.
- Ungrouped calendars keep behaving exactly as they do now — this is additive, and an install that never makes a group should notice nothing.

**Keep the ids stable and unique.** Groups will later be referenced by rules (see #54) and possibly by lanes (#55), so a generated-once stable id beats using the display name as the key. Renaming a group must not break anything that points at it.

**Effort:** Small. A layer over an existing map plus a settings screen.

**Why it fits:** The calendar is the app most likely to accumulate entities in a family install, and it is the only place in the card where the entity count grows with the number of *people* rather than devices.

---

### 54. Event rules — colour, mark and hide events by what they are

> ✅ **Shipped v1.1.2380** (2026-09-03) — the four forms (title contains / from calendar or group / all-day / past) with colour, icon, dim, day chip and hide; per-property resolution by rank exactly as sketched; sentence-style rows with ▲▼ rank. Deliberately not built: exact/regex modes and all/any/not combinators — the forms cover the worked list, and a grammar would surface as a programming environment. **v1.1.2385:** the text form can target title, location, description or anywhere.

**Pitch:** "Anything with 'Geburtstag' in the title gets a cake icon." "Events from the bins calendar show as a badge on the day, not a row." "Hide anything titled 'Declined'." Rules that match on what an event *is*, not on which calendar it came from.

**Status quo:** Styling is per calendar only. Colour comes from `calSettings.calendars[id].color`, or a hash of the calendar id. Two events from the same calendar always look identical, however different they are.

**What ships — matching:**
- Match on event **title**, **description**, **location**, **all-day or timed**, **past or future**, **source calendar or group**.
- Text matching: case-insensitive substring by default, with exact and regex available for people who want them.
- Combine with **all / any / not**, because "birthdays but not work ones" is the second rule everybody writes.

**What ships — effects:**
- Colour and text colour, an icon, reduced emphasis for past or declined items, and **hide**.
- **Promote to day badge:** render a matching event as a small chip on the day cell instead of a row. The month grid already renders per-day dots at `CalendarView.jsx:900-911`, so there is a rendering anchor; a badge is a richer dot.

**Conflict resolution worth copying exactly:** give rules a priority and resolve **each style property independently** to the highest-priority rule that sets it. A rule that only sets an icon then layers cleanly over a rule that only sets a colour, instead of one rule winning wholesale. It is a small decision that prevents a category of confusion.

---

**The design constraint that matters more than the feature.**

Cards that ship this usually ship it as YAML — a rule DSL the user writes by hand. The card has no YAML. Everything is configured in-card, which means these rules need a **UI**, and a UI cannot express arbitrary boolean algebra without becoming a programming environment with a worse keyboard.

So the scope is: **ship the common cases as first-class UI, not a general rule engine.**

A worked list of what people actually want, each of which is a form rather than an expression:

- Title contains X → colour and icon
- From this calendar or group → colour
- All-day → show as badge instead of row
- Past → dim
- Title contains X → hide

Five forms cover almost everything. If a general matcher grammar exists underneath, that is an implementation detail — it should not surface as the primary way to configure this. The related lesson is already visible elsewhere in the ecosystem: when maintainers answer "just write a template", users keep asking for the toggle.

**Effort:** Medium, and most of it is the settings UI rather than the matching.

**Why it fits:** It is the difference between a calendar that shows your events and one that shows you *your* events. And it stays honest to the card's premise that configuration happens in the card, not in a file.

---

### 55. Person lanes — a family week, side by side

> ✅ **Shipped v1.1.2381** (2026-09-03) — people mapped from calendars/groups (#53 ids) with colour and optional `person.*` picture, a "Personen" mode tab (appears only once people exist) with one lane per person + a "Gemeinsam" lane, lane-header tap = per-person filter in every view (chip clears it). Not built: #48's narrowing ladder for five people on a phone — lanes have a 150 px minimum and scroll horizontally for now. *(2026-09-24: obsolete — v1.1.2386 built the ladder on the person lanes first.)*

**Pitch:** A week view with one lane per person instead of one lane per day. Who is doing what, when, at a glance — the question a shared household calendar exists to answer.

**Status quo:** The card has no person dimension at all. Verified: `person` appears once in the entire source, as a domain label in `translations/helpers.js:227`. There is no person card, no per-person filter, no avatar anywhere. A forum user rebuilding a decade-old instance named person cards as one of three gaps keeping him from adopting the card.

**Why this is the version worth building.** A person *card* — one tile showing where someone is — is a small feature that many cards already do. A person *lane* in the calendar is the thing the family-calendar appliances are actually bought for, and no HA card does it well. It is also the only one of the two that uses data the card already has.

**What ships:**
- A view mode where columns are people rather than days: each person's events for the chosen range in their own lane.
- Person derived from **calendar ownership**, not from `person.*` entities. `calendar.mom` belongs to Mum because the user says so, once, in settings — mapping calendars (or groups from #53) to people. Trying to infer it from attendee lists will fail on most HA calendar integrations.
- Optional avatar and colour per person, reusing the picture from the matching `person.*` entity when there is one.
- A shared lane for events belonging to nobody in particular — bins, holidays, school terms.
- Tapping a lane header filters the whole calendar to that person, which doubles as the per-person filter that is missing today.

**Depends on and feeds:**
- **#53** supplies the grouping; a person is usually "these two calendars".
- **#15** (multi-user profiles, retired 2026-09-24) wanted the same person model. Building it here first, concretely, is better than designing it abstractly there — the calendar gives it a reason to exist and a place to be wrong cheaply.
- **#48**'s column layout and its narrowing ladder apply directly. Lanes and day columns have the same width problem and should share the same answer.

**Effort:** Medium. The lane layout is straightforward once #48's column work exists; the person mapping is a settings screen; the honest cost is in deciding what happens with five people on a phone.

**Why it fits:** It is the one calendar capability that turns the card from a personal dashboard into a household one, and it is the exact gap a credible long-time user named out loud.


## Part eight — 2026-08-24 code-analysis pass (#56–#60)

Five additions from a code-first review after the v1.1.2353–2361 rounds (depth transition, MorphPopup
window, typewriter loop, island standby). Each grew out of a seam or gap the code itself exposed.

### 56. Live to-dos — push updates and optimistic toggling

> ✅ **Shipped v1.1.2367** (2026-08-24) — watcher on `todo.*` state signatures via the hassStore line, debounced reload through the existing `getTodos` path, optimistic toggle in view and widget. One deviation from the sketch: full parallel reload instead of per-list partial fetch (same observable result, no new merge machinery).

**Pitch:** The tasks view (and the Bento tasks widget) updates itself the moment a list changes anywhere — companion app, voice assistant, another wall tablet — and checking an item off feels instant.

**Status quo:** `TodosView` loads once per open via `entity.executeAction('getTodos')`; every mutation round-trips and re-fetches *all* lists; a change made outside the card is invisible until the manual refresh button. Toggling an item waits for the full re-fetch — on a slow backend the checkbox lags visibly.

**What ships:**
- Subscribe to `state_changed` for `todo.*` entities (their state is the item count; any edit bumps `last_updated`) → re-fetch only the affected list, debounced.
- Optimistic checkbox toggle with a pending lock (the exact pattern from `pattern_ha_card_state_management`: flip locally, reconcile when HA confirms).
- The Bento tasks widget reads the same freshened store instead of its own schedule.

**Effort:** Small–Medium. The subscription plumbing exists for devices; todos just never joined it.

**Why it fits:** The tasks surface got a design pass in v1.1.2359/60 (list cards, plain rows, glass add window) — freshness is now the weakest part of that surface.

---

### 57. Context lines in the typing loop

> ✅ **Shipped v1.1.2371** (2026-08-28) — provider (`kontextZeilen.js`) riding #58's data paths, rotation over available truths, greeting always follows a context line, settings toggle under Status & Greetings. Deviations from the sketch: weather-change lines deliberately left out (need forecast data; current weather already lives in the Zen status line) *(2026-09-24: the forecast data has been in `wetterVorhersage.js` since #47, v1.1.2443 — the weather-change line is #72 S1)*. **Second surface shipped v1.1.2377** — the locked Zen page shows the same sentence under the greeting (3-minute slices on the 15-s clock, no typing).

**Pitch:** The resting search bar already types greetings (v1.1.2360). Sometimes, instead of a pleasantry, it types one *true* sentence: "Um 10:00 Zahnarzt", "2 Aufgaben heute fällig", "Regen ab 17 Uhr".

**Status quo:** The loop alternates "Search or Ask" with random time-of-day greetings. All the context it could speak is already in the card: calendar events (fetched for the widget), todos counters (`incompleteCount`/`overdueCount` live on the view ref and in the system entity), the weather entity.

**What ships:**
- A small provider that yields at most one context sentence per cycle (priority: imminent event > due tasks > weather change), falling back to a greeting when nothing is worth saying.
- Same typing mechanics, same idle gate (`data-dekor`), same interruption rules — content only.
- A settings toggle under Start Screen (off = greetings only), and the sentences come from the dictionary (de/en).

**Effort:** Medium. The delicate part is *restraint* — one sentence per cycle, never two data lines in a row.

**Why it fits:** It turns the new ambience feature into an information surface — the wall-tablet line between "decoration" and "briefing" without building a widget. (It did that so well that the briefing widget, #13, was dropped in 2026-09.)

*2026-08-27 addition:* the same single sentence has a second natural surface — the **locked Zen page** (the screensaver face since v1.1.2369). One provider, two consumers, identical restraint rules; on the locked page it must survive the deep-rest dim of #61 (i.e. it belongs to the normal locked stage, not to deep rest).

---

### 58. Tasks and appointments feed the notification lanes

> ✅ **Shipped v1.1.2370** (2026-08-28) — reminder source (source 5) of the alert lane: overdue/due-today task aggregates with once-per-day escalation, per-event lead-window announcements, settings section with per-source toggles + lead time. Deviation from the sketch: tasks aggregate into one notification per kind (calmer than per-item), and the calendar input rides the existing entity attributes with a canonical-range self-refresh instead of a per-list partial fetch.

**Pitch:** "Bins tomorrow", "task overdue", "event in 15 minutes" appear where every other alert lives: island chips, notification center, badges — with the same dismiss/snooze verbs.

**Status quo:** The three-lane notification model (#3 infrastructure) and the watch engine cover sensors and HA notifications. Due/overdue todos and imminent calendar events — the most human alerts in the card — never reach the island; they only tint numbers inside their own views.

**What ships:**
- A source adapter mapping "task due today" / "task overdue" / "event starts in N minutes" onto the existing notification objects (INFO/WARNING; overdue escalates once per day, events announce once).
- Local acknowledge/snooze semantics like `alert.*` sources (nothing is written back to HA).
- Per-source toggles in the notification settings; N minutes configurable.

**Effort:** Medium. The lanes, chips, takeover and center all exist — this is a new *source*, not a new surface.

**Why it fits:** The island standby (v1.1.2361) made the island the card's resting attention surface; this gives it the two alert types a family actually cares about.

**A rule worth adopting with it *(added 2026-09-04)*:** **an empty summary sends nothing.** Task integrations that ship daily digests learned to suppress the message entirely when there is nothing open, rather than sending "0 tasks today". The same applies here: a lane that reports "nothing due" every morning trains people to stop reading the lane. Silence is the correct output for an empty set, and it is the cheapest way to keep the surface credible.

#### 58b. All-day events of tomorrow announce the evening before *(added 2026-09-03)*

> ✅ **Shipped v1.1.2375** (2026-09-03) — builder + evening-hour setting, one instance per evening, local-day parsing of all-day dates.

The shipped source announces only *timed* events ("Starts at 10:00"). The events a household
actually wants warned about — bins, school-free days, birthdays — are **all-day and tomorrow**.
One rule closes the gap: from a configurable evening hour (default 18:00) an INFO reminder lists
tomorrow's all-day events ("Morgen: Restmüll · Elternabend"), once per evening (instance = that
day), gone at midnight when the day itself arrives. This is the real "bins tomorrow" — and makes the
dedicated waste widget (#18, retired 2026-09-24) largely unnecessary. *Effort: small* (same store, one more builder, one
settings row).

---

### 59. Period comparison in history charts

> ✅ **Shipped v1.1.2372/2373** (2026-09-03) — toggle in the glass calendar of the history header, second fetch for `periodIndex − 1`, ghost series over the same axis, header delta (Ø absolute for measurement sensors, percent for counters), remembered per sensor. Deviations from the sketch: the ghost series is drawn *on top* as a thin dashed white line / narrow inner bar (behind the fill it was illegible), and the delta is computed from the buckets rather than the headline values.

**Pitch:** A "compare" toggle in the history header lays the previous period under the current one — today vs yesterday, this week vs last week — as a dimmed second line, with the delta summarized in the header.

**Status quo:** Charts render exactly one period; the period math (`calculatePeriodDates`) and the statistics fetch are pure and parameterized, so fetching `periodIndex - 1` alongside is mechanical. The new glass calendar (v1.1.2360) already owns period selection.

**What ships:**
- Second fetch for the previous period, rendered as a 40 %-opacity line/bars behind the current data (no second axis).
- Header delta ("+12 % vs. last week") using the existing summary math.
- Off by default; remembered per entity like other chart preferences.

**Effort:** Medium. Purely additive to the chart pipeline.

**Why it fits:** It is the first analysis feature energy/temperature users ask for once plain history exists, and it needs no new data source.

---

### 60. Undo for destructive taps

> ✅ **Shipped v1.1.2368** (2026-08-24) — perform-later store with a single floating action, bottom-center glass pill, tombstone filter shared with #56's live data. Consumers: task delete, calendar event delete, schedule delete. **Closed v1.1.2374** (2026-09-03): the confirmation steps in front of the undo (task action sheet, event confirm pair) are removed — delete acts at once, the pill catches the mistake. The "notification dismiss-all" consumer named in the sketch does not exist in the card, so nothing to wire.

**Pitch:** Deleting a task, an event or a schedule shows a six-second toast with "Undo" instead of being instantly irreversible.

**Status quo:** `deleteTodo`, calendar `deleteEvent` and scheduler delete all fire their service immediately on tap. On a wall tablet with guest fingers, that is the sharpest edge in the card. (The todos edit dialog wraps delete in a confirm sheet; list-level deletes and the calendar do not.)

**What ships:**
- A card-wide undo primitive: perform-later (timer) where safe, compensate (re-create from the held payload) where the service has no delay — per domain.
- One toast surface (reuses the existing toast lane) with the item name and "Undo".
- Consumers: todos delete, calendar event delete, schedule delete, notification dismiss-all.

**Effort:** Medium. One primitive, four call sites; the compensation payloads (the deleted object) are already in hand at every call site.

**Why it fits:** Every destructive action in the card currently trusts the finger. Undo is cheaper than confirm dialogs and calmer than both.

---

## Part nine — 2026-08-27 screensaver expansion pass (#61–#64)

> ✅ **All four shipped 2026-09-04** — foundation + #61 (v1.1.2390), #62 (v1.1.2391), #63 (v1.1.2392), #64 (v1.1.2393).

v1.1.2369 shipped the pragmatic core of #9/#49: after configurable idle the card tidies itself up and
returns to the **locked Zen start page** — that page *is* the ambient face now. This pass slices the
open remainder (dimming, wake sources, schedules, device handoff, ambient content) into steps that
each ship alone. #49's honest-split analysis (what the browser can and cannot do to the panel)
remains the reference for all of them.

**Shared foundation — one idle service.** ✅ *Shipped v1.1.2390 as `utils/leerlaufStore.js`
(`nachLeerlauf` / `subscribeGeste` / `weckeLeerlauf`); the three clocks below were rewired 1:1.*
Three separate idle clocks ran before, each with its own
document-listener set: the decor gate (`data-dekor`, 3 min), the island standby cascade
(`useIslandStandby`), and the screensaver return (`useZenRueckkehr`). Before the slices below, merge
them into a single module-level idle store (last gesture + derived stages: decor-still → island
folds → screensaver → deep rest). One listener set instead of three, and the wake sources of #62 get
exactly one place to hook in. Refactor, invisible, makes everything after it cheap.

### 61. Deep rest — a second idle stage that dims the locked page

> ✅ **Shipped v1.1.2390** (2026-09-04) — `data-ambient="tief"` after N minutes of stillness on the locked page (default 2, only with the screensaver on): full-screen dim overlay, clock at 72 %, greeting/status/context/grip off, island folded to its centred button; burn-in drift (eight-step pattern off the 15-s clock tick); night coupling to the existing quiet hours (deeper dim, warmer clock tone, shorter return time, no new schedule UI). Settings + ⓘ text under Start Screen → Bildschirmschoner.
>
> 🔧 **v1.1.2401: curtain latch made two-way; the locked page was blank after the screensaver since v1.1.2369.** The curtain (clock, greeting, context line, grip) unmounts 420 ms after revealing — a v1.1.2285 heat decision on an explicitly one-way path. The screensaver locks the page again, so the latch had to reopen: the tiles went to opacity 0 and nothing took their place. Deep rest was dimming an empty page, the photo frame changing pictures behind nothing. A second effect re-hangs the curtain when `revealed` goes false, and the return fades in over 400 ms (`bento-zen-curtain--rueckkehr`) instead of replaying the staged entrance.

**Pitch:** After the screensaver has returned the card to the locked clock page, a further stretch of
stillness takes it one stage deeper: the wallpaper darkens noticeably, the clock drops to ~60 %
opacity, greeting/status line step off, the island folds to its button. Any touch — or a wake source
from #62 — lifts it back.

**Status quo:** v1.1.2369 locks the page but leaves it at full brightness forever. #9 names dimming
and burn-in protection, #49 names "dim after N" — neither has a mechanism yet. The intended rail is
the `data-ambient` attribute choreography from #9's design, the same pattern `data-zen-revealed` and
`data-dekor` already ride.

**What ships:**
- A `data-ambient` deep-rest stage driven by the idle service: CSS-only dim (token/overlay change,
  zero runners at rest — the thermal rule stays law).
- **Burn-in protection:** the clock drifts a few pixels every few minutes — single transform events,
  the Nest-Hub/StandBy standard (#9's burn-in section, finally concrete).
- **Night coupling — the schedules axis without new schedule UI:** within the existing Quiet Hours
  window, dim deeper (optionally a warmer clock tone — the island night face is the precedent), and
  a second, shorter screensaver-return time applies ("during quiet hours: after 1 min"). Reuses the
  quiet-hours window the card already has; no new time-range editor.

**Effort:** Small–Medium. **Why it fits:** the thermally free half of #9's remaining design, and the
piece that makes an always-on wall tablet livable at night.

---

### 62. Wake sources — sensors and alerts wake the screensaver

> ✅ **Shipped v1.1.2391** (2026-09-04) — `utils/weckquellen.js` on the state stream: motion/presence entities (edge off → on/home, one stage up: deep rest → locked page, never revealed), critical alerts (toggle, always through), a doorbell entity (binary_sensor / event / button), and the inversion — all chosen presence entities off shortens the screensaver return to the night time. Settings rows under Start Screen → Bildschirmschoner (multi-select motion picker, critical toggle, doorbell picker, away toggle). Doorbell → camera coupling waits for #3b E1 (the still image), not for the #4 system view *(corrected 2026-09-24)*.

**Pitch:** Besides touch, chosen HA signals wake the resting card: motion in the room lifts deep
rest, a critical alert always breaks through, a doorbell rings the display awake.

**Status quo:** v1.1.2369 wakes on gesture only. #49 already argues the honest form — not "wake on
movement" but "wake when this sensor triggers", with an entity picker (the sensor may sit in the
hallway, which is better anyway). The live-todos watcher (v1.1.2367) is the exact
signature-watching pattern to reuse; the CriticalBanner renders above everything but does not lift
the dim today.

**What ships:**
- Settings rows "Wake by: touch (always) · motion/presence ⟨entity picker⟩ · critical alerts ⟨toggle⟩
  · doorbell ⟨entity⟩" — the islandSources picker pattern.
- **Stage discipline:** motion lifts *one* stage (deep rest → normal locked page), never straight to
  the revealed page; a critical alert lifts to full brightness with the banner; doorbell wake couples
  forward to #3b E1 (the still image; *corrected 2026-09-24*, formerly "#4 camera live-view") once that exists — until then it just wakes.
- The inversion for free: "nobody present" may *shorten* the idle times.

**Effort:** Medium overall, small per source once the idle service exists. **Why it fits:** it is the
half of #49's wake story the card can do entirely alone, and the first consumer that justifies the
idle-service refactor.

---

### 63. Display handoff — services on sleep and wake

> ✅ **Shipped v1.1.2392** (2026-09-04) — `utils/displayUebergabe.js` on the deep-rest moments (#61): screen entity off + sleep script on entry, on + wake script on lift (wake only after an own sleep). Conflict rule as a settings hint (kiosk app's own screensaver off); the screen entity doubles as a wake source (#62) so the app turning the display on lifts the card's rest. Settings + ⓘ paragraph under Start Screen → Bildschirmschoner.

**Pitch:** Two optional HA actions — one fired when the screensaver locks the page, one on wake — so
the card can drive the panel's *real* display: Fully Kiosk's screen light entity, Wallpanel, or any
helper script. The card stops pretending CSS black is "off" and becomes the conductor instead.

**Status quo:** #49's honest split stands: a browser cannot set device brightness or switch the
display off; Fully Kiosk's core integration exposes exactly that missing half as entities.
v1.1.2369 created the two moments (sleep/wake) to hang the calls on — nothing listens there yet.

**What ships:**
- An action/entity picker pair in the Screensaver settings section ("on sleep call …", "on wake
  call …").
- #49's conflict rule made explicit: *card screensaver* **or** *device handoff* — the card's idle
  timer drives whichever is chosen; never two screensavers fighting over one display.
- The ⓘ popup carries the browser-versus-device explanation (#49 wrote it; this is where it lands).

**Effort:** Small–Medium. **Why it fits:** the single most-expected behavior class on wall tablets,
and the step that turns the screensaver from decoration into real panel control.

---

### 64. Photo frame — the deep-rest slideshow

> ✅ **Shipped v1.1.2393** (2026-09-04) — `utils/fotorahmen.js` on the deep-rest moments: folder listing via the gallery's media-source path (cached), fresh `resolveMediaUrl` per change, `applyFullscreenWallpaper` for the swap, `applyWallpaperFromSettings` on wake. The change is a dip through the dim overlay rather than a cross-fade (one background element, `background-image` not animatable). Toggle (default off) + interval + random + folder field under Start Screen → Bildschirmschoner. **Part nine (#61–#64) complete.**

**Pitch:** In deep rest the locked page cycles through the user's wallpaper folder — the Nest-Hub
moment. The clock stays; the picture behind it changes every few minutes.

**Status quo:** The wallpaper gallery and its folder infrastructure exist (media browsing, the
`/local/` alias). The documented trap applies: `media_source` URLs expire, `/local/` URLs are the
durable ones (`memory/project_wallpaper_gallery_plan.md`). A picture swap every 1–5 minutes is a
single event — compatible with the zero-runners rest rule; a WebGL scene (ocean) as screensaver
background stays a deliberate opt-in for exactly that reason.

**What ships:**
- Toggle + interval + source folder (default: the wallpaper folder) in the Screensaver section.
- Crossfade as one opacity transition per swap; active only in deep rest — the normal locked page
  keeps the user's chosen wallpaper.
- Reuses the gallery's file listing; no new media plumbing.

**Effort:** Medium. **Why it fits:** the highest visible payoff of the pass, built on the existing
gallery instead of a new media system.

---

## Part ten — 2026-09-04 household-task research pass (#65–#68)

> ✅ **All four shipped** — #67 (v1.1.2395), #65 (v1.1.2396), #68 (v1.1.2397/2398), #66 (v1.1.2399).

Three household task-manager projects were read end to end. All three are **integrations** with a Python backend, because points, streaks, rotation and habits need per-task persistence that a card cannot hold. What follows is only what works over Home Assistant's standard `todo` platform — the five fields the card actually has: `summary`, `description`, `due`, `status`, `uid`.

The rest became requirements input for #22 rather than entries here.

---

### 65. Todos: find it before you add it, and see whose it is

> ✅ **Shipped v1.1.2396** (2026-09-04) — add form searches all visible lists while typing (open first, completed dimmed, tap = jump instead of add); lists map to a person in the list settings, people = the calendar's #55 model (no second model), person chips with avatar and count in the filter bar.

**Pitch:** Two small changes to the to-dos app. Typing in the add row searches the existing items as you go, so you notice "Milch kaufen" already exists before adding it twice. And a person filter, derived from which list an item lives on.

**Status quo:** The to-dos app drives HA's standard platform — `add_item`, `update_item`, `remove_item`, `remove_completed_items`. The add row is a plain text field with no lookahead, and there is no person dimension anywhere: HA to-do items carry no assignee field, and the card never looks for one.

---

**Half one — the add row searches.**

The card is a search card. The one input where it does not search is the one where a user types a phrase that very likely already exists somewhere in their lists. Fuse.js is already bundled and already tuned.

- While typing, show matching open items **from all visible lists**, not just the current one — the duplicate is usually on the *other* list.
- Show which list a match lives on, so the answer to "it's already there" includes *where*.
- Tapping a match jumps to it instead of adding. That is the whole feature: turning an accidental duplicate into a navigation.
- Completed items match too, dimmed — "you did this last week" is useful information for a recurring chore.

**Half two — person from list.**

HA to-do items have no assignee. But the household pattern is one list per person: `todo.max`, `todo.anna`, plus shared lists for the house. So the assignment already exists — in the list, not in the item.

- Map lists to people once in settings. Ungrouped lists stay unassigned and behave as now.
- Person chips filter the view, in the same chip pattern the search toolbar uses.
- Reuse the picture and colour from the matching `person.*` entity where one exists.

**This is the same person model as #55** (person lanes in the calendar), and the two should share it rather than each inventing their own. Whichever ships first defines it; the second one is then nearly free. Building it in two places also keeps the abstraction honest — a person model that only ever serves one view tends to grow the wrong shape.

**Effort:** Small. Both halves are UI over data the card already loads.

**Why it fits:** The first half is the card's own premise applied to the place it was missing. The second turns a personal list into a household one without needing anything HA does not already give.

---

### 66. Dictate a task

> ✅ **Shipped v1.1.2399** (2026-09-05) — `utils/diktat.js`: Assist pipeline STT over the existing websocket (binary PCM frames, text from `stt-end`) where a pipeline with an STT engine exists, browser `SpeechRecognition` as fallback, no button when neither is available; microphone only on button press, text never auto-submitted. **Part ten (#65–#68) complete.**

**Pitch:** A microphone button in the add row. Speak the task, it appears as text, you confirm.

**Status quo:** The card has no voice anywhere. #12 is the full voice-control entry and is correspondingly heavy — intent parsing, device targeting, confirmation semantics, failure modes.

**Why this one is worth splitting out.** Dictating a task title is the smallest possible piece of voice with a genuinely useful outcome and almost no risk. There is no intent to parse and no device to target: the words become a string, the user sees the string before anything happens, and a wrong transcription costs one backspace rather than an unintended action.

**What ships:**
- A microphone button in the to-dos add row, using **Home Assistant's Assist speech-to-text** where it is configured, with the browser's own speech recognition as a fallback where available.
- The transcription lands in the text field as editable text. **It never submits on its own** — the user confirms. Voice input that acts immediately is how you end up with "Milch kaufen und äh nein warte" on a list.
- Hidden entirely when neither path is available, rather than showing a button that does nothing.

**Watch out for:** the permission prompt. A microphone request that appears without explanation reads as alarming on a wall tablet that a household shares. Ask on first use, from a visible button press, never on load.

**Effort:** Small.

**Why it fits:** It is a real feature on its own, and it is the cheapest possible way to find out how Assist behaves inside the card before #12 depends on that answer.

---

### 67. Overdue should not stack

> ✅ **Shipped v1.1.2395** (2026-09-04) — `todos/utils/stapeln.js`: open + overdue + same list/title + regular interval → one row with the oldest date and "n× fällig"; expandable in place; ticking completes all members via one `completeMany` action. Future repetitions, same-day duplicates and undated items never stack.

**Pitch:** A monthly task ignored for three months is one task marked "3× due", not three tasks.

**Status quo:** Recurrence is handled by whichever to-do provider the user runs, and several of them reopen a recurring item per missed period. The card renders what it is given, so a neglected chore turns into a wall of identical rows — and a list that looks like a wall of failures is a list people stop opening.

**What ships:**
- Collapse items that share a summary and a list into **one row with a count** when they differ only by due date.
- Show the **oldest** due date, since that is the one that says how bad it has got, and the count beside it.
- Completing the collapsed row completes them all — that is what the user means.
- Expandable, because occasionally the individual dates matter.

**The matching rule needs care.** Identical summaries in one list are almost always the same recurring chore, but not always — a shopping list can legitimately hold "Milch" twice. Collapse only when the items also carry due dates that fit a regular interval, and never collapse items without due dates at all.

**Effort:** Small. Grouping and rendering over data already loaded.

**Why it fits:** It fixes a display artefact that makes the app feel worse the longer someone uses it, which is the worst direction for that feeling to run.

---

---

### 68. Tell me when I am running stale code

> ✅ **Shipped v1.1.2397/2398** (2026-09-04) — `utils/versionWaechter.js`: registry route first (`lovelace/resources` URL vs the URL the page's own `<script>` loaded — HACS tag included; reading the list needs no admin), bundle re-fetch with the literal `fsc-version:` marker as the fallback, the GitHub changelog rejected as designed. Quiet line with Reload/Later (dismissed per target), About row states "aktuell" / "neu laden". Checks at +8 s, every 6 h, and on becoming visible after ≥ 1 h.

**Pitch:** When Home Assistant has a newer build of the card on disk than the one this browser is executing, say so once and offer a reload button. Not "an update is available" — "you already updated, this tab did not".

**Status quo:** The card has no version checking of any kind. Verified: no `latestVersion`, no `updateAvailable`, nothing comparing anything. The version shown in Settings → About is a hardcoded string in `AboutSettingsTab.jsx`; it reports what this bundle *is*, never whether it is current.

**Why this matters more here than for most cards:**

- The card ships as **one bundle of roughly 1.9 MB**. The larger the file, the more stubbornly it sits in a browser cache.
- **Wall tablets never get a hard refresh.** A kiosk browser keeps one page alive for weeks; nobody presses Ctrl+F5 on a panel screwed to a wall. A stale build can run there indefinitely while the household believes it is up to date.
- Symptoms are indistinguishable from bugs. "I updated and the new feature isn't there" arrives as a bug report, and both sides then debug the wrong thing.

---

**The constraint that defines this feature.** This must fire **only when the running code is provably stale** — never as an advert that a release exists.

That distinction is not a nicety. The card ships pre-releases continuously and deliberately stays quiet about them; a banner announcing every published version would undo exactly the restraint that policy buys. The message is "your browser is behind what you already installed", which the user can fix with one tap, and it should be impossible to see it while genuinely up to date.

**Three candidate mechanisms, in order of preference:**

1. **Ask Home Assistant what it thinks is installed.** The Lovelace resource registry holds the card's resource URL, and HACS stamps a version onto it. Comparing that against the compiled-in version is precise and cheap: HA says 2400, this code says 2389, therefore the browser is stale. Caveat to check first — reading the resource registry over the websocket may require admin, so a non-admin household member might get nothing.
2. **Re-fetch the bundle with a cache-buster and read its embedded version.** Precise and permission-free, but it pulls the whole file to learn one string. Acceptable as a once-per-session fallback where route one is unavailable; not acceptable on a timer.
3. **Compare against the changelog the card already fetches.** `versionsverlauf.md` is pulled from GitHub at runtime and cached in `localStorage` — cheap, already wired. **But it answers the wrong question:** it reports what has been *released*, not what is *installed*. It cannot tell "HACS has not updated yet" apart from "the browser is stale", so it would nag about releases the user never chose. Listed here to be explicitly rejected, not adopted.

**What ships:**
- A quiet, dismissible line — not a modal — with a **Reload** button that does a cache-busting reload rather than a soft one.
- Shown **once per detected version change**, not once per session. Dismissing it means dismissed until the next mismatch.
- A matching state in Settings → About: the version row gains a quiet "up to date" or "reload to finish updating", so the answer exists in the obvious place even if the banner was dismissed.
- Nothing at all in the normal case. An "up to date ✓" badge that is always present is noise.

**Effort:** Small, once the mechanism is chosen. The choice is most of the work — spend it on confirming whether route one is available to non-admin users, because that determines everything after.

**Why it fits:** It removes a class of bug report that costs both sides real time, and it is the only place where saying something about versions is unambiguously welcome — because the user already asked for the update by installing it.

---

## Part eleven — 2026-09-24 second consumers, domain gaps and API repairs (#69–#85)

Seventeen entries from a re-analysis at v1.1.2468, after 97 builds since 1 September. Five sources were read side by side — the code seams (modules with exactly one consumer), a Home Assistant API survey (2026.6–2026.9), the neighbouring cards and family-tablet projects, the card's own release momentum, and a first-evening user walk-through — then fifty-six candidates (four decision questions were kept apart) went through a checker (does the hook exist, at which line, what is already there) and a skeptic (is it already built, does HA do it, does it break a rule). What is here survived both. Every hook below was read in the source on 2026-09-24; only Home Assistant's standard APIs are used; nothing is copied from another card.

The lesson of this pass: the cheapest new features are not new systems. They are **second consumers** for modules that have one (the forecast cache feeds only the calendar, dictation only the to-do form, the person model only calendar and to-dos, wake sources only motion and critical alerts), **domain configs** for entities that land in the fallback today (number, select, timer, camera), and **three repairs** where Home Assistant moved underneath the card.

Decision questions (AI mock, Liquid Glass, Energy Dashboard, test suite, settings backup, stop on the live capsule, and seven smaller ones) are deliberately not entries; they are listed under "Open decisions" below and are the user's to answer.

One format addition in this part: a **Files (estimate)** line per entry. Since the September slice practice the touched files are predictable enough to name, and that line is what a build session opens first. It is an estimate, not a contract.

---

### 69. Three API repairs — HA moved, the card did not

> ◐ **Partial — v1.1.2470/2471** (2026-09-26): **B shipped** (v2470) — `utils/batterieSensor.js` resolves the `device_class: battery` sensor on the vacuum's device through `hass.entities` (cached per vacuum, re-scanned only when the registry object changes), falls back to `attributes.battery_level`, and shows "—" in neutral grey when neither exists. **A shipped** (v2471) — `utils/persistentNotificationStore.js` holds one `persistent_notification/subscribe` subscription per connection; the merger reads the store, the `hass.states` scan stays as the fallback for HA without the command; the initial `current` batch (also after a reconnect) is silent for this source only — toast, double ping and wake for every other source are untouched. C (child devices) is open.

**Pitch:** Not features. Three places where Home Assistant changed the contract and the card silently shows nothing, a wrong number, or drops entities.

**Status quo:**
1. Source 1 of the alert lane reads `persistent_notification.*` out of `hass.states`. Per the release notes (API survey of 2026-09-24, not re-read against core source), Home Assistant removed those entities from the state machine in 2023.6 (WebSocket `persistent_notification/subscribe` replaced them; 2026.9 also sends `update_type: updated`). The lane has been silently empty for HA-native notifications — repairs, integration hints, update notices — for three years; nobody noticed because sources 2–6 work.
2. The vacuum ring reads `attributes.battery_level ?? 0` and colours it red below 20 %. Per the 2026.8/2026.9 release notes, 2026.8 deprecated and 2026.9 removed the attribute from the vacuum base entity; the replacement is a battery sensor on the same device. Every current vacuum now shows 0 % in red.
3. Per the 2026.9 release notes, child devices arrived: `parent_device_id`, `area_id` possibly `null` (inherited from the parent). The card's room chain knows only `entity.area_id → device.area_id`, so the entities of a child device have no room and the loader drops them; the builder finds sub-devices only via `via_device_id`.

**What ships (three releases, in this order):**
- **B — battery from the sensor** (first, because it is the one everybody sees): resolve the `device_class: battery` sensor of the same `device_id`, fall back to `attributes.battery_level`, else show "—" instead of 0 % red. The slider context has no `hass` today; pass the resolved value or a reader in.
- **A — `persistent_notification/subscribe`**: a module store (events `current`/`added`/`updated`/`removed` → map), one subscription per connection in the DataProvider, `extractPersistentNotifications` reads the store, the `state_changed` branch for these entities goes; the existing seed guard keeps the first `current` from raising a toast storm.
- **C — child devices**: `device.area_id ?? parent.area_id` at the three room-chain sites, `via_device_id || parent_device_id` for sub-devices; feature-detect the field (older HA has none). The field shape is for the user to check on a 2026.9 instance; no probe from this side.

**Hook (verified):** `src/providers/dataNotifications.js:28–50` (scan of `hass.states` for the `persistent_notification.` prefix), `src/hooks/useEntityStream.js:248–251` (refresh only on their `state_changed`); `persistent_notification/subscribe` — 0 hits in `src`. `src/utils/deviceConfigs/domains/vacuum.js:84` (`attributes.battery_level ?? 0`), `:88–92` (red below 20). `src/providers/entityZulassung.js:55–58` and `src/utils/homeAssistantService.js:268–270` (room chain; `:266–267` are the `entity_category` lines), `entityZulassung.js:29–31` (`hatRaum`) and `:133` (drop in the stream), `src/system-entities/entities/integration/device-entities/universalEintraege.js:102` (`via_device_id` only); `parent_device_id` — 0 hits.

**Effort:** Small × 3 (3–4 h, 2–3 h, 3–4 h); 8–11 h in total, Medium by the sum. No design question in any of them.

**Why it fits:** In the kiosk the card is the only surface the household sees — a contract HA changed and the card did not follow is invisible to everyone in the house; and each repair is a slice without a design question, the size this project ships in.

**Files (estimate):** `utils/persistentNotificationStore.js` (new), `providers/dataNotifications.js`, `providers/DataProvider.jsx`, `hooks/useEntityStream.js`, `deviceConfigs/domains/vacuum.js`, `utils/deviceConfigs.js` (context), `providers/entityZulassung.js`, `utils/homeAssistantService.js`, `device-entities/universalEintraege.js`.

---

### 70. State words in the search — "licht an", "was ist offen", "alles aus"

**Pitch:** The intent parser understands room and domain. It does not understand state. Typing "licht an" today fuzzy-matches the two letters "an" against names. A third parsed field — state — turns the search into the place where a family asks the two daily questions: what is still on, what is still open.

**Status quo:** `parseSearchIntent` yields `{ area, domain, remaining }`; `applyIntentFilters` filters by `area_id`, `domain` and `device_class` and hands the rest to Fuse. The synonym table has no state words. The chip mechanics (area chip, domain chip, chip filter, Backspace removes a chip) exist. `isEntityActive` already knows the "on" state per domain (cover open, lock unlocked, media playing …). Search results have no bulk action; the multi-select bar has one adopter (to-dos).

**What ships:**
- **Slice 1 — read only.** A de/en state-word table (an/aus/ein/offen/geschlossen/zu, on/off/open/closed/locked/unlocked), a third parser field, a per-domain predicate (cover → open, lock → unlocked, binary_sensor door/window → on, else `isEntityActive`), system views excluded (they report `state: 'active'`), a state chip labelled "an · Zustand" so the reading is filter, not command. Whole words only — "an" must not match Anna or Anbau.
- **Slice 2 — bulk action, own release.** Only when state + (domain or room) are set and N ≤ 50: a line "alle N ausschalten / schließen", two taps in the style of the selection bar, `homeassistant.turn_off` / `cover.close_cover` / `lock.lock` through `dienstAufruf`, a chronicle entry. No undo — brightness and colour are not trivially reversible; the second tap is the guard. *Alternative if the AI-mock decision falls on "build": a `conversation/process` call with HassTurnOff instead of an own verb grammar.*

**Hook (verified):** `src/utils/searchIntent.js:1–10` (examples: area + domain only), `:94–105` (`applyIntentFilters`: area_id/domain/device_class); `src/hooks/useFuzzySearch.js:216–229` (intent → pre-filter → Fuse on the remainder); `src/components/SearchField/hooks/useSearchFieldState.js:95–97` (areaChip, domainChip), `src/components/SearchField.jsx:499–508` (chip filter); `src/utils/translations/helpers.js:189–232` (`isEntityActive` per domain); `src/utils/dienstAufruf.js:82` (never-throwing service call with toast throttle); `src/system-entities/base/SystemEntity.js:269` (`state: 'active'` while mounted — must be excluded).

**Effort:** Medium — 6–8 h for slice 1, 4–6 h for slice 2.

> ⤳ **Addendum 2026-10-25** — a second entry point for slice 2: an "All off" in the room head of the result list, with the same two-tap guard, for the lights of that room that the card shows. No new verb grammar; it reuses slice 2's service path.

**Why it fits:** The search field is the card's premise; the two daily household questions are the one thing it cannot answer yet, and the chip mechanics that answer them already exist.

**Files (estimate):** `utils/searchIntent.js`, `utils/searchSynonyms.js` (state table), `hooks/useFuzzySearch.js`, `SearchField/hooks/useSearchFieldState.js`, `SearchField.jsx`, `SearchField/utils/searchEventHandlers.js` (Backspace), `SearchField/components/SearchInputSection.jsx` (bulk line), `de.js`/`en.js`.

---

### 71. Who is home — the family fact the wall tablet never shows

**Pitch:** The card knows who is home. The person model carries a `person.*` entity and its picture, the wake sources read presence, "nobody home" shortens the screensaver return. No surface says it. One fact in the status line, the avatars of who is present on the locked page, and — as the leftover of #17 — a real greeting when someone arrives.

**Status quo:** The Zen status line shows weather and power. The island's rest roll is by design "exactly the active counts of the category bar" and excludes people. `istJemandDa()` returns true/false/null from the chosen presence entities. There is no people tile. The greeting is a random time-of-day phrase; "Willkommen zurück" is one of them, unrelated to any event; the name shown is the tablet's HA user, never the person arriving. The wake source raises the idle stage on `person/device_tracker → home` but passes only the generic source name, not the entity.

**What ships:**
- **R1 (3 h):** helper `anwesende()` — calendar people with a `personEntity`, otherwise all `person.*` — and the fact "2 zuhause" as a third part of the Zen status line (not in the island roll).
- **R2 (3 h):** avatars of who is present on the locked page (`personAvatar`: picture, initials, colour), respecting deep rest and `data-ambient`.
- **R3 (3–4 h, the #17 leftover):** `weckeLeerlauf(quelle, entityId)` passes the entity; a small arrival store (last arrival, 30-min cooldown per person against GPS flapping); for ten seconds the greeting reads "Hallo Anna" plus the context line, only when the page is locked and outside quiet hours. A toggle under Screensaver → Wake.
- **No tile.** The roadmap lists a geofencing status widget under *Out of scope*, and a tile would sit under the Zen curtain, invisible in rest; presence lives in the status line and on the locked page.

**Hook (verified):** `src/system-entities/entities/todos/utils/personen.js:17–22` (`ladePersonen` = calendar people), `:27–32` (`personAvatar` from `entity_picture`); `calendar/utils/calendarSettingsStorage.js:66–69` (`people[].personEntity`); `src/utils/weckquellen.js:52–53` (`AN = on/home`), `:60–62` (edge off → on/home wakes with source `'bewegung'`), `:93–107` (`istJemandDa`); `src/utils/leerlaufStore.js:91–94` (`weckeLeerlauf(quelle)` — no entity id); `src/components/BentoZenView.jsx:545–566` (status line: temperature + power only), `:568–571` (greeting + username); `src/utils/subcategoryMap.js:53` (`ROLL_ORDER` without people), `:62–66` (roll = category counts, by design); `ls src/components/bento/widgets/` — no people tile.

**Effort:** Three Small slices — R1 3 h, R2 3 h, R3 3–4 h; 9–10 h in total, Medium by the sum. Each a release.

**Why it fits:** The person model (#55/#65) and the wake sources (#62) already carry presence — this is the second consumer the momentum pass named cheapest, and it makes #62's "nobody home" visible instead of only effective.

**Files (estimate):** `utils/anwesenheit.js` (new), `components/BentoZenView.jsx` + `.css`, `utils/weckquellen.js`, `utils/leerlaufStore.js`, `components/tabs/SettingsTab/components/startscreen/BildschirmschonerAbschnitt.jsx`, `register/startseite.js`, `suche/vorgaben.js`, `de.js`/`en.js`, `docs/info-popups/info-popups-catalog.md`.

---

### 72. Context lines, stage two — weather change, birthday countdown, all-day tomorrow, a custom line

> ◐ **Partial — v1.1.2472** (2026-10-02): **S1 shipped** — `naechsterWechsel` in `utils/wetterVorhersage.js` reads the hourly cache (12 h horizon, nothing from a cache older than 3 h); "Regen/Schnee/Gewitter/Hagel ab 17 Uhr" when it is dry now, "Trocken ab 16 Uhr" after at least two dry hours in a row when it is wet. Fourth truth in the rotation, between tasks and the last house event. The cache is refreshed from the alert lane's existing 30-s tick, at most every 30 min, never in deep rest or a hidden tab; the entity is the one the Zen status line shows. A failed fetch no longer overwrites a good forecast. S2–S4 are open.

**Pitch:** #57 ships three truths in rotation: next appointment, due tasks, last house event. Four small sentences are missing, and the data for every one of them is now in the bundle: "Regen ab 17 Uhr", "In 3 Tagen: Oma", "Morgen: Restmüll", and one line the household chooses itself.

**Status quo:** The provider explicitly leaves weather change out ("needs forecast data") — that was true in August. Since #47 (v2443) `wetterVorhersage.js` holds an hourly forecast cache per weather entity, filled only while the calendar is open. The next-appointment truth skips all-day events, so the evening-before reminder (#58b) exists as a notification but never as a context line. Birthdays carry the 🎂 rule icon in the calendar, but neither the tile nor the context line counts down to them; the reminder stock holds only −1 h … +48 h. The Bento calendar tile loads −30/+14 days but never applies the rules.

**What ships (each slice one release):**
- **S1 — weather change.** `naechsterWechsel(entityId, now, 12 h)` over `hourly`: the first entry with rainy/pouring/snowy/snowy-rainy/lightning/lightning-rainy/hail when the present condition is dry (optionally the reverse, "Trocken ab 15 Uhr"). Fourth truth in the rotation. The rule that matters: **no fetch in rest** — read the cache with a longer freshness (≥ 30 min), trigger a load only when the card is awake (`!istTief()` and `!document.hidden`). Silent when the integration delivers no `hourly`.
- **S2 — birthday countdown.** The next event within 14 days whose resolved rule icon is 🎂, read from the calendar entity's `attributes.events` (the tile's canonical range), as "In 3 Tagen: Oma" / "Heute: Oma". No hero in the tile (the user removed the hero split in v1656); optionally the rule icon before the title in the tile rows.
- **S3 — all-day tomorrow.** From the evening hour of #58b: one sentence from tomorrow's all-day events, filtered by rule icon or group ("Morgen: 🗑️ Restmüll", "Heute essen wir: Lasagne" from a Mealie calendar). This is the honest remainder of #18 and #20.
- **S4 — one custom line.** An entity picker (any `sensor.*`/`input_text.*`): its state becomes a fifth truth. No Jinja in the card — a household that wants a template makes a Template helper in HA and picks it. (A `render_template` field is a separate decision, not part of this entry.)

**Hook (verified):** `src/utils/kontextZeilen.js:12–14` (explicit omission of weather change), `:38–88` (`holeKontextZeile`: three truths, rotation `:84–87`); `src/utils/wetterVorhersage.js:6` (`FRISCH_MS` 10 min), `:27–47` (`ladeVorhersage`, cache `{hourly, daily, zeit}`), `:5` ("no fetch in rest — only while the calendar is open"); `system-entities/entities/calendar/CalendarView.jsx:205–211` (the only filler, 10-min interval); `src/utils/reminderStore.js:44–49` (stock −1 h … +48 h), `:108–121` (`naechsterTermin` skips `all_day`), `:145–160` (30-min data refresh gated on `kontextZeilenAktiv`); `calendar/utils/eventRules.js:27` (🎂 in `RULE_ICONS`), `:73–87` (`resolveEventStyle`); `src/components/bento/widgets/BentoRichCalendar.jsx:113–124` (−30/+14 days), `:302–306` (hero removed v1656), import block `:5–30` (no `eventRules`); `src/utils/reminderSources.js:157–186` (all-day tomorrow builder, per the checker).

**Effort:** S1 ≈ 4 h (on the Small/Medium line), S2 2–3 h, S3 2 h, S4 2 h — Small each; ≈ 10 h in total, Medium by the sum.

**Why it fits:** No surface of its own — the #13 reason stands ("a second forecast line … did not justify a surface"); these are sentences in the rotation #57 already runs, fed by data #47 and #58 already load.

**Files (estimate):** `utils/wetterVorhersage.js`, `utils/kontextZeilen.js`, `utils/reminderStore.js`, `components/bento/widgets/BentoRichCalendar.jsx` (S2 icon), `components/tabs/SettingsTab/components/GeneralSettingsTab.jsx` (S4 picker), `register/allgemein.js`, `suche/vorgaben.js`, `de.js`/`en.js`, `info-popups-catalog.md`.

---

### 73. Forecast by subscription, and the temperature bar

**Pitch:** Three callers fetch the same forecast on their own timers — the calendar every 10 minutes while open, the Bento weather tile every 10 minutes on the resting start page, the weather device on demand. `weather/subscribe_forecast` pushes once on subscribe and then only when the integration updates. One module-level subscription per (entity, type) replaces three timers, and the hourly strip gains the cold→warm temperature bar and precipitation probability HA's own Tile card shows since 2026.6.

**Status quo:** `wetterVorhersage.js` calls `weather.get_forecasts` with `return_response` and caches 10 minutes; `BentoRichWeather.jsx` makes two `get_forecasts` calls and runs its own 10-minute interval, writing a second cache (`weatherForecastCache` in `bento/constants.js`); `WeatherDeviceEntity.js` calls the same service. `subscribe_forecast` appears nowhere. A `TemperatureBar` component exists for the weather device's daily view but not on the tile.

**What ships:**
- **S1:** a ref-counted subscription per (entity, forecast type) inside `wetterVorhersage.js`, gated on `supported_features` (DAILY = 1, HOURLY = 2), `get_forecasts` as fallback for entities without the bits, 30-s grace on unsubscribe, re-subscribe on `hass.connection` change. The calendar drops its interval and only listens.
- **S2:** the Bento tile reads the same cache; its two calls and its interval go; `weatherForecastCache` becomes an alias or disappears (adjust `cachesLeeren.js`). Optionally the weather device too.
- **S3:** hourly strip with the temperature bar (inline style variables, no composed class names — PurgeCSS guard) and precipitation probability, shown only when the integration delivers `precipitation_probability`. chart.js untouched.

**The one trap:** the tile remounts every slider cycle; a subscription in a component effect would subscribe/unsubscribe in bursts. It must live at module level with a counter.

**Hook (verified):** `src/utils/wetterVorhersage.js:6` (`FRISCH_MS`), `:27–47` (`get_forecasts` with `return_response`, hourly + daily in parallel, cache map, listener notify); `system-entities/entities/calendar/CalendarView.jsx:207–208` (10-min interval, paused when hidden); `src/components/bento/widgets/BentoRichWeather.jsx:99–131` (two `get_forecasts` calls, second cache), `:142–152` (10-min interval with remaining-time start); `src/components/bento/constants.js:31` (`weatherForecastCache`); `device-entities/WeatherDeviceEntity.js:173–180` (third caller); `device-entities/components/weather/TemperatureBar.jsx:19–30` (existing bar); `subscribe_forecast` — 0 hits.

**Effort:** Three Small slices — S1 3–4 h, S2 2–3 h, S3 3–4 h; 8–11 h in total, Medium by the sum.

**Why it fits:** The weather tile runs on the resting start page, where "zero long-runners in rest" is strictest; one push subscription replacing three timers is the thermal pattern of v2285 applied to the last fetch loop.

**Files (estimate):** `utils/wetterVorhersage.js`, `calendar/CalendarView.jsx`, `bento/widgets/BentoRichWeather.jsx`, `bento/constants.js`, `utils/cachesLeeren.js`, `device-entities/WeatherDeviceEntity.js` (optional).

---

### 74. Reminders name the person

**Pitch:** "2 Aufgaben überfällig" — whose? The card knows: each list maps to a person (#65). The reminder and the context line just never say it. "Anna: Wäsche · Post · Max: Müll" in the same single aggregate.

**Status quo:** `offeneAufgaben` and `buildTodoReminders` aggregate over all lists and know no list or person; `namenszeile` lists up to three titles. The to-dos view reads `settings.lists[listId].personId` from the same item stream to count per person. #58 decided deliberately on one aggregate per kind, calmer than per item — that decision stands.

**What ships:**
- **S1:** `reminderStore` passes a `listId → person` map and `ladePersonen()` into `buildTodoReminders` and the context line (`reminderSources` stays pure — the map is an argument); the message line groups titles by person; title and instance semantics unchanged, so ack and snooze behave as before. Plural forms de/en.
- **S2 (only if a household wants to acknowledge per person):** one instance per person (`rem:overdue:<pid>`) with runtime slots as a map — doubles toasts at the day change, therefore not by default.
- **S3 (only on request):** an optional points sensor per person in the person editor; the person chip in the to-dos filter bar shows its value (ChoreOps/KidsChores as display, not competitor). Read throttled — `hass` changes identity every tick.

**Hook (verified):** `src/utils/reminderSources.js:87–97` (`offeneAufgaben`, list-agnostic), `:104–147` (`buildTodoReminders`: `rem:overdue` / `rem:due`, day slots), `:66–71` (`namenszeile`); `src/utils/reminderStore.js:57–68` (call site with `todosEntity.attributes.todos`); `src/utils/kontextZeilen.js:53–65` (same computation, "overdueMany"); `system-entities/entities/todos/TodosView.jsx:508` (`settings.lists?.[t.listId]?.personId`); `todos/utils/personen.js:17–22`.

**Effort:** Small — S1 ≈ 3 h; S2 ≈ 2 h; S3 ≈ 3 h.

**Why it fits:** #65 put a person on every list and #58 put the aggregate in the lane — the sentence between them is missing, and it keeps #58's one-aggregate decision.

**Files (estimate):** `utils/reminderSources.js`, `utils/reminderStore.js`, `utils/kontextZeilen.js`, `de.js`/`en.js`; S3: `calendar/components/settings/views/PersonEditor.jsx`, `todos/TodosView.jsx`.

---

### 75. Wake sources, round two — reminders wake, the doorbell by standard

**Pitch:** The tablet wakes for the smoke detector, not for the dentist. A new appointment reminder lifts deep rest by one stage, like motion does. And the doorbell is found by `device_class: doorbell` and `event_type: ring` first — the standard HA makes mandatory in 2027.4 — with the name regex as fallback.

**Status quo:** `weckeBeiKritisch` fires only for CRITICAL; reminders are INFO/WARNING. The doorbell picker lists every `event.*` and `button.*` plus binary sensors matching `/klingel|doorbell|bell|ring|ding/`, and on the stream an `event.*` doorbell wakes on **every** state change — an event entity with `[ring, motion]` wakes on motion too. `in_zones` (2026.7) is not read; that part is deliberately left out — it needs a zone the household has not drawn and is known-buggy in 2026.7.0.

**What ships:**
- **S1 (2.5 h):** field `erinnerung` in the wake settings; in the lane, next to the critical wake: `if (neue.some(n => n.source === 'reminder' && n.id.startsWith('rem:event:') || …morgen)) weckeBeiErinnerung()` — deliberately from `neue`, so quiet hours and snooze already apply; **only appointment reminders and the evening-before line, never the task aggregates** (they get a fresh instance at midnight and would wake the tablet at night). Toggle under Screensaver → Wake, register, info text.
- **S2 (2 h):** `listKlingelKandidaten` ranks `event.*` with `device_class doorbell` (and `event_types` containing `ring`) first, regex hits second, the rest last; `beobachteWeckquellen` wakes for a doorbell-class event only on `attributes.event_type === 'ring'`, otherwise as today.

**Hook (verified):** `src/utils/weckquellen.js:27–38` (`readWeckquellen`: bewegung/kritisch/klingel/abwesendKurz/display), `:65–73` (doorbell edge; `event.*`/`button.*` on any state change, no `event_type` read), `:84–87` (`weckeBeiKritisch`), `:116` (`KLINGEL_MUSTER`), `:133–152` (`listKlingelKandidaten`); `src/hooks/useNotificationLane.js:92–93` (`neue` with snooze and quiet-hours filter), `:114–116` (critical wake, deliberately without quiet hours); `src/utils/reminderSources.js:194–222` (`rem:event:*` INFO), `:104–147` (task aggregates with day slots).

**Effort:** Two Small slices (2.5 h + 2 h); 4–5 h in total, Medium by the sum.

**Why it fits:** Second consumer of the wake sources (#62) — the lane already knows which reminders are new and quiet-hours-filtered; and the doorbell change moves the card to the standard before HA makes it mandatory.

**Files (estimate):** `utils/weckquellen.js`, `hooks/useNotificationLane.js`, `startscreen/BildschirmschonerAbschnitt.jsx`, `startscreen/useBildschirmschoner.js`, `register/startseite.js`, `suche/vorgaben.js`, `de.js`/`en.js`, `info-popups-catalog.md`.

---

### 76. Renamed entities — an orphan check first, a live follower second

**Pitch:** Since 2026.8 renaming an entity ID is one click in HA. The card stores IDs in at least ten places — wake sources, island sources, auto-brightness sensor, display handoff, weather-warning entities, watches, calendar map, favourites, builder devices — and listens to nothing. Settings orphan silently: the island shows no weather, the doorbell stops waking, a watch never fires again.

**Status quo:** The only event subscription is `state_changed`. `entity_registry_updated` (action `update`, `entity_id`, `old_entity_id`) is not read anywhere. Each store has a central `read*`/`write*` with a broadcast, so a rewrite has one place per store.

**What ships (order matters — the skeptic is right that a live event only reaches browsers that are open):**
- **S1 — orphan check at start (3 h):** every registered store is checked against `hass.states`; a stored ID that no longer exists produces a line in the settings ("Weckquelle `binary_sensor.flur_alt` gibt es nicht mehr") using the "Changed" mechanics of #46. Covers the closed tablet and the closed phone too, because it runs at the next start.
- **S2 — live follower (5–6 h):** `utils/idUmschreiber.js` subscribes to `entity_registry_updated` only (not to everything — audit B08), gates on `action === 'update' && old_entity_id`, and calls the registered rewriters: wake sources, island sources, auto-brightness, display handoff, weather warnings, watches; then the existing broadcasts fire.
- **S3 (4–5 h):** favourites (set + IndexedDB + snapshot), builder configs (HA user_data, async — local first, then HA), calendar maps (re-key, group members, person sources; mind the dot-in-key trap of `setPath`).

**Hook (verified):** `src/hooks/useEntityStream.js:292` (`subscribe_events state_changed` — the only subscription); `entity_registry_updated`/`old_entity_id` — 0 hits; stored IDs: `src/utils/weckquellen.js:30–36`, `src/utils/islandSources.js:17–21`, `src/utils/autoHelligkeit.js:20`, `src/utils/displayUebergabe.js:33–35`, `src/utils/weatherAlertSources.js:23–29`, `src/utils/watchStore.js:27` (`fsc-watches-v1`) and `:41–45` (`defs.entity_id`); calendar map and favourites per the checker; builder: `integration/deviceConfigStorage.js:86–114` (HA user_data).

**Effort:** Small (S1) + Medium (S2 + S3 ≈ 9–11 h).

**Why it fits:** HA made renaming a one-click action in 2026.8; the card stores IDs in ten places with one write function each — the orphan check is a small correctness slice in the style of the September fix releases.

**Files (estimate):** `utils/verwaisteIds.js` (new), `utils/idUmschreiber.js` (new), the stores listed above, `components/tabs/SettingsTab/components/AboutSettingsTab.jsx` or the settings search ("Changed" list).

---

### 77. number and select as controls — the fallback stops being read-only

**Pitch:** A `number.*` or `input_number.*` shows its value, min, max and step on a ring the user cannot move; `select.*` and `input_select.*` show their current option as a status text. Both are one service call away: `number.set_value`, `select.select_option`. The Universal list already has the controls; the single-entity detail view does not.

**Status quo:** The fallback's numeric branch sets `interactive: false, readOnly: true, progressMode: true`; the text branch shows the capitalised raw state. The domain registry has no number/input_number/select/input_select. The builder's universal ring says "read-only; settable rings → later". The slider dispatcher knows light/climate/cover/media_player/fan/humidifier/water_heater. In the Universal entity list, `NumberSliderControl` calls `number.set_value` and `SelectPickerView` calls `select_option` — the same controls, one level down.

**What ships (modules, not a flag — the protected single-entity rings stay bit-identical and `fallback.js` is not touched):**
- **A (3–4 h):** `domains/number.js` for number + input_number: slider from attributes (value/min/max/step/unit), interactive, commit on release only (no service call per intermediate value), `mode: box` or a range above ~1000 keeps the read-only ring; handler `${domain}.set_value` with rounding to `step`.
- **B (4–6 h):** `domains/select.js` for select + input_select: ≤ 4 options as primary buttons (humidifier-mode pattern with active flag), otherwise an expandable that reuses `SelectPickerView`; `select_option`; the status text is the current option.
- **C (5–6 h):** the builder's universal ring becomes settable for number-type heroes; the universal control path gets `onValueChange` per ring by entity id; fingerprint before/after.

*(A skeptic's side finding on `NumberSliderControl.jsx:37` — `number.set_value` sent for `input_number` too — is audit material, recorded for the audit findings list, not in this entry.)*

**Hook (verified):** `src/utils/deviceConfigs/domains/fallback.js:28–43` (numeric branch, `interactive: false`, `readOnly: true`), `:45–62` (text branch); `src/utils/deviceConfigs/registry.js:24–41` (no number/select); `src/utils/deviceConfigs/rings.js:250` ("settbare Ringe → späterer Ausbau"); `src/utils/sliderHandlers.js:7–98` (handlers for seven domains, `executeSliderChange`); `src/components/controls/NumberSliderControl.jsx:37` (`number.set_value`), `SelectPickerView.jsx:39` (`select_option`).

**Effort:** Medium — A + B ≈ 8–10 h, C ≈ 5–6 h.

**Why it fits:** Domain configs are the card's unit of device support; number and select are the largest domains still in the fallback, and the Universal list proves both controls one level down.

**Files (estimate):** `deviceConfigs/domains/number.js` (new), `deviceConfigs/domains/select.js` (new), `deviceConfigs/registry.js`, `utils/sliderHandlers.js`, `components/controls/PresetButtonsGroup.jsx` (renderCustom branch), `deviceConfigs/rings.js`, `components/tabs/UniversalControlsTab.jsx`, `de.js`/`en.js`.

---

### 78. Calendar rules, stage two — lead time per rule, weekday form

**Pitch:** The event reminder fires 15 minutes before everything. School needs 60, a flight 180, the dentist 15. Rules already resolve colour, icon, dim, badge and hide per event by rank; a sixth property, lead minutes, falls through the same resolution and the reminder source reads it. A fifth condition — weekday / weekend — completes the form set without becoming a grammar.

**Status quo:** `eventLeadMinutes` is one global number in the reminder settings; `buildEventReminders` applies it to every timed event and skips all-day events (those have the evening-before line of #58b — a birthday needs no lead). The rule editor's THEN block has three toggles (dim, badge, hide). `reminderSources` is pure and does not know the calendar settings; the reminder stock holds +48 h and its coverage guard asks for `now + lead`.

**What ships:**
- **S1 (4 h):** `leadMinutes` as sixth property in `resolveEventStyle` (first rule that sets it wins), a THEN row in the rule editor with the existing lead steps (15/30/60/180, ∅ = global), `buildEventReminders` takes `leadFor(ev)` (rules + settings passed in, source stays pure), `terminVorratAktualisieren` claims coverage for the **largest** lead of any rule; register, defaults, info text.
- **S2 (2 h):** rule kind `weekday` (Mon–Fri / Sat–Sun pill) in `ruleMatches` and the editor — with `hide` this gives "this calendar only on weekends".
- **Not built:** title rewriting (twelve render sites and a second truth for the title the search would not find), age from the description (a parser with its own display — later, if #72 S2 shows demand). "Birthday evening before" is already solved by #58b.

**Hook (verified):** `calendar/utils/eventRules.js:22` (`RULE_KINDS` title/source/allDay/past), `:24` (`RULE_FIELDS`), `:36–66` (`ruleMatches`, pure, `ctx = {settings, now}`), `:73–87` (`resolveEventStyle` → color/icon/dim/badge/hide); `src/utils/reminderSources.js:24–32` (`eventLeadMinutes: 15` global), `:198` (`leadMs` for every event), `:202` (all-day skipped), `:218` (`created_at = start − lead`); `src/utils/reminderStore.js:40–43` (coverage guard `e >= now + leadMs`), `:44–49` (stock +48 h); `calendar/components/settings/views/RegelEditor.jsx:208–227` (three THEN toggles).

**Effort:** S1 4 h, S2 2 h; 6 h in total, Medium by the sum.

**Why it fits:** #54 chose forms over a grammar; lead time and weekday are the two forms a family calendar still lacks, and both fall through the same `resolveEventStyle`.

**Files (estimate):** `calendar/utils/eventRules.js`, `calendar/utils/calendarSettingsStorage.js` (rule schema), `calendar/components/settings/views/RegelEditor.jsx`, `utils/reminderSources.js`, `utils/reminderStore.js`, `calendar/components/settings/register.js`, `de.js`/`en.js`, `info-popups-catalog.md`.

---

### 79. Floors and labels — the registry fields the card already holds and never copies

**Pitch:** The honest core of #5 without a drawing surface. `hass.areas[id]` carries `floor_id` and `labels`, `hass.entities[id]` carries `labels`, `hass.floors` exists on the hass object — and the two enrichers copy hidden/device/area but neither. One related-devices score already compares `entity.floor_id`, which is never set: a dead path since day one.

**Status quo:** `reichereAusHassAn` (stream) and `enrichAllEntitiesWithAreas` (loader) both read the area object and the registry entry and copy `hidden_by`, `entity_category`, `device_*`, `area_*`. `useRelatedDevices` scores `device.floor_id === entity.floor_id` (+30) — the only two occurrences of `floor_id` in the tree. The registry loaders fetch area/device/entity lists; no floor or label registry.

**What ships:**
- **S1 (2 h, one release):** copy `floor_id`, `floor_name`, `floor_level`, `labels` in both enrichers (stream = loader, the guard rule), names from `hass.floors` (fallback `config/floor_registry/list`); `useRelatedDevices:99` becomes live. Visible only in the context tab — a pure data slice.
- **S2 (5 h):** floor as an intent token in `searchIntent.js` (name + aliases, tried before the area pass), `applyIntentFilters` on `floor_id`, room chips in the subcategory bar grouped by `level` when at least two floors exist ("og licht", "unten alles aus" together with #70).
- **S3 (5 h, only on demand):** label registry (`config/label_registry/list`, once at start), label as intent token, a `labels` mode in the chip bar and the filter window.

**Hook (verified):** `src/providers/entityZulassung.js:47–72` (`reichereAusHassAn`: reads `hass.entities[id]` `:48` and `hass.areas[areaId]` `:67`, copies no `labels`/`floor_id`); `src/utils/homeAssistantService.js:255–296` (`enrichAllEntitiesWithAreas`, same fields), `:151–197` (`config/area_registry/list`, `device_registry/list`, `entity_registry/list` — no floor/label registry); `src/hooks/useRelatedDevices.js:99` and `:120` (`entity.floor_id` read, never set — grep confirms these are the only hits); `src/utils/searchIntent.js:20–88` (area/domain parser).

**Effort:** Small (S1) + Medium (S2), S3 optional.

**Why it fits:** Two enrichers, four lines — a dead scoring path becomes live, and it is the honest core of #5 without a drawing surface.

**Files (estimate):** `providers/entityZulassung.js`, `utils/homeAssistantService.js`, `providers/entitiesLoader.js`, `hooks/useRelatedDevices.js`, `utils/searchIntent.js`, `components/SubcategoryBar.jsx`, `components/SearchField.jsx`.

---

### 80. Dictation in the search line and the calendar title

**Pitch:** `utils/diktat.js` is generic — Assist STT over the existing socket or the browser's recognition, text lands in a field, never submitted on its own, no button when no path exists. It has one importer: the to-do form. Typing is the most expensive gesture on a wall tablet and the search line is its most used surface.

**Status quo:** The state machine (path probe on open, `hoert`/`fehler`/`aus`, abort marker from N6e, cleanup on unmount) and the button markup live inline in `TodoFormDialog.jsx`. The calendar event dialog imports the to-do detail styles for its title input, so the button CSS already applies there. The search input has a suffix-button slot (clear button) and a typing-loop sheet that hides on focus.

**What ships:**
- **S1 (2–3 h):** lift state + button into `hooks/useDiktat.js` + `components/common/DiktatKnopf.jsx` (behaviour 1:1; the to-do form uses the hook), then place it beside the calendar title (`onText → setSummary`); move the `dictate*` dictionary keys to a shared bucket (i18n guard).
- **S2 (3–4 h):** the search line — button in the input overlay next to clear/AI, `onText → handleSearchInput` (intermediate results may search live here), focus set so the typing sheet stays hidden, visible only when `!aiMode` and a path exists, `diktatVerfuegbar` once per connection (the field is mounted permanently — not per render). Check island height ladder at tablet width.

**Hook (verified):** `src/utils/diktat.js:1–20` (generic; microphone only from a visible tap, text never auto-submitted), `:49` (`diktatVerfuegbar`), `:196` (`starteDiktat`); importers: `todos/components/TodoFormDialog.jsx` only (`:17`, state machine `:430–476`, per the checker button `:553–570`); `calendar/components/CalendarEventDialog.jsx:36–38` (imports `TodoDetailView.css`), `:313–321` (`todo-detail-title-input`); `SearchField/components/SearchInputSection.jsx:480–494` (`search-input` with focus handlers), `:547–559` (`clear-button` slot).

**Effort:** Two Small slices (2–3 h + 3–4 h); 5–7 h in total, Medium by the sum. Bundle ≈ +1 KB. No new listeners in rest.

**Why it fits:** The #66 rule — no button where no path exists — already governs the module; lifting it to the two most-typed fields is the second-consumer move, not a new feature.

**Files (estimate):** `hooks/useDiktat.js` (new), `components/common/DiktatKnopf.jsx` (new), `todos/components/TodoFormDialog.jsx`, `calendar/components/CalendarEventDialog.jsx`, `SearchField/components/SearchInputSection.jsx`, `SearchField.jsx`, `de.js`/`en.js`.

---

### 81. `todo/item/subscribe` — push instead of the signature watcher

**Pitch:** #56 watches `state|last_updated` of every `todo.*` entity and reloads all lists, debounced, when a signature changes. Its own header admits the limit: a pure rename changes neither the count nor necessarily `last_updated`. HA has had `todo/item/subscribe` since the todo platform exists (2023.11): one subscription per list pushes the items on every change, rename included.

**Status quo:** `liveTodos.js` compares signatures per hass tick and calls `getTodos` (parallel `todo/item/list` over all lists) 400 ms later; own mutations register a lock so their own `state_changed` does not trigger a second load. `subscribeMessage` is used in two places already (state stream, dictation). `move_item` and Bit 8 (`MOVE_TODO_ITEM`) are unknown to the card.

**What ships:**
- **S1 (3–4 h):** `todos/todoAbos.js` — one `subscribeMessage({ type: 'todo/item/subscribe', entity_id })` per `todo.*` entity, push → map the items of that one list into `entity.attributes.todos` → `updateAttributes` + `fsc-todos-geaendert`; `liveTodos` keeps only the list discovery (new/gone lists) and stops reloading; subscriptions keyed on `hass.connection` (re-subscribe on reconnect, as the stream does). Follow-up: `mitNeuladen` after own mutations becomes unnecessary.
- **Later, separate entry material:** a "list order" sort mode gated on Bit 8 with `todo/item/move` (uid, previous_uid) and a long-press drag handle — Medium-plus because of touch-drag in a scrolling list and because today's four sort modes never preserve HA's order.

**Hook (verified):** `todos/liveTodos.js:21–23` (the admitted limit), `:104–116` (`pruefen`: signature `state|last_updated`, 400-ms debounced `neuLaden`), `:85–96` (`neuLaden` via `getTodos` + `fsc-todos-geaendert`); `todos/index.jsx:418–421` (`todo/item/list` per list); `move_item`/`todo/item/subscribe` — 0 hits; `todos/hooks/useListFeatures.js:33–37` (bits 1/2/4 read, no bit 8).

**Effort:** Small — 3–4 h. No timer, push only; thermally neutral.

**Why it fits:** #56 shipped with an admitted limit in its own header; the push API closes it with no timer, which is the thermal direction of every September release.

**Files (estimate):** `todos/todoAbos.js` (new), `todos/liveTodos.js`, `todos/index.jsx`.

---

### 82. The kitchen timer — a `timer.*` domain config

**Pitch:** Timer is live-activity number one and counts as active on the tile, but nowhere in the card can a timer be started, paused or cancelled; the detail view shows the word "Active" on a grey ring. A domain config with a remaining-time ring, start/pause/resume/cancel/finish, and a duration wheel with 1/5/10/30-minute presets makes the wall tablet the kitchen timer it should be.

**Status quo:** `liveActivitySources` derives `endsAt` and `progress` from `finishes_at` and `duration`; the registry has no timer module, so the fallback's text branch renders; `timer.start|pause|cancel|finish` appear nowhere. A stop/cancel on the island capsule is a separate decision (it reverses v2204/v2205 "live rows have no action buttons") and is not part of this entry.

**What ships:**
- `domains/timer.js`: ring in progress mode (value = remaining/duration, centre m:ss, colour by remaining), a 1-s tick **only while the detail view is open, the timer is active and the card is awake** (rest gate) — no ticking anywhere else; buttons start/pause/resume/cancel/finish; expandable "Dauer" with presets and the existing wheel → `timer.start { duration }`. No slider handler (the ring is not dragged).
- Info text names the precondition: timer helpers have no room by default and are otherwise reachable only as deep-link guests while running.

**Hook (verified):** `src/utils/liveActivitySources.js:19` (`DOMAIN_PRIORITY` timer 0), `:130–141` (`endsAt`, `progress` from `finishes_at`/`duration`); `src/utils/deviceConfigs/registry.js:24–41` (no timer); `deviceConfigs/domains/fallback.js:45–62` (text branch → "Active"); `src/components/DeviceCard.jsx:230–233` (timer counts as active); timer services — 0 hits in `src` (the `'timer'` hits in `ScheduleTab/` are scheduler-component tabs).

**Effort:** Medium — 6–8 h, one release.

**Why it fits:** Timer is already live-activity number one on the island (#29); the detail view is the one place it cannot be operated — a domain config, the card's normal unit.

**Files (estimate):** `deviceConfigs/domains/timer.js` (new), `deviceConfigs/registry.js`, `components/controls/PresetButtonsGroup.jsx` (renderCustom for the duration wheel), `de.js`/`en.js`.

---

### 83. The context tab tells the truth about relatedness

**Pitch:** The context tab's "related devices" are guessed from words — a sensor whose name contains "temperatur", a media player containing "soundbar" — and an entity without a room is assumed to be in the "Wohnzimmer". The honest relations are already attached to every entity (`device_id`, `area_id`) or one WebSocket call away (`search/related`: which automations and scenes move this entity). This is what remains of #26 after the room tile was dropped.

**Status quo:** `isFunctionallyRelated` is a name heuristic; the score falls back to `entity.area || 'Wohnzimmer'`, adds +30 for a `floor_id` that is never set (#79 S1 fixes that) and +60 for an entity-id substring. `device_id` is enriched at load but never read by the hook. `search/related` appears nowhere; the action list links scenes only through `attributes.entity_id`.

**What ships:**
- **0a (2–3 h):** siblings via `device_id` (+90), room via `area_id` with no fallback, substring rule only as a tie-breaker.
- **0b (3 h):** on opening the context tab, `hass.callWS({ type: 'search/related', item_type: 'entity', item_id })` once per entity, cached; automation/scene/script hits get a "moves this device" bonus in the action list; errors silent, the heuristic stays as fallback.

**Hook (verified):** `src/hooks/useRelatedDevices.js:12–49` (`isFunctionallyRelated`: name words), `:71` (`entity.area || 'Wohnzimmer'`), `:93` (same room +100), `:99` (dead floor score), `:102` (entity-id substring +60); `src/providers/entityZulassung.js:59` (`device_id` enriched); `search/related` — 0 hits.

**Effort:** Small × 2 (2–3 h + 3 h); 5–6 h in total, Medium by the sum.

**Why it fits:** The context tab guesses where the registry knows; `device_id`/`area_id` are the fields #79 S1 and #69 C also touch, so the three land in the same enrich path.

**Files (estimate):** `hooks/useRelatedDevices.js`, `components/tabs/ContextTab.jsx`, `utils/actionUtils.js`.

---

### 84. Watch kinds — free state, immediate, critical, unavailable

**Pitch:** The in-card watch knows two kinds: a numeric threshold with hysteresis and "state X for N minutes". Two household wishes fall between them: "tell me the moment the lock says jammed, as an alarm" and "tell me when the window sensor has been unavailable for 30 minutes". Both are openings of the duration kind, not a new store type.

**Status quo:** `addWatch` normalises every unknown kind to `threshold` and clamps severity to INFO/WARNING; the duration evaluation fires when `state === watchState` for `minutes` — with `minutes = 0` it fires at once, so "state with level" is technically there. The editor offers duration only for a fixed domain set and fixed state options; `unavailable` is not offered; `sensor`, `alarm_control_panel`, `vacuum` are excluded. A "last_updated older than" check is deliberately not built — after an HA restart every restored state gets a fresh `last_updated`, and integrations with availability checks already report `unavailable`.

**What ships:**
- **A (2–3 h):** allow CRITICAL in `addWatch`, allow `minutes = 0` ("sofort"), add `unavailable` as a state option, extend `DURATION_DOMAINS` (sensor, alarm_control_panel, vacuum, climate, person); message texts "Zustand X" / "seit N Min. nicht erreichbar".
- **B (3–4 h):** the authoring sheet moves from a boolean `durationMode` to a kind enum, sentence form "Sag mir, wenn ⟨Zustand⟩ · ⟨sofort | N Min⟩", state list = options + the entity's current state, level Alarm/Warnung/Info under "Mehr Optionen"; register, info text.

A user-set CRITICAL triggers banner, double tone and wake from deep rest — quiet hours with `allowCritical` apply; that is the point, and the info text says so.

**Hook (verified):** `src/utils/watchStore.js:40–46` (two kinds documented), `:75–90` (`addWatch`: kind normalised, severity clamped to INFO/WARNING), `:125–134` (`nextFiringState`, threshold hysteresis); `src/utils/watchSuggestions.js:57–61` (`DURATION_DOMAINS`), `:68–72` (`STATE_OPTIONS`); `src/utils/notificationSources.js:37–45` (fixed danger list — the watch is the sanctioned per-entity route, #3 "explicit boundary").

**Effort:** Small × 2 (2–3 h + 3–4 h); 5–7 h in total, Medium by the sum.

**Why it fits:** #3 drew the explicit boundary — a fixed danger list plus a per-entity watch; opening the watch's kinds keeps that boundary instead of growing the list.

**Files (estimate):** `utils/watchStore.js`, `utils/watchSuggestions.js`, `components/tabs/ContextTab/WatchAuthoringSheet.jsx`, `de.js`/`en.js`, `info-popups-catalog.md`.

---

### 85. Wall-tablet lock — a PIN before settings and reset, HA's code on unlock

**Pitch:** Children and guests reach "Alle Daten zurücksetzen" (two native confirms, then `localStorage.clear()`) and, with Quick Control on, the risky direction of a lock or a garage door after a one-second hold. A four-digit PIN — stored locally, hashed, honestly labelled as a slip-of-the-finger guard, not security — in front of the settings view and the reset; and for locks and alarm panels the card should send HA's own `code` instead of inventing a second one.

**Status quo:** The reset path is `confirm → confirm → localStorage.clear() → reload`. Quick Control's hold fires `callService(domain, service, { entity_id })` with no code; `code_format` is read nowhere, so a code-protected lock fails silently today. There is no `alarm_control_panel` module (fallback), so "alarm disarm" is not a button in the card at all. `hass.user.is_admin` is not read anywhere.

**What ships:**
- **S1 (3–4 h):** setting "Tablet-Sperre" under General (set/change/remove PIN, four digits, simple hash — `crypto.subtle` is unavailable over http, so a small hash of our own), a PIN window as MorphPopup with a number pad, gate at the mount of the settings view (not at the opener — the settings search and `fsc-open-appearance` jump straight in) and before reset/cache in About; five-minute release after a correct PIN. The two native `confirm()`s become MorphPopup dialogs. Info text states the way out when the PIN is forgotten.
- **S2 (4–6 h):** HA code support — read `code_format` on locks (and alarm panels once a module exists), ask for the code in the same window, pass it to `lock.unlock` / `alarm_disarm`; server-verified, real security. Quick Control's hold defers `fire()` until the code is entered.

**Hook (verified):** `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx:104–107` (cache clear with one confirm), `:138–145` (double confirm → `localStorage.clear()` → reload); `src/components/QuickControlIcon.jsx:20` (`HOLD_MS = 1000`), `:42` (`fire()` without code); `code_format` and `is_admin` — 0 hits; `src/components/common/MorphPopup.jsx` (dialog primitive, per the checker `:149–162`).

**Effort:** Small (S1) + Medium (S2).

**Why it fits:** The wall tablet is a shared, unlocked screen; the reset path and Quick Control's risky direction are the two places a child's tap costs data or opens a door — and HA's `code` is the standard path the card skipped.

**Files (estimate):** `utils/tabletSperre.js` (new), `components/common/PinFenster.jsx` (new), `components/tabs/SettingsTab.jsx`, `AboutSettingsTab.jsx`, `GeneralSettingsTab.jsx`, `components/QuickControlIcon.jsx`, `deviceConfigs/domains/lock.js`, `register/allgemein.js`, `suche/vorgaben.js`, `de.js`/`en.js`, `info-popups-catalog.md`.

---

## Part twelve — 2026-10-02 one agenda (#86–#90)

Five entries from reading a combined calendar-and-tasks agenda card against the code at v1.1.2474. Ideas only. Its premise is one sentence: appointments and tasks answer the same question, so they belong in one timeline. The card already agrees on the notification side and not in the calendar itself.

---

### 86. One agenda — tasks live in the calendar

> ✅ **Shipped v1.1.2491** (2026-10-26) — `calendar/utils/aufgabenImKalender.js` + `hooks/useAufgabenFuerKalender.js` (reads the to-do entity, listens only while the calendar is open and the mode is not off); open tasks with a due date stand on their day in the list, the day columns and the person lanes, with the to-do app's checkbox (one `todo.update_item`), a hollow dot per day in the month; "Overdue" block above today (stacked like the to-do app) and an optional "No date" block; setting Calendar → Tasks (Off / Due / Due and overdue, default Due) plus "Tasks without a date"; a tap on the row opens the task in the to-do app. Days are built in local time; the to-do app's own overdue helpers still read plain dates as UTC (west of UTC a task due today counts as overdue there) — not changed here. Deviations from the plan above: own settings section instead of under Display, plain-date tasks before timed entries, the jump into the task shipped.

**Pitch:** A task due on Thursday appears on Thursday, among that day's appointments, with its checkbox. Above today: what is overdue. One place answers "what is coming up".

**Status quo:** Calendar and to-dos are two apps. The calendar code never touches a to-do (verified: no to-do reference anywhere in `calendar/`). The card nevertheless merges both sources already, for the alert lane (`utils/reminderSources.js`) and for the context line (`utils/kontextZeilen.js`). The notification side knows that a dentist appointment and a due task belong to the same question. The calendar view does not.

**What ships:**
- **S1 (4–5 h):** dated open tasks render in day, week, day columns and the month's day strip, below the timed events of their day. A task row carries a checkbox and its list's colour; a tap opens the task in the to-dos app. Ticking uses the existing `toggleComplete`; the row stays in place, struck through, until the view closes, so the tick can be taken back. Home Assistant stores no completion time, so "recently done" cannot survive a reload.
- **S2 (2–3 h):** an overdue block above today, stacked as in #67. Tasks without a date stay out by default, because a calendar is about dates; a switch brings them in.
- **S3 (2–3 h):** month cells mark tasks with a hollow dot, so the dot row keeps reading as appointments. Person lanes (#55) show each person's tasks in their lane through the shared person model.
- **Setting:** Calendar → Display → tasks in the calendar: off / due / due and overdue.
- **One rule:** a task with a date and no time never gets an invented 00:00. Several providers store dates only.

**Out of scope:** creating tasks from the event dialog. The dialog stays events-only here.

**Hook (verified):** `calendar/CalendarView.jsx:534` (`visibleEvents`, the one memo every view reads), `:993–1030` (event row); `calendar/components/DayColumns.jsx`, `LaneColumns.jsx`, `PeopleLanes.jsx`; `todos/index.jsx:130` (`getTodos`), `:346` (`toggleComplete`), `:368` (`completeMany`), `:504` (`_getOverdueTodos`); `utils/reminderSources.js` (the existing merge of both sources); live changes arrive through `fsc-todos-geaendert` (#56).

**Effort:** Medium — 8–11 h in three slices.

**Why it fits:** A second consumer for the to-do data and for the person model, and the step that completes the family week of #55.

**Files (estimate):** `calendar/CalendarView.jsx`, `calendar/components/DayColumns.jsx`, `LaneColumns.jsx`, `PeopleLanes.jsx`, `calendar/utils/aufgabenImKalender.js` (new), `calendar/utils/calendarSettingsStorage.js`, `CalendarSettingsView.jsx`, settings register, `de.js`/`en.js`, info-popup catalog.

---

### 87. One event, one row — duplicates across calendars

> ✅ **Shipped v1.1.2478** (2026-10-03) — `calendar/utils/doppelte.js` (`fasseDoppelteZusammen`, key: normalised title, start, end, all-day, normalised location; no uid); list rows show up to three colour dots and joined source names, day/week cards up to three bars, a colour rule still wins; people columns merge only within a column; notification lane, context line, content search and Bento tile use the same helper; setting `display.mergeDuplicates` (on).

**Pitch:** The same appointment held in two calendars shows once: a shared family calendar and a personal copy, or a holiday feed subscribed twice.

**Status quo:** There is no duplicate handling (verified: none in `calendar/`). A forum user reported exactly this, "can't get rid of a double calendar entry". The only remedy today is switching a whole calendar off, which removes its other events too.

**What ships:**
- Events equal in title, start, end and location (case and whitespace normalised) collapse into one row.
- The row carries the colour bars of all its source calendars, so nothing disappears silently. Month dots count the event once.
- Tapping opens the first writable instance (see #88).
- **Person lanes are exempt across lanes.** An event in two people's calendars stays in both lanes, because that is the information. Collapsing applies within one lane or one day cell only.
- A switch under Calendar → Display, on by default.

**Hook (verified):** `calendar/CalendarView.jsx:534` (`visibleEvents`), the month dot map built from it, `calendar/components/PeopleLanes.jsx`; colours come from `resolveEventStyle` and the per-calendar colour.

**Effort:** Small — 3–4 h.

**Why it fits:** Closes an open user report with a filter over data already loaded.

**Files (estimate):** `calendar/CalendarView.jsx`, `calendar/utils/doppelte.js` (new), `calendarSettingsStorage.js`, `CalendarSettingsView.jsx`, register, `de.js`/`en.js`, info-popup catalog.

---

### 88. The calendar knows what a source can do

> ✅ **Shipped v1.1.2477** (2026-10-03) — `calendar/utils/kalenderRechte.js` (create 1, delete 2, update 4); new-event targets, preselection and the default-calendar picker list writable calendars only, a notice replaces the form when none is writable, Save/Delete follow the bits with a read-only line otherwise. To-do form bits corrected to 16/32/64 in the same release. **Not shipped:** the refresh part — the calendar has no refresh button, so `update_entity` on refresh was dropped by user decision.

**Pitch:** Read-only calendars are not offered as a target for new events, edit and delete controls are absent where they cannot work, and the refresh button asks the integration for fresh data.

**Status quo:** `listCalendars` (`calendar/index.jsx:64`) builds its entries from name, state and icon. `supported_features` is not read anywhere in `calendar/` (verified). The dialog offers every calendar (`CalendarEventDialog.jsx:558`), so saving to a holiday or birthday feed fails after the form is filled in, with the error line at `:515`. The to-dos app reads its bitmask (`todos/hooks/useListFeatures.js:33`), but with the wrong bits: it takes 1, 2 and 4 for date, time and description, which in Home Assistant are create, delete and update. The right ones are 16, 32 and 64 (checked against `homeassistant/components/todo/const.py`). A list that can delete items therefore counts as "supports a time of day". Fixed in the same release. Refresh (`CalendarView.jsx:371`) re-queries Home Assistant, but Home Assistant polls remote calendars on its own schedule, so an event just added on the phone does not appear.

**What ships:**
- `listCalendars` carries `supported_features`; create is bit 1, delete bit 2, update bit 4.
- The dialog's target list holds writable calendars only, and the default falls back to the first writable one. With none writable, the add button explains instead of opening a form that cannot succeed.
- Event detail shows edit and delete only where the bit is set, otherwise a quiet "read-only" line.
- Refresh calls `homeassistant.update_entity` for the visible calendars and then reloads. Throttled to once per 30 s, because remote calendar APIs rate-limit.

**Hook (verified):** `calendar/index.jsx:64` (`listCalendars`), `calendar/components/CalendarEventDialog.jsx:153–156` (default target), `:558` (target list), `:515` (error line), `calendar/CalendarView.jsx:371` (`handleRefresh`), `todos/hooks/useListFeatures.js:33–38` (wrong bits, to be corrected).

**Effort:** Small — 3–4 h.

**Why it fits:** A repair in the manner of #69: the card asks for something the source has already said it cannot do.

**Files (estimate):** `calendar/index.jsx`, `calendar/utils/kalenderRechte.js` (new), `calendar/components/CalendarEventDialog.jsx`, `calendar/CalendarView.jsx`, `todos/hooks/useListFeatures.js`, `de.js`/`en.js`.

---

### 89. Time at a glance — relative labels and the running event

> ✅ **Shipped v1.1.2479** (2026-10-03) — `utils/minutenTakt.js` (one timeout aligned to the full minute, only with subscribers and a visible page), `calendar/utils/relativeZeit.js` and two leaf components; list rows get "in 45 min." / "tomorrow" / "in 3 days", running events a 2 px `scaleX` line; columns show minutes and hours only (the header names the day), narrow columns the line only; weekend headers tinted in month, day columns and week grid; settings `display.relativeTime`, `display.weekendTint`.

**Pitch:** "in 45 min", "tomorrow", next to the absolute time. Under the event that is running now, a thin line showing how far along it is.

**Status quo:** Event rows show absolute times only (`CalendarView.jsx:993–1030`). On a wall tablet read in passing, an absolute time asks for arithmetic.

**What ships:**
- A relative label for items today and tomorrow and for timed items in the next hours. The absolute time stays. `Intl.RelativeTimeFormat` supplies both languages, so the phrases need no dictionary keys.
- The running event gets a 2 px line in its calendar colour, filled to the elapsed share. On that row the line replaces the relative label: one signal per row.
- Saturday and Sunday headers get a quiet tint, following the configured first day of the week.
- **Thermal rule:** no per-second timer and no animation. One minute tick, only while the calendar view is mounted and the page is visible, and none in deep rest. No shared minute tick exists today (verified); this adds a small one that other minute-level surfaces can share.

**Hook (verified):** `calendar/CalendarView.jsx:993–1030` (row and `timeStr`), `calendar/components/DayColumns.jsx` and `LaneColumns.jsx` (cards and headers).

**Effort:** Small — 3–5 h.

**Why it fits:** The calendar is read from across the room more often than it is operated; this serves the reading.

**Files (estimate):** `calendar/CalendarView.jsx`, `calendar/components/DayColumns.jsx`, `LaneColumns.jsx`, `utils/minutenTakt.js` (new), `calendar/styles/CalendarView.css`, `calendarSettingsStorage.js`, register, `de.js`/`en.js`, info-popup catalog.

---

### 90. A location that opens a map

> ✅ **Shipped v1.1.2480** (2026-10-03) — `calendar/utils/kartenLink.js` (location only through `encodeURIComponent` into fixed OSM / Google / Apple-or-`geo:` templates; web-address-like locations stay search terms); list location as `<a target=_blank rel="noopener noreferrer">` that does not open the event, "Open map" button in the editor; setting `display.locationLink` (off by default); SECURITY.md outbound paragraph.

**Pitch:** Tap an event's location and it opens in a maps app.

**Status quo:** The location is plain text (`CalendarView.jsx:1029`) and searchable (`:555`). It leads nowhere.

**What ships:**
- The location becomes a link. Off by default.
- A provider choice: the device's own maps app, OpenStreetMap or Google Maps. The card fetches nothing itself; it only opens the link.
- **Privacy, stated plainly:** this is the card's first outbound link built from the user's own data. The address reaches the chosen provider on a deliberate tap and at no other time. `docs/SECURITY.md` lists outbound destinations and has to be updated in the same release, and the setting's info popup says the same in one sentence.
- On a kiosk tablet a new tab can be a dead end. That is the second reason for the default.

**Hook (verified):** `calendar/CalendarView.jsx:1029` (location span), `calendar/components/CalendarEventDialog.jsx` (location field in the detail).

**Effort:** Small — 2–3 h.

**Why it fits:** Small, and honest about the one thing it changes: where data can go.

**Files (estimate):** `calendar/CalendarView.jsx`, `calendar/components/CalendarEventDialog.jsx`, `calendarSettingsStorage.js`, `CalendarSettingsView.jsx`, register, `de.js`/`en.js`, info-popup catalog, `docs/SECURITY.md`.

---

## Part thirteen — 2026-10-25 household devices and the quiet details (#91–#97)

Seven entries from reading two room-by-room dashboard projects against the code at v1.1.2482. Ideas only, nothing taken from their code. Both are integrations with an editor of their own, so most of what they do needs a server part the card does not have: the editor and its versions, switch-off timers, pushes to the lock screen. What follows works over Home Assistant's standard APIs. Not taken: "turn off in 30 min" timers, because a card only keeps time while one of its instances is open (requirements input for #22); a solar-surplus hint, which waits on D3; syncing acknowledgements across devices, which is D14.

---

### 91. The alarm panel gets a view of its own

**Pitch:** One large button says what will happen: "Arm · Away", "Disarm", "Cancel" with the countdown while arming, a red "Stop alarm" while triggered. The other modes sit below it. Before arming, the card names up to three open windows, doors or unlocked locks: "Heads up: kitchen window open, front door unlocked".

**Status quo:** `alarm_control_panel` has no domain config. The registry maps seventeen domains (`utils/deviceConfigs/registry.js:28–43`); the alarm panel falls into the generic fallback (`utils/deviceConfigs/domains/fallback.js:22`), which shows the state text and nothing to press. #85 brings HA's code on unlock and reads `code_format`; arming is not covered there.

**What ships:**
- A domain config with the states `disarmed`, `arming`, `pending`, `armed_home`/`away`/`night`/`vacation`/`custom_bypass` and `triggered`, and the modes the panel offers through `supported_features`.
- The services `alarm_control_panel.alarm_arm_*` and `alarm_disarm`. A code field only when `code_format` is set and, for arming, `code_arm_required`. The code input is shared with #85.
- The warning before arming reads entities already loaded: `binary_sensor` with device class door, window, garage_door or opening in state `on`, and `lock` in state `unlocked`. Up to three are named, the rest are counted. Arming stays possible; the warning is the second tap.
- Disarming never warns.

**Hook (verified):** `utils/deviceConfigs/registry.js:28–43`, `utils/deviceConfigs/domains/fallback.js:22`; open/unlocked predicates as in `isEntityActive` (`utils/translations/helpers.js`); #85 for the code input.

**Effort:** Medium — 6–8 h.

**Why it fits:** A safety device that a wall tablet can see but not operate is the largest domain gap, next to the ones #77 and #82 already name.

**Files (estimate):** `utils/deviceConfigs/domains/alarmControlPanel.js` (new), `registry.js`, `de.js`/`en.js`, info-popup catalog.

---

### 92. Household appliances live — washer, dryer, dishwasher

**Pitch:** A running washer shows its progress, the time left and the program. When it is done, the card says "Done, laundry inside" until the door is opened or the state moves on.

**Status quo:** The live sources cover timer, vacuum, cover, media player, script, automation and, opt-in, light, switch and climate (`utils/liveActivitySources.js:19`, `:100`). Appliances are missing. The notification design names "appliance finished" as an Info example, but the lane has no appliance logic (verified: no match in `providers/dataNotifications.js`).

**What ships:**
- **S1 — recognise.** An appliance is a device whose entities include a remaining-time or finish-time sensor (`device_class` duration or timestamp) together with an operation state or program sensor. Matched by device, not by name, through the `device_id` the entity gate already copies onto each entity (`providers/entityZulassung.js:56–59`). A smart plug with a power threshold is the fallback for machines without integration.
- **S2 — live.** The appliance becomes a live source: progress bar, finish time and program in one line. Ends when the operation state leaves running.
- **S3 — the lane.** "Done" enters the alert lane as Info and leaves it when the state changes again. The lane follows state, as everywhere else.
- **Thermal rule:** no polling, no per-second timer. The remaining time is derived from the finish timestamp on the shared minute tick.

**Hook (verified):** `utils/liveActivitySources.js:19` (`DOMAIN_PRIORITY`), `:100` (`extractLiveActivities`); `providers/entityZulassung.js:56–59` (`device_id`); `providers/dataNotifications.js` (lane); `utils/minutenTakt.js` (shared minute tick, #89).

**Effort:** Medium — 8–10 h in three slices.

**Why it fits:** The machine that finished is the most common household notification, and the lane already claims it in its design.

**Files (estimate):** `utils/geraeteLauf.js` (new), `utils/liveActivitySources.js`, `providers/dataNotifications.js`, live-activity settings, `de.js`/`en.js`, info-popup catalog.

---

### 93. Tidying the notification center — swipe, clear all, undo

**Pitch:** Swipe a notification left to remove it. "Clear all" empties the list and offers "Undo" for ten seconds.

**Status quo:** Each row has its own remove button (`system-entities/entities/notifications/NotificationsView.jsx:375`, `dismiss` from `useNotifications` at `:69`). There is no bulk action and no undo in the center. The undo store (`utils/undoStore.js:64`, `mitRueckgaengig`) and the selection primitive (`hooks/useMehrfachauswahl.js`) exist and are used elsewhere.

**What ships:**
- Swipe-to-remove on touch, with the remove button as the visible alternative. The swipe direction must not collide with the back swipe of the detail view.
- "Clear all" with one confirmation, then `mitRueckgaengig` for ten seconds.
- **One rule:** clearing a real `persistent_notification` calls HA's dismiss, which cannot be undone. Those wait until the undo window has passed; local acknowledgements apply at once.

**Hook (verified):** `NotificationsView.jsx:69`, `:375`; `utils/notificationState.js:123` (`acknowledgeNotification`); `utils/undoStore.js:64`.

**Effort:** Small — 3–4 h.

**Why it fits:** Two existing primitives get a second consumer, and the center loses its last one-by-one chore.

**Files (estimate):** `NotificationsView.jsx`, `NotificationsView.css`, `de.js`/`en.js`.

---

### 94. A ventilation hint in the context line

**Pitch:** "Open the windows now: it is drier outside." Shown when a room is humid and the outside air holds less water.

**Status quo:** The weather entity's `dew_point` is read (`system-entities/entities/integration/device-entities/WeatherDeviceEntity.js:150`) and used nowhere. The context line has its sentence builder (`utils/kontextZeilen.js:64`, `holeKontextZeile`). Indoor humidity and temperature sensors are already grouped per room for the room head.

**What ships:**
- Absolute humidity indoors from temperature and relative humidity of the same room, outdoors from the forecast's temperature and dew point.
- The hint appears when indoor relative humidity is above a threshold (default 65 %) and the outdoor absolute humidity is clearly lower. It names the room when only one qualifies.
- No hint while it rains or below a configurable outside temperature.
- **Thermal rule:** computed when the line is built, never on a timer of its own.

**Hook (verified):** `WeatherDeviceEntity.js:150`; `utils/kontextZeilen.js:64`.

**Effort:** Small to medium — 3–5 h.

**Why it fits:** A second consumer for the weather data and the room sensors, and a reason to look at the wall tablet that no tile gives.

**Files (estimate):** `utils/lueftHinweis.js` (new), `utils/kontextZeilen.js`, settings register, `de.js`/`en.js`, info-popup catalog.

---

### 95. Scenes first in a category

**Pitch:** Filter for "Licht" and the scenes that switch lights come first, above the lamps.

**Status quo:** Scenes are tiles of their own subcategory. A domain filter shows the lamps only (`utils/searchIntent.js:94`, `applyIntentFilters`). A scene entity lists the entities it sets in `attributes.entity_id`; the card does not read it (verified: no match).

**What ships:**
- When the intent carries a domain, scenes whose `entity_id` attribute contains at least one entity of that domain lead the result list. With a room as well, only scenes that touch that room.
- At most three, so the lamps stay visible. A scene that is currently active shows it.

**Hook (verified):** `utils/searchIntent.js:94`; scene tiles from the scene/script/automation config (`utils/deviceConfigs/registry.js`).

**Effort:** Small — 2–3 h.

**Why it fits:** The quickest way to "light for the evening" is usually a scene, and the data that links the two is already loaded.

**Files (estimate):** `utils/searchIntent.js` or `hooks/useFuzzySearch.js`, `de.js`/`en.js`.

---

### 96. Motion sensors say when they last saw someone

**Pitch:** "11 h ago" instead of "Not detected".

**Status quo:** Motion, moving and occupancy share one state word (`utils/translations/helpers.js:34`). The detail header already formats elapsed time (`components/DetailView/useDetailHeaderInfo.js:15`, `formatTimeAgo`). Whether list row and tile show it was not checked.

**What ships:**
- In the clear state, list row and tile show the time of the last detection.
- **Honesty rule:** `last_changed` resets when Home Assistant restarts. The time is taken from the last `on` in history, one `history/history_during_period` call per sensor when it is first shown, cached until the next state change.
- Over seven days the date replaces the elapsed time.

**Hook (verified):** `utils/translations/helpers.js:34`; `components/DetailView/useDetailHeaderInfo.js:15`; `services/sensorStatistics.js` (existing `history_during_period` caller).

**Effort:** Small — 3–4 h.

**Why it fits:** "Not detected" is true and useless; the last detection is the information.

**Files (estimate):** `utils/zuletztErkannt.js` (new), `utils/translations/helpers.js`, list row and tile state text, `de.js`/`en.js`.

---

### 97. Say why the card chose something

**Pitch:** Where the card picks a value on its own, a line underneath says why: "Chosen automatically: battery sensor on the same device."

**Status quo:** The card chooses silently in several places: the battery sensor of a device (`utils/batterieSensor.js:76`, `batterieStand`), presence (`utils/weckquellen.js:93`, `istJemandDa`), the weather entity, the default calendar. The settings search knows which values differ from their default (`components/tabs/SettingsTab/suche/vorgaben.js`), but not how an automatic value came about.

**What ships:**
- The choosing functions return a reason code next to the value: same device, name match, only candidate, first writable.
- Settings rows with an automatic value show the reason in their subline. A wrong pick becomes visible and correctable in one place.

**Hook (verified):** `utils/batterieSensor.js:76`; `utils/weckquellen.js:93`; `components/tabs/SettingsTab/suche/vorgaben.js`.

**Effort:** Small — 3–4 h.

**Why it fits:** It makes the configuration-free premise checkable: the card still decides, but no longer in the dark.

**Files (estimate):** `utils/batterieSensor.js`, `utils/weckquellen.js`, the settings rows that show automatic values, `de.js`/`en.js`.

---

## Part fourteen — 2026-10-25 music on the wall tablet (#98–#100)

Three entries from reading a pair of touch-first Music Assistant cards for wall tablets against the code at v1.1.2482. Ideas only, nothing taken from their code. That project ships a small integration of its own; its two largest features, synchronised lyrics and a recommendations tab, run through it and went to #22 as requirements input. Already in the card and not repeated here: radio mode after a track, moving the queue to another speaker, grouping, load-more in the library, feedback lines on play. *(Corrected 2026-11-02: the queue itself shows only the current and the next item; rows from the own library need no server and are #134, see #22.)*

---

### 98. A single track plays now and keeps the queue

**Pitch:** Tap one song in the library and it plays at once. What was queued stays queued behind it.

**Status quo:** A tap on a track inside an album or playlist calls `play_media` with `enqueue: 'replace'` (`components/controls/ma/BrowseTab.jsx:59` → `components/controls/MusicAssistantPanel.jsx:232–243`), and so does the play button of a search hit (`components/controls/ma/SearchTab.jsx:196`), so one tap throws the whole queue away. The direct-play branch at `components/controls/ma/useMaBrowse.js:194` serves the top-level sections, which hold no tracks (`components/controls/ma/BrowseTab.jsx:17–24`); in practice it plays radio stations. The play helper already accepts every mode Music Assistant knows, `play`, `replace`, `next`, `replace_next` and `add` (`utils/musicAssistant.js:104`, `:113–118`). Search hits and album tracks offer play, next and add as separate actions (`components/controls/ma/SearchTab.jsx:196–198`, `components/controls/ma/BrowseTab.jsx:59–61`), all through one handler (`components/controls/MusicAssistantPanel.jsx:232–248`).

**What ships:**
- A single track uses `enqueue: 'play'`: it starts now, the rest of the queue is kept.
- Albums, playlists, artists and radio stations keep `replace`. A container is a decision for a new queue; a single track usually is not.
- With radio mode on, a single track keeps today's behaviour, because radio mode builds a new queue by design.
- The feedback line says which of the two happened.
- Inside an album or playlist, #135 S3 plays the container from the tapped track where `start_item` exists (Home Assistant 2026.11); `enqueue: 'play'` stays the fallback and the rule for search hits. *(added 2026-11-02)*

**Hook (verified, corrected 2026-11-02):** `components/controls/ma/BrowseTab.jsx:59`; `components/controls/ma/SearchTab.jsx:196`; `components/controls/MusicAssistantPanel.jsx:232–243`; `utils/musicAssistant.js:104`, `:113–118`.

**Effort:** Small — 1–2 h.

**Why it fits:** One parameter, and the most common accidental loss in the music panel stops happening.

**Files (estimate):** `components/controls/ma/BrowseTab.jsx`, `components/controls/ma/SearchTab.jsx`, `MusicAssistantPanel.jsx`, `de.js`/`en.js`.

---

### 99. Volume limit and starting volume per speaker

**Pitch:** In the children's room the slider ends at 60 %. A speaker left at full volume in the evening starts quieter the next morning.

**Status quo:** The volume slider sends `volume_set` with the raw slider value (`utils/sliderHandlers.js:53–64`). The only bound is the range check 0 to 1 in the service layer (`utils/homeAssistantService.js:89`). Other writers set the volume as well: the AI mode (`utils/kiAktionen.js:89`) and the schedule settings (`components/common/domainSettingsConfigs.js:223`).

**What ships:**
- **Limit:** a per-player setting "maximum volume". The slider's end is the limit, the percentage shown is still the true one. Every writer goes through one clamp, so the AI mode and schedules cannot step past it.
- **Starting volume:** optional. When a player changes to `playing` while its volume is above the starting value, the card sets it down once.
- **Honesty rule, stated in the info popup:** the starting volume only acts while a card instance is open. The limit is a limit of the card, not of the speaker; a phone app can still go louder.

**Hook (verified):** `utils/sliderHandlers.js:53–64`; `utils/homeAssistantService.js:89`; `utils/kiAktionen.js:89`; `components/common/domainSettingsConfigs.js:223`.

**Effort:** Small — 3 h.

**Why it fits:** A wall tablet in a family is operated by children too; a limit belongs where the slider is.

**Files (estimate):** `utils/lautstaerkeGrenze.js` (new), `utils/sliderHandlers.js`, `utils/homeAssistantService.js`, media-player settings, register, `de.js`/`en.js`, info-popup catalog.

---

### 100. Next and previous are sent once more when nothing happened

**Pitch:** Some cast players swallow the first "next". If the title has not changed after 2.5 s, the card sends the command a second time.

**Status quo:** The transport buttons call `media_next_track` and `media_previous_track` once (`utils/deviceConfigs/domains/mediaPlayer.js:40`, `:52`). Nothing checks whether the player followed.

**What ships:**
- After next or previous, the card remembers `media_content_id`, or title and artist when there is none. If neither has changed after 2.5 s and the player is still playing, it sends the command once more. Never a third time.
- A newer press cancels the pending repeat.
- A switch under the media-player settings, on by default.

**Hook (verified):** `utils/deviceConfigs/domains/mediaPlayer.js:40`, `:52`.

**Effort:** Small — 1–2 h.

**Why it fits:** A transport button that sometimes does nothing reads as a broken card, whichever side the fault is on.

**Files (estimate):** `utils/deviceConfigs/domains/mediaPlayer.js`, media-player settings, `de.js`/`en.js`.

---

## Part fifteen — 2026-11-02 the wall tablet's manners (#101–#119)

Nineteen entries from reading the documentation of a kiosk browser app for Android wall tablets against the code at v1.1.2507; every hook below was re-read at v1.1.2509, and nothing from the list shipped in v1.1.2508 or v1.1.2509. Ideas only, nothing taken from its code or text. Much of what the app does is out of reach for a card in a browser: it switches the panel off with device rights, reads its own camera and light sensor, holds a microphone open for a wake word, stays in front as the home screen and restarts itself after a crash. Those parts were not transferable; where Home Assistant offers an entity for them, the card already uses one or can. What follows works over Home Assistant's standard APIs. It is grouped around five building blocks that several entries share: the source and position of a gesture, an intermediate stage in the deep-rest store, hold reasons in the idle store, a background without `url()` for black and gradients, and the tablet's identity in a "This tablet" section. Not taken: hidden corner actions (the gesture budget of #25 is spent), a sunrise wake light and an alarm list (#7: time logic belongs in HA), creating timer helpers from the card (#16, the config write path the card refuses), free time ranges for rest profiles (#61), a picture per motion in the house chronicle (D8, #19), camera streams as a screensaver (the heat rule, v1.1.2152), the card as a page of its own outside a dashboard, a tablet-to-tablet call with replies (it fills HA's bell for every user), own entities and events for the tablet's state (a server part, requirements input for #22), and the app's JavaScript bridge, which contradicts #49 and is listed as decision D15. Music, speaker and announcement ideas from the same pass went to Part seventeen (#128–#140). The bundle stands at 650 370 bytes gzip (v1.1.2509), 10.4 KB over the warning and 49.6 KB under the limit. No entry needs a library, but together they would not fit, so each names its cost and most need measuring.

---

### 101. Repair: deleting a merged event deletes every copy — then one event for several people

> ✅ **S1 shipped v1.1.2518** (2026-11-03) — merged rows carry `kopien` (one member per calendar, the row's own first, `utils/doppelte.js`; two entries in the same calendar are not copies). The edit dialog and the row window show *In all N calendars* (default) · *Only here*. "All" updates every copy (title, time, all-day and place are shared by the #87 key; description and recurrence go to the other copies only when changed, otherwise each keeps its own) and deletes every copy under one undo window with a tombstone per uid; copies in calendars without the update/delete bit are skipped and named (for delete at the tap, and they stay visible), failures named per calendar in one toast. The dialog reports whether the recurrence was changed (rule rebuilt the dialog's way, not compared with HA's raw text). Honesty rule as built: when the row is a single appointment and a copy is a series occurrence, that copy is changed or deleted only for its `recurrence_id`; otherwise the recurrence scope is unchanged (the dialog has none). S2 (one event for several people) open.

**Pitch:** An appointment held in two calendars shows once since #87. Delete it and it is gone everywhere, instead of coming back from the second calendar at the next load. After the repair: pick two people when creating an event, and it lands in both calendars as one row.

**Status quo:** #87 merges equal events into one row (`system-entities/entities/calendar/CalendarView.jsx:829–832`). The merged row keeps the calendar ids of its members (`quellen`, `system-entities/entities/calendar/utils/doppelte.js:50–58`), not their uids. Delete (`handleDeleteEvent`, `CalendarView.jsx:572–592`) and save (`speichereTermin`, `:543–565`) act on `ev.calendar_id` and `ev.uid` of the one member that stands for the row. So deleting a merged row deletes one copy, and the reload after it brings the event back from the other calendar. An edit changes one copy and the row splits in two. The dialog knows exactly one target calendar (`system-entities/entities/calendar/components/CalendarEventDialog.jsx:180`).

**What ships:**
- **S1 — repair (first, alone).** The merged row carries a pair of calendar id and uid for every member (`doppelte.js:50–58`). Delete and edit ask "In all 2 calendars · Only here" when a row has more than one member. "All" sends one `calendar/event/delete` or `calendar/event/update` per member through the existing WebSocket calls (`system-entities/entities/calendar/index.jsx:245`, `:296`); the recurrence scope (`:250`, `:302`) applies to each. Members in calendars without the delete or update bit (#88, `calendar/utils/kalenderRechte.js:21–23`) are skipped and named. A partial failure is named per calendar. One undo window covers all copies (`utils/undoStore.js:64`).
- **S2 — one event for several people.** Person chips in the dialog with multiple choice plus "Everyone". One `calendar.create_event` per chosen writable calendar (`index.jsx:222`); #87 then shows them as one row. Without a chosen person the dialog keeps its single target.
- **Honesty rule:** copies of a series in two calendars carry their own uids and recurrence ids. "This event only" acts per copy, matched by date.
- No new display: the dots and bars of #87 stay.

**Hook (verified):** `system-entities/entities/calendar/CalendarView.jsx:543–565`, `:572–592`, `:829–832`; `system-entities/entities/calendar/utils/doppelte.js:50–58`; `system-entities/entities/calendar/components/CalendarEventDialog.jsx:180`; `system-entities/entities/calendar/index.jsx:222`, `:245`, `:250`, `:296`, `:302`; `system-entities/entities/calendar/utils/kalenderRechte.js:21–23`; `utils/undoStore.js:64`.

**Effort:** Medium — S1 3–4 h, S2 4–5 h. Bundle ≈ +1–1.5 KB.

**Why it fits:** It is a fault in shipped code: the household deletes an appointment and it comes back. The repair goes first; the multi-person dialog reuses the same pairs.

**Files (estimate):** `calendar/utils/doppelte.js`, `calendar/CalendarView.jsx`, `calendar/components/CalendarEventDialog.jsx`, `calendar/index.jsx`, `de.js`/`en.js`.

---

### 102. The timer rings — what happens when a timer ends

> 🔸 **Part of S1 shipped v1.1.2523** (with #132): the island's done moment plays only when a timer reached its `finishes_at` (judged by HA's `last_changed`), never for a cancel; every finishing row is watched. Open from S1: a `paused` timer staying in the live list.

**Pitch:** The kitchen timer runs out. The resting tablet wakes, the clock face says "Pizza · done" in the clock's own type, with only "Stop" and "+1 min" below it. A tone repeats until someone taps Stop or five minutes pass. A cancelled timer ends quietly.

**Status quo:** A timer is live activity number one, but leaves the list without a trace once its state is not `active` (`utils/liveActivitySources.js:130–131`); a paused timer leaves it too. The island plays a 2-s "done" moment whenever the leading activity disappears, for any reason (`hooks/useIslandMomente.js:57–65`), so a cancelled or paused timer looks finished. #3 names "timer done" as an alert; nothing produces it. The tone module knows one double ping with a 1.5-s debounce (`utils/kritischTon.js:15–16`, `:34–46`). Timer services have no hit in `src` (#82 is open). The rest overlay lets every tap through (`utils/tiefeRuheStore.js:38`).

**What ships:**
- **S1 — paused stays, cancelled is not done.** A `paused` timer stays in the live list with its frozen remaining time. The island's done moment plays only when a timer reached its `finishes_at`.
- **S2 — the ringing moment.** A cheap watcher on the state stream, in the pattern of the wake sources (`utils/weckquellen.js:56`), reads `active → idle`: the old `finishes_at` within ±2 s of now means finished, earlier means cancelled; a manual `timer.finish` counts as cancelled. Finished means: `weckeLeerlauf('timer')` (`utils/leerlaufStore.js:91`), display handoff on, a moment on the Zen clock with the name, and Stop and +1 min (`timer.start` with `duration`). A catching shield over the page makes a tap beside the two buttons do nothing; it is the same element as the cleaning shield of #115 S1 (`utils/schild.js`), built by whichever ships first. An entry in the house chronicle, and an Info entry in the alert lane that Stop acknowledges, as #3 designs and #92 S3 does for appliances.
- **S3 — the tone.** `kritischTon.js` becomes one function with a pattern: critical (today) and timer (new); reminder and doorbell only if wanted. The shared debounce stays. The timer tone repeats with one `setTimeout` per round, only while it rings, with a gentle volume ramp, and stops after a mute time (default 5 min). The test button in the toast settings (`components/tabs/SettingsTab/components/ToastSettingsTab.jsx:192`) gets the pattern choice.
- **S4 — after #82: a named timer from the search line.** "10 min pizza" shows an intent chip "Timer 10:00 Pizza" (`utils/searchIntent.js:20`), never started by itself. It takes the first idle `timer.*`; the name lives on this tablet only. The last used pairs sit below it. Without a timer helper, a hint names the helper; the card does not create one (#16).
- **Per tablet:** which timers ring here (default: all the card shows).
- **Honesty rule:** this only works while a card instance is open and the socket lives. Stop silences this tablet only. After a reload the browser blocks sound until the first touch (`kritischTon.js:7–10`), so the moment must work without sound; nothing rings late after a reload. `timer.finished` is not on HA's subscribe allow-list for non-admins (per the upstream check of this pass), hence the state route.
- **Thermal rule:** no per-second tick; the ringing loop exists only while it rings.

**Hook (verified):** `utils/liveActivitySources.js:19`, `:130–131`; `hooks/useIslandMomente.js:57–65`; `utils/kritischTon.js:7–10`, `:15–16`, `:34–53`; `utils/weckquellen.js:56`; `utils/leerlaufStore.js:91`; `utils/tiefeRuheStore.js:38`; `hooks/useEntityStream.js:281–296` (observers before the batch); `utils/searchIntent.js:20`; `components/tabs/SettingsTab/components/ToastSettingsTab.jsx:192`.

**Effort:** Medium — S1 1–2 h, S2 5–6 h, S3 2–3 h, S4 3–4 h after #82. Bundle ≈ +2–3 KB.

**Why it fits:** A timer that ends invisibly on the device whose job is the kitchen timer is a daily gap. S1 to S3 need neither #82 nor a decision.

**Files (estimate):** `utils/timerEnde.js` (new), `utils/liveActivitySources.js`, `hooks/useIslandMomente.js`, `utils/kritischTon.js`, `hooks/useEntityStream.js`, `components/BentoZenView.jsx` + `.css`, `utils/searchIntent.js` (S4), toast settings, `de.js`/`en.js`, info-popup catalog.

---

### 103. Hold the screensaver while something is going on

**Pitch:** The screensaver no longer closes a half-typed appointment, a live camera or a running dictation. Someone in the room keeps the tablet awake. "Stay awake 1 h" for a party, from the side bar.

**Status quo:** When the screensaver clock fires, it tidies up without asking (`hooks/useZenRueckkehr.js:62–64` → `components/SearchField.jsx:325–340`, `zenSchlafen`): detail view, search, filter, AI mode, a live camera stream in the detail view included. A clock fires once and then rests until the next gesture (`utils/leerlaufStore.js:37–45`); nothing can hold it. Presence counts only on the edge off → on (`utils/weckquellen.js:60–63`): a sensor that stays `on` for two hours does not stop the screensaver, and "nobody there" can only shorten the time (`useZenRueckkehr.js:69–71`). Four clocks hang on the idle store: decor (`components/Island.jsx:172`), island standby (`hooks/useIslandStandby.js:54`), return (`useZenRueckkehr.js:72`) and deep rest (`hooks/useTiefeRuhe.js:80`).

**What ships:**
- **S1 — hold reasons in the idle store.** `halte(grund, { maxMs })` returns a release function; inside is a set of reasons, not a counter. A clock marked as holdable that fires while the set is not empty re-arms itself instead of running its callback; the last release re-arms it. Only return and deep rest are holdable. The decor clock is the heat gate and keeps running. Every reason has a cap (default 30 min), so nothing sticks. Card-internal reasons: the detail view of a running `timer.*`, an open camera stream, dictation listening (`hooks/useDiktat.js:15`), a pending AI answer (`utils/kiStore.js:241–242`; `kiLaeuft` at `:267`, not exported), a dialog with unsent text.
- **S2 — presence holds.** A switch "Stay awake while someone is there". When the clock fires, it asks `istJemandDa()` (`utils/weckquellen.js:93–107`) and re-arms on true. The falling edge, ignored today, re-arms the clock so it fires after the normal time. Only `binary_sensor` with motion, occupancy or presence holds: `person` and `device_tracker` in `home` (both offered by the picker, `:118–131`) would keep the tablet awake all evening. Cap 2 h in a row, never in quiet hours.
- **S3 — by hand.** "Stay awake · 30 min · 1 h · until tonight" in the side bar's ⋮ window and in the screensaver section, with a quiet line "Kept awake until 21:30" and a tap to release. The end time lives in localStorage, so a reload cannot keep it stuck. No new gesture (#25).
- **S4 — from Home Assistant:** through the command helper of #114 (verbs `wach` and `schlafen`), no extra helper here.
- **Thermal rule:** no tick. A held clock re-arms on its own timeout, as today.
- **Honesty rule:** a held tablet is a lit tablet; the info popup says so.

**Hook (verified):** `hooks/useZenRueckkehr.js:62–72`; `components/SearchField.jsx:325–341`; `utils/leerlaufStore.js:37–45`, `:71–81`; `utils/weckquellen.js:60–63`, `:93–107`, `:118–131`; `components/Island.jsx:172`; `hooks/useIslandStandby.js:54`; `hooks/useTiefeRuhe.js:80`; `hooks/useDiktat.js:15`; `utils/kiStore.js:241–242`.

**Effort:** Medium — S1 4–5 h, S2 2–3 h, S3 2–3 h. Bundle ≈ +1.5 KB.

**Why it fits:** The screensaver throws away open work unconditionally. One set of reasons in the store fixes that, and #104 and #114 build on it.

**Files (estimate):** `utils/leerlaufStore.js`, `hooks/useZenRueckkehr.js`, `hooks/useTiefeRuhe.js`, `utils/weckquellen.js`, `components/SearchSidebar.jsx` (⋮ entry), `startscreen/BildschirmschonerAbschnitt.jsx`, `startscreen/useBildschirmschoner.js`, register, `suche/vorgaben.js`, `de.js`/`en.js`, info-popup catalog.

---

### 104. Nobody presses reload — a connection line, a socket warning, stale code that reloads itself

**Pitch:** When the connection to Home Assistant drops, the wall says so quietly: "No connection since 14:32", and the values dim. A tablet that runs stale code reloads itself at night while it rests, and comes back dark, not bright.

**Status quo:** Nothing listens to connection events: no `ready` or `disconnected` listener, no `hass.connected`, no `navigator.onLine` (0 hits). The stream only re-subscribes when `hass.connection` changes (`hooks/useEntityStream.js:232`, `:314`). HA's frontend closes the socket a few minutes after the page is hidden unless the user profile turns that off (`suspendWhenHidden`, 0 hits in `src`). On a tablet whose browser reports a dark panel as hidden, wake sources, lux and notifications then run into nothing during the display handoff. The version watcher knows when code is stale, but reloading waits for a button (`utils/versionWaechter.js:142–149`, `components/StaleLeiste.jsx:21`, `components/tabs/SettingsTab/components/AboutSettingsTab.jsx:41`), and nobody presses it on a wall. After a reload, deep rest only returns after its clock (`hooks/useTiefeRuhe.js:80`), so the tablet starts bright at night. `hatGeschlafen` lives in memory only (`utils/displayUebergabe.js:42`, `:58–63`): after a reload during the handoff, the card never switches the display back on.

**What ships:**
- **S1 — the connection line.** `utils/verbindungStore.js` listens to `disconnected` and `ready` on `hass.connection`. After 20 s offline (one timeout, no tick), the Zen status line and the bell say "No connection since 14:32"; value tiles go to reduced opacity, the clock runs on. On `ready`: drop optimistic locks, read again, repeat nothing. A tap during the outage gets "not sent" from `dienstAufruf` (`utils/dienstAufruf.js:82`). A `connection.ping()` rides the existing reconcile tick while awake (`hooks/useDataProviderEvents.js:95–101`), none in deep rest; it catches half-open sockets after short Wi-Fi drops. Check first whether HA's own reconnect notice shows above the card; no double message.
- **S2 — the socket warning.** With a screen entity chosen and `hass.suspendWhenHidden` not `false`, the handoff section (`startscreen/BildschirmschonerAbschnitt.jsx:394–400`) shows a line that points to the setting in the HA profile. Read only; the card never changes the profile. The info popup also names a known trap: on some Fire OS 8 tablets the panel goes off again seconds after a wake through the screen entity, with no signal to the card.
- **S3 — stale code reloads itself in rest.** When the watcher says stale, deep rest is active and no hold reason is open (#103), the card calls `staleNeuLaden()` itself, at most once per target version (a lock in localStorage against loops). #68's rule stays: only on proven staleness, never as a release hint. A switch, default off, because a reload locks sound until the next touch (`utils/kritischTon.js:7–10`).
- **S4 — start in the dark.** A reload while the page is locked and within quiet hours goes straight to deep rest instead of waiting for its clock. The handoff does not fire before the screen entity's state is known. The last auto-dim state and `hatGeschlafen` go to sessionStorage, so the overlay stands before `hass` arrives and the display wakes again after a reload. S3 ships only together with S4.
- Not built: a reload every N days; no measurement shows a need.

**Hook (verified):** `hooks/useEntityStream.js:232`, `:240`, `:314`; `hooks/useDataProviderEvents.js:95–101`; `utils/versionWaechter.js:142–149`; `components/StaleLeiste.jsx:21`; `components/tabs/SettingsTab/components/AboutSettingsTab.jsx:41`; `hooks/useTiefeRuhe.js:80`; `utils/displayUebergabe.js:20–23`, `:42`, `:58–63`; `utils/kritischTon.js:7–10`; `utils/dienstAufruf.js:82`; `components/tabs/SettingsTab/components/startscreen/BildschirmschonerAbschnitt.jsx:394–400`; `utils/translations/languages/de.js:1508` (`handoffConflict`).

**Effort:** Medium — S1 3–4 h, S2 1 h, S3 2 h, S4 2–3 h. Bundle ≈ +1.5 KB.

**Why it fits:** A wall tablet nobody touches must say when its values are old, and must not run old code for weeks. Each slice is small and needs no decision.

**Files (estimate):** `utils/verbindungStore.js` (new), `components/BentoZenView.jsx`, `components/SearchSidebar.jsx` (bell), `utils/dienstAufruf.js`, `hooks/useDataProviderEvents.js`, `utils/versionWaechter.js`, `hooks/useTiefeRuhe.js`, `utils/displayUebergabe.js`, `utils/autoHelligkeit.js`, `startscreen/BildschirmschonerAbschnitt.jsx`, `de.js`/`en.js`, info-popup catalog.

---

### 105. Deep rest learns stages — who woke it, a reading stage, and its own echo

**Pitch:** Someone walks past the photo frame and the picture stays; the room only gets a little brighter. At 3 a.m. the hallway sensor lifts the dim only a little. A normal notification is readable in deep rest while it stands, without waking the card. "Show now" previews deep rest and the night stage for 20 seconds.

**Status quo:** The gesture listener of deep rest ignores its source and lifts the rest for every one (`hooks/useTiefeRuhe.js:81`), although the idle store passes the source (`utils/leerlaufStore.js:47–53`). The document listener passes neither event nor position (`:55`, `:62`). The store knows two dim values (`utils/tiefeRuheStore.js:22–23`), and the photo blend returns to them (`ruheStufe`, `:49`, `:73`). So motion stops the photo frame, the wallpaper jumps back, and two minutes later it all starts again. Wake sources ignore quiet hours (`utils/weckquellen.js:56–64`): at 3 a.m. the overlay goes from 0.62 to 0. A normal toast stands below the overlay (`styles/toast.css:19`, z-index 10000, under `tiefeRuheStore.js:39`) and is dimmed by 45–62 %; only critical notifications wake (`hooks/useNotificationLane.js:150–151`). The card's own `turn_on` of the screen entity returns as a wake edge (`weckquellen.js:75–80`). To check a setting today one waits 5 + 2 minutes, and the night stage cannot be seen by day (no preview in the screensaver section).

**What ships:**
- **S0 — show now.** "Show now" in the screensaver section starts deep rest at once for 20 s, day or night, photo frame included, never the handoff or a script. Any gesture ends it. Stepping the auto-brightness strength (a tap row through 25–65 %, `startscreen/BildschirmschonerAbschnitt.jsx:447`, `:451`) shows that strength for a few seconds.
- **S1 — the seam.** The idle store hands its listeners `{ quelle, x, y }`; `aufGeste` reads the pointer position (`leerlaufStore.js:55`). `tiefeRuheStore` gets one intermediate-stage API: `oeffne(grund, stufe)` and `schliesse(grund)`, the strongest open reason wins, and `blende()` returns to it instead of the fixed value. One mechanism for the three uses below, not three special paths.
- **S2 — the echo guard.** The store remembers the time of its own last stage change, blend and handoff call. For 20 s after it, motion sources are ignored; doorbell and critical never. This covers the own `turn_on` (`weckquellen.js:75–80`) and a tablet camera that reads a photo blend or the dark panel as motion.
- **S3 — motion keeps the photo.** While the photo frame runs and no handoff is active, motion re-arms the clocks and opens the overlay to a photo stage (about 0.15) instead of lifting the rest; silence closes it again. Touch, doorbell and critical lift as before. A small, stated change to #62's stage discipline, only while the photo frame runs.
- **S4 — a night rule for waking.** "During quiet hours, motion wakes: normally · dimmed · not at all". Dimmed keeps `tief` and opens to 0.45 for 30 s. A light source ends the night: the lux sensor rises above its bright threshold, or a chosen lamp turns on. The lux night and its own gate are built once, shared with #112 S1 (night in deep rest by the lux sensor). The lux edge exists in `bewerteLux` (`utils/autoHelligkeit.js:59–67`) but runs only with auto brightness on (`:70–74`), so the night source gets its own gate. With a screen entity, only "normally" and "not at all" are offered. Honest label: a tablet's own light sensor may report nothing while its panel is dark.
- **S5 — a reading stage for a notification.** While a normal toast stands, the overlay opens to a reading stage without leaving `tief`, without handoff, without stopping the photo frame, and closes after it. `showToast` (`utils/toastNotification.js:39`) gets an end callback; today the toast goes with no callback (`:102–105`). A switch turns it off for the bedroom; the quiet-hours filters apply. Decide together with #75 S1.
- **Thermal rule:** one opacity transition per edge and one `setTimeout` per open stage; nothing runs while a stage stands.

**Hook (verified):** `hooks/useTiefeRuhe.js:53`, `:80–81`; `utils/leerlaufStore.js:47–55`, `:62`, `:84`; `utils/tiefeRuheStore.js:22–23`, `:38–39`, `:49`, `:64–76`, `:89–96`; `utils/weckquellen.js:56–64`, `:75–80`; `utils/autoHelligkeit.js:59–74`; `utils/quietHours.js:48`; `styles/toast.css:19`; `utils/toastNotification.js:39`, `:102–105`; `hooks/useNotificationLane.js:150–151`; `components/tabs/SettingsTab/components/startscreen/BildschirmschonerAbschnitt.jsx:447`.

**Effort:** Medium to large — S0 2 h, S1 3–4 h, S2 1–2 h, S3 2 h, S4 3 h, S5 3 h; each its own release. Bundle ≈ +2 KB in total.

**Why it fits:** Five ideas change the same two lines. Built once, it carries #106, the photo browsing of #107 S4 and the reading stage #75 S1 needs.

**Files (estimate):** `utils/leerlaufStore.js`, `utils/tiefeRuheStore.js`, `hooks/useTiefeRuhe.js`, `utils/weckquellen.js`, `utils/autoHelligkeit.js`, `utils/toastNotification.js`, `hooks/useNotificationLane.js`, `utils/fotorahmen.js`, `startscreen/BildschirmschonerAbschnitt.jsx`, `startscreen/useBildschirmschoner.js`, register, `suche/vorgaben.js`, `de.js`/`en.js`, info-popup catalog.

---

### 106. Display off as a stage of its own

**Pitch:** The photo frame runs for half an hour, then the panel goes dark. Today both happen at the same moment, and with a screen entity the photo frame keeps fetching pictures behind a dark panel.

**Status quo:** Display handoff and photo frame both hang on the entry into deep rest (`utils/displayUebergabe.js:66–79`, `utils/fotorahmen.js:125–129`). With a screen entity set, the photo frame keeps changing pictures behind a switched-off panel. The conflict hint names only the kiosk app's own screensaver (`utils/translations/languages/de.js:1508`). The store knows `tief` and `nacht` only (`utils/tiefeRuheStore.js:15`); the idle store expects further stages as further clocks (`utils/leerlaufStore.js:19–21`). The card's own `turn_on` of the screen entity comes back as a wake edge (`utils/weckquellen.js:75–80`).

**What ships:**
- **S1 — now, alone.** A warning line in the handoff section when photo frame and screen entity are both on: "The photo frame runs behind a dark panel." Info-popup catalog in the same release.
- **S2 — the stage `aus`.** A third clock behind `tief`: "Display off: with deep rest (today) · 5 · 10 · 30 min after", and a separate value for quiet hours. The default keeps today's behaviour. With a delay set, the handoff moves to `aus` and the photo frame stops there.
- Motion during `aus` switches only the screen entity on; the stage falls back to `tief`, the photo runs again, the countdown starts over. This needs the source-aware gesture and the echo guard of #105 (S1, S2).
- **Honesty rule:** waking by motion works only while page and socket live behind a dark panel (#104 S2), and a motion sensor fed by the tablet's camera may stop with the panel. The info popup says so.
- "Black at zero brightness" instead of "panel off", for devices that handle screen-off badly, goes through the brightness entity of #110, not here.

**Hook (verified):** `utils/displayUebergabe.js:52–63`, `:66–79`, `:84–99`; `utils/fotorahmen.js:104–129`; `utils/tiefeRuheStore.js:15`, `:89–96`; `utils/leerlaufStore.js:19–21`, `:71`; `utils/weckquellen.js:75–80`; `components/tabs/SettingsTab/components/startscreen/BildschirmschonerAbschnitt.jsx:339–400`; `utils/translations/languages/de.js:1508`.

**Effort:** Medium — S1 1 h, S2 5–6 h. Bundle ≈ +1 KB.

**Why it fits:** It removes a real contradiction between photo frame and dark panel with one more clock, on a store that was built for more clocks.

**Files (estimate):** `utils/tiefeRuheStore.js`, `utils/displayUebergabe.js`, `utils/fotorahmen.js`, `hooks/useTiefeRuhe.js`, `startscreen/BildschirmschonerAbschnitt.jsx`, `startscreen/useBildschirmschoner.js`, register, `de.js`/`en.js`, info-popup catalog.

---

### 107. Photo frame, stage two — load first, any HA source, fit, browse, a caption

**Pitch:** The next photo appears only once it has loaded, at panel size, and every photo comes once before any repeats. Any album Home Assistant offers can be the source, also a camera or a generated image. Portrait photos stay whole. A tap on the right edge shows the next photo; a long press hides one for good. A small line says "June 2019 · Holiday".

**Status quo:** The photo frame sets the URL 487 ms after the blend starts, without waiting for the picture (`utils/fotorahmen.js:100–101`); on an old tablet a large photo can appear after the overlay has opened again. Originals are decoded at full size and set with a fixed `center / cover` (`utils/viewWallpaper.js:113–132`, `:129`). Random order avoids only the previous picture (`fotorahmen.js:74–82`); the index resets with every list rebuild (`:70`). The source is a free-text path turned into a label (`startscreen/BildschirmschonerAbschnitt.jsx:314–317`, `fotorahmen.js:46–53`). The listing starts below `media-source://media_source` only (`services/mediaSourceService.js:23`), skips subfolders (`:60`) and returns file name and id without the folder title (`:67`). Every picture change also re-bakes the wallpaper copy (`utils/glasKopie/index.js:670`, `:676–679`); there is no deep-rest gate in that module. No picture metadata is read.

**What ships:**
- **S1 — load first, every picture once.** Load and decode before the blend (`new Image` plus `decode()`, or `ladeBild`, `utils/glasKopie/backen.js:36`), then blend, then swap. On failure the current picture stays and the next interval tries again. Downscale to panel width × device pixel ratio (cap about 1920): `createImageBitmap` with a target width where it works, else the canvas path of `verkleinere` (`backen.js:66`, to be exported), else the original. A shuffled queue with its position stored per device replaces the random draw and survives the list rebuild. The previous blob is freed only after the wallpaper copy has baked from the new picture. `blob:` stays limited to this direct call; `isSafeWallpaperUrl` (`viewWallpaper.js:31`) is not widened.
- **S2 — sources from Home Assistant.** A browser picker over `media_source/browse_media` from the root of all sources, so any album an integration offers (a photo server or a NAS, for example) works without a key in the card. The setting stores a `media_content_id`; old path values are migrated. Subfolders optional, with a hard cap on the list, because a large album arrives as one WebSocket answer. A second source kind: an `image.*` or `camera.*` entity, its `entity_picture` read fresh per change, at most once a minute for cameras (no poller, #4). The URL builder inside `useUniversalHero` (`hooks/useUniversalHero.js:43–60`) moves into a util; no second builder. Plain text instead of a black screen when nothing is found.
- **S3 — fit.** Crop only when the picture is close to the panel's format. Otherwise the whole picture sits over a tiny upscaled copy of itself, which gives a soft background without any filter. Hosts without CORS fall back to `cover`. Pairs of portrait photos on a landscape panel come later, as their own slice.
- **S4 — browse and hide (opt-in).** In the photo frame, a tap on the outer fifth goes back or forward and restarts the interval; the rest stays (positions from #105 S1). A long press (500 ms, as `hooks/useMehrfachauswahl.js:10`) offers "Don't show this photo again": the id goes to a per-device exclusion list, with undo (`utils/undoStore.js:64`). Opt-in, because it changes #61's "any touch lifts". Unlike the hidden corner actions this pass left out, the zones act only while the photo frame runs and are named in the setting.
- **S5 — a caption.** A small line in a lower corner over a gradient, no blur: the album from the folder title, the date from the file name, or from the picture's own date field when S1 already holds the bytes (a short parser, no dependency, JPEG only). No camera data, no location. It drifts with the clock block and is off at night. Shown in rest, so it waits on D10.
- **Thermal rule:** one computing peak per interval; nothing runs between changes. Check whether the wallpaper copy can skip baking in deep rest, where no copy is visible.

**Hook (verified):** `utils/fotorahmen.js:31`, `:46–53`, `:64–82`, `:100–101`, `:125–129`; `utils/viewWallpaper.js:31`, `:113–132`; `services/mediaSourceService.js:23`, `:37`, `:60`, `:67`, `:164`; `utils/glasKopie/backen.js:36`, `:66`; `utils/glasKopie/index.js:670`, `:676–679`; `hooks/useUniversalHero.js:43–60`; `hooks/useMehrfachauswahl.js:10`; `utils/undoStore.js:64`; `components/tabs/SettingsTab/components/startscreen/BildschirmschonerAbschnitt.jsx:314–317`.

**Effort:** Large in five slices — S1 3–4 h, S2 4–6 h, S3 4–5 h, S4 3–4 h, S5 3–4 h. Bundle ≈ +4–6 KB in total; measure per slice.

**Why it fits:** S1 repairs a visible fault and is the precondition for every other photo slice. S2 answers D10's side note on photo-server sources, with no key in the card.

**Files (estimate):** `utils/fotorahmen.js`, `services/mediaSourceService.js`, `utils/viewWallpaper.js`, `utils/glasKopie/backen.js`, `utils/glasKopie/index.js`, `utils/heroBild.js` (new, out of `useUniversalHero`), `startscreen/BildschirmschonerAbschnitt.jsx`, `startscreen/useBildschirmschoner.js`, `components/BentoZenView.jsx` + `.css` (S5), `de.js`/`en.js`, info-popup catalog.

---

### 108. This tablet — name, room and setup in one place

> ✅ **S1 + S2 shipped v1.1.2516** (2026-11-03) — Settings → General → *This tablet*: name, room (`tablet.area`) and device (`tablet.device`), per browser (`utils/diesesTablet.js`). No room chosen → the device's room, shown as "From device: …" (#97). The AI prompt gets one rule line (room and name as quoted data; the device list does not change); search puts the tablet room's group first within the same tier (`groupSearchResults`, `hooks/useTabletRaum.js`). S2 proposes, never sets: the device's screen, motion (binary_sensor only — its device_tracker always reads home) and lux entities come first in the start-screen pickers with "from this tablet's device"; its battery is shown read-only; the speaker picker of #138 S1 lists the device's media players, then Music Assistant speakers in the tablet room. Device list: tablet-like (Fully Kiosk, Browser Mod, Companion app, name/model) first, services and devices without entities left out. S3 (templates) open; #70 state words do not exist yet.

**Pitch:** One section, "This tablet", answers once what the card otherwise asks in five places: where it hangs, what it is called, which Home Assistant device it is. "Light off" in AI mode then means this room, search results from this room come first, and a template "Kitchen", "Hallway" or "Bedroom" sets up the rest chain in one tap.

**Status quo:** No setting knows the tablet's room or name (0 hits). The AI context lists the room of every entity (`utils/kiKontext.js:155`), but its rules say nothing about where a question comes from (`:229–241`). Search filters by a typed room and ranks by name (`utils/searchIntent.js:20`, `:94`; `hooks/useFuzzySearch.js:216–219`). The whole rest chain is off by default: the screensaver (`hooks/useZenRueckkehr.js:33`), and deep rest only with the screensaver (`hooks/useTiefeRuhe.js:46–47`). Setting up a wall tablet means visiting several sections. The pickers for screen, motion and lux know nothing of the tablet's device: screen puts names matching a screen pattern first, motion sorts by name, lux by entity id (`utils/displayUebergabe.js:84–99`, `utils/weckquellen.js:118–131`, `utils/autoHelligkeit.js:95–99`). A sibling lookup by `device_id` exists for batteries (`utils/batterieSensor.js:37–50`). Settings already live per browser (`utils/systemSettingsStorage.js:7`), so a per-device value needs no store of its own.

**What ships:**
- **S1 — room and name.** "This tablet hangs in: [area]" and "Name: [Kitchen]" under General → This tablet. The AI instruction (`kiKontext.js:219`) gets one rule line: without a named room, this room is meant. The device list sent does not change, and the rule "only what the card shows" stays; `docs/SECURITY.md` names the room as sent. Search lifts results from this room. Once #70 exists, its state words act here first.
- **S2 — which device is this tablet?** A pick from `hass.devices`. The card proposes screen, motion, lux and battery from that device's entities by domain and `device_class` (siblings as in `batterieSensor.js:37–50`), each with its reason (#97). It works for any kiosk app or integration that exposes the tablet as a device, not for one product.
- **S3 — templates.** "Kitchen · Hallway · Bedroom" write existing settings only: screensaver on, deep rest, quiet-hours coupling, the wake rule and reading stage of #105, sound. Before applying, the template lists its changes like the "Changed" button of #46. Values only; nothing switches between profiles, so #15 stays retired.
- Not built: the room in the hash of the start URL. Whether Lovelace navigation keeps a hash is unchecked; that question belongs before #33.
- The name is shared with #114 (addressing) and #117 (the check).

**Hook (verified):** `utils/kiKontext.js:46–51`, `:155`, `:219`, `:229–241`; `utils/searchIntent.js:20`, `:94`; `hooks/useFuzzySearch.js:216–219`; `hooks/useZenRueckkehr.js:33`; `hooks/useTiefeRuhe.js:46–47`; `utils/batterieSensor.js:37–50`; `utils/displayUebergabe.js:84–99`; `utils/weckquellen.js:118–131`; `utils/autoHelligkeit.js:95–99`; `utils/systemSettingsStorage.js:7`; `providers/entitiesLoader.js:63`.

**Effort:** Medium — S1 3 h, S2 4–5 h, S3 3–4 h. Bundle ≈ +2 KB.

**Why it fits:** Room and name are the identity five other ideas of this pass need. One place, set once per tablet.

**Files (estimate):** `utils/diesesTablet.js` (new), `components/tabs/SettingsTab/components/GeneralSettingsTab.jsx`, `utils/kiKontext.js`, `hooks/useFuzzySearch.js`, `startscreen/useBildschirmschoner.js`, `register/allgemein.js`, `suche/vorgaben.js`, `docs/SECURITY.md`, `de.js`/`en.js`, info-popup catalog.

---

### 109. The calendar on the wall — stays current, says its state, shows where it went, a plan view

**Pitch:** An appointment entered on the phone appears on the open wall calendar within minutes. When Home Assistant is unreachable, the appointments stay and a quiet line says "as of 14:32". After saving, the calendar jumps to the event's day and rings it for a moment. A plan view shows today on the left and the next two weeks on the right.

**Status quo:** The calendar loads on a view or date change and after its own writes (`system-entities/entities/calendar/CalendarView.jsx:472–474`, `:565`, `:589`). The 30-min stock in the background serves reminders, the evening-before note and the context line, never the open view (`utils/reminderStore.js:160–167`). The calendar has no refresh button, so #88's `update_entity` refresh was dropped by user decision (`:499–502`). The load time is stored (`system-entities/entities/calendar/index.jsx:143`, `:176`, `last_loaded`) and never shown; an error appears as text after the count (`CalendarView.jsx:1476`). A weather interval in the same view already pauses on `document.hidden` and follows `hass?.connection` (`:312–318`). After saving, the old view reloads (`:565`), so an event moved to another month disappears without a word. A jump marker exists only for settings (`components/tabs/SettingsTab/suche/useSprungMarkierung.js`). The view modes are day, week, month, year and people (`CalendarView.jsx:114`); there is no continuous outlook.

**What ships:**
- **S1 — quiet reload.** Every 5 minutes, only while the calendar is open and the page visible (the same gate as `:312–318`), and after every reconnect. No loading line, never while a dialog is open. On failure the events stay and a quiet line shows `last_loaded`. No `update_entity` (#88).
- **S2 — a subscription where HA offers one.** `calendar/event/subscribe` (in HA core per the upstream check of this pass) for the visible calendars and range. The 5-min reload stays as the fallback on `unknown_command`, because the card supports much older HA versions.
- **S3 — the ring after the jump.** After saving, after a tap on a reminder and after an AI action (#118 S3), the view jumps to the event's day (`setAnkerTag`/`setGewaehlterTag`, as the Bento deep link does at `:476–498`) and the row carries a ring for a few seconds, opacity only. The first gesture ends it (`subscribeGeste`, `utils/leerlaufStore.js:84`).
- **S4 — plan view.** A mode "Plan" in the head pill's menu (`:1152`). Left: today, large, with date, weather mark, the next event with relative time and the rest of the day including due tasks (#86). Right: 14 days as a list grouped by day, empty days folded. It reuses the event row and the person dots; the width ladder of #48 turns it into the list alone on a phone. Selectable as the default view.
- **Thermal rule:** the reload timer exists only while the view is mounted and visible; none in deep rest.

**Hook (verified):** `system-entities/entities/calendar/CalendarView.jsx:114`, `:312–318`, `:472–474`, `:476–498`, `:565`, `:589`, `:1089`, `:1152`, `:1476`; `system-entities/entities/calendar/index.jsx:143`, `:176`; `utils/reminderStore.js:160–167`; `utils/leerlaufStore.js:84`; `components/tabs/SettingsTab/suche/useSprungMarkierung.js`.

**Effort:** Medium — S1 2–3 h, S2 3–4 h, S3 2 h, S4 6–8 h. Bundle ≈ +1 KB for S1–S3, S4 ≈ +3 KB (measure).

**Why it fits:** An open calendar on the wall otherwise lies until the next view change. S1 is small and works on every HA version.

**Files (estimate):** `calendar/CalendarView.jsx`, `calendar/index.jsx`, `calendar/utils/kalenderAbo.js` (new, S2), `calendar/components/PlanAnsicht.jsx` (new, S4), `calendarSettingsStorage.js`, `CalendarSettingsView.jsx`, register, `de.js`/`en.js`, info-popup catalog.

---

### 110. Real panel brightness through an entity

**Pitch:** In deep rest the panel itself gets darker, not only the page on it. With a brightness entity of the kiosk app or integration, the card writes one value per stage and follows the room's light: "now 42 lx → 38 %".

**Status quo:** Auto brightness knows two thresholds and lays a black overlay over the page (`utils/autoHelligkeit.js:11–13`, `:52–67`). The panel stays fully backlit, and the overlay adds up with the deep-rest overlay above it (`:43`, below `utils/tiefeRuheStore.js:39`). #49 names real brightness as delegation to an entity. The handoff picker lists `switch`, `light` and `input_boolean` only (`utils/displayUebergabe.js:91`). In HA core, the kiosk integration #49 names exposes screen brightness as a `number` from 0 to 255, not as a light (per the upstream check of this pass; see the addendum to #49).

**What ships:**
- A picker "Brightness entity" (`number.*` or `light.*`) and a value for two stages, awake and rest; night uses the rest value. Lux moves the value along a line between a dark point and a bright point on a log scale. The existing dark and bright thresholds (`dunkelLux`, `hellLux`, chosen from `DUNKEL_STUFEN` and `HELL_STUFEN`, `utils/autoHelligkeit.js:11–22`) are the two points.
- `number.set_value` mapped onto the entity's own `min` and `max`, or `light.turn_on` with `brightness_pct`.
- **Write gate:** at most once per 60 s, only on a change of at least 5 points, on top of the existing hysteresis. Every write travels through HA to the device.
- With an entity set, the overlay of auto brightness goes off, so two dims do not stack.
- The value before the first write is saved and restored when the setting goes off or the card unmounts. Writing to such an entity changes the device's stored base value, and with the device's own adaptive brightness on, its maximum. A hint "use only one of the two" when the device runs its own curve.
- **Two traps:** `light.turn_on` on a screen light switches a dark panel on, so with an active handoff the curve never writes in `tief` or `aus`. And a write must not come back through the wake sources as a display edge (echo guard of #105 S2).
- The settings row shows the live value; no drag diagram.

**Hook (verified):** `utils/autoHelligkeit.js:11–13`, `:43`, `:52–74`, `:83–90`; `utils/tiefeRuheStore.js:39`; `utils/displayUebergabe.js:82`, `:91`; `utils/weckquellen.js:75–80`.

**Effort:** Medium — 5–7 h. Bundle ≈ +1.5 KB.

**Why it fits:** It closes the limit #49 names, "CSS dims the page, not the panel", with the rule #49 set: a service call to an entity the user picks, no device-specific code.

**Files (estimate):** `utils/autoHelligkeit.js`, `utils/panelHelligkeit.js` (new), `startscreen/BildschirmschonerAbschnitt.jsx`, `startscreen/useBildschirmschoner.js`, register, `suche/vorgaben.js`, `de.js`/`en.js`, info-popup catalog.

---

### 111. What may stand in deep rest — only what deviates (most of it waits on D10)

**Pitch:** In deep rest the wall stays calm while all is well. If the garage is open or the front door unlocked, one quiet pill under the clock says so. A running timer or a finished washer is one line. On the start page, a favourite can show only when it matters: the garage only when it is open.

**Status quo:** Deep rest keeps only the clock: date, status, greeting, context and grip go to opacity 0 (`components/BentoZenView.css:490–495`), and the island folds to its button (`components/Island.jsx:315–322`), so a running timer is invisible there. Live activities are computed inside the island's tick (`hooks/useIslandDaten.js:68–71`, `:102`) and by the notification center (`system-entities/entities/notifications/NotificationsView.jsx:310`), never by the rest view. The context line has one "next event" reader, which skips all-day events (`utils/reminderStore.js:120–126`); the stock reaches +48 h (`:51–57`). The rest view already listens to entities and to a 1-s throttled hass (`components/BentoZenView.jsx:124`, `:197`) and has a 15-s clock tick (`:343`). The drift block carries text only (`:432–441`, `:667`). Favourites show whatever their state (`:126–129`). D10 is open: whether more than the clock may stand in deep rest decides every slice below except S1.

**What ships:**
- **S1 — a favourite only when it matters (no D10 needed).** A favourite gets an optional state list "show only when: open · on · unlocked …", chosen from the entity's states. Outside it, the favourite steps out and the others move up within the favourites tile. No thresholds, no operators (#3, #54). Empty or unknown values drop out by themselves.
- **S2 — the deviation row (after D10).** Up to four chosen entities, each "always" or "only in state X", inside `.bento-zen-above` so the drift carries it; tinted surfaces, no blur. Default: deviation mode, empty when all is well. Blocks: this tablet's battery only when low and not charging, the next alarm within 24 h (addendum to #72), sunset, moon phase (`readMoonPhase`, `components/bento/widgets/ocean/oceanWeather.js:87`; that file imports the ocean scene module, `:7`, so take the function out first). Read only; a tap lifts the rest like any gesture. The avatars of #71 R2 may become a block here.
- **S3 — the one urgent line (after D10).** Exactly one text line under the clock, by rank: timer ringing, timer running ("Pasta · 4 min"), appliance done (#92), a waiting notification. Data from `extractLiveActivities`, which is pure (`utils/liveActivitySources.js:100`), on the 15-s tick; the remaining time from `endsAt` on that tick, not on the island's 30 s. No animation, no ticker.
- **S4 — the day plan as a rest face (after D10).** The clock smaller on the left; the rest of today plus one entry of tomorrow on the right, with the calendar people's colours. A new reader over the reminder stock, all-day included. The freshness gate (`reminderStore.js:167`) must open for this face too. Empty means the normal clock face.
- **Privacy rule:** a wall shows what it shows to guests too. Titles in rest only from calendars the household picks; otherwise "2 appointments today" without titles. The same applies to S2 and S3.
- **Thermal rule:** no new subscription and no new tick; everything reads on the existing 15-s tick.

**Hook (verified):** `components/BentoZenView.css:490–495`; `components/BentoZenView.jsx:124`, `:126–129`, `:197`, `:343`, `:432–441`, `:667`; `components/Island.jsx:315–322`; `hooks/useIslandDaten.js:68–71`, `:102`; `utils/liveActivitySources.js:100`; `utils/reminderStore.js:51–57`, `:120–126`, `:167`; `components/bento/widgets/ocean/oceanWeather.js:7`, `:87`.

**Effort:** Medium — S1 3–4 h; after D10: S2 5–6 h, S3 3 h, S4 5–6 h. Bundle ≈ +1 KB for S1, +3–5 KB for S2–S4.

**Why it fits:** One answer to D10 decides six ideas of this pass, and the deviation default keeps the calm of #61.

**Files (estimate):** `components/BentoZenView.jsx` + `.css`, `utils/ruheReihe.js` (new), `utils/reminderStore.js`, `components/bento/widgets/ocean/oceanWeather.js` (S2), favourites settings, register, `de.js`/`en.js`, info-popup catalog.

---

### 112. Rest faces — night by the house, a black night clock, a still sky, a clock of its own size

**Pitch:** Night begins when the house gets dark, not at 20:00. At night the wall goes truly black, with a muted red clock and nothing else. By day the rest can show a still sky that follows the weather. The rest clock can be larger or another colour, and stacks hours over minutes on a portrait panel.

**Status quo:** The "auto" dark mode is fixed to 20:00–6:00 (`utils/zeitzone.js:556–559`), used by the island theme (`components/Island.jsx:93–101`) and the wallpaper overlay (`components/WallpaperModeOverlay.jsx:57`); both listen only to `darkModeChanged` (`Island.jsx:358`, `WallpaperModeOverlay.jsx:39`). Night in deep rest means quiet hours only (`hooks/useTiefeRuhe.js:53`); `istAutoDunkel()` is exported with no consumer (`utils/autoHelligkeit.js:92`). At night the clock gets a warmer tone under a deeper overlay (`components/BentoZenView.css:504`); the wallpaper stays visible, and the photo frame changes pictures all night because it does not read `nacht` (`utils/fotorahmen.js:128`). The curtain covers only the card (`BentoZenView.css:57–59`); the wallpaper lives in HA's view background, and `applyFullscreenWallpaper` always writes a `url()` (`utils/viewWallpaper.js:129`). The clock is fixed at 82 px (68 px on the phone), weight 500 (`BentoZenView.css:136–137`, `:419`), and nothing handles portrait panels (0 hits). The ocean widget holds pure weather and sun mappings and a sky palette (`components/bento/widgets/ocean/oceanWeather.js:11`, `:68`, `:80`; `OceanFallback.jsx:13–34`, not exported).

**What ships:**
- **S1 — night by the house.** The dark mode gets two values: "like the sun" (`sun.sun` below the horizon) and "like Home Assistant" (`hass.themes.darkMode`). One function replaces both callers of `istNachtAuto`; a change arrives from the state stream and fires `darkModeChanged`. The default `auto` stays as it is. Night in deep rest becomes quiet hours **or** dark by the lux sensor, and the lux edge re-evaluates the night in `useTiefeRuhe`. Measure by day and by night (the veil trap).
- **S2 — a background without `url()`.** `applyFullscreenWallpaper` gets a second form for a plain colour or a CSS gradient, with the same restore path (`viewWallpaper.js:136–138`, `applyWallpaperFromSettings` at `:172`). The wallpaper copy can bake gradients without an image (`backeOhneBild`, `utils/glasKopie/backen.js:401`).
- **S3 — the night clock (opt-in).** Under `data-nacht`: the view background goes black through S2, the deep-rest overlay and the auto-dim overlay (`utils/autoHelligkeit.js:43`) go to zero, the clock takes a chosen night colour (default muted red), the photo frame pauses, and blocks follow a "hide at night" switch. Check side bar, bell and island button at night. On an LCD the backlight stays on; this is not display off (#106).
- **S4 — a still sky (opt-in).** A source "Sky" next to "Folder" in the photo frame: every 10 minutes or on a weather change, a gradient from the weather state and the sun's elevation, swapped through the existing blend. No shader, no particles, no animation. Fallbacks: the last state, or a neutral overcast sky. The palette is exported, not copied.
- **S5 — clock size and colour.** A size slider for the rest clock (a transform scale in deep rest, so the island's `offsetTop` measurement is untouched) and a clock colour. On a portrait panel, hours over minutes, the size taken from the panel height the height ladder already measures (`utils/hoehenLeiter.js:178–179`). Hands and flip faces only on demand later; no font files.
- **Thermal rule:** a gradient is a static value, the sky changes at most every 10 minutes, the night clock is CSS.

**Hook (verified):** `utils/zeitzone.js:556–559`; `components/Island.jsx:93–101`, `:358`; `components/WallpaperModeOverlay.jsx:39`, `:57`; `hooks/useTiefeRuhe.js:53`, `:80`; `utils/autoHelligkeit.js:43`, `:92`; `components/BentoZenView.css:57–59`, `:136–137`, `:419`, `:504`; `utils/fotorahmen.js:128`; `utils/viewWallpaper.js:113`, `:129`, `:136–138`, `:172`; `utils/glasKopie/backen.js:401`; `components/bento/widgets/ocean/oceanWeather.js:11`, `:68`, `:80`; `components/bento/widgets/ocean/OceanFallback.jsx:13–34`; `utils/hoehenLeiter.js:178–179`.

**Effort:** Medium to large — S1 2–3 h, S2 2 h, S3 3–4 h, S4 3–4 h, S5 2–3 h. Bundle ≈ +2–3 KB.

**Why it fits:** Night and day hang on two fixed clocks today. One background form without `url()` carries both the black night and the still sky.

**Files (estimate):** `utils/zeitzone.js`, `components/Island.jsx`, `components/WallpaperModeOverlay.jsx`, `utils/viewWallpaper.js`, `utils/autoHelligkeit.js`, `hooks/useTiefeRuhe.js`, `utils/fotorahmen.js`, `utils/ruheHimmel.js` (new), `ocean/OceanFallback.jsx`, `components/BentoZenView.css`, appearance and screensaver settings, register, `de.js`/`en.js`, info-popup catalog.

---

### 113. Lean deep rest — the card really sleeps under the curtain

**Pitch:** Under the curtain the tiles stop rendering, and state changes stop costing work unless they can wake the tablet. Measured first, built second.

**Status quo:** In deep rest, reconcile and the island tick drop to 30 s (`hooks/useDataProviderEvents.js:95–101`, `hooks/useIslandDaten.js:102`) and animations are gated. The tiles stay mounted at opacity 0; the rest view listens to `useEntities()` and a 1-s throttled hass (`components/BentoZenView.jsx:124`, `:197`); the flush throttle stays at 150 ms (`hooks/useEntityStream.js:148–154`). The stream subscribes to every `state_changed` with full old and new state (`:299`), and every event runs through the observers and the batch (`:281–296`). `content-visibility` was removed in v1.1.2482 because WebKit painted ghost cards (`styles/perceivedSpeed.css:48–50`).

**What ships:**
- **S0 — measure.** Render counts through `options.__r` and events per minute, on a real wall tablet, not in a hidden pane. On the check page (#117), "Listen for one minute" counts events per `entity_id` for 60 s on a tap and lists the ten loudest, with a jump to the exclusion filter. Local only, never in the copy text (#51's redaction rule). The hint says that an exclusion does not stop all work: known entities still pass the gates.
- **S1 — the panel sleeps.** In deep rest, the tile panel unmounts or gets `display: none` behind a mount gate like the curtain's. The flush throttle goes to 5–10 s in `tief` and flushes at once on wake (`subscribeTief`, `utils/tiefeRuheStore.js:98–101`). Wake sources, lux and chronicle run before the batch (`useEntityStream.js:281–296`) and stay immediate. No `content-visibility`.
- **S2 — a narrower subscription, only if S0 shows the lever.** In deep rest the full subscription gives way to `subscribe_entities` with an entity list: wake sources, doorbell, lux, screen entity, watches, danger entities, the timers that ring here (#102 S2), the command helper (#114 S3), the lock entity (#115 S2) and a quiet-hours entity (addendum to #3). On wake: back to the full subscription, one reconcile, the chronicle refilled from the logbook. Check the parameters against HA core first. HA's own frontend keeps its own subscription in the same browser, so only the card's share is saved.
- **Rule:** blocks that show fresh values in rest (#111) declare their entities, which join the narrow list.

**Hook (verified):** `hooks/useDataProviderEvents.js:95–101`; `hooks/useIslandDaten.js:102`; `components/BentoZenView.jsx:124`, `:197`; `hooks/useEntityStream.js:136`, `:148–154`, `:281–296`, `:299`; `styles/perceivedSpeed.css:48–50`; `utils/tiefeRuheStore.js:98–101`.

**Effort:** Medium — S0 2–3 h, S1 3–4 h, S2 5–6 h. Bundle ≈ +1 KB.

**Why it fits:** "Zero long-runners in rest" covers timers. This is the remaining per-event cost on a resting wall tablet, and it starts with a measurement, as every thermal round did.

**Files (estimate):** `components/BentoZenView.jsx`, `hooks/useEntityStream.js`, `utils/stromZaehler.js` (new, S0), the check page of #117, `utils/hausChronikStore.js` (S2 refill), `de.js`/`en.js`.

---

### 114. Automations reach one tablet

**Pitch:** An automation shows the front-door camera on the hallway tablet for 30 seconds, sends a notification to the kitchen tablet only, or puts all tablets to sleep. Home Assistant's own notifications show their bold text and links instead of raw asterisks.

**Status quo:** Home Assistant cannot address the card; it is no entity. The state stream sees every `state_changed` without admin rights (`hooks/useEntityStream.js:299`), and the wake sources show the cheap-gate pattern (`utils/weckquellen.js:56`). `fsc-open-entity` and the deep-link guest open any entity Home Assistant knows and no exclusion pattern hides (`providers/entityZulassung.js:98–109`). Persistent notifications arrive with their `notification_id` (`utils/persistentNotificationStore.js:15`, `:53`) and become an id `pn:…` (`providers/dataNotifications.js:80`); no prefix is read. The center and the message card show `n.message` raw (`system-entities/entities/notifications/NotificationsView.jsx:387`, `system-entities/entities/notifications/components/MeldungsKarte.jsx:61–63`). A safe markdown parser has three consumers (`utils/miniMarkdown.js:101`); it allows only `http`, `https`, `mailto` and anchors (`:48`) and opens links in a new tab (`:89–90`); `_` triggers nothing, so entity ids stay intact. Sleep and wake scripts get no variables (`utils/displayUebergabe.js:55`, `:62`).

**What ships:**
- **S1 — notification text renders.** Center and message card run `message` through `miniMarkdown` in an inline variant. Relative HA paths such as `/config/…` become taps that navigate inside HA instead of opening a tab.
- **S2 — addressing by id.** A documented naming rule for `notification_id`: `fsc_<tablet>_<level>_<id>`, for example `fsc_kueche_kritisch_waschmaschine`. Only the named tablet (its name from #108) shows it, in the named level; the others keep it in their history. Without the prefix everything stays as it is. The text is untouched, so HA's own bell shows a normal notification — to every user, the limit that kept the tablet call out of this pass; the prefix only steers the card. The filter sits before the merger.
- **S3 — the command helper.** An optional `input_text` per tablet; an automation writes `kueche|zeige|camera.haustuer|30`. Each instance checks the target (its name or `alle`) and a verb from a fixed list: `wecken`, `schlafen`, `wach` (a hold reason of #103, with a cap), `neu_laden`, `zeige <entity> <s>` (opens the detail with a hold reason, then goes back), `seite <system view>`. No service calls, no URLs, no risky domains; the tap rule is untouched. A command counts only if `last_changed` is under 60 s old, so a reload replays nothing. `input_text` reports no change for an equal value, so the contract asks for a counter field or for the automation to clear the helper; 255 characters at most. The user creates the helper, never the card.
- **S4 — the other direction.** Sleep and wake scripts get `variables`: `quelle` (motion, doorbell, critical, gesture) and `geraet` (the tablet's name). `weckeLeerlauf` already knows the source (`utils/leerlaufStore.js:91–94`); `subscribeTief` has to pass it on to the handoff (`displayUebergabe.js:66–79`).
- **Honesty rule:** all of this acts only while a card instance is open on that tablet.

**Hook (verified):** `hooks/useEntityStream.js:281–296`, `:299`; `utils/weckquellen.js:56`; `utils/leerlaufStore.js:91–94`; `providers/entityZulassung.js:98–109`; `utils/persistentNotificationStore.js:15`, `:53`; `providers/dataNotifications.js:80`, `:87`; `system-entities/entities/notifications/NotificationsView.jsx:387`; `system-entities/entities/notifications/components/MeldungsKarte.jsx:61–63`; `utils/miniMarkdown.js:48`, `:80–90`, `:101`; `utils/displayUebergabe.js:55`, `:62`, `:66–79`; `utils/kioskMode.js:235` (HA's own navigation fires `location-changed`).

**Effort:** Medium — S1 2 h, S2 2–3 h, S3 4–5 h, S4 1–2 h. Bundle ≈ +2 KB.

**Why it fits:** The card has no back channel and needs none: the state stream and the notification subscription it already holds carry a small, fixed vocabulary.

**Files (estimate):** `utils/befehlHelfer.js` (new), `hooks/useEntityStream.js`, `providers/dataNotifications.js`, `utils/miniMarkdown.js`, `NotificationsView.jsx`, `MeldungsKarte.jsx`, `utils/displayUebergabe.js`, `utils/tiefeRuheStore.js`, This-tablet settings (#108), `de.js`/`en.js`, info-popup catalog, a short doc page with the naming rule.

---

### 115. The lock, stage two — a cleaning shield, a lock that follows HA, an allow list

**Pitch:** "Shield for 60 s" lets you wipe the screen: the page stays visible and current, and every touch lands on the shield. An automation locks the tablet in the evening and unlocks it in the morning. While locked, calendar, tasks and light stay usable, and settings ask for the PIN.

**Status quo:** Both body overlays let every touch through (`utils/tiefeRuheStore.js:25–46`, `utils/autoHelligkeit.js:42`); no catching overlay exists. #85 (a PIN before settings and reset) is not built (0 hits for its modules) and announces a way out for a forgotten PIN without naming one. The side bar renders its configured list with no lock (`components/SearchSidebar.jsx:95–106`, `:362–385`). The card deliberately does not block the context menu globally (`utils/kioskMode.js:201–203`).

**What ships:**
- **S1 — the cleaning shield (no #85 needed).** An entry in the side bar's ⋮ window: shield for 30 s, 60 s or until released. A transparent overlay on `body` catches all pointers while the card runs on below; a tap shows the remaining time; five quick taps release it, or the PIN window once #85 exists. One `setTimeout` for the end, nothing else. The shield does not re-arm the idle clocks on every tap. #102 S2 uses the same element. Stated limit: it covers the page, not the system bars of the tablet.
- **S2 — the lock follows an entity (with #85).** "Lock follows: [input_boolean · switch · alarm_control_panel]", armed meaning locked. A cheap gate on the state stream, as the wake sources use (`utils/weckquellen.js:56`), no timer, no service call. When the entity goes off, the lock and its PIN prompt go too. This is #85's way out: switch the helper from the phone. Without an entity, #85's own way out stays. The schedule lives in HA; #7 stays untouched.
- **S3 — an allow list (with #85).** While locked, a positive list of side-bar entries and device domains (calendar, tasks, lights; music once #140 S1 gives it an entry, D16). What is not allowed stays visible, dimmed with a lock, and asks for the PIN. The gate sits at the mount, as in #85, so search and jumps cannot bypass it. Reset and cache are never allowed. The tap-rule domains follow the same list. While locked, long-press menu and text selection are off on the card root. Stated limit: search reaches devices without the side bar; this is a guard against slips, not security.

**Hook (verified):** `utils/tiefeRuheStore.js:25–46`; `utils/autoHelligkeit.js:42`; `components/SearchSidebar.jsx:95–106`, `:362–385`; `utils/kioskMode.js:201–203`; `utils/weckquellen.js:56`; `utils/leerlaufStore.js:62`.

**Effort:** Small, then Medium — S1 2–3 h; after #85: S2 2 h, S3 4–5 h. Bundle ≈ +1.5 KB.

**Why it fits:** S1 is a household chore the card can solve alone. S2 gives #85 the way out it announced. S3 is the step from "settings locked" to "a tablet children can use".

**Files (estimate):** `utils/schild.js` (new), `components/SearchSidebar.jsx`, `utils/tabletSperre.js` (#85), `components/common/PinFenster.jsx` (#85), `components/tabs/SettingsTab/components/SidebarItemsSettingsTab.jsx`, register, `de.js`/`en.js`, info-popup catalog.

---

### 116. Old and small devices — a performance level and a rung for 480-pixel panels

**Pitch:** On a slow tablet the card can switch to "Lean": no depth transition, no animated icons, no ocean, cheaper edges. A 960 × 480 panel gets a layout that fits instead of a panel cut off at the bottom.

**Status quo:** Only the ocean widget regulates itself. The animation gate knows decor, deep rest and reduced motion (`utils/animationsTor.js:26–34`); several overlays read reduced motion themselves (`utils/depthTransition.js:74`, `utils/tiefeRuheStore.js:41`, `utils/autoHelligkeit.js:45`). 18 CSS lines and 22 JS/JSX lines query reduced motion, 70 places use `mask-image`. No hardware probe exists (0 hits for `hardwareConcurrency` and `deviceMemory`). The height ladder (`utils/hoehenLeiter.js:58–66`): at 960 × 480 without HA's header the budget is 480 − 12 − 56 = 412 (`:52–53`, `:178–179`; the narrow window keeps the 56-px band), which gives the rung "abwerfen" with a 312-px grid. Search and detail panels still hold `PANEL_MIN` 436 (`:51`), which with the band is 492 px, past the screen edge; with HA's header 68 px are missing. 800 × 480 lands in the desktop path too (`utils/isMobileStore.js:21`, breakpoint 768).

**What ships:**
- **S1 — the hand choice.** "Performance: Full · Lean · Minimal" under Appearance, as `data-leistung` on the card root (in the PurgeCSS safelist). Lean switches off through existing exits: the depth transition becomes a fade, animated icons go through `animationsTor`, gauge and hero autoplay through `useAutoplayErlaubt`, the ocean shows its fallback, the wallpaper copy runs dense, and the costliest `mask-image` edges go. Minimal adds no ocean and no video backgrounds. The JS queries take the level as a fourth bit of the gate; the CSS gets one `[data-leistung]` selector next to the `@media` blocks where it matters. No PostCSS copy step (`postcss.config.cjs` is not in git); measure the growth.
- **S2 — automatic, later and only as a suggestion.** One probe per start: `hardwareConcurrency`, the start time from the perf marks, long tasks in the first 30 s; never in a hidden tab, where rAF is dead. The result is a line "This device looks slow — switch to Lean?". The hand choice always wins.
- **S3 — the rung "winzig".** Below a budget of 436: panels follow the budget, the head goes to one line, Zen shows W1 plus values. Measure at 800 × 480, 960 × 480 and 1024 × 600, each also with app zoom. The new rung joins the safelist.
- The text scale for the wall stays #3b E7.

**Hook (verified):** `utils/animationsTor.js:26–34`; `hooks/useAutoplayErlaubt.js`; `utils/depthTransition.js:74`; `utils/tiefeRuheStore.js:41`; `utils/autoHelligkeit.js:45`; `utils/hoehenLeiter.js:51–53`, `:58–66`, `:178–179`; `utils/isMobileStore.js:21`.

**Effort:** Large — S1 6–8 h, S2 3–4 h, S3 6–8 h. Bundle ≈ +1–2 KB for S1; S3 to be measured.

**Why it fits:** Wall tablets are often old and small. The card already has the exits; it lacks the switch and the lowest rung.

**Files (estimate):** `utils/leistungsStufe.js` (new), `utils/animationsTor.js`, `hooks/useAutoplayErlaubt.js`, `utils/depthTransition.js`, `utils/hoehenLeiter.js`, `components/tabs/SettingsTab/components/AppearanceSettingsTab.jsx`, the CSS files with the costliest rules, `scripts/check-purgecss-dynamic.py` (safelist), register, `de.js`/`en.js`, info-popup catalog.

---

### 117. The tablet's check — what this device can do right now

**Pitch:** A page "Tablet check" under About (name, room and setup stay in #108's "This tablet" section under General) lists each precondition with its purpose and status: secure connection (for the microphone), sound unlocked (for timer and critical tone), microphone permission, dictation path, AI task, admin right, screen entity reachable. A block on top names what needs attention.

**Status quo:** The critical tone reports success even while the browser blocks sound (`utils/kritischTon.js:48–53`); #3b E2 asked for a visible "sound is blocked" note, which is not in the code. A dictation path probe exists (`utils/diktat.js:55`), and since v1.1.2508 a switch for the microphone. The card never reads `hass.user.is_admin` (0 hits); `hass.user` serves only the name (`components/BentoZenView.jsx:401`) and the id behind "by you" in the chronicle (`system-entities/entities/notifications/NotificationsView.jsx:167`). The error boundary heals throws in the running tree only (`components/common/Fehlergrenze.jsx`). #51's remainder names a capability line and "why is entity X missing?". The version watcher (`utils/versionWaechter.js:115`), the orphan check of #76 S1 and the error boundary each know something the household never sees in one place.

**What ships:**
- **S1 — the readiness list.** Lines with Ready · Missing (an active feature needs it) · Not needed, each with one sentence of help and a button where one helps: "Test sound" (which also unlocks it), "Ask for microphone". Probes run only when the page opens, no tick. It reads `isSecureContext`, the AudioContext state (a getter in `kritischTon.js`, whose context is private today, `:12–23`), the Permissions API where present, `diktatVerfuegbar` and the dictation switch, `ai_task` and STT presence in `hass.services`, `hass.user.is_admin`, and the state of the chosen screen, lux and doorbell entities.
- **S2 — needs attention.** On top: stale code, orphaned settings (#76 S1 once built), a chosen key entity `unavailable`, an empty photo-frame folder, a caught error boundary, sound still blocked. Each line jumps to its setting (`useSprungMarkierung`). E2's "sound is blocked, tap once" note shows here and in the center.
- **S3 — why now.** The current rest stage, the next stage and when, the last waking source with its time, the last lux value, "connected since" (#104), and the noisiest entities once #113 S0 exists.
- **#51's capability line** folds into S1 (`:has()`, WebGL, `color-mix`, secure context, engine version), counts and capabilities only, no names. "Why is entity X missing?" stays #51.
- **Restricted user:** with `is_admin` false, a line names what is unavailable for that reason, and the card does not retry admin-only calls.
- Not built: a "safe start" after three failed starts. A card has no restart counter of its own; a reload by hand is the only start it sees.

**Hook (verified):** `utils/kritischTon.js:7–10`, `:12–23`, `:48–53`; `utils/diktat.js:55`; `components/BentoZenView.jsx:401`; `components/common/Fehlergrenze.jsx`; `utils/versionWaechter.js:115`; `components/tabs/SettingsTab/suche/useSprungMarkierung.js`; `components/tabs/SettingsTab/components/AboutSettingsTab.jsx`; `components/tabs/SettingsTab/components/ToastSettingsTab.jsx:192`.

**Effort:** Medium — S1 4–5 h, S2 3–4 h, S3 2–3 h. Bundle ≈ +2–3 KB.

**Why it fits:** Most questions about a wall tablet are "why is it silent" and "why no microphone". The answers are all in the browser and in HA, and the page asks only when it is opened.

**Files (estimate):** `components/tabs/SettingsTab/components/TabletCheckSeite.jsx` (new), `utils/faehigkeiten.js` (new), `utils/kritischTon.js`, `AboutSettingsTab.jsx`, the notification center (E2 note), register, `de.js`/`en.js`, info-popup catalog.

---

### 118. AI mode and dictation — saved questions, appointments by tap, a microphone that shows it hears

> ✅ **S3 shipped, widened, v1.1.2513** (2026-11-02) — calendar AND tasks, create AND edit, by user decision: the AI is sent the calendars and to-do lists the card shows, events from today to +13 days (≤ 80, short refs `E1…`) and open tasks (≤ 120, refs `T1…`); it can create, change, move and delete events (a repeating one only as that occurrence) and add, rename, complete, reopen and delete tasks. Every one is a preview card that runs only after a tap. The card computes day and time in its zone from a 14-day table; refs map back to uid/recurrence_id inside the card and are re-checked at the tap (sent, still visible, write bits). Switch *Calendar and tasks* under General › AI mode (default on). Code: `utils/kiPlaner.js` (not `kiTermin.js`). Timers (#82) not included; S1, S2, S4 still open.

**Pitch:** "Are all windows closed?" becomes a button of your own, and the answer shows the windows as live rows. "Dentist Thursday 3 pm" in AI mode proposes an appointment card that you confirm. While you dictate, a bar follows your voice and says "Too quiet" when nothing arrives.

**Status quo:** AI mode offers three fixed suggestions (`components/ai/AIModeInterface.jsx:204`). The answer is text plus actions (`utils/kiAktionen.js:475`, JSON shape at `utils/kiKontext.js:257`); entities named in an answer are not shown live. The allow list knows no calendar, to-do or timer (`kiAktionen.js:51–108`), and the check refuses a service whose domain differs from the entity's (`:330`). Calendars and timers usually have no room and fall out of the list sent (`hatRaum`, `kiKontext.js:46–51`). Calendar update and delete are WebSocket commands, not services (`system-entities/entities/calendar/index.jsx:245`, `:296`). Dictation asks for 16 kHz and reports a fixed 16 000 to the pipeline without checking the real rate (`utils/diktat.js:24`, `:137`, `:169`). It handles `run-start`, `stt-end`, `error` and `run-end` only (`:150–162`) and gives no feedback while listening besides the blue button.

**What ships:**
- **S1 — saved questions.** Your own questions replace the three fixed suggestions; a tap asks at once. This is the AI-mode half of #31's saved prompts; #31's per-entity prompts with structured output stay there. Every tap costs one model call, and the info says so. No schedule (#13 stays dropped), no tile.
- **S2 — live rows under the answer.** The answer JSON gets an optional `show` with entity ids. Each id is checked against the list that was sent, exactly as actions are, and shown as a small live row; a tap opens the detail (`fsc-open-entity`). `show` goes into the stored history under the same fingerprint rule (`utils/kiStore.js:72`, `:81–92`, `:186`).
- **S3 — appointments and timers by tap.** An action type of its own, not a service on the allow list: "create appointment", and "start timer" once #82 exists. Always with the tap rule and a preview card (title, day, person, calendar). The context gets the calendar people and the writable calendars, nothing else. The card computes the date, not the model. Moving and cancelling come later, because they need events in the context, which widens what is sent; `docs/SECURITY.md` ("What is sent") changes with each step. After saving, the jump and ring of #109 S3.
- **S4 — dictation shows it hears.** While recording, and only then, the level per block from the samples already in hand (`diktat.js:137–146`) drives a `scaleX` bar on the button, at most 8 changes per second. `stt-vad-start` → "Listening", `stt-vad-end` → "Processing". About 3 s below 0.005 → "Too quiet"; only zeros → "Microphone delivers nothing". The pipeline gets the real `ctx.sampleRate`, since HA resamples (per the upstream check of this pass), with a fallback to the default rate when a 16-kHz context fails.
- Not built: sending on end of speech and reopening the microphone after a question. Both break the dictation contract: text is never submitted on its own, the microphone opens only from a visible tap (`diktat.js:18–20`).

**Hook (verified):** `components/ai/AIModeInterface.jsx:204`; `utils/kiAktionen.js:51–108`, `:314–336`, `:475`; `utils/kiKontext.js:46–51`, `:219`, `:257`; `utils/kiStore.js:72`, `:327`; `system-entities/entities/calendar/index.jsx:222`, `:245`, `:296`; `utils/diktat.js:18–20`, `:24`, `:122`, `:137–146`, `:150–162`, `:169`; `hooks/useDiktat.js:6`, `:64–67`.

**Effort:** Medium — S1 2–3 h, S2 3 h, S3 5–6 h, S4 2–3 h. Bundle ≈ +2–3 KB.

**Why it fits:** AI mode already checks every id against what it sent; saved questions and live rows reuse that gate. The dictation fix is a correctness slice in a module that has two consumers since v1.1.2507.

**Files (estimate):** `components/ai/AIModeInterface.jsx`, `utils/kiAktionen.js`, `utils/kiKontext.js`, `utils/kiStore.js`, `utils/kiTermin.js` (new, S3), `utils/diktat.js`, `hooks/useDiktat.js`, `SearchField/components/SearchInputSection.jsx`, `docs/SECURITY.md`, `de.js`/`en.js`, info-popup catalog.

---

### 119. The side bar — order by arrows, only what can act here, Home Assistant's own pages

**Pitch:** Move side-bar entries up and down in the settings. An entry with nothing to do on this tablet hides itself and says why. Energy, History or Map from Home Assistant can be a side-bar entry or a search result.

**Status quo:** The side-bar settings know switches only; the order is the order of activation, and drag-to-reorder is noted as future work (`components/tabs/SettingsTab/components/SidebarItemsSettingsTab.jsx:11–14`, `:139`). Since v1.1.2505 and v1.1.2506 the order matters: six to eight dock slots and the ⋮ overflow. The side bar renders its list without checking whether an entry can act (`components/SearchSidebar.jsx:362–385`). In kiosk mode the card hides HA's header and sidebar and offers no way to HA's own pages (`hass.panels`, `pushState`: 0 hits); it only listens to `location-changed` (`utils/kioskMode.js:235`).

**What ships:**
- **S1 — arrows.** Up and down in the list; the saved order is already read (`SearchSidebar.jsx:95–106`). No drag, no gesture collision.
- **S2 — hide what cannot act.** Entries without a basis (a calendar without calendars, schedules without the scheduler component) stay ticked but hidden, and the settings list names the reason. Home and a way to the settings are guaranteed. The same list feeds #115 S3.
- **S3 — Home Assistant's pages.** Search finds HA's panels from `hass.panels` (energy, history, map, media, to-do, integration panels), optionally as side-bar entries; admin panels only for admins. The jump uses HA's own navigation (`history.pushState` plus `location-changed`, the event `kioskMode.js` already hears). The way back is the weak spot: without HA's header and sidebar only the back gesture leads to the card, so an entry is offered only when a way back exists, and the info popup says so.

**Hook (verified):** `components/tabs/SettingsTab/components/SidebarItemsSettingsTab.jsx:11–14`, `:139`, `:148`; `components/SearchSidebar.jsx:95–106`, `:362–385`; `components/tabs/SettingsTab/suche/vorgaben.js`; `utils/kioskMode.js:235`.

**Effort:** Small to medium — S1 1–2 h, S2 2–3 h, S3 3–4 h. Bundle ≈ +1 KB.

**Why it fits:** The dock made order and space matter, and a wall tablet in kiosk mode otherwise strands the household on one page.

**Files (estimate):** `SidebarItemsSettingsTab.jsx`, `components/SearchSidebar.jsx`, `utils/haSeiten.js` (new, S3), `hooks/useFuzzySearch.js` (S3), `suche/vorgaben.js`, `de.js`/`en.js`, info-popup catalog.

---

**Addenda from the same pass**

- **#33 — `location-changed`, not only `hashchange`.** HA's own `navigate()` uses `pushState` or `replaceState` and fires `location-changed`; no `hashchange` comes with it (per the upstream check of this pass). A dashboard button with `action: navigate` never reaches a `hashchange` listener, and `action: url` opens a new window. "Card emits hashchange events" should read: the card listens to `location-changed` as well, which `utils/kioskMode.js:235` already hears. Whether Lovelace navigation keeps a hash at all is unchecked and must be settled before #33.
- **#49 and #63 — the brightness entity type.** The kiosk integration #49 names has no `light` platform in HA core: screen on and off is a switch, screen brightness a `number` from 0 to 255 (per the upstream check of this pass). #49's "a light entity that does screen on/off and brightness in one" and #63's "screen light entity" should read "screen switch" and "brightness number". The handoff picker already lists switches (`utils/displayUebergabe.js:91`); #110 maps onto the number's own min and max.
- **#63 — one more line for its info popup:** on some Fire OS 8 tablets the panel goes off again seconds after a wake through the screen entity, with no signal to the card (#104 S2).
- **D10 — what one answer decides, and who sees it.** The answer decides six ideas of this pass: the deviation row, the urgent line and the day-plan face (#111 S2–S4), the photo caption (#107 S5), and with them status and context line. Add to the options: whatever stands in rest is shown to guests too — titles only from chosen calendars, or counts without titles. Its side note on a photo server as a source of its own is answered by #107 S2, through HA's media source and with no key in the card.
- **#3b E2 — marked shipped, two parts missing.** The re-arm on the first tap after a reload has no listener (the AudioContext is created only at the first tone, `utils/kritischTon.js:18–23`), and the "sound is blocked, tap once to enable" note was never built; `spieleKritischTon()` returns true while the context is still suspended (`utils/kritischTon.js:48–53`). The note lands in #117 S2 and the center.
- **#12 — strike the wake-word part.** A browser card cannot hold a microphone open in rest: the heat rule forbids it, the permission belongs to a visible tap, and there is no microphone without a secure context. The wake word belongs on a satellite or the kiosk app; the card only shows.
- **#72 — a fifth truth in the evening:** "Alarm tomorrow 6:30", only when an alarm comes within 24 h. Found as `sensor.*` with `device_class: timestamp` and the ending `next_alarm` (the companion app's sensor and comparable kiosk-app sensors), read from `hass.states`, mapped to a person through their phone where that is unambiguous; the evening hour from `utils/reminderSources.js:34`. Also a block of #111 S2.
- **#75 S1 — a reading stage instead of a lift.** For appointment reminders, the reading stage of #105 S5 is the better answer than lifting a stage; decide both together.
- **#82 — the end and the name.** What happens when a timer ends, and a named timer from the search line, are #102; #82 keeps the controls.
- **#84 — one more kind:** "should charge, does not" — a chosen battery sensor below its threshold while the charging sensor of the same device reads off. Battery thresholds exist as watches already (`utils/watchSuggestions.js:29–31`).
- **#85 — the announced way out** for a forgotten PIN is #115 S2: the lock follows an HA entity, switched from the phone.
- **#4 — two slices for the full-frame camera view, once it exists.** Pinch to zoom and pan on still or stream (transform only, clamped at the edges, a double tap resets, the back swipe belongs to panning while zoomed). A sound button on the WebRTC stream, which is muted today (`components/controls/WebRtcHeroStream.jsx:37`), muted again on leaving. Not called a baby monitor: a browser card fails silently. Keeping the view open runs through a hold reason of #103 with a cap, stated as deliberate load.
- **D8 — a third option.** A still-image wall: on open, one snapshot per camera with a width; afterwards only the tile whose motion sensor on the same device reports an edge is fetched again; each tile shows its age; a tap goes live for that camera only. No poller, so the v1.1.2152 heat objection does not apply. Cameras without a motion sensor stay at their opening state.
- **D5 — a new argument.** Some fields are bound to one device (room, name, screen entity, brightness entity, the end time of a manual hold, and this tablet's speaker of #138 S1) and must never travel in a shared settings package.
- **#21 — HA's own state words.** Tile states and the chronicle could use `hass.formatEntityState` where the card's language equals the HA profile language, with the card's word list as fallback (0 hits today). Start with the chronicle. No bundle saving planned; search needs the words anyway.
- **#22 — requirements input (not music).** Entities for the tablet's own state that HA can read (resting, held, display stage, connection); a timer that rings on the tablet with no card open; a list of satellite voice timers, which HA keeps without entities; a call to one tablet and its answer without a persistent notification in everyone's bell; events from the card (call answered, alarm acknowledged), which need admin rights or a server part.
- **D15 — a new open decision:** whether the card may use a kiosk app's JavaScript bridge. See the table under "Open decisions".

---

## Part sixteen — 2026-11-02 charts and schedules (#120–#127)

Eight entries and six addenda (a worked one to #3, short ones to #59, #21, #96, D3 and #22) from reading two cards against the code at v1.1.2509: a large statistics chart card and a small card for Home Assistant's schedule helper. Ideas only, nothing taken from their code or wording. Both comparisons turned up repairs in the card's own code, and those come first in each group.

**Charts (#120–#124).** Five entries from reading a large statistics chart card for Home Assistant against the chart pipeline at v1.1.2509: its documentation, its releases, its issue tracker and its data layer. Ideas only, nothing taken from its code or its wording. Most of that card is dashboard-builder surface: a dozen chart modes, zoom, sync between cards, templates and hundreds of options. None of that fits a configuration-free touch card. What carries over is how it treats data: attribute history needs every update, statistics rows already carry min, max and change, a running period is compared only with the same part of the last one, and an outage is a gap. Reading this card's chart code next to it turned up the repairs in #120 and #121, which come first. Not taken: extra chart modes, heat maps and zoom (each a new renderer or plugin, and the gesture budget is spent), templates and value scripts (against #3, #54 and D9), cost views (#6 dropped), mini graphs on tiles (#26 retired), export, a comfort band built from the card's text thresholds, number formatting for the charts alone (a card-wide #21 question), weather attributes as chips, price and forecast arrays read from attributes, and moving the history call from REST to the WebSocket. Two wishes that need the server went to #22 as requirements input: long-term statistics for attributes, and on-time statistics for on/off entities.

**Schedules (#125–#127).** Three entries and one addendum from reading a small single-purpose card against the code at v1.1.2509. That card shows Home Assistant's built-in schedule helper in three ways: on or off, the next switch with a countdown, and a band of on-blocks over up to seven days. Ideas only, nothing taken from its code. The comparison turned up two things in the card itself: it does not know the schedule helper at all, and its scheduler editor loses data on ordinary saves. What follows works over Home Assistant's standard APIs and the scheduler integration the card already talks to. Not taken: the source's poll every few minutes and its half-minute render timer, replaced by state changes and the shared minute tick; hover tooltips, replaced by a tap; per-card colours, a manual hour window and a visual card editor, because the card is configured in its own settings; schedule blocks inside the calendar views, where they would bury the family's events; a countdown in seconds, which needs a one-second runner; a week band for one device's scheduler plans, which would have to guess sun offsets and the workday sensor on other days; editing the helper's blocks from the card, which needs an admin user that wall tablets rarely run; binding a helper to a device, which is requirements input for #22.

---

### 120. Charts tell the truth — four repairs

> ✅ **S1–S4 shipped v1.1.2520** (2026-11-03) — S1: `getChartData`, the history path, the year comparison and the custom range return the headline (`kopf`) from their own answer; `SensorChartView` has no separate headline fetch (`getCustomRangeValue` removed); counters use the rows' `change`, the baseline fetch runs only when a row lacks it; a running measurement headline follows its one value through the hass store without the spring; nothing = "–". S2: attribute series of light, fan and cover add `significant_changes_only=0`; attribute rows read `last_updated` first. S3: `total` with an energy/volume unit takes the counter path incl. the year comparison, not clamped to 0; units TWh, MJ, GJ, mL, CCF added. S4: `fetchStatistics` rethrows instead of its broken history fallback; `aggregateHistory`/`naechsteBucketGrenze` removed. The D3-dependent part of S4 (energy view unit from the metadata list, period energy from summed `change`) stays open. Honesty rule open: not checked against a real dimmable light's Home Assistant history.

**Pitch:** These are fixes, not features. Today a history chart can show a wrong number in four places: a big 0.00 above a chart full of values, a dimmed lamp that never seems to dim, a kWh helper drawn as its meter reading, and an energy view that labels Wh as kWh.

**Status quo:**
1. Every numeric entity without a `state_class` is sent as `measurement` (`utils/entityChartConfig.js:49`). The headline asks for long-term statistics and gets an empty answer. It then returns 0 (`services/sensorStatistics.js:514–516`) before it reaches the branch that shows the current state (`:526–531`). The chart beside it falls back to history (`:787–797`) and shows real values. This hits `number`, `input_number` and `counter` entities, template sensors without a state class, and new sensors whose statistics are not built yet. The comment at `components/charts/ChartsHistoryView.jsx:269–273` expects the history path for these. Headline and chart also fetch separately (`components/charts/SensorChartView.jsx:155–169`, `:174–206`). On the history path that is the same call twice (`sensorStatistics.js:457`, `:297`). Counters add two baseline calls (`:544`, `:780`). The headline is read once and goes stale while the view is open.
2. Attribute charts use the REST history call with Home Assistant's default significance filter (`sensorStatistics.js:69–72`). For light, fan and cover the filter drops rows where only an attribute changed, because these are not among the recorder's significant domains. Dimming or a speed change while the device stays on never reaches the chart. The chart shows only the value at each state change. Climate, humidifier and water heater are not affected: under the filter the recorder does not select `last_changed`, so the time on each row is its update time.
3. `shouldUseStatistics` knows only `measurement` and `total_increasing` (`sensorStatistics.js:277–281`). A sensor with `state_class: total` takes the history path and is drawn as bucket means of its meter reading. The most common case is the Riemann-sum integration helper that turns watts into kWh, because Home Assistant sets `total` there. Net-consumption utility meters are another. Plain utility meters are `total_increasing` and are fine. The unit list (`:247–256`) misses MJ, GJ, TWh, mL and CCF.
4. The energy view reads the statistics metadata as an object keyed by id (`system-entities/entities/integration/device-entities/components/EnergyChartsView.jsx:59`). Home Assistant returns a list with `statistics_unit_of_measurement`, so the unit is always the 'kWh' fallback. Its period energy is a difference of `state` values (`:268–270`). The history fallback in `fetchStatistics` (`system-entities/entities/integration/device-entities/energyDashboardCalculations.js:256–292`) reads the compressed `lu` time in seconds as milliseconds (`:84`) and multiplies the value by 1000 (`:92`). It only runs when the statistics call throws. When it does run, every row is dated 1970.

**What ships:**
- **S1 — one answer, one headline.** The headline comes from the chart's answer. A counter shows the sum of its buckets. A measurement sensor shows the current state for the running period and the last value for a past one. Empty statistics no longer give 0.00. The second fetch goes. Counters read `change` from the rows they already get: the call sends no `types`, so Home Assistant includes `change`, computed against the sum before the window. The baseline fetch goes too. While the view is open, the running headline follows `hass.states`, without the spring animation on live updates. The two-bar year chart for counters keeps its current-year bar as the headline.
- **S2 — dimming is history too.** Attribute series of light, fan and cover add `significant_changes_only=0`, which is a REST parameter. They also take `last_updated` before `last_changed` (`:98`). The two changes belong together. Without the filter the recorder includes the real `last_changed`, and for an attribute-only row that is the last time the state changed.
- **S3 — `total` counts as a counter.** A `total` sensor with an energy or volume unit takes the counter path, as `total_increasing` does, including the year special case (`:740`). The unit list gets the missing units. Net meters can go negative, so `total` is not clamped to 0 (`:815`).
- **S4 — tidy the energy side.** Remove the history fallback in `fetchStatistics` and rethrow instead; the callers already catch. `aggregateHistory` (`:73–107`) and `naechsteBucketGrenze` (`:52`) have no other caller and go with it. Removing the fallback stands either way, because `fetchStatistics` is shared. Only if D3 keeps the energy view: read the unit from the metadata list entry, and take period energy from the summed `change`.
- **Honesty rule:** S2 changes the light charts everyone sees. Check one dimmable light against Home Assistant's own history before release.

**Hook (verified):** `utils/entityChartConfig.js:49`; `services/sensorStatistics.js:69–72`, `:98`, `:247–256`, `:277–281`, `:297`, `:363–384`, `:457`, `:514–516`, `:526–531`, `:544`, `:740`, `:780`, `:787–797`, `:815`; `components/charts/SensorChartView.jsx:139–150`, `:155–169`, `:174–206`; `components/charts/ChartsHistoryView.jsx:269–273`; `energyDashboardCalculations.js:52`, `:73–107`, `:246–252`, `:256–292`; `EnergyChartsView.jsx:50–65`, `:268–270`.

**Effort:** Medium — 5–6 h in four small slices (S1 2 h, S2 1 h, S3 1–2 h, S4 1 h). Bundle about ±0 KB: S4 deletes about 0.5 KB, S1 deletes the baseline fetch, S2 and S3 add about 0.2 KB.

**Why it fits:** People read a wall tablet; they don't debug it. A big 0.00 above a full chart makes every other number on the screen suspect. Like #69, these are repairs without a design question.

**Files (estimate):** `services/sensorStatistics.js`, `components/charts/SensorChartView.jsx`, `utils/entityChartConfig.js`, `energyDashboardCalculations.js`, `EnergyChartsView.jsx`.

---

### 121. The running period at full width, and a fair "so far"

**Pitch:** At 10:00 the day chart keeps all its hours: the morning is drawn, the rest is empty, and a quiet line marks now. Yesterday's ghost runs to midnight. The header says "−4 % so far vs. yesterday" and compares today until 10:00 with yesterday until 10:00.

**Status quo:**
- The statistics path builds its labels from the rows it gets back (`services/sensorStatistics.js:799–823`). At 10:00, ten hourly rows fill the whole width. An hour without a row drops off the axis and leaves no gap.
- The history path does the opposite. It fills every hour, day and month of the period with the last value, into the future (`:212–237`). It draws the time before the first value as 0 (`:199`). v1.1.2448 stopped this for picked ranges only (`:866–870`).
- The ghost has 24 values but only ten labels (`components/charts/SensorChartView.jsx:300–303`), so yesterday's afternoon is cut off.
- The delta sums or averages all buckets of both periods (`SensorChartView.jsx:345–366`). For a kWh meter at 10:00 that is ten hours against 24, about −60 % every morning. For a measurement sensor it compares a morning mean with a whole-day mean. The v1.1.2373 probe already wrote "partial day" next to its result.
- `unavailable` rows are skipped (`sensorStatistics.js:94`) and the carried value bridges the gap (`:193–200`). History buckets average per sample (`:195`), while Home Assistant's statistics are time-weighted.

**What ships:**
- **S1 — slots.** Both paths use one slot list per period: the hours of the day (23, 24 or 25), the days of the week or month, the months of the year. Each period keeps the zone it already uses. The history path already builds this list (`:212–237`); the statistics path maps its rows onto it by `start`. Slots after now stay empty, and so does the time before the first value. History slots use a time-weighted mean, like the statistics. A static now line is drawn once, with no animation. `spanGaps` stays off. The tooltip and axis callbacks get a null guard (`energyChartConfigs.js:297`, `:323–325`).
- **S2 — a fair delta.** The delta uses only the slots the current period has filled, and the same slots of the previous period. It counts up to the last filled slot, not to now, because the statistics row for the running hour is only written once the hour has ended. While the period runs, the label says "so far". The ghost keeps its full length and is aligned by slot key, not by index.
- **S3 — outages are gaps.** `unavailable` rows stay as markers. A slot is empty when the sensor was unavailable for most of it. Silence is not an outage: a setpoint held for hours keeps its line.
- **S4 — the base of the comparison (optional).** A choice next to the switch: the previous period, or for the day view the same weekday last week, and for week, month and year the same period a year earlier. The ghost's tooltip names its own date. The choice is stored per sensor, with the switch (`utils/chartVergleich.js`).
- **One rule:** the two-bar year chart for counters (`sensorStatistics.js:740–742`) stays as it is.

**Hook (verified):** `services/sensorStatistics.js:94`, `:186–240`, `:740–742`, `:799–823`, `:866–870`; `components/charts/SensorChartView.jsx:222–224`, `:297–327`, `:345–366`, `:373–387`; `system-entities/entities/integration/device-entities/components/energyChartConfigs.js:232`, `:297`, `:323–325`; `energyDashboardCalculations.js:144–227` (`calculatePeriodDates`); `components/charts/ChartPeriodHeader.jsx:194–210` (the switch lives in the calendar).

**Effort:** Medium — 6–9 h (S1 3 h, S2 2 h, S3 1–2 h, S4 2 h). Bundle about +0.7 KB.

**Why it fits:** The comparison is the only analysis the charts offer, and every morning it is wrong. This corrects #59 rather than adding to it.

**Files (estimate):** `services/sensorStatistics.js`, `components/charts/SensorChartView.jsx`, `energyChartConfigs.js`, `components/charts/ChartDatePopover.jsx` and `utils/chartVergleich.js` (S4), `de.js`/`en.js`.

---

### 122. How long was it on — a band for on/off entities

**Pitch:** A switch, a lamp, a window contact or a lock gets a coloured band across the day: "on 3 h 12 min · 13 %". The week view shows seven slices with each day's share. A thermostat chart shows the hours the heating actually ran as a soft band under the temperature line.

**Status quo:** On/off entities get no chart. Their history opens on the logbook list (`utils/entityChartConfig.js:154–156`, `:165`; `components/charts/ChartsHistoryView.jsx:280–284`). Nothing in the card shows a duration or a share of time. A thermostat's history has two chips, current and target temperature, each with its own fetch and shown one at a time (`utils/entityChartConfig.js:55–75`). `hvac_action` is read for the live strip (`utils/liveActivitySources.js:206`), never for history.

**What ships:**
- **S1 — the band for day and week.** One history call per window, with `minimal_response` and `no_attributes`. The segments are built in one pass. The active state comes from `isEntityActive` (`utils/translations/helpers.js:189`). Unavailable, unknown, the future and the time before the first row are grey. The share is active time divided by the time with data. The band is plain positioned elements with percentage widths, without Chart.js. Segments narrower than a pixel merge, because a motion sensor can flip thousands of times a day. Tapping a segment shows "18:02–18:47 · 45 min" under the band. The band sits above the logbook list, which stays. A universal device gets one band per on/off control entity.
- **S2 — month.** Day slices shaded by their share.
- **S3 — the thermostat.** The current-temperature chart reads `hvac_action` from the rows it already loads; the climate fetch carries full attributes. It draws heating or cooling time as a band under the line and puts "heated 4 h 10 min" in the header. The target becomes a thin stepped line in the same chart. An integration without `hvac_action` gets no band.
- **Honesty rule:** Home Assistant keeps no long-term statistics for on/off states or for attributes. Beyond the recorder's retention (ten days by default) the band is grey and says why. Long-term on-time is a requirement for #22.
- **Thermal rule:** everything is computed once per fetch. Nothing ticks: the running segment ends at the fetch time until the view reloads.
- **PurgeCSS rule:** use inline style variables. No composed class names.

**Hook (verified):** `utils/entityChartConfig.js:55–75`, `:154–156`, `:165`; `components/charts/ChartsHistoryView.jsx:241–284`; `components/charts/DeviceActivitiesView.jsx:95–135`; `services/sensorStatistics.js:54–114` (the history call to reuse; today it parses numbers only); `utils/translations/helpers.js:189`; `utils/liveActivitySources.js:206`.

**Effort:** Medium — 9–12 h (S1 5–6 h, S2 1–2 h, S3 3–4 h). Bundle about +1.5 to 2.5 KB.

**Why it fits:** "How long was the heating on" and "how long was the window open" are what a household asks of history. Today the card answers with a list of timestamps.

**Files (estimate):** `components/charts/ZustandsBand.jsx` (new), `utils/zustandsSegmente.js` (new), `services/sensorStatistics.js`, `components/charts/ChartsHistoryView.jsx`, `components/charts/SensorChartView.jsx` and `energyChartConfigs.js` (S3), `de.js`/`en.js`.

---

### 123. Opening a day or a span with the same numbers as the period views

**Pitch:** Tap a bar in the month view, and that day opens. Pick a single day in the calendar, and it opens as a normal day with arrows and comparison. Pick a span ("our holiday", "last winter"), and a meter shows its consumption, as in the week and month views, reaching back as far as the statistics go.

**Status quo:** The chart has no `onClick` (`system-entities/entities/integration/device-entities/components/energyChartConfigs.js:256–330`). A tap only shows the tooltip (`:264`). To see one day of a month, the user opens the calendar and taps that day twice (`components/charts/ChartDatePopover.jsx:109–121`). That makes a picked span, unless the day is today (`components/charts/ChartsHistoryView.jsx:170–173`, v1.1.2449). Picked spans use raw history only and ignore the state class (`services/sensorStatistics.js:897–913`, `:916–928`). A kWh meter then shows bars of its meter reading and the reading as its headline; the v1.1.2447 note records this as "the real 122 → 156 kWh curve". Beyond the recorder's retention the span is empty for every sensor.

**What ships:**
- **S1 — one day is a day.** A single picked day opens as the day view at its `periodIndex`, as v1.1.2449 already does for today. It gets the statistics path, the arrows and the comparison.
- **S2 — tap a bar.** The first tap keeps the tooltip and marks the bar; the existing highlight already colours one bar (`components/charts/SensorChartView.jsx:275–288`). A pill under the chart, "Wed 14 Oct — open", opens that day, or that month from the year view. A "‹ Month" chip goes back one level. The pill disappears on a tap elsewhere or when the period changes. Only plain taps on the canvas: no long-press and no swipe, because the gesture budget is spent (#25, Out of scope).
- **S3 — spans read statistics.** An entity on the statistics path calls `recorder/statistics_during_period` with the bucket the span already uses: hourly up to two days, daily up to 92 days, monthly beyond (`sensorStatistics.js:864–892`). A counter takes `change` per bucket, and their sum is the headline. A measurement sensor takes `mean`; when the span ends today, the headline is the current state. An entity without statistics keeps raw history and says so when the span starts before the oldest row.
- **One trap:** `ChartsHistoryView` resets `periodIndex` to 0 whenever `timeRange` changes (`:96`). S1 and S2 must set the range and the index in one step.
- **One trap:** a bar's target day comes from its date key in the zone of its period, not from its timestamp. Week and month bars are server-zone days, while the day view runs in the card zone. Spans are card-zone days (`ChartsHistoryView.jsx:177–178`), so for spans up to 92 days, hourly rows re-bucketed in the card zone are the safe choice (about 2,200 rows).
- Comparison stays off for spans, as decided.

**Hook (verified):** `energyChartConfigs.js:256–330`, `:264`; `components/charts/ChartDatePopover.jsx:109–121`; `components/charts/ChartsHistoryView.jsx:94–96`, `:164–181`; `components/charts/SensorChartView.jsx:161–165`, `:182–186`, `:275–288`; `services/sensorStatistics.js:848–894`, `:897–913`, `:916–928`.

**Effort:** Medium — 8–10 h (S1 1 h, S2 3 h, S3 4–6 h). Bundle about +1 KB.

**Why it fits:** Today the same meter shows consumption in one view and its meter reading in the next. Getting from "which day was high" to "what happened that day" should be one tap on a touch screen.

**Files (estimate):** `components/charts/ChartsHistoryView.jsx`, `components/charts/SensorChartView.jsx`, `services/sensorStatistics.js`, `de.js`/`en.js`.

---

### 124. Peaks that survive — true extremes and a five-minute day

**Pitch:** When the oven peaked at 4.2 kW, the Max pill of a power sensor says 4.2 kW, not the 1 kW of its hourly mean. The day curve shows the kettle and the dip while the window was open. The year view finds the coldest night of the year, not only of the last ten days.

**Status quo:** The statistics call sends no `types` (`system-entities/entities/integration/device-entities/energyDashboardCalculations.js:246–252`), and Home Assistant then returns every type, `min` and `max` included. Only `mean` is used (`services/sensorStatistics.js:805–808`). The pills take the extremes of the bucket means (`components/charts/SensorChartView.jsx:373–387`). The day view uses hourly rows (`sensorStatistics.js:747`), and the tooltip title assumes whole hours (`energyChartConfigs.js:284–288`). The high and low in Activities come from raw history over the whole period (`sensorStatistics.js:574–604`, called from `components/charts/DeviceActivitiesView.jsx:107–117`). In a month or year view they cover only the recorder's retention. For a meter they are its first and last reading.

**What ships:**
- **S1 — honest pills.** Measurement buckets keep `min` and `max`. The pills show the lowest min and the highest max. History buckets compute both from their samples. In the week, month and year views, the Activities high and low become the extreme day or month from daily or monthly statistics, with its date, instead of a raw-history fetch. Counters show no high or low derived from readings.
- **S2 — five minutes.** The day view of a measurement sensor asks for `period: '5minute'`, at most 288 rows. If the answer is empty because the short-term rows are already purged, it falls back to hourly. Counters stay hourly bars. The tooltip names the slot ("10:05–10:10"). This needs #121 S1 first.
- **S3 — the band in the day view.** A soft min–max band behind the line, drawn as two transparent datasets with `fill: '-1'`. Filler is already registered (`utils/chartKern.js:24`, `:55`). For the bars of the week, month and year views, decide with a mockup first. The ghost gets no band.

**Hook (verified):** `energyDashboardCalculations.js:246–252`; `services/sensorStatistics.js:574–604`, `:747`, `:799–823`; `components/charts/SensorChartView.jsx:373–387`; `energyChartConfigs.js:284–288`; `components/charts/DeviceActivitiesView.jsx:107–117`; `utils/chartKern.js:24`, `:55`.

**Effort:** Medium — 6–9 h (S1 2–3 h, S2 2–3 h, S3 2–3 h). Bundle about +1 KB.

**Why it fits:** The data is already in the answer the card receives. Today the card averages away exactly the moments people look for.

**Files (estimate):** `services/sensorStatistics.js`, `components/charts/SensorChartView.jsx`, `energyChartConfigs.js`, `components/charts/DeviceActivitiesView.jsx`.

---

### 125. Scheduler edits keep what they did not touch

> ✅ **Shipped v1.1.2517** (2026-11-03) — plans are read whole from the integration's WebSocket list (`{type: 'scheduler'}`, `utils/schedulerPlaene.js`) in the device tab and the overview; a save reads the plan again and sends it back with only the changed fields (time slot shown by the editor, this device's action only if changed, days/repeat/start/end only if changed), keeps the other slots, conditions, `start_date`/`end_date`, sun times and `workday`, never sends the name, leaves null fields out, sends nothing when nothing changed (an edit re-runs the current slot), rebuilds the action only when the user touched it, and refuses when the slot changed in between or the entry came from the switch attributes. A timer is only what the countdown editor can write back losslessly (one slot, no stop, at most one weekday that is today's or tomorrow's next occurrence, no date range, not `repeat`), in both places; switching a plan to Timer on purpose saves one slot without a date range; the overview opens the device tab's own entry. One weekday map in both directions (`tageWert`/`tageAusWert`), sun slots read "☀ Sunrise −0:30" and stay fixed in the editor. Not built: editing other slots or conditions in the card (a hint says they stay).

**Pitch:** Open a plan, change the time, save. The days, the other time slots, the conditions, the date range, the name and whether it repeats stay as they were. Today an ordinary save can turn a one-shot timer into a weekly plan, a Mon–Fri plan into a one-day plan, or fail.

**Status quo:** Read, not run. The editor works from the plan switch's attributes, which do not hold the whole plan.
- The overview sorts items into timers and plans by `attributes.repeat_type` (`system-entities/entities/all-schedules/AllSchedulesView.jsx:243–244`). The scheduler switch does not carry it; its attributes are weekdays, timeslots, entities, actions, current_slot, next_slot, next_trigger and tags. Every item counts as a plan, and the Timer chip stays at zero.
- Overview items have no end time (`AllSchedulesView.jsx:232–251`). The plan editor then keeps its default end `'01:00'` (`ScheduleTab/utils/editStateLoaders.js:127–129`, `ScheduleTab/hooks/useScheduleForm.js:77`, `:131`) and saves it as `stop` (`components/tabs/ScheduleTab.jsx:441`). A timer edited from the overview comes back as a weekly plan "HH:MM–01:00".
- In the device tab every plan without an end time is a timer (`utils/scheduleUtils.js:244–245`). The timer editor saves one weekday (`ScheduleTab.jsx:374`, from `ScheduleTab/utils/scheduleHelpers.js:19–43`). A repeating start-only plan made elsewhere, such as "Mon–Fri 06:30 heating on", runs on one day after a save.
- `repeat_type` is always `'repeat'` (`utils/scheduleUtils.js:168`, `:192–207`). It is loaded into the picker (`editStateLoaders.js:105`, `:133`) and saved back (`ScheduleTab.jsx:380`, `:445`). A one-shot timer repeats every week after an edit.
- Only slot 0 and action 0 are read (`utils/scheduleUtils.js:254–255`, `:290–291`). The edit sends one slot without conditions (`ScheduleTab.jsx:436–446`). The integration replaces the whole slot list, so the other slots and every condition are gone.
- The edit sends no `start_date` or `end_date`. The integration's edit schema fills both with null and writes them, so a plan's date range is cleared.
- Every edit sends a generated name (`ScheduleTab.jsx:379`, `:434`, `:444`), which differs from the name given at creation (`:399`). A name change makes the integration remove the switch from the entity registry and announce the plan as new, and the switch's id is derived from the name. Automations that point at the old id break.
- Weekday labels do not round-trip. `formatWeekdays` is called without a language (`utils/scheduleUtils.js:274`, default `'de'` at `utils/scheduleConstants.js:62`) and knows neither `daily`, `workday` nor `weekend`. Its "Werktags" is not the picker's "Mo-Fr", and unknown labels fall to their first three letters (`ScheduleTab/utils/scheduleHelpers.js:81`): "wer", "woc", "dai", "wor", and in English "mo". The integration rejects them, so saving a Mon–Fri plan fails unless the days are picked again. The overview checks for `'weekdays'` where the integration writes `'workday'` (`AllSchedulesView.jsx:187`).
- Sun-based slots ("sunrise-00:30:00") are cut to five characters and read "sunri" (`utils/scheduleUtils.js:25–27`, `:31`; `AllSchedulesView.jsx:237`).

**What ships:**
- The plans are read with the integration's own WebSocket list (`{type: 'scheduler'}`, no admin needed). It returns each plan whole: repeat type, all slots with conditions and actions, weekdays, date range, name and entity id. One call when the Schedule tab or the overview opens, and again when one of the plan switches changes in `hass.states`.
- A save sends the plan back with only the touched slot changed. Other slots, conditions, dates and the repeat type go back as they came. The name is sent only when the user changed it.
- Timer or plan follows the repeat type in both places. A repeating plan with a start time only opens in the plan editor with its days; the countdown editor is for one-shot timers.
- One weekday map in both directions (`mon`…`sun`, `daily`, `workday`, `weekend`), with labels from the dictionary in the current language.
- Sun slots read "☀ sunrise −0:30" and are saved unchanged.
- **One rule:** stored fields that are null (end time, condition attribute, condition type) are left out on save, because the edit schema rejects null there.

**Hook (verified):** `AllSchedulesView.jsx:187`, `:232–251`, `:243–244`; `utils/scheduleUtils.js:25–31`, `:168–170`, `:192–207`, `:244–245`, `:254–255`, `:274`, `:290–291`; `utils/scheduleConstants.js:62–98`; `components/tabs/ScheduleTab.jsx:226–230`, `:264–267`, `:372–381`, `:434–446`, `:462`; `ScheduleTab/utils/editStateLoaders.js:105`, `:127–133`; `ScheduleTab/utils/scheduleHelpers.js:19–43`, `:53–82`; `ScheduleTab/hooks/useScheduleForm.js:77`, `:131`.

**Effort:** Medium — 5–7 h. Bundle about +0.5–1 KB gzip.

**Why it fits:** A save that changes what it did not touch is the worst kind of bug on a shared tablet: nobody notices until the heating stays off. The fix uses the integration the card already requires.

**Files (estimate):** `utils/scheduleUtils.js`, `utils/scheduleConstants.js`, `components/tabs/ScheduleTab.jsx`, `ScheduleTab/utils/editStateLoaders.js`, `ScheduleTab/utils/scheduleHelpers.js`, `ScheduleTab/hooks/useScheduleData.js`, `system-entities/entities/all-schedules/AllSchedulesView.jsx`, `de.js`/`en.js`.

---

### 126. Home Assistant's schedule helper — a view of its own, a week band, a place in the overview

**Pitch:** A `schedule.*` helper opens to "On · until 20:00" or "Off · from Fri 08:00", with the running block's values as chips, such as "21 °C". Below it, seven day rows show when it runs, today first, with a line at the current time. The schedules overview lists the helpers too, so it is useful without a third-party integration.

**Status quo:** The card does not know the helper. The registry has no `schedule` module (`utils/deviceConfigs/registry.js:24–42`), so the fallback shows a power toggle for any on/off state (`utils/deviceConfigs/domains/fallback.js:25`, `:56`). Its default handler calls `turn_on` or `turn_off` on the entity's own domain (`utils/domainHandlers.js:89–95`, `components/tabs/UniversalControlsTab.jsx:451–463`). `schedule.turn_on` does not exist; the helper offers only `get_schedule` and `reload`. The Schedule tab is offered for it (`utils/detailTabs.js:53–57`) and would build `schedule.turn_on` actions (`ScheduleTab/utils/serviceActionBuilders.js:119–125`). `next_event` and `get_schedule` have no match in `src`. The overview lists `switch.schedule_*` only (`AllSchedulesView.jsx:353–357`); without the scheduler integration, the overview behind the default W2 tile is empty. No view in the card is proportional to time across a week, and the day grid has no now-line (`system-entities/entities/calendar/components/TagesRaster.jsx:7–8`).

**What ships:**
- **S1 — the helper view.** A domain config `schedule` with a read-only ring in the state colour. Centre text: "On · until 20:00" or "Off · from Fri 08:00". The relative part ("in 1 h 05 min") is a small leaf on the shared minute tick, so the ring does not re-render each minute. Chips show the running block's values: every attribute except `next_event`, `editable`, `friendly_name` and `icon`. No power toggle. The Schedule tab is dropped for this domain.
- **S2 — the week band.** Seven rows, today first and tinted. Each is a 24-hour track with the blocks painted in and the day's total at the end. A tap on a row lists that day's blocks with from–to, length and values. The data comes from `schedule.get_schedule` through `call_service` with `return_response`. It covers UI and YAML helpers alike, needs no admin and is addressed by entity id. Fetched on open, and again when the entity's state or `next_event` changes. The visible hours are automatic: earliest start to latest end of the week, rounded to two hours, at least six. Days in the server's zone, with the "server time" hint when the zones differ.
- **S3 — the overview.** Helpers appear as a third kind next to timers and plans, from the same `hass.states` snapshot, with a chip and count of their own in the overview. One `get_schedule` call per helper when the overview opens, through the same cache as S2. A tap opens the helper view through `fsc-open-entity`, which also reaches helpers without a room.
- **Honesty rule:** `next_event` is the next boundary, not the end of the block. Touching blocks keep the state on, at midnight and between two blocks on the same day. "Until" therefore comes from the merged blocks, which is why S1 makes the `get_schedule` call too. Without blocks the line says "changes at 00:00", never "until".
- **Thermal rule:** blocks are static spans in percent. The now-line is one element moved with `transform` on the shared minute tick, on today's row only. No polling and no subscription of its own; nothing runs once the view is closed.
- **Traps:** `get_schedule` returns 24:00 as `"23:59:59.999999"`. Days with a clock change keep 24 wall-clock units. Empty days stay visible ("–"). A 15-minute block is a few pixels wide on a phone, so the whole row is the touch target.

**Hook (verified):** `utils/deviceConfigs/registry.js:24–42`; `utils/deviceConfigs/domains/fallback.js:25`, `:56`; `utils/domainHandlers.js:89–95`; `utils/detailTabs.js:53–57`; `components/controls/PresetButtonsGroup.jsx:55–74` (custom render slots, home of the band); `utils/wetterVorhersage.js:58` (`call_service` with `return_response`); `utils/minutenTakt.js:75–103`; `system-entities/entities/calendar/utils/relativeZeit.js:64`; `utils/zeitzone.js:252`, `:259`, `:338`; `AllSchedulesView.jsx:323–327`, `:353–357`; `providers/entityZulassung.js:28–31`, `:109`; `system-entities/entities/notifications/NotificationsView.jsx:254` (`fsc-open-entity`).

**Effort:** Medium — 12–15 h in three slices (S1 3–4 h, S2 6–8 h, S3 3 h). Bundle about +5–6.5 KB gzip in total (S1 1–1.5, S2 3–4, S3 1).

**Why it fits:** The schedule helper is built into Home Assistant, and today the card shows it with a button that fails. Home Assistant shows the week only in the helper editor of its settings; the wall tablet is where people ask when the heating runs.

**Files (estimate):** `utils/deviceConfigs/domains/schedule.js` (new), `utils/deviceConfigs/registry.js`, `utils/detailTabs.js`, `utils/zeitfenster.js` (new: fetch, cache, merge, "until"), `components/controls/WochenBand.jsx` (new) and its CSS, `PresetButtonsGroup.jsx`, `AllSchedulesView.jsx`, `de.js`/`en.js`, info-popup catalog.

---

### 127. The next run, from the scheduler itself

**Pitch:** Scheduler rows say "Mon 06:30 · in 2 d 3 h" instead of "Remaining 1430 min". The overview sorts by what runs next. The W2 tile on the start page reads "Next: heating 06:00" instead of the word "Overview".

**Status quo:** The scheduler writes the next run onto each plan switch as `next_trigger`; the card never reads it (no match in `src`). `nextExecution` reads an attribute that does not exist (`utils/scheduleUtils.js:279`), and nothing reads `nextExecution`. The timer countdown guesses today or tomorrow regardless of weekday (`utils/scheduleUtils.js:306–313`), and the row prints raw minutes (`ScheduleTab/components/ScheduleListItem.jsx:43`). The overview sorts by the clock string of the first slot (`AllSchedulesView.jsx:395–397`). While timers exist, the device tab reloads every 60 s (`ScheduleTab/hooks/useScheduleData.js:83–96`). Each run sets `isLoading` (`:40`), which swaps the list for the loading text (`ScheduleTab/components/ScheduleList.jsx:46–49`), so the rows mount again and replay their entry animation every minute (read, not run). The W2 tile returns the fixed word "Overview" (`components/DeviceCard.jsx:541–543`, name at `:578`). The calendar tile beside it already names its next event (`:493–528`).

**What ships:**
- **S1 — rows and order.** The rows read `next_trigger`. "In" counts in minutes under 90, then hours, then days and hours, from a pure function in a minute-tick leaf. The absolute time keeps its server-time hint. The overview sorts by `next_trigger`, with disabled and finished plans last. The hand-made countdown and the 60-s reload go. The list refreshes when one of its plan switches changes in `hass.states`.
- **S2 — the tile.** W2 shows the earliest next run over the enabled plans, with the calendar tile's day words (today, tomorrow, weekday). The value is mirrored into the overview's system entity and read through `useSystemEntityAttributes`, like the notification count. With #126 shipped, `schedule.*` helpers count too, with their next start from #126's merged blocks; `next_event` alone can be the end of a block (#126 honesty rule). Without any plan, the tile keeps "Overview".
- **Thermal rule:** no scan of all states per tick. The mirror keeps the list of plan ids, rebuilt only when the number of states changes, reads those by id and writes only when its signature changes. In rest the tile sits under the curtain.
- **Traps:** `next_trigger` is null for finished plans and can still be set for disabled ones, so the switch state decides first. Sun-based slots have a valid `next_trigger` although their slot text is not a clock time.

**Hook (verified):** `utils/scheduleUtils.js:279`, `:306–313`; `ScheduleTab/components/ScheduleListItem.jsx:36`, `:43`; `ScheduleTab/components/ScheduleList.jsx:46–49`; `ScheduleTab/hooks/useScheduleData.js:40`, `:83–96`; `AllSchedulesView.jsx:395–397`; `components/DeviceCard.jsx:161`, `:493–528`, `:541–543`, `:578`; `hooks/useNotificationLane.js:283–300` (mirror with signature); `components/bento/constants.js:92` (W2 default); `utils/minutenTakt.js:75–103`.

**Effort:** Small — 3–5 h in two slices. Bundle about +0.5 KB gzip, partly paid back by the removed countdown and interval.

**Why it fits:** The integration already knows when each plan runs; the card guesses instead, and polls to keep the guess fresh. W2 is a default tile on every fresh install, and today it says nothing.

**Files (estimate):** `utils/scheduleUtils.js`, `ScheduleTab/hooks/useScheduleData.js`, `ScheduleTab/components/ScheduleListItem.jsx`, `AllSchedulesView.jsx`, `components/DeviceCard.jsx`, `system-entities/entities/all-schedules/index.js` (mirror), `de.js`/`en.js`.

---

**Addenda from the same pass**

- **#59 — #121 corrects its delta.** Today the running period is compared, in its elapsed part, with the whole previous one; the v1.1.2373 probe already noted "partial day". #121 also fixes the ghost being cut to the current label count (`components/charts/SensorChartView.jsx:300–303`), and #121 S4 adds the comparison base (same weekday last week, same period last year).
- **#21 — chart numbers.** Charts format with `toFixed(2)` and a dot (`components/charts/SensorChartView.jsx:144`, `:383–385`; `energyChartConfigs.js:297`, `:323–325`; axis ticks read "1500.00 W"). Following `hass.locale.number_format` must be decided card-wide, because tiles show raw state strings. Dropping the forced decimals on axis ticks touches the v1.1.1757 user decision ("always two decimals").
- **#96 — hook correction.** It names `services/sensorStatistics.js` as an existing `history_during_period` caller, but that file uses the REST `history/period` call (`sensorStatistics.js:69–77`). The only WebSocket `history/history_during_period` call is the broken fallback at `energyDashboardCalculations.js:261–268`, which #120 S4 removes. #96 should reuse the REST call inside `fetchHistoryData` (`:69–72`), which is module-private and parses numbers only (`:95–97`), so on/off rows need the state parsing #122 S1 adds; or it brings its own WebSocket call.
- **D3 — one more cost line.** #120 S4's unit fix for the energy view and its period energy from `change` apply only if D3 keeps the energy view. Removing the broken fallback in `fetchStatistics` stands either way.
- **#22 — requirements input.** Long-term statistics for chosen attributes (thermostat current and target temperature, humidifier humidity, light brightness), imported by the companion as external statistics, so attribute charts and #122 S3 reach beyond the recorder's retention (ten days by default). Daily on-time statistics for chosen on/off entities, stored as statistics, so the week, month and year views of #122 reach beyond retention too. A companion service that binds a schedule helper (its state, or one key of its block data such as a setpoint) to a target entity and action, so the native helper can replace the third-party scheduler for the common heating case.

**Addendum to #3 — quiet hours can follow a Home Assistant entity.**

**Pitch:** Quiet hours can follow a schedule helper, an `input_boolean` or a `binary_sensor` instead of one fixed window. Weekend nights can differ, every tablet in the house uses the same nights, and they are edited in Home Assistant.

**Status quo:** One fixed daily window per device, stored in the browser (`utils/quietHours.js:16–21`, check at `:48–57`, next boundary at `:64–81`). Every consumer goes through these functions and asks about the current instant: `components/Island.jsx:407`, `hooks/useIslandDaten.js:96`, `hooks/useTiefeRuhe.js:54` and `:97`, `hooks/useZenRueckkehr.js:41`, `hooks/useNotificationLane.js:124`, `utils/toastSettings.js:110`.

**What ships:**
- A source setting: time window (today's behaviour) or entity. With an entity, quiet means state `on`. The next boundary is `next_event` for a schedule helper and unknown for the other two.
- The picker offers `schedule`, `input_boolean` and `binary_sensor` only. #61's night coupling follows on its own, because it reads the same check.
- **Honesty rule:** if the entity is missing or unavailable, the fixed window applies, and the settings row says so.
- `useTiefeRuhe` arms its timer from the next boundary (`:97`). With an `input_boolean` or `binary_sensor` there is none, so a flip of the entity triggers the same re-check as a settings change.
- Settings row, register entry, info text and catalog entry. #3b E6 (manual mute with a duration) stays separate; an `input_boolean` source only makes a house-wide mute possible.

**Hook (verified):** `utils/quietHours.js:16–21`, `:48–57`, `:64–81`; `hooks/useTiefeRuhe.js:97`; the consumers above.

**Effort:** Small — 3–4 h. Bundle about +0.6–0.8 KB gzip.

**Why it fits:** #61 promised the night axis without a new time-range editor. This keeps the promise: Home Assistant owns the schedule.

---

## Part seventeen — 2026-11-02 Music Assistant, done properly (#128–#140)

Thirteen entries from reading a pair of touch-first Music Assistant cards for wall tablets, Home Assistant's Music Assistant and media-player APIs, and the card's own music code. Every hook below was re-read at v1.1.2509; v1.1.2510 changed nothing in music. Ideas only, nothing taken from their code or text. #128–#133 are repairs: each names a failure the code shows today. #134–#140 are everyday gains, ordered by how often a household meets them. Everything runs over Home Assistant's standard services; where a field is new in a recent Home Assistant release, the card reads it from `hass.services` before using it. Not taken: the full queue list and queue editing, synchronised lyrics, similar-track rows, unfavouriting, play counts in lists and Music Assistant's curated folders, because no Home Assistant action carries them (requirements input for #22, whose recommendations text is corrected below); a direct connection to the Music Assistant server, which would put a second credential in the browser; lyrics from an outside service, because the card sends no data out; the tablet as a synchronised speaker; a Music Assistant account per person on the shared tablet (Home Assistant cannot list those accounts, and a shared tablet has one screen for everyone, which is why #15 is retired); a moving progress bar or an animated equaliser on the start page or in rest (heat rule); music as a reason to hold the screensaver (#103); a pause button in the island's live row (D6). Music in deep rest waits on D10 and is an addendum to #111. Bundle: 650 364 bytes gzip at v1.1.2510, 10.4 KB over the warning. The repairs cost about +1 KB together, because dead code goes out. #128–#137 cost about +4.5–5.5 KB. #130 S3, #138, #139 and #140 cost about +9–11 KB more and need measuring per release; #140 needs a decision first (D16), and with Liquid Glass gone since v1.1.2503, D3 is the only counter-financing left.

---

### 128. Music Assistant is recognised, and its dead paths go

> ✅ **S2–S5 shipped v1.1.2519** (2026-11-03) — S2: the artist in the ring is tappable only where an `ma_search` group exists (plain text elsewhere, also in the sheet); the gauge centre sits above the drag surface (`zIndex`), so the tap arrives. S3: `queue_command` wrappers, their gate, the queue cards' skip/remove buttons and the clear fallback are gone; `transfer_queue` only with `source_player`; `get_library` only with one `media_type`. S4: the heart is the `button.*` with platform `music_assistant`, translation key `favorite_now_playing` and the player's device (name fallback gone); a filled heart says "Already a favourite" and does not press. S5: search, library and queue items carry `version` (after the name), `explicit` (a small "E") and `favorite` (a dot); `owner`, `provider`, `publisher`, `author` and `duration` of search/library items are gone (queue items keep their duration).
>
> ✅ **S1 shipped v1.1.2514** (2026-11-03) — `isMusicAssistantPlayer` reads `mass_player_type` first, then the `music_assistant` platform from `hass.entities` (not for device class `tv`), `app_id` only as the last fallback; `mass_player_id` is gone. The player list uses the same test and leaves unavailable players out. From S3 the `get_queue` guard came along (no call without `active_queue` on a typed player), because S1 now opens the panel on outside sources; for the same reason the move button needs an active queue, and a Music Assistant speaker with inputs keeps its source button next to the Music Assistant button. S2–S5 open.

**Pitch:** A Music Assistant speaker that is switched off, or plays the TV input or AirPlay, still has its Music Assistant button and still appears in every group and move list. Calls that can only fail are removed. Two versions of a song no longer look the same.

**Status quo:**
- Detection needs `app_id === 'music_assistant'` or `mass_player_id` (`utils/musicAssistant.js:21–28`). The player list repeats the test (`:571–581`), and the control row asks it with attributes only (`utils/deviceConfigs/domains/mediaPlayer.js:29`, `:57–71`). Home Assistant never sets `mass_player_id`. It drops `app_id` with all media attributes while a player is `off`, and Music Assistant reports the outside source as `app_id` while one plays. Its own attribute `mass_player_type` is always there. Failure: the kitchen speaker is off, so its detail view has no Music Assistant button, and the group and move lists of every other speaker leave it out.
- The artist tap always opens `ma_search` (`components/tabs/UniversalControlsTab.jsx:264–269`, set at `:688`). Players without Music Assistant have no such group (`mediaPlayer.js:99–104`; `components/controls/PresetButtonsGroup.jsx:41`), so the ring hides (`UniversalControlsTab.jsx:540–543`) and nothing takes its place. From the code the tap may not fire at all today: the ring's drag surface (`components/controls/SegmentedRingGauge.jsx:272–311`) is a later absolute sibling with `inset: 0` above the artist line (`:263–267`), and the volume ring is always draggable while a player is active (`utils/deviceConfigs/rings.js:92–96`). Check once in a browser.
- `music_assistant.queue_command` does not exist; Home Assistant has six Music Assistant actions. Skip-to and remove never run (`components/controls/MusicAssistantPanel.jsx:250–283`, gate `:300–302`; `utils/musicAssistant.js:215–242`, `:544–551`), and the clear fallback never helps (`:884–887`). The second transfer variant sends `target_player`, which the schema does not know (`:749–756`). Three of the four library variants fail on every version, because `media_type` takes one value (`:510–516`); a failed open costs up to 24 calls.
- The favourite button is found by `favori` in the entity ids of the device (`:778–803`). A renamed entity id or a language whose generated id lacks that stem means no heart; without a device id, any favourite button containing the first token of the player's entity id matches (`:793–801`). A filled heart presses again and says "added" again (`components/controls/ma/components.jsx:135–144`).
- The item shapers read `owner`, `provider`, `publisher`, `author` and `duration`, which Home Assistant never sends, and drop `version`, `explicit` and `favorite` (`utils/musicAssistant.js:150–177`, `:274–303`). Playlist, radio and podcast subtitles are always empty; "Song" and "Song (Live)" look identical.

**What ships:**
- **S1 — detection.** `mass_player_type` (`player`, `stereo_pair`, `group`) first. Where `hass` is at hand, `hass.entities[id].platform === 'music_assistant'` as a second test, without device class `tv`: Music Assistant's dashboard displays (Home Assistant 2026.11) carry no `mass_player_type` and its actions refuse them. `mass_player_id` goes. Unavailable players stay out.
- **S2 — the artist tap.** The centre line sits above the drag surface. The handler is set only where an `ma_search` group exists; elsewhere the artist is plain text. The mobile sheet uses the same gate.
- **S3 — dead paths out.** The `queue_command` wrappers and their gate, transfer variant 2, library variants 2 to 4. `get_queue` only while `attributes.active_queue` is set: once S1 shows the panel for a speaker on an outside source, `get_queue` raises "No active queue found" there.
- **S4 — favourite.** The button is the `button.*` entity with `platform` `music_assistant`, `translation_key` `favorite_now_playing` and the player's `device_id`; the display registry carries all three. The name fallback goes. A filled heart says "Already a favourite" and does not press. Removing a favourite needs the server (#22).
- **S5 — read what Home Assistant sends.** `version` after the name, `explicit` as a small "E", a favourite dot. The dead fields go.

**Hook (verified):** `utils/musicAssistant.js:21–28`, `:150–177`, `:215–242`, `:274–303`, `:510–516`, `:544–551`, `:571–581`, `:749–756`, `:778–803`, `:884–887`; `utils/deviceConfigs/domains/mediaPlayer.js:29`, `:57–71`, `:99–104`; `components/tabs/UniversalControlsTab.jsx:264–269`, `:540–543`, `:688`; `components/controls/SegmentedRingGauge.jsx:263–267`, `:272–311`; `utils/deviceConfigs/rings.js:92–96`; `components/controls/MusicAssistantPanel.jsx:250–283`, `:300–302`; `components/controls/ma/components.jsx:135–144`.

**Effort:** Medium — 5–6 h in five slices; bundle about −0.5 KB.

**Why it fits:** The music button vanishes exactly when the speaker is silent and someone wants to start music, and a third of the service code can only fail.

**Files (estimate):** `utils/musicAssistant.js`, `utils/deviceConfigs/domains/mediaPlayer.js`, `components/tabs/UniversalControlsTab.jsx`, `components/controls/SegmentedRingGauge.jsx`, `components/controls/MusicAssistantPanel.jsx`, `components/controls/ma/components.jsx`, `components/controls/ma/QueueList.jsx`, `de.js`/`en.js`.

---

### 129. When something fails, the panel says what

> ✅ **Shipped v1.1.2521** (2026-11-03) — S1: a run number per search (only the newest answer writes results, spinner and history), two characters minimum (an artist tap is exempt; one-letter history entries are dropped), the wrapper returns `{ error }` and the tab says "Search failed". S2: no session marker any more (removed once), failed (`null`) vs. empty (`[]`), a failed row keeps its old state and a lasting "Not everything loaded" line shows while it has nothing, `invalid_format` (a type this HA version lacks) stays silent, failed refresh / load-more name their step and keep the list, a drill-down that fails says so, a failed `get_queue` keeps the old queue or says "Queue not loaded". S3: `getMusicAssistantEntry` returns `verbunden` / `getrennt` / `fehlt`; "not connected" with one retry replaces the tabs; re-read on open, on retry, when the player leaves `unavailable`, after a completely failed search or first library load, and — only while disconnected — on `config_entries/subscribe` reporting `loaded`; never on a timer. S4: one feedback timer, step-named failures (speaker, voice, clearing, grouping, ungrouping), developer texts gone. Bundle +1.1 KB (estimate was +0.15 KB; the queue, partial-row and event parts were added in review).

**Pitch:** Typing "beatles" never shows hits for "beat". While Music Assistant restarts, the panel says so and offers one retry, instead of "No matches" or "Library not available in this MA version". A second message no longer vanishes after 0.8 s.

**Status quo:**
- The debounced search awaits the call and writes the result unconditionally (`components/controls/ma/useMaSearch.js:47–55`); cleanup only clears the timer (`:67`). An answer for "beat" that arrives after the one for "beatles" wins, turns the spinner off early (`:55`) and lands in the history (`:57–65`). There is no minimum length (`:40–45`). The wrapper returns `null` on an error (`utils/musicAssistant.js:89–93`), which the tab shows as "Keine Treffer" (`components/controls/ma/SearchTab.jsx:136–140`).
- If all six library sections come back empty, the library is marked off in `sessionStorage` (`components/controls/ma/useMaBrowse.js:106–113`; `utils/musicAssistant.js:415–427`), and later opens return at once (`useMaBrowse.js:61–67`; `utils/musicAssistant.js:485`). Empty also means "every call failed" (`:518–541`). On a wall tablet a browser session lasts weeks; only "↻ Aktualisieren" brings it back (`components/controls/ma/BrowseTab.jsx:104–110`). The text blames the MA version and points to the console (`utils/translations/languages/de.js:868`, `:873`). A new, empty library gets the same text.
- The config entry lookup takes a loaded entry or the first one and ignores its state (`utils/musicAssistant.js:40–57`). With Music Assistant in `setup_retry`, every call fails into the two cases above.
- `showFeedback` starts a new 1.8-s timeout without clearing the old one (`components/controls/MusicAssistantPanel.jsx:221–224`). Every announcement failure reads "Nicht unterstützt" (`:497`; `de.js:909`). The queue header shows the developer note "nur aktueller + nächster" (`de.js:933`).

**What ships:**
- **S1 — search.** A sequence number per call; only the newest answer writes results, spinner and history. Two characters minimum. The wrapper returns `{ error }`, and the line says "Search failed — Music Assistant did not answer".
- **S2 — library.** One service form (one `media_type`). "Call failed" and "library empty" are separate states, and nothing switches itself off. The old marker is removed once. An empty library says "Your library is empty — search finds music from your services".
- **S3 — Music Assistant's state.** `config_entries/get` already returns `state` and needs no admin. Anything but `loaded` shows one line, "Music Assistant is not connected", with one retry. Read on open and when the player becomes available again, never on a timer.
- **S4 — messages.** One feedback timer; the last message wins. Every failure names its step ("Speaker did not respond", "No voice reachable"). The developer texts go.
- **Honesty rule:** a failed call never looks like an empty result.

**Hook (verified):** `components/controls/ma/useMaSearch.js:40–45`, `:47–55`, `:57–67`; `utils/musicAssistant.js:40–57`, `:89–93`, `:415–427`, `:485`, `:518–541`; `components/controls/ma/SearchTab.jsx:131–140`; `components/controls/ma/useMaBrowse.js:61–67`, `:106–113`; `components/controls/ma/BrowseTab.jsx:76–81`, `:104–110`; `components/controls/MusicAssistantPanel.jsx:221–224`, `:497`; `utils/translations/languages/de.js:868`, `:873`, `:909`, `:933`.

**Effort:** Medium — 4–5 h; bundle about +0.15 KB.

**Why it fits:** Today a restarting Music Assistant looks like a broken card, and the library stays off long after the restart is over.

**Files (estimate):** `components/controls/ma/useMaSearch.js`, `components/controls/ma/useMaBrowse.js`, `components/controls/ma/SearchTab.jsx`, `components/controls/ma/BrowseTab.jsx`, `components/controls/MusicAssistantPanel.jsx`, `utils/musicAssistant.js`, `de.js`/`en.js`.

---

### 130. Announcements speak with today's text-to-speech, then a sheet for the house (addendum to #3b E3)

**Pitch:** "Dinner is ready" is spoken on the kitchen speaker with Piper, Home Assistant Cloud or any other voice, with Music Assistant's chime, and the music comes back afterwards. Later, one sheet sends it to several rooms at once.

**Status quo:**
- Plain text goes only through the legacy `tts.<engine>_say` services (`utils/musicAssistant.js:674–700`, call `:710`). The comment that `play_announcement` takes no text (`:610–615`) is out of date: since Home Assistant 2026.10 it takes `message` with `tts_entity_id`. Piper and most engines set up in the UI offer only a `tts.*` entity, so text fails there.
- The settings page lists `_say` services only and otherwise says "Keine TTS-Integration aktiv" (`components/tabs/SettingsTab/components/general/TtsSettingsView.jsx:17–19`, `:41–53`). Its own hint asks the user to add Piper (`utils/translations/languages/de.js:1527`, `:1539`); after doing so, the page still says there is none.
- A failure reads "Nicht unterstützt" (`components/controls/MusicAssistantPanel.jsx:497`). The chime box is greyed but clickable for text (`components/controls/ma/AnnouncePanel.jsx:112–124`). Announcing is a toggle tab inside one speaker's panel, with one target (`MusicAssistantPanel.jsx:396–404`, `:488–501`).

**What ships:**
- **S1 — the ladder (repair; #3b E3 slice 0, widened).** (1) A Music Assistant speaker, and `hass.services.music_assistant.play_announcement.fields.message` exists: `play_announcement` with `message`, `tts_entity_id`, `use_pre_announce` and, optionally, `announce_volume`. (2) Otherwise `tts.speak` on a `tts.*` entity with `media_player_entity_id`, `message` and `language`. Home Assistant sends it as an announcement, so a speaker that supports announcements resumes its music. (3) The legacy `_say` services last. `message` and `tts_entity_id` always travel together; a URL and a text never do. An unavailable voice is skipped.
- **S2 — the settings page.** `tts.*` entities first, legacy services after. A stored `cloud_say` maps once to the Cloud voice entity when it exists. The chime switch shows only where it acts. Info popup `settingsInfo.tts` (de+en) and the catalog in the same release.
- **S3 — the sheet (after a bundle check).** Its own sheet, from the side bar and from the music panel. Room chips from the areas, "Everyone" included; each room gets its best target: `assist_satellite.announce` (`message`, `preannounce`) for a voice satellite, route 1 for a Music Assistant speaker, route 2 for any other speaker. A text field with the existing dictation button, own quick phrases per browser, a status word per target (sent, failed, offline), a warning in quiet hours (`utils/quietHours.js`).
- **Honesty rule:** a speaker without announcement support stops its music and does not resume. Its chip says so.
- **Rate rule:** at most one send per 3 s. From the sheet, nothing is sent from a notification text or an AI answer without a tap; #3b E3's opt-in spoken alerts keep their own rules (per-severity opt-in, quiet hours, mute E6, never twice for one instance).
- #3b E3 (spoken alerts) reuses this ladder instead of a second one.

**Hook (verified):** `utils/musicAssistant.js:610–615`, `:635–660`, `:674–700`, `:706–712`; `components/tabs/SettingsTab/components/general/TtsSettingsView.jsx:17–19`, `:41–53`; `components/controls/MusicAssistantPanel.jsx:396–404`, `:488–501`; `components/controls/ma/AnnouncePanel.jsx:45–49`, `:72–96`, `:112–124`; `utils/translations/languages/de.js:909`, `:1527`, `:1539`.

**Effort:** S1–S2 Small — 3–4 h, bundle about +0.4 KB. S3 Medium — 6–8 h, bundle about +1.5–2 KB.

**Why it fits:** Text announcements fail on the setup Home Assistant now recommends, and calling the family to dinner is what a wall tablet is bought for.

**Files (estimate):** `utils/musicAssistant.js` (or a new `utils/durchsage.js`), `TtsSettingsView.jsx`, `components/controls/ma/AnnouncePanel.jsx`, `MusicAssistantPanel.jsx`, settings register, `de.js`/`en.js`, info-popup catalog; S3: a sheet component and a side-bar entry.

---

### 131. A touch never changes the music by accident, and every button fits a finger

> ✅ **Shipped v1.1.2522** (2026-11-04) — S1: media rings carry `ohneSprung`; a drag starts on the bead (±12°, 8 px) or after 10 px elsewhere and always moves on from the current value (unwrapped angle steps, clamped without collecting overshoot); a plain tap or there-and-back sends nothing; a second pointer cancels; the sent value is shown and used as the base until Home Assistant echoes exactly it or 2.5 s pass; a layout change mid-drag drops the drag; other rings untouched. Thresholds are estimates, not tuned on a tablet. S2: `@media (pointer: coarse)` — 44-px buttons, 40-px tabs, filters, small ✕ marks (transparent border) and tab arrows; tighter now-playing header under 480 px; the speaker list scrolls. S3: one ⋯ per row and on the album/artist header (`ma/ZeilenMenue.jsx`, MorphPopup): Play now, Play next, Add to queue, Start radio from this (track/album/artist); the Radio tab and the header's own add/radio path are gone; arrow keys, acts once and only when fully open. "Ansage" stays in the tab bar until #130 S3. S4: autofocus only with `(pointer: fine)`. Bundle +1.8 KB (estimate was +0.35 KB; menu, its styles and the review fixes).

**Pitch:** A child brushing the ring no longer sets the speaker to 90 %, and a tap on the lower arc no longer jumps the song. In the music panel every button is big enough for a finger and says what it does. The keyboard opens only when asked for.

**Status quo:**
- A pointer-down anywhere on a draggable segment sets the value to that angle (`components/controls/SegmentedRingGauge.jsx:275–291`); the pointer-up sends it even without a move (`:304–309`), as `volume_set` or `media_seek` (`utils/sliderHandlers.js:51–65`). The volume ring is draggable also while idle (`utils/deviceConfigs/rings.js:46–54`).
- Now-playing buttons are 32 px (`components/controls/MusicAssistantPanel.css:82–85`), tabs about 30 px (`:375–384`), row actions 32 px (`:653–655`), queue remove 28 px (`:694–697`), the history ✕ 18 px (`:820–825`); the file has no `pointer: coarse` rule. "Play next" is drawn as a skip glyph (`components/controls/ma/icons.jsx:56–61`) and explained only by `title` (`components/controls/ma/components.jsx:448–471`).
- Search and announce take the focus on open (`MusicAssistantPanel.jsx:118–125`; `components/controls/ma/AnnouncePanel.jsx:45–49`), so the on-screen keyboard covers half the panel. "Radio" and "Ansage" look like tabs but switch a mode and an overlay, and radio mode resets on every open (`MusicAssistantPanel.jsx:81–83`, `:385–404`).

**What ships:**
- **S1 — no jump.** For the media gauge only: a drag starts near the bead (about ±12°) or moves from the current value after a small dead zone; a plain tap on the arc does nothing. Other domains and the keyboard path stay as they are. Thresholds are tuned on a real tablet. Sits next to #99's clamp.
- **S2 — targets.** Under `@media (pointer: coarse)`, 44-px buttons and 40-px tabs. Literal class names only (PurgeCSS guard).
- **S3 — one labelled menu.** One ⋯ per row in the existing MorphPopup: "Play now", "Play next", "Add to queue", "Start radio from this" (`radio_mode` with replace). "Radio" leaves the tab bar. "Ansage" leaves it once #130 S3 exists.
- **S4 — keyboard.** Autofocus only with a fine pointer.

**Hook (verified):** `components/controls/SegmentedRingGauge.jsx:275–291`, `:304–309`; `utils/sliderHandlers.js:51–65`; `utils/deviceConfigs/rings.js:46–54`; `components/controls/MusicAssistantPanel.css:82–85`, `:375–384`, `:653–655`, `:694–697`, `:820–825`; `components/controls/ma/icons.jsx:56–61`; `components/controls/ma/components.jsx:448–471`; `components/controls/MusicAssistantPanel.jsx:81–83`, `:118–125`, `:385–404`; `components/controls/ma/AnnouncePanel.jsx:45–49`.

**Effort:** Medium — 5–7 h; bundle about +0.35 KB.

**Why it fits:** A family wall tablet is touched by children and by people walking past; a tap that changes the volume and a skip glyph that means "next in queue" are daily slips.

**Files (estimate):** `components/controls/SegmentedRingGauge.jsx`, `components/tabs/UniversalControlsTab.jsx` (ring flag), `components/controls/MusicAssistantPanel.css`, `components/controls/ma/components.jsx`, `MusicAssistantPanel.jsx`, `AnnouncePanel.jsx`, `de.js`/`en.js`.

---

### 132. Now playing holds still, and the live row tells the truth

> ✅ **Shipped v1.1.2523** (2026-11-04) — S1: header for playing/paused/buffering/on (`isMediaPlayerActive`), a brief idle keeps it 5 s (one-shot re-render), title and cover held 5 s while buffering per `media_content_id`; idle/off/standby show a small header with power (feature bits 128/256) and one entry that opens group and move (until #138 S2); the detail cover is keyed by `media_content_id`, its buffering hold is per entity. S2: buffering = playing, paused stays "Paused · title" for 3 min (`PAUSE_HALTEN_MS`, only if this page saw it playing), no title → no row; the notification centre rebuilds on `useMinute`; a paused player heads the open island only when nothing else is live. Done rule (shared with #102 S1, built here): `useIslandMomente` watches every row of timer/vacuum/cover/script/automation; timer by HA `last_changed` ≥ finishes_at − 2 s, vacuum docked, cover reached its direction's end, script off, automation on with no run; ends older than 2 min are skipped. Speaker lists: flex 0 1 auto, 80–220 px; tab content keeps 96 px. Bundle +1.1 KB (estimate was +0.4 KB).

**Pitch:** On a track change the panel's header stays where it is. An idle speaker shows a small header from which it can be switched on and grouped before the music starts. Pausing a song no longer flashes the island's green "done" moment.

**Status quo:**
- The now-playing header renders only for `playing` and `paused` (`components/controls/ma/components.jsx:67`, `:106`), while the card counts `buffering` and `on` as active (`utils/deviceHelpers.js:189–191`). A player that passes through `buffering` drops the header, and the tabs below jump. Idle also closes group and move (`ma/components.jsx:89–95`). The detail cover is keyed by its URL (`components/DetailView/DetailLeftPane.jsx:104–131`).
- The media live source keeps only `playing` (`utils/liveActivitySources.js:163–179`). A pause or a moment of buffering removes the activity, and the island shows its 2-s "done" moment for the vanished front row (`hooks/useIslandMomente.js:57–65`). Playback without a title is "Wiedergabe" (`liveActivitySources.js:175`), so a soundbar on the TV input fills the island all evening with that word.

**What ships:**
- **S1 — the header.** Shown for `playing`, `paused`, `buffering` and `on`. Idle shows a small header with power (gated on its feature bit, the same button as #137) and one entry to group and move; #138 S2 owns that while idle, and once it exists the entry opens its speaker sheet. Title and cover are held while buffering, keyed by `media_content_id`, for a few seconds at most.
- **S2 — the live row.** Buffering counts as playing. A paused player stays as "Paused" until its `last_changed` is three minutes old, checked when the list is built and on the shared minute tick (`utils/minutenTakt.js`); no timer of its own. Playback without a title is not a live activity.
- **Honesty rule:** a media row that disappears never triggers "done". Done is for things that finish. This is the same change to `hooks/useIslandMomente.js:57–65` as #102 S1 (timers): one rule for every domain, built by whichever ships first.
- No button in the row; D6 stays open.

**Hook (verified):** `components/controls/ma/components.jsx:67`, `:89–95`, `:106`; `utils/deviceHelpers.js:189–191`; `components/DetailView/DetailLeftPane.jsx:104–131`; `utils/liveActivitySources.js:163–179`; `hooks/useIslandMomente.js:57–65`.

**Effort:** Medium — 4 h; bundle about +0.4 KB.

**Why it fits:** A "done" flash on every pause and a jumping header are small lies the eye catches every evening.

**Files (estimate):** `components/controls/ma/components.jsx`, `utils/liveActivitySources.js`, `hooks/useIslandMomente.js`, `de.js`/`en.js`.

---

### 133. The open panel stops costing

> ✅ **Shipped v1.1.2524** (2026-11-04) — S1: no `subscribeEvents('state_changed')`; signature of `hass.states[entityId]` (state, content id, title, shuffle, repeat, active queue) plus the implied track start (`media_position_updated_at` − position, jump > 2 s; HA < 2026.9 re-stamps the anchor on every write) feeds the 800-ms reload; own play actions, library play and opening Queue/Up next reload too. S2: `memo(panelGleich)` on player signature from `item` and `hass.states`, services/entities/connection, lang, initial query and `maSpielerSignatur` (WeakMap per `hass.states`); short-idle and buffering holds measure from the end of activity / the missing value with one one-shot timer; tick pauses while `expandedControl && (isSliderHidden || sheetMode)`; favourite candidate memoised on the registry, state checked per render. S3: 50 rows + "Show all N", remembered on the level object (`zeigeAlle`); plain buttons, press feedback from `perceivedSpeed.css`. S4: `eager` vs `vorrang` (high only for the first library row and the level header), no `new Image()` prefetch, http→https only for public hosts on the default port, failed cover remembered per URL (no key, no display:none), blur layer removed after a pixel check in Chrome and WebKit. Measured (mock HA, 139-track playlist, desktop): 9 686 → 156 renders per 6 s at rest, 41 660 → 1 076 for 20 house changes, 5 → 0 queue reloads for 5 volume steps. Three review rounds (6 + 2 + 3 fixes). Bundle +1.1 KB (estimate was +0.2 KB).

**Pitch:** While the music panel is open, the card no longer receives every state change of the house a second time, and a long playlist no longer redraws every second. Covers load with the right priority, and public covers show on https.

**Status quo:**
- The panel subscribes to all `state_changed` events and filters by entity in JavaScript (`utils/musicAssistant.js:378–393`; `components/controls/MusicAssistantPanel.jsx:190–219`). That stream comes on top of the card's own entity subscription, for every entity of the house. The same information is in `hass.states[entityId]`.
- The controls tab commits on a 250-ms throttled `hass` (`components/tabs/UniversalControlsTab.jsx:133`) and ticks every second while playing (`:222`; `hooks/useMediaPositionTick.js:28–42`), also while the ring is hidden behind the panel (`UniversalControlsTab.jsx:540–543`). Neither the preset group nor the panel is memoised (`components/controls/PresetButtonsGroup.jsx:23–40`; `MusicAssistantPanel.jsx:39`). A 139-track drill-down with three framer buttons per row (`components/controls/ma/components.jsx:409–419`, `:448–471`) redraws every second. The player list and the favourite button scan all states on each commit (`:70–80`).
- A blurred cover lies under a sharp cover of the same size (`components/DetailView.css:359–374`, `:380–398`).
- Up to 36 covers are fetched twice and rendered `eager` with `fetchpriority="high"` (`components/controls/ma/useMaBrowse.js:83–102`; `components/controls/ma/icons.jsx:17–37`; `ma/components.jsx:333–336`). Every absolute `http` cover is dropped on an https page, public hosts included (`utils/mediaUrl.js:15–32`).

**What ships:**
- **S1 — no second stream.** A signature watch on `hass.states[entityId]` (`state`, `media_content_id`, `media_title`, `shuffle`, `repeat`, `active_queue`) feeds the existing 800-ms queue refresh. The subscription goes.
- **S2 — less redraw.** The position tick pauses while the ring is hidden or covered. A memo comparator on the player's signature and `lang`. Player list and favourite lookup memoised on that signature.
- **S3 — long lists.** The first 50 rows and "Show all". Plain buttons with a CSS `:active` scale.
- **S4 — images.** High priority only for the first visible row, no second fetch. `http` on a public host becomes `https`, as browsers do for mixed images anyway; LAN addresses stay dropped. The blur layer goes after a visual check in Chrome and WebKit.
- **Thermal rule:** render counts are measured with `options.__r` on a visible page, before and after. The queue refresh still fires on a track change.

**Hook (verified):** `utils/musicAssistant.js:378–393`; `components/controls/MusicAssistantPanel.jsx:39`, `:190–219`; `components/tabs/UniversalControlsTab.jsx:133`, `:222`, `:540–543`; `hooks/useMediaPositionTick.js:28–42`; `components/controls/PresetButtonsGroup.jsx:23–40`; `components/controls/ma/components.jsx:70–80`, `:333–336`, `:409–419`, `:448–471`; `components/DetailView.css:359–374`, `:380–398`; `components/controls/ma/useMaBrowse.js:83–102`; `components/controls/ma/icons.jsx:17–37`; `utils/mediaUrl.js:15–32`.

**Effort:** Medium — 5–7 h; bundle about +0.2 KB.

**Why it fits:** A tablet that plays music for hours should not pay for the music panel twice; this is the heat rule applied to the one view that stays open longest.

**Files (estimate):** `components/controls/MusicAssistantPanel.jsx`, `utils/musicAssistant.js`, `hooks/useMediaPositionTick.js`, `components/tabs/UniversalControlsTab.jsx`, `components/controls/PresetButtonsGroup.jsx`, `components/controls/ma/components.jsx`, `components/controls/ma/useMaBrowse.js`, `components/controls/ma/icons.jsx`, `utils/mediaUrl.js`, `components/DetailView.css`.

---

### 134. Home rows from your own library — the panel opens on music (correction to #22)

> ✅ **Shipped v1.1.2525** (2026-11-05) — S1: `StartTab` + `useMaStart` (rows in `utils/maStartReihen.js`, one `get_library` per row, limit 12, sequential in view order, module cache 10 min per row and config entry, pending-request map, random rows kept while the panel is open, "↻" forces). Settings › General › Music › Home rows (`systemSettings.music.startRows`, `musicSettingsChanged`), register + defaults. Panel opens on Home when `get_library` exists and a row is on; the ring's artist query is cleared when the panel closes. S2: per-section view (`ma_library_view_v1`), applied view kept per section, pages of 12 fetched as 13 (`12+` only with a 13th), offset paging, row reset after a sort/filter change. Capabilities from the service description (`bibliothekFelder`: order_by options, favorite, offset in `pagination`, album_type, media_type options). Spec corrections from the reviews: HA's `get_library` has no `played_only`, so last-played/play-count rows are padded with never-played items — titles say "last played first", not "Recently played"; `random_play_count` is a plain shuffle or never-played-only depending on the MA version — the optional row is "Random albums" with `random`; a row whose sort is its point is hidden when the server lacks the sort (no A–Z under its title). Three review rounds (24 + 5 + 1 fixes). Bundle +6.2 KB (estimate was +1.7–2.2 KB).

**Pitch:** Open the panel and see Recently played, Your playlists, Liked songs, Stations and Recently added. One tap plays or opens. Each library section sorts, filters and loads twelve more on its own.

**Status quo:**
- The library is six rows sorted by name (`utils/musicAssistant.js:487`, `:492`; `components/controls/ma/useMaBrowse.js:71–78`), with radio last and no tracks (`components/controls/ma/BrowseTab.jsx:17–24`). The panel opens on the search tab (`components/controls/MusicAssistantPanel.jsx:46`).
- "Load more" raises one shared limit and reloads all six sections from the start, up to 96 each (`useMaBrowse.js:35–37`, `:124–139`).
- Home Assistant's `get_library` has taken `order_by` since 2025.1 (`last_played_desc`, `timestamp_added_desc`, `play_count_desc`, `random`, `random_play_count` and more), plus `favorite`, `offset`, `album_type` and `album_artists_only`.

**What ships:**
- **S1 — a "Start" tab first.** One `get_library` per row, one media type, limit 12. Albums and playlists by `last_played_desc` ("Recently played"); playlists by name ("Your playlists"); tracks with `favorite: true` ("Liked songs"); radio with `favorite: true`, else by `last_played_desc` ("Stations"); albums by `timestamp_added_desc` ("Recently added"). Optional: albums by `play_count_desc` ("Most played"), albums by `random_play_count` ("Rediscover"; Music Assistant puts the least played first, shuffled). Rows load in view order and hide when empty. A module cache of ten minutes per row; "↻" refreshes. Choice and order of rows as a switch list in the music settings.
- **S2 — library sections.** Each section has its own sort (A–Z, recently added, recently played, most played, year), a favourites chip and album kinds (album, single, EP, compilation). "Load more" adds 12 to that section only, by `offset`. The sort is remembered per section and browser.
- **Honesty rule:** the rows come from the library and say so. Music Assistant keeps one play log for the house, so "Recently played" is the household's.
- **Traps:** the answer carries no play dates or counts, so each row holds one media type; a mixed timeline is #22. Random orders change per call, so the cache holds them for the panel session. An unknown `order_by` fails on the server; the row falls back to name. The sort keys are read from the service description (`hass.services.music_assistant.get_library.fields.order_by`).

**Hook (verified):** `utils/musicAssistant.js:483–492`; `components/controls/ma/useMaBrowse.js:35–37`, `:71–78`, `:124–139`; `components/controls/ma/BrowseTab.jsx:17–24`; `components/controls/MusicAssistantPanel.jsx:46`.

**Effort:** Medium — 8–11 h in two slices; bundle about +1.7–2.2 KB.

**Why it fits:** Walk up, tap, music. #22 files these rows under "needs the server"; most of them do not.

**Files (estimate):** `utils/musicAssistant.js`, `components/controls/ma/useMaBrowse.js`, `components/controls/ma/BrowseTab.jsx`, a new `components/controls/ma/StartTab.jsx`, `MusicAssistantPanel.jsx`, music settings, register, `de.js`/`en.js`, info-popup catalog.

---

### 135. Search that opens what it found, finds your own music first, and plays from the tapped track (addendum to #98)

**Pitch:** "Queen" shows your own Queen albums first, then "More from your services". An album hit opens. Track 5 of an album plays the album from track 5. A filter field finds one song in a long playlist.

**Status quo:**
- Search hits never open (`components/controls/ma/SearchTab.jsx:191–199`); a row opens only when it gets `onOpen` (`components/controls/ma/components.jsx:426–437`). One call goes over all services, eight per type (`utils/musicAssistant.js:74–79`, `:268`; `components/controls/ma/useMaSearch.js:49–52`); `library_only` and the server-side type filter are unused.
- A track inside an album or playlist plays alone with `replace` (`components/controls/ma/BrowseTab.jsx:59` → `components/controls/MusicAssistantPanel.jsx:232–243`), and so does a search hit (`SearchTab.jsx:196`). `media_id` is always one string (`utils/musicAssistant.js:113–121`).

**What ships:**
- **S1 — your music first.** Two searches side by side: `library_only: true`, shown first as "Your music", and the full one below as "More from your services", without duplicates by URI. The type pill passes `media_type`, so the services narrow on their side. Needs #129 S1's sequence number. `library_only` sits in a section of the service description (`search_options`); detect it there.
- **S2 — hits open.** Album, artist and playlist hits open the existing drill-down (`media_player/browse_media`). The artist line in the ring (#128 S2) opens the artist.
- **S3 — play from here.** Inside a container: `play_media` with `media_id` = the container and `start_item` = the track (Home Assistant 2026.11; detected through `hass.services.music_assistant.play_media.fields.start_item`). Podcasts offer "Newest episode" (`start_item: 'latest'`). Without `start_item`, #98's `enqueue: 'play'`.
- **S4 — filter.** Drill-downs longer than 20 rows get a filter field over the rows already loaded. No call.
- **S5 (with #52).** A selection of rows plays as one queue; `media_id` takes a list.

**Hook (verified):** `components/controls/ma/SearchTab.jsx:191–199`, `:196`; `components/controls/ma/components.jsx:426–437`; `utils/musicAssistant.js:74–79`, `:113–121`, `:268`; `components/controls/ma/useMaSearch.js:49–52`; `components/controls/ma/BrowseTab.jsx:59`; `components/controls/MusicAssistantPanel.jsx:232–243`.

**Effort:** Medium — 5–7 h; bundle about +0.9 KB.

**Why it fits:** Search is today's main path into music, and it neither opens what it finds nor knows what the household already owns.

**Files (estimate):** `components/controls/ma/useMaSearch.js`, `components/controls/ma/SearchTab.jsx`, `components/controls/ma/components.jsx`, `components/controls/ma/useMaBrowse.js`, `MusicAssistantPanel.jsx`, `utils/musicAssistant.js`, `de.js`/`en.js`.

---

### 136. A tap you can see worked, and one honest queue tab (addendum to #100)

**Pitch:** The tapped cover shows a spinner until the speaker really plays it, and a second tap replaces the first instead of mixing the queue. The queue tab says "Now · Next · +37 more"; a tap on the next song skips to it, the radio shows the song on air, and "Clear" asks once.

**Status quo:**
- The only feedback is a 1.8-s text line (`components/controls/MusicAssistantPanel.jsx:221–227`). Play calls fire without a guard (`:232–248`; `components/controls/ma/useMaBrowse.js:190–201`).
- Two tabs show current plus next, and next only (`components/controls/ma/QueueList.jsx:20–27`; `MusicAssistantPanel.jsx:369–384`, `:440–474`). Queue rows are never tappable, because their actions hang on `queue_command` (`QueueList.jsx:62–71`). "Clear" empties the queue on one tap (`MusicAssistantPanel.jsx:286–295`). `stream_title` and `stream_details` are dropped (`utils/musicAssistant.js:247–264`). Home Assistant's `get_queue` returns `current_item`, `next_item`, `items` as a count, `current_index`, and per item `stream_title` and `stream_details`.

**What ships:**
- **S1 — confirmation.** The tapped row waits until the player's `media_content_id` or `media_title` changes from its value before the tap. A container starts with its first track, so the check is "changed", not "equal". After 15 s: "Speaker did not start — try again". Play calls are queued per panel with a generation number, so an older answer never overwrites a newer tap. One watcher, shared with #100.
- **S2 — one queue tab.** "Now", "Next", "+N more" (N = `items − current_index − 2`, at least 0; the item right after the current one is Next). A tap on Next sends `media_next_track`. Radio shows `current_item.stream_title`; a quality line from `stream_details` when present ("FLAC 24/96"). "Clear" asks a second tap, because `clear_playlist` cannot be undone. An idle speaker with a `current_item` offers "Resume" (`media_play`). The second tab goes.

**Hook (verified):** `components/controls/MusicAssistantPanel.jsx:221–227`, `:232–248`, `:286–295`, `:369–384`, `:440–474`; `components/controls/ma/useMaBrowse.js:190–201`; `components/controls/ma/QueueList.jsx:20–27`, `:62–71`; `utils/musicAssistant.js:247–264`.

**Effort:** Medium — 5–6 h; bundle about +0.3–0.5 KB.

**Why it fits:** A slow streaming lookup makes the panel look dead, and a queue tab that hides its size behind a developer note is not a queue tab.

**Files (estimate):** `components/controls/MusicAssistantPanel.jsx`, `components/controls/ma/QueueList.jsx`, `components/controls/ma/components.jsx`, `components/controls/ma/useMaBrowse.js`, `utils/musicAssistant.js`, the #100 watcher, `de.js`/`en.js`.

---

### 137. Media basics: power, mute, volume steps, sources on Music Assistant speakers, skip 30 s

**Pitch:** Switch a speaker on or off, mute it, step the volume by 5 %, pick the TV input of a Music Assistant soundbar, skip 30 s in a podcast — all without dragging an arc.

**Status quo:** The control row has previous, play, next, the Music Assistant or settings button, shuffle and repeat (`utils/deviceConfigs/domains/mediaPlayer.js:35–98`). It reads no `supported_features`. The ring shows no power (`:155`, `:185`). Source and sound mode are hidden for Music Assistant speakers by an either-or (`:57–71`), although Music Assistant reports both for speakers that have them.

**What ships:**
- Each button is gated on its feature bit: `turn_on`/`turn_off`; `volume_mute` with `is_volume_muted`; `volume_up`/`volume_down`, or `volume_set` ± 5 %; `media_stop`; `select_source` and `select_sound_mode` through the existing settings picker, now for Music Assistant speakers too; `media_seek` ± 15/30 s only for podcasts, audiobooks and items longer than 20 minutes.
- ± and mute sit at the ring's volume value, not as four more buttons in a row that already scrolls. Power sits on the idle and off ring.
- Every volume write goes through #99's clamp. Switching off a Music Assistant group switches off its members; the line says so.

**Hook (verified):** `utils/deviceConfigs/domains/mediaPlayer.js:35–98`, `:57–71`, `:155`, `:185`.

**Effort:** Medium — 4–6 h; bundle about +0.7–1.0 KB.

**Why it fits:** A speaker that cannot be switched off or muted from its own detail view sends the household back to the phone.

**Files (estimate):** `utils/deviceConfigs/domains/mediaPlayer.js`, `utils/deviceConfigs/rings.js`, `components/tabs/UniversalControlsTab.jsx`, `utils/sliderHandlers.js`, `de.js`/`en.js`.

---

### 138. Where the music plays — this tablet's speaker, one speaker sheet, a sleep timer (addendum to #108)

> ✅ **S1 shipped v1.1.2515** (2026-11-03) — Settings → General → *This tablet* → *Speaker*: one `media_player` per browser (`systemSettings.tablet.speaker`, never synced), Music Assistant speakers listed first; none or unavailable falls back to the single speaker that is playing (`utils/tabletLautsprecher.js`). Since v1.1.2516 (#108 S2) the picker proposes the device's media players and Music Assistant speakers in the tablet room. Users: AI mode's default target (#139 S1) and dictation ducking (#139 S3). S2–S4 open.

**Pitch:** The kitchen tablet knows the kitchen speaker. A pill names where the music plays and opens one sheet: this speaker or group with its volume, the other speakers with a check and a slider each, and "Move here". "Stop in 30 minutes" works even when the tablet goes dark.

**Status quo:**
- The panel is bound to the detail view's player (`components/controls/MusicAssistantPanel.jsx:98`; `components/controls/PresetButtonsGroup.jsx:55–56`). No setting names a default speaker (no match in `src`).
- Group and move are two buttons with two lists and no volume (`components/controls/ma/components.jsx:202–219`, `:257–294`), only while playing or paused (`:89–95`). The service helpers exist (`utils/musicAssistant.js:738–765`, `:828–867`).
- There is no sleep timer. The card already creates single-run schedules for the scheduler integration (`utils/scheduleUtils.js:383`, `:456–461`).

**What ships:**
- **S1 — this tablet's speaker.** A per-browser setting in #108's "This tablet": one `media_player`. Proposed from the tablet's own device or the Music Assistant speaker in its area, with the reason (#97). Never synced. Missing or unavailable falls back to the speaker that is playing.
- **S2 — the sheet.** One MorphPopup with three sections; it works while idle. This speaker or group with its volume. Group members with a check and a slider (`media_player.join` with `group_members`, `unjoin`, `volume_set` per member). Other speakers to move to (`music_assistant.transfer_queue` with `source_player` and `auto_play`; `turn_on` first for a target that is off).
- **S3 — group-aware.** A member that plays its leader's queue (`active_queue`) says "plays via Living room", and transport goes to the leader. Followers fold under their leader.
- **S4 — sleep timer.** Music Assistant's sleep select on the speaker's device (0/30/60/90/120 minutes) through `select.select_option`; it is off by default, so often absent. Otherwise, with the scheduler integration, a single-run `media_player.media_pause` at now + N. Otherwise no button. The remaining minutes run on the shared minute tick.
- **Traps:** check whether `volume_set` on a sync leader already scales its members, so S2 never scales twice. `join` needs grouping support and compatible protocols; Music Assistant's refusal is shown. Music Assistant group players are fixed groups. A row waits until `group_members` changes, 10 s at most. Every volume write goes through #99.

**Hook (verified):** `components/controls/MusicAssistantPanel.jsx:98`; `components/controls/PresetButtonsGroup.jsx:55–56`; `components/controls/ma/components.jsx:89–95`, `:202–219`, `:257–294`; `utils/musicAssistant.js:738–765`, `:828–867`; `utils/scheduleUtils.js:383`, `:456–461`.

**Effort:** Medium — 9–12 h in four slices; bundle about +2–2.6 KB.

**Why it fits:** On a wall the question is not "what does this speaker do" but "where is the music, and can it come here".

**Files (estimate):** `utils/diesesTablet.js` or #108's store, a new `components/controls/ma/SpeakerSheet.jsx`, `components/controls/ma/components.jsx`, `utils/musicAssistant.js`, `utils/scheduleUtils.js`, settings register, `de.js`/`en.js`, info-popup catalog.

---

### 139. AI mode plays music, and music ducks while the tablet listens (addendum to #1)

> ✅ **S1 + S2 shipped v1.1.2514** (2026-11-03) — `music_assistant.play_media` (media_id ≤ 120, artist/album ≤ 80, all refused when they look like a URL or file path — `://`, `\`, `./`/`../` segments, hidden files, a leading `/` or `~`, a known folder in front, several `/`, a file extension; media_type and enqueue from fixed lists; radio_mode) on players #128 S1 recognises, plus `shuffle_set`, `repeat_set`, `select_source` (from `source_list` only), `volume_up`/`volume_down` for all media players; the context marks Music Assistant players, groups and stereo pairs and sends artist, source, sources, shuffle and repeat. Without #136 S1 a 10-second look at the player reports what started. Not built: the #99 clamp (not built yet). **v1.1.2515:** the tablet's default speaker (#138 S1) is named in the prompt as the target for music and volume without a room (fallback: the one playing speaker), and **S3 shipped**: switch *Lower music while dictating* (off by default, needs a tablet speaker); the volume drops to a fifth while the microphone listens and comes back only if it is still the lowered or the original value (±0.07 for coarse volume steps); the backup in localStorage `fscDiktatLeiser` stays until Home Assistant reports the restored volume, so a second dictation right after keeps the real original; a speaker that is off or unavailable keeps the backup for the next start.

**Pitch:** "Play some jazz in the kitchen", "shuffle on", "next song in the living room", "a bit quieter" — through the same check as every AI action. Tap the microphone and the speaker goes quiet until dictation ends.

**Status quo:** The allow list for `media_player` holds transport, `volume_set`, `volume_mute` and on/off (`utils/kiAktionen.js:82–92`). The check refuses any service whose domain differs from the entity's (`:330`), so `music_assistant.play_media` cannot pass. The context sends title and volume only (`utils/kiKontext.js:114`); `beschreibeKiDienste` tells the model what is allowed (`kiAktionen.js:428`). Dictation starts in `starteDiktat` (`utils/diktat.js:202`), and nothing lowers the music.

**What ships:**
- **S1 — one narrow exception.** `music_assistant.play_media` on speakers that #128 S1 recognises, with `media_id` as plain text of at most 120 characters, `media_type` and `enqueue` from fixed lists, and `radio_mode` as a yes/no. Also `shuffle_set`, `repeat_set`, `select_source` from `source_list`, and `volume_up`/`volume_down`. The context marks Music Assistant speakers, groups and this tablet's speaker (#138 S1) as the default target. Unlike #118 S3, which adds an action type of its own with a preview card, this is one listed service that may pass the domain check, with fixed fields; the tap rule stays as it is.
- **S2 — limits.** A `media_id` with `://` or a leading `/` is refused, because Music Assistant would play URLs and server file paths. The target must be in the list that was sent. What really started is reported by #136 S1's watcher, because Music Assistant's name lookup can pick another item. Volume goes through #99. `docs/SECURITY.md` changes in the same release.
- **S3 — ducking (optional, off by default).** While dictation runs and this tablet's speaker plays, its volume drops to a fifth. It is restored only if nobody changed it meanwhile; a backup left behind is restored at the next start.

**Hook (verified):** `utils/kiAktionen.js:82–92`, `:330`, `:428`; `utils/kiKontext.js:114`; `utils/diktat.js:202`.

**Effort:** Medium — 6–8 h; bundle about +0.8 KB.

**Why it fits:** AI mode already switches what the card shows; music is the one everyday request it refuses.

**Files (estimate):** `utils/kiAktionen.js`, `utils/kiKontext.js`, `utils/diktat.js`, `docs/SECURITY.md`, `de.js`/`en.js`, info-popup catalog.

---

### 140. Music beyond the detail view — a Music page, a now-playing tile, music in the search (needs a bundle decision)

**Pitch:** One tap in the side bar opens Music, full width on a landscape tablet: big cover, transport and volume on the left, Start, Search and Queue on the right, the speaker as a pill on top. While music plays, a tile on the start page and on the locked Zen page shows cover, title, play/pause and next. Typing "Abba" in the card's search offers the Abba album and "Search Music Assistant for Abba".

**Status quo:**
- Music is reachable only through a player's detail view (`components/controls/PresetButtonsGroup.jsx:55–56`), inside the controls column, 420 px high at base (`components/controls/MusicAssistantPanel.css:13`). The side bar lists Home, Search and the registered system entities (`components/tabs/SettingsTab/components/SidebarItemsSettingsTab.jsx:55–94`); none of them is about music (`system-entities/entities/`).
- The rich tile router has no `media_player` case (`components/bento/richRouter.jsx:21–62`). The Zen slots render plain tiles with a 1-s throttled `hass` (`components/BentoZenView.jsx:197`, `:595`).

**What ships:**
- **S1 — Music page.** A system entity "Music" whose view hosts the panel's parts in a full-width layout. The speaker is #138 S1's, else the playing Music Assistant speaker (latest `last_changed`), else the last one used. The detail-view entry stays.
- **S2 — the tile.** Cover from `entity_picture_local`, then `entity_picture` (`utils/mediaUrl.js:40–46`), title, artist, `media_play_pause`, `media_next_track`. A fixed speaker, or "follows this tablet's speaker". Idle shows "Nothing playing · Open Music" or hides (setting).
- **S3 — the main search.** The Music entity offers #134's cached rows as content, plus a row that opens the Music page with the query. No call per keystroke (#8's rule).
- **Thermal rule:** nothing runs while the page is closed. The tile has no progress bar; at most "3 min left" on the minute tick. One opacity crossfade per track, with the old cover held until the new one has loaded. No `get_queue` from the tile.
- **Bundle rule:** S1 and S2 cost about +4–5.5 KB. Liquid Glass is gone since v1.1.2503, so D3 (the energy view, −20 to −22.6 KB) is the only counter-financing on the table. Decide before building (D16).
- #115 S3's lock allow list gets a "music" entry. No composed class names. Buttons on the tile stop the tap from opening the detail view.

**Hook (verified):** `components/controls/PresetButtonsGroup.jsx:55–56`; `components/controls/MusicAssistantPanel.css:13`; `components/tabs/SettingsTab/components/SidebarItemsSettingsTab.jsx:55–94`; `components/bento/richRouter.jsx:21–62`; `components/BentoZenView.jsx:197`, `:595`; `utils/mediaUrl.js:40–46`.

**Effort:** Medium to large — 16–22 h in three slices; bundle about +4.5–6 KB.

**Why it fits:** It is the step from "a feature of one speaker" to "music on the wall", and it reuses the panel instead of building a second one.

**Files (estimate):** `system-entities/entities/music/` (new), `components/controls/MusicAssistantPanel.jsx` (layout prop), `components/bento/widgets/BentoRichMedia.jsx` (new), `components/bento/richRouter.jsx`, side-bar settings, register, `de.js`/`en.js`, info-popup catalog.

---

**Addenda from the same pass**

- **#22 — corrected in place.** The Music Assistant requirements paragraph now separates the rows the card builds itself from `get_library` ordering (#134) from what needs the server, and lists seven more server-only wishes: the full queue, favourites both ways, numbers in lists, playback options, people, fast start, and a house-wide "music is playing" entity.
- **#98 — corrected in place.** Its status quo and hook named the wrong tap (`useMaBrowse.js:194` serves the top-level sections, in practice radio); the single-track taps are in `BrowseTab.jsx:59` and `SearchTab.jsx:196`. Inside an album or playlist, #135 S3 plays from the tapped track.
- **#99 — more writers for the one clamp.** Add to **What ships:** "Further writers that go through the clamp: the volume steps and mute of #137, the member and group volumes of #138, `volume_up`/`volume_down` in AI mode (#139), the ducking of #139 S3, and `announce_volume` of #130 (a room limited to 60 % is not announced into at 100 %). #131 S1 (no jump on a tap) sits next to it."
- **#100 — one watcher.** Add to **What ships:** "The check whether the player followed is one module, shared with #136 S1. For Music Assistant speakers `media_content_id` carries the URI, so the check is exact there."
- **#3b E3 — note updated in place.** Slice 0 is wider (Music Assistant's `play_announcement` with `message` first, then `tts.speak`, then `_say`) and its hook moved; slice 0 is #130 S1–S2.
- **#1 — music commands:** #139. **#8 — music as content:** #140 S3. **#52 — a further adopter:** rows of the music panel (#135 S5). **#108 — the speaker:** #138 S1 lives in "This tablet".
- **#77 — a consumer.** Music Assistant exposes a speaker's own sound options (bass, treble, subwoofer level, tone mode and similar) as `number`, `select` and `switch` entities on the speaker's device, many of them off by default. With #77's controls, a "Sound" group in the speaker's detail view lists those siblings.
- **#111 — music in rest.** S3's rank list has no music. "Playing: title" from this tablet's speaker, with play/pause and next, is either a further rank or its own strip; it needs #105 S1's gesture position, so the buttons do not lift the rest. Decide with D10.
- **#103 — music is not a hold reason.** A playing speaker would keep the panel lit for hours; the answer is the tile of #140 S2 on the locked page.
- **#115 S3 — the allow list** gets a "music" entry from #140 S1.
- **D16 — a new open decision:** where music lives on the wall tablet. See the table under "Open decisions".
- **Part fourteen — correction to its intro.** "The queue with load-more" was listed as already in the card; load-more exists only in the library, and the queue shows the current and the next item.

---

## Open decisions (2026-09-24)

Thirteen questions that came out of the 2026-09-24 pass (Part eleven), plus D14 from 2026-10-25 and D15–D16 from 2026-11-02, and are deliberately not roadmap entries. D1 and D2 are resolved and marked; nothing open here is decided or recommended. The columns give what each option costs and touches, read from the code at v1.1.2468 (D14 at v1.1.2482, D15–D16 at v1.1.2509). Where an entry above says "open decision Dn", it means one of these.

| # | Question | Option A | Option B | Cost / effort | Touches |
|---|---|---|---|---|---|
| D1 | ✅ **Resolved 2026-10-20: built (option B, via `ai_task.generate_data`), shipped v1.1.2481 — see #1.** AI mock (#1): `AIModeInterface.jsx:54–72` answers via `setTimeout` with a fixed text and fake sources (`:123–127`); entry points Alt+A (`searchEventHandlers.js:221–228`), Tab without a suggestion, Enter with text (`:297–306`); `aiModeEnabled` has no switch | Remove: component, the three keyboard entry points, i18n; redefine Enter (e.g. open the first result) | Build for real: `ai_task.generate_data` + `ai_task/preferences/get` (question/answer without device control, M) or `conversation.process` with an agent picker and tool-call rendering (L); push-to-talk via `assist_pipeline/run end_stage=tts` (`diktat.js:160`, per the checker) as voice input | A: −2.4…3.3 KB, S · B: +2–4 KB, M/L | #31, the #12 remainder, the bulk-action alternative in #70 |
| D2 | ✅ **Resolved 2026-10-29 (v1.1.2503): removed** — Liquid Glass went out with all live blur; it is no longer available as counter-financing, which leaves D3. Liquid Glass (#35/#37/#40): one library for one mobile sheet (`DetailRightSheet.jsx:14` is the only importer, `:241/:262` two `<Glass>`); the user approved the look in v2085 (`liquidGlassSettings.js:14–17`). ✅ **Answered 2026-10-26 (v1.1.2492): keep** — the desktop detail view now uses the same glass layer over the cover (`DetailView/DetailRightGlas.jsx`, shared optics in `DetailView/glasOptik.js`), so the library has two consumers. **v1.1.2500 (2026-10-27): desktop half removed again** (user decision: desktop as before v1.1.2492, no Liquid Glass on desktop; the CSS frosted glass everywhere takes over the Safari look). The library is back to one consumer (`DetailRightSheet.jsx`, optics still in `DetailView/glasOptik.js`). | Remove: library + copy path + settings page (12 sliders), register/defaults/catalog/i18n; the sheet becomes CSS glass | Keep: #40 three presets (S), #37 capability line (S), #35 never | A: −16.2 KB (audit B12), S/M — the sheet's look changes visibly on Chromium tablets | #35, #37, #40 |
| D3 | Energy Dashboard (#6): six roots; `energyDashboardCalculations.js` is imported by six modules outside it (chronicle, center, chart header, logbook, statistics) | Remove in three slices: move the shared functions + B29 (3 h, needs no user yes) → soft shutdown with a delete button for stored energy devices (3 h) → cut (3–4 h) | Keep, do not extend | −20…22.6 KB (audit B03), M (8–12 h); breaking for third-party installs with a stored energy device (`deviceConfigStorage.js` user_data key) | Slice 1 is a refactor gain regardless of the answer |
| D4 | Test suite (#36): 13 specs / 107 tests, state v2317; the modules since then have no net | Bring up to v2468 | Leave as is | M | Hard rule: only on explicit request — hence no planning here, only the question |
| D5 | Back up settings in HA: the builder uses `frontend/get_user_data` + `set_user_data` (`deviceConfigStorage.js:86–114`); everything else lives only in localStorage | "Save to HA / load from HA" under one key with an allow-list (caches excluded), variant "changed only" | Stays browser-local | +2–3 KB, M (6–8 h); user_data is USER-bound — kiosk user ≠ phone user; roadmap Out of scope lists "Backup/Restore settings as JSON" | Automatic sync (L) only on a yes |
| D6 | Stop/cancel on the live capsule (#29 remainder) | Yes — define the gesture (✕ only for stoppable domains, swipe, long-press); reverses v2204/v2205 | No — the timer detail view (#82) suffices | S (3–5 h) | #82 |
| D7 | Quick Control from the grid tile: the window body exists since v2454 in the list row (per the checker `DeviceCardListView.jsx:230–284`) | ⋯ button in the tile (visible; noise in the 4-tile grid) | Long-press on the text (uses up #52 in the grid) or desktop only | S–M | #52 search results |
| D8 | Camera system view (#4 remainder): grid, snapshot history, two-way audio | Pursue (L, > 40 h, bundle +15–25 KB, a server automation is needed for the history) | Stay with E1 + camera domain config + doorbell → door | D3 as counter-financing? | #62 |
| D9 | Context line via a Jinja field | Allow a one-off exception (`render_template` subscription, S) | Entity picker (HA template helper), no Jinja in the card (#72 slice) | S; against roadmap #3/#54 | #72 |
| D10 | Photo frame: keep status line + context line visible in deep rest (default off) | Switch (S, 3–4 h) — tilts the #61 aesthetic | Leave as is | S | Immich as a source would be an idea of its own |
| D11 | Empty gears (Tips, Version history, Schedules show "Einstellungen werden hier angezeigt") | Remove (1 h) | Fill with real settings | S | #46 register |
| D12 | Per-feature off switches (#46 companion idea): a switched-off feature disappears from register, search and tiles | Build (M, 10–12 h, three slices; no bundle effect) | Do not | M | Register, tile building, content search |
| D13 | Video doctor (#50) — pull it now? | Yes, one release (4–6 h, benefit 2) | Drop | S | prompt 19 (`docs/prompts/2026-09-11-optimierung/19-video-doktor.md`, unversioned) |
| D14 | Acknowledge `alert.*` in HA as well (Part thirteen): acknowledging is local by design (`utils/notificationState.js:123`), so a warning acknowledged on the wall tablet stays open on the phone | Option: also call `alert.turn_off`, which HA shares with every device and user | Stays local, per device | S (2 h) | Reverses the "acknowledge is local" contract of the notification system; `alert.turn_on` would be the undo |
| D15 | A kiosk app's JavaScript bridge (Part fifteen): some kiosk browser apps for wall tablets put a JavaScript object into every page, with calls for screen on and off, brightness, keeping the app awake and native sound. The card reaches the panel only through HA entities (#49, #63: no integration-specific code, `utils/displayUebergabe.js:20–23`); nothing says such an app is in use here | A thin, optional adapter: detect the object and use only the two calls that have no entity equivalent — keep the app from idling while a hold reason is open (#103), and native sound that is not blocked after a reload (#102). Everything else stays on entities. No call is ever built from notification text, AI output or other outside data; a SECURITY.md paragraph | Stay entity-only, as today | A: S–M (4–6 h), < 2 KB gzip; untestable without the device; the object is open to every script on the page | #49, #63, #102, #103, #110, `docs/SECURITY.md` |
| D16 | Where does music live on the wall tablet (Part seventeen)? Today only inside a speaker's detail view (`components/controls/PresetButtonsGroup.jsx:55–56`) | Only there, made better by #128–#139 (the announcement sheet of #130 S3 and AI mode of #139 reach speakers from outside, but add no music surface) | Also a Music page in the side bar and a now-playing tile on the start and Zen pages (#140) | B: about +4–5.5 KB gzip on a bundle already over the warning; D3 is the only counter-financing left | #140, #115 S3, D3 |

---

## Notes

- This roadmap is a **proposal**, not a commitment. Selection and order are open.
- Effort estimates are rough: Small < 4 h, Medium 4–16 h, Large > 16 h.
- Structural refactors (see `memory/project_structural_refactor_plan.md`) are a parallel track and don't compete with this roadmap.
- The roadmap covers **138 feature ideas + 2 parallel/long-term tracks** = 140 entries total.
  - **#1–#10** — May 2026's "what was clearly missing then" baseline.
  - **#11–#20** — June 2026's "what users keep asking about post-Quick Control".
  - **#21** — Localization track (parallel, community-paced).
  - **#22** — Companion Integration (long-term, the path to real HA Quality Scale grading — see [QUALITY.md](QUALITY.md)).
  - **#23–#34** — competitive + community research pass. Multi-agent dive across r/homeassistant, the HA forum, the top custom-card repos (Mushroom, Bubble, Button-Card, mini-graph-card, mini-media-player, Power Flow Card Plus, Tile), HA Core 2025–2026 release notes and the Apple Home ecosystem. Each idea links a specific source.
  - **#35–#43** — July 2026 momentum-driven pass (post-Liquid-Glass, post-Batch-5). Mostly continuations of active work or activations of half-wired code seams, not net-new subsystems. Each has a code-verified hook.
  - **#44–#45** — August 2026. #44 prompted by [home-status](https://github.com/biggiebytes/home-status) (MIT), which arrived independently at the same "surface only what matters" thesis — concept borrowed, nothing copied. #45 came out of answering a forum question incorrectly and checking the code afterwards. #46-#48 came from reading Calendar Card Pro's feature docs — ideas only, nothing taken from its code. #49 is the settings surface for #9, modelled on what dedicated wall panels already offer. #50-#52 came from studying a mature camera-gallery card — ideas only. #53-#55 came from two family-calendar cards; #55 also answers a gap a forum user named directly.
  - **#56–#60** — 2026-08-24 code-analysis pass after the v1.1.2353–2361 UI rounds: seams the new code itself exposed (stale todos, the typing loop as an information surface, notification lanes without human sources, one-period charts, irreversible deletes).
  - **#61–#64** — 2026-08-27 screensaver expansion pass. v1.1.2369 shipped the pragmatic core of #9/#49 (idle → locked Zen page); these slice the open remainder — deep-rest dimming with quiet-hours coupling, wake sources, display handoff, photo frame — into individually shippable steps, on a shared idle-service foundation that consolidates the card's three existing idle clocks.
  - **#65–#67** — 2026-09-04 household-task research pass. Three mature HA task integrations (Home Tasks, TaskMate, Better ToDo) read end to end; each is an integration because points, streaks, rotation and habits need per-task persistence a card cannot hold. Only what works over HA's standard `todo` platform became entries — the rest went to #22 as requirements input, along with two design contracts and a scope warning. #68 came from the discussion under one of those projects rather than its README — a user stuck on a cached build after updating. Ideas only.
  - **#69–#85** — 2026-09-24 re-analysis at v1.1.2468, after 97 builds since 1 September. Five sources read side by side (code seams with exactly one consumer, an HA API survey 2026.6–2026.9, neighbouring cards and family-tablet projects, the card's own release momentum, a first-evening user walk-through); 56 candidates through a hook checker and a skeptic. Mostly second consumers for existing modules, domain configs for fallback domains, and three repairs where HA moved under the card. HA standard APIs only, ideas only. Same pass: #2, #7, #14–#20, #23–#25, #32, #35, #37, #39, #41, #43 retired (see Out of scope); #5 and #26 re-scoped into #79 and #83; thirteen decision questions listed under "Open decisions".
  - **#86–#90** — 2026-10-02, from reading a combined calendar-and-tasks agenda card against the code at v1.1.2474. One medium entry (tasks in the calendar) and four small ones (duplicates, source capabilities, relative time, map link). Ideas only.
  - **#91–#97** — 2026-10-25, from reading two room-by-room dashboard projects against the code at v1.1.2482. Two medium entries (alarm panel, household appliances) and five small ones (tidying the center, ventilation hint, scenes first, last motion, the reason behind automatic choices); an addendum to #70 and decision D14. Ideas only.
  - **#98–#100** — 2026-10-25, from reading a pair of touch-first Music Assistant cards against the code at v1.1.2482. Three small entries (play now and keep the queue, volume limit and starting volume, a second next/previous); lyrics and recommendations went to #22 as requirements input. Ideas only.
  - **#101–#119** — 2026-11-02, from reading the documentation of a kiosk browser app for Android wall tablets against the code at v1.1.2507, every hook re-read at v1.1.2509. One repair first (deleting a merged calendar event), then the wall tablet's manners: the timer end, holding the screensaver, the connection, deep-rest stages, display off, the photo frame, the tablet's own identity, the calendar on the wall, real brightness, what stands in rest, rest faces, a lean deep rest, automations for one tablet, the lock, old devices, the tablet's check, AI mode and dictation, the side bar. Addenda to thirteen existing entries and three open decisions (D5, D8, D10), and decision D15. Music, speaker and announcement ideas from the same pass went to Part seventeen. Ideas only.
  - **#120–#127** — 2026-11-02, from reading a statistics chart card and a card for Home Assistant's schedule helper against the code at v1.1.2509. Five chart entries (repairs first, then a fair running period that corrects #59, on-time bands, picked days with statistics, true extremes) and three schedule entries (scheduler edits that lose data, the schedule helper, the next run); an addendum to #3, notes on #59, #96, #21 and D3, and requirements input for #22. Ideas only.
  - **#128–#140** — 2026-11-02, a deep Music Assistant pass: a pair of touch-first Music Assistant cards for wall tablets read in full, Home Assistant's Music Assistant and media-player APIs, and the card's own music code, all checked against Home Assistant's source. Six repairs first (detection of idle and off speakers with their dead service paths, error states, announcements over modern TTS, accidental ring taps, a steady now-playing header and an honest live row, the open panel's cost), then home rows from the own library, search, honest feedback, media basics, the speaker sheet with a sleep timer, music in AI mode, and a Music page that waits on D16. #22's music text, #98's hook, the #3b E3 note and Part fourteen's intro corrected in place; addenda to ten more entries and decision D16. Ideas only.
