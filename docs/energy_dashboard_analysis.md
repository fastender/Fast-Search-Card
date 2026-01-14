# Energy Dashboard Analysis

**Letztes Update:** 10. Januar 2026, 21:30 Uhr
**Status:** ✅ VOLLSTÄNDIG FUNKTIONSFÄHIG - Verbrauch UND Solar Charts funktionieren!

---

## 📊 Aktueller Zustand (Stand: 10.01.2026 21:30)

### ✅ Was FUNKTIONIERT:

#### 1. **Verbrauch Tab - Live Values**
- **Quelle:** `EnergyChartsView.jsx` (Zeile 138-292)
- **Daten:** Zeigt korrekt Total Consumption, Netz, Solar, Battery
- **Berechnung:**
  ```javascript
  totalConsumption = gridConsumption + solarSelfConsumption + batteryConsumption
  solarSelfConsumption = pvProduction - gridExport
  batteryConsumption = batteryDischarged - batteryCharged
  ```
- **Sensoren verwendet:**
  - `kwh_sensor` (Grid Import, kumulativ Lifetime)
  - `pv_total_sensor` (PV Production, kumulativ Lifetime)
  - `grid_export_total_sensor` (Grid Export, kumulativ Lifetime)
  - `battery_discharged_sensor` (Battery Discharge)
  - `battery_charged_sensor` (Battery Charge)
- **Labels:**
  - Grid → "Netz" (Grid Import)
  - Solar → "Solar" (Solar)
  - Battery → "Batterie" (Battery)

#### 2. **Verbrauch Tab - Chart**
- **Quelle:** `EnergyDashboardDeviceEntity.js` (Zeile 655-907)
- **Funktion:** `getChartData({ periodType: 'day', sensorId: kwh_sensor })`
- **Sensor verwendet:** `kwh_sensor` (Grid Import, kumulativ Lifetime)
- **Methode:** Differenzmethode mit Baseline
- **Zeigt:** Grid Import Verbrauch pro Stunde/Tag/Monat
- **Perioden:**
  - Tag: 24 Stunden (Linie)
  - Woche: 7 Tage (Balken)
  - Monat: 28-31 Tage (Balken)
  - Jahr: Vorjahr vs. Aktuelles Jahr (Balken)

#### 3. **Solar Tab - Live Values**
- **Quelle:** `EnergyChartsView.jsx` (Zeile 253-283)
- **Daten:** Zeigt korrekt Total Solar Production, Netz, Haus, Batterie
- **Berechnung:**
  ```javascript
  totalSolarProduction = pvProduction
  gridExport = Einspeisung ins Netz
  solarSelfConsumption = pvProduction - gridExport (Eigenkonsum)
  batteryCharged = Batterie Ladung
  ```
- **Labels:**
  - Grid → "Netz" (Grid Export/Einspeisung)
  - Solar → "Haus" (Self Consumption) mit Haus-Icon
  - Battery → "Batterie" (Charged)

#### 4. **Solar Tab - Chart** ✅ NEU!
- **Status:** ✅ FUNKTIONIERT!
- **Quelle:** `EnergyDashboardDeviceEntity.js` (Zeile 655-907)
- **Funktion:** `getChartData({ periodType: 'day', sensorId: pv_total_sensor })`
- **Sensor verwendet:** `pv_total_sensor` (PV Production, kumulativ Lifetime)
- **Methode:** Gleiche Differenzmethode wie Verbrauch
- **Zeigt:** PV Production pro Stunde/Tag/Monat
- **Perioden:** Gleich wie Verbrauch (Tag/Woche/Monat/Jahr)

---

## 🔧 Architektur

### Dateistruktur:

```
src/system-entities/entities/integration/device-entities/
├── EnergyDashboardDeviceEntity.js      // Backend: Daten-Logik
├── components/
│   └── EnergyChartsView.jsx            // UI: Charts + Live Values
└── EnergyDashboardDeviceView.jsx       // Main View mit Tabs
```

