# Media

This folder collects example media for Fast Search Card — background videos for the Detail View, GIFs and screenshots used in the project README.

```
media/
├── README.md      ← you are here
├── videos/        ← MP4 background videos (ready to use)
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

```
{domain}_{state}.mp4
```

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

## System-entity showcase videos

`media/videos/system-entities/` collects short demo clips of the system-entity apps in motion. These are **not** Detail-View backgrounds — they show the apps themselves (Calendar, Todos, News, Energy Dashboard, etc.) and are intended for the project README, social posts, and the changelog tile.

Eight clips, roughly 2-3 MB each:

| File | Shows |
|---|---|
| `calendar.mp4` | Calendar app — day/week/month/year views |
| `changelog.mp4` | Version-history viewer |
| `energy.mp4` | Energy dashboard with real-time charts |
| `integration.mp4` | Device Builder (custom views without YAML) |
| `news.mp4` | News reader (companion to `fast-news-reader`) |
| `schedules.mp4` | All-Schedules overview |
| `settings.mp4` | In-card settings hub |
| `tasks.mp4` | Todos app aggregating every `todo.*` backend |

---

## Why this folder exists in the repo

A small starter pack lives here so the Detail View has something to play out of the box, and so the README/social posts have ready-made demo footage of every app.

If you want to contribute more clips, keep individual files small (target under 2 MB, hard ceiling 5 MB) and open a PR. For larger personal libraries, a companion repo (the `fast-news-reader` model) is the better home.
