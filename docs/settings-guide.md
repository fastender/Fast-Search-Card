# Settings System - Vollständige Dokumentation

## 📋 Übersicht

Das Settings System ist eine **System Entity** die alle Einstellungen der Fast Search Card verwaltet. Es verwendet ein iOS-inspiriertes Design mit 5 Tab-Kategorien und persistiert Daten in `localStorage`.

### Hauptkomponenten:

```
settings/
├── index.js                  # SettingsEntity (Model + Actions)
├── SettingsView.jsx          # View-Wrapper
└── SettingsTab/
    ├── SettingsTab.jsx       # Haupt-Tab-Container
    ├── constants.jsx         # Tab-Icons, Sprachen, Konstanten
    ├── SettingsTab.css       # Styling
    └── components/
        ├── GeneralSettingsTab.jsx       # Tab 1: Allgemein
        ├── AppearanceSettingsTab.jsx    # Tab 2: Aussehen
        ├── StatsBarSettingsTab.jsx      # Tab 3: StatsBar
        ├── PrivacySettingsTab.jsx       # Tab 4: Datenschutz
        └── AboutSettingsTab.jsx         # Tab 5: Über
```

---

## 🏗️ Architektur

### 1. **SettingsEntity** (`settings/index.js`)

Die Settings-Entity erweitert `SystemEntity` und fungiert als **zentrales Model** für alle Einstellungen.

#### **Kern-Konfiguration:**

```javascript
{
  id: 'settings',
  domain: 'settings',
  name: 'Einstellungen',
  icon: 'mdi:cog',
  brandColor: 'rgb(0, 145, 255)',  // visionOS Blue
  category: 'system',
  relevance: 100,

  // Sections
  attributes: {
    sections: ['general', 'appearance', 'privacy', 'about'],
    version: '1.2.0',
    buildDate: '2025.10.22'
  },

  // Permissions
  permissions: [
    'settings:read',
    'settings:write',
    'storage:manage',
    'plugins:manage'
  ]
}
```

#### **Deep-Link Routes:**

```javascript
routes: {
  general: '/settings/general',
  appearance: '/settings/appearance',
  privacy: '/settings/privacy',
  about: '/settings/about',
  excludedPatterns: '/settings/privacy/excluded-patterns'
}
```

---

### 2. **Actions API**

Die Entity bietet 7 Actions für Settings-Management:

| Action | Beschreibung | Parameter |
|--------|--------------|-----------|
| `getSetting` | Einzelne Einstellung abrufen | `{ key: string }` |
| `setSetting` | Einstellung speichern | `{ key: string, value: any }` |
| `getAllSettings` | Alle Einstellungen laden | - |
| `resetSettings` | Settings zurücksetzen | `{ section: 'all' \| string }` |
| `addExcludedPattern` | Pattern hinzufügen | `{ pattern: string }` |
| `removeExcludedPattern` | Pattern entfernen | `{ pattern: string }` |

#### **Beispiel-Nutzung:**

```javascript
// Setting abrufen
const lang = await settingsEntity.actions.getSetting({ key: 'userLanguage' });

// Setting setzen (mit Event)
await settingsEntity.actions.setSetting({
  key: 'darkMode',
  value: 'dark'
});
// → Triggert 'settingChanged' Event

// Alle Settings abrufen
const allSettings = await settingsEntity.actions.getAllSettings();
console.log(allSettings);
// {
//   darkMode: 'auto',
//   language: 'de',
//   aiModeEnabled: true,
//   animations: true,
//   excludedPatterns: ['.*_battery_level$', ...],
//   version: '1.2.0'
// }

// Settings zurücksetzen
await settingsEntity.actions.resetSettings({ section: 'all' });
// → Triggert 'settingsReset' Event
```

---

### 3. **Lifecycle Hooks**

#### **onMount() - Initialisierung**

