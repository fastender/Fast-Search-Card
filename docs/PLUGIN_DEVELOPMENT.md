# System-Entity Framework - Universal Integration Guide

## 🎯 Übersicht

Das System-Entity Framework ermöglicht es, neue System-Entities (wie Settings, Marketplace, Zeitpläne) **universell** zu erstellen, ohne hardcoded Checks in UI-Komponenten hinzufügen zu müssen.

**Vorher (❌ Hardcoded):**
```javascript
// DetailView.jsx
if (item.domain === 'settings' || 
    item.domain === 'marketplace' || 
    item.domain === 'all_schedules' ||
    item.domain === 'pluginstore') {
  // ...
}

// DeviceCard.jsx  
if (device.domain === 'settings' || 
    device.domain === 'marketplace' || 
    device.domain === 'all_schedules' ||
    device.domain === 'pluginstore') {
  // ...
}
```

**Nachher (✅ Universal):**
```javascript
// DetailView.jsx
if (systemRegistry.isSystemEntity(item.domain)) {
  // Automatisch!
}

// DeviceCard.jsx
if (systemRegistry.isSystemEntity(device.domain)) {
  // Automatisch!
}
```

---

## 📋 Architektur

### System-Entity Properties

Jede System-Entity hat folgende **UI Behavior Properties**:

| Property | Typ | Default | Beschreibung |
|----------|-----|---------|--------------|
| `hasTabs` | boolean | `false` | Hat die Entity Tabs in der DetailView? |
| `hasCustomView` | boolean | `true` | Rendert die Entity eine eigene View-Komponente? |
| `showInDetailView` | boolean | `true` | Soll die Entity in der DetailView geöffnet werden? |

### Registry Helper-Methoden

Die `systemRegistry` bietet folgende Methoden:
```javascript
// Prüfe ob Domain eine System-Entity ist
systemRegistry.isSystemEntity(domain: string): boolean

// Prüfe ob System-Entity Tabs hat
systemRegistry.hasTabs(domain: string): boolean

// Prüfe ob System-Entity Custom View hat
systemRegistry.hasCustomView(domain: string): boolean

// Prüfe ob in DetailView geöffnet werden soll
systemRegistry.shouldShowInDetailView(domain: string): boolean
```

---

## 🚀 Neue System-Entity erstellen

### Schritt 1: Entity-Datei erstellen

**Datei:** `src/system-entities/entities/[name]/index.js`
```javascript
import { SystemEntity } from '../../base/SystemEntity.js';

class MyCustomEntity extends SystemEntity {
  constructor() {
    super({
      // Core Properties
      id: 'my_custom',
      domain: 'my_custom',
      name: 'Meine Entity',
      icon: 'mdi:star',
      category: 'system',
      description: 'Beschreibung der Entity',
      relevance: 90,
      
      // 🆕 UI Behavior Properties
      hasTabs: false,          // KEINE Tabs (eigene View)
      hasCustomView: true,     // Rendert eigene View
      showInDetailView: true,  // In DetailView öffnen
      
      // View Component (Lazy Load)
      viewComponent: () => import('./MyCustomView.jsx')
    });
  }
}

export default new MyCustomEntity();
```

### Schritt 2: View-Komponente erstellen

**Datei:** `src/system-entities/entities/[name]/MyCustomView.jsx`
```javascript
import { h } from 'preact';

export default function MyCustomView({ 
  entity, 
  hass, 
  lang, 
  onBack,
  onNavigate,
  onServiceCall 
}) {
  return (
    <div className="my-custom-view">
      <h1>{entity.name}</h1>
      <p>{entity.description}</p>
      
      {/* Deine UI hier */}
    </div>
  );
}
```

### Schritt 3: In Registry registrieren

**Datei:** `src/system-entities/registry.js`

