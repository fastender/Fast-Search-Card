# Tips — Questions & Answers

The most important questions about the card, each with an answer that fits on one screen. From "How do I open search?" to "What is Liquid Glass?".

<!--
AUTHORING NOTE (ignored by the parser):

Format per tip — follow exactly, otherwise the parser skips the entry:

    ## Tipp {slug} - {Category}
    (blank line)
    **Title:** {question}
    **Hero:** none
    **Tags:** {Tag1, Tag2}
    (blank line)
    {answer — markdown allowed}
    (blank line)
    ---

Rules:
- slug: ASCII letters, digits, hyphens only. Must be IDENTICAL in
  lessons.de.md and lessons.en.md (deep-link parity).
- Category: short, shown as a group in the UI.
- Title: phrase it as a question — that's the concept of this book.
- Answer: 3–6 lines. One thing per tip. Apple-Tips style.
- Add new tips at the end of the matching category. Content source is
  docs/info-popups/info-popups-catalog.md.
-->

---

## Tipp was-kann-die-card - First Steps

**Title:** What can this card actually do?
**Hero:** none
**Tags:** Start, Overview

More than search. The card is a complete dashboard: find and control devices, a start screen with live widgets, calendar, tasks, news, schedules, energy overview — all in one card, all local on your Home Assistant.

These tips walk you through every area, one at a time.

---

## Tipp suche-oeffnen - First Steps

**Title:** How do I open search?
**Hero:** none
**Tags:** Start, Search

Tap the search bar. The card expands downward and shows your devices, grouped by room.

To close: swipe down or tap outside.

---

## Tipp geraet-steuern - First Steps

**Title:** How do I control a device?
**Hero:** none
**Tags:** Start, Control

Tap a device in the list — the detail view opens with all its controls: sliders for brightness, dials for temperature, buttons for covers.

There's an even faster way: Quick Control — see the "Quick Control" category.

---

## Tipp zurueck-navigieren - First Steps

**Title:** How do I get back?
**Hero:** none
**Tags:** Start, Navigation

There's always a back arrow at the top left. On the phone, a right-swipe works too.

The card remembers where you were — after a device you land back in your search list, not at the start.

---

## Tipp startseite-verstehen - First Steps

**Title:** What does the start screen show me?
**Hero:** none
**Tags:** Start, Bento

The start screen is made of tiles ("Bento widgets"): favorites, weather, appointments, tasks, news, tips, and the changelog. Everything live, everything tappable.

On the phone, swipe sideways through the large widgets.

---

## Tipp tippfehler - Search

**Title:** Do I have to spell device names exactly?
**Hero:** none
**Tags:** Search, Fuzzy

No. Search forgives typos — "ligth" still finds your light. Partial words work too: "bed lamp" finds the "Bedroom Bed Lamp".

Two or three letters are usually enough for the right match to surface.

---

## Tipp raum-filter - Search

**Title:** How do I see only devices from one room?
**Hero:** none
**Tags:** Search, Filter

Type the room name into the search field. When the suggestion appears as ghost text, confirm with Tab (desktop) or tap the suggestion (phone) — the room becomes a blue chip and the list narrows to that room.

Chips combine: first "Kids' room", then "lamp".

---

## Tipp chips-verstehen - Search

**Title:** What do the colored chips in the search field mean?
**Hero:** none
**Tags:** Search, Chips

Chips are active filters. Blue = room, purple = device type, green = sensor type.

One tap selects a chip, a second tap removes it — like recipients in iOS Mail.

---

## Tipp kategorien - Search

**Title:** What are Devices, Sensors, Actions, and Custom?
**Hero:** none
**Tags:** Search, Categories

Four sections, four views on your home:

- **Devices** — everything you can switch: lights, switches, climate, covers.
- **Sensors** — everything that measures: temperature, motion, energy.
- **Actions** — scenes, scripts, automations.
- **Custom** — the built-in apps: calendar, tasks, news, settings.

---

## Tipp ansicht-wechseln - Search

**Title:** How do I switch between grid and list view?
**Hero:** none
**Tags:** Search, View

Use the symbol next to the search field. Grid shows large tiles, list shows compact rows with more devices at a glance.

Your choice is saved — even after a reload.

---

## Tipp favoriten-anlegen - Search

**Title:** How do I set favorites?
**Hero:** none
**Tags:** Search, Favorites

In a device's detail view: tap the heart at the top right. The device now appears in the Favorites tab and in the Favorites widget on the start screen.

Same path to remove it.

