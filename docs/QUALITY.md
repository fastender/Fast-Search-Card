# Quality

This document is for users and contributors who want to understand where Fast Search Card stands on Home Assistant's quality bar — and where it doesn't.

If you just want the short version: **Fast Search Card is a Lovelace card, not an integration. Home Assistant's official [Integration Quality Scale](https://www.home-assistant.io/docs/quality_scale/) classifies every third-party card as `Custom` — the special tier outside the formal grading system. Measured against the same principles as graded integrations, the card would meet Silver across the board, with Gold-equivalent quality in every area except automated tests.**

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
| Automated tests | ❌ | **None.** Only blocker for Bronze-equivalent status |
| Basic end-user documentation | ✅ | README, FEATURES.md, SECURITY.md, PERFORMANCE.md, in-card Tips system entity |

**Result: 3/4.** Tests are the missing piece.

### 🥈 Silver — robustness

| Criterion | Status | Notes |
|---|---|---|
| Stable UX under various conditions | ✅ | Cross-browser tested via community feedback (Safari, Firefox, Chromium) |
| One or more active code owners | ✅ | Single active maintainer, 2,000+ releases since 2025-12 |
| Auto-recover from connection errors | ✅ | `hassRetryService` singleton + rAF-batched state updates |
| Auto-trigger re-authentication | n/a | Card runs in HA's already-authenticated browser context |
| Detailed docs + troubleshooting | ✅ | README has a Troubleshooting section, SECURITY.md is audit-grade |

**Result: 4/4 met** (auth row is n/a for the card context).

### 🥇 Gold — full feature

| Criterion | Status | Notes |
|---|---|---|
| Best end-user experience | ✅ | Quick Control, Bento, search-first, visionOS-inspired design |
| Auto-discovery | n/a | Lovelace card context — discovers what HA already discovered |
| Reconfigurable via UI | ✅ | Settings system entity with five sub-tabs, all configurable in-card |
| Translations | ⚠️ | English and German today; eight more on the roadmap ([#21](FEATURE_ROADMAP.md#21-localization-expansion)) |
| Extensive non-technical docs | ✅ | README, FEATURES.md, in-card Tips, demo videos and GIFs |
| Software updates through HA | ✅ | HACS handles versioning + update notifications |
| Full automated test coverage | ❌ | **None.** Same blocker as Bronze |
| Required for "Works with Home Assistant" program | n/a | Program reserved for device-providing integrations |

**Result: 5/6 met** (auth, auto-discovery, and program row are n/a). Tests block Gold-equivalent status.

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

Two real gaps separate the card from full Gold/Platinum alignment.

### Gap 1 — automated tests (the Bronze/Silver/Gold blocker)

The biggest improvement available. A first set of critical-path tests would unblock everything except Platinum at once.

What to test first:
- **DataProvider** — state shape, selector hooks, 3-tier-cache invalidation.
- **System-Entity Registry** — register/unregister, lookup by domain/id/category, multi-instance handling.
- **Search pipeline** — Fuse setup, intent parser, chip-input state machine.
- **Quick Control state machine** — Tap/Hold timings, amber-ring threshold, per-domain mode.

Roughly 4–8 hours of work for an initial suite covering the four critical paths. Stack: Vitest + Preact Testing Library. Lazy until then, but on the long list.

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
