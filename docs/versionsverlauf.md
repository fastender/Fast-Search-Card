# Versionsverlauf / Changelog

## Version 1.1.0768 - 2026-01-14

### ⚡ Performance - DetailView Animation 55% schneller

**Problem**: DetailView-Öffnen-Animation dauerte ~900ms, fühlte sich träge an

**Lösung**: Timing-Optimierung der Framer Motion Variants

**Geänderte Datei**: `src/utils/animations/components.js`

**detailPanelVariants Optimierungen**:
- Delay: 150ms → **50ms** (97% schneller)
- Duration: 600ms → **350ms** (42% schneller)
- Opacity: 450ms → **250ms** (44% schneller)
- Filter: 650ms → **350ms** (46% schneller)
- Spring: stiffness 200 → **250**, mass 0.8 → **0.6** (schnappiger)

**detailContentVariants Optimierungen**:
- Delay: 250ms → **80ms** (68% schneller)
- Duration: 500ms → **300ms** (40% schneller)
- Opacity delay: 300ms → **100ms** (67% schneller)
- Opacity: 400ms → **250ms** (38% schneller)
- Filter delay: 250ms → **80ms** (68% schneller)
- Filter: 550ms → **320ms** (42% schneller)

**Ergebnis**:
- Gesamtanimation: ~900ms → **~400ms** (55% schneller)
- Behält Apple-Style Blur-to-Focus Effekt
- Deutlich responsiveres Gefühl

---

### 🎨 Background Mode - Wallpaper Manipulation

**Neu**: Background Mode (Automatic/Light/Dark) beeinflusst jetzt tatsächlich den Home Assistant Wallpaper!

**Geänderte Dateien**:
- `src/components/WallpaperModeOverlay.jsx` (neu)
- `src/index.jsx`

#### Implementierung - WallpaperModeOverlay Komponente

**Fixed Overlay mit 3 Modi**:

1. **🌙 Dark Mode**:
   - Schwarzes Overlay (40% Opacity)
   - 8px Blur-Effekt
   - Verdunkelt Wallpaper für besseren Fokus

2. **☀️ Light Mode**:
   - Weißes Overlay (20% Opacity)
   - 8px Blur-Effekt
   - Hellt Wallpaper auf

3. **🔄 Automatic**:
   - 20:00 - 06:00 Uhr: Dark Mode (schwarzes Overlay + Blur)
   - 06:00 - 20:00 Uhr: Kein Effekt (normaler Wallpaper)

**Technische Details**:
```javascript
// WallpaperModeOverlay.jsx
<div style={{
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: overlayColor,           // 'black' oder 'white'
  opacity: overlayOpacity,            // 0.4 (dark) oder 0.2 (light)
  backdropFilter: 'blur(8px)',       // Subtiler Unschärfe-Effekt
  WebkitBackdropFilter: 'blur(8px)',
  pointerEvents: 'none',              // Keine Interaktions-Blockierung
  zIndex: 0,                          // Hinter Card, über Wallpaper
  transition: 'opacity 0.5s ease, background 0.5s ease, backdrop-filter 0.5s ease'
}} />
```

**Event-System**:
- Reagiert auf `darkModeChanged` Events
- Lädt initialen Mode aus `localStorage.darkMode`
- Smooth 0.5s Transitions zwischen Modi

**Wichtiger Unterschied**:
- **Background Mode** → Manipuliert **WALLPAPER** (Overlay + Blur)
- **Background Settings** (Brightness/Blur/etc.) → Manipuliert **FAST SEARCH CARD** (Glassmorphism auf `.glass-panel`)

---

## Version 1.1.0767 - 2026-01-12

### ⚡ StatsBar Energy Dashboard Integration

#### Neue Widgets mit berechneten Energy Dashboard Werten
- **Problem**: StatsBar zeigte nur rohe Sensor-Entity-IDs an
- **Lösung**: Integration der Energy Dashboard Statistics API für berechnete Echtzeit- und Tageswerte

**Neue Widgets**:
1. **📊 Bisheriger Verbrauch heute** (`todayConsumption`)
   - Zeigt kumulativen Tagesverbrauch in kWh
   - Quelle: `getTodayEnergyStatistics()` aus Energy Statistics API
   - Default: AUS

