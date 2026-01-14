# StatsBar Settings - Technische Dokumentation

## Überblick

Das StatsBar Settings Feature ermöglicht die Konfiguration der StatsBar-Komponente, die wichtige Informationen wie Wetter, Energie-Daten und Zeit permanent über dem Suchfeld anzeigt.

### Datei-Standort
`src/components/tabs/SettingsTab/components/StatsBarSettingsTab.jsx`

### Abhängigkeiten
- **Preact**: Framework (h, useState, useEffect, useRef)
- **Framer Motion**: Animationen und Transitions
- **CustomScrollbar**: Benutzerdefinierte Scrollbar-Komponente
- **energyDashboardService**: Energie-Sensor-Erkennung und -Validierung

---

## Architektur

### Component Hierarchy

```
StatsBarSettingsTab
├── Main View
│   ├── Navbar (Back + Title)
│   ├── SETTINGS Section
│   │   ├── Widgets Item (→ navigiert zu Widgets View)
│   │   └── Data Sources Item (→ navigiert zu Data Sources View)
│   └── ABOUT STATSBAR Section
│       └── Info Card (Features-Liste)
│
├── Widgets View
│   ├── Navbar (Back + Title)
│   └── AVAILABLE WIDGETS Section
│       ├── Weather Widget (Toggle)
│       ├── Grid Consumption Widget (Toggle)
│       ├── Grid Return Widget (Toggle)
│       ├── Solar Production Widget (Toggle)
│       ├── Notifications Widget (Toggle)
│       ├── Time Widget (Toggle)
│       ├── Today's Consumption Widget (Toggle) ✨ NEU
│       └── Today's Cost Widget (Toggle) ✨ NEU
│
└── Data Sources View
    ├── Navbar (Back + Title)
    ├── DETECTION MODE Section
    │   ├── Auto Detection (Toggle)
    │   └── Start Detection Button (wenn Auto)
    ├── CONFIGURED SENSORS Section
    │   ├── Grid Consumption Status
    │   ├── Grid Return Status
    │   ├── Solar Status
    │   └── Battery Status
    ├── ENERGY PRICE CONFIGURATION Section ✨ NEU
    │   ├── Price per kWh Label
    │   ├── Price Input (Number, Step 0.01)
    │   └── €/kWh Unit Display
    ├── MANUAL CONFIGURATION Section (nur wenn Manual Mode)
    │   ├── Grid Consumption Entity Input
    │   ├── Grid Return Entity Input
    │   ├── Solar Entity Input
    │   └── Battery Entity Input
    └── ABOUT DATA SOURCES Section
        └── Info Text
```

---

## Views im Detail

### 1. Main View

**Zweck**: Übersicht und Navigation zu den Einstellungsbereichen

**Struktur**:
```javascript
{
  navbar: {
    backButton: "← Back",
    title: "StatsBar"
  },
  sections: [
    {
      header: "SETTINGS",
      items: [
        {
          label: "Widgets",
          subtitle: "Manage available widgets",
          value: "6 Active",
          action: "navigate → widgets"
        },
        {
          label: "Data Sources",
          subtitle: "Configure energy sensors",
          value: "🔍 Auto | 🔍 Muster | ✏️ Manuell | --",
          action: "navigate → dataSources"
        }
      ]
    },
    {
      header: "ABOUT STATSBAR",
      content: {
        description: "Show status bar with widgets",
        features: [
          "Live Updates",
          "Energy Dashboard Integration",
          "Customizable Widgets"
        ]
      }
    }
  ]
}
```

**Code-Implementierung**:
```jsx
<div className="ios-section">
  <div className="ios-section-header">
    {lang === 'de' ? 'EINSTELLUNGEN' : 'SETTINGS'}
  </div>
  <div className="ios-card">
    <motion.div
      className="ios-item ios-item-clickable"
      onClick={navigateToWidgets}
    >
      {/* Widgets Item */}
    </motion.div>
    <motion.div
      className="ios-item ios-item-clickable"
      onClick={navigateToDataSources}
    >
      {/* Data Sources Item */}
    </motion.div>
  </div>
</div>
```

**Status-Anzeige für Data Sources**:
| Anzeige | Bedeutung | Quelle |
|---------|-----------|--------|
| 🔍 Auto | Erkannt via Energy Dashboard | `detectionStatus.source === 'energy_dashboard'` |
| 🔍 Muster | Erkannt via Pattern-Matching | `detectionStatus.source === 'auto_detect'` |
| ✏️ Manuell | Manuell konfiguriert | `sensorMode === 'manual'` |
| -- | Nicht geprüft | `!detectionStatus` |

