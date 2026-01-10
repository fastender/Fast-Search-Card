# Home Assistant Energy Statistics API

## Dokumentation der Statistik-Abfrage aus dem Energy Dashboard

Diese Dokumentation beschreibt, wie das Energy Dashboard Statistik-Werte von Home Assistant in 5-Minuten-Intervallen abgerufen hat.

---

## 1. WebSocket API Calls

### 1.1 Energy Preferences abrufen

```javascript
async function getEnergyPreferences(hass) {
  if (!hass || !hass.connection) {
    return null;
  }

  try {
    const result = await hass.connection.sendMessagePromise({
      type: 'energy/get_prefs'
    });
    return result;
  } catch (error) {
    console.error('Failed to get energy preferences:', error);
    return null;
  }
}
```

**Rückgabe-Struktur:**
```javascript
{
  energy_sources: [
    {
      type: 'grid',
      flow_from: [{ stat_energy_from: 'sensor.grid_import' }],
      flow_to: [{ stat_energy_to: 'sensor.grid_export' }]
    },
    {
      type: 'solar',
      stat_energy_from: 'sensor.solar_production'
    },
    {
      type: 'battery',
      stat_energy_from: 'sensor.battery_discharge',
      stat_energy_to: 'sensor.battery_charge'
    }
  ]
}
```

---

### 1.2 Statistiken für Zeitraum abrufen (5-Minuten-Intervalle)

```javascript
async function getStatisticsDuringPeriod(hass, statisticIds, startTime, endTime, period = '5minute') {
  if (!hass || !hass.connection) {
    return null;
  }

  try {
    const result = await hass.connection.sendMessagePromise({
      type: 'recorder/statistics_during_period',
      statistic_ids: statisticIds,
      start_time: startTime,
      end_time: endTime,
      period: period,
      types: ['sum', 'state']
    });

    return result;
  } catch (error) {
    console.error('Failed to get statistics:', error);
    return null;
  }
}
```

**Parameter:**
- `statistic_ids`: Array von Sensor-IDs (z.B. `['sensor.grid_import', 'sensor.solar_production']`)
- `start_time`: ISO String (z.B. `'2026-01-05T00:00:00.000Z'`)
- `end_time`: ISO String (z.B. `'2026-01-05T18:30:00.000Z'`)
- `period`: `'5minute'`, `'hour'`, `'day'`, `'week'`, `'month'`
- `types`: `['sum', 'state']`

**Rückgabe-Struktur:**
```javascript
{
  'sensor.grid_import': [
    { start: '2026-01-05T00:00:00Z', state: 12345.67, sum: 12345.67 },
    { start: '2026-01-05T00:05:00Z', state: 12346.89, sum: 12346.89 },
    // ... alle 5 Minuten
  ],
  'sensor.solar_production': [
    { start: '2026-01-05T00:00:00Z', state: 5678.90, sum: 5678.90 },
    // ...
  ]
}
```

---

## 2. Heutige Energie-Werte berechnen

### 2.1 Berechnung für total_increasing Sensoren

```javascript
function calculateTodayEnergy(statistics, currentLiveValue = null) {
  if (!statistics || statistics.length === 0) {
    return 0;
  }

  // Filter out null/undefined values
  const validStats = statistics.filter(s => s.state !== null && s.state !== undefined);

  if (validStats.length === 0) {
    return 0;
  }

  // Get the sensor value at midnight (start of day)
  const firstMidnightState = validStats[0].state;

  // If we have a current live value, use it for the most accurate calculation
  // This includes the current incomplete hour
  if (currentLiveValue !== null && currentLiveValue !== undefined) {
    const delta = currentLiveValue - firstMidnightState;
    return Math.max(0, delta); // Ensure non-negative
  }

  // Fallback: use the last statistics value
  const lastState = validStats[validStats.length - 1].state;
  const delta = lastState - firstMidnightState;
  return Math.max(0, delta); // Ensure non-negative
}
```

**Wichtig:**
- Sensoren sind `total_increasing` (kumulativ)
- Heutiger Verbrauch = Aktueller Wert - Wert um Mitternacht
- Wenn Live-Wert verfügbar: Nutze diesen für höchste Genauigkeit
- Sonst: Nutze letzten Statistik-Wert

---

## 3. Komplettes Beispiel: Heute's Grid Import