### Zwei getrennte Datenströme:

#### Datenstrom 1: Live Values (Oben)
- **Location:** `EnergyChartsView.jsx` Zeile 129-292
- **Trigger:** `useEffect` bei `timeRange` Änderung
- **Methode:** `getCurrentPeriodConsumption()` + `getPeriodEnergy()`
- **API:** Statistics API (`recorder/statistics_during_period`)
- **Sensoren:** MEHRERE (Grid, Solar, Battery)
- **Output:** Total Value + Breakdown (Grid %, Solar %, Battery %)

#### Datenstrom 2: Chart Data (Unten)
- **Location:** `EnergyChartsView.jsx` Zeile 302-345
- **Trigger:** `useEffect` bei `timeRange` Änderung
- **Methode:** `getChartData({ periodType: timeRange })`
- **API:** Statistics API (`recorder/statistics_during_period`)
- **Sensor:** NUR `kwhSensor` (Grid Import)
- **Output:** Array von Datenpunkten (Zeit + kWh Wert)

---

## 📈 Chart Data Berechnung (Verbrauch)

### Formel: Differenzmethode

```javascript
// Baseline holen (Wert VOR der Periode)
baselineValue = lastBaseline?.sum || 0

// Für jeden Datenpunkt:
for (let i = 0; i < sensorStats.length; i++) {
  if (i === 0) {
    // Erster Bucket: Differenz vom Baseline
    consumption = (currentSum - baselineValue) / 1000  // Wh → kWh
  } else {
    // Folgende Buckets: Differenz vom vorherigen
    consumption = (currentSum - prevSum) / 1000  // Wh → kWh
  }
}
```

### Beispiel (Tag):

**Annahmen:**
- Baseline (gestern 23:00): 148000 Wh
- Heute 00:00: 150000 Wh
- Heute 01:00: 152500 Wh

**Berechnungen:**
```javascript
00:00: (150000 - 148000) / 1000 = 2.0 kWh
01:00: (152500 - 150000) / 1000 = 2.5 kWh
```

### Perioden-Konfiguration:

| Periode | Zeitraum | Start | End | Aggregation | Chart |
|---------|----------|-------|-----|-------------|-------|
| Tag | Heute 00:00-23:59 | 00:00 Heute | 23:59 Heute | `hour` | Linie |
| Woche | Letzte 7 Tage | 7 Tage zurück | Jetzt | `day` | Balken |
| Monat | Aktueller Monat | 1. des Monats | Letzter des Monats | `day` | Balken |
| Jahr | Vorjahr vs. Aktuell | 1. Jan Vorjahr | 31. Dez Aktuell | `month` | Balken |

---

## ✅ Erfolgreiche Solar Chart Implementation

### Implementation: 10.01.2026 20:45 - 21:30

#### Implementierte Lösungen:

**Option 3: pvTotalSensor in localStorage speichern**
1. ✅ `loadSensorConfig()` erweitert (Zeile 14-28)
   ```javascript
   return {
     gridImportSensor: null,
     kwhSensor: 'sensor.smart_meter_ts_65a_3_bezogene_wirkenergie',
     pvTotalSensor: null  // ✅ NEU
   };
   ```

2. ✅ `updateSensorConfig()` erweitert (Zeile 227-255)
   - Akzeptiert `pvTotalSensor` Parameter
   - Speichert in localStorage
   - Setzt `pv_total_sensor` in attributes

3. ✅ `onMount()` erweitert (Zeile 1172-1184)
   - Lädt `pvTotalSensor` aus localStorage
   - Setzt in attributes für UI-Zugriff

**Option 2: sensorId als direkter Parameter**
4. ✅ `getChartData()` erweitert (Zeile 656, 665)
   ```javascript
   const { hass, periodType = 'day', sensorId } = params || {};
   const kwhSensor = sensorId || config.kwhSensor;  // Frontend übergibt Sensor
   ```

