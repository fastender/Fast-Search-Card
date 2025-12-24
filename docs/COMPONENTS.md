# Fast Search Card - Component Breakdown

This document outlines the high-level architecture and key components that make up the Fast Search Card.

## 1. Core Application & Data

These components form the foundation of the application, managing data, state, and the connection to Home Assistant.

* **`index.jsx`**
    * **Responsibility:** The main entry point of the application.
    * **Function:** It exposes the `mount`, `updateHass`, and `unmount` functions required by Home Assistant to render the Lovelace card. It wraps the entire application in the `DataProvider`.

* **`DataProvider.jsx`**
    * **Responsibility:** The "brain" of the card. This is the central hub for all data and state management.
    * **Function:**
        * Initializes and manages the **IndexedDB** database for persistent caching.
        * Manages a **Memory Cache** for instant access to frequently used data.
        * Fetches all entities, areas, and device registries from Home Assistant.
        * Initializes the **System Entity Registry** (`registry.js`).
        * Manages global state for settings, favorites, and all entities.
        * Provides React Context Hooks (`useData`, `useEntities`, `useFavorites`, `useSettings`) for all child components.
        * Subscribes to Home Assistant's real-time state change events and updates the `entities` state immutably.

## 2. Main UI & Layout

These components define the primary user interface and layout.

### **`SearchField.jsx`** (Main orchestrator)
* **Location:** `src/components/SearchField.jsx`
* **Responsibility:** Main component orchestrating the entire card UI
* **Function:**
  - Manages core UI state (expanded, search value, active category)
  - Renders search bar and category buttons
  - Displays filtered entity results
  - Handles entity selection and DetailView display
  - Integrates fuzzy search functionality

**State Management:**
```javascript
{
  isExpanded: boolean,        // Card expansion state
  searchValue: string,        // Search input value
  activeCategory: string,     // Selected category (devices, sensors, actions)
  selectedEntity: object,     // Currently selected entity
  viewMode: string            // "grid" or "list"
}
```

**Hooks Used:**
- `useSearchFieldState` - UI state management
- `useFuzzySearch` - Fuzzy search logic (Fuse.js)
- `useEntities` - Entity data from DataProvider
- `useFavorites` - Favorites management
- `useSettings` - Card settings

**Sub-Components:**
- `SearchInputSection.jsx` - Search bar and logo
- `CategoryButtonsPanel.jsx` - Category filter buttons
- `GroupedDeviceList.jsx` - Grouped entity results
- `FilterControlPanel.jsx` - Additional filters
- `DetailViewWrapper.jsx` - DetailView container
- `AIModeSection.jsx` - AI chat interface

**Search Filters:**
Uses `searchFilters.js` to:
- Group entities by area (room)
- Filter by domain (light, switch, etc.)
- Apply custom patterns
- Sort by favorites and recents

### **`DetailView.jsx`** (Entity detail panel)
* **Location:** `src/components/DetailView.jsx`
* **Responsibility:** Expanded panel showing detailed entity information and controls
* **Function:**
  - Manages tab navigation (Controls, Context, History, Schedule, Settings)
  - Renders entity header with icon, name, area
  - Displays favorite button
  - Dynamically loads tab content
  - Handles system entity views via lazy loading

**State Management:**
```javascript
{
  activeTab: number,          // Current tab index (0-4)
  isMobile: boolean,          // Mobile layout flag
  isFavorite: boolean,        // Favorite status
  sliderPosition: object      // Tab slider position { x, width, height }
}
```

**Tab Structure:**
```javascript
const tabs = [
  { icon: '⚙️', label: 'Controls', component: UniversalControlsTab },
  { icon: '🔗', label: 'Context', component: ContextTab },
  { icon: '📊', label: 'History', component: HistoryTab },
  { icon: '⏰', label: 'Schedule', component: ScheduleTab },
  { icon: '⚙️', label: 'Settings', component: SettingsTab }
];
```

**Sub-Components:**
- `DetailHeader.jsx` - Entity header with back button
- `EntityIconDisplay.jsx` - Large entity icon display
- `TabNavigation.jsx` - Tab selector with animated slider
- `tabIcons.jsx` - Tab icon definitions

**Props:**
```javascript
{
  item: object,               // Entity object
  isVisible: boolean,         // Panel visibility
  onBack: function,           // Back button handler
  onToggleFavorite: function, // Favorite toggle handler
  onServiceCall: function,    // Service call handler
  onActionNavigate: function, // Action navigation handler
  hass: object,               // Home Assistant connection
  lang: string,               // Language code
  isFavorite: boolean         // Favorite status
}
```

**Layout Modes:**
- **Desktop** - Tabs at top, fixed height panel
- **Mobile** - Tabs at bottom, full-screen panel

**System Entity Integration:**
Uses `SystemEntityLazyView` for:
- Settings entity
- Marketplace entity
- Schedule Viewer entity
- Custom plugins

### **`DeviceCard.jsx`** (Entity card/row)
* **Location:** `src/components/DeviceCard.jsx`
* **Responsibility:** Renders individual entity as card (grid) or row (list)
* **Function:**
  - Displays entity icon, name, state
  - Animated icon based on state (via `AnimatedDeviceIcons.jsx`)
  - Handles click events to open DetailView
  - Responsive icon sizing
  - System entity integration
  - Glassmorphism styling

**Props:**
```javascript
{
  device: object,             // Entity object
  viewMode: string,           // "grid" or "list"
  onClick: function,          // Click handler
  index: number,              // List index for animation delay
  lang: string,               // Language code
  animationKey: string,       // Animation trigger key
  roomIndex: number,          // Room index (for grouping)
  itemsPerRoom: array,        // Items per room (for animation)
  isPanelAnimationComplete: boolean // Animation state flag
}
```

