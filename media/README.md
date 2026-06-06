# Media

This folder collects example media for Fast Search Card — primarily background videos that play behind the Detail View.

```
media/
├── README.md      ← you are here
└── videos/        ← MP4 background videos
```

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

This folder is a **placeholder and reference** — the videos themselves stay out of git (MP4s are too heavy and too personal). The folder + this README ensure the convention is documented in one obvious place.

If you want to share your own video pack with the community, fork the repo, put your MP4s in `media/videos/`, and open a discussion in Issues. The companion package model (like `fast-news-reader`) is also an option for larger collections.
