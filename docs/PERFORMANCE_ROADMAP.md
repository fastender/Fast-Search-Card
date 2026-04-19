# Performance-Roadmap

Schrittweiser Plan zur Performance-Steigerung und Bundle-Reduktion. Erstellt 2026-04-19, Baseline **v1.1.1201**. Laufend aktualisiert.

## Constraints (unverhandelbar)
- **Single-File-Build** bleibt (`dist/fast-search-card.js` via `build.sh`)
- **Kein Lazy-Loading / Code-Splitting**
- HACS-Distribution muss weiter funktionieren

## Baseline (gemessen via rollup-plugin-visualizer, 2026-04-19)
- **JS-Bundle: 397 KB gzip** (1.49 MB raw)
- **CSS: 22 KB gzip** (137 KB raw)
- **860 Module**

### Fett-Zonen
| Block | gzip | Anteil |
|---|---:|---:|
| chart.js (+helpers) | ~100 KB | 12 % |
| framer-motion (+motion-dom) | ~117 KB | 14 % |
| react-markdown-Stack | ~75 KB | 9 % |
| src/system-entities | 134 KB | 16 % |
| src/components | 134 KB | 16 % |
| src/utils | 110 KB | 13 % |

---

## Phase 1: ✅ Build-Hygiene — **v1.1.1202**
**Ziel**: Einfache Wins ohne Code-Änderung.

1.1 **Terser statt esbuild minify** ✅
1.2 **postcss-purgecss + cssnano aktiviert** ✅

**Erwartet**: -15 bis -25 KB gzip. **Tatsächlich: -15.6 KB** (JS -12.7, CSS -2.9).

---

## Phase 3: ✅ react-markdown → marked — **v1.1.1203**
**Ziel**: Markdown-Stack halbieren.

- `react-markdown` (+ unified/micromark/mdast/hast) komplett raus (81 transitive deps)
- `marked` (12.4 KB) + `DOMPurify` (17.1 KB) rein
- Migration an einer Stelle: `VersionDetail.jsx` (kein GFM, keine Plugins, simple Markdown)

**Erwartet**: -55 bis -65 KB gzip. **Tatsächlich: -13.2 KB** — gzip ist non-linear, die 45-KB-Deps-Einsparung schrumpfte im komprimierten Bundle.

---

## Phase 4A: ✅ chart.js Tree-Shaking — **v1.1.1204**
**Ziel**: `chart.js/auto` durch explizite Registrierung ersetzen.

- uPlot verworfen: keine Bar-Charts möglich
- `chartConfig.js` existierte schon ungenutzt → aktiviert
- Beide Consumer (`ChartComponents.jsx`, `EnergyChartsView.jsx`) umgestellt

**Erwartet**: -50 KB gzip. **Tatsächlich: -10.7 KB** — chart.js/auto hat intern schon gutes Tree-Shaking, explizite Registrierung bringt nur die letzte Meile.

---

## Phase 2: ✅ Duplikat-Audit — **v1.1.1205**
**Ziel**: Code-Qualität, nicht Perf.

- `scheduleHandlers.js` in `scheduleUtils.js` gemerged (+2 unused Funktionen gelöscht)
- `historyDataProcessors.js` in `historyUtils.js` gemerged
- `formatTime()`-Name-Clash behoben (→ `formatClockTime` in scheduleConstants)
- 2 Files gelöscht

**Erwartet**: 1-5 KB. **Tatsächlich: -0.1 KB** (Qualitäts-Phase).

---

## Phase 5: Runtime-Perf (teilweise offen)

5.1 **Chrome Performance Profile auf Handy** — braucht User-Session. **Offen.**

5.2 ❌ **Icon-Sprite-Sheet** — **verworfen**: Icons sind animierte SVGs mit SMIL (`<animate>`, `<animateTransform>`), individuelle Farben und Delays pro Path. Sprite-Sheet mit `<use>` würde die Animationen und Farbkontexte brechen.

5.3 **CSS Container Queries** statt `useColumnCount` JS-Resize. **Offen.**

5.4 **Intersection Observer für Prefetch** statt Hover/Touchstart. **Offen** (braucht Profile-Daten um zu rechtfertigen).

---