---

## Tipp vorschlaege - Search

**Title:** Why does the card suggest certain devices?
**Hero:** none
**Tags:** Search, Suggestions

The card learns from your taps — locally, no cloud. What you use often moves up. What you ignore loses weight. Old patterns fade on their own over time.

Reset anytime: Settings → Suggestions → Clear learning data.

---

## Tipp quick-control - Quick Control

**Title:** How do I switch a light with a single tap?
**Hero:** none
**Tags:** Quick Control, Light

Enable Quick Control: Settings → Appearance → Quick Control. From then on, the device icon itself is the switch — tap the lamp icon, lamp on. No detail view needed.

Tapping next to the icon (on the rest of the card) still opens the detail view.

---

## Tipp quick-control-halten - Quick Control

**Title:** Why do I have to press and hold for covers?
**Hero:** none
**Tags:** Quick Control, Safety

By design. A wrongly switched light is fixed in a second — an accidentally opened cover or lock isn't. So: risky direction = press and hold until the ring fills. Safe direction (close, lock) = single tap.

Asymmetric, on purpose.

---

## Tipp quick-control-domains - Quick Control

**Title:** Can I choose which device types get icon switching?
**Hero:** none
**Tags:** Quick Control, Settings

Yes. Settings → Appearance → Quick Control opens a list of all device types. Each type knows three modes: Off, Tap, or Hold.

Defaults: lights/switches/fans on Tap, covers/locks on Hold.

---

## Tipp listen-aktionen - Quick Control

**Title:** What's behind the "⋯" in list view?
**Hero:** none
**Tags:** Quick Control, List

Tapping "⋯" expands the most important controls right under the row — brightness presets for lights, position for covers, mode for climate. The same controls as the detail view, just inline in the list.

---

## Tipp helligkeit - Control

**Title:** How do I dim a light?
**Hero:** none
**Tags:** Control, Light

In the detail view: drag the circular slider. The value in the middle counts along live. Release to set.

The power button sits at the top of the circle and remembers the last brightness.

---

## Tipp farbtemperatur - Control

**Title:** How do I change the light color?
**Hero:** none
**Tags:** Control, Light

Below the brightness slider sit the mode buttons: Brightness, Color Temperature, Effects. Tap "Color Temperature" — the circle becomes a warm-to-cool dial.

If your light supports colors, a color wheel appears as well.

---

## Tipp klima - Control

**Title:** How do I set the heating?
**Hero:** none
**Tags:** Control, Climate

The circular slider sets the target temperature. Below it you pick the mode — heat, cool, auto, off. The bar at the bottom shows presets and fan speeds, if your device supports them.

---

## Tipp cover-position - Control

**Title:** How do I move a cover to a specific position?
**Hero:** none
**Tags:** Control, Covers

The circular slider sets the position in percent — 0 is closed, 100 is open. The buttons below open fully, stop, or close fully.

Tilt slats (on blinds) get their own dial if your device reports them.

---

## Tipp kontext-tab - Control

**Title:** Where do I find scenes that match a device?
**Hero:** none
**Tags:** Control, Scenes

Second tab in the detail view ("Context"). The card collects every scene, script, and automation that touches this device — sorted by relevance. One tap runs it; a brief confirmation pops up.

---

## Tipp verlauf - Control

**Title:** Where do I see a device's history?
**Hero:** none
**Tags:** Control, History

Third tab in the detail view ("History"). Charts for 24 hours, 7 days, or 30 days, plus recent events as a list and statistics like on-time and change frequency.

Works for every device — sensors included.

---

## Tipp musik - Control

**Title:** How do I control my music?
**Hero:** none
**Tags:** Control, Music

Open a media player. If Music Assistant is running, you get the full panel: queue, library search, speaker switching, text-to-speech. Volume and progress live on the circular slider.

The current track's cover becomes the background.

---

## Tipp bento-anpassen - Home Screen

**Title:** Can I rearrange the start screen?
**Hero:** none
**Tags:** Home Screen, Bento

Yes. Settings → General → Home Screen. Decide which widget sits in which of the four slots — or turn the start screen off entirely if you'd rather start in search.

---

## Tipp bento-slider - Home Screen

**Title:** How do I switch between weather, news, and appointments?
**Hero:** none
**Tags:** Home Screen, Widgets

The large right-hand widget is a carousel: it cycles automatically through weather, calendar, tasks, and news. Swipe to switch manually; the dots below show the position.

The card remembers where you were — even after a trip into a detail view.