5. ✅ `EnergyChartsView.jsx` angepasst (Zeile 319-328)
   ```javascript
   const sensorId = isSolarView
     ? item.attributes?.pv_total_sensor    // Solar → PV
     : item.attributes?.kwh_sensor;        // Verbrauch → Grid

   const result = await item.actions.getChartData({
     hass: currentHass,
     periodType: timeRange,
     sensorId: sensorId  // ✅ Frontend übergibt richtigen Sensor
   });
   ```

#### Warum es JETZT funktioniert:

1. ✅ **Kein Transpiler-Error:** Frontend macht die Logik, Backend bekommt nur Sensor-ID
2. ✅ **localStorage Sync:** `pvTotalSensor` wird jetzt in localStorage gespeichert
3. ✅ **Fallback-Chain:** `sensorId || config.kwhSensor` garantiert immer einen Wert
4. ✅ **Gleiche Methode:** Differenzmethode funktioniert für beide Sensoren identisch

#### Zusätzliche Verbesserungen:

**UI-Labels angepasst:**
- ~~"Einspeisung"~~ → "Netz" (konsistent in beiden Views)
- ~~"Eigenkonsum"~~ → "Haus" (klarer für Benutzer)

**Performance-Optimierung:**
- Chart rendert nicht mehr alle 2-5 Sekunden
- useEffect Dependencies optimiert:
  - `sensorIds` mit spezifischen Attributen statt `item?.attributes`
  - Live Values nur bei `timeRange` und `isSolarView` Änderung
  - Chart Data nur bei `timeRange`, `isSolarView` und Sensor-Änderung

---

## 🗂️ Sensor-Konfiguration

### localStorage Struktur:
```javascript
energy_dashboard_sensors = {
  gridImportSensor: null,
  kwhSensor: 'sensor.smart_meter_ts_65a_3_bezogene_wirkenergie',
  pvTotalSensor: 'sensor.solarnet_energie_gesamt'  // ✅ NEU: Solar Sensor
}
```

### Attributes Struktur:
```javascript
item.attributes = {
  kwh_sensor: 'sensor.smart_meter_ts_65a_3_bezogene_wirkenergie',
  pv_total_sensor: 'sensor.solarnet_energie_gesamt',  // ← Synchronisiert mit localStorage!
  grid_export_total_sensor: 'sensor.solarnet_leistung_netzeinspeisung',
  battery_charged_sensor: 'sensor.YOUR_BATTERY_CHARGED_SENSOR',
  battery_discharged_sensor: 'sensor.YOUR_BATTERY_DISCHARGED_SENSOR'
}
```

### Wo werden Sensoren gesetzt?

1. **UI Settings:** `EnergyDashboardDeviceView.jsx` (Zeile 552-600)
   - Lädt aus `localStorage`: `energy_${entity.id}_${config.attr}`
   - Setzt in Attributes: `entity.updateAttributes({ [config.attr]: sensorId })`

2. **onMount:** `EnergyDashboardDeviceEntity.js` (Zeile 1172-1184)
   - Lädt aus `loadSensorConfig()`
   - Setzt ALLE Sensoren in Attributes:
     - `kwh_sensor`
     - `pv_total_sensor` ✅ NEU
     - `grid_import_sensor`

3. **updateSensorConfig:** `EnergyDashboardDeviceEntity.js` (Zeile 227-255)
   - Speichert in localStorage
   - Aktualisiert attributes
   - Synchronisiert beide Storage-Systeme

---

## 🎓 Lessons Learned

### 1. **Storage Synchronisation** ✅ GELÖST
- **Problem (vorher):** localStorage und attributes waren nicht synchron
- **Lösung:** `updateSensorConfig()` synchronisiert beide Systeme
- **Implementiert:** `pvTotalSensor` wird in localStorage UND attributes gespeichert

