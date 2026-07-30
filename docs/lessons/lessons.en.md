# Tips — Questions & Answers

The most important questions about the card, each with a thorough answer. From "What am I looking at?" through the Island and the Notification Center to building your own device views.

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
- Answer: direct answer first (1-2 sentences), then `###` sub-sections for
  steps, background and edge cases.
- ⚠️ NEVER use `---` inside a tip — it terminates the entry early. Use `###`
  headings for structure instead.
- Add new tips at the end of the matching category. Fact sources are
  docs/info-popups/info-popups-catalog.md and the version history.
-->

---

## Tipp was-kann-die-card - First Steps

**Title:** What can this card actually do?
**Hero:** none
**Tags:** Start, Overview

More than search. The card is a complete dashboard inside a single Lovelace card.

### What's inside
- **Search and control** for every device in your Home Assistant
- **A start screen** with clock, greeting and live tiles
- **The Island** — a capsule up top that shows whatever matters right now
- **Notification Center** with history, severity levels and quiet hours
- **Apps**: calendar, tasks, news, schedules, tips, changelog
- **Energy dashboard** and a builder for your own device views

### Where it all lives
Everything runs locally in your browser and talks straight to your Home Assistant. No cloud service, no account, no telemetry.

### How to get going
These tips are grouped by area and build on each other. If you just installed the card, work through "First Steps" in order.

---

## Tipp zen-start - First Steps

**Title:** What am I looking at when the card opens?
**Hero:** none
**Tags:** Start, Zen

A calm start screen: the date, a large clock, your greeting and the search bar. Everything else is one gesture away.

### What's on it
- **Date and clock** — large, undistracted
- **Greeting** — with your name where Home Assistant knows one
- **Search bar** — centred, ready to tap
- **Waiting alerts** — stacked beneath, like a lock screen

### Why so little
On a wall tablet the card often runs all day. A screen showing only the time and what matters reads better in passing than a full dashboard. Anyone who wants more takes it with one gesture.

### Good to know
The entry animation moves nothing — clock, greeting and bar are in place from the first frame and only resolve from blurred to sharp. After that a single highlight sweeps across the glass of the search bar.

---

## Tipp zen-aufdecken - First Steps

**Title:** How do I get from the start screen to my devices?
**Hero:** none
**Tags:** Start, Gestures

One gesture is enough: swipe up, turn the mouse wheel, or press the down arrow key.

### What happens then
The reveal runs by itself — nothing gets stuck halfway:

1. Clock, greeting and alerts step aside
2. The search bar travels from the centre to the top and becomes the toolbar
3. The island settles above it
4. The sidebar slides in from the left
5. The four tiles arrive one after another — largest first

### It's a one-way trip
Once revealed, the card stays revealed. Even going into search or opening a device brings you back to the tiles afterwards, not to the resting screen. Only reloading the page brings that back.

### Why that makes sense
Anyone who has used the card once doesn't want to face the locked door again on the next glance. The resting screen is meant for the untouched state — the wall tablet nobody has been near for hours.

### Good to know
While the island is unfolded the gesture is ignored — otherwise scrolling inside the island would rebuild the whole screen by accident.

---

## Tipp geraet-steuern - First Steps

**Title:** How do I control a device?
**Hero:** none
**Tags:** Start, Control

Tap a device in the list — the detail view opens with all its controls.

### What you'll find
- **A circular slider** for anything with a value: brightness, temperature, position
- **Mode buttons** below it: colour temperature, effects, heat/cool
- **Tabs** across the top: Controls, Context, History, Schedule, Settings

### The faster route
For light on/off you don't need the detail view at all — with Quick Control the device icon itself becomes the switch. See the "Quick Control" category.

### Good to know
Which controls appear is decided by device type. A cover gets position and tilt, a media player gets volume and queue, a thermostat gets target temperature and modes.

---

## Tipp zurueck-navigieren - First Steps

**Title:** How do I get back?
**Hero:** none
**Tags:** Start, Navigation

There's always a back arrow at the top left. On the phone a right-swipe works too.

### The card remembers the path
After a device you land back in your search list — same filter, same scroll position. Not at the start.

### Inside the apps
Calendar, tasks and news have their own back and overview buttons top left. From a detail view the first tap returns to the list, the second to the card.

---

## Tipp startseite-verstehen - First Steps

**Title:** What do the tiles show me?
**Hero:** none
**Tags:** Start, Bento

Four tiles ("Bento widgets") with your most important live information. All real, all tappable.

### The four slots
- **W1** — large, on the left: usually favorites or suggestions
- **W2** — top right: a carousel of weather, calendar, tasks and news
- **W3 / W4** — split along the bottom: tips and changelog, for example

### What a tap does
Tapping a tile opens the matching detail view directly — the weather widget goes to weather, an appointment to the calendar, a device in favorites to that exact device.

### Good to know
Which app sits in which slot is up to you: Settings → General → Home Screen.

---

## Tipp insel-was - The Island

**Title:** What is the capsule at the top?
**Hero:** none
**Tags:** Island, Overview

The Island — a glass capsule that always shows exactly **one** thing: whichever matters most.

### The priority order
1. **Alert** — warnings orange, infos blue. Several stack into "N notifications".
2. **Live activity** — a running timer with countdown, the vacuum, a moving cover, playing media. With several: the most important plus "+N".
3. **Rest** — clock, weather and a presence dot. Grey means nothing is waiting.

