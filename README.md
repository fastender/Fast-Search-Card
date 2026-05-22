<div align="center">

# Fast Search Card

### Find anything. In an instant.

_Faster. Together._

A Lovelace card for Home Assistant.<br>
**Setup in under 10 seconds. One line.**

[![Version](https://img.shields.io/github/v/release/fastender/Fast-Search-Card?style=flat-square&color=007AFF&label=version)](https://github.com/fastender/Fast-Search-Card/blob/main/docs/version-history/versionsverlauf.md)
[![Releases](https://img.shields.io/badge/releases-2%2C000%2B-34C759?style=flat-square)](https://github.com/fastender/Fast-Search-Card/blob/main/docs/version-history/versionsverlauf.md)
[![Downloads](https://img.shields.io/github/downloads/fastender/Fast-Search-Card/total?style=flat-square&color=AF52DE&label=downloads)](https://github.com/fastender/Fast-Search-Card/releases)
[![Stars](https://img.shields.io/github/stars/fastender/Fast-Search-Card?style=flat-square&color=FF9500&label=stars)](https://github.com/fastender/Fast-Search-Card/stargazers)
[![HACS](https://img.shields.io/badge/HACS-Custom-FF6B35?style=flat-square)](https://hacs.xyz)
[![Home Assistant](https://img.shields.io/badge/Home_Assistant-2024.6%2B-41BDF5?style=flat-square)](https://www.home-assistant.io)
[![Telemetry](https://img.shields.io/badge/telemetry-none-1D1D1F?style=flat-square)](https://github.com/fastender/Fast-Search-Card/blob/main/docs/SECURITY.md)
[![License](https://img.shields.io/badge/license-GPL--3.0-1D1D1F?style=flat-square)](https://github.com/fastender/Fast-Search-Card/blob/main/LICENSE)

[![Sponsor](https://img.shields.io/github/sponsors/fastender?style=flat-square&color=EA4AAA&label=sponsor&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/fastender)
[![Buy Me a Coffee](https://img.shields.io/badge/buy_me_a_coffee-FFDD00?style=flat-square&logo=buymeacoffee&logoColor=black)](https://www.buymeacoffee.com/fastender)

<sub>On GitHub since 2016 · 2,000+ releases shipped · Zero telemetry, audited every release</sub>

<br>

<img src="https://raw.githubusercontent.com/fastender/Fast-Search-Card/main/dfes-1.png" width="180"> <img src="https://raw.githubusercontent.com/fastender/Fast-Search-Card/main/dfes-2.png" width="180"> <img src="https://raw.githubusercontent.com/fastender/Fast-Search-Card/main/dfes-3.png" width="180"> <img src="https://raw.githubusercontent.com/fastender/Fast-Search-Card/main/dfes-4.png" width="180">

<br>
<br>

[Trailer](https://www.youtube.com/watch?v=GDTA6Qx5IxE) · [Install Guide](https://youtu.be/lqQ3jtwOqH8) · [Features](https://github.com/fastender/Fast-Search-Card/blob/main/docs/FEATURES.md) · [Security](https://github.com/fastender/Fast-Search-Card/blob/main/docs/SECURITY.md) · [Roadmap](https://github.com/fastender/Fast-Search-Card/blob/main/docs/FEATURE_ROADMAP.md)

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

## Security

No telemetry. No tracking. No external API calls. No authentication material stored.

Audited on every release. Single-file bundle you can grep yourself.

See [SECURITY.md](https://github.com/fastender/Fast-Search-Card/blob/main/docs/SECURITY.md) for the complete audit and the full list of what's stored locally.

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
<summary><b>Calendar.</b> A real calendar. Local. In Home Assistant.</summary>

<br>

Day, Week, Month, Year views. Native HA WebSocket integration. All events stay on your Home Assistant. No cloud, no account. Recurring events with five preset patterns. Add, edit, delete — without leaving the dashboard.

</details>

<details>
<summary><b>Todos.</b> Local reminders, reborn.</summary>

<br>

Every HA `todo.*` backend, in one place. All lists stay on your Home Assistant. No cloud, no account. Overdue items in red. Smooth wheel pickers for due dates. Multi-list filters that actually combine.

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

Tipps. Versionsverlauf. All-Schedules. Bambu Lab 3D printer support. Liquid-Glass switches. Handwritten splashscreen. Toast notifications. AI Mode (experimental). Listen virtualization for thousands of entities.

See [FEATURES.md](https://github.com/fastender/Fast-Search-Card/blob/main/docs/FEATURES.md) for the full list.

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

- [Features](https://github.com/fastender/Fast-Search-Card/blob/main/docs/FEATURES.md) — Everything the card does
- [Version history](https://github.com/fastender/Fast-Search-Card/blob/main/docs/version-history/versionsverlauf.md) — Every release, every change

</details>

<details>
<summary>For developers</summary>

<br>

- [Feature roadmap](https://github.com/fastender/Fast-Search-Card/blob/main/docs/FEATURE_ROADMAP.md) — Ten ideas, prioritized
- [Performance roadmap](https://github.com/fastender/Fast-Search-Card/blob/main/docs/PERFORMANCE_ROADMAP.md) — Bundle, render, scroll
- [Custom component roadmap](https://github.com/fastender/Fast-Search-Card/blob/main/docs/CUSTOM_COMPONENT_ROADMAP.md) — Companion HACS packages
- [Bundle audit](https://github.com/fastender/Fast-Search-Card/blob/main/docs/BUNDLE_AUDIT_2026-05-21.md) — Latest analysis

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

[GPL-3.0-or-later](https://github.com/fastender/Fast-Search-Card/blob/main/LICENSE). Free to use. Modifications and forks must remain open-source under the same license.

The name "Fast Search Card" is reserved — see [TRADEMARKS.md](https://github.com/fastender/Fast-Search-Card/blob/main/TRADEMARKS.md).

<br>

<div align="center">

### _Faster. Together._

<sub>Made in Germany 🇩🇪 with a Turkish heart 🇹🇷</sub>

<br>

<sub>Built for the Home Assistant community. Since 2016.</sub>

<br>

[☕ Buy me a coffee](https://www.buymeacoffee.com/fastender)

</div>
