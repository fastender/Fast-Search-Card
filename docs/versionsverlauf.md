# Versionsverlauf

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
