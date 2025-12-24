# Weather System-Entity - Konzept & Implementierung

**Dokument erstellt:** 2025-10-30
**Status:** Konzept-Phase

---

## 📊 Analyse: System-Entity Framework

### Architektur-Überblick

Das System-Entity Framework ermöglicht modulare, universell integrierte Funktionen ohne hardcoded Checks in UI-Komponenten.

#### Core-Komponenten:
```
src/system-entities/
├── base/
│   └── SystemEntity.js           # Basisklasse (309 Zeilen)
├── registry.js                   # Zentrale Verwaltung (529 Zeilen)
├── entities/
│   ├── settings/                 # ✅ Existiert
│   ├── marketplace/              # ✅ Existiert
│   ├── pluginstore/              # ✅ Existiert
│   ├── all-schedules/            # ✅ Existiert
│   └── weather/                  # 🆕 NEU
└── integration/
    ├── DataProviderIntegration.js
    ├── DetailViewIntegration.jsx
    └── DeviceCardIntegration.jsx
```

---

### Bestehende System-Entities im Vergleich

| Entity | Domain | Category | hasTabs | hasCustomView | Zeilen | Actions |
|--------|--------|----------|---------|---------------|--------|---------|
| **Settings** | `settings` | system | ✅ true | ❌ false | 277 | 8 |
| **Marketplace** | `marketplace` | apps | ❌ false | ✅ true | 361 | 7 |
| **AllSchedules** | `all_schedules` | system | ❌ false | ✅ true | 27 | 0 |
| **PluginStore** | `pluginstore` | apps | ❌ false | ✅ true | ? | ? |
| **🆕 Weather** | `weather` | system | ❌ false | ✅ true | ~400 | 6 |

**Analyse:**
- **Settings** ist der einzige mit `hasTabs: true` (nutzt alte Tab-Struktur)
- Alle anderen haben eigene Custom Views
- Marketplace hat die meisten Actions (Integration mit HA Supervisor API)
- **Weather** sollte ähnlich wie Marketplace strukturiert sein (Custom View + Actions)

---

## 🎯 Weather Entity - Konzept

### Vision

Eine moderne, visionOS-inspirierte Wetter-Ansicht mit:
- 🌤️ **Aktuelle Bedingungen** - Temperatur, Luftfeuchtigkeit, Wind, Druck
- 📅 **7-Tage-Forecast** - Detaillierte Vorhersage
- 📍 **Multi-Location** - Mehrere Standorte überwachen
- 🔔 **Weather Alerts** - Wetterwarnungen (falls verfügbar)
- 📊 **Historical Data** - Temperaturverlauf (24h)
- 🌈 **Animierte Wettericons** - Passend zum visionOS-Design

---

### System-Entity Struktur

#### Core Properties

```javascript
{
  id: 'weather',
  domain: 'weather',
  name: 'Wetter',
  icon: 'mdi:weather-partly-cloudy',
  category: 'system',
  description: 'Wetterinformationen und Vorhersage',
  relevance: 90,

  // UI Behavior
  hasTabs: false,          // Eigene Custom View ohne Tabs
  hasCustomView: true,     // WeatherView.jsx
  showInDetailView: true   // In DetailView öffnen
}
```

---

### Actions API

#### 1. `getCurrentWeather`
**Beschreibung:** Aktuelle Wetterdaten für primäre Location abrufen

**Parameter:**
```javascript
{
  entity_id?: string,  // Optional: Spezifische Weather-Entity
  hass: object        // Home Assistant Connection
}
```

**Return:**
```javascript
{
  temperature: number,      // °C
  temperature_unit: string, // "°C" | "°F"
  humidity: number,        // %
  pressure: number,        // hPa
  wind_speed: number,      // km/h
  wind_bearing: number,    // 0-360°
  condition: string,       // "sunny", "cloudy", "rainy", etc.
  attribution: string,     // Datenquelle
  forecast: Array<Forecast>
}
```

---

#### 2. `getForecast`
**Beschreibung:** 7-Tage Wettervorhersage

**Parameter:**
```javascript
{
  entity_id?: string,  // Optional: Spezifische Weather-Entity
  hass: object,
  type: 'daily' | 'hourly'  // Default: 'daily'
}
```