Füge den Import in `autoDiscover()` hinzu:
```javascript
async autoDiscover() {
  console.log('🔍 Auto-discovering system entities...');
  
  const knownEntities = [
    () => import('./entities/settings/index.js'),
    () => import('./entities/marketplace/index.js'),
    () => import('./entities/pluginstore/index.js'),
    () => import('./entities/all-schedules/index.js'),
    () => import('./entities/my-custom/index.js'),  // 🆕 HIER HINZUFÜGEN!
  ];
  
  // ...
}
```

### Schritt 4: **FERTIG!** ✅

Die Entity ist jetzt automatisch integriert in:
- ✅ **DetailView** - erkennt automatisch System-Entity
- ✅ **DeviceCard** - zeigt korrektes Icon und Layout
- ✅ **SearchField** - erscheint in Suchergebnissen
- ✅ **DataProvider** - wird in Entity-Liste geladen

**KEINE weiteren Änderungen nötig!** 🎉

---

## 🎨 Konfigurationsbeispiele

### Beispiel 1: Entity OHNE Tabs (Standard)
```javascript
// z.B. Zeitpläne-Übersicht, Marketplace, PluginStore
super({
  id: 'all_schedules',
  domain: 'all_schedules',
  name: 'Zeitpläne Übersicht',
  icon: 'mdi:calendar-clock',
  category: 'system',
  relevance: 95,
  
  hasTabs: false,          // ✅ KEINE Tabs
  hasCustomView: true,     // ✅ Eigene View
  showInDetailView: true,  // ✅ In DetailView öffnen
  
  viewComponent: () => import('./AllSchedulesView.jsx')
});
```

**Ergebnis:**
- DetailView rendert die `AllSchedulesView` direkt
- Keine Tab-Leiste wird angezeigt
- View hat volle Kontrolle über Layout

---

### Beispiel 2: Entity MIT Tabs (Special Case)
```javascript
// z.B. Settings
super({
  id: 'settings',
  domain: 'settings',
  name: 'Einstellungen',
  icon: 'mdi:cog',
  category: 'system',
  relevance: 100,
  
  hasTabs: true,           // ✅ HAT Tabs
  hasCustomView: false,    // ✅ Nutzt alte SettingsTab
  showInDetailView: true,  // ✅ In DetailView öffnen
  
  viewComponent: () => import('./SettingsView.jsx')
});
```

**Ergebnis:**
- DetailView zeigt Tab-Leiste (About, Appearance, etc.)
- Settings-Komponente verwaltet Tabs intern
- Tab-Clicks ändern Content korrekt

---

### Beispiel 3: Entity die NICHT in DetailView öffnet
```javascript
// z.B. Quick-Action Entity
super({
  id: 'quick_action',
  domain: 'quick_action',
  name: 'Quick Action',
  icon: 'mdi:lightning-bolt',
  category: 'tools',
  relevance: 85,
  
  hasTabs: false,
  hasCustomView: true,
  showInDetailView: false,  // ❌ NICHT in DetailView öffnen
  
  // Keine viewComponent - führt direkt Action aus
  actions: {
    execute: async function() {
      // Action-Code hier
    }
  }
});
```

**Ergebnis:**
- Click auf Entity öffnet KEINE DetailView
- Führt stattdessen direkt eine Action aus
- Nützlich für Shortcuts/Quick-Actions

---

## 🔧 Technische Details

### DetailView Integration

**Datei:** `src/components/DetailView.jsx`
```javascript
const renderTabContent = () => {
  // Special Case: Settings wird separat behandelt
  if (item.domain === 'settings') {
    return (
      <SettingsTab 
        settingsRef={settingsTabRef}
        lang={lang}
        onTabChange={(newTab) => {}}
      />
    );
  }
  
  // Universal: System-Entity Check via Registry
  const isSystemEntity = item.is_system || 
                         item.is_plugin || 
                         systemRegistry.isSystemEntity(item.domain);
  
  if (isSystemEntity) {
    const SystemViewComponent = systemRegistry.getViewComponent(item.domain);
    
    if (SystemViewComponent) {
      if (typeof SystemViewComponent === 'function') {
        return (
          <SystemEntityLazyView
            viewLoader={SystemViewComponent}
            entity={item}
            hass={hass}
            lang={lang}
            onBack={handleBackClick}
            onNavigate={onActionNavigate}
            onServiceCall={onServiceCall}
          />
        );
      }
    }
  }
  
  // Normal Entities (Lights, Sensors, etc.)
  // ...
};
```