2. **💰 Heutige Kosten** (`todayCost`)
   - Zeigt berechnete Kosten basierend auf Energiepreis
   - Formel: `todayConsumption × energyPrice`
   - Default: AUS

**Aktualisierte Widgets**:
- **⚡ Netzbezug**: Verwendet jetzt `getEnergyDashboardData()` → `currentGridConsumption` (W → kW)
- **☀️ Solar**: Verwendet jetzt `getEnergyDashboardData()` → `currentSolarProduction` (W → kW)

#### Energiepreis-Konfiguration
**Neue Sektion in StatsBar Settings > Data Sources**:
- Input-Feld für Energiepreis (€/kWh)
- Default: 0.30 €/kWh
- Speicherung in `localStorage.energyPrice`
- Live-Update: Änderungen triggern automatisches Neuladen der Energy-Daten

**Event**: `energyPriceChanged`
```javascript
window.dispatchEvent(new CustomEvent('energyPriceChanged', { detail: numericPrice }));
```

#### Energy Dashboard SVG Icons
**Neue Komponente**: `src/components/EnergyIcons.jsx`

Extrahierte Icons aus `EnergyChartsView.jsx`:
- `GridConsumptionIcon` - Transmission Tower (⚡ Netzbezug, 📊 Verbrauch)
- `SolarIcon` - Solar Panel Grid (☀️ Solar)
- `BatteryIcon` - Battery +/- (🔋 Batterie)
- `GridReturnIcon` - Arrow Down in Bag (🔋 Einspeisung)
- `CostsIcon` - Arrow Up in Bag (💰 Kosten)
- `HomeIcon` - House Outline (Eigenkonsum)

**Vorteile**:
- ✅ 1:1 identisch mit Energy Dashboard Icons
- ✅ Skalierbar via `size` Prop
- ✅ Anpassbare Farbe via `color` Prop
- ✅ Kein Emoji-Rendering mehr

**Verwendung**:
```jsx
<GridConsumptionIcon size={14} color="rgba(255, 255, 255, 0.9)" />
```

#### StatsBar Component Updates
**Datei**: `src/components/StatsBar.jsx`

**Neue State**:
```javascript
const [energyData, setEnergyData] = useState(null);
const [energyPrice, setEnergyPrice] = useState(() => getEnergyPrice());
```

**Neue useEffects**:
1. Energy Dashboard Data Fetching (alle 5 Minuten)
2. Energy Price Change Listener

**Widget-Updates**:
- Grid Consumption: Emoji ⚡ → `<GridConsumptionIcon />`
- Grid Return: Emoji 🔋 → `<GridReturnIcon />`
- Solar: Emoji ☀️ → `<SolarIcon />`
- Battery: Emoji 🔋 → `<BatteryIcon />`
- Today's Consumption: `<GridConsumptionIcon />` + kWh-Wert
- Today's Cost: `<CostsIcon />` + € -Wert

#### StatsBar Settings Tab Updates
**Datei**: `src/components/tabs/SettingsTab/components/StatsBarSettingsTab.jsx`

**Neue Imports**:
```javascript
import { getEnergyPrice, saveEnergyPrice } from '../../../../services/energyDashboardService';
```

**Erweiterte Widget-Konfiguration**:
```javascript
loadWidgetSettings() {
  return {
    weather: true,
    gridConsumption: true,
    gridReturn: true,
    solar: false,
    notifications: true,
    time: true,
    todayConsumption: false,  // ✨ NEU
    todayCost: false          // ✨ NEU
  };
}
```

**Neue UI-Sektion**: Energy Price Configuration
- Label: "Preis pro kWh"
- Input: Number (step 0.01, min 0)
- Unit: "€/kWh"
- Handler: `handleEnergyPriceChange()`

#### Energy Dashboard Service Updates
**Datei**: `src/services/energyDashboardService.js`

**Neue Funktionen**:
1. `getEnergyPrice()` - Lädt Energiepreis aus localStorage (default: 0.30)
2. `saveEnergyPrice(price)` - Speichert Energiepreis in localStorage
3. `calculateEnergyCost(energyKwh, pricePerKwh)` - Berechnet Kosten
4. `getTodayEnergyStatistics(hass, energySensorId)` - Holt Tagesstatistiken
5. `getEnergyDashboardData(hass, sensorConfig)` - Umfassende Daten-Aggregation