**Return:**
```javascript
[
  {
    datetime: string,       // ISO 8601
    condition: string,
    temperature: number,
    templow: number,        // Nur bei daily
    precipitation: number,  // mm
    precipitation_probability: number, // %
    wind_speed: number,
    wind_bearing: number
  },
  // ... bis zu 7 Tage
]
```

---

#### 3. `getHistoricalData`
**Beschreibung:** Historische Wetterdaten (24h Chart)

**Parameter:**
```javascript
{
  entity_id: string,
  hass: object,
  hours: number  // Default: 24
}
```

**Return:**
```javascript
{
  temperature: Array<{timestamp: number, value: number}>,
  humidity: Array<{timestamp: number, value: number}>,
  pressure: Array<{timestamp: number, value: number}>
}
```

---

#### 4. `getWeatherAlerts`
**Beschreibung:** Wetterwarnungen abrufen (falls verfügbar)

**Parameter:**
```javascript
{
  entity_id: string,
  hass: object
}
```

**Return:**
```javascript
[
  {
    id: string,
    title: string,
    severity: 'warning' | 'watch' | 'advisory',
    description: string,
    start_time: string,
    end_time: string,
    areas: string[]
  }
]
```

---

#### 5. `addLocation`
**Beschreibung:** Zusätzlichen Standort hinzufügen

**Parameter:**
```javascript
{
  entity_id: string,  // Weather-Entity ID
  name: string,       // Custom Name
  is_primary: boolean // Standard-Location?
}
```

**Return:**
```javascript
{
  success: boolean,
  location: {
    id: string,
    name: string,
    entity_id: string,
    is_primary: boolean
  }
}
```

---

#### 6. `removeLocation`
**Beschreibung:** Standort entfernen

**Parameter:**
```javascript
{
  location_id: string
}
```

---

### Attributes

```javascript
attributes: {
  // Weather Entities
  weather_entities: [],         // Alle verfügbaren weather.*
  primary_entity: null,         // Primäre Location
  locations: [],                // Gespeicherte Locations

  // Current State
  last_update: null,            // Timestamp
  current_condition: null,      // Aktuelles Wetter
  current_temperature: null,

  // Forecast
  forecast_type: 'daily',       // 'daily' | 'hourly'
  forecast_days: 7,

  // Settings
  units: 'metric',              // 'metric' | 'imperial'
  show_forecast: true,
  show_alerts: true,
  show_historical: true,

  // Capabilities
  has_forecast: false,
  has_alerts: false,
  has_pressure: false,
  has_humidity: false,
  has_wind: false
}
```

---

### Permissions

```javascript
permissions: [
  'weather:read',      // Wetterdaten lesen
  'history:read',      // Historie abrufen
  'entities:read',     // Entities auflisten
  'storage:write'      // Locations speichern
]
```

---

### Routes (Deep Links)

```javascript
routes: {
  current: '/weather/current',
  forecast: '/weather/forecast',
  locations: '/weather/locations',
  alerts: '/weather/alerts',
  history: '/weather/history'
}
```

---

## 🎨 UI Design - WeatherView.jsx

### Layout-Struktur

```
┌─────────────────────────────────────────┐
│ ← Zurück           Wetter          •••  │
├─────────────────────────────────────────┤
│                                         │
│  📍 Wohnzimmer ▾                        │
│                                         │
│         ☀️                              │
│        22°C                             │
│      Sonnig                             │
│                                         │
│  ╭─────────────────────────────────╮   │
│  │  💧 65%   💨 12 km/h   📊 1013  │   │
│  │  Feuchtigkeit  Wind      Druck   │   │
│  ╰─────────────────────────────────╯   │
│                                         │
│  🔔 1 Wetterwarnung                    │
│  ⚠️ Sturmwarnung bis 18:00            │
│                                         │
├─────────────────────────────────────────┤
│  7-TAGE VORHERSAGE                     │
├─────────────────────────────────────────┤
│  Mo  ☀️  24° / 16°  💧 10%             │
│  Di  🌤️  22° / 15°  💧 20%             │
│  Mi  ⛅  20° / 14°  💧 40%             │
│  Do  🌧️  18° / 13°  💧 80%             │
│  Fr  ⛈️  17° / 12°  💧 90%             │
│  Sa  🌤️  21° / 14°  💧 30%             │
│  So  ☀️  23° / 16°  💧 5%              │
├─────────────────────────────────────────┤
│  TEMPERATURVERLAUF (24H)               │
├─────────────────────────────────────────┤
│  [Chart.js Line Chart]                 │
│  Temp: 22°C, Humidity: 65%             │
└─────────────────────────────────────────┘
```