```javascript
async function getTodayGridImport(hass, prefs) {
  // 1. Get sensor ID from preferences
  const gridSource = prefs.energy_sources?.find(s => s.type === 'grid');
  const sensorId = gridSource?.flow_from?.[0]?.stat_energy_from;

  if (!sensorId) return 0;

  // 2. Calculate time range (today 00:00 - now)
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startTime = todayStart.toISOString();
  const endTime = now.toISOString();

  // 3. Fetch 5-minute statistics
  const statistics = await getStatisticsDuringPeriod(
    hass,
    [sensorId],
    startTime,
    endTime,
    '5minute'
  );

  // 4. Get current live sensor value
  const currentLiveValue = parseFloat(hass.states[sensorId]?.state);

  // 5. Calculate today's consumption
  const statData = statistics[sensorId];
  const todayWh = calculateTodayEnergy(statData, currentLiveValue);
  const todayKWh = todayWh / 1000;

  return todayKWh;
}
```

---

## 4. Update-Strategie (Original)

### 4.1 Initiales Laden (beim onMount)

```javascript
async onMount(context) {
  // 1. Lade Energy Preferences
  await this.executeAction('loadEnergyPrefs', { hass: context.hass });

  // 2. Lade Live-Werte (Sensor-States direkt)
  await this.executeAction('updateLiveValues', { hass: context.hass });

  // 3. Lade Statistiken (5-Minuten-Daten)
  await this.executeAction('updateTodayStatistics', { hass: context.hass });

  // 4. Auto-Updates (OPTIONAL - kann deaktiviert werden)
  // Live-Werte: Alle 60s
  this._updateInterval = setInterval(async () => {
    await this.executeAction('updateLiveValues', { hass: this._hass });
  }, 60000);

  // Statistiken: Alle 5 Minuten
  this._statisticsInterval = setInterval(async () => {
    await this.executeAction('updateTodayStatistics', { hass: this._hass });
  }, 300000);
}
```

---

## 5. Sensor-ID Schema (Beispiel für BambuLab-ähnliche Struktur)

Falls du später ein ähnliches System für andere Geräte brauchst:

```javascript
const buildEntityId = (deviceType, serial, sensorType) => {
  return `sensor.${deviceType}_${serial}_${sensorType}`;
};

// Beispiel:
const gridImportSensor = buildEntityId('grid', 'main', 'import_energy');
// → sensor.grid_main_import_energy
```

---

## 6. Performance-Optimierung

### 6.1 Batch-Abfrage aller Sensoren

```javascript
// Sammle alle Sensor-IDs
const statisticIds = [];
const statisticMap = {};

// Grid
if (gridSource) {
  const id = gridSource.flow_from[0].stat_energy_from;
  statisticIds.push(id);
  statisticMap[id] = 'grid_import';
}

// Solar
if (solarSource) {
  const id = solarSource.stat_energy_from;
  statisticIds.push(id);
  statisticMap[id] = 'solar';
}

// Einmalige Abfrage für ALLE Sensoren
const statistics = await getStatisticsDuringPeriod(
  hass,
  statisticIds,
  startTime,
  endTime,
  '5minute'
);

// Verarbeite alle Ergebnisse
Object.keys(statistics).forEach(statId => {
  const type = statisticMap[statId];
  const todayValue = calculateTodayEnergy(statistics[statId], liveValues[statId]);
  // ...
});
```

---

## 7. Wichtige Erkenntnisse

1. **WebSocket API** ist der Schlüssel - nicht REST
2. **5-Minuten-Intervalle** sind optimal für Energie-Daten
3. **total_increasing** Sensoren: Differenz berechnen, nicht Summe
4. **Live-Werte** mit Statistik kombinieren für höchste Genauigkeit
5. **Batch-Abfragen** sind performanter als einzelne Requests
6. **ISO String Format** für Zeitstempel verwenden

---

## 8. Fehlervermeidung

### Problem: Statistik-Werte fehlen
```javascript
if (!statistics || statistics.length === 0) {
  // Fallback auf Live-Sensor-Wert
  const currentValue = parseFloat(hass.states[sensorId]?.state);
  return currentValue || 0;
}
```

### Problem: Negative Werte
```javascript
const delta = currentValue - midnightValue;
return Math.max(0, delta); // Negative Werte vermeiden
```

### Problem: null/undefined States
```javascript
const validStats = statistics.filter(s =>
  s.state !== null && s.state !== undefined
);
```

---

## Ende der Dokumentation

Diese Logik kann für zukünftige Implementierungen wiederverwendet werden:
- Printer-Statistiken (Filament-Verbrauch über Zeit)
- Licht-Nutzung (Brenndauer-Statistiken)
- Klima-Daten (Temperatur-Verläufe)
- Etc.