**Rückgabewerte von `getEnergyDashboardData()`**:
```javascript
{
  currentGridConsumption: 1234,     // W
  currentGridReturn: 0,             // W
  currentSolarProduction: 567,      // W
  todayGridConsumption: 12.5,       // kWh
  todayGridReturn: 3.2,             // kWh
  todaySolarProduction: 8.7,        // kWh
  todayCost: 3.75,                  // €
  todayRevenue: 0.26                // €
}
```

#### Translations Updates
**Neue Keys (DE/EN)**:
```javascript
// Widgets
todayConsumptionWidget: '📊 Bisheriger Verbrauch heute' / '📊 Today\'s Consumption'
todayConsumptionDescription: 'Tagesverbrauch in kWh' / 'Daily consumption in kWh'
todayCostWidget: '💰 Heutige Kosten' / '💰 Today\'s Cost'
todayCostDescription: 'Kosten basierend auf Energiepreis' / 'Cost based on energy price'

// Energy Price
energyPriceConfig: 'Energiepreis' / 'Energy Price'
energyPriceLabel: 'Preis pro kWh' / 'Price per kWh'
energyPriceDescription: 'Strompreis für Kostenberechnung' / 'Electricity price for cost calculation'
energyPriceFooter: 'Dieser Preis wird verwendet, um die täglichen Kosten zu berechnen' /
                   'This price is used to calculate daily costs'
```

#### Dokumentation Updates
**Aktualisierte Dateien**:
- `docs/STATSBAR_SETTINGS.md` - Vollständige Dokumentation der neuen Features
- `docs/settings-guide.md` - System Settings Dokumentation aktualisiert
- `docs/versionsverlauf.md` - Dieser Changelog

**Neue Sektionen in STATSBAR_SETTINGS.md**:
1. Widget-Liste erweitert (2 neue Widgets dokumentiert)
2. Energy Price Configuration Section (3.3)
3. Energy Dashboard Icons Section (komplett neu)
4. Event System: `energyPriceChanged` Event dokumentiert
5. localStorage Struktur aktualisiert

#### Geänderte Dateien
**Neue Dateien**:
- `src/components/EnergyIcons.jsx` - Energy Dashboard Icon-Komponenten

**Geänderte Dateien**:
- `src/components/StatsBar.jsx` - Energy Dashboard Integration
- `src/components/tabs/SettingsTab/components/StatsBarSettingsTab.jsx` - Neue Widgets + Price Config
- `src/services/energyDashboardService.js` - Neue API-Funktionen
- `src/utils/translations/languages/de.js` - 8 neue Keys
- `src/utils/translations/languages/en.js` - 8 neue Keys
- `docs/STATSBAR_SETTINGS.md` - Feature-Dokumentation
- `docs/settings-guide.md` - System Settings Update

#### Testing
**Erfolgreich getestet**:
- ✅ Widget Toggle-Schalter funktionieren
- ✅ Energy Price Input speichert korrekt
- ✅ Energy Dashboard Daten werden geladen (5-Min-Intervall)
- ✅ Icons rendern korrekt (SVG statt Emojis)
- ✅ Kostenberechnung funktioniert
- ✅ Events triggern korrekt
- ✅ localStorage Persistenz funktioniert
- ✅ Build erfolgreich (1.336 MB)

---

## Version 1.1.0950 - 2026-01-11

### 🌍 Internationalization

#### Settings: Appearance & General Tab Übersetzungen vervollständigt
- **Problem**: AppearanceSettingsTab und GeneralSettingsTab enthielten hardcoded deutsche Texte
- **Root Cause**: StatsBar Detail View, Animations View und General Section Header verwendeten direkte deutsche Strings
- **Lösung**: Translation-Keys hinzugefügt und hardcoded Strings durch `t()` Calls ersetzt