---

### Komponenten-Hierarchie

```
WeatherView.jsx (~400 Zeilen)
├── WeatherHeader.jsx (~80 Zeilen)
│   ├── BackButton
│   ├── Title
│   └── OptionsMenu
├── LocationSelector.jsx (~120 Zeilen)
│   ├── CurrentLocation (Dropdown)
│   └── AddLocationButton
├── CurrentConditions.jsx (~150 Zeilen)
│   ├── AnimatedWeatherIcon
│   ├── TemperatureDisplay
│   ├── ConditionText
│   └── MetricsBar
│       ├── HumidityMetric
│       ├── WindMetric
│       └── PressureMetric
├── WeatherAlerts.jsx (~80 Zeilen)
│   └── AlertCard[]
├── ForecastSection.jsx (~180 Zeilen)
│   ├── ForecastTypeToggle (Daily/Hourly)
│   └── ForecastList
│       └── ForecastDay[]
└── HistoricalChart.jsx (~120 Zeilen)
    ├── Chart.js Integration
    └── TimeRangePicker
```

---

### Design-Prinzipien

#### 1. Glassmorphism
```css
.weather-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

#### 2. Animierte Weather Icons
```javascript
// Eigene animierte SVG Icons wie in AnimatedDeviceIcons.jsx
const weatherIcons = {
  sunny: <AnimatedSunIcon />,      // Rotierender Sonnenschein
  cloudy: <AnimatedCloudIcon />,   // Bewegende Wolken
  rainy: <AnimatedRainIcon />,     // Fallende Regentropfen
  stormy: <AnimatedStormIcon />,   // Blitze
  snowy: <AnimatedSnowIcon />      // Fallende Schneeflocken
};
```

#### 3. Fluid Animations (Framer Motion)
```javascript
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' }
};

<motion.div {...fadeInUp}>
  <CurrentConditions />
</motion.div>
```

#### 4. Farbschemata basierend auf Wetter
```javascript
const weatherThemes = {
  sunny: { primary: '#FFA500', gradient: 'linear-gradient(135deg, #FFA500, #FFD700)' },
  cloudy: { primary: '#B0C4DE', gradient: 'linear-gradient(135deg, #B0C4DE, #778899)' },
  rainy: { primary: '#4682B4', gradient: 'linear-gradient(135deg, #4682B4, #1E90FF)' },
  stormy: { primary: '#696969', gradient: 'linear-gradient(135deg, #696969, #2F4F4F)' },
  snowy: { primary: '#F0F8FF', gradient: 'linear-gradient(135deg, #F0F8FF, #E6F3FF)' }
};
```

---

## 🔌 Home Assistant Integration

### Weather Domain API

Home Assistant bietet native Weather-Integration:

#### Entity Format
```javascript
{
  entity_id: "weather.home",
  state: "sunny",  // Main condition
  attributes: {
    temperature: 22.5,
    temperature_unit: "°C",
    humidity: 65,
    pressure: 1013,
    pressure_unit: "hPa",
    wind_speed: 12.5,
    wind_speed_unit: "km/h",
    wind_bearing: 180,
    visibility: 10,
    visibility_unit: "km",
    forecast: [
      {
        condition: "sunny",
        datetime: "2025-10-31T00:00:00+00:00",
        temperature: 24,
        templow: 16,
        precipitation: 0,
        precipitation_probability: 10
      }
      // ...
    ],
    attribution: "Data provided by Weather API"
  }
}
```

#### Verfügbare Services

**1. `weather.get_forecasts`**
```javascript
await hass.callService('weather', 'get_forecasts', {
  entity_id: 'weather.home',
  type: 'daily'  // oder 'hourly'
});
```

**2. History API für historische Daten**
```javascript
await hass.callWS({
  type: 'history/history_during_period',
  start_time: '2025-10-29T00:00:00Z',
  end_time: '2025-10-30T00:00:00Z',
  entity_ids: ['weather.home'],
  minimal_response: true
});
```

---

### Unterstützte Weather Integrationen

Home Assistant unterstützt 50+ Weather Integrationen:

**Populäre Anbieter:**
- OpenWeatherMap
- Met.no (Norwegian Meteorological Institute)
- AccuWeather
- Dark Sky (deprecated)
- Weatherbit
- OpenUV
- SMHI (Sweden)
- DWD (Germany - Deutscher Wetterdienst)
- Buienradar (Netherlands)
- ZAMG (Austria)

**Installation:**
```yaml
# configuration.yaml
weather:
  - platform: openweathermap
    api_key: YOUR_API_KEY
    mode: daily  # oder hourly