### The resting face rolls
When nothing is going on, the island cycles through the facts of your home: weather, how many lights are on, how many windows are open. Every number is tappable and leads exactly there.

### Why one instead of many
A calm capsule that only speaks up when there's something to say — instead of a bar full of widgets competing for attention all day.

---

## Tipp insel-tippen - The Island

**Title:** What happens when I tap the island?
**Hero:** none
**Tags:** Island, Interaction

A short tap opens the view that fits whatever it's currently showing.

### Where it goes
- **On an alert** → the Notification Center
- **On a live activity** → the detail view of the running device
- **At rest** → the area the currently shown number refers to (weather, lights, windows)

### The transition
The capsule morphs into the target view — it grows into the full view from where it stands, instead of a new panel dropping over it. Closing runs the same thing backwards.

---

## Tipp insel-halten - The Island

**Title:** How do I see everything that's running at once?
**Hero:** none
**Tags:** Island, Live

When more than one thing is running, a tap on the island unfolds the full list instead of jumping straight into a device.

### Which reaction you get
- **Several running activities** → the capsule unfolds into a glass list, each row opens its device
- **Exactly one activity** → straight into its detail view
- **A new alert just arrived** → the Notification Center
- **At rest** → the Notification Center as well
- **Already unfolded** → another tap closes it

### Scrolling the list
When there are many, the unfolded list scrolls. It closes itself as soon as nothing is running anymore.

### A note on older descriptions
Up to v1.1.2205 this list needed a long press. Since v1.1.2206 a normal tap is enough — if you know the hold from older write-ups, it is no longer needed.

---

## Tipp insel-nachts - The Island

**Title:** Why does the island only show the clock at night?
**Hero:** none
**Tags:** Island, Quiet Hours

Because during your quiet hours it puts on its night face: dimmed, reduced to the time.

### What goes quiet
The resting face — weather, readings, rolling facts. On a wall tablet in the hallway or bedroom, no ticker should glow at night.

### What still gets through
Alerts and live activities stay visible. A running timer or a warning doesn't disappear just because it's late.

### Where to set it
Settings → General → Toasts → Quiet hours. Set the window there — wrapping past midnight (say 22:00–07:00) is handled correctly.

---

## Tipp mitteilungen-center - Notifications

**Title:** Where do I find all my alerts in one place?
**Hero:** none
**Tags:** Notifications, Center

In the Notification Center — search for "Notifications" or tap the island while it's showing an alert.

### What flows together
Three sources in one place:
- **Home Assistant** — persistent notifications
- **Alert entities** — smoke, leak, gas and other detectors
- **The card itself** — feedback on actions

### How it's ordered
By severity. Critical at the top, then warnings, then infos. Three tabs separate **Overview**, **Live** and **History** — nothing disappears; acknowledged items stay readable in the history.

### Good to know
The counter in the header tells you how many notifications there really are. The number on the island and the one in the Center come from the same source.

---

## Tipp mitteilungen-quittieren - Notifications

**Title:** How do I get rid of a notification?
**Hero:** none
**Tags:** Notifications, Actions

Three ways, depending on how final it should be.

### The three actions
- **Mark as read** — leaves the overview, stays in the history
- **Snooze (1 hour)** — for repeat offenders that aren't relevant right now
- **Acknowledge** — confirms the notification for good

### Where they are
Right in the preview when you hold the island — or in the Notification Center on every row.

### What happens behind the scenes
For real Home Assistant notifications the card calls the matching service, so they disappear in HA too. For alert entities only a local acknowledgement happens — the sensor itself is left alone, because only the underlying cause can reset it.

---

## Tipp kritische-meldung - Notifications

**Title:** What's the red bar at the very top?
**Hero:** none
**Tags:** Notifications, Critical

The critical banner. It only appears for the highest severity — water leak, smoke, gas.

### Why it's separate
Those must not get lost in a list. The banner lays itself over the head of the card and stays until you react.

### At night too
The banner is the one alert type that breaks through quiet hours — by default at least. The "always allow critical" switch sits in the quiet-hours settings and is on out of the box.

---

## Tipp ruhezeiten - Notifications

**Title:** How do I stop pop-ups at night?
**Hero:** none
**Tags:** Notifications, Quiet Hours

With quiet hours: Settings → General → Toasts → Quiet hours.

### What goes silent
- Toasts (the short pop-ins)
- The red critical banner — if you turn off the exception
- The island's resting face dims to clock-only

### What isn't lost
The notifications are still created. The counter fills up, the Center collects everything. Nothing is gone in the morning — it just didn't wake you.

### Past midnight
A window like 22:00–07:00 is handled correctly. You don't have to split it in two.

---

## Tipp live-was - Live Activities

**Title:** What counts as a "live activity"?
**Hero:** none
**Tags:** Live, Overview

Anything that's running right now and will end by itself.

### On by default
- **Timers** with countdown
- **Vacuums** while cleaning or returning to base
- **Covers** while moving
- **Media** while playing
- **Scripts and automations** while running

### Off by default
Lights, switches and climate. Those are continuous states — a light is "on" for hours, that isn't an activity. If you want them anyway, enable them deliberately.

### Why this is useful
Running things are otherwise invisible until you happen to open their detail view. The island shows them while they run — and clears itself when they're done.

---

## Tipp live-anpassen - Live Activities

**Title:** Can I choose what shows up as a live activity?
**Hero:** none
**Tags:** Live, Settings

Yes — Settings → General → Home Screen → Live activities.