```javascript
async onMount(context) {
  // 1. Check für erste Nutzung
  const isFirstUse = !localStorage.getItem('fastSearchCardInitialized');
  if (isFirstUse) {
    await this._initializeDefaults();
  }

  // 2. Version-Check & Migration
  await this._checkVersionAndMigrate();
}
```

#### **_initializeDefaults() - Standard-Werte**

Wird beim ersten Start automatisch aufgerufen:

```javascript
const defaults = {
  darkMode: 'auto',
  userLanguage: navigator.language.split('-')[0] || 'de',
  aiModeEnabled: 'true',
  notificationsEnabled: 'true',
  soundEffects: 'true',
  animations: 'true',
  excludedPatterns: JSON.stringify([
    '.*_battery_level$',
    '.*_rssi$',
    '.*_linkquality$'
  ])
};

// Speichert Defaults + Flag
localStorage.setItem('fastSearchCardInitialized', 'true');
localStorage.setItem('fastSearchCardVersion', '1.2.0');
```

#### **_checkVersionAndMigrate() - Versionsmanagement**

```javascript
const storedVersion = localStorage.getItem('fastSearchCardVersion');
const currentVersion = '1.2.0';

if (storedVersion !== currentVersion) {
  console.log(`🔄 Migration: ${storedVersion} → ${currentVersion}`);

  // Migrations-Schritte können hier eingefügt werden
  // z.B.: Umbenennung von Keys, Struktur-Änderungen

  localStorage.setItem('fastSearchCardVersion', currentVersion);
}
```

---

## 🎨 UI-Komponenten

### **Tab-Struktur (5 Tabs)**

```javascript
TAB_ICONS = [
  <svg>...</svg>,  // 0: General (Folder mit Zahnrad)
  <svg>...</svg>,  // 1: Appearance (Fenster mit Stern)
  <svg>...</svg>,  // 2: StatsBar (Status-Bar Icon)
  <svg>...</svg>,  // 3: Privacy (Folder mit Schloss)
  <svg>...</svg>   // 4: About (User Profile)
];
```

---

### **Tab 1: General Settings**

**Komponente:** `GeneralSettingsTab.jsx`

**Einstellungen:**

| Setting | Key | Typ | Default | Beschreibung |
|---------|-----|-----|---------|--------------|
| **AI-Modus** | `aiModeEnabled` | boolean | `true` | KI-Assistent aktivieren |
| **Animationen** | `animations` | boolean | `true` | UI-Animationen |
| **Soundeffekte** | `soundEffects` | boolean | `true` | Akustisches Feedback |
| **Sprache** | `userLanguage` | string | `'de'` | UI-Sprache (10 Sprachen) |
| **Benachrichtigungen** | `notificationsEnabled` | boolean | `true` | Push-Notifications |

**Unterstützte Sprachen:**

```javascript
LANGUAGE_CODES = ['de', 'en', 'fr', 'es', 'it', 'nl', 'pt', 'ru', 'zh', 'tr'];

LANGUAGE_FLAGS = {
  de: '🇩🇪 Deutsch',
  en: '🇬🇧 English',
  fr: '🇫🇷 Français',
  es: '🇪🇸 Español',
  it: '🇮🇹 Italiano',
  nl: '🇳🇱 Nederlands',
  pt: '🇵🇹 Português',
  ru: '🇷🇺 Русский',
  zh: '🇨🇳 中文',
  tr: '🇹🇷 Türkçe'
};
```

**Event-System:**

```javascript
// Sprache ändern
setLanguage('en');
localStorage.setItem('userLanguage', 'en');

// Event triggern
window.dispatchEvent(new CustomEvent('languageChanged', {
  detail: { language: 'en' }
}));
```

---

### **Tab 2: Appearance Settings**

**Komponente:** `AppearanceSettingsTab.jsx`

**Einstellungen:**