**View Modes:**

**Grid View** (`DeviceCardGridView.jsx`):
- Card-based layout
- Shows icon, name, state
- Responsive grid (1-4 columns)
- Aspect ratio maintained
- Hover scale effect

**List View** (`DeviceCardListView.jsx`):
- Compact row layout
- Icon on left, text on right
- More entities visible
- Smaller spacing
- Quick scanning

**Features:**
- **Responsive Icon Sizes:**
  - Desktop (>768px): 56px
  - Tablet (480-768px): 48px
  - Phone (360-480px): 36px
  - Small phones (<360px): 32px

- **Active State Detection:**
  - Lights: "on" state
  - Sensors: Numeric values
  - Binary sensors: "on" state
  - Background color changes based on state

- **State Display:**
  - Numeric sensors: Formatted value with unit
  - Binary sensors: Translated state (Open/Closed, On/Off)
  - Standard entities: Translated state
  - Sensor advice for context (e.g., "High", "Normal", "Low")

- **Animations:**
  - Staggered entrance (0.08s delay per item)
  - Hover scale (1.02x)
  - Active state glow
  - Smooth transitions

**System Entity Integration:**
Uses `DeviceCardIntegration.jsx` for:
- Custom system entity icons
- Special animation variants
- Unique styling per system entity type

**Animation Variants:**
```javascript
{
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: animationDelay }
  },
  hover: {
    scale: 1.02,
    backgroundColor: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.18)'
  }
}
```

### **`SubcategoryBar.jsx`** (Filter bar)
* **Location:** `src/components/SubcategoryBar.jsx`
* **Responsibility:** Horizontal filter bar for result refinement
* **Function:**
  - Filter by area (room)
  - Filter by device type (domain)
  - Show suggested filters
  - Smooth scrolling horizontal layout

**Filter Types:**
- **By Area:** Living Room, Bedroom, Kitchen, etc.
- **By Type:** Lights, Switches, Sensors, etc.
- **Suggestions:** Based on current results

**Features:**
- Horizontal scroll on mobile
- Active filter highlighting
- Clear all filters button
- Smooth animations
- Responsive design

## 3. Detail View Tabs

These components are rendered inside the `DetailView` panel.

### **`UniversalControlsTab.jsx`** (331 lines)
* **Location:** `src/components/tabs/UniversalControlsTab.jsx`
* **Responsibility:** Default "Controls" tab providing domain-specific controls
* **Refactored:** October 2025 (Previously 427 lines)

**Key Features:**
- Domain-specific control rendering
- Circular slider integration for analog controls
- Quick action buttons for common operations
- State display and feedback
- Responsive layout

**Supported Domains:**
- **Light** - Brightness slider, color picker, color temperature
- **Climate** - Temperature slider, HVAC mode, fan mode, preset
- **Cover** - Position slider, open/close/stop buttons
- **Fan** - Speed slider, oscillation, direction, preset
- **Media Player** - Volume slider, source selection
- **Switch** - On/Off toggle
- **Lock** - Lock/Unlock buttons
- **Vacuum** - Start, pause, return to dock

**Components Used:**
- `CircularSlider` - Main analog control
- `ClimateSettingsBar` - Climate mode selection
- `PresetButtonsGroup` - Quick preset buttons
- `ControlButton` - Individual control buttons
- `SolarCarousel` - Solar/energy entity display

**Props:**
```javascript
{
  item: object,           // Entity object
  onServiceCall: function,// Service call handler
  hass: object,           // Home Assistant connection
  lang: string            // Language code
}
```

### **`ContextTab.jsx`** (285 lines)
* **Location:** `src/components/tabs/ContextTab.jsx`
* **Responsibility:** Displays related automations, scripts, and scenes
* **Refactored:** September 2025 (Previously 612 lines)

**Key Features:**
- Lists automations that reference the entity
- Shows associated scripts
- Displays related scenes
- Filter tabs (All, Automations, Scripts, Scenes)
- One-tap execution for scripts and scenes
- Visual state indicators

**Sub-Components:**
- `FilterTabs.jsx` - Tab selector for action types
- `ActionItem.jsx` - Individual action display card

**Props:**
```javascript
{
  item: object,           // Entity object
  onActionNavigate: function, // Navigation handler
  onServiceCall: function,// Service call handler
  hass: object,           // Home Assistant connection
  lang: string            // Language code
}
```

**Data Flow:**
1. Fetches all automations/scripts/scenes via `actionUtils.js`
2. Filters by entity_id references
3. Groups by type (automation, script, scene)
4. Renders filtered list with action buttons

### **`HistoryTab.jsx`** (416 lines)
* **Location:** `src/components/tabs/HistoryTab.jsx`
* **Responsibility:** Visual history display with charts and analytics
* **Refactored:** October 2025 (Previously 795 lines, -48%)

**Key Features:**
- Interactive timeline charts (Chart.js)
- Configurable time ranges (1h - 30 days)
- State change events with timestamps
- Time-of-day analysis (Morning, Day, Evening, Night)
- Event statistics and summaries
- Accordion sections with animations

**Refactoring Highlights:**
- **CSS Extracted:** 255 lines to `HistoryTab.css`
- **Animations Extracted:** `accordionAnimations.js`
- **Utilities Extracted:** `timeFormatters.js`, `historyDataProcessors.js`

**Time Ranges:**
```javascript
['1h', '3h', '6h', '12h', '24h', '7d', '30d']
```

**Components Used:**
- `UsageTimelineChart` - Chart.js wrapper
- Accordion sections with Framer Motion

