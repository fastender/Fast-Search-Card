# System Entity Framework Analysis

## Overview

The **System Entity Framework** is the backbone of the Fast Search Card's internal architecture. It provides a unified abstraction layer that allows the application to treat internal features (like Settings, Plugin Store), complex integrations (like the Energy Dashboard), and standard Home Assistant entities identically within the UI.

This unification allows UI components like `DeviceCard` and `DetailView` to be highly reusable, as they interface with a standardized "Entity" API regardless of the data source.

## Architecture

### 1. Base Class: `SystemEntity`
**Location:** `src/system-entities/base/SystemEntity.js`

The `SystemEntity` class is the foundation for all internal entities. It enforces a standard structure that mimics Home Assistant entities while adding application-specific capabilities.

#### Key Features:
-   **Identity**: Properties like `id`, `domain`, `name`, and `icon`.
-   **HA Compatibility**: The `toEntity()` method transforms the internal state into a Home Assistant-compatible object (e.g., `system.settings` or `plugin.my_plugin`), allowing seamless integration with the `DataProvider`.
-   **Lifecycle Management**:
    -   `onMount(context)`: Called when the entity is activated/registered. Used for setting up creating listeners or initializing internal state.
    -   `onUnmount()`: Cleanup method for removing listeners and freeing resources.
-   **Persistence**: Built-in `_storage` wrapper providing namespaced `localStorage` access for each entity.
-   **Lazy Loading**: The `viewComponent` property supports dynamic imports (functions returning promises) to ensure code for complex views is only loaded when needed.

### 2. The Registry: `SystemEntityRegistry`
**Location:** `src/system-entities/registry.js`

A Singleton instance (`systemRegistry`) acts as the central repository/source of truth.
-   It manages the registering and unregistering of entities.
-   It handles the `onMount` lifecycle calls during initialization.
-   It provides helper methods for the `DataProvider` to retrieve all available internal entities.

### 3. Initialization Flow
**Location:** `src/system-entities/initialization.js`

1.  **Bootstrapping**: The app starts and imports the `knownEntities` list.
2.  **Registration**: Factory functions or instances are passed to the Registry.
3.  **Discovery**:
    -   **Core Entities**: Hardcoded (e.g., Settings) are registered immediately.
    -   **Feature Entities**: Intelligent entities (like Weather) scan the Home Assistant state (`hass.states`) during `onMount` to auto-configure themselves (e.g., binding to `weather.home`).
    -   **Device Entities**: Loaded from `localStorage` configuration via the `DeviceEntityFactory`.

## Entity Types

### 1. Core Entities
Simple wrappers for internal application routes.
*   **Examples**: `system.settings`, `system.pluginstore`
*   **Purpose**: Provide entry points to static views (Settings, Store) searchable via the main search bar.

### 2. Feature Entities
"Smart" entities that encapsulate logic for specific domains.
*   **Example**: `WeatherEntity` (`src/system-entities/entities/weather`)
*   **Behavior**:
    *   It's a Singleton `weatherEntity`.
    *   On `onMount`, it finds the most relevant real Home Assistant weather entity (`weather.*`).
    *   It acts as a proxy, enhancing the standard HA data with app-specific logic or UI view components.

### 3. Integration / Device Entities
The most complex type, representing "Virtual Devices" constructed by the app.
*   **Location**: `src/system-entities/entities/integration/device-entities/`
*   **Factory**: `DeviceEntityFactory.js` creates instances based on user configuration.
*   **Example: Energy Dashboard** (`EnergyDashboardDeviceEntity.js`)
    *   **Not just state**: It holds logic for calculating energy consumption over time.
    *   **Data Handling**: It manages its own data fetching via `executeAction` calls (accessing HA WebSocket APIs).
    *   **Time Awareness**: It handles granularity (day/week/month/year) internally, decoupling the UI from the raw data logic.

## Key Files Structure

```text
src/system-entities/
├── base/
│   └── SystemEntity.js             # Base Class
├── registry.js                     # Central Registry (Singleton)
├── initialization.js               # Bootstrap logic
├── entities/
│   ├── integration/
│   │   └── device-entities/        # Complex Device Implementations
│   │       ├── DeviceEntityFactory.js
│   │       ├── EnergyDashboardDeviceEntity.js
│   │       └── ...
│   ├── weather/                    # Weather Feature Implementation
│   ├── news/                       # News Feature Implementation
│   └── ...
└── utils/
    └── SystemEntityLoader.js       # Helper for loading resources
```

## Conclusion

The System Entity Framework is a powerful abstraction that decouples the UI from the underlying data source. By mocking the Home Assistant Entity interface, it allows "Fast Search Card" to extend its capabilities beyond simple HA control, enabling rich, custom applications (like a complete Energy Dashboard or 3D Printer management) to live natively within the same consistent user interface.