| Setting | Key | Typ | Optionen | Beschreibung |
|---------|-----|-----|----------|--------------|
| **Background Mode** | `darkMode` | string | `'auto'`, `'light'`, `'dark'` | Wallpaper-Manipulation |
| **Grid Columns** | `gridColumns` | number | `4`, `5` | Spalten im Grid View |
| **Card Shape** | `squircleStyle` | string | `'none'`, `'prominent'`, `'balanced'`, `'subtle'` | Squircle-Stil |
| **Background** | Multiple | object | - | Filter für Fast Search Card |
| **Detail View Videos** | `detailViewVideosEnabled` | boolean | - | Video-Hintergründe |

---

#### **Background Mode - Wallpaper Manipulation**

**NEU (v1.1.0767):** Background Mode beeinflusst jetzt tatsächlich den Home Assistant Wallpaper!

**Die 3 Modi:**

1. **🌙 Dark Mode:**
   - Schwarzes Overlay mit 40% Opacity
   - 8px Blur-Effekt
   - Verdunkelt Wallpaper für besseren Fokus auf Cards

2. **☀️ Light Mode:**
   - Weißes Overlay mit 20% Opacity
   - 8px Blur-Effekt
   - Hellt Wallpaper auf

3. **🔄 Automatic:**
   - **20:00 - 06:00 Uhr:** Dark Mode (schwarzes Overlay + Blur)
   - **06:00 - 20:00 Uhr:** Kein Effekt (normaler Wallpaper)

**Implementierung - WallpaperModeOverlay:**

```javascript
// Komponente: src/components/WallpaperModeOverlay.jsx
<div
  style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: overlayColor,      // 'black' oder 'white'
    opacity: overlayOpacity,        // 0.4 (dark) oder 0.2 (light)
    backdropFilter: 'blur(8px)',   // Subtiler Unschärfe-Effekt
    pointerEvents: 'none',          // Keine Interaktions-Blockierung
    zIndex: 0,                      // Hinter Card, über Wallpaper
    transition: 'opacity 0.5s ease, background 0.5s ease'
  }}
/>
```

**Event-System:**

```javascript
applyDarkMode('dark');
localStorage.setItem('darkMode', 'dark');

// Triggert Event für WallpaperModeOverlay
window.dispatchEvent(new CustomEvent('darkModeChanged', {
  detail: { mode: 'dark' }
}));
```

**Wichtiger Unterschied:**

- **Background Mode** → Manipuliert **WALLPAPER** (Overlay + Blur über Home Assistant Hintergrund)
- **Background Settings** (Brightness/Blur/Contrast/etc.) → Manipuliert **FAST SEARCH CARD** (Glassmorphism-Filter auf `.glass-panel`)

---

#### **Background Settings - Card Filter**

**Filter für die Fast Search Card selbst:**

| Filter | Key | Bereich | Standard | Beschreibung |
|--------|-----|---------|----------|--------------|
| **Brightness** | `backgroundBrightness` | 0-100% | 100% | Helligkeit der Card |
| **Blur** | `backgroundBlur` | 0-50px | 0px | Zusätzlicher Blur |
| **Contrast** | `backgroundContrast` | 0-200% | 100% | Kontrast |
| **Saturation** | `backgroundSaturation` | 0-200% | 100% | Sättigung |
| **Grayscale** | `backgroundGrayscale` | 0-100% | 0% | Schwarz-Weiß |

**Anwendung auf `.glass-panel::before`:**

```css
.glass-panel::before {
  backdrop-filter:
    blur(calc(20px + var(--background-blur, 0px)))
    saturate(calc(180% * var(--background-saturation, 100%) / 100%))
    brightness(var(--background-brightness, 100%))
    contrast(var(--background-contrast, 100%))
    grayscale(var(--background-grayscale, 0%));
}
```

**localStorage Schema:**

```javascript
{
  "appearance": {
    "statsBarEnabled": true,
    "greetingsBarEnabled": true,
    "statsBarUsername": "User",
    "gridColumns": 4,
    "squircleStyle": "none",
    "backgroundBrightness": 100,
    "backgroundBlur": 0,
    "backgroundContrast": 100,
    "backgroundSaturation": 100,
    "backgroundGrayscale": 0,
    "detailViewVideosEnabled": false,
    "detailViewVideosMobileEnabled": false,
    "detailViewVideosPath": "/local/fast-search-videos"
  }
}
```

