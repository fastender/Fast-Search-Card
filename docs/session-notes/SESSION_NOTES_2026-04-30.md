# Session Notes — 2026-04-30

**Stand am Ende:** v1.1.1309. **8 Releases an einem Tag** (v1.1.1302 → v1.1.1309).

Schwerpunkt-Bogen:

- **Eine Component, ein Tag:** alle 8 Releases drehen sich um die `LiquidGlassSwitch`-Komponente für die 4 Toggles in der Bambu-3D-Drucker-„Sonstiges"-Sektion (`PrinterMiscList.jsx`).
- **Iterations-Pfad:** erste Version → Smoothness-Pass → zwei Detours (clip-path-Reveal, klassischer iOS-Slider) → User designed eigenes Snippet → 1:1-Port als „endgültige Form" → Sizing/Color/Hover-Konflikte → A11y-Bugfixes → finales V4 aus 6-Varianten-Mockup.
- **Gemerkt:** wenn der User selbst eine HTML-Snippet-Referenz liefert, ist das das schnellste Konvergenzmittel. Genauso für Final-UI-Decisions: Multi-Varianten-Mockup statt erraten.

---

## 1. Release-Tabelle

| Version | Was |
|---|---|
| **1302** | **Neue `LiquidGlassSwitch`-Component** (iOS-26 Liquid Glass) ersetzt Inline-Slider-Markup in `PrinterMiscList.jsx`. SVG-Lens + Specular-Schimmer + Squish-Anticipation. Drop-in-kompatibel zu `IOSToggle`-API. |
| 1303 | Flicker-Fix (Knob bleibt opak bei Bg-Crossfade, dezenter Squish, GPU-Promotion via `transform: translateZ(0)`, kein `whileTap`-Konflikt mit der CSS-Choreografie). |
| 1304 | **Detour:** Rewrite zu „Liquid-in-Glass"-Metapher mit `clip-path`-Reveal nach iOS-26-Figma-Referenz. SVG-Filter-Layer komplett entfernt. |
| 1305 | **Zweiter Detour:** zurück auf klassisches iOS-Slider-Design (Blau-Akzent statt Grün, alle Liquid-Glass-Effekte raus). User-Feedback: 1304 war zu elaboriert. Unter 60 Zeilen CSS gesamt. |
| **1306** | **1:1-Port von User-designed `switch-snippet.html`** als finale Form. Parametrisierte CSS-Vars (`--w/--h/--pad/--dot-w/--dot-h/--travel/--accent`), 4 Größen (`s-sm/s-md/s-lg/s-xl`), Press-and-Hold-Morph (Knob stretcht horizontal, Track-Akzent dimmt), Lens-Flash + Specular-Shimmer. `LiquidGlassFilterDefs.jsx` wieder hergestellt (war in 1304/1305 gelöscht). `is-prim`-Animation-Reset-Hack (style.animation = 'none' → offsetWidth → ''). |
| 1307 | **Real-HACS-Feedback:** in `PrinterMiscList.jsx` jetzt `size="sm"` (64×30) + `accent="#0a84ff"` (iOS Dark-Blue). OFF-Track umgestellt von `linear-gradient(#e8e8eb→#d6d6db)` auf `rgba(120,120,128,0.32)` translucent-gray gegen Row-Hover-Konflikt (auf weißem Hover-Bg ist der Snippet-Original-Gradient unsichtbar). |
| 1308 | **Zwei A11y-Bugs aus echter Installation:** (1) `:focus-within`-Outline blieb nach Click haften → ersetzt durch `:has(input:focus-visible)` (keyboard-only). (2) Row-Hover für `.ios-item:has(.switch)` unterdrückt mit `transform/bg/shadow: none !important` — Toggle hat eigene Press-Feedback-Mechanismen, Row-Hover war redundant + produzierte den weißen-Bg-Konflikt. |
| **1309** | **Finale Form V4 aus 6-Varianten-Mockup.** User wollte Row-Hover beibehalten (= iOS-Look), nur Toggle hover-resistent. V4 (Combined): Track-Border `inset 0 0 0 1.5px rgba(0,0,0,0.16)` + Knob-Inset-Border `inset 0 0 0 1px rgba(0,0,0,0.12)` (auch in alle 3 `spec-flash`-Keyframe-Stops nachgepflegt) + Track-Bg-Alpha 0.32→0.36. Row-Hover-Suppression aus 1308 entfernt. **Endgültige Form.** |

