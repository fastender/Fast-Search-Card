# StatsBar & GreetingsBar - Dokumentation

## Übersicht

Die Fast Search Card zeigt beim Laden zwei optionale UI-Komponenten:
- **StatsBar** - Permanente Status-Leiste mit Live-Informationen
- **GreetingsBar** - Zeitbasierte Begrüßung (nur im collapsed State)

## 📊 StatsBar

### Komponente
**Datei:** `src/components/StatsBar.jsx`

### Funktion
Zeigt eine permanente horizontale Leiste mit konfigurierbaren Widgets für Live-Daten.

### Angezeigte Widgets

| Widget | Icon | Beschreibung | Standard | Mobile |
|--------|------|--------------|----------|--------|
| Username | 👤 | Angemeldeter Benutzer | ✅ An | ✅ An |
| Wetter | 🌤️ | Temperatur + Wetter-Icon | ✅ An | ❌ Aus |
| Netzbezug | ⚡ | Grid Consumption (kW) | ✅ An | ✅ An |
| Einspeisung | 🔋 | Grid Return (kW) | ✅ An | ✅ An |
| Solar | ☀️ | Solar Production (kW) | ❌ Aus | ❌ Aus |
| Batterie | 🔋 | Battery (kW) | ❌ Aus | ❌ Aus |
| Benachrichtigungen | 🔔 | Notification Count | ✅ An | ✅ An |
| Zeit | 🕐 | Aktuelle Uhrzeit (HH:MM) | ✅ An | ✅ An |

### Live-Updates

```javascript
// Uhrzeit: Update jede Minute
useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTime(new Date());
  }, 60000);
}, []);

// Energie-Sensoren: Live via hass.states
const energyValue = getSensorState(hass, sensorId);
```

### Konfiguration

**localStorage Key:** `systemSettings.statsBar`

```javascript
{
  "statsBar": {
    "widgets": {
      "weather": true,           // Wetter anzeigen
      "gridConsumption": true,   // Netzbezug
      "gridReturn": true,        // Einspeisung
      "solar": false,            // Solar (default OFF)
      "battery": false,          // Batterie (default OFF)
      "notifications": true,     // Benachrichtigungen
      "time": true              // Uhrzeit
    }
  },
  "appearance": {
    "statsBarEnabled": true,     // StatsBar ein/aus
    "statsBarUsername": "User"   // Username anzeigen
  }
}
```

### Props

```javascript
<StatsBar
  username={string}              // Angezeigter Username
  weatherEntity={object}         // Wetter-Entity von HA
  powerEntity={object}          // Deprecated: Legacy Power Entity
  hass={object}                 // Home Assistant Objekt
  notificationCount={number}    // Anzahl Benachrichtigungen
  show={boolean}                // StatsBar ein/aus
  isMobile={boolean}            // Mobile Layout
  position={string}             // 'centered' | 'top'
  hasAppeared={boolean}         // Animation-Flag
/>
```

### Event-Listener

```javascript
// Widget-Settings geändert
window.addEventListener('statsBarWidgetsChanged', handleWidgetChange);

// Energie-Sensoren geändert
window.addEventListener('energySensorConfigChanged', handleEnergySensorChange);

// localStorage geändert
window.addEventListener('storage', handleEnergySensorChange);
```

### Styling

```css
.stats-bar {
  display: flex;
  justify-content: space-between;
  border-radius: 20px;
  font-size: 13px-14px;  /* Mobile: 13px, Desktop: 14px */
  color: rgba(255, 255, 255, 0.9);
}

/* Widget-Container */
.stats-bar > div {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  gap: 6px;
}
```

---

## 👋 GreetingsBar

### Komponente
**Datei:** `src/components/GreetingsBar.jsx`

### Funktion
Zeigt eine zeitbasierte Begrüßung in der Mitte des Bildschirms. Erscheint nur wenn das Search-Panel **collapsed** ist.

### Zeitbasierte Begrüßungen

| Uhrzeit | Deutsch | English |
|---------|---------|---------|
| 00:00 - 11:59 | Guten Morgen | Good Morning |
| 12:00 - 17:59 | Guten Tag | Good Afternoon |
| 18:00 - 23:59 | Guten Abend | Good Evening |

### Anzeigebedingungen

Die GreetingsBar wird **nur** angezeigt wenn:
1. ✅ `greetingsBarEnabled = true` (Settings)
2. ✅ Search-Panel **nicht expanded** (`!isExpanded`)
3. ✅ Position ist **centered** (`position === 'centered'`)

```javascript
{show && !isExpanded && (
  <GreetingsBar />
)}
```

### Animation

