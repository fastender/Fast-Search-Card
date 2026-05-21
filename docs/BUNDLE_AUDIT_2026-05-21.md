# Bundle-Size-Audit — 2026-05-21 (v1.1.1583)

Snapshot of the production bundle composition. Run again with `ANALYZE=1 npm run build` + `node analyze-bundle.js` to regenerate. The numbers in this document are from the v1.1.1583 build.

## Headline numbers

| Metric | Size |
|---|---|
| `dist/fast-search-card.js` (raw, with CSS-inject wrapper) | 1.7 MB |
| Vite JS chunk (raw) | 1,587 KB |
| Vite JS chunk (gzip) | **417 KB** |
| Vite CSS chunk (raw) | 189 KB |
| Vite CSS chunk (gzip) | **30 KB** |
| Total payload (gzip) | **~447 KB** |
| Source-vs-deps split (gzip) | src: 470 KB · deps: 290 KB |

417 KB JS gzip is on the higher end for a Lovelace card. On a 4G connection (~5–10 MB/s) it's a 50–100 ms download — not catastrophic. Over slow networks (3G ~1 MB/s) it's 400 ms+ which is noticeable.

## Top 15 modules (gzip)

| KB (gzip) | KB (raw) | Module |
|---:|---:|---|
| 62.6 | 313.5 | `chart.js/dist/chart.js` |
| 22.5 | 88.8 | `chart.js/dist/chunks/helpers.dataset.js` |
| 17.1 | 63.4 | `dompurify` |
| 13.6 | 66.6 | `framer-motion/.../projection/node/create-projection-node.mjs` |
| 12.4 | 40.9 | `marked/lib/marked.esm.js` |
| 11.7 | 43.0 | `fuse.js` |
| 10.2 | 34.3 | `src/utils/translations/languages/de.js` |
| 9.8 | 45.9 | `src/utils/deviceConfigs.js` |
| 9.5 | 42.1 | `src/system-entities/.../EnergyDashboardDeviceEntity.js` |
| 8.8 | 31.4 | `src/utils/translations/languages/en.js` |
| 8.0 | 55.0 | `src/system-entities/calendar/CalendarEventDialog.jsx` |
| 7.9 | 37.2 | `src/system-entities/.../EnergyChartsView.jsx` |
| 7.6 | 25.1 | `src/utils/musicAssistant.js` |
| 7.6 | 37.4 | `src/system-entities/news/NewsView.jsx` |
| 6.8 | 36.2 | `src/system-entities/todos/TodosView.jsx` |

## Aggregated by source / dependency

| KB (gzip) | % | Bucket |
|---:|---:|---|
| 208.7 | 24.4% | `src/system-entities/` |
| 194.2 | 22.7% | `src/components/` |
| 114.5 | 13.4% | `src/utils/` |
| 85.1 | 9.9% | `chart.js` |
| 82.7 | 9.7% | `framer-motion` |
| 42.2 | 4.9% | `motion-dom` (framer-motion peer) |
| 37.9 | 4.4% | `src/assets/` |
| 17.1 | 2.0% | `dompurify` |
| 12.4 | 1.4% | `marked` |
| 11.7 | 1.4% | `fuse.js` |
| 8.9 | 1.0% | `preact` |

## Actionable items (with realistic estimates)

### 🟢 Worth doing

1. **Replace `marked` + `dompurify` with a tiny custom Markdown subset (-29 KB / -7%)**
   Only consumers: `VersionDetail.jsx`, `TippDetail.jsx`. Used to render the changelog + tip-detail content. Likely uses just headings, bold/italic, lists, code spans, links. A 50-line `marked`-replacement that handles only those + HTML-escapes everything else would drop both deps. Risk: missing edge cases in the markdown content already shipped. Estimate: 2 h + careful regression testing against existing tipps + versionsverlauf entries.

2. **Translation split build (-9 KB / -2% per locale)**
   `de.js` and `en.js` are both fully bundled. The user only ever uses one. A vite-config branch that builds `fast-search-card.de.js` + `fast-search-card.en.js` would let HACS deliver the right one. Operational cost: dual artifacts, HACS UI choice. Estimate: 2 h plus distribution work. Probably not worth it — 9 KB on a 417 KB bundle is 2%.

### 🟡 Theoretically worth doing, blocked by constraint

3. **Code-split `chart.js` (-85 KB / -20%)**
   `chart.js` is used only by `EnergyChartsView` + `HistoryTab` — both on click-deep paths, not on boot. `import('chart.js')` would isolate it.
   **Blocker:** `vite.config.js` has `inlineDynamicImports: true` because HACS expects a single-file artifact. Lifting that constraint means dropping the single-file delivery and reworking the Custom Element wrapper to load chunks lazily. Not realistic without changing the HACS deployment story.

### 🔴 Not worth chasing

4. **`framer-motion` (125 KB combined with motion-dom)**
   Imported in 60+ files. Replacing with native CSS transitions is a multi-day rewrite for unclear payback — many of the animations use spring physics that CSS can't reproduce.
5. **`chart.js` internal size**
   Already tree-shaken in `src/utils/chartConfig.js` (only LineController, BarController, etc registered). Can't shrink further.
6. **`fuse.js` (12 KB)**
   Core to the search experience. Lighter alternatives (mini-search) save maybe 4 KB at the cost of feature parity work. Not a meaningful win.

### 📊 Structural Refactor LOC (not bundle-size, but related)

The top-LOC source files in the bundle correspond exactly to the deferred structural-refactor list in `~/.claude/.../project_structural_refactor_plan.md`:
- `CalendarEventDialog.jsx` (8.0 KB gzip / 55 KB raw)
- `NewsView.jsx` (7.6 KB / 37 KB)
- `TodosView.jsx` (6.8 KB / 36 KB)
- `GeneralSettingsTab.jsx` (6.2 KB / 57 KB)
- `StatsBarSettingsTab.jsx` (5.8 KB / 58 KB)
- `TodosSettingsView.jsx` (5.7 KB / 56 KB)

Refactoring these into sub-state + context-lifting splits *won't* shrink the bundle (the code still exists, just in more files), but it would improve maintainability and might enable later lazy-loading if HACS ever supports multi-file delivery.

## What changed since the last (implicit) audit

No prior audit exists in `docs/`. Baseline established here. Compare future audits against:
- 417 KB gzip JS / 30 KB gzip CSS / 447 KB total
- Top dep: chart.js (85 KB, 10%)
- Top src bucket: system-entities (209 KB, 24%)

## Regeneration command

```bash
bash scripts/audit-bundle.sh
```

Runs vite with `ANALYZE=1`, parses `dist/bundle-stats.html` via `analyze-bundle.js`, and restores `dist/fast-search-card.js` from git (vite's default `emptyOutDir: true` wipes the wrapper file otherwise — we hit this once during this audit run and had to restore manually).

To produce a real fresh production bundle afterwards, run `./build.sh`.