**Props:**
```javascript
{
  item: object,           // Entity object
  hass: object,           // Home Assistant connection
  lang: string            // Language code
}
```

**Utilities Used:**
- `formatTime(timestamp, timeRange)` - Time formatting
- `formatDuration(minutes)` - Duration formatting
- `generateCategoryData(history)` - Time-of-day grouping

**External CSS:**
`src/components/tabs/HistoryTab.css` (255 lines)

### **`ScheduleTab.jsx`** (596 lines)
* **Location:** `src/components/tabs/ScheduleTab.jsx`
* **Responsibility:** Full scheduler UI for creating and managing timers
* **Refactored:** October 2025 (Previously 889 lines, -33%)

**Key Features:**
- Visual time picker (iOS-style)
- Weekday selection for recurring schedules
- Domain-specific action configuration
- Edit existing schedules
- Delete schedules
- Integration with `nielsfaber/scheduler-component`

**Refactoring Highlights:**
- **Service Actions:** Extracted to `serviceActionBuilders.js`
- **Edit State Loaders:** Extracted to `editStateLoaders.js`
- **Timer Names:** Extracted to `timerNameGenerators.js`
- **Components:** Extracted 3 components

**Sub-Components:**
- `SchedulePickerTable.jsx` (188 lines) - Main picker interface
- `AddScheduleButton.jsx` (27 lines) - Add schedule button
- `ScheduleActionButtons.jsx` (57 lines) - Cancel/Confirm buttons
- `ScheduleList.jsx` - List of existing schedules
- `ScheduleListItem.jsx` - Individual schedule card
- `ScheduleFilter.jsx` - Filter by entity

**Domain-Specific Settings:**
- **Climate:** `ClimateScheduleSettings.jsx` - HVAC mode & temperature
- **Cover:** Position slider (0-100%)
- **Standard:** On/Off action selection

**Props:**
```javascript
{
  item: object,           // Entity object
  onServiceCall: function,// Service call handler
  hass: object,           // Home Assistant connection
  lang: string            // Language code
}
```

**Utilities Used:**
- `createServiceAction(item, action, settings, position, t)` - Build service call
- `generateTimerName(item, action, settings, position, lang, t)` - Create name
- `loadScheduleState(timer)` - Load existing schedule for editing

**Integration:**
Requires `nielsfaber/scheduler-component`:
```yaml
# configuration.yaml
scheduler:
  # Component configuration
```

### **`SettingsTab.jsx`** (Multi-tab interface)
* **Location:** `src/components/tabs/SettingsTab.jsx`
* **Responsibility:** In-card configuration interface

**Key Features:**
- Multi-tab settings interface
- General, Appearance, Privacy, About tabs
- Live preview of changes
- Import/Export configurations

**Sub-Components:**
- `GeneralSettingsTab.jsx` - Language, basic settings
- `AppearanceSettingsTab.jsx` - View mode, theme settings
- `PrivacySettingsTab.jsx` - Excluded entity patterns
- `AboutSettingsTab.jsx` - Version, build info

**Settings Managed:**
```javascript
{
  language: string,           // UI language (de, en, es, ...)
  viewMode: string,           // "grid" or "list"
  excludedPatterns: string[], // Entity filter patterns
  cardHeight: number          // Fixed height or null
}
```

**Privacy Features:**
- Live pattern preview
- Template library (hide sensors, unavailable, etc.)
- Import/Export as JSON
- Regex pattern support

## 4. Reusable UI Controls

These are common components used across various tabs.

### CircularSlider System (Refactored October 2025)

The circular slider underwent major refactoring to improve maintainability and reusability. It's now split into multiple components and hooks.

#### **`CircularSlider.jsx`** (525 lines)
* **Location:** `src/components/controls/CircularSlider.jsx`
* **Responsibility:** Main orchestration component for circular controls
* **Refactored from:** 957 lines → 525 lines (-45%)

**Key Features:**
- Physics-based spring animations (Framer Motion)
- Temperature-based color gradients for climate domain
- Power toggle with value restoration
- Responsive sizing (200px mobile → 280px desktop)
- Progress mode for read-only displays
- Smooth drag interactions (mouse & touch)

**Props:**
```javascript
{
  // Value Props
  value: number,              // Current value (0-100)
  min: number,                // Minimum value (default: 0)
  max: number,                // Maximum value (default: 100)
  step: number,               // Value increment (default: 1)

  // Display Props
  label: string,              // Display label (e.g., "Brightness")
  displayValue: string,       // Optional display text override
  subValue: string,           // Optional sub-value text
  unit: string,               // Unit symbol (e.g., "%", "°C")
  showUnit: boolean,          // Show unit (default: false)

  // Style Props
  color: string,              // Primary color (default: "#FFD700")
  size: number,               // Fixed size or null for auto

  // Behavior Props
  disabled: boolean,          // Disable interaction
  readOnly: boolean,          // Read-only mode
  progressMode: boolean,      // Progress bar mode
  hideSlider: boolean,        // Hide drag handle

  // Power Control
  showPower: boolean,         // Show power toggle
  powerState: boolean,        // Power on/off state

  // Callbacks
  onValueChange: function,    // Value change callback
  onPowerToggle: function,    // Power toggle callback

  // Domain
  domain: string              // Optional domain (e.g., "climate")
}
```

**Custom Hooks Used:**
- `useSliderAnimation` - Spring animations and value counting
- `useCircularDrag` - Mouse and touch drag interactions
- `usePowerState` - Power toggle with value restoration

**Utility Functions:**
- `valueToAngle` - Convert value to SVG angle
- `angleToValue` - Convert SVG angle to value
- `getTemperatureColor` - Temperature-based color mapping
- `calculateResponsiveSize` - Responsive size calculation