### What's there
- **A master switch** for the whole feature
- **One toggle per source** — timers, vacuums, covers, media, scripts, automations
- **Opt-in for continuous states** — lights, switches, climate

### A word on dosage
Enabling lights sounds tempting but means the island practically never comes to rest. Try it, but expect to switch it back off.

---

## Tipp tippfehler - Search

**Title:** Do I have to spell device names exactly?
**Hero:** none
**Tags:** Search, Fuzzy

No. Search forgives typos and finds partial words too.

### What works
- **Typos** — "ligth" finds your light
- **Partial words** — "bed lamp" finds the "Bedroom Bed Lamp"
- **Two words** — "living room light" is read as room plus device type
- **Both languages** — "Lampe" and "light" reach the same target, whichever language the card is currently speaking

### How much you have to type
From the first letter a suggestion appears as ghost text; from the second real matches arrive. Display name, room name and entity ID are searched at once — the display name carries the most weight.

### Upper and lower case
Doesn't matter. The ghost text even adopts your own casing so the suggestion lines up pixel-perfectly over what you typed.

---

## Tipp geraet-fehlt - Search

**Title:** A device is missing from search — why?
**Hero:** none
**Tags:** Search, Troubleshooting

Usually because it isn't assigned to a room in Home Assistant.

### The most common cause
The card only loads entities that have an area assigned. A device without a room appears nowhere — not in search, not in a tile.

Fix it in Home Assistant: Settings → Devices & Services → open the device → assign an area. Then reload the card.

### The other candidates, in order
1. **A pattern hides it** — check Settings → Filter → Excluded patterns. The bundles are broad: "Batteries" matches everything on `*_battery`.
2. **Home Assistant hides it itself** — marked hidden, disabled, or as a diagnostic value. To check, briefly flip Settings → Filter → Visibility.
3. **A limit applies** — if Settings → Filter → Limits shows a number instead of 0, only that many entities load.
4. **It's currently unreachable** — entities in state "unavailable" or "unknown" are skipped.

### To cross-check
Does Home Assistant find the device in its own search? If not, it isn't the card.

---

## Tipp raum-filter - Search

**Title:** How do I see only devices from one room?
**Hero:** none
**Tags:** Search, Filter

Type the room name into the search field — the card offers it as ghost text.

### Accepting the suggestion
- **Desktop** — Tab key or right arrow
- **Phone** — tap the suggestion or the confirm button on the right of the field

The room becomes a blue chip and the list narrows to that room.

### Combining
Chips stack: first "Kids' room", then "lamp" — what's left are the lamps in the kids' room. The card switches to the matching category on its own.

### The other way
The filter bar under the search field offers the same filters to tap, without typing.

---

## Tipp chips-verstehen - Search

**Title:** What do the coloured chips in the search field mean?
**Hero:** none
**Tags:** Search, Chips

Chips are active filters. The colour tells you the kind.

### The three colours
- **Blue** — a room (kitchen, bath, living room)
- **Purple** — a device type (light, switch, climate)
- **Green** — a sensor type (temperature, motion, energy)

### Removing
One tap selects the chip, a second removes it — the same pattern as recipients in iOS Mail. On the desktop, backspace works too when the field is empty.

---

## Tipp kategorien - Search

**Title:** What are Devices, Sensors, Actions and Custom?
**Hero:** none
**Tags:** Search, Categories

Four sections, four views on your home.

### What goes where
- **Devices** — everything you can switch: lights, switches, climate, covers, media players, locks, vacuums
- **Sensors** — everything that measures: temperature, humidity, motion, energy, door contacts
- **Actions** — scenes, scripts, automations
- **Custom** — the built-in apps: calendar, tasks, news, schedules, settings, and your own device views

### Automatic switching
Create a sensor chip while you're in "Devices" and the card jumps to "Sensors" by itself — otherwise the list would be empty.

---

## Tipp ansicht-wechseln - Search

**Title:** How do I switch between grid and list view?
**Hero:** none
**Tags:** Search, View

Use the symbol next to the search field.

### The difference
- **Grid** — large tiles with icon, name and state. Calmer, good for tapping.
- **List** — compact rows, more devices at a glance, with a switch and a "⋯" button right in the row.

### Good to know
Your choice is saved and survives a reload. How many tiles fit side by side is set under Settings → Appearance → Columns (4, 5 or 6).

---

## Tipp favoriten-anlegen - Search

**Title:** How do I set favorites?
**Hero:** none
**Tags:** Search, Favorites

Open a device and tap the **♥ heart** at the top right of the detail header.

### Where they show up
- In the **Favorites filter** in search
- In the **Favorites widget** on the start screen

### Removing
Same path — tap the heart again.

### Why it's worth it
The handful of devices you genuinely use daily are then always one tap away, instead of buried in the full list.

---

## Tipp vorschlaege - Search

**Title:** Why does the card suggest certain devices?
**Hero:** none
**Tags:** Search, Suggestions

Because it learns from your taps — locally in your browser, without anything leaving the device.

### How it learns
- What you use often moves up
- What you see and ignore loses weight
- Old patterns fade on their own over time

### Learning speed
Settings → General → Suggestions. Three steps set how quickly suggestions adapt — from "slow but steady" to "reacts immediately".

### Resetting
Same place: "Reset learning data" clears every learned pattern and tells you how much was deleted.

---

## Tipp zeit-sortierung - Search

