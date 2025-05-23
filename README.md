# Fast Search Card

Eine moderne, minimalistische Suchkarte für Home Assistant mit intelligenter Filterung und schlichtem Design.

![Fast Search Card Preview](https://via.placeholder.com/600x400/f5f5f5/333?text=Fast+Search+Card+Preview)

## ✨ Features

### 🔍 **Intelligente Suche**
- **Echtzeit-Suche** mit sofortigen Ergebnissen
- **Fuzzy Search** - findet Geräte auch bei Tippfehlern
- **Durchsucht** Namen, Typen und Räume gleichzeitig

### 🏠 **Multi-Room-Filter**
- **Mehrfachauswahl** von Räumen möglich
- **Integriert im Suchfeld** für kompaktes Design
- **Toggle-Verhalten** - Klick zum An/Abwählen

### 🎛️ **Gerätetyp-Filter**
- **Icons + Live-Statistiken** (z.B. "💡 Lichter - 7 An")
- **Zweizeiliges Design** mit Status-Count
- **Swipe-freundliche** horizontale Chips

### 📱 **Responsive Design**
- **Touch-optimiert** für mobile Nutzung
- **Gruppierte Anzeige** nach Räumen
- **Clean Interface** ohne visuelle Überladung
- **Smooth Animations** und Hover-Effekte

## 🚀 Installation

### Via HACS (Empfohlen)
1. Öffne HACS in Home Assistant
2. Gehe zu "Frontend" 
3. Klicke das ⋮ Menü (oben rechts) → "Custom repositories"
4. Füge hinzu: `https://github.com/fastender/Fast-Search-Card`
5. Kategorie: "Lovelace"
6. Suche nach "Fast Search Card" und installiere es
7. Starte Home Assistant neu

### Manuell
1. Lade `dist/fast-search-card.js` herunter
2. Kopiere die Datei in `/config/www/`
3. Füge in der Lovelace-Konfiguration hinzu:

```yaml
resources:
  - url: /local/fast-search-card.js
    type: module
```

## 📋 Konfiguration

### Basis-Konfiguration
```yaml
type: custom:fast-search-card
title: "Geräte suchen"
```

### Erweiterte Konfiguration
```yaml
type: custom:fast-search-card
title: "Smart Home Control"
entities:
  - light.*
  - switch.*
  - climate.*
  - cover.*
  - fan.*
  - sensor.*
show_room_filter: true
show_type_filter: true
compact_mode: false
```

## 🎨 Unterstützte Gerätetypen

| Typ | Icon | Beschreibung |
|-----|------|--------------|
| `light` | 💡 | Alle Beleuchtung |
| `switch` | 🔌 | Schalter und Steckdosen |
| `climate` | 🌡️ | Heizung und Klimaanlagen |
| `cover` | 🪟 | Rollos und Markisen |
| `fan` | 🌀 | Ventilatoren |
| `sensor` | 📊 | Sensoren |

## 🛠️ Anpassung

### Eigene Icons
```css
.device-icon[data-type="light"] {
  content: "🔆";
}
```

### Farbschema ändern
```css
:root {
  --fast-search-primary: #007aff;
  --fast-search-background: #ffffff;
  --fast-search-text: #333333;
}
```

## 📱 Screenshots

### Desktop-Ansicht
![Desktop View](https://via.placeholder.com/600x300/ffffff/333?text=Desktop+View)

### Mobile-Ansicht  
![Mobile View](https://via.placeholder.com/300x600/ffffff/333?text=Mobile+View)

### Filter-Funktionen
![Filters](https://via.placeholder.com/600x200/f8f9fa/333?text=Filter+Functions)

## 🤝 Mitwirken

Beiträge sind willkommen! Bitte beachte:

1. **Fork** das Repository
2. **Feature Branch** erstellen (`git checkout -b feature/amazing-feature`)
3. **Commit** deine Änderungen (`git commit -m 'Add amazing feature'`)
4. **Push** zum Branch (`git push origin feature/amazing-feature`)
5. **Pull Request** öffnen

## 🐛 Bug Reports

Gefunden einen Bug? [Erstelle ein Issue](https://github.com/fastender/Fast-Search-Card/issues) mit:

- **Home Assistant Version**
- **Browser/Gerät**
- **Schritte zum Reproduzieren**
- **Screenshots** (falls hilfreich)

## 📝 Changelog

### v1.0.0 (2025-01-XX)
- 🎉 Erste Veröffentlichung
- ✨ Multi-Room-Filter mit Mehrfachauswahl
- 🎨 Gerätetyp-Filter mit Live-Statistiken
- 📱 Responsive Design
- 🔍 Echtzeit-Suche

## 📄 Lizenz

Dieses Projekt steht unter der [MIT License](LICENSE).

## 💝 Danksagungen

- **Home Assistant Community** für Inspiration
- **Material Design** für Design-Prinzipien
- **Alle Contributors** die geholfen haben

---

⭐ **Gefällt dir das Projekt? Gib einen Stern!** ⭐

[🐛 Issues](https://github.com/fastender/Fast-Search-Card/issues) | [💡 Feature Requests](https://github.com/fastender/Fast-Search-Card/discussions) | [📖 Wiki](https://github.com/fastender/Fast-Search-Card/wiki)
