# Security

This document is for users who install Fast Search Card via HACS and want to know what the card does — and doesn't do — with their Home Assistant data.

If you just want the short version: **the card has no telemetry, no tracking, no external API calls, no analytics, and stores no authentication material.** Everything it needs already lives inside your Home Assistant instance.

The rest of this document is the long version, so you can verify that for yourself.

---

## What this card does not do

These are the categories of behaviour that are explicitly absent. They have been verified through systematic audit (see [Audit history](#audit-history) below) and are checked again on every release.

| Category | Status |
|---|---|
| Analytics / telemetry (Google Analytics, Sentry, PostHog, Mixpanel, Segment, Amplitude, etc.) | None — verified by grep |
| External API calls with your data | None — the only outbound fetches are to GitHub-hosted markdown files (`versionsverlauf.md`, `lessons.de.md`, `lessons.en.md`) and they send no body or auth header |
| Third-party CDN imports at runtime | None — all dependencies are bundled at build time via Vite |
| Hardcoded secrets, API keys, tokens | None — verified against patterns for JWT, Bearer, Stripe, Google, GitHub, Slack tokens |
| Authentication material in localStorage / sessionStorage / IndexedDB | None — verified |
| `eval()` or `new Function()` code-injection vectors | None |
| Source maps in the shipped bundle | None — `dist/` contains only the minified file |
| Cookie writes via JavaScript | None |
| Service workers caching your data | None |

If you want to confirm any of this yourself, the audit method is straightforward: download the release file and grep it. The shipped bundle is a single self-contained JavaScript file at `https://github.com/fastender/Fast-Search-Card/releases/latest`.

---

## What the card stores locally

The card persists configuration, UI state, and performance caches in your browser. **Nothing is uploaded anywhere.** This is the complete list as of v1.1.1616:

### localStorage

| Key | Contents | Why it's there |
|---|---|---|
| `fsc_entities_snapshot_v1` | Top-120 entity IDs + states (compact) | First-render performance — without this the card boots blank for ~500ms |
| `fsc_favorites_snapshot_v1` | Array of entity IDs you marked as favourite | Restored across page reloads |
| `fsc_suggestions_snapshot_v1` | Top-60 suggested entities | Snappy suggestion list on cold start |
| `excludedPatterns` | Wildcard patterns you defined in Settings | Your exclusion rules |
| `systemSettings` | UI theme, language, toast preferences, grid columns, news/todos filters | Your settings |
| `darkMode`, `userLanguage` | Theme + language strings | Convenience cache |
| `newsSettings`, `todosSettings` | Per-feed and per-list preferences | Your settings |
| `videoDefaultsCache` | URLs of available default video files + timestamp | Avoids redundant HEAD requests |

### sessionStorage

| Key | Contents | Why it's there |
|---|---|---|
| `ma_library_disabled_v1`, `ma_probe_version_v1`, `ma_services_logged_v1` | Music Assistant probe flags | Avoids re-probing the integration on every tab |

### IndexedDB (database `FastSearchDB`)

| Object Store | Contents |
|---|---|
| `entities` | Entity metadata + state snapshots, indexed by domain/area/relevance |
| `settings` | Same data as `localStorage.systemSettings`, duplicated for async access |
| `searchIndex` | Pre-built search-term index for fuzzy matching |
| `userPatterns` | Which entities you interact with, when, and how — used locally for ranking suggestions |
| `areaMappings` | Room metadata + usage frequency |
| `favorites` | Favourite entity IDs with timestamps and usage counts |

### Home Assistant user data (cross-device sync)

Three keys are written to Home Assistant's `frontend/set_user_data` WebSocket API so your configuration follows you across devices. This data lives inside your HA instance, not on a third-party server:

- `fast_search_card_devices` — integration device configurations
- `fast_search_card_energy_sensors` — legacy energy sensor mappings
- `fast_search_card_energy_dashboard` — energy dashboard schema

### What is explicitly **not** stored

- Home Assistant access tokens, refresh tokens, long-lived tokens
- The `hass.auth` or `hass.user` object
- Passwords, OAuth credentials, integration API keys
- Personally-identifying information beyond what Home Assistant already exposes (entity IDs, area names you chose, your dark-mode preference)

---

## Outbound network behaviour

The card makes exactly three categories of outbound requests:

1. **To your Home Assistant server.** Via `hass.callService()`, `hass.callApi()`, and the existing WebSocket connection. These are the same calls any Lovelace card makes — they go through HA's normal authentication and never leave your network.
2. **To GitHub raw content** (`raw.githubusercontent.com`). The Changelog tab fetches `docs/version-history/versionsverlauf.md` and the Tipps tab fetches `docs/lessons/lessons.{de,en}.md`. These are public files. The fetch is a plain `GET` with no body, no custom headers, no cookies, no authentication.
3. **HEAD requests to your local HA media folder** (`/local/fast-search-videos/*.mp4`) to check whether a video exists. The path is always local to your HA server.

That's it. There are no analytics endpoints, no error reporting services, no usage-statistics uploads, no "phone home" beacons.

---

## Hardening measures

The following protections are in place. Each links back to the release that introduced it.

### XSS protection

- **Icon HTML sanitisation** (v1.1.1614): all `dangerouslySetInnerHTML` callsites that render icons from entity attributes or YAML config go through a whitelist sanitiser (`src/utils/iconSanitizer.js`) that allows only SVG-relevant tags and attributes. Strips `<script>`, `<iframe>`, every `on*=` event handler, `javascript:` / `data:` / `vbscript:` URLs in `href` / `xlink:href`, and `expression()` / `javascript:` inside inline `style`.
- **RSS link scheme check** (v1.1.1614): clicking an article in the News tab only opens URLs that match `^https?://`. A malicious RSS feed cannot smuggle a `javascript:` URL through `window.open`. Opened with `noopener,noreferrer`.
- **RSS HTML parsing via DOMParser** (v1.1.1614): article snippet stripping uses `DOMParser.parseFromString()` instead of `element.innerHTML = …`, so `<img onerror>` and similar loader-attribute side effects cannot fire during parsing.
- **Mount-error rendering via `textContent`** (v1.1.1616): the fallback error message shown when the card fails to mount is rendered as text, not HTML — error messages containing `<` characters cannot inject markup.

### Injection protection

- **`encodeURIComponent` on entity IDs in REST calls** (v1.1.1614): three template-literal call sites that built `?filter_entity_id=${entityId}` now URL-encode the parameter, blocking query-parameter injection through a maliciously-configured entity ID.
- **Regex metachar escaping in pattern matching** (v1.1.1616): user-defined exclusion patterns are compiled into regular expressions. The old translation escaped only `.` and converted `*`/`?` to wildcards, leaving `(`, `)`, `+`, `{` and other metachars to flow through. The current implementation escapes *all* metachars first, then selectively un-escapes the two intended wildcards. This blocks ReDoS patterns like `(a+)+b` that would otherwise freeze the browser tab. Pattern length is also capped at 256 characters.

### Prototype-pollution protection

- **Key filtering on storage merges** (v1.1.1616): the two settings-merge utilities (`src/utils/toastSettings.js`, `src/utils/systemSettingsStorage.js`) now drop `__proto__`, `constructor`, and `prototype` keys before spread-merging untrusted localStorage data. A localStorage entry crafted as `{ "__proto__": { "isAdmin": true } }` can no longer mutate `Object.prototype` for the rest of the page.

### Configuration validation

- **`setConfig` type-checks** (v1.1.1616): the Lovelace `setConfig(config)` entry point rejects non-object configurations and coerces `card_height` to a finite number clamped to `[50, 4000]` pixels. Garbage YAML cannot corrupt the layout.

### Defense in depth

- **`window._hass` non-enumerable** (v1.1.1614 + v1.1.1616): the global `window._hass` reference (used for boot-time fast-path) is defined with `enumerable: false` on both setter sites, so other custom cards or browser extensions scanning `Object.keys(window)` will not find it. Direct access still works for the legitimate consumers inside this card.

### Dependency hygiene

- **Zero known CVEs in shipped dependencies** (v1.1.1615): the bundled framework code is patched to current versions. `npm audit` reports 0 vulnerabilities. Notably, the high-severity Preact JSON VNode Injection ([GHSA-36hm-qxxp-pg3m](https://github.com/advisories/GHSA-36hm-qxxp-pg3m)) is closed.

---

## Audit history

| Version | Date | Scope | Outcome |
|---|---|---|---|
| [v1.1.1614](https://github.com/fastender/Fast-Search-Card/releases/tag/v1.1.1614) | 2026-05-22 | Five-vector OWASP-style code audit: secrets, XSS, external calls, sensitive data exposure, input validation | 5 findings, all fixed |
| [v1.1.1615](https://github.com/fastender/Fast-Search-Card/releases/tag/v1.1.1615) | 2026-05-22 | npm dependency audit (`npm audit`) | 11 CVEs, all patched. 1 runtime-relevant (Preact), 10 dev-tooling |
| [v1.1.1616](https://github.com/fastender/Fast-Search-Card/releases/tag/v1.1.1616) | 2026-05-22 | Browser-storage audit, `setConfig` validation, postMessage / cross-frame review, prototype-pollution review | 3 findings + 2 bonus issues, all fixed |

Each release commit message and Versionsverlauf entry describes the specific code changes if you want to read the diff.

---

## Reporting a security issue

If you find something that looks like a security issue, please **don't** open a public GitHub issue first — that exposes the problem to anyone watching the repository before there's a fix available.

Instead:

1. Open a private security advisory at https://github.com/fastender/Fast-Search-Card/security/advisories/new, **or**
2. Email the maintainer directly (the address is in the commit history)

A first response will follow within a few days. Coordinated disclosure is appreciated but not required.

---

## Scope note

This document covers the Fast Search Card itself — the JavaScript bundle you install via HACS. It does not cover:

- Home Assistant's own security posture (see the [HA security page](https://www.home-assistant.io/help/security/))
- The security of integrations you've installed in HA
- The security of other HACS frontend cards installed alongside this one
- The security of the underlying browser, OS, or network

If you have concerns about any of those, they're handled upstream and are outside the scope of this card.