**Title:** Can I see what changed in the house most recently?
**Hero:** none
**Tags:** Search, Sorting

Yes — with time sorting. It adds a clock button to the toolbar.

### What it does
When active it groups the device list by **recent activity** instead of by room. Whatever was switched last sits on top.

### Three profiles
- **Fine** — Just now · Last 15 min · Last 30 min · Last hour
- **Standard** — Last 15 min · Last hour
- **Coarse** — Last hour · Last 6 hours · Last 12 hours

Everything beyond the last window falls into "Today" or "Older".

### Combines with the rest
Time sorting works on top of the category and area filters. "Lights, by activity" is possible.

### Turning it on
Settings → Appearance → Filter → Sort by time.

---

## Tipp quick-control - Quick Control

**Title:** How do I switch a light with a single tap?
**Hero:** none
**Tags:** Quick Control, Light

With Quick Control the device icon on the card becomes the switch itself.

### Turning it on
Settings → Appearance → Quick Control. It's off out of the box — it noticeably changes what tapping does, so the choice is yours.

### After that
- **Tap the icon** — switches immediately
- **Tap the card next to it** — still opens the detail view

### Feedback
On the phone there's a short haptic pulse. The icon shrinks slightly while pressed and overshoots its size briefly after firing — the only place in the card that vibrates at all.

### Good to know
System entities like news or weather are unaffected — a tap always opens their view. So are device types without quick control.

---

## Tipp quick-control-halten - Quick Control

**Title:** Why do I have to press and hold for covers?
**Hero:** none
**Tags:** Quick Control, Safety

By design. A wrongly switched light is fixed in a second — an accidentally opened cover or door lock isn't.

### The rule
- **Risky direction** (open, unlock) — hold for about a second. An amber ring fills as confirmation.
- **Safe direction** (close, lock) — a simple tap.

### Why asymmetric
Because the cost of undoing a mistake is asymmetric. Closing takes a second. An unnoticed open garage door costs considerably more.

### Cancelling
Let go before the ring is full — nothing happens.

---

## Tipp quick-control-domains - Quick Control

**Title:** Can I choose which device types get icon switching?
**Hero:** none
**Tags:** Quick Control, Settings

Yes, for each device type individually.

### The three modes
- **Off** — the icon opens the detail view as usual
- **Tap** — one tap switches immediately
- **Hold** — a tap isn't enough, it takes a sustained press

### The defaults
**Tap:** lights, switches, fans, climate, media players, vacuums, humidifiers, scenes, scripts, automations.
**Hold:** covers, locks, valves, sirens.

### What the devices do
Mostly a plain toggle. A media player pauses or resumes, a lock flips to the opposite state, a vacuum starts — or returns to base if it's already cleaning.

### Where
Settings → Appearance → Quick Control. The master switch at the top, the list of types below.

---

## Tipp listen-aktionen - Quick Control

**Title:** What's behind the "⋯" in list view?
**Hero:** none
**Tags:** Quick Control, List

Tapping it expands the device's most important controls right under the row.

### What appears
- **Light** — brightness steps as a button row
- **Cover** — open, stop, close plus position presets
- **Climate** — operating modes

They're exactly the same controls as the detail view, just inline in the list.

### Why that's handy
For "light at 30 %" you neither open the detail view nor have to hit a slider. Two taps, done.

---

## Tipp helligkeit - Control

**Title:** How do I dim a light?
**Hero:** none
**Tags:** Control, Light

Drag the circular slider in the detail view. The value in the middle counts along live.

### Handling
- **Drag** — anywhere on the ring, not just the handle
- **Release** — sets the value
- **The power button** at the top of the circle — remembers the last brightness and restores it when you switch back on

### On the phone
The ring's hit area is deliberately generous. You don't have to be exactly on the line.

---

## Tipp farbtemperatur - Control

**Title:** How do I change the light colour?
**Hero:** none
**Tags:** Control, Light

Via the mode buttons under the slider.

### The modes
- **Brightness** — the default
- **Colour temperature** — the circle becomes a warm-to-cool dial with a matching gradient
- **Effects** — if your light has any

### For colour bulbs
If the light supports real colours a colour wheel appears as well. The card asks the device what it can do and only shows what's actually supported.

---

## Tipp klima - Control

**Title:** How do I set the heating?
**Hero:** none
**Tags:** Control, Climate

The circular slider sets the target temperature, the buttons below set the mode.

### What you control
- **Target temperature** — on the ring, in your device's step size
- **Mode** — heat, cool, auto, off
- **Presets** — eco, comfort, boost, where your thermostat reports them
- **Fan speed and swing** — on air conditioners, expandable right in the row

### Good to know
The current room temperature sits in small type under the target. If your thermostat reports a restricted range, the card clamps the slider to what the device will accept.

---

## Tipp cover-position - Control

**Title:** How do I move a cover to a specific position?
**Hero:** none
**Tags:** Control, Covers

The circular slider sets the position in percent — 0 is closed, 100 is open.

### The buttons below
Fully open, stop, fully closed. Stop takes effect immediately, even mid-travel.

### On blinds
If your device can tilt the slats it gets a second dial for that. Position and tilt are separate.

### While it moves
A moving cover appears as a live activity on the island — so you can see it's under way from the start screen too.

---

## Tipp kontext-tab - Control

**Title:** Where do I find scenes that match a device?
**Hero:** none
**Tags:** Control, Scenes

In the second tab of the detail view: "Context".