### Tab-Handling
```javascript
const getFilteredTabIcons = () => {
  // Settings behält Tabs
  if (item.domain === 'settings') {
    return settingsTabIcons;
  }
  
  // Universal: Prüfe via Registry ob Entity Tabs haben soll
  if (systemRegistry.isSystemEntity(item.domain)) {
    const hasTabs = systemRegistry.hasTabs(item.domain);
    if (!hasTabs) {
      return []; // System-Entity ohne Tabs
    }
  }
  
  // Sensors haben 3 Tabs
  if (item.domain === 'sensor' || item.domain === 'binary_sensor') {
    return [tabIcons[0], tabIcons[2], tabIcons[3]];
  }
  
  // Standard: 4 Tabs
  return tabIcons;
};
```

### DeviceCard Integration

**Datei:** `src/components/DeviceCard.jsx`
```javascript
const getDisplayState = () => {
  // Universal: System-Entities haben keine Status-Anzeige
  if (device.is_system || systemRegistry.isSystemEntity(device.domain)) {
    return '';
  }
  
  // Normal Entities zeigen Status
  // ...
};
```

---

## 📊 Bestehende System-Entities

| Entity | Domain | hasTabs | hasCustomView | Beschreibung |
|--------|--------|---------|---------------|--------------|
| **Settings** | `settings` | ✅ `true` | ❌ `false` | System-Einstellungen mit Tabs (About, Appearance, etc.) |
| **Marketplace** | `marketplace` | ❌ `false` | ✅ `true` | Add-ons und Integrationen verwalten |
| **PluginStore** | `pluginstore` | ❌ `false` | ✅ `true` | Plugins installieren und verwalten |
| **AllSchedules** | `all_schedules` | ❌ `false` | ✅ `true` | Übersicht aller Timer und Zeitpläne |

---

## 🎓 Best Practices

### DO ✅

- **Nutze Registry-Methoden** statt hardcoded domain-Checks
- **Setze `hasTabs: false`** für neue Entities (außer es gibt einen guten Grund)
- **Lazy-Load** View-Komponenten via `() => import('./MyView.jsx')`
- **Dokumentiere** neue Properties in Entity-Kommentaren

### DON'T ❌

- **KEINE hardcoded domain-Checks** in UI-Komponenten
- **NICHT `hasCustomView: false`** verwenden (außer für Legacy wie Settings)
- **KEINE synchronen Imports** für View-Komponenten
- **NICHT direkt `systemRegistry.entities`** zugreifen - nutze Helper-Methoden

---

## 🐛 Troubleshooting

### Problem: Neue Entity erscheint nicht in der Liste

**Lösung:**
1. Prüfe ob Entity in `registry.js` → `autoDiscover()` importiert ist
2. Prüfe Browser-Console auf Fehler beim Import
3. Prüfe ob Entity korrekt exportiert wird: `export default new MyEntity();`

### Problem: Entity öffnet sich, aber zeigt leere View

**Lösung:**
1. Prüfe ob `viewComponent` korrekt gesetzt ist
2. Prüfe Browser-Console auf Import-Fehler
3. Prüfe ob View-Komponente korrekt exportiert: `export default function MyView() { ... }`

### Problem: Tabs funktionieren nicht