---

### 2. Widgets View

**Zweck**: Aktivierung/Deaktivierung einzelner StatsBar-Widgets

**Widget-Liste**:
1. **Weather** (☀️ Wetter)
   - Default: `true`
   - Anzeige: Temperatur & Icon

2. **Grid Consumption** (⚡ Energy - Grid Import)
   - Default: `true`
   - Anzeige: Aktueller Verbrauch (berechnet aus Energy Dashboard)
   - Icon: Transmission Tower SVG

3. **Grid Return** (🔋 Energy - Grid Export)
   - Default: `true`
   - Anzeige: Rückspeisung ins Netz
   - Icon: Grid Return SVG (Arrow Down in Bag)

4. **Solar** (☀️ Solar Production)
   - Default: `false`
   - Anzeige: Aktuelle Erzeugung (berechnet aus Energy Dashboard)
   - Icon: Solar Panel Grid SVG

5. **Notifications** (🔔 Notifications)
   - Default: `true`
   - Anzeige: Counter

6. **Time** (🕐 Time)
   - Default: `true`
   - Anzeige: Live-Update

7. **Today's Consumption** (📊 Bisheriger Verbrauch heute) ✨ NEU
   - Default: `false`
   - Anzeige: Kumulativer Tagesverbrauch in kWh
   - Icon: Transmission Tower SVG
   - Quelle: Energy Dashboard Statistics API

8. **Today's Cost** (💰 Heutige Kosten) ✨ NEU
   - Default: `false`
   - Anzeige: Berechnete Kosten basierend auf Energiepreis (€)
   - Icon: Costs SVG (Arrow Up in Bag)
   - Berechnung: `todayConsumption × energyPrice`

**Code-Struktur**:
```jsx
<div className="ios-item">
  <div className="ios-item-left">
    <div className="ios-item-content">
      <div className="ios-item-label">{t('weatherWidget')}</div>
      <div className="ios-item-subtitle">{t('weatherWidgetDescription')}</div>
    </div>
  </div>
  <div className="ios-item-right">
    <label className="ios-toggle">
      <input
        type="checkbox"
        checked={widgets.weather}
        onChange={(e) => handleWidgetToggle('weather', e.target.checked)}
      />
      <span className="ios-toggle-slider"></span>
    </label>
  </div>
</div>
```

**Event Handling**:
```javascript
const handleWidgetToggle = (widgetKey, enabled) => {
  const newWidgets = { ...widgets, [widgetKey]: enabled };
  setWidgets(newWidgets);
  saveWidgetSettings(newWidgets);

  // Trigger StatsBar reload
  window.dispatchEvent(
    new CustomEvent('statsBarWidgetsChanged', { detail: newWidgets })
  );
};
```

**localStorage Struktur**:
```json
{
  "systemSettings": {
    "statsBar": {
      "widgets": {
        "weather": true,
        "gridConsumption": true,
        "gridReturn": true,
        "solar": false,
        "notifications": true,
        "time": true,
        "todayConsumption": false,
        "todayCost": false
      }
    }
  }
}
```

---

### 3. Data Sources View

**Zweck**: Konfiguration der Energie-Sensoren für StatsBar-Widgets

#### 3.1 Detection Mode Section

**Auto Detection**:
- Prüft zuerst Energy Dashboard Integration
- Fallback: Pattern-based Detection (sucht nach Common Names)
- Automatische Sensor-Validierung via Home Assistant API

**Manual Mode**:
- Benutzer gibt Entity IDs manuell ein
- Keine automatische Erkennung
- Manuelle Konfiguration für alle 4 Sensor-Typen

**Toggle-Implementation**:
```jsx
<label className="ios-toggle">
  <input
    type="checkbox"
    checked={sensorMode === 'auto'}
    onChange={(e) => handleSensorModeChange(e.target.checked ? 'auto' : 'manual')}
  />
  <span className="ios-toggle-slider"></span>
</label>
```

**Detection Button** (nur im Auto-Modus):
```jsx
<motion.div
  className="ios-item ios-item-clickable"
  onClick={() => {
    if (!isLoadingSensors) {
      detectEnergySensors();
    }
  }}
>
  <div className="ios-item-left">
    <div className="ios-item-label">{t('startDetection')}</div>
    <div className="ios-item-subtitle">
      {isLoadingSensors ? t('searchRunning') : t('redetectSensors')}
    </div>
  </div>
  <div className="ios-item-right">
    <motion.svg
      animate={isLoadingSensors ? { rotate: 360 } : { rotate: 0 }}
      transition={isLoadingSensors ? {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      } : {}}
    >
      {/* Refresh Icon */}
    </motion.svg>
  </div>
</motion.div>
```

