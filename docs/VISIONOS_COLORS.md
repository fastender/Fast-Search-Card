# visionOS Color Palette - System-Entities

## Offizielle visionOS Farben

Fast Search Card nutzt die **offiziellen visionOS Farben** für alle System-Entities, um einen konsistenten, nativen Look zu gewährleisten.

### Farbpalette

Basierend auf der visionOS Liquid Glass Ästhetik:

| Farbe | RGB | Verwendung |
|-------|-----|------------|
| **Red** | `rgb(255, 69, 69)` | - |
| **Orange** | `rgb(255, 146, 48)` | ⏰ AllSchedules (Zeitpläne) |
| **Yellow** | `rgb(255, 214, 0)` | - |
| **Green** | `rgb(48, 209, 88)` | 🛍️ Marketplace |
| **Mint** | `rgb(0, 218, 195)` | - |
| **Teal** | `rgb(0, 210, 224)` | - |
| **Cyan** | `rgb(60, 211, 254)` | 🌤️ Weather (Wetter) |
| **Blue** | `rgb(0, 145, 255)` | ⚙️ Settings (Einstellungen) |
| **Indigo** | `rgb(107, 93, 255)` | - |
| **Purple** | `rgb(219, 52, 242)` | 🧩 PluginStore |
| **Pink** | `rgb(255, 55, 95)` | - |
| **Brown** | `rgb(183, 138, 102)` | - |

---

## Design-Prinzipien

### 1. Farbiger Hintergrund + Weißes Icon

**System-Entities** verwenden:
- ✅ **Hintergrund:** Farbig (visionOS Color)
- ✅ **Icon:** Weiß (100% opacity)
- ✅ **Text:** Weiß (auf farbigem Hintergrund)

**Beispiel:**
```css
.system-entity-card {
  background-color: rgb(0, 145, 255); /* Blue für Settings */
  color: white;
}

.system-entity-icon {
  color: white;
  fill: white;
}
```

### 2. Konsistenz

**Alle System-Entities** folgen dem gleichen Farbschema:
- Keine individuellen Farbvarianten
- Keine Farbverläufe (Gradients)
- Keine Transparenz im Icon

### 3. Hover-States

**Bei Hover:**
- ✅ Scale: 1.05 (leichte Vergrößerung)
- ✅ Farbe: Bleibt gleich
- ❌ **Keine** Farb-Änderung beim Hover

```javascript
hover: {
  scale: 1.05,
  backgroundColor: 'rgb(0, 145, 255)', // Bleibt gleich
  transition: {
    duration: 0.2,
    ease: [0.4, 0.0, 0.2, 1.0],
  }
}
```

---

## Implementierung

### SystemEntity Base Class

Jede System-Entity hat ein `brandColor` Property:

```javascript
// src/system-entities/base/SystemEntity.js
class SystemEntity {
  constructor(config) {
    this.brandColor = config.brandColor || null; // visionOS Brand Color (RGB)
    // ...
  }
}
```

### Entity Definition

```javascript
// src/system-entities/entities/weather/index.js
class WeatherEntity extends SystemEntity {
  constructor() {
    super({
      id: 'weather',
      domain: 'weather',
      name: 'Wetter',
      icon: 'mdi:weather-partly-cloudy',
      brandColor: 'rgb(60, 211, 254)', // visionOS Cyan
      category: 'system',
      // ...
    });
  }
}
```

### Appearance Config

```javascript
// src/system-entities/config/appearanceConfig.js
export const entityAppearanceConfig = {
  weather: {
    // Farben (visionOS Cyan)
    color: 'rgb(60, 211, 254)',
    hoverColor: 'rgb(60, 211, 254)',    // Bleibt gleich
    activeColor: 'rgb(60, 211, 254)',   // Bleibt gleich

    // Icon mit weißer Farbe
    iconColor: 'rgb(255, 255, 255)',

    // Animation
    animation: {
      hover: {
        scale: 1.05,  // Nur Vergrößerung, keine Farb-Änderung
      }
    }
  }
};
```

---

## Farbauswahl für neue System-Entities

### Noch verfügbare Farben:

