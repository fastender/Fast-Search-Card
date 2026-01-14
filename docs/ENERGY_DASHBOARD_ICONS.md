# Energy Dashboard Icons - Vollständige Mapping-Tabelle

**Letztes Update:** 12. Januar 2026
**Status:** ✅ Alle 13 Energy Dashboard Werte + 3 Widget Icons dokumentiert

---

## Icon-Komponenten

**Datei:** `src/components/EnergyIcons.jsx`

Alle Icons wurden direkt aus dem Energy Dashboard (`EnergyChartsView.jsx`) und anderen UI-Komponenten extrahiert.

### Verfügbare Icons (10 total)

#### Energy Dashboard Icons (7)
1. **GridConsumptionIcon** - Transmission Tower (⚡)
2. **SolarIcon** - Solar Panel Grid (☀️)
3. **BatteryIcon** - Battery +/- (🔋)
4. **GridReturnIcon** - Arrow Down in Bag (💰↓)
5. **CostsIcon** - Arrow Up in Bag (💰↑)
6. **HomeIcon** - House Outline (🏠)
7. **NetUsageIcon** - Heartbeat/Waveform (📈)

#### Widget Icons (3)
8. **WeatherIcon** - Sun with Rays (☀️)
9. **TimeIcon** - Clock (⏰)
10. **NotificationIcon** - Bell (🔔)

---

## Energy Dashboard Values → Icon Mapping

### POWER (W/KW) - 5 Werte

| # | Name | Sensor Example | Icon | Component |
|---|------|----------------|------|-----------|
| 1 | **Grid Import** | `solarnet_leistung_netzbezug` | ⚡ | `GridConsumptionIcon` |
| 2 | **Grid Export** | `solarnet_leistung_netzeinspeisung` | ⚡ | `GridConsumptionIcon` |
| 3 | **PV Power** | `solarnet_pv_leistung` | ☀️ | `SolarIcon` |
| 4 | **Consumption** | `solarnet_leistung_verbrauch` | 📈 | `NetUsageIcon` |
| 5 | **Estimated Power** | `power_production_now` | ☀️ | `SolarIcon` |

### ENERGY (WH/KWH) - 4 Werte

| # | Name | Sensor Example | Icon | Component |
|---|------|----------------|------|-----------|
| 6 | **Total Active Energy Consumed** | `smart_meter_ts_65a_3_bezogene_wirkenergie` | 🏠 | `HomeIcon` |
| 7 | **PV Cumulative Total** | `solarnet_energie_gesamt` | ☀️ | `SolarIcon` |
| 8 | **Estimated Production Today** | `energy_production_today` | ☀️ | `SolarIcon` |
| 9 | **Grid Export Total** | `smart_meter_ts_65a_3_eingespeiste_wirkenergie` | ⚡ | `GridConsumptionIcon` |

### BATTERY - 2 Werte

| # | Name | Sensor Example | Icon | Component |
|---|------|----------------|------|-----------|
| 10 | **Discharged (kWh)** | `battery_discharged` | 🔋 | `BatteryIcon` |
| 11 | **Charged (kWh)** | `battery_charged` | 🔋 | `BatteryIcon` |

### TARIFFS - 2 Werte

| # | Name | Sensor Example | Icon | Component |
|---|------|----------------|------|-----------|
| 12 | **Feed-in Tariff** | `solarnet_einspeistetarif` (0.12 EUR/kWh) | 💰↓ | `GridReturnIcon` |
| 13 | **Purchase Tariff** | `solarnet_bezugstarif` (0.25 EUR/kWh) | 💰↑ | `CostsIcon` |

---

## Icon-Verwendung nach Typ