### What's there
Every scene, script and automation that touches this device — found automatically, sorted by relevance.

### The filters
Three tabs separate **Actions**, **Favorites** and **Surroundings**. "Surroundings" shows what happens in the same room even when it doesn't touch this device directly.

### Running one
One tap starts the scene. A brief pop-in confirms it worked — or reports the error if it didn't.

---

## Tipp verlauf - Control

**Title:** Where do I see a device's history?
**Hero:** none
**Tags:** Control, History

In the "History" tab of the detail view.

### The periods
Four buttons: **D** (day), **W** (week), **M** (month), **Y** (year). These are real calendar periods, not rolling windows — "W" is this week, not the last seven days.

### Paging
The arrows left and right jump one period back or forward. Forward stops at the present. The calendar icon lets you pick a free range instead.

### What else is in there
- **Activities** — this device's events as a chronological list, with the high and low of each period
- Tapping an event jumps back into the chart, at exactly that point

### How far back
Sensors with long-term statistics (meter readings, measurements) give gap-free curves across months. Everything else only reaches as far as your Home Assistant keeps raw data — often around ten days.

---

## Tipp musik - Control

**Title:** How do I control my music?
**Hero:** none
**Tags:** Control, Music

Open a media player. If Music Assistant is running you get the full panel.

### What the panel does
- **Queue** — view and clear
- **Library search** — tracks, albums, artists
- **Speaker switching** and grouping
- **Text-to-speech** with engine and language selection
- **Favorite** and **radio mode**

### The dials
Volume and playback position sit as two rings on the circular slider — both draggable.

### The background
The current track's cover becomes the background of the view.

---

## Tipp bento-anpassen - Home Screen

**Title:** Can I rearrange the start screen?
**Hero:** none
**Tags:** Home Screen, Bento

Yes — Settings → General → Home Screen.

### What you decide
- **Which app sits in which slot** (W1 large, W2 top right, W3/W4 split at the bottom)
- **The layout** of the tile surface
- **Whether there's a start screen at all** — switched off, the card opens straight into the search list

### How to pick
Tap a slot and choose the entity. The preview shows immediately how it looks.

---

## Tipp bento-slider - Home Screen

**Title:** How do I switch between weather, news and appointments?
**Hero:** none
**Tags:** Home Screen, Widgets

The large widget at the top right is a carousel.

### How it moves
It cycles through weather, calendar, tasks and news on its own. Swiping switches immediately; the dots below show the position.

### It remembers the spot
Open a news article and come back and the carousel is still on news — not back at the beginning.

### Jumping straight in
Tapping an entry in the carousel takes you exactly there: an appointment into the calendar on that day, an article into the reader.

---

## Tipp begruessung - Home Screen

**Title:** Can I change or turn off the greeting?
**Hero:** none
**Tags:** Home Screen, Greeting

Both — Settings → General → Status & Greetings.

### What it does
The greeting adapts to the time of day and uses your name where Home Assistant knows it. Custom texts are possible.

### Turning it off
One switch. The greeting is purely decorative — nothing behaves differently without it.

---

## Tipp termin-anlegen - Calendar

**Title:** How do I create an appointment?
**Hero:** none
**Tags:** Calendar, Events

Open the calendar — via search or the sidebar — then the plus button.

### The dialog
- **Title** typed, or grab a quick chip (appointment, meeting, birthday, doctor, trip)
- **Date and time** on the wheels
- **All-day** as a switch
- **Location** and **description** as their own sub-views
- **Calendar** picker, if you have several

### Where it lands
Straight into your Home Assistant calendar, through the native interface. No middle service, no cloud of the card's own.

### Editing and deleting
Tap the appointment, change it, save. Deleting asks twice — the second tap confirms.

---

## Tipp termin-wiederholen - Calendar

**Title:** How do I create recurring events?
**Hero:** none
**Tags:** Calendar, Recurrence

Tap the "Repeat" row in the dialog.

### The patterns
Never, daily, weekly, monthly, yearly.

### For more complex rules
Events from other calendars can carry more elaborate recurrences — "every second Friday" for instance. The card shows those as "Custom" and lets you edit the rest of the event without breaking the rule.

---

## Tipp kalender-ansichten - Calendar

**Title:** How do I switch between day, week, month and year?
**Hero:** none
**Tags:** Calendar, Views

Via the buttons along the top.

### What each shows
- **Day** — hour grid with events as blocks
- **Week** — seven columns, same logic
- **Month** — a grid with dots per event, today as a red circle
- **Year** — twelve mini-months to jump between

### Hiding views
Never use the year view? Hide it: Calendar → Settings → Visible views.

---

## Tipp kalender-quellen - Calendar

**Title:** Which calendars does the card show?
**Hero:** none
**Tags:** Calendar, Sources

Every calendar integration in your Home Assistant — CalDAV, Google, local calendars.

### Found automatically
The card collects all `calendar.*` entities by itself and blends the events, colour-coded by source.

### Choosing
Calendar → Settings → Calendars. Switch off individual sources you don't want in the card.

### New events
In those same settings you set which calendar a new event goes into by default.

---

## Tipp aufgabe-anlegen - Tasks

**Title:** How do I create a task?
**Hero:** none
**Tags:** Tasks, Create

Open Tasks, plus button, type a title.

### In the same dialog
- **Pick a list**
- **Set a due date**
- **Add a note** — with templates if you've set any up

### Completing
One tap on the circle at the left. The task gets struck through and leaves the list depending on your filter.