**Hinzugefügte Keys (DE/EN)**:
```javascript
// StatsBar Detail View - 12 Keys
showStatsBar, showStatsBarDescription, username, usernamePlaceholder,
usernameFooter, widgets, fixedWidgets, weatherWidget, energyWidget,
notificationsWidget, timeWidget, statsBarNote

// Animations View - 2 Keys
namingScheme, namingSchemeNote

// General Tab - 1 Update
general: 'ALLGEMEIN' / 'GENERAL' (uppercase für Section Header)
```

**Ersetzte hardcoded Strings:**
```javascript
// AppearanceSettingsTab.jsx - StatsBar Detail View
"StatsBar anzeigen" → {t('showStatsBar')}
"Benutzername" → {t('username')}
"Widgets" → {t('widgets')}

// AppearanceSettingsTab.jsx - Animations View
"Namensschema:" → {t('namingScheme')}
"Beispiele:" → {t('examples')}

// GeneralSettingsTab.jsx
"ALLGEMEIN" → {t('general')}
```

**Geänderte Dateien:**
- `src/utils/translations/languages/de.js` (+15 Keys)
- `src/utils/translations/languages/en.js` (+15 Keys)
- `src/components/tabs/SettingsTab/components/AppearanceSettingsTab.jsx` (hardcoded Strings → t() Calls)
- `src/components/tabs/SettingsTab/components/GeneralSettingsTab.jsx` (hardcoded String → t() Call)

**Ergebnis:**
- ✅ Status & Greetings Section vollständig übersetzt
- ✅ StatsBar Detail View vollständig übersetzt
- ✅ Animations View vollständig übersetzt
- ✅ General Tab Section Header übersetzt
- ✅ Vollständiges Sprachwechsel-Verhalten in allen Settings-Tabs

---

## Version 1.1.0949 - 2026-01-11

### 🐛 Bug Fix

#### StatsBar Settings: "UI.SETTINGS.SETTINGS" Section Header behoben
- **Problem**: StatsBar Settings zeigte "UI.SETTINGS.SETTINGS" als Section Header
- **Root Cause**: `t('settings')` führte zu `translateUI('settings.settings', lang)`, was den Key-Path rekursiv machte
- **Lösung**: Section Header durch sprachabhängigen hardcoded Text ersetzt

**Änderungen:**
```javascript
// StatsBarSettingsTab.jsx - Section Header
// Vorher:
<div className="ios-section-header">{t('settings')}</div>

// Nachher:
<div className="ios-section-header">
  {lang === 'de' ? 'EINSTELLUNGEN' : 'SETTINGS'}
</div>
```

**Geänderte Dateien:**
- `src/components/tabs/SettingsTab/components/StatsBarSettingsTab.jsx` (Section Header + lang Prop)
- `src/components/tabs/SettingsTab.jsx` (lang Prop an StatsBarSettingsTab übergeben)

**Ergebnis:**
- ✅ StatsBar Settings zeigt jetzt "EINSTELLUNGEN" (DE) / "SETTINGS" (EN)
- ✅ Keine Key-Konflikte mehr im Translation-System
- ✅ Konsistente Darstellung mit anderen Settings-Tabs

---

## Version 1.1.0948 - 2026-01-11

### 🐛 Bug Fix

#### Settings: Fehlende Translation-Keys für About-Tab hinzugefügt
- **Problem**: About-Tab zeigte Keys statt Übersetzungen (`ui.settings.maxEntities`, `UI.SETTINGS.SYSTEMSETTINGS`)
- **Root Cause**: Translation-Keys waren nur in EN vorhanden, fehlten in DE
- **Lösung**: Alle fehlenden Keys in `de.js` hinzugefügt

**Hinzugefügte Keys (DE)**:
```javascript
// System Settings (About Tab) - 6 Keys
systemSettings, maxEntities, maxEntitiesDescription,
maxEntitiesUnlimited, onlyEntitiesWithArea, onlyEntitiesWithAreaDescription

// Excluded Patterns - 11 Keys
excludedPatterns, excludedPatternsDescription, wildcardAny, wildcardAnySuffix,
wildcardSingle, examples, patternPlaceholder, addPattern,
activePatterns, removePattern, noPatternsYet
```

**Korrigierte Keys**:
- `settings: 'UI.SETTINGS.SETTINGS'` → `settings: 'Einstellungen'` (DE)
- `settings: 'UI.SETTINGS.SETTINGS'` → `settings: 'Settings'` (EN)