#### **`CircularSliderDisplay.jsx`** (202 lines)
* **Location:** `src/components/controls/CircularSliderDisplay.jsx`
* **Responsibility:** Animated value display component
* **Extracted from:** `CircularSlider.jsx` (October 2025)

**Features:**
- Animated value display with Framer Motion
- Optional sub-value display
- Unit display with positioning
- Label display with uppercase styling
- Horizontal scrolling for long text
- Responsive font sizing

**Props:**
```javascript
{
  value: number,              // Current value
  animatedValue: MotionValue, // Framer Motion animated value
  displayValue: string,       // Optional display text
  subValue: string,           // Optional sub-value
  unit: string,               // Unit symbol
  showUnit: boolean,          // Show unit
  label: string,              // Label text
  size: number,               // Slider size for responsive fonts
  isDragging: boolean,        // Drag state
  valueRef: object,           // Ref for value element
  scrollOffset: number        // Horizontal scroll offset
}
```

**Responsive Font Sizes:**
- Main value: `clamp(26px, 12.2vw, 39px)` (mobile) → `clamp(38px, 18vw, 48px)` (desktop)
- Unit: `clamp(9px, 3.7vw, 13px)` (mobile) → `clamp(13px, 5.5vw, 19px)` (desktop)
- Sub-value: `clamp(10px, 4.4vw, 15px)` (mobile) → `clamp(13px, 5.5vw, 19px)` (desktop)
- Label: `clamp(8px, 3.2vw, 10px)` (mobile) → `clamp(10px, 4vw, 13px)` (desktop)

#### **`PowerToggle.jsx`** (153 lines)
* **Location:** `src/components/controls/PowerToggle.jsx`
* **Responsibility:** Reusable power switch component
* **Extracted from:** `CircularSlider.jsx` (October 2025)

**Features:**
- Animated toggle switch with smooth transitions
- Responsive sizing based on slider size
- Disabled state support
- Pointer events management
- Glassmorphism design

**Props:**
```javascript
{
  isOn: boolean,              // Power state
  onChange: function,         // Toggle callback
  disabled: boolean,          // Disabled state
  size: number,               // Slider size for positioning
  show: boolean               // Show/hide toggle
}
```

**Positioning:**
- Desktop: Bottom left of slider
- Mobile: Bottom center of slider

**Styling:**
- Background: `rgba(255, 255, 255, 0.15)` (off), accent color (on)
- Size: `40px` (mobile) → `48px` (desktop)
- Border: `1px solid rgba(255, 255, 255, 0.2)`

### Other Controls

#### **`IOSTimePicker.jsx`**
* **Responsibility:** Touch-friendly "roller" picker components
* **Function:**
  - Time selection (hour & minute rollers)
  - Multi-select picker (weekdays, modes)
  - Smooth scrolling animations
  - iOS-style design

**Used in:** `ScheduleTab.jsx`, `ClimateScheduleSettings.jsx`

#### **`ClimateSettingsBar.jsx`**
* **Responsibility:** Climate control settings panel
* **Function:**
  - HVAC mode selection (Heat, Cool, Auto, Off)
  - Fan mode selection (Auto, Low, Medium, High)
  - Preset mode selection (Home, Away, Sleep)
  - Temperature display

#### **`ControlButton.jsx`**
* **Responsibility:** Reusable control button component
* **Function:**
  - Glassmorphism styling
  - Icon support
  - Active/inactive states
  - Hover animations

#### **`PresetButtonsGroup.jsx`**
* **Responsibility:** Group of preset buttons for climate/fan controls
* **Function:**
  - Horizontal button group
  - Active state highlighting
  - Quick preset selection

#### **`AIModeInterface.jsx`**
* **Responsibility:** Chat-style interface for experimental AI mode
* **Function:**
  - Natural language input
  - Chat message display
  - Typing indicators
  - Simulated AI responses (placeholder)

## 5. System Entity Framework

This is a modular architecture for managing core card features and enabling plugins.

* **`SystemEntity.js`**
    * The **base class** that all system entities (like Settings, Marketplace) and all third-party plugins must extend. Defines the common interface (`onMount`, `onUnmount`, `toEntity`).

* **`registry.js`**
    * A **singleton registry** that is initialized by `DataProvider.jsx`.
    * It automatically discovers all built-in system entities (from `/entities/`) and provides methods (`register`, `getEntity`, `getViewComponent`) to manage them.

* **`SystemEntityLoader.js`**
    * A utility for dynamically loading plugins from external sources like a URL, GitHub, or a user-uploaded ZIP file. It validates the plugin's manifest before registering it with the `registry.js`.

* **`appearanceConfig.js`**
    * A centralized design configuration file. It maps system entity domains (e.g., `settings`, `pluginstore`) to their specific colors, icons, and animations, ensuring a consistent look and feel.

* **`DetailViewIntegration.jsx`**
    * A helper component used by `DetailView.jsx` to **lazy-load** the UI (the `viewComponent`) of a system entity or plugin only when the user clicks on it.

* **System Entity Examples:**
    * `entities/settings/index.js`: Defines the "Settings" entity.
    * `entities/pluginstore/index.js`: Defines the "Plugin Store" entity.
    * `entities/all-schedules/index.js`: Defines the global "All Schedules" viewer entity.

## 6. Custom Hooks & State Management

The card uses a comprehensive set of custom hooks for state management and reusable logic.

### CircularSlider Hooks (Extracted October 2025)