**Lösung:**
1. Prüfe `hasTabs: true` in Entity-Definition
2. Prüfe ob `getFilteredTabIcons()` die richtigen Tabs zurückgibt
3. Für Settings: Prüfe ob `settingsRef` korrekt übergeben wird

### Problem: System-Entity wird nicht erkannt

**Lösung:**
1. Prüfe ob `systemRegistry.isInitialized === true`
2. Prüfe ob Entity in Registry geladen: `systemRegistry.getEntity('my_custom')`
3. Prüfe Console-Log beim App-Start: `✅ Registered entity: my_custom`

---

## 🔄 Migration von Hardcoded zu Universal

### Vorher (Hardcoded):
```javascript
// DetailView.jsx
if (item.domain === 'my_custom' || item.domain === 'other_custom') {
  // Custom handling
}

// DeviceCard.jsx
if (device.domain === 'my_custom' || device.domain === 'other_custom') {
  return '';
}
```

### Nachher (Universal):
```javascript
// DetailView.jsx
if (systemRegistry.isSystemEntity(item.domain)) {
  // Automatisch via Registry!
}

// DeviceCard.jsx
if (systemRegistry.isSystemEntity(device.domain)) {
  return '';
}
```

**Migration Steps:**
1. Erstelle Entity-Datei mit Properties
2. Registriere in `autoDiscover()`
3. **Entferne** alle hardcoded domain-Checks
4. **Teste** alle betroffenen UI-Komponenten

---

## 📝 Code-Beispiel: Vollständige Entity
```javascript
// src/system-entities/entities/notifications/index.js
import { SystemEntity } from '../../base/SystemEntity.js';

class NotificationsEntity extends SystemEntity {
  constructor() {
    super({
      // Core Properties
      id: 'notifications',
      domain: 'notifications',
      name: 'Benachrichtigungen',
      icon: 'mdi:bell',
      category: 'system',
      description: 'Verwalte deine Benachrichtigungen',
      relevance: 90,
      
      // Attributes
      attributes: {
        unread_count: 0,
        last_notification: null
      },
      
      // Permissions
      permissions: [
        'notifications:read',
        'notifications:write',
        'notifications:clear'
      ],
      
      // Routes (Deep Links)
      routes: {
        all: '/notifications',
        unread: '/notifications/unread',
        settings: '/notifications/settings'
      },
      
      // Actions
      actions: {
        markAsRead: async function(params) {
          const { notificationId } = params;
          // Mark notification as read
          console.log(`Marked notification ${notificationId} as read`);
        },
        
        clearAll: async function() {
          // Clear all notifications
          console.log('Cleared all notifications');
        }
      },
      
      // UI Behavior
      hasTabs: false,
      hasCustomView: true,
      showInDetailView: true,
      
      // View Component
      viewComponent: () => import('./NotificationsView.jsx')
    });
  }
  
  /**
   * Lifecycle: onMount
   */
  async onMount(context) {
    await super.onMount(context);
    
    console.log('📬 Notifications Entity mounted');
    
    // Subscribe to notification events
    if (context.hass) {
      context.hass.connection.subscribeEvents(
        (event) => {
          console.log('New notification:', event);
          this.updateAttributes({
            unread_count: this.attributes.unread_count + 1,
            last_notification: event.data
          });
        },
        'notification'
      );
    }
  }
}

export default new NotificationsEntity();
```

---

## 🎉 Zusammenfassung

Mit dem **Universal System-Entity Framework** können neue Entities mit **minimalen Code-Änderungen** hinzugefügt werden:

1. ✅ **1 Entity-Datei** erstellen
2. ✅ **1 View-Komponente** erstellen
3. ✅ **1 Import** in Registry hinzufügen
4. ✅ **FERTIG!**

Keine weiteren Änderungen in DetailView, DeviceCard oder anderen UI-Komponenten nötig! 🚀

---

---

## 🔌 Plugin Development (External Plugins)

### Plugin vs System-Entity