**Geänderte Dateien:**
- `src/utils/translations/languages/de.js` (+17 Keys)
- `src/utils/translations/languages/en.js` (1 Fix)

**Ergebnis:**
- ✅ About-Tab zeigt jetzt deutsche Texte statt Keys
- ✅ Systemeinstellungen vollständig übersetzt
- ✅ Ausschlussmuster vollständig übersetzt
- ✅ Alle Settings-Tabs funktionieren in DE + EN

---

## Version 1.1.0947 - 2026-01-11

### 🌐 Internationalisierung

#### Settings: Vollständige Deutsch/Englisch Übersetzungen
- **Alle Settings-Tabs komplett übersetzt**: Privacy, StatsBar, About
- **100+ neue Translation-Keys** in DE + EN hinzugefügt
- **Alle hardcoded Strings entfernt** durch `t()` Calls ersetzt

**Übersetzte Komponenten:**
- **PrivacySettingsTab**: Vorschläge, Confidence, Zeitfenster, Lerngeschwindigkeit
- **StatsBarSettingsTab**: Widgets, Datenquellen, Sensorkonfiguration, Erkennungsmodus
- **AboutSettingsTab**: Versionsinformationen, Entity-Limits

**Neue Translation-Keys** (`ui.settings`):
```javascript
// Privacy
enableSuggestions, enableSuggestionsDescription,
confidenceThresholdCurrent, timeWindowCurrent, maxSuggestionsShow,
learningSpeed, learningSpeedDescription, slow, normal, fast,
privacySecure, privacyLocalOnly, clearCacheConfirm, clearCacheSuccess,
resetDataWarning, resetDataConfirm

// StatsBar
statsBar, widgets, widgetsDescription, dataSources, dataSourcesDescription,
aboutStatsBar, statsBarDescription, features, liveUpdates,
energyDashboardIntegration, customizableWidgets,
weatherWidget, weatherWidgetDescription,
energyGridConsumptionWidget, energyGridConsumptionDescription,
energyGridReturnWidget, energyGridReturnDescription,
solarProductionWidget, solarProductionDescription,
notificationsWidget, notificationsWidgetDescription,
timeWidget, timeWidgetDescription, widgetsFooter,

// Data Sources
detectionMode, autoDetection, detectionRunning,
energyDashboardFound, patternBasedDetection,
noSensorsDetected, detectionError, notChecked,
startDetection, redetectSensors, searchRunning,
autoDetectionInfo, manualConfigInfo,
configuredSensors, gridConsumption, gridReturn, solar, battery,
notConfigured, sensorStatusLegend,
manualConfiguration, manualConfigDescription,
gridConsumptionEntityLabel, gridReturnEntityLabel,
solarEntityLabel, batteryEntityLabel,
aboutDataSources, autoDetectionDescription
```

**Geänderte Dateien:**
- `src/utils/translations/languages/de.js` (+70 Keys)
- `src/utils/translations/languages/en.js` (+70 Keys)
- `src/components/tabs/SettingsTab/components/StatsBarSettingsTab.jsx` (50+ `t()` Replacements)

**Vorteile:**
- ✅ Vollständige Mehrsprachigkeit - DE/EN komplett unterstützt
- ✅ Konsistente UX - Alle Texte über Translation-System
- ✅ Erweiterbar - Einfach neue Sprachen hinzufügen
- ✅ Wartbar - Zentrale Translation-Files

---

## Version 1.1.0946 - 2026-01-11

### ♻️ Refactoring

#### Settings: Sprachauswahl vereinfacht
- **Sprachoptionen reduziert**: Nur Deutsch und Englisch verfügbar
- **UI-Reorganisation**: Neue "ALLGEMEIN" Übersicht
  - ✅ **Sprachauswahl** - Sichtbar (Deutsch/Englisch)
  - 🙈 **AI-Modus** - Ausgeblendet (im Code vorhanden)
  - 🙈 **Animationen** - Ausgeblendet (im Code vorhanden)
  - 🙈 **Push-Benachrichtigungen** - Ausgeblendet (im Code vorhanden)