---

### **Tab 3: StatsBar Settings**

**Komponente:** `StatsBarSettingsTab.jsx`

**Widget-Konfiguration:**

| Widget | Key | Icon | Standard | Beschreibung |
|--------|-----|------|----------|--------------|
| **Wetter** | `weather` | 🌤️ | AN | Temperatur + Icon |
| **Netzbezug** | `gridConsumption` | ⚡ SVG | AN | Grid Import (kW) - Energy Dashboard berechnet |
| **Einspeisung** | `gridReturn` | 🔋 SVG | AN | Grid Export (kW) |
| **Solar** | `solar` | ☀️ SVG | **AUS** | Solar Production - Energy Dashboard berechnet |
| **Batterie** | `battery` | 🔋 SVG | **AUS** | Battery Power |
| **Benachrichtigungen** | `notifications` | 🔔 | AN | Notification Count |
| **Uhrzeit** | `time` | 🕐 | AN | HH:MM |
| **Bisheriger Verbrauch** | `todayConsumption` | 📊 SVG | **AUS** | Tagesverbrauch (kWh) - Energy Stats API |
| **Heutige Kosten** | `todayCost` | 💰 SVG | **AUS** | Kosten (€) - Basiert auf Energiepreis |

**localStorage Schema:**

```javascript
{
  "systemSettings": {
    "statsBar": {
      "widgets": {
        "weather": true,
        "gridConsumption": true,
        "gridReturn": true,
        "solar": false,
        "battery": false,
        "notifications": true,
        "time": true,
        "todayConsumption": false,  // ✨ NEU
        "todayCost": false          // ✨ NEU
      }
    }
  },
  "energyPrice": 0.30  // ✨ NEU: Energiepreis in €/kWh
}
```

**Energie-Sensoren:**

```javascript
{
  "energySensorConfig": {
    "gridConsumption": "sensor.grid_consumption",
    "gridReturn": "sensor.grid_return",
    "solar": "sensor.solar_production",
    "battery": "sensor.battery_power"
  }
}
```

**Events:**

```javascript
// Widget-Settings geändert
window.addEventListener('statsBarWidgetsChanged', handleWidgetChange);

// Energie-Sensoren geändert
window.addEventListener('energySensorConfigChanged', handleSensorChange);

// Energiepreis geändert ✨ NEU
window.addEventListener('energyPriceChanged', handlePriceChange);
```

**Energy Dashboard Integration:**

Die StatsBar verwendet jetzt berechnete Werte aus dem Energy Dashboard:
- **Grid Consumption**: `getEnergyDashboardData()` → `currentGridConsumption` (W)
- **Solar Production**: `getEnergyDashboardData()` → `currentSolarProduction` (W)
- **Today's Consumption**: `getTodayEnergyStatistics()` → `todayGridConsumption` (kWh)
- **Today's Cost**: Berechnet als `todayConsumption × energyPrice` (€)

**Icons**: Alle Energy-Widgets verwenden SVG-Icons aus `EnergyIcons.jsx` (extrahiert aus Energy Dashboard)

---

### **Tab 4: Privacy Settings**

**Komponente:** `PrivacySettingsTab.jsx`

#### **Excluded Patterns**

Regex-Patterns zum Filtern von Entities aus der Suche.

**localStorage Key:** `excludedPatterns`

**Format:**
```javascript
[
  ".*_battery_level$",      // Alle Battery-Level Sensoren
  ".*_rssi$",               // RSSI Signalstärke
  ".*_linkquality$",        // Zigbee Link Quality
  "sensor.test_.*",         // Alle Test-Sensoren
  ".*_unavailable$"         // Unavailable States
]
```

**Pattern-Validierung:**

