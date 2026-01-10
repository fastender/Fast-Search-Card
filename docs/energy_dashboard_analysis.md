# Energy Dashboard Analysis

## Overview

The Energy Dashboard is a specialized "System Entity" designed to replicate the native Home Assistant energy dashboard functionality within the Fast Search Card interface. It demonstrates the flexibility of the System Entity Framework by wrapping complex data aggregation logic into a standard Entity interface.

## Architecture

*   **Type**: Integration / Device Entity
*   **Base Class**: `EnergyDashboardDeviceEntity` extends `SystemEntity`
*   **Domain**: `energy_dashboard` (Virtual)

### 1. Backend Logic: `EnergyDashboardDeviceEntity.js`

This file contains the core intelligence. Unlike a standard sensor, it is "active":

*   **Data Aggregation**: It implements the logic to fetch historical data from Home Assistant's `recorder` or `history` APIs.
*   **Time Management**: It handles the logic for different time periods (`day`, `week`, `month`, `year`).
*   **Granularity**: It calculates the correct data grouping (e.g., hourly for 'day' view, daily for 'month' view).
*   **API Interaction**:
    *   `executeAction('getEnergyData')`: The main entry point for the UI to request data.
    *   `_fetchHistory`: Retrieves raw state changes.
    *   `_aggregateHistory`: Converts raw data into the necessary structure for charts (buckets).

### 2. UI Visualization: `EnergyChartsView.jsx`

This is the primary specific view for the Energy Dashboard.

*   **Components**:
    *   **Donut Chart / Stats**: Displays the real-time split between Solar, Grid, and Battery.
    *   **Bar Chart**: Renders the historical consumption/production data (using `chart.js` likely, though logic is internal).
    *   **Energy Flow Animation**: (Implied/Planned) Visual representation of current power flow.
*   **State**: It consumes the data provided by the `EnergyDashboardDeviceEntity`.

### 3. Setup Flow: `EnergyDashboardSetup.jsx`

*   A specific setup wizard that helps the user "install" the dashboard.
*   It checks `energy_prefs` (Home Assistant Energy Preferences) to automatically configure sources (Grid, Solar, Battery). This is a "smart" setup that requires zero configuration if HA is already set up.

## Critical Findings & Issues

While the core logic and the main Chart View are implemented specifically for Energy, the **Tab Views appear to be invalid copy-pastes**:

> [!WARNING]
> **Placeholder Code Detected in Tabs**
> The files `EnergyOverviewTab.jsx`, `EnergyDiagnosticsTab.jsx`, and likely `EnergyControlsTab.jsx` contain code copied directly from the **3D Printer integration**.
> *   They reference "Nozzle", "Bed Temp", "Filament", and "Bambu Studio".
> *   They will likely display incorrect labels or "Unavailable" data when rendered for the Energy Dashboard.

## Recommendations

1.  **Refactor Tabs**: The Tabs should be rewritten to show relevant Energy data (e.g., "Overview" could show the flow diagram, "Diagnostics" could show sensor health/last update times).
2.  **Verify Data Flow**: Ensure the `EnergyDashboardDeviceEntity` correctly passes `energy_prefs` and real-time sensor values to `EnergyChartsView`.
3.  **Optimize Fetching**: The `getEnergyData` action is heavy; ensure it caches results or only fetches when the time period changes.

## Dynamic View Logic

The dashboard supports four distinct time views (`day`, `week`, `month`, `year`). The application logic dynamically handles data granularity and aggregation for each.

### 1. View Selection & Interaction
**Component:** `EnergyChartsView.jsx`
*   **Selector**: A segmented control allows the user to switch between `day`, `week`, `month`, `year`.
*   **State**: The `timeRange` state triggers a `useEffect` hook.
*   **Action**: This calls `item.actions.getChartData({ periodType: timeRange })` on the entity.

### 2. Data Calculation (`EnergyDashboardDeviceEntity.js`)
The `getChartData` method performs complex aggregation to display consumption (`kWh`) over time. It relies on the **Statistics API** (`recorder/statistics_during_period`) which is much faster than raw history.

#### **Period Handling:**

| Period | Granularity | Start Time | End Time | Chart Type |
| :--- | :--- | :--- | :--- | :--- |
| **Day** | `hour` | 00:00 Today | 23:59 Today | Line |
| **Week** | `day` | 7 days ago | Now | Bar |
| **Month** | `day` | 1st of Month | Last day of Month | Bar |
| **Year** | `month` | Jan 1st (Prev Year) | Dec 31st (Curr Year) | Bar (Comparison) |