---

## Tipp faelligkeit - Tasks

**Title:** How do I set a due date?
**Hero:** none
**Tags:** Tasks, Due Date

Tap the "Due" row in the dialog and set date and time on the wheels.

### What happens then
- **Due soon** — the task shows its time in the row
- **Overdue** — the whole row turns red, with a note of how long

### Why so loud
Overdue things should stand out without you having to look for them. On the start screen the tasks widget shows the same colour.

---

## Tipp aufgaben-listen - Tasks

**Title:** How do I switch between multiple lists?
**Hero:** none
**Tags:** Tasks, Lists

Via the filter pills above the tasks.

### Two rows
- **Top** — status: open, done, overdue
- **Bottom** — your lists

### They combine
"Open" plus "shopping list" shows exactly the open items of that one list.

### Where the lists come from
The card automatically collects every task integration in your Home Assistant — local to-do lists as well as connected services.

---

## Tipp schedule-anlegen - Schedules

**Title:** How do I schedule a device to switch automatically?
**Hero:** none
**Tags:** Schedules, Automation

Open the device, "Schedule" tab, plus button.

### The editor
- **Time** on the wheel
- **Action** — on, off, brightness, temperature, position, depending on device type
- **Weekdays** as a chip row
- **Device settings** for details like colour or mode

### Requirement
The Scheduler integration (`nielsfaber/scheduler-component`) must be installed in Home Assistant. Without it the tab shows a note instead of the editor.

### Editing
Schedules expand and change right in the list — no sub-view needed.

---

## Tipp schedule-wochentage - Schedules

**Title:** How do I set different times for weekdays and weekends?
**Hero:** none
**Tags:** Schedules, Weekdays

With two schedules: one for Mon–Fri, one for Sat–Sun.

### The selection
The weekday chips in the editor are individually tappable. One tap selects, a second deselects.

### Pause instead of delete
If you don't need a schedule for a while, switch it off rather than deleting it. It keeps all its settings.

---

## Tipp schedule-uebersicht - Schedules

**Title:** Where do I see all schedules at once?
**Hero:** none
**Tags:** Schedules, Overview

Search for "Schedules" or open the overview from the sidebar.

### What's there
Every timer and schedule across all devices, with domain badges, time and weekdays.

### Filters
All, timers only, schedules only.

### Jumping
Tapping an entry takes you to the device it belongs to.

---

## Tipp energie-einrichten - Energy

**Title:** How do I set up the energy dashboard?
**Hero:** none
**Tags:** Energy, Setup

Search "Add devices" and pick Energy Dashboard.

### What the wizard does
It reads your Home Assistant energy configuration and takes over whatever it finds — grid import, export, solar, battery, tariffs.

### What you add
Whatever HA doesn't know, you pick by hand. Every row opens a searchable sensor picker.

### Afterwards
The dashboard appears as its own device in your search and can be placed as a start-screen tile.

---

## Tipp energie-werte - Energy

**Title:** What do "Auto" and "Manual" mean on the energy values?
**Hero:** none
**Tags:** Energy, Sensors

They tell you where a sensor assignment came from.

### The two pills
- **Auto** — the sensor was taken automatically from your Home Assistant energy settings
- **Manual** — you assigned it yourself

### How the values are grouped
By type: power (W/kW), energy (Wh/kWh), battery, tariffs, plus gas and water.

### If a value looks wrong
Tap the row and pick a different sensor. The ⓘ next to each value explains exactly what's meant to be measured — useful when several sensors have similar names.

---

## Tipp energie-lesen - Energy

**Title:** What do the circles in the energy dashboard mean?
**Hero:** none
**Tags:** Energy, Overview

Each circle is an energy source or consumer: grid, solar, battery, home.

### What you see
The numbers are live. When power flows the circle shows the current draw; the direction tells you whether you're importing or exporting.

### Adjusting
In the dashboard's settings you decide which value sits in which circle.

### The charts
Below the circles are trend charts for day, week, month and year — from Home Assistant's long-term statistics, so gap-free even across months.

---

## Tipp geraete-bauen - Custom Devices

**Title:** Can I build my own device views — without code?
**Hero:** none
**Tags:** Custom Devices, Builder

Yes. Search "Add devices" and pick a type.

### The types
- **Energy Dashboard** — for power, solar, battery
- **3D printer** — print status, filament, temperatures
- **Weather station** — forecast and readings
- **Universal** — for everything else

### The flow
Pick a type, assign sensors, name it, done. The card builds a complete detail view with hero, charts and sensor lists from that.

### Editable anytime
No YAML, no config file. Everything reachable again through the management screen in the Integration area.

---

## Tipp hero-anzeige - Custom Devices

**Title:** What is the large display at the top of a self-built device?
**Hero:** none
**Tags:** Custom Devices, Hero

The hero — the circle at the very top of the detail view, for the device's most important value.

### What you choose
Up to five values. Several rotate as a slideshow.

### Pictures instead of numbers
Entities with an image or camera badge render as a photo instead of a value. That's how a 3D printer gets its camera feed into the hero.

### Order
Use the ↑ and ↓ arrows on a selected row to set the order the slideshow runs in.

---

## Tipp charts-sensoren - Custom Devices

**Title:** Why does the curve reach further back for some sensors than others?
**Hero:** none
**Tags:** Custom Devices, Charts

Because there are two different data sources — and the card tells you by colour which one applies.