---

## Tipp statsbar - Home Screen

**Title:** What is the narrow bar at the very top?
**Hero:** none
**Tags:** Home Screen, StatsBar

The status bar — live values at a glance: weather, clock, power draw, solar. Which widgets appear is up to you: Settings → General → Status & Greetings.

---

## Tipp begruessung - Home Screen

**Title:** Can I change or turn off the greeting?
**Hero:** none
**Tags:** Home Screen, Greeting

Both. Settings → General → Status & Greetings. The greeting adapts to the time of day, knows your name, accepts custom texts — or switches off entirely.

---

## Tipp termin-anlegen - Calendar

**Title:** How do I create an appointment?
**Hero:** none
**Tags:** Calendar, Events

Open the calendar (via search or sidebar) → plus button. Type a title or grab one of the quick chips (Appointment, Meeting, Doctor …), pick date and time on the wheels, save.

The event lands directly in your Home Assistant calendar — no cloud in between.

---

## Tipp termin-wiederholen - Calendar

**Title:** How do I create recurring events?
**Hero:** none
**Tags:** Calendar, Recurrence

While creating: tap the "Repeat" row. Five patterns are ready — daily, weekly, monthly, yearly, or never.

More complex rules (like "every second Friday") are displayed when they come from other calendars.

---

## Tipp kalender-ansichten - Calendar

**Title:** How do I switch between day, week, month, and year?
**Hero:** none
**Tags:** Calendar, Views

Via the buttons at the top of the calendar. Month shows dots per event, week shows time blocks, year shows twelve mini-months.

Which views are offered at all is configurable in the calendar settings.

---

## Tipp kalender-quellen - Calendar

**Title:** Which calendars does the card show?
**Hero:** none
**Tags:** Calendar, Sources

Every calendar integration in your Home Assistant — CalDAV, Google, local calendars. The card finds them automatically and blends the events, color-coded by source.

Individual calendars can be hidden in the calendar settings.

---

## Tipp aufgabe-anlegen - Tasks

**Title:** How do I create a task?
**Hero:** none
**Tags:** Tasks, Create

Open Tasks → plus button → type a title. Optionally: pick a list, set a due date, add a note — all in the same dialog, Reminders-style.

---

## Tipp faelligkeit - Tasks

**Title:** How do I set a due date?
**Hero:** none
**Tags:** Tasks, Due Date

While creating or editing: tap the "Due" row, set date and time on the wheels.

Overdue tasks turn red — impossible to miss, on purpose.

---

## Tipp aufgaben-listen - Tasks

**Title:** How do I switch between multiple lists?
**Hero:** none
**Tags:** Tasks, Lists

Via the filter pills above the tasks. First row: status (open, done). Second row: your lists. Both filters combine — "open" plus "shopping list" shows exactly that.

The card automatically collects every task integration in your Home Assistant.

---

## Tipp schedule-anlegen - Schedules

**Title:** How do I schedule a device to switch automatically?
**Hero:** none
**Tags:** Schedules, Automation

Open a device → "Schedule" tab → plus. Pick a time on the wheel, set the action (on, off, temperature …), tap the weekdays, save.

Requires the Scheduler integration (nielsfaber/scheduler-component) in Home Assistant.

---

## Tipp schedule-wochentage - Schedules

**Title:** How do I set different times for weekdays and weekends?
**Hero:** none
**Tags:** Schedules, Weekdays

Create two schedules: one with Mon–Fri, one with Sat–Sun. The weekday chips in the editor make the selection a one-tap job.

---

## Tipp schedule-uebersicht - Schedules

**Title:** Where do I see all schedules at once?
**Hero:** none
**Tags:** Schedules, Overview

Search for "Schedules" or open the schedule overview from the sidebar. Every timer and schedule across all devices lives there — filterable, with a jump straight to each device.

---

## Tipp energie-einrichten - Energy

**Title:** How do I set up the energy dashboard?
**Hero:** none
**Tags:** Energy, Setup

Search "Add devices" → Energy Dashboard. The wizard pulls sensors from your Home Assistant energy configuration automatically; anything missing you pick by hand.

Afterwards the dashboard appears as its own device in your search.

---

## Tipp energie-lesen - Energy

**Title:** What do the circles in the energy dashboard mean?
**Hero:** none
**Tags:** Energy, Overview

Each circle is an energy source or consumer: grid, solar, battery, home. The numbers are live. In the dashboard settings you decide which values appear in which circle.

---

## Tipp wallpaper - Appearance