### 2. **Transpiler-Kompatibilität** ✅ GELÖST
- **Problem (vorher):** Ternäre Ausdrücke führten zu `ReferenceError: Cannot access 'b' before initialization`
- **Lösung:** Frontend übergibt `sensorId` direkt, Backend bekommt nur String-Parameter
- **Vorteil:** Keine komplexe Logik im Backend, einfacher zu debuggen

### 3. **Performance-Optimierung** ✅ IMPLEMENTIERT
- **Problem (vorher):** Chart renderte alle 2-5 Sekunden
- **Grund:** `item` Objekt ändert sich bei jedem Hass-Update
- **Lösung:** Dependencies spezifisch definieren (`timeRange`, `isSolarView`, individuelle Sensor-IDs)
- **Resultat:** Chart rendert nur noch bei relevanten Änderungen

### 4. **Architektur-Entscheidung**
- **Option 1 (Separate Funktionen):** Abgelehnt - zu viel Code-Duplikation
- **Option 2 (sensorId Parameter):** ✅ Implementiert - flexibel, einfach
- **Option 3 (localStorage erweitern):** ✅ Implementiert - notwendig für Persistenz
- **Kombination:** Beste Lösung für Stabilität und Wartbarkeit

---

## 📝 Code-Referenz

### Wichtige Dateien und Zeilen:

**Backend:**
- `loadSensorConfig()`: Zeile 14-28
- `saveSensorConfig()`: Zeile 34-41
- `updateSensorConfig()`: Zeile 227-255
- `getChartData()`: Zeile 655-907
- `onMount()`: Zeile 1161-1186

**Frontend:**
- Live Values Berechnung: Zeile 138-292
- Chart Data Fetching: Zeile 302-359
- Sensor-Auswahl: Zeile 319-321
- Labels: Zeile 823-854

---

## 📝 Testing-Checkliste

### Verbrauch Tab:
- ✅ Live Values zeigen Grid, Solar, Battery
- ✅ Chart zeigt Grid Import Verbrauch
- ✅ Tag/Woche/Monat/Jahr Perioden funktionieren
- ✅ Labels: "Netz", "Solar", "Batterie"

### Solar Tab:
- ✅ Live Values zeigen Grid Export, Self Consumption, Battery
- ✅ Chart zeigt PV Production
- ✅ Tag/Woche/Monat/Jahr Perioden funktionieren
- ✅ Labels: "Netz", "Haus", "Batterie"

### Performance:
- ✅ Chart rendert nicht mehr ständig
- ✅ Nur bei timeRange/View-Änderung
- ✅ Keine Transpiler-Errors

---

## 📝 Mögliche zukünftige Erweiterungen

### Feature-Ideen:

1. **Nettonutzung Tab:**
   - Chart zeigt Differenz (Verbrauch - PV Production)
   - Live Values: Bezug vom Netz vs. Einspeisung
   - Gleiche `sensorId` Parameter-Logik

2. **Energieunabhängigkeit Tab:**
   - Autarkie-Grad berechnen: `(PV / Verbrauch) * 100`
   - Historische Trends
   - Jahresvergleiche

3. **Battery Integration:**
   - Eigener Tab für Batteriestatistiken
   - Lade-/Entladezyklen
   - Speichereffizienz

4. **Stacked Charts:**
   - Multi-Sensor Charts (Grid + Solar + Battery)
   - Datenquelle-Breakdown
   - ApexCharts Integration für komplexe Visualisierungen

---