| Feature | System-Entity | External Plugin |
|---------|---------------|-----------------|
| **Location** | Built-in (`src/system-entities/entities/`) | External (URL, GitHub, ZIP) |
| **Loading** | Auto-discovered at startup | Dynamically loaded via Plugin Loader |
| **Installation** | Part of card build | User installs via Plugin Store |
| **Updates** | Card updates | Individual plugin updates |
| **Security** | Trusted code | Sandboxed, validated |
| **Access** | Full system access | Limited API access |

### Plugin Manifest Format

Every external plugin requires a `manifest.json` file:

```json
{
  "id": "my-awesome-plugin",
  "name": "My Awesome Plugin",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "A plugin that does amazing things",
  "homepage": "https://github.com/username/my-plugin",

  "icon": "mdi:star",
  "category": "tools",
  "relevance": 85,

  "main": "index.js",
  "viewComponent": "MyPluginView.jsx",

  "permissions": [
    "entities:read",
    "entities:write",
    "storage:read",
    "storage:write"
  ],

  "dependencies": {
    "preact": "^10.0.0",
    "framer-motion": "^10.0.0"
  },

  "compatibility": {
    "minVersion": "1.0.0",
    "maxVersion": "2.0.0"
  },

  "settings": {
    "apiKey": {
      "type": "string",
      "default": "",
      "required": true,
      "label": "API Key",
      "description": "Your API key for the service"
    },
    "updateInterval": {
      "type": "number",
      "default": 300,
      "min": 60,
      "max": 3600,
      "label": "Update Interval (seconds)"
    }
  }
}
```

### Plugin File Structure

```
my-awesome-plugin/
├── manifest.json          # Plugin manifest (required)
├── index.js              # Main entry point (required)
├── MyPluginView.jsx      # View component (optional)
├── styles.css            # Styles (optional)
├── icon.svg              # Custom icon (optional)
├── README.md             # Documentation (recommended)
└── LICENSE               # License file (recommended)
```

### Plugin Entry Point (index.js)

```javascript
import { SystemEntity } from '@fast-search-card/system-entities';

class MyAwesomePlugin extends SystemEntity {
  constructor() {
    // Load manifest
    const manifest = require('./manifest.json');

    super({
      id: manifest.id,
      domain: manifest.id,
      name: manifest.name,
      icon: manifest.icon,
      category: manifest.category,
      description: manifest.description,
      relevance: manifest.relevance,

      // Plugin-specific
      isPlugin: true,
      pluginManifest: manifest,

      // UI Behavior
      hasTabs: false,
      hasCustomView: true,
      showInDetailView: true,

      // View Component
      viewComponent: () => import('./MyPluginView.jsx'),

      // Actions
      actions: {
        refresh: async () => {
          await this.refreshData();
        }
      }
    });
  }

  /**
   * Initialize plugin
   */
  async onMount(context) {
    await super.onMount(context);

    console.log('🔌 Plugin mounted:', this.id);

    // Load settings from storage
    const settings = await this.getSettings();

    // Initialize with settings
    await this.initialize(settings);
  }

  /**
   * Cleanup plugin
   */
  async onUnmount() {
    console.log('🔌 Plugin unmounting:', this.id);

    // Cleanup resources
    await this.cleanup();

    await super.onUnmount();
  }

  /**
   * Custom plugin methods
   */
  async initialize(settings) {
    // Initialize plugin with settings
  }

  async refreshData() {
    // Refresh plugin data
  }

  async cleanup() {
    // Cleanup resources
  }
}

export default new MyAwesomePlugin();
```

### Plugin View Component