---

## 2. Iterations-Pfad in einem Bild

```
1302  iOS-26 Liquid-Glass (Lens + Specular + Squish)
  │
1303  Polish: Flicker-Fix
  │
1304  Detour →  clip-path-Reveal (Figma-Referenz)
  │
1305  Detour →  klassischer iOS-Slider in Blau (User: zu elaboriert)
  │
1306  User liefert switch-snippet.html
        ↓ 1:1-Port als „endgültige Form"
        Parametrisierte Vars, 4 Größen, Press-and-Hold-Morph
  │
1307  Real-HACS-Test → size=sm, accent=blue, OFF translucent-gray
  │
1308  Real-HACS-Test → :focus-visible + Row-Hover-Suppression
  │
1309  6-Varianten-Mockup → V4 final
        Track-Border + Knob-Border + Track 36% (Toggle hover-resistent)
        Row-Hover wieder aktiv
```

---

## 3. Component-API (Stand 1309)

```jsx
<LiquidGlassSwitch
  size="sm"          // 'sm'(64×30) | 'md'(86×38, default) | 'lg'(128×56) | 'xl'(200×88)
  accent="#0a84ff"   // CSS-Color, --accent-d wird via color-mix(in oklab, ...) automatisch 12% dunkler abgeleitet
  checked={...}
  onChange={(newValue, event) => ...}
  disabled={...}
  stopPropagation={...}
  className={...}
  style={...}
/>
```

Drop-in-kompatibel mit `IOSToggle`. 150-ms-Dedupe + `stopPropagation`-Support unverändert. Default-Größe ist `s-md`, Default-Akzent grün — `PrinterMiscList.jsx` overridet beide auf `sm` + `#0a84ff`.

**Drei Toggle-Komponenten existieren jetzt im Repo nebeneinander:**
- `IOSToggle` (Text "An/Aus") — Standard für alle Settings-Listen
- `PowerToggle` (Icon, circular slider)
- `LiquidGlassSwitch` (visual pill) — Spezial für Hero-Kontexte mit farbigem/glasigem Hintergrund

---

## 4. Wichtigste Pattern aus dem Tag

### 4.1 Snippet-driven UI-Convergence

Nachdem 1304 + 1305 zwei Detours waren, hat der User selbst ein `switch-snippet.html` designed und „1:1 wie im Snippet" als finale Form gesetzt. Das war der schnellste Konvergenzweg — Diskussionen über Geschmack entfielen, der Port war mechanisch.

**Pattern für Zukunft:** wenn UI-Iterationen divergieren, früh nach einer User-Reference fragen (Snippet, CodePen, Figma, Screenshot).

### 4.2 Multi-Varianten-Mockup für Final-Decisions

In 1309 hatte der User nach 1308 das Hover-Verhalten beanstandet (Row-Hover-Suppression war zu radikal). Statt zu erraten welche Variante er mag, habe ich `switch-mockup-v1308-decision.html` mit 6 parallelen Varianten (V0-V5) gerendert — User wählte visuell **V4 (Combined)**.

**Pattern für Zukunft:** bei UI-Decisions mit ≥2 plausiblen Pfaden, alle Varianten gleichzeitig in einem Standalone-HTML-Mockup zeigen. Spart Iterations-Cycles.

### 4.3 Specular-Animation überschreibt Static-Borders

In 1309 musste die neue Knob-Inset-Border `inset 0 0 0 1px rgba(0,0,0,0.12)` in **alle drei Stops** der `spec-flash`-Keyframes (0 %, 12-80 %, 100 %) nachgepflegt werden. Sonst hätte die Border während der 0.55 s Flip-Animation für die Dauer der Specular-Animation weggeblitzt.

**Lesson:** Wenn man Static-Decoration-Layer auf einem Element ergänzt, das mid-Animation komplett überschriebene `box-shadow`-Stacks hat → die Decoration in jeden Keyframe-Stop nachpflegen.

### 4.4 Snippet-Treue vs. Praxis-Tauglichkeit