```javascript
validatePattern(pattern) {
  // Leer-Check
  if (!pattern || pattern.trim() === '') {
    return 'Pattern darf nicht leer sein';
  }

  // Zeichen-Check
  if (!/^[a-z0-9_.*?]+$/i.test(pattern)) {
    return 'Pattern darf nur Buchstaben, Zahlen, _, *, ? enthalten';
  }

  return null;  // Valid
}
```

**CRUD-Operationen:**

```javascript
// Pattern hinzufügen
const addPattern = (pattern) => {
  const patterns = JSON.parse(localStorage.getItem('excludedPatterns') || '[]');
  patterns.push(pattern);
  localStorage.setItem('excludedPatterns', JSON.stringify(patterns));

  // Event
  window.dispatchEvent(new CustomEvent('excludedPatternsChanged', {
    detail: { patterns }
  }));
};

// Pattern entfernen
const removePattern = (pattern) => {
  const patterns = JSON.parse(localStorage.getItem('excludedPatterns') || '[]');
  const updated = patterns.filter(p => p !== pattern);
  localStorage.setItem('excludedPatterns', JSON.stringify(updated));

  // Event
  window.dispatchEvent(new CustomEvent('excludedPatternsChanged', {
    detail: { patterns: updated }
  }));
};
```

#### **Predictive Suggestions**

KI-basierte Vorschläge basierend auf Nutzungsverhalten.

| Setting | Key | Typ | Default | Beschreibung |
|---------|-----|-----|---------|--------------|
| **Aktiviert** | `predictiveSuggestions` | boolean | `true` | Vorschläge aktivieren |
| **Confidence** | `confidenceThreshold` | number (0-100) | `60` | Mindest-Konfidenz |
| **Zeitfenster** | `suggestionTimeWindow` | number (min) | `45` | Zeitfenster für Analyse |
| **Max Vorschläge** | `maxSuggestions` | number | `10` | Anzahl Vorschläge |
| **Lernrate** | `learningRate` | string | `'normal'` | `'slow'`, `'normal'`, `'fast'` |

---

### **Tab 5: About Settings**

**Komponente:** `AboutSettingsTab.jsx`

**System-Informationen:**

- **Version**: `1.2.0`
- **Build-Datum**: `2025.10.22`
- **Entity Limit**: Konfigurierbares Limit für Entities (Performance)

**Entity Limit:**

```javascript
{
  "maxEntitiesLimit": 0  // 0 = Unlimited
}
```

**Nützlich für:**
- Performance-Optimierung bei vielen Entities (>1000)
- Reduktion von Rendering-Last
- Schnellere Suchgeschwindigkeit

---

## 📦 localStorage-Struktur

### **Alle Keys im Überblick:**

```javascript
// === Basis-Settings ===
'darkMode'                    // 'auto' | 'light' | 'dark'
'userLanguage'                // 'de' | 'en' | 'fr' | ...
'aiModeEnabled'               // 'true' | 'false'
'notificationsEnabled'        // 'true' | 'false'
'soundEffects'                // 'true' | 'false'
'animations'                  // 'true' | 'false'

// === Appearance ===
'systemSettings'              // JSON Object mit appearance/statsBar Config

// === Privacy ===
'excludedPatterns'            // JSON Array mit Regex-Patterns
'predictiveSuggestions'       // 'true' | 'false'
'confidenceThreshold'         // '60'
'suggestionTimeWindow'        // '45'
'maxSuggestions'             // '10'
'learningRate'               // 'slow' | 'normal' | 'fast'

// === Performance ===
'maxEntitiesLimit'           // '0' (unlimited)

// === Energie ===
'energySensorConfig'         // JSON Object mit Sensor-Entity-IDs

// === System ===
'fastSearchCardInitialized'  // 'true'
'fastSearchCardVersion'      // '1.2.0'
```

### **systemSettings Schema (vollständig):**