#### **`useSliderAnimation.js`** (73 lines)
* **Location:** `src/hooks/useSliderAnimation.js`
* **Purpose:** Manages spring animations and value counting for circular slider
* **Extracted from:** `CircularSlider.jsx` (October 2025)

**Features:**
- Physics-based spring animations (Framer Motion)
- Initial counting animation (0 → value on mount)
- Smooth value transitions
- Handle position transforms

**Returns:**
```javascript
{
  currentValue: number,       // Current slider value (state)
  setCurrentValue: function,  // State setter
  springValue: MotionValue,   // Framer Motion spring value
  countingValue: MotionValue, // Animated counting spring
  handleAngle: MotionValue,   // Transformed angle for handle position
  hasAnimated: boolean        // Flag for initial animation
}
```

**Spring Configuration:**
```javascript
springValue: {
  stiffness: 280,      // Fast, responsive motion
  damping: 28,         // Controlled bounce
  mass: 0.8,           // Light, quick response
  restDelta: 0.001,    // High precision
  restSpeed: 0.01      // Minimum speed for "rest"
}

countingValue: {
  stiffness: 100,      // Slower counting animation
  damping: 30,
  restDelta: 0.01
}
```

#### **`useCircularDrag.js`** (139 lines)
* **Location:** `src/hooks/useCircularDrag.js`
* **Purpose:** Manages mouse and touch drag interactions for circular slider
* **Extracted from:** `CircularSlider.jsx` (October 2025)

**Features:**
- SVG coordinate transformation
- ViewBox scaling calculations
- Angle-to-value conversion with Math.atan2
- Value clamping and stepping
- Auto-power-on when dragging
- Global event listeners during drag
- Touch and mouse event support
- Prevent scroll during touch drag

**Returns:**
```javascript
{
  isDragging: boolean,        // Current drag state
  handleMouseDown: function,  // Mouse event handler
  handleTouchStart: function  // Touch event handler
}
```

**Interaction Flow:**
```
1. User clicks/touches slider
2. Calculate SVG coordinates relative to center
   - Get bounding rect
   - Scale by ViewBox ratio (200 / rect.width)
3. Convert coordinates to angle
   - deltaX = scaledX - CENTER_X
   - deltaY = scaledY - CENTER_Y
   - angle = Math.atan2(deltaY, deltaX) * (180/π)
4. Convert angle to value
   - Normalize angle (-90° to 270°)
   - Map to value range (min to max)
5. Apply stepping and clamping
   - Round to nearest step
   - Clamp between min and max
6. Update spring value for smooth animation
7. Trigger callbacks (onValueChange)
```

#### **`usePowerState.js`** (48 lines)
* **Location:** `src/hooks/usePowerState.js`
* **Purpose:** Manages power toggle with value restoration
* **Extracted from:** `CircularSlider.jsx` (October 2025)

**Features:**
- Local power state management
- Last value memory (default: 50%)
- Restore previous value on power-on
- Reset to 0 on power-off
- Integration with slider animation values

**Returns:**
```javascript
{
  localPowerState: boolean,      // Current power state
  setLocalPowerState: function,  // State setter
  lastSliderValue: number,       // Last non-zero value
  setLastSliderValue: function,  // Setter for last value
  handlePowerToggle: function    // Toggle handler with restoration
}
```

**Power Toggle Behavior:**
```javascript
// Power Off
setCurrentValue(0);
springValue.set(0);
countingValue.set(0, false);

// Power On
setCurrentValue(lastSliderValue); // Restore saved value
springValue.set(lastSliderValue);
countingValue.set(lastSliderValue, false);
onValueChange(lastSliderValue);
```

### Other Custom Hooks

#### **`useFuzzySearch.js`**
* **Purpose:** Fuzzy search logic with Fuse.js
* **Features:**
  - Typo-tolerant searching
  - Multi-field searching (name, area, domain)
  - Configurable threshold
  - Real-time results

#### **`useSearchFieldState.js`**
* **Purpose:** UI state management for SearchField
* **Features:**
  - Expansion state
  - Search value
  - Category selection
  - Entity selection

#### **`useFavoriteManager.js`**
* **Purpose:** Favorites management
* **Features:**
  - Add/remove favorites
  - Persistent storage (IndexedDB)
  - Favorite status checking

#### **`useHistoryData.js`**
* **Purpose:** Fetch and process entity history
* **Features:**
  - History API integration
  - Time range filtering
  - Data caching
  - Loading states

## 7. Utility Functions & Helpers

The card uses a comprehensive set of utility functions organized by purpose.

### CircularSlider Utilities (Extracted October 2025)

#### **`circularSliderGeometry.js`** (41 lines)
* **Location:** `src/utils/circularSliderGeometry.js`
* **Purpose:** Centralized geometry constants and calculations

**Constants:**
```javascript
VIEW_BOX_SIZE = 200    // SVG viewBox dimensions
RADIUS = 70            // Circle radius
CENTER_X = 100         // Center X coordinate
CENTER_Y = 100         // Center Y coordinate
CIRCUMFERENCE = 439.8  // 2 * PI * RADIUS
```

**Functions:**
```javascript
calculateResponsiveSize()
// Returns optimal slider size based on screen width
// Mobile (<600px): 200px
// Tablet (600-960px): 240px
// Desktop (>960px): 280px
```

#### **`circularSliderTransforms.js`** (46 lines)
* **Location:** `src/utils/circularSliderTransforms.js`
* **Purpose:** Pure math functions for value/angle conversion

**Functions:**
```javascript
valueToAngle(value, min, max)
// Converts value (0-100) to angle (-90° to 270°)
// -90° = top of circle (start position)
// Example: valueToAngle(50, 0, 100) → 90° (right)

angleToValue(angle, min, max)
// Converts angle to value with range normalization
// Example: angleToValue(90, 0, 100) → 50

getProgressOffset(currentValue, min, max, circumference)
// Calculates stroke-dashoffset for progress mode
// Used for animated arc drawing
```