#### **The "Baseline" Logic:**
To calculate accurate consumption for the *first* bucket of any period (e.g., the first hour of the day), the system fetches a **baseline value** from the *previous* period.
*   *Formula*: `Consumption = Current_Sum - Baseline_Sum`
*   This ensures that if the day starts at 1000kWh, and at 01:00 it's 1001kWh, the chart correctly shows 1kWh instead of 1001kWh.

#### **Special Handling: 'Year' View**
The Year view is unique. It does not show a simple 12-month bar chart.
*   **Comparison**: It compares the **current year vs. previous year**.
*   **Logic**: It fetches the total consumption for the previous year (Jan 1 - Dec 31) and the current year (Jan 1 - Now).
*   **Output**: The chart displays just two large bars: "2025" and "2026", allowing for a quick YoY usage comparison.

### 3. Real-Time Status
While the detailed chart shows historical data, the "Donut" and Top Bar show **live** power flow.
*   **Live Values**: `grid`, `solar`, `battery`.
*   **Calculation**:
    *   **Value**: Raw W/kW from sensors.
    *   **Percentage**: Calculated relative to total consumption.
    *   **Unit**: Dynamically formatted (W < 1000, kW > 1000).
*   **Updates**: Polled every ~5 seconds internally or pushed via WebSocket subscriptions.

## Formulas & Calculation

The dashboard converts raw sensor data into the display values using the following logic found in `EnergyChartsView.jsx`.

### 1. Raw Data Retrieval
Data is fetched via the Home Assistant Statistics API. The system automatically detects the sensor type:
*   **Cumulative Sensors (Lifetime):** `Value = Last_Stat - First_Stat` (Delta)
*   **Daily Reset Sensors:**
    *   *Day View:* `Value = Last_Stat`
    *   *Week/Month/Year:* `Value = SUM(Daily_Max_Values)` (Sums up the total of each day)

### 2. Derived Values
The displayed values are calculated from five core sensors:
1.  **Grid Import** (`kwhSensor`)
2.  **PV Production** (`pv_daily_sensor`)
3.  **Grid Export** (`grid_export_sensor`)
4.  **Battery Discharged** (`battery_discharged_sensor`)
5.  **Battery Charged** (`battery_charged_sensor`)

#### **The Formulas:**

| Type | Formula | Description |
| :--- | :--- | :--- |
| **Grid Consumption** | `Grid Import` | Direct sensor value |
| **Solar Consumption** | `MAX(0, PV Production - Grid Export)` | Calculates "Self-Consumption" (what you kept) |
| **Battery Consumption** | `MAX(0, Battery Discharged - Battery Charged)` | Net contribution to the house |
| **Total Consumption** | *Complex Aggregate* | Sum of all sources consumed by the house |

#### Calculation in Day View (Total)
The "Total" value shown in the **Day View Chart** and the main summary is calculated strictly from the **Grid Import Sensor** (`kwhSensor`).
*   **Formula**: `Consumption = Current_Sum - Baseline_Sum`
*   **Granularity**: Hourly buckets (00:00 to 23:59).
*   **Important**: The historical chart *does not* mathematically add Solar or Battery values to this line. It assumes the configured `kwhSensor` represents the consumption you want to track (often Grid Import). If you want "True House Consumption" (Grid + Solar), you must configure a specific sensor for that in Home Assistant and select it as the main `kwhSensor`.

### 3. Percentages
All percentages are calculated relative to the **Total Consumption** of the house.
*   **Grid %** = `(Grid Consumption / Total Consumption) * 100`
*   **Solar %** = `(Solar Consumption / Total Consumption) * 100`
*   **Battery %** = `(Battery Consumption / Total Consumption) * 100`

## Known Issues & Limitations

> [!WARNING]
> **Missing Solar/Battery Data in Historical Charts**
> The Week, Month, and Year charts currently **only show the Grid Import value**.
> *   **Reason**: The `getChartData` function in `EnergyDashboardDeviceEntity.js` is hardcoded to fetch only the `kwhSensor`. It does not iterate over Solar or Battery sensors to build a stacked chart.
> *   **Effect**: Solar and Battery values are effectively **0** in all historical views, even if they show up correctly in the "Live" daily view.