**Implementierung**:
```javascript
// constants.jsx
export const LANGUAGE_CODES = ['de', 'en']; // Nur DE/EN

// GeneralSettingsTab.jsx
<div className="ios-section-header">ALLGEMEIN</div>
<div className="ios-card">
  {/* AI, Animationen, Sound: display: none */}
  {/* Nur Sprachauswahl sichtbar */}
  <motion.div className="ios-item ios-item-clickable">
    <div className="ios-item-label">{t('appLanguage')}</div>
    <span className="ios-item-value">{getLanguageDisplay(language)}</span>
  </motion.div>
</div>
```

**Geänderte Dateien**:
- `src/components/tabs/SettingsTab/constants.jsx` (LANGUAGE_CODES: 10 → 2 Sprachen)
- `src/components/tabs/SettingsTab/components/GeneralSettingsTab.jsx` (UI-Reorganisation)

**Vorteile**:
- ✅ Fokussierte UX - Nur relevante Optionen sichtbar
- ✅ Code bleibt erhalten - Einfach wieder aktivierbar
- ✅ Weniger Komplexität in der UI

---

## Version 1.1.0945 - 2026-01-11

### 🗑️ Removed

#### Fronius Solar Integration entfernt
- **Grund**: Energy Dashboard deckt diese Funktionalität bereits ab
- **Entfernte Dateien**:
  - `FroniusDeviceEntity.js` - Entity-Definition mit Sensor-Mapping
  - `FroniusDeviceView.jsx` - Live-Power-Grid View
  - `FroniusOverviewTab.jsx` - Übersichts-Tab
  - `FroniusEnergyTab.jsx` - Energie-Tab
  - `FroniusBatteryTab.jsx` - Batterie-Tab
  - `FroniusSettingsTab.jsx` - Einstellungs-Tab
  - `FroniusSetup.jsx` - Auto-Discovery Setup Flow (14 Sensor-Typen, 5 Geräte-Typen)
- **Angepasste Dateien**:
  - `DeviceEntityFactory.js` - Fronius-Import und case entfernt
  - `IntegrationView.jsx` - Fronius Setup Flow entfernt
  - `CategorySelectionView.jsx` - Fronius-Kategorie entfernt
- **Code-Reduktion**: ~520 Zeilen
- **Bundle-Reduktion**: ~20 kB (1,343 kB → 1,323 kB)

**Alternative**: Nutze das Energy Dashboard für Solar/Battery-Visualisierung

---

## Version 1.1.0944 - 2026-01-11

### 🐛 Bug Fixes

#### DetailView Überlappung mit StatsBar behoben
- **Problem**: DetailView überdeckte die StatsBar beim Öffnen
- **Root Cause**: `position: absolute; top: 0` mit `z-index: 10` legte sich über StatsBar
- **Lösung**: Zweistufige Positionierungs-Logik implementiert:
  - **CSS `top`**: Fixer Offset für StatsBar-Höhe (45px Mobile / 46px Desktop)
  - **Transform `y`**: Dynamischer Offset für centered/top Position (0px/60px/120px)

**Implementierung**:
```jsx
const statsBarHeight = statsBarEnabled ? (isMobile ? 45 : 46) : 0;
const yOffset = position === 'centered' ? (isMobile ? 60 : 120) : 0;

<motion.div
  style={{ top: `${statsBarHeight}px` }}
  animate={{ y: hasAppeared ? yOffset : 0 }}
/>
```

**Ergebnis**:
- ✅ Korrekte Positionierung unterhalb der StatsBar
- ✅ Keine Überlappung mehr
- ✅ Smooth Spring Animation beim Öffnen

**Geänderte Dateien**:
- `src/components/SearchField/components/DetailViewWrapper.jsx`
- `src/components/SearchField.jsx`
- `docs/statsbar-greetings-guide.md`
- `docs/CHANGELOG.md`
- `docs/versionsverlauf.md`

---

## Version 1.1.0942 - 2026-01-11

### ♻️ Refactoring

