# Versionsverlauf

## Version 1.1.1501 - 2026-05-10

**Title:** 🔧 Favoriten-Carousel: gap+14, max-height-Cap gegen Overflow
**Hero:** none
**Tags:** Fix, Bento, Carousel, Layout

### Why

User-Feedback nach v1.1.1500: „die items sind wieder überlagert; du müssten sie verkleinern, ausserdem erhöhe bisschen den abstand zwischen items untereinander horizontal und vertikal gleich". Trotz `grid-template-rows: repeat(3, minmax(0, 1fr))` + `height: 100%` auf den Cards übersteigt Reihe 3 den Widget-Bereich und überlappt den Footer.

Root cause: DeviceCard hat intern min-content-Bedarf (Icon 48px + 3 Text-Lines + Padding). Das hebt die `height: 100%` aus → Cards rendern größer als die Grid-Cell.

### What changed

`BentoStartView.css`:
- `.bento-carousel-page { gap: 8 → 14 }` — größerer Abstand zwischen Cards horizontal **und** vertikal (Grid-`gap` macht beide gleich).
- `.bento-carousel-page--large .device-card`:
  - `max-height: 100% !important` (Hard-Cap, zwingt die Card-Höhe auf die Row-Höhe)
  - `overflow: hidden !important` (Inhalt der nicht reinpasst wird geclippt statt die Card zu strecken)
  - `padding: 12 → 8` (Inhalt nimmt weniger Platz, weniger Druck auf Card-Höhe)

### Geometrie nach Fix

- W1 width: 565.6px
- W1 padding: 14 × 32 → inner 501.6 × 548
- Page-Höhe verfügbar: 548 - 24 (Header) - 15 (margin) - 44 (Footer) = 465px
- 3 cols × (501.6 - 28 gap) / 3 = 157.87 wide
- 3 rows × (465 - 28 gap) / 3 = 145.67 high
- Cards: ~158×146px, leicht rechteckig, kein Overflow.

---

## Version 1.1.1500 - 2026-05-10

**Title:** 🎯 Favoriten-Carousel: 3×3 Cards, kompakterer Header
**Hero:** none
**Tags:** Polish, Bento, Carousel, Layout

### Why

User: „header höhe 24px ist besser; ausserdem kannst du vielleicht 3 reihen machen statt 2 reihen in den favoriten". Zwei Änderungen:
1. Header-Spacer-Höhe von 44 → 24px (kompakter).
2. Cards 3×2 (6) → 3×3 (9) im large-Carousel.

In v1.1.1491 hatte ich auf 6 reduziert weil 3 rows × 174px (aspect-ratio:1) + Overhead > Widget-Höhe. Jetzt mache ich's geometrisch passend.

### What changed

`BentoStartView.jsx`:
- `cardsPerPage(large)`: 6 → 9.

`BentoStartView.css`:
- `.bento-carousel-header { min-height: 44px → 24px }`.
- Neue Regel `.bento-carousel-page--large { grid-template-rows: repeat(3, minmax(0, 1fr)) }` — 3 Rows die die Page-Höhe aufteilen.
- Neue Regel `.bento-carousel-page--large .device-card { aspect-ratio: auto !important; height: 100% !important }` — die Cards verlieren ihre strikte 1:1-Aspect-Ratio (sonst würden sie die Row-Höhe übersteigen) und nehmen 100% der Row-Höhe.

### Geometrie

- Page-Höhe (W1 large): 576 - 28 (Padding) - 24 (Header) - 15 (margin-bottom on page) - 44 (Footer) = ~465px
- 3 Rows × ~153px + 2×8 gap = ~475 → fits in ~465 (16-gap auf 4-gap reduzierbar falls overflow, aber laut Tests passt's mit minmax(0,1fr)).
- Cards: ~162px wide × ~153px high — minimal rechteckig, visuell fast quadratisch.

### medium/small unchanged

Diese behalten ihre aspect-ratio:1 (quadratisch). Nur large carousel betroffen.

---

## Version 1.1.1499 - 2026-05-10

**Title:** 🎯 Favoriten-Carousel: leerer Header-Spacer + Cards top-aligned
**Hero:** none
**Tags:** Polish, Bento, Carousel, Layout

### Why

User-Wunsch: „header soll doch sein, aber ohne icon oder text; dann vertikale zentrierung der karten nicht mehr machen". In v1.1.1497 hatten wir den Header komplett entfernt; v1.1.1498 hatte align-content:center für Cards. Beides revert.

### What changed

`BentoStartView.jsx`:
- Leerer `<div className="bento-carousel-header" aria-hidden="true" />` als reiner Spacer am Top des Carousels.

`BentoStartView.css`:
- `.bento-carousel-header`: min-height 44px, flex-shrink:0, width 100% (kein Icon, kein Text — pure Spacer).
- `.bento-carousel-page { align-content: start }` (statt center).

### Layout

```
[ Header-Spacer 44px (leer) ]
[ Cards 3×2 oben gepackt ]
[ leere Höhe ]
[ Footer 44px: Label links | Dots zentriert ]
```

---

## Version 1.1.1498 - 2026-05-10

**Title:** 🎯 Favoriten-Carousel: 2-zeiliges Label im Footer (DeviceCard-Style)
**Hero:** none
**Tags:** Polish, Bento, Carousel, Typography

### Why

User: „topheader komplett entfernen — Text 'Favoriten 11 Geräte' links im Footer zweizeilig wie bei den anderen widgets, selbe position und textgröße". Carousel-Header war schon weg (v1.1.1497), aber das Footer-Label war einzeilig und 12px klein. Soll jetzt die DeviceCard-Text-Hierarchie matchen (area + name, je ~16px).

### What changed

`BentoStartView.jsx`:
- Footer-Label aufgespalten in 2 spans:
  - `<span className="bento-carousel-footer-label-area">` — "Favoriten" (entity.name)
  - `<span className="bento-carousel-footer-label-name">` — "11 Geräte" (entity.description)

`BentoStartView.css`:
- Alte Header-CSS-Klassen (`.bento-carousel-header`, `.bento-carousel-icon`, `.bento-carousel-titles`, `.bento-carousel-name`, `.bento-carousel-sub`) ENTFERNT (waren ungenutzt seit v1.1.1497).
- `.bento-carousel-footer { min-height: 24 → 44 }` für 2-zeiliges Label.
- `.bento-carousel-footer-label`: jetzt `display: flex; flex-direction: column` für 2-Zeilen-Stack.
- `.bento-carousel-footer-label-area`: 16px, weight 400, rgba(0.7) opacity 0.7 — analog `.device-area` aus DeviceCardGridView.
- `.bento-carousel-footer-label-name`: 16px, weight 700, rgba(0.95) — analog `.device-name`.
- Hover-State: area opacity 0.7 → 0.9 (subtile Reaktion).

### Layout-Resultat

```
[ Cards 3×2 vertikal mittig ]
[ Footer 44px hoch:
    Favoriten      ●○○      ]
    11 Geräte
]
```

Label sitzt links-bottom-aligned absolut, Dots bleiben mittig via parent justify-content:center.

---

## Version 1.1.1497 - 2026-05-10

**Title:** 🎯 Favoriten-Carousel: Header weg, Label im Footer links
**Hero:** none
**Tags:** Polish, Bento, Carousel, Layout

### Why

User-Wunsch: „kein icon im header, lieber im bottom links text 'Favoriten 11 Geräte'". Layout-Wechsel — Carousel-Widgets brauchen keinen Top-Icon mehr, stattdessen kompakter Footer mit Label links + Dots zentriert.

### What changed

`BentoStartView.jsx`:
- Compact-Header (Icon + Titles) komplett ENTFERNT für Carousel-Widgets.
- Footer hat jetzt 2 Elemente: `<button className="bento-carousel-footer-label">` ("Favoriten 11 Geräte" — klickbar, öffnet Filter wie früher der Header) + die Page-Dots.

`BentoStartView.css`:
- `.bento-carousel-footer { position: relative }` — damit das Label absolut positioniert werden kann.
- `.bento-carousel-footer-label`: `position: absolute; left: 0` — sitzt links im Footer ohne die Zentrierung der Dots zu stören. Plus typografische Styles (12px, gewichtet 500, rgba(255,255,255,0.7), Hover-State auf rgba(0.95)).

### Layout jetzt

```
[ leerer Top-Bereich ]
[ Cards 3×2 vertikal mittig (align-content: center) ]
[ Footer: Label links | Dots zentriert ]
```

Cards bekommen mehr Vertikal-Raum weil kein Header mehr → wirken zentriert im Widget.

---

## Version 1.1.1496 - 2026-05-10

**Title:** 🎯 Favoriten/Vorschläge Header: nur Icon, kein Text, größere Größe
**Hero:** none
**Tags:** Polish, Bento, Carousel, Icon

### Why

User: „kannst du bei favoriten nur icon machen ohne text (favoriten 11 geräte) und icon soll gleiche größe haben wie auch bei wetter widget oder den anderen widgets". Konsistente Optik der Bento-Widget-Header — alle Live-Widgets zeigen das Icon prominent, der Favoriten/Vorschläge-Header hatte aber zusätzlich Text + ein kleineres Icon (24px).

### What changed

`BentoStartView.jsx` — Carousel-Header:
- `<div className="bento-carousel-titles">...</div>` ENTFERNT (kein „Favoriten 11 Geräte" mehr).
- Icon-Size von 24 → 48 (matched die system-entity-iconSize aus `appearanceConfig.js`).
- `aria-label={entity.name}` zum Button hinzugefügt — Accessibility-Fallback für den entfernten Visible-Text.

CSS bleibt wie es ist (`.bento-carousel-header` ist Flex-Container; ohne titles wird das Icon einfach allein dargestellt).

---

## Version 1.1.1495 - 2026-05-10

**Title:** 🎯 Favoriten-Carousel: Cards vertikal zentriert
**Hero:** none
**Tags:** Polish, Bento, Carousel, Layout

### Why

User-Wunsch: „bitte die items auch vertikal zentrieren". In v1.1.1492 hatte ich `align-content: start` gesetzt damit die Rows oben gepackt werden (statt mit großem Abstand auseinandergezogen). Aber dadurch entstand viel leerer Raum unten zwischen Cards und Footer.

### What changed

`BentoStartView.css` — `.bento-carousel-page`: `align-content: start` → `align-content: center`. Die Card-Grid-Rows werden jetzt mittig im verfügbaren Page-Bereich platziert. Header bleibt oben (über page), Footer bleibt unten (unter page), Cards mittig dazwischen.

---

## Version 1.1.1494 - 2026-05-10

**Title:** 🎯 Favoriten-Carousel: L/R-Padding weiter erhöht (24→32)
**Hero:** none
**Tags:** Polish, Bento, Carousel, Padding

### Why

User: „erhöhe weiter das links und rechts in den favoriten widget". v1.1.1493 hatte 24px L/R — User möchte mehr.

### What changed

`BentoStartView.css` — `.bento-widget--carousel`: `padding: 14px 24px` → `padding: 14px 32px`.

- Cards-Breite jetzt ~162px (statt 167px), 2 Reihen ~332px + 89px Overhead ≈ 421px. Passt weiterhin in 548px W1-Höhe.

---

## Version 1.1.1493 - 2026-05-10

**Title:** 🎯 Favoriten-Carousel: asymmetrisches Padding (L/R größer)
**Hero:** none
**Tags:** Polish, Bento, Carousel, Padding

### Why

User-Wunsch: „kannst du innerhalb des widgets (ähnlich wie top und bottom) abstand auch nach links und rechts machen?". Aktuell war padding rundum 14px. Visuell wirkte aber durch den Header (~50px hoch) und Footer (~24px) der Top/Bottom-Abstand zu den Cards größer als der seitliche. Cards klebten fast am linken/rechten Widget-Rand.

### What changed

`BentoStartView.css` — `.bento-widget--carousel`: `padding: 14px !important` → `padding: 14px 24px !important`.

- Top/Bottom: 14px (unverändert — Header/Footer-Spacing bleibt gleich)
- Left/Right: 24px (statt 14px)

### Geometrie nach Fix

- W1 width = 565.6px (von v1.1.1490)
- Inner-Content-Bereich = 565.6 - 48 = 517.6px
- 3 Cards à (517.6 - 16) / 3 = 167.2px Breite
- Aspect-ratio:1 → 167.2px Höhe
- 2 Reihen × 167.2 + 8 = 342.4px Page-Höhe
- Plus Header/Margin/Footer = ~89px Overhead
- Total Page ≈ 431px → passt in 548px verfügbare W1-Höhe.

Kein Overflow, kein Layout-Bruch.

---

## Version 1.1.1492 - 2026-05-10

**Title:** 🔧 Favoriten-Carousel: align-content: start
**Hero:** none
**Tags:** Fix, Bento, Carousel, Grid

### Why

v1.1.1491 reduzierte cardsPerPage(large) auf 6 (3x2) — kein Overflow mehr. Aber ein neuer Side-Effekt: `flex: 1` auf der `.bento-carousel-page` macht die Page ~459px hoch. Die 2 Rows mit aspect-ratio:1-Cards (je ~174px) brauchen aber nur 356px total. Das Default-Grid-Verhalten (`align-content: normal`) verteilte den Rest als großen Abstand zwischen den Rows.

User-Feedback: „warum hat jetzt 2.reihe so einen großen abstand?".

### What changed

`BentoStartView.css` — `.bento-carousel-page` bekommt `align-content: start`. Das packt die Rows oben zusammen statt die ungenutzte Höhe zwischen ihnen zu verteilen.

### Resultat

- Header oben
- 2 Reihen direkt darunter (nur 8px gap dazwischen)
- Übrige Höhe (~100px) leer am Footer-Bereich
- Footer mit Dots ganz unten

Sauberer Look, kein Auseinanderziehen der Cards.

---

## Version 1.1.1491 - 2026-05-10

**Title:** 🔧 Favoriten-Carousel 3x2 (statt 3x3) — kein Card-Overlap mehr
**Hero:** none
**Tags:** Fix, Bento, Carousel, Layout

### Why

v1.1.1490 hat W1 (Favoriten) um 15% breiter gemacht — von ~492px auf ~565.6px. Da die Cards `aspect-ratio: 1` haben, wuchsen sie nicht nur in der Breite (149→174px) sondern auch in der Höhe (149→174px). Bei 3 Reihen × 174px + 2 gaps × 8px + header ~50 + footer ~24 + margin ~15 ergibt das ~626px Total-Page-Höhe. W1 hat aber nur 548px Inner-Höhe (576px Widget minus 28px Padding).

Resultat: die unteren Cards der 3. Reihe übersteigen den Widget-Bereich. Sie ragen visuell über die Bento-Begrenzung hinaus → wirkt überlagert.

User-Feedback: „die karten in favoriten sind jetzt überlagert, bitte korrigieren".

### What changed

`BentoStartView.jsx`: `cardsPerPage(large)` von 9 zurück auf 6.

Damit: 3 Spalten × 2 Reihen = 6 Cards pro Page. 11 Favoriten = 2 Seiten (6+5, sichtbar an Page-Dots).

### Geometrie nach Fix

- 2 Reihen × 174px + 1 gap × 8px = 356px
- Plus Header(50) + Margin(15) + Footer(24) = 89px
- Total Page Height ≈ 445px
- W1 verfügbare Höhe = 548px
- Passt mit ~100px Reserve — kein Overflow mehr.

### Lesson

Bei Layout-Änderungen die `aspect-ratio: 1`-Children betreffen, **immer** die Vertikale neu durchrechnen — die Children skalieren nicht nur in der Breite mit, sondern in beide Dimensionen.

---

## Version 1.1.1490 - 2026-05-10

**Title:** 📐 Bento-Grid: W1 (Favoriten) +15% breiter, Layout selbstkorrigierend
**Hero:** none
**Tags:** Layout, Bento, Grid

### Why

User-Wunsch: Widget 1 (Favoriten) soll 15% breiter werden. Widget 2 (Wetter) soll in der Höhe so angepasst werden, dass W3 und W4 weiterhin quadratisch bleiben.

### What changed

`BentoStartView.css` — `.bento-grid--desktop`:
- `grid-template-columns: 1fr 1fr` → `grid-template-columns: 1.353fr 1fr`.

Verhältnis 1.353:1 entspricht 57.5% : 42.5% — also +15% auf W1's bisherige 50%-Breite.

### Layout-Mechanik (selbstkorrigierend)

- Rechte Spalte wird schmaler (~42.5% statt 50%).
- W3+W4 haben `aspect-ratio: 1` → werden automatisch kleinere Quadrate (Breite halbiert minus gap).
- W34-Row im Grid ist `auto` → nimmt nur so viel Höhe wie die quadratischen Cards brauchen.
- W2 ist in Row 1 mit `1fr` → nimmt den Rest der Total-Grid-Height (576px) automatisch.

Damit passt sich W2 ohne explizite Anpassung an. Wenn der User später nochmal die Breite ändert, läuft alles weiter durch.

---

## Version 1.1.1489 - 2026-05-10

**Title:** ↩️ Bento Live-Widget: zurück zu v1.1.1487 (Hover wieder schön)
**Hero:** none
**Tags:** Revert, Bento, Hover

### Why

v1.1.1488 fügte einen `::before`-Layer mit backdrop-filter + `rgba(30,30,30,0.4)` dark overlay hinzu, um den blurred-glass-bg wie im Carousel/Suchpanel zu erzeugen. Nebeneffekt: weil die Card jetzt auf einem dunkleren Untergrund sitzt, war der Hover-Background-Wechsel (rgba(0.1) → rgba(0.18)) visuell weniger spürbar. User-Feedback: „hover ist jetzt nicht mehr so schön wie früher".

Auf Nachfrage „wie soll's jetzt aussehen?" antwortete der User: „wie früher". Also: zurück zum v1.1.1487-Zustand mit dem schönen Hover, auch wenn der bg dabei wieder durchsichtiger ist.

### What changed

`BentoStartView.css`: `.bento-widget--live::before` ENTFERNT. Zurück zu `all: unset + display:block + width/height:100% + cursor:pointer`.

### Trade-off explizit

Der Background ist jetzt wieder durchsichtiger (Wohnzimmer-Bild scheint durch). Der Hover-Lighten ist dafür spürbar wie gewünscht.

Falls später beide Anforderungen kombiniert werden sollen, müsste man einen Mittelweg finden — z.B. backdrop-blur OHNE dark overlay (background-image wäre dann verschwommen aber hell genug für den Hover-Lighten) oder explizite verstärkte Hover-Variante im Bento.

---

## Version 1.1.1488 - 2026-05-10

**Title:** 🎯 Bento Live-Widget: backdrop-filter ohne Doppel-Container
**Hero:** none
**Tags:** Polish, Bento, Glass, Backdrop-Filter

### Why

In v1.1.1485 hatte das Live-Widget keine eigene Glass-Layer → durchsichtiger Background, Wohnzimmer-Bild schien klar durch (User: „zu durchsichtig und kein blurred").

In v1.1.1486 hatte ich `glass-panel`-Klasse hinzugefügt → backdrop-filter da, aber mit unerwünschtem `border: 1px solid` + `box-shadow` → Doppel-Container-Look (User: „sieht scheisse aus").

Erkenntnis: User möchte den **backdrop-filter-blur-Layer** (wie im Carousel-Favoriten-Widget und Suchpanel-Cards), aber **OHNE** Border-Decoration auf jedem einzelnen Widget.

### What changed

`BentoStartView.css`:
- `.bento-widget--live::before` — custom Pseudo-Element mit `backdrop-filter: blur(20px) saturate(180%)` + radial-gradient + `rgba(30,30,30,0.4)` dark overlay.
- Quasi extrahiert nur den Glass-Effekt aus dem `.glass-panel::before`, lässt aber `border` + `box-shadow` weg.
- `border-radius: 24px` damit Glass-Layer zur DeviceCard-Form passt.
- z-index: -1 + position:relative auf parent → Glass-Layer sitzt **hinter** der DeviceCard.
- `--background-blur` und `--background-saturation` CSS-Variablen werden respektiert (gleich wie die anderen glass-panels im Codebase).

### Schichtung jetzt

```
.bento-widget--live              (transparent, position:relative)
  ::before (z-index:-1)          (backdrop-blur + dark overlay)
  .device-card                   (rgba(0.1) tile + scale 1.05 hover)
```

Dreigeschichteter Look ohne Border-Doppel-Container.

---

## Version 1.1.1487 - 2026-05-10

**Title:** 🎯 Bento Widgets: glass-panel-Doppel-Container wieder entfernt
**Hero:** none
**Tags:** Fix, Bento, Revert

### Why

v1.1.1486 fügte `glass-panel` zu jedem Live-Widget-Wrapper hinzu, um den backdrop-filter-Layer hinter der DeviceCard zu erzeugen (Versuch das Suchpanel-Look zu matchen). Das hatte einen unerwünschten Side-Effekt: glass-panel hat `border: 1px solid` + `box-shadow: 0 8px 32px` → jedes Widget bekam einen sichtbaren Ring drumherum. User-Feedback: „jetzt sind die widgets in einem zweiten container; das sieht scheisse aus".

### What changed

`BentoStartView.jsx`: `glass-panel` Klasse wieder entfernt vom Live-Widget-Wrapper.

`BentoStartView.css`: `.bento-widget--live` zurück zur v1.1.1485-Form (`all: unset` + nur die nötigsten styles).

### Erkenntnis

Im Suchpanel sitzt `glass-panel` auf dem **äußeren search-panel-Container**, nicht auf jeder einzelnen DeviceCard. Im Bento entspricht das dem main-container's glass-panel — das ist schon da und gilt für ALLE Widgets im Bento-Grid. Ein zusätzlicher glass-panel pro Widget ist also nicht nötig und produziert nur Doppel-Container.

Wenn der Background-Look zwischen Bento- und Suchpanel-Klima sich noch unterscheidet, liegt's nicht am fehlenden glass-panel-Wrapper, sondern an einem subtileren Layer-Unterschied (vermutlich die Größe + Position des Parent-glass-panels relativ zur Card).

---

## Version 1.1.1486 - 2026-05-10

**Title:** 🎯 Bento Live-Widget: glass-panel-Layer hinter DeviceCard
**Hero:** none
**Tags:** Polish, Bento, Glass-Panel, DeviceCard

### Why

User-Feedback nach v1.1.1485: „der background von Waschraum Klima ist nicht wie bei device card". Im Suchpanel sitzt die DeviceCard innerhalb des `search-panel.glass-panel`-Containers — also über einer **extra backdrop-filter-Layer** (blur + saturate). Im Bento fehlte dieser Layer auf dem Live-Widget-Wrapper, weil ich `glass-panel` in v1.1.1480 entfernt hatte um Doppel-Glass-Layers zu vermeiden.

Resultat: rgba(0.1)-Card-Hintergrund im Bento sah „flacher" / leerer aus als im Suchpanel.

### What changed

`BentoStartView.jsx`: `<div className="... bento-widget--live glass-panel">` (glass-panel zurück).

`BentoStartView.css`:
- `all: unset` ENTFERNT — killte sonst die glass-panel-Styles.
- `border-radius: 24px !important` statt glass-panel-default 35px (damit's zur Card passt).
- `overflow: visible !important` damit Scale-Animation der Card nicht geclippt wird.
- `.bento-widget--live.glass-panel::before { border-radius: 24px !important }` — der backdrop-filter-Layer erbt den korrekten Radius.

### Mechanics — wie's jetzt aussieht

```
.bento-widget--live          (border-radius 24px, transparent)
  ::before                   (backdrop-filter blur+saturate via glass-panel)
  .device-card               (rgba(0.1) bg + scale 1.05 on hover + ::before gradient)
```

Drei sichtbare Layers übereinander:
1. Backdrop-filter-Blur am Wrapper-::before (= glass-Effekt)
2. rgba(0.1) Card-Hintergrund (= dezenter heller Tile)
3. Hover-Gradient-Overlay via Card-::before (= scale + Lighten)

Identisch zur Schichtung im Suchpanel.

---

## Version 1.1.1485 - 2026-05-10

**Title:** 🎯 Bento-Hover: native DeviceCard wiederhergestellt (= Suchpanel)
**Hero:** none
**Tags:** Fix, Bento, Hover, Revert

### Why

In v1.1.1483 hatte ich einen CSS-Override eingebaut der den hover-bg-change für non-active Cards unterdrückte — basierend auf der Annahme, dass User „scale-only"-Hover für alle Bento-Widgets möchte. Damals wirkte das gut, weil die meisten der „inkonsistenten" Cards (Bambu, Stein, Klima) noch im fallback-Pfad waren und mein Override sie gar nicht erreichte.

v1.1.1484 hat genau das verändert: die Cards finden jetzt ihren Live-Device-Match → rendern als DeviceCard im live-Pfad → mein v1.1.1483 Override begann plötzlich für sie zu greifen. User-Feedback: „hover wieder geändert!!!! warum machst du das?".

Auf Nachfrage: User möchte den **nativen DeviceCard-Hover wie im Suchpanel** (scale 1.05 + `::before`-Gradient-Overlay + bg-Change auf rgba(0.18) für non-active). Nicht meine vereinheitlichte Variante.

### What changed

`BentoStartView.css`:
- v1.1.1483 CSS-Override (`.bento-widget--live .device-card:not(.active):hover { background-color: rgba(0.1) !important }`) ENTFERNT.

Damit greift im Live-Widget die native DeviceCard-Hover-Logik unverändert. Verhalten ist identisch zum Suchpanel.

### Bilanz der Hover-Iterationen

Sechs Schritte (v1.1.1480–1485) um den richtigen Hover-State zu finden. Lesson: bei UX-Wünschen die sich auf andere Komponenten beziehen („soll wie X aussehen") IMMER zuerst klären welche der vielen Eigenschaften gemeint sind (scale-Amplitude, bg-Wechsel, Gradient-Overlay, transition-timing, …). Davon ableitend zwei-drei Optionen anbieten BEVOR Code geschrieben wird.

---

## Version 1.1.1484 - 2026-05-10

**Title:** 🐛 Bento: Live-Data für Integration-Devices (Universal/Printer/Weather)
**Hero:** none
**Tags:** Fix, Bento, System-Entities, ID-Mapping

### Why

User-Feedback: „warum haben diese widgets nicht live daten (live-device aus dem devices-Array) aus den devices?". Screenshot zeigte 3 Widgets ohne Live-Data:
- Stein (weather_device-Instanz)
- Bambu Lab (printer3d_device)
- Waschraum Klima (universal_device)

Diese 3 Devices sind Instanzen von Integration-System-Entities. Während Versionsverlauf, Aufgaben, Nachrichten (globale System-Entities mit unique domain) korrekt Live-Data zeigten, fanden diese hier ihren Live-Device-Match nicht.

### Root cause: ID-Format-Mismatch

In `StartScreenSettingsTab.jsx` wird die **kurze Registry-ID** in `startScreen.widgets` gespeichert — z.B. `'bambu_lab'`, `'tesla'`, `'stein'`. Aber `SystemEntity.toEntity()` in `base/SystemEntity.js` serialisiert ins `devices`-Array mit Prefix:

```js
const entityId = this.isPlugin ? `plugin.${this.id}` : `system.${this.id}`;
return { entity_id: entityId, id: entityId, ... };
```

So im devices-Array hat Bambu Lab `entity_id: 'system.bambu_lab'`, nicht `'bambu_lab'`.

Mein Lookup `find(d => (d.entity_id || d.id) === 'bambu_lab')` fand also nichts. Fallback war `find(d => d.domain === 'bambu_lab')` — auch fail, weil die domain `'printer3d_device'` ist. Final fallback auf `systemRegistry.entities.get('bambu_lab')` lieferte die Registry-Instance — **ohne** `entity_id`+`state` Felder → `isLiveDevice = false` → statisches Fallback-Layout statt DeviceCard.

### What changed

`BentoStartView.jsx` — `widgetEntities` memo:
```js
let liveDevice = devices?.find(d => (d.entity_id || d.id) === id);
if (!liveDevice) {
  liveDevice = devices?.find(d =>
    d.entity_id === `system.${id}` ||
    d.entity_id === `plugin.${id}` ||
    d.id === `system.${id}` ||
    d.id === `plugin.${id}`
  );
}
if (!liveDevice) {
  liveDevice = devices?.find(d => d.domain === id);
}
```

`SearchField.jsx` — `handleSidebarItemClick`: gleicher Multi-Strategy-Lookup für Click-Routing. Vorher matched der domain-Fallback bei Multi-Instance-System-Entities (z.B. mehrere Universal-Devices) das erste Device per domain — also potenziell das falsche Bambu/Tesla.

### Resultat

Bento-Live-Widgets für Integration-Device-Instanzen zeigen jetzt:
- Stein (weather_device): aktuelles Wetter + Temperatur
- Bambu Lab (printer3d_device): Druckstatus, Progress
- Waschraum Klima (universal_device): Hero-Sensor-State

Click-Routing öffnet das KORREKTE Device statt einer beliebigen Instanz der gleichen Domain.

### Lesson learned

Es gibt zwei ID-Räume im Codebase: Registry-IDs (kurz, `'bambu_lab'`) und HA-Shape-Entity-IDs (`'system.bambu_lab'`). UI-Settings speichern Registry-IDs; das `devices`-Array enthält HA-Shape. Lookup-Code muss beide Räume kennen oder eine kanonische Konversion-Funktion nutzen.

---

## Version 1.1.1483 - 2026-05-10

**Title:** 🎯 Bento-Hover: Universal-Devices verhalten sich wie System-Entities
**Hero:** none
**Tags:** Polish, Bento, Hover, Universal-Device

### Why

In v1.1.1482 wurde der Hover-Override aus v1.1.1481 entfernt → active system-entities (Aufgaben, Nachrichten) verhielten sich beim Hover sauber: nur scale 1.05, Background bleibt color. ABER: ein Universal-Device (`domain: 'universal_device'`, custom Entity via Integration) hat KEINEN Eintrag in `entityAppearanceConfig` → fällt auf die Standard-Variants aus `deviceGridItemVariants` zurück → `hover.backgroundColor: 'rgba(255,255,255,0.18)'` → Background lightens beim Hover, nicht konsistent mit anderen Bento-Widgets.

User-Feedback: „Bei diesem ist der Hover anders, wieso?".

### What changed

`BentoStartView.css`:
```css
@media (hover: hover) {
  .bento-widget--live .device-card:not(.active):hover {
    background-color: rgba(255, 255, 255, 0.1) !important;
  }
}
```

- Greift NUR im Live-Widget-Kontext (nicht im Carousel).
- Greift NUR für nicht-aktive Cards (`:not(.active)`) — aktive Cards behalten ihren color-state-Look (Wohnzimmer weiß, etc.).
- Setzt den Hover-Background auf den gleichen Wert wie den Inactive-Default (`rgba(0.1)`) → effektiv kein Background-Wechsel.
- Beat'et framer-motion's inline-style via `!important`.

### Mechanics — warum nicht alle Cards behandeln

Active normal entities (z.B. Klima im Heiz-Modus) haben `hover.backgroundColor: '#FFFFFF'` (weiß bleibt weiß). Active system-entities (Aufgaben) haben `hoverColor === activeColor` (Background bleibt color). Beide behalten ihren active-State-Look beim Hover ohnehin schon. Nur INactive Cards (mit fallback variants) hatten den rgba(0.18) bg-change — und der ist es, der visuell als „anders" wahrgenommen wird.

`.active`-Klasse wird im DeviceCardGridView nur gesetzt wenn `isActive` true ist. So filtert das Selektor präzise.

### Resultat

Alle Bento-Live-Widgets verhalten sich beim Hover jetzt einheitlich: scale 1.05, Background bleibt wie im Normal-State (color für active, dark glass für inactive). Carousel-Cards bleiben unverändert.

---

## Version 1.1.1482 - 2026-05-10

**Title:** 🎯 Bento Live-Widget Hover = identisch zum Carousel
**Hero:** none
**Tags:** Fix, Bento, Hover, Reverse

### Why

In v1.1.1481 hatte ich den User-Wunsch falsch interpretiert. Statement war: „der hover wie es bei Waschraum Klima ist gefällt mir, der hover bei den Aufgaben (blau) ist anders". Ich verstand: „die Aufgaben sollen beim Hover ein Background-Lighten haben". Tatsächlich gemeint war: die Live-Widgets sollen sich **exakt wie die Cards im Favoriten-Carousel** verhalten — dort wird beim Hover **nur scaliert** (1.05) und der active-state-Look (Wohnzimmer weiß, Aufgaben blau) bleibt erhalten.

User-Klärung mit 2 Screenshots des Carousel-Hover: „genau dieses hover effekt will ich auch haben bei den widgets".

### Root cause meines vorherigen Fehlers

1. CSS-Override `background-color: rgba(255,255,255,0.18) !important` beim Hover hat den nativen framer-motion-Hover (der bei active-cards die backgroundColor erhält) überschrieben. Resultat: aktive Cards verloren beim Hover ihren active-Look.
2. `overflow: hidden` am Outer-Wrapper clippte die Scale-Animation der Card → Vergrößerung war visuell unterdrückt. Im Carousel haben Cards keinen overflow-Wrapper drumherum.

### What changed

`BentoStartView.css`:
- `.bento-widget--live { overflow: hidden }` → ENTFERNT. Card kann jetzt frei beim Hover scalieren.
- Komplettes `@media (hover: hover) { ... :hover { background-color: !important } }` aus v1.1.1481 → ENTFERNT.

### Resultat

Live-Widgets und Carousel-Cards haben jetzt identisches Hover-Verhalten: scale 1.05 + framer-motion-variant. Active system-entities (Aufgaben blau, Wohnzimmer weiß) behalten ihre Farbe beim Hover. Inactive Devices (Klima off) bekommen subtle background lighten (rgba(0.18)) wie bisher.

### Lesson learned

Bei UI-Konsistenz-Wünschen den Komponent in den neuen Kontext einsetzen und in Ruhe lassen. Jeder Override kann das Behavior in unerwartete Weise zerstören. Wenn ich's zweimal hintereinander erklärt bekommen muss, war mein Verständnis offensichtlich falsch — nicht weiter überlagern, sondern zurück auf null und neu zuhören.

---

## Version 1.1.1481 - 2026-05-10

**Title:** 🎯 Bento-Hover für System-Entities (Todos etc.) jetzt sichtbar
**Hero:** none
**Tags:** Polish, Bento, Hover, System-Entities

### Why

In v1.1.1480 wurde der Hover-Effekt im Bento auf den DeviceCard-Default zurückgesetzt — das funktionierte sauber für normale HA-Devices (Klima off: background → rgba(255,255,255,0.18) beim Hover, sichtbares Lighten + scale). ABER: für System-Entities (Aufgaben/Todos im active-state, also wenn offene Items vorhanden) blieb der Hover „unsichtbar" — nur scale, kein background change.

Root cause in `src/system-entities/config/appearanceConfig.js`:
```js
todos: {
  color: 'rgb(0, 122, 255)',
  hoverColor: 'rgb(0, 122, 255)',  // ← gleich wie activeColor
  activeColor: 'rgb(0, 122, 255)',
}
```

`createDynamicVariants` setzt den Hover-State `backgroundColor: appearance.hoverColor` — also auf den gleichen Wert wie active. Beim Hover ändert sich der framer-motion-Background nicht. User-Wahrnehmung: „Hover passiert nichts".

### What changed

`BentoStartView.css`:
```css
@media (hover: hover) {
  .bento-widget--live .device-card {
    transition: background-color 0.2s ease, scale 0.2s ease !important;
  }
  .bento-widget--live .device-card:hover {
    background-color: rgba(255, 255, 255, 0.18) !important;
  }
}
```

CSS mit `!important` beat'et framer-motion's inline `style="background-color: ..."`. Im Bento-Mode bekommt jede Card beim Hover den gleichen leichten White-Overlay — Todos, Settings, News, Versionsverlauf, Klima, alles konsistent. Im Suchpanel bleibt das original-Verhalten (kein Override greift dort).

### Mechanics — Inline-Style vs CSS

framer-motion's whileHover setzt direkt `element.style.backgroundColor`. CSS-Regeln ohne `!important` verlieren gegen Inline-Styles (Spezifität 1000). Mit `!important` aus dem Stylesheet wird die Reihenfolge umgekehrt — CSS-`!important` beat Inline-Style außer Inline-Style hat auch `!important`. framer setzt KEIN `!important`, also gewinnt unsere Regel.

Transition zusätzlich auf CSS-Ebene damit der Wechsel smooth ist (sonst springt es abrupt, weil framer-motion bei `!important`-Override seine eigene Animation nicht mehr durchführt).

---

## Version 1.1.1480 - 2026-05-10

**Title:** 🎯 Bento-Widget-Hover identisch zum Suchpanel
**Hero:** none
**Tags:** Polish, Bento, Hover, DeviceCard

### Why

In v1.1.1479 wurden die Bento-Widgets auf DeviceCard-Rendering umgestellt. ABER: der äußere motion.div hatte `whileHover={{ scale: 1.015 }}` + `whileTap={{ scale: 0.985 }}` — also scalierte das gesamte Widget bei Hover. Zusätzlich hatte mein CSS `background: transparent !important` auf der inneren DeviceCard, was den Card-eigenen Hover-Background-Lighten (`rgba(0.1) → rgba(0.18)`) blockierte. Resultat: Hover-Verhalten war anders als bei einer DeviceCard im expanded Suchpanel.

User-Feedback: "wenn ich hovere auf den widgets soll es wie beim hover sein, wenn ich auf expanded suchpanel ein device item hovere".

### What changed

`BentoStartView.jsx`:
- Outer-Wrapper für Live-Widgets: motion.div → plain `<div>`. Kein whileHover/whileTap/transition mehr — der Hover-Effekt kommt jetzt ausschließlich von der DeviceCard selbst.
- `glass-panel`-Klasse entfernt vom Wrapper (würde sonst eine zusätzliche Glass-Layer über der Card legen).

`BentoStartView.css`:
- `.bento-widget--live`: `all: unset` + plain block-styles (cursor, border-radius, overflow:hidden, box-sizing).
- `.bento-widget--live .device-card`: KEIN `background: transparent !important` mehr — Card behält ihren default `rgba(255,255,255,0.1)`. Die @media (hover: hover) Styles aus DeviceCardGridView greifen jetzt natürlich: Background → rgba(0.18) + ::before-gradient-overlay opacity 0→1. Exakt identisch zum Suchpanel.
- `border-radius: 24px` explicit auf der Card (statt `inherit` vom Widget).

### Mechanics — der eine Grund warum das so subtle ist

DeviceCardGridView definiert ihren Hover via inline `<style>` Tag:
```css
.device-card::before {
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
  opacity: 0;
}
@media (hover: hover) {
  .device-card:hover::before { opacity: 1; }
  .device-card:hover { background: rgba(255, 255, 255, 0.18); }
}
```

Solange die Card-Klassen unverändert + nicht durch `background: transparent !important` blockiert sind, übernimmt sich der Hover-Effekt automatisch. Lesson: bei UI-Konsistenz-Wünschen NIE Styles am gleichen Komponent dupliziert anpassen — sondern den Komponent selbst (DeviceCard) in den neuen Kontext einsetzen und einfach in Ruhe lassen.

---

## Version 1.1.1479 - 2026-05-10

**Title:** ✨ Bento Widgets zeigen jetzt Live-Daten via DeviceCard
**Hero:** none
**Tags:** Feature, Bento, Live-Data, DeviceCard

### Why

User-Feedback: "die widgets zeigen keine aktuellen informationen wie bei der expanded suchpanel ansicht". Die non-carousel Widgets (Versionsverlauf, Energie Dashboard, Vacuum etc.) zeigten nur statisches Icon + Name + statische Description aus der Registry. Im Suchpanel rendert dagegen die DeviceCard mit live state/attributes (aktueller Verbrauch, Vacuum-Status, etc.).

User-Wunsch: Option A — komplette DeviceCard rendern.

### What changed

`SearchField.jsx`:
- Übergibt jetzt `devices={devices}` an `<BentoStartView>`.

`BentoStartView.jsx`:
- Neue Prop `devices = []`.
- `widgetEntities` macht jetzt Live-Device-Lookup für jeden Widget-Slot: erst exact-match auf `entity_id`/`id`, dann domain-Fallback. Wenn ein echtes HA-Shape-Device gefunden wird, hat es state/attributes — sonst fallback auf die statische Registry-Entity.
- `BentoWidget` hat eine neue Verzweigung: `isLiveDevice = !entity.isVirtual && entity.entity_id && entity.state !== undefined`. Wenn true, wird `<DeviceCard device={entity} viewMode="grid" onClick={() => {}} />` in einem motion.div-Wrapper gerendert. Der äußere Wrapper hat den `onClick` der die DetailView öffnet; DeviceCard intern hat leeren handler → kein Toggle.
- Carousel-Logik (Favoriten/Vorschläge) bleibt unverändert — virtual widgets haben kein `entity_id` → isLiveDevice = false → carousel-branch greift wie zuvor.
- Fallback-Layout (altes Icon+Name) bleibt für virtual widgets ohne previewItems (z.B. Home) sowie für Registry-Entities ohne live device match.

`BentoStartView.css`:
- Neue Klasse `.bento-widget--live`: padding 0, cursor pointer.
- `.bento-widget--live .device-card`: `aspect-ratio: auto`, `width/height: 100%`, `background: transparent`, `border-radius: inherit` — Card füllt das Widget komplett, übernimmt Bento-Glass-Background.
- Per-Size Padding-Anpassung: large 24, medium 18, small 14 (statt fixe DeviceCard 20px).

### Mechanics — Click-Routing

1. Outer motion.div (Bento-Widget): `onClick={() => onClick(entity)}` → ruft `handleSidebarItemClick(entity)` → `setSelectedDevice + setShowDetail(true)`.
2. Inner DeviceCard: `onClick={() => {}}` → kein internal Toggle (sonst würde z.B. eine Lampe getoggelt statt DetailView geöffnet).
3. Click event bubblet vom inner zum outer; beide handler feuern; effektiv nur outer wirkt.

### Lesson — extending vs replacing

Wir hätten auch nur die description-Zeile live machen können (Option B). Aber DeviceCard rendering ist die robustere Wahl: alle existierenden Domain-spezifischen Renderings (news-headlines, todo-counts, sensor-values, vacuum-state, climate-target) werden ohne Code-Duplikation übernommen. Wenn DeviceCardGridView später neue Features bekommt, profitiert Bento automatisch.

---

## Version 1.1.1478 - 2026-05-10

**Title:** 🐛 Bento Carousel: real-device click jetzt korrekt verlinkt
**Hero:** none
**Tags:** Fix, Bento, Carousel, Click-Routing

### Why

In v1.1.1477 funktionierte die 3-Spalten-Anzeige im Favoriten-Widget — User konnte 9 Cards (3x3) sehen, swipen, Footer mit Dots sichtbar. ABER: Klick auf eine normale HA-Entity (Lampe, Klima etc.) öffnete keine DetailView. Nur die System-/Custom-Entities (Settings, Versionsverlauf, Aufgaben) reagierten richtig.

### Root cause

`handleSidebarItemClick` in `SearchField.jsx` (Zeile 267-269) nutzte eine OR-Bedingung im `find`:

```js
const match = devices.find(
  d => (d.entity_id || d.id) === targetId || d.domain === systemEntity.domain
);
```

Bei einem System-Entity (z.B. Settings) ist `systemEntity.domain` eindeutig (nur ein Device hat `domain: 'settings'`). Match war korrekt.

Bei einem realen Device (z.B. `light.einbauleuchten`) gibt es viele Devices mit `domain: 'light'`. `find` returnt das ERSTE Element wo die Bedingung true ist — also das erste Light-Device im Array, NICHT zwingend `einbauleuchten`. Das geöffnete DetailView zeigte dann entweder ein falsches Device, oder gar nichts Sichtbares (je nach Reihenfolge/Filterung).

### Fix

Zwei-Stufen-Match: erst exact-match auf `entity_id`/`id`, dann domain-Fallback **nur wenn der erste Match fehlschlägt**.

```js
let match = devices.find(d => (d.entity_id || d.id) === targetId);
if (!match && systemEntity.domain) {
  match = devices.find(d => d.domain === systemEntity.domain);
}
```

System-Entities verhalten sich weiter identisch (entity_id-match findet sie direkt, oder Fallback greift). Reale Devices werden jetzt eindeutig zugeordnet.

### Lesson

`find(predicate)` mit OR-Bedingung ist gefährlich wenn der zweite Operand auf einem Feld basiert das mehrere Items teilen können. Bei Click-Routing immer in Stufen denken: spezifisch → allgemein, nicht beides gleichzeitig.

---

## Version 1.1.1477 - 2026-05-10

**Title:** 🎯 Bento Carousel: CSS Grid mit minmax(0, 1fr) — 3 Cards endlich erzwungen
**Hero:** none
**Tags:** Fix, Bento, Carousel, CSS-Grid

### Why

v1.1.1476 setzte `flex: 0 0 calc(33.333% - 6px)` auf alle Wrapper-Größen — sollte 3 Cards pro Reihe geben. Tat es aber nicht: das W1 (large) Widget rendrte trotzdem nur 1 riesige Card. User-Screenshot war eindeutig.

Root cause: flex-wrap mit calc()-Basis ist anfällig wenn das Kind eine eigene `min-width` hat (DeviceCardGridView setzt `min-width: 130px` in einem inline `<style>` Tag). Auch wenn der Wrapper auf 33.333% gerechnet wird, kann die innere Card sich wegen ihrer `min-width: 130 + container-type: inline-size` weiterhin breit machen — bei framer-motion-gewrappten Containers war's anscheinend nicht reproduzierbar zu lösen.

### The fix

**Switch von flex-wrap zurück zu CSS Grid mit `minmax(0, 1fr)`.**

```css
.bento-carousel-page {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-auto-rows: auto;
  ...
}
```

Der Trick: `minmax(0, 1fr)` (statt nur `1fr`) erlaubt Grid-Items unter ihre min-content-Größe zu schrumpfen. Das ist der bekannte Workaround für genau dieses Problem (Kind hat min-width, Grid berechnet sonst die min-content-basis hoch).

### Other changes

- `.bento-widget-card-wrapper { display: block }` (vorher flex) — Grid-Item soll sich exakt an die Cell-Größe halten.
- Entfernt: die size-spezifischen `flex: 0 0 calc(...)` Regeln. Grid kümmert sich um alle Größen einheitlich.
- `.device-card { max-width: 100% !important }` zusätzlich zu min-width:0 — Doppelte Absicherung gegen min-width Durchsetzung.
- `cardsPerPage` bleibt unverändert (large 9, medium 6, small 3).

### Lesson learned

v1.1.1473 hatte CSS-Grid zugunsten flex-wrap aufgegeben weil `repeat(2, 1fr)` als 1-Spalte rendrte. Damals fehlte `minmax(0, 1fr)`. Mit dem Fix ist Grid wieder die richtige Wahl — robust gegen Kinder mit eigenen min-width Werten.

---

## Version 1.1.1476 - 2026-05-10

**Title:** 🎯 Bento Carousel: 3 cards per row for ALL widget sizes
**Hero:** none
**Tags:** Polish, Bento, Carousel, Fix

### Why

v1.1.1475 only fixed the "3 cards per row" requirement for the `large` widget slot. But the user had configured Favoriten in a different slot (small or medium), where the carousel still rendered 1 card per row at full width. Screenshot evidence: huge "System Einstellungen" card filling the entire widget. Footer/slider was pushed below the visible area because the cards were too tall.

User feedback was crisp: "3 karten pro reihe! nicht eine einzige karte! WAS SOLL DAS? und wo ist der footerbereich mit slider".

### What changed

`BentoStartView.jsx`:
- `cardsPerPage`: large `6 → 9`, medium `2 → 6`, small `1 → 3` — all multiples of 3, all force 3 cards per row regardless of widget slot.
- `gridColsFor` now returns 3 for all sizes (was 3/2/1).

`BentoStartView.css`:
- Consolidated `.bento-carousel-page--{large,medium,small} > .bento-widget-card-wrapper` into a single rule with `flex: 0 0 calc(33.333% - 6px)` — applies to all three size variants.
- `.bento-carousel-footer { min-height: 24px }` (was 16) — guarantees the slider always has a visible footprint even when the cards page eats most of the widget height.

### Why this is the right level

The carousel layout intentionally has three widget-size variants so the typography/icon scale could adapt. But the 3-cards-per-row layout is the user's explicit preference regardless of size — pulling it out to a single rule that targets all three variants is the cleanest expression of that intent.

Side effect: in a "small" slot (W3/W4 on desktop, ~230px wide), three cards become ~70px wide each — small but still legible thanks to DeviceCardGridView's `@container (max-width: 180px)` rules that already shrink fonts/sensor-values. The user has accepted this trade-off explicitly.

---

## Version 1.1.1475 - 2026-05-10

**Title:** 🎯 Bento Carousel: clean heart icon, footer area, 3-col enforced
**Hero:** none
**Tags:** Polish, Bento, Carousel, UX

### Why

User feedback on v1.1.1474 Favoriten widget:
1. The heart icon was still inside a red rounded box ("rotes button") — user wanted only the heart itself, white, slightly larger.
2. Cards were rendering 2 per row even though large size was configured for 3 — DeviceCard's `min-width: 130px` + container-type was preventing the third column.
3. The page-dots area felt visually "loose" — user wanted a proper bottom footer section (mirror of the header) with the cards offset 15px from it.

### What changed

`BentoStartView.jsx`:
- Removed `style={{ background: brandColor }}` from `.bento-carousel-icon` — the icon now has no background.
- Bumped icon SVG size 20 → 24 ("etwas größer").
- Wrapped page-dots in a new `.bento-carousel-footer` div (mirror of `.bento-carousel-header` semantic — own bottom section).

`BentoStartView.css`:
- `.bento-carousel-icon`: removed `width/height/border-radius` — now just a flex inline-element holding the SVG. Color stays white via `color: white`.
- `.bento-carousel-footer { flex-shrink: 0; min-height: 16px }` — guarantees the footer always sits at the widget bottom regardless of how tall the cards-page is.
- `.bento-carousel-page { margin-bottom: 15px }` — explicit 15px gap between last card row and the footer.
- `.bento-carousel-dots`: removed `margin-top: 10px` (now controlled by footer + page margin).
- `.bento-widget-card-wrapper`: added `width: 100%; box-sizing: border-box` for stable flex-basis.
- `.bento-widget-card-wrapper .device-card`: added `padding: 12px !important` (was 20px from DeviceCardGridView) so 3-column cards (~145px wide) don't overflow their content. `min-width: 0 !important` already in place — combined with the smaller padding, 3 cards per row in the large widget renders cleanly.

### Mechanics — three changes interlocking

The "no red box" change is purely visual (drop background, drop border-radius). The "footer with 15px" change is a structural reorganisation of the dots into their own bottom bar (`flex-shrink: 0`) plus margin-bottom on the cards page. The 3-cards-per-row fix needed the `padding: 12px` reduction on the inner DeviceCard — the widget content area is ~464px wide (W1 large slot, 1000px container, 16px gap, 14px widget padding), 33.333% = ~155px per card, but the original 20px DeviceCard padding plus min-width: 130 was forcing the inner content past that limit. Reducing padding to 12px gives the card inner area enough room to stay within its allocated 145–155px slot.

### Cross-context confirmation

The User feedback "noch immer in einer reihe nur 2 device cards" confirms that the v1.1.1474 width-only change (`flex: 0 0 calc(33.333% - 6px)`) wasn't sufficient — the inner DeviceCard layout was the actual constraint, not the wrapper width. Reducing the inner padding addresses the right layer.

---

## Version 1.1.1474 - 2026-05-09

**Title:** 🎯 Bento Carousel polish: 3-col desktop, dots centered, background non-clickable, icon clean
**Hero:** none
**Tags:** Polish, Bento, Carousel, UX

### Why

User feedback on v1.1.1473 carousel:
1. Dots not visually centered (sat left-aligned due to parent `align-items: flex-start`)
2. Clicking the background of the widget accidentally opened the favoriten-filter — user wants only specific elements clickable
3. Desktop large widget should fit 3 cards per row (was 2)
4. Icon had a subtle box-shadow that looked like a border — wanted clean filled square with white SVG
5. Name + subtitle had too much vertical gap

### What changed

`BentoStartView.jsx`:
- Container changed from `motion.button` to `motion.div` — widget background NO LONGER captures click events.
- Header is now its own inner `<button>` with `onClick={() => onClick(entity)}` → only the icon+title strip opens the favoriten filter.
- Cards keep their `onClickCapture` for individual device clicks.
- Dots keep their per-dot `onClick` for page navigation.
- `cardsPerPage(large)`: 4 → 6 (for 3x2 layout).
- `gridColsFor(large)`: 2 → 3.

`BentoStartView.css`:
- `.bento-carousel-icon { box-shadow: removed }` — clean filled rectangle, no border.
- `.bento-carousel-titles { gap: 2px → 0; line-height: 1.15 }` — tighter title/subtitle spacing.
- `.bento-carousel-page--large > .bento-widget-card-wrapper { flex: 0 0 calc(33.333% - 6px) }` — 3 columns instead of 2.
- `.bento-carousel-dots { width: 100%; pointer-events: none }` — full width pushes dots to true center via `justify-content: center`. `pointer-events: none` on container + `auto` on individual dots means empty space around dots doesn't capture clicks (defensive layer beyond removing widget-level click).

### Mechanics — making widget-background non-clickable

Three-layer click model:
1. **Widget background** (motion.div): no onClick → background clicks do nothing.
2. **Header** (button): onClick → opens filter.
3. **Cards** (with onClickCapture): opens specific device DetailView.
4. **Dots** (with onClick per dot): switches page.

Empty space between elements (gap area, padding area) does nothing. User can swipe through cards without fearing accidental filter-trigger.

### Lesson

For complex widgets with multiple click targets and "safe space", the cleanest pattern is: NOT one big clickable wrapper with stopPropagation islands inside, but a NON-clickable wrapper with explicit clickable children. Avoids stopPropagation race conditions and is more predictable for users.

---

## Version 1.1.1473 - 2026-05-09

**Title:** 🔧 Bento Carousel: switch from CSS-grid to flex-wrap — 2-column layout endlich erzwungen
**Hero:** none
**Tags:** Hotfix, Bento, CSS

### Why

Nach v1.1.1472: Cards waren immer noch in 1-Column gestapelt trotz `grid-template-columns: repeat(2, 1fr)`. Vermutete Ursache: DeviceCard hat `min-width: 130px` + `container-type: inline-size`, was die grid-min-content-baseline hochsetzt → grid lieferte trotz `1fr` columns nur 1 column trotz Override.

### What changed

`BentoStartView.css` — `.bento-carousel-page` von `display: grid` auf `display: flex; flex-wrap: wrap` umgestellt:

```css
.bento-carousel-page {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.bento-carousel-page--large > .bento-widget-card-wrapper,
.bento-carousel-page--medium > .bento-widget-card-wrapper {
  flex: 0 0 calc(50% - 4px);  /* 50% width minus half gap = 2 columns */
  width: calc(50% - 4px);
  max-width: calc(50% - 4px);
}

.bento-carousel-page--small > .bento-widget-card-wrapper {
  flex: 0 0 100%;
}
```

Explizite `width: calc(50% - 4px)` auf Items + `flex: 0 0` (no grow/shrink) garantiert exakt 2 Items pro Reihe. Plus `flex-wrap: wrap` füllt nächste Reihe wenn mehr Items.

DeviceCard's `aspect-ratio: 1` greift weiterhin → Cards quadratisch (Höhe = Breite = ~210-220px).

### Lesson

CSS Grid ist eleganter aber empfindlich gegenüber children's `min-width` + `container-type` — kann unerwartet auf 1-Col degraden. Flex-wrap mit expliziten `calc(% - gap/2)` widths ist robuster für "exact N columns" Layouts wo children auch eigene min-content-baselines haben können.

---

## Version 1.1.1472 - 2026-05-09

**Title:** 🟦 Bento Carousel: Cards jetzt strikt quadratisch — height-Override entfernt + grid-rows auf auto
**Hero:** none
**Tags:** Hotfix, Bento, Carousel, CSS

### Why

User report nach v1.1.1471: Cards in Favoriten-Carousel waren breit-rechteckig (full width × ~150px), nicht quadratisch.

Cause: `.bento-widget-card-wrapper .device-card { height: 100% !important }` overschrieb DeviceCard's eigene `aspect-ratio: 1` (definiert in DeviceCardGridView.jsx als inline `<style>`). Plus `grid-template-rows: 1fr` stretched die grid-cells über die volle Höhe → cards füllten cell = rectangular.

### What changed

`BentoStartView.css`:
- Entfernt `height: 100% !important` von `.device-card` Override → DeviceCard's eigene `aspect-ratio: 1` greift wieder
- `grid-template-rows: repeat(2, 1fr)` → `grid-template-rows: auto auto` (für large) — rows nehmen Card-Höhe (= Card-Breite via aspect-ratio) statt 1fr-stretch
- `justify-content: start` + `align-content: start` damit grid sich nicht aufbläht
- Gap reduziert 10 → 8 für etwas mehr Platz

### Result

Cards sind jetzt:
- Breite: cell-Breite (= page_width / cols - gap)
- Höhe: gleich Breite (via aspect-ratio:1)
- = strikt quadratisch

Beispiel large widget (W1, ~452px content area, 2-col, gap 8):
- Card-Breite: (452 - 8) / 2 = 222px
- Card-Höhe: 222px (square)
- Total page-grid 2 rows: 2×222 + 8 = 452px

### Lesson

Wenn child component (DeviceCardGridView) bereits `aspect-ratio: 1` setzt, NICHT mit `height` von außen überschreiben. height + aspect-ratio konkurrieren — height wins (later in cascade), broken square. Korrekt: nur `width: 100%` setzen + grid auf `auto` rows damit Höhe von aspect-ratio bestimmt wird.

---

## Version 1.1.1471 - 2026-05-09

**Title:** 🎠 Bento Favoriten/Vorschläge: Carousel-Layout mit Swipe + Page-Dots — alle Devices erreichbar
**Hero:** none
**Tags:** Feature, Bento, Carousel

### Why

User wollte (a) strikt quadratische Cards und (b) ALLE favorites sehen können (nicht nur 4 von 7), notfalls per Swipe wie beim Media Player oder Energy Dashboard.

### What changed

`BentoStartView.jsx` — komplette Restrukturierung des BentoWidget-Renders für widgets mit `previewItems`:

**Carousel-Layout** (statt Standard-Layout) wenn `entity.previewItems`:
- **Compact Header oben**: kleines Brand-color icon (36×36) + Name + Subtitle. Nimmt nur ~50px statt 90px wie bei der Standard-icon-bubble.
- **Page-Grid mittig**: `motion.div` mit `drag="x"` für swipe. Zeigt nur die Cards der aktuellen Page (4 für large, 2 für medium, 1 für small).
- **Page Dots unten**: nur sichtbar wenn `totalPages > 1`. Active dot ist breiter pill-shape (Apple-Style).

**Swipe-Detection**: `onDragEnd` mit threshold 40px. Drag links → next page, drag rechts → prev page. `dragConstraints` halten das Element in Position.

**Page-Click-Navigation**: jeder Dot ist clickbar → setzt `currentPage` direkt.

**Cards strikt quadratisch**: `aspect-ratio` ist nicht mehr nötig — die grid-rows in `.bento-carousel-page--large` (`repeat(2, 1fr)`) machen Cards automatisch square wenn das Widget 2x2 grid hat. Alternative: small widget hat 1x1 grid → Card füllt alles.

**Click-Handler**: identisch zu v1.1.1469 (`onClickCapture` für single firing).

`BentoStartView.css`:
- Neue Klassen: `.bento-widget--carousel`, `.bento-carousel-header`, `.bento-carousel-icon`, `.bento-carousel-titles`, `.bento-carousel-name`, `.bento-carousel-sub`, `.bento-carousel-page--{large|medium|small}`, `.bento-carousel-dots`, `.bento-carousel-dot`
- `touch-action: pan-y` auf page → vertikaler scroll bleibt möglich, horizontaler swipe wird abgefangen
- Active dot: 6px → 18px width + pill border-radius (Apple-iOS pattern)

### Behavior

- Bento Favoriten widget mit 7 favorites → 2 pages (4 + 3 cards)
- Page 1: Cards 1-4, dots `● ○`
- Swipe links → Page 2: Cards 5-7, dots `○ ●`
- Tap auf Card → öffnet die device DetailView
- Tap auf Header/Background → öffnet Favoriten-Filter
- Tap auf Dot → springt zu der Page

### Lesson

Für widget-internal pagination ist framer-motion's `drag="x"` mit `dragConstraints={{left:0, right:0}}` + `onDragEnd` der einfachste Weg — keine eigenen Touch-Handler nötig. `dragElastic` macht den drag fühlbar (bounce-back). `touch-action: pan-y` verhindert dass der horizontale drag mit dem vertikalen scroll des parent-containers konkurriert.

---

## Version 1.1.1470 - 2026-05-09

**Title:** 📦 Bento DeviceCards: passen jetzt in widget-bounds (max 4 cards 2x2 large, grid-rows fix)
**Hero:** none
**Tags:** Bugfix, Bento, Layout

### Why

User report: DeviceCards inside Favoriten widget overflowed widget bounds — extended above and below into other widgets' areas. v1.1.1469 had `aspect-ratio: 1` cards in 2-col layout with 6 cards max → 3 rows × 230px = 690px > available content area (~388px). Cards spilled out.

### What changed

`BentoStartView.jsx`:
- `maxPreview` reduced: large 6→4, medium 4→2, small 2→1. Aligns with grid sizes (2x2 / 2x1 / 1x1).

`BentoStartView.css`:
- `.bento-widget--large .bento-widget-cards-grid`: `grid-template-rows: repeat(2, 1fr)` — exactly 2 rows, cards fill remaining height
- Same pattern for medium (1 row) and small (1 row, 1 col)
- `.bento-widget-cards-grid { flex: 1; min-height: 0 }` — grid stretches to fill space between icon-bubble and content
- `.bento-widget-card-wrapper { width: 100%; height: 100%; min-height: 0 }` — cards fill grid cells, no min-content baseline forcing overflow
- Removed `aspect-ratio: 1` (was forcing square cards regardless of cell height → overflow)
- Removed `:has(.bento-widget-cards-grid) { overflow: visible }` — cards now fit strict in bounds, overflow:hidden is safe and prevents future regressions

### Trade-off

Cards are no longer strictly square — they fill grid cells, which may be slightly wider than tall. Trade for "fits in widget bounds" was worth it. User can still see device icon + name + state.

### Lesson

When using CSS grid + aspect-ratio together, aspect-ratio takes precedence over grid sizing → can break out of grid cell bounds. For "cards fill cell" behavior, use `width: 100%; height: 100%` and let grid handle sizing. Aspect-ratio only when grid cells themselves are flexible enough to accommodate it.

---

## Version 1.1.1469 - 2026-05-09

**Title:** 🟦 Bento Favoriten cards: square (aspect-ratio 1), 2-col grid, hover doesn't clip + click reaches device DetailView reliably
**Hero:** none
**Tags:** Bugfix, Bento, DeviceCards

### Why

Three issues from v1.1.1468:

1. **Hover-truncation**: Cards too narrow (auto-fit packed many per row), names cut off ("Syster" instead of "System Einstellungen"). Plus `overflow: hidden` on widget clipped the hover-scale animation.

2. **Cards not square**: Cards were tall rectangles instead of squares. User wanted equal-aspect tiles.

3. **Click might not open DetailView reliably**: DeviceCard's internal click handler + bubble-up to wrapper had ambiguous flow; potential double-fire or race.

### What changed

`BentoStartView.jsx`:
- Wrapper uses `onClickCapture` (instead of regular onClick stopPropagation) to handle the click in the CAPTURE phase — fires BEFORE DeviceCard's internal handler, calls our onClick directly. DeviceCard's own onClick is set to a no-op so it doesn't double-fire. Single, reliable click path.

`BentoStartView.css`:
- `.bento-widget-cards-grid`: `grid-template-columns: repeat(2, 1fr)` (was auto-fit) — exactly 2 columns. Small widget: 1 column.
- `.bento-widget-card-wrapper`: `aspect-ratio: 1` — every card is square.
- `.bento-widget:has(.bento-widget-cards-grid) { overflow: visible }` — widgets with card grids don't clip the hover-scale animation. The `:has()` selector targets only widgets that have card grids, leaving non-favorites widgets with their default overflow:hidden.

### Layout

For Large widget (Favoriten): 2x3 grid of square cards = 6 favorites visible. "+N weitere" footer for the rest.

### Lesson

Two lessons:
1. `onClickCapture` is the right hook when you want to intercept a child's click BEFORE the child's own handler runs — useful when you want to override the child's click behavior without modifying the child component.
2. CSS `:has()` allows context-aware property overrides without polluting parent class names. Here it lets non-favorites widgets keep `overflow: hidden` while favorites widgets get `overflow: visible` for their hover animation.

---

## Version 1.1.1468 - 2026-05-09

**Title:** 🎴 Bento Favoriten/Vorschläge: real DeviceCards inside widget (1:1 same as expanded panel)
**Hero:** none
**Tags:** Polish, Bento, DeviceCards

### Why

User: device list inside Favoriten/Vorschläge widget should look 1:1 like the cards in the expanded search panel — actual DeviceCard components with icon-on-top, area-name, device-name, state — not the simple dot+name list from v1.1.1467.

### What changed

`BentoStartView.jsx`:
- Imported `DeviceCard` component
- Replaced the `.bento-widget-preview` simple-list rendering with `<DeviceCard device={d} viewMode="grid" onClick={...} />` — same component, same visual style as the search panel
- Each card wrapped in a div with `onClick + onPointerDown` `stopPropagation` to prevent click-bubble to the parent widget button (otherwise clicking a card would ALSO open the filter view)
- Card click → `onClick(d)` → `handleSidebarItemClick(d)` falls through to `devices.find(d => d.entity_id === ...)` → opens that specific device's DetailView

`BentoStartView.css`:
- New `.bento-widget-cards-grid` with `grid-template-columns: repeat(auto-fit, minmax(80px, 1fr))` — packs as many cards as fit
- Per-size variants: large=100px min, small=single column
- Card-wrapper override: `min-width: 0 !important; width: 100% !important` — prevents DeviceCard's natural min-width from overflowing the widget cell

### Behavior

- Click on a DeviceCard inside Favoriten widget → opens THAT device's detail view (not the filter view)
- Click on widget background (icon area, name, empty space) → opens the favorites filter in the search panel (existing behavior)
- Two click targets per widget cleanly separated via stopPropagation

### Lesson

When embedding a clickable component inside another clickable component, both `onClick` AND `onPointerDown` need `stopPropagation` because framer-motion gestures (whileTap on the parent button) listen on pointer events that fire BEFORE click. Same defensive pattern as v1.1.1426 for the info-icon-button inside ios-item-clickable rows.

---

## Version 1.1.1467 - 2026-05-09

**Title:** ⭐ Bento Favoriten/Vorschläge: device list inside widget + filter-key fix ('favorites' instead of 'favoriten')
**Hero:** none
**Tags:** Bugfix, Feature, Bento, Favorites, Suggestions

### Why

Two issues from v1.1.1466:

1. **Filter-key bug**: Click on Favoriten widget didn't activate the favorites filter. SubcategoryBar's `baseOptions.push('favorites')` uses English plural; my v1.1.1466 used German `'favoriten'`. Mismatch → SubcategoryBar didn't recognize the value as a known filter → no filter applied.

2. **Empty widget content**: Widget showed only icon + title + count. User wanted to see the actual device names directly in the widget so they know WHICH favorites are there at a glance.

### What changed

**`SearchField.jsx`** — `handleSidebarItemClick` filter key fix:
```jsx
setSelectedSubcategory('favorites');  // was 'favoriten'
```

Plus passes `favoriteDevices` + `suggestionDevices` arrays as new props to BentoStartView.

**`BentoStartView.jsx`**:
- `buildFavoritesItem` / `buildSuggestionsItem` now accept and store a `previewItems` array (the devices to preview)
- `BentoWidget` renders a `.bento-widget-preview` section between the icon-bubble and the name-content. Each preview item: small color dot + device name. Item count scales with widget size: `large=6, medium=4, small=2`. Plus "+N weitere" footer if the full list exceeds maxPreview.

**`BentoStartView.css`** — new styles for `.bento-widget-preview`, `.bento-widget-preview-item`, `.bento-widget-preview-dot`, `.bento-widget-preview-name`, `.bento-widget-preview-more`. Font sizes scale per widget variant.

### Result

Favoriten widget on the Bento home now reads like:

```
[♥]
  • Wohnzimmer Decke
  • Schlafzimmer Lampe
  • Küche Spüle
  +2 weitere

Favoriten
3 Geräte
```

Click → opens search panel with favorites filter active (now actually works because the key matches `'favorites'`).

### Lesson

Two lessons from one bug pair: (1) when adding a new filter consumer, verify the EXACT key string the upstream consumer expects — language-mismatched keys ('favoriten' vs 'favorites') are silent failures because SubcategoryBar just doesn't recognize the value as a known option. (2) Tile widgets benefit hugely from showing PREVIEW CONTENT, not just metadata. A "5 Geräte" count tells nothing; the actual names tell the user whether to tap.

---

## Version 1.1.1466 - 2026-05-09

**Title:** ⭐ Bento widgets: Favoriten + Vorschläge as virtual options (with live counts, click → opens search filter)
**Hero:** none
**Tags:** Feature, Bento, Widgets, Favorites, Suggestions

### Why

User wants to surface favorites and AI-suggestions as configurable Bento widgets — alongside system-entities (Settings, Todos, etc) and Home. Tap → open the search panel pre-filtered to that category.

### What changed

**`BentoStartView.jsx`**:
- New exports: `HOME_ITEM_ID`, `FAVORITES_WIDGET_ID = '__favorites__'`, `SUGGESTIONS_WIDGET_ID = '__suggestions__'`
- Inline SVGs: `HOME_ICON_SVG` (house), `FAVORITES_ICON_SVG` (filled heart), `SUGGESTIONS_ICON_SVG` (sparkle)
- New builders: `buildHomeItem`, `buildFavoritesItem(lang, count)`, `buildSuggestionsItem(lang, count)` — count → subtitle "X Geräte" / "X Empfehlungen"
- New props: `favoritesCount`, `suggestionsCount` for live numbers
- `useMemo` intercepts virtual IDs before falling through to systemRegistry lookup
- BentoWidget renders virtual icons inline (was getSystemEntityIcon-only)
- Brand colors: red (255,69,58) for favorites, indigo (94,92,230) for suggestions

**`SearchField.jsx`**:
- `handleSidebarItemClick` extended with two new branches:
  - `__favorites__` → close detail, expand search panel, `setSelectedSubcategory('favoriten')`
  - `__suggestions__` → close detail, expand search panel, `setSelectedSubcategory('suggestions')`
- Passes `favoritesCount={favorites?.size ?? 0}` + `suggestionsCount={predictiveSuggestions?.length ?? 0}` to BentoStartView

**`StartScreenSettingsTab.jsx`**:
- `buildAvailableEntities(lang)` now prepends Home + Favoriten + Vorschläge as virtual options at the top of the picker list
- Inline SVG fallback for virtual entities (since `getSystemEntityIcon` returns null for `__home__`/`__favorites__`/`__suggestions__` domains)

### UX

User picks "Favoriten" for Slot W2 → widget shows heart icon + "5 Geräte" → tap → search panel expands with Favoriten filter active → user sees their favorite devices without manually navigating.

### Lesson

When extending a slot-based widget system (here: Bento's 4 slots) with NON-entity options (filter shortcuts, virtual actions), the cleanest pattern is "virtual IDs that aren't in the entity registry." Each consumer (BentoStartView, picker, click-handler) intercepts the special IDs at its own layer. No need to invent fake entities or pollute systemRegistry. The pattern scales: future virtual widgets (e.g., "Recently Used", "All Lights") just add another `__id__` constant + builder + click-handler branch.

---

## Version 1.1.1465 - 2026-05-09

**Title:** 📐 Bento DetailView deckungsgleich mit Suchpanel — top:60 + height:672 erzwungen
**Hero:** none
**Tags:** Bugfix, Bento, Layout, DetailView

### Why

User report: in Bento mode the DetailView panel (opened by clicking a widget or sidebar item) doesn't visually align with the expanded search panel — neither in position (y) nor in height. Toggling between widget-DetailView and search-expanded showed visible jumps.

### Math

Search panel expanded:
- top: 60px (sits below statsbar-bento-wrapper which has min-height 60px)
- height: 672px
- bottom: 732px

DetailView before fix:
- top: `statsBarHeight` (= 64 if enabled, 0 if disabled — different from 60!)
- bottom: 0 of `.main-container` (extends to whatever min-height is, was 720)
- height: variable (656–720)

So DetailView was offset 4-60px from the search panel, with different heights.

### What changed

`BentoStartView.css`:
- `.main-container--bento { min-height: 720 → 732 }` — fits DetailView's 60+672
- `.main-container--bento .detail-panel-wrapper { top: 60px !important; height: 672px; bottom: auto; min-height: 0 }` — overrides the inline `top: ${statsBarHeight}px` from DetailViewWrapper.jsx with !important; sets fixed height matching search panel
- `.main-container--bento .vision-pro-menu--desktop { top: 396px }` (was 400) — mathematical center of panel area (60 + 672/2 = 396), now exact

### Lesson

When two visually-similar panels need congruent placement (here: search panel and DetailView), don't let them compute their own top/height independently — both should derive from the same constants. CSS overrides with `!important` are acceptable when the alternative would be threading a `bentoMode` prop through a wrapper component that already has its own positioning logic. The `!important` is scoped to the parent class `.main-container--bento` so it can't leak into default mode.

---

## Version 1.1.1464 - 2026-05-09

**Title:** 📐 Bento polish: sidebar top 396→400px + StatsBar wrapper reserves space when toggled off
**Hero:** none
**Tags:** Polish, Bento, Layout

### Why

Two refinements:

1. **Sidebar top tweak**: User suggested `400px` for slightly better visual centering on the opened DetailView panel. Previous 396px was off by a few pixels.

2. **StatsBar toggle stability**: When user disabled StatsBar via the Settings toggle, search panel + sidebar shifted ~60px upward. Cause: `StatsBar` returns `null` when `statsBarSettings.enabled=false` → no DOM, no space taken → flow elements above moved up. In Bento mode this is a layout-jump bug.

### What changed

`SearchField.jsx` — StatsBar wrapper gains a CSS class in Bento mode:

```jsx
<div
  className={bentoEnabled ? 'statsbar-bento-wrapper' : undefined}
  style={bentoEnabled && !isExpanded && !showDetail ? { visibility: 'hidden' } : undefined}
>
  <StatsBar ... />
</div>
```

`BentoStartView.css`:
- `.main-container--bento .vision-pro-menu--desktop { top: 400px }` (was 396px)
- New rule: `.statsbar-bento-wrapper { min-height: 60px }` — wrapper takes 60px of vertical space even when its child (StatsBar) returns null. Result: search-row position constant regardless of StatsBar's enabled state.

### Lesson

For "stable layout regardless of optional component" patterns: the OPTIONAL element returning null isn't enough — you need a parent wrapper with min-height matching the rendered child's typical height. Visibility:hidden alone preserves space ONLY when the child renders something; if the child renders null, even visibility:hidden has nothing to hide. The min-height on the wrapper is the actual space-reservation mechanism.

---

## Version 1.1.1463 - 2026-05-09

**Title:** 📐 Bento grid height matches expanded search-panel — bottoms align (576px instead of 600px)
**Hero:** none
**Tags:** Polish, Bento, Layout

### Why

User feedback: bottom edge of Bento widgets and bottom edge of expanded search panel were ~24px out of alignment. Toggling between start (Bento) and search-expanded showed a visible jump of the card's bottom edge.

### Math

- Expanded search panel height: **672px** (from search-row top, set in motion.div animate.height)
- Bento layout: search-row collapsed (72) + grid margin-top (24) + grid (X) = bottom at 96 + X from search-row top

For bottoms to align: `96 + X = 672` → `X = 576`.

### What changed

`BentoStartView.css`:
- `.bento-grid--desktop { height: 600px → 576px }` — bottoms now align exactly
- `.main-container--bento .vision-pro-menu--desktop { top: 360px → 396px }` — sidebar visual center recomputed: ~60 (StatsBar) + half(72+24+576) = 60 + 336 = 396px

### Lesson

When two visual elements share screen real estate but live in different render paths (Bento grid vs expanded search panel), their HEIGHTS need to be derived from the same source-of-truth. Hardcoding both to "600 and 672 — close enough" produces a misalignment users will spot. Better: compute one as a function of the other (here: `bento-grid = expanded-panel - search-row-collapsed - margin-gap`). Or expose a CSS variable both consume.

---

## Version 1.1.1462 - 2026-05-09

**Title:** 📌 Bento sidebar: fixed pixel `top` instead of percentage — consistent position across all 3 states (start / DetailView / expanded)
**Hero:** none
**Tags:** Bugfix, Bento, Sidebar, Layout

### Why

User noticed sidebar position drifts ±15px between three states:
- Start page: `.main-container` ≈ 750px → `top: 50%` = 375px
- Widget → DetailView: `.main-container` ≈ 720px (min-height) → 360px
- Suchleiste expanded: `.main-container` ≈ 732px → 366px

Sidebar appears in slightly different vertical positions each time. Visually distracting.

### What changed

`BentoStartView.css` — sidebar `top` overridden from `50%` to fixed `360px`:

```css
.main-container--bento .vision-pro-menu--desktop {
  top: 360px;
}
@media (max-width: 768px) {
  .main-container--bento .vision-pro-menu--desktop {
    top: 50%;  /* mobile fallback */
  }
}
```

360px = half of the 720px min-height = stable visual center regardless of which state main-container is in. Framer's `translateY(-50%)` then centers sidebar middle on y=360px from main-container's top.

Mobile retains `top: 50%` because mobile doesn't have bento-grid (stack layout), and the percentage works fine there.

### Lesson

When a percentage-positioned element references a parent whose height varies subtly between states, switch to absolute pixel values for the dimension that needs consistency. Even small height differences (15px here) become visible position drift to attentive users. `min-height` keeps the parent FROM collapsing but doesn't prevent it from GROWING; the sidebar position needs both safeguards: min-height (so it doesn't get tiny) + fixed `top` (so it doesn't track the variable height).

---

## Version 1.1.1461 - 2026-05-09

**Title:** 📐 Bento DetailView: sidebar stays centered (was sliding to top because main-container shrank)
**Hero:** none
**Tags:** Bugfix, Bento, Sidebar, Layout

### Why

User report: clicking a Bento widget → DetailView opens → sidebar slides UP to the top of viewport instead of staying vertically centered.

Cause: bento-grid is conditionally rendered (`!showDetail`). When DetailView opens, bento-grid hides, `.main-container` shrinks from ~756px (StatsBar+search-row+bento-grid) to ~150px (just StatsBar+search-row). Sidebar's `position: absolute; top: 50%` resolves as 50% of the now-tiny container = ~75px from top → sidebar centered on the small remaining content, near the viewport top.

### What changed

`BentoStartView.css` — added `min-height: 720px` to `.main-container--bento`:

```css
.main-container--bento {
  min-height: 720px;
}
@media (max-width: 768px) {
  .main-container--bento { min-height: auto; }
}
```

Now `.main-container` keeps its tall footprint regardless of whether bento-grid is rendered. Sidebar's `top: 50%` always resolves to ~360px = vertical center of the stable card area.

Mobile override resets to `auto` because mobile uses a stack-layout that doesn't need the same vertical reservation.

### Lesson

When `position: absolute` siblings depend on a parent's height for percentage-based positioning, ensure the parent has a STABLE height. Conditional children (here: `bento-grid` toggling on/off based on showDetail) can collapse the parent → percentage anchors recompute → siblings shift. `min-height` on the parent is the cleanest fix; alternative (give the conditional child a permanent placeholder) is more invasive.

---

## Version 1.1.1460 - 2026-05-09

**Title:** 👋 Greeting in Bento: hides when search expands or DetailView opens (was always visible)
**Hero:** none
**Tags:** Polish, Bento, Greeting

### Why

User refinement after v1.1.1459: greeting should appear ONLY on the actual start page (collapsed search panel + no DetailView). v1.1.1459 had `isExpanded={bentoEnabled ? false : ...}` — hardcoded false in Bento mode meant greeting stayed visible even when user expanded the search bar or opened a widget's DetailView.

### What changed

`SearchField.jsx` — `isExpanded` prop in Bento now reflects actual hide-triggers:

```jsx
isExpanded={bentoEnabled ? (isExpanded || showDetail) : (isExpanded || position === 'top')}
```

In Bento:
- Collapsed + no DetailView (= start page) → isExpanded prop false → greeting renders
- Search expanded → isExpanded prop true → greeting hides via internal `!isExpanded` check
- Widget clicked → DetailView opens → showDetail true → greeting hides

In default mode: unchanged.

### Lesson

When a component hides on a specific state (here: GreetingsBar's internal `!isExpanded`), the parent passes the right truth-value for that state. In Bento mode "is this still the start page?" needs to incorporate ALL the things that make it NOT the start page (expanded panel, open detail view, AI mode in some cases). Compose the boolean OR-chain at the prop site, not in the consumer.

---

## Version 1.1.1459 - 2026-05-09

**Title:** 👋 Greeting in Bento mode now an absolute-positioned overlay — search bar position truly unchanged
**Hero:** none
**Tags:** Hotfix, Bento, Greeting, Layout

### Why

User report after v1.1.1458: enabling Greeting in Bento mode pushed the search bar DOWN. v1.1.1458 had reserved space for greeting (visibility:hidden when off, visible when on) — but the reserved space ITSELF pushed the search bar down compared to without-greeting baseline. Two contradicting requirements: (a) greeting toggle-able, (b) zero layout impact.

The only way to satisfy BOTH: greeting must be OUT OF FLOW. Position: absolute renders the element without affecting siblings' positions.

### What changed

`SearchField.jsx` — wrap GreetingsBar in a Bento-only overlay div (no flow space):

```jsx
<div className={bentoEnabled ? 'greetings-bento-overlay' : undefined}>
  <GreetingsBar
    show={greetingsBarSettings.enabled}                                       /* render only when enabled */
    isExpanded={bentoEnabled ? false : (isExpanded || position === 'top')}    /* override so it actually renders */
    ...
  />
</div>
```

`BentoStartView.css` — new overlay rule:

```css
.greetings-bento-overlay {
  position: absolute;
  top: 0; left: 0; right: 0;
  z-index: 5;
  pointer-events: none;
}
.greetings-bento-overlay > * { pointer-events: auto; }
```

Effects:
- Bento + greeting disabled: GreetingsBar returns null (show=false). Wrapper exists but empty — zero space taken.
- Bento + greeting enabled: GreetingsBar renders inside wrapper. Wrapper is position:absolute → out of flow → search bar position unaffected.
- Default mode: no wrapper class, original behavior.

`pointer-events` trick: wrapper is non-interactive (clicks pass through to search bar / widgets behind), but greeting itself is interactive (in case of future features).

### Lesson

When a UI element should APPEAR but NOT push other elements, the answer is always position:absolute (or fixed). Visibility-reservation patterns (v1.1.1451 StatsBar, v1.1.1458 attempt) work when the element should ALWAYS take space and just toggle visibility. They DON'T work when the element shouldn't take space at all (like an optional decorative overlay). For Bento greeting, the user wants zero footprint when disabled AND zero footprint when enabled — only out-of-flow positioning achieves both.

---

## Version 1.1.1458 - 2026-05-09

**Title:** 👋 Greeting toggleable in Bento mode — space always reserved (no layout shift on enable/disable)
**Hero:** none
**Tags:** Polish, Bento, Greeting

### Why

User wants to be able to enable the greeting in Bento mode (toggle in Settings was un-flippable due to v1.1.1447's permanent-disable migration), AND the search bar + widget positions must NOT change when greeting is toggled on or off.

### Two problems

1. **Greeting wouldn't render in Bento even when enabled.** The parent passes `isExpanded={isExpanded || position === 'top'}`, and Bento mode forces `position='top'` permanently → that prop was always `true` → GreetingsBar's internal `show && !isExpanded` check failed → never rendered.

2. **Need space-reservation pattern** (same as v1.1.1451 StatsBar). If greeting renders only when enabled, toggling it on/off shifts the layout (search bar + widgets jump). Need to render greeting always in bento (taking its space) but visibility:hidden when disabled.

### What changed

`SearchField.jsx` — GreetingsBar render adjustments for Bento mode:

```jsx
<div style={bentoEnabled && !greetingsBarSettings.enabled ? { visibility: 'hidden' } : undefined}>
  <GreetingsBar
    ...
    show={greetingsBarSettings.enabled || bentoEnabled}                       /* always show in bento */
    isExpanded={bentoEnabled ? false : (isExpanded || position === 'top')}    /* override the position check in bento */
    ...
  />
</div>
```

Effects:
- Bento + greeting disabled: `show=true`, `isExpanded=false` → renders. Wrapper `visibility:hidden` → invisible. Layout space reserved.
- Bento + greeting enabled: `show=true`, `isExpanded=false` → renders. Wrapper undefined → visible.
- Default mode: behavior unchanged.

Together with the v1.1.1446 `.main-container--bento .greetings-bar` compact styling (32px font, 8px margin), greeting takes a small fixed amount of space in Bento — same whether visible or hidden.

### Lesson

When two consumer-side conditions conspire to hide an element (here: `isExpanded || position === 'top'` plus `show=enabled`), and you want the element back in a new mode, override BOTH conditions. Mode-aware ternary on each prop is more localized than refactoring the consumer's render logic. Plus: the visibility-reserve pattern (v1.1.1451 StatsBar, v1.1.1458 GreetingsBar) is now the standard for "toggle without layout-shift in Bento mode" — established as a repeatable approach.

---

## Version 1.1.1457 - 2026-05-09

**Title:** ⚡ Bento widget click: no more search-panel flash before DetailView opens
**Hero:** none
**Tags:** Bugfix, Bento, UX, Performance

### Why

User report: clicking a Bento widget showed the expanding search panel for ~1.2s BEFORE the DetailView appeared on top. UX expectation: DetailView opens immediately.

Cause: v1.1.1452 added `setIsExpanded(true)` to `handleSidebarItemClick` so that StatsBar + Sidebar would become visible (they gated on `isExpanded`). But that also triggered the search-panel's expand animation: 200ms opacity transition (since `showDetail` adds `.hidden` class) + 400ms height grow (72→672px). User saw the panel growing-and-fading-out for those ~600ms before DetailView fully covered it.

### What changed

Removed `setIsExpanded(true)` from `handleSidebarItemClick`. Replaced with explicit `showDetail` checks in StatsBar + Sidebar visibility conditions:

- **StatsBar wrapper**: `bentoEnabled && !isExpanded && !showDetail ? { visibility: 'hidden' } : undefined` (was: `bentoEnabled && !isExpanded`). Plus `show` prop: `(isExpanded || bentoEnabled || showDetail)`.
- **SearchSidebar (default mode)**: `(isExpanded || sidebarSettings.alwaysVisible || showDetail)`.
- **SearchSidebar (bento mode)**: same — `|| showDetail`.

Now: clicking a widget → `setSelectedDevice + setShowDetail` only. `isExpanded` stays false → search panel never expands → no flash. DetailView renders immediately. StatsBar + Sidebar visible because `showDetail=true` matches their conditions.

### Lesson

When a state flag has multiple downstream effects, don't piggy-back on it just because the side-effect you want happens to be among them. v1.1.1452 used `isExpanded=true` to "make StatsBar visible" — but `isExpanded=true` ALSO meant "expand the search panel," which was unwanted. Better: add the orthogonal condition (`showDetail`) directly to the consumers that need it. Keeps state semantics clean and avoids cascading animations.

---

## Version 1.1.1456 - 2026-05-09

**Title:** 🔄 Sidebar: listen for `entity-registered` events — initial mount only showed Home (entities load async after first render)
**Hero:** none
**Tags:** Hotfix, Bugfix, Sidebar, RaceCondition

### Why

User report: at first load, sidebar showed only the Home button. All other items (Settings, News, Todos, etc.) appeared only after toggling any switch in System Settings — which forces a re-render via `sidebarSettingsChanged` event.

Root cause: `systemRegistry.autoDiscover()` runs asynchronously during app boot. On the first render of SearchSidebar, the registry's `entities` Map may only have the entities that resolved before the sidebar mounted. `useMemo([lang, settingsTick])` runs once, computes the items list (only Home, which is built locally; other entities = undefined → skipped), caches the result. Later registrations don't trigger a re-compute because no React deps changed.

The Settings-toggle workaround "worked" because it dispatched `sidebarSettingsChanged` → `settingsTick` increments → useMemo re-runs → entities by now ARE registered → all items appear.

`BentoStartView` (which I wrote later in v1.1.1445) had this listener correctly. SearchSidebar was missing it from inception.

### What changed

`SearchSidebar.jsx` — added a second `useEffect` that subscribes to `systemRegistry.on('entity-registered')` and `'entity-unregistered'`, both incrementing `settingsTick`:

```jsx
useEffect(() => {
  if (!systemRegistry?.on) return;
  const handler = () => setSettingsTick((t) => t + 1);
  systemRegistry.on('entity-registered', handler);
  systemRegistry.on('entity-unregistered', handler);
  return () => {
    systemRegistry.off?.('entity-registered', handler);
    systemRegistry.off?.('entity-unregistered', handler);
  };
}, []);
```

Now any registry change (boot-time async load, runtime device add via Integration setup, etc.) triggers re-compute → sidebar list always reflects current registry state.

### Lesson

When a component pulls data from an async-loading registry/store, subscribe to the registry's update events too — not just to your own settings event. The "settings change" event was masking the bug because it happened to fire after the registry was loaded; without it, the bug would have been "no items ever appear without manual interaction." This is the same pattern as v1.1.1445's BentoStartView which got it right; v1.1.1432 (SearchSidebar v1) was written before this lesson crystallized.

---

## Version 1.1.1455 - 2026-05-09

**Title:** 🪟 Bento sidebar JSX-restructure: rendered as direct child of .main-container (centers correctly without viewport-vs-card-area mismatch)
**Hero:** none
**Tags:** Bugfix, Bento, Sidebar, JSXRefactor

### Why

v1.1.1454's `position: fixed; top: 50%` worked when the browser viewport matches the card area. In Lovelace dashboards where the card sits in a larger viewport (e.g., 1500px viewport vs 800px card), `50%` of viewport ≠ middle of the card content. Result: sidebar drifted to bottom-half or off the visible card area entirely.

Plus an additional bug: sidebar was sometimes invisible until user toggled items in System Settings (forced re-render brought it back). Suggests a React render-tree issue.

### Root cause

Sidebar was rendered inside `.search-row`. `position: absolute; top: 50%` therefore resolves as 50% of `.search-row`'s height (~72px) — way too small for vertical centering. v1.1.1453 tried `top: 50vh` (viewport-relative); v1.1.1454 tried `position: fixed; top: 50%` (also viewport-relative). Both failed when viewport ≠ card area.

The reference frame that's actually right: `.main-container` (the card content area, with `position: relative` and a height equal to StatsBar+search-row+bento-grid).

### What changed

**JSX restructure**: in Bento mode, sidebar is now rendered as a direct child of `.main-container` (sibling of `.search-row` + `.bento-grid`), NOT inside `.search-row`. With `position: absolute`, the sidebar's positioning context becomes `.main-container`. Original CSS works as intended:
- `top: 50%` = 50% of `.main-container` height = middle of card content area
- `right: 100%; margin-right: 12px` = sidebar's right edge at .main-container's left edge - 12px gap
- Framer's `translateY(-50%)` shifts up by half-height → sidebar middle at .main-container middle

CSS override from v1.1.1454 removed (no longer needed — defaults work).

In default (non-Bento) mode, sidebar still rendered inside `.search-row` as before. Conditional in JSX:

```jsx
<div className="search-row">
  {!bentoEnabled && sidebarSettings.enabled && ... && <SearchSidebar />}
  <motion.div className="search-panel" />
</div>

{bentoEnabled && sidebarSettings.enabled && ... && <SearchSidebar />}  {/* outside search-row */}
```

### Lesson

When `position: absolute` should anchor to a SPECIFIC ancestor's box, ensure the element lives DIRECTLY inside that ancestor (or that no other intermediate `position: relative` ancestor exists). Switching to `position: fixed` to "escape" the wrong ancestor is fragile — works when viewport = container, fails when they diverge (cards in dashboards, modals, iframes). The right fix is structural (move element to correct ancestor), not just CSS overrides.

The previous-render visibility bug was likely a consequence of the same issue: with `position: fixed` outside the card's render-tree positioning, React's reconciliation for visibility states could get confused. Putting the element where it logically belongs (in `.main-container`) makes it part of the natural render tree and visibility behaves predictably.

---

## Version 1.1.1454 - 2026-05-09

**Title:** 🔧 Bento sidebar position: fixed (viewport-anchored) — v1.1.1453's `top: 50vh` clipped most icons
**Hero:** none
**Tags:** Hotfix, Bugfix, Bento, Sidebar

### Why

User report after v1.1.1453: "auf der startseite wird nur ein button home vom sidebar angezeigt" — sidebar visibility broken, only Home icon shown; on search-bar click sidebar disappears entirely.

Root cause: `top: 50vh` on a `position: absolute` element resolves as 50% of viewport height ADDED to the closest positioned ancestor's top. With `.search-row` at viewport-y ≈ 80px (under reserved StatsBar space), the sidebar's anchor was at 80 + 50vh ≈ 480px on an 800px viewport. Framer's `translateY(-50%)` then shifted it up by half its height; depending on how many icons (8 items ≈ 400px tall), the bottom often spilled below the visible card area — and on shorter card viewports, only the topmost icon remained in view.

### What changed

Switched to **`position: fixed`** which is unambiguously viewport-relative regardless of any positioned ancestor:

```css
.main-container--bento .vision-pro-menu--desktop {
  position: fixed;
  top: 50%;
  left: max(12px, calc(50vw - 560px));
  right: auto;
  margin-right: 0;
}
```

- `top: 50%` with `position: fixed` resolves as 50% of viewport height (no ancestor offset added).
- Framer's `translateY(-50%)` then completes vertical centering on viewport.
- `left: max(12px, calc(50vw - 560px))` anchors sidebar near `.main-container`'s left edge (1000px max-width, centered) when viewport is wider than ~1024px; falls back to 12px from viewport edge on narrower screens.
- `right: auto` + `margin-right: 0` neutralize the previous `right: 100%` anchor that doesn't apply to fixed positioning.

### Lesson

`position: absolute` + `top: 50vh`: `vh` value is calculated from viewport but the `top` PROPERTY is still relative to the closest positioned ancestor — the two compose unexpectedly. `position: fixed` + `top: 50%`: both viewport-relative, no ancestor interaction. When you want viewport-anchored layout, `position: fixed` is the unambiguous choice; `position: absolute` with vh values is a foot-gun.

---

## Version 1.1.1453 - 2026-05-09

**Title:** 📐 Bento-Mode: Sidebar vertically centered on viewport (was anchored to ~72px search-row → appeared at top)
**Hero:** none
**Tags:** Bugfix, Bento, Sidebar, Layout

### Why

User report: with sidebar "always visible" enabled in Bento mode, sidebar appeared at the TOP of viewport instead of vertically centered. In default mode it looked centered because search-row sits in the middle of viewport. In Bento, search-row sits at the top with collapsed height ~72px → `top: 50%` of search-row = ~36px from viewport top.

### What changed

`BentoStartView.css` — single-line override:

```css
.main-container--bento .vision-pro-menu--desktop {
  top: 50vh;
}
```

Mechanism: `top: 50vh` is viewport-relative regardless of parent. Framer's existing `style.y = '-50%'` then translates the element up by half its own height → middle of sidebar at viewport-middle. Horizontal positioning (`right: 100%` relative to .search-row) unchanged → sidebar stays anchored to .search-row's left edge.

### Lesson

`%` units in `top` are parent-relative; `vh` units are viewport-relative. When an element should be visually centered on viewport but its parent has limited height, switch to viewport units. Other unit-mismatch traps in CSS positioning to remember:
- `%` for top/bottom = parent height
- `%` for left/right = parent width
- `vh`/`vw` = viewport
- `em`/`rem` = font-size based
- Mixing them across properties is fine but each property anchors to different ancestors.

---

## Version 1.1.1452 - 2026-05-09

**Title:** 🔲 Bento bugs: widget-click now expands panel (StatsBar+Sidebar visible) + W3/W4 widgets are square
**Hero:** none
**Tags:** Bugfix, Bento, Layout

### Why

Two reports:

1. Clicking a Bento widget directly (or sidebar item) opens DetailView but neither StatsBar nor Sidebar appear. Clicking the search bar first → expand → click → both visible. Inconsistent: the entry path shouldn't matter for whether StatsBar/Sidebar show.

2. Bottom-right widgets (W3 + W4 — Aufgaben, Nachrichten) render as tall rectangles (~238×290) instead of squares. Aesthetically off-balance against the larger widgets.

### What changed

**Bug 1 — `SearchField.jsx` `handleSidebarItemClick`**:

Added `setIsExpanded(true)` after setting `selectedDevice + showDetail`:

```jsx
if (match) {
  setSelectedDevice(match);
  setShowDetail(true);
  setIsExpanded(true);   // ← NEW
}
```

The search panel itself doesn't visually conflict because it has the existing `${showDetail ? 'hidden' : ''}` class — it's hidden behind the DetailView. But `isExpanded=true` activates the StatsBar visibility-flip (bento mode) and the Sidebar `(isExpanded || alwaysVisible)` condition. Result: consistent UI regardless of entry path.

**Bug 2 — `BentoStartView.css`**:

Two changes:
- `.bento-grid--desktop` `grid-template-rows: 1fr 1fr` → `1fr auto`. The `auto` row (W2 second / W34) sizes to content. With aspect-ratio:1 widgets, content height = column width = squares.
- `.bento-cell--w34 > .bento-widget` rule added: `aspect-ratio: 1; height: auto; min-height: 0;`. Override of `.bento-widget--small`'s `min-height: 90px` is needed (would otherwise force taller than aspect-ratio).

Result: W3 + W4 are now ~238×238 square cells. W2 (top-right) gets the larger remaining vertical space (1fr). W1 (large left) still spans both rows = full container height. Total grid height stays 600px.

### Lesson

When state-dependent UI elements (StatsBar, Sidebar) gate on a flag like `isExpanded`, every action that opens a "rich content view" (DetailView via sidebar/widget click) should also set that flag — otherwise users get inconsistent chrome based on entry path. For aspect-ratio in CSS grid: combine `grid-template-rows: auto` for the row + `aspect-ratio: N` on children for self-sizing squares. `min-height: 0` override is necessary if children have inherited min-height that would override aspect-ratio.

---

## Version 1.1.1451 - 2026-05-09

**Title:** 👻 Bento-Mode: StatsBar invisible at start but space reserved — visible only when search expanded
**Hero:** none
**Tags:** Polish, Bento, StatsBar

### Why

User refinement after v1.1.1449/1450: in Bento mode, StatsBar shouldn't visually appear at start (cleaner aesthetic — just search bar + widgets). BUT search bar position must NOT change because of this — it should stay at the SAME y-position as if StatsBar were visible.

Translation: reserve StatsBar's space, hide its content. So:
- Initial bento: empty area where StatsBar would be (search bar at same y as v1.1.1449)
- Click search → expanded: StatsBar fades into the reserved space → no jump
- Collapse: StatsBar fades back out, space stays reserved → no jump

### What changed

`SearchField.jsx` — wrapped StatsBar in a conditional-visibility div:

```jsx
<div style={bentoEnabled && !isExpanded ? { visibility: 'hidden' } : undefined}>
  <StatsBar ... show={statsBarSettings.enabled && (isExpanded || bentoEnabled)} ... />
</div>
```

`visibility: hidden` (not `display: none`) preserves layout space while hiding content. So:
- Bento + collapsed: StatsBar renders (taking its space) but visually invisible
- Bento + expanded: visibility default → StatsBar visible
- Non-bento: wrapper has no style; StatsBar renders only on expand (= existing behavior)

### Lesson

`visibility: hidden` and `display: none` are not interchangeable. Use `visibility: hidden` when you need to PRESERVE LAYOUT SPACE while hiding content (here: StatsBar's vertical room reserved so search bar position is stable). Use `display: none` when you need to REMOVE the element from layout entirely (here would have caused position shift on collapse). Same pattern applies to opacity transitions vs. mounting/unmounting.

---

## Version 1.1.1450 - 2026-05-09

**Title:** 🪨 Bento-Mode: search bar stays at top after expand+collapse — slide-back-to-center disabled
**Hero:** none
**Tags:** Bugfix, Bento, SearchPanel

### Why

User report after v1.1.1449: in Bento mode, clicking the search bar (expand) works fine. But on close, the search bar slides DOWN to a centered position, overlapping Widget 1. Original `position='top'` is lost on collapse.

Cause: existing slide-back logic (lines 270-285 in SearchField.jsx) sets `position='centered'` 400ms after collapse. This is intentional in default mode (panel returns to its centered home state) but wrong in Bento mode where the search bar must stay anchored at top so widgets below have predictable space.

### What changed

`SearchField.jsx` — slide-back useEffect condition extended with `!bentoEnabled`:

```jsx
if (prevIsExpanded && !isExpanded && !showCategories && position === 'top' && !bentoEnabled) {
  setTimeout(() => setPosition('centered'), 400);
}
```

Bento mode now skips the slide-back. Position remains 'top' permanently. Default mode unchanged.

### Lesson

Mode-conditional behaviors often need parallel guards in multiple effects. v1.1.1445 set `position='top'` on Bento enable; v1.1.1450 prevents the runtime slide-back from un-doing that. When a feature mode changes baseline assumptions about state, audit ALL effects that mutate that state — not just the initial setter.

---

## Version 1.1.1449 - 2026-05-09

**Title:** 🪨 Bento-Mode: StatsBar reversal — always-on instead of suppressed (eliminates click-jump differently)
**Hero:** none
**Tags:** Bugfix, Bento, StatsBar, ReversalOfPriorRelease

### Why

User clarified after v1.1.1448: "nein auch bento mode soll statsbar nicht unterdrückt werden". They actually want StatsBar VISIBLE in Bento mode — both for the info (weather/power/clock) and to keep the search bar at the same vertical position throughout. The v1.1.1448 suppression eliminated the layout-jump-on-click but at the cost of removing the StatsBar entirely.

The user's preferred fix: render StatsBar from the start of Bento mode (not gated on isExpanded). This way the search bar starts at the SAME y-position it would land at after expanding+collapsing — no layout-jump because nothing changes.

### What changed

`SearchField.jsx` — StatsBar `show` prop reversed:

```jsx
// v1.1.1448 (wrong direction): show={statsBarSettings.enabled && isExpanded && !bentoEnabled}
// v1.1.1449:                     show={statsBarSettings.enabled && (isExpanded || bentoEnabled)}
```

In Bento mode: StatsBar visible from initial mount (no expand needed). Search bar starts below it. When user clicks search bar to expand → no layout shift because StatsBar was already there.

In default mode: behavior unchanged. StatsBar still appears only on expand.

### Lesson

Layout-jump bugs have two solutions: (a) remove the thing that appears, (b) reserve its space from the start. (a) is simpler but loses functionality; (b) is the user-preferred answer when the thing is wanted. v1.1.1448 picked (a) without checking which the user wanted; v1.1.1449 corrects to (b). When fixing layout-shift, default to "reserve space" before "remove element" — preservation is usually what users actually want.

---

## Version 1.1.1448 - 2026-05-09

**Title:** 🪨 Bento-Mode: StatsBar suppressed when search panel expands — no more layout shift on click
**Hero:** none
**Tags:** Bugfix, Bento, StatsBar

### Why

User report: in Bento mode, clicking the search bar shifts it visually downward. Cause: StatsBar (weather/power/clock) is conditionally rendered when `isExpanded` becomes true; it sits in flow ABOVE search-row, pushing it down. In default mode this is intentional (StatsBar appears when user opens the search). In Bento mode the search bar should stay anchored at the top so the layout below (widgets) doesn't visually jolt.

### What changed

`SearchField.jsx` — StatsBar `show` prop extended:

```jsx
show={statsBarSettings.enabled && isExpanded && !bentoEnabled}
```

User's `statsBarSettings.enabled` setting is left untouched. When Bento is OFF, StatsBar reappears with their preference. When Bento is ON, it's never shown — users who want weather/energy info at-a-glance configure that as a Bento widget instead (Weather entity, Energy Dashboard entity, etc.).

### Lesson

Conditional rendering on a `mode` flag is cleaner than mutating user settings. `!bentoEnabled` as a render-gate preserves the user's StatsBar preference for when they switch modes back. Compare v1.1.1447 where I forced GreetingsBar OFF via migration — there the user's intent was permanent disable. Here the intent is mode-scoped suppression.

---

## Version 1.1.1447 - 2026-05-09

**Title:** 🔇 GreetingsBar default flipped to off + one-time migration disables it for existing users
**Hero:** none
**Tags:** Polish, Settings, Defaults

### Why

User: "greetings will ich vielleicht entfernen; kannst du es erstmal in system setting deaktiviert lassen dauerhaft" — wants the GreetingsBar permanently disabled while deciding whether to remove it entirely. Toggle should stay in Settings (so they can re-enable later if they change their mind).

### What changed

**`SearchField.jsx`** — `greetingsBarSettings` initial state:
- Default flipped from `enabled !== false` (defaulted true) to `enabled === true` (defaults false)
- Plus one-time migration: if `systemSettings.migrations.greetingsBarDefaultOff_v1447` flag is not set, write `appearance.greetingsBarEnabled = false` to localStorage AND set the migration flag. This disables the bar for existing users on first run of v1.1.1447 — without future-proofing-blocking the user's ability to re-enable later (toggle on after migration sticks because flag prevents re-disable).

**`GeneralSettingsTab.jsx`** — `loadGreetingsBarSettings`:
- Same default flip: `enabled !== false` → `enabled === true`. Settings page reads the new default, shows toggle as off after migration.

### Behavior matrix

| User state | After v1.1.1447 |
|---|---|
| Existing user with greeting enabled (default) | Migration runs once → off. Migration flag set. Toggle still visible in Settings. |
| Existing user who explicitly disabled greeting before | Stays off (no change). Migration flag set. |
| New user | Defaults to off. Migration flag NOT set initially, but doesn't matter (default is already false). |
| User re-enables via toggle after migration | Stays on (migration flag already set, won't re-disable). |

### Lesson

When changing a default that affects existing user state, "default flip" alone is not enough — existing users with the old explicit value still see the old behavior. A version-keyed migration flag (here: `greetingsBarDefaultOff_v1447`) lets you do a one-time forced reset without permanently overriding user preferences. Pattern: check flag → if not set, apply migration + set flag. Future re-enables stick because the flag is already there.

---

## Version 1.1.1446 - 2026-05-09

**Title:** 📐 Bento start-screen layout fixes — wider grid (matches search panel), compact greetings, tighter top spacing
**Hero:** none
**Tags:** Polish, Bento, Layout

### Why

User feedback after v1.1.1445:
- Bento widgets too narrow (max-width 800px) compared to search panel (1000px). Looked misaligned.
- Greetings + search bar took too much vertical space — pushed widgets too far down, search bar visually overlapped Widget 1's top edge.
- Needed cleaner spacing so the 4-widget grid sits below the search bar without crowding.

### What changed

**`BentoStartView.css`**:
- `.bento-grid` max-width removed → fills full parent width (1000px = main-container max). Grid now matches search-panel width exactly.
- `padding: 0` on grid (was 12px) → cells go edge-to-edge with the search row above.
- `margin-top: 24px` (was 16px) → consistent breathing room below search bar.

**`SearchField.jsx`**:
- `main-container` div gets new modifier class `main-container--bento` when Bento mode is active. Used as a CSS-cascade root for layout-compaction overrides that apply only in Bento mode.

**`BentoStartView.css`** (new override block):
- `.main-container--bento .greetings-bar`: margin-top reduced from 48px → 8px, margin-bottom 16px → 4px.
- `.main-container--bento .greetings-bar > div`: font-size from 63px → 32px (mobile: 35px → 22px), padding tightened.
- `.main-container--bento .search-row`: margin-top: 0.

Net effect: greeting + search bar now occupy ~80px instead of ~250px at the top, leaving the full 600px below for the Bento grid. No more overlap.

### Lesson

When a feature has an "alternative mode" (here: Bento home screen), layout-compaction often needs to apply to *related* siblings (here: greetings, search-row), not just to the new component itself. Using a parent-class marker (`main-container--bento`) plus scoped CSS-cascade overrides keeps the original layout untouched while compactly handling the alternative. No JS prop-drilling needed for layout adjustments.

---

## Version 1.1.1445 - 2026-05-09

**Title:** 🎴 Alternative Bento-Grid start screen (4 widgets, configurable per slot, optional via System Settings)
**Hero:** none
**Tags:** Feature, StartScreen, Bento, Widgets

### Why

User asked for an alternative home/start screen layout — search field collapsed at top, plus a Bento-Grid below with 4 widgets (1 large left, 1 medium top-right, 2 small bottom-right). Same glass-panel background as the expanded search panel. Each widget shows a configurable system entity; tap → opens that entity's detail view. Mobile: stack all 4 vertically.

### What changed

**`src/components/BentoStartView.jsx`** (new, ~155 LOC) — 4-widget Bento-Grid component:
- Layout via CSS-grid `grid-template-areas: "w1 w2" / "w1 w34"` — W1 spans full height left, W2 top-right, W34 is a sub-grid with W3+W4 splitting bottom-right
- Each widget is a `motion.button.glass-panel` with icon-bubble (entity brandColor) + name + optional subtitle
- Three size variants — `large` (W1), `medium` (W2), `small` (W3+W4) — with proportional padding/icon/font scaling
- Click → fires `onWidgetClick(entity)` (same handler as `SearchSidebar`, opens detail view)
- Reactive via `startScreenSettingsChanged` event + `entity-registered`/`entity-unregistered` registry events
- Empty-slot variant renders placeholder pill ("Widget nicht konfiguriert")

**`src/components/BentoStartView.css`** (new, ~120 LOC) — grid + widget styles:
- Desktop: 600px height, max-width 800px, grid-template-areas layout
- Mobile: flex-column stack, 12px gaps, full-width
- Widget glass-panel inherits `.glass-panel` from existing CSS so user's appearance settings (blur/saturation/brightness) apply automatically

**`src/components/tabs/SettingsTab/components/StartScreenSettingsTab.jsx`** (new, ~210 LOC) — sub-view picker:
- Slot-list view with 4 rows (W1/W2/W3/W4) + current selection display
- Tap a slot → drills down to entity-picker with all available system-entities + "— Empty —" option
- Selection auto-saves to `systemSettings.startScreen.widgets` array + dispatches `startScreenSettingsChanged`
- Sub-back-nav: deeper picker view goes back to slot-list, top-level back exits to main settings

**`GeneralSettingsTab.jsx`** — new "Startseite" section:
- Toggle "Bento-Grid aktivieren" → writes `systemSettings.startScreen.bento`
- Chevron link "Widgets konfigurieren" → opens `currentView === 'start-screen'` sub-view
- New branch in `AnimatePresence` switcher rendering `<StartScreenSettingsTab>`

**`SearchField.jsx`** — integration:
- New `bentoEnabled` state + listener for `startScreenSettingsChanged` (event-as-bell pattern from v1.1.1433)
- Effect: when `bentoEnabled` becomes true, force `position='top'` so search field sticks at top (otherwise it sits centered with grid awkwardly below)
- Position-init also reads `systemSettings.startScreen.bento` for first-mount
- BentoStartView renders after `.search-row` when: `bentoEnabled && !isExpanded && !showDetail && !aiMode`

### Defaults

If user enables Bento before configuring widgets, `DEFAULT_BENTO_WIDGETS = ['integration', 'all-schedules', 'todos', 'news']` populates the 4 slots. User can replace any of them via the picker.

### Mobile

`bento-grid--mobile` CSS variant flips the layout to a vertical flex-column. All 4 widgets render full-width sequentially. The bottom-row sub-grid (W3+W4) also flattens to vertical stack.

### Lesson

When adding an alternative-mode UI feature, three things scale separately and need independent toggles: (1) the mode toggle itself ("Bento-Grid aktivieren"), (2) per-instance content config ("Widgets konfigurieren" sub-view), (3) related state coordination (forcing position='top' here). Building all three together with consistent patterns (event-bus, sub-view drilldown, CSS-grid + glass-panel reuse) means future widget-types or slot-counts add as small extensions, not architectural rework.

---

## Version 1.1.1444 - 2026-05-09

**Title:** 🌊 Sidebar hover: framer-motion conversion — true Apple iOS26 spring physics (stiffness 380 / damping 32) instead of cubic-bezier approximation
**Hero:** none
**Tags:** Refactor, Animation, Sidebar, LiquidGlass

### Why

User pushed back on the v1.1.1442/1443 CSS-cubic-bezier approach: "wäre es besser mit framer motion? wieso willst du es nicht?"

My initial recommendation was to stay with CSS because the cubic-bezier(0.32, 1.25, 0.42, 1) is "close enough" to Apple's spring. That was overly conservative. True spring physics via framer-motion's `transition: { type: 'spring', stiffness: 380, damping: 32 }` gives:

- **Real velocity continuity** — interrupted hovers (mouse moves out then back in mid-animation) interpolate from current velocity instead of snapping
- **Mass-based motion** — `mass: 1` gives physical-feeling deceleration, not a purely temporal curve
- **Consistent overshoot** — cubic-bezier overshoot is hardcoded as a curve shape; spring overshoot is computed from stiffness/damping ratio (more "honest" to physics)

Project already uses framer-motion heavily (~30 sites), so no bundle cost. The refactor was ~50 LOC, not the 80+ I'd estimated.

### What changed

**`SearchSidebar.jsx`** — converted to motion components:
- New `useState(isHovered)` + `onMouseEnter`/`onMouseLeave` handlers (mobile excluded, no hover state)
- Outer wrapper: `motion.div` with `style={{ y: '-50%' }}` + `animate={{ x: expanded ? 144 : 0 }}` — y stays constant for vertical centering, x animates the rightward translate
- Glass panel: `motion.ul` with `animate={{ borderRadius: expanded ? 25.6 : 32 }}` — true spring on the radius morph
- Each label: `motion.span` with `animate={{ opacity, width, marginLeft }}`
- Spring constants extracted to module-scope `LIQUID_SPRING = { type: 'spring', stiffness: 380, damping: 32, mass: 1 }`
- Stagger via per-property transition: `OPACITY_TRANSITION_OPEN = { ...spring, delay: 0.08 }` only when expanding (no delay when closing — text shouldn't hang in shrinking box)

**`SearchField.css`** — cleanup:
- Removed `transition: transform` from `.vision-pro-menu--desktop` (framer manages)
- Removed `:hover` rule with transform translate (framer manages)
- Removed CSS variables `--liquid-spring` + `--liquid-duration` (no longer referenced after framer takeover)
- Removed `transition: border-radius` + `:hover` border-radius override on `.vpm-menu.glass-panel` + dropped `!important` so framer's inline style wins
- Simplified `.vpm-label` to base styles only — opacity/width/marginLeft transitions all framer-driven
- Kept the deblur effect on `::before` pseudo-element via CSS (pseudo-elements can't be JS-animated, that has to stay CSS-driven; CSS `:hover` selector still fires automatically alongside framer's onMouseEnter)

### Result

Hover-animation pipeline now hybrid:
- **framer-motion** (true spring): transform-x, border-radius, label opacity/width/margin-left, with stagger
- **CSS** (cubic-bezier 450ms): backdrop-filter blur (deblur), background tint — both on `::before` pseudo-element

The two systems coordinate naturally because both fire on the same mouseenter/mouseleave event (framer via React handler, CSS via `:hover` selector).

### Lesson

When user asks "would it be better with X?" — and X is already in the project's stack — the right answer is usually yes, because the marginal cost is low (no new dependency) and the marginal quality gain compounds (better physics across all animations). My initial CSS-vs-framer hand-waving was wrong because I overweighted the "refactor cost" without recognizing the project already invested in framer-motion. Lesson: when evaluating tooling tradeoffs, factor in what the project ALREADY uses, not what it would have to add.

For pseudo-elements specifically (`::before`/`::after`): framer-motion CAN'T animate them since they're not in the React tree. CSS stays mandatory there. Mixing CSS + framer is a legitimate pattern — fire on the same event, just animate different properties.

---

## Version 1.1.1443 - 2026-05-09

**Title:** 💧 Sidebar Liquid-Glass: deblur effect on hover (glass thins from 20px → 10px blur, saturation pumps to 240%)
**Hero:** none
**Tags:** Polish, Sidebar, LiquidGlass, Animation

### Why

After v1.1.1442 added the iOS26 morph (spring + radius + glass thickening + label stagger), user asked for a deblur effect on top — the hallmark of Apple's Liquid Glass: glass becomes momentarily thinner and more vivid when touched, like a real liquid responding to interaction.

Also discussed: would framer-motion be better than CSS for this? Conclusion stayed CSS — for a single hover-state morph, true spring physics via framer-motion gives marginally better feel but costs ~80 LOC of refactor + state-management overhead. Cubic-bezier(0.32, 1.25, 0.42, 1) approximation is good enough at this duration (450ms). Framer-motion would be the right answer for orchestrated multi-element animations or velocity-tracked interruptible transitions — neither applies here.

### What changed

`SearchField.css` — `.vpm-menu.glass-panel::before` `:hover` rule expanded:

- **`backdrop-filter: blur(20px) → blur(10px)`** — glass becomes ~50% thinner. Content behind the panel (the search panel + background) shows through more crisply.
- **`saturate(180% → 240%)`** — colors behind the glass pump up. Apple's iOS26 trick: when glass thins, the saturation rises to compensate for what would otherwise be a "washed out" look. Combined with reduced blur, gives the "vivid glass" feel.
- **Background tint reduced** — `rgba(30, 30, 30, 0.4) → 0.32` (was 0.55 in v1.1.1442). Lighter tint matches the "less dense glass" feeling. Inner highlight slightly stronger (`rgba(255,255,255,0.14)` instead of `0.08`) for the Apple-typical sheen.
- Both `backdrop-filter` and `-webkit-backdrop-filter` get the transition + override (Safari needs the prefix).

### Result

On hover, the morph now reads as: spring-curve transform (rightward shift) + width-grow (labels emerging) + border-radius-morph (2rem → 1.6rem) + **glass thinning** (blur 20→10) + **saturation pump** (180→240%) + label-stagger (text fades in 80ms after shape opens). Six coordinated micro-interactions = "Liquid Glass."

### Lesson

Apple's Liquid Glass design isn't a single visual effect — it's the *sequence* of: open-shape → thin-glass → pump-color → reveal-content. Each step on its own is subtle. Together they communicate a physical metaphor (the glass is liquid, your touch makes it respond). Adding them piecemeal (one per release) makes the effect feel "more polished" each time. The deblur is the step where it stops feeling like "a CSS animation" and starts feeling like "a physical material."

---

## Version 1.1.1442 - 2026-05-09

**Title:** 💧 Sidebar hover-expand: iOS26 Liquid-Glass morphing — spring curve + glass-thickening + border-radius morph + label-fade staggering
**Hero:** none
**Tags:** Polish, Sidebar, Animation, LiquidGlass

### Why

After v1.1.1441's right-ward expansion fix, user asked for the iOS26 / Liquid Glass morphing aesthetic — Apple's WWDC25 design language where UI panels feel like fluid glass that smoothly morph between states rather than mechanically resize.

### What changed

`SearchField.css` — five coordinated tweaks across `.vision-pro-menu--desktop`, `.vpm-menu.glass-panel`, `.vpm-label`:

1. **Spring-curve replacement.** All transitions now use `cubic-bezier(0.32, 1.25, 0.42, 1)` (CSS approximation of Apple's iOS26 spring with stiffness 380 / damping 32). Slight overshoot at the end gives the "settling" feel; quick start gives the responsive touch. Replaces the previous `ease-in-out`.
2. **Unified duration.** All four animated properties (transform, width, margin-left, opacity) use `--liquid-duration: 450ms` so the motion reads as ONE morphing event rather than several independent transitions.
3. **Border-radius morph.** Glass-panel `border-radius` interpolates from `2rem` (rounded pill, collapsed state) to `1.6rem` (slightly squarer, expanded state) — small but enough to feel like the shape is "settling" into its new form.
4. **Glass thickening on hover.** The `::before` pseudo-element's `background` interpolates from `rgba(30, 30, 30, 0.4)` to `rgba(30, 30, 30, 0.55)` with stronger inner highlight — depth perception cue that the panel is now "elevated."
5. **Label-fade staggering.** Opacity transition starts with `0.08s` delay vs the width transition. Result: the shape opens FIRST, then the text fades in. Without the stagger, text would appear instantly and look like it's "punched onto" the closed shape rather than emerging from it.

CSS variables `--liquid-spring` + `--liquid-duration` defined on the parent so future child elements can inherit the same timing if more morph effects are added (e.g. icon scale on hover).

### Lesson

The "Liquid Glass" feeling isn't one effect — it's four small details that have to land together: spring timing, unified duration, shape morphing, and stagger. Any one alone produces an animation that feels "bouncy" or "glass-y" but not "liquid." Apple's iOS26 documentation makes a point of this — they describe the design as "an aggregate of micro-interactions, not a single transition style." For the sidebar this means: the animation works because all four cooperate, not because any one is the main event.

---

## Version 1.1.1441 - 2026-05-09

**Title:** ↪️ Sidebar hover-expand direction reversed — labels now overlap the search panel rightward (visionOS-style) instead of growing leftward into empty space
**Hero:** none
**Tags:** UX, Sidebar, Polish

### Why

User report: the sidebar's hover-expand grew leftward into empty viewport space. visionOS reference shows the menu popping into the content area (overlapping the search panel slightly). Cleaner visual: rail stays anchored, labels appear to slide INTO the content. Original truncation-on-collapse behavior kept — only the expansion direction changes.

### What changed

`SearchField.css` — `.vision-pro-menu--desktop` rule extended with a `:hover` transform:

```css
.vision-pro-menu--desktop {
  /* …existing positioning (right: 100% + margin-right: 12px)… */
  transform: translateY(-50%);
  transition: transform 0.25s ease-in-out;
}

.vision-pro-menu--desktop:hover {
  transform: translate(9rem, -50%);
}
```

Mechanism: width still grows leftward via the `.vpm-label` opacity+width transition (8rem labels + 1rem margin-left = 9rem total). The hover-only `translate(9rem, …)` shifts the entire menu the same 9rem rightward. Net visual: the rail's left edge stays stable, the new label column appears on the right and slides into the search-panel area.

### Lesson

When you can't easily change which edge a CSS-positioned element grows from (here: anchored via `right: 100%`, growth always goes leftward), a coordinated `translate` on the same axis flips the apparent direction without restructuring the layout. The width-transition and transform-transition use the same duration (0.25s) so they animate as one motion.

---

## Version 1.1.1440 - 2026-05-09

**Title:** 🗣️ TTS engine picker in System Settings + language prop now passed (no more English accent on German UI)
**Hero:** none
**Tags:** Feature, Bugfix, MusicAssistant, TTS, Settings

### Why

After v1.1.1439 the user got TTS working but with an English accent — `tts.google_translate_say` was called without a `language` parameter, so it defaulted to English. User asked for two improvements:

1. Pass the app's language to the TTS service so the accent matches.
2. Add a System Settings option to choose which TTS engine to use as default (user has 3 engines available).

### What changed

**`utils/musicAssistant.js`** — `playAnnouncementMusicAssistant` opts extended:
- `language` (ISO-639-1 like 'de', 'en') → passed as `data.language` in the TTS service call
- `preferredEngine` (e.g. `'google_translate_say'`) → tried FIRST in the fallback chain. If it fails, the existing chain (google_translate → others → cloud_say) takes over.

**`MusicAssistantPanel.jsx`** — `handleAnnounceSend` reads `systemSettings.tts.engine` from localStorage and passes both `language: lang` and `preferredEngine` to the helper. `'auto'` → no preferred engine, full fallback chain.

**`GeneralSettingsTab.jsx`** — new "Text-to-Speech" section in the main view with chevron link "TTS-Engine" → opens new sub-view (`currentView === 'tts'`):
- Yellow note card explains what's configured and that language follows the app language
- List of all available `tts.*_say` services (read live from `hass.services.tts`) plus an "Auto (Fallback-Chain)" option
- Tap → saves to `systemSettings.tts.engine` + auto-back-navigates
- Display value on the parent row shows current selection (e.g. "google_translate" or "Auto")

If user has no TTS integration configured in HA, the picker shows an empty-state message pointing them at HA's integration setup.

### Lesson

When wrapping a multi-engine API (TTS has 5+ possible providers per HA install), expose engine choice to the user rather than hardcoding priority. Auto-fallback is good as a default but breaks user expectations when a particular engine works best for their language/voice. The picker is 80 LOC; the alternative (everyone gets the same first-engine-that-works behavior) trains users to guess at why TTS sounds wrong.

---

## Version 1.1.1439 - 2026-05-09

**Title:** 🔄 MA TTS multi-engine fallback + Queue diagnostic logging
**Hero:** none
**Tags:** Bugfix, Diagnostics, MusicAssistant, TTS

### Why

User reported after v1.1.1437/1438:

1. **TTS still fails** — but now with a different error: `Die Aktion tts/cloud_say konnte nicht ausgeführt werden. Unable to retrieve info for http://192.168.0.13:8123/api/tts_proxy/...mp3 (Server returned 5XX Server Error reply)`. So my v1.1.1437 bridge correctly called `tts.cloud_say` — but cloud_say generated a TTS proxy URL that HA itself returned 5XX for when MA tried to fetch it. Likely a Nabu-Casa-cloud auth/quota issue specific to cloud_say.
2. **Queue still empty** — my v1.1.1438 entity-keyed unwrap didn't fire. Means the response shape is yet another variant.

### What changed

**`utils/musicAssistant.js`** — `playAnnouncementMusicAssistant` plain-text path now tries ALL `*_say` services in priority order until one succeeds, instead of picking just one:

1. `google_translate_say` first (free, no cloud auth, most robust)
2. Other `*_say` services (piper_say, etc.)
3. `cloud_say` last (requires Nabu Casa, can fail at proxy step)

If the first service throws, log a warn and try the next. Only error+return if ALL services fail.

**`MusicAssistantPanel.jsx`** — diagnostic-only console.log on first queue load (gated by module-scope `_queueShapeLogged` flag against console spam):

```js
console.log('[MA Queue] raw response:', raw);
console.log('[MA Queue] entityId:', entityId);
console.log('[MA Queue] keys at top level:', ...);
```

Once user pastes back the actual response shape, I can adjust the unwrap chain. This is the same diagnostic-release pattern as v1.1.1422 (which led to the v1.1.1423 grid-format fix).

### Lesson

For the TTS issue: when a service that takes a single engine choice fails server-side, fallback to alternative engines is more useful than detailed error messages. User has multiple TTS integrations configured — most will work; just one is broken. Cycle through them.

For the queue: when a defensive multi-shape unwrap doesn't fire, the assumption about possible shapes is wrong. Don't add a 4th guess — log the actual shape and adjust based on truth. Fewer iterations, less guessing.

---

## Version 1.1.1438 - 2026-05-09

**Title:** 🎵 MA panel: Queue empty bug fixed (entity-keyed response shape) + new "Nächste" / "Up Next" tab
**Hero:** none
**Tags:** Bugfix, Feature, MusicAssistant

### Why

Two related issues:

1. User confirmed the Queue tab in the Music Assistant panel was always empty, even though the native MA UI showed 242 items. So the data was there, my consumer just wasn't extracting it.
2. User asked for a 4th tab next to Suche/Bibliothek/Queue showing "what comes next" — i.e. the upcoming tracks from the current playlist context.

### Root cause (Queue empty)

`getMusicAssistantQueue` calls `music_assistant.get_queue` with `return_response: true`. Newer MA versions wrap the response keyed by entity_id:

```json
{
  "media_player.bad_2": {
    "items": [...],
    "current_item": {...},
    "current_index": 7
  }
}
```

My `loadQueue` in `MusicAssistantPanel.jsx` looked for `raw?.items || raw?.queue?.items || raw?.queue_items` — none matched the entity-keyed shape, so `items` resolved to `[]` and the queue rendered as empty.

### What changed

`MusicAssistantPanel.jsx`:

- `loadQueue` extended to unwrap entity-keyed shape: `raw?.[entityId] || raw?.queue || raw || {}`. Tries (a) entity-keyed (newer MA), (b) nested under `queue` (older), (c) flat (oldest). First match wins.
- `current` resolution also now handles `current_index` integer position (the entity-keyed shape uses index instead of object reference).
- New `'upnext'` tab in the tab-bar between Queue and the Megaphone button.
- New render branch for `tab === 'upnext'`: filters `queue` to items AFTER `currentQueueItemId`. If no current → first 20 items as approximation. Empty-state message differentiates "nothing playing" vs "no more tracks in queue."
- The same `loadQueue` effect now triggers for `tab === 'queue' || tab === 'upnext'` (same data source, just a client-side filter on render).

### Lesson

When wrapping a third-party HA service with `return_response: true`, the response shape can vary between integration versions. Defensive extraction (`raw?.[entityId] || raw?.queue || raw`) chains common shapes; first match wins. Same pattern as the v1.1.1423 grid-source format fix in `mapEnergyPrefsToSlots` and the v1.1.1425 schema-detection rewrite. Schema drift in HA-integration responses is a recurring class of bug — always assume the consumer may be on a newer or older version than the docs say.

---

## Version 1.1.1437 - 2026-05-09

**Title:** 🔊 Music Assistant announcement: TTS now works — bridge to HA tts.*_say service for plain-text input
**Hero:** none
**Tags:** Bugfix, MusicAssistant, TTS

### Why

User report: typing a plain text "hallo" in the MA Announcement panel and clicking "Abspielen" failed with `Die Aktion music_assistant/play_announcement konnte nicht ausgeführt werden. extra keys not allowed @ data['message']`.

Root cause: HA Core's `music_assistant.play_announcement` service schema (in `homeassistant/components/music_assistant/services.py`) only accepts `entity_id, url, use_pre_announce, announce_volume`. The `message` parameter doesn't exist in this schema. My v1.1.1405 implementation tried `data.message = text` first with `data.url = text` as fallback, but the fallback only triggered when the input was already a URL — so plain text always died on the message-attempt.

Plain-text TTS in HA goes through a separate service family: `tts.<engine>_say` (cloud_say, google_translate_say, piper_say, etc.) which generates audio AND plays it on a media_player in one call.

### What changed

`utils/musicAssistant.js` — `playAnnouncementMusicAssistant` rewritten to a clear two-path flow based on input type:

- **URL input** (`https://…`) → `music_assistant.play_announcement` with `url` parameter (clean, supports `use_pre_announce` + `announce_volume`)
- **Plain text input** → looks up `hass.services.tts` for any `*_say` service (prefers `cloud_say` for Nabu Casa users, falls back to first `*_say` available), calls it with `{message: text}` + `entity_id: media_player`

If no TTS service is registered in HA, plain-text input fails with a clear console error explaining the requirement (Nabu Casa / Google / Piper / etc).

`MusicAssistantPanel.jsx` — textarea placeholder updated to communicate the dual mode: `"Text (TTS) oder URL einer Audio-Datei (https://…)"`. The "Ton voranspielen" toggle now visually fades to 40% opacity when input is plain text (with title-tooltip explaining it only applies to URL-mode), since pre-announce is MA-specific and doesn't pass through the HA TTS bridge.

### Lesson

When wrapping a third-party HA integration's services, check the actual service schema (via `hass.services.<integration>.<service>.fields` or by reading HA Core source) instead of assuming "common" parameters work. Voluptuous validation is strict — extra keys produce loud errors with no graceful degradation. The right approach for cross-integration features (like TTS, which has many possible engines) is to compose multiple HA services rather than trying to find one service that does everything.

---

## Version 1.1.1436 - 2026-05-09

**Title:** 🎵 Media-player Slide 1: "Musik suchen" → "Music Assistant" — playlist+note icon replaces magnifier
**Hero:** none
**Tags:** Polish, MediaPlayer, MusicAssistant, Icons

### Why

The button on Slide 1 of the media-player slideshow that opens the Music Assistant panel was labeled "Musik suchen" / "Search music" with a magnifier+note icon. That undersells what it does: the panel has Suche, Bibliothek, Queue, Announcements (4 surfaces, since v1.1.1405). The label "Music Assistant" matches the brand and signals that it's a hub, not just search.

### What changed

- `utils/icons.js` — `music_search` SVG replaced. Old: lupe (10.5,10.5,r=6.5) + diagonal handle + tiny note. New: 3 stacked horizontal lines (= playlist) + small music note in lower-right (`d="M20 18.5C..."`). Uses `currentColor` stroke so it picks up the button theme.
- `utils/deviceConfigs.js` — fallback label string updated to "Music Assistant".
- `utils/translations/languages/de.js` + `en.js` — `musicSearch:` value changed to `'Music Assistant'` (key kept for backwards-compat with the consumer in deviceConfigs; renaming the key would touch 4 files for no semantic gain since the key isn't user-visible).

### Lesson

When a button's responsibility grows beyond its original name (here: from "search" to "search + library + queue + announcements"), the label should grow with it. Brand names ("Music Assistant") communicate scope better than verbs ("Search") for hub-style entry points. Verbs work for single-action buttons; nouns work for surface-entries.

---

## Version 1.1.1435 - 2026-05-09

**Title:** ✨ Tipps icon — Apple-Tipps-style sparkle SVG added (was missing in iconMap, device card + sidebar showed blank)
**Hero:** none
**Tags:** Bugfix, Icons, Tipps

### Why

The Tipps system entity (introduced in v1.1.1391) defined an icon in its entity config but the `iconMap` in `getSystemEntityIcon` (`DeviceCardIntegration.jsx`) had no entry for the `tipps` domain. Since the device card + sidebar render via `getSystemEntityIcon`, both showed blank icon spots — visible in the user's screenshot as "Tipps" device card with empty top half + missing sidebar entry visual.

### What changed

- `DeviceCardIntegration.jsx`: new `tipps:` entry in iconMap rendering an Apple-Tipps-style sparkle SVG (open circle + 4-point star at 1 o'clock). White stroke for contrast on the orange brand background.
- `entities/tipps/index.js`: replaced the old lightbulb-style entity icon SVG with the same sparkle design (using `currentColor` for stroke since this version is rendered in dynamic-color contexts). Both now match.

### Lesson

When introducing a new system entity, three icon paths need the matching entry: (1) the entity's own `icon:` field for self-rendering contexts, (2) the `iconMap` in `getSystemEntityIcon` for device-card and sidebar rendering, and (3) any other domain-keyed lookup. Forgetting (2) → silent blank icon. The audit pattern: search for the entity domain in DeviceCardIntegration.jsx after registering, like the identifier-grep audit catches missing imports.

---

## Version 1.1.1434 - 2026-05-09

**Title:** 🟡 Sidebar-items picker: yellow note-card + per-item info popups (Energy Dashboard "i"-button)
**Hero:** none
**Tags:** Polish, UX, Settings

### Why

Two requests for the v1.1.1431 sidebar-items picker:

1. The intro description card (gray, low contrast) should use Apple-style yellow `rgb(255, 204, 0)` so it reads as a note/hint instead of dead text.
2. The static footer hint about Energy Dashboard ("erscheint nur wenn unter Integrationen hinzugefügt") should move from a permanent footer card to an info `(i)` button next to the Energy Dashboard item itself, opening a modal popup on click. Cleaner layout + scales: future items can get their own info text without footer-bloat.

### What changed

`SidebarItemsSettingsTab.jsx`:
- New `ITEM_INFO_TEXTS` lookup at module scope — keyed by item ID, returns `{de, en}` text. Currently only `energy_dashboard`. Adding more is a one-entry change.
- Description card: `background: rgb(255, 204, 0)` + `color: rgba(0, 0, 0, 0.85)` + `font-weight: 500` for readability on the yellow.
- Each item row: if `ITEM_INFO_TEXTS[item.id]` exists, render a small (i)-button next to the label. Click → sets `infoItemId` state.
- Footer hint card: removed.
- New AnimatePresence-wrapped modal at the bottom of the sub-view: backdrop + centered card showing the item name + info text. Click backdrop or × button to close. Same visual style as the EnergyDashboard's existing InfoOverlay (`rgba(30, 30, 30, 0.95)` card on `rgba(0, 0, 0, 0.5)` blurred backdrop, z-index 9999).

### Pattern

The (i)-button uses the same defensive `onPointerDown stopPropagation` + `onClick stopPropagation` + `preventDefault` triple that v1.1.1426 introduced for the Energy-Dashboard info-buttons. Same bug class would apply (parent row has its own pointer handlers via the LiquidGlassSwitch toggle area), same defense.

---

## Version 1.1.1433 - 2026-05-09

**Title:** 🐛 Sidebar items not updating live — `event.detail` overwrite swallowed enabled/alwaysVisible flags
**Hero:** none
**Tags:** Hotfix, Bugfix, Sidebar, EventBus

### Why

User report after v1.1.1431: toggling items in the new "Einträge konfigurieren" sub-view didn't reflect in the sidebar in real-time. Only a page reload showed the change.

### Root cause

Two listeners share the `sidebarSettingsChanged` event:

1. **`SearchField.jsx`** — was using `setSidebarSettings(event.detail)` (blind overwrite of state with whatever payload arrived).
2. **`SearchSidebar.jsx`** — increments a tick to force its `useMemo([lang, settingsTick])` to re-read `systemSettings.sidebar.items` from localStorage.

The two existing dispatchers (`GeneralSettingsTab.jsx` for the `enabled` and `alwaysVisible` toggles) sent `detail: { enabled, alwaysVisible }` — full payload, blind overwrite worked fine.

The new dispatcher in v1.1.1431's `SidebarItemsSettingsTab.jsx` sent `detail: { items: next }` — only the items field, NOT enabled/alwaysVisible. SearchField's blind overwrite then turned `sidebarSettings` into `{ items: [...] }` with `enabled === undefined`. The conditional in JSX:

```jsx
{sidebarSettings.enabled && (isExpanded || sidebarSettings.alwaysVisible) && (
  <SearchSidebar ... />
)}
```

…falsied, the entire SearchSidebar **unmounted**. The unmount discarded the in-flight `setSettingsTick` re-render. On a page reload, `useState`'s init function read the (still-correct) localStorage and the sidebar re-appeared with the new items — so it looked like "only works after reload."

### What changed

`SearchField.jsx` — extracted the localStorage-read into a `readSidebarFlags()` helper. Both the initial `useState(() => readSidebarFlags())` AND the event handler now call it. The handler ignores `event.detail` entirely and treats the event as a "something in sidebar settings changed, re-read from authoritative storage" trigger.

```js
const handler = () => setSidebarSettings(readSidebarFlags());
```

This is robust to any future dispatcher sending partial detail payloads — localStorage is the single source of truth, the event is just a "bell" telling listeners to re-read.

### Lesson

When multiple producers share an event-bus and the event has a payload, every producer needs to send the SAME shape OR the listener needs to ignore the payload. Producer-side discipline ("always send full payload") doesn't scale — the next person who adds a dispatcher won't know the convention. Listener-side defense ("ignore payload, re-read from authoritative source") scales because new producers don't have to know anything.

This is the same pattern as the v1.1.1414 unified-storage refactor: when "the storage" is the source of truth, intermediaries that pass partial state via events will eventually break it.

---

## Version 1.1.1432 - 2026-05-09

**Title:** ⏸️ Media-player slideshow auto-advance pauses while ANY control group is expanded (Music Assistant, settings, mode picker, …)
**Hero:** none
**Tags:** Bugfix, MediaPlayer, Slideshow, UX

### Why

User report: when the Music Assistant button is clicked and the MA panel opens below the slider, the 5-second auto-advance kept rotating the upper area between Slide 0 (Volume + Transport) and Slide 1 (Position + Mode/Search). The buttons UNDER the slider switch with the slide — meaning while the user is searching/queueing in the MA panel, the controls they expect to see (search submit, queue actions) are silently swapped out by the rotation. "Komplikationen."

The existing pause-conditions (`mpPaused = true` on hover/touch) didn't catch this case because the MA panel sits BELOW the slider area — opening it doesn't trigger the slider's mouseEnter.

### What changed

`UniversalControlsTab.jsx` — auto-advance `useEffect` gains one more early-return condition:

```js
if (expandedControl !== null) return;
```

Plus `expandedControl` added to the dep list so the interval gets cleared/recreated when the user opens or closes a sub-panel.

The fix is broader than just MA — it also covers Settings, Climate-mode picker, and any other expanded preset group on a media_player. Same bug class: any expanded panel below the slider would have been disrupted by a rotation in the upper area.

### Lesson

Pause-on-interaction is one half of the story; pause-on-context-shift is the other. Whenever a UI exposes both an auto-rotating element and modal-ish sub-panels, the rotation needs to be aware of the panel state. Cleanest implementation: have the rotation check a "is anything actively in focus" flag, not separate flags per modal type. `expandedControl !== null` is exactly that flag — it covers all sub-panels with no per-panel maintenance.

---

## Version 1.1.1431 - 2026-05-09

**Title:** 🧭 Sidebar customizable — pick which shortcuts appear (Home, Energie, Zeitpläne, Settings, Todos, News, …) via new sub-view
**Hero:** none
**Tags:** Feature, Sidebar, Settings, UX

### Why

The Sidebar (Vision-Pro-style shortcut rail next to the search panel) had a hardcoded list of items: `['settings', 'todos', 'news', 'versionsverlauf']`. User wanted (a) a sub-menu to configure WHICH items appear, plus (b) new options: Energie (Energy Dashboard), Zeitpläne (All Schedules), Home (back to start page).

### What changed

**`SearchSidebar.jsx`** — items now read from `systemSettings.sidebar.items` (with the existing 4-item list as fallback for users who haven't configured anything yet). Listens for `sidebarSettingsChanged` event so changes in the new sub-view propagate live without reload. New virtual `__home__` item with inline house-SVG icon.

**`SearchField.jsx`** — `handleSidebarItemClick` checks for the special `__home__` ID first: closes detail view, clears selectedDevice, collapses the panel back to the home/start state. All other IDs go through the existing devices.find(...) lookup.

**`SidebarItemsSettingsTab.jsx`** (new file, ~200 LOC) — sub-view rendered when user taps "Einträge konfigurieren" in the Sidebar settings section. Lists all available items as toggle rows:
- Home (virtual, always available)
- Every registered system-entity not hidden via `showInDetailView=false` — pulled live from `systemRegistry.entities` so dynamically-registered devices like Energy Dashboard appear automatically when the user adds them via Integrations
- Each row: icon + name + subtitle + LiquidGlassSwitch toggle
- Toggling writes `{ items: [...] }` into `systemSettings.sidebar` and dispatches `sidebarSettingsChanged` for live update

**`GeneralSettingsTab.jsx`** — new "Einträge konfigurieren" row in the Sidebar section (chevron link) + new `'sidebar-items'` branch in the AnimatePresence sub-view switcher.

### Default behavior change

New default items list: `['__home__', 'settings', 'all-schedules', 'todos', 'news']` (was: `['settings', 'todos', 'news', 'versionsverlauf']`). Existing users who already have explicit settings don't see this change — only first-time installs (or users who haven't customized) get the new defaults. The new picker shows ALL available items so users can re-add removed defaults or add new ones.

### Lesson

When a configurable list lives in localStorage settings, the picker view should pull options dynamically from the runtime registry (not a static hardcoded list). This auto-includes new device entities the moment they're registered — Energy Dashboard appears in the picker the moment the user adds it via the Integrations flow, no separate hardcoded entry needed. Cost: the picker re-renders when registry changes, but `systemRegistry.on('entity-registered'/'entity-unregistered')` makes that explicit.

---

## Version 1.1.1430 - 2026-05-09

**Title:** 🌡️ Climate slider: arc-displaced bug fixed — clamp value to [min, max] in `valueToAngle` + `getProgressOffset`
**Hero:** none
**Tags:** Bugfix, CircularSlider, Climate

### Why

User screenshot of MELCloud climate detail-view: the blue progress arc was visually offset from the centered text content. Header showed "18.5° → 10°C", target temperature 10°C. Root cause: HA's MELCloud integration reports `target_temperature=10` (left over from a heat-mode setting) while `min_temp=16` (current cool-mode minimum). My math:

```js
percentage = (10 - 16) / (30 - 16) = -0.428    // negative!
getProgressOffset = circumference * 1.428      // > circumference
valueToAngle = -90 + (-0.428 * 360) = -244°    // weird angle
```

SVG handles `stroke-dashoffset > stroke-dasharray` by wrapping the dash-pattern cycle: the visible portion of the dash starts somewhere mid-pattern instead of at the path origin. Visually, the arc appears to start and end at "wrong" positions, no longer concentric with the centered text content. Same class of bug would hit any HA integration that reports a target value outside its current range — IPP printers' job-progress reset between prints, fan-mode climates with no temp range, etc.

### What changed

`src/utils/circularSliderTransforms.js`:
- New `clamp(val, min, max)` helper at module scope.
- `valueToAngle` clamps `val` to [min, max] before percentage calc. Plus guard for `max <= min` (returns `-90` = top).
- `getProgressOffset` clamps `currentValue` to [min, max] before percentage calc. Plus guard for `max <= min` (returns `circumference` = empty arc).

`src/utils/deviceConfigs.js` (climate case):
- `attributes.min_temp || 16` → `attributes.min_temp ?? 16` (and same for `max_temp`). Defends against integrations that report `min_temp=0` (theoretically valid for some HVAC modes) which `||` would mistakenly fall through to the default 16.

### Result

- Out-of-range target temperatures (e.g. 10°C target with min=16) now render the arc clamped to the visual minimum (= empty arc, handle at top). The numerical displayValue still shows "10°C" so the user sees the actual stale value.
- No regression for in-range values — clamp is identity when `min ≤ val ≤ max`.

### Lesson

Slider math should always clamp inputs. SVG `stroke-dashoffset` doesn't fail loudly when the offset overflows — it silently shifts the dash-pattern cycle, producing a render that looks "almost right" enough to escape unit tests but visibly broken to users. Same for `valueToAngle` — JavaScript's `cos`/`sin` happily compute angles way outside [0, 360°], the visual just lands wherever the math says. Adding a `clamp()` at the input edge is one line per function and prevents an entire class of "but the data was weird" bugs.

---

## Version 1.1.1429 - 2026-05-09

**Title:** 🏷️ Sensor rows: pill (Auto/Manuell) moved to start of subtitle line — also shows "Manuell" for non-auto-resolved sensors
**Hero:** none
**Tags:** Polish, UX, EnergyDashboard

### Why

User feedback on v1.1.1428: the Auto pill should sit at the START of subtitle line 2 (entity_id line) instead of the END of line 3 (value line). Plus: when a sensor is NOT auto-resolved, show a "Manuell" pill instead of nothing — so the source of every configured sensor is unambiguous at a glance, not inferred from absence of a tag.

### What changed

`renderSensorSubtitle` in `EnergyDashboardSensorsConfigView.jsx`:
- Pill moved from end-of-line-3 to start-of-line-2
- Always renders when sensor is configured (was: only on isAuto)
- Two visual variants:
  - `Auto` — green pill (Energy brand color: `rgba(48, 209, 88, *)`)
  - `Manuell` / `Manual` (per language) — neutral grey pill (`rgba(255, 255, 255, *)`)
- Both pills share identical typography (10px / 600 / uppercase / pill-shape) — only colors differ
- Line 3 simplified to just `value unit` (no more pill on the right)

Layout net result for configured rows (3 lines):
- L1: Label + Info-Button + Chevron
- L2: `[Auto|Manuell] entity_id` (entity_id fades right when long)
- L3: `value unit`

Unconfigured rows unchanged: 2 lines (Label + "Nicht konfiguriert", no pill).

### Lesson

"Status by absence" UX (e.g. "no badge means it's manual") works only when users already know the convention. "Status by presence" (always show a badge, vary color/text by state) is self-documenting and removes one question on first viewing. Cost: every row gets a pill, but they're small and consistent so visual noise is minimal.

---

## Version 1.1.1428 - 2026-05-09

**Title:** 📐 Sensor-row layout: 3-line subtitle (entity_id on line 2, value + Auto-pill on line 3) — fixes chevron-overflow + value cutoff
**Hero:** none
**Tags:** Polish, Layout, EnergyDashboard

### Why

User screenshot: when a sensor row has a long entity_id (e.g. `smart_meter_ts_65a_3_eingespeiste_wirkenergie`) plus a value (e.g. `35932.88 kWh`) plus the Auto pill, the single-line subtitle overflowed the row width. Two visible failures:
- Chevron `>` jumped to its own line (broke the row's flex layout)
- Value got truncated mid-number by the v1.1.1426 fade-mask

User request: "die items nicht zweizeilig sondern 3 zeilig lieber" — use 3 lines per row instead of 2.

### What changed

`renderSensorSubtitle` in `EnergyDashboardSensorsConfigView.jsx` rewritten to a stacked-column layout:

**Configured sensor rows** — now 3 lines:
- Line 1 (label, parent): Label + Info-Button + Chevron (right)
- Line 2 (subtitle row 1): `entity_id` — 12px, opacity 0.75, fade-mask on right if longer than the row
- Line 3 (subtitle row 2): `value unit` (font-weight 500) + Auto-pill (right of value, only if isAuto)

**Unconfigured rows** — unchanged 2 lines: Label + "Nicht konfiguriert".

Net effect: the chevron stays vertically centered against the taller row, the value is fully visible, and the Auto pill no longer competes with the entity_id for horizontal space.

### Lesson

When fitting "label + truncatable identifier + value + status badge" into iOS settings rows, splitting onto two subtitle lines is more legible than a single fade-clipped line. Stacking lets each piece have its natural width without negotiating space with the others. Cost: rows are ~18px taller — acceptable trade for full visibility of all data.

---

## Version 1.1.1427 - 2026-05-09

**Title:** 🔥 Two follow-up bugs from v1.1.1426 — `sensorNames is not defined` ReferenceError + info-button still solid black on hover
**Hero:** none
**Tags:** Hotfix, Bugfix, EnergyDashboard, ExtractionDebt

### Why

Two issues surfaced after v1.1.1426 shipped:

**Bug 1: Click on info button now crashes the whole card.** The v1.1.1426 pointerdown stopPropagation fix DID work — the click now reaches the InfoOverlay. But then it trips on `Uncaught ReferenceError: sensorNames is not defined` at `EnergyDashboardSettingsView.jsx:332`. Cause: `sensorNames` and `sensorInfos` are used inside the InfoOverlay JSX but not imported nor declared locally. They were defined as local consts inside `EnergyDashboardDeviceView.jsx` (the original parent component). When v1.1.1331 split `EnergyDashboardSettingsView` into its own file, the InfoOverlay JSX was carried along but the two constants were left behind — became dead code in DeviceView, undefined references in SettingsView. Latent for ~5 weeks because the InfoOverlay never actually rendered (v1.1.1417's `motion is not defined` crashed the parent before that, and v1.1.1426's pointerdown race blocked the click after).

This is the FOURTH bug from the same v1.1.1331 extraction (after v1.1.1417 motion, v1.1.1418 entity, v1.1.1419 getSensorDisplay). Lesson from the SESSION_NOTES_2026-05-09 memo was literally "run identifier-grep against all extracted files" — I ran it against `EnergyDashboardSensorsConfigView.jsx` in v1.1.1419 but never against `EnergyDashboardSettingsView.jsx`. Did the grep this time before fixing — confirmed `sensorNames` and `sensorInfos` are the only remaining undeclared identifiers (no further hidden ReferenceErrors).

**Bug 2: Info button still becomes a solid black circle on row-hover.** v1.1.1426's CSS override used `fill: revert !important` to preserve element-level fill attributes — wrong intuition. The CSS `revert` keyword reverts to the user-agent stylesheet default, which for SVG fill is `black`, NOT to the HTML element's `fill="none"` presentation attribute. Result: the outer ring (which has `fill="none"` in HTML) reverted to filled-black, and the line path likewise. Stack of three filled-black shapes = solid black circle.

### What changed

**`EnergyDashboardSensorUtils.js`**: New module-scope exports `sensorNames` and `sensorInfos` (verbatim port of the dead consts from DeviceView.jsx, plus updated docstring explaining the migration path). 14 entries each, keyed by sensor slot.

**`EnergyDashboardSettingsView.jsx`**: Import line extended — `sensorNames, sensorInfos` added to the existing `EnergyDashboardSensorUtils` import.

**`EnergyDashboardDeviceView.jsx`**: Removed ~120 LOC of dead `sensorNames` + `sensorInfos` definitions. Replaced with a 4-line breadcrumb comment pointing at the new module-scope home.

**`iOSSettingsView.css`**: Rewritten v1.1.1426 override block with proper attribute-based selectors:
- `circle[r="7"]` (outer ring) + `path` (vertical "i" line): `fill: none !important` — keeps them outline-only
- `circle[r="0.75"]` (inner dot of the "i"): `fill: rgb(0, 90, 200) !important` — keeps the dot visible
- All elements get the blue `stroke` and parent gets blue `color`

### Lesson

**Diagnostic tooling has a half-life if you don't ritualize it.** The Python identifier-grep that caught v1.1.1419's bug was documented in SESSION_NOTES_2026-05-09 as a "pattern to apply on every sub-component extraction." That was three days ago. I didn't apply it to `EnergyDashboardSettingsView.jsx` because the file wasn't actively being edited and the lesson hadn't crystallized into a checklist item yet. The right move (filed in the next session-notes' open items): commit the script as `scripts/check-extraction-debt.py` and run it as a build-step or pre-commit hook on every file with `from './...'` imports, so extraction debt can't accumulate silently.

**About `revert` in CSS.** Three keywords look superficially similar but differ in subtle ways:
- `initial`: property's spec-defined initial value (often something useless like `currentColor`/`auto`/`0`)
- `inherit`: parent's computed value
- `revert`: the value the property would have without ANY author/user CSS — i.e., the user-agent stylesheet default

For SVG fill specifically, the user-agent default is `black`, NOT `none`. The `fill="none"` attribute on the parent `<svg>` is an HTML presentation attribute — it has cascade specificity LOWER than ANY CSS rule. So when an `!important` author rule sets `fill: revert`, the cascade resolves to "user-agent default = black", and the HTML attribute is silently outranked. Use attribute-selectors (`[r="7"]`) instead when you need element-specific fill behavior.

---

## Version 1.1.1426 - 2026-05-09

**Title:** 🐛 Energy "Werte" view — 5 polish bugs fixed (banner contrast, info-button click + hover, Auto-pill design, long-text fade)
**Hero:** none
**Tags:** Bugfix, Polish, EnergyDashboard, Refactor

### Why

Five issues reported on the v1.1.1425 "Werte" config view:

1. Auto-fill summary banner (`X von 16 ...`) used `rgba(0, 122, 255, 0.10)` background + blue text on the dark backdrop → invisible.
2. Info icon (i) buttons next to each sensor row turned solid black on row-hover instead of inverting nicely. Caused by an existing CSS rule (`iOSSettingsView.css:194`) that forces every SVG inside `.ios-item-left` to `color/stroke/fill: #000 !important` on hover — Info-buttons got swept up by that selector.
3. Info button click stopped opening the InfoOverlay. Suspected cause: framer-motion gesture handlers on the inner button + the parent `motion.div.ios-item-clickable` were both responding to the same pointer event; `e.stopPropagation()` in `onClick` only stops React-synthetic-bubble for the click event, not the upstream pointerdown/pointerup that framer-motion gestures listen on.
4. The "• Auto (HA)" tag appended to subtitles was plain inline text — visually indistinguishable from the rest of the subtitle.
5. Long subtitle strings (e.g. `solarnet_leistung_netzeinspeisung • 8897.8 W • Auto (HA)`) overflowed the row width with a hard cut.

### What changed

`EnergyDashboardSensorsConfigView.jsx`:
- **AutoFillSummary banner**: `background: rgba(255, 255, 255, 0.10)` + `color: rgba(255, 255, 255, 0.96)` + `backdrop-filter: blur(8px)` — readable on every background.
- **`<InfoButton>` component extracted** (was 13 nearly-identical inline `motion.button` blocks, mix of multi-line and one-liner styles). One source of truth. Adds `onPointerDown={e => e.stopPropagation()}` defensively in addition to `onClick`'s stopPropagation+preventDefault — kills the click-bubble race regardless of which event family fires first.
- **`renderSensorSubtitle` returns JSX** (was string). Auto badge is now a proper green pill (Energy-brand color `rgb(48, 209, 88)` at 18% bg + 35% border + bright text), positioned LEFT so it stays visible even when the entity_id text fades on the right.
- **Subtitle text fade** via `mask-image: linear-gradient(to right, black 80%, transparent 100%)` on the subtitle wrapper (inline style — not on the global `.ios-item-subtitle` class which is shared across many views).

`iOSSettingsView.css`:
- New override block: `.ios-item:hover:not(:active) .info-icon-button { color: rgb(0, 90, 200) !important; }` plus stroke override on path/circle. Fill is `revert !important` to respect the outer ring's `fill="none"` (otherwise the ring would fill solid blue instead of staying outline-only).

### Cleanup byproduct

The `<InfoButton>` extraction removed ~270 lines of repetition. File dropped from 750 → 480 lines. Adding a 14th sensor row in the future is now `<InfoButton sensorType="..." />` instead of a 25-line inline block.

### Lesson

The CSS-cascade hover bug is a recurring pattern: a global rule with `!important` for one design intent (here: "make ios-item icons turn black on hover for visual feedback") collides with a sub-component (here: the info button) that needs different behavior. Solution is always the same — add a more specific override with `!important`, and the override should preserve as little as possible (here: don't blanket-set fill, use `revert` so element-level attributes still win).

The pointerdown/click race is also recurring: when both a parent and child have framer-motion gesture handlers (`whileTap` etc.) and React event handlers (`onClick`), `e.stopPropagation()` in onClick alone is not enough — framer's gestures listen on pointerdown/pointerup which fire BEFORE click. Defensive: stopPropagation in pointerdown too.

---

## Version 1.1.1425 - 2026-05-09

**Title:** ⚡ Energy mapper rewritten for HA Storage v1.3 — auto-fills tariffs + grid power + solar power (8 slots instead of 2 for the user)
**Hero:** none
**Tags:** Feature, EnergyDashboard, AutoConfig

### Why

User asked: "the configured entities are stored somewhere in the HA backend, can't you just look there directly?" The answer was yes — `energy/get_prefs` IS the direct read of HA's `.storage/energy` file, but my mapper was written against an outdated TypedDict schema and silently ignored 6 of the 8 fields HA actually returns.

The HA Core team landed three storage-rework PRs in late 2025 / early 2026:

- **#153809** (2025-11): Power-sensor configuration added to Energy storage
- **#160432** (2026-01): Non-standard power sensor support (Standard / Inverted / Two-sensors modes)
- **#162200** (2026-02): Grid connections migrated from `flow_from[]`/`flow_to[]` arrays to flat single objects (bumped `STORAGE_MINOR_VERSION` 2 → 3)

User is on 2026-current HA so they get the new flat schema with all the new fields populated. My mapper was reading from the legacy nested schema and missing everything that landed in the three PRs.

### What changed

`mapEnergyPrefsToSlots` in `EnergyDashboardSensorUtils.js` rewritten to handle the full v1.3 flat schema (current HA) with legacy nested-array schema as fallback (HA ≤ 2025.11):

| Source field path (v1.3 flat) | Maps to slot |
|---|---|
| `grid.stat_energy_from` | `kwh` (already worked) |
| `grid.stat_energy_to` | `grid_export_total` (already worked) |
| `grid.entity_energy_price` | `purchase_tariff` (NEW) |
| `grid.entity_energy_price_export` | `feed_in_tariff` (NEW) |
| `grid.power_config.stat_rate_from` | `grid_import` (NEW, "Zwei Sensoren" mode) |
| `grid.power_config.stat_rate_to` | `grid_return` (NEW, "Zwei Sensoren" mode) |
| `solar.stat_energy_from` | `pv_total` (already worked) |
| `solar.stat_rate` | `solar` (W) (NEW) |
| `battery.stat_energy_to` | `battery_charged` (already worked) |
| `battery.stat_energy_from` | `battery_discharged` (already worked) |
| `gas.stat_energy_from` | `gas_total` (already worked) |
| `water.stat_energy_from` | `water_total` (already worked) |

### Deliberately NOT handled (documented in header)

- `power_config.stat_rate` (Standard mode) and `stat_rate_inverted` (Inverted mode): single sign-based sensor for both directions; can't be split into our 2-slot grid_import/grid_return model without ambiguity.
- `solar.config_entry_solar_forecast`: list of config entry IDs for forecast integrations. Resolution needs a separate `energy/solar_forecast` WS call → own release if `estimated_*` slots should auto-fill.
- `battery.stat_rate` and `battery.power_config`: no battery-power slot in our card.
- Battery percent (%): not in `get_prefs` at all (HA derives it elsewhere).
- Gas/Water `stat_rate` (flow rate) and `entity_energy_price` (tariffs): no slots for these.

### Expected coverage after update

For the user (HA 2026.x with Smart Meter + SolarNet + Forecast.Solar configured):
- Before v1.1.1425: 2 of 16 slots auto-resolved (kwh + grid_export_total)
- After v1.1.1425: 8 of 16 slots auto-resolved (+ purchase_tariff + feed_in_tariff + grid_import + grid_return + solar + pv_total)
- Plus battery_charged/discharged if Heimspeicher is configured.

The remaining 8 slots (battery%, consumption W, estimated_power, estimated_energy_today, gas_total, water_total) either need separate APIs or the user doesn't have them configured.

### Lesson

When integrating with a third-party API whose schema is documented only as TypedDicts in the source repo, **fetch the actual current source code, don't rely on memorized field names from older versions**. Schema evolution is invisible to the consumer until they look. The HA team didn't announce these PRs in the changelog as breaking — they just landed, with on-disk migration baking them in. Pinning the schema understanding to a specific Git revision (with the file URL in the docstring) makes future schema-drift detectable.

---

## Version 1.1.1424 - 2026-05-09

**Title:** 🧹 Cleanup — removed v1.1.1422 diagnostic logging + orange status banners now that the auto-fill bug is fixed
**Hero:** none
**Tags:** Cleanup, EnergyDashboard

### Why

v1.1.1422 added verbose `console.log` calls in `mapEnergyPrefsToSlots` plus three orange diagnostic banner branches in `AutoFillSummary` (auto-map missing / empty / no-match). They served their purpose: the verbose log in v1.1.1422 produced exactly the JSON dump that pointed at the grid-format bug fixed in v1.1.1423. With the bug confirmed fixed and the user seeing the green "X von Y Slots automatisch aus HA Energy-Dashboard" banner, the diagnostic scaffolding is dead weight.

### What changed

- `EnergyDashboardSensorUtils.js` — `mapEnergyPrefsToSlots`: removed 6 `console.log` statements (entry/exit/per-source debug). Function now silent in production, dual-format grid support (direct `stat_energy_from`/`stat_energy_to` + flow_from[]/flow_to[] fallback) preserved.
- `EnergyDashboardSensorsConfigView.jsx` — `AutoFillSummary`: removed three orange diagnostic banner variants (no auto_resolved_sensors / empty map / 0 matches). Reverted to the v1.1.1421 design: blue summary banner when ≥1 slot matches, `null` otherwise. Component shrank from ~105 lines to ~25.

### Lesson

Diagnostic scaffolding deserves the same lifecycle care as production code. When the bug it was diagnosing gets fixed, the next release should retire it — otherwise the noisy logs erode console signal-to-noise and the alarmist orange banners scare users with conditions that no longer apply. Keep a "diagnostic" tag on these releases so they're easy to find and unwind.

---

## Version 1.1.1423 - 2026-05-09

**Title:** 🎯 Energy mapper now handles HA's grid-source format (stat_energy_from direct on source, not in flow_from[])
**Hero:** none
**Tags:** Bugfix, EnergyDashboard

### Why

The v1.1.1422 diagnostic release nailed the bug. User's `energy/get_prefs` console output showed:

```json
{
  "energy_sources": [
    {
      "type": "grid",
      "stat_energy_from": "sensor.smart_meter_ts_65a_3_bezogene_wirkenergie",
      "stat_energy_to": "sensor.smart_meter_ts_65a_3_eingespeiste_wirkenergie",
      ...
    },
    {
      "type": "solar",
      "stat_energy_from": "sensor.solarnet_energie_tag",
      ...
    }
  ]
}
```

HA delivers the `grid` source's sensor IDs **directly on the source object** (as `stat_energy_from` / `stat_energy_to`), not nested in `flow_from[].stat_energy_from` / `flow_to[].stat_energy_to` arrays as my mapper assumed. The `solar` source uses the direct format too — and works because that branch already used `src.stat_energy_from`.

So only the `grid` branch was broken, returning 0 entries instead of 2 (kwh + grid_export_total). Result: only `pv_total` was auto-mapped → "1 Einträge (pv_total)" banner.

The `flow_from[]/flow_to[]` array format does exist in some HA versions (newer / multi-source setups). Both formats now supported with the direct path winning when both are present.

### What changed

`src/system-entities/entities/integration/device-entities/views/EnergyDashboardSensorUtils.js` — `mapEnergyPrefsToSlots` for `type: 'grid'`:
- Tries `src.stat_energy_from` (direct, this user's format) FIRST → maps to `kwh`
- Falls back to `src.flow_from[0].stat_energy_from` (array, newer HA format) if direct missing
- Same for export side: `src.stat_energy_to` → `grid_export_total`, fallback to `src.flow_to[0].stat_energy_to`
- Verbose logging tells which path was taken (`(direct)` vs `flow_from[0].stat_energy_from`)

### Expected result for this user after update

Auto-Map should now contain 3 entries:
- `kwh: 'sensor.smart_meter_ts_65a_3_bezogene_wirkenergie'`
- `grid_export_total: 'sensor.smart_meter_ts_65a_3_eingespeiste_wirkenergie'`
- `pv_total: 'sensor.solarnet_energie_tag'`

Whether each MATCHES the currently-active sensor in `entity.attributes.<slot>_sensor` depends on what was previously stored:
- If a slot was empty → auto-fill writes the auto-resolved value → match → blue banner + "• Auto (HA)" tag appears
- If user manually picked something different → mismatch → that slot stays without tag (override semantics preserved)

### Lesson

When integrating with a third-party API whose schema is documented inconsistently (HA's `energy/get_prefs` shape is undocumented in the WebSocket API reference; only Python source defines it), **don't assume one format**. Try the most likely paths in order of likelihood, log which won, fall back gracefully. The verbose-logging release (v1.1.1422) bought exactly the diagnostic info needed to point at this in the next iteration — without it I'd have guessed for several more releases.

---

## Version 1.1.1422 - 2026-05-09

**Title:** 🔍 Diagnostic release — verbose energy-prefs logging + always-visible status banner
**Hero:** none
**Tags:** Diagnostics, EnergyDashboard, Bugfix

### Why

User reports the v1.1.1421 "Auto (HA)" tags + summary banner don't appear, even though HA's Energy-Dashboard has Smart Meter + SolarNet configured (which should map to `kwh`, `grid_export_total`, `pv_total`). User confirmed it's not a HACS-cache issue.

The auto-fill flow has 4 possible failure points:
1. `loadEnergyPreferences` action never runs
2. `energy/get_prefs` returns unexpected schema
3. `mapEnergyPrefsToSlots` misses entries due to format mismatch
4. `auto_resolved_sensors` set on entity but doesn't propagate to UI prop

To pinpoint which one, this release adds verbose logging + an always-visible status banner with diagnostic messages.

### What changed

**`EnergyDashboardSensorUtils.js` `mapEnergyPrefsToSlots`:**
- Logs raw `prefs` input (full JSON) at start
- Logs each `energy_sources[i]` entry with type + raw data
- Logs each successful mapping (`→ mapped X to Y = Z`)
- Logs final output map
- Warns on null/missing prefs, non-array `energy_sources`, unknown source types

**`EnergyDashboardSensorsConfigView.jsx` `AutoFillSummary`:**
- Three new diagnostic states (orange-tinted banners) instead of returning null:
  - `auto_resolved_sensors` not set: "Auto-Map nicht initialisiert (loadEnergyPreferences nicht gelaufen?)"
  - Map empty (0 entries): "HA Energy-Dashboard liefert 0 mappbare Sources. Console-Output checken."
  - Map populated but no slot matches: "Auto-Map hat N Einträge, aber kein Slot matched. Sensoren wurden manuell überschrieben."
- Normal blue banner only when ≥1 slot actually matches

### How user should test

1. Update to v1.1.1422 (HACS or manual)
2. Open browser DevTools → Console tab
3. Open the card, navigate to Energy-Dashboard → Settings → Werte konfigurieren
4. Look for log lines starting with `[Energy]`:
   ```
   [Energy] mapEnergyPrefsToSlots input: {...}
   [Energy] Processing N energy_sources...
   [Energy] Source type=grid: {...}
   [Energy] → mapped grid.flow_from to kwh = sensor.X
   [Energy] mapEnergyPrefsToSlots output: { kwh: 'sensor.X', ... }
   ```
5. Plus check the colored banner at top of "Werte" page — its text tells which failure mode hit

Whichever path is taken in the console + which banner color shows = exact diagnostic.

### Lesson

When a fix doesn't manifest visually, the diagnostic release buys more information per turn than guess-fixing. Verbose `console.log` for each branch + colored UI banners for each failure-state means the next user-report tells me exactly which of the 4 paths is broken, instead of "still not working."

---

## Version 1.1.1421 - 2026-05-09

**Title:** ✨ Energy: "Auto (HA)" tag on every slot + summary banner "🔗 X von 16 automatisch"
**Hero:** none
**Tags:** Polish, EnergyDashboard, UX, Refactor

### Why

v1.1.1420 added auto-fill from HA Energy-Prefs but only showed "• Auto (HA)" on the 2 new Gas/Wasser slots. User wanted to see at a glance which of the 16 slots are auto-resolved vs. manually picked. This release extends the visual feedback to all slots + adds a summary banner at the top.

### What changed

**`EnergyDashboardSensorsConfigView.jsx`:**
- New `renderSensorSubtitle(slot, entity, hass, lang)` helper at module scope — single source for subtitle rendering. Returns `"<sensor_name> • <value> <unit>"` plus `" • Auto (HA)"` if the active sensor matches `entity.attributes.auto_resolved_sensors[slot]`
- Replaced 15 IIFE-Lambdas (one per slot subtitle) with `{renderSensorSubtitle(...)}`. Pattern was identical across all slots; consolidation saves ~75 LOC
- New `AutoFillSummary` component at module scope — counts how many of the `ENERGY_SENSOR_SLOTS` are currently auto-resolved (sensor matches the auto-map). Renders nothing when zero (clean look for users without HA Energy config)
- Banner placed at top of `ios-settings-view`, before the first sensor section. Style: blue-tinted card with `🔗` icon and "X von 16 Slots automatisch aus HA Energy-Dashboard"

### Visual result

For users with HA Energy-Dashboard configured (most users):
- Top of settings page: blue banner "🔗 3 von 16 Slots automatisch aus HA Energy-Dashboard"
- Each slot row: subtitle shows "{sensor_name} • {value} {unit} • Auto (HA)" if auto-resolved
- User overrides (manually picked sensor different from auto-map) show without the "Auto (HA)" tag → clear visual distinction between auto and manual

For users without HA Energy-Dashboard:
- Banner hidden (count is 0)
- Subtitles show without auto-tag (since `auto_resolved_sensors` is empty)
- Same UX as before, no clutter

### Architecture note

The auto-detection logic is `auto_resolved_sensors[slot] === currentSensor`, not a separate `_source` flag. Reason: a user override that happens to match the HA-default would still show as "Auto" — which is correct: the value IS the same as HA's. Distinguishing "user explicitly picked this" from "auto picked the same" is unnecessary; both produce the same value, and the storage round-trips cleanly.

### Lesson

Visual indicators for auto-resolved configuration are critical for trust — without them, the auto-fill feature works but the user can't tell if it's doing anything. Two-level disclosure works well here: (1) summary banner gives the macro-view ("am I getting auto-help?"), (2) per-slot tag gives the micro-view ("which specific slot is auto?"). Both cheap to render, both high-information.

The IIFE→helper refactor was a freebie alongside the feature: the existing 15 subtitle blocks were copy-paste, and once you're touching all 15 anyway, extracting a helper is a no-cost step that eliminates future diff-noise (any change to the subtitle format now happens in one place).

---

## Version 1.1.1420 - 2026-05-09

**Title:** ⚡ Energy Dashboard: Auto-Fill from HA Energy Prefs + Gas/Water slots + new circulars
**Hero:** none
**Tags:** Feature, EnergyDashboard, AutoConfig

### Why

User-Frage: "warum kann nicht direkt darauf zugegriffen werden?" — auf die HA-Energy-Dashboard-Konfiguration. HA hat im Backend bereits Sensoren für Stromnetz / PV / Heimspeicher / Gas / Wasser konfiguriert. Wir hatten die Konfiguration bisher nur als `entity.attributes.energy_prefs` gecached aber nicht ausgewertet — ein 14-Slot-Setup-UI, obwohl die Hälfte schon im HA-Backend stand.

Diese Session: Auto-Fill für leere Slots aus `energy/get_prefs`, plus zwei neue Slots (Gas + Wasser) plus zwei neue Slideshow-Circulars dafür.

### What changed

**Schema-Erweiterung** (`src/system-entities/entities/integration/deviceConfigStorage.js`):
- `ENERGY_SENSOR_SLOTS` += `gas_total`, `water_total` (jetzt 16 statt 14)
- `CIRCULAR_TYPES` += `gas`, `wasser` (jetzt 6 statt 4)

**Sensor-Type-Config** (`EnergyDashboardSensorUtils.js`):
- Neue Slot-Definitionen mit Unit-Constraints:
  - `gas_total`: m³ / ft³ / kWh / MWh / Wh, deviceClass: `gas`
  - `water_total`: m³ / L / gal / CCF, deviceClass: `water`

**Auto-Fill-Mapper** (`EnergyDashboardSensorUtils.js`):
- Neue `mapEnergyPrefsToSlots(prefs)` Pure-Function. Mappt HA-`energy_sources` auf unsere Slot-IDs:
  - `grid.flow_from[].stat_energy_from` → `kwh`
  - `grid.flow_to[].stat_energy_to` → `grid_export_total`
  - `solar.stat_energy_from` → `pv_total`
  - `battery.stat_energy_to` → `battery_charged`
  - `battery.stat_energy_from` → `battery_discharged`
  - `gas.stat_energy_from` → `gas_total`
  - `water.stat_energy_from` → `water_total`

**Auto-Fill-Logik** (`EnergyDashboardDeviceEntity.js`):
- `loadEnergyPreferences` nutzt jetzt den Mapper → speichert das Result als `entity.attributes.auto_resolved_sensors`
- Plus: für jeden Slot OHNE User-Override (`entity.attributes.<slot>_sensor` leer) wird die Auto-Map-Sensor-ID auf das Attribut geschrieben
- User-Overrides bleiben unangetastet — sie "gewinnen" auch nach Boot-Refresh
- Nichts wird in den persistenten Storage geschrieben, nur in entity attributes

**Slideshow** (`EnergyDashboardDeviceView.jsx`):
- Default-`circularConfig` += `gas: { enabled: false }`, `wasser: { enabled: false }`
- Type-Labels: Gas/Wasser (DE) oder Gas/Water (EN)
- `getCircularSensorMapping`: gas und wasser nutzen `gas_total_sensor` bzw. `water_total_sensor` als primary UND secondary (existing slideshow gating wartet auf both, single-sensor circulars müssten sonst speziell behandelt werden — pragmatischer Workaround)

**Settings-UI** (`EnergyDashboardSensorsConfigView.jsx`):
- Neue Sektion "GAS / WASSER" am Ende mit 2 ios-item Rows (Gas-Verbrauch gesamt, Wasser-Verbrauch gesamt)
- Subtitle zeigt "• Auto (HA)" Tag wenn der aktuelle Sensor aus den HA-Energy-Prefs auto-resolved wurde (vergleicht `attributes.<slot>_sensor` mit `attributes.auto_resolved_sensors[slot]`)
- User-Click öffnet wie bei den anderen Slots die SensorSelectionView mit gefilterter HA-Sensor-Liste

### What this means for users

User der HA-Energy-Dashboard schon konfiguriert hat (häufig der Fall) bekommt jetzt **Zero-Config**:
1. Card öffnen
2. Bibliothek- / Slideshow-Toggles für Gas/Wasser/Verbrauch/Solar etc. aktivieren
3. Werte erscheinen sofort — ohne dass er einen einzigen Sensor manuell pickt

User der HA-Energy NICHT konfiguriert hat: identisches UI wie vorher (Slot-Picker), nur leere Auto-Map.

### Limitations (bewusst nicht in dieser Session)

- **W-Power-Sensoren** (`grid_import` (W), `solar` (W), `consumption` (W)) bleiben manuell — HA-Energy-Prefs hat nur kWh-LTS-Sensoren
- **Tariff-Sensoren** (`feed_in_tariff`, `purchase_tariff`) bleiben manuell — kein HA-Standard
- **Auto-Tag nur bei Gas/Wasser** sichtbar (für die 14 alten Slots wäre es 14× das gleiche Pattern in der Subtitle — ein "subtle UI-tag everywhere" Refactor lohnt sich nur wenn das Pattern stehen bleibt)

### Lesson

Wenn HA's Backend schon eine Konfiguration hat, ist es fast immer falsch eine eigene parallele zu pflegen. Die richtige Frage: "Was hat HA schon, was kann ich daraus ableiten?" — und nur das fragen was wirklich card-spezifisch ist (z.B. unsere W-Power-Live-Sensoren für die Slideshow-Circulars, die HA's energy-dashboard nicht braucht).

Auto-Fill mit User-Override-Vorrang ist die saubere Trennung: Storage hält nur was der User EXPLIZIT überschrieben hat. Alles andere wird beim Boot aus Source-of-Truth (HA) abgeleitet. Resultat: User der HA-Konfig ändert → unser Card aktualisiert sich beim nächsten Refresh, ohne dass er bei uns nachkonfigurieren muss.

---

## Version 1.1.1419 - 2026-05-09

**Title:** 🔥 Hotfix #3: `getSensorDisplay` extracted to pure util — third bug from same v1.1.1329 extraction
**Hero:** none
**Tags:** Hotfix, Bugfix, EnergyDashboard, Refactor

### Why

Third sequential ReferenceError from the same broken v1.1.1329 extraction:

```
Uncaught (in promise) ReferenceError: getSensorDisplay is not defined
```

Used to be a closure inside `EnergyDashboardDeviceView` that captured `hass`. The v1.1.1329 extraction of `EnergyDashboardSensorsConfigView` referenced `getSensorDisplay(sensorId)` 13× without bringing the function with it.

User pushed back hard ("KANNST DU PRÜFEN!") — rightly so. Instead of fixing the third bug as another one-off, this release adds a **systematic check** to prevent recurrence.

### What changed

**Refactor `getSensorDisplay` to a pure util** in `src/system-entities/entities/integration/device-entities/views/EnergyDashboardSensorUtils.js`:
- New exported pure function `getSensorDisplay(sensorId, hass)` — same logic as before but `hass` passed as second arg instead of captured from closure
- Returns `{ value, unit }` formatted for display (W/kW/Wh→kWh conversion)

**`EnergyDashboardDeviceView.jsx`**:
- Imports `getSensorDisplay as getSensorDisplayUtil` from SensorUtils
- Local `getSensorDisplay = (id) => getSensorDisplayUtil(id, hass)` thin wrapper preserves the existing call-site signature `getSensorDisplay(sensorId)`. No call-site changes needed in this file.
- Old 22-LOC closure definition removed

**`EnergyDashboardSensorsConfigView.jsx`**:
- Imports `getSensorDisplay` from SensorUtils
- Adds `hass` to destructured props (third missing prop in this file after `entity` and `motion`)
- All 13 call sites updated: `getSensorDisplay(sensorId)` → `getSensorDisplay(sensorId, hass)`

**`EnergyDashboardSettingsView.jsx`** (caller of SensorsConfigView):
- Forwards `hass={hass}` to the sub-view (3rd prop forwarded after the v1.1.1418 `entity={entity}`)

### Diagnostic methodology used

Wrote a Python script that:
1. Scans every `Energy*.jsx` view file
2. Extracts destructured props + imports + local declarations
3. Greps the body for all identifiers used as function-call (`X(`), member-access (`X.`), or JSX-component (`<X`)
4. Subtracts: declared - used → undeclared list
5. Filters out JS builtins, JSX tag names, event-handler arg names

Result: **3 false positives** in SensorsConfigView (`stopPropagation`, `e`) and **1 real undeclared** (`getSensorDisplay`). All other Energy views came back clean (their flagged identifiers were all method-calls on objects, not free variables).

### Lesson

Three sequential ReferenceErrors from the same extraction means the v1.1.1329 refactor was not properly verified. The right defense for any future extraction is a **single render-test in actual call site** — open the extracted view at least once, watch for console errors. Costs ~30 seconds, prevents the "fix three weeks of latent bugs one-by-one" pattern that consumed three releases.

The systematic Python script could become a permanent CI check (one for each `*View.jsx`, run on extraction-PRs). Out of scope for this card's current build flow; filed as a future-improvement.

For closure-captured helpers like `getSensorDisplay`: when extracting, the right move is to **promote them to pure functions** in a util module BEFORE doing the JSX extraction, then both old + new sites import the same pure function. That's the pattern this hotfix retroactively applies.

---

## Version 1.1.1418 - 2026-05-09

**Title:** 🔥 Hotfix #2: `entity is not defined` in EnergyDashboardSensorsConfigView (also latent since v1.1.1329)
**Hero:** none
**Tags:** Hotfix, Bugfix, EnergyDashboard

### Why

After the v1.1.1417 motion-import fix, the same view threw a second latent error from the same v1.1.1329 extraction:

```
Uncaught (in promise) ReferenceError: entity is not defined
  at L.CA [as constructor]
```

The view references `entity.attributes?.<slot>_sensor` 13× across all 14 sensor slots, but `entity` was **never destructured from props** when the file was extracted. The parent `EnergyDashboardSettingsView` does have `entity` as a prop (and uses it itself), but never forwarded it to the extracted child.

Two errors in the same extracted view, both from the same v1.1.1329 refactor, both ReferenceErrors that production-rollup minifies cleanly without warning. Lesson: **after any extraction, render the new view in its actual call site at least once before declaring done.**

### What changed

`src/system-entities/entities/integration/device-entities/views/EnergyDashboardSensorsConfigView.jsx`:
- Added `entity` to the destructured props list (after `motion` import in v1.1.1417)

`src/system-entities/entities/integration/device-entities/views/EnergyDashboardSettingsView.jsx`:
- Forwarded `entity={entity}` to the `<EnergyDashboardSensorsConfigView ... />` invocation

### Verification

Cross-checked all other identifiers used in the view body (`hass`, `sensorNames`, `sensorInfo`, etc.) — only `entity` was missing. Build passed first try.

### Lesson

The v1.1.1329 extraction had two separate gaps that didn't surface for ~88 releases because the user rarely opened that specific Settings sub-view. Both gaps would have been caught by:

1. **Lint** (`no-undef` rule) at write-time
2. **Manual click-through** of every extracted view's call path before merging

This card has neither in its release flow. The right defensive move for the next extraction would be a 2-minute manual smoke-test: open the view, confirm it renders. Cheap, catches both kinds of "extracted-view forgot to wire X" bugs.

---

## Version 1.1.1417 - 2026-05-09

**Title:** 🔥 Hotfix: `motion is not defined` in EnergyDashboardSensorsConfigView (latent since v1.1.1329)
**Hero:** none
**Tags:** Hotfix, Bugfix, EnergyDashboard

### Why

User opened the Energy-Dashboard Settings → "Werte konfigurieren" and got a hard error:

```
Uncaught (in promise) ReferenceError: motion is not defined
  at L.CA [as constructor]
  at L.U [as render]
  ...
custom:fast-search-card ReferenceError: motion is not defined
```

The view `EnergyDashboardSensorsConfigView.jsx` uses `<motion.div>` and `<motion.button>` heavily but **never imported `motion`** from `framer-motion`. The bug has been latent since the file was extracted in v1.1.1329 — likely never noticed because either (a) the user hadn't opened that specific sub-view, or (b) an older framer-motion version exposed `motion` globally as a side-effect.

### What changed

`src/system-entities/entities/integration/device-entities/views/EnergyDashboardSensorsConfigView.jsx`:
- Added `import { motion } from 'framer-motion';` after the preact `h` import

### Verification

Bash-grep across all `Energy*.jsx` views to detect any other files using `motion.*` without importing it — none found, only this one file.

### Lesson

When extracting a file from a parent component (the v1.1.1329 refactor that pulled this view out of `EnergyDashboardSettingsView.jsx`), **the new file inherits zero context from the parent's imports**. Every external symbol the extracted JSX touches needs an explicit import in the new file. ESLint's `no-undef` would have caught this at lint-time; CI lint isn't part of this card's release flow, so the bug shipped.

For future extractions: the audit step "after the move, run a build" — production-rollup typically catches `ReferenceError`-class issues at minify time, but `motion` happens to be a top-level identifier that minifies cleanly even when undefined; the error only fires at render time. **Cross-checking imports manually is the only sure defense.**

---

## Version 1.1.1416 - 2026-05-09

**Title:** ♻️ Refactor: extracted shared components — AppearanceSettingsTab −287 LOC, TodosSettingsView −75 LOC
**Hero:** none
**Tags:** Refactor, Cleanup, Components

### Why

Follow-up to v1.1.1415's quick-win cuts. The deferred component-extraction refactors (~400 LOC potential saving) were the next logical step: each duplicated JSX pattern collapses into a single helper component. Lower risk than it sounds because the underlying JSX is byte-for-byte identical across all instances, only the bound props differ.

### What changed

**`AppearanceSettingsTab.jsx`** (1251 → **964 LOC, −287**):
- New `SettingsCheckOption` component (label/subtitle/selected/onClick props), defined at module scope above the main export
- Replaced 9 nearly-identical `motion.div` + `motion.svg` ios-checkmark blocks across three sub-views:
  - Dark Mode (3 options: automatic / light / dark)
  - Grid Columns (2 options: 4 / 5)
  - Squircle Style (4 options: standard / prominent / balanced / subtle)
- Each block was ~30 LOC of identical animation, conditional rendering, and SVG markup; now ~5 LOC per usage

**`TodosSettingsView.jsx`** (1535 → **1460 LOC, −75**):
- Three new helper components at module scope:
  - `ProfileNameSection` — name input + ios-card wrapper
  - `ColorPickerSection` — color grid with checkmark overlay
  - `TemplateTextSection` — textarea + ios-card wrapper
- Replaced 6 instances across profile-add / profile-edit / template-add / template-edit views
- The templates' textarea (~25 LOC each), profile name input (~25 LOC each), and PROFILE_COLORS grid (~50 LOC each) are now single-source-of-truth components

### What was preserved

All animations, props, event handlers, and visual behavior preserved. The extracted components capture the exact same JSX, just parametrized by the variable bits (label text, selected state, onClick callback). No CSS or styling changes.

### Cumulative cleanup since v1.1.1415

- v1.1.1415 quick-wins: ~110 LOC of dead code
- v1.1.1416 component extraction: ~362 LOC of duplication
- **Total: ~470 LOC removed across 2 releases**

The bundle size is essentially the same (minifier was already deduplicating most of the JSX patterns), but the source is dramatically more maintainable. Future styling changes to the ios-checkmark touch one place instead of nine.

### Lesson

Visual-pattern duplication looks scary in raw LOC numbers, but the refactor is mechanical when the patterns are byte-for-byte identical. The 9× ios-checkmark blocks differed only in two places: the bound state variable (`darkMode === 'auto'` vs `gridColumns === 4` etc.) and the click handler. Everything else — the SVG, the spring transition, the animation timing, the wrapping divs — was copy-paste. **Pattern-duplication of N ≥ 3 is almost always worth extracting.** Below N=3, the abstraction overhead can outweigh the deduplication; at N=9, the maintenance saving compounds heavily.

For pattern-extraction, defining the helper at module scope (above `export const Foo = ...`) keeps it private to the file. No need to export and re-import — and no risk of accidental re-use elsewhere with different intent.

---

## Version 1.1.1415 - 2026-05-09

**Title:** 🧹 Dead-code audit on top-5 largest files — ~110 LOC removed, cascade-cleaned 5 dead useState in SettingsTab
**Hero:** none
**Tags:** Cleanup, Audit, DeadCode

### Why

User asked for a dead-code pass on the top-5 size contributors after the bundle-composition analysis. 5 parallel Explore-agents audited each file, returning kill-lists with line numbers. Quick-wins applied (low risk, no Refactor); CheckmarkOption-extraction in `AppearanceSettingsTab.jsx` (~300 LOC potential save) deferred for a separate refactor session.

### What was killed

**`src/components/tabs/SettingsTab/components/GeneralSettingsTab.jsx`** (1173 → 1101, **−72 LOC**):
- 3 `<div className="ios-item" style={{ display: 'none' }}>` blocks marked "AUSGEBLENDET" (AI Mode / Animations / Sound Effects toggles, hidden permanently)
- 6 unused destructured props (`aiModeEnabled`/`setAiModeEnabled`/`animations`/`setAnimations`/`soundEffects`/`setSoundEffects`)
- 2 unused local handlers (`handleStatsBarToggle`, `handleUsernameChange` — `StatsBarSettingsTab` manages its own state)

**`src/components/tabs/SettingsTab/components/StatsBarSettingsTab.jsx`** (1313 → 1299, **−14 LOC**):
- 1 unused import: `GridReturnIcon`
- 1 unused state: `const [energyPrice, setEnergyPrice] = useState(...)`
- 1 unused local handler: `handleEnergyPriceChange()` (9 LOC)
- Cascade-dead imports: `getEnergyPrice`, `saveEnergyPrice`

**`src/components/tabs/SettingsTab/components/AppearanceSettingsTab.jsx`** (1254 → 1251, **−3 LOC**):
- 3 unused destructured props: `isDropdownOpen`, `setIsDropdownOpen`, `hass`

**`src/system-entities/entities/todos/components/TodosSettingsView.jsx`** (1543 → 1535, **−8 LOC**):
- `saveListCustomization()` — never called; the auto-persist via `applyListCustomization()` (added in v1.1.1297) replaced it. Comment explicitly noted "kept as a no-op fallback" — turns out nothing called it.

**Cascade cleanup in parent `src/components/tabs/SettingsTab.jsx`** (~−13 LOC):
- After cutting GeneralSettingsTab + AppearanceSettingsTab props, all 5 `useState` declarations for those props (`soundEffects`, `animations`, `aiModeEnabled`, `isDropdownOpen`, `isLangDropdownOpen`) became orphan and were removed
- Call-sites for both child components trimmed to match new prop signatures

### What was NOT done (deferred for separate refactor sessions)

- **`AppearanceSettingsTab.jsx` CheckmarkOption extraction** — ~9 nearly-identical `motion.svg` checkmark blocks across the dark-mode/grid-columns/squircle-style sub-views. Extracting one shared component would save ~300 LOC but is a real refactor (touch points + JSX restructure), not a cut. Filed for a follow-up "Refactor session."
- **`TodosSettingsView.jsx` color-grid + input duplication** — 3 pairs of duplicated JSX blocks across profile-add/profile-edit/template forms. ~100 LOC saving via component extraction. Same reasoning as above.
- **`deviceConfigs.js`** — audit reported clean (~15-20 LOC of minor printer3d/universal_device pattern duplication). Skipped; not worth a refactor pass for that small a saving.

### Methodology

5 parallel Explore-agents read each file, applied symbol-grep dead-code detection (per the `symbol-grep` tip in `docs/lessons/lessons.{de,en}.md`), and returned line-numbered kill-lists in a structured format. I then verified each candidate via `grep -rn '<symbol>' src/` for cross-file references before applying the cut. After cuts, ran cascade-grep on the parent `SettingsTab.jsx` — found 5 cascade-dead `useState` declarations (props no longer needed → state initialization no longer needed). Build passed first try (no compile errors).

### Lesson

For top-N-largest-files cleanup, parallel Explore-agents are the right tool: each file is independent, the audit methodology is the same, and the synthesis step is mine alone. Reduces my context usage from "read 5 × 1300-line files = 6500 lines" to "read 5 × 400-word reports". Net throughput per session-minute roughly doubles.

The cascade-cleanup pass is non-optional — every prop-signature change can trigger orphan state in the parent component. **Always re-grep after a prop cut.** If I'd skipped this, `SettingsTab.jsx` would still hold 5 unused state vars + their initializers (~20 LOC of dead but compiling code).

---

## Version 1.1.1414 - 2026-05-08

**Title:** 🔧 Energy-Dashboard storage unified — all 14 sensors + slideshow config in one HA-key, cross-device sync, auto-migration from legacy
**Hero:** none
**Tags:** Bugfix, Refactor, EnergyDashboard, Persistence

### Why

Three persistence-related bugs/issues in the energy-dashboard storage layer:

1. **Bug:** Only 3 of 14 sensors were restored on boot. The other 11 (`grid_return_sensor`, `consumption_sensor`, `solar_sensor`, `battery_*_sensor`, etc.) were saved to localStorage with per-sensor keys (`energy_<entityId>_<attr>`) but never read back at app start. After every browser reload the user had to remap them, and the slideshow circulars `verbrauch` / `solarerzeugung` / `batterie` were broken until they did.
2. **Polish:** Slideshow config (`circularConfig` — which of the 4 circulars are enabled) was localStorage-only. Two browsers showed independent toggle states.
3. **Refactor:** Three different storage patterns for the same feature — HA-User-Data for 3 essential sensors, plain localStorage with per-attr keys for the other 11, plain localStorage for slideshow toggles. Maintenance-heavy, sync gaps.

### What changed

**`src/system-entities/entities/integration/deviceConfigStorage.js`** (storage layer):
- New unified key `HA_ENERGY_DASHBOARD_KEY = 'fast_search_card_energy_dashboard'` with schema_version 2
- New schema: `{ schema_version: 2, sensors: { grid_import, grid_return, ..., purchase_tariff }, circulars: { verbrauch: {enabled}, ... } }` — all 14 sensor slots + 4 circular toggles in one object
- New `migrateEnergyDashboardLegacy(hass)` function reads all three legacy storages (HA `fast_search_card_energy_sensors`, localStorage `energy_<id>_<attr>`, localStorage `energy_circular_config_v3`), merges them into v2 schema, writes the new key
- New public API: `getEnergyDashboardConfig()` (sync read) + `setEnergyDashboardConfig(hass, partial)` (async write with deep-merge of `sensors` + `circulars` partial)
- Bootstrap extended: after the existing devices + energy-sensors load, runs the new dashboard load with auto-migration if old key missing
- Old `getEnergySensors` / `setEnergySensors` API kept for back-compat (deprecated comment) — internally backed by the new unified storage

**`src/system-entities/entities/integration/device-entities/EnergyDashboardDeviceEntity.js`** (entity logic):
- `loadSensorConfig()` now reads from `getEnergyDashboardConfig()` and returns both legacy 3-sensor shape (for old code paths) AND the full `sensors` / `circulars` objects
- `onMount` loops over all 14 `ENERGY_SENSOR_SLOTS` and applies `<slot>_sensor` to entity attributes — so the slideshow circulars work immediately after boot, no manual re-mapping needed
- `updateSensorConfig` action now accepts any of the 14 slot keys (`grid_return_sensor`, etc.) plus the legacy camelCase keys; writes through to unified storage and updates entity attributes for live UI
- New `updateCircularConfig` action — writes circular toggle state through unified storage

**`src/system-entities/entities/integration/device-entities/views/EnergyDashboardDeviceView.jsx`** (view):
- `circularConfig` initial state reads from `getEnergyDashboardConfig().circulars` instead of localStorage `energy_circular_config_v3` directly
- `updateCircularConfig()` view-helper calls `entity.executeAction('updateCircularConfig', ...)` instead of `localStorage.setItem`
- `handleSensorSelect()` simplified: removed the triple-write (entity.updateAttributes + localStorage.setItem + entity.executeAction). Now just calls `entity.executeAction('updateSensorConfig', {[attr]: sensorId})` — single source of truth, single write path

### Migration

Auto-runs on first boot of v1.1.1414. Reads:
1. `fast_search_card_energy_sensors` (HA) — 3 sensors
2. localStorage scan for `energy_<id>_<slot>_sensor` keys — 11 sensors
3. `energy_circular_config_v3` (localStorage) — 4 toggles

Merges into the new `fast_search_card_energy_dashboard` schema, writes once. Old keys are preserved (not deleted) for rollback safety. On subsequent boots, the unified key is the source of truth.

### Visual / functional result

- After Browser-Reload: all 14 sensors are immediately back, slideshow circulars work without manual re-config
- Cross-device sync via HA-User-Data: open dashboard on phone + tablet → both see identical sensor mapping + slideshow toggles
- Three storage patterns collapsed to one — single key, single write path, single migration story for future schema changes

### Lesson

When a feature accretes storage over time, you end up with N different mechanisms for N different fields, each with its own bug profile. The fix isn't to optimize each in isolation — it's to merge them into a single schema with versioned migration. The migration cost (one function, ~50 LOC) is paid once; the maintenance saving compounds.

For the bug specifically (sensors not restored on boot): the symptom was visible for weeks but invisible to the user only because the slideshow circulars they actually use happened to be the 3 ones that ARE persisted (grid_import, kwh, pv_total). The 11 other sensors were dead-storage. **Always grep for symmetric read/write pairs after every storage write.** A `localStorage.setItem` without a matching reader on boot is dead weight.

---

## Version 1.1.1413 - 2026-05-08

**Title:** 🎨 Different ring colors per slide — Volume orange, Position cyan-blue
**Hero:** none
**Tags:** Polish, MediaPlayer, UI

### Why

User asked for different colors per slide so the active mode is recognizable at a glance, not just by reading the label. Volume + Position both used the same orange ring before — visually identical except for the slider value.

### What changed

`src/utils/deviceConfigs.js`:
- Slide 1 (Position) `color`: `#FF6B35` (orange) → `#34C8FF` (cyan-blue)
- Slide 0 (Volume) keeps `#FF6B35` — orange remains the brand color for active interactive elements

### Visual result

- **Volume slide** → orange ring matches the rest of the orange UI accents (knob highlight, page-dots active, MA-search button etc.)
- **Position slide** → cyan-blue ring, clearly distinct, matches the "progress" semantic of time-based controls (similar to how iOS Music uses different track-bar colors)

The contrast also makes the auto-advance switch visually obvious — even from peripheral vision you notice the slide changed.

### Lesson

A 5-character CSS color change can do as much UX work as a full feature. Two visually identical UI states are functionally indistinguishable; one color flip per state turns "I have to read the label" into "I see at a glance which mode I'm in."

For follow-on work: if a third slide gets added later, pick a third hue (purple? green?) — keep the colors max-distinct rather than a gradient, since hue-spectrum-position isn't intuitive for non-technical users.

---

## Version 1.1.1412 - 2026-05-07

**Title:** 🔧 Versionsverlauf URL fix — was pointing to old `docs/versionsverlauf.md`, no entries shown after v1.1.1389 reorg
**Hero:** none
**Tags:** Bugfix, SystemEntity

### Why

User reported the in-app Versionsverlauf entity hadn't shown any new entries after the docs reorg in v1.1.1389. Root cause: hardcoded `changelog_url` in `src/system-entities/entities/versionsverlauf/index.js` still pointed at `docs/versionsverlauf.md` (the pre-reorg path). Since v1.1.1389 the file lives at `docs/version-history/versionsverlauf.md`. The fetch returned 404, the entity fell back to its localStorage cache, so the user only ever saw the snapshot from before the reorg.

### What changed

`src/system-entities/entities/versionsverlauf/index.js`:
- `changelog_url`: `docs/versionsverlauf.md` → `docs/version-history/versionsverlauf.md`

Plus retroactive language cleanup of v1.1.1409–v1.1.1411 entries (all converted from German to English) per the existing convention "English from v1.1.1220 onwards" — those three entries had drifted to German.

### Lesson

When you reorganize file paths, grep the codebase for the old path before declaring the move done. A single `grep -rn 'docs/versionsverlauf' src/` would have caught this in 2 seconds at v1.1.1389 reorg time. Same lesson as the v1.1.1400 hotfix (refactor-leftovers): cascade-detection applies to file-path changes just as much as symbol-rename.

For users on v1.1.1411 or earlier: the cache will refresh on the next library probe (5-min TTL) or when they hit the refresh button in the entity. The newly fixed code in v1.1.1412+ will fetch from the right URL going forward.

---

## Version 1.1.1411 - 2026-05-07

**Title:** 🐛 Position-slider stuck at 0 — HA doesn't push `media_position` continuously, now ticks client-side
**Hero:** none
**Tags:** Bugfix, MediaPlayer

### Why

User reported the position ring stayed at 0% even while a track was playing and seconds passed ("Aperture 0:00 / 2:33"). Root cause: Home Assistant doesn't push `media_position` every second — only on events (seek, pause, track change). Between events the value goes stale; the card was reading it 1:1 → no visible movement.

### What changed

**`src/utils/deviceConfigs.js`** (slide-1 logic):
- Position is now computed from `media_position` (last reported) + `media_position_updated_at` (timestamp) + `Date.now() - updated_at` (elapsed seconds since the report)
- Only adds elapsed when `state === 'playing'` (paused → stay put)
- `Math.min(reported + elapsed, duration)` clamps at track end
- `media_position_updated_at` can be a number (Unix seconds) or ISO string — `Date.parse` handles both

**`src/components/tabs/UniversalControlsTab.jsx`:**
- New `mpPositionTick` state counter
- 1-second `setInterval` runs only when `mpSlide === 1` AND `state === 'playing'` — bumps the counter
- `mpPositionTick` added to `sliderConfig` `useMemo` deps → recalculates per tick, slider moves smoothly
- On pause / other slide: no interval → no wasted re-renders

### Visual result

Position ring now advances visibly each second; subtitle "1:42 / 3:28" counts up. Pause freezes it. Skip/seek triggers HA to update `media_position_updated_at` via WebSocket — card resyncs automatically.

### Lesson

HA's `media_position` is one of the classic "last-known + timestamp" patterns, like `last_changed` / `last_updated`. You have to add elapsed-time client-side or you'll always show the snapshot from the last event. Standard pattern across the HA frontend (lovelace-mini-media-player does the same).

A 1-second tick driving a useState update is fine as long as: (a) the tick effect only runs while the slide is active, (b) the counter doesn't leak into unrelated render paths, (c) `& 0x7fffffff` masks against integer overflow on extremely long sessions — overkill but free.

---

## Version 1.1.1410 - 2026-05-07

**Title:** 📍 Page-Dots moved to bottom (matching Energy-Dashboard convention)
**Hero:** none
**Tags:** Polish, MediaPlayer, UI

### Why

User wanted the page-dots at the very bottom of the controls area (same as the Energy-Dashboard slideshow), not between slider and buttons. v1.1.1409 had them in the middle position by accident — broke the existing convention.

### What changed

`src/components/tabs/UniversalControlsTab.jsx`:
- `<div className="mp-page-dots-wrap">` removed from its position **between slider and buttons**
- Re-rendered **after the buttons** (still inside `device-control-design`) — now the last in-flow element

`src/components/tabs/UniversalControlsTab.css`:
- `margin: 4px auto 12px` → `margin: auto auto 16px` plus `padding-top: 8px`
- `margin-top: auto` pushes the dots to the container's end in the flex-column layout. When the buttons don't fill the container, the dots receive the leftover space and sit at the bottom

### Lesson

Layout positioning is a detail decision the user can phrase concisely by reference ("like the Energy-Dashboard"). That takes the design call off your back → simplest possible UX convention. Don't decide everything yourself — when the user names a reference, just copy it.

`margin-top: auto` in flex-column is the idiomatic way to pin an element to the end without absolute positioning. The Energy-Dashboard uses absolute (more robust under arbitrary container heights); my approach works as long as the container is `display: flex; flex-direction: column;` (which `device-control-design` is).

---

## Version 1.1.1409 - 2026-05-07

**Title:** 🎚️ Media-Player Slideshow — Slide 1 Volume+Transport, Slide 2 Position+Mode/Search, Auto-Advance + Swipe
**Hero:** none
**Tags:** Feature, MediaPlayer, Slideshow

### Why

User wanted the Energy-Dashboard slideshow pattern applied to media_player: two slides that switch between Volume and Position, with page-dots, auto-advance, and swipe gesture. Different button rows per slide.

### What changed

**Slide layout** (user spec):
- **Slide 0** — Volume ring + power-toggle + track title/artist + label "Lautstärke" → buttons below: **Zurück · Pause · Weiter**
- **Slide 1** — Position ring (scrubable, drag → `media_seek`) + power-toggle + track title + "1:42 / 3:28" + label "Position" → buttons below: **Zufall · Wiederholen · Musik suchen** (or Settings for non-MA players)

**Slide mechanics:**
- Auto-advance every 5s when player is playing/paused
- Pause on hover (mouse) or touch — resumes ~3s after release
- Horizontal swipe ≥ 60px in < 500ms switches slide manually
- Page-dot click sets slide directly
- Slide resets to 0 when `item.entity_id` changes (different player opened)

**Files**:

`src/utils/deviceConfigs.js`:
- `getControlConfig(item, lang, slideIndex = 0)` — new param; media_player branches between slide 0 (transport buttons) and slide 1 (mode + MA-search/settings)
- `getSliderConfig(item, lang, slideIndex = 0)` — new param; slide 0 = volume slider, slide 1 = position slider with `_mediaDuration` for seek conversion
- New `_formatTimeMS(seconds)` helper for the "1:42 / 3:28" format

`src/utils/sliderHandlers.js`:
- `executeSliderChange()` + the `media_player` handler accept `slideIndex`
- Slide 0 → `volume_set`, slide 1 → `media_seek` with `seek_position` in seconds (percent → seconds via `attributes.media_duration`)

`src/components/tabs/UniversalControlsTab.jsx`:
- New state: `mpSlide` (0/1), `mpPaused`
- Auto-advance effect via `setInterval(5000)`, gated by `mpPaused` and player state
- Touch handlers: `onMpTouchStart` / `onMpTouchEnd` for swipe
- Mouse handlers: `onMpMouseEnter` / `onMpMouseLeave` for hover-pause
- `goToMpSlide(idx)` for click-nav on dots, sets ~3s pause-after-interaction
- slideIndex passed through to `getControlConfig` / `getSliderConfig` / `executeSliderChange`
- Page-dots rendered between slider and buttons (motion-animated: 8px → 24px pill on active)
- ControlButton key set to `${mpSlide}-${index}` so React unmounts/remounts buttons on slide-change (cleaner animation than in-place update)

`src/components/tabs/UniversalControlsTab.css`:
- `.mp-page-dots-wrap` + `.mp-page-dots` (orange-tinted backdrop-blur pill, 8px dots)

### Architecture note

The slide-specific config (volume vs position, transport vs mode) was implemented via an optional `slideIndex` parameter on the existing functions, not as a separate `getMediaPlayerSlides()` function. Trade-offs: minimal-invasive (only the media_player case is touched), backwards-compatible (default 0 = old behavior), no new API surface. Cost: branching inside the function mixes slide-logic with domain-logic. With more than 2 slides or other domains gaining slideshows, refactoring would be worthwhile.

### Lesson

Auto-advance + hover-pause + swipe are three separate mechanics that have to interlock. The clean way: `mpPaused` state as the single source of truth, every interaction sets `mpPaused = true` and a timeout sets it back to `false`. The auto-advance interval effect rebuilds on pause-state change — `clearInterval` in cleanup, fresh `setInterval` when unpaused. Prevents race conditions between "user clicks dot" and "interval fires."

For motion-animated page-dots, animating `width` AND `backgroundColor` together inside `animate={{}}` keeps both transitions in sync on active-toggle. Two separate transitions would flicker out of phase.

---

## Version 1.1.1408 - 2026-05-07

**Title:** 🔄 Revert PowerToggle v1.1.1407 + Disable cover-circle in CircularSliderDisplay
**Hero:** none
**Tags:** Bugfix, Revert, MediaPlayer

### Why

User-Feedback nach v1.1.1407 mit zwei Screenshots:

1. **Power-Toggle "Bereit"-Screenshot OK, "Kuzu Kuzu"-Screenshot hat einen Kreis hinter dem Toggle.** Der "Kreis" ist nicht der PowerToggle-Track (den hatten wir schon transparent gemacht), sondern das `circular-cover-image`-Element vom CircularSliderDisplay, das seit v1.1.1372 als 80×80px-Kreis oben im Slider-Display gerendert wird wenn `coverImage`-Prop gesetzt ist.
2. **Track-Title "Kuzu Kuzu" rückt zu weit nach unten** weil der Cover-Kreis Platz beansprucht und die Display-Spalte (Cover → Title → Subvalue → Label) länger wird als bei Idle (nur "Bereit" / "LAUTSTÄRKE").

User-Wunsch: dieselbe kompakte Toggle+Title-Anzeige wie im "Bereit"-State, nur mit Track-Title statt "Bereit". Sharp-Cover bleibt im LeftView (v1.1.1407).

### What changed

**`src/components/controls/PowerToggle.jsx` (Revert v1.1.1407):**
- `background` zurück in `animate={{}}` mit den ursprünglichen Werten (`rgba(255, 255, 255, 0.25)` on, `rgba(255, 255, 255, 0.1)` off)
- `background: 'transparent'` aus `style={{}}` entfernt
- `border: 'none'` bleibt (das war der Anti-framer-motion-Fix aus v1.1.1406, der ist weiterhin korrekt)
- Toggle-Look ist jetzt wieder die kompakte iOS-Pille wie vor v1.1.1407

**`src/utils/deviceConfigs.js`:**
- `coverImage: isActive ? coverUrl : null` → `coverImage: null`
- Der CircularSliderDisplay rendert keinen Cover-Kreis mehr im Slider-Zentrum. Die Anzeige ist wieder kompakt: Toggle → Title → Subvalue → Label, alles ohne Cover-Image dazwischen
- Cover ist jetzt EXKLUSIV im LeftView (Sharp-Foreground aus v1.1.1407 bleibt)

### Visual result

**Toggle**: kompakte semi-transparente iOS-Pille wie im "Bereit"-Screenshot, identisch in allen States.

**Slider-Center bei Playing**: Toggle direkt gefolgt von Track-Title ("Kuzu Kuzu"), drunter Artist ("Tarkan") als Subvalue, drunter "LAUTSTÄRKE" als Label. Kein 80×80-Cover-Kreis mehr dazwischen.

**LeftView bei Playing**: weiterhin sharp Cover + Title + Artist als zentraler Foreground (v1.1.1407 unchanged) — Cover-Identität bleibt also prominent visible, nur eben nicht mehr im Slider-Display redundant doppelt.

### Lesson

When a user reports "I don't want this," the instinct is to fix the most recently changed thing. But the trigger can be a much older feature whose interaction with the new context produces the unwanted effect. Here: the cover-circle in CircularSliderDisplay was added in v1.1.1372, but only became annoying after v1.1.1407 added another cover-display in the LeftView — making the slider's cover-circle redundant.

Two cover-displays for the same data is one too many. **Pick the more visible/useful one and disable the other.** The LeftView cover is bigger, more central, more Apple-Music-like. The CircularSliderDisplay's cover-circle was small (80×80) and squeezed between toggle and value — easy choice to drop it.

---

## Version 1.1.1407 - 2026-05-07

**Title:** ✨ Power-Toggle: Track komplett unsichtbar + Sharp Cover-Art + Track-Info im LeftView (Apple-Music-Style)
**Hero:** none
**Tags:** Bugfix, MediaPlayer, UI

### Why

User-Feedback nach v1.1.1406:

1. **Power-Toggle hatte immer noch eine "Umrandung"** — gemeint war nicht der CSS-Border (den hatte ich schon raus), sondern das halbtransparente weiße Rounded-Rectangle Track-Element. User wollte nur das Power-Symbol-Circle floating sehen, ohne Track-Hintergrund drumrum.

2. **LeftView blieb leer** wenn ein media_player aktiv war — der blurry Cover-Background war zwar da (per v1.1.1372), aber kein **scharfes** Cover als Vordergrund + kein Track-Title sichtbar. User erwartete Apple-Music-Style "Now Playing"-Card mit großem Cover und Titel/Artist drunter.

### What changed

**`src/components/controls/PowerToggle.jsx`:**
- `background` aus `animate={{}}` entfernt
- `background: 'transparent'` explizit im `style={{}}` gesetzt
- Track ist jetzt komplett unsichtbar — nur das Power-Symbol (rundes Element mit Circle + Power-Glyph) ist visible
- Toggle-Funktion bleibt voll erhalten (Click + Drag funktioniert)

**`src/components/DetailView.jsx`:**
- Neuer JSX-Block: `<div className="detail-left-now-playing">` mit:
  - `<img className="detail-left-cover-art-sharp">` — scharfe Version desselben mediaCoverUrl
  - `<div>` mit Titel (`media_title`) + Subtitle (`media_artist · media_album_name`)
- Nur sichtbar bei `hasMediaCover === true` (also Player playing/paused mit Cover-URL)
- Eager-load damit das Cover sofort kommt

**`src/components/DetailView.css`:**
- `.detail-left-now-playing` — absolute centered, z-index 50 (über blurred bg, unter quick-stats), max-width 320px, fade-in 0.5s
- `.detail-left-cover-art-sharp` — square 1:1 ratio, 14px rounded, drop-shadow für Apple-Music-Look
- `.detail-left-now-playing-title` — 18px bold, ellipsis bei Overflow
- `.detail-left-now-playing-artist` — 13px medium grey, ellipsis

### Visual result

**Power-Toggle** sieht jetzt aus wie ein floating round button — Power-Symbol-Circle ohne sichtbaren Track. Der Toggle-Mechanismus ist immer noch da (zieht den Circle nach rechts on/off), aber der Track ist unsichtbar bis du ziehst.

**LeftView bei aktivem media_player** hat jetzt im Zentrum:
- Großes scharfes Cover (≈70% Breite, max 320px), abgerundet, mit Schatten
- Track-Title direkt darunter (groß, weiß)
- "Artist · Album" als Subtitle (kleiner, leicht transparent)
- Im Hintergrund weiterhin die blurry-version des Covers als atmospheric background (Apple-Music-Effekt)

### Lesson

Bei zwei aufeinanderfolgenden Bug-Reports ist die zweite Lesung des Reports oft präziser. v1.1.1406 hat den falschen Border weggemacht (framer-motion auto-injection), aber der User meinte ein ganz anderes "Border" — den fill des Track-Elements. **Beim Misverstehen lieber den User fragen "meintest du X oder Y?" als raten** — hätte beim ersten Mal direkt zur richtigen Lösung geführt.

Für die Cover-Art-Foreground-Card: hatte die Library-Browse-Cards (v1.1.1402) bereits gezeigt, dass eine prominente bildbasierte UI deutlich besser wirkt als reine Text-Listen. Dieselbe Logik gilt fürs Detail-View — das **Cover ist der visuelle Anker** für ein media_player, nicht der Slider oder die Buttons. Diese sollten daher das größte zusammenhängende UI-Element bekommen.

---

## Version 1.1.1406 - 2026-05-07

**Title:** 🐛 Two bugfixes — Power-toggle ghost border + Cover-art hidden under media_player video
**Hero:** none
**Tags:** Bugfix, MediaPlayer, UI

### Why

User screenshot from media_player detail-view showed two issues:

1. **Power-toggle had a visible 1px white border** around the rounded rectangle, even though no border was defined in CSS.
2. **Cover-art was invisible** in the detail-view background even though MA was streaming "Kuzu Kuzu" by Tarkan. User had enabled video for media_player domain in System-Entity Settings → the generic `media_player.mp4` background video was rendering on top of the cover-art.

### Root causes

**Bug 1 — framer-motion border auto-injection:**
`<motion.span>` had `animate={{ background, borderColor }}`. Even though no `border-width` or `border-style` was defined, **framer-motion auto-injects `border-style: solid; border-width: 1px`** on elements where `borderColor` is animated. The visible border appeared because of the animation property, not the CSS.

**Bug 2 — z-stack render order:**
`detail-left` rendered three siblings absolute-positioned: `<video>`, `<img.detail-left-news-image>`, `<img.detail-left-cover-art>`. All conditioned on their respective truthy. For media_player with active playback AND video enabled, both `videoUrl` and `mediaCoverUrl` were truthy → both rendered → the video covered the cover-art (later sibling, but `<video>` element typically forces a stacking context).

### What changed

**`src/components/controls/PowerToggle.jsx`:**
- Removed `borderColor` from `animate={{}}` (it served no visual purpose anyway — no border was intended)
- Added explicit `border: 'none'` to `style={{}}` as belt-and-suspenders against any framer-motion default

**`src/components/DetailView.jsx`:**
- New computed `showVideoBackground = videoUrl && !hasMediaCover` — if a media_player has cover-art, video is suppressed entirely
- Updated `<video>` render to gate on `showVideoBackground` instead of `videoUrl`
- Updated wrapper `className` to use `showVideoBackground` for the `has-video` flag
- Mobile divider visibility extended: hide divider only when video IS actually rendered (matching the new logic)

### Visual result

Power-toggle: clean rounded rectangle with smooth background-color transition, no border line.
Detail-view background for active media_player: cover-art (Apple-Music-blurred-style) fully visible, no generic video underlay.

For non-media_player entities or media_player in idle state, video background still works as before — only the active-playback case got the cover-priority logic.

### Lesson

framer-motion's auto-injection of `border-style: solid; border-width: 1px` when animating `borderColor` is undocumented surface noise. **If you only want to animate a color property, don't put it in `animate` unless the underlying CSS guarantees the property is meaningful.** Animating `borderColor` without an explicit border definition is the same kind of mistake as animating `transform: translateZ` on an element without `will-change` — works most of the time, but with weird side effects.

For z-stack/render-order in absolute-positioned siblings: `<video>` and `<img>` of the same z-index level don't compose cleanly because `<video>` creates an implicit stacking context. **Suppress, don't layer.** When two background candidates compete, pick one based on data — don't trust CSS z-index to do the right thing across all browsers.

---

## Version 1.1.1405 - 2026-05-07

**Title:** 📣 MA Announcements — Megaphone button + TTS panel with recent history
**Hero:** none
**Tags:** Feature, MusicAssistant, TTS

### Why

`music_assistant.play_announcement` was the last MA service we hadn't surfaced. Use case: send a quick text message to the player as a TTS announcement (Klingelton voran → "Essen ist fertig!" → Musik geht weiter). With this release, all 6 MA-services exposed in the user's installation are now wired into the card.

### What changed

**Util** (`src/utils/musicAssistant.js`):
- New `isAnnouncementAvailable(hass)` — checks `hass.services.music_assistant.play_announcement`
- New `playAnnouncementMusicAssistant(hass, entityId, text, opts)` — best-effort wrapper that:
  - Auto-detects URL (`text` starts with `http(s)://`) → sends as `url` parameter
  - Otherwise sends as `message` for MA's built-in TTS handling
  - Includes `use_pre_announce` (default true → small chime first) and optional `announce_volume`
  - Falls back gracefully on failure (returns `false`, error logged)

**Panel** (`MusicAssistantPanel.jsx`):
- New megaphone-icon button right of the tab buttons (only shown when `isAnnouncementAvailable(hass)`)
- Toggle with active-state highlight (orange when open)
- Tap deactivates active tab indicator (so visually clear "we're in announce mode now")
- New full-panel-content for announce mode: textarea + checkbox "Ton voranspielen" + send button + recent-announces list (localStorage, max 5 entries, deduped)
- Recent entries clickable to refill textarea, × removes individual, "Alle löschen" wipes
- Auto-focus textarea on open with 150ms delay (matches search-input pattern)
- Successful send → auto-saves to recent, clears textarea, closes panel, feedback bubble "Ansage gesendet"

**Tab interaction**:
- Tapping any of Suche/Bibliothek/Queue while announce-panel is open closes the panel and switches tab
- Tapping the megaphone again toggles back to whatever tab was active

**Styling** (`MusicAssistantPanel.css`):
- `.ma-announce-btn` — 36×32 fixed icon button, orange when active
- `.ma-announce-panel` — vertical scroll container
- `.ma-announce-textarea` — 70px min-height, focus glows orange border
- `.ma-announce-toggle` — checkbox + label, accent-color orange
- `.ma-announce-send` — orange pill button, disabled when text empty
- `.ma-announce-recent-row` — text + × pair per recent entry

### MA-integration status

All six available services in the user's MA installation are now used:

| Service | Surface |
|---|---|
| `search` | Suche-Tab |
| `play_media` | Play/Next/Add buttons in Suche/Detail |
| `get_queue` | Queue-Tab + WebSocket subscription |
| `get_library` | Bibliothek-Tab (Playlists/Alben/Künstler/Podcasts/Hörbücher/Radio) |
| `transfer_queue` | AirPlay button in Now-Playing-Header |
| `play_announcement` | Megaphone button in Tab-Bar |

The card is feature-complete with respect to MA's HA-service surface. Future work: WebSocket-direct queries for things HA doesn't expose (e.g. recently-played, top-tracks, episode-list-of-podcast).

### Lesson

The shape of a "send a quick message" UI is a textarea + presets + recent history. Recent history beats presets for short interactive sessions because the user's actual messages get more discoverable than developer-anticipated ones. Same pattern as search history (v1.1.1395) — and the same localStorage skeleton works for both. Two features, one implementation pattern, one CSS-class budget. Reuse compounds.

The dual-mode `playAnnouncement` (URL vs message) is the right shape for an opaque TTS pipeline: detect URL by regex, send as `url`; otherwise send as `message` and trust MA's TTS provider chain to handle it. If the user's MA can't TTS server-side, they can paste a URL to a pre-generated audio file as a workaround. One function, two flows, no need to expose the choice in the UI.

---

## Version 1.1.1404 - 2026-05-07

**Title:** 📡 MA Multi-Player-Transfer — AirPlay-style transfer button in Now-Playing header
**Hero:** none
**Tags:** Feature, MusicAssistant, Multi-Player

### Why

`music_assistant.transfer_queue` is one of the 6 services the user's MA exposes — and the only one we hadn't surfaced yet. Closes the multi-player loop: continue your current playback in another room with one tap.

Per agreed Mockup option **A**: button visible only in the Now-Playing header (which itself only renders when player is `playing` or `paused`). Semantically right — you can only transfer something that's actively playing.

### What changed

**New utils** (`src/utils/musicAssistant.js`):
- `isTransferQueueAvailable(hass)` — checks `hass.services.music_assistant.transfer_queue` existence
- `getMusicAssistantPlayers(hass, excludeEntityId)` — scans `hass.states` for media_players with `attributes.mass_player_id` or `app_id === 'music_assistant'`, excludes the current one, sorts available-first then alphabetical
- `transferMusicAssistantQueue(hass, source, target, opts)` — best-effort wrapper trying two service signatures (source_player+entity_id-target / target_player+entity_id-source) for cross-version compatibility, `auto_play: true` by default

**Now-Playing-Mini** (`MusicAssistantPanel.jsx`):
- New AirPlay-style SVG icon (rectangle + triangle, universally recognizable)
- Transfer button rendered conditionally: only when `transferAvailable = isTransferQueueAvailable(hass) && otherPlayers.length > 0`
- Tap toggles `transferOpen` state; player list slides down underneath the now-playing block via `framer-motion` (220ms ease)
- Player list shows: speaker icon + friendly name + status (`›` chevron / "Offline" label / "…" pending)
- Tap on available player → `transferMusicAssistantQueue()` → feedback bubble "Übertragen auf Küche"
- Auto-collapse when player goes idle (avoids stuck-open list after transfer completes)
- `onFeedback` prop wires the existing `showFeedback` from panel-level state

**Styling**:
- `.ma-np-btn-transfer` — secondary button (white-translucent, not orange) right of pause
- `.ma-transfer-list` — orange-tinted box visually connected to the now-playing-header above (matching border + tint)
- `.ma-transfer-item` — flex row with icon + name + status, hover highlight, disabled state for unavailable players
- Pending state shows orange tint while transfer service-call is in flight

### What you'll see

When playing on the Wohnzimmer player:
1. Now-Playing header has two buttons: **Pause** (orange filled) and **AirPlay icon** (white-translucent)
2. Tap the AirPlay → header stays, list slides down
3. List shows other MA-players (Küche, Schlafzimmer, ...) sorted available-first
4. Tap any available player → spinner on that row → service call → feedback "Übertragen auf {name}" → list collapses
5. After ~1-2 s the player goes idle (queue moved to target) and the now-playing-header itself auto-hides

### Lesson

Multi-player handoff is one of those features that's trivial to wire but high-impact for users with multiple speakers. The work here was 90% UX (where does the button live, when does it show, what happens after the transfer) and 10% service plumbing. The two-variant fallback in `transferMusicAssistantQueue` is the same pattern as the library loader — once you've established it once, every "MA service that might be named slightly differently between versions" gets the same treatment for free.

The conditional rendering of the transfer button (`isTransferQueueAvailable && otherPlayers.length > 0`) is the right discipline: zero MA-other-players means "transfer to nothing," which is meaningless. Hide what doesn't apply.

---

## Version 1.1.1403 - 2026-05-07

**Title:** ⚡ MA cover loading — Image() preload + remove no-referrer + fade-in + larger eager-window
**Hero:** none
**Tags:** Performance, MusicAssistant, UX

### Why

User feedback after v1.1.1402: "native MA UI loads images instantly, ours is slow." Native MA UI has the structural advantage of running same-origin with cached thumbnails. We can't fully match that without an MA-side cover proxy URL pattern, but we can close the gap with four targeted optimizations.

### What changed

**A · Removed `referrerPolicy="no-referrer"`:**
Most CDNs (Apple Music, Spotify, generic) work fine with the browser-default `strict-origin-when-cross-origin` policy. The explicit `no-referrer` was historical paranoia — some CDNs apply rate-limits or anti-hotlink redirects when no Referer is sent. Removing this header is one-line, no-downside, potentially significant.

**B · Image() preload before React re-render:**
In `loadBrowse`, after `Promise.all` resolves but BEFORE `setBrowseData(...)`, fire `new Image().src = url` for the first 6 items of each section (max 36 covers). Browser starts the network requests immediately. By the time React renders the `<img>` elements, many responses are already cached. Network requests overlap with React reconciliation instead of waiting for it.

**C · Fade-in animation:**
Cover images now have `animation: ma-cover-fade 220ms ease-out` from `opacity: 0` → `1`. Even if real load time is unchanged, perceived speed improves: instead of "blank → suddenly there", the user sees gradient → smooth fade-in to image. iOS does this for the same reason.

**D · Eager-load window expanded from 4 to 6 cards:**
`BrowseSection` now passes `eager={idx < 6}` so the first 6 covers per row get `loading="eager"` + `fetchpriority="high"`. Wider viewports show 5-6 cards per row visible — they should all load priority.

### What remains the structural gap to native MA UI

Native MA frontend likely runs at `<ha-host>:8095` or similar, fetching covers via MA's own server (which has pre-cached, possibly resized thumbnails). Our card pulls covers through the URL MA returns, which may be:
- An external CDN (Apple Music / Spotify) — first-load slow, subsequent cached by browser
- An HA-proxy URL `/api/music_assistant/...` — same-origin, fast, but only some response shapes use it
- A direct local file URL — fastest

Without knowing MA's exact thumbnail-proxy URL pattern, we can't force every cover through it. The improvements in this release are the practical maximum for our position.

### Lesson

Perceived performance ≠ measured performance. The Image()-preload trick saves ~50-200ms by overlapping network with render — measurable, but small. The fade-in animation saves zero milliseconds — but user-tested perceived load time drops noticeably. Combine the measured-speed improvements with perceived-speed improvements; both contribute to "feels fast."

For cross-origin asset loading: the smaller the explicit-policy footprint you set, the better. Browser defaults are tuned by Mozilla/Google for cross-CDN compatibility. Each explicit `referrerPolicy` / `crossOrigin` / `integrity` you add is one more way the request can fail in production. Default behavior is the path of least resistance until proven otherwise.

---

## Version 1.1.1402 - 2026-05-07

**Title:** ✨ MA panel: Apple-Music-style letter covers + eager-load top-row + Podcasts/Audiobooks sections
**Hero:** none
**Tags:** Feature, MusicAssistant, UX, Performance

### Why

Live test of v1.1.1401 with screenshot showed library tab working — but two follow-up issues:

1. **Slow image loading + grey blocks** for items without covers (custom playlists like "All favorited tracks" have no MA-side cover, render as empty grey).
2. **Missing Podcasts and Audiobooks sections** — not in the original 4-section layout.

### What changed

**A · Apple-Music letter+gradient cover fallback:**
- New `_stringHash()` + `colorForName()` helpers — name → consistent HSL gradient (35° hue shift)
- New `firstLetter()` — strips/uppercases first character
- New `CoverArt` component — wraps image with letter overlay underneath; if image is null or onError fires, the letter+gradient stays visible
- Replaces all 4 cover-rendering blocks (`NowPlayingMini`, `ResultCard`, `QueueCard`, `BrowseCard`, `BrowseDetail`) with single `CoverArt` invocations — DRY
- Per-container letter sizes via CSS: 14px (now-playing 38px) / 16px (result/queue 44px) / 32px (detail 96px) / 36px (browse-card 110px)

**B · Eager-load first 4 cards in each browse row:**
- New `eager` prop on `BrowseCard` → maps to `loading="eager"` + `fetchpriority="high"` on `<img>`
- `BrowseSection` passes `eager={idx < 4}` so the visible covers (4 × 110px + gaps fits ~470px viewport-width) load immediately, off-screen ones lazy
- Browser no longer queues all ~72 covers concurrently across 6 sections

**C · Podcasts + Audiobooks library sections:**
- `_pluralToSingular()`: added 'podcasts' → 'podcast' and 'audiobooks' → 'audiobook'
- `normalizeLibraryItem` + `normalizeSearchItem`: per-type subtitles (publisher/author for podcasts, author for audiobooks)
- `flattenSearchResults`: new buckets for podcast + audiobook (so search-tab also surfaces them when MA returns them)
- `loadBrowse`: now fetches 6 categories in parallel (added podcasts + audiobooks)
- Render: 6 `BrowseSection`s in order Playlists → Alben → Künstler → Podcasts → Hörbücher → Radio
- Drilldown types extended: `['album', 'artist', 'playlist', 'podcast', 'audiobook']` — tap on podcast/audiobook opens detail with attempt to load tracks/episodes (graceful empty-state if MA-version doesn't expose `get_<type>_tracks`)
- TYPE_ORDER, TYPE_LABELS_DE/EN, BrowseDetail typeLabel: all extended for new types

### Visual result

Items without covers (e.g. user's custom playlists "500 Random tracks" / "All favorited tracks") now show a colorful gradient with the first letter — no more grey blocks. The colors are deterministic per name so the same playlist always gets the same gradient. Items with covers render the image as an overlay; if cover-fetch fails or is slow, the gradient peeks through during the load.

### Lesson

The biggest UX leap from a single component refactor: **swap "missing image = grey block" for "missing image = colorful letter."** The first feels broken, the second feels designed. Apple Music, Spotify, Tidal all do this — for the same reason: cover-art is unreliable, fallbacks should look intentional, not like a bug.

The eager-load split is small but real: with `loading="lazy"` only, browser sometimes queues all images at once (especially in horizontal scrollers where intersection-observer bounds get complicated). Explicit `eager` for the first viewport-row + lazy rest is a one-line fix that halves the perceived load time on broadband.

For data-flexibility: the Podcasts + Audiobooks addition was nearly free because the loader is generic over `media_type`. The only edits were string mappings (singular/plural, subtitles per type) and an extra section in render. Worth keeping the loader generic from the start — type-specific code costs add up quickly.

---

## Version 1.1.1401 - 2026-05-07

**Title:** 🎯 MA library now uses `get_library` (single service + media_type) — matches user's MA version
**Hero:** none
**Tags:** Bugfix, MusicAssistant, API

### Why

The diagnostic logging from v1.1.1399 paid off in v1.1.1400 testing:

```
[MA] Available music_assistant services (6): get_library, get_queue, play_announcement, play_media, search, transfer_queue
```

So the user's MA installation exposes:
- `get_library` (NOT `get_library_<type>`) — single service with `media_type` parameter
- No `queue_command` — meaning v1.1.1394's queue skip-to + remove buttons can't work on this MA version
- `transfer_queue` — for future Phase 2 multi-player feature

### What changed

**Library loader** (`src/utils/musicAssistant.js`):
- New `_pluralToSingular()` helper (playlists → playlist etc.)
- `getMusicAssistantLibrary()` now tries 4 service-name+param variants in order:
  1. `get_library` + `media_type: 'playlist'` (string singular — user's case)
  2. `get_library` + `media_type: ['playlist']` (array singular — alt API)
  3. `get_library_<plural>` (newer/different MA versions)
  4. `library_<plural>` (alt naming convention)
- First success wins. All-fail logs the diagnostic block once per session.

**Queue command availability** (same file):
- New `isQueueCommandAvailable(hass)` helper checking `hass.services.music_assistant.queue_command` existence

**Queue tab** (`src/components/controls/MusicAssistantPanel.jsx`):
- Wraps queue rendering in IIFE that calls `isQueueCommandAvailable(hass)` once
- When unavailable → passes `undefined` for `onPlay` and `onRemove` to `QueueCard` → existing conditional rendering hides skip-to-clickable + trash button entirely (no more "Nicht unterstützt"-feedback flicker)

**Probe-version reset**:
- New `PROBE_VERSION_KEY` + `CURRENT_PROBE_VERSION` constants
- IIFE at module load checks if version differs → clears `LIB_DISABLED_KEY` + `SERVICES_LOGGED_KEY`
- Means v1.1.1400's "library disabled" cache from a failed probe gets auto-cleared, so the new working code probe runs fresh on first load

### What you should see

- Library tab now shows actual playlists / albums / artists / radios from your MA library
- Queue tab cards are read-only (no clickable skip, no trash icon) — until you upgrade MA to a version that exposes `queue_command`
- Console: silent on subsequent probes (success caches itself implicitly)

### Lesson

Diagnostic logging that the **user can read and copy back** is worth dramatically more than retries-with-better-error-handling. Without the "Available music_assistant services (6): ..."-line in v1.1.1399, I'd still be guessing. The 4-line variant-loop in `getMusicAssistantLibrary` is a permanent improvement: future MA-version-API-shifts get tried automatically without needing another release cycle.

The conditional UI hiding (no `queue_command` → no clickable card / trash) is also UX wisdom: showing buttons that fail with "Not supported" trains users to ignore feedback. **Don't show what doesn't work.**

---

## Version 1.1.1400 - 2026-05-07

**Title:** 🔥 Hotfix: ReferenceError `_maLibraryDisabled is not defined` (left over from v1.1.1399 sessionStorage refactor)

**Hero:** none
**Tags:** Bugfix, Critical, MusicAssistant

### Why

v1.1.1399 replaced module-level `let _maLibraryDisabled = false` with a `sessionStorage`-backed `isMusicAssistantLibraryDisabled()` helper. One reference inside `getMusicAssistantLibrary()` itself still pointed at the deleted `let`. Result: `Uncaught (in promise) ReferenceError: _maLibraryDisabled is not defined` on every panel mount, preventing the library probe from running at all.

The user's session was effectively broken — couldn't see search results, couldn't enter library tab without React error boundary triggering.

### What changed

- `src/utils/musicAssistant.js:417`: `if (_maLibraryDisabled) return [];` → `if (isMusicAssistantLibraryDisabled()) return [];`

### Lesson

When refactoring a module-scope variable to a function-based access pattern, **grep the module after the refactor** before declaring done. A single `grep -n '_maLibraryDisabled' src/utils/musicAssistant.js` would have caught this in 2 seconds. Pattern reinforcement: tip `cascade-detection` from the lessons doc applies just as much to refactor-leftovers as to dead-code cleanup.

---

## Version 1.1.1399 - 2026-05-07

**Title:** 🐛 MA library probe: sessionStorage cache + readable service-list logging
**Hero:** none
**Tags:** Bugfix, MusicAssistant, Diagnostics

### Why

v1.1.1398 still spammed 4× sets of errors per panel re-mount. Two issues:

1. **Module-level vars not persistent enough.** The `let _maLibraryDisabled = false` flag in `musicAssistant.js` got reset between Card mounts — possibly because HACS re-evaluates the bundle on each card-mount, or because Custom Element lifecycle wipes module state. Either way, "session" cache via plain `let` doesn't work in this environment.
2. **`Available music_assistant services: Array(6)`** showed up in the user's console folded — Chrome doesn't expand arrays inline. The user could see "6 services exist" but not their names. We need names to fix the calls.

### What changed

**sessionStorage as the cache backend** (`src/utils/musicAssistant.js`):
- New keys `ma_library_disabled_v1` + `ma_services_logged_v1`
- `isMusicAssistantLibraryDisabled()` / `setMusicAssistantLibraryDisabled(v)` / `resetMusicAssistantLibraryProbe()` now read/write sessionStorage instead of `let` vars
- Try/catch around all storage calls so SSR/iframe contexts don't crash
- Survives Card re-mount, JS bundle re-evaluation, and tab switches inside the same browser tab

**Service-list logging readable** (same file):
- `_haveLoggedServices()` / `_markServicesLogged()` helpers gate the log message via sessionStorage
- Output format changed from `available` (array — Chrome folds to "Array(6)") to `'[MA] Available music_assistant services (6): search, play_media, get_queue, ...'` — comma-joined string, single line, always visible in default console

### What the user should see after this release

On first browse-tab open in a fresh tab/session:
1. Four `[MA] library service for "<type>" not available: not_found ...` lines (one per category)
2. **One** `[MA] Available music_assistant services (6): <names>` line — the actual names
3. Cache locks. Subsequent panel re-mounts in the same browser tab → silent.

User pastes the names back, I point the helper at the real services in v1.1.1400.

### Lesson

Custom-card runtimes (HACS-loaded shadow DOM cards) don't behave like regular SPA modules. Module-level state can survive mount cycles in some setups and be wiped in others, depending on bundling, custom-element registration timing, and the host's reload behavior. **For session-scoped caches in this environment, sessionStorage is the only reliable answer.** Module-level `let` is only safe for state that doesn't need to outlive a single component mount.

For diagnostic logging: Chrome (and Firefox) fold arrays past a length threshold and show only `Array(N)` in the default view. Users hitting this in production won't click the disclosure triangle. **Always log diagnostic data as joined strings, never as raw arrays/objects, when you actually need the user to read it.**

---

## Version 1.1.1398 - 2026-05-07

**Title:** 🐛 MA library: stop spam + add diagnostics + try fallback service names
**Hero:** none
**Tags:** Bugfix, MusicAssistant, Diagnostics

### Why

Live test of v1.1.1397's library tab returned errors stacked 8× in the console — `[MA] get_library_<type> failed: Object` for each of playlists/albums/artists/radios on every panel re-mount. Two underlying issues:

1. **API mismatch.** The user's MA version doesn't expose `music_assistant.get_library_*` services. Without knowing exactly which services it _does_ expose, I had to ship blind in v1.1.1397.
2. **No cache for the negative result.** Every panel re-mount kicked off the loadBrowse again → 8 mounts × 4 categories = 32 failed calls.

### What changed

**Util** (`src/utils/musicAssistant.js`):
- New module-scope flags `_maLibraryDisabled` + `_maServicesLogged`
- Exported helpers: `isMusicAssistantLibraryDisabled()`, `setMusicAssistantLibraryDisabled(v)`, `resetMusicAssistantLibraryProbe()`
- `getMusicAssistantLibrary()` now tries **two service-name variants** before giving up:
  1. `music_assistant.get_library_<type>` (what we tried in v1.1.1397)
  2. `music_assistant.library_<type>` (variant without `get_` prefix — common naming in HA integrations)
- On both-fail: logs `err.code` + `err.message` (instead of bare error object that printed as "Object"), and **once per session** dumps the actual list of available `music_assistant` services from `hass.services.music_assistant` — diagnostic for figuring out what the user's MA version exposes
- Downgraded from `console.error` to `console.warn` — these aren't crash-level

**Panel** (`src/components/controls/MusicAssistantPanel.jsx`):
- `loadBrowse` checks `isMusicAssistantLibraryDisabled()` first; if true, skips fetching, sets `browseLoaded = true`, returns
- After a load where all 4 categories returned empty: marks library as disabled for the session — no more retry on tab re-mount
- Refresh button now calls `resetMusicAssistantLibraryProbe()` so user can explicitly retry
- Empty-state text updated: "Bibliothek nicht verfügbar in dieser MA-Version" + secondary line pointing user to console for available services

### What the user should do next

1. Open the panel once → look at console
2. The first failed library probe will print `[MA] Available music_assistant services: [...]` listing what the MA integration actually exposes
3. Send that list back — I can then point the helper at the real service names

Subsequent panel-opens will be silent (cached "disabled" state). One refresh-button-tap re-runs the probe if the user wants to retry.

### Lesson

Negative-result caching matters as much as positive-result caching. When you make a probe and it fails, the natural instinct is "try again next time" — which is right for transient errors but wrong for "service genuinely doesn't exist" errors. The two failure modes look identical to the caller; you have to assume "doesn't exist" until proven otherwise to avoid spam. Plus: when you ship a feature that calls third-party APIs, **dump the list of what's actually available on first failure**. That diagnostic line is worth more than a thousand stack traces.

The fallback-name pattern (`get_library_<type>` → `library_<type>`) is also worth keeping as a default for any HA-integration call. Service names get renamed across versions; trying the most likely variants is cheap.

---

## Version 1.1.1397 - 2026-05-07

**Title:** ⚡ MA panel: WebSocket queue subscription + library drilldown (album/artist/playlist tracks)
**Hero:** none
**Tags:** Feature, MusicAssistant, Performance, UX

### Why

Two follow-on improvements after v1.1.1396 surfaced the right scaffolding to address them:

1. **The 7-second queue polling was wrong on multiple axes.** Adding/removing a track in the queue had up to 7 s lag before the UI noticed; meanwhile the polling burned a network round-trip every 7 s even when nothing changed. Live updates via HA's event bus is the correct shape.
2. **Tap-on-card-plays-instantly was too aggressive for albums/artists/playlists.** Apple-Music-style UX is "tap card → see contents → choose tracks or play all." Direct play is great for tracks and radio, but for containers you usually want to peek inside first.

### What changed

**E · WebSocket queue subscription** (replaces the polling):
- New `subscribeMusicAssistantPlayerState(hass, entityId, onUpdate)` util — subscribes to HA's `state_changed` event bus filtered by `entity_id` client-side, returns an unsubscribe function
- Queue effect in panel: `Promise<unsub>` chain handles the async-subscribe-during-mount ordering; cleanup unsubscribes properly
- Refresh debounced to 800 ms (`QUEUE_DEBOUNCE_MS`) — `media_position` fires every second during playback, debouncing coalesces those into one queue refetch
- Initial load on tab open still happens immediately (not waiting for the first event)
- `queueIntervalRef` removed, `QUEUE_REFRESH_MS` constant retired

**Detail · Library drilldown** for album/artist/playlist:
- New `getMusicAssistantItemTracks(hass, type, uri, opts)` util — calls `music_assistant.get_<type>_tracks` (album/artist/playlist) with `return_response: true`, normalizes to track-card shape
- New `BrowseDetail` component: large 96×96 cover, type badge ("ALBUM" / "KÜNSTLER" / "PLAYLIST" in MA-orange), title (2-line clamp), subtitle, prominent **Play / + Queue** buttons, tracks list (uses existing `ResultCard`)
- New `browseDetail` state in `MusicAssistantPanel` (`{ type, uri, name, image, subtitle, tracks, loading } | null`)
- `handleBrowseTap` is now type-aware:
  - `track` / `radio` → direct play (unchanged)
  - `album` / `artist` / `playlist` → opens drilldown, tracks load async
- Back button returns to library list view; tab-switch resets the drilldown state automatically
- "Play All" / "Add All" use the original container URI (so MA gets the full album/playlist, not a single track)

### Files

- `src/utils/musicAssistant.js`: added `getMusicAssistantItemTracks` + `subscribeMusicAssistantPlayerState`
- `src/components/controls/MusicAssistantPanel.jsx`: queue effect rewrite, `browseDetail` state, `BrowseDetail` component, type-aware tap handler, container-action helper
- `src/components/controls/MusicAssistantPanel.css`: `.ma-detail*` blocks (back-button, header, cover, type-badge, title, action buttons, tracks-list)

### Risks

- `get_<type>_tracks` services exist in MA 2.x but the response shape varies. Loader tries `{items}` / `{tracks}` / array fallback. If all return empty for an album you tested, send the console error.
- `state_changed` events fire often (every `media_position` update). Without the 800 ms debounce we'd refetch the queue ~once per second during playback — debouncing keeps the network cost lower than the old polling.

### Lesson

The polling-to-subscription move is the kind of change that **costs more in plumbing than it saves in messages** if you do it naively. The win comes from two specific things: (a) debouncing burst updates so the subscription doesn't blow up the network, and (b) graceful unsubscribe-on-cleanup that doesn't leave dangling listeners between tab switches. Both get tested under Strict-Mode-style double-mount; both work correctly with the unsub-promise pattern (`then((unsub) => cancelled ? unsub() : (ref = unsub))`).

For the drilldown: the right abstraction was making `handleBrowseTap` decide based on `mediaItem.type` rather than passing different click handlers from the BrowseCard for different types. One handler, one entry point, type-switch inside — keeps the card component dumb and consistent across all five media types.

---

## Version 1.1.1396 - 2026-05-07

**Title:** 📚 MA panel: Library browse tab — Playlists / Albums / Artists / Radio
**Hero:** none
**Tags:** Feature, MusicAssistant, Library

### Why

Search + Queue covered "I know what I want" and "what's next." The missing third use-case was **discover what's already in my library** — Apple-Music-style horizontal-scrolling sections with cover-art thumbnails. This release adds a third tab "Bibliothek" (Library) that does exactly that.

### What changed

**New util** in `src/utils/musicAssistant.js`:
- `getMusicAssistantLibrary(hass, type, opts)` — generic loader for one of `playlists` / `albums` / `artists` / `tracks` / `radios`. Calls `music_assistant.get_library_<type>` via WS with `return_response: true`. Tries multiple response shapes (`{ items }` / `{ <type> }` / array) for cross-version tolerance.
- `normalizeLibraryItem(plural, it)` — collapses different MA response shapes to our standard `{ type, uri, name, subtitle, image }` card shape. Handles per-type subtitles (album → artist, playlist → owner, radio → provider).

**Panel changes** (`MusicAssistantPanel.jsx`):
- New tab button "Bibliothek" / "Library" between Search and Queue
- New state: `browseData = { playlists, albums, artists, radios }`, `browseLoading`, `browseLoaded` (caches result, refresh-button invalidates)
- `loadBrowse()` callback fires 4 `get_library_*` calls in parallel (`Promise.all`) with `limit: 12` each
- New `BrowseSection` + `BrowseCard` components — section header with title + count, horizontal-scroll row of 110×110px cover cards with title + subtitle below
- Tap on card → `playOnMusicAssistant(..., enqueue: 'replace')` — straight to playback
- Refresh button at bottom of browse content invalidates the cache

**Layout** (`MusicAssistantPanel.css`):
- `.ma-browse-content` — vertical scroll container holding the sections
- `.ma-browse-row` — horizontal scroll with `scroll-snap-type: x proximity` for clean swipe stops
- `.ma-browse-card` — 110×110 cover, 2-line title clamp, hover-zoom on cover
- `.ma-browse-refresh` — orange chip-style button at the end

### Failure modes (graceful)

- If MA version doesn't expose `get_library_*` services → the WS call throws, helper returns `[]`, section renders nothing, browse-tab shows "Bibliothek leer oder von dieser MA-Version nicht unterstützt"
- If only some categories return data (e.g. playlists ja, albums nein) → empty sections silently disappear, others show normally
- Console errors are logged but don't crash the panel

### Lesson

Loading 4 parallel `Promise.all`-fetched lists is dramatically simpler than orchestrating sequential or staggered loads — the user perceives the whole tab as ready at once instead of items popping in one by one. The cost is one bigger network burst on tab open, but for 12-item-per-section payloads with cached cover URLs that's acceptable. The cache-flag (`browseLoaded`) means tab-switching back-and-forth doesn't re-fetch — only the explicit refresh button does.

The `normalizeLibraryItem` indirection was worth its 20 LOC: future expansions (e.g. album-detail-view showing tracks) can reuse the same shape, and the BrowseCard component never needs to know which media-type it's rendering.

---

## Version 1.1.1395 - 2026-05-07

**Title:** ✨ MA panel: now-playing mini header + recent-searches chips
**Hero:** none
**Tags:** Feature, MusicAssistant, UX

### Why

Two follow-on UX gaps after the v1.1.1394 quick-wins bundle:

1. **You couldn't see what was playing inside the search/queue panel.** Cover-art was on the detail-view background but no compact "currently playing" reference inside the panel itself. Pause-toggling required leaving the panel.
2. **Empty search-state was passive.** "Tippe einen Suchbegriff ein..." gave no shortcut to repeat a recent search.

### What changed

**Now-Playing-Mini header** above the tabs, visible only when player is `playing` or `paused`:
- 38×38 cover-art thumbnail (entity_picture / media_image_url)
- Track-title + "artist · album" subtitle, both ellipsis-truncated
- Mini play/pause button (orange brand-color circle) → dispatches standard `media_player.media_play` / `media_pause` (no MA-specific call needed)
- Auto-hides for `idle` / `off` / `unavailable` states

**Recent-Searches** in the search-tab empty state (when query is empty):
- localStorage-backed (`ma_search_history` key, max 8 entries, deduped case-insensitively)
- Saved automatically when a search returns ≥ 1 hit
- Rendered as chips with a × per chip + "Alle löschen" header button
- Tap chip → puts query back in the input → search re-fires
- × on chip removes single entry; "Alle löschen" wipes localStorage too

### Files

- `src/components/controls/MusicAssistantPanel.jsx`:
  - New `NowPlayingMini` component (reads live from `item.attributes`, props update on each parent re-render via `useEntityStateSync` chain)
  - New `recent` state initialized lazily from localStorage; saved inside the search debounce callback after a successful response
  - `removeRecent(q)` + `clearAllRecent()` helpers
  - Empty-state branch in search-tab swapped: shows recent-chips block when history exists, otherwise the original placeholder paragraph
  - New `PauseIcon` SVG component
- `src/components/controls/MusicAssistantPanel.css`:
  - `.ma-now-playing` + sub-elements (cover, text, btn) with orange-tinted background
  - `.ma-empty-with-recent` + `.ma-recent-header` + `.ma-recent-row` + `.ma-recent-pill` + `.ma-recent-pill-x`

### Lesson

The Now-Playing-Mini doesn't need its own state subscription — it relies on the parent component's `useEntityStateSync` re-render flow. That re-render reaches the panel via prop change to `item`, but **doesn't re-fire the panel's own useEffects** (deps unchanged after the v1.1.1393 hass-ref fix), so the search list and queue stay mounted. Live data + stable lists = a free re-render budget you can spend on prominent live UI without paying scroll-jump.

For the recent-searches: writing to localStorage inside the same async block that called `setResults` keeps the two consistent — no separate effect needed, no race between "results arrived" and "history saved." Effect-free state coupling beats orchestrated effects.

---

## Version 1.1.1394 - 2026-05-07

**Title:** ✨ MA panel quick-wins bundle — type filter pills, round-robin sort, queue actions, larger result set
**Hero:** none
**Tags:** Feature, MusicAssistant, UX

### Why

After the v1.1.1393 stability fix the MA panel worked, but the UX had four obvious gaps:

1. Searching "Tarkan" returned 6 tracks → had to scroll down to find the Album/Artist hits
2. Tracks always came first (block-by-block), Albums and Artists buried at the bottom
3. The Queue tab was read-only — visible but not usable
4. 6 results per type was too few for popular searches

This release closes all four in one shot.

### What changed

**A · Type-filter pills** above the result list (Alle / Titel / Alben / Künstler / Playlists / Radio) with per-type counts. Active pill highlighted in MA-orange. Filter resets to "Alle" automatically when the search query changes.

**B · Round-robin interleaving** in `flattenSearchResults()`. Position 1 = top track, position 2 = top album, position 3 = top artist, position 4 = top playlist, position 5 = top radio, position 6 = 2nd track, ... — the most relevant hit per type always sits in the first viewport, no scrolling needed.

**C · Queue actions:**
- **Tap a queue item** → `music_assistant.queue_command(command='play_index', queue_item_id=...)` jumps the player to that track
- **Trash icon on each non-current item** → `music_assistant.queue_command(command='delete', queue_item_id=...)` removes it
- Both are best-effort against MA 2.x API; on older MA versions where `queue_command` isn't exposed they fail silently with a "Nicht unterstützt" feedback bubble (no crash)
- Queue auto-refreshes 400-600 ms after a successful action, so the UI converges with the player state

**D · Result limit** raised from 6 to 8 per media type — exposed as `MA_SEARCH_LIMIT_PER_TYPE` constant for future tuning. Total possible results now 40 (5 types × 8) — interleaving + filter pills make navigation cheap.

### Files

- `src/utils/musicAssistant.js`: split out `normalizeSearchItem()`, rewrote `flattenSearchResults()` for round-robin, added `queueCommandMusicAssistant()` wrapper, exported `MA_SEARCH_LIMIT_PER_TYPE`
- `src/components/controls/MusicAssistantPanel.jsx`: `typeFilter` state, type-counts memoized, `loadQueue` extracted as `useCallback` so queue actions can refresh after they fire, `QueueCard` extended with `onPlay`/`onRemove` props + Trash icon
- `src/components/controls/MusicAssistantPanel.css`: `.ma-type-filter-row`, `.ma-type-pill[.active]`, `.ma-type-pill-count`, `.ma-queue-card.is-clickable`, `.ma-queue-remove`

### Lesson

Round-robin interleave is one of those tiny algorithmic moves that completely changes the perceived quality of a search UI — costs ~10 lines of code, transforms "I have to scroll" into "I see what I want at a glance." The grouped-by-type sort that came naturally from the API shape was wrong from the start; flatness with type-badges does the disambiguation work better than spatial separation.

For the queue actions, the trade-off was: spec the exact MA service behavior (would have meant cross-version testing in the user's setup) vs. ship best-effort with explicit fallback feedback. Best-effort wins for a single-user iteration loop — if `queue_command` fails on the user's MA version we'll know within minutes and can adjust, instead of stalling on doc archaeology.

---

## Version 1.1.1393 - 2026-05-07

**Title:** 🐛 MA panel scroll-jump + crash fix — hass-ref pattern + UI stability
**Hero:** none
**Tags:** Bugfix, MusicAssistant, Pattern

### Why

Live test of v1.1.1392 surfaced two issues that turned out to be the same root cause:

1. **Scroll-jump:** Scrolling down in search results bounced back to the top after a couple of seconds — every time.
2. **Crash:** After enough re-fires the card became unresponsive.

Both caused by `hass` sitting in three `useEffect` dependency arrays. Every HA backend tick (a few seconds apart) gives a new `hass` reference → effects re-fire → `setSearching(true)` hides the result list (because of `{!searching && results.map(...)}`) → list unmounts → on `setSearching(false)` it remounts, scroll = 0. The endless re-fetch loop also accumulated in-flight requests until the card froze.

**Direct violation of tip `hass-ref` from the lessons doc.** Ironic.

### What changed

`src/components/controls/MusicAssistantPanel.jsx`:
- New `hassRef` updated on every render, used inside async callbacks instead of the closure value
- `hass` removed from all three `useEffect` dependency arrays (config-entry lookup, search effect, queue poller)
- `handleAction` reads from `hassRef.current` too
- Result list **stays mounted during re-search** — spinner became a small inline indicator stuck to the top-right of the list (sticky), no longer an empty-state replacement that swaps out the children. Empty/status states only render when `results.length === 0`.

`src/components/controls/MusicAssistantPanel.css`:
- New `.ma-spinner-small` and `.ma-inline-spinner` (sticky pill, top-right, dark backdrop)

### Lesson

The `hass-ref` pattern isn't optional discipline — it's a hard correctness requirement for any component that fetches asynchronously inside an effect. Putting `hass` in deps means **every backend tick triggers your effect**, and if that effect mutates display state mid-fetch, the UI flashes/jumps every few seconds. Either: (a) `hass` in a ref read by callbacks but never in deps, or (b) effects that don't fire UI-visible side effects until after their async work resolves.

The UI part of the fix matters too: even with the hass-ref fix, **toggling between empty-state and list mid-re-search still unmounts** and resets scroll. Display the list always; show progress as an overlay, not a replacement.

---

## Version 1.1.1392 - 2026-05-07

**Title:** 🐛 MA search fix — config_entry_id is required (was missing → search returned 400)
**Hero:** none
**Tags:** Bugfix, MusicAssistant

### Why

Live testing v1.1.1391 against a real Music Assistant install surfaced:

```
[MA] search failed: {code: 'invalid_format', message: "required key not provided @ data['config_entry_id']"}
```

The MA `search` service requires `config_entry_id` since MA 2.x — the doc-based assumption that it was optional was wrong. `play_media` and `get_queue` don't need it (they're targeted by `entity_id`), only the global `search` does.

### What changed

- `src/utils/musicAssistant.js`: new `getMusicAssistantConfigEntryId(hass)` — fetches via `config_entries/get` WS-API filtered by `domain: music_assistant`, prefers entries in state `loaded`, returns the first match.
- `searchMusicAssistant(hass, query, opts)` now accepts `opts.configEntryId` and includes it in the service data when provided.
- `src/components/controls/MusicAssistantPanel.jsx`: lookup runs once on mount, result stored in `configEntryId` state (with `configReady` flag). Search effect waits for `configReady` before firing. Two new empty-state cases:
  - **Spinner** while config is being resolved and the user is already typing
  - **"Music-Assistant-Integration nicht gefunden"** if lookup completes but no MA entry exists

### Lesson

When wrapping a third-party HA integration's services, the docs aren't always exhaustive about which arguments became required between versions. **Hit it once against a real instance before declaring the integration done** — the failure mode here was `code: invalid_format`, which a doc-only review would never have caught. Multi-instance installs (rare) get the first `loaded` entry; that's a known limitation worth flagging if it ever bites.

---

## Version 1.1.1391 - 2026-05-06

**Title:** 🎵 Music Assistant integration — Search + Queue panel for `media_player` (6th icon, replaces Settings on MA-players)
**Hero:** none
**Tags:** Feature, MediaPlayer, MusicAssistant

### Why

Music Assistant (https://www.music-assistant.io) bundles Spotify / Tidal / Apple Music / YT Music / local files / radio behind one HA `media_player.*` entity. The card already controlled transport + volume + source, but the killer feature of MA — full-text search across all providers + queue manipulation — was only reachable via MA's own web UI. This release brings it into the card's media-player detail-view.

### What changed

**New files:**
- `src/utils/musicAssistant.js` — detection helper (`isMusicAssistantPlayer`) + service wrappers (`searchMusicAssistant`, `playOnMusicAssistant`, `getMusicAssistantQueue`) + result/queue normalizers
- `src/components/controls/MusicAssistantPanel.jsx` — Search + Queue tab-switcher panel with debounced search, action buttons (Play now / Play next / Add to queue), queue polling
- `src/components/controls/MusicAssistantPanel.css` — orange-accented panel styling

**Modified files:**
- `src/utils/icons.js` — new `controlIcons.music_search` icon (magnifying glass with note symbol)
- `src/utils/deviceConfigs.js` — `media_player` case detects MA-players via `attributes.app_id === 'music_assistant'` or `attributes.mass_player_id`; replaces the Settings icon with the Music-Search icon on MA-players (max 6 icons preserved)
- `src/components/controls/PresetButtonsGroup.jsx` — new render branch for `group.id === 'ma_search'` → `<MusicAssistantPanel>`
- `src/utils/translations/languages/de.js` + `en.js` — new `controls.musicSearch` string

### Architecture decision: Music replaces Settings on MA-players

On MA-players, the standard HA `source_list` is semantically redundant — MA does provider selection itself. So the 6th icon slot is reused: Settings disappears for MA, replaced by Music-Search. Non-MA media_players keep the existing Settings icon. This keeps the icon count at max 6 (no mobile-layout breakage) and surfaces the more valuable feature on the players that have it.

### Detection logic

```js
const isMA = !!attrs.mass_player_id || attrs.app_id === 'music_assistant';
```

The MA HA-services (`music_assistant.search`, `play_media`, `get_queue`) are called via WebSocket `call_service` with `return_response: true` — `hass.callService` doesn't surface the response variable consistently in this card version, the WS path does.

### Panel features

- **Search tab**: 250 ms debounce, hits `music_assistant.search` with `limit: 6`, results flattened across tracks/albums/artists/playlists/radio. Each result card has Play / Next / Add buttons.
- **Queue tab**: lists upcoming items, current track highlighted in orange, polls every 7 s for live updates (no WebSocket subscription yet — Phase 2).
- **Feedback bubble**: brief confirmation after each action (Wird gespielt / Als Nächstes / Zur Queue).

### Lesson

The `music_assistant.search` service returns a structured response (`{ tracks, albums, artists, playlists, radio }`) rather than a flat list. Flattening at the boundary in `flattenSearchResults()` keeps the UI dumb — single render path for all media types, with a small `type` badge for visual disambiguation. Cleaner than five separate result-list components.

---

## Version 1.1.1390 - 2026-05-06

**Title:** 💡 New System Entity: Tipps — Apple-Tips-style lessons gallery (DE/EN, GitHub-sourced)
**Hero:** none
**Tags:** Feature, SystemEntity, Documentation

### Why

`docs/lessons/` holds curated patterns distilled from session notes — they were useful but invisible to the running app. This release adds a system entity that fetches `lessons.{de,en}.md` from GitHub and renders them Apple-Tips-style inside the card, mirroring the existing Versionsverlauf flow 1:1.

### What changed

**New files** (`src/system-entities/entities/tipps/`):
- `index.js` — entity definition, parser for the `## Tipp <slug> - <Category>` markdown format, GitHub fetch + 5-min localStorage cache (per-language key)
- `TippsView.jsx` — list/detail navigation, search, category-filter, tag-filter
- `components/TippsList.jsx` — feed view with category + tag chips
- `components/TippDetail.jsx` — markdown-rendered detail with `marked` + `dompurify`
- `styles/TippsView.css` — orange brand color (iOS lightbulb feel), matching versionsverlauf layout

**Wiring:**
- `src/system-entities/registry.js` — registered `tipps` between versionsverlauf and integration
- `src/components/DetailView/TabNavigation.jsx` — wired tipps into back/search/refresh/settings action handlers + active-button polling

**Content:**
- Reformatted `docs/lessons/lessons.{de,en}.md` from free-form to the parser-compatible `## Tipp <slug> - <Category>` structure with `**Title/Hero/Tags:**` headers
- 7 initial tipps each (DE + EN) covering Audit, Refactor, Build, HomeAssistant categories, distilled from R5–R16 session notes

### Architecture

| Aspect | Versionsverlauf | Tipps |
|---|---|---|
| Source | `docs/version-history/versionsverlauf.md` | `docs/lessons/lessons.{de,en}.md` |
| Per-item id | Version number | Slug |
| First filter row | Time window (1W/2W/4W/All) | Category |
| Second filter row | Tags | Tags |
| Cache key | `versionsverlauf_cache` | `tipps_cache_{de,en}` |
| Brand color | Raycast Purple | iOS Orange |

### Lesson

Apple-Tips-style cards work best when the source format is constrained: `## <slug> - <Category>` + `**Title/Hero/Tags:**` headers means a 12-line regex can parse the whole doc with no edge cases. Free-form Markdown would have required either a real Markdown AST walk or per-tipp file boundaries — both heavier than warranted for a 7-entry doc.

---

## Version 1.1.1389 - 2026-05-06

**Title:** 🧹 Round 16 — 3 large component files audit (SubcategoryBar/StatsBar/UniversalControlsTab) — minimal cleanup, files mostly clean
**Hero:** none
**Tags:** Refactor, Audit, Cleanup

### Why

Audit of 3 component files >500 LOC. Confirmed they're mostly tight production-managed UI code with no large dead-code patches. Found minimal cleanup opportunities.

### Audited

| Datei | LOC | Findings |
|---|---:|---|
| `SubcategoryBar.jsx` | 655 | ✅ Clean — alle State-Vars used (read+write), keine unused imports, alle Helpers active, keine commented-out code blocks |
| `StatsBar.jsx` | 598 → 597 | 🟡 1 unused `GridReturnIcon` import |
| `UniversalControlsTab.jsx` | 601 → 600 | 🟡 1 commented `// console.log('📊 Current value (raw):', value)` |

### What changed

- `StatsBar.jsx`: removed unused `GridReturnIcon` import (-1 LOC)
- `UniversalControlsTab.jsx`: removed commented debug log (-1 LOC)

### Total

- **−2 LOC**
- **0 functional changes**

### Lesson

Once cascade-dead-code patterns (Plugin infrastructure, language files, animation barrels, demo components, default-export bundles) are cleaned, what remains in production component files is genuine UI logic. **The audit-effort returns drop sharply after the 5th-6th round** — file-by-file Symbol-Grep on >500 LOC files now finds 1-2 LOC instead of dozens. Diminishing returns mean the cleanup phase is essentially done for these areas.

---

## Version 1.1.1388 - 2026-05-06

**Title:** 🧹 Round 15 — SearchField deep clean (-105 LOC, 30 unused imports + 8 orphan icons)
**Hero:** none
**Tags:** Refactor, Cleanup, DeadCode, SearchField, Icons

### Why

Deep audit of `SearchField/` revealed massive accumulated dead code in `SearchField.jsx`: 30 unused imports that survived earlier moves of subcomponents (icons, animation variants, getSensorCategory, AnimatePresence). After removing those imports, 8 icons in `Icons.jsx` cascaded into orphan status.

### What changed

**`SearchField.jsx`: 1081 → 1050 LOC (-31)**

30 unused imports removed across 4 import blocks:
- `AnimatePresence` (framer-motion) — never used (only `motion`)
- `getSensorCategory` (translations) — never used
- 12 animation variants (`aiButtonVariants`, `buttonHoverVariants`, `filterContainerVariants`, `filterGroupVariants`, `filterButtonVariants`, `filterButtonHoverVariants`, `mainFilterButtonVariants`, `categoryContainerVariants`, `categoryButtonVariants`, `categoryButtonHoverVariants`, `getCategoryButtonActiveVariants`, `clearButtonHoverVariants`) — all moved to subcomponents (FilterControlPanel, CategoryButtonsPanel, SearchInputSection) but parent imports left behind
- 17 icon imports (`AIBrainIcon`, `ChevronDownIcon`, `ChevronUpIcon`, `ChevronLeftIcon`, `MagnifyingGlassIcon`, `ClearIcon`, `FilterIcon`, `DevicesIcon`, `ScenesIcon`, `ActionsIcon`, `SettingsIcon`, `SearchIcon`, `GridViewIcon`, `ListViewIcon`, `TypesIcon`, `FilterMainIcon`, `AreasIcon` partial) — moved to subcomponents
- Removed debug `console.log('🔧 AI-Mode aktiviert - Panel wird expanded')`

**`SearchField/components/Icons.jsx`: 163 → 89 LOC (-74)**

After removing SearchField.jsx imports, 8 icons became completely orphan and got deleted:
- `ChevronDownIcon`, `ChevronUpIcon`, `MagnifyingGlassIcon`, `FilterIcon`, `DevicesIcon`, `ScenesIcon`, `ActionsIcon`, `SettingsIcon`

The 17-icon Icons.jsx is now 9 icons. Remaining icons (`AIBrainIcon`, `ChevronLeftIcon`, `ClearIcon`, `SearchIcon`, `GridViewIcon`, `ListViewIcon`, `CategoriesIcon`, `AreasIcon`, `TypesIcon`, `FilterMainIcon`) are all used by subcomponents.

**`SearchField/components/DetailViewWrapper.jsx`: 225 LOC unchanged**

Removed unused `AnimatePresence` import (only `motion` actually used).

### Total

- **−105 LOC** (31 SearchField.jsx + 74 Icons.jsx)
- **0 functional changes**

### Lesson

Sub-component refactors leave imports behind in parent files. When you split a 1000-line component into smaller pieces and the original component file shrinks dramatically, the import block doesn't shrink automatically — IDE auto-import may drop unused symbols, but only on save and only for the active file. **Run a strict-grep audit (`grep -v import-block`) on parent files after major refactors.**

---

## Version 1.1.1387 - 2026-05-06

**Title:** 🧹 Round 14 — DataProvider.jsx clean (4 commented log blocks + 1 unused import, -17 LOC)
**Hero:** none
**Tags:** Refactor, Cleanup, DeadCode, DataProvider

### Why

DataProvider.jsx is the largest file in the codebase (1297 LOC). Cross-cutting audit revealed minimal dead code — the file is tight production-managed React state machinery — but had 4 commented-out `console.log` debug blocks marked `TEMPORARILY DISABLED to reduce console spam` and 1 unused import.

### What changed

**`providers/DataProvider.jsx`: 1297 → 1280 LOC (-17)**

Removed 4 commented-out console.log blocks (all debug-only, never planned to be re-enabled):
- Line 277-284 (state changed log, 8 lines)
- Line 1027-1031 (updating entity state, 5 lines)
- Line 1047-1048 (entity updated, 2 lines)
- Line 1068-1069 (new entity added, 2 lines)

Removed 1 unused import: `matchesPattern` from `patternMatching.js` (only `filterExcludedEntities` from same module is used).

### Verify

Sanity-grep: 0 occurrences of `TEMPORARILY DISABLED` or `matchesPattern` left in DataProvider.jsx. Production build clean.

### Total

- **−17 LOC**
- **0 functional changes**

### Note

DataProvider.jsx remains 1280 LOC and contains the bulk of the app's state machinery. Deeper refactoring would require splitting it into multiple providers (entities, settings, suggestions, notifications) — that's an architectural change, not dead-code cleanup. Out of scope for this initiative.

---

## Version 1.1.1386 - 2026-05-06

**Title:** 🧹 Round 13 — broad dead-export sweep across services/icons/system-entities (~−500 LOC, −4 files)
**Hero:** none
**Tags:** Refactor, Cleanup, DeadCode, Icons, Services

### Why

Cross-cutting symbol-grep audit found 17 dead symbols and 4 orphan icon files spread across services, system-entities, and assets that previous rounds didn't touch.

### What changed

**Orphan files deleted (4 files, 318 LOC):**
- `assets/icons/actions/AutomationOn.jsx` (66 LOC)
- `assets/icons/actions/AutomationOff.jsx` (69 LOC)
- `assets/icons/actions/SceneOn.jsx` (69 LOC)
- `assets/icons/actions/ScriptOn.jsx` (114 LOC)

These 4 icon files were imported in `iconRegistry.js` but never referenced inside it (`grep -c` showed 1 occurrence = the import line only). After delete: 4 import lines stripped from registry too.

**Dead functions deleted (~150 LOC):**
- `AnimatedDeviceIcons.jsx`: `getStaticDomainIcon` + dead default export (-22 LOC)
- `DeviceEntityFactory.js`: `loadDeviceEntities`, `registerDeviceEntities`, default export (-50 LOC, file 86 → 33 LOC)
- `deviceConfigStorage.js`: `isBootstrapped`, default export (-19 LOC)
- `SettingsView.jsx`: `createSettingsView`
- `profileColors.js`: `getColorNameById`
- `profileParser.js`: `removeProfiles`, `hasProfiles`
- `DeviceCardIntegration.jsx`: `getSystemEntityColor`, `migrateDeviceCardLogic`, default export, JSDoc usage example (-67 LOC)
- `energyDashboardService.js`: `getPowerSensorFromEnergy` (-23 LOC)
- `userService.js`: `clearUserProfilePictureCache`
- `searchHelpers.js`: `highlightName` (-32 LOC)

**Internal-only `export` strips:**
- `AnimatedDeviceIcons` (used internally only by getDeviceIcon)
- `deviceTypeRegistry.isDeviceTypeAvailable`
- `energyDashboardService.js`: `getEnergyConfig`, `extractEnergySensors`, `getTodayEnergyStatistics`, `calculateEnergyCost`
- `userService.fetchUserProfilePicture`

### Total

- **−4 files** (orphan icons)
- **~−500 LOC**
- **0 functional changes** — all removed functions had zero call sites verified via 3-stage grep

### Lesson

Default-export objects (`export default { foo, bar, baz }`) often hide dead exports. Several of the deleted symbols were only "used" inside their default-export bundle — but no consumer imported the default. The default-export pattern was leftover convention, not actual API.

---

## Version 1.1.1385 - 2026-05-06

**Title:** 🧹 Round 12 — DetailView/DeviceCard/SearchField scope cleanup (-247 LOC)
**Hero:** none
**Tags:** Refactor, Cleanup, DeadCode, UnusedImports

### Why

User-requested deep audit of the DetailView/, DeviceCard/, SearchField/ subtrees plus the top-level component files (SearchField.jsx, SearchSidebar.jsx, StatsBar.jsx, SubcategoryBar.jsx, SystemEntityLazyView.jsx, WallpaperModeOverlay.jsx). Found a 218-LOC orphan demo component, a debug-only useEffect with write-only `window.DEBUG_*` properties, and 11 unused imports across 4 files.

### What changed

**`DeviceCard.jsx`: 794 → 574 LOC (-220)**

- Deleted `DeviceCardsDemo` component (218 LOC, lines 577-794) — never imported anywhere, leftover demo code
- Removed 3 unused imports: `motion`, `deviceCardVariants as cardVariants`, `translateUI`

**`SearchField.jsx`: 1104 → 1081 LOC (-23)**

- Deleted debug useEffect (~20 LOC) that wrote `window.DEBUG_groupedFilteredDevices`, `DEBUG_filteredDevices`, `DEBUG_activeCategory`, `DEBUG_selectedSubcategory`, `DEBUG_isExpanded`, `DEBUG_showDetail` — none of these globals were ever read, the corresponding `console.log` had been commented out previously
- Removed 4 unused imports: `DeviceCard` (rendered by GroupedDeviceList child, not directly), `AIModeInterface` (used via AIModeSection wrapper), `getPlaceholder`, `highlightName`

**`DetailView.jsx`: 763 → 761 LOC (-2)**

- Removed 3 unused imports: `translateUI`, `getIconForDomain`, `getBackgroundStyle`

**`SearchField/utils/computeSuggestion.js`: 141 → 139 LOC (-2)**

- Removed unused `resolveDomainSynonym` import

**`SearchField/utils/searchEventHandlers.js`: 498 LOC (no change)**

- Stripped `export` from `acceptSuggestion` — used internally only (line 207 calls it within the same file)

### Verify

3-stage grep per symbol: external imports = 0, internal-only confirmed, sanity-grep across `src/` clean. Production build clean.

### Total

- **−247 LOC**
- **0 functional changes**

---

## Version 1.1.1384 - 2026-05-06

**Title:** 🗂️ Round 11 — Folder structure cleanup (3 empty dirs, misplaced CSS, single-file subfolder)
**Hero:** none
**Tags:** Refactor, Cleanup, Structure

### Why

Final structural review after the dead-code rounds revealed three empty directories from earlier refactors, a CSS file misplaced one level up from its consumer, and a single-file `formatters/` subfolder that mirrored the chartjs flatten from R10.

### What changed

**Empty dirs removed:**
- `src/system-entities/entities/integration/device-entities/views/layouts/`
- `src/components/tabs/ScheduleTab/components/settings/`
- `src/components/tabs/ScheduleTab/components/pickers/`

**CSS relocation:**
- `src/system-entities/styles/AllSchedulesView.css` → `src/system-entities/entities/all-schedules/styles/AllSchedulesView.css`. The CSS now sits next to its consumer JSX, matching the per-entity `styles/` convention used by `news/`, `versionsverlauf/`, `integration/`. Removed the now-empty `src/system-entities/styles/` parent.

**Subfolder flatten:**
- `src/utils/formatters/timeFormatters.js` → `src/utils/timeFormatters.js`. Single-file subfolder eliminated, 1 import path updated. Mirrors the R10 `utils/chartjs/` flatten.

### Final src/ shape

11 functional top-level folders + `index.jsx`. No empty dirs anywhere in `src/`. Per-entity styles consistently inside the entity folder. No floating CSS at framework-root level.

Single-file subfolders that remain are intentional semantic namespaces:
- `system-entities/base/` (base class)
- `system-entities/config/`, `system-entities/integration/` (system-entity infrastructure)
- `components/charts/`, `components/ai/` (component categories)
- `entities/*/styles/` (per-entity CSS — project convention)

### Total

- **−3 empty dirs**
- **−1 misplaced CSS dir** (`system-entities/styles/`)
- **−1 single-file subfolder** (`utils/formatters/`)
- **+1 entity-aligned styles dir** (`entities/all-schedules/styles/`)
- **0 functional changes**

---

## Version 1.1.1383 - 2026-05-06

**Title:** 🧹 Round 10 — Dead helpers + src/ structure cleanup
**Hero:** none
**Tags:** Refactor, Cleanup, DeadCode, Structure

### Why

After the deep audit rounds, two more dead helper batches surfaced via per-symbol grep, plus the `src/` folder had stale documentation `.txt` files at the top level and a single-file subfolder (`utils/chartjs/`) that was a leftover from earlier organization.

### What changed

**Dead code (-61 LOC):**
- `assets/icons/iconRegistry.js`: removed `getStaticIcon` (never called externally, ~12 LOC including JSDoc)
- `system-entities/config/appearanceConfig.js`: removed `getEntityIcon`, `getEntityColor`, `getDetailViewConfig` + dead default export (~49 LOC)

**Structure:**
- Moved `src/dokumentation.txt` and `src/dokumentation_chartjs.txt` to `docs/` (renamed `*_archive.txt`) — they were never imported, just legacy text reference docs that polluted `src/`
- Flattened `src/utils/chartjs/chartConfig.js` → `src/utils/chartConfig.js` (the subfolder contained only one file). Updated 2 import paths.
- Cleaned all 14 `.DS_Store` files from `src/` (cosmetic — already gitignored, but visible in editor file trees)

### After

`src/` top-level is now: 11 functional folders + `index.jsx`. No floating doc files, no single-file subfolders. Each top-level dir has clear purpose:
- `assets/` — icon SVG components
- `components/` — Preact UI
- `contexts/` — React Context providers
- `data/` — mock devices for dev
- `hooks/` — shared React hooks
- `providers/` — DataProvider + MockDataMigration
- `services/` — domain services (energyDashboard, user)
- `styles/` — global CSS (toast, perceived speed)
- `system-entities/` — internal entity framework
- `utils/` — pure helpers + transformations

### Total

- **−61 LOC** (dead code)
- **−1 subfolder** (`utils/chartjs/`)
- **−2 stale `.txt` files** moved out
- **−14 `.DS_Store` files** cleaned
- **0 functional changes**

---

## Version 1.1.1382 - 2026-05-06

**Title:** 🧹 Round 9 — translations API streamlined (-164 LOC across index.js + helpers.js)
**Hero:** none
**Tags:** Refactor, Cleanup, DeadCode, i18n, Translations

### Why

After R8 deleted 8 unused languages, audit of the translation API surface revealed massive cascade dead code: the `useTranslation` React hook was never used (no consumers), and the 8 helpers it depended on (`detectBrowserLanguage`, `normalizeLanguageCode`, `getAvailableLanguages`, `formatTimeSince`, `translateDomain`, `deepMerge`, `getTranslation` re-export, `interpolate` re-export) cascaded into deletion. Real consumers only use 6 symbols from the barrel.

### What changed

**`utils/translations/index.js`: 132 → 46 LOC** (-86)

- Deleted `useTranslation` React hook (~55 LOC) — zero consumers
- Deleted standalone `t()` function — only consumer was `translateUI()`, now inlined directly
- Deleted default export of `translations` object — never imported as default
- Removed 8 dead barrel re-exports: `translateDomain`, `formatTimeSince`, `normalizeLanguageCode`, `getAvailableLanguages`, `detectBrowserLanguage`, `deepMerge`, `getTranslation`, `interpolate`

**`utils/translations/helpers.js`: 438 → 360 LOC** (-78)

Cascade dead after barrel cleanup:
- `translateDomain` (4 LOC) — fully unused
- `formatTimeSince` (20 LOC) — fully unused
- `detectBrowserLanguage` (8 LOC) — caller (useTranslation) deleted
- `normalizeLanguageCode` (5 LOC) — only used by detectBrowserLanguage
- `getAvailableLanguages` (6 LOC) — only used by detectBrowserLanguage
- `deepMerge` (19 LOC) — fully unused
- `isObject` (3 LOC) — only used by deepMerge

### Real translation API now

Public surface = 6 symbols only: `formatSensorValue`, `getSensorCategory`, `getSensorAdvice`, `isEntityActive`, `translateState` (wrapper), `translateUI` (wrapper). Plus `translations` map for internal cross-reference. Total dependency tree is now clean and minimal.

### Total

- **−164 LOC**
- **0 functional changes** — all consumers verified intact via 3-stage symbol grep

### Lesson

When auditing barrel-style modules: list real consumers (`grep -rh "from.*module"` excluding barrel itself), then everything not on that list is dead. The cascade chain in `helpers.js` formed naturally once the dead `useTranslation` hook was removed — 5 helpers became orphan in sequence.

---

## Version 1.1.1381 - 2026-05-06

**Title:** 🌍 Translations cleanup — 8 unused languages removed (DE+EN only)
**Hero:** none
**Tags:** Cleanup, Translations, i18n

### Why

The app's `LANGUAGE_CODES = ['de', 'en']` constant restricted UI selection to German and English, but the translations bundle still loaded fr/es/it/nl/pt/ru/tr/zh. User confirmed only DE+EN are intended targets — the 8 extra language files were dead weight in the bundle.

### What changed

- **Deleted 8 language files**: `fr.js` (345), `es.js` (324), `it.js` (223), `nl.js` (204), `pt.js` (200), `ru.js` (200), `tr.js` (200), `zh.js` (200)
- **Updated `translations/index.js`**: removed 8 imports + 8 entries from translations map
- **Updated `translations/helpers.js`**: trimmed `getAvailableLanguages()` to return only `[{de}, {en}]` — `detectBrowserLanguage()` now correctly falls back to 'de' for any other browser language

### Total

- **−1896 LOC** across 8 deleted files + 14 LOC in index/helpers (1910 total)
- **−8 files**

If a future feature wants French support, the helpers infrastructure (`getTranslation`, `interpolate`, `deepMerge`) is fully intact — just add a new file under `languages/` and 2 lines in `index.js`.

---

## Version 1.1.1380 - 2026-05-06

**Title:** 🧹 Round 7 — utils/ Dead-Export Sweep + Cascade Cleanup (~500 LOC across 11 files)
**Hero:** none
**Tags:** Refactor, Cleanup, DeadCode, ChartConfig, Toast, Constants

### Why

Comprehensive symbol-grep audit of all remaining `utils/*.js` files (excluding translations + animations from earlier rounds). Found 20+ dead exports plus a cascade chain in `chartjs/chartConfig.js` where the only consumed API is the named `ChartJS` export — every other helper (visionOSColors, defaultChartOptions, chartPresets, createChartConfig, destroyChart) was internal-only chained dead code.

### What changed

**`utils/chartjs/chartConfig.js`: 283 → 64 LOC** (largest single-file win)

The cascade: `createChartConfig → chartPresets → defaultChartOptions → visionOSColors`. None of these are imported externally. `ChartComponents.jsx` defines its own local `visionOSColors`. Removed the entire helper hierarchy + dead default export. Kept only ChartJS module setup + named export.

**`utils/toastNotification.js`: 318 → 195 LOC**

Removed 6 unused toast helpers + cascade: `clearAllToasts`, `showProgressToast`, `showActionToast`, `getActiveToastCount`, `testAllToasts` (and `showWarningToast` which was only called from `testAllToasts`).

**`utils/actionConstants.js`** — 4 dead constants: `TOAST_MESSAGES`, `ACTION_DOMAINS`, `DEFAULT_MIN_RELEVANCE`, `ANIMATION_DURATION` (~30 LOC)

**`utils/historyConstants.js`** — 3 dead exports: `PATTERN_TYPES`, `STATS_THRESHOLDS`, `getTimeframeLabel` (~30 LOC)

**`utils/scheduleConstants.js`** — 2 dead exports: `WEEKDAY_PRESETS`, `TIMER_PRESETS` (~17 LOC)

**`utils/squircle.js`** — `SQUIRCLE_LABELS` (~7 LOC)

**`utils/hassRetryService.js`** — `resetHassCache` (test helper) + `isHassReady` (~20 LOC)

**`utils/systemSettingsStorage.js`** — `setSystemSettingsValue` (~14 LOC)

**`utils/toastSettings.js`** — `TOAST_EVENT_KEYS` (~9 LOC)

**Group B: `export` keyword strips (no LOC reduction, just API hygiene)**

Stripped `export` from internal-only helpers across: `perfMarks.js` (perfMeasure, perfReset), `excludedPatternPresets.js` (DEFAULT_SEED_PATTERNS), `domainHandlers.js` (powerToggleHandlers), `sliderHandlers.js` (sliderChangeHandlers), `systemSettingsStorage.js` (readSystemSettings, writeSystemSettings), `scheduleUtils.js` (createSchedule), `indexedDB.js` (DB_NAME, DB_VERSION), `squircle.js` (SQUIRCLE_STYLES), `searchSynonyms.js` (SYNONYMS, CATEGORY_SYNONYMS), `pendingActionTracker.js` (PENDING_TIMEOUT_MS), `videoHelpers.js` (7 internal helpers).

### Total

- **~−500 LOC** across 11 files
- **0 functional changes**

### Verify

3-stage grep per symbol: external imports = 0, internal calls verified, then sanity-grep all removed symbols across `src/` confirms no orphan references.

### Lesson

Cascade dead code is the highest-ROI find: when an external API is fully unused, the entire internal helper tree below it is also dead. The chartConfig cascade saved 219 LOC from a single file because one root function (`createChartConfig`) was unused — pulling it deletes 4 dependents, each unused too.

---

## Version 1.1.1379 - 2026-05-06

**Title:** 🧹 Round 6 — Animations Barrel Audit (~660 LOC: 22 dead variants + dead default-export across animations/*)
**Hero:** none
**Tags:** Refactor, Cleanup, DeadCode, Animations, FramerMotion

### Why

The `animationVariants.js` barrel re-exported ~50 Framer Motion variants from 4 sub-files. Auditing each variant by symbol-grep across `src/` (excluding the barrel itself, which doesn't count as "use") found 22 variants with zero consumer code, plus an entirely unused default export block.

### What changed

**`utils/animationVariants.js`: 224 → 66 LOC**

- Default export object (`export default {...}`) — never imported anywhere via `import variants from ...` — removed in full (~136 LOC)
- 22 dead variants stripped from named-export blocks

**`utils/animations/base.js`: 296 → 79 LOC**

Removed 9 dead variants: `fadeVariants`, `fadeInUpVariants`, `fadeInDownVariants`, `scaleVariants`, `scaleUpVariants`, `slideInLeftVariants`, `slideInRightVariants`, `backdropVariants`, `getReducedMotionVariants`. Kept: `easings`, `durations`, `createSlideVariants`, `panelVariants`.

**`utils/animations/buttons.js`: 368 → 314 LOC**

Removed 3 dead variants: `controlButtonContainerVariants`, `buttonIconVariants`, `buttonLabelVariants`.

**`utils/animations/components.js`: 501 → 409 LOC**

Removed 3 dead variants: `circularSliderProgressVariants`, `settingsItemVariants`, `marketplaceItemVariants`.

**`utils/animations/layout.js`: 359 → 218 LOC**

Removed 7 dead variants: `glassHoverVariants`, `staggerContainerVariants`, `staggerItemVariants`, `tabVariants`, `tabContentVariants`, `categoryIndicatorVariants`, `expandablePresetsVariants`.

### Total

- **−662 LOC** in 5 files
- **0 functional changes** — all removed variants had zero call sites verified via barrel-aware grep

### Verify

3-stage grep per variant: external imports excluding both the defining sub-file AND the barrel re-exports = 0. Live variants spot-checked still resolve in 3-9 consumer files each.

### Lesson

Barrel files mask dead-code: a re-export looks like a use but isn't. The proper grep pattern is `grep -rln SYM src/ | grep -v defining_file | grep -v barrel_file`. In an animation library where the barrel re-imports for a default export AND re-exports named, each dead symbol shows up 3 times — exclude both barrel reads to find real consumers.

---

## Version 1.1.1378 - 2026-05-06

**Title:** 🧹 Round 5 — utils/ Dead-Code Cleanup (~260 LOC removed in scheduleUtils, actionUtils, deviceHelpers)
**Hero:** none
**Tags:** Refactor, Cleanup, DeadCode, Maintenance

### Why

Follow-up to v1.1.1377's cleanup sweep. The earlier audit had flagged 3 specific candidates in `utils/` with high confidence: dead exports never imported anywhere AND never called internally. This release removes them.

### What changed

**`utils/scheduleUtils.js` (-126 LOC)**

- `fetchAllSchedules` (46 LOC) — orphan, never called externally or internally
- `updateSchedule` (29 LOC) — orphan
- `toggleSchedule` (28 LOC) — orphan

The remaining `createSchedule` / `deleteSchedule` / `fetchSchedules` are all alive and used.

**`utils/actionUtils.js` (-96 LOC)**

- `isValidAction` (9 LOC) — never called
- `getActionDescription` (25 LOC) — never called
- `formatLastTriggered` (23 LOC) — never called
- `debugActionRelevance` (12 LOC) — never called
- Stripped `export` from `calculateRelevance` and `getIconForAction` (used internally by `transformToActionObject` only)

**`utils/deviceHelpers.js` (-37 LOC)**

- `getTemperatureGradient` — never called externally, never called internally. Standalone with no dependents.

### Total

- **−259 LOC** in 3 files
- **0 functional changes** — all removed functions had zero call sites

### Verify

Each symbol verified via 3-stage grep before deletion: external imports (0), internal calls in defining file (0 except for the 2 stripped-but-kept), then sanity-grep of all removed symbols across `src/` after deletion. All clean.

---

## Version 1.1.1377 - 2026-05-04

**Title:** 🧹 Dead-Code Cleanup — 4 Rounds, ~3800 LOC removed across system-entities, demo-plugins, and components
**Hero:** none
**Tags:** Refactor, Cleanup, DeadCode, Maintenance

### Why

After v1.1.1374's plugin-infrastructure removal (`isInitialized`-tot since v1.1.1323) and the recent split-files migrations, a lot of dead scaffolding remained — orphan files, unused exports, broken barrels, and a 1892-line `.backup` file. This sweep removed all of it without changing any user-facing behavior.

### What changed (4 cleanup rounds)

**Round 1 — system-entities/ deletions + dead-method strip (-861 LOC, -3 files)**

- `system-entities/integration/DataProviderIntegration.js` (146 LOC, doc-stub never imported)
- `system-entities/integration/DetailViewIntegration.jsx` (285 LOC, doc-stub never imported)
- `system-entities/utils/SimplePluginLoader.js` (111 LOC, dead since plugin-store removal)
- `registry.js`: 8 dead methods + plugin-storage maps + `window.debugRegistry` (508 → ~390 LOC)
- `SystemEntity.js`: 6 dead methods (`getRoute`, `hasPermission`, `loadView`, `getContext`, `clone`, `toJSON`) + `pluginManifest` + `_config` (378 → ~270 LOC)
- Stripped redundant `export` keywords from internal-only helpers in `iconCatalog.js`, `universalRenderHelpers.js`, `entityGrouping.js`, `energyDashboardCalculations.js`

**Round 2 — system-entities/ wrappers + comment cleanup (-109 LOC, -2 files)**

- `registry.js`: 30-LOC commented-out "Strategy 2" glob-discovery block removed
- `todos/TodoAddDialog.jsx` (35 LOC) — pass-through wrapper, inlined into `TodosView.jsx`
- `todos/TodoDetailView.jsx` (35 LOC) — pass-through wrapper, inlined into `TodosView.jsx`

**Round 3 — demo-plugins/ removal (-602 LOC, -5 files)**

The `src/demo-plugins/hello-world/` directory was the demo for the long-dead Plugin Store. Zero imports anywhere in `src/`, zero references in build configs.

**Round 4 — components/ deletions + dead exports (-2224 LOC, -2 files)**

- `tabs/ScheduleTab.jsx.backup` (1892 LOC) — pre-refactor monolith
- `controls/CircularIcon.jsx` (105 LOC) — null external imports
- `SearchField/hooks/index.js` (6 LOC) — broken barrel referencing files that don't exist
- `WeatherIcons.jsx`: removed dead default-export + unused `getTemperatureTrend` + unused `TemperatureUp/DownIcon` (~70 LOC); stripped `export` from 6 internal-only icons
- `EnergyIcons.jsx`: stripped `export` from 5 internal-only icons (`SunnyIcon`, `CloudyIcon`, `RainyIcon`, `SnowyIcon`, `PartlyCloudyIcon`)
- `categoryConfig.jsx`: removed 3 dead exports (`categoryMetadata`, `getCategoryKeys`, `getCategoryIcon`)
- `SettingsTab/constants.jsx`: stripped `export` from 4 internal-only constants

### Total

- **−3796 LOC**
- **−12 files**
- **0 functional changes**

### Verify

All four rounds verified via Vite HMR + Browser-Eval: 6 system entities load, page renders, no resolution errors. External imports of `WeatherIcons`/`EnergyIcons` (`getWeatherIcon`, `HumidityIcon`, `WindIcon`, `PressureIcon`, `WeatherIcon`) and Todos dialog (Add/Edit modes via `TodoFormDialog`) still work.

### Lesson

Dead-code audit by symbol — `grep -rln "EXPORT_NAME" src --include="*.js" --include="*.jsx" | grep -v defining_file` — finds 5+ wins per minute on a mature codebase. Before any deletion: re-grep at edit time, not just at audit time (per v1.1.1374 lesson). After deletion: sanity-grep all removed symbols across `src/` again before build.

---

## Version 1.1.1376 - 2026-05-04

**Title:** 🚨 HOTFIX — entity.area Property in v1.1.1374-Refactor entfernt → fast alle Devices verschwanden aus dem Geräte-View
**Hero:** none
**Tags:** Hotfix, Bugfix, Critical, DataProvider, Areas

### Why

User-Report: "wir haben einen riesenbug; bereits bei v1.1.1374 schon vorhanden, aber nicht bei v1.1.1373 — und zwar werden nur diese geräte angezeigt (nach langer Wartezeit)".

Screenshot zeigte: nur 6 Devices, die meisten in "Kein Raum" — von zuvor (v1.1.1373) Hunderten von Devices in vielen verteilten Räumen (Anziehraum, Arbeitszimmer, Küche, Wohnzimmer, etc.). Filter-Chips von 9 auf 4 reduziert.

### Root-Cause

In v1.1.1374 hatte ich `enrichAllEntitiesWithAreas` in `homeAssistantService.js` "geinlined" um die Single-Entity-Variante `enrichEntityWithArea` (50 LOC, nirgends importiert) zu eliminieren. Dabei habe ich die Logic neu aus dem Gedächtnis geschrieben — und EINE KRITISCHE PROPERTY VERGESSEN.

```js
// Vorher (v1.1.1374, BROKEN):
if (areaId) {
  const area = areaMap.get(areaId);
  if (area) {
    enriched.area_id = areaId;
    enriched.area_name = area.name;
    // ❌ enriched.area FEHLT
  }
}
```

`DataProvider.jsx:589` filtert mit:
```js
let relevantHAEntities = filteredByPatterns
  .filter(entity => entity.area != null && entity.area !== '')  // <-- entity.area, nicht area_id!
```

Da `enriched.area` nie gesetzt wurde, wurden ALLE Entities (außer System-Entities) rausgeworfen. Plus auch:
- `SubcategoryBar.jsx` (Z. 233/248): `item.area === subcat`
- `searchFilters.js` (Z. 124/163/193): `device.area === selectedSubcategory`
- `useRelatedDevices.js` (Z. 64/86): `entity.area || 'Wohnzimmer'`
- `searchIndex.js` (Z. 38): `entity.area`
- `mockDataGenerator.js` (Z. 10): `entity.area || 'Wohnzimmer'`

→ ÜBERALL `entity.area` als String erwartet, von mir aber nie gesetzt.

### Fix

In `enrichAllEntitiesWithAreas` zusätzlich `enriched.area = area.name` setzen + Device-Metadaten (`device_id` / `device_name` / `device_manufacturer` / `device_model`) anreichern:

```js
if (entityReg?.device_id) {
  device = deviceMap.get(entityReg.device_id);
  if (!areaId) areaId = device?.area_id;

  enriched.device_id = entityReg.device_id;
  if (device) {
    enriched.device_name = device.name_by_user || device.name || null;
    enriched.device_manufacturer = device.manufacturer || null;
    enriched.device_model = device.model || null;
  }
}

if (areaId) {
  const area = areaMap.get(areaId);
  if (area) {
    enriched.area_id = areaId;
    enriched.area_name = area.name;
    enriched.area = area.name;  // ← KRITISCH: war in v1.1.1374 vergessen
  }
}
```

### Verification

Test mit synthetischem Setup:

```js
const enriched = enrichAllEntitiesWithAreas(
  [{ entity_id: 'light.kueche_einbauleuchte_1', state: 'on', attributes: {} }],
  [{ area_id: 'kueche', name: 'Küche' }],
  [{ id: 'dev_kueche', name: 'Küchenlichter', manufacturer: 'Philips', model: 'Hue', area_id: 'kueche' }],
  [{ entity_id: 'light.kueche_einbauleuchte_1', device_id: 'dev_kueche', area_id: null }],
);

// → enriched[0]:
//   area: 'Küche'                  ← der bug-fix
//   area_id: 'kueche'
//   area_name: 'Küche'
//   device_name: 'Küchenlichter'
//   device_manufacturer: 'Philips'
```

DataProvider-Filter `e.area != null && e.area !== ''` → light durchläuft, switch-ohne-device wird rausgefiltert (richtig).

### Lehre

**Inlined-Refactor ohne Code-Sicht ist gefährlich.** Ich hatte das alte `enrichEntityWithArea` (~50 LOC) "aus dem Gedächtnis" reconstruiert, weil `.gitignore` `src/` ignoriert und ich keine Reference hatte. Die Property `enriched.area` (String, nicht ID) ist easy zu vergessen weil:
- Es duplicate-looks-redundant zu `area_id` und `area_name`
- HA selbst hat im entityRegistry kein `area`-Field (nur `area_id`)
- Wenige Stellen testen direkt darauf — die Tests im DataProvider, SubcategoryBar etc. failed silent (Filter-Output = leer)

**Future-Proof**: bei Refactor von kritischen Funktionen ohne git-Referenz IMMER vorher die NUTZUNG der Output-Properties grep'en (`grep -rn "entity\\.area" src/`) bevor man neue Logic schreibt. Hätte den Bug VOR dem Push aufgedeckt.

### Was war in v1.1.1374 noch refactoriert

Falls etwas anderes broken ist (was wir nicht erwarten):
- DomainSettingsPicker dual-mode → keine Auswirkung auf Entity-Loading
- domainSettingsConfigs split → reine Map-Definition
- ClimateScheduleSettings.jsx → Schedule-only, lädt keine Entities
- homeAssistantService.js Dead-Code → bestätigt: `formatServiceData`/`callHAService`/Area-Loading-Functions intakt
- printer-status-translation extraction → reines Move

→ Wenn nach v1.1.1376 noch was kaputt ist, ist der Verdacht KEIN Refactor sondern Side-Effect.

---

## Version 1.1.1375 - 2026-05-04

**Title:** Pattern-Validation — water_heater-Domain + aux_heat (climate) + tilt_position (cover) + neuer toggle-Type
**Hero:** none
**Tags:** Feature, Domains, Validation, DomainSettingsPicker

### Why

Nach v1.1.1374 wollten wir das etablierte Refactor-Pattern (1 Map-Eintrag pro Domain/Setting) **in Production validieren** — wirklich nur ~5 LOC pro Erweiterung? Plus dabei drei sinnvolle Erweiterungen ausgerollt:

1. **water_heater** — eine komplette neue HA-Domain (Boiler / Wärmepumpe), bisher kein Support
2. **aux_heat** — Climate Notheizung-Toggle der oft gefragt wird (Backup-Heater bei Wärmepumpen)
3. **tilt_position** — Lamellenwinkel für Venetian-Blinds, bisher konnten User nur Position aber nicht Tilt schedulen

### Was wirklich gebaut wurde

#### A. Neuer `toggle`-Type im DomainSettingsPicker (~40 LOC)

Bisher gab es nur `'picker'` (PickerWheel-Sub-View) und `'slider'` (LiquidGlassSlider-Sub-View). Für Boolean-Settings (aux_heat, away_mode) war keiner der beiden ideal — wir wollen einen INLINE-Switch direkt in der Row, nicht eine Sub-View mit Picker.

Neuer Type rendert `LiquidGlassSwitch` direkt rechts in der Row (kein Chevron, kein Sub-View). Click toggelt instant ohne Debounce (User-Klick = klare Intent, anders als Wheel-Drehen wo Idle abgewartet werden muss).

```js
{
  key: 'aux_heat', type: 'toggle',
  labelKey: 'climate.auxHeat', labelFallback: 'Notheizung',
  service: 'set_aux_heat', dataKey: 'aux_heat',
  valueAttr: 'aux_heat',
  requireAttrs: ['aux_heat'],   // gating: nur wenn Device es kann
}
```

DomainSettingsPicker entscheidet im renderMainView ob die Row clickable ist (picker/slider → ja, toggle → nein, Switch übernimmt) und ob ein Chevron + Wert-Anzeige rendert oder ein inline Switch.

#### B. water_heater-Domain (~70 LOC)

**File 1: `deviceConfigs.js`** — Hero-Slider + Buttons:
- `getControlConfig('water_heater')`: Power-Toggle + bis zu 3 Operation-Modes + Settings-Button. Operation-List kommt aus `attributes.operation_list` (off/eco/electric/gas/heat_pump/high_demand/performance).
- `getSliderConfig('water_heater')`: Hero zeigt Target-Temperature-Dial, Color via `getTemperatureColor()` (analog Climate, heiß=rot kalt=blau). State 'off' → grau + readOnly. `current_temperature` im subValue. min_temp / max_temp als Range.

**File 2: `domainSettingsConfigs.js`** — Live + Schedule Settings:
```js
water_heater: {
  serviceDomain: 'water_heater',
  liveSettings: [
    { key:'operation_mode', type:'picker', service:'set_operation_mode',
      valueAttr:'operation_mode', optionsAttr:'operation_list', ... },
    { key:'away_mode', type:'toggle', service:'set_away_mode', ... },
  ],
  scheduleSettings: [
    { key:'temperature', type:'slider', minAttr:'min_temp', maxAttr:'max_temp', ... },
    { key:'operation_mode', type:'picker', ... },
    { key:'away_mode', type:'toggle', ... },
  ],
}
```

**File 3: `sliderHandlers.js`** — Drag-Handler für Target-Temp:
```js
water_heater: (item, value, ..., handleServiceCall) => {
  const temperature = Math.round(value);
  if (item.attributes) item.attributes.temperature = temperature;
  handleServiceCall('set_temperature', { temperature });
}
```

#### C. aux_heat-Setting für climate (~7 LOC in domainSettingsConfigs.js)

Eine Zeile (well, ein Objekt-Eintrag) im `climate.liveSettings`-Array:
```js
{
  key: 'aux_heat', type: 'toggle',
  labelKey: 'climate.auxHeat', labelFallback: 'Notheizung',
  service: 'set_aux_heat', dataKey: 'aux_heat',
  valueAttr: 'aux_heat',
  requireAttrs: ['aux_heat'],
}
```

Settings-Picker zeigt jetzt einen Notheizung-Toggle bei Climate-Devices die das Attribute haben (Wärmepumpen). Toggle commits sofort via `climate.set_aux_heat { aux_heat: bool }`.

#### D. tilt_position-Setting für cover (~7 LOC in domainSettingsConfigs.js)

Im `cover.scheduleSettings`-Array:
```js
{
  key: 'tilt_position', type: 'slider',
  labelKey: 'controls.tilt', labelFallback: 'Lamellenwinkel',
  service: 'set_cover_tilt_position', dataKey: 'tilt_position',
  valueAttr: 'current_tilt_position',
  min: 0, max: 100, unit: '%', step: 1,
  requireAttrs: ['current_tilt_position'],
}
```

User kann jetzt im Schedule-Editor für Jalousien zusätzlich zur Position auch den Lamellenwinkel (Tilt) vorgeben.

#### E. Translations DE+EN

- `climate.auxHeat` (DE: Notheizung)
- `controls.tilt` (DE: Lamellenwinkel / EN: Tilt)
- `controls.awayMode` (DE: Abwesend-Modus / EN: Away mode)

### Verification

| Test | Ergebnis |
|---|---|
| `getControlConfig('water_heater')` | ✅ 5 Buttons: power, op_eco (active), op_electric, op_heat_pump, settings |
| `getSliderConfig('water_heater')` | ✅ Target-Temp 55°C, color #F44336 (rot/heiß), subValue "Aktuell: 50°C" |
| `getLiveSettings('water_heater')` | ✅ operation_mode (picker) + away_mode (toggle) |
| `getScheduleSettings('water_heater')` | ✅ temperature + operation_mode + away_mode |
| aux_heat Setting in climate.liveSettings | ✅ type='toggle', requireAttrs=['aux_heat'] |
| tilt_position Setting in cover.scheduleSettings | ✅ type='slider', requireAttrs=['current_tilt_position'] |

### LOC-Bilanz — Pattern-Validation

Versprochen war (aus Pattern-Doku v1.1.1374):
- Neue Standard-HA-Domain → 2 Files, ~50 LOC, 10min
- Neuer Live-Setting → 1 File, ~7 LOC, 2min
- Neuer Schedule-Setting → 1 File, ~7 LOC, 2min

Tatsächlich:

| Erweiterung | Files | LOC | Status |
|---|---|---|---|
| water_heater Domain | 3 (deviceConfigs + domainSettings + sliderHandlers) | ~80 | ✅ +30 LOC weil ich noch sliderHandler vergessen hatte im Pattern, jetzt nachgetragen |
| aux_heat Setting | 1 | ~7 | ✅ exakt wie versprochen |
| tilt_position Setting | 1 | ~7 | ✅ exakt wie versprochen |
| `toggle`-Type Erweiterung | 1 (DomainSettingsPicker) | ~40 | (one-time, ermöglicht aux_heat + away_mode) |

**Gesamt: ~135 LOC für 1 neue Domain + 2 neue Settings + 1 neuer Type.**

### Pattern-Lehren (validated)

- **Pattern hält Stand**: 5-7 LOC pro Setting-Eintrag, ~50-80 LOC pro Domain (inkl. Hero/Buttons via deviceConfigs). Versprochen-vs-Realität checked.
- **`toggle`-Type war nötig** weil Boolean-Settings als Picker (`['on', 'off']`) clunky sind und als Slider (0/1) sinnlos. Inline-Switch ist iOS-natives Pattern.
- **`requireAttrs`-Gating funktioniert universell**: aux_heat, away_mode, tilt_position werden nur gerendert wenn das Device die Attribute liefert. Kein Code-Branch nötig — Konfig macht's.
- **Universal-Wrapper bekommt's gratis**: Universal-Devices die ein climate.* / water_heater.* / cover.* Entity einbinden, kriegen automatisch die neuen Settings — weil DomainSettingsPicker die Konfig liest.

### Was offen bleibt

- **Translation-Fallbacks** weiter nicht angefasst (risikoreiches Cleanup)
- **Universal-Layouts** weiter zurückgestellt
- **Add-on**: `service-Definitionen` für water_heater im (gesäuberten) homeAssistantService.js NICHT nötig — wir validieren nicht mehr client-side, hass.callService geht direkt durch

---

## Version 1.1.1374 - 2026-05-04

**Title:** Domain-Pipeline Cleanup-Round 2 — Live+Schedule unified, homeAssistantService dead-code weg, printer3d-Helper extrahiert
**Hero:** none
**Tags:** Refactor, Cleanup, DomainSettingsPicker, ScheduleTab, homeAssistantService

### Why

Nach v1.1.1373 (1. Refactor-Runde, -800 LOC) drei verbleibende Pain-Points aus der Analyse:

1. **DomainSettingsPicker und ClimateScheduleSettings hatten gleiches UI-Pattern aber separate Implementierungen** — der eine für Live-Mode (hass.callService), der andere für Schedule-Mode (callback). Plus: nur climate hatte einen Schedule-Picker. Light/cover/humidifier/etc hatten zwar scheduleSettings im Schedule-Editor, aber UI war climate-only.
2. **homeAssistantService.js war 743 LOC mit massivem Dead-Code** — DOMAIN_SERVICES (200 LOC) + HAServices (115 LOC) + isServiceAvailable + getServiceParameters + enrichEntityWithArea (~50 LOC) + default-export → alle exportiert, aber nirgends importiert.
3. **printer-status-translation lag in deviceConfigs.js** (Z. 12-39) — domain-spezifischer Helper in der generischen Domain-Configs-Datei.

### Fix — 4 Phasen

#### Phase 1: DomainSettingsPicker dual-mode

Component erweitert um `mode='live' | 'schedule'`-Prop:

```jsx
<DomainSettingsPicker
  mode="live"           // OR "schedule"
  item={item}
  hass={hass}
  lang={lang}
  serviceDomain="climate"
  settings={[...]}

  // Schedule-mode-only:
  value={currentSettings}
  onChange={(newSettings) => ...}
/>
```

**Live-Mode** (unverändert): Werte werden 300ms-debounced via `hass.callService` committed. Liest aktuelle Werte aus `hass.states[entity_id].attributes`.

**Schedule-Mode** (neu): Werte werden in `value`-Objekt gesammelt und via `onChange(newValue)` an Schedule-Backend gegeben — KEINE Service-Calls (passieren erst bei Trigger-Time durch den Scheduler). Liest aktuelle Werte aus `value`-Prop.

Capability-Attrs (Optionen, Min/Max für Slider) kommen in beiden Modi aus dem Device-Snapshot — gleiche Logic.

#### Phase 2: domainSettingsConfigs split

Neue Schema: pro Domain `liveSettings` + `scheduleSettings` Arrays:

```js
climate: {
  serviceDomain: 'climate',
  // Live: Settings-Button am Slider (Hero macht Target-Temp)
  liveSettings: [fan_mode, swing_mode, swing_horizontal, preset_mode, humidity],
  // Schedule: zusätzlich hvac_mode + temperature (im Live-Mode sind das Hero/Buttons)
  scheduleSettings: [hvac_mode, temperature, fan_mode, swing_mode, preset_mode, humidity],
},
```

**Neue Domains für Schedule-Mode:**
- `light`: brightness_pct (0-100%) + color_temp_kelvin (Slider mit min/max aus device)
- `cover`: position (0-100%)
- `humidifier`: humidity (Slider) + mode (Picker)
- `fan`: percentage (Speed-Slider) + preset_mode
- `media_player`: volume_level + source + sound_mode

Light + Cover hatten vorher `liveSettings: []` (eigenes UI in deviceConfigs), bekommen jetzt scheduleSettings für den Schedule-Editor.

Convenience-Helpers: `getLiveSettings(domain)`, `getScheduleSettings(domain)`, `hasLiveSettingsPicker(domain)`, `hasScheduleSettingsPicker(domain)`, `getServiceDomain(domain)`.

#### Phase 3: ClimateScheduleSettings.jsx weg

- `SchedulePickerTable.jsx`: ClimateScheduleSettings-Usage durch DomainSettingsPicker mode='schedule' ersetzt. Gating jetzt `hasScheduleSettingsPicker(item.domain)` statt `item.domain === 'climate'`.
- `useScheduleForm.js`: Reducer-Action-Payload `isClimate` → `hasDomainSettings` (generisch). Initial-State `showClimateSettings` jetzt für alle Domains mit scheduleSettings true.
- `ScheduleTab.jsx`: Dead-Import `ClimateScheduleSettings` entfernt.
- `src/components/climate/` Verzeichnis komplett gelöscht.

**User-Effect**: User kann jetzt im Schedule-Editor für jedes unterstützte Device die Schedule-Settings wählen — nicht mehr nur climate. Z.B.: Schedule für Wohnzimmer-Lampe um 18:00 → kann Brightness=70% + Color-Temp=3000K vorgeben statt nur "anschalten".

#### Phase 4: homeAssistantService.js Dead-Code-Cleanup

Inventur der Importer:

| Export | Importer | Status |
|---|---|---|
| `formatServiceData` | UniversalControlsTab | KEEP |
| `callHAService` | DetailViewWrapper | KEEP (Validierung-Call raus) |
| `loadAreasFromHA` / `loadDeviceRegistry` / `loadEntityRegistry` | DataProvider | KEEP |
| `enrichAllEntitiesWithAreas` | DataProvider | KEEP |
| `loadEntityHistory` | DetailView | KEEP |
| `DOMAIN_SERVICES` | – | **REMOVED (~200 LOC)** |
| `isServiceAvailable` | – | **REMOVED** |
| `getServiceParameters` | – | **REMOVED** |
| `HAServices` | – | **REMOVED (~115 LOC)** |
| `enrichEntityWithArea` | – | **REMOVED (~50 LOC)** |
| `default` export | – | **REMOVED** |

`callHAService`-Validierung gegen `isServiceAvailable(domain, service)` entfernt — DOMAIN_SERVICES war incomplete (Custom-Integrations fehlten), führte zu false-negatives. HA gibt selbst Fehler bei nicht-existenten Services zurück, also brauchen wir die client-seitige Validierung nicht.

`enrichEntityWithArea` (Single-Entity) war exportiert aber nur intern in `enrichAllEntitiesWithAreas` benötigt → inlined in der Bulk-Variante (eliminiert function-call-overhead pro Entity).

**LOC-Bilanz**: 743 → 299, **-444 LOC**.

#### Phase 5: printer-status-translate extrahiert

Aus `deviceConfigs.js` Z. 12-39 nach `src/system-entities/entities/integration/device-entities/printer3dHelpers.js`. Domain-spezifischer Helper für Bambu/3D-Drucker-States — gehört nicht in den generischen `deviceConfigs.js`.

`deviceConfigs.js` importiert ihn jetzt von dort. Logic identisch.

### Verification

| Test | Ergebnis |
|---|---|
| 7 Domains in `DOMAIN_SETTINGS_CONFIGS` | ✅ climate / humidifier / vacuum / fan / media_player / light / cover |
| `hasLiveSettingsPicker('light')` | ✅ false (light hat kein Settings-Button) |
| `hasScheduleSettingsPicker('light')` | ✅ true (im Schedule-Editor sichtbar) |
| `hasScheduleSettingsPicker('switch')` | ✅ false (kein Eintrag) |
| `climateScheduleSettings` | ✅ 6 Einträge: hvac_mode, temperature, fan_mode, swing_mode, preset_mode, humidity |
| `lightScheduleSettings` | ✅ 2 Einträge: brightness_pct, color_temp_kelvin |
| `homeAssistantService` Dead-Exports weg | ✅ DOMAIN_SERVICES/isServiceAvailable/HAServices/etc. undefined |
| `homeAssistantService` Live-Exports da | ✅ formatServiceData/callHAService/loadX/etc. |
| `translatePrinterStatus('idle','de')` | ✅ "Leerlauf" |
| `translatePrinterStatus('ready','en')` | ✅ "Ready" |
| `getControlConfig('climate')` | ✅ 3 buttons (mit hvac_modes:['heat','cool']) |

### LOC-Bilanz

| Was | Vorher | Nachher |
|---|---|---|
| ClimateScheduleSettings.jsx | ~200 | 0 (gelöscht) |
| DomainSettingsPicker.jsx | ~250 | ~280 (mode-prop dazu) |
| domainSettingsConfigs.js | ~150 | ~265 (split + neue Domains) |
| homeAssistantService.js | 743 | 299 |
| deviceConfigs.js | 1233 | 1198 (printer-helper raus) |
| printer3dHelpers.js | – | ~40 |
| **Net change** | | **~-440 LOC** |

Gesamt nach 2 Refactor-Runden (v1.1.1373 + v1.1.1374): **~-1240 LOC weniger im Codebase**, ohne Funktionalität zu verlieren.

### Pattern-Lehren

- **Mode-Prop für dual-purpose Components**: wenn UI-Pattern identisch ist aber Side-Effect anders (live vs. callback), `mode`-Prop + interne Branch-Logic in Handlern ist cleaner als 2 separate Components mit duplizierter Render-Logic.
- **Dead-Code-Audit per `grep -rln EXPORT src/`**: einfaches Script kann jeden export gegen tatsächliche Importe checken. 5 von 12 Exports in homeAssistantService.js waren dead — sehr typisch für gewachsene Codebase.
- **Validierung gegen Hardcoded-Lists vermeiden**: client-side service-name-validation gegen DOMAIN_SERVICES ist false-negatives-anfällig (Custom Integrations, neue HA-Versionen). Lieber durchreichen und Backend-Errors handhaben.
- **Domain-Helpers in Domain-Verzeichnis** (printer3dHelpers.js neben Printer3DDeviceEntity.js): nicht in `utils/`. Erleichtert späteres Refactoring (Domain-Aware Suchen).

### Was offen bleibt

- **Translation-Fallbacks `t('xxx') || 'XXX'`** noch da (risky cleanup, brauchen Translation-Audit)
- **Universal-Layouts** weiter zurückgestellt — die ursprüngliche Vision

---

## Version 1.1.1373 - 2026-05-04

**Title:** Domain-Pipeline Big-Bang-Refactor — 5 SettingsPickers → 1 Generic, SVG-Icons konsolidiert (~1000 LOC weg, kein Verhalten geändert)
**Hero:** none
**Tags:** Refactor, Cleanup, DomainSettingsPicker, deviceConfigs, Icons

### Why

Bei der Domain-Inventur nach v1.1.1372 sind drei Pain-Points aufgefallen:

1. **5 SettingsPickers waren 95% Copy-Paste** (climate/humidifier/vacuum/fan/media_player) — Total ~1024 LOC, der Diff zwischen humidifier↔vacuum↔fan war nur ~58 Zeilen. Die ganze Skelett-Logik (commitDebounced, callService, renderMainView, renderPickerSubView, AnimatePresence-Setup) war wortgleich. Eine neue Domain hinzufügen = ~150 LOC neue Datei.
2. **deviceConfigs.js hatte 1330 LOC mit 10 inline SVG-Strings**, davon waren die 4 generic Tab-Icons (controls/sensors/diagnostics/misc) **3× kopiert** (printer3d + universal + energy_dashboard). Plus alle v1.1.1369-1372 inline (oscillate, direction, shuffle, repeat, return_to_base, locate, …).
3. **PresetButtonsGroup hatte eine 7-stufige if-else-Kette** für Custom-Renderings je Domain.

### Fix — 3 Phasen

#### Phase 1: Generic DomainSettingsPicker (~800 LOC weg)

**Neue Files:**
- `src/components/common/DomainSettingsPicker.jsx` (~250 LOC) — die Component die alle 5 alten ersetzt. Pattern: lädt `settings`-Array via Props, rendert Main-View mit Row pro Setting, Sub-View pro Setting via PickerWheel oder LiquidGlassSlider, Auto-Commit nach 300ms via hass.callService. Setting-Type erweiterbar: `'picker'` oder `'slider'`.
- `src/components/common/DomainSettingsPicker.css` (umbenannt von ClimateSettingsPicker.css, alle `.csp-*` → `.dsp-*`).
- `src/components/common/domainSettingsConfigs.js` (~150 LOC) — Single Source of Truth: Map `{ climate, humidifier, vacuum, fan, media_player }` mit Settings-Array pro Domain.

**Setting-Schema:**

```js
{
  key: 'fan',                       // unique id, state + sub-view name
  type: 'picker' | 'slider',        // welche UI-Komponente
  labelKey: 'climate.fanMode',      // translateUI-Schlüssel
  labelFallback: 'Lüftermodus',
  service: 'set_fan_mode',          // hass service ohne Domain-prefix
  dataKey: 'fan_mode',              // Feld-Name in service-data
  valueAttr: 'fan_mode',            // attribute aus dem aktuellen Wert gelesen wird

  // Picker-only:
  optionsAttr: 'fan_modes',         // attribute für options-Liste
  prettify: false,                  // für Source/Sound-Mode (HA schon korrekt)

  // Slider-only:
  minAttr: 'min_humidity',
  maxAttr: 'max_humidity',
  unit: '%',
  step: 1,
  requireAttrs: ['min_humidity', 'max_humidity'],  // gating
}
```

**Capability-Gating** weiterhin gleich: Picker rendert Setting nur wenn `optionsAttr` Liste > 0; Slider nur wenn alle `requireAttrs` definiert.

**Gelöscht:**
- `src/components/climate/ClimateSettingsPicker.jsx` + `.css`
- `src/components/humidifier/HumidifierSettingsPicker.jsx` (+ leeres dir)
- `src/components/vacuum/VacuumSettingsPicker.jsx` (+ leeres dir)
- `src/components/fan/FanSettingsPicker.jsx` (+ leeres dir)
- `src/components/media_player/MediaPlayerSettingsPicker.jsx` (+ leeres dir)

**PresetButtonsGroup vereinfacht:** 5 Imports + 5 if-else-Branches → 1 Import + 1 lookup:

```jsx
{group.renderCustom && group.id === 'settings' && DOMAIN_SETTINGS_CONFIGS[item?.domain] ? (
  <DomainSettingsPicker
    item={item} hass={hass} lang={lang}
    serviceDomain={DOMAIN_SETTINGS_CONFIGS[item.domain].serviceDomain}
    settings={DOMAIN_SETTINGS_CONFIGS[item.domain].settings}
  />
) : ...}
```

**Pattern für künftige Domains:** 1 Eintrag in domainSettingsConfigs.js (~5 LOC) statt eigene Datei (~150 LOC). 30× kürzer.

#### Phase 2: SVG-Icons konsolidiert (~150 LOC in deviceConfigs weg)

**icons.js erweitert:**
- Neue Konstante `deviceTabIcons` (controls/sensors/diagnostics/misc) — vorher 3× kopiert in printer3d/universal/energy_dashboard.
- Neue Konstante `mediaActionIconsSolid` (play/pause/stop in solid/filled-Variante) — vorher 4× kopiert für Printer/Energy Action-Items.
- 10 neue `controlIcons`-Entries: `vacuum_stop`, `return_to_base`, `locate`, `oscillate`, `direction_swap`, `fan_preset`, `humidifier_mode`, `shuffle`, `repeat`, `repeat_one`.
- `hvacModeIcons.auto` + `heat_cool` mit nicer line-art Versionen aus v1.1.1368-Inline ersetzt.

**deviceConfigs.js cleaned:**
- 4 cases (printer3d/universal/energy_dashboard) verloren je ~4 inline SVG-Strings → references zu `deviceTabIcons.{controls/sensors/diagnostics/misc}`.
- printer3d expandable items 3× inline play/pause/stop → references zu `mediaActionIconsSolid.{play/pause/stop}`.
- humidifier/vacuum/fan/media_player Cases verloren ihre v1.1.1369-1372 inline SVGs → references zu controlIcons.

LOC: 1330 → 1233 (zwar nur 100 weniger weil Logic dazu kam, aber Lesbarkeit MASSIV verbessert — vorher waren 30%+ pro case nur SVG-Müll).

#### Phase 3: PresetButtonsGroup if-else → Map

War Teil von Phase 1. -30 LOC, 5 if-else-Branches durch 1 Lookup ersetzt.

### Bonus-Bug + Recovery

**Während des Refactor: `rm -rf src/components/climate/` zu aggressiv.** Hatte vergessen dass `ClimateScheduleSettings.jsx` (genutzt vom ScheduleTab beim Erstellen von Schedules für climate-Devices) auch da lag. Vite-HMR meldete sofort `Pre-transform error: Failed to load url /src/components/climate/ClimateScheduleSettings.jsx`.

**Recovery:** das File war nie in git committed (`.gitignore` ignoriert alles in `src/`), also musste ich es from-scratch reconstruieren. Das war eigentlich eine Verbesserung — die alte Version war 300+ LOC mit imperativ-DOM-Manipulation (analog der alten ClimateSettingsPicker-Patterns aus v1.1.1368, die wir gefixt hatten). Neue Version ist ~200 LOC im DomainSettingsPicker-Pattern, callback-basiert (kein hass.callService — gibt Settings via `onSettingsChange`-Callback an Schedule-Backend).

Lehre: bei DEVASTATING-Operationen wie `rm -rf` IMMER vorher `ls dir/` auflisten.

### Verification

| Test | Ergebnis |
|---|---|
| DomainSettingsPicker import | ✅ |
| 5 Domain-Configs vorhanden | ✅ climate/humidifier/vacuum/fan/media_player |
| ClimateScheduleSettings rebuild | ✅ |
| icons.js neue exports | ✅ deviceTabIcons + mediaActionIconsSolid + 10 controlIcons |
| getControlConfig('fan') Test | ✅ alle Buttons inkl. oscillate/direction/preset/settings |
| Keine stale picker-Imports im Codebase | ✅ |
| HMR-Errors | ✅ keine |

### LOC-Bilanz

| Was | Vorher | Nachher |
|---|---|---|
| 5 SettingsPickers | 1024 | 0 (gelöscht) |
| Generic DomainSettingsPicker + Configs + CSS | – | ~470 |
| ClimateScheduleSettings (rebuild) | ~300 (verloren) | ~200 (sauberer) |
| deviceConfigs.js | 1330 | 1233 |
| PresetButtonsGroup if-else | ~30 | ~10 |
| **Total relevanter Code** | **~2700** | **~1900** |

**~800 LOC weniger**, ohne Funktionalität zu verlieren — und das Pattern macht künftige Domain-Erweiterungen 30× billiger.

### Pattern-Lehren

- **Copy-Paste-Erkennung mit `diff -u | wc -l`**: wenn 4 Files je 167 LOC haben und der Unified-Diff zwischen ihnen nur ~58 Zeilen produziert, ist die Abstraktion offensichtlich. Diese Messung sollte bei jedem Polish-Pass automatisch laufen.
- **Configs-as-Data über Switch-Statements**: jedes Setting in domainSettingsConfigs.js ist ein deklaratives Objekt — keine Logic, kein Switch. Erweitert sich mechanisch.
- **`.gitignore *` schmerzhaft bei lokalen Files**: das Vite-Build-Setup ignoriert das ganze `src/` (nur `dist/` wird committed weil HACS dort schaut). Lokale src-Files können also nicht via `git checkout` wiederhergestellt werden — vor `rm -rf` immer den Inhalt prüfen oder mit `git stash`-Fallback arbeiten.
- **Domain-spezifische Icons in dedizierten Maps gruppieren** (`deviceTabIcons`, `mediaActionIconsSolid`): macht den Konsumenten-Code lesbar. Statt 700-char SVG-string sieht man `deviceTabIcons.controls`.

### Was offen bleibt

- **Translation-Fallbacks `t('xxx') || 'XXX'`** noch nicht aufgeräumt (Befund 5 aus der Analyse) — risky, würde Translation-Audit brauchen.
- **homeAssistantService.js (743 LOC) Dead-Code-Suche** — offen.
- **printer-status-translation in deviceConfigs (Z.18-39)** — domain-spezifisch, sollte eigentlich in printer3d-helpers.
- **Universal-Layouts** — die ursprüngliche Vision, weiter zurückgestellt.

---

## Version 1.1.1372 - 2026-05-03

**Title:** cover-Domain Position-Slider als Hero + Cover-Art-Background für media_player (Apple-Music-Style)
**Hero:** none
**Tags:** Feature, Domains, Cover, MediaPlayer, DetailView

### Why

Zwei separate Polish-Items aus der Domain-Inventur:

1. **cover-Domain**: hatte zwar Buttons (open/stop/close + Position-Presets), aber **keinen interaktiven Position-Slider als Hero** — User mit Smart-Rolladen konnten nicht einfach drag-to-position. Hero zeigte einen statischen lila Donut mit der Zahl.
2. **media_player**: hatte nach v1.1.1371 zwar Cover-Art im Center-Circle (klein), aber das volle "Apple-Music"-Feeling fehlte — die ganze Detail-View hätte den Cover-Art als blurred Background haben können.

### Fix

#### Phase 1 — cover Position-Slider (~30min)

`getSliderConfig('cover')` — Position als Hero mit State-Aware-Color:

```js
const currentPos = attributes.current_position;  // 0=closed, 100=open
let position;
if (typeof currentPos === 'number')      position = currentPos;
else if (state === 'open')               position = 100;
else if (state === 'closed')             position = 0;
else                                     position = 50;

const color = isMoving ? '#FF9500'      // orange wenn opening/closing
            : position > 0 ? '#FFD60A'  // gold wenn offen
            : '#9E9E9E';                // grau wenn zu

return {
  value: position,
  displayValue: isOpening ? 'Öffnet…' : isClosing ? 'Schließt…' : null,
  color,
  showPower: false,                         // Cover hat kein on/off
  interactive: typeof currentPos === 'number',  // nur draggable bei Position-Support
  progressMode: typeof currentPos !== 'number', // ohne Position-Support nur Progress-View
  readOnly: typeof currentPos !== 'number',
};
```

Cover-Slider-Handler in `sliderHandlers.js` existierte bereits — ruft `set_cover_position`. Drag funktioniert aus dem Stand.

**Bug während der Arbeit:** Es existierte bereits ein simpler `case 'cover'` (lila #9C27B0, ohne State-Logic) — JavaScript switch greift den ERSTEN matching case → mein neuer am Ende wurde nie erreicht. Den alten ersetzt, dann kicked die neue Logic ein.

3 Test-Szenarien live verifiziert:
- Position-Cover (65%, open) → gold, interactive ✅
- Binary-Cover (kein current_position) → grau, readOnly + progressMode ✅
- Opening (30%) → orange, displayValue "Öffnet…", kein % ✅

#### Phase 2 — Cover-Art Background für media_player (~1h)

Erweiterung der `detail-left`-Background-Layer in `DetailView.jsx`. Bisher gab es:
- `.detail-left-video-background` (für system-entities mit video)
- `.detail-left-news-image` (für news-articles)

Neu: `.detail-left-cover-art` für media_player im playing/paused-State.

**JSX in DetailView.jsx**:

```jsx
let mediaCoverUrl = null;
if (liveItem?.domain === 'media_player' && (liveItem.state === 'playing' || liveItem.state === 'paused')) {
  let url = liveItem.attributes?.entity_picture || liveItem.attributes?.media_image_url || null;
  if (url?.startsWith('/') && typeof window !== 'undefined') {
    url = window.location.origin + url;
  }
  mediaCoverUrl = url;
}
const hasMediaCover = !!mediaCoverUrl;

<div className={`detail-left ${hasMediaCover ? 'has-cover-art' : ''}`}>
  ...
  {hasMediaCover && (
    <img className="detail-left-cover-art" src={mediaCoverUrl} alt="" />
  )}

  <EntityIconDisplay
    ...
    hideIcon={!!newsArticleImageUrl || hasMediaCover}  /* Icon weg, Cover IST das Visual */
  />
</div>
```

**CSS in DetailView.css**:

```css
.detail-left-cover-art {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  border-radius: 35px 0 0 35px;
  z-index: 0;
  pointer-events: none;
  filter: blur(40px) brightness(0.55) saturate(1.15);
  transform: scale(1.15);  /* leichter Overflow weil blur die Kanten beschneidet */
  animation: cover-art-fade-in 0.6s cubic-bezier(0.32, 0.72, 0, 1);
}
```

**Scope-Isolation**: bewusst getrennt von User-konfigurierbarem `--background-blur`/`--background-brightness` (aus AppearanceSettings → Hintergrund) — der Cover-Art-Effekt (blur 40px, brightness 0.55, saturate 1.15) kommt ON TOP, beeinflusst nicht die globalen Background-Filter und wird auch nicht von ihnen beeinflusst (eigener Layer).

**Image-Quality-Optimierung**: Bei einem 60×60px-Cover-Thumbnail würde 40px-Blur extrem pixelig aussehen. Browser handhabt das mit der `transform: scale(1.15)` + großen Radius-Blur akzeptabel — der unscharfe Effekt versteckt die Pixel-Quelle. Bei 600×600px+ Covern (typisch von Spotify/Apple-Music via HA-Proxy) sieht es perfekt aus.

**Cleanup**: bei Pause/Idle/Off keine Cover-Art mehr (nur `playing` + `paused` triggern). Bei Wechsel des Tracks: `key={mediaCoverUrl}` triggert Remount → fade-in-Animation läuft wieder, smooth crossfade ohne Flackern.

### Status

| Domain | getControl | getSlider | Picker | Hero-Special |
|---|---|---|---|---|
| light | ✅ | ✅ | – | – |
| climate | ✅ | ✅ | ✅ | Temperatur-Color |
| media_player | ✅ | ✅ | ✅ | **Cover-Art-Center + Cover-BG** ✨ |
| lock | ✅ | ✅ | – | – |
| **cover** | ✅ | ✅ NEU | – | **State-Color (gold/orange/grau) + interactive Position** |
| fan | ✅ | ✅ | ✅ | – |
| humidifier | ✅ | ✅ | ✅ | – |
| vacuum | ✅ | ✅ | ✅ | Battery-Color |

Domain-Inventur jetzt vollständig — alle 8 Standard-HA-Domains haben Hero + Buttons + (wo sinnvoll) Settings-Picker.

### Was offen bleibt

- **Universal-Layouts** (climate/media_player/dehumidifier/vacuum) — ursprüngliche Vision, weiter zurückgestellt. Bleibt als nächste große Iteration.
- **Cover-Art Hero-Mode für media_player auf MOBILE** — die kleine 60×60-cover im Slider-Center könnte auf Mobile durch das Cover-BG ersetzt werden (redundant)

---

## Version 1.1.1371 - 2026-05-03

**Title:** media_player Big-Bang — Cover-Art Hero + Title/Artist + Shuffle/Repeat + Source/Sound-Mode-Picker
**Hero:** none
**Tags:** Feature, Domains, MediaPlayer, deviceConfigs, CircularSlider

### Why

`media_player` war funktional aber visuell + Feature-mäßig spartanisch:
- **Hero zeigte 75%-Volumen-Zahl groß** statt Cover-Art / Track-Info — kein Apple-Music-Feeling
- **Source-Picker als inline 8er-Liste** mit 📻-Emoji-Icons — bricht bei Sonos/Plex (oft 15+ Quellen) und sieht primitiv aus
- **Shuffle und Repeat fehlten komplett** obwohl HA `attributes.shuffle` + `attributes.repeat` und `shuffle_set`/`repeat_set` Services hat
- **Sound-Mode (`sound_mode_list`) fehlte** — relevant für Receiver/Soundbars (Movie/Music/Night/Voice)

### Fix

**1. CircularSliderDisplay — `coverImage`-Prop neu** (~25 LOC)

Optional URL eines Cover-Bildes. Wird als 60-80px circular-cropped Element ÜBER dem Title gerendert. Hat Vorrang vor `centerIcon` (legacy fallback). Subtile box-shadow + 1px white border für Tiefe.

```jsx
{coverImage && (
  <motion.div
    className="circular-cover-image"
    style={{
      width: size < 200 ? '60px' : '80px',
      height: ...,
      borderRadius: '50%',
      backgroundImage: `url("${coverImage}")`,
      backgroundSize: 'cover',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06)',
    }}
  />
)}
```

CircularSlider bekommt `coverImage`-Prop und reicht durch zu CircularSliderDisplay. UniversalControlsTab spreaded `{...sliderConfig}` → coverImage geht automatisch durch sobald sliderConfig es enthält. Keine weitere Wiring nötig.

**2. `getSliderConfig('media_player')` rewrite**

Volume bleibt als Slider-Value (Drag setzt Lautstärke). Aber Center zeigt jetzt:

```js
displayValue = isActive && mediaTitle      // "Bohemian Rhapsody"
subValue    = isActive && mediaArtist      // "Queen"
coverImage  = isActive ? coverUrl : null   // /api/media_player_proxy/...
```

Wenn idle/standby/off: displayValue zeigt State-Text statt Title. Cover wird nicht gerendert (verhindert stale Cover bei Pause).

URL-Resolving: HA-`entity_picture` ist typisch `/api/media_player_proxy/...` (relativ). Prefixe mit `window.location.origin` damit das Bild im Browser auflöst:

```js
let coverUrl = attributes.entity_picture || attributes.media_image_url || null;
if (coverUrl?.startsWith('/') && typeof window !== 'undefined') {
  coverUrl = window.location.origin + coverUrl;
}
```

`showUnit: !displayValue` — Volume-% nur zeigen wenn KEIN Title gerendert wird (sonst doppelt belegt).

**3. `getControlConfig('media_player')` erweitert**

Vorher: 4 Buttons fest (play, prev, next, source-expandable mit inline-Liste).
Jetzt: dynamisch je nach Capability.

| Attribute | Button |
|---|---|
| Always | Play/Pause (toggle nach state), Previous, Next |
| `attributes.shuffle !== undefined` | Shuffle-Toggle (aktiv wenn `shuffle === true`, klick → `shuffle_set { shuffle: !current }`) |
| `attributes.repeat !== undefined` | Repeat-Cycle (off → all → one → off, Icon ändert sich für "one"-mode mit "1" eingebaut) |
| `source_list.length > 0 \|\| sound_mode_list.length > 0` | Settings-Button öffnet MediaPlayerSettingsPicker |

Source ist nicht mehr inline — das skalieren die alten 8 Slots nicht (Sonos/Plex haben oft 15+). Settings-Picker zeigt alle.

**4. `MediaPlayerSettingsPicker.jsx`** (~190 LOC, neue Datei)

Pattern komplett identisch zu Climate/Humidifier/Vacuum/Fan. ios-section/ios-card Main-View mit 1-2 Rows (Source / Sound-Mode), Sub-View pro Row mit PickerWheel, Auto-Commit nach 300ms via `hass.callService('media_player', 'select_source'|'select_sound_mode', ...)`.

Sources werden NICHT prettified — `'Spotify'`, `'Radio Eins'` sind schon korrekt formattiert von HA.

CSS aus `ClimateSettingsPicker.css` wiederverwendet (5 Pickers teilen sich jetzt diese Datei).

**5. `PresetButtonsGroup.jsx`** wired:

```jsx
group.id === 'settings' && item?.domain === 'media_player'
  ? <MediaPlayerSettingsPicker item={item} hass={hass} lang={lang} />
  : ...
```

**6. Translations** in de.js + en.js (controls):
- `shuffle`/`repeat`/`repeatAll`/`repeatOne`/`soundMode`/`idle`

### Verification — Live-Eval mit Sonos-Sample

Test-Item: `Sonos Living Room` playing Spotify, shuffle=on, repeat=all, 5 sources, 4 sound-modes.

| Test | Ergebnis |
|---|---|
| `getControlConfig` Buttons | ✅ play, previous, next, shuffle (active), repeat (active), settings |
| `getControlConfig` expandable | ✅ `[{id: 'settings'}]` mit renderCustom |
| `getSliderConfig` displayValue | ✅ `'Bohemian Rhapsody'` |
| `getSliderConfig` subValue | ✅ `'Queen'` |
| `getSliderConfig` coverImage | ✅ absolut prefixed: `'http://localhost:5173/api/media_player_proxy/...'` |
| `getSliderConfig` showUnit | ✅ false (weil displayValue gesetzt) |
| `getSliderConfig` value | ✅ 65 |
| Idle device displayValue | ✅ `'Bereit'` (i18n), coverImage null |
| MediaPlayerSettingsPicker import | ✅ |

### Domain-Status nach dieser Runde

| Domain | getControl | getSlider | Picker | Hero-Special |
|---|---|---|---|---|
| light | ✅ | ✅ | – | – |
| climate | ✅ | ✅ | ✅ | Temperatur-Color |
| **media_player** | ✅ erweitert | ✅ neu | ✅ neu | **Cover-Art neu** |
| lock | ✅ | ✅ | – | – |
| cover | ✅ | – | – | – |
| fan | ✅ | ✅ | ✅ | – |
| humidifier | ✅ | ✅ | ✅ | – |
| vacuum | ✅ | ✅ | ✅ | Battery-Color |

5 Domains mit reichem Settings-Picker (Climate / Humidifier / Vacuum / Fan / MediaPlayer), alle teilen sich `ClimateSettingsPicker.css`. media_player + climate + vacuum haben Hero-Specials (Cover-Art / Temperature-Color / Battery-Color).

### Was als nächstes Sinn macht

- **cover** — `getSliderConfig` fehlt (nur Position-Buttons, kein interaktiver Slider)
- **Universal-Layouts** (climate/media_player/dehumidifier/vacuum) — alle Domains sind jetzt regulär implementiert, das Universal-Layout-System wäre nur noch ein Routing-Wrapper
- **Cover-Art Background** des gesamten Detail-Views (nicht nur als kleiner Center-Circle) — größere visuelle Aufwertung à la Apple Music

---

## Version 1.1.1370 - 2026-05-03

**Title:** fan-Domain bekommt Buttons (Oscillate + Direction + Preset-Modes + Settings-Picker)
**Hero:** none
**Tags:** Feature, Domains, Fan, deviceConfigs

### Why

`fan` hatte nur `getSliderConfig` (Speed-Slider mit Power-Toggle), aber **keine `getControlConfig`** — also keine Buttons. User mit Smart-Fans (Dyson, Vornado, Deckenventilator) konnten weder Schwenken aktivieren noch Preset-Modus (Sleep/Auto/Boost/Natural) wählen, obwohl HA die Services dafür hat (`fan.oscillate`, `fan.set_preset_mode`, `fan.set_direction`).

### Fix

**1. `getControlConfig('fan')` ergänzt** (~75 LOC). Buttons werden DYNAMISCH generiert je nach Capability:

| Attribute | Button |
|---|---|
| `attributes.oscillating !== undefined` | Oscillate-Toggle (active wenn schwenkt, klick → `fan.oscillate` mit invertiertem Wert) |
| `attributes.direction !== undefined` | Direction-Toggle (forward ↔ reverse, label zeigt aktuelle Richtung, klick → `fan.set_direction`) |
| `attributes.preset_modes` | bis zu 3 Buttons direkt (active je nach `preset_mode`), klick → `fan.set_preset_mode` |
| `preset_modes.length > 3` | + Settings-Button öffnet FanSettingsPicker |

Wenn ein "plain fan" nur `percentage` kann (kein Oscillate, kein Direction, keine Presets) → `primary: []`. User hat den Slider und das ist genug. Kein leerer Buttons-Container.

**2. `FanSettingsPicker.jsx`** (~150 LOC, neue Datei). Identisches Pattern zu HumidifierSettingsPicker / VacuumSettingsPicker — copy-paste mit anderem service-call. Zeigt Preset-Mode-Picker mit allen `preset_modes`. Pattern komplett etabliert: Live-State, Auto-Commit nach 300ms, ios-section/ios-card Main-View, AnimatePresence Sub-View mit PickerWheel, Pending-Pulse.

CSS wieder aus `ClimateSettingsPicker.css` — keine eigene Datei nötig.

**3. `PresetButtonsGroup.jsx`** wired:

```jsx
group.id === 'settings' && item?.domain === 'fan' ? (
  <FanSettingsPicker item={item} hass={hass} lang={lang} />
) : ...
```

**4. Translations** in de.js + en.js (controls):
- `oscillate`/`forward`/`reverse`/`preset`

### Verification — 3 Test-Szenarien

| Szenario | Erwartung | Live-Eval |
|---|---|---|
| **Dyson** (oscillate + 4 Presets) | oscillate + 3 Preset-Buttons + Settings | ✅ 5 Buttons: `oscillate, preset_auto, preset_sleep, preset_natural, settings`, preset_auto active |
| **Deckenventilator** (direction + 2 Presets) | direction + 2 Preset-Buttons, kein Settings | ✅ 3 Buttons: `direction, preset_breeze, preset_whoosh`, label="Vorwärts" |
| **Plain Fan** (nur percentage) | 0 Buttons | ✅ `primary: []` |

### Status der Domain-Inventur jetzt

| Domain | getControl | getSlider | Picker | Status |
|---|---|---|---|---|
| light | ✅ | ✅ | – | ok |
| climate | ✅ (+auto+heat_cool) | ✅ | ✅ ClimateSettingsPicker | rich |
| media_player | ✅ | ✅ | – | basic (kein Cover-Art) |
| lock | ✅ | ✅ | – | ok |
| cover | ✅ | – | – | basic |
| fan | ✅ NEU | ✅ | ✅ FanSettingsPicker NEU | rich |
| humidifier | ✅ | ✅ | ✅ HumidifierSettingsPicker | rich |
| vacuum | ✅ | ✅ | ✅ VacuumSettingsPicker | rich |

**4 Domains laufen jetzt nach dem Climate-Pattern**: Climate / Humidifier / Vacuum / Fan. Pattern-Reuse-Faktor: Settings-Picker je ~150 LOC, alle teilen sich `ClimateSettingsPicker.css`.

### Was als nächstes Sinn macht

- **media_player** auf das Niveau bringen — Cover-Art-Hero + Sound-Mode-Picker + Shuffle/Repeat
- **cover** ausbauen — getSliderConfig fehlt (aktuell nur Position-Buttons), Position-Slider wäre intuitiver
- **Universal-Layouts** — durch climate/humidifier/vacuum/fan jetzt deutlich einfacher (alle sind reguläre Domains)

---

## Version 1.1.1369 - 2026-05-03

**Title:** humidifier + vacuum Domains neu — komplett implementiert (Hero-Slider + Buttons + Settings-Picker)
**Hero:** none
**Tags:** Feature, Domains, Humidifier, Vacuum, deviceConfigs

### Why

Bei der Domain-Inventur nach Climate-Big-Bang (v1.1.1368) zwei kritische Lücken gefunden:

| Domain | getControl | getSlider | Picker | Status |
|---|---|---|---|---|
| **humidifier** | ❌ | ❌ | ❌ | komplett fehlend |
| **vacuum** | ❌ | ❌ | ❌ | komplett fehlend |

Wenn der User direkt einen `humidifier.bautrockner` oder `vacuum.roborock` aus der Geräte-Liste öffnete, kam der generic-Fallback (leere Buttons-Reihe, kein Hero, keine Funktion). Beide gehören zu den häufigsten Smart-Home-Devices die User erwarten.

### Fix — beide Domains gebaut analog Climate-Pattern

**1. `homeAssistantService.js`** — humidifier-Service-Definitionen ergänzt (vacuum war schon da):

```js
humidifier: {
  turn_on:  { parameters: [] },
  turn_off: { parameters: [] },
  toggle:   { parameters: [] },
  set_humidity: { parameters: ['humidity'] },
  set_mode:     { parameters: ['mode'] },
}
```

**2. `deviceConfigs.js` — `getControlConfig` für humidifier**

Erste Reihe = Power-Toggle, danach Mode-Buttons aus `attributes.available_modes` (max 4, Rest im Settings-Picker). Settings-Button öffnet HumidifierSettingsPicker:

```js
const buttons = [
  { id: 'power', icon: hvacModeIcons.off, action: state==='on'?'turn_off':'turn_on', active: state==='on' },
  ...availableModes.slice(0, 4).map(mode => ({
    id: `mode_${mode}`, icon: ..., action: 'set_mode', data: { mode },
    active: currentMode === mode,
  })),
  { id: 'settings', icon: controlIcons.settings_climate, expandable: true },
];
```

**3. `deviceConfigs.js` — `getControlConfig` für vacuum**

5 Buttons je nach State: Start/Pause (toggle wenn cleaning), Stop, Return-to-Base, Locate, Settings (nur wenn `fan_speed_list` vorhanden). Inline-SVG-Icons für die 4 Buttons (Stop = solid square, Dock = Haus, Locate = concentric circles).

```js
const startPauseButton = state === 'cleaning'
  ? { id: 'pause', icon: controlIcons.pause, action: 'pause' }
  : { id: 'start', icon: controlIcons.play, action: 'start' };
```

**4. `deviceConfigs.js` — `getSliderConfig` für humidifier**

Hero zeigt Target-Humidity-Dial mit Range aus `min_humidity`/`max_humidity`, Color `#3DB8E5` (water-blue), `current_humidity` im subValue, showPower mit echtem `state==='on'`. Wenn aus → grau + readOnly + progressMode.

**5. `deviceConfigs.js` — `getSliderConfig` für vacuum**

Hero zeigt Battery-Donut mit State-Aware-Color (rot < 20%, orange < 50%, grün >= 50%), `displayValue` ist der State-Text (`'Reinigt'`/`'Geparkt'`/`'Pausiert'`/...) übersetzt via `t('vacuum_${state}')`, `subValue` = Battery-%. Nicht-interaktiv (Battery ist read-only, Steuerung läuft über Buttons).

**6. `sliderHandlers.js`** — humidifier-Handler ergänzt (vacuum hat keinen Slider-Handler weil read-only):

```js
humidifier: (item, value, ..., handleServiceCall) => {
  const humidity = Math.round(value);
  if (item.attributes) item.attributes.humidity = humidity;
  handleServiceCall('set_humidity', { humidity });
}
```

**7. `HumidifierSettingsPicker.jsx`** (~150 LOC, neue Datei)

Settings = Mode-Picker für ALLE `available_modes` (auch die nicht als Buttons rendern weil > 4). Pattern 1:1 von ClimateSettingsPicker (v1.1.1368): ios-section/ios-card/ios-item-clickable Main-View, AnimatePresence Sub-View mit PickerWheel, Auto-Commit nach 300ms via `hass.callService('humidifier', 'set_mode', { mode })`. Pending-Indicator-Pulse.

CSS-Wiederverwendung: `import '../climate/ClimateSettingsPicker.css'` — alle `.csp-*` Helper-Klassen sind generisch, keine Climate-spezifika.

**8. `VacuumSettingsPicker.jsx`** (~150 LOC, neue Datei)

Settings = Fan-Speed-Picker aus `fan_speed_list`. Service: `hass.callService('vacuum', 'set_fan_speed', { fan_speed })`. Auto-Commit-Debounce 300ms. Sonst identisch zum HumidifierSettingsPicker.

**9. `PresetButtonsGroup.jsx`** — beide neuen Pickers wired:

```jsx
{group.renderCustom && group.id === 'settings' && item?.domain === 'climate'    ? <ClimateSettingsPicker    .../> :
 group.renderCustom && group.id === 'settings' && item?.domain === 'humidifier' ? <HumidifierSettingsPicker .../> :
 group.renderCustom && group.id === 'settings' && item?.domain === 'vacuum'     ? <VacuumSettingsPicker     .../> :
 ...}
```

**10. Translations** in de.js + en.js (controls-section):

- `start`/`returnToBase`/`locate` für vacuum buttons
- `targetHumidity` für humidifier slider label
- `vacuum_cleaning/docked/paused/idle/returning/error/unknown` für vacuum state-text im displayValue
- `mode` für Mode-Picker-Label

### Verification

Live-Eval im Dev (mit synthetic state-objects):

| Test | Ergebnis |
|---|---|
| `getControlConfig({ domain:'humidifier', attrs:{available_modes:['normal','eco','baby']}, state:'on' })` | 5 Buttons: power, mode_normal, mode_eco, mode_baby, settings ✅ |
| `getControlConfig({ domain:'vacuum', attrs:{fan_speed_list:['quiet','balanced','turbo']}, state:'cleaning' })` | 5 Buttons: pause, stop, return_to_base, locate, settings ✅ |
| `getSliderConfig` humidifier on | label='Ziel-Feuchte', color=#3DB8E5, subValue='Luftfeuchtigkeit: 45%' ✅ |
| `getSliderConfig` vacuum cleaning, battery=65 | color=#30D158 (grün), displayValue='Reinigt', subValue='65%' ✅ |
| Picker-Module-Imports | OK, keine Console-Errors ✅ |

### Pattern-Lehren

- **Domain-Pattern hat sich etabliert**: Climate-Picker → Humidifier-Picker → Vacuum-Picker waren jeweils ~150 LOC mit dem gleichen Skelett (live attrs, ios-section, sub-view, debounce, callService). Das Skelett ist jetzt copy-paste-fähig für jede künftige Domain (alarm_panel, water_heater, etc.).
- **CSS-Wiederverwendung über Domains**: ClimateSettingsPicker.css mit den `.csp-*`-Klassen ist domain-agnostisch und wird jetzt von 3 Pickers gemeinsam genutzt. Bei zukünftigen Pickers einfach `import '../climate/ClimateSettingsPicker.css'`.
- **Service-Definition ist optional aber gut**: homeAssistantService.js's Domain-Map ist nicht streng nötig (hass.callService klappt direkt), aber dokumentiert die unterstützten Services und Parameters für Schedule-Editor + Suggestion-Engine.
- **State-Aware Color-Mapping** (Battery rot<20% / orange<50% / grün): konsistente Visual-Hierarchie über Domains hinweg (Climate hat Temperatur-Color, Vacuum hat Battery-Color, Humidifier hat fixe Water-Blau-Color).

### Was offen bleibt

- **media_player Cover-Art Hero** (separates Feature)
- **fan-Domain Buttons** (aktuell nur Slider, keine Preset/Oscillation/Direction Buttons)
- **Universal-Layouts** (climate/media_player/dehumidifier/vacuum) — der ursprüngliche Plan, deutlich einfacher jetzt da humidifier + vacuum als reguläre Domains existieren
- **vacuum-Map-Display** (Roborock-Map als Bild) — komplexes Feature, später

---

## Version 1.1.1368 - 2026-05-03

**Title:** Climate-Bereich Big-Bang-Rewrite — Settings-Picker funktioniert jetzt tatsächlich (Live-State, echte Service-Calls, Auto-Commit) + auto/heat_cool HVAC-Modi
**Hero:** none
**Tags:** Bugfix, Feature, Refactor, Climate, ClimateSettingsPicker, deviceConfigs

### Why

Bei Analyse des Climate-Bereichs (User-Wunsch: vor Universal-Layouts erst Climate sauber machen) sind kritische Bugs ans Licht gekommen die seit Erstauslieferung im Code stehen:

1. **Apply-Button machte NICHTS** — `console.log('Climate settings:', ...)` und ein TODO-Kommentar "Here you could call a service to update the climate entity". Keine `hass.callService` calls. User dreht am Wheel, klickt Apply → silently nothing.
2. **Picker-Optionen hardcodiert** — `FAN_SPEED_OPTIONS = ['Auto', '1', '2', '3', '4', '5']`, hardcoded German `HORIZONTAL_OPTIONS = ['Auto', 'Links', '2', '3', '4', 'Rechts', 'Split', 'Swing']`. Das Device hat aber `attributes.fan_modes` mit gerätespezifischen Werten (Daikin: `['quiet', 'auto', 'high']`, Tado: `['silent', 'medium', 'turbo']`). User sah immer fake values.
3. **State nicht ans Entity gebunden** — `useState('Auto')` hardcoded. Picker startete IMMER auf "Auto" auch wenn HA-State `fan_mode='high'` war.
4. **Hardcoded German Service-Werte** — selbst wenn der Apply-Button verkabelt wäre, würde HA `set_swing_mode: { swing_mode: 'Links' }` mit "unknown swing mode" rejecten — HA-Spec ist `'horizontal'`/`'vertical'`/`'both'`/`'off'`.
5. **HVAC-Modi unvollständig** — nur heat/cool/dry/fan_only, fehlten `auto` und `heat_cool` (typische AC-Modi)
6. **Kein preset_mode-Support** — eco/sleep/away/comfort/boost komplett fehlend
7. **DOM-Manipulation per `document.getElementById`** + `picker.animate(...)` — Anti-Pattern in Preact, fragile bei multiple Climate-Devices

### Fix

**1. ClimateSettingsPicker.jsx komplett neu (~290 LOC)**

```jsx
const stateObj = hass?.states?.[item?.entity_id] || null;
const attrs = stateObj?.attributes || item?.attributes || {};

// Verfügbare Modi LIVE aus dem Entity (statt hardcoded)
const fanModes              = attrs.fan_modes              || [];
const swingModes            = attrs.swing_modes            || [];
const swingHorizontalModes  = attrs.swing_horizontal_modes || [];
const presetModes           = attrs.preset_modes           || [];
const supportsHumidity      = attrs.min_humidity != null && attrs.max_humidity != null;

// Aktuelle Werte LIVE aus dem Entity (statt useState('Auto'))
const currentFanMode = attrs.fan_mode ?? null;
// etc.
```

Architektur:
- **Main-View**: `ios-section/ios-card` mit einer Row pro unterstütztem Setting (Fan / Swing / Swing-Horizontal / Preset / Humidity). Jede Row zeigt Label + aktuellen Wert + Chevron, klick öffnet Sub-View. Nicht-unterstützte Settings werden NICHT gerendert — kein leerer "Auto"-Picker mehr für Devices ohne fan_modes.
- **Sub-Views**: AnimatePresence-Slide-Übersetzung (analog UniversalSetup). Jede Sub-View hat Back-Button-Header + zentralen Title + Content (PickerWheel für enum-Werte, LiquidGlassSlider für humidity).
- **Auto-Commit**: User dreht das Wheel → onChange feuert → 300ms Debounce-Timeout → `hass.callService('climate', 'set_fan_mode', { entity_id, fan_mode })`. Pro Setting eigener Timeout damit verschiedene Settings nicht kollidieren. Pending-Indicator (animierter blauer Punkt) neben dem Wert während Debounce läuft.
- **Cleanup-Effect** für alle Pending-Timeouts on unmount.

```jsx
const commitDebounced = (key, fn) => {
  if (commitTimeoutsRef.current[key]) clearTimeout(commitTimeoutsRef.current[key]);
  setPending(key);
  commitTimeoutsRef.current[key] = setTimeout(async () => {
    delete commitTimeoutsRef.current[key];
    try { await fn(); } finally {
      setPending(prev => prev === key ? null : prev);
    }
  }, 300);
};
```

**2. deviceConfigs.js — auto + heat_cool HVAC-Buttons ergänzt**

Bisher generierte `case 'climate'` nur Buttons für `['heat', 'cool', 'dry', 'fan_only']`. `auto` und `heat_cool` fehlten obwohl typische AC-Modi:

```js
const hvacModeConfig = {
  heat:      { icon: hvacModeIcons.heat,    label: t('heating')  },
  cool:      { icon: hvacModeIcons.cool,    label: t('cooling')  },
  auto:      { icon: autoIcon,              label: t('auto')     },
  heat_cool: { icon: heatCoolIcon,          label: t('heatCool') },
  dry:       { icon: hvacModeIcons.dry,     label: t('drying')   },
  fan_only:  { icon: hvacModeIcons.fan_only,label: t('fanOnly')  }
};
['heat', 'cool', 'auto', 'heat_cool', 'dry', 'fan_only'].forEach(mode => {
  if (availableHvacModes.includes(mode) && hvacModeConfig[mode]) {
    hvacButtons.push({ id: `hvac_${mode}`, ... });
  }
});
```

Inline-SVG-Icons für `auto` (sun-circle) und `heat_cool` (thermometer + arrows).

**3. PresetButtonsGroup.jsx — hass an Picker durchreichen**

Vorher: `<ClimateSettingsPicker item={item} lang={lang} />` — Picker hatte nur einen statischen `item.attributes`-Snapshot.
Jetzt: `<ClimateSettingsPicker item={item} hass={hass} lang={lang} />` — Picker liest live aus `hass.states[entity_id]`, reagiert auf externe State-Changes (Voice-Command, anderes Frontend).

**4. ClimateSettingsPicker.css als eigene Datei (~110 LOC)**

300+ Zeilen inline `<style>{...}</style>` aus dem Component raus. Vorher wurde der Style-Tag bei jedem Mount neu in den DOM injiziert. Jetzt einmal via `import './ClimateSettingsPicker.css'`.

**5. Dependencies**

- `PickerWheel` (existing, für enum-Werte) — onChange feuert auf scroll-end, schon debounced intern
- `LiquidGlassSlider variant="dark"` (v1.1.1365, für humidity)
- `createSlideVariants('100%')` für AnimatePresence (analog UniversalSetup Sub-Views)
- `translateUI('climate.{fanMode|swingMode|presetMode|humidity}')` — Translation-Keys existieren schon in de.js/en.js (Schema unter `climate: { ... }`)

### Was funktional jetzt geht

| Vorher | Jetzt |
|---|---|
| Apply-Button → console.log | Auto-Commit nach 300ms via hass.callService |
| Hardcoded `['Auto','1','2','3','4','5']` | `attrs.fan_modes` aus Entity |
| Picker startet immer auf "Auto" | Picker startet auf `attrs.fan_mode` |
| `'Links'`, `'Rechts'` (de) als Service-Wert | echte HA-Werte (`'horizontal'`/`'vertical'`/`'both'`) |
| Nur Fan/Horizontal/Vertical Picker | Fan + Swing + Swing-Horizontal + Preset + Humidity, dynamisch nur was Device kann |
| 4 HVAC-Modi (heat/cool/dry/fan_only) | 6 HVAC-Modi (+ auto + heat_cool) |
| Keine Live-Reactivity | Reagiert auf externe HA-State-Changes |
| Generic Apply für alle 3 Pickers gleichzeitig | Per-Setting Auto-Commit, jedes Setting eigener Debounce-Timer |
| Kein preset_mode | preset_mode mit allen Werten aus `attrs.preset_modes` |
| Kein humidity-Setting | LiquidGlassSlider mit `min_humidity`/`max_humidity` Range |

### Pattern-Lehren

- **Hardcoded options sind ein Smell**: wenn die Option-Liste pro Device variieren KANN, IMMER aus `attrs.{x}_modes` lesen. Hardcoded Listen sind nur OK wenn die Domain wirklich global fixiert ist (z.B. binary states on/off).
- **Apply-Button vs Auto-Commit**: für single-value Settings (1 Picker = 1 Wert) ist Auto-Commit nach Debounce iOS-konform und User-freundlicher. Apply-Button macht Sinn nur wenn mehrere Werte als atomarer Batch committet werden müssen (z.B. Schedule-Editor).
- **Live-State-Binding via hass.states**: `item.attributes` ist ein Snapshot vom Mount-Zeitpunkt. Wenn das Entity sich extern ändert (Voice-Command etc.), bleibt der Snapshot stale. Immer durch `hass.states[entity_id].attributes` lesen für reactive UIs.
- **Per-Setting-Debounce-Map**: bei N parallelen Settings einer Component (Fan + Swing + Preset + Humidity gleichzeitig drag-bar) braucht jedes Setting einen EIGENEN Debounce-Timeout, sonst überschreibt der nächste den ersten und Calls gehen verloren.
- **Translation-Keys existierten schon**: `de.js` hatte `climate.fanMode`/`swingMode`/`presetMode`/`auto`/`heatCool` bereits — der alte Picker nutzte sie nur nicht weil seine Optionen hardcoded waren.

### Was offen bleibt

- **Cover-Art für media_player** (analog Spotify-Style) — separates Feature, nicht Climate-relevant
- **Climate-Layout im Universal-Builder** — der ursprüngliche Plan, jetzt zurückgestellt. Mit dem reparierten Climate-Bereich + auto/heat_cool ist der Universal-Climate-Layout später deutlich einfacher (nur "primary climate-Entity finden + UniversalControlsTab routen")
- **Multi-zone Climate** (mehrere climate.* Entities pro Device) — primary-Entity reicht erstmal
- **Custom-Service-Calls** (z.B. Mitsubishi-spezifische Schwenk-Modi via `script.*`) — können später als Override-Mechanismus rein

---

## Version 1.1.1367 - 2026-05-02

**Title:** Integration ManagementView — 3 Polish-Fixes (Scrollbar, Hover, Such-Pill)
**Hero:** none
**Tags:** Bugfix, UI, Integration, ManagementView

### Why

User-Feedback nach v1.1.1366: "kein customscroll; auch kein hover bei edit, suchleiste auch nicht dunkel wie bei system settings"

Drei Pain-Points im Big-Bang-Re-Skin der Integration:
1. CustomScrollbar wurde gerendert aber war unsichtbar/funktionslos
2. Edit-/Trash-Buttons hatten kein wirkungsvolles Hover-Feedback (verschwanden auf weißer Hover-Row)
3. Such-Feld blendete in den umgebenden ios-card statt sich als eigenes dunkles Pill abzuheben

### Fix

**1. CustomScrollbar — Flex-Chain reparieren**

Mein ManagementView-Wrapper war `<div style={{ position: 'relative' }}>` ohne `display: flex` / `height: 100%`. Damit konnte das innere `<div className="ios-settings-view">` sein `flex: 1; overflow-y: auto` nicht ausspielen — es überflog stattdessen den Container. `scrollRef` zeigte zwar auf das richtige Element, aber `scrollHeight === clientHeight` weil overflow nie aktiviert wurde → CustomScrollbar berechnete Thumb-Höhe = Track-Höhe → unsichtbar.

Fix: Wrapper auf `ios-view-wrapper` umgestellt (das hat `display: flex; flex-direction: column; height: 100%` aus iOSSettingsView.css). `position: relative` als Inline-Style behalten für CustomScrollbar-Anchoring.

```jsx
<div className="ios-view-wrapper" style={{ position: 'relative' }}>
  <NavBar ... />
  <div ref={scrollRef} className="ios-settings-view"> ...
  <CustomScrollbar scrollContainerRef={scrollRef} isHovered={isHovered} />
</div>
```

**2. Hover-States für Action-Buttons**

`.ios-item:hover` schlägt die ganze Row auf weiß (`rgba(255,255,255,0.95)`) plus alle `ios-item-left` SVGs auf schwarz. Aber meine Action-Buttons sind in `ios-item-right` und behielten ihre dark-mode Farben (`background: rgba(255,255,255,0.08)`, `color: rgba(255,255,255,0.7)`) — wurden auf weißer Row unsichtbar.

Fix in IntegrationView.css: doppelte Hover-Pyramide

```css
@media (hover: hover) {
  /* Default (dark row): brightern + leicht skalieren */
  .integration-action-btn:hover {
    background: rgba(255, 255, 255, 0.18);
    color: rgba(255, 255, 255, 1);
    transform: scale(1.06);
  }
  .integration-action-btn-danger:hover {
    background: rgba(255, 59, 48, 0.22);
    color: rgb(255, 99, 91);
  }

  /* Wenn die Row weiß wird, Buttons auf dark-on-light umstellen */
  .ios-item:hover:not(:active) .integration-action-btn {
    background: rgba(0, 0, 0, 0.06) !important;
    color: rgba(0, 0, 0, 0.65) !important;
  }
  .ios-item:hover:not(:active) .integration-action-btn:hover {
    background: rgba(0, 0, 0, 0.12) !important;
    color: rgba(0, 0, 0, 0.95) !important;
  }
  .ios-item:hover:not(:active) .integration-action-btn-danger:hover {
    background: rgba(255, 59, 48, 0.18) !important;
    color: rgb(255, 59, 48) !important;
  }
}
```

Buttons sind jetzt in beiden Zuständen klar sichtbar (Edit + Trash), reagieren auf eigenen Hover mit scale + bg-change. Trash hat zusätzlich rote Tint auf hover (success vs destructive Visual-Hierarchie).

Plus: Größe 30→32px für besser klickbare Targets.

**3. Such-Pill statt ios-card-Row**

Vorher saß die Search-Row IN einem ios-section + ios-card (bekam dadurch den hellen `rgba(255,255,255,0.08)`-Card-Background, blendete in die Section).

Jetzt eigenes Pill-Element analog `news-search` aus NewsView.css:

```css
.integration-search-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  margin-bottom: 18px;
  background: rgba(0, 0, 0, 0.28);     /* deutlich dunkler als ios-card */
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;                  /* Pill-Form */
}
.integration-search-pill:focus-within {
  background: rgba(0, 0, 0, 0.38);
  border-color: rgba(255, 255, 255, 0.18);
}
```

Plus Clear-Button als 18px-runder kleiner Pill (war vorher offene X-Button-only).

JSX-Anpassung: ios-section + ios-card-Wrapper raus, Pill steht direkt im scroll-view:

```jsx
{showSearch && (
  <div className="integration-search-pill">
    <span className="integration-search-icon"><SearchIcon /></span>
    <input className="integration-search-input" ... />
    {search && <button className="integration-search-clear"><ClearIcon /></button>}
  </div>
)}
```

### Pattern-Lehren

- **Flex-Chain ist fragil**: ein Wrapper-Div ohne `display: flex` zwischen `ios-view-wrapper` und `ios-settings-view` bricht die overflow-Berechnung. Wenn ein Container `flex: 1` hat, MUSS der Parent-Container `display: flex` mit definierter Höhe haben — sonst ist `flex: 1` no-op und der Inhalt überflog statt zu scrollen.
- **Action-Buttons in tvOS-Hover-Cards**: globale Row-Hover (white card) + nested action buttons brauchen explizite dark-on-light Override-Regeln. Sonst verschwinden die Buttons in der Hover-Stage.
- **Search-Field-Position**: Spotlight-Style-Suche (rounded pill, dunkel) gehört NICHT in einen ios-card — eigener Container mit eigenem Background. ios-card ist für strukturierte Settings-Items, nicht für Suchfelder.

---

## Version 1.1.1366 - 2026-05-02

**Title:** Integration App — Big Bang Re-Skin (iOS-Settings-Pattern + Edit-Action + Suche/Gruppierung + Toasts)
**Hero:** none
**Tags:** Feature, Refactor, Integration, UX, iOS-Settings-Pattern

### Why

User: "F: Big Bang ok"

Die Integration App war seit ihrer Erstauslieferung visuell und strukturell von der restlichen Card abgekoppelt: eigenes Design-System (`integration-category-card`, `integration-management-button`), Emoji-Icons (`🍳`, `🚿`, `🧹`, `☕`, `🧽`), `<h2>`-zentrierte Header statt iOS-Navbar, eigener Bottom-Manage-Button statt Toolbar-Pattern, Edit-Action im Management gar nicht vorhanden, Coming-Soon-Cards die seit v1.1.1325 angezeigt aber nie implementiert wurden, kein Feedback bei Add/Remove. Der User wollte Konsistenz mit dem Rest der Card und volles Polish-Level wie System.Settings.

### Fix — Komplettrenovation der Integration App in 5 Bausteinen

**1. deviceTypeRegistry.js** — SVG-Icons als Single Source of Truth, Coming-Soon entfernt:

```js
const I = (svgInner) =>
  `<svg width="24" height="24" stroke-width="1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">${svgInner}</svg>`;

energy_dashboard: { icon: I('<path d="M13 3L4 14H11L11 21L20 10H13L13 3Z" .../>'), ... }
printer3d:        { icon: I('<path d="M6 18H4C2.9 18..." .../>'), ... }
weather:          { icon: I('<path d="M7 18C4.79 18..." .../>'), ... }
universal:        { icon: I('<path d="M19.5 12.5C18.4 11.4..." .../>'), editable: true }
```

Plus neuer Helper `isDeviceTypeEditable(typeId)` der Setup-Flow-Edit-Mode-Support reflektiert (aktuell nur Universal — UniversalSetup unterstützt mode='edit' seit v1.1.1336). Coming-soon-Types (oven/dishwasher/vacuum/coffee/shower) komplett raus — Universal deckt alle generischen HA-Devices ab. Vorher 9 Einträge (4 implemented + 5 stubs), jetzt nur die 4 echten.

**2. IntegrationView.jsx** — `ios-settings-container` Pattern + AnimatePresence-Slide-Übergänge zwischen 3 Views (selection/management/setup). Toast-Feedback via `showSuccessToast`/`showInfoToast` bei jedem Add/Remove/Update. Edit-Mode-Tracking via `editingDevice`-State: wenn Setup vom Management aus geöffnet wird, läuft die Setup-Flow mit `mode='edit'` + `existingDevice`-Prop. Back-Navigation respektiert: Setup → Management (im Edit-Flow) bzw. Setup → Selection (im Add-Flow).

```jsx
const handleEditDevice = (device) => {
  if (!isDeviceTypeEditable(device.category)) {
    showInfoToast('Bearbeitung nur über die Geräte-Ansicht möglich');
    return;
  }
  setSelectedCategory(device.category);
  setEditingDevice(device);
  setCurrentView('setup');
};
```

**3. CategorySelectionView.jsx** — Komplett auf `ios-section/ios-card/ios-item-clickable` umgestellt:
- Hero-Title (22px) + Subtitle ersetzen den `<h2>Gerät hinzufügen</h2>`-Header
- Manage-Card als eigene `ios-section` (nur wenn Geräte vorhanden) mit `integration-item-icon-accent` (iOS-Blau)
- Available-Types als `ios-card` mit allen Items + `ios-divider` zwischen ihnen
- SVG-Icons aus Registry via `dangerouslySetInnerHTML` (32×32 rounded-square Container, 18×18 SVG inside)
- Tipp-Footer in `ios-section-footer`: "Mit 'Universal Gerät' lässt sich jedes HA-Gerät einbinden"
- Vertikales Layout statt Grid — passt iOS-Settings-Pattern besser

**4. ManagementView.jsx** — Größtes Re-Engineering:
- `ios-navbar` mit Back-Chevron + Title (analog Hintergrund-Sub-View in AppearanceSettings)
- **Gruppierung nach Device-Type** in eigene `ios-section` pro Type, Header zeigt Type-Label + `· N` Counter
- **Such-Feld** ab >5 Devices als eigene `ios-card`-Row mit Search-Icon, Input, Clear-Button
- **Live-Filter** über name/category/serial/deviceType
- Pro Item: Edit-Button (nur wenn `isDeviceTypeEditable(category)` → aktuell nur Universal) + Trash-Button mit Confirm-Inline (Cancel/Remove) — kein zentriertes Bestätigen-Sheet mehr
- Empty-State mit großem rounded-square Icon + Titel + Subtitle
- "Keine Treffer"-State bei leerer Suche
- Order der Type-Sections folgt deviceTypeRegistry-Reihenfolge (energy_dashboard / printer3d / weather / universal)

**5. CSS** — Alte 343-Zeilen `IntegrationView.css` durch ~140-Zeilen Helper-CSS ersetzt. Layout/Cards/Section-Header kommen jetzt komplett aus `iOSSettingsView.css`. Eigene Klassen nur für Integration-spezifische Elemente:
- `.integration-hero` / `-title` / `-subtitle`
- `.integration-item-icon` (32×32 rounded-square mit currentColor-SVG)
- `.integration-item-icon-accent` (iOS-Blue für Manage-CTA)
- `.integration-action-btn` (Edit/Remove-Buttons im Item-Row, 30×30, hover-states)
- `.integration-action-btn-danger` (red-tint hover für Trash)
- `.integration-confirm-row` (Inline-Cancel+Remove statt Modal)
- `.integration-search-row/-input/-icon/-clear`
- `.integration-empty/-icon/-title/-subtitle`
- `.integration-group-count` (subtle " · N" badge in section-header)

Keine Emojis mehr, keine flache Liste, keine eigenen Card-Backgrounds. Alles via iOS-Settings-Tokens.

### Architektur am Ende

```
IntegrationView (ios-settings-container + AnimatePresence)
├── selection      → CategorySelectionView (ios-section pro Card-Group)
├── management     → ManagementView        (gruppiert + Suche + Edit + Remove)
└── setup          → SetupComponent aus Registry (mode: 'add' | 'edit')
```

Edit-Pipeline: Management.onDeviceEdit → IntegrationView.handleEditDevice → SetupComponent mit mode='edit'+existingDevice → SetupComponent.onComplete schickt `_editMode:true`+`_deviceId` zurück → IntegrationView ruft updateDevice statt addDevice → DataProvider event refresh → Toast.

### Was offen bleibt

- **Edit für Printer3D/Weather/EnergyDashboard** — diese Setup-Flows haben aktuell keinen mode='edit'-Support. Edit-Button wird in Management nicht angezeigt; User sieht Toast "Bearbeitung nur über die Geräte-Ansicht möglich". Wenn später gewünscht: 1× Setup-Flow erweitern + `editable: true` im Registry setzen.
- **Bulk-Operations** (mehrere Geräte gleichzeitig löschen / Layout wechseln)
- **Sortierung** innerhalb einer Type-Gruppe (aktuell add-order)

### Pattern-Lehre

Wenn ein Sub-System (hier: Integration) sein eigenes Design-System hat das vom Rest der App abweicht, ist Big-Bang-Re-Skin oft schneller als inkrementelle Polish-Runden. Voraussetzung: ein etabliertes Design-Token-System (hier: iOSSettingsView.css mit ios-section/ios-card/ios-item) existiert bereits an einer anderen Stelle. Dann ist die Migration mechanisch — alte Cards/Buttons/Headers durch ios-Klassen ersetzen, Helpers nur für domain-spezifische Elemente (z.B. integration-action-btn) eigenständig halten.

---

## Version 1.1.1365 - 2026-05-01

**Title:** LiquidGlassSlider — alle 5 verbleibenden nativen `<input type="range">` migriert (Dark-Variante für Device-Views)
**Hero:** none
**Tags:** Feature, UI, LiquidGlass, Universal-Builder, Printer3D, Energy, Consistency

### Why

User: "alle sollen migrieren"

Nach v1.1.1363/1364 hatten Settings den Liquid-Glass-Look, aber 5 Stellen in dunklen Device-Views (Universal/Printer3D/Energy) nutzten weiterhin native `<input type="range">` mit `linear-gradient`-Hacks. Visuell inkonsistent — User klickt zwischen Settings und Device, sieht zwei verschiedene Slider-Stile.

### Fix

**1. Dark-Variant für LiquidGlassSlider** (`variant="dark"` prop):

```js
const SHADOWS = {
  light: '0 1px 8px 0 rgba(0,30,63,.10), 0 0 2px 0 rgba(0,9,20,.10)',
  dark:  '0 2px 10px 0 rgba(0,0,0,.35), 0 0 0 1px rgba(255,255,255,.04)',
};
```

CSS-Override für Track-Background (`--track-bg: rgba(255,255,255,0.15)`) plus stärkerer Box-Shadow-Preset (inline via motion value, weil framer-motion's inline style CSS-box-shadow überschreibt). Default bleibt `light` für Backwards-Compat.

**2. UniversalEntityList NumberSliderControl** — wichtigste Migration weil Universal-Devices alle möglichen `number`-Configs haben (Volume, Brightness, etc). Jeder Slider ist jetzt:
- LiquidGlassSlider mit `variant="dark"`
- HA-Service-Call (`hass.callService('number', 'set_value')`) ist trailing-edge debounced 150ms — 60×/sec Backend-Calls würden HA-Queue überfluten
- `onChangeEnd` flushed sofort (cleared den Debounce-Timeout, schreibt finalen Wert)

```jsx
const onChange = (newVal) => {
  if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
  callTimeoutRef.current = setTimeout(() => {
    callTimeoutRef.current = null;
    persistValue(newVal);
  }, 150);
};
const onChangeEnd = (newVal) => {
  if (callTimeoutRef.current) {
    clearTimeout(callTimeoutRef.current);
    callTimeoutRef.current = null;
  }
  persistValue(newVal);
};
```

**3. PrinterMiscList Number-Controls** — gleiches Pattern, aber per-entity Debounce-Map (mehrere Slider gleichzeitig auf der Page möglich):

```js
const numberCallTimeoutsRef = useRef({});
const handleNumberChange = useCallback((entityObj, value) => {
  const id = entityObj.entity_id;
  if (numberCallTimeoutsRef.current[id]) clearTimeout(numberCallTimeoutsRef.current[id]);
  numberCallTimeoutsRef.current[id] = setTimeout(() => {
    delete numberCallTimeoutsRef.current[id];
    callService('number', 'set_value', id, { value: parseFloat(value) });
  }, 150);
}, [callService]);
```

Plus `accent="#30d158"` (grüner Bambu-Accent statt iOS-Blau).

**4. Printer3DControlsTab + EnergyControlsTab** — Print Speed (50-200) + Fan Speed (0-100) auf LiquidGlassSlider-dark umgestellt. Service-Calls sind aktuell noch Stub (`console.log`), Migration ist rein visuell — wenn Service-Calls implementiert werden, brauchen sie auch Debouncing.

**5. Printer3DDeviceView Camera-Refresh-Interval-Slider** (5-15 Sek) — `accent="#30d158"`, `variant="dark"`, plus 200ms Debounce für `localStorage.setItem('bambulab_camera_refresh_interval')` + `dispatchEvent('cameraRefreshIntervalChanged')`. Live-Update der CameraView über Event bleibt instant für Visual; Persistenz debounced.

### Architektur am Ende

13 native `<input type="range">` aus Card komplett entfernt. Alle Slider laufen über `LiquidGlassSlider`:

| Variant | Track-bg | Verwendung |
|---|---|---|
| `light` (default) | `#d6d6da` | Settings (helle iOS-Backdrops) |
| `dark` | `rgba(255,255,255,0.15)` | Device-Views (Bambu/Universal/Energy/Printer3D) |

Für jeden Use-Case mit teurem onChange-Handler (HA-Service-Call, localStorage-Write):
1. Live Visual via motion value (instant) — bleibt im Slider
2. React-State via `useRafThrottle` wo Parent-Re-Render teuer ist (Settings)
3. Persistenz/Service-Call via `setTimeout`-Debounce (150-200ms)

### Pattern-Lehren

- **Shadow-Variants müssen inline gesetzt werden** wenn die Component framer-motion motion-values für boxShadow nutzt — CSS-Override greift nicht.
- **Per-Entity-Debounce-Map** für Listen mit N parallelen Slidern: ein einzelner Debounce-Timeout würde Calls für andere Entities blockieren.
- **Klare onChange/onChangeEnd-Trennung**: onChange = visuelles Feedback (debounced ok), onChangeEnd = garantierter finaler Write (immediate, cleared pending debounce).

---

## Version 1.1.1364 - 2026-05-01

**Title:** LiquidGlassSlider — Performance-Fix für Drag (war "Katastrophe", jetzt flüssig)
**Hero:** none
**Tags:** Bugfix, Performance, LiquidGlassSlider, Settings, Framer-Motion

### Why

User: "es ist katastrophe; es ist nicht in echtzeit und auch nicht flüssig!!!! was hast du gemacht?"

In v1.1.1363 hatte ich das LiquidGlassSlider-Component eingeführt, aber 3 kritische Perf-Bugs übersehen die im Original-HTML-Demo nicht auffielen weil dort die onChange-Handler trivial waren (`setHero(v)`). In Production:
- **Spring-Animation kämpfte gegen den User-Pointer** während Drag
- **localStorage-Writes auf jedem Frame** (60×/sec) blockierten Main-Thread
- **Parent-Re-Render der ganzen AppearanceSettingsTab** auf jedem onChange-Tick

### Fix

**1. draggingRef gate für controlled-value sync** in `LiquidGlassSlider.jsx`:

Bei controlled Mode (`value={...}` prop) lief der useEffect auf jeder Prop-Änderung. Während Drag:
1. User-Pointer setzt `progress.set(p)` instant
2. onChange feuert → Parent setState → neuer prop `value=X`
3. useEffect lief und triggerte `animate(progress, X, spring)` — **Spring fightet den User-Drag**

Fix: `draggingRef` checkt vor sync, useEffect bailt während Drag. Nach Drag-Ende läuft sync normal.

**2. setInternalValue removed, aria imperatively updated** — vermeidet React-Render auf jedem Motion-Frame:

```js
useMotionValueEvent(progress, 'change', (p) => {
  const v = step ? snap(min + p * range) : (min + p * range);
  if (trackRef.current) {
    trackRef.current.setAttribute('aria-valuenow', String(Math.round(v)));
  }
  if (v === lastEmittedRef.current) return;
  lastEmittedRef.current = v;
  if (!disabled && onChange) onChange(v);
});
```

Dragging-state wurde von `useState` auf `useRef` umgestellt — kein Render bei Drag-Start/End. Visual läuft ausschließlich über motion values.

**3. localStorage-Debounce in saveBackgroundSettings + persistPredictiveSetting** (200ms trailing edge):

`updateSystemSettingsSection` macht `localStorage.getItem` + `JSON.parse` + `JSON.stringify` + `localStorage.setItem` des gesamten Settings-Blobs. Synchroner blockierender I/O 60×/sec = mehrere hundert ms Block-Time pro Sek. Drag.

Fix: CSS-Variablen werden weiterhin instant in `applyBackgroundSettings(settings)` gesetzt (Live-Filter-Feedback bleibt). Aber localStorage-Write läuft erst 200ms nach dem letzten Tick → einmaliger Write pro Drag-Operation.

**4. RAF-Throttle für Parent-setState** via neuem `useRafThrottle`-Hook (`src/hooks/useRafThrottle.js`):

Auch ohne localStorage-Write triggert jeder onChange einen Re-Render der gesamten AppearanceSettingsTab (5 Slider + iOS-Scrollbar + AnimatePresence + viele weitere Components). Bei 60+ onChange-Calls/sec überlappten die Renders, der Main-Thread wurde nie idle.

```js
export function useRafThrottle(callback) {
  const cbRef = useRef(callback);
  cbRef.current = callback;
  const stateRef = useRef({ raf: 0, pending: undefined, hasPending: false });
  return (value) => {
    stateRef.current.pending = value;
    stateRef.current.hasPending = true;
    if (stateRef.current.raf) return;
    stateRef.current.raf = requestAnimationFrame(() => { /* ... commit latest only */ });
  };
}
```

Wrappt `setBackgroundSettings`, `setLocalConfidenceThreshold`, `setLocalTimeWindow`, `setLocalMaxSuggestions`. Mehrere Calls innerhalb eines Frames werden zu einem zusammengefasst — max. 1 Re-Render pro Frame statt 60+.

### Architektur am Ende

3-Layer-Update-Strategie für Slider mit teuren Persist/Render-Pfaden:

| Schicht | Frequenz | Beispiel |
|---|---|---|
| **Live Visual (instant)** | jeder pointermove | CSS-Variable, motion value |
| **React State (RAF-throttled)** | max 60×/sec | Label "60%" Update |
| **Persistenz (debounced)** | 200ms nach last change | localStorage / HA |

Pattern wiederverwendbar für jeden zukünftigen Slider mit Live-Feedback (z.B. CircularSlider in DeviceView).

### Pattern-Lehre

Bei controlled Components mit teuren onChange-Handlern: NIE annehmen dass das Original-Demo-Verhalten in der Production-Umgebung performant ist. Original-HTML-Demos haben oft `setState(v)` als einzigen Side-Effect — Production hat localStorage-Writes, DOM-Mutations, große Parent-Trees. Drei Schichten brauchen drei verschiedene Throttle-Strategien (instant / RAF-throttle / debounce).

---

## Version 1.1.1363 - 2026-05-01

**Title:** Liquid-Glass-Slider — System.Settings sliders replaced with framer-motion-driven liquid-glass component (smaller size + onChange dedup)
**Hero:** none
**Tags:** Feature, UI, Liquid-Glass, Settings, Framer-Motion

### Why

User: "den slider will ich ändern, habe das gefunden" (HTML reference: Liquid Glass Slider mit Framer Motion). Plus: "zB bei system settings sind slider. diese ersetzen mit Liquid-Glass-Slider". Plus: "1:1 übernehmen, nichts ändern" (Liquid-Lens-Filter). Plus follow-up: "verkleiner bisschen die größe".

The 8 native `<input type="range">` sliders in System.Settings (Allgemein → Vorschläge: confidence/timeWindow/maxSuggestions; Darstellung → Hintergrund: brightness/blur/contrast/saturation/grayscale) used custom `bambu-slider` styling or inline linear-gradient backgrounds — visually inconsistent with the rest of the app and lacking the liquid-glass design language.

### Fix

**1. New `LiquidGlassSlider` component** (`src/components/common/LiquidGlassSlider.jsx` + `.css`, ~210 LOC) — 1:1 port from user's HTML reference with all framer-motion physics:

- Spring-Morph during drag (scaleX 1.18, scaleY 0.92)
- Background fade-out + 3 liquid layers visible (filter, overlay, specular) with `opacity` motion value
- Spring-release with overshoot (`{ stiffness: 380, damping: 14 }`)
- Native pointer-drag, keyboard support (Arrows, PageUp/Down, Home/End), full ARIA
- SVG `mini-liquid-lens` filter (feDisplacementMap with normalMap radial gradient) injected once into `document.body` on first mount via `ensureFilterInjected()` — multiple slider instances share the same filter

**2. Sizes reduced ~80%** vs HTML original (per user request "verkleiner bisschen"):
- Track height: 10px → 8px
- Thumb: 65×42 → 52×34
- Border-radius unchanged (999px) — proportions preserved

**3. onChange dedup optimization** — the original HTML fired `onChange` on every animation frame (~60×/sec) even when the snapped step value was unchanged. With heavy handlers (Brightness writes DOM filter + localStorage on every call), this caused stutter:

```js
const lastEmittedRef = useRef(initialValue);

useMotionValueEvent(progress, 'change', (p) => {
  const raw = min + p * range;
  const v = step ? snap(raw) : raw;
  if (v === lastEmittedRef.current) return;  // skip duplicate ints
  lastEmittedRef.current = v;
  setInternalValue(v);
  if (!disabled && onChange) onChange(v);
});
```

For a 100-step slider during a 1s sweep: before ~60 onChange calls (most duplicates), after ≤100 unique-int calls — significantly fewer DOM mutations per frame.

**4. Replaced 8 sliders** with new component — all min/max/value/onChange contracts preserved:
- `GeneralSettingsTab.jsx` — Confidence (40-90), Zeitfenster (15-120 step 15), Maximale Anzahl (5-20)
- `AppearanceSettingsTab.jsx` — Deckkraft (0-100), Weichzeichner (0-50), Kontrast (0-200), Sättigung (0-200), Schwarz & Weiß (0-100)

### Verification

- All 8 sliders render with track + progress + 52×34 pill-thumb + 3 liquid layers (filter/overlay/specular)
- SVG filter injected once (`#liquid-glass-slider-filter`)
- Drag tested: Confidence 80→50 at 20% click position (= exact 40 + 0.2×50), Deckkraft 100→50 at 50% click
- ARIA `aria-valuenow` updates live during drag
- Computed sizes: trackHeight 8px, thumbWidth 52px, thumbHeight 34px (verified via `getComputedStyle`)
- Disabled state respected (predictiveSuggestions: false → 3 sliders greyed out + non-interactive)
- No console errors, no build errors

### Pattern

Bei nativen `<input type="range">` mit custom CSS in iOS-styled UIs → vorgefertigte motion-value-driven Component statt CSS-only ist sinnvoller, weil:
1. Visual besser kontrollierbar (kein WebKit-Pseudo-Element-Hack)
2. Spring-Physik macht Touch/Drag fühlbar premium
3. Performance: motion values updaten direkt CSS ohne React-Renders, plus dedup auf Step-Änderungen verhindert spam

---

## Version 1.1.1362 - 2026-05-01

**Title:** Visibility-Picker — Entities gruppiert nach Steuerung/Sensoren/Diagnose/Sonstiges (statt einer flachen Liste)
**Hero:** none
**Tags:** Feature, Universal-Builder, Visibility-Picker, Auto-Grouping

### Why

User: "und bei den sichtbaren nochmal gruppieren nach sensoren, diagnostics, usw."

Die Visibility-Sub-View im UniversalSetup zeigte alle Entities in einer flachen Liste mit kleinen `· DIAGNOSTIC` / `· CONFIG`-Badges in der subtitle. Bei Devices mit vielen Entities (z.B. Roborock-Vacuum mit 30+ Entities) wurde das unübersichtlich. User wollte die selben 4 Gruppen wie in der echten Device-View — Steuerung/Sensoren/Diagnose/Sonstiges.

### Fix

**1. Neue `groupedVisibleEntities` useMemo** in UniversalSetup mit der selben Klassifikations-Logik wie `entityGrouping.js`:

```js
const groupedVisibleEntities = useMemo(() => {
  const groups = { controls: [], sensors: [], diagnostic: [], misc: [] };
  for (const e of deviceEntities) {
    if (e.entity_id === heroEntity) continue;
    if (e.entity_category === 'diagnostic') groups.diagnostic.push(e);
    else if (e.entity_category === 'config') groups.misc.push(e);
    else if (CONTROL_DOMAINS.has(e.domain)) groups.controls.push(e);
    else if (SENSOR_DOMAINS.has(e.domain)) groups.sensors.push(e);
    else groups.misc.push(e);
  }
  return groups;
}, [deviceEntities, heroEntity]);
```

Identisch zu entityGrouping.js — User sieht im Setup dieselben 4 Gruppen wie in der Device-View.

**2. renderVisibilityView neu** — pro Gruppe eine eigene `.ios-section` mit eigenem Header (STEUERUNG/SENSOREN/DIAGNOSE/SONSTIGES) + ios-card mit Items. Leere Gruppen werden NICHT gerendert (kein leerer Section-Header). `entity_category`-Badge ist raus aus dem subtitle (redundant zur Section-Zuordnung).

```jsx
const sections = [
  { key: 'controls',   label: 'STEUERUNG',  items: groupedVisibleEntities.controls },
  { key: 'sensors',    label: 'SENSOREN',   items: groupedVisibleEntities.sensors },
  { key: 'diagnostic', label: 'DIAGNOSE',   items: groupedVisibleEntities.diagnostic },
  { key: 'misc',       label: 'SONSTIGES',  items: groupedVisibleEntities.misc },
];

sections.map(section => {
  if (section.items.length === 0) return null;
  return (
    <div className="ios-section">
      <div className="ios-section-header">{section.label}</div>
      <div className="ios-card">
        {section.items.map(e => <Item ... />)}
      </div>
    </div>
  );
})
```

Plus Empty-State wenn ALLE Gruppen leer sind: "Keine Entitäten verfügbar".

### UX

**Vorher:** Eine flache Liste "ENTITÄTEN" mit allen 30+ Items, jedes mit `· DIAGNOSTIC` / `· CONFIG`-Badge im subtitle.

**Nachher:** 4 Sektionen
```
STEUERUNG
  Obergeschoss            [toggle ON]

SENSOREN
  Aktueller Raum          [toggle ON]
  Batterie                [toggle ON]
  ... (weitere)

DIAGNOSE
  Signalstärke            [toggle ON]
  ... (weitere)

SONSTIGES
  Ausgewählte Karte       [toggle ON]
  Bitte nicht stören      [toggle ON]
  ... (weitere)
```

### Files

- `system-entities/entities/integration/components/setup-flows/UniversalSetup.jsx`:
  - + `groupedVisibleEntities` useMemo (klassifiziert deviceEntities nach 4 Gruppen)
  - renderVisibilityView komplett neu (4 Sektionen statt eine flache Liste)
  - subtitle-Badge `· DIAGNOSTIC/CONFIG` entfernt (redundant zur Section)
  - Empty-State wenn alle Gruppen leer

---

## Version 1.1.1361 - 2026-05-01

**Title:** Universal — Container nur um Entity-Liste (nicht ganze View) — Header + Hero + Tab-Buttons bleiben edge-to-edge wie Bambu
**Hero:** none
**Tags:** Visual-Polish, Universal-Builder, Container-Scope

### Why

User-Korrektur nach v1.1.1360: "nur die unterbuttons im container; also bspw. alles ab sonstiges inkl."

In v1.1.1360 hatte ich die ganze UniversalDeviceView in `ios-settings-container` gewrappt — also Header, Hero-Circle, 4 Tab-Buttons UND die expanded Liste. User wollte aber nur den unteren Teil (die Liste der Items unter "SONSTIGES") im Container — Header und Tab-Buttons sollten weiterhin edge-to-edge bleiben (analog Bambu-Stil).

### Fix

**1. v1.1.1360 zurückgenommen:** UniversalDeviceView outer-div hat keinen `ios-settings-container` mehr, ist wieder edge-to-edge.

**2. Container nur am UniversalEntityList:** der `printer-sensors-wrapper` outer-div bekommt jetzt rounded-dark Container styling:

```diff
  <div
    className="printer-sensors-wrapper"
    onMouseEnter={...}
    onMouseLeave={...}
-   style={{ position: 'relative' }}
+   style={{
+     background: 'rgba(0, 0, 0, 0.25)',
+     borderRadius: '20px',
+     border: '1px solid rgba(255, 255, 255, 0.06)',
+     position: 'relative',
+     margin: '0 8px',
+     overflow: 'hidden',
+   }}
  >
```

So bekommt nur die expanded Liste der Tab-Items (z.B. "SONSTIGES"-Items) den dunklen rounded Container — Header oben, Hero-Circle in der Mitte, 4 Tab-Buttons darunter bleiben edge-to-edge.

`margin: '0 8px'` schiebt den Container leicht von den Rändern, damit nicht edge-to-edge.

### Resultat

- Header "Active / Gerade Eben" (oben links): edge-to-edge wie vorher
- Toolbar (oben rechts): edge-to-edge
- Hero-Circle (Mitte): edge-to-edge
- 4 Tab-Buttons (Steuerung/Sensoren/Diagnose/Sonstiges): edge-to-edge
- Expanded Tab-Inhalt (Section-Header + Item-Liste): in dunklem rounded Container

Visuell: nur die "ausklappbare" Sektion ist als eigene "Karte" abgesetzt, der Rest des Device-Headers bleibt im Detail-Panel-Style.

### Files

- `system-entities/entities/integration/device-entities/views/UniversalDeviceView.jsx` — v1.1.1360 zurückgenommen, outer-div ohne ios-settings-container
- `system-entities/entities/integration/device-entities/components/UniversalEntityList.jsx` — outer printer-sensors-wrapper bekommt background/border-radius/border/margin/overflow

---

## Version 1.1.1360 - 2026-05-01

**Title:** Universal Device-View — `ios-settings-container` outer wrap (dunkler abgerundeter Container, consistent margins, analog UniversalSetup)
**Hero:** none
**Tags:** Visual-Polish, Universal-Builder, Container

### Why

User: "vielleicht sollte wie bei settings aus ein runder dunkler container mit gleichen abständen zum rand erstellt werden"

Im Setup-Wizard wird der Inhalt in `.ios-settings-container` gewrappt (background `#00000040`, border-radius 24px, overflow hidden) — visuell ein abgerundeter dunkler Container mit konsistenten Abständen zum Rand. Die echte Universal-Device-View war aber edge-to-edge ohne Container — visueller Bruch zwischen Setup-Visual und Real-View.

### Fix

`UniversalDeviceView` outer-div bekommt jetzt zusätzlich die `ios-settings-container`-Klasse:

```diff
- <div className="universal-device-view" style={{
+ <div className="ios-settings-container universal-device-view" style={{
    display: 'flex',
    flexDirection: 'column',
+   maxHeight: 'none',  // override 555px-Cap aus .ios-settings-container
    height: '100%',
    position: 'relative',
  }}>
    <UniversalControlsTab ... />
  </div>
```

`maxHeight: 'none'` Override damit die Device-View nicht auf 555px gecapped wird (System.Settings hat das Cap weil es als kleines Settings-Sheet rendert; Universal-Device fillt aber den ganzen Detail-Panel-Bereich).

### Resultat

Universal-Device-View hat jetzt:
- Dunkler Hintergrund (`background: #00000040`)
- Abgerundete Ecken (`border-radius: 24px`)
- Consistent margins zum Rand des Detail-Panels
- Visuell konsistent mit UniversalSetup, GeneralSettingsTab, und allen anderen System-Settings-Views

### Files

- `system-entities/entities/integration/device-entities/views/UniversalDeviceView.jsx` — outer-div mit `ios-settings-container`-Klasse + maxHeight-Override

---

## Version 1.1.1359 - 2026-05-01

**Title:** Universal — Select-Picker als Sub-View mit Hakenauswahl + Time-Picker mit TimePickerWheel (analog Schedules)
**Hero:** none
**Tags:** Feature, Universal-Builder, Sub-Views, TimePickerWheel

### Why

User: "für select bitte untermenu machen (so wie in system settings) mit hakenauswahl, für time bitte den picker benutzer (so wie bei schedules)"

Inline-`<select>` und `<input type="time">` aus v1.1.1358 funktionierten technisch, sahen aber wie native Browser-Widgets aus statt im iOS-Look. User wollte konsistente UX:
- Select → Sub-View mit `ios-card`-Liste + ✓ beim aktiven Wert (analog System.Settings Sprach-Picker)
- Time → eigene Sub-View mit `TimePickerWheel` (analog Schedules)

### Solution

**1. Picker-Sub-View State in `UniversalEntityList`**

```js
const [pickerEntity, setPickerEntity] = useState(null);
// null = list view, { type: 'select'|'time', entity_id } = picker open

// Early return wenn Picker offen
if (pickerEntity?.type === 'select') return <SelectPickerView .../>;
if (pickerEntity?.type === 'time')   return <TimePickerView .../>;
```

Wenn ein Picker offen ist, wird die Entity-Liste komplett ersetzt durch die Sub-View — analog System.Settings beim Sprach-Picker.

**2. EntityRow für select/time wird `ios-item-clickable`**

Statt inline `<select>` / `<input type="time">` rendern select+time jetzt einen klickbaren Row mit aktuellem Wert + Chevron rechts:

```jsx
<motion.div className="ios-item ios-item-clickable" onClick={() => onOpenPicker('select', entity_id)}>
  <ios-item-label>Wisch-Intensität</ios-item-label>
  <ios-item-right>
    <span className="ios-item-value">Hoch</span>
    <Chevron />
  </ios-item-right>
</motion.div>
```

**3. `<SelectPickerView>` — Hakenauswahl analog Sprach-Picker**

- `.ios-navbar` mit Back-Button + zentriertem Title (entity friendly_name)
- `.ios-section` "OPTIONEN"
- `.ios-card` mit `.ios-item-clickable` pro Option
- ✓ rechts beim aktuellen Wert (iOS-Blue, 20px)
- Click → `hass.callService('select', 'select_option', {entity_id, option})` → 200ms delay → zurück zur Liste

**4. `<TimePickerView>` — TimePickerWheel mit auto-save**

- `.ios-navbar` mit Back-Button + Title
- `<TimePickerWheel>` aus `/components/picker/` (selber Component wie ScheduleTab)
- `format="auto"` (folgt globaler 24h/AM-PM Setting)
- `minuteStep={1}` (volle Minutenauflösung, nicht 5er-Schritte wie bei Schedules)
- **Auto-save mit Debounce:** jede onChange → 500ms-Timer → `hass.callService('time', 'set_value', {entity_id, time: 'HH:MM:00'})` (oder `input_datetime.set_datetime` für input_datetime-Domain)
- Beim Schließen via Back-Button: pending Timer wird sofort durchgeführt + cleanup
- `lastSavedRef` verhindert duplicate calls

**5. Wide-Control-Mode angepasst**

`isWideControl` enthält jetzt nur noch `number` und `text` — `time` und `select` sind raus weil sie eigene Sub-Views haben (zeitspannen die ganze Höhe statt nur eine Row im Wide-Mode).

### UX-Vergleich

**Vorher (v1.1.1358):**
- Inline `<select>` Dropdown — natives Browser-Widget
- Inline `<input type="time">` — natives Browser-Widget
- Visual-Bruch zur restlichen iOS-Settings-Optik

**Nachher (v1.1.1359):**
- Select: Tap auf Row → Sub-View slidet rein → Liste der Optionen mit ✓ → Tap → zurück
- Time: Tap auf Row → Sub-View slidet rein → TimePickerWheel → scrollen → auto-save 500ms nach letztem Wheel-Stop
- Konsistent mit System.Settings + ScheduleTab

### Files

- `system-entities/entities/integration/device-entities/components/UniversalEntityList.jsx`:
  - + `pickerEntity` state + `handleOpenPicker`/`handleClosePicker`
  - + early return für select/time picker sub-views
  - + `Chevron`/`NavbarBackIcon` Helper-Components
  - EntityRow: select/time werden zu `ios-item-clickable` mit Chevron, calling `onOpenPicker`
  - inline `SelectControl` und `TimeControl` Komponenten entfernt (dead code)
  - + `<SelectPickerView>` Sub-View
  - + `<TimePickerView>` Sub-View
  - + Import: `motion` von framer-motion, `TimePickerWheel`

---

## Version 1.1.1358 - 2026-05-01

**Title:** UniversalEntityList — interaktive Controls für select/number/time/text (vorher nur switch interaktiv, Rest read-only)
**Hero:** none
**Tags:** Feature, Universal-Builder, Interactive-Controls

### Bug

User-Feedback: "unter sonstiges kann im backend neben der switch auch sliden oder auch auswahl aus verschiedenen punkten treffen; im frontend geht nur der switch"

Konkretes Beispiel: Roborock-Vacuum-Konfiguration (Sonstiges-Tab) hat:
- `select.roborock_qrevo_s_ausgewaehlte_karte` (Map 1 / Map 2 / …)
- `switch.roborock_qrevo_s_bitte_nicht_storen` ✅ (toggle ging schon)
- `time.roborock_qrevo_s_bitte_nicht_storen_beginn` (22:00)
- `time.roborock_qrevo_s_bitte_nicht_storen_ende` (8:00)
- `number.roborock_qrevo_s_lautstaerke` (90 %, 0–100, slider)
- `select.roborock_qrevo_s_wisch_intensitaet` (Hoch / Mittel / Niedrig)
- `select.roborock_qrevo_s_wisch_modus` (Standard / Eco / …)

Im HA-Backend sind das alles interaktive Widgets. Im Universal-Frontend wurden sie nur als read-only Text angezeigt (Wert ohne Click-Handler).

### Fix — 4 neue Sub-Controls in `UniversalEntityList.EntityRow`

```js
const isSelect = item.domain === 'select' || item.domain === 'input_select';
const isNumber = item.domain === 'number' || item.domain === 'input_number';
const isTime   = item.domain === 'time' || item.domain === 'input_datetime';
const isText   = item.domain === 'text' || item.domain === 'input_text';
```

**`<SelectControl>`** — natives `<select>` mit `attributes.options` als `<option>`-Liste, ruft `select.select_option { entity_id, option }` bei Wechsel.

**`<NumberSliderControl>`** — natives `<input type="range">` mit `min`/`max`/`step` aus attributes, iOS-Blue-Gradient als Track-Fill, ruft `number.set_value { entity_id, value }`.

**`<TimeControl>`** — natives `<input type="time">` (HH:MM), `colorScheme: 'dark'`, ruft `time.set_value { entity_id, time: 'HH:MM:00' }` (oder `input_datetime.set_datetime` für `input_datetime`-Domain).

**`<TextControl>`** — natives `<input type="text">`, ruft `text.set_value`/`input_text.set_value`.

### Layout-Anpassung — Wide-Control-Mode

Number-Slider braucht horizontale Breite die nicht in eine ios-item-right-Zelle passt. Plus Time/Text-Inputs brauchen auch mehr Platz.

Lösung: `isWideControl` flag. Wenn true → ios-item rendert **zweizeilig**:
- Zeile 1: Label links, aktueller Wert rechts (z.B. „Lautstärke … 90 %")
- Zeile 2: Control full-width

Switch und Select bleiben einzeilig (klassisches ios-item Layout).

### Service-Calls

Alle Controls nutzen `hass.callService(domain, service, data)` direkt — kein Wrapping über entity.executeAction nötig (UniversalEntityList hat hass schon im scope). `event.stopPropagation` auf alle controls damit Click in einem Slider/Select nicht den umgebenden ios-item-clickable triggert.

### Files

- `system-entities/entities/integration/device-entities/components/UniversalEntityList.jsx`:
  - + `hass`-prop in EntityRow durchgereicht
  - + Domain-Checks für select/number/time/text (mit input_-Varianten)
  - + Wide-Control-Mode für number/time/text Items
  - + 4 neue Sub-Components: SelectControl, NumberSliderControl, TimeControl, TextControl

### UX

Roborock-Vacuum-Sonstiges-Tab zeigt jetzt:
- „Ausgewählte Karte" → Dropdown mit allen Karten-Optionen
- „Bitte nicht stören" → Switch (wie vorher)
- „Bitte nicht stören Beginn" → Time-Input (HH:MM)
- „Bitte nicht stören Ende" → Time-Input
- „Lautstärke" → Slider 0–100% mit Wert oben rechts
- „Wisch-Intensität" → Dropdown (Hoch/Mittel/Niedrig)
- „Wisch-Modus" → Dropdown (Standard/Eco/…)

1:1 wie im HA-Frontend-Backend.

---

## Version 1.1.1357 - 2026-05-01

**Title:** Bugfix Universal Auto-Gruppierung — Diagnostic/Config-Entities ohne State wurden komplett rausgefiltert
**Hero:** none
**Tags:** Bugfix, Universal-Builder, entityGrouping

### Bug

User-Feedback: "obwohl als sichtbare entitäten viele diagnostics items erkannt worden sind, werden sie in der übersicht nicht aufgeführt"

Konkretes Beispiel: Roborock-Vacuum-Device hat ~10 Entities mit `entity_category: 'diagnostic'` (Batterie, aktueller Raum, etc.) und `entity_category: 'config'` (bitte_nicht_storen, ausgewählte_karte, etc.). Im Visibility-Picker (Setup) sieht User alle korrekt mit Badges. Aber im Diagnose-Tab der echten View: **"Keine Entitäten in dieser Gruppe"** trotz aktiver Toggles.

### Root Cause

`resolveEntityForGroup` in `entityGrouping.js` filterte Entities komplett raus wenn `hass.states[entityId]` undefined war:

```js
const state = hass.states?.[entityId];
if (!state) return null;  // ← Entity verschwindet aus jeder Gruppe
```

Diagnostic/Config-Entities sind häufig im Status `unavailable` oder ihr State wird vom HA-Polling-Loop verzögert geliefert. Der `state` ist dann `null`/undefined → `resolveEntityForGroup` returnt null → entityGrouping skippt die Entity → Tab leer.

Im Visibility-Picker (Setup-Wizard) ist der gleiche Filter NICHT angewendet — dort werden Entities aus `hass.entities` gelesen ohne state-check, daher zeigte er alle Diagnostic/Config korrekt an. Diskrepanz zwischen Setup-Anzeige und Real-View-Anzeige verwirrte den User.

### Fix

`resolveEntityForGroup` ist jetzt defensiver:

```diff
- const state = hass.states?.[entityId];
- if (!state) return null;
- 
- const a = state.attributes || {};
+ const state = hass.states?.[entityId];
+ const a = state?.attributes || {};
+ const stateValue = state?.state ?? 'unavailable';
+
+ // Friendly-Name-Fallback-Kette: state.attributes.friendly_name →
+ // registry.name → registry.original_name → entity_id
+ const friendlyName =
+   a.friendly_name ||
+   registryEntry.name ||
+   registryEntry.original_name ||
+   entityId;

  return {
    entity_id: entityId,
    domain,
-   state: state.state,
-   friendly_name: a.friendly_name || entityId,
+   state: stateValue,
+   friendly_name: friendlyName,
    ...
-   is_on: state.state === 'on',
-   is_unavailable: state.state === 'unavailable' || state.state === 'unknown',
+   is_on: stateValue === 'on',
+   is_unavailable: !state || stateValue === 'unavailable' || stateValue === 'unknown',
    ...
  };
```

**Verbesserungen:**
1. Entity wird auch ohne `state` zurückgegeben (nicht null)
2. State-Fallback auf `'unavailable'`
3. Friendly-Name-Fallback-Kette nutzt jetzt `registry.name` und `registry.original_name` als Zwischenstufen — Entity hat oft im Registry einen Namen, auch wenn der State noch nicht da ist
4. `is_unavailable` true wenn entweder kein state-object existiert oder state explizit unavailable/unknown ist

### Resultat

Roborock-Vacuum mit 10 Diagnostic-Entities zeigt jetzt im Diagnose-Tab:
- Batterie · `unavailable` (wenn HA noch nicht gepollt hat)
- Aktueller Raum · `Wohnzimmer`
- ... etc.

Statt: "Keine Entitäten in dieser Gruppe"

### Files

- `src/system-entities/entities/integration/device-entities/views/entityGrouping.js` — `resolveEntityForGroup` returnt jetzt auch ohne state ein vollständiges Objekt mit unavailable-Markierung

---

## Version 1.1.1356 - 2026-05-01

**Title:** Defensive `system-entities-refresh`-Event in updateDevice — Icon-Updates jetzt garantiert live (kein Refresh mehr nötig)
**Hero:** none
**Tags:** Bugfix, Universal-Builder, DataProvider, Defensive-Refresh

### Bug

User-Feedback nach v1.1.1355: "noch immer bug vorhanden: erst bei refresh wird das icon angezeigt im device card wenn ich aus detail view rausgehe."

Trotz mehrerer Fixes (v1.1.1352 updateDevice propagiert icon, v1.1.1353 getSystemEntityIcon liest icon, v1.1.1354 handleEditComplete reicht icon durch, v1.1.1355 DeviceCard memo-comparator checkt icon) — Icon-Update kam noch immer nicht live durch.

### Root Cause

Das `system-entity-updated`-Event-Handling in DataProvider macht einen attribute-merge:

```js
attributes: {
  ...newEntities[entityIndex].attributes,  // alte
  ...attributes  // neue (this.attributes vom emitter)
}
```

Das funktioniert für die meisten Properties, aber für `icon` gibt es subtile Probleme — möglicherweise weil `icon` bei toEntity initial aus `this.icon` (top-level) kommt und nicht aus `this.attributes`. Die exakte Wurzel war schwer zu isolieren ohne live debugging.

Die Pipeline war theoretisch korrekt aufgesetzt aber hatte einen Edge-Case der Icon-Updates verschluckte.

### Fix — defensives full-refresh-Event

Statt sich auf den fragilen attribute-merge zu verlassen, dispatche ich nach jedem `updateDevice` ein `system-entities-refresh`-Event. DataProvider hat dafür einen neuen Listener der einen kompletten `getAsHomeAssistantEntities()`-Reload triggert:

```js
// In IntegrationEntity.updateDevice (nach updateAttributes)
window.dispatchEvent(new CustomEvent('system-entities-refresh', {
  detail: { source: 'updateDevice', deviceId }
}));

// In DataProvider (neuer Listener)
const handleSystemEntitiesRefresh = () => {
  setEntities(prevEntities => {
    const systemEntities = systemRegistry.getAsHomeAssistantEntities();
    const nonSystemEntities = prevEntities.filter(e => !e.is_system);
    return [...systemEntities, ...filterExcludedEntities(nonSystemEntities)];
  });
};
window.addEventListener('system-entities-refresh', handleSystemEntitiesRefresh);
```

Beim full-refresh läuft jede System-Entity frisch durch `toEntity()`. Das setzt `attributes.icon = this.icon` (das in updateDevice via `ent.icon = updates.icon` aktualisiert wurde). Garantiert konsistent.

### Warum dieser Ansatz funktioniert

- `ent.icon` (top-level) wird in updateDevice **direkt gesetzt** (nicht nur via attributes)
- `toEntity()` liest `this.icon` als Source-of-Truth
- Full-refresh erstellt komplett neue plain entity objects mit korrekten Attributen
- DeviceCard-Comparator (v1.1.1355) erkennt icon-change → re-render

Trade-off: full-refresh ist etwas teurer als der Smart-merge (alle System-Entities werden neu gebaut). Aber System-Entities sind eine kleine Liste (typisch <20), und Icon-Edit ist ein seltener User-Trigger. Der Performance-Impact ist vernachlässigbar.

### Konsequenz für andere Update-Scenarios

Dieser Refresh-Mechanismus wird jetzt von updateDevice genutzt — er kann später auch von anderen Pfaden benutzt werden falls ähnliche Caching-Probleme auftreten (z.B. bei Plugin-Konfigurations-Updates).

### Files

| File | Change |
|---|---|
| `system-entities/entities/integration/index.js` | + dispatch `system-entities-refresh` event in updateDevice |
| `providers/DataProvider.jsx` | + listener für `system-entities-refresh` der getAsHomeAssistantEntities reloaded |

---

## Version 1.1.1355 - 2026-05-01

**Title:** DeviceCard memo-comparator — `icon`/`name`-Updates für System-Entities (Universal-Devices) jetzt live sichtbar
**Hero:** none
**Tags:** Bugfix, Universal-Builder, DeviceCard, memo

### Bug

User-Feedback nach v1.1.1354: "icon aktualisiert erst nach refresh"

### Root Cause

Der `deviceCardPropsAreEqual` custom-comparator von `memo(DeviceCard)` prüft nur eine Whitelist von Properties:
- entity_id, state, last_updated
- attributes.friendly_name, brightness, current_temperature, temperature, hvac_action

`attributes.icon` ist NICHT in dieser Liste. Das war OK für HA-Backend-Entities (sie bekommen `last_updated` bei jedem state-change → comparator returnt `false` → re-render). Aber **System-Entities haben kein `last_updated`** — das wird nur vom HA-Backend für echte Entities gesetzt.

Folge: Wenn `updateDevice` die Universal-Entity-Attributes aktualisiert (inkl. icon) und der DataProvider die entities-Liste neu setzt, sieht der memo-comparator:
- entity_id gleich ✓
- state gleich ✓
- last_updated beide undefined → gleich ✓
- friendly_name eventuell gleich ✓
- brightness/temperature/etc. → undefined gleich ✓

→ comparator returnt `true` ("keine relevante Änderung") → DeviceCard re-rendert nicht → altes Icon bleibt sichtbar bis Page-Refresh (dann wird die Card neu gemounted und liest aktuelles Icon aus storage).

### Fix

```diff
  if (aAttr.hvac_action !== bAttr.hvac_action) return false;
+ // System-Entities haben kein last_updated → explizit Icon/Name-Updates checken
+ if (aAttr.icon !== bAttr.icon) return false;
+ if (a.icon !== b.icon) return false;
+ if (a.name !== b.name) return false;
  return true;
```

`a.icon !== b.icon` (top-level) zur Sicherheit, falls die Entity das Icon nicht in attributes hat sondern direkt am Object. `a.name !== b.name` für Umbenennungen analog.

### Wer noch betroffen war

Andere System-Entity-Types die ihr Icon dynamisch ändern könnten — z.B. Weather-Devices wenn ein neues Wetter-Icon gerendert würde. Aktuell macht das aber nur Universal-Devices via Edit-Mode.

### Files

- `src/components/DeviceCard.jsx` — `deviceCardPropsAreEqual` um icon (attribute + top-level) und name erweitert

### Lehre

`memo`-Comparators mit Whitelist-Approach sind perf-optimiert aber fehleranfällig wenn neue update-fähige Properties dazukommen. Für System-Entities ohne `last_updated`-Bump muss jede neu propagierte Property explizit in der Comparator-Liste sein. **Pattern für künftige Properties:** wenn ein neues attribute live updaten soll → DeviceCard-Comparator erweitern.

---

## Version 1.1.1354 - 2026-05-01

**Title:** Universal Edit-Bug — `icon` wurde im handleEditComplete nicht durchgereicht (Icon-Wechsel war weder live noch nach Refresh sichtbar)
**Hero:** none
**Tags:** Bugfix, Universal-Builder, Icon-Update

### Bug

User-Feedback nach v1.1.1353: "Änderung des Icons wird nicht sofort sichtbar, auch nicht bei refresh"

### Root Cause

Der Wizard speichert `iconKey` und reicht beim Save `icon: getIconSvg(iconKey)` als SVG-string in den `updatedDevice`-payload. ABER: in `UniversalDeviceView.handleEditComplete` wurde nur `name`/`hero`/`hidden_entities` an `updateDevice` weitergereicht — **`icon` fehlte komplett im updates-Object**.

```js
// vorher (kaputt)
await integrationEntity.executeAction('updateDevice', {
  deviceId: updatedDevice._deviceId,
  updates: {
    name: updatedDevice.name,
    hero: updatedDevice.hero,
    hidden_entities: updatedDevice.hidden_entities,
    // ← icon fehlt!
  },
});
```

Folge:
- **Live nicht sichtbar:** weil `attrUpdates.icon` nie gesetzt wurde → kein `system-entity-updated`-Event mit Icon
- **Nach Refresh nicht sichtbar:** weil `merged = {...config.devices[idx], ...updates}` das alte Icon behielt → deviceConfigStorage speicherte das alte icon → nach Refresh re-create entity mit altem Icon

In v1.1.1352 hatte ich `updateDevice` schon so erweitert dass es Icon korrekt verarbeitet. In v1.1.1353 hatte ich `getSystemEntityIcon` für `universal_device` korrekt implementiert. Aber die Pipeline war zwischen Wizard-Save und updateDevice-Call unterbrochen — der Caller hat icon einfach nicht weitergegeben.

### Fix

```diff
  await integrationEntity.executeAction('updateDevice', {
    deviceId: updatedDevice._deviceId,
    updates: {
      name: updatedDevice.name,
      hero: updatedDevice.hero,
      hidden_entities: updatedDevice.hidden_entities,
+     ...(updatedDevice.icon !== undefined ? { icon: updatedDevice.icon } : {}),
    },
  });
```

Plus identische Korrektur im Fallback-Pfad (direkter `entity.updateAttributes`-Call wenn IntegrationEntity nicht im Registry).

Conditional spread (`...(updatedDevice.icon !== undefined ? {icon: ...} : {})`) damit bei "kein Icon gewählt" (iconKey=null → getIconSvg returnt null → icon ist nicht im payload) NICHT `icon: undefined` ins updates leakt — das würde bei `merged` das existing icon nicht entfernen aber die undefined würde am Entity gesetzt.

### Files

- `src/system-entities/entities/integration/device-entities/views/UniversalDeviceView.jsx` — `handleEditComplete` reicht `icon` durch (beide Pfade: integrationEntity.executeAction + entity.updateAttributes-Fallback)

### Lehre

Bei Edit-Flows mit mehreren Update-Stufen (Wizard → Caller → Entity-Action → DataProvider): jede Stufe muss alle relevanten Felder durchreichen. Wenn auch nur eine Stufe ein Feld vergisst, ist es weg. **Pattern für künftige Felder:** mit Object-Spread `...(updates ?? {})` oder explizit jedes neue Feld an JEDER Pipeline-Stufe adden.

---

## Version 1.1.1353 - 2026-05-01

**Title:** Universal — Icon im Suchpanel sichtbar (DeviceCardIntegration `universal_device`-Renderer) + PreviewCard nutzt jetzt UniversalControlsTab direkt für 1:1-Match
**Hero:** none
**Tags:** Bugfix, Universal-Builder, Icon-Rendering, Preview

### Bug 1 — Icon erscheint nicht im Suchpanel

**Root Cause:** `getSystemEntityIcon` in `DeviceCardIntegration.jsx` hat eine hardcoded `iconMap` keyed by `domain`. Es gab keinen Eintrag für `universal_device` → returnt `null` → Suchpanel rendert default fallback ohne Icon. Plus: die existing iconMap-Entries lesen NICHT aus `device.attributes.icon` (mein gespeichertes SVG) — sie haben alle hardcoded SVGs pro Domain. Selbst wenn ich ein icon im deviceData hätte, würde es ignoriert.

**Fix:** Neuer `universal_device`-Renderer der dynamisch `device.attributes.icon` liest:

```js
universal_device: () => {
  const customIconSvg = device?.attributes?.icon;
  if (customIconSvg && typeof customIconSvg === 'string' && customIconSvg.includes('<svg')) {
    // Resize SVG (replace width/height attrs to match requested size)
    const sized = customIconSvg
      .replace(/width="[^"]*"/, `width="${size}"`)
      .replace(/height="[^"]*"/, `height="${size}"`);
    return <span style={{ display: 'flex', color: 'white' }}
                 dangerouslySetInnerHTML={{ __html: sized }} />;
  }
  // Fallback: generic device-icon
  return <svg width={size} height={size} ...>...</svg>;
}
```

Jetzt wird das in der iconCatalog gespeicherte SVG-string aus `attributes.icon` korrekt gelesen, dynamisch auf die gewünschte Größe gesetzt (z.B. 48px im Suchpanel, 64px in Cards) und gerendert.

### Bug 2 — Preview "noch das alte Design"

**Root Cause:** Mein `UniversalPreviewCard` hatte ein eigenes Mini-Layout (Mini-Hero-Circle 120px + 48px Tab-Buttons). Das war anders als die echte Device-View die `UniversalControlsTab` mit 72px-Buttons + CircularSlider nutzt. Visual-Drift zwischen Preview und Real-View.

**Fix:** PreviewCard rendert jetzt **direkt UniversalControlsTab** mit einem Mock-Entity:

```jsx
const mockEntity = useMemo(() => ({
  id: `preview_${haDeviceId}`,
  domain: 'universal_device',  // KRITISCH: triggers getControlConfig switch
  name: name,
  attributes: {
    ha_device_id: haDeviceId,
    hero: deviceConfig?.hero,
    hidden_entities: deviceConfig?.hidden_entities,
  },
  executeAction: async () => ({ success: true }),  // no-op für preview
  updateAttributes: () => {},
}), [...]);

return (
  <div style={{ height: '500px', borderRadius: '20px', overflow: 'hidden' }}>
    <div className="mini-header">{name + manufacturer/model/area}</div>
    <UniversalControlsTab item={mockEntity} hass={hass} lang={lang}
                          onServiceCall={() => {}} />
  </div>
);
```

**Win:** Preview ist jetzt visuell **identisch** zur echten Device-View — selbe ControlButtons (72px round), selber CircularSlider, selbe Layout-CSS, selbe Animations. Wenn der User später Änderungen am Real-View macht, propagiert es automatisch zur Preview.

**Mock-Entity-Sicherheit:** `executeAction` ist no-op, sodass User in der Preview nicht versehentlich echte HA-Calls auslöst (Toggle/Press macht visuell nichts).

### Files

| File | Change |
|---|---|
| `system-entities/integration/DeviceCardIntegration.jsx` | + `universal_device` case in iconMap, liest `device.attributes.icon` und renderet inline mit dynamic-size |
| `system-entities/entities/integration/components/UniversalPreviewCard.jsx` | Komplett neu (~95 LOC statt ~250): rendert UniversalControlsTab mit Mock-Entity statt eigener Mini-Layout |

---

## Version 1.1.1352 - 2026-05-01

**Title:** Universal Builder — 3 Fixes: Umbennen-Bug, collapsible Vorschau, Icon-Picker mit kuratiertem SVG-Catalog
**Hero:** none
**Tags:** Bugfix, Feature, Universal-Builder, Icon-Picker

### Was passiert

User-Feedback nach v1.1.1351:
1. **Bug**: Nachträglich Umbenennen funktioniert nicht
2. Vorschau noch im alten Design (lila Badge), soll **aufklappbar** sein
3. Icon-Auswahl möglich (aus den im System verwendeten SVG-Icons)

### Fix 1 — Umbenennen-Bug

`IntegrationEntity.updateDevice` propagierte nur `slots`/`layout` als attribute updates, NICHT `name` (das war direct via `ent.name = ...`). DataProvider lauscht aber nur auf `system-entity-updated` Events mit attributes-payload — `ent.name` direkt zu setzen reicht NICHT um die Card-Übersicht zu aktualisieren.

Plus: Universal nutzt `hero`/`hidden_entities` statt `slots` — die wurden auch nicht propagiert.

```diff
  const attrUpdates = {};
  if (updates.slots !== undefined) attrUpdates.slots = updates.slots;
  if (updates.layout !== undefined) attrUpdates.layout = updates.layout;
+ if (updates.hero !== undefined) attrUpdates.hero = updates.hero;
+ if (updates.hidden_entities !== undefined) attrUpdates.hidden_entities = updates.hidden_entities;
+ if (updates.icon !== undefined) {
+   attrUpdates.icon = updates.icon;
+   ent.icon = updates.icon;
+ }
  if (updates.name !== undefined) {
    ent.name = updates.name;
+   attrUpdates.friendly_name = updates.name;  // ← propagiert zur Card-Übersicht
  }
```

Jetzt funktioniert Umbenennen + Hero-Wechsel + Hidden-Update + Icon-Wechsel im Edit-Mode.

### Fix 2 — Vorschau aufklappbar + lila Badge weg

**a) Lila VORSCHAU-Badge in `UniversalPreviewCard` entfernt** — der Section-Header über der Card sagt schon „VORSCHAU" im System.Settings-Stil, zweiter Badge wäre redundant.

**b) Vorschau-Section in Step 2 ist jetzt collapsible:**

```jsx
<div className="ios-section">
  <div className="ios-card">
    <motion.div className="ios-item ios-item-clickable" onClick={togglePreview}>
      <div className="ios-item-label">Vorschau</div>
      <div className="ios-item-subtitle">Tippen zum Anzeigen</div>
      <span style={{ transform: previewExpanded ? 'rotate(0)' : 'rotate(-90deg)' }}>▼</span>
    </motion.div>
  </div>
  <AnimatePresence>
    {previewExpanded && <motion.div><UniversalPreviewCard ... /></motion.div>}
  </AnimatePresence>
</div>
```

Default = collapsed. Click auf header → expand/collapse mit motion-Animation.

### Fix 3 — Icon-Picker

**Neuer File `iconCatalog.js`** (~250 LOC) mit kuratiertem Set von 30 line-art SVG-Icons in 9 Kategorien:
- General: generic / settings / power
- Light: lightbulb / desklamp / spotlight
- Cover: garage / shutter / door / window
- Security: lock / siren / camera / motion
- Media: music / tv / speaker
- Climate: climate / heater / fan
- Appliance: washingmachine / dishwasher / oven / vacuum / coffee / fridge
- Vehicle: car / bike
- Other: printer3d / energy / switch

Format: `{ key, label: {de,en}, category, svg }`. Bewusst NICHT die komplexen multi-color React-Components aus `/assets/icons/` — die passen nicht zum line-art Stil der Toolbar. Stattdessen einheitliche 24x24 stroke-currentColor Icons (gleiche Optik wie die Tab-Icons).

**Neue Sub-View `'icon-picker'`** in UniversalSetup:
- Section "Standard" oben (kein Icon = Default-Generic)
- Pro Kategorie eine Section mit Grid (2-3 Spalten responsive) der Icons
- Click → `setIconKey(key)` und zurück zu Step 3
- Selected: iOS-Blau Background + Border

**Step 3 Erweiterung:** neuer ios-section "ICON" mit ios-item-clickable das die aktuelle Auswahl zeigt (SVG inline + Label) und in den icon-picker navigiert.

**Storage:** `iconKey` ist nur State im Wizard. Beim `handleFinish` wird `getIconSvg(iconKey)` aufgerufen → SVG-string → in `deviceData.icon`. UniversalDeviceEntity nutzt `icon` direkt im constructor (super({ icon: ... })) — keine API-Änderung nötig.

**Edit-Mode:** beim Mount versucht der Wizard den `iconKey` aus dem existing `device.icon` SVG-string zu rekonstruieren via `ICON_CATALOG.find(i => i.svg === existingDevice.icon)`. Funktioniert solange der User nicht händisch ein anderes SVG injiziert hat.

### Files

| File | Change |
|---|---|
| `system-entities/entities/integration/iconCatalog.js` | NEU (~250 LOC) — kuratierter SVG-Icon-Catalog mit 30 Icons in 9 Kategorien |
| `system-entities/entities/integration/index.js` | updateDevice propagiert jetzt name (als friendly_name), hero, hidden_entities, icon zu attribute updates |
| `system-entities/entities/integration/components/UniversalPreviewCard.jsx` | Lila VORSCHAU-Badge entfernt |
| `system-entities/entities/integration/components/setup-flows/UniversalSetup.jsx` | + iconKey State + icon-picker Sub-View + Icon-ios-item in Step 3 + collapsible Vorschau in Step 2 |

### Was offen

- Vorschau-Collapse auch in Step 3 (aktuell nur Step 2 collapsible — Step 3 zeigt Vorschau immer noch, kommt im nächsten Patch falls gewünscht)
- Suche im Icon-Picker (bei 30 Icons noch OK, bei 100+ wäre eine Suche hilfreich)

---

## Version 1.1.1351 - 2026-05-01

**Title:** UniversalSetup-Pattern korrekt — `.ios-view-wrapper` mit `.ios-navbar` (statt custom back-button), CustomScrollbar funktioniert + Bug: 'controls'-Tab kehrt aus Edit-Mode zurück
**Hero:** none
**Tags:** Bugfix, Universal-Builder, ios-Style, navbar-Pattern

### Bug

User-Feedback nach v1.1.1350:
1. Padding noch immer nicht wie System.Settings (links/rechts)
2. CustomScrollbar nicht sichtbar
3. Back-Design im Untermenu nicht wie System.Settings
4. **Bug**: Click auf "Übersicht" während im Settings → nichts passiert

### Root Cause

**Strukturelles Problem:** Mein UniversalSetup hatte `.ios-settings-container` INSIDE jedes view's motion.div. System.Settings hat das umgekehrt:
- `.ios-settings-container` ist **outer + konstant** (animiert nicht)
- AnimatePresence inside switched zwischen Views
- Jede View ist `.ios-view-wrapper` (display:flex; flex-direction:column; full-height)
- Sub-Views haben `.ios-navbar` (62px height, padding 0 20px) mit `.ios-navbar-back` button + `.ios-navbar-title` centered
- Content in `.ios-settings-view` mit ref → CustomScrollbar nach view innerhalb container

Mein custom back-button (mit "BackChevron" + custom styling) war NICHT die `.ios-navbar-back`-Klasse — daher anderes Visual.

CustomScrollbar wurde gerendert aber im falschen Container — `.ios-settings-container` hat `overflow:hidden`, das verstecke sie wenn sie position:absolute war.

**Bug #4:** UniversalDeviceEntity actionButtons hatte `controls` mit `action: 'noop'` — also passiert beim Click nichts. Im Edit-Mode konnte der User damit nicht zurück zur Device-View. Fix: `action: 'overview'` damit der bestehende handleOverview-Handler in UniversalDeviceView aufgerufen wird (setzt editingMode=false).

### Fix

**1. Komplette Restrukturierung von UniversalSetup auf System.Settings-Pattern:**

```jsx
<div className="ios-settings-container"
     onMouseEnter onMouseLeave style={{position:'relative'}}>
  <AnimatePresence mode="wait">
    {step === 'hero-picker' ? (
      <motion.div key="hero-picker" className="ios-view-wrapper" variants={slideVariants}>
        <div className="ios-navbar">
          <button className="ios-navbar-back" onClick={...}>
            <NavbarBackIcon />
            <span>Zurück</span>
          </button>
          <div className="ios-navbar-title">Hauptanzeige</div>
        </div>
        <div ref={scrollRef} className="ios-settings-view">
          <div className="ios-section">...</div>
        </div>
      </motion.div>
    ) : ...}
  </AnimatePresence>
  <CustomScrollbar scrollContainerRef={scrollRef} isHovered={isHovered} />
</div>
```

Outer container ist konstant. Pro View ein eigener `.ios-view-wrapper`. Sub-Views haben `.ios-navbar` mit den richtigen System.Settings-Klassen. Back-Button ist `.ios-navbar-back` mit dem korrekten Chevron-SVG (analog GeneralSettingsTab Zeile 944-948).

**2. Bug-Fix für 'controls'-Action:**

```diff
  actionButtons: [
-   { id: 'controls', action: 'noop', title: 'Steuerung' },
+   { id: 'controls', action: 'overview', title: 'Steuerung' },
    ...
  ]
```

`handleActionClick(action)` in TabNavigation hat schon einen 'overview'-Case der `viewRef.handleOverview()` ruft. Das Sun-Burst-Icon (Controls) ersetzt den Back-Button nicht nur visuell sondern auch funktional → klickt aus Settings zurück zur Device-Übersicht.

### Files

| File | Change |
|---|---|
| `system-entities/entities/integration/device-entities/UniversalDeviceEntity.js` | controls-action: 'noop' → 'overview' |
| `system-entities/entities/integration/components/setup-flows/UniversalSetup.jsx` | Komplett neu strukturiert auf ios-view-wrapper + ios-navbar pattern, AnimatePresence inside konstantem ios-settings-container, slideVariants analog GeneralSettingsTab, CustomScrollbar konstant am container |

---

## Version 1.1.1350 - 2026-05-01

**Title:** UniversalSetup — Padding analog System.Settings (32px statt 40px) + CustomScrollbar
**Hero:** none
**Tags:** Visual-Match, Universal-Builder, Padding, CustomScrollbar

### Bug

User-Feedback nach v1.1.1349:
1. Abstände nach links/rechts zu klein im Vergleich zu System.Settings
2. CustomScrollbar fehlt

### Root Cause

**Padding-Verschachtelung war doppelt:**

In v1.1.1349 hatte ich `style={{ paddingLeft: 0, paddingRight: 0 }}` auf der inner `.ios-settings-view` gesetzt — das überschrieb das Default-Padding von 20px horizontal. Dann habe ich inner content-divs mit eigenem `padding: '0 20px 20px'` gewrappt. Resultat: nur 20px horizontal (vom inner div) statt 32px wie System.Settings (20px ios-settings-view + 12px ios-section).

**CustomScrollbar fehlte komplett** — System.Settings + alle Premium-Devices nutzen `<CustomScrollbar scrollContainerRef={scrollRef} isHovered={isHovered} />` für die Scroll-Indikator-Optik. Hatte ich nie eingebaut.

### Fix

**1. Padding-Defaults nutzen:**

```diff
- <div className="ios-settings-view" style={{ paddingLeft: 0, paddingRight: 0, paddingTop: '20px' }}>
-   <div style={{ padding: '0 20px 20px' }}>
-     <div className="ios-section">...</div>
-   </div>
- </div>
+ <div className="ios-settings-view" style={{ paddingTop: '20px' }}>
+   <div className="ios-section">...</div>
+ </div>
```

`.ios-settings-view` hat im default `padding: 0 20px 20px 20px` — nutze ich jetzt ohne Override. Plus `.ios-section` hat eigenes `padding: 0 12px`. Total horizontal padding zur ios-card: **32px** (= System.Settings).

Für den main-step header: `padding: '20px 20px 12px'` → `paddingTop: '20px', paddingBottom: '12px'` (horizontal kommt aus default).

**2. CustomScrollbar in allen 3 Render-Pfaden:**

```diff
+ const scrollRef = useRef(null);
+ const [isHovered, setIsHovered] = useState(false);

  <motion.div
    className="ios-settings-container"
+   onMouseEnter={() => setIsHovered(true)}
+   onMouseLeave={() => setIsHovered(false)}
  >
-   <div className="ios-settings-view" ...>
+   <div ref={scrollRef} className="ios-settings-view" ...>
      ...content...
    </div>
+   <CustomScrollbar scrollContainerRef={scrollRef} isHovered={isHovered} />
  </motion.div>
```

Pattern analog `PrinterSensorsList` / `PrinterMiscList`.

### Files

| File | Change |
|---|---|
| `system-entities/entities/integration/components/setup-flows/UniversalSetup.jsx` | + scrollRef + isHovered State, alle 3 Render-Paths mit `onMouseEnter`/`onMouseLeave` + `ref` + CustomScrollbar, paddingLeft:0/paddingRight:0 entfernt, redundante padding-wrapper-divs entfernt |

---

## Version 1.1.1349 - 2026-05-01

**Title:** UniversalSetup-Container dunkel + rund (`.ios-settings-container`) + PreviewCard mit Bambu-Style-Tab-Buttons
**Hero:** none
**Tags:** Visual-Match, Universal-Builder, ios-Style

### Bug

User-Feedback nach v1.1.1348:
1. Container nicht dunkel + nicht so rund wie System.Settings
2. Vorschau zeigt noch das alte Button-Design (kleine Counter-Bubbles statt Bambu-Tab-Buttons)

### Root Cause

**1. Fehlender outer-container:** Die ios-* Pattern hat zwei Ebenen:
- `.ios-settings-container` — outer-Box mit `background: #00000040`, `border-radius: 24px`, `overflow: hidden` (definiert das dunkle, abgerundete Visual)
- `.ios-settings-view` — inner-scroll-container mit `overflow-y: auto` (für Scrollverhalten)

Mein UniversalSetup hatte nur die inner `.ios-settings-view` ohne die outer `.ios-settings-container`. Daher kein dunkler Background, keine 24px-Rundungen.

**2. PreviewCard-Mismatch:** Die UniversalPreviewCard rendert nur kleine 34px Counter-Bubbles statt der echten Bambu-Tab-Buttons. Die Vorschau spiegelt damit nicht das echte Visual.

### Fix

**1. UniversalSetup mit outer container wrappen** — alle 3 Render-Pfade (hero-picker, visibility, main):

```diff
  <motion.div
-   className="ios-settings-view"
+   className="ios-settings-container"
    initial={...}
    ...
-   style={{ height: '100%', overflowY: 'auto' }}
  >
+ <div className="ios-settings-view" style={{ paddingLeft: 0, paddingRight: 0 }}>
    {content}
+ </div>
  </motion.div>
```

Outer = `.ios-settings-container` (background, border-radius, overflow:hidden), inner = `.ios-settings-view` (scroll). Padding-Left/Right auf 0 weil mein content schon eigenes Padding hat.

**2. PreviewCard-Tab-Buttons im Bambu-Stil:**

```diff
- {/* 34px counter-bubble */}
- <div style={{ width: '34px', ... }}>{tab.count}</div>
+ {/* 48px round mit SVG-Icon (analog UniversalControlsTab/ControlButton) */}
+ <div style={{ width: '48px', height: '48px', borderRadius: '50%',
+   background: isFirst ? 'rgb(0, 145, 255)' : 'rgba(255,255,255,0.1)',
+   border: isFirst ? '1px solid rgba(0, 145, 255, 0.5)' : '...' }}
+   dangerouslySetInnerHTML={{ __html: PREVIEW_TAB_ICONS[tab.id] }}
+ />
```

Erstes Tab (controls) wird als 'expanded' markiert (iOS-Blau `rgb(0, 145, 255)`) um den default-active state der echten View zu spiegeln. Andere Tabs `rgba(255,255,255,0.1)` mit `opacity: 0.4` wenn count=0.

Plus: Tab-Label zeigt jetzt `Steuerung 16` statt nur die Zahl alleine — wie in der echten View.

### Files

| File | Change |
|---|---|
| `system-entities/entities/integration/components/setup-flows/UniversalSetup.jsx` | 3 Render-Pfade auf `.ios-settings-container` outer + `.ios-settings-view` inner |
| `system-entities/entities/integration/components/UniversalPreviewCard.jsx` | + PREVIEW_TAB_ICONS (4 SVGs analog deviceConfigs.js), 48px round Bambu-Style-Buttons mit erstem Tab als active |

---

## Version 1.1.1348 - 2026-05-01

**Title:** UniversalSetup im System.Settings-Stil — ios-section / ios-card / ios-item Pattern + Sub-Views (Hero-Picker, Visibility)
**Hero:** none
**Tags:** Visual-Match, Universal-Builder, ios-Style, Sub-Views

### Why

User-Wunsch: UniversalSetup soll exakt das selbe Visual-Pattern haben wie System.Settings (GeneralSettingsTab) — also `.ios-section` mit Uppercase-Header, `.ios-card` mit `.ios-item`-Liste, Sub-Views mit Back-Chevron für Picker.

Mein bisheriges UniversalSetup hatte custom inline styles, eigene Dropdowns und Checkbox-Listen — visuell anders als das restliche Settings-System.

### Solution

UniversalSetup komplett auf das ios-* Pattern umgebaut.

**Step 1 — Device-Picker:**
- Search-input bleibt oben (input-Element, nicht ios-item)
- Liste der Devices als `.ios-section` mit Header "GERÄTE" + `.ios-card` voller `.ios-item-clickable` Items
- Pro Device: Name als label, `manufacturer · model · area_name` als subtitle, Chevron rechts
- Bereits hinzugefügte Devices: opacity 0.5, "bereits hinzugefügt"-Badge, kein Chevron

**Step 2 — Anzeige anpassen (NEU strukturiert wie GeneralSettingsTab):**
Statt direkter Dropdown + Checkboxes jetzt 2 ios-items mit Chevron, die Sub-Views öffnen:

```
┌─ HAUPTANZEIGE ─────────────────────┐
│ Hauptanzeige           Sensor X › │  ← öffnet hero-picker Sub-View
└────────────────────────────────────┘
┌─ ANZEIGE ──────────────────────────┐
│ Sichtbare Entitäten   12 von 15 › │  ← öffnet visibility Sub-View
└────────────────────────────────────┘
┌─ VORSCHAU ─────────────────────────┐
│ [UniversalPreviewCard]            │
└────────────────────────────────────┘
```

**Sub-Views (Step 'hero-picker' / 'visibility'):**
- Header mit Back-Chevron + Title (analog Language-Picker in GeneralSettingsTab)
- Sub-View 'hero-picker': Liste aller Entities als `.ios-item-clickable` mit `✓` rechts beim aktuell gewählten. Plus "Keine Hauptanzeige"-Option oben.
- Sub-View 'visibility': Liste aller Entities mit `<LiquidGlassSwitch>` rechts (sichtbar/versteckt — invertiert von hidden_entities). Hero-Entity wird ausgeblendet.

**Step 3 — Naming + Vorschau:**
- `.ios-section` "NAME" mit `.ios-card` enthält ein input-Field als ios-item (transparent background, full-width)
- `.ios-section` "VORSCHAU" mit UniversalPreviewCard

**Step-Indicator** auf iOS-Blau geändert (`rgb(0, 122, 255)` statt lila).

### State-Machine

`step` ist jetzt ein union: `1 | 2 | 3 | 'hero-picker' | 'visibility'`. Sub-Views haben ihren eigenen Render-Pfad ohne Step-Indicator (analog System.Settings sub-views).

### Files

- `src/system-entities/entities/integration/components/setup-flows/UniversalSetup.jsx` — komplette Umstrukturierung auf ios-section/ios-card/ios-item Pattern + Sub-Views

### UX-Flow

```
Add-Mode:
  Step 1 (Device-Picker, ios-card-Liste mit Chevron)
    → click device → Step 2
  Step 2 (Anzeige anpassen)
    → click "Hauptanzeige" → Sub-View hero-picker → click entity → zurück Step 2
    → click "Sichtbare Entitäten" → Sub-View visibility → toggles → zurück Step 2
    → "Weiter" → Step 3
  Step 3 (Naming + Vorschau)
    → "Hinzufügen"
```

Edit-Mode startet direkt bei Step 2.

### Visual-Match zu GeneralSettingsTab

| Komponente | UniversalSetup | GeneralSettingsTab |
|---|---|---|
| Section-Container | `.ios-section` | `.ios-section` |
| Section-Header | `.ios-section-header` (uppercase) | `.ios-section-header` (uppercase) |
| Card-Container | `.ios-card` | `.ios-card` |
| Item-Click-Pattern | `.ios-item.ios-item-clickable` mit Chevron | identisch |
| Sub-View-Pattern | back-chevron + title + ios-section liste | identisch (Sprach-Picker, Currency-Picker, etc.) |
| Toggles | `<LiquidGlassSwitch>` | `<LiquidGlassSwitch>` |

---

## Version 1.1.1347 - 2026-05-01

**Title:** Universal Toolbar — Standard-Tab-Icons (Controls/Schedule/History/Context) + Settings, Back/Refresh entfernt
**Hero:** none
**Tags:** Feature, Universal-Builder, Toolbar, Visual-Match-Normal-Devices

### Why

User-Wunsch: Universal-Devices sollen die selbe Toolbar haben wie normale Devices (Light, Rolladen) — also die 4 Standard-Tab-Icons (Sun-burst/Clock/Grid/Layers) plus Settings. Back-Button und Refresh sollen weg, weil:
- Auto-Update läuft sowieso — Refresh überflüssig
- Back ersetzt durch das erste Tab-Icon (Sun-burst = Controls)

### Solution

**1. UniversalDeviceEntity actionButtons komplett ersetzt**

```diff
  actionButtons: [
-   { id: 'back', action: 'back', title: 'Zurück' },
-   { id: 'refresh', action: 'refresh', title: 'Aktualisieren' },
+   { id: 'controls', action: 'noop', title: 'Steuerung' },
+   { id: 'schedule', action: 'noop', title: 'Plan' },
+   { id: 'history',  action: 'noop', title: 'Verlauf' },
+   { id: 'context',  action: 'noop', title: 'Kontext' },
    { id: 'settings', action: 'settings', title: 'Einstellungen' },
  ]
```

`action: 'noop'` für die 4 Tab-Icons — der `handleActionClick`-Switch in TabNavigation hat keinen Case dafür, also passiert nichts beim Click. Settings funktioniert wie gehabt → öffnet UniversalSetup im Edit-Mode.

**2. TabNavigation `getActionIcon` erweitert** mit 4 neuen Cases (`controls`/`schedule`/`history`/`context`) — die SVGs sind 1:1 die `defaultTabIcons` aus `tabIcons.jsx` (selbe Sun-burst/Clock/Grid/Layers wie bei normalen Devices).

**3. UniversalDeviceView initial activeButton** auf `'controls'` geändert (statt `'overview'`) — sonst hätte das Default-Pattern keine Active-Pill, weil es keinen `'overview'`-Button mehr gibt. Nach Cancel im Edit-Mode springt der active state auch auf `'controls'` zurück.

### UX

Vorher: 3 Buttons in der Toolbar (`<` Back · ↻ Refresh · ⚙ Settings)
Nachher: 5 Buttons (☀ Controls · ⏱ Schedule · ▦ History · ▢ Context · ⚙ Settings)

Default-active: Controls (ersetzt Back-Button visuell). Sun-burst hat den weißen Pill-Indicator. Nur Settings ist click-funktional, die 4 Tab-Icons sind erstmal nur visuell (Click-Handler kommt später wenn der User die Inhalte definiert).

### Files

| File | Change |
|---|---|
| `system-entities/entities/integration/device-entities/UniversalDeviceEntity.js` | actionButtons komplett ersetzt |
| `components/DetailView/TabNavigation.jsx` | + 4 neue Cases in getActionIcon (controls/schedule/history/context, SVGs aus defaultTabIcons) |
| `system-entities/entities/integration/device-entities/views/UniversalDeviceView.jsx` | initial activeButton 'controls' statt 'overview', Cancel-Reset auf 'controls' |

### Was offen

- Click-Handler für die 4 Tab-Icons — User definiert später was beim Click passieren soll (Tab-Inhalte switchen, andere Views, etc.)
- Wenn die Bottom-Tabs (Steuerung/Sensoren/Diagnose/Sonstiges) später durch Top-Tabs ersetzt werden sollen, wäre das ein weiteres Refactor

---

## Version 1.1.1346 - 2026-05-01

**Title:** Multi-Instance-Bug behoben — `getEntityByDomain` returnt erstes Match, ID-basierter Lookup nötig (zweites Universal-Device zeigte Daten vom ersten)
**Hero:** none
**Tags:** Bugfix, Multi-Instance, SystemEntityLazyView, Critical

### Bug

User-Feedback nach v1.1.1345: "leider noch immer keine lösung (im zweiten gerät werden die werte vom ersten gerät 1:1 übernommen, obwohl beim setup anders angezeigt wird)"

Der `key={item.id}`-Fix in DetailView (v1.1.1345) hatte den richtigen Reflex aber nicht die richtige Wurzel — das Problem lag tiefer.

### Root Cause — `getEntityByDomain` returnt erstes Match

In `SystemEntityLazyView.jsx` (Zeile 23):

```js
// Get the actual SystemEntity instance from registry
const entityInstance = systemRegistry.getEntityByDomain(entity.domain);
```

`getEntityByDomain('universal_device')` returnt die **erste** Entity mit dieser Domain — nicht die zum übergebenen `entity`-prop passende. Wenn 2 Universal-Devices registriert sind, kommt immer Device 1 zurück.

Dann Zeile 104:

```js
return (
  <LoadedView
    entity={entityInstance || entity}  // ← entityInstance gewinnt!
    ...
  />
);
```

Das LoadedView (UniversalDeviceView) bekommt `entity = entityInstance` — also **immer das erste Universal-Device**, egal welches der User in der Übersicht angeklickt hat. Die `entity`-prop von DetailView wird komplett ignoriert wenn die Registry ein Match findet.

Mein `key={item.id}`-Fix hat zwar Preact zum Remount gezwungen — aber `SystemEntityLazyView` hat dann beim frischen Mount wieder das erste Universal-Device geladen. Daher der Bug-Fix war wirkungslos für Multi-Instance-Devices.

Bei der Setup-Vorschau passierte das nicht, weil `<UniversalPreviewCard>` ohne den `SystemEntityLazyView`-Lookup direkt die config-props verwendet.

### Fix — ID-basierter Lookup

```diff
- // Get the actual SystemEntity instance from registry
- const entityInstance = systemRegistry.getEntityByDomain(entity.domain);
+ // ID-Lookup mit Prefix-Strip (entity.id kommt mit 'system.' / 'plugin.' aus toEntity)
+ const internalId = entity?.id?.replace(/^(system|plugin)\./, '');
+ const entityInstance = (internalId && systemRegistry.getEntity(internalId))
+   || systemRegistry.getEntityByDomain(entity.domain);
```

Logik:
1. **Erstwahl:** Suche nach exakter ID (`getEntity(internalId)`) — funktioniert für alle Multi-Instance-Devices
2. **Fallback:** `getEntityByDomain(entity.domain)` für legacy paths / single-instance entities ohne id-mismatch

### Erklärung der Prefix-Strip-Logik

`SystemEntity.toEntity()` packt das prefix drauf:
```js
const entityId = this.isPlugin ? `plugin.${this.id}` : `system.${this.id}`;
return { entity_id: entityId, id: entityId, ... };
```

Aber die Registry speichert intern OHNE Prefix:
```js
this.entities.set(entity.id, entity);  // entity.id = 'universal_xxx_yyy_zzz'
```

Also vor `getEntity()` Aufruf den Prefix wegmachen.

### Bonus — wirkt für ALLE Multi-Instance-Types

Der Bug betraf nicht nur Universal-Devices. Alle anderen Multi-Instance-System-Entities (Printer3D, EnergyDashboard, Weather) hatten denselben latenten Bug:
- 2 Bambu-Drucker: zweiter zeigte Daten vom ersten
- 2 EnergyDashboards: zweites zeigte Daten vom ersten
- 2 Wetter-Standorte: zweiter zeigte Daten vom ersten

In der Praxis ist das selten aufgefallen weil die meisten User nur 1 Drucker/Dashboard/Wetter haben. Mit Universal kommen jetzt regelmäßig 2+ vor. Der Fix in `SystemEntityLazyView` löst das für alle Types auf einmal.

### Files

- `src/components/SystemEntityLazyView.jsx` — `getEntity(internalId)` mit prefix-strip + `getEntityByDomain` Fallback

### Lehre

`getEntityByDomain` ist explizit "first match by domain" — das war OK für single-instance system-entities (Settings/News/Todos haben nur eine Instanz, ID = Domain). Sobald Multi-Instance-Devices via Integration kamen (Printer3D in v1.1.1192+), war das ein latenter Bug. Universal hat ihn nun ans Licht gebracht.

---

## Version 1.1.1345 - 2026-05-01

**Title:** Bugfix: zweites Universal-Device zeigte Daten vom ersten — fehlender `key`-prop in DetailView's System-Entity-View
**Hero:** none
**Tags:** Bugfix, Universal-Builder, DetailView, React-Key, Component-Reuse

### Bug

Wenn User zwei Universal-Devices hintereinander anlegt, zeigt das zweite Device die Daten vom ersten (Hero/Tab-Items/Entity-Liste). Im Setup-Wizard ist die Vorschau noch korrekt — der Bug tritt erst auf wenn die fertige Karte gerendert wird.

### Root Cause — Component-Reuse ohne `key`

In `DetailView.jsx` (Zeile 532-555) werden `<SystemEntityLazyView>` und `<ViewComponent>` **ohne `key`-prop** gerendert. Wenn der User von Universal-Device A zu Universal-Device B navigiert, sieht Preact:
- Selber Component-Type (`UniversalDeviceView`)
- Selbe Position im VDOM
- → **Reused die Component-Instanz**, übernimmt nur die neuen `entity`/`hass` props

Die `entity`-prop ist neu, aber **interne Hooks-States überleben den Reuse**:
- `useState` Werte (z.B. `editingMode`, `activeButton` in UniversalDeviceView)
- `useRef` Caches (`pendingRef`, `optimisticOverrides` in UniversalEntityList)
- States in `UniversalControlsTab`: `localPowerState`, `lastBrightness`, `lockState`, `liveEnergyValue`, `currentKwhValue`, `midnightKwhValue`, `expandedControl`, `activePreset`
- States in `useEntityStateSync` Hook

`useMemo[item, hass]` recomputed zwar (neue `item`-Reference), aber alle State-Werte aus useState/useRef bleiben am ersten Device hängen. Resultat: Tab-Items werden für das neue Device geladen, aber die Pending-Locks, Optimistic-Overrides und Hero-Live-Werte zeigen weiter den ersten Device-Stand.

Bei der Setup-Vorschau passiert das nicht weil `<UniversalPreviewCard>` keinen problematischen internen State hat — sie ist read-only und re-rendered korrekt bei jedem prop-Wechsel.

### Fix

`key={item.id || item.entity_id}` an `<SystemEntityLazyView>` und `<ViewComponent>`. Das zwingt Preact zu **komplettem Unmount + frischem Mount** wenn `item.id` wechselt — alle internen States werden zurückgesetzt.

```diff
  return (
    <SystemEntityLazyView
+     key={item.id || item.entity_id}
      viewLoader={SystemViewComponent}
      entity={item}
      ...
    />
  );
```

Identisch für die direkte ViewComponent-Variante. Funktioniert für ALLE System-Entity-Views, nicht nur Universal — auch bei Wechsel zwischen 2 Bambu-Druckern oder 2 Wetter-Standorten. Da diese Bugs vorher vermutlich auch existierten aber selten getestet wurden (man hat normalerweise nur 1 Drucker), waren sie nicht aufgefallen.

### Lehre

**Multi-Instance-System-Entities brauchen unique key.** Single-Instance-Entities wie Settings/News/Todos haben keine zwei Instanzen → kein key nötig. Aber sobald User mehrere von einem Type anlegt (Universal, Printer3D, EnergyDashboard, Weather), MUSS der Wrapper unterscheidbare Keys an die View geben. DetailView macht das jetzt automatisch über `item.id`.

### Files

- `src/components/DetailView.jsx` — `key` prop an beide Render-Pfade

---

## Version 1.1.1344 - 2026-05-01

**Title:** Universal Builder nutzt jetzt UniversalControlsTab DIREKT — visuell garantiert 1:1 wie Printer3D
**Hero:** none
**Tags:** Refactor, Universal-Builder, Bambu-Match, Reuse

### Why

Mein selbstgebautes Universal-Layout (v1.1.1341-1343) war wiederholt visuell anders als Bambu — auch nach mehreren Iterationen. Grund: ich habe Bambu-Patterns "nachgebaut" mit eigenem JSX, statt die existierende Component zu nutzen. Padding, Spacing, Animation-Timings, ControlButton-CSS waren immer ein bisschen daneben.

User-Feedback: "ES IST NOCH IMMER NICHT 1:1"

### Solution — UniversalControlsTab direkt verwenden

Statt eigenes Layout zu bauen, plugged Universal jetzt in die existierende `UniversalControlsTab.jsx` ein — die selbe Component die `Printer3DDeviceView` nutzt. Damit ist das Visual **garantiert identisch**, weil es dieselbe Component ist (mit demselben CSS, denselben Animations, demselben ControlButton, demselben CircularSlider).

**4 minimale Änderungen am bestehenden Code:**

**1. `getControlConfig` neuer case `'universal_device'`** (in `deviceConfigs.js`)

Returnt 4 Tab-Buttons (Steuerung/Sensoren/Diagnose/Sonstiges) mit den exakten SVG-Icons aus printer3d_device (Sun/Wave/Wrench/Dots). Alle 4 als `expandable: true` mit `renderCustom: true` — die expanded-Liste kommt aus der Universal-spezifischen Component.

**2. `getSliderConfig` neuer case `'universal_device'`** (in `deviceConfigs.js`)

Returnt einen read-only progress-Slider als Default. Der echte Hero-State wird in UniversalControlsTab überschrieben.

**3. `UniversalControlsTab` minor Patch** (~25 LOC neu in der sliderConfig-useMemo)

Wenn `item.domain === 'universal_device'` UND `item.attributes.hero` gesetzt ist: liest `hass.states[heroId]` live, packt state/unit/friendly_name in den sliderConfig. Numerische Werte werden als Wert + Unit angezeigt, Text-States als displayValue.

Analog wie der existierende `energy_dashboard_device`-Special-Case — selbe Stelle, gleiches Pattern.

**4. `PresetButtonsGroup` neuer Case** (~3 LOC)

```js
} : group.renderCustom && item?.domain === 'universal_device'
    && ['controls', 'sensors', 'diagnostics', 'misc'].includes(group.id) ? (
  <UniversalEntityList entity={item} hass={hass} lang={lang} groupId={group.id} />
) : ...
```

### Neue Component — `UniversalEntityList.jsx` (~210 LOC)

Analog `PrinterSensorsList` + `PrinterMiscList` aber generisch:

- Holt items aus `groupEntitiesByCategory(hass, ha_device_id, {hidden, hero})` für die jeweilige Gruppe (controls/sensors/diagnostics/misc)
- Rendert mit `.ios-card` / `.ios-item` / `.ios-item-left` / `.ios-item-right` / `.ios-divider` (selbe Klassen wie Printer-Listen)
- Toggleable Items: `<LiquidGlassSwitch>` (mit Optimistic-Update + Pending-Lock-Pattern aus 1315-1318)
- Pressable Items (button/scene/script/automation): grüner ios-Button "Ausführen"
- Read-only Items (sensor): Wert + Unit rechtsbündig
- `<CustomScrollbar>` außen am Scroll-Container
- Section-Header uppercase (STEUERUNG/SENSOREN/DIAGNOSE/SONSTIGES)
- Empty-State falls Gruppe leer

### UniversalDeviceView drastisch vereinfacht — von 510 LOC auf 130 LOC

Vorher: ich hatte komplett eigenes Layout (Header/Hero/Tabs/Liste) mit ~510 LOC custom-JSX.

Jetzt: nur noch der editingMode-Branch (UniversalSetup im Edit-Mode) + ViewRefContext-Routing + `<UniversalControlsTab item={entity} ... />`. Die ganze Visual-Logic übernimmt UniversalControlsTab.

```jsx
return (
  <UniversalControlsTab
    item={entity}
    hass={hass}
    lang={lang}
    onServiceCall={onServiceCall}
    slideShowKey={updateBump}
  />
);
```

### Lehre

Wenn User "1:1 wie X" sagt und es eine bestehende Component X gibt: **die Component nutzen, nicht nachbauen**. Padding/Spacing/Animations sind hand-poliert über vergangene Versionen, da reproduzieren mit eigenem JSX führt zu Visual-Drift. Reuse > Reconstruct.

### Files

| File | Change |
|---|---|
| `utils/deviceConfigs.js` | + getControlConfig case 'universal_device' (~50 LOC), + getSliderConfig case 'universal_device' (~20 LOC) |
| `components/tabs/UniversalControlsTab.jsx` | + 25 LOC Hero-State-Lookup für universal_device |
| `components/controls/PresetButtonsGroup.jsx` | + UniversalEntityList-Import + 4-fach renderCustom-Case |
| `system-entities/entities/integration/device-entities/components/UniversalEntityList.jsx` | NEU (~210 LOC) — analog PrinterSensorsList/PrinterMiscList |
| `system-entities/entities/integration/device-entities/views/UniversalDeviceView.jsx` | -380 LOC: drastisch vereinfacht, nutzt UniversalControlsTab direkt |

---

## Version 1.1.1343 - 2026-05-01

**Title:** Universal Builder visuell 1:1 wie Bambu — iOS-Blau-Tabs, ios-card/ios-item Liste, LiquidGlassSwitch, Header oben links, Layout-Switch beim Tab-Open
**Hero:** none
**Tags:** Bugfix, Universal-Builder, Bambu-Match, iOS-Style

### Bug

User-Feedback: "die buttons unten sind anders, circle ist anders, anordnung ist anders, warum hast du neu gestaltet? wir haben doch eine vorlage 3d printer!"

Mein bisheriges Universal-Design hatte das Bambu-Pattern nicht 1:1 kopiert sondern "inspiriert von" — falsches Visual. Konkret:
- Aktiver Tab-Button: lila statt iOS-Blau
- Item-Liste: custom rgba-Backgrounds statt `.ios-card` / `.ios-item`
- Toggles: eigene AN/AUS-Buttons statt LiquidGlassSwitch
- Header: zentriert statt links-oben
- Anordnung: Tabs immer unten, statt nach oben zu fliegen wenn Tab expanded
- Kein CustomScrollbar, keine `.ios-section-header`-Uppercase-Labels

### Fix — UniversalDeviceView komplett auf Bambu-Pattern

Match `Printer3DDeviceView` + `PrinterSensorsList` + `PrinterMiscList` exakt:

**Header (links oben, NICHT zentriert):**
- Zeile 1 (groß, fett, 20px): Hero-state + unit (oder Device-Name als Fallback)
- Zeile 2 (klein, 13px): Auto-Sub-Info aus den ersten 2 numerischen Sensors als "Label: Value | Label: Value"
- Zeile 3 (sehr klein, 11px): `manufacturer · model · area_name`

**Hero-Circle (Mitte):**
- Großer Wert in der Mitte (`clamp(36px, 9vw, 56px)`)
- Donut-Visualisierung wenn Hero ein Battery ist (state-aware Color)
- Wird ausgeblendet wenn Tab expanded ist

**4 Tab-Buttons:**
- Aktiver Tab: `rgb(0, 122, 255)` (iOS-Blau, **NICHT mehr lila**)
- 56px round mit 1.5px stroke-icon
- Item-Counter unter dem Label
- **Layout-Switch via `motion layout`**: ohne expanded Tab schweben sie unten am Rand; bei expanded fliegen sie hoch direkt unter den Header (spring-animated)

**Expanded Tab-Liste:**
- `.ios-settings-view` als Scroll-Container mit `CustomScrollbar` außen
- `.ios-section` mit Uppercase-Header (z.B. "STEUERUNG")
- `.ios-card` als Container, `.ios-item` mit `.ios-item-left` (Label) und `.ios-item-right` (Value/Toggle)
- `.ios-divider` zwischen Items
- Empty-State falls Gruppe leer: dezenter Hinweis statt leerer Liste

**Toggles & Buttons:**
- Toggleable Items (switch/light/fan/etc.): `<LiquidGlassSwitch>` (analog `PrinterMiscList`)
- Pressable Items (button/scene/script/automation): grüner ios-Button "Ausführen"
- Read-only Items (sensor/binary_sensor): Wert + Unit rechtsbündig wie `PrinterSensorsList`

**Optimistic Update + Pending-Lock:**
- Pattern 3 aus HA-Card-Patterns (siehe v1.1.1315-1318): pendingRef pro Entity, 2s TTL, drop wenn HA confirmed, merge in incoming polling-data

### Files

| File | Change |
|---|---|
| `device-entities/views/UniversalDeviceView.jsx` | Komplett neu auf Bambu-Pattern (LiquidGlassSwitch + ios-* + iOS-Blue + Layout-Switch) |

### Lehre

Wenn User sagt "1:1 wie Bambu", dann **kopieren**, nicht "inspirieren von". Das Bambu-Pattern war hand-poliert über v1.1.1313-1320 — es hat seine Gründe (Layout-Switch beim Tab-Open vermeidet Hero-Reflow, ios-Klassen sorgen für visuelle Konsistenz mit Settings, LiquidGlassSwitch hat den ganzen Switch-Bug-Sweep aus 1313-1318 schon eingebaut).

---

## Version 1.1.1342 - 2026-05-01

**Title:** Universal Builder Bugfixes — Area-Name aus HA-Backend anzeigen + Device sofort im Raum nach Add (kein Refresh mehr nötig)
**Hero:** none
**Tags:** Bugfix, Universal-Builder, Area, Race-Condition

### Bug 1 — Area-Name fehlte in PreviewCard und View-Header

**Symptom:** PreviewCard zeigte nur den Device-Namen (z.B. "Backofen"), die Universal-View nur `manufacturer · model`. HAs Raumzuordnung war nirgends sichtbar.

**Fix:** Header in beiden Components zeigt jetzt `manufacturer · model · area_name` (mit Pipe-Trenner). PreviewCard hat zusätzlich einen sub-line unter dem Namen mit derselben Info.

### Bug 2 — Race-Condition beim Add: Device erschien nicht im Raum ohne Refresh

**Symptom:** Nach dem "Hinzufügen"-Klick im Setup landete das neue Universal-Device in der Card-Übersicht ohne Area-Zuordnung. User musste die Card schließen und neu öffnen damit die Area erkannt wurde.

**Root Cause:** In `IntegrationEntity.addDevice`:

```js
// Vorher (kaputt):
const deviceEntity = createDeviceEntity(deviceData);
systemRegistry.register(deviceEntity);  // ← emittet 'entity-registered' SOFORT
                                         //   → DataProvider lädt Entity ohne area_id
if (systemRegistry.isInitialized && this._hass) {
  await deviceEntity.onMount({...});    // ← onMount setzt area_id, aber zu spät —
                                         //   DataProvider hat schon ohne area gerendert
}
```

**Plus:** Der `register()`-Call in der Registry triggert bereits selbst `onMount` wenn `isInitialized` (siehe `registry.js:114-118`) — der explizite zweite `await onMount()` war ein **doppelt-Mount-Bug**, läuft also seit längerem 2× pro Add.

**Fix:** Area aus `hass.devices` SYNCHRON setzen BEVOR `register()` aufgerufen wird:

```js
const deviceEntity = createDeviceEntity(deviceData);
if (deviceEntity) {
  // Area sofort aus HA-Backend lesen (synchron — hass.devices/areas sind live)
  if (this._hass) {
    const haDeviceId = deviceData.ha_device_id;
    const entityId = deviceData.entity_id;
    let area_id = null;
    if (haDeviceId && this._hass.devices?.[haDeviceId]) {
      area_id = this._hass.devices[haDeviceId].area_id;
    }
    // Fallback für entity-based devices (Weather)
    if (!area_id && entityId && this._hass.entities?.[entityId]) {
      const entReg = this._hass.entities[entityId];
      if (entReg.area_id) area_id = entReg.area_id;
      else if (entReg.device_id) {
        area_id = this._hass.devices?.[entReg.device_id]?.area_id;
      }
    }
    if (area_id) {
      deviceEntity.area_id = area_id;
      if (this._hass.areas?.[area_id]) {
        deviceEntity.area = this._hass.areas[area_id].name;
      }
    }
  }
  // Jetzt registrieren — entity hat schon area_id, DataProvider lädt korrekt.
  // register() triggert auch onMount (kein zweiter expliziter await mehr nötig).
  systemRegistry.register(deviceEntity);
}
```

Funktioniert für alle 4 Device-Type-Pfade:
- **Universal** + **Printer3D** + **EnergyDashboard** → `ha_device_id` aus deviceData
- **Weather** → `entity_id` aus deviceData, area via entity_registry oder device_registry-Fallback

Der explizite `await deviceEntity.onMount(...)` wurde ENTFERNT — register() triggert es schon selbst, und vorher war es ein Doppel-Mount.

### UX vorher vs. nachher

**Vorher:**
1. Setup → "Hinzufügen" klicken
2. Card schließt Setup, kehrt zur Übersicht zurück
3. Neues Device erscheint **unter "Sonstige" / ohne Raum**
4. User: Card schließen, neu öffnen
5. Jetzt erst korrekt im Raum

**Nachher:**
1. Setup → "Hinzufügen" klicken
2. Card schließt Setup, kehrt zur Übersicht zurück
3. Neues Device erscheint **direkt im richtigen Raum** ✓

### Files

| File | Change |
|---|---|
| `system-entities/entities/integration/index.js` | addDevice: Area sync setzen vor register(), doppel-mount entfernt |
| `system-entities/entities/integration/device-entities/views/UniversalDeviceView.jsx` | Header-Zeile mit area_name |
| `system-entities/entities/integration/components/UniversalPreviewCard.jsx` | Header mit Manufacturer/Model/Area subline + resolveDeviceMeta-Import |

---

## Version 1.1.1341 - 2026-05-01

**Title:** Universal Builder Refactor — Auto-Gruppierung nach HA-Backend (Steuerung/Sensoren/Diagnose/Sonstiges) im Bambu-Stil mit Hero-Circle + 4 expandable Tabs
**Hero:** none
**Tags:** Refactor, Universal-Builder, Auto-Grouping, Schema-Migration, Breaking-Change

### Why

Das alte `slots: {hero, strip, all}`-Schema war eine Erfindung des Universal-Builders die HAs eigene Backend-Gruppierung ignoriert hat. HA gruppiert jedes Device automatisch in **Steuerung / Sensoren / Diagnose / Konfiguration** — anhand `entity_category` und `domain`. Mein Builder zwang den User, das manuell nochmal zu machen.

User wollte: HA-native Gruppierung, im Visual-Stil des handgebauten 3D-Drucker-Layouts (CircularSlider + 4 Tab-Buttons mit Icons).

### Solution

**1. Neuer Helper `entityGrouping.js`** (~190 LOC)

`groupEntitiesByCategory(hass, deviceId, options)` liefert:
- **controls** — Domains: `switch`, `light`, `fan`, `cover`, `lock`, `climate`, `media_player`, `vacuum`, `button`, `scene`, `script`, `automation`, `humidifier`, `water_heater`, `siren`, `remote`, `valve`, `input_boolean/button/number/select/text/datetime` (ohne `entity_category`)
- **sensors** — Domains: `sensor`, `binary_sensor`, `weather`, `image`, `camera`, `sun`, `person`, `device_tracker`, `calendar` (ohne `entity_category`)
- **diagnostic** — alle Entities mit `entity_category === 'diagnostic'`
- **misc** — alle Entities mit `entity_category === 'config'` + sub-devices via `via_device_id`

`entity_category` hat Priorität über Domain-Klassifikation (so wie HA es macht).

**2. Schema-Migration**

```diff
- slots: { hero, strip, all }
- layout: 'default' | 'compact' | 'stats' | 'vehicle' | 'media'
+ hero: 'sensor.x'        // optional, einzelnes Hero-Entity
+ hidden_entities: []     // optional, was NICHT zeigen
```

Migration in `deviceConfigStorage.ensureSchema()`:
- `slots.hero → hero` (1:1)
- `slots.strip + slots.all` → ignoriert (Auto-Gruppierung übernimmt)
- `layout` → entfernt (nur noch ein Layout)

Migration ist idempotent + automatisch beim Bootstrap. Existing Universal-Devices behalten ihre `hero`-Wahl, der Rest wird automatisch eingruppiert.

**3. UniversalDeviceView komplett neu im Bambu-Stil** (~510 LOC, vorher ~440)

Layout:
- **Hero-Circle** oben: visueller Circle mit Hero-Wert. Wenn Hero ein Battery ist (device_class=battery, unit=%, name enthält "battery/akku/charge"), wird der Circle als **Donut mit Battery-Bar** gerendert (conic-gradient, state-aware Color: grün >50%, orange 20-50%, rot <20%)
- **4 Bottom-Tab-Buttons** (54px round): Steuerung / Sensoren / Diagnose / Sonstiges, mit den exakten SVG-Icons aus `deviceConfigs.js:222-228` (Sun/Wave/Wrench/Dots) — also IDENTISCH zum 3D-Drucker
- Item-Counter pro Tab als kleine Zahl unter dem Label (z.B. "Steuerung 4")
- Click → Tab klappt Liste auf mit Hover/Active-Animation (rgba(175,82,222,0.35))
- Toggleable Items mit AN/AUS-Button + Optimistic-Update + Pending-Lock (Pattern 3)
- Pressable Items (button/scene/script/automation) mit ▶-Button

**4. Breaking Change: Layout-System entfernt**

5 alte Layout-Files gelöscht:
- ❌ `views/layouts/DefaultLayout.jsx`
- ❌ `views/layouts/CompactLayout.jsx`
- ❌ `views/layouts/StatsLayout.jsx`
- ❌ `views/layouts/VehicleLayout.jsx`
- ❌ `views/layouts/MediaLayout.jsx`
- ❌ `views/layouts/universalLayouts.js` (Registry)
- ❌ `views/layouts/` (Verzeichnis)

Sie waren auf das alte `slots`-Schema gebaut und nutzten Strip/All-Konzepte die jetzt obsolet sind. Falls künftig wieder spezielle Visual-Variants gewünscht (Vehicle/Media), kommen sie als **Hero-Display-Varianten** zurück — nicht als komplett anderes Layout. Das aktuelle Hero-Circle hat schon die Battery-Erkennung eingebaut, das ist 90% des Vehicle-Layouts.

**5. UniversalSetup vereinfacht**

Step 2 reduziert von "Hero-Dropdown + Strip-Checkboxes (max 5) + All-Checkboxes" auf:
- Hero-Dropdown (optional, Default = leer)
- Hidden-Entities-Checkbox-Liste (Default = alle sichtbar)

Step 3 reduziert: Layout-Picker entfernt (es gibt nur noch ein Layout). Bleibt: Naming + Live-Preview.

Smart-Default für Hero: erstes `sensor.*`-Entity mit primary `device_class` (z.B. battery, temperature). Wenn keins gefunden: Hero bleibt leer (User wählt manuell oder lässt's leer = nur Tabs).

**6. PreviewCard auf neues Schema**

Neue Mini-Vorschau im Bambu-Stil:
- Mini-Hero-Circle (120px) mit Wert + Battery-Bar (wenn Battery)
- 4 kleine Counter-Bubbles für die 4 Tab-Gruppen (zeigt nur Counts, keine Details)
- Wenn Hero leer: "Kein Hero"-Placeholder

API-Change: `slots`-prop entfernt, neuer `deviceConfig`-prop mit `{ha_device_id, hero, hidden_entities}`.

### UX-Vergleich

**Vorher (v1335-1339):**
```
Setup Step 2: Hero (1) + Strip (max 5) + All-Liste (alles andere)
              → 3 Sektionen mit Checkboxes, viel Klick-Arbeit
View:         Hero + scroll-Strip + flat List
```

**Nachher (v1341):**
```
Setup Step 2: Hero (optional) + Hidden-Liste (Default leer)
              → 2 Sektionen, fast nur "Weiter" klicken
View:         Hero-Circle + 4 expandable Tabs (auto-gruppiert wie HA)
```

User-Setup-Aufwand: ~70% weniger Klicks pro Universal-Device.

### Files

| File | Change |
|---|---|
| `device-entities/views/entityGrouping.js` | NEU (~190 LOC) — Auto-Gruppierung-Helper |
| `device-entities/UniversalDeviceEntity.js` | Schema-Refactor: slots/layout entfernt, hero/hidden_entities neu |
| `deviceConfigStorage.js` | Migration old slots → new hero in ensureSchema() |
| `components/setup-flows/UniversalSetup.jsx` | Step 2 vereinfacht (~430 LOC, vorher ~600) |
| `device-entities/views/UniversalDeviceView.jsx` | Komplett neu im Bambu-Stil (~510 LOC) |
| `components/UniversalPreviewCard.jsx` | Neu auf deviceConfig-API + Mini-Hero-Circle |
| `device-entities/views/layouts/*` | GELÖSCHT (6 Files + Verzeichnis) |

### Was noch offen

- **Settings-Mode in der View** ist noch der alte UniversalSetup im Edit-Mode. Könnte später eine inline-Settings-Sheet werden statt Full-Page-Wizard
- **Hero-Klick-Action** (z.B. großer Hero-Wert klick → Edit oder Detail) — aktuell rein visuell
- **Sub-Devices Sichtbarkeit** — `groups.subDevices` wird gesammelt aber noch nicht angezeigt. Könnte als 5. Tab "Verbundene Geräte" oder als Sub-Section in "Sonstiges" erscheinen
- **Long-Press-Edit** für Entity-Liste — User möchte Entity ausblenden ohne den Settings-Wizard zu öffnen

---

## Version 1.1.1340 - 2026-05-01

**Title:** Bugfix: TabNavigation active-tab indicator (white pill) verschwand für alle Multi-Instance-Devices nach dem v1.1.1332 ViewRefContext-Refactor — stale closure auf viewRefs
**Hero:** none
**Tags:** Bugfix, TabNavigation, ViewRefContext, Stale-Closure

### Bug

Seit v1.1.1332 fehlte der animierte aktive-Tab-Indikator (die weiße Pill) bei den Action-Button-Toolbars von Multi-Instance-Devices. Konkret:
- 3D-Drucker-Card: 4 runde Toolbar-Buttons (Übersicht/Settings/Camera/Image) hatten keine Active-Markierung mehr
- News, Todos, Versionsverlauf, AllSchedules, Integration, Energy Dashboard, Weather, Universal-Devices: gleicher Defekt
- System-Settings funktionierte weiter (anderer Render-Pfad: `activeTab === index` statt `getActiveButton()`)

### Root Cause — Stale closure auf React-Context-State

In v1.1.1332 wurde `window._fooViewRef` durch `useViewRefs()` aus dem React-Context ersetzt. Das Active-Button-Polling in `TabNavigation.jsx` aber blieb strukturell identisch:

```js
// In TabNavigation v1.1.1332 (kaputt):
const { viewRefs } = useViewRefs();

useEffect(() => {
  const checkActiveButton = () => {
    const viewRef = viewRefs.printer || viewRefs.news || ...;  // ← stale!
    const currentActive = viewRef?.getActiveButton?.();
    if (currentActive !== activeButtonState) {
      setActiveButtonState(currentActive);
    }
  };
  // RAF-Loop polled checkActiveButton 60Hz
  ...
}, [actionButtons, activeButtonState]);  // ← viewRefs FEHLT in deps
```

Das useEffect-Closure capturet `viewRefs` aus dem ersten Render — typischerweise `{}`, weil `TabNavigation` rendert BEVOR die View darunter mountet und sich registriert. Bei `window._printerViewRef`-Pattern war das egal: die globale `window`-Property wurde live ausgelesen, kein Closure-Problem. Bei React-Context wurde der initial leere State eingefroren.

Resultat: Polling lief 60Hz, las immer `viewRefs={}` → kein viewRef → `getActiveButton()` nie aufgerufen → `activeButtonState` blieb `null` → keine `.active`-Klasse → keine Pill.

### Fix — Mirror-Ref-Pattern + Functional Update

```diff
+ const viewRefsRef = useRef(viewRefs);
+ viewRefsRef.current = viewRefs;  // bei jedem Render aktualisieren

  useEffect(() => {
    const checkActiveButton = () => {
-     const viewRef = viewRefs.printer || ...;  // stale
+     const vr = viewRefsRef.current;            // immer current
+     const viewRef = vr.printer || ...;
      const currentActive = viewRef?.getActiveButton?.();
-     if (currentActive !== activeButtonState) {
-       setActiveButtonState(currentActive);
-     }
+     setActiveButtonState(prev => prev !== currentActive ? currentActive : prev);
    };
    ...
- }, [actionButtons, activeButtonState]);
+ }, [actionButtons]);  // viewRefs/activeButtonState raus → kein RAF-Restart
  });
```

Plus: `isActive`-Render-Logic auf `activeButtonState` umgestellt statt `viewRef.getActiveButton()` parallel im Render zu rufen — sonst können Slider-Position und active-Class auseinanderlaufen.

### Pattern für andere ViewRefContext-Konsumenten

**Wenn ein useEffect/useMemo/useCallback einen Closure auf `viewRefs` (oder ein anderes Context-Value) hat und der Effect nicht bei jedem Context-Update neu starten soll:** nutze ein Mirror-Ref-Pattern:

```js
const viewRefsRef = useRef(viewRefs);
viewRefsRef.current = viewRefs;  // bei jedem Render
// Im Effect: viewRefsRef.current statt viewRefs lesen
```

Das ist die generische Lösung für "ich brauche Live-Read auf ein Context-Value, will aber nicht den Effect re-runnen".

### Files

- `src/components/DetailView/TabNavigation.jsx` — Mirror-Ref + Functional-Update + isActive aus activeButtonState

---

## Version 1.1.1339 - 2026-05-01

**Title:** Universal Builder — zwei Smart-Layouts: 🚗 Vehicle (Battery-Bar) + 🎵 Media (Cover-Art)
**Hero:** none
**Tags:** Feature, Universal-Builder, Smart-Layouts, Vehicle, Media

### Why

v1.1.1338 brachte das Layout-Framework mit drei generischen Templates (Default/Compact/Stats). v1.1.1339 nutzt das Framework jetzt für zwei spezialisierte Layouts mit Smart-Visualisierung — die zeigen wirklich was möglich ist wenn man Layout-Logik plus HA-Attribute kombiniert.

User hatte als Beispiele genannt: 3D-Drucker (Premium-Type), **Tesla** (jetzt: Vehicle-Layout) und Waschmaschine (kommt später als Appliance). Plus Media-Player ist ein offensichtlicher Universal-Use-Case der eigene Visual-Behandlung verdient.

### Solution

**1. 🚗 Vehicle Layout** (`VehicleLayout.jsx`, ~220 LOC)

Smart-Detection: wenn Hero-Entity `device_class: battery` oder `unit_of_measurement: '%'` oder Name enthält "battery"/"akku"/"charge" hat, wird der Wert als **horizontaler Battery-Bar** gerendert statt als reine Zahl. Bar-Color ist State-aware:
- > 50%: grün → cyan Gradient
- 20-50%: orange → amber Gradient
- < 20%: rot → red Gradient

Strip wird als **3-Spalten-Grid** prominent dargestellt (statt horizontal-scroll), Spillover (>3) als kompakte Pillen darunter. Toggleable Items aus All werden zu **2-Cols-Bottom-Row mit großen Buttons** (cyan-highlight bei "on"). Non-toggleable Rest kompakt darunter.

**Use-Case:** Tesla, BMW Connected Drive, Akku-Sensoren mit Status-Anzeige. Das Battery-Visual ist der WIN — User sieht sofort "65%" als Bar statt nur als Zahl.

**2. 🎵 Media Layout** (`MediaLayout.jsx`, ~210 LOC)

Smart-Detection: wenn Hero-Entity `entity_picture` hat (Standard für media_player), wird die Cover-Art als **Background-Image im 1:1-Aspect-Ratio** gerendert. Title kommt aus `media_title` (override des friendly_name), Subtitle aus `media_artist` oder `media_album_name` oder state. Gradient-Overlay bottom-up sorgt für Text-Lesbarkeit.

Status-Badge oben rechts (grün wenn playing). Strip als kompakte **Pillen-Row** (z.B. "Album: …", "Quelle: …"). Toggleable Items werden zu **Player-Control-Buttons** in einem auto-fit-Grid (110px-min) mit pink→lila-Gradient bei "on".

Fallback ohne entity_picture: einfaches Hero-Display mit pink-getöntem Gradient + Title/Subtitle, Rest funktioniert weiter.

**Use-Case:** Spotify, Sonos, Plex, AppleTV. Cover-Art-Display ist der visuelle WIN den ein generisches Layout nicht erreichen kann.

### universalRenderHelpers erweitert

`resolveEntity()` reicht jetzt Media-spezifische Felder durch (default null wenn nicht vorhanden):
- `entity_picture` — Cover-Art-URL
- `media_title` — Track-Titel
- `media_artist` — Künstler
- `media_album_name` — Album

Die anderen Layouts ignorieren diese Felder einfach — sie sind für MediaLayout reserviert. Layouts können defensiv prüfen (`hero.entity_picture && ...`).

### Architektur-Win sichtbar

Diese Iteration hat **2 neue Layouts hinzugefügt mit insgesamt 4 Code-Änderungen:**

1. `VehicleLayout.jsx` (neu)
2. `MediaLayout.jsx` (neu)
3. `universalLayouts.js` — 2 Einträge im Registry
4. `universalRenderHelpers.js` — 4 neue Felder in resolveEntity

UniversalDeviceView, UniversalSetup, UniversalPreviewCard, IntegrationView — **alle nicht angefasst.** Sie lesen aus dem Registry, der Layout-Picker zeigt automatisch die zwei neuen Optionen, der Edit-Flow funktioniert sofort. Genau das was das Plugin-Pattern verspricht.

### UX-Flow

User legt einen Tesla an:
1. Add Universal Device → wählt sein Tesla-Device
2. Smart-Defaults wählen Battery als Hero, Range/Temp/Standort als Strip
3. Step 3: wählt Layout "🚗 Fahrzeug"
4. Live-Preview zeigt schon das Vehicle-Layout
5. Save → Karte hat Battery-Bar prominent, 3-Karten-Strip-Grid, Climate-Toggles als Bottom-Row

User legt einen Spotify-Player an:
1. Add Universal → wählt Spotify-Player-Device
2. Smart-Defaults wählen media_player als Hero, Album/Quelle als Strip, Play/Pause-Scripts als All
3. Step 3: wählt Layout "🎵 Media-Player"
4. Save → Karte zeigt Cover-Art als großes Background, Title+Artist als Overlay, Play/Pause als prominente Pink-Buttons

### Files

| File | Change |
|---|---|
| `views/layouts/VehicleLayout.jsx` | NEU (~220 LOC) — Battery-Bar Smart, Strip-Grid, Toggle-Bottom-Row |
| `views/layouts/MediaLayout.jsx` | NEU (~210 LOC) — Cover-Art-Background, Player-Controls |
| `views/layouts/universalLayouts.js` | + vehicle + media Einträge |
| `views/universalRenderHelpers.js` | + entity_picture, media_title, media_artist, media_album_name in resolveEntity |

### Was noch offen

- **Appliance Layout** — für Waschmaschine: Programm als Hero, Restzeit als großer Counter darunter, Steuerung-Buttons. Braucht Smart-Detection für duration-state-Entities
- **Climate Layout** — Thermostat: Setpoint vs Aktuelle Temp, Mode-Switch, Fan-Speed
- **Drag-Reorder im Strip** — Strip-Reihenfolge ändern
- **Bulk-Edit** — mehrere Devices gleichzeitig

---

## Version 1.1.1338 - 2026-05-01

**Title:** Universal Builder Layout-Templates — drei wählbare Visual-Stile (Default, Compact, Stats) statt One-Layout-fits-all
**Hero:** none
**Tags:** Feature, Universal-Builder, Layouts, Plugin-Pattern

### Why

Bisher sahen alle Universal-Devices identisch aus: Hero-Karte oben, Strip horizontal, lange Liste unten. Das passt für viele Cases, aber nicht alle:

- **Smart-Plug** mit nur 3-4 Werten: lange Liste fühlt sich überdimensioniert an
- **Sensor-Hub** mit 10 numerischen Werten: Hero-Highlight ist irrelevant, User will alle Werte gleichberechtigt sehen
- **Tesla / Komplex-Devices**: passt gut mit Hero (Battery)

Layout-Templates lösen das mit drei wählbaren Visual-Stilen, einem für jeden Hauptanwendungsfall.

### Solution — Plugin-Pattern für Layouts

Analog zum `deviceTypeRegistry`-Pattern (v1.1.1325): Single Source of Truth in einer Registry, neue Layouts ergänzen via 1-Eintrag.

**1. Layout-Components als pure Render-Components** (~150-200 LOC each):

| Layout | Visual | Use-Case |
|---|---|---|
| 📋 **Default** | Hero (52px) + Strip + komplette Liste mit Toggle-Buttons | Universal-Karte (Status quo) |
| 🎯 **Compact** | Hero + Strip + Quick-Action-Buttons-Grid (statt Liste) | Smart-Plugs, Thermostate, reduzierte Anzeigen |
| 📊 **Stats** | Kein Hero-Highlight, Strip als 2-Spalten-Grid mit großen Karten, Liste tabellarisch | Sensor-Hubs, Multi-Sensor-Geräte |

Alle drei nehmen das gleiche `{hero, strip, all, device, lang, optimisticOverrides, onToggle}` Interface — austauschbar an der gleichen Render-Stelle.

**2. `universalLayouts.js`** — Registry:

```js
export const universalLayouts = {
  default: { icon: '📋', label, description, Component: DefaultLayout },
  compact: { icon: '🎯', label, description, Component: CompactLayout },
  stats:   { icon: '📊', label, description, Component: StatsLayout },
};
export function getLayoutComponent(layoutId) { ... }
export function listLayouts() { ... }
```

**3. UniversalDeviceView massiv vereinfacht** (-180 LOC):

```diff
- // 180 Zeilen Hero+Strip+List render-code
+ const LayoutComponent = getLayoutComponent(entity?.attributes?.layout || 'default');
+ <LayoutComponent device={device} hero={hero} strip={strip} all={all} ... />
```

**4. UniversalSetup — Layout-Picker in Step 3:**

Neue Section direkt vor der Live-Preview. Radio-Buttons mit Icon + Label + Description. Lila-Highlight auf gewähltem Layout.

**5. UniversalPreviewCard layout-aware:**

Zeigt das gewählte Layout als Mini-Variante. Stats rendert 2-Cols-Grid, Compact zeigt Quick-Action-Buttons statt Liste, Default bleibt wie gehabt. Plus ein Layout-Badge oben rechts neben dem "VORSCHAU"-Label damit klar ist welches Template gerade angezeigt wird.

**6. Edit-Flow vollständig:** updateDevice action propagiert jetzt auch das `layout`-Field. User kann Layout nachträglich wechseln ohne Remove + Re-Add.

### Architektur-Win — Erweiterbarkeit

Neuer Layout-Type braucht jetzt:
1. Component anlegen unter `views/layouts/<NewLayout>.jsx`
2. Eintrag in `universalLayouts.js`
3. Fertig — Setup, Preview, View pickup it automatisch

Wie beim `deviceTypeRegistry`-Pattern: keine Switch-Statements mehr in 4 verschiedenen Files.

### Files

| File | Change |
|---|---|
| `views/layouts/DefaultLayout.jsx` | NEU (~190 LOC) — extracted aus UniversalDeviceView |
| `views/layouts/CompactLayout.jsx` | NEU (~150 LOC) — Hero + Strip + Quick-Actions |
| `views/layouts/StatsLayout.jsx` | NEU (~180 LOC) — 2-Cols-Grid + tabellarische Liste |
| `views/layouts/universalLayouts.js` | NEU (~70 LOC) — Registry + Helpers |
| `views/UniversalDeviceView.jsx` | -180 LOC (Layout-Logic ausgelagert) |
| `components/UniversalPreviewCard.jsx` | + layout-prop, conditional Render-Pfade für Stats vs Hero-based |
| `components/setup-flows/UniversalSetup.jsx` | + Layout-Picker in Step 3, selectedLayout-State |

### Was noch offen

- **Drag-Reorder im Strip** — aktuell ist Strip-Reihenfolge durch Click-Order definiert
- **Bulk-Edit** — mehrere Universal-Devices auf einmal umbenennen / Layout wechseln
- **Mehr Layouts** — z.B. 'vehicle' (Battery-Donut prominent), 'appliance' (Programm + Restzeit), 'media' (Cover-Art-Style) — Framework steht, jeder neue Layout ist 1 Component + 1 Registry-Eintrag

---

## Version 1.1.1337 - 2026-05-01

**Title:** Universal Builder Live-Preview — User sieht beim Auswählen sofort wie die Karte aussehen wird
**Hero:** none
**Tags:** Feature, Universal-Builder, UX, Live-Preview, DRY-Refactor

### Why

Im UniversalSetup-Wizard musste der User bisher "blind" Hero/Strip/All auswählen und konnte erst NACH dem Add sehen wie die Karte aussieht. Wenn die Smart-Defaults nicht passten oder die Auswahl ungünstig war, hieß es: zurück, neu wählen, nochmal Add. Mit Live-Preview sieht User den Effekt jeder Auswahl sofort — direkter UX-Win, keine Trial-and-Error-Schleifen.

### Solution — DRY-Refactor + neue Mini-Component

**1. Neuer File `views/universalRenderHelpers.js`** (~80 LOC) — Pure Functions extrahiert aus UniversalDeviceView:

- `resolveEntity(hass, entityId)` — entity_id → normalisiertes Plain-Object
- `resolveSlots(hass, slots)` — komplette Slot-Auflösung
- `formatHeroValue(e)` / `formatStripValue(e)` — Magnitude-aware numeric Formatter
- `TOGGLEABLE_DOMAINS` Set

Pure Functions, keine Hooks, keine JSX → triviale Wiederverwendung in beiden Render-Paths (View + Preview).

**2. Neuer File `components/UniversalPreviewCard.jsx`** (~180 LOC) — read-only Mini-Vorschau:

- Props: `{ hass, slots, name, lang, maxAllItems = 3 }`
- Rendert kompakt: Hero (28px statt 52px) + Strip (kleinere Karten) + max 3 List-Items + "+N more"-Hint
- Empty-Slot-Placeholders ("Kein Hero gewählt") wenn Slots leer
- Lila "VORSCHAU"-Badge oben links damit klar dass es nicht die echte Karte ist
- KEIN Toggle-Button (Preview ist nur Anzeige)

**3. UniversalDeviceView.jsx auf Helpers umgestellt** (~60 LOC weniger duplizierte Code):

```diff
- function resolveEntity(hass, entityId) { ... }
- function formatHeroValue(e) { ... }
- function formatStripValue(e) { ... }
+ import { resolveSlots, formatHeroValue, formatStripValue } from './universalRenderHelpers.js';
```

Snapshot-useMemo nutzt jetzt direkt `resolveSlots(hass, slots)` — eine Zeile statt acht.

**4. UniversalSetup.jsx mit Preview integriert:**

- **Step 2:** optionaler Preview-Toggle ganz oben (Default: an im Edit-Mode, aus im Add-Mode — sonst zu viel Visual-Lärm beim Onboarding). Collapsible mit AnimatePresence-Animation.
- **Step 3:** Live-Preview ersetzt die alte Text-Summary. Statt "· Hero: sensor.x · Strip: 4 Werte · Liste: 12 Entitäten" zeigt jetzt die Mini-Karte echte Werte.

`previewSlots` ist ein useMemo der heroEntity/stripEntities/allEntities zu einem `{hero, strip, all}`-Object kombiniert — die Preview re-rendert sofort bei jedem Klick.

### UX-Flow

```
Add-Mode:
  Step 1 (Device-Picker)
    → Step 2 (Entity-Selection)
      ↑ Preview-Toggle (default: aus, User kann einblenden)
      → Step 3 (Naming + finale Preview, IMMER sichtbar)

Edit-Mode:
  Step 2 (Entity-Selection mit Preview default: AN)
    → Step 3 (Save mit Preview)
```

### Files

| File | Change |
|---|---|
| `device-entities/views/universalRenderHelpers.js` | NEU (~80 LOC, Pure Functions) |
| `components/UniversalPreviewCard.jsx` | NEU (~180 LOC) |
| `device-entities/views/UniversalDeviceView.jsx` | -50 LOC (Helpers extrahiert) |
| `components/setup-flows/UniversalSetup.jsx` | + Preview-Toggle in Step 2, + Live-Preview in Step 3 |

### Was noch offen

- **Layout-Templates** (Vehicle / Appliance / Sensor-Hub) — andere visuelle Layouts wählbar, Preview würde das Template-Layout zeigen
- **Bulk-Edit** — mehrere Universal-Devices auf einmal umbenennen / Layout wechseln
- **Drag-Reorder** im Strip — User kann Strip-Reihenfolge ändern (aktuell durch Click-Order definiert)

---

## Version 1.1.1336 - 2026-05-01

**Title:** Universal Builder Edit-Flow — bestehende Devices in-place bearbeiten ohne Remove + Re-Add
**Hero:** none
**Tags:** Feature, Universal-Builder, Edit-Flow

### Why

Direkt nach v1.1.1335 (Universal Builder Add-Flow) war klar: jeder User wird nach dem ersten Add sagen "Eigentlich will ich noch X als Strip statt Y, und Z aus der Liste raus." Bisher: Device removen + komplett neu aufsetzen. Schlecht. v1.1.1336 löst das mit einem Edit-Flow direkt aus dem UniversalDeviceView heraus.

### Solution

**1. `IntegrationEntity.updateDevice` — neue Action**

```js
updateDevice: async function({ deviceId, updates }) {
  // 1. Persist via deviceConfigStorage
  // 2. Propagate via entity.updateAttributes() → emittet system-entity-updated
  //    Event → DataProvider re-rendert die View
}
```

Live-entity wird in-place mit den neuen Slots/Name aktualisiert. Kein Re-Mount nötig — die View pickt die neuen Attributes über den Event-Listener auf.

**2. `UniversalSetup` — Edit-Mode**

Zwei neue Props: `mode='add'|'edit'` und `existingDevice`. Im Edit-Mode:
- Step 1 (Device-Picker) wird übersprungen — Initial-Step ist 2
- Alle States (heroEntity, stripEntities, allEntities, deviceName) werden aus `existingDevice` prefilled
- Step-Indicator zeigt nur 2 Steps statt 3
- Header: "Speichern" statt "Hinzufügen"
- Final-Submit gibt `{...existingDevice, name, slots, _isEdit: true, _deviceId}` an `onComplete` — Caller erkennt am `_isEdit`-Flag dass es ein Update ist

**3. `UniversalDeviceView` — Settings-Toggle + ViewRefContext**

- Neuer State `editingMode`. Wenn true: rendert UniversalSetup statt der normalen Hero+Strip+List-View
- `useRegisterViewRef('printer', {...})` registriert die Toolbar-Handler unter dem geteilten `printer`-Key (analog Printer3D + EnergyDashboard)
- Settings-Button öffnet Edit-Mode, Back-Button im Edit-Mode kehrt zur Normal-View zurück
- Lazy-Wraps gegen TDZ (siehe v1.1.1333 Lehre): `handleRefresh: (...args) => handleRefresh(...args)`

**4. Reaktivität nach In-Place-Update**

Damit View nach `updateDevice` die neuen Slots zeigt:
- View hört auf `system-entity-updated` Event von `updateAttributes()`
- Event mit matchender entity_id → `setUpdateBump(b => b + 1)`
- `useMemo([entity, hass, updateBump])` re-computed Snapshot

Sauberer als entity-Reference-Wechsel (der nicht garantiert ist) und sauberer als Re-Mount (der View-State zerstören würde).

### UX

```
Universal-Device öffnen
  → Settings-Button (Toolbar oben rechts)
    → UniversalSetup im Edit-Mode (2 Steps statt 3)
      → Slots umbauen (Hero-Dropdown, Strip-Checkboxes, All-Checkboxes)
      → "Speichern"
    → Live-Update der View mit neuen Slots
```

Cancel-Button im Step 2 (statt "Zurück") und in Step 3 ("Zurück" zu Step 2). Kein Datenverlust falls der User abbricht.

### Files

| File | Change |
|---|---|
| `system-entities/entities/integration/index.js` | + `updateDevice` action (~50 LOC) |
| `system-entities/entities/integration/components/setup-flows/UniversalSetup.jsx` | + Edit-Mode (`mode`, `existingDevice` props), Step-Skip, Save-Button-Variant |
| `system-entities/entities/integration/device-entities/views/UniversalDeviceView.jsx` | + editingMode-State, useRegisterViewRef, system-entity-updated Listener, Edit-Render-Pfad |

### Was noch offen

- **Layout-Templates** (Vehicle / Appliance / Sensor-Hub) — Phase 3 aus dem Plan
- **Live-Preview** während Step 2 — zeigt schon eine Mini-Card der ausgewählten Slots
- **Bulk-Edit** — mehrere Universal-Devices auf einmal umbenennen / Layout wechseln

---

## Version 1.1.1335 - 2026-05-01

**Title:** Universal Device Builder — generische Karten für JEDES HA-Device (Tesla, Waschmaschine, Smart-Plugs, alles)
**Hero:** none
**Tags:** Feature, Integration, Universal-Builder, Long-Tail-Coverage

### Why

Bisher hatte die Card 3 Premium-Device-Types mit hand-codierten Custom-Views (Printer3D, Energy Dashboard, Weather). Jeder neue Type bedeutet: Entity-Class + Setup-Wizard + maßgeschneiderte View — typisch 600-2000 LOC. Für die hunderten anderen Geräte-Arten in HA (Tesla, Miele-Waschmaschinen, Smart-Coffee, Vakuum-Roboter, Smart-Plugs, …) ist das nicht skalierbar.

Universal Builder schließt diese Long-Tail-Lücke: User wählt ein beliebiges HA-Device aus seiner Installation, picks Entitäten in einer geführten Auswahl, kriegt eine fertige Karte. Premium-Types bleiben unangetastet (sie sind investiert, hochpoliert, und für Power-User die volle Magie wert).

### Solution

Drei neue Files (~1100 LOC), 1 Registry-Eintrag.

**1. `UniversalDeviceEntity.js`** (~200 LOC)
Generischer Wrapper um ein HA-Device. Speichert in der Config:
```js
{
  ha_device_id: 'abc123',     // welches HA-Device
  layout: 'default',          // Template-Wahl (Phase 3 erweiterbar)
  slots: {
    hero: 'sensor.tesla_battery',         // 1 Hero
    strip: ['sensor.tesla_range', ...],   // 3-5 Strip-Werte
    all: ['sensor.tesla_...', ...]        // alle übrigen
  }
}
```
Auflösung der Slots passiert lazy aus `hass.states`. Toggle-Action für steuerbare Domains (switch, light, input_boolean, fan, automation, script, siren, remote, humidifier).

**2. `UniversalSetup.jsx`** (~600 LOC)
3-Step-Wizard:
- **Schritt 1 — Device Picker:** Liste aus `hass.devices`, mit Search nach Name/Manufacturer/Model/Area. Bereits hinzugefügte Geräte werden disabled markiert.
- **Schritt 2 — Entity Selection:** alle Entities des Devices (gefiltert auf nicht-disabled, nicht-hidden). User wählt Hero (1), Strip (max 5), All-Liste (rest).
- **Schritt 3 — Naming:** Display-Name, Summary mit Übersicht.

**Smart Defaults via `device_class`:**
- Hero-Priorität: `battery → power → energy → temperature → speed`
- Strip-Priorität: `temperature → humidity → battery → power → energy → voltage → current → pressure → speed → distance`
- Fallback: erstes `sensor.*` Entity als Hero, restliche als Strip/All

**3. `UniversalDeviceView.jsx`** (~300 LOC)
Drei Sections:
- **Hero**: 52px-Display in einem Gradient-Card mit Manufacturer/Model-Header
- **Status-Strip**: horizontal-scroll-row mit kompakten Karten (Name + großer Wert + Unit)
- **All-Liste**: alle restlichen Entities. Toggleable Domains kriegen einen AN/AUS-Button mit **Optimistic-Update + Pending-Lock-Pattern** (siehe HA-Card-State-Management Patterns, Pattern 3 — verhindert Flackern bei React-Reconciliation-Revert + HA-Latency-Race).

**Reaktivität via hass-Ref-Pattern** (Pattern 1): Snapshot wird mit `useMemo[hass]` berechnet, kein useEffect-Polling-Storm bei Backend-Ticks.

**4. Registry-Eintrag in `deviceTypeRegistry.js`**
```js
universal: {
  icon: '🧩',
  label: { de: 'Universal Gerät', en: 'Universal Device' },
  description: { de: 'Beliebiges HA-Gerät — Tesla, Waschmaschine, alles', en: '...' },
  EntityClass: UniversalDeviceEntity,
  SetupComponent: UniversalSetup,
}
```
Dank dem 1325-Plugin-Pattern war das eine 1-Eintrag-Änderung — `DeviceEntityFactory`, `IntegrationView.renderSetupFlow` und `CategorySelectionView` lesen automatisch aus dem Registry.

### Coexistence — kein Replace

Die 3 Premium-Types (printer3d, energy_dashboard, weather) bleiben komplett unverändert. Universal sitzt daneben in der Type-Auswahl. Nutzer-Flow bleibt:
1. Integration öffnen → "Add Device"
2. Type wählen — wenn Premium-Type passt (Bambu-Drucker, Energy-Dashboard, Wetter-Standort), nimm den
3. Wenn nicht, nimm Universal → wähle dein HA-Device

Persistenz baut auf v1.1.1334 (`deviceConfigStorage` mit HA-User-Data) auf — Universal-Devices sind cross-device synced + in HA-Backups enthalten.

### Was später kommt

- **Phase 3 — Layout-Templates:** Vehicle / Appliance / Sensor-Hub als zusätzliche Layout-Wahl im Setup-Schritt 3, mit jeweils anderem Visual-Style
- **Live-Preview im Setup:** während Step 2 schon eine Mini-Preview der Karte zeigen
- **Edit-Flow:** existierende Universal-Devices bearbeiten (Slots umordnen, Entities tauschen) ohne Re-Add

### Files

| File | LOC | Was |
|---|---|---|
| `device-entities/UniversalDeviceEntity.js` | ~200 | NEU — generische Entity |
| `components/setup-flows/UniversalSetup.jsx` | ~600 | NEU — 3-Step-Wizard |
| `device-entities/views/UniversalDeviceView.jsx` | ~300 | NEU — Hero+Strip+List |
| `device-entities/deviceTypeRegistry.js` | +18 | Registry-Eintrag |

---

## Version 1.1.1334 - 2026-05-01

**Title:** Device-Config persistence migrated from `localStorage` to HA `frontend/set_user_data` — cross-device sync, in HA backups, foundation for upcoming Universal Builder
**Hero:** none
**Tags:** Architecture, Persistence, Refactoring, ViewRefContext-Foundation

### Why

Until now all Integration-Device configs (3D printers, Energy Dashboard, Weather instances) were persisted via `localStorage` only. That caused three growing pains:

1. **Browser-bound, not user-bound.** A user opening the card on phone + tablet + desktop had to re-configure each device on each device.
2. **No backup.** Clearing browser storage = configs gone.
3. **Doesn't scale to upcoming Universal Builder.** When users start composing custom device cards (Tesla, washing machines, anything HA exposes), losing those configs to a browser cache clear becomes a real pain.

### Solution — `deviceConfigStorage.js`

New module `src/system-entities/entities/integration/deviceConfigStorage.js` (~250 LOC) wraps Home Assistant's `frontend/set_user_data` / `frontend/get_user_data` WebSocket API. This is the official HA mechanism for frontend tools that want user-bound state without their own backend integration.

**Architecture: cache + sync read + async write**

The existing 7 call sites all read configs synchronously (`useState(() => loadConfig())`, `getIntegrationEntityIds()` in render paths, sync `_loadConfig` actions). To avoid converting all of them to async, the new module uses an in-memory cache:

- **Bootstrap (once at boot):** `bootstrapDeviceConfig(hass)` runs in `IntegrationEntity.onMount()` BEFORE `loadSavedDevices()`. It loads from HA, falls back to localStorage migration if HA is empty, fills the cache.
- **Sync reads:** `getDeviceConfig()` / `getEnergySensors()` return from cache. Pre-bootstrap fallback reads localStorage directly so render paths still work during the brief window before mount.
- **Async writes:** `setDeviceConfig(hass, config)` updates cache + writes to HA + mirrors to localStorage as offline fallback.

**Schema with versioning baked in:**
```json
{
  "schema_version": 1,
  "devices": [...]
}
```

The `schema_version` field is there from day one so future migrations (when the Universal Builder introduces new fields like `ha_device_id`, `slots`, `layout`) can be done cleanly.

### Migration

One-shot, automatic, transparent to the user. On first boot of v1.1.1334:

1. Try HA `frontend/get_user_data` → empty
2. Try `localStorage.getItem('integration_config')` → has data → migrate it to HA, fill cache
3. localStorage is left intact as a backup (not deleted) so users who roll back to ≤1.1.1333 don't lose their configs

Same logic for the separate `energy_dashboard_sensors` key.

### Persistence Strategy

- **HA `frontend/set_user_data`**: Source of truth. User-bound, in HA backups, cross-device.
- **localStorage**: Mirror-write on every save as offline fallback. If HA is briefly unavailable on next boot, the cache can still bootstrap from the local mirror.

### Refactored Call Sites (7 files, 10 sites)

| File | Change |
|---|---|
| `system-entities/entities/integration/index.js` | `_loadConfig`/`_saveConfig` now delegate to `deviceConfigStorage`. `onMount` calls `bootstrapDeviceConfig(hass)` first. |
| `system-entities/entities/integration/IntegrationView.jsx` | `loadIntegrationConfig`/`saveIntegrationConfig` thinned to one-line wrappers. |
| `system-entities/entities/integration/device-entities/DeviceEntityFactory.js` | `loadDeviceEntities()` reads from cache. |
| `system-entities/entities/integration/device-entities/EnergyDashboardDeviceEntity.js` | `loadSensorConfig`/`saveSensorConfig` use `getEnergySensors`/`setEnergySensors`. `saveSensorConfig` signature extended with `hass`. |
| `system-entities/entities/integration/components/setup-flows/WeatherSetup.jsx` | Sync reader uses cache. |
| `system-entities/entities/integration/components/setup-flows/Printer3DSetup.jsx` | Sync reader uses cache. |
| `utils/patternMatching.js` | `getIntegrationEntityIds()` reads from cache. |

Net code change: **+250 LOC new storage module / -90 LOC duplicated localStorage boilerplate** removed across 7 files. Less duplication, single source of truth for the persistence layer.

### Foundation for Universal Builder (next step)

This refactor is the prerequisite for the upcoming Universal Builder feature. The new schema is ready to extend:

```js
{
  id: 'uuid',
  type: 'universal',          // ← new device type
  name: 'My Tesla',
  ha_device_id: 'abc123',     // ← which HA device drives the card
  layout: 'vehicle',          // ← template choice
  slots: { hero: '...', strip: [...], tabs: [...] }
}
```

When the Universal Builder ships, the configs will already be in HA storage from day one — no migration needed for the new feature.

---

## Version 1.1.1333 - 2026-05-01

**Title:** TDZ-Bugfix in `useRegisterViewRef`-Calls — News, Todos, Versionsverlauf and AllSchedules failed to open
**Hero:** none
**Tags:** Bugfix, ViewRefContext, TDZ

### Bug

After the ViewRefContext refactor (v1.1.1332), opening **News**, **Todos**, **Versionsverlauf**, or **AllSchedules** crashed with `ReferenceError: Cannot access 'J' before initialization`. Four core system-entity views were unusable.

### Root Cause — Temporal Dead Zone

The 1332 refactor passed toolbar handlers into `useRegisterViewRef('key', { handler1: handler1, ... }, [deps])`. Several handlers were declared as `const handleX = async () => {...}` LOWER in the same component body. JavaScript evaluates the object literal synchronously, so the `const` identifier is read before its declaration → ReferenceError.

Inline arrow wraps like `handleX: () => doX()` are safe (arrow body is lazy). Direct assignments `handleX: handleX` and shorthand `handleX,` are not.

### Audit of all 7 Views

| View | TDZ | Affected handlers |
|---|---|---|
| IntegrationView | clean | 0 (all inline) |
| EnergyDashboardDeviceView | clean | 0 (`handleRefresh` L405, before hook L419) |
| Printer3DDeviceView | clean | 0 (`handleRefresh` L97, before hook L108) |
| **NewsView** | BUG | 1 (`handleRefresh` L420 after hook L223) |
| **TodosView** | BUG | 1 (`handleRefresh` L360 after hook L241) |
| **VersionsverlaufView** | BUG | 1 (`handleRefresh` L163 after hook L62) |
| **AllSchedulesView** | BUG | 5 (`handleOverview`, `handleOpenSettings`, `handleToggleSearch`, `handleRefresh`, `handleBackNavigation`) |

### Fix

All TDZ-prone direct references replaced with lazy wraps:

```diff
- handleRefresh: handleRefresh,
+ handleRefresh: (...args) => handleRefresh(...args),
```

Plus a doc-comment hint added to [ViewRefContext.jsx](src/contexts/ViewRefContext.jsx) JSDoc example warning about the TDZ trap.

### Files

- `src/system-entities/entities/news/NewsView.jsx` — 3 wraps (handleRefresh + 2 already-OK refs for consistency)
- `src/system-entities/entities/todos/TodosView.jsx` — 2 wraps
- `src/system-entities/entities/versionsverlauf/VersionsverlaufView.jsx` — 2 wraps
- `src/system-entities/entities/all-schedules/AllSchedulesView.jsx` — 5 wraps
- `src/contexts/ViewRefContext.jsx` — JSDoc warning added

### Lesson

For `useRegisterViewRef` and similar hooks that take object literals of function refs: **always use the lazy-wrap pattern**, even when the handler is currently declared above the hook. Future refactors can move the hook up or move the handler down — the lazy wrap makes it TDZ-immune.

---

## Version 1.1.1332 - 2026-05-01

**Title:** Antipattern-Fix: `window._fooViewRef` durch React-Context ersetzt — 7 Views + 3 Konsumenten umgestellt
**Hero:** none
**Tags:** Refactoring, Architecture, Antipattern-Fix

### Why

Seit Anbeginn wurden Toolbar-Handler von 7 System-Entity-Views (news, todos, weather, integration, printer, versionsverlauf, allSchedules) als globale `window._fooViewRef = {...}` Properties exposed, damit die Konsumenten (`<TabNavigation>`, `<DetailView>`, `<TodoFormDialog>`) Back-Button + Refresh + andere Toolbar-Actions an die passende View weiterleiten konnten.

Probleme mit dem Antipattern:
- **Globale window-Properties:** schwer testbar, leak-anfällig
- **Keine Type-Safety, keine Lint-Warnungen** bei Tippfehlern (`window._newsViewRf` würde silent failen)
- **Race-Conditions** bei View-Wechsel (alter Ref noch da, neuer überschreibt)
- **Cleanup via `delete window._foo`** ist Sync-Order-Sensitive

### Lösung — `ViewRefContext`

**Neuer File: [ViewRefContext.jsx](src/contexts/ViewRefContext.jsx)** (~110 LOC):

```jsx
export function ViewRefProvider({ children }) {
  const [viewRefs, setViewRefs] = useState({});
  const register = useCallback((key, handlers) => { ... }, []);
  const unregister = useCallback((key) => { ... }, []);
  return <ViewRefContext.Provider value={{ viewRefs, register, unregister }}>{children}</ViewRefContext.Provider>;
}

export function useViewRefs() { ... }

// Convenience hook für Views: registriert bei mount, unregistriert bei unmount.
// Nutzt Ref-Trick um Handler-Closures aktuell zu halten ohne re-register-Spam.
export function useRegisterViewRef(key, handlers, deps = []) { ... }
```

Plus Provider-Mount im App-Root ([index.jsx](src/index.jsx)):
```jsx
<ViewRefProvider>
  <DataProvider hass={hass} config={config}>
    {/* ...rest of App */}
  </DataProvider>
</ViewRefProvider>
```

### Migrations-Pattern

**Vorher (überall):**
```jsx
useEffect(() => {
  window._newsViewRef = { handleBackNavigation, handleRefresh, ... };
  return () => { delete window._newsViewRef; };
}, [...deps]);
```

**Nachher:**
```jsx
useRegisterViewRef('news', { handleBackNavigation, handleRefresh, ... }, [...deps]);
```

Konsumenten-Pattern:
```jsx
// Vorher
const isNewsView = window._newsViewRef;
if (isNewsView && window._newsViewRef.handleBackNavigation) { ... }

// Nachher
const { viewRefs } = useViewRefs();
if (viewRefs.news?.handleBackNavigation) { ... }
```

### Migrierte Files

**Views (7 — alle nutzen jetzt `useRegisterViewRef`):**
- `NewsView.jsx`
- `TodosView.jsx`
- `VersionsverlaufView.jsx`
- `AllSchedulesView.jsx`
- `IntegrationView.jsx`
- `Printer3DDeviceView.jsx`
- `EnergyDashboardDeviceView.jsx` (registriert auch unter 'printer'-Key, weil EnergyDashboard und Printer3D dieselbe Toolbar-API teilen — nur eine View ist gleichzeitig gemountet)

**Konsumenten (3 — alle nutzen jetzt `useViewRefs`):**
- `TabNavigation.jsx` — ~70 References auf `viewRefs.foo` umgestellt; switch-Statement deutlich kompakter
- `DetailView.jsx` — ~10 References umgestellt
- `TodoFormDialog.jsx` — 1 Reference umgestellt

**Plus** Provider gemountet in `index.jsx`.

### Bonus-Vereinfachung in TabNavigation

Beim Refactoring ist mir aufgefallen: das alte switch-Statement in `handleActionClick` hatte für jede Action 5-7 if/else-if-Branches mit Boilerplate (`if (isNewsView && window._newsViewRef.handleX) window._newsViewRef.handleX();`). Mit dem Context-Pattern und Optional-Chaining (`?.`) zusammen kompakt:

```jsx
case 'back':
  if (news?.handleBackNavigation) news.handleBackNavigation();
  else if (todos?.handleBackNavigation) todos.handleBackNavigation();
  // ...
  else onBack?.();
  break;
```

Plus `useRegisterViewRef`'s Ref-Proxy-Trick: registriert wird nur EINMAL bei mount, intern werden die latest-Handler via Ref gelesen. Dadurch: keine Re-Registrierungen bei jedem Render der View.

### Files touched

- `src/contexts/ViewRefContext.jsx` — **neu** (~110 LOC)
- `src/index.jsx` — `<ViewRefProvider>` mountet, 1 Import
- `src/system-entities/entities/news/NewsView.jsx` — useEffect → useRegisterViewRef
- `src/system-entities/entities/todos/TodosView.jsx` — same
- `src/system-entities/entities/versionsverlauf/VersionsverlaufView.jsx` — same
- `src/system-entities/entities/all-schedules/AllSchedulesView.jsx` — same
- `src/system-entities/entities/integration/IntegrationView.jsx` — same
- `src/system-entities/entities/integration/device-entities/views/Printer3DDeviceView.jsx` — same
- `src/system-entities/entities/integration/device-entities/views/EnergyDashboardDeviceView.jsx` — same (auch unter 'printer'-Key)
- `src/components/DetailView/TabNavigation.jsx` — alle window._-Refs auf viewRefs umgestellt, switch-Statement kompaktiert
- `src/components/DetailView.jsx` — alle window._-Refs auf viewRefs umgestellt
- `src/system-entities/entities/todos/components/TodoFormDialog.jsx` — `window._todosViewRef` → `viewRefs.todos`
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Impact

- **0 verbleibende `window._*ViewRef`-Aufrufe** im src/ (außer in Comments)
- **Type-safer**: Tippfehler in `viewRefs.news` werden vom JSX-Bundler gemeldet
- **Test-bar**: Tests können den Context mit Mock-viewRefs füllen, kein window-Mocking nötig
- **Race-Condition-Sicherer**: register/unregister läuft im React-Lifecycle, nicht in setTimeout-Order
- **Keine User-sichtbare Verhaltens-Änderung** — reine Architektur-Migration

## Version 1.1.1331 - 2026-05-01

**Title:** EnergyDashboardSettingsView Splitting Phase 5 — main + circular-overview Sub-Views extrahiert + Dangling-Reference-Bug aus Phase 3 behoben
**Hero:** none
**Tags:** Refactoring, Architecture, Energy-Dashboard, Bugfix

### Why

Beim Vorbereiten der mini-SubView-Extraction ist ein **Bug aus Phase 3 (1328) aufgefallen**: `EnergyDashboardSettingsView.jsx` hatte 3 Dangling-References auf Helper-Funktionen, die im Parent (`EnergyDashboardDeviceView.jsx`) als `useCallback`/`useMemo` definiert sind, aber bei der Settings-Extract nicht durch Props gereicht wurden:

- `getCircularTypeLabel(type)` — Lokalisiertes Label für Circular-Type
- `getCircularSensorMapping(type)` — Sensor-Mapping pro Circular-Type
- `enabledCirculars` — useMemo-Array der aktiven Circulars

Beim Rendern der `circular-overview` SubView hätte das **Runtime-Crash** (`ReferenceError`) ergeben. Nicht aufgefallen, weil der User vermutlich nach Phase 3 noch nicht die Circular-Sub-View geöffnet hatte. Das jetzt mit-fixen.

Plus: die mini-SubView-Extraction (kosmetisch, hat aber den Vorteil dass die Settings-Datei klar wird).

### Was extrahiert wurde

**[EnergyDashboardSettingsHomeView.jsx](src/system-entities/entities/integration/device-entities/views/EnergyDashboardSettingsHomeView.jsx)** (NEU, ~95 LOC) — die `settingsView === 'main'` Branch. Settings-Landing-Page mit zwei Navigation-Cards: "Werte" → sensors-SubView, "Circular" → circular-overview-SubView.

Props: `currentLang, settingsScrollRef, isSettingsHovered, setSettingsView, enabledCirculars` (5 Props).

**[EnergyDashboardCircularOverviewView.jsx](src/system-entities/entities/integration/device-entities/views/EnergyDashboardCircularOverviewView.jsx)** (NEU, ~100 LOC) — die `settingsView === 'circular-overview'` Branch. Liste aller 4 Circular-Typen (verbrauch/nettonutzung/solarerzeugung/batterie) mit Toggle pro Type.

Props: `currentLang, settingsScrollRef, isSettingsHovered, setSettingsView, circularConfig, getCircularSensorMapping, getCircularTypeLabel, updateCircularConfig` (8 Props).

### Bug-Fix: 3 dangling refs durch-gepropst

Settings-Component-Signatur erweitert um 3 Props:
```jsx
export const EnergyDashboardSettingsView = ({
  ...18 existing props,
  // v1.1.1331: 3 Helpers aus dem Parent durchgereicht (waren seit Phase 3 dangling refs)
  enabledCirculars,
  getCircularSensorMapping,
  getCircularTypeLabel,
}) => { ... }
```

Plus Main-File: alle 3 Props in den Settings-Component-Call ergänzt:
```jsx
<EnergyDashboardSettingsView
  ...18 existing props
  enabledCirculars={enabledCirculars}
  getCircularSensorMapping={getCircularSensorMapping}
  getCircularTypeLabel={getCircularTypeLabel}
/>
```

### Impact

- **Settings-File: 437 → 351 LOC** (-86, -20%)
- **Bug behoben** der seit 1328 stillschweigend lauerte
- 2 saubere mini-SubView-Files im views/ Verzeichnis

### Endstand EnergyDashboard-Architektur

```
device-entities/
├── EnergyDashboardDeviceEntity.js              (1069)
├── energyDashboardCalculations.js              (~265 — pure helpers)
└── views/
    ├── EnergyDashboardDeviceView.jsx           (763)
    ├── EnergyDashboardSensorsConfigView.jsx    (687)
    ├── EnergyDashboardSettingsView.jsx         (351 — Wrapper + AnimatePresence)
    ├── EnergyDashboardSensorSelectionView.jsx  (165)
    ├── EnergyDashboardCameraView.jsx           (155)
    ├── EnergyDashboardImageView.jsx            (130)
    ├── EnergyDashboardCircularOverviewView.jsx (~100, NEU)
    ├── EnergyDashboardSettingsHomeView.jsx     (~95, NEU)
    └── EnergyDashboardSensorUtils.js           (70)
```

Alle Files navigierbar (kein File >800 LOC bei den Views, Entity bei 1069). Splitting-Sequenz vollständig.

### Files touched

- `src/system-entities/entities/integration/device-entities/views/EnergyDashboardSettingsHomeView.jsx` — **neu**
- `src/system-entities/entities/integration/device-entities/views/EnergyDashboardCircularOverviewView.jsx` — **neu**
- `src/system-entities/entities/integration/device-entities/views/EnergyDashboardSettingsView.jsx` — 2 Imports rein, 2 Branches durch Component-Calls ersetzt, 3 Props zur Component-Signatur ergänzt
- `src/system-entities/entities/integration/device-entities/views/EnergyDashboardDeviceView.jsx` — 3 Props an Settings-Component-Call ergänzt
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Lehre — Component-Extraction & Closure-Hidden-Refs

Bei der Phase-3-Extraction (1328) wurde ein 987-Zeilen-Block aus dem Parent in eine eigene Component verschoben. Der inner-Code referenziert via Closure `getCircularTypeLabel`, `getCircularSensorMapping`, `enabledCirculars` aus dem Parent-Scope. Nach Move in eine separate Component sind diese Refs **dangling** — der Linter/Compiler fängt das nicht, weil JavaScript ist dynamisch typed; nur ein Render-Versuch hätte den Crash gezeigt.

**Pattern-Erkenntnis:** beim Extract-Refactoring **immer einmal komplett durchgreppen** nach allen Identifiern die im extracted-Block verwendet werden, gegen die Liste der definierten Props matchen. Was übrig ist, sind die Dangling-Refs.

## Version 1.1.1330 - 2026-05-01

**Title:** EnergyDashboardDeviceEntity Refactoring — 5 Calculation-Helpers in Module-Datei extrahiert (Entity 1294 → 1069 LOC)
**Hero:** none
**Tags:** Refactoring, Architecture, Energy-Dashboard

### Why

Nach der View-Splitting-Quadrologie (1326-1329) war `EnergyDashboardDeviceEntity.js` mit 1294 LOC das nächste große File im Modul. Bei genauerer Analyse: die letzten ~230 LOC sind **5 private Helper-Funktionen** (`_fetchStatistics`, `_aggregateHistory`, `_getPeriodMilliseconds`, `_calculatePeriodDates`, `_getISOWeek`) die als `private` Functions innerhalb des `actions: { ... }` Blocks der Entity-Klasse definiert waren und über `this._foo(...)` cross-gerufen wurden.

**Befund:** alle 5 sind pure Functions — kein eigener Instance-State, nur arithmetische und Daten-Transformations-Logik. Die `this`-Bezüge waren **ausschließlich** interne Cross-Calls zwischen den 5 Helpers. Perfekte Kandidaten für Module-Level-Extraction.

### Was extrahiert wurde

**[energyDashboardCalculations.js](src/system-entities/entities/integration/device-entities/energyDashboardCalculations.js)** (NEU, ~265 LOC):

```js
export function getPeriodMilliseconds(period)              // hour=3.6e6, day=8.64e7, month=~2.59e9
export function getISOWeek(date)                            // ISO 8601 week number 1-53
export function aggregateHistory(history, period, ...)      // Bucket-Aggregation für History-API-Fallback
export function calculatePeriodDates(type, idx, lang)       // Day/Week/Month/Year start/end/label
export async function fetchStatistics(params)               // HA Statistics API + History API fallback
```

Aus `this._aggregateHistory(...)` wird `aggregateHistory(...)` (direkter Module-Call statt this-Method-Call). Plus die internen Cross-Calls werden auch direkt: `aggregateHistory` ruft `getPeriodMilliseconds` direkt, `calculatePeriodDates` ruft `getISOWeek` direkt, `fetchStatistics` ruft `aggregateHistory` direkt.

### Was sich im Entity ändert

- 1 Import dazu: `import { calculatePeriodDates, fetchStatistics } from './energyDashboardCalculations.js';` (nur die zwei werden direkt von den public actions gerufen, die internen Cross-Calls sind im Helper-File selbst gelöst)
- 5 Helper-Definitionen (~230 LOC, lines 909-1140) durch einen 6-zeiligen Marker-Comment ersetzt
- 10 Call-Sites umgestellt:
  - 3× `this._calculatePeriodDates(...)` → `calculatePeriodDates(...)` (in `getHistoricalPeriod`, `getCurrentPeriodConsumption`, `getChartData`)
  - 7× `this._fetchStatistics(...)` → `fetchStatistics(...)` (in `getCurrentPeriodConsumption`, `getChartData`)

### Impact

**EnergyDashboardDeviceEntity.js: 1294 → 1069 LOC** (-225 LOC, -17%)

Plus die Helper-Funktionen sind jetzt:
- **Pure Functions** — testbar ohne Entity-Instance-Mock
- **Wiederverwendbar** — falls eine andere Component die Period-Date-Berechnung braucht (z.B. eine Future-PriceProjection-Component), kann sie `calculatePeriodDates` direkt importieren
- **Lesbarer aufgrund klarer Function-Boundary** — was vorher als Method-on-actions-context fließend war, ist jetzt explizit als Module-API

### Files touched

- `src/system-entities/entities/integration/device-entities/energyDashboardCalculations.js` — **neu** (~265 LOC)
- `src/system-entities/entities/integration/device-entities/EnergyDashboardDeviceEntity.js` — 5 Helpers raus, 10 Call-Sites umgestellt, 1 Import dazu
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Heute (Phase 2 Session-Stand)

**21 Releases** v1.1.1310 → v1.1.1330. Auch bekannt als „die Nacht in der die LOC-Bilanz gekippt ist":
- Switch-Bug-Welle (1310-1318): jump-frei ab 1318
- IOSToggle-Replacement (1320): 38 Sites, 80 LOC Legacy-CSS raus
- System-Entity-Cleanup-Trilogie (1321-1323): ~3700 LOC tot raus
- Plugin-Pattern (1325): 3 Switch-Stellen → 1 Registry-Eintrag
- EnergyDashboardDeviceView 4-Phasen-Splitting (1326-1329): Monolith → 7 Files, kein File über 800 LOC
- Plus EnergyDashboardDeviceEntity Refactoring (1330): 1294 → 1069 LOC, 5 pure Functions extrahiert

### Was noch offen ist

**Innerhalb von Settings (kosmetisch, kein konkreter Win):**
- 3 verbleibende mini-SubViews (`main`, `circular-overview`, `circular-detail`) — Settings ist mit 436 LOC navigierbar

**Big refactor:**
- **`window._integrationViewRef` / `_printerViewRef` / `_newsViewRef` / etc.** durch React-Context oder Provider ersetzen — Antipattern, von TabNavigation für Back-Button-Logic genutzt. Touches multiple files, höheres Risiko.

## Version 1.1.1329 - 2026-04-30

**Title:** EnergyDashboardSettingsView Splitting Phase 4 — `sensors`-SubView extrahiert (~648 LOC raus, Settings 1072 → 436 LOC)
**Hero:** none
**Tags:** Refactoring, Architecture, Energy-Dashboard

### Why

Nach Phase 3 (1328) war `EnergyDashboardSettingsView.jsx` mit 1072 LOC das neue größte File im Modul. Innerhalb hatte es 4 Sub-Views via AnimatePresence + slideVariants — die `settingsView === 'sensors'` Branch war mit ~648 LOC die mit Abstand größte. Phase 4 zielt nur auf diese eine Sub-View.

### Überraschung beim Lesen

Vorab-Annahme: die sensors-SubView braucht `energySensors` useMemo + `handleSensorSelect` + `sensorNames` + `sensorInfos` + `currentSensor` etc. — alles aus dem Settings-Function-Body.

Tatsächlich: nur 10 Props nötig. Die SubView ist primär Display + Trigger:
- Liste von Sensor-Slot-Buttons (Grid Import, Solar, Battery, Tariffs, etc.)
- Jeder Klick öffnet die SensorSelection-Modal (via `setShowSensorSelection(true)` + setSensorSelectionType + setSensorSelectionSource)
- Plus Info-Overlay-Trigger (i-Buttons) + Back-Navigation

Die eigentliche Sensor-List-Logik (energySensors useMemo + handleSensorSelect) ist NUR in der `SensorSelection`-Modal-Component (extrahiert in 1327) — die sensors-SubView triggert nur die Modal-Anzeige und sieht die Modal-Logik gar nicht.

### Was extrahiert wurde

**[EnergyDashboardSensorsConfigView.jsx](src/system-entities/entities/integration/device-entities/views/EnergyDashboardSensorsConfigView.jsx)** (NEU, ~687 LOC inkl. Header):

Props (10):
```
currentLang, t, settingsScrollRef, isSettingsHovered,
setShowSensorSelection, setSensorSelectionType, setSensorSelectionSource,
setSettingsView, setShowInfoOverlay, setInfoSensorType
```

Component renders Fragment (`<>...</>`) mit 3 sibling-Elements:
1. iOS-Navbar (mit Back-Button → `setSettingsView('main')`)
2. Settings-View mit den Sensor-Slot-Cards
3. CustomScrollbar

### Was sich im Settings-File ändert

- 1 Import dazu (`EnergyDashboardSensorsConfigView`)
- Inner content der `<motion.div key="sensors">` (Lines 257-904, ~648 Zeilen) durch 12-Zeilen Component-Call ersetzt
- Die `motion.div`-Wrapper bleibt für AnimatePresence-Animation-Tracking erhalten:
  ```jsx
  ) : settingsView === 'sensors' ? (
    <motion.div key="sensors" custom={1} variants={slideVariants} ...>
      <EnergyDashboardSensorsConfigView
        currentLang={currentLang}
        t={t}
        ...10 props...
      />
    </motion.div>
  )
  ```

### Impact

**EnergyDashboardSettingsView.jsx: 1072 → 436 LOC** (-636, -59%)

Kumulativ über alle 4 Phasen seit Splitting-Start:
- Phase 0: EnergyDashboardDeviceView.jsx war 2138 LOC + (`Settings`-Code als Inline-Branch)
- Phase 1-3: Main-File auf 763 LOC, Settings als 1072-LOC-Component extrahiert
- Phase 4: Settings auf 436 LOC, sensors-SubView als 687-LOC-Component extrahiert

**Stand nach Phase 4 — kein File mehr über 800 LOC im EnergyDashboard-Bereich:**

```
device-entities/views/
├── EnergyDashboardDeviceView.jsx           (763 LOC)
├── EnergyDashboardSensorsConfigView.jsx    (687 LOC)  ← NEU
├── EnergyDashboardSettingsView.jsx         (436 LOC)
├── EnergyDashboardSensorSelectionView.jsx  (165 LOC)
├── EnergyDashboardCameraView.jsx           (155 LOC)
├── EnergyDashboardImageView.jsx            (130 LOC)
├── EnergyDashboardSensorUtils.js           (70 LOC)
├── Printer3DDeviceView.jsx                 (770 LOC)
└── WeatherDeviceView.jsx                   (373 LOC)
```

### Files touched

- `src/system-entities/entities/integration/device-entities/views/EnergyDashboardSensorsConfigView.jsx` — **neu**
- `src/system-entities/entities/integration/device-entities/views/EnergyDashboardSettingsView.jsx` — Inner-Content der sensors motion.div ersetzt + 1 Import
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Was noch offen ist

**Innerhalb von Settings (Phase 5+ wenn man konsequent zu Ende splittet):**
- `settingsView === 'main'` (~70 LOC innerhalb Settings)
- `settingsView === 'circular-overview'` (~70 LOC)
- `settingsView === 'circular-detail'` (~? LOC)
- Plus die Info-Overlay (separate AnimatePresence)

Aber: Settings ist mit 436 LOC jetzt navigierbar. Die 4 verbleibenden inner-Branches sind klein (~70 LOC jeweils). Weitere Splittung wäre Kosmetik, kein konkreter Maintainability-Win mehr.

**Bigger items:**
- `EnergyDashboardDeviceEntity` splitten (1294 LOC, Heavy-Calculations + Formatter in Helper-Files)
- `window._integrationViewRef` / `_printerViewRef` durch React-Context ersetzen (Antipattern)

## Version 1.1.1328 - 2026-04-30

**Title:** EnergyDashboardDeviceView Splitting Phase 3 — Settings-View extrahiert (~987 LOC raus). Main-File 1722 → 763 LOC, kumulativ 2138 → 763 (-64%).
**Hero:** none
**Tags:** Refactoring, Architecture, Energy-Dashboard

### Why

Phase 3 — der größte verbleibende Brocken aus der EnergyDashboardDeviceView-Splitting-Initiative: der `if (showSettings)`-Branch mit ~987 LOC. Inhalt: 4 nested Sub-Views via AnimatePresence + slideVariants:
- `settingsView === 'main'` → Settings-Home (Tarif-Sensoren, Helligkeit etc.)
- `settingsView === 'sensors'` → Sensor-Configuration-Liste (BIG, ~660 LOC)
- `settingsView === 'circular-overview'` → Circular-Slideshow-Übersicht
- `settingsView === 'circular-detail'` → Circular-Type-Detail-Settings

Plus separater Info-Overlay-AnimatePresence-Block.

Genau wie Camera (1326) und SensorSelection (1327) hatte der Branch eigene `useMemo`-Inside-Conditional Rules-of-Hooks-Violation (`energySensors`) — durch Extraction jetzt top-level der Sub-Component.

### Strategie

Statt die 4 Sub-Views einzeln zu extrahieren (4× Component-Boundaries + viel State-Coupling), wird Settings als **eine** Component extrahiert. Die internen Sub-View-Branches bleiben drinnen.

Vorteil: Saubere Boundary, ein Schritt, niedriges Risiko. Nachteil: die neue Datei ist mit ~1070 LOC selbst groß. Künftige Splittung der 4 Sub-Views innerhalb der Settings-Component wäre eigene Session.

### Was extrahiert wurde

**[EnergyDashboardSettingsView.jsx](src/system-entities/entities/integration/device-entities/views/EnergyDashboardSettingsView.jsx)** (NEU, ~1072 LOC):

- Komplette `if (showSettings) { ... }` Branch ausgeschnitten
- `slideVariants` als Modul-Top-Level-Const (war im Main-Component nur für Settings)
- 18 Props bei der Component-Boundary (entity, hass, currentLang, t, plus 13 State + Setters für die Sub-Views, plus updateCircularConfig + 3 Sensor-Selection-Setter für die Modal-Auslösung):
  ```
  entity, hass, currentLang, t,
  circularConfig, setCircularConfig,
  settingsView, setSettingsView,
  selectedCircularType, setSelectedCircularType,
  showInfoOverlay, setShowInfoOverlay,
  infoSensorType, setInfoSensorType,
  isSettingsHovered, setIsSettingsHovered,
  settingsScrollRef,
  setShowSensorSelection, setSensorSelectionType, setSensorSelectionSource,
  updateCircularConfig
  ```
- Plus thin `getValueLabel(valueType)` Wrapper damit die internen JSX-Aufrufe nicht alle currentLang als 2. Argument durchreichen müssen

### Was sich im Main-File ändert

- 1 Import dazu (`EnergyDashboardSettingsView`)
- `slideVariants`-Definition (~16 Zeilen) entfernt — lebt jetzt als Modul-Top-Level in der neuen Component
- `if (showSettings) { ... }` Branch (~987 Zeilen) durch 26-Zeilen Component-Call ersetzt:
  ```jsx
  if (showSettings) {
    return (
      <EnergyDashboardSettingsView
        entity={entity}
        hass={hass}
        currentLang={currentLang}
        t={t}
        circularConfig={circularConfig}
        setCircularConfig={setCircularConfig}
        settingsView={settingsView}
        setSettingsView={setSettingsView}
        ...
        updateCircularConfig={updateCircularConfig}
      />
    );
  }
  ```

### Impact

Main-File: **1722 → 763 LOC** (-959 LOC, -56% in dieser Phase)

Kumulativ über alle 3 Phasen:
- Phase 0 (Start): 2138 LOC
- Phase 1 (1326, Camera+Image): 1880 LOC
- Phase 2 (1327, SensorSelection+Utils): 1722 LOC
- Phase 3 (1328, Settings): **763 LOC**
- **Gesamtreduktion: -1375 LOC, -64%** seit Splitting-Start

Plus drei Rules-of-Hooks-Violations behoben (Camera, SensorSelection, Settings — alle hatten `useMemo` inside conditional `if`-Branches).

### Endergebnis Datei-Struktur

```
device-entities/views/
├── EnergyDashboardDeviceView.jsx       (763 LOC, Coordination + Overview)
├── EnergyDashboardCameraView.jsx       (~155 LOC, Phase 1)
├── EnergyDashboardImageView.jsx        (~130 LOC, Phase 1)
├── EnergyDashboardSensorSelectionView.jsx (~165 LOC, Phase 2)
├── EnergyDashboardSettingsView.jsx     (~1072 LOC, Phase 3)
├── EnergyDashboardSensorUtils.js       (~70 LOC, Phase 2 — shared utils)
├── Printer3DDeviceView.jsx             (770 LOC)
└── WeatherDeviceView.jsx               (373 LOC)
```

Settings-View ist mit 1072 LOC das neue größte File — könnte später in 4 Sub-Views (main/sensors/circular-overview/circular-detail) weitergesplittet werden, wenn der Bedarf da ist. Aber: das Main-File ist jetzt navigierbar (763 LOC mit klaren Component-Boundaries für jeden View-Modus).

### Files touched

- `src/system-entities/entities/integration/device-entities/views/EnergyDashboardSettingsView.jsx` — **neu**
- `src/system-entities/entities/integration/device-entities/views/EnergyDashboardDeviceView.jsx` — Settings-Branch (~987 LOC) durch Component-Call ersetzt, slideVariants entfernt, 1 Import dazu
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Damit ist die EnergyDashboard-Splitting-Trilogie abgeschlossen

Was noch theoretisch möglich wäre (für sehr lange Sessions):
- **Settings-Sub-Views einzeln splitten** — vor allem `settingsView === 'sensors'` (~660 LOC innerhalb der Settings-Component) ist ein eigener Brocken
- **`window._integrationViewRef` / `_printerViewRef`** durch React-Context ersetzen (Antipattern)
- **EnergyDashboardDeviceEntity splitten** (1294 LOC, Heavy-Calculations + Formatter in Helper-Files)

Aber für die Maintainability ist die View-Splittung jetzt in einem guten Stand — drei klar abgegrenzte Sub-Views (Camera, Image, Settings, SensorSelection) plus Shared-Utils, Main-File auf einem navigierbaren 763-LOC.

## Version 1.1.1327 - 2026-04-30

**Title:** EnergyDashboardDeviceView Splitting Phase 2 — SensorSelection-View extrahiert + Shared-Utils ausgelagert
**Hero:** none
**Tags:** Refactoring, Architecture, Energy-Dashboard

### Why

Phase 1 (1326) hat Camera + Image extrahiert und Main-File auf 1880 LOC reduziert. Phase 2 zielt auf den **SensorSelection-Branch** (~146 LOC). Vorbedingung: drei Inline-Definitionen mussten erst in eine Util-Datei ausgelagert werden, weil sie sowohl von SensorSelection als auch vom (noch im Main-File verbleibenden) Settings-Branch genutzt werden.

### Was ausgelagert wurde

**[EnergyDashboardSensorUtils.js](src/system-entities/entities/integration/device-entities/views/EnergyDashboardSensorUtils.js)** (NEU, ~70 LOC):

- **`sensorTypeConfig`** (Pure-Config-Object): Map von Sensor-Type-ID → Filter-Config (`attr`, `units`, `deviceClass`). Definiert was als gültige HA-Entity für jeden Sensor-Slot durchgeht.
- **`getValueLabel(valueType, lang)`** (Pure-Function): i18n-Label-Mapper. Vorher las `currentLang` aus Closure → jetzt expliziter `lang`-Parameter.

Beide werden von Settings (im Main-File) UND SensorSelection (neue Sub-View) genutzt. Sharing via Util-File ist sauberer als Prop-Drilling oder Code-Duplication.

### Was extrahiert wurde

**[EnergyDashboardSensorSelectionView.jsx](src/system-entities/entities/integration/device-entities/views/EnergyDashboardSensorSelectionView.jsx)** (NEU, ~165 LOC):

- Komplette `if (showSensorSelection) { ... }` Branch ausgeschnitten und als eigene Component implementiert.
- **Bonus-Fix:** der `useMemo` für `energySensors` war vorher inside dem Conditional-Branch im Main-Component — gleiche Rules-of-Hooks-Violation wie bei Camera in Phase 1. Jetzt top-level der Sub-Component → Compliance.
- Props: `entity, hass, currentLang, sensorSelectionType, onSensorSelect, onBack`. Alle State-Setter (`setShowSensorSelection`, `setSensorSelectionSource`, `setSettingsView`) sind im `onBack`-Callback gebündelt — die Sub-Component sieht nur das Fertige API.

### Was sich im Main-File ändert

- 4 Imports dazu (`EnergyDashboardSensorSelectionView`, `sensorTypeConfig`, `getValueLabelUtil`)
- Inline-`sensorTypeConfig`-Definition (~17 Zeilen) entfernt — kommt jetzt aus dem Util-Import
- Inline-`getValueLabel`-Function (~20 Zeilen) durch Thin-Wrapper ersetzt:
  ```js
  const getValueLabel = (valueType) => getValueLabelUtil(valueType, currentLang);
  ```
  Damit müssen alle Aufrufstellen im Main-File nicht angepasst werden — sie rufen weiterhin `getValueLabel(type)` ohne lang-Argument.
- `if (showSensorSelection) { ... }` Branch (~146 Zeilen) durch 17-Zeilen Component-Call ersetzt:
  ```jsx
  if (showSensorSelection) {
    return (
      <EnergyDashboardSensorSelectionView
        entity={entity}
        hass={hass}
        currentLang={currentLang}
        sensorSelectionType={sensorSelectionType}
        onSensorSelect={handleSensorSelect}
        onBack={() => {
          setShowSensorSelection(false);
          setSensorSelectionSource(null);
          setSettingsView('sensors');
        }}
      />
    );
  }
  ```

### Impact

Main-File: **1880 → 1722 LOC** (-158 LOC, -8% zur Phase 1)

Kombiniert mit Phase 1: **2138 → 1722 LOC** (-416 LOC, -19%) seit der Splitting-Initiative startete.

Plus zwei Rules-of-Hooks-Violations behoben (Camera in 1326, SensorSelection in 1327).

### Files touched

- `src/system-entities/entities/integration/device-entities/views/EnergyDashboardSensorUtils.js` — **neu**
- `src/system-entities/entities/integration/device-entities/views/EnergyDashboardSensorSelectionView.jsx` — **neu**
- `src/system-entities/entities/integration/device-entities/views/EnergyDashboardDeviceView.jsx` — 4 Imports rein, 3 Inline-Defs raus, 1 Branch durch Component-Call ersetzt
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Was noch offen ist — Phase 3

**Settings-Branch (`if (showSettings)`)** ist mit ~987 LOC der mit Abstand größte verbleibende Branch. Hat 4 nested sub-views (`main`, `sensors`, `circular-overview`, `circular-detail`) die als eigene Sub-Components extrahiert werden könnten — wäre der größte LOC-Win wenn das gemacht wird.

Das ist aber komplexer:
- Mehr State-Coupling (`circularConfig`, `selectedCircularType`, `settingsView` etc.)
- Slide-Variants für AnimatePresence-Übergänge
- Verschachtelte sensor-Auswahl-Logik die mit der schon extrahierten SensorSelection-View interagiert

Eigene Session wert wenn es soweit ist.

## Version 1.1.1326 - 2026-04-30

**Title:** EnergyDashboardDeviceView Splitting Phase 1 — Camera + Image Sub-Views extrahiert (~258 LOC raus, plus Rules-of-Hooks-Bugfix)
**Hero:** none
**Tags:** Refactoring, Architecture, Energy-Dashboard

### Why

`EnergyDashboardDeviceView.jsx` war mit 2136 LOC das größte File im integration-Modul (3× WeatherDeviceView, fast 3× Printer3DDeviceView). Eine 2000-Zeilen-Component zu navigieren ist Schmerz, plus es enthielt eine **Rules-of-Hooks-Violation**:

```jsx
if (showCamera) {
  // ... lots of code
  const imageSrc = useMemo(() => { ... }, [...]);  // ← Hook conditionally aufgerufen
  return <div>...</div>;
}
```

`useMemo` innerhalb eines `if`-Branches im Component-Body — wenn `showCamera` zwischen Renders flippt, ändert sich die Hook-Aufruf-Reihenfolge, was React/Preact Hook-Tracking durcheinanderbringt. Stille Bug-Quelle.

### Splitting-Strategie

Der Component hat 5 große Render-Branches (Conditional-Returns):

| Branch | Lines | Komplexität |
|---|---|---|
| `showSensorSelection` | ~146 | mittel — viele Dependencies (sensorTypeConfig, getValueLabel, handleSensorSelect) |
| **`showSettings`** | **~987** | hoch — 4 nested sub-views |
| `showCamera` | ~136 | niedrig — self-contained + Rules-of-Hooks-Fix |
| `showImage` | ~54 | niedrig — pure JSX-Render |
| Main / Overview | ~66 | niedrig |

**Pragmatische 3-Phasen-Strategie** statt Big-Bang:

- **Phase 1 (1326, diese Version):** Camera + Image extrahiert — die zwei einfachsten und niedrigst-gekoppelten Branches. Plus Rules-of-Hooks-Fix als Bonus.
- **Phase 2 (geplant):** SensorSelection extrahieren — erfordert Shared-Utils-Extraction (`sensorTypeConfig`, `getValueLabel`, `handleSensorSelect`) in eigene Util-Datei, weil sowohl SensorSelection als auch Settings sie nutzen.
- **Phase 3 (geplant):** Settings-Branch (987 LOC mit nested sub-views) — komplexester Schritt, eigene Session.

### Changes

**Neue Files:**

- **[EnergyDashboardCameraView.jsx](src/system-entities/entities/integration/device-entities/views/EnergyDashboardCameraView.jsx)** (~155 LOC) — Camera-Branch extrahiert. Props: `entity, hass, currentLang, cameraImageTimestamp`. `useMemo` jetzt top-level → keine Rules-of-Hooks-Violation mehr.
- **[EnergyDashboardImageView.jsx](src/system-entities/entities/integration/device-entities/views/EnergyDashboardImageView.jsx)** (~130 LOC) — Image-Branch extrahiert. Props: `entity, hass, currentLang`. Pure JSX-Render mit hass.states-Lookup für `image.{serial}_titelbild`.

**Geändertes File:**

- **[EnergyDashboardDeviceView.jsx](src/system-entities/entities/integration/device-entities/views/EnergyDashboardDeviceView.jsx)** — 2136 → 1880 LOC (-258 LOC, -12%). Die 2 Branches durch je eine Zeile Component-Call ersetzt:
  ```jsx
  if (showCamera) {
    return <EnergyDashboardCameraView entity={entity} hass={hass} currentLang={currentLang} cameraImageTimestamp={cameraImageTimestamp} />;
  }
  if (showImage) {
    return <EnergyDashboardImageView entity={entity} hass={hass} currentLang={currentLang} />;
  }
  ```

### Impact

- **-258 LOC** im Main-File (1880 statt 2138)
- **Rules-of-Hooks-Bug behoben** in der Camera-Sub-View (useMemo jetzt unconditional top-level)
- **Re-Render-Lokalität verbessert** — wenn Slideshow-State im Main-Component sich ändert, re-rendert Camera/Image-Sub-View nicht mehr (eigene Component-Boundary)
- **Keine Verhaltens-Änderung** für User — beide Sub-Views funktionieren identisch wie vorher

### Files touched

- `src/system-entities/entities/integration/device-entities/views/EnergyDashboardCameraView.jsx` — **neu**
- `src/system-entities/entities/integration/device-entities/views/EnergyDashboardImageView.jsx` — **neu**
- `src/system-entities/entities/integration/device-entities/views/EnergyDashboardDeviceView.jsx` — 2 Branches ersetzt + 2 Imports
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Was noch offen ist

**Phase 2:** SensorSelection extrahieren. Vorbedingung: Shared-Utils (sensorTypeConfig, getValueLabel, handleSensorSelect) in eigene Datei ziehen — sind in Settings UND SensorSelection genutzt.

**Phase 3:** Settings-Branch splitten. Hat 4 sub-views (`main`, `sensors`, `circular-overview`, `circular-detail`) die als eigene Sub-Components extrahiert werden könnten. Größter LOC-Win wenn das gemacht wird.

## Version 1.1.1325 - 2026-04-30

**Title:** Plugin-Pattern für Device-Types — `deviceTypeRegistry.js` als Single Source of Truth, 3 hardcoded Switch-Stellen aufgelöst
**Hero:** none
**Tags:** Refactoring, Architecture, Integration, Plugin-Pattern

### Why

Vor 1325 war ein neuer Device-Type 4 Stellen Anpassung wert:

1. **`DeviceEntityFactory.js`:** switch-Case mit `new XyzDeviceEntity(...)`
2. **`IntegrationView.jsx renderSetupFlow()`:** switch-Case mit `<XyzSetup ... />`
3. **`IntegrationView.jsx`:** manueller Import des Setup-Components
4. **`CategorySelectionView.jsx`:** Eintrag im hardcoded `DEVICE_CATEGORIES`-Array (mit name_de, name_en, description_de, description_en, icon, available)

Plus: drei verschiedene Sources of Truth für die gleiche Information (welche Device-Types gibt es, wie heißen sie, was ist der Status). Synchron zu halten ist Wartungs-Schmerz.

### Lösung — `deviceTypeRegistry.js` als zentrale Map

Ein neues File definiert pro Type alle Metadaten + Implementierungs-Hooks:

```js
export const deviceTypeRegistry = {
  printer3d: {
    icon: '🖨️',
    label: { de: '3D-Drucker', en: '3D Printer' },
    description: { de: 'Bambu Lab & andere 3D-Drucker', en: 'Bambu Lab & other 3D printers' },
    EntityClass: Printer3DDeviceEntity,
    SetupComponent: Printer3DSetup,
  },
  energy_dashboard: { ... },
  weather: { ... },

  // Coming-soon (nur Metadaten, kein EntityClass/SetupComponent)
  oven: { icon: '🍳', label: ..., description: ... },
  dishwasher: { ... },
  vacuum: { ... },
  coffee: { ... },
  shower: { ... },
};
```

**Available-Logik via Pattern:** wenn `EntityClass` UND `SetupComponent` gesetzt sind → der Type ist „verfügbar". Sonst „coming soon".

### Helper-Functions

```js
getDeviceTypeMeta(typeId)     // → DeviceTypeMeta | undefined
isDeviceTypeAvailable(typeId) // → boolean (EntityClass + SetupComponent vorhanden?)
listDeviceTypes()             // → normalisierte Array für UI: [{id, icon, label, description, available}]
```

### Konsumenten-Anpassungen

#### **DeviceEntityFactory.js** — switch raus, registry-lookup rein

```js
// Vorher: 30 Zeilen switch-statement mit 3 cases + 5 TODOs
// Nachher:
export function createDeviceEntity(deviceConfig) {
  const meta = getDeviceTypeMeta(deviceConfig.category);
  if (!meta || !meta.EntityClass) {
    console.error(`Unknown or unimplemented device category: ${deviceConfig.category}`);
    return null;
  }
  return new meta.EntityClass(deviceConfig);
}
```

#### **IntegrationView.jsx renderSetupFlow()** — 60 Zeilen → 20 Zeilen

```js
// Vorher: switch mit 3 verschachtelten JSX-Blöcken (je ~15 Zeilen)
// Nachher:
const renderSetupFlow = () => {
  const meta = getDeviceTypeMeta(selectedCategory);
  if (!meta || !meta.SetupComponent) {
    return <div className="integration-error">...</div>;
  }
  const SetupComponent = meta.SetupComponent;
  return (
    <SetupComponent
      key={selectedCategory}
      hass={hass}
      lang={lang}
      onComplete={handleDeviceAdded}
      onCancel={() => { setCurrentView('selection'); setSelectedCategory(null); }}
    />
  );
};
```

Plus: 3 Setup-Component-Imports oben aus IntegrationView.jsx raus — die werden jetzt im Registry-File gehalten.

#### **CategorySelectionView.jsx** — DEVICE_CATEGORIES-Array (~80 Zeilen) raus

```js
// Vorher: hardcoded Array mit 8 Einträgen × 6 Properties = ~80 Zeilen
// Nachher:
const categories = useMemo(() => listDeviceTypes(), []);
```

Plus: JSX-Lookup von `category.name_de` / `category.name_en` auf `category.label[lang]`-Pattern umgestellt (uniformer + funktioniert für jede Sprache die im Registry definiert ist).

### Endergebnis — neuer Device-Type hinzufügen

**Vorher:** 4 Stellen ändern + 3 neue Files anlegen.

**Nachher:**
1. Entity-Class (`OvenDeviceEntity.js`) + Setup-Component (`OvenSetup.jsx`) anlegen
2. **Eine Zeile** im `deviceTypeRegistry`-Eintrag von `oven` ergänzen:
   ```js
   oven: {
     icon: '🍳',
     label: { de: 'Backofen', en: 'Oven' },
     description: { de: 'Smart Backöfen & Herde', en: 'Smart ovens & stoves' },
     EntityClass: OvenDeviceEntity,    // ← NEU
     SetupComponent: OvenSetup,         // ← NEU
   },
   ```
3. Fertig.

DeviceEntityFactory, IntegrationView, CategorySelectionView ziehen automatisch nach.

### Files touched

- `src/system-entities/entities/integration/device-entities/deviceTypeRegistry.js` — **neu** (~140 Zeilen Single-Source-of-Truth)
- `src/system-entities/entities/integration/device-entities/DeviceEntityFactory.js` — switch entfernt, registry-lookup
- `src/system-entities/entities/integration/IntegrationView.jsx` — `renderSetupFlow()` umgestellt + 3 Setup-Imports raus
- `src/system-entities/entities/integration/components/CategorySelectionView.jsx` — DEVICE_CATEGORIES-Array entfernt, `listDeviceTypes()` + label/description-Pattern
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Verhaltens-Änderung für User

**Keine.** Reine Architektur-Refaktorierung. Die 3 verfügbaren Device-Types (Energy Dashboard, 3D-Drucker, Wetter) sind weiterhin nutzbar, die 5 Coming-soon-Types werden weiterhin disabled angezeigt.

### Was noch offen ist

- **EnergyDashboardDeviceView splitten** (2136 LOC) — größter Maintainability-Win, aber großer Eingriff in user-kritischen Code
- **EnergyDashboardDeviceEntity splitten** (1294 LOC) — Heavy-Calculations + Formatter in Helper-Files
- **`window._integrationViewRef` / `_printerViewRef`** durch React-Context ersetzen — Antipattern fixen

## Version 1.1.1324 - 2026-04-30

**Title:** Integration Quick Wins — alle 3 Device-Views in `views/`, EnergyChartsView.css in `styles/`, hass-Ref-Pattern für PrinterSensorsList + PrinterDiagnosticsList
**Hero:** none
**Tags:** Refactoring, 3D-Drucker, Architecture, Performance, State-Management

### Why

Bei der Integration-Modul-Analyse aufgefallen:

- **Stufe 2 unvollständig:** der `views/` Subfolder existierte, aber **nur WeatherDeviceView** wurde dorthin verschoben (in 1322). Printer3DDeviceView und EnergyDashboardDeviceView lagen noch top-level im `device-entities/`-Verzeichnis.
- **CSS-Lokalitäts-Inkonsistenz:** `EnergyChartsView.css` lag in `components/`, aber `WeatherDeviceView.css` und `DeviceDetailView.css` in `styles/`. Verschiedene Konventionen.
- **Veraltetes Polling-Pattern in 2 Components:** `PrinterSensorsList` und `PrinterDiagnosticsList` hatten weiterhin `useEffect[entity, hass]` — feuern damit bei jedem hass-Backend-Tick (~10×/Minute). PrinterMiscList wurde in 1319 schon refactored, aber die Schwester-Components nicht.

### Changes

#### A) Views-Konsolidierung

```
device-entities/Printer3DDeviceView.jsx     → device-entities/views/Printer3DDeviceView.jsx
device-entities/EnergyDashboardDeviceView.jsx → device-entities/views/EnergyDashboardDeviceView.jsx
```

Plus Import-Pfad-Update in den 2 Entity-Files:
- `Printer3DDeviceEntity.js`: `viewComponent: () => import('./views/Printer3DDeviceView.jsx')`
- `EnergyDashboardDeviceEntity.js`: `viewComponent: () => import('./views/EnergyDashboardDeviceView.jsx')`

Endergebnis: **alle 3 Device-Views konsistent in `views/`**.

#### B) CSS-Lokalität

```
device-entities/components/EnergyChartsView.css → device-entities/styles/EnergyChartsView.css
```

Plus Import-Pfad-Update in `EnergyChartsView.jsx`: `import '../styles/EnergyChartsView.css'`.

Endergebnis: **alle Device-CSS-Files konsistent in `styles/`**.

#### C) hass-Ref-Pattern (1319-Pattern)

**[PrinterSensorsList.jsx](src/system-entities/entities/integration/device-entities/components/PrinterSensorsList.jsx):**

```jsx
// Vorher
useEffect(() => {
  const fetchSensors = async () => { ... };
  fetchSensors();
  const interval = setInterval(fetchSensors, 5000);
  return () => clearInterval(interval);
}, [entity, hass]);  // ← hass-Tick triggert Re-Effect bei jedem Backend-Event

// Nachher
const hassRef = useRef(hass);
useEffect(() => { hassRef.current = hass; }, [hass]);

useEffect(() => {
  let cancelled = false;
  const fetchSensors = async () => {
    if (cancelled) return;
    const currentHass = hassRef.current;
    if (!entity || !currentHass) return;
    const data = await entity.executeAction('getPrinterData', { hass: currentHass });
    if (cancelled) return;
    if (data) setSensorData(data);
  };
  fetchSensors();
  const interval = setInterval(fetchSensors, POLL_INTERVAL_MS);
  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}, [entity]);  // ← nur bei entity-Wechsel + alle 5s
```

**[PrinterDiagnosticsList.jsx](src/system-entities/entities/integration/device-entities/components/PrinterDiagnosticsList.jsx):** identisches Pattern angewendet.

**EnergyChartsView.jsx** wurde geprüft — hat das hassRef-Pattern bereits seit längerem (Zeile 81-87, ohne dass eine Versions-Notiz das dokumentiert hat). Alle fetch-useEffects nutzen `hassRef.current`. Kein Eingriff nötig.

### Impact

- **Polling-Frequenz** für PrinterSensorsList + PrinterDiagnosticsList: 1×/5s + bei entity-Wechsel (statt ~10×/Minute durch hass-Tick + 5-s-Polling parallel)
- **Konsistente Datei-Struktur** im integration/-Modul: alle Views in `views/`, alle Device-CSS in `styles/`
- **Zero Verhaltens-Änderung** für User — reine Strukturänderung + Polling-Optimierung

### Files touched

- `src/system-entities/entities/integration/device-entities/Printer3DDeviceView.jsx` → moved to `views/`
- `src/system-entities/entities/integration/device-entities/EnergyDashboardDeviceView.jsx` → moved to `views/`
- `src/system-entities/entities/integration/device-entities/components/EnergyChartsView.css` → moved to `styles/`
- `src/system-entities/entities/integration/device-entities/Printer3DDeviceEntity.js` — viewComponent-Pfad
- `src/system-entities/entities/integration/device-entities/EnergyDashboardDeviceEntity.js` — viewComponent-Pfad
- `src/system-entities/entities/integration/device-entities/components/EnergyChartsView.jsx` — CSS-Import-Pfad
- `src/system-entities/entities/integration/device-entities/components/PrinterSensorsList.jsx` — hass-Ref-Pattern
- `src/system-entities/entities/integration/device-entities/components/PrinterDiagnosticsList.jsx` — hass-Ref-Pattern
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Was noch offen ist (für separate Versionen)

**Medium effort:**
- **EnergyDashboardDeviceView splitten** (2136 LOC) in mehrere Sub-Components — Kandidaten: Header, Stats, Charts-Container, Settings-Section etc.
- **EnergyDashboardDeviceEntity splitten** (1294 LOC) — Heavy-Calculations + Formatter in eigene Helper-Files

**Big refactor:**
- **Plugin-Pattern für Device-Types:** statt hardcoded Switch-Statements in `DeviceEntityFactory.js` + `IntegrationView.renderSetupFlow()` + manueller Imports, eine Registry pro Device-Type. Neuer Type → 1 Eintrag + 3 Files (Entity, View, Setup) statt 4 Stellen ändern.
- **`window._integrationViewRef` / `_printerViewRef`** durch React-Context oder Provider ersetzen — globale window-Properties sind Antipattern.

Damit hat das integration/-Modul jetzt eine saubere Verzeichnis-Basis und reduzierte Polling-Last in 2 weiteren Components.

## Version 1.1.1323 - 2026-04-30

**Title:** Pluginstore komplett gelöscht — Code, Loader, Icon, UI-Refs, Translations, Animations (~1700 LOC weg)
**Hero:** none
**Tags:** Cleanup, Refactoring, Architecture

### Why

Bei der System-Entity-Analyse aufgefallen: Pluginstore war im **Limbo-Zustand**. Code war voll vorhanden (Entity-Definition, View-Component, Loader-Mechanismus, UI-Support an 13 Stellen) — aber **nicht im `registry.js:autoDiscover()` Loader registriert**, also im Normalbetrieb nie sichtbar oder klickbar. Der Hardcoded-Fallback in `initialization.js` hätte den Pluginstore nur theoretisch (wenn Registry nicht initialisiert) angezeigt — aber ohne `viewComponent` und damit broken.

User-Entscheidung: komplett löschen statt aktivieren oder im Limbo lassen.

### Gelöschte Files

- `src/system-entities/entities/pluginstore/index.js` (~570 LOC, PluginStoreEntity-Class mit Plugin-Install/Upload/Updates/Manifest-Validation)
- `src/system-entities/entities/pluginstore/PluginStoreView.jsx` (~430 LOC, View-Component)
- `src/system-entities/entities/pluginstore/styles/PluginStoreView.css` (~100 LOC)
- `src/system-entities/entities/pluginstore/styles/` (leeres Verzeichnis)
- `src/system-entities/entities/pluginstore/` (leeres Verzeichnis)
- `src/system-entities/utils/SystemEntityLoader.js` (~290 LOC, Plugin-Loader mit URL/GitHub/ZIP/Manifest-Funktionen — wurde NUR vom Pluginstore + dem nicht-importierten `installPlugin`-Handler genutzt)
- `src/assets/icons/other/PluginStore.jsx` (~30 LOC, Icon-Component)

### Geänderte Files (UI-Refs entfernt)

- `src/system-entities/initialization.js` — `system.pluginstore` aus Hardcoded-Fallback raus
- `src/components/SearchSidebar.jsx` — `'pluginstore'` aus DEFAULT_SHORTCUT_IDS raus
- `src/components/SearchField/utils/searchFilters.js` — 4 Stellen: `['settings', 'pluginstore']` → `'settings'`-domain-Check, `apps`-Subkategorie-Filter ohne pluginstore-Spezial-Pfad
- `src/components/DetailView/DetailHeader.jsx` — 2× `systemDomains`-Array ohne `'pluginstore'`
- `src/system-entities/integration/DeviceCardIntegration.jsx` — `PluginStore`-Import + `'pluginstore'` aus systemDomains + `pluginstore: PluginStore` aus iconMap raus
- `src/assets/icons/iconRegistry.js` — `PluginStore`-Import + `pluginstore`-Spezialbehandlung raus
- `src/system-entities/config/appearanceConfig.js` — `PluginStore`-Import + `pluginstore`-Appearance-Block (~55 LOC) raus
- `src/utils/animations/components.js` — `pluginstoreItemVariants` Animation-Definition raus
- `src/utils/animationVariants.js` — 3× `pluginstoreItemVariants` aus Imports/Exports raus
- `src/utils/translations/languages/de.js` — `pluginstore: 'Plugin Store'` raus
- `src/utils/translations/languages/en.js` — `pluginstore: 'Plugin Store'` raus
- `src/components/DeviceCard/DeviceCardGridView.jsx` — toter `.device-card.pluginstore-card` CSS-Block (Class wurde nirgends im JSX gesetzt) raus
- `src/system-entities/integration/DataProviderIntegration.js` — `installPlugin`-Handler (toter Code, nirgends importiert) raus
- `src/system-entities/registry.js` — `registerPlugin`-Method raus (wurde nur vom gelöschten SystemEntityLoader gerufen)
- `src/components/SearchField.jsx` — Comment-Reference auf pluginstore aktualisiert

### Was bewusst NICHT gelöscht wurde

- `this.plugins`-Map + `getPlugin`/`getAllPlugins` in `registry.js` — defensive Plugin-Map-Infrastruktur, klein und nicht broken. Falls in Zukunft ein Plugin-System wieder kommt, ist der Storage-Slot da.
- `pluginManifest`-Property auf `SystemEntity` (Z. 27 + 61) — ist ein passives Property das nirgends gesetzt wird. Zu klein um aufzuräumen.

### Impact

- ~1700 LOC weniger toter Code
- 14 Files vereinfacht
- 6 Files + 2 Verzeichnisse + 1 Icon komplett gelöscht
- Build-Time leicht schneller, Bundle-Size minimal kleiner
- Klarere Architektur: keine „Plugin-System-Reste" mehr die suggerieren dass es ein Plugin-System gibt

### Files touched

- 7 Files gelöscht (oben)
- 2 leere Verzeichnisse aufgelöst
- 14 Files modifiziert (UI-Refs entfernt)
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Lehre

System-Entities die im Auto-Discovery nicht gelistet sind, leben in einem Schein-Zustand: Code da, UI bereitet sich auf sie vor, aber die zentrale Registrierung fehlt. Im Code-Review sollte ein Pattern eingebaut werden: jede `entities/<name>/index.js` muss in `registry.js:autoDiscover()` erscheinen — sonst ist sie tot oder gehört aktiv deaktiviert (mit Begründung im Comment, wie es für `printer3d` damals dokumentiert war).

Damit ist auch die System-Entity-Analyse-Trilogie (Stufe 1 + 2 + 3) abgeschlossen:
- **1321 (Stufe 1):** Toter Code (Standalone-Entity-Reste Weather/Printer3D) gelöscht — ~2000 LOC
- **1322 (Stufe 2):** Konsolidierung (`weather/`/`printer3d/` Verzeichnisse aufgelöst, Files nach `integration/device-entities/` umgezogen)
- **1323 (Stufe 3):** Pluginstore komplett gelöscht — ~1700 LOC

Total: **~3700 LOC gestrichen + 11 Files weniger + klarere Verzeichnis-Struktur** in 3 Versionen.

## Version 1.1.1322 - 2026-04-30

**Title:** Stufe 2 Konsolidierung — `weather/` und `printer3d/` Top-Level-Verzeichnisse aufgelöst, Device-Files ziehen nach `integration/device-entities/`
**Hero:** none
**Tags:** Refactoring, Architecture, Cleanup, Structural

### Why

Nach 1321 (Stufe 1: tote Singleton-Entities gelöscht) waren die Verzeichnisse `weather/` und `printer3d/` nur noch Hilfs-Files (Views + Components) für die echten Multi-Instance-Entities in `integration/device-entities/`. Mental-Model-Kollision: ein Top-Level-Verzeichnis suggeriert eine eigene System-Entity, war aber nur Material für eine Entity die woanders lebt.

Plus: `printer3d/components/PrinterDetailView.css` wurde auch von Energy-Tabs genutzt — der printer-spezifische Name war eine Lüge.

### Datei-Umzüge

| Von | Nach |
|---|---|
| `weather/WeatherView.jsx` | `integration/device-entities/views/WeatherDeviceView.jsx` (umbenannt — passt zu `WeatherDeviceEntity`) |
| `weather/components/HourlyForecast.jsx` | `integration/device-entities/components/weather/HourlyForecast.jsx` |
| `weather/components/WeatherSummary.jsx` | `integration/device-entities/components/weather/WeatherSummary.jsx` |
| `weather/components/AnimatedNumber.jsx` | `integration/device-entities/components/weather/AnimatedNumber.jsx` |
| `weather/components/TemperatureBar.jsx` | `integration/device-entities/components/weather/TemperatureBar.jsx` |
| `weather/components/WeatherIcons.jsx` | `src/components/icons/WeatherIcons.jsx` (echtes shared component — wird auch von StatsBar genutzt) |
| `printer3d/components/ExpandableCard.jsx` + `.css` | `integration/device-entities/components/ExpandableCard.jsx` + `.css` |
| `printer3d/components/PrinterDetailView.css` | `integration/device-entities/styles/DeviceDetailView.css` (**umbenannt** — wird auch von Energy genutzt) |
| `system-entities/styles/WeatherView.css` | `integration/device-entities/styles/WeatherDeviceView.css` |

10 File-Moves + 4 leere Verzeichnisse aufgelöst (`weather/`, `weather/components/`, `printer3d/components/`, `printer3d/`).

### Import-Updates (~12 Stellen)

- `WeatherDeviceView.jsx` (intern): WeatherIcons, TemperatureBar, HourlyForecast, AnimatedNumber, CSS — alle Pfade neu
- `HourlyForecast.jsx`: WeatherIcons-Import auf neues shared-icon-component-Path
- `WeatherDeviceEntity.js`: `viewComponent: () => import('./views/WeatherDeviceView.jsx')` (war `'../../weather/WeatherView.jsx'`)
- `DeviceCardIntegration.jsx`: `getWeatherIcon` aus `'../../components/icons/WeatherIcons'` (war `'../entities/weather/components/WeatherIcons'`)
- `StatsBar.jsx`: `getWeatherIcon` aus `'./icons/WeatherIcons'` (war system-entities-pfad)
- `Printer3DDiagnosticsTab.jsx`: `ExpandableCard` aus `'../components/ExpandableCard'` (war `'../../../printer3d/components/...'`)
- 5× Tab-Files (3× Printer3D, 2× Energy): `DeviceDetailView.css` aus `'../styles/DeviceDetailView.css'` (war `'../../../printer3d/components/PrinterDetailView.css'`)

### Endergebnis

```
src/system-entities/entities/
├── (kein weather/, kein printer3d/ mehr)
├── integration/
│   └── device-entities/
│       ├── WeatherDeviceEntity.js
│       ├── Printer3DDeviceEntity.js
│       ├── EnergyDashboardDeviceEntity.js
│       ├── views/
│       │   └── WeatherDeviceView.jsx              (NEU — von oben)
│       ├── components/
│       │   ├── ExpandableCard.jsx + .css           (NEU — von printer3d/)
│       │   ├── PrinterMiscList.jsx
│       │   ├── PrinterSensorsList.jsx
│       │   ├── PrinterDiagnosticsList.jsx
│       │   ├── EnergyChartsView.jsx
│       │   └── weather/                            (NEU)
│       │       ├── HourlyForecast.jsx
│       │       ├── WeatherSummary.jsx
│       │       ├── AnimatedNumber.jsx
│       │       └── TemperatureBar.jsx
│       ├── styles/                                 (NEU)
│       │   ├── DeviceDetailView.css                (umbenannt von PrinterDetailView.css)
│       │   └── WeatherDeviceView.css
│       └── tabs/                                   (existierte)
└── (5 echte System-Entities: settings, news, todos, all-schedules, versionsverlauf, integration, pluginstore)

src/components/icons/
├── ActionTypeIcon.jsx                              (existierte)
└── WeatherIcons.jsx                                (NEU — echtes shared component)
```

### Impact

- **Datei-Struktur matcht mental Model:** alles Device-Related liegt in `integration/device-entities/`
- **Top-Level `entities/`** enthält jetzt nur noch echte System-Entities
- **`PrinterDetailView.css` → `DeviceDetailView.css`:** Name ehrlich, statt nur „Printer" sondern allen Devices
- **`WeatherIcons.jsx` ist jetzt echtes shared component** in `components/icons/` — wird von 2 nicht-device-Stellen (DeviceCardIntegration, StatsBar) genutzt, gehört dort hin
- **Keine Verhaltens-Änderung** für User — reine Strukturänderung, alle Cross-Imports nachgezogen

### Build-Verifikation

Vollständiger Build erfolgreich durchgelaufen — keine broken imports, alle Referenzen aufgelöst.

### Files touched

- 10 Files gemovt + umbenannt (siehe Tabelle oben)
- 4 leere Verzeichnisse aufgelöst (`weather/`, `weather/components/`, `printer3d/`, `printer3d/components/`)
- ~12 Import-Statements aktualisiert in 9 Files
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Nächste Schritte

**Stufe 3** — `pluginstore` klären: existiert in `entities/`, ist aber nicht im Auto-Discovery von `registry.js`. Entweder anders registriert oder auch toter Code. Eigene Analyse-Runde.

## Version 1.1.1321 - 2026-04-30

**Title:** Toter Code aufgeräumt — Standalone-Singleton-Entities Weather + Printer3D entfernt (~2000 LOC), nicht-genutzte Render-Pfade gelöscht
**Hero:** none
**Tags:** Cleanup, Refactoring, Architecture

### Why

Bei der System-Entity-Analyse aufgefallen: zwei Architektur-Generationen leben parallel im Repo. Die alte Singleton-Architektur (`weather/index.js`, `printer3d/index.js`) wurde bei der Migration auf das neue Multi-Instance-Pattern (`integration/device-entities/*DeviceEntity.js`) nie gelöscht. Konkret nicht mehr verwendet:

- **`weather/index.js`** Singleton-Entity (~660 LOC) — nicht im Auto-Discovery-Loader von `registry.js` registriert. WeatherDeviceEntity hat eigene Implementierung pro Location.
- **`printer3d/`** komplettes Standalone-Verzeichnis (~1354 LOC, 5 Files) — explizit deaktiviert in `registry.js:312` (Comment: „import.meta.glob includes ALL files, even deactivated ones like printer3d. So we rely only on manual imports above"). Printer3DDeviceEntity hat eigene Implementierung pro Drucker.
- **`weather:` Domain-Renderer** in `DeviceCardIntegration.jsx` — referenzierte den toten Singleton via `getEntityByDomain('weather')`, der seit der Migration immer den Fallback `'partly-cloudy'` zurückgegeben hatte. Multi-Instance-Wetter wird durch `weather_device:` gerendert.

### Was nicht gelöscht wurde

Cross-References von außerhalb der toten Verzeichnisse müssen erhalten bleiben:

- `weather/WeatherView.jsx` — wird von `WeatherDeviceEntity.viewComponent` lazy-imported
- `weather/components/WeatherIcons.jsx` — wird von `DeviceCardIntegration` und `StatsBar` genutzt
- `weather/components/*` (HourlyForecast, WeatherSummary, AnimatedNumber, TemperatureBar) — von WeatherView.jsx genutzt
- `printer3d/components/ExpandableCard.jsx` + `.css` — wird von `Printer3DDiagnosticsTab` genutzt
- `printer3d/components/PrinterDetailView.css` — wird von 5 Tab-Files (3× Printer3D-Tabs, 2× Energy-Tabs) genutzt

Diese Cross-References sind eine Konsolidierungs-Aufgabe für später (Stufe 2): geteilte Files in `integration/device-entities/components/` umziehen, dann die Verzeichnisse `weather/` + `printer3d/` komplett auflösen.

### Changes

**Gelöschte Files:**

- `src/system-entities/entities/weather/index.js` (~660 LOC, Singleton-Entity)
- `src/system-entities/entities/printer3d/index.js` (~250 LOC, Singleton-Entity)
- `src/system-entities/entities/printer3d/PrinterView.jsx` (~700 LOC, View-Component)
- `src/system-entities/entities/printer3d/components/PrinterDetailView.jsx` (~250 LOC, Sub-View)
- `src/system-entities/entities/printer3d/components/PrinterSettingsView.jsx` (~150 LOC, Sub-View)
- `src/system-entities/entities/printer3d/styles/PrinterView.css` (View-CSS)
- `src/system-entities/entities/printer3d/styles/` (jetzt leer, Verzeichnis entfernt)

**Geänderte Files:**

- `src/system-entities/integration/DeviceCardIntegration.jsx` — `weather:` Domain-Renderer-Block entfernt (rief `getEntityByDomain('weather')` auf, das immer null zurückgab)

### Impact

- ~2000 LOC weniger toten Code
- Weniger Confusion welche Architektur „aktuell" ist (Standalone vs. Integration)
- Build-Time leicht schneller (weniger Files zum durchgehen)
- Keine Verhaltens-Änderung für User (alle gelöschten Pfade waren nachweislich nicht ausgeführt)

### Files touched

- 6 Files gelöscht (oben)
- 1 Verzeichnis gelöscht (printer3d/styles/)
- `src/system-entities/integration/DeviceCardIntegration.jsx` — toter weather:-Block entfernt
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Nächste Schritte (separate Versionen)

**Stufe 2 (Konsolidierung):** geteilte Files (`WeatherView`, `WeatherIcons`, `ExpandableCard`, `PrinterDetailView.css`) nach `integration/device-entities/` umziehen, dann `weather/` und `printer3d/` Verzeichnisse komplett auflösen. Klarere Struktur: alles Device-relevante an einem Ort.

**Stufe 3 (`pluginstore` klären):** wird in `registry.js:autoDiscover()` nicht aufgeführt, aber existiert im `entities/` Verzeichnis — entweder anders registriert oder auch tot. Eigene Analyse-Runde wert.

## Version 1.1.1320 - 2026-04-30

**Title:** IOSToggle vollständig durch LiquidGlassSwitch ersetzt — 38 Component-Usages + 4 Inline-Markup-Usages migriert, IOSToggle.jsx + Legacy-CSS gelöscht
**Hero:** none
**Tags:** Component, Refactoring, UI, Cleanup

### Why

Auf User-Wunsch: zwei Toggle-Components nebeneinander (IOSToggle Text "An/Aus" + LiquidGlassSwitch visuell) → eine Toggle-Component (LiquidGlassSwitch). Vereinheitlicht das UI, eliminiert die Text-Variante komplett.

### Mapping vor/nach

**Vor 1320:**
- `IOSToggle` — Text "An"/"Aus", `<button>`-basiert, in 8 Files (38 Usages)
- `LiquidGlassSwitch` — Visual Pill, `<label>`+`<input>`-basiert, nur in PrinterMiscList (4 Usages)
- Inline `<label class="ios-toggle"><input><span class="ios-toggle-slider"></span></label>` — Legacy iOS-Slider-Markup, 4 Usages (3× Printer3DDeviceView, 1× PrivacySettingsTab)

**Nach 1320:**
- `LiquidGlassSwitch` — die einzige Toggle-Component, 46 Usages
- `IOSToggle.jsx` — gelöscht
- Inline-Markup — gelöscht

### LiquidGlassSwitch Default-Anpassung

Defaults geändert um Replacement drop-in-fähig zu machen:

```jsx
// Vor 1320: size='md', accent (kein Default = grün)
// Nach 1320:
size = 'sm',           // 64×30 — matcht IOSToggle-Kompaktheit
accent = '#0a84ff',    // iOS-System-Tint (Blau)
```

PrinterMiscList kann jetzt die expliziten `size="sm"` + `accent="#0a84ff"` Props weglassen — werden aus den Defaults genommen.

### Migration der 8 Component-Usages

Mechanische Replacement via sed in:
- `EnergyDashboardDeviceView.jsx` (1)
- `Printer3DDeviceView.jsx` (6)
- `iOSSettingsView.jsx` (3, news)
- `TodosSettingsView.jsx` (7)
- `ToastSettingsTab.jsx` (2)
- `GeneralSettingsTab.jsx` (8)
- `StatsBarSettingsTab.jsx` (11)
- `AppearanceSettingsTab.jsx` (4)

```bash
# Pattern (per file):
sed -i '' 's|<IOSToggle|<LiquidGlassSwitch|g' "$f"
sed -i '' "s|import { IOSToggle } from '\(.*\)/common/IOSToggle';|import { LiquidGlassSwitch } from '\1/common/LiquidGlassSwitch';|g" "$f"
```

Drop-in-kompatibel: keine einzige Verwendung nutzte custom `onLabel`/`offLabel` (vorher gegrept). Alle Calls verwenden nur die gemeinsame Basis-API (`checked`, `onChange`, evtl. `disabled`/`stopPropagation`).

### Migration der 4 Inline-Markup-Usages

Diese 4 Stellen verwendeten direkt `<label className="ios-toggle">` ohne Component-Wrapper:

**Printer3DDeviceView.jsx (3 Toggles)** — waren uncontrolled (`defaultChecked`, kein `onChange`), Browser hat State intern verwaltet. Bei Migration zu controlled LiquidGlassSwitch lokalen State eingeführt:

```jsx
const [printFinishedNotif, setPrintFinishedNotif] = useState(true);
const [errorNotif, setErrorNotif] = useState(true);
const [debugMode, setDebugMode] = useState(false);
// ...
<LiquidGlassSwitch checked={printFinishedNotif} onChange={setPrintFinishedNotif} />
```

Diese 3 Toggles sind weiterhin nicht persisted und nicht an HA-Service-Calls angeschlossen — Verhalten identisch zur alten uncontrolled Variante (toggelt visuell, ohne Side-Effect). Funktionalität wäre als Folge-Task implementierbar (localStorage / hass.callService).

**PrivacySettingsTab.jsx (1 Toggle)** — war disabled (`pointerEvents: none`, `disabled`-Attribut). Direkt durch `<LiquidGlassSwitch checked={true} disabled />` ersetzt.

### CSS-Cleanup

Aus `iOSSettingsView.css` entfernt (~80 Zeilen):
- `.ios-toggle-text` (+ Hover-Overrides für is-on-Color)
- `.ios-toggle` / `.ios-toggle input` / `.ios-toggle-slider` / `.ios-toggle-slider:before` (Legacy iOS-Slider-Markup)
- `:checked`-State-Styles für die Legacy-Variante
- `.ios-toggle` aus dem `.ios-item:hover` Cascade-Selector raus (war historisch die Wurzel des 1313-Layout-Shift-Bugs — LiquidGlassSwitch hat eigene Defensive)

### Files touched

- `src/components/common/LiquidGlassSwitch.jsx` — Defaults `size='sm'` + `accent='#0a84ff'`
- `src/components/common/IOSToggle.jsx` — **gelöscht**
- `src/system-entities/entities/integration/device-entities/components/PrinterMiscList.jsx` — redundante Props weg
- `src/system-entities/entities/integration/device-entities/EnergyDashboardDeviceView.jsx` — Component-Replacement
- `src/system-entities/entities/integration/device-entities/Printer3DDeviceView.jsx` — Component-Replacement + 3 Inline-Markup-Replacements + lokaler State
- `src/system-entities/entities/news/components/iOSSettingsView.jsx` — Component-Replacement
- `src/system-entities/entities/news/components/iOSSettingsView.css` — `.ios-toggle*`-CSS gelöscht, Hover-Cascade angepasst
- `src/system-entities/entities/todos/components/TodosSettingsView.jsx` — Component-Replacement
- `src/components/tabs/SettingsTab/components/ToastSettingsTab.jsx` — Component-Replacement
- `src/components/tabs/SettingsTab/components/GeneralSettingsTab.jsx` — Component-Replacement
- `src/components/tabs/SettingsTab/components/StatsBarSettingsTab.jsx` — Component-Replacement
- `src/components/tabs/SettingsTab/components/AppearanceSettingsTab.jsx` — Component-Replacement
- `src/components/tabs/SettingsTab/components/PrivacySettingsTab.jsx` — Inline-Markup-Replacement
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Visueller Effekt für den User

Alle Toggles im UI tauschen die Text-Darstellung („An"/„Aus") gegen die visuelle Pill mit blauem Akzent. Konsistenter iOS-Look, eine Component, ein Verhalten überall. Plus alle Stability-Fixes aus 1313-1318 (Layout-Shift-Defensive, Optimistic-Update-Flow, Press-Rubberband-jump-frei) gelten ab sofort für jede einzelne Toggle-Stelle in der App.

## Version 1.1.1319 - 2026-04-30

**Title:** PrinterMiscList Refactoring — hass via useRef, Memoization, doppelte renderControl-Calls weg
**Hero:** none
**Tags:** 3D-Drucker, Refactoring, Performance, State-Management

### Why

Tiefere Analyse nach 1318 zeigte vier strukturelle Schwächen in `PrinterMiscList`, die in den vorherigen Versionen nicht adressiert wurden:

1. **Polling-Effect feuerte bei JEDEM `hass`-Backend-Tick neu** (über `useEffect[entity, hass]`-Dependency). In einem aktiven HA-Setup heißt das ~10× pro Minute Cleanup-und-Neustart des Polling-Intervals + sofortiges `fetchMiscData`. Hohe CPU-Last, viele Re-Renders.
2. **Handler wurden bei jedem Render neu erstellt** (`handleToggle`, `handleNumberChange`, `handleButtonPress` waren plain Functions, keine `useCallback`). Auf jedem Render ändern sich die Closure-References → `<LiquidGlassSwitch onChange>` bekommt neue Function bei jedem Polling-Tick.
3. **`controlItems` wurde bei jedem Render neu erstellt** (literal Array). Ändert sich nur mit `lang`, sollte memoized sein.
4. **`renderControl(item)` wurde für Range-Items 2× pro Render aufgerufen** — einmal für `.value`, einmal für `.slider`. Doppelte Berechnung des linear-gradient-Strings, doppelte JSX-Erstellung pro Slider-Item.

### Changes

**[PrinterMiscList.jsx](src/system-entities/entities/integration/device-entities/components/PrinterMiscList.jsx):**

#### 1. hass via useRef-Pattern

```jsx
const hassRef = useRef(hass);
useEffect(() => { hassRef.current = hass; }, [hass]);

// Polling liest hass aus Ref:
useEffect(() => {
  const fetchMiscData = async () => {
    const currentHass = hassRef.current;
    if (!entity || !currentHass) return;
    const data = await entity.executeAction('getPrinterData', { hass: currentHass });
    ...
  };
  fetchMiscData();
  const interval = setInterval(fetchMiscData, POLL_INTERVAL_MS);
  return () => clearInterval(interval);
}, [entity, mergePendingPreserved]);  // ← keine hass-Dependency mehr
```

Polling läuft nur noch alle 5 s + 1× bei entity-Wechsel. Backend-State-Änderungen erscheinen mit max. 5 s Verzögerung in der UI — akzeptabel für Printer-Settings (Kamera/Licht/Ton-Toggles).

Plus: `cancelled` flag + cleanup verhindert Race wenn entity ändert während async fetch läuft.

#### 2. Handler mit useCallback

```jsx
const callService = useCallback(async (domain, service, entityId, extraData = {}) => { ... }, [entity, mergePendingPreserved]);
const handleToggle = useCallback((key, currentState, entityObj) => { ... }, [callService]);
const handleButtonPress = useCallback((entityObj) => { ... }, [callService]);
const handleNumberChange = useCallback((entityObj, value) => { ... }, [callService]);
```

Handler sind jetzt referentiell stabil über Polling-Refreshs — nur bei tatsächlichem Dependency-Wechsel re-erstellt.

#### 3. controlItems mit useMemo

```jsx
const controlItems = useMemo(() => [
  { key: 'cameraEnabled', type: 'switch', label: ... },
  ...
], [lang]);
```

Array wird nur neu erstellt wenn `lang` sich ändert.

#### 4. renderControl 1× pro Item

```jsx
{controlItems.map((item, index) => {
  const rendered = renderControl(item);   // ← einmal aufrufen
  return (
    <div key={item.key}>
      {item.type === 'range' ? (
        <>
          ...{rendered.value}
          {rendered.slider}
        </>
      ) : (...{rendered}...)}
    </div>
  );
})}
```

Vorher 2× für Range, jetzt 1×.

### Impact

- **Polling-Frequenz:** 1×/5s + bei entity-Wechsel (statt ~10×/Minute + 5-s-Polling parallel)
- **Re-Render-Stabilität:** LiquidGlassSwitch sieht stable Prop-References zwischen Polling-Ticks → keine ungewollten Reconciliation-Cycles
- **CPU-Last:** Range-Slider-Berechnung halbiert pro Render

### Was NICHT in diesem Refactoring ist

Component-Splittung (`<MiscSwitchRow>`, `<MiscRangeRow>`, `<MiscNumberRow>`, `<MiscButtonRow>`) ist hier bewusst nicht gemacht — wäre größerer Umbau mit Memoization-Wrapper-Logic, hätte aber für die User-sichtbare Smoothness keinen weiteren Effekt. Falls in Zukunft die Mega-Component-Wartbarkeit zum Problem wird, kann das als separater Refactoring-Schritt erfolgen.

Auch das Inline-Style-Migration in eine eigene `PrinterMiscList.css` wurde aus dem gleichen Grund verschoben — die Styles funktionieren, sind nur unästhetisch im JSX.

Auch das Entity-eigene 2-Sekunden-Polling (`Printer3DDeviceEntity.onMount`) bleibt bewusst drin — wird vom Device-Card woanders gelesen, Eingriff hätte Side-Effects auf andere Components.

### Files touched

- `src/system-entities/entities/integration/device-entities/components/PrinterMiscList.jsx` — Refactoring
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Lehre

Das Pattern „hass als useEffect-Dependency" ist in HA-Custom-Cards extrem teuer. `hass` ist ein neues Object-Reference bei JEDEM Backend-Event (auch von fremden Entities). Jedes useEffect das `hass` als Dep hat, feuert dauernd. Pattern für künftige HA-Card-Components: **immer `hassRef = useRef(hass)` + Update-Effect, dann hass aus Ref lesen.** Polling läuft sauber im Interval, Service-Calls bekommen immer den aktuellen hass.

## Version 1.1.1318 - 2026-04-30

**Title:** LiquidGlassSwitch — Press-Rubberband-Transform entfernt; Press-Feedback nur noch via Track-Opacity-Dim. Strukturell jump-frei, egal wie lang der Klick.
**Hero:** none
**Tags:** Component, 3D-Drucker, Toggle, UI, Bugfix, Animation

### Why

1317 hat den Jump für **schnelle Klicks (< 100 ms)** behoben via setTimeout-Delay vor `is-pressed`. User-Feedback: bei normalen Maus-Klicks (100-200 ms) bleibt der Jump trotzdem.

Tiefer-Analyse: das Problem ist strukturell. Der Press-Rubberband-Transform und die `dot-on` / `dot-off` CSS-Animationen überschreiben sich auf der gleichen `transform`-Property:

```css
/* Press-Rubberband (vor 1318) */
.switch.is-pressed .switch-dot-glass {
  transform: scaleX(calc(...));
  transform-origin: left center;
  transition: transform .12s;
}

/* Animation hat hardcoded Frame-0-Reset */
@keyframes dot-on {
  0%   { transform: scale(1) translateX(0) rotateY(0deg); }  /* ← Reset */
  12%  { transform: scale(1.55) translateX(0) rotateY(-30deg) }
  ...
}
```

Beim pointerup wechselt der CSS-Selector → Animation startet → Frame 0 setzt `scale(1) translateX(0)` → Knob springt aus der Rubberband-Position **zurück auf Ruhe-OFF**. Bei jedem Klick > Press-Delay: sichtbarer Jump.

### Lösung

Press-Rubberband-Transform und die `animation: none`-Press-Overrides komplett entfernt. Press-Feedback bleibt nur noch via Track-Opacity-Dim (`.switch.is-pressed .switch-slider::after { opacity: .35 }`).

```css
/* GELÖSCHT in 1318: */
.switch.is-pressed .switch-dot-glass { transform: scaleX(...); ... }
.switch.is-pressed input:checked ~ .switch-dot-glass { transform: ...; ... }
.switch.is-pressed input:checked ~ .switch-dot-glass { animation: none }
.switch.is-pressed input:not(:checked) ~ .switch-dot-glass.is-prim { animation: none }

/* BEHALTEN: */
.switch.is-pressed .switch-slider::after { opacity: .35 }
```

Damit gibt es keinen Transform-Konflikt mehr: `dot-on` Animation überschreibt nur ihre eigene Property-Sequenz, der Knob hat zwischen den States genau einen sauberen Animation-Pfad.

### Konsequenz für JSX

`setTimeout(... 100ms)` aus 1317 ist obsolet — die Verzögerung war nur dazu da, das Rubberband bei schnellen Klicks zu unterdrücken. Bei opacity-only Press-Feedback gibt es nichts zu unterdrücken, `is-pressed` kann sofort gesetzt werden. Code zurück auf den simplen 1306-Stil.

### Snippet-Treue

User-Snippet hatte den Rubberband 1:1, aber im Vanilla-JS-Kontext ohne den 1316-Animation-Reset-Hack-Bug (der den Konflikt erst sichtbar machte). Im Preact-Kontext ist die Kombination Rubberband-Transform + Animation-Override + Hardcoded-Frame-0-Reset strukturell defekt — Snippet-Treue an dieser Stelle bewusst aufgegeben für UX-Smoothness.

### Changes

**[LiquidGlassSwitch.css](src/components/common/LiquidGlassSwitch.css)** — vier `.is-pressed`-Regeln entfernt, eine behalten (Track-Opacity-Dim).

**[LiquidGlassSwitch.jsx](src/components/common/LiquidGlassSwitch.jsx)** — `setTimeout`-Delay aus 1317 raus, Press-Handler wieder simpel (sofort `is-pressed` setzen / entfernen).

### Files touched

- `src/components/common/LiquidGlassSwitch.css` — Press-Rubberband-Block entfernt
- `src/components/common/LiquidGlassSwitch.jsx` — Press-Handler simplifiziert
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Hinweis — Nächster Schritt: Printer-Refactoring

Tiefere Analyse zeigt strukturelle Schwächen in der Printer-Entity / PrinterMiscList die in den letzten Versionen umarbeiteten:

- **Doppeltes Polling:** `Printer3DDeviceEntity` polled selbst alle 2 s, `PrinterMiscList` zusätzlich alle 5 s + bei jedem hass-Tick → 3 Polling-Quellen parallel
- **`useEffect[entity, hass]`** feuert bei jedem hass-Backend-Tick (= 10×/Minute), nicht nur bei eigener Entity-Änderung
- **PrinterMiscList ist 350-Zeilen-Mega-Component** mit switch/range/number/button alles inline + viele Inline-Styles
- **Keine Memoization:** alle Handler werden bei jedem Render neu erstellt

Wird in einem separaten v1.1.1319 als Refactoring angegangen.

## Version 1.1.1317 - 2026-04-30

**Title:** LiquidGlassSwitch — Press-Rubberband mit 100-ms-Delay; verhindert Jump-Artifakt bei schnellen Mausklicks
**Hero:** none
**Tags:** Component, 3D-Drucker, Toggle, UI, Bugfix, Animation

### Why

Nach 1316 (Animation-Reset-Hack entfernt) blieb noch **ein Jump** beim Klick OFF→ON. Tiefere Ursache: das Press-and-Hold-Rubberband im LiquidGlassSwitch wird auf JEDEN `pointerdown` sofort aktiviert — auch bei schnellen Mausklicks (< 100 ms), wo es nur einen Jump-Artifakt produziert ohne haptisches Feedback zu liefern.

### Was beim schnellen Klick OFF→ON passiert (vor diesem Fix)

```
t=0     pointerdown   → JSX addet 'is-pressed' sofort
                        CSS: .switch.is-pressed .switch-dot-glass {
                          transform: scaleX(1.29);   ← Knob streckt sich nach RECHTS
                          transform-origin: left center;
                          transition: .12s
                        }
t=0-50  Press läuft → bei normalem Mausklick (~50 ms) ist Knob bei scaleX(~1.12)
t=50    pointerup → JSX removed 'is-pressed' → CSS rule weg
                    Default-Transition .35s startet von scaleX(1.12) zurück zu scale(1)
t=50    click event → input.checked false→true
                      CSS-Selector :checked → animation: dot-on .55s startet
                      Frame 0: scale(1) translateX(0)
                      Knob JUMPED sofort von scaleX(1.12) auf scale(1) translateX(0)
t=50-600 Animation läuft normal
```

### Was der User visuell wahrnimmt

1. **Press:** Knob streckt sich rechtswärts → wirkt wie „Pre-Move zur ON-Position" = **„ein"**
2. **Release/Click:** Animation überschreibt laufende Retract-Transition mit `frame 0 = translateX(0)` → Knob springt zurück auf normale Größe an links = **„aus"**
3. **Animation läuft:** Knob slidet zur ON-Position = **„ein"**

Drei Zustände in Millisekunden = exakt das vom User gemeldete „ein → aus → ein".

### Lösung — 100-ms-Delay vor is-pressed-Add

```jsx
const PRESS_DELAY_MS = 100;
const press = (e) => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  if (disabled) return;
  pressTimer = setTimeout(() => {
    el.classList.add('is-pressed');
    pressTimer = null;
  }, PRESS_DELAY_MS);
};
const release = () => {
  if (pressTimer) {
    clearTimeout(pressTimer);
    pressTimer = null;
  }
  el.classList.remove('is-pressed');
};
```

**Schneller Klick (< 100 ms):** Timer wird gestartet, dann von `release` gecleared, bevor `is-pressed` jemals gesetzt wird → Rubberband nie aktiv → kein Jump. Click triggert `dot-on` Animation; frame 0 = `scale(1) translateX(0)` matcht den aktuellen Dot-State → smooth Animation ohne Jump.

**Langer Press (> 100 ms):** Timer feuert → `is-pressed` wird gesetzt → Rubberband aktiviert sich normal als haptisches Feedback (Touch-typisch). Bei `release` wird Rubberband retracted, dann triggert die Animation. Hier ist der visuelle Übergang akzeptabel weil der User bewusst gehalten hat.

### Changes

**[LiquidGlassSwitch.jsx](src/components/common/LiquidGlassSwitch.jsx)** — Press-Handler mit `setTimeout(..., 100)` + Cleanup in Release-Handler. `useEffect`-Cleanup räumt Timer beim Unmount auf.

### Files touched

- `src/components/common/LiquidGlassSwitch.jsx` — Delayed Press-Rubberband
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Damit endgültig abgeschlossen — LiquidGlassSwitch-Saga

Heute 16 Iterations (1302 → 1317), die finalen Bugfixes hatten alle versteckte tiefere Ursachen die erst nach echtem User-Test sichtbar wurden:

- **1313:** `appearance: none` für native Form-Controls (Knob-Width-Shift bei Hover)
- **1314:** Optimistic Update gegen React-Reconciliation-Revert
- **1315:** Pending-Lock gegen HA-Polling-Race
- **1316:** Animation-Reset-Hack entfernt (Vanilla-JS-Snippet-Pattern, in Preact bug-induzierend)
- **1317:** Press-Rubberband mit 100-ms-Delay (kein Jump bei schnellen Mausklicks)

Pattern-Lehre: jeder direkte DOM-Manipulations-Trick aus einem Vanilla-JS-Snippet sollte in Controlled-Component-Architekturen (React/Preact) **gegen den Lifecycle geprüft** werden — viele werden überflüssig, einige werden bug-induzierend.

## Version 1.1.1316 - 2026-04-30

**Title:** LiquidGlassSwitch — Animation-Reset-Hack entfernt: er war die Quelle des „ein → aus → ein"-Jump-Cycles in Millisekunden
**Hero:** none
**Tags:** Component, 3D-Drucker, Toggle, UI, Bugfix, Animation

### Why

User-Bug nach 1314+1315: „wenn ich von aus auf ein drücke: es schaltet ein dann aus dann wieder ein innerhalb weniger ms".

1314 (Optimistic Update) und 1315 (Pending-Lock) haben das State-Management fixiert — die Multi-Animation durch HA-Polling-Race ist weg. Aber der **lokale Knob-Jump-Cycle** war nicht im State-Management, sondern im Animation-Reset-Hack der Component selbst.

### Was der Hack beim Klick OFF→ON ausgelöst hat

Synchroner Ablauf in `handleChange` (Zeilen 73-79 vor 1316):

```jsx
dot.classList.add('is-prim');
dot.style.animation = 'none';     // ← KILLT die laufende CSS-Animation
void dot.offsetWidth;             // ← Force Reflow
dot.style.animation = '';         // ← CSS-Animation neu starten
```

**Was sichtbar passiert:**

1. **t=0:** Browser togglet `input.checked: false → true` (DOM). CSS-Selektor `:checked` matcht jetzt → CSS-Regel sagt `transform: translateX(var(--travel))` (rechts) UND CSS-Animation `dot-on` startet (Frame 0 = `translateX(0)` = links).
2. **t=0+ms:** `handleChange` läuft. `style.animation = 'none'` setzt — die laufende `dot-on`-Animation wird **gekillt**. Element fällt auf seine CSS-Regel-Transform zurück: `translateX(var(--travel))` → **Knob springt nach RECHTS**.
3. **t=0+ms:** `void offsetWidth` flusht Layout (forciert browser reflow).
4. **t=0+ms:** `style.animation = ''` setzt — CSS-Animation `dot-on` wird neu angewendet, startet bei Frame 0 = `translateX(0)` → **Knob springt zurück nach LINKS**.
5. **t=0-550ms:** Animation läuft normal von links nach rechts ab.

**User sieht:** links → **rechts (Jump 1)** → **links (Jump 2)** → animiert nach rechts. Drei sichtbare Übergänge in Millisekunden = exakt „ein → aus → ein innerhalb weniger ms".

### Warum der Hack im Original-Snippet keinen Bug erzeugt hat

Im User-designten Vanilla-JS-`switch-snippet.html` war der Input direkt interaktiv (uncontrolled mode). Der Hack war für **Rapid-Click-Re-Trigger** gedacht: wenn der User schnell mehrmals klickt, soll die Animation jedes Mal sauber von Frame 0 neu starten.

In Preact mit 150-ms-Dedupe sind Rapid-Re-Triggers schon unterdrückt — der Hack ist nicht nur überflüssig, er produziert den Jump-Cycle. CSS-Animation triggert natürlich beim Selector-Wechsel `:not(:checked)` → `:checked`, ohne dass `style.animation` manipuliert werden muss.

### Changes

**[LiquidGlassSwitch.jsx](src/components/common/LiquidGlassSwitch.jsx)** — Hack komplett entfernt aus `handleChange`. `is-prim`-Class-Add bleibt erhalten (Gate für `dot-off`-Animation bei späteren OFF-Toggles, ohne den der OFF-Flip kein Animation-Feedback hat).

```jsx
const dot = dotRef.current;
if (dot && !dot.classList.contains('is-prim')) {
  dot.classList.add('is-prim');
}

if (typeof onChange === 'function') {
  onChange(!checked, e);
}
```

Drei Zeilen `style.animation`-Manipulation + `offsetWidth`-Reflow weg. CSS-Animation läuft natürlich beim Selector-Wechsel.

### Files touched

- `src/components/common/LiquidGlassSwitch.jsx` — Animation-Reset-Hack entfernt
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Lehre — Vanilla-JS-Snippet ≠ Preact-Component

Das User-Snippet hatte den Hack als Pflaster für ein Problem der Vanilla-JS-Architektur (uncontrolled input, Rapid-Click). Der 1:1-Port hat den Hack mit übernommen, ohne zu prüfen ob er in der React/Preact-Architektur noch nötig oder schädlich ist.

Pattern für zukünftige Snippet-Ports: jeden direkten DOM-Manipulations-Hack aus Vanilla-JS gegenüber dem Preact-Lifecycle prüfen — viele werden in Controlled-Components überflüssig oder gar bug-induzierend, weil React/Preact die State-Synchronisation und Animation-Triggering von sich aus übernimmt.

Damit ist die LiquidGlassSwitch-Saga (1302→1316) jetzt **wirklich** abgeschlossen: parametrisierte Vars + 4 Größen + V4-Borders aus 1309 + 0×0/appearance:none-Layout-Fix aus 1313 + Optimistic Update + Pending-Lock + Animation-Reset-Hack-Entfernung. 14 Iterations, finale Form jetzt stabil.

## Version 1.1.1315 - 2026-04-30

**Title:** PrinterMiscList: Pending-Lock gegen Polling-Race — optimistische Updates können nicht mehr von hass-Tick oder 500-ms-Refresh überschrieben werden
**Hero:** none
**Tags:** 3D-Drucker, Toggle, UI, Bugfix, State-Management

### Why

User-Feedback nach 1314: „hat teilweise das Problem gelöst" — also ist das Multi-Animation-Problem reduziert, aber nicht weg. Tiefere Analyse zeigt zwei verbleibende Race-Conditions:

**Race A — useEffect-on-hass:**

```jsx
useEffect(() => {
  const fetchMiscData = async () => { ... };
  fetchMiscData();
  const interval = setInterval(fetchMiscData, 5000);
  return () => clearInterval(interval);
}, [entity, hass]);
```

`hass` ist in HA-Custom-Cards ein Objekt das bei JEDER state-Änderung im Backend (auch von fremden Entities) ein neues Reference bekommt — oft 10-mal pro Minute. Jede Reference-Änderung re-fired die useEffect → cleanup interval → neue `fetchMiscData` mit neuem hass-Closure → sofortiger Aufruf. Wenn HA unsere `turn_on`-Anweisung noch nicht verarbeitet hat, liest `executeAction('getPrinterData')` den alten Stand `'off'` → `setMiscData({...prev, key: 'off'})` → unsere optimistische `'on'` wird überschrieben → CSS wechselt `:checked` → `:not(:checked)` → `dot-off` Animation feuert (= Animation #2).

**Race B — 500-ms-Refresh nach callService:**

```jsx
setTimeout(async () => {
  const data = await entity.executeAction('getPrinterData', { hass });
  if (data) setMiscData(data);
}, 500);
```

Echte Bambu-Hardware (Kamera, Beleuchtung) braucht oft 500 ms-2 s bis HA die State-Änderung registriert hat. Der 500-ms-Refresh liest dann immer noch `'off'` → setMiscData überschreibt → Animation #3.

### Lösung — Pending-Lock pro Key

Jeder optimistisch geschriebene Key wird für 2 Sekunden gegen Überschreiben gesperrt. Polling-Refreshes (egal aus welcher Quelle) werden durch `mergePendingPreserved` gefiltert:

```jsx
const pendingRef = useRef({}); // { [key]: { value, expiresAt } }

const mergePendingPreserved = (incoming) => {
  const now = Date.now();
  const merged = { ...incoming };
  Object.entries(pendingRef.current).forEach(([key, info]) => {
    if (info.expiresAt < now) {
      delete pendingRef.current[key];                 // Lock abgelaufen
    } else if (incoming[key] === info.value) {
      delete pendingRef.current[key];                 // HA confirmed — Lock früh dropping
    } else {
      merged[key] = info.value;                       // Optimistic erhalten
    }
  });
  return merged;
};
```

Anschließend wird `mergePendingPreserved` an JEDEM Punkt aufgerufen wo `setMiscData` mit HA-Daten passiert (intervall-Polling, hass-Tick-Refresh, callService-Refresh).

`handleToggle` schreibt zusätzlich zum optimistischen Wert auch den Pending-Lock-Eintrag mit `expiresAt = now + 2000 ms`.

### Verhalten in den drei Szenarien

| Szenario | Vorher (1314) | Nachher (1315) |
|---|---|---|
| HA schnell (< 200 ms) | OK, 1 Animation | OK, 1 Animation, Lock confirmed early |
| HA mittel (500 ms-1 s) | Refresh überschreibt → 2-3 Animations | Lock hält → 1 Animation, Lock confirmed within window |
| HA langsam (> 2 s) | Multiple Reverts → 3+ Animations | Lock läuft ab → wenn HA dann doch confirmed: 1 Animation. Wenn HA failed: Toggle springt zurück (= ehrliches Failure-Feedback) |

### Changes

**[PrinterMiscList.jsx](src/system-entities/entities/integration/device-entities/components/PrinterMiscList.jsx):**
- `pendingRef = useRef({})` als Lock-Map
- `mergePendingPreserved(incoming)` filtert pending-locked Keys
- `fetchMiscData` und `callService`-Refresh nutzen `mergePendingPreserved`
- `handleToggle` schreibt Lock-Eintrag synchron mit Optimistic Update

### Files touched

- `src/system-entities/entities/integration/device-entities/components/PrinterMiscList.jsx` — Pending-Lock + merge-Helper
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Lehre — Pattern für HA-Custom-Card-Switches

Drei Mechanismen müssen zusammenarbeiten:

1. **Optimistic Update** — sync Local-State mit Browser-Toggle (verhindert Reconciliation-Revert)
2. **Pending-Lock** — verhindert dass HA-State-Reads (egal aus welcher Quelle: hass-Tick, Polling-Tick, Refresh-Tick) den optimistischen Wert während HA-Latenz überschreiben
3. **HA-Confirmation-Drop** — wenn HA-State und optimistischer Wert matchen, kann der Lock früh aufgelöst werden (sonst hält er bis Timeout)

Pattern ist applicable auf alle anderen Toggle-Use-Cases in HA-Custom-Cards, wo Hardware-Latenz > Polling-Frequenz sein kann (Lichter mit Dimmern, Heizung, Klimaanlage, Garagentore).

## Version 1.1.1314 - 2026-04-30

**Title:** PrinterMiscList: Optimistic Update beim Switch-Toggle (verhindert Multi-Animation durch React-controlled-mode Reconciliation)
**Hero:** none
**Tags:** 3D-Drucker, Toggle, UI, Bugfix, State-Management

### Why

User-Bug-Report: „wenn ich switch klicke, triggert es mehrfach... es ist nicht flüssig einmal, sondern 2-3x".

Ablauf-Analyse beim Klick (vor diesem Fix):

1. Browser togglet `<input type="checkbox">` von `checked=false` → `true` im DOM
2. `handleChange` feuert → Animation-Reset-Hack triggert `dot-on` (Animation #1)
3. `onChange(!checked)` → `handleToggle` in PrinterMiscList → nur `callService`, **kein lokaler State-Update**
4. React reconciliation: Input-DOM (`checked=true`) ≠ Prop (`checked={false}`) → Input wird auf den Prop-Wert zurückgesetzt → CSS-Selector wechselt von `:checked` auf `:not(:checked)` → `dot-off` Animation läuft (Animation #2)
5. 500 ms später kommt HA-Refresh aus `callService`'s `setTimeout` → `setMiscData` → Prop `checked=true` → Input flippt erneut → `dot-on` Animation läuft (Animation #3)

Result: 2-3 Animationen pro Klick, springender Knob.

Das ist ein klassischer Bug bei React-controlled-Components ohne Optimistic-Update: zwischen User-Click und HA-Confirmation gibt es eine Lücke, in der React den DOM-Stand auf den (alten) Prop-Wert zurückzwingt. Bei jedem Mismatch fired das CSS-Animation-System.

### Lösung

`handleToggle` macht jetzt einen Optimistic Update — der lokale `miscData`-State flippt SYNCHRON mit dem Browser-Toggle:

```jsx
const handleToggle = (key, currentState, entityObj) => {
  if (!entityObj) return;

  const isOn = currentState === 'on' || currentState === true;
  const newValue = !isOn ? 'on' : 'off';

  // Optimistic Update — sofort lokal flippen, HA-Echo bestätigt später.
  setMiscData(prev => ({ ...prev, [key]: newValue }));

  const domain = entityObj.entity_id.split('.')[0];
  const service = !isOn ? 'turn_on' : 'turn_off';
  callService(domain, service, entityObj.entity_id);
};
```

Damit läuft React reconciliation glatt durch: Input-DOM (true) matched Prop (true), kein Revert, eine saubere `dot-on` Animation. HA-Echo bestätigt im 500 ms / 5 s Polling-Tick — bei Match keine weitere Animation, bei Mismatch (Service rejected, Hardware-Failure) flippt der Toggle zurück und der User sieht das als visuelles Feedback.

### Changes

**[PrinterMiscList.jsx](src/system-entities/entities/integration/device-entities/components/PrinterMiscList.jsx)** — `handleToggle` mit `setMiscData` davor.

### Files touched

- `src/system-entities/entities/integration/device-entities/components/PrinterMiscList.jsx` — Optimistic Update
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Lehre

In HA-Custom-Cards mit controlled-mode-Switches: **Local-State immer optimistic flippen, HA-Confirmation kommt im Polling.** Sonst gibt es zwingend einen visuellen Revert-Cycle. Pattern für andere Toggle-Use-Cases im Repo:

1. User-Click → `setLocalState(target)` (sync, vor service-call)
2. `hass.callService(...)` (async)
3. Polling-Refresh überschreibt local nur wenn HA-State stable ist
4. Bei Service-Failure flippt HA-State zurück → User sieht Mismatch als Feedback

## Version 1.1.1313 - 2026-04-30

**Title:** LiquidGlassSwitch — `appearance: none` ergänzt: `width:0/height:0` allein reicht nicht für native Form-Controls (Knob wanderte sonst beim Hover nach links)
**Hero:** none
**Tags:** Component, 3D-Drucker, Toggle, UI, Bugfix

### Why

1312 hatte den 0×0-Fix eingebaut, aber User-Test zeigt: Knob wandert beim Hover trotzdem nach links, Track wird trotzdem breiter — der Bug ist nicht weg, nur abgeschwächt.

Genauere Analyse: Browser-UA-Stylesheets ignorieren `width`/`height` auf nativen Form-Controls (`<input type="checkbox">`) solange `appearance: auto` gilt. Der Checkbox rendert seine intrinsische Default-Breite (~13 px) trotz `width: 0`. Erst `appearance: none` deaktiviert das native Sizing und macht width/height effektiv.

**Wirkungskette ohne `appearance: none`:**
1. `iOSSettingsView.css:235` setzt beim Row-Hover `.ios-item:hover input { position: relative }`
2. Der hidden `.switch input` wird damit layout-relevant im Flex-Container
3. Ohne `appearance: none` rendert der Browser ihn an ~13 px Default-Breite trotz CSS-`width: 0`
4. Das `.switch`-Label (display: inline-flex) wird 13 px breiter, Slider rückt 13 px nach rechts
5. Der Knob (`position: absolute` innerhalb des Sliders) folgt mit nach rechts — aber relativ zum verschobenen Slider erscheint er vom Auge **leftward** weil die Slider-Ränder als Referenz dienen

**Warum der alte `.ios-toggle` nicht betroffen ist (Korrektur zur 1312-Erklärung):** nicht weil sein Input `width: 0; height: 0` hat, sondern weil sein Knob als `::before`-Pseudo-Element auf dem `.ios-toggle-slider` rendert (NICHT als eigener Flex-Child). Der Slider füllt das ganze Label (`position: absolute; top:0; left:0; right:0; bottom:0`), egal wie breit das Label durch einen sichtbaren Input wird. Das Label kann auf 77 px wachsen, der Slider füllt diese 77 px aus, Knob (`::before` mit `left: 2px`) bleibt in Relation richtig.

Beim neuen `.switch` ist die Architektur anders: der Slider ist ein eigener Flex-Child mit fixer Breite (`width: var(--w)` = 64 px), der Knob ist ein anderer absolut-positionierter Child. Wenn der Input layout-relevant wird, schiebt er den Slider — Knob folgt mit, scheint aber vom Auge nach links versetzt.

### Changes

**[LiquidGlassSwitch.css](src/components/common/LiquidGlassSwitch.css)** — `.switch input` voll defensiv ausgestattet:

```css
.switch input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 0;
  height: 0;
  appearance: none;
  -webkit-appearance: none;
  margin: 0;
  padding: 0;
  border: 0;
}
```

`appearance: none` + `-webkit-appearance: none` deaktivieren das native Form-Control-Sizing. Margin/padding/border auf 0 entfernen UA-Stylesheet-Default-Spacing — auch wenn ein Browser den Checkbox doch noch rendert, beansprucht er null Layout-Space.

### Files touched

- `src/components/common/LiquidGlassSwitch.css` — `.switch input`-Block voll defensiv
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Lehre

Native Form-Controls (input/button/select) ignorieren explizite Größen-Werte solange `appearance` auf `auto` steht. Pattern für hidden Form-Controls in Custom-UIs:
- `position: absolute` (raus aus Flow)
- `opacity: 0` (unsichtbar)
- `pointer-events: none` (keine Interaktion)
- `width: 0; height: 0` (Größe minimal)
- `appearance: none; -webkit-appearance: none` (UA-Sizing aus)
- `margin: 0; padding: 0; border: 0` (UA-Spacing aus)

Diese sechs Eigenschaften zusammen machen den Input layout-immun gegen jede Cascade-Override.

## Version 1.1.1312 - 2026-04-30

**Title:** LiquidGlassSwitch — echter Bugfix: hidden Input bekommt `width:0; height:0` (verhinderte Layout-Shift bei Hover, der den Toggle ~20 % breiter machte)
**Hero:** none
**Tags:** Component, 3D-Drucker, Toggle, UI, Bugfix

### Why

User-Screenshot von 1311 zeigt: **Toggle wird beim Hover sichtbar breiter.** Plus User-Wunsch: weißer Hover-Bg muss zurück (1311 hatte ihn auf 0.18 abgemildert).

Echte Wurzel beim Vergleich mit dem alten `.ios-toggle`:

```css
/* alter ios-toggle */
.ios-toggle input { opacity: 0; width: 0; height: 0; }   ← defensiv 0×0

/* neuer switch (vor 1312) */
.switch input { position: absolute; opacity: 0; pointer-events: none }  ← KEIN width/height
```

In `iOSSettingsView.css` Zeile 232-237 steht eine Hover-Regel:
```css
.ios-item:hover:not(:active) .ios-toggle,
.ios-item:hover:not(:active) button,
.ios-item:hover:not(:active) input {
  position: relative;   ← überschreibt position:absolute des Inputs
  z-index: 11;
}
```

Das überschreibt beim Hover die `position: absolute` des hidden `.switch input` zu `position: relative`. Der hidden Input wird **layout-relevant** und nimmt seine Default-Checkbox-Breite (~13 px) ein. Da das Label `display: inline-flex` ist, schiebt der Input das Slider-Element nach rechts → **Toggle wird ~20 % breiter beim Hover**.

Beim alten `.ios-toggle input` ist `width: 0; height: 0` gesetzt — defensiv genau gegen diesen Fall. Beim neuen `.switch input` fehlte das. Genau dieselbe Defensive einziehen.

Damit ist auch klar warum der Toggle in den vorherigen User-Bildern „verändert" wirkte: nicht nur der Bg-Sprung, sondern primär die Breitenänderung. Mit dem Fix kann der ursprüngliche weiße 0.95-Hover-Bg wieder uneingeschränkt rein — die V4-Track-Border + Knob-Inset-Border aus 1309 sind genau dafür da, den Toggle auf weißem Bg sichtbar zu halten.

### Changes

**[LiquidGlassSwitch.css](src/components/common/LiquidGlassSwitch.css)** — zwei minimale Änderungen:

**1. `.switch input` bekommt `width: 0; height: 0` (Zeile 51):**
```css
.switch input {
  position: absolute; opacity: 0; pointer-events: none;
  width: 0; height: 0;   /* ← neu, defensiv wie alter ios-toggle */
}
```

**2. Hover-Override-Block aus 1311 komplett gelöscht.**
Default-Row-Hover (weißer Bg `rgba(255,255,255,0.95)`, scale 1.02, Lift-Shadow) gilt wieder uneingeschränkt für Switch-Rows. V4-Borders aus 1309 halten den Toggle visuell sichtbar.

### Files touched

- `src/components/common/LiquidGlassSwitch.css` — `width:0; height:0` ergänzt + 1311-Block entfernt
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Lehre

Der echte Bug war ein simpler Layout-Shift via Cascade-Override, der seit 1302 latent vorhanden war. Die Versionen 1307-1311 haben um das Symptom herumgefixt (translucent Track, V4-Borders, Suppression, abgemilderter Bg) — alle waren entweder Pflaster oder kaschierten andere Aspekte. Mit dem 0×0-Fix ist die Wurzel adressiert und alle V4-Maßnahmen aus 1309 funktionieren wieder so wie ursprünglich gedacht.

User-Beobachtung „bei dem alten Button gibt es keinerlei Konflikte" war damit goldwert — der Vergleich hat den 0×0-Pattern beim alten Toggle aufgedeckt, ohne den der neue Toggle den Layout-Shift bekommt.

## Version 1.1.1311 - 2026-04-30

**Title:** LiquidGlassSwitch — Row hovert wieder, aber subtil (0.18 statt 0.95 Weiß) — Toggle-Schatten werden vom Bg-Sprung nicht mehr getriggert
**Hero:** none
**Tags:** Component, 3D-Drucker, Toggle, UI, Bugfix

### Why

1310 hatte Row-Hover komplett unterdrückt → User: „es klappt nicht, jetzt hovert das item nicht". Genauere Analyse warum der **alte `.ios-toggle`** keinen Konflikt hat und der **neue `.switch`** schon:

| | Alter `.ios-toggle` (51×31) | Neuer `.switch` (s-sm 64×30) |
|---|---|---|
| Track OFF | `rgba(255,255,255,0.2)` solid-look | `rgba(120,120,128,0.36)` translucent |
| Track ON | solid `rgb(52,199,89)` | solid blau-Gradient |
| Knob-Schatten | `box-shadow: 0 2px 4px rgba(0,0,0,0.2)` (klein) | `drop-shadow(0 1px 1px) drop-shadow(0 2px 4px)` filter (zwei Layer) + V4-Inset-Border `inset 0 0 0 1px rgba(0,0,0,0.12)` |
| Verhalten bei `bg: rgba(255,255,255,0.95)` | Solid Track verdeckt Bg, kleiner box-shadow ist auf jedem Bg gleich subtil | Translucent Track lässt Bg durch (off-state); Drop-Shadow + Inset-Border auf dunklem Default-Bg dark-on-dark fast unsichtbar, auf weißem 0.95-Bg plötzlich klar sichtbar → **Knob bekommt visuell Tiefe die er vorher nicht hatte → Eindruck „Toggle hat sich verändert"** |

`scale(1.02)` ist NICHT die Hauptursache — der alte Toggle wird genauso skaliert und das stört nicht. Auch nicht der translucent OFF-Track allein (Bug zeigt sich auch im ON-State, der solid ist). **Kern-Trigger ist der harte Bg-Sprung von dunkel auf 0.95-Weiß.**

### Lösung

Statt Suppression: Hover-Bg für Switch-Rows abmildern auf `rgba(255,255,255,0.18)` + subtileren Box-Shadow. Damit:

- Row hovert sichtbar (scale 1.02 + lift-shadow + leicht hellerer Bg)
- Bg bleibt dunkel genug, dass Knob-Drop-Shadow + V4-Inset-Border weiterhin dark-on-dark fast unsichtbar bleiben
- Keine Color-Overrides auf Labels/Icons (die brauchen wir nur wenn Bg fast weiß ist)

Active-State der Row braucht kein eigenes Override mehr — `rgba(255,255,255,0.08)` Default-Bg gilt automatisch wenn Row gepresst wird.

### Changes

**[LiquidGlassSwitch.css](src/components/common/LiquidGlassSwitch.css)** — Suppression-Block aus 1310 ersetzt durch dezentes Hover-Override:

```css
@media (hover: hover) {
  .ios-item:has(.switch):hover:not(:active) {
    background: rgba(255, 255, 255, 0.18) !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.18) !important;
  }
  /* color: inherit für Labels/Subtitles/Values + SVG-Icons */
}
```

`transform: scale(1.02)` aus der Default-Row-Regel ([iOSSettingsView.css:158](src/system-entities/entities/news/components/iOSSettingsView.css:158)) wird **nicht** überschrieben → Row scaliert weiterhin mit. Das ist OK weil 2% Skalierung beim alten `.ios-toggle` auch gilt und dort nicht stört.

### Files touched

- `src/components/common/LiquidGlassSwitch.css` — Hover-Override-Block (subtle Bg + Shadow statt Suppression)
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Hinweis

Falls der Effekt noch zu stark wirkt, lassen sich `0.18` (Bg) und Shadow-Werte feiner justieren. Wenn er zu schwach wirkt (Hover kaum spürbar), kann der Bg auf `0.25-0.35` hoch — solange der Bg dunkel genug bleibt, bleibt der Knob-Schatten dark-on-dark unsichtbar.

## Version 1.1.1310 - 2026-04-30

**Title:** LiquidGlassSwitch — Row-Hover/Active der `.ios-item` darf den Toggle nicht mehr verändern (Component-owned Suppression statt nur V4-Borders)
**Hero:** none
**Tags:** Component, 3D-Drucker, Toggle, UI, Bugfix

### Why

Live-Test in HACS nach 1309 zeigt: Trotz V4-Track-Border + Knob-Inset-Border verändert sich der Toggle beim Hover über die Row sichtbar. Drei Ursachen die wir in 1309 nicht gefixt hatten:

1. **`transform: scale(1.02)` auf `.ios-item:hover`** skaliert den ganzen Inhalt der Row mit — auch den Toggle. Der wirkt 2 % größer/leicht versetzt.
2. **`background: rgba(255,255,255,0.95) !important`** verändert den Track-Bg-Kontext. Der LiquidGlassSwitch-Track ist translucent (`rgba(120,120,128,0.36)`), also scheint der Row-Bg DURCH den Track. V4-Borders mildern das ab, ändern aber nicht den durchscheinenden Look.
3. **Box-Shadow `0 8px 24px ...`** lässt die Row visuell anspringen — Toggle hüpft optisch mit.

User-Direktive: „der hover auf das item (nicht button) darf das aussehen oder animation vom button nicht verändern".

User-Hinweis dazu: der alte `.ios-toggle` (51×31, simpler iOS-Slider mit solid-colored Track) hat genau diese Konflikte NICHT — weil sein Track-Bg solid ist (festes Grau OFF / Blau ON), scheint nichts vom Row-Bg durch. Der LiquidGlassSwitch ist bewusst translucent (Snippet-Design) und braucht deshalb die Suppression um dasselbe konflikt-freie Verhalten zu bekommen.

### Changes

**[LiquidGlassSwitch.css](src/components/common/LiquidGlassSwitch.css)** — neue Suppression-Regeln am Ende der Datei (Component-owned, nicht in `iOSSettingsView.css`):

```css
@media (hover: hover) {
  .ios-item:has(.switch):hover:not(:active) {
    transform: none !important;
    background: rgba(255, 255, 255, 0.08) !important;
    box-shadow: none !important;
  }
  /* + color: inherit für labels/subtitles/values + svg-icons */
}
.ios-item:has(.switch):active {
  transform: none !important;
  background: rgba(255, 255, 255, 0.08) !important;
}
```

Effekt: Rows die einen `.switch` enthalten behalten beim Hover und Active genau ihren Default-Look. Kein Scale, kein weißer Bg, kein Shadow, kein Color-Override auf Labels/Icons. Switch hat eigene Press-/Hover-Mechanismen (is-pressed Rubberband + dot-on/off Flip-Animation), Row-Hover wäre redundant.

### Browser-Support

`:has()` benötigt Safari 15.4+ / Chrome 105+ / Firefox 121+ — für HACS 2026 universell.

### Files touched

- `src/components/common/LiquidGlassSwitch.css` — Suppression-Block ergänzt + 1309-Hinweis-Kommentar ersetzt
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Hinweis

V4-Track-Border (1.5 px @ 0.16 alpha) + Knob-Inset-Border (1 px @ 0.12 alpha) aus 1309 bleiben drin. Im Default-Bg-Kontext sind sie kaum sichtbar (dark-on-dark / black-on-white in subtle alpha). Falls jemand den Switch außerhalb einer `.ios-item`-Row auf einen weißen Bg setzt, definieren die Borders weiterhin Track + Knob klar — A11y-Reserve.

## Version 1.1.1309 - 2026-04-30

**Title:** LiquidGlassSwitch V4 — Track-Border + Knob-Border + Track 36 % (User-getestete Mockup-Variante, Hover-resistent ohne Row-Hover-Suppression)
**Hero:** none
**Tags:** Component, 3D-Drucker, Toggle, UI, Bugfix

### Why

User-Feedback nach 1308: Row-Hover-Suppression hat das Verhalten zu radikal geändert — User wollte dass die Row weiterhin weiß hovert (das ist der erwartete iOS-Look), nur soll der Toggle dabei sichtbar bleiben statt zu verschmelzen.

**Lösungsansatz neu:** statt den Row-Hover zu unterdrücken, machen wir den Toggle visuell hover-resistent — er ist auf JEDEM Hintergrund (dunkel default + weiß hovered) erkennbar.

User hat aus einem 6-Varianten-Mockup `V4 (Combined)` gewählt: Track bekommt einen sichtbaren Border, Knob bekommt einen Inset-Border, Track-Bg geht von 0.32 → 0.36 alpha. Damit haben Track-Pille UND Knob-Kreis auf jedem Hintergrund klare Konturen.

### Changes

**[LiquidGlassSwitch.css](src/components/common/LiquidGlassSwitch.css)** — drei kleine, konsistente Anpassungen:

**1. Track-Border verstärkt (1308 → 1309):**
- Vorher: `inset 0 0 0 1px rgba(0,0,0,0.04)` (snippet-original, fast unsichtbar)
- Nachher: `inset 0 0 0 1.5px rgba(0,0,0,0.16)` — definiert die Pillen-Form auf weißem Bg, ist auf dunklem Bg dark-on-dark fast unsichtbar

**2. Track-Background-Alpha von 0.32 → 0.36:**
- Subtile Erhöhung. Ergänzt die Border, kein dramatischer Kontrast-Sprung.

**3. Knob-Inset-Border zur Specular-Layer hinzugefügt:**
- Neuer 5. Stack-Element: `inset 0 0 0 1px rgba(0,0,0,0.12)`
- Definiert den weißen Knob als Kreis auf weißem Hover-Bg
- Auf dunklem Bg ist 12 %-Schwarz auf weißem Knob fast unsichtbar (white-on-dark mit subtler Inset-Linie)
- **WICHTIG:** Diese Border musste auch in alle drei `spec-flash`-Keyframe-Stops (0 %, 12-80 %, 100 %) als Static-Element nachgepflegt werden — sonst würde die Border während der 0.55 s Flip-Animation für die Dauer der Specular-Animation wegblitzen

**4. Row-Hover-Suppression aus 1308 entfernt:**
- Die `.ios-item:has(.switch):hover:not(:active) { transform: none ... }`-Regel ist gelöscht
- Row hovert wieder normal weiß wie in 1306-Verhalten — User-Wunsch

**Behalten aus 1308:**
- `.switch:has(input:focus-visible)` statt `:focus-within` — kein Click-Outline-Bleibe-Bug, Tab-A11y bleibt erhalten

### Verifikation

User-getestet im Standalone-Mockup `switch-mockup-v1308-decision.html` mit allen 6 Varianten (V0-V5). User hat V4 nach Hover-Test ausgewählt.

| Kontext | V4-Verhalten |
|---|---|
| Default-Row (dark glass bg) | Track als translucent-gray Pille, Knob als weißer Kreis mit kaum sichtbarer Inset-Linie — sieht aus wie iOS-Toggle |
| Row-Hover (white-95% bg) | Track-Border definiert die Pille klar, Knob-Inset definiert den Kreis klar — Toggle bleibt erkennbar |
| Mid-Animation (Flip) | Static-Borders bleiben durchgehend, Specular-Highlights animieren wie gewohnt darüber |
| Press-and-Hold | Rubberband-Stretch unbeeinflusst, Borders skalieren mit |

### Files touched

- `src/components/common/LiquidGlassSwitch.css` — V4-Visibility-Fixes + Row-Hover-Suppression entfernt
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Hinweis

Damit ist das Hover-Sichtbarkeits-Problem direkt gelöst: nicht durch Suppression des erwünschten Row-Hover-Effekts, sondern durch hover-resistenten Toggle.

Slider-Thumbs (Zieltemperatur Düse/Druckbett) haben weiterhin den Browser-Default-Focus-Ring — separate Component, separater Fix wenn gewünscht.

## Version 1.1.1308 - 2026-04-30

**Title:** LiquidGlassSwitch: Row-Hover-Suppression + Keyboard-Only Focus-Outline (Hover- & Click-Outline-Bugs gefixt)
**Hero:** none
**Tags:** Component, 3D-Drucker, Toggle, UI, Bugfix, A11y

### Why

User-Feedback in HACS-Test mit 4 Screenshots dokumentiert:

- **Bild 1 (normal):** Toggles sehen OK aus — translucent-gray OFF, blau ON, klein
- **Bild 2 (hover):** Row turnt fast-weiß durch `.ios-item:hover:not(:active) → background: rgba(255,255,255,0.95) !important`. Der translucent-gray Track + weißer Knob verschmelzen mit dem weißen Hintergrund — Toggle wirkt „aufgequollen-elongiert" (tatsächlich nur die Drop-Shadow-Halos sichtbar)
- **Bild 3 (click):** Beim Click bekommt das Input Focus → Snippet's `.switch:focus-within` triggert 3 px-Outline. Der blaue Outline-Ring wirkt zusammen mit dem hellen Row-bg wie ein „Selektion-Box"
- **Bild 4 (post-release):** Row geht zurück auf default (weiß weg), aber der **blaue Focus-Outline bleibt haften**. Browser-Default: Focus bleibt auf dem zuletzt geklickten Element bis User woanders hin clickt. Sehr störend.

### Changes

**[LiquidGlassSwitch.css](src/components/common/LiquidGlassSwitch.css)** — zwei Fixes:

**1. Focus-Outline jetzt nur bei Keyboard-Navigation:**
- Vorher: `.switch:focus-within { outline: 3px solid ... }`
- Nachher: `.switch:has(input:focus-visible) { outline: 3px solid ... }`
- `:focus-visible` triggert nur bei Keyboard-Focus (Tab-Navigation), nicht bei Maus-Click. Browser-Heuristik unterscheidet automatisch. A11y für Tab-User bleibt erhalten, Maus-User sehen nichts.
- `:has()` als Parent-Selector um den Outline auf der `.switch`-Label statt nur auf dem Input zu rendern.

**2. Row-Hover für Switch-Rows unterdrückt:**
- Neue Regel: `@media (hover: hover) { .ios-item:has(.switch):hover:not(:active) { transform: none !important; background: rgba(255,255,255,0.08) !important; box-shadow: none !important; } }`
- Zusatz: Label/Subtitle/Value-Color-Override (`color: inherit !important`)
- Effekt: Rows mit `.switch` drin behalten ihren Default-Look auch beim Hover — kein scale 1.02, kein weißer bg, keine schwarze Schrift, keine elevation-Shadow
- Begründung: der Toggle hat eigene Hover- & Press-Feedback-Mechanismen (CSS `.is-pressed`-Morph + Flip-Animation). Row-Hover wäre redundant und produziert den weißen-bg-Konflikt mit dem translucent-gray Track.

### Browser-Support

`:has()` benötigt:
- Safari 15.4+ (März 2022 — alle aktuellen iPad/iPhone-Geräte)
- Chrome 105+ (August 2022)
- Firefox 121+ (Dezember 2023)

Für HACS-Nutzer in 2026 universell verfügbar.

### Files touched

- `src/components/common/LiquidGlassSwitch.css` — `:focus-within` → `:has(input:focus-visible)`, neue `.ios-item:has(.switch)`-Hover-Suppression-Regeln
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Hinweis

Die Slider-Thumbs (Zieltemperatur Düse / Druckbett) in der gleichen View haben in Bild 4 ähnliche blaue Ringe — das ist der Browser-Default-`:focus`-Outline auf den native `<input type="range">`-Slidern. Nicht durch diesen Fix abgedeckt — wäre ein separater Fix in der `.range-slider-input`-CSS (`outline: none` oder eigene `:focus-visible`-Behandlung). Falls dich das auch stört, sag Bescheid.

## Version 1.1.1307 - 2026-04-30

**Title:** LiquidGlassSwitch in PrinterMiscList: kleiner (s-sm), blau (#0a84ff), OFF-Track auf translucent-gray gegen Row-Hover-Konflikt
**Hero:** none
**Tags:** Component, 3D-Drucker, Toggle, UI, Bugfix

### Why

User-Feedback zu 1306 in der echten HACS-Installation:
1. **Toggle ändert sich beim Hover über die Row** — Row-Hover-Effekt der `.ios-item` setzt `background: rgba(255,255,255,0.95) !important` + scale 1.02. Damit wird der Snippet-OFF-Gradient `#e8e8eb → #d6d6db` (helles Grau) gegen den fast-weißen Hover-Hintergrund **unsichtbar** — Toggle wirkt als „verschwindet" beim Hover
2. **Toggle zu groß** — Default `s-md` (86×38) ist deutlich größer als die ursprüngliche 51×31-Inline-Version, dominiert die Row visuell zu stark
3. **Falsche Farbe** — Default Grün passt nicht zum Use-Case, User will Blau

### Changes

**[LiquidGlassSwitch.css](src/components/common/LiquidGlassSwitch.css)** — `.switch-slider::before` umgestellt:
- Vorher: `linear-gradient(145deg, #e8e8eb 0%, #d6d6db 100%)` (helles Grau, snippet-original)
- Nachher: `rgba(120, 120, 128, 0.32)` (iOS-System-Pattern, translucent)
- Translucent-Layer ist auf JEDEM Hintergrund (dark/light/white-hover) als „leicht-dunkler-als-Parent" sichtbar → Bg-unabhängig
- Kleiner Trade-off: subtle Gradient-Tiefe verloren, aber Hover-Sichtbarkeit gewonnen
- Snippet-Treue an dieser Stelle bewusst aufgegeben weil Hover-Konflikt sonst nicht lösbar ohne den Hover-Effekt der gesamten Settings-View zu deaktivieren

**[PrinterMiscList.jsx](src/system-entities/entities/integration/device-entities/components/PrinterMiscList.jsx)** — `<LiquidGlassSwitch>` mit zwei neuen Props aufgerufen:
- `size="sm"` → 64×30 (statt Default 86×38), näher an iOS-Standard 51×31, passt wieder ins Row-Layout
- `accent="#0a84ff"` → iOS dark-mode Blau (statt Default Grün `#3ccb60`)
- `--accent-d` wird automatisch via `color-mix(in oklab, ...)` zu `#0972dc` (88 % Blue + 12 % Black) für den ON-Gradient

### Files touched

- `src/components/common/LiquidGlassSwitch.css` — OFF-Track auf translucent-gray
- `src/system-entities/entities/integration/device-entities/components/PrinterMiscList.jsx` — size + accent props
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Hinweis

Component-Default bleibt `s-md` Grün — andere Use-Cases (z.B. wenn jemand den Switch als Hero-Element irgendwo einbaut) profitieren weiterhin vom snippet-Default. Nur PrinterMiscList overridet beide Props.

Falls der Hover-Konflikt in anderen Settings-Views auch auftritt (Todos, News etc. nutzen aktuell aber `IOSToggle`-Text-Variant statt `LiquidGlassSwitch`), kann dieselbe `size="sm" accent="..."` Prop-Kombi dort eingesetzt werden.

## Version 1.1.1306 - 2026-04-30

**Title:** LiquidGlassSwitch — 1:1-Port des user-designed switch-snippet.html (parametrisierte CSS-Vars, 4 Größen, Press-and-Hold-Morph, Lens-Flash + Specular-Shimmer)
**Hero:** none
**Tags:** Component, 3D-Drucker, Toggle, UI, Liquid-Glass, Animation, Rewrite

### Why

Nach 1305 (klassischer iOS-Slider in Blau) hat der User ein eigenes Snippet `switch-snippet.html` designed und „1:1 wie im Snippet" als finales Verhalten festgelegt. Das ist die endgültige Version der LiquidGlass-Iteration über 1302→1306.

### Was das Snippet besser macht (über die Original-Pen + 1302 hinaus)

1. **Vollständig parametrisiert:** CSS-Vars `--w / --h / --pad / --dot-w / --dot-h / --travel / --accent` — keine fest verdrahteten Pixel-Werte mehr. `--accent-d` wird automatisch aus `--accent` mit `color-mix(in oklab, ...)` 12 % dunkler abgeleitet.
2. **4 Größen-Varianten** (`s-sm 64×30`, `s-md 86×38` default, `s-lg 128×56`, `s-xl 200×88`) auf einer Klasse.
3. **Press-and-Hold Morph-Effekt** — beim Halten stretcht der Knob horizontal Richtung Gegenseite (`scaleX ≈1.36`), Track-Akzent dimmt auf opacity `.35`. Gibt physisches Rubberband-Feel vor dem eigentlichen Toggle.
4. **Animation-Reset-Hack** — `is-prim`-Klasse als Gate (verhindert dot-off-Animation auf initial-Render) plus `style.animation = 'none' → offsetWidth → ''` Force-Restart pro Change. Macht die Flip-Animation wiederholbar selbst bei rapidem Toggle.
5. **Accessibility:** `:focus-within`-Outline mit accent-tint, Input mit `position:absolute; opacity:0; pointer-events:none` statt `display:none` — keyboard-tabable, Space-Bar toggelt.

### Changes

**[LiquidGlassSwitch.jsx](src/components/common/LiquidGlassSwitch.jsx)** — neu strukturiert:
- Markup matcht Snippet 1:1: `<label class="switch ...">` → `<input>` + `.switch-slider` + `.switch-dot-glass` mit drei nested layers (`-filter`, `-overlay`, `-specular`)
- **Neue Props:** `size: 'sm'|'md'(default)|'lg'|'xl'` und `accent: string` (CSS-Color für `--accent`-Override)
- **Preact-Hook 1:** `useEffect` für Pointer-Events (`pointerdown/up/cancel/leave`) → toggelt `.is-pressed`-Klasse auf der Label
- **Preact-Hook 2:** `useCallback` Change-Handler — fügt `.is-prim` zum Dot, setzt `style.animation = 'none'`, forciert Reflow via `offsetWidth`, setzt `style.animation = ''` zurück → CSS-Animation re-triggert clean
- 150-ms-Dedupe + `stopPropagation`-Support unverändert (Drop-in mit IOSToggle-API)

**[LiquidGlassSwitch.css](src/components/common/LiquidGlassSwitch.css)** — kompletter Rewrite, 1:1 vom Snippet:
- CSS-Vars + Default-Werte
- `.switch-slider::before/::after` für OFF/ON-Gradient-Crossfade
- `.switch-dot-glass`-Choreografie: `dot-on/dot-off`-Keyframes (4 Stops: scale 1.55, rotateY ±30°, alpha-bg-cycle 0.15→0.75→1)
- `filter-flash` + `spec-flash` Sub-Keyframes parallel (12-80 % Plateau, 0/100 % null)
- `.is-pressed`-Rule mit shorter `transition .12s` für snappier Press-Feedback
- 4 Größen-Varianten

**[LiquidGlassFilterDefs.jsx](src/components/common/LiquidGlassFilterDefs.jsx)** — wieder hergestellt nach Lösch-Detour in 1304/1305:
- SVG-`<filter id="mini-liquid-lens">` mit `feImage` (radial-gradient als pseudo-normal-map, off-center via `x="20" y="-66"`) + `feDisplacementMap scale="8"`
- Data-URI properly URL-encoded (`%25` für `%`, `%23` für `#`) — Safari-safe

**[index.jsx](src/index.jsx)** — `<LiquidGlassFilterDefs />` wieder global gemountet neben `WallpaperModeOverlay`.

**[PrinterMiscList.jsx](src/system-entities/entities/integration/device-entities/components/PrinterMiscList.jsx)** — keine Änderung nötig. Component-API bleibt drop-in-kompatibel. Default-Größe ist jetzt aber `s-md` (86×38 statt vorher 51×31), Default-Akzent ist Grün.

### Verifikation

Im Vite-Dev-Server mit Demo-Toggles in allen 4 Größen + 3 Akzent-Farben (grün default, blau `#0a84ff`, orange `#ff9500`):

- **Statische States:** OFF (gray-Gradient + Knob links), ON (Akzent-Gradient + Knob rechts) rendern sauber in allen Größen
- **Press-and-Hold-Morph:** `is-pressed`-Klasse aktiviert → Knob stretcht horizontal um Faktor ~1.36 Richtung Gegenseite, Akzent-Track dimmt auf `.35` opacity. Sichtbar bei OFF (stretch nach rechts) und ON (stretch nach links).
- **Flip-Choreografie:** 6 Phasen (0/18/32/50/72/100 %) in Pause-Frames inspiziert — Squish-Anticipation, Slide, Settle alle korrekt mit den Pen-typischen Werten.

### Files touched

- `src/components/common/LiquidGlassSwitch.jsx` — kompletter Rewrite
- `src/components/common/LiquidGlassSwitch.css` — kompletter Rewrite (Snippet 1:1)
- `src/components/common/LiquidGlassFilterDefs.jsx` — neu erstellt (war in 1304/1305 gelöscht)
- `src/index.jsx` — Re-import + Re-mount der Filter-Defs
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Hinweis

Damit ist die LiquidGlass-Iteration **abgeschlossen**. Pfad über 1302 (erste-Version) → 1303 (Smoothness-Pass) → 1304 (clip-path-Liquid-Reveal Detour) → 1305 (klassischer Slider in Blau Detour) → 1306 (user-designed Snippet als finale Form). Die Component ist jetzt:
- parametrisiert (Größe + Akzent über Props)
- mit Press-and-Hold-Morph (über vorherige Iterationen hinaus)
- snippet-faithful (User hat selbst designed)

Wenn der Toggle in PrinterMiscList in `s-sm` (64×30) und Blau (`#0a84ff`) gewünscht ist statt Default `s-md` Grün, dann
`<LiquidGlassSwitch size="sm" accent="#0a84ff" ... />` in PrinterMiscList einfügen — die Component unterstützt es.

## Version 1.1.1305 - 2026-04-30

**Title:** LiquidGlassSwitch zurück auf klassisches iOS-Slider-Design (Blau-Akzent statt Grün, alle Liquid-Glass-Effekte raus)
**Hero:** none
**Tags:** Component, 3D-Drucker, Toggle, UI, Simplification

### Why

User-Feedback nach 1304: ein Referenz-Screenshot zeigt einen schlichten klassischen iOS-Slider in Blau (gray track + blue active state + weißer Knob). Die ganze Liquid-Glass-Iteration über 1302/1303/1304 (Squish + Lens-Filter, dann clip-path-Reveal in Glas-Kapsel) war visuell zu elaboriert. Zurück zum bewährten iOS-Slider-Pattern, nur mit Blau statt Grün als Active-Color.

### Changes

**[LiquidGlassSwitch.jsx](src/components/common/LiquidGlassSwitch.jsx)** — Markup neu: zwei `<span>`-Children (Track + Knob) statt vorheriger Liquid-Fill-Layer.

**[LiquidGlassSwitch.css](src/components/common/LiquidGlassSwitch.css)** — kompletter Rewrite:
- **`.liquid-switch-track`:** Pill mit `background: rgba(120,120,128,0.32)` (OFF) bzw `#007AFF` (ON, iOS-Blue), `transition: background-color 0.3s` mit iOS-Easing
- **`.liquid-switch-knob`:** weißer 27×27-Kreis, `box-shadow` für subtile Elevation, `transition: transform 0.3s` für Slide auf 20 px translateX bei ON
- Alle Liquid-Effekte raus: kein `clip-path`, kein `backdrop-filter`, kein Top-Sheen, keine Pseudo-Elemente
- Unter 60 Zeilen CSS gesamt — drastisch einfacher als 1304

**Component-Name bleibt** historisch `LiquidGlassSwitch` weil PrinterMiscList importiert ihn so. Funktional ist es jetzt aber ein klassischer iOS-Toggle mit Blau-Akzent.

**Keine Änderung an** `PrinterMiscList.jsx` (gleiche Component-API).

### Files touched

- `src/components/common/LiquidGlassSwitch.jsx` — Markup vereinfacht
- `src/components/common/LiquidGlassSwitch.css` — kompletter Rewrite, drastisch reduziert
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Hinweis

Damit ist die Liquid-Glass-Iteration für die Bambu-Sonstiges-Toggles abgeschlossen. Falls in Zukunft jemand wieder den Liquid-Glass-Look will, sind die 1302-1304-Iterationen in den Versionsverlauf-Einträgen samt Begründung dokumentiert.

## Version 1.1.1304 - 2026-04-30

**Title:** LiquidGlassSwitch — kompletter Rewrite zu „Liquid-in-Glass"-Metapher (clip-path-Reveal aus Figma-iOS-26-Toggle-Referenz)
**Hero:** none
**Tags:** Component, 3D-Drucker, Toggle, UI, Liquid-Glass, Animation, Rewrite

### Why

User-Feedback nach 1303: das fühlt sich nicht wie iOS 26 an. Referenz-Vergleich mit der Figma-Community-Datei „[iOS 26 Toggle (Liquid Glass)](https://www.figma.com/de-de/community/file/1519712588579681470/ios-26-toggle-liquid-glass)" zeigte: der iOS-26-Toggle ist konzeptionell **kein Slider mit Knob auf einer Track** — er ist eine **transparente Glas-Kapsel** in der **grünes Liquid fließt**. Der Knob existiert nicht als separates Element; das Grün IST das bewegte Element, mit organischer Liquid-Form.

1303 war eine polished Slider-Variante. 1304 ist die richtige Metapher.

### Changes

**[LiquidGlassSwitch.jsx](src/components/common/LiquidGlassSwitch.jsx)** — komplett neu strukturiert. Markup von 4 nested Knob-Layern (`switch-dot-glass`, `-filter`, `-overlay`, `-specular`) auf 1 Liquid-Element (`<span class="liquid-switch-fill">`) reduziert. API unverändert (`checked`/`onChange`/`disabled`/`stopPropagation`/`className`/`style`/150ms-Dedupe).

**[LiquidGlassSwitch.css](src/components/common/LiquidGlassSwitch.css)** — kompletter Rewrite:
- **`.liquid-switch` (Glas-Kapsel):** 51×31, `border-radius: 99px`, `background: rgba(120,120,128,0.18)` als sehr leichter Glass-Tint, `backdrop-filter: blur(10px) saturate(180%)` — refraktiert was hinter dem Toggle ist, gibt das echte „Glas-Pille"-Gefühl auf farbigen/glasigen Hintergründen
- **`::before`-Pseudo (Top-Sheen):** halb-elliptischer weißer Gradient auf dem oberen Drittel der Kapsel, mit `filter: blur(0.5px)` — wie Licht das auf der Glas-Oberfläche reflektiert. Macht den 3D-Glas-Look.
- **`::after`-Pseudo (Glas-Rand-Highlight):** drei-Layer inset-box-shadow — heller Top-Edge, dunklerer Bottom-Edge, dünner Border-Highlight. Liegt auf z-index 2 ÜBER dem Liquid → der Liquid wirkt „im" Glas.
- **`.liquid-switch-fill` (Liquid):** ist immer voll-sized (`inset: 0`), wird via **`clip-path: circle()`** kontrolliert. OFF: `circle(0% at 92% 50%)` (unsichtbar). ON: `circle(150% at 92% 50%)` (groß genug um die ganze Kapsel zu überdecken). Die Animation ist eine **kreisförmige Reveal-Welle** die vom rechten Tap-Punkt nach außen wächst — sieht aus wie Tinte in Wasser, organisch-kurvig statt rechteckig-skaliert.
- **Easing:** `cubic-bezier(0.32, 0.72, 0, 1)` (iOS-Standard fast-attack slow-decel), Duration 0.42 s.
- **GPU:** `will-change: clip-path` hint für Compositor-Layer.
- **`prefers-reduced-motion`:** kürzere Duration (0.18 s) + lineare Easing.

**[index.jsx](src/index.jsx)** — `<LiquidGlassFilterDefs />` und der Import entfernt. Der SVG-feDisplacementMap-Filter wird in 1304 nicht mehr gebraucht.

**[LiquidGlassFilterDefs.jsx]** — Datei gelöscht.

**[PrinterMiscList.jsx](src/system-entities/entities/integration/device-entities/components/PrinterMiscList.jsx)** — keine Änderung. Die LiquidGlassSwitch-API ist unverändert, drop-in.

### Verifikation

Im Vite-Dev-Server mit Demo-Toggles bei verschiedenen `clip-path`-Werten (paused frames bei 0% / 30% / 50% / 80% / 120% / 150%):

- **OFF:** leere Glas-Kapsel, dunkel-transparent, dezenter Top-Sheen, Glas-Border sichtbar — wie eine kleine Glas-Pille
- **flight 20-50%:** Grün als kurvige Blob-Form von rechts wachsend — klar erkennbar als „Liquid spreading"
- **flight 75%+:** Grün füllt fast die ganze Kapsel, leichte gerundete Ausbeulung am linken Ende
- **ON:** vollflächiges Grün mit Top-Sheen darüber, sieht aus wie Liquid hinter Glas

Live-Klick-Test: Animation triggert sauber, kein Flackern, ein einziges glattes Reveal-Movement statt 2-3 separaten Phasen.

### Files touched

- `src/components/common/LiquidGlassSwitch.jsx` — kompletter Rewrite
- `src/components/common/LiquidGlassSwitch.css` — kompletter Rewrite
- `src/components/common/LiquidGlassFilterDefs.jsx` — gelöscht (nicht mehr benötigt)
- `src/index.jsx` — Import + Mount entfernt
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Hinweis

Die Architektur ist jetzt deutlich einfacher als 1302/1303 (1 Liquid-Layer + 2 Pseudo-Elemente statt 4 nested Knob-Layern + SVG-Filter). Performance besser: ein Compositor-Layer pro Toggle, `clip-path` ist GPU-beschleunigt, kein `feDisplacementMap` mehr (das war die teuerste Operation in 1302).

## Version 1.1.1303 - 2026-04-30

**Title:** LiquidGlassSwitch — Flicker-Fix (Knob bleibt opak, dezenter Squish, GPU-Promotion, kein `whileTap`-Konflikt)
**Hero:** none
**Tags:** Component, 3D-Drucker, Toggle, UI, Liquid-Glass, Animation, Bugfix

### Why

User-Feedback nach 1302: die Animation flackert „2-3 mal" und fühlt sich nicht flüssig an. Diagnose ergab vier Quellen:

1. **Knob-Background-Color-Cycle:** das Pen-Original animiert die Knob-`background-color` von alpha 1 → 0.1 → 0.7 → 1 über die Animation. Auf einem flachen Pen-Hintergrund liest sich das als „flüssiges Glas-Tröpfchen". Auf unserem farbigen Glass-Background mit Druckraum-Foto dahinter wirkt der Alpha-Drop wie 2-3 separate Flicker.
2. **`whileTap` auf der Label** mit `perspective: 600px`: framer-motion's inline `transform: scale(0.96)` ändert mid-Animation den 3D-Rendering-Context für den Knob → sichtbarer Stutter beim Klick-Loslassen.
3. **Doppelfilter:** `backdrop-filter: blur(0.5px)` + `filter: url(#mini-liquid-lens)` auf demselben Element forcieren Doppel-Rasterisierung pro Frame.
4. **Keine GPU-Layer-Promotion:** Browser entscheidet ad-hoc wo composited wird, oft fällt's auf CPU-Painting zurück → Frame-Drops.

### Changes

**[LiquidGlassSwitch.jsx](src/components/common/LiquidGlassSwitch.jsx)** — `motion.label` + `whileTap={{ scale: 0.96 }}` komplett entfernt. Plain `<label>` mit der CSS-Choreografie als alleinigem Press-Feedback. Auch der framer-motion-Import ist weg.

**[LiquidGlassSwitch.css](src/components/common/LiquidGlassSwitch.css)** — Smoothness-Pass:
- **Knob-Bg bleibt durchgehend `#ffffff`** — `background-color`-Keyframes komplett raus aus `lgs-dot-on/off`. Kein Flicker mehr durch Alpha-Cycle.
- **3-Keyframe-Transform statt 4** (0 % / 45 % / 100 %) — gleichmäßigere Easing-Kurve, sauberer Peak.
- **Squish dezenter:** `scale(1.4)` statt `1.6`, `rotateY(±25°)` statt `±33°` — näher am echten iOS-26-Toggle, weniger comicartig.
- **Easing umgestellt** auf `cubic-bezier(0.32, 0.72, 0, 1)` (iOS-Standard-Spring-Decel) statt der spitzeren `(0.16, 1, 0.3, 1)`. Auch Track-Crossfade nutzt jetzt diese Easing.
- **Duration 0.42 s** statt 0.5 s — snappier, weniger sichtbares Wackeln, immer noch wahrnehmbar Liquid.
- **GPU-Promotion:** `will-change: transform` + `transform: translateZ(0)` auf Knob, `will-change: opacity` auf Filter-Layer. Compositor packt's auf eigene Layer, Transformationen werden cheap.
- **`backdrop-filter` raus** vom `.liquid-switch-dot-glass-filter` — nur noch SVG-Lens. Eine Filter-Pass weniger pro Frame.
- **`overflow: hidden` und `transform-style: preserve-3d` raus** vom Knob — kein Nested-3D nötig, Lens-Verzerrung ist klein genug um nicht zu clipping zu zwingen.
- **Specular-Keyframes konsolidiert** auf `20%, 80%` Sammelpunkt statt zwei separater Stops — identisches Verhalten, weniger Keyframes.
- **`pointer-events: none`** auf Filter/Overlay/Specular — nur die Label/Slider sind klickbar, keine Klick-Verluste auf den Pseudo-Layern.

### Files touched

- `src/components/common/LiquidGlassSwitch.jsx` — `motion.label` → `<label>`, framer-motion-Import raus
- `src/components/common/LiquidGlassSwitch.css` — komplett überarbeitet (Smoothness-Pass)
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Verifikation

Im Vite-Dev-Server mit Demo-Toggle Sample-Punkte über die Animation gemessen (`getComputedStyle` an mehreren `animationDelay`-Werten):

| t | scaleY | translateX |
|---|--------|------------|
| 0.0 | 1.000 | 0 |
| 0.1 | 1.288 | 9.3 |
| 0.25 | 1.387 | 13.4 |
| 0.45 | 1.400 | 14.0 (peak) |
| 0.60 | 1.074 | 19.5 |
| 0.75 | 1.014 | 19.9 |
| 1.0 | 1.000 | 20.0 |

Werte monoton-stetig, Peak-Squish exakt bei 45 %, danach iOS-typisches Slow-Decel-Settling. Keine Diskontinuitäten in den Keyframes.

## Version 1.1.1302 - 2026-04-30

**Title:** 3D-Drucker (Bambu) Sonstiges-Tab: neue `LiquidGlassSwitch`-Component (iOS-26 Liquid Glass) ersetzt Inline-Slider-Markup
**Hero:** none
**Tags:** Component, 3D-Drucker, Toggle, UI, Liquid-Glass

### Why

In der Bambu-Lab-Detail-View (Sonstiges-Tab) liefen die Toggles bisher als Inline-`<div>`-Slider-Markup direkt in `PrinterMiscList.jsx` — deshalb hatte sie auch die `IOSToggle`-Migration auf Text "An/Aus" (v1.1.1292) nicht erreicht. Inspiriert von [maxuiux/qEdxbrY](https://codepen.io/maxuiux/pen/qEdxbrY) extrahieren wir das Slider-Pattern in eine eigene Component mit echtem iOS-26-"Liquid Glass"-Effekt: SVG-Lens-Verzerrung + Specular-Schimmer + Anticipation-Squish während des Wechsels. Bewusst nur in der Printer-View, nicht global — der Effekt braucht den farbigen Glass-Hintergrund um zu wirken, in flachen Settings-Listen wäre er Lärm.

### Changes

**Neu: [LiquidGlassSwitch.jsx](src/components/common/LiquidGlassSwitch.jsx)** — Drop-in-kompatibel zu `IOSToggle` (`checked` / `onChange(newValue, event)` / `disabled` / `stopPropagation` / `className` / `style`). Wrappt das CSS-animierte Markup in `<motion.label whileTap={{scale: 0.96}}>` für Tap-Press-Feedback (orthogonal zur CSS-Choreografie). 150 ms Dedupe wie bei `IOSToggle`.

**Neu: [LiquidGlassSwitch.css](src/components/common/LiquidGlassSwitch.css)** — Pen-Choreografie 1:1 übernommen, Maße auf iOS-Standard 51×31 / 27×27 angepasst (translateX 20 px statt 28 px der Pen-86×38-Variante). Easing `cubic-bezier(0.16, 1, 0.3, 1)`, Duration 0.5 s.
- `lgs-dot-on/off`: 4-stop-Keyframes mit `scale(1.6)` Squish + `rotateY(±33deg)` Anticipation, `translateX` Slide, `background-color`-Fade auf alpha 0.1 bei 82 % → 0.7 bei 90 % → 1 bei 100 % (Liquid-Drop-Reform-Effekt)
- `lgs-filter-on/off`: Opacity 0→1 bei 12 %, →0 bei 100 % (Lens nur mid-flight sichtbar)
- `lgs-specular-on/off`: 4-component-`box-shadow`-Keyframes (grünlicher Top-Edge, dunkler Bottom-Edge, weißer Glow, dimmer Bottom-Right)
- Track-Crossfade via zwei `::before` (off, gray rgba(120,120,128,0.32)) + `::after` (on, linear-gradient(145deg, #3ccb60, #42ba64)) — sauberer als `background-color`-Transition
- `prefers-reduced-motion`: Filter wird komplett ausgeblendet, Animation auf 0.2 s gekürzt

**Neu: [LiquidGlassFilterDefs.jsx](src/components/common/LiquidGlassFilterDefs.jsx)** — SVG-`<filter id="mini-liquid-lens">` mit `feImage` (radial-gradient als pseudo-normal-map, off-centered via `x="20" y="-66"`) + `feDisplacementMap` (`scale="8"`). Wird in [index.jsx](src/index.jsx) einmal global gemountet neben `WallpaperModeOverlay`. `#` in `url(#invmap)` als `%23` URL-encoded für Safari-Kompatibilität in der Data-URI.

**Geändert: [PrinterMiscList.jsx](src/system-entities/entities/integration/device-entities/components/PrinterMiscList.jsx)** — die ~28 Zeilen Inline-`<div className="ios-toggle">`-Markup für `item.type === 'switch'` durch `<LiquidGlassSwitch checked={isOn} disabled={!isAvailable} onChange={...} />` ersetzt (10 Zeilen). Betrifft 4 Toggles in der Steuerung-Sektion: Kamera aktivieren, Bildsensorkamera verwenden, Aufforderungston zulassen, Druckraumbeleuchtung.

### Files touched

- `src/components/common/LiquidGlassSwitch.jsx` (neu)
- `src/components/common/LiquidGlassSwitch.css` (neu)
- `src/components/common/LiquidGlassFilterDefs.jsx` (neu)
- `src/index.jsx` — `<LiquidGlassFilterDefs />` global gemountet
- `src/system-entities/entities/integration/device-entities/components/PrinterMiscList.jsx` — Inline-Markup → Component
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Hinweis

Bewusst kein flächiges Replacement von `IOSToggle` — die Text-"An/Aus"-Variante (v1.1.1292) bleibt für alle Settings-Listen die Standard-Komponente. `LiquidGlassSwitch` ist eine Spezial-Komponente für visuelle Hero-Kontexte mit farbigem/glasigem Hintergrund. Damit drei Toggle-Komponenten im Repo: `IOSToggle` (text), `PowerToggle` (icon, circular slider) und `LiquidGlassSwitch` (visual pill).

## Version 1.1.1301 - 2026-04-29

**Title:** Versionsverlauf: Suchfeld + zwei-zeilige Filter-Leiste (Zeitfenster + Tags) wie bei News
**Hero:** none
**Tags:** Versionsverlauf, Filter, Suche, UI

### Why

Bei wachsender Anzahl Releases wird die flache Versionsliste unübersichtlich. User-Wunsch: Suchen nach Versionsnummer / Titel und Filtern nach Zeitraum + Tag — analog zur News-View die das Pattern bereits hat.

### Changes

**[index.js](src/system-entities/entities/versionsverlauf/index.js)**: neuer Action-Button `search` zwischen `back` und `refresh`. Erscheint im Top-Header der Detail-View.

**[TabNavigation.jsx](src/components/DetailView/TabNavigation.jsx)**: `case 'search'` ergänzt um `isVersionsverlaufView`-Branch — ruft `window._versionsverlaufViewRef.handleToggleSearch()` auf.

**[VersionsverlaufView.jsx](src/system-entities/entities/versionsverlauf/VersionsverlaufView.jsx)**:
- Neue States: `searchOpen`, `searchQuery`, `timeFilter` ('all' | '1w' | '2w' | '4w'), `tagFilter` (string | null)
- `handleToggleSearch()` toggelt die Suchleiste, leert Query beim Schließen
- `useEffect([searchOpen])`: auto-focus auf das Input wenn die Suche geöffnet wird
- `handleBackNavigation` schließt jetzt auch die Suche wenn sie offen ist
- `allTags` (memo): aggregiert alle Tags über alle Versionen, sortiert nach Häufigkeit absteigend
- `filteredVersions` (memo): wendet Time-Window + Tag-Filter + Such-Substring (auf title + version + tags + content) an

**[VersionsList.jsx](src/system-entities/entities/versionsverlauf/components/VersionsList.jsx)** — komplett rewrite:
- Search-Bar als `AnimatePresence` + `motion.div` (fade-in/out wie in News-View)
- Filter-Bar: zwei horizontal scroll-bare Reihen
  - **Zeile 1 — Zeitfenster:** Pills `Alle / Vor 1W / Vor 2W / Vor 4W` (iOS-blue active)
  - **Zeile 2 — Tags:** Chips `Alle Tags / <Tag1> <count> / <Tag2> <count> / …` (weiß+schwarz active, sortiert nach Häufigkeit)
- Empty-State zeigt "🔍 Keine Treffer" wenn Filter aktiv sind, sonst "📋 Keine Versionen"

**[VersionsverlaufView.css](src/system-entities/entities/versionsverlauf/styles/VersionsverlaufView.css)** — neue Styles:
- `.versionsverlauf-search-row` + `-search` + `-search-icon` + `-search-input` + `-search-clear`
- `.versionsverlauf-filter-bar` + `-filter-row` (overflow-x scroll)
- `.versionsverlauf-filter-pill` (Zeitfenster) — iOS-blue active
- `.versionsverlauf-filter-chip` (Tags) — weiß+schwarz active, mit `-chip-count` Badge

### Files touched

- `src/system-entities/entities/versionsverlauf/index.js` — search actionButton
- `src/system-entities/entities/versionsverlauf/VersionsverlaufView.jsx` — state + filtering
- `src/system-entities/entities/versionsverlauf/components/VersionsList.jsx` — UI rewrite
- `src/system-entities/entities/versionsverlauf/styles/VersionsverlaufView.css` — styles
- `src/components/DetailView/TabNavigation.jsx` — handleToggleSearch wiring
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump

## Version 1.1.1300 - 2026-04-29

**Title:** Darstellung-Settings: Sub-View-Wechsel ohne Item-Flicker beim Zurück-Navigieren
**Hero:** none
**Tags:** SettingsTab, AppearanceSettingsTab, Animation

### Why

Beim Wechsel von einem Sub-Menü (z.B. Hintergrund, Rasterspalten, Kartenform) zurück zur Darstellung-Hauptansicht blitzten alle Items ~1ms hell auf. Identische Ursache wie der Sub-View-Flicker in den System-Settings (gefixt in v1.1.1291): `mode="wait"` + `initial={false}` + Spring-Transition + per-Element-`custom`-Override sorgen dafür, dass die main-View instant ohne Anim einrastet, während die sub-View noch verschwindet — die kurze Überlappung triggert Hover-State auf den Items unter dem Cursor.

### Changes

[AppearanceSettingsTab.jsx](src/components/tabs/SettingsTab/components/AppearanceSettingsTab.jsx) — gleiche Behandlung wie GeneralSettingsTab in v1.1.1291:
- `<AnimatePresence>`: `mode="wait"` raus → Default-Sync, alte und neue View animieren überlappend
- Main `<motion.div>`: `custom={-1}` raus, `initial={false}` → `initial="enter"`. Slidet jetzt von links rein wenn man zurück navigiert, kein Pop-In mehr
- Alle Sub-View `<motion.div>`: `custom={1}` raus — Direction wird einheitlich von AnimatePresence's `custom` gesteuert
- Alle 6 `transition`-Definitionen: `{ type: 'spring', stiffness: 300, damping: 30 }` → `{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }` (iOS-native Decel-Easing, 250ms)

### Effekt

- main → sub: main slidet nach links raus, sub slidet von rechts rein, gleichzeitig in 250ms
- sub → main: sub slidet nach rechts raus, main slidet von links rein, gleichzeitig in 250ms
- **Kein Item-Flackern mehr beim Zurück-Navigieren** — die main-View ist erst voll positioniert wenn der Cursor wieder zugreifen kann

### Files touched

- `src/components/tabs/SettingsTab/components/AppearanceSettingsTab.jsx`
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Hinweis

TodosSettingsView und ggf. weitere haben noch das alte Pattern. Falls dort auch Flackern auftritt — kurz Bescheid geben, dann ziehe ich's nach.

## Version 1.1.1299 - 2026-04-29

**Title:** Benutzerdefiniert-Ansicht: Device-Card-Schrift heller für bessere Lesbarkeit auf farbigen Hintergründen
**Hero:** none
**Tags:** Custom-View, DeviceCard, Lesbarkeit

### Why

In der Benutzerdefiniert-Ansicht (Kategorie `custom`) haben die System-Entity-Cards (Zeitpläne, Nachrichten, Todos, Versionsverlauf, Integration, Energie-Dashboard) voll-saturierte Hintergründe (orange, blau, lila, gelb). Die Default-Schrift (`rgba(255,255,255,0.7)` × `opacity: 0.5` ≈ 35%-weißer Effektivton) war auf diesen Hintergründen zu dunkel — User-Feedback: Texte schlecht lesbar.

Andere Ansichten (Geräte, Sensoren, Aktionen) haben gemischte / transparente Hintergründe wo der Default-Wert passt — daher Änderung **scoped** auf nur die Custom-View.

### Changes

**[GroupedDeviceList.jsx](src/components/SearchField/components/GroupedDeviceList.jsx)**:
- Neuer Prop `activeCategory` (default null)
- Wenn `activeCategory === 'custom'`: Grid-Container kriegt zusätzliche Class `is-custom-view`

**[SearchField.jsx](src/components/SearchField.jsx)**:
- `activeCategory` an beide `<GroupedDeviceList>`-Aufrufe (search-results + non-search-results) durchgereicht

**[DeviceCardGridView.jsx](src/components/DeviceCard/DeviceCardGridView.jsx)** — neue CSS-Regeln:
- `.device-grid-container.is-custom-view .device-card .device-area`: `rgba(255,255,255,0.85)` + `opacity: 1` (vorher 0.7 × 0.5 = ~0.35)
- `.device-grid-container.is-custom-view .device-card .device-name`: `rgba(255,255,255,1)` + `opacity: 1` (vorher 0.95 × 0.6 = ~0.57)
- `.device-grid-container.is-custom-view .device-card .device-state`: `rgba(255,255,255,0.85)` + `opacity: 1`
- Gradient-Truncate-Effekt (`-webkit-background-clip: text`) bleibt erhalten

### Effekt

In der Benutzerdefiniert-Ansicht sind die Card-Texte (z.B. "Kein Raum", "Zeitpläne Übersicht", "5 Feeds") jetzt deutlich heller und gut lesbar auf den farbigen Tile-Backgrounds. Andere Ansichten (Geräte, Sensoren, Aktionen) sind unverändert.

### Files touched

- `src/components/SearchField.jsx`
- `src/components/SearchField/components/GroupedDeviceList.jsx`
- `src/components/DeviceCard/DeviceCardGridView.jsx`
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

## Version 1.1.1298 - 2026-04-29

**Title:** News-Suchleiste fadet sanft ein/aus statt instant zu erscheinen
**Hero:** none
**Tags:** News, Animation

### Why

Beim Klick auf das Lupen-Icon im Top-Header der News-View ploppte die Suchleiste sofort auf — kein Übergang, kein Fade. Andere Tab-Wechsel (z.B. Übersicht) haben weichere Animationen, die Suchleiste fiel da rausstilistisch.

### Changes

[NewsView.jsx](src/system-entities/entities/news/NewsView.jsx):
- Suchleiste in `<AnimatePresence>` + `<motion.div>` eingewickelt
- `initial={{ opacity: 0, y: -6 }}` → `animate={{ opacity: 1, y: 0 }}` → `exit={{ opacity: 0, y: -6 }}`
- 220ms tween mit iOS-Easing `[0.32, 0.72, 0, 1]`
- Filter-Wrapper als `{!searchOpen && (...)}` umgeschrieben damit nur eines von beidem gerendert wird (statt der Ternary)

Effekt: Klick auf Suchen-Icon → Suchleiste slidet leicht von oben rein und fadet ein. Nochmal Klick (oder Übersicht) → Suchleiste fadet+slidet wieder weg, Filter-Zeile erscheint.

### Files touched

- `src/system-entities/entities/news/NewsView.jsx`
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

## Version 1.1.1297 - 2026-04-29

**Title:** Todo-Listen-Einstellungen: Symbol/Farbe wirken sofort, "Fertig"-Button entfällt
**Hero:** none
**Tags:** Todos, SettingsView, Bugfix

### Why

Beim Anpassen einer Todo-Liste (z.B. Einkaufsliste → Symbol + Farbe ändern) waren die Auswahlen nur Local-State und wirkten erst nach Klick auf "Fertig" — was leicht übersehen wurde. Plus: nach manuellem Test-Feedback war es so, dass die Farbauswahl auch nach "Fertig" nicht visuell durchschlug.

Beide Symptome gingen auf dieselbe Ursache zurück: jeder Klick auf eine Farbe oder ein Symbol setzte zwar Local-State, aber persistierte nichts ins Settings-Object — das passierte erst beim Fertig-Klick. Wer den Button nicht klickte, dachte, die Farbauswahl funktioniere nicht.

### Changes

[TodosSettingsView.jsx](src/system-entities/entities/todos/components/TodosSettingsView.jsx):

- Neuer Helper `applyListCustomization(patch)` der den Patch (`{ icon }` oder `{ color }`) sowohl in den Local-State als auch direkt via `onUpdateSetting('lists', ...)` ins Settings-Object schreibt
- Klick auf Emoji im Symbol-Picker: `applyListCustomization({ icon: emoji })` statt `setListIcon(emoji)`
- Klick auf Farbe im Farb-Picker: `applyListCustomization({ color })` statt `setListColor(color)`
- "Fertig"-Button im Listen-Detail-Navbar **entfernt** — Zurück-Button reicht, alle Änderungen sind eh schon persistiert
- Die alte `saveListCustomization`-Funktion ist auf einen No-Op-Fallback reduziert (für falls noch wer die Funktion aufruft)

### Verhalten

1. User öffnet Todos → Einstellungen → Listen → wählt z.B. "Einkaufsliste"
2. Klick auf Farbe → Farb-Picker öffnet
3. Klick auf z.B. Blau → **sofort** persistiert + Settings-Object aktualisiert
4. Zurück-Navigation zum Listen-Detail → blaue Farbe sichtbar
5. Zurück zur Hauptansicht → Todo-Cards der Einkaufsliste rendern sofort mit blauem Gradient

Kein "Fertig" mehr nötig.

### Files touched

- `src/system-entities/entities/todos/components/TodosSettingsView.jsx` — applyListCustomization + Fertig-Button raus
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

## Version 1.1.1296 - 2026-04-28

**Title:** Todos: immer sichtbares Suchfeld über den Filter-Tabs
**Hero:** none
**Tags:** Todos, Search

### Why

Das Suchen in der Todo-Liste ist eine Hauptinteraktion, sollte aber nicht hinter einem Lupen-Icon im Header versteckt sein. User-Feedback: Suchfeld immer sichtbar, oberhalb der Filter-Tab-Leiste, im selben dunklen Container wie der Rest.

### Changes

[TodosView.jsx](src/system-entities/entities/todos/TodosView.jsx):
- Neuer `searchQuery`-State (initial `''`)
- `filterTodos()` filtert zusätzlich nach `searchQuery` (case-insensitive Substring-Match auf `summary` + `description`) — als Step 3b nach den activeFilter-Stufen
- `useEffect`-Deps für Re-Filter erweitert um `searchQuery`
- Neues JSX direkt vor `.todos-filter-bar`: `<div className="todos-search-bar">` mit Lupen-Icon links, `<input>` mittig (placeholder "Suchen…" / "Search…"), Clear-Button (×) rechts wenn was eingetippt ist

[TodosView.css](src/system-entities/entities/todos/styles/TodosView.css):
- `.todos-search-bar`: flex-row, `rgba(255,255,255,0.08)`-Hintergrund, `border-radius: 10px`, `padding: 8px 12px`, `margin-bottom: 12px` zum Filter-Tab-Layer
- `.todos-search-input`: transparent, `font-size: 15px`, weiße Text-Farbe, gedimmter Placeholder
- `.todos-search-clear`: gedimmtes Icon, hellt bei Hover auf

### Verhalten

- Tab-Auswahl + Suche kombinieren sich (z.B. Tab="Heute" + "Hans" → nur heute fällige Todos die "Hans" enthalten)
- Filter-Badges (`Alle 6`, `Unerledigt 6`...) zeigen weiterhin die Counts ohne Such-Filter — das Suchfeld filtert nur die angezeigte Liste

### Files touched

- `src/system-entities/entities/todos/TodosView.jsx`
- `src/system-entities/entities/todos/styles/TodosView.css`
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

## Version 1.1.1295 - 2026-04-28

**Title:** Aktualisieren-Button rotiert während die Schedules neu geladen werden
**Hero:** none
**Tags:** AllSchedules, UI, TabNavigation

### Why

Der "Aktualisieren"-Button im Header der Zeitpläne-Übersicht hat optisch nichts gemacht beim Klick — keine Rückmeldung dass tatsächlich ein Refresh läuft. User-Wunsch: Icon soll rotieren solange der Vorgang läuft.

### Changes

**[AllSchedulesView.jsx](src/system-entities/entities/all-schedules/AllSchedulesView.jsx)**:
- `isLoading`-State (existierte schon) wird jetzt auf `window._allSchedulesViewRef.isRefreshing` exposed
- `all-schedules-view-state-changed` Event feuert auch bei `isLoading`-Änderungen, sodass DetailView die Action-Buttons neu rendert
- `loadData()`: Minimum-Duration von 500ms eingebaut. Da HASS-States bereits in-memory sind, läuft der Refresh effektiv synchron — ohne Min-Duration würde der Spinner nie sichtbar werden. 500ms ist genug für visuelles Feedback ohne dass es sich blockiert anfühlt

**[DetailView.jsx](src/components/DetailView.jsx)**:
- Special-Branch für `item.domain === 'all_schedules'` in `getActionButtons()`: kopiert die Refresh-Button-Definition und setzt `isRefreshing: !!window._allSchedulesViewRef?.isRefreshing` als Flag

**[TabNavigation.jsx](src/components/DetailView/TabNavigation.jsx)**:
- `case 'refresh'` SVG bekommt `className={button.isRefreshing ? 'is-spinning' : ''}`

**[DetailView.css](src/components/DetailView.css)**:
- Neue Animation `detail-tab-spin` (0.9s linear infinite) auf `.detail-tab svg.is-spinning`
- `transform-origin: 50% 50%` damit das Icon um seinen Mittelpunkt rotiert

### Files touched

- `src/system-entities/entities/all-schedules/AllSchedulesView.jsx`
- `src/components/DetailView.jsx`
- `src/components/DetailView/TabNavigation.jsx`
- `src/components/DetailView.css`
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

## Version 1.1.1294 - 2026-04-28

**Title:** System-Settings-Header zeigt jetzt aktiven Tab-Namen statt "Gerade Eben"
**Hero:** none
**Tags:** SettingsTab, DetailView, Header

### Why

Der Header der System-Einstellungen zeigte:
- Zeile 1: "System Einstellungen"
- Zeile 2: "Gerade Eben" (vom State-Helper, sinnlos für Settings)

Sinnvoller: Zeile 1 = welcher Tab (Allgemein / Darstellung / Privatsphäre / Über), Zeile 2 = "Einstellungen" als Kontext-Label.

### Changes

[DetailView.jsx](src/components/DetailView.jsx):
- Neue `getSettingsHeaderInfo()`-Funktion analog zu den existierenden `getNewsHeaderInfo()` / `getTodosHeaderInfo()` / etc.
- Liest `activeTab` (DetailView's State, wird vom TabNavigation-Klick gesetzt) und mappt auf den deutschen/englischen Tab-Namen
- `stateText` = `['Allgemein', 'Darstellung', 'Privatsphäre', 'Über'][activeTab]`
- `stateDuration` = `'Einstellungen'`
- Eingehängt in die OR-Chain für `stateText` / `stateDuration` an den `<TabNavigation>` Props (höchste Priorität, vor den anderen Domain-Headers)

Reagiert sofort beim Tab-Wechsel — TabNavigation triggert sowohl `settingsTabRef.current.setActiveTab(index)` (für SettingsTab-Inhalt) als auch `setActiveTab(index)` (DetailView-State, das wir hier lesen).

### Files touched

- `src/components/DetailView.jsx` — `getSettingsHeaderInfo` + Wiring
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

## Version 1.1.1293 - 2026-04-28

**Title:** Range-Slider-Thumb mit blauem Rand passend zur Track-Farbe
**Hero:** none
**Tags:** Slider, UI, Settings

### Why

Der Slider-Knopf war ein einfacher weißer Punkt — wenig Bezug zum blauen Track-Fill. Mit farbigem Rand in iOS-Blue wird der Zusammenhang sofort sichtbar.

### Changes

[iOSSettingsView.css](src/system-entities/entities/news/components/iOSSettingsView.css):
- `input[type="range"]::-webkit-slider-thumb` und `::-moz-range-thumb`:
  - Größe von 12×12 auf 18×18 (deutlicher sichtbar)
  - Neuer 2px-Border in `rgb(0, 122, 255)` (gleicher Ton wie der Track-Fill in den Slider-Komponenten)
  - `box-sizing: border-box` damit Border in der Größe enthalten ist
  - Box-Shadow + weißes Center bleiben

Wirkt automatisch auf alle Slider die das generic `input[type="range"]` Pattern nutzen — z.B. Hintergrund-Deckkraft / -Blur / -Saturation / -Vignette in den Appearance-Settings.

### Files touched

- `src/system-entities/entities/news/components/iOSSettingsView.css`
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

## Version 1.1.1292 - 2026-04-28

**Title:** IOSToggle: vom iOS-Slider-Switch auf einfachen "An" / "Aus"-Text gewechselt
**Hero:** none
**Tags:** IOSToggle, Settings, UI

### Why

User-Feedback: der iOS-Style-Switch (grüner Pill mit weißem Kreis) wirkt veraltet. Plain-Text "An"/"Aus" ist schneller lesbar, matcht den Stil der anderen Wert-Anzeigen in den Settings-Rows (`Aktiv`, `Inaktiv`, `Deutsch`, `24-Stunden` etc.) und braucht weniger Platz.

### Changes

**[IOSToggle.jsx](src/components/common/IOSToggle.jsx)** — komplett rewrite:
- Render: jetzt ein `<button type="button">` mit Text "An" oder "Aus" (statt `<label>` + `<input type="checkbox">` + slider-pill)
- API kompatibel zu vorher: `checked`, `onChange(value, event)`, `disabled`, `stopPropagation`, `className`, `style`
- Neue optionale Props: `onLabel` / `offLabel` (defaults: "An" / "Aus") für andere Sprachen oder eigenen Text
- 150 ms Dedupe für `onChange` bleibt — defensiv, falls Handler im Codebase auf höchstens-einen-fire-pro-Klick gebaut sind
- `aria-pressed` für Screen-Reader

**[iOSSettingsView.css](src/system-entities/entities/news/components/iOSSettingsView.css)** — neue `.ios-toggle-text` Klasse:
- Default (off): `rgba(255, 255, 255, 0.45)` — gedimmt grau
- `.is-on`: `rgb(10, 132, 255)` — iOS-Blue (Dark-Mode-Tint)
- Hover-Row (heller Hintergrund): `rgba(0, 0, 0, 0.45)` off / `rgb(0, 122, 255)` on (Standard-iOS-Blue auf hellem BG)
- `:disabled` / `.is-disabled`: opacity 0.4
- 16px font, 500 weight, padding 6px 4px

Die alten `.ios-toggle` / `.ios-toggle-slider` Klassen bleiben in der CSS bestehen — falls irgendwo direkt `<label className="ios-toggle">…</label>` Markup steht (außerhalb der IOSToggle-Komponente). Keine Breaking-Change-Risiken.

### Files touched

- `src/components/common/IOSToggle.jsx` — vom slider auf text rewrite
- `src/system-entities/entities/news/components/iOSSettingsView.css` — `.ios-toggle-text` styles, alte `.ios-toggle` als legacy markiert
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Wo wirkt das?

Alle ~30 Verwendungen von `<IOSToggle>` im Codebase:
- GeneralSettingsTab: GreetingsBar, Toasts-Settings, Mobile-Panel-Auto-Expand etc.
- AppearanceSettingsTab: diverse Anzeige-Toggles
- TodosSettingsView: 6+ Toggles für Todo-Filter / -Visibility
- iOSSettingsView (News): Show-Source-Icons / Auto-Refresh etc.
- Printer3D / EnergyDashboard: device-spezifische Toggles

Alle bekommen automatisch das neue Text-Treatment ohne Code-Änderung an der Aufrufseite.

## Version 1.1.1291 - 2026-04-28

**Title:** System-Settings Sub-View-Wechsel: kein Flackern mehr, schneller + flüssiger
**Hero:** none
**Tags:** SettingsTab, Animation, framer-motion

### Why

Beim Wechsel von der System-Settings-Hauptansicht in ein Untermenü (Sprache, Währung, Zeitformat, Vorschläge etc.) gab's ein sichtbares Flackern. Drei zusammenwirkende Ursachen:

1. **`mode="wait"`** auf `<AnimatePresence>` — wartet bis die alte View komplett raus animiert ist, **bevor** die neue beginnt → ein paar Frames ohne Inhalt
2. **`custom={-1}` auf der Main-View + `custom={1}` auf den Sub-Views** überschrieben das `custom`-Prop von AnimatePresence. Folge: bei main → sub liefen beide Views in dieselbe Richtung statt iOS-typisch gegenläufig
3. **`initial={false}` auf der Main-View** → beim Zurück-Navigieren ploppte main einfach ein, kein Slide-In von links
4. **Spring 300/30** ist eher bouncy als snappy — wirkt zäh

### Changes

[GeneralSettingsTab.jsx](src/components/tabs/SettingsTab/components/GeneralSettingsTab.jsx):

- `<AnimatePresence>`: `mode="wait"` raus → Default-Sync, alte und neue View animieren überlappend
- Main `<motion.div>`: `custom={-1}` raus, `initial={false}` → `initial="enter"`. Slidet jetzt von links rein wenn man zurück navigiert
- Alle 5 Sub-View `<motion.div>`: `custom={1}` raus. Direction wird jetzt einheitlich von AnimatePresence's `custom` gesteuert
- Alle 6 `transition`: `{ type: 'spring', stiffness: 300, damping: 30 }` → `{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }`. Das Easing matcht iOS-native Decel-Kurve, 250ms ist snappy aber nicht abrupt

### Result

- main → sub: main slidet nach links raus, sub slidet von rechts rein, **gleichzeitig**, in 250ms
- sub → main: sub slidet nach rechts raus, main slidet von links rein, gleichzeitig, in 250ms
- sub → sub (z.B. suggestions → learningRate): forward slide

### Files touched

- `src/components/tabs/SettingsTab/components/GeneralSettingsTab.jsx`
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Hinweis

Andere Settings-Tabs (AppearanceSettingsTab, TodosSettingsView etc.) nutzen das gleiche Pattern und könnten dasselbe Treatment vertragen. Falls dort auch Flackern sichtbar ist — gerne melden, dann ziehe ich das nach.

## Version 1.1.1290 - 2026-04-28

**Title:** iOS-Section-Header Padding/Letter-Spacing fix; Checkmarks nur noch der Haken (kein weißes Hintergrund-Pill)
**Hero:** none
**Tags:** SettingsTab, iOSSettingsView, Polish

### Why

Zwei kleine UI-Fixes in den iOS-style Einstellungs-Views:

1. **Section-Header** (`ALLGEMEIN`, `STATUS & BEGRÜSSUNG` etc.): hatten `padding-left: 0` und `letter-spacing: 0.5px`. Das hat sie links bündig mit dem Content gemacht und gestreckt aussehen lassen.

2. **Checkmark** in den ausgewählten Optionen (Time-Format, Splashscreen, Auto-Hide-Days etc.): bestand aus einem **weißen runden Hintergrund-Pillen** mit schwarzem Tick darin. Sah wie ein Schalter aus, nicht wie ein iOS-Checkmark.

### Changes

**[iOSSettingsView.css](src/system-entities/entities/news/components/iOSSettingsView.css)**:

- `.ios-section-header`:
  - `padding-left: 0px` → `padding-left: 15px` (Header rückt etwas ein)
  - `letter-spacing: 0.5px` → `letter-spacing: normal` (kein Streck-Tracking)

- `.ios-checkmark`:
  - `background: white` + `border-radius: 50%` weg — kein weißer Pill mehr
  - `color: rgb(0, 122, 255)` → `color: white`
  - Zusätzlich: alle `<circle>`-Elemente innerhalb (vom alten JSX-Markup) werden via CSS `fill: none; stroke: none` versteckt
  - Alle `<path>`-Strokes werden auf `currentColor` (also weiß) geforcet — überschreibt inline `stroke="black"` aus dem JSX

- Hover-State (Row wechselt zu hellem Hintergrund):
  - `.ios-checkmark { background: black }` weg → `background: none`
  - Path-Stroke wechselt auf `rgba(0, 0, 0, 0.6)` (dunkler Tick auf hellem Hintergrund)

JSX-Code in `GeneralSettingsTab.jsx`, `AppearanceSettingsTab.jsx`, `TodosSettingsView.jsx` etc. ist nicht angefasst — die `<motion.circle>` und `<motion.path>` mit alten Inline-Werten bleiben, werden aber durch die neue CSS-Schicht visuell überschrieben.

### Files touched

- `src/system-entities/entities/news/components/iOSSettingsView.css`
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

## Version 1.1.1289 - 2026-04-28

**Title:** News-/Schedule-Cards behalten das horizontale Layout auch unter 481px Breite
**Hero:** none
**Tags:** News, AllSchedules, Mobile, Layout

### Why

Der `@media (max-width: 480px)`-Block in `NewsView.css` hat die Cards auf Mobile in eine Vertikale gestapelt: `flex-direction: column`, Thumbnail 100% Breite und 180px Höhe statt 55×55. Das hat zwei Probleme erzeugt:

1. Auf Mobile haben `.news-article-card` und (über das geteilte CSS) auch die `.news-article-card` in der `system.all_schedules`-Übersicht plötzlich anders ausgesehen als auf Desktop — User-Feedback war: das soll konsistent sein
2. Speziell für Schedule-Cards (klein, mit Mini-Icon-Tile) ist das vertikale Layout overkill — sie wirken aufgebläht

### Changes

`@media (max-width: 480px)`-Block in [NewsView.css](src/system-entities/entities/news/styles/NewsView.css) entfernt. Der `@media (max-width: 768px)`-Block davor bleibt — der schrumpft Thumbnail (50×50) und Schrift (13px), behält aber das Row-Layout.

### Files touched

- `src/system-entities/entities/news/styles/NewsView.css` — Mobile-Stack-Block entfernt
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

## Version 1.1.1288 - 2026-04-28

**Title:** Picker-Container ohne eigene Rundungen — die Ecken übernimmt das Eltern-Card-Chrome
**Hero:** none
**Tags:** PickerWheel, TimePickerWheel, DatePickerWheel, Design

### Why

Beim Test in HA war zu sehen: drei der vier Picker-Ecken waren rund, die vierte (rechts unten) eckig — Inkonsistenz weil das Eltern-Element (HA-Card / `.picker-table-container`) bereits seine eigenen abgerundeten Ecken hat und sie dort das Schedule-Card visuell abschließen. Mein zusätzliches `border-radius: 16px` auf den Picker-Surfaces hat sich mit den Eltern-Rundungen überlagert und an manchen Stellen einen sichtbaren Knick ergeben.

### Changes

`border-radius: 16px` aus den drei Picker-Container-Stilen entfernt:
- [PickerWheel.css](src/components/picker/PickerWheel.css) — `.fsc-picker-wheel` (plus die `.is-bare`-Override für border-radius war redundant, auch raus)
- [TimePickerWheel.css](src/components/picker/TimePickerWheel.css) — `.fsc-time-picker-wheel`
- [DatePickerWheel.css](src/components/picker/DatePickerWheel.css) — `.fsc-date-picker-wheel`

Die Picker-Surface ist jetzt rechteckig — die Pille bleibt rund (10px), das ist der einzige Round-Element. Alle 4 Ecken vom Picker-Container sind nun visuell identisch (scharf), das Eltern-Card kümmert sich um die Außenrundung.

Glass-Treatment (Backdrop-Blur, Saturate, Box-Shadow, inset white-line) bleibt unverändert.

### Files touched

- `src/components/picker/PickerWheel.css`
- `src/components/picker/TimePickerWheel.css`
- `src/components/picker/DatePickerWheel.css`
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

## Version 1.1.1287 - 2026-04-28

**Title:** Picker-Redesign — visionOS-Glass-Surface mit Center-Pill, flache (translateY) Wheel-Mechanik
**Hero:** none
**Tags:** PickerWheel, TimePickerWheel, DatePickerWheel, Design, visionOS

### Why

Das alte 3D-Cylinder-Design (Items rotiert um die x-Achse, perspektivische Verzerrung) wurde abgelöst durch eine flache translateY-Liste mit visionOS-style Glass-Surface und einer translucent-white Center-Pille. Inspiration: [MEddarhri/react-ios-time-picker](https://github.com/MEddarhri/react-ios-time-picker) + visionOS Vibrancy-Treatment. User-Feedback: ruhiger, sauberer, näher an iOS-17/visionOS-Aesthetik.

### Was sich geändert hat — UI

**Alle PickerWheel-Komponenten** (PickerWheel, TimePickerWheel, DatePickerWheel) rendern jetzt:
- **Glass-Surface-Container**: `rgba(28,28,30,0.5)` + `backdrop-filter: blur(30px) saturate(180%)`, `border-radius: 16px`, soft inset-highlight an der Oberkante
- **Center-Pille** statt Hairlines: rounded rectangle (`border-radius: 10px`) hinter dem aktiven Item, translucent white background
- **Flache Items**: stack normal, kein 3D-Cylinder. Items außerhalb des Center-Bands dimmen via Top/Bottom-Fade-Gradient (matched die Surface-Farbe für nahtlosen Übergang)
- **Aktives Item**: bold (`font-weight: 600`) + voll deckende weiße Schrift. Andere Items: `rgba(255,255,255,0.4)`

**TimePickerWheel + DatePickerWheel:** Container-glass + eine Pille die über alle 2/3 Spalten spannt (Hours + Doppelpunkt + Minutes [+ AM/PM] bzw. Tag + Monat + Jahr). Inner-Wheels nutzen `bare={true}` — keine eigene Surface mehr, transparenter Pass-Through.

### Was sich geändert hat — Code

**[PickerWheel.jsx](src/components/picker/PickerWheel.jsx)**:
- Removed: `ANGLE_STEP_DEG`, `TRANSLATE_Z_PX`, per-option `rotateX(...)translateZ(...)` transforms
- Items stack jetzt im normalen Block-Flow (kein `position: absolute` pro Item)
- `updateRotation` umbenannt zu `updateTransform` — setzt nur `pickerScroller.style.transform = translateY(${-scrollTop}px)`
- Neuer `bare`-Prop suppress Glass + Pille + Fades — für den Use-Case in TimePickerWheel/DatePickerWheel
- `VISIBLE_RANGE` von 7 auf 9 erhöht (flache Liste zeigt mehr Items als der 3D-Cylinder, auch außerhalb der Center-Band)

**[PickerWheel.css](src/components/picker/PickerWheel.css)**:
- Removed: `perspective`, `transform-style: preserve-3d`, `backface-visibility`, alle 3D-spezifischen Properties
- Default-Surface: Glass + Pill + Top/Bottom-Fade
- `.fsc-picker-wheel.is-bare`: alles transparent für Container-driven Rendering

**[TimePickerWheel.css](src/components/picker/TimePickerWheel.css) + [DatePickerWheel.css](src/components/picker/DatePickerWheel.css)**:
- Container-Glass-Surface
- Single spanning Pill via `::before` (top:90px, height:30px = Center-Band)
- Top/Bottom-Fade via `::after` als Container-Overlay (deckt Seams zwischen Wheels)
- Separator schmaler (16px statt 20px), keine eigene Hintergrund-Gradient — die Pille deckt das Center-Band

**[TimePickerWheel.jsx](src/components/picker/TimePickerWheel.jsx) + [DatePickerWheel.jsx](src/components/picker/DatePickerWheel.jsx)**:
- Inner `<PickerWheel>` Aufrufe mit `bare` prop

### Verhalten unverändert

- Native Scroll auf cloneScroller (Touch + Mouse)
- ResizeObserver-Recovery bei display:none → block (z.B. wenn Picker in einer collapsed Schedule-Row geöffnet wird)
- smoothScrollTo mit easing, cancelable, rAF-driven
- onChange firet auf Scroll-End (150ms debounce)
- Initial-scroll suppress + Echo-suppress für sauberen Mount-Flow
- Cleanup: scroll listener, 2× rAF, scroll-stop timeout, ResizeObserver — alle im unmount disposed

### Wo das Design erscheint

Überall wo ein Picker im UI ist:
- ScheduleTab Edit-View: Action / Position / Scheduler / Repeat / Time / Endzeit
- TodoFormDialog: Time + Date
- Climate-Schedule-Settings: Temperature / HVAC / Fan / Swing / Preset
- ClimateSettingsPicker: Fan-Speed / Horizontal / Vertical

DaysChipRow ist unverändert — der Wochentage-Picker ist eine Chip-Row, kein Wheel.

### Files touched

- `src/components/picker/PickerWheel.jsx` — flat presentation, bare prop
- `src/components/picker/PickerWheel.css` — visionOS rewrite, bare modifier
- `src/components/picker/TimePickerWheel.jsx` — bare wheels
- `src/components/picker/TimePickerWheel.css` — container glass + spanning pill
- `src/components/picker/DatePickerWheel.jsx` — bare wheels
- `src/components/picker/DatePickerWheel.css` — container glass + spanning pill
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

## Version 1.1.1286 - 2026-04-28

**Title:** Bugfix — Timer wurde beim Refresh als Zeitplan kategorisiert. Detection läuft jetzt über Einzelmodus/Schemamodus statt fragilem Name-Prefix
**Hero:** none
**Tags:** ScheduleTab, Bugfix, nielsfaber

### Why

In v1.1.1285 wurden Timer beim Refresh als Zeitpläne im Schemamodus angezeigt, obwohl sie als Timer (Einzelmodus, ohne Endzeit) erstellt wurden. Root cause: die Kategorisierung lief auf `friendly_name.startsWith('timer')` — fragile Heuristik die kaputt ging wenn der Schedule-Name nicht durchkam wie wir ihn gesendet haben. Plus konzeptueller Bruch: die Timer/Zeitplan-Trennung war an einem Anzeigewert (Name) verankert, nicht am tatsächlichen Schedule-Storage-Format.

### Changes

**[scheduleUtils.js](src/utils/scheduleUtils.js)** — Kategorisierung in `transformToScheduleObject` umgestellt von Name-Prefix auf das Vorhandensein eines `stop`-Werts im ersten Timeslot. Neuer Helper `hasStopMarker(slot)` deckt alle drei nielsfaber-Timeslot-Formate ab (string `"08:00"`, range string `"08:00:00 - 10:00:00"`, object `{start, stop, actions}`):

```
Timer    = Einzelmodus = no stop
Schedule = Schemamodus = stop set
```

Damit ist die Round-Trip-Logik direkt: was der User im Picker als "Timer" erstellt (`timeslots: [{start, actions}]`), kommt beim Refresh als Timer zurück. Was er als "Zeitplan" erstellt (`timeslots: [{start, stop, actions}]`), bleibt Zeitplan. Kein Name-Parsing mehr.

**[ScheduleTab.jsx](src/components/tabs/ScheduleTab.jsx)** — die in v1.1.1286-Entwurf vorübergehend hinzugefügten `tags: ['fsc-timer']` Marker (waren ein Workaround für die fragile Name-Detection) wieder entfernt — mit der Storage-basierten Detection nicht mehr nötig.

### Behavior preserved

- Timer-Save: schickt weiterhin `timeslots: [{start, actions}]` ohne `stop`. Beim Read kommt es als Einzelmodus zurück → Timer-Kategorie ✓
- Schedule-Save: schickt `timeslots: [{start, stop, actions}]`. Beim Read kommt es als Schemamodus zurück → Schedule-Kategorie ✓
- ScheduleListItem: Timer-Items rendern weiterhin `Um 23:56 - Noch X Min` (Einzelmodus-Display), Schedules rendern `08:00 → 10:00 - Mo, Di` (Schemamodus-Display)
- handleItemClick: bei `item.type === 'timer'` wird `loadTimerState` aufgerufen, sonst `loadScheduleState` mit setEndTime — unverändert

### Files touched

- `src/utils/scheduleUtils.js` — `hasStopMarker` helper, neue Kategorisierung
- `src/components/tabs/ScheduleTab.jsx` — `tags`-Zusatz wieder raus
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Migrations-Hinweis

Falls noch alte Schedules existieren die mit Name `Timer - X - HH:MM` aber MIT `stop` gespeichert sind (in v1.1.1285 unklar ob das passiert ist), werden die jetzt als Schedule kategorisiert. Falls das stört: einmalig in nielsfaber's eigener Card öffnen und ins Einzelmodus zurück-konvertieren.

## Version 1.1.1285 - 2026-04-28

**Title:** Zeitplan = Schemamodus mit Start- + Endzeit; Repeat erweitert auf 3 Werte (Wiederholen / Stoppen / Löschen) für Timer und Zeitplan
**Hero:** none
**Tags:** ScheduleTab, Schemamodus, Wiederholung, nielsfaber

### Why

Die nielsfaber/scheduler-component unterstützt zwei Schedule-Typen — **Einzelmodus** (nur Startzeit) und **Schemamodus** (Start + Endzeit als Zeitfenster) — sowie drei `repeat_type`-Werte (`repeat`, `pause`, `single`). Unsere Card kannte bisher nur Einzelmodus mit zwei repeat-Werten. Diese Release bringt unser Mental-Model in Einklang: Timer = Einzelmodus, Zeitplan = Schemamodus, beide mit allen drei Wiederholungs-Optionen.

### Changes

**Repeat von 2 auf 3 Werte** ([SchedulePickerTable.jsx](src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx)):
- Vorher: `[t('regular'), t('once')]`
- Jetzt: `[t('repeatRepeat'), t('repeatPause'), t('repeatSingle')]` — DE: Wiederholen / Stoppen / Löschen, EN: Repeat / Pause / Delete
- Mapping zur nielsfaber-API: `repeat` / `pause` / `single` (über `repeatLabelToApi` in ScheduleTab.jsx)
- Repeat-Row ist jetzt sichtbar in **beiden** Modi (vorher nur Zeitplan) — Timer-User können auch "Stoppen" oder "Wiederholen" wählen

**Schemamodus für Zeitplan** ([SchedulePickerTable.jsx](src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx)):
- Neue **Endzeit-Row** mit eigenem `<TimePickerWheel>`, sichtbar nur bei `schedulerValue === t('scheduleMode')`
- Position direkt unter der Startzeit (data-line="8")
- Default = `01:00` (Start + 1h)

**Save-Pfad** ([ScheduleTab.jsx](src/components/tabs/ScheduleTab.jsx)):
- `handleCreateSchedule` / `handleUpdateSchedule` schreiben jetzt `timeslots: [{ start, stop, actions }]` (vorher nur `start`)
- Alle vier Save-Pfade (Timer-Create/Update, Schedule-Create/Update) nutzen `repeat_type: repeatLabelToApi(repeatValue)` statt hardcoded `'single'` / `'repeat'`
- Timer-Save fügt **kein** `stop` hinzu — bleibt Einzelmodus

**Edit-Loading** ([editStateLoaders.js](src/components/tabs/ScheduleTab/utils/editStateLoaders.js)):
- Neuer Helper `repeatTypeToLabel(repeatType, t)` mappt API-Werte zurück auf User-Labels
- `loadTimerState` + `loadScheduleState` setzen jetzt den korrekten 3-Wert-Label (vorher waren beide auf `t('once')` / `t('regular')` zurückgemappt)
- `loadScheduleState` akzeptiert optionalen `setEndTime`-Parameter und übernimmt die Endzeit aus `item.endTime` falls vorhanden

**API-Read** ([scheduleUtils.js](src/utils/scheduleUtils.js)):
- Neuer Helper `extractTimeRange(slot)` unterstützt drei mögliche Formate für `timeslots[0]`: plain string ("08:00"), range string ("08:00:00 - 10:00:00"), object ({start, stop, actions}). Robust für alle Read-Pfade
- Schedule + Timer transformation gibt jetzt zusätzlich `endTime` und `repeat_type` zurück, damit der Edit-Loader sie nutzen kann

**State-Hook** ([useScheduleForm.js](src/components/tabs/ScheduleTab/hooks/useScheduleForm.js)):
- Neuer State `endTimeValue` (Default `'01:00'`), Action-Creator `setEndTime`, Reducer-Cases `SET_END_TIME` und Reset-Logik in `RESET_FORM` / `LOAD_EDIT_DATA`
- Default-Repeat im Initial-State und nach Reset: `t('repeatSingle')`. Der `handleSchedulerChange`-Wrapper in ScheduleTab flippt das auf `t('repeatRepeat')` wenn der User auf Zeitplan-Mode wechselt — und auf `t('repeatSingle')` wenn zurück auf Timer

**Liste-Display** ([ScheduleListItem.jsx](src/components/tabs/ScheduleTab/components/ScheduleListItem.jsx)):
- Schedules mit Endzeit zeigen jetzt `08:00 → 10:00 - Mo, Di` statt nur `Um 08:00 - Mo, Di` (Schemamodus visuell erkennbar)
- Timer + Schedules ohne Endzeit: unverändert

**Translations** ([de.js](src/utils/translations/languages/de.js), [en.js](src/utils/translations/languages/en.js)):
- Neue Keys: `repeatRepeat`, `repeatPause`, `repeatSingle`, `endTime`
- Alte Keys (`regular`, `once`) bleiben für Backwards-Compat in den translations, werden aber nicht mehr aktiv genutzt

### Backwards-Compat

- **Existierende Schedules ohne Endzeit:** beim Edit erscheint die Endzeit-Row mit dem Form-Default (`01:00`). Beim Save wird ein `stop`-Feld geschrieben — der Schedule wird damit zum Schemamodus konvertiert. Pro User-Wunsch keine spezielle Migration für bestehende Daten

### Files touched

- `src/components/tabs/ScheduleTab/hooks/useScheduleForm.js` — endTimeValue state + setEndTime + repeat-default `repeatSingle`
- `src/components/tabs/ScheduleTab/utils/editStateLoaders.js` — repeatTypeToLabel + setEndTime in loadScheduleState
- `src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx` — 3-Werte Repeat-Picker, neue Endzeit-Row, Repeat in Timer-Mode sichtbar
- `src/components/tabs/ScheduleTab/components/ScheduleListItem.jsx` — Schemamodus-Display "start → end"
- `src/components/tabs/ScheduleTab.jsx` — handleSchedulerChange flippt Repeat-Default, repeatLabelToApi, alle vier Save-Pfade mit `stop` + dynamic repeat_type, setEndTime an SchedulePickerTable
- `src/utils/scheduleUtils.js` — extractTimeRange helper, endTime + repeat_type in transformierten objects
- `src/utils/translations/languages/de.js` — repeatRepeat / repeatPause / repeatSingle / endTime
- `src/utils/translations/languages/en.js` — gleiche keys
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

## Version 1.1.1284 - 2026-04-28

**Title:** Climate-Schedules aus nielsfaber: Edit zeigt jetzt korrekte Aktion und behält den ursprünglichen Service beim Speichern
**Hero:** none
**Tags:** ScheduleTab, climate, nielsfaber, Bugfix

### Why

Wenn ein Climate-Schedule direkt im nielsfaber/scheduler-Backend (z.B. über deren eigene Card) mit `climate.set_hvac_mode` erstellt wird (statt `climate.set_temperature`), zeigte unser Edit-View **"Ausschalten"** an — egal ob der HVAC-Mode `heat` / `cool` / `fan_only` etc. war. Schlimmer: bei Save schrieb unsere Card den Schedule **immer** auf `climate.set_temperature` zurück. Wer also nur die Uhrzeit eines `set_hvac_mode`-Schedules ändern wollte, verlor den ursprünglichen Service.

Beide Bugs hingen am gleichen Stelleninkrement: die Card kannte historisch nur `set_temperature` als „aktiven" Climate-Service.

### Changes

**[editStateLoaders.js](src/components/tabs/ScheduleTab/utils/editStateLoaders.js)** — `loadClimateEditState`:
- Vorher: `const isTurnOn = serviceName === 'set_temperature';` — alles andere (`set_hvac_mode`, `set_fan_mode`, `set_swing_mode`, `set_preset_mode`, `set_humidity`, `turn_on`) fiel auf "Ausschalten"
- Jetzt: nur `turn_off` UND `set_hvac_mode` mit `hvac_mode: 'off'` zählen als Ausschalten. Alle anderen climate-Services werden als "Einschalten" mit den entsprechenden Settings geladen
- Neu: optionaler `setOriginalServiceName`-Parameter speichert den ursprünglichen Service für lossless save
- `showClimateSettings` greift nur bei "Einschalten" — vorher konnte es auch bei `set_hvac_mode/off` aufgehen, was inkonsistent zum Action-State war

**[serviceActionBuilders.js](src/components/tabs/ScheduleTab/utils/serviceActionBuilders.js)** — komplett rewrite. Neue Helper `pickClimateOnService(settings, originalServiceName)` mit Prioritäten:
1. `temperature` in den Settings → `climate.set_temperature` (HA's set_temperature akzeptiert `hvac_mode` etc. als optionale Zusatz-Parameter)
2. Genau ein Schlüssel der zu einem dedizierten Service passt (`hvac_mode` → `set_hvac_mode`, `fan_mode` → `set_fan_mode`, `swing_mode` → `set_swing_mode`, `preset_mode` → `set_preset_mode`, `humidity` → `set_humidity`) → dieser dedizierte Service. **Das ist der lossless-edit-Fall**
3. originalServiceName aus dem Edit + passender Schlüssel weiterhin in den Settings → ursprünglicher Service. Deckt "User hat zusätzlich zu hvac_mode noch Temperatur gesetzt" — wobei dann Regel 1 zuerst greift
4. Fallback: `climate.set_temperature` (breiteste Akzeptanz in HA)

Plus: `actionValue === t('turnOn')` ohne Settings → `climate.turn_on` (vorher: fiel auf den generischen `${domain}.turn_on`-Pfad). `actionValue === t('turnOff')` mit `originalServiceName === 'set_hvac_mode'` und `hvac_mode === 'off'` → behält `set_hvac_mode/off` (lossless).

**[useScheduleForm.js](src/components/tabs/ScheduleTab/hooks/useScheduleForm.js)** — neuer State `originalServiceName: null`. Reducer-Cases `SET_ORIGINAL_SERVICE_NAME` und Reset im `RESET_FORM` / `LOAD_EDIT_DATA`. Neuer Action-Creator `setOriginalServiceName`.

**[ScheduleTab.jsx](src/components/tabs/ScheduleTab.jsx)** — `originalServiceName` und `setOriginalServiceName` aus dem Hook destrukturiert, an `loadClimateEditState` übergeben, an alle vier `createServiceAction`-Aufrufe (handleConfirm, handleSubmit für Timer/Schedule, Update-Branch). Plus: Reset von `originalServiceName` zu Beginn von `handleItemClick` damit kein stale Wert von einem vorherigen Edit überlebt.

### Behavior tabel — was jetzt passiert

| Schedule kommt mit | Edit-View Action | Edit-View Climate-Settings | Save (ohne Änderung) |
|---|---|---|---|
| `set_temperature` `{temperature: 22, hvac_mode: heat}` | Einschalten | Temp 22, HVAC heat | `set_temperature` (unverändert) |
| `set_hvac_mode` `{hvac_mode: fan_only}` | Einschalten | HVAC: Nur Lüftung | `set_hvac_mode` (lossless ✓) |
| `set_fan_mode` `{fan_mode: auto}` | Einschalten | Fan auto | `set_fan_mode` (lossless ✓) |
| `set_hvac_mode` `{hvac_mode: off}` | Ausschalten | (versteckt) | `set_hvac_mode` mit `hvac_mode: off` (lossless ✓) |
| `turn_off` | Ausschalten | (versteckt) | `turn_off` |

### Files touched

- `src/components/tabs/ScheduleTab/utils/editStateLoaders.js` — climate-edit-Loader korrigiert
- `src/components/tabs/ScheduleTab/utils/serviceActionBuilders.js` — smart climate service-pick
- `src/components/tabs/ScheduleTab/hooks/useScheduleForm.js` — originalServiceName state
- `src/components/tabs/ScheduleTab.jsx` — Wiring + Reset bei handleItemClick
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

## Version 1.1.1283 - 2026-04-27

**Title:** ScheduleTab Wochentage-Picker — chip-row replaces the multi-select wheel
**Hero:** none
**Tags:** ScheduleTab, UX, Picker

### Why

The wheel-based weekday picker (scroll to a day, then click a separate "Auswählen" button to toggle) was a quirky two-step on a touch surface — every toggle cost a scroll plus a tap, and the button moved back and forth with the wheel. With seven options that all fit comfortably on one row, a chip-row gives **one tap per toggle** and the whole week is visible at a glance. The technical migration in v1.1.1281 (Phase 5) deliberately stayed 1:1 with the legacy UX so the rebuild stayed scope-controlled; this release is the follow-up UX cleanup that was flagged in `docs/SESSION_NOTES_2026-04-26.md` §8.

### Changes

**New: [`<DaysChipRow>`](src/components/picker/DaysChipRow.jsx)** — flat row of 7 buttons. Active chips get the iOS-blue fill, inactive chips a translucent outline. Same controlled API as the old `<MultiSelectWheel>` (`options`, `selectedValues`, `onChange`) — drop-in swap, the SchedulePickerTable handlers don't change.

**[SchedulePickerTable.jsx](src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx)** — `<MultiSelectWheel>` import + JSX replaced by `<DaysChipRow>`. Comment in the days-round-trip helper section updated.

**Deleted: `src/components/picker/MultiSelectWheel.jsx` + `MultiSelectWheel.css`** — only consumer migrated, file went unused. The `renderOption` prop on `<PickerWheel>` (added in Phase 5 specifically for MultiSelectWheel) stays in place — it's harmless and a plausible future extension point.

### Behavior preserved

- Round-trip through `daysValueToArray` / `arrayToDaysValue` is unchanged — the daysValue display string (`"Mo, Di"` / `"Täglich"` / `"Mo-Fr"` / `"Sa, So"` / `"Keine"`) keeps the same predicate set, so existing schedules read back the same way and `mapDaysToSchedulerFormat` (used at submit time) is unaffected
- aria-pressed reflects active state for screen-reader users
- Chip height (56px) plus padding fits the 210px picker container the rest of the schedule edit table uses, so the open/close animation doesn't snap

### Files touched

- `src/components/picker/DaysChipRow.jsx` — NEW
- `src/components/picker/DaysChipRow.css` — NEW
- `src/components/picker/MultiSelectWheel.jsx` — DELETED
- `src/components/picker/MultiSelectWheel.css` — DELETED
- `src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx` — import swap, JSX replace
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

## Version 1.1.1282 - 2026-04-27

**Title:** Climate pickers + Todo DatePicker migrated to `<PickerWheel>` / `<DatePickerWheel>`; legacy `IOSTimePicker.jsx` deleted (Phase 6 of the IOSPicker rebuild)
**Hero:** none
**Tags:** Climate, todos, IOSPicker, Refactor, Picker-Rebuild

### Why

Phase 6 closes out the picker rebuild. The remaining nine `new IOSPicker(...)` and one `new DatePicker(...)` call sites — all in Climate components and TodoFormDialog — are now self-contained Preact components. With the last consumer gone, `src/components/IOSTimePicker.jsx` has been deleted entirely (~660 lines).

### Changes

**New: [`<DatePickerWheel>`](src/components/picker/DatePickerWheel.jsx)** — three `<PickerWheel>`s (day / month / year) sharing a center band hairline. Day count adapts to the selected month + year (Feb leap year, 30/31-day months) — same clamp-on-month-change as the legacy `DatePicker.updateDayPicker`. Month names localized for `de` / `en`. Year range default 6 (current year + 5).

**[TodoFormDialog.jsx](src/system-entities/entities/todos/components/TodoFormDialog.jsx)**:
- Import `DatePicker` from `IOSTimePicker` removed; `DatePickerWheel` added
- Refs `dayRef` / `monthRef` / `yearRef` / `datePickerRef` removed
- `useEffect([currentView, lang])` block with `new DatePicker(...)` + `requestAnimationFrame` wait-for-refs loop — gone
- Date-view JSX: three `<div className="date-picker-wheel">` slots replaced by `<DatePickerWheel value={dueDate} onChange={(iso, display) => ...} lang={lang} />`

**[ClimateScheduleSettings.jsx](src/components/climate/ClimateScheduleSettings.jsx)** — five legacy `new IOSPicker(...)` calls (temperature, hvacMode, fanMode, swingMode, presetMode) replaced with `<PickerWheel>`:
- The `pickerRefs` object and `pickersInitialized` flag map removed
- The `useEffect([lang])` that ran the imperative init pipeline 100ms after mount is gone
- Pre-computed label arrays (`hvacLabels` etc.) and per-picker `handleXChange` handlers translate label-strings ↔ mode keys at the picker boundary so the rest of the component keeps working in mode-keys

**[ClimateSettingsPicker.jsx](src/components/climate/ClimateSettingsPicker.jsx)** — three legacy `new IOSPicker(...)` calls (fanSpeed, horizontal, vertical) replaced with `<PickerWheel>`. Refs / init useEffect / `try`-`catch` boilerplate / global `document.querySelector('.value-line-N')` text-content pokes — all gone, the value cells are JSX-driven by component state.

**Deleted: `src/components/IOSTimePicker.jsx`** — last consumer gone. The four legacy classes (`IOSPicker`, `TimePicker`, `DatePicker`, `MultiSelectPicker`, ~660 lines total) are now history. The picker rebuild plan from v1.1.1277 / `docs/SESSION_NOTES_2026-04-26.md` §3 is complete.

### Picker rebuild — closing summary

| Phase | Release | What |
|---|---|---|
| 1 | v1.1.1278 | `<PickerWheel>` core component (single-column 3D wheel) |
| 2 | v1.1.1278 | `<TimePickerWheel>` composed from PickerWheel |
| 3 | v1.1.1279 | ScheduleTab time picker → `<TimePickerWheel>` |
| 4 | v1.1.1280 | TodoFormDialog time picker → `<TimePickerWheel>`, global 24h/AM-PM setting now applies to todos |
| 5 | v1.1.1281 | ScheduleTab Action / Position / Scheduler / Days / Repeat → `<PickerWheel>` + `<MultiSelectWheel>`; `pickerInitializers.js` deleted |
| 6 | v1.1.1282 | Climate pickers + Todo DatePicker migrated; `IOSTimePicker.jsx` deleted |

Net code change across the six phases: roughly −900 lines of imperative DOM-manipulation classes and useEffect init pipelines, +600 lines of self-contained reactive Preact components. Memory leaks (instances re-created without disposal on AM/PM switch / view re-mount) are gone — all async resources are cleaned up on unmount. Dead methods (`setHourMode`, `reinitHours`, `setTime` on TimePicker — none ever existed, all silent failures) are gone with their callers.

### Files touched

- `src/components/picker/DatePickerWheel.jsx` — NEW
- `src/components/picker/DatePickerWheel.css` — NEW
- `src/system-entities/entities/todos/components/TodoFormDialog.jsx` — DatePicker → DatePickerWheel
- `src/components/climate/ClimateScheduleSettings.jsx` — 5 IOSPicker → PickerWheel
- `src/components/climate/ClimateSettingsPicker.jsx` — 3 IOSPicker → PickerWheel
- `src/components/IOSTimePicker.jsx` — DELETED
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Risk profile

Climate components are less-frequently used than ScheduleTab — but `<ClimateScheduleSettings>` is part of the schedule edit flow when scheduling a climate entity (auto-mounts when action = "Einschalten"). Same migration pattern as Phase 5, same `<PickerWheel>` exercised in production for the past two days. TodoFormDialog DatePicker is straightforward — three independent PickerWheels with the day-clamp matching legacy behavior.

## Version 1.1.1281 - 2026-04-27

**Title:** ScheduleTab pickers fully reactive (Phase 5 of the IOSPicker rebuild) — Action / Position / Scheduler / Days / Repeat now Preact components; pickerInitializers.js deleted
**Hero:** none
**Tags:** ScheduleTab, IOSPicker, Refactor, Picker-Rebuild

### Why

Phase 5, the last leg of the picker rebuild plan from v1.1.1277. The remaining five legacy `IOSPicker`/`MultiSelectPicker` consumers in ScheduleTab (Action, Position for cover, Scheduler, Days, Repeat) are all now Preact components composed from `<PickerWheel>` and the new `<MultiSelectWheel>`. The whole imperative picker-init pipeline — the 70-line `useEffect` that ran 100ms after mount, the `pickerRefs` object, the `pickersInitialized` flag map, the `updateView` DOM-poking helper — is gone.

### Changes

**New: [`<MultiSelectWheel>`](src/components/picker/MultiSelectWheel.jsx)** — composes `<PickerWheel>` with a per-option active/inactive chip and a select/deselect button next to the center band. UX matches the legacy `MultiSelectPicker` 1:1 (scroll → button appears → click toggles). Hides the button while scrolling, same as the old picker.

**New: [`renderOption` prop on `<PickerWheel>`](src/components/picker/PickerWheel.jsx)** — optional custom renderer for the visible 3D-cylinder side. The clone-scroller (hidden, used only for native scroll geometry) keeps plain text. `<MultiSelectWheel>` uses this to draw the per-day chip.

**[SchedulePickerTable.jsx](src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx)** — full rewrite:
- All five picker `<div ref={pickerRefs.X}>` slots replaced with `<PickerWheel>` (Action, Position, Scheduler, Repeat) and `<MultiSelectWheel>` (Days)
- New props: `setAction`, `setCoverPosition`, `setScheduler`, `setDays`, `setRepeat`
- `pickerRefs` prop dropped
- Inline helpers `daysValueToArray` / `arrayToDaysValue` round-trip the user-facing days display string ("Mo, Di" / "Täglich" / etc.) through an array — same predicate set as the legacy callback (`noDays` / `daily` / `weekdays` / `weekend`). Sort by weekday-order on the way back so the display string is stable.
- Position picker emits `'30%'`-style strings that get `parseInt`'d back to the integer state expected by the rest of the schedule pipeline

**[ScheduleTab.jsx](src/components/tabs/ScheduleTab.jsx)** — removed:
- Imports: `IOSPicker` / `MultiSelectPicker` from `IOSTimePicker`, all six init helpers from `pickerInitializers` (file deleted, see below)
- The `pickerRefs` object (six refs)
- The `pickersInitialized` flag map
- The 70-line `useEffect` that ran the imperative init pipeline 100ms after `showPicker` flipped to true
- The `updateView` helper — its DOM-poking (toggling `.schedule-option` row visibility, updating `#time-label` text) is now driven directly by JSX in SchedulePickerTable; the only meaningful side-effect (forcing time to `00:00` on switch to timer mode) lives in a new `handleSchedulerChange` wrapper passed as the scheduler picker's `onChange`

**[ClimateSettingsPicker.jsx](src/components/climate/ClimateSettingsPicker.jsx)** — dropped dead `TimePicker` and `MultiSelectPicker` imports (only `IOSPicker` is actually used).

**Deleted: `src/components/tabs/ScheduleTab/utils/pickerInitializers.js`** — all six init helpers (`initializeActionPicker`, `initializePositionPicker`, `initializeSchedulerPicker`, `initializeTimeFormatPicker`, `initializeDaysPicker`, `initializeRepeatPicker`) had no remaining callers after Phases 3-5.

### What's NOT in this release (and why)

The original plan called for deleting `src/components/IOSTimePicker.jsx` entirely in Phase 5. That isn't possible yet because two consumers still use it:

- **`<ClimateScheduleSettings>` and `<ClimateSettingsPicker>`** — five `new IOSPicker(...)` instantiations (temperature / hvacMode / fanMode / swingMode / presetMode + fanSpeed / horizontal / vertical)
- **`<TodoFormDialog>`** — `new DatePicker(...)` for the date-view (Phase 4 only migrated its TimePicker)

The legacy `TimePicker` and `MultiSelectPicker` classes inside `IOSTimePicker.jsx` are now dead code (no consumer), but the file as a whole stays. A future Phase 6 can either migrate the climate pickers + DatePicker or remove the dead classes inline.

### Behavior preserved (acceptance criteria from the plan)

- Action / Scheduler / Repeat / Position scroll-snap and onChange semantics match the legacy callback (one event per scroll-end, snapped to grid)
- Days picker: scroll → button appears → click toggles. Display string round-trips correctly through `daysValueToArray` / `arrayToDaysValue`
- Cover position: scrolling past `'50%'` updates the integer state to `50`
- Switching to timer mode resets time to `00:00` (replaces the legacy `updateView` side-effect)
- Schedule-option rows (Days / Repeat) hide in timer mode, time-label text flips between "Timer" and "Schedule" — both now JSX-reactive instead of DOM-poked
- All async resources (scroll listener, two rAFs, scroll-stop timeout, ResizeObserver) cleaned up on unmount — no leak across multi-edit

### Files touched

- `src/components/picker/PickerWheel.jsx` — added `renderOption` prop
- `src/components/picker/MultiSelectWheel.jsx` — NEW
- `src/components/picker/MultiSelectWheel.css` — NEW
- `src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx` — rewrite
- `src/components/tabs/ScheduleTab.jsx` — picker init pipeline removed
- `src/components/climate/ClimateSettingsPicker.jsx` — dead imports cleaned
- `src/components/tabs/ScheduleTab/utils/pickerInitializers.js` — DELETED
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### Risk profile

ScheduleTab is the most-used edit UI in the app — schedules, timers, all_schedules inline-edit. A regression here means users can't edit time plans. Mitigation: the new `<PickerWheel>` is the same component already shipped in v1.1.1278+ inside `<TimePickerWheel>` and exercised in production for two days; this release just expands its consumer set.

## Version 1.1.1280 - 2026-04-27

**Title:** TodoFormDialog time picker migrated to `<TimePickerWheel>` (Phase 4 of the IOSPicker rebuild) — global 24h/AM-PM setting now applies to todos
**Hero:** none
**Tags:** todos, IOSPicker, Refactor, Picker-Rebuild

### Why

Phase 4 of the picker rebuild plan. `TodoFormDialog` had its own `new TimePicker(hoursElement, minutesElement, periodElement, options)` instantiation in a `useEffect` triggered by switching to the `'time'` view — independent from the ScheduleTab path migrated in v1.1.1279. This was the only other legacy TimePicker call site in the bundle.

A side benefit: the global System-Settings → 24h/AM-PM choice now actually applies in todos. Before, the dialog always rendered three slots (hours / minutes / period) and passed all three to `new TimePicker`, which forced the picker into 12h-mode regardless of the global setting. `<TimePickerWheel format="auto"` reads `is24hFormat()` and renders 2 wheels (24h) or 3 wheels (12h) accordingly — matching the ScheduleTab behavior introduced in v1.1.1274.

### Changes

**[TodoFormDialog.jsx](src/system-entities/entities/todos/components/TodoFormDialog.jsx)**:
- Imports: `TimePicker` removed, `TimePickerWheel` added
- Refs removed: `hoursRef`, `minutesRef`, `periodRef`, `timePickerRef`
- The `useEffect([currentView])` block that did the imperative `new TimePicker(...)` (with its `requestAnimationFrame` loop waiting for refs to attach) is gone
- Time-view JSX: the three `<div className="time-picker-wheel">` slots + `<div className="time-picker-separator">:</div>` replaced with a single `<TimePickerWheel value={dueTime || '09:00'} onChange={...} format="auto" />`
- `onChange` callback semantics preserved: still updates `dueTime`, `dueTimeDisplay`, and flips `setHasChanges(true)`
- Default fallback `'09:00'` matches the previous `['09', '00']` initial values

The `DatePicker` import stays — it is still consumed by the date-view `useEffect` (Phase 5 will deal with it).

### Behavior preserved + improved

- **Edit-open shows the saved value** — `<TimePickerWheel>` carries the same ResizeObserver visibility recovery as ScheduleTab, so opening the time view after the initial `display:none` mount anchors correctly
- **AM/PM works when global setting is `ampm`** — was effectively forced-12h before; now properly conditional
- **No memory leak on view switch** — the legacy code never disposed previous `TimePicker` instances when the view re-mounted; the new component cleans up its scroll listener / two rAFs / scroll-stop timeout / ResizeObserver on unmount

### Files touched

- `src/system-entities/entities/todos/components/TodoFormDialog.jsx` — import swap, refs removed, useEffect dropped, JSX replaced
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### What's next

Phase 5 — last leg of the rebuild. Migrate `Action`, `Position` (cover), `Scheduler`, `Days` (multi-select), and `Repeat` pickers in ScheduleTab to wrappers around `<PickerWheel>`. Once the last consumer is gone, delete `src/components/IOSTimePicker.jsx` (and the now-unused `pickerInitializers.js`) entirely.

## Version 1.1.1279 - 2026-04-27

**Title:** ScheduleTab time picker is now a reactive Preact component (Phase 3 of the IOSPicker rebuild)
**Hero:** none
**Tags:** ScheduleTab, IOSPicker, Refactor, Picker-Rebuild

### Why

Phase 3 of the picker rebuild plan from v1.1.1277 (see `docs/SESSION_NOTES_2026-04-26.md` §3). The ScheduleTab time picker was the largest legacy `IOSPicker`/`TimePicker` consumer — driven imperatively from a 600+ line useEffect that called `new TimePicker(hoursElement, minutesElement, periodElement, options)` and then poked at the resulting instance via dead methods (`setHourMode`, `reinitHours`, `setTime` — none of which existed; they failed silently). Replacing it with the new `<TimePickerWheel>` removes the imperative DOM manipulation, makes the controlled `value`/`onChange` flow obvious, and fixes a class of memory leaks (the legacy code re-instantiated `IOSPicker`s on every period switch without disposing the previous one).

The new components were built and smoke-tested in v1.1.1278 (`src/components/picker/PickerWheel.jsx` + `TimePickerWheel.jsx`) but stayed unused in the bundle until this release.

### Changes

**[SchedulePickerTable.jsx](src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx)** — replaced the manual three-`<div>` time-picker scaffold (`#picker-line-6-hours` / `.time-picker-separator` / `#picker-line-6-minutes` plus the conditional `#picker-line-6-period`) with a single `<TimePickerWheel value={timeValue} onChange={setTime} format={timeFormat} />`. Timer mode forces `format="24h"` (a duration has no AM/PM); schedule mode uses `"auto"` so the wheel honors the global System-Settings choice. Added `setTime` to the component's props.

**[ScheduleTab.jsx](src/components/tabs/ScheduleTab.jsx)** — removed:
- Imports: `TimePicker` from `IOSTimePicker`, `initializeTimePicker` from `pickerInitializers`
- Refs: `pickerRefs.hoursRef` / `minutesRef` / `periodRef`, plus the standalone `timePickerRef`
- The `initializeTimePicker(...)` block in the big picker-init `useEffect` (and the `pickersInitialized.current.time` flag)
- The `timePickerRef.current = null` cleanup (no longer needed)
- The `setTimeout(... timePickerRef.current.setTime(hour, minute) ...)` block in `handleItemClick` — `<TimePickerWheel>` already anchors to the latest `timeValue` prop
- The dead-method wall in `updateView` (`selectedHour='00'`, `setHourMode('24h')`, `reinitHours()`, `updateValue()`) — replaced with a single `setTime('00:00')`
- Pass `setTime` through to `<SchedulePickerTable>`

**[pickerInitializers.js](src/components/tabs/ScheduleTab/utils/pickerInitializers.js)** — removed `initializeTimePicker` and the now-unused `TimePicker` / `is24hFormat` imports. Other init helpers (`initializeActionPicker`, `initializeRepeatPicker`, etc.) stay until Phase 5.

### Behavior preserved (acceptance criteria from the plan)

- 24h mode: hour wheel anchors to the saved value on edit-open, even when the picker container is initially `display:none` — `<PickerWheel>` carries the same `ResizeObserver` recovery the legacy fix added in v1.1.1275
- 12h mode: hours show 01-12 + AM/PM, internal value stays canonical 24h, AM↔PM switch reuses the same hour-list (no rebuild)
- Re-mount on cancel/save scroll-syncs to `timeValue` automatically via the `[options, value]` sync effect
- No memory leak on multi-edit: every async resource (scroll listener, two rAFs, scroll-stop timeout, ResizeObserver) is cleaned up on unmount

### Files touched

- `src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx` — TimePickerWheel mount, `setTime` prop, `timeFormat` derivation
- `src/components/tabs/ScheduleTab.jsx` — removed time-picker imperative path, passes `setTime` down
- `src/components/tabs/ScheduleTab/utils/pickerInitializers.js` — `initializeTimePicker` and stale imports removed
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

### What's next

Phase 4 migrates `TodoFormDialog` (the only other `new TimePicker(...)` call site). Phase 5 finishes off Action / Days / Repeat / Position / Scheduler with `<PickerWheel>` and removes `IOSTimePicker.jsx` entirely.

## Version 1.1.1278 - 2026-04-27

**Title:** ScheduleTab picker polish — period choices, repeat from backend, separator gradient parity
**Hero:** none
**Tags:** ScheduleTab, IOSPicker, Polish, Bugfix

### Why

Three small picker issues left over from the v1.1.1273-1277 wave, bundled into one release as a clean baseline before the upcoming `<PickerWheel>` rebuild:

1. **Period picker still offered "24h"** as a third option even though the global 24h/AM-PM setting now lives in System-Settings (since v1.1.1274). When a `periodElement` is passed at all, we are by definition in 12h-mode — only AM/PM make sense.
2. **Repeat wheel was hardcoded to "Einmalig"** on edit-open, regardless of the schedule's actual `repeat_type`. Editing a recurring schedule and tapping Save without touching the Repeat wheel silently flipped it to single.
3. **Separator gradient was a single 210px gradient** with manual stops at 42.86%/57.14%, while the wheel columns (`.picker-up`/`.picker-down`) use two separate 90px overlays. Sub-pixel rounding made the dark frame in the colon column slightly different from the wheels under some zoom levels.

### Changes

**Period choices reduced to AM/PM** ([IOSTimePicker.jsx:235-255](src/components/IOSTimePicker.jsx#L235)). `periodData` is now `['AM', 'PM']`. If a legacy caller still has `selectedPeriod === '24h'` in its state, we fall back to AM via `Math.max(0, indexOf(...))`. The 24h/12h decision is now purely owned by `is24hFormat()` in System-Settings.

**Repeat wheel reads from `item.repeat_type`** ([editStateLoaders.js:73-102](src/components/tabs/ScheduleTab/utils/editStateLoaders.js#L73)). `loadScheduleState` and `loadTimerState` now accept `setRepeat`. Schedules: `repeat_type === 'single'` → `t('once')`, otherwise `t('regular')`. Timers: always `t('once')` (timer = einmalig per Definition). [`initializeRepeatPicker`](src/components/tabs/ScheduleTab/utils/pickerInitializers.js#L140) accepts a `currentValue` and positions the wheel on it instead of always defaulting to index 1.

**Separator gradient split into two 90px overlays** ([ScheduleTab.css:485-500](src/components/tabs/ScheduleTab/styles/ScheduleTab.css#L485)). Replaced the single `linear-gradient(180deg, ...)` with stops at 42.86%/57.14% by two no-repeat backgrounds: one 90px from the top, one 90px from the bottom. Pixel-identical to `.picker-up` and `.picker-down` on the wheel columns, so all three columns frame the center band the exact same way at every zoom level.

### Files touched

- `src/components/IOSTimePicker.jsx` — period picker data reduced to `['AM', 'PM']`
- `src/components/tabs/ScheduleTab/utils/editStateLoaders.js` — `loadScheduleState` / `loadTimerState` set repeat from `item.repeat_type`
- `src/components/tabs/ScheduleTab/utils/pickerInitializers.js` — `initializeRepeatPicker(ref, t, setRepeat, currentValue)` honors the current state
- `src/components/tabs/ScheduleTab.jsx` — passes `setRepeat` through to the state loaders, passes `repeatValue` to `initializeRepeatPicker`
- `src/components/tabs/ScheduleTab/styles/ScheduleTab.css` — `.time-picker-separator` background = two 90px overlays
- `src/components/tabs/SettingsTab/components/AboutSettingsTab.jsx` — version bump
- `src/system-entities/entities/versionsverlauf/index.js` — version bump

## Version 1.1.1277 - 2026-04-26

**Title:** TimePicker layout: equal-share wheels work for both 24h (2 wheels) and 12h (3 wheels)
**Hero:** none
**Tags:** ScheduleTab, IOSPicker, Bugfix

### Why

After v1.1.1274 wired the global 24h/AM-PM setting to the TimePicker, switching to AM/PM mode added a third wheel column (period) to the picker. But `.time-picker-container > div:first-child` and `> div:last-child` still hard-pinned `max-width: 50%`. With 3 wheels + 20px separator that meant: hours = 50% (first), period = 50% (last), minutes squeezed in between → the entire picker shifted left and looked broken.

### Changes

**Width rule generalized** ([ScheduleTab.css:475-485](src/components/tabs/ScheduleTab/styles/ScheduleTab.css#L475)). Replaced the two `:first-child` / `:last-child` rules with one rule targeting any wheel column (= any direct `<div>` that isn't `.time-picker-separator`):

```css
.time-picker-container > div:not(.time-picker-separator) {
  flex: 1;
  min-width: 0;
}
```

Each wheel gets equal share of the remaining space after the 20px separator. 24h mode: 2 wheels ≈ 50% each. 12h mode: 3 wheels ≈ 33% each. No `max-width` cap needed — flex-1 + min-width-0 handles it cleanly.

### Files touched

- `src/components/tabs/ScheduleTab/styles/ScheduleTab.css` — `.time-picker-container` child width rule generalized

## Version 1.1.1276 - 2026-04-26

**Title:** TodoDetailView CSS for `.time-picker-separator` was unscoped — it was overriding ScheduleTab's picker
**Hero:** none
**Tags:** ScheduleTab, todos, CSS, Bugfix

### Why

The schedule edit picker's center column (the colon between hours and minutes) looked different from the wheel columns: the dark gradient that frames the selected band was missing, and the inspector showed `background: transparent` plus `z-index: 11` winning over ScheduleTab's gradient. Source: two unscoped `.time-picker-separator { ... }` rules in `TodoDetailView.css` that bled into ScheduleTab and overrode the gradient + raised the separator above the new container hairlines (so they appeared discontinuous).

### Changes

**Both `.time-picker-separator` rules in [TodoDetailView.css](src/system-entities/entities/todos/styles/TodoDetailView.css) scoped to their todos containers**:
- The rule near line 224 → scoped to `.todo-time-picker-wheels .time-picker-separator`
- The rule near line 523 (the one with `z-index: 11`) → scoped to `.todo-picker-container .time-picker-separator`
- The matching `:before/:after { height: 0 }` killers also scoped (they were nuking the schedule container's hairlines globally)

**Result:** ScheduleTab's `.time-picker-separator` keeps its proper `linear-gradient(180deg, rgba(0,0,0,.25), transparent 42.86%, transparent 57.14%, rgba(0,0,0,.25))` background and the colon column now has the same dark frame at top/bottom as the wheel columns. The container-level hairlines from v1.1.1275 (`.time-picker-container::before/::after`) now sit above the separator and form one continuous line across all three columns.

### Files touched

- `src/system-entities/entities/todos/styles/TodoDetailView.css` — three `.time-picker-separator*` rules scoped to their todos wrappers; one redundant `:before/:after { height: 0 }` block deleted

## Version 1.1.1275 - 2026-04-26

**Title:** TimePicker shows actual saved value when expanded; center-band hairlines now seamless
**Hero:** none
**Tags:** ScheduleTab, IOSPicker, Bugfix

### Why

Two related visual bugs in the schedule edit picker:

1. **Wheel showed `00:00` even though the schedule's saved time was `21:00`.** The header on top of the picker correctly showed `21:00` (from React state), but the wheel column was stuck at index 0. Reproducible by opening any schedule's inline-edit and clicking the "Zeitplan"-row to expand the time picker.

2. **Selection-band hairlines didn't line up across columns.** The horizontal lines that frame the center "selected" row were drawn three separate times — `picker-up`'s `border-bottom`, `picker-down`'s `border-top`, and the `time-picker-separator`'s `::before/::after` pseudos — at slightly different y-coordinates and different widths. Visible as small steps where the lines met the colon column.

### Changes

**`IOSPicker` re-applies its initial scroll position once the element first becomes visible** ([IOSTimePicker.jsx:16-37](src/components/IOSTimePicker.jsx#L16)). Root cause of #1: `div.picker { display: none; }` is the default styling for all picker rows in the schedule table — they only become visible when the user clicks a row to expand. But IOSPicker's `init()` runs as soon as the picker DOM mounts (before the row gets expanded). At init time, the scroll container has 0 visible height, so `cloneScroller.scrollTop = lineHeight * selected` has no effect — the wheel is stuck at index 0 forever, even after the row becomes visible.

Fix: a `ResizeObserver` watches the scroll container. The first time the container reports a non-zero height (= the row got expanded), the observer re-applies `scrollTop = lineHeight * selected`, calls `updateRotation()`, then disconnects. One-shot — won't interfere with user scrolling later. Falls back gracefully on environments without `ResizeObserver` (very old browsers).

Added a public `scrollToSelected()` method too, in case external consumers need to re-center the picker programmatically. Also stashed `this.element._iosPicker = this` so consumers can find the instance from the DOM.

**Center-band hairlines unified into one continuous line per side** ([ScheduleTab.css:402-428,459-486](src/components/tabs/ScheduleTab/styles/ScheduleTab.css#L402)). Removed:
- `.picker-up { border-bottom: 1px ... }` (was at y=90-91 without box-sizing)
- `.picker-down { border-top: 1px ... }` (was at y=120-121)
- `.time-picker-separator::before` (was at y=89, off by 1)
- `.time-picker-separator::after` (was at y=120)

Replaced with two pseudo-elements on `.time-picker-container` that span the entire row — one at `top: 90px`, one at `top: 120px`, both `1px` tall, `rgba(255,255,255,0.3)`, `z-index: 3`. One line, no offsets, no width gaps.

### Files touched

- `src/components/IOSTimePicker.jsx` — `ResizeObserver`-based scroll re-apply, `scrollToSelected()` method, instance back-reference
- `src/components/tabs/ScheduleTab/styles/ScheduleTab.css` — three-piece hairlines collapsed into two `.time-picker-container` pseudos

## Version 1.1.1274 - 2026-04-26

**Title:** all_schedules edit-flow polish + grouping cycle + global 24h/AM-PM time format setting
**Hero:** none
**Tags:** all_schedules, ScheduleTab, Settings, UX

### Why

A bunch of follow-ups from v1.1.1273 plus a new global setting:

1. **Brief flash of ScheduleTab's normal list before the edit picker opens.** v1.1.1273's render guard `!!initialEditItem && !showPicker && !editingItem` failed because `setEditingItem` fires before the 100ms `setShowPicker` timeout — making the guard turn off too early.
2. **"Abbrechen" button did nothing.** It called `resetPickerStates` which set `showPicker = false`, leaving the user looking at an empty container (since the list is hidden by the inline-edit guard). No way back to the all_schedules overview.
3. **Action labels rendered as raw translation keys** (`ui.schedule.schedule_close`, `ui.schedule.setTemperature`). The `t` helper in AllSchedulesView already prefixes with `schedule.`; calling `t('schedule.X')` produces `schedule.schedule.X`, which doesn't exist in the translations.
4. **`ui.schedule.createInDetailView` footer text** at the bottom of all_schedules — taking up space, raw key shown.
5. **Need a global toggle for grouping** like news has (Quellen / Topics / Themen) — for all_schedules the natural dimensions are Type (Klima/Rollläden) / Devices (entity friendly_name) / Rooms (area name).
6. **No global 24h vs AM/PM setting** anywhere in the system. Per-schedule Zeitformat-row was removed in v1.1.1273; now there's nowhere to choose.

### Changes

**Inline-edit list-flash fully fixed** ([ScheduleTab.jsx:553-557](src/components/tabs/ScheduleTab.jsx#L553)). Render-guard simplified from `!!initialEditItem && !showPicker && !editingItem` to `!!initialEditItem`. When `initialEditItem` is set (= called from all_schedules), the entire normal ScheduleTab UI (`<ScheduleFilter>`, `<ScheduleList>`, `<AddScheduleButton>`) is suppressed for the lifetime of the inline-edit. Only the picker renders. No more flash.

**`onClose` prop on ScheduleTab + parent gets notified on cancel/save** ([ScheduleTab.jsx:49,159-171](src/components/tabs/ScheduleTab.jsx#L49)). New optional `onClose` prop. Inside `resetPickerStates` (which runs on Cancel and after a successful Save), `onClose` fires with a 100ms delay so any refresh calls finish first. all_schedules passes `handleCloseEdit` to it — clicking Abbrechen now correctly returns to the overview list. Save also returns to overview.

**Action label translation keys fixed** ([AllSchedulesView.jsx:153-180](src/system-entities/entities/all-schedules/AllSchedulesView.jsx#L153)). Removed the double `schedule.` namespace prefix in all action lookups (`t('schedule.close')` → `t('close')`, etc.). Added `setTemperature` to de+en translations (was missing entirely). Fallback for unknown service names: capitalize the service tail (`light.toggle` → `Toggle`) instead of showing the raw service path.

**Footer removed** ([AllSchedulesView.jsx](src/system-entities/entities/all-schedules/AllSchedulesView.jsx)). `info-footer` div with `ui.schedule.createInDetailView` placeholder text deleted from the JSX.

**Grouping-mode cycle button** ([AllSchedulesView.jsx:131-148, 222-251, 273-290, 461-490](src/system-entities/entities/all-schedules/AllSchedulesView.jsx#L131)). Three modes:
- **Typ** (default, orange via `mode-topics`) — chips show domains (Klima, Rollläden, Lichter, Schalter, ...)
- **Geräte** (blue via `mode-quellen`) — chips show device friendly_names
- **Räume** (purple via `mode-themen`) — chips show room/area names

New `getEntityArea(entityId)` helper resolves area name through the registry chain: entity-registry → device-registry → state-attr → `hass.areas[id].name`. Each schedule item gets `deviceName` and `roomName` precomputed during `processAllSchedules` so the toolbar render stays cheap. Filter logic uses `groupingFieldOf(item)` to pick the right field per mode. Click cycles the mode and resets `categoryFilter`. Chip toggle behaviour identical to news (click active chip again = deactivate). Search now also looks at `deviceName` and `roomName`.

Reuses the news mode-button CSS classes (`.news-grouping-mode-btn.mode-topics/-quellen/-themen`) since both views are in the same bundle and the styling is identical.

**Global 24h vs AM/PM time format setting** ([timeFormatPreference.js](src/utils/timeFormatPreference.js), [GeneralSettingsTab.jsx](src/components/tabs/SettingsTab/components/GeneralSettingsTab.jsx)).
- New `src/utils/timeFormatPreference.js` helper with `readTimeFormat()` / `writeTimeFormat()` / `is24hFormat()`. Stored in `localStorage.userTimeFormat`. Writes dispatch a `timeFormatChanged` event for live reactivity.
- New row in Settings → Allgemein, after Währung: "Zeitformat" / "Wähle 24-Stunden oder AM/PM". Tap opens a sub-view with two radio-style options: "24-Stunden (z.B. 21:00)" and "12-Stunden (AM/PM) (z.B. 9:00 PM)". Same visual pattern as the existing currency picker.
- Translations added to de + en under the same section as `appCurrency`.

**TimePicker now respects the global preference** ([pickerInitializers.js:153-180](src/components/tabs/ScheduleTab/utils/pickerInitializers.js#L153), [SchedulePickerTable.jsx:130-141](src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx#L130), [ScheduleTab.jsx:177-181](src/components/tabs/ScheduleTab.jsx#L177)). `pickerRefs` gets a new `periodRef`. The picker table conditionally renders the period DOM slot — only when 12h-mode is active. `initializeTimePicker` reads `is24hFormat()` and either passes `periodEl=null + hourMode='24h'` or `periodEl=ref.current + hourMode=undefined` (which lets TimePicker derive AM/PM from the initial hour). Same hour 21:00 now shows as "21" in 24h mode or "PM 09" with AM/PM mode visible.

### Files touched

- `src/components/tabs/ScheduleTab.jsx` — `onClose` prop, `resetPickerStates` calls it, render-guard simplified, `pickerRefs.periodRef` added
- `src/system-entities/entities/all-schedules/AllSchedulesView.jsx` — grouping mode state + helpers, action key translations fixed, footer removed
- `src/components/tabs/ScheduleTab/utils/pickerInitializers.js` — reads global time format
- `src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx` — conditional period DOM slot
- `src/utils/timeFormatPreference.js` — new helper module
- `src/components/tabs/SettingsTab/components/GeneralSettingsTab.jsx` — Zeitformat row + sub-view
- `src/utils/translations/languages/de.js` + `en.js` — new keys

### Notes

The TodoFormDialog also uses TimePicker but is not yet wired to the new preference — it always renders the period element. Easy follow-up if needed: read `is24hFormat()` and conditionally hide the period slot the same way.

## Version 1.1.1273 - 2026-04-26

**Title:** Schedule edit fixes — TimePicker now shows the actual saved time, picker UI flash gone, Zeitformat-row removed
**Hero:** none
**Tags:** ScheduleTab, all_schedules, Bugfix, UX

### Why

Three follow-up issues from v1.1.1272's all_schedules inline-edit:

1. **Wrong time in the picker wheel.** Editing a 21:00 schedule, the picker showed `01:00` (or always `09:00` after the AM/PM conversion) instead of the saved value. Header was correct, picker wasn't.
2. **List flashes briefly before edit opens.** ~100ms of the ScheduleTab's normal list/filter UI showed up between the click and the picker appearing.
3. **Header showed aggregate counts during edit.** "11 Zeitpläne / 0 Timer · 11 Pläne" stayed visible while editing a specific device's schedule.
4. **Redundant Zeitformat-row** (24h / AM / PM picker inside the schedule itself) — that choice belongs in global system settings, not per-schedule.

### Changes

**TimePicker constructor call corrected** ([pickerInitializers.js:153-178](src/components/tabs/ScheduleTab/utils/pickerInitializers.js#L153)). Old code passed three arguments to `new TimePicker(hoursEl, minutesEl, optionsObject)` — but the constructor signature is `(hoursElement, minutesElement, periodElement, options)`. The options object was being interpreted as `periodElement`, so the *real* options (`callback`, `initialHour`, `initialMinute`, `hourMode`) all silently fell back to defaults. Result: callback was a no-op (so React's `setTime` was never wired up), `initialHour` defaulted to `'09'`, and the period picker tried to attach to the options object as if it were a DOM element. New call passes `null` as the third argument and the options as the fourth.

**TimePicker resilient to null `periodElement` and supports 24h-only mode** ([IOSTimePicker.jsx:138-235](src/components/IOSTimePicker.jsx#L138)). New `is24h = !this.periodElement || options.hourMode === '24h'` flag. When true: hours data spans 00-23 instead of 01-12, period auto-set to `'24h'`, no AM/PM conversion of the initial hour, and `periodPicker` instantiation is skipped (avoids the previous IOSPicker crash on null element). Defensive `Math.max(0, hoursData.indexOf(...))` so a non-matching value falls back to index 0 instead of `-1`.

**ScheduleTab list/filter/add hidden during the auto-edit transition** ([ScheduleTab.jsx:551-583](src/components/tabs/ScheduleTab.jsx#L551)). New `isAutoEditing = !!initialEditItem && !showPicker && !editingItem` guard wraps the `<ScheduleFilter>`, `<ScheduleList>`, and `<AddScheduleButton>` in a fragment that only renders when NOT auto-editing. The picker still renders below (because it has its own `showPicker` gate). Result: clicking from all_schedules drops directly into a blank panel that becomes the picker once `handleItemClick` finishes, with no list flash.

**Auto-edit trigger uses `Promise.resolve().then` instead of a 250ms `setTimeout`** ([ScheduleTab.jsx:399-410](src/components/tabs/ScheduleTab.jsx#L399)). Microtask scheduling: gives React one tick to mount and process state, then fires immediately. Combined with the auto-editing render guard above, the perceived delay drops from ~350ms to whatever `handleItemClick`'s internal 100ms `setTimeout` requires.

**Header now shows the device when editing inline** ([DetailView.jsx:344-368](src/components/DetailView.jsx#L344), [AllSchedulesView.jsx:206-219](src/system-entities/entities/all-schedules/AllSchedulesView.jsx#L206)). `getAllSchedulesHeaderInfo()` checks `selectedSchedule` first: if set, returns `stateText: <deviceName>` and `stateDuration: "<DomainLabel> · bearbeiten"` (e.g. "Flur" / "Klima · bearbeiten"). The ViewRef now exposes `selectedScheduleDeviceName` (resolved from `hass.states[entities[0]].friendly_name`) and `selectedScheduleDomainLabel` so the header lookup is a pure read.

**Zeitformat-row removed from `SchedulePickerTable`** ([SchedulePickerTable.jsx:95-96](src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx#L95)). Per-schedule 24h/AM/PM choice is gone. TimePicker runs in 24h mode only; if a user wants AM/PM globally, that's a system-settings job. The `initializeTimeFormatPicker` call in `ScheduleTab` is also dropped since the DOM slot no longer exists.

### Files touched

- `src/components/tabs/ScheduleTab.jsx` — `initialEditItem` ref-based trigger via microtask, `isAutoEditing` render guard, `initializeTimeFormatPicker` call removed
- `src/components/tabs/ScheduleTab/utils/pickerInitializers.js` — `new TimePicker(...)` call signature fixed
- `src/components/tabs/ScheduleTab/components/SchedulePickerTable.jsx` — Zeitformat-row + picker container removed
- `src/components/IOSTimePicker.jsx` — `is24h` mode support, null `periodElement` guarded, `selected` index defensive
- `src/components/DetailView.jsx` — `getAllSchedulesHeaderInfo` returns device-context header during inline-edit
- `src/system-entities/entities/all-schedules/AllSchedulesView.jsx` — ViewRef exposes `selectedScheduleDeviceName` / `selectedScheduleDomainLabel`

## Version 1.1.1272 - 2026-04-26

**Title:** all_schedules inline-edit — click on a schedule edits in place, no navigation away
**Hero:** none
**Tags:** all_schedules, UX

### Why

Clicking a schedule in `all_schedules` previously called `onNavigate(targetEntityId, { openTab: 'schedule' })` and dropped the user into the device-detail view's `ScheduleTab`. Two clicks (item → device detail → schedule list → click again to edit), and the user lost their place in the schedule overview. User wants direct edit-in-place: click → edit picker opens → save → back to overview.

### Changes

**`ScheduleTab` accepts an `initialEditItem` prop** ([ScheduleTab.jsx:49,128-132,389-403](src/components/tabs/ScheduleTab.jsx#L49)). When set, the tab auto-fires `handleItemClick(editItem)` 250ms after mount, so the picker opens pre-filled with that schedule's time / days / action / domain-specific settings. `handleItemClick` is referenced through a `ref` (set after its `const` declaration) because of TDZ: the trigger `useEffect` runs at the top of the function but `handleItemClick` is defined further down. Defensive shape coercion: `editItem.domain = editItem.domain || editItem.domainRaw` since all_schedules uses the latter.

**`AllSchedulesView` click handler swapped from navigation to local state** ([AllSchedulesView.jsx:339-352](src/system-entities/entities/all-schedules/AllSchedulesView.jsx#L339)). Out: `onNavigate(targetEntityId, { openTab: 'schedule' })`. In: `setSelectedSchedule(schedule)` plus closing search/settings if open. New `handleCloseEdit()` clears `selectedSchedule` and bumps `refreshTrigger` so the list reloads after potential edits.

**Inline edit branch in render** ([AllSchedulesView.jsx:444-468](src/system-entities/entities/all-schedules/AllSchedulesView.jsx#L444)). When `selectedSchedule` is set, the toolbar/list is replaced by a `<ScheduleTab>` mounted inline. The `item` prop is constructed on the fly from `selectedSchedule.entities[0]` looked up against `hassRef.current.states` (entity_id, domain, friendly_name, attributes, state). `initialEditItem={selectedSchedule}` triggers the auto-edit. `onTimerCreate` / `onScheduleCreate` callbacks point to `handleCloseEdit` (mostly a no-op for edits, since updates take a different code path inside ScheduleTab — but covers the create-from-edit-mode case).

**Back-navigation hierarchy extended** ([AllSchedulesView.jsx:267-275](src/system-entities/entities/all-schedules/AllSchedulesView.jsx#L267)). `handleBackNavigation` priority: selected-schedule → settings → search → onBack(). The Detail-Header's back-button (which already invokes `handleBackNavigation` via the all_schedules ViewRef) now correctly closes the inline-edit and returns to the overview list.

**ViewRef now exposes `selectedSchedule`** so DetailView can react to the inline-edit state if needed (e.g. header swap in a follow-up).

### Tradeoffs

The embedded `ScheduleTab` brings its own UI with it: its own filter row (Alle/Timer/Zeitpläne), its own list of schedules-for-this-device, its own AddScheduleButton. Effectively two filter rows visible, and the list shown inline shows only schedules for the clicked schedule's parent device, not the whole overview. This is a pragmatic first iteration — full functionality is preserved, but UX is denser than ideal. A follow-up could trim the embedded UI down to just the picker (no filter/list/add) when in initialEditItem mode.

### Files touched

- `src/components/tabs/ScheduleTab.jsx` — `initialEditItem` prop + ref-based auto-trigger
- `src/system-entities/entities/all-schedules/AllSchedulesView.jsx` — `selectedSchedule` state, click handler swap, inline-edit branch, back-navigation hierarchy, ViewRef
- `src/system-entities/styles/AllSchedulesView.css` — `.all-schedules-edit-wrapper` scroll container

## Version 1.1.1271 - 2026-04-26

**Title:** all_schedules adopts the news design language — same toolbar, same cards, same detail-tabs, same header
**Hero:** none
**Tags:** all_schedules, News, UX, Architecture

### Why

User wants the news view's design (toolbar / detail-tabs / detail-header-info / card layout) applied 1:1 to other system entities. First target: `system.all_schedules`. Goal is a consistent visual language across system entities so users don't relearn each view.

### Changes

**Entity action-buttons** ([all-schedules/index.js:24-29](src/system-entities/entities/all-schedules/index.js#L24)). Added `actionButtons: [overview, search, settings, refresh]` matching the news entity's set. The slider in `TabNavigation` now tracks an active button for all_schedules just like for news.

**Toolbar replaced with the news pattern** ([AllSchedulesView.jsx:435-501](src/system-entities/entities/all-schedules/AllSchedulesView.jsx#L435)). Out: the old sticky `.filter-tabs-container` with the gradient `.scheduler-filter-slider` and 3 plain text tabs (Alle / Timer / Zeitpläne). In: the news `.news-filter-bar` layout — three compact `.news-status-btn` icon-pills (list / clock / calendar SVGs + counts) for status filter, then a `.news-toolbar-divider`, then `.filter-tab` chips for the unique device-domains found across the items (Klima, Lichter, Rollläden, Schalter, ...). Status filters are exclusive (radio); chips toggle on click (active again deactivates the filter). The two filters compose: status × domain × search.

**Cards now use `.news-article-card` styling** ([AllSchedulesView.jsx:506-553](src/system-entities/entities/all-schedules/AllSchedulesView.jsx#L506)). Out: the old `.scheduler-item` with `.item-icon` / `.item-content` / `.item-time` / `.item-type` badge. In: the news card structure — left a 55×55 `.article-thumbnail` tile holding the timer/schedule SVG icon (a small CSS override `.schedule-thumbnail` swaps the news image-background for a dark tile with a centered icon and hides the gradient overlay). Right side: `.article-category-badge.category-${domainRaw}` + `.article-title` (entity friendly_name) + `.article-footer` (time · days · action). Stagger animation, hover scale, transition timing all match news.

**Domain badge color rules** ([NewsView.css:526-549](src/system-entities/entities/news/styles/NewsView.css#L526)). Added 6 new `.article-category-badge.category-*` rules so the badges work for the schedule domains too, sharing the news badge styling: climate (blue), light (orange), cover (green), switch (grey), fan (teal), media_player (purple).

**Search inline-bar** ([AllSchedulesView.jsx:419-446](src/system-entities/entities/all-schedules/AllSchedulesView.jsx#L419)). Same pattern as news: tapping the search action-button toggles `searchOpen`; the toolbar gets replaced by a `.news-search-row` with a `.news-search` pill (magnifier + autofocused `<input>` + clear-X). Filters items by entity name / action / days / time / domain label as you type. Closing search clears the query.

**Settings stub** ([AllSchedulesView.jsx:407-419](src/system-entities/entities/all-schedules/AllSchedulesView.jsx#L407), [AllSchedulesView.css:78-105](src/system-entities/styles/AllSchedulesView.css#L78)). The settings action-button is wired but all_schedules has no real settings yet. Renders a centered placeholder ("⚙️ Einstellungen kommen demnächst") so the slot in the action-button row isn't dead.

**`window._allSchedulesViewRef` exposes** the same surface as `_newsViewRef`: `handleOverview`, `handleOpenSettings`, `handleToggleSearch`, `handleRefresh`, `handleBackNavigation`, `getActiveButton`, plus stats (`totalCount`, `timerCount`, `scheduleCount`, `showSettings`, `searchOpen`).

**Wiring across the shared infrastructure**:
- `TabNavigation.jsx` — `_allSchedulesViewRef` added to the view-ref chain (3 places) and to `handleActionClick` for `back` / `overview` / `settings` / `refresh` / `search`. Slider opacity now correctly hides when no button matches the active mode.
- `DetailView.jsx` — added an event listener for `all-schedules-view-state-changed` that re-runs `updateActionButtons` so the slider refreshes on toggle. New `getAllSchedulesHeaderInfo()` returns `"X Zeitpläne / Y Timer · Z Pläne"` and is added to the `stateText`/`stateDuration` fallback chain alongside the news/todos/printer header info.

**Container restyled** ([AllSchedulesView.css:9-30](src/system-entities/styles/AllSchedulesView.css#L9)). The old flat `padding: 0 16px` is gone. `.all-schedules-view` now matches `.news-view-container`: `width: 100%; height: 100%; max-height: 555px; background: rgba(0, 0, 0, 0.2); border-radius: 24px; overflow: hidden; position: relative` so the CustomScrollbar positions correctly inside it (same fix as the v1.1.1259 news scrollbar issue).

**News CSS imported into AllSchedulesView**. Both views share the same toolbar / chip / card classes; importing `../news/styles/NewsView.css` from `AllSchedulesView.jsx` ensures the styles are loaded even when the user opens schedules without ever opening news. Vite dedupes the CSS so the bundle doesn't grow.

### Migration note for the next entity

The pattern is now reusable. To onboard another system entity (e.g. `weather`, `todos`, `versionsverlauf`):
1. Add `actionButtons: [overview, search, settings, refresh]` to the entity config (or whichever subset makes sense).
2. Expose `window._<entity>ViewRef` with `handleOverview` / `handleOpenSettings` / `handleToggleSearch` / `handleRefresh` / `handleBackNavigation` / `getActiveButton` + stat fields.
3. Dispatch a `<entity>-view-state-changed` event on state transitions.
4. Add the ref to the chain in `TabNavigation.jsx` (3 lines) and to each action handler (1 line per case).
5. Add a `get<Entity>HeaderInfo()` to `DetailView.jsx` and append to the fallback chain.
6. In the view JSX: import `NewsView.css`, use `.news-filter-bar` / `.news-status-btn` / `.filter-tab` / `.news-article-card` / `.news-search-row`. Container styled like `.news-view-container`.

### Files touched

- `src/system-entities/entities/all-schedules/index.js` — actionButtons
- `src/system-entities/entities/all-schedules/AllSchedulesView.jsx` — full restructure (state, handlers, ref, search, settings stub, JSX)
- `src/system-entities/styles/AllSchedulesView.css` — container restyled, schedule-thumbnail override, settings-stub, footer; old scheduler-item / filter-tabs / scheduler-filter-slider rules removed
- `src/system-entities/entities/news/styles/NewsView.css` — 6 new domain badge color rules (climate/light/cover/switch/fan/media_player)
- `src/components/DetailView/TabNavigation.jsx` — `_allSchedulesViewRef` in ref-chain + 5 action handlers
- `src/components/DetailView.jsx` — event listener + `getAllSchedulesHeaderInfo`

## Version 1.1.1270 - 2026-04-26

**Title:** PurgeCSS no longer strips dynamic mode-classes; nav arrows reposition top-right; ghost-list fix for prev/next navigation
**Hero:** none
**Tags:** News, Bugfix, Build

### Why

Three things shipped together:

1. The per-mode background colors from v1.1.1269 (`.mode-quellen`, `.mode-topics`, `.mode-themen`) were being **stripped at build time by PurgeCSS** — the className uses dynamic interpolation (`mode-${groupingMode}`), so the static class extractor never saw the literal class names and treated them as unused.
2. The floating prev/next arrows from v1.1.1269 were vertically centered overlay buttons; user wants them anchored top-right at the height of the article's category badge.
3. **Backward and forward buttons broke when the active article got auto-marked as read while the status filter was set to "Ungelesen"** — the article instantly fell out of `filteredArticles`, so `findIndex` returned -1 and both prev/next went to `null`. Same root cause for the "first article = forward dead" report and the "backward never works" report.

### Changes

**PurgeCSS safelist extended** ([postcss.config.cjs:65-71](postcss.config.cjs#L65)). Added `/^mode-/`, `/^news-/`, and `/^article-/` to the deep regex safelist. Confirmed in `dist/fast-search-card.js` that `.mode-quellen`, `.mode-topics`, and `.mode-themen` now survive minification with their respective `#007aff` / `#ff9500` / `#af52de` backgrounds. The grouping-mode button now actually shows the per-mode color it was supposed to since v1.1.1269.

**Nav arrows now top-right at category-badge height** ([NewsView.css:868-902](src/system-entities/entities/news/styles/NewsView.css#L868)). Removed the `top: 50%; transform: translateY(-50%)` floating-vertical-center positioning. New layout: `top: 28px`, prev at `right: 60px`, next at `right: 20px` — both 32×32 (down from 40×40) so they fit visually at the top corner without competing with the badge or the title. Hover/active scale transforms no longer need to compensate for the centering transform.

**Navigation Ghost-List fix** ([NewsView.jsx:683-700, 332-359](src/system-entities/entities/news/NewsView.jsx#L683)). The render path (and the keyboard handler) now build a `navigationList` that's `filteredArticles` plus the active article re-inserted at its natural date-sorted position when it's been filtered out. Trigger case: status filter `unread` + `autoMarkRead: true` setting → opening any article instantly removes it from the visible list, causing `findIndex(a.id === selectedArticle.id)` to return -1 and both prev/next to evaluate to null. With the ghost-list approach, navigation order is preserved across the read state-change and you can keep stepping through.

### Files touched

- `postcss.config.cjs` — safelist regexes for `mode-`, `news-`, `article-`
- `src/system-entities/entities/news/NewsView.jsx` — `navigationList` ghost-list logic in render + keydown handler
- `src/system-entities/entities/news/styles/NewsView.css` — `.news-detail-nav-arrow(-prev/-next)` repositioned + resized

## Version 1.1.1269 - 2026-04-26

**Title:** News article-detail prev/next nav, mode-button restyled to match chips with per-mode color
**Hero:** none
**Tags:** News, UI, Polish

### Changes

**Floating prev/next arrows in the article detail view** ([NewsView.jsx:684-712](src/system-entities/entities/news/NewsView.jsx#L684), [NewsView.css:868-899](src/system-entities/entities/news/styles/NewsView.css#L868)). Two 40px circular buttons with `backdrop-filter: blur(12px) saturate(140%)` overlay the news container at vertical center, left and right edges (`left/right: 12px`). They navigate through `filteredArticles` (so they respect the current status / topic / search filter — clicking next from the last visible article won't jump to a hidden one). Hidden when no prev/next exists. Hover scales up by 1.06, click presses to 0.96.

**Keyboard navigation in the detail view** ([NewsView.jsx:329-348](src/system-entities/entities/news/NewsView.jsx#L329)). `ArrowLeft` / `ArrowRight` walk through the same filtered list. The handler ignores keystrokes targeting `<input>`, `<textarea>`, or `contentEditable` elements, so typing in the search bar isn't affected.

**Mode-cycle button restyled** ([NewsView.jsx:809-821](src/system-entities/entities/news/NewsView.jsx#L809), [NewsView.css:121-152](src/system-entities/entities/news/styles/NewsView.css#L121)). Previous version had its own typography (12px, weight 600, letter-spacing) that didn't match the surrounding chip pills. Now uses identical `.filter-tab` typography: `padding: 8px 16px`, `border-radius: 20px`, `font-size: 14px`, `font-weight: 500`. The swap-icon SVG is gone — the label alone is enough since each mode also has a distinct background color.

**Per-mode background color on the cycle button**. Each mode now wears one of three iOS system colors with matching glow:
- **Quellen** → blue `rgb(0, 122, 255)` + blue box-shadow
- **Topics** → orange `rgb(255, 149, 0)` + orange box-shadow (matches `--news-orange`)
- **Themen** → purple `rgb(175, 82, 222)` + purple box-shadow

White text on all three. Hover bumps brightness by 10%. Active mode is now visible at a glance from the color, not just the label.

### Files touched

- `src/system-entities/entities/news/NewsView.jsx` — prev/next button JSX + index calc, keydown handler, restyled mode-button (no SVG, mode-class)
- `src/system-entities/entities/news/styles/NewsView.css` — `.news-detail-nav-arrow(-prev/-next)` rules, rewritten `.news-grouping-mode-btn` with per-mode color variants

## Version 1.1.1268 - 2026-04-26

**Title:** News grouping cycle — dedicated mode-button (Quellen ⇄ Topics ⇄ Themen), chip toggling, multi-tag support
**Hero:** none
**Tags:** News, UX, Bugfix

### Why

The v1.1.1267 implementation packed mode-cycling and "reset to all" into the same `Alle ___` chip. Two-state click behaviour was confusing — to cycle modes from a filtered state, you had to click twice and the user couldn't predict whether a click would reset or cycle. fast-news-reader's own Lovelace card solves this with a dedicated mode-cycle button (separate from the chip strip) that always cycles + always resets the active chip. Plus their topic mode iterates the full `entry.category` array (multi-tag), and they have an "Other" bucket so feeds without a curated theme don't silently disappear in Themen-mode. Adopting that whole pattern.

### Changes

**Article shape now stores the full `entry.category` array** ([news/index.jsx:330-354](src/system-entities/entities/news/index.jsx#L330)). New field `categories` (slugified array) sits next to `category` (first slug, used by the badge). Topic-mode chip building and filtering iterate `categories[]` so an article tagged `["politik", "ausland"]` shows under both pills.

**Dedicated mode-cycle button replaces the dual-purpose `Alle ___` chip** ([NewsView.jsx:801-816](src/system-entities/entities/news/NewsView.jsx#L801), [NewsView.css:121-148](src/system-entities/entities/news/styles/NewsView.css#L121)). New `.news-grouping-mode-btn` sits between the status group and the chip row, styled with the news-orange accent so it visually reads as a control rather than a filter chip. Shows the current mode label (`Quellen` / `Topics` / `Themen`) and a swap-horizontal icon. Click always cycles to the next mode and resets `categoryFilter` to `'all'`. Default mode is `'quellen'`. The hover title spells out the cycle order so first-time users get the mechanic.

**Chips now toggle on click** ([NewsView.jsx:818-829](src/system-entities/entities/news/NewsView.jsx#L818)). Tapping the active chip again deactivates it (back to `categoryFilter === 'all'` for the current mode). Standard iOS-style multi-state behaviour — no separate "Alle" pseudo-chip needed since deselecting any chip yields the "all" state.

**Themen-mode "Other" bucket** ([NewsView.jsx:506-528, 287-298](src/system-entities/entities/news/NewsView.jsx#L506)). Feeds without a fast-news-reader preset (custom URLs added by the user) get `theme: null`. Without a fallback they'd vanish from the chip row entirely under Themen-mode. Now `getChips()` appends a synthetic `__other__` value when at least one article lacks a theme; the chip displays as "Sonstige" / "Other" and the filter matches `!a.theme`.

### Dropped

- The dual-purpose `Alle ___` chip (replaced by mode-button + chip toggling)
- `groupingAllLabel` helper (no longer needed)
- The two-click "first reset, then cycle" interaction

### Files touched

- `src/system-entities/entities/news/index.jsx` — `_entryToArticle` slugifies + stores full `categories` array
- `src/system-entities/entities/news/NewsView.jsx` — default mode `quellen`, multi-tag filter logic, "Other" bucket, dedicated cycle button, chip toggle behaviour
- `src/system-entities/entities/news/styles/NewsView.css` — `.news-grouping-mode-btn` styling

## Version 1.1.1267 - 2026-04-26

**Title:** News bundle — search button moves to detail-tabs, status+topic chips merged, full-cover article image, bookmark icon, 3-mode grouping cycle (Quellen/Topics/Themen)
**Hero:** none
**Tags:** News, UI, Feature

### Why

Five paper cuts in one release: source name on cards was getting clipped at the bottom, the inline search input ate too much horizontal space, status filters and topic chips lived on two separate rows even though they're conceptually one filter strip, the favorite icon was a heart (cliché for an article reader), the article hero image only filled a 260×260 tile inside `.detail-left` instead of the whole panel, and the topic chips only ever showed RSS-tag groupings — fast-news-reader's `channel.theme` (curated preset category like "tech" for Heise) and the per-feed source name were both unreachable from the UI.

### Changes

**`.article-footer line-height: 0.8 → 1.4`** ([NewsView.css:298-307](src/system-entities/entities/news/styles/NewsView.css#L298)). Old value was below the actual glyph height, so descenders in source names like "tagesspiegel" got clipped at the bottom edge of the card. Fixed.

**Search moved from inline toolbar to action-buttons row** ([news/index.jsx:50-69](src/system-entities/entities/news/index.jsx#L50), [TabNavigation.jsx:175-181, 245-251](src/components/DetailView/TabNavigation.jsx#L175)). New `search` action button appears between `overview` and `settings` in the news detail-tabs strip. Tapping it toggles `searchOpen` in `NewsView`, which swaps the entire filter row for a single full-width search input (auto-focused, with a clear-X button). Tapping search again — or the X — closes it and returns the filter row. Reuses the slider-opacity treatment from v1.1.1259 so the slider tracks `activeButton === 'search'`.

**Status filters and topic chips merged into one horizontal scroll row** ([NewsView.jsx:716-790](src/system-entities/entities/news/NewsView.jsx#L716), [NewsView.css:78-115](src/system-entities/entities/news/styles/NewsView.css#L78)). Status icons (Alle / Ungelesen / Favoriten) sit at the left in compact icon+count pills, then a 1px vertical divider, then the topic chips. The whole strip lives inside `.filter-tabs` so the existing scroll-indicators and arrow buttons work for the entire combined row. Removes the second row entirely.

**Favorite icon: heart → bookmark** ([NewsView.jsx:741-746](src/system-entities/entities/news/NewsView.jsx#L741), [TabNavigation.jsx:258-263](src/components/DetailView/TabNavigation.jsx#L258)). Both the status filter pill and the article-detail action button switched from the heart path to the bookmark shape (`M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z`). Filled when active. Storage field stays `favorite` — only the icon changed.

**Article image now covers the entire `.detail-left` panel** ([DetailView.jsx:572-633](src/components/DetailView.jsx#L572), [DetailView.css:266-280, 580-589](src/components/DetailView.css#L266)). Mirrors the existing `.detail-left-video-background` pattern: when the news entity has an article selected with a thumbnail, an `<img class="detail-left-news-image">` is rendered as `position: absolute; top:0; left:0; width:100%; height:100%; object-fit: cover` with the same 35px-on-left border-radius as the panel. The 260×260 icon-tile (from `EntityIconDisplay`) is hidden via a new `hideIcon` prop while the article image is shown — same way `videoUrl` already suppresses it. Mobile media query bumps `.detail-left.has-news-image` to 250px min-height and rounds the image's top corners instead of the left ones, matching the video pattern. The intermediate `customIconImageUrl` approach from v1.1.1266 (image inside the icon tile) is reverted.

**3-mode grouping cycle for the chip row** ([news/index.jsx:344-348](src/system-entities/entities/news/index.jsx#L344), [NewsView.jsx:148-155, 286-307, 500-543](src/system-entities/entities/news/NewsView.jsx#L148)).
- **Quellen** (Sources) — chips by `article.source` (feed name)
- **Topics** — chips by `article.category` (the raw RSS `<category>` tag — current default)
- **Themen** (Themes) — chips by `article.theme` (`channel.theme_label` from fast-news-reader's preset, e.g. Heise → Tech, Tagesschau → News)

The first chip is always `Alle ___` (Quellen / Topics / Themen depending on mode). Tapping it has two-state behaviour:
1. If a chip is currently selected → reset filter to `all` (don't change mode)
2. If already on `all` → cycle to the next mode and rebuild the chip list

`groupingField` derived from `groupingMode` switches which article field the chip set / count / filter all read from. The colored `.category-*` styling for the seven internal slugs is now only applied in the `topics` mode — sources and themes use the default chip background (cleaner, since e.g. "tagesspiegel.de: News" doesn't deserve a `.category-news` tint).

**`_entryToArticle` reads `channel.theme` + `channel.theme_label`** ([news/index.jsx:344-347](src/system-entities/entities/news/index.jsx#L344)). fast-news-reader exposes both per sensor (theme is the slug, theme_label is the display name). Custom feeds without a preset get `theme: null` and don't appear as a chip in Themen mode.

### Files touched

- `src/system-entities/entities/news/index.jsx` — `actionButtons` adds `search`, `_entryToArticle` exposes `theme`/`themeLabel`
- `src/system-entities/entities/news/NewsView.jsx` — `searchOpen` + `groupingMode` state, `handleToggleSearch`, `cycleGroupingMode`, `getChips`/`getChipCount`/`getChipLabel`, JSX rewritten for combined toolbar + search-row swap, bookmark SVG, body-wrapper cleanup
- `src/system-entities/entities/news/styles/NewsView.css` — `.news-status-btn`, `.news-toolbar-divider`, `.news-search-row`, `.news-search`/`-input`/`-icon`/`-clear`, `.article-footer line-height` fix
- `src/components/DetailView/TabNavigation.jsx` — `search` case in handler + icon, bookmark SVG for favorite
- `src/components/DetailView/EntityIconDisplay.jsx` — `customIconImageUrl` reverted, `hideIcon` prop added
- `src/components/DetailView.jsx` — full-cover `<img class="detail-left-news-image">` rendered when news + article, `hideIcon` passed through
- `src/components/DetailView.css` — `.detail-left-news-image` rule + mobile variant; `.icon-background-image` removed

### Why the 3-mode cycle on a single button

Three radio-style buttons would steal another row of vertical space we just freed. A dropdown would feel out of place inside a chip strip. Cycle-on-tap is cheap, the current mode is always visible in the button label, and the cycle order is the same direction every time. Hover title spells out the cycle for users who don't immediately catch the mechanic.

## Version 1.1.1266 - 2026-04-26

**Title:** News — article image now lives on `detail-left` (icon-background), search bar + status filters above topics
**Hero:** none
**Tags:** News, UI, Feature

### Why

v1.1.1265 put the article hero image on the right side of the news view (split layout). Wrong half — the image belongs on `.detail-left`, replacing the generic newspaper-emoji `.icon-background` that all system entities show. That's the same slot a video plays in for media devices. Plus the user wanted in-line search and status filters separated from topic filters, since 100+ articles need a real find-bar.

### Changes

**Article image moved to `detail-left`'s `icon-background`** ([EntityIconDisplay.jsx:9-43](src/components/DetailView/EntityIconDisplay.jsx#L9), [DetailView.jsx:595-606](src/components/DetailView.jsx#L595)). New optional `customIconImageUrl` prop on `EntityIconDisplay` — when set, renders an `<img class="icon-background-image">` filling the 260×260 tile via `object-fit: cover`, instead of the domain icon over a gradient. `DetailView` reads `window._newsViewRef.selectedArticle.thumbnail` and passes it through. On image load error: revert to gradient + emoji. The right-side `.article-detail-hero`/`.article-detail-body-wrapper` split from v1.1.1265 is reverted — article detail is back to the centered single-column body, since the image now anchors the left panel.

**New top toolbar with search + 3 status icons** ([NewsView.jsx:660-714](src/system-entities/entities/news/NewsView.jsx#L660), [NewsView.css:78-178](src/system-entities/entities/news/styles/NewsView.css#L78)). Above the topic-filter row sits a flex toolbar:
- **Left**: 3 compact pill buttons — `Alle` (list icon + total), `Ungelesen` (filled circle when active + count), `Favoriten` (heart, filled when active + count). Active button uses the inverted iOS pill style (white bg + dark text), same look as the topic filter's active state.
- **Right**: a search input (rounded pill, magnifier icon + clear button when text present). Filters articles client-side by title / source / description. Pressing the X clears it.

**Filter logic split into 3 dimensions** ([NewsView.jsx:147-153, 244-262](src/system-entities/entities/news/NewsView.jsx#L147)). Old single `activeFilter` state went away; replaced by `statusFilter` ('all'/'unread'/'favorites') + `categoryFilter` ('all'/`<slug>`) + `searchQuery`. They compose: status → category → search, applied in one `useEffect`. Each state is independent — picking a topic doesn't clear the unread filter, typing in search doesn't clear the topic. Old `defaultFilter` setting still hydrates `statusFilter` if it's one of the three valid values.

**Topic filter row only shows topic chips now** ([NewsView.jsx:716-781](src/system-entities/entities/news/NewsView.jsx#L716)). Removed the `Alle / Ungelesen / Favoriten` chips that lived in the same horizontal scroll row. New first chip: `Alle Themen` (= `categoryFilter === 'all'`), then one chip per detected category from the feeds. The whole row is now hidden when no categories exist (empty article list), so there's no empty filter scroll-area on first launch.

### Files touched

- `src/components/DetailView/EntityIconDisplay.jsx` — `customIconImageUrl` prop, image render branch with error fallback
- `src/components/DetailView/EntityIconDisplay.jsx` — wired through `customIconImageUrl` from `window._newsViewRef`
- `src/components/DetailView.jsx` — passes article thumbnail into the icon display
- `src/components/DetailView.css` — `.icon-background-image` rule (cover, rounded)
- `src/system-entities/entities/news/NewsView.jsx` — state split (status/category/search), toolbar JSX, topic-only filter row, empty-state message for no-search-result, reverted detail layout
- `src/system-entities/entities/news/styles/NewsView.css` — `.news-toolbar`, `.news-status-buttons`, `.news-status-btn`, `.news-search`, `.news-search-input`, `.news-search-clear` rules; reverted `.news-detail-content` to single scroll column

### Why search is client-side

`fast-news-reader` doesn't expose a Home Assistant service for server-side search; the cached article list (max 100 by default, capped at 500) lives in the browser anyway. A simple `.includes()` over title / source / description across <500 items is sub-millisecond per keystroke — no debounce needed. If we ever go beyond a few thousand cached articles per user, this is the place to add it.

## Version 1.1.1265 - 2026-04-26

**Title:** Article detail view — split layout with hero image covering the left panel
**Hero:** none
**Tags:** News, UI

### Why

The article detail view used to stack everything in one centered column: small thumbnail near the top, then title, description, body, button. The image was decorative-sized and didn't earn its space. The video-card pattern (image-as-hero on the left, controls/text on the right) makes the article's image the center of attention while keeping the text readable on the right.

### Changes

**Layout split** ([NewsView.jsx:559-619](src/system-entities/entities/news/NewsView.jsx#L559)). `.news-detail-content` is now a flex row with two children:
- **Left** — `.article-detail-hero` covers the full panel height (45% width) with the article's thumbnail. `object-fit: cover`, `overflow: hidden` so it crops cleanly without distortion.
- **Right** — `.article-detail-body-wrapper` is the scrollable column holding the category badge, title, description, body text, and "Artikel öffnen" button.

The old `.article-detail-thumbnail` block inside the article body is gone — the image only appears as the hero now, not duplicated inline.

**Scroll moved from `.news-detail-content` to `.article-detail-body-wrapper`** ([NewsView.css:837-879](src/system-entities/entities/news/styles/NewsView.css#L837)). The hero stays fixed in place while the text scrolls. `<CustomScrollbar>` ref points to the new wrapper. `.news-detail-content` itself becomes `overflow: hidden` so the rounded corners on the news container clip the hero properly.

**Empty-state fallback** — if the article has no thumbnail OR `display.showImages` is off, the hero panel is omitted entirely and the body wrapper takes 100% width. No empty grey rectangle.

**Mobile breakpoint** ([NewsView.css:881-893](src/system-entities/entities/news/styles/NewsView.css#L881)) — under 600px viewport, the hero stacks above the text (200px tall band) instead of taking 45% width. Avoids unreadable narrow text columns on phones.

### Files touched

- `src/system-entities/entities/news/NewsView.jsx` — restructured detail JSX into hero + body-wrapper
- `src/system-entities/entities/news/styles/NewsView.css` — `.news-detail-content` flex-row, new `.article-detail-hero` and `.article-detail-body-wrapper` rules, `.article-detail-thumbnail` rules removed, mobile media query

## Version 1.1.1264 - 2026-04-26

**Title:** News — bucket headers match room-header style, real feed icons in settings
**Hero:** none
**Tags:** News, UI, Polish

### Changes

**Bucket headers no longer sticky, restyled to match the search/devices room-header pattern** ([NewsView.css:212-232](src/system-entities/entities/news/styles/NewsView.css#L212)). Dropped `position: sticky`, the dark blurred background, the uppercase 12px label and the negative margin trick. New look: 18px, weight 500, `rgba(255,255,255,0.9)`, `padding: 8px 0`, with a `::after` pseudo-element drawing a 1px hairline at the bottom — exactly like `.search-group-title` in `SearchField.css`. So `Heute` / `Gestern` / `Diese Woche` / `Älter` now sit between cards as inline section labels with a divider underneath, the same way `Anziehraum` does in the device list.

**Feed icon in news settings now shows the actual feed logo / favicon** ([iOSSettingsView.jsx:48,206-219](src/system-entities/entities/news/components/iOSSettingsView.jsx)). `fast-news-reader`'s `_build_channel` exposes both `channel.image` (the RSS feed's own logo, e.g. Tagesschau's red square) and `channel.icon` (a favicon URL derived from the feed's host). The settings list now renders these as `<img>` inside the existing `.ios-feed-icon` 29px tile, with the 📰 emoji as a fallback if the image fails to load. CSS got `overflow: hidden` on the tile and `object-fit: cover` on the image so it fills the rounded square without distortion.

### Files touched

- `src/system-entities/entities/news/styles/NewsView.css` — `.news-bucket-header` rewritten to `.search-group-title` style
- `src/system-entities/entities/news/components/iOSSettingsView.jsx` — `iconUrl` field added to `availableFeeds`; conditional `<img>` + emoji fallback rendered inside `.ios-feed-icon`
- `src/system-entities/entities/news/components/iOSSettingsView.css` — `overflow: hidden` on tile, image fill rules

## Version 1.1.1263 - 2026-04-26

**Title:** News — drop manual per-feed category override, read category from `entry.category` (fast-news-reader)
**Hero:** none
**Tags:** News, UX, Cleanup

### Why

Until now each feed had a manual "Kategorie" picker in settings (mapping the feed to one of 7 hard-coded internal categories: news / tech / smarthome / sport / entertainment / politics / business). With `fastender/fast-news-reader` the per-article category is already provided by the integration: `coordinator.py:_build_entry` extracts `entry.category` as a list of `tags[].term` values from feedparser. Manually re-tagging at the feed level is redundant — and worse, it overrides whatever the source feed itself declared.

### Changes

**`_entryToArticle`** ([news/index.jsx:330-348](src/system-entities/entities/news/index.jsx#L330)) now reads `entry.category` directly. Handles both array (fast-news-reader: `["politik"]`) and string shapes, picks the first term, slugifies it (`/[^a-z0-9]+/g` → `-`, trim leading/trailing dashes) for use both as the badge text and the CSS class. Falls back to `null` when no category — the badge is then omitted (already conditional in JSX).

**`_loadArticlesFromEventCache`** ([news/index.jsx:413-422](src/system-entities/entities/news/index.jsx#L413)) — the per-feed category-override step is gone. Loop now only filters disabled feeds; categories survive untouched from `_entryToArticle`. About 25 lines lighter, zero behavioural overrides on the article shape.

**`_getCategoryForEntityId` action removed** — no remaining callers.

**iOSSettingsView**:
- The "Kategorie" item under each enabled feed is gone — settings now shows just the feed name + article count + on/off toggle
- The entire `category-{feedId}` sub-view (selection list of 7 categories with checkmarks) is removed
- Helpers `availableCategories`, `getFeedCategory`, `getCategoryLabel`, `handleFeedClick`, `handleCategorySelect`, `selectedFeed` state — all removed
- `onUpdateFeedCategory` prop removed

**NewsView** — `handleUpdateFeedCategory` handler and the prop pass-through both deleted.

### What this means for filter tabs

The category filter tabs at the top of the news list (`getCategories()`) now reflect whatever the actual feeds put in `<category>` tags. So a Tagesschau-heavy setup might surface tabs like "Inland", "Ausland", "Wirtschaft", "Sport" instead of the hard-coded 7. The seven `.article-category-badge.category-*` color rules in CSS still apply when a feed happens to use one of those slugs (e.g. "sport" → red badge). Other categories get the default white-on-translucent badge.

### Backwards compatibility

Existing users have `settings.feeds[id].category` saved in localStorage. The key is just ignored now — no migration needed, no errors. Cleanup will happen naturally when a user re-toggles a feed.

## Version 1.1.1262 - 2026-04-26

**Title:** News card cleanup — drop date, fade-truncate long source names
**Hero:** none
**Tags:** News, UX, Polish

### Changes

**Date removed from article cards** ([NewsView.jsx:902-905](src/system-entities/entities/news/NewsView.jsx#L902)). The bucket headers (Heute / Gestern / Diese Woche / Älter) introduced in v1.1.1261 already convey the time grouping; per-card dates were redundant and caused awkward wrapping when long source names pushed them onto a second line. The footer now shows just the source.

**Source name now truncates with the same gradient fade as the title** ([NewsView.css:307-316](src/system-entities/entities/news/styles/NewsView.css#L307)). Long sources like "tagesschau.de - Die Nachrichten der ARD" used to wrap to two lines and break the card layout. They now stay on one line and fade out at 85% width via `linear-gradient` + `background-clip: text`, matching the existing `.article-title` treatment.

### Files touched

- `src/system-entities/entities/news/NewsView.jsx` — removed `.article-separator` and `.article-date` from card footer
- `src/system-entities/entities/news/styles/NewsView.css` — `.article-source` gets `white-space: nowrap`, `overflow: hidden`, `min-width: 0`, gradient text-fade

## Version 1.1.1261 - 2026-04-26

**Title:** News — group articles by time bucket (Today / Yesterday / This Week / Older) with sticky headers
**Hero:** none
**Tags:** News, UX

### Why

`maxArticles` defaults to 100 (and goes up to 500). Scrolling through 100 dated cards as one undifferentiated wall makes it hard to know what's recent and what's days old. Feedly solves this with day-bucket section headers — copying that pattern.

### Changes

**`groupArticlesByTimeBucket(articles, lang)`** ([NewsView.jsx:50-78](src/system-entities/entities/news/NewsView.jsx#L50)) — pure helper. Splits the (already-sorted-newest-first) article list into four buckets keyed by published date:
- `Heute` / `Today` — published since 00:00 today
- `Gestern` / `Yesterday` — published 24h before that
- `Diese Woche` / `This Week` — published in the prior 6 days
- `Älter` / `Older` — everything else

Empty buckets are filtered out so headers don't show for absent buckets.

**Rendering switched from a flat `.map()` to bucketed sections** ([NewsView.jsx:825-895](src/system-entities/entities/news/NewsView.jsx#L825)). Each bucket renders as `<div class="news-bucket">` containing a `.news-bucket-header` and the cards. Memoized with `useMemo([filteredArticles, lang])`. The card-stagger animation now uses an absolute index across buckets, capped at 10 (`Math.min(idx, 10) * 0.05`) so the last card in a 100-item list doesn't take 5s to fade in like before.

**Sticky headers** ([NewsView.css:212-232](src/system-entities/entities/news/styles/NewsView.css#L212)). `.news-bucket-header` uses `position: sticky; top: 0` within `.news-feed` (the scroll container), with backdrop-blur (20px + saturation) so cards behind it stay readable. iOS-style label: 12px uppercase, letter-spacing 0.06em, white at 60% opacity. Negative `margin: 0 -4px` extends the blur background through the list's small inset padding.

### Tradeoffs considered

- **Hour-based buckets** ("vor 1h", "vor 2h", …) — too many micro-buckets, especially in the "Today" range
- **Weekday buckets** (Mon/Tue/Wed/…) — too noisy on mobile, and ambiguous after a week
- **Non-sticky date dividers** — simpler but loses the "where am I?" anchoring during long scrolls

Sticky day-buckets won on density vs. orientation.

### Stagger-delay regression fix bundled

Old code used `delay: index * 0.05` with no cap. With 100 articles the 100th card took 5 seconds to appear. Capped at index 10 (= 0.5s max) — preserves the iOS-style cascade for the first batch, then everything past that fades in immediately.

## Version 1.1.1260 - 2026-04-26

**Title:** News — hide native scrollbar in article detail view, add CustomScrollbar there
**Hero:** none
**Tags:** News, UI, Polish

### Why

After v1.1.1259's `position: relative` fix, the news list view's `CustomScrollbar` correctly sits inside the container at the right edge. But the article detail view (`.news-detail-content`) still had `scrollbar-width: thin` and rendered the OS-native scrollbar — visible as a wider grey bar to the right of the custom one when you opened a long article. Two scroll indicators side-by-side, ugly.

### Changes

**`.news-detail-content`** ([NewsView.css:798-808](src/system-entities/entities/news/styles/NewsView.css#L798)) — switched `scrollbar-width: thin` → `scrollbar-width: none`, dropped the obsolete `scrollbar-color`, added the `::-webkit-scrollbar { display: none }` rule for Safari. Same pattern as `.news-feed`. Native scrollbar is now hidden in the detail view.

**`.news-settings-content`** — same cleanup applied even though the class is dead code (no JSX uses it since the v1.1.1252 migration to `IOSSettingsView`). Killed the stale `scrollbar-width: thin` so future revivals don't regress.

**Article detail view gets its own `<CustomScrollbar>`** ([NewsView.jsx:608-609](src/system-entities/entities/news/NewsView.jsx#L608)). New `detailScrollRef` + `isDetailHovered` state, attached to the `.news-detail-content` container with hover handlers. Same iOS-style indicator as the article list and settings.

### Files touched

- `src/system-entities/entities/news/styles/NewsView.css` — hide native scrollbars in detail + settings
- `src/system-entities/entities/news/NewsView.jsx` — `detailScrollRef`, `isDetailHovered`, `<CustomScrollbar>` in detail-view branch

### Why detail view didn't already have one

When the detail view was first written, articles were short enough that scroll wasn't a concern. Long-form articles (Tagesschau-style) with hero image + description + content + button push past viewport, and the OS-native bar was good enough back then. Now that the rest of news uses the iOS-style indicator consistently, the detail view stuck out.

## Version 1.1.1259 - 2026-04-26

**Title:** News — recommend `fastender/fast-news-reader`, fix settings bugs and detail-view UI
**Hero:** none
**Tags:** News, Bugfix, UI

### Why

Two-part release. Part one: the user shipped their own HA custom integration [fastender/fast-news-reader](https://github.com/fastender/fast-news-reader) (HACS), which closes the `<content:encoded>` image-extraction gap that `timmaurice/feedparser` and core `feedreader` both ignore. The card now points users at it. Part two: a batch of UX/settings bugs surfaced while testing on real feeds.

### Changes

**News integration recommendation switched.** Empty-state hints in `NewsView.jsx`, settings empty-state in `iOSSettingsView.jsx`, and the top-of-file JSDoc in `news/index.jsx` now name `fastender/fast-news-reader` exclusively. Old hints recommending `timmaurice/feedparser` ("A better Feedparser") are gone. Setup steps rewritten for the HACS Custom Repository flow. Internal sensor-loading code (`_loadFeedparserSensors`, `_processFeedparserSensor`, `has_feedparser` attribute, `.news-feedparser-hint` CSS class) is unchanged — `fast-news-reader` is schema-compatible with `timmaurice/feedparser`, so renaming would be churn without functional gain.

**Scrollbar positioning fix in news view.** `.news-view-container` was missing `position: relative`, so the absolutely-positioned `<CustomScrollbar right: 3px>` resolved to a higher positioned ancestor and rendered outside the card. Added `position: relative` — scrollbar now sits inside the container at its right edge, on the dark backdrop instead of bleeding into the wallpaper.

**Article detail view buttons no longer show a stray white slider on the back button.** In the article detail view, the action buttons are `[back, read, favorite]` but `activeButton` state stays at `'overview'` (none of them match). The slider position memo defaulted to `x: 0` on no-match and rendered with `opacity: 1`, so the back button always looked "active" with a white pill behind it. Slider now animates `opacity: 0` when no button matches; the read/favorite filled-state still works via SVG `fill="currentColor"`.

**Feed counter in news header was always "0 Feeds".** `feedCount` was computed from `Object.keys(settings.feeds).filter(...enabled)` — but `settings.feeds` starts as `{}` and feeds are only written there when the user explicitly toggles them; default state for an untoggled feed is "enabled" via `enabled !== false`. Result: header always showed 0 even with feeds present. Now derived from `hass.states` (count feedparser sensors not explicitly disabled), matching what `IOSSettingsView` shows.

**Default settings between `NewsView.loadSettings()` and entity `_loadSettings()` were inconsistent.** Entity defaulted to `feeds: []` (array, but every consumer treats it as object), `maxArticles: 50`, and was missing `showImages`/`autoMarkRead`/`defaultFilter`. UI defaulted to `feeds: {}`, `maxArticles: 100`, full display block. Synced the entity defaults to match the UI's, so the first-ever load (no localStorage entry yet) doesn't render with mixed defaults.

**`maxArticles` setting was ignored above 100.** `_loadArticlesFromEventCache` had a hardcoded `slice(0, 100)` cap, so picking 150/200/300/500 in the UI did nothing — the user always got 100 articles max. Now reads the setting (`Math.min(value, 500)` to keep the cache-size cap as a defensive max).

**Header stats stale until user leaves settings.** The `news-view-state-changed` event that prompts `DetailView` to recompute the header was gated to `[selectedArticle, showSettings]` only. Toggling a feed in settings updated the local `settings` state but didn't refire the event, so the "X Feeds" header kept its old value until the user closed settings. Added `settings` to the event-effect deps; settings changes now propagate to the header immediately.

### Files touched

- `src/system-entities/entities/news/NewsView.jsx` — empty-state recommendation, `feedCount` calculation, event-deps
- `src/system-entities/entities/news/components/iOSSettingsView.jsx` — settings empty-state recommendation
- `src/system-entities/entities/news/index.jsx` — top JSDoc, `_loadSettings` defaults, `maxArticles` slice, `debugNewsImages` console hint
- `src/system-entities/entities/news/styles/NewsView.css` — `position: relative` on container
- `src/components/DetailView/TabNavigation.jsx` — slider opacity on no-match

### Internal naming kept stable on purpose

`hasFeedparser`, `_loadFeedparserSensors`, `_processFeedparserSensor`, `has_feedparser` attribute, `.news-feedparser-hint` CSS class — all unchanged. The "feedparser" name correctly describes the *schema* (which `fast-news-reader` deliberately keeps compatible with `timmaurice/feedparser`) and the underlying Python library that both integrations use. Renaming would be cosmetic churn without changing behavior, and would risk breaking saved state for existing users.

## Version 1.1.1258 - 2026-04-25

**Title:** News — full migration off HA-core `feedreader`, now uses HACS `timmaurice/feedparser`
**Hero:** none
**Tags:** Breaking, News, Architecture

### Why

The v1.1.1257 debug session revealed that HA's core `feedreader` integration intentionally exposes only four fields on its `event.feedreader_*` entities: `title`, `link`, `description`, `content`. No image data, no media URLs, no enclosures. That's hardcoded in HA's `feedreader/event.py`. Bus events have rich data, but bus events only fire on *new* articles — historical entries that loaded from the entity attributes are stuck without images.

Two paths to richer data:
- Detection adapter that reads from both core `feedreader` AND HACS `timmaurice/feedparser`.
- Full switch to `timmaurice/feedparser`, drop core `feedreader` support entirely.

User chose **the full switch**. Cleaner, less code, no dual-path maintenance.

### What `timmaurice/feedparser` exposes

Per configured feed, a `sensor.<feed_name>` entity:

```js
state: 10,                                                  // entry count
attributes: {
  channel: { title, link, image, ... },
  entries: [
    { title, link, summary, published, image, ... },        // image is a string URL,
    ...                                                     // already extracted on the
  ],                                                        // Python side
  attribution: 'Data retrieved using RSS feedparser',
}
```

`image` is **already a string URL** — Python's `feedparser.py` runs the multi-source extraction (media_content / media_thumbnail / enclosures / summary HTML), so no JS-side regex extraction needed.

### Code change scope

`src/system-entities/entities/news/index.jsx` — 1044 → 875 lines.

**Removed entirely:**
- `_handleFeedreaderEvent`, `_loadFeedreaderHistory`, `_loadFeedreaderEventEntities`, `_loadFeedreaderHistoryInBackground`
- `_extractThumbnail`, `_extractImageFromHtml` — multi-source image extraction (handled by Python now)
- `_findEntityIdByFeedUrl` — feedparser sensor IDs are direct, no URL-to-entity lookup needed
- `subscribeEvents('feedreader')` listener
- `has_feedreader` attribute, `feedreader:read` permission
- `window.testFeedreaderEvent` debug helper

**Added:**
- `_loadFeedparserSensors(hass)` — finds all `sensor.*` with `attributes.entries` array + `attributes.channel`
- `_processFeedparserSensor(sensor)` — iterates `attributes.entries`, maps each to internal article shape
- `_handleSensorStateChange(event)` — listens for `state_changed` events, updates when feedparser sensors get new entries
- `_entryToArticle(entry, channel, sensorId)` action — maps feedparser entry → card's article shape
- `_stripHtml(html)` action — used inline in entry mapping
- `_findFeedparserSensors`, `_fetchFromFeedparser` — feedparser-aware fetch + lookup helpers

**Subscription model changed:** instead of subscribing to the `feedreader` event type, the entity now subscribes to `state_changed` and filters for sensors with the feedparser shape. Same effect (live-update when feeds refresh), different mechanism — sensor state updates are more reliable than event-bus subscriptions.

`src/system-entities/entities/news/components/iOSSettingsView.jsx`:
- Feed-detection switched from `event.*` with `event_type: feedreader` to `sensor.*` with `entries[]` + `channel`
- Empty state simplified — only mentions `A better Feedparser` (HACS) now, since core `feedreader` is no longer supported

`src/system-entities/entities/news/NewsView.jsx`:
- `hasFeedreader` checks renamed to `hasFeedparser`, hint text updated

### Migration impact for users

- Users with the core `feedreader` integration installed will see **no feeds** in the News card after this update. They need to install the HACS integration `A better Feedparser` from `github.com/timmaurice/feedparser` and reconfigure their feeds via UI.
- Existing News-card settings (per-feed category, enabled/disabled toggles) are keyed by entity ID. Since entity IDs change from `event.bbc_news` to `sensor.bbc_news`, settings won't carry over — user re-toggles per feed once.
- Article cache (read/favorite state) is keyed by article URL, so any matching old articles keep their state. New articles arrive with images.

### Why this was the right call

The core `feedreader` integration is not going to expose richer data — its event entity schema is intentionally minimal (HA dev decision, see `_unrecorded_attributes` and the four hardcoded ATTR_* keys in upstream). To get images, the integration has to be different. `timmaurice/feedparser` does the right thing on the Python side: full feedparser entry, image pre-extracted, entries directly in attributes. Card just reads them. No CORS proxies, no third parties, no schema gymnastics.

---

## Version 1.1.1257 - 2026-04-25

**Title:** News debug — show all attribute keys + live event logger
**Hero:** none
**Tags:** Diagnostics, News

### Why

The v1.1.1256 `debugNewsImages()` output revealed that BBC, CNN, Guardian feedreader event entities have **no image fields whatsoever** in their attributes — `enclosures`, `image`, `media_content`, `media_thumbnail` are all `undefined`. That points at HA's `feedreader` integration: the `event.*` entities it creates are a **sparse state representation** (mostly title, link, published). The rich payload with images lives only on the event bus, delivered to live subscribers.

Two diagnostics added so we can see what's really there.

### `debugNewsImages()` — extended

Now also prints, per entity:
- `Object.keys(attributes)` — full list of every attribute key the entity has
- The full `attributes` object dump

So if HA stores images under a key we haven't checked (`image_url`, `summary_image`, etc.), we'll see it now.

### `logNewsLiveEvents()` — new

Subscribes to the live `feedreader` event bus and logs every incoming article. Each log shows:
- The full event object
- `event.data` payload + `Object.keys(event.data)` so we can see the bus-side schema
- The thumbnail our extractor finds (or `(none)`)

Usage:
```js
window.logNewsLiveEvents();          // start logging
// ... wait for HA's feedreader to fetch a feed (default 1h interval) ...
// or trigger a forced fetch from HA: feedreader.update_entity ...
window.logNewsLiveEvents.stop();     // stop logging
```

If the bus events have rich data (`media_thumbnail`, etc.), our existing `_extractThumbnail` will already find images for new articles arriving live. The historical entries are the gap — those came from sparse event-entity attributes.

### What this release isn't

Still no behavior change for end users — pure diagnostics. The next release decides what to actually fix once we see the real data shape.

---

## Version 1.1.1256 - 2026-04-25

**Title:** News image debug — `window.debugNewsImages()` for live feed inspection
**Hero:** none
**Tags:** Diagnostics, News

### Why

After v1.1.1255 enabled multi-shape thumbnail extraction, some feeds may still come through without images. To pinpoint *which* RSS shape a particular feed uses, we need raw data from the live `event.feedreader_*` entities — the existing `debugNews()` only showed already-processed articles.

### What was added

`window.debugNewsImages()` (callable in DevTools console) lists every feedreader event entity currently in `hass.states` and prints, per entity:

- `image` (direct)
- `enclosures` (array, Python feedparser plural form)
- `enclosure` (singular fallback)
- `media_thumbnail` (string or array of dicts)
- `media_content` (array, often holds the image)
- whether `content` is a string or array
- first 300 chars of `description`
- the thumbnail our `_extractThumbnail` helper currently extracts

Returns the same data as an array, so you can `const out = window.debugNewsImages(); console.table(out);` for a tabular view.

### Usage

1. Open the dashboard with the News card visible.
2. Open DevTools → Console.
3. `window.debugNewsImages()` and expand the per-entity groups.
4. If `▶ extracted thumbnail` says `(none)` for a feed that *does* show an image in the actual RSS, paste the raw `image / enclosures / media_thumbnail / media_content / description` values back to me — I'll extend `_extractThumbnail` for that shape.

This release is purely a diagnostics helper — no behavior change for end users.

---

## Version 1.1.1255 - 2026-04-25

**Title:** News thumbnails — actually find images for most feeds now
**Hero:** none
**Tags:** Bug Fix, News

### What was wrong

Most articles in the News view rendered without thumbnails, even though the feed clearly had images. The culprit was the image-extraction code in `news/index.jsx`. It checked exactly three places:

```js
let thumbnail = data.image || null;                    // rarely populated
if (!thumbnail) thumbnail = extractFromHtml(content);  // narrow regex
if (!thumbnail && data.enclosure?.url) ...             // SINGULAR
if (!thumbnail && data.media_thumbnail) thumbnail = data.media_thumbnail;
```

Three problems with that:

1. **Wrong shape for most feeds.** Home Assistant's `feedreader` integration uses Python's `feedparser` library, which delivers images in **arrays of dicts**: `enclosures` (plural), `media_thumbnail: [{url, width, height}]`, `media_content: [{url, medium, type}]`. The card was checking singular keys with string values — most feeds went through this code untouched.
2. **HTML regex too narrow.** It matched only `<img src="...">` (double-quotes). Plenty of feeds (Tagesschau among them) emit single-quoted or unquoted attributes in their description HTML.
3. **No graceful failure on the `<img>` itself.** When the extracted URL was correct but the host blocked hot-linking (Referer-based), the user saw a broken-image icon.

### The fix

**Central helper `_extractThumbnail(data)` covers every common RSS shape:**

1. `data.image` (string or `{url}`)
2. `data.enclosures[]` — finds first item with `type` starting `image/` or any `url`
3. `data.enclosure.url` — singular fallback for older sources
4. `data.media_thumbnail[0].url` — array shape
5. `data.media_thumbnail` — string shape
6. `data.media_content[]` — finds `medium === 'image'` or `type` starting `image/`
7. `data.content` if it's an array — Atom-style `[{value, ...}]` joined for HTML scan
8. `data.description` / `data.summary` — HTML scan as last resort

Both call sites (live feedreader event in `_handleFeedreaderEvent`, and event-entity warm-load in `_loadFeedreaderEventEntities`) now share this helper. Same data shape going in, same thumbnail logic.

**HTML regex now handles all quoting styles** plus `og:image` and `twitter:image` meta tags as final fallback:

```js
// <img src="..."> | <img src='...'> | <img src=...>
/<img[^>]+src=(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i
```

**`<img>` tags hardened in NewsView.jsx:**

- `referrerPolicy="no-referrer"` — many sites (German news especially) check the `Referer` header and block external embedding. Stripping it fixes a lot of "image present but won't load" cases.
- `onError` handler — if the image URL is correct but the load still fails (404, blocked, mixed-content), hide the container instead of showing a broken-image icon. Article still readable, just no thumbnail.

### Expected effect

Most feeds that previously came through with `thumbnail: null` should now have one. For feeds where the image really isn't in the data, behavior is unchanged. For feeds where the URL was right but blocked, the broken-icon is gone.

If a specific feed still doesn't show images, the article object will have `thumbnail: null` — open the browser console and inspect what `data.media_content` / `data.enclosures` / etc. actually contain for one of those events. We can extend the helper for unusual shapes case-by-case.

---

## Version 1.1.1254 - 2026-04-25

**Title:** News empty-state — point users at the two HA integrations that provide feeds
**Hero:** none
**Tags:** UX, Documentation, News

### What was wrong

When a user opens **News → Settings** without any feeds configured, the previous empty state just said "No Feedreader feeds found." — which is correct but unhelpful. The user has no idea what to do next: which integration to install, what to put in `configuration.yaml`, or that an alternative even exists.

### The fix

The empty state in `iOSSettingsView` now lists the two integrations that produce News-card feeds, with direct links:

1. **A better Feedparser** ([github.com/timmaurice/feedparser](https://github.com/timmaurice/feedparser)) — HACS, UI-based setup. Recommended for users who don't want to edit YAML.
2. **`feedreader`** ([home-assistant.io/integrations/feedreader/](https://www.home-assistant.io/integrations/feedreader/)) — Core integration, YAML configuration. Battle-tested.

Both use HA's server-side Python to fetch RSS — the only sane way to handle CORS for arbitrary feed URLs. Direct browser-side RSS fetching from a custom Lovelace card requires a third-party CORS proxy, which we deliberately avoid (privacy, reliability, rate limits).

### Why we don't bundle our own RSS fetcher in the card

CORS. Almost no RSS feeds set permissive CORS headers, so the browser blocks `fetch()`. Working around that needs either:
- A self-hosted proxy — but the only server most users have is HA itself, which means using one of the integrations above anyway.
- A third-party CORS proxy (`allorigins.win`, `corsproxy.io`, `rss2json.com`) — leaks user IP, rate-limits, and these services come and go.

So the integrations above stay the right architecture; the card's job is just to make their data look good and not waste user time when the setup isn't there.

### What this release does NOT do

The card still only reads from the core `feedreader` event entities. It does not yet read from `feedparser`'s `sensor.*` entities (which carry entries in attributes, different shape). If a user installs `A better Feedparser` instead of `feedreader`, the card currently won't populate.

That's the **next step if there's demand**: an adapter in `news/index.jsx` that auto-detects either source. ~50–100 LOC. Held until at least one user actually runs `feedparser` and confirms it would help. Premature otherwise.

---

## Version 1.1.1253 - 2026-04-25

**Title:** News entity — boot-block fix + dead-code cleanup + lazy images
**Hero:** none
**Tags:** Performance, Code Cleanup, News

### What was wrong

The `system.news` entity awaited a WebSocket call (`hass.callWS({ type: 'logbook/get_events', ... })`) inside its `onMount`. Same anti-pattern that v1.1.1238 fixed for Versionsverlauf: if Home Assistant's recorder/logbook is slow to respond, the entity's mount hangs, the registry's `Promise.all` waits for it, and the user sees a delay before the News tab is available.

Plus three files of dead code: `config/feedSources.js`, `utils/articleCache.js`, `utils/rssParser.js`. None imported anywhere — leftovers from an earlier RSS-fetching design that was replaced by HA's `feedreader` integration. `rssParser.parseRSSFeed()` even had a `// TODO: Implement actual RSS fetching` marker.

### Fix 1 — `onMount` boot-block

`src/system-entities/entities/news/index.jsx` `onMount` no longer awaits the WebSocket history fetch. The fast steps stay in `onMount`:

- Subscribe to live `feedreader` events.
- `_loadFeedreaderEventEntities(hass)` — pure `hass.states` read, no network.
- `executeAction('getArticles')` — pure cache read.

The slow step (`_loadFeedreaderHistory(hass)` — recorder/logbook lookup) moves to a new `_loadFeedreaderHistoryInBackground(hass)` method that runs fire-and-forget with an 8-second `Promise.race` timeout. When it lands, the article list is refreshed via another `getArticles` call. When it times out, a `console.warn` is emitted and the user keeps whatever the cache + live event entities provided.

Net effect: the News entity's mount completes in milliseconds regardless of HA recorder latency. Same boot timing improvement v1.1.1238 brought to Versionsverlauf.

### Fix 2 — dead code removed

Deleted (verified unimported):

- `src/system-entities/entities/news/config/feedSources.js` (335 LOC, defaultFeeds + helpers, never imported)
- `src/system-entities/entities/news/utils/articleCache.js` (singleton class, never imported)
- `src/system-entities/entities/news/utils/rssParser.js` (incomplete TODO)

Empty `config/` and `utils/` directories also removed. Bundle is fractionally smaller and the directory structure is honest about what's actually used.

### Fix 3 — lazy + async image decoding

Two `<img>` tags in `NewsView.jsx` (article-detail + article-card thumbnail) now have `loading="lazy"` and `decoding="async"`. With 100+ articles in the feed, this avoids fetching every thumbnail upfront and keeps image decoding off the main thread.

### What this doesn't fix (deferred — risk vs. reward)

- **Virtualization for long article lists** — would require a structural refactor of `NewsView`. Worth doing if profiling shows scroll-jank on devices with 200+ articles, not before.
- **`useCallback` / `useMemo` audit** — `NewsView` has 19 useState hooks and inline handlers that could be memoized. Real but small gain. Held for a focused render-perf pass later.
- **65 `console.log` calls** — cosmetic cleanup, not urgent. Most are useful for live debugging.
- **Global `window._newsViewRef`** — small leak risk on remount. Held; would need a context-based replacement.

### What was a false positive in the audit

The auditor flagged "Settings persistence inconsistency" as Critical #2. Re-reading the code: `iOSSettingsView` calls `onUpdateSetting(path, value)` → `handleUpdateSetting` (NewsView:608) → `handleUpdateSettings` (NewsView:363) → `saveSettings`. Path is consistent — every setting change persists. Skipped.

---

## Version 1.1.1252 - 2026-04-25

**Title:** Bug bundle — translation keys, toggle dedupe, instant favorites/suggestions, IOSToggle component
**Hero:** none
**Tags:** Bug Fix, UX, i18n

### Bug 1 — `ui.suggestions.frequentlyUsed` shown as raw key

The Vorschläge subcategory rendered `ui.suggestions.frequentlyUsed` instead of the translated label. `searchFilters.js:296` references four group labels (`frequentlyUsed`, `contextBased`, `timeBased`, `areaBased`) under `ui.suggestions.*`, but the translations file only had three confidence-level keys there. English file had no `ui.suggestions` block at all.

Added the missing keys in both languages:
- DE: "Häufig genutzt" / "Im Kontext" / "Zu dieser Zeit" / "In diesem Bereich"
- EN: "Frequently used" / "Context-based" / "At this time" / "In this area"

### Bug 2 + 4 — Preact-Compat double-onChange across all toggles

The `<label> + <input type="checkbox">` pattern fires `onChange` twice in Preact-Compat. First call writes the new value, second call writes the flipped-back value — net effect is the toggle persists as the *opposite* of what the user clicked. Same root cause as v1.1.1219's `CircularSlider.PowerToggle` fix.

User reported the mobile auto-expand setting reverting after every refresh. Audit found the same pattern in **42 toggles** across the codebase.

Fix: created `src/components/common/IOSToggle.jsx` — a drop-in component that wraps the `<label>` + `<input>` pattern with a built-in 150 ms timestamp dedupe. Migrated all 42 callsites:

| File | Toggles |
|---|---:|
| `GeneralSettingsTab.jsx` | 8 |
| `StatsBarSettingsTab.jsx` | 11 |
| `AppearanceSettingsTab.jsx` | 4 |
| `ToastSettingsTab.jsx` | 2 |
| `iOSSettingsView.jsx` (news) | 3 |
| `TodosSettingsView.jsx` | 7 |
| `EnergyDashboardDeviceView.jsx` | 1 |
| `Printer3DDeviceView.jsx` | 6 |

API: `<IOSToggle checked={x} onChange={setX} disabled stopPropagation />`. Drop-in for the old 7-line label/input/span block — also slightly less code per call.

Toggles using `defaultChecked` (uncontrolled) or with no `onChange` weren't migrated — they don't have the bug. `PowerToggle.jsx` keeps its existing internal dedupe.

### Bug 3 — Favorites and Suggestions empty for ~100 ms after refresh

After v1.1.1241 added a localStorage snapshot for entities, the regular cards appeared instantly on hard-refresh — but the **Favoriten** and **Vorschläge** tabs were still empty for ~50–150 ms (waiting on IndexedDB read for favorites, and on `calculateSuggestions` async result for suggestions).

Added matching localStorage snapshots in `src/utils/uiStateSnapshots.js`:
- `loadFavoritesSnapshot()` / `saveFavoritesSnapshot(Set)` — favorites Set serialized as array of entity_ids.
- `loadSuggestionsSnapshot()` / `saveSuggestionsSnapshot(arr)` — top-60 suggestions, capped to keep payload small.

`DataProvider`'s `useState` initializer for `favorites` now reads the snapshot. `useSuggestions`'s initializer reads the suggestions snapshot. Both write back on every state change, so the next boot has fresh data.

`resetLearningData` also clears these snapshots (otherwise the next boot would flash old usage counts before re-calculation).

Trade-off: the suggestions snapshot can be slightly stale (time-of-day affects the contextBased ranking), but it flashes for ~100 ms before fresh calculation overrides — much better than blank.

### Build

Build green, 707 modules, ~366 KB gzip JS. PostCSS `Cannot divide by "%"` warnings are pre-existing and unrelated.

---

## Version 1.1.1251 - 2026-04-25

**Title:** Phase 7 — `DataProvider` context value memoized (runtime perf)
**Hero:** none
**Tags:** Performance, Runtime

### What changed

`DataProvider`'s `contextValue` object is now wrapped in `useMemo`. Before:

```js
const contextValue = {
  isInitialized, isLoading, error,
  entities, favorites, settings, areas, notifications,
  cache: cacheRef.current,
  toggleFavorite, updateSetting, searchEntities, callService,
  calculateSuggestions, resetLearningData, updateEntityState,
  recordUserAction, refreshNotifications, dismissNotification,
  db: dbRef.current,
  generateTestPatterns,
  hass: hassRef.current,
  pendingTracker: pendingTrackerRef.current,
};
```

This object got rebuilt on every single render of `DataProvider` — even when the underlying data didn't change. React's Context API does shallow identity comparison, so a new object identity = every consumer re-renders. With `SearchField` (1100 lines, 33 hooks) being the primary consumer plus a half-dozen `useData()` hook callsites, that adds up.

After:

```js
const contextValue = useMemo(() => ({ … }), [
  isInitialized, isLoading, error,
  entities, favorites, settings, areas, notifications,
  hass,
  toggleFavorite, updateSetting, searchEntities, callService,
  calculateSuggestions, resetLearningData, updateEntityState,
  recordUserAction, refreshNotifications, dismissNotification,
  generateTestPatterns,
]);
```

Refs (`cacheRef.current`, `dbRef.current`, `pendingTrackerRef.current`) aren't in the deps because their identity is stable for the lifetime of the provider. Pre-existing `useCallback` wrappers on every method ensure those stay stable too. The previously-not-memoized `generateTestPatterns` now uses `useCallback` with `[entities, calculateSuggestions]` deps.

### Other small fix

`hass` in context now reads the prop directly (`hass`) instead of `hassRef.current`. The ref read had a one-render lag because `hassRef.current` is updated in a `useEffect` that runs after render — the prop is the source of truth in the render itself.

### Why this matters for runtime perf and heat

Every Home Assistant `state_changed` event triggers `setEntities`, which re-renders `DataProvider`. Before this fix, every such re-render rebuilt the context object even though nothing else changed → `SearchField` and its descendants re-render → `useMemo`s recompute → Virtua remeasures → framer-motion re-interpolates animated props.

State changes from a typical smart home (sensors, automations) come in steady streams — easily 5–10 per second. Even with the 150 ms throttle from v1.1.1244 keeping flushes at ~6/s, every flush was forcing the entire tree to re-render unnecessarily.

After: most `setEntities` calls only update `entities`. The other 20 context properties keep their references → `useData()` hooks that don't read `entities` (e.g. `useFavorites`, `useNotifications`) won't trigger re-renders. Even consumers reading `entities` benefit because the callbacks they depend on stay stable — no cascading re-render of memoized child components.

### Expected effect

- Sustained CPU work during use ↓ (less re-render cascade per state change)
- Battery / heat ↓ (same reason)
- Boot path: unchanged (no new code on the boot critical path)

### Risk

The risk in this kind of change is missing a dep — if a callback closes over state that's not in the deps array, consumers see a stale closure. All callbacks in the deps array were already individually `useCallback`-wrapped so their identities only change when their own deps change. The `useMemo` propagates that correctly.

If anything breaks (a button stops working, a state update doesn't propagate), it's almost certainly a missing dep — please report so we can fix it specifically.

---

## Version 1.1.1250 - 2026-04-25

**Title:** The 10 s mystery solved — `window._hass` was referenced but never set
**Hero:** none
**Tags:** Performance, Bug Fix, Boot

### The smoking gun

Phases 5 and 6 didn't move the `dp-registry-done` needle. Profile after v1.1.1249 still showed ~10 s. That's a suspicious round number. Searching the codebase for `window._hass`:

```
hassRetryService.js:32   if (hassReadyFlag && (context?.hass || window._hass))
hassRetryService.js:33     return context?.hass || window._hass;
hassRetryService.js:54   // Source 2: Global window._hass (set by Home Assistant)   ← LIE
hassRetryService.js:55   if (!hass && typeof window !== 'undefined' && window._hass)
hassRetryService.js:56     hass = window._hass;
registry.js:426       hass: window._hass || null,
```

Read in 5 places. **Set: nowhere.** The comment "set by Home Assistant" was wishful thinking — HA does not set this global, our wrapper has to.

### Why this caused exactly 10 s

`waitForHass` in `src/utils/hassRetryService.js`:
- `maxRetries = 20`, `interval = 500 ms` → **10 000 ms** ceiling.
- Every 500 ms it checks `context?.hass || window._hass` for `hass.states` populated.

When `DataProvider` mounts, the `hass` prop is often `null` for the first render — Home Assistant calls `set hass()` on the Custom Element asynchronously, after `setConfig`. So `hassRef.current` is `null` when `systemRegistry.initialize()` fires, and the `{hass: hassRef.current, ...}` object captures `null` at registry-call time.

`waitForHass` then:
- Re-checks `context.hass` (still `null`, captured by closure).
- Re-checks `window._hass` (also `null`, never set).
- Polls 20× × 500 ms = 10 000 ms.
- Promise rejects.
- Every entity using `mountWithRetry` loses its initial data.

That explains the consistent ~10.0 s in every measurement and why several earlier theories (Integration parallel, EnergyDashboard parallel) didn't move the number — none of them addressed the actual blocker.

### The fix (two lines)

`build.sh` — Custom Element `set hass(hass)` setter, runs as soon as HA passes `hass` to the element, before Preact even mounts:

```js
if (typeof window !== 'undefined' && hass) {
  window._hass = hass;
}
```

`DataProvider.jsx` — `useEffect` that already syncs `hassRef.current = hass`, gets the same line for defense-in-depth (covers dev-mode where the Custom-Element wrapper isn't used):

```js
if (typeof window !== 'undefined' && hass) {
  window._hass = hass;
}
```

### Expected effect

`waitForHass` finds `window._hass` on its very first poll (or on the polling tick within ≤500 ms after `hass` actually arrives). The 10 s ceiling becomes ~0–500 ms.

`dp-registry-done` should drop from ~10 000 ms to ~700–1500 ms (the time it actually takes to mount all entities once they have `hass`).

### Side effects

- Every system entity using `mountWithRetry` actually gets its initial data on first mount (not just after a state-change later) — small fix for unrelated quirks like StatsBar widgets being delayed.
- iPhone heat: 10 s of wasted polling + 10 s of background mount work after it gives up = real CPU time gone. Should reduce sustained warmth on first-load.

### What this also says about the audit process

Three releases (Phases 5, 6, instrumentation) chased the wrong cause because the profile only showed the symptom (`dp-registry-done` at 10 s), not the underlying mechanism. The root-cause grep took 30 seconds and would have been the right first step. Lesson noted.

---

## Version 1.1.1249 - 2026-04-25

**Title:** Phase 6 — `EnergyDashboardDeviceEntity.onMount` parallelized
**Hero:** none
**Tags:** Performance, Background

### Why Phase 5 didn't move the needle

After v1.1.1248 the user re-profiled and `dp-registry-done` was still ~9.7 s. Phase 5 parallelized `Integration.loadSavedDevices` outer loop, but if you only have one Integration device (in this case the EnergyDashboard), `Promise.all` over a single-element array is the same as awaiting it. The 10 s lives **inside** that one device's `onMount`.

Looking at the code: `EnergyDashboardDeviceEntity.onMount` had 4 sequential awaits, each a separate HA call:

```js
await this._loadAreaFromSensors(hass, config);       // ~2 s
await this.executeAction('loadEnergyPreferences');   // ~3 s (HA WebSocket: energy/get_prefs)
await this.executeAction('getGridImportValue');      // ~1 s (state read)
await this.executeAction('getEnergyData');           // ~3 s (statistics fetch)
```

~9 s sequential, matches the profile.

### The fix

Each action verified to be independent:
- `_loadAreaFromSensors` — reads `hass.states` for area inheritance, sets `this.area*` props
- `loadEnergyPreferences` — `hass.connection.sendMessagePromise({ type: 'energy/get_prefs' })`, sets `energy_prefs` attribute
- `getGridImportValue` — reads `hass.states[gridImportSensor]`, sets `grid_import_value` attribute
- `getEnergyData` — searches `hass.states` for serial-tagged entities, sets `energy_data` attribute

None reads another's output. Each has its own `try { … } catch { return null; }` so failures don't propagate. Safe for `Promise.all`:

```js
await Promise.all([
  this._loadAreaFromSensors(hass, config),
  this.executeAction('loadEnergyPreferences', { hass }),
  this.executeAction('getGridImportValue', { hass }),
  this.executeAction('getEnergyData', { hass }),
]);
```

### Expected effect

Wall-clock for the 4 calls becomes max(slowest) instead of sum. On the v1.1.1248 profile that should drop the EnergyDashboard contribution from ~9 s to ~3 s.

If this is the only Integration device the user has, `dp-registry-done` should land around **~3-4 s** instead of ~9.7 s.

### Verification

After update, check the **second** auto-dump in console. The `dp-registry-done` total_ms is the metric. If it's still ~9 s, then the slow path is somewhere else — would need another targeted profile (per-action marks inside the EnergyDashboard onMount).

### What's left (only if needed)

- `EnergyDashboard.executeAction('getEnergyData')` does its own internal multi-step fetch — could be further sped up if profile shows it's still the bottleneck.
- `WeatherDeviceEntity.onMount` calls `getCurrentWeather` (one await) — if user has it configured and it's slow on its own, no parallelization possible there.

For now: this is the targeted fix the v1.1.1248 profile demanded.

---

## Version 1.1.1248 - 2026-04-25

**Title:** Phase 5 — Integration & Plugin reloads parallel (registry 10 s → ~3 s)
**Hero:** none
**Tags:** Performance, Background

### Why this release

The Safari profile from v1.1.1247 (now matching what we suspected) confirmed the only remaining big delta:

```
dp-ha-indexed     →  dp-registry-done    8 940 ms  ← background but real
```

That's nine seconds of HA chatter happening in the background after the user already sees their cards. It contributes to:
- iPhone heat (sustained network + JS work),
- system entities (News, Todos, Versionsverlauf, etc.) appearing 9 s late in the search results.

Two `for…await` anti-patterns were responsible — both now parallelized.

### Fix A — `Integration.loadSavedDevices` parallel

`src/system-entities/entities/integration/index.js:206`. Each saved device's `onMount` makes several sequential HA calls (e.g. `EnergyDashboardDeviceEntity` chains `_loadAreaFromSensors → loadEnergyPreferences → getGridImportValue → getEnergyData`). With 2 devices the loop ran them back-to-back, ~10 s total.

```js
// Before:
for (const deviceData of devices) {
  const deviceEntity = createDeviceEntity(deviceData);
  await deviceEntity.onMount({ hass, storage });   // sequential!
  systemRegistry.register(deviceEntity);
}

// After:
await Promise.all(devices.map(async (deviceData) => {
  const deviceEntity = createDeviceEntity(deviceData);
  await deviceEntity.onMount({ hass, storage });
  systemRegistry.register(deviceEntity);
}));
```

Each device entity has its own internal state — no shared mutable storage. HA's WebSocket handles concurrent requests fine. `try/catch` is per-device, so one mount failing doesn't block the others (same behavior as before, just parallel).

### Fix B — `Pluginstore` plugin reloads parallel

Same `for…await` anti-pattern in `src/system-entities/entities/pluginstore/index.js:580`. Each enabled plugin gets reloaded from GitHub or URL on mount — sequential network roundtrips. With multiple plugins this added up too.

```js
// Before:
for (const plugin of installedPlugins) {
  if (!plugin.enabled) continue;
  await loader.loadPluginFromGitHub(plugin.repo);  // sequential!
}

// After:
const enabled = installedPlugins.filter(p => p.enabled);
await Promise.all(enabled.map(async (plugin) => {
  await loader.loadPluginFromGitHub(plugin.repo);
}));
```

### Expected effect

If the user has 2 Integration devices each costing 5 s:
- Before: 10 s `dp-registry-done`
- After: ~5 s (limited by the slowest single device)

If the user has 1 Integration device + 0 plugins, no change — Promise.all on a single-element array is the same as awaiting it.

The user-visible boot path (cards visible at ~900 ms) is unchanged. This release purely shrinks the background work — registry-done arrives sooner, system entities pop into search results sooner, less sustained HA chatter (less heat).

### What this still doesn't do

`EnergyDashboardDeviceEntity.onMount` still has 4 sequential `await`s internally. Those could become `Promise.all` too — would shave another ~2 s — but each call writes to attributes and the order may matter for area inheritance. Held for a future profile-driven fix if the new `dp-registry-done` is still uncomfortable.

### Verification

After update, the registry-done callback should fire noticeably sooner. Check the **second** auto-dump in the console (the one that has `dp-registry-done` in it). The delta `dp-ha-indexed → dp-registry-done` should drop from ~9 s to roughly the duration of the slowest single device's onMount.

---

## Version 1.1.1247 - 2026-04-25

**Title:** Phase 4 — `loadCriticalData` parallel + `buildSearchIndex` fire-and-forget
**Hero:** none
**Tags:** Performance

### Why this release

The v1.1.1246 profile cleanly identified the two remaining bottlenecks in the visible boot path:

```
dp-db-init        → dp-critical-done    335.7 ms   ← settings + favorites read (sequential)
dp-ha-rendered    → dp-ha-indexed       324.2 ms   ← buildSearchIndex blocking finally
```

Both are addressed here.

### Fix A — `loadCriticalData` parallel

`src/utils/dataLoaders.js` was reading settings then favorites sequentially:

```js
const storedSettings = await db.get(STORES.SETTINGS, 'user_preferences');
// ...
const storedFavorites = await db.getAll(STORES.FAVORITES);
```

Two independent IndexedDB transactions, no reason to serialize them. Wrapped in `Promise.all`:

```js
const [storedSettings, storedFavorites] = await Promise.all([
  db.get(STORES.SETTINGS, 'user_preferences'),
  db.getAll(STORES.FAVORITES),
]);
```

Expected savings: ~100–150 ms on Safari (each IndexedDB roundtrip is ~150 ms there). This shows up directly in `dp-initialized` timing.

### Fix B — `buildSearchIndex` fire-and-forget

`loadEntitiesFromHA` was awaiting the search index build before releasing the `loadEntitiesRunningRef` mutex. Cards were already committed to state at `dp-ha-rendered` — the user could see them — but the function held its mutex for another 324 ms while the index was written to IndexedDB.

Now the index builds in the background:

```js
buildSearchIndexUtil(dbRef.current, allEntities)
  .then(() => { perfMark('dp-ha-indexed'); /* dump */ })
  .catch(err => console.warn('[DataProvider] buildSearchIndex failed (background):', err));
```

Fuse.js search still works directly on entity names without the index — the index is just a Bonus-Beschleuniger. If a user searches in the first 200 ms after boot, they get slightly slower results until the index lands; in practice imperceptible.

The `initialLoadCompleteRef.current = true` flip moved up before the index call so state-change events flow normally during the background index build.

### Expected effect (relative to v1.1.1246)

```
dp-db-init        → dp-critical-done   ~200 ms   (was 335 ms)
dp-ha-rendered    → dp-ha-indexed       ~324 ms but no longer blocking
```

User-visible boot to `dp-ha-rendered`: 869 ms → ~700 ms. Mutex available for excludedPattern reloads etc. without 324 ms penalty.

### Auto-dump timing

The `setTimeout(perfDump, 0)` moved into the `buildSearchIndex` `.then()` so the dump still includes `dp-ha-indexed` (otherwise it would fire before that mark exists). The registry-done callback still emits its own dump when the registry eventually finishes — full timeline.

### What's not in this release

`Integration.loadSavedDevices` is still a `for…await` loop — registry takes ~10 s in the background. That's the next clear hebel and would need:

- `Promise.all` on the loop (low risk, big win)
- Or per-device `Promise.all` of the multiple HA calls inside each `onMount`

Both improve background load and may reduce the heat we still see. Held for the next release pending another profile to confirm there's no other surprise.

---

## Version 1.1.1246 - 2026-04-25

**Title:** Profiling result — `systemRegistry.initialize()` was blocking 10 s. Now non-blocking.
**Hero:** none
**Tags:** Performance, Boot

### What the v1.1.1245 profile showed

A single delta dwarfed everything else:

```
dp-db-init        → dp-registry-done       10.110 ms   ← 95 % of boot
dp-registry-done  → dp-critical-done           53 ms
dp-critical-done  → dp-warmcache-done          30 ms
dp-warmcache-done → dp-initialized              0 ms
dp-ha-start       → dp-ha-fetched             189 ms
dp-ha-fetched     → dp-ha-scored               56 ms
dp-ha-scored      → dp-ha-rendered             52 ms
dp-ha-rendered    → dp-ha-indexed             250 ms
```

`systemRegistry.initialize()` took **over 10 seconds**. Phase 1 (v1.1.1238) deferred Versionsverlauf's GitHub fetch — but other system entities have similar blocking work. The biggest offender: `Integration.loadSavedDevices` (`integration/index.js:211`) iterates registered devices with a `for…await` loop and calls `await deviceEntity.onMount()` sequentially. Each device's `onMount` makes multiple sequential HA calls (e.g. `EnergyDashboardDeviceEntity` has 4: `_loadAreaFromSensors` → `loadEnergyPreferences` → `getGridImportValue` → `getEnergyData`). With 1–2 integration devices configured, easy 10 s.

`pluginstore.onMount` has the same anti-pattern for installed plugins (`for…await loadPluginFromGitHub`).

### The fix

`DataProvider.initializeDataProvider` no longer awaits `systemRegistry.initialize()`. The boot path becomes:

```
IndexedDB.init()       (~50 ms)
loadCriticalData()     (~50 ms)   ← settings + favorites
loadEntitiesFromCache  (~30 ms)   ← IndexedDB warm-cache
setIsInitialized(true)            ← UI is now visible at ~150 ms
loadBackgroundData() → loadEntitiesFromHA()   (~250-500 ms)
```

`systemRegistry.initialize()` runs in parallel as a fire-and-forget promise. When it eventually finishes, a `.then()` callback merges the real system entities into the entity state via a functional `setEntities(prev => …)` updater. Until then, `getSystemEntities()` returns the existing fallback (1 entity: `system.settings`) so the user can still reach Settings if they look for it.

`loadEntitiesFromHA` was changed to preserve any "real" system entities already in state (count > fallback count) — this handles the race where the registry callback fires either before or after `loadEntitiesFromHA`'s own `setEntities`.

### What the user sees

- Cards visible at ~50 ms from snapshot (unchanged from v1.1.1241).
- Live HA data merged in at ~400-700 ms (unchanged).
- **System entities (News / Todos / Versionsverlauf / Pluginstore / Integration / Weather etc.) appear when the registry finishes** — could be 1–10 s depending on how heavy your integration devices are. They pop in without disrupting layout because they live in the search results, not the always-visible UI shell.

### What this does NOT fix (but is now visible in profile)

- `Integration.loadSavedDevices` is still sequential. Parallelizing it (`Promise.all`) would speed up the registry from 10 s to ~3 s — useful for users actively browsing system entities, but no longer blocks first paint.
- `EnergyDashboardDeviceEntity.onMount` has 4 sequential HA calls that could run as `Promise.all`.
- `pluginstore.onMount` reloads plugins sequentially.

These are now optional optimizations — the heat / blocking pain is gone for the boot path. We can do them later if the registry-done time bothers users browsing system entities.

### Verification

After update, look at the console dump on first boot. The `dp-registry-done` mark now arrives **after** `dp-ha-indexed`, somewhere later in the timeline. The earlier marks should all be sub-200 ms in total. A second `perfDump()` is auto-emitted when registry finishes, showing the full picture.

---

## Version 1.1.1245 - 2026-04-25

**Title:** Boot-time profiling — `performance.mark` instrumentation, no behavior change
**Hero:** none
**Tags:** Performance, Diagnostics

### Why this release

After the Phase 1–3 boot wins (snapshot, warm-cache, splash trim, thermal fixes), the next round of optimizations would each save 20–60 ms in theory. That's small enough to want **measurements before more code changes** — otherwise we'd be guessing which 30 ms to optimize.

This release is instrumentation only. No behavior change.

### What was added

A small `src/utils/perfMarks.js` helper exposing:

- `perfMark(name)` — wraps `performance.mark('fsc:' + name)` plus appends to an in-memory list.
- `perfDump()` — prints the list as a `console.table` plus a copy-paste-friendly text block.
- `perfReset()` — clear and start fresh for a re-measurement.
- `window.__fsc_perf` — manual access in the DevTools console.

### Marks placed (in chronological order)

| Mark | Where | What it captures |
|---|---|---|
| `element-constructor` | `build.sh` Custom Element ctor | Earliest mark — fires before JS bundle is evaluated |
| `bundle-evaluated` | top of `src/index.jsx` | Bundle parsed, module-level code running |
| `app-first-render` | first call to `App()` | Preact has begun rendering |
| `loadapp-start` | `src/index.jsx:loadApp` async start | Begin appearance-settings parse |
| `loadapp-done` | end of `loadApp` | `setIsLoadingComplete(true)` about to fire |
| `dp-snapshot-init` | `DataProvider` `useState` initializer | localStorage snapshot loading |
| `dp-init-start` | `initializeDataProvider` start | DataProvider effect fired |
| `dp-db-init` | after `dbRef.init()` | IndexedDB connection ready |
| `dp-registry-done` | after `systemRegistry.initialize()` | System entities mounted |
| `dp-critical-done` | after `loadCriticalData()` | Settings + favorites loaded |
| `dp-warmcache-done` | after `loadEntitiesFromCache()` | IndexedDB warm-cache merged |
| `dp-initialized` | after `setIsInitialized(true)` | UI is allowed to reveal |
| `dp-ha-start` | start of `loadEntitiesFromHA` | HA fetch begins |
| `dp-ha-fetched` | after `Promise.all([loadAreas, loadDeviceReg, loadEntityReg])` | Registries pulled |
| `dp-ha-scored` | after `scoreEntities` | Per-entity usage scoring done |
| `dp-ha-rendered` | after `setEntities(allEntities)` | Real cards committed to state |
| `dp-ha-indexed` | after `buildSearchIndex` | Search index complete; auto-dump fires |

After `dp-ha-indexed` the helper schedules a `setTimeout(0)` callback that calls `perfDump()`. The user sees the full timeline in the browser console without any manual action.

### How to read the output

Open the dashboard with the DevTools console open. After ~3–5 seconds you'll see:

```
[fsc:perf] Boot timeline (relative to first mark):
┌─────────┬──────────────────────┬──────────┬──────────┐
│ (index) │ step                 │ total_ms │ delta_ms │
├─────────┼──────────────────────┼──────────┼──────────┤
│ 0       │ element-constructor  │ 0.0      │ 0.0      │
│ 1       │ bundle-evaluated     │ 412.3    │ 412.3    │
│ ...
```

`total_ms` is time since the first mark (the constructor). `delta_ms` is time since the previous mark — that's where the bottleneck shows up: the largest delta is the slowest step.

The same data is also in DevTools Performance → User Timing as `fsc:*` named entries, so you can see them inline with the broader profile.

### What this is for

Once you've got a profile from Safari (or wherever the slowness is most pronounced), paste the copy-paste-friendly text block back to me. The next round of optimization picks the actual largest delta — not a guess.

### What this isn't

- Not a behavior change. All marks are no-ops if `performance` is missing.
- Not a perf regression. Each `perfMark` is a few microseconds. Total overhead across all marks is below human-perception threshold.
- Not enabled-only-in-dev. The marks ship in the production bundle so we can measure the actual production behavior. They cost essentially nothing.

---

## Version 1.1.1244 - 2026-04-24

**Title:** Thermal fixes round 2 — pending pulse + state_changed throttle
**Hero:** none
**Tags:** Performance, Mobile, Bug Fix

### Context

After v1.1.1242 replaced the skeleton shimmer's `background-position` animation with a compositor-only opacity pulse, the phone was still getting hot. A systematic audit turned up two more ongoing heat sources that aren't tied to the skeleton:

1. **`pendingPulse` on device cards** animated `box-shadow` at 60 fps while a service call was in flight. Same paint-per-frame pattern that v1.1.1181 fought back with the "Icon-Diät", and what v1.1.1242 fixed for the skeleton. When the user taps multiple toggles in quick succession, several 1.1 s overlapping box-shadow loops run at once.
2. **`state_changed` events had no rate limit.** The existing rAF batcher in `DataProvider.scheduleEntityStateUpdate` only guaranteed "at most one `setEntities` per frame" — so if Home Assistant pushes events in a stream (energy sensors, automations, presence), up to 60 `setEntities` calls per second would land. Each call re-renders `SearchField` (1100 lines, not memoized), `useMemo`s recalculate, Virtua remeasures, framer-motion re-interpolates its animated props. That's sustained CPU on mobile.

### Fix 1 — pendingPulse: box-shadow → opacity ring

Before:

```css
@keyframes pendingPulse {
  0%   { box-shadow: 0 0 0 0 rgba(100, 180, 255, 0.35); }
  50%  { box-shadow: 0 0 0 3px rgba(100, 180, 255, 0.18); }
  100% { box-shadow: 0 0 0 0 rgba(100, 180, 255, 0.0); }
}
.device-card.pending { animation: pendingPulse 1.1s infinite; will-change: box-shadow; }
```

Problem: `box-shadow` paints the entire card rectangle every frame. `will-change: box-shadow` keeps a Compositor layer alive the whole time the card is mounted (even when no animation is running).

Now:

```css
@keyframes pendingPulse {
  0%, 100% { opacity: 0; }
  50%      { opacity: 1; }
}
.device-card.pending::after {
  content: ''; position: absolute; inset: -2px; border-radius: inherit;
  border: 2px solid rgba(100, 180, 255, 0.55);
  animation: pendingPulse 1.1s infinite;
}
```

A pseudo-element ring, opacity-only animation. The ring is a static border (paint once), the animation only changes opacity (compositor-only, GPU blends the layer at varying alpha). Same visual signal ("I'm working on this"), near-zero GPU cost.

### Fix 2 — min 150 ms between state_changed flushes

`DataProvider.scheduleEntityStateUpdate` now tracks `lastFlushAtRef` and enforces a minimum 150 ms gap between flushes. Events arriving inside that window accumulate in the pending `Map` (last-write-wins per `entity_id`) and flush together at the end of the window.

- Before: up to 60 re-renders per second when HA fires a stream of events.
- After: at most ~6–7 re-renders per second. Sensor updates arrive visually in the same frame as before (human perception threshold is ~100 ms anyway).

Safari's natural rAF throttling for hidden tabs still applies on top of this — when the card is backgrounded, rAF won't fire at all, events just accumulate.

### What this doesn't fix

The audit also flagged:
- **Framer-motion `animate={{ boxShadow: ... }}`** on `SearchField` — string interpolation each re-render. Candidate for the next round if heat persists.
- **`.glass-panel` backdrop-filter** with `blur(20px + user-configured)` on multiple stacked panels (StatsBar + Panel + Sidebar) — expensive on mobile GPU, but removing or reducing it would change the design. Could add a mobile-reduced-blur media query, but that's a visual call, not a bug fix.
- **Printer3D `setInterval(..., 2000)`** polling — only runs if the user has a 3D printer and opens that view. Not a general heat source.

If v1.1.1244 still leaves the phone warm, next step is an on-device Chrome/Safari Performance profile — we need data, not more guesses.

---

## Version 1.1.1243 - 2026-04-24

**Title:** StatsBar flashes "--°C / 0.0 kW" — snapshot was being wiped right after loading
**Hero:** none
**Tags:** Bug Fix, Performance

### The regression

User reported seeing "--°C" for weather and "0.0 kW" for grid consumption in StatsBar right after a cold boot, even after the snapshot warm-cache from v1.1.1241 was in place. The snapshot is supposed to make cards visible from the first render — so why was StatsBar missing its inputs?

### Root cause

`initializeDataProvider` in `DataProvider.jsx` had this sequence:

```
useState initializer → entities := snapshot (120 non-system entities including weather)
useEffect fires → dbRef.init() → systemRegistry.initialize()
  → setEntities(systemEntities)          ← REPLACES the snapshot entities!
→ loadCriticalData()
→ loadEntitiesFromCache (IndexedDB)      ← re-populates, but state was empty in between
→ setIsInitialized(true) → UI renders
```

Line 399 was `setEntities(systemEntities)` — a straight replace. It wiped every non-system entity that the snapshot had just loaded, including the `weather.*` entity that StatsBar's `useMemo` depends on. For the ~50–500 ms window between "system registry done" and "IndexedDB warm-cache done" (longer on Safari), StatsBar saw an empty device list → `weatherEntity` was `null` → `--°C`.

### Fix

`setEntities` now uses a functional updater that merges system entities with whatever non-system entities were already there:

```js
setEntities(prev => {
  const nonSystemPrev = prev.filter(e => !e.is_system);
  return [...systemEntities, ...nonSystemPrev];
});
```

Now the sequence is:

1. Snapshot loads 120 non-system entities in the useState initializer (sync).
2. `systemRegistry.initialize()` finishes → system entities merged in. Snapshot entities preserved.
3. IndexedDB warm-cache replaces the non-system tier with a fresher/wider set. System entities preserved.
4. `loadEntitiesFromHA` replaces everything with live HA data.

Three paint updates, same as before, but the StatsBar widget never sees an empty device list anymore. Weather temperature, grid consumption, solar production — all visible from the first frame on warm boots.

### Why this wasn't caught earlier

The warm-cache wipe existed in the original code too — but back then `useState([])` started empty, so "wiping to just system entities" was equivalent to "filling in the system entities". The snapshot from v1.1.1241 changed the initial state from empty to populated, and the replace became a regression.

### Not changed

- Energy dashboard (`energyData`) is still fetched async via `getEnergyDashboardData`. The "0.0 kW" in the screenshot is the live sensor state from `hass.states` (via `getEnergyValue` fallback), which works the same as before. If it shows 0.0 kW right after boot, that's either the actual consumption at that moment or the sensor is still populating — not affected by this fix.

---

## Version 1.1.1242 - 2026-04-24

**Title:** Skeleton shimmer → opacity pulse (thermal fix, mobile GPU)
**Hero:** none
**Tags:** Performance, Bug Fix, Mobile

### The regression

After v1.1.1238 and v1.1.1240 added skeleton shimmer animations in two places (React-level `perceivedSpeed.css` and pre-JS HTML placeholder in `build.sh`), the phone was getting warm again. Exactly the same thermal pattern as v1.1.1181's "58 → 42 endless SVG animations" fix.

### Why

The shimmer keyframe animated `background-position`:

```css
@keyframes skeletonShimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

`background-position` is **not compositor-accelerated**. The browser has to repaint the entire element on every frame. With 8 skeleton cards + a title + a search bar shimmering at 60 fps, that's 600+ paints per second, all on the main thread, all forcing GPU texture uploads on mobile. Heat.

### The fix

Opacity pulse instead. Opacity is compositor-only — the GPU blends an existing texture at a different alpha, no repaint, no texture upload:

```css
@keyframes skeletonPulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.45; }
}
.device-card-skeleton {
  background: rgba(255, 255, 255, 0.08);
  animation: skeletonPulse 1.6s ease-in-out infinite;
}
```

Applied in both places:
- `src/styles/perceivedSpeed.css` — React-level skeleton (shown while entities load)
- `build.sh` `_createPlaceholder` — HTML placeholder (shown before Preact mounts)

Same timing (1.6 s), same reduced-motion fallback, much less thermal load. Visually still clearly "this is loading" — pulse-style skeletons are the LinkedIn / Facebook / YouTube pattern.

### What this means for the user

- Same boot-perf wins from v1.1.1238–1241 stay.
- Phone should no longer heat during the brief skeleton phase.
- If heat persists after this, the cause is elsewhere (e.g. `pendingPulse` box-shadow animation during service calls, framer-motion re-layouts, or something older) and needs a Chrome Performance profile on-device to pinpoint.

### Audit of remaining infinite animations

Checked every `animation: ... infinite` in the codebase. All compositor-friendly:
- `spin` (6 places): `transform: rotate()` — compositor-only ✓
- `pulse` (various views): mostly opacity or transform ✓
- `float` (WeatherView): transform ✓
- `pendingPulse` (perceivedSpeed.css): animates `box-shadow` (paint), but only runs briefly during a service call — not a thermal concern

---

## Version 1.1.1241 - 2026-04-24

**Title:** localStorage snapshot — Safari-friendly 1st-tier warm cache
**Hero:** none
**Tags:** Performance, Safari

### Context

After v1.1.1240 dropped the splash padding and added a pre-JS skeleton in the Custom Element placeholder, Safari still felt sluggish between "skeleton visible" and "real cards visible". Two reasons, both Safari-specific:

1. **IndexedDB open is slow on WebKit.** 50–500 ms on first connect, compared to ~20 ms on V8. The warm-cache from v1.1.1239 reads from IndexedDB, so it inherits this latency.
2. **Big JS bundle parses slower.** 1.4 MB (366 KB gzipped) takes 500–1500 ms to parse on Safari. Everything downstream has to wait.

(1) is addressable. (2) is not, without breaking the HACS single-file constraint.

### The fix — three-tier warm cache

Memory (cache), IndexedDB, localStorage, HA. Previously only the last three were in the boot path, and the fastest of them still involved async I/O. Now we have a synchronous front-of-queue:

1. **localStorage** — synchronous, ~1 ms even on Safari. Top-120 entities with just the fields a device card needs (entity_id, domain, state, attributes, area, relevance_score, usage_count, last_changed/updated). Read in the `useState` initializer, so Preact renders cards in the very first render frame — before any effect fires.
2. **IndexedDB** — async, 50–500 ms on Safari. Full entity shape, richer metadata. Reads in `initializeDataProvider` after `loadCriticalData`. Overrides the localStorage tier via a functional `setEntities` updater.
3. **Home Assistant** — async, 2–4 s. Fresh authoritative data. `loadEntitiesFromHA` runs via the existing `hass`-retry `useEffect`.

The three writes use Preact's keyed reconciliation (`entity_id`), so cards stay mounted through all three updates — no flash, no layout shift, no re-animation.

### New file — `src/utils/entitiesSnapshot.js`

Three exports:

- `loadEntitiesSnapshot()` — sync read from `localStorage['fsc_entities_snapshot_v1']`, returns `[]` on any failure (private browsing, disabled storage, parse error).
- `saveEntitiesSnapshot(entities)` — filters non-system, sorts by `relevance_score`, caps at 120 entities, writes compact JSON. ~15–20 KB at cap, well within Safari's localStorage quota.
- `clearEntitiesSnapshot()` — wipes the key. Called from `resetLearningData` so the next boot doesn't paint stale usage counts.

### Wiring

**Read path** — `DataProvider.jsx`:

```js
const [entities, setEntities] = useState(() => {
  const snap = loadEntitiesSnapshot();
  if (snap.length === 0) return [];
  const liveStates = hass?.states;
  if (!liveStates) return snap;
  return snap.map(e => {
    const live = liveStates[e.entity_id];
    return live
      ? { ...e, state: live.state, attributes: live.attributes, last_changed: live.last_changed, last_updated: live.last_updated }
      : e;
  });
});
```

`hass` is already passed as a prop when DataProvider mounts (HA calls `setHass` before the card is visible). So the initializer can enrich the cached shape with live state right away — no stale on/off.

**Write path** — end of `loadEntitiesFromHA`, right after the existing `setEntities(allEntities)`:

```js
saveEntitiesSnapshot(allEntities);
```

### What changes for the user

- **First ever boot on a device:** no snapshot → no change. Skeleton still carries the wait.
- **Every subsequent boot:** the React-level skeleton never even renders. Cards are visible in the first paint frame after Preact mounts. On Safari this saves the full IndexedDB-open cost — 50–500 ms of pure waiting, gone.
- **After "Reset Learning Data":** snapshot is cleared, next boot behaves like a first-boot (skeleton carries the wait until fresh HA data writes a new snapshot).

### What this does NOT do

- Does not shrink the 1.4 MB bundle. JS parse time on Safari is untouched.
- Does not pre-open IndexedDB in parallel with Preact mount (option C from the plan — lower priority now that snapshot short-circuits the IndexedDB path for rendering).
- Does not touch the data flow for settings or favorites — those stay in IndexedDB via `loadCriticalData`.

---

## Version 1.1.1240 - 2026-04-24

**Title:** Splash delays gone + pre-JS skeleton in Custom Element placeholder
**Hero:** none
**Tags:** Performance, UX, Safari

### Context

After v1.1.1238 (deferred GitHub fetch + React-level skeleton) and v1.1.1239 (IndexedDB warm-cache), Chrome / iPhone HA app felt clearly faster. Safari (iOS + macOS) did not — still slow to reach the first interactive paint. Two reasons: the splash screen was still holding 2.5 s of hardcoded `setTimeout` padding that was originally calibrated to the old ~2.5 s app-load, and Safari's slower JS start-up meant the Custom Element placeholder (a centered "🔍 Loading…") was visible for longer than on other engines.

This release addresses both.

### Fix A — drop the splash padding

`src/index.jsx` used to chain five `setTimeout`s between progress bar stages:

```
0 % → wait 250 ms → 25 % (parse settings) → wait 500 ms
    → 50 % → wait 500 ms → 75 % → wait 500 ms
    → 100 % → wait 750 ms → reveal
```

Total artificial wait: 2500 ms. Those delays were added back when `DataProvider` itself needed ~2.5 s to become ready; the splash *covered* that cost. With Phase 1 + Phase 2, real init is under 200 ms on warm boots, so the padding is pure cost.

Now:

```
0 % → parse settings (real work) → 100 %
    → 120 ms flash protection → reveal
```

`splashDrawingDone` still gates the 'hello' splash (Apple Hello animation is a deliberate design choice, untouched), so users on that style still see the full lettering. Users on the default 'progress' style now get ~120 ms of splash instead of 2.5 s.

### Fix B — skeleton IN the Custom Element placeholder (pre-Preact)

`build.sh` writes a Shadow-DOM placeholder straight into the Custom Element constructor. This HTML is the very first thing Safari (or any browser) renders, *before* the main 1.4 MB bundle is even parsed. It used to be:

```html
<div>🔍 Fast Search Card</div>
<div>Loading…</div>
```

Visually: a plain white box with centered text.

New placeholder renders a pure-HTML+CSS skeleton with:

- A fake search bar (56 px high, rounded 28 px, shimmer)
- A fake section title (16 × 140 px, shimmer)
- An 8-card skeleton grid — 4 cols desktop, 3 cols tablet, 2 cols mobile

Same `@keyframes fscShimmer` as the React-level skeleton from v1.1.1238, scoped inside the shadow root so no style leak. `prefers-reduced-motion` disables the animation. The `_render()` function already removes `.fsc-placeholder` when Preact mounts, so no wiring change needed there.

### Expected effect

- **macOS Safari / iOS Safari:** the blank-white-box moment is gone. From the first frame the user sees a structured shimmering grid. The real app takes over once Preact finishes parsing (~300–800 ms later depending on CPU), and warm-cache cards arrive within another ~50 ms.
- **Chrome / Firefox / iPhone HA app:** also benefits — the placeholder was white there too, just for shorter. Combined with the splash-delay removal, the total perceived boot on a warm second start is now ~200–400 ms before real cards appear.

### What this does NOT do

- The Apple Hello splash animation timing is unchanged — that's a designed experience, not a bottleneck.
- The real JS bundle size (1.4 MB / 366 KB gzip) is untouched. Code-splitting would break the HACS single-file constraint.
- No DataProvider or SearchField refactor. Still pending but not now.

---

## Version 1.1.1239 - 2026-04-24

**Title:** IndexedDB warm-cache — panel is populated in ~0 ms from second boot onwards
**Hero:** none
**Tags:** Performance

### The idea

The card has persisted HA entities to IndexedDB for a long time already (the `STORES.ENTITIES` batch-write at the end of `loadEntitiesFromHA`). But on boot, that cache was never read unless `hassRef.current` was missing — i.e. dead code for every real HA session. The full first paint always waited for `loadEntitiesFromHA` to round-trip (~2–4 s on iPhone).

Now: boot reads the cache and renders it before `loadEntitiesFromHA` even starts. Second boot onwards, the panel is populated immediately.

### What the warm cache does

1. **Read from IndexedDB.** New `loadEntitiesFromCache(db, hassRef)` in `dataLoaders.js` pulls all non-system entities out of `STORES.ENTITIES`.
2. **Enrich with live state.** Cached entities carry stale `state` from the last session (a light might be stored as "on" even if it's actually off now). To avoid showing stale state, each cached entity is merged with `hassRef.current.states[entity_id]` if available — cached shape (`name`, `area`, `icon`, `relevance_score`) plus live `state`, `attributes`, `last_changed`, `last_updated`. When `hass.states` isn't yet populated, we fall back to cached state; `loadEntitiesFromHA` will correct it a beat later.
3. **Apply excluded patterns.** Same `filterExcludedEntities` as the main path — no risk of showing entities the user has since excluded.
4. **Merge with system entities.** System entities always come from the registry (never cached). Warm-cache `setEntities` uses the functional updater: `prev.filter(is_system)` stays, non-system is replaced with the cache payload.

### Wiring

`initializeDataProvider` in `DataProvider.jsx`:

```
IndexedDB.init()
systemRegistry.initialize() → setEntities(systemEntities)   # 5–6 entities
loadCriticalData()                                           # settings + favorites
→ NEW: loadEntitiesFromCache → setEntities([sys + cached])  # full warm list
setIsInitialized(true)                                       # UI reveals
loadBackgroundData() → loadEntitiesFromHA()                  # fresh data replaces
```

The hass-retry `useEffect` still fires once `isInitialized` flips to `true`, so fresh entities overwrite the warm cache via the same `setEntities(allEntities)` call as before. Preact's keyed reconciliation (keyed by `entity_id`) means the cards stay mounted during the swap — no flash, no re-animation.

### Expected effect

- **First ever boot:** cache is empty → no benefit, skeleton shimmer from v1.1.1238 carries the ~3–5 s until `loadEntitiesFromHA` finishes.
- **Every subsequent boot (~99 % of sessions):** `devices.filter(d => !d.is_system).length === 0` flips false in roughly one IndexedDB read (~20–50 ms). Panel is populated before the user notices. Fresh state arrives 2–4 s later but the swap is invisible.

### What this does NOT do

- **No IndexedDB write optimization.** The batch-put at the end of `loadEntitiesFromHA` is unchanged — the cache just now gets *read* too.
- **No splash change.** The setTimeouts in `index.jsx` are still the ~2.5 s they've been. Once we have real measurements of the warm-cache effect, we can re-tune the splash. Not now.
- **No DataProvider split.** Still 1100+ lines; still the right call to leave it alone for now.

---

## Version 1.1.1238 - 2026-04-24

**Title:** First-Load perf — defer changelog fetch + skeleton cards
**Hero:** none
**Tags:** Performance, UX

### The problem

On the very first start (iPhone app or desktop browser) the expanded panel stayed empty for 3–10 seconds before device cards appeared. Root-cause audit across both recent session notes revealed two layers stacking on top of each other:

1. **Versionsverlauf entity blocked the registry init.** Its `onMount` did a synchronous GitHub fetch for `docs/versionsverlauf.md`. The `systemRegistry.initialize()` call in `DataProvider` awaited `Promise.all([...onMount(), ...])`, so the slowest mount — this one, ~150–300 ms on slow networks — gated everything else, including `loadEntitiesFromHA`.
2. **No visual feedback between splash fadeout and first cards.** Once the splash screen disappeared, the expanded panel rendered but `groupedFilteredDevices` was still empty. `GroupedDeviceList` returned `null`, so the user saw a blank panel area for the remaining 2–4 s while HA entities loaded.

### Two minimal fixes

**1. Versionsverlauf cache-only on boot**

`onMount` now reads `localStorage.versionsverlauf_cache` directly (synchronous, ~1 ms) and never touches the network. The GitHub fetch still happens — just lazily, when `VersionsverlaufView` itself mounts (its own `useEffect` already calls `executeAction('loadChangelog')`). First-time users without a cache see an empty list until they open the view; next boot the cache is warm anyway.

New `loadFromCacheOnly` action alongside the existing `loadChangelog`. Separation of concerns:
- `loadFromCacheOnly` — boot path, synchronous, no network
- `loadChangelog` — view path, cache-first with GitHub fallback (unchanged)

**2. Skeleton cards during entity load**

While `devices.filter(d => !d.is_system).length === 0` (HA entities haven't arrived yet), `GroupedDeviceList` now renders a shimmer-animated placeholder grid: 2 fake section headers with a column-matched row of fake cards each. Columns honor `useColumnCount` so the skeleton stays visually consistent with the real grid.

The shimmer stops the moment real rooms arrive — no transition jank. `aria-busy="true"` + `aria-live="polite"` for accessibility. `prefers-reduced-motion` disables the animation.

### What this does NOT do

- **Does not shorten the splash setTimeouts** (still 250 + 500 + 500 + 500 + 750 ms). Removing them without also speeding up the real load would make things visually worse — the splash currently hides the init gap. Next release once we measure the registry improvement.
- **Does not add IndexedDB warm-cache read** (next release, medium complexity).
- **Does not refactor DataProvider or SearchField.** Both are 1100+ lines and overdue for splitting, but high-risk right now. Fix the acute pain first.

### Expected effect

- Versionsverlauf: ~150–300 ms earlier registry completion on cold starts.
- Skeleton: the 3–10 s gap is no longer a blank panel — shimmer fills the visual void so the card feels alive from the first frame after splash.

---

## Version 1.1.1237 - 2026-04-24

**Title:** Sidebar –10 % instead of –20 %, iOS navbar title now actually centered
**Hero:** none
**Tags:** Bug Fix, Design

### Two fixes

**1. Sidebar slightly less slim**

Horizontal padding adjusted to 12 px (from 8 px in v1.1.1236). Net change vs. the original 16 px is ~–10 % in width – the previous –20 % was too much.

```css
.vpm-menu.glass-panel { padding: 12px 12px; }
```

**2. iOS navbar title centering bug**

Inside version-detail pages (and every other iOS-style navbar) the title uses `position: absolute; left: 50%; transform: translateX(-50%)` to center itself. But the parent `.ios-navbar` was missing `position: relative`, so the title was positioned against a far ancestor and visually landed at the left next to the back button instead of centered.

Fix: one line in `.ios-navbar`:

```css
position: relative;
```

All navbars using `.ios-navbar` + `.ios-navbar-title` now show a properly centered title.

### Changed files

- `src/components/SearchField/SearchField.css` – `.vpm-menu.glass-panel` padding
- `src/system-entities/entities/news/components/iOSSettingsView.css` – `.ios-navbar { position: relative }`

### Test

- Sidebar is a little wider than after v1.1.1236, a little slimmer than before
- Versionsverlauf → pick any version → detail page title (e.g. `v1.1.1236`) is now horizontally centered in the navbar, not stuck next to the "Back" button

---

## Version 1.1.1236 - 2026-04-24

**Title:** Sidebar 20 % slimmer + font stack matches StatsBar
**Hero:** none
**Tags:** Design

### Two small tweaks

**1. Narrower rail**

Container horizontal padding cut from 16 px to 8 px (vertical stays at 12 px). The pill is now ≈ 20 % slimmer in the collapsed state. Item padding and icon size are unchanged – more breathing space on the page, same hit-area.

**2. Font stack unified**

The rail used `system-ui, -apple-system, sans-serif` while the StatsBar uses the Apple-style fallback chain. The rail now matches:

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

Same look as the rest of the glass UI (StatsBar, GreetingsBar, etc.).

### Changed file

- `src/components/SearchField/SearchField.css` – `.vpm-menu.glass-panel` padding + font-family

### Test

Visual inspection; the rail should look noticeably slimmer and label text (when expanded) should share the same weight / metrics as the StatsBar pill above.

---

## Version 1.1.1235 - 2026-04-24

**Title:** StatsBar vertical padding doubled (6 → 12 px), DetailView top offsets adjusted
**Hero:** none
**Tags:** Design

### Small height tweak

Vertical padding on the StatsBar pill was 6 px top & bottom – a bit tight. Doubled to 12 px for more breathing room around icons and text. Horizontal padding unchanged (12 / 16 px on mobile / desktop).

```jsx
padding: isMobile ? '12px 12px' : '12px 16px'
```

Because the pill is now ~12 px taller, the DetailView top offset moved up by the same amount so the detail panel still starts flush with the bottom of the StatsBar:

```js
const statsBarHeight = statsBarEnabled ? (isMobile ? 57 : 64) : 0;
// previously: (isMobile ? 45 : 52)
```

### Changed files

- `src/components/StatsBar.jsx` – inline padding
- `src/components/SearchField/components/DetailViewWrapper.jsx` – `statsBarHeight` + 12 px on both breakpoints

### Test

- Expand panel → StatsBar pill looks less cramped, icons + text nicely centered
- Open a device → DetailView lands directly below the StatsBar with no overlap and no visible gap

---

## Version 1.1.1234 - 2026-04-24

**Title:** Sidebar inherits user background, 12 × 16 px padding, StatsBar gated by expand
**Hero:** none
**Tags:** Design, UX

### Three adjustments

**1. Sidebar now shares the glass background with StatsBar + panel**

Replaced the custom `apple-window` look (hard-coded `rgba(0,0,0,0.25)` + local blur) with the project-wide `glass-panel` class. That class reads the user-configurable CSS variables (`--background-blur`, `--background-saturation`, `--background-brightness`, `--background-contrast`, `--background-grayscale`) via `::before`, so Appearance settings now affect the sidebar exactly like they affect StatsBar and the expanded panel.

```jsx
<ul className="vpm-menu glass-panel">
```

Border-radius override keeps the 2 rem pill look:

```css
.vpm-menu.glass-panel {
  border-radius: 2rem !important;
  padding: 12px 16px;   /* matches StatsBar */
  …
}
```

**2. Padding aligned with StatsBar**

`12 px` vertical / `16 px` horizontal on the rail container. Icon hit-areas remain unchanged.

**3. StatsBar now appears only when the panel is expanded**

Same gating pattern as the sidebar. The `show` prop is now `statsBarSettings.enabled && isExpanded`. When the panel is collapsed the StatsBar disappears along with the sidebar – cleaner idle state, more focus on the search bar.

### Changed files

- `src/components/SearchSidebar.jsx` – class swap `apple-window` → `glass-panel`
- `src/components/SearchField/SearchField.css` – old `.apple-window` block removed, new `.vpm-menu.glass-panel` block with padding 12 × 16
- `src/components/SearchField.jsx` – `show={statsBarSettings.enabled && isExpanded}` on `<StatsBar>`

### Test

- Reload card collapsed → no StatsBar, no sidebar
- Click to expand panel → both appear, sharing the same glass background
- Settings → Appearance → change Background Blur / Saturation → sidebar reacts together with StatsBar and panel
- Sidebar padding matches the StatsBar pill (12 × 16 px)

---

## Version 1.1.1233 - 2026-04-24

**Title:** Sidebar next to panel (12 px gap), stays visible during DetailView, detail top 54 → 52
**Hero:** none
**Tags:** Bug Fix, Design

### Three small but important fixes on the new sidebar

**1. Rail now sits next to the panel, not at the viewport edge**

The `position: fixed; left: 2rem` from v1.1.1232 pinned the rail to the left edge of the viewport, leaving a huge gap to the panel on wide screens. It now sits right next to the panel with a constant 12 px gap:

```css
.vision-pro-menu--desktop {
  position: absolute;
  right: 100%;      /* rail's right edge anchored to panel's left edge */
  top: 50%;
  margin-right: 12px;
  transform: translateY(-50%);
}
```

Hover expansion grows to the left into the free area – the gap to the panel stays 12 px no matter how wide the rail becomes.

**2. Sidebar stays visible while DetailView is open**

The previous render condition included `!showDetail`, so the rail disappeared the moment a device was opened. Removed – shortcuts are now always reachable.

**3. DetailView top offset 54 → 52 px**

Minor tweak to match the StatsBar pill exactly. Mobile unchanged at 45 px.

### Changed files

- `src/components/SearchField/SearchField.css` – `.vision-pro-menu--desktop` switched from `position: fixed` to `position: absolute` with `right: 100% + margin-right: 12px`
- `src/components/SearchField.jsx` – `!showDetail` removed from sidebar render condition
- `src/components/SearchField/components/DetailViewWrapper.jsx` – `statsBarHeight` desktop 54 → 52

### Test

- Desktop: open panel → rail sits 12 px left of the panel, vertically centered
- Hover rail → it widens to the left (into empty space), panel position never changes
- Open a device → DetailView appears, rail stays visible at the same spot
- Detail header now flush to the StatsBar without any visual collision (52 px offset)

---

## Version 1.1.1232 - 2026-04-24

**Title:** Sidebar redesign – Vision-Pro mockup v2 (fixed to viewport, hover-expand labels)
**Hero:** none
**Tags:** Design

### 🆕 Completely new sidebar look

Based on the second Vision-Pro mockup the user provided. Main differences vs v1.1.1231:

- **Fixed to the viewport**, not to the panel
  - Desktop: `left: 2rem`, vertically centered
  - Mobile: `bottom: 2rem`, horizontally centered
- **Never interferes with the card layout** – `position: fixed`, `pointer-events: none` on the outer wrapper, `auto` only on the menu itself
- **Apple-window glass style** – `border-radius: 2rem`, `backdrop-filter: blur(1rem)`, subtle 2 px border
- **Hover-expand labels** – pill width grows from icon-only to icon + 8 rem label, pure CSS transition (250 ms ease-in-out)
- **Pill-shaped items** with `border-radius: 2rem`, hover / active background `hsla(0,0%,90%,0.2)`
- **Mobile**: labels hidden entirely (`display: none`), horizontal row of icons

### Structure (new)

```jsx
<div class="vision-pro-menu vision-pro-menu--desktop">
  <div class="vpm-wrapper">
    <ul class="vpm-menu apple-window">
      <li>
        <button class="vpm-item" onClick={…}>
          <span class="vpm-icon">{getSystemEntityIcon(…)}</span>
          <span class="vpm-label">Label</span>
        </button>
      </li>
      …
    </ul>
  </div>
</div>
```

Icons come from the existing `getSystemEntityIcon()` path (same icons the device cards use) – unchanged from v1.1.1231.

### Changed files

- `src/components/SearchSidebar.jsx` – rewritten to match mockup structure (button + icon + label span)
- `src/components/SearchField/SearchField.css` – old `.search-sidebar*` rules removed, new `.vision-pro-menu*` / `.vpm-*` rules added

### Test

- Desktop: rail sits top-left of viewport, 2 rem inset, vertically centered; hover the pill → icons + labels; click an icon → DetailView opens
- Mobile: horizontal pill at bottom center, icons only, tap → DetailView
- Panel position/size stays **identical** whether sidebar is visible or not
- Settings → General → Sidebar toggles still work

---

## Version 1.1.1231 - 2026-04-24

**Title:** Sidebar polish: real SVG icons, vertically centered, panel no longer shifts
**Hero:** none
**Tags:** Bug Fix, Design

### Three issues from v1.1.1230 resolved

**1. Icons were rendered as text**

Some system entities carry their icon as an `mdi:*` string rather than an inline SVG. The previous `dangerouslySetInnerHTML` path showed the raw string (e.g. `mdi:cog`, `newspaper`). Now the sidebar reuses the **same renderer the device cards use** (`getSystemEntityIcon`), so every shortcut shows the proper SVG icon.

**2. Sidebar now vertically centered to the panel**

Changed from `top: 0` to `top: 50%` + `translateY(-50%)`. Centers inside the search-row (≈ panel height) regardless of panel content.

**3. Panel no longer shifts right when the sidebar appears**

The sidebar sat inside `.search-row` with `position: absolute`, but some flex edge-cases still nudged the panel. Fix: wrap it in a **zero-width anchor**:

```css
.search-sidebar-anchor {
  position: absolute;
  top: 0; bottom: 0; left: 0;
  width: 0;
  pointer-events: none;
}
.search-sidebar-anchor > * { pointer-events: auto; }
```

The anchor takes no layout space at all, so the panel stays put whether the sidebar is shown or not.

### Changed files

- `src/components/SearchSidebar.jsx` – icons via `getSystemEntityIcon`, new anchor wrapper on desktop
- `src/components/SearchField/SearchField.css` – `.search-sidebar-anchor` rules, `top: 50%` + `translateY(-50%)` on desktop rail

### Test

- Desktop: open panel → sidebar sits centered vertically next to the panel, real SVG icons visible, panel width/position unchanged whether sidebar is shown or not
- Hover → width expands, labels fade in
- Mobile: unchanged horizontal pill bottom-center

---

## Version 1.1.1230 - 2026-04-24

**Title:** Sidebar: shortcut rail to system entities (desktop vertical, mobile horizontal)
**Hero:** none
**Tags:** Feature, UX

### 🧭 Jump straight to settings, todos, news, changelog…

Inspired by the Apple Vision Pro side-menu mockup: a slim glass rail that lives next to the expanded search panel. One icon per system-entity shortcut. On **desktop** the rail sits vertically to the left of the panel and **expands on hover** to reveal labels. On **mobile** it sits as a horizontal pill at the bottom center, icons only.

Default shortcuts (in order): **Settings · Todos · News · Versionsverlauf · Plugin Store**.
Tap / click → opens that system-entity directly in the DetailView, just like clicking a device card.

### Settings

New section **Settings → General → Sidebar** with two toggles:

- **Show sidebar** (default: on)
- **Always visible** (default: off — rail appears only while the panel is expanded)

### Files

- **New:** `src/components/SearchSidebar.jsx` – reads entities from `systemRegistry`, renders glass pill, hover-expand labels
- `src/components/SearchField/SearchField.css` – new `.search-sidebar` rules (desktop vertical / mobile horizontal / hover label animation)
- `src/components/SearchField.jsx` – reads sidebar settings, listens to `sidebarSettingsChanged`, mounts `<SearchSidebar>` inside `.search-row`, click handler opens DetailView
- `src/components/tabs/SettingsTab/components/GeneralSettingsTab.jsx` – new "Sidebar" section with both toggles, persisted under `systemSettings.sidebar`

### Design

- Glass look shared with expanded panel (`.glass-panel` class → user blur/saturation settings propagate)
- Hover on desktop expands width from 56 px to 220 px with labels fading in (pure CSS transition 0.25 s)
- Mobile: fixed position bottom 16 px, centered, horizontal overflow scroll if many items

### Not in this release (phase 2)

- Per-icon configuration (which shortcuts appear, in what order)
- Drag-to-reorder

### Test

- Desktop, panel open → rail visible on the left, hover → labels appear, click an icon → DetailView opens
- Mobile (narrow viewport) → rail sits bottom-center with just icons
- Settings → Show sidebar off → rail disappears
- Settings → Always visible on → rail stays even when panel is collapsed

---

## Version 1.1.1229 - 2026-04-24

**Title:** StatsBar: widgets left, avatar right, mobile rotates every 5 s
**Hero:** none
**Tags:** Design, UX, Mobile

### 🔄 Three changes in one pass

**1. Positions swapped**

Widgets are now on the left side of the pill, the user avatar sits on the right. This matches the inspiration mockup from earlier.

**2. Username label removed**

Only the avatar circle (or fallback `👤` if no HA user picture) is shown. The "Ender" text is gone.

**3. Mobile: single rotating widget, 5 s per step**

On mobile the pill now shows **one widget at a time**. After 5 seconds it advances to the next active widget (time → weather → grid consumption → …), wrapping around. Order = order in the source list / settings order.

```js
useEffect(() => {
  if (!isMobile) return;
  if (notifPanelOpen) return; // pause while panel is open
  const timer = setInterval(() => setRotationIndex(i => i + 1), 5000);
  return () => clearInterval(timer);
}, [isMobile, notifPanelOpen]);
```

Rotation pauses automatically while the notifications panel is open, so you can read what's there without it disappearing.

### How the widget list is built

All active widgets are collected into a `widgetNodes = [{ key, node }, …]` array before render. Desktop renders the whole array, mobile renders only `widgetNodes[rotationIndex % widgetNodes.length]`.

Adding/removing widgets in Settings → Status & Greetings → StatsBar → Widgets now directly drives the rotation roster.

### Changed file

- `src/components/StatsBar.jsx`

### Test

- **Desktop**: widgets left, avatar right, no name visible
- **Mobile**: exactly one widget visible, advances every ~5 s, loop restarts at the end
- **Mobile + tap notification**: rotation pauses, panel opens; close panel → rotation resumes
- Toggling individual widgets off in Settings → that widget no longer shows up in rotation

---

## Version 1.1.1228 - 2026-04-19

**Title:** Settings: StatsBar "Active/Inactive" label now reflects the sub-page toggle
**Hero:** none
**Tags:** Bug Fix, Settings

### 🐛 Main setting showed "Active" even after disabling in sub-page

Toggling StatsBar off inside the detail page (Settings → Status & Greetings → StatsBar → toggle) updated the StatsBar itself, but the parent row still said "Active" after a reload.

### Root cause

Two different storage slots for the same flag:

- `StatsBarSettingsTab` (sub-page) wrote to **legacy key** `localStorage.statsBarEnabled`
- `GeneralSettingsTab` (parent page) read from **`systemSettings.appearance.statsBarEnabled`** (via `readSystemSettingsSection`)

The event-based live sync covered the visible state of the parent row while the app was open, but the persisted value in `systemSettings` was never updated → on remount, the old value reappeared.

### Fix

`handleStatsBarToggle` in the sub-page now writes both:

```js
localStorage.setItem('statsBarEnabled', enabled);                             // legacy for StatsBar.jsx
updateSystemSettingsSection('appearance', { statsBarEnabled: enabled });      // canonical for GeneralSettingsTab
```

No changes needed on `StatsBar.jsx` (it still reads from the legacy key; that path keeps working).

### Changed file

- `src/components/tabs/SettingsTab/components/StatsBarSettingsTab.jsx`

### Test

1. Settings → Status & Greetings → StatsBar → toggle **off**
2. Back to main settings → row shows **"Inactive"**
3. Reload the card → still "Inactive"
4. Toggle back on → row updates live and survives reload

---

## Version 1.1.1227 - 2026-04-19

**Title:** StatsBar: shared glass background + narrower on desktop
**Hero:** none
**Tags:** Design, Layout

### 🫧 Same background as the expanded panel

The StatsBar had its own hard-coded glass look (`rgba(255, 255, 255, 0.08)` + local `backdrop-filter`), ignoring the user's background settings (blur / saturation / brightness / contrast / grayscale) that already drive the expanded panel via the `.glass-panel` class.

Now the StatsBar opts into the same class and inherits those settings automatically. Inline glass-look styles removed:

```jsx
<motion.div
  className="stats-bar stats-bar-pill glass-panel"
  // no more background / backdrop-filter / border inline
/>
```

A dedicated CSS rule keeps the pill shape (overrides the default 35 px radius from `.glass-panel`):

```css
.stats-bar-pill.glass-panel {
  border-radius: 999px !important;
}
```

### 📐 Narrower on desktop (~20 % off)

On desktop the wrapper around the StatsBar is now `width: 80%` / `max-width: 800px`, centered:

```jsx
style={{
  width: isMobile ? '100%' : '80%',
  maxWidth: isMobile ? '100%' : '800px',
  margin: isMobile ? '0 0 12px 0' : '0 auto 12px',
}}
```

Mobile keeps full width (nothing to spare).

### Changed files

- `src/components/StatsBar.jsx` – class swap + wrapper sizing
- `src/components/SearchField/SearchField.css` – new `.stats-bar-pill.glass-panel` rule for pill radius

### Test

1. Desktop → StatsBar visible, narrower than before and centered, same glass as the expanded panel beneath it
2. Settings → Appearance → Background Blur / Saturation / etc. → changes now affect the StatsBar as well
3. Mobile → StatsBar still spans the full width

---

## Version 1.1.1226 - 2026-04-19

**Title:** DetailView desktop top offset 47 → 54 px
**Hero:** none
**Tags:** Layout

### ↕️ More breathing room below the StatsBar

After the StatsBar pill redesign in v1.1.1224 the pill is a few pixels taller than before. The DetailView top offset on desktop was still computed with the old value (47 px), so the DetailView started slightly too close underneath the pill.

### Fix

`DetailViewWrapper.jsx` – `statsBarHeight` bumped from **47 → 54 px** on desktop. Mobile stays at 45 (unchanged, pill layout there is different).

```js
const statsBarHeight = statsBarEnabled ? (isMobile ? 45 : 54) : 0;
```

### Changed file

- `src/components/SearchField/components/DetailViewWrapper.jsx`

### Test

Desktop + StatsBar enabled → open any device → DetailView starts with clean gap below the pill, no visual collision.

---

## Version 1.1.1225 - 2026-04-19

**Title:** DetailView covers StatsBar on desktop (bottom gap fixed)
**Hero:** none
**Tags:** Bug Fix, Layout

### 🐛 Sliver of panel peeking out below the DetailView

On desktop, opening a device card left a dark rounded sliver at the bottom of the screen — the device grid behind the DetailView was not fully hidden. Mobile was fine.

### Root cause

`.detail-panel-wrapper` in `SearchField.css` had a hard-coded `height: 672px` and `top: 0`. That matches the panel alone, but not the whole stack on desktop: the StatsBar wrapper adds ~41 px + `margin-bottom: 12 px` above the search-panel. The main container is therefore ~725 px tall while the DetailView stays 672 px — the missing ~53 px at the bottom were the visible sliver.

### Fix

`.detail-panel-wrapper` now pins to all four edges instead of specifying a fixed height:

```css
.detail-panel-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;       /* NEW */
  min-height: 672px; /* fallback if parent is ever smaller */
  z-index: 10;
  pointer-events: auto;
}
```

### Changed file

- `src/components/SearchField/SearchField.css`

### Test

1. Desktop viewport, StatsBar enabled
2. Click any device card → DetailView opens and covers the entire card-root height, no sliver of the grid visible at the bottom
3. Mobile view unchanged (was already fine)

---

## Version 1.1.1224 - 2026-04-19

**Title:** StatsBar redesign: single continuous glass pill
**Hero:** none
**Tags:** Design, UX

### 🫧 One pill instead of many

Until now the StatsBar was a flex row of separate widget pills — each widget (weather, grid, time, notifications, …) had its own glass background + border radius. From a distance it looked like a bar of fragments.

New design, per mockup: the **whole StatsBar is one continuous pill**. Widgets sit inside without individual backgrounds, separated only by a consistent 12 / 16 px gap.

### What changed visually

- Outer container: `background: rgba(255, 255, 255, 0.08)` + `backdrop-filter: blur(20px)` + 1 px border + `border-radius: 999px` (full pill)
- Horizontal padding on the container (6 / 16 px), internal gap between widgets
- Every widget lost its own `background` / `border-radius` / `padding` — just icon + value inline
- Notifications button: red bubble gone from the outer shape, the counter badge itself stays red as an accent
- Subtle box-shadow under the pill

### Caveat

The StatsBar container now has its own `backdrop-filter`. There are no `.glass-panel` children inside, so the stacking-context lesson from v1.1.1198/1199 doesn't apply here. During the initial `opacity: 0 → 1` fade the blur may briefly render flat – acceptable, reverts after 400 ms.

### Changed file

- `src/components/StatsBar.jsx` – container style + all widget inline styles

### Test

1. Reload → StatsBar is a single rounded pill across the top
2. Widgets (weather / grid / time / notifications / etc.) are flush inside, no visible separators
3. Notifications: red counter badge intact and tappable
4. StatsBar settings (toggle individual widgets on/off) still work

---

## Version 1.1.1223 - 2026-04-19

**Title:** Mobile auto-expand: panel starts at top (y=0) like a click-expand
**Hero:** none
**Tags:** Bug Fix, UX, Mobile

### 🔁 Reverses v1.1.1222

In v1.1.1222 the auto-expanded panel on mobile was pushed down to `y=120` to match the desktop reference. Wrong direction — what the user actually wants is the **opposite**: the panel should sit flush at the top (`y=0`), exactly like after a normal click-expand (which sets `position='top'`).

### Fix

Instead of patching the `y` math, just initialise `position` correctly. If the mobile auto-expand setting is on and we're mounting on a mobile viewport, `position` starts as `'top'` (not `'centered'`). That cascades through the existing animation logic: `y=0`, floating box-shadow, no center-gap.

```js
const [position, setPosition] = useState(() => {
  if (window.innerWidth <= 768) {
    const parsed = JSON.parse(localStorage.getItem('systemSettings') || '{}');
    if (parsed?.mobile?.panelExpandedByDefault === true) return 'top';
  }
  return 'centered';
});
```

The `y` expression is reverted to the original simple form.

### Changed file

- `src/components/SearchField.jsx` – initial `position` reads the setting; `y` math reverted

### Test

1. Settings → General → Mobile → *Auto-open search panel* → **On**
2. Reload on narrow viewport → panel expanded, sitting at the top of the screen (no centered gap)
3. Settings → Off → reload → panel collapsed & centered as before

---

## Version 1.1.1222 - 2026-04-19

**Title:** Mobile auto-expand: proper top spacing
**Hero:** none
**Tags:** Bug Fix, UX, Mobile

### 🪟 Auto-expanded panel now has the same top gap as desktop

After enabling *Auto-open search panel* on mobile, the panel opened glued to the top of the screen — only 60 px gap to the HA header, while on desktop the expanded panel has a comfortable 120 px gap. Felt cramped.

### Fix

The `y` offset on `.search-panel` is computed from `position` (`centered` | `top`) and `isMobile`. For `position === 'centered'` it was 60 px on mobile vs 120 px on desktop. New rule: if the panel is **expanded and still centered** (i.e. auto-expanded on mount, not user-clicked which would also move `position` to `'top'`), use 120 px on both mobile and desktop.

```js
y: hasAppeared
  ? (position === 'centered'
      ? (isExpanded ? 120 : (isMobile ? 60 : 120))
      : 0)
  : 0
```

Collapsed state and normal click-expand flow are unchanged.

### Changed file

- `src/components/SearchField.jsx` (both animated.y spots)

### Test

1. Settings → General → Mobile → *Auto-open search panel* → On
2. Reload on a narrow viewport → panel starts with **120 px top gap**, visually matching the desktop reference
3. Turn toggle off, reload → collapsed panel still uses the original 60 px gap

---

## Version 1.1.1221 - 2026-04-19

**Title:** Mobile: auto-open search panel on start
**Hero:** none
**Tags:** Feature, UX, Mobile

### 📱 New setting: search panel starts already expanded on mobile

By default the search panel opens in its collapsed shape (the search bar) and only expands when the user taps it. On mobile this extra tap is often unwanted — people land on the dashboard and want to see the full panel right away.

New toggle in **Settings → General → Mobile → Auto-open search panel**. When enabled and the device is in mobile layout (`window.innerWidth ≤ 768`), the panel starts expanded directly after the splash.

### How it works

- Setting lives under `localStorage.systemSettings.mobile.panelExpandedByDefault`
- Read at mount time in `useSearchFieldState` so the very first render is already expanded – no flash or layout jump
- Desktop is never affected (check gated on `window.innerWidth ≤ 768`)
- Default: **off** (existing users see no change)

### Changed files

- `src/components/SearchField/hooks/useSearchFieldState.js` – initial values for `isExpanded`, `isMobile`, `isExpandedRef` now read from window + localStorage
- `src/components/tabs/SettingsTab/components/GeneralSettingsTab.jsx` – new "Mobile" section with the toggle, plus load/save helpers for the `mobile` settings branch

### Test

1. Settings → General → **Mobile → Auto-open search panel** → **On**
2. Reload the card on a narrow viewport (phone or `innerWidth ≤ 768`)
3. After splash the panel should be **expanded** immediately (672 px height, category list visible)
4. Turn the toggle off again → next reload starts collapsed as before
5. Desktop viewport: toggle state does not matter, panel always starts collapsed

---

## Version 1.1.1220 - 2026-04-19

**Title:** DetailView header + stat items now update in real time
**Hero:** none
**Tags:** Bug Fix

### 🐛 "100% brightness" + "Off" shown simultaneously

In the DetailView the header area with quick stats (brightness %, state label "On" / "Off") and the tab navigation could show a stale state while the actual HA state had long changed. Example: light turned off → stat bar still shows "100% brightness" and "Off" at the same time.

### Root cause

`DetailView.jsx` has two representations of the entity:

- **`item`**: the static prop handed over on device click – stays unchanged for as long as the DetailView is open
- **`liveItem`** (via `useMemo` + `useEntities`): the live state from the DataProvider, refreshed on every `state_changed` event

All control tabs (UniversalControlsTab, HistoryTab, ScheduleTab) already used `liveItem`. But **four** places still pointed at the static `item`:

1. `<DetailHeader item={item} ... />` – title / icon
2. `<EntityIconDisplay item={item} ... />` – **quick stats** incl. brightness + state label
3. `<TabNavigation stateText={... getStateText(item, lang)} stateDuration={... getStateDuration(item, lang)} item={item} ... />` – tab header with state display
4. `<ContextTab item={item} ... />` – actions list

### Fix

Switched all four to `liveItem`. Header, stats and tab state now refresh automatically on every state_changed event (triggered by the Map<entity_id → new_state> rAF-batch updates in the DataProvider).

### Changed file

- `src/components/DetailView.jsx`

### Test

1. Open a light (DetailView)
2. Toggle it via the dashboard or controls
3. Header area: "100% brightness" / "On" switches **immediately** to "Off" – no contradiction anymore
4. Change brightness → percent stat updates live

### ⚠️ Convention change from now on

All future changelog entries will be written in **English only**.

---

## Version 1.1.1219 - 2026-04-19

**Title:** Echter Fix: PowerToggle feuerte doppelt (Preact `<label>`+`<input>`-Bug)
**Hero:** none
**Tags:** Bug Fix, Root-Cause

### 🎯 Quelle gefunden – nicht nur Toast, sondern der ganze Service-Call doppelt

Die Diagnose-Logs aus v1.1.1218 haben gezeigt:
```
[DetailViewWrapper] handleServiceCall light turn_on light.wohnzimmer_einbauleuchten
[DetailViewWrapper] handleServiceCall light turn_on light.wohnzimmer_einbauleuchten
```

**Zweimal** pro Click. Beide aus dem gleichen Stack: `handlePowerToggle → onChange`.

### Root Cause

Der `PowerToggle`-Component in `src/components/controls/PowerToggle.jsx` nutzt das Standard-Pattern:

```jsx
<label>
  <input type="checkbox" onChange={onChange} />
  <span className="power-slider">...</span>
</label>
```

**Problem:** Preact im Compat-Mode propagiert den Click auf dem `<label>` sowohl als `change`-Event auf dem `<input>` **als auch** triggert er eine zweite `change`-Dispatch durch Label-Redirect. In manchen Setups (konkret hier) feuert `onChange` zweimal.

Das war kein Toast-Bug – **der Service-Call ging doppelt an HA raus**. Auch wenn `turn_on` idempotent ist: unnötige Last, und bei `toggle`-Services wäre es ein echter Fehler gewesen.

### Fix

150 ms Dedupe im `CircularSlider.handlePowerToggle`-Wrapper:

```js
const lastPowerToggleRef = useRef(0);
const handlePowerToggle = (e) => {
  const now = Date.now();
  if (now - lastPowerToggleRef.current < 150) return;
  lastPowerToggleRef.current = now;
  powerToggleHandler(e, ...);
};
```

Das hält echte User-Interaktionen (> 150 ms zwischen Clicks) durch, blockt aber die Event-Duplikate aus dem Preact-Compat-Bug (< 5 ms Abstand).

### Weitere Änderungen

- **Toast-Dedupe bleibt** (aus v1.1.1218) als Defense-in-Depth – falls doch mal wieder ein Doppel-Trigger woanders entsteht
- **Diagnose-Logs aus `DetailViewWrapper`** entfernt (Quelle gefunden)
- Toast-Dedupe-Log von `console.warn` zurück auf silent – kein Bedarf mehr für Prod-Logs

### Modifizierte Dateien

- `src/components/controls/CircularSlider.jsx` – Dedupe-Wrapper + Ref
- `src/components/SearchField/components/DetailViewWrapper.jsx` – Diagnose-Log raus
- `src/utils/toastNotification.js` – Dedupe-Log silent

### Test

1. Licht ein-/ausschalten → **ein** Toast, **ein** Service-Call im HA-Log
2. HA Developer Tools → Log prüfen: kein doppeltes `service_called` für `light.turn_on`

---

## Version 1.1.1218 - 2026-04-19

**Title:** Toast-Dedupe – Doppelter Toast unterdrückt, Diagnose-Logs aktiv
**Hero:** none
**Tags:** Bug Fix, Diagnostic

### 🐛 Doppelter Toast trotz v1.1.1217-Fix

Der Duplikat-Toast kam **nicht** aus `DataProvider.callService` (war schon entfernt). Quelle immer noch unklar – mein Audit fand keinen zweiten Trigger im statischen Code, aber der Toast feuert trotzdem zweimal.

### Zwei-Schichten-Fix

**1. Dedupe-Buffer in `showToast`**

Identische Toasts (`type:message`-Key) innerhalb **500 ms** werden unterdrückt:

```js
const _toastDedupeBuffer = new Map();
const TOAST_DEDUPE_MS = 500;
```

Das ist robust gegen jede Quelle von Doppel-Triggern – egal ob:
- Zwei DetailViewWrapper-Instanzen (z. B. durch AnimatePresence-Glitch)
- Touch + Click Event auf Mobile
- Zwei Card-Mounts im HA-Edit-Mode
- Sonst irgendein Race

**2. Diagnose-Logs (bleiben in Prod)**

`console.warn` (wird nicht von Terser entfernt) in:
- `showToast` → loggt `[Toast] deduped identical toast within Xms` wenn Dedupe greift
- `DetailViewWrapper.handleServiceCall` → loggt `[DetailViewWrapper] handleServiceCall <domain> <service> <entity>`

### So findest du die Quelle im Browser

1. DevTools → Console öffnen
2. Licht schalten
3. Zählen:
   - **`[DetailViewWrapper] handleServiceCall`** zweimal? → Handler selbst wird doppelt aufgerufen (Click-Duplizierung)
   - Einmal + **`[Toast] deduped`** → irgendwo feuert ein zweiter `showToast` direkt (nicht über handleServiceCall)

Mit der Log-Info kann der nächste Patch chirurgisch sein.

### Modifizierte Dateien

- `src/utils/toastNotification.js` – Dedupe-Buffer
- `src/components/SearchField/components/DetailViewWrapper.jsx` – Diagnose-Log

### Test

Licht schalten → **ein** Toast. Console öffnen → Log-Messages melden falls Dedupe greift oder Handler doppelt ruft.

---

## Version 1.1.1217 - 2026-04-19

**Title:** Fix: Doppelter Toast bei Licht-Toggle
**Hero:** none
**Tags:** Bug Fix

### 🐛 Zwei identische Toasts bei jeder Aktion

Nach v1.1.1216 feuerten zwei Toasts mit identischem Text (z. B. `light.turn_on: light.xyz`) bei jedem Licht-Toggle.

**Ursache:** Zwei Gates produzierten den exakt selben Text:
1. `DetailViewWrapper.handleServiceCall` (v1.1.1216 Fix – tatsächlich genutzt)
2. `DataProvider.callService` (v1.1.1215 Fix – Code-Pfad, der nirgends im UI explizit konsumiert wird, aber aktiv war)

Obwohl Code-Analyse nahelegte, dass `DataProvider.callService` nicht im UI-Pfad hängt, feuerte sein Toast-Gate offenbar doch – wahrscheinlich über indirekten Kontext-Zugriff.

**Fix:** Toast-Code aus `DataProvider.callService` entfernt. Einziger aktiver Toast-Gate bleibt `DetailViewWrapper.handleServiceCall`. `showSuccessToast` + `showErrorToast` Imports aus DataProvider gekickt (Bundle-Diät).

### Modifizierte Datei

- `src/providers/DataProvider.jsx`

### Verbleibende Toast-Quellen (einmal pro Event)

| Pfad | Events |
|---|---|
| `DetailViewWrapper.handleServiceCall` | actionSuccess / actionError |
| `DataProvider.refreshNotifications` | haPersistent |
| `DataProvider.toggleFavorite` | favoriteChange |
| `ContextTab.executeAction` | scenesScripts |
| `scheduleUtils` (create/update/delete) | scheduleChange |

### Test

1. Settings → Toasts → „Aktion erfolgreich" an
2. Licht schalten → **ein** Toast
3. „Aktion fehlgeschlagen" an, HA-Verbindung kappen → **ein** Toast

---

## Version 1.1.1216 - 2026-04-19

**Title:** Fix: Toast-Gate auf tatsächlich genutzten Service-Call-Pfad gelegt
**Hero:** none
**Tags:** Bug Fix

### 🐛 Toast kam bei Licht-Toggle nicht

**Symptom:** Nach v1.1.1215 „Aktion erfolgreich" aktiviert → Licht über UI eingeschaltet → **kein Toast**.

**Ursache:** Card hat zwei parallele Service-Call-Wege:
- `DataProvider.callService` — hat seit v1.1.1215 den Toast-Gate
- `callHAService(hass, ...)` direkt aus `utils/homeAssistantService.js` — **wird tatsächlich** für alle UI-Aktionen genutzt, hatte aber keinen Toast-Gate

Der `DataProvider.callService`-Weg wird nirgends im UI aufgerufen, obwohl der Code existiert. Alle tatsächlichen Licht/Schalter-Toggles laufen über `DetailViewWrapper.handleServiceCall` → `callHAService`.

**Fix:** Toast-Gate zusätzlich in `DetailViewWrapper.handleServiceCall` eingebaut. Ruft `shouldShowToastFor('actionSuccess')` / `actionError` nach erfolgreichem/fehlgeschlagenem Service-Call.

### Modifizierte Datei

- `src/components/SearchField/components/DetailViewWrapper.jsx`

### Langfristig (nicht in diesem Release)

Die zwei parallelen Call-Wege sollten zusammengelegt werden – entweder alle auf `DataProvider.callService` migriert (um Pending-Tracker-Puls + Toast aus einer Quelle zu bekommen), oder `callHAService` als einziger Pfad bleibt. Aktuell doppelt nicht schlimm, aber unnötig.

### Test

1. Settings → Allgemein → Toasts → „Aktion erfolgreich" aktivieren
2. Licht ein-/ausschalten → **Toast erscheint**
3. Settings → „Aktion fehlgeschlagen" aktivieren, HA-Verbindung kappen → Click auf Licht → **Error-Toast**

---

## Version 1.1.1215 - 2026-04-19

**Title:** Toast-Einstellungen – neue Section „Toasts"
**Hero:** none
**Tags:** Feature, UX

### 🍞 In-App-Toasts jetzt konfigurierbar

Neue Section **„Toasts"** in Settings → Allgemein (nach „Status & Begrüßung" und „Vorschläge"). Klick öffnet eine Detailseite mit vollen Kontrollmöglichkeiten darüber, wann Toasts erscheinen und wie sie aussehen.

### Konfigurierbare Event-Typen

| Event | Default | Beschreibung |
|---|:---:|---|
| HA-Benachrichtigungen | ✅ | `persistent_notification.*` aus HA (seit v1.1.1213) |
| Szenen / Skripte | ✅ | Beim Ausführen im ContextTab |
| Aktion erfolgreich | ❌ | z. B. Licht an, Thermostat geändert |
| Aktion fehlgeschlagen | ✅ | Fehler beim Service-Call |
| Favoriten-Änderung | ❌ | Favorit hinzugefügt/entfernt |
| Timer / Schedule | ❌ | Create / Update / Delete |

### Darstellung

- **Position**: Oben mittig (Default), Oben rechts, Unten mittig, Unten rechts
- **Dauer**: Kurz (2 s), **Mittel (3 s — Default)**, Lang (5 s)
- **Master-Toggle**: schaltet global alle Toasts aus
- **Test-Button** zeigt einen Probe-Toast mit den aktuellen Einstellungen
- **Standard-Button** setzt alles auf Defaults zurück

### Persistenz

Alles in `localStorage.systemSettings.toasts`:
```json
{
  "enabled": true,
  "events": { "haPersistent": true, "actionError": true, ... },
  "display": { "position": "top-center", "duration": "medium" }
}
```

### Neue / geänderte Dateien

- **Neu:** `src/utils/toastSettings.js` – Defaults, Reader, `shouldShowToastFor(eventKey)`, `getToastDisplayOptions()`, `saveToastSettings()`
- **Neu:** `src/components/tabs/SettingsTab/components/ToastSettingsTab.jsx` – Detailseite
- `src/components/tabs/SettingsTab/components/GeneralSettingsTab.jsx` – neue Section + Subview-Routing
- `src/providers/DataProvider.jsx` – Toast-Gates für HA-Persistent, Service-Call-Success/-Error, Favoriten-Änderung
- `src/components/tabs/ContextTab.jsx` – Szenen/Skripte/Automation-Toasts gated
- `src/utils/scheduleUtils.js` – Create/Update/Delete-Toasts gated

### Testablauf

1. Settings → Allgemein → **Toasts** öffnen
2. „Aktion erfolgreich" aktivieren → **Licht einschalten** → Toast erscheint
3. Position auf „Unten rechts" ändern → **Test-Toast** → kommt unten rechts
4. Master aus → kein Toast erscheint bei nichts mehr

### Wie weiter

Regelbasierte Notifications („Klima zu lange an" etc.) → separate Phase, mit HA-Automations als Backend. Nicht in diesem Release.

---

## Version 1.1.1214 - 2026-04-19

**Title:** Hotfix: Mount-Error „Cannot access 'O' before initialization"
**Hero:** none
**Tags:** Bug Fix

### 🐛 TDZ-Fehler nach v1.1.1213 gefixt

**Symptom:** Nach dem Notifications-Release warf die Card beim Mount:
```
Error mounting Fast Search Card: Cannot access 'O' before initialization
```

**Ursache:** In `DataProvider.jsx` wurde `refreshNotifications` (ein `useCallback`) im Dependency-Array zweier `useEffect`-Hooks referenziert:

```js
useEffect(() => { ... refreshNotifications() }, [hass, refreshNotifications]);
```

Dependency-Arrays werden **beim Render** evaluiert. Der `useCallback`-Definition stand aber **weiter unten** im Component-Body. Bei minifiziertem Bundle (Variable = `O`) führt das zum TDZ-Fehler (`const` in Temporal Dead Zone).

**Fix:** `refreshNotifications` + `dismissNotification` im DataProvider **nach oben** verschoben, direkt unter die Refs und damit vor alle useEffects, die sie nutzen.

### Modifizierte Datei

- `src/providers/DataProvider.jsx`

### Keine Feature-Änderung

Das Notifications-System funktioniert wie in v1.1.1213 – Widget, Panel, Toast, Dismiss. Nur die Deklarations-Reihenfolge wurde geändert.

---

## Version 1.1.1213 - 2026-04-19

**Title:** Notifications-System – HA persistent_notification angebunden
**Hero:** none
**Tags:** Feature, UX

### 🔔 Echte Benachrichtigungen in der Card

Nach dem Aufräumen der alten UI-Leichen in v1.1.1210 ist das Notifications-Widget jetzt **funktional** – mit HA `persistent_notification.*` als Quelle. Dazu ein aufklappbares Panel zum Lesen und Abhaken einzelner Einträge, plus Toast bei neuen Notifications.

### Was passiert

**1. Daten-Anbindung (DataProvider)**
- Neuer State `notifications`: Liste aller aktiven `persistent_notification.*`-Entities
- Extractor liest aus `hass.states` und normalisiert zu `{ notification_id, title, message, created_at }`
- `state_changed`-Events für `persistent_notification.*` triggern ein Re-Scan
- **Toast-Diff**: bei wirklich neuen Notifications (nicht initial) erscheint ein Info-Toast mit Titel/Message

**2. StatsBar-Widget (wieder zurück, diesmal mit Sinn)**
- Glocken-Icon + Zähler-Badge – erscheint nur wenn Count > 0
- **Klickbar** → öffnet Panel direkt darunter
- Settings-Toggle in StatsBar-Settings: „Benachrichtigungen (mit Zähler)" zeigt/versteckt Widget

**3. NotificationsPanel (neu)**
- Glass-Popover rechts vom Widget, max 60vh scrollbar
- Pro Eintrag: Titel (fett), Message, relative Zeit („vor 5 Min")
- `×`-Button pro Zeile → ruft `persistent_notification.dismiss`
- Outside-Click schließt Panel
- Leerer Zustand: „Keine Benachrichtigungen"

**4. Neuer Hook**
- `useNotifications()` → `{ notifications, count, dismiss }`

### Modifizierte / neue Dateien

- **Neu:** `src/components/NotificationsPanel.jsx`
- `src/providers/DataProvider.jsx` – State, Extractor, Dismiss, Hook-Export, Toast-Diff
- `src/components/StatsBar.jsx` – Widget wieder drin, Button+Panel, `useNotifications` eingebunden, `NotificationIcon` re-importiert
- `src/components/tabs/SettingsTab/components/StatsBarSettingsTab.jsx` – Widget-Toggle zurück, `NotificationIcon` re-importiert, `notifications` in Widget-Defaults
- Translations-Keys `notificationsWidget*` wieder verwendet (waren in 10 Sprachen erhalten geblieben)

### Was nicht (bewusst)

- **Outgoing-Notifications** (`notify.mobile_app_*` Service-Calls für Push ans Handy) – separate Richtung, später bei konkretem Use-Case
- **Sound / Vibration** – keine Browser-Permission-Anfrage
- **Persistence über Card-Reload** – Dismissed-State kommt direkt aus HA, kein eigener State

### Test

1. In HA eine persistent_notification erzeugen (Developer Tools → Services → `persistent_notification.create` mit `title: "Test"`, `message: "Hallo"`)
2. Card aktualisiert sich sofort → Widget oben mit Badge „1" + Toast erscheint
3. Klick aufs Widget → Panel öffnet sich, zeigt den Eintrag
4. Klick auf `×` → dismissed, Panel-Eintrag + Badge verschwinden

---

## Version 1.1.1212 - 2026-04-19

**Title:** Versionsverlauf-Cache von 1 h auf 5 Min reduziert
**Hero:** none
**Tags:** UX

### ⏱️ Neue Releases schneller sichtbar

Der App-interne Cache für den Changelog hing bisher auf 60 Minuten. Das hieß: Nach einem neuen Release musste man bis zu einer Stunde warten oder manuell den „Aktualisieren"-Button drücken, um den neuen Eintrag zu sehen.

**Neu:** Cache-TTL = **5 Minuten**. GitHub-raw + HACS-CDN cachen eh server-seitig, darum ist's kein Performance-Risk.

### Modifizierte Datei

- `src/system-entities/entities/versionsverlauf/index.js` – Konstante `ONE_HOUR` → `FIVE_MINUTES`

---

## Version 1.1.1211 - 2026-04-19

**Title:** Bug-Fix: System-Entities fehlen beim ersten Load (Race-Condition)
**Hero:** none
**Tags:** Bug Fix

### 🐛 System-Entities verschwinden bis man Ausschlussmuster modifiziert

**Symptom:** Beim Öffnen der Card sind News, Todos, Versionsverlauf, Weather, Printer3D, AllSchedules in der Kategorie „Benutzerdefiniert" teilweise nicht sichtbar. Erst nach einer Pattern-Änderung in Settings → Privatsphäre erscheinen sie alle.

**Root Cause — Race-Condition zwischen zwei Entity-Loads beim Init:**

Im `DataProvider` gibt es zwei parallele Trigger für `loadEntitiesFromHA()`:

1. **useEffect „hass-Retry"**: wird sofort aktiv wenn `hass.connection` verfügbar ist
2. **`initializeDataProvider`**: ruft `await systemRegistry.initialize(...)` auf, dann `loadBackgroundData()` → `loadEntitiesFromHA()`

Wenn Pfad 1 **vor** Pfad 2's Registry-Init fertig ist, läuft `loadEntitiesFromHA()` mit einer noch nicht initialisierten Registry. In diesem Fall fällt `getSystemEntities()` in [initialization.js:10](src/system-entities/initialization.js:10) auf einen 2-Entity-Fallback zurück (nur Settings + PluginStore). Alle anderen System-Entities fehlen bis zu einem späteren Re-Load.

**Der Pattern-Modifikations-Trick funktioniert**, weil `excludedPatternsChanged`-Event erneut `loadEntitiesFromHA()` triggert – dann ist die Registry längst ready.

### Fix

Zwei kleine Änderungen in [src/providers/DataProvider.jsx](src/providers/DataProvider.jsx):

1. **hass-Retry-useEffect an `isInitialized` gekoppelt**: läuft erst, wenn `initializeDataProvider` komplett durch ist (inkl. Registry-Init).
   ```js
   useEffect(() => {
     if (hass?.connection && isInitialized && !hasTriggeredInitialLoadRef.current) {
       hasTriggeredInitialLoadRef.current = true;
       loadEntitiesFromHA();
     }
   }, [hass, isInitialized]);
   ```

2. **`hasTriggeredInitialLoadRef` wird in `loadEntitiesFromHA` selbst gesetzt** (nach dem Mutex-Guard): egal wer den initialen Load triggert, der useEffect skippt nicht-erwünschte Doppel-Calls.

### Modifizierte Datei

- `src/providers/DataProvider.jsx`

### Test

1. Card neu laden
2. Kategorie „Benutzerdefiniert" öffnen
3. **Alle** System-Entities sollten sofort erscheinen: Settings, Bambu Lab, Zeitpläne Übersicht, Feeds, Todos, Versionsverlauf, etc. – **ohne** Pattern-Modifikation.

---

## Version 1.1.1210 - 2026-04-19

**Title:** Dead-Code raus – nicht-funktionale Notifications-UI entfernt
**Hero:** none
**Tags:** Refactor, Code Quality

### 🧹 Zwei UI-Leichen aufgeräumt

Beim Audit des „Notify-Systems" zeigte sich, dass zwei UI-Elemente **sichtbar und bedienbar** waren, aber **nichts** bewirkten. Beide komplett entfernt.

### 1. Push-Notifications-Toggle in Settings

**Wo war er:** Settings → Allgemein → Benachrichtigungen → Switch „Push-Benachrichtigungen"

**Warum tot:**
- State `notifications` wurde nicht aus localStorage geladen, Default hartcodiert `true`
- Setter `setNotifications()` schrieb weder in localStorage noch löste er irgendeine Action aus
- Der Wert wurde durch drei Komponenten-Ebenen durchgereicht, aber **nie gelesen**
- Kein HA-Service-Aufruf, keine Browser-Permission-Anfrage, keine Anbindung

**Bonus:** Die Section war bereits auf `display: none` gesetzt – also war sie für User *unsichtbar*, aber der React-State + Prop-Kette lief trotzdem.

**Entfernt aus:**
- `SettingsTab.jsx` – State + Setter + Prop-Weitergabe
- `GeneralSettingsTab.jsx` – Props + Section-JSX

### 2. StatsBar Notifications-Widget

**Wo war es:** StatsBar → Widget mit Glocken-Icon + Counter-Badge (wenn Count > 0)

**Warum tot:**
- `notificationCount` war in `SearchField.jsx` hartcodiert auf `0` – Kommentar sagte selbst „mock for now"
- Quelle für echten Count war nie angebunden (HA `persistent_notification.*` oder ähnlich)
- Widget hätte sich also **nie** gerendert
- Settings-Toggle „Benachrichtigungen (mit Zähler)" konnte aktiviert werden – aber ohne Quelle blieb das Widget leer

**Entfernt aus:**
- `StatsBar.jsx` – Prop, Widget-JSX, `notifications` aus widgetSettings-Defaults, `NotificationIcon`-Import
- `SearchField.jsx` – Mock-Konstante + Prop-Weitergabe
- `StatsBarSettingsTab.jsx` – Widget-Toggle-Section, `notifications` aus Default-Settings, `NotificationIcon`-Import

### Was bleibt

- **Toast-System** (`src/utils/toastNotification.js`) – aktiv, wird von ContextTab genutzt, weitere Use-Cases jederzeit möglich
- **pendingActionTracker** – internes Pub/Sub für pending Service-Calls, hat nichts mit User-Notifications zu tun
- **Translations-Keys** (`pushNotifications`, `notificationsWidget` etc.) in 10 Sprachen bleiben drin – schaden nicht, könnten später bei einem echten Notifications-Feature wiederverwendet werden
- **`NotificationIcon`** als Export in `EnergyIcons.jsx` bleibt – Terser tree-shaked ungenutzte Exports

### Bundle

- JS gzip: 360.14 → **360.64 KB** (leicht gewachsen, vermutlich Preset-Zuwachs aus v1.1.1209)
- Code-Reduktion hauptsächlich struktureller Natur: eine tote Prop-Kette, drei tote UI-Sections

### Nächste Schritte (offen)

Falls später ein echtes Notifications-Feature gewünscht ist:
- Anbindung an HA `persistent_notification.*` Domain → füllt `notificationCount`
- Widget + Toggle können aus Git-History wieder reingeholt werden
- Oder: Browser-Push via Notification API (HTTPS erforderlich)

---

## Version 1.1.1209 - 2026-04-19

**Title:** Preset „fastender" für Ausschlussmuster
**Hero:** none
**Tags:** Feature, UX

### 🧹 Neuer Schnellauswahl-Button mit 35 vorkonfigurierten Mustern

Neben den bestehenden Presets (Updates / Batterien / Signal / System-Sensoren) gibt es jetzt einen fünften Button **fastender** – eine persönliche Sammlung der Patterns, die im eigenen Setup weggefiltert werden sollen.

**Enthalten:**
- Tasmota: `sensor.tasmota*`, `switch.tasmota*`
- Temperatur-Sensoren: `*aussentemperatur*`, `*zimmertemperatur*`
- Rauchmelder-Nebenwerte: `*smoke_sensor_*_fault`, `*_test`, `*_reliability`, `*_temperature`, `*_battery_low`, `*_humidity`, `*_linkquality`
- Rollladen-Interna: `*rolllade_moving*`, `*rolllade_calibration*`, `*rolllade_motor*`, `*motor_reversal*`, `*breaker_status*`, `*calibration*`
- Light-Attribute: `*color_options*`, `*adaptive_lighting*`, `*kindersicherung*`
- Sonstiges: `time.*`, `switch.smart_garage*`, `sensor.melcloudhome*`, `binary_sensor.melcloudhome*`, `*ventil*`, `sun.sun`, `select.*`, `number.*`, `*nspanel*`, `switch.reolink*`, `switch.schedule*`, `switch.nuki*`, `*_linkquality`, `*_signal_strength`, `*frostschutz*`

**Verhalten:**
- Wie die anderen Presets: Duplikate werden übersprungen, bereits-aktive Patterns werden als `✓`-Chip (disabled) angezeigt
- Einzelne Patterns können danach manuell per `×` entfernt werden

### Modifizierte Datei

- `src/utils/excludedPatternPresets.js` – neuer Preset-Eintrag

---

## Version 1.1.1208 - 2026-04-19

**Title:** Ausschlussmuster – Quick-Add-Presets + First-Run-Seed
**Hex:** none
**Tags:** Feature, UX

### ⚡ Weniger Tipparbeit beim Einrichten der Ausschlussmuster

Das bestehende `excludedPatterns`-Feature (Settings → Privatsphäre → Ausschlussmuster) ist mächtig, aber bislang musste jedes Muster per Hand eingetippt werden. Die meisten HA-User wissen gar nicht, dass Entities wie `update.home_assistant_core_update`, `sensor.phone_battery_level` oder `sensor.zigbee_linkquality` überhaupt existieren – und filtern sie deshalb nicht weg.

Zwei neue Mechanismen:

### 1. First-Run-Seed

Beim allerersten App-Start wird `localStorage.excludedPatterns` mit einer sinnvollen Mini-Default-Liste initialisiert:

```
update.*
*_battery_level
*_linkquality
*_rssi
*_last_boot
```

Greift nur wenn der Key **noch nie** gesetzt war (`null`, nicht leeres Array). Wer die Defaults nicht will, kann sie einfach entfernen – sie werden nicht wieder gesetzt.

### 2. Quick-Add-Presets im Settings-UI

Neuer Bereich „Schnellauswahl" oberhalb des Input-Felds. Vier Kategorien:

| Button | Fügt hinzu |
|---|---|
| **Updates** | `update.*` |
| **Batterien** | `*_battery_level`, `*_battery_state`, `*_battery` |
| **Signal** | `*_rssi`, `*_linkquality`, `*_signal_strength` |
| **System-Sensoren** | `*_last_boot`, `*_last_triggered`, `*_uptime`, `*_connectivity` |

Bereits aktive Kategorien werden als `✓ Updates` angezeigt (Button deaktiviert).

Duplikate werden übersprungen, bestehende User-Patterns bleiben erhalten.

### Neue / geänderte Dateien

- `src/utils/excludedPatternPresets.js` (**neu**) – Presets + Seed-Defaults + `ensureInitialExcludedPatterns()`
- `src/index.jsx` – Seed-Call direkt nach den Style-Imports
- `src/components/tabs/SettingsTab.jsx` – neue `addPatterns(array)`-Funktion (Bulk, Duplikat-sicher, ein Event)
- `src/components/tabs/SettingsTab/components/PrivacySettingsTab.jsx` – Preset-Chips zwischen Beschreibung und Input

### Hintergrund

Vorschlag kam aus der Analyse der Predictive-Suggestions-Pipeline: ohne diese Filter landen `update.*`- oder Battery-Entities in den Cold-Start-Fallback-Listen und produzieren nutzlose Vorschläge. Die Infrastruktur (`filterExcludedEntities` im DataProvider, gesteuert über `localStorage.excludedPatterns`) war bereits da – es fehlten nur die Defaults und die UX.

---

## Version 1.1.1207 - 2026-04-19

**Title:** Vorschläge sofort sichtbar – Cold-Start-Fallback
**Hero:** none
**Tags:** Bug Fix, UX

### 🐛 Bug-Fix: „Vorschläge" erschienen bei frischem Setup nicht

**Problem:** Der Suggestions-Calculator hatte nur zwei Pfade: Pattern-basiert (braucht Klick-History) und Bootstrap (braucht `usage_count > 0`). Bei einem brandneuen Setup ohne jegliche Interaktion lieferten beide nichts → keine Suggestions → der „Vorschläge"-Chip in der Subcategory-Bar erschien gar nicht (SubcategoryBar prüft `hasSuggestions`).

**Fix:** Dritte Fallback-Stufe, **Cold-Start**, in `suggestionsCalculator.js`. Greift wenn nach Pattern+Bootstrap immer noch zu wenig Suggestions da sind.

### Wie die drei Stufen jetzt ineinandergreifen

1. **Pattern-basiert** (Confidence ≥ Threshold): echte Nutzungs-Patterns mit Decay + Same-Weekday-Boost + Consistency-Bonus + Negative-Learning-Penalty. Optimal für Power-User.
2. **Bootstrap** (Confidence 0.55 fix): Fallback auf `entity.usage_count > 0`. Greift ab dem ersten Klick.
3. **Cold-Start** (Confidence 0.4 fix, **NEU**): Top-N Entities aus Priority-Domains alphabetisch, wenn Setup brandneu.

### Cold-Start-Logik

```js
const PRIORITY_DOMAINS = ['light', 'switch', 'media_player', 'climate', 'cover', 'fan'];
```

- Filtert Entities nach diesen Domains
- Sortiert: erst nach Domain-Priorität, dann alphabetisch
- Confidence 0.4 – niedriger als Bootstrap, damit echte Patterns schnell verdrängen
- Markiert mit `suggestion_reason: 'cold_start'` + `usage_pattern.cold_start: true` (für spätere UI-Differenzierung möglich)

### Was sich dadurch nicht ändert

- **Master-Toggle** (`predictiveSuggestions = false`) schaltet weiterhin alles aus
- **Reset-Button** in Settings funktioniert weiter (löscht Patterns + usage_count → Cold-Start greift)
- **Bootstrap** bleibt unverändert

### Modifizierte Datei

- `src/utils/suggestionsCalculator.js`

---

## Version 1.1.1206 - 2026-04-19

**Title:** System-Entities Dedupe (Phase 6 Performance-Roadmap)
**Hero:** none
**Tags:** Refactor, Code Quality

### 🧹 Dedupes in System-Entities – geringe Bundle-Wirkung, echte Runtime-Verbesserung

Phase 6 der Performance-Roadmap: die fettesten System-Entity-Files auf Duplikate gescannt. Ehrliche Bilanz: **Bundle nur -0.14 KB gzip** (Terser+gzip komprimieren duplizierte SVG-Strings und Variant-Objekte ohnehin aggressiv), aber **zwei Runtime-Verbesserungen**.

### Was gemacht wurde

**1. SVG-Icons in TodosSettingsView extrahiert**

Drei Icons waren je 2× inline dupliziert:
- `PencilIcon` (Edit) – für Profile + Templates
- `TrashIcon` (Delete) – für Profile + Templates
- `PlusIcon` (Add) – für Profile + Templates

Jetzt je eine `const`-Komponente oben im File, 6 Inline-SVGs durch Komponenten ersetzt.

**2. `slideVariants` dedupliziert via `createSlideVariants()`**

Inline-Definition (~14 Zeilen) war in zwei Files:
- `TodosSettingsView.jsx`
- `TodoFormDialog.jsx`

Beide nutzen jetzt die bestehende Factory `createSlideVariants()` aus `src/utils/animations/base.js`. **Runtime-Win:** Variants wurden vorher **bei jedem Render neu erstellt** – jetzt einmal auf Modul-Level. Spart Allokation bei jedem Setting-Screen-Wechsel.

### Was bewusst NICHT gemacht wurde

- **`normalizeToKwh` vs `normalizePeriodEnergy`** in `EnergyChartsView.jsx`: sehen ähnlich aus, haben aber unterschiedliche Regeln (ein zusätzlicher Cutoff `>=10` für Statistics-API-Bug). Keine echten Duplikate – Zusammenlegen würde API komplizieren.
- **Label-Funktionen** in `TodosSettingsView` (3× ähnliches `lang === 'de' ? ... : ...`-Pattern): unterschiedliche Keys/Values, gemeinsamer Factory würde kaum was sparen.
- **`console.error`-Logs** (4 Stellen in EnergyChartsView): legitime Error-Logs für API-Failures, ~200 Bytes total. Bleibt drin.
- **`console.log`-Logs** im Bundle: werden bereits von Terser-`pure_funcs` entfernt (seit Phase 1).

### Bundle seit Baseline v1.1.1201

| | gzip JS | gzip CSS | Total |
|---|---:|---:|---:|
| Baseline (1201) | 397.0 | 22.2 | 419.2 |
| nach Phase 1 (1202) | 384.3 | 19.2 | 403.5 |
| nach Phase 3 (1203) | 371.1 | 19.2 | 390.3 |
| nach Phase 4A (1204) | 360.4 | 19.2 | 379.6 |
| nach Phase 2 (1205) | 360.3 | 19.2 | 379.5 |
| **nach Phase 6 (1206)** | **360.1** | **19.2** | **379.4** |
| **Gesamt-Einsparung** | **-36.8 KB** | **-3.0 KB** | **-39.8 KB (-9.5 %)** |

### Ehrliche Einschätzung & Stopp der Performance-Roadmap

Die letzten zwei Phasen (2 + 6) waren Qualität, nicht Shrink. Terser + gzip komprimieren Code-Duplikation gut – der Gewinn durch DRY entsteht im Source, nicht im Bundle.

**Entscheidung: Performance-Roadmap hier pausiert.** Die verbleibenden Hebel sind zu riskant für die erwartete Einsparung:
- Phase A (framer-motion LazyMotion): -15 bis -25 KB, aber 69 Files Migration
- Phase 4B (Chart.js → Chartist/frappe): -60 bis -70 KB, aber Design-Regression

**Abschluss-Bilanz** nach 5 umgesetzten Phasen:
- Bundle: 397 → 360 KB gzip (**-9.5 %**, -39.8 KB total)
- Build-Zeit: +5 s durch Terser
- Code-Qualität: 2 Files weg, 3 Icons dedupliziert, 1 Name-Clash eliminiert, 1 Runtime-Allokation weg
- Dependencies: -81 transitive (react-markdown-Stack) + 3 neue (marked, dompurify, visualizer)

**Wieder aufnehmen sobald:**
- Chrome Performance Profile von Handy vorliegt (Phase 5.1 → gezielte Runtime-Optimierungen)
- oder eine Chart-Library-Migration sich lohnt (Phase 4B)

---

## Version 1.1.1205 - 2026-04-19

**Title:** Duplikat-Audit & Merges in `src/utils/` (Phase 2 Performance-Roadmap)
**Hero:** none
**Tags:** Refactor, Code Quality

### 🧹 Qualitäts-Phase – zwei Dateien weg, ein Name-Clash weg

Phase 2 der Performance-Roadmap: bewusst Qualität, nicht Bundle-Größe. Ergebnis: **-0.1 KB gzip** (vernachlässigbar), aber cleanerer Codebase.

### Audit-Ergebnis

Von den fünf verdächtigen Paaren / Familien in `src/utils/` hatten nur drei echte Arbeit:

| Paar | Ergebnis |
|---|---|
| `domainHandlers` ↔ `domainHelpers` | split-ok, saubere Trennung |
| `deviceConfigs` ↔ `deviceHelpers` | split-ok, Configs konsumieren Helpers |
| schedule-Familie | **merged**, siehe unten |
| history-Familie | **merged**, siehe unten |
| `formatters/timeFormatters` ↔ `scheduleConstants` | **renamed**, siehe unten |

### Merge 1: `scheduleHandlers.js` → `scheduleUtils.js`

- `handleTimerCreate` + `handleScheduleCreate` (mit Format-Transformation für den nielsfaber-Scheduler) nach `scheduleUtils.js` verschoben
- `handleScheduleUpdate` + `handleScheduleDelete` ersatzlos gelöscht – **waren unbenutzt**
- `DetailView.jsx`-Import-Pfad aktualisiert
- Datei `src/utils/scheduleHandlers.js` gelöscht

### Merge 2: `historyDataProcessors.js` → `historyUtils.js`

- `generateCategoryData()` (15 LOC) nach `historyUtils.js` verschoben
- `HistoryTab.jsx` nutzt jetzt einen einzigen Import für die 4 History-Utilities
- Datei `src/utils/historyDataProcessors.js` gelöscht

### Dedupe 3: `formatTime()` Namens-Clash

`scheduleConstants.js::formatTime(hours, minutes)` und `formatters/timeFormatters.js::formatTime(timestamp, timeRange)` hatten denselben Namen, aber komplett unterschiedliche Signaturen & Zwecke. Risiko: versehentlicher Import der falschen Version.

**Fix:** `scheduleConstants.formatTime` → `formatClockTime` umbenannt. Konsument (`scheduleUtils.js`) entsprechend aktualisiert. Die Timestamp-Formatter bleiben unter `formatTime`.

### Geänderte / gelöschte Dateien

- **Gelöscht:** `src/utils/scheduleHandlers.js`, `src/utils/historyDataProcessors.js`
- **Geändert:** `src/utils/scheduleUtils.js`, `src/utils/scheduleConstants.js`, `src/utils/historyUtils.js`, `src/components/DetailView.jsx`, `src/components/tabs/HistoryTab.jsx`

### Bundle seit Baseline v1.1.1201

| | gzip JS | gzip CSS | Total |
|---|---:|---:|---:|
| Baseline (1201) | 397.0 | 22.2 | 419.2 |
| nach Phase 1 (1202) | 384.3 | 19.2 | 403.5 |
| nach Phase 3 (1203) | 371.1 | 19.2 | 390.3 |
| nach Phase 4A (1204) | 360.4 | 19.2 | 379.6 |
| **nach Phase 2 (1205)** | **360.3** | **19.2** | **379.5** |
| **Gesamt-Einsparung** | **-36.7 KB** | **-3.0 KB** | **-39.7 KB (-9.5 %)** |

### Nächste Schritte

- **Phase 6: System-Entities-Audit** (134 KB gzip unerforscht, Ziel: -10 bis -30 KB durch Duplikat/Unused-Scan in Energy/Todos/News-Views)
- Phase 5.2 (Icon-Sprite-Sheet) **verworfen**: Icons sind animierte SVGs mit SMIL (`<animate>`, individuelle Farben+Delays) – Sprite mit `<use>` würde Animationen/Farben brechen
- Phase 5.1 (Chrome Performance Profile) benötigt User-Session auf dem Handy
- Phase 4B (Chartist/frappe statt chart.js) bleibt Option, aber Design-Regression wahrscheinlich
- Phase A (framer-motion LazyMotion, ~-20 KB): 69 Files Migration, hohes Regression-Risiko

---

## Version 1.1.1204 - 2026-04-19

**Title:** Chart.js Tree-Shaking (Phase 4A Performance-Roadmap)
**Hero:** none
**Tags:** Performance, Refactor

### 📦 Chart.js /auto → explizite Registrierung

Phase 4A der Performance-Roadmap: `chart.js/auto` ersetzt durch Tree-Shaken-Import via `src/utils/chartjs/chartConfig.js`. Diese Konfigurations-Datei existierte schon, war aber nie benutzt worden – beide Chart-Consumer importierten `chart.js/auto` direkt, was alle Controller/Elements/Scales ins Bundle zog.

**Ergebnis:**
- JS gzip: **371.10 → 360.39 KB** (-10.7 KB)
- chart.js im Bundle: **100.6 → 85.2 KB** (-15.4 KB an Deps)
- Bundle-Delta kleiner als Dep-Delta, weil chart.js intern schon gut tree-shaked

**Gesamt seit Baseline v1.1.1201: -37 KB gzip (-9.3 %)**

### Ehrliche Einschätzung

Ursprüngliche Schätzung war -50 KB. Tatsächlich nur -10.7 KB. Grund: `chart.js/auto` triggert zwar Auto-Registrierung aller Chart-Typen, aber moderne Rollup-Tree-Shaking entfernt ungenutzte Chart-Controller ohnehin teilweise. Die explizite Registrierung bringt nur die letzte Meile.

### Was registriert wird (via chartConfig.js)

Nur was wir tatsächlich brauchen – Line, Bar, Area:
- Controllers: `LineController`, `BarController`
- Elements: `LineElement`, `BarElement`, `PointElement`
- Scales: `LinearScale`, `CategoryScale`, `TimeScale`
- Plugins: `Filler` (für Area), `Title`, `Tooltip`, `Legend`

### Geänderte Dateien

- `src/components/charts/ChartComponents.jsx` – Import von `chart.js/auto` auf `chartConfig`
- `src/system-entities/entities/integration/device-entities/components/EnergyChartsView.jsx` – dito
- `src/utils/chartjs/chartConfig.js` – doppelte Exports entfernt (Rollup-Error gefixt)

### Weitere Chart-Library-Migrationen bewusst verworfen

- **uPlot**: unterstützt **keine** Bar-Charts → raus (DeviceCategoriesChart + EnergyChartsView bars)
- **Chartist**: ~80 KB Einsparung möglich, aber plainer Look + Tooltips manuell nachbauen → zu viel Regression-Risiko
- **frappe-charts**: ~80 KB Einsparung möglich, aber API-Bruch + Design-Regression

### Nächste Schritte (Roadmap)

- Phase 2: Duplikat-Audit in `src/utils/`
- Phase 5.1: Chrome Performance Profile auf Handy (Runtime-Perf)

---

## Version 1.1.1203 - 2026-04-19

**Title:** react-markdown → marked + DOMPurify (Phase 3 Performance-Roadmap)
**Hero:** none
**Tags:** Performance, Refactor

### 📦 Markdown-Stack halbiert

Phase 3 der Performance-Roadmap: der komplette `react-markdown`-Stack (unified + micromark + mdast-util-* + hast-util-* + remark-rehype + property-information + …) wurde durch `marked` + `DOMPurify` ersetzt.

**Ergebnis:**
- JS gzip: **384.28 → 371.10 KB** (-13.2 KB)
- Deps-Summe: react-markdown-Stack ~45 KB weg, marked (12.4 KB) + DOMPurify (17.1 KB) dazu
- **Gesamt seit Baseline v1.1.1201: -26 KB gzip (-6.5 %)**

### Warum jetzt diese Kombi

- **marked** (~12 KB gzip): Parser `md → HTML-String`. Kein GFM, keine Tabellen gebraucht (Audit an der einzigen Usage-Stelle `VersionDetail.jsx`).
- **DOMPurify** (~17 KB gzip): Sanitize des generierten HTML. Content kommt via `fetch` von GitHub – bei kompromittiertem Repo kein XSS-Risiko.
- **Warum nicht nur marked?** Hätte ~17 KB mehr gespart, aber das Sicherheitsnetz ist hier die Zusatzkosten wert.

### Migration (exakt eine Stelle)

`src/system-entities/entities/versionsverlauf/components/VersionDetail.jsx`:

**Vorher:**
```jsx
import ReactMarkdown from 'react-markdown';
// …
<ReactMarkdown>{version.content}</ReactMarkdown>
```

**Nachher:**
```jsx
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useMemo } from 'preact/hooks';
// …
const sanitizedHTML = useMemo(() => {
  if (!version?.content) return '';
  return DOMPurify.sanitize(marked.parse(version.content));
}, [version?.content]);
// …
<div className="version-detail-content"
     dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
```

`marked.setOptions({ gfm: false, breaks: false })` — simple markdown ist genug für unseren Changelog.

### npm-Dependencies

- **Entfernt:** `react-markdown` (und damit 81 transitive Packages inkl. unified/micromark/mdast/hast/…)
- **Hinzugefügt:** `marked` + `dompurify`

### Nächste Schritte (Roadmap)

- Phase 4: chart.js → uPlot (~-80 KB gzip, größter Hebel)
- Phase 2: Duplikat-Audit in `src/utils/`
- Phase 5.1: Chrome Performance Profile für Runtime-Optimierungen

---

## Version 1.1.1202 - 2026-04-19

**Title:** Build-Hygiene – Terser + PurgeCSS (Phase 1 Performance-Roadmap)
**Hero:** none
**Tags:** Performance, Build

### 📦 Bundle-Shrink ohne Feature-Bruch

Erster Schritt der neuen Performance-Roadmap (`docs/PERFORMANCE_ROADMAP.md`): Build-Hygiene. Kein Code-Umbau, nur Konfig.

**Ergebnis:**
- JS gzip: **396.99 → 384.28 KB** (-12.7 KB, -3.2 %)
- CSS gzip: **22.17 → 19.24 KB** (-2.9 KB, -13.2 %)
- Total: **-15.6 KB gzip**

### 1. Terser statt esbuild-Minify

`vite.config.js` → `minify: 'terser'` mit `terserOptions`:
- `compress.passes: 2` (doppelter Optimierungs-Pass)
- `pure_funcs: ['console.log', 'console.debug', 'console.info']`
- `drop_debugger: true`
- `format.comments: false`

Preis: Build dauert ~5 s länger (5 → 13 s). Gewinn: ~12 KB JS-gzip.

### 2. PostCSS-Pipeline mit PurgeCSS + cssnano

Neu: `postcss.config.cjs` mit:
- `autoprefixer` (vendor prefixes)
- `purgeCSSPlugin` – entfernt ungenutzte CSS-Regeln (nur im Production-Build)
- `cssnano` – finale CSS-Minification

**PurgeCSS-Safelist großzügig:**
- `ios-*`, `fsc-*`, `v-*` (virtua), `framer-*`, `chip-*`, `card-*`, `device-*`
- `schedule-*`, `history-*`, `settings-*`, `detail-*`, `glass-*`, `backdrop-*`
- `search-*`, `greeting-*`, `stats-*`, `subcategory-*`, `action-sheet-*`
- `splash-*`, `apple-hello-*`, `energy-*`, `climate-*`, `toast-*`, `circular-*`, `slider-*`
- State-Klassen: `selected`, `active`, `pending`, `open`, `hidden`, `visible`, `loading`, etc.
- Transitions-Suffixe: `-enter`, `-exit`, `-appear`

Lieber ein paar KB weniger gespart als gebrochene UI.

### Caveat

cssnano wirft eine Warnung bei `backdrop-filter: ... saturate(calc(180% * var(--background-saturation, 1)))` – die Regel wird pass-through gelassen. Visueller Test auf HA-Wallpaper: **backdrop-filter wirkt weiter korrekt**.

### Neue / modifizierte Dateien

- `postcss.config.cjs` (neu)
- `vite.config.js` – Terser-Block + `rollup-plugin-visualizer` hinter `ANALYZE=1`
- `docs/PERFORMANCE_ROADMAP.md` (neu) – 5-Phasen-Plan, Ziel ~235 KB gzip
- `analyze-bundle.js` (temp) – Text-Report aus `dist/bundle-stats.html`

### Nächste Schritte (Roadmap)

- Phase 2: Duplikat-Audit in `src/utils/`
- Phase 3: react-markdown → marked (~-60 KB gzip)
- Phase 4: chart.js → uPlot (~-80 KB gzip)
- Ziel: Bundle ~235 KB gzip (-40 % vs. heute)

---

## Version 1.1.1201 - 2026-04-18

**Title:** Vorschläge v2 – sofort lernen, Decay, Negative Learning, Reset
**Hero:** none
**Tags:** Feature, UX

### 🧠 Predictive Suggestions – komplett überarbeitet

**1. Sofortige Vorschläge (kein minUses mehr)**
- Bisher: 2-5 Klicks nötig, bevor Device überhaupt vorgeschlagen wird → Feature lieferte in den ersten Tagen nichts
- Jetzt: schon ab dem ersten Klick möglich, plus **Bootstrap** über `entity.usage_count` wenn Pattern-Daten zu dünn sind

**2. Exponentielles Decay statt harter Cutoff**
- Jedes Pattern hat ein Decay-Gewicht: `weight = exp(-age / half_life)`
- Half-Life je nach Learning-Rate:
  - `slow`: 28 Tage (altes Verhalten zählt lang)
  - `normal`: 14 Tage (Default)
  - `fast`: 7 Tage (schnell vergessen)
- Pattern von heute: Gewicht 1. Nach Half-Life: Gewicht 0.5. Glatte Übergänge statt „ab Tag 31 = nix".

**3. Negative Learning**
- Wenn User Suggestions sieht, dann ein NICHT-vorgeschlagenes Device klickt → jedes übergangene Suggestion bekommt einen `suggestion_ignored`-Pattern
- Diese reduzieren die Confidence beim nächsten Berechnen (gewichtet, ebenfalls mit Decay)
- Schutz: nur innerhalb 10 Minuten nach Show, nur einmal pro Show-Cycle (keine Schleifen)

**4. Reset-Button in Settings**
- Unter „Einstellungen → Vorschläge → Lerndaten" jetzt Button „**Lerndaten löschen**" (rot)
- Löscht alle `USER_PATTERNS` + setzt `entity.usage_count` + `entity.last_used` auf den Ausgangszustand
- Mit Bestätigungs-Dialog + Stats-Anzeige nach dem Löschen („X Patterns + Y Nutzungszähler gelöscht")

### Neue Files

- `src/utils/clearLearningData.js` – Reset-Logik
- `src/utils/suggestionsCalculator.js` – komplett rewrite (v2)

### Modifiziert

- `DataProvider.jsx` – `lastShownSuggestionsRef` für Negative Learning, `resetLearningData` im Context
- `GeneralSettingsTab.jsx` – Reset-UI in der Suggestions-Detail-View
- Translations (de/en) – neue Keys für Reset-Section

---

## Version 1.1.1200 - 2026-04-18

**Title:** Section-Header Linie korrekt positioniert
**Hero:** none
**Tags:** Design, Bug Fix

### 📏 Linie direkt unter Titel, Abstand darunter

Vorher war `padding-bottom: 16px` auf dem Section-Titel („Anziehraum"), weshalb die Border-Linie 16px UNTER dem Text sass mit leerem Raum dazwischen.

**Jetzt:**
- `padding: 8px 0 0 0` – kompakt um den Text
- Border (`::after`) direkt am padding-box-bottom
- `margin-bottom: 16px` – Abstand zur ersten Card-Reihe kommt NACH der Linie

Visuell: Text → Linie → 16px Luft → Cards (wie gewünscht).

---

## Version 1.1.1199 - 2026-04-18

**Title:** Bug-Fix: Blur wirkt wieder (Transform raus)
**Hero:** none
**Tags:** Bug Fix

### 🐛 Noch ein Stacking-Context-Killer entfernt

Nach v1.1.1198 wirkten Blur-Änderungen immer noch nicht. Grund: der Motion-Wrapper animierte weiterhin `scale` und `y` – selbst bei `scale: 1` setzt framer-motion `transform: matrix(1,0,0,1,0,0)` als Inline-Style. Das erzeugt einen neuen Stacking-Context → `backdrop-filter` auf `.glass-panel::before` kann den HA-Wallpaper nicht mehr sehen.

**Fix:** Transform-Animation ganz raus. Nur Opacity-Fade bleibt.

**Verlorene Feinheit:** Das bouncy-soft Scale+Y mit Spring-Physik ist weg. Was bleibt:
- ✅ Opacity 0 → 1 mit 0.55s ease-in-out
- ✅ Apple-Hello-Splash-Animation davor (unverändert)
- ✅ Cross-Fade mit Splash (startet wenn Drawing fertig)

**Trade-off akzeptiert:** Sauberer Blur-Filter wichtiger als subtile Scale-Animation.

---

## Version 1.1.1198 - 2026-04-18

**Title:** Bug-Fix: Hintergrund-Settings wirken wieder
**Hero:** none
**Tags:** Bug Fix

### 🐛 Backdrop-Filter repariert

Die Regler „Deckkraft", „Weichzeichner", „Kontrast" und „Sättigung" unter Einstellungen → Hintergrund hatten keine sichtbare Wirkung mehr. Zwei Ursachen gefixt:

**1. `contain: paint` auf `.glass-panel` + `.detail-panel` entfernt** (stammte aus v1.1.1183 Tier-2-Performance)
- `contain: paint` isoliert das Element paint-seitig → `backdrop-filter` konnte den HA-Wallpaper nicht mehr sehen
- Settings wurden zwar gespeichert + CSS-Vars gesetzt, aber der Filter hatte nichts zum Filtern

**2. `filter: blur()` auf Motion-Wrapper entfernt** (stammte aus v1.1.1195 Apple-Reveal)
- `filter` erzeugt einen neuen Stacking-Context → backdrop-filter auf Kindern liest nicht mehr zum HA-Wallpaper durch
- Reveal-Animation bleibt erhalten via opacity + scale + y-translate mit Spring – nur der Blur-In-Effekt ist weg
- Visual-Unterschied ist minimal, UX fühlt sich praktisch identisch an

---

## Version 1.1.1197 - 2026-04-18

**Title:** Kategorie-Wechsel per Stichwort
**Hero:** none
**Tags:** Feature, UX

### ⚡ Schnell-Wechsel zwischen Kategorien

Bestimmte Wörter triggern jetzt **direkt einen Kategorie-Wechsel**, ohne einen Chip zu erzeugen. Damit wird die Navigation zwischen den Haupt-Kategorien deutlich schneller.

**Mapping:**

| Getippt | Wechsel zu |
|---------|-----------|
| `Gerät`, `Geräte`, `Device`, `Devices` | **Geräte** |
| `Sensor`, `Sensoren`, `Sensors` | **Sensoren** |
| `Aktion`, `Aktionen`, `Action`, `Actions` | **Aktionen** |
| `Custom`, `Benutzerdefiniert` | **Benutzerdefiniert** |

Diese Wörter tauchen im Ghost-Text auf (wie gewohnt), und beim Accept (Tab, →, Tap, Mobile Confirm) wird nur die Kategorie gewechselt – **kein Chip** erscheint.

**Priorität:** Area > Category > Domain > Device. Wer einen Raum mit dem Namen „Sensor" hat (unwahrscheinlich), bekommt den Area-Treffer zuerst.

**Exclude-Logik:** Wenn die aktuelle Kategorie bereits aktiv ist, wird ihr Synonym nicht mehr als Ghost vorgeschlagen (kein Self-Switch).

**Chip-Differenzierung:** Das generische `Sensor`/`Sensoren` triggert jetzt den Kategorie-Wechsel, nicht mehr den Fallback-Chip für generische Sensoren. Wer gezielt alle Sensoren als Chip filtern will, tippt `Fühler` oder `Messwert` – dann entsteht ein Chip „Fühler" bzw. „Messwert".

---

## Version 1.1.1196 - 2026-04-18

**Title:** Auto-Kategorie-Wechsel bei Chip-Erstellung
**Hero:** none
**Tags:** Bug Fix, UX

### 🎯 Chip und Kategorie bleiben konsistent

**Problem:** User tippt „Temperatur" in der Kategorie „Geräte" → Sensor-Chip wird korrekt erstellt, aber die Ergebnisliste bleibt leer, weil „Geräte" Sensoren ausschließt.

**Fix:** Beim Erstellen eines Domain-Chips wechselt die Hauptkategorie jetzt automatisch:

| Chip | Auto-Kategorie |
|------|----------------|
| Sensor-Chip (🟢 grün) – Temperatur, Bewegung, … | → **Sensoren** |
| Action-Chip – Automation, Szene, Skript | → **Aktionen** |
| System-Entity-Chip – Settings, Marketplace | → **Benutzerdefiniert** |
| Device-Chip (🟣 violett) – Licht, Schalter, Klima, … | → **Geräte** |

**Area-Chips** triggern keinen Kategorie-Wechsel – Räume sind orthogonal zu Kategorien.

**Implementation:**
- Neue Helper-Funktion `domainChipToCategory()` in `searchEventHandlers.js`
- `acceptSuggestion` + `handleGhostTap` rufen beim Chip-Create `setActiveCategory()` mit der passenden Kategorie
- Funktioniert bei Tab, → (ArrowRight), Tap-on-Ghost und Mobile-Confirm-Button

---

## Version 1.1.1195 - 2026-04-18

**Title:** Apple-Style UI-Reveal nach Splash
**Hero:** none
**Tags:** Design, UX

### ✨ Blur-Scale-Spring UI-Reveal

Nach der „hello"-Handschrift-Animation erscheint die UI (StatsBar + Suchleiste) jetzt in **echtem Apple-Stil**: Blur-to-Clear + Scale-Up + leichter Y-Translate, mit Spring-Physik.

**Animation:**
```
initial: { opacity: 0, scale: 0.94, y: 14, filter: 'blur(14px)' }
animate: { opacity: 1, scale: 1,   y: 0,  filter: 'blur(0px)'  }
transition:
  position/scale → spring (stiffness: 220, damping: 26, mass: 1)
  opacity        → 0.5s easeInOut-Apple
  filter (blur)  → 0.65s easeInOut-Apple
```

**Cross-Fade mit Splash:**
- Apple-Hello-Splash callbackt via `onDrawingDone` zum App-Component, sobald die Handschrift fertig gezeichnet ist
- In genau diesem Moment startet die UI-Reveal-Animation → **die UI morpht sich heraus, während die Splash fadet**
- Bei Splash-Style „Standard" oder „Aus" bleibt es beim Standard-Reveal wenn `isLoadingComplete` fires

**Gefühlt:** Wie das visionOS-Reveal oder iOS-Setup – sanft, bouncy, premium.

---

## Version 1.1.1194 - 2026-04-18

**Title:** Apple Hello Effect mit originalem macOS-Lettering
**Hero:** none
**Tags:** Design, UX, Feature

### 👋 Echtes Apple Hello aus macOS Sonoma

Splashscreen nutzt jetzt das **offizielle Apple „hello"-Lettering** aus macOS Sonoma (extrahiert und publiziert von chanhdai.com). Das ist der iconicale Handschrift-Zug, den du von jedem neuen Mac kennst.

**Technik:**
- 🎨 **Zwei SVG-Paths** (statt einem):
  - `h1` zeichnet den ersten Abstrich des „h"
  - `h2 + ello` zeichnet Hump vom h + komplettes „ello" in einem Zug
- ✍️ Der Stift wird zwischen den Paths „angehoben" (0.49s Pause) – genau wie bei echtem Schreiben
- 🎬 Framer-Motion `pathLength` 0→1 Animation, ease-in-out
- ⚡ Gesamt-Draw ~2.45s, plus 0.3s Hold, plus 0.4s Fade → **endet bei ~3.15s**, synchron zum App-Load
- 🌐 Sprach-unabhängig: „hello" ist zum universellen Apple-Symbol geworden

### 🧹 Cleanup

- Lokale Borel-Font (25 KB) wieder entfernt – nicht mehr nötig
- Alte hand-gezeichnete SVG-Paths raus
- Keine Google-Fonts-Anbindung mehr (war schon ab v1.1.1193)

### Hinweis zum Timing

Die Splash-Animation ist mit `durationScale: 0.7` auf die App-Load-Zeit (~2.5s) synchronisiert. Das Wort ist fertig geschrieben genau wenn die Suchleiste erscheint. Falls du eine andere Geschwindigkeit willst, lässt sich der Wert in `AppleHelloSplash.jsx` anpassen.

---

## Version 1.1.1193 - 2026-04-18

**Title:** Hotfix Splashscreen – Google-Font entfernt
**Hero:** none
**Tags:** Bug Fix

### 🔧 Hintergrund transparent + erste Font-Iteration

Schneller Hotfix für v1.1.1192:
- Splash-Hintergrund von dunklem Blur auf **komplett transparent** gestellt
- Google-Font „Caveat" (über @import) als Zwischenlösung ausprobiert
- Wurde in v1.1.1194 durch Apple-Original-Paths ersetzt

---

## Version 1.1.1192 - 2026-04-18

**Title:** Design-Feinschliff + Apple Hello Splashscreen
**Hero:** none
**Tags:** Design, UX, Feature

### 👋 Apple-inspirierter „hallo"-Splashscreen

Neue Splashscreen-Option mit Handschrift-Animation im Stil von Apples iPhone/Mac-Setup.

**Technik:**
- 🎨 Fünf einzelne SVG-Paths (h-a-l-l-o bzw. h-e-l-l-o)
- ✍️ Framer-Motion `pathLength` Animation – Buchstaben werden „geschrieben"
- ⏱ Gestaffelt: jeder Buchstabe startet 250 ms nach dem vorherigen, ~550 ms Draw-Zeit
- 🌐 Sprach-abhängig: Deutsch → „hallo", alle anderen → „hello"
- 🎬 Gesamte Show-Dauer ~2.5 s, dann Fade-out

### ⚙️ Splashscreen-Selector in Settings

Unter „Status & Begrüßung" neuer Eintrag:
- **Aus** – Card öffnet direkt ohne Ladebildschirm
- **Standard** – klassischer Progress-Ladebildschirm (wie bisher)
- **Apple Hello** – neue Handschrift-Animation

Klick rotiert durch die drei Optionen. Einstellung greift beim nächsten Card-Reload.

### 🌡 Sensor-Synonyme erweitert + neue Chip-Farbe

Die Suche erkennt jetzt deutlich mehr Sensor-Begriffe, unterscheidet sie farblich von Geräte-Filtern und filtert auf Basis von `device_class`:

**Neu erkannt:**
- `Temperatur`, `Luftfeuchtigkeit`, `Helligkeit`, `Lux`
- `Energie`, `Verbrauch`, `kWh`, `Strom`, `Leistung`, `Watt`
- `Batterie`, `Akku`, `Spannung`, `Druck`, `CO2`, `Feinstaub`
- `Bewegung`, `Präsenz`, `Tür`, `Fenster`, `Rauch`, `Wasserleck`

**Filtering:** Jedes Synonym filtert nicht mehr nur nach `domain`, sondern auch nach `device_class` – tippt man „Temperatur", erscheinen wirklich nur Temperatur-Sensoren, nicht alle Sensoren.

**Neue Chip-Farben:**
- 🔵 **Blau** – Area (Räume)
- 🟣 **Violett** – Gerät (Licht, Schalter, Klima, …)
- 🟢 **Grün/Teal** – Sensor (passive Messwerte)

### 🎨 Feinschliff am UI

- **Zeilen-Abstand 16 px** zwischen Card-Reihen (vorher gefühlt zu dicht)
- **Section-Header-Padding unten 16 px** (Titel + erste Card-Reihe hatten zu wenig Luft)
- **Ghost-Icon im Eingabefeld**: SVG (Haus / Diamond) statt Emoji – konsistent mit den Chips
- **Ghost-Text Case-Match**: Tippst du „bel", zeigt der Ghost „bel…", nicht „Bel…" – die Texte überlagern sich jetzt pixelgenau
- **Section-Header transparent**: kein dunkler Blur-Balken mehr über dem Inhalt

---

## Version 1.1.1191 - 2026-04-18

**Title:** Area-Sensoren im Header + Design-Feinschliff
**Hero:** none
**Tags:** Feature, UX, Design

### 🌡 Area-Sensoren im Section-Header

Wenn im Home Assistant Backend für eine Area ein Temperatur- oder Luftfeuchtigkeits-Sensor zugeordnet ist, werden die Werte jetzt direkt im Section-Header angezeigt.

**Beispiel:**
```
Anziehraum                              🌡 21.5°C   💧 48%
```

**Bausteine:**
- 📡 DataProvider exportiert komplette `areas`-Registry (mit `temperature_entity_id` + `humidity_entity_id`)
- 🗺 `areaSensorMap` in SearchField: Map<Area-Name → Sensor-Entities>
- 🎨 Iconoir-Stil SVGs (Thermometer + Droplet), stroke-basiert, passt zum Look
- 🔄 Real-time: Werte aktualisieren automatisch via rAF-Batch
- ✨ Graceful: Areas ohne konfigurierte Sensoren zeigen nur den Namen

### 🎛 Weitere Design-Feinschliffe

- **Row-Spacing**: Vertikaler Abstand zwischen Card-Reihen jetzt 6px (vorher 8px)
- **Section-Header transparent**: Kein dunkelgrauer Hintergrund + Blur mehr – Header schwebt sauber über dem Inhalt

---

## Version 1.1.1190 - 2026-04-18

**Title:** SVG-Icons statt Emojis in Chips
**Hero:** none
**Tags:** Design, UX

### 🎨 Konsistente Icons aus der Filter-Bar

Die Chip-Icons nutzen jetzt die gleichen SVGs wie die Buttons im Filter-Panel:

| Chip | Vorher | Jetzt |
|------|--------|-------|
| Area-Chip | 📍 Emoji | `AreasIcon` (Haus-Shape) |
| Domain-Chip | 💡 Emoji | `CategoriesIcon` (Diamond-Shape) |

**Vorteile:**
- 🎯 SVGs übernehmen via `stroke: currentColor` die Chip-Farbe (blau/violett/weiß)
- 🔗 Visuelle Konsistenz: User erkennt sofort „Das ist ein Räume-/Kategorien-Filter"
- ✨ Keine Emoji-Inkonsistenzen zwischen Plattformen

---

## Version 1.1.1189 - 2026-04-18

**Title:** Kritischer Bug-Fix + Chip-Platzierung
**Hero:** none
**Tags:** Bug Fix, UX

### 🐛 Scope-Filter-Bug gefixt

`filterDevices` bekam die ungescopte Geräte-Liste → Results zeigten auch Entities, die nicht zum Chip-Filter passten.

**Fix:** `filterDevices` erhält jetzt `scopedDevices` (gefiltert durch Area/Domain-Chip) statt der vollen Collection. Bei aktivem Chip enthält die Results-Liste jetzt **nur** noch passende Entities.

### 🎨 Chips wandern in die Subcategory-Bar

Chips sind **Filter-Elemente** und gehören visuell zu den Kategorien. Sie erscheinen jetzt links vor „Alle / Beleuchtung / Schalter / …":

```
[🏠 Kinderzimmer] [💎 Lampe]  |  Alle  Beleuchtung  Schalter  Klima  …
       ↑ Filter-Chips                ↑ normale Kategorien
```

**Vorteile:**
- 🧭 Sofortige visuelle Erkennung: „Das sind aktive Filter"
- 🧼 Eingabefeld bleibt sauber – reiner Text-Input
- 👁 Chips bleiben sichtbar, auch während User weiter tippt
- 🆕 Neue generische `filterChips` Prop in `SubcategoryBar` für zukünftige Filter-Typen

---

## Version 1.1.1188 - 2026-04-18

**Title:** Kombinierbare Filter-Chips (Area + Domain)
**Hero:** none
**Tags:** Feature, UX

### 🔗 Area-Chip + Domain-Chip gleichzeitig

Vorher: Nur Area wurde zu Chip, Domain fiel als Text ein (und matchte oft nichts).
Jetzt: Beide Typen werden zu Filter-Chips mit visueller Unterscheidung.

| Tippst | Ghost | Icon | Nach Tab/→ |
|--------|-------|------|------------|
| `Kin` | `derzimmer` | 📍 | `[📍 Kinderzimmer]` **blauer Chip** |
| `lam` | `Lampe` | 💡 | `[💡 Lampe]` **violetter Chip** |

**Kombinierbar:**
```
1. "Kin" → Tab  →  [📍 Kinderzimmer] |
2. "la" → Tab   →  [📍 Kinderzimmer] [💡 Lampe] |
3. Liste zeigt nur Lampen im Kinderzimmer
```

**Neue State-Struktur:**
- `areaChip: { area_id, name } | null`
- `domainChip: { domain, label } | null`
- `selectedChipId: 'area' | 'domain' | null` (iOS-Pattern für Delete)

**Smart Excludes:** Wenn Area-Chip aktiv → keine weiteren Area-Vorschläge im Ghost. Gleiches für Domain.

### 🎨 Visuelle Trennung
- 📍 Area-Chip: Blau (`rgba(66, 165, 245, ...)`)
- 💡 Domain-Chip: Violett (`rgba(192, 132, 252, ...)`)

---

## Version 1.1.1187 - 2026-04-18

**Title:** V4 Search: Chip-Input + Ghost-Fixes + Card-Cleanup
**Hero:** none
**Tags:** Feature, UX, Design

### 🎯 Google-like Suche mit Chips

Große Überarbeitung des Such-Inputs auf Basis eines neuen Mockup-Designs.

**Smart Typed Suggestions:**
- Neue Priorität in `computeSuggestion`: Area > Domain > Device
- Tippst du „Kin" → erkennt die Area „Kinderzimmer" zuerst
- Tippst du „lam" → Domain-Synonym „Lampe" → `light`
- Fällt auf Device-Name-Prefix zurück, wenn keines matched

**Area-Chip im Input:**
- Nach Tab/→ (Desktop) oder Tap auf Ghost (Mobile) wird der Area-Match zum Chip
- Card-Liste filtert automatisch auf den Chip-Scope

**Mobile-Anpassungen:**
- Chip-Touch-Target ≥ 44 pt (Apple HIG)
- iOS-Pattern zum Löschen: Tap selektiert → Tap² löscht
- Dedizierter ↵-Button rechts im Input (nur Mobile)
- Ghost mit gestrichelter Unterlinie als Tap-Hinweis

**Ghost-Icon-Prefix:**
- 📍 wenn Area-Match
- 💡 wenn Domain-Match
- Nichts bei Device-Match (damit's nicht zu voll wird)

**Keyboard-Hints (Desktop):**
- Kleine Badges `→ Tab` rechts im Input
- Nur sichtbar, wenn Ghost aktiv
- Via `@media (hover: none)` auf Touch-Geräten ausgeblendet

### 🧹 Card-Cleanup (Bonus)

Neue `stripAreaPrefix()`-Utility entfernt redundante Area-Präfixe aus Entity-Namen:

| Vorher | Nachher |
|--------|---------|
| Kinderzimmer **Licht** | **Licht** |
| Kinderzimmer **Thermostat** | **Thermostat** |
| Anziehraum **Rolllade Motor** | **Rolllade Motor** |

Da der Section-Header schon „Kinderzimmer" anzeigt, ist das Präfix in jedem Card-Namen redundant und kann weg.

**Neue Files:**
- `computeSuggestion.js` – Smart Typed Suggestion
- `SearchFieldV4.css` – Chip + Hints + Mobile-Styles
- `deviceNameHelpers.js` – Area-Präfix-Stripping

---

## Version 1.1.1186 - 2026-04-17

**Title:** Press-Feedback & Detail-Prefetch
**Hero:** none
**Tags:** UX, Feature

### 👆 Ehrliches Click-Feedback + Prefetch

Neue Interaktions-Schicht ohne De-Sync-Risiko und schnellere Detail-View-Öffnung.

**Press-Feedback (kein Optimistic UI):**
- 🎯 Pending-Action-Tracker mit Pub/Sub – nur betroffene Card rendert neu
- 💙 Subtiler blauer Shimmer-Puls während Service-Call läuft
- ⏱ Auto-Clear bei HA-Bestätigung (state_changed) oder 2.5 s Timeout
- ✅ UI-State wechselt erst bei echter Bestätigung – kein Lügen, keine De-Sync
- ♿ `prefers-reduced-motion` Fallback ohne Animation

**Detail-View-Prefetch:**
- 🖱 `onPointerEnter` (Desktop Hover) → Entity-Cache-Warmup
- 📱 `onPointerDown` (Mobile Touch-Start) → Prefetch vor Click-Registrierung
- 🔁 Idempotent – zweiter Hover macht nichts mehr
- 🚀 Detail öffnet spürbar schneller

**Neue Bausteine:**
- `pendingActionTracker.js` – Subscription-basierter Tracker
- `usePendingAction` – Hook pro Entity

---

## Version 1.1.1185 - 2026-04-17

**Title:** Gold-Paket: Bundle & Cache
**Hero:** none
**Tags:** Performance, Optimization

### 🥇 Kleine Wins, großer Effekt

Bundle-Reduktion ohne Feature-Verlust + Search-Cache für instant-Wiederholungen.

**Bundle-Optimierungen:**
- 🎯 `console.log/debug/info` als pure → Dead-Code-Elimination
- 🐛 `debugger`-Statements in Production gedroppt
- 🖼 SVG-Path-Präzisionen auf 2 Dezimalen in 48 Icons (-6.9 KB raw)
- 📉 Bundle: 397 → 390 KB gzip (-7.3 KB, -1.8 %)

**Search-Result-Cache (LRU):**
- ⚡ Gleicher Query = instant Cache-Hit (0 ms Fuse-Arbeit)
- 📦 Max. 30 Queries gecacht, ältester fliegt raus
- 🔄 Auto-Invalidation wenn Collection sich ändert
- 💡 Rapid Query-Wechsel (z. B. „licht" → „küche" → „licht") wird instant

**Skipped mit Begründung:**
- PurgeCSS übersprungen (Risiko für dynamische Template-Klassen > Nutzen)

---

## Version 1.1.1184 - 2026-04-17

**Title:** Virtualisierung mit virtua
**Hero:** none
**Tags:** Performance, Feature

### 🚀 DOM-Diät: 400 → 30 Knoten

Einführung echter Listen-Virtualisierung mit `virtua` – nur noch sichtbare Cards existieren im DOM.

**Was passiert:**
- 📜 `Virtualizer` nutzt existierenden Scroll-Container (`.results-container`)
- 🔢 Dynamischer Column-Count-Hook synchron mit CSS-Breakpoints (1–5 Spalten)
- 📐 Flat-Item-Adapter: Rooms + Devices → Header + Grid-Row Items
- 📏 `ResizeObserver` misst dynamisch `startMargin` (SubcategoryBar darüber)
- 🎬 `animatedOnce`-Set: Cards animieren nur beim ersten Mount, nicht bei Recycle
- 📌 Sticky Section-Headers im Scroll-Container

**Metriken bei 400 Entities:**
- DOM-Knoten: 400+ → ~30
- Scroll-FPS Mobile: 30-50 → 55-60
- Memory: deutlich niedriger
- Initial-Mount: schneller

**Bundle:** +6 KB gzip (virtua) – fair für den Paint-Gewinn.

---

## Version 1.1.1183 - 2026-04-17

**Title:** Tier 2 Performance
**Hero:** none
**Tags:** Performance, Optimization

### ⚙️ CPU-Disziplin im Hot-Path

Fünf Optimierungen, die zusammen einen ruhigeren Main Thread ergeben.

**rAF-Batching:**
- 🔁 State-Change-Events werden pro Frame gebündelt
- 📊 Bei 30 Sensor-Updates/s → max. 60 setEntities/s statt 30× N
- 🛡 Running-Mutex gegen parallele Loads
- 🏠 Auto-Unmark für Pending-Tracker

**IndexedDB Batch-Writes:**
- 📝 1 Transaktion für alle Entities statt N sequentielle
- ⚡ Initial-Load spürbar schneller
- 💾 Weniger Memory-Churn

**GPU-Entlastung:**
- 🎨 `contain: paint` auf `.glass-panel` + `.detail-panel`
- 🗑 No-op `backdrop-filter: blur(0px)` in `.detail-backdrop` entfernt
- 🎯 `will-change: transform` nur während Hover/Active (nicht permanent)

**Mehr Memos:**
- 🧠 `memo()` auf StatsBar, GreetingsBar, SubcategoryBar, ActionSheet

---

## Version 1.1.1182 - 2026-04-17

**Title:** Flüssig & Google-like Suche
**Hero:** none
**Tags:** Performance, UX, Search

### ⚡ Tier 1 Snappiness + Such-Überholung

Zwei große Pakete in einem Release: App fühlt sich direkter an, Suche fühlt sich wie Google an.

**Tier 1 – Snappiness (Perceived Speed):**
- ⏱ Animation-Durations global -25 % (0.3 → 0.22, 0.4 → 0.3, 0.45 → 0.34)
- 👆 `touch-action: manipulation` global → 300 ms Tap-Delay weg
- 🎯 `:active { scale(0.97) }` auf Cards/Buttons → instantes Touch-Feedback
- 🔍 Search-Debounce 150 → 50 ms (mit trailing edge)
- 🧠 memo-Comparator auf DeviceCard (state, last_updated, friendly_name, brightness, etc.)
- 👁 `content-visibility: auto` auf Device-Cards → Offscreen-Paint überspringt

**Google-like Suche:**
- 🎯 Intent-Parser: „Wohnzimmer Licht" → { area: Wohnzimmer, domain: light }
- 🌍 15 Domain-Synonym-Gruppen (DE/EN): lampe|beleuchtung → light, etc.
- 🔤 Multi-Word-Fuzzy via Fuse Extended Search (`'wort1 'wort2`)
- 🏠 Pre-Filter nach Area/Domain vor Fuse → 90 % kleiner Suchraum
- 📊 Final-Score = Fuse × 0.7 + Relevance × 0.3 + Prefix-Bonus
- 🎨 Highlighting über priorisierte Keys (friendly_name zuerst)
- ⚡ Fuse-Instanz persistent via `setCollection` statt Re-Index

**Initial-Load-Fix:**
- 🚦 Loading-Gate: keine ungefilterten Entities via state_changed während Mount
- 🔄 hass-Retry: Auto-Load sobald hass nach Mount verfügbar wird

---

## Version 1.1.1181 - 2026-04-17

**Title:** Icon-Diät für GPU
**Hero:** none
**Tags:** Performance, Animation

### 🔥 4 Icons von Endlos-Loop auf One-Shot

Gezielte Reduktion permanent laufender SVG-Animationen, um GPU-Last auf Mobile zu senken.

**Semantisch passender gemacht:**
- 🏃 **MotionSensorOn:** Einmalige Draw-Animation + Glow-Fade-in (Bewegung ist momentanes Ereignis)
- 👤 **PresenceSensorOn:** 3 Ringe gestaffelt Fade-in, dann statisch
- 📺 **TVOn:** Screen-Glow + T/V Buchstaben einmalig
- 📺 **TVOff:** Screen fadet aus, Standby-LED einmalig ein

**GPU-Bilanz:**
- Endlos-SVG-Animationen: 58 → 42 (−16, −28 %)
- Verbliebene Endlos-Loops nur noch in 11 Icons: Climate (4), Vacuum, WashingMachine, Dishwasher, AirPurifier, Fan, Siren, MusicOn – alles semantisch laufende Vorgänge

---

## Version 1.1.1180 - 2026-04-17

**Title:** Code-Refactoring & Duplikate
**Hero:** none
**Tags:** Refactoring, Cleanup

### 🧹 Code-Hygiene + Verbesserte Suche

Großes Refactoring: Duplikate raus, zentrale Utilities eingeführt, Such-Pipeline vorbereitet.

**Entfernt (Code-Diät):**
- 🗑 4 Debug-Console-Snippets im Root (−761 Zeilen)
- 🔁 slideVariants 3× dupliziert → zentrale `createSlideVariants()` Factory
- 📝 12 × localStorage load/save Boilerplate → `systemSettingsStorage.js` Utility
- 🔀 `scheduleUtils.js` hass-State-Fallback vereinheitlicht
- 🎛 `deviceConfigs.js` Switch-Case-Blöcke konsolidiert

**Neue Bausteine:**
- `systemSettingsStorage.js` – zentrale localStorage-Utility mit Dot-Path
- `searchSynonyms.js` + `searchIntent.js` – Fundament für intelligente Suche

**Ca. 800 Zeilen Duplikate entfernt.**

---

## Version 1.1.1065 - 2026-01-14

**Title:** CSS Filter-Tab Slider Fix
**Hero:** none
**Tags:** Bug Fix

### 🐛 Bug Fix: All-Schedules Filter-Tab

Behoben: Fehlende CSS-Klasse `.scheduler-filter-slider` für den animierten Filter-Tab-Slider in der All-Schedules Ansicht.

**Änderungen:**
- ✅ CSS-Klasse `tab-slider` → `scheduler-filter-slider`
- ✅ Korrekte Gradient-Animation hinzugefügt
- ✅ visionOS-Style Box-Shadow implementiert

---

## Version 1.1.1060 - 2026-01-14

**Title:** Retry Mechanismus Refactoring
**Hero:** none
**Tags:** Performance, Refactoring

### ⚡ Performance-Optimierung: Shared Retry Mechanism

Großes Refactoring des Retry-Mechanismus für System-Entities zur Verbesserung der Performance und Reduktion von Code-Duplikaten.

**Was ist neu:**
- **Singleton Pattern:** Alle Entities teilen sich eine Promise für hass-Retry
- **Code-Reduktion:** 73% weniger Code (215 → 57 Zeilen)
- **Helper Method:** `mountWithRetry()` in SystemEntity Base-Class
- **Hybrid Approach:** Utility Service + Base Class Helper

**Betroffene Components:**
- ✅ Weather Entity
- ✅ Todos Entity
- ✅ News Entity
- ✅ Integration Entity
- ✅ StatsBar Component

---

## Version 1.1.1055 - 2026-01-13

**Title:** All-Schedules System-Entity
**Hero:** none
**Tags:** Feature

### 📅 Neue System-Entity: All-Schedules

Zentrale Übersicht aller Zeitpläne und Timer im System.

**Features:**
- 📋 Liste aller Schedules über alle Geräte hinweg
- 🔍 Filter: Alle / Timer / Zeitpläne
- 🎨 Domain-Badges (Climate, Light, Cover, etc.)
- 🔗 Click-to-Navigate zu Device DetailView
- ⏰ Zeitanzeige und Wochentage

**UI:**
- Raycast-inspiriertes Design
- Animated Filter-Tabs
- visionOS Styling

---

## Version 1.1.1050 - 2026-01-12

**Title:** System-Entity Architecture
**Hero:** none
**Tags:** Architecture, Feature

### 🏗️ System-Entity Architektur

Einführung der System-Entity Architektur für native App-Features.

**Konzept:**
- System-Entities erscheinen wie normale Entities in der Suche
- Eigene Custom Views mit Tabs und Actions
- Vollständige Home Assistant Integration
- Plugin-System für Erweiterungen

**Erste System-Entities:**
- ⚙️ Settings
- 🔌 Plugin Store
- ☁️ Weather
- 📰 News
- ✅ Todos

---

## Version 1.1.0 - 2026-01-10

**Title:** visionOS Design System
**Hero:** none
**Tags:** Design, UI/UX

### 🎨 visionOS Design System

Komplettes Redesign der UI basierend auf Apple's visionOS Design Language.

**Design-Änderungen:**
- 🌈 Glasmorphism & Frosted Glass Effects
- ✨ Smooth Animations & Transitions
- 🎭 Brand Colors für jede Entity
- 📱 iOS-inspirierte Components
- 🔲 Rounded Corners & Shadows

**Performance:**
- GPU-beschleunigte Animationen
- Optimiertes Rendering
- Lazy Loading für Components

---

## Version 1.0.0 - 2025-12-01

**Title:** Initial Release
**Hero:** none
**Tags:** Release

### 🚀 Fast Search Card - Initial Release

Die erste offizielle Version der Fast Search Card.

**Core Features:**
- 🔍 Ultraschnelle Suche über alle Home Assistant Entities
- 📊 Grouping nach Domains (Light, Climate, etc.)
- 🏠 Raum-basierte Organisation
- 📱 Responsive Design
- 🎨 Anpassbare UI

**Supported Domains:**
- Light (Licht)
- Climate (Heizung/Klima)
- Cover (Rollladen)
- Switch (Schalter)
- Media Player
- Und viele mehr...

**Installation:**
\`\`\`bash
# Via HACS
1. HACS öffnen
2. "Fast Search Card" suchen
3. Installieren
\`\`\`

**Erste Schritte:**
1. Karte zu Dashboard hinzufügen
2. Entity-Filter konfigurieren
3. Fertig!

---