```javascript
// Entrance
initial={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}

// Exit (beim Expandieren)
exit={{
  opacity: 0,
  y: -20,                    // Nach oben ausblenden
  filter: 'blur(8px)',
  transition: { duration: 0.2 }
}}
```

### Konfiguration

**localStorage Key:** `systemSettings.appearance`

```javascript
{
  "appearance": {
    "greetingsBarEnabled": true,    // GreetingsBar ein/aus
    "statsBarUsername": "User"      // Username in Begrüßung
  }
}
```

### Props

```javascript
<GreetingsBar
  username={string}           // Angezeigter Username
  show={boolean}             // GreetingsBar ein/aus
  isExpanded={boolean}       // Panel expanded State
  currentLanguage={string}   // 'de' | 'en'
  isMobile={boolean}         // Mobile Layout
  position={string}          // 'centered' | 'top'
  hasAppeared={boolean}      // Initial Animation Flag
/>
```

### Styling

```css
.greetings-bar {
  width: 100%;
  margin-top: 16px-24px;     /* Mobile: 16px, Desktop: 24px */
  margin-bottom: 16px-24px;
  display: flex;
  justify-content: center;
  text-align: center;
}

/* Text Container */
.greetings-bar > div {
  padding: 8px 20px-12px 32px;  /* Mobile vs Desktop */
  border-radius: 16px;
  font-size: 20px-36px;          /* Mobile: 20px, Desktop: 36px */
  font-weight: 600;
  backdrop-filter: blur(12px) saturate(150%);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* Username Gradient */
.greetings-bar span {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## 🔍 Suchleiste (SearchField)

### Komponente
**Datei:** `src/components/SearchField.jsx`

### Layout-Hierarchie

```
SearchField
├── StatsBar (immer sichtbar)
├── GreetingsBar (nur wenn collapsed)
└── search-row
    ├── search-panel (Hauptsuchleiste)
    │   ├── FilterControlPanel
    │   ├── SearchInputSection
    │   ├── CategoryButtonsPanel
    │   └── SubcategoryBar
    └── DetailView (wenn Device ausgewählt)
```

### Render-Reihenfolge

```jsx
return (
  <>
    {/* 1. StatsBar - IMMER sichtbar */}
    <StatsBar
      show={statsBarSettings.enabled}
      hasAppeared={hasAppeared}
    />

    {/* 2. GreetingsBar - NUR wenn collapsed */}
    <GreetingsBar
      show={greetingsBarSettings.enabled}
      isExpanded={isExpanded || position === 'top'}
      hasAppeared={hasAppeared}
    />

    {/* 3. Suchleiste */}
    <div className="search-row">
      <motion.div className="search-panel">
        {/* Search UI */}
      </motion.div>
    </div>
  </>
);
```

### Animations-Flow

#### Initial Load
```
1. LoadingScreen (0% → 100%)
2. hasAppeared = true (nach Timeout)
3. StatsBar: fade-in (opacity 0 → 1)
4. GreetingsBar: fade-in + blur-out
5. SearchPanel: fade-in
```

#### Beim Expandieren
```
1. GreetingsBar: exit animation (y: -20, opacity: 0)
2. SearchPanel: height expansion (72px → 672px)
3. StatsBar: bleibt sichtbar
```

### Animation States

```javascript
const [hasAppeared, setHasAppeared] = useState(false);

useEffect(() => {
  const timer = setTimeout(() => {
    setHasAppeared(true);  // Trigger fade-in
  }, 100);
  return () => clearTimeout(timer);
}, []);
```

---

## 🎛️ Einstellungen verwalten

### Via Settings Tab

Der Benutzer kann StatsBar/GreetingsBar in den Einstellungen aktivieren/deaktivieren:

**Settings → Appearance**
- ☑️ Show StatsBar
- ☑️ Show GreetingsBar
- 📝 Username

### Via localStorage (Programmierung)

```javascript
// Settings laden
const systemSettings = JSON.parse(localStorage.getItem('systemSettings') || '{}');

// StatsBar aktivieren/deaktivieren
systemSettings.appearance.statsBarEnabled = true;

// GreetingsBar aktivieren/deaktivieren
systemSettings.appearance.greetingsBarEnabled = true;

// Username ändern
systemSettings.appearance.statsBarUsername = "Max";

// Speichern
localStorage.setItem('systemSettings', JSON.stringify(systemSettings));

// Event triggern für Live-Update
window.dispatchEvent(new CustomEvent('statsBarWidgetsChanged', {
  detail: newWidgetSettings
}));
```

### Widget-Konfiguration ändern

```javascript
// Nur Solar-Widget anzeigen
systemSettings.statsBar.widgets.solar = true;
systemSettings.statsBar.widgets.weather = false;
systemSettings.statsBar.widgets.gridConsumption = false;

