# Media

This folder collects example media for Fast Search Card — background videos for the Detail View, GIFs and screenshots used in the project README.

```
media/
├── README.md      ← you are here
├── videos/        ← MP4 background videos (ready to use)
│   ├── weather/           ← weather state backgrounds (sunny, rainy, …)
│   └── system-entities/   ← showcase clips for system entities
├── gifs/          ← animated previews + logo used in the project README
└── images/        ← static hero screenshots used in the project README
```

The `gifs/` folder contains the animated logo (`logo.gif`) and three Detail-View previews (`climate.gif`, `light.gif`, `music.gif`).

The `images/` folder contains the four hero screenshots (`fsc-1.png` through `fsc-4.png`) — Detail View, Todos, Bento Start, Devices grid.

---

## Background videos

The Detail View can play a looped, muted video behind the controls whenever it finds one for the current entity. No configuration required — drop a file with the right name in the right folder and the card picks it up.

### Where the card looks

By default: **`/local/fast-search-videos/`** in your Home Assistant.

That maps to: `/config/www/fast-search-videos/` on your HA filesystem.

The path is configurable in **Settings → Appearance → Detail-View videos path** if you prefer a different folder.

### Naming convention

The card walks a six-step fallback hierarchy when it looks for a video. Most specific wins; if nothing matches, it falls back to the entity icon.

```
1. {domain}_{device_class}_{state}.mp4   ← e.g. binary_sensor_motion_on.mp4
2. {domain}_{state}.mp4                  ← e.g. light_on.mp4
3. {domain}_{device_class}.mp4           ← e.g. binary_sensor_motion.mp4
4. {domain}.mp4                          ← e.g. light.mp4
5. default_1.mp4 … default_10.mp4        ← random pick from a pool
6. icon background
```

Most users only need step 2 or step 3.

The card normalises every Home Assistant state to one of four buckets — `on`, `off`, `open`, `closed` — before looking for a matching file. That means a single pair of clips per domain is usually enough.

| HA state | Becomes | Domains it applies to |
|---|---|---|
| `on`, `playing`, `heat`, `cool`, `auto`, `locked`, `home`, `active`, `armed`, `cleaning`, `docked` | **`on`** | most domains |
| `off`, `idle`, `paused`, `unlocked`, `away`, `inactive`, `disarmed`, `standby` | **`off`** | most domains |
| `open`, `opening` | **`open`** | `cover`, `door`, `window` |
| `closed`, `closing` | **`closed`** | `cover`, `door`, `window` |

Anything else falls back to `off`.

### Included in this folder

Sixteen clips, ready to drop into `/config/www/fast-search-videos/`:

| Domain | Files | Plays when |
|---|---|---|
| `light` | `light_on.mp4`, `light_off.mp4` | a light is on / off |
| `switch` | `switch_on.mp4`, `switch_off.mp4` | a switch is on / off |
| `fan` | `fan_on.mp4`, `fan_off.mp4` | a fan is on / off |
| `climate` | `climate_on.mp4`, `climate_off.mp4` | climate is heating/cooling/auto / off |
| `media_player` | `media_player_on.mp4`, `media_player_off.mp4` | a media player is playing / idle |
| `lock` | `lock_on.mp4`, `lock_off.mp4` | a lock is locked / unlocked |
| `cover` | `cover_open.mp4`, `cover_closed.mp4` | a cover is open / closed |
| `vacuum` | `vacuum_on.mp4`, `vacuum_off.mp4` | a vacuum is cleaning or docked / returning or idle |

Roughly 2 MB each. Plug-and-play.

### How to use

1. Drop the MP4 files into `/config/www/fast-search-videos/` on Home Assistant.
2. Open any entity's Detail View. If a matching video exists, it plays automatically.

If no video matches, the Detail View falls back to the animated icon.

### Suggested format