#### **`temperatureColors.js`** (29 lines)
* **Location:** `src/utils/temperatureColors.js`
* **Purpose:** Temperature-based color mapping for climate domain

**Color Gradient:**
```javascript
< 16°C → #0288D1 (Blue - Cold)
16-18°C → #03A9F4 (Light Blue)
18-20°C → #00BCD4 (Cyan)
20-22°C → #4CAF50 (Green - Comfortable)
22-24°C → #8BC34A (Light Green)
24-26°C → #CDDC39 (Yellow Green)
26-28°C → #FF9800 (Orange)
> 28°C → #F44336 (Red - Hot)
```

**Function:**
```javascript
getTemperatureColor(temperature, unit)
// Supports both Celsius and Fahrenheit
// Automatic °F → °C conversion
// Smooth color transitions
```

### Schedule Utilities (Extracted October 2025)

#### **`serviceActionBuilders.js`** (40 lines)
* **Location:** `src/utils/serviceActionBuilders.js`
* **Purpose:** Build Home Assistant service call objects

**Function:**
```javascript
createServiceAction(item, actionValue, climateSettings, coverPosition, t)

// Climate Example:
{
  service: "climate.set_temperature",
  entity_id: "climate.living_room",
  service_data: {
    temperature: 22,
    hvac_mode: "heat"
  }
}

// Cover Example:
{
  service: "cover.set_cover_position",
  entity_id: "cover.bedroom_blinds",
  service_data: { position: 50 }
}

// Standard Example:
{
  service: "light.turn_on",
  entity_id: "light.bedroom"
}
```

#### **`editStateLoaders.js`** (86 lines)
* **Location:** `src/utils/editStateLoaders.js`
* **Purpose:** Parse and load edit state from existing timers/schedules

**Functions:**
- `loadCoverEditState(timer)` - Parse cover timer configuration
- `loadClimateEditState(timer)` - Parse climate timer with HVAC mode
- `loadStandardEditState(timer)` - Parse on/off timer
- `loadTimerState(timer)` - Load timer details (time, weekdays, enabled)
- `loadScheduleState(timer)` - Complete schedule state loader

#### **`timerNameGenerators.js`** (35 lines)
* **Location:** `src/utils/timerNameGenerators.js`
* **Purpose:** Generate user-friendly timer names

**Function:**
```javascript
generateTimerName(item, actionValue, climateSettings, coverPosition, lang, t)

// Examples:
"Bedroom Light / Turn On"
"Living Room Thermostat / Heat / 22°C"
"Bedroom Blinds / Position 50%"
```

**Helper:**
```javascript
getHvacModeLabel(mode, lang)
// Returns localized HVAC mode labels
// "heat" → "Heizen" (de) / "Heat" (en) / "Chauffage" (fr)
```

### History Utilities (Extracted October 2025)

#### **`timeFormatters.js`** (44 lines)
* **Location:** `src/utils/timeFormatters.js`
* **Purpose:** Time and duration formatting

**Functions:**
```javascript
formatTime(timestamp, timeRange)
// Returns formatted time string based on range
// ≤24h: "14:30" (time only)
// >24h: "28.10 14:30" (date + time)

formatDuration(minutes)
// Returns human-readable duration
// Examples: "5 min", "2h 30min", "3d 5h"

getHoursFromTimeframe(timeRange)
// Converts time range string to hours
// "24h" → 24, "7d" → 168
```

#### **`historyDataProcessors.js`** (39 lines)
* **Location:** `src/utils/historyDataProcessors.js`
* **Purpose:** Process history events into time-of-day categories

**Function:**
```javascript
generateCategoryData(history)
// Processes history array into categories:
// {
//   morning: [],   // 06:00 - 12:00
//   day: [],       // 12:00 - 18:00
//   evening: [],   // 18:00 - 22:00
//   night: []      // 22:00 - 06:00
// }
```

### Animation Utilities

#### **`animationVariants.js`**
* **Location:** `src/utils/animationVariants.js`
* **Purpose:** Centralized Framer Motion animation variants

**Exports:**
- `circularSliderContainerVariants` - Container animations
- `circularSliderSvgVariants` - SVG element animations
- `circularSliderHandleVariants` - Drag handle animations
- `circularSliderValueVariants` - Value display animations
- `circularSliderLabelVariants` - Label animations
- `deviceCardVariants` - Device card animations
- `deviceListItemVariants` - List item animations
- `deviceGridItemVariants` - Grid item animations
- `detailPanelVariants` - Detail panel animations
- `easings` - Custom easing functions
- `durations` - Standard animation durations

#### **`accordionAnimations.js`** (65 lines)
* **Location:** `src/utils/animations/accordionAnimations.js`
* **Purpose:** Accordion-specific animations for HistoryTab
* **Extracted from:** `HistoryTab.jsx` (October 2025)

**Variants:**
```javascript
accordionVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
      opacity: { duration: 0.3, ease: 'easeOut' }
    }
  },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: {
      height: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
      opacity: { duration: 0.3, delay: 0.1, ease: 'easeIn' }
    }
  }
}
```

### Other Utilities

#### **`domainHelpers.js`**
* **Purpose:** Domain-specific logic and helpers
* **Functions:**
  - `getIconForDomain(domain)` - Default icon per domain
  - `getBackgroundStyle(domain)` - Background gradient per domain
  - `getDomainDisplayName(domain, lang)` - Localized domain names