### The three badges
- **Cumulative (green)** — meter readings. Full statistics for day, week, month and year, straight from Home Assistant.
- **Measurement (blue)** — readings like temperature. Full statistics too.
- **History (orange)** — sensors without a `state_class`. They fall back to plain state history.

### The practical difference
Green and blue give gap-free long-term curves. Orange only reaches back as far as your Home Assistant keeps raw data — often ten days.

### Where you see it
When editing a Universal device under "Charts". The badge sits next to each sensor.

---

## Tipp sichtbare-entitaeten - Custom Devices

**Title:** How do I hide individual values of a device?
**Hero:** none
**Tags:** Custom Devices, Visibility

When editing the device under "Visible entities".

### How it's laid out
One toggle per entity, grouped into Controls, Sensors, Diagnostics and Misc. On large devices the search above helps.

### What switching off means
The entity disappears from the card — in Home Assistant it stays untouched. It's purely a display decision.

### What it's good for
A modern printer or inverter often brings thirty diagnostic values. Five of them interest you. The rest don't need to be visible.

---

## Tipp wallpaper - Appearance

**Title:** How do I set my own background image?
**Hero:** none
**Tags:** Appearance, Background

Settings → Appearance → Wallpaper.

### How it normally looks
Without a custom image, the card lets your **Home Assistant dashboard wallpaper** show through its glass panels. Enabling your own image replaces it.

### Two routes
- **Image URL** — put the file in `config/www/` and enter it as `/local/filename.jpg`. An `http(s)://…` URL works too.
- **Gallery** — browse thumbnails from your Home Assistant media folder and tap one.

### Good to know
The appearance sliders (brightness, blur, contrast, saturation, grayscale) still apply — to your own image as well.

---

## Tipp hintergrund-videos - Appearance

**Title:** How do I get videos behind the device view?
**Hero:** none
**Tags:** Appearance, Videos

Put MP4 files named `{domain}_{state}.mp4` into your video folder.

### Examples
- `light_on.mp4` and `light_off.mp4`
- `cover_open.mp4` and `cover_closed.mp4`
- `climate_on.mp4`, `fan_on.mp4`, `switch_on.mp4`

### How it plays
The video plays **once** when the detail view opens — after that the last frame stays. No permanent loop eating performance.

### Placeholders
Files named `default_1.mp4` through `default_10.mp4` are picked at random for devices without their own video.

### Turning it on
Settings → Appearance → Animations. Desktop and mobile switch separately — videos cost data and battery on the phone.

### A starter pack
Over thirty ready-made clips live in the GitHub repo under `media/videos/`.

---

## Tipp video-ordner - Appearance

**Title:** Where exactly do the video files have to live?
**Hero:** none
**Tags:** Appearance, Videos

In one of two places — the card checks both.