```json
{
  "appearance": {
    "statsBarEnabled": true,
    "greetingsBarEnabled": true,
    "statsBarUsername": "User"
  },
  "statsBar": {
    "widgets": {
      "weather": true,
      "gridConsumption": true,
      "gridReturn": true,
      "solar": false,
      "battery": false,
      "notifications": true,
      "time": true
    }
  }
}
```

---

## 🔔 Event-System

Alle Settings-Änderungen triggern Custom Events:

| Event | Wann | Detail |
|-------|------|--------|
| `settingChanged` | Bei `setSetting()` | `{ key, value }` |
| `settingsReset` | Bei `resetSettings()` | `{ section }` |
| `languageChanged` | Sprache geändert | `{ language }` |
| `darkModeChanged` | Dark Mode geändert | `{ mode }` |
| `excludedPatternsChanged` | Patterns geändert | `{ patterns }` |
| `statsBarWidgetsChanged` | Widget-Config geändert | `{ widgets }` |
| `energySensorConfigChanged` | Energie-Sensoren geändert | - |

**Event-Listener Beispiel:**

```javascript
// Auf Sprache-Änderung reagieren
window.addEventListener('languageChanged', (event) => {
  const newLang = event.detail.language;
  console.log(`Sprache geändert: ${newLang}`);
  // UI neu rendern
});

// Auf Settings-Reset reagieren
window.addEventListener('settingsReset', (event) => {
  console.log(`Settings reset: ${event.detail.section}`);
  location.reload();  // App neu laden
});
```

---

## 🎭 UI-Design-System

### **iOS-Inspiriertes Design**

Alle Settings-Tabs nutzen ein einheitliches iOS-Design:

**CSS-Klassen:**

```css
.ios-settings-container     /* Haupt-Container */
.ios-settings-view         /* Scrollable Content Area */
.ios-section               /* Abschnitt (mit Header) */
.ios-section-header        /* Abschnitts-Überschrift */
.ios-section-footer        /* Abschnitts-Fußnote */
.ios-card                  /* Card Container */
.ios-item                  /* Einzelnes Setting-Item */
.ios-item-left             /* Linker Bereich (Label) */
.ios-item-right            /* Rechter Bereich (Control) */
.ios-item-label            /* Haupt-Label */
.ios-item-subtitle         /* Sub-Label */
.ios-toggle                /* Toggle Switch */
.ios-select                /* Dropdown */
.ios-input                 /* Text Input */
```

**Hover-Effekt:**

```css
.ios-item:hover:not(:active) {
  transform: scale(1.02);
  background: rgba(255, 255, 255, 0.95) !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 10;

  /* Text wird schwarz bei Hover */
  .ios-item-label,
  .ios-item-value {
    color: #000 !important;
  }
}
```

---

## 🔄 Accordion-System

**Framer Motion Variants:**

```javascript
const accordionVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.3, ease: [0.4, 0.0, 0.2, 1] },
      opacity: { duration: 0.2, ease: 'easeOut' }
    }
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.4, ease: [0.4, 0.0, 0.2, 1] },
      opacity: { duration: 0.3, delay: 0.1, ease: 'easeIn' }
    }
  }
};
```

**AccordionItem Komponente:**

```jsx
<AccordionItem
  title="Energy Sensors"
  isOpen={isOpen}
  onToggle={() => setIsOpen(!isOpen)}
>
  <div>Content hier...</div>
</AccordionItem>
```

---

## 🚀 Verwendung

### **Settings öffnen (via Entity):**

```javascript
import settingsEntity from './system-entities/entities/settings';

// Öffnen in DetailView
onNavigate(settingsEntity);
```

### **Settings-Referenz zugreifen:**

```javascript
// In DetailView:
const settingsRef = useRef(null);

<SettingsTab
  settingsRef={settingsRef}
  lang={lang}
  hass={hass}
/>

// Tab wechseln
settingsRef.current.setActiveTab(2);  // → StatsBar Tab

// Aktuellen Tab abrufen
const currentTab = settingsRef.current.getActiveTab();
```

### **Programmatisch Settings ändern:**

