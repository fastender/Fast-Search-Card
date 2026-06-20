<div align="center">

<img src="https://raw.githubusercontent.com/fastender/Fast-Search-Card/main/media/gifs/logo.gif" width="200" alt="Fast Search Card logo">

# Fast Search Card

### Search anything. Run anything.

_Faster. Together._

A search card. A complete dashboard. Same card.<br>
Type to find. Tap to control. Glance to know.

A modern dashboard for Home Assistant.<br>
**Setup in under 10 seconds. One line.**

[![Version](https://img.shields.io/github/v/release/fastender/Fast-Search-Card?style=flat-square&color=007AFF&label=version)](https://github.com/fastender/Fast-Search-Card/blob/main/docs/version-history/versionsverlauf.md)
[![Releases](https://img.shields.io/badge/releases-2%2C000%2B-34C759?style=flat-square)](https://github.com/fastender/Fast-Search-Card/blob/main/docs/version-history/versionsverlauf.md)
[![Downloads](https://img.shields.io/github/downloads/fastender/Fast-Search-Card/total?style=flat-square&color=AF52DE&label=downloads)](https://github.com/fastender/Fast-Search-Card/releases)
[![Stars](https://img.shields.io/github/stars/fastender/Fast-Search-Card?style=flat-square&color=FF9500&label=stars)](https://github.com/fastender/Fast-Search-Card/stargazers)
[![HACS](https://img.shields.io/badge/HACS-Custom-FF6B35?style=flat-square)](https://hacs.xyz)
[![Home Assistant](https://img.shields.io/badge/Home_Assistant-2024.6%2B-41BDF5?style=flat-square)](https://www.home-assistant.io)
[![Telemetry](https://img.shields.io/badge/telemetry-none-1D1D1F?style=flat-square)](https://github.com/fastender/Fast-Search-Card/blob/main/docs/SECURITY.md)
[![License](https://img.shields.io/badge/license-GPL--3.0-1D1D1F?style=flat-square)](https://github.com/fastender/Fast-Search-Card/blob/main/LICENSE)

[![Sponsor](https://img.shields.io/badge/%E2%99%A1_sponsor-EA4AAA?style=flat-square&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/fastender)
[![Buy Me a Coffee](https://img.shields.io/badge/buy_me_a_coffee-FFDD00?style=flat-square&logo=buymeacoffee&logoColor=black)](https://www.buymeacoffee.com/fastender)

<sub>On GitHub since 2016 · 2,000+ releases shipped · Zero telemetry, audited every release</sub>

<br>

<img src="https://raw.githubusercontent.com/fastender/Fast-Search-Card/main/media/gifs/climate.gif" width="240"> <img src="https://raw.githubusercontent.com/fastender/Fast-Search-Card/main/media/gifs/music.gif" width="240"> <img src="https://raw.githubusercontent.com/fastender/Fast-Search-Card/main/media/gifs/light.gif" width="240">

<sub>Detail View with video backgrounds — climate, music, light.</sub>

<br>

<img src="https://raw.githubusercontent.com/fastender/Fast-Search-Card/main/media/images/fsc-1.png" width="380"> <img src="https://raw.githubusercontent.com/fastender/Fast-Search-Card/main/media/images/fsc-2.png" width="380">

<img src="https://raw.githubusercontent.com/fastender/Fast-Search-Card/main/media/images/fsc-3.png" width="380"> <img src="https://raw.githubusercontent.com/fastender/Fast-Search-Card/main/media/images/fsc-4.png" width="380">

<br>
<br>

[Trailer](https://www.youtube.com/watch?v=GDTA6Qx5IxE) · [Install Guide](https://youtu.be/lqQ3jtwOqH8) · [Features](https://github.com/fastender/Fast-Search-Card/blob/main/docs/FEATURES.md) · [Security](https://github.com/fastender/Fast-Search-Card/blob/main/docs/SECURITY.md) · [Performance](https://github.com/fastender/Fast-Search-Card/blob/main/docs/PERFORMANCE.md) · [Roadmap](https://github.com/fastender/Fast-Search-Card/blob/main/docs/FEATURE_ROADMAP.md)

</div>

<br>

---

## Install

**One click** — open it straight in your Home Assistant (HACS opens with the repository pre-filled, just hit **Download**):

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=fastender&repository=Fast-Search-Card&category=plugin)

<sub>Requires [HACS](https://hacs.xyz) + the [My Home Assistant](https://www.home-assistant.io/integrations/my/) integration (built in). The link is a [My link](https://www.hacs.xyz/docs/use/my/) — no need to copy the repo URL by hand.</sub>

<details>
<summary><b>Or add it manually</b> (three steps)</summary>

<br>

1. **Add this repo** as a Custom Repository in HACS — Type `Lovelace`, URL `https://github.com/fastender/Fast-Search-Card`.
2. **Install** Fast Search Card from HACS.
3. **Register the resource** in your dashboard — URL `/hacsfiles/fast-search-card/fast-search-card.js`, Type `JavaScript Module`.

</details>

Then drop one line into your dashboard:

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

## Preparation

_Optional. Worth it._

The card works the moment you install it. It shines when your Home Assistant is organized.

Four things make the difference:

- **Floors** — your home's levels. Used for sidebar structure.
- **Areas** — your rooms. Used for grouping.
- **Labels** — tags you choose. Used for filtering.
- **Visibility** — hide what doesn't belong. Respected everywhere.

Already organized? The card picks it up automatically. Hidden entities stay hidden. Disabled entities stay disabled. Nothing leaks through.

New to this? Start with [areas](https://www.home-assistant.io/docs/organizing/areas/), then [floors](https://www.home-assistant.io/docs/organizing/floors/), then [labels](https://www.home-assistant.io/docs/organizing/labels/). The full guide is at [home-assistant.io/docs/organizing](https://www.home-assistant.io/docs/organizing/).

<br>

## Configure once

You already named every device. You already grouped them by area. You already decided what's visible and what isn't.

Why do it twice?

The card reads your Home Assistant — floors, areas, labels, visibility — and builds itself from what it finds.

Add a light to a room? It appears.
Rename a floor? The card follows.
Hide an entity? Hidden.
Reorder areas? Reshuffled.

No YAML. No copy-paste. No second source of truth.

<sub>Same idea behind Home Assistant's own [dashboard strategies](https://developers.home-assistant.io/docs/frontend/custom-ui/custom-strategy/) — render from your settings, not from a config file. But as a card, so your dashboard structure stays yours.</sub>

<br>

## Why this exists

A smart home should be measured by what runs without you. By automations. By scripts. By things that happen because they should.

Not by how its dashboard looks.

But you still need a dashboard. And the hours you spend dragging cards, writing YAML, picking icons — that time belongs to automations, not to layout.

This card flips it. Do the work once in Home Assistant — name your devices, group them by area, label them properly. The dashboard builds itself. In under a minute.

Spend the rest of your weekend on something that actually runs.

<br>

---

## Security

No telemetry. No tracking. No external API calls. No authentication material stored.

Audited on every release. Single-file bundle you can grep yourself.

See [SECURITY.md](https://github.com/fastender/Fast-Search-Card/blob/main/docs/SECURITY.md) for the complete audit and the full list of what's stored locally.

<br>

## Performance

Boots in under a second. Stays under 400 KB gzipped. 60 fps scrolling with thousands of entities.

rAF-batched updates. virtua-virtualized lists. Instant repeat searches via LRU cache. No main-thread starvation.

Measured on every release. Single-file bundle you can profile yourself.

See [PERFORMANCE.md](https://github.com/fastender/Fast-Search-Card/blob/main/docs/PERFORMANCE.md) for the full audit and the numbers we measure on every release.

<br>

## Survives every update

One file in `www/`. No Docker. No add-on. No daemon. Nothing to install, nothing to maintain.

Home Assistant restart? Still there. Core upgrade? Still there. Full system crash? Right where you left it when you boot back.

Nothing on the server runs. The card lives only in your browser.

<br>

---

## More than search

A start screen. A calendar. Reminders. News. Energy monitoring. Music control. A scheduler. A settings hub. A device builder.

**One card. A complete dashboard. All local.**

<br>

## What's inside

<details>
<summary><b>Bento Start.</b> A start screen made of widgets. Live.</summary>

<br>

Four configurable slots. Weather, calendar, todos, news, favorites — all live. Slides automatically. Adapts to mobile.

</details>

<details>
<summary><b>Sidebar.</b> A liquid-glass dock for your apps.</summary>

<br>

Left on desktop. Bottom on mobile. Pick which apps appear. Hover to expand — smooth glass deblur, labels stagger in. Active app stays highlighted.

</details>

<details>
<summary><b>Search.</b> Fuzzy, fast, forgiving.</summary>

<br>

Type a typo. Type a room. Type a feeling. Combine area and domain as chips. Find anything in milliseconds. Learns your patterns over time.

</details>

<details>
<summary><b>Browse.</b> Two views. Four categories. Your order.</summary>

<br>

Grid or list — switch any time.

Four categories: **Devices. Sensors. Actions. Custom.** Each with its own filters.

Sort by area. Sort by category. Sort by what you use most. The card learns and reorders itself.

</details>

<details>
<summary><b>Detail View.</b> Everything about everything.</summary>

<br>

Five tabs per device. Controls. Context. History. Schedule. Settings. Circular sliders, scene execution, Chart.js graphs, built-in scheduler. Made for one-tap actions.

Video backgrounds when you have them — drop `{domain}_{state}.mp4` into `/local/fast-search-videos/` (or your own path) and the detail view plays it behind the controls. Looped. Muted. Automatic. See [media/](https://github.com/fastender/Fast-Search-Card/blob/main/media/README.md) for the naming convention and a starter list.

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

Powered by [fast-news-reader](https://github.com/fastender/fast-news-reader) — a companion HACS custom component that does the heavy lifting (feed parsing, `content:encoded` image extraction, persistence). One install, no extra config.

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
<summary><b>Device Builder.</b> Custom devices, without code.</summary>

<br>

A visual builder for any device — energy monitors, 3D printers, weather stations, or fully custom. Pick a category, choose your sensors, name them. The card adds the view to your dashboard.

No YAML. No code. Edit anytime.

</details>

<details>
<summary><b>Settings.</b> In the card. Not somewhere else.</summary>

<br>

Background filters. Squircle cards. Splashscreen styles. Excluded patterns with live preview. English and German today, more languages on the way. All persistent.

</details>

<details>
<summary><b>And more.</b></summary>

<br>

**Apps.** Changelog. Tips. All-Schedules. Live weather. Bambu Lab 3D printer support.

**Design.** Liquid-Glass sliders and switches. Smooth motion throughout. Handwritten splashscreen. Toast notifications. Chart.js graphs everywhere.

**Smart.** Predictive suggestions that learn your habits. List virtualization for thousands of entities. AI Mode (experimental).

See [FEATURES.md](https://github.com/fastender/Fast-Search-Card/blob/main/docs/FEATURES.md) for the full list.

</details>

<br>

---

## Built with

Preact · Framer Motion · Fuse.js · Chart.js · virtua · IndexedDB

Single file. ~390 KB gzipped. Boots in under a second.

All open-source dependencies. No proprietary code. Fully auditable.

<br>

## Built openly, with AI

AI is a powerful tool. It's used to build this card — mostly Claude. It's also used inside Home Assistant itself: voice, conversation, summarization.

Every commit in this repo declares it. A `Co-Authored-By` footer names the model that helped. Every release is reviewed before it ships. AI accelerated the work; a human still decides what's good enough.

No mystery. No pretending.

<br>

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

Found a bug? Open an issue.
Want a feature? Open an issue.
Got code? Open a PR — contributions are merged under GPL-3.0 and credited.

Forks are legally allowed under the GPL but must use a different name. See [TRADEMARKS.md](https://github.com/fastender/Fast-Search-Card/blob/main/TRADEMARKS.md).

<br>

## License

[GPL-3.0-or-later](https://github.com/fastender/Fast-Search-Card/blob/main/LICENSE). Free to use. Modifications and forks must remain open-source under the same license.

The name "Fast Search Card" is reserved — see [TRADEMARKS.md](https://github.com/fastender/Fast-Search-Card/blob/main/TRADEMARKS.md) for the trademark notice and what forks may and may not do with the branding.

<br>

<div align="center">

### _Faster. Together._

<sub>Made in Germany 🇩🇪 with a Turkish heart 🇹🇷</sub>

<br>

<sub>Built for the Home Assistant community by a developer on GitHub since 2016.</sub>

<br>

[☕ Buy me a coffee](https://www.buymeacoffee.com/fastender)

</div>