```

---

## 📝 Implementierungsplan

### Phase 1: Core Entity (2-3 Stunden)

#### 1.1 Entity-Datei erstellen
**Datei:** `src/system-entities/entities/weather/index.js`

**Tasks:**
- [x] Struktur analysieren
- [ ] Entity-Klasse erstellen (ähnlich Marketplace)
- [ ] Core Properties definieren
- [ ] 6 Actions implementieren:
  - `getCurrentWeather`
  - `getForecast`
  - `getHistoricalData`
  - `getWeatherAlerts`
  - `addLocation`
  - `removeLocation`
- [ ] Mock-Daten für Development
- [ ] onMount-Lifecycle mit Auto-Discovery

**Code-Umfang:** ~350-400 Zeilen

---

#### 1.2 Registry-Integration
**Datei:** `src/system-entities/registry.js`

**Tasks:**
- [ ] Import in `autoDiscover()` hinzufügen:
```javascript
() => import('./entities/weather/index.js')
```

**Code-Umfang:** 1 Zeile

---

### Phase 2: UI Components (4-6 Stunden)

#### 2.1 WeatherView Hauptkomponente
**Datei:** `src/system-entities/entities/weather/WeatherView.jsx`

**Tasks:**
- [ ] Layout-Struktur
- [ ] useWeatherData Hook
- [ ] Error Handling & Loading States
- [ ] Integration mit entity.actions

**Code-Umfang:** ~250 Zeilen

---

#### 2.2 Sub-Components

**2.2.1 LocationSelector.jsx** (~120 Zeilen)
- [ ] Dropdown mit verfügbaren Locations
- [ ] Add Location Dialog
- [ ] Primary Location Marker

**2.2.2 CurrentConditions.jsx** (~150 Zeilen)
- [ ] Animierter Wettericon (zentrales Feature!)
- [ ] Große Temperatur-Anzeige
- [ ] Metrics Bar (Humidity, Wind, Pressure)
- [ ] Condition Text

**2.2.3 ForecastSection.jsx** (~180 Zeilen)
- [ ] Toggle Daily/Hourly
- [ ] Forecast-Liste mit Animationen
- [ ] Responsive Layout (Grid/List)

**2.2.4 WeatherAlerts.jsx** (~80 Zeilen)
- [ ] Alert-Cards mit Severity-Levels
- [ ] Dismiss-Funktion
- [ ] Empty State

**2.2.5 HistoricalChart.jsx** (~120 Zeilen)
- [ ] Chart.js Line Chart
- [ ] Multi-Dataset (Temp, Humidity, Pressure)
- [ ] Time Range Picker
- [ ] Responsive

**Gesamt:** ~650 Zeilen UI Code

---

### Phase 3: Animationen & Polish (2-3 Stunden)

#### 3.1 Animierte Weather Icons
**Datei:** `src/system-entities/entities/weather/components/WeatherIcons.jsx`

**Tasks:**
- [ ] AnimatedSunIcon (rotierend, strahlen)
- [ ] AnimatedCloudIcon (bewegend)
- [ ] AnimatedRainIcon (fallende Tropfen)
- [ ] AnimatedStormIcon (Blitze)
- [ ] AnimatedSnowIcon (fallende Flocken)
- [ ] AnimatedWindIcon (Wind-Linien)

**Code-Umfang:** ~200 Zeilen SVG Animationen

---

#### 3.2 Framer Motion Animations
- [ ] Fade-in-up für Sections
- [ ] Stagger für Forecast-Liste
- [ ] Slide für Location Selector
- [ ] Pulse für Live-Updates

---

#### 3.3 CSS Styling
**Datei:** `src/system-entities/entities/weather/styles/WeatherView.css`

**Tasks:**
- [ ] Glassmorphism Cards
- [ ] Weather-basierte Farbschemata
- [ ] Responsive Breakpoints
- [ ] Dark/Light Mode Support

**Code-Umfang:** ~250 Zeilen CSS

---

### Phase 4: Storage & Settings (1-2 Stunden)

#### 4.1 LocalStorage Integration
- [ ] Gespeicherte Locations
- [ ] Primary Location
- [ ] User Preferences (Units, Forecast Type)
- [ ] Last Update Timestamp

#### 4.2 Settings Integration
- [ ] Weather-Section in SettingsTab
- [ ] Units auswählen (°C/°F)
- [ ] Forecast Type (Daily/Hourly)
- [ ] Toggle Features (Alerts, Historical)

---

### Phase 5: Testing & Documentation (2 Stunden)

#### 5.1 Testing
- [ ] Manual Testing mit echten Weather Entities
- [ ] Mock-Daten Testing
- [ ] Error Cases (No Connection, No Entities)
- [ ] Multi-Location Testing

#### 5.2 Dokumentation
- [ ] PLUGIN_DEVELOPMENT.md updaten
- [ ] README.md updaten (neue System-Entity)
- [ ] JSDoc Comments
- [ ] Usage Examples

---

## 📊 Zeitplan & Milestones

### Gesamt-Aufwand: **12-16 Stunden**

| Phase | Dauer | Priorität | Abhängigkeiten |
|-------|-------|-----------|----------------|
| **Phase 1: Core Entity** | 2-3h | 🔴 Hoch | Keine |
| **Phase 2: UI Components** | 4-6h | 🔴 Hoch | Phase 1 |
| **Phase 3: Animations** | 2-3h | 🟡 Mittel | Phase 2 |
| **Phase 4: Storage** | 1-2h | 🟡 Mittel | Phase 1, 2 |
| **Phase 5: Testing** | 2h | 🟢 Normal | Phase 1-4 |

### Milestones

**M1: Core Functionality** (✅ nach Phase 1+2)
- Entity registriert
- Grundlegende UI
- Wetterdaten anzeigen
- Forecast anzeigen

**M2: Full Feature Set** (✅ nach Phase 3+4)
- Animationen
- Multi-Location
- Historische Daten
- Settings

**M3: Production Ready** (✅ nach Phase 5)
- Getestet
- Dokumentiert
- Polished

---

## 🎯 Erwartete Ergebnisse

### User Experience

**Vorher:**
- ❌ Keine Wetter-Integration in Fast Search Card
- ❌ User muss zu Dashboard wechseln
- ❌ Wetterdaten nicht zentral verfügbar

**Nachher:**
- ✅ Wetter direkt in Search Card
- ✅ Moderne, animierte Darstellung
- ✅ Mehrere Standorte überwachen
- ✅ Vorhersage & Historie
- ✅ Wetterwarnungen

---

### Technische Vorteile

1. **Modularer Aufbau** - Eigene System-Entity
2. **Lazy Loading** - View wird nur geladen wenn benötigt
3. **Actions API** - Wiederverwendbar für andere Komponenten
4. **Storage** - User-Präferenzen persistent
5. **HA Integration** - Nutzt native Weather Domain

---

### Code-Statistik (Schätzung)

```
src/system-entities/entities/weather/
├── index.js                      ~400 Zeilen (Entity)
├── WeatherView.jsx               ~250 Zeilen (Main)
├── components/
│   ├── LocationSelector.jsx      ~120 Zeilen
│   ├── CurrentConditions.jsx     ~150 Zeilen
│   ├── ForecastSection.jsx       ~180 Zeilen
│   ├── WeatherAlerts.jsx          ~80 Zeilen
│   ├── HistoricalChart.jsx       ~120 Zeilen
│   └── WeatherIcons.jsx          ~200 Zeilen
├── hooks/
│   └── useWeatherData.js          ~80 Zeilen
├── utils/
│   └── weatherHelpers.js          ~60 Zeilen
└── styles/
    └── WeatherView.css           ~250 Zeilen

