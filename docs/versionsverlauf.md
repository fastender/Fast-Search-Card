# Versionsverlauf / Changelog

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
