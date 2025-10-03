# Fast Search Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)
[![Version](https://img.shields.io/badge/version-1.1.0002-blue.svg)](https://github.com/fastender/Fast-Search-Card)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Eine moderne Lovelace Card für Home Assistant mit **visionOS-inspiriertem Design**, **Inline-Autocomplete** und **KI-Integration**.

![Fast Search Card Screenshot](https://via.placeholder.com/800x400.png?text=Fast+Search+Card+Screenshot)

---

## ✨ Features

### 🔍 Intelligente Suche
- **Inline-Autocomplete**: Zeigt Vorschläge grau hinter dem Text während der Eingabe
- **Fuzzy Search**: Tolerante Suche mit Fuse.js - findet auch Tippfehler
- **Multi-Kategorie-Filter**: Geräte, Sensoren, Aktionen, Benutzerdefiniert
- **Schnellsuche**: Enter-Taste führt erste Aktion direkt aus

### 🎨 visionOS Design
- **Glassmorphism**: Moderne Blur-Effekte und transparente Cards
- **Staggered Animations**: Flüssige Übergänge beim Laden
- **Grid/List-Ansicht**: Umschaltbare Darstellungsmodi
- **Responsive**: Optimiert für Desktop, Tablet und Mobile

### 🤖 KI-Integration
- **AI-Mode**: Natürliche Sprachverarbeitung für Gerätesteuerung
- **Kontextbewusst**: KI versteht Gerätenamen, Räume und Szenen
- **Chat-Interface**: Intuitive Konversation mit deinem Smart Home

### ⭐ Favoriten & Filter
- **Favoriten-System**: Schnellzugriff auf häufig genutzte Geräte
- **Excluded Patterns**: Flexible Pattern-basierte Entity-Filterung
- **Pattern Templates**: 8 vordefinierte Templates (Lichter, Sensoren, etc.)
- **Live-Vorschau**: Zeigt sofort, welche Entities betroffen sind
- **Import/Export**: Pattern-Sets als JSON sichern und teilen

### 📊 Erweiterte Features
- **Detail-View**: Vollständige Geräteinformationen mit History
- **Unterkategorien**: Filter nach Raum, Typ oder Status
- **Icon-System**: 60+ custom SVG-Icons für alle Gerätetypen
- **Multi-Language**: 10 Sprachen unterstützt (DE, EN, ES, FR, IT, NL, PT, RU, TR, ZH)

---

## 📦 Installation

### HACS (Empfohlen)

1. **HACS öffnen** in Home Assistant
2. **Custom Repository hinzufügen**:
   - Klicke auf die 3 Punkte oben rechts
   - Wähle "Custom repositories"
   - URL: `https://github.com/fastender/Fast-Search-Card`
   - Kategorie: `Lovelace`
3. **Installieren**:
   - Suche nach "Fast Search Card"
   - Klicke auf "Download"
4. **Home Assistant neu laden**

### Manuelle Installation

1. **Download der neuesten Version**:
   ```bash
   wget https://raw.githubusercontent.com/fastender/Fast-Search-Card/main/dist/fast-search-card.js
   ```

2. **Datei kopieren** nach:
   ```
   /config/www/community/fast-search-card/fast-search-card.js
   ```

3. **Ressource registrieren** in Home Assistant:
   - Gehe zu **Einstellungen** → **Dashboards** → **Ressourcen**
   - Klicke auf **"Ressource hinzufügen"**
   - URL: `/local/community/fast-search-card/fast-search-card.js`
   - Typ: `JavaScript-Modul`

4. **Home Assistant neu laden**

---

## 🚀 Verwendung

### Basis-Konfiguration

```yaml
type: custom:fast-search-card
```

Das war's! Die Karte funktioniert out-of-the-box ohne weitere Konfiguration.

### Erweiterte Konfiguration

```yaml
type: custom:fast-search-card
card_height: 600  # Optional: Feste Höhe in Pixel
```

---

## ⚙️ Konfiguration

Die meisten Einstellungen werden **direkt in der Karte** über den Settings-Tab konfiguriert:

### Settings Tab

#### 📋 About
- **Excluded Patterns**: Pattern-basierte Entity-Filterung
  - **Templates**: 8 vordefinierte Pattern-Vorlagen
  - **Live-Vorschau**: Zeigt sofort betroffene Entities
  - **Import/Export**: Pattern-Sets als JSON sichern/laden
  - **Bulk-Operationen**: Mehrere Patterns auf einmal verwalten

#### 🌐 General
- **Language**: Wähle aus 10 Sprachen
- **View Mode**: Grid oder List-Ansicht
- **Theme**: Nutzt automatisch dein Home Assistant Theme

#### 🤖 AI (Optional)
- **AI-Mode aktivieren**: Natürliche Sprachverarbeitung
- **API-Key**: OpenAI oder andere KI-Provider

#### 🎨 visionOS Colors
- Farbpalette für konsistentes Design (Reference only)

---

## 📖 Pattern System

### Pattern-Syntax

Patterns unterstützen Wildcards für flexible Filterung:

| Pattern | Beschreibung | Beispiel |
|---------|--------------|----------|
| `*` | Beliebige Zeichen | `sensor.*` = Alle Sensoren |
| `?` | Einzelnes Zeichen | `light.room_?` = light.room_1, light.room_2 |
| `.` | Literal Punkt | `sensor.temp` = Exakt "sensor.temp" |

### Vordefinierte Templates

| Template | Pattern | Beschreibung |
|----------|---------|--------------|
| 🌡️ Klima | `climate.*` | Alle Klima-Geräte |
| 💡 Lichter | `light.*` | Alle Lichter |
| 📊 Sensoren | `sensor.*` | Alle Sensoren |
| 🔘 Binary Sensoren | `binary_sensor.*` | Alle Binary Sensoren |
| 🔌 Switches | `switch.*` | Alle Switches |
| ⚠️ Unavailable | `*_unavailable` | Alle nicht verfügbaren Entities |
| 🔋 Batterie | `*_battery*` | Alle Batterie-Sensoren |
| 🌡️ Temperatur | `*temp*` | Alle Temperatur-Sensoren |

### Pattern-Beispiele

```yaml
# Alle Sensoren ausschließen
sensor.*

# Alle Motion-Sensoren im Wohnzimmer
binary_sensor.living_room_motion_*

# Alle nicht verfügbaren Geräte
*_unavailable

# Spezifische Geräte
light.kitchen_main
switch.garage_door
```

---

## 🎨 Anpassung

### Theme-Integration

Die Karte nutzt **automatisch dein Home Assistant Theme**. Keine zusätzliche Konfiguration nötig!

### Custom Icons

Die Karte enthält 60+ custom SVG-Icons für:
- 🏠 Klima (AC, Heizung, Fan)
- 💡 Lichter (Bulb, Strip, Ceiling)
- 🔒 Sicherheit (Lock, Siren, Camera)
- 🧹 Reinigung (Vacuum, Air Purifier)
- 📺 Media (TV, Speaker, Player)
- 🚪 Cover (Garage, Blinds, Curtains)
- 📊 Sensoren (Motion, Door, Temperature)

---

## 🌍 Unterstützte Sprachen

- 🇩🇪 Deutsch
- 🇬🇧 English
- 🇪🇸 Español
- 🇫🇷 Français
- 🇮🇹 Italiano
- 🇳🇱 Nederlands
- 🇵🇹 Português
- 🇷🇺 Русский
- 🇹🇷 Türkçe
- 🇨🇳 中文

---

## 🛠️ Entwicklung

### Development Setup

```bash
# Dependencies installieren
npm install

# Development Server starten
npm run dev

# Build erstellen
npm run build

# Build + GitHub Upload
./build.sh
```

### Projektstruktur

```
fast-search-card/
├── src/
│   ├── components/       # React-Komponenten
│   ├── hooks/           # Custom Hooks
│   ├── providers/       # Context Provider
│   ├── utils/           # Helper-Funktionen
│   ├── assets/          # Icons, Wallpapers
│   └── index.jsx        # Entry Point
├── dist/
│   └── fast-search-card.js  # Build Output
├── build.sh             # Build + Deploy Script
└── vite.config.js       # Build Configuration
```

### Tech Stack

- **Framework**: Preact 10.27.1 (React-Alternative)
- **Build Tool**: Vite 7.1.3
- **Search**: Fuse.js 7.1.0 (Fuzzy Search)
- **Charts**: ApexCharts 5.3.4 (History Tab)
- **Bundler**: esbuild 0.25.9

---

## 📝 Changelog

### v1.1.0002 (2025-10-03)
- ✅ GitHub Auto-Upload Integration
- 📝 Dokumentation erweitert

### v1.1.0 (2025-01-20)
- ✅ Background-System entfernt (nutzt jetzt HA-Theme)
- 🐛 RegExp Bug in Pattern-Preview behoben

### v1.0.0 (2025-01-17)
- ✨ Pattern Enhancement Features
  - 📋 Pattern Templates (8 vordefinierte)
  - 🔍 Live-Vorschau für Patterns
  - 📤 Import/Export von Pattern-Sets
  - 🗑️ Bulk-Operationen
- 🎨 visionOS-Design implementiert
- 🔍 Inline-Autocomplete
- 🤖 AI-Mode Integration
- ⭐ Favoriten-System
- 🌍 10 Sprachen

---

## 🤝 Beitragen

Contributions sind willkommen! Bitte erstelle ein Issue oder Pull Request.

### Entwicklungs-Workflow

1. **Fork** das Repository
2. **Branch** erstellen: `git checkout -b feature/amazing-feature`
3. **Commit** Änderungen: `git commit -m '✨ Add amazing feature'`
4. **Push** zum Branch: `git push origin feature/amazing-feature`
5. **Pull Request** öffnen

---

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE) für Details

---

## 🙏 Credits

- **Design**: Inspiriert von Apple's visionOS
- **Icons**: Custom SVG-Icons
- **Fuzzy Search**: Powered by [Fuse.js](https://fusejs.io/)
- **Charts**: Powered by [ApexCharts](https://apexcharts.com/)

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/fastender/Fast-Search-Card/issues)
- **Discussions**: [GitHub Discussions](https://github.com/fastender/Fast-Search-Card/discussions)
- **Home Assistant Forum**: [Community Thread](https://community.home-assistant.io/)

---

## ⭐ Star History

Wenn dir diese Karte gefällt, gib ihr einen ⭐ auf GitHub!

[![Star History Chart](https://api.star-history.com/svg?repos=fastender/Fast-Search-Card&type=Date)](https://star-history.com/#fastender/Fast-Search-Card&Date)