### Option A — the www folder
Path in settings: `/local/videos`. The files then live in `config/www/videos/`. (`/local/…` is Home Assistant's alias for `config/www/…`.)

### Option B — the media folder
Upload the videos through the Home Assistant media browser into a folder named exactly like the last part of your path — so `videos`. The card discovers it across your media sources, without needing `www` access.

### The order
The www path is checked first, then the media folder. Either works as long as the folder name matches.

### If no video appears
Almost always a typo in the filename. Only exactly-named files are found.

---

## Tipp liquid-glass - Appearance

**Title:** What is Liquid Glass?
**Hero:** none
**Tags:** Appearance, Design

A glass effect for the controls: refraction, sheen and colour fringe, as if real glass sat over the background.

### Where
Settings → Appearance → Design → Liquid Glass.

### What's adjustable
Fourteen dials — frost, refraction, colour fringe, tint, bend, sheen and sheen angle, specular, glow, brightness. Each with its own explanation behind the ⓘ.

### For the impatient
The default looks good without touching a single dial. The fourteen are there for fine-tuning, not as homework.

### On Safari
True refraction is a Chromium capability. On Safari and iOS a frost-and-tint mode takes over that comes very close.

---

## Tipp hinweise - Control

**Title:** Can the card warn me when a value gets too high?
**Hero:** none
**Tags:** Control, Hints

Yes — with hints. They watch a value and speak up when it crosses a limit or stays in one state for too long.

### Where to set them up
In the detail view of a watchable device, in the "Context" tab under "Hints".

### Two kinds
- **Threshold** — fires when a reading goes above or below a limit
- **Duration** — fires when a state lasts too long, like a window that has been open for two hours

### So it doesn't flutter
A small margin applies around each limit so a value hovering right on the threshold doesn't fire every minute — two points on percentages, half a degree on temperatures.

### An honest limitation
Hints are only evaluated while a dashboard with the card is open. Anything safety-critical belongs in a Home Assistant automation, not in the card.

---

## Tipp spalten - Appearance

**Title:** How do I change the number of cards per row?
**Hero:** none
**Tags:** Appearance, Grid

Settings → Appearance → Columns: four, five or six.

### The trade-off
Fewer columns means larger tiles and more calm. More columns means more overview when you have many devices.

### On the phone
There the screen width decides. The setting applies to tablet and desktop.

---

## Tipp entitaeten-verstecken - Filter

**Title:** How do I hide devices I never need?
**Hero:** none
**Tags:** Filter, Hide

Settings → Filter → Excluded patterns. "Filter" is one of the four main sections of the settings, along the top.

### The wildcards
- `*` stands for any number of characters — `sensor.*` matches all sensors
- `?` stands for exactly one character

### Examples
- `sensor.temp_*` — all temperature sensors with that prefix
- `binary_sensor.motion_*` — all motion sensors
- `*_unavailable` — anything ending in "_unavailable"

### The live preview
As you type, the card shows which entities the pattern would currently match. No flying blind.

### Undoing
Delete the pattern again, done. Sensible default patterns are pre-filled on first launch — those are just as changeable.

---

## Tipp schnellauswahl - Filter

**Title:** Are there ready-made filter bundles?
**Hero:** none
**Tags:** Filter, Templates

Yes — the suggestion chips above the input field under Settings → Filter.

### The bundles
- **Updates** — Home Assistant's update entities
- **Batteries** — charge levels and battery states
- **Signal** — radio quality, link strength
- **System sensors** — uptime, last boot, connectivity

### How it works
Tap a bundle and its whole pattern set lands in your list. A checkmark shows a bundle is already active.

### What it's for
Typical clean-up cases in one tap instead of ten lines of manual work. Individual patterns from a bundle can be deleted again normally afterwards.

---

## Tipp versteckte-anzeigen - Filter

**Title:** How do I see devices Home Assistant has hidden?
**Hero:** none
**Tags:** Filter, Visibility

Settings → Filter → Visibility.

### Two switches
- **Hide hidden entities** — whatever is marked "hidden" in Home Assistant
- **Hide diagnostic and disabled entities** — technical values and switched-off entries

Both are on out of the box. The card respects what you decided in Home Assistant.

### When you need them
When setting up a new device and a sensor stubbornly won't show. Switch off, find it, switch back on.

### The more common reason
When a device is missing it's usually not this, but that it isn't assigned to a room in Home Assistant. See the tip "A device is missing from search".

---

## Tipp limits - Filter

**Title:** The card loads slowly — what can I do?
**Hero:** none
**Tags:** Filter, Performance

Settings → Filter → Limits.

### Maximum number of entities
Caps how many entities get loaded at all — in steps of fifty up to 1000. **0 means unlimited** and is the default. With several thousand entities a limit speeds up startup noticeably.

### What else helps
- Excluded patterns for everything you never search for (batteries, signal strengths, update entities)
- Turning videos off on mobile
- Fewer Bento tiles carrying live data

### The side effect
Fewer loaded entities means not just a faster start but less noise in search.

---

## Tipp filter-toolbar - Filter

**Title:** Can I tidy up or hide the filter bar?
**Hero:** none
**Tags:** Filter, Toolbar

Yes — Settings → Appearance → Filter.

### What you control
- **Master switch** — the whole filter button on or off. Off means a tidy toolbar with no filter controls.
- **By categories** and **By areas** — show or hide those two dimensions individually
- **Active count** — a badge on each chip showing how many devices of that group are currently on ("Lights 4")

### The counter in practice
It answers "is a light still on somewhere?" without a single tap.

### Not to be confused
This is the toolbar. What gets loaded in the first place lives under Settings → **Filter** — a section of its own.

---

## Tipp datenschutz - Privacy

**Title:** What does the card send to the internet?
**Hero:** none
**Tags:** Privacy, Security

None of your data.

### What doesn't happen
- No telemetry, no tracking, no analytics services
- No cloud connection, no account
- No credentials in browser storage

### The only external fetches
Two markdown files from GitHub — the changelog and these very tips. No credentials, none of your content.

### Where your data lives
Settings and learned patterns in your browser's local storage. Everything else in your Home Assistant.

### To verify
The card ships as a single file — you can grep it yourself. The full security report lives in the repo under `docs/SECURITY.md` and is re-checked for every release.

---

## Tipp sprache - Help

**Title:** How do I set the card's language?
**Hero:** none
**Tags:** Help, Language

Settings → General → App language.

### Independent of Home Assistant
The setting applies to the card only. Card in English with a German Home Assistant works fine.

### What follows along
Menus, labels, date and weekday names — and these tips.

### What else lives there
The same section sets **currency** (for energy costs) and **time format** (24 or 12 hours). Time format applies everywhere: charts, activities, schedules, the island.

### More languages
Currently German and English. Dutch is planned next.

---

## Tipp cache-leeren - Help

**Title:** The card shows stale data — what now?
**Hero:** none
**Tags:** Help, Cache

Settings → About → Clear cache.

### What that empties
The caches for search and suggestions. Your settings, favorites and self-built devices stay.

### The big hammer next to it
"Reset all data" really deletes everything — settings, favorites, learned patterns, custom devices. Two confirmations, for good reason.

### If that doesn't help
Reload the page. Then check the Home Assistant connection — does HA itself still show current values?

---

## Tipp changelog - Help

**Title:** Where do I see what changes with updates?
**Hero:** none
**Tags:** Help, Updates

Search for "Changelog" or tap the matching tile on the start screen.

### What's there
Every version with title, date and a thorough description of what changed — and often why.

### Search and filter
Full-text search across all entries, plus filters by topic tags.

### Your version
The currently installed version sits at the top and under Settings → About.

---

## Tipp toasts - Help

**Title:** Can I customise the little confirmation pop-ins?
**Hero:** none
**Tags:** Help, Toasts

Yes — Settings → General → Toasts.

### Three things
- **When** — which events trigger a pop-in
- **Position** — where on the screen
- **Duration** — how long it stays

### And quiet hours
The same section holds the nightly window in which nothing pops up at all. See the quiet-hours tip.

---
