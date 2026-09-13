# Quality

This document is for users and contributors who want to understand where Fast Search Card stands on Home Assistant's quality bar — and where it doesn't.

If you just want the short version: **Fast Search Card is a Lovelace card, not an integration. Home Assistant's official [Integration Quality Scale](https://www.home-assistant.io/docs/quality_scale/) classifies every third-party card as `Custom` — the special tier outside the formal grading system. Measured against the same principles as graded integrations, the card meets Bronze, most of Silver and Gold, and falls short in three places: automated tests cover the main surfaces but not the newest modules, there is no dedicated troubleshooting guide, and the code is not typed.**

The rest of this document is the long version, so you can verify that for yourself.

---

## What this means in practice

The HA Quality Scale grades Python integrations on user experience, code quality, and developer experience. Four cumulative tiers — Bronze, Silver, Gold, Platinum — each adding requirements on top of the one below.

Lovelace cards are explicitly out of scope. Every third-party card lands in the `Custom` special tier by definition, regardless of quality. No card is eligible for an official Bronze/Silver/Gold/Platinum badge.

This document does not claim one. It maps the Scale's criteria onto Fast Search Card transparently — what would pass if the card were assessable, what wouldn't, what doesn't apply.

---

## Tier-by-tier mapping

### 🥉 Bronze — baseline

| Criterion | Status | Notes |
|---|---|---|
| Easy UI setup | ✅ | HACS install + one line of YAML |
| Source adheres to basic coding standards | ✅ | Refactor discipline (13-pass session model, ~75k LOC source, consistent patterns) |
| Automated tests | ✅ | Playwright suite since v1.1.2191: 13 spec files, 107 tests, one shared harness (`tests/harness/card.js`), Chromium, run serially |
| Basic end-user documentation | ✅ | README, FEATURES.md, SECURITY.md, PERFORMANCE.md, in-card Tips system entity |

**Result: 4/4.**

### 🥈 Silver — robustness

| Criterion | Status | Notes |
|---|---|---|
| Stable UX under various conditions | ✅ | Cross-browser tested via community feedback (Safari, Firefox, Chromium); failed service calls report themselves and roll back (v1.1.2403); a render error is contained to the broken tile or view (v1.1.2404) |
| One or more active code owners | ✅ | Single active maintainer, 2,000+ releases since 2025-12 |
| Auto-recover from connection errors | ✅ | `hassRetryService` singleton + rAF-batched state updates |
| Auto-trigger re-authentication | n/a | Card runs in HA's already-authenticated browser context |
| Detailed docs + troubleshooting | ⚠️ | README, FEATURES.md and SECURITY.md are detailed; there is no dedicated troubleshooting section yet |

**Result: 3/4 met, 1 partial** (auth row is n/a for the card context). Troubleshooting documentation is the gap.

### 🥇 Gold — full feature