```javascript
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { motion } from 'framer-motion';

export default function MyPluginView({
  entity,
  hass,
  lang,
  onBack,
  onNavigate,
  onServiceCall
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load data from API or Home Assistant
      const result = await fetch('/api/data');
      const json = await result.json();
      setData(json);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="plugin-loading">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="my-plugin-view"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <header className="plugin-header">
        <h1>{entity.name}</h1>
        <button onClick={() => entity.actions.refresh()}>
          Refresh
        </button>
      </header>

      <div className="plugin-content">
        {/* Your plugin UI */}
        {data && (
          <pre>{JSON.stringify(data, null, 2)}</pre>
        )}
      </div>
    </motion.div>
  );
}
```

---

## 🔐 Plugin Security & Sandboxing

### Permission System

Plugins must declare required permissions in `manifest.json`:

```json
{
  "permissions": [
    "entities:read",      // Read entity states
    "entities:write",     // Control entities
    "storage:read",       // Read from storage
    "storage:write",      // Write to storage
    "network:fetch",      // Make HTTP requests
    "notifications:send"  // Send notifications
  ]
}
```

### Available Permissions

| Permission | Description | Risk Level |
|------------|-------------|------------|
| `entities:read` | Read entity states and attributes | Low |
| `entities:write` | Control entities (turn on/off, etc.) | Medium |
| `storage:read` | Read plugin storage | Low |
| `storage:write` | Write to plugin storage | Low |
| `network:fetch` | Make HTTP requests | Medium |
| `network:websocket` | Open WebSocket connections | High |
| `notifications:send` | Send notifications to user | Low |
| `automation:create` | Create automations | High |
| `automation:delete` | Delete automations | High |
| `system:settings` | Access system settings | High |

### Security Best Practices

**DO ✅**
- Request only required permissions
- Validate all user input
- Use HTTPS for external requests
- Handle errors gracefully
- Store sensitive data encrypted
- Follow least privilege principle

**DON'T ❌**
- Request unnecessary permissions
- Store passwords in plain text
- Make unvalidated API calls
- Bypass permission checks
- Access system internals directly
- Execute arbitrary code

### Code Validation

All plugins are validated before loading:

1. **Manifest Validation** - Schema validation
2. **Permission Check** - User approval required
3. **Code Scanning** - Basic security checks
4. **Dependency Check** - Verify dependencies
5. **Signature Verification** - Check plugin signature (future)

---

## 🛠️ Plugin API Reference

### Context Object

The `context` object passed to `onMount()` provides:

```javascript
{
  hass: {
    connection,          // WebSocket connection
    callService,         // Call HA service
    callWS,             // Call WebSocket API
    states,             // Entity states
    config,             // HA config
    user                // Current user
  },

  storage: {
    get,                // Get from storage
    set,                // Set in storage
    delete,             // Delete from storage
    clear               // Clear all storage
  },

  notifications: {
    show,               // Show notification
    success,            // Success toast
    error,              // Error toast
    warning,            // Warning toast
    info                // Info toast
  },

  ui: {
    openEntity,         // Open entity detail
    closeDetail,        // Close detail view
    showModal,          // Show modal dialog
    hideModal           // Hide modal
  },

  events: {
    on,                 // Subscribe to event
    off,                // Unsubscribe
    emit                // Emit custom event
  }
}
```

### Helper Methods

#### Storage API

```javascript
// Get value
const value = await this.getStorage('key');

// Set value
await this.setStorage('key', 'value');

// Get all plugin settings
const settings = await this.getSettings();

// Update setting
await this.updateSetting('apiKey', 'new-key');
```

#### Entity API

```javascript
// Get entity state
const state = await this.getEntityState('light.living_room');

// Control entity
await this.callService('light', 'turn_on', {
  entity_id: 'light.living_room',
  brightness: 255
});

// Subscribe to entity changes
this.subscribeEntityChanges('light.living_room', (newState) => {
  console.log('State changed:', newState);
});
```

#### Notification API

```javascript
// Show success message
this.showSuccess('Operation completed!');

// Show error
this.showError('Something went wrong');

// Show custom notification
this.showNotification({
  title: 'Plugin Update',
  message: 'New version available',
  type: 'info',
  duration: 5000
});
```