Gesamt: ~1,890 Zeilen
```

---

## 🔄 Alternative Konzepte

### Option A: Minimalistisch
**Umfang:** ~800 Zeilen
- Nur aktuelle Bedingungen
- Keine Animationen
- Kein Historical Chart
- Single Location

**Vorteil:** Schnell implementiert (6-8h)
**Nachteil:** Weniger Features

---

### Option B: Full-Featured (Empfohlen)
**Umfang:** ~1,900 Zeilen
- Alle Features wie oben
- Animationen
- Multi-Location
- Charts

**Vorteil:** Vollständige UX
**Nachteil:** Mehr Aufwand (12-16h)

---

### Option C: Plugin statt System-Entity
**Alternative:** Als externes Plugin entwickeln

**Vorteil:**
- Unabhängig vom Core
- User kann installieren/deinstallieren
- Eigenes Release-Cycle

**Nachteil:**
- Komplexere Verteilung
- Plugin-System muss fertig sein

---

## 🚀 Quick Start Guide

### Minimale Implementierung (MVP)

**Ziel:** Weather Entity in 4 Stunden funktional

#### Schritt 1: Entity erstellen (1h)
```javascript
// src/system-entities/entities/weather/index.js
import { SystemEntity } from '../../base/SystemEntity.js';