- **Red** `rgb(255, 69, 69)` - Fehler, Warnungen, Alarme
- **Yellow** `rgb(255, 214, 0)` - Notifications, Warnings
- **Mint** `rgb(0, 218, 195)` - Energie, Solar
- **Teal** `rgb(0, 210, 224)` - Netzwerk, Connectivity
- **Indigo** `rgb(107, 93, 255)` - Automationen
- **Pink** `rgb(255, 55, 95)` - Medien, Multimedia
- **Brown** `rgb(183, 138, 102)` - Home, Räume

### Richtlinien:

1. **Semantische Zuordnung:** Farbe soll zur Funktion passen
   - Blau → Settings, System
   - Grün → Store, Marketplace
   - Orange → Zeit, Termine
   - Cyan → Wetter, Wasser
   - Purple → Extensions, Plugins

2. **Kontrast:** Farbe muss mit weißem Text/Icon lesbar sein
   - Alle visionOS Farben bieten ausreichend Kontrast
   - Mindestkontrastrate: 4.5:1 (WCAG AA)

3. **Keine Duplikate:** Jede System-Entity nutzt eine einzigartige Farbe

---

## Verwendung in Code

### DeviceCard Integration

```javascript
// src/system-entities/integration/DeviceCardIntegration.jsx

export function getSystemEntityColor(device, state = 'inactive') {
  if (!device.is_system) return null;

  const config = entityAppearanceConfig[device.domain];
  if (!config) return null;

  // Alle States nutzen die gleiche Farbe
  return config.color;
}

// Icon immer weiß
export function getSystemEntityIconColor() {
  return 'rgb(255, 255, 255)'; // White
}
```

### CSS Variables

```css
:root {
  /* visionOS System Colors */
  --visionos-red: rgb(255, 69, 69);
  --visionos-orange: rgb(255, 146, 48);
  --visionos-yellow: rgb(255, 214, 0);
  --visionos-green: rgb(48, 209, 88);
  --visionos-mint: rgb(0, 218, 195);
  --visionos-teal: rgb(0, 210, 224);
  --visionos-cyan: rgb(60, 211, 254);
  --visionos-blue: rgb(0, 145, 255);
  --visionos-indigo: rgb(107, 93, 255);
  --visionos-purple: rgb(219, 52, 242);
  --visionos-pink: rgb(255, 55, 95);
  --visionos-brown: rgb(183, 138, 102);
}

.system-entity-card.settings {
  background-color: var(--visionos-blue);
}

.system-entity-card.marketplace {
  background-color: var(--visionos-green);
}

.system-entity-card.weather {
  background-color: var(--visionos-cyan);
}
```

---

## Checkliste für neue System-Entity

Beim Erstellen einer neuen System-Entity:

- [ ] Passende visionOS Farbe aus Palette wählen
- [ ] `brandColor` in Entity Constructor setzen
- [ ] `appearanceConfig.js` erweitern
- [ ] Icon-Komponente mit weißer Farbe erstellen
- [ ] DeviceCardIntegration.jsx aktualisieren
- [ ] CSS für Card-Hintergrund definieren
- [ ] Hover-Animation (nur Scale, keine Farb-Änderung)
- [ ] In diesem Dokument dokumentieren

---

## Beispiel: Weather Entity

### Entity Definition
```javascript
{
  id: 'weather',
  brandColor: 'rgb(60, 211, 254)', // visionOS Cyan
  icon: 'mdi:weather-partly-cloudy'
}
```

### Appearance Config
```javascript
weather: {
  color: 'rgb(60, 211, 254)',
  hoverColor: 'rgb(60, 211, 254)',
  iconColor: 'rgb(255, 255, 255)'
}
```

### Visuelles Ergebnis
```
┌────────────────┐
│   ☀️ (weiß)    │  ← Weißes Icon
│                │
│     Wetter     │  ← Weißer Text
│                │
└────────────────┘
   Cyan Background
```

---

## Referenzen

- [Apple Human Interface Guidelines - Color](https://developer.apple.com/design/human-interface-guidelines/color)
- [visionOS Design Resources](https://developer.apple.com/design/resources/)
- Fast Search Card: `src/system-entities/config/appearanceConfig.js`

---

**Version:** 1.0
**Letzte Aktualisierung:** 2025-10-30
**Autor:** Fast Search Card Team
