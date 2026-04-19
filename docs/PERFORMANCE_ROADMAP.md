# Performance-Roadmap

Schrittweiser Plan zur Performance-Steigerung und Bundle-Reduktion. Erstellt 2026-04-19, Baseline **v1.1.1201**.

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

## Phase 1: Risk-free Build-Hygiene
**Ziel**: Einfache Wins ohne Code-Änderung.

1.1 **Terser statt esbuild minify** — Konfig-Change in `vite.config.js`. Kostet ~5 s Build-Zeit mehr, spart 5–15 KB gzip.
1.2 **postcss-purgecss aktivieren** — ist installiert, aber nicht im Plugin-Stack. CSS-Einsparung 20–40 % realistisch (→ 13–18 KB gzip).

**Erwartung**: -15 bis -25 KB gzip. **Risiko**: niedrig. **Aufwand**: 1 Session.

---

## Phase 2: Duplikat-Audit in `src/utils/`
**Ziel**: Code-Qualität, nicht Perf. Aber Voraussetzung für spätere Refactorings.

Verdächtige Kandidaten (Overlap vermutet):
- `domainHandlers.js` ↔ `domainHelpers.js`
- `deviceConfigs.js` ↔ `deviceHelpers.js`
- `scheduleUtils.js` ↔ `scheduleHandlers.js` ↔ `scheduleConstants.js`
- `historyUtils.js` ↔ `historyDataProcessors.js` ↔ `historyConstants.js`
- `formatters/` ↔ `translations.js`

**Vorgehen**: `simplify`-Skill über `src/utils/` laufen lassen → Report → gezielt mergen / dedupen.

**Erwartung**: 1–5 KB gzip Einsparung, Wartbarkeit deutlich besser. **Risiko**: mittel (Refactoring-Regression). **Aufwand**: 1–2 Sessions.

---

## Phase 3: react-markdown → marked
**Ziel**: Markdown-Stack halbieren.

**Vorab-Check**: Wo wird Markdown tatsächlich genutzt? Wenn nur für News/Release-Notes mit Basic-Features (Headlines, Listen, Links, Code), reicht `marked` locker.

**Vorgehen**:
1. Markdown-Usage auflisten (`grep react-markdown` + Feature-Audit: GFM? Tables? Custom-Renderer?)
2. Kompatibilitäts-Test mit `marked` + `DOMPurify` auf realen Inhalten
3. Migration + Rendering-Vergleich

**Erwartung**: **-55 bis -65 KB gzip**. **Risiko**: niedrig-mittel (Rendering-Diffs). **Aufwand**: 1 Session.

---

## Phase 4: chart.js → uPlot
**Ziel**: Größter Einzel-Shrink.

**Vorab-Check**: Chart-Inventory anlegen — welche Chart-Typen werden genutzt? Line, Bar, Pie, Doughnut? uPlot macht nur Line/Area — wenn Bar/Pie gebraucht werden, fällt uPlot weg.

**Vorgehen**:
1. Chart-Inventory aus `src/components/charts/` + `src/utils/chartjs/`
2. uPlot-Wrapper-Komponente bauen, die Chart.js-API mimikt (Drop-In so weit möglich)
3. Pro Chart-Typ migrieren, visuell vergleichen
4. Chart.js entfernen

**Alternativen falls uPlot nicht passt**: **Chartist** (~10 KB, Line/Bar/Pie) oder **frappe-charts** (~20 KB).

**Erwartung**: **-70 bis -85 KB gzip**. **Risiko**: hoch (API-Bruch, Look-Diffs). **Aufwand**: 2–3 Sessions.

---

## Phase 5: Runtime-Perf
**Ziel**: FPS / Thermal. Bundle bleibt gleich, gefühlte Schnelligkeit steigt.

5.1 **Chrome Performance Profile** auf Handy aufnehmen → echte Hotspots finden statt raten. **Immer zuerst profilen, erst dann optimieren.**
5.2 **Icon-Sprite-Sheet** — 48 inline SVG-Komponenten → ein `<symbol>`-Sprite, Cards referenzieren via `<use>`. Weniger Parse-Zeit, weniger VDOM.
5.3 **CSS Container Queries** statt `useColumnCount` JS-Resize-Listener → Main-Thread entlastet.
5.4 **Intersection Observer für Prefetch** statt Hover/Touchstart (falls Chrome-Profile zeigt, dass Prefetch teuer ist).

**Erwartung**: keine gzip-Einsparung, aber spürbar weniger Jank + kühleres Handy. **Risiko**: niedrig. **Aufwand**: 1–3 Sessions.

---

## Erwartete Bundle-Progression

| Stand | Bundle gzip | Delta |
|---|---:|---:|
| Baseline v1.1.1201 | 397 KB | — |
| nach Phase 1 | ~377 KB | -20 |
| nach Phase 2 | ~375 KB | -2 |
| nach Phase 3 | ~315 KB | -60 |
| nach Phase 4 | ~235 KB | -80 |
| nach Phase 5 | ~235 KB | — (runtime-only) |

**Ziel: ~235 KB gzip** — das wären **-40 % vs. heute**, bei gleichem Feature-Set und Single-File.

---

## Bewusst NICHT auf der Liste
- **Lazy-Loading / Code-Splitting** — bricht Single-File
- **framer-motion austauschen** — überall genutzt, Migration unverhältnismäßig
- **Preact Signals** — Bottlenecks bereits gelöst (siehe Session-Notes 3.1)
- **Web Worker für Fuse** — Overhead > Gewinn (siehe Session-Notes 3.2)
- **TypeScript-Full-Migration** — 0 Runtime-Gewinn, sehr hoher Aufwand

---

## Reihenfolge-Empfehlung
1. Phase 1 (schnell, risk-free)
2. Phase 3 (react-markdown → marked, klarer Gewinn, überschaubar)
3. Phase 5.1 (Chrome Profile → zeigt wo's wirklich brennt)
4. Phase 4 (chart.js → uPlot, größter Hebel)
5. Phase 2 (Duplikat-Audit, parallel möglich)
6. Phase 5.2/3/4 (basierend auf Profile-Resultaten)