---

## 📚 Advanced Plugin Examples

### Example 1: Weather Plugin

```javascript
// manifest.json
{
  "id": "weather-plugin",
  "name": "Weather Dashboard",
  "version": "1.0.0",
  "permissions": [
    "entities:read",
    "network:fetch",
    "storage:read",
    "storage:write"
  ],
  "settings": {
    "location": {
      "type": "string",
      "default": "Berlin",
      "label": "Location"
    },
    "units": {
      "type": "select",
      "default": "metric",
      "options": ["metric", "imperial"],
      "label": "Units"
    }
  }
}

// index.js
class WeatherPlugin extends SystemEntity {
  constructor() {
    super({
      id: 'weather-plugin',
      domain: 'weather-plugin',
      name: 'Weather Dashboard',
      icon: 'mdi:weather-partly-cloudy',
      category: 'apps',
      relevance: 90,
      isPlugin: true,
      viewComponent: () => import('./WeatherView.jsx')
    });

    this.weatherData = null;
    this.updateInterval = null;
  }

  async onMount(context) {
    await super.onMount(context);

    // Load settings
    const settings = await this.getSettings();

    // Start auto-update
    this.startAutoUpdate(settings);
  }

  async onUnmount() {
    // Stop auto-update
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    await super.onUnmount();
  }

  startAutoUpdate(settings) {
    this.updateWeather(settings);

    this.updateInterval = setInterval(() => {
      this.updateWeather(settings);
    }, 300000); // 5 minutes
  }

  async updateWeather(settings) {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${settings.location}&units=${settings.units}&appid=${settings.apiKey}`
      );

      this.weatherData = await response.json();

      // Update attributes
      this.updateAttributes({
        temperature: this.weatherData.main.temp,
        humidity: this.weatherData.main.humidity,
        condition: this.weatherData.weather[0].main,
        lastUpdate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Weather update failed:', error);
      this.showError('Failed to update weather data');
    }
  }
}

export default new WeatherPlugin();
```

### Example 2: Automation Builder Plugin

```javascript
class AutomationBuilderPlugin extends SystemEntity {
  constructor() {
    super({
      id: 'automation-builder',
      domain: 'automation-builder',
      name: 'Automation Builder',
      icon: 'mdi:robot',
      category: 'tools',
      relevance: 95,
      isPlugin: true,
      permissions: [
        'entities:read',
        'automation:create',
        'automation:delete',
        'storage:read',
        'storage:write'
      ],
      viewComponent: () => import('./AutomationBuilderView.jsx')
    });
  }

  async createAutomation(config) {
    try {
      // Validate config
      if (!this.validateAutomationConfig(config)) {
        throw new Error('Invalid automation config');
      }

      // Create via Home Assistant API
      await this._context.hass.callService('automation', 'create', {
        alias: config.name,
        trigger: config.triggers,
        condition: config.conditions,
        action: config.actions
      });

      this.showSuccess('Automation created!');
    } catch (error) {
      console.error('Failed to create automation:', error);
      this.showError('Failed to create automation');
    }
  }

  validateAutomationConfig(config) {
    return config.name &&
           config.triggers &&
           config.triggers.length > 0 &&
           config.actions &&
           config.actions.length > 0;
  }
}

export default new AutomationBuilderPlugin();
```

---

## 🧪 Testing & Debugging

### Development Mode

Enable developer mode in Settings:

```javascript
// Add to browser console
localStorage.setItem('fastSearchCard:devMode', 'true');
```

### Plugin Testing

```javascript
// Test plugin loading
const plugin = await SystemEntityLoader.loadFromURL('http://localhost:3000/plugin.js');

// Validate manifest
const errors = validatePluginManifest(plugin.manifest);
if (errors.length > 0) {
  console.error('Validation errors:', errors);
}

// Mount plugin
await plugin.onMount(testContext);