## 🏗️ Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────┐
│ EnergyChartsView.jsx                                    │
│                                                         │
│  ┌──────────────────┐        ┌──────────────────┐     │
│  │ Live Values      │        │ Chart Data       │     │
│  │ (useEffect #1)   │        │ (useEffect #2)   │     │
│  └────────┬─────────┘        └────────┬─────────┘     │
│           │                           │               │
│           ▼                           ▼               │
│  ┌──────────────────┐        ┌──────────────────┐     │
│  │ getPeriodEnergy  │        │ getChartData     │     │
│  │ (MEHRERE Sens.)  │        │ (sensorId param) │     │
│  └────────┬─────────┘        └────────┬─────────┘     │
└───────────┼──────────────────────────┼───────────────┘
            │                          │
            ▼                          ▼
┌───────────────────────────────────────────────────────┐
│ Statistics API                                        │
│ recorder/statistics_during_period                     │
│                                                       │
│ ┌─────────┐  ┌─────────┐  ┌─────────┐               │
│ │ Grid    │  │ Solar   │  │ Battery │               │
│ │ Import  │  │ PV      │  │ Chg/Dis │               │
│ └─────────┘  └─────────┘  └─────────┘               │
└───────────────────────────────────────────────────────┘
```

---

## 📚 Formeln-Referenz

### Live Values Berechnung:

#### Verbrauch View:
```javascript
totalConsumption = gridConsumption + solarSelfConsumption + batteryConsumption

where:
  gridConsumption = (kwh_last - kwh_first) / 1000
  pvProduction = (pv_total_last - pv_total_first) / 1000
  gridExport = (grid_export_last - grid_export_first) / 1000
  batteryDischarged = (battery_discharged_last - battery_discharged_first) / 1000
  batteryCharged = (battery_charged_last - battery_charged_first) / 1000

  solarSelfConsumption = MAX(0, pvProduction - gridExport)
  batteryConsumption = MAX(0, batteryDischarged - batteryCharged)
```

#### Solar View:
```javascript
totalSolarProduction = pvProduction

where:
  gridExport = Einspeisung ins Netz
  solarSelfConsumption = pvProduction - gridExport (Eigenkonsum)
  batteryCharged = Batterie Ladung
```

### Chart Data Berechnung:

```javascript
// Für jeden Datenpunkt:
consumption[i] = {
  if i == 0:
    (currentSum - baselineValue) / 1000
  else:
    (currentSum - prevSum) / 1000
}

where:
  baselineValue = letzter Wert VOR der Periode
  currentSum = kumulativer Wert zum Zeitpunkt i
  prevSum = kumulativer Wert zum Zeitpunkt i-1
```

---

## ✅ Status & Design-Entscheidungen

### 1. Solar Chart ✅ IMPLEMENTIERT
- **Status:** ✅ Funktioniert seit 10.01.2026 21:30
- **Implementation:** Option 2 (sensorId Parameter) + Option 3 (localStorage)
- **Charts:** Verbrauch zeigt Grid Import, Solar zeigt PV Production

### 2. Chart-Typen (By Design)
- **Verbrauch Chart:** Zeigt nur Grid Import (nicht gestackt)
- **Solar Chart:** Zeigt nur PV Production (nicht gestackt)
- **Grund:** Einfache, klare Visualisierung pro View
- **Alternative:** Stacked Charts würden Komplexität erhöhen

### 3. Year View (By Design)
- **Zeigt:** 2 Balken (Vorjahr vs. Aktuelles Jahr Vergleich)
- **Nicht:** 12 Balken (Jan-Dez Verlauf)
- **Grund:** Jahr-über-Jahr Vergleich ist aussagekräftiger als Monatsverlauf

### 4. Performance
- **Re-Rendering:** Optimiert - Chart rendert nur bei relevanten Änderungen
- **Dependencies:** Spezifisch definiert (nicht mehr `item?.attributes`)
- **Trigger:** Nur bei `timeRange`, `isSolarView` oder Sensor-Änderung

---

## 📝 Nächste mögliche Erweiterungen

1. **Stacked Charts:** Grid + Solar + Battery in einem Chart
2. **Monatsverlauf für Jahr:** 12 Balken (Jan-Dez) statt Jahresvergleich
3. **Export-Funktionalität:** CSV/PDF Export der Chart-Daten
4. **Kosten-Tracking:** Integration von Strompreisen für Kostenberechnung

---

**Dokumentation Ende**