| Criterion | Status | Notes |
|---|---|---|
| Best end-user experience | ✅ | Quick Control, Bento, search-first, visionOS-inspired design |
| Auto-discovery | n/a | Lovelace card context — discovers what HA already discovered |
| Reconfigurable via UI | ✅ | Settings system entity with five sub-tabs, all configurable in-card |
| Translations | ⚠️ | English and German today; eight more on the roadmap ([#21](FEATURE_ROADMAP.md#21-localization-expansion)) |
| Extensive non-technical docs | ✅ | README, FEATURES.md, in-card Tips, demo videos and GIFs |
| Software updates through HA | ✅ | HACS handles versioning + update notifications |
| Full automated test coverage | ⚠️ | **Partial.** The suite covers the main surfaces (see Gap 1); modules added after v1.1.2317 have no tests yet |
| Required for "Works with Home Assistant" program | n/a | Program reserved for device-providing integrations |

**Result: 5/6 met** (auth, auto-discovery, and program row are n/a). Test coverage is the open criterion.

### 🏆 Platinum — code excellence

| Criterion | Status | Notes |
|---|---|---|
| Coding standards + best practices | ✅ | Established patterns: `memo()` with custom comparators, custom hooks, refactor cadence |
| Fully typed with type annotations | ❌ | JavaScript only, not TypeScript — long-term gap |
| Clear code comments | ✅ | Version markers (`v1.1.XXXX:` prefixes) document non-obvious code paths |
| Fully async code base | ✅ | Preact + Promises + async-batched IndexedDB writes |
| Efficient data handling | ✅ | rAF batching, virtua virtualization, LRU caches, three-tier persistence (localStorage → IndexedDB → memory) |

**Result: 4/5 met.** TypeScript adoption is the Platinum gap.

---

## What is not applicable

Four Quality Scale criteria simply don't translate to the Lovelace card context. They're not failures — they're outside the card's scope:

| Criterion | Why it's n/a |
|---|---|
| Auto-discovery of devices | Cards display what HA has already discovered; there is no separate discovery layer |
| Auto re-authentication | Card runs inside HA's already-authenticated browser session — no separate auth |
| Software/firmware updates for devices | Card is not a device backend; HACS handles card updates |
| "Works with Home Assistant" program | Program is reserved for integrations that provide devices |

---

## Roadmap to higher quality alignment

Three gaps separate the card from full Gold/Platinum alignment: test coverage, troubleshooting documentation and typing.

### Gap 1 — test coverage (the Gold gap)

The card has an end-to-end suite: **Playwright, 13 spec files, 107 tests** (`tests/`, added in v1.1.2191, last changed 2026-08-08 at v1.1.2317). Every test mounts the real card through one harness (`tests/harness/card.js`) with a mock Home Assistant, in Chromium, one worker, serially — roughly eight minutes for a full run. It covers the bento start screen and its zen curtain, search and sensor subcategories, the detail view, calendar and to-dos, the notification center and watches, the island, the sidebar, settings, the ocean and weather tiles, and the data provider. One spec checks that class names survive the production CSS build.

What it does not cover yet:
- the modules added after the suite's last update (v1.1.2317): the height ladder (`hoehenLeiter`), the idle service (`leerlaufStore`), deep rest, wake sources, display handoff, photo frame, the version watcher and its stale-code line, dictation, people per list, the house chronicle, the undo store and the `MorphPopup` window;
- Shadow DOM: the harness mounts the card without a shadow root, so event-retargeting problems stay invisible;
- WebKit/Safari: the suite runs Chromium only.

Tests run when the maintainer asks for a run; they are not part of the release script.

### Gap 2 — TypeScript (the Platinum gap)

The codebase is plain JavaScript with JSDoc-style comments. TypeScript would close the Platinum criterion but is a meaningful migration: ~75k LOC source, ~368 files, custom hooks with non-trivial type shapes.

Not a near-term priority. Would happen as part of a larger refactor track, not as its own sprint.

### Gap 3 — companion integration (the long-term play)

A real Python integration on the HA side could go through the Quality Scale officially. It would also unlock features that need server-side persistence (Sketchpad sync, predictive-suggestion training data, notification history beyond browser cache).

Already on the roadmap as **#22 Companion Integration** ([roadmap link](FEATURE_ROADMAP.md#22-companion-integration-long-term)). Status: long-term, exploratory. The card stays a full standalone product; the integration would be a power-user opt-in.

---

## What the card already does well

Where the card meets or exceeds the Quality Scale principles without needing changes:

- **Single-file shipped artifact** with no proprietary blob, no telemetry, no external API calls beyond GitHub-hosted markdown — see [SECURITY.md](SECURITY.md) for the full audit.
- **Three-tier caching** with a hot-path that's measurably fast — see [PERFORMANCE.md](PERFORMANCE.md) for numbers reproducible on any install.
- **Release cadence and version-history hygiene** that would meet the Scale's "active code owner" requirement many times over (2,000+ commits, every release documented in the in-card changelog).
- **Documentation density** that consistently exceeds what most graded integrations ship with.

---

## Audit history

| Date | Card version | Scope | Notes |
|---|---|---|---|
| 2026-06-21 | v1.1.1924 | Initial Quality Scale alignment assessment | Bronze 3/4 · Silver 4/4 · Gold 5/6 · Platinum 4/5. Tests + TypeScript are the only material gaps. |
| 2026-09-13 | v1.1.2409 | Refresh against the current code | Bronze 4/4 (Playwright suite since v1.1.2191) · Silver 3/4 + 1 partial (no troubleshooting section — the earlier ✅ claimed one that does not exist) · Gold 5/6 (coverage partial) · Platinum 4/5. |

---

## References

- [Home Assistant Quality Scale](https://www.home-assistant.io/docs/quality_scale/) — official documentation
- [Developer documentation on the integration quality scale](https://developers.home-assistant.io/docs/core/integration-quality-scale/) — technical detail
- [Works with Home Assistant program](https://www.home-assistant.io/works-with/) — device-integration certification, scope for context
- [SECURITY.md](SECURITY.md) — the card's full security audit
- [PERFORMANCE.md](PERFORMANCE.md) — the card's performance audit
- [FEATURE_ROADMAP.md](FEATURE_ROADMAP.md) — the roadmap entries that close the remaining gaps

---

## Scope note

This document is a **self-assessment** against publicly documented criteria. It is not a Home Assistant project audit, nor a certification of any kind. Use it to understand how the card aligns with HA's stated standards — and to track where it could go.