#### 3.2 Configured Sensors Section

**Status-Indikatoren**:
| Icon | Farbe | Bedeutung |
|------|-------|-----------|
| ✓ | Grün (#34C759) | Sensor konfiguriert & gefunden |
| ⚠️ | Orange (#FF9500) | Sensor konfiguriert, aber nicht gefunden |
| -- | Grau (#8E8E93) | Nicht konfiguriert |

**Validierungs-Logik**:
```javascript
{sensorConfig.gridConsumption && hass && validateSensor(hass, sensorConfig.gridConsumption) ? (
  <span style={{ color: '#34C759', fontSize: '18px' }}>✓</span>
) : sensorConfig.gridConsumption ? (
  <span style={{ color: '#FF9500', fontSize: '18px' }}>⚠️</span>
) : (
  <span style={{ color: '#8E8E93', fontSize: '18px' }}>--</span>
)}
```

**Sensor-Typen**:
1. **Grid Consumption** (⚡ Netzbezug)
   - localStorage Key: `gridConsumption`
   - Beispiel: `sensor.grid_consumption_power`

2. **Grid Return** (🔋 Netzeinspeisung)
   - localStorage Key: `gridReturn`
   - Beispiel: `sensor.grid_return_power`

3. **Solar** (☀️ Solar)
   - localStorage Key: `solar`
   - Beispiel: `sensor.solar_power`

4. **Battery** (🔋 Batterie)
   - localStorage Key: `battery`
   - Beispiel: `sensor.battery_power`

#### 3.3 Energy Price Configuration Section ✨ NEU

**Zweck**: Konfiguration des Energiepreises für Kostenberechnung

**UI-Komponente**:
```jsx
<div className="ios-item" style={{ flexDirection: 'column', alignItems: 'stretch', padding: '16px' }}>
  <div style={{ marginBottom: '12px' }}>
    <div className="ios-item-label" style={{ fontSize: '14px', fontWeight: '600' }}>
      {t('energyPriceLabel')}
    </div>
    <div className="ios-item-subtitle" style={{ fontSize: '13px' }}>
      {t('energyPriceDescription')}
    </div>
  </div>
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <input
      type="number"
      step="0.01"
      min="0"
      value={energyPrice}
      onChange={(e) => handleEnergyPriceChange(e.target.value)}
      style={{
        flex: '1',
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        color: 'white',
        fontSize: '14px'
      }}
    />
    <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>€/kWh</span>
  </div>
</div>
```

**Event Handler**:
```javascript
const handleEnergyPriceChange = (price) => {
  const numericPrice = parseFloat(price);
  if (!isNaN(numericPrice) && numericPrice >= 0) {
    setEnergyPrice(numericPrice);
    saveEnergyPrice(numericPrice);
    // Trigger StatsBar reload
    window.dispatchEvent(new CustomEvent('energyPriceChanged', { detail: numericPrice }));
  }
};
```

**localStorage Struktur**:
```json
{
  "energyPrice": 0.30  // Default: 0.30 €/kWh
}
```

**Verwendung**:
- Wird verwendet zur Berechnung von `todayCost`
- Formel: `todayCost = todayConsumption × energyPrice`
- Änderungen triggern automatisches Neuladen der StatsBar-Daten

#### 3.4 Manual Configuration Section

Nur sichtbar wenn `sensorMode === 'manual'`.

**Input-Felder**:
```jsx
<div style={{ marginBottom: '12px' }}>
  <label style={{
    display: 'block',
    fontSize: '13px',
    marginBottom: '4px',
    color: 'rgba(255,255,255,0.6)'
  }}>
    {t('gridConsumptionEntityLabel')}
  </label>
  <input
    type="text"
    value={sensorConfig.gridConsumption || ''}
    onChange={(e) => handleManualSensorChange('gridConsumption', e.target.value)}
    placeholder="z.B. sensor.grid_consumption_power"
    style={{
      width: '100%',
      padding: '8px 12px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      color: 'white',
      fontSize: '14px'
    }}
  />
</div>
```

**Change Handler**:
```javascript
const handleManualSensorChange = (sensorKey, entityId) => {
  const newConfig = { ...sensorConfig, [sensorKey]: entityId };
  setSensorConfig(newConfig);
  saveEnergySensorConfig(newConfig);
};
```

---

## State Management

### Component State

```javascript
const [currentView, setCurrentView] = useState('main');
const [isHovered, setIsHovered] = useState(false);
const [widgets, setWidgets] = useState(() => loadWidgetSettings());
const [direction, setDirection] = useState(1);
const [sensorMode, setSensorMode] = useState('auto');
const [detectionStatus, setDetectionStatus] = useState(null);
const [sensorConfig, setSensorConfig] = useState(() => loadEnergySensorConfig() || {
  gridConsumption: null,
  gridReturn: null,
  solar: null,
  battery: null
});
const [isLoadingSensors, setIsLoadingSensors] = useState(false);
```

### View States

| State | Beschreibung | Navigation |
|-------|--------------|------------|
| `main` | Hauptansicht mit Navigation | Initial View |
| `widgets` | Widget-Konfiguration | `navigateToWidgets()` |
| `dataSources` | Sensor-Konfiguration | `navigateToDataSources()` |

### Direction State

Steuert die Slide-Animation:
- `direction = 1`: Slide from right (vorwärts)
- `direction = -1`: Slide from left (rückwärts)

```javascript
const navigateToWidgets = () => {
  setDirection(1);  // Forward
  setCurrentView('widgets');
};

const handleBack = () => {
  setDirection(-1);  // Backward
  setCurrentView('main');
};
```

---

## Data Persistence

### localStorage Keys

**Widget Settings**:
```
systemSettings.statsBar.widgets
```

**Sensor Configuration**:
```
energySensorConfig
```

### Load Functions

**Load Widget Settings**:
```javascript
const loadWidgetSettings = () => {
  try {
    const settings = localStorage.getItem('systemSettings');
    if (!settings) return {
      weather: true,
      gridConsumption: true,
      gridReturn: true,
      solar: false,
      notifications: true,
      time: true
    };

    const parsed = JSON.parse(settings);
    const statsBar = parsed.statsBar || {};
    const widgets = statsBar.widgets || {};

    return {
      weather: widgets.weather !== false,
      gridConsumption: widgets.gridConsumption !== false,
      gridReturn: widgets.gridReturn !== false,
      solar: widgets.solar === true,
      notifications: widgets.notifications !== false,
      time: widgets.time !== false
    };
  } catch (error) {
    console.error('Failed to load widget settings:', error);
    return { /* defaults */ };
  }
};
```

**Save Widget Settings**:
```javascript
const saveWidgetSettings = (widgets) => {
  try {
    const current = localStorage.getItem('systemSettings');
    const parsed = current ? JSON.parse(current) : {};

    parsed.statsBar = parsed.statsBar || {};
    parsed.statsBar.widgets = widgets;

    localStorage.setItem('systemSettings', JSON.stringify(parsed));
  } catch (error) {
    console.error('Failed to save widget settings:', error);
  }
};
```

**Load Sensor Config**:
```javascript
// Imported from energyDashboardService
loadEnergySensorConfig()
```

**Save Sensor Config**:
```javascript
// Imported from energyDashboardService
saveEnergySensorConfig(config)
```

---

## API Integration

### energyDashboardService

**Import**:
```javascript
import {
  initializeEnergySensors,
  loadEnergySensorConfig,
  saveEnergySensorConfig,
  validateSensor
} from '../../../../services/energyDashboardService';
```

**Functions**:

1. **initializeEnergySensors(hass)**
   - Sucht nach Energie-Sensoren
   - Priorisierung: Energy Dashboard → Pattern Matching
   - Returns: `{ success, source, sensors }`

2. **loadEnergySensorConfig()**
   - Lädt gespeicherte Sensor-Konfiguration
   - Returns: `{ gridConsumption, gridReturn, solar, battery }`

3. **saveEnergySensorConfig(config)**
   - Speichert Sensor-Konfiguration in localStorage

4. **validateSensor(hass, entityId)**
   - Prüft ob Entity in Home Assistant existiert
   - Returns: `boolean`

**Detection Flow**:
```javascript
const detectEnergySensors = async () => {
  if (!hass) {
    console.warn('No hass connection for energy sensor detection');
    return;
  }

  setIsLoadingSensors(true);
  try {
    const result = await initializeEnergySensors(hass);
    setDetectionStatus(result);

    if (result.success && result.sensors) {
      setSensorConfig(result.sensors);
      saveEnergySensorConfig(result.sensors);
    }
  } catch (error) {
    console.error('Failed to detect energy sensors:', error);
    setDetectionStatus({
      success: false,
      source: 'error',
      sensors: sensorConfig
    });
  } finally {
    setIsLoadingSensors(false);
  }
};
```

---

## Animations

### Slide Variants

```javascript
const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0
  })
};
```

**Usage**:
```jsx
<motion.div
  key={currentView}
  custom={direction}
  variants={slideVariants}
  initial="enter"
  animate="center"
  exit="exit"
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
  className="ios-view-wrapper"
>
  {/* View Content */}
</motion.div>
```

**Animation Properties**:
- **Type**: Spring
- **Stiffness**: 300 (Federhärte)
- **Damping**: 30 (Dämpfung)
- **Direction**: Custom prop für Slide-Richtung

### Loading Spinner

Rotation-Animation für Detection Button:
```jsx
<motion.svg
  animate={isLoadingSensors ? { rotate: 360 } : { rotate: 0 }}
  transition={isLoadingSensors ? {
    duration: 1,
    repeat: Infinity,
    ease: "linear"
  } : {}}
>
  {/* Refresh Icon */}
</motion.svg>
```

---

## Event System

### Custom Events

**statsBarWidgetsChanged**:
```javascript
window.dispatchEvent(
  new CustomEvent('statsBarWidgetsChanged', { detail: newWidgets })
);
```

**Purpose**: Benachrichtigt StatsBar-Component über Widget-Änderungen

**Listener** (in StatsBar-Component):
```javascript
useEffect(() => {
  const handleWidgetsChanged = (event) => {
    setWidgets(event.detail);
  };

  window.addEventListener('statsBarWidgetsChanged', handleWidgetsChanged);
  return () => window.removeEventListener('statsBarWidgetsChanged', handleWidgetsChanged);
}, []);
```

---

**energyPriceChanged** ✨ NEU:
```javascript
window.dispatchEvent(
  new CustomEvent('energyPriceChanged', { detail: numericPrice })
);
```

**Purpose**: Benachrichtigt StatsBar-Component über Energiepreis-Änderungen

**Listener** (in StatsBar-Component):
```javascript
useEffect(() => {
  const handleEnergyPriceChange = async () => {
    if (hass && energySensors.gridConsumption) {
      try {
        const data = await getEnergyDashboardData(hass, energySensors);
        setEnergyData(data);
      } catch (error) {
        console.error('Failed to reload energy data:', error);
      }
    }
  };

  window.addEventListener('energyPriceChanged', handleEnergyPriceChange);
  return () => window.removeEventListener('energyPriceChanged', handleEnergyPriceChange);
}, [hass, energySensors]);
```

**Trigger**: Wird gefeuert wenn:
- Energiepreis in Settings geändert wird
- Automatisches Neuladen der Energy Dashboard Daten
- Neuberechnung von `todayCost`

---

## Energy Dashboard Icons ✨ NEU

### Icon-Komponenten

Alle Energy-Icons wurden direkt aus dem Energy Dashboard (`EnergyChartsView.jsx`) extrahiert und in eine dedizierte Komponente ausgelagert.

**Datei**: `src/components/EnergyIcons.jsx`

### Verfügbare Icons

1. **GridConsumptionIcon** (Transmission Tower)
   - Verwendung: Grid Consumption, Today's Consumption
   - ViewBox: `0 0 463 463`
   - Fill-based SVG
   - Props: `size={14}`, `color="currentColor"`

2. **SolarIcon** (Solar Panel Grid)
   - Verwendung: Solar Production
   - ViewBox: `0 0 512 512`
   - Fill-based SVG
   - Props: `size={14}`, `color="currentColor"`

3. **BatteryIcon** (Battery with +/-)
   - Verwendung: Battery
   - ViewBox: `0 0 24 24`
   - Stroke-based SVG
   - Props: `size={14}`, `color="currentColor"`

4. **GridReturnIcon** (Arrow Down in Bag)
   - Verwendung: Grid Return/Export
   - ViewBox: `0 0 24 24`
   - Stroke-based SVG
   - Props: `size={14}`, `color="currentColor"`

5. **CostsIcon** (Arrow Up in Bag)
   - Verwendung: Today's Cost
   - ViewBox: `0 0 24 24`
   - Stroke-based SVG
   - Props: `size={14}`, `color="currentColor"`

6. **HomeIcon** (House Outline)
   - Verwendung: Self Consumption
   - ViewBox: `0 0 24 24`
   - Stroke-based SVG
   - Props: `size={14}`, `color="currentColor"`

### Verwendung in StatsBar

```jsx
import {
  GridConsumptionIcon,
  SolarIcon,
  BatteryIcon,
  GridReturnIcon,
  CostsIcon
} from './EnergyIcons';

// Beispiel: Grid Consumption Widget
<div style={{...widgetStyles}}>
  <GridConsumptionIcon size={14} color="rgba(255, 255, 255, 0.9)" />
  <span>{gridConsumptionValue}</span>
</div>

// Beispiel: Today's Cost Widget
<div style={{...widgetStyles}}>
  <CostsIcon size={14} color="rgba(255, 255, 255, 0.9)" />
  <span>{energyData.todayCost.toFixed(2)}€</span>
</div>
```

### Icon-Mapping

| Widget | Icon | Typ |
|--------|------|-----|
| Grid Consumption | `GridConsumptionIcon` | Transmission Tower |
| Grid Return | `GridReturnIcon` | Arrow Down in Bag |
| Solar Production | `SolarIcon` | Solar Panel Grid |
| Battery | `BatteryIcon` | Battery +/- |
| Today's Consumption | `GridConsumptionIcon` | Transmission Tower |
| Today's Cost | `CostsIcon` | Arrow Up in Bag |

### Vorteile

✅ **1:1 identisch** mit Energy Dashboard Icons
✅ **Konsistentes Design** über alle Widgets
✅ **Skalierbar** via `size` Prop
✅ **Anpassbare Farbe** via `color` Prop
✅ **Wiederverwendbar** in anderen Komponenten
✅ **Kein Emoji-Rendering** mehr nötig

---

## UI/UX Details

### iOS-Style Design

**Classes**:
- `.ios-view-wrapper`: Container für gesamte View
- `.ios-navbar`: Navigation Bar (Back + Title)
- `.ios-settings-view`: Scrollbarer Content-Bereich
- `.ios-section`: Gruppierung von Items
- `.ios-section-header`: Sektion-Überschrift (z.B. "SETTINGS")
- `.ios-section-footer`: Sektion-Footer (z.B. Erklärungstext)
- `.ios-card`: Container für Items (mit blur/background)
- `.ios-item`: Einzelnes Item in Card
- `.ios-item-clickable`: Klickbares Item (+ Cursor Pointer)
- `.ios-toggle`: iOS-Style Toggle Switch

**Color Palette**:
```css
/* Status Colors */
--success: #34C759;
--warning: #FF9500;
--inactive: #8E8E93;

/* Text Colors */
--text-primary: rgba(255, 255, 255, 0.95);
--text-secondary: rgba(255, 255, 255, 0.6);
--text-tertiary: rgba(255, 255, 255, 0.5);

/* Background Colors */
--bg-item: rgba(255, 255, 255, 0.08);
--bg-hover: rgba(255, 255, 255, 0.95);
```

### Hover Effects

**Item Hover** (definiert in CSS):
```css
.ios-item:hover:not(:active) {
  transform: scale(1.02);
  background: rgba(255, 255, 255, 0.95) !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 10;
}
```

**Text Color Inversion bei Hover**:
```css
.ios-item:hover:not(:active) .ios-item-label,
.ios-item:hover:not(:active) .ios-item-subtitle,
.ios-item:hover:not(:active) .ios-item-value {
  color: #000000 !important;
}
```

### Custom Scrollbar

**Component**: `CustomScrollbar`

**Props**:
```javascript
<CustomScrollbar
  scrollContainerRef={scrollRef}
  isHovered={isHovered}
/>
```

**Behavior**:
- Zeigt Custom Scrollbar nur bei Hover
- Versteckt native Scrollbar via CSS

---

## Lifecycle & Effects

### 1. Debug Effect

```javascript
useEffect(() => {
  console.log('🔍 StatsBarSettingsTab mounted with hass:', hass ? 'AVAILABLE' : 'MISSING');
  if (hass) {
    console.log('✅ hass.states available:', !!hass.states);
    console.log('✅ hass.callWS available:', !!hass.callWS);
  }
}, [hass]);
```

**Purpose**: Debugging der hass-Connection

### 2. Auto-Detection on Mount

```javascript
useEffect(() => {
  if (hass && sensorMode === 'auto' && !detectionStatus) {
    console.log('StatsBarSettings: Starting auto-detection on mount');
    detectEnergySensors();
  }
}, [hass, sensorMode]);
```

**Purpose**: Automatische Sensor-Erkennung beim ersten Mount

### 3. Auto-Detection on View Change

```javascript
useEffect(() => {
  if (currentView === 'dataSources' && hass && sensorMode === 'auto' && !detectionStatus) {
    console.log('StatsBarSettings: Starting auto-detection when data sources view opened');
    detectEnergySensors();
  }
}, [currentView, hass, sensorMode]);
```

**Purpose**: Sensor-Erkennung bei Navigation zu Data Sources View

---

## Translation Keys

### German (de)

**Main View**:
```
back: "Zurück"
statsBar: "StatsBar"
widgets: "Widgets"
widgetsDescription: "Verfügbare Widgets verwalten"
dataSources: "Datenquellen"
dataSourcesDescription: "Energie-Sensoren konfigurieren"
active: "Aktiv"
aboutStatsBar: "ÜBER STATSBAR"
statsBarDescription: "Die StatsBar zeigt wichtige Informationen..."
features: "Features:"
liveUpdates: "Live Updates"
energyDashboardIntegration: "Energy Dashboard Integration"
customizableWidgets: "Anpassbare Widgets"
```

**Widgets View**:
```
availableWidgets: "Verfügbare Widgets"
weatherWidget: "☀️ Wetter"
weatherWidgetDescription: "Temperatur & Icon"
energyGridConsumptionWidget: "⚡ Energie (Netzbezug)"
energyGridConsumptionDescription: "Aktueller Verbrauch"
energyGridReturnWidget: "🔋 Energie (Netzeinspeisung)"
energyGridReturnDescription: "Rückspeisung ins Netz"
solarProductionWidget: "☀️ Solar-Erzeugung"
solarProductionDescription: "Aktuelle Erzeugung"
notificationsWidget: "🔔 Benachrichtigungen"
notificationsWidgetDescription: "Counter anzeigen"
timeWidget: "🕐 Zeit"
timeWidgetDescription: "Live-Update"
widgetsFooter: "Widgets werden rechts in der StatsBar angezeigt"
```

**Data Sources View**:
```
detectionMode: "Erkennungsmodus"
autoDetection: "Automatische Erkennung"
detectionRunning: "Erkennung läuft..."
energyDashboardFound: "Energy Dashboard gefunden"
patternBasedDetection: "Musterbasierte Erkennung"
noSensorsDetected: "Keine Sensoren erkannt"
detectionError: "Erkennungsfehler"
notChecked: "Nicht geprüft"
startDetection: "Erkennung starten"
redetectSensors: "Sensoren neu erkennen"
searchRunning: "Suche läuft..."
autoDetectionInfo: "Sensoren werden aus Energy Dashboard oder per Muster erkannt"
manualConfigInfo: "Manuelle Konfiguration: Geben Sie die Entity IDs selbst ein"
configuredSensors: "Konfigurierte Sensoren"
gridConsumption: "⚡ Netzbezug"
gridReturn: "🔋 Netzeinspeisung"
solar: "☀️ Solar"
battery: "🔋 Batterie"
notConfigured: "Nicht konfiguriert"
sensorStatusLegend: "✓ Konfiguriert | ⚠️ Nicht gefunden | -- Nicht konfiguriert"
manualConfiguration: "Manuelle Konfiguration"
manualConfigDescription: "Wählen Sie die Sensor-Entity-IDs manuell..."
gridConsumptionEntityLabel: "Netzbezug Entity ID"
gridReturnEntityLabel: "Netzeinspeisung Entity ID"
solarEntityLabel: "Solar Entity ID"
batteryEntityLabel: "Batterie Entity ID"
aboutDataSources: "Über Datenquellen"
autoDetectionDescription: "Automatische Erkennung:\n1. Energy Dashboard...\n\nManuelle Konfiguration:\nGeben Sie die Entity IDs..."
```

---

## Best Practices

### 1. Error Handling

Alle localStorage-Operationen sind in try-catch wrapped:
```javascript
try {
  const settings = localStorage.getItem('systemSettings');
  // ...
} catch (error) {
  console.error('Failed to load widget settings:', error);
  return defaultSettings;
}
```

### 2. Defensive Programming

Prüfung auf hass-Verfügbarkeit vor API-Calls:
```javascript
if (!hass) {
  console.warn('No hass connection for energy sensor detection');
  return;
}
```

### 3. State Initialization

Lazy Initialization für Sensor-Config:
```javascript
const [sensorConfig, setSensorConfig] = useState(() =>
  loadEnergySensorConfig() || {
    gridConsumption: null,
    gridReturn: null,
    solar: null,
    battery: null
  }
);
```

### 4. Clean Component Structure

Separation of Concerns:
- **Data Functions**: `loadWidgetSettings`, `saveWidgetSettings` (außerhalb Component)
- **API Functions**: Imported from `energyDashboardService`
- **Event Handlers**: Als Component Methods
- **Render Logic**: Conditional Rendering basierend auf `currentView`

---

## Performance Optimierungen

### 1. Conditional Rendering

Nur die aktive View wird gerendert:
```javascript
{currentView === 'main' ? (
  <MainView />
) : currentView === 'widgets' ? (
  <WidgetsView />
) : currentView === 'dataSources' ? (
  <DataSourcesView />
) : null}
```

### 2. Event Throttling

Detection wird nur einmal getriggert wenn:
- `hass` verfügbar
- `sensorMode === 'auto'`
- `!detectionStatus` (noch nicht erkannt)

### 3. Local State Management

Widgets und SensorConfig werden lokal gehalten:
- Keine unnötigen Re-Renders
- Schnelle UI-Updates
- localStorage-Sync im Background

---

## Testing Considerations

### Manual Testing Checklist

**Main View**:
- [ ] Navigation zu Widgets funktioniert
- [ ] Navigation zu Data Sources funktioniert
- [ ] "Active" Counter zeigt korrekte Anzahl
- [ ] Data Sources Status wird korrekt angezeigt

**Widgets View**:
- [ ] Alle Toggles funktionieren
- [ ] Änderungen werden in localStorage gespeichert
- [ ] Event wird gefeuert bei Toggle
- [ ] Back-Navigation funktioniert

**Data Sources View**:
- [ ] Auto/Manual Toggle funktioniert
- [ ] Detection Button startet Erkennung
- [ ] Loading Spinner dreht sich während Detection
- [ ] Sensor-Status wird korrekt angezeigt (✓ / ⚠️ / --)
- [ ] Manuelle Eingaben werden gespeichert
- [ ] Sensor-Validierung funktioniert

### Edge Cases

1. **Kein hass verfügbar**: Warning-Log, keine Detection
2. **localStorage voll**: Fallback auf Defaults
3. **Sensor nicht gefunden**: Orange Warning-Icon
4. **Detection schlägt fehl**: Error-Status wird gesetzt

---

## Debugging

### Console Logs

**Component Mount**:
```
🔍 StatsBarSettingsTab mounted with hass: AVAILABLE
✅ hass.states available: true
✅ hass.callWS available: true
```

**Auto-Detection**:
```
StatsBarSettings: Starting auto-detection on mount
StatsBarSettings: Starting auto-detection when data sources view opened
```

**Manual Detection**:
```
🔍 Manual detection triggered
```

### DevTools Inspection

**localStorage Keys**:
```javascript
// Widget Settings
localStorage.getItem('systemSettings')

// Sensor Config
localStorage.getItem('energySensorConfig')
```

**Event Listening**:
```javascript
window.addEventListener('statsBarWidgetsChanged', console.log);
```

---

## Future Improvements

### Potential Enhancements

1. **Entity Picker**: Dropdown mit allen verfügbaren Energy-Sensoren
2. **Real-time Preview**: Vorschau der StatsBar mit aktuellen Einstellungen
3. **Import/Export**: Konfiguration als JSON exportieren/importieren
4. **Widget Reordering**: Drag & Drop für Widget-Reihenfolge
5. **Custom Widgets**: Plugin-System für benutzerdefinierte Widgets
6. **Sensor History**: Grafik der letzten Erkennungen
7. **Validation Warnings**: Detaillierte Fehlermeldungen bei Sensor-Problemen

### Code Refactoring

1. Extract Views in separate components
2. Create custom hooks for localStorage management
3. Add TypeScript types
4. Implement unit tests
5. Add E2E tests with Playwright

---

## Related Documentation

- [Energy Dashboard Service](./ENERGY_DASHBOARD_SERVICE.md) - Sensor Detection API
- [StatsBar Component](./STATSBAR_COMPONENT.md) - Main StatsBar Implementation
- [iOS Settings View](./IOS_SETTINGS_VIEW.md) - iOS-Style UI Components
- [Custom Scrollbar](./CUSTOM_SCROLLBAR.md) - Scrollbar Component

---

**Version**: 1.1.0
**Last Updated**: 2026-01-12
**Author**: Fast Search Card Team