#### **`stateHelpers.js`**
* **Purpose:** Entity state formatting and calculations
* **Functions:**
  - `getStateText(entity, lang)` - Formatted state text
  - `getStateDuration(entity)` - Time since last change
  - `getQuickStats(entity)` - Quick stat summary

#### **`entityHelpers.js`**
* **Purpose:** Entity manipulation and queries
* **Functions:**
  - `filterEntitiesByDomain(entities, domain)` - Filter by domain
  - `sortEntitiesByName(entities)` - Alphabetical sort
  - `groupEntitiesByArea(entities)` - Group by room

#### **`iconHelpers.js`**
* **Purpose:** Icon selection logic
* **Functions:**
  - `getEntityIcon(entity)` - Determine icon based on state/attributes
  - `getDeviceClassIcon(deviceClass)` - Icon for device class

## 8. Key Sub-Systems

* **Icon System:**
    * **`iconRegistry.js`**: A large mapping file that defines which icon component to use based on an entity's `domain`, `state`, and `attributes` (e.g., `device_class`).
    * **`AnimatedDeviceIcons.jsx`**: A React component that takes an entity, queries the `iconRegistry.js`, and renders the correct, state-aware animated icon (e.g., a spinning `WashingMachineOn` icon or a static `WashingMachineOff` icon).

* **Chart System:**
    * **`ChartComponents.jsx`**: A wrapper for the `Chart.js` library, providing specific components like `UsageTimelineChart` for the `HistoryTab.jsx`.
    * **`chartConfig.js`**: The central configuration for `Chart.js`. It uses **tree-shaking** (selective imports) to drastically reduce the bundle size by only importing the controllers, scales, and elements that are actually used.

* **Translation System:**
    * **`src/utils/translations/index.js`**: The main entry point for i18n. It loads all language files (de, en, es, fr, etc.) and exports the `useTranslation` hook.
    * **`src/utils/translations/helpers.js`**: Provides utility functions for formatting sensor values, device states, and relative time based on the selected language.

* **Notification System:**
    * **`toastNotification.js`**: A global system for showing non-intrusive "toast" notifications for success or error messages.
    * **`toast.css`**: The styling for the toast notifications.

---

## 9. Refactoring Summary (October 2025)

The Fast Search Card underwent major refactoring to improve maintainability, testability, and reusability.

### Refactored Components

#### 1. ScheduleTab.jsx
**Before:** 889 lines
**After:** 596 lines
**Reduction:** -33% (-293 lines)

**Extractions:**
- **Utilities:** 3 files (161 lines)
  - `serviceActionBuilders.js` (40 lines) - Service action creation
  - `editStateLoaders.js` (86 lines) - Edit state parsing
  - `timerNameGenerators.js` (35 lines) - Timer name generation
- **Components:** 3 files (272 lines)
  - `AddScheduleButton.jsx` (27 lines)
  - `ScheduleActionButtons.jsx` (57 lines)
  - `SchedulePickerTable.jsx` (188 lines)

#### 2. HistoryTab.jsx
**Before:** 795 lines
**After:** 416 lines
**Reduction:** -48% (-379 lines)

**Extractions:**
- **CSS:** 1 file (255 lines)
  - `HistoryTab.css` - All inline styles
- **Utilities:** 3 files (148 lines)
  - `accordionAnimations.js` (65 lines) - Framer Motion variants
  - `timeFormatters.js` (44 lines) - Time/duration formatting
  - `historyDataProcessors.js` (39 lines) - Data processing

#### 3. CircularSlider.jsx
**Before:** 957 lines
**After:** 525 lines
**Reduction:** -45% (-432 lines)

**Extractions:**
- **Utilities:** 3 files (116 lines)
  - `temperatureColors.js` (29 lines) - Color mapping
  - `circularSliderGeometry.js` (41 lines) - Geometry constants
  - `circularSliderTransforms.js` (46 lines) - Transform functions
- **Components:** 2 files (355 lines)
  - `PowerToggle.jsx` (153 lines) - Reusable power switch
  - `CircularSliderDisplay.jsx` (202 lines) - Value display
- **Hooks:** 3 files (260 lines)
  - `useSliderAnimation.js` (73 lines) - Spring animations
  - `useCircularDrag.js` (139 lines) - Drag interactions
  - `usePowerState.js` (48 lines) - Power state management

### Total Impact

**Files Refactored:** 3 major components
**New Files Created:** 18 modular files
**Total Lines Reduced:** -1,104 lines (-42% average)

**New File Structure:**
```
src/
├── components/
│   ├── controls/
│   │   ├── CircularSlider.jsx (525 lines) ✓
│   │   ├── CircularSliderDisplay.jsx (202 lines) ✓ NEW
│   │   └── PowerToggle.jsx (153 lines) ✓ NEW
│   └── tabs/
│       ├── ScheduleTab.jsx (596 lines) ✓
│       │   └── components/
│       │       ├── AddScheduleButton.jsx ✓ NEW
│       │       ├── ScheduleActionButtons.jsx ✓ NEW
│       │       └── SchedulePickerTable.jsx ✓ NEW
│       └── HistoryTab.jsx (416 lines) ✓
│           └── HistoryTab.css ✓ NEW
├── hooks/
│   ├── useSliderAnimation.js ✓ NEW
│   ├── useCircularDrag.js ✓ NEW
│   └── usePowerState.js ✓ NEW
└── utils/
    ├── temperatureColors.js ✓ NEW
    ├── circularSliderGeometry.js ✓ NEW
    ├── circularSliderTransforms.js ✓ NEW
    ├── timeFormatters.js ✓ NEW
    ├── historyDataProcessors.js ✓ NEW
    ├── serviceActionBuilders.js ✓ NEW
    ├── editStateLoaders.js ✓ NEW
    ├── timerNameGenerators.js ✓ NEW
    └── animations/
        └── accordionAnimations.js ✓ NEW
```