## Phase 6: System-Entities-Audit (NEU — **als Nächstes**)
**Ziel**: 134 KB gzip unerforscht. Scan nach Duplikaten, unused Code, Refactoring-Möglichkeiten in Energy/Todos/News-Views.

**Größte Einzel-Files (gzip):**
- `EnergyDashboardDeviceView.jsx` 10.2 KB
- `EnergyDashboardDeviceEntity.js` 9.9 KB
- `EnergyChartsView.jsx` 7.9 KB
- `TodosSettingsView.jsx` 7.0 KB
- `TodosView.jsx` 6.5 KB
- `TodoFormDialog.jsx` 6.4 KB
- `NewsView.jsx` 5.4 KB
- `news/index.jsx` 5.0 KB
- = ~58 KB in 8 Files

**Erwartung**: -10 bis -30 KB gzip. **Risiko**: mittel (Entity-spezifische Regressions). **Aufwand**: 1-2 Sessions.

---

## Phase A (optional): framer-motion LazyMotion
**Ziel**: framer-motion von ~75 KB auf ~55 KB bringen.

- `motion.*` → `m.*` in 69 Files
- `LazyMotion features={domMax}`-Wrapper drum herum (domMax wegen `layout="position"` in SubcategoryBar)

**Erwartung**: -15 bis -25 KB gzip. **Risiko**: hoch (69 Files, Regressions in jedem möglich). **Aufwand**: 1-2 Sessions + intensives Testing.

Nicht sicher ob der Trade-Off den Aufwand wert ist.

---

## Phase 4B (optional): Chart.js → Chartist / frappe-charts
**Ziel**: chart.js von ~85 KB auf ~20 KB.

- Chartist (~10 KB) oder frappe-charts (~20 KB)
- Design-Regression wahrscheinlich
- Wrapper-Komponenten neu bauen, Tooltips nachbauen

**Erwartung**: -60 bis -70 KB gzip. **Risiko**: sehr hoch. **Aufwand**: 2-3 Sessions.

---

## Bundle-Progression (tatsächlich gemessen)

| Stand | Version | JS gzip | CSS gzip | Total | Δ Total |
|---|---|---:|---:|---:|---:|
| Baseline | 1201 | 397.0 | 22.2 | 419.2 | — |
| nach Phase 1 | 1202 | 384.3 | 19.2 | 403.5 | -15.6 |
| nach Phase 3 | 1203 | 371.1 | 19.2 | 390.3 | -13.2 |
| nach Phase 4A | 1204 | 360.4 | 19.2 | 379.6 | -10.7 |
| nach Phase 2 | 1205 | 360.3 | 19.2 | 379.5 | -0.1 |
| **Zwischenstand** | | | | **379.5** | **-39.7 KB (-9.5 %)** |

**Realistisches weiteres Potenzial unter Constraints:**
- Phase 6 (System-Entities): -10 bis -30 KB
- Phase A (LazyMotion): -15 bis -25 KB (hohes Risiko)
- Phase 4B (Chart-Ersatz): -60 bis -70 KB (sehr hohes Risiko)
- Phase 5.x (Runtime): keine gzip-Einsparung

**Bestes realistisches Endziel bei niedrig/mittel Risiko: ~340 KB gzip** (statt der ursprünglichen 235-KB-Fantasie).

---

## Bewusst NICHT auf der Liste
- **Lazy-Loading / Code-Splitting** — bricht Single-File
- **Preact Signals** — Bottlenecks bereits gelöst (siehe Session-Notes 3.1)
- **Web Worker für Fuse** — Overhead > Gewinn (siehe Session-Notes 3.2)
- **TypeScript-Full-Migration** — 0 Runtime-Gewinn, sehr hoher Aufwand
- **Phase 5.2 Icon-Sprite** — verworfen wegen SMIL-Animationen

---

## Reihenfolge-Empfehlung (aktualisiert)
1. ✅ Phase 1
2. ✅ Phase 3
3. ✅ Phase 4A
4. ✅ Phase 2
5. **→ Phase 6 (System-Entities-Audit)** ← als Nächstes
6. Phase 5.1 (Chrome Profile, sobald User-Session möglich)
7. Phase A oder 4B (hohes Risiko, nur wenn sich Phase 6 lohnt)