Der Original-Snippet-Gradient (1306, `linear-gradient(#e8e8eb→#d6d6db)`, helles Grau) wurde in 1307 auf `rgba(120,120,128,0.32)` umgestellt — Snippet-Treue an dieser Stelle bewusst aufgegeben, weil der helle Gradient auf weißen Row-Hover-Bgs unsichtbar wurde. Translucent-Layer ist auf jedem Hintergrund als „leicht-dunkler-als-Parent" sichtbar.

**Lesson:** 1:1-Snippet-Ports brechen, wenn der Snippet auf neutralen Hintergründen designed wurde, das Ziel-Layout aber Hover-Effekte mit hellem Bg hat. Translucent-iOS-System-Pattern statt fixer Gradients.

### 4.5 `:focus-within` vs `:has(input:focus-visible)`

Der ursprüngliche Pen + 1306-Port hatte `:focus-within { outline: 3px ... }` auf dem `.switch`-Label. Das produzierte in 1308 den Click-Outline-Bleibe-Bug: nach Maus-Click bleibt das Input gefocused, Outline klebt sichtbar.

Fix: `:has(input:focus-visible)` — `:focus-visible` triggert nur bei Keyboard-Navigation (Browser-Heuristik), nicht bei Maus-Click. `:has()` als Parent-Selector um den Outline auf der Label statt nur auf dem Input zu rendern.

Browser-Support: `:has()` braucht Safari 15.4+ / Chrome 105+ / Firefox 121+ — für HACS-Nutzer 2026 universell.

---

## 5. Files touched (gesamt-Session)

| File | Was passierte |
|---|---|
| `src/components/common/LiquidGlassSwitch.jsx` | **Neu in 1302**, kompletter Rewrite in 1304 (clip-path), nochmal kompletter Rewrite in 1306 (Snippet-Port). Letzter Stand: Snippet-Port mit Pointer-Hooks für `is-pressed` + Animation-Reset-Hook. |
| `src/components/common/LiquidGlassSwitch.css` | **Neu in 1302**, laufend angepasst, finale Form in 1309 mit Track-Border + Knob-Inset-Border + 0.36-Alpha. |
| `src/components/common/LiquidGlassFilterDefs.jsx` | **Neu in 1302** (SVG `<filter id="mini-liquid-lens">` mit feImage + feDisplacementMap), **gelöscht in 1304/1305**, **wieder hergestellt in 1306**. |
| `src/index.jsx` | `<LiquidGlassFilterDefs />` global gemountet (1302), entfernt (1304/1305), wieder eingefügt (1306). |
| `src/system-entities/entities/integration/device-entities/components/PrinterMiscList.jsx` | Inline-`<div className="ios-toggle">`-Markup (4 Toggles) durch `<LiquidGlassSwitch>` ersetzt (1302), props `size="sm"` + `accent="#0a84ff"` ergänzt (1307). |
| `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` | Version-Bumps (8×). |
| `src/system-entities/entities/versionsverlauf/index.js` | Version-Bumps (8×). |

**Standalone-Mockup-Files (nicht im Repo):**
- `switch-snippet.html` — User-Design, Quelle für 1306-Port
- `switch-mockup-v1308-decision.html` — 6 Varianten parallel, Quelle für 1309 V4-Choice

---

## 6. Was offen ist

- **Slider-Thumbs (Zieltemperatur Düse / Druckbett)** in derselben Bambu-Detail-View haben weiterhin den Browser-Default-Focus-Ring (3 px Blue-Outline auf nativen `<input type="range">`-Slidern). In 1308 erwähnt, nicht behoben — separater Fix in `.range-slider-input`-CSS (`outline: none` oder eigene `:focus-visible`-Behandlung) wenn der User es anspricht.
- Component-Default in `LiquidGlassSwitch` bleibt `s-md` Grün — andere Use-Cases können `size="sm" accent="..."` Prop-Kombi setzen wenn der Hover-Konflikt auftritt. Aktuell nutzen Todos/News etc. die `IOSToggle`-Text-Variante, also kein Konflikt.

---

## 7. Cliffhanger / morgen

Kein offener Plan. Die LiquidGlass-Iteration ist mit V4 abgeschlossen. Falls in Zukunft jemand wieder den Liquid-Glass-Look will, sind die 1302-1306-Iterationen samt Begründung im Versionsverlauf dokumentiert.