#### CircularIcon DOM-Struktur Verbesserung
- **CircularIcon-Komponente entfernt**: Separate Komponente wurde aufgelöst
- **Integration in CircularSliderDisplay**: Icon wird jetzt direkt in `value-display-container` gerendert
- **Vorteile**:
  - ✅ Bessere DOM-Struktur - Icon ist Teil der Value-Display-Komponente
  - ✅ Konsistentes Flexbox-Layout
  - ✅ Einfachere Wartung - weniger separate Komponenten
  - ✅ Korrekte z-index Verwaltung

**DOM-Struktur vorher:**
```
circular-content
├── circular-icon-container (separate)
└── value-display-container (separate)
```

**DOM-Struktur nachher:**
```
circular-content
└── value-display-container
    ├── circular-icon (integriert)
    ├── value-wrapper
    ├── sub-value
    └── label
```

**Geänderte Dateien**:
- `src/components/controls/CircularSliderDisplay.jsx` (Icon Integration)
- `src/components/controls/CircularSlider.jsx` (CircularIcon Import entfernt)
- `src/components/controls/CircularIcon.jsx` (ENTFERNT)

### ✨ Neue Features

#### Typspezifische Farben für Energy Dashboard
- **Farbdifferenzierung**: Jeder Energy-Typ hat jetzt seine eigene charakteristische Farbe
- **Farbschema**:
  - 🏠 **Verbrauch** → **Rot** (`#FF6B6B`) - Consumption
  - ☀️ **Solarerzeugung** → **Gelb** (`#FFD93D`) - Solar Production
  - ⚡ **Nettonutzung** → **Grün** (`#4ECB71`) - Grid/Net
  - 🔋 **Batterie** → **Blau** (`#42A5F5`) - Battery (zukünftig)

**Implementierung**:
```javascript
// deviceConfigs.js
const circularColors = {
  solarerzeugung: '#FFD93D',    // Gelb
  verbrauch: '#FF6B6B',         // Rot
  nettonutzung: '#4ECB71',      // Grün
  batterie: '#42A5F5'           // Blau
};
```

**Vorteile**:
- ✅ Sofortige visuelle Unterscheidbarkeit der drei Slides
- ✅ Intuitive Farbzuordnung (UI/UX Best Practices)
- ✅ Erweiterbar für zukünftige Energy-Typen

**Geänderte Dateien**:
- `src/utils/deviceConfigs.js` (circularColors Mapping)

### 🎨 Design-Verbesserungen

- Icon-Größe responsive: 28px (Mobile) / 32px (Desktop)
- Icon verwendet `marginBottom` für konsistente Abstände
- Saubere Integration in Flexbox-Layout

---

## Version 1.1.0783 - 2026-01-06

### ✨ Neue Features

#### Energy Dashboard Device Entity
- **Neue System-Entity**: Energy Dashboard Device für Energie-Monitoring
- **Dual Sensor Configuration**:
  - Power Sensor (W/kW) für Live-Leistungsanzeige
  - Energy Counter Sensor (Wh/kWh) für kumulative Energieberechnung
- **iOS-Style Settings Navigation**:
  - Sensor-Auswahl mit Back-Button wie bei Sprachauswahl
  - Dynamische Filterung nach Sensor-Typ (W/kW vs Wh/kWh)
  - Live-Preview der Sensor-Werte in Settings
- **Echtzeit-Updates**:
  - Live Power-Werte via WebSocket (`hass.states`)
  - "Heute" Verbrauch aktualisiert sich in Echtzeit
  - Keine Polling-Intervals nötig
- **Statistics API Integration**:
  - Berechnung von Tagesverbrauch (00:00 - jetzt)
  - Vorbereitung für historische Perioden (Woche, Monat)
  - Verwendung von `state` statt `sum` für `total_increasing` Sensoren

### 🐛 Behobene Fehler

#### 1. Grid Import Sensor wurde nicht persistent gespeichert
**Problem**: Sensor-Auswahl wurde bei jedem Reload zurückgesetzt
**Ursache**:
- `loadEnergyPreferences` überschrieb User-Konfiguration mit HA Energy Dashboard Sensor
- `entity.updateAttributes()` fehlte in Sensor-Selection Handlers
**Lösung**:
- `loadEnergyPreferences` lädt nur noch Energy Prefs, überschreibt NICHT `grid_import_sensor`
- Beide Sensor-Selection Handler setzen explizit Attributes
- `onMount` lädt beide Sensoren aus localStorage in Attributes

