# Media

This folder collects example media for Fast Search Card — primarily background videos that play behind the Detail View.

```
media/
├── README.md      ← you are here
├── videos/        ← MP4 background videos (ready to use)
├── gifs/          ← animated previews + logo used in the project README
└── images/        ← static hero screenshots used in the project README
```

The `gifs/` folder contains the animated logo (`logo.gif`) and three Detail-View previews (`climate.gif`, `light.gif`, `music.gif`).

The `images/` folder contains the four hero screenshots (`fsc-1.png` through `fsc-4.png`) — Detail View, Todos, Bento Start, Devices grid.

The videos in `media/videos/` are committed to the repo and ready to drop into `/config/www/fast-search-videos/` on your Home Assistant. Six clips are included:

- `light_on.mp4` / `light_off.mp4`
- `climate_on.mp4` / `climate_off.mp4`
- `media_player_on.mp4` / `media_player_off.mp4`

Roughly 2 MB each. Plug-and-play.

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

Examples:

| Filename | Plays when |
|---|---|
| `light_on.mp4` | a light is on |
| `light_off.mp4` | a light is off |
| `climate_heating.mp4` | climate is heating |
| `climate_cooling.mp4` | climate is cooling |
| `cover_open.mp4` | a cover is open |
| `cover_closed.mp4` | a cover is closed |
| `vacuum_cleaning.mp4` | a vacuum is running |
| `vacuum_docked.mp4` | a vacuum is on its dock |
| `media_player_playing.mp4` | a media player is playing |
| `lock_locked.mp4` | a lock is locked |
| `lock_unlocked.mp4` | a lock is unlocked |
| `fan_on.mp4` | a fan is on |
| `switch_on.mp4` | a switch is on |

State names follow the simplified state mapping in `src/utils/videoHelpers.js`. Common states: `on`, `off`, `open`, `closed`, `locked`, `unlocked`, `playing`, `paused`, `heating`, `cooling`, `cleaning`, `docked`.

### How to use

1. Drop your MP4 files into `/config/www/fast-search-videos/` on Home Assistant.
2. Make sure the filenames follow the `{domain}_{state}.mp4` convention.
3. Open any entity's Detail View. If a matching video exists, it plays automatically.

If no video matches, the Detail View falls back to the animated icon.

### Suggested format

- **Container:** MP4 (H.264)
- **Resolution:** 1280×720 or smaller
- **Duration:** 5–15 seconds (looped)
- **Audio:** stripped (the card mutes everything anyway)
- **Size:** under 2 MB per clip if possible

---

## Why this folder exists in the repo

A small starter pack lives here so the Detail View has something to play out of the box. Six clips at ~2 MB each — light enough to ship with the project, useful enough to demo the feature instantly.

If you want to contribute more clips, keep individual files small (target under 2 MB, hard ceiling 5 MB) and open a PR. For larger personal libraries, a companion repo (the `fast-news-reader` model) is the better home.