- **Container:** MP4 (H.264)
- **Resolution:** 1280×720 or smaller
- **Duration:** 5–15 seconds (looped)
- **Audio:** stripped (the card mutes everything anyway)
- **Size:** under 2 MB per clip if possible

---

## Weather backgrounds

`media/videos/weather/` holds Detail-View backgrounds for `weather.*` entities. Unlike the on/off domains, weather keeps its descriptive state verbatim in the filename — so the card looks for `weather_sunny.mp4`, `weather_rainy.mp4`, etc.

Nine clips, roughly 2-3 MB each:

| File | Plays when the weather state is |
|---|---|
| `weather_sunny.mp4` | `sunny` |
| `weather_cloudy.mp4` | `cloudy` |
| `weather_partlycloudy.mp4` | `partlycloudy` |
| `weather_rainy.mp4` | `rainy` |
| `weather_pouring.mp4` | `pouring` |
| `weather_snowy.mp4` | `snowy` |
| `weather_fog.mp4` | `fog` |
| `weather_windy.mp4` | `windy` |
| `weather_lightning.mp4` | `lightning` |

Two ways to install them (both work as of v1.1.1927):

- **Keep the subfolder:** copy `weather/` into `/config/www/fast-search-videos/weather/`. The card looks there directly.
- **Or flatten:** drop the `weather_*.mp4` files straight into `/config/www/fast-search-videos/`.

---

## Device-class backgrounds

Five clips that ride on the new device-class layer in the fallback hierarchy. One MP4 per device class covers every entity in that class — no matter how many motion sensors or window contacts you have, they all use the same video.

| File | Plays when device_class is |
|---|---|
| `binary_sensor_motion.mp4` | `motion` (motion sensors) |
| `binary_sensor_door.mp4` | `door` (door contacts) |
| `binary_sensor_window.mp4` | `window` (window contacts) |
| `binary_sensor_safety.mp4` | `safety` (smoke, gas, leak, tamper, etc.) |
| `sensor_humidity.mp4` | `humidity` (humidity sensors) |

Same flat folder as the on/off domain backgrounds — drop them straight into `/config/www/fast-search-videos/`.

Want another device class? Copy any of these files and rename it. The pattern is `{domain}_{device_class}.mp4` — full list of `device_class` values at [developers.home-assistant.io](https://developers.home-assistant.io/docs/core/entity/binary-sensor/#available-device-classes).

---

## System-entity backgrounds

`media/videos/system-entities/` holds short clips for the system-entity apps (Calendar, Todos, News, Energy Dashboard, …). They double as project-README/social footage **and**, since v1.1.1927, as Detail-View backgrounds: the card looks in the `system-entities/` subfolder and maps each app's internal domain to its file name (the file names differ from the domains).

Copy `system-entities/` into `/config/www/fast-search-videos/system-entities/` to use them as backgrounds.

Nine clips, roughly 2-3 MB each — file ← internal domain it plays for:

| File | Internal domain | Shows |
|---|---|---|
| `calendar.mp4` | `calendar` | Calendar app — day/week/month/year views |
| `changelog.mp4` | `versionsverlauf` | Version-history viewer |
| `energy.mp4` | `energy_dashboard_device` | Energy dashboard with real-time charts |
| `integration.mp4` | `integration` | Device Builder (custom views without YAML) |
| `news.mp4` | `news` | News reader (companion to `fast-news-reader`) |
| `schedules.mp4` | `all_schedules` | All-Schedules overview |
| `settings.mp4` | `settings` | In-card settings hub |
| `tasks.mp4` | `todos` | Todos app aggregating every `todo.*` backend |
| `tips.mp4` | `tipps` | Tips system entity — rotating tips with markdown detail |

---

## Why this folder exists in the repo

A small starter pack lives here so the Detail View has something to play out of the box, and so the README/social posts have ready-made demo footage of every app.

If you want to contribute more clips, keep individual files small (target under 2 MB, hard ceiling 5 MB) and open a PR. For larger personal libraries, a companion repo (the `fast-news-reader` model) is the better home.