**Dateien**:
- `EnergyDashboardDeviceEntity.js:127-142` (loadEnergyPreferences fix)
- `EnergyDashboardDeviceEntity.js:627-633` (onMount beide Sensoren laden)
- `EnergyDashboardDeviceView.jsx:281,498` (updateAttributes in beiden Handlers)

#### 2. Falsche Einheiten-Konvertierung
**Problem**: "Heute" zeigte 33652 kWh statt ~32 kWh
**Ursache**:
- Code ging davon aus, alle Werte sind in Wh
- Statistics API gibt Werte in Sensor-Einheit zurück (kann Wh ODER kWh sein)
- Doppelte Konvertierung führte zu falschen Werten
**Lösung**:
- RAW-Werte speichern ohne Konvertierung
- Bei Berechnung Sensor-Einheit prüfen und entsprechend konvertieren
- `state` statt `sum` für total_increasing Sensoren

**Dateien**:
- `UniversalControlsTab.jsx:129` (state statt sum)
- `UniversalControlsTab.jsx:165` (raw value ohne Konvertierung)
- `UniversalControlsTab.jsx:206-212` (einheitenabhängige Berechnung)

#### 3. Statistics API verwendete falsches Feld
**Problem**: Mitternachtswert war 9135 kWh statt ~42755 kWh
**Ursache**: `sum` enthält Delta/Summe der Periode, nicht Sensor-Zustand
**Lösung**:
- `types: ['state', 'sum']` explizit anfordern
- `state` nutzen für total_increasing Sensoren
- Debug-Logs für Troubleshooting

**Dateien**:
- `UniversalControlsTab.jsx:121` (types parameter)
- `UniversalControlsTab.jsx:129` (state ?? sum fallback)

### 📝 Technische Details

#### Sensor-Speicherung
```javascript
// localStorage
{
  "gridImportSensor": "sensor.solarnet_leistung_netzbezug",  // W/kW
  "kwhSensor": "sensor.smart_meter_ts_65a_3_bezogene_wirkenergie"  // Wh/kWh
}

// entity.attributes
{
  "grid_import_sensor": "sensor.solarnet_leistung_netzbezug",
  "kwh_sensor": "sensor.smart_meter_ts_65a_3_bezogene_wirkenergie"
}
```

#### Berechnung "Heute"
```javascript
// 1. Hole Mitternachtswert EINMALIG (Statistics API)
const midnightValue = stats[0]?.state;  // Sensor-Zustand um 00:00 Uhr

// 2. Lese aktuellen Wert LIVE (hass.states)
const currentValue = hass.states[kwhSensorId].state;

// 3. Berechne Differenz (einheitenabhängig)
const todayConsumptionKWh = sensorUnit === 'Wh'
  ? (currentValue - midnightValue) / 1000
  : (currentValue - midnightValue);
```

#### WebSocket Updates
- **Power (W/kW)**: Triggert bei jedem `hass.states` Change (sofort)
- **Energy (Wh/kWh)**: Triggert bei jedem `hass.states` Change (sofort)
- **Mitternachtswert**: Nur einmal beim Mount (bleibt konstant für den Tag)

### 🔄 Migration

**Bestehende Energy Dashboard Devices**:
1. Öffne Settings im Device
2. Wähle Power Sensor (W/kW) neu aus
3. Wähle Energy Counter Sensor (Wh/kWh) neu aus
4. Reload Seite - Einstellungen bleiben jetzt persistent

**Bekannte Probleme**: Keine

### 📚 Dokumentation

Siehe auch:
- `docs/energy-statistics-api.md` - Detaillierte API-Dokumentation
- `src/system-entities/entities/integration/device-entities/EnergyDashboardDeviceEntity.js` - Entity Implementation
- `src/components/tabs/UniversalControlsTab.jsx` - UI und Echtzeit-Updates

---

## Frühere Versionen

### Version 1.1.0766 - 2026-01-03
- BambuLab 3D Printer Device Entity
- Printer3D Detail View mit 4 Tabs
- Universal Controls Tab
- Device Entity Factory Pattern

### Version 1.0.x
- Initial Release
- Basic System Entities
- Settings Integration
