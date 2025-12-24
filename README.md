# Fast Search Card

[](https://github.com/hacs/integration)
[](./docs/CHANGELOG.md)
[](LICENSE)

A modern, high-performance Lovelace card for Home Assistant, inspired by the **visionOS aesthetic**. It features a lightning-fast search, smart filtering, and an expandable UI with integrated controls, history, scheduling, and a plugin system.

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/fastender)

-----

<p align="center">
  <img src="dfes-1.png" width="200" title="Step 1">
  <img src="dfes-2.png" width="200" title="Step 2">
  <img src="dfes-3.png" width="200" title="Step 3">
  <img src="dfes-4.png" width="200" title="Step 4"> 
</p>

## ✨ Features

### 🔍 Smart Search & Filtering

  * **Fuzzy Search:** Instantly finds entities, scripts, and scenes, even with typos, powered by Fuse.js.
  * **Smart Categories:** Filter by Devices, Sensors, Actions, and custom System Entities.
  * **Sub-Category Bar:** Dynamically filter by room (area), device type, or suggestions.
  * **Advanced Pattern Filtering:** Exclude entities using wildcard patterns (`sensor.*`, `*_unavailable`, etc.) directly from the settings tab.

### 🎨 visionOS Design

  * **Glassmorphism:** Modern blur effects and translucent backgrounds.
  * **Animated Icons:** Over 100 custom animated SVG icons for different device states (`On`/`Off`), including washing machines, lights, fans, locks, and more.
  * **Fluid Animations:** Built with Framer Motion for smooth panel transitions and staggered list animations.
  * **Responsive Layout:** Adapts for desktop, tablet, and mobile use.

### 🧩 Integrated Detail View

The card expands to a full-featured control center with multiple tabs:

  * **Controls:** An interactive circular slider for lights, climate, and covers, plus specific controls like fan modes or solar production.
  * **Context:** (Formerly Actions) Shows related automations, scripts, and scenes for the device.
  * **History:** Displays entity history using high-performance `Chart.js` graphs.
  * **Schedule:** A built-in scheduler with an iOS-style picker to create timers and weekly schedules. Integrates directly with the `nielsfaber/scheduler-component`.
  * **Settings:** Configure the card, manage excluded patterns, and change languages directly from the UI.

### 🤖 System & Plugin Framework

  * **System Entities:** Core functions like Settings, Marketplace, and a global Schedule Viewer are built as modular entities.
  * **Plugin Store:** (In Development) A built-in interface to browse, install, and manage plugins for the card.
  * **Plugin Loader:** (In Development) Dynamically load custom plugins from local files, GitHub, or URLs.
  * **Experimental AI Mode:** A chat interface for controlling devices with natural language (simulated responses in current build).

-----

## 📦 Installation

### HACS (Recommended)

1.  **Open HACS** in your Home Assistant.
2.  **Add Custom Repository**:
      * Click the 3 dots in the top right.
      * Select "Custom repositories".
      * URL: `https://github.com/fastender/Fast-Search-Card` (or your repo URL)
      * Category: `Lovelace`
3.  **Install**:
      * Find "Fast Search Card" in the list.
      * Click "Install" (or "Download").
4.  **Add to Lovelace**:
      * Go to "Settings" \> "Dashboards".
      * Click the 3 dots and select "Resources".
      * Click "Add Resource".
      * URL: `/hacsfiles/fast-search-card/fast-search-card.js`
      * Type: `JavaScript Module`.
5.  **Restart Home Assistant** (recommended).

### Manual Installation

1.  **Download the latest `fast-search-card.js`** file from the [Releases](https://github.com/fastender/Fast-Search-Card/releases) page.
2.  **Copy the file** to your `config/www/` directory (e.g., `/config/www/community/fast-search-card/fast-search-card.js`).
3.  **Register the resource** in Home Assistant:
      * Go to **Settings** → **Dashboards** → **Resources** (under the 3-dot menu).
      * Click **"Add Resource"**.
      * URL: `/local/community/fast-search-card/fast-search-card.js`
      * Type: `JavaScript Module`.
4.  **Restart Home Assistant**.

-----

## 🚀 Usage

### Basic Configuration

Add the card to your Lovelace dashboard:

```yaml
type: custom:fast-search-card
```

The card works out-of-the-box. Most configuration is handled directly within the card's interface.

### Card Configuration

```yaml
type: custom:fast-search-card
card_height: 672px # Optional: Set a fixed height (672px is the default expanded height)
```

-----



## ⚙️ In-Card Configuration

Most settings are managed directly in the **Settings Tab** inside the card:

  * **General:** Change the display language (10 languages supported).
  * **Appearance:** Toggle between Grid and List view modes. The card automatically uses your active Home Assistant theme.
  * **Privacy & Filtering:** Manage your "Excluded Patterns" to hide entities from the search results.
      * **Live Preview:** Instantly see which entities will be hidden by your patterns.
      * **Templates:** Use pre-defined templates (e.g., hide all sensors, hide unavailable entities).
      * **Import/Export:** Back up and share your filter lists as JSON.
  * **About:** View card version and build information.

-----

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.
