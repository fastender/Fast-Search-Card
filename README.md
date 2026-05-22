<div align="center">

# Fast Search Card

### Find anything. In an instant.

A Lovelace card for Home Assistant.

[![Version](https://img.shields.io/badge/version-1.1.1610-007AFF?style=flat-square)](docs/version-history/versionsverlauf.md)
[![HACS](https://img.shields.io/badge/HACS-Custom-FF6B35?style=flat-square)](https://hacs.xyz)
[![Home Assistant](https://img.shields.io/badge/Home_Assistant-2024.6%2B-41BDF5?style=flat-square)](https://www.home-assistant.io)
[![License](https://img.shields.io/badge/license-MIT-1D1D1F?style=flat-square)](LICENSE)

<br>

<img src="dfes-1.png" width="180"> <img src="dfes-2.png" width="180"> <img src="dfes-3.png" width="180"> <img src="dfes-4.png" width="180">

<br>
<br>

[Trailer](https://www.youtube.com/watch?v=GDTA6Qx5IxE) · [Install Guide](https://youtu.be/lqQ3jtwOqH8) · [Features](docs/FEATURES.md) · [Roadmap](docs/FEATURE_ROADMAP.md)

</div>

<br>

---

## Install

Through HACS. Three steps.

```yaml
# 1. Add custom repository
URL:  https://github.com/fastender/Fast-Search-Card
Type: Lovelace

# 2. Install through HACS

# 3. Add resource
URL:  /hacsfiles/fast-search-card/fast-search-card.js
Type: JavaScript Module
```

Then drop one line into your dashboard.

```yaml
type: custom:fast-search-card
```

That's it.

<details>
<summary>Manual install</summary>

<br>

1. Download `fast-search-card.js` from [Releases](https://github.com/fastender/Fast-Search-Card/releases).
2. Copy to `/config/www/community/fast-search-card/`.
3. Register the resource under **Settings → Dashboards → Resources**.
4. Restart Home Assistant.

</details>

<br>

---

## What's inside

<details>
<summary><b>Bento Start.</b> A start screen made of moments.</summary>

<br>

Four configurable slots. Weather, calendar, todos, news, favorites. Live. Slides automatically. Adapts to mobile.

</details>

<details>
<summary><b>Search.</b> Fuzzy, fast, forgiving.</summary>

<br>

Type a typo. Type a room. Type a feeling. Combine area and domain as chips. Find anything in milliseconds. Learns your patterns over time.

</details>

<details>
<summary><b>Detail View.</b> Everything about everything.</summary>

<br>

Five tabs per device. Controls. Context. History. Schedule. Settings. Circular sliders, scene execution, Chart.js graphs, built-in scheduler. Made for one-tap actions.

</details>

<details>
<summary><b>Calendar.</b> Apple Calendar, in Home Assistant.</summary>

<br>

Day, Week, Month, Year views. Native HA WebSocket integration. Recurring events with five Apple-style presets. Add, edit, delete — without leaving the dashboard.

</details>

<details>
<summary><b>Todos.</b> Reminders, reborn.</summary>

<br>

Every HA `todo.*` backend, in one place. Overdue items in red. Apple-style wheel pickers for due dates. Multi-list filters that actually combine.

</details>

<details>
<summary><b>News.</b> Reader bundled in.</summary>

<br>

RSS-aware. Renders images other readers miss. Mark-as-read. Unread badge. Deep-links straight from the start screen.

</details>

<details>
<summary><b>Music Assistant.</b> Your queue, your way.</summary>

<br>

Search libraries. Browse the queue. Multi-engine TTS with language switching. Now playing as the background.

</details>

<details>
<summary><b>Energy Dashboard.</b> Numbers that make sense.</summary>

<br>

Real-time charts. Sensor setup wizard. Multi-schema support — works with every HA Core since 2025.11.

</details>

<details>
<summary><b>Settings.</b> In the card. Not somewhere else.</summary>

<br>

Background filters. Squircle cards. Splashscreen styles. Excluded patterns with live preview. Ten languages. All persistent.

</details>

<details>
<summary><b>And more.</b></summary>

<br>

Tipps. Versionsverlauf. All-Schedules. Bambu Lab 3D printer support. Liquid-Glass switches. Apple Hello splashscreen. Toast notifications. AI Mode (experimental). Listen virtualization for thousands of entities.

See [FEATURES.md](docs/FEATURES.md) for the full list.

</details>

<br>

---

## Built with

Preact · Framer Motion · Fuse.js · Chart.js · virtua · IndexedDB

Single file. ~390 KB gzipped. Boots in under a second.

<br>

---

## Documentation

<details>
<summary>For users</summary>

<br>

- [Features](docs/FEATURES.md) — Everything the card does
- [Version history](docs/version-history/versionsverlauf.md) — Every release, every change

</details>

<details>
<summary>For developers</summary>

<br>

- [Feature roadmap](docs/FEATURE_ROADMAP.md) — Ten ideas, prioritized
- [Performance roadmap](docs/PERFORMANCE_ROADMAP.md) — Bundle, render, scroll
- [Custom component roadmap](docs/CUSTOM_COMPONENT_ROADMAP.md) — Companion HACS packages
- [Bundle audit](docs/BUNDLE_AUDIT_2026-05-21.md) — Latest analysis

</details>

<details>
<summary>Development setup</summary>

<br>

```bash
# Requires Node.js 18+
npm install
npm run dev      # Hot reload
npm run build    # Production bundle → dist/fast-search-card.js
```

</details>

<br>

---

## Contributing

Open an issue. Open a PR. Both welcome.

<br>

---

## License

[MIT](LICENSE). Free to use. Free to fork.

<br>

<div align="center">

<sub>Made for the Home Assistant community.</sub>

<br>

[☕ Buy me a coffee](https://www.buymeacoffee.com/fastender)

</div>