class WeatherEntity extends SystemEntity {
  constructor() {
    super({
      id: 'weather',
      domain: 'weather',
      name: 'Wetter',
      icon: 'mdi:weather-partly-cloudy',
      category: 'system',
      description: 'Wetterinformationen',
      relevance: 90,
      hasTabs: false,
      hasCustomView: true,
      showInDetailView: true,
      viewComponent: () => import('./WeatherView.jsx'),

      actions: {
        getCurrentWeather: async function(params) {
          const { hass, entity_id } = params;
          const weatherEntity = entity_id || 'weather.home';
          const state = hass.states[weatherEntity];
          return state;
        }
      }
    });
  }
}

export default new WeatherEntity();
```

#### Schritt 2: Basis-View (2h)
```javascript
// src/system-entities/entities/weather/WeatherView.jsx
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';

export default function WeatherView({ entity, hass, onBack }) {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    entity.executeAction('getCurrentWeather', { hass })
      .then(data => setWeather(data));
  }, []);

  if (!weather) return <div>Lade...</div>;

  return (
    <div className="weather-view">
      <button onClick={onBack}>← Zurück</button>
      <h1>{weather.attributes.temperature}°C</h1>
      <p>{weather.state}</p>
    </div>
  );
}
```

#### Schritt 3: Registry (5 Min)
```javascript
// src/system-entities/registry.js
const knownEntities = [
  // ... andere Entities
  () => import('./entities/weather/index.js'),  // ← HIER
];
```

#### Schritt 4: Testen (1h)
- npm run build
- In HA testen
- Refinements

**→ Nach 4h: Funktionale Weather Entity!**

---

## 📚 Referenzen & Resources

### Home Assistant Docs
- [Weather Integration](https://www.home-assistant.io/integrations/weather/)
- [Weather Entity](https://developers.home-assistant.io/docs/core/entity/weather/)
- [Weather Services](https://www.home-assistant.io/integrations/weather/#services)

### Design Inspiration
- Apple Weather App (iOS/visionOS)
- Google Weather
- Weather.com
- Carrot Weather

### Code-Beispiele im Projekt
- `src/system-entities/entities/marketplace/MarketplaceView.jsx` - Custom View
- `src/components/tabs/HistoryTab.jsx` - Chart.js Integration
- `src/components/AnimatedDeviceIcons.jsx` - Animierte Icons
- `src/components/charts/ChartComponents.jsx` - Chart Helpers

---

## 🤔 Offene Fragen

1. **Weather Icons:** Eigene SVGs oder MDI Icons verwenden?
   - **Empfehlung:** Eigene animierte SVGs (wie AnimatedDeviceIcons.jsx)

2. **Forecast API:** `weather.get_forecasts` Service oder Attribute nutzen?
   - **Empfehlung:** Service verwenden (aktuellere Daten)

3. **Multi-Location Storage:** LocalStorage oder IndexedDB?
   - **Empfehlung:** LocalStorage (einfacher, ausreichend)

4. **Historical Data:** Chart.js oder eigene Visualisierung?
   - **Empfehlung:** Chart.js (bereits im Projekt, HistoryTab nutzt es)

5. **Weather Alerts:** Wie mit verschiedenen Ländern umgehen?
   - **Empfehlung:** Falls `attributes.alerts` existiert, anzeigen. Sonst verstecken.

6. **Responsive Design:** Separate Mobile-View?
   - **Empfehlung:** Adaptive Komponenten mit CSS Media Queries

---

## ✅ Entscheidungen & Empfehlungen

### Architektur-Entscheidungen

| Aspekt | Entscheidung | Begründung |
|--------|-------------|------------|
| **Entity Typ** | System-Entity | Teil des Cores, universell integriert |
| **UI Behavior** | `hasTabs: false` | Eigene Custom View |
| **View Structure** | Komponenten-basiert | Wartbar, wiederverwendbar |
| **Animations** | Framer Motion | Bereits im Projekt |
| **Charts** | Chart.js | Bereits im Projekt (HistoryTab) |
| **Icons** | Custom SVG | Konsistent mit AnimatedDeviceIcons |
| **Storage** | LocalStorage | Einfach, ausreichend |
| **HA Integration** | Native Weather Domain | Standard, unterstützt viele Anbieter |

---

### Implementierungs-Empfehlung

**Start mit MVP (Option A)**, dann iterativ erweitern:

1. **Woche 1: MVP** (4-6h)
   - Core Entity
   - Basis-View
   - Aktuelle Bedingungen
   - Forecast-Liste

2. **Woche 2: Features** (4-6h)
   - Animierte Icons
   - Historical Chart
   - Multi-Location
   - Weather Alerts

3. **Woche 3: Polish** (2-4h)
   - Animationen verfeinern
   - CSS optimieren
   - Testing
   - Dokumentation

**Gesamt: 10-16h über 3 Wochen**

---

## 🎉 Zusammenfassung

### Was wir bauen

Eine **moderne, visionOS-inspirierte Weather System-Entity** für Fast Search Card, die:

✅ Native HA Weather Entities nutzt
✅ Aktuelle Bedingungen + 7-Tage Forecast zeigt
✅ Mehrere Standorte unterstützt
✅ Historische Daten visualisiert
✅ Wetterwarnungen anzeigt
✅ Animierte Wettericons hat
✅ Vollständig ins System-Entity Framework integriert ist

### Warum es sinnvoll ist

- **User Value:** Wetter direkt in Search Card verfügbar
- **Technical Value:** Zeigt System-Entity Framework Potenzial
- **Design Value:** Moderne, animierte UI passt zu visionOS Theme
- **Integration Value:** Nutzt natives HA Weather System

### Nächste Schritte

1. **Entscheidung:** MVP oder Full-Featured?
2. **Setup:** Ordner-Struktur erstellen
3. **Implementierung:** Phase 1 starten
4. **Testing:** Mit echten Weather Entities testen
5. **Launch:** In Main-Branch mergen

---

**Bereit zum Implementieren?** 🚀

Lass mich wissen welchen Ansatz du bevorzugst:
- **MVP** (Option A) - 6-8h
- **Full-Featured** (Option B) - 12-16h
- **Custom** - Eigene Feature-Auswahl

---

**Dokument-Version:** 1.0
**Autor:** Claude Code Analysis
**Letzte Aktualisierung:** 2025-10-30
