# Fast Search Card

**Eine moderne Lovelace Card mit visionOS-Design, Inline-Autocomplete und KI-Integration**

---

## ✨ Hauptfeatures

### 🔍 Intelligente Suche
- **Inline-Autocomplete** während der Eingabe
- **Fuzzy Search** mit Tippfehlertoleranz
- **Multi-Kategorie-Filter** (Geräte, Sensoren, Aktionen)
- **Schnellsuche** mit Enter-Taste

### 🎨 visionOS Design
- **Glassmorphism** mit modernen Blur-Effekten
- **Staggered Animations** für flüssige Übergänge
- **Grid/List-Ansicht** umschaltbar
- **Responsive** für alle Bildschirmgrößen

### 🤖 KI-Integration
- **AI-Mode** für natürliche Sprachverarbeitung
- **Kontextbewusst** (Gerätenamen, Räume, Szenen)
- **Chat-Interface** für intuitive Steuerung

### ⭐ Erweiterte Features
- **Favoriten-System** für Schnellzugriff
- **Excluded Patterns** mit Templates und Live-Vorschau
- **Import/Export** von Pattern-Sets
- **60+ Custom Icons** für alle Gerätetypen
- **10 Sprachen** unterstützt

---

## 📦 Installation

### Via HACS (Empfohlen)

1. HACS öffnen → Custom Repository hinzufügen
2. URL: `https://github.com/fastender/Fast-Search-Card`
3. Kategorie: `Lovelace`
4. "Fast Search Card" suchen und installieren
5. Home Assistant neu laden

### Manuell

```bash
wget https://raw.githubusercontent.com/fastender/Fast-Search-Card/main/dist/fast-search-card.js
```

Kopiere nach: `/config/www/community/fast-search-card/fast-search-card.js`

Registriere als Ressource:
- URL: `/local/community/fast-search-card/fast-search-card.js`
- Typ: `JavaScript-Modul`

---

## 🚀 Verwendung

### Basis-Konfiguration

```yaml
type: custom:fast-search-card
```

### Mit fester Höhe

```yaml
type: custom:fast-search-card
card_height: 600
```

---

## ⚙️ Pattern-System

### Vordefinierte Templates

- 🌡️ **Klima**: `climate.*` - Alle Klima-Geräte
- 💡 **Lichter**: `light.*` - Alle Lichter
- 📊 **Sensoren**: `sensor.*` - Alle Sensoren
- 🔘 **Binary Sensoren**: `binary_sensor.*` - Alle Binary Sensoren
- 🔌 **Switches**: `switch.*` - Alle Switches
- ⚠️ **Unavailable**: `*_unavailable` - Nicht verfügbare Entities
- 🔋 **Batterie**: `*_battery*` - Batterie-Sensoren
- 🌡️ **Temperatur**: `*temp*` - Temperatur-Sensoren

### Pattern-Syntax

- `*` = Beliebige Zeichen
- `?` = Einzelnes Zeichen
- `.` = Literal Punkt

### Beispiele

```
sensor.*                      # Alle Sensoren
binary_sensor.motion_*        # Alle Motion-Sensoren
*_unavailable                 # Alle nicht verfügbaren
light.kitchen_main            # Spezifisches Gerät
```

---

## 🌍 Unterstützte Sprachen

Deutsch • English • Español • Français • Italiano • Nederlands • Português • Русский • Türkçe • 中文

---

## 📝 Changelog

### v1.1.0002 (2025-10-03)
- GitHub Auto-Upload Integration

### v1.1.0 (2025-01-20)
- Background-System entfernt (nutzt HA-Theme)
- RegExp Bug behoben

### v1.0.0 (2025-01-17)
- Initial Release
- Pattern Templates
- Live-Vorschau
- Import/Export
- visionOS Design

---

## 📄 Lizenz

GNU General Public License v3.0 (GPL-3.0-or-later) – siehe [LICENSE](LICENSE)

---

## 🙏 Credits

Design inspiriert von Apple's visionOS  
Fuzzy Search powered by [Fuse.js](https://fusejs.io/)  
Charts powered by [ApexCharts](https://apexcharts.com/)

---

**⭐ Wenn dir diese Karte gefällt, gib ihr einen Stern auf GitHub!**