**Title:** How do I set my own background image?
**Hero:** none
**Tags:** Appearance, Background

Settings → Appearance → Wallpaper. Either enter an image URL or open the gallery and pick by thumbnail from your Home Assistant media folder.

The image fills the entire view — not just the card.

---

## Tipp hintergrund-videos - Appearance

**Title:** How do I get videos behind the device view?
**Hero:** none
**Tags:** Appearance, Videos

Drop MP4 files into `/config/www/fast-search-videos/` — named by the pattern `light on = light_on.mp4`. Open a light and the video plays looped and muted behind the controls.

A starter pack with 30+ clips lives in the GitHub repo under `media/videos/`.

---

## Tipp liquid-glass - Appearance

**Title:** What is Liquid Glass?
**Hero:** none
**Tags:** Appearance, Design

A glass effect for the controls: refraction, sheen, color fringe — as if real glass sat on top of the background. Settings → Appearance → Design → Liquid Glass.

Fourteen dials for connoisseurs. The default looks good without touching any of them.

---

## Tipp splashscreen - Appearance

**Title:** Can I change the startup screen?
**Hero:** none
**Tags:** Appearance, Start

Yes, three options: Off (start instantly), progress bar (classic), or the handwritten "hello" animation. Settings → Appearance → Splashscreen.

---

## Tipp spalten - Appearance

**Title:** How do I change the number of cards per row?
**Hero:** none
**Tags:** Appearance, Grid

Settings → Appearance → Grid columns: 4, 5, or 6. Fewer columns = larger tiles, more columns = more overview.

---

## Tipp entitaeten-verstecken - Filter

**Title:** How do I hide devices I never need?
**Hero:** none
**Tags:** Filter, Hide

Settings → Filter → Excluded patterns. Enter patterns with wildcards — `sensor.*` hides all sensors, `*_unavailable` hides everything unreachable.

The live preview shows instantly what a pattern would match. Ready-made templates are included.

---

## Tipp versteckte-anzeigen - Filter

**Title:** How do I see devices Home Assistant has hidden?
**Hero:** none
**Tags:** Filter, Visibility

By default the card respects what HA has hidden or disabled. If you want to see those entries anyway: Settings → Filter → Visibility — three toggles for hidden, disabled, and diagnostic entities.

---

## Tipp datenschutz - Filter

**Title:** What does the card send to the internet?
**Hero:** none
**Tags:** Filter, Privacy

None of your data. No telemetry, no tracking, no cloud connection. The only external fetches are two markdown files from GitHub (the changelog and these tips) — no credentials, none of your content.

The full security report lives in the GitHub repo: `docs/SECURITY.md`.

---

## Tipp sprache - Pro Tips

**Title:** How do I switch the card to German or English?
**Hero:** none
**Tags:** Settings, Language

Settings → General → App language. The setting is independent of your Home Assistant's language — card in English, HA in German works fine.

More languages are in the works; Dutch is next.

---

## Tipp cache-leeren - Pro Tips

**Title:** The card shows stale data — what now?
**Hero:** none
**Tags:** Help, Cache

Settings → About → Clear cache. That empties the search and suggestion caches; your settings and favorites stay.

The big hammer next to it — "Reset all data" — really resets everything. Double confirmation, for good reason.

---

## Tipp changelog - Pro Tips

**Title:** Where do I see what changes with updates?
**Hero:** none
**Tags:** Help, Updates

Search "Changelog" or tap the changelog widget on the start screen. Every version is documented — searchable and filterable by topic.

---

## Tipp zeit-sortierung - Pro Tips

**Title:** Can the card show different devices in the morning than in the evening?
**Hero:** none
**Tags:** Pro, Sorting

Yes — time sorting learns which devices you use at which time of day and sorts the list accordingly. Coffee machine on top in the morning, living-room light in the evening.

Enable via the clock symbol in the toolbar or in the filter settings.

---

## Tipp toasts - Pro Tips

**Title:** Can I customize the little confirmation pop-ins?
**Hero:** none
**Tags:** Pro, Toasts

Yes. Settings → General → Toasts. Decide which events trigger a pop-in, where it appears, and how long it stays.

---

## Tipp geraete-bauen - Pro Tips

**Title:** Can I build my own device views — without code?
**Hero:** none
**Tags:** Pro, Integration

Yes. Search "Add devices" and pick a type: Energy Dashboard, 3D printer, weather station, or Universal. Select sensors, name them, done — the card builds the view.

No YAML. Editable anytime.

---