```javascript
// Via Entity Actions
await settingsEntity.actions.setSetting({
  key: 'darkMode',
  value: 'dark'
});

// Direkter localStorage-Zugriff
localStorage.setItem('animations', 'false');
window.dispatchEvent(new CustomEvent('settingChanged', {
  detail: { key: 'animations', value: 'false' }
}));
```

---

## 📊 Daten-Flow

```
User Interaktion (Toggle/Dropdown/Input)
       ↓
State Update (useState)
       ↓
localStorage.setItem(key, value)
       ↓
window.dispatchEvent(CustomEvent)
       ↓
Event-Listener in anderen Komponenten
       ↓
UI Re-Render / Aktion ausführen
```

**Beispiel: Dark Mode ändern**

```
User klickt "Dark Mode"
       ↓
setDarkMode('dark')
       ↓
localStorage.setItem('darkMode', 'dark')
       ↓
window.dispatchEvent('darkModeChanged', { mode: 'dark' })
       ↓
App hört Event → wendet Dark Mode an
```

---

## 🛠️ Best Practices

### **1. Settings synchron halten**

```javascript
// Immer State + localStorage + Event zusammen
const updateSetting = (key, value) => {
  setState(value);                                    // 1. State
  localStorage.setItem(key, value);                   // 2. Persist
  window.dispatchEvent(new CustomEvent('settingChanged', {  // 3. Notify
    detail: { key, value }
  }));
};
```

### **2. Validierung vor Speichern**

```javascript
// Immer Input validieren
const addPattern = (pattern) => {
  const error = validatePattern(pattern);
  if (error) {
    setPatternError(error);
    return;  // ❌ Nicht speichern
  }

  // ✅ Valid - speichern
  savePattern(pattern);
};
```

### **3. JSON-Parsing mit Fallback**

```javascript
// Immer try-catch bei JSON.parse
const loadSettings = () => {
  try {
    const stored = localStorage.getItem('systemSettings');
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Failed to parse settings:', error);
    return DEFAULT_SETTINGS;
  }
};
```

---

## 📝 Changelog

### Version 1.1.0980 (2026-01-12) - UI Polish Update

#### 🎨 Widget Settings - SVG Icons
- **Vorher**: Emojis in Widget-Labels (☀️, 🔔, 🕐)
- **Jetzt**: Saubere Text-Labels ohne Emojis
- **Betroffene Widgets**: Wetter, Benachrichtigungen, Uhrzeit
- **Grund**: Konsistentes Design mit SVG-Icons in der UI

#### ⚡ Energy Dashboard Icons
- **Änderung**: Grid Export verwendet jetzt dasselbe Icon wie Grid Import
- **Icon**: GridConsumptionIcon (Transmission Tower) für beide
- **Vorteil**: Bessere visuelle Konsistenz zwischen Import/Export

#### 🎯 Input Text Farben
- **Problem behoben**: Input-Felder hatten dunkle, schwer lesbare Textfarbe
- **Lösung**: Alle Inputs auf `color: #ffffff` (weiß) umgestellt
- **Betroffen**:
  - Privacy Tab: Maximale Anzahl Entities Input
  - Privacy Tab: Excluded Patterns Input
  - Alle `.ios-input` und `.ios-number-input` Elemente

#### ✨ tvOS-Style Hover Effekte

**1. SVG Icons → Schwarz beim Hover**
```css
.ios-item:hover:not(:active) .ios-item-left svg {
  color: #000000 !important;
  stroke: #000000 !important;
  fill: #000000 !important;
}
```
- Widget-Icons wechseln zu schwarz auf weißem Hover-Hintergrund
- Betrifft alle SVG-Icons in `.ios-item-left`

**2. Code-Elemente → Schwarzer Hintergrund**
```css
.ios-item:hover:not(:active) code.ios-text-strong {
  background: #000000 !important;
  color: #ffffff !important;
}
```
- Excluded Patterns (z.B. `sensor.*`) bekommen schwarzen Hintergrund
- Weiße Schrift für optimale Lesbarkeit