localStorage.setItem('systemSettings', JSON.stringify(systemSettings));

// Event triggern
window.dispatchEvent(new Event('statsBarWidgetsChanged'));
```

---

## 🐛 Troubleshooting

### Problem: StatsBar zeigt keine Energie-Werte

**Ursache:** Energie-Sensoren nicht konfiguriert

**Lösung:**
```javascript
// Energie-Sensoren konfigurieren
const energyConfig = {
  gridConsumption: 'sensor.grid_consumption',
  gridReturn: 'sensor.grid_return',
  solar: 'sensor.solar_production',
  battery: 'sensor.battery_power'
};

localStorage.setItem('energySensorConfig', JSON.stringify(energyConfig));

// Event triggern
window.dispatchEvent(new Event('energySensorConfigChanged'));
```

### Problem: GreetingsBar verschwindet nicht beim Expandieren

**Ursache:** `isExpanded` State nicht korrekt

**Lösung:**
```javascript
// Check State
console.log('isExpanded:', isExpanded);
console.log('position:', position);

// GreetingsBar sollte hidden sein wenn:
// isExpanded === true ODER position === 'top'
```

### Problem: StatsBar Uhrzeit aktualisiert sich nicht

**Ursache:** Interval nicht aktiv

**Lösung:**
```javascript
// Check ob Interval läuft
useEffect(() => {
  console.log('StatsBar mounted, starting time interval');
  const timer = setInterval(() => {
    console.log('Updating time:', new Date());
    setCurrentTime(new Date());
  }, 60000);

  return () => {
    console.log('StatsBar unmounting, clearing interval');
    clearInterval(timer);
  };
}, []);
```

---

## 📝 Best Practices

### Performance

1. **Lazy Loading für Energie-Werte**
   ```javascript
   // Nur laden wenn Widget aktiv
   {widgetSettings.gridConsumption && (
     <div>{getEnergyValue(energySensors.gridConsumption)}</div>
   )}
   ```

2. **Debouncing für localStorage Events**
   ```javascript
   let timeoutId;
   window.addEventListener('storage', () => {
     clearTimeout(timeoutId);
     timeoutId = setTimeout(() => {
       handleEnergySensorChange();
     }, 300);
   });
   ```

3. **Memoization für Energie-Sensoren**
   ```javascript
   const [energySensors] = useState(() =>
     loadEnergySensorConfig() || defaultConfig
   );
   ```

### Accessibility

1. **ARIA Labels für StatsBar Widgets**
   ```jsx
   <div aria-label="Current temperature">
     {weatherTemp}
   </div>
   ```

2. **Reduced Motion Support**
   ```css
   @media (prefers-reduced-motion: reduce) {
     .greetings-bar {
       animation: none;
       transition: none;
     }
   }
   ```

### Responsive Design

```javascript
// Mobile Detection
const isMobile = window.innerWidth < 768;

// Conditional Rendering
{!isMobile && widgetSettings.weather && (
  <WeatherWidget />
)}
```

---

## 🔗 Verwandte Dateien

- `src/components/StatsBar.jsx` - StatsBar Komponente
- `src/components/GreetingsBar.jsx` - GreetingsBar Komponente
- `src/components/SearchField.jsx` - Haupt-Suchkomponente
- `src/services/energyDashboardService.js` - Energie-Sensor Service
- `src/utils/translations.js` - UI-Übersetzungen

---

## 📅 Changelog

### v1.1.0944 (2026-01-11)
- **DetailView: FINAL FIX** - Zweistufige Positionierungs-Logik
- **Problem**: DetailView mit `position: absolute; top: 0` überdeckte die StatsBar
- **Root Cause**: Nur `y`-Transform war nicht ausreichend, da CSS `top: 0` die View an den Anfang setzte
- **Lösung**: Kombination aus CSS `top` und Transform `y`:
  - `top: 45/46px` - Fixer Offset für StatsBar-Höhe (Mobile/Desktop)
  - `y: 0/60/120px` - Dynamischer Offset für centered/top Position
- **Ergebnis**: DetailView positioniert sich korrekt unterhalb der StatsBar ohne Überlappung ✅

### v1.1.0942 (2026-01-11)
- GreetingsBar: Refactoring zu normalem Layout-Flow
- GreetingsBar: Smooth Exit-Animation nach oben
- Removed: `position: absolute` für bessere Performance

### v1.1.0783 (2026-01-06)
- StatsBar: Widget-System implementiert
- StatsBar: Live-Updates für Energie-Sensoren
- GreetingsBar: Zeitbasierte Mehrsprachigkeit (DE/EN)