### Benefits

#### Maintainability
- **Smaller Files:** Components under 600 lines are easier to understand and modify
- **Clear Separation:** Utilities, components, and hooks have distinct responsibilities
- **Single Responsibility:** Each file has one clear purpose
- **Better Organization:** Logical file structure and naming

#### Testability
- **Pure Functions:** Utilities can be unit tested in isolation
- **Isolated Hooks:** Custom hooks can be tested independently
- **Component Isolation:** Smaller components are easier to test
- **Mock-friendly:** Clear dependencies make mocking straightforward

#### Reusability
- **Shared Components:** PowerToggle, CircularSliderDisplay can be used anywhere
- **Portable Hooks:** useCircularDrag can be adapted for other circular controls
- **Generic Utilities:** timeFormatters, temperatureColors work in any context
- **Consistent Patterns:** Same patterns can be applied to other large files

#### Performance
- **CSS Extraction:** Separate CSS files enable better browser caching
- **Tree Shaking:** Smaller, focused files improve tree-shaking efficiency
- **Bundle Optimization:** Clearer imports help bundler optimization
- **Reduced Overhead:** Less inline styling reduces HTML size

### Design Patterns Applied

#### 1. Extract Component
Break large components into smaller, focused components:
```javascript
// Before: CircularSlider (957 lines)
// After: CircularSlider + PowerToggle + CircularSliderDisplay
```

#### 2. Extract Utility Function
Move pure functions to separate utility files:
```javascript
// Before: Inline functions in component
// After: circularSliderTransforms.js with pure functions
```

#### 3. Extract Custom Hook
Encapsulate complex state logic in custom hooks:
```javascript
// Before: useState, useEffect in component
// After: useSliderAnimation, useCircularDrag, usePowerState
```

#### 4. Extract CSS
Move inline styles to separate CSS files:
```javascript
// Before: <style>{`...`}</style> in component (255 lines)
// After: HistoryTab.css
```

#### 5. Extract Constants
Centralize magic numbers and constants:
```javascript
// Before: radius = 70 (scattered in code)
// After: RADIUS exported from circularSliderGeometry.js
```

### Future Refactoring Candidates

**Large Files Remaining:**
- `SearchField.jsx` - Could extract sub-components
- `UniversalControlsTab.jsx` - Domain-specific controls could be separated
- `SettingsTab.jsx` - Settings sub-panels could be extracted
- `DataProvider.jsx` - Cache logic could be extracted

**Recommended Approach:**
1. Identify large files (>500 lines)
2. Analyze for extractable utilities, components, hooks
3. Create new files with clear naming
4. Update imports in main component
5. Test thoroughly
6. Document changes

---

## 10. Component Communication Patterns

### Props Down, Events Up

The card follows standard React/Preact patterns:

```javascript
// Parent passes props down
<CircularSlider
  value={brightness}
  onValueChange={handleBrightnessChange}
/>

// Child emits events up via callbacks
const handleDrag = (newValue) => {
  onValueChange(newValue); // Bubble up
};
```

### Context for Global State

Global state uses React Context:

```javascript
// DataProvider exposes contexts
const [entities] = useEntities();
const [favorites, toggleFavorite] = useFavorites();
const [settings, updateSettings] = useSettings();
```

### Service Layer for HA Communication

Home Assistant calls go through service layer:

```javascript
// Component → Handler → Service
onServiceCall(domain, service, data);
  ↓
handleServiceCall(domain, service, data);
  ↓
haService.callService(domain, service, data);
```

### Custom Hooks for Reusable Logic

Complex logic encapsulated in custom hooks:

```javascript
// Reusable across components
const { isDragging, handleMouseDown } = useCircularDrag({
  svgRef,
  angleToValue,
  onValueChange
});
```

---

## 11. Testing Strategy

### Unit Testing

**Utilities (High Priority):**
```javascript
// Test pure functions
describe('valueToAngle', () => {
  it('converts 0 to -90°', () => {
    expect(valueToAngle(0, 0, 100)).toBe(-90);
  });

  it('converts 50 to 90°', () => {
    expect(valueToAngle(50, 0, 100)).toBe(90);
  });
});
```

**Custom Hooks:**
```javascript
// Test hook behavior
import { renderHook, act } from '@testing-library/preact-hooks';

describe('usePowerState', () => {
  it('restores last value on power on', () => {
    const { result } = renderHook(() => usePowerState(false, 75));

    act(() => {
      result.current.handlePowerToggle({ target: { checked: true }});
    });

    expect(result.current.lastSliderValue).toBe(75);
  });
});
```

### Integration Testing

**Component Interactions:**
```javascript
// Test component integration
describe('CircularSlider', () => {
  it('updates value on drag', () => {
    const onValueChange = jest.fn();
    render(<CircularSlider value={50} onValueChange={onValueChange} />);

    // Simulate drag
    fireEvent.mouseDown(screen.getByRole('slider'));
    fireEvent.mouseMove(screen.getByRole('slider'), { clientX: 200, clientY: 100 });

    expect(onValueChange).toHaveBeenCalled();
  });
});
```

### End-to-End Testing

**User Flows:**
1. Search for entity
2. Open DetailView
3. Adjust circular slider
4. Create schedule
5. View history

---

## Conclusion

The Fast Search Card uses a modular, maintainable component architecture with clear separation of concerns. The October 2025 refactoring significantly improved code quality while maintaining all functionality. The card is well-positioned for future enhancements and community contributions.