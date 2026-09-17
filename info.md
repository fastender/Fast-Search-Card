# Fast Search Card

**A search card and a complete dashboard for Home Assistant, in one Lovelace card.**

Type to find any entity, tap to control it, and use the start screen, calendar, to-dos, news, energy view and notification center without leaving the card. The card builds itself from what Home Assistant already knows — floors, areas, labels and visibility.

HACS shows the full [README](https://github.com/fastender/Fast-Search-Card/blob/main/README.md) for this repository. This page is the short version.

---

## Highlights

- **Search** — fuzzy search with area and domain chips, grid or list view, four categories.
- **Start screen** — live widgets, a screensaver with deep rest, wake sources, display handoff and a photo frame for wall tablets; a height ladder fits low screens.
- **Detail view** — controls, context, history charts, a built-in scheduler and optional video backgrounds.
- **Island and Notification Center** — status at a glance, messages on demand, and a house chronicle of what happened.
- **Calendar and to-dos** — local Home Assistant data, calendar groups, event rules and person lanes, live todos, undo for deletions and dictation.
- **Settings in the card** — language (English and German), appearance, filters, the island and the start screen.

The complete list is in [FEATURES.md](https://github.com/fastender/Fast-Search-Card/blob/main/docs/FEATURES.md); every change is described in the [version history](https://github.com/fastender/Fast-Search-Card/blob/main/docs/version-history/versionsverlauf.md).

---

## Installation

### HACS

1. Add `https://github.com/fastender/Fast-Search-Card` as a custom repository (type: Lovelace).
2. Install **Fast Search Card**.
3. Register the resource `/hacsfiles/fast-search-card/fast-search-card.js` as a JavaScript module.

### Manual

1. Download all `.js` assets of the release — since v1.1.2431 the card ships as `fast-search-card.js` plus view chunks that must sit next to it.
2. Copy all `.js` files to `/config/www/community/fast-search-card/`.
3. Register `/local/community/fast-search-card/fast-search-card.js` as a JavaScript module.

---

## Usage

```yaml
type: custom:fast-search-card
```

Everything else is configured inside the card.

---

## License

GNU General Public License v3.0 or later (GPL-3.0-or-later) — see [LICENSE](LICENSE). The name "Fast Search Card" is reserved, see [TRADEMARKS.md](TRADEMARKS.md).