**3. Input-Felder → Schwarze Schrift**
```css
.ios-item:hover:not(:active) input {
  color: #000000 !important;
}
```
- Input-Werte (z.B. "0" bei Max Entities) werden schwarz beim Hover
- Sorgt für Lesbarkeit auf weißem Hover-Hintergrund

**Effekt**: Komplette Farbinvertierung beim Hover für tvOS-artiges Feedback

#### 🏷️ Tooltips - Vollständige Abdeckung

**Neue Filter Control Tooltips**:
- Grid View (Kachelansicht)
- List View (Listenansicht)
- Filter by Categories (Nach Kategorien filtern)
- Filter by Areas (Nach Räumen filtern)
- Filter by Types (Nach Typen filtern)
- Toggle Filters (Filter öffnen/schließen)

**Neue Detail Tab Tooltips**:
- Controls Tab (Steuerung)
- Schedule Tab (Zeitplan)
- History Tab (Verlauf)
- Context Tab (Kontext)

**Implementierung**:
- Alle Tooltips in `de.js` und `en.js` unter `tooltips` Schlüssel
- Verwendung von `translateUI()` für Mehrsprachigkeit
- `currentLanguage` Prop wird durchgereicht für korrekte Sprache

#### 📊 Design-System Verbesserungen

**iOS-Style Consistency**:
- ✅ Keine Emojis mehr in Settings-UI
- ✅ Konsistente Icon-Verwendung (SVG only)
- ✅ Optimale Lesbarkeit in allen Hover-Zuständen
- ✅ Vollständige Tooltip-Abdeckung für bessere UX
- ✅ tvOS-inspirierte Hover-Effekte mit Invertierung

**Accessibility**:
- ✅ Hoher Kontrast bei Input-Feldern (weiß auf dunkel)
- ✅ Invertierte Farben beim Hover (schwarz auf weiß)
- ✅ Tooltips für alle interaktiven Elemente
- ✅ Visuelle Konsistenz über alle Settings-Tabs

---

### Version 1.2.0 (2025-10-22)
- ✅ Migration zu System Entity Framework
- ✅ 5 Settings-Tabs implementiert
- ✅ iOS-inspiriertes Design
- ✅ Event-System für Reaktivität
- ✅ Actions API für programmatischen Zugriff
- ✅ Lifecycle Hooks (onMount, Migrations)
- ✅ Excluded Patterns mit Validierung
- ✅ 10 Sprachen unterstützt

---

## 🔗 Verwandte Dateien

- `src/system-entities/entities/settings/index.js` - Entity Definition
- `src/system-entities/entities/settings/SettingsView.jsx` - View Wrapper
- `src/components/tabs/SettingsTab.jsx` - Haupt-Container
- `src/components/tabs/SettingsTab/constants.jsx` - Konstanten
- `src/components/tabs/SettingsTab/components/*.jsx` - Tab-Komponenten
- `src/system-entities/entities/news/components/iOSSettingsView.css` - Shared Styles
- `src/utils/translations.js` - UI-Übersetzungen

---

## 🎯 Zusammenfassung

**Das Settings System ist:**
- ✅ **Zentralisiert** - Alle Einstellungen an einem Ort
- ✅ **Reaktiv** - Event-System für Live-Updates
- ✅ **Persistent** - localStorage-basierte Speicherung
- ✅ **Typsicher** - Validierung für alle Inputs
- ✅ **Migrierbar** - Versionsmanagement für Updates
- ✅ **Erweiterbar** - Einfach neue Settings hinzufügen
- ✅ **Design-konsistent** - iOS-inspiriertes UI

**Nutze es für:**
- App-Konfiguration (Sprache, Theme, Features)
- Nutzer-Präferenzen (Widgets, Patterns, Limits)
- System-Info (Version, Build-Datum)
- Performance-Tuning (Entity Limits, Lernrate)