// Trigger action
await plugin.actions.refresh();

// Unmount
await plugin.onUnmount();
```

### Debugging Tips

```javascript
class MyPlugin extends SystemEntity {
  constructor() {
    super({ /* config */ });

    // Enable debug logging
    this.debug = true;
  }

  log(message, ...args) {
    if (this.debug) {
      console.log(`[${this.id}]`, message, ...args);
    }
  }

  async onMount(context) {
    await super.onMount(context);
    this.log('Plugin mounted', { context });
  }
}
```

### Common Issues

**Plugin doesn't appear:**
- Check manifest.json syntax
- Verify plugin is registered in registry
- Check browser console for errors

**Permissions denied:**
- Request required permissions in manifest
- User must approve permissions

**View doesn't render:**
- Verify viewComponent path
- Check for JSX/component errors
- Ensure dependencies are available

---

## 📦 Plugin Distribution

### Plugin Store

Publish plugins to the Fast Search Card Plugin Store:

1. Create plugin repository on GitHub
2. Add `manifest.json` in root
3. Create release with version tag
4. Submit to Plugin Store:
   ```
   https://plugins.fastcard.io/submit
   ```

### GitHub Release

```yaml
# .github/workflows/release.yml
name: Release Plugin

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Create Release
        uses: actions/create-release@v1
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          body: |
            See CHANGELOG.md for details
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Installation URLs

Users can install plugins via:

```
# GitHub
https://github.com/username/plugin-name

# Direct URL
https://cdn.example.com/my-plugin.js

# Plugin Store
fastcard://plugin/my-plugin-id
```

---

## 🎨 UI Guidelines

### Styling

Use Fast Search Card design system:

```css
/* Use CSS variables */
.my-plugin {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border-color);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
  color: var(--text-primary);
}

.my-plugin-button {
  background: var(--accent);
  color: var(--accent-contrast);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-sm) var(--spacing-md);
}
```

### Animations

Use Framer Motion for consistent animations:

```javascript
import { motion } from 'framer-motion';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

<motion.div
  variants={fadeIn}
  initial="hidden"
  animate="visible"
  transition={{ duration: 0.3 }}
>
  {/* Content */}
</motion.div>
```

### Responsive Design

Support all screen sizes:

```javascript
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const handleResize = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  handleResize();
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

---

## 📊 Performance Optimization

### Lazy Loading

```javascript
// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<LoadingSpinner />}>
  <HeavyComponent />
</Suspense>
```

### Memoization

```javascript
import { useMemo, useCallback } from 'preact/hooks';

// Memoize expensive calculations
const expensiveData = useMemo(() => {
  return processLargeDataset(rawData);
}, [rawData]);

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

### Debouncing

```javascript
const debouncedSearch = useMemo(
  () =>
    debounce((query) => {
      performSearch(query);
    }, 300),
  []
);
```

---

## 🌍 Internationalization

### Multi-language Support

```javascript
// translations.js
export const translations = {
  en: {
    title: 'My Plugin',
    button: 'Click Me'
  },
  de: {
    title: 'Mein Plugin',
    button: 'Klick Mich'
  }
};

// Component
const t = (key) => translations[lang][key] || key;

<h1>{t('title')}</h1>
<button>{t('button')}</button>
```

---

## ✅ Plugin Checklist

Before publishing your plugin:

- [ ] Manifest is complete and valid
- [ ] All permissions are justified
- [ ] Code is tested and debugged
- [ ] Documentation (README.md) is included
- [ ] License file is included
- [ ] Version number follows semver
- [ ] Icon is provided
- [ ] Screenshots are included
- [ ] Responsive design is implemented
- [ ] Error handling is complete
- [ ] Performance is optimized
- [ ] Code is commented
- [ ] Security best practices followed

---

**Version:** 2.0.0
**Updated:** 2025-10-29
**Author:** Fast Search Card Team