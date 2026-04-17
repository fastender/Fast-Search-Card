# Versionsverlauf

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