### GridConsumptionIcon (Transmission Tower)
**Verwendet für:**
- Grid Import (#1)
- Grid Export (#2)
- Grid Export Total (#9)

**Bedeutung:** Stromnetz-bezogene Werte

### SolarIcon (Solar Panel Grid)
**Verwendet für:**
- PV Power (#3)
- Estimated Power (#5)
- PV Cumulative Total (#7)
- Estimated Production Today (#8)

**Bedeutung:** Solar-Produktion und -Erzeugung

### NetUsageIcon (Heartbeat/Waveform)
**Verwendet für:**
- Consumption (#4)

**Bedeutung:** Gesamtverbrauch (dynamischer Wert)

### HomeIcon (House Outline)
**Verwendet für:**
- Total Active Energy Consumed (#6)

**Bedeutung:** Gesamt-Haushaltsverbrauch

### BatteryIcon (Battery +/-)
**Verwendet für:**
- Discharged (#10)
- Charged (#11)

**Bedeutung:** Batterie-Lade/-Entladezyklen

### GridReturnIcon (Arrow Down in Bag)
**Verwendet für:**
- Feed-in Tariff (#12)

**Bedeutung:** Einspeisevergütung (Geld kommt rein ↓)

### CostsIcon (Arrow Up in Bag)
**Verwendet für:**
- Purchase Tariff (#13)

**Bedeutung:** Bezugskosten (Geld geht raus ↑)

---

---

## Widget Icon Mapping

### AVAILABLE WIDGETS

| Widget | Icon | Component |
|--------|------|-----------|
| Weather (Temperature & Icon) | ☀️ | `WeatherIcon` |
| Energy (Grid Import) | ⚡ | `GridConsumptionIcon` |
| Energy (Grid Export) | 💰↓ | `GridReturnIcon` |
| Solar Production | ☀️ | `SolarIcon` |
| Notifications (with counter) | 🔔 | `NotificationIcon` |
| Time (live) | ⏰ | `TimeIcon` |
| Today's Consumption | 📈 | `NetUsageIcon` |

---

## Code-Beispiele

### Import

```jsx
import {
  // Energy Dashboard Icons
  GridConsumptionIcon,
  SolarIcon,
  BatteryIcon,
  GridReturnIcon,
  CostsIcon,
  HomeIcon,
  NetUsageIcon,

  // Widget Icons
  WeatherIcon,
  TimeIcon,
  NotificationIcon
} from './EnergyIcons';
```

### Verwendung

```jsx
// ENERGY DASHBOARD ICONS

// Grid Import
<GridConsumptionIcon size={14} color="rgba(255, 255, 255, 0.9)" />

// PV Power
<SolarIcon size={14} color="rgba(255, 255, 255, 0.9)" />

// Consumption
<NetUsageIcon size={14} color="rgba(255, 255, 255, 0.9)" />

// Total Active Energy Consumed
<HomeIcon size={14} color="rgba(255, 255, 255, 0.9)" />

// Battery
<BatteryIcon size={14} color="rgba(255, 255, 255, 0.9)" />

// Feed-in Tariff
<GridReturnIcon size={14} color="rgba(255, 255, 255, 0.9)" />

// Purchase Tariff
<CostsIcon size={14} color="rgba(255, 255, 255, 0.9)" />

// WIDGET ICONS

// Weather
<WeatherIcon size={14} color="rgba(255, 255, 255, 0.9)" />

// Time (Clock)
<TimeIcon size={14} color="rgba(255, 255, 255, 0.9)" />

// Notifications
<NotificationIcon size={14} color="rgba(255, 255, 255, 0.9)" />
```

---

## SVG Details

### GridConsumptionIcon
- **ViewBox:** `0 0 463 463`
- **Type:** Fill-based SVG
- **Complexity:** High (Transmission Tower)

### SolarIcon
- **ViewBox:** `0 0 512 512`
- **Type:** Fill-based SVG
- **Complexity:** Medium (3x3 Grid)

### NetUsageIcon
- **ViewBox:** `0 0 24 24`
- **Type:** Stroke-based SVG
- **Path:** `<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>`

### HomeIcon
- **ViewBox:** `0 0 24 24`
- **Type:** Stroke-based SVG
- **Complexity:** Low (2 paths)

### BatteryIcon
- **ViewBox:** `0 0 24 24`
- **Type:** Stroke-based SVG
- **Complexity:** Medium (3 paths)

### GridReturnIcon
- **ViewBox:** `0 0 24 24`
- **Type:** Stroke-based SVG
- **Complexity:** Medium (Arrow Down in Bag)

### CostsIcon
- **ViewBox:** `0 0 24 24`
- **Type:** Stroke-based SVG
- **Complexity:** Medium (Arrow Up in Bag)

### WeatherIcon
- **ViewBox:** `0 0 24 24`
- **Type:** Stroke-based SVG
- **Complexity:** Medium (Sun with 8 rays)
- **Source:** System Entity Weather (SunnyIcon)

### TimeIcon
- **ViewBox:** `0 0 24 24`
- **Type:** Stroke-based SVG
- **Complexity:** Low (Clock showing 3 o'clock)
- **Source:** DetailView Scheduler Tab

### NotificationIcon
- **ViewBox:** `0 0 24 24`
- **Type:** Stroke-based SVG
- **Complexity:** Medium (Bell with clapper)
- **Source:** Custom Widget Icon

---

## Vorteile

✅ **1:1 identisch** mit Energy Dashboard UI
✅ **Konsistentes Design** über alle Werte
✅ **Skalierbar** via `size` Prop
✅ **Anpassbare Farbe** via `color` Prop
✅ **Wiederverwendbar** in anderen Komponenten
✅ **Semantisch korrekt** - Icons passen zur Bedeutung der Werte

---

## Verwendung im Energy Dashboard

Die Icons werden in folgenden Views verwendet:

1. **Active View** (Main Circle)
   - Consumption Icon (Center)
   - Buttons: Consumption, Solar, Net Usage

2. **Values View** (Detail)
   - Alle 13 Werte mit entsprechenden Icons

3. **Charts View**
   - View-Type Buttons mit Icons

---

## Verwendung in Widgets (System Settings)

Die Widget-Icons werden in den System Settings angezeigt:

1. **Weather (Temperature & Icon)** → `WeatherIcon`
   - Temperatur & Wetter-Icon Anzeige

2. **Energy (Grid Import)** → `GridConsumptionIcon`
   - Aktueller Verbrauch vom Netz

3. **Energy (Grid Export)** → `GridReturnIcon`
   - Rückspeisung ins Netz

4. **Solar Production** → `SolarIcon`
   - Aktuelle Solar-Erzeugung

5. **Notifications (with counter)** → `NotificationIcon`
   - Benachrichtigungen mit Zähler

6. **Time (live)** → `TimeIcon`
   - Live-Zeitanzeige

7. **Today's Consumption** → `NetUsageIcon`
   - Täglicher Verbrauch in kWh

---

**Dokumentation Ende**
